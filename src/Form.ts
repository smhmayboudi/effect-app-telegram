import { Context, Effect, HashMap, Layer, Option, Ref } from "effect"
import type { TelegramBotApi } from "./TelegramBotApi.js"
import { TelegramBotApiError } from "./TelegramBotApi.js"

// =============================================================================
// Form Types
// =============================================================================

export interface FormStep {
  /** The key to store the user's response under in the results */
  readonly expectedValue: string
  /** The message to send to the user at this step */
  readonly message: string
}

export interface FormDefinition {
  /** The unique name of the form */
  readonly name: string
  /** The steps that comprise the form */
  readonly steps: Array<FormStep>
  /**
   * Function called when the form is completed
   * @param results The collected results from all form steps
   * @param telegramBotApi The API instance to send messages back to the user
   * @param chatId The ID of the chat where the form was completed
   */
  readonly onComplete: (
    chatId: number,
    results: Record<string, string>,
    telegramBotApi: TelegramBotApi
  ) => Effect.Effect<void, TelegramBotApiError>
}

export interface FormState {
  /** The index of the current step the user is on */
  readonly currentStep: number
  /** The name of the form being filled out */
  readonly formName: string
  /** The collected results so far */
  readonly results: Record<string, string>
}

// =============================================================================
// Form Cache
// =============================================================================

/**
 * Cache to store form states per chat/user
 */
export interface FormCache {
  /**
   * Delete the form state for a chat (typically done when form is completed)
   * @param chatId The ID of the chat to delete state for
   */
  delete(chatId: number): Effect.Effect<void, never>
  /**
   * Get the current form state for a chat
   * @param chatId The ID of the chat to get state for
   * @returns The form state if present, or None if no active form
   */
  get(chatId: number): Effect.Effect<Option.Option<FormState>, never>
  /**
   * Set the form state for a chat
   * @param chatId The ID of the chat to set state for
   * @param state The form state to store
   */
  set(chatId: number, state: FormState): Effect.Effect<void, never>
}

export class FormCacheContext extends Context.Tag(
  "@context/FormCache"
)<FormCacheContext, FormCache>() {}

export const FormCacheLive = Layer.effect(
  FormCacheContext,
  Effect.gen(function*() {
    const state = yield* Ref.make(HashMap.empty<number, FormState>())

    return FormCacheContext.of({
      delete: (chatId) => Ref.update(state, (map) => HashMap.remove(map, chatId)),
      get: (chatId) =>
        Ref.get(state).pipe(
          Effect.map((map) => HashMap.get(map, chatId))
        ),
      set: (chatId, formState) => Ref.update(state, (map) => HashMap.set(map, chatId, formState))
    })
  })
)

// =============================================================================
// Form Manager
// =============================================================================

/**
 * Service to manage forms and their states
 */
export interface FormManager {
  /**
   * Process user input during a form
   * @param chatId The ID of the chat where the input came from
   * @param input The user's input
   * @param telegramBotApi The API instance to send messages back to the user
   */
  processInput(chatId: number, input: string, telegramBotApi: TelegramBotApi): Effect.Effect<void, TelegramBotApiError>
  /**
   * Register a new form definition
   * @param formDefinition The form to register
   */
  registerForm(formDefinition: FormDefinition): Effect.Effect<void>
  /**
   * Start a form for a specific chat
   * @param chatId The ID of the chat to start the form in
   * @param formName The name of the form to start
   */
  startForm(chatId: number, formName: string, telegramBotApi: TelegramBotApi): Effect.Effect<void, TelegramBotApiError>
}

export class FormManagerContext extends Context.Tag(
  "@context/FormManager"
)<FormManagerContext, FormManager>() {}

export const FormManagerLive = Layer.effect(
  FormManagerContext,
  Effect.gen(function*() {
    const formCache = yield* FormCacheContext
    const formsRef = yield* Ref.make(new Map<string, FormDefinition>())

    return FormManagerContext.of({
      processInput: (chatId, input, telegramBotApi) =>
        Effect.gen(function*() {
          const maybeFormState = yield* formCache.get(chatId)
          if (Option.isNone(maybeFormState)) {
            // No active form for this chat, ignore the input
            yield* Effect.void
            return
          }
          const formState = maybeFormState.value
          const formsMap = yield* Ref.get(formsRef)
          const formDef = formsMap.get(formState.formName)
          if (!formDef) {
            yield* Effect.fail(
              new TelegramBotApiError({
                message: `Form "${formState.formName}" not found`
              })
            )
            return
          }
          // Store the user's input for the current step
          const currentStep = formDef.steps[formState.currentStep]
          const updatedResults = {
            ...formState.results,
            [currentStep.expectedValue]: input
          }
          const nextStepIndex = formState.currentStep + 1
          if (nextStepIndex >= formDef.steps.length) {
            // Form is complete
            yield* formDef.onComplete(chatId, updatedResults, telegramBotApi)
            yield* formCache.delete(chatId)
            return
          }
          // Move to the next step
          const nextStep = formDef.steps[nextStepIndex]
          const newState: FormState = {
            currentStep: nextStepIndex,
            formName: formState.formName,
            results: updatedResults
          }
          yield* formCache.set(chatId, newState)
          // Send next step message
          yield* telegramBotApi.sendMessage({
            chat_id: chatId,
            text: nextStep.message
          })
        }),
      registerForm: (formDefinition) =>
        Ref.update(formsRef, (formsMap) => formsMap.set(formDefinition.name, formDefinition)),
      startForm: (chatId, formName, telegramBotApi) =>
        Effect.gen(function*() {
          const formsMap = yield* Ref.get(formsRef)
          const formDef = formsMap.get(formName)
          if (!formDef || formDef.steps.length === 0) {
            yield* Effect.fail(
              new TelegramBotApiError({
                message: `Form "${formName}" not found or has no steps`
              })
            )
            return
          }
          const initiaStepIndex = 0
          const initiaStep = formDef.steps[initiaStepIndex]
          const initialState: FormState = {
            currentStep: initiaStepIndex,
            formName,
            results: {}
          }
          yield* formCache.set(chatId, initialState)
          // Send first step message
          yield* telegramBotApi.sendMessage({
            chat_id: chatId,
            text: initiaStep.message
          })
        })
    })
  })
)

// =============================================================================
// Form Creation Helper Functions
// =============================================================================

/**
 * Creates a new form definition
 * @param name The unique name of the form
 * @param steps The steps that comprise the form
 * @param onComplete Function to call when the form is completed
 * @returns A new form definition
 */
export const createForm = (
  name: string,
  steps: Array<FormStep>,
  onComplete: (
    chatId: number,
    results: Record<string, string>,
    telegramBotApi: TelegramBotApi
  ) => Effect.Effect<void, TelegramBotApiError>
): FormDefinition => ({ name, steps, onComplete })

/**
 * Creates a single form step
 * @param message The message to send to the user at this step
 * @param expectedValue The key to store the user's response under
 * @returns A new form step
 */
export const createFormStep = (
  message: string,
  expectedValue: string
): FormStep => ({ message, expectedValue })
