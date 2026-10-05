import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import ReviewerLink from "../ReviewerLink";

afterEach(() => {
  cleanup();
  window.sessionStorage.clear();
});

function signInAs(role: string) {
  window.sessionStorage.setItem(
    "tekrovia_user",
    JSON.stringify({ id: "u1", email: "u@example.test", name: "User", role }),
  );
}

describe("ReviewerLink", () => {
  it.each(["TRAINER", "ADMIN", "SUPER_ADMIN"])(
    "links %s to the review queue",
    async (role) => {
      signInAs(role);
      render(<ReviewerLink />);

      const link = await screen.findByRole("link", {
        name: /review assignment submissions/i,
      });
      expect(link).toHaveAttribute("href", "/review");
    },
  );

  it.each(["STUDENT", "COUNSELLOR", "PLACEMENT_MANAGER"])(
    "renders nothing for %s",
    (role) => {
      signInAs(role);
      const { container } = render(<ReviewerLink />);
      expect(container).toBeEmptyDOMElement();
    },
  );

  it("renders nothing when nobody is signed in", () => {
    const { container } = render(<ReviewerLink />);
    expect(container).toBeEmptyDOMElement();
  });
});
