"use client";

import { useEffect } from "react";
import { captureUtm } from "../lib/utm";

export default function UtmCapture() {
  useEffect(() => {
    try {
      captureUtm(window.location.search, window.sessionStorage);
    } catch {
      // Storage unavailable: nothing to capture.
    }
  }, []);

  return null;
}
