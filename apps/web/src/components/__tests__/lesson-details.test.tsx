import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import LessonDetails from "../LessonDetails";

afterEach(() => {
  cleanup();
});

const base = { id: "les-1", title: "Intro" };

describe("LessonDetails", () => {
  it("renders nothing when there are no notes and no usable video", () => {
    const { container } = render(
      <LessonDetails lesson={{ ...base, content: null, videoUrl: null }} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing when the only video link is unsafe", () => {
    const { container } = render(
      <LessonDetails
        lesson={{ ...base, content: "  ", videoUrl: "javascript:alert(1)" }}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("is collapsed until the learner opens it", () => {
    render(<LessonDetails lesson={{ ...base, content: "Welcome notes" }} />);

    expect(screen.queryByText("Welcome notes")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /view lesson/i }));
    expect(screen.getByText("Welcome notes")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /hide lesson/i }));
    expect(screen.queryByText("Welcome notes")).not.toBeInTheDocument();
  });

  it("shows notes as plain text and never as HTML", () => {
    const { container } = render(
      <LessonDetails
        lesson={{ ...base, content: "<b>bold</b><script>alert(1)</script>\nsecond line" }}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /view lesson/i }));

    expect(screen.getByText(/<b>bold<\/b>/)).toBeInTheDocument();
    expect(container.querySelector("b")).toBeNull();
    expect(container.querySelector("script")).toBeNull();
  });

  it("renders a safe https video as an external link", () => {
    render(
      <LessonDetails
        lesson={{ ...base, videoUrl: "https://video.example.test/lesson-1" }}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /view lesson/i }));

    const link = screen.getByRole("link", { name: /watch video/i });
    expect(link).toHaveAttribute("href", "https://video.example.test/lesson-1");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link.getAttribute("rel")).toContain("noopener");
    expect(link.getAttribute("rel")).toContain("noreferrer");
  });

  it.each(["http://video.example.test/1", "javascript:alert(1)"])(
    "does not render %s as a link even when notes exist",
    (videoUrl) => {
      render(<LessonDetails lesson={{ ...base, content: "Notes", videoUrl }} />);
      fireEvent.click(screen.getByRole("button", { name: /view lesson/i }));

      expect(screen.getByText("Notes")).toBeInTheDocument();
      expect(screen.queryByRole("link")).not.toBeInTheDocument();
    },
  );
});
