'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { CheckCircle2, Circle, ArrowLeft, Play, Lock } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL;
const SAVE_EVERY_SECONDS = 5;

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params?.courseId as string;

  const [course, setCourse] = useState<any>(null);
  const [lesson, setLesson] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [checkpoints, setCheckpoints] = useState<any[]>([]);
  const [resources, setResources] = useState<any[]>([]);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const lastSavedAt = useRef(0);
  const watched = useRef(0);

  const token = () =>
    typeof window === 'undefined'
      ? null
      : sessionStorage.getItem('tekrovia_access_token');

  const loadProgress = useCallback(async () => {
    const t = token();
    if (!t) { router.replace('/login'); return; }

    try {
      const res = await fetch(`${API}/api/v1/courses/my/progress`, {
        headers: { Authorization: `Bearer ${t}` },
      });
      if (res.status === 401) {
        sessionStorage.removeItem('tekrovia_access_token');
        router.replace('/login');
        return;
      }
      const data = await res.json();
      const cpRes = await fetch(
        `${API}/api/v1/checkpoints/courses/${courseId}`,
        { headers: { Authorization: `Bearer ${t}` } },
      );
      if (cpRes.ok) {
        const cps = await cpRes.json();
        setCheckpoints(Array.isArray(cps) ? cps : []);
      }

      setCourse(
        Array.isArray(data)
          ? data.find((c: any) => c.courseId === courseId) ?? null
          : null,
      );
    } catch {
      setError('Could not load this course.');
    } finally {
      setLoading(false);
    }
  }, [courseId, router]);

  useEffect(() => { loadProgress(); }, [loadProgress]);

  const openLesson = async (lessonId: string) => {
    const t = token();
    if (!t) return;
    setError('');

    try {
      const res = await fetch(`${API}/api/v1/courses/lessons/${lessonId}`, {
        headers: { Authorization: `Bearer ${t}` },
      });
      if (!res.ok) { setError('Could not open that lesson.'); return; }

      const data = await res.json();
      watched.current = data.progress?.watchedSeconds ?? 0;
      lastSavedAt.current = 0;
      setLesson(data);

      const extra = await fetch(`${API}/api/v1/resources/lesson/${lessonId}`, {
        headers: { Authorization: `Bearer ${t}` },
      });
      setResources(extra.ok ? await extra.json() : []);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      setError('Could not open that lesson.');
    }
  };

  const saveProgress = useCallback(async (position: number) => {
    const t = token();
    if (!t || !lesson) return;

    try {
      await fetch(`${API}/api/v1/courses/lessons/${lesson.id}/progress`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${t}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          watchedSeconds: Math.floor(watched.current),
          lastPositionSeconds: Math.floor(position),
        }),
      });
    } catch {
      // A dropped progress ping is not worth interrupting playback for.
    }
  }, [lesson]);

  // Count real watched time rather than scrub position, so skipping
  // to the end does not mark a lesson complete.
  const onTimeUpdate = () => {
    const el = videoRef.current;
    if (!el) return;

    const now = el.currentTime;
    watched.current += 0.25;

    if (now - lastSavedAt.current >= SAVE_EVERY_SECONDS) {
      lastSavedAt.current = now;
      void saveProgress(now);
    }
  };

  const onPause = () => {
    const el = videoRef.current;
    if (el) void saveProgress(el.currentTime);
  };

  const onEnded = async () => {
    const el = videoRef.current;
    if (el) await saveProgress(el.currentTime);
    await loadProgress();
  };

  if (loading) return <div className="p-8">Loading course...</div>;

  if (!course) {
    return (
      <div className="p-8 space-y-4">
        <p className="text-gray-600">
          You are not enrolled in this course, or it could not be found.
        </p>
        <Link href="/dashboard">
          <Button variant="outline">Back to dashboard</Button>
        </Link>
      </div>
    );
  }

  // Lowest module order with an unpassed gate; everything after it is locked.
  const blockingOrder = checkpoints
    .filter((c: any) => !c.passed)
    .reduce(
      (min: number | null, c: any) =>
        min === null ? c.toModuleOrder : Math.min(min, c.toModuleOrder),
      null as number | null,
    );

  const isLocked = (moduleOrder: number) =>
    blockingOrder !== null && moduleOrder > blockingOrder;

  const playable =
    lesson?.videoUrl && !lesson.videoUrl.includes('example.com');

  return (
    <div className="max-w-4xl mx-auto p-8 space-y-6">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to dashboard
      </Link>

      {lesson ? (
        <Card>
          <CardHeader>
            <CardTitle>{lesson.title}</CardTitle>
            {lesson.description ? (
              <CardDescription>{lesson.description}</CardDescription>
            ) : null}
          </CardHeader>
          <CardContent className="space-y-4">
            {playable ? (
              <video
                ref={videoRef}
                src={lesson.videoUrl}
                controls
                className="w-full rounded-lg bg-black"
                onLoadedMetadata={() => {
                  const el = videoRef.current;
                  const resume = lesson.progress?.lastPositionSeconds ?? 0;
                  if (el && resume > 0 && resume < el.duration - 5) {
                    el.currentTime = resume;
                  }
                }}
                onTimeUpdate={onTimeUpdate}
                onPause={onPause}
                onEnded={onEnded}
              />
            ) : (
              <div className="rounded-lg border border-dashed p-8 text-center text-gray-500">
                <p className="font-medium">No video set for this lesson yet.</p>
                <p className="mt-1 text-sm">
                  An admin can add one via the lesson settings.
                </p>
              </div>
            )}

            {lesson.content ? (
              <div className="prose prose-sm max-w-none text-gray-700">
                {lesson.content}
              </div>
            ) : null}

            {resources.length > 0 && (
              <div className="space-y-3 border-t pt-4">
                {resources.map((r: any) => (
                  <details key={r.id} className="rounded-lg border bg-gray-50/60 p-4">
                    <summary className="flex cursor-pointer items-center justify-between gap-3 font-medium">
                      <span className="flex items-center gap-2">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          r.type === 'LAB' ? 'bg-emerald-100 text-emerald-800'
                          : r.type === 'ACTIVITY' ? 'bg-sky-100 text-sky-800'
                          : r.type === 'INTERVIEW_QUESTIONS' ? 'bg-violet-100 text-violet-800'
                          : r.type === 'DOWNLOAD' ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-200 text-slate-700'
                        }`}>
                          {r.type === 'INTERVIEW_QUESTIONS' ? 'Interview questions'
                            : r.type.charAt(0) + r.type.slice(1).toLowerCase()}
                        </span>
                        {r.title}
                      </span>
                    </summary>
                    {r.body && (
                      <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-gray-700">
                        {r.body}
                      </p>
                    )}
                    {r.url && (
                      <a href={r.url} target="_blank" rel="noreferrer"
                        className="mt-3 inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium hover:bg-white">
                        Open resource →
                      </a>
                    )}
                  </details>
                ))}
              </div>
            )}

            <Button variant="outline" size="sm" onClick={() => setLesson(null)}>
              Close lesson
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>{course.courseTitle}</CardTitle>
          <CardDescription>
            {course.completedLessons} of {course.totalLessons} lessons complete
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all"
              style={{ width: `${course.progressPercent}%` }}
            />
          </div>
          <p className="text-sm text-gray-500">
            {course.progressPercent}% complete
          </p>
        </CardContent>
      </Card>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
          {error}
        </div>
      ) : null}

      {course.modules.map((module: any, mIndex: number) => {
        const locked = isLocked(mIndex);
        const gate = checkpoints.find((c: any) => c.toModuleOrder === mIndex);

        return (
          <div key={module.id} className="space-y-3">
            <Card className={locked ? 'opacity-60' : ''}>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">{module.title}</CardTitle>
                {locked ? (
                  <Badge variant="outline" className="gap-1.5">
                    <Lock className="w-3 h-3" />
                    Locked
                  </Badge>
                ) : null}
              </CardHeader>
              <CardContent className="space-y-3">
                {locked ? (
                  <p className="text-sm text-gray-500">
                    Pass the previous checkpoint to unlock these lessons.
                  </p>
                ) : (
                  module.lessons.map((l: any) => (
                    <div
                      key={l.id}
                      className="flex items-center justify-between gap-4 p-4 border rounded-lg"
                    >
                      <div className="flex items-start gap-3">
                        {l.completed ? (
                          <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
                        ) : (
                          <Circle className="w-5 h-5 text-gray-300 mt-0.5" />
                        )}
                        <div>
                          <p className="font-medium">{l.title}</p>
                          {l.duration ? (
                            <p className="text-sm text-gray-500">{l.duration}</p>
                          ) : null}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {l.completed ? (
                          <Badge variant="secondary">Completed</Badge>
                        ) : null}
                        <Button
                          size="sm"
                          variant={l.completed ? 'outline' : 'default'}
                          onClick={() => openLesson(l.id)}
                        >
                          <Play className="w-3.5 h-3.5 mr-1.5" />
                          {l.completed ? 'Rewatch' : 'Watch'}
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {gate ? (
              <Card className="border-blue-200 bg-blue-50/50">
                <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div>
                    <p className="font-medium">{gate.title}</p>
                    <p className="text-sm text-gray-600">
                      {gate.passed
                        ? `Passed with ${gate.bestScorePercent}%`
                        : gate.unlocked
                          ? `${gate.questionCount} questions · ${gate.passMarkPercent}% to pass`
                          : `Finish all ${gate.lessonsTotal} lessons first (${gate.lessonsCompleted} done)`}
                    </p>
                  </div>
                  <Link href="/checkpoints">
                    <Button size="sm" variant={gate.passed ? 'outline' : 'default'}
                      disabled={!gate.unlocked && !gate.passed}>
                      {gate.passed ? 'Review' : 'Take checkpoint'}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
