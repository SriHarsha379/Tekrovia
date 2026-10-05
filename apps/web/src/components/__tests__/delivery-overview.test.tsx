import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import DeliveryOverview, { type DeliveryStats } from "../DeliveryOverview";

afterEach(() => {
  cleanup();
});

const stats: DeliveryStats = {
  activeLearners: 11,
  completedEnrollments: 22,
  completionRate: 33,
  assignmentsAwaitingReview: 44,
  projectSubmissionsAwaitingReview: 55,
  assignmentsApproved: 66,
  projectMilestonesApproved: 77,
};

describe("DeliveryOverview", () => {
  it("renders nothing when the API did not send delivery data", () => {
    const { container } = render(<DeliveryOverview />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows every delivery figure with its label", () => {
    render(<DeliveryOverview delivery={stats} />);

    const expected: Array<[string, string]> = [
      ["Active learners", "11"],
      ["Completed courses", "22"],
      ["Completion rate", "33%"],
      ["Assignments awaiting review", "44"],
      ["Project submissions awaiting review", "55"],
      ["Assignments approved", "66"],
      ["Project milestones approved", "77"],
    ];

    for (const [label, value] of expected) {
      const card = screen.getByText(label).closest("article");
      expect(card).not.toBeNull();
      expect(card).toHaveTextContent(value);
    }
  });

  it("shows a dash instead of a completion rate when nobody has enrolled", () => {
    render(<DeliveryOverview delivery={{ ...stats, completionRate: null }} />);

    const card = screen.getByText("Completion rate").closest("article");
    expect(card).toHaveTextContent("—");
    expect(card).not.toHaveTextContent("%");
  });

  it("formats large numbers for Indian readers", () => {
    render(<DeliveryOverview delivery={{ ...stats, activeLearners: 1234567 }} />);

    expect(screen.getByText("12,34,567")).toBeInTheDocument();
  });

  it("says plainly which PDF items are not tracked yet", () => {
    render(<DeliveryOverview delivery={stats} />);

    expect(
      screen.getByText(/not tracked yet: attendance, risk alerts and support tickets/i),
    ).toBeInTheDocument();
  });

  it("links to the review queue", () => {
    render(<DeliveryOverview delivery={stats} />);

    expect(screen.getByRole("link", { name: /open review queue/i })).toHaveAttribute(
      "href",
      "/review",
    );
  });
});
