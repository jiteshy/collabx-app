import { MessageType, User } from '@collabx/shared';

export interface WebSocketMessage {
  type: MessageType;
  payload: { content: string };
  sessionId: string;
  timestamp: number;
  user?: Pick<User, 'id' | 'username' | 'color'>;
}
