"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useState } from "react";
import axios from "axios";
import { api } from "../../src/lib/api-client";
import CareerReadinessCard from "../../src/components/CareerReadinessCard";
import InteractiveAssessmentCard from "../../src/components/InteractiveAssessmentCard";
import LearningHub from "../../src/components/LearningHub";
import ReviewerLink from "../../src/components/ReviewerLink";
import ReadinessChecklist from "../../src/components/ReadinessChecklist";
import { homeForRole } from "../../src/lib/role-home";
import { readStoredUtm } from "../../src/lib/utm";

type User = {
  id: string;
  email: string;
  name: string;
  role: string;
};

type Candidate = {
  id: string;
  candidateCode: string;
  userId: string;
  fullName: string;
  email: string;
  phone: string;
  education?: string | null;
  graduationYear?: number | null;
  experienceYears: number;
  skills: string[];
  targetRole?: string | null;
  courseInterest?: string | null;
  assessments: Array<{
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
    updatedAt: string;
  }>;
};

type ProfileForm = {
  fullName: string;
  phone: string;
  education: string;
  graduationYear: string;
  experienceYears: string;
  skills: string;
  targetRole: string;
  courseInterest: string;
  codingPreference: string;
  learningAvailability: string;
  preferredSchedule: string;
  previousTraining: string;
  careerGapMonths: string;
  resumeUrl: string;
  consentGiven: boolean;
};

const emptyForm: ProfileForm = {
  fullName: "",
  phone: "",
  education: "",
  graduationYear: "",
  experienceYears: "0",
  skills: "",
  targetRole: "",
  courseInterest: "",
  codingPreference: "",
  learningAvailability: "",
  preferredSchedule: "",
  previousTraining: "",
  careerGapMonths: "",
  resumeUrl: "",
  consentGiven: false,
};

const inputClass =
  "mt-2 w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-indigo-400";

