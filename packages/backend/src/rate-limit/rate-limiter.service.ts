import { Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';
import { RedisRateLimiter } from './redis-rate-limiter';
import { MessageType } from '../types';

@Injectable()
export class RateLimiterService {
  constructor(private readonly redisRateLimiter: RedisRateLimiter) {}

  async isRateLimited(socket: Socket, event: MessageType): Promise<{ limited: boolean; message?: string }> {
    return this.redisRateLimiter.isRateLimited(socket, event);
  }

  async clear(socket: Socket): Promise<void> {
    await this.redisRateLimiter.clear(socket);
  }
} 