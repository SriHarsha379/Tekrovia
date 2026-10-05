import { describe, expect, it } from "vitest";
import { homeForRole } from "../role-home";

describe("homeForRole", () => {
  it.each(["ADMIN", "SUPER_ADMIN"])("sends %s to the admin dashboard", (role) => {
    expect(homeForRole(role)).toBe("/admin");
  });

  it("sends a trainer to the review page", () => {
    expect(homeForRole("TRAINER")).toBe("/review");
  });

  it.each([
    "STUDENT",
    "COUNSELLOR",
    "SUPPORT_STAFF",
    "PLACEMENT_MANAGER",
    "RECRUITER",
    "SOMETHING_ELSE",
    "",
  ])("keeps %s on the student dashboard", (role) => {
    expect(homeForRole(role)).toBe("/dashboard");
  });

  it.each([null, undefined])("falls back to the student dashboard for %s", (role) => {
    expect(homeForRole(role)).toBe("/dashboard");
  });
});
