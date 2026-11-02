"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../store/auth";
import { setAuthCookie } from "../lib/cookie";

export default function AuthGuard({
  children,
  requireAdmin = false,
}: {
  children: React.ReactNode;
  requireAdmin?: boolean;
}) {
  const router = useRouter();
  const { user, token, isAuthenticated } = useAuthStore();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // Wait one tick for Zustand to hydrate from localStorage
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    if (!isAuthenticated || !token) {
      router.replace("/login");
      return;
    }

    // Re-sync cookie on every mount
    setAuthCookie(token);

    if (requireAdmin) {
      const adminRoles = [
        "ADMIN", "SUPER_ADMIN", "TRAINER",
        "COUNSELLOR", "SUPPORT_STAFF", "PLACEMENT_MANAGER",
      ];
      if (!adminRoles.includes(user?.role ?? "")) {
        router.replace("/dashboard");
      }
    }
  }, [hydrated, isAuthenticated, token, user, router, requireAdmin]);

  // Show nothing until hydrated — prevents flash of redirect
  if (!hydrated) return null;

  // Not authenticated after hydration — show nothing while redirecting
  if (!isAuthenticated || !token) return null;

  return <>{children}</>;
}
