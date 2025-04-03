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
