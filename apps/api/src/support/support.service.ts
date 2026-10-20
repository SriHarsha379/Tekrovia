import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomInt } from 'crypto';
import {
  Prisma,
  TicketCategory,
  TicketPriority,
  TicketStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const STAFF = ['ADMIN', 'SUPER_ADMIN', 'SUPPORT_STAFF', 'COUNSELLOR', 'TRAINER'];

/** Hours allowed before a ticket is overdue, by priority. */
const SLA_HOURS: Record<TicketPriority, number> = {
  URGENT: 4,
  HIGH: 12,
  NORMAL: 24,
  LOW: 72,
};

@Injectable()
export class SupportService {
  constructor(private readonly prisma: PrismaService) {}

  isStaff(role: string) {
    return STAFF.includes(role);
  }

  private code() {
    return `TKT-${new Date().getFullYear()}-${randomInt(100000, 1000000)}`;
  }

  async create(
    userId: string,
    data: {
      subject: string;
      body: string;
      category?: string;
      priority?: string;
      courseId?: string;
      lessonId?: string;
    },
  ) {
    const subject = data.subject?.trim();
    const body = data.body?.trim();
    if (!subject) throw new BadRequestException('A subject is required.');
    if (!body) throw new BadRequestException('Please describe the problem.');

    const priority = (data.priority as TicketPriority) ?? TicketPriority.NORMAL;
    const dueAt = new Date(Date.now() + SLA_HOURS[priority] * 3600_000);

    for (let attempt = 1; attempt <= 5; attempt += 1) {
      try {
        return await this.prisma.supportTicket.create({
          data: {
            ticketCode: this.code(),
            userId,
            subject,
            body,
            category: (data.category as TicketCategory) ?? TicketCategory.OTHER,
            priority,
            courseId: data.courseId || null,
            lessonId: data.lessonId || null,
            dueAt,
          },
        });
      } catch (error: any) {
        if (error?.code !== 'P2002' || attempt === 5) throw error;
      }
    }
    throw new Error('Unable to generate a unique ticket code.');
  }

  /** A student's own tickets. */
  async mine(userId: string) {
    return this.prisma.supportTicket.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      include: {
        owner: { select: { id: true, name: true } },
        _count: { select: { comments: true } },
      },
    });
  }

  async get(userId: string, role: string, id: string) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true } },
        owner: { select: { id: true, name: true } },
        comments: {
          orderBy: { createdAt: 'asc' },
          include: { author: { select: { id: true, name: true, role: true } } },
        },
      },
    });
    if (!ticket) throw new NotFoundException('Ticket not found.');

    const staff = this.isStaff(role);
    if (!staff && ticket.userId !== userId) {
      throw new ForbiddenException('This ticket belongs to someone else.');
    }

    return {
      ...ticket,
      // Internal notes never leave the staff side.
      comments: staff
        ? ticket.comments
        : ticket.comments.filter((c) => !c.isInternal),
    };
  }

  async comment(
    userId: string,
    role: string,
    ticketId: string,
    body: string,
    isInternal = false,
  ) {
    const text = body?.trim();
    if (!text) throw new BadRequestException('A comment cannot be empty.');

    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
      select: { id: true, userId: true, status: true, firstResponseAt: true },
    });
    if (!ticket) throw new NotFoundException('Ticket not found.');

    const staff = this.isStaff(role);
    if (!staff && ticket.userId !== userId) {
      throw new ForbiddenException('This ticket belongs to someone else.');
    }
    if (!staff && isInternal) {
      throw new ForbiddenException('Only staff can add internal notes.');
    }

    const comment = await this.prisma.ticketComment.create({
      data: { ticketId, authorId: userId, body: text, isInternal },
      include: { author: { select: { id: true, name: true, role: true } } },
    });

    // The first staff reply stops the response clock; a student reply on a
    // waiting ticket puts it back in the queue.
    const patch: Prisma.SupportTicketUpdateInput = {};
    if (staff && !isInternal && !ticket.firstResponseAt) {
      patch.firstResponseAt = new Date();
      if (ticket.status === TicketStatus.OPEN) {
        patch.status = TicketStatus.IN_PROGRESS;
      }
    }
    if (!staff && ticket.status === TicketStatus.WAITING_ON_STUDENT) {
      patch.status = TicketStatus.IN_PROGRESS;
    }
    if (Object.keys(patch).length) {
      await this.prisma.supportTicket.update({ where: { id: ticketId }, data: patch });
    }

    return comment;
  }

  // ---- staff ----

  async queue(params: {
    status?: string;
    category?: string;
    ownerId?: string;
    overdue?: string;
    search?: string;
    page?: string;
  }) {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = 25;
    const where: Prisma.SupportTicketWhereInput = {};

    if (params.status && params.status !== 'ALL') {
      where.status = params.status as TicketStatus;
    }
    if (params.category && params.category !== 'ALL') {
      where.category = params.category as TicketCategory;
    }
    if (params.ownerId === 'UNASSIGNED') where.ownerId = null;
    else if (params.ownerId) where.ownerId = params.ownerId;

    if (params.overdue === 'true') {
      where.dueAt = { lt: new Date() };
      where.status = { notIn: [TicketStatus.RESOLVED, TicketStatus.CLOSED] };
    }
    if (params.search?.trim()) {
      const term = params.search.trim();
      where.OR = [
        { subject: { contains: term, mode: 'insensitive' } },
        { ticketCode: { contains: term, mode: 'insensitive' } },
        { user: { email: { contains: term, mode: 'insensitive' } } },
        { user: { name: { contains: term, mode: 'insensitive' } } },
      ];
    }

    const [tickets, total, byStatus, overdue] = await Promise.all([
      this.prisma.supportTicket.findMany({
        where,
        orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: { select: { id: true, name: true, email: true } },
          owner: { select: { id: true, name: true } },
          _count: { select: { comments: true } },
        },
      }),
      this.prisma.supportTicket.count({ where }),
      this.prisma.supportTicket.groupBy({ by: ['status'], _count: true }),
      this.prisma.supportTicket.count({
        where: {
          dueAt: { lt: new Date() },
          status: { notIn: [TicketStatus.RESOLVED, TicketStatus.CLOSED] },
        },
      }),
    ]);

    return {
      tickets,
      total,
      page,
      pages: Math.ceil(total / limit),
      byStatus: Object.fromEntries(byStatus.map((r) => [r.status, r._count])),
      overdue,
    };
  }

  async update(
    id: string,
    data: {
      status?: string;
      priority?: string;
      category?: string;
      ownerId?: string | null;
    },
  ) {
    const ticket = await this.prisma.supportTicket.findUnique({ where: { id } });
    if (!ticket) throw new NotFoundException('Ticket not found.');

    const patch: Prisma.SupportTicketUpdateInput = {};
    if (data.status) {
      patch.status = data.status as TicketStatus;
      const closing =
        data.status === TicketStatus.RESOLVED || data.status === TicketStatus.CLOSED;
      patch.resolvedAt = closing ? ticket.resolvedAt ?? new Date() : null;
    }
    if (data.priority) {
      patch.priority = data.priority as TicketPriority;
      // Re-prioritising moves the deadline with it.
      patch.dueAt = new Date(
        ticket.createdAt.getTime() +
          SLA_HOURS[data.priority as TicketPriority] * 3600_000,
      );
    }
    if (data.category) patch.category = data.category as TicketCategory;
    if (data.ownerId !== undefined) {
      patch.owner = data.ownerId
        ? { connect: { id: data.ownerId } }
        : { disconnect: true };
    }

    return this.prisma.supportTicket.update({
      where: { id },
      data: patch,
      include: { owner: { select: { id: true, name: true } } },
    });
  }

  async agents() {
    return this.prisma.user.findMany({
      where: { isActive: true, role: { in: STAFF as any } },
      select: { id: true, name: true, role: true },
      orderBy: { name: 'asc' },
    });
  }
}
