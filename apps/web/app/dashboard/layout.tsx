"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "../../src/store/auth";
import AuthGuard from "../../src/components/AuthGuard";
import {
  LayoutDashboard, BookOpen, ClipboardList, FolderKanban,
  BrainCircuit, Briefcase, Headphones, User, LogOut,
  ChevronRight, Video, FileText,
} from "lucide-react";

const NAV = [
  { href: "/dashboard",             label: "Dashboard",       icon: LayoutDashboard },
  { href: "/dashboard/courses",     label: "My Courses",      icon: BookOpen },
  { href: "/dashboard/classes",     label: "Live Classes",    icon: Video },
  { href: "/dashboard/assessments", label: "Assessments",     icon: ClipboardList },
  { href: "/dashboard/assignments", label: "Assignments",     icon: ClipboardList },
  { href: "/dashboard/projects",    label: "Projects",        icon: FolderKanban },
  { href: "/dashboard/mock",        label: "Mock Interviews", icon: BrainCircuit },
  { href: "/dashboard/resume",      label: "Resume Builder",  icon: FileText },
  { href: "/dashboard/placement",   label: "Placement",       icon: Briefcase },
  { href: "/dashboard/support",     label: "Support",         icon: Headphones },
  { href: "/dashboard/profile",     label: "Profile",         icon: User },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-slate-950 text-white">
        <aside className="hidden w-64 shrink-0 flex-col border-r border-white/10 bg-slate-900/60 md:flex">
          <div className="flex h-16 items-center border-b border-white/10 px-6">
            <Link href="/" className="text-xl font-bold tracking-tight">
              Tek<span className="text-indigo-400">Rovia</span>
            </Link>
          </div>
          <nav className="flex-1 space-y-0.5 px-3 py-4 overflow-y-auto">
            {NAV.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
              return (
                <Link key={href} href={href} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  active ? "bg-indigo-500/20 text-indigo-300" : "text-slate-400 hover:bg-white/5 hover:text-white"
                }`}>
                  <Icon className="h-4 w-4 shrink-0" />
                  {label}
                  {active && <ChevronRight className="ml-auto h-3 w-3 text-indigo-400" />}
                </Link>
              );
            })}
          </nav>
          <div className="border-t border-white/10 p-4">
            <div className="mb-3 flex items-center gap-3 px-1">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500/30 text-xs font-bold text-indigo-300">
                {user?.name?.charAt(0).toUpperCase() ?? "S"}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-white">{user?.name ?? "Student"}</p>
                <p className="truncate text-xs text-slate-500">{user?.email}</p>
              </div>
            </div>
            <button onClick={logout} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-400 transition hover:bg-red-500/10 hover:text-red-400">
              <LogOut className="h-4 w-4" /> Log out
            </button>
          </div>
        </aside>
        <div className="flex flex-1 flex-col">
          <header className="flex h-16 items-center justify-between border-b border-white/10 bg-slate-900/60 px-6 md:hidden">
            <Link href="/" className="text-xl font-bold tracking-tight">Tek<span className="text-indigo-400">Rovia</span></Link>
            <button onClick={logout} className="text-sm text-slate-400 hover:text-white">Log out</button>
          </header>
          <main className="flex-1 overflow-y-auto p-6">{children}</main>
        </div>
      </div>
    </AuthGuard>
  );
}
