import { afterEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import AdminLessonEditor, { type AdminModule } from "../AdminLessonEditor";
import { adminApi } from "../../lib/admin-api";

afterEach(() => {
  cleanup();
});

const modules: AdminModule[] = [
  {
    id: "mod-1",
    title: "Module One",
    lessons: [
      { id: "les-1", title: "Intro", duration: "10 min", description: null, content: "Old notes", videoUrl: null },
      { id: "les-2", title: "Variables", duration: null, description: null, content: null, videoUrl: null },
    ],
  },
];

function openEditor(lessonTitle: string) {
  fireEvent.click(screen.getByRole("button", { name: /edit lesson content/i }));
  fireEvent.click(screen.getByRole("button", { name: `Edit lesson ${lessonTitle}` }));
}

describe("AdminLessonEditor", () => {
  it("renders nothing for a course without lessons", () => {
    const { container } = render(<AdminLessonEditor modules={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("stays collapsed until opened, then lists lessons with their status", () => {
    render(<AdminLessonEditor modules={modules} />);

    expect(screen.queryByText("Variables")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /edit lesson content \(2 lessons\)/i }));

    expect(screen.getByText("Module One")).toBeInTheDocument();
    expect(screen.getByText("Intro")).toBeInTheDocument();
    expect(screen.getByText(/notes added/i)).toBeInTheDocument();
    expect(screen.getByText(/no notes/i)).toBeInTheDocument();
  });

  it("prefills the form from the lesson", () => {
    render(<AdminLessonEditor modules={modules} />);
    openEditor("Intro");

    expect(screen.getByLabelText(/lesson title/i)).toHaveValue("Intro");
    expect(screen.getByLabelText(/duration/i)).toHaveValue("10 min");
    expect(screen.getByLabelText(/lesson notes/i)).toHaveValue("Old notes");
    expect(screen.getByLabelText(/video link/i)).toHaveValue("");
  });

  it("saves through the lesson endpoint, sending blank fields as null", async () => {
    const patch = vi.spyOn(adminApi, "patch").mockResolvedValue({
      data: {
        id: "les-1",
        title: "Intro",
        duration: "10 min",
        description: null,
        content: "New notes",
        videoUrl: "https://video.example.test/1",
      },
    } as never);
    const onSaved = vi.fn();

    render(<AdminLessonEditor modules={modules} onSaved={onSaved} />);
    openEditor("Intro");

    fireEvent.change(screen.getByLabelText(/lesson notes/i), {
      target: { value: "New notes" },
    });
    fireEvent.change(screen.getByLabelText(/video link/i), {
      target: { value: "https://video.example.test/1" },
    });
    fireEvent.click(screen.getByRole("button", { name: /save lesson/i }));

    await waitFor(() => expect(patch).toHaveBeenCalledTimes(1));
    expect(patch).toHaveBeenCalledWith("/courses/admin/lessons/les-1", {
      title: "Intro",
      duration: "10 min",
      description: null,
      content: "New notes",
      videoUrl: "https://video.example.test/1",
    });
    expect(await screen.findByText(/lesson saved/i)).toBeInTheDocument();
    expect(onSaved).toHaveBeenCalledTimes(1);
    expect(screen.getByText(/video linked/i)).toBeInTheDocument();
  });

  it("rejects a non-https video link before calling the API", async () => {
    const patch = vi.spyOn(adminApi, "patch");

    render(<AdminLessonEditor modules={modules} />);
    openEditor("Intro");
    fireEvent.change(screen.getByLabelText(/video link/i), {
      target: { value: "http://video.example.test/1" },
    });
    fireEvent.click(screen.getByRole("button", { name: /save lesson/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/https/i);
    expect(patch).not.toHaveBeenCalled();
  });

  it("rejects a blank title before calling the API", async () => {
    const patch = vi.spyOn(adminApi, "patch");

    render(<AdminLessonEditor modules={modules} />);
    openEditor("Intro");
    fireEvent.change(screen.getByLabelText(/lesson title/i), {
      target: { value: "   " },
    });
    fireEvent.click(screen.getByRole("button", { name: /save lesson/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/title is required/i);
    expect(patch).not.toHaveBeenCalled();
  });

  it("shows the server's error message when saving fails", async () => {
    vi.spyOn(adminApi, "patch").mockRejectedValue({
      isAxiosError: true,
      response: { data: { message: "Lesson not found." } },
    });

    render(<AdminLessonEditor modules={modules} />);
    openEditor("Variables");
    fireEvent.click(screen.getByRole("button", { name: /save lesson/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Lesson not found.");
    expect(screen.getByLabelText(/lesson title/i)).toBeInTheDocument();
  });
});
