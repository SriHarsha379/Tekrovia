import {
  Body, Controller, ForbiddenException, Get,
  HttpCode, HttpStatus, Param, Patch, Req, UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { EnrollmentService } from './enrollment.service';
import { AssignBatchDto, UpdateEnrollmentDto } from './dto/enrollment.dto';

interface AuthReq { user: { id: string; role: string } }

const ADMIN = ['ADMIN', 'SUPER_ADMIN', 'TRAINER'];

@ApiTags('enrollments')
@ApiBearerAuth()
@UseGuards(SessionAuthGuard)
@Controller('enrollments')
export class EnrollmentController {
  constructor(private readonly svc: EnrollmentService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get my enrollments' })
  mine(@Req() req: AuthReq) {
    return this.svc.getMyEnrollments(req.user.id);
  }

  @Patch(':id/batch')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Assign enrollment to batch — admin only' })
  assignBatch(@Req() req: AuthReq, @Param('id') id: string, @Body() dto: AssignBatchDto) {
    if (!ADMIN.includes(req.user.role)) throw new ForbiddenException();
    return this.svc.assignBatch(id, dto);
  }

  @Patch(':id/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update enrollment status — admin only' })
  updateStatus(@Req() req: AuthReq, @Param('id') id: string, @Body() dto: UpdateEnrollmentDto) {
    if (!ADMIN.includes(req.user.role)) throw new ForbiddenException();
    return this.svc.updateStatus(id, dto);
  }

  @Get('batches/:batchId/roster')
  @ApiOperation({ summary: 'Get batch roster — trainer/admin only' })
  roster(@Req() req: AuthReq, @Param('batchId') batchId: string) {
    if (!ADMIN.includes(req.user.role)) throw new ForbiddenException();
    return this.svc.getBatchRoster(batchId);
  }
}
