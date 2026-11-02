"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { api } from "../../../src/lib/api";
import { toast } from "sonner";
import { Loader2, Plus, X } from "lucide-react";

const fetchApplications = () =>
  api.get("/placements/applications", { params: { limit: "100" } }).then((r) => r.data);
const fetchCandidates = () =>
  api.get("/admin/students", { params: { limit: "50" } }).then((r) => r.data);

const STAGES = [
  "PROFILE_REVIEW", "PREPARATION_PENDING", "JOB_READY", "RESUME_APPROVED",
  "JOBS_MATCHED", "SUBMITTED", "INTERVIEW_SCHEDULED", "FEEDBACK_AWAITED",
  "SELECTED", "OFFER_RECEIVED", "JOINED",
];

const stageLabel: Record<string, string> = {
  PROFILE_REVIEW: "Profile Review", PREPARATION_PENDING: "Prep Pending",
  JOB_READY: "Job Ready", RESUME_APPROVED: "Resume OK",
  JOBS_MATCHED: "Matched", SUBMITTED: "Submitted",
  INTERVIEW_SCHEDULED: "Interview", FEEDBACK_AWAITED: "Feedback",
  SELECTED: "Selected", OFFER_RECEIVED: "Offer", JOINED: "Joined",
};

const cardColor: Record<string, string> = {
  PROFILE_REVIEW:      "border-slate-700 bg-slate-800/80",
  PREPARATION_PENDING: "border-amber-400/30 bg-slate-800/80",
  JOB_READY:           "border-blue-400/30 bg-slate-800/80",
  RESUME_APPROVED:     "border-blue-400/30 bg-slate-800/80",
  JOBS_MATCHED:        "border-violet-400/30 bg-slate-800/80",
  SUBMITTED:           "border-indigo-400/30 bg-slate-800/80",
  INTERVIEW_SCHEDULED: "border-indigo-400/30 bg-slate-800/80",
  FEEDBACK_AWAITED:    "border-amber-400/30 bg-slate-800/80",
  SELECTED:            "border-emerald-400/30 bg-slate-800/80",
  OFFER_RECEIVED:      "border-emerald-400/30 bg-slate-800/80",
  JOINED:              "border-emerald-400/30 bg-emerald-900/30",
};

const headerColor: Record<string, string> = {
  PROFILE_REVIEW:      "bg-slate-800/80",
  PREPARATION_PENDING: "bg-slate-800/60",
  JOB_READY:            "bg-slate-800/60",
  RESUME_APPROVED:      "bg-slate-800/60",
  JOBS_MATCHED:        "bg-slate-800/60",
  SUBMITTED:           "bg-slate-800/60",
  INTERVIEW_SCHEDULED: "bg-slate-800/60",
  FEEDBACK_AWAITED:    "bg-slate-800/60",
  SELECTED:            "bg-slate-800/60",
  OFFER_RECEIVED:      "bg-slate-800/60",
  JOINED:              "bg-slate-800/60",
};

