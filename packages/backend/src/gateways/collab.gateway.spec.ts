import { Test, TestingModule } from '@nestjs/testing';
import { CollabGateway } from './collab.gateway';
import { SessionService } from '../services/session.service';
import { RedisRateLimiter } from '../rate-limit/redis-rate-limiter';
import { ValidationService } from '../validation/validation.service';
import { Socket } from 'socket.io';
import { MessageType } from '../types';
import { JoinMessageDto, ContentChangeMessageDto, LanguageChangeMessageDto, CursorMoveMessageDto } from '../dto/messages.dto';

describe('CollabGateway', () => {
  let gateway: CollabGateway;
  let mockSessionService: jest.Mocked<SessionService>;
  let mockRateLimiter: jest.Mocked<RedisRateLimiter>;
  let mockValidationService: jest.Mocked<ValidationService>;
  let mockSocket: Partial<Socket>;
  let mockTo: { emit: jest.Mock };

  beforeEach(async () => {
    mockSessionService = {
      getOrCreateSession: jest.fn(),
      addUserToSession: jest.fn(),
      removeUserFromSession: jest.fn(),
      updateSessionContent: jest.fn(),
      updateSessionLanguage: jest.fn(),
    } as unknown as jest.Mocked<SessionService>;

    mockRateLimiter = {
      isRateLimited: jest.fn(),
      clear: jest.fn(),
      addLimit: jest.fn(),
    } as unknown as jest.Mocked<RedisRateLimiter>;

    mockValidationService = {
      validateSessionId: jest.fn(),
      validateEventPayload: jest.fn(),
    } as unknown as jest.Mocked<ValidationService>;

    mockTo = {
      emit: jest.fn(),
    };

    mockSocket = {
      id: 'test-socket-id',
      handshake: {
        query: {
          sessionId: 'test-session',
        },
        headers: {},
        time: new Date().toISOString(),
        address: '127.0.0.1',
        xdomain: false,
        secure: false,
        issued: Date.now(),
        url: '/',
        auth: {},
      },
      data: {
        userId: '1',
      },
      join: jest.fn(),
      leave: jest.fn(),
      emit: jest.fn(),
      to: jest.fn().mockReturnValue(mockTo),
      disconnect: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CollabGateway,
        {
          provide: SessionService,
          useValue: mockSessionService,
        },
        {
          provide: RedisRateLimiter,
          useValue: mockRateLimiter,
        },
        {
          provide: ValidationService,
          useValue: mockValidationService,
        },
      ],
    }).compile();

    gateway = module.get<CollabGateway>(CollabGateway);
  });

  describe('handleConnection', () => {
    it('should handle valid connection', async () => {
      const sessionId = 'test-session';
      mockValidationService.validateSessionId.mockReturnValue(null);
      mockRateLimiter.isRateLimited.mockResolvedValue({ limited: false });

      await gateway.handleConnection(mockSocket as Socket);

      expect(mockValidationService.validateSessionId).toHaveBeenCalledWith(sessionId);
      expect(mockRateLimiter.isRateLimited).toHaveBeenCalledWith(mockSocket as Socket, MessageType.JOIN);
      expect(mockSocket.join).toHaveBeenCalledWith(sessionId);
    });

    it('should handle invalid session ID', async () => {
      const sessionId = 'test-session';
      const error = { message: 'Invalid session ID', type: 'INVALID_SESSION_ID' };
      mockValidationService.validateSessionId.mockReturnValue(error);

      await gateway.handleConnection(mockSocket as Socket);

      expect(mockSocket.emit).toHaveBeenCalledWith(MessageType.ERROR, error);
      expect(mockSocket.disconnect).toHaveBeenCalled();
    });

    it('should handle rate limiting', async () => {
      const sessionId = 'test-session';
      mockValidationService.validateSessionId.mockReturnValue(null);
      mockRateLimiter.isRateLimited.mockResolvedValue({
        limited: true,
        message: 'Rate limit exceeded',
      });

      await gateway.handleConnection(mockSocket as Socket);

      expect(mockSocket.emit).toHaveBeenCalledWith(MessageType.ERROR, {
        message: 'Rate limit exceeded',
        type: 'RATE_LIMIT_EXCEEDED',
      });
      expect(mockSocket.disconnect).toHaveBeenCalled();
    });
  });

  describe('handleDisconnect', () => {
    it('should handle disconnection', async () => {
      const sessionId = 'test-session';
      const userId = '1';

      await gateway.handleDisconnect(mockSocket as Socket);

      expect(mockSessionService.removeUserFromSession).toHaveBeenCalledWith(sessionId, userId);
      expect(mockRateLimiter.clear).toHaveBeenCalledWith(mockSocket);
      expect(mockSocket.to).toHaveBeenCalledWith(sessionId);
      expect(mockTo.emit).toHaveBeenCalledWith(MessageType.USER_LEFT, { userId });
    });
  });

  describe('handleJoin', () => {
    it('should handle valid join request', async () => {
      const sessionId = 'test-session';
      const payload: JoinMessageDto = {
        sessionId,
        username: 'test_user',
      };

      const user = {
        id: '1',
        username: 'test_user',
        color: '#000000',
        lastActive: Date.now(),
        sessionId,
      };

      const session = {
        id: sessionId,
        content: '',
        language: 'javascript',
        lastActive: Date.now(),
        users: new Map([[user.id, user]]),
      };

      mockSessionService.getOrCreateSession.mockResolvedValue(session);
      mockSessionService.addUserToSession.mockResolvedValue(user);
      mockValidationService.validateEventPayload.mockResolvedValue(null);
      mockRateLimiter.isRateLimited.mockResolvedValue({ limited: false });

      await gateway.handleJoin(mockSocket as Socket, payload);

      expect(mockSessionService.getOrCreateSession).toHaveBeenCalledWith(sessionId);
      expect(mockSessionService.addUserToSession).toHaveBeenCalledWith(sessionId, payload.username);
      expect(mockSocket.emit).toHaveBeenCalledWith(MessageType.SYNC_RESPONSE, {
        content: session.content,
        language: session.language,
        users: [user],
      });
      expect(mockSocket.to).toHaveBeenCalledWith(sessionId);
      expect(mockTo.emit).toHaveBeenCalledWith(MessageType.USER_JOINED, { user });
    });

    it('should handle duplicate username error', async () => {
      const sessionId = 'test-session';
      const payload: JoinMessageDto = {
        sessionId,
        username: 'test_user',
      };

      const session = {
        id: sessionId,
        content: '',
        language: 'javascript',
        lastActive: Date.now(),
        users: new Map(),
      };

      mockSessionService.getOrCreateSession.mockResolvedValue(session);
      mockSessionService.addUserToSession.mockRejectedValue(new Error('Username already taken'));
      mockValidationService.validateEventPayload.mockResolvedValue(null);
      mockRateLimiter.isRateLimited.mockResolvedValue({ limited: false });

      await gateway.handleJoin(mockSocket as Socket, payload);

      expect(mockSocket.emit).toHaveBeenCalledWith(MessageType.ERROR, {
        message: 'Username already taken',
        type: 'DUPLICATE_USERNAME',
      });
    });
  });

  describe('handleContentChange', () => {
    it('should handle valid content change', async () => {
      const sessionId = 'test-session';
      const userId = '1';
      const payload: ContentChangeMessageDto = {
        sessionId,
        content: 'new content',
      };

      const user = {
        id: userId,
        username: 'test_user',
        color: '#000000',
        lastActive: Date.now(),
        sessionId,
      };

      const session = {
        id: sessionId,
        content: '',
        language: 'javascript',
        lastActive: Date.now(),
        users: new Map([[userId, user]]),
      };

      mockSessionService.getOrCreateSession.mockResolvedValue(session);
      mockValidationService.validateEventPayload.mockResolvedValue(null);
      mockRateLimiter.isRateLimited.mockResolvedValue({ limited: false });

      await gateway.handleContentChange(mockSocket as Socket, payload);

      expect(mockSessionService.updateSessionContent).toHaveBeenCalledWith(sessionId, payload.content);
      expect(mockSocket.to).toHaveBeenCalledWith(sessionId);
      expect(mockTo.emit).toHaveBeenCalledWith(MessageType.CONTENT_CHANGE, {
        content: payload.content,
        user: session.users.get(userId),
      });
    });
  });

  describe('handleLanguageChange', () => {
    it('should handle valid language change', async () => {
      const sessionId = 'test-session';
      const userId = '1';
      const payload: LanguageChangeMessageDto = {
        sessionId,
        language: 'python',
      };

      const user = {
        id: userId,
        username: 'test_user',
        color: '#000000',
        lastActive: Date.now(),
        sessionId,
      };

      const session = {
        id: sessionId,
        content: '',
        language: 'javascript',
        lastActive: Date.now(),
        users: new Map([[userId, user]]),
      };

      mockSessionService.getOrCreateSession.mockResolvedValue(session);
      mockValidationService.validateEventPayload.mockResolvedValue(null);
      mockRateLimiter.isRateLimited.mockResolvedValue({ limited: false });

      await gateway.handleLanguageChange(mockSocket as Socket, payload);

      expect(mockSessionService.updateSessionLanguage).toHaveBeenCalledWith(sessionId, payload.language);
      expect(mockSocket.to).toHaveBeenCalledWith(sessionId);
      expect(mockTo.emit).toHaveBeenCalledWith(MessageType.LANGUAGE_CHANGE, {
        language: payload.language,
        user: session.users.get(userId),
      });
    });
  });

  describe('handleCursorMove', () => {
    it('should handle valid cursor move', async () => {
      const sessionId = 'test-session';
      const userId = '1';
      const payload: CursorMoveMessageDto = {
        sessionId,
        userId,
        position: 10,
      };

      const user = {
        id: userId,
        username: 'test_user',
        color: '#000000',
        lastActive: Date.now(),
        sessionId,
      };

      const session = {
        id: sessionId,
        content: '',
        language: 'javascript',
        lastActive: Date.now(),
        users: new Map([[userId, user]]),
      };

      mockSessionService.getOrCreateSession.mockResolvedValue(session);
      mockValidationService.validateEventPayload.mockResolvedValue(null);
      mockRateLimiter.isRateLimited.mockResolvedValue({ limited: false });

      await gateway.handleCursorMove(mockSocket as Socket, payload);

      expect(mockSocket.to).toHaveBeenCalledWith(sessionId);
      expect(mockTo.emit).toHaveBeenCalledWith(MessageType.CURSOR_MOVE, {
        position: payload.position,
        user: session.users.get(userId),
      });
    });
  });
}); 