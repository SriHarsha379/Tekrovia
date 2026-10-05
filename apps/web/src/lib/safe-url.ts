/**
 * Returns a normalised URL only when it is a plain https link without embedded
 * credentials. Anything else (http, javascript:, data:, malformed) returns null.
 */
export function safeHttpsUrl(value: string | null | undefined): string | null {
  if (!value) return null;

  try {
    const url = new URL(value.trim());
    if (url.protocol !== "https:" || url.username || url.password) return null;
    return url.toString();
  } catch {
    return null;
  }
}
