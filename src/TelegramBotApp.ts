import { Effect, Layer, pipe, Schedule } from "effect"

import { CommandManagerContext, CommandManagerLive } from "./CommandManager.js"
import { audioCommandHandler, helpCommandHandler, startCommandHandler } from "./CommandManagerApp.js"
import { InputFileCacheLive } from "./InputFileCache.js"
import { TelegramBotApiConfigLive, TelegramBotApiContext, TelegramBotApiLive } from "./TelegramBotApi.js"

// Application logic to handle incoming messages
const handleUpdates = Effect.gen(function*() {
  const commandManager = yield* CommandManagerContext
  const telegramBotApi = yield* TelegramBotApiContext
  let offset = 0 // To track the latest update ID

  // Register built-in commands
  commandManager.register("audio", audioCommandHandler)
  commandManager.register("help", helpCommandHandler)
  commandManager.register("start", startCommandHandler)

  // Infinite loop to continuously poll for updates
  yield* Effect.forever(
    Effect.gen(function*() {
      // Get updates from the bot API
      const updates = yield* telegramBotApi.getUpdates({
        allowed_updates: ["message"], // Only get message updates
        offset: offset + 1, // Start from the next update after the last one
        timeout: 30 // Long polling timeout in seconds
      })
      // Process each update
      for (const update of updates) {
        yield* Effect.logInfo("Processing update:", update)
        // Check if the update contains a message
        if (update.message && update.message.from && update.message.text) {
          const chatId = update.message.chat.id
          const userId = update.message.from.id
          const messageText = update.message.text
          yield* Effect.logInfo(`Received message from user ${userId}: ${messageText}`)

          // Check if the message is a command
          if (messageText.startsWith("/")) {
            yield* commandManager.handle(messageText, chatId, userId)
          } else {
            // Send "hi" back to the user for non-command messages
            const text = "hi"
            yield* telegramBotApi.sendMessage({
              chat_id: chatId,
              reply_parameters: { message_id: update.message.message_id },
              text
            })
            yield* Effect.logInfo(`Replied to user ${userId} with "${text}"`)
          }
        }
        // Update offset to the latest processed update ID
        if (update.update_id >= offset) {
          offset = update.update_id
        }
      }
    })
  ).pipe(Effect.schedule(Schedule.spaced("1000 millis")))
})

// Define a layer that includes both the config and the Telegram Bot API service
const TelegramBotAppLive = Layer.provide(
  TelegramBotApiLive,
  TelegramBotApiConfigLive
)

// Main application
pipe(
  handleUpdates,
  Effect.provide(CommandManagerLive),
  Effect.provide(InputFileCacheLive),
  Effect.provide(TelegramBotAppLive),
  Effect.catchAll((error) => {
    console.error("Application error:", error)
    return Effect.die(error)
  }),
  Effect.runPromise
)

console.log("Telegram Bot App started. Press Ctrl+C to stop.")
