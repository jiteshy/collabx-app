import { Module } from '@nestjs/common';
import { RateLimiter } from './rate-limiter';
import { RedisRateLimiter } from './redis-rate-limiter';

@Module({
  providers: [RateLimiter, RedisRateLimiter],
  exports: [RateLimiter, RedisRateLimiter],
})
export class RateLimitModule {} 