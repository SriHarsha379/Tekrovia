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
import {
  CheckpointAdminService,
  CheckpointInput,
  QuestionInput,
} from './checkpoint-admin.service';

interface AuthenticatedRequest {
  user: { id: string; role: string };
}

@ApiTags('checkpoints-admin')
@ApiBearerAuth()
@UseGuards(SessionAuthGuard)
@Controller('checkpoints/admin')
export class CheckpointAdminController {
  constructor(private readonly service: CheckpointAdminService) {}

  private assertAdmin(request: AuthenticatedRequest) {
    if (!['ADMIN', 'SUPER_ADMIN'].includes(request.user.role)) {
      throw new ForbiddenException('Administrator access required.');
    }
  }

  @Get('courses/:courseId')
  @ApiOperation({ summary: 'List checkpoints with questions and answers (admin)' })
  list(@Req() req: AuthenticatedRequest, @Param('courseId') courseId: string) {
    this.assertAdmin(req);
    return this.service.listForCourse(courseId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a checkpoint (admin)' })
  create(@Req() req: AuthenticatedRequest, @Body() body: CheckpointInput) {
    this.assertAdmin(req);
    return this.service.create(body);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update or publish a checkpoint (admin)' })
  update(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: Partial<CheckpointInput>,
  ) {
    this.assertAdmin(req);
    return this.service.update(id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an unattempted checkpoint (admin)' })
  remove(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    this.assertAdmin(req);
    return this.service.remove(id);
  }

  @Get(':id/lessons')
  @ApiOperation({ summary: 'Lessons a question can point back to (admin)' })
  lessons(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    this.assertAdmin(req);
    return this.service.lessonsInRange(id);
  }

  @Post(':id/questions')
  @ApiOperation({ summary: 'Add a question (admin)' })
  addQuestion(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: QuestionInput,
  ) {
    this.assertAdmin(req);
    return this.service.addQuestion(id, body);
  }

  @Patch('questions/:questionId')
  @ApiOperation({ summary: 'Update a question (admin)' })
  updateQuestion(
    @Req() req: AuthenticatedRequest,
    @Param('questionId') questionId: string,
    @Body() body: QuestionInput,
  ) {
    this.assertAdmin(req);
    return this.service.updateQuestion(questionId, body);
  }

  @Delete('questions/:questionId')
  @ApiOperation({ summary: 'Delete a question (admin)' })
  removeQuestion(
    @Req() req: AuthenticatedRequest,
    @Param('questionId') questionId: string,
  ) {
    this.assertAdmin(req);
    return this.service.removeQuestion(questionId);
  }
}
