import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { CheckpointService } from './checkpoint.service';

interface AuthenticatedRequest {
  user: { id: string; email: string; name: string; role: string };
}

@ApiTags('checkpoints')
@ApiBearerAuth()
@UseGuards(SessionAuthGuard)
@Controller('checkpoints')
export class CheckpointController {
  constructor(private readonly checkpointService: CheckpointService) {}

  @Get('courses/:courseId')
  @ApiOperation({
    summary: 'List checkpoints for an enrolled course with your progress',
  })
  listForCourse(
    @Req() request: AuthenticatedRequest,
    @Param('courseId') courseId: string,
  ) {
    return this.checkpointService.listForCourse(request.user.id, courseId);
  }

  @Post(':id/attempts')
  @ApiOperation({
    summary: 'Start a checkpoint attempt and receive shuffled questions',
  })
  startAttempt(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.checkpointService.startAttempt(request.user.id, id);
  }

  @Post('attempts/:attemptId/submit')
  @ApiOperation({
    summary: 'Submit answers; scoring happens on the server',
  })
  submitAttempt(
    @Req() request: AuthenticatedRequest,
    @Param('attemptId') attemptId: string,
    @Body('answers') answers: unknown,
  ) {
    return this.checkpointService.submitAttempt(
      request.user.id,
      attemptId,
      answers,
    );
  }
}
