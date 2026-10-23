"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const API = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/v1`;

const STAFF = ["ADMIN", "SUPER_ADMIN", "TRAINER", "COUNSELLOR", "SUPPORT_STAFF"];

type Props = {
  /** 'dark' for the admin pages, 'light' for the student ones. */
  tone?: "dark" | "light";
};

export default function UserMenu({ tone = "light" }: Props) {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem("tekrovia_user");
    if (raw) {
      try { setUser(JSON.parse(raw)); } catch { setUser(null); }
    }
  }, []);

  async function logout() {
    setBusy(true);
    const token = sessionStorage.getItem("tekrovia_access_token");
    try {
      // Revoke server-side so the token cannot be reused.
      if (token) {
        await fetch(`${API}/auth/logout`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch {
      // Clearing locally still matters even if the call fails.
    } finally {
      sessionStorage.removeItem("tekrovia_access_token");
      sessionStorage.removeItem("tekrovia_user");
      router.replace("/login");
    }
  }

  if (!user) return null;

  const dark = tone === "dark";

  return (
    <div className="flex items-center gap-3">
      <div className="hidden text-right sm:block">
        <p className={`text-sm font-medium ${dark ? "text-slate-200" : "text-slate-800"}`}>
          {user.name}
        </p>
        <p className={`text-xs ${dark ? "text-slate-500" : "text-slate-500"}`}>
          {user.role === "STUDENT" ? "Student" : user.role.replace(/_/g, " ").toLowerCase()}
        </p>
      </div>

      {STAFF.includes(user.role) && (
        <Link
          href="/admin"
          className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
            dark
              ? "border-white/15 text-slate-200 hover:bg-white/10"
              : "border-slate-200 text-slate-700 hover:bg-slate-50"
          }`}
        >
          Admin
        </Link>
      )}

      <button
        type="button"
        onClick={() => void logout()}
        disabled={busy}
        className={`rounded-lg border px-3 py-2 text-sm font-medium transition disabled:opacity-50 ${
          dark
            ? "border-rose-400/30 text-rose-300 hover:bg-rose-400/10"
            : "border-rose-200 text-rose-700 hover:bg-rose-50"
        }`}
      >
        {busy ? "Signing out…" : "Log out"}
      </button>
    </div>
  );
}
