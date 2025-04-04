import { Injectable } from '@nestjs/common';
import { RedisService } from './redis.service';
import { Session, User } from '@collabx/shared';
import {
  DEFAULT_CONTENT,
  DEFAULT_LANGUAGE,
  getRandomColor,
} from '@collabx/shared';
import { v4 as uuidv4 } from 'uuid';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SessionService {
  private readonly MAX_USERS_PER_SESSION: number;
  private readonly SESSION_TTL: number;
  private readonly EMPTY_SESSION_TTL: number;
  private readonly INACTIVITY_TIMEOUT: number;

  constructor(
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
  ) {
    this.MAX_USERS_PER_SESSION = this.configService.get<number>('MAX_USERS_PER_SESSION', 5);
    this.SESSION_TTL = this.configService.get<number>('SESSION_TTL', 14400); // 4 hours in seconds
    this.EMPTY_SESSION_TTL = this.configService.get<number>('EMPTY_SESSION_TTL', 3600); // 1 hour in seconds
    this.INACTIVITY_TIMEOUT = this.configService.get<number>('INACTIVITY_TIMEOUT', 900); // 15 minutes in seconds
  }

  async getOrCreateSession(sessionId: string): Promise<Session> {
    let session = await this.redisService.getSession(sessionId);
    if (!session) {
      session = {
        id: sessionId,
        content: DEFAULT_CONTENT,
        language: DEFAULT_LANGUAGE,
        lastActive: Date.now(),
        users: new Map(),
        createdAt: Date.now(),
      };
      await this.redisService.setSession(sessionId, session);
      // Set initial TTL for new session
      await this.redisService.setSessionTTL(sessionId, this.SESSION_TTL);
    }
    return session;
  }

  async addUserToSession(sessionId: string, username: string): Promise<User> {
    const session = await this.getOrCreateSession(sessionId);

    // Check for duplicate username
    if (
      Array.from(session.users.values()).some(
        (user) => user.username === username,
      )
    ) {
      throw new Error('Username already taken');
    }

    // Check if session is full
    if (session.users.size >= this.MAX_USERS_PER_SESSION) {
      throw new Error('Session is full');
    }

    // Create new user
    const userId = uuidv4();
    const user: User = {
      id: userId,
      username,
      color: getRandomColor(),
      lastActive: Date.now(),
      sessionId,
    };

    // Add user to session
    session.users.set(userId, user);
    session.lastActive = Date.now();
    await this.redisService.setSession(sessionId, session);

    return user;
  }

  async removeUserFromSession(
    sessionId: string,
    userId: string,
  ): Promise<void> {
    const session = await this.redisService.getSession(sessionId);
    if (session) {
      session.users.delete(userId);
      session.lastActive = Date.now();

      if (session.users.size === 0) {
        // If no users left, set shorter TTL for empty session
        await this.redisService.setSessionTTL(
          sessionId,
          this.EMPTY_SESSION_TTL,
        );
      }

      await this.redisService.setSession(sessionId, session);
    }
  }

  async updateSessionContent(
    sessionId: string,
    content: string,
  ): Promise<void> {
    const session = await this.redisService.getSession(sessionId);
    if (session) {
      session.content = content;
      session.lastActive = Date.now();
      await this.redisService.setSession(sessionId, session);
    }
  }

  async updateSessionLanguage(
    sessionId: string,
    language: string,
  ): Promise<void> {
    const session = await this.redisService.getSession(sessionId);
    if (session) {
      session.language = language;
      session.lastActive = Date.now();
      await this.redisService.setSession(sessionId, session);
    }
  }

  async cleanupInactiveSessions(): Promise<void> {
    const sessions = await this.redisService.getAllSessions();
    const now = Date.now();

    for (const session of sessions) {
      const timeSinceLastActive = now - session.lastActive;
      if (timeSinceLastActive >= this.INACTIVITY_TIMEOUT * 1000) {
        await this.redisService.deleteSession(session.id);
      }
    }
  }
}
