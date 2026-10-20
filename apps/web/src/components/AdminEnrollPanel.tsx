"use client";

import axios from "axios";
import { useCallback, useEffect, useState } from "react";
import { adminApi } from "../lib/admin-api";

type EnrollableCourse = {
  id: string;
  title: string;
  category?: string | null;
  _count?: { enrollments: number };
};

type Props = {
  /** The User id, not the Candidate id — enrollments key on userId. */
  userId: string;
  studentName: string;
  enrolledCourseIds: string[];
  enrollments: { id: string; status: string; course: { id: string; title: string } }[];
  onChanged: () => void;
};

function errorText(err: unknown) {
  if (axios.isAxiosError(err)) {
    const m = err.response?.data?.message;
    if (Array.isArray(m)) return m.join(", ");
    if (typeof m === "string") return m;
  }
  return err instanceof Error ? err.message : "Something went wrong.";
}

export default function AdminEnrollPanel({
  userId,
  studentName,
  enrolledCourseIds,
  enrollments,
  onChanged,
}: Props) {
  const [courses, setCourses] = useState<EnrollableCourse[]>([]);
  const [selected, setSelected] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.get<EnrollableCourse[]>(
        "/admin/enrollable-courses",
      );
      setCourses(res.data);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function enroll() {
    if (!selected) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const res = await adminApi.post(`/admin/students/${userId}/enrollments`, {
        courseId: selected,
      });
      setNotice(`${studentName} enrolled in ${res.data?.course?.title ?? "the course"}.`);
      setSelected("");
      onChanged();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  async function cancelEnrollment(courseId: string, title: string) {
    if (!window.confirm(`Cancel ${studentName}'s enrollment in "${title}"?`)) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await adminApi.delete(`/admin/students/${userId}/enrollments/${courseId}`);
      setNotice(`Enrollment in ${title} cancelled.`);
      onChanged();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  const available = courses.filter((c: any) => !enrolledCourseIds.includes(c.id));

  return (
    <div className="mt-5 rounded-xl border border-indigo-500/30 bg-indigo-500/5 p-4">
      <h3 className="text-sm font-semibold text-slate-100">Enroll in a course</h3>
      <p className="mt-1 text-xs text-slate-400">
        Use this after payment is confirmed outside the platform.
      </p>

      {error && (
        <p className="mt-3 rounded-lg border border-rose-400/30 bg-rose-400/10 p-3 text-xs text-rose-200">
          {error}
        </p>
      )}
      {notice && (
        <p className="mt-3 rounded-lg border border-emerald-400/30 bg-emerald-400/10 p-3 text-xs text-emerald-200">
          {notice}
        </p>
      )}

      {loading ? (
        <p className="mt-3 text-xs text-slate-400">Loading courses…</p>
      ) : available.length === 0 ? (
        <p className="mt-3 text-xs text-slate-400">
          {courses.length === 0
            ? "No published courses available. Publish a course first."
            : "This student is already enrolled in every published course."}
        </p>
      ) : (
        <div className="mt-3 flex flex-wrap gap-2">
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            aria-label="Course to enroll in"
            className="min-w-0 flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-indigo-400"
          >
            <option value="">Choose a course…</option>
            {available.map((c: any) => (
              <option key={c.id} value={c.id}>
                {c.title}
                {c.category ? ` · ${c.category}` : ""}
                {` · ${c._count?.enrollments ?? 0} enrolled`}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={!selected || busy}
            onClick={() => void enroll()}
            className="rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? "Enrolling…" : "Enroll"}
          </button>
        </div>
      )}

      {enrollments.filter((e: any) => e.status !== "CANCELLED").length > 0 && (
        <div className="mt-4 border-t border-slate-800 pt-3">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Active enrollments
          </p>
          <ul className="mt-2 space-y-1.5">
            {enrollments
              .filter((e: any) => e.status !== "CANCELLED")
              .map((e: any) => (
                <li
                  key={e.id}
                  className="flex items-center justify-between gap-3 rounded-lg bg-slate-950/60 px-3 py-2"
                >
                  <span className="truncate text-sm text-slate-300">
                    {e.course.title}
                  </span>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void cancelEnrollment(e.course.id, e.course.title)}
                    className="shrink-0 rounded-lg border border-rose-400/30 px-3 py-1 text-xs text-rose-300 transition hover:bg-rose-400/10 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </li>
              ))}
          </ul>
        </div>
      )}
    </div>
  );
}
