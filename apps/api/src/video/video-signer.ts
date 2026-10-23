import { createHmac, timingSafeEqual } from 'crypto';

export interface PlaybackGrant {
  /** The URL the player should load. */
  url: string;
  /** When it stops working. */
  expiresAt: Date;
}

/**
 * Turns a stored video reference into a short-lived playback URL.
 *
 * Implementations are provider-specific. The stored value on a lesson is
 * treated as an opaque reference: a full URL today, an object key once a
 * host is chosen. Nothing outside this file should assume which.
 */
export interface VideoSigner {
  readonly name: string;
  sign(reference: string, ttlSeconds: number): PlaybackGrant;
}

/**
 * No host chosen yet. Returns the stored URL unchanged but still stamps an
 * expiry, so callers are written against a real contract from the start.
 *
 * This does NOT protect the content: anyone with the URL can replay it.
 * Swap in a provider signer before selling access to real video.
 */
export class PassthroughSigner implements VideoSigner {
  readonly name = 'passthrough';

  sign(reference: string, ttlSeconds: number): PlaybackGrant {
    return {
      url: reference,
      expiresAt: new Date(Date.now() + ttlSeconds * 1000),
    };
  }
}

/**
 * Issues a token the API itself verifies, for a host that can be put behind
 * our own streaming route. Useful when the storage has no signing of its own.
 */
export class HmacTokenSigner implements VideoSigner {
  readonly name = 'hmac';

  constructor(
    private readonly secret: string,
    private readonly baseUrl: string,
  ) {}

  sign(reference: string, ttlSeconds: number): PlaybackGrant {
    const expires = Math.floor(Date.now() / 1000) + ttlSeconds;
    const signature = HmacTokenSigner.digest(this.secret, reference, expires);
    const url =
      `${this.baseUrl.replace(/\/+$/, '')}/${encodeURIComponent(reference)}` +
      `?expires=${expires}&signature=${signature}`;
    return { url, expiresAt: new Date(expires * 1000) };
  }

  static digest(secret: string, reference: string, expires: number) {
    return createHmac('sha256', secret)
      .update(`${reference}:${expires}`)
      .digest('hex');
  }

  /** Constant-time check, so a wrong signature leaks no timing information. */
  static verify(
    secret: string,
    reference: string,
    expires: number,
    signature: string,
  ): boolean {
    if (!Number.isFinite(expires) || expires * 1000 < Date.now()) return false;
    const expected = HmacTokenSigner.digest(secret, reference, expires);
    const a = Buffer.from(expected);
    const b = Buffer.from(signature ?? '');
    return a.length === b.length && timingSafeEqual(a, b);
  }
}
