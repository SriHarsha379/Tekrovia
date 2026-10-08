'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { ArrowLeft, Lock } from 'lucide-react';

const STATUS_LABEL: Record<string, string> = {
  SUBMITTED: 'Awaiting review',
  APPROVED: 'Approved',
  CHANGES_REQUESTED: 'Changes requested',
};

function StatusBadge({ status }: { status: string | null }) {
  if (!status) return <Badge variant="outline">Not submitted</Badge>;
  return (
    <Badge variant={status === 'APPROVED' ? 'default' : 'secondary'}>
      {STATUS_LABEL[status] ?? status}
    </Badge>
  );
}

export default function MyWorkPage() {
  const router = useRouter();

  const [assignments, setAssignments] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openForm, setOpenForm] = useState<string | null>(null);
  const [submissionUrl, setSubmissionUrl] = useState('');
  const [submissionText, setSubmissionText] = useState('');
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
        fetch(`${base}/api/v1/assignments/my`, { headers }),
        fetch(`${base}/api/v1/projects/my`, { headers }),
      ]);

      if (assignmentRes.status === 401) {
        sessionStorage.removeItem('tekrovia_access_token');
        router.replace('/login');
        return;
      }

      setAssignments(await assignmentRes.json());
      setProjects(await projectRes.json());
    } catch (err) {
      console.error('Failed to load work:', err);
      setError('Could not load your work. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  const submit = async (url: string, key: string) => {
    const headers = authHeaders();
    if (!headers) return;

    if (!submissionUrl.trim() && !submissionText.trim()) {
      setError('Add a link or a note before submitting.');
      return;
    }

    setPending(true);
    setError('');

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${url}`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionUrl: submissionUrl.trim() || null,
          submissionText: submissionText.trim() || null,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.message ?? 'Submission failed.');
        return;
      }

      setOpenForm(null);
      setSubmissionUrl('');
      setSubmissionText('');
      await load();
    } catch (err) {
      console.error('Submission failed:', err);
      setError('Submission failed.');
    } finally {
      setPending(false);
    }
  };

  const SubmitForm = ({ url, formKey }: { url: string; formKey: string }) => (
    <div className="mt-4 space-y-3 border-t pt-4">
      <input
        type="url"
        placeholder="Link to your work (GitHub, deployed URL)"
        value={submissionUrl}
        onChange={(event) => setSubmissionUrl(event.target.value)}
        className="w-full rounded-lg border px-3 py-2 text-sm"
      />
      <textarea
        placeholder="Notes for your reviewer (optional)"
        value={submissionText}
        onChange={(event) => setSubmissionText(event.target.value)}
        rows={3}
        className="w-full rounded-lg border px-3 py-2 text-sm"
      />
      <div className="flex gap-2">
        <Button size="sm" disabled={pending} onClick={() => submit(url, formKey)}>
          {pending ? 'Submitting...' : 'Submit for review'}
        </Button>
        <Button size="sm" variant="outline" onClick={() => setOpenForm(null)}>
          Cancel
        </Button>
      </div>
    </div>
  );

  if (loading) return <div className="p-8">Loading your work...</div>;

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
        <h1 className="text-3xl font-bold">My Work</h1>
        <p className="text-gray-500">Assignments and guided projects for your courses</p>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
          {error}
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Assignments</CardTitle>
          <CardDescription>Short exercises attached to your lessons</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {assignments.length === 0 ? (
            <p className="text-gray-500">No assignments yet.</p>
          ) : (
            assignments.map((assignment) => (
              <div key={assignment.id} className="rounded-lg border p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium">{assignment.title}</p>
                    <p className="text-sm text-gray-500">
                      {assignment.course?.title} &middot; {assignment.lesson?.title}
                    </p>
                    <p className="mt-2 text-sm text-gray-600">{assignment.instructions}</p>
                  </div>
                  <StatusBadge status={assignment.latestStatus} />
                </div>

                {openForm === `assignment-${assignment.id}` ? (
                  <SubmitForm
                    url={`/api/v1/assignments/${assignment.id}/submit`}
                    formKey={`assignment-${assignment.id}`}
                  />
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-3"
                    onClick={() => {
                      setOpenForm(`assignment-${assignment.id}`);
                      setError('');
                    }}
                  >
                    {assignment.latestStatus ? 'Submit again' : 'Submit work'}
                  </Button>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Projects</CardTitle>
          <CardDescription>
            Milestones unlock as the previous one is approved
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {projects.length === 0 ? (
            <p className="text-gray-500">No projects yet.</p>
          ) : (
            projects.map((project) => (
              <div key={project.id} className="space-y-3">
                <div>
                  <p className="font-medium">{project.title}</p>
                  <p className="text-sm text-gray-500">{project.businessProblem}</p>
                </div>

                {project.milestones.map((milestone: any) => (
                  <div key={milestone.id} className="rounded-lg border p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        {milestone.unlocked ? null : (
                          <Lock className="mt-1 h-4 w-4 flex-shrink-0 text-gray-300" />
                        )}
                        <div>
                          <p className="font-medium">
                            {milestone.title}
                            {milestone.isFinal ? (
                              <span className="ml-2 text-xs text-gray-400">Final</span>
                            ) : null}
                          </p>
                          <p className="text-sm text-gray-500">{milestone.description}</p>
                        </div>
                      </div>
                      <StatusBadge status={milestone.latestStatus} />
                    </div>

                    {!milestone.unlocked ? (
                      <p className="mt-3 text-sm text-gray-400">
                        Unlocks when the previous milestone is approved.
                      </p>
                    ) : openForm === `milestone-${milestone.id}` ? (
                      <SubmitForm
                        url={`/api/v1/projects/milestones/${milestone.id}/submit`}
                        formKey={`milestone-${milestone.id}`}
                      />
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-3"
                        onClick={() => {
                          setOpenForm(`milestone-${milestone.id}`);
                          setError('');
                        }}
                      >
                        {milestone.latestStatus ? 'Submit again' : 'Submit work'}
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
