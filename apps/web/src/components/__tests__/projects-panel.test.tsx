import { afterEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import ProjectsPanel from "../ProjectsPanel";
import { api } from "../../lib/api-client";

afterEach(() => {
  cleanup();
});

const attempt = (overrides: Record<string, unknown> = {}) => ({
  id: "s1",
  attemptNumber: 1,
  submissionText: "My work",
  submissionUrl: null,
  status: "SUBMITTED",
  feedback: null,
  vivaNotes: null,
  reviewedAt: null,
  submittedAt: "2026-10-05T05:00:00.000Z",
  ...overrides,
});

const milestone = (overrides: Record<string, unknown> = {}) => ({
  id: "m1",
  title: "Design",
  description: null,
  dueOffsetDays: null,
  isFinal: false,
  submissions: [] as unknown[],
  latestStatus: null as string | null,
  unlocked: true,
  ...overrides,
});

const project = (overrides: Record<string, unknown> = {}) => ({
  id: "p1",
  title: "Build an API",
  businessProblem: "A shop needs an API.",
  expectedOutcome: "A working service.",
  resources: null as string | null,
  isRequired: true,
  course: { id: "c1", title: "Python Basics" },
  milestones: [milestone(), milestone({ id: "m2", title: "Ship", isFinal: true, unlocked: false })],
  approved: false,
  ...overrides,
});

describe("ProjectsPanel", () => {
  it("renders nothing when the learner has no projects", async () => {
    const get = vi.spyOn(api, "getMyProjects").mockResolvedValue([] as never);

    const { container } = render(<ProjectsPanel />);

    await waitFor(() => expect(get).toHaveBeenCalled());
    await waitFor(() => expect(container).toBeEmptyDOMElement());
  });

  it("shows the brief, the milestones, and locks the later ones", async () => {
    vi.spyOn(api, "getMyProjects").mockResolvedValue([
      project({ resources: "Starter repo notes" }),
    ] as never);

    render(<ProjectsPanel />);

    expect(await screen.findByText("Build an API")).toBeInTheDocument();
    expect(screen.getByText(/Python Basics/)).toBeInTheDocument();
    expect(screen.getByText("A shop needs an API.")).toBeInTheDocument();
    expect(screen.getByText("A working service.")).toBeInTheDocument();
    expect(screen.getByText("Starter repo notes")).toBeInTheDocument();
    expect(screen.getByText(/1\. Design/)).toBeInTheDocument();
    expect(screen.getByText(/2\. Ship \(final\)/)).toBeInTheDocument();
    expect(screen.getByText("Locked")).toBeInTheDocument();
    expect(screen.getByText(/final milestone is approved by an administrator/i)).toBeInTheDocument();
  });

  it("offers a submit form only for the unlocked milestone", async () => {
    vi.spyOn(api, "getMyProjects").mockResolvedValue([project()] as never);

    render(<ProjectsPanel />);

    expect(await screen.findByLabelText(/work for design/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/work for ship/i)).not.toBeInTheDocument();
  });

  it("shows the due date when a milestone has one", async () => {
    vi.spyOn(api, "getMyProjects").mockResolvedValue([
      project({ milestones: [milestone({ dueOffsetDays: 14 })] }),
    ] as never);

    render(<ProjectsPanel />);

    expect(await screen.findByText(/due 14 days after enrollment/i)).toBeInTheDocument();
  });

  it("shows text as plain text, never as HTML", async () => {
    vi.spyOn(api, "getMyProjects").mockResolvedValue([
      project({ businessProblem: "Use <b>bold</b> carefully" }),
    ] as never);

    const { container } = render(<ProjectsPanel />);

    expect(await screen.findByText(/<b>bold<\/b>/)).toBeInTheDocument();
    expect(container.querySelector("b")).toBeNull();
  });

  it("submits trimmed work for the milestone and reloads", async () => {
    const get = vi.spyOn(api, "getMyProjects").mockResolvedValue([project()] as never);
    const submit = vi.spyOn(api, "submitMilestone").mockResolvedValue({} as never);

    render(<ProjectsPanel />);
    fireEvent.change(await screen.findByLabelText(/work for design/i), {
      target: { value: "  My design  " },
    });
    fireEvent.change(screen.getByLabelText(/link for design/i), {
      target: { value: " https://github.com/example/repo " },
    });
    fireEvent.click(screen.getByRole("button", { name: /submit design/i }));

    await waitFor(() => expect(submit).toHaveBeenCalledTimes(1));
    expect(submit).toHaveBeenCalledWith("m1", {
      submissionText: "My design",
      submissionUrl: "https://github.com/example/repo",
    });
    expect(await screen.findByText(/submitted for review/i)).toBeInTheDocument();
    await waitFor(() => expect(get).toHaveBeenCalledTimes(2));
  });

  it("requires work or a link before calling the API", async () => {
    vi.spyOn(api, "getMyProjects").mockResolvedValue([project()] as never);
    const submit = vi.spyOn(api, "submitMilestone");

    render(<ProjectsPanel />);
    fireEvent.click(await screen.findByRole("button", { name: /submit design/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/enter your work/i);
    expect(submit).not.toHaveBeenCalled();
  });

  it("rejects a non-https link before calling the API", async () => {
    vi.spyOn(api, "getMyProjects").mockResolvedValue([project()] as never);
    const submit = vi.spyOn(api, "submitMilestone");

    render(<ProjectsPanel />);
    fireEvent.change(await screen.findByLabelText(/link for design/i), {
      target: { value: "http://example.test/work" },
    });
    fireEvent.click(screen.getByRole("button", { name: /submit design/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/https/i);
    expect(submit).not.toHaveBeenCalled();
  });

  it("shows the server message when submitting fails", async () => {
    vi.spyOn(api, "getMyProjects").mockResolvedValue([project()] as never);
    vi.spyOn(api, "submitMilestone").mockRejectedValue({
      isAxiosError: true,
      response: { data: { message: "Earlier milestones must be approved before you can submit this one." } },
    });

    render(<ProjectsPanel />);
    fireEvent.change(await screen.findByLabelText(/work for design/i), {
      target: { value: "Work" },
    });
    fireEvent.click(screen.getByRole("button", { name: /submit design/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/earlier milestones must be approved/i);
  });

  it("hides the form while a milestone awaits review", async () => {
    vi.spyOn(api, "getMyProjects").mockResolvedValue([
      project({
        milestones: [
          milestone({ latestStatus: "SUBMITTED", submissions: [attempt()] }),
        ],
      }),
    ] as never);

    render(<ProjectsPanel />);

    await screen.findByText("Build an API");
    expect(screen.getAllByText(/awaiting review/i).length).toBeGreaterThan(0);
    expect(screen.getByText("My work")).toBeInTheDocument();
    expect(screen.queryByLabelText(/work for design/i)).not.toBeInTheDocument();
  });

  it("shows feedback and viva notes and offers a resubmit after changes were requested", async () => {
    vi.spyOn(api, "getMyProjects").mockResolvedValue([
      project({
        milestones: [
          milestone({
            latestStatus: "CHANGES_REQUESTED",
            submissions: [
              attempt({ status: "CHANGES_REQUESTED", feedback: "Add tests", vivaNotes: "Needs a clearer plan" }),
            ],
          }),
        ],
      }),
    ] as never);

    render(<ProjectsPanel />);

    expect(await screen.findByText("Add tests")).toBeInTheDocument();
    expect(screen.getByText("Needs a clearer plan")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /submit design/i })).toHaveTextContent("Resubmit");
  });

  it("shows an approved milestone without a form, and unlocks the next one", async () => {
    vi.spyOn(api, "getMyProjects").mockResolvedValue([
      project({
        milestones: [
          milestone({ latestStatus: "APPROVED", submissions: [attempt({ status: "APPROVED" })] }),
          milestone({ id: "m2", title: "Ship", isFinal: true, unlocked: true }),
        ],
      }),
    ] as never);

    render(<ProjectsPanel />);

    await screen.findByText("Build an API");
    expect(screen.queryByLabelText(/work for design/i)).not.toBeInTheDocument();
    expect(screen.getByLabelText(/work for ship/i)).toBeInTheDocument();
  });

  it("shows the portfolio tip only for an approved project, without promising a job", async () => {
    vi.spyOn(api, "getMyProjects").mockResolvedValueOnce([project()] as never);

    const first = render(<ProjectsPanel />);
    await screen.findByText("Build an API");
    expect(screen.queryByText(/portfolio tip/i)).not.toBeInTheDocument();
    first.unmount();

    vi.spyOn(api, "getMyProjects").mockResolvedValueOnce([
      project({ approved: true }),
    ] as never);

    render(<ProjectsPanel />);
    const tip = await screen.findByText(/portfolio tip/i);
    expect(tip).toHaveTextContent(/does not guarantee a job/i);
    expect(screen.getByText("Project approved")).toBeInTheDocument();
  });

  it("shows a stored https link as an external link and hides an unsafe one", async () => {
    vi.spyOn(api, "getMyProjects").mockResolvedValue([
      project({
        milestones: [
          milestone({
            latestStatus: "SUBMITTED",
            submissions: [
              attempt({ id: "s1", submissionUrl: "https://github.com/example/repo" }),
              attempt({ id: "s2", attemptNumber: 2, submissionUrl: "javascript:alert(1)" }),
            ],
          }),
        ],
      }),
    ] as never);

    render(<ProjectsPanel />);

    const link = await screen.findByRole("link");
    expect(link).toHaveAttribute("href", "https://github.com/example/repo");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link.getAttribute("rel")).toContain("noopener");
    expect(screen.getAllByRole("link")).toHaveLength(1);
  });

  it("shows the server message when loading fails", async () => {
    vi.spyOn(api, "getMyProjects").mockRejectedValue({
      isAxiosError: true,
      response: { data: { message: "Invalid or expired session." } },
    });

    render(<ProjectsPanel />);

    expect(await screen.findByRole("alert")).toHaveTextContent("Invalid or expired session.");
  });
});
