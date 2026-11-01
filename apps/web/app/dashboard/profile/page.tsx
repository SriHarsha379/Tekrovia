"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "../../../src/lib/api";
import { useAuthStore } from "../../../src/store/auth";
import { toast } from "sonner";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";

const schema = z.object({
  fullName:            z.string().min(2, "Enter your full name"),
  email:               z.string().email("Enter a valid email"),
  phone:               z.string().regex(/^\+?[0-9]{10,13}$/, "Enter a valid phone number"),
  education:           z.string().optional(),
  graduationYear:      z.coerce.number().min(1990).max(2035).optional().or(z.literal("")),
  experienceYears:     z.coerce.number().min(0).max(50).optional(),
  targetRole:          z.string().optional(),
  skills:              z.string().optional(),
  learningAvailability:z.string().optional(),
  preferredSchedule:   z.string().optional(),
  courseInterest:      z.string().optional(),
  codingPreference:    z.string().optional(),
  careerGapMonths:     z.coerce.number().min(0).optional(),
  consentGiven:        z.boolean().optional(),
});

type FormData = z.infer<typeof schema>;

const fetchCandidate = (userId: string) =>
  api.get(`/candidates/user/${userId}`).then((r) => r.data).catch(() => null);

const FIELDS = [
  { name: "fullName",             label: "Full name",             type: "text",   placeholder: "Ravi Kumar" },
  { name: "email",                label: "Email",                 type: "email",  placeholder: "ravi@example.com" },
  { name: "phone",                label: "Phone",                 type: "tel",    placeholder: "+91 98765 43210" },
  { name: "education",            label: "Highest education",     type: "text",   placeholder: "B.Tech Computer Science" },
  { name: "graduationYear",       label: "Graduation year",       type: "number", placeholder: "2023" },
  { name: "experienceYears",      label: "Years of experience",   type: "number", placeholder: "0" },
  { name: "targetRole",           label: "Target role",           type: "text",   placeholder: "Full Stack Developer" },
  { name: "skills",               label: "Skills (comma-separated)", type: "text", placeholder: "JavaScript, React, Node.js" },
  { name: "learningAvailability", label: "Learning availability", type: "text",   placeholder: "Weekdays 2 hrs / day" },
  { name: "preferredSchedule",    label: "Preferred schedule",    type: "text",   placeholder: "Morning / Evening / Weekend" },
  { name: "courseInterest",       label: "Course interest",       type: "text",   placeholder: "Full Stack Development" },
  { name: "codingPreference",     label: "Coding language preference", type: "text", placeholder: "JavaScript" },
  { name: "careerGapMonths",      label: "Career gap (months)",   type: "number", placeholder: "0" },
] as const;

