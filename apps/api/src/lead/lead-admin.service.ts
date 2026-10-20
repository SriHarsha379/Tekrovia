import { Injectable, NotFoundException } from '@nestjs/common';
import { LeadStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LeadAdminService {
  constructor(private readonly prisma: PrismaService) {}

  async list(params: {
    search?: string;
    status?: string;
    page?: string;
    limit?: string;
  }) {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(params.limit) || 25));

    const where: Prisma.LeadWhereInput = {};

    if (params.status && params.status !== 'ALL') {
      where.status = params.status as LeadStatus;
    }

    if (params.search?.trim()) {
      const term = params.search.trim();
      where.OR = [
        { name: { contains: term, mode: 'insensitive' } },
        { email: { contains: term, mode: 'insensitive' } },
        { phone: { contains: term } },
        { leadCode: { contains: term, mode: 'insensitive' } },
      ];
    }

    const [leads, total, counts] = await Promise.all([
      this.prisma.lead.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          owner: { select: { id: true, name: true } },
          candidate: { select: { id: true, candidateCode: true } },
        },
      }),
      this.prisma.lead.count({ where }),
      this.prisma.lead.groupBy({ by: ['status'], _count: true }),
    ]);

    return {
      leads,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
      byStatus: Object.fromEntries(
        counts.map((row) => [row.status, row._count]),
      ),
    };
  }

  async get(id: string) {
    const lead = await this.prisma.lead.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        candidate: { select: { id: true, candidateCode: true, fullName: true } },
      },
    });
    if (!lead) throw new NotFoundException('Lead not found.');
    return lead;
  }

  async update(
    id: string,
    data: { status?: string; notes?: string; ownerId?: string | null },
  ) {
    const existing = await this.prisma.lead.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Lead not found.');

    return this.prisma.lead.update({
      where: { id },
      data: {
        ...(data.status ? { status: data.status as LeadStatus } : {}),
        ...(data.notes !== undefined ? { notes: data.notes || null } : {}),
        ...(data.ownerId !== undefined ? { ownerId: data.ownerId || null } : {}),
      },
      include: { owner: { select: { id: true, name: true } } },
    });
  }

  async owners() {
    return this.prisma.user.findMany({
      where: {
        isActive: true,
        role: { in: ['COUNSELLOR', 'ADMIN', 'SUPER_ADMIN', 'SUPPORT_STAFF'] },
      },
      select: { id: true, name: true, role: true },
      orderBy: { name: 'asc' },
    });
  }
}
