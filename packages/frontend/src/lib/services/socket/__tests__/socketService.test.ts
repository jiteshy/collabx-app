import { SocketService } from '../socketService';
import { MessageType, User } from '@/types';
import { expect } from '@jest/globals';

// Mock socket.io-client
jest.mock('socket.io-client', () => ({
  Manager: jest.fn().mockImplementation(() => ({
    socket: jest.fn().mockReturnValue({
      on: jest.fn(),
      emit: jest.fn(),
      connect: jest.fn(),
      disconnect: jest.fn(),
      connected: false,
      removeAllListeners: jest.fn(),
    }),
    removeAllListeners: jest.fn(),
  })),
}));

describe('SocketService', () => {
  let socketService: SocketService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockSocket: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockManager: any;
  let mockOnError: jest.Mock;
  const mockStoreHandlers = {
    setContent: jest.fn(),
    setLanguage: jest.fn(),
    setError: jest.fn(),
    resetEditor: jest.fn(),
    addUser: jest.fn(),
    removeUser: jest.fn(),
    updateCursor: jest.fn(),
    updateSelection: jest.fn(),
    resetUser: jest.fn(),
    onSessionFull: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockOnError = jest.fn();
    socketService = new SocketService('test-session', 'testuser', mockOnError, mockStoreHandlers);
  });

  const setupConnection = () => {
    socketService.connect();
    mockSocket = socketService['socket'];
    mockManager = socketService['manager'];
  };

  it('initializes socket connection', () => {
    setupConnection();
    expect(mockSocket.on).toHaveBeenCalledWith('connect', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('disconnect', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('connect_error', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith(MessageType.ERROR, expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith(MessageType.SYNC_RESPONSE, expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith(MessageType.USER_JOINED, expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith(MessageType.USER_LEFT, expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith(MessageType.CONTENT_CHANGE, expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith(MessageType.LANGUAGE_CHANGE, expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith(MessageType.CURSOR_MOVE, expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith(MessageType.SELECTION_CHANGE, expect.any(Function));
  });

  it('connects to socket server', () => {
    setupConnection();
    expect(mockManager).toBeDefined();
    expect(mockSocket).toBeDefined();
  });

  it('disconnects from socket server', () => {
    setupConnection();

    // Simulate successful connection first
    const connectHandler = mockSocket.on.mock.calls.find(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (call: any[]) => call[0] === 'connect',
    )[1];
    connectHandler();

    // Set connected state
    mockSocket.connected = true;

    // Simulate disconnect event
    const disconnectHandler = mockSocket.on.mock.calls.find(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (call: any[]) => call[0] === 'disconnect',
    )[1];
    disconnectHandler();

    // Call disconnect method
    socketService.disconnect();

    // Verify the sequence of calls
    expect(mockSocket.disconnect).toHaveBeenCalled();
  });

  it('sends content change message', () => {
    setupConnection();

    // Simulate successful connection first
    const connectHandler = mockSocket.on.mock.calls.find(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (call: any[]) => call[0] === 'connect',
    )[1];
    connectHandler();

    // Set connected state
    mockSocket.connected = true;

    const content = 'const test = "hello";';
    socketService.sendMessage(MessageType.CONTENT_CHANGE, {
      content,
      user: {
        id: 1,
        username: 'testuser',
        color: '#ff0000',
        lastActive: Date.now(),
        sessionId: 'test-session',
      },
    });
    expect(mockSocket.emit).toHaveBeenCalledWith(MessageType.CONTENT_CHANGE, {
      content,
      user: {
        id: 1,
        username: 'testuser',
        color: '#ff0000',
        lastActive: expect.any(Number),
        sessionId: 'test-session',
      },
    });
  });

  it('sends language change message', () => {
    setupConnection();

    // Simulate successful connection first
    const connectHandler = mockSocket.on.mock.calls.find(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (call: any[]) => call[0] === 'connect',
    )[1];
    connectHandler();

    // Set connected state
    mockSocket.connected = true;

    const language = 'python';
    socketService.sendMessage(MessageType.LANGUAGE_CHANGE, {
      language,
      user: {
        id: 1,
        username: 'testuser',
        color: '#ff0000',
        lastActive: Date.now(),
        sessionId: 'test-session',
      },
    });
    expect(mockSocket.emit).toHaveBeenCalledWith(MessageType.LANGUAGE_CHANGE, {
      language,
      user: {
        id: 1,
        username: 'testuser',
        color: '#ff0000',
        lastActive: expect.any(Number),
        sessionId: 'test-session',
      },
    });
  });

  it('handles sync response', () => {
    setupConnection();
    const mockHandler = mockSocket.on.mock.calls.find(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (call: any[]) => call[0] === MessageType.SYNC_RESPONSE,
    )[1];

    const mockUser: User = {
      id: 1,
      username: 'testuser',
      color: '#ff0000',
      lastActive: Date.now(),
      sessionId: 'test-session',
    };

    mockHandler({
      content: 'test content',
      language: 'javascript',
      users: [mockUser],
    });

    expect(mockStoreHandlers.setContent).toHaveBeenCalledWith('test content');
    expect(mockStoreHandlers.setLanguage).toHaveBeenCalledWith('javascript');
    expect(mockStoreHandlers.addUser).toHaveBeenCalledWith(mockUser);
  });

  it('handles user joined event', () => {
    setupConnection();
    const mockHandler = mockSocket.on.mock.calls.find(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (call: any[]) => call[0] === MessageType.USER_JOINED,
    )[1];

    const user: User = {
      id: 2,
      username: 'newuser',
      color: '#00ff00',
      lastActive: Date.now(),
      sessionId: 'test-session',
    };
    mockHandler({ user });
    expect(mockStoreHandlers.addUser).toHaveBeenCalledWith(user);
  });

  it('handles user left event', () => {
    setupConnection();
    const mockHandler = mockSocket.on.mock.calls.find(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (call: any[]) => call[0] === MessageType.USER_LEFT,
    )[1];

    const user: User = {
      id: 2,
      username: 'newuser',
      color: '#00ff00',
      lastActive: Date.now(),
      sessionId: 'test-session',
    };
    mockHandler({ user });
    expect(mockStoreHandlers.removeUser).toHaveBeenCalledWith(user.id);
  });

  it('handles error event', () => {
    setupConnection();
    const mockHandler = mockSocket.on.mock.calls.find(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (call: any[]) => call[0] === MessageType.ERROR,
    )[1];

    mockHandler({ message: 'Test error', type: 'SESSION_FULL' });
    expect(mockStoreHandlers.onSessionFull).toHaveBeenCalled();
  });

  it('handles cursor move event', () => {
    setupConnection();
    const mockHandler = mockSocket.on.mock.calls.find(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (call: any[]) => call[0] === MessageType.CURSOR_MOVE,
    )[1];

    const user: User = {
      id: 2,
      username: 'newuser',
      color: '#00ff00',
      lastActive: Date.now(),
      sessionId: 'test-session',
    };
    mockHandler({
      position: { top: 100, left: 200 },
      user,
    });
    expect(mockStoreHandlers.updateCursor).toHaveBeenCalledWith({
      userId: user.id,
      username: user.username,
      color: user.color,
      position: { top: 100, left: 200 },
    });
  });

  it('handles selection change event', () => {
    setupConnection();
    const mockHandler = mockSocket.on.mock.calls.find(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (call: any[]) => call[0] === MessageType.SELECTION_CHANGE,
    )[1];

    const user: User = {
      id: 2,
      username: 'newuser',
      color: '#00ff00',
      lastActive: Date.now(),
      sessionId: 'test-session',
    };
    mockHandler({
      selection: { start: 0, end: 10 },
      user,
    });
    expect(mockStoreHandlers.updateSelection).toHaveBeenCalledWith({
      userId: user.id,
      username: user.username,
      color: user.color,
      selection: { start: 0, end: 10 },
    });
  });

  describe('Connection Management', () => {
    it('handles reconnection attempts', () => {
      setupConnection();
      const mockHandler = mockSocket.on.mock.calls.find(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (call: any[]) => call[0] === 'disconnect',
      )[1];

      // Simulate disconnect
      mockHandler();
      expect(socketService['connectionState'].isConnecting).toBe(false);
      expect(socketService['connectionState'].isDisconnecting).toBe(false);

      // Simulate reconnect
      const reconnectTimeout = socketService['reconnectTimeout'];
      expect(reconnectTimeout).toBeDefined();
      expect(reconnectTimeout).not.toBeNull();
    });

    it('handles connection errors', () => {
      setupConnection();
      const mockHandler = mockSocket.on.mock.calls.find(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (call: any[]) => call[0] === 'connect_error',
      )[1];

      const error = new Error('Connection error');
      mockHandler(error);
      expect(mockOnError).toHaveBeenCalledWith('Connection error: Connection error');
    });

    it('prevents multiple simultaneous connection attempts', () => {
      socketService['connectionState'].isConnecting = true;
      socketService.connect();
      expect(socketService['manager']).toBeNull();
    });

    it('prevents connection while disconnecting', () => {
      socketService['connectionState'].isDisconnecting = true;
      socketService.connect();
      expect(socketService['manager']).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('handles invalid sync response', () => {
      setupConnection();
      const mockHandler = mockSocket.on.mock.calls.find(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (call: any[]) => call[0] === MessageType.SYNC_RESPONSE,
      )[1];

      mockHandler(null);
      expect(mockOnError).toHaveBeenCalledWith('Invalid sync response received');
    });

    it('handles session full error', () => {
      setupConnection();
      const mockHandler = mockSocket.on.mock.calls.find(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (call: any[]) => call[0] === MessageType.ERROR,
      )[1];

      mockHandler({ message: 'Session is full', type: 'SESSION_FULL' });
      expect(mockStoreHandlers.onSessionFull).toHaveBeenCalled();
    });

    it('handles duplicate username error', () => {
      setupConnection();
      const mockHandler = mockSocket.on.mock.calls.find(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (call: any[]) => call[0] === MessageType.ERROR,
      )[1];

      mockHandler({ message: 'Username is already taken', type: 'DUPLICATE_USERNAME' });
      expect(mockOnError).toHaveBeenCalledWith(
        'Username is already taken. Please choose a different username.',
      );
      expect(mockStoreHandlers.setError).toHaveBeenCalledWith(
        'Username is already taken. Please choose a different username.',
      );
    });

    it('handles network errors', () => {
      setupConnection();
      const mockHandler = mockSocket.on.mock.calls.find(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (call: any[]) => call[0] === 'connect_error',
      )[1];

      const error = new Error('Network error');
      mockHandler(error);
      expect(mockOnError).toHaveBeenCalledWith('Connection error: Network error');
    });

    it('handles connection error with retry mechanism', () => {
      setupConnection();
      const mockHandler = mockSocket.on.mock.calls.find(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (call: any[]) => call[0] === 'connect_error',
      )[1];

      const error = new Error('Connection failed');
      mockHandler(error);

      expect(mockOnError).toHaveBeenCalledWith('Connection error: Connection failed');
      expect(socketService['connectionState'].lastError).toBeDefined();
      expect(socketService['connectionState'].lastError?.type).toBe('CONNECTION_ERROR');
      expect(socketService['connectionState'].lastError?.message).toBe('Connection failed');
    });

    it('handles sync error by requesting full sync', () => {
      setupConnection();
      const mockHandler = mockSocket.on.mock.calls.find(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (call: any[]) => call[0] === MessageType.ERROR,
      )[1];

      mockHandler({
        type: 'SYNC_ERROR',
        message: 'Sync failed',
      });

      expect(mockSocket.emit).toHaveBeenCalledWith(MessageType.SYNC_REQUEST);
    });

    it('handles invalid payload error by requesting state refresh', () => {
      setupConnection();
      const mockHandler = mockSocket.on.mock.calls.find(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (call: any[]) => call[0] === MessageType.ERROR,
      )[1];

      mockHandler({
        type: 'INVALID_PAYLOAD',
        message: 'Invalid payload received',
      });

      expect(mockSocket.emit).toHaveBeenCalledWith(MessageType.SYNC_REQUEST);
    });

    it('handles max retries exceeded', () => {
      setupConnection();
      const mockHandler = mockSocket.on.mock.calls.find(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (call: any[]) => call[0] === 'connect_error',
      )[1];

      // Simulate max retries exceeded
      socketService['connectionState'].reconnectAttempts = 5;
      const error = new Error('Connection failed');
      mockHandler(error);

      expect(mockOnError).toHaveBeenCalledWith(
        'Failed to establish connection after multiple attempts. Please refresh the page.',
      );
      expect(mockSocket.disconnect).toHaveBeenCalled();
    });

    it('updates connection state on successful connection', () => {
      setupConnection();
      const mockHandler = mockSocket.on.mock.calls.find(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (call: any[]) => call[0] === 'connect',
      )[1];

      mockHandler();

      expect(socketService['connectionState'].reconnectAttempts).toBe(0);
      expect(socketService['connectionState'].lastError).toBeUndefined();
      expect(socketService['connectionState'].lastSuccessfulConnection).toBeDefined();
    });
  });

  describe('State Management', () => {
    it('handles message sending state', () => {
      setupConnection();
      mockSocket.connected = false;
      socketService.sendMessage(MessageType.CONTENT_CHANGE, {
        content: 'test',
        user: {
          id: 1,
          username: 'testuser',
          color: '#ff0000',
          lastActive: Date.now(),
          sessionId: 'test-session',
        },
      });
      expect(mockSocket.emit).not.toHaveBeenCalled();
    });

    it('handles concurrent message sending', () => {
      setupConnection();
      mockSocket.connected = true;
      const content = 'test content';
      socketService.sendMessage(MessageType.CONTENT_CHANGE, {
        content,
        user: {
          id: 1,
          username: 'testuser',
          color: '#ff0000',
          lastActive: Date.now(),
          sessionId: 'test-session',
        },
      });
      expect(mockSocket.emit).toHaveBeenCalledWith(MessageType.CONTENT_CHANGE, {
        content,
        user: {
          id: 1,
          username: 'testuser',
          color: '#ff0000',
          lastActive: expect.any(Number),
          sessionId: 'test-session',
        },
      });
    });

    it('handles message sending during reconnection', () => {
      setupConnection();
      mockSocket.connected = false;
      socketService.sendMessage(MessageType.CONTENT_CHANGE, {
        content: 'test',
        user: {
          id: 1,
          username: 'testuser',
          color: '#ff0000',
          lastActive: Date.now(),
          sessionId: 'test-session',
        },
      });
      expect(mockSocket.emit).not.toHaveBeenCalled();
    });
  });

  describe('Concurrent Operations', () => {
    it('handles concurrent content changes', () => {
      setupConnection();
      const mockHandler = mockSocket.on.mock.calls.find(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (call: any[]) => call[0] === MessageType.CONTENT_CHANGE,
      )[1];

      const user: User = {
        id: 2,
        username: 'newuser',
        color: '#00ff00',
        lastActive: Date.now(),
        sessionId: 'test-session',
      };
      mockHandler({ content: 'test1', user });
      mockHandler({ content: 'test2', user });
      expect(mockStoreHandlers.setContent).toHaveBeenCalledTimes(2);
    });

    it('handles concurrent language changes', () => {
      setupConnection();
      const mockHandler = mockSocket.on.mock.calls.find(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (call: any[]) => call[0] === MessageType.LANGUAGE_CHANGE,
      )[1];

      const user: User = {
        id: 2,
        username: 'newuser',
        color: '#00ff00',
        lastActive: Date.now(),
        sessionId: 'test-session',
      };
      mockHandler({ language: 'javascript', user });
      mockHandler({ language: 'python', user });
      expect(mockStoreHandlers.setLanguage).toHaveBeenCalledTimes(2);
    });

    it('handles concurrent cursor movements', () => {
      setupConnection();
      const mockHandler = mockSocket.on.mock.calls.find(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (call: any[]) => call[0] === MessageType.CURSOR_MOVE,
      )[1];

      const user: User = {
        id: 2,
        username: 'newuser',
        color: '#00ff00',
        lastActive: Date.now(),
        sessionId: 'test-session',
      };
      mockHandler({ position: { top: 100, left: 200 }, user });
      mockHandler({ position: { top: 150, left: 250 }, user });
      expect(mockStoreHandlers.updateCursor).toHaveBeenCalledTimes(2);
    });
  });

  describe('Reconnection Scenarios', () => {
    it('handles reconnection with pending messages', () => {
      setupConnection();
      mockSocket.connected = false;
      socketService.sendMessage(MessageType.CONTENT_CHANGE, {
        content: 'test',
        user: {
          id: 1,
          username: 'testuser',
          color: '#ff0000',
          lastActive: Date.now(),
          sessionId: 'test-session',
        },
      });
      expect(mockSocket.emit).not.toHaveBeenCalled();
    });

    it('handles multiple reconnection attempts', () => {
      setupConnection();
      const mockHandler = mockSocket.on.mock.calls.find(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (call: any[]) => call[0] === 'disconnect',
      )[1];

      mockHandler();
      expect(socketService['reconnectTimeout']).toBeDefined();
      expect(socketService['reconnectTimeout']).not.toBeNull();
    });

    it('maintains state during reconnection', () => {
      setupConnection();
      const mockHandler = mockSocket.on.mock.calls.find(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (call: any[]) => call[0] === 'disconnect',
      )[1];

      mockHandler();
      expect(socketService['connectionState'].reconnectAttempts).toBe(0);
    });
  });

  describe('User Management', () => {
    it('handles user join with invalid data', () => {
      setupConnection();
      const mockHandler = mockSocket.on.mock.calls.find(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (call: any[]) => call[0] === MessageType.USER_JOINED,
      )[1];

      mockHandler({ user: null });
      expect(mockStoreHandlers.addUser).not.toHaveBeenCalled();
    });

    it('handles user leave with invalid data', () => {
      setupConnection();
      const mockHandler = mockSocket.on.mock.calls.find(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (call: any[]) => call[0] === MessageType.USER_LEFT,
      )[1];

      mockHandler({ user: null });
      expect(mockStoreHandlers.removeUser).not.toHaveBeenCalled();
    });

    it('handles cursor move with invalid data', () => {
      setupConnection();
      const mockHandler = mockSocket.on.mock.calls.find(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (call: any[]) => call[0] === MessageType.CURSOR_MOVE,
      )[1];

      mockHandler({ position: null, user: null });
      expect(mockStoreHandlers.updateCursor).not.toHaveBeenCalled();
    });

    it('handles selection change with invalid data', () => {
      setupConnection();
      const mockHandler = mockSocket.on.mock.calls.find(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (call: any[]) => call[0] === MessageType.SELECTION_CHANGE,
      )[1];

      mockHandler({ selection: null, user: null });
      expect(mockStoreHandlers.updateSelection).not.toHaveBeenCalled();
    });
  });
});
