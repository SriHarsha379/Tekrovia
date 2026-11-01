"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../../src/lib/api";
import { Loader2, Search, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

const fetchStudents = (params: Record<string, string>) =>
  api.get("/admin/students", { params }).then((r) => r.data);

export default function CandidatesPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-students", query, page],
    queryFn: () => fetchStudents({ search: query, page: String(page), limit: "15" }),
  });

  const candidates = data?.data ?? [];
  const pagination = data?.pagination ?? {};

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Candidates</h1>
        <p className="mt-1 text-sm text-slate-400">
          Search and manage all candidate profiles.
        </p>
      </div>

      {/* Search */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { setQuery(search); setPage(1); } }}
            placeholder="Search by name, email, phone, code…"
            className="w-full rounded-xl border border-white/10 bg-slate-900/50 py-2.5 pl-9 pr-4 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500"
          />
        </div>
        <button
          onClick={() => { setQuery(search); setPage(1); }}
          className="rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-400"
        >
          Search
        </button>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center gap-2 text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      ) : candidates.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 p-12 text-center">
          <p className="text-sm text-slate-500">No candidates found.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-slate-900/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  {["Code", "Name", "Email", "Phone", "Target Role", "Classification", "Enrolled", "Joined"].map((h) => (
                    <th key={h} className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {candidates.map((c: any) => (
                  <tr key={c.id} className="hover:bg-white/5 transition">
                    <td className="px-4 py-3 font-mono text-xs text-slate-400 whitespace-nowrap">
                      <Link href={`/admin/candidates/${c.id}`} className="hover:text-indigo-400">
                        {c.candidateCode}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-white whitespace-nowrap">
                      <Link href={`/admin/candidates/${c.id}`} className="hover:text-indigo-300">
                        {c.fullName}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-400">{c.email}</td>
                    <td className="px-4 py-3 text-slate-400">{c.phone}</td>
                    <td className="px-4 py-3 text-slate-300">{c.targetRole ?? "—"}</td>
                    <td className="px-4 py-3">
                      {c.classification ? (
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          c.classification === "PRO" ? "bg-emerald-500/20 text-emerald-300"
                          : c.classification === "STARTER" ? "bg-amber-500/20 text-amber-300"
                          : "bg-slate-700 text-slate-400"
                        }`}>{c.classification}</span>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-3 text-center text-slate-300">{c._count?.enrollments ?? 0}</td>
                    <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                      {new Date(c.createdAt).toLocaleDateString("en-IN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-white/10 px-5 py-3">
              <p className="text-xs text-slate-500">
                Page {pagination.page} of {pagination.totalPages} · {pagination.total} total
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="flex items-center gap-1 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-slate-400 hover:text-white disabled:opacity-40"
                >
                  <ChevronLeft className="h-3 w-3" /> Prev
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={page === pagination.totalPages}
                  className="flex items-center gap-1 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-slate-400 hover:text-white disabled:opacity-40"
                >
                  Next <ChevronRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
