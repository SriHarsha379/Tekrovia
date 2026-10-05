import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import ReviewPage from "../../../app/review/page";
import { adminApi } from "../../lib/admin-api";

const replace = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
}));

afterEach(() => {
  cleanup();
  window.sessionStorage.clear();
});

function signInAs(role: string) {
  window.sessionStorage.setItem("tekrovia_access_token", "token");
  window.sessionStorage.setItem(
    "tekrovia_user",
    JSON.stringify({ id: "u1", email: "u@example.test", name: "User", role }),
  );
}

function mockEmptyQueue() {
  vi.spyOn(adminApi, "get").mockResolvedValue({
    data: { items: [], total: 0, page: 1, limit: 20 },
  } as never);
}

describe("ReviewPage navigation", () => {
  it("sends anonymous visitors to the login page", () => {
    render(<ReviewPage />);

    expect(replace).toHaveBeenCalledWith("/login");
    expect(screen.getByText(/checking access/i)).toBeInTheDocument();
  });

  it.each(["STUDENT", "COUNSELLOR", "PLACEMENT_MANAGER"])(
    "sends %s back to the dashboard",
    (role) => {
      signInAs(role);
      render(<ReviewPage />);

      expect(replace).toHaveBeenCalledWith("/dashboard");
      expect(screen.getByText(/checking access/i)).toBeInTheDocument();
    },
  );

  it("shows a trainer a Log out button and no Back link", async () => {
    signInAs("TRAINER");
    mockEmptyQueue();

    render(<ReviewPage />);

    expect(await screen.findByRole("heading", { name: "Review" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /log out/i })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Back" })).not.toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });

  it.each(["ADMIN", "SUPER_ADMIN"])(
    "gives %s a Back link to the admin dashboard and a Log out button",
    async (role) => {
      signInAs(role);
      mockEmptyQueue();

      render(<ReviewPage />);

      const back = await screen.findByRole("link", { name: "Back" });
      expect(back).toHaveAttribute("href", "/admin");
      expect(screen.getByRole("button", { name: /log out/i })).toBeInTheDocument();
    },
  );

  it("clears the session and returns to the login page on Log out", async () => {
    signInAs("TRAINER");
    mockEmptyQueue();

    render(<ReviewPage />);
    fireEvent.click(await screen.findByRole("button", { name: /log out/i }));

    expect(window.sessionStorage.getItem("tekrovia_access_token")).toBeNull();
    expect(window.sessionStorage.getItem("tekrovia_user")).toBeNull();
    expect(replace).toHaveBeenCalledWith("/login");
  });
});
