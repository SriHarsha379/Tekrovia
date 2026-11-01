"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../../src/lib/api";
import { useAuthStore } from "../../../src/store/auth";
import { toast } from "sonner";
import {
  ClipboardCheck, Loader2, ChevronRight,
  CheckCircle2, Brain,
} from "lucide-react";
import InteractiveAssessment from "../../../src/components/InteractiveAssessment";

const fetchMyAssessments = (candidateId: string) =>
  api.get(`/assessments/candidate/${candidateId}`).then((r) => r.data);

const fetchCandidate = (userId: string) =>
  api.get(`/candidates/user/${userId}`).then((r) => r.data);

const statusColor: Record<string, string> = {
  COMPLETED: "bg-emerald-500/20 text-emerald-300",
  IN_PROGRESS: "bg-amber-500/20 text-amber-300",
  REVIEWED: "bg-indigo-500/20 text-indigo-300",
  DRAFT: "bg-slate-700 text-slate-400",
};

const typeLabel: Record<string, string> = {
  FREE_ASSESSMENT:   "Free Assessment",
  CAREER_READINESS:  "Career Readiness",
  TECHNICAL:         "Technical",
  MOCK_INTERVIEW:    "Mock Interview",
};

export default function AssessmentsPage() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [activeAssessment, setActiveAssessment] = useState<any | null>(null);
  const [view, setView] = useState<"list" | "interactive" | "result">("list");

  // Get candidate profile first
  const { data: candidate } = useQuery({
    queryKey: ["candidate-me"],
    queryFn: () => fetchCandidate(user!.id),
    enabled: !!user?.id,
  });

  const { data: assessments = [], isLoading } = useQuery({
    queryKey: ["my-assessments", candidate?.id],
    queryFn: () => fetchMyAssessments(candidate.id),
    enabled: !!candidate?.id,
  });

  // Career readiness (profile-based)
  const careerReadiness = useMutation({
    mutationFn: () =>
      api.post("/assessments/me/career-readiness").then((r) => r.data),
    onSuccess: (data) => {
      toast.success("Career readiness assessment complete!");
      setActiveAssessment(data);
      setView("result");
      qc.invalidateQueries({ queryKey: ["my-assessments"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? "Assessment failed");
    },
  });

  // Interactive (question-based)
  const startInteractive = useMutation({
    mutationFn: () =>
      api.post("/assessments/me/interactive").then((r) => r.data),
    onSuccess: (data) => {
      setActiveAssessment(data);
      setView("interactive");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? "Could not start assessment");
    },
  });

  if (view === "interactive" && activeAssessment) {
    return (
      <InteractiveAssessment
        data={activeAssessment}
        onComplete={(result) => {
          setActiveAssessment(result);
          setView("result");
          qc.invalidateQueries({ queryKey: ["my-assessments"] });
        }}
        onBack={() => setView("list")}
      />
    );
  }

  if (view === "result" && activeAssessment) {
    return <AssessmentResult data={activeAssessment} onBack={() => setView("list")} />;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Assessments</h1>
        <p className="mt-1 text-sm text-slate-400">
          Understand your current level and get a personalised learning roadmap.
        </p>
      </div>

      {/* Action cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/20">
            <ClipboardCheck className="h-5 w-5 text-indigo-400" />
          </div>
          <h3 className="mt-4 font-semibold text-white">Career Readiness Check</h3>
          <p className="mt-2 text-sm text-slate-400 leading-6">
            A quick profile-based estimate of where you stand and what to work on next.
          </p>
          <button
            onClick={() => careerReadiness.mutate()}
            disabled={careerReadiness.isPending || !candidate}
            className="mt-5 flex items-center gap-2 rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-400 disabled:opacity-60"
          >
            {careerReadiness.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Run assessment
          </button>
          {!candidate && (
            <p className="mt-2 text-xs text-amber-400">Complete your profile first.</p>
          )}
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/20">
            <Brain className="h-5 w-5 text-violet-400" />
          </div>
          <h3 className="mt-4 font-semibold text-white">Technical Skills Assessment</h3>
          <p className="mt-2 text-sm text-slate-400 leading-6">
            Answer a set of questions covering full-stack fundamentals and get instant feedback.
          </p>
          <button
            onClick={() => startInteractive.mutate()}
            disabled={startInteractive.isPending || !candidate}
            className="mt-5 flex items-center gap-2 rounded-xl bg-violet-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-400 disabled:opacity-60"
          >
            {startInteractive.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Start assessment
          </button>
          {!candidate && (
            <p className="mt-2 text-xs text-amber-400">Complete your profile first.</p>
          )}
        </div>
      </div>

      {/* History */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-white">Assessment History</h2>

        {isLoading ? (
          <div className="flex items-center gap-2 text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </div>
        ) : assessments.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 p-10 text-center">
            <p className="text-sm text-slate-500">No assessments taken yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {assessments.map((a: any) => (
              <button
                key={a.id}
                onClick={() => { setActiveAssessment(a); setView("result"); }}
                className="flex w-full items-center gap-4 rounded-2xl border border-white/10 bg-slate-900/50 p-4 text-left transition hover:border-indigo-400/30"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10">
                  <ClipboardCheck className="h-5 w-5 text-indigo-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white truncate">{a.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {typeLabel[a.type] ?? a.type}
                    {a.completedAt && ` · ${new Date(a.completedAt).toLocaleDateString("en-IN")}`}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {a.score != null && (
                    <span className="text-sm font-bold text-white">
                      {a.score}<span className="text-slate-500 text-xs">/{a.maxScore}</span>
                    </span>
                  )}
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColor[a.status] ?? "bg-slate-700 text-slate-400"}`}>
                    {a.status}
                  </span>
                  <ChevronRight className="h-4 w-4 text-slate-600" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function AssessmentResult({ data, onBack }: { data: any; onBack: () => void }) {
  const assessment = data.assessment ?? data;
  const responses = assessment?.responses as any;
  const roadmap = assessment?.roadmap as any;
  const score = assessment?.score;
  const maxScore = assessment?.maxScore ?? 100;
  const percent = Math.round((score / maxScore) * 100);

  const classColor: Record<string, string> = {
    PRO: "text-emerald-400",
    STARTER: "text-amber-400",
    BEGINNER: "text-red-400",
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <button onClick={onBack} className="text-sm text-slate-400 hover:text-white flex items-center gap-1">
        ← Back to assessments
      </button>

      <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-6">
        <h2 className="text-xl font-bold text-white">{assessment?.title}</h2>

        <div className="mt-5 flex items-center gap-6">
          <div className="text-center">
            <p className="text-4xl font-bold text-white">{score ?? "—"}</p>
            <p className="text-xs text-slate-500 mt-1">out of {maxScore}</p>
          </div>
          <div className="flex-1">
            <div className="h-3 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-indigo-500 transition-all"
                style={{ width: `${percent}%` }}
              />
            </div>
            <p className={`mt-2 text-sm font-semibold ${classColor[assessment?.classification] ?? "text-white"}`}>
              {assessment?.classification}
            </p>
          </div>
        </div>
      </div>

      {/* Factors (career readiness) */}
      {responses?.factors && (
        <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-6 space-y-4">
          <h3 className="font-semibold text-white">Profile Breakdown</h3>
          {responses.factors.map((f: any) => (
            <div key={f.key}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-300">{f.label}</span>
                <span className="text-slate-400">{f.score}/{f.maxScore}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-indigo-500"
                  style={{ width: `${Math.round((f.score / f.maxScore) * 100)}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-slate-500">{f.explanation}</p>
            </div>
          ))}
        </div>
      )}

      {/* Category results (interactive) */}
      {responses?.categoryResults && (
        <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-6 space-y-4">
          <h3 className="font-semibold text-white">Category Breakdown</h3>
          {responses.categoryResults.map((c: any) => (
            <div key={c.category}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-300">{c.category}</span>
                <span className="text-slate-400">{c.correct}/{c.total}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                <div
                  className={`h-full rounded-full transition-all ${c.percentage >= 80 ? "bg-emerald-500" : c.percentage >= 60 ? "bg-amber-500" : "bg-red-500"}`}
                  style={{ width: `${c.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Roadmap / Next steps */}
      {roadmap?.nextSteps && (
        <div className="rounded-2xl border border-indigo-400/20 bg-indigo-500/5 p-6">
          <h3 className="font-semibold text-white mb-3">Your Next Steps</h3>
          <ul className="space-y-2">
            {roadmap.nextSteps.map((step: string, i: number) => (
              <li key={i} className="flex gap-2 text-sm text-slate-300">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-indigo-400 mt-0.5" />
                {step}
              </li>
            ))}
          </ul>
        </div>
      )}

      {roadmap?.recommendations && (
        <div className="rounded-2xl border border-indigo-400/20 bg-indigo-500/5 p-6">
          <h3 className="font-semibold text-white mb-3">Recommendations</h3>
          <ul className="space-y-2">
            {roadmap.recommendations.map((r: string, i: number) => (
              <li key={i} className="flex gap-2 text-sm text-slate-300">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-indigo-400 mt-0.5" />
                {r}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