function isNotFound(error: unknown) {
  return axios.isAxiosError(error) && error.response?.status === 404;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [form, setForm] = useState<ProfileForm>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadDashboard = useCallback(async (currentUser: User) => {
    setLoading(true);
    setError("");
    try {
      const profile = (await api.candidates.getForUser(
        currentUser.id
      )) as Candidate;
      setCandidate(profile);
      setForm((previous) => ({
        ...previous,
        fullName: profile.fullName || currentUser.name,
        phone: profile.phone || "",
        education: profile.education || "",
        graduationYear: profile.graduationYear?.toString() || "",
        experienceYears: profile.experienceYears?.toString() || "0",
        skills: profile.skills?.join(", ") || "",
        targetRole: profile.targetRole || "",
        courseInterest: profile.courseInterest || "",
      }));
    } catch (err) {
      if (isNotFound(err)) {
        setCandidate(null);
        setForm((previous) => ({
          ...previous,
          fullName: currentUser.name || "",
        }));
      } else {
        setError(
          "We couldn't load your dashboard. Please check that the API is running and try again."
        );
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshCandidate = useCallback(async () => {
    if (!user) return;

    try {
      const profile = (await api.candidates.getForUser(
        user.id
      )) as Candidate;
      setCandidate(profile);
    } catch {
      setError("Assessment completed, but dashboard history couldn't refresh. Please reload the page.");
    }
  }, [user]);

  useEffect(() => {
    const token = sessionStorage.getItem("tekrovia_access_token");
    const storedUser = sessionStorage.getItem("tekrovia_user");

    if (!token || !storedUser) {
      router.replace("/login");
      return;
    }

    try {
      const parsed = JSON.parse(storedUser) as User;
      if (!parsed.id || !parsed.email) {
        throw new Error("Invalid stored user");
      }
      if (parsed.role === "TRAINER") {
        router.replace(homeForRole(parsed.role));
        return;
      }
      setUser(parsed);
      void loadDashboard(parsed);
    } catch {
      sessionStorage.removeItem("tekrovia_access_token");
      sessionStorage.removeItem("tekrovia_user");
      router.replace("/login");
    }
  }, [router, loadDashboard]);

  function handleLogout() {
    sessionStorage.removeItem("tekrovia_access_token");
    sessionStorage.removeItem("tekrovia_user");
    router.replace("/login");
  }

  function updateField<K extends keyof ProfileForm>(
    key: K,
    value: ProfileForm[K]
  ) {
    setForm((previous) => ({ ...previous, [key]: value }));
  }

  async function handleOnboardingSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return;

    setSaving(true);
    setError("");
    setNotice("");

    const phone = form.phone.trim();
    const graduationYear = form.graduationYear.trim()
      ? Number(form.graduationYear)
      : undefined;
    const experienceYears = Number(form.experienceYears);
    const careerGapMonths = form.careerGapMonths.trim()
      ? Number(form.careerGapMonths)
      : undefined;
    const resumeUrl = form.resumeUrl.trim();

    if (!/^\d{10}$/.test(phone)) {
      setError("Please enter a valid 10-digit phone number.");
      setSaving(false);
      return;
    }

    if (
      graduationYear !== undefined &&
      (!Number.isInteger(graduationYear) ||
        graduationYear < 1950 ||
        graduationYear > 2100)
    ) {
      setError("Please enter a valid graduation year.");
      setSaving(false);
      return;
    }

    if (
      !Number.isInteger(experienceYears) ||
      experienceYears < 0 ||
      experienceYears > 50
    ) {
      setError("Experience must be a whole number from 0 to 50.");
      setSaving(false);
      return;
    }

    if (
      careerGapMonths !== undefined &&
      (!Number.isInteger(careerGapMonths) ||
        careerGapMonths < 0 ||
        careerGapMonths > 600)
    ) {
      setError("Career gap must be a whole number of months from 0 to 600.");
      setSaving(false);
      return;
    }

    if (resumeUrl) {
      let validResume = false;
      try {
        const parsedResume = new URL(resumeUrl);
        validResume = parsedResume.protocol === "https:" && !parsedResume.username && !parsedResume.password;
      } catch {
        validResume = false;
      }
      if (!validResume) {
        setError("Please enter your resume link as a valid https link.");
        setSaving(false);
        return;
      }
    }

    try {
      await api.candidates.createForUser(user.id, {
        fullName: form.fullName.trim(),
        email: user.email,
        phone,
        education: form.education.trim() || undefined,
        graduationYear,
        experienceYears,
        skills: form.skills
          .split(",")
          .map((skill) => skill.trim())
          .filter(Boolean),
        targetRole: form.targetRole.trim() || undefined,
        courseInterest: form.courseInterest.trim() || undefined,
        codingPreference: form.codingPreference.trim() || undefined,
        learningAvailability: form.learningAvailability.trim() || undefined,
        preferredSchedule: form.preferredSchedule.trim() || undefined,
        previousTraining: form.previousTraining.trim() || undefined,
        careerGapMonths,
        resumeUrl: resumeUrl || undefined,
        ...readStoredUtm(),
        consentGiven: form.consentGiven,
      });

      setNotice("Your profile has been saved.");
      await loadDashboard(user);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const message =
          err.response?.data?.message ||
          "Profile couldn't be saved. Please review your details and try again.";
        setError(Array.isArray(message) ? message.join(", ") : message);
      } else {
        setError("Something went wrong while saving your profile.");
      }
    } finally {
      setSaving(false);
    }
  }

  if (!user || loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <p className="text-sm text-slate-400">Loading your TekRovia dashboard...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-white/10">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link href="/" className="text-2xl font-bold">
            Tek<span className="text-indigo-400">Rovia</span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-slate-400 sm:inline">
              {user.email}
            </span>
            <button
              onClick={handleLogout}
              className="rounded-lg border border-white/10 px-4 py-2 text-sm transition hover:bg-white/10"
            >
              Log out
            </button>
          </div>
        </nav>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-12">
        <p className="text-sm font-semibold uppercase tracking-widest text-indigo-400">
          Student dashboard
        </p>
        <h1 className="mt-3 text-3xl font-bold sm:text-4xl">
          Welcome, {candidate?.fullName || user.name}!
        </h1>
        <p className="mt-3 text-slate-400">
          Your learning and career preparation, in one place.
        </p>

        {error && (
          <div
            role="alert"
            className="mt-6 rounded-xl border border-rose-400/30 bg-rose-400/10 p-4 text-sm text-rose-200"
          >
            {error}
            {!candidate && (
              <button
                className="ml-3 underline"
                onClick={() => void loadDashboard(user)}
              >
                Retry
              </button>
            )}
          </div>
        )}

        {notice && (
          <div
            role="status"
            className="mt-6 rounded-xl border border-emerald-400/30 bg-emerald-400/10 p-4 text-sm text-emerald-200"
          >
            {notice}
          </div>
        )}

        {!candidate ? (
          <div className="mt-10 max-w-3xl rounded-2xl border border-white/10 bg-white/[0.04] p-6 sm:p-8">
            <div className="mb-6">
              <span className="rounded-full bg-indigo-400/10 px-3 py-1 text-xs font-semibold text-indigo-300">
                Profile setup
              </span>
              <h2 className="mt-4 text-2xl font-semibold">
                Complete your student profile
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Add a few details so your dashboard can track your assessments
                and career preparation.
              </p>
            </div>

            <form onSubmit={handleOnboardingSubmit} className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <label className="block text-sm text-slate-300">
                  Full name *
                  <input
                    required
                    minLength={2}
                    className={inputClass}
                    value={form.fullName}
                    onChange={(e) => updateField("fullName", e.target.value)}
                    placeholder="Your full name"
                  />
                </label>
                <label className="block text-sm text-slate-300">
                  Registered email
                  <input
                    disabled
                    className={`${inputClass} cursor-not-allowed opacity-60`}
                    value={user.email}
                  />
                </label>
                <label className="block text-sm text-slate-300">
                  Phone number *
                  <input
                    required
                    inputMode="numeric"
                    maxLength={10}
                    pattern="[0-9]{10}"
                    className={inputClass}
                    value={form.phone}
                    onChange={(e) =>
                      updateField("phone", e.target.value.replace(/\D/g, "").slice(0, 10))
                    }
                    placeholder="10-digit phone number"
                  />
                </label>
                <label className="block text-sm text-slate-300">
                  Highest education
                  <input
                    className={inputClass}
                    value={form.education}
                    onChange={(e) => updateField("education", e.target.value)}
                    placeholder="e.g. B.Tech Computer Science"
                  />
                </label>
                <label className="block text-sm text-slate-300">
                  Graduation year
                  <input
                    type="number"
                    min={1950}
                    max={2100}
                    className={inputClass}
                    value={form.graduationYear}
                    onChange={(e) => updateField("graduationYear", e.target.value)}
                    placeholder="e.g. 2024"
                  />
                </label>
                <label className="block text-sm text-slate-300">
                  Years of experience
                  <input
                    type="number"
                    min={0}
                    max={50}
                    step={1}
                    className={inputClass}
                    value={form.experienceYears}
                    onChange={(e) => updateField("experienceYears", e.target.value)}
                  />
                </label>
                <label className="block text-sm text-slate-300 sm:col-span-2">
                  Skills (comma-separated)
                  <input
                    className={inputClass}
                    value={form.skills}
                    onChange={(e) => updateField("skills", e.target.value)}
                    placeholder="Python, React, SQL"
                  />
                </label>
                <label className="block text-sm text-slate-300">
                  Target role
                  <input
                    className={inputClass}
                    value={form.targetRole}
                    onChange={(e) => updateField("targetRole", e.target.value)}
                    placeholder="e.g. Backend Developer"
                  />
                </label>
                <label className="block text-sm text-slate-300">
                  Course interest
                  <input
                    className={inputClass}
                    value={form.courseInterest}
                    onChange={(e) => updateField("courseInterest", e.target.value)}
                    placeholder="e.g. Full-stack development"
                  />
                </label>
                <label className="block text-sm text-slate-300">
                  Coding preference
                  <input
                    className={inputClass}
                    value={form.codingPreference}
                    onChange={(e) => updateField("codingPreference", e.target.value)}
                    placeholder="e.g. Python"
                  />
                </label>
                <label className="block text-sm text-slate-300">
                  Learning availability
                  <input
                    className={inputClass}
                    value={form.learningAvailability}
                    onChange={(e) => updateField("learningAvailability", e.target.value)}
                    placeholder="e.g. 2 hours per day"
                  />
                </label>
                <label className="block text-sm text-slate-300 sm:col-span-2">
                  Preferred schedule
                  <input
                    className={inputClass}
                    value={form.preferredSchedule}
                    onChange={(e) => updateField("preferredSchedule", e.target.value)}
                    placeholder="e.g. Weekday evenings"
                  />
                </label>
                <label className="block text-sm text-slate-300 sm:col-span-2">
                  Earlier training or courses
                  <input
                    className={inputClass}
                    maxLength={2000}
                    value={form.previousTraining}
                    onChange={(e) => updateField("previousTraining", e.target.value)}
                    placeholder="e.g. 2-month Python bootcamp, online SQL course"
                  />
                </label>
                <label className="block text-sm text-slate-300">
                  Career gap (months)
                  <input
                    className={inputClass}
                    inputMode="numeric"
                    value={form.careerGapMonths}
                    onChange={(e) => updateField("careerGapMonths", e.target.value)}
                    placeholder="0 if none"
                  />
                </label>
                <label className="block text-sm text-slate-300">
                  Resume link (https)
                  <input
                    className={inputClass}
                    maxLength={2000}
                    value={form.resumeUrl}
                    onChange={(e) => updateField("resumeUrl", e.target.value)}
                    placeholder="https://"
                  />
                </label>
              </div>

              <label className="flex items-start gap-3 text-sm text-slate-400">
                <input
                  type="checkbox"
                  checked={form.consentGiven}
                  onChange={(e) => updateField("consentGiven", e.target.checked)}
                  className="mt-1 accent-indigo-500"
                />
                I consent to the use of these details for my learning and
                placement preparation.
              </label>

              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-indigo-500 px-6 py-3 text-sm font-semibold transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Saving profile..." : "Save and continue"}
              </button>
            </form>
          </div>
        ) : (
          <>
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <article className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                <p className="text-sm text-slate-400">Candidate ID</p>
                <p className="mt-2 break-all text-lg font-semibold">
                  {candidate.candidateCode}
                </p>
              </article>
              <article className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                <p className="text-sm text-slate-400">Assessments</p>
                <p className="mt-2 text-3xl font-bold">
                  {candidate.assessments?.length ?? 0}
                </p>
              </article>
              <article className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                <p className="text-sm text-slate-400">Experience</p>
                <p className="mt-2 text-3xl font-bold">
                  {candidate.experienceYears ?? 0}{" "}
                  <span className="text-sm font-normal text-slate-400">years</span>
                </p>
              </article>
              <article className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                <p className="text-sm text-slate-400">Target role</p>
                <p className="mt-2 text-lg font-semibold">
                  {candidate.targetRole || "Not set"}
                </p>
              </article>
            </div>

            <CareerReadinessCard
              assessmentCount={candidate.assessments?.length ?? 0}
              onCompleted={refreshCandidate}
            />

            <InteractiveAssessmentCard onCompleted={refreshCandidate} />

            <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1.4fr]">
              <article className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
                <h2 className="text-xl font-semibold">Your profile</h2>
                <dl className="mt-5 space-y-4 text-sm">
                  <div>
                    <dt className="text-slate-500">Education</dt>
                    <dd className="mt-1 text-slate-200">{candidate.education || "Not provided"}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Graduation year</dt>
                    <dd className="mt-1 text-slate-200">{candidate.graduationYear || "Not provided"}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Course interest</dt>
                    <dd className="mt-1 text-slate-200">{candidate.courseInterest || "Not provided"}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Skills</dt>
                    <dd className="mt-2 flex flex-wrap gap-2">
                      {candidate.skills?.length ? candidate.skills.map((skill) => (
                        <span key={skill} className="rounded-full bg-indigo-400/10 px-3 py-1 text-xs text-indigo-200">
                          {skill}
                        </span>
                      )) : <span className="text-slate-400">No skills added</span>}
                    </dd>
                  </div>
                </dl>
              </article>

              <article className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-xl font-semibold">Assessment history</h2>
                  <span className="text-xs text-slate-500">
                    {candidate.assessments?.length ?? 0} records
                  </span>
                </div>
                {candidate.assessments?.length ? (
                  <div className="mt-5 space-y-3">
                    {candidate.assessments.map((assessment) => (
                      <div key={assessment.id} className="rounded-xl border border-white/10 bg-slate-900/70 p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <h3 className="font-medium">{assessment.title}</h3>
                            <p className="mt-1 text-xs text-slate-500">
                              {assessment.type} · {new Date(assessment.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-slate-300">
                            {assessment.status}
                          </span>
                        </div>
                        <p className="mt-3 text-sm text-slate-300">
                          Score: {assessment.score ?? "Pending"}{assessment.score != null ? ` / ${assessment.maxScore}` : ""}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-5 rounded-xl border border-dashed border-white/10 p-6 text-sm text-slate-400">
                    No assessments yet. Your assessment history will appear here once you take an assessment.
                  </div>
                )}
              </article>
            </div>
          </>
        )}

        <ReadinessChecklist />
        <ReviewerLink />
        <LearningHub />

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            ["Learning", "Explore courses and track your learning progress in the Learning Hub."],
            ["Assessments", "Your assessment history is loaded from your candidate profile."],
            ["Career", "Career and placement tracking will be connected when those backend services are available."],
          ].map(([title, description]) => (
            <article
              key={title}
              className="rounded-2xl border border-white/10 bg-white/[0.04] p-6"
            >
              <h2 className="text-lg font-semibold">{title}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-400">{description}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
