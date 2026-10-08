'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';

type DataRecord = Record<string, unknown>;

type PlacementApplication = {
  id?: string;
  candidateId?: string;
  candidateName?: string;
  candidateEmail?: string;
  companyName?: string;
  jobTitle?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
};

const API_BASE =
  `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'}/api/v1`;

function asRecord(value: unknown): DataRecord {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as DataRecord)
    : {};
}

function getApplications(value: unknown): PlacementApplication[] {
  if (Array.isArray(value)) return value as PlacementApplication[];

  const record = asRecord(value);
  for (const key of ['applications', 'items', 'results', 'data']) {
    if (Array.isArray(record[key])) {
      return record[key] as PlacementApplication[];
    }
    const nested = asRecord(record[key]);
    for (const nestedKey of ['applications', 'items', 'results']) {
      if (Array.isArray(nested[nestedKey])) {
        return nested[nestedKey] as PlacementApplication[];
      }
    }
  }
  return [];
}

function labelize(value: string): string {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function displayValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'number') return value.toLocaleString();
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'string') return value;
  return '—';
}

function getMetrics(value: unknown): Array<[string, string]> {
  const record = asRecord(value);
  const source = asRecord(record.metrics ?? record.overview ?? record.pipeline);
  const entries = Object.entries(
    Object.keys(source).length ? source : record,
  ).filter(([, item]) =>
    ['string', 'number'].includes(typeof item) &&
    !['message', 'success', 'status', 'timestamp'].includes(
      String(item).toLowerCase(),
    ),
  );

  return entries.slice(0, 6).map(([key, item]) => [
    labelize(key),
    displayValue(item),
  ]);
}

function statusClass(status?: string): string {
  const normalized = (status ?? '').toLowerCase();
  if (['placed', 'hired', 'accepted', 'selected', 'completed'].includes(normalized)) {
    return 'bg-emerald-100 text-emerald-800';
  }
  if (['rejected', 'withdrawn', 'declined', 'cancelled'].includes(normalized)) {
    return 'bg-rose-100 text-rose-800';
  }
  if (['interview', 'shortlisted', 'offered', 'in_progress'].includes(normalized)) {
    return 'bg-blue-100 text-blue-800';
  }
  return 'bg-amber-100 text-amber-800';
}

