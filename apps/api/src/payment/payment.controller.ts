import {
  Body, Controller, ForbiddenException, Get,
  HttpCode, HttpStatus, Param, Post, Query, Req, UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { PaymentService } from './payment.service';
import { CreateOrderDto, VerifyPaymentDto } from './dto/create-order.dto';

interface AuthReq { user: { id: string; role: string } }

@ApiTags('payments')
@ApiBearerAuth()
@UseGuards(SessionAuthGuard)
@Controller('payments')
export class PaymentController {
  constructor(private readonly svc: PaymentService) {}

  @Post('order')
  @Throttle({ global: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: 'Create a Razorpay order for one or more products' })
  createOrder(@Req() req: AuthReq, @Body() dto: CreateOrderDto) {
    const candidateId = req.user.id; // resolved to candidate via service
    return this.svc.createOrder(candidateId, dto);
  }

  @Post('verify')
  @HttpCode(HttpStatus.OK)
  @Throttle({ global: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: 'Verify Razorpay payment and auto-enroll' })
  verify(@Req() req: AuthReq, @Body() dto: VerifyPaymentDto) {
    return this.svc.verifyAndCapture(req.user.id, dto);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get authenticated candidate payment history' })
  getMyPayments(@Req() req: AuthReq) {
    return this.svc.getForCandidate(req.user.id);
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
