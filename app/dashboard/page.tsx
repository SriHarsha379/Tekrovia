"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "../../src/store/auth";
import { api } from "../../src/lib/api";
import { BookOpen, ClipboardCheck, CheckCircle, TrendingUp, ArrowRight } from "lucide-react";
import Link from "next/link";

async function fetchOverview() {
  const res = await api.get("/dashboard/overview");
  return res.data;
}

async function fetchStats() {
  const res = await api.get("/dashboard/stats");
  return res.data;
}

async function fetchCourses() {
  const res = await api.get("/dashboard/courses");
  return res.data;
}

export default function DashboardPage() {
  const { user } = useAuthStore();

  const { data: overview } = useQuery({ queryKey: ["dashboard-overview"], queryFn: fetchOverview });
  const { data: stats } = useQuery({ queryKey: ["dashboard-stats"], queryFn: fetchStats });
  const { data: courses } = useQuery({ queryKey: ["dashboard-courses"], queryFn: fetchCourses });

  const statCards = [
    { label: "Courses Enrolled", value: overview?.stats?.coursesEnrolled ?? 0, icon: BookOpen, color: "text-indigo-400" },
    { label: "Assessments Taken", value: overview?.stats?.assessmentsTaken ?? 0, icon: ClipboardCheck, color: "text-violet-400" },
    { label: "Lessons Completed", value: overview?.stats?.lessonsCompleted ?? 0, icon: CheckCircle, color: "text-emerald-400" },
    { label: "Avg Score", value: stats?.averageScore != null ? `${stats.averageScore}%` : "—", icon: TrendingUp, color: "text-amber-400" },
  ];

  return (
    <div className="space-y-8">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-white">
          Welcome back, {user?.name?.split(" ")[0] ?? "there"} 👋
        </h1>
        <p className="mt-1 text-sm text-slate-400">Here's where you left off.</p>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-2xl border border-white/10 bg-slate-900/50 p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-400">{label}</p>
              <Icon className={`h-5 w-5 ${color}`} />
            </div>
            <p className="mt-3 text-3xl font-bold text-white">{value}</p>
          </div>
        ))}
      </div>

      {/* My Courses */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">My Courses</h2>
          <Link href="/dashboard/courses" className="flex items-center gap-1 text-sm text-indigo-400 hover:text-indigo-300">
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {courses?.length === 0 || !courses ? (
          <div className="rounded-2xl border border-dashed border-white/10 p-10 text-center">
            <BookOpen className="mx-auto h-8 w-8 text-slate-600" />
            <p className="mt-3 text-sm text-slate-500">You haven&apos;t enrolled in any courses yet.</p>
            <Link
              href="/dashboard/courses"
              className="mt-4 inline-flex items-center gap-1 rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-400"
            >
              Browse courses
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {courses.map((enrollment: any) => (
              <Link
                key={enrollment.courseId}
                href={`/dashboard/courses/${enrollment.courseId}`}
                className="group rounded-2xl border border-white/10 bg-slate-900/50 p-5 transition hover:border-indigo-400/40"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-white group-hover:text-indigo-300">
                      {enrollment.course?.title}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {enrollment.completedLessons ?? 0} / {enrollment.totalLessons ?? 0} lessons
                    </p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                    enrollment.status === "COMPLETED"
                      ? "bg-emerald-500/20 text-emerald-300"
                      : "bg-indigo-500/20 text-indigo-300"
                  }`}>
                    {enrollment.status}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-indigo-500 transition-all"
                    style={{ width: `${enrollment.progressPercent ?? 0}%` }}
                  />
                </div>
                <p className="mt-1.5 text-right text-xs text-slate-500">
                  {enrollment.progressPercent ?? 0}%
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
