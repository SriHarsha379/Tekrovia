'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { adminApi, readAdminUser } from '../../../src/lib/admin-api';

const STAFF = ['ADMIN', 'SUPER_ADMIN', 'TRAINER', 'COUNSELLOR'];
const STATUSES = ['PLANNED', 'ENROLLING', 'RUNNING', 'COMPLETED', 'CANCELLED'];

const statusStyle: Record<string, string> = {
  PLANNED: 'bg-slate-500/20 text-slate-300',
  ENROLLING: 'bg-sky-400/15 text-sky-300',
  RUNNING: 'bg-emerald-400/15 text-emerald-300',
  COMPLETED: 'bg-indigo-400/15 text-indigo-300',
  CANCELLED: 'bg-rose-400/15 text-rose-300',
};

const field =
  'mt-1 w-full rounded-xl border border-white/15 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-indigo-400';

function day(v?: string | null) {
  if (!v) return '—';
  return new Date(v).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

function message(err: unknown) {
  if (axios.isAxiosError(err)) {
    const m = err.response?.data?.message;
    if (Array.isArray(m)) return m.join(', ');
    if (typeof m === 'string') return m;
  }
  return 'Something went wrong.';
}

export default function BatchesPage() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [trainers, setTrainers] = useState<any[]>([]);
  const [status, setStatus] = useState('ALL');
  const [open, setOpen] = useState<any>(null);
  const [showNew, setShowNew] = useState(false);
  const [picker, setPicker] = useState<any[]>([]);
  const [pickerSearch, setPickerSearch] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '', courseId: '', capacity: '15',
    schedule: '', startDate: '', endDate: '', trainerId: '',
  });

  const load = useCallback(async () => {
    setError('');
    try {
      const res = await adminApi.get('/batches', { params: { status } });
      setData(res.data);
    } catch (err) {
      setError(message(err));
    }
  }, [status]);

  useEffect(() => {
    const user = readAdminUser();
    if (!user) { router.replace('/login'); return; }
    if (!STAFF.includes(user.role ?? '')) { router.replace('/dashboard'); return; }
    void load();
    adminApi.get('/batches/trainers').then((r) => setTrainers(r.data)).catch(() => {});
    adminApi.get('/admin/enrollable-courses')
      .then((r) => setCourses(r.data)).catch(() => setCourses([]));
  }, [router, load]);

  async function openBatch(id: string) {
    try {
      const res = await adminApi.get(`/batches/${id}`);
      setOpen(res.data);
      setPicker([]);
      setPickerSearch('');
    } catch (err) { setError(message(err)); }
  }

  async function create(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await adminApi.post('/batches', {
        ...form,
        capacity: Number(form.capacity),
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined,
        trainerId: form.trainerId || undefined,
      });
      setForm({ name: '', courseId: '', capacity: '15', schedule: '', startDate: '', endDate: '', trainerId: '' });
      setShowNew(false);
      await load();
    } catch (err) {
      setError(message(err));
    } finally { setBusy(false); }
  }

  async function patch(id: string, body: any) {
    setBusy(true);
    setError('');
    try {
      await adminApi.patch(`/batches/${id}`, body);
      await load();
      if (open?.id === id) await openBatch(id);
    } catch (err) {
      setError(message(err));
    } finally { setBusy(false); }
  }

  async function findStudents(term: string) {
    if (!open) return;
    const res = await adminApi.get(`/batches/${open.id}/candidates`, {
      params: { search: term || undefined },
    });
    setPicker(res.data);
  }

  async function addStudent(userId: string) {
    setBusy(true);
    setError('');
    try {
      await adminApi.post(`/batches/${open.id}/members`, { userId });
      await openBatch(open.id);
      await load();
      await findStudents(pickerSearch);
    } catch (err) {
      setError(message(err));
    } finally { setBusy(false); }
  }

  async function removeStudent(userId: string, name: string) {
    if (!window.confirm(`Remove ${name} from this batch? Their course access stays.`)) return;
    setBusy(true);
    try {
      await adminApi.delete(`/batches/${open.id}/members/${userId}`);
      await openBatch(open.id);
      await load();
    } catch (err) {
      setError(message(err));
    } finally { setBusy(false); }
  }

  const counts = data?.byStatus ?? {};

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-300">
              TekRovia · Administration
            </p>
            <h1 className="mt-2 text-3xl font-bold">Batches</h1>
            <p className="mt-2 text-sm text-slate-400">
              Groups of students moving through a course together.
            </p>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => setShowNew((v) => !v)}
              className="rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-semibold hover:bg-indigo-400">
              New batch
            </button>
            <Link href="/admin" className="rounded-xl border border-white/15 px-4 py-2.5 text-sm font-semibold hover:bg-white/10">
              Back to admin
            </Link>
          </div>
        </header>

        <section className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {STATUSES.map((s) => (
            <button key={s} type="button"
              onClick={() => setStatus(s === status ? 'ALL' : s)}
              className={`rounded-xl border p-3 text-left transition ${
                status === s ? 'border-indigo-400/60 bg-indigo-500/10' : 'border-white/10 bg-white/[0.03]'
              }`}>
              <p className="text-2xl font-bold tabular-nums">{counts[s] ?? 0}</p>
              <p className="mt-1 text-[11px] uppercase tracking-wide text-slate-400">{s}</p>
            </button>
          ))}
        </section>

        {error && <p className="rounded-xl border border-rose-400/30 bg-rose-400/10 p-4 text-sm text-rose-200">{error}</p>}

        {showNew && (
          <form onSubmit={create} className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <h2 className="font-semibold">New batch</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm text-slate-300">
                Batch name *
                <input required className={field} value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="October 2026 — Full Stack" />
              </label>
              <label className="block text-sm text-slate-300">
                Course *
                <select required className={field} value={form.courseId}
                  onChange={(e) => setForm({ ...form, courseId: e.target.value })}>
                  <option value="">Choose a course…</option>
                  {courses.map((c: any) => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
              </label>
              <label className="block text-sm text-slate-300">
                Capacity
                <input type="number" min="1" className={field} value={form.capacity}
                  onChange={(e) => setForm({ ...form, capacity: e.target.value })} />
              </label>
              <label className="block text-sm text-slate-300">
                Trainer
                <select className={field} value={form.trainerId}
                  onChange={(e) => setForm({ ...form, trainerId: e.target.value })}>
                  <option value="">Unassigned</option>
                  {trainers.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </label>
              <label className="block text-sm text-slate-300">
                Starts
                <input type="date" className={field} value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
              </label>
              <label className="block text-sm text-slate-300">
                Ends
                <input type="date" className={field} value={form.endDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
              </label>
            </div>
            <label className="block text-sm text-slate-300">
              Schedule
              <input className={field} value={form.schedule}
                onChange={(e) => setForm({ ...form, schedule: e.target.value })}
                placeholder="Mon–Fri, 7–9pm IST" />
            </label>
            <button type="submit" disabled={busy}
              className="rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-semibold hover:bg-indigo-400 disabled:opacity-50">
              {busy ? 'Creating…' : 'Create batch'}
            </button>
          </form>
        )}

        {open && (
          <section className="rounded-2xl border border-indigo-400/30 bg-indigo-500/[0.05] p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">{open.name}</h2>
                <p className="mt-1 text-xs text-slate-400">
                  {open.batchCode} · {open.course.title} · {day(open.startDate)} to {day(open.endDate)}
                  {open.schedule ? ` · ${open.schedule}` : ''}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <select value={open.status} disabled={busy}
                  onChange={(e) => void patch(open.id, { status: e.target.value })}
                  className="rounded-lg border border-white/15 bg-slate-900 px-3 py-2 text-xs">
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <select value={open.trainer?.id ?? ''} disabled={busy}
                  onChange={(e) => void patch(open.id, { trainerId: e.target.value || null })}
                  className="rounded-lg border border-white/15 bg-slate-900 px-3 py-2 text-xs">
                  <option value="">No trainer</option>
                  {trainers.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
                <button type="button" onClick={() => setOpen(null)} className="text-xs text-slate-400 hover:text-white">
                  Close
                </button>
              </div>
            </div>

            <div className="mt-5 border-t border-white/10 pt-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-semibold">
                  Students · {open.members.length} of {open.capacity}
                </h3>
                {open.members.length >= open.capacity && (
                  <span className="rounded-full bg-amber-400/15 px-3 py-1 text-xs text-amber-300">Full</span>
                )}
              </div>

              <div className="mt-3 space-y-2">
                {open.members.length === 0 ? (
                  <p className="text-sm text-slate-500">Nobody in this batch yet.</p>
                ) : open.members.map((m: any) => (
                  <div key={m.id} className="flex items-center justify-between gap-3 rounded-lg bg-slate-950/60 px-3 py-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm">{m.user.name}</p>
                      <p className="truncate text-xs text-slate-500">
                        {m.user.email}
                        {m.user.candidate ? ` · ${m.user.candidate.candidateCode}` : ''}
                      </p>
                    </div>
                    <button type="button" disabled={busy}
                      onClick={() => void removeStudent(m.user.id, m.user.name)}
                      className="shrink-0 rounded-lg border border-rose-400/30 px-3 py-1 text-xs text-rose-300 hover:bg-rose-400/10">
                      Remove
                    </button>
                  </div>
                ))}
              </div>

              <div className="mt-5 rounded-xl border border-white/10 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Add a student</p>
                <div className="mt-2 flex gap-2">
                  <input value={pickerSearch}
                    onChange={(e) => setPickerSearch(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') void findStudents(pickerSearch); }}
                    placeholder="Search by name, email or phone…"
                    className="min-w-0 flex-1 rounded-lg border border-white/15 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-indigo-400" />
                  <button type="button" onClick={() => void findStudents(pickerSearch)}
                    className="rounded-lg border border-white/15 px-3 py-2 text-xs hover:bg-white/10">
                    Find
                  </button>
                </div>
                {picker.length > 0 && (
                  <ul className="mt-3 space-y-1.5">
                    {picker.map((s: any) => (
                      <li key={s.id} className="flex items-center justify-between gap-3 rounded-lg bg-slate-950/60 px-3 py-2">
                        <span className="min-w-0 truncate text-sm">
                          {s.name} <span className="text-slate-500">· {s.email}</span>
                        </span>
                        <button type="button" disabled={busy} onClick={() => void addStudent(s.id)}
                          className="shrink-0 rounded-lg bg-indigo-500 px-3 py-1 text-xs font-semibold hover:bg-indigo-400 disabled:opacity-50">
                          Add
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                <p className="mt-2 text-xs text-slate-500">
                  Adding a student also enrols them in {open.course.title}.
                </p>
              </div>
            </div>
          </section>
        )}

        <div className="space-y-3">
          {!data ? (
            <p className="rounded-2xl border border-white/10 p-6 text-sm text-slate-400">Loading…</p>
          ) : !data.batches.length ? (
            <p className="rounded-2xl border border-dashed border-white/15 p-10 text-center text-sm text-slate-400">
              No batches yet. Create one to group your first cohort.
            </p>
          ) : data.batches.map((b: any) => (
            <button key={b.id} type="button" onClick={() => void openBatch(b.id)}
              className="flex w-full flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left transition hover:border-indigo-400/40">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{b.name}</p>
                  <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${statusStyle[b.status]}`}>
                    {b.status}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {b.batchCode} · {b.course.title} · {b.trainer?.name ?? 'no trainer'} ·{' '}
                  {day(b.startDate)}{b.schedule ? ` · ${b.schedule}` : ''}
                </p>
              </div>
              <span className="shrink-0 text-sm tabular-nums text-slate-300">
                {b._count.members} / {b.capacity}
              </span>
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}