export default function PlacementsPage() {
  const [overview, setOverview] = useState<unknown>(null);
  const [applications, setApplications] = useState<PlacementApplication[]>([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [appliedStatus, setAppliedStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError('');

    const token =
      typeof window !== 'undefined'
        ? window.sessionStorage.getItem('tekrovia_access_token')
        : null;

    if (!token) {
      setError('Please sign in with an admin account to view placement data.');
      setLoading(false);
      return;
    }

    const params = new URLSearchParams({ page: '1', limit: '20' });
    if (appliedSearch.trim()) params.set('search', appliedSearch.trim());
    if (appliedStatus) params.set('status', appliedStatus);

    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    };

    try {
      const [overviewResponse, applicationsResponse] = await Promise.all([
        fetch(`${API_BASE}/placements/overview`, { headers }),
        fetch(`${API_BASE}/placements/applications?${params.toString()}`, {
          headers,
        }),
      ]);

      if (!overviewResponse.ok) {
        throw new Error(
          `Overview request failed (${overviewResponse.status}).`,
        );
      }
      if (!applicationsResponse.ok) {
        throw new Error(
          `Applications request failed (${applicationsResponse.status}).`,
        );
      }

      const [overviewData, applicationsData] = await Promise.all([
        overviewResponse.json() as Promise<unknown>,
        applicationsResponse.json() as Promise<unknown>,
      ]);

      setOverview(overviewData);
      setApplications(getApplications(applicationsData));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to load placement data.',
      );
    } finally {
      setLoading(false);
    }
  }, [appliedSearch, appliedStatus]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  function handleFilter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAppliedSearch(search);
    setAppliedStatus(status);
  }

  const metrics = getMetrics(overview);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="mb-2 text-sm text-slate-500">
              <Link href="/admin" className="hover:text-blue-700">
                Admin
              </Link>
              <span className="mx-2">/</span>
              <span>Placements</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Placement Management
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Track candidate applications, interviews and offers.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void loadDashboard()}
            disabled={loading}
            className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold shadow-sm hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Refreshing…' : 'Refresh data'}
          </button>
        </header>

        {error && (
          <div
            role="alert"
            className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"
          >
            <p className="font-semibold">Could not load placement data</p>
            <p className="mt-1">{error}</p>
            <p className="mt-2 text-rose-700">
              Check your admin session and ensure the API is running.
            </p>
            <Link
              href="/login"
              className="mt-2 inline-block font-semibold underline"
            >
              Go to login
            </Link>
          </div>
        )}

        <section aria-label="Placement overview">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Overview</h2>
            <span className="text-xs text-slate-500">
              Live API data
            </span>
          </div>

          {loading && !overview ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="h-28 animate-pulse rounded-xl border border-slate-200 bg-white"
                />
              ))}
            </div>
          ) : metrics.length ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {metrics.map(([label, value]) => (
                <article
                  key={label}
                  className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <p className="text-sm font-medium text-slate-500">{label}</p>
                  <p className="mt-3 text-3xl font-bold tracking-tight">
                    {value}
                  </p>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
              {overview
                ? 'The overview endpoint returned data, but no top-level metrics were recognized. We can map its exact response fields next.'
                : 'Overview metrics will appear here when the API returns data.'}
            </div>
          )}
        </section>

        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold">Applications</h2>
              <p className="mt-1 text-sm text-slate-500">
                Search and filter placement applications.
              </p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-600">
              {applications.length} shown
            </span>
          </div>

          <form
            onSubmit={handleFilter}
            className="flex flex-col gap-3 border-b border-slate-200 p-5 md:flex-row"
          >
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search candidate, company or job title"
              aria-label="Search applications"
              className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              aria-label="Filter by status"
              className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
            >
              <option value="">All statuses</option>
              <option value="APPLIED">Applied</option>
              <option value="SHORTLISTED">Shortlisted</option>
              <option value="INTERVIEW">Interview</option>
              <option value="OFFERED">Offered</option>
              <option value="PLACED">Placed</option>
              <option value="REJECTED">Rejected</option>
              <option value="WITHDRAWN">Withdrawn</option>
            </select>
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Apply filters
            </button>
          </form>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">Candidate</th>
                  <th className="px-5 py-3 font-semibold">Company</th>
                  <th className="px-5 py-3 font-semibold">Job title</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold">Updated</th>
                  <th className="px-5 py-3 font-semibold">Application ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {applications.map((application, index) => (
                  <tr
                    key={application.id ?? `${application.candidateId ?? 'app'}-${index}`}
                    className="hover:bg-slate-50"
                  >
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-800">
                        {application.candidateName ??
                          application.candidateEmail ??
                          application.candidateId ??
                          'Candidate'}
                      </p>
                      {application.candidateName && application.candidateEmail && (
                        <p className="mt-0.5 text-xs text-slate-500">
                          {application.candidateEmail}
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      {application.companyName ?? '—'}
                    </td>
                    <td className="px-5 py-4">
                      {application.jobTitle ?? '—'}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(application.status)}`}
                      >
                        {labelize(application.status ?? 'Pending')}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {application.updatedAt
                        ? new Date(application.updatedAt).toLocaleDateString()
                        : application.createdAt
                          ? new Date(application.createdAt).toLocaleDateString()
                          : '—'}
                    </td>
                    <td className="px-5 py-4 font-mono text-xs text-slate-500">
                      {application.id ?? '—'}
                    </td>
                  </tr>
                ))}
                {!loading && !error && applications.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-12 text-center text-slate-500"
                    >
                      <p className="font-medium text-slate-700">
                        No applications found
                      </p>
                      <p className="mt-1 text-sm">
                        Try changing your search or status filter.
                      </p>
                    </td>
                  </tr>
                )}
                {loading && applications.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-12 text-center text-slate-500"
                    >
                      Loading applications…
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="border-t border-slate-200 px-5 py-3 text-xs text-slate-500">
            Showing up to 20 applications per request.
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-semibold">Interview management</h2>
            <p className="mt-1 text-sm text-slate-600">
              Schedule interviews and track rounds, outcomes and feedback from
              each application.
            </p>
            <p className="mt-3 text-xs text-slate-500">
              Interview actions will be available from application details.
            </p>
          </article>
          <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-semibold">Offer management</h2>
            <p className="mt-1 text-sm text-slate-600">
              Create offers and manage offer details and statuses for
              candidates.
            </p>
            <p className="mt-3 text-xs text-slate-500">
              Offer actions will be available from application details.
            </p>
          </article>
        </section>
      </div>
    </main>
  );
}
