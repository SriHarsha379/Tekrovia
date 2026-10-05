import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import RecoveryPanel, { type RecoveryInfo } from "../RecoveryPanel";

afterEach(() => {
  cleanup();
});

const failed = (round: number, overrides: Record<string, unknown> = {}) => ({
  id: `int-${round}`,
  companyName: `Company ${round}`,
  jobTitle: "Backend Developer",
  round,
  title: null as string | null,
  scheduledAt: "2026-09-01T10:00:00.000Z",
  feedback: `Reason ${round}` as string | null,
  ...overrides,
});

const info = (
  count: number,
  items = Array.from({ length: count }, (_v, i) => failed(i + 1)),
): RecoveryInfo => ({
  threshold: 4,
  failedInterviewCount: count,
  recoveryNeeded: count >= 4,
  failedInterviews: items,
});

describe("RecoveryPanel", () => {
  it("renders nothing when the API sent no recovery data", () => {
    const { container } = render(<RecoveryPanel />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows plain progress below the threshold, with no alert", () => {
    render(<RecoveryPanel recovery={info(2)} />);

    expect(screen.getByText("2 of 4 unsuccessful interviews.")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows zero without a list for a candidate with no failures", () => {
    render(<RecoveryPanel recovery={info(0)} />);

    expect(screen.getByText("0 of 4 unsuccessful interviews.")).toBeInTheDocument();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });

  it("raises an alert at four failures and states that nothing was paused", () => {
    render(<RecoveryPanel recovery={info(4)} />);

    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Recovery needed: 4 unsuccessful interviews");
    expect(alert).toHaveTextContent(/nothing has been paused automatically/i);
    expect(alert).toHaveTextContent(/skill-gap assessment/i);
  });

  it("lists every failed interview with its company, round and reason", () => {
    render(<RecoveryPanel recovery={info(4)} />);

    expect(screen.getAllByRole("listitem")).toHaveLength(4);
    expect(screen.getByText("Company 2 · Backend Developer")).toBeInTheDocument();
    expect(screen.getByText("Reason 2")).toBeInTheDocument();
    expect(screen.getByText(/Round 3/)).toBeInTheDocument();
  });

  it("shows the interview title when there is one", () => {
    render(
      <RecoveryPanel recovery={info(1, [failed(1, { title: "Technical round" })])} />,
    );

    expect(screen.getByText(/Round 1 \(Technical round\)/)).toBeInTheDocument();
  });

  it("does not invent a reason when none was recorded", () => {
    render(<RecoveryPanel recovery={info(1, [failed(1, { feedback: null })])} />);

    expect(screen.getByText("No reason recorded.")).toBeInTheDocument();
  });

  it("shows feedback as plain text, never as HTML", () => {
    const { container } = render(
      <RecoveryPanel
        recovery={info(1, [failed(1, { feedback: "Weak <b>design</b> answers" })])}
      />,
    );

    expect(screen.getByText(/<b>design<\/b>/)).toBeInTheDocument();
    expect(container.querySelector("b")).toBeNull();
  });
});
