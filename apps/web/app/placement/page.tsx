'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { CheckCircle2, Circle, ArrowLeft, Info } from 'lucide-react';

interface CheckRow {
  key: string;
  label: string;
  detail: string;
  complete: boolean;
}

export default function PlacementReadinessPage() {
  const router = useRouter();
  const [readiness, setReadiness] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const token = sessionStorage.getItem('tekrovia_access_token');

      if (!token) {
        router.replace('/login');
        return;
      }

      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/placements/me/readiness`,
          { headers: { Authorization: `Bearer ${token}` } },
        );

        if (res.status === 401) {
          sessionStorage.removeItem('tekrovia_access_token');
          router.replace('/login');
          return;
        }

        setReadiness(await res.json());
      } catch (error) {
        console.error('Failed to load readiness:', error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [router]);

  if (loading) return <div className="p-8">Loading readiness...</div>;

  if (!readiness) {
    return (
      <div className="p-8 space-y-4">
        <p className="text-gray-600">
          Readiness information is not available for your profile yet.
        </p>
        <Link href="/dashboard">
          <Button variant="outline">Back to dashboard</Button>
        </Link>
      </div>
    );
  }

  const checks = readiness.checks ?? {};

  const rows: CheckRow[] = [
    {
      key: 'profile',
      label: 'Profile complete',
      detail: readiness.profileComplete
        ? 'All profile details on file'
        : 'Add your resume, availability and preferred schedule',
      complete: Boolean(readiness.profileComplete),
    },
    {
      key: 'expertMocks',
      label: 'Expert mock interviews',
      detail: `${checks.expertMocks?.completedCount ?? 0} of ${checks.expertMocks?.requiredCount ?? 3} completed`,
      complete: Boolean(checks.expertMocks?.complete),
    },
    {
      key: 'finalExpertMock',
      label: 'Final mock score',
      detail:
        checks.finalExpertMock?.score === null ||
        checks.finalExpertMock?.score === undefined
          ? `Not attempted — ${checks.finalExpertMock?.requiredScore ?? 8}+ required`
          : `Scored ${checks.finalExpertMock.score} of ${checks.finalExpertMock.maxScore}`,
      complete: Boolean(checks.finalExpertMock?.complete),
    },
    {
      key: 'expertApprovedProject',
      label: 'Expert-approved project',
      detail: `${checks.expertApprovedProject?.approvedCount ?? 0} approved`,
      complete: Boolean(checks.expertApprovedProject?.complete),
    },
    {
      key: 'technicalAssessment',
      label: 'Technical assessment',
      detail:
        checks.technicalAssessment?.score === null ||
        checks.technicalAssessment?.score === undefined
          ? 'Not attempted'
          : `Scored ${checks.technicalAssessment.score} of ${checks.technicalAssessment.maxScore}`,
      complete: Boolean(checks.technicalAssessment?.complete),
    },
  ];

  const completedCount = rows.filter((row) => row.complete).length;
  const percent = Math.round((completedCount / rows.length) * 100);

  const decisionLabel: Record<string, string> = {
    PENDING: 'Awaiting review',
    APPROVED: 'Approved for placement',
    NEEDS_WORK: 'More preparation needed',
  };

  return (
    <div className="max-w-3xl mx-auto p-8 space-y-6">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to dashboard
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Placement Readiness</CardTitle>
          <CardDescription>
            What you need in place before we put you forward to employers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Badge variant={readiness.decision === 'APPROVED' ? 'default' : 'secondary'}>
              {decisionLabel[readiness.decision] ?? readiness.decision}
            </Badge>
            <span className="text-sm text-gray-500">
              {completedCount} of {rows.length} requirements met
            </span>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all"
              style={{ width: `${percent}%` }}
            ></div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Requirements</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {rows.map((row) => (
            <div
              key={row.key}
              className="flex items-start gap-3 p-4 border rounded-lg"
            >
              {row.complete ? (
                <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
              ) : (
                <Circle className="w-5 h-5 text-gray-300 mt-0.5 flex-shrink-0" />
              )}
              <div>
                <p className="font-medium">{row.label}</p>
                <p className="text-sm text-gray-500">{row.detail}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {readiness.approvalRequiresHumanReview ? (
        <div className="flex gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-900">
            Meeting every requirement does not approve you automatically. A
            placement manager reviews each profile before it goes to employers.
          </p>
        </div>
      ) : null}
    </div>
  );
}
