import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

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

    const lead = await this.prisma.lead.create({
      data: {
        leadCode: `LEAD-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 900000) + 100000)}`,
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

    return lead;
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
