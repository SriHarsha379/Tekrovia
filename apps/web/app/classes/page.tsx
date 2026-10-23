'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Calendar, PlayCircle, Video } from 'lucide-react';

const API = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1`;

const attendStyle: Record<string, string> = {
  PRESENT: 'bg-emerald-100 text-emerald-800',
  LATE: 'bg-amber-100 text-amber-800',
  ABSENT: 'bg-rose-100 text-rose-800',
  EXCUSED: 'bg-slate-200 text-slate-700',
};

function token() {
  return typeof window === 'undefined'
    ? null
    : sessionStorage.getItem('tekrovia_access_token');
}

function dayText(v: string) {
  const d = new Date(v);
  const today = new Date();
  const tomorrow = new Date(Date.now() + 86400000);
  const same = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  const time = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  if (same(d, today)) return `Today at ${time}`;
  if (same(d, tomorrow)) return `Tomorrow at ${time}`;
  return d.toLocaleString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short',
    hour: '2-digit', minute: '2-digit',
  });
}

/** The join link appears 15 minutes before and stays until the class ends. */
function joinable(c: any) {
  const start = new Date(c.scheduledAt).getTime();
  const now = Date.now();
  return now >= start - 15 * 60000 && now <= start + c.durationMins * 60000;
}

export default function ClassesPage() {
  const router = useRouter();
  const [data, setData] = useState<any>({ upcoming: [], past: [] });
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const t = token();
    if (!t) { router.replace('/login'); return; }
    try {
      const headers = { Authorization: `Bearer ${t}` };
      const [classes, attendance] = await Promise.all([
        fetch(`${API}/classes/mine`, { headers }),
        fetch(`${API}/classes/mine/attendance`, { headers }),
      ]);
      if (classes.status === 401) { router.replace('/login'); return; }
      setData(await classes.json());
      setSummary(await attendance.json());
    } catch {
      setError('Could not load your classes.');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void load();
    // Keeps the Join button appearing without a manual refresh.
    const timer = setInterval(() => load(), 60000);
    return () => clearInterval(timer);
  }, [load]);

  if (loading) return <div className="p-8">Loading your classes…</div>;

  const nothing = !data.upcoming.length && !data.past.length;

  return (
    <main className="mx-auto max-w-3xl p-8">
      <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900">
        <ArrowLeft className="h-4 w-4" />
        Back to dashboard
      </Link>

      <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Live classes</h1>
          <p className="mt-1 text-sm text-gray-500">
            Sessions with your trainer, and the recordings afterwards.
          </p>
        </div>
        {summary?.rate !== null && summary?.total > 0 && (
          <div className="rounded-xl border bg-gray-50 px-4 py-3 text-right">
            <p className="text-2xl font-bold tabular-nums">{summary.rate}%</p>
            <p className="text-xs text-gray-500">
              attended · {summary.attended} of {summary.total}
            </p>
          </div>
        )}
      </div>

      {error && (
        <p className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>
      )}

      {nothing ? (
        <div className="mt-8 rounded-xl border border-dashed p-10 text-center">
          <Calendar className="mx-auto h-8 w-8 text-gray-300" />
          <p className="mt-3 text-sm text-gray-500">
            No classes scheduled yet. They appear here once you are placed in a batch.
          </p>
        </div>
      ) : (
        <>
          {data.upcoming.length > 0 && (
            <section className="mt-8">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                Coming up
              </h2>
              <div className="mt-3 space-y-3">
                {data.upcoming.map((c: any) => (
                  <article key={c.id} className="rounded-xl border p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium">{c.title}</p>
                        <p className="mt-1 text-sm text-blue-700">{dayText(c.scheduledAt)}</p>
                        <p className="mt-1 text-xs text-gray-500">
                          {c.batch.name} · {c.durationMins} min
                          {c.trainer ? ` · ${c.trainer}` : ''}
                        </p>
                        {c.description && (
                          <p className="mt-2 text-sm leading-6 text-gray-600">{c.description}</p>
                        )}
                      </div>
                      {c.meetingLink && (
                        joinable(c) ? (
                          <a href={c.meetingLink} target="_blank" rel="noreferrer"
                            className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
                            <Video className="h-4 w-4" />
                            Join now
                          </a>
                        ) : (
                          <span className="shrink-0 rounded-lg bg-gray-100 px-4 py-2.5 text-xs text-gray-500">
                            Link opens 15 min before
                          </span>
                        )
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          {data.past.length > 0 && (
            <section className="mt-8">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                Recent
              </h2>
              <div className="mt-3 space-y-3">
                {data.past.map((c: any) => (
                  <article key={c.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4">
                    <div className="min-w-0">
                      <p className="font-medium">{c.title}</p>
                      <p className="mt-1 text-xs text-gray-500">
                        {dayText(c.scheduledAt)} · {c.batch.name}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {c.myAttendance && (
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${attendStyle[c.myAttendance]}`}>
                          {c.myAttendance[0] + c.myAttendance.slice(1).toLowerCase()}
                        </span>
                      )}
                      {c.recordingUrl && (
                        <a href={c.recordingUrl} target="_blank" rel="noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium hover:bg-gray-50">
                          <PlayCircle className="h-4 w-4" />
                          Recording
                        </a>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </main>
  );
}
