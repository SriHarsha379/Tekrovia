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
import { JobPostingService } from './job-posting.service';

interface AuthenticatedRequest {
  user: { id: string; role: string };
}

const PLACEMENT = ['ADMIN', 'SUPER_ADMIN', 'PLACEMENT_MANAGER'];

@ApiTags('job-postings')
@ApiBearerAuth()
@UseGuards(SessionAuthGuard)
@Controller('job-postings')
export class JobPostingController {
  constructor(private readonly service: JobPostingService) {}

  private assertPlacement(request: AuthenticatedRequest) {
    if (!PLACEMENT.includes(request.user.role)) {
      throw new ForbiddenException('Placement management access required.');
    }
  }

  @Get()
  @ApiOperation({ summary: 'List job postings with status counts' })
  list(
    @Req() request: AuthenticatedRequest,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    this.assertPlacement(request);
    return this.service.list({ status, search });
  }

  @Post()
  @ApiOperation({ summary: 'Create a job posting' })
  create(@Req() request: AuthenticatedRequest, @Body() body: any) {
    this.assertPlacement(request);
    return this.service.create(body, request.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'One posting with its submitted candidates' })
  get(@Req() request: AuthenticatedRequest, @Param('id') id: string) {
    this.assertPlacement(request);
    return this.service.get(id);
  }

  @Get(':id/eligible')
  @ApiOperation({ summary: 'Placement-approved candidates not yet submitted' })
  eligible(@Req() request: AuthenticatedRequest, @Param('id') id: string) {
    this.assertPlacement(request);
    return this.service.eligibleCandidates(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a job posting' })
  update(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    this.assertPlacement(request);
    return this.service.update(id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a posting with no applications' })
  remove(@Req() request: AuthenticatedRequest, @Param('id') id: string) {
    this.assertPlacement(request);
    return this.service.remove(id);
  }
}
