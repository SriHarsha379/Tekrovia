"use client";

import { useEffect } from "react";
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
  const router   = useRouter();
  const { user, token, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated || !token) {
      router.replace("/login");
      return;
    }
    // Re-sync cookie every time this component mounts
    setAuthCookie(token);

    if (requireAdmin) {
      const adminRoles = ["ADMIN","SUPER_ADMIN","TRAINER","COUNSELLOR","SUPPORT_STAFF","PLACEMENT_MANAGER"];
      if (!adminRoles.includes(user?.role ?? "")) {
        router.replace("/dashboard");
      }
    }
  }, [isAuthenticated, token, user, router, requireAdmin]);

  if (!isAuthenticated || !token) return null;

  return <>{children}</>;
}
