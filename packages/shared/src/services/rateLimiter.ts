import { RateLimitConfig, RateLimitState } from '../types';

export class RateLimiter {
  private limits: Map<string, RateLimitConfig>;
  private states: Map<string, Map<string, RateLimitState>>;

  constructor() {
    this.limits = new Map();
    this.states = new Map();
  }

  addLimit(event: string, config: RateLimitConfig): void {
    this.limits.set(event, config);
    this.states.set(event, new Map());
  }

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

  clearClient(clientId: string): void {
    for (const eventStates of this.states.values()) {
      eventStates.delete(clientId);
    }
  }
} 