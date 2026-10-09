'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { ArrowLeft, CheckCircle2, XCircle, BookOpen } from 'lucide-react';

export default function CheckpointPage() {
  const params = useParams();
  const router = useRouter();
  const checkpointId = params?.checkpointId as string;

  const [attempt, setAttempt] = useState<any>(null);
  const [checkpoint, setCheckpoint] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [current, setCurrent] = useState(0);
  const [result, setResult] = useState<any>(null);
  const [starting, setStarting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const authHeaders = () => {
    const token = sessionStorage.getItem('tekrovia_access_token');
    return token ? { Authorization: `Bearer ${token}` } : null;
  };

  const start = useCallback(async () => {
    const headers = authHeaders();

    if (!headers) {
      router.replace('/login');
      return;
    }

    setStarting(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/checkpoints/${checkpointId}/attempts`,
        { method: 'POST', headers },
      );

      if (res.status === 401) {
        sessionStorage.removeItem('tekrovia_access_token');
        router.replace('/login');
        return;
      }

      const data = await res.json();

      if (!res.ok) {
        setError(data.message ?? 'Could not start this checkpoint.');
        return;
      }

      setAttempt(data.attempt);
      setCheckpoint(data.checkpoint);
      setQuestions(data.questions ?? []);
      setAnswers({});
      setCurrent(0);
    } catch (err) {
      console.error('Failed to start checkpoint:', err);
      setError('Could not start this checkpoint.');
    } finally {
      setStarting(false);
    }
  }, [checkpointId, router]);

  const submit = async () => {
    const headers = authHeaders();
    if (!headers || !attempt) return;

    setSubmitting(true);
    setError('');

    try {
      const payload = questions.map((question) => ({
        questionId: question.id,
        answerIndex: answers[question.id],
      }));

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/checkpoints/attempts/${attempt.id}/submit`,
        {
          method: 'POST',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({ answers: payload }),
        },
      );

      const data = await res.json();

      if (!res.ok) {
        setError(data.message ?? 'Could not submit your answers.');
        return;
      }

      setResult(data);
      setAttempt(null);
    } catch (err) {
      console.error('Failed to submit checkpoint:', err);
      setError('Could not submit your answers.');
    } finally {
      setSubmitting(false);
    }
  };

  // --- Result ---
  if (result) {
    const wrong = (result.results ?? []).filter((item: any) => !item.correct);

    return (
      <div className="max-w-2xl mx-auto p-8 space-y-6">
        <Card>
          <CardHeader className="text-center space-y-3">
            <CardTitle className="text-2xl">
              {result.passed ? 'Checkpoint passed' : 'Not quite yet'}
            </CardTitle>
            <CardDescription>
              {result.passed
                ? 'You can move on to the next section.'
                : `You need ${result.passMarkPercent}% to continue. Review the lessons below and try again.`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div
              className={`rounded-lg p-6 text-center space-y-1 ${
                result.passed ? 'bg-green-50' : 'bg-amber-50'
              }`}
            >
              <p className="text-gray-600">Your score</p>
              <p
                className={`text-5xl font-bold ${
                  result.passed ? 'text-green-600' : 'text-amber-600'
                }`}
              >
                {result.scorePercent}%
              </p>
              <p className="text-sm text-gray-500">
                {result.correctCount} of {result.totalQuestions} correct
              </p>
            </div>

            {wrong.length ? (
              <div className="space-y-3">
                <h3 className="font-semibold">Worth another look</h3>
                {wrong.map((item: any) => (
                  <div key={item.questionId} className="rounded-lg border p-4 space-y-2">
                    <p className="font-medium">{item.prompt}</p>
                    {item.explanation ? (
                      <p className="text-sm text-gray-600">{item.explanation}</p>
                    ) : null}
                    {item.reviewLessonId ? (
                      <Link
                        href={`/courses/${checkpoint?.courseId ?? ''}`}
                        className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
                      >
                        <BookOpen className="h-3 w-3" />
                        Revisit: {item.reviewLessonTitle}
                      </Link>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : null}

            <div className="space-y-2">
              {result.canRetake ? (
                <Button className="w-full" onClick={start} disabled={starting}>
                  {starting ? 'Starting...' : 'Try again'}
                </Button>
              ) : null}
              <Link href="/dashboard">
                <Button className="w-full" variant="outline">
                  Back to dashboard
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // --- Intro ---
  if (!attempt) {
    return (
      <div className="max-w-2xl mx-auto p-8 space-y-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to dashboard
        </Link>

        <Card>
          <CardHeader>
            <CardTitle>Checkpoint</CardTitle>
            <CardDescription>
              A short quiz on the section you just finished. You can retake it as
              many times as you need.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error ? (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
                {error}
              </div>
            ) : null}

            <Button onClick={start} disabled={starting}>
              {starting ? 'Starting...' : 'Start checkpoint'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // --- Questions ---
  const question = questions[current];
  const answered = Object.keys(answers).length;
  const allAnswered = answered === questions.length;

  return (
    <div className="max-w-2xl mx-auto p-8 space-y-6">
      <Card>
        <CardHeader className="space-y-3">
          <CardTitle>{checkpoint?.title}</CardTitle>
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>
              Question {current + 1} of {questions.length}
            </span>
            <span>Pass mark {checkpoint?.passMarkPercent}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all"
              style={{ width: `${((current + 1) / questions.length) * 100}%` }}
            ></div>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <h2 className="text-xl font-semibold">{question.prompt}</h2>

          <div className="space-y-2">
            {question.options.map((option: string, index: number) => (
              <button
                key={index}
                type="button"
                onClick={() =>
                  setAnswers((prev) => ({ ...prev, [question.id]: index }))
                }
                className={`w-full rounded-lg border p-4 text-left transition-colors ${
                  answers[question.id] === index
                    ? 'border-blue-500 bg-blue-50'
                    : 'hover:bg-gray-50'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
          {error}
        </div>
      ) : null}

      <div className="flex gap-3">
        <Button
          variant="outline"
          disabled={current === 0}
          onClick={() => setCurrent((value) => value - 1)}
        >
          Previous
        </Button>

        {current < questions.length - 1 ? (
          <Button className="flex-1" onClick={() => setCurrent((v) => v + 1)}>
            Next question
          </Button>
        ) : (
          <Button
            className="flex-1"
            disabled={!allAnswered || submitting}
            onClick={submit}
          >
            {submitting
              ? 'Submitting...'
              : allAnswered
                ? 'Submit answers'
                : `Answer all ${questions.length} questions`}
          </Button>
        )}
      </div>
    </div>
  );
}
