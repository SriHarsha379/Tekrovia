"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Zap, BookOpen, Code, Brain,
  ChevronRight, CheckCircle2, ArrowRight,
} from "lucide-react";

const SESSIONS = [
  {
    id: 1,
    title: "GenAI Foundation & Careers",
    subtitle: "Session 1 — Free",
    description: "Understand what Generative AI is, how it's reshaping careers, and where you fit in this landscape.",
    topics: [
      "What is GenAI and how does it work?",
      "Top GenAI roles and salary ranges in India",
      "Skills companies are hiring for right now",
      "Your personalised career readiness score",
    ],
    icon: Brain,
    color: "text-indigo-400",
    bg: "bg-indigo-500/10",
    border: "border-indigo-400/20",
  },
  {
    id: 2,
    title: "Build a Basic GenAI Application",
    subtitle: "Session 2 — Free",
    description: "Get hands-on. Build a working GenAI application from scratch with guided support.",
    topics: [
      "Set up your development environment",
      "Use an LLM API (OpenAI / Gemini)",
      "Build a simple Q&A chatbot",
      "Deploy your first AI app",
    ],
    icon: Code,
    color: "text-violet-400",
    bg: "bg-violet-500/10",
    border: "border-violet-400/20",
  },
  {
    id: 3,
    title: "Agentic AI Demo & Project Roadmap",
    subtitle: "Session 3 — Free",
    description: "See what's possible with Agentic AI and get a personalised roadmap for your learning journey.",
    topics: [
      "What are AI Agents and why they matter",
      "Live demo of a multi-agent system",
      "Your personalised 12-week learning roadmap",
      "Course walkthrough + enrolment offer",
    ],
    icon: Zap,
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-400/20",
  },
];

export default function TrialPage() {
  const router = useRouter();
  const [registered, setRegistered] = useState(false);

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="border-b border-white/10">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-xl font-bold tracking-tight">
            Tek<span className="text-indigo-400">Rovia</span>
          </Link>
          <Link
            href="/register"
            className="rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-400 transition"
          >
            Get started free
          </Link>
        </nav>
      </header>

      <div className="mx-auto max-w-4xl px-6 py-16 space-y-16">
        {/* Hero */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-400/30 bg-indigo-400/10 px-4 py-2 text-sm text-indigo-200 mb-6">
            <Zap className="h-4 w-4" />
            3 free sessions — no payment required
          </div>
          <h1 className="text-4xl font-bold sm:text-5xl">
            Try TekRovia free.
            <br />
            <span className="text-indigo-400">Learn before you commit.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-300">
            Three live sessions covering GenAI foundations, hands-on building,
            and a personalised roadmap — completely free, no card required.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="flex items-center gap-2 rounded-xl bg-indigo-500 px-6 py-3.5 font-semibold text-white hover:bg-indigo-400 transition"
            >
              Register for free trial <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#sessions"
              className="rounded-xl border border-white/15 px-6 py-3.5 font-semibold text-slate-200 hover:bg-white/5 transition"
            >
              See what's covered
            </a>
          </div>
        </div>

        {/* Sessions */}
        <div id="sessions" className="space-y-5">
          <h2 className="text-2xl font-bold text-center text-white">What you&apos;ll get</h2>
          <div className="grid gap-5 sm:grid-cols-3">
            {SESSIONS.map((session) => {
              const Icon = session.icon;
              return (
                <div
                  key={session.id}
                  className={`rounded-2xl border ${session.border} ${session.bg} p-6 space-y-4`}
                >
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-white/10`}>
                    <Icon className={`h-5 w-5 ${session.color}`} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      {session.subtitle}
                    </p>
                    <h3 className="mt-1 text-lg font-bold text-white leading-snug">
                      {session.title}
                    </h3>
                    <p className="mt-2 text-sm text-slate-400 leading-6">
                      {session.description}
                    </p>
                  </div>
                  <ul className="space-y-2">
                    {session.topics.map((topic) => (
                      <li key={topic} className="flex gap-2 text-sm text-slate-300">
                        <CheckCircle2 className={`h-4 w-4 shrink-0 ${session.color} mt-0.5`} />
                        {topic}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>

        {/* After trial */}
        <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-8 text-center">
          <h2 className="text-xl font-bold text-white">After the trial</h2>
          <p className="mt-3 text-slate-400 max-w-xl mx-auto">
            At the end of Session 3 you&apos;ll receive your personalised learning roadmap
            and a recommended course. Enrol only if it feels right — no pressure.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-3 text-left">
            {[
              { label: "Technology Training", price: "₹9,999", desc: "Full course + projects" },
              { label: "Interview Prep", price: "₹9,999", desc: "Mocks + resume + readiness" },
              { label: "Complete Package", price: "₹29,999", desc: "Everything included" },
            ].map(({ label, price, desc }) => (
              <div key={label} className="rounded-xl border border-white/10 p-4">
                <p className="font-semibold text-white">{label}</p>
                <p className="text-2xl font-bold text-indigo-300 mt-1">{price}</p>
                <p className="text-xs text-slate-500 mt-1">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-white">Ready to start?</h2>
          <p className="text-slate-400">Register in 2 minutes. Sessions are scheduled to fit your availability.</p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-8 py-4 text-lg font-semibold text-white hover:bg-indigo-400 transition"
          >
            Register for free <ArrowRight className="h-5 w-5" />
          </Link>
          <p className="text-xs text-slate-600">
            No payment. No card. Just 3 free sessions to help you decide.
          </p>
        </div>
      </div>

      <footer className="border-t border-white/10 px-6 py-6 text-center text-sm text-slate-600">
        © {new Date().getFullYear()} TekRovia · Placement support does not guarantee employment.
      </footer>
    </main>
  );
}
