import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AddCommentDto, CreateTicketDto, UpdateTicketStatusDto } from './dto/support.dto';

@Injectable()
export class SupportService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Create ticket (candidate) ────────────────────────────────────────────
  async createTicket(candidateId: string, dto: CreateTicketDto) {
    return this.prisma.supportTicket.create({
      data: {
        candidateId,
        category: dto.category,
        subject: dto.subject,
        description: dto.description,
        // Auto-set SLA: 48h for most categories, 24h for payment
        slaDueAt: new Date(
          Date.now() +
            (dto.category === 'PAYMENT' ? 24 : 48) * 60 * 60 * 1000,
        ),
      },
    });
  }

  // ─── List tickets ─────────────────────────────────────────────────────────
  async listMine(candidateId: string, page = 1) {
    const take = 20;
    const skip = (Math.max(1, page) - 1) * take;
    const [items, total] = await this.prisma.$transaction([
      this.prisma.supportTicket.findMany({
        where: { candidateId },
        skip,
        take,
        include: { comments: { orderBy: { createdAt: 'asc' } } },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.supportTicket.count({ where: { candidateId } }),
    ]);
    return { data: items, meta: { total, page, take, totalPages: Math.ceil(total / take) } };
  }

  async listAll(page = 1, status?: string) {
    const take = 20;
    const skip = (Math.max(1, page) - 1) * take;
    const where = status ? { status: status as any } : {};
    const [items, total] = await this.prisma.$transaction([
      this.prisma.supportTicket.findMany({
        where,
        skip,
        take,
        include: {
          candidate: { select: { candidateCode: true, fullName: true } },
          assignedTo: { select: { name: true, role: true } },
          comments: { orderBy: { createdAt: 'asc' } },
        },
        orderBy: [{ status: 'asc' }, { slaDueAt: 'asc' }],
      }),
      this.prisma.supportTicket.count({ where }),
    ]);
    return { data: items, meta: { total, page, take, totalPages: Math.ceil(total / take) } };
  }

  // ─── Add comment ──────────────────────────────────────────────────────────
  async addComment(
    ticketId: string,
    callerId: string,
    callerIsStaff: boolean,
    dto: AddCommentDto,
  ) {
    const ticket = await this.prisma.supportTicket.findUnique({ where: { id: ticketId } });
    if (!ticket) throw new NotFoundException('Ticket not found.');

    // Candidates can only comment on their own tickets
    if (!callerIsStaff && ticket.candidateId !== callerId) {
      throw new ForbiddenException('Access denied.');
    }

    return this.prisma.ticketComment.create({
      data: {
        ticketId,
        message: dto.message,
        ...(callerIsStaff
          ? { authorUserId: callerId }
          : { authorCandidateId: callerId }),
      },
    });
  }

  // ─── Update status (staff) ────────────────────────────────────────────────
  async updateStatus(ticketId: string, dto: UpdateTicketStatusDto) {
    const ticket = await this.prisma.supportTicket.findUnique({ where: { id: ticketId } });
    if (!ticket) throw new NotFoundException('Ticket not found.');

    return this.prisma.supportTicket.update({
      where: { id: ticketId },
      data: {
        status: dto.status,
        assignedToId: dto.assignedToId,
        resolvedAt: dto.status === 'RESOLVED' ? new Date() : undefined,
      },
    });
  }
}
