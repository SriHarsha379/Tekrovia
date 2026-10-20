'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { adminApi, readAdminUser } from '../../../src/lib/admin-api';

const STATUSES = [
  'NEW', 'CONTACTED', 'INTERESTED', 'PROSPECT',
  'PIPELINE', 'PENDING_CLOSURE', 'ENROLLED', 'DROPPED',
];

const STAFF_ROLES = ['ADMIN', 'SUPER_ADMIN', 'COUNSELLOR'];

const statusStyle: Record<string, string> = {
  NEW: 'bg-sky-400/10 text-sky-300',
  CONTACTED: 'bg-indigo-400/10 text-indigo-300',
  INTERESTED: 'bg-violet-400/10 text-violet-300',
  PROSPECT: 'bg-amber-400/10 text-amber-300',
  PIPELINE: 'bg-orange-400/10 text-orange-300',
  PENDING_CLOSURE: 'bg-yellow-400/10 text-yellow-300',
  ENROLLED: 'bg-emerald-400/10 text-emerald-300',
  DROPPED: 'bg-slate-500/20 text-slate-400',
};

function when(value: string) {
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? '—'
    : d.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function AdminLeadsPage() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [owners, setOwners] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ALL');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');
  const [openNotes, setOpenNotes] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminApi.get('/leads/admin', {
        params: { search: search || undefined, status, page, limit: 25 },
      });
      setData(res.data);
    } catch (err) {
      setError(
        axios.isAxiosError(err)
          ? err.response?.data?.message || 'Could not load leads.'
          : 'Could not load leads.',
      );
    } finally {
      setLoading(false);
    }
  }, [search, status, page]);

  useEffect(() => {
    const user = readAdminUser();
    if (!user) { router.replace('/login'); return; }
    if (!STAFF_ROLES.includes(user.role ?? '')) { router.replace('/dashboard'); return; }
    void load();
    adminApi.get('/leads/admin/owners')
      .then((r) => setOwners(r.data))
      .catch(() => setOwners([]));
  }, [router, load]);

  async function patch(id: string, body: any) {
    setBusyId(id);
    setError('');
    try {
      await adminApi.patch(`/leads/admin/${id}`, body);
      await load();
    } catch (err) {
      setError(
        axios.isAxiosError(err)
          ? err.response?.data?.message || 'Update failed.'
          : 'Update failed.',
      );
    } finally {
      setBusyId('');
    }
  }

  const counts = data?.byStatus ?? {};

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-7">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-300">
              TekRovia · Administration
            </p>
            <h1 className="mt-2 text-3xl font-bold">Leads</h1>
            <p className="mt-2 text-sm text-slate-400">
              Everyone who asked for a free assessment through the website.
            </p>
          </div>
          <Link
            href="/admin"
            className="rounded-xl border border-white/15 px-4 py-2.5 text-sm font-semibold text-slate-200 hover:bg-white/10"
          >
            Back to admin
          </Link>
        </header>

        <section className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-8">
          {STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => { setStatus(s === status ? 'ALL' : s); setPage(1); }}
              className={`rounded-xl border p-3 text-left transition ${
                status === s
                  ? 'border-indigo-400/60 bg-indigo-500/10'
                  : 'border-white/10 bg-white/[0.03] hover:border-white/25'
              }`}
            >
              <p className="text-2xl font-bold tabular-nums">{counts[s] ?? 0}</p>
              <p className="mt-1 text-[11px] uppercase tracking-wide text-slate-400">
                {s.replace(/_/g, ' ')}
              </p>
            </button>
          ))}
        </section>

        <div className="flex flex-wrap gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { setPage(1); void load(); } }}
            placeholder="Search name, email, phone or code…"
            className="min-w-0 flex-1 rounded-xl border border-white/10 bg-slate-900 px-3 py-2.5 text-sm outline-none focus:border-indigo-400"
          />
          <button
            type="button"
            onClick={() => { setPage(1); void load(); }}
            className="rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-semibold hover:bg-indigo-400"
          >
            Search
          </button>
          {status !== 'ALL' && (
            <button
              type="button"
              onClick={() => { setStatus('ALL'); setPage(1); }}
              className="rounded-xl border border-white/15 px-4 py-2.5 text-sm text-slate-200 hover:bg-white/10"
            >
              Clear filter
            </button>
          )}
        </div>

        {error && (
          <p role="alert" className="rounded-xl border border-rose-400/30 bg-rose-400/10 p-4 text-sm text-rose-200">
            {error}
          </p>
        )}

        {loading ? (
          <p className="rounded-2xl border border-white/10 p-6 text-sm text-slate-400">Loading leads…</p>
        ) : !data?.leads?.length ? (
          <p className="rounded-2xl border border-dashed border-white/15 p-10 text-center text-sm text-slate-400">
            No leads match this search.
          </p>
        ) : (
          <div className="space-y-3">
            {data.leads.map((lead: any) => (
              <article key={lead.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold">{lead.name}</h3>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyle[lead.status] ?? ''}`}>
                        {lead.status.replace(/_/g, ' ')}
                      </span>
                      {lead.candidate && (
                        <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs text-emerald-300">
                          Converted · {lead.candidate.candidateCode}
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-sm text-slate-300">
                      <a href={`mailto:${lead.email}`} className="hover:text-indigo-300">{lead.email}</a>
                      {' · '}
                      <a href={`tel:${lead.phone}`} className="hover:text-indigo-300">{lead.phone}</a>
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {lead.leadCode} · {lead.courseInterest || 'No course stated'} ·{' '}
                      {lead.source || 'unknown source'}
                      {lead.utmCampaign ? ` · ${lead.utmCampaign}` : ''} · {when(lead.createdAt)}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={lead.status}
                      disabled={busyId === lead.id}
                      onChange={(e) => void patch(lead.id, { status: e.target.value })}
                      aria-label={`Status for ${lead.name}`}
                      className="rounded-lg border border-white/15 bg-slate-900 px-3 py-2 text-xs"
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                      ))}
                    </select>

                    <select
                      value={lead.owner?.id ?? ''}
                      disabled={busyId === lead.id}
                      onChange={(e) => void patch(lead.id, { ownerId: e.target.value || null })}
                      aria-label={`Owner for ${lead.name}`}
                      className="rounded-lg border border-white/15 bg-slate-900 px-3 py-2 text-xs"
                    >
                      <option value="">Unassigned</option>
                      {owners.map((o: any) => (
                        <option key={o.id} value={o.id}>{o.name}</option>
                      ))}
                    </select>

                    <button
                      type="button"
                      onClick={() => {
                        setOpenNotes(openNotes === lead.id ? null : lead.id);
                        setNoteDraft(lead.notes ?? '');
                      }}
                      className="rounded-lg border border-white/15 px-3 py-2 text-xs text-slate-200 hover:bg-white/10"
                    >
                      {lead.notes ? 'Notes ✓' : 'Add note'}
                    </button>
                  </div>
                </div>

                {openNotes === lead.id && (
                  <div className="mt-4 space-y-2 border-t border-white/10 pt-4">
                    <textarea
                      rows={3}
                      value={noteDraft}
                      onChange={(e) => setNoteDraft(e.target.value)}
                      placeholder="What happened on the call?"
                      className="w-full rounded-xl border border-white/15 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-indigo-400"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={busyId === lead.id}
                        onClick={async () => {
                          await patch(lead.id, { notes: noteDraft });
                          setOpenNotes(null);
                        }}
                        className="rounded-lg bg-indigo-500 px-4 py-2 text-xs font-semibold hover:bg-indigo-400"
                      >
                        Save note
                      </button>
                      <button
                        type="button"
                        onClick={() => setOpenNotes(null)}
                        className="rounded-lg border border-white/15 px-4 py-2 text-xs text-slate-200"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {lead.notes && openNotes !== lead.id && (
                  <p className="mt-3 border-t border-white/10 pt-3 text-sm leading-6 text-slate-400">
                    {lead.notes}
                  </p>
                )}
              </article>
            ))}

            {data.pages > 1 && (
              <div className="flex items-center justify-between pt-2 text-sm text-slate-400">
                <span>Page {data.page} of {data.pages} · {data.total} leads</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                    className="rounded-lg border border-white/15 px-3 py-1.5 disabled:opacity-30"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    disabled={page >= data.pages}
                    onClick={() => setPage((p) => p + 1)}
                    className="rounded-lg border border-white/15 px-3 py-1.5 disabled:opacity-30"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
