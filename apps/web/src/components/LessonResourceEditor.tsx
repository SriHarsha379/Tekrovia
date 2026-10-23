"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import axios from "axios";
import { adminApi } from "../lib/admin-api";

const TYPES: [string, string][] = [
  ["LAB", "Guided lab"],
  ["ACTIVITY", "Practical activity"],
  ["INTERVIEW_QUESTIONS", "Interview questions"],
  ["READING", "Notes and reading"],
  ["DOWNLOAD", "Download"],
];

const typeStyle: Record<string, string> = {
  LAB: "bg-emerald-400/15 text-emerald-300",
  ACTIVITY: "bg-sky-400/15 text-sky-300",
  INTERVIEW_QUESTIONS: "bg-violet-400/15 text-violet-300",
  READING: "bg-slate-500/20 text-slate-300",
  DOWNLOAD: "bg-amber-400/15 text-amber-300",
};

const field =
  "mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-indigo-400";

const blank = { type: "LAB", title: "", body: "", url: "" };

function errorText(err: unknown) {
  if (axios.isAxiosError(err)) {
    const m = err.response?.data?.message;
    if (Array.isArray(m)) return m.join(", ");
    if (typeof m === "string") return m;
  }
  return "Something went wrong.";
}

export default function LessonResourceEditor({ lessonId }: { lessonId: string }) {
  const [items, setItems] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ ...blank });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await adminApi.get(`/resources/lesson/${lessonId}`);
      setItems(res.data);
    } catch (err) { setError(errorText(err)); }
  }, [lessonId]);

  useEffect(() => { if (open) void load(); }, [open, load]);

  async function create(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await adminApi.post(`/resources/lesson/${lessonId}`, draft);
      setDraft({ ...blank });
      setAdding(false);
      await load();
    } catch (err) { setError(errorText(err)); }
    finally { setBusy(false); }
  }

  async function toggle(item: any) {
    setBusy(true);
    try {
      await adminApi.patch(`/resources/${item.id}`, { isPublished: !item.isPublished });
      await load();
    } catch (err) { setError(errorText(err)); }
    finally { setBusy(false); }
  }

  async function move(id: string, direction: "up" | "down") {
    setBusy(true);
    try {
      await adminApi.patch(`/resources/${id}/move/${direction}`);
      await load();
    } catch (err) { setError(errorText(err)); }
    finally { setBusy(false); }
  }

  async function remove(item: any) {
    if (!window.confirm(`Delete "${item.title}"?`)) return;
    setBusy(true);
    try {
      await adminApi.delete(`/resources/${item.id}`);
      await load();
    } catch (err) { setError(errorText(err)); }
    finally { setBusy(false); }
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)}
        className="mt-3 w-full rounded-lg border border-dashed border-slate-600 px-3 py-2 text-xs font-semibold text-slate-300 hover:border-indigo-400 hover:text-white">
        Labs, activities &amp; interview questions
      </button>
    );
  }

  return (
    <div className="mt-3 space-y-3 rounded-xl border border-slate-700 bg-slate-950/50 p-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Lesson resources · {items.length}
        </p>
        <button type="button" onClick={() => setOpen(false)}
          className="text-xs text-slate-400 hover:text-white">Close</button>
      </div>

      {error && (
        <p className="rounded-lg border border-rose-400/30 bg-rose-400/10 p-2.5 text-xs text-rose-200">{error}</p>
      )}

      {items.map((item: any, i: number) => (
        <div key={item.id} className="rounded-lg bg-slate-900/60 p-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${typeStyle[item.type]}`}>
                  {TYPES.find(([v]) => v === item.type)?.[1] ?? item.type}
                </span>
                <p className="truncate text-sm text-slate-200">{item.title}</p>
                {!item.isPublished && (
                  <span className="rounded-full bg-amber-400/15 px-2 py-0.5 text-[11px] text-amber-300">
                    Hidden
                  </span>
                )}
              </div>
              {item.url && (
                <p className="mt-1 truncate text-xs text-indigo-300">{item.url}</p>
              )}
            </div>
            <div className="flex shrink-0 gap-1">
              <button type="button" disabled={busy || i === 0} onClick={() => void move(item.id, "up")}
                className="rounded border border-slate-700 px-2 py-1 text-xs disabled:opacity-30">↑</button>
              <button type="button" disabled={busy || i === items.length - 1} onClick={() => void move(item.id, "down")}
                className="rounded border border-slate-700 px-2 py-1 text-xs disabled:opacity-30">↓</button>
              <button type="button" disabled={busy} onClick={() => void toggle(item)}
                className="rounded border border-slate-700 px-2 py-1 text-xs">
                {item.isPublished ? "Hide" : "Show"}
              </button>
              <button type="button" disabled={busy} onClick={() => void remove(item)}
                className="rounded border border-rose-400/30 px-2 py-1 text-xs text-rose-300">×</button>
            </div>
          </div>
        </div>
      ))}

      {adding ? (
        <form onSubmit={create} className="space-y-2 rounded-lg border border-indigo-400/30 p-3">
          <label className="block text-xs text-slate-300">
            Type
            <select className={field} value={draft.type}
              onChange={(e) => setDraft({ ...draft, type: e.target.value })}>
              {TYPES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <label className="block text-xs text-slate-300">
            Title
            <input required className={field} value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              placeholder="Build your first API call" />
          </label>
          <label className="block text-xs text-slate-300">
            Instructions
            <textarea rows={5} className={field} value={draft.body}
              onChange={(e) => setDraft({ ...draft, body: e.target.value })}
              placeholder="Steps the student should follow." />
          </label>
          <label className="block text-xs text-slate-300">
            Link (https only)
            <input className={field} value={draft.url}
              onChange={(e) => setDraft({ ...draft, url: e.target.value })}
              placeholder="https://github.com/..." />
          </label>
          <div className="flex gap-2">
            <button type="submit" disabled={busy}
              className="rounded-lg bg-indigo-500 px-4 py-2 text-xs font-semibold hover:bg-indigo-400 disabled:opacity-50">
              {busy ? "Saving…" : "Add"}
            </button>
            <button type="button" onClick={() => setAdding(false)}
              className="rounded-lg border border-white/15 px-4 py-2 text-xs text-slate-200">Cancel</button>
          </div>
        </form>
      ) : (
        <button type="button" onClick={() => setAdding(true)}
          className="w-full rounded-lg border border-dashed border-slate-600 px-3 py-2 text-xs font-semibold text-slate-300 hover:border-indigo-400">
          + Add a lab, activity or interview questions
        </button>
      )}
    </div>
  );
}
