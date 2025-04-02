import { Injectable } from '@nestjs/common';
import { MessageType } from '../types';

@Injectable()
export class ValidationService {
  private readonly MAX_USERNAME_LENGTH = 30;
  private readonly MAX_CONTENT_LENGTH = 1000000;
  private readonly ALLOWED_LANGUAGES = ['javascript', 'python', 'java', 'cpp', 'csharp', 'ruby', 'php', 'go', 'rust', 'swift'];

  validateSessionId(sessionId: string): { message: string; type: string } | null {
    if (!sessionId) {
      return {
        message: 'Session ID cannot be empty',
        type: 'INVALID_SESSION_ID',
      };
    }

    if (!/^[a-zA-Z0-9-_]+$/.test(sessionId)) {
      return {
        message: 'Session ID can only contain alphanumeric characters, hyphens, and underscores',
        type: 'INVALID_SESSION_ID',
      };
    }

    return null;
  }

  validateUsername(username: string): { message: string; type: string } | null {
    if (!username) {
      return {
        message: 'Username cannot be empty',
        type: 'INVALID_USERNAME',
      };
    }

    if (username.length > this.MAX_USERNAME_LENGTH) {
      return {
        message: 'Username cannot exceed 30 characters',
        type: 'INVALID_USERNAME',
      };
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return {
        message: 'Username can only contain alphanumeric characters and underscores',
        type: 'INVALID_USERNAME',
      };
    }

    return null;
  }

  async validateEventPayload(event: MessageType, payload: any): Promise<{ message: string; type: string } | null> {
    switch (event) {
      case MessageType.JOIN:
        return this.validateUsername(payload.username);
      case MessageType.CONTENT_CHANGE:
        if (payload.content.length > this.MAX_CONTENT_LENGTH) {
          return {
            message: 'Content cannot exceed 1000000 characters',
            type: 'CONTENT_TOO_LARGE',
          };
        }
        return null;
      case MessageType.LANGUAGE_CHANGE:
        if (!this.ALLOWED_LANGUAGES.includes(payload.language)) {
          return {
            message: 'Unsupported programming language',
            type: 'INVALID_LANGUAGE',
          };
        }
        return null;
      case MessageType.CURSOR_MOVE:
        if (payload.position.top < 0 || payload.position.left < 0) {
          return {
            message: 'Invalid cursor position',
            type: 'INVALID_CURSOR_POSITION',
          };
        }
        return null;
      case MessageType.SELECTION_CHANGE:
        if (payload.selection.start > payload.selection.end) {
          return {
            message: 'Selection start cannot be greater than end',
            type: 'INVALID_SELECTION',
          };
        }
        return null;
      default:
        return null;
    }
  }
} 