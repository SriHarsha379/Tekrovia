"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { api, type Course } from "../lib/api-client";
import LessonDetails from "./LessonDetails";
import AssignmentsPanel from "./AssignmentsPanel";

type ProgressLesson = {
  id: string;
  title: string;
  duration?: string | null;
  completed: boolean;
  content?: string | null;
  videoUrl?: string | null;
};

type ProgressModule = {
  id: string;
  title: string;
  lessons: ProgressLesson[];
};

type LearningProgress = {
  enrollmentId: string;
  courseId: string;
  courseTitle: string;
  status: string;
  progressPercent: number;
  completedLessons: number;
  totalLessons: number;
  modules: ProgressModule[];
};

const levels = ["all", "beginner", "intermediate", "advanced"];

export default function LearningHub() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [progress, setProgress] = useState<LearningProgress[]>([]);
  const [category, setCategory] = useState("all");
  const [level, setLevel] = useState("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadLearning = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [courseResult, progressResult] = await Promise.all([
        api.getCourses({
          ...(category !== "all" ? { category } : {}),
          ...(level !== "all" ? { level } : {}),
        }),
        api.getMyLearningProgress() as Promise<LearningProgress[]>,
      ]);
      setCourses(courseResult);
      setProgress(progressResult);
    } catch {
      setError(
        "We couldn't load Learning right now. Check that the API is running and your session is valid."
      );
    } finally {
      setLoading(false);
    }
  }, [category, level]);

  useEffect(() => {
    void loadLearning();
  }, [loadLearning]);

  const categories = useMemo(
    () => ["all", ...Array.from(new Set(courses.map((course) => course.category).filter(Boolean)))],
    [courses]
  );

  const filteredCourses = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return courses;

    return courses.filter((course) =>
      [
        course.title,
        course.description,
        course.category,
        course.level,
      ]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(term))
    );
  }, [courses, search]);

  const enrolledCourseIds = useMemo(
    () => new Set(progress.map((item) => item.courseId)),
    [progress]
  );

  async function enroll(course: Course) {
    setBusyId(course.id);
    setError("");
    setNotice("");
    try {
      await api.enrollCourse(course.id);
      setNotice(`You're enrolled in ${course.title}.`);
      await loadLearning();
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          "Enrollment failed. You may already be enrolled."
      );
    } finally {
      setBusyId("");
    }
  }

  async function markComplete(lessonId: string) {
    setBusyId(lessonId);
    setError("");
    setNotice("");
    try {
      await api.completeLesson(lessonId);
      setNotice("Lesson marked complete.");
      await loadLearning();
    } catch (err: any) {
      setError(
        err?.response?.data?.message || "Couldn't update lesson progress."
      );
    } finally {
      setBusyId("");
    }
  }

  return (
    <section className="mt-10 space-y-6" aria-labelledby="learning-heading">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-300">
            Student learning
          </p>
          <h2 id="learning-heading" className="mt-2 text-2xl font-semibold text-white">
            Learning Hub
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-400">
            Explore courses, follow your curriculum and track lesson completion.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void loadLearning()}
          disabled={loading}
          className="rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10 disabled:opacity-50"
        >
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {error && (
        <div role="alert" className="rounded-xl border border-rose-400/20 bg-rose-400/10 p-4 text-sm text-rose-200">
          {error}
        </div>
      )}
      {notice && (
        <div role="status" className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-200">
          {notice}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
          <p className="text-sm text-slate-400">Enrolled courses</p>
          <p className="mt-2 text-3xl font-semibold text-white">{progress.length}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
          <p className="text-sm text-slate-400">Lessons completed</p>
          <p className="mt-2 text-3xl font-semibold text-white">
            {progress.reduce((sum, item) => sum + item.completedLessons, 0)}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <label htmlFor="course-search" className="block text-sm text-slate-300">
          Search courses
        </label>
        <input
          id="course-search"
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by course, skill, or category..."
          className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-indigo-400 focus:outline-none"
        />
        <div className="flex flex-wrap gap-3">
        <label className="text-sm text-slate-300">
          Category
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="ml-2 rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white"
          >
            {categories.map((item) => (
              <option key={item} value={item}>
                {item === "all" ? "All categories" : item}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm text-slate-300">
          Level
          <select
            value={level}
            onChange={(event) => setLevel(event.target.value)}
            className="ml-2 rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white"
          >
            {levels.map((item) => (
              <option key={item} value={item}>
                {item === "all" ? "All levels" : item}
              </option>
            ))}
          </select>
        </label>
        </div>
      </div>

      <div>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-lg font-semibold text-white">Explore courses</h3>
          <span className="text-xs text-slate-400">
            {filteredCourses.length} {filteredCourses.length === 1 ? "course" : "courses"}
          </span>
        </div>
        {loading ? (
          <div className="rounded-2xl border border-white/10 p-6 text-sm text-slate-400">
            Loading courses…
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 p-6 text-sm text-slate-400">
            No courses match your search and filters. Try another keyword or reset a filter.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredCourses.map((course) => (
              <article
                key={course.id}
                className="flex flex-col rounded-2xl border border-white/10 bg-white/[0.04] p-5"
              >
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-indigo-400/10 px-3 py-1 text-xs text-indigo-200">
                    {course.level}
                  </span>
                  <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-slate-300">
                    {course.category || "General"}
                  </span>
                </div>
                <h4 className="mt-4 text-lg font-semibold text-white">{course.title}</h4>
                <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-400">
                  {course.description}
                </p>
                <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
                  <span>{course.duration}</span>
                  <span>{course.price === 0 ? "Free" : `₹${course.price.toLocaleString("en-IN")}`}</span>
                </div>
                <div className="mt-auto flex flex-wrap gap-2 pt-5">
                  <button
                    type="button"
                    onClick={() => setSelected(course)}
                    className="rounded-xl border border-white/10 px-3 py-2 text-sm text-slate-200 hover:bg-white/10"
                  >
                    View details
                  </button>
                  {enrolledCourseIds.has(course.id) ? (
                    <span className="self-center text-xs text-emerald-300">Enrolled</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => void enroll(course)}
                      disabled={busyId === course.id}
                      className="rounded-xl bg-indigo-500 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-400 disabled:opacity-50"
                    >
                      {busyId === course.id ? "Enrolling…" : "Enroll"}
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {selected && (
        <div className="rounded-2xl border border-indigo-400/20 bg-indigo-400/[0.05] p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wider text-indigo-300">Course details</p>
              <h3 className="mt-2 text-xl font-semibold text-white">{selected.title}</h3>
            </div>
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="rounded-lg border border-white/10 px-3 py-1.5 text-sm text-slate-300 hover:bg-white/10"
            >
              Close
            </button>
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-300">{selected.description}</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-slate-950/50 p-3">
              <p className="text-xs text-slate-500">Duration</p>
              <p className="mt-1 text-sm text-white">{selected.duration}</p>
            </div>
            <div className="rounded-xl bg-slate-950/50 p-3">
              <p className="text-xs text-slate-500">Level</p>
              <p className="mt-1 text-sm capitalize text-white">{selected.level}</p>
            </div>
            <div className="rounded-xl bg-slate-950/50 p-3">
              <p className="text-xs text-slate-500">Price</p>
              <p className="mt-1 text-sm text-white">
                {selected.price === 0 ? "Free" : `₹${selected.price.toLocaleString("en-IN")}`}
              </p>
            </div>
          </div>
          <h4 className="mt-5 font-medium text-white">Learning outcomes</h4>
          <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-slate-300">
            {selected.learningOutcomes.map((outcome, index) => (
              <li key={`${index}-${outcome}`}>{outcome}</li>
            ))}
          </ul>
          <h4 className="mt-5 font-medium text-white">Curriculum</h4>
          <div className="mt-3 space-y-3">
            {selected.curriculum.map((module, index) => (
              <div key={`${index}-${module.module}`} className="rounded-xl border border-white/10 bg-slate-950/40 p-4">
                <p className="text-sm font-medium text-white">
                  Module {index + 1}: {module.module}
                </p>
                <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-slate-400">
                  {module.topics.map((topic, topicIndex) => (
                    <li key={`${topicIndex}-${topic}`}>{topic}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          {!enrolledCourseIds.has(selected.id) && (
            <button
              type="button"
              onClick={() => void enroll(selected)}
              disabled={busyId === selected.id}
              className="mt-5 rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-400 disabled:opacity-50"
            >
              {busyId === selected.id ? "Enrolling…" : "Enroll in this course"}
            </button>
          )}
        </div>
      )}

      <div>
        <h3 className="mb-4 text-lg font-semibold text-white">My learning progress</h3>
        {progress.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 p-6 text-sm text-slate-400">
            You haven&apos;t enrolled in any courses yet. Explore the catalogue above to get started.
          </div>
        ) : (
          <div className="space-y-4">
            {progress.map((item) => (
              <article key={item.enrollmentId} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h4 className="font-semibold text-white">{item.courseTitle}</h4>
                    <p className="mt-1 text-xs text-slate-400">
                      {item.completedLessons} of {item.totalLessons} lessons completed
                    </p>
                  </div>
                  <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs text-emerald-200">
                    {item.status === "COMPLETED" ? "Completed" : "In progress"}
                  </span>
                </div>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full rounded-full bg-indigo-400 transition-all"
                    style={{ width: `${item.progressPercent}%` }}
                  />
                </div>
                <p className="mt-2 text-right text-xs text-slate-400">
                  {item.progressPercent}% complete
                </p>
                <div className="mt-4 space-y-4">
                  {item.modules.map((module) => (
                    <div key={module.id}>
                      <h5 className="text-sm font-medium text-slate-200">{module.title}</h5>
                      <div className="mt-2 space-y-2">
                        {module.lessons.map((lesson) => (
                          <div key={lesson.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-950/50 px-3 py-3">
                            <div>
                              <p className="text-sm text-slate-200">{lesson.title}</p>
                              {lesson.duration && (
                                <p className="mt-1 text-xs text-slate-500">{lesson.duration}</p>
                              )}
                            </div>
                            <LessonDetails lesson={lesson} />
                            {lesson.completed ? (
                              <span className="text-xs text-emerald-300">✓ Completed</span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => void markComplete(lesson.id)}
                                disabled={busyId === lesson.id}
                                className="rounded-lg border border-indigo-400/30 px-3 py-1.5 text-xs text-indigo-200 hover:bg-indigo-400/10 disabled:opacity-50"
                              >
                                {busyId === lesson.id ? "Saving…" : "Mark complete"}
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
      <AssignmentsPanel />
    </section>
  );
}
