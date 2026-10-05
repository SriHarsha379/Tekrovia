import { afterEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import AssignmentsPanel from "../AssignmentsPanel";
import { api } from "../../lib/api-client";

afterEach(() => {
  cleanup();
});

const base = {
  id: "asg-1",
  title: "Build an API",
  instructions: "Follow the brief.",
  isRequired: true,
  lesson: { id: "les-1", title: "Intro" },
  module: { id: "mod-1", title: "Module One" },
  course: { id: "c1", title: "Python Basics" },
  submissions: [] as unknown[],
  latestStatus: null as string | null,
};

const attempt = (overrides: Record<string, unknown> = {}) => ({
  id: "s1",
  attemptNumber: 1,
  submissionText: "My answer",
  submissionUrl: null,
  status: "SUBMITTED",
  feedback: null,
  reviewedAt: null,
  submittedAt: "2026-10-05T05:00:00.000Z",
  ...overrides,
});

describe("AssignmentsPanel", () => {
  it("renders nothing when the learner has no assignments", async () => {
    const get = vi.spyOn(api, "getMyAssignments").mockResolvedValue([] as never);

    const { container } = render(<AssignmentsPanel />);

    await waitFor(() => expect(get).toHaveBeenCalled());
    await waitFor(() => expect(container).toBeEmptyDOMElement());
  });

  it("shows the assignment with its context and an empty submit form", async () => {
    vi.spyOn(api, "getMyAssignments").mockResolvedValue([base] as never);

    render(<AssignmentsPanel />);

    expect(await screen.findByText("Build an API")).toBeInTheDocument();
    expect(screen.getByText(/Python Basics/)).toBeInTheDocument();
    expect(screen.getByText("Required")).toBeInTheDocument();
    expect(screen.getByText("Follow the brief.")).toBeInTheDocument();
    expect(screen.getByLabelText(/answer for build an api/i)).toHaveValue("");
    expect(screen.getByRole("button", { name: /submit build an api/i })).toBeInTheDocument();
  });

  it("labels optional assignments", async () => {
    vi.spyOn(api, "getMyAssignments").mockResolvedValue([
      { ...base, isRequired: false },
    ] as never);

    render(<AssignmentsPanel />);

    expect(await screen.findByText("Optional")).toBeInTheDocument();
  });

  it("shows instructions as plain text, never as HTML", async () => {
    vi.spyOn(api, "getMyAssignments").mockResolvedValue([
      { ...base, instructions: "Use <b>bold</b> carefully" },
    ] as never);

    const { container } = render(<AssignmentsPanel />);

    expect(await screen.findByText(/<b>bold<\/b>/)).toBeInTheDocument();
    expect(container.querySelector("b")).toBeNull();
  });

  it("submits trimmed work and reloads", async () => {
    const get = vi.spyOn(api, "getMyAssignments").mockResolvedValue([base] as never);
    const submit = vi.spyOn(api, "submitAssignment").mockResolvedValue({} as never);

    render(<AssignmentsPanel />);
    await screen.findByText("Build an API");

    fireEvent.change(screen.getByLabelText(/answer for build an api/i), {
      target: { value: "  My answer  " },
    });
    fireEvent.change(screen.getByLabelText(/link for build an api/i), {
      target: { value: " https://github.com/example/repo " },
    });
    fireEvent.click(screen.getByRole("button", { name: /submit build an api/i }));

    await waitFor(() => expect(submit).toHaveBeenCalledTimes(1));
    expect(submit).toHaveBeenCalledWith("asg-1", {
      submissionText: "My answer",
      submissionUrl: "https://github.com/example/repo",
    });
    expect(await screen.findByText(/submitted for review/i)).toBeInTheDocument();
    await waitFor(() => expect(get).toHaveBeenCalledTimes(2));
  });

  it("sends null for a blank link", async () => {
    vi.spyOn(api, "getMyAssignments").mockResolvedValue([base] as never);
    const submit = vi.spyOn(api, "submitAssignment").mockResolvedValue({} as never);

    render(<AssignmentsPanel />);
    await screen.findByText("Build an API");
    fireEvent.change(screen.getByLabelText(/answer for build an api/i), {
      target: { value: "Only text" },
    });
    fireEvent.click(screen.getByRole("button", { name: /submit build an api/i }));

    await waitFor(() => expect(submit).toHaveBeenCalledTimes(1));
    expect(submit).toHaveBeenCalledWith("asg-1", {
      submissionText: "Only text",
      submissionUrl: null,
    });
  });

  it("requires an answer or a link before calling the API", async () => {
    vi.spyOn(api, "getMyAssignments").mockResolvedValue([base] as never);
    const submit = vi.spyOn(api, "submitAssignment");

    render(<AssignmentsPanel />);
    await screen.findByText("Build an API");
    fireEvent.click(screen.getByRole("button", { name: /submit build an api/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/enter your answer/i);
    expect(submit).not.toHaveBeenCalled();
  });

  it("rejects a non-https link before calling the API", async () => {
    vi.spyOn(api, "getMyAssignments").mockResolvedValue([base] as never);
    const submit = vi.spyOn(api, "submitAssignment");

    render(<AssignmentsPanel />);
    await screen.findByText("Build an API");
    fireEvent.change(screen.getByLabelText(/link for build an api/i), {
      target: { value: "http://example.test/work" },
    });
    fireEvent.click(screen.getByRole("button", { name: /submit build an api/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/https/i);
    expect(submit).not.toHaveBeenCalled();
  });

  it("shows the server message when submitting fails", async () => {
    vi.spyOn(api, "getMyAssignments").mockResolvedValue([base] as never);
    vi.spyOn(api, "submitAssignment").mockRejectedValue({
      isAxiosError: true,
      response: { data: { message: "Your latest submission is still awaiting review." } },
    });

    render(<AssignmentsPanel />);
    await screen.findByText("Build an API");
    fireEvent.change(screen.getByLabelText(/answer for build an api/i), {
      target: { value: "Answer" },
    });
    fireEvent.click(screen.getByRole("button", { name: /submit build an api/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/still awaiting review/i);
  });

  it("hides the form while a submission awaits review", async () => {
    vi.spyOn(api, "getMyAssignments").mockResolvedValue([
      { ...base, latestStatus: "SUBMITTED", submissions: [attempt()] },
    ] as never);

    render(<AssignmentsPanel />);

    await screen.findByText("Build an API");
    expect(screen.getAllByText(/awaiting review/i).length).toBeGreaterThan(0);
    expect(screen.getByText("My answer")).toBeInTheDocument();
    expect(screen.queryByLabelText(/answer for build an api/i)).not.toBeInTheDocument();
  });

  it("hides the form once approved, and shows the feedback", async () => {
    vi.spyOn(api, "getMyAssignments").mockResolvedValue([
      {
        ...base,
        latestStatus: "APPROVED",
        submissions: [attempt({ status: "APPROVED", feedback: "Great work" })],
      },
    ] as never);

    render(<AssignmentsPanel />);

    await screen.findByText("Build an API");
    expect(screen.getByText("Great work")).toBeInTheDocument();
    expect(screen.queryByLabelText(/answer for build an api/i)).not.toBeInTheDocument();
  });

  it("shows feedback and offers a resubmit after changes were requested", async () => {
    vi.spyOn(api, "getMyAssignments").mockResolvedValue([
      {
        ...base,
        latestStatus: "CHANGES_REQUESTED",
        submissions: [
          attempt({ status: "CHANGES_REQUESTED", feedback: "Please add tests" }),
        ],
      },
    ] as never);

    render(<AssignmentsPanel />);

    expect(await screen.findByText("Please add tests")).toBeInTheDocument();
    expect(screen.getByLabelText(/answer for build an api/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /submit build an api/i })).toHaveTextContent(
      "Resubmit",
    );
  });

  it("shows a stored https link as an external link and hides an unsafe one", async () => {
    vi.spyOn(api, "getMyAssignments").mockResolvedValue([
      {
        ...base,
        latestStatus: "SUBMITTED",
        submissions: [
          attempt({ id: "s1", submissionUrl: "https://github.com/example/repo" }),
          attempt({ id: "s2", attemptNumber: 2, submissionUrl: "javascript:alert(1)" }),
        ],
      },
    ] as never);

    render(<AssignmentsPanel />);

    const link = await screen.findByRole("link");
    expect(link).toHaveAttribute("href", "https://github.com/example/repo");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link.getAttribute("rel")).toContain("noopener");
    expect(screen.getAllByRole("link")).toHaveLength(1);
  });

  it("shows the server message when loading fails", async () => {
    vi.spyOn(api, "getMyAssignments").mockRejectedValue({
      isAxiosError: true,
      response: { data: { message: "Invalid or expired session." } },
    });

    render(<AssignmentsPanel />);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Invalid or expired session.",
    );
  });
});
