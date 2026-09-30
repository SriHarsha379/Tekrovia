"use client";

import { useState } from "react";
import axios from "axios";
import { api } from "../lib/api-client";

type Question = {
  id: string;
  category: string;
  prompt: string;
  options: string[];
};

type AssessmentStart = {
  assessment: {
    id: string;
    candidateId: string;
    status: string;
    startedAt: string;
  };
  totalQuestions: number;
  questions: Question[];
};

type AssessmentResult = {
  id: string;
  title: string;
  score: number | null;
  maxScore: number;
  classification: string | null;
  status: string;
  responses: {
    correctCount?: number;
    totalQuestions?: number;
    categoryResults?: Array<{
      category: string;
      correct: number;
      total: number;
      percentage: number;
    }>;
    strengths?: string[];
    improvementAreas?: Array<{
      category: string;
      correct: number;
      total: number;
      percentage: number;
    }>;
    answers?: Array<{
      questionId: string;
      category: string;
      selectedIndex: number;
      correct: boolean;
      explanation: string;
    }>;
  };
  roadmap: {
    recommendations?: string[];
  } | null;
  completedAt: string | null;
  createdAt: string;
};

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (Array.isArray(message)) return message.join(", ");
    if (typeof message === "string") return message;
  }
  return "Something went wrong. Please try again.";
}

