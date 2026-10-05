"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { api } from "../lib/api-client";
import { apiErrorMessage } from "../lib/error-message";
import { safeHttpsUrl } from "../lib/safe-url";

type SubmissionStatus = "SUBMITTED" | "APPROVED" | "CHANGES_REQUESTED";

type Attempt = {
  id: string;
  attemptNumber: number;
  submissionText: string | null;
  submissionUrl: string | null;
  status: SubmissionStatus;
  feedback: string | null;
  reviewedAt: string | null;
  submittedAt: string;
};

type MyAssignment = {
  id: string;
  title: string;
  instructions: string;
  isRequired: boolean;
  lesson: { id: string; title: string };
  module: { id: string; title: string };
  course: { id: string; title: string };
  submissions: Attempt[];
  latestStatus: SubmissionStatus | null;
};

type Draft = { text: string; url: string };

const statusLabel: Record<SubmissionStatus, string> = {
  SUBMITTED: "Awaiting review",
  APPROVED: "Approved",
  CHANGES_REQUESTED: "Changes requested",
};

const statusClass: Record<SubmissionStatus, string> = {
  SUBMITTED: "bg-amber-400/10 text-amber-200",
  APPROVED: "bg-emerald-400/10 text-emerald-200",
  CHANGES_REQUESTED: "bg-rose-400/10 text-rose-200",
};

const fieldClass =
  "mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-indigo-400";

export default function AssignmentsPanel() {
  const [items, setItems] = useState<MyAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busyId, setBusyId] = useState("");
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = (await api.getMyAssignments()) as MyAssignment[];
      setItems(result);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function updateDraft(id: string, key: keyof Draft, value: string) {
    setDrafts((current) => {
      const existing: Draft = current[id] ?? { text: "", url: "" };
      return { ...current, [id]: { ...existing, [key]: value } };
    });
  }

  async function submit(item: MyAssignment, event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");

    const draft = drafts[item.id] ?? { text: "", url: "" };
    const text = draft.text.trim();
    const url = draft.url.trim();

    if (!text && !url) {
      setError("Enter your answer, an https link, or both.");
      return;
    }
    if (url && !safeHttpsUrl(url)) {
      setError("The link must be a valid https link.");
      return;
    }

    setBusyId(item.id);
    try {
      await api.submitAssignment(item.id, {
        submissionText: text || null,
        submissionUrl: url || null,
      });
      setDrafts((current) => ({ ...current, [item.id]: { text: "", url: "" } }));
      setNotice("Submitted for review.");
      await load();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setBusyId("");
    }
  }

  if (loading && items.length === 0 && !error) {
    return (
      <div className="rounded-2xl border border-white/10 p-6 text-sm text-slate-400">
        Loading assignments…
      </div>
    );
  }

  if (!loading && items.length === 0 && !error) return null;

  return (
    <div aria-label="Assignments">
      <h3 className="mb-4 text-lg font-semibold text-white">Assignments</h3>

      {error && (
        <div
          role="alert"
          className="mb-4 rounded-xl border border-rose-400/20 bg-rose-400/10 p-4 text-sm text-rose-200"
        >
          {error}
        </div>
      )}
      {notice && (
        <div
          role="status"
          className="mb-4 rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-200"
        >
          {notice}
        </div>
      )}

      <div className="space-y-4">
        {items.map((item) => {
          const canSubmit =
            item.latestStatus === null ||
            item.latestStatus === "CHANGES_REQUESTED";
          const draft = drafts[item.id] ?? { text: "", url: "" };

          return (
            <article
              key={item.id}
              className="rounded-2xl border border-white/10 bg-white/[0.04] p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h4 className="break-words font-semibold text-white">
                    {item.title}
                  </h4>
                  <p className="mt-1 text-xs text-slate-400">
                    {item.course.title} · {item.module.title} ·{" "}
                    {item.lesson.title}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-slate-300">
                    {item.isRequired ? "Required" : "Optional"}
                  </span>
                  {item.latestStatus && (
                    <span
                      className={`rounded-full px-3 py-1 text-xs ${statusClass[item.latestStatus]}`}
                    >
                      {statusLabel[item.latestStatus]}
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-4 whitespace-pre-wrap break-words text-sm leading-6 text-slate-300">
                {item.instructions}
              </div>

              {item.submissions.length > 0 && (
                <div className="mt-4 space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Your attempts
                  </p>
                  {item.submissions.map((attempt) => {
                    const link = safeHttpsUrl(attempt.submissionUrl);
                    return (
                      <div
                        key={attempt.id}
                        className="rounded-xl bg-slate-950/50 p-4"
                      >
                        <p className="text-xs text-slate-400">
                          Attempt {attempt.attemptNumber} ·{" "}
                          {statusLabel[attempt.status]}
                        </p>
                        {attempt.submissionText && (
                          <div className="mt-2 whitespace-pre-wrap break-words text-sm text-slate-200">
                            {attempt.submissionText}
                          </div>
                        )}
                        {link && (
                          <a
                            href={link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-2 inline-block break-all text-sm text-indigo-300 hover:text-indigo-200"
                          >
                            {link} ↗
                          </a>
                        )}
                        {attempt.feedback && (
                          <div className="mt-3 rounded-lg border border-white/10 p-3 text-sm text-slate-300">
                            <span className="text-xs uppercase tracking-wide text-slate-500">
                              Reviewer feedback
                            </span>
                            <div className="mt-1 whitespace-pre-wrap break-words">
                              {attempt.feedback}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {canSubmit && (
                <form
                  onSubmit={(event) => void submit(item, event)}
                  className="mt-4 space-y-3"
                >
                  <textarea
                    rows={5}
                    maxLength={20000}
                    aria-label={`Answer for ${item.title}`}
                    placeholder="Write your answer"
                    value={draft.text}
                    onChange={(event) =>
                      updateDraft(item.id, "text", event.target.value)
                    }
                    className={fieldClass}
                  />
                  <input
                    maxLength={2000}
                    aria-label={`Link for ${item.title}`}
                    placeholder="https:// link to your work (optional)"
                    value={draft.url}
                    onChange={(event) =>
                      updateDraft(item.id, "url", event.target.value)
                    }
                    className={fieldClass}
                  />
                  <button
                    type="submit"
                    disabled={busyId === item.id}
                    aria-label={`Submit ${item.title}`}
                    className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-400 disabled:opacity-50"
                  >
                    {busyId === item.id
                      ? "Submitting…"
                      : item.latestStatus === "CHANGES_REQUESTED"
                        ? "Resubmit"
                        : "Submit"}
                  </button>
                </form>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
