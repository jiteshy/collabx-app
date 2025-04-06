# CollabX - Real-time Collaborative Code Editor

CollabX is a real-time collaborative code editor that allows multiple users to edit code together in real-time. Built with modern web technologies, it provides a seamless coding experience with features like cursor tracking, user presence, and language synchronization.

## Features

- **Real-time Collaboration**: Multiple users can edit code simultaneously
- **User Presence**: See who's currently in the session
- **Cursor Tracking**: View other users' cursor positions
- **Language Synchronization**: Editor language changes sync across all users
- **Session Management**: Create and join sessions with unique URLs
- **Rate Limiting**: Built-in protection against excessive requests
- **Error Recovery**: Automatic reconnection handling
- **Dark Mode**: Built-in dark/light theme support

## Tech Stack

- **Frontend**: Next.js, TypeScript, Tailwind CSS, Monaco Editor
- **Backend**: NestJS, TypeScript, Socket.IO
- **Shared**: TypeScript, WebSocket
- **State Management**: Zustand
- **Styling**: Tailwind CSS, clsx, tailwind-merge

## Project Structure

```
collabx/
├── packages/
│   ├── frontend/     # Next.js frontend application
│   ├── backend/      # NestJS backend server
│   └── shared/       # Shared types and utilities
└── README.md
```

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Redis (for rate limiting)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/collabx.git
cd collabx
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

4. Start the development servers:
```bash
# Start backend
npm run dev:backend

# Start frontend
npm run dev:frontend
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend: http://localhost:4000

## Development

### Running Tests

```bash
# Run all tests
npm test

# Run frontend tests
npm run test:frontend

# Run backend tests
npm run test:backend
```

### Building for Production

```bash
# Build all packages
npm run build

# Build frontend
npm run build:frontend

# Build backend
npm run build:backend
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Monaco Editor](https://microsoft.github.io/monaco-editor/) for the code editor
- [Socket.IO](https://socket.io/) for real-time communication
- [Tailwind CSS](https://tailwindcss.com/) for styling
