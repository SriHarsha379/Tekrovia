'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';
import axios from 'axios';
import { adminApi, isAdmin, readAdminUser } from '../../../src/lib/admin-api';

type Student = {
  id: string;
  candidateCode: string;
  fullName: string;
  email: string;
  phone: string;
  education?: string | null;
  targetRole?: string | null;
  status: string;
  classification?: string | null;
  createdAt: string;
  _count: { assessments: number; enrollments: number };
};

type StudentResponse = {
  data: Student[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
};

export default function AdminStudentsPage() {
  const router = useRouter();
  const [result, setResult] = useState<StudentResponse | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ALL');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const user = readAdminUser();
    if (!user) { router.replace('/login'); return; }
    if (!isAdmin(user)) { router.replace('/dashboard'); return; }

    let active = true;
    setLoading(true);
    setError('');

    adminApi.get<StudentResponse>('/admin/students', {
      params: { search, status, page, limit: 10 },
    })
      .then((response) => { if (active) setResult(response.data); })
      .catch((err: unknown) => {
        if (!active) return;
        setError(axios.isAxiosError(err)
          ? err.response?.data?.message || 'Unable to load students.'
          : 'Unable to load students.');
      })
      .finally(() => { if (active) setLoading(false); });

    return () => { active = false; };
  }, [router, search, status, page]);

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  }

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-10 text-slate-100 md:px-10">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-7">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-indigo-300">
              TekRovia · Administration
            </p>
            <h1 className="mt-2 text-3xl font-bold md:text-4xl">Student directory</h1>
            <p className="mt-2 text-slate-400">Search and review registered candidate profiles.</p>
          </div>
          <Link href="/admin"
            className="rounded-xl border border-slate-700 px-4 py-3 text-sm font-semibold hover:bg-slate-800">
            ← Back to dashboard
          </Link>
        </header>

        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5 md:p-6">
          <form onSubmit={submitSearch} className="mb-6 flex flex-col gap-3 md:flex-row">
            <input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search name, email, phone, candidate code or target role"
              aria-label="Search students"
              className="min-w-0 flex-1 rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none focus:border-indigo-400"
            />
            <select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}
              aria-label="Filter by student status"
              className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm">
              <option value="ALL">All statuses</option>
              <option value="NEW">New</option>
              <option value="ACTIVE">Active</option>
              <option value="IN_PROGRESS">In progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="INACTIVE">Inactive</option>
            </select>
            <button type="submit"
              className="rounded-xl bg-indigo-500 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-400">
              Search
            </button>
          </form>

          {error && <div role="alert" className="mb-5 rounded-xl border border-rose-500/40 bg-rose-950/40 p-4 text-sm text-rose-200">{error}</div>}

          {loading ? (
            <p className="py-12 text-center text-slate-400">Loading student records…</p>
          ) : result?.data.length ? (
            <>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-sm text-slate-400">
                <span>{result.pagination.total.toLocaleString('en-IN')} student profile(s)</span>
                <span>Page {result.pagination.page} of {Math.max(1, result.pagination.totalPages)}</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead className="bg-slate-950/70 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="rounded-l-lg px-4 py-3 font-medium">Student</th>
                      <th className="px-4 py-3 font-medium">Target role</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Assessments</th>
                      <th className="px-4 py-3 font-medium">Enrollments</th>
                      <th className="rounded-r-lg px-4 py-3 font-medium">Profile</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.data.map((student) => (
                      <tr key={student.id} className="border-b border-slate-800 last:border-0">
                        <td className="px-4 py-4">
                          <p className="font-semibold">{student.fullName}</p>
                          <p className="mt-1 text-xs text-slate-400">{student.email}</p>
                          <p className="mt-1 text-xs text-slate-500">{student.candidateCode}</p>
                        </td>
                        <td className="px-4 py-4 text-slate-300">{student.targetRole || '—'}</td>
                        <td className="px-4 py-4">
                          <span className="rounded-full border border-slate-700 px-2.5 py-1 text-xs text-slate-300">
                            {student.status || '—'}
                          </span>
                        </td>
                        <td className="px-4 py-4 tabular-nums">{student._count.assessments}</td>
                        <td className="px-4 py-4 tabular-nums">{student._count.enrollments}</td>
                        <td className="px-4 py-4">
                          <Link href={`/admin/students/${encodeURIComponent(student.id)}`}
                            className="font-semibold text-indigo-300 hover:text-indigo-200">
                            View profile →
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-6 flex items-center justify-between gap-3">
                <button disabled={page <= 1} onClick={() => setPage((current) => current - 1)}
                  className="rounded-lg border border-slate-700 px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40">
                  Previous
                </button>
                <span className="text-xs text-slate-500">
                  Showing {((page - 1) * result.pagination.limit) + 1}–{Math.min(page * result.pagination.limit, result.pagination.total)} of {result.pagination.total}
                </span>
                <button disabled={page >= result.pagination.totalPages} onClick={() => setPage((current) => current + 1)}
                  className="rounded-lg border border-slate-700 px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40">
                  Next
                </button>
              </div>
            </>
          ) : (
            <div className="py-14 text-center">
              <h2 className="text-lg font-semibold">No students found</h2>
              <p className="mt-2 text-sm text-slate-400">Try a different search term or status filter.</p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
