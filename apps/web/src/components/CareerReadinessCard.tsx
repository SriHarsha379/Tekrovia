"use client";

import { useState } from "react";
import axios from "axios";
import { api } from "../lib/api-client";

type AssessmentResult = {
  id: string;
  candidateId: string;
  title?: string;
  type?: string;
  score?: number | null;
  maxScore?: number;
  classification?: string | null;
  status?: string;
  responses?: unknown;
  roadmap?: unknown;
  createdAt?: string;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function displayValue(value: unknown): string {
  if (value == null || value === "") return "Not available";
  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }
  return JSON.stringify(value, null, 2);
}

function getFactors(responses: unknown): Array<[string, unknown]> {
  const record = asRecord(responses);
  if (!record) return [];

  const factors =
    asRecord(record.breakdown) ??
    asRecord(record.factors) ??
    asRecord(record.scoring) ??
    record;

  return Object.entries(factors).filter(
    ([key, value]) =>
      !["profile", "rubric", "version", "candidate", "snapshot"].includes(
        key.toLowerCase()
      ) &&
      (typeof value === "number" ||
        typeof value === "string" ||
        (value !== null && typeof value === "object"))
  );
}

function getRoadmapItems(roadmap: unknown): unknown[] {
  if (Array.isArray(roadmap)) return roadmap;
  const record = asRecord(roadmap);
  if (!record) return [];
  for (const key of ["nextSteps", "steps", "recommendations", "items"]) {
    if (Array.isArray(record[key])) return record[key] as unknown[];
  }
  return [];
}

export default function CareerReadinessCard({
  assessmentCount,
}: {
  assessmentCount: number;
}) {
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function startAssessment() {
    setBusy(true);
    setError("");
    setNotice("");
    setResult(null);

    try {
      const assessment = await api.createCareerReadinessAssessment();
      setResult(assessment as AssessmentResult);
      setNotice("Your career-readiness assessment has been generated.");
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const message = err.response?.data?.message;
        setError(
          Array.isArray(message)
            ? message.join(", ")
            : typeof message === "string"
              ? message
              : "We couldn't generate your assessment. Please try again."
        );
      } else {
        setError("Something went wrong while generating your assessment.");
      }
    } finally {
      setBusy(false);
    }
  }

  const factors = getFactors(result?.responses);
  const roadmapItems = getRoadmapItems(result?.roadmap);
  const score = result?.score;
  const maxScore = result?.maxScore ?? 100;
  const classification = result?.classification?.toUpperCase();

  return (
    <section
      aria-labelledby="career-readiness-heading"
      className="mt-8 rounded-2xl border border-indigo-400/20 bg-gradient-to-br from-indigo-500/10 via-white/[0.03] to-white/[0.02] p-6 sm:p-8"
    >
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-2xl">
          <span className="inline-flex rounded-full bg-indigo-400/10 px-3 py-1 text-xs font-semibold text-indigo-300">
            Career assessment
          </span>
          <h2
            id="career-readiness-heading"
            className="mt-4 text-2xl font-semibold"
          >
            Career Readiness Assessment
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Get a profile-based snapshot of your career preparation, see the
            factors contributing to your score, and review suggested next steps.
          </p>
          <p className="mt-3 text-xs leading-5 text-slate-500">
            This is an initial profile-based readiness estimate, not a
            technical skills examination or a guarantee of placement.
          </p>
        </div>

        <button
          type="button"
          onClick={startAssessment}
          disabled={busy}
          className="shrink-0 rounded-xl bg-indigo-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? "Generating..." : "Start Assessment"}
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="mt-5 rounded-xl border border-rose-400/30 bg-rose-400/10 p-4 text-sm text-rose-200"
        >
          {error}
        </div>
      )}

      {notice && (
        <div
          role="status"
          className="mt-5 rounded-xl border border-emerald-400/30 bg-emerald-400/10 p-4 text-sm text-emerald-200"
        >
          {notice}
        </div>
      )}

      {result && (
        <div className="mt-6 space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-slate-950/50 p-5">
              <p className="text-sm text-slate-400">Readiness score</p>
              <p className="mt-2 text-3xl font-bold text-white">
                {score == null ? "—" : `${score}`}
                {score != null && (
                  <span className="ml-1 text-base font-normal text-slate-400">
                    / {maxScore}
                  </span>
                )}
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-slate-950/50 p-5">
              <p className="text-sm text-slate-400">Classification</p>
              <p className="mt-2 text-2xl font-bold text-indigo-300">
                {classification || "Pending"}
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-slate-950/50 p-5">
              <p className="text-sm text-slate-400">Assessment status</p>
              <p className="mt-2 text-xl font-semibold text-white">
                {result.status || "Generated"}
              </p>
            </div>
          </div>

          {factors.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold">Scoring breakdown</h3>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {factors.map(([key, value]) => (
                  <div
                    key={key}
                    className="rounded-xl border border-white/10 bg-slate-950/40 p-4"
                  >
                    <p className="text-sm capitalize text-slate-400">
                      {key.replace(/([A-Z])/g, " $1").replace(/[_-]/g, " ")}
                    </p>
                    <p className="mt-1 whitespace-pre-wrap break-words text-sm font-medium text-slate-100">
                      {displayValue(value)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {roadmapItems.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold">
                Recommended next steps
              </h3>
              <ol className="mt-3 space-y-3">
                {roadmapItems.map((item, index) => (
                  <li
                    key={index}
                    className="flex gap-3 rounded-xl border border-white/10 bg-slate-950/40 p-4"
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-400/15 text-xs font-semibold text-indigo-300">
                      {index + 1}
                    </span>
                    <p className="whitespace-pre-wrap break-words text-sm leading-6 text-slate-200">
                      {typeof item === "string"
                        ? item
                        : displayValue(item)}
                    </p>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {factors.length === 0 && roadmapItems.length === 0 && (
            <p className="rounded-xl border border-white/10 bg-slate-950/40 p-4 text-sm text-slate-400">
              The assessment was created successfully. Detailed scoring
              factors and recommendations were not included in the response.
            </p>
          )}

          {result.createdAt && (
            <p className="text-xs text-slate-500">
              Generated {new Date(result.createdAt).toLocaleString()}
            </p>
          )}
        </div>
      )}

      <p className="mt-5 text-xs text-slate-500">
        {assessmentCount} assessment record
        {assessmentCount === 1 ? "" : "s"} currently shown in your dashboard
        history. Refresh the dashboard to update the history after generating
        a new assessment.
      </p>
    </section>
  );
}
