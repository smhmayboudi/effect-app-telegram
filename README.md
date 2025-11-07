# Telegram Bot App

This is a simple Telegram bot application that replies "hi" to every message it receives.

## Setup

1. Create a `.env` file in the root directory with your Telegram Bot API token:
   ```
   TELEGRAM_BOT_TOKEN=your_bot_token_here
   ```

2. Make sure you have pnpm installed and dependencies installed:
   ```bash
   pnpm install
   ```

## Running the Application

To run the application:

```bash
pnpm tsx src/TelegramBotApp.ts
```

## How It Works

The application uses `getUpdates` to poll for new messages and replies "hi" to every message received. The bot will continuously run and respond to messages.

## Configuration

The application can be configured using environment variables:

- `TELEGRAM_BOT_TOKEN` (required): Your Telegram Bot API token
- `TELEGRAM_API_BASE_URL` (optional): API base URL (defaults to official API)
- `TELEGRAM_REQUEST_TIMEOUT` (optional): Request timeout in ms (defaults to 30000)
- `TELEGRAM_RETRY_ATTEMPTS` (optional): Number of retry attempts (defaults to 3)
- `TELEGRAM_RETRY_DELAY` (optional): Delay between retries in ms (defaults to 1000)
- `TELEGRAM_RATE_LIMIT_DELAY` (optional): Delay for rate limiting in ms (defaults to 1000)

The bot will reply to every message with "hi".
