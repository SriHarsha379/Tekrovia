"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { readAdminUser } from "../lib/admin-api";

const REVIEWER_ROLES = ["TRAINER", "ADMIN", "SUPER_ADMIN"];

export default function ReviewerLink() {
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const user = readAdminUser();
    setAllowed(!!user && REVIEWER_ROLES.includes(user.role));
  }, []);

  if (!allowed) return null;

  return (
    <div className="mt-8">
      <Link
        href="/review"
        className="inline-block rounded-xl border border-indigo-400/40 px-4 py-2.5 text-sm font-semibold text-indigo-200 hover:bg-indigo-400/10"
      >
        Review assignment submissions
      </Link>
    </div>
  );
}
