'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { BookOpen, Zap, Target, BarChart3 } from 'lucide-react';

export default function DashboardPage() {
  const [overview, setOverview] = useState(null);
  const [courses, setCourses] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      const token = sessionStorage.getItem('tekrovia_access_token');

      if (!token) {
        window.location.href = '/login';
        return;
      }

      const base = process.env.NEXT_PUBLIC_API_URL;
      const headers = { Authorization: `Bearer ${token}` };

      try {
        const [overviewRes, coursesRes, statsRes] = await Promise.all([
          fetch(`${base}/api/v1/dashboard/overview`, { headers }),
          fetch(`${base}/api/v1/dashboard/courses`, { headers }),
          fetch(`${base}/api/v1/dashboard/stats`, { headers }),
        ]);

        if (overviewRes.status === 401) {
          sessionStorage.removeItem('tekrovia_access_token');
          window.location.href = '/login';
          return;
        }

        setOverview(await overviewRes.json());
        setCourses(await coursesRes.json());
        setStats(await statsRes.json());
      } catch (error) {
        console.error('Failed to fetch dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="space-y-8 p-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Welcome back, {overview?.user?.name}!</h1>
        <p className="text-gray-500">Track your learning progress and prepare for placement</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500">Courses Enrolled</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold flex items-center gap-2">
              <BookOpen className="w-8 h-8 text-blue-500" />
              {overview?.stats?.coursesEnrolled || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500">Assessments Taken</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold flex items-center gap-2">
              <Zap className="w-8 h-8 text-yellow-500" />
              {overview?.stats?.assessmentsTaken || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500">Lessons Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold flex items-center gap-2">
              <Target className="w-8 h-8 text-green-500" />
              {stats?.lessonsCompleted ?? 0}
              {stats?.lessonsTotal ? (
                <span className="text-base font-normal text-gray-400">/ {stats.lessonsTotal}</span>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500">Avg Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold flex items-center gap-2">
              <BarChart3 className="w-8 h-8 text-purple-500" />
              {stats?.averageScore === null || stats?.averageScore === undefined ? (
                <span className="text-base font-normal text-gray-400">No assessments yet</span>
              ) : (
                `${stats.averageScore}%`
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Courses</CardTitle>
          <CardDescription>Continue where you left off</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {courses.length === 0 ? (
            <p className="text-gray-500">No courses enrolled yet</p>
          ) : (
            courses.map(enrollment => (
              <div key={enrollment.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <h3 className="font-semibold">{enrollment.course.title}</h3>
                  <p className="text-sm text-gray-500">{enrollment.course.description}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${enrollment.progress ?? 0}%` }}
                    ></div>
                  </div>
                  <Badge variant="secondary">{enrollment.progress ?? 0}%</Badge>
                  <Link href={`/courses/${enrollment.courseId}`}>
                    <Button size="sm">Continue</Button>
                  </Link>
                </div>
              </div>
            ))
          )}
          <Button className="w-full" variant="outline">Browse All Courses</Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardContent className="pt-6 text-center">
            <BookOpen className="w-12 h-12 mx-auto mb-4 text-blue-500" />
            <h3 className="font-semibold">My Learning</h3>
            <p className="text-sm text-gray-500 mt-2">View lessons and labs</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardContent className="pt-6 text-center">
            <Zap className="w-12 h-12 mx-auto mb-4 text-yellow-500" />
            <h3 className="font-semibold">AI Mock</h3>
            <p className="text-sm text-gray-500 mt-2">Practice interviews</p>
          </CardContent>
        </Card>

        <Link href="/placement">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardContent className="pt-6 text-center">
              <Target className="w-12 h-12 mx-auto mb-4 text-green-500" />
              <h3 className="font-semibold">Placement</h3>
              <p className="text-sm text-gray-500 mt-2">Check your readiness</p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
