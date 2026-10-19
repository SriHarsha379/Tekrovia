'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  CheckCircle2,
  ClipboardList,
  GraduationCap,
  LoaderCircle,
  Play,
  RefreshCw,
  Sparkles,
  Target,
  TrendingUp,
  Zap,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress';

type DashboardOverview = {
  user?: {
    name?: string | null;
    email?: string | null;
  };
  stats?: {
    coursesEnrolled?: number;
    assessmentsTaken?: number;
    assessmentsCompleted?: number;
    lessonsCompleted?: number;
  };
};

type DashboardStats = {
  lessonsCompleted?: number;
  lessonsTotal?: number;
  completionRate?: number;
  averageScore?: number | null;
};

type EnrolledCourse = {
  id: string;
  courseId: string;
  course: {
    id: string;
    title: string;
    description?: string | null;
    duration?: string | null;
  };
  progress?: number;
  status?: string;
};

type DashboardData = {
  overview: DashboardOverview | null;
  courses: EnrolledCourse[];
  stats: DashboardStats | null;
};

const initialData: DashboardData = {
  overview: null,
  courses: [],
  stats: null,
};

function getProgress(value?: number | null) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, value));
}

function getFirstName(name?: string | null) {
  if (!name?.trim()) return 'there';
  return name.trim().split(/\s+/)[0];
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData>(initialData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboard = useCallback(async () => {
    const token = sessionStorage.getItem('tekrovia_access_token');

    if (!token) {
      window.location.replace('/login');
      return;
    }

    setLoading(true);
    setError('');

    const base = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, '');

    if (!base) {
      setError('The API URL is not configured. Please contact support.');
      setLoading(false);
      return;
    }

    try {
      const headers = { Authorization: `Bearer ${token}` };

      const [overviewRes, coursesRes, statsRes] = await Promise.all([
        fetch(`${base}/api/v1/dashboard/overview`, { headers }),
        fetch(`${base}/api/v1/dashboard/courses`, { headers }),
        fetch(`${base}/api/v1/dashboard/stats`, { headers }),
      ]);

      if (
        overviewRes.status === 401 ||
        coursesRes.status === 401 ||
        statsRes.status === 401
      ) {
        sessionStorage.removeItem('tekrovia_access_token');
        window.location.replace('/login');
        return;
      }

      if (!overviewRes.ok || !coursesRes.ok || !statsRes.ok) {
        throw new Error('Some dashboard information could not be loaded.');
      }

      const [overview, courses, stats] = await Promise.all([
        overviewRes.json(),
        coursesRes.json(),
        statsRes.json(),
      ]);

      setData({
        overview,
        courses: Array.isArray(courses) ? courses : [],
        stats,
      });
    } catch (err) {
      console.error('Failed to fetch dashboard:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Could not load your dashboard. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchDashboard();
  }, [fetchDashboard]);

  if (loading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center bg-slate-50 px-6">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <LoaderCircle className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-sm font-medium">Preparing your learning space...</p>
        </div>
      </main>
    );
  }

  if (error && !data.overview) {
    return (
      <main className="min-h-[60vh] bg-slate-50 p-5 sm:p-8">
        <Card className="mx-auto max-w-xl border-slate-200">
          <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
            <div className="rounded-full bg-red-50 p-3 text-red-600">
              <RefreshCw className="h-6 w-6" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">
              Unable to load your dashboard
            </h1>
            <p className="text-sm text-slate-600">{error}</p>
            <Button onClick={() => void fetchDashboard()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Try again
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  const { overview, courses, stats } = data;
  const activeCourses = courses.filter(
    (course) => course.status !== 'CANCELLED',
  );
  const nextCourse =
    activeCourses.find((course) => getProgress(course.progress) < 100) ??
    activeCourses[0];

  const lessonsCompleted =
    stats?.lessonsCompleted ?? overview?.stats?.lessonsCompleted ?? 0;
  const lessonsTotal = stats?.lessonsTotal ?? 0;
  const completionRate = getProgress(stats?.completionRate);
  const assessmentsTaken = overview?.stats?.assessmentsTaken ?? 0;
  const averageScore = stats?.averageScore;

  const statCards = [
    {
      label: 'My courses',
      value: overview?.stats?.coursesEnrolled ?? activeCourses.length,
      detail: 'Courses enrolled',
      icon: BookOpen,
      color: 'bg-blue-50 text-blue-700',
    },
    {
      label: 'Lessons completed',
      value: lessonsCompleted,
      detail:
        lessonsTotal > 0
          ? `Out of ${lessonsTotal} lessons`
          : 'Keep learning at your pace',
      icon: CheckCircle2,
      color: 'bg-emerald-50 text-emerald-700',
    },
    {
      label: 'Assessments',
      value: assessmentsTaken,
      detail: `${overview?.stats?.assessmentsCompleted ?? 0} completed`,
      icon: Zap,
      color: 'bg-amber-50 text-amber-700',
    },
    {
      label: 'Average score',
      value:
        typeof averageScore === 'number' ? `${averageScore}%` : '—',
      detail:
        typeof averageScore === 'number'
          ? 'Across completed scored assessments'
          : 'Complete an assessment to see your score',
      icon: BarChart3,
      color: 'bg-violet-50 text-violet-700',
    },
  ];

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-7xl space-y-7 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {error ? (
          <div
            role="alert"
            className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 sm:flex-row sm:items-center sm:justify-between"
          >
            <p>{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void fetchDashboard()}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </div>
        ) : null}

        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-blue-950 to-blue-800 p-6 text-white shadow-lg sm:p-9">
          <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full border border-white/10" />
          <div className="pointer-events-none absolute -right-5 -top-8 h-44 w-44 rounded-full border border-white/10" />

          <div className="relative z-10 max-w-3xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium text-blue-100">
              <Sparkles className="h-4 w-4" />
              YOUR LEARNING JOURNEY
            </div>

            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Welcome back, {getFirstName(overview?.user?.name)}!
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100 sm:text-base">
              Every lesson takes you one step forward. Pick up where you left
              off and keep building skills for your career.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              {nextCourse ? (
                <Link href={`/courses/${nextCourse.courseId}`}>
                  <Button
                    size="lg"
                    className="bg-white text-blue-950 hover:bg-blue-50"
                  >
                    <Play className="mr-2 h-4 w-4" />
                    Continue learning
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              ) : (
                <Link href="/technical-assessment">
                  <Button
                    size="lg"
                    className="bg-white text-blue-950 hover:bg-blue-50"
                  >
                    <Zap className="mr-2 h-4 w-4" />
                    Explore assessments
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              )}

              <Link href="/work">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/40 bg-white/5 text-white hover:bg-white/15 hover:text-white"
                >
                  View my work
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <section aria-label="Learning statistics">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold sm:text-xl">Your progress</h2>
              <p className="mt-1 text-sm text-slate-500">
                A snapshot of your learning journey
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => void fetchDashboard()}
              aria-label="Refresh dashboard"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {statCards.map((item) => {
              const Icon = item.icon;

              return (
                <Card
                  key={item.label}
                  className="border-slate-200/80 shadow-sm transition-shadow hover:shadow-md"
                >
                  <CardContent className="flex items-start justify-between gap-3 p-5">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-500">
                        {item.label}
                      </p>
                      <p className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
                        {item.value}
                      </p>
                      <p className="mt-2 text-xs leading-5 text-slate-500">
                        {item.detail}
                      </p>
                    </div>
                    <div className={`rounded-xl p-3 ${item.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="space-y-4 xl:col-span-2">
            <div className="flex items-end justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold sm:text-xl">Continue learning</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Your enrolled courses and progress
                </p>
              </div>
              <Badge variant="outline">
                {activeCourses.length} {activeCourses.length === 1 ? 'course' : 'courses'}
              </Badge>
            </div>

            {activeCourses.length === 0 ? (
              <Card className="border-dashed border-slate-300 shadow-sm">
                <CardContent className="flex flex-col items-center px-6 py-10 text-center">
                  <div className="rounded-2xl bg-blue-50 p-4 text-blue-700">
                    <GraduationCap className="h-8 w-8" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold">
                    Your learning journey starts here
                  </h3>
                  <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                    You do not have any active course enrollments yet. You can
                    explore assessments or check your existing work while your
                    learning plan is being set up.
                  </p>
                  <div className="mt-5 flex flex-wrap justify-center gap-3">
                    <Link href="/technical-assessment">
                      <Button>
                        Explore assessments
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                    <Link href="/work">
                      <Button variant="outline">View my work</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {activeCourses.map((course) => {
                  const progress = getProgress(course.progress);
                  const completed = progress >= 100;

                  return (
                    <Card
                      key={course.id}
                      className="border-slate-200/80 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                    >
                      <CardContent className="p-5 sm:p-6">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                            <BookOpen className="h-6 w-6" />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="font-semibold text-slate-950">
                                {course.course?.title ?? 'Your course'}
                              </h3>
                              {completed ? (
                                <Badge className="bg-emerald-100 text-emerald-800">
                                  Completed
                                </Badge>
                              ) : progress > 0 ? (
                                <Badge variant="secondary">In progress</Badge>
                              ) : (
                                <Badge variant="outline">Not started</Badge>
                              )}
                            </div>

                            <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">
                              {course.course?.description ||
                                'Continue learning and make progress toward your goals.'}
                            </p>

                            <div className="mt-5">
                              <div className="mb-2 flex items-center justify-between gap-3 text-xs">
                                <span className="text-slate-500">
                                  Course progress
                                </span>
                                <span className="font-semibold text-slate-800">
                                  {progress}%
                                </span>
                              </div>
                              <Progress
                                value={progress}
                                className="[&>div]:bg-blue-600"
                                aria-label={`${course.course?.title ?? 'Course'} progress`}
                              />
                            </div>

                            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                              {course.course?.duration ? (
                                <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                                  <TrendingUp className="h-3.5 w-3.5" />
                                  {course.course.duration}
                                </span>
                              ) : (
                                <span className="text-xs text-slate-500">
                                  Keep up your momentum
                                </span>
                              )}

                              <Link href={`/courses/${course.courseId}`}>
                                <Button size="sm">
                                  {completed ? 'Review course' : 'Open course'}
                                  <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                              </Link>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          <aside className="space-y-4">
            <div>
              <h2 className="text-lg font-bold sm:text-xl">Your next steps</h2>
              <p className="mt-1 text-sm text-slate-500">
                Keep moving toward your career goals
              </p>
            </div>

            <Card className="border-slate-200/80 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-amber-50 p-2.5 text-amber-700">
                    <ClipboardList className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Assignments & projects</CardTitle>
                    <CardDescription className="mt-1">
                      Work on practical skills
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Link
                  href="/work"
                  className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-3 text-sm font-medium transition-colors hover:bg-slate-50"
                >
                  Open my work
                  <ArrowRight className="h-4 w-4 text-slate-500" />
                </Link>
              </CardContent>
            </Card>

            <Card className="border-slate-200/80 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-violet-50 p-2.5 text-violet-700">
                    <Zap className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Technical assessment</CardTitle>
                    <CardDescription className="mt-1">
                      Practice and review your skills
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Link
                  href="/technical-assessment"
                  className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-3 text-sm font-medium transition-colors hover:bg-slate-50"
                >
                  View assessments
                  <ArrowRight className="h-4 w-4 text-slate-500" />
                </Link>
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-blue-100 bg-gradient-to-br from-blue-50 to-white shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-white p-2.5 text-blue-700 shadow-sm">
                    <Target className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Career readiness</CardTitle>
                    <CardDescription className="mt-1">
                      Check your placement journey
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4 rounded-lg bg-white/80 p-3">
                  <div className="mb-2 flex items-center justify-between gap-2 text-xs">
                    <span className="text-slate-600">Lesson completion</span>
                    <span className="font-semibold text-slate-900">
                      {completionRate}%
                    </span>
                  </div>
                  <Progress value={completionRate} />
                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    Learning progress is one part of career preparation, not a
                    placement-readiness decision.
                  </p>
                </div>
                <Link
                  href="/placement"
                  className="flex items-center justify-between rounded-lg bg-blue-700 px-3 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-800"
                >
                  View placement status
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </CardContent>
            </Card>
          </aside>
        </section>

        <footer className="flex flex-col gap-3 border-t border-slate-200 py-5 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>Small steps today. Stronger skills tomorrow.</p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 self-start font-medium text-slate-600 hover:text-blue-700 sm:self-auto"
          >
            <GraduationCap className="h-4 w-4" />
            TekRovia Learning
          </Link>
        </footer>
      </div>
    </main>
  );
}
