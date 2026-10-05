"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import ReviewQueue from "../../src/components/ReviewQueue";
import { readAdminUser } from "../../src/lib/admin-api";

const REVIEWER_ROLES = ["TRAINER", "ADMIN", "SUPER_ADMIN"];

export default function ReviewPage() {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);
  const [backHref, setBackHref] = useState("/dashboard");

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
    setBackHref(user.role === "TRAINER" ? "/dashboard" : "/admin");
    setAllowed(true);
  }, [router]);

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
            <h1 className="mt-2 text-3xl font-bold">Assignment review</h1>
            <p className="mt-2 text-slate-400">
              Review learner submissions, approve them or request changes.
            </p>
          </div>
          <Link
            href={backHref}
            className="rounded-xl border border-slate-700 px-4 py-3 text-sm font-semibold hover:bg-slate-800"
          >
            Back
          </Link>
        </header>
        <ReviewQueue />
      </div>
    </main>
  );
}
