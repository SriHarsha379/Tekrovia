"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "../../../src/lib/api";
import { toast } from "sonner";
import {
  ClipboardList, CheckCircle2, XCircle, Clock,
  ChevronDown, ChevronUp, Loader2, Send,
} from "lucide-react";

const submitSchema = z.object({
  submissionText: z.string().optional(),
  submissionUrl:  z.string().url("Enter a valid URL").optional().or(z.literal("")),
}).refine((d) => d.submissionText?.trim() || d.submissionUrl?.trim(), {
  message: "Add submission text or a link",
  path: ["submissionText"],
});
type SubmitForm = z.infer<typeof submitSchema>;

const fetchMyAssignments = () => api.get("/assignments/my").then((r) => r.data);

const statusColor: Record<string, string> = {
  SUBMITTED:         "bg-amber-500/20 text-amber-300",
  APPROVED:          "bg-emerald-500/20 text-emerald-300",
  CHANGES_REQUESTED: "bg-red-500/20 text-red-300",
};

const statusIcon: Record<string, React.ReactNode> = {
  APPROVED:          <CheckCircle2 className="h-4 w-4 text-emerald-400" />,
  CHANGES_REQUESTED: <XCircle className="h-4 w-4 text-red-400" />,
  SUBMITTED:         <Clock className="h-4 w-4 text-amber-400" />,
};

