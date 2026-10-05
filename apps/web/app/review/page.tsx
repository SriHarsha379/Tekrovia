"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import ProjectReviewQueue from "../../src/components/ProjectReviewQueue";
import ReviewQueue from "../../src/components/ReviewQueue";
import { readAdminUser } from "../../src/lib/admin-api";

const REVIEWER_ROLES = ["TRAINER", "ADMIN", "SUPER_ADMIN"];

export default function ReviewPage() {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);
  const [backHref, setBackHref] = useState<string | null>("/dashboard");
  const [view, setView] = useState<"assignments" | "projects">("assignments");

  useEffect(() => {
    const user = readAdminUser();
    if (!user) {
      router.replace("/login");
      return;
    }
    if (!REVIEWER_ROLES.includes(user.role)) {
      router.replace("/dashboard");
      return;
    }
    setBackHref(user.role === "TRAINER" ? null : "/admin");
    setAllowed(true);
  }, [router]);

  function handleLogout() {
    sessionStorage.removeItem("tekrovia_access_token");
    sessionStorage.removeItem("tekrovia_user");
    router.replace("/login");
  }

  if (!allowed) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-300">
        Checking access…
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-10 text-slate-100 md:px-10">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-7">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-indigo-300">
              TekRovia · Review
            </p>
            <h1 className="mt-2 text-3xl font-bold">Review</h1>
            <p className="mt-2 text-slate-400">
              Review learner submissions, approve them or request changes.
            </p>
          </div>
          <div className="flex gap-3">
            {backHref && (
              <Link
                href={backHref}
                className="rounded-xl border border-slate-700 px-4 py-3 text-sm font-semibold hover:bg-slate-800"
              >
                Back
              </Link>
            )}
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-xl border border-slate-700 px-4 py-3 text-sm font-semibold hover:bg-slate-800"
            >
              Log out
            </button>
          </div>
        </header>
        <div className="mb-6 flex gap-2">
          {(["assignments", "projects"] as const).map((item) => (
            <button
              key={item}
              type="button"
              aria-pressed={view === item}
              onClick={() => setView(item)}
              className={`rounded-xl border px-4 py-2 text-sm font-semibold ${
                view === item
                  ? "border-indigo-400 bg-indigo-500/20 text-white"
                  : "border-white/10 text-slate-300 hover:bg-white/10"
              }`}
            >
              {item === "assignments" ? "Assignments" : "Projects"}
            </button>
          ))}
        </div>
        {view === "assignments" ? <ReviewQueue /> : <ProjectReviewQueue />}
      </div>
    </main>
  );
}
