'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { adminApi, readAdminUser } from '../../../src/lib/admin-api';

const PLACEMENT = ['ADMIN', 'SUPER_ADMIN', 'PLACEMENT_MANAGER'];
const STATUSES = ['OPEN', 'ON_HOLD', 'FILLED', 'CLOSED'];

const statusStyle: Record<string, string> = {
  OPEN: 'bg-emerald-400/15 text-emerald-300',
  ON_HOLD: 'bg-amber-400/15 text-amber-300',
  FILLED: 'bg-indigo-400/15 text-indigo-300',
  CLOSED: 'bg-slate-500/20 text-slate-400',
};

const field =
  'mt-1 w-full rounded-xl border border-white/15 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-indigo-400';

const blank = {
  companyName: '', jobTitle: '', location: '', employmentType: '',
  description: '', requirements: '', minExperience: '', salaryMin: '',
  salaryMax: '', jobUrl: '', source: '', openings: '1',
};

function money(min: number | null, max: number | null) {
  if (min === null && max === null) return null;
  const f = (n: number) => `₹${(n / 100000).toFixed(1)}L`;
  if (min !== null && max !== null) return `${f(min)} – ${f(max)}`;
  return f((min ?? max) as number);
}

function message(err: unknown) {
  if (axios.isAxiosError(err)) {
    const m = err.response?.data?.message;
    if (Array.isArray(m)) return m.join(', ');
    if (typeof m === 'string') return m;
  }
  return 'Something went wrong.';
}

