# Effect Package Template - QWEN Context

## Project Overview

This is a comprehensive Telegram Bot API service implementation built using Effect-TS ecosystem. The project provides a complete, type-safe implementation of all Telegram Bot API methods with proper error handling, configuration, and service management.

The main feature is a complete Telegram Bot API service implementation in a single file (`TelegramBotApiService.ts`) that covers ALL official Telegram Bot API methods with full JSDoc documentation, proper error handling, and Effect-TS best practices.

## Key Technologies & Architecture

- **Effect-TS Ecosystem**: Uses Effect, Context, Layer, Config, HttpClient from the Effect library
- **TypeScript**: Full type safety with comprehensive type definitions
- **Package Manager**: pnpm
- **Testing Framework**: vitest with @effect/vitest adapter

## Project Structure

```
├── .changeset/
├── .github/
├── .vscode/
├── patches/
├── scratchpad/
├── src/
│   ├── Program.ts
│   ├── telegram-prompt.txt
│   └── TelegramBotApiService.ts
├── test/
│   └── Dummy.test.ts
├── package.json
├── README.md
├── tsconfig.json and related config files
└── vitest.config.ts
```

## Core Components

### Telegram Bot API Service

The main component is `TelegramBotApiService.ts` which provides:

- Complete implementation of all Telegram Bot API methods
- Comprehensive type definitions for all Telegram API types
- Custom error hierarchy with proper error types
- HTTP client implementation using Effect HttpClient
- Configuration management with Effect Config
- Context-based service management
- Support for file uploads with multipart/form-data
- Rate limiting and retry mechanisms

### Service Architecture

- **TelegramBotApiService**: Interface defining all available Telegram API methods
- **TelegramBotApiServiceImpl**: Implementation of the service using Effect
- **TelegramBotApiConfig**: Configuration interface with environment-based loading
- **Context & Layer**: For dependency injection and service management
- **Custom Error Types**: Comprehensive error hierarchy for different API error scenarios

### Sample Usage

The `Program.ts` file contains a simple "Hello, World!" example, but the main functionality is in the service implementation.

## Key Features

1. **Complete API Coverage**: All Telegram Bot API methods are implemented
2. **Type Safety**: Full TypeScript support with comprehensive type definitions
3. **Error Handling**: Proper error hierarchy with specific error types for different scenarios
4. **Configuration Management**: Environment-based configuration using Effect Config
5. **Service Layer**: Properly structured service with dependency injection
6. **HTTP Client**: Proper HTTP client implementation with both JSON and multipart support
7. **Retry Logic**: Built-in retry mechanisms for network errors and rate limits
8. **JSDoc Documentation**: Full documentation for all methods and types

## Building and Running

### Commands:

- **Build**: `pnpm build` - Builds the package for distribution
- **Test**: `pnpm test` - Runs the test suite
- **Run Code**: `pnpm tsx ./path/to/the/file.ts` - Execute TypeScript files via NodeJS
- **Lint**: `pnpm lint` - Lint the codebase
- **Check**: `pnpm check` - Type check the project
- **Coverage**: `pnpm coverage` - Generate test coverage report

### Configuration:

The service uses Effect Config to load settings from environment variables:

- `TELEGRAM_BOT_TOKEN` - Required: The Telegram Bot API token
- `TELEGRAM_API_BASE_URL` - Optional: Base API URL (defaults to official API)
- `TELEGRAM_REQUEST_TIMEOUT` - Optional: Request timeout (defaults to 30000ms)
- `TELEGRAM_RETRY_ATTEMPTS` - Optional: Number of retry attempts (defaults to 3)
- `TELEGRAM_RETRY_DELAY` - Optional: Delay between retries (defaults to 1000ms)
- `TELEGRAM_RATE_LIMIT_DELAY` - Optional: Delay for rate limiting (defaults to 1000ms)

## Development Conventions

1. **Effect-TS Patterns**: Follow Effect-TS idioms for service creation, error handling, and configuration
2. **JSDoc Documentation**: All public APIs should have comprehensive JSDoc documentation
3. **Error Handling**: Use custom error types with proper tagging and error hierarchy
4. **Configuration**: Use Effect Config for environment variables and configuration management
5. **Service Layer**: Use Context and Layer for dependency injection and service management
6. **Testing**: Use vitest with @effect/vitest for testing Effect-TS applications

## Testing

Tests are located in the `test/` directory and use vitest with @effect/vitest adapter. The project follows Effect-TS testing patterns and includes setup files for proper testing environment.

## Environment Setup

The project uses the following environment variables for configuration:

- `TELEGRAM_BOT_TOKEN` - The Telegram Bot API token
- Other optional configuration variables as listed above

## File Upload Support

The implementation includes sophisticated file upload support:

- Automatic detection of file parameters in API calls
- Multipart/form-data support for file uploads
- Proper FormData construction with file content handling

## Error Handling System

The project implements a comprehensive error hierarchy:

- `TelegramBotApiError` - Base error type
- `TelegramBotApiNetworkError` - For network-related issues
- `TelegramBotApiInvalidResponseError` - For invalid API responses
- `TelegramBotApiRateLimitError` - For rate limiting scenarios
- `TelegramBotApiUnauthorizedError` - For authentication issues
- `TelegramBotApiMethodError` - For method-specific errors
- `TelegramBotApiFileError` - For file-related issues
- `TelegramBotApiParseError` - For parsing issues

## API Categories Implemented

The service covers all Telegram Bot API categories:

1. Getting updates (getUpdates, setWebhook, etc.)
2. Available methods (sendMessage, sendPhoto, etc.)
3. Updating messages (editMessageText, deleteMessage, etc.)
4. Stickers (sendSticker, getStickerSet, etc.)
5. Inline mode (answerInlineQuery, etc.)
6. Payments (sendInvoice, etc.)
7. Telegram Passport (setPassportDataErrors, etc.)
8. Games (sendGame, etc.)

This implementation provides a production-ready, type-safe, and comprehensive interface to the Telegram Bot API using the Effect-TS ecosystem.
