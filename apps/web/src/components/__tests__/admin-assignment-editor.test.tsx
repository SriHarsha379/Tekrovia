import { afterEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import AdminAssignmentEditor from "../AdminAssignmentEditor";
import { adminApi } from "../../lib/admin-api";

afterEach(() => {
  cleanup();
});

const existing = {
  id: "asg-1",
  title: "Build an API",
  instructions: "Follow the brief.",
  isRequired: false,
};

describe("AdminAssignmentEditor", () => {
  it("offers to add an assignment, and keeps the form hidden until opened", () => {
    render(<AdminAssignmentEditor lessonId="les-1" assignment={null} />);

    expect(screen.queryByLabelText(/assignment title/i)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /add assignment/i }));
    expect(screen.getByLabelText(/assignment title/i)).toHaveValue("");
    expect(screen.getByLabelText(/required for course completion/i)).toBeChecked();
  });

  it("prefills an existing assignment", () => {
    render(<AdminAssignmentEditor lessonId="les-1" assignment={existing} />);

    fireEvent.click(screen.getByRole("button", { name: /assignment: build an api/i }));
    expect(screen.getByLabelText(/assignment title/i)).toHaveValue("Build an API");
    expect(screen.getByLabelText(/instructions/i)).toHaveValue("Follow the brief.");
    expect(screen.getByLabelText(/required for course completion/i)).not.toBeChecked();
  });

  it("saves through the assignment endpoint and updates the toggle label", async () => {
    const put = vi.spyOn(adminApi, "put").mockResolvedValue({
      data: {
        id: "asg-9",
        title: "Build",
        instructions: "Do it",
        isRequired: true,
      },
    } as never);

    render(<AdminAssignmentEditor lessonId="les-1" assignment={null} />);
    fireEvent.click(screen.getByRole("button", { name: /add assignment/i }));
    fireEvent.change(screen.getByLabelText(/assignment title/i), {
      target: { value: "  Build  " },
    });
    fireEvent.change(screen.getByLabelText(/instructions/i), {
      target: { value: "  Do it  " },
    });
    fireEvent.click(screen.getByRole("button", { name: /save assignment/i }));

    await waitFor(() => expect(put).toHaveBeenCalledTimes(1));
    expect(put).toHaveBeenCalledWith("/assignments/lessons/les-1", {
      title: "Build",
      instructions: "Do it",
      isRequired: true,
    });
    expect(await screen.findByText(/assignment saved/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /hide assignment/i }));
    expect(
      screen.getByRole("button", { name: /assignment: build/i }),
    ).toBeInTheDocument();
  });

  it("sends isRequired false when the box is unchecked", async () => {
    const put = vi.spyOn(adminApi, "put").mockResolvedValue({
      data: { id: "asg-1", title: "T", instructions: "I", isRequired: false },
    } as never);

    render(<AdminAssignmentEditor lessonId="les-1" assignment={null} />);
    fireEvent.click(screen.getByRole("button", { name: /add assignment/i }));
    fireEvent.change(screen.getByLabelText(/assignment title/i), {
      target: { value: "T" },
    });
    fireEvent.change(screen.getByLabelText(/instructions/i), {
      target: { value: "I" },
    });
    fireEvent.click(screen.getByLabelText(/required for course completion/i));
    fireEvent.click(screen.getByRole("button", { name: /save assignment/i }));

    await waitFor(() => expect(put).toHaveBeenCalledTimes(1));
    expect(put.mock.calls[0][1]).toMatchObject({ isRequired: false });
  });

  it("requires a title and instructions before calling the API", async () => {
    const put = vi.spyOn(adminApi, "put");

    render(<AdminAssignmentEditor lessonId="les-1" assignment={null} />);
    fireEvent.click(screen.getByRole("button", { name: /add assignment/i }));
    fireEvent.change(screen.getByLabelText(/assignment title/i), {
      target: { value: "Only a title" },
    });
    fireEvent.click(screen.getByRole("button", { name: /save assignment/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /title and instructions are required/i,
    );
    expect(put).not.toHaveBeenCalled();
  });

  it("shows the server message when saving fails", async () => {
    vi.spyOn(adminApi, "put").mockRejectedValue({
      isAxiosError: true,
      response: { data: { message: "Lesson not found." } },
    });

    render(<AdminAssignmentEditor lessonId="les-1" assignment={existing} />);
    fireEvent.click(screen.getByRole("button", { name: /assignment: build an api/i }));
    fireEvent.click(screen.getByRole("button", { name: /save assignment/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Lesson not found.");
  });
});
