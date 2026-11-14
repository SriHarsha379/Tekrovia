import {
  Body, Controller, ForbiddenException, Get,
  HttpCode, HttpStatus, Param, Patch, Post, Query, Req, UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { SupportService } from './support.service';
import { AddCommentDto, CreateTicketDto, UpdateTicketStatusDto } from './dto/support.dto';

interface AuthReq { user: { id: string; role: string } }

const STAFF = ['ADMIN', 'SUPER_ADMIN', 'SUPPORT', 'TRAINER'];

@ApiTags('support')
@ApiBearerAuth()
@UseGuards(SessionAuthGuard)
@Controller('support')
export class SupportController {
  constructor(private readonly svc: SupportService) {}

  @Post('tickets')
  @ApiOperation({ summary: 'Create a support ticket' })
  create(@Req() req: AuthReq, @Body() dto: CreateTicketDto) {
    return this.svc.createTicket(req.user.id, dto);
  }

  @Get('tickets/me')
  @ApiOperation({ summary: 'List my tickets' })
  listMine(@Req() req: AuthReq, @Query('page') page?: string) {
    return this.svc.listMine(req.user.id, page ? parseInt(page, 10) : 1);
  }

  @Get('tickets')
  @ApiOperation({ summary: 'List all tickets — staff only' })
  listAll(
    @Req() req: AuthReq,
    @Query('page') page?: string,
    @Query('status') status?: string,
  ) {
    if (!STAFF.includes(req.user.role)) throw new ForbiddenException();
    return this.svc.listAll(page ? parseInt(page, 10) : 1, status);
  }

  @Post('tickets/:id/comments')
  @ApiOperation({ summary: 'Add comment to ticket' })
  addComment(
    @Req() req: AuthReq,
    @Param('id') ticketId: string,
    @Body() dto: AddCommentDto,
  ) {
    const isStaff = STAFF.includes(req.user.role);
    return this.svc.addComment(ticketId, req.user.id, isStaff, dto);
  }

  @Patch('tickets/:id/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update ticket status — staff only' })
  updateStatus(
    @Req() req: AuthReq,
    @Param('id') ticketId: string,
    @Body() dto: UpdateTicketStatusDto,
  ) {
    if (!STAFF.includes(req.user.role)) throw new ForbiddenException();
    return this.svc.updateStatus(ticketId, dto);
  }
}
