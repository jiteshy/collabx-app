import { Test, TestingModule } from '@nestjs/testing';
import { ValidationService } from './validation.service';
import { MessageType } from '../types';

describe('ValidationService', () => {
  let service: ValidationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ValidationService],
    }).compile();

    service = module.get<ValidationService>(ValidationService);
  });

  describe('validateSessionId', () => {
    it('should return null for valid session ID', () => {
      const result = service.validateSessionId('valid-session-123');
      expect(result).toBeNull();
    });

    it('should return error for empty session ID', () => {
      const result = service.validateSessionId('');
      expect(result).toEqual({
        message: 'Session ID cannot be empty',
        type: 'INVALID_SESSION_ID',
      });
    });

    it('should return error for invalid session ID format', () => {
      const result = service.validateSessionId('invalid@session');
      expect(result).toEqual({
        message: 'Session ID can only contain alphanumeric characters, hyphens, and underscores',
        type: 'INVALID_SESSION_ID',
      });
    });
  });

  describe('validateUsername', () => {
    it('should return null for valid username', () => {
      const result = service.validateUsername('valid_user123');
      expect(result).toBeNull();
    });

    it('should return error for empty username', () => {
      const result = service.validateUsername('');
      expect(result).toEqual({
        message: 'Username cannot be empty',
        type: 'INVALID_USERNAME',
      });
    });

    it('should return error for username with invalid characters', () => {
      const result = service.validateUsername('invalid@user');
      expect(result).toEqual({
        message: 'Username can only contain alphanumeric characters and underscores',
        type: 'INVALID_USERNAME',
      });
    });

    it('should return error for username exceeding max length', () => {
      const longUsername = 'a'.repeat(31);
      const result = service.validateUsername(longUsername);
      expect(result).toEqual({
        message: 'Username cannot exceed 30 characters',
        type: 'INVALID_USERNAME',
      });
    });
  });

  describe('validateEventPayload', () => {
    it('should return null for valid join payload', async () => {
      const payload = { username: 'test_user' };
      const result = await service.validateEventPayload(MessageType.JOIN, payload);
      expect(result).toBeNull();
    });

    it('should return error for invalid join payload', async () => {
      const payload = {
        username: '',
        sessionId: 'test-session'
      };

      const result = await service.validateEventPayload(MessageType.JOIN, payload);
      expect(result).toBeTruthy();
      expect(result?.type).toBe('INVALID_USERNAME');
    });

    it('should return null for valid content change payload', async () => {
      const payload = { content: 'test content' };
      const result = await service.validateEventPayload(MessageType.CONTENT_CHANGE, payload);
      expect(result).toBeNull();
    });

    it('should return error for content exceeding max length', async () => {
      const payload = { content: 'a'.repeat(1000001) };
      const result = await service.validateEventPayload(MessageType.CONTENT_CHANGE, payload);
      expect(result).toEqual({
        message: 'Content cannot exceed 1000000 characters',
        type: 'CONTENT_TOO_LARGE',
      });
    });

    it('should return null for valid language change payload', async () => {
      const payload = { language: 'javascript' };
      const result = await service.validateEventPayload(MessageType.LANGUAGE_CHANGE, payload);
      expect(result).toBeNull();
    });

    it('should return error for unsupported language', async () => {
      const payload = { language: 'unsupported' };
      const result = await service.validateEventPayload(MessageType.LANGUAGE_CHANGE, payload);
      expect(result).toEqual({
        message: 'Unsupported programming language',
        type: 'INVALID_LANGUAGE',
      });
    });

    it('should return null for valid cursor move payload', async () => {
      const payload = { position: { top: 10, left: 20 } };
      const result = await service.validateEventPayload(MessageType.CURSOR_MOVE, payload);
      expect(result).toBeNull();
    });

    it('should return error for invalid cursor position', async () => {
      const payload = { position: { top: -1, left: 20 } };
      const result = await service.validateEventPayload(MessageType.CURSOR_MOVE, payload);
      expect(result).toEqual({
        message: 'Invalid cursor position',
        type: 'INVALID_CURSOR_POSITION',
      });
    });

    it('should return null for valid selection change payload', async () => {
      const payload = { selection: { start: 0, end: 10 } };
      const result = await service.validateEventPayload(MessageType.SELECTION_CHANGE, payload);
      expect(result).toBeNull();
    });

    it('should return error for invalid selection range', async () => {
      const payload = { selection: { start: 10, end: 5 } };
      const result = await service.validateEventPayload(MessageType.SELECTION_CHANGE, payload);
      expect(result).toEqual({
        message: 'Selection start cannot be greater than end',
        type: 'INVALID_SELECTION',
      });
    });
  });
}); 