import { Injectable, Logger } from '@nestjs/common';
import {
  HmacTokenSigner,
  PassthroughSigner,
  PlaybackGrant,
  VideoSigner,
} from './video-signer';

/** Long enough to start a lesson, short enough that a shared link dies fast. */
const DEFAULT_TTL_SECONDS = 15 * 60;

@Injectable()
export class VideoService {
  private readonly logger = new Logger(VideoService.name);
  private readonly signer: VideoSigner;

  constructor() {
    const secret = process.env.VIDEO_SIGNING_SECRET;
    const base = process.env.VIDEO_BASE_URL;

    if (secret && base) {
      this.signer = new HmacTokenSigner(secret, base);
    } else {
      this.signer = new PassthroughSigner();
      this.logger.warn(
        'No video signing configured — lesson videos are served as plain, ' +
          'shareable URLs. Set VIDEO_SIGNING_SECRET and VIDEO_BASE_URL, or ' +
          'add a provider signer, before selling access to real content.',
      );
    }
  }

  get strategy() {
    return this.signer.name;
  }

  get isProtected() {
    return this.signer.name !== 'passthrough';
  }

  /** Issues playback for a stored reference. Caller must authorise first. */
  grant(reference: string | null, ttlSeconds = DEFAULT_TTL_SECONDS): PlaybackGrant | null {
    if (!reference) return null;
    return this.signer.sign(reference, ttlSeconds);
  }
}
