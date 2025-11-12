# GEMINI.md - Project Context

This document provides a comprehensive overview of the `effect-app-telegram` project for the Gemini AI assistant.

## Project Overview

This is a TypeScript project for building a Telegram bot using the [Effect](https://effect.website/) library. The application is more than a simple bot; it's a framework that includes features like:

*   **Command Management:** A system for registering and handling slash commands (e.g., `/help`, `/start`).
*   **Form Management:** A system for creating and managing multi-step forms within the chat.
*   **State Management:** Caching for message history and form state.
*   **Telegram API Integration:** A client for interacting with the Telegram Bot API.

The main application logic is in `src/TelegramBotApp.ts`, which polls for updates and delegates to the command and form managers.

## Building and Running

The project uses `pnpm` for package management.

*   **Install dependencies:**
    ```bash
    pnpm install
    ```

*   **Run the application:**
    The application requires a `TELEGRAM_BOT_TOKEN` environment variable. You can create a `.env` file for this.
    ```bash
    pnpm tsx src/TelegramBotApp.ts
    ```

*   **Run tests:**
    ```bash
    pnpm test
    ```

*   **Lint the code:**
    ```bash
    pnpm lint
    ```

*   **Build the project:**
    ```bash
    pnpm build
    ```

## Development Conventions

*   **Language:** TypeScript
*   **Framework:** Effect
*   **Package Manager:** pnpm
*   **Testing:** Vitest
*   **Linting:** ESLint
*   **Formatting:** Prettier (inferred from `.prettierrc`)

The code is structured around Effect's layers and context management for dependency injection. The application is composed of several services (e.g., `CommandManager`, `FormManager`, `TelegramBotApi`) that are provided to the main application logic.
