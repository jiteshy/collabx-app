import { MessageType, SocketError, SocketErrorType } from '../types';

export class ValidationService {
  static validateSessionId(sessionId: string): SocketError | null {
    if (!sessionId || typeof sessionId !== 'string') {
      return {
        type: 'INVALID_PAYLOAD',
        message: 'Invalid session ID',
      };
    }
    return null;
  }

  static validateUsername(username: string): SocketError | null {
    if (!username || typeof username !== 'string') {
      return {
        type: 'INVALID_PAYLOAD',
        message: 'Invalid username',
      };
    }
    if (username.length < 3 || username.length > 20) {
      return {
        type: 'INVALID_PAYLOAD',
        message: 'Username must be between 3 and 20 characters',
      };
    }
    return null;
  }

  static validateEventPayload(type: MessageType, payload: unknown): SocketError | null {
    switch (type) {
      case MessageType.JOIN:
        if (!payload || typeof payload !== 'object' || !('username' in payload)) {
          return {
            type: 'INVALID_PAYLOAD',
            message: 'Invalid join payload',
          };
        }
        return this.validateUsername((payload as { username: string }).username);

      case MessageType.CONTENT_CHANGE:
        if (!payload || typeof payload !== 'object' || !('content' in payload)) {
          return {
            type: 'INVALID_PAYLOAD',
            message: 'Invalid content change payload',
          };
        }
        if (typeof (payload as { content: string }).content !== 'string') {
          return {
            type: 'INVALID_PAYLOAD',
            message: 'Content must be a string',
          };
        }
        return null;

      case MessageType.LANGUAGE_CHANGE:
        if (!payload || typeof payload !== 'object' || !('language' in payload)) {
          return {
            type: 'INVALID_PAYLOAD',
            message: 'Invalid language change payload',
          };
        }
        if (typeof (payload as { language: string }).language !== 'string') {
          return {
            type: 'INVALID_PAYLOAD',
            message: 'Language must be a string',
          };
        }
        return null;

      case MessageType.CURSOR_MOVE:
        if (!payload || typeof payload !== 'object' || !('position' in payload)) {
          return {
            type: 'INVALID_PAYLOAD',
            message: 'Invalid cursor move payload',
          };
        }
        const position = (payload as { position: { top: number; left: number } }).position;
        if (!position || typeof position.top !== 'number' || typeof position.left !== 'number') {
          return {
            type: 'INVALID_PAYLOAD',
            message: 'Invalid cursor position',
          };
        }
        return null;

      case MessageType.SELECTION_CHANGE:
        if (!payload || typeof payload !== 'object' || !('selection' in payload)) {
          return {
            type: 'INVALID_PAYLOAD',
            message: 'Invalid selection change payload',
          };
        }
        const selection = (payload as { selection: { start: number; end: number } }).selection;
        if (!selection || typeof selection.start !== 'number' || typeof selection.end !== 'number') {
          return {
            type: 'INVALID_PAYLOAD',
            message: 'Invalid selection range',
          };
        }
        return null;

      default:
        return null;
    }
  }
} 