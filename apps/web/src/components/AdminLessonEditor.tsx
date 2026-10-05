"use client";

import axios from "axios";
import { useState, type FormEvent } from "react";
import { adminApi } from "../lib/admin-api";
import { safeHttpsUrl } from "../lib/safe-url";
import AdminAssignmentEditor, { type LessonAssignment } from "./AdminAssignmentEditor";

export type AdminLesson = {
  id: string;
  title: string;
  description?: string | null;
  content?: string | null;
  videoUrl?: string | null;
  duration?: string | null;
  assignment?: LessonAssignment | null;
};

export type AdminModule = {
  id: string;
  title: string;
  lessons: AdminLesson[];
};

type Draft = {
  title: string;
  duration: string;
  description: string;
  content: string;
  videoUrl: string;
};

const fieldClass =
  "mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-indigo-400";
const smallButton =
  "rounded-lg border border-white/15 px-3 py-1.5 text-xs text-slate-200 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50";

function toDraft(lesson: AdminLesson): Draft {
  return {
    title: lesson.title,
    duration: lesson.duration ?? "",
    description: lesson.description ?? "",
    content: lesson.content ?? "",
    videoUrl: lesson.videoUrl ?? "",
  };
}

function errorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (Array.isArray(message)) return message.join(", ");
    if (typeof message === "string") return message;
  }
  return error instanceof Error ? error.message : "Something went wrong.";
}

export default function AdminLessonEditor({
  modules: initialModules,
  onSaved,
}: {
  modules: AdminModule[];
  onSaved?: () => void | Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [modules, setModules] = useState<AdminModule[]>(initialModules);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const lessonCount = modules.reduce(
    (total, item) => total + item.lessons.length,
    0,
  );

  if (lessonCount === 0) return null;

  function beginEdit(lesson: AdminLesson) {
    setEditingId(lesson.id);
    setDraft(toDraft(lesson));
    setError("");
    setNotice("");
  }

  function cancelEdit() {
    setEditingId(null);
    setDraft(null);
    setError("");
  }

  function updateDraft<K extends keyof Draft>(key: K, value: string) {
    setDraft((current) => (current ? { ...current, [key]: value } : current));
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingId || !draft) return;

    setError("");
    setNotice("");

    const title = draft.title.trim();
    if (!title) {
      setError("Lesson title is required.");
      return;
    }

    const video = draft.videoUrl.trim();
    if (video && !safeHttpsUrl(video)) {
      setError("Video link must be a valid https link.");
      return;
    }

    const body = {
      title,
      duration: draft.duration.trim() || null,
      description: draft.description.trim() || null,
      content: draft.content.trim() ? draft.content : null,
      videoUrl: video || null,
    };

    setSaving(true);
    try {
      const response = await adminApi.patch<AdminLesson>(
        `/courses/admin/lessons/${editingId}`,
        body,
      );
      const updated = response.data;
      setModules((current) =>
        current.map((item) => ({
          ...item,
          lessons: item.lessons.map((lesson) =>
            lesson.id === editingId ? { ...lesson, ...updated } : lesson,
          ),
        })),
      );
      setEditingId(null);
      setDraft(null);
      setNotice("Lesson saved.");
      await onSaved?.();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-5 border-t border-white/10 pt-4">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className={smallButton}
      >
        {open
          ? "Hide lesson editor"
          : `Edit lesson content (${lessonCount} ${lessonCount === 1 ? "lesson" : "lessons"})`}
      </button>

      {open && (
        <div className="mt-4 space-y-4">
          <p className="text-xs text-slate-400">
            Notes are shown to learners as plain text. Video links must start with https://.
          </p>

          {error && (
            <div role="alert" className="rounded-lg border border-rose-400/30 bg-rose-400/10 p-3 text-xs text-rose-200">
              {error}
            </div>
          )}
          {notice && (
            <div role="status" className="rounded-lg border border-emerald-400/30 bg-emerald-400/10 p-3 text-xs text-emerald-200">
              {notice}
            </div>
          )}

          {modules.map((item) => (
            <div key={item.id} className="space-y-2">
              <h4 className="text-sm font-medium text-slate-200">{item.title}</h4>
              {item.lessons.map((lesson) => (
                <div key={lesson.id} className="rounded-xl border border-white/10 bg-slate-950/50 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="break-words text-sm text-slate-200">{lesson.title}</p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {lesson.content ? "Notes added" : "No notes"} ·{" "}
                        {lesson.videoUrl ? "Video linked" : "No video"}
                      </p>
                    </div>
                    {editingId !== lesson.id && (
                      <button
                        type="button"
                        onClick={() => beginEdit(lesson)}
                        aria-label={`Edit lesson ${lesson.title}`}
                        className={smallButton}
                      >
                        Edit
                      </button>
                    )}
                  </div>

                  {editingId === lesson.id && draft && (
                    <form onSubmit={save} className="mt-3 space-y-3">
                      <label className="block text-xs text-slate-300">
                        Lesson title
                        <input
                          className={fieldClass}
                          maxLength={200}
                          value={draft.title}
                          onChange={(event) => updateDraft("title", event.target.value)}
                        />
                      </label>
                      <label className="block text-xs text-slate-300">
                        Duration
                        <input
                          className={fieldClass}
                          maxLength={50}
                          value={draft.duration}
                          onChange={(event) => updateDraft("duration", event.target.value)}
                          placeholder="e.g. 12 min"
                        />
                      </label>
                      <label className="block text-xs text-slate-300">
                        Description
                        <textarea
                          rows={2}
                          className={fieldClass}
                          maxLength={2000}
                          value={draft.description}
                          onChange={(event) => updateDraft("description", event.target.value)}
                        />
                      </label>
                      <label className="block text-xs text-slate-300">
                        Lesson notes (plain text)
                        <textarea
                          rows={6}
                          className={fieldClass}
                          maxLength={50000}
                          value={draft.content}
                          onChange={(event) => updateDraft("content", event.target.value)}
                        />
                      </label>
                      <label className="block text-xs text-slate-300">
                        Video link (https only)
                        <input
                          className={fieldClass}
                          maxLength={2000}
                          value={draft.videoUrl}
                          onChange={(event) => updateDraft("videoUrl", event.target.value)}
                          placeholder="https://"
                        />
                      </label>
                      <div className="flex gap-2">
                        <button
                          type="submit"
                          disabled={saving}
                          className="rounded-lg bg-indigo-500 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-400 disabled:opacity-50"
                        >
                          {saving ? "Saving…" : "Save lesson"}
                        </button>
                        <button
                          type="button"
                          onClick={cancelEdit}
                          disabled={saving}
                          className={smallButton}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}
                  <AdminAssignmentEditor
                    lessonId={lesson.id}
                    assignment={lesson.assignment ?? null}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
