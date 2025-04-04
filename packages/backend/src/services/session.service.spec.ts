import { Test, TestingModule } from '@nestjs/testing';
import { SessionService } from './session.service';
import { Redis } from 'ioredis';
import { RedisService } from './redis.service';
import { Session } from '@collabx/shared';
import { DEFAULT_CONTENT } from '@collabx/shared';
import { ConfigService } from '@nestjs/config';

jest.mock('ioredis', () => {
  const Redis = jest.fn(() => ({
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    exists: jest.fn(),
  }));
  return { Redis };
});

describe('SessionService', () => {
  let service: SessionService;
  let mockRedis: jest.Mocked<Redis>;
  let mockRedisService: jest.Mocked<RedisService>;
  let mockConfigService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    mockRedis = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      exists: jest.fn(),
    } as unknown as jest.Mocked<Redis>;

    mockRedisService = {
      getClient: jest.fn().mockReturnValue(mockRedis),
      getSession: jest.fn(),
      setSession: jest.fn(),
      deleteSession: jest.fn(),
      updateSessionLastActive: jest.fn(),
      setSessionTTL: jest.fn(),
    } as unknown as jest.Mocked<RedisService>;

    mockConfigService = {
      get: jest.fn((key: string) => {
        const config = {
          MAX_USERS_PER_SESSION: 5,
          SESSION_TTL: 86400,
          EMPTY_SESSION_TTL: 3600,
        };
        return config[key];
      }),
    } as unknown as jest.Mocked<ConfigService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionService,
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<SessionService>(SessionService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getOrCreateSession', () => {
    it('should return existing session', async () => {
      const sessionId = 'test-session';
      const existingSession: Session = {
        id: sessionId,
        content: 'test content',
        language: 'javascript',
        lastActive: Date.now(),
        users: new Map(),
        createdAt: Date.now(),
      };

      mockRedisService.getSession.mockResolvedValue(existingSession);

      const result = await service.getOrCreateSession(sessionId);

      expect(result).toEqual(existingSession);
      expect(mockRedisService.getSession).toHaveBeenCalledWith(sessionId);
    });

    it('should create new session if not exists', async () => {
      const sessionId = 'test-session';
      mockRedisService.getSession.mockResolvedValue(null);

      const result = await service.getOrCreateSession(sessionId);

      expect(result.id).toBe(sessionId);
      expect(result.content).toBe(DEFAULT_CONTENT);
      expect(result.language).toBe('javascript');
      expect(result.users).toBeInstanceOf(Map);
      expect(mockRedisService.setSession).toHaveBeenCalledWith(
        sessionId,
        expect.any(Object),
      );
    });
  });

  describe('addUserToSession', () => {
    it('should add user to session', async () => {
      const sessionId = 'test-session';
      const username = 'test_user';
      const existingSession: Session = {
        id: sessionId,
        content: '',
        language: 'javascript',
        lastActive: Date.now(),
        users: new Map(),
        createdAt: Date.now(),
      };

      mockRedisService.getSession.mockResolvedValue(existingSession);

      const result = await service.addUserToSession(sessionId, username);

      expect(result.username).toBe(username);
      expect(result.sessionId).toBe(sessionId);
      expect(mockRedisService.setSession).toHaveBeenCalledWith(
        sessionId,
        expect.any(Object),
      );
    });

    it('should throw error if username is taken', async () => {
      const sessionId = 'test-session';
      const username = 'test_user';
      const existingSession: Session = {
        id: sessionId,
        content: '',
        language: 'javascript',
        lastActive: Date.now(),
        users: new Map([
          [
            '1',
            {
              id: '1',
              username,
              color: '#000000',
              lastActive: Date.now(),
              sessionId,
            },
          ],
        ]),
        createdAt: Date.now(),
      };

      mockRedisService.getSession.mockResolvedValue(existingSession);

      await expect(
        service.addUserToSession(sessionId, username),
      ).rejects.toThrow('Username already taken');
    });

    it('should throw error if session is full', async () => {
      const sessionId = 'test-session';
      const username = 'new_user';
      const existingSession: Session = {
        id: sessionId,
        content: '',
        language: 'javascript',
        lastActive: Date.now(),
        users: new Map([
          ['1', { id: '1', username: 'user1', color: '#000000', lastActive: Date.now(), sessionId }],
          ['2', { id: '2', username: 'user2', color: '#000000', lastActive: Date.now(), sessionId }],
          ['3', { id: '3', username: 'user3', color: '#000000', lastActive: Date.now(), sessionId }],
          ['4', { id: '4', username: 'user4', color: '#000000', lastActive: Date.now(), sessionId }],
          ['5', { id: '5', username: 'user5', color: '#000000', lastActive: Date.now(), sessionId }],
        ]),
        createdAt: Date.now(),
      };

      mockRedisService.getSession.mockResolvedValue(existingSession);

      await expect(
        service.addUserToSession(sessionId, username),
      ).rejects.toThrow('Session is full');
    });
  });

  describe('removeUserFromSession', () => {
    it('should remove user from session', async () => {
      const sessionId = 'test-session';
      const userId = '1';
      const existingSession: Session = {
        id: sessionId,
        content: '',
        language: 'javascript',
        lastActive: Date.now(),
        users: new Map([
          [
            userId,
            {
              id: userId,
              username: 'test_user',
              color: '#000000',
              lastActive: Date.now(),
              sessionId,
            },
          ],
        ]),
        createdAt: Date.now(),
      };

      mockRedisService.getSession.mockResolvedValue(existingSession);

      await service.removeUserFromSession(sessionId, userId);

      expect(mockRedisService.setSession).toHaveBeenCalledWith(
        sessionId,
        expect.any(Object),
      );
    });
  });

  describe('updateSessionContent', () => {
    it('should update session content', async () => {
      const sessionId = 'test-session';
      const content = 'new content';
      const existingSession: Session = {
        id: sessionId,
        content: '',
        language: 'javascript',
        lastActive: Date.now(),
        users: new Map(),
        createdAt: Date.now(),
      };

      mockRedisService.getSession.mockResolvedValue(existingSession);

      await service.updateSessionContent(sessionId, content);

      expect(mockRedisService.setSession).toHaveBeenCalledWith(
        sessionId,
        expect.any(Object),
      );
    });
  });

  describe('updateSessionLanguage', () => {
    it('should update session language', async () => {
      const sessionId = 'test-session';
      const language = 'python';
      const existingSession: Session = {
        id: sessionId,
        content: '',
        language: 'javascript',
        lastActive: Date.now(),
        users: new Map(),
        createdAt: Date.now(),
      };

      mockRedisService.getSession.mockResolvedValue(existingSession);

      await service.updateSessionLanguage(sessionId, language);

      expect(mockRedisService.setSession).toHaveBeenCalledWith(
        sessionId,
        expect.any(Object),
      );
    });
  });
});
