'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { adminApi, isAdmin, readAdminUser } from '../../src/lib/admin-api';

type Candidate = {
  id: string;
  candidateCode: string;
  fullName: string;
  email: string;
  status: string;
  classification?: string | null;
  createdAt: string;
};

type Overview = {
  counts: {
    totalStudents: number;
    totalCandidates: number;
    totalLeads: number;
    totalAssessments: number;
    completedAssessments: number;
    totalCourses: number;
    publishedCourses: number;
    totalEnrollments: number;
    activeEnrollments: number;
  };
  leadStatuses: { status: string; count: number }[];
  recentCandidates: Candidate[];
};

const cards = [
  { key: 'totalStudents', label: 'Student accounts', color: 'text-sky-300' },
  { key: 'totalCandidates', label: 'Candidate profiles', color: 'text-violet-300' },
  { key: 'totalLeads', label: 'Leads', color: 'text-amber-300' },
  { key: 'totalAssessments', label: 'Assessments', color: 'text-pink-300' },
  { key: 'totalCourses', label: 'Courses', color: 'text-emerald-300' },
  { key: 'totalEnrollments', label: 'Enrollments', color: 'text-cyan-300' },
] as const;

function dateLabel(value: string) {
  return new Date(value).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const user = readAdminUser();
    if (!user) {
      router.replace('/login');
      return;
    }
    if (!isAdmin(user)) {
      router.replace('/dashboard');
      return;
    }

    let active = true;
    adminApi.get<Overview>('/admin/overview')
      .then((response) => {
        if (active) setData(response.data);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setError(
          axiosMessage(err) ||
          'Unable to load the admin overview. Please try again.',
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [router]);

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-10 text-slate-100 md:px-10">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-7">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-indigo-300">
              TekRovia · Administration
            </p>
            <h1 className="mt-2 text-3xl font-bold md:text-4xl">Admin dashboard</h1>
            <p className="mt-2 text-slate-400">
              Monitor students, leads, assessments and learning activity.
            </p>
          </div>
          <nav className="flex flex-wrap gap-3">
            <Link href="/admin/students"
              className="rounded-xl border border-slate-700 px-4 py-3 text-sm font-semibold hover:bg-slate-800">
              Student directory
            </Link>
            <Link href="/admin/courses"
              className="rounded-xl bg-indigo-500 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-400">
              Course management
            </Link>
            <Link href="/admin/placements"
              className="rounded-xl border border-slate-700 px-4 py-3 text-sm font-semibold hover:bg-slate-800">
              Placement management
            </Link>
            <Link href="/review"
              className="rounded-xl border border-slate-700 px-4 py-3 text-sm font-semibold hover:bg-slate-800">
              Assignment review
            </Link>
          </nav>
        </header>

        {loading && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-slate-300">
            Loading dashboard…
          </div>
        )}

        {!loading && error && (
          <div role="alert" className="rounded-xl border border-rose-500/40 bg-rose-950/40 p-5 text-rose-200">
            {error}
            <button onClick={() => window.location.reload()}
              className="ml-3 underline underline-offset-4">
              Retry
            </button>
          </div>
        )}

        {!loading && data && (
          <>
            <section aria-label="Platform statistics" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {cards.map((card) => (
                <article key={card.key} className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-lg shadow-black/10">
                  <p className="text-sm text-slate-400">{card.label}</p>
                  <p className={`mt-3 text-4xl font-bold tabular-nums ${card.color}`}>
                    {data.counts[card.key].toLocaleString('en-IN')}
                  </p>
                </article>
              ))}
            </section>

            <section className="mt-5 grid gap-5 lg:grid-cols-3">
              <article className="rounded-2xl border border-slate-800 bg-slate-900 p-6 lg:col-span-2">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-semibold">Recently registered students</h2>
                    <p className="mt-1 text-sm text-slate-400">Latest candidate profiles</p>
                  </div>
                  <Link href="/admin/students" className="text-sm font-semibold text-indigo-300 hover:text-indigo-200">
                    View directory →
                  </Link>
                </div>
                {data.recentCandidates.length === 0 ? (
                  <p className="rounded-xl bg-slate-950 p-5 text-sm text-slate-400">
                    No candidate profiles have been registered yet.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[540px] text-left text-sm">
                      <thead className="text-xs uppercase tracking-wide text-slate-500">
                        <tr>
                          <th className="pb-3 pr-4 font-medium">Student</th>
                          <th className="pb-3 pr-4 font-medium">Status</th>
                          <th className="pb-3 pr-4 font-medium">Classification</th>
                          <th className="pb-3 font-medium">Joined</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.recentCandidates.map((student) => (
                          <tr key={student.id} className="border-t border-slate-800">
                            <td className="py-4 pr-4">
                              <Link href={`/admin/students/${encodeURIComponent(student.id)}`}
                                className="font-semibold text-slate-100 hover:text-indigo-300">
                                {student.fullName}
                              </Link>
                              <p className="mt-1 text-xs text-slate-500">{student.email}</p>
                            </td>
                            <td className="py-4 pr-4 text-slate-300">{student.status || '—'}</td>
                            <td className="py-4 pr-4 text-slate-300">{student.classification || '—'}</td>
                            <td className="py-4 text-slate-400">{dateLabel(student.createdAt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </article>

              <article className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                <h2 className="text-xl font-semibold">Activity summary</h2>
                <p className="mt-1 text-sm text-slate-400">Current platform totals</p>
                <div className="mt-5 space-y-5">
                  <Summary label="Completed assessments"
                    value={data.counts.completedAssessments}
                    total={data.counts.totalAssessments} />
                  <Summary label="Published courses"
                    value={data.counts.publishedCourses}
                    total={data.counts.totalCourses} />
                  <Summary label="Active enrollments"
                    value={data.counts.activeEnrollments}
                    total={data.counts.totalEnrollments} />
                </div>
                <div className="mt-7 border-t border-slate-800 pt-5">
                  <h3 className="text-sm font-semibold text-slate-300">Lead statuses</h3>
                  {data.leadStatuses.length === 0 ? (
                    <p className="mt-3 text-sm text-slate-500">No lead records yet.</p>
                  ) : (
                    <ul className="mt-3 space-y-2">
                      {data.leadStatuses.map((item) => (
                        <li key={item.status} className="flex justify-between gap-3 text-sm">
                          <span className="text-slate-400">{item.status.replace(/_/g, ' ')}</span>
                          <span className="font-semibold tabular-nums">{item.count}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </article>
            </section>
          </>
        )}
      </div>
    </main>
  );
}

function Summary({ label, value, total }: { label: string; value: number; total: number }) {
  const percent = total > 0 ? Math.min(100, Math.round((value / total) * 100)) : 0;
  return (
    <div>
      <div className="mb-2 flex justify-between gap-3 text-sm">
        <span className="text-slate-400">{label}</span>
        <span className="font-semibold tabular-nums">{value} / {total}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-800">
        <div className="h-full rounded-full bg-indigo-400" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function axiosMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message ||
      (error.response?.status === 401 ? 'Your session has expired. Please sign in again.' :
      error.response?.status === 403 ? 'Administrator access is required.' : '');
  }
  return '';
}