export default function ProfilePage() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);

  const { data: candidate, isLoading } = useQuery({
    queryKey: ["candidate-me"],
    queryFn: () => fetchCandidate(user!.id),
    enabled: !!user?.id,
  });

  const hasProfile = !!candidate;

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: candidate
      ? {
          ...candidate,
          skills: candidate.skills?.join(", ") ?? "",
          graduationYear: candidate.graduationYear ?? "",
        }
      : { email: user?.email ?? "", fullName: user?.name ?? "" },
  });

  const createProfile = useMutation({
    mutationFn: (data: any) =>
      api.post(`/candidates/user/${user!.id}`, data).then((r) => r.data),
    onSuccess: () => {
      toast.success("Profile created!");
      setEditing(false);
      qc.invalidateQueries({ queryKey: ["candidate-me"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? "Failed to save profile");
    },
  });

  const onSubmit = (data: FormData) => {
    const payload = {
      ...data,
      skills: data.skills
        ? data.skills.split(",").map((s) => s.trim()).filter(Boolean)
        : [],
      graduationYear: data.graduationYear ? Number(data.graduationYear) : null,
      experienceYears: Number(data.experienceYears ?? 0),
      careerGapMonths: Number(data.careerGapMonths ?? 0),
      consentGiven: true,
    };
    createProfile.mutate(payload);
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-slate-400 p-8">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading profile…
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">My Profile</h1>
          <p className="mt-1 text-sm text-slate-400">
            Your candidate profile powers assessments, placement matching and your roadmap.
          </p>
        </div>
        {hasProfile && !editing && (
          <button
            onClick={() => setEditing(true)}
            className="rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-300 transition hover:bg-white/5"
          >
            Edit
          </button>
        )}
      </div>

      {/* Status banner */}
      {!hasProfile && !editing && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-400/20 bg-amber-400/5 p-5">
          <AlertCircle className="h-5 w-5 shrink-0 text-amber-400 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-300">Profile incomplete</p>
            <p className="mt-1 text-sm text-slate-400">
              Complete your profile to unlock assessments, course recommendations and placement support.
            </p>
            <button
              onClick={() => setEditing(true)}
              className="mt-3 rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-400"
            >
              Complete profile
            </button>
          </div>
        </div>
      )}

      {/* Profile view */}
      {hasProfile && !editing && (
        <div className="rounded-2xl border border-white/10 bg-slate-900/50 divide-y divide-white/10">
          {/* Avatar row */}
          <div className="flex items-center gap-4 p-6">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-500/30 text-xl font-bold text-indigo-300">
              {candidate.fullName?.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-lg font-semibold text-white">{candidate.fullName}</p>
              <p className="text-sm text-slate-400">{candidate.email}</p>
              <p className="mt-1 text-xs text-slate-500 font-mono">{candidate.candidateCode}</p>
            </div>
            <span className="ml-auto flex items-center gap-1 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-medium text-emerald-300">
              <CheckCircle2 className="h-3 w-3" /> Active
            </span>
          </div>

          {/* Details grid */}
          <div className="grid grid-cols-2 gap-px bg-white/5">
            {[
              { label: "Phone",             value: candidate.phone },
              { label: "Education",         value: candidate.education },
              { label: "Graduation year",   value: candidate.graduationYear },
              { label: "Experience",        value: candidate.experienceYears != null ? `${candidate.experienceYears} yr${candidate.experienceYears !== 1 ? "s" : ""}` : null },
              { label: "Target role",       value: candidate.targetRole },
              { label: "Course interest",   value: candidate.courseInterest },
              { label: "Coding preference", value: candidate.codingPreference },
              { label: "Career gap",        value: candidate.careerGapMonths ? `${candidate.careerGapMonths} months` : "None" },
              { label: "Availability",      value: candidate.learningAvailability },
              { label: "Schedule",          value: candidate.preferredSchedule },
            ].map(({ label, value }) => (
              <div key={label} className="bg-slate-900/50 p-4">
                <p className="text-xs text-slate-500">{label}</p>
                <p className="mt-1 text-sm text-white">{value || "—"}</p>
              </div>
            ))}
          </div>

          {/* Skills */}
          {candidate.skills?.length > 0 && (
            <div className="p-5">
              <p className="text-xs text-slate-500 mb-2">Skills</p>
              <div className="flex flex-wrap gap-2">
                {candidate.skills.map((skill: string) => (
                  <span
                    key={skill}
                    className="rounded-full bg-indigo-500/20 px-3 py-1 text-xs font-medium text-indigo-300"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Form — create or edit */}
      {(editing || !hasProfile) && (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-5 rounded-2xl border border-white/10 bg-slate-900/50 p-6"
        >
          <h2 className="font-semibold text-white">
            {hasProfile ? "Edit profile" : "Complete your profile"}
          </h2>

          <div className="grid gap-5 sm:grid-cols-2">
            {FIELDS.map(({ name, label, type, placeholder }) => (
              <div key={name} className={name === "skills" ? "sm:col-span-2" : ""}>
                <label className="mb-1.5 block text-sm font-medium text-slate-300">
                  {label}
                </label>
                <input
                  {...register(name)}
                  type={type}
                  placeholder={placeholder}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
                {errors[name] && (
                  <p className="mt-1 text-xs text-red-400">
                    {errors[name]?.message as string}
                  </p>
                )}
              </div>
            ))}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={createProfile.isPending}
              className="flex items-center gap-2 rounded-xl bg-indigo-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-400 disabled:opacity-60"
            >
              {createProfile.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {hasProfile ? "Save changes" : "Create profile"}
            </button>
            {editing && (
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="rounded-xl border border-white/10 px-5 py-2.5 text-sm text-slate-400 transition hover:text-white"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
