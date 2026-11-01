"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { api } from "../../../src/lib/api";
import { useAuthStore } from "../../../src/store/auth";
import { toast } from "sonner";
import {
  FileText, Loader2, CheckCircle2, AlertCircle,
  Download, Sparkles, ChevronDown, ChevronUp,
} from "lucide-react";

const fetchCandidate = (userId: string) =>
  api.get(`/candidates/user/${userId}`).then((r) => r.data).catch(() => null);

export default function ResumeBuilderPage() {
  const { user } = useAuthStore();
  const [reviewResult, setReviewResult] = useState<any>(null);
  const [showReview, setShowReview] = useState(false);

  const { data: candidate } = useQuery({
    queryKey: ["candidate-me"],
    queryFn: () => fetchCandidate(user!.id),
    enabled: !!user?.id,
  });

  const { register, handleSubmit, watch } = useForm<any>({
    defaultValues: { resume_text: "", job_description: "" },
  });

  const resumeText = watch("resume_text");

  const reviewResume = useMutation({
    mutationFn: (data: any) =>
      api.post("/ai/resume-review", data).then((r) => r.data),
    onSuccess: (data) => {
      setReviewResult(data);
      setShowReview(true);
      toast.success("Resume reviewed!");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? "Review failed — check AI service");
    },
  });

  const scoreColor = (score: number) => {
    if (score >= 75) return "text-emerald-400";
    if (score >= 50) return "text-amber-400";
    return "text-red-400";
  };

  const classificationColor: Record<string, string> = {
    Strong:       "bg-emerald-500/20 text-emerald-300 border-emerald-400/20",
    Good:         "bg-blue-500/20 text-blue-300 border-blue-400/20",
    "Needs Work": "bg-red-500/20 text-red-300 border-red-400/20",
  };

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Resume Builder</h1>
        <p className="mt-1 text-sm text-slate-400">
          Paste your resume for an AI-powered ATS review and improvement suggestions.
        </p>
      </div>

      {/* Profile tip */}
      {candidate?.resumeUrl && (
        <div className="flex items-center gap-3 rounded-2xl border border-indigo-400/20 bg-indigo-500/5 p-4">
          <FileText className="h-5 w-5 shrink-0 text-indigo-400" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-slate-300">Resume on file</p>
            <a
              href={candidate.resumeUrl}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-indigo-400 hover:text-indigo-300 underline truncate block"
            >
              {candidate.resumeUrl}
            </a>
          </div>
        </div>
      )}

      {/* Resume input form */}
      <form
        onSubmit={handleSubmit((d) => reviewResume.mutate(d))}
        className="space-y-5 rounded-2xl border border-white/10 bg-slate-900/50 p-6"
      >
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-300">
            Paste your resume text *
          </label>
          <textarea
            {...register("resume_text", { required: true })}
            rows={12}
            placeholder="Paste the full text of your resume here — name, contact, summary, experience, skills, education, projects…"
            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500 resize-none font-mono leading-6"
          />
          <p className="mt-1 text-xs text-slate-600">
            {resumeText?.length ?? 0} characters
            {resumeText?.length < 100 && resumeText?.length > 0 && " — add more content for a better review"}
          </p>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-300">
            Job description (optional)
            <span className="ml-2 text-slate-500 font-normal">— paste the JD for a targeted review</span>
          </label>
          <textarea
            {...register("job_description")}
            rows={4}
            placeholder="Paste the job description you are applying for…"
            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500 resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={reviewResume.isPending || !resumeText?.trim()}
          className="flex items-center gap-2 rounded-xl bg-indigo-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-400 disabled:opacity-60 transition"
        >
          {reviewResume.isPending
            ? <Loader2 className="h-4 w-4 animate-spin" />
            : <Sparkles className="h-4 w-4" />}
          {reviewResume.isPending ? "Reviewing…" : "Review my resume"}
        </button>

        {!candidate && (
          <p className="text-xs text-amber-400 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            Complete your profile first for a more targeted review
          </p>
        )}
      </form>

      {/* Review results */}
      {reviewResult && (
        <div className="space-y-5">
          {/* Score header */}
          <div className={`flex items-center justify-between rounded-2xl border p-5 ${classificationColor[reviewResult.classification] ?? "border-white/10 bg-slate-900/50"}`}>
            <div>
              <p className="text-lg font-bold text-white">{reviewResult.classification}</p>
              <p className="text-sm text-slate-400 mt-0.5">Overall assessment</p>
            </div>
            <div className="text-right">
              <p className={`text-4xl font-bold ${scoreColor(reviewResult.overall_score)}`}>
                {reviewResult.overall_score}
                <span className="text-xl text-slate-500">/100</span>
              </p>
              <p className="text-xs text-slate-500 mt-1">ATS score: {reviewResult.ats_score}/100</p>
            </div>
          </div>

          {/* Section scores */}
          {reviewResult.sections?.length > 0 && (
            <div className="rounded-2xl border border-white/10 bg-slate-900/50 overflow-hidden">
              <button
                onClick={() => setShowReview((s) => !s)}
                className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-white/5 transition"
              >
                <p className="font-semibold text-white">Section Breakdown</p>
                {showReview ? <ChevronUp className="h-4 w-4 text-slate-500" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}
              </button>
              {showReview && (
                <div className="border-t border-white/10 divide-y divide-white/5">
                  {reviewResult.sections.map((section: any) => (
                    <div key={section.section} className="px-5 py-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-semibold text-white">{section.section}</p>
                        <span className={`text-sm font-bold ${scoreColor(section.score)}`}>
                          {section.score}/100
                        </span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-white/10 mb-2">
                        <div
                          className={`h-full rounded-full transition-all ${
                            section.score >= 75 ? "bg-emerald-500"
                            : section.score >= 50 ? "bg-amber-500"
                            : "bg-red-500"
                          }`}
                          style={{ width: `${section.score}%` }}
                        />
                      </div>
                      <p className="text-xs text-slate-400 leading-5">{section.feedback}</p>
                      {section.suggestions?.length > 0 && (
                        <ul className="mt-2 space-y-1">
                          {section.suggestions.map((s: string, i: number) => (
                            <li key={i} className="flex gap-1.5 text-xs text-slate-500">
                              <span className="text-indigo-400 shrink-0">→</span> {s}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Missing keywords */}
          {reviewResult.missing_keywords?.length > 0 && (
            <div className="rounded-2xl border border-amber-400/20 bg-amber-500/5 p-5">
              <p className="text-sm font-semibold text-amber-300 mb-3">
                Missing Keywords ({reviewResult.missing_keywords.length})
              </p>
              <div className="flex flex-wrap gap-2">
                {reviewResult.missing_keywords.map((kw: string) => (
                  <span
                    key={kw}
                    className="rounded-full border border-amber-400/20 bg-amber-500/10 px-2.5 py-0.5 text-xs text-amber-300"
                  >
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Strengths */}
          {reviewResult.strengths?.length > 0 && (
            <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/5 p-5">
              <p className="text-sm font-semibold text-emerald-300 mb-3">Strengths</p>
              <ul className="space-y-2">
                {reviewResult.strengths.map((s: string, i: number) => (
                  <li key={i} className="flex gap-2 text-sm text-slate-300">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Improvements */}
          {reviewResult.improvements?.length > 0 && (
            <div className="rounded-2xl border border-indigo-400/20 bg-indigo-500/5 p-5">
              <p className="text-sm font-semibold text-white mb-3">Improvements</p>
              <ul className="space-y-2">
                {reviewResult.improvements.map((s: string, i: number) => (
                  <li key={i} className="flex gap-2 text-sm text-slate-300">
                    <span className="text-indigo-400 shrink-0 font-bold">{i + 1}.</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Disclaimer */}
          <p className="text-xs text-slate-600 leading-5">
            {reviewResult.disclaimer}
          </p>
        </div>
      )}
    </div>
  );
}
