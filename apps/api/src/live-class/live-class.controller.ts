import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { LiveClassService } from './live-class.service';

interface AuthenticatedRequest {
  user: { id: string; role: string };
}

@ApiTags('live-classes')
@ApiBearerAuth()
@UseGuards(SessionAuthGuard)
@Controller('classes')
export class LiveClassController {
  constructor(private readonly service: LiveClassService) {}

  private assertStaff(request: AuthenticatedRequest) {
    if (!this.service.isStaff(request.user.role)) {
      throw new ForbiddenException('Trainer or administrator access required.');
    }
  }

  // ---- student routes, declared before ':id' ----

  @Get('mine')
  @ApiOperation({ summary: 'Your upcoming and recent classes' })
  mine(@Req() request: AuthenticatedRequest) {
    return this.service.mine(request.user.id);
  }

  @Get('mine/attendance')
  @ApiOperation({ summary: 'Your attendance rate' })
  myAttendance(@Req() request: AuthenticatedRequest) {
    return this.service.myAttendanceSummary(request.user.id);
  }

  // ---- staff ----

  @Get('batch/:batchId')
  @ApiOperation({ summary: 'Classes scheduled for a batch (staff)' })
  forBatch(@Req() request: AuthenticatedRequest, @Param('batchId') batchId: string) {
    this.assertStaff(request);
    return this.service.forBatch(batchId);
  }

  @Post()
  @ApiOperation({ summary: 'Schedule a class (staff)' })
  create(@Req() request: AuthenticatedRequest, @Body() body: any) {
    this.assertStaff(request);
    return this.service.create(body);
  }

  @Get(':id/register')
  @ApiOperation({ summary: 'The attendance register for a class (staff)' })
  register(@Req() request: AuthenticatedRequest, @Param('id') id: string) {
    this.assertStaff(request);
    return this.service.register(id);
  }

  @Post(':id/attendance')
  @ApiOperation({ summary: 'Mark attendance, completing the class (staff)' })
  mark(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body('entries') entries: { userId: string; status: string; note?: string }[],
  ) {
    this.assertStaff(request);
    return this.service.mark(id, entries);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a class (staff)' })
  update(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    this.assertStaff(request);
    return this.service.update(id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a class with no attendance recorded (staff)' })
  remove(@Req() request: AuthenticatedRequest, @Param('id') id: string) {
    this.assertStaff(request);
    return this.service.remove(id);
  }
}
