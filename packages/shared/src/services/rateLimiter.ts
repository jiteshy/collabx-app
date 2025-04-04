import { RateLimitConfig, RateLimitState } from '../types';

/**
 * Service for managing rate limiting of WebSocket events.
 * Provides functionality to limit the frequency of specific events per client.
 */
export class RateLimiter {
  /** Map of event types to their rate limit configurations */
  private limits: Map<string, RateLimitConfig>;
  /** Map of event types to their client-specific rate limit states */
  private states: Map<string, Map<string, RateLimitState>>;

  constructor() {
    this.limits = new Map();
    this.states = new Map();
  }

  /**
   * Adds a rate limit configuration for a specific event type.
   * @param event - The event type to rate limit
   * @param config - Configuration for the rate limit
   */
  addLimit(event: string, config: RateLimitConfig): void {
    this.limits.set(event, config);
    this.states.set(event, new Map());
  }

  /**
   * Checks if a client has exceeded the rate limit for a specific event.
   * @param clientId - Unique identifier of the client
   * @param event - The event type to check
   * @returns Object indicating if the client is rate limited and any error message
   */
  isRateLimited(clientId: string, event: string): { limited: boolean; message?: string } {
    const limit = this.limits.get(event);
    if (!limit) return { limited: false };

    const eventStates = this.states.get(event)!;
    const now = Date.now();

    let state = eventStates.get(clientId);
    if (!state) {
      state = { count: 0, resetTime: now + limit.windowMs };
      eventStates.set(clientId, state);
    }

    if (now > state.resetTime) {
      state.count = 0;
      state.resetTime = now + limit.windowMs;
    }

    state.count++;
    if (state.count > limit.max) {
      return { limited: true, message: limit.message };
    }

    return { limited: false };
  }

  /**
   * Clears all rate limit states for a specific client.
   * @param clientId - Unique identifier of the client
   */
  clearClient(clientId: string): void {
    for (const eventStates of this.states.values()) {
      eventStates.delete(clientId);
    }
  }
} 