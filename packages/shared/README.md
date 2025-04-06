# CollabX Shared

The shared package of CollabX, containing common types, interfaces, and utilities used across the frontend and backend.

## Features

- **Type Definitions**: Shared TypeScript types and interfaces
- **Validation Service**: Common validation utilities
- **Rate Limiter**: Shared rate limiting implementation
- **Constants**: Shared configuration values
- **Utilities**: Common helper functions

## Tech Stack

- **Language**: TypeScript
- **Build Tool**: TypeScript Compiler
- **Package Manager**: npm/yarn

## Project Structure

```
shared/
├── src/
│   ├── types/          # TypeScript type definitions
│   ├── services/       # Shared services
│   ├── utils/          # Utility functions
│   └── index.ts        # Main entry point
└── README.md
```

## Getting Started

### Installation

1. Install the package in your project:
```bash
npm install @collabx/shared
```

2. Import types and utilities:
```typescript
import { User, MessageType, ValidationService } from '@collabx/shared';
```

## Available Types

### Core Types

- `MessageType`: WebSocket message type enumeration
- `User`: User information interface
- `Session`: Session information interface
- `UserCursor`: Cursor position interface
- `UserSelection`: Text selection interface

### Error Types

- `SocketErrorType`: WebSocket error type enumeration
- `SocketError`: WebSocket error interface
- `ErrorMessage`: Error message interface

### Rate Limiting Types

- `RateLimitConfig`: Rate limit configuration interface
- `RateLimitState`: Rate limit state interface

## Services

### ValidationService

```typescript
import { ValidationService } from '@collabx/shared';

// Validate session ID
const error = ValidationService.validateSessionId(sessionId);

// Validate username
const error = ValidationService.validateUsername(username);
```

### RateLimiter

```typescript
import { RateLimiter } from '@collabx/shared';

const limiter = new RateLimiter();
limiter.addLimit('event', {
  windowMs: 60000,
  max: 5,
  message: 'Rate limit exceeded'
});
```

## Development

### Building

```bash
# Build the package
npm run build

# Watch mode
npm run build:watch
```

### Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:cov
```

## Contributing

1. Create a feature branch
2. Make your changes
3. Run tests and linting
4. Submit a pull request

## License

This package is part of the CollabX project and is licensed under the MIT License. 