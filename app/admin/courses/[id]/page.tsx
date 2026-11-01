"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { api } from "../../../../src/lib/api";
import { toast } from "sonner";
import {
  ChevronDown, ChevronUp, Loader2, Save,
  Video, FileText, Plus, X,
} from "lucide-react";
import Link from "next/link";

const fetchAdminCourses = () => api.get("/courses/admin").then((r) => r.data);

export default function CourseEditorPage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const [expandedModule, setExpandedModule] = useState<string | null>(null);
  const [expandedLesson, setExpandedLesson] = useState<string | null>(null);
  const [savingLesson, setSavingLesson]     = useState<string | null>(null);
  const [showAddModule, setShowAddModule]   = useState(false);
  const [addingModule, setAddingModule]     = useState(false);
  const [newModuleName, setNewModuleName]   = useState("");
  const [addingLessonFor, setAddingLessonFor] = useState<string | null>(null);
  const [newLessonName, setNewLessonName]   = useState("");

  const { data: courses = [], isLoading } = useQuery({
    queryKey: ["admin-courses"],
    queryFn: fetchAdminCourses,
  });

  const course = courses.find((c: any) => c.id === id);

  const { register: regCourse, handleSubmit: handleCourse } = useForm<any>({
    values: course ? {
      title: course.title, description: course.description,
      category: course.category, duration: course.duration,
      price: course.price, level: course.level,
    } : undefined,
  });

  const updateCourse = useMutation({
    mutationFn: (d: any) => api.patch(`/courses/admin/${id}`, d).then((r) => r.data),
    onSuccess: () => { toast.success("Course updated!"); qc.invalidateQueries({ queryKey: ["admin-courses"] }); },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? "Failed"),
  });

  const updateLesson = async (lessonId: string, data: any) => {
    setSavingLesson(lessonId);
    try {
      await api.patch(`/courses/admin/lessons/${lessonId}`, data);
      toast.success("Lesson saved!");
      qc.invalidateQueries({ queryKey: ["admin-courses"] });
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Save failed");
    } finally {
      setSavingLesson(null);
    }
  };

  const addModule = async () => {
    if (!newModuleName.trim()) return toast.error("Enter a module name");
    setAddingModule(true);
    try {
      const existing = course?.modules ?? [];
      const curriculum = [
        ...existing.map((m: any) => ({
          module: m.title,
          topics: m.lessons?.map((l: any) => l.title) ?? [],
        })),
        { module: newModuleName.trim(), topics: ["New lesson"] },
      ];
      await api.patch(`/courses/admin/${id}`, { curriculum });
      toast.success("Module added!");
      setNewModuleName("");
      setShowAddModule(false);
      qc.invalidateQueries({ queryKey: ["admin-courses"] });
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Cannot add module — remove assignments/projects first if course has submissions");
    } finally {
      setAddingModule(false);
    }
  };

  const addLesson = async (moduleId: string) => {
    if (!newLessonName.trim()) return toast.error("Enter a lesson title");
    try {
      const mod = course?.modules?.find((m: any) => m.id === moduleId);
      if (!mod) return;
      const existingTopics = mod.lessons?.map((l: any) => l.title) ?? [];
      const curriculum = (course?.modules ?? []).map((m: any) => ({
        module: m.title,
        topics: m.id === moduleId
          ? [...existingTopics, newLessonName.trim()]
          : m.lessons?.map((l: any) => l.title) ?? [],
      }));
      await api.patch(`/courses/admin/${id}`, { curriculum });
      toast.success("Lesson added!");
      setNewLessonName("");
      setAddingLessonFor(null);
      qc.invalidateQueries({ queryKey: ["admin-courses"] });
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Cannot add lesson");
    }
  };

  if (isLoading) return <div className="flex items-center gap-2 text-slate-400 p-8"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>;
  if (!course) return <p className="p-8 text-slate-400">Course not found.</p>;

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/courses" className="text-sm text-slate-400 hover:text-white">← Courses</Link>
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
          course.status === "PUBLISHED" ? "bg-emerald-500/20 text-emerald-300"
          : course.status === "DRAFT" ? "bg-amber-500/20 text-amber-300"
          : "bg-slate-700 text-slate-400"
        }`}>{course.status}</span>
      </div>

      {/* Course details form */}
      <form onSubmit={handleCourse((d) => updateCourse.mutate(d))} className="rounded-2xl border border-white/10 bg-slate-900/50 p-6 space-y-4">
        <h2 className="font-semibold text-white">Course Details</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-slate-300">Title</label>
            <input {...regCourse("title")} className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none focus:border-indigo-500" />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-slate-300">Description</label>
            <textarea {...regCourse("description")} rows={3} className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none focus:border-indigo-500 resize-none" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-300">Category</label>
            <input {...regCourse("category")} className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none focus:border-indigo-500" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-300">Duration</label>
            <input {...regCourse("duration")} placeholder="e.g. 12 weeks" className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none focus:border-indigo-500" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-300">Level</label>
            <select {...regCourse("level")} className="w-full rounded-lg border border-white/10 bg-slate-800 px-4 py-2.5 text-sm text-white outline-none focus:border-indigo-500">
              {["beginner","intermediate","advanced"].map((l) => <option key={l} value={l}>{l.charAt(0).toUpperCase()+l.slice(1)}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-300">Price (₹)</label>
            <input {...regCourse("price")} type="number" className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none focus:border-indigo-500" />
          </div>
        </div>
        <button type="submit" disabled={updateCourse.isPending} className="flex items-center gap-2 rounded-xl bg-indigo-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-400 disabled:opacity-60">
          {updateCourse.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save details
        </button>
      </form>

      {/* Curriculum */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Curriculum</h2>
          <button
            onClick={() => setShowAddModule((s) => !s)}
            className="flex items-center gap-1.5 rounded-xl bg-indigo-500/20 px-3 py-1.5 text-sm font-medium text-indigo-300 hover:bg-indigo-500/30 transition"
          >
            {showAddModule ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
            {showAddModule ? "Cancel" : "Add module"}
          </button>
        </div>

        {/* Add module form */}
        {showAddModule && (
          <div className="flex gap-2 rounded-xl border border-indigo-400/20 bg-indigo-500/5 p-3">
            <input
              value={newModuleName}
              onChange={(e) => setNewModuleName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addModule()}
              placeholder="Module name e.g. JavaScript Foundations"
              className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500"
            />
            <button
              onClick={addModule}
              disabled={addingModule}
              className="flex items-center gap-1.5 rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-400 disabled:opacity-60"
            >
              {addingModule ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
              Add
            </button>
          </div>
        )}

        {(course.modules ?? []).length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center">
            <p className="text-sm text-slate-500">No modules yet — click "Add module" above.</p>
          </div>
        ) : (
          (course.modules ?? []).map((module: any, mi: number) => {
            const isOpen = expandedModule === module.id;
            const lessonCount = module.lessons?.length ?? 0;
            const videoCount  = module.lessons?.filter((l: any) => l.videoUrl).length ?? 0;

            return (
              <div key={module.id} className="rounded-2xl border border-white/10 bg-slate-900/50 overflow-hidden">
                <button
                  onClick={() => setExpandedModule(isOpen ? null : module.id)}
                  className="flex w-full items-center gap-3 px-5 py-4 text-left hover:bg-white/5 transition"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-xs font-bold text-indigo-300">{mi + 1}</span>
                  <div className="flex-1">
                    <p className="font-semibold text-white">{module.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {lessonCount} lesson{lessonCount !== 1 ? "s" : ""} ·{" "}
                      <span className={videoCount === lessonCount && lessonCount > 0 ? "text-emerald-400" : "text-amber-400"}>
                        {videoCount}/{lessonCount} videos
                      </span>
                    </p>
                  </div>
                  {isOpen ? <ChevronUp className="h-4 w-4 text-slate-500" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}
                </button>

                {isOpen && (
                  <div className="border-t border-white/10 divide-y divide-white/5">
                    {(module.lessons ?? []).map((lesson: any, li: number) => {
                      const isLessonOpen = expandedLesson === lesson.id;
                      const isSaving     = savingLesson === lesson.id;

                      return (
                        <div key={lesson.id}>
                          <button
                            onClick={() => setExpandedLesson(isLessonOpen ? null : lesson.id)}
                            className="flex w-full items-center gap-3 px-6 py-3 text-left hover:bg-white/5 transition"
                          >
                            <span className="text-xs text-slate-500 w-6 shrink-0">{mi+1}.{li+1}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-white truncate">{lesson.title}</p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              {lesson.videoUrl
                                ? <span className="flex items-center gap-1 text-xs text-emerald-400"><Video className="h-3 w-3" /> Video</span>
                                : <span className="flex items-center gap-1 text-xs text-amber-400"><Video className="h-3 w-3" /> No video</span>}
                              {lesson.content
                                ? <span className="flex items-center gap-1 text-xs text-emerald-400"><FileText className="h-3 w-3" /> Notes</span>
                                : <span className="flex items-center gap-1 text-xs text-slate-600"><FileText className="h-3 w-3" /> No notes</span>}
                              {isLessonOpen ? <ChevronUp className="h-3.5 w-3.5 text-slate-500" /> : <ChevronDown className="h-3.5 w-3.5 text-slate-500" />}
                            </div>
                          </button>

                          {isLessonOpen && (
                            <LessonEditor lesson={lesson} isSaving={isSaving} onSave={(d) => updateLesson(lesson.id, d)} />
                          )}
                        </div>
                      );
                    })}

                    {/* Add lesson */}
                    <div className="px-5 py-3">
                      {addingLessonFor === module.id ? (
                        <div className="flex gap-2">
                          <input
                            value={newLessonName}
                            onChange={(e) => setNewLessonName(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && addLesson(module.id)}
                            placeholder="Lesson title e.g. Variables and Types"
                            className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500"
                            autoFocus
                          />
                          <button onClick={() => addLesson(module.id)} className="flex items-center gap-1 rounded-xl bg-indigo-500 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-400">
                            <Plus className="h-3.5 w-3.5" /> Add
                          </button>
                          <button onClick={() => { setAddingLessonFor(null); setNewLessonName(""); }} className="rounded-xl border border-white/10 px-3 py-2 text-sm text-slate-400 hover:text-white">
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setAddingLessonFor(module.id); setNewLessonName(""); }}
                          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-indigo-400 transition"
                        >
                          <Plus className="h-3.5 w-3.5" /> Add lesson
                        </button>
                      )}
                    </div>
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

function LessonEditor({ lesson, isSaving, onSave }: { lesson: any; isSaving: boolean; onSave: (d: any) => void }) {
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
    <form onSubmit={handleSubmit(onSave)} className="border-t border-white/5 bg-slate-950/40 px-6 py-5 space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-400">Lesson title</label>
          <input {...register("title")} className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500" />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-400">Duration</label>
          <input {...register("duration")} placeholder="e.g. 45 min" className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500" />
        </div>
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-medium text-slate-400">
          Video URL <span className="text-slate-500 font-normal">— YouTube, Vimeo, Loom, Google Drive, or MP4</span>
        </label>
        <input {...register("videoUrl")} type="url" placeholder="https://www.youtube.com/watch?v=..." className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500" />
        <p className="mt-1 text-xs text-slate-600">Tip: For YouTube use https://www.youtube.com/embed/VIDEO_ID</p>
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-medium text-slate-400">Short description</label>
        <input {...register("description")} placeholder="One line about this lesson" className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500" />
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-medium text-slate-400">
          Notes / content <span className="text-slate-500 font-normal">— shown below the video</span>
        </label>
        <textarea {...register("content")} rows={5} placeholder="Key concepts, code snippets, links…" className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500 resize-none font-mono" />
      </div>
      <button type="submit" disabled={isSaving} className="flex items-center gap-2 rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-400 disabled:opacity-60">
        {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
        Save lesson
      </button>
    </form>
  );
}
