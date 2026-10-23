'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { adminApi, readAdminUser } from '../../../src/lib/admin-api';

const STAFF = ['ADMIN', 'SUPER_ADMIN', 'COUNSELLOR'];
const WINDOWS = [7, 30, 90];

const stageLabel: Record<string, string> = {
  NEW: 'New',
  CONTACTED: 'Contacted',
  INTERESTED: 'Interested',
  PROSPECT: 'Prospect',
  PIPELINE: 'Pipeline',
  PENDING_CLOSURE: 'Pending closure',
  ENROLLED: 'Enrolled',
};

export default function MarketingDashboard() {
  const router = useRouter();
  const [days, setDays] = useState(30);
  const [funnel, setFunnel] = useState<any>(null);
  const [attribution, setAttribution] = useState<any>(null);
  const [daily, setDaily] = useState<any[]>([]);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const [f, a, d] = await Promise.all([
        adminApi.get('/marketing/funnel', { params: { days } }),
        adminApi.get('/marketing/attribution', { params: { days } }),
        adminApi.get('/marketing/daily', { params: { days: Math.min(days, 30) } }),
      ]);
      setFunnel(f.data);
      setAttribution(a.data);
      setDaily(d.data);
    } catch {
      setError('Could not load marketing data.');
    }
  }, [days]);

  useEffect(() => {
    const user = readAdminUser();
    if (!user) { router.replace('/login'); return; }
    if (!STAFF.includes(user.role ?? '')) { router.replace('/dashboard'); return; }
    void load();
  }, [router, load]);

  const peak = Math.max(1, ...daily.map((d) => d.leads));
  const widest = funnel?.funnel?.[0]?.reached || 1;

  function Table({ title, rows }: { title: string; rows: any[] }) {
    return (
      <div>
        <h3 className="text-sm font-semibold">{title}</h3>
        {rows.length === 0 ? (
          <p className="mt-2 text-xs text-slate-500">Nothing recorded.</p>
        ) : (
          <table className="mt-2 w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="pb-2">Name</th>
                <th className="pb-2 text-right">Leads</th>
                <th className="pb-2 text-right">Enrolled</th>
                <th className="pb-2 text-right">Rate</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 8).map((r: any) => (
                <tr key={r.name} className="border-t border-white/5">
                  <td className="py-2 pr-2">{r.name}</td>
                  <td className="py-2 text-right tabular-nums">{r.leads}</td>
                  <td className="py-2 text-right tabular-nums">{r.enrolled}</td>
                  <td className="py-2 text-right tabular-nums text-slate-400">
                    {r.conversionRate}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-7">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-300">
              TekRovia · Administration
            </p>
            <h1 className="mt-2 text-3xl font-bold">Marketing</h1>
            <p className="mt-2 text-sm text-slate-400">
              Where leads come from and how many convert.
            </p>
          </div>
          <div className="flex gap-2">
            {WINDOWS.map((w) => (
              <button key={w} type="button" onClick={() => setDays(w)}
                className={`rounded-xl border px-3 py-2.5 text-sm font-semibold transition ${
                  days === w ? 'border-indigo-400/60 bg-indigo-500/10' : 'border-white/15 hover:bg-white/10'
                }`}>
                {w}d
              </button>
            ))}
            <Link href="/admin/leads"
              className="rounded-xl border border-white/15 px-4 py-2.5 text-sm font-semibold hover:bg-white/10">
              Leads
            </Link>
          </div>
        </header>

        {error && <p className="rounded-xl border border-rose-400/30 bg-rose-400/10 p-4 text-sm text-rose-200">{error}</p>}

        {funnel && (
          <>
            <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {[
                { label: 'Leads', value: funnel.totalLeads },
                { label: 'Enrolled', value: funnel.enrolled },
                { label: 'Conversion', value: funnel.conversionRate === null ? '—' : `${funnel.conversionRate}%` },
                { label: 'Dropped', value: funnel.dropped },
              ].map((t) => (
                <div key={t.label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-400">{t.label}</p>
                  <p className="mt-2 text-3xl font-bold tabular-nums">{t.value}</p>
                </div>
              ))}
            </section>

            <section className="rounded-2xl border border-amber-400/20 bg-amber-400/[0.05] p-4 text-xs leading-6 text-amber-200">
              <strong className="font-semibold">Not shown:</strong> spend, reach and
              cost per lead need ad-platform data, and revenue needs online payment.
              Neither is connected, so those figures are left out rather than shown as zero.
            </section>

            <section>
              <h2 className="text-lg font-bold">Funnel</h2>
              <div className="mt-3 space-y-2">
                {funnel.funnel.map((row: any) => (
                  <div key={row.stage} className="flex items-center gap-3">
                    <span className="w-32 shrink-0 text-xs text-slate-400">
                      {stageLabel[row.stage] ?? row.stage}
                    </span>
                    <div className="h-7 flex-1 overflow-hidden rounded-lg bg-white/[0.04]">
                      <div className="flex h-full items-center rounded-lg bg-indigo-500/40 px-3"
                        style={{ width: `${Math.max(2, (row.reached / widest) * 100)}%` }}>
                        <span className="text-xs font-semibold tabular-nums">{row.reached}</span>
                      </div>
                    </div>
                    <span className="w-16 shrink-0 text-right text-xs tabular-nums text-slate-500">
                      {row.atStage} here
                    </span>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-xs text-slate-500">
                Each bar counts leads that reached that stage or went beyond it.
              </p>
            </section>
          </>
        )}

        {daily.length > 0 && (
          <section>
            <h2 className="text-lg font-bold">Daily leads</h2>
            <div className="mt-3 flex h-32 items-end gap-1 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              {daily.map((d: any) => (
                <div key={d.date} className="group relative flex-1"
                  title={`${d.date}: ${d.leads} leads, ${d.enrolled} enrolled`}>
                  <div className="w-full rounded-t bg-indigo-500/50 transition group-hover:bg-indigo-400"
                    style={{ height: `${Math.max(2, (d.leads / peak) * 100)}px` }} />
                </div>
              ))}
            </div>
            <p className="mt-2 text-xs text-slate-500">
              {daily[0]?.date} to {daily[daily.length - 1]?.date}
            </p>
          </section>
        )}

        {attribution && (
          <section className="grid gap-6 lg:grid-cols-2">
            <Table title="By source" rows={attribution.bySource} />
            <Table title="By campaign" rows={attribution.byCampaign} />
            <Table title="By medium" rows={attribution.byMedium} />
            <Table title="By course interest" rows={attribution.byInterest} />
          </section>
        )}
      </div>
    </main>
  );
}
