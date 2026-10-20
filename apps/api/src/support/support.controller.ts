import {
  Body,
  Controller,
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
import { SupportService } from './support.service';

interface AuthenticatedRequest {
  user: { id: string; role: string };
}

@ApiTags('support')
@ApiBearerAuth()
@UseGuards(SessionAuthGuard)
@Controller('support')
export class SupportController {
  constructor(private readonly service: SupportService) {}

  private assertStaff(request: AuthenticatedRequest) {
    if (!this.service.isStaff(request.user.role)) {
      throw new ForbiddenException('Support staff access required.');
    }
  }

  // ---- staff routes first, so 'queue' and 'agents' are not read as ids ----

  @Get('queue')
  @ApiOperation({ summary: 'The support queue with status counts (staff)' })
  queue(
    @Req() request: AuthenticatedRequest,
    @Query('status') status?: string,
    @Query('category') category?: string,
    @Query('ownerId') ownerId?: string,
    @Query('overdue') overdue?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
  ) {
    this.assertStaff(request);
    return this.service.queue({ status, category, ownerId, overdue, search, page });
  }

  @Get('agents')
  @ApiOperation({ summary: 'Staff who can own a ticket' })
  agents(@Req() request: AuthenticatedRequest) {
    this.assertStaff(request);
    return this.service.agents();
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update status, priority, category or owner (staff)' })
  update(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: { status?: string; priority?: string; category?: string; ownerId?: string | null },
  ) {
    this.assertStaff(request);
    return this.service.update(id, body);
  }

  // ---- student routes ----

  @Get('mine')
  @ApiOperation({ summary: 'The tickets you raised' })
  mine(@Req() request: AuthenticatedRequest) {
    return this.service.mine(request.user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Raise a support ticket' })
  create(
    @Req() request: AuthenticatedRequest,
    @Body() body: {
      subject: string; body: string; category?: string;
      priority?: string; courseId?: string; lessonId?: string;
    },
  ) {
    return this.service.create(request.user.id, body);
  }

  @Get(':id')
  @ApiOperation({ summary: 'One ticket with its conversation' })
  get(@Req() request: AuthenticatedRequest, @Param('id') id: string) {
    return this.service.get(request.user.id, request.user.role, id);
  }

  @Post(':id/comments')
  @ApiOperation({ summary: 'Reply on a ticket' })
  comment(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: { body: string; isInternal?: boolean },
  ) {
    return this.service.comment(
      request.user.id, request.user.role, id, body.body, Boolean(body.isInternal),
    );
  }
}
