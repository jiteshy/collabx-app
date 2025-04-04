import { Injectable } from '@nestjs/common';
import { Redis } from 'ioredis';
import { Session } from '@collabx/shared';

@Injectable()
export class RedisService {
  private readonly redis: Redis;
  private readonly SESSION_PREFIX = 'session:';
  private readonly SESSION_TTL = 24 * 60 * 60; // 24 hours

  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
    });
  }

  async getSession(sessionId: string): Promise<Session | null> {
    const data = await this.redis.get(`${this.SESSION_PREFIX}${sessionId}`);
    if (!data) return null;

    const session = JSON.parse(data);
    // Convert users Map back from array
    session.users = new Map(Object.entries(session.users));
    return session;
  }

  async setSession(sessionId: string, session: Session): Promise<void> {
    // Convert users Map to array for Redis storage
    const sessionData = {
      ...session,
      users: Object.fromEntries(session.users),
    };
    await this.redis.set(
      `${this.SESSION_PREFIX}${sessionId}`,
      JSON.stringify(sessionData),
      'EX',
      this.SESSION_TTL,
    );
  }

  async deleteSession(sessionId: string): Promise<void> {
    await this.redis.del(`${this.SESSION_PREFIX}${sessionId}`);
  }

  async updateSessionLastActive(sessionId: string): Promise<void> {
    const session = await this.getSession(sessionId);
    if (session) {
      session.lastActive = Date.now();
      await this.setSession(sessionId, session);
    }
  }

  async setSessionTTL(sessionId: string, ttl: number): Promise<void> {
    await this.redis.expire(`${this.SESSION_PREFIX}${sessionId}`, ttl);
  }

  async getAllSessions(): Promise<Session[]> {
    const keys = await this.redis.keys(`${this.SESSION_PREFIX}*`);
    const sessions: Session[] = [];

    for (const key of keys) {
      const data = await this.redis.get(key);
      if (data) {
        const session = JSON.parse(data);
        session.users = new Map(Object.entries(session.users));
        sessions.push(session);
      }
    }

    return sessions;
  }
}
