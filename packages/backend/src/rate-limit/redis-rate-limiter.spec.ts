import { Test, TestingModule } from '@nestjs/testing';
import { RedisRateLimiter } from './redis-rate-limiter';
import { Socket } from 'socket.io';
import { MessageType } from '@collabx/shared';
import { RedisModule } from '../redis/redis.module';

describe('RedisRateLimiter', () => {
  let rateLimiter: RedisRateLimiter;
  let mockRedis: any;
  let mockSocket: Partial<Socket>;
  let module: TestingModule;

  beforeEach(async () => {
    mockRedis = {
      get: jest.fn(),
      set: jest.fn(),
      ttl: jest.fn(),
      del: jest.fn(),
      multi: jest.fn(),
      exec: jest.fn(),
      quit: jest.fn().mockResolvedValue('OK'),
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
    };

    module = await Test.createTestingModule({
      imports: [RedisModule],
      providers: [
        RedisRateLimiter,
        {
          provide: 'REDIS_CLIENT',
          useValue: mockRedis,
        },
      ],
    }).compile();

    rateLimiter = module.get<RedisRateLimiter>(RedisRateLimiter);
  });

  afterEach(async () => {
    await module.close();
  });

  describe('isRateLimited', () => {
    it('should return false when under rate limit', async () => {
      const key = `rate_limit:${MessageType.JOIN}:${mockSocket.handshake?.query.sessionId}`;
      mockRedis.multi.mockReturnValue({
        get: jest.fn().mockReturnThis(),
        ttl: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([['1'], [300]]),
      });

      const result = await rateLimiter.isRateLimited(mockSocket as Socket, MessageType.JOIN);

      expect(result.limited).toBe(false);
      expect(mockRedis.multi).toHaveBeenCalled();
    });

    it('should return true when exceeding rate limit', async () => {
      const key = `rate_limit:${MessageType.JOIN}:${mockSocket.handshake?.query.sessionId}`;
      mockRedis.multi.mockReturnValue({
        get: jest.fn().mockReturnThis(),
        ttl: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([['11'], [300]]),
      });

      const result = await rateLimiter.isRateLimited(mockSocket as Socket, MessageType.JOIN);

      expect(result.limited).toBe(true);
      expect(mockRedis.multi).toHaveBeenCalled();
    });

    it('should handle new keys', async () => {
      const key = `rate_limit:${MessageType.JOIN}:${mockSocket.handshake?.query.sessionId}`;
      mockRedis.multi.mockReturnValue({
        get: jest.fn().mockReturnThis(),
        ttl: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([[null], [-2]]),
      });
      mockRedis.set.mockResolvedValue('OK');

      const result = await rateLimiter.isRateLimited(mockSocket as Socket, MessageType.JOIN);

      expect(result.limited).toBe(false);
      expect(mockRedis.set).toHaveBeenCalledWith(key, '1', 'EX', 300);
    });

    it('should handle Redis errors gracefully', async () => {
      mockRedis.multi.mockReturnValue({
        get: jest.fn().mockReturnThis(),
        ttl: jest.fn().mockReturnThis(),
        exec: jest.fn().mockRejectedValue(new Error('Redis error')),
      });

      await expect(rateLimiter.isRateLimited(mockSocket as Socket, MessageType.JOIN)).resolves.toEqual({
        limited: false,
        message: 'Error checking rate limit',
      });
    });
  });

  describe('clear', () => {
    it('should clear rate limit for socket', async () => {
      mockRedis.del.mockResolvedValue(1);

      await rateLimiter.clear(mockSocket as Socket);

      expect(mockRedis.del).toHaveBeenCalledWith(
        `rate_limit:${MessageType.JOIN}:${mockSocket.handshake?.query.sessionId}`
      );
    });

    it('should handle Redis errors gracefully', async () => {
      mockRedis.del.mockRejectedValue(new Error('Redis error'));

      await expect(rateLimiter.clear(mockSocket as Socket)).resolves.not.toThrow();
      expect(mockRedis.del).toHaveBeenCalledWith(
        `rate_limit:${MessageType.JOIN}:${mockSocket.handshake?.query.sessionId}`
      );
    });
  });
}); 