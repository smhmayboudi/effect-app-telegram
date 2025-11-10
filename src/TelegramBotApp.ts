import { Duration, Effect, pipe, Schedule } from "effect"

import { CommandManagerContext, CommandManagerLive } from "./CommandManager.js"
import {
  formCommandHandler,
  formListCommandHandler,
  helpCommandHandler,
  historybackCommandHandler,
  historypushCommandHandler,
  photo1CommandHandler,
  photo2CommandHandler,
  photo3CommandHandler,
  photoCommandHandler,
  startCommandHandler
} from "./CommandManagerApp.js"
import { createForm, createFormStep, FormCacheLive, FormManagerContext, FormManagerLive } from "./Form.js"
import { HistoryCacheLive } from "./HistoryCache.js"
import { MessageCacheLive } from "./MessageCache.js"
import {
  TelegramBotApiConfigContext,
  TelegramBotApiConfigLive,
  TelegramBotApiContext,
  TelegramBotApiLive
} from "./TelegramBotApi.js"

// Application logic to handle incoming messages
const handleUpdates = Effect.gen(function*() {
  const commandManager = yield* CommandManagerContext
  const formManager = yield* FormManagerContext
  const telegramBotApi = yield* TelegramBotApiContext
  const telegramBotApiConfig = yield* TelegramBotApiConfigContext

  let offset = 0 // To track the latest update ID

  // Register built-in commands
  yield* commandManager.register("help", helpCommandHandler)
  yield* commandManager.register("photo", photoCommandHandler)
  yield* commandManager.register("photo1", photo1CommandHandler)
  yield* commandManager.register("photo2", photo2CommandHandler)
  yield* commandManager.register("photo3", photo3CommandHandler)
  yield* commandManager.register("start", startCommandHandler)
  yield* commandManager.register("historypush", historypushCommandHandler)
  yield* commandManager.register("historyback", historybackCommandHandler)
  yield* commandManager.register("form", formCommandHandler)
  yield* commandManager.register("formlist", formListCommandHandler)

  // Example form registration
  const registrationForm = createForm(
    "registration",
    [
      createFormStep("What is your name?", "name"),
      createFormStep("What is your email address?", "email"),
      createFormStep("What is your age?", "age")
    ],
    (chatId, results, telegramBotApi) =>
      Effect.gen(function*() {
        const text = `Registration complete!\n\nName: ${results.name}\nEmail: ${results.email}\nAge: ${results.age}`
        // Send the completion message to the user
        yield* telegramBotApi.sendMessage({ chat_id: chatId, text })
      })
  )

  yield* formManager.registerForm(registrationForm)

  // Infinite loop to continuously poll for updates
  yield* Effect.forever(
    Effect.gen(function*() {
      // Get updates from the bot API
      const updates = yield* telegramBotApi.getUpdates({
        allowed_updates: ["message"], // Only get message updates
        offset: offset + 1, // Start from the next update after the last one
        timeout: telegramBotApiConfig.timeout / 1000 // Long polling timeout in seconds
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
            // Check if user is filling out a form
            yield* formManager.processInput(chatId, messageText, telegramBotApi)
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
  ).pipe(Effect.schedule(Schedule.spaced(Duration.seconds(telegramBotApiConfig.timeout / 1000))))
})

// Main application
pipe(
  handleUpdates,
  Effect.provide(CommandManagerLive),
  Effect.provide(FormManagerLive),
  Effect.provide(FormCacheLive),
  Effect.provide(HistoryCacheLive),
  Effect.provide(MessageCacheLive),
  Effect.provide(TelegramBotApiLive),
  Effect.provide(TelegramBotApiConfigLive),
  Effect.catchAll((error) => {
    console.error("Application error:", error)
    return Effect.die(error)
  }),
  Effect.runPromise
)

console.log("Telegram Bot App started. Press Ctrl+C to stop.")
