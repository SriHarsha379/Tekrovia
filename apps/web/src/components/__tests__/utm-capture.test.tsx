import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render } from "@testing-library/react";
import UtmCapture from "../UtmCapture";
import { UTM_STORAGE_KEY, readStoredUtm } from "../../lib/utm";

afterEach(() => {
  cleanup();
  window.sessionStorage.clear();
  window.history.pushState({}, "", "/");
});

describe("UtmCapture", () => {
  it("renders nothing", () => {
    const { container } = render(<UtmCapture />);
    expect(container).toBeEmptyDOMElement();
  });

  it("remembers campaign parameters from the address", () => {
    window.history.pushState({}, "", "/?utm_source=meta&utm_campaign=launch");

    render(<UtmCapture />);

    expect(readStoredUtm()).toEqual({ utmSource: "meta", utmCampaign: "launch" });
  });

  it("stores nothing for an ordinary visit", () => {
    render(<UtmCapture />);

    expect(window.sessionStorage.getItem(UTM_STORAGE_KEY)).toBeNull();
  });

  it("keeps the first campaign when a later visit carries another", () => {
    window.history.pushState({}, "", "/?utm_source=meta");
    render(<UtmCapture />);
    cleanup();

    window.history.pushState({}, "", "/?utm_source=google");
    render(<UtmCapture />);

    expect(readStoredUtm()).toEqual({ utmSource: "meta" });
  });
});
