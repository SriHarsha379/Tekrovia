import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { LearningService } from './learning.service';
import { UpdateProgressDto } from './dto/progress.dto';
import { SubmitAttemptDto } from './dto/submit-attempt.dto';

@ApiTags('learning')
@UseGuards(SessionAuthGuard)
@Controller('learning')
export class LearningController {
  constructor(private readonly learning: LearningService) {}

  @Get('courses/:courseId/tree')
  tree(@Req() req: any, @Param('courseId') courseId: string) {
    return this.learning.courseTree(req.user.id, courseId);
  }

  @Patch('lessons/:lessonId/progress')
  progress(
    @Req() req: any,
    @Param('lessonId') lessonId: string,
    @Body() dto: UpdateProgressDto,
  ) {
    return this.learning.updateProgress(req.user.id, lessonId, dto);
  }

  @Post('checkpoints/:checkpointId/attempts')
  start(@Req() req: any, @Param('checkpointId') checkpointId: string) {
    return this.learning.startAttempt(req.user.id, checkpointId);
  }

  @Post('attempts/:attemptId/submit')
  submit(
    @Req() req: any,
    @Param('attemptId') attemptId: string,
    @Body() dto: SubmitAttemptDto,
  ) {
    return this.learning.submitAttempt(req.user.id, attemptId, dto);
  }
}
