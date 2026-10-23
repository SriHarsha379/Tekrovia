"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import axios from "axios";
import { adminApi } from "../lib/admin-api";

const ATTENDANCE = ["PRESENT", "LATE", "ABSENT", "EXCUSED"];

const field =
  "mt-1 w-full rounded-xl border border-white/15 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-indigo-400";

const attendStyle: Record<string, string> = {
  PRESENT: "bg-emerald-500 text-white",
  LATE: "bg-amber-500 text-white",
  ABSENT: "bg-rose-500 text-white",
  EXCUSED: "bg-slate-500 text-white",
};

function whenText(v: string) {
  return new Date(v).toLocaleString("en-IN", {
    weekday: "short", day: "numeric", month: "short",
    hour: "2-digit", minute: "2-digit",
  });
}

function message(err: unknown) {
  if (axios.isAxiosError(err)) {
    const m = err.response?.data?.message;
    if (Array.isArray(m)) return m.join(", ");
    if (typeof m === "string") return m;
  }
  return "Something went wrong.";
}

export default function BatchClasses({ batchId }: { batchId: string }) {
  const [classes, setClasses] = useState<any[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [register, setRegister] = useState<any>(null);
  const [marks, setMarks] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    title: "", scheduledAt: "", durationMins: "60", meetingLink: "",
  });

  const load = useCallback(async () => {
    try {
      const res = await adminApi.get(`/classes/batch/${batchId}`);
      setClasses(res.data);
    } catch (err) { setError(message(err)); }
  }, [batchId]);

  useEffect(() => { void load(); }, [load]);

  async function create(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await adminApi.post("/classes", { batchId, ...form, durationMins: Number(form.durationMins) });
      setForm({ title: "", scheduledAt: "", durationMins: "60", meetingLink: "" });
      setShowNew(false);
      await load();
    } catch (err) { setError(message(err)); }
    finally { setBusy(false); }
  }

  async function openRegister(id: string) {
    setError("");
    try {
      const res = await adminApi.get(`/classes/${id}/register`);
      setRegister(res.data);
      // Default everyone to present; the trainer unticks the absentees.
      setMarks(Object.fromEntries(
        res.data.register.map((r: any) => [r.userId, r.status ?? "PRESENT"]),
      ));
    } catch (err) { setError(message(err)); }
  }

  async function saveRegister() {
    setBusy(true);
    try {
      await adminApi.post(`/classes/${register.id}/attendance`, {
        entries: Object.entries(marks).map(([userId, status]) => ({ userId, status })),
      });
      setRegister(null);
      await load();
    } catch (err) { setError(message(err)); }
    finally { setBusy(false); }
  }

  async function removeClass(id: string, title: string) {
    if (!window.confirm(`Delete "${title}"?`)) return;
    try {
      await adminApi.delete(`/classes/${id}`);
      await load();
    } catch (err) { setError(message(err)); }
  }

  return (
    <div className="mt-5 border-t border-white/10 pt-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">Live classes · {classes.length}</h3>
        <button type="button" onClick={() => setShowNew((v) => !v)}
          className="rounded-lg border border-white/15 px-3 py-1.5 text-xs hover:bg-white/10">
          Schedule a class
        </button>
      </div>

      {error && (
        <p className="mt-3 rounded-lg border border-rose-400/30 bg-rose-400/10 p-3 text-xs text-rose-200">
          {error}
        </p>
      )}

      {showNew && (
        <form onSubmit={create} className="mt-3 space-y-3 rounded-xl border border-white/10 p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-xs text-slate-300">
              Title *
              <input required className={field} value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Week 1 — Introduction" />
            </label>
            <label className="block text-xs text-slate-300">
              When *
              <input required type="datetime-local" className={field} value={form.scheduledAt}
                onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })} />
            </label>
            <label className="block text-xs text-slate-300">
              Minutes
              <input type="number" min="15" step="15" className={field} value={form.durationMins}
                onChange={(e) => setForm({ ...form, durationMins: e.target.value })} />
            </label>
            <label className="block text-xs text-slate-300">
              Meeting link
              <input className={field} value={form.meetingLink}
                onChange={(e) => setForm({ ...form, meetingLink: e.target.value })}
                placeholder="https://meet.google.com/..." />
            </label>
          </div>
          <button type="submit" disabled={busy}
            className="rounded-lg bg-indigo-500 px-4 py-2 text-xs font-semibold hover:bg-indigo-400 disabled:opacity-50">
            {busy ? "Scheduling…" : "Schedule"}
          </button>
        </form>
      )}

      {register && (
        <div className="mt-3 rounded-xl border border-indigo-400/30 bg-indigo-500/[0.07] p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold">
              Attendance · {register.title}
            </p>
            <button type="button" onClick={() => setRegister(null)}
              className="text-xs text-slate-400 hover:text-white">Cancel</button>
          </div>

          {register.register.length === 0 ? (
            <p className="mt-3 text-xs text-slate-400">
              This batch has no students yet.
            </p>
          ) : (
            <>
              <ul className="mt-3 space-y-2">
                {register.register.map((r: any) => (
                  <li key={r.userId} className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-slate-950/60 px-3 py-2">
                    <span className="min-w-0 truncate text-sm">{r.name}</span>
                    <div className="flex shrink-0 gap-1">
                      {ATTENDANCE.map((a) => (
                        <button key={a} type="button"
                          onClick={() => setMarks({ ...marks, [r.userId]: a })}
                          className={`rounded px-2 py-1 text-[11px] font-semibold transition ${
                            marks[r.userId] === a
                              ? attendStyle[a]
                              : "bg-white/5 text-slate-400 hover:bg-white/10"
                          }`}>
                          {a[0] + a.slice(1).toLowerCase()}
                        </button>
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
              <button type="button" disabled={busy} onClick={() => void saveRegister()}
                className="mt-3 rounded-lg bg-indigo-500 px-4 py-2 text-xs font-semibold hover:bg-indigo-400 disabled:opacity-50">
                {busy ? "Saving…" : "Save attendance"}
              </button>
            </>
          )}
        </div>
      )}

      <div className="mt-3 space-y-2">
        {classes.length === 0 ? (
          <p className="text-xs text-slate-500">No classes scheduled.</p>
        ) : classes.map((c: any) => (
          <div key={c.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-slate-950/60 px-3 py-2.5">
            <div className="min-w-0">
              <p className="truncate text-sm">{c.title}</p>
              <p className="mt-0.5 text-xs text-slate-500">
                {whenText(c.scheduledAt)} · {c.durationMins} min ·{" "}
                {c.trainer?.name ?? "no trainer"} · {c.status.toLowerCase()}
                {c._count.attendance > 0 ? ` · ${c._count.attendance} marked` : ""}
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              {c.meetingLink && (
                <a href={c.meetingLink} target="_blank" rel="noreferrer"
                  className="rounded-lg border border-white/15 px-3 py-1 text-xs hover:bg-white/10">
                  Join
                </a>
              )}
              <button type="button" onClick={() => void openRegister(c.id)}
                className="rounded-lg bg-indigo-500 px-3 py-1 text-xs font-semibold hover:bg-indigo-400">
                Attendance
              </button>
              {c._count.attendance === 0 && (
                <button type="button" onClick={() => void removeClass(c.id, c.title)}
                  className="rounded-lg border border-rose-400/30 px-2 py-1 text-xs text-rose-300 hover:bg-rose-400/10">
                  ×
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
