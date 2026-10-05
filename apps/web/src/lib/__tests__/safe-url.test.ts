import { describe, expect, it } from "vitest";
import { safeHttpsUrl } from "../safe-url";

describe("safeHttpsUrl", () => {
  it("returns a normalised https URL", () => {
    expect(safeHttpsUrl("https://video.example.test/watch?v=1")).toBe(
      "https://video.example.test/watch?v=1",
    );
    expect(safeHttpsUrl("  https://video.example.test/a  ")).toBe(
      "https://video.example.test/a",
    );
  });

  it.each([
    null,
    undefined,
    "",
    "   ",
    "not a url",
    "http://video.example.test/1",
    "javascript:alert(1)",
    "data:text/html,<script>1</script>",
    "ftp://files.example.test/1",
    "https://user:pass@video.example.test/1",
  ])("rejects %s", (value) => {
    expect(safeHttpsUrl(value)).toBeNull();
  });
});
