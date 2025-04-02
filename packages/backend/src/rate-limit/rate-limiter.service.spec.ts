import { Test, TestingModule } from '@nestjs/testing';
import { RateLimiterService } from './rate-limiter.service';
import { RedisRateLimiter } from './redis-rate-limiter';
import { Socket } from 'socket.io';
import { MessageType } from '../types';

describe('RateLimiterService', () => {
  let service: RateLimiterService;
  let mockRedisRateLimiter: jest.Mocked<RedisRateLimiter>;
  let mockSocket: Partial<Socket>;

  beforeEach(async () => {
    mockRedisRateLimiter = {
      isRateLimited: jest.fn(),
      clear: jest.fn(),
    } as unknown as jest.Mocked<RedisRateLimiter>;

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

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RateLimiterService,
        {
          provide: RedisRateLimiter,
          useValue: mockRedisRateLimiter,
        },
      ],
    }).compile();

    service = module.get<RateLimiterService>(RateLimiterService);
  });

  describe('isRateLimited', () => {
    it('should return not limited when under rate limit', async () => {
      mockRedisRateLimiter.isRateLimited.mockResolvedValue({ limited: false });

      const result = await service.isRateLimited(mockSocket as Socket, MessageType.JOIN);

      expect(result).toEqual({ limited: false });
      expect(mockRedisRateLimiter.isRateLimited).toHaveBeenCalledWith(mockSocket, MessageType.JOIN);
    });

    it('should return limited when exceeding rate limit', async () => {
      const message = 'Rate limit exceeded';
      mockRedisRateLimiter.isRateLimited.mockResolvedValue({ limited: true, message });

      const result = await service.isRateLimited(mockSocket as Socket, MessageType.JOIN);

      expect(result).toEqual({ limited: true, message });
      expect(mockRedisRateLimiter.isRateLimited).toHaveBeenCalledWith(mockSocket, MessageType.JOIN);
    });
  });

  describe('clear', () => {
    it('should clear rate limit for socket', async () => {
      await service.clear(mockSocket as Socket);

      expect(mockRedisRateLimiter.clear).toHaveBeenCalledWith(mockSocket);
    });
  });
}); 