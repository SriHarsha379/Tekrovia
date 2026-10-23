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
import { ResourceService } from './resource.service';

interface AuthenticatedRequest {
  user: { id: string; role: string };
}

@ApiTags('lesson-resources')
@ApiBearerAuth()
@UseGuards(SessionAuthGuard)
@Controller('resources')
export class ResourceController {
  constructor(private readonly service: ResourceService) {}

  private assertStaff(request: AuthenticatedRequest) {
    if (!this.service.isStaff(request.user.role)) {
      throw new ForbiddenException('Trainer or administrator access required.');
    }
  }

  @Get('lesson/:lessonId')
  @ApiOperation({ summary: 'Labs, activities and reading for a lesson' })
  forLesson(
    @Req() request: AuthenticatedRequest,
    @Param('lessonId') lessonId: string,
  ) {
    return this.service.forLesson(request.user.id, request.user.role, lessonId);
  }

  @Post('lesson/:lessonId')
  @ApiOperation({ summary: 'Attach a resource to a lesson (staff)' })
  create(
    @Req() request: AuthenticatedRequest,
    @Param('lessonId') lessonId: string,
    @Body() body: any,
  ) {
    this.assertStaff(request);
    return this.service.create(lessonId, body);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a resource (staff)' })
  update(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    this.assertStaff(request);
    return this.service.update(id, body);
  }

  @Patch(':id/move/:direction')
  @ApiOperation({ summary: 'Move a resource up or down (staff)' })
  reorder(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Param('direction') direction: 'up' | 'down',
  ) {
    this.assertStaff(request);
    return this.service.reorder(id, direction === 'up' ? 'up' : 'down');
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a resource (staff)' })
  remove(@Req() request: AuthenticatedRequest, @Param('id') id: string) {
    this.assertStaff(request);
    return this.service.remove(id);
  }
}
