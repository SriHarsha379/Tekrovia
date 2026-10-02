'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { adminApi, isAdmin, readAdminUser } from '../../../../src/lib/admin-api';

type Assessment = {
  id: string;
  type: string;
  title: string;
  description?: string | null;
  score?: number | null;
  maxScore: number;
  classification?: string | null;
  status: string;
  startedAt: string;
  completedAt?: string | null;
  createdAt: string;
};

type LessonProgress = {
  isCompleted: boolean;
  completedAt?: string | null;
};

type Lesson = {
  id: string;
  title: string;
  description?: string | null;
  duration?: number | null;
  sortOrder: number;
  isPublished: boolean;
  progress: LessonProgress[];
};

type CourseModule = {
  id: string;
  title: string;
  description?: string | null;
  sortOrder: number;
  lessons: Lesson[];
};

type Enrollment = {
  id: string;
  status: string;
  enrolledAt: string;
  completedAt?: string | null;
  course: {
    id: string;
    title: string;
    category?: string | null;
    level: string;
    status: string;
    modules: CourseModule[];
  };
};

type StudentDetail = {
  id: string;
  candidateCode: string;
  fullName: string;
  email: string;
  phone: string;
  education?: string | null;
  graduationYear?: number | null;
  experienceYears: number;
  currentEmployment?: string | null;
  skills: string[];
  previousTraining?: string | null;
  careerGapMonths?: number | null;
  targetRole?: string | null;
  codingPreference?: string | null;
  resumeUrl?: string | null;
  learningAvailability?: string | null;
  preferredSchedule?: string | null;
  courseInterest?: string | null;
  campaignSource?: string | null;
  consentGiven: boolean;
  status: string;
  classification?: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string;
    role: string;
    isVerified: boolean;
    isActive: boolean;
    createdAt: string;
  };
  assessments: Assessment[];
  enrollments: Enrollment[];
  registrations: {
    id: string;
    courseInterest?: string | null;
    targetRole?: string | null;
    createdAt: string;
  }[];
};

function prettyDate(value?: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
}

