import { Module } from '@nestjs/common';
import { RedisService } from '../services/redis.service';
import { SessionService } from '../services/session.service';

@Module({
  providers: [RedisService, SessionService],
  exports: [SessionService],
})
export class SessionModule {}