export default function InteractiveAssessmentCard() {
  const [assessment, setAssessment] = useState<AssessmentStart | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const questions = assessment?.questions ?? [];
  const currentQuestion = questions[currentIndex];
  const answeredCount = Object.keys(answers).length;
  const progress = questions.length
    ? Math.round((answeredCount / questions.length) * 100)
    : 0;

  async function startQuiz() {
    setBusy(true);
    setError("");
    setResult(null);
    setAnswers({});
    setCurrentIndex(0);

    try {
      const data = await api.startInteractiveAssessment();
      if (!data.questions?.length || !data.assessment?.id) {
        throw new Error("The assessment did not return any questions.");
      }
      setAssessment(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  function chooseAnswer(answerIndex: number) {
    if (!currentQuestion || busy) return;
    setAnswers((previous) => ({
      ...previous,
      [currentQuestion.id]: answerIndex,
    }));
  }

  function goNext() {
    if (!currentQuestion || answers[currentQuestion.id] === undefined) {
      setError("Please select an answer before continuing.");
      return;
    }
    setError("");
    setCurrentIndex((index) => Math.min(index + 1, questions.length - 1));
  }

  function goBack() {
    setError("");
    setCurrentIndex((index) => Math.max(index - 1, 0));
  }

  async function submitQuiz() {
    if (!assessment || !currentQuestion) return;

    const missing = questions.some((question) => answers[question.id] === undefined);
    if (missing) {
      setError("Please answer every question before submitting.");
      return;
    }

    setBusy(true);
    setError("");

    try {
      const submittedAnswers = questions.map((question) => ({
        questionId: question.id,
        answerIndex: answers[question.id],
      }));

      const data = await api.submitInteractiveAssessment(
        assessment.assessment.id,
        submittedAnswers
      );
      setResult(data);
      setAssessment(null);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  function resetQuiz() {
    setAssessment(null);
    setAnswers({});
    setCurrentIndex(0);
    setResult(null);
    setError("");
  }

  return (
    <section
      aria-labelledby="interactive-assessment-heading"
      className="mt-8 rounded-2xl border border-cyan-400/20 bg-gradient-to-br from-cyan-500/10 via-white/[0.03] to-white/[0.02] p-6 sm:p-8"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-2xl">
          <span className="inline-flex rounded-full bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-300">
            Interactive quiz
          </span>
          <h2 id="interactive-assessment-heading" className="mt-4 text-2xl font-semibold">
            Technical Skills Assessment
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Answer multiple-choice questions across Python, Django, APIs,
            databases, JavaScript, Git, testing, and debugging. Your score is
            calculated by the server after submission.
          </p>
          <p className="mt-3 text-xs leading-5 text-slate-500">
            This short quiz measures performance on these questions only. It
            does not certify professional proficiency or predict placement.
          </p>
        </div>

        {!assessment && !result && (
          <button
            type="button"
            onClick={startQuiz}
            disabled={busy}
            className="shrink-0 rounded-xl bg-cyan-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? "Loading questions..." : "Start Quiz"}
          </button>
        )}
      </div>

      {error && (
        <div
          role="alert"
          className="mt-5 rounded-xl border border-rose-400/30 bg-rose-400/10 p-4 text-sm text-rose-200"
        >
          {error}
        </div>
      )}

      {assessment && currentQuestion && (
        <div className="mt-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <span className="font-medium text-slate-200">
              Question {currentIndex + 1} of {questions.length}
            </span>
            <span className="text-slate-400">
              {answeredCount} answered
            </span>
          </div>

          <div
            className="h-2 overflow-hidden rounded-full bg-white/10"
            role="progressbar"
            aria-label="Assessment progress"
            aria-valuemin={0}
            aria-valuemax={questions.length}
            aria-valuenow={answeredCount}
          >
            <div
              className="h-full rounded-full bg-cyan-400 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="rounded-xl border border-white/10 bg-slate-950/50 p-5 sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-cyan-300">
              {currentQuestion.category}
            </p>
            <h3 className="mt-3 text-lg font-semibold leading-7 text-white">
              {currentQuestion.prompt}
            </h3>

            <div className="mt-5 space-y-3">
              {currentQuestion.options.map((option, index) => {
                const selected = answers[currentQuestion.id] === index;
                return (
                  <label
                    key={`${currentQuestion.id}-${index}`}
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 text-sm transition ${
                      selected
                        ? "border-cyan-400 bg-cyan-400/10 text-white"
                        : "border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/25"
                    }`}
                  >
                    <input
                      type="radio"
                      name={currentQuestion.id}
                      value={index}
                      checked={selected}
                      onChange={() => chooseAnswer(index)}
                      className="mt-0.5 accent-cyan-400"
                    />
                    <span>{option}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={goBack}
              disabled={currentIndex === 0 || busy}
              className="rounded-xl border border-white/15 px-4 py-2.5 text-sm font-medium text-slate-200 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Back
            </button>

            {currentIndex < questions.length - 1 ? (
              <button
                type="button"
                onClick={goNext}
                disabled={busy}
                className="rounded-xl bg-cyan-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-cyan-500 disabled:opacity-60"
              >
                Next
              </button>
            ) : (
              <button
                type="button"
                onClick={submitQuiz}
                disabled={busy || answeredCount !== questions.length}
                className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {busy ? "Submitting..." : "Submit Assessment"}
              </button>
            )}
          </div>
          <p className="text-xs text-slate-500">
            Your answers are submitted together when you finish.
          </p>
        </div>
      )}

      {result && (
        <div className="mt-6 space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-slate-950/50 p-5">
              <p className="text-sm text-slate-400">Quiz score</p>
              <p className="mt-2 text-3xl font-bold text-white">
                {result.score ?? "—"}
                <span className="ml-1 text-base font-normal text-slate-400">
                  / {result.maxScore}
                </span>
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-slate-950/50 p-5">
              <p className="text-sm text-slate-400">Classification</p>
              <p className="mt-2 text-2xl font-bold text-cyan-300">
                {result.classification ?? "Completed"}
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-slate-950/50 p-5">
              <p className="text-sm text-slate-400">Correct answers</p>
              <p className="mt-2 text-2xl font-bold text-white">
                {result.responses?.correctCount ?? "—"} /{" "}
                {result.responses?.totalQuestions ?? questions.length}
              </p>
            </div>
          </div>

          {result.responses?.categoryResults?.length ? (
            <div>
              <h3 className="text-lg font-semibold">Category breakdown</h3>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {result.responses.categoryResults.map((item) => (
                  <div
                    key={item.category}
                    className="rounded-xl border border-white/10 bg-slate-950/40 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium text-slate-100">{item.category}</p>
                      <p className="text-sm text-slate-300">
                        {item.correct}/{item.total}
                      </p>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-cyan-400"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                    <p className="mt-2 text-xs text-slate-500">
                      {item.percentage}% correct
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {result.roadmap?.recommendations?.length ? (
            <div>
              <h3 className="text-lg font-semibold">Recommended next steps</h3>
              <ol className="mt-3 space-y-3">
                {result.roadmap.recommendations.map((item, index) => (
                  <li
                    key={`${index}-${item}`}
                    className="flex gap-3 rounded-xl border border-white/10 bg-slate-950/40 p-4"
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-cyan-400/15 text-xs font-semibold text-cyan-300">
                      {index + 1}
                    </span>
                    <p className="text-sm leading-6 text-slate-200">{item}</p>
                  </li>
                ))}
              </ol>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-xl bg-cyan-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-cyan-500"
            >
              Refresh dashboard history
            </button>
            <button
              type="button"
              onClick={resetQuiz}
              className="rounded-xl border border-white/15 px-5 py-2.5 text-sm font-medium text-slate-200 hover:bg-white/5"
            >
              Take another quiz
            </button>
          </div>
          <p className="text-xs leading-5 text-slate-500">
            Results reflect this question set and are intended as learning
            guidance, not a formal certification or placement prediction.
          </p>
        </div>
      )}
    </section>
  );
}
