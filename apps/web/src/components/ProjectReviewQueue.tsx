"use client";

import { useCallback, useEffect, useState } from "react";
import { adminApi, readAdminUser } from "../lib/admin-api";
import { apiErrorMessage } from "../lib/error-message";
import { safeHttpsUrl } from "../lib/safe-url";

type ReviewStatus = "SUBMITTED" | "APPROVED" | "CHANGES_REQUESTED";

type ReviewItem = {
  id: string;
  attemptNumber: number;
  status: ReviewStatus;
  submissionText: string | null;
  submissionUrl: string | null;
  feedback: string | null;
  vivaNotes: string | null;
  submittedAt: string;
  reviewedAt: string | null;
  user: { id: string; name: string; email: string };
  milestone: {
    id: string;
    title: string;
    isFinal: boolean;
    project: {
      id: string;
      title: string;
      course: { id: string; title: string };
    };
  };
};

type ReviewPage = {
  items: ReviewItem[];
  total: number;
  page: number;
  limit: number;
};

const PAGE_SIZE = 20;

const tabs: Array<{ status: ReviewStatus; label: string }> = [
  { status: "SUBMITTED", label: "Awaiting review" },
  { status: "APPROVED", label: "Approved" },
  { status: "CHANGES_REQUESTED", label: "Changes requested" },
];

