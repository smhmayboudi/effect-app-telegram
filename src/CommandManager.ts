import { Context, Effect, Layer } from "effect"
import {
  type TelegramBotApiError,
  type TelegramBotApiService,
  TelegramBotApiServiceContext
} from "./TelegramBotApiService.js"

// =============================================================================
// Command Registry
// =============================================================================

export type CommandHandler = (
  chatId: number,
  userId: number,
  messageText: string,
  args: Array<string>,
  telegramApi: TelegramBotApiService
) => Effect.Effect<void, TelegramBotApiError>

export interface CommandManager {
  handle(
    messageText: string,
    chatId: number,
    userId: number
  ): Effect.Effect<void, TelegramBotApiError>
  register(command: string, handler: CommandHandler): void
}

export class CommandManagerContext extends Context.Tag(
  "@context/CommandManager"
)<CommandManagerContext, CommandManager>() {}

export const CommandManagerLive = Layer.effect(
  CommandManagerContext,
  Effect.gen(function*() {
    const telegramApi = yield* TelegramBotApiServiceContext
    const commands: Map<string, CommandHandler> = new Map()

    return CommandManagerContext.of({
      handle(messageText, chatId, userId) {
        if (!messageText.startsWith("/")) {
          return Effect.void
        }

        // Extract command and arguments
        const parts = messageText.trim().split(/\s+/)
        const command = parts[0].substring(1).toLowerCase() // Remove '/' and convert to lowercase
        const args = parts.slice(1) // Remaining parts are arguments

        const handler = commands.get(command)

        if (handler) {
          return handler(chatId, userId, messageText, args, telegramApi)
        } else {
          // Command not found, send a default response
          return telegramApi.sendMessage({
            chat_id: chatId,
            text: `Unknown command: /${command}. Use /help to see available commands.`
          })
        }
      },
      register(command, handler) {
        commands.set(command.toLowerCase(), handler)
      }
    })
  })
)
