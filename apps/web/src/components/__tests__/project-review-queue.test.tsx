import { afterEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import ProjectReviewQueue from "../ProjectReviewQueue";
import { adminApi } from "../../lib/admin-api";

afterEach(() => {
  cleanup();
  window.sessionStorage.clear();
});

function signInAs(role: string) {
  window.sessionStorage.setItem(
    "tekrovia_user",
    JSON.stringify({ id: "u9", email: "r@example.test", name: "Reviewer", role }),
  );
}

const item = (overrides: Record<string, unknown> = {}, isFinal = false) => ({
  id: "sub-1",
  attemptNumber: 1,
  status: "SUBMITTED",
  submissionText: "Built it <b>fast</b>",
  submissionUrl: "https://github.com/example/repo",
  feedback: null,
  vivaNotes: null,
  submittedAt: "2026-10-05T05:00:00.000Z",
  reviewedAt: null,
  user: { id: "u1", name: "Asha Rao", email: "asha@example.test" },
  milestone: {
    id: "m1",
    title: "Ship it",
    isFinal,
    project: {
      id: "p1",
      title: "Build an API",
      course: { id: "c1", title: "Python Basics" },
    },
  },
  ...overrides,
});

const pageOf = (items: unknown[], total = items.length) => ({
  data: { items, total, page: 1, limit: 20 },
});

describe("ProjectReviewQueue", () => {
  it("loads submissions awaiting review and shows the context", async () => {
    signInAs("TRAINER");
    const get = vi.spyOn(adminApi, "get").mockResolvedValue(pageOf([item()]) as never);

    render(<ProjectReviewQueue />);

    expect(await screen.findByText("Build an API")).toBeInTheDocument();
    expect(get).toHaveBeenCalledWith("/projects/review", {
      params: { status: "SUBMITTED", page: 1, limit: 20 },
    });
    expect(screen.getByText(/Python Basics/)).toBeInTheDocument();
    expect(screen.getByText(/Ship it/)).toBeInTheDocument();
    expect(screen.getByText("Asha Rao")).toBeInTheDocument();
  });

  it("shows the work as plain text and a safe external link", async () => {
    signInAs("TRAINER");
    vi.spyOn(adminApi, "get").mockResolvedValue(pageOf([item()]) as never);

    const { container } = render(<ProjectReviewQueue />);

    expect(await screen.findByText(/<b>fast<\/b>/)).toBeInTheDocument();
    expect(container.querySelector("b")).toBeNull();
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "https://github.com/example/repo");
    expect(link.getAttribute("rel")).toContain("noopener");
  });

  it("does not render an unsafe link", async () => {
    signInAs("TRAINER");
    vi.spyOn(adminApi, "get").mockResolvedValue(
      pageOf([item({ submissionUrl: "javascript:alert(1)" })]) as never,
    );

    render(<ProjectReviewQueue />);

    expect(await screen.findByText(/not a valid https link/i)).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("lets a trainer approve an intermediate milestone, sending feedback and viva notes", async () => {
    signInAs("TRAINER");
    vi.spyOn(adminApi, "get").mockResolvedValue(pageOf([item()]) as never);
    const patch = vi.spyOn(adminApi, "patch").mockResolvedValue({
      data: { recordedAsReadinessEvidence: false },
    } as never);

    render(<ProjectReviewQueue />);
    fireEvent.change(await screen.findByLabelText(/feedback for asha rao/i), {
      target: { value: "  Solid  " },
    });
    fireEvent.change(screen.getByLabelText(/viva notes for asha rao/i), {
      target: { value: "  Explained well  " },
    });
    fireEvent.click(screen.getByRole("button", { name: /^approve /i }));

    await waitFor(() => expect(patch).toHaveBeenCalledTimes(1));
    expect(patch).toHaveBeenCalledWith("/projects/submissions/sub-1/review", {
      status: "APPROVED",
      feedback: "Solid",
      vivaNotes: "Explained well",
    });
    expect(await screen.findByText("Approved.")).toBeInTheDocument();
  });

  it("hides approval buttons from a trainer on a final milestone", async () => {
    signInAs("TRAINER");
    vi.spyOn(adminApi, "get").mockResolvedValue(pageOf([item({}, true)]) as never);

    render(<ProjectReviewQueue />);

    expect(await screen.findByText(/\(final milestone\)/i)).toBeInTheDocument();
    expect(screen.getByText(/only an administrator can review the final milestone/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^approve /i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^request changes/i })).not.toBeInTheDocument();
  });

  it.each(["ADMIN", "SUPER_ADMIN"])(
    "offers approval to %s on a final milestone and reports the readiness evidence",
    async (role) => {
      signInAs(role);
      vi.spyOn(adminApi, "get").mockResolvedValue(pageOf([item({}, true)]) as never);
      const patch = vi.spyOn(adminApi, "patch").mockResolvedValue({
        data: { recordedAsReadinessEvidence: true },
      } as never);

      render(<ProjectReviewQueue />);
      fireEvent.click(await screen.findByRole("button", { name: /^approve /i }));

      await waitFor(() => expect(patch).toHaveBeenCalledTimes(1));
      expect(await screen.findByText(/expert-approved readiness evidence/i)).toBeInTheDocument();
    },
  );

  it("requires feedback before requesting changes", async () => {
    signInAs("ADMIN");
    vi.spyOn(adminApi, "get").mockResolvedValue(pageOf([item()]) as never);
    const patch = vi.spyOn(adminApi, "patch");

    render(<ProjectReviewQueue />);
    fireEvent.click(await screen.findByRole("button", { name: /^request changes/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/add feedback/i);
    expect(patch).not.toHaveBeenCalled();
  });

  it("requests changes with feedback", async () => {
    signInAs("ADMIN");
    vi.spyOn(adminApi, "get").mockResolvedValue(pageOf([item()]) as never);
    const patch = vi.spyOn(adminApi, "patch").mockResolvedValue({
      data: { recordedAsReadinessEvidence: false },
    } as never);

    render(<ProjectReviewQueue />);
    fireEvent.change(await screen.findByLabelText(/feedback for asha rao/i), {
      target: { value: "Add tests" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^request changes/i }));

    await waitFor(() => expect(patch).toHaveBeenCalledTimes(1));
    expect(patch).toHaveBeenCalledWith("/projects/submissions/sub-1/review", {
      status: "CHANGES_REQUESTED",
      feedback: "Add tests",
    });
    expect(await screen.findByText("Changes requested.")).toBeInTheDocument();
  });

  it("shows reviewed work with its feedback and no actions", async () => {
    signInAs("ADMIN");
    const get = vi
      .spyOn(adminApi, "get")
      .mockResolvedValueOnce(pageOf([item()]) as never)
      .mockResolvedValueOnce(
        pageOf([
          item({ status: "APPROVED", feedback: "Well done", vivaNotes: "Confident" }),
        ]) as never,
      );

    render(<ProjectReviewQueue />);
    await screen.findByText("Build an API");
    fireEvent.click(screen.getByRole("button", { name: "Approved" }));

    expect(await screen.findByText("Well done")).toBeInTheDocument();
    expect(screen.getByText(/viva notes: confident/i)).toBeInTheDocument();
    expect(get).toHaveBeenLastCalledWith("/projects/review", {
      params: { status: "APPROVED", page: 1, limit: 20 },
    });
    expect(screen.queryByRole("button", { name: /^approve /i })).not.toBeInTheDocument();
  });

  it("shows an empty state and the server message on failure", async () => {
    signInAs("TRAINER");
    vi.spyOn(adminApi, "get").mockResolvedValueOnce(pageOf([]) as never);

    render(<ProjectReviewQueue />);
    expect(await screen.findByText(/no project submissions in this view/i)).toBeInTheDocument();

    cleanup();
    vi.spyOn(adminApi, "get").mockRejectedValue({
      isAxiosError: true,
      response: { data: { message: "Reviewer access required." } },
    });
    render(<ProjectReviewQueue />);
    expect(await screen.findByRole("alert")).toHaveTextContent("Reviewer access required.");
  });

  it("shows the server message when a review is refused", async () => {
    signInAs("ADMIN");
    vi.spyOn(adminApi, "get").mockResolvedValue(pageOf([item({}, true)]) as never);
    vi.spyOn(adminApi, "patch").mockRejectedValue({
      isAxiosError: true,
      response: {
        data: { message: "This learner has no candidate profile yet, so the project cannot be recorded as readiness evidence." },
      },
    });

    render(<ProjectReviewQueue />);
    fireEvent.click(await screen.findByRole("button", { name: /^approve /i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/no candidate profile/i);
  });

  it("paginates", async () => {
    signInAs("TRAINER");
    const get = vi.spyOn(adminApi, "get").mockResolvedValue(pageOf([item()], 45) as never);

    render(<ProjectReviewQueue />);

    expect(await screen.findByText(/page 1 of 3/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /next/i }));
    await waitFor(() =>
      expect(get).toHaveBeenLastCalledWith("/projects/review", {
        params: { status: "SUBMITTED", page: 2, limit: 20 },
      }),
    );
  });
});
