import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { BatchService } from './batch.service';

interface AuthenticatedRequest {
  user: { id: string; role: string };
}

const STAFF = ['ADMIN', 'SUPER_ADMIN', 'TRAINER', 'COUNSELLOR'];

@ApiTags('batches')
@ApiBearerAuth()
@UseGuards(SessionAuthGuard)
@Controller('batches')
export class BatchController {
  constructor(private readonly service: BatchService) {}

  private assertStaff(request: AuthenticatedRequest) {
    if (!STAFF.includes(request.user.role)) {
      throw new ForbiddenException('Staff access required.');
    }
  }

  @Get('trainers')
  @ApiOperation({ summary: 'Staff who can run a batch' })
  trainers(@Req() request: AuthenticatedRequest) {
    this.assertStaff(request);
    return this.service.trainers();
  }

  @Get()
  @ApiOperation({ summary: 'List batches with status counts (staff)' })
  list(
    @Req() request: AuthenticatedRequest,
    @Query('status') status?: string,
    @Query('courseId') courseId?: string,
  ) {
    this.assertStaff(request);
    return this.service.list({ status, courseId });
  }

  @Post()
  @ApiOperation({ summary: 'Create a batch (staff)' })
  create(@Req() request: AuthenticatedRequest, @Body() body: any) {
    this.assertStaff(request);
    return this.service.create(body);
  }

  @Get(':id')
  @ApiOperation({ summary: 'One batch with its members (staff)' })
  get(@Req() request: AuthenticatedRequest, @Param('id') id: string) {
    this.assertStaff(request);
    return this.service.get(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a batch (staff)' })
  update(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    this.assertStaff(request);
    return this.service.update(id, body);
  }

  @Get(':id/candidates')
  @ApiOperation({ summary: 'Students who could join this batch (staff)' })
  candidates(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Query('search') search?: string,
  ) {
    this.assertStaff(request);
    return this.service.candidates(id, search);
  }

  @Post(':id/members')
  @ApiOperation({ summary: 'Add a student, enrolling them in the course (staff)' })
  addMember(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body('userId') userId: string,
  ) {
    this.assertStaff(request);
    return this.service.addMember(id, userId);
  }

  @Delete(':id/members/:userId')
  @ApiOperation({ summary: 'Remove a student from the batch (staff)' })
  removeMember(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Param('userId') userId: string,
  ) {
    this.assertStaff(request);
    return this.service.removeMember(id, userId);
  }
}
