import { render, screen, fireEvent } from '@testing-library/react';
import { MonacoEditor } from '../monaco-editor';
import { MessageType } from '@/types';
import { act } from 'react-dom/test-utils';

// Mock next/dynamic
jest.mock('next/dynamic', () => () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const DynamicComponent = ({ value, language, theme, onChange }: any) => (
    <div data-testid="monaco-editor">
      <textarea
        data-testid="editor-textarea"
        value={value}
        data-language={language}
        data-theme={theme}
        onChange={(e) => onChange?.(e.target.value)}
      />
    </div>
  );
  return DynamicComponent;
});

// Mock the store
const mockStore = {
  content: 'const test = "hello";',
  language: 'javascript',
  setContent: jest.fn(),
};

jest.mock('@/lib/stores', () => ({
  useEditorStore: () => mockStore,
}));

// Mock next-themes
jest.mock('next-themes', () => ({
  useTheme: () => ({ theme: 'light' }),
}));

describe('MonacoEditor', () => {
  const mockSendMessage = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the editor with initial content', async () => {
    await act(async () => {
      render(<MonacoEditor sessionId="test" username="testuser" sendMessage={mockSendMessage} />);
    });

    const editor = screen.getByTestId('monaco-editor');
    expect(editor).toBeDefined();

    const textarea = screen.getByTestId('editor-textarea') as HTMLTextAreaElement;
    expect(textarea.value).toBe('const test = "hello";');
    expect(textarea.dataset.language).toBe('javascript');
    expect(textarea.dataset.theme).toBe('custom-theme');
  });

  it('handles content changes', async () => {
    await act(async () => {
      render(<MonacoEditor sessionId="test" username="testuser" sendMessage={mockSendMessage} />);
    });

    const textarea = screen.getByTestId('editor-textarea') as HTMLTextAreaElement;
    await act(async () => {
      fireEvent.change(textarea, { target: { value: 'const test = "updated";' } });
    });

    expect(mockStore.setContent).toHaveBeenCalledWith('const test = "updated";');
    expect(mockSendMessage).toHaveBeenCalledWith(MessageType.CONTENT_CHANGE, {
      content: 'const test = "updated";',
    });
  });

  it('updates content when store changes', async () => {
    const { rerender } = render(
      <MonacoEditor sessionId="test" username="testuser" sendMessage={mockSendMessage} />,
    );

    mockStore.content = 'const test = "new content";';
    await act(async () => {
      rerender(<MonacoEditor sessionId="test" username="testuser" sendMessage={mockSendMessage} />);
    });

    const textarea = screen.getByTestId('editor-textarea') as HTMLTextAreaElement;
    expect(textarea.value).toBe('const test = "new content";');
  });

  it('applies correct theme based on system theme', async () => {
    await act(async () => {
      render(<MonacoEditor sessionId="test" username="testuser" sendMessage={mockSendMessage} />);
    });

    const textarea = screen.getByTestId('editor-textarea') as HTMLTextAreaElement;
    expect(textarea.dataset.theme).toBe('custom-theme');
  });

  describe('Editor Features', () => {
    // it('handles language changes', () => {
    //   const { rerender } = render(<MonacoEditor sessionId="test" username="testuser" sendMessage={mockSendMessage} />);
    //   // Trigger language change through the store
    //   mockStore.setLanguage('python');
    //   mockStore.language = 'python';
    //   rerender(<MonacoEditor sessionId="test" username="testuser" sendMessage={mockSendMessage} />);
    //   const textarea = screen.getByTestId('editor-textarea') as HTMLTextAreaElement;
    //   expect(textarea.dataset.language).toBe('python');
    //   expect(mockSendMessage).toHaveBeenCalledWith(MessageType.LANGUAGE_CHANGE, { language: 'python' });
    // });
  });

  describe('Theme Integration', () => {
    it('applies light theme', async () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      jest.spyOn(require('next-themes'), 'useTheme').mockImplementation(() => ({
        theme: 'light',
        setTheme: jest.fn(),
      }));

      await act(async () => {
        render(<MonacoEditor sessionId="test" username="testuser" sendMessage={mockSendMessage} />);
      });

      const textarea = screen.getByTestId('editor-textarea') as HTMLTextAreaElement;
      expect(textarea.dataset.theme).toBe('custom-theme');
    });

    it('applies dark theme', async () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      jest.spyOn(require('next-themes'), 'useTheme').mockImplementation(() => ({
        theme: 'dark',
        setTheme: jest.fn(),
      }));

      await act(async () => {
        render(<MonacoEditor sessionId="test" username="testuser" sendMessage={mockSendMessage} />);
      });

      const textarea = screen.getByTestId('editor-textarea') as HTMLTextAreaElement;
      expect(textarea.dataset.theme).toBe('custom-dark-theme');
    });
  });

  describe('Performance', () => {
    it('handles rapid content changes efficiently', async () => {
      const startTime = performance.now();

      await act(async () => {
        render(<MonacoEditor sessionId="test" username="testuser" sendMessage={mockSendMessage} />);
      });

      const textarea = screen.getByTestId('editor-textarea') as HTMLTextAreaElement;
      for (let i = 0; i < 100; i++) {
        await act(async () => {
          fireEvent.change(textarea, { target: { value: `content ${i}` } });
        });
      }

      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(1000); // Should handle 100 changes within 1s
    });

    it('handles large file loading efficiently', async () => {
      const startTime = performance.now();
      const largeContent = 'a'.repeat(100000);
      mockStore.content = largeContent;

      await act(async () => {
        render(<MonacoEditor sessionId="test" username="testuser" sendMessage={mockSendMessage} />);
      });

      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(500); // Should load large file within 500ms
    });
  });
});
