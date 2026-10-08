'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { ArrowLeft, ExternalLink } from 'lucide-react';

export default function ReviewQueuePage() {
  const router = useRouter();

  const [assignments, setAssignments] = useState<any[]>([]);
  const [milestones, setMilestones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  const authHeaders = () => {
    const token = sessionStorage.getItem('tekrovia_access_token');
    return token ? { Authorization: `Bearer ${token}` } : null;
  };

  const load = useCallback(async () => {
    const headers = authHeaders();

    if (!headers) {
      router.replace('/login');
      return;
    }

    try {
      const base = process.env.NEXT_PUBLIC_API_URL;
      const [assignmentRes, projectRes] = await Promise.all([
        fetch(`${base}/api/v1/assignments/review`, { headers }),
        fetch(`${base}/api/v1/projects/review`, { headers }),
      ]);

      if (assignmentRes.status === 401) {
        sessionStorage.removeItem('tekrovia_access_token');
        router.replace('/login');
        return;
      }

      if (assignmentRes.status === 403) {
        setError('Your account does not have reviewer access.');
        return;
      }

      const assignmentData = await assignmentRes.json();
      const projectData = await projectRes.json();

      setAssignments(assignmentData.items ?? []);
      setMilestones(projectData.items ?? []);
    } catch (err) {
      console.error('Failed to load review queue:', err);
      setError('Could not load the review queue.');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  const review = async (url: string, status: string) => {
    const headers = authHeaders();
    if (!headers) return;

    setPending(true);
    setError('');

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${url}`, {
        method: 'PATCH',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          feedback: feedback.trim() || null,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.message ?? 'Review failed.');
        return;
      }

      setOpenId(null);
      setFeedback('');
      await load();
    } catch (err) {
      console.error('Review failed:', err);
      setError('Review failed.');
    } finally {
      setPending(false);
    }
  };

  const ReviewActions = ({ url, id }: { url: string; id: string }) => {
    if (openId !== id) {
      return (
        <Button
          size="sm"
          variant="outline"
          className="mt-3"
          onClick={() => {
            setOpenId(id);
            setFeedback('');
            setError('');
          }}
        >
          Review
        </Button>
      );
    }

    return (
      <div className="mt-4 space-y-3 border-t pt-4">
        <textarea
          placeholder="Feedback for the student"
          value={feedback}
          onChange={(event) => setFeedback(event.target.value)}
          rows={3}
          className="w-full rounded-lg border px-3 py-2 text-sm"
        />
        <div className="flex flex-wrap gap-2">
          <Button size="sm" disabled={pending} onClick={() => review(url, 'APPROVED')}>
            {pending ? 'Saving...' : 'Approve'}
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={() => review(url, 'CHANGES_REQUESTED')}
          >
            Request changes
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setOpenId(null)}>
            Cancel
          </Button>
        </div>
      </div>
    );
  };

  if (loading) return <div className="p-8">Loading review queue...</div>;

  return (
    <div className="max-w-3xl mx-auto p-8 space-y-6">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to dashboard
      </Link>

      <div className="space-y-1">
        <h1 className="text-3xl font-bold">Review Queue</h1>
        <p className="text-gray-500">Student work waiting for your decision</p>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
          {error}
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Assignments</CardTitle>
          <CardDescription>{assignments.length} awaiting review</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {assignments.length === 0 ? (
            <p className="text-gray-500">Nothing in the queue.</p>
          ) : (
            assignments.map((item) => (
              <div key={item.id} className="rounded-lg border p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium">{item.assignment?.title}</p>
                    <p className="text-sm text-gray-500">
                      {item.user?.name} &middot; {item.assignment?.lesson?.module?.course?.title}
                    </p>
                    <p className="mt-1 text-xs text-gray-400">
                      Attempt {item.attemptNumber}
                    </p>
                  </div>
                  <Badge variant="secondary">Awaiting review</Badge>
                </div>

                {item.submissionUrl ? (
                  <a
                    href={item.submissionUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
                  >
                    Open submission
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ) : null}

                {item.submissionText ? (
                  <p className="mt-2 text-sm text-gray-600">{item.submissionText}</p>
                ) : null}

                <ReviewActions
                  url={`/api/v1/assignments/submissions/${item.id}/review`}
                  id={`assignment-${item.id}`}
                />
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Project milestones</CardTitle>
          <CardDescription>{milestones.length} awaiting review</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {milestones.length === 0 ? (
            <p className="text-gray-500">Nothing in the queue.</p>
          ) : (
            milestones.map((item) => (
              <div key={item.id} className="rounded-lg border p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium">
                      {item.milestone?.title}
                      {item.milestone?.isFinal ? (
                        <span className="ml-2 text-xs text-gray-400">Final</span>
                      ) : null}
                    </p>
                    <p className="text-sm text-gray-500">
                      {item.user?.name} &middot; {item.milestone?.project?.title}
                    </p>
                    <p className="mt-1 text-xs text-gray-400">
                      Attempt {item.attemptNumber}
                    </p>
                  </div>
                  <Badge variant="secondary">Awaiting review</Badge>
                </div>

                {item.submissionUrl ? (
                  <a
                    href={item.submissionUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
                  >
                    Open submission
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ) : null}

                {item.submissionText ? (
                  <p className="mt-2 text-sm text-gray-600">{item.submissionText}</p>
                ) : null}

                <ReviewActions
                  url={`/api/v1/projects/submissions/${item.id}/review`}
                  id={`milestone-${item.id}`}
                />
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
