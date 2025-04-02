import { useEffect, useRef, useCallback, useState } from 'react';
import { SocketService } from '@/lib/services/socket';
import { useEditorStore } from '@/lib/stores/editorStore';
import { useUserStore } from '@/lib/stores/userStore';
import { MessageType } from '@/types';
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
      updateCursor,
      updateSelection,
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
    if (!sessionId || !username) {
      console.warn('Missing required parameters for socket connection');
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
