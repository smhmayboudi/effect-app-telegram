import { Effect } from "effect"
import type { CommandHandler } from "./CommandManager.js"
import { TelegramBotApiError } from "./TelegramBotApi.js"

// Help command handler effect
export const photoCommandHandler: CommandHandler = (
  chatId,
  userId,
  messageText,
  args,
  { inputFileCache, telegramBotApi }
) =>
  Effect.gen(function*() {
    yield* Effect.logInfo(chatId, userId, messageText, args)
    // Extract filename from command arguments
    if (args.length < 1) {
      yield* telegramBotApi.sendMessage({
        chat_id: chatId,
        text: "Please provide an photo filename. Usage: /photo <filename>"
      })
      return
    }
    const filename = args[0]
    // Check if photo exists in cache
    const hasFile = yield* inputFileCache.has(filename).pipe(
      Effect.mapError((error) =>
        new TelegramBotApiError({
          message: `Error processing photo command: ${String(error)}`
        })
      )
    )
    if (hasFile) {
      // Send photo from cache
      const cachedFile = yield* inputFileCache.get(filename).pipe(
        Effect.mapError((error) =>
          new TelegramBotApiError({
            message: `Error processing photo command: ${String(error)}`
          })
        )
      )
      if (cachedFile) {
        yield* Effect.logInfo(`Sending cached photo: ${filename}`)
        yield* telegramBotApi.sendPhoto({
          caption: `Playing cached photo: ${filename}`,
          chat_id: chatId,
          photo: cachedFile.photo?.sort((a, b) => b.width - a.width)[0].file_id ?? ""
        })
        return
      }
    }
    // If not in cache, send a message that the photo is not available
    yield* Effect.logInfo(`photo not found in cache: ${filename}`)
    yield* telegramBotApi.sendMessage({
      chat_id: chatId,
      text: `photo file "${filename}" not found in cache.`
    })
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
      "/photo3 photo 3"
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
  { inputFileCache, telegramBotApi }
) =>
  Effect.gen(function*() {
    yield* Effect.logInfo(chatId, userId, messageText, args)
    const message = yield* telegramBotApi.sendPhoto({
      caption: "📸 293906.jpeg",
      chat_id: chatId,
      photo: "AgACAgQAAxkDAANeaQ9EyYY_8iIgQ-3RvHW3uu_NsLoAAq8LaxvPVH1QQEg0_LbVf5EBAAMCAAN4AAM2BA"
    })
    yield* Effect.logInfo(message)
    yield* inputFileCache.save("293906.jpeg", message)
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
