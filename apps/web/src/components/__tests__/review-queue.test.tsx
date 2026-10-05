import { afterEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import ReviewQueue from "../ReviewQueue";
import { adminApi } from "../../lib/admin-api";

afterEach(() => {
  cleanup();
});

const item = {
  id: "sub-1",
  attemptNumber: 2,
  status: "SUBMITTED",
  submissionText: "My answer <b>bold</b>\nsecond line",
  submissionUrl: "https://github.com/example/repo",
  feedback: null,
  submittedAt: "2026-10-05T05:00:00.000Z",
  reviewedAt: null,
  user: { id: "u1", name: "Asha Rao", email: "asha@example.test" },
  assignment: {
    id: "asg-1",
    title: "Build an API",
    lesson: {
      id: "les-1",
      title: "Intro",
      module: {
        title: "Module One",
        course: { id: "c1", title: "Python Basics" },
      },
    },
  },
};

const pageOf = (items: unknown[] = [item], total = items.length) => ({
  data: { items, total, page: 1, limit: 20 },
});

const params = (status: string, page = 1) => ({
  params: { status, page, limit: 20 },
});

describe("ReviewQueue", () => {
  it("loads submissions awaiting review and shows who and what", async () => {
    const get = vi.spyOn(adminApi, "get").mockResolvedValue(pageOf() as never);

    render(<ReviewQueue />);

    expect(await screen.findByText("Build an API")).toBeInTheDocument();
    expect(get).toHaveBeenCalledWith("/assignments/review", params("SUBMITTED"));
    expect(screen.getByText("Asha Rao")).toBeInTheDocument();
    expect(screen.getByText("asha@example.test")).toBeInTheDocument();
    expect(screen.getByText(/Python Basics/)).toBeInTheDocument();
    expect(screen.getByText(/Attempt 2/)).toBeInTheDocument();
  });

  it("shows the answer as plain text, never as HTML", async () => {
    vi.spyOn(adminApi, "get").mockResolvedValue(pageOf() as never);

    const { container } = render(<ReviewQueue />);

    expect(await screen.findByText(/<b>bold<\/b>/)).toBeInTheDocument();
    expect(container.querySelector("b")).toBeNull();
  });

  it("renders a safe https link as an external link", async () => {
    vi.spyOn(adminApi, "get").mockResolvedValue(pageOf() as never);

    render(<ReviewQueue />);

    const link = await screen.findByRole("link");
    expect(link).toHaveAttribute("href", "https://github.com/example/repo");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link.getAttribute("rel")).toContain("noopener");
  });

  it("does not render an unsafe link", async () => {
    vi.spyOn(adminApi, "get").mockResolvedValue(
      pageOf([{ ...item, submissionUrl: "javascript:alert(1)" }]) as never,
    );

    render(<ReviewQueue />);

    expect(await screen.findByText(/not a valid https link/i)).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("approves a submission and reloads the queue", async () => {
    const get = vi.spyOn(adminApi, "get").mockResolvedValue(pageOf() as never);
    const patch = vi.spyOn(adminApi, "patch").mockResolvedValue({
      data: { courseCompleted: false },
    } as never);

    render(<ReviewQueue />);
    fireEvent.click(await screen.findByRole("button", { name: /^approve /i }));

    await waitFor(() => expect(patch).toHaveBeenCalledTimes(1));
    expect(patch).toHaveBeenCalledWith("/assignments/submissions/sub-1/review", {
      status: "APPROVED",
    });
    expect(await screen.findByText("Approved.")).toBeInTheDocument();
    await waitFor(() => expect(get).toHaveBeenCalledTimes(2));
  });

  it("sends trimmed feedback with an approval", async () => {
    vi.spyOn(adminApi, "get").mockResolvedValue(pageOf() as never);
    const patch = vi.spyOn(adminApi, "patch").mockResolvedValue({
      data: { courseCompleted: false },
    } as never);

    render(<ReviewQueue />);
    fireEvent.change(await screen.findByLabelText(/feedback for asha rao/i), {
      target: { value: "  Great work  " },
    });
    fireEvent.click(screen.getByRole("button", { name: /^approve /i }));

    await waitFor(() => expect(patch).toHaveBeenCalledTimes(1));
    expect(patch.mock.calls[0][1]).toEqual({
      status: "APPROVED",
      feedback: "Great work",
    });
  });

  it("tells the reviewer when an approval completes the course", async () => {
    vi.spyOn(adminApi, "get").mockResolvedValue(pageOf() as never);
    vi.spyOn(adminApi, "patch").mockResolvedValue({
      data: { courseCompleted: true },
    } as never);

    render(<ReviewQueue />);
    fireEvent.click(await screen.findByRole("button", { name: /^approve /i }));

    expect(await screen.findByText(/completed the course/i)).toBeInTheDocument();
  });

  it("requires feedback before requesting changes", async () => {
    vi.spyOn(adminApi, "get").mockResolvedValue(pageOf() as never);
    const patch = vi.spyOn(adminApi, "patch");

    render(<ReviewQueue />);
    fireEvent.click(await screen.findByRole("button", { name: /^request changes/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/add feedback/i);
    expect(patch).not.toHaveBeenCalled();
  });

  it("requests changes with feedback", async () => {
    vi.spyOn(adminApi, "get").mockResolvedValue(pageOf() as never);
    const patch = vi.spyOn(adminApi, "patch").mockResolvedValue({
      data: { courseCompleted: false },
    } as never);

    render(<ReviewQueue />);
    fireEvent.change(await screen.findByLabelText(/feedback for asha rao/i), {
      target: { value: "Please add tests" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^request changes/i }));

    await waitFor(() => expect(patch).toHaveBeenCalledTimes(1));
    expect(patch).toHaveBeenCalledWith("/assignments/submissions/sub-1/review", {
      status: "CHANGES_REQUESTED",
      feedback: "Please add tests",
    });
    expect(await screen.findByText("Changes requested.")).toBeInTheDocument();
  });

  it("switches tabs, and offers no actions on reviewed submissions", async () => {
    const get = vi
      .spyOn(adminApi, "get")
      .mockResolvedValueOnce(pageOf() as never)
      .mockResolvedValueOnce(
        pageOf([{ ...item, status: "APPROVED", feedback: "Well done" }]) as never,
      );

    render(<ReviewQueue />);
    await screen.findByText("Build an API");
    fireEvent.click(screen.getByRole("button", { name: "Approved" }));

    expect(await screen.findByText("Well done")).toBeInTheDocument();
    expect(get).toHaveBeenLastCalledWith("/assignments/review", params("APPROVED"));
    expect(screen.queryByRole("button", { name: /^approve /i })).not.toBeInTheDocument();
  });

  it("shows an empty state", async () => {
    vi.spyOn(adminApi, "get").mockResolvedValue(pageOf([]) as never);

    render(<ReviewQueue />);

    expect(await screen.findByText(/no submissions in this view/i)).toBeInTheDocument();
  });

  it("shows the server message when loading fails", async () => {
    vi.spyOn(adminApi, "get").mockRejectedValue({
      isAxiosError: true,
      response: { data: { message: "Reviewer access required." } },
    });

    render(<ReviewQueue />);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Reviewer access required.",
    );
  });

  it("paginates", async () => {
    const get = vi.spyOn(adminApi, "get").mockResolvedValue(pageOf([item], 45) as never);

    render(<ReviewQueue />);

    expect(await screen.findByText(/page 1 of 3/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /previous/i })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: /next/i }));

    await waitFor(() =>
      expect(get).toHaveBeenLastCalledWith("/assignments/review", params("SUBMITTED", 2)),
    );
  });
});
