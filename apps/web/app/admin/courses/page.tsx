"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { api } from "../../../src/lib/api";
import { toast } from "sonner";
import {
  BookOpen, Plus, X, Loader2, Eye, CheckCircle2, Archive,
} from "lucide-react";
import Link from "next/link";

const fetchAdminCourses = () => api.get("/courses/admin").then((r) => r.data);

const statusColor: Record<string, string> = {
  PUBLISHED: "bg-emerald-500/20 text-emerald-300",
  DRAFT:     "bg-amber-500/20 text-amber-300",
  ARCHIVED:  "bg-slate-700 text-slate-400",
};

export default function AdminCoursesPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);

  const { data: courses = [], isLoading } = useQuery({
    queryKey: ["admin-courses"],
    queryFn: fetchAdminCourses,
  });

  const { register, handleSubmit, reset } = useForm<any>();

  const createCourse = useMutation({
    mutationFn: (d: any) => api.post("/courses/admin", d).then((r) => r.data),
    onSuccess: () => {
      toast.success("Course created as draft!");
      reset();
      setShowForm(false);
      qc.invalidateQueries({ queryKey: ["admin-courses"] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? "Failed"),
  });

  const publishCourse = useMutation({
    mutationFn: (id: string) => api.patch(`/courses/admin/${id}/publish`).then((r) => r.data),
    onSuccess: () => { toast.success("Course published!"); qc.invalidateQueries({ queryKey: ["admin-courses"] }); },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? "Cannot publish — add at least one lesson per module first"),
  });

  const archiveCourse = useMutation({
    mutationFn: (id: string) => api.patch(`/courses/admin/${id}/archive`).then((r) => r.data),
    onSuccess: () => { toast.success("Course archived."); qc.invalidateQueries({ queryKey: ["admin-courses"] }); },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? "Failed"),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Courses</h1>
          <p className="mt-1 text-sm text-slate-400">Create and manage course content, lessons and videos.</p>
        </div>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="flex items-center gap-2 rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-400"
        >
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showForm ? "Cancel" : "New course"}
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <form
          onSubmit={handleSubmit((d) => createCourse.mutate(d))}
          className="rounded-2xl border border-white/10 bg-slate-900/50 p-6 space-y-4"
        >
          <h2 className="font-semibold text-white">Create new course</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-slate-300">Title *</label>
              <input
                {...register("title", { required: true })}
                placeholder="e.g. Full Stack Web Development"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-slate-300">Description *</label>
              <textarea
                {...register("description", { required: true })}
                rows={3}
                placeholder="What will students learn and build?"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500 resize-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">Category</label>
              <input {...register("category")} placeholder="e.g. Technology Training" className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">Level *</label>
              <select {...register("level")} className="w-full rounded-lg border border-white/10 bg-slate-800 px-4 py-2.5 text-sm text-white outline-none focus:border-indigo-500">
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">Duration</label>
              <input {...register("duration")} placeholder="e.g. 12 weeks" className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">Price (₹)</label>
              <input {...register("price")} type="number" defaultValue={9999} className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none focus:border-indigo-500" />
            </div>
          </div>
          <button
            type="submit"
            disabled={createCourse.isPending}
            className="flex items-center gap-2 rounded-xl bg-indigo-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-400 disabled:opacity-60"
          >
            {createCourse.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Create draft
          </button>
        </form>
      )}

      {/* Course list */}
      {isLoading ? (
        <div className="flex items-center gap-2 text-slate-400"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>
      ) : courses.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 p-12 text-center">
          <BookOpen className="mx-auto h-8 w-8 text-slate-600" />
          <p className="mt-3 text-sm text-slate-500">No courses yet — create your first one.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {courses.map((course: any) => {
            const lessonCount = course.modules?.reduce((sum: number, m: any) => sum + (m.lessons?.length ?? 0), 0) ?? 0;
            const videoCount  = course.modules?.reduce((sum: number, m: any) => sum + (m.lessons?.filter((l: any) => l.videoUrl).length ?? 0), 0) ?? 0;

            return (
              <div key={course.id} className="flex items-center gap-4 rounded-2xl border border-white/10 bg-slate-900/50 p-5 transition hover:border-indigo-400/20">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10">
                  <BookOpen className="h-5 w-5 text-indigo-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white truncate">{course.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {course.modules?.length ?? 0} modules · {lessonCount} lessons ·{" "}
                    <span className={videoCount === lessonCount && lessonCount > 0 ? "text-emerald-400" : "text-amber-400"}>
                      {videoCount}/{lessonCount} videos
                    </span>
                    {" "}· {course.enrollmentCount ?? 0} enrolled
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColor[course.status] ?? "bg-slate-700 text-slate-400"}`}>
                    {course.status}
                  </span>
                  <Link
                    href={`/admin/courses/${course.id}`}
                    className="flex items-center gap-1 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-slate-300 hover:bg-white/5 hover:text-white transition"
                  >
                    <Eye className="h-3 w-3" /> Edit
                  </Link>
                  {course.status === "DRAFT" && (
                    <button
                      onClick={() => publishCourse.mutate(course.id)}
                      disabled={publishCourse.isPending}
                      className="flex items-center gap-1 rounded-lg bg-emerald-500/20 px-3 py-1.5 text-xs font-medium text-emerald-300 hover:bg-emerald-500/30 transition"
                    >
                      <CheckCircle2 className="h-3 w-3" /> Publish
                    </button>
                  )}
                  {course.status !== "ARCHIVED" && (
                    <button
                      onClick={() => { if (confirm("Archive this course?")) archiveCourse.mutate(course.id); }}
                      className="flex items-center gap-1 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-slate-500 hover:text-red-400 hover:border-red-400/30 transition"
                    >
                      <Archive className="h-3 w-3" /> Archive
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
