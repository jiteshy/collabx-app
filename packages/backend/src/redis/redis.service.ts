import { Injectable, Inject } from '@nestjs/common';
import Redis from 'ioredis';
import { Session } from '@collabx/shared';

@Injectable()
export class RedisService {
  private readonly SESSION_PREFIX = 'session:';

  constructor(
    @Inject('REDIS_CLIENT')
    private readonly redis: Redis,
  ) {}

  private getSessionKey(sessionId: string): string {
    return `${this.SESSION_PREFIX}${sessionId}`;
  }

  async getSession(sessionId: string): Promise<Session | null> {
    const data = await this.redis.get(this.getSessionKey(sessionId));
    if (!data) return null;
    const session = JSON.parse(data);
    // Convert users Map from string back to Map
    session.users = new Map(Object.entries(session.users));
    return session;
  }

  async setSession(sessionId: string, session: Session): Promise<void> {
    // Convert users Map to plain object for Redis storage
    const sessionData = {
      ...session,
      users: Object.fromEntries(session.users),
    };
    await this.redis.set(
      this.getSessionKey(sessionId),
      JSON.stringify(sessionData),
    );
  }

  async setSessionTTL(sessionId: string, seconds: number): Promise<void> {
    await this.redis.expire(this.getSessionKey(sessionId), seconds);
  }

  async deleteSession(sessionId: string): Promise<void> {
    await this.redis.del(this.getSessionKey(sessionId));
  }

  async sessionExists(sessionId: string): Promise<boolean> {
    return this.exists(this.getSessionKey(sessionId));
  }

  async get(key: string): Promise<string | null> {
    return this.redis.get(key);
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (ttl) {
      await this.redis.set(key, value, 'EX', ttl);
    } else {
      await this.redis.set(key, value);
    }
  }

  async del(key: string): Promise<void> {
    await this.redis.del(key);
  }

  async exists(key: string): Promise<boolean> {
    const result = await this.redis.exists(key);
    return result === 1;
  }

  async expire(key: string, seconds: number): Promise<void> {
    await this.redis.expire(key, seconds);
  }

  async ttl(key: string): Promise<number> {
    return this.redis.ttl(key);
  }
}
