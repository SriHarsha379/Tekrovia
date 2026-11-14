"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../store/auth";

export default function AuthGuard({
  children,
  requireAdmin = false,
}: {
  children: React.ReactNode;
  requireAdmin?: boolean;
}) {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    // Token lives in the httpOnly cookie — only check isAuthenticated here
    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }

    if (requireAdmin) {
      const adminRoles = [
        "ADMIN", "SUPER_ADMIN", "TRAINER",
        "COUNSELLOR", "SUPPORT_STAFF", "PLACEMENT_MANAGER",
      ];
      if (!adminRoles.includes(user?.role ?? "")) {
        router.replace("/dashboard");
      }
    }
  }, [hydrated, isAuthenticated, user, router, requireAdmin]);

  if (!hydrated) return null;
  if (!isAuthenticated) return null;

  return <>{children}</>;
}
