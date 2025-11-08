import { Effect } from "effect"
import type { CommandHandler } from "./CommandManager.js"
import { TelegramBotApiError } from "./TelegramBotApi.js"

// Help command handler effect
export const audioCommandHandler: CommandHandler = (
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
        text: "Please provide an audio filename. Usage: /audio <filename>"
      })
      return
    }
    const filename = args[0]
    // Check if audio exists in cache
    const hasFile = yield* inputFileCache.has(filename).pipe(
      Effect.mapError((error) =>
        new TelegramBotApiError({
          message: `Error processing audio command: ${String(error)}`
        })
      )
    )
    if (hasFile) {
      // Send audio from cache
      const cachedFile = yield* inputFileCache.get(filename).pipe(
        Effect.mapError((error) =>
          new TelegramBotApiError({
            message: `Error processing audio command: ${String(error)}`
          })
        )
      )
      if (cachedFile) {
        yield* Effect.logInfo(`Sending cached audio: ${filename}`)
        yield* telegramBotApi.sendAudio({
          audio: cachedFile,
          caption: `Playing cached audio: ${filename}`,
          chat_id: chatId
        })
        return
      }
    }
    // If not in cache, send a message that the audio is not available
    yield* Effect.logInfo(`Audio not found in cache: ${filename}`)
    yield* telegramBotApi.sendMessage({
      chat_id: chatId,
      text: `Audio file "${filename}" not found in cache.`
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
      "/audio <filename> - Send an audio file from cache\n" +
      "/image1 image 1\n" +
      "/image2 image 2\n" +
      "/image3 image 3"
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

// Image1 command handler effect
export const image1CommandHandler: CommandHandler = (
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

// Image2 command handler effect
export const image2CommandHandler: CommandHandler = (
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
      photo: "AgACAgQAAxkDAANeaQ9EyYY_8iIgQ-3RvHW3uu_NsLoAAq8LaxvPVH1QQEg0_LbVf5EBAAMCAAN4AAM2BA"
    })
    yield* Effect.logInfo(message)
  })

async function fetchImageAsBuffer(url: string) {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`)
  }
  const arrayBuffer = await response.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

// Image3 command handler effect
export const image3CommandHandler: CommandHandler = (
  chatId,
  userId,
  messageText,
  args,
  { telegramBotApi }
) =>
  Effect.gen(function*() {
    yield* Effect.logInfo(chatId, userId, messageText, args)
    const url = "https://avatars.githubusercontent.com/u/293906?v=4"
    const blob = yield* Effect.promise(() => fetchImageAsBuffer(url))
    const message = yield* telegramBotApi.sendPhoto({
      caption: "📸 293906.jpeg",
      chat_id: chatId,
      photo: {
        content: blob,
        filename: "293906.jpeg",
        mime_type: "image/jpeg"
      }
    })
    yield* Effect.logInfo(message)
  })
