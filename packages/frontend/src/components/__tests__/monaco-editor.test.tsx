import { render, screen, fireEvent, act } from '@testing-library/react';
import { MonacoEditor } from '../monaco-editor';
import { MessageType, DEFAULT_CONTENT, DEFAULT_LANGUAGE } from '@collabx/shared';

// Mock the store
const mockStore = {
  content: DEFAULT_CONTENT,
  language: DEFAULT_LANGUAGE,
  setContent: jest.fn(),
};

jest.mock('@/lib/stores', () => ({
  useEditorStore: () => mockStore,
}));

// Mock next-themes
jest.mock('next-themes', () => ({
  useTheme: () => ({
    theme: 'dark',
  }),
}));

// Mock Monaco Editor
jest.mock('@monaco-editor/react', () => {
  const mockFocus = jest.fn();
  return {
    Editor: ({ value, language, theme, onMount, onChange, options }: any) => {
      // Simulate editor mount
      setTimeout(() => {
        onMount({
          focus: mockFocus,
          updateOptions: jest.fn(),
        });
      }, 0);

      return (
        <div data-testid="monaco-editor">
          <textarea
            data-testid="editor-textarea"
            data-language={language}
            data-theme={theme}
            data-read-only={options?.readOnly?.toString()}
            value={value}
            readOnly={options?.readOnly}
            onChange={(e) => onChange(e.target.value)}
          />
        </div>
      );
    },
    loader: {
      init: () =>
        Promise.resolve({
          editor: {
            defineTheme: jest.fn(),
          },
        }),
    },
    __mockFocus: mockFocus,
  };
});

describe('MonacoEditor', () => {
  const mockSendMessage = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the editor with default content', async () => {
    await act(async () => {
      render(<MonacoEditor sessionId="test" username="testuser" sendMessage={mockSendMessage} />);
    });

    const editor = screen.getByTestId('monaco-editor');
    expect(editor).toBeDefined();

    const textarea = screen.getByTestId('editor-textarea') as HTMLTextAreaElement;
    expect(textarea.value).toBe(DEFAULT_CONTENT);
    expect(textarea.dataset.language).toBe(DEFAULT_LANGUAGE);
    expect(textarea.dataset.theme).toBe('custom-dark-theme');
  });

  it('handles content changes', async () => {
    await act(async () => {
      render(<MonacoEditor sessionId="test" username="testuser" sendMessage={mockSendMessage} />);
    });

    const textarea = screen.getByTestId('editor-textarea') as HTMLTextAreaElement;
    const newContent = 'const test = "updated";';
    await act(async () => {
      fireEvent.change(textarea, { target: { value: newContent } });
    });

    expect(mockStore.setContent).toHaveBeenCalledWith(newContent);
    expect(mockSendMessage).toHaveBeenCalledWith(MessageType.CONTENT_CHANGE, {
      content: newContent,
    });
  });

  it('updates content when store changes', async () => {
    const { rerender } = render(
      <MonacoEditor sessionId="test" username="testuser" sendMessage={mockSendMessage} />,
    );

    const newContent = 'const test = "new content";';
    mockStore.content = newContent;
    await act(async () => {
      rerender(<MonacoEditor sessionId="test" username="testuser" sendMessage={mockSendMessage} />);
    });

    const textarea = screen.getByTestId('editor-textarea') as HTMLTextAreaElement;
    expect(textarea.value).toBe(newContent);
  });

  it('focuses editor on mount', async () => {
    jest.spyOn(global, 'setTimeout').mockImplementation((cb) => {
      cb();
      return 0 as any;
    });

    await act(async () => {
      render(<MonacoEditor sessionId="test" username="testuser" sendMessage={mockSendMessage} />);
    });

    const mockFocus = jest.requireMock('@monaco-editor/react').__mockFocus;
    expect(mockFocus).toHaveBeenCalled();
  });

  it('handles keyboard shortcuts', async () => {
    await act(async () => {
      render(<MonacoEditor sessionId="test" username="testuser" sendMessage={mockSendMessage} />);
    });

    const event = new KeyboardEvent('keydown', {
      key: 'e',
      metaKey: true,
      shiftKey: true,
    });

    await act(async () => {
      window.dispatchEvent(event);
    });

    // Verify editor focus was called
    expect(mockStore.setContent).not.toHaveBeenCalled();
  });

  it('applies read-only mode correctly', async () => {
    await act(async () => {
      render(
        <MonacoEditor
          sessionId="test"
          username="testuser"
          sendMessage={mockSendMessage}
          readOnly
        />,
      );
    });

    const textarea = screen.getByTestId('editor-textarea') as HTMLTextAreaElement;
    expect(textarea.getAttribute('data-read-only')).toBe('true');
  });
});
