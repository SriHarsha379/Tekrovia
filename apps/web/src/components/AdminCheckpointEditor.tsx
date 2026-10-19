"use client";

import axios from "axios";
import { useCallback, useEffect, useState } from "react";

const API_BASE_URL =
  `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/v1`;

type Question = {
  id: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string | null;
  lessonId: string | null;
};

type Checkpoint = {
  id: string;
  title: string;
  description: string | null;
  fromModuleOrder: number;
  toModuleOrder: number;
  passMarkPercent: number;
  isPublished: boolean;
  questions: Question[];
  _count?: { attempts: number };
};

type ModuleLite = { id: string; title: string; sortOrder: number };

const inputClass =
  "mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-indigo-400";
const btn =
  "rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50";

const blankQuestion = {
  prompt: "",
  options: ["", "", "", ""],
  correctIndex: 0,
  explanation: "",
  lessonId: "",
};

function errorText(err: unknown) {
  if (axios.isAxiosError(err)) {
    const m = err.response?.data?.message;
    if (Array.isArray(m)) return m.join(", ");
    if (typeof m === "string") return m;
  }
  return err instanceof Error ? err.message : "Something went wrong.";
}

export default function AdminCheckpointEditor({
  courseId,
  modules,
}: {
  courseId: string;
  modules: ModuleLite[];
}) {
  const [open, setOpen] = useState(false);
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState("");

  const [newTitle, setNewTitle] = useState("");
  const [afterModule, setAfterModule] = useState(0);
  const [passMark, setPassMark] = useState("80");

  const [addingTo, setAddingTo] = useState<string | null>(null);
  const [draft, setDraft] = useState({ ...blankQuestion });
  const [lessons, setLessons] = useState<any[]>([]);

  const config = useCallback(() => {
    const token = window.sessionStorage.getItem("tekrovia_access_token");
    if (!token) throw new Error("Your session has expired. Please sign in.");
    return { headers: { Authorization: `Bearer ${token}` } };
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get<Checkpoint[]>(
        `${API_BASE_URL}/checkpoints/admin/courses/${courseId}`,
        config(),
      );
      setCheckpoints(res.data);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setLoading(false);
    }
  }, [courseId, config]);

  useEffect(() => {
    if (open) void load();
  }, [open, load]);

  async function createCheckpoint() {
    setBusy("create");
    setError("");
    setNotice("");
    try {
      await axios.post(
        `${API_BASE_URL}/checkpoints/admin`,
        {
          courseId,
          title: newTitle.trim() || `Checkpoint after module ${afterModule + 1}`,
          fromModuleOrder: afterModule,
          toModuleOrder: afterModule,
          passMarkPercent: Number(passMark) || 80,
        },
        config(),
      );
      setNewTitle("");
      setNotice("Checkpoint created as a draft. Add questions, then publish.");
      await load();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy("");
    }
  }

  async function togglePublish(cp: Checkpoint) {
    setBusy(cp.id);
    setError("");
    setNotice("");
    try {
      await axios.patch(
        `${API_BASE_URL}/checkpoints/admin/${cp.id}`,
        { isPublished: !cp.isPublished },
        config(),
      );
      setNotice(cp.isPublished ? "Checkpoint unpublished." : "Checkpoint is live.");
      await load();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy("");
    }
  }

  async function removeCheckpoint(cp: Checkpoint) {
    if (!window.confirm(`Delete "${cp.title}"?`)) return;
    setBusy(cp.id);
    try {
      await axios.delete(`${API_BASE_URL}/checkpoints/admin/${cp.id}`, config());
      await load();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy("");
    }
  }

  async function beginAddQuestion(cp: Checkpoint) {
    setAddingTo(cp.id);
    setDraft({ ...blankQuestion });
    setError("");
    try {
      const res = await axios.get(
        `${API_BASE_URL}/checkpoints/admin/${cp.id}/lessons`,
        config(),
      );
      setLessons(res.data);
    } catch {
      setLessons([]);
    }
  }

  async function saveQuestion(cp: Checkpoint) {
    setBusy(`q-${cp.id}`);
    setError("");
    try {
      await axios.post(
        `${API_BASE_URL}/checkpoints/admin/${cp.id}/questions`,
        {
          prompt: draft.prompt,
          options: draft.options.filter((o) => o.trim()),
          correctIndex: draft.correctIndex,
          explanation: draft.explanation,
          lessonId: draft.lessonId || null,
        },
        config(),
      );
      setDraft({ ...blankQuestion });
      setNotice("Question added.");
      await load();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy("");
    }
  }

  async function deleteQuestion(questionId: string) {
    try {
      await axios.delete(
        `${API_BASE_URL}/checkpoints/admin/questions/${questionId}`,
        config(),
      );
      await load();
    } catch (err) {
      setError(errorText(err));
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-4 w-full rounded-xl border border-dashed border-slate-600 px-3 py-2 text-xs font-semibold text-slate-300 hover:border-indigo-400 hover:text-white"
      >
        Manage checkpoints
      </button>
    );
  }

  return (
    <section className="mt-4 space-y-4 rounded-xl border border-slate-700 bg-slate-950/50 p-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-white">Checkpoints</h4>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs text-slate-400 hover:text-white"
        >
          Close
        </button>
      </div>

      {error && (
        <p className="rounded-lg border border-rose-400/30 bg-rose-400/10 p-3 text-xs text-rose-200">
          {error}
        </p>
      )}
      {notice && (
        <p className="rounded-lg border border-emerald-400/30 bg-emerald-400/10 p-3 text-xs text-emerald-200">
          {notice}
        </p>
      )}

      <div className="space-y-2 rounded-lg border border-slate-700 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Add a checkpoint
        </p>
        <div className="grid gap-2 sm:grid-cols-3">
          <label className="text-xs text-slate-300">
            Title
            <input
              className={inputClass}
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Checkpoint 1"
            />
          </label>
          <label className="text-xs text-slate-300">
            Gates after module
            <select
              className={inputClass}
              value={afterModule}
              onChange={(e) => setAfterModule(Number(e.target.value))}
            >
              {modules.map((m, i) => (
                <option key={m.id} value={m.sortOrder ?? i}>
                  {i + 1}. {m.title}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-slate-300">
            Pass mark (%)
            <input
              type="number"
              min="1"
              max="100"
              className={inputClass}
              value={passMark}
              onChange={(e) => setPassMark(e.target.value)}
            />
          </label>
        </div>
        <button
          type="button"
          disabled={busy === "create" || modules.length === 0}
          onClick={() => void createCheckpoint()}
          className={`${btn} bg-indigo-500 text-white hover:bg-indigo-400`}
        >
          {busy === "create" ? "Creating…" : "Create checkpoint"}
        </button>
        {modules.length === 0 && (
          <p className="text-xs text-amber-300">
            Add modules to the curriculum before creating a checkpoint.
          </p>
        )}
      </div>

      {loading ? (
        <p className="text-xs text-slate-400">Loading checkpoints…</p>
      ) : checkpoints.length === 0 ? (
        <p className="text-xs text-slate-400">
          No checkpoints yet. Students move through every module unguarded.
        </p>
      ) : (
        checkpoints.map((cp) => (
          <div key={cp.id} className="space-y-3 rounded-lg border border-slate-700 p-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-white">{cp.title}</p>
                <p className="text-xs text-slate-400">
                  After module {cp.toModuleOrder + 1} · {cp.passMarkPercent}% to pass ·{" "}
                  {cp.questions.length} questions · {cp._count?.attempts ?? 0} attempts
                </p>
              </div>
              <div className="flex gap-2">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    cp.isPublished
                      ? "bg-emerald-400/10 text-emerald-300"
                      : "bg-amber-400/10 text-amber-300"
                  }`}
                >
                  {cp.isPublished ? "LIVE" : "DRAFT"}
                </span>
                <button
                  type="button"
                  disabled={busy === cp.id}
                  onClick={() => void togglePublish(cp)}
                  className="rounded-lg border border-white/15 px-3 py-1 text-xs text-slate-200 hover:bg-white/10"
                >
                  {cp.isPublished ? "Unpublish" : "Publish"}
                </button>
                <button
                  type="button"
                  disabled={busy === cp.id}
                  onClick={() => void removeCheckpoint(cp)}
                  className="rounded-lg border border-rose-400/30 px-3 py-1 text-xs text-rose-300 hover:bg-rose-400/10"
                >
                  Delete
                </button>
              </div>
            </div>

            {cp.questions.map((q, qi) => (
              <div
                key={q.id}
                className="flex items-start justify-between gap-3 rounded-lg bg-slate-900/60 p-3"
              >
                <div className="min-w-0 text-xs">
                  <p className="font-medium text-slate-200">
                    {qi + 1}. {q.prompt}
                  </p>
                  <ul className="mt-1 space-y-0.5 text-slate-400">
                    {q.options.map((o, oi) => (
                      <li
                        key={oi}
                        className={oi === q.correctIndex ? "text-emerald-300" : ""}
                      >
                        {oi === q.correctIndex ? "✓" : "○"} {o}
                      </li>
                    ))}
                  </ul>
                </div>
                <button
                  type="button"
                  onClick={() => void deleteQuestion(q.id)}
                  className="rounded-lg border border-rose-400/30 px-2 py-1 text-xs text-rose-300"
                >
                  ×
                </button>
              </div>
            ))}

            {addingTo === cp.id ? (
              <div className="space-y-2 rounded-lg border border-indigo-400/30 p-3">
                <label className="block text-xs text-slate-300">
                  Question
                  <input
                    className={inputClass}
                    value={draft.prompt}
                    onChange={(e) => setDraft({ ...draft, prompt: e.target.value })}
                    placeholder="What does a token represent?"
                  />
                </label>

                {draft.options.map((opt, oi) => (
                  <div key={oi} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name={`correct-${cp.id}`}
                      checked={draft.correctIndex === oi}
                      onChange={() => setDraft({ ...draft, correctIndex: oi })}
                      aria-label={`Mark option ${oi + 1} correct`}
                    />
                    <input
                      className={`${inputClass} mt-0`}
                      value={opt}
                      onChange={(e) => {
                        const options = [...draft.options];
                        options[oi] = e.target.value;
                        setDraft({ ...draft, options });
                      }}
                      placeholder={`Option ${oi + 1}`}
                    />
                  </div>
                ))}
                <p className="text-xs text-slate-500">
                  Select the radio beside the correct answer.
                </p>

                <label className="block text-xs text-slate-300">
                  Explanation shown after answering
                  <input
                    className={inputClass}
                    value={draft.explanation}
                    onChange={(e) =>
                      setDraft({ ...draft, explanation: e.target.value })
                    }
                  />
                </label>

                <label className="block text-xs text-slate-300">
                  Revise this lesson if wrong
                  <select
                    className={inputClass}
                    value={draft.lessonId}
                    onChange={(e) => setDraft({ ...draft, lessonId: e.target.value })}
                  >
                    <option value="">No lesson link</option>
                    {lessons.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.module?.title} · {l.title}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={busy === `q-${cp.id}`}
                    onClick={() => void saveQuestion(cp)}
                    className={`${btn} bg-indigo-500 text-white hover:bg-indigo-400`}
                  >
                    {busy === `q-${cp.id}` ? "Saving…" : "Save question"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setAddingTo(null)}
                    className={`${btn} border border-white/15 text-slate-200`}
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => void beginAddQuestion(cp)}
                className="w-full rounded-lg border border-dashed border-slate-600 px-3 py-2 text-xs font-semibold text-slate-300 hover:border-indigo-400"
              >
                + Add question
              </button>
            )}
          </div>
        ))
      )}
    </section>
  );
}
