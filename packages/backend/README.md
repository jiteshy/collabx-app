# CollabX Backend

The backend package of CollabX, built with NestJS and TypeScript. Handles WebSocket connections, session management, and real-time collaboration features.

## Features

- **WebSocket Server**: Real-time communication using Socket.IO
- **Session Management**: Handle user sessions and collaboration
- **Rate Limiting**: Protect against excessive requests
- **Redis Integration**: Session storage and rate limiting
- **Error Handling**: Comprehensive error management
- **Type Safety**: Full TypeScript support

## Tech Stack

- **Framework**: NestJS
- **Language**: TypeScript
- **WebSocket**: Socket.IO
- **Database**: Redis
- **Validation**: Custom validation service
- **Rate Limiting**: Custom rate limiter with Redis

## Project Structure

```
backend/
├── src/
│   ├── gateways/        # WebSocket gateways
│   ├── services/        # Business logic services
│   ├── rate-limit/      # Rate limiting implementation
│   ├── types/          # TypeScript types and interfaces
│   └── main.ts         # Application entry point
├── test/               # Test files
└── README.md
```

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Redis server

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
```

3. Start the development server:
```bash
npm run start:dev
```

The server will be available at http://localhost:4000

## Development

### Available Scripts

- `npm run start` - Start the server
- `npm run start:dev` - Start in development mode
- `npm run start:debug` - Start in debug mode
- `npm run start:prod` - Start in production mode
- `npm run test` - Run unit tests
- `npm run test:e2e` - Run end-to-end tests
- `npm run test:cov` - Run tests with coverage

### Key Components

- `EditorGateway`: Main WebSocket gateway for editor functionality
- `SessionService`: Manages collaborative sessions
- `RateLimiter`: Handles request rate limiting
- `ValidationService`: Validates incoming messages

### WebSocket Events

The backend handles various WebSocket events:
- `JOIN`: User joining a session
- `CONTENT_CHANGE`: Editor content updates
- `LANGUAGE_CHANGE`: Editor language changes
- `CURSOR_MOVE`: Cursor position updates
- `SELECTION_CHANGE`: Text selection updates
- `TYPING_STATUS`: User typing status

## Testing

```bash
# Run unit tests
npm run test

# Run e2e tests
npm run test:e2e

# Run tests with coverage
npm run test:cov
```

## Building for Production

```bash
# Build the application
npm run build

# Start production server
npm run start:prod
```

## Contributing

1. Create a feature branch
2. Make your changes
3. Run tests and linting
4. Submit a pull request

## License

This package is part of the CollabX project and is licensed under the MIT License. 