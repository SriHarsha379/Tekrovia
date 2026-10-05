export const UTM_STORAGE_KEY = "tekrovia_utm";
export const UTM_MAX_LENGTH = 200;

const FIELDS = [
  ["utm_source", "utmSource"],
  ["utm_medium", "utmMedium"],
  ["utm_campaign", "utmCampaign"],
  ["utm_content", "utmContent"],
  ["utm_term", "utmTerm"],
] as const;

export type UtmField = (typeof FIELDS)[number][1];
export type UtmValues = Partial<Record<UtmField, string>>;

type ReadableStorage = Pick<Storage, "getItem">;
type WritableStorage = Pick<Storage, "getItem" | "setItem">;

function clean(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;

  const printable = Array.from(value)
    .filter((character) => {
      const code = character.charCodeAt(0);
      return code >= 32 && code !== 127;
    })
    .join("");

  const cleaned = printable.trim().slice(0, UTM_MAX_LENGTH);
  return cleaned || undefined;
}

export function parseUtm(search: string): UtmValues {
  const params = new URLSearchParams(search);
  const result: UtmValues = {};

  for (const [param, field] of FIELDS) {
    const value = clean(params.get(param));
    if (value) result[field] = value;
  }

  return result;
}

/** Remembers campaign parameters for the session. The first touch wins. */
export function captureUtm(search: string, storage: WritableStorage): void {
  try {
    const found = parseUtm(search);
    if (Object.keys(found).length === 0) return;
    if (storage.getItem(UTM_STORAGE_KEY)) return;
    storage.setItem(UTM_STORAGE_KEY, JSON.stringify(found));
  } catch {
    // Storage can be blocked (private mode); attribution is best effort.
  }
}

export function readStoredUtm(storage?: ReadableStorage): UtmValues {
  try {
    const source =
      storage ??
      (typeof window !== "undefined" ? window.sessionStorage : undefined);
    const raw = source?.getItem(UTM_STORAGE_KEY);
    if (!raw) return {};

    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }

    const record = parsed as Record<string, unknown>;
    const result: UtmValues = {};
    for (const [, field] of FIELDS) {
      const value = clean(record[field]);
      if (value) result[field] = value;
    }
    return result;
  } catch {
    return {};
  }
}
