import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { createHmac } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto, VerifyPaymentDto } from './dto/create-order.dto';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ─── Create Razorpay order ────────────────────────────────────────────────
  async createOrder(candidateId: string, dto: CreateOrderDto) {
    const candidate = await this.prisma.candidate.findUnique({
      where: { id: candidateId },
      select: { id: true, email: true, fullName: true },
    });
    if (!candidate) throw new NotFoundException('Candidate not found.');

    // Resolve active prices for each requested product
    const products = await this.prisma.product.findMany({
      where: { code: { in: dto.products }, isActive: true },
    });

    if (products.length !== dto.products.length) {
      throw new BadRequestException('One or more products are unavailable.');
    }

    // Check no product is already enrolled
    const existing = await this.prisma.enrollment.findFirst({
      where: {
        candidateId,
        productId: { in: products.map((p) => p.id) },
        status: { in: ['ACTIVE', 'PAUSED'] },
      },
    });
    if (existing) {
      throw new BadRequestException('Candidate is already enrolled in one of these products.');
    }

    // Fetch current active prices
    const priceList = await this.prisma.priceList.findMany({
      where: {
        productId: { in: products.map((p) => p.id) },
        validUntil: null,
      },
    });

    const total = priceList.reduce((sum, p) => sum + Number(p.amount), 0);

    // Create pending payment record
    const payment = await this.prisma.payment.create({
      data: {
        candidateId,
        amount: total,
        currency: dto.currency ?? 'INR',
        status: 'CREATED',
        items: {
          create: priceList.map((pl) => ({
            productId: pl.productId,
            priceAtPurchase: pl.amount,
          })),
        },
      },
      include: { items: true },
    });

    // In production: call Razorpay API here to create an order and store razorpayOrderId
    // const rzpOrder = await razorpay.orders.create({ amount: total * 100, currency: 'INR', receipt: payment.id });
    // await this.prisma.payment.update({ where: { id: payment.id }, data: { razorpayOrderId: rzpOrder.id } });

    this.logger.log(`Order created: payment=${payment.id} candidate=${candidateId} amount=${total}`);

    return {
      paymentId: payment.id,
      amount: total,
      currency: payment.currency,
      items: payment.items,
      // razorpayOrderId: rzpOrder.id  ← add when Razorpay is wired
    };
  }

  // ─── Verify Razorpay webhook / return callback ────────────────────────────
  async verifyAndCapture(candidateId: string, dto: VerifyPaymentDto) {
    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) throw new BadRequestException('Payment provider not configured.');

    // HMAC-SHA256 verification — signature must match before any DB write
    const body = `${dto.razorpayOrderId}|${dto.razorpayPaymentId}`;
    const expected = createHmac('sha256', secret).update(body).digest('hex');

    // Constant-time compare
    const isValid =
      expected.length === dto.razorpaySignature.length &&
      Buffer.from(expected).equals(Buffer.from(dto.razorpaySignature));

    if (!isValid) {
      this.logger.warn(`Invalid Razorpay signature for order ${dto.razorpayOrderId}`);
      throw new BadRequestException('Payment verification failed.');
    }

    const payment = await this.prisma.payment.findFirst({
      where: { razorpayOrderId: dto.razorpayOrderId, candidateId },
      include: { items: true },
    });

    if (!payment) throw new NotFoundException('Payment record not found.');
    if (payment.status === 'PAID') return { alreadyCaptured: true };

    // Mark paid + log event (signature NOT stored)
    await this.prisma.$transaction([
      this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'PAID',
          razorpayPaymentId: dto.razorpayPaymentId,
          paidAt: new Date(),
        },
      }),
      this.prisma.paymentEvent.create({
        data: {
          paymentId: payment.id,
          eventType: 'payment.captured',
          razorpayEvent: {
            orderId: dto.razorpayOrderId,
            paymentId: dto.razorpayPaymentId,
          },
        },
      }),
    ]);

    // Auto-enroll in each purchased product
    for (const item of payment.items) {
      await this.prisma.enrollment.upsert({
        where: { candidateId_productId: { candidateId, productId: item.productId } },
        update: { status: 'ACTIVE', paymentId: payment.id },
        create: { candidateId, productId: item.productId, paymentId: payment.id, status: 'ACTIVE' },
      });
    }

    this.logger.log(`Payment captured: ${payment.id}`);
    return { captured: true, paymentId: payment.id };
  }

  // ─── Candidate: view their own payment history ────────────────────────────
  async getForCandidate(candidateId: string) {
    return this.prisma.payment.findMany({
      where: { candidateId },
      include: {
        items: { include: { product: { select: { code: true, name: true } } } },
        paymentEvents: { orderBy: { processedAt: 'desc' }, take: 5 },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ─── Admin: paginated list ────────────────────────────────────────────────
  async findAll(page = 1, status?: string) {
    const take = 20;
    const skip = (Math.max(1, page) - 1) * take;
    const where = status ? { status: status as any } : {};
    const [items, total] = await this.prisma.$transaction([
      this.prisma.payment.findMany({
        where,
        skip,
        take,
        include: { candidate: { select: { candidateCode: true, fullName: true, email: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.payment.count({ where }),
    ]);
    return { data: items, meta: { total, page, take, totalPages: Math.ceil(total / take) } };
  }
}
