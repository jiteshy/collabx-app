import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { MessageType, User } from '@collabx/shared';
import { ValidationService } from '@collabx/shared';
import { RateLimiter } from '@collabx/shared';
import { SessionService } from '@collabx/shared';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    methods: ['GET', 'POST', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
  },
  path: '/api/ws',
  serveClient: false,
  transports: ['websocket', 'polling'],
  pingInterval: 10000,
  pingTimeout: 5000,
  cookie: false,
  allowEIO3: true,
  namespace: '/',
  connectTimeout: 45000,
  maxHttpBufferSize: 1e8,
})
export class EditorGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private rateLimiter: RateLimiter;
  private sessionService: SessionService;

  constructor(private configService: ConfigService) {
    this.rateLimiter = new RateLimiter();
    this.sessionService = new SessionService();

    // Initialize rate limits
    this.rateLimiter.addLimit(MessageType.JOIN, {
      windowMs: 60000, // 1 minute
      max: 5, // 5 attempts per minute
      message: 'Too many join attempts. Please try again later.',
    });
  }

  async handleConnection(client: Socket) {
    console.log('Client connected:', client.id);
    console.log('Client handshake:', client.handshake);
    
    const sessionId = client.handshake.query.sessionId as string;
    if (!sessionId) {
      console.log('No session ID provided');
      client.emit(MessageType.ERROR, { message: 'Session ID is required' });
      client.disconnect();
      return;
    }

    console.log('Session ID received:', sessionId);

    const validationError = ValidationService.validateSessionId(sessionId);
    if (validationError) {
      console.log('Session ID validation error:', validationError);
      client.emit(MessageType.ERROR, validationError);
      client.disconnect();
      return;
    }

    // Create or get session
    let session = this.sessionService.getSession(sessionId);
    if (!session) {
      console.log('Creating new session:', sessionId);
      session = this.sessionService.createSession(sessionId);
    }

    client.join(sessionId);
    console.log('Client joined session:', sessionId);

    // Send initial sync response
    const response = {
      content: session.content,
      language: session.language,
      users: Array.from(session.users.values()),
    };
    console.log('Sending initial sync response:', response);
    client.emit(MessageType.SYNC_RESPONSE, response);
  }

  handleDisconnect(client: Socket) {
    const sessionId = client.handshake.query.sessionId as string;
    const userId = client.data.userId;
    
    if (userId) {
      this.sessionService.removeUserFromSession(sessionId, userId);
      client.to(sessionId).emit(MessageType.USER_LEFT, { userId });
    }
  }

  @SubscribeMessage(MessageType.JOIN)
  handleJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { username: string },
    callback?: (response: { user: User }) => void,
  ) {
    console.log('Join request received:', { 
      clientId: client.id, 
      username: payload.username,
      sessionId: client.handshake.query.sessionId,
      socketData: client.data,
      timestamp: new Date().toISOString()
    });
    
    const sessionId = client.handshake.query.sessionId as string;
    if (!sessionId) {
      console.error('No session ID in JOIN request');
      client.emit(MessageType.ERROR, { message: 'Session ID is required' });
      return;
    }

    const validationError = ValidationService.validateEventPayload(MessageType.JOIN, payload);
    if (validationError) {
      console.error('Validation error in JOIN request:', validationError);
      client.emit(MessageType.ERROR, validationError);
      return;
    }

    // Check rate limit
    const { limited, message } = this.rateLimiter.isRateLimited(client.id, MessageType.JOIN);
    if (limited) {
      console.error('Rate limit exceeded:', { clientId: client.id, message });
      client.emit(MessageType.ERROR, {
        type: 'RATE_LIMIT_EXCEEDED',
        message: message || 'Too many join attempts. Please try again later.',
      });
      return;
    }

    // Create user
    const user: User = {
      id: client.id,
      username: payload.username,
      color: this.generateUserColor(),
      lastActive: Date.now(),
      sessionId,
    };
    console.log('Created user:', user);

    // Add user to session
    const error = this.sessionService.addUserToSession(sessionId, user);
    if (error) {
      console.error('Error adding user to session:', error);
      client.emit(MessageType.ERROR, error);
      return;
    }

    // Store user ID in socket data
    client.data.userId = user.id;
    console.log('Stored user ID in socket data:', client.data);

    // Send JOIN response to the client
    console.log('Sending JOIN response to client:', { user });
    client.emit(MessageType.JOIN, { user });
    if (typeof callback === 'function') {
      callback({ user });
    }

    // Broadcast user joined to all clients in the session
    console.log('Broadcasting USER_JOINED event to session:', sessionId);
    client.to(sessionId).emit(MessageType.USER_JOINED, { user });

    // Send updated user list to all clients
    const session = this.sessionService.getSession(sessionId);
    if (session) {
      console.log('Sending SYNC_RESPONSE to all clients in session:', {
        content: session.content,
        language: session.language,
        users: Array.from(session.users.values())
      });
      this.server.to(sessionId).emit(MessageType.SYNC_RESPONSE, {
        content: session.content,
        language: session.language,
        users: Array.from(session.users.values()),
      });
    }
  }

  @SubscribeMessage(MessageType.CONTENT_CHANGE)
  handleContentChange(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { content: string },
  ) {
    const sessionId = client.handshake.query.sessionId as string;
    const validationError = ValidationService.validateEventPayload(MessageType.CONTENT_CHANGE, payload);
    
    if (validationError) {
      client.emit(MessageType.ERROR, validationError);
      return;
    }

    const { limited, message } = this.rateLimiter.isRateLimited(client.id, MessageType.CONTENT_CHANGE);
    if (limited) {
      client.emit(MessageType.ERROR, {
        type: 'RATE_LIMIT_EXCEEDED',
        message,
      });
      return;
    }

    this.sessionService.updateSessionContent(sessionId, payload.content);
    const user = this.getUserFromSocket(client);
    if (user) {
      client.to(sessionId).emit(MessageType.CONTENT_CHANGE, {
        content: payload.content,
        user,
      });
    }
  }

  @SubscribeMessage(MessageType.LANGUAGE_CHANGE)
  handleLanguageChange(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { language: string },
  ) {
    const sessionId = client.handshake.query.sessionId as string;
    const validationError = ValidationService.validateEventPayload(MessageType.LANGUAGE_CHANGE, payload);
    
    if (validationError) {
      client.emit(MessageType.ERROR, validationError);
      return;
    }

    this.sessionService.updateSessionLanguage(sessionId, payload.language);
    const user = this.getUserFromSocket(client);
    if (user) {
      client.to(sessionId).emit(MessageType.LANGUAGE_CHANGE, {
        language: payload.language,
        user,
      });
    }
  }

  @SubscribeMessage(MessageType.CURSOR_MOVE)
  handleCursorMove(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { position: { top: number; left: number } },
  ) {
    const sessionId = client.handshake.query.sessionId as string;
    const validationError = ValidationService.validateEventPayload(MessageType.CURSOR_MOVE, payload);
    
    if (validationError) {
      client.emit(MessageType.ERROR, validationError);
      return;
    }

    const { limited, message } = this.rateLimiter.isRateLimited(client.id, MessageType.CURSOR_MOVE);
    if (limited) {
      client.emit(MessageType.ERROR, {
        type: 'RATE_LIMIT_EXCEEDED',
        message,
      });
      return;
    }

    const user = this.getUserFromSocket(client);
    if (user) {
      client.to(sessionId).emit(MessageType.CURSOR_MOVE, {
        position: payload.position,
        user,
      });
    }
  }

  @SubscribeMessage(MessageType.SELECTION_CHANGE)
  handleSelectionChange(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { selection: { start: number; end: number } },
  ) {
    const sessionId = client.handshake.query.sessionId as string;
    const validationError = ValidationService.validateEventPayload(MessageType.SELECTION_CHANGE, payload);
    
    if (validationError) {
      client.emit(MessageType.ERROR, validationError);
      return;
    }

    const user = this.getUserFromSocket(client);
    if (user) {
      client.to(sessionId).emit(MessageType.SELECTION_CHANGE, {
        selection: payload.selection,
        user,
      });
    }
  }

  @SubscribeMessage(MessageType.SYNC_REQUEST)
  handleSyncRequest(@ConnectedSocket() client: Socket) {
    console.log('Sync request received from client:', client.id);
    
    const sessionId = client.handshake.query.sessionId as string;
    const session = this.sessionService.getSession(sessionId);
    
    if (session) {
      console.log('Sending sync response with users:', Array.from(session.users.values()));
      client.emit(MessageType.SYNC_RESPONSE, {
        content: session.content,
        language: session.language,
        users: Array.from(session.users.values()),
      });
    } else {
      console.log('No session found for sync request');
    }
  }

  private getUserFromSocket(client: Socket) {
    const sessionId = client.handshake.query.sessionId as string;
    const userId = client.data.userId;
    const session = this.sessionService.getSession(sessionId);
    return session?.users.get(userId);
  }

  private generateUserColor(): string {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD',
      '#D4A5A5', '#9B59B6', '#3498DB', '#E67E22', '#1ABC9C',
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }
} 