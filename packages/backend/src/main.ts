import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MessageType, RateLimiter } from '@collabx/shared';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe());

  // CORS configuration
  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    methods: ['GET', 'POST', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Rate limiting configuration
  const rateLimiter = new RateLimiter();
  rateLimiter.addLimit(MessageType.CONTENT_CHANGE, {
    windowMs: 1000, // 1 second
    max: 10, // 10 events per second
    message: 'Too many content changes. Please wait a moment.',
  });

  rateLimiter.addLimit(MessageType.CURSOR_MOVE, {
    windowMs: 100, // 100ms
    max: 30, // 30 events per 100ms
    message: 'Too many cursor movements. Please wait a moment.',
  });

  // Start the server
  const port = configService.get('PORT', 3001);
  await app.listen(port);
  console.log(`Server is running on port ${port}`);
}

bootstrap();
