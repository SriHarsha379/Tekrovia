"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../../../src/lib/api";
import { Loader2 } from "lucide-react";
import Link from "next/link";

const fetchStudent = (id: string) =>
  api.get(`/admin/students/${id}`).then((r) => r.data);

export default function CandidateDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: c, isLoading } = useQuery({
    queryKey: ["admin-student", id],
    queryFn: () => fetchStudent(id),
    enabled: !!id,
  });

  if (isLoading) return <div className="flex items-center gap-2 text-slate-400 p-8"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>;
  if (!c) return <p className="p-8 text-slate-400">Candidate not found.</p>;

  return (
    <div className="max-w-3xl space-y-6">
      <Link href="/admin/candidates" className="text-sm text-slate-400 hover:text-white">← Candidates</Link>

      {/* Header */}
      <div className="flex items-start gap-4 rounded-2xl border border-white/10 bg-slate-900/50 p-6">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-indigo-500/30 text-xl font-bold text-indigo-300">
          {c.fullName?.charAt(0)}
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-white">{c.fullName}</h1>
          <p className="text-sm text-slate-400">{c.email} · {c.phone}</p>
          <p className="mt-1 text-xs font-mono text-slate-500">{c.candidateCode}</p>
        </div>
        {c.classification && (
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
            c.classification === "PRO" ? "bg-emerald-500/20 text-emerald-300"
            : c.classification === "STARTER" ? "bg-amber-500/20 text-amber-300"
            : "bg-slate-700 text-slate-400"
          }`}>{c.classification}</span>
        )}
      </div>

      {/* Profile grid */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/50 overflow-hidden">
        <p className="border-b border-white/10 px-5 py-3 text-sm font-semibold text-white">Profile</p>
        <div className="grid grid-cols-2 gap-px bg-white/5">
          {[
            { label: "Education",        value: c.education },
            { label: "Graduation year",  value: c.graduationYear },
            { label: "Experience",       value: c.experienceYears != null ? `${c.experienceYears} yr(s)` : null },
            { label: "Target role",      value: c.targetRole },
            { label: "Course interest",  value: c.courseInterest },
            { label: "Coding pref",      value: c.codingPreference },
            { label: "Availability",     value: c.learningAvailability },
            { label: "Career gap",       value: c.careerGapMonths ? `${c.careerGapMonths} months` : "None" },
          ].map(({ label, value }) => (
            <div key={label} className="bg-slate-900/50 p-4">
              <p className="text-xs text-slate-500">{label}</p>
              <p className="mt-1 text-sm text-white">{value ?? "—"}</p>
            </div>
          ))}
        </div>
        {c.skills?.length > 0 && (
          <div className="border-t border-white/10 p-4">
            <p className="text-xs text-slate-500 mb-2">Skills</p>
            <div className="flex flex-wrap gap-2">
              {c.skills.map((s: string) => (
                <span key={s} className="rounded-full bg-indigo-500/20 px-3 py-0.5 text-xs text-indigo-300">{s}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Assessments */}
      {c.assessments?.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-slate-900/50 overflow-hidden">
          <p className="border-b border-white/10 px-5 py-3 text-sm font-semibold text-white">Assessments</p>
          <table className="w-full text-sm">
            <tbody className="divide-y divide-white/5">
              {c.assessments.map((a: any) => (
                <tr key={a.id} className="hover:bg-white/5">
                  <td className="px-5 py-3 text-slate-300">{a.title}</td>
                  <td className="px-5 py-3 text-center text-white font-semibold">
                    {a.score != null ? `${a.score}/${a.maxScore}` : "—"}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      a.status === "COMPLETED" ? "bg-emerald-500/20 text-emerald-300"
                      : a.status === "IN_PROGRESS" ? "bg-amber-500/20 text-amber-300"
                      : "bg-slate-700 text-slate-400"
                    }`}>{a.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Enrollments */}
      {c.enrollments?.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-white">Enrollments</p>
          {c.enrollments.map((e: any) => {
            const lessons = e.course?.modules?.flatMap((m: any) => m.lessons) ?? [];
            const completed = lessons.filter((l: any) => l.progress?.[0]?.isCompleted).length;
            const pct = lessons.length > 0 ? Math.round((completed / lessons.length) * 100) : 0;
            return (
              <div key={e.id} className="rounded-2xl border border-white/10 bg-slate-900/50 p-4">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-white">{e.course?.title}</p>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    e.status === "COMPLETED" ? "bg-emerald-500/20 text-emerald-300"
                    : e.status === "ACTIVE" ? "bg-indigo-500/20 text-indigo-300"
                    : "bg-slate-700 text-slate-400"
                  }`}>{e.status}</span>
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-indigo-500" style={{ width: `${pct}%` }} />
                </div>
                <p className="mt-1 text-xs text-slate-500">{completed}/{lessons.length} lessons · {pct}%</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
