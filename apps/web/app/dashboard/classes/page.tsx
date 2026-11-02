"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "../../../src/lib/api";
import {
  Video, Calendar, Clock,
  Loader2, ExternalLink,
} from "lucide-react";

const fetchMyClasses    = () => api.get("/classes/mine").then((r) => r.data);
const fetchMyAttendance = () => api.get("/classes/mine/attendance").then((r) => r.data);

function ClassCard({ cls, showJoin }: { cls: any; showJoin: boolean }) {
  const scheduled = new Date(cls.scheduledAt);
  const endsAt    = new Date(scheduled.getTime() + cls.durationMins * 60000);
  const isLive    = cls.status === "LIVE" ||
    (cls.status === "SCHEDULED" && Date.now() >= scheduled.getTime() && Date.now() <= endsAt.getTime());

  return (
    <div className={`rounded-2xl border p-5 space-y-3 ${isLive ? "border-emerald-400/30 bg-emerald-500/5" : "border-white/10 bg-slate-900/50"}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            {isLive && <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-xs font-bold text-white animate-pulse">● LIVE</span>}
            <p className="font-semibold text-white">{cls.title}</p>
          </div>
          {cls.description && <p className="mt-1 text-sm text-slate-400">{cls.description}</p>}
          <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{scheduled.toLocaleDateString("en-IN", { dateStyle: "medium" })}</span>
            <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{scheduled.toLocaleTimeString("en-IN", { timeStyle: "short" })} · {cls.durationMins} min</span>
            {cls.batch?.name && <span>Batch: {cls.batch.name}</span>}
            {cls.trainer && <span>Trainer: {cls.trainer}</span>}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
            cls.status === "LIVE" ? "bg-emerald-500/20 text-emerald-300"
            : cls.status === "SCHEDULED" ? "bg-blue-500/20 text-blue-300"
            : cls.status === "COMPLETED" ? "bg-slate-700 text-slate-400"
            : "bg-red-500/20 text-red-300"
          }`}>{cls.status}</span>
          {cls.myAttendance && (
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              cls.myAttendance === "PRESENT" ? "bg-emerald-500/20 text-emerald-300"
              : cls.myAttendance === "LATE" ? "bg-amber-500/20 text-amber-300"
              : "bg-red-500/20 text-red-300"
            }`}>{cls.myAttendance}</span>
          )}
        </div>
      </div>
      <div className="flex gap-3">
        {(isLive || showJoin) && cls.meetingLink && (
          <a href={cls.meetingLink} target="_blank" rel="noreferrer"
            className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-400 transition">
            <Video className="h-4 w-4" />{isLive ? "Join now" : "Join class"}<ExternalLink className="h-3 w-3" />
          </a>
        )}
        {cls.recordingUrl && (
          <a href={cls.recordingUrl} target="_blank" rel="noreferrer"
            className="flex items-center gap-1.5 rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-300 hover:bg-white/5 transition">
            <Video className="h-4 w-4" />Watch recording<ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
    </div>
  );
}

export default function LiveClassesPage() {
  const { data, isLoading } = useQuery({ queryKey: ["my-classes"], queryFn: fetchMyClasses, refetchInterval: 60_000 });
  const { data: attendance } = useQuery({ queryKey: ["my-attendance"], queryFn: fetchMyAttendance });

  const upcoming = data?.upcoming ?? [];
  const past     = data?.past     ?? [];

  if (isLoading) return <div className="flex items-center gap-2 text-slate-400 p-8"><Loader2 className="h-4 w-4 animate-spin" />Loading classes…</div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Live Classes</h1>
        <p className="mt-1 text-sm text-slate-400">Your upcoming sessions, recordings and attendance.</p>
      </div>

      {attendance && attendance.total > 0 && (
        <div className="grid gap-4 sm:grid-cols-4">
          {[
            { label: "Total Classes",   value: attendance.total },
            { label: "Attended",        value: attendance.attended },
            { label: "Absent",          value: attendance.ABSENT ?? 0 },
            { label: "Attendance Rate", value: attendance.rate != null ? `${attendance.rate}%` : "—" },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-2xl border border-white/10 bg-slate-900/50 p-4">
              <p className="text-xs text-slate-500">{label}</p>
              <p className="mt-2 text-2xl font-bold text-white">{value}</p>
            </div>
          ))}
        </div>
      )}

      <div>
        <h2 className="mb-4 text-lg font-semibold text-white">Upcoming {upcoming.length > 0 && <span className="ml-2 rounded-full bg-indigo-500/20 px-2 py-0.5 text-xs text-indigo-300">{upcoming.length}</span>}</h2>
        {upcoming.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 p-10 text-center">
            <Calendar className="mx-auto h-8 w-8 text-slate-600" />
            <p className="mt-3 text-sm text-slate-500">No upcoming classes yet.</p>
            <p className="mt-1 text-xs text-slate-600">Your trainer will schedule sessions once your batch is active.</p>
          </div>
        ) : (
          <div className="space-y-3">{upcoming.map((cls: any) => <ClassCard key={cls.id} cls={cls} showJoin={true} />)}</div>
        )}
      </div>

      {past.length > 0 && (
        <div>
          <h2 className="mb-4 text-lg font-semibold text-white">Past Classes</h2>
          <div className="space-y-3">{past.map((cls: any) => <ClassCard key={cls.id} cls={cls} showJoin={false} />)}</div>
        </div>
      )}
    </div>
  );
}
