"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { api } from "../lib/api";
import { toast } from "sonner";
import { Loader2, ChevronRight, ChevronLeft } from "lucide-react";

interface Props {
  data: {
    assessment: { id: string };
    questions: Array<{
      id: string;
      category: string;
      prompt: string;
      options: string[];
    }>;
    totalQuestions: number;
  };
  onComplete: (result: any) => void;
  onBack: () => void;
}

export default function InteractiveAssessment({ data, onComplete, onBack }: Props) {
  const { assessment, questions } = data;
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [current, setCurrent] = useState(0);

  const question = questions[current];
  const total = questions.length;
  const answered = Object.keys(answers).length;
  const selectedIndex = answers[question?.id];

  const submit = useMutation({
    mutationFn: () =>
      api
        .post(`/assessments/${assessment.id}/interactive-submit`, {
          answers: Object.entries(answers).map(([questionId, answerIndex]) => ({
            questionId,
            answerIndex,
          })),
        })
        .then((r) => r.data),
    onSuccess: (result) => {
      toast.success("Assessment submitted!");
      onComplete(result);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? "Submission failed");
    },
  });

  const selectAnswer = (index: number) => {
    setAnswers((prev) => ({ ...prev, [question.id]: index }));
  };

  const canSubmit = answered === total;

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="text-sm text-slate-400 hover:text-white">
          ← Exit
        </button>
        <span className="text-sm text-slate-400">
          {answered}/{total} answered
        </span>
      </div>

      {/* Progress */}
      <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-indigo-500 transition-all"
          style={{ width: `${Math.round(((current + 1) / total) * 100)}%` }}
        />
      </div>

      {/* Question */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-indigo-400 mb-4">
          {question.category} · Question {current + 1} of {total}
        </p>
        <p className="text-lg font-semibold text-white leading-snug">
          {question.prompt}
        </p>

        <ul className="mt-6 space-y-3">
          {question.options.map((option, i) => (
            <li key={i}>
              <button
                onClick={() => selectAnswer(i)}
                className={`w-full rounded-xl border px-4 py-3 text-left text-sm transition ${
                  selectedIndex === i
                    ? "border-indigo-500 bg-indigo-500/20 text-white"
                    : "border-white/10 bg-white/5 text-slate-300 hover:border-indigo-400/40 hover:text-white"
                }`}
              >
                <span className="font-medium text-indigo-400 mr-2">
                  {String.fromCharCode(65 + i)}.
                </span>
                {option}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrent((c) => Math.max(0, c - 1))}
          disabled={current === 0}
          className="flex items-center gap-1 rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-400 transition hover:text-white disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" /> Previous
        </button>

        {current < total - 1 ? (
          <button
            onClick={() => setCurrent((c) => Math.min(total - 1, c + 1))}
            className="flex items-center gap-1 rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-400"
          >
            Next <ChevronRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            onClick={() => submit.mutate()}
            disabled={!canSubmit || submit.isPending}
            className="flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-emerald-400 disabled:opacity-60"
          >
            {submit.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Submit assessment
          </button>
        )}
      </div>

      {/* Question map */}
      <div className="flex flex-wrap gap-2 pt-2">
        {questions.map((q, i) => (
          <button
            key={q.id}
            onClick={() => setCurrent(i)}
            className={`h-7 w-7 rounded-lg text-xs font-medium transition ${
              i === current
                ? "bg-indigo-500 text-white"
                : answers[q.id] !== undefined
                ? "bg-emerald-500/30 text-emerald-300"
                : "bg-white/10 text-slate-400 hover:bg-white/20"
            }`}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  );
}
