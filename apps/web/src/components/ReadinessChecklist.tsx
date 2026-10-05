"use client";

import { useEffect, useState } from "react";
import { api } from "../lib/api-client";
import { apiErrorMessage } from "../lib/error-message";

export type StudentReadiness =
  | { profileComplete: false }
  | {
      profileComplete: true;
      checks: {
        expertMocks: { complete: boolean; completedCount: number; requiredCount: number };
        finalExpertMock: {
          complete: boolean;
          score: number | null;
          maxScore: number | null;
          requiredScore: number;
        };
        expertApprovedProject: { complete: boolean; approvedCount: number };
        technicalAssessment: {
          complete: boolean;
          score: number | null;
          maxScore: number | null;
        };
      };
      allEvidenceComplete: boolean;
      decision: "PENDING" | "APPROVED" | "NEEDS_WORK";
      approvalRequiresHumanReview: true;
    };

const decisionLabel: Record<"PENDING" | "APPROVED" | "NEEDS_WORK", string> = {
  PENDING: "Awaiting review",
  APPROVED: "Approved by the placement team",
  NEEDS_WORK: "The team has asked for more preparation",
};

function Row({ done, label, detail }: { done: boolean; label: string; detail: string }) {
  return (
    <li className="flex items-start gap-3 rounded-xl bg-slate-950/50 px-4 py-3">
      <span
        aria-label={done ? "Complete" : "Not yet complete"}
        className={`mt-0.5 text-sm ${done ? "text-emerald-300" : "text-slate-500"}`}
      >
        {done ? "✓" : "○"}
      </span>
      <div>
        <p className="text-sm text-slate-100">{label}</p>
        <p className="mt-0.5 text-xs text-slate-400">{detail}</p>
      </div>
    </li>
  );
}

function scoreText(score: number | null, max: number | null): string {
  return score === null || max === null ? "No score recorded yet" : `${score} out of ${max}`;
}

export default function ReadinessChecklist() {
  const [data, setData] = useState<StudentReadiness | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    api
      .getMyReadiness()
      .then((result) => {
        if (active) setData(result as StudentReadiness);
      })
      .catch((err: unknown) => {
        if (active) setError(apiErrorMessage(err));
      });

    return () => {
      active = false;
    };
  }, []);

  if (error) {
    return (
      <div role="alert" className="rounded-xl border border-rose-400/20 bg-rose-400/10 p-4 text-sm text-rose-200">
        {error}
      </div>
    );
  }

  if (!data || !data.profileComplete) return null;

  const { checks } = data;

  return (
    <section
      aria-label="Placement readiness checklist"
      className="mt-8 rounded-2xl border border-white/10 bg-white/[0.04] p-6"
    >
      <h2 className="text-lg font-semibold text-white">Placement readiness checklist</h2>
      <p className="mt-1 text-sm text-slate-400">
        This is a checklist of the evidence the placement team looks at. It is not an approval.
      </p>

      <ul className="mt-4 space-y-2">
        <Row
          done={checks.expertMocks.complete}
          label="Expert mock interviews"
          detail={`${checks.expertMocks.completedCount} of ${checks.expertMocks.requiredCount} completed`}
        />
        <Row
          done={checks.finalExpertMock.complete}
          label="Final mock interview"
          detail={`${scoreText(checks.finalExpertMock.score, checks.finalExpertMock.maxScore)} (needs ${checks.finalExpertMock.requiredScore} out of 10 or more)`}
        />
        <Row
          done={checks.expertApprovedProject.complete}
          label="Expert-approved project"
          detail={`${checks.expertApprovedProject.approvedCount} approved`}
        />
        <Row
          done={checks.technicalAssessment.complete}
          label="Formal technical assessment"
          detail={scoreText(checks.technicalAssessment.score, checks.technicalAssessment.maxScore)}
        />
      </ul>

      <p className="mt-4 text-sm text-slate-300">
        Review status: <span className="font-medium">{decisionLabel[data.decision]}</span>
      </p>
      <p className="mt-2 text-xs text-slate-500">
        Placement support is structured assistance. Completing every item does not
        guarantee an interview, a job offer or employment, and the final decision is
        always made by a person.
      </p>
    </section>
  );
}