export default function PlacementPipelinePage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);

  const { data, isLoading } = useQuery({ queryKey: ["placement-applications"], queryFn: fetchApplications });
  const { data: candidatesData } = useQuery({ queryKey: ["admin-students-list"], queryFn: fetchCandidates, enabled: showForm });

  const { register, handleSubmit, reset } = useForm<any>();

  const createApp = useMutation({
    mutationFn: (d: any) => api.post("/placements/applications", d).then((r) => r.data),
    onSuccess: () => { toast.success("Application created!"); reset(); setShowForm(false); qc.invalidateQueries({ queryKey: ["placement-applications"] }); },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? "Failed"),
  });

  const moveStage = useMutation({
    mutationFn: ({ id, stage }: { id: string; stage: string }) =>
      api.patch(`/placements/applications/${id}/pipeline`, { stage }).then((r) => r.data),
    onSuccess: () => { toast.success("Stage updated!"); qc.invalidateQueries({ queryKey: ["placement-applications"] }); },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? "Cannot move stage — check readiness gate"),
  });

  const items: any[] = data?.items ?? [];
  const candidates = candidatesData?.data ?? [];

  const byStage = STAGES.reduce<Record<string, any[]>>((acc, s) => {
    acc[s] = items.filter((a) => a.pipelineStage === s);
    return acc;
  }, {});

  if (isLoading) return <div className="flex items-center gap-2 text-slate-400 p-8"><Loader2 className="h-4 w-4 animate-spin" />Loading…</div>;

  return (
    <div className="space-y-6 min-h-screen bg-slate-950">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Placement Pipeline</h1>
          <p className="mt-1 text-sm text-slate-400">
            {items.length} active application{items.length !== 1 ? "s" : ""} across {STAGES.length} stages.
          </p>
        </div>
        <button onClick={() => setShowForm((s) => !s)}
          className="flex items-center gap-2 rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-400">
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showForm ? "Cancel" : "Add application"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit((d) => createApp.mutate(d))}
          className="rounded-2xl border border-white/10 bg-slate-900/50 p-6 space-y-4">
          <h2 className="font-semibold text-white">New placement application</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-slate-300">Candidate *</label>
              <select {...register("candidateId", { required: true })}
                className="w-full rounded-lg border border-white/10 bg-slate-800 px-4 py-2.5 text-sm text-white outline-none focus:border-indigo-500">
                <option value="">Select candidate</option>
                {candidates.map((c: any) => <option key={c.id} value={c.id}>{c.fullName} — {c.email}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">Company name *</label>
              <input {...register("companyName", { required: true })} placeholder="e.g. TechCorp India"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">Job title *</label>
              <input {...register("jobTitle", { required: true })} placeholder="e.g. Full Stack Developer"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">Location</label>
              <input {...register("jobLocation")} placeholder="e.g. Bangalore"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">Employment type</label>
              <select {...register("employmentType")}
                className="w-full rounded-lg border border-white/10 bg-slate-800 px-4 py-2.5 text-sm text-white outline-none focus:border-indigo-500">
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Contract">Contract</option>
                <option value="Internship">Internship</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">Source</label>
              <select {...register("source")}
                className="w-full rounded-lg border border-white/10 bg-slate-800 px-4 py-2.5 text-sm text-white outline-none focus:border-indigo-500">
                <option value="portal">Job Portal</option>
                <option value="direct">Direct / HR</option>
                <option value="vendor">Vendor</option>
                <option value="referral">Referral</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-slate-300">Job description / link</label>
              <textarea {...register("jobDescription")} rows={2} placeholder="Paste JD or job link here…"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500 resize-none" />
            </div>
          </div>
          <button type="submit" disabled={createApp.isPending}
            className="flex items-center gap-2 rounded-xl bg-indigo-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-400 disabled:opacity-60">
            {createApp.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Create application
          </button>
        </form>
      )}

      <div className="overflow-x-auto pb-4 -mx-6 px-6">
        <div className="inline-flex gap-3 min-w-max">
          {STAGES.map((stage) => {
            const cards = byStage[stage];
            return (
              <div key={stage} className="w-56 shrink-0">
                <div className={`mb-2 flex items-center justify-between rounded-xl px-3 py-2 ${headerColor[stage]}`}>
                  <p className="text-xs font-semibold text-slate-300">{stageLabel[stage]}</p>
                  <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-slate-400">{cards.length}</span>
                </div>
                <div className="space-y-2">
                  {cards.map((app) => {
                    const currentIdx = STAGES.indexOf(app.pipelineStage);
                    const nextStage  = STAGES[currentIdx + 1];
                    return (
                      <div key={app.id} className={`rounded-xl border p-3 text-sm ${cardColor[stage]}`}>
                        <p className="font-semibold text-white leading-snug line-clamp-1">{app.jobTitle}</p>
                        <p className="mt-0.5 text-xs text-slate-400 line-clamp-1">{app.companyName}</p>
                        {app.jobLocation && <p className="mt-0.5 text-xs text-slate-500">{app.jobLocation}</p>}
                        {nextStage ? (
                          <button
                            onClick={() => moveStage.mutate({ id: app.id, stage: nextStage })}
                            disabled={moveStage.isPending}
                            className="mt-2 w-full rounded-lg bg-white/5 border border-white/10 px-2 py-1 text-xs text-slate-400 hover:bg-indigo-500/20 hover:text-indigo-300 hover:border-indigo-400/30 transition"
                          >
                            → {stageLabel[nextStage]}
                          </button>
                        ) : (
                          <span className="mt-2 block text-center text-xs text-emerald-400 font-semibold">✓ Joined</span>
                        )}
                      </div>
                    );
                  })}
                  {cards.length === 0 && (
                    <div className="rounded-xl border border-dashed border-white/10 bg-slate-900/40 p-4 text-center">
                      <p className="text-xs text-slate-600">Empty</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
