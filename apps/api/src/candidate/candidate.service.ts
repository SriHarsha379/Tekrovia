import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCandidateDto } from './dto/create-candidate.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class CandidateService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createCandidateDto: CreateCandidateDto) {
    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: createCandidateDto.email },
          { phone: createCandidateDto.phone },
        ],
      },
    });

    if (existing) {
      throw new ConflictException('A candidate with this email or phone already exists.');
    }

    const user = await this.prisma.user.create({
      data: {
        email: createCandidateDto.email,
        phone: createCandidateDto.phone,
        name: createCandidateDto.fullName,
        role: 'STUDENT',
        isVerified: false,
      },
    });

    const candidateCode = `TKR-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 900000) + 100000)}`;

    const candidate = await this.prisma.candidate.create({
      data: {
        candidateCode,
        userId: user.id,
        fullName: createCandidateDto.fullName,
        email: createCandidateDto.email,
        phone: createCandidateDto.phone,
        education: createCandidateDto.education,
        graduationYear: createCandidateDto.graduationYear,
        experienceYears: createCandidateDto.experienceYears ?? 0,
        skills: createCandidateDto.skills ?? [],
        targetRole: createCandidateDto.targetRole,
        codingPreference: createCandidateDto.codingPreference,
        resumeUrl: createCandidateDto.resumeUrl,
        learningAvailability: createCandidateDto.learningAvailability,
        preferredSchedule: createCandidateDto.preferredSchedule,
        courseInterest: createCandidateDto.courseInterest,
        campaignSource: createCandidateDto.campaignSource,
        utmSource: createCandidateDto.utmSource,
        utmMedium: createCandidateDto.utmMedium,
        utmCampaign: createCandidateDto.utmCampaign,
        utmContent: createCandidateDto.utmContent,
        utmTerm: createCandidateDto.utmTerm,
        consentGiven: createCandidateDto.consentGiven ?? false,
        communicationPrefs: createCandidateDto.communicationPrefs,
      },
    });

    return candidate;
  }

  async findAll() {
    return this.prisma.candidate.findMany({
      include: { user: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const candidate = await this.prisma.candidate.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!candidate) {
      throw new NotFoundException('Candidate not found');
    }

    return candidate;
  }
}
