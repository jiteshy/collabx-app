export enum MessageType {
  JOIN = 'join',
  LEAVE = 'leave',
  CONTENT_CHANGE = 'content_change',
  CURSOR_MOVE = 'cursor_move',
  SELECTION_CHANGE = 'selection_change',
  LANGUAGE_CHANGE = 'language_change',
  ERROR = 'error',
  SYNC_REQUEST = 'sync_request',
  SYNC_RESPONSE = 'sync_response',
  USER_JOINED = 'user_joined',
  USER_LEFT = 'user_left',
}

export interface User {
  id: string;
  username: string;
  color: string;
  lastActive: number;
  sessionId: string;
}

export interface Session {
  id: string;
  content: string;
  language: string;
  lastActive: number;
  users: Map<string, User>;
}

export interface ErrorMessage {
  message: string;
  type: string;
}

export interface ContentChangeMessage {
  content: string;
  sessionId: string;
}

export interface CursorMoveMessage {
  position: number;
  sessionId: string;
  userId: string;
}

export interface SelectionChangeMessage {
  selection: {
    start: number;
    end: number;
  };
  sessionId: string;
  userId: string;
}

export interface LanguageChangeMessage {
  language: string;
  sessionId: string;
}

export interface JoinMessage {
  username: string;
  sessionId: string;
}

export interface LeaveMessage {
  sessionId: string;
  userId: string;
} 