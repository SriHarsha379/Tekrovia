"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "../../../src/lib/api";
import { useAuthStore } from "../../../src/store/auth";
import {
  BrainCircuit, CheckCircle2, Calendar,
  Loader2, Star, AlertCircle,
} from "lucide-react";
import Link from "next/link";

const fetchCandidate = (userId: string) =>
  api.get(`/candidates/user/${userId}`).then((r) => r.data).catch(() => null);

const fetchMocks = (candidateId: string) =>
  api.get(`/placements/candidates/${candidateId}/mocks`).then((r) => r.data);

const fetchReadiness = () =>
  api.get("/placements/me/readiness").then((r) => r.data).catch(() => null);



export default function MockInterviewsPage() {
  const { user } = useAuthStore();

  const { data: candidate } = useQuery({
    queryKey: ["candidate-me"],
    queryFn: () => fetchCandidate(user!.id),
    enabled: !!user?.id,
  });

  const { data: mocks = [], isLoading } = useQuery({
    queryKey: ["my-mocks", candidate?.id],
    queryFn: () => fetchMocks(candidate.id),
    enabled: !!candidate?.id,
  });

  const { data: readiness } = useQuery({
    queryKey: ["my-readiness"],
    queryFn: fetchReadiness,
  });

  const mockChecks = readiness?.checks;

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-slate-400 p-8">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading…
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="max-w-xl space-y-6">
        <h1 className="text-2xl font-bold text-white">Mock Interviews</h1>
        <div className="flex items-start gap-3 rounded-2xl border border-amber-400/20 bg-amber-400/5 p-5">
          <AlertCircle className="h-5 w-5 shrink-0 text-amber-400 mt-0.5" />
          <p className="text-sm text-slate-300">
            Complete your{" "}
            <Link href="/dashboard/profile" className="text-indigo-400 underline">
              candidate profile
            </Link>{" "}
            to access mock interview tracking.
          </p>
        </div>
      </div>
    );
  }

  const completed = mocks.filter((m: any) => m.status === "COMPLETED");
  const scheduled = mocks.filter((m: any) => m.status === "SCHEDULED");
  const finalMock  = mocks.find((m: any) => m.isFinal);

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Mock Interviews</h1>
        <p className="mt-1 text-sm text-slate-400">
          Complete 3 expert mocks + a final mock (≥ 8/10) to unlock placement.
        </p>
      </div>

      {/* Progress summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          {
            label: "Completed",
            value: `${mockChecks?.expertMocks?.completedCount ?? completed.length} / ${mockChecks?.expertMocks?.requiredCount ?? 3}`,
            done: mockChecks?.expertMocks?.complete,
          },
          {
            label: "Final Mock Score",
            value: finalMock?.score != null
              ? `${finalMock.score}/${finalMock.maxScore}`
              : "—",
            done: mockChecks?.finalExpertMock?.complete,
          },
          {
            label: "Scheduled",
            value: scheduled.length,
            done: null,
          },
        ].map(({ label, value, done }) => (
          <div
            key={label}
            className={`rounded-2xl border p-4 ${
              done === true
                ? "border-emerald-400/20 bg-emerald-500/5"
                : done === false
                ? "border-white/10 bg-slate-900/50"
                : "border-white/10 bg-slate-900/50"
            }`}
          >
            <p className="text-xs text-slate-500">{label}</p>
            <p className="mt-2 text-2xl font-bold text-white">{value}</p>
            {done === true && (
              <p className="mt-1 text-xs text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> Requirement met
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Scheduled mocks */}
      {scheduled.length > 0 && (
        <div>
          <h2 className="mb-3 text-lg font-semibold text-white">Upcoming</h2>
          <div className="space-y-3">
            {scheduled.map((m: any) => (
              <div
                key={m.id}
                className="flex items-center gap-4 rounded-2xl border border-blue-400/20 bg-blue-500/5 p-4"
              >
                <Calendar className="h-8 w-8 shrink-0 text-blue-400" />
                <div className="flex-1">
                  <p className="font-semibold text-white">
                    Mock {m.sequence}{m.isFinal ? " (Final)" : ""}
                  </p>
                  {m.scheduledAt && (
                    <p className="text-sm text-slate-400 mt-0.5">
                      {new Date(m.scheduledAt).toLocaleString("en-IN", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </p>
                  )}
                  {m.reviewerName && (
                    <p className="text-xs text-slate-500 mt-0.5">
                      Interviewer: {m.reviewerName}
                    </p>
                  )}
                </div>
                <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-xs font-medium text-blue-300">
                  Scheduled
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Completed mocks */}
      {completed.length > 0 && (
        <div>
          <h2 className="mb-3 text-lg font-semibold text-white">Completed</h2>
          <div className="space-y-3">
            {completed.map((m: any) => {
              const pct = m.maxScore > 0 ? Math.round((m.score / m.maxScore) * 100) : 0;
              const passed = pct >= 80;
              return (
                <div
                  key={m.id}
                  className={`rounded-2xl border p-5 ${
                    passed
                      ? "border-emerald-400/20 bg-emerald-500/5"
                      : "border-white/10 bg-slate-900/50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-white">
                        Mock {m.sequence}
                        {m.isFinal && (
                          <span className="ml-2 text-xs text-indigo-400">Final</span>
                        )}
                      </p>
                      {m.reviewerName && (
                        <p className="text-xs text-slate-500 mt-0.5">
                          Interviewed by {m.reviewerName}
                        </p>
                      )}
                      {m.completedAt && (
                        <p className="text-xs text-slate-500">
                          {new Date(m.completedAt).toLocaleDateString("en-IN")}
                        </p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <div className="flex items-center gap-1 justify-end">
                        <Star className={`h-4 w-4 ${passed ? "text-emerald-400" : "text-slate-500"}`} />
                        <span className="text-xl font-bold text-white">
                          {m.score ?? "—"}
                        </span>
                        <span className="text-slate-500 text-sm">/{m.maxScore}</span>
                      </div>
                      <p className={`text-xs mt-0.5 ${passed ? "text-emerald-400" : "text-red-400"}`}>
                        {pct}% · {passed ? "Passed" : "Below 80%"}
                      </p>
                    </div>
                  </div>

                  {/* Score bar */}
                  <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
                    <div
                      className={`h-full rounded-full transition-all ${passed ? "bg-emerald-500" : "bg-red-500"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  {m.feedback && (
                    <div className="mt-4 rounded-xl bg-white/5 p-3">
                      <p className="text-xs font-semibold text-slate-500 mb-1">Feedback</p>
                      <p className="text-sm text-slate-300 leading-6">{m.feedback}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {mocks.length === 0 && (
        <div className="rounded-2xl border border-dashed border-white/10 p-12 text-center">
          <BrainCircuit className="mx-auto h-8 w-8 text-slate-600" />
          <p className="mt-3 text-sm text-slate-500">
            No mock interviews scheduled yet.
          </p>
          <p className="mt-2 text-xs text-slate-600">
            Your support team will schedule your expert mocks once you are ready.
          </p>
        </div>
      )}

      {/* Tip */}
      <div className="rounded-2xl border border-white/5 bg-slate-900/30 p-4">
        <p className="text-xs text-slate-500 leading-5">
          Expert mock interviews are scheduled by your support owner.
          Raise a{" "}
          <Link href="/dashboard/support" className="text-indigo-400 underline">
            support ticket
          </Link>{" "}
          if you are ready to book yours.
        </p>
      </div>
    </div>
  );
}
