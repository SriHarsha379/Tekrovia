import { afterEach, describe, expect, it } from "vitest";
import {
  UTM_MAX_LENGTH,
  UTM_STORAGE_KEY,
  captureUtm,
  parseUtm,
  readStoredUtm,
} from "../utm";

function memoryStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => {
      data.set(key, value);
    },
    data,
  };
}

const blockedStorage = {
  getItem: () => {
    throw new Error("blocked");
  },
  setItem: () => {
    throw new Error("blocked");
  },
};

afterEach(() => {
  window.sessionStorage.clear();
});

describe("parseUtm", () => {
  it("reads the five campaign parameters", () => {
    expect(
      parseUtm(
        "?utm_source=meta&utm_medium=cpc&utm_campaign=launch&utm_content=ad-1&utm_term=python+course",
      ),
    ).toEqual({
      utmSource: "meta",
      utmMedium: "cpc",
      utmCampaign: "launch",
      utmContent: "ad-1",
      utmTerm: "python course",
    });
  });

  it("ignores every other parameter", () => {
    expect(parseUtm("?ref=friend&utm_source=meta&gclid=abc")).toEqual({
      utmSource: "meta",
    });
  });

  it("returns nothing when there are no campaign parameters", () => {
    expect(parseUtm("")).toEqual({});
    expect(parseUtm("?page=2")).toEqual({});
  });

  it("drops blank values", () => {
    expect(parseUtm("?utm_source=&utm_medium=%20%20&utm_campaign=launch")).toEqual({
      utmCampaign: "launch",
    });
  });

  it("strips control characters and trims", () => {
    expect(parseUtm("?utm_source=%0Ameta%0D%09")).toEqual({ utmSource: "meta" });
  });

  it("caps each value at the maximum length", () => {
    const result = parseUtm(`?utm_source=${"x".repeat(UTM_MAX_LENGTH + 50)}`);
    expect(result.utmSource).toHaveLength(UTM_MAX_LENGTH);
  });
});

describe("captureUtm", () => {
  it("stores the campaign parameters", () => {
    const storage = memoryStorage();

    captureUtm("?utm_source=meta&utm_campaign=launch", storage);

    expect(JSON.parse(storage.data.get(UTM_STORAGE_KEY) as string)).toEqual({
      utmSource: "meta",
      utmCampaign: "launch",
    });
  });

  it("stores nothing for a visit without campaign parameters", () => {
    const storage = memoryStorage();

    captureUtm("?page=2", storage);

    expect(storage.data.size).toBe(0);
  });

  it("keeps the first touch and ignores later campaigns", () => {
    const storage = memoryStorage();

    captureUtm("?utm_source=meta", storage);
    captureUtm("?utm_source=google&utm_campaign=other", storage);

    expect(JSON.parse(storage.data.get(UTM_STORAGE_KEY) as string)).toEqual({
      utmSource: "meta",
    });
  });

  it("does not throw when storage is blocked", () => {
    expect(() => captureUtm("?utm_source=meta", blockedStorage)).not.toThrow();
  });
});

describe("readStoredUtm", () => {
  it("returns nothing when nothing was stored", () => {
    expect(readStoredUtm(memoryStorage())).toEqual({});
  });

  it("round-trips captured values", () => {
    const storage = memoryStorage();
    captureUtm("?utm_source=meta&utm_term=python", storage);

    expect(readStoredUtm(storage)).toEqual({ utmSource: "meta", utmTerm: "python" });
  });

  it("ignores corrupted or unexpected stored data", () => {
    expect(readStoredUtm(memoryStorage({ [UTM_STORAGE_KEY]: "{not json" }))).toEqual({});
    expect(readStoredUtm(memoryStorage({ [UTM_STORAGE_KEY]: "[]" }))).toEqual({});
    expect(readStoredUtm(memoryStorage({ [UTM_STORAGE_KEY]: "42" }))).toEqual({});
  });

  it("drops unknown fields and non-string values", () => {
    const storage = memoryStorage({
      [UTM_STORAGE_KEY]: JSON.stringify({
        utmSource: "meta",
        utmMedium: 7,
        role: "ADMIN",
        candidateId: "x",
      }),
    });

    expect(readStoredUtm(storage)).toEqual({ utmSource: "meta" });
  });

  it("re-applies the length cap to stored values", () => {
    const storage = memoryStorage({
      [UTM_STORAGE_KEY]: JSON.stringify({ utmSource: "x".repeat(500) }),
    });

    expect(readStoredUtm(storage).utmSource).toHaveLength(UTM_MAX_LENGTH);
  });

  it("reads from the browser session by default", () => {
    window.sessionStorage.setItem(
      UTM_STORAGE_KEY,
      JSON.stringify({ utmCampaign: "launch" }),
    );

    expect(readStoredUtm()).toEqual({ utmCampaign: "launch" });
  });

  it("does not throw when storage is blocked", () => {
    expect(readStoredUtm(blockedStorage)).toEqual({});
  });
});