function Field({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) {
  return (
    <div className="rounded-xl bg-slate-950/70 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-2 break-words text-sm text-slate-200">
        {value === null || value === undefined || value === '' ? '—' : value}
      </p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const normalized = status.toUpperCase();
  const style =
    normalized === 'COMPLETED' || normalized === 'ACTIVE'
      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
      : normalized === 'CANCELLED' || normalized === 'INACTIVE'
        ? 'border-rose-500/30 bg-rose-500/10 text-rose-300'
        : 'border-slate-700 bg-slate-800 text-slate-300';

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${style}`}
    >
      {status.replace(/_/g, ' ')}
    </span>
  );
}

function CourseProgress({ enrollment }: { enrollment: Enrollment }) {
  const modules = [...(enrollment.course.modules ?? [])].sort(
    (a, b) => a.sortOrder - b.sortOrder,
  );

  const allLessons = modules.flatMap((module) =>
    [...(module.lessons ?? [])].sort((a, b) => a.sortOrder - b.sortOrder),
  );
  const publishedLessons = allLessons.filter((lesson) => lesson.isPublished);
  const completedLessons = publishedLessons.filter((lesson) =>
    lesson.progress?.some((progress) => progress.isCompleted),
  );

  const total = publishedLessons.length;
  const completed = completedLessons.length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <article className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-100">
            {enrollment.course.title}
          </h3>
          <p className="mt-1 text-xs text-slate-400">
            {enrollment.course.category || 'Course'} ·{' '}
            {enrollment.course.level}
          </p>
        </div>
        <StatusBadge status={enrollment.status} />
      </div>

      <div className="mt-5 rounded-xl border border-slate-800 bg-slate-900/70 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-medium text-slate-200">
            Learning progress
          </p>
          <p className="text-sm font-semibold tabular-nums text-indigo-300">
            {percentage}%
          </p>
        </div>
        <div
          className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-800"
          role="progressbar"
          aria-label={`${enrollment.course.title} completion`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percentage}
        >
          <div
            className="h-full rounded-full bg-indigo-500 transition-all"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <div className="mt-3 flex flex-wrap justify-between gap-2 text-xs text-slate-400">
          <span>
            {completed} of {total} published lessons completed
          </span>
          <span>{modules.length} modules</span>
        </div>
        {total === 0 && (
          <p className="mt-3 text-xs text-amber-300">
            No published lessons are available to calculate progress.
          </p>
        )}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl bg-slate-900/70 p-3">
          <p className="text-xs text-slate-500">Enrolled</p>
          <p className="mt-1 text-sm text-slate-200">
            {prettyDate(enrollment.enrolledAt)}
          </p>
        </div>
        <div className="rounded-xl bg-slate-900/70 p-3">
          <p className="text-xs text-slate-500">Completed</p>
          <p className="mt-1 text-sm text-slate-200">
            {prettyDate(enrollment.completedAt)}
          </p>
        </div>
      </div>

      <div className="mt-5">
        <h4 className="text-sm font-semibold text-slate-200">
          Course curriculum
        </h4>

        {modules.length === 0 ? (
          <p className="mt-3 rounded-xl bg-slate-900 p-4 text-sm text-slate-400">
            No modules have been added to this course yet.
          </p>
        ) : (
          <div className="mt-3 space-y-3">
            {modules.map((module, moduleIndex) => {
              const lessons = [...(module.lessons ?? [])].sort(
                (a, b) => a.sortOrder - b.sortOrder,
              );
              const visibleLessons = lessons.filter(
                (lesson) => lesson.isPublished,
              );
              const moduleCompleted = visibleLessons.filter((lesson) =>
                lesson.progress?.some((progress) => progress.isCompleted),
              ).length;
              const moduleTotal = visibleLessons.length;
              const modulePercentage =
                moduleTotal > 0
                  ? Math.round((moduleCompleted / moduleTotal) * 100)
                  : 0;

              return (
                <section
                  key={module.id}
                  className="rounded-xl border border-slate-800 bg-slate-900/60 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        Module {moduleIndex + 1}
                      </p>
                      <h5 className="mt-1 font-medium text-slate-200">
                        {module.title}
                      </h5>
                      {module.description && (
                        <p className="mt-1 text-xs text-slate-400">
                          {module.description}
                        </p>
                      )}
                    </div>
                    <span className="text-xs text-slate-400">
                      {moduleTotal > 0
                        ? `${moduleCompleted}/${moduleTotal} lessons`
                        : 'No published lessons'}
                    </span>
                  </div>

                  {moduleTotal > 0 && (
                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-800">
                      <div
                        className="h-full rounded-full bg-emerald-500"
                        style={{ width: `${modulePercentage}%` }}
                      />
                    </div>
                  )}

                  {lessons.length > 0 && (
                    <ul className="mt-3 space-y-2">
                      {lessons.map((lesson) => {
                        const isCompleted = Boolean(
                          lesson.progress?.some(
                            (progress) => progress.isCompleted,
                          ),
                        );

                        return (
                          <li
                            key={lesson.id}
                            className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-950/70 px-3 py-2.5"
                          >
                            <div className="flex min-w-0 items-center gap-2">
                              <span
                                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs ${
                                  !lesson.isPublished
                                    ? 'bg-slate-800 text-slate-400'
                                    : isCompleted
                                      ? 'bg-emerald-500/15 text-emerald-300'
                                      : 'bg-slate-800 text-slate-500'
                                }`}
                                aria-hidden="true"
                              >
                                {!lesson.isPublished
                                  ? '·'
                                  : isCompleted
                                    ? '✓'
                                    : '○'}
                              </span>
                              <span className="text-sm text-slate-300">
                                {lesson.title}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              {lesson.duration != null &&
                                lesson.duration > 0 && (
                                  <span className="text-xs text-slate-500">
                                    {lesson.duration} min
                                  </span>
                                )}
                              <span
                                className={`text-xs ${
                                  !lesson.isPublished
                                    ? 'text-slate-500'
                                    : isCompleted
                                      ? 'text-emerald-300'
                                      : 'text-amber-300'
                                }`}
                              >
                                {!lesson.isPublished
                                  ? 'Draft'
                                  : isCompleted
                                    ? 'Completed'
                                    : 'Not started'}
                              </span>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}

                  {lessons.length === 0 && (
                    <p className="mt-3 text-xs text-slate-500">
                      No lessons in this module.
                    </p>
                  )}
                </section>
              );
            })}
          </div>
        )}
      </div>
    </article>
  );
}

