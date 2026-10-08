'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { ArrowLeft, CheckCircle2, XCircle } from 'lucide-react';

export default function TechnicalAssessmentPage() {
  const router = useRouter();

  const [assessment, setAssessment] = useState<any>(null);
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

  const start = async () => {
    const headers = authHeaders();

    if (!headers) {
      router.replace('/login');
      return;
    }

    setStarting(true);
    setError('');

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/assessments/me/interactive`,
        { method: 'POST', headers },
      );

      if (res.status === 401) {
        sessionStorage.removeItem('tekrovia_access_token');
        router.replace('/login');
        return;
      }

      const data = await res.json();

      if (!res.ok) {
        setError(data.message ?? 'Could not start the assessment.');
        return;
      }

      setAssessment(data.assessment);
      setQuestions(data.questions ?? []);
      setCurrent(0);
      setAnswers({});
    } catch (err) {
      console.error('Failed to start assessment:', err);
      setError('Could not start the assessment.');
    } finally {
      setStarting(false);
    }
  };

  const submit = async () => {
    const headers = authHeaders();
    if (!headers || !assessment) return;

    setSubmitting(true);
    setError('');

    try {
      const payload = questions.map((question) => ({
        questionId: question.id,
        answerIndex: answers[question.id],
      }));

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/assessments/${assessment.id}/interactive-submit`,
        {
          method: 'POST',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({ answers: payload }),
        },
      );

      const data = await res.json();

      if (!res.ok) {
        setError(data.message ?? 'Could not submit the assessment.');
        return;
      }

      setResult(data);
    } catch (err) {
      console.error('Failed to submit assessment:', err);
      setError('Could not submit the assessment.');
    } finally {
      setSubmitting(false);
    }
  };

  // --- Result ---
  if (result) {
    const responses = result.responses ?? {};
    const categories = responses.categoryResults ?? [];

    return (
      <div className="max-w-2xl mx-auto p-8 space-y-6">
        <Card>
          <CardHeader className="text-center space-y-3">
            <CardTitle className="text-2xl">Assessment complete</CardTitle>
            <CardDescription>{result.title}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-lg bg-blue-50 p-6 text-center space-y-2">
              <p className="text-gray-600">Your score</p>
              <p className="text-5xl font-bold text-blue-600">
                {result.score} / {result.maxScore}
              </p>
              {result.classification ? (
                <Badge variant="outline">{result.classification}</Badge>
              ) : null}
            </div>

            <p className="text-center text-gray-600">
              {responses.correctCount} of {responses.totalQuestions} correct
            </p>

            {categories.length ? (
              <div className="space-y-2">
                <h3 className="font-semibold">By category</h3>
                {categories.map((item: any) => (
                  <div
                    key={item.category}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <span className="text-sm">{item.category}</span>
                    <span className="text-sm text-gray-500">
                      {item.correct} / {item.total}
                    </span>
                  </div>
                ))}
              </div>
            ) : null}

            <div className="space-y-2">
              <Link href="/placement">
                <Button className="w-full">View placement readiness</Button>
              </Link>
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
  if (!assessment) {
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
            <CardTitle>Technical Assessment</CardTitle>
            <CardDescription>
              Ten questions across Python, Django, REST APIs, databases,
              JavaScript, Git, testing and debugging.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              Your answers are scored on the server. This assessment counts
              towards your placement readiness.
            </p>

            {error ? (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
                {error}
              </div>
            ) : null}

            <Button onClick={start} disabled={starting}>
              {starting ? 'Starting...' : 'Start assessment'}
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
          <CardTitle>Technical Assessment</CardTitle>
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>
              Question {current + 1} of {questions.length}
            </span>
            <span>{answered} answered</span>
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
          <Badge variant="outline">{question.category}</Badge>
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
          <Button
            className="flex-1"
            onClick={() => setCurrent((value) => value + 1)}
          >
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
                ? 'Submit assessment'
                : `Answer all ${questions.length} questions`}
          </Button>
        )}
      </div>
    </div>
  );
}
