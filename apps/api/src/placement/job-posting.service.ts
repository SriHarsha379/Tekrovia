import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomInt } from 'crypto';
import { JobPostingStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class JobPostingService {
  constructor(private readonly prisma: PrismaService) {}

  private code() {
    return `JOB-${new Date().getFullYear()}-${randomInt(1000, 10000)}`;
  }

  async list(params: { status?: string; search?: string }) {
    const where: Prisma.JobPostingWhereInput = {};
    if (params.status && params.status !== 'ALL') {
      where.status = params.status as JobPostingStatus;
    }
    if (params.search?.trim()) {
      const term = params.search.trim();
      where.OR = [
        { companyName: { contains: term, mode: 'insensitive' } },
        { jobTitle: { contains: term, mode: 'insensitive' } },
        { postingCode: { contains: term, mode: 'insensitive' } },
      ];
    }

    const [postings, byStatus] = await Promise.all([
      this.prisma.jobPosting.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { applications: true } } },
      }),
      this.prisma.jobPosting.groupBy({ by: ['status'], _count: true }),
    ]);

    return {
      postings,
      byStatus: Object.fromEntries(byStatus.map((r) => [r.status, r._count])),
    };
  }

  async get(id: string) {
    const posting = await this.prisma.jobPosting.findUnique({
      where: { id },
      include: {
        applications: {
          orderBy: { updatedAt: 'desc' },
          include: {
            candidate: {
              select: { id: true, candidateCode: true, fullName: true, email: true },
            },
          },
        },
      },
    });
    if (!posting) throw new NotFoundException('Job posting not found.');
    return posting;
  }

  async create(data: any, userId: string) {
    if (!data.companyName?.trim()) {
      throw new BadRequestException('A company name is required.');
    }
    if (!data.jobTitle?.trim()) {
      throw new BadRequestException('A job title is required.');
    }
    const url = data.jobUrl?.trim();
    if (url && !/^https?:\/\//i.test(url)) {
      throw new BadRequestException('The job link must be a URL.');
    }

    const min = data.salaryMin !== undefined && data.salaryMin !== '' ? Number(data.salaryMin) : null;
    const max = data.salaryMax !== undefined && data.salaryMax !== '' ? Number(data.salaryMax) : null;
    if (min !== null && max !== null && max < min) {
      throw new BadRequestException('The maximum salary cannot be below the minimum.');
    }

    for (let attempt = 1; attempt <= 5; attempt += 1) {
      try {
        return await this.prisma.jobPosting.create({
          data: {
            postingCode: this.code(),
            companyName: data.companyName.trim(),
            jobTitle: data.jobTitle.trim(),
            location: data.location?.trim() || null,
            employmentType: data.employmentType?.trim() || null,
            description: data.description?.trim() || null,
            requirements: Array.isArray(data.requirements)
              ? data.requirements.map((r: string) => r.trim()).filter(Boolean)
              : [],
            minExperience: data.minExperience ? Number(data.minExperience) : null,
            salaryMin: min,
            salaryMax: max,
            jobUrl: url || null,
            source: data.source?.trim() || null,
            openings: Number(data.openings) || 1,
            closingDate: data.closingDate ? new Date(data.closingDate) : null,
            notes: data.notes?.trim() || null,
            createdByUserId: userId,
          },
        });
      } catch (error: any) {
        if (error?.code !== 'P2002' || attempt === 5) throw error;
      }
    }
    throw new Error('Unable to generate a unique posting code.');
  }

  async update(id: string, data: any) {
    const existing = await this.prisma.jobPosting.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Job posting not found.');

    return this.prisma.jobPosting.update({
      where: { id },
      data: {
        ...(data.companyName ? { companyName: String(data.companyName).trim() } : {}),
        ...(data.jobTitle ? { jobTitle: String(data.jobTitle).trim() } : {}),
        ...(data.location !== undefined ? { location: data.location || null } : {}),
        ...(data.employmentType !== undefined ? { employmentType: data.employmentType || null } : {}),
        ...(data.description !== undefined ? { description: data.description || null } : {}),
        ...(Array.isArray(data.requirements) ? { requirements: data.requirements } : {}),
        ...(data.status ? { status: data.status as JobPostingStatus } : {}),
        ...(data.openings !== undefined ? { openings: Number(data.openings) } : {}),
        ...(data.jobUrl !== undefined ? { jobUrl: data.jobUrl || null } : {}),
        ...(data.notes !== undefined ? { notes: data.notes || null } : {}),
        ...(data.closingDate !== undefined
          ? { closingDate: data.closingDate ? new Date(data.closingDate) : null } : {}),
      },
    });
  }

  async remove(id: string) {
    const used = await this.prisma.placementApplication.count({
      where: { jobPostingId: id },
    });
    if (used > 0) {
      throw new BadRequestException(
        `${used} applications point at this posting. Close it instead of deleting it.`,
      );
    }
    await this.prisma.jobPosting.delete({ where: { id } });
    return { deleted: true };
  }

  /**
   * Candidates who have been approved for placement and are not already
   * submitted to this posting. Deliberately simple: a readiness filter,
   * not a matching algorithm.
   */
  async eligibleCandidates(postingId: string) {
    const existing = await this.prisma.placementApplication.findMany({
      where: { jobPostingId: postingId },
      select: { candidateId: true },
    });

    return this.prisma.candidate.findMany({
      where: {
        id: { notIn: existing.map((a) => a.candidateId) },
        readinessReview: { decision: 'APPROVED' },
      },
      take: 50,
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true, candidateCode: true, fullName: true, email: true,
        targetRole: true, skills: true, experienceYears: true,
      },
    });
  }
}