export default function AdminStudentDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;
  const [student, setStudent] = useState<StudentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const user = readAdminUser();
    if (!user) {
      router.replace('/login');
      return;
    }
    if (!isAdmin(user)) {
      router.replace('/dashboard');
      return;
    }

    let active = true;
    adminApi
      .get<StudentDetail>(`/admin/students/${encodeURIComponent(id)}`)
      .then((response) => {
        if (active) setStudent(response.data);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setError(
          axios.isAxiosError(err)
            ? err.response?.data?.message ||
                'Unable to load this student profile.'
            : 'Unable to load this student profile.',
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id, router]);

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-10 text-slate-100 md:px-10">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-7">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-indigo-300">
              TekRovia · Administration
            </p>
            <h1 className="mt-2 text-3xl font-bold">Student profile</h1>
          </div>
          <Link
            href="/admin/students"
            className="rounded-xl border border-slate-700 px-4 py-3 text-sm font-semibold hover:bg-slate-800"
          >
            ← Back to students
          </Link>
        </header>

        {loading && (
          <p className="rounded-xl border border-slate-800 bg-slate-900 p-8 text-slate-400">
            Loading student profile…
          </p>
        )}
        {!loading && error && (
          <div
            role="alert"
            className="rounded-xl border border-rose-500/40 bg-rose-950/40 p-5 text-rose-200"
          >
            {error}
          </div>
        )}

        {!loading && student && (
          <>
            <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-slate-400">
                    {student.candidateCode}
                  </p>
                  <h2 className="mt-1 text-2xl font-bold">
                    {student.fullName}
                  </h2>
                  <p className="mt-2 text-sm text-slate-400">
                    {student.email} · {student.phone}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <StatusBadge status={student.status} />
                  {student.classification && (
                    <span className="rounded-full border border-slate-700 px-3 py-1.5 text-xs text-slate-300">
                      {student.classification}
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <Field label="Target role" value={student.targetRole} />
                <Field label="Course interest" value={student.courseInterest} />
                <Field label="Education" value={student.education} />
                <Field
                  label="Graduation year"
                  value={student.graduationYear}
                />
                <Field
                  label="Experience (years)"
                  value={student.experienceYears}
                />
                <Field
                  label="Current employment"
                  value={student.currentEmployment}
                />
                <Field
                  label="Learning availability"
                  value={student.learningAvailability}
                />
                <Field
                  label="Preferred schedule"
                  value={student.preferredSchedule}
                />
                <Field label="Joined" value={prettyDate(student.createdAt)} />
              </div>

              <div className="mt-4">
                <Field
                  label="Skills"
                  value={
                    student.skills?.length ? student.skills.join(', ') : '—'
                  }
                />
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <Field
                  label="Previous training"
                  value={student.previousTraining}
                />
                <Field
                  label="Career gap (months)"
                  value={student.careerGapMonths}
                />
                <Field
                  label="Coding preference"
                  value={student.codingPreference}
                />
                <Field
                  label="Campaign source"
                  value={student.campaignSource}
                />
              </div>

              {student.resumeUrl && (
                <p className="mt-4 text-sm">
                  <a
                    href={student.resumeUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-300 underline"
                  >
                    View resume
                  </a>
                </p>
              )}

              <p className="mt-4 text-xs text-slate-500">
                Account: {student.user.isActive ? 'Active' : 'Inactive'} ·
                Email verified: {student.user.isVerified ? 'Yes' : 'No'} ·
                Consent recorded: {student.consentGiven ? 'Yes' : 'No'}
              </p>
            </section>

            <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-6">
              <h2 className="text-xl font-semibold">Assessment history</h2>
              <p className="mt-1 text-sm text-slate-400">
                Recorded assessments associated with this candidate.
              </p>

              {student.assessments.length === 0 ? (
                <p className="mt-5 rounded-xl bg-slate-950 p-5 text-sm text-slate-400">
                  No assessments found.
                </p>
              ) : (
                <div className="mt-4 space-y-3">
                  {student.assessments.map((assessment) => (
                    <article
                      key={assessment.id}
                      className="rounded-xl border border-slate-800 bg-slate-950/60 p-4"
                    >
                      <div className="flex flex-wrap justify-between gap-3">
                        <div>
                          <h3 className="font-semibold">
                            {assessment.title}
                          </h3>
                          <p className="mt-1 text-xs text-slate-500">
                            {assessment.type.replace(/_/g, ' ')} ·{' '}
                            {prettyDate(assessment.createdAt)}
                          </p>
                        </div>
                        <StatusBadge status={assessment.status} />
                      </div>

                      {assessment.description && (
                        <p className="mt-3 text-sm text-slate-400">
                          {assessment.description}
                        </p>
                      )}
                      <p className="mt-3 text-sm text-slate-300">
                        Score: {assessment.score ?? '—'} /{' '}
                        {assessment.maxScore}
                        {assessment.classification
                          ? ` · ${assessment.classification}`
                          : ''}
                      </p>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-6">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold">
                    Learning progress
                  </h2>
                  <p className="mt-1 text-sm text-slate-400">
                    Course completion, module breakdown, and lesson statuses
                    for this student.
                  </p>
                </div>
                <span className="rounded-full border border-slate-700 px-3 py-1.5 text-xs text-slate-300">
                  {student.enrollments.length}{' '}
                  {student.enrollments.length === 1
                    ? 'enrollment'
                    : 'enrollments'}
                </span>
              </div>

              {student.enrollments.length === 0 ? (
                <p className="mt-5 rounded-xl bg-slate-950 p-5 text-sm text-slate-400">
                  No course enrollments found for this student.
                </p>
              ) : (
                <div className="mt-5 space-y-5">
                  {student.enrollments.map((enrollment) => (
                    <CourseProgress
                      key={enrollment.id}
                      enrollment={enrollment}
                    />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}
