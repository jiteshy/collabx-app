import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { MessageType } from '../types';
import { SessionService } from '../services/session.service';
import { RedisRateLimiter } from '../rate-limit/redis-rate-limiter';
import { JoinMessageDto, ContentChangeMessageDto, LanguageChangeMessageDto, CursorMoveMessageDto } from '../dto/messages.dto';
import { ValidationService } from '../validation/validation.service';
import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';

@Injectable()
@WebSocketGateway({
  cors: {
    origin: ['http://localhost:3002'],
    methods: ['GET', 'POST'],
    credentials: true,
  },
  path: '/api/ws',
  serveClient: false,
  transports: ['websocket', 'polling'],
  pingInterval: 10000,
  pingTimeout: 5000,
  cookie: false,
  allowEIO3: true,
})
export class CollabGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly sessionService: SessionService,
    private readonly rateLimiter: RedisRateLimiter,
    private readonly validationService: ValidationService,
    private readonly configService: ConfigService,
  ) {}

  async handleConnection(socket: Socket): Promise<void> {
    const sessionId = socket.handshake?.query.sessionId as string;
    const validationError = this.validationService.validateSessionId(sessionId);

    if (validationError) {
      socket.emit(MessageType.ERROR, validationError);
      socket.disconnect();
      return;
    }

    const rateLimitResult = await this.rateLimiter.isRateLimited(socket, MessageType.JOIN);
    if (rateLimitResult.limited) {
      socket.emit(MessageType.ERROR, {
        message: rateLimitResult.message,
        type: 'RATE_LIMIT_EXCEEDED',
      });
      socket.disconnect();
      return;
    }

    socket.join(sessionId);
  }

  async handleDisconnect(socket: Socket): Promise<void> {
    const sessionId = socket.handshake?.query.sessionId as string;
    const userId = socket.data.userId as string;

    await this.sessionService.removeUserFromSession(sessionId, userId);
    await this.rateLimiter.clear(socket);

    socket.to(sessionId).emit(MessageType.USER_LEFT, { userId });
  }

  @SubscribeMessage(MessageType.JOIN)
  async handleJoin(socket: Socket, payload: JoinMessageDto): Promise<void> {
    const { sessionId, username } = payload;

    try {
      const session = await this.sessionService.getOrCreateSession(sessionId);
      const user = await this.sessionService.addUserToSession(sessionId, username);

      socket.data.userId = user.id;

      socket.emit(MessageType.SYNC_RESPONSE, {
        content: session.content,
        language: session.language,
        users: Array.from(session.users.values()),
      });

      socket.to(sessionId).emit(MessageType.USER_JOINED, { user });
    } catch (error) {
      socket.emit(MessageType.ERROR, {
        message: error.message,
        type: 'DUPLICATE_USERNAME',
      });
    }
  }

  @SubscribeMessage(MessageType.CONTENT_CHANGE)
  async handleContentChange(socket: Socket, payload: ContentChangeMessageDto): Promise<void> {
    const { sessionId, content } = payload;
    const userId = socket.data.userId as string;

    const session = await this.sessionService.getOrCreateSession(sessionId);
    await this.sessionService.updateSessionContent(sessionId, content);

    socket.to(sessionId).emit(MessageType.CONTENT_CHANGE, {
      content,
      user: session.users.get(userId),
    });
  }

  @SubscribeMessage(MessageType.LANGUAGE_CHANGE)
  async handleLanguageChange(socket: Socket, payload: LanguageChangeMessageDto): Promise<void> {
    const { sessionId, language } = payload;
    const userId = socket.data.userId as string;

    const session = await this.sessionService.getOrCreateSession(sessionId);
    await this.sessionService.updateSessionLanguage(sessionId, language);

    socket.to(sessionId).emit(MessageType.LANGUAGE_CHANGE, {
      language,
      user: session.users.get(userId),
    });
  }

  @SubscribeMessage(MessageType.CURSOR_MOVE)
  async handleCursorMove(socket: Socket, payload: CursorMoveMessageDto): Promise<void> {
    const { sessionId, position } = payload;
    const userId = socket.data.userId as string;

    const session = await this.sessionService.getOrCreateSession(sessionId);

    socket.to(sessionId).emit(MessageType.CURSOR_MOVE, {
      position,
      user: session.users.get(userId),
    });
  }
} 