"use client";

import axios from "axios";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";

type CourseLevel = "beginner" | "intermediate" | "advanced";
type CourseStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

type CurriculumModule = {
  module: string;
  topics: string[];
};

type AdminCourse = {
  id: string;
  title: string;
  category?: string;
  description: string;
  duration: string;
  level: CourseLevel;
  price: number;
  learningOutcomes: string[];
  curriculum: CurriculumModule[];
  status: CourseStatus;
  enrollmentCount?: number;
  createdAt?: string;
  updatedAt?: string;
};

type AdminForm = {
  title: string;
  category: string;
  description: string;
  duration: string;
  level: CourseLevel;
  price: string;
  learningOutcomes: string;
  curriculum: string;
};

const emptyForm: AdminForm = {
  title: "",
  category: "Technology",
  description: "",
  duration: "",
  level: "beginner",
  price: "0",
  learningOutcomes: "",
  curriculum: JSON.stringify(
    [{ module: "Module 1", topics: ["Introduction"] }],
    null,
    2,
  ),
};

const inputClass =
  "mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-indigo-400";
const buttonClass =
  "rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50";

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (Array.isArray(message)) return message.join(", ");
    if (typeof message === "string") return message;
  }
  return error instanceof Error ? error.message : "Something went wrong.";
}

function parseCurriculum(value: string): CurriculumModule[] {
  const parsed: unknown = JSON.parse(value);
  if (
    !Array.isArray(parsed) ||
    parsed.length === 0 ||
    !parsed.every(
      (item) =>
        item &&
        typeof item.module === "string" &&
        item.module.trim() &&
        Array.isArray(item.topics) &&
        item.topics.every(
          (topic: unknown) => typeof topic === "string" && topic.trim(),
        ),
    )
  ) {
    throw new Error(
      "Curriculum must be a JSON array of modules, each with a non-empty module name and topics array.",
    );
  }
  return parsed as CurriculumModule[];
}

function statusClass(status: CourseStatus) {
  if (status === "PUBLISHED") return "bg-emerald-400/10 text-emerald-300";
  if (status === "ARCHIVED") return "bg-slate-500/20 text-slate-300";
  return "bg-amber-400/10 text-amber-300";
}

export default function AdminCourseManager() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [courses, setCourses] = useState<AdminCourse[]>([]);
  const [form, setForm] = useState<AdminForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [originalCurriculum, setOriginalCurriculum] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const requestConfig = useCallback(() => {
    const token = window.sessionStorage.getItem("tekrovia_access_token");
    if (!token) throw new Error("Your session has expired. Please sign in.");
    return { headers: { Authorization: `Bearer ${token}` } };
  }, []);

  const loadCourses = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await axios.get<AdminCourse[]>(
        `${API_BASE_URL}/courses/admin`,
        requestConfig(),
      );
      setCourses(response.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [requestConfig]);

