import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import ReadinessChecklist from "../ReadinessChecklist";
import { api } from "../../lib/api-client";

afterEach(() => {
  cleanup();
});

const readiness = (overrides: Record<string, unknown> = {}) => ({
  profileComplete: true,
  checks: {
    expertMocks: { complete: false, completedCount: 1, requiredCount: 3 },
    finalExpertMock: { complete: false, score: null, maxScore: null, requiredScore: 8 },
    expertApprovedProject: { complete: true, approvedCount: 2 },
    technicalAssessment: { complete: true, score: 9, maxScore: 10 },
  },
  allEvidenceComplete: false,
  decision: "PENDING",
  approvalRequiresHumanReview: true,
  ...overrides,
});

describe("ReadinessChecklist", () => {
  it("renders nothing for a learner without a profile", async () => {
    const get = vi.spyOn(api, "getMyReadiness").mockResolvedValue({ profileComplete: false } as never);

    const { container } = render(<ReadinessChecklist />);

    await vi.waitFor(() => expect(get).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });

  it("shows the four checks with their progress", async () => {
    vi.spyOn(api, "getMyReadiness").mockResolvedValue(readiness() as never);

    render(<ReadinessChecklist />);

    expect(await screen.findByText("Expert mock interviews")).toBeInTheDocument();
    expect(screen.getByText("1 of 3 completed")).toBeInTheDocument();
    expect(screen.getByText(/no score recorded yet/i)).toBeInTheDocument();
    expect(screen.getByText(/needs 8 out of 10 or more/)).toBeInTheDocument();
    expect(screen.getByText("2 approved")).toBeInTheDocument();
    expect(screen.getByText("9 out of 10")).toBeInTheDocument();
  });

  it("marks completed and pending items accessibly", async () => {
    vi.spyOn(api, "getMyReadiness").mockResolvedValue(readiness() as never);

    render(<ReadinessChecklist />);

    await screen.findByText("Expert mock interviews");
    expect(screen.getAllByLabelText("Complete")).toHaveLength(2);
    expect(screen.getAllByLabelText("Not yet complete")).toHaveLength(2);
  });

  it("states that it is a checklist and that nothing is guaranteed", async () => {
    vi.spyOn(api, "getMyReadiness").mockResolvedValue(readiness() as never);

    render(<ReadinessChecklist />);

    expect(await screen.findByText(/it is not an approval/i)).toBeInTheDocument();
    expect(screen.getByText(/does not guarantee an interview, a job offer or employment/i)).toBeInTheDocument();
    expect(screen.getByText(/final decision is always made by a person/i)).toBeInTheDocument();
  });

  it.each([
    ["PENDING", "Awaiting review"],
    ["APPROVED", "Approved by the placement team"],
    ["NEEDS_WORK", "The team has asked for more preparation"],
  ])("shows the human decision %s as '%s'", async (decision, label) => {
    vi.spyOn(api, "getMyReadiness").mockResolvedValue(readiness({ decision }) as never);

    render(<ReadinessChecklist />);

    expect(await screen.findByText(label)).toBeInTheDocument();
  });

  it("does not call a learner ready when every item is complete but nobody has approved", async () => {
    vi.spyOn(api, "getMyReadiness").mockResolvedValue(
      readiness({
        allEvidenceComplete: true,
        checks: {
          expertMocks: { complete: true, completedCount: 3, requiredCount: 3 },
          finalExpertMock: { complete: true, score: 9, maxScore: 10, requiredScore: 8 },
          expertApprovedProject: { complete: true, approvedCount: 1 },
          technicalAssessment: { complete: true, score: 9, maxScore: 10 },
        },
      }) as never,
    );

    render(<ReadinessChecklist />);

    await screen.findByText("Expert mock interviews");
    expect(screen.getByText("Awaiting review")).toBeInTheDocument();
    expect(screen.queryByText(/job ready|you are ready|qualified/i)).not.toBeInTheDocument();
  });

  it("shows the server message when loading fails", async () => {
    vi.spyOn(api, "getMyReadiness").mockRejectedValue({
      isAxiosError: true,
      response: { data: { message: "Invalid or expired session." } },
    });

    render(<ReadinessChecklist />);

    expect(await screen.findByRole("alert")).toHaveTextContent("Invalid or expired session.");
  });
});
