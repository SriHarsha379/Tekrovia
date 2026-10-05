import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { randomInt } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

const LEAD_CODE_ATTEMPTS = 5;

function generateLeadCode(): string {
  return `LEAD-${new Date().getFullYear()}-${randomInt(100000, 1000000)}`;
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    (error as { code?: unknown }).code === 'P2002'
  );
}

@Injectable()
export class LeadService {
  constructor(private readonly prisma: PrismaService) {}

  async createLead(data: {
    name: string;
    email: string;
    phone: string;
    courseInterest?: string;
    source?: string;
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
    utmContent?: string;
    utmTerm?: string;
    consentGiven?: boolean;
  }) {
    const existing = await this.prisma.lead.findFirst({
      where: {
        OR: [{ email: data.email }, { phone: data.phone }],
      },
    });

    if (existing) {
      return existing;
    }

    // Lead codes are random, so retry on the rare unique-constraint collision.
    for (let attempt = 1; attempt <= LEAD_CODE_ATTEMPTS; attempt += 1) {
      try {
        return await this.prisma.lead.create({
          data: {
            leadCode: generateLeadCode(),
            name: data.name,
            email: data.email,
            phone: data.phone,
            courseInterest: data.courseInterest,
            source: data.source,
            utmSource: data.utmSource,
            utmMedium: data.utmMedium,
            utmCampaign: data.utmCampaign,
            utmContent: data.utmContent,
            utmTerm: data.utmTerm,
            consentGiven: data.consentGiven ?? false,
            status: 'NEW',
          },
        });
      } catch (error) {
        if (!isUniqueViolation(error) || attempt === LEAD_CODE_ATTEMPTS) {
          throw error;
        }
      }
    }

    throw new Error('Unable to generate a unique lead code.');
  }

  async convertLeadToCandidate(leadId: string, candidateId: string) {
    const lead = await this.prisma.lead.findUnique({ where: { id: leadId } });
    if (!lead) throw new NotFoundException('Lead not found');

    const candidate = await this.prisma.candidate.findUnique({ where: { id: candidateId } });
    if (!candidate) throw new BadRequestException('Candidate not found');

    await this.prisma.lead.update({
      where: { id: leadId },
      data: {
        candidateId,
        status: 'ENROLLED',
      },
    });

    return { leadId, candidateId, status: 'ENROLLED' };
  }
}
