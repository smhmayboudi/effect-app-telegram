import { Effect } from "effect"
import type { CommandHandler } from "./CommandManager.js"
import { TelegramBotApiError } from "./TelegramBotApi.js"

// Help command handler effect
export const photoCommandHandler: CommandHandler = (
  chatId,
  userId,
  messageText,
  args,
  { messageCache, telegramBotApi }
) =>
  Effect.gen(function*() {
    yield* Effect.logInfo(chatId, userId, messageText, args)
    // Extract filename from command arguments
    if (args.length < 1) {
      yield* telegramBotApi.sendMessage({
        chat_id: chatId,
        text: "Please provide an photo filename. Usage: /photo <filename>"
      })
    } else {
      const filename = args[0]
      // Send photo from cache
      const cached = yield* messageCache.get(filename).pipe(
        Effect.mapError((error) =>
          new TelegramBotApiError({
            message: `Error processing photo command: ${String(error)}`
          })
        )
      )
      if (cached) {
        yield* Effect.logInfo(`Sending cached photo: ${filename}`)
        yield* telegramBotApi.sendPhoto({
          caption: `Playing cached photo: ${filename}`,
          chat_id: chatId,
          photo: cached.photo?.sort((a, b) => b.width - a.width)[0].file_id || ""
        })
      } else {
        // If not in cache, send a message that the photo is not available
        yield* Effect.logInfo(`photo not found in cache: ${filename}`)
        yield* telegramBotApi.sendMessage({
          chat_id: chatId,
          text: `photo file "${filename}" not found in cache.`
        })
      }
    }
  })

// Help command handler effect
export const helpCommandHandler: CommandHandler = (
  chatId,
  userId,
  messageText,
  args,
  { telegramBotApi }
) =>
  Effect.gen(function*() {
    yield* Effect.logInfo(chatId, userId, messageText, args)
    const helpMessage = "🤖 Available Commands:\n\n" +
      "/help - Show this help message\n" +
      "/start - Start interacting with the bot\n" +
      "/photo <filename> - Send an photo file from cache\n" +
      "/photo1 photo 1\n" +
      "/photo2 photo 2\n" +
      "/photo3 photo 3\n" +
      "/historypush\n" +
      "/historyback\n" +
      "/formlist\n" +
      "/form <name>"
    yield* telegramBotApi.sendMessage({
      chat_id: chatId,
      text: helpMessage
    })
  })

// Start command handler effect
export const startCommandHandler: CommandHandler = (
  chatId,
  userId,
  messageText,
  args,
  { telegramBotApi }
) =>
  Effect.gen(function*() {
    yield* Effect.logInfo(chatId, userId, messageText, args)
    const startMessage = "Welcome! I'm your Telegram bot. Use /help to see available commands."
    yield* telegramBotApi.sendMessage({
      chat_id: chatId,
      text: startMessage
    })
  })

// photo1 command handler effect
export const photo1CommandHandler: CommandHandler = (
  chatId,
  userId,
  messageText,
  args,
  { telegramBotApi }
) =>
  Effect.gen(function*() {
    yield* Effect.logInfo(chatId, userId, messageText, args)
    const message = yield* telegramBotApi.sendPhoto({
      caption: "📸 293906.jpeg",
      chat_id: chatId,
      photo: "https://avatars.githubusercontent.com/u/293906?v=4"
    })
    yield* Effect.logInfo(message)
  })

// photo2 command handler effect
export const photo2CommandHandler: CommandHandler = (
  chatId,
  userId,
  messageText,
  args,
  { messageCache: messageCache, telegramBotApi }
) =>
  Effect.gen(function*() {
    yield* Effect.logInfo(chatId, userId, messageText, args)
    const message = yield* telegramBotApi.sendPhoto({
      caption: "📸 293906.jpeg",
      chat_id: chatId,
      photo: "AgACAgQAAxkDAANeaQ9EyYY_8iIgQ-3RvHW3uu_NsLoAAq8LaxvPVH1QQEg0_LbVf5EBAAMCAAN4AAM2BA"
    })
    yield* Effect.logInfo(message)
    yield* messageCache.set("293906.jpeg", message)
  })

async function fetchphotoAsBuffer(url: string) {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch photo: ${response.status} ${response.statusText}`)
  }
  const arrayBuffer = await response.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

// photo3 command handler effect
export const photo3CommandHandler: CommandHandler = (
  chatId,
  userId,
  messageText,
  args,
  { telegramBotApi }
) =>
  Effect.gen(function*() {
    yield* Effect.logInfo(chatId, userId, messageText, args)
    const url = "https://avatars.githubusercontent.com/u/293906?v=4"
    const blob = yield* Effect.promise(() => fetchphotoAsBuffer(url))
    const message = yield* telegramBotApi.sendPhoto({
      caption: "📸 293906.jpeg",
      chat_id: chatId,
      photo: {
        content: blob,
        filename: "293906.jpeg",
        mime_type: "photo/jpeg"
      }
    })
    yield* Effect.logInfo(message)
  })

// Historypush command handler effect
export const historypushCommandHandler: CommandHandler = (
  chatId,
  userId,
  messageText,
  args,
  { historyCache, telegramBotApi }
) =>
  Effect.gen(function*() {
    yield* Effect.logInfo(chatId, userId, messageText, args)
    const method = "sendMessage"
    const text = "HISTORY PUSH"
    const data = { chat_id: chatId, text }
    yield* telegramBotApi[method](data)
    yield* historyCache.push(userId, { data, method })
  })

// Historyback command handler effect
export const historybackCommandHandler: CommandHandler = (
  chatId,
  userId,
  messageText,
  args,
  { historyCache }
) =>
  Effect.gen(function*() {
    yield* Effect.logInfo(chatId, userId, messageText, args)
    yield* historyCache.back(userId)
  })

// Form command handler effect
export const formCommandHandler: CommandHandler = (
  chatId,
  userId,
  messageText,
  args,
  { formManager, telegramBotApi }
) =>
  Effect.gen(function*() {
    yield* Effect.logInfo(chatId, userId, messageText, args)
    if (args.length < 1) {
      yield* telegramBotApi.sendMessage({
        chat_id: chatId,
        text: "Please provide a form name. Usage: /form <formName>"
      })
    } else {
      const formName = args[0]
      // Try to start the form
      yield* formManager.startForm(chatId, formName, telegramBotApi).pipe(
        Effect.catchAll((error) =>
          telegramBotApi.sendMessage({
            chat_id: chatId,
            text: `Error starting form: ${error.message || "Unknown error"}`
          })
        )
      )
    }
  })

// Form list command handler effect
export const formListCommandHandler: CommandHandler = (
  chatId,
  userId,
  messageText,
  args,
  { telegramBotApi }
) =>
  Effect.gen(function*() {
    yield* Effect.logInfo(chatId, userId, messageText, args)
    // For now, we'll send a placeholder message about available forms
    // In a more sophisticated implementation, we would have a way to list registered forms
    yield* telegramBotApi.sendMessage({
      chat_id: chatId,
      text: "Available forms: registration (example forms)"
    })
  })
