import { Session, User, MessageType, SocketError } from '../types';

export class SessionService {
  private sessions: Map<string, Session>;
  private readonly MAX_USERS_PER_SESSION = 10;
  private readonly SESSION_CLEANUP_INTERVAL = 1000 * 60 * 60; // 1 hour

  constructor() {
    this.sessions = new Map();
    this.startCleanupInterval();
  }

  private startCleanupInterval(): void {
    setInterval(() => this.cleanupInactiveSessions(), this.SESSION_CLEANUP_INTERVAL);
  }

  private cleanupInactiveSessions(): void {
    const now = Date.now();
    for (const [sessionId, session] of this.sessions.entries()) {
      if (now - session.lastActive > this.SESSION_CLEANUP_INTERVAL) {
        this.sessions.delete(sessionId);
      }
    }
  }

  createSession(sessionId: string): Session {
    const session: Session = {
      id: sessionId,
      content: '',
      language: 'javascript',
      users: new Map(),
      lastActive: Date.now(),
      createdAt: Date.now(),
    };
    this.sessions.set(sessionId, session);
    return session;
  }

  getSession(sessionId: string): Session | undefined {
    return this.sessions.get(sessionId);
  }

  addUserToSession(sessionId: string, user: User): SocketError | null {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return {
        type: 'SERVER_ERROR',
        message: 'Session not found',
      };
    }

    if (session.users.size >= this.MAX_USERS_PER_SESSION) {
      return {
        type: 'SESSION_FULL',
        message: 'Session is full',
      };
    }

    if (Array.from(session.users.values()).some((u) => u.username === user.username)) {
      return {
        type: 'DUPLICATE_USERNAME',
        message: 'Username already taken',
      };
    }

    session.users.set(user.id, user);
    session.lastActive = Date.now();
    return null;
  }

  removeUserFromSession(sessionId: string, userId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.users.delete(userId);
      session.lastActive = Date.now();
    }
  }

  updateSessionContent(sessionId: string, content: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.content = content;
      session.lastActive = Date.now();
    }
  }

  updateSessionLanguage(sessionId: string, language: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.language = language;
      session.lastActive = Date.now();
    }
  }

  broadcastToSession(sessionId: string, event: MessageType, payload: unknown): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.lastActive = Date.now();
      // This method will be implemented differently in frontend and backend
      // Frontend will use socket.io-client
      // Backend will use socket.io
    }
  }
} 