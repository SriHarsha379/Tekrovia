import { Injectable, NotFoundException } from '@nestjs/common';
import { LeadStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCampaignDto } from './dto/campaign.dto';

@Injectable()
export class CampaignService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCampaignDto) {
    return this.prisma.campaign.create({ data: dto });
  }

  async findAll(page = 1) {
    const take = 20;
    const skip = (Math.max(1, page) - 1) * take;
    const [items, total] = await this.prisma.$transaction([
      this.prisma.campaign.findMany({ skip, take, orderBy: { createdAt: 'desc' } }),
      this.prisma.campaign.count(),
    ]);
    return { data: items, meta: { total, page, take, totalPages: Math.ceil(total / take) } };
  }

  async findOne(id: string) {
    const c = await this.prisma.campaign.findUnique({
      where: { id },
      include: { _count: { select: { leads: true, funnelEvents: true } } },
    });
    if (!c) throw new NotFoundException('Campaign not found.');
    return c;
  }

  async getFunnelStats(campaignId: string) {
    const campaign = await this.prisma.campaign.findUnique({ where: { id: campaignId } });
    if (!campaign) throw new NotFoundException('Campaign not found.');

    const events = await this.prisma.funnelEvent.groupBy({
      by: ['eventType'],
      where: { campaignId },
      _count: { id: true },
    });

    const leads = await this.prisma.lead.count({ where: { campaignId } });
    const converted = await this.prisma.lead.count({
      where: { campaignId, status: LeadStatus.ENROLLED },
    });

    return {
      campaignId,
      leads,
      converted,
      conversionRate: leads > 0 ? ((converted / leads) * 100).toFixed(1) + '%' : '0%',
      funnelEvents: events.reduce<Record<string, number>>(
        (acc, e) => ({ ...acc, [e.eventType]: e._count.id }),
        {},
      ),
    };
  }

  async logFunnelEvent(data: {
    eventType: string;
    campaignId?: string;
    leadId?: string;
    candidateId?: string;
    metadata?: Record<string, unknown>;
  }) {
    return this.prisma.funnelEvent.create({
      data: {
        eventType: data.eventType,
        campaignId: data.campaignId,
        leadId: data.leadId,
        metadata: data.metadata ?? null,
      },
    });
  }
}
