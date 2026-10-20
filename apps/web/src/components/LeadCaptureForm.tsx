"use client";

import { useState, type FormEvent } from "react";

const API_BASE_URL =
  `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/v1`;

const COURSES = [
  "Technology Training",
  "Interview Preparation",
  "Placement Support",
  "Corporate Soft Skills",
  "Complete Package",
  "Not sure yet",
];

const inputClass =
  "mt-1.5 w-full rounded-xl border border-white/15 bg-slate-950 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-indigo-400";

/** UTM values the visitor arrived with, if any. */
function readUtm() {
  if (typeof window === "undefined") return {};
  const p = new URLSearchParams(window.location.search);
  const pick = (k: string) => p.get(k) || undefined;
  return {
    utmSource: pick("utm_source"),
    utmMedium: pick("utm_medium"),
    utmCampaign: pick("utm_campaign"),
    utmContent: pick("utm_content"),
    utmTerm: pick("utm_term"),
  };
}

export default function LeadCaptureForm() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    courseInterest: "",
    consentGiven: false,
  });
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!form.consentGiven) {
      setError("Please agree to be contacted so we can send your result.");
      return;
    }

    setSending(true);
    try {
      const res = await fetch(`${API_BASE_URL}/leads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.replace(/[\s-]/g, ""),
          courseInterest: form.courseInterest || undefined,
          source: "website",
          ...readUtm(),
          consentGiven: true,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        const message = Array.isArray(body?.message)
          ? body.message.join(", ")
          : body?.message;
        setError(message || "Something went wrong. Please try again.");
        return;
      }

      setDone(true);
    } catch {
      setError("Could not reach the server. Please try again.");
    } finally {
      setSending(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/[0.07] p-8 text-center">
        <h3 className="text-xl font-semibold text-emerald-200">
          Thank you, {form.name.split(" ")[0]}.
        </h3>
        <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-slate-300">
          A member of the team will be in touch to set up your free assessment
          and talk through which programme fits your goals.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm text-slate-300">
          Your name *
          <input
            required
            maxLength={150}
            className={inputClass}
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="Full name"
          />
        </label>

        <label className="block text-sm text-slate-300">
          Phone *
          <input
            required
            type="tel"
            className={inputClass}
            value={form.phone}
            onChange={(e) => set("phone", e.target.value)}
            placeholder="10-digit mobile number"
          />
        </label>
      </div>

      <label className="block text-sm text-slate-300">
        Email *
        <input
          required
          type="email"
          maxLength={150}
          className={inputClass}
          value={form.email}
          onChange={(e) => set("email", e.target.value)}
          placeholder="you@example.com"
        />
      </label>

      <label className="block text-sm text-slate-300">
        What are you interested in?
        <select
          className={inputClass}
          value={form.courseInterest}
          onChange={(e) => set("courseInterest", e.target.value)}
        >
          <option value="">Choose one…</option>
          {COURSES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </label>

      <label className="flex items-start gap-3 text-sm leading-6 text-slate-400">
        <input
          type="checkbox"
          className="mt-1 h-4 w-4 shrink-0 rounded border-white/20 bg-slate-950"
          checked={form.consentGiven}
          onChange={(e) => set("consentGiven", e.target.checked)}
        />
        <span>
          I agree to be contacted by TekRovia about my assessment and the
          programmes I asked about.
        </span>
      </label>

      {error && (
        <p role="alert" className="rounded-xl border border-rose-400/30 bg-rose-400/10 p-3 text-sm text-rose-200">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={sending}
        className="w-full rounded-xl bg-indigo-500 px-6 py-4 font-semibold text-white shadow-lg shadow-indigo-950/40 transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {sending ? "Sending…" : "Get my free assessment →"}
      </button>

      <p className="text-center text-xs text-slate-500">
        No payment needed. We will contact you to arrange it.
      </p>
    </form>
  );
}
