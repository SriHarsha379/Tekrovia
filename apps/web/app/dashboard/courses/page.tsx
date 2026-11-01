"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../../src/lib/api";
import { toast } from "sonner";
import { BookOpen, Clock, BarChart2, Loader2 } from "lucide-react";
import Link from "next/link";

const fetchAllCourses     = () => api.get("/courses").then((r) => r.data);
const fetchMyEnrollments  = () => api.get("/courses/my/enrollments").then((r) => r.data);

export default function CoursesPage() {
  const qc = useQueryClient();

  const { data: courses = [], isLoading } = useQuery({
    queryKey: ["all-courses"],
    queryFn: fetchAllCourses,
  });

  const { data: enrollments = [] } = useQuery({
    queryKey: ["my-enrollments"],
    queryFn: fetchMyEnrollments,
  });

  const enrolledIds = new Set(enrollments.map((e: any) => e.courseId));

  const enroll = useMutation({
    mutationFn: (courseId: string) =>
      api.post(`/courses/${courseId}/enroll`).then((r) => r.data),
    onSuccess: () => {
      toast.success("Enrolled successfully!");
      qc.invalidateQueries({ queryKey: ["my-enrollments"] });
      qc.invalidateQueries({ queryKey: ["dash-courses"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? "Enrollment failed");
    },
  });

  const levelColor: Record<string, string> = {
    beginner:     "bg-emerald-500/20 text-emerald-300",
    intermediate: "bg-amber-500/20 text-amber-300",
    advanced:     "bg-red-500/20 text-red-300",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Courses</h1>
        <p className="mt-1 text-sm text-slate-400">
          Browse all available courses and enroll to start learning.
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading courses…
        </div>
      ) : courses.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 p-12 text-center">
          <BookOpen className="mx-auto h-8 w-8 text-slate-600" />
          <p className="mt-3 text-sm text-slate-500">No courses published yet.</p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {courses.map((course: any) => {
            const enrolled = enrolledIds.has(course.id);
            const enrollment = enrollments.find((e: any) => e.courseId === course.id);

            return (
              <div
                key={course.id}
                className="flex flex-col rounded-2xl border border-white/10 bg-slate-900/50 p-5 transition hover:border-indigo-400/30"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <h2 className="font-semibold text-white leading-snug">{course.title}</h2>
                  {course.level && (
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium capitalize ${levelColor[course.level] ?? "bg-slate-700 text-slate-300"}`}>
                      {course.level}
                    </span>
                  )}
                </div>

                <p className="mt-2 text-sm leading-6 text-slate-400 line-clamp-2">
                  {course.description}
                </p>

                {/* Meta */}
                <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-500">
                  {course.duration && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {course.duration}
                    </span>
                  )}
                  {course.modules?.length > 0 && (
                    <span className="flex items-center gap-1">
                      <BookOpen className="h-3 w-3" />
                      {course.modules.length} module{course.modules.length !== 1 ? "s" : ""}
                    </span>
                  )}
                  {course.price != null && (
                    <span className="flex items-center gap-1">
                      <BarChart2 className="h-3 w-3" />
                      {course.price === 0 ? "Free" : `₹${course.price.toLocaleString("en-IN")}`}
                    </span>
                  )}
                </div>

                {/* Progress bar if enrolled */}
                {enrolled && enrollment && (
                  <div className="mt-4">
                    <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-indigo-500"
                        style={{ width: `${enrollment.progressPercent ?? 0}%` }}
                      />
                    </div>
                    <p className="mt-1 text-right text-xs text-slate-500">
                      {enrollment.progressPercent ?? 0}% complete
                    </p>
                  </div>
                )}

                {/* CTA */}
                <div className="mt-5 pt-4 border-t border-white/10">
                  {enrolled ? (
                    <Link
                      href={`/dashboard/courses/${course.id}`}
                      className="flex w-full items-center justify-center rounded-xl bg-indigo-500/20 py-2.5 text-sm font-semibold text-indigo-300 transition hover:bg-indigo-500/30"
                    >
                      Continue learning →
                    </Link>
                  ) : (
                    <button
                      onClick={() => enroll.mutate(course.id)}
                      disabled={enroll.isPending}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-500 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-400 disabled:opacity-60"
                    >
                      {enroll.isPending && <Loader2 className="h-3 w-3 animate-spin" />}
                      Enroll now
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
