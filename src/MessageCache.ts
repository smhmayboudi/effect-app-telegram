import { Context, Effect, Layer } from "effect"
import type { Message } from "./TelegramBotApi.js"

export interface MessageCache {
  get(key: string): Effect.Effect<Message | undefined>
  set(key: string, message: Message): Effect.Effect<void>
}

export class MessageCacheContext extends Context.Tag(
  "@context/MessageCache"
)<MessageCacheContext, MessageCache>() {}

export const MessageCacheLive = Layer.effect(
  MessageCacheContext,
  Effect.sync(() => {
    // Create an in-memory Map to store cached messages
    const messages: Map<string, Message> = new Map()

    // Implementation of the MessageCache methods
    return MessageCacheContext.of({
      get: (key) => Effect.sync(() => messages.get(key)),
      set: (key, message) =>
        Effect.sync(() => {
          messages.set(key, message)
        })
    })
  })
)
