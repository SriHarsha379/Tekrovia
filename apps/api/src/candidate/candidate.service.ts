import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { randomInt } from 'crypto';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCandidateDto } from './dto/create-candidate.dto';

const CODE_ATTEMPTS = 5;

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    (error as { code?: unknown }).code === 'P2002'
  );
}

@Injectable()
export class CandidateService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly safeUserSelect = {
    id: true, email: true, phone: true, name: true,
    role: true, isVerified: true, isActive: true,
    createdAt: true, updatedAt: true,
  } as const;

  private generateCandidateCode(): string {
    return `TKR-${new Date().getFullYear()}-${randomInt(100000, 1000000)}`;
  }

  // Accepts data WITHOUT candidateCode — the retry loop injects it each attempt.
  private async createCandidateWithRetry(
    tx: Parameters<Parameters<typeof this.prisma.$transaction>[0]>[0],
    data: Omit<Prisma.CandidateUncheckedCreateInput, 'candidateCode'>,
  ) {
    for (let attempt = 1; attempt <= CODE_ATTEMPTS; attempt += 1) {
      try {
        return await tx.candidate.create({
          data: { ...data, candidateCode: this.generateCandidateCode() },
          include: { user: { select: this.safeUserSelect } },
        });
      } catch (error) {
        const isCodeCollision =
          isUniqueViolation(error) &&
          JSON.stringify(error).includes('candidateCode');
        if (!isCodeCollision || attempt === CODE_ATTEMPTS) throw error;
      }
    }
    throw new InternalServerErrorException('Unable to generate a unique candidate code.');
  }

  async create(dto: CreateCandidateDto) {
    const existing = await this.prisma.user.findFirst({
      where: { OR: [{ email: dto.email }, { phone: dto.phone }] },
    });
    if (existing) {
      throw new ConflictException('A user with this email or phone already exists.');
    }

    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: dto.email,
          phone: dto.phone,
          name: dto.fullName,
          role: 'STUDENT',
          isVerified: false,
        },
      });

      return this.createCandidateWithRetry(tx, {
        userId: user.id,
        fullName: dto.fullName,
        email: user.email,
        phone: dto.phone,            // use dto directly — avoids string|null widening
        education: dto.education,
        graduationYear: dto.graduationYear,
        experienceYears: dto.experienceYears ?? 0,
        skills: dto.skills ?? [],
        targetRole: dto.targetRole,
        codingPreference: dto.codingPreference,
        resumeUrl: dto.resumeUrl,
        learningAvailability: dto.learningAvailability,
        preferredSchedule: dto.preferredSchedule,
        courseInterest: dto.courseInterest,
        campaignSource: dto.campaignSource,
        utmSource: dto.utmSource,
        utmMedium: dto.utmMedium,
        utmCampaign: dto.utmCampaign,
        utmContent: dto.utmContent,
        utmTerm: dto.utmTerm,
        consentGiven: dto.consentGiven ?? false,
        communicationPrefs: dto.communicationPrefs,
      });
    });
  }

  async createForUser(userId: string, dto: CreateCandidateDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, email: true, phone: true, name: true,
        role: true, isVerified: true, isActive: true,
        createdAt: true, updatedAt: true,
      },
    });

    if (!user) throw new NotFoundException('Registered user not found.');

    if (user.email.toLowerCase() !== dto.email.toLowerCase()) {
      throw new BadRequestException('The profile email must match the registered account.');
    }
    if (user.phone !== dto.phone) {
      throw new BadRequestException('The profile phone must match the registered account.');
    }

    const existingCandidate = await this.prisma.candidate.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (existingCandidate) {
      throw new ConflictException('A candidate profile already exists for this user.');
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { name: dto.fullName },
      });

      return this.createCandidateWithRetry(tx, {
        userId,
        fullName: dto.fullName,
        email: user.email,
        phone: dto.phone,            // use dto directly — avoids string|null widening
        education: dto.education,
        graduationYear: dto.graduationYear,
        experienceYears: dto.experienceYears ?? 0,
        skills: dto.skills ?? [],
        targetRole: dto.targetRole,
        codingPreference: dto.codingPreference,
        resumeUrl: dto.resumeUrl,
        previousTraining: dto.previousTraining,
        careerGapMonths: dto.careerGapMonths ?? 0,
        learningAvailability: dto.learningAvailability,
        preferredSchedule: dto.preferredSchedule,
        courseInterest: dto.courseInterest,
        campaignSource: dto.campaignSource,
        utmSource: dto.utmSource,
        utmMedium: dto.utmMedium,
        utmCampaign: dto.utmCampaign,
        utmContent: dto.utmContent,
        utmTerm: dto.utmTerm,
        consentGiven: dto.consentGiven ?? false,
        communicationPrefs: dto.communicationPrefs,
      });
    });
  }

  async findForUser(userId: string) {
    const candidate = await this.prisma.candidate.findUnique({
      where: { userId },
      include: {
        user: { select: this.safeUserSelect },
        assessments: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true, type: true, title: true, description: true,
            score: true, maxScore: true, classification: true,
            status: true, startedAt: true, completedAt: true,
            createdAt: true, updatedAt: true,
          },
        },
        registrations: true,
      },
    });
    if (!candidate) throw new NotFoundException('Candidate profile not found');
    return candidate;
  }

  async findAll() {
    return this.prisma.candidate.findMany({
      include: { user: { select: this.safeUserSelect } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const candidate = await this.prisma.candidate.findUnique({
      where: { id },
      include: {
        user: { select: this.safeUserSelect },
        assessments: { orderBy: { createdAt: 'desc' } },
        registrations: true,
      },
    });
    if (!candidate) throw new NotFoundException('Candidate not found');
    return candidate;
  }
}
