import {
  Controller,
  ForbiddenException,
  Get,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { DeliveryService } from './delivery.service';

interface AuthenticatedRequest {
  user: { id: string; role: string };
}

const STAFF = ['ADMIN', 'SUPER_ADMIN', 'TRAINER', 'SUPPORT_STAFF'];

@ApiTags('delivery')
@ApiBearerAuth()
@UseGuards(SessionAuthGuard)
@Controller('delivery')
export class DeliveryController {
  constructor(private readonly service: DeliveryService) {}

  private assertStaff(request: AuthenticatedRequest) {
    if (!STAFF.includes(request.user.role)) {
      throw new ForbiddenException('Staff access required.');
    }
  }

  @Get('overview')
  @ApiOperation({ summary: 'Delivery headline numbers (staff)' })
  overview(@Req() request: AuthenticatedRequest) {
    this.assertStaff(request);
    return this.service.overview();
  }

  @Get('batches')
  @ApiOperation({ summary: 'Per-batch delivery health (staff)' })
  batches(@Req() request: AuthenticatedRequest) {
    this.assertStaff(request);
    return this.service.batches();
  }

  @Get('at-risk')
  @ApiOperation({ summary: 'Students who have gone quiet or are missing classes (staff)' })
  atRisk(@Req() request: AuthenticatedRequest) {
    this.assertStaff(request);
    return this.service.atRisk();
  }
}
