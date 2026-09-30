import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import CareerReadinessCard from "../CareerReadinessCard";
import InteractiveAssessmentCard from "../InteractiveAssessmentCard";
import { api } from "../../lib/api-client";

vi.mock("../../../lib/api-client", () => ({
  api: {
    createCareerReadinessAssessment: vi.fn(),
    startInteractiveAssessment: vi.fn(),
    submitInteractiveAssessment: vi.fn(),
  },
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("CareerReadinessCard completion callback", () => {
  it("calls and awaits onCompleted after successful assessment generation", async () => {
    const onCompleted = vi.fn().mockResolvedValue(undefined);

    vi.spyOn(api, "createCareerReadinessAssessment").mockResolvedValue({
      id: "career-1",
      candidateId: "candidate-1",
      score: 81,
      maxScore: 100,
      classification: "PRO",
      status: "COMPLETED",
      responses: { factors: { skills: 18 } },
      roadmap: ["Build a portfolio project"],
    } as never);

    render(
      <CareerReadinessCard assessmentCount={0} onCompleted={onCompleted} />,
    );

    fireEvent.click(screen.getByRole("button", { name: /start assessment/i }));

    expect(await screen.findByText(/assessment has been generated/i)).toBeInTheDocument();
    expect(await screen.findByText("81")).toBeInTheDocument();

    await waitFor(() => {
      expect(onCompleted).toHaveBeenCalledTimes(1);
    });
  });

  it("does not call onCompleted when assessment generation fails", async () => {
    const onCompleted = vi.fn().mockResolvedValue(undefined);

    vi.spyOn(api, "createCareerReadinessAssessment").mockRejectedValue(
      new Error("Assessment service unavailable"),
    );

    render(
      <CareerReadinessCard assessmentCount={0} onCompleted={onCompleted} />,
    );

    fireEvent.click(screen.getByRole("button", { name: /start assessment/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /something went wrong/i,
    );
    expect(onCompleted).not.toHaveBeenCalled();
  });

  it("waits for the completion callback before leaving the generating state", async () => {
    let resolveRefresh!: () => void;
    const refreshPromise = new Promise<void>((resolve) => {
      resolveRefresh = resolve;
    });
    const onCompleted = vi.fn(() => refreshPromise);

    vi.spyOn(api, "createCareerReadinessAssessment").mockResolvedValue({
      id: "career-2",
      candidateId: "candidate-1",
      score: 65,
      maxScore: 100,
      classification: "STARTER",
      status: "COMPLETED",
    } as never);

    render(
      <CareerReadinessCard assessmentCount={0} onCompleted={onCompleted} />,
    );

    fireEvent.click(screen.getByRole("button", { name: /start assessment/i }));

    await waitFor(() => {
      expect(onCompleted).toHaveBeenCalledTimes(1);
    });
    expect(
      screen.getByRole("button", { name: /generating/i }),
    ).toBeDisabled();

    resolveRefresh();

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /start assessment/i }),
      ).toBeEnabled();
    });
  });
});

describe("InteractiveAssessmentCard completion callback", () => {
  const oneQuestionAssessment = {
    assessment: {
      id: "technical-1",
      candidateId: "candidate-1",
      status: "IN_PROGRESS",
      startedAt: "2026-09-30T10:00:00.000Z",
    },
    totalQuestions: 1,
    questions: [
      {
        id: "question-1",
        category: "Python",
        prompt: "Which keyword defines a function in Python?",
        options: ["func", "def", "function", "method"],
      },
    ],
  };

  it("calls onCompleted after a successful quiz submission", async () => {
    const onCompleted = vi.fn().mockResolvedValue(undefined);

    vi.spyOn(api, "startInteractiveAssessment").mockResolvedValue(
      oneQuestionAssessment as never,
    );
    vi.spyOn(api, "submitInteractiveAssessment").mockResolvedValue({
      id: "technical-1",
      title: "Interactive Career Skills Assessment",
      score: 100,
      maxScore: 100,
      classification: "PRO",
      status: "COMPLETED",
      responses: { correctCount: 1, totalQuestions: 1 },
      roadmap: null,
      completedAt: "2026-09-30T10:05:00.000Z",
      createdAt: "2026-09-30T10:00:00.000Z",
    } as never);

    render(<InteractiveAssessmentCard onCompleted={onCompleted} />);

    fireEvent.click(screen.getByRole("button", { name: /start quiz/i }));

    expect(
      await screen.findByText(/which keyword defines a function/i),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("radio", { name: /def/i }));
    fireEvent.click(screen.getByRole("button", { name: /submit/i }));

    await waitFor(() => {
      expect(api.submitInteractiveAssessment).toHaveBeenCalledWith(
        "technical-1",
        [{ questionId: "question-1", answerIndex: 1 }],
      );
      expect(onCompleted).toHaveBeenCalledTimes(1);
    });
  });

  it("does not call onCompleted when quiz submission fails", async () => {
    const onCompleted = vi.fn().mockResolvedValue(undefined);

    vi.spyOn(api, "startInteractiveAssessment").mockResolvedValue(
      oneQuestionAssessment as never,
    );
    vi.spyOn(api, "submitInteractiveAssessment").mockRejectedValue(
      new Error("Submission failed"),
    );

    render(<InteractiveAssessmentCard onCompleted={onCompleted} />);

    fireEvent.click(screen.getByRole("button", { name: /start quiz/i }));

    expect(
      await screen.findByText(/which keyword defines a function/i),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("radio", { name: /def/i }));
    fireEvent.click(screen.getByRole("button", { name: /submit/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /something went wrong/i,
    );
    expect(onCompleted).not.toHaveBeenCalled();
  });
});