export default function JobPostingsPage() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [status, setStatus] = useState('ALL');
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState<any>(null);
  const [eligible, setEligible] = useState<any[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ ...blank });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const res = await adminApi.get('/job-postings', {
        params: { status, search: search || undefined },
      });
      setData(res.data);
    } catch (err) { setError(message(err)); }
  }, [status, search]);

  useEffect(() => {
    const user = readAdminUser();
    if (!user) { router.replace('/login'); return; }
    if (!PLACEMENT.includes(user.role ?? '')) { router.replace('/dashboard'); return; }
    void load();
  }, [router, load]);

  async function openPosting(id: string) {
    try {
      const [posting, candidates] = await Promise.all([
        adminApi.get(`/job-postings/${id}`),
        adminApi.get(`/job-postings/${id}/eligible`),
      ]);
      setOpen(posting.data);
      setEligible(candidates.data);
    } catch (err) { setError(message(err)); }
  }

  async function create(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await adminApi.post('/job-postings', {
        ...form,
        requirements: form.requirements.split('\n').map((r) => r.trim()).filter(Boolean),
      });
      setForm({ ...blank });
      setShowNew(false);
      await load();
    } catch (err) { setError(message(err)); }
    finally { setBusy(false); }
  }

  async function patch(id: string, body: any) {
    setBusy(true);
    try {
      await adminApi.patch(`/job-postings/${id}`, body);
      await load();
      if (open?.id === id) await openPosting(id);
    } catch (err) { setError(message(err)); }
    finally { setBusy(false); }
  }

  const counts = data?.byStatus ?? {};

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-300">
              TekRovia · Placement
            </p>
            <h1 className="mt-2 text-3xl font-bold">Job postings</h1>
            <p className="mt-2 text-sm text-slate-400">
              Open vacancies and who has been submitted to each.
            </p>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => setShowNew((v) => !v)}
              className="rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-semibold hover:bg-indigo-400">
              New posting
            </button>
            <Link href="/admin/placements"
              className="rounded-xl border border-white/15 px-4 py-2.5 text-sm font-semibold hover:bg-white/10">
              Placements
            </Link>
          </div>
        </header>

        <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {STATUSES.map((s) => (
            <button key={s} type="button"
              onClick={() => setStatus(s === status ? 'ALL' : s)}
              className={`rounded-xl border p-3 text-left transition ${
                status === s ? 'border-indigo-400/60 bg-indigo-500/10' : 'border-white/10 bg-white/[0.03]'
              }`}>
              <p className="text-2xl font-bold tabular-nums">{counts[s] ?? 0}</p>
              <p className="mt-1 text-[11px] uppercase tracking-wide text-slate-400">
                {s.replace(/_/g, ' ')}
              </p>
            </button>
          ))}
        </section>

        <div className="flex flex-wrap gap-2">
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') void load(); }}
            placeholder="Search company, role or code…"
            className="min-w-0 flex-1 rounded-xl border border-white/10 bg-slate-900 px-3 py-2.5 text-sm outline-none focus:border-indigo-400" />
          <button type="button" onClick={() => void load()}
            className="rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-semibold hover:bg-indigo-400">
            Search
          </button>
        </div>

        {error && <p className="rounded-xl border border-rose-400/30 bg-rose-400/10 p-4 text-sm text-rose-200">{error}</p>}

        {showNew && (
          <form onSubmit={create} className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <h2 className="font-semibold">New job posting</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm text-slate-300">
                Company *
                <input required className={field} value={form.companyName}
                  onChange={(e) => setForm({ ...form, companyName: e.target.value })} />
              </label>
              <label className="block text-sm text-slate-300">
                Role *
                <input required className={field} value={form.jobTitle}
                  onChange={(e) => setForm({ ...form, jobTitle: e.target.value })}
                  placeholder="Backend Developer" />
              </label>
              <label className="block text-sm text-slate-300">
                Location
                <input className={field} value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  placeholder="Bengaluru / Remote" />
              </label>
              <label className="block text-sm text-slate-300">
                Employment type
                <input className={field} value={form.employmentType}
                  onChange={(e) => setForm({ ...form, employmentType: e.target.value })}
                  placeholder="Full time" />
              </label>
              <label className="block text-sm text-slate-300">
                Minimum experience (years)
                <input type="number" min="0" className={field} value={form.minExperience}
                  onChange={(e) => setForm({ ...form, minExperience: e.target.value })} />
              </label>
              <label className="block text-sm text-slate-300">
                Openings
                <input type="number" min="1" className={field} value={form.openings}
                  onChange={(e) => setForm({ ...form, openings: e.target.value })} />
              </label>
              <label className="block text-sm text-slate-300">
                Salary from (₹)
                <input type="number" min="0" className={field} value={form.salaryMin}
                  onChange={(e) => setForm({ ...form, salaryMin: e.target.value })}
                  placeholder="400000" />
              </label>
              <label className="block text-sm text-slate-300">
                Salary to (₹)
                <input type="number" min="0" className={field} value={form.salaryMax}
                  onChange={(e) => setForm({ ...form, salaryMax: e.target.value })}
                  placeholder="700000" />
              </label>
            </div>
            <label className="block text-sm text-slate-300">
              Requirements <span className="text-slate-500">(one per line)</span>
              <textarea rows={4} className={field} value={form.requirements}
                onChange={(e) => setForm({ ...form, requirements: e.target.value })}
                placeholder={"Node.js\nPostgreSQL\n2 years experience"} />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm text-slate-300">
                Job link
                <input className={field} value={form.jobUrl}
                  onChange={(e) => setForm({ ...form, jobUrl: e.target.value })}
                  placeholder="https://…" />
              </label>
              <label className="block text-sm text-slate-300">
                Source
                <input className={field} value={form.source}
                  onChange={(e) => setForm({ ...form, source: e.target.value })}
                  placeholder="Direct / Naukri / Referral" />
              </label>
            </div>
            <button type="submit" disabled={busy}
              className="rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-semibold hover:bg-indigo-400 disabled:opacity-50">
              {busy ? 'Creating…' : 'Create posting'}
            </button>
          </form>
        )}

        {open && (
          <section className="rounded-2xl border border-indigo-400/30 bg-indigo-500/[0.05] p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-lg font-semibold">
                  {open.jobTitle} · {open.companyName}
                </h2>
                <p className="mt-1 text-xs text-slate-400">
                  {open.postingCode} · {open.location || 'location not set'} ·{' '}
                  {open.openings} {open.openings === 1 ? 'opening' : 'openings'}
                  {money(open.salaryMin, open.salaryMax) ? ` · ${money(open.salaryMin, open.salaryMax)}` : ''}
                </p>
                {open.requirements?.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {open.requirements.map((r: string) => (
                      <span key={r} className="rounded-full bg-white/5 px-2.5 py-0.5 text-[11px] text-slate-300">
                        {r}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <select value={open.status} disabled={busy}
                  onChange={(e) => void patch(open.id, { status: e.target.value })}
                  className="rounded-lg border border-white/15 bg-slate-900 px-3 py-2 text-xs">
                  {STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                </select>
                {open.jobUrl && (
                  <a href={open.jobUrl} target="_blank" rel="noreferrer"
                    className="rounded-lg border border-white/15 px-3 py-2 text-xs hover:bg-white/10">
                    Job link
                  </a>
                )}
                <button type="button" onClick={() => setOpen(null)}
                  className="text-xs text-slate-400 hover:text-white">Close</button>
              </div>
            </div>

            <div className="mt-5 grid gap-5 border-t border-white/10 pt-4 lg:grid-cols-2">
              <div>
                <h3 className="text-sm font-semibold">
                  Submitted · {open.applications.length}
                </h3>
                {open.applications.length === 0 ? (
                  <p className="mt-2 text-xs text-slate-500">Nobody submitted yet.</p>
                ) : (
                  <ul className="mt-2 space-y-2">
                    {open.applications.map((a: any) => (
                      <li key={a.id} className="flex items-center justify-between gap-3 rounded-lg bg-slate-950/60 px-3 py-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm">{a.candidate.fullName}</p>
                          <p className="truncate text-xs text-slate-500">{a.candidate.candidateCode}</p>
                        </div>
                        <span className="shrink-0 rounded-full bg-white/5 px-2.5 py-0.5 text-[11px] text-slate-300">
                          {a.pipelineStage?.replace(/_/g, ' ') ?? a.status}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <h3 className="text-sm font-semibold">
                  Placement-approved and available · {eligible.length}
                </h3>
                {eligible.length === 0 ? (
                  <p className="mt-2 text-xs text-slate-500">
                    No candidates have been approved for placement yet.
                  </p>
                ) : (
                  <ul className="mt-2 space-y-2">
                    {eligible.map((c: any) => (
                      <li key={c.id} className="rounded-lg bg-slate-950/60 px-3 py-2">
                        <p className="truncate text-sm">{c.fullName}</p>
                        <p className="truncate text-xs text-slate-500">
                          {c.targetRole || 'no target role'} · {c.experienceYears} yrs
                          {c.skills?.length ? ` · ${c.skills.slice(0, 3).join(', ')}` : ''}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
                <p className="mt-2 text-[11px] text-slate-500">
                  Create the application from Placements to submit someone.
                </p>
              </div>
            </div>
          </section>
        )}

        <div className="space-y-3">
          {!data ? (
            <p className="rounded-2xl border border-white/10 p-6 text-sm text-slate-400">Loading…</p>
          ) : !data.postings.length ? (
            <p className="rounded-2xl border border-dashed border-white/15 p-10 text-center text-sm text-slate-400">
              No job postings yet.
            </p>
          ) : data.postings.map((j: any) => (
            <button key={j.id} type="button" onClick={() => void openPosting(j.id)}
              className="flex w-full flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left transition hover:border-indigo-400/40">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{j.jobTitle}</p>
                  <span className="text-sm text-slate-400">{j.companyName}</span>
                  <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${statusStyle[j.status]}`}>
                    {j.status.replace(/_/g, ' ')}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {j.postingCode} · {j.location || 'location not set'}
                  {money(j.salaryMin, j.salaryMax) ? ` · ${money(j.salaryMin, j.salaryMax)}` : ''}
                </p>
              </div>
              <span className="shrink-0 text-sm tabular-nums text-slate-300">
                {j._count.applications} submitted
              </span>
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}
