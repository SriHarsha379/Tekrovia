'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { adminApi, readAdminUser } from '../../../src/lib/admin-api';

const STAFF = ['ADMIN', 'SUPER_ADMIN', 'SUPPORT_STAFF', 'COUNSELLOR', 'TRAINER'];
const STATUSES = ['OPEN', 'IN_PROGRESS', 'WAITING_ON_STUDENT', 'RESOLVED', 'CLOSED'];
const PRIORITIES = ['LOW', 'NORMAL', 'HIGH', 'URGENT'];
const CATEGORIES = [
  'LMS', 'PAYMENT', 'SCHEDULE', 'TRAINER', 'ASSIGNMENT', 'PROJECT',
  'INTERVIEW', 'RESUME', 'MOCK', 'PLACEMENT', 'TECHNICAL', 'OTHER',
];

const priorityStyle: Record<string, string> = {
  URGENT: 'bg-rose-400/15 text-rose-300',
  HIGH: 'bg-amber-400/15 text-amber-300',
  NORMAL: 'bg-slate-500/20 text-slate-300',
  LOW: 'bg-slate-600/20 text-slate-400',
};

function when(v?: string | null) {
  if (!v) return '—';
  const d = new Date(v);
  return d.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function isOverdue(t: any) {
  return t.dueAt && new Date(t.dueAt) < new Date()
    && !['RESOLVED', 'CLOSED'].includes(t.status);
}

export default function SupportQueuePage() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [agents, setAgents] = useState<any[]>([]);
  const [status, setStatus] = useState('ALL');
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState<any>(null);
  const [reply, setReply] = useState('');
  const [internal, setInternal] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const res = await adminApi.get('/support/queue', {
        params: {
          status,
          overdue: overdueOnly ? 'true' : undefined,
          search: search || undefined,
        },
      });
      setData(res.data);
    } catch (err) {
      setError(axios.isAxiosError(err)
        ? err.response?.data?.message || 'Could not load the queue.'
        : 'Could not load the queue.');
    }
  }, [status, overdueOnly, search]);

  useEffect(() => {
    const user = readAdminUser();
    if (!user) { router.replace('/login'); return; }
    if (!STAFF.includes(user.role ?? '')) { router.replace('/dashboard'); return; }
    void load();
    adminApi.get('/support/agents').then((r) => setAgents(r.data)).catch(() => setAgents([]));
  }, [router, load]);

  async function openTicket(id: string) {
    const res = await adminApi.get(`/support/${id}`);
    setOpen(res.data);
  }

  async function patch(id: string, body: any) {
    setBusy(true);
    try {
      await adminApi.patch(`/support/${id}`, body);
      await load();
      if (open?.id === id) await openTicket(id);
    } finally {
      setBusy(false);
    }
  }

  async function send() {
    if (!reply.trim() || !open) return;
    setBusy(true);
    try {
      await adminApi.post(`/support/${open.id}/comments`, {
        body: reply, isInternal: internal,
      });
      setReply('');
      setInternal(false);
      await openTicket(open.id);
      await load();
    } finally {
      setBusy(false);
    }
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
            <h1 className="mt-2 text-3xl font-bold">Support queue</h1>
          </div>
          <Link href="/admin" className="rounded-xl border border-white/15 px-4 py-2.5 text-sm font-semibold hover:bg-white/10">
            Back to admin
          </Link>
        </header>

        <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => { setStatus(s === status ? 'ALL' : s); setOverdueOnly(false); }}
              className={`rounded-xl border p-3 text-left transition ${
                status === s ? 'border-indigo-400/60 bg-indigo-500/10' : 'border-white/10 bg-white/[0.03]'
              }`}
            >
              <p className="text-2xl font-bold tabular-nums">{counts[s] ?? 0}</p>
              <p className="mt-1 text-[11px] uppercase tracking-wide text-slate-400">
                {s.replace(/_/g, ' ')}
              </p>
            </button>
          ))}
          <button
            type="button"
            onClick={() => { setOverdueOnly((v) => !v); setStatus('ALL'); }}
            className={`rounded-xl border p-3 text-left transition ${
              overdueOnly ? 'border-rose-400/60 bg-rose-500/10' : 'border-rose-400/20 bg-rose-500/[0.05]'
            }`}
          >
            <p className="text-2xl font-bold tabular-nums text-rose-300">{data?.overdue ?? 0}</p>
            <p className="mt-1 text-[11px] uppercase tracking-wide text-rose-300/70">Overdue</p>
          </button>
        </section>

        <div className="flex flex-wrap gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') void load(); }}
            placeholder="Search subject, code, student…"
            className="min-w-0 flex-1 rounded-xl border border-white/10 bg-slate-900 px-3 py-2.5 text-sm outline-none focus:border-indigo-400"
          />
          <button type="button" onClick={() => void load()} className="rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-semibold hover:bg-indigo-400">
            Search
          </button>
        </div>

        {error && <p className="rounded-xl border border-rose-400/30 bg-rose-400/10 p-4 text-sm text-rose-200">{error}</p>}

        {open && (
          <section className="rounded-2xl border border-indigo-400/30 bg-indigo-500/[0.05] p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="font-semibold">{open.subject}</h2>
                <p className="mt-1 text-xs text-slate-400">
                  {open.ticketCode} · {open.user.name} ({open.user.email}) · raised {when(open.createdAt)}
                  {open.dueAt ? ` · due ${when(open.dueAt)}` : ''}
                </p>
              </div>
              <button type="button" onClick={() => setOpen(null)} className="text-xs text-slate-400 hover:text-white">
                Close
              </button>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <select value={open.status} disabled={busy}
                onChange={(e) => void patch(open.id, { status: e.target.value })}
                className="rounded-lg border border-white/15 bg-slate-900 px-3 py-2 text-xs">
                {STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
              </select>
              <select value={open.priority} disabled={busy}
                onChange={(e) => void patch(open.id, { priority: e.target.value })}
                className="rounded-lg border border-white/15 bg-slate-900 px-3 py-2 text-xs">
                {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
              <select value={open.category} disabled={busy}
                onChange={(e) => void patch(open.id, { category: e.target.value })}
                className="rounded-lg border border-white/15 bg-slate-900 px-3 py-2 text-xs">
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <select value={open.owner?.id ?? ''} disabled={busy}
                onChange={(e) => void patch(open.id, { ownerId: e.target.value || null })}
                className="rounded-lg border border-white/15 bg-slate-900 px-3 py-2 text-xs">
                <option value="">Unassigned</option>
                {agents.map((a: any) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>

            <p className="mt-4 whitespace-pre-wrap border-t border-white/10 pt-4 text-sm leading-7 text-slate-300">
              {open.body}
            </p>

            {open.comments?.map((c: any) => (
              <div key={c.id} className={`mt-3 rounded-lg p-3 text-sm ${
                c.isInternal ? 'border border-amber-400/30 bg-amber-400/[0.07]'
                : c.author.role === 'STUDENT' ? 'bg-white/[0.04]' : 'bg-indigo-500/10'
              }`}>
                <p className="text-xs font-medium text-slate-400">
                  {c.author.name}
                  {c.isInternal && <span className="ml-2 text-amber-300">internal note</span>}
                </p>
                <p className="mt-1 whitespace-pre-wrap leading-7 text-slate-200">{c.body}</p>
              </div>
            ))}

            <div className="mt-4 space-y-2 border-t border-white/10 pt-4">
              <textarea rows={3} value={reply} onChange={(e) => setReply(e.target.value)}
                placeholder={internal ? 'Internal note — the student will not see this' : 'Reply to the student…'}
                className="w-full rounded-xl border border-white/15 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-indigo-400" />
              <div className="flex flex-wrap items-center gap-3">
                <button type="button" disabled={busy || !reply.trim()} onClick={() => void send()}
                  className="rounded-lg bg-indigo-500 px-4 py-2 text-xs font-semibold hover:bg-indigo-400 disabled:opacity-50">
                  Send
                </button>
                <label className="flex items-center gap-2 text-xs text-slate-400">
                  <input type="checkbox" checked={internal} onChange={(e) => setInternal(e.target.checked)} />
                  Internal note
                </label>
              </div>
            </div>
          </section>
        )}

        <div className="space-y-3">
          {!data ? (
            <p className="rounded-2xl border border-white/10 p-6 text-sm text-slate-400">Loading…</p>
          ) : !data.tickets.length ? (
            <p className="rounded-2xl border border-dashed border-white/15 p-10 text-center text-sm text-slate-400">
              Nothing in the queue.
            </p>
          ) : data.tickets.map((t: any) => (
            <button key={t.id} type="button" onClick={() => void openTicket(t.id)}
              className={`flex w-full flex-wrap items-center justify-between gap-4 rounded-2xl border p-4 text-left transition hover:border-indigo-400/40 ${
                isOverdue(t) ? 'border-rose-400/40 bg-rose-500/[0.05]' : 'border-white/10 bg-white/[0.03]'
              }`}>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{t.subject}</p>
                  <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${priorityStyle[t.priority]}`}>
                    {t.priority}
                  </span>
                  {isOverdue(t) && (
                    <span className="rounded-full bg-rose-400/15 px-2.5 py-0.5 text-[11px] font-semibold text-rose-300">
                      OVERDUE
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {t.ticketCode} · {t.user.name} · {t.category} · {t._count.comments} replies ·{' '}
                  {t.owner?.name ?? 'unassigned'} · {when(t.createdAt)}
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-white/5 px-3 py-1 text-xs text-slate-300">
                {t.status.replace(/_/g, ' ')}
              </span>
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}
