import { Context, Effect, Layer } from "effect"
import type { InputFile } from "./TelegramBotApi.js"

export interface InputFileCache {
  get(filename: string): Effect.Effect<InputFile | undefined, Error>
  has(filename: string): Effect.Effect<boolean, Error>
  save(filename: string, inputFile: InputFile): Effect.Effect<void, Error>
}

export class InputFileCacheContext extends Context.Tag(
  "@context/InputFileCache"
)<InputFileCacheContext, InputFileCache>() {}

export const InputFileCacheLive = Layer.effect(
  InputFileCacheContext,
  Effect.sync(() => {
    // Create an in-memory Map to store cached input files
    const fileMap: Map<string, InputFile> = new Map()

    // Implementation of the InputFileCache methods
    return InputFileCacheContext.of({
      get: (filename) => Effect.sync(() => fileMap.get(filename)),
      has: (filename) => Effect.sync(() => fileMap.has(filename)),
      save: (filename, inputFile) =>
        Effect.sync(() => {
          fileMap.set(filename, inputFile)
        })
    })
  })
)