useEffect(() => {
  const token = window.sessionStorage.getItem("tekrovia_access_token");
  const storedUser = window.sessionStorage.getItem("tekrovia_user");

  console.log("[AdminCourseManager] Auth check:", {
    hasToken: !!token,
    hasStoredUser: !!storedUser,
    path: window.location.pathname,
  });

  if (!token || !storedUser) {
    router.replace("/login");
    return;
  }

  try {
    const user = JSON.parse(storedUser) as { role?: string };

    console.log("[AdminCourseManager] Parsed role:", user.role);

    if (!["ADMIN", "SUPER_ADMIN"].includes(user.role ?? "")) {
      console.warn("[AdminCourseManager] Access denied for role:", user.role);
      router.replace("/dashboard");
      return;
    }

    setAuthorized(true);
    void loadCourses();
  } catch (error) {
    console.error("[AdminCourseManager] Auth check failed:", error);

    window.sessionStorage.removeItem("tekrovia_access_token");
    window.sessionStorage.removeItem("tekrovia_user");
    router.replace("/login");
  } finally {
    setCheckingAuth(false);
  }
}, [router, loadCourses]);

  function updateField<K extends keyof AdminForm>(
    key: K,
    value: AdminForm[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
    setOriginalCurriculum("");
  }

  function beginEdit(course: AdminCourse) {
    const curriculum = JSON.stringify(course.curriculum ?? [], null, 2);
    setEditingId(course.id);
    setOriginalCurriculum(curriculum);
    setForm({
      title: course.title,
      category: course.category ?? "",
      description: course.description,
      duration: course.duration,
      level: course.level,
      price: String(course.price),
      learningOutcomes: (course.learningOutcomes ?? []).join("\n"),
      curriculum,
    });
    setError("");
    setNotice("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function submitCourse(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");

    try {
      const price = Number(form.price);
      if (!Number.isFinite(price) || price < 0) {
        throw new Error("Enter a valid non-negative course price.");
      }

      const curriculum = parseCurriculum(form.curriculum);
      const learningOutcomes = form.learningOutcomes
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean);

      const payload = {
        title: form.title.trim(),
        category: form.category.trim() || "General",
        description: form.description.trim(),
        duration: form.duration.trim(),
        level: form.level,
        price,
        learningOutcomes,
        curriculum,
      };

      if (!payload.title || !payload.description || !payload.duration) {
        throw new Error("Title, description, and duration are required.");
      }

      if (editingId) {
        const updatePayload: Partial<typeof payload> = {
          title: payload.title,
          category: payload.category,
          description: payload.description,
          duration: payload.duration,
          level: payload.level,
          price: payload.price,
          learningOutcomes: payload.learningOutcomes,
        };

        // Avoid replacing the curriculum unless the admin actually changed it.
        if (form.curriculum !== originalCurriculum) {
          updatePayload.curriculum = payload.curriculum;
        }

        await axios.patch(
          `${API_BASE_URL}/courses/admin/${editingId}`,
          updatePayload,
          requestConfig(),
        );
        setNotice("Course changes saved.");
      } else {
        await axios.post(
          `${API_BASE_URL}/courses/admin`,
          { ...payload, status: "DRAFT" },
          requestConfig(),
        );
        setNotice("Draft course created.");
      }

      resetForm();
      await loadCourses();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function changeStatus(course: AdminCourse, action: "publish" | "archive") {
    const label = action === "publish" ? "publish" : "archive";
    if (!window.confirm(`Are you sure you want to ${label} "${course.title}"?`)) {
      return;
    }

    setBusyId(course.id);
    setError("");
    setNotice("");
    try {
      await axios.patch(
        `${API_BASE_URL}/courses/admin/${course.id}/${action}`,
        {},
        requestConfig(),
      );
      setNotice(`"${course.title}" ${action === "publish" ? "published" : "archived"}.`);
      await loadCourses();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusyId("");
    }
  }

  const visibleCourses = courses.filter((course) => {
    const matchesStatus =
      statusFilter === "ALL" || course.status === statusFilter;
    const term = search.trim().toLowerCase();
    const matchesSearch =
      !term ||
      [course.title, course.category, course.description]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(term));
    return matchesStatus && matchesSearch;
  });

  if (checkingAuth || !authorized) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-300">
        Checking administrator access…
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-300">
              TekRovia · Administration
            </p>
            <h1 className="mt-2 text-3xl font-bold">Course management</h1>
            <p className="mt-2 text-sm text-slate-400">
              Create drafts, maintain curricula, publish courses, and archive retired content.
            </p>
          </div>
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className={`${buttonClass} border border-white/15 text-slate-200 hover:bg-white/10`}
          >
            Back to dashboard
          </button>
        </header>

        {error && (
          <div role="alert" className="rounded-xl border border-rose-400/30 bg-rose-400/10 p-4 text-sm text-rose-200">
            {error}
          </div>
        )}
        {notice && (
          <div role="status" className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 p-4 text-sm text-emerald-200">
            {notice}
          </div>
        )}

        <section className="rounded-2xl border border-white/10 bg-white/[0.035] p-5 sm:p-7">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold">
                {editingId ? "Edit course" : "Create a draft course"}
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                Courses are created as drafts. Publish only after completing the curriculum.
              </p>
            </div>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className={`${buttonClass} border border-white/15 text-slate-200 hover:bg-white/10`}
              >
                Cancel editing
              </button>
            )}
          </div>

          <form onSubmit={submitCourse} className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block text-sm text-slate-300">
                Course title *
                <input required maxLength={160} className={inputClass} value={form.title}
                  onChange={(event) => updateField("title", event.target.value)}
                  placeholder="e.g. Python Backend Engineering" />
              </label>
              <label className="block text-sm text-slate-300">
                Category
                <input maxLength={100} className={inputClass} value={form.category}
                  onChange={(event) => updateField("category", event.target.value)}
                  placeholder="Technology" />
              </label>
              <label className="block text-sm text-slate-300">
                Duration *
                <input required maxLength={80} className={inputClass} value={form.duration}
                  onChange={(event) => updateField("duration", event.target.value)}
                  placeholder="e.g. 12 weeks" />
              </label>
              <label className="block text-sm text-slate-300">
                Level
                <select className={inputClass} value={form.level}
                  onChange={(event) => updateField("level", event.target.value as CourseLevel)}>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </label>
              <label className="block text-sm text-slate-300">
                Price (₹)
                <input type="number" min="0" step="0.01" className={inputClass} value={form.price}
                  onChange={(event) => updateField("price", event.target.value)} />
              </label>
            </div>

            <label className="block text-sm text-slate-300">
              Description *
              <textarea required rows={3} maxLength={5000} className={inputClass} value={form.description}
                onChange={(event) => updateField("description", event.target.value)}
                placeholder="Describe the course and intended learners." />
            </label>

            <label className="block text-sm text-slate-300">
              Learning outcomes <span className="text-slate-500">(one per line)</span>
              <textarea rows={4} className={inputClass} value={form.learningOutcomes}
                onChange={(event) => updateField("learningOutcomes", event.target.value)}
                placeholder={"Build REST APIs\nWork with databases\nDeploy an application"} />
            </label>

            <label className="block text-sm text-slate-300">
              Curriculum JSON *
              <span className="mt-1 block text-xs text-slate-500">
                Provide a non-empty array of modules, each with a module name and at least one topic.
              </span>
              <textarea required rows={10} spellCheck={false} className={`${inputClass} font-mono text-xs leading-6`}
                value={form.curriculum}
                onChange={(event) => updateField("curriculum", event.target.value)}
                aria-label="Curriculum JSON" />
            </label>

            <div className="flex flex-wrap gap-3">
              <button type="submit" disabled={saving}
                className={`${buttonClass} bg-indigo-500 text-white hover:bg-indigo-400`}>
                {saving ? "Saving…" : editingId ? "Save changes" : "Create draft"}
              </button>
              <button type="button" disabled={saving} onClick={() => void loadCourses()}
                className={`${buttonClass} border border-white/15 text-slate-200 hover:bg-white/10`}>
                Refresh courses
              </button>
            </div>
          </form>
        </section>

        <section className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">All courses</h2>
              <p className="mt-1 text-sm text-slate-400">
                {courses.length} total · {courses.filter((item) => item.status === "DRAFT").length} drafts ·{" "}
                {courses.filter((item) => item.status === "PUBLISHED").length} published
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <input aria-label="Search courses" value={search} onChange={(event) => setSearch(event.target.value)}
                placeholder="Search courses…" className="rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-indigo-400" />
              <select aria-label="Filter by status" value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white">
                <option value="ALL">All statuses</option>
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Published</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="rounded-2xl border border-white/10 p-6 text-sm text-slate-400">Loading courses…</div>
          ) : visibleCourses.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/15 p-8 text-center text-sm text-slate-400">
              No courses found for this search or status.
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {visibleCourses.map((course) => (
                <article key={course.id} className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="break-words text-lg font-semibold">{course.title}</h3>
                      <p className="mt-1 text-sm text-slate-400">
                        {course.category || "General"} · {course.level} · {course.duration}
                      </p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass(course.status)}`}>
                      {course.status}
                    </span>
                  </div>
                  <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-300">{course.description}</p>
                  <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-400">
                    <span className="rounded-lg bg-white/5 px-3 py-1.5">₹{course.price.toLocaleString("en-IN")}</span>
                    <span className="rounded-lg bg-white/5 px-3 py-1.5">{course.curriculum?.length ?? 0} modules</span>
                    <span className="rounded-lg bg-white/5 px-3 py-1.5">{course.enrollmentCount ?? 0} enrollments</span>
                  </div>
                  <div className="mt-5 flex flex-wrap gap-2">
                    <button type="button" onClick={() => beginEdit(course)}
                      className={`${buttonClass} border border-white/15 text-slate-200 hover:bg-white/10`}>
                      Edit
                    </button>
                    {course.status === "DRAFT" && (
                      <button type="button" disabled={busyId === course.id}
                        onClick={() => void changeStatus(course, "publish")}
                        className={`${buttonClass} bg-emerald-600 text-white hover:bg-emerald-500`}>
                        {busyId === course.id ? "Working…" : "Publish"}
                      </button>
                    )}
                    {course.status !== "ARCHIVED" && (
                      <button type="button" disabled={busyId === course.id}
                        onClick={() => void changeStatus(course, "archive")}
                        className={`${buttonClass} border border-rose-400/30 text-rose-300 hover:bg-rose-400/10`}>
                        {busyId === course.id ? "Working…" : "Archive"}
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
