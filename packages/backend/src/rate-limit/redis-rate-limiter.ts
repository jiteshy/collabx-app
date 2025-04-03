import { Injectable, Inject } from '@nestjs/common';
import { Redis } from 'ioredis';
import { Socket } from 'socket.io';
import { MessageType } from '@collabx/shared';

@Injectable()
export class RedisRateLimiter {
  private readonly windowMs = 300000; // 5 minutes
  private readonly maxRequests = 10;

  constructor(@Inject('REDIS_CLIENT') private readonly redis: Redis) {}

  async isRateLimited(
    socket: Socket,
    eventType: MessageType,
  ): Promise<{ limited: boolean; message?: string }> {
    try {
      const key = `rate_limit:${eventType}:${socket.handshake?.query.sessionId}`;
      const multi = this.redis.multi();
      multi.get(key);
      multi.ttl(key);

      const [[count, ttl]] = (await multi.exec()) as [[null | string, number]];

      if (!count || ttl < 0) {
        await this.redis.set(key, '1', 'EX', this.windowMs / 1000);
        return { limited: false };
      }

      const currentCount = parseInt(count, 10);
      if (currentCount >= this.maxRequests) {
        return { limited: true, message: 'Rate limit exceeded' };
      }

      await this.redis.set(
        key,
        (currentCount + 1).toString(),
        'EX',
        this.windowMs / 1000,
      );
      return { limited: false };
    } catch (error) {
      return { limited: false, message: 'Error checking rate limit' };
    }
  }

  async clear(socket: Socket): Promise<void> {
    try {
      const key = `rate_limit:${MessageType.JOIN}:${socket.handshake?.query.sessionId}`;
      await this.redis.del(key);
    } catch (error) {
      // Silently handle Redis errors
    }
  }
}
