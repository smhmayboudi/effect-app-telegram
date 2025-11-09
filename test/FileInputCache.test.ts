import { describe, expect, it } from "@effect/vitest"
import { Effect } from "effect"
import { InputFileCacheContext, InputFileCacheLive } from "../src/InputFileCache.js"

// Test suite for AudioCacheService
describe("AudioCacheService", () => {
  it("should save and retrieve an audio file", () => {
    return Effect.gen(function*() {
      const inputFileCache = yield* InputFileCacheContext

      const filename = "test-audio.mp3"
      const audioData = {
        content: Buffer.from("fake audio data"),
        filename: "test-audio.mp3",
        mime_type: "audio/mpeg"
      }

      // Save the input file
      yield* inputFileCache.save(filename, audioData)

      // Retrieve the input file
      const retrievedAudio = yield* inputFileCache.get(filename)

      // Verify the retrieved audio matches the original
      expect(retrievedAudio).not.toBeNull()
      if (retrievedAudio) {
        expect(retrievedAudio.filename).toBe(filename)
        expect((retrievedAudio.content as Buffer).toString()).toBe("fake audio data")
      }
    }).pipe(
      Effect.provide(InputFileCacheLive)
    )
  })

  it("should return null for non-existent audio", () => {
    return Effect.gen(function*() {
      const inputFileCache = yield* InputFileCacheContext

      const filename = "non-existent.mp3"

      // Attempt to retrieve a non-existent input file
      const retrievedAudio = yield* inputFileCache.get(filename)

      // Verify that null is returned
      expect(retrievedAudio).toBeNull()
    }).pipe(
      Effect.provide(InputFileCacheLive)
    )
  })

  it("should correctly check if audio exists in cache", () => {
    return Effect.gen(function*() {
      const inputFileCache = yield* InputFileCacheContext

      const filename = "check-exists.mp3"
      const audioData = {
        content: Buffer.from("test data"),
        filename: "check-exists.mp3",
        mime_type: "audio/mpeg"
      }

      // Initially, the input file should not exist
      let exists = yield* inputFileCache.has(filename)
      expect(exists).toBe(false)

      // Save the input file
      yield* inputFileCache.save(filename, audioData)

      // Now, the input file should exist
      exists = yield* inputFileCache.has(filename)
      expect(exists).toBe(true)

      // Check for non-existent file
      const nonExistentExists = yield* inputFileCache.has("non-existent.mp3")
      expect(nonExistentExists).toBe(false)
    }).pipe(
      Effect.provide(InputFileCacheLive)
    )
  })

  it("should update existing audio file", () => {
    return Effect.gen(function*() {
      const inputFileCache = yield* InputFileCacheContext

      const filename = "update-test.mp3"
      const initialData = {
        content: Buffer.from("initial data"),
        filename: "update-test.mp3",
        mime_type: "audio/mpeg"
      }
      const updatedData = {
        content: Buffer.from("updated data"),
        filename: "update-test.mp3",
        mime_type: "audio/mpeg"
      }

      // Save initial input file data
      yield* inputFileCache.save(filename, initialData)

      // Retrieve and verify initial data
      let retrievedAudio = yield* inputFileCache.get(filename)
      expect(retrievedAudio).not.toBeNull()
      if (retrievedAudio) {
        expect((retrievedAudio.content as Buffer).toString()).toBe("initial data")
      }

      // Update with new data
      yield* inputFileCache.save(filename, updatedData)

      // Retrieve and verify updated data
      retrievedAudio = yield* inputFileCache.get(filename)
      expect(retrievedAudio).not.toBeNull()
      if (retrievedAudio) {
        expect((retrievedAudio.content as Buffer).toString()).toBe("updated data")
      }
    }).pipe(
      Effect.provide(InputFileCacheLive)
    )
  })
})
