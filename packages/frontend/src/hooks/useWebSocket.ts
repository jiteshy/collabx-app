import { useEffect, useRef, useCallback, useState } from 'react';
import { SocketService } from '@/lib/services/socket';
import { useEditorStore } from '@/lib/stores/editorStore';
import { useUserStore } from '@/lib/stores/userStore';
import { MessageType, UserCursor as SharedUserCursor, UserSelection as SharedUserSelection } from '@collabx/shared';
import { UserCursor, UserSelection } from '@/types';
import { SocketPayloads } from '@/lib/services/socket/types';

export const useWebSocket = (sessionId: string, username: string) => {
  const socketServiceRef = useRef<SocketService | null>(null);
  const [isSessionFull, setIsSessionFull] = useState(false);
  const { setContent, setLanguage, setError, reset: resetEditor } = useEditorStore();
  const { addUser, removeUser, updateCursor, updateSelection, reset: resetUser } = useUserStore();

  const handleError = useCallback(
    (message: string) => {
      console.error('Socket error:', message);
      setError(message);
    },
    [setError],
  );

  // Create store handlers once
  const storeHandlers = useCallback(
    () => ({
      setContent,
      setLanguage,
      setError,
      resetEditor,
      addUser,
      removeUser,
      updateCursor: (sharedCursor: SharedUserCursor) => {
        const cursor: UserCursor = {
          userId: sharedCursor.user.id,
          position: sharedCursor.position,
          color: sharedCursor.user.color,
          username: sharedCursor.user.username,
        };
        updateCursor(cursor);
      },
      updateSelection: (sharedSelection: SharedUserSelection) => {
        const selection: UserSelection = {
          userId: sharedSelection.user.id,
          selection: sharedSelection.selection,
          color: sharedSelection.user.color,
          username: sharedSelection.user.username,
        };
        updateSelection(selection);
      },
      resetUser,
      onSessionFull: () => setIsSessionFull(true),
    }),
    [
      setContent,
      setLanguage,
      setError,
      resetEditor,
      addUser,
      removeUser,
      updateCursor,
      updateSelection,
      resetUser,
    ],
  );

  useEffect(() => {
    if (!sessionId) {
      console.warn('Missing sessionId for socket connection');
      return;
    }

    // Clean up existing socket service if it exists
    if (socketServiceRef.current) {
      socketServiceRef.current.disconnect();
      socketServiceRef.current = null;
    }

    // Create new socket service
    socketServiceRef.current = new SocketService(sessionId, username, handleError, storeHandlers());

    // Connect socket
    socketServiceRef.current.connect();

    // Cleanup function
    return () => {
      if (socketServiceRef.current) {
        socketServiceRef.current.disconnect();
        socketServiceRef.current = null;
      }
    };
  }, [sessionId, username, handleError, storeHandlers]);

  const sendMessage = useCallback((type: MessageType, payload: { content: string }) => {
    if (socketServiceRef.current) {
      socketServiceRef.current.sendMessage(type, payload as SocketPayloads[MessageType]);
    }
  }, []);

  return { sendMessage, isSessionFull, setIsSessionFull };
};
