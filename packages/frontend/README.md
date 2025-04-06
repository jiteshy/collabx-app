# CollabX Frontend

The frontend package of CollabX, built with Next.js and TypeScript. Provides a real-time collaborative code editing experience with Monaco Editor.

## Features

- **Real-time Code Editing**: Powered by Monaco Editor
- **User Presence**: Display active users in the session
- **Cursor Tracking**: Show other users' cursor positions
- **Language Support**: Multiple programming language support
- **Dark Mode**: Built-in theme switching
- **Responsive Design**: Works on all screen sizes
- **Keyboard Shortcuts**: Quick access to common actions

## Tech Stack

- **Framework**: Next.js 14
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Editor**: Monaco Editor
- **State Management**: Zustand
- **WebSocket**: Socket.IO Client
- **UI Components**: Custom components with Tailwind CSS

## Project Structure

```
frontend/
├── src/
│   ├── app/              # Next.js app directory
│   ├── components/       # Reusable UI components
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Utility functions and services
│   └── stores/          # Zustand state stores
├── public/              # Static assets
└── README.md
```

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env.local
```

3. Start the development server:
```bash
npm run dev
```

The application will be available at http://localhost:3000

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run test` - Run tests

### Key Components

- `MonacoEditor`: Main code editor component
- `EditorHeader`: Session information and controls
- `UserList`: Display active users
- `SessionCard`: Session sharing and management

### State Management

The application uses Zustand for state management with the following stores:
- `editorStore`: Editor content and settings
- `userStore`: User presence and cursor tracking

## Testing

```bash
# Run unit tests
npm run test

# Run tests with coverage
npm run test:coverage
```

## Building for Production

```bash
# Build the application
npm run build

# Start production server
npm run start
```

## Contributing

1. Create a feature branch
2. Make your changes
3. Run tests and linting
4. Submit a pull request

## License

This package is part of the CollabX project and is licensed under the MIT License.