export default function AssignmentsPage() {
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<string | null>(null);

  const { data: assignments = [], isLoading } = useQuery({
    queryKey: ["my-assignments"],
    queryFn: fetchMyAssignments,
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<SubmitForm>({
    resolver: zodResolver(submitSchema),
  });

  const submit = useMutation({
    mutationFn: ({ id, data }: { id: string; data: SubmitForm }) =>
      api.post(`/assignments/${id}/submit`, data).then((r) => r.data),
    onSuccess: () => {
      toast.success("Assignment submitted!");
      reset();
      setSubmitting(null);
      qc.invalidateQueries({ queryKey: ["my-assignments"] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? "Submission failed"),
  });

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-slate-400 p-8">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading assignments…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Assignments</h1>
        <p className="mt-1 text-sm text-slate-400">
          Submit your work and track feedback from your trainer.
        </p>
      </div>

      {assignments.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 p-12 text-center">
          <ClipboardList className="mx-auto h-8 w-8 text-slate-600" />
          <p className="mt-3 text-sm text-slate-500">
            No assignments yet. Enroll in a course to get started.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {assignments.map((a: any) => {
            const latest = a.submissions?.[a.submissions.length - 1];
            const status = latest?.status ?? null;
            const isOpen = expanded === a.id;
            const isSubmitting = submitting === a.id;
            const canSubmit = !status || status === "CHANGES_REQUESTED";

            return (
              <div
                key={a.id}
                className={`rounded-2xl border bg-slate-900/50 overflow-hidden transition ${
                  isOpen ? "border-indigo-400/30" : "border-white/10"
                }`}
              >
                {/* Header */}
                <button
                  onClick={() => setExpanded(isOpen ? null : a.id)}
                  className="flex w-full items-center gap-4 p-5 text-left"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10">
                    {status ? statusIcon[status] : <ClipboardList className="h-5 w-5 text-indigo-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white truncate">{a.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {a.lesson?.module?.course?.title ?? "Course"}
                      {a.isRequired && " · Required"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {status && (
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColor[status]}`}>
                        {status.replace(/_/g, " ")}
                      </span>
                    )}
                    {!status && (
                      <span className="rounded-full bg-slate-700 px-2 py-0.5 text-xs text-slate-400">
                        Not submitted
                      </span>
                    )}
                    {isOpen
                      ? <ChevronUp className="h-4 w-4 text-slate-500" />
                      : <ChevronDown className="h-4 w-4 text-slate-500" />}
                  </div>
                </button>

                {/* Expanded content */}
                {isOpen && (
                  <div className="border-t border-white/10 px-5 pb-5 pt-4 space-y-5">
                    {/* Instructions */}
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                        Instructions
                      </p>
                      <p className="text-sm leading-7 text-slate-300 whitespace-pre-wrap">
                        {a.instructions}
                      </p>
                    </div>

                    {/* Submission history */}
                    {a.submissions?.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
                          Submission history
                        </p>
                        <div className="space-y-3">
                          {a.submissions.map((s: any) => (
                            <div
                              key={s.id}
                              className={`rounded-xl border p-4 ${
                                s.status === "APPROVED"
                                  ? "border-emerald-400/20 bg-emerald-500/5"
                                  : s.status === "CHANGES_REQUESTED"
                                  ? "border-red-400/20 bg-red-500/5"
                                  : "border-white/10 bg-white/5"
                              }`}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <p className="text-xs font-semibold text-slate-400">
                                  Attempt {s.attemptNumber}
                                </p>
                                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColor[s.status]}`}>
                                  {s.status.replace(/_/g, " ")}
                                </span>
                              </div>
                              {s.submissionText && (
                                <p className="text-sm text-slate-300 mb-2 line-clamp-3">
                                  {s.submissionText}
                                </p>
                              )}
                              {s.submissionUrl && (
                                <a
                                  href={s.submissionUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-xs text-indigo-400 hover:text-indigo-300 underline"
                                >
                                  {s.submissionUrl}
                                </a>
                              )}
                              {s.feedback && (
                                <div className="mt-3 rounded-lg bg-white/5 p-3">
                                  <p className="text-xs font-semibold text-slate-500 mb-1">
                                    Trainer feedback
                                  </p>
                                  <p className="text-sm text-slate-300">{s.feedback}</p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Submit form */}
                    {canSubmit && (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
                          {status === "CHANGES_REQUESTED" ? "Resubmit" : "Submit assignment"}
                        </p>
                        {isSubmitting ? (
                          <form
                            onSubmit={handleSubmit((data) =>
                              submit.mutate({ id: a.id, data })
                            )}
                            className="space-y-3"
                          >
                            <div>
                              <label className="mb-1.5 block text-sm font-medium text-slate-300">
                                Your answer / notes
                              </label>
                              <textarea
                                {...register("submissionText")}
                                rows={4}
                                placeholder="Describe your approach, learnings or solution…"
                                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500 resize-none"
                              />
                              {errors.submissionText && (
                                <p className="mt-1 text-xs text-red-400">
                                  {errors.submissionText.message}
                                </p>
                              )}
                            </div>
                            <div>
                              <label className="mb-1.5 block text-sm font-medium text-slate-300">
                                Link (GitHub / Colab / Drive)
                              </label>
                              <input
                                {...register("submissionUrl")}
                                type="url"
                                placeholder="https://github.com/…"
                                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500"
                              />
                              {errors.submissionUrl && (
                                <p className="mt-1 text-xs text-red-400">
                                  {errors.submissionUrl.message}
                                </p>
                              )}
                            </div>
                            <div className="flex gap-3">
                              <button
                                type="submit"
                                disabled={submit.isPending}
                                className="flex items-center gap-2 rounded-xl bg-indigo-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-400 disabled:opacity-60"
                              >
                                {submit.isPending
                                  ? <Loader2 className="h-4 w-4 animate-spin" />
                                  : <Send className="h-4 w-4" />}
                                Submit
                              </button>
                              <button
                                type="button"
                                onClick={() => { setSubmitting(null); reset(); }}
                                className="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-slate-400 hover:text-white"
                              >
                                Cancel
                              </button>
                            </div>
                          </form>
                        ) : (
                          <button
                            onClick={() => setSubmitting(a.id)}
                            className="flex items-center gap-2 rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-400"
                          >
                            <Send className="h-4 w-4" />
                            {status === "CHANGES_REQUESTED" ? "Resubmit" : "Submit assignment"}
                          </button>
                        )}
                      </div>
                    )}

                    {status === "APPROVED" && (
                      <div className="flex items-center gap-2 text-sm text-emerald-300">
                        <CheckCircle2 className="h-4 w-4" />
                        Assignment approved — well done!
                      </div>
                    )}
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
