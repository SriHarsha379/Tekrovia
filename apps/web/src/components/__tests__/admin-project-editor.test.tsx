import { afterEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import AdminProjectEditor, { type AdminProject } from "../AdminProjectEditor";
import { adminApi } from "../../lib/admin-api";

afterEach(() => {
  cleanup();
});

const existing: AdminProject = {
  id: "proj-1",
  title: "Build an API",
  businessProblem: "A shop needs an API.",
  expectedOutcome: "A working service.",
  resources: null,
  isRequired: true,
  milestones: [
    { id: "m0", title: "Design", description: null, dueOffsetDays: 7 },
    { id: "m1", title: "Ship", description: "Final delivery", dueOffsetDays: null },
  ],
};

function open(projects: AdminProject[] = [existing]) {
  render(<AdminProjectEditor courseId="course-1" projects={projects} />);
  fireEvent.click(screen.getByRole("button", { name: /^projects \(/i }));
}

describe("AdminProjectEditor", () => {
  it("is collapsed until opened, then lists the projects", () => {
    render(<AdminProjectEditor courseId="course-1" projects={[existing]} />);

    expect(screen.queryByText("Build an API")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /projects \(1\)/i }));
    expect(screen.getByText("Build an API")).toBeInTheDocument();
    expect(screen.getByText(/2 milestones/)).toBeInTheDocument();
  });

  it("starts a new project with one milestone and marks the last as final", () => {
    open([]);
    fireEvent.click(screen.getByRole("button", { name: /add project/i }));

    expect(screen.getByLabelText(/milestone 1 title/i)).toBeInTheDocument();
    expect(screen.getByText(/milestone 1 \(final\)/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /add milestone/i }));
    expect(screen.getByText(/milestone 2 \(final\)/i)).toBeInTheDocument();
    expect(screen.queryByText(/milestone 1 \(final\)/i)).not.toBeInTheDocument();
  });

  it("limits a project to five milestones and at least one", () => {
    open([]);
    fireEvent.click(screen.getByRole("button", { name: /add project/i }));

    expect(screen.getByRole("button", { name: /remove milestone 1/i })).toBeDisabled();
    for (let index = 0; index < 4; index += 1) {
      fireEvent.click(screen.getByRole("button", { name: /add milestone/i }));
    }
    expect(screen.getByRole("button", { name: /add milestone/i })).toBeDisabled();
    expect(screen.getByLabelText(/milestone 5 title/i)).toBeInTheDocument();
  });

  it("prefills an existing project for editing", () => {
    open();
    fireEvent.click(screen.getByRole("button", { name: /edit project build an api/i }));

    expect(screen.getByLabelText(/project title/i)).toHaveValue("Build an API");
    expect(screen.getByLabelText(/milestone 1 title/i)).toHaveValue("Design");
    expect(screen.getByLabelText(/milestone 1 due days/i)).toHaveValue("7");
    expect(screen.getByLabelText(/milestone 2 description/i)).toHaveValue("Final delivery");
  });

  it("saves an edited project through the project endpoint, including its id", async () => {
    const put = vi.spyOn(adminApi, "put").mockResolvedValue({
      data: { ...existing, title: "Build a better API" },
    } as never);

    open();
    fireEvent.click(screen.getByRole("button", { name: /edit project build an api/i }));
    fireEvent.change(screen.getByLabelText(/project title/i), {
      target: { value: "  Build a better API  " },
    });
    fireEvent.click(screen.getByRole("button", { name: /save project/i }));

    await waitFor(() => expect(put).toHaveBeenCalledTimes(1));
    expect(put).toHaveBeenCalledWith("/projects/courses/course-1", {
      id: "proj-1",
      title: "Build a better API",
      businessProblem: "A shop needs an API.",
      expectedOutcome: "A working service.",
      resources: null,
      isRequired: true,
      milestones: [
        { title: "Design", description: null, dueOffsetDays: 7 },
        { title: "Ship", description: "Final delivery", dueOffsetDays: null },
      ],
    });
    expect(await screen.findByText(/project saved/i)).toBeInTheDocument();
    expect(screen.getByText("Build a better API")).toBeInTheDocument();
  });

  it("creates a new project without an id and adds it to the list", async () => {
    const put = vi.spyOn(adminApi, "put").mockResolvedValue({
      data: {
        id: "proj-9",
        title: "New project",
        businessProblem: "Problem",
        expectedOutcome: "Outcome",
        resources: null,
        isRequired: true,
        milestones: [{ id: "m", title: "Only", description: null, dueOffsetDays: null }],
      },
    } as never);

    open([]);
    fireEvent.click(screen.getByRole("button", { name: /add project/i }));
    fireEvent.change(screen.getByLabelText(/project title/i), { target: { value: "New project" } });
    fireEvent.change(screen.getByLabelText(/business problem/i), { target: { value: "Problem" } });
    fireEvent.change(screen.getByLabelText(/expected outcome/i), { target: { value: "Outcome" } });
    fireEvent.change(screen.getByLabelText(/milestone 1 title/i), { target: { value: "Only" } });
    fireEvent.click(screen.getByRole("button", { name: /save project/i }));

    await waitFor(() => expect(put).toHaveBeenCalledTimes(1));
    expect(put.mock.calls[0][1]).not.toHaveProperty("id");
    expect(await screen.findByText("New project")).toBeInTheDocument();
  });

  it.each([
    ["missing title", () => {}, /title, business problem and expected outcome are required/i],
  ])("rejects %s before calling the API", async (_label, _setup, message) => {
    const put = vi.spyOn(adminApi, "put");

    open([]);
    fireEvent.click(screen.getByRole("button", { name: /add project/i }));
    fireEvent.click(screen.getByRole("button", { name: /save project/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(message);
    expect(put).not.toHaveBeenCalled();
  });

  it("rejects a milestone without a title", async () => {
    const put = vi.spyOn(adminApi, "put");

    open([]);
    fireEvent.click(screen.getByRole("button", { name: /add project/i }));
    fireEvent.change(screen.getByLabelText(/project title/i), { target: { value: "T" } });
    fireEvent.change(screen.getByLabelText(/business problem/i), { target: { value: "P" } });
    fireEvent.change(screen.getByLabelText(/expected outcome/i), { target: { value: "O" } });
    fireEvent.click(screen.getByRole("button", { name: /save project/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/milestone 1 needs a title/i);
    expect(put).not.toHaveBeenCalled();
  });

  it.each(["0", "1.5", "abc", "731"])(
    "rejects an invalid due-days value %s",
    async (value) => {
      const put = vi.spyOn(adminApi, "put");

      open([]);
      fireEvent.click(screen.getByRole("button", { name: /add project/i }));
      fireEvent.change(screen.getByLabelText(/project title/i), { target: { value: "T" } });
      fireEvent.change(screen.getByLabelText(/business problem/i), { target: { value: "P" } });
      fireEvent.change(screen.getByLabelText(/expected outcome/i), { target: { value: "O" } });
      fireEvent.change(screen.getByLabelText(/milestone 1 title/i), { target: { value: "M" } });
      fireEvent.change(screen.getByLabelText(/milestone 1 due days/i), { target: { value } });
      fireEvent.click(screen.getByRole("button", { name: /save project/i }));

      expect(await screen.findByRole("alert")).toHaveTextContent(/whole number from 1 to 730/i);
      expect(put).not.toHaveBeenCalled();
    },
  );

  it("shows the server message when saving fails", async () => {
    vi.spyOn(adminApi, "put").mockRejectedValue({
      isAxiosError: true,
      response: {
        data: {
          message: "Milestones cannot be added or removed after learners have submitted work.",
        },
      },
    });

    open();
    fireEvent.click(screen.getByRole("button", { name: /edit project build an api/i }));
    fireEvent.click(screen.getByRole("button", { name: /save project/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/cannot be added or removed/i);
    expect(screen.getByLabelText(/project title/i)).toBeInTheDocument();
  });
});
