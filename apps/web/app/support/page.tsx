'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, MessageSquare, Plus } from 'lucide-react';

const API = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1`;

const CATEGORIES = [
  ['LMS', 'Course or lessons'],
  ['SCHEDULE', 'Schedule or classes'],
  ['TRAINER', 'Trainer'],
  ['ASSIGNMENT', 'Assignment'],
  ['PROJECT', 'Project'],
  ['PAYMENT', 'Payment'],
  ['INTERVIEW', 'Interview preparation'],
  ['RESUME', 'Resume'],
  ['PLACEMENT', 'Placement'],
  ['TECHNICAL', 'Something is broken'],
  ['OTHER', 'Something else'],
];

const statusLabel: Record<string, string> = {
  OPEN: 'Open',
  IN_PROGRESS: 'Being looked at',
  WAITING_ON_STUDENT: 'Waiting on you',
  RESOLVED: 'Resolved',
  CLOSED: 'Closed',
};

const statusStyle: Record<string, string> = {
  OPEN: 'bg-sky-100 text-sky-800',
  IN_PROGRESS: 'bg-amber-100 text-amber-800',
  WAITING_ON_STUDENT: 'bg-rose-100 text-rose-800',
  RESOLVED: 'bg-emerald-100 text-emerald-800',
  CLOSED: 'bg-slate-200 text-slate-700',
};

function token() {
  return typeof window === 'undefined'
    ? null
    : sessionStorage.getItem('tekrovia_access_token');
}

export default function SupportPage() {
  const router = useRouter();
  const [tickets, setTickets] = useState<any[]>([]);
  const [open, setOpen] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [reply, setReply] = useState('');
  const [form, setForm] = useState({ subject: '', body: '', category: 'LMS' });

  const load = useCallback(async () => {
    const t = token();
    if (!t) { router.replace('/login'); return; }
    try {
      const res = await fetch(`${API}/support/mine`, {
        headers: { Authorization: `Bearer ${t}` },
      });
      if (res.status === 401) { router.replace('/login'); return; }
      setTickets(await res.json());
    } catch {
      setError('Could not load your tickets.');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { void load(); }, [load]);

  async function openTicket(id: string) {
    const res = await fetch(`${API}/support/${id}`, {
      headers: { Authorization: `Bearer ${token()}` },
    });
    if (res.ok) setOpen(await res.json());
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setSending(true);
    setError('');
    try {
      const res = await fetch(`${API}/support`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token()}`,
        },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const b = await res.json().catch(() => null);
        setError(b?.message || 'Could not raise the ticket.');
        return;
      }
      setForm({ subject: '', body: '', category: 'LMS' });
      setShowForm(false);
      await load();
    } finally {
      setSending(false);
    }
  }

  async function sendReply() {
    if (!reply.trim() || !open) return;
    setSending(true);
    try {
      await fetch(`${API}/support/${open.id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token()}`,
        },
        body: JSON.stringify({ body: reply }),
      });
      setReply('');
      await openTicket(open.id);
      await load();
    } finally {
      setSending(false);
    }
  }

  if (loading) return <div className="p-8">Loading…</div>;

  return (
    <main className="mx-auto max-w-3xl p-8">
      <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900">
        <ArrowLeft className="h-4 w-4" />
        Back to dashboard
      </Link>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Help and support</h1>
          <p className="mt-1 text-sm text-gray-500">
            Raise anything you are stuck on. Someone from the team will reply.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          New ticket
        </button>
      </div>

      {error && (
        <p className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>
      )}

      {showForm && (
        <form onSubmit={submit} className="mt-6 space-y-3 rounded-xl border bg-gray-50 p-5">
          <label className="block text-sm font-medium">
            What is it about?
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
            >
              {CATEGORIES.map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>

          <label className="block text-sm font-medium">
            Subject
            <input
              required
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              placeholder="A short summary"
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
            />
          </label>

          <label className="block text-sm font-medium">
            What is happening?
            <textarea
              required
              rows={5}
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              placeholder="Include what you tried and what you expected."
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
            />
          </label>

          <button
            type="submit"
            disabled={sending}
            className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {sending ? 'Sending…' : 'Raise ticket'}
          </button>
        </form>
      )}

      {open && (
        <section className="mt-6 rounded-xl border p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-semibold">{open.subject}</h2>
              <p className="mt-1 text-xs text-gray-500">
                {open.ticketCode} · {open.category.replace(/_/g, ' ').toLowerCase()}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyle[open.status]}`}>
                {statusLabel[open.status]}
              </span>
              <button type="button" onClick={() => setOpen(null)} className="text-xs text-gray-500 hover:text-gray-900">
                Close
              </button>
            </div>
          </div>

          <p className="mt-4 whitespace-pre-wrap border-t pt-4 text-sm leading-7 text-gray-700">
            {open.body}
          </p>

          {open.comments?.map((c: any) => (
            <div
              key={c.id}
              className={`mt-3 rounded-lg p-3 text-sm ${
                c.author.role === 'STUDENT' ? 'bg-gray-50' : 'bg-blue-50'
              }`}
            >
              <p className="text-xs font-medium text-gray-600">{c.author.name}</p>
              <p className="mt-1 whitespace-pre-wrap leading-7 text-gray-800">{c.body}</p>
            </div>
          ))}

          {open.status !== 'CLOSED' && (
            <div className="mt-4 space-y-2 border-t pt-4">
              <textarea
                rows={3}
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder="Add a reply…"
                className="w-full rounded-lg border px-3 py-2 text-sm"
              />
              <button
                type="button"
                disabled={sending || !reply.trim()}
                onClick={() => void sendReply()}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                Send reply
              </button>
            </div>
          )}
        </section>
      )}

      <div className="mt-8 space-y-3">
        {tickets.length === 0 ? (
          <p className="rounded-xl border border-dashed p-10 text-center text-sm text-gray-500">
            You have not raised anything yet.
          </p>
        ) : (
          tickets.map((t: any) => (
            <button
              key={t.id}
              type="button"
              onClick={() => void openTicket(t.id)}
              className="flex w-full items-center justify-between gap-4 rounded-xl border p-4 text-left transition hover:border-blue-300 hover:bg-blue-50/40"
            >
              <div className="min-w-0">
                <p className="font-medium">{t.subject}</p>
                <p className="mt-1 text-xs text-gray-500">
                  {t.ticketCode} · {t._count.comments} replies
                  {t.owner ? ` · with ${t.owner.name}` : ' · unassigned'}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyle[t.status]}`}>
                  {statusLabel[t.status]}
                </span>
                <MessageSquare className="h-4 w-4 text-gray-400" />
              </div>
            </button>
          ))
        )}
      </div>
    </main>
  );
}
