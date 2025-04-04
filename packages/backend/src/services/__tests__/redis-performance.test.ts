import { Test, TestingModule } from '@nestjs/testing';
import { RedisService } from '../redis.service';
import { Redis } from 'ioredis';
import { Session } from '@collabx/shared';

jest.mock('ioredis', () => {
  const Redis = jest.fn(() => ({
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    exists: jest.fn(),
    keys: jest.fn(),
    expire: jest.fn(),
  }));
  return { Redis };
});

describe('RedisService Performance', () => {
  let service: RedisService;
  let mockRedis: jest.Mocked<Redis>;

  beforeEach(async () => {
    mockRedis = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      exists: jest.fn(),
      keys: jest.fn(),
      expire: jest.fn(),
    } as unknown as jest.Mocked<Redis>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [RedisService],
    }).compile();

    service = module.get<RedisService>(RedisService);
    (service as any).client = mockRedis;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Session Operations Performance', () => {
    it('should handle rapid session creation efficiently', async () => {
      const operations = 1000;
      const startTime = performance.now();

      const promises = Array.from({ length: operations }, (_, i) => {
        const session: Session = {
          id: `test-session-${i}`,
          content: 'test content',
          language: 'javascript',
          lastActive: Date.now(),
          users: new Map(),
          createdAt: Date.now(),
        };
        return service.setSession(`test-session-${i}`, session);
      });

      await Promise.all(promises);
      const endTime = performance.now();
      const averageTime = (endTime - startTime) / operations;

      expect(averageTime).toBeLessThan(1); // Each operation should take less than 1ms
      expect(mockRedis.set).toHaveBeenCalledTimes(operations);
    });

    it('should handle concurrent session reads efficiently', async () => {
      const operations = 1000;
      const startTime = performance.now();

      mockRedis.get.mockResolvedValue(JSON.stringify({
        id: 'test-session',
        content: 'test content',
        language: 'javascript',
        lastActive: Date.now(),
        users: {},
        createdAt: Date.now(),
      }));

      const promises = Array.from({ length: operations }, (_, i) => 
        service.getSession(`test-session-${i}`)
      );

      await Promise.all(promises);
      const endTime = performance.now();
      const averageTime = (endTime - startTime) / operations;

      expect(averageTime).toBeLessThan(1); // Each operation should take less than 1ms
      expect(mockRedis.get).toHaveBeenCalledTimes(operations);
    });

    it('should handle session updates efficiently', async () => {
      const operations = 1000;
      const startTime = performance.now();

      const promises = Array.from({ length: operations }, (_, i) => 
        service.updateSessionLastActive(`test-session-${i}`)
      );

      await Promise.all(promises);
      const endTime = performance.now();
      const averageTime = (endTime - startTime) / operations;

      expect(averageTime).toBeLessThan(1); // Each operation should take less than 1ms
    });
  });

  describe('Bulk Operations Performance', () => {
    it('should handle bulk session retrieval efficiently', async () => {
      const sessionCount = 1000;
      mockRedis.keys.mockResolvedValue(
        Array.from({ length: sessionCount }, (_, i) => `session:test-session-${i}`)
      );

      mockRedis.get.mockResolvedValue(JSON.stringify({
        id: 'test-session',
        content: 'test content',
        language: 'javascript',
        lastActive: Date.now(),
        users: {},
        createdAt: Date.now(),
      }));

      const startTime = performance.now();
      await service.getAllSessions();
      const endTime = performance.now();
      const totalTime = endTime - startTime;

      expect(totalTime).toBeLessThan(1000); // Should complete within 1 second
      expect(mockRedis.keys).toHaveBeenCalledTimes(1);
      expect(mockRedis.get).toHaveBeenCalledTimes(sessionCount);
    });

    it('should handle concurrent TTL updates efficiently', async () => {
      const operations = 1000;
      const startTime = performance.now();

      const promises = Array.from({ length: operations }, (_, i) => 
        service.setSessionTTL(`test-session-${i}`, 3600)
      );

      await Promise.all(promises);
      const endTime = performance.now();
      const averageTime = (endTime - startTime) / operations;

      expect(averageTime).toBeLessThan(1); // Each operation should take less than 1ms
      expect(mockRedis.expire).toHaveBeenCalledTimes(operations);
    });
  });

  describe('Memory Usage', () => {
    it('should maintain stable memory usage under load', async () => {
      const operations = 1000;
      const initialMemory = process.memoryUsage().heapUsed;

      // Simulate heavy load
      const promises = Array.from({ length: operations }, (_, i) => {
        const session: Session = {
          id: `test-session-${i}`,
          content: 'test content'.repeat(100), // Create larger content
          language: 'javascript',
          lastActive: Date.now(),
          users: new Map(),
          createdAt: Date.now(),
        };
        return service.setSession(`test-session-${i}`, session);
      });

      await Promise.all(promises);
      const finalMemory = process.memoryUsage().heapUsed;

      // Memory increase should be reasonable
      expect(finalMemory - initialMemory).toBeLessThan(50 * 1024 * 1024); // Less than 50MB increase
    });
  });

  describe('Error Recovery Performance', () => {
    it('should handle connection errors quickly', async () => {
      mockRedis.get.mockRejectedValueOnce(new Error('Connection error'));

      const startTime = performance.now();
      try {
        await service.getSession('test-session');
      } catch (error) {
        // Expected error
      }
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(50); // Error handling should be fast
    });
  });
}); 