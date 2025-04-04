import { User, UserCursor, UserSelection, MessageType, UserTypingStatus } from '@collabx/shared';

export interface SocketPayloads {
  [MessageType.JOIN]: { user: User };
  [MessageType.LEAVE]: never;
  [MessageType.CONTENT_CHANGE]: { content: string; user: User };
  [MessageType.LANGUAGE_CHANGE]: { language: string; user: User };
  [MessageType.USER_JOINED]: { user: User };
  [MessageType.USER_LEFT]: { user: User };
  [MessageType.CURSOR_MOVE]: { position: { top: number; left: number }; user: User };
  [MessageType.SELECTION_CHANGE]: { selection: { start: number; end: number }; user: User };
  [MessageType.ERROR]: {
    type: SocketErrorType;
    message: string;
    details?: unknown;
  };
  [MessageType.UNDO_REDO_STACK]: never;
  [MessageType.UNDO]: never;
  [MessageType.REDO]: never;
  [MessageType.SYNC_RESPONSE]: { content: string; language: string; users: User[] };
  [MessageType.SYNC_REQUEST]: never;
  [MessageType.TYPING_STATUS]: { user: User; isTyping: boolean };
}

export type SocketEvents = {
  [MessageType.JOIN]: (payload: SocketPayloads[MessageType.JOIN]) => void;
  [MessageType.LEAVE]: (payload: SocketPayloads[MessageType.LEAVE]) => void;
  [MessageType.CONTENT_CHANGE]: (payload: SocketPayloads[MessageType.CONTENT_CHANGE]) => void;
  [MessageType.LANGUAGE_CHANGE]: (payload: SocketPayloads[MessageType.LANGUAGE_CHANGE]) => void;
  [MessageType.USER_JOINED]: (payload: SocketPayloads[MessageType.USER_JOINED]) => void;
  [MessageType.USER_LEFT]: (payload: SocketPayloads[MessageType.USER_LEFT]) => void;
  [MessageType.CURSOR_MOVE]: (payload: SocketPayloads[MessageType.CURSOR_MOVE]) => void;
  [MessageType.SELECTION_CHANGE]: (payload: SocketPayloads[MessageType.SELECTION_CHANGE]) => void;
  [MessageType.ERROR]: (payload: SocketPayloads[MessageType.ERROR]) => void;
  [MessageType.UNDO_REDO_STACK]: (payload: SocketPayloads[MessageType.UNDO_REDO_STACK]) => void;
  [MessageType.UNDO]: (payload: SocketPayloads[MessageType.UNDO]) => void;
  [MessageType.REDO]: (payload: SocketPayloads[MessageType.REDO]) => void;
  [MessageType.SYNC_RESPONSE]: (payload: SocketPayloads[MessageType.SYNC_RESPONSE]) => void;
  [MessageType.SYNC_REQUEST]: (payload: SocketPayloads[MessageType.SYNC_REQUEST]) => void;
  [MessageType.TYPING_STATUS]: (payload: SocketPayloads[MessageType.TYPING_STATUS]) => void;
};

export interface StoreHandlers {
  setContent: (content: string) => void;
  setLanguage: (language: string) => void;
  setError: (error: string) => void;
  resetEditor: () => void;
  addUser: (user: User) => void;
  removeUser: (userId: string) => void;
  updateCursor: (cursor: UserCursor) => void;
  updateSelection: (selection: UserSelection) => void;
  resetUser: () => void;
  onSessionFull: () => void;
  updateTypingStatus: (userId: string, status: UserTypingStatus) => void;
  removeTypingStatus: (userId: string) => void;
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

export interface ErrorRecoveryOptions {
  maxRetries: number;
  retryDelay: number;
  backoffFactor: number;
  maxRetryDelay: number;
}

export interface SocketConnectionState {
  reconnectAttempts: number;
  maxReconnectAttempts: number;
  isInitialConnection: boolean;
  isConnecting: boolean;
  isDisconnecting: boolean;
  lastError?: SocketError;
  lastSuccessfulConnection?: Date;
}
