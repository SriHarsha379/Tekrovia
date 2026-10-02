import {
  Controller,
  ForbiddenException,
  Get,
  Param,
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
import { AdminService } from './admin.service';

interface AuthenticatedRequest {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(SessionAuthGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  private assertAdmin(request: AuthenticatedRequest) {
    if (!['ADMIN', 'SUPER_ADMIN'].includes(request.user.role)) {
      throw new ForbiddenException('Administrator access required.');
    }
  }

  @Get('overview')
  @ApiOperation({ summary: 'Get admin dashboard overview' })
  getOverview(@Req() request: AuthenticatedRequest) {
    this.assertAdmin(request);
    return this.adminService.getOverview();
  }

  @Get('students')
  @ApiOperation({ summary: 'Search and paginate student profiles' })
  getStudents(
    @Req() request: AuthenticatedRequest,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    this.assertAdmin(request);
    return this.adminService.getStudents({ search, status, page, limit });
  }

  @Get('students/:id')
  @ApiOperation({ summary: 'Get a student profile and learning history' })
  getStudent(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    this.assertAdmin(request);
    return this.adminService.getStudent(id);
  }
}
