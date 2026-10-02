import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { CandidateService } from './candidate.service';
import { CreateCandidateDto } from './dto/create-candidate.dto';

interface AuthenticatedRequest {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

@ApiTags('candidate')
@ApiBearerAuth()
@UseGuards(SessionAuthGuard)
@Controller('candidates')
export class CandidateController {
  constructor(
    private readonly candidateService: CandidateService,
  ) {}

  private assertAdmin(request: AuthenticatedRequest) {
    if (!['ADMIN', 'SUPER_ADMIN'].includes(request.user.role)) {
      throw new ForbiddenException(
        'Administrator access required.',
      );
    }
  }

  @Post()
  @ApiOperation({
    summary: 'Create a candidate and a new user account (admin only)',
  })
  @ApiResponse({ status: 201, description: 'Candidate created' })
  create(
    @Req() request: AuthenticatedRequest,
    @Body() dto: CreateCandidateDto,
  ) {
    this.assertAdmin(request);
    return this.candidateService.create(dto);
  }

  @Post('user/:userId')
  @ApiOperation({
    summary: 'Complete onboarding for the authenticated user',
  })
  @ApiResponse({
    status: 201,
    description: 'Candidate profile created',
  })
  createForUser(
    @Req() request: AuthenticatedRequest,
    @Body() dto: CreateCandidateDto,
  ) {
    // Ignore the URL userId for authorization; use the session identity.
    return this.candidateService.createForUser(
      request.user.id,
      dto,
    );
  }

  @Get('user/:userId')
  @ApiOperation({
    summary: 'Get the authenticated user candidate profile',
  })
  findForUser(@Req() request: AuthenticatedRequest) {
    // Ignore the URL userId; users can only retrieve their own profile.
    return this.candidateService.findForUser(request.user.id);
  }

  @Get()
  @ApiOperation({
    summary: 'List candidate profiles (admin only)',
  })
  findAll(@Req() request: AuthenticatedRequest) {
    this.assertAdmin(request);
    return this.candidateService.findAll();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get candidate profile by ID (admin only)',
  })
  findOne(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    this.assertAdmin(request);
    return this.candidateService.findOne(id);
  }
}
