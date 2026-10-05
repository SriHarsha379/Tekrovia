"use client";

import { useState, type FormEvent } from "react";
import { adminApi } from "../lib/admin-api";
import { apiErrorMessage } from "../lib/error-message";

export type LessonAssignment = {
  id: string;
  title: string;
  instructions: string;
  isRequired: boolean;
};

const fieldClass =
  "mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-indigo-400";
const smallButton =
  "rounded-lg border border-white/15 px-3 py-1.5 text-xs text-slate-200 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50";

export default function AdminAssignmentEditor({
  lessonId,
  assignment,
}: {
  lessonId: string;
  assignment?: LessonAssignment | null;
}) {
  const [current, setCurrent] = useState<LessonAssignment | null>(
    assignment ?? null,
  );
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(assignment?.title ?? "");
  const [instructions, setInstructions] = useState(
    assignment?.instructions ?? "",
  );
  const [isRequired, setIsRequired] = useState(assignment?.isRequired ?? true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  function toggle() {
    if (!open) {
      setTitle(current?.title ?? "");
      setInstructions(current?.instructions ?? "");
      setIsRequired(current?.isRequired ?? true);
      setError("");
      setNotice("");
    }
    setOpen((value) => !value);
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");

    const cleanTitle = title.trim();
    const cleanInstructions = instructions.trim();
    if (!cleanTitle || !cleanInstructions) {
      setError("Title and instructions are required.");
      return;
    }

    setSaving(true);
    try {
      const response = await adminApi.put<LessonAssignment>(
        `/assignments/lessons/${lessonId}`,
        {
          title: cleanTitle,
          instructions: cleanInstructions,
          isRequired,
        },
      );
      setCurrent(response.data);
      setNotice("Assignment saved.");
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-3 border-t border-white/5 pt-3">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        className={smallButton}
      >
        {open
          ? "Hide assignment"
          : current
            ? `Assignment: ${current.title}`
            : "Add assignment"}
      </button>

      {open && (
        <form onSubmit={save} className="mt-3 space-y-3">
          <p className="text-xs text-slate-400">
            Adding an assignment locks the course curriculum structure. Required
            assignments must be approved before a learner can complete the course.
          </p>

          {error && (
            <div
              role="alert"
              className="rounded-lg border border-rose-400/30 bg-rose-400/10 p-3 text-xs text-rose-200"
            >
              {error}
            </div>
          )}
          {notice && (
            <div
              role="status"
              className="rounded-lg border border-emerald-400/30 bg-emerald-400/10 p-3 text-xs text-emerald-200"
            >
              {notice}
            </div>
          )}

          <label className="block text-xs text-slate-300">
            Assignment title
            <input
              className={fieldClass}
              maxLength={200}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </label>
          <label className="block text-xs text-slate-300">
            Instructions
            <textarea
              rows={6}
              className={fieldClass}
              maxLength={20000}
              value={instructions}
              onChange={(event) => setInstructions(event.target.value)}
            />
          </label>
          <label className="flex items-center gap-2 text-xs text-slate-300">
            <input
              type="checkbox"
              checked={isRequired}
              onChange={(event) => setIsRequired(event.target.checked)}
            />
            Required for course completion
          </label>

          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-indigo-500 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-400 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save assignment"}
          </button>
        </form>
      )}
    </div>
  );
}
