const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN"];

/**
 * Where a user lands after signing in. Only roles with a dedicated page are
 * listed; everyone else keeps the student dashboard.
 */
export function homeForRole(role: string | null | undefined): string {
  if (role && ADMIN_ROLES.includes(role)) return "/admin";
  if (role === "TRAINER") return "/review";
  return "/dashboard";
}
