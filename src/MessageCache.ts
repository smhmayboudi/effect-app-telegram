import { Context, Effect, Layer } from "effect"
import type { Message } from "./TelegramBotApi.js"

export interface MessageCache {
  get(key: string): Effect.Effect<Message | undefined>
  has(key: string): Effect.Effect<boolean>
  save(key: string, message: Message): Effect.Effect<void>
}

export class InputFileCacheContext extends Context.Tag(
  "@context/MessageCache"
)<InputFileCacheContext, MessageCache>() {}

export const InputFileCacheLive = Layer.effect(
  InputFileCacheContext,
  Effect.sync(() => {
    // Create an in-memory Map to store cached messages
    const fileMap: Map<string, Message> = new Map()

    // Implementation of the MessageCache methods
    return InputFileCacheContext.of({
      get: (key) => Effect.sync(() => fileMap.get(key)),
      has: (key) => Effect.sync(() => fileMap.has(key)),
      save: (key, message) =>
        Effect.sync(() => {
          fileMap.set(key, message)
        })
    })
  })
)
