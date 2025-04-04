import { Socket } from 'socket.io';

/**
 * Configuration for rate limiting a specific event type.
 */
interface RateLimitConfig {
  /** Time window in milliseconds */
  windowMs: number;
  /** Maximum number of requests allowed in the window */
  max: number;
  /** Error message to display when limit is exceeded */
  message: string;
}

/**
 * Current state of rate limiting for a client.
 */
interface RateLimitInfo {
  /** Current request count */
  count: number;
  /** Timestamp when the rate limit will reset */
  resetTime: number;
}

export class RateLimiter {
  private limits: Map<string, RateLimitConfig> = new Map();
  private store: Map<string, Map<string, RateLimitInfo>> = new Map();

  addLimit(event: string, config: RateLimitConfig): void {
    this.limits.set(event, config);
  }

  isRateLimited(
    socket: Socket,
    event: string,
  ): { limited: boolean; message?: string } {
    const limit = this.limits.get(event);
    if (!limit) return { limited: false };

    const socketId = socket.id;
    const now = Date.now();

    // Initialize store for this event if it doesn't exist
    if (!this.store.has(event)) {
      this.store.set(event, new Map());
    }

    const eventStore = this.store.get(event)!;
    const info = eventStore.get(socketId);

    if (!info) {
      // First request
      eventStore.set(socketId, {
        count: 1,
        resetTime: now + limit.windowMs,
      });
      return { limited: false };
    }

    if (now > info.resetTime) {
      // Reset window
      eventStore.set(socketId, {
        count: 1,
        resetTime: now + limit.windowMs,
      });
      return { limited: false };
    }

    if (info.count >= limit.max) {
      return { limited: true, message: limit.message };
    }

    // Increment count
    info.count++;
    return { limited: false };
  }

  clear(socket: Socket): void {
    const socketId = socket.id;
    for (const eventStore of this.store.values()) {
      eventStore.delete(socketId);
    }
  }
}
