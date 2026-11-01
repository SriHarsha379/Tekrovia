"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "../../../src/lib/api";
import { Loader2 } from "lucide-react";

const fetchApplications = () =>
  api.get("/placements/applications", { params: { limit: "100" } }).then((r) => r.data);

const STAGES = [
  "PROFILE_REVIEW", "PREPARATION_PENDING", "JOB_READY", "RESUME_APPROVED",
  "JOBS_MATCHED", "SUBMITTED", "INTERVIEW_SCHEDULED", "FEEDBACK_AWAITED",
  "SELECTED", "OFFER_RECEIVED", "JOINED",
];

const stageLabel: Record<string, string> = {
  PROFILE_REVIEW:       "Profile Review",
  PREPARATION_PENDING:  "Prep Pending",
  JOB_READY:            "Job Ready",
  RESUME_APPROVED:      "Resume OK",
  JOBS_MATCHED:         "Matched",
  SUBMITTED:            "Submitted",
  INTERVIEW_SCHEDULED:  "Interview",
  FEEDBACK_AWAITED:     "Feedback",
  SELECTED:             "Selected",
  OFFER_RECEIVED:       "Offer",
  JOINED:               "Joined",
};

const stageColor: Record<string, string> = {
  PROFILE_REVIEW:       "border-slate-600   bg-slate-800/60",
  PREPARATION_PENDING:  "border-amber-400/30 bg-amber-500/5",
  JOB_READY:            "border-blue-400/30  bg-blue-500/5",
  RESUME_APPROVED:      "border-blue-400/30  bg-blue-500/5",
  JOBS_MATCHED:         "border-violet-400/30 bg-violet-500/5",
  SUBMITTED:            "border-indigo-400/30 bg-indigo-500/5",
  INTERVIEW_SCHEDULED:  "border-indigo-400/30 bg-indigo-500/5",
  FEEDBACK_AWAITED:     "border-amber-400/30 bg-amber-500/5",
  SELECTED:             "border-emerald-400/30 bg-emerald-500/5",
  OFFER_RECEIVED:       "border-emerald-400/30 bg-emerald-500/5",
  JOINED:               "border-emerald-400/30 bg-emerald-500/10",
};

export default function PlacementPipelinePage() {
  const { data, isLoading } = useQuery({
    queryKey: ["placement-applications"],
    queryFn: fetchApplications,
  });

  const items: any[] = data?.items ?? [];

  const byStage = STAGES.reduce<Record<string, any[]>>((acc, s) => {
    acc[s] = items.filter((a) => a.pipelineStage === s);
    return acc;
  }, {});

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-slate-400 p-8">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading pipeline…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Placement Pipeline</h1>
        <p className="mt-1 text-sm text-slate-400">
          {items.length} active application{items.length !== 1 ? "s" : ""} across {STAGES.length} stages.
        </p>
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 p-12 text-center">
          <p className="text-sm text-slate-500">No placement applications yet.</p>
        </div>
      ) : (
        <div className="overflow-x-auto pb-4">
          <div className="inline-flex gap-3 min-w-max">
            {STAGES.map((stage) => {
              const cards = byStage[stage];
              return (
                <div key={stage} className="w-56 shrink-0">
                  {/* Column header */}
                  <div className="mb-2 flex items-center justify-between rounded-xl bg-slate-900/60 px-3 py-2">
                    <p className="text-xs font-semibold text-slate-300">{stageLabel[stage]}</p>
                    <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-slate-400">
                      {cards.length}
                    </span>
                  </div>

                  {/* Cards */}
                  <div className="space-y-2">
                    {cards.map((app) => (
                      <div
                        key={app.id}
                        className={`rounded-xl border p-3 text-sm ${stageColor[stage]}`}
                      >
                        <p className="font-semibold text-white leading-snug line-clamp-1">
                          {app.jobTitle}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-400 line-clamp-1">
                          {app.companyName}
                        </p>
                        <p className="mt-2 text-xs text-slate-500">
                          {app.candidateId?.slice(0, 8)}…
                        </p>
                        {app.interviews?.length > 0 && (
                          <p className="mt-1 text-xs text-indigo-400">
                            {app.interviews.length} interview{app.interviews.length !== 1 ? "s" : ""}
                          </p>
                        )}
                      </div>
                    ))}
                    {cards.length === 0 && (
                      <div className="rounded-xl border border-dashed border-white/5 p-4 text-center">
                        <p className="text-xs text-slate-600">Empty</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
