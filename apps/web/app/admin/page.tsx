"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "../../src/lib/api";
import { Loader2, Users, BookOpen, ClipboardCheck, TrendingUp, AlertCircle } from "lucide-react";
import Link from "next/link";

const fetchOverview = () => api.get("/admin/overview").then((r) => r.data);

export default function AdminOverviewPage() {
  const { data, isLoading } = useQuery({ queryKey: ["admin-overview"], queryFn: fetchOverview });

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-slate-400 p-8">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading…
      </div>
    );
  }

  const c = data?.counts ?? {};
  const d = data?.delivery ?? {};

  const statCards = [
    { label: "Total Students",      value: c.totalStudents    ?? 0, icon: Users,          color: "text-indigo-400",  href: "/admin/candidates" },
    { label: "Total Leads",         value: c.totalLeads       ?? 0, icon: TrendingUp,      color: "text-violet-400",  href: "/admin/marketing" },
    { label: "Active Enrollments",  value: c.activeEnrollments?? 0, icon: BookOpen,        color: "text-emerald-400", href: "/admin/batches" },
    { label: "Assessments Done",    value: c.completedAssessments ?? 0, icon: ClipboardCheck, color: "text-amber-400", href: "/admin/candidates" },
  ];

  const deliveryCards = [
    { label: "Active Learners",              value: d.activeLearners              ?? 0 },
    { label: "Completed Enrollments",        value: d.completedEnrollments        ?? 0 },
    { label: "Assignments Awaiting Review",  value: d.assignmentsAwaitingReview   ?? 0, alert: true },
    { label: "Projects Awaiting Review",     value: d.projectSubmissionsAwaitingReview ?? 0, alert: true },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Admin Overview</h1>
        <p className="mt-1 text-sm text-slate-400">Platform-wide snapshot.</p>
      </div>

      {/* Top stats */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map(({ label, value, icon: Icon, color, href }) => (
          <Link
            key={label}
            href={href}
            className="rounded-2xl border border-white/10 bg-slate-900/50 p-5 transition hover:border-indigo-400/30"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-400">{label}</p>
              <Icon className={`h-5 w-5 ${color}`} />
            </div>
            <p className="mt-3 text-3xl font-bold text-white">{value}</p>
          </Link>
        ))}
      </div>

      {/* Delivery stats */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-white">Delivery</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {deliveryCards.map(({ label, value, alert }) => (
            <div
              key={label}
              className={`rounded-2xl border p-5 ${
                alert && value > 0
                  ? "border-amber-400/20 bg-amber-500/5"
                  : "border-white/10 bg-slate-900/50"
              }`}
            >
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-400">{label}</p>
                {alert && value > 0 && <AlertCircle className="h-4 w-4 text-amber-400" />}
              </div>
              <p className={`mt-3 text-3xl font-bold ${alert && value > 0 ? "text-amber-300" : "text-white"}`}>
                {value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Lead funnel */}
      {data?.leadStatuses?.length > 0 && (
        <div>
          <h2 className="mb-4 text-lg font-semibold text-white">Lead Funnel</h2>
          <div className="rounded-2xl border border-white/10 bg-slate-900/50 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Count</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {data.leadStatuses.map((row: any) => (
                  <tr key={row.status} className="hover:bg-white/5">
                    <td className="px-5 py-3 text-slate-300">{row.status}</td>
                    <td className="px-5 py-3 text-right font-semibold text-white">{row.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent candidates */}
      {data?.recentCandidates?.length > 0 && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Recent Candidates</h2>
            <Link href="/admin/candidates" className="text-sm text-indigo-400 hover:text-indigo-300">
              View all →
            </Link>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-900/50 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  {["Code", "Name", "Email", "Classification", "Joined"].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {data.recentCandidates.map((c: any) => (
                  <tr key={c.id} className="hover:bg-white/5">
                    <td className="px-5 py-3 font-mono text-xs text-slate-400">{c.candidateCode}</td>
                    <td className="px-5 py-3 text-white">{c.fullName}</td>
                    <td className="px-5 py-3 text-slate-400">{c.email}</td>
                    <td className="px-5 py-3">
                      {c.classification && (
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          c.classification === "PRO" ? "bg-emerald-500/20 text-emerald-300"
                          : c.classification === "STARTER" ? "bg-amber-500/20 text-amber-300"
                          : "bg-slate-700 text-slate-400"
                        }`}>{c.classification}</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-slate-500 text-xs">
                      {new Date(c.createdAt).toLocaleDateString("en-IN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
