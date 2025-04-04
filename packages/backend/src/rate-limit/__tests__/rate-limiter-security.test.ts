import { Test, TestingModule } from '@nestjs/testing';
import { RateLimiterService } from '../rate-limiter.service';
import { RedisRateLimiter } from '../redis-rate-limiter';
import { Socket } from 'socket.io';
import { MessageType } from '@collabx/shared';

describe('RateLimiter Security', () => {
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

  describe('Rate Limiting Security', () => {
    it('should prevent rapid-fire join attempts', async () => {
      const attempts = 100;
      const startTime = performance.now();

      for (let i = 0; i < attempts; i++) {
        mockRedisRateLimiter.isRateLimited.mockResolvedValueOnce({
          limited: i >= 10,
          message: i >= 10 ? 'Too many join attempts' : undefined,
        });

        const result = await service.isRateLimited(
          mockSocket as Socket,
          MessageType.JOIN,
        );

        if (i >= 10) {
          expect(result.limited).toBe(true);
          expect(result.message).toBe('Too many join attempts');
        } else {
          expect(result.limited).toBe(false);
        }
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      expect(totalTime).toBeLessThan(1000); // Should complete within 1 second
      expect(mockRedisRateLimiter.isRateLimited).toHaveBeenCalledTimes(attempts);
    });

    it('should prevent content change spam', async () => {
      const attempts = 1000;
      const startTime = performance.now();

      for (let i = 0; i < attempts; i++) {
        mockRedisRateLimiter.isRateLimited.mockResolvedValueOnce({
          limited: i >= 100,
          message: i >= 100 ? 'Too many content changes' : undefined,
        });

        const result = await service.isRateLimited(
          mockSocket as Socket,
          MessageType.CONTENT_CHANGE,
        );

        if (i >= 100) {
          expect(result.limited).toBe(true);
          expect(result.message).toBe('Too many content changes');
        } else {
          expect(result.limited).toBe(false);
        }
      }

      const endTime = performance.now();
      const averageTime = (endTime - startTime) / attempts;

      expect(averageTime).toBeLessThan(1); // Each check should take less than 1ms
    });

    it('should handle concurrent rate limit checks efficiently', async () => {
      const attempts = 100;
      const startTime = performance.now();

      const promises = Array.from({ length: attempts }, () =>
        service.isRateLimited(mockSocket as Socket, MessageType.JOIN),
      );

      await Promise.all(promises);

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      expect(totalTime).toBeLessThan(1000); // Should complete within 1 second
      expect(mockRedisRateLimiter.isRateLimited).toHaveBeenCalledTimes(attempts);
    });
  });

  describe('DDoS Protection', () => {
    it('should handle high-frequency requests from same IP', async () => {
      const requests = 10000;
      const startTime = performance.now();

      for (let i = 0; i < requests; i++) {
        mockRedisRateLimiter.isRateLimited.mockResolvedValueOnce({
          limited: i >= 1000,
          message: i >= 1000 ? 'Too many requests from this IP' : undefined,
        });

        const result = await service.isRateLimited(
          mockSocket as Socket,
          MessageType.JOIN,
        );

        if (i >= 1000) {
          expect(result.limited).toBe(true);
          expect(result.message).toBe('Too many requests from this IP');
        }
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      expect(totalTime).toBeLessThan(5000); // Should handle 10k requests within 5 seconds
    });

    it('should handle multiple event types concurrently', async () => {
      const eventTypes = [
        MessageType.JOIN,
        MessageType.CONTENT_CHANGE,
        MessageType.LANGUAGE_CHANGE,
        MessageType.CURSOR_MOVE,
      ];
      const requestsPerType = 100;
      const startTime = performance.now();

      const promises = eventTypes.flatMap((eventType) =>
        Array.from({ length: requestsPerType }, () =>
          service.isRateLimited(mockSocket as Socket, eventType),
        ),
      );

      await Promise.all(promises);

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      expect(totalTime).toBeLessThan(2000); // Should handle all requests within 2 seconds
      expect(mockRedisRateLimiter.isRateLimited).toHaveBeenCalledTimes(
        eventTypes.length * requestsPerType,
      );
    });
  });

  describe('Resource Cleanup', () => {
    it('should clear rate limits efficiently on disconnect', async () => {
      const startTime = performance.now();

      await service.clear(mockSocket as Socket);

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      expect(totalTime).toBeLessThan(50); // Cleanup should be fast
      expect(mockRedisRateLimiter.clear).toHaveBeenCalledWith(mockSocket);
    });

    it('should handle multiple concurrent cleanup requests', async () => {
      const cleanupCount = 100;
      const startTime = performance.now();

      const promises = Array.from({ length: cleanupCount }, () =>
        service.clear(mockSocket as Socket),
      );

      await Promise.all(promises);

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      expect(totalTime).toBeLessThan(1000); // Should handle all cleanups within 1 second
      expect(mockRedisRateLimiter.clear).toHaveBeenCalledTimes(cleanupCount);
    });
  });
}); 