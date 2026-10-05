import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import LearningHub from "../LearningHub";
import { api } from "../../lib/api-client";

afterEach(() => {
  cleanup();
});

const progress = [
  {
    enrollmentId: "enr-1",
    courseId: "course-1",
    courseTitle: "Python Basics",
    status: "ACTIVE",
    progressPercent: 0,
    completedLessons: 0,
    totalLessons: 2,
    modules: [
      {
        id: "mod-1",
        title: "Module One",
        lessons: [
          { id: "les-1", title: "Intro lesson", duration: "10 min", completed: false, content: "Welcome notes", videoUrl: "https://video.example.test/1" },
          { id: "les-2", title: "Bare lesson", duration: null, completed: false, content: null, videoUrl: null },
        ],
      },
    ],
  },
];

describe("LearningHub lesson content", () => {
  it("offers lesson details only for lessons that have content", async () => {
    vi.spyOn(api, "getCourses").mockResolvedValue([] as never);
    vi.spyOn(api, "getMyLearningProgress").mockResolvedValue(progress as never);
    vi.spyOn(api, "getMyAssignments").mockResolvedValue([] as never);

    render(<LearningHub />);

    expect(await screen.findByText("Intro lesson")).toBeInTheDocument();
    expect(screen.getByText("Bare lesson")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /view lesson/i })).toHaveLength(1);
    expect(screen.getAllByRole("button", { name: /mark complete/i })).toHaveLength(2);

    fireEvent.click(screen.getByRole("button", { name: /view lesson/i }));
    expect(screen.getByText("Welcome notes")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /watch video/i })).toHaveAttribute(
      "href",
      "https://video.example.test/1",
    );
  });
});
