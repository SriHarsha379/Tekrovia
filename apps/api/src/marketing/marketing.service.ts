import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/** Lead statuses in funnel order, as the blueprint lists them. */
const FUNNEL: string[] = [
  'NEW', 'CONTACTED', 'INTERESTED', 'PROSPECT',
  'PIPELINE', 'PENDING_CLOSURE', 'ENROLLED',
];

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

@Injectable()
export class MarketingService {
  constructor(private readonly prisma: PrismaService) {}

  /** Headline funnel for a window, defaulting to the last 30 days. */
  async funnel(days = 30) {
    const since = startOfDay(new Date(Date.now() - (days - 1) * 86400_000));

    const [byStatus, total, dropped, converted] = await Promise.all([
      this.prisma.lead.groupBy({
        by: ['status'],
        where: { createdAt: { gte: since } },
        _count: true,
      }),
      this.prisma.lead.count({ where: { createdAt: { gte: since } } }),
      this.prisma.lead.count({
        where: { createdAt: { gte: since }, status: 'DROPPED' },
      }),
      this.prisma.lead.count({
        where: { createdAt: { gte: since }, candidateId: { not: null } },
      }),
    ]);

    const counts = Object.fromEntries(byStatus.map((r) => [r.status, r._count]));

    // Leads at or beyond each stage, which is what a funnel actually means.
    const cumulative = FUNNEL.map((stage, i) => ({
      stage,
      atStage: counts[stage] ?? 0,
      reached: FUNNEL.slice(i).reduce((sum, s) => sum + (counts[s] ?? 0), 0),
    }));

    const enrolled = counts.ENROLLED ?? 0;

    return {
      windowDays: days,
      totalLeads: total,
      dropped,
      converted,
      enrolled,
      conversionRate: total ? Math.round((enrolled / total) * 1000) / 10 : null,
      funnel: cumulative,
      // Needs ad-platform data and payments, neither of which is connected.
      unavailable: ['spend', 'reach', 'costPerLead', 'grossRevenue', 'netRevenue'],
    };
  }

  /** Where leads came from, so you can tell which campaign is working. */
  async attribution(days = 30) {
    const since = startOfDay(new Date(Date.now() - (days - 1) * 86400_000));

    const leads = await this.prisma.lead.findMany({
      where: { createdAt: { gte: since } },
      select: {
        source: true, utmSource: true, utmMedium: true,
        utmCampaign: true, status: true, courseInterest: true,
      },
    });

    const group = (key: (l: any) => string | null) => {
      const map = new Map<string, { leads: number; enrolled: number }>();
      for (const l of leads) {
        const k = key(l) || 'unattributed';
        const row = map.get(k) ?? { leads: 0, enrolled: 0 };
        row.leads += 1;
        if (l.status === 'ENROLLED') row.enrolled += 1;
        map.set(k, row);
      }
      return [...map.entries()]
        .map(([name, v]) => ({
          name,
          ...v,
          conversionRate: v.leads ? Math.round((v.enrolled / v.leads) * 1000) / 10 : 0,
        }))
        .sort((a, b) => b.leads - a.leads);
    };

    return {
      bySource: group((l) => l.utmSource ?? l.source),
      byCampaign: group((l) => l.utmCampaign),
      byMedium: group((l) => l.utmMedium),
      byInterest: group((l) => l.courseInterest),
    };
  }

  /** Daily lead volume, for the trend line. */
  async daily(days = 14) {
    const since = startOfDay(new Date(Date.now() - (days - 1) * 86400_000));

    const leads = await this.prisma.lead.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true, status: true },
    });

    const buckets = new Map<string, { leads: number; enrolled: number }>();
    for (let i = 0; i < days; i += 1) {
      const d = startOfDay(new Date(since.getTime() + i * 86400_000));
      buckets.set(d.toISOString().slice(0, 10), { leads: 0, enrolled: 0 });
    }
    for (const l of leads) {
      const key = startOfDay(l.createdAt).toISOString().slice(0, 10);
      const row = buckets.get(key);
      if (!row) continue;
      row.leads += 1;
      if (l.status === 'ENROLLED') row.enrolled += 1;
    }

    return [...buckets.entries()].map(([date, v]) => ({ date, ...v }));
  }
}
