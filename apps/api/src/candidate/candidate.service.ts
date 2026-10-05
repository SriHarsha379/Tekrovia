import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCandidateDto } from './dto/create-candidate.dto';

@Injectable()
export class CandidateService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly safeUserSelect = {
    id: true,
    email: true,
    phone: true,
    name: true,
    role: true,
    isVerified: true,
    isActive: true,
    createdAt: true,
    updatedAt: true,
  } as const;

  private generateCandidateCode() {
    return `TKR-${new Date().getFullYear()}-${Math.floor(
      100000 + Math.random() * 900000,
    )}`;
  }

  // Existing standalone creation flow; retained for compatibility.
  async create(dto: CreateCandidateDto) {
    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: dto.email }, { phone: dto.phone }],
      },
    });

    if (existing) {
      throw new ConflictException(
        'A user with this email or phone already exists.',
      );
    }

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        phone: dto.phone,
        name: dto.fullName,
        role: 'STUDENT',
        isVerified: false,
      },
    });

    return this.prisma.candidate.create({
      data: {
        candidateCode: this.generateCandidateCode(),
        userId: user.id,
        fullName: dto.fullName,
        email: user.email,
        phone: user.phone,
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
      },
      include: {
        user: { select: this.safeUserSelect },
      },
    });
  }

  // Onboarding flow: attach a Candidate profile to an already registered User.
  async createForUser(userId: string, dto: CreateCandidateDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: this.safeUserSelect,
    });

    if (!user) {
      throw new NotFoundException('Registered user not found.');
    }

    if (user.email.toLowerCase() !== dto.email.toLowerCase()) {
      throw new BadRequestException(
        'The profile email must match the registered account.',
      );
    }

    if (user.phone !== dto.phone) {
      throw new BadRequestException(
        'The profile phone must match the registered account.',
      );
    }

    const existingCandidate = await this.prisma.candidate.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (existingCandidate) {
      throw new ConflictException(
        'A candidate profile already exists for this user.',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { name: dto.fullName },
      });

      return tx.candidate.create({
        data: {
          candidateCode: this.generateCandidateCode(),
          userId,
          fullName: dto.fullName,
          email: user.email,
          phone: user.phone,
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
        },
        include: {
          user: { select: this.safeUserSelect },
        },
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
            id: true,
            type: true,
            title: true,
            description: true,
            score: true,
            maxScore: true,
            classification: true,
            status: true,
            startedAt: true,
            completedAt: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        registrations: true,
      },
    });

    if (!candidate) {
      throw new NotFoundException('Candidate profile not found');
    }

    return candidate;
  }

  async findAll() {
    return this.prisma.candidate.findMany({
      include: {
        user: { select: this.safeUserSelect },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const candidate = await this.prisma.candidate.findUnique({
      where: { id },
      include: {
        user: { select: this.safeUserSelect },
        assessments: {
          orderBy: { createdAt: 'desc' },
        },
        registrations: true,
      },
    });

    if (!candidate) {
      throw new NotFoundException('Candidate not found');
    }

    return candidate;
  }
}
