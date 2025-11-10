import { Context, Effect, Layer, Ref } from "effect"
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
  Effect.gen(function*() {
    // Create an in-memory Map to store cached messages
    const messagesRef = yield* Ref.make(new Map<string, Message>())

    // Implementation of the MessageCache methods
    return MessageCacheContext.of({
      get: (key) =>
        Ref.get(messagesRef).pipe(
          Effect.map((messages) => messages.get(key))
        ),
      set: (key, message) => Ref.update(messagesRef, (messages) => messages.set(key, message))
    })
  })
)
