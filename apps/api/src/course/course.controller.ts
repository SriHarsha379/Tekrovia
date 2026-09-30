import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { CreateCourseDto, validateCreateCourse } from './dto/create-course.dto';
import { CourseService } from './course.service';

interface AuthenticatedRequest {
  user: {
    id: string;
    role: string;
  };
}

@ApiTags('courses')
@ApiBearerAuth()
@UseGuards(SessionAuthGuard)
@Controller('courses')
export class CourseController {
  constructor(private readonly courseService: CourseService) {}

  private assertAdmin(request: AuthenticatedRequest) {
    if (!['ADMIN', 'SUPER_ADMIN'].includes(request.user.role)) {
      throw new ForbiddenException('Administrator access required.');
    }
  }

  @Get()
  @ApiOperation({ summary: 'List published courses' })
  findAll(
    @Query('category') category?: string,
    @Query('level') level?: string,
  ) {
    return this.courseService.findAll({ category, level });
  }

  @Get('my/enrollments')
  @ApiOperation({ summary: 'List the authenticated student enrollments' })
  myEnrollments(@Req() request: AuthenticatedRequest) {
    return this.courseService.myEnrollments(request.user.id);
  }

  @Get('my/progress')
  @ApiOperation({ summary: 'Get the authenticated student learning progress' })
  myProgress(@Req() request: AuthenticatedRequest) {
    return this.courseService.myProgress(request.user.id);
  }

  @Post('lessons/:lessonId/complete')
  @ApiOperation({ summary: 'Mark an enrolled course lesson complete' })
  completeLesson(
    @Req() request: AuthenticatedRequest,
    @Param('lessonId') lessonId: string,
  ) {
    return this.courseService.completeLesson(request.user.id, lessonId);
  }

  @Post(':id/enroll')
  @ApiOperation({ summary: 'Enroll the authenticated student in a course' })
  enroll(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.courseService.enroll(request.user.id, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create and publish a course (admin only)' })
  create(
    @Req() request: AuthenticatedRequest,
    @Body() dto: CreateCourseDto,
  ) {
    this.assertAdmin(request);
    try {
      validateCreateCourse(dto);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Invalid course data.',
      );
    }
    return this.courseService.create(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a published course and its curriculum' })
  findOne(@Param('id') id: string) {
    return this.courseService.findOne(id);
  }
}
