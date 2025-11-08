import { Effect } from "effect"
import type { CommandHandler } from "./CommandManager.js"

// Help command handler effect
export const helpCommandHandler: CommandHandler = (
  chatId,
  userId,
  messageText,
  args,
  telegramApi
) => {
  const helpMessage = "🤖 Available Commands:\n\n" +
    "/help - Show this help message\n" +
    "/start - Start interacting with the bot"

  return Effect.logInfo({ chatId, userId, messageText, args }).pipe(Effect.as(
    telegramApi.sendMessage({
      chat_id: chatId,
      text: helpMessage
    })
  ))
}

// Start command handler effect
export const startCommandHandler: CommandHandler = (
  chatId,
  userId,
  messageText,
  args,
  telegramApi
) => {
  Effect.logInfo(chatId, userId, messageText, args)
  const startMessage = "Welcome! I'm your Telegram bot. Use /help to see available commands."

  return Effect.logInfo({ chatId, userId, messageText, args }).pipe(Effect.as(
    telegramApi.sendMessage({
      chat_id: chatId,
      text: startMessage
    })
  ))
}
