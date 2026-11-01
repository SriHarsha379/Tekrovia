"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "../../../src/lib/api";
import { toast } from "sonner";
import {
  FolderKanban, CheckCircle2, XCircle, Clock,
  Lock, Loader2, Send, ChevronDown, ChevronUp,
} from "lucide-react";

const submitSchema = z.object({
  submissionText: z.string().optional(),
  submissionUrl:  z.string().url("Enter a valid URL").optional().or(z.literal("")),
}).refine((d) => d.submissionText?.trim() || d.submissionUrl?.trim(), {
  message: "Add submission text or a link",
  path: ["submissionText"],
});
type SubmitForm = z.infer<typeof submitSchema>;

const fetchMyProjects = () => api.get("/projects/my").then((r) => r.data);

const statusColor: Record<string, string> = {
  SUBMITTED:         "bg-amber-500/20 text-amber-300",
  APPROVED:          "bg-emerald-500/20 text-emerald-300",
  CHANGES_REQUESTED: "bg-red-500/20 text-red-300",
};

export default function ProjectsPage() {
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [activeSubmit, setActiveSubmit] = useState<string | null>(null);

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["my-projects"],
    queryFn: fetchMyProjects,
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<SubmitForm>({
    resolver: zodResolver(submitSchema),
  });

  const submit = useMutation({
    mutationFn: ({ milestoneId, data }: { milestoneId: string; data: SubmitForm }) =>
      api.post(`/projects/milestones/${milestoneId}/submit`, data).then((r) => r.data),
    onSuccess: () => {
      toast.success("Milestone submitted!");
      reset();
      setActiveSubmit(null);
      qc.invalidateQueries({ queryKey: ["my-projects"] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? "Submission failed"),
  });

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-slate-400 p-8">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading projects…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Projects</h1>
        <p className="mt-1 text-sm text-slate-400">
          Complete each milestone in order. Final milestones require expert approval.
        </p>
      </div>

      {projects.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 p-12 text-center">
          <FolderKanban className="mx-auto h-8 w-8 text-slate-600" />
          <p className="mt-3 text-sm text-slate-500">
            No projects yet — enroll in a course to unlock projects.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {projects.map((project: any) => {
            const isOpen = expanded === project.id;
            const approvedCount = project.milestones.filter(
              (m: any) => m.latestStatus === "APPROVED"
            ).length;
            const totalCount = project.milestones.length;
            const pct = totalCount > 0 ? Math.round((approvedCount / totalCount) * 100) : 0;

            return (
              <div
                key={project.id}
                className={`rounded-2xl border overflow-hidden transition ${
                  isOpen ? "border-indigo-400/30" : "border-white/10"
                } bg-slate-900/50`}
              >
                {/* Project header */}
                <button
                  onClick={() => setExpanded(isOpen ? null : project.id)}
                  className="flex w-full items-center gap-4 p-5 text-left"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10">
                    {project.approved
                      ? <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                      : <FolderKanban className="h-5 w-5 text-indigo-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white">{project.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {project.course?.title} · {approvedCount}/{totalCount} milestones
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {project.approved && (
                      <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-medium text-emerald-300">
                        Complete
                      </span>
                    )}
                    {isOpen
                      ? <ChevronUp className="h-4 w-4 text-slate-500" />
                      : <ChevronDown className="h-4 w-4 text-slate-500" />}
                  </div>
                </button>

                {/* Progress bar */}
                <div className="px-5 pb-3">
                  <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-indigo-500 transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                {/* Expanded content */}
                {isOpen && (
                  <div className="border-t border-white/10 px-5 pb-5 pt-4 space-y-6">
                    {/* Brief */}
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="rounded-xl bg-white/5 p-4">
                        <p className="text-xs font-semibold text-slate-500 mb-1">Business Problem</p>
                        <p className="text-sm text-slate-300 leading-6">{project.businessProblem}</p>
                      </div>
                      <div className="rounded-xl bg-white/5 p-4">
                        <p className="text-xs font-semibold text-slate-500 mb-1">Expected Outcome</p>
                        <p className="text-sm text-slate-300 leading-6">{project.expectedOutcome}</p>
                      </div>
                    </div>

                    {/* Milestones */}
                    <div className="space-y-4">
                      <p className="text-sm font-semibold text-white">Milestones</p>
                      {project.milestones.map((milestone: any, idx: number) => {
                        const latest = milestone.submissions?.[milestone.submissions.length - 1];
                        const mStatus = latest?.status ?? null;
                        const canSubmit = milestone.unlocked && (!mStatus || mStatus === "CHANGES_REQUESTED");
                        const isSubmittingThis = activeSubmit === milestone.id;

                        return (
                          <div
                            key={milestone.id}
                            className={`rounded-xl border p-4 ${
                              mStatus === "APPROVED"
                                ? "border-emerald-400/20 bg-emerald-500/5"
                                : mStatus === "CHANGES_REQUESTED"
                                ? "border-red-400/20 bg-red-500/5"
                                : mStatus === "SUBMITTED"
                                ? "border-amber-400/20 bg-amber-500/5"
                                : milestone.unlocked
                                ? "border-white/10 bg-white/5"
                                : "border-white/5 bg-white/[0.02] opacity-60"
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                {!milestone.unlocked ? (
                                  <Lock className="h-4 w-4 text-slate-600" />
                                ) : mStatus === "APPROVED" ? (
                                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                                ) : mStatus === "CHANGES_REQUESTED" ? (
                                  <XCircle className="h-4 w-4 text-red-400" />
                                ) : mStatus === "SUBMITTED" ? (
                                  <Clock className="h-4 w-4 text-amber-400" />
                                ) : (
                                  <div className="h-4 w-4 rounded-full border-2 border-slate-600" />
                                )}
                                <p className="text-sm font-semibold text-white">
                                  {idx + 1}. {milestone.title}
                                  {milestone.isFinal && (
                                    <span className="ml-2 text-xs text-indigo-400">(Final — expert review)</span>
                                  )}
                                </p>
                              </div>
                              {mStatus && (
                                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColor[mStatus]}`}>
                                  {mStatus.replace(/_/g, " ")}
                                </span>
                              )}
                            </div>

                            {milestone.description && (
                              <p className="text-xs text-slate-400 mb-3 leading-5">
                                {milestone.description}
                              </p>
                            )}

                            {/* Latest feedback */}
                            {latest?.feedback && (
                              <div className="mb-3 rounded-lg bg-white/5 p-3">
                                <p className="text-xs font-semibold text-slate-500 mb-1">Feedback</p>
                                <p className="text-sm text-slate-300">{latest.feedback}</p>
                              </div>
                            )}

                            {/* Submit form */}
                            {canSubmit && (
                              isSubmittingThis ? (
                                <form
                                  onSubmit={handleSubmit((data) =>
                                    submit.mutate({ milestoneId: milestone.id, data })
                                  )}
                                  className="space-y-3 mt-3"
                                >
                                  <textarea
                                    {...register("submissionText")}
                                    rows={3}
                                    placeholder="Describe your solution, approach or learnings…"
                                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500 resize-none"
                                  />
                                  <input
                                    {...register("submissionUrl")}
                                    type="url"
                                    placeholder="GitHub / Colab / Drive link"
                                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500"
                                  />
                                  {errors.submissionText && (
                                    <p className="text-xs text-red-400">{errors.submissionText.message}</p>
                                  )}
                                  <div className="flex gap-2">
                                    <button
                                      type="submit"
                                      disabled={submit.isPending}
                                      className="flex items-center gap-1.5 rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-400 disabled:opacity-60"
                                    >
                                      {submit.isPending
                                        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        : <Send className="h-3.5 w-3.5" />}
                                      Submit
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => { setActiveSubmit(null); reset(); }}
                                      className="rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-400 hover:text-white"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </form>
                              ) : (
                                <button
                                  onClick={() => { setActiveSubmit(milestone.id); reset(); }}
                                  className="mt-2 flex items-center gap-1.5 rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-400"
                                >
                                  <Send className="h-3.5 w-3.5" />
                                  {mStatus === "CHANGES_REQUESTED" ? "Resubmit" : "Submit milestone"}
                                </button>
                              )
                            )}

                            {!milestone.unlocked && (
                              <p className="text-xs text-slate-600 mt-1">
                                Complete previous milestones to unlock.
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
