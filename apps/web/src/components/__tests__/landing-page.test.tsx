import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import Home from "../../../app/page";

afterEach(() => {
  cleanup();
});

describe("landing page", () => {
  it("uses the blueprint's subheading", () => {
    render(<Home />);

    expect(
      screen.getByText(
        "Learn in-demand skills. Build real projects. Prepare for interviews. Access structured placement support.",
      ),
    ).toBeInTheDocument();
  });

  it("answers the refund question without inventing a policy", () => {
    render(<Home />);

    expect(screen.getByText("What are the refund terms?")).toBeInTheDocument();
    expect(
      screen.getByText(/refund terms are shared in writing before you pay/i),
    ).toBeInTheDocument();
  });

  it("keeps the placement disclaimer and the no-guarantee answer", () => {
    render(<Home />);

    expect(screen.getByText("Placement support disclaimer")).toBeInTheDocument();
    expect(
      screen.getByText("Does placement support guarantee a job?"),
    ).toBeInTheDocument();
  });
});
