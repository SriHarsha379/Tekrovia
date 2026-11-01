"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../../../src/lib/api";
import { toast } from "sonner";
import {
  CheckCircle2, Circle, ChevronDown, ChevronRight,
  Loader2, BookOpen, Play,
} from "lucide-react";
import LessonView from "../../../../src/components/LessonView";

const fetchProgress = () => api.get("/courses/my/progress").then((r) => r.data);
const fetchCourse   = (id: string) => api.get(`/courses/${id}`).then((r) => r.data);

export default function CoursePlayerPage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const [activeLesson, setActiveLesson] = useState<string | null>(null);
  const [openModules, setOpenModules] = useState<Set<string>>(new Set());

  const { data: course, isLoading } = useQuery({
    queryKey: ["course", id],
    queryFn: () => fetchCourse(id),
    enabled: !!id,
  });

  const { data: progressList = [] } = useQuery({
    queryKey: ["my-progress"],
    queryFn: fetchProgress,
  });

  const courseProgress = progressList.find((p: any) => p.courseId === id);

  // Flatten completed lesson ids
  const completedIds = new Set<string>(
    courseProgress?.modules?.flatMap((m: any) =>
      m.lessons.filter((l: any) => l.completed).map((l: any) => l.id)
    ) ?? []
  );

  const completeLesson = useMutation({
    mutationFn: (lessonId: string) =>
      api.post(`/courses/lessons/${lessonId}/complete`).then((r) => r.data),
    onSuccess: () => {
      toast.success("Lesson marked complete!");
      qc.invalidateQueries({ queryKey: ["my-progress"] });
      qc.invalidateQueries({ queryKey: ["dash-courses"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? "Could not mark complete");
    },
  });

  const toggleModule = (moduleId: string) => {
    setOpenModules((prev) => {
      const next = new Set(prev);
      next.has(moduleId) ? next.delete(moduleId) : next.add(moduleId);
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-slate-400 p-8">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading course…
      </div>
    );
  }

  if (!course) {
    return <p className="p-8 text-slate-400">Course not found.</p>;
  }

  const allLessons = course.modules?.flatMap((m: any) => m.lessons) ?? [];
  const total = allLessons.length;
  const completed = allLessons.filter((l: any) => completedIds.has(l.id)).length;
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="flex gap-6 min-h-[calc(100vh-8rem)]">
      {/* Sidebar — curriculum */}
      <aside className="hidden w-72 shrink-0 lg:block">
        <div className="sticky top-6 rounded-2xl border border-white/10 bg-slate-900/50 overflow-hidden">
          {/* Course header */}
          <div className="p-4 border-b border-white/10">
            <h2 className="font-semibold text-white text-sm leading-snug line-clamp-2">
              {course.title}
            </h2>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-indigo-500 transition-all"
                style={{ width: `${percent}%` }}
              />
            </div>
            <p className="mt-1.5 text-xs text-slate-500">
              {completed}/{total} lessons · {percent}%
            </p>
          </div>

          {/* Modules */}
          <nav className="max-h-[70vh] overflow-y-auto py-2">
            {(course.modules ?? []).map((module: any, mi: number) => {
              const isOpen = openModules.has(module.id);
              return (
                <div key={module.id}>
                  <button
                    onClick={() => toggleModule(module.id)}
                    className="flex w-full items-center justify-between gap-2 px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-400 hover:text-white transition"
                  >
                    <span>
                      {mi + 1}. {module.title}
                    </span>
                    {isOpen ? (
                      <ChevronDown className="h-3 w-3 shrink-0" />
                    ) : (
                      <ChevronRight className="h-3 w-3 shrink-0" />
                    )}
                  </button>

                  {isOpen && (
                    <ul className="pb-1">
                      {(module.lessons ?? []).map((lesson: any, li: number) => {
                        const done = completedIds.has(lesson.id);
                        const active = activeLesson === lesson.id;
                        return (
                          <li key={lesson.id}>
                            <button
                              onClick={() => setActiveLesson(lesson.id)}
                              className={`flex w-full items-center gap-2.5 px-5 py-2 text-left text-sm transition ${
                                active
                                  ? "bg-indigo-500/20 text-indigo-300"
                                  : "text-slate-400 hover:text-white hover:bg-white/5"
                              }`}
                            >
                              {done ? (
                                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                              ) : (
                                <Circle className="h-3.5 w-3.5 shrink-0 text-slate-600" />
                              )}
                              <span className="line-clamp-1">
                                {mi + 1}.{li + 1} {lesson.title}
                              </span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Main — lesson view */}
      <div className="flex-1 min-w-0">
        {activeLesson ? (
          <LessonView
            lessonId={activeLesson}
            isCompleted={completedIds.has(activeLesson)}
            onComplete={() => completeLesson.mutate(activeLesson)}
            completing={completeLesson.isPending}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full rounded-2xl border border-dashed border-white/10 p-16 text-center">
            <BookOpen className="h-10 w-10 text-slate-600" />
            <h3 className="mt-4 text-lg font-semibold text-white">
              Pick a lesson to start
            </h3>
            <p className="mt-2 text-sm text-slate-400">
              Select any lesson from the curriculum on the left.
            </p>
            {allLessons[0] && (
              <button
                onClick={() => {
                  setActiveLesson(allLessons[0].id);
                  setOpenModules(new Set([course.modules[0].id]));
                }}
                className="mt-6 flex items-center gap-2 rounded-xl bg-indigo-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-400"
              >
                <Play className="h-4 w-4" /> Start from beginning
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
