import {
  Body, Controller, ForbiddenException, Get,
  HttpCode, HttpStatus, NotFoundException, Param, Post, Query, Req, UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { PaymentService } from './payment.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto, VerifyPaymentDto } from './dto/create-order.dto';

interface AuthReq { user: { id: string; role: string } }

@ApiTags('payments')
@ApiBearerAuth()
@UseGuards(SessionAuthGuard)
@Controller('payments')
export class PaymentController {
  constructor(
    private readonly svc: PaymentService,
    private readonly prisma: PrismaService,
  ) {}

  /** Resolve the candidate record for the authenticated user. */
  private async candidateId(userId: string): Promise<string> {
    const candidate = await this.prisma.candidate.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!candidate) throw new NotFoundException('Complete your candidate profile first.');
    return candidate.id;
  }

  @Post('order')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: 'Create a Razorpay order for one or more products' })
  async createOrder(@Req() req: AuthReq, @Body() dto: CreateOrderDto) {
    return this.svc.createOrder(await this.candidateId(req.user.id), dto);
  }

  @Post('verify')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: 'Verify Razorpay payment and auto-enroll' })
  async verify(@Req() req: AuthReq, @Body() dto: VerifyPaymentDto) {
    return this.svc.verifyAndCapture(await this.candidateId(req.user.id), dto);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get authenticated candidate payment history' })
  async getMyPayments(@Req() req: AuthReq) {
    return this.svc.getForCandidate(await this.candidateId(req.user.id));
  }

  @Get()
  @ApiOperation({ summary: 'List all payments — admin only' })
  findAll(
    @Req() req: AuthReq,
    @Query('page') page?: string,
    @Query('status') status?: string,
  ) {
    if (!['ADMIN', 'SUPER_ADMIN'].includes(req.user.role)) {
      throw new ForbiddenException('Admin access required.');
    }
    return this.svc.findAll(page ? parseInt(page, 10) : 1, status);
  }
}
