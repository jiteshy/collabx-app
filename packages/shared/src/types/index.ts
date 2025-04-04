export enum MessageType {
  JOIN = 'join',
  LEAVE = 'leave',
  CONTENT_CHANGE = 'content_change',
  LANGUAGE_CHANGE = 'language_change',
  USER_JOINED = 'user_joined',
  USER_LEFT = 'user_left',
  CURSOR_MOVE = 'cursor_move',
  SELECTION_CHANGE = 'selection_change',
  ERROR = 'error',
  UNDO_REDO_STACK = 'undo_redo_stack',
  UNDO = 'undo',
  REDO = 'redo',
  SYNC_RESPONSE = 'sync_response',
  SYNC_REQUEST = 'sync_request',
  TYPING_STATUS = 'typing_status',
}

export interface User {
  id: string;
  username: string;
  color: string;
  lastActive: number;
  sessionId: string;
}

export interface UserCursor {
  position: {
    top: number;
    left: number;
  };
  user: User;
}

export interface UserSelection {
  selection: {
    start: number;
    end: number;
  };
  user: User;
}

export interface Session {
  id: string;
  content: string;
  language: string;
  users: Map<string, User>;
  lastActive: number;
  createdAt: number;
}

export type SocketErrorType =
  | 'SESSION_FULL'
  | 'DUPLICATE_USERNAME'
  | 'CONNECTION_ERROR'
  | 'SYNC_ERROR'
  | 'INVALID_PAYLOAD'
  | 'SERVER_ERROR'
  | 'TIMEOUT_ERROR'
  | 'NETWORK_ERROR';

export interface SocketError {
  type: SocketErrorType;
  message: string;
  code?: number;
  details?: unknown;
}

export interface RateLimitConfig {
  windowMs: number;
  max: number;
  message: string;
}

export interface RateLimitState {
  count: number;
  resetTime: number;
}

export interface ErrorMessage {
  message: string;
  type: string;
}

export interface UserTypingStatus {
  user: User;
  isTyping: boolean;
  lastTyped: number;
}