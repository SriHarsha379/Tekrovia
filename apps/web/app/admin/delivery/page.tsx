'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { adminApi, readAdminUser } from '../../../src/lib/admin-api';

const STAFF = ['ADMIN', 'SUPER_ADMIN', 'TRAINER', 'SUPPORT_STAFF'];

function pct(v: number | null) {
  return v === null ? '—' : `${v}%`;
}

function rateColour(v: number | null) {
  if (v === null) return 'text-slate-400';
  if (v >= 80) return 'text-emerald-300';
  if (v >= 60) return 'text-amber-300';
  return 'text-rose-300';
}

function ago(v: string | null) {
  if (!v) return 'never';
  const days = Math.floor((Date.now() - new Date(v).getTime()) / 86400000);
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  return `${days} days ago`;
}

function soon(v: string | null) {
  if (!v) return 'none scheduled';
  return new Date(v).toLocaleString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function DeliveryDashboard() {
  const router = useRouter();
  const [overview, setOverview] = useState<any>(null);
  const [batches, setBatches] = useState<any[]>([]);
  const [risk, setRisk] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const [o, b, r] = await Promise.all([
        adminApi.get('/delivery/overview'),
        adminApi.get('/delivery/batches'),
        adminApi.get('/delivery/at-risk'),
      ]);
      setOverview(o.data);
      setBatches(b.data);
      setRisk(r.data);
    } catch {
      setError('Could not load delivery data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const user = readAdminUser();
    if (!user) { router.replace('/login'); return; }
    if (!STAFF.includes(user.role ?? '')) { router.replace('/dashboard'); return; }
    void load();
  }, [router, load]);

  if (loading) return <main className="min-h-screen bg-slate-950 p-8 text-slate-400">Loading…</main>;

  const tiles = overview ? [
    { label: 'Active batches', value: overview.activeBatches },
    { label: 'Active enrolments', value: overview.activeEnrollments },
    { label: 'Classes this week', value: overview.classesThisWeek },
    { label: 'Attendance', value: pct(overview.attendanceRate), tone: rateColour(overview.attendanceRate) },
    { label: 'Lessons completed', value: overview.lessonsThisWeek, hint: 'this week' },
    { label: 'Awaiting review', value: overview.pendingReview,
      hint: `${overview.pendingAssignments} assignments · ${overview.pendingProjects} projects` },
    { label: 'Open tickets', value: overview.openTickets },
    { label: 'Overdue tickets', value: overview.overdueTickets,
      tone: overview.overdueTickets > 0 ? 'text-rose-300' : undefined },
  ] : [];

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-7">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-300">
              TekRovia · Administration
            </p>
            <h1 className="mt-2 text-3xl font-bold">Delivery</h1>
            <p className="mt-2 text-sm text-slate-400">
              How the cohorts are actually going.
            </p>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => void load()}
              className="rounded-xl border border-white/15 px-4 py-2.5 text-sm font-semibold hover:bg-white/10">
              Refresh
            </button>
            <Link href="/admin" className="rounded-xl border border-white/15 px-4 py-2.5 text-sm font-semibold hover:bg-white/10">
              Back to admin
            </Link>
          </div>
        </header>

        {error && <p className="rounded-xl border border-rose-400/30 bg-rose-400/10 p-4 text-sm text-rose-200">{error}</p>}

        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {tiles.map((t: any) => (
            <div key={t.label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-xs uppercase tracking-wide text-slate-400">{t.label}</p>
              <p className={`mt-2 text-3xl font-bold tabular-nums ${t.tone ?? ''}`}>{t.value}</p>
              {t.hint && <p className="mt-1 text-[11px] text-slate-500">{t.hint}</p>}
            </div>
          ))}
        </section>

        <section>
          <h2 className="text-lg font-bold">Batches in flight</h2>
          {batches.length === 0 ? (
            <p className="mt-3 rounded-2xl border border-dashed border-white/15 p-8 text-center text-sm text-slate-400">
              No batches are enrolling or running.
            </p>
          ) : (
            <div className="mt-3 overflow-x-auto rounded-2xl border border-white/10">
              <table className="w-full min-w-[720px] text-sm">
                <thead className="bg-white/[0.03] text-left text-xs uppercase tracking-wide text-slate-400">
                  <tr>
                    <th className="px-4 py-3">Batch</th>
                    <th className="px-4 py-3">Students</th>
                    <th className="px-4 py-3">Completion</th>
                    <th className="px-4 py-3">Attendance</th>
                    <th className="px-4 py-3">Classes</th>
                    <th className="px-4 py-3">Next class</th>
                  </tr>
                </thead>
                <tbody>
                  {batches.map((b: any) => (
                    <tr key={b.id} className="border-t border-white/5">
                      <td className="px-4 py-3">
                        <Link href="/admin/batches" className="font-medium hover:text-indigo-300">
                          {b.name}
                        </Link>
                        <p className="text-xs text-slate-500">
                          {b.course.title} · {b.trainer ?? 'no trainer'}
                        </p>
                      </td>
                      <td className="px-4 py-3 tabular-nums">{b.students}/{b.capacity}</td>
                      <td className={`px-4 py-3 tabular-nums ${rateColour(b.completionRate)}`}>
                        {pct(b.completionRate)}
                      </td>
                      <td className={`px-4 py-3 tabular-nums ${rateColour(b.attendanceRate)}`}>
                        {pct(b.attendanceRate)}
                      </td>
                      <td className="px-4 py-3 tabular-nums text-slate-400">
                        {b.classesHeld}/{b.classesScheduled}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400">{soon(b.nextClassAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-bold">Needs attention</h2>
            {risk.length > 0 && (
              <span className="rounded-full bg-rose-400/15 px-3 py-1 text-xs font-semibold text-rose-300">
                {risk.length} {risk.length === 1 ? 'student' : 'students'}
              </span>
            )}
          </div>

          {risk.length === 0 ? (
            <p className="mt-3 rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.05] p-8 text-center text-sm text-emerald-200">
              Nobody is flagged. Everyone is keeping up.
            </p>
          ) : (
            <div className="mt-3 space-y-2">
              {risk.map((r: any) => (
                <article key={r.userId} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-400/25 bg-rose-500/[0.05] p-4">
                  <div className="min-w-0">
                    <p className="font-medium">{r.name}</p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {r.batch.name} · last active {ago(r.lastActiveAt)}
                      {r.openTickets > 0 ? ` · ${r.openTickets} open tickets` : ''}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {r.reasons.map((reason: string) => (
                        <span key={reason} className="rounded-full bg-rose-400/15 px-2.5 py-0.5 text-[11px] text-rose-200">
                          {reason}
                        </span>
                      ))}
                    </div>
                  </div>
                  <a href={`mailto:${r.email}`}
                    className="shrink-0 rounded-lg border border-white/15 px-3 py-2 text-xs hover:bg-white/10">
                    Email
                  </a>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
