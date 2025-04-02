import { render, screen } from '@testing-library/react';
import { EditorHeader } from '../editor-header';
import { User } from '@/types';
import { expect } from '@jest/globals';

describe('EditorHeader', () => {
  const mockUsers: User[] = [
    {
      id: 1,
      username: 'testuser',
      color: '#ff0000',
      lastActive: Date.now(),
      sessionId: 'test-session',
    },
    {
      id: 2,
      username: 'collaborator',
      color: '#00ff00',
      lastActive: Date.now(),
      sessionId: 'test-session',
    },
  ];

  const defaultProps = {
    language: 'javascript',
    setLanguage: jest.fn(),
    readOnly: false,
    users: mockUsers,
    username: 'testuser',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the language selector', () => {
    render(<EditorHeader {...defaultProps} />);
    const selector = screen.getByRole('combobox');
    expect(selector).toBeDefined();
  });

  it('displays read-only message when in read-only mode', () => {
    render(<EditorHeader {...defaultProps} readOnly={true} />);
    const message = screen.getByText('In Read-Only Mode');
    expect(message).toBeDefined();
  });

  it('displays user avatars', () => {
    render(<EditorHeader {...defaultProps} />);
    const avatars = document.querySelectorAll('.group');
    expect(avatars.length).toBe(2);
  });

  describe('Edge Cases', () => {
    it('handles empty users array', () => {
      render(<EditorHeader {...defaultProps} users={[]} />);

      const avatars = screen.queryAllByRole('img', { hidden: true });
      expect(avatars).toHaveLength(0);

      const userList = document.querySelectorAll('.group');
      expect(userList.length).toBe(0);
    });
  });

  describe('Performance', () => {
    it('renders efficiently', () => {
      const startTime = performance.now();

      render(<EditorHeader {...defaultProps} />);

      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(100); // Should render within 100ms
    });

    it('handles rapid re-renders efficiently', () => {
      const startTime = performance.now();

      const { rerender } = render(<EditorHeader {...defaultProps} />);
      for (let i = 0; i < 100; i++) {
        rerender(<EditorHeader {...defaultProps} />);
      }

      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(1000); // Should handle 100 re-renders within 1s
    });
  });
});
