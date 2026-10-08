'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { CheckCircle2, Circle, ArrowLeft } from 'lucide-react';

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params?.courseId as string;

  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [pendingLessonId, setPendingLessonId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const loadProgress = useCallback(async () => {
    const token = sessionStorage.getItem('tekrovia_access_token');

    if (!token) {
      router.replace('/login');
      return;
    }

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/courses/my/progress`,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (res.status === 401) {
        sessionStorage.removeItem('tekrovia_access_token');
        router.replace('/login');
        return;
      }

      const data = await res.json();
      const match = Array.isArray(data)
        ? data.find((item: any) => item.courseId === courseId)
        : null;

      setCourse(match ?? null);
    } catch (err) {
      console.error('Failed to load course progress:', err);
      setError('Could not load this course. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [courseId, router]);

  useEffect(() => {
    loadProgress();
  }, [loadProgress]);

  const completeLesson = async (lessonId: string) => {
    const token = sessionStorage.getItem('tekrovia_access_token');
    if (!token) return;

    setPendingLessonId(lessonId);
    setError('');

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/courses/lessons/${lessonId}/complete`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (!res.ok) {
        setError('Could not mark that lesson complete.');
        return;
      }

      await loadProgress();
    } catch (err) {
      console.error('Failed to complete lesson:', err);
      setError('Could not mark that lesson complete.');
    } finally {
      setPendingLessonId(null);
    }
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

  return (
    <div className="max-w-3xl mx-auto p-8 space-y-6">
      <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900">
        <ArrowLeft className="w-4 h-4" />
        Back to dashboard
      </Link>

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
            ></div>
          </div>
          <p className="text-sm text-gray-500">{course.progressPercent}% complete</p>
        </CardContent>
      </Card>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
          {error}
        </div>
      ) : null}

      {course.modules.map((module: any) => (
        <Card key={module.id}>
          <CardHeader>
            <CardTitle className="text-lg">{module.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {module.lessons.map((lesson: any) => (
              <div
                key={lesson.id}
                className="flex items-center justify-between gap-4 p-4 border rounded-lg"
              >
                <div className="flex items-start gap-3">
                  {lesson.completed ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
                  ) : (
                    <Circle className="w-5 h-5 text-gray-300 mt-0.5" />
                  )}
                  <div>
                    <p className="font-medium">{lesson.title}</p>
                    {lesson.duration ? (
                      <p className="text-sm text-gray-500">{lesson.duration}</p>
                    ) : null}
                  </div>
                </div>

                {lesson.completed ? (
                  <Badge variant="secondary">Completed</Badge>
                ) : (
                  <Button
                    size="sm"
                    disabled={pendingLessonId === lesson.id}
                    onClick={() => completeLesson(lesson.id)}
                  >
                    {pendingLessonId === lesson.id ? 'Saving...' : 'Mark complete'}
                  </Button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