function formatDate(value: string): string {
  return new Date(value).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ProjectReviewQueue() {
  const [status, setStatus] = useState<ReviewStatus>("SUBMITTED");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<ReviewPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busyId, setBusyId] = useState("");
  const [feedbacks, setFeedbacks] = useState<Record<string, string>>({});
  const [vivas, setVivas] = useState<Record<string, string>>({});
  const [isAdminUser, setIsAdminUser] = useState(false);

  useEffect(() => {
    const user = readAdminUser();
    setIsAdminUser(!!user && ["ADMIN", "SUPER_ADMIN"].includes(user.role));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await adminApi.get<ReviewPage>("/projects/review", {
        params: { status, page, limit: PAGE_SIZE },
      });
      setData(response.data);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [status, page]);

  useEffect(() => {
    void load();
  }, [load]);

  function chooseTab(next: ReviewStatus) {
    setNotice("");
    setPage(1);
    setStatus(next);
  }

  async function decide(item: ReviewItem, decision: "APPROVED" | "CHANGES_REQUESTED") {
    const feedback = (feedbacks[item.id] ?? "").trim();
    const vivaNotes = (vivas[item.id] ?? "").trim();
    setError("");
    setNotice("");

    if (decision === "CHANGES_REQUESTED" && !feedback) {
      setError("Add feedback explaining what needs to change.");
      return;
    }

    setBusyId(item.id);
    try {
      const response = await adminApi.patch<{ recordedAsReadinessEvidence: boolean }>(
        `/projects/submissions/${item.id}/review`,
        {
          status: decision,
          ...(feedback ? { feedback } : {}),
          ...(vivaNotes ? { vivaNotes } : {}),
        },
      );

      setNotice(
        decision === "CHANGES_REQUESTED"
          ? "Changes requested."
          : response.data.recordedAsReadinessEvidence
            ? "Approved. The project is now recorded as expert-approved readiness evidence."
            : "Approved.",
      );

      if (page > 1 && (data?.items.length ?? 0) <= 1) {
        setPage(page - 1);
      } else {
        await load();
      }
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setBusyId("");
    }
  }

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1;

  return (
    <section aria-label="Project review queue" className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.status}
            type="button"
            aria-pressed={status === tab.status}
            onClick={() => chooseTab(tab.status)}
            className={`rounded-xl border px-4 py-2 text-sm ${
              status === tab.status
                ? "border-indigo-400 bg-indigo-500/20 text-white"
                : "border-white/10 text-slate-300 hover:bg-white/10"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error && (
        <div role="alert" className="rounded-xl border border-rose-400/30 bg-rose-400/10 p-4 text-sm text-rose-200">
          {error}
        </div>
      )}
      {notice && (
        <div role="status" className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 p-4 text-sm text-emerald-200">
          {notice}
        </div>
      )}

      {loading && !data ? (
        <div className="rounded-2xl border border-white/10 p-6 text-sm text-slate-400">
          Loading submissions…
        </div>
      ) : !data || data.items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/15 p-8 text-center text-sm text-slate-400">
          No project submissions in this view.
        </div>
      ) : (
        <div className="space-y-4">
          {data.items.map((item) => {
            const link = safeHttpsUrl(item.submissionUrl);
            const pending = item.status === "SUBMITTED";
            const canAct = pending && (!item.milestone.isFinal || isAdminUser);

            return (
              <article key={item.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="break-words text-lg font-semibold text-white">
                      {item.milestone.project.title}
                    </h3>
                    <p className="mt-1 text-xs text-slate-400">
                      {item.milestone.project.course.title} · {item.milestone.title}
                      {item.milestone.isFinal ? " (final milestone)" : ""}
                    </p>
                  </div>
                  <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-slate-300">
                    Attempt {item.attemptNumber}
                  </span>
                </div>

                <p className="mt-3 text-sm text-slate-300">
                  <span className="font-medium">{item.user.name}</span>{" "}
                  <span className="text-slate-500">{item.user.email}</span>
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Submitted {formatDate(item.submittedAt)}
                </p>

                <div className="mt-4 space-y-3 rounded-xl bg-slate-950/50 p-4">
                  {item.submissionText && (
                    <div className="whitespace-pre-wrap break-words text-sm leading-6 text-slate-200">
                      {item.submissionText}
                    </div>
                  )}
                  {link && (
                    <a
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block break-all text-sm text-indigo-300 hover:text-indigo-200"
                    >
                      {link} ↗
                    </a>
                  )}
                  {item.submissionUrl && !link && (
                    <p className="text-xs text-amber-300">
                      A link was submitted but it is not a valid https link, so it is not shown.
                    </p>
                  )}
                </div>

                {canAct ? (
                  <div className="mt-4 space-y-3">
                    <label className="block text-xs text-slate-300">
                      Feedback
                      <textarea
                        rows={3}
                        maxLength={5000}
                        aria-label={`Feedback for ${item.user.name}`}
                        value={feedbacks[item.id] ?? ""}
                        onChange={(event) =>
                          setFeedbacks((current) => ({ ...current, [item.id]: event.target.value }))
                        }
                        placeholder="Required when requesting changes"
                        className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-indigo-400"
                      />
                    </label>
                    <label className="block text-xs text-slate-300">
                      Viva notes (optional)
                      <textarea
                        rows={2}
                        maxLength={5000}
                        aria-label={`Viva notes for ${item.user.name}`}
                        value={vivas[item.id] ?? ""}
                        onChange={(event) =>
                          setVivas((current) => ({ ...current, [item.id]: event.target.value }))
                        }
                        className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-indigo-400"
                      />
                    </label>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={busyId === item.id}
                        onClick={() => void decide(item, "APPROVED")}
                        aria-label={`Approve ${item.user.name} submission`}
                        className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        disabled={busyId === item.id}
                        onClick={() => void decide(item, "CHANGES_REQUESTED")}
                        aria-label={`Request changes on ${item.user.name} submission`}
                        className="rounded-lg border border-amber-400/40 px-4 py-2 text-xs font-semibold text-amber-200 hover:bg-amber-400/10 disabled:opacity-50"
                      >
                        Request changes
                      </button>
                    </div>
                  </div>
                ) : pending ? (
                  <p className="mt-4 rounded-lg border border-white/10 p-3 text-xs text-slate-400">
                    Only an administrator can review the final milestone of a project.
                  </p>
                ) : (
                  <div className="mt-4 space-y-2">
                    {item.feedback && (
                      <p className="whitespace-pre-wrap break-words text-sm text-slate-300">
                        {item.feedback}
                      </p>
                    )}
                    {item.vivaNotes && (
                      <p className="whitespace-pre-wrap break-words text-sm text-slate-400">
                        Viva notes: {item.vivaNotes}
                      </p>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      {data && data.total > data.limit && (
        <div className="flex items-center justify-between text-sm text-slate-300">
          <button
            type="button"
            disabled={page <= 1 || loading}
            onClick={() => setPage((value) => value - 1)}
            className="rounded-lg border border-white/10 px-3 py-1.5 hover:bg-white/10 disabled:opacity-40"
          >
            Previous
          </button>
          <span>
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages || loading}
            onClick={() => setPage((value) => value + 1)}
            className="rounded-lg border border-white/10 px-3 py-1.5 hover:bg-white/10 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </section>
  );
}
