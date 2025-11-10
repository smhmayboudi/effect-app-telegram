import { Context, Effect, Layer, Ref } from "effect"
import { type TelegramBotApi, TelegramBotApiContext, type TelegramBotApiError } from "./TelegramBotApi.js"

export interface History {
  data: any
  method: string
}

export interface HistoryCache {
  back(userId: number): Effect.Effect<void, TelegramBotApiError>
  delete(userId: number): Effect.Effect<void>
  push(userId: number, item: History): Effect.Effect<void>
}

export class HistoryCacheContext extends Context.Tag(
  "@context/HistoryCache"
)<HistoryCacheContext, HistoryCache>() {}

export const HistoryCacheLive = Layer.effect(
  HistoryCacheContext,
  Effect.gen(function*() {
    const telegramBotApi = yield* TelegramBotApiContext

    // Create an in-memory Map to store cached histories
    const historiesRef = yield* Ref.make(new Map<number, Array<History>>())

    // Implementation of the HistoryCache methods
    return HistoryCacheContext.of({
      back: (userId) =>
        Effect.gen(function*() {
          const histories = yield* Ref.get(historiesRef)
          const history = histories.get(userId)?.pop()
          if (
            history && history.method in telegramBotApi &&
            typeof telegramBotApi[history.method as keyof TelegramBotApi] === "function"
          ) {
            yield* telegramBotApi[history.method as keyof TelegramBotApi](history.data)
          }
        }),
      delete: (userId) =>
        Ref.update(historiesRef, (histories) => {
          histories.delete(userId)

          return histories
        }),
      push: (userId, item) =>
        Ref.update(historiesRef, (histories) => {
          const userHistory = histories.get(userId)
          if (userHistory) {
            userHistory.push(item)
          } else {
            histories.set(userId, [item])
          }

          return histories
        })
    })
  })
)
