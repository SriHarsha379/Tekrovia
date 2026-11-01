"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { api } from "../../../../src/lib/api";
import { toast } from "sonner";
import {
  ChevronDown, ChevronUp, Loader2,
  Save, Video, FileText, Plus, CheckCircle2,
} from "lucide-react";
import Link from "next/link";

const fetchCourse = (id: string) =>
  api.get(`/courses/admin`).then((r) =>
    (r.data as any[]).find((c: any) => c.id === id)
  );

export default function CourseEditorPage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const [expandedModule, setExpandedModule] = useState<string | null>(null);
  const [expandedLesson, setExpandedLesson] = useState<string | null>(null);
  const [savingLesson, setSavingLesson] = useState<string | null>(null);

  const { data: course, isLoading } = useQuery({
    queryKey: ["admin-course", id],
    queryFn: () => fetchCourse(id),
    enabled: !!id,
  });

  // Update course metadata
  const { register: regCourse, handleSubmit: handleCourse } = useForm<any>({
    values: course
      ? {
          title: course.title,
          description: course.description,
          category: course.category,
          duration: course.duration,
          price: course.price,
          level: course.level,
        }
      : undefined,
  });

  const updateCourse = useMutation({
    mutationFn: (d: any) =>
      api.patch(`/courses/admin/${id}`, d).then((r) => r.data),
    onSuccess: () => {
      toast.success("Course updated!");
      qc.invalidateQueries({ queryKey: ["admin-course", id] });
      qc.invalidateQueries({ queryKey: ["admin-courses"] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? "Update failed"),
  });

  // Update individual lesson
  const updateLesson = async (lessonId: string, data: {
    title?: string;
    description?: string;
    content?: string;
    videoUrl?: string;
    duration?: string;
  }) => {
    setSavingLesson(lessonId);
    try {
      await api.patch(`/courses/admin/lessons/${lessonId}`, data);
      toast.success("Lesson saved!");
      qc.invalidateQueries({ queryKey: ["admin-course", id] });
      qc.invalidateQueries({ queryKey: ["admin-courses"] });
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Save failed");
    } finally {
      setSavingLesson(null);
    }
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

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/courses" className="text-sm text-slate-400 hover:text-white">
          ← Courses
        </Link>
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
          course.status === "PUBLISHED" ? "bg-emerald-500/20 text-emerald-300"
          : course.status === "DRAFT" ? "bg-amber-500/20 text-amber-300"
          : "bg-slate-700 text-slate-400"
        }`}>
          {course.status}
        </span>
      </div>

      {/* Course metadata */}
      <form
        onSubmit={handleCourse((d) => updateCourse.mutate(d))}
        className="rounded-2xl border border-white/10 bg-slate-900/50 p-6 space-y-4"
      >
        <h2 className="font-semibold text-white">Course Details</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-slate-300">Title</label>
            <input
              {...regCourse("title")}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none focus:border-indigo-500"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-slate-300">Description</label>
            <textarea
              {...regCourse("description")}
              rows={3}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none focus:border-indigo-500 resize-none"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-300">Category</label>
            <input
              {...regCourse("category")}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-300">Duration</label>
            <input
              {...regCourse("duration")}
              placeholder="e.g. 12 weeks"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-300">Level</label>
            <select
              {...regCourse("level")}
              className="w-full rounded-lg border border-white/10 bg-slate-800 px-4 py-2.5 text-sm text-white outline-none focus:border-indigo-500"
            >
              {["beginner", "intermediate", "advanced"].map((l) => (
                <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-300">Price (₹)</label>
            <input
              {...regCourse("price")}
              type="number"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none focus:border-indigo-500"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={updateCourse.isPending}
          className="flex items-center gap-2 rounded-xl bg-indigo-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-400 disabled:opacity-60"
        >
          {updateCourse.isPending
            ? <Loader2 className="h-4 w-4 animate-spin" />
            : <Save className="h-4 w-4" />}
          Save course details
        </button>
      </form>

      {/* Modules & Lessons */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Curriculum</h2>
          <p className="text-xs text-slate-500">
            Click a lesson to edit its content and video URL
          </p>
        </div>

        {(course.modules ?? []).length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center">
            <p className="text-sm text-slate-500">
              No modules yet. Add curriculum when creating the course, or use the API.
            </p>
          </div>
        ) : (
          (course.modules ?? []).map((module: any, mi: number) => {
            const isModuleOpen = expandedModule === module.id;
            const lessonCount  = module.lessons?.length ?? 0;
            const videoCount   = module.lessons?.filter((l: any) => l.videoUrl).length ?? 0;

            return (
              <div key={module.id} className="rounded-2xl border border-white/10 bg-slate-900/50 overflow-hidden">
                {/* Module header */}
                <button
                  onClick={() => setExpandedModule(isModuleOpen ? null : module.id)}
                  className="flex w-full items-center gap-3 px-5 py-4 text-left hover:bg-white/5 transition"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-xs font-bold text-indigo-300">
                    {mi + 1}
                  </span>
                  <div className="flex-1">
                    <p className="font-semibold text-white">{module.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {lessonCount} lesson{lessonCount !== 1 ? "s" : ""} ·{" "}
                      <span className={videoCount === lessonCount && lessonCount > 0 ? "text-emerald-400" : "text-amber-400"}>
                        {videoCount}/{lessonCount} videos added
                      </span>
                    </p>
                  </div>
                  {isModuleOpen
                    ? <ChevronUp className="h-4 w-4 text-slate-500" />
                    : <ChevronDown className="h-4 w-4 text-slate-500" />}
                </button>

                {/* Lessons */}
                {isModuleOpen && (
                  <div className="border-t border-white/10 divide-y divide-white/5">
                    {(module.lessons ?? []).map((lesson: any, li: number) => {
                      const isLessonOpen = expandedLesson === lesson.id;
                      const isSaving     = savingLesson === lesson.id;

                      return (
                        <div key={lesson.id}>
                          {/* Lesson row */}
                          <button
                            onClick={() => setExpandedLesson(isLessonOpen ? null : lesson.id)}
                            className="flex w-full items-center gap-3 px-6 py-3 text-left hover:bg-white/5 transition"
                          >
                            <span className="text-xs text-slate-500 w-6 shrink-0">
                              {mi + 1}.{li + 1}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-white truncate">{lesson.title}</p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              {lesson.videoUrl ? (
                                <span className="flex items-center gap-1 text-xs text-emerald-400">
                                  <Video className="h-3 w-3" /> Video added
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 text-xs text-amber-400">
                                  <Video className="h-3 w-3" /> No video
                                </span>
                              )}
                              {lesson.content ? (
                                <span className="flex items-center gap-1 text-xs text-emerald-400">
                                  <FileText className="h-3 w-3" /> Notes
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 text-xs text-slate-600">
                                  <FileText className="h-3 w-3" /> No notes
                                </span>
                              )}
                              {isLessonOpen
                                ? <ChevronUp className="h-3.5 w-3.5 text-slate-500" />
                                : <ChevronDown className="h-3.5 w-3.5 text-slate-500" />}
                            </div>
                          </button>

                          {/* Lesson editor */}
                          {isLessonOpen && (
                            <LessonEditor
                              lesson={lesson}
                              isSaving={isSaving}
                              onSave={(data) => updateLesson(lesson.id, data)}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function LessonEditor({
  lesson,
  isSaving,
  onSave,
}: {
  lesson: any;
  isSaving: boolean;
  onSave: (data: any) => void;
}) {
  const { register, handleSubmit } = useForm<any>({
    defaultValues: {
      title:       lesson.title       ?? "",
      description: lesson.description ?? "",
      content:     lesson.content     ?? "",
      videoUrl:    lesson.videoUrl    ?? "",
      duration:    lesson.duration    ?? "",
    },
  });

  return (
    <form
      onSubmit={handleSubmit(onSave)}
      className="border-t border-white/5 bg-slate-950/40 px-6 py-5 space-y-4"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-400">Lesson title</label>
          <input
            {...register("title")}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-400">Duration</label>
          <input
            {...register("duration")}
            placeholder="e.g. 45 min"
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Video URL — main feature */}
      <div>
        <label className="mb-1.5 block text-xs font-medium text-slate-400">
          Video URL
          <span className="ml-2 text-slate-500 font-normal">
            — YouTube, Vimeo, Loom, Google Drive, or direct MP4 link
          </span>
        </label>
        <input
          {...register("videoUrl")}
          type="url"
          placeholder="https://www.youtube.com/watch?v=... or https://vimeo.com/..."
          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500"
        />
        <p className="mt-1 text-xs text-slate-600">
          Tip: For YouTube, use the embed URL: https://www.youtube.com/embed/VIDEO_ID
        </p>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-slate-400">Short description</label>
        <input
          {...register("description")}
          placeholder="One line about what this lesson covers"
          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-slate-400">
          Lesson notes / content
          <span className="ml-2 text-slate-500 font-normal">— shown below the video</span>
        </label>
        <textarea
          {...register("content")}
          rows={6}
          placeholder="Key concepts, code snippets, links, references…"
          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500 resize-none font-mono"
        />
      </div>

      <button
        type="submit"
        disabled={isSaving}
        className="flex items-center gap-2 rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-400 disabled:opacity-60"
      >
        {isSaving
          ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
          : <Save className="h-3.5 w-3.5" />}
        Save lesson
      </button>
    </form>
  );
}
