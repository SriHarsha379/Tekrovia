import {
  BadRequestException,
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
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { CreateCourseDto, validateCreateCourse } from './dto/create-course.dto';
import {
  AdminCreateCourseDto,
  AdminUpdateCourseDto,
  validateAdminCreateCourse,
  validateAdminUpdateCourse,
} from './dto/admin-course.dto';

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

  @Get('admin')
  @ApiOperation({ summary: 'List all courses for administrators' })
  adminFindAll(@Req() request: AuthenticatedRequest) {
    this.assertAdmin(request);
    return this.courseService.adminFindAll();
  }

  @Post('admin')
  @ApiOperation({ summary: 'Create a draft course (admin only)' })
  adminCreate(
    @Req() request: AuthenticatedRequest,
    @Body() dto: AdminCreateCourseDto,
  ) {
    this.assertAdmin(request);
    try {
      validateAdminCreateCourse(dto);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Invalid course data.',
      );
    }
    return this.courseService.adminCreate(dto, dto.status ?? 'DRAFT');
  }

  @Patch('admin/:id')
  @ApiOperation({ summary: 'Update a course (admin only)' })
  adminUpdate(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: AdminUpdateCourseDto,
  ) {
    this.assertAdmin(request);
    try {
      validateAdminUpdateCourse(dto);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Invalid course update.',
      );
    }
    return this.courseService.adminUpdate(id, dto);
  }

  @Patch('admin/:id/publish')
  @ApiOperation({ summary: 'Publish a course (admin only)' })
  adminPublish(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    this.assertAdmin(request);
    return this.courseService.adminPublish(id);
  }

  @Patch('admin/:id/archive')
  @ApiOperation({ summary: 'Archive a course (admin only)' })
  adminArchive(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    this.assertAdmin(request);
    return this.courseService.adminArchive(id);
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
