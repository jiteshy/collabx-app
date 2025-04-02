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
  userCount: number;
}

export interface UserCursor {
  userId: string;
  position: { top: number; left: number };
  color: string;
  username: string;
}

export interface UserSelection {
  userId: string;
  selection: { start: number; end: number };
  color: string;
  username: string;
}

export enum MessageType {
  JOIN = 'JOIN',
  LEAVE = 'LEAVE',
  CONTENT_CHANGE = 'CONTENT_CHANGE',
  LANGUAGE_CHANGE = 'LANGUAGE_CHANGE',
  USER_JOINED = 'USER_JOINED',
  USER_LEFT = 'USER_LEFT',
  CURSOR_MOVE = 'CURSOR_MOVE',
  SELECTION_CHANGE = 'SELECTION_CHANGE',
  ERROR = 'ERROR',
  UNDO_REDO_STACK = 'UNDO_REDO_STACK',
  UNDO = 'UNDO',
  REDO = 'REDO',
  SYNC_RESPONSE = 'SYNC_RESPONSE',
  SYNC_REQUEST = 'SYNC_REQUEST',
}

export interface WebSocketMessage {
  type: MessageType;
  payload: { content: string };
  sessionId: string;
  timestamp: number;
  user?: {
    id: string;
    username: string;
    color: string;
  };
}
