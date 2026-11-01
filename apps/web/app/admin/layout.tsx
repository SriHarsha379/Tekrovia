"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "../../src/store/auth";
import { useEffect } from "react";
import {
  LayoutDashboard, Users, Layers, TrendingUp,
  Briefcase, LogOut, ChevronRight, ShieldAlert, BookOpen,
} from "lucide-react";

const NAV = [
  { href: "/admin",            label: "Overview",   icon: LayoutDashboard, exact: true },
  { href: "/admin/candidates", label: "Candidates", icon: Users },
  { href: "/admin/courses",    label: "Courses",    icon: BookOpen },
  { href: "/admin/batches",    label: "Batches",    icon: Layers },
  { href: "/admin/placement",  label: "Placement",  icon: Briefcase },
  { href: "/admin/marketing",  label: "Marketing",  icon: TrendingUp },
];

const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN", "PLACEMENT_MANAGER", "SUPPORT_STAFF", "TRAINER", "COUNSELLOR"];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (user && !ADMIN_ROLES.includes(user.role)) {
      router.replace("/dashboard");
    }
  }, [user, router]);

  return (
    <div className="flex min-h-screen bg-slate-950 text-white">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-white/10 bg-slate-900/60 md:flex">
        <div className="flex h-16 items-center gap-2 border-b border-white/10 px-6">
          <ShieldAlert className="h-4 w-4 text-indigo-400" />
          <Link href="/admin" className="text-lg font-bold tracking-tight">
            Admin
          </Link>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {NAV.map(({ href, label, icon: Icon, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-indigo-500/20 text-indigo-300"
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
                {active && <ChevronRight className="ml-auto h-3 w-3 text-indigo-400" />}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/10 p-4 space-y-2">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-400 hover:text-white transition"
          >
            ← Student view
          </Link>
          <button
            onClick={logout}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-400 transition hover:bg-red-500/10 hover:text-red-400"
          >
            <LogOut className="h-4 w-4" />
            Log out
          </button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-white/10 bg-slate-900/60 px-6 md:hidden">
          <span className="font-bold">Admin</span>
          <button onClick={logout} className="text-sm text-slate-400">Log out</button>
        </header>
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
