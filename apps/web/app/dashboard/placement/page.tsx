"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "../../../src/lib/api";
import {
  CheckCircle2, XCircle, Clock,
  Loader2, ShieldCheck, AlertTriangle,
} from "lucide-react";

const fetchReadiness = () =>
  api.get("/placements/me/readiness").then((r) => r.data);

export default function PlacementPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["my-readiness"],
    queryFn: fetchReadiness,
  });

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-slate-400 p-8">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading placement status…
      </div>
    );
  }

  // No candidate profile yet
  if (!data || data.profileComplete === false && !data.checks) {
    return (
      <div className="max-w-xl space-y-6">
        <h1 className="text-2xl font-bold text-white">Placement</h1>
        <div className="flex items-start gap-3 rounded-2xl border border-amber-400/20 bg-amber-400/5 p-5">
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-400 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-300">Profile required</p>
            <p className="mt-1 text-sm text-slate-400">
              Complete your candidate profile to unlock placement readiness tracking.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const { checks, allEvidenceComplete, decision, recovery } = data;

  const decisionColor: Record<string, string> = {
    APPROVED:   "bg-emerald-500/20 text-emerald-300 border-emerald-400/20",
    NEEDS_WORK: "bg-red-500/20 text-red-300 border-red-400/20",
    PENDING:    "bg-amber-500/20 text-amber-300 border-amber-400/20",
  };

  const decisionIcon: Record<string, React.ReactNode> = {
    APPROVED:   <CheckCircle2 className="h-5 w-5 text-emerald-400" />,
    NEEDS_WORK: <XCircle className="h-5 w-5 text-red-400" />,
    PENDING:    <Clock className="h-5 w-5 text-amber-400" />,
  };

  const checkItems = [
    {
      key: "expertMocks",
      label: "Expert Mock Interviews",
      desc: `${checks.expertMocks.completedCount} of ${checks.expertMocks.requiredCount} completed`,
      done: checks.expertMocks.complete,
    },
    {
      key: "finalExpertMock",
      label: "Final Mock Score ≥ 8/10",
      desc: checks.finalExpertMock.score != null
        ? `Score: ${checks.finalExpertMock.score}/${checks.finalExpertMock.maxScore}`
        : "Not yet taken",
      done: checks.finalExpertMock.complete,
    },
    {
      key: "expertApprovedProject",
      label: "Expert-Approved Project",
      desc: `${checks.expertApprovedProject.approvedCount} project(s) approved`,
      done: checks.expertApprovedProject.complete,
    },
    {
      key: "technicalAssessment",
      label: "Technical Assessment ≥ 80%",
      desc: checks.technicalAssessment.score != null
        ? `Score: ${checks.technicalAssessment.score}/${checks.technicalAssessment.maxScore}`
        : "Not yet taken",
      done: checks.technicalAssessment.complete,
    },
  ];

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Placement Readiness</h1>
        <p className="mt-1 text-sm text-slate-400">
          Complete all four requirements to unlock active placement support.
        </p>
      </div>

      {/* Overall status */}
      <div className={`flex items-center gap-3 rounded-2xl border p-5 ${decisionColor[decision] ?? decisionColor.PENDING}`}>
        {decisionIcon[decision]}
        <div>
          <p className="font-semibold">
            {decision === "APPROVED"
              ? "You are approved for placement!"
              : decision === "NEEDS_WORK"
              ? "Some areas need work"
              : "Readiness pending review"}
          </p>
          <p className="mt-0.5 text-xs opacity-80">
            {allEvidenceComplete
              ? "All evidence complete — awaiting human review."
              : "Complete the checklist below to qualify."}
          </p>
        </div>
      </div>

      {/* Checklist */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-white">Readiness Checklist</h2>
        {checkItems.map(({ key, label, desc, done }) => (
          <div
            key={key}
            className={`flex items-center gap-4 rounded-2xl border p-4 ${
              done
                ? "border-emerald-400/20 bg-emerald-500/5"
                : "border-white/10 bg-slate-900/50"
            }`}
          >
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
              done ? "bg-emerald-500/20" : "bg-slate-800"
            }`}>
              {done ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              ) : (
                <XCircle className="h-5 w-5 text-slate-600" />
              )}
            </div>
            <div className="flex-1">
              <p className={`text-sm font-semibold ${done ? "text-emerald-300" : "text-white"}`}>
                {label}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
            </div>
            <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
              done
                ? "bg-emerald-500/20 text-emerald-300"
                : "bg-slate-700 text-slate-400"
            }`}>
              {done ? "Done" : "Pending"}
            </span>
          </div>
        ))}
      </div>

      {/* Profile completeness */}
      {!data.profileComplete && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-400/20 bg-amber-400/5 p-5">
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-400 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-300">Incomplete profile</p>
            <p className="mt-1 text-sm text-slate-400">
              A complete profile is required before placement applications can be submitted.
              Go to{" "}
              <a href="/dashboard/profile" className="text-indigo-400 underline">
                My Profile
              </a>{" "}
              to fill in the missing fields.
            </p>
          </div>
        </div>
      )}

      {/* Recovery rule */}
      {recovery?.recoveryNeeded && (
        <div className="rounded-2xl border border-red-400/20 bg-red-500/5 p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-4 w-4 text-red-400" />
            <p className="text-sm font-semibold text-red-300">
              4-Interview Recovery Rule Active
            </p>
          </div>
          <p className="text-sm text-slate-400 leading-6">
            You have had {recovery.failedInterviewCount} unsuccessful interviews.
            Submissions are paused while your trainer reviews your skill gaps.
            After a brush-up session and reassessment you will re-enter the placement pipeline.
          </p>
        </div>
      )}

      {/* Disclaimer */}
      <div className="rounded-2xl border border-white/5 bg-slate-900/30 p-4">
        <div className="flex items-center gap-2 mb-2">
          <ShieldCheck className="h-4 w-4 text-slate-500" />
          <p className="text-xs font-semibold text-slate-500">Placement disclaimer</p>
        </div>
        <p className="text-xs text-slate-600 leading-5">
          Placement support provides structured assistance — job matching, submission
          coordination and feedback tracking. Participation does not guarantee an
          interview, job offer or employment outcome.
        </p>
      </div>
    </div>
  );
}
