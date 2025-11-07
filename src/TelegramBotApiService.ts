/**
 * Comprehensive Telegram Bot API Service Implementation
 * Using the Effect-TS ecosystem
 *
 * This file contains a complete implementation of all Telegram Bot API methods
 * with proper type safety, error handling, and documentation.
 */

import { FetchHttpClient, HttpClient, HttpClientRequest, type HttpClientResponse } from "@effect/platform"
import type { ResponseError } from "@effect/platform/HttpClientError"
import { Config, Context, Data, Effect, Layer, pipe, Redacted } from "effect"

// =============================================================================
// Error Types
// =============================================================================

/**
 * Base error type for Telegram Bot API operations
 * All specific error types extend this base error
 */
export class TelegramBotApiError extends Data.TaggedError(
  "TelegramBotApiError"
)<{
  /** Error message describing the issue */
  readonly message: string
  /** The API method where the error occurred, if applicable */
  readonly method?: string
}> {}

/**
 * Error for HTTP-related issues (network, timeout, etc.)
 * This error is thrown when there are network issues or timeouts
 */
export class TelegramBotApiNetworkError extends Data.TaggedError(
  "TelegramBotApiNetworkError"
)<{
  /** Error message describing the network issue */
  readonly message: string
  /** The API method where the network error occurred, if applicable */
  readonly method?: string
  /** The underlying error that caused this network error */
  readonly cause?: unknown
}> {}

/**
 * Error for invalid response from the API
 * This error is thrown when the API returns an unexpected or malformed response
 */
export class TelegramBotApiInvalidResponseError extends Data.TaggedError(
  "TelegramBotApiInvalidResponseError"
)<{
  /** Error message describing the invalid response */
  readonly message: string
  /** The API method where the invalid response occurred, if applicable */
  readonly method?: string
  /** The actual response that was considered invalid */
  readonly response?: unknown
}> {}

/**
 * Error for rate limiting by the Telegram API
 * This error is thrown when the API returns a 429 status code indicating rate limiting
 */
export class TelegramBotApiRateLimitError extends Data.TaggedError(
  "TelegramBotApiRateLimitError"
)<{
  /** Error message describing the rate limit issue */
  readonly message: string
  /** The API method that triggered the rate limit */
  readonly method?: string
  /** Number of seconds to wait before making another request, if provided by the API */
  readonly retryAfter?: number
}> {}

/**
 * Error for unauthorized access to the API
 * This error is thrown when the API returns a 401 or 403 status code
 */
export class TelegramBotApiUnauthorizedError extends Data.TaggedError(
  "TelegramBotApiUnauthorizedError"
)<{
  /** Error message describing the authorization issue */
  readonly message: string
  /** The API method where the unauthorized access occurred, if applicable */
  readonly method?: string
}> {}

/**
 * Error for method-specific issues (e.g., wrong parameters)
 * This error is thrown when the API returns an error specific to a method call
 */
export class TelegramBotApiMethodError extends Data.TaggedError(
  "TelegramBotApiMethodError"
)<{
  /** Error message from the API */
  readonly message: string
  /** The API method that resulted in the error */
  readonly method: string
  /** Parameters passed to the method that resulted in the error */
  readonly parameters?: Record<string, unknown>
}> {}

/**
 * Error for file upload/download issues
 * This error is thrown when there are issues with file operations
 */
export class TelegramBotApiFileError extends Data.TaggedError(
  "TelegramBotApiFileError"
)<{
  /** Error message describing the file issue */
  readonly message: string
  /** The API method where the file error occurred, if applicable */
  readonly method?: string
  /** Name of the file that caused the issue */
  readonly fileName?: string
}> {}

/**
 * Error for parsing issues
 * This error is thrown when there are issues parsing data or responses
 */
export class TelegramBotApiParseError extends Data.TaggedError(
  "TelegramBotApiParseError"
)<{
  /** Error message describing the parsing issue */
  readonly message: string
  /** The API method where the parsing error occurred, if applicable */
  readonly method?: string
  /** The field that failed to parse */
  readonly field?: string
  /** The value that failed to parse */
  readonly value?: unknown
}> {}

// =============================================================================
// Type Definitions
// =============================================================================

// Basic types
export type Integer = number
export type Float = number
export type True = boolean
export type Boolean = boolean
export type String = string

/**
 * This object represents an incoming update. At most one of the optional parameters can be present in any given update.
 * @see https://core.telegram.org/bots/api#update
 */
export interface Update {
  /** The update's unique identifier. Update identifiers start from a certain positive number and increase sequentially. This identifier becomes especially handy if you're using webhooks, since it allows you to ignore repeated updates or to restore the correct update sequence, should they get out of order. If there are no new updates for at least a week, then identifier of the next update will be chosen randomly instead of sequentially. */
  update_id: Integer
  /** Optional. New incoming message of any kind - text, photo, sticker, etc. */
  message?: Message
  /** Optional. New version of a message that is known to the bot and was edited. This update may at times be triggered by changes to message fields that are either unavailable or not actively used by your bot. */
  edited_message?: Message
  /** Optional. New incoming channel post of any kind - text, photo, sticker, etc. */
  channel_post?: Message
  /** Optional. New version of a channel post that is known to the bot and was edited. This update may at times be triggered by changes to message fields that are either unavailable or not actively used by your bot. */
  edited_channel_post?: Message
  /** Optional. The bot was connected to or disconnected from a business account, or a user edited an existing connection with the bot */
  business_connection?: BusinessConnection
  /** Optional. New message from a connected business account */
  business_message?: Message
  /** Optional. New version of a message from a connected business account */
  edited_business_message?: Message
  /** Optional. Messages were deleted from a connected business account */
  deleted_business_messages?: BusinessMessagesDeleted
  /** Optional. A reaction to a message was changed by a user. The bot must be an administrator in the chat and must explicitly specify "message_reaction" in the list of allowed_updates to receive these updates. The update isn't received for reactions set by bots. */
  message_reaction?: MessageReactionUpdated
  /** Optional. Reactions to a message with anonymous reactions were changed. The bot must be an administrator in the chat and must explicitly specify "message_reaction_count" in the list of allowed_updates to receive these updates. The updates are grouped and can be sent with delay up to a few minutes. */
  message_reaction_count?: MessageReactionCountUpdated
  /** Optional. New incoming inline query */
  inline_query?: InlineQuery
  /** Optional. The result of an feedback collecting for details on how to enable these updates for your bot. */
  chosen_inline_result?: ChosenInlineResult
  /** Optional. New incoming callback query */
  callback_query?: CallbackQuery
  /** Optional. New incoming shipping query. Only for invoices with flexible price */
  shipping_query?: ShippingQuery
  /** Optional. New incoming pre-checkout query. Contains full information about checkout */
  pre_checkout_query?: PreCheckoutQuery
  /** Optional. A user purchased paid media with a non-empty payload sent by the bot in a non-channel chat */
  purchased_paid_media?: PaidMediaPurchased
  /** Optional. New poll state. Bots receive only updates about manually stopped polls and polls, which are sent by the bot */
  poll?: Poll
  /** Optional. A user changed their answer in a non-anonymous poll. Bots receive new votes only in polls that were sent by the bot itself. */
  poll_answer?: PollAnswer
  /** Optional. The bot's chat member status was updated in a chat. For private chats, this update is received only when the bot is blocked or unblocked by the user. */
  my_chat_member?: ChatMemberUpdated
  /** Optional. A chat member's status was updated in a chat. The bot must be an administrator in the chat and must explicitly specify "chat_member" in the list of allowed_updates to receive these updates. */
  chat_member?: ChatMemberUpdated
  /** Optional. A request to join the chat has been sent. The bot must have the can_invite_users administrator right in the chat to receive these updates. */
  chat_join_request?: ChatJoinRequest
  /** Optional. A chat boost was added or changed. The bot must be an administrator in the chat to receive these updates. */
  chat_boost?: ChatBoostUpdated
  /** Optional. A boost was removed from a chat. The bot must be an administrator in the chat to receive these updates. */
  removed_chat_boost?: ChatBoostRemoved
}

/**
 * Use this method to receive incoming updates using long polling (Update objects.
 * @see https://core.telegram.org/bots/api#getupdates
 */
export interface GetUpdatesParams {
  /** Identifier of the first update to be returned. Must be greater by one than the highest among the identifiers of previously received updates. By default, updates starting with the earliest unconfirmed update are returned. An update is considered confirmed as soon as getUpdates is called with an offset higher than its update_id. The negative offset can be specified to retrieve updates starting from -offset update from the end of the updates queue. All previous updates will be forgotten. */
  offset?: Integer
  /** Limits the number of updates to be retrieved. Values between 1-100 are accepted. Defaults to 100. */
  limit?: Integer
  /** Timeout in seconds for long polling. Defaults to 0, i.e. usual short polling. Should be positive, short polling should be used for testing purposes only. */
  timeout?: Integer
  /** A JSON-serialized list of the update types you want your bot to receive. For example, specify ["message", "edited_channel_post", "callback_query"] to only receive updates of these types. See Update for a complete list of available update types. Specify an empty list to receive all update types except chat_member, message_reaction, and message_reaction_count (default). If not specified, the previous setting will be used.  Please note that this parameter doesn't affect updates created before the call to getUpdates, so unwanted updates may be received for a short period of time. */
  allowed_updates?: Array<String>
}

/**
 * Use this method to specify a URL and receive incoming updates via an outgoing webhook. Whenever there is an update for the bot, we will send an HTTPS POST request to the specified URL, containing a JSON-serialized HTTP status code different from 2XY), we will repeat the request and give up after a reasonable amount of attempts. Returns True on success. If you'd like to make sure that the webhook was set by you, you can specify secret data in the parameter secret_token. If specified, the request will contain a header "X-Telegram-Bot-Api-Secret-Token" with the secret token as content.
 * @see https://core.telegram.org/bots/api#setwebhook
 */
export interface SetWebhookParams {
  /** HTTPS URL to send updates to. Use an empty string to remove webhook integration */
  url: String
  /** Upload your public key certificate so that the root certificate in use can be checked. See our self-signed guide for details. */
  certificate?: InputFile
  /** The fixed IP address which will be used to send webhook requests instead of the IP address resolved through DNS */
  ip_address?: String
  /** The maximum allowed number of simultaneous HTTPS connections to the webhook for update delivery, 1-100. Defaults to 40. Use lower values to limit the load on your bot's server, and higher values to increase your bot's throughput. */
  max_connections?: Integer
  /** A JSON-serialized list of the update types you want your bot to receive. For example, specify ["message", "edited_channel_post", "callback_query"] to only receive updates of these types. See Update for a complete list of available update types. Specify an empty list to receive all update types except chat_member, message_reaction, and message_reaction_count (default). If not specified, the previous setting will be used. Please note that this parameter doesn't affect updates created before the call to the setWebhook, so unwanted updates may be received for a short period of time. */
  allowed_updates?: Array<String>
  /** Pass True to drop all pending updates */
  drop_pending_updates?: Boolean
  /** A secret token to be sent in a header "X-Telegram-Bot-Api-Secret-Token" in every webhook request, 1-256 characters. Only characters A-Z, a-z, 0-9, _ and - are allowed. The header is useful to ensure that the request comes from a webhook set by you. */
  secret_token?: String
}

/**
 * Use this method to remove webhook integration if you decide to switch back to getUpdates. Returns True on success.
 * @see https://core.telegram.org/bots/api#deletewebhook
 */
export interface DeleteWebhookParams {
  /** Pass True to drop all pending updates */
  drop_pending_updates?: Boolean
}

/**
 * Use this method to get current webhook status. Requires no parameters. On success, returns a getUpdates, will return an object with the url field empty.
 * @see https://core.telegram.org/bots/api#getwebhookinfo
 */
export type GetWebhookInfoParams = object

/**
 * Describes the current status of a webhook.
 * @see https://core.telegram.org/bots/api#webhookinfo
 */
export interface WebhookInfo {
  /** Webhook URL, may be empty if webhook is not set up */
  url: String
  /** True, if a custom certificate was provided for webhook certificate checks */
  has_custom_certificate: Boolean
  /** Number of updates awaiting delivery */
  pending_update_count: Integer
  /** Optional. Currently used webhook IP address */
  ip_address?: String
  /** Optional. Unix time for the most recent error that happened when trying to deliver an update via webhook */
  last_error_date?: Integer
  /** Optional. Error message in human-readable format for the most recent error that happened when trying to deliver an update via webhook */
  last_error_message?: String
  /** Optional. Unix time of the most recent error that happened when trying to synchronize available updates with Telegram datacenters */
  last_synchronization_error_date?: Integer
  /** Optional. The maximum allowed number of simultaneous HTTPS connections to the webhook for update delivery */
  max_connections?: Integer
  /** Optional. A list of update types the bot is subscribed to. Defaults to all update types except chat_member */
  allowed_updates?: Array<String>
}

/**
 * This object represents a Telegram user or bot.
 * @see https://core.telegram.org/bots/api#user
 */
export interface User {
  /** Unique identifier for this user or bot. This number may have more than 32 significant bits and some programming languages may have difficulty/silent defects in interpreting it. But it has at most 52 significant bits, so a 64-bit integer or double-precision float type are safe for storing this identifier. */
  id: Integer
  /** True, if this user is a bot */
  is_bot: Boolean
  /** User's or bot's first name */
  first_name: String
  /** Optional. User's or bot's last name */
  last_name?: String
  /** Optional. User's or bot's username */
  username?: String
  /** Optional. IETF language tag of the user's language */
  language_code?: String
  /** Optional. True, if this user is a Telegram Premium user */
  is_premium?: True
  /** Optional. True, if this user added the bot to the attachment menu */
  added_to_attachment_menu?: True
  /** Optional. True, if the bot can be invited to groups. Returned only in getMe. */
  can_join_groups?: Boolean
  /** Optional. True, if getMe. */
  can_read_all_group_messages?: Boolean
  /** Optional. True, if the bot supports inline queries. Returned only in getMe. */
  supports_inline_queries?: Boolean
  /** Optional. True, if the bot can be connected to a Telegram Business account to receive its messages. Returned only in getMe. */
  can_connect_to_business?: Boolean
  /** Optional. True, if the bot has a main Web App. Returned only in getMe. */
  has_main_web_app?: Boolean
}

/**
 * This object represents a chat.
 * @see https://core.telegram.org/bots/api#chat
 */
export interface Chat {
  /** Unique identifier for this chat. This number may have more than 32 significant bits and some programming languages may have difficulty/silent defects in interpreting it. But it has at most 52 significant bits, so a signed 64-bit integer or double-precision float type are safe for storing this identifier. */
  id: Integer
  /** Type of the chat, can be either "private", "group", "supergroup" or "channel" */
  type: String
  /** Optional. Title, for supergroups, channels and group chats */
  title?: String
  /** Optional. Username, for private chats, supergroups and channels if available */
  username?: String
  /** Optional. First name of the other party in a private chat */
  first_name?: String
  /** Optional. Last name of the other party in a private chat */
  last_name?: String
  /** Optional. True, if the supergroup chat is a forum (has topics enabled) */
  is_forum?: True
  /** Optional. True, if the chat is the direct messages chat of a channel */
  is_direct_messages?: True
}

/**
 * This object contains full information about a chat.
 * @see https://core.telegram.org/bots/api#chatfullinfo
 */
export interface ChatFullInfo {
  /** Unique identifier for this chat. This number may have more than 32 significant bits and some programming languages may have difficulty/silent defects in interpreting it. But it has at most 52 significant bits, so a signed 64-bit integer or double-precision float type are safe for storing this identifier. */
  id: Integer
  /** Type of the chat, can be either "private", "group", "supergroup" or "channel" */
  type: String
  /** Optional. Title, for supergroups, channels and group chats */
  title?: String
  /** Optional. Username, for private chats, supergroups and channels if available */
  username?: String
  /** Optional. First name of the other party in a private chat */
  first_name?: String
  /** Optional. Last name of the other party in a private chat */
  last_name?: String
  /** Optional. True, if the supergroup chat is a forum (has topics enabled) */
  is_forum?: True
  /** Optional. True, if the chat is the direct messages chat of a channel */
  is_direct_messages?: True
  /** Identifier of the accent color for the chat name and backgrounds of the chat photo, reply header, and link preview. See accent colors for more details. */
  accent_color_id: Integer
  /** The maximum number of reactions that can be set on a message in the chat */
  max_reaction_count: Integer
  /** Optional. Chat photo */
  photo?: ChatPhoto
  /** Optional. If non-empty, the list of all active chat usernames; for private chats, supergroups and channels */
  active_usernames?: Array<String>
  /** Optional. For private chats, the date of birth of the user */
  birthdate?: Birthdate
  /** Optional. For private chats with business accounts, the intro of the business */
  business_intro?: BusinessIntro
  /** Optional. For private chats with business accounts, the location of the business */
  business_location?: BusinessLocation
  /** Optional. For private chats with business accounts, the opening hours of the business */
  business_opening_hours?: BusinessOpeningHours
  /** Optional. For private chats, the personal channel of the user */
  personal_chat?: Chat
  /** Optional. Information about the corresponding channel chat; for direct messages chats only */
  parent_chat?: Chat
  /** Optional. List of available reactions allowed in the chat. If omitted, then all emoji reactions are allowed. */
  available_reactions?: Array<ReactionType>
  /** Optional. Custom emoji identifier of the emoji chosen by the chat for the reply header and link preview background */
  background_custom_emoji_id?: String
  /** Optional. Identifier of the accent color for the chat's profile background. See profile accent colors for more details. */
  profile_accent_color_id?: Integer
  /** Optional. Custom emoji identifier of the emoji chosen by the chat for its profile background */
  profile_background_custom_emoji_id?: String
  /** Optional. Custom emoji identifier of the emoji status of the chat or the other party in a private chat */
  emoji_status_custom_emoji_id?: String
  /** Optional. Expiration date of the emoji status of the chat or the other party in a private chat, in Unix time, if any */
  emoji_status_expiration_date?: Integer
  /** Optional. Bio of the other party in a private chat */
  bio?: String
  /** Optional. True, if privacy settings of the other party in the private chat allows to use tg://user?id=<user_id> links only in chats with the user */
  has_private_forwards?: True
  /** Optional. True, if the privacy settings of the other party restrict sending voice and video note messages in the private chat */
  has_restricted_voice_and_video_messages?: True
  /** Optional. True, if users need to join the supergroup before they can send messages */
  join_to_send_messages?: True
  /** Optional. True, if all users directly joining the supergroup without using an invite link need to be approved by supergroup administrators */
  join_by_request?: True
  /** Optional. Description, for groups, supergroups and channel chats */
  description?: String
  /** Optional. Primary invite link, for groups, supergroups and channel chats */
  invite_link?: String
  /** Optional. The most recent pinned message (by sending date) */
  pinned_message?: Message
  /** Optional. Default chat member permissions, for groups and supergroups */
  permissions?: ChatPermissions
  /** Information about types of gifts that are accepted by the chat or by the corresponding user for private chats */
  accepted_gift_types: AcceptedGiftTypes
  /** Optional. True, if paid media messages can be sent or forwarded to the channel chat. The field is available only for channel chats. */
  can_send_paid_media?: True
  /** Optional. For supergroups, the minimum allowed delay between consecutive messages sent by each unprivileged user; in seconds */
  slow_mode_delay?: Integer
  /** Optional. For supergroups, the minimum number of boosts that a non-administrator user needs to add in order to ignore slow mode and chat permissions */
  unrestrict_boost_count?: Integer
  /** Optional. The time after which all messages sent to the chat will be automatically deleted; in seconds */
  message_auto_delete_time?: Integer
  /** Optional. True, if aggressive anti-spam checks are enabled in the supergroup. The field is only available to chat administrators. */
  has_aggressive_anti_spam_enabled?: True
  /** Optional. True, if non-administrators can only get the list of bots and administrators in the chat */
  has_hidden_members?: True
  /** Optional. True, if messages from the chat can't be forwarded to other chats */
  has_protected_content?: True
  /** Optional. True, if new chat members will have access to old messages; available only to chat administrators */
  has_visible_history?: True
  /** Optional. For supergroups, name of the group sticker set */
  sticker_set_name?: String
  /** Optional. True, if the bot can change the group sticker set */
  can_set_sticker_set?: True
  /** Optional. For supergroups, the name of the group's custom emoji sticker set. Custom emoji from this set can be used by all users and bots in the group. */
  custom_emoji_sticker_set_name?: String
  /** Optional. Unique identifier for the linked chat, i.e. the discussion group identifier for a channel and vice versa; for supergroups and channel chats. This identifier may be greater than 32 bits and some programming languages may have difficulty/silent defects in interpreting it. But it is smaller than 52 bits, so a signed 64 bit integer or double-precision float type are safe for storing this identifier. */
  linked_chat_id?: Integer
  /** Optional. For supergroups, the location to which the supergroup is connected */
  location?: ChatLocation
}

/**
 * This object represents a message.
 * @see https://core.telegram.org/bots/api#message
 */
export interface Message {
  /** Unique message identifier inside this chat. In specific instances (e.g., message containing a video sent to a big chat), the server might automatically schedule a message instead of sending it immediately. In such cases, this field will be 0 and the relevant message will be unusable until it is actually sent */
  message_id: Integer
  /** Optional. Unique identifier of a message thread to which the message belongs; for supergroups only */
  message_thread_id?: Integer
  /** Optional. Information about the direct messages chat topic that contains the message */
  direct_messages_topic?: DirectMessagesTopic
  /** Optional. Sender of the message; may be empty for messages sent to channels. For backward compatibility, if the message was sent on behalf of a chat, the field contains a fake sender user in non-channel chats */
  from?: User
  /** Optional. Sender of the message when sent on behalf of a chat. For example, the supergroup itself for messages sent by its anonymous administrators or a linked channel for messages automatically forwarded to the channel's discussion group. For backward compatibility, if the message was sent on behalf of a chat, the field from contains a fake sender user in non-channel chats. */
  sender_chat?: Chat
  /** Optional. If the sender of the message boosted the chat, the number of boosts added by the user */
  sender_boost_count?: Integer
  /** Optional. The bot that actually sent the message on behalf of the business account. Available only for outgoing messages sent on behalf of the connected business account. */
  sender_business_bot?: User
  /** Date the message was sent in Unix time. It is always a positive number, representing a valid date. */
  date: Integer
  /** Optional. Unique identifier of the business connection from which the message was received. If non-empty, the message belongs to a chat of the corresponding business account that is independent from any potential bot chat which might share the same identifier. */
  business_connection_id?: String
  /** Chat the message belongs to */
  chat: Chat
  /** Optional. Information about the original message for forwarded messages */
  forward_origin?: MessageOrigin
  /** Optional. True, if the message is sent to a forum topic */
  is_topic_message?: True
  /** Optional. True, if the message is a channel post that was automatically forwarded to the connected discussion group */
  is_automatic_forward?: True
  /** Optional. For replies in the same chat and message thread, the original message. Note that the Message object in this field will not contain further reply_to_message fields even if it itself is a reply. */
  reply_to_message?: Message
  /** Optional. Information about the message that is being replied to, which may come from another chat or forum topic */
  external_reply?: ExternalReplyInfo
  /** Optional. For replies that quote part of the original message, the quoted part of the message */
  quote?: TextQuote
  /** Optional. For replies to a story, the original story */
  reply_to_story?: Story
  /** Optional. Identifier of the specific checklist task that is being replied to */
  reply_to_checklist_task_id?: Integer
  /** Optional. Bot through which the message was sent */
  via_bot?: User
  /** Optional. Date the message was last edited in Unix time */
  edit_date?: Integer
  /** Optional. True, if the message can't be forwarded */
  has_protected_content?: True
  /** Optional. True, if the message was sent by an implicit action, for example, as an away or a greeting business message, or as a scheduled message */
  is_from_offline?: True
  /** Optional. True, if the message is a paid post. Note that such posts must not be deleted for 24 hours to receive the payment and can't be edited. */
  is_paid_post?: True
  /** Optional. The unique identifier of a media message group this message belongs to */
  media_group_id?: String
  /** Optional. Signature of the post author for messages in channels, or the custom title of an anonymous group administrator */
  author_signature?: String
  /** Optional. The number of Telegram Stars that were paid by the sender of the message to send it */
  paid_star_count?: Integer
  /** Optional. For text messages, the actual UTF-8 text of the message */
  text?: String
  /** Optional. For text messages, special entities like usernames, URLs, bot commands, etc. that appear in the text */
  entities?: Array<MessageEntity>
  /** Optional. Options used for link preview generation for the message, if it is a text message and link preview options were changed */
  link_preview_options?: LinkPreviewOptions
  /** Optional. Information about suggested post parameters if the message is a suggested post in a channel direct messages chat. If the message is an approved or declined suggested post, then it can't be edited. */
  suggested_post_info?: SuggestedPostInfo
  /** Optional. Unique identifier of the message effect added to the message */
  effect_id?: String
  /** Optional. Message is an animation, information about the animation. For backward compatibility, when this field is set, the document field will also be set */
  animation?: Animation
  /** Optional. Message is an audio file, information about the file */
  audio?: Audio
  /** Optional. Message is a general file, information about the file */
  document?: Document
  /** Optional. Message contains paid media; information about the paid media */
  paid_media?: PaidMediaInfo
  /** Optional. Message is a photo, available sizes of the photo */
  photo?: Array<PhotoSize>
  /** Optional. Message is a sticker, information about the sticker */
  sticker?: Sticker
  /** Optional. Message is a forwarded story */
  story?: Story
  /** Optional. Message is a video, information about the video */
  video?: Video
  /** Optional. Message is a video note, information about the video message */
  video_note?: VideoNote
  /** Optional. Message is a voice message, information about the file */
  voice?: Voice
  /** Optional. Caption for the animation, audio, document, paid media, photo, video or voice */
  caption?: String
  /** Optional. For messages with a caption, special entities like usernames, URLs, bot commands, etc. that appear in the caption */
  caption_entities?: Array<MessageEntity>
  /** Optional. True, if the caption must be shown above the message media */
  show_caption_above_media?: True
  /** Optional. True, if the message media is covered by a spoiler animation */
  has_media_spoiler?: True
  /** Optional. Message is a checklist */
  checklist?: Checklist
  /** Optional. Message is a shared contact, information about the contact */
  contact?: Contact
  /** Optional. Message is a dice with random value */
  dice?: Dice
  /** Optional. Message is a game, information about the game. More about games » */
  game?: Game
  /** Optional. Message is a native poll, information about the poll */
  poll?: Poll
  /** Optional. Message is a venue, information about the venue. For backward compatibility, when this field is set, the location field will also be set */
  venue?: Venue
  /** Optional. Message is a shared location, information about the location */
  location?: Location
  /** Optional. New members that were added to the group or supergroup and information about them (the bot itself may be one of these members) */
  new_chat_members?: Array<User>
  /** Optional. A member was removed from the group, information about them (this member may be the bot itself) */
  left_chat_member?: User
  /** Optional. A chat title was changed to this value */
  new_chat_title?: String
  /** Optional. A chat photo was change to this value */
  new_chat_photo?: Array<PhotoSize>
  /** Optional. Service message: the chat photo was deleted */
  delete_chat_photo?: True
  /** Optional. Service message: the group has been created */
  group_chat_created?: True
  /** Optional. Service message: the supergroup has been created. This field can't be received in a message coming through updates, because bot can't be a member of a supergroup when it is created. It can only be found in reply_to_message if someone replies to a very first message in a directly created supergroup. */
  supergroup_chat_created?: True
  /** Optional. Service message: the channel has been created. This field can't be received in a message coming through updates, because bot can't be a member of a channel when it is created. It can only be found in reply_to_message if someone replies to a very first message in a channel. */
  channel_chat_created?: True
  /** Optional. Service message: auto-delete timer settings changed in the chat */
  message_auto_delete_timer_changed?: MessageAutoDeleteTimerChanged
  /** Optional. The group has been migrated to a supergroup with the specified identifier. This number may have more than 32 significant bits and some programming languages may have difficulty/silent defects in interpreting it. But it has at most 52 significant bits, so a signed 64-bit integer or double-precision float type are safe for storing this identifier. */
  migrate_to_chat_id?: Integer
  /** Optional. The supergroup has been migrated from a group with the specified identifier. This number may have more than 32 significant bits and some programming languages may have difficulty/silent defects in interpreting it. But it has at most 52 significant bits, so a signed 64-bit integer or double-precision float type are safe for storing this identifier. */
  migrate_from_chat_id?: Integer
  /** Optional. Specified message was pinned. Note that the Message object in this field will not contain further reply_to_message fields even if it itself is a reply. */
  pinned_message?: MaybeInaccessibleMessage
  /** Optional. Message is an invoice for a More about payments » */
  invoice?: Invoice
  /** Optional. Message is a service message about a successful payment, information about the payment. More about payments » */
  successful_payment?: SuccessfulPayment
  /** Optional. Message is a service message about a refunded payment, information about the payment. More about payments » */
  refunded_payment?: RefundedPayment
  /** Optional. Service message: users were shared with the bot */
  users_shared?: UsersShared
  /** Optional. Service message: a chat was shared with the bot */
  chat_shared?: ChatShared
  /** Optional. Service message: a regular gift was sent or received */
  gift?: GiftInfo
  /** Optional. Service message: a unique gift was sent or received */
  unique_gift?: UniqueGiftInfo
  /** Optional. The domain name of the website on which the user has logged in. More about Telegram Login » */
  connected_website?: String
  /** Optional. Service message: the user allowed the bot to write messages after adding it to the attachment or side menu, launching a Web App from a link, or accepting an explicit request from a Web App sent by the method requestWriteAccess */
  write_access_allowed?: WriteAccessAllowed
  /** Optional. Telegram Passport data */
  passport_data?: PassportData
  /** Optional. Service message. A user in the chat triggered another user's proximity alert while sharing Live Location. */
  proximity_alert_triggered?: ProximityAlertTriggered
  /** Optional. Service message: user boosted the chat */
  boost_added?: ChatBoostAdded
  /** Optional. Service message: chat background set */
  chat_background_set?: ChatBackground
  /** Optional. Service message: some tasks in a checklist were marked as done or not done */
  checklist_tasks_done?: ChecklistTasksDone
  /** Optional. Service message: tasks were added to a checklist */
  checklist_tasks_added?: ChecklistTasksAdded
  /** Optional. Service message: the price for paid messages in the corresponding direct messages chat of a channel has changed */
  direct_message_price_changed?: DirectMessagePriceChanged
  /** Optional. Service message: forum topic created */
  forum_topic_created?: ForumTopicCreated
  /** Optional. Service message: forum topic edited */
  forum_topic_edited?: ForumTopicEdited
  /** Optional. Service message: forum topic closed */
  forum_topic_closed?: ForumTopicClosed
  /** Optional. Service message: forum topic reopened */
  forum_topic_reopened?: ForumTopicReopened
  /** Optional. Service message: the 'General' forum topic hidden */
  general_forum_topic_hidden?: GeneralForumTopicHidden
  /** Optional. Service message: the 'General' forum topic unhidden */
  general_forum_topic_unhidden?: GeneralForumTopicUnhidden
  /** Optional. Service message: a scheduled giveaway was created */
  giveaway_created?: GiveawayCreated
  /** Optional. The message is a scheduled giveaway message */
  giveaway?: Giveaway
  /** Optional. A giveaway with public winners was completed */
  giveaway_winners?: GiveawayWinners
  /** Optional. Service message: a giveaway without public winners was completed */
  giveaway_completed?: GiveawayCompleted
  /** Optional. Service message: the price for paid messages has changed in the chat */
  paid_message_price_changed?: PaidMessagePriceChanged
  /** Optional. Service message: a suggested post was approved */
  suggested_post_approved?: SuggestedPostApproved
  /** Optional. Service message: approval of a suggested post has failed */
  suggested_post_approval_failed?: SuggestedPostApprovalFailed
  /** Optional. Service message: a suggested post was declined */
  suggested_post_declined?: SuggestedPostDeclined
  /** Optional. Service message: payment for a suggested post was received */
  suggested_post_paid?: SuggestedPostPaid
  /** Optional. Service message: payment for a suggested post was refunded */
  suggested_post_refunded?: SuggestedPostRefunded
  /** Optional. Service message: video chat scheduled */
  video_chat_scheduled?: VideoChatScheduled
  /** Optional. Service message: video chat started */
  video_chat_started?: VideoChatStarted
  /** Optional. Service message: video chat ended */
  video_chat_ended?: VideoChatEnded
  /** Optional. Service message: new participants invited to a video chat */
  video_chat_participants_invited?: VideoChatParticipantsInvited
  /** Optional. Service message: data sent by a Web App */
  web_app_data?: WebAppData
  /** Optional. Inline keyboard attached to the message. login_url buttons are represented as ordinary url buttons. */
  reply_markup?: InlineKeyboardMarkup
}

/**
 * This object represents a unique message identifier.
 * @see https://core.telegram.org/bots/api#messageid
 */
export interface MessageId {
  /** Unique message identifier. In specific instances (e.g., message containing a video sent to a big chat), the server might automatically schedule a message instead of sending it immediately. In such cases, this field will be 0 and the relevant message will be unusable until it is actually sent */
  message_id: Integer
}

/**
 * This object describes a message that was deleted or is otherwise inaccessible to the bot.
 * @see https://core.telegram.org/bots/api#inaccessiblemessage
 */
export interface InaccessibleMessage {
  /** Chat the message belonged to */
  chat: Chat
  /** Unique message identifier inside the chat */
  message_id: Integer
  /** Always 0. The field can be used to differentiate regular and inaccessible messages. */
  date: 0
}

/**
 * This object describes a message that can be inaccessible to the bot. It can be one of Message, InaccessibleMessage
 * @see https://core.telegram.org/bots/api#maybeinaccessiblemessage
 */
export type MaybeInaccessibleMessage = Message | InaccessibleMessage

/**
 * This object represents one special entity in a text message. For example, hashtags, usernames, URLs, etc.
 * @see https://core.telegram.org/bots/api#messageentity
 */
export interface MessageEntity {
  /** Type of the entity. Currently, can be "mention" (@username), "hashtag" (#hashtag or #hashtag@chatusername), "cashtag" ($USD or $USD@chatusername), "bot_command" (/start@jobs_bot), "url" (https://telegram.org), "email" (do-not-reply@telegram.org), "phone_number" (+1-212-555-0123), "bold" (bold text), "italic" (italic text), "underline" (underlined text), "strikethrough" (strikethrough text), "spoiler" (spoiler message), "blockquote" (block quotation), "expandable_blockquote" (collapsed-by-default block quotation), "code" (monowidth string), "pre" (monowidth block), "text_link" (for clickable text URLs), "text_mention" (for users without usernames), "custom_emoji" (for inline custom emoji stickers) */
  type: String
  /** Offset in UTF-16 code units to the start of the entity */
  offset: Integer
  /** Length of the entity in UTF-16 code units */
  length: Integer
  /** Optional. For "text_link" only, URL that will be opened after user taps on the text */
  url?: String
  /** Optional. For "text_mention" only, the mentioned user */
  user?: User
  /** Optional. For "pre" only, the programming language of the entity text */
  language?: String
  /** Optional. For "custom_emoji" only, unique identifier of the custom emoji. Use getCustomEmojiStickers to get full information about the sticker */
  custom_emoji_id?: String
}

/**
 * This object contains information about the quoted part of a message that is replied to by the given message.
 * @see https://core.telegram.org/bots/api#textquote
 */
export interface TextQuote {
  /** Text of the quoted part of a message that is replied to by the given message */
  text: String
  /** Optional. Special entities that appear in the quote. Currently, only bold, italic, underline, strikethrough, spoiler, and custom_emoji entities are kept in quotes. */
  entities?: Array<MessageEntity>
  /** Approximate quote position in the original message in UTF-16 code units as specified by the sender */
  position: Integer
  /** Optional. True, if the quote was chosen manually by the message sender. Otherwise, the quote was added automatically by the server. */
  is_manual?: True
}

/**
 * This object contains information about a message that is being replied to, which may come from another chat or forum topic.
 * @see https://core.telegram.org/bots/api#externalreplyinfo
 */
export interface ExternalReplyInfo {
  /** Origin of the message replied to by the given message */
  origin: MessageOrigin
  /** Optional. Chat the original message belongs to. Available only if the chat is a supergroup or a channel. */
  chat?: Chat
  /** Optional. Unique message identifier inside the original chat. Available only if the original chat is a supergroup or a channel. */
  message_id?: Integer
  /** Optional. Options used for link preview generation for the original message, if it is a text message */
  link_preview_options?: LinkPreviewOptions
  /** Optional. Message is an animation, information about the animation */
  animation?: Animation
  /** Optional. Message is an audio file, information about the file */
  audio?: Audio
  /** Optional. Message is a general file, information about the file */
  document?: Document
  /** Optional. Message contains paid media; information about the paid media */
  paid_media?: PaidMediaInfo
  /** Optional. Message is a photo, available sizes of the photo */
  photo?: Array<PhotoSize>
  /** Optional. Message is a sticker, information about the sticker */
  sticker?: Sticker
  /** Optional. Message is a forwarded story */
  story?: Story
  /** Optional. Message is a video, information about the video */
  video?: Video
  /** Optional. Message is a video note, information about the video message */
  video_note?: VideoNote
  /** Optional. Message is a voice message, information about the file */
  voice?: Voice
  /** Optional. True, if the message media is covered by a spoiler animation */
  has_media_spoiler?: True
  /** Optional. Message is a checklist */
  checklist?: Checklist
  /** Optional. Message is a shared contact, information about the contact */
  contact?: Contact
  /** Optional. Message is a dice with random value */
  dice?: Dice
  /** Optional. Message is a game, information about the game. More about games » */
  game?: Game
  /** Optional. Message is a scheduled giveaway, information about the giveaway */
  giveaway?: Giveaway
  /** Optional. A giveaway with public winners was completed */
  giveaway_winners?: GiveawayWinners
  /** Optional. Message is an invoice for a More about payments » */
  invoice?: Invoice
  /** Optional. Message is a shared location, information about the location */
  location?: Location
  /** Optional. Message is a native poll, information about the poll */
  poll?: Poll
  /** Optional. Message is a venue, information about the venue */
  venue?: Venue
}

/**
 * Describes reply parameters for the message that is being sent.
 * @see https://core.telegram.org/bots/api#replyparameters
 */
export interface ReplyParameters {
  /** Identifier of the message that will be replied to in the current chat, or in the chat chat_id if it is specified */
  message_id: Integer
  /** Optional. If the message to be replied to is from a different chat, unique identifier for the chat or username of the channel (in the format @channelusername). Not supported for messages sent on behalf of a business account and messages from channel direct messages chats. */
  chat_id?: Integer | String
  /** Optional. Pass True if the message should be sent even if the specified message to be replied to is not found. Always False for replies in another chat or forum topic. Always True for messages sent on behalf of a business account. */
  allow_sending_without_reply?: Boolean
  /** Optional. Quoted part of the message to be replied to; 0-1024 characters after entities parsing. The quote must be an exact substring of the message to be replied to, including bold, italic, underline, strikethrough, spoiler, and custom_emoji entities. The message will fail to send if the quote isn't found in the original message. */
  quote?: String
  /** Optional. Mode for parsing entities in the quote. See formatting options for more details. */
  quote_parse_mode?: String
  /** Optional. A JSON-serialized list of special entities that appear in the quote. It can be specified instead of quote_parse_mode. */
  quote_entities?: Array<MessageEntity>
  /** Optional. Position of the quote in the original message in UTF-16 code units */
  quote_position?: Integer
  /** Optional. Identifier of the specific checklist task to be replied to */
  checklist_task_id?: Integer
}

/**
 * This object describes the origin of a message. It can be one of MessageOriginUser, MessageOriginHiddenUser, MessageOriginChat, MessageOriginChannel
 * @see https://core.telegram.org/bots/api#messageorigin
 */
export type MessageOrigin =
  | MessageOriginUser
  | MessageOriginHiddenUser
  | MessageOriginChat
  | MessageOriginChannel

/**
 * The message was originally sent by a known user.
 * @see https://core.telegram.org/bots/api#messageoriginuser
 */
export interface MessageOriginUser {
  /** Type of the message origin, always "user" */
  type: "user"
  /** Date the message was sent originally in Unix time */
  date: Integer
  /** User that sent the message originally */
  sender_user: User
}

/**
 * The message was originally sent by an unknown user.
 * @see https://core.telegram.org/bots/api#messageoriginhiddenuser
 */
export interface MessageOriginHiddenUser {
  /** Type of the message origin, always "hidden_user" */
  type: "hidden_user"
  /** Date the message was sent originally in Unix time */
  date: Integer
  /** Name of the user that sent the message originally */
  sender_user_name: String
}

/**
 * The message was originally sent on behalf of a chat to a group chat.
 * @see https://core.telegram.org/bots/api#messageoriginchat
 */
export interface MessageOriginChat {
  /** Type of the message origin, always "chat" */
  type: "chat"
  /** Date the message was sent originally in Unix time */
  date: Integer
  /** Chat that sent the message originally */
  sender_chat: Chat
  /** Optional. For messages originally sent by an anonymous chat administrator, original message author signature */
  author_signature?: String
}

/**
 * The message was originally sent to a channel chat.
 * @see https://core.telegram.org/bots/api#messageoriginchannel
 */
export interface MessageOriginChannel {
  /** Type of the message origin, always "channel" */
  type: "channel"
  /** Date the message was sent originally in Unix time */
  date: Integer
  /** Channel chat to which the message was originally sent */
  chat: Chat
  /** Unique message identifier inside the chat */
  message_id: Integer
  /** Optional. Signature of the original post author */
  author_signature?: String
}

/**
 * This object represents one size of a photo or a sticker thumbnail.
 * @see https://core.telegram.org/bots/api#photosize
 */
export interface PhotoSize {
  /** Identifier for this file, which can be used to download or reuse the file */
  file_id: String
  /** Unique identifier for this file, which is supposed to be the same over time and for different bots. Can't be used to download or reuse the file. */
  file_unique_id: String
  /** Photo width */
  width: Integer
  /** Photo height */
  height: Integer
  /** Optional. File size in bytes */
  file_size?: Integer
}

/**
 * This object represents an animation file (GIF or H.264/MPEG-4 AVC video without sound).
 * @see https://core.telegram.org/bots/api#animation
 */
export interface Animation {
  /** Identifier for this file, which can be used to download or reuse the file */
  file_id: String
  /** Unique identifier for this file, which is supposed to be the same over time and for different bots. Can't be used to download or reuse the file. */
  file_unique_id: String
  /** Video width as defined by the sender */
  width: Integer
  /** Video height as defined by the sender */
  height: Integer
  /** Duration of the video in seconds as defined by the sender */
  duration: Integer
  /** Optional. Animation thumbnail as defined by the sender */
  thumbnail?: PhotoSize
  /** Optional. Original animation filename as defined by the sender */
  file_name?: String
  /** Optional. MIME type of the file as defined by the sender */
  mime_type?: String
  /** Optional. File size in bytes. It can be bigger than 2^31 and some programming languages may have difficulty/silent defects in interpreting it. But it has at most 52 significant bits, so a signed 64-bit integer or double-precision float type are safe for storing this value. */
  file_size?: Integer
}

/**
 * This object represents an audio file to be treated as music by the Telegram clients.
 * @see https://core.telegram.org/bots/api#audio
 */
export interface Audio {
  /** Identifier for this file, which can be used to download or reuse the file */
  file_id: String
  /** Unique identifier for this file, which is supposed to be the same over time and for different bots. Can't be used to download or reuse the file. */
  file_unique_id: String
  /** Duration of the audio in seconds as defined by the sender */
  duration: Integer
  /** Optional. Performer of the audio as defined by the sender or by audio tags */
  performer?: String
  /** Optional. Title of the audio as defined by the sender or by audio tags */
  title?: String
  /** Optional. Original filename as defined by the sender */
  file_name?: String
  /** Optional. MIME type of the file as defined by the sender */
  mime_type?: String
  /** Optional. File size in bytes. It can be bigger than 2^31 and some programming languages may have difficulty/silent defects in interpreting it. But it has at most 52 significant bits, so a signed 64-bit integer or double-precision float type are safe for storing this value. */
  file_size?: Integer
  /** Optional. Thumbnail of the album cover to which the music file belongs */
  thumbnail?: PhotoSize
}

/**
 * This object represents a general file (as opposed to audio files).
 * @see https://core.telegram.org/bots/api#document
 */
export interface Document {
  /** Identifier for this file, which can be used to download or reuse the file */
  file_id: String
  /** Unique identifier for this file, which is supposed to be the same over time and for different bots. Can't be used to download or reuse the file. */
  file_unique_id: String
  /** Optional. Document thumbnail as defined by the sender */
  thumbnail?: PhotoSize
  /** Optional. Original filename as defined by the sender */
  file_name?: String
  /** Optional. MIME type of the file as defined by the sender */
  mime_type?: String
  /** Optional. File size in bytes. It can be bigger than 2^31 and some programming languages may have difficulty/silent defects in interpreting it. But it has at most 52 significant bits, so a signed 64-bit integer or double-precision float type are safe for storing this value. */
  file_size?: Integer
}

/**
 * This object represents a story.
 * @see https://core.telegram.org/bots/api#story
 */
export interface Story {
  /** Chat that posted the story */
  chat: Chat
  /** Unique identifier for the story in the chat */
  id: Integer
}

/**
 * This object represents a video file.
 * @see https://core.telegram.org/bots/api#video
 */
export interface Video {
  /** Identifier for this file, which can be used to download or reuse the file */
  file_id: String
  /** Unique identifier for this file, which is supposed to be the same over time and for different bots. Can't be used to download or reuse the file. */
  file_unique_id: String
  /** Video width as defined by the sender */
  width: Integer
  /** Video height as defined by the sender */
  height: Integer
  /** Duration of the video in seconds as defined by the sender */
  duration: Integer
  /** Optional. Video thumbnail */
  thumbnail?: PhotoSize
  /** Optional. Available sizes of the cover of the video in the message */
  cover?: Array<PhotoSize>
  /** Optional. Timestamp in seconds from which the video will play in the message */
  start_timestamp?: Integer
  /** Optional. Original filename as defined by the sender */
  file_name?: String
  /** Optional. MIME type of the file as defined by the sender */
  mime_type?: String
  /** Optional. File size in bytes. It can be bigger than 2^31 and some programming languages may have difficulty/silent defects in interpreting it. But it has at most 52 significant bits, so a signed 64-bit integer or double-precision float type are safe for storing this value. */
  file_size?: Integer
}

/**
 * This object represents a v.4.0).
 * @see https://core.telegram.org/bots/api#videonote
 */
export interface VideoNote {
  /** Identifier for this file, which can be used to download or reuse the file */
  file_id: String
  /** Unique identifier for this file, which is supposed to be the same over time and for different bots. Can't be used to download or reuse the file. */
  file_unique_id: String
  /** Video width and height (diameter of the video message) as defined by the sender */
  length: Integer
  /** Duration of the video in seconds as defined by the sender */
  duration: Integer
  /** Optional. Video thumbnail */
  thumbnail?: PhotoSize
  /** Optional. File size in bytes */
  file_size?: Integer
}

/**
 * This object represents a voice note.
 * @see https://core.telegram.org/bots/api#voice
 */
export interface Voice {
  /** Identifier for this file, which can be used to download or reuse the file */
  file_id: String
  /** Unique identifier for this file, which is supposed to be the same over time and for different bots. Can't be used to download or reuse the file. */
  file_unique_id: String
  /** Duration of the audio in seconds as defined by the sender */
  duration: Integer
  /** Optional. MIME type of the file as defined by the sender */
  mime_type?: String
  /** Optional. File size in bytes. It can be bigger than 2^31 and some programming languages may have difficulty/silent defects in interpreting it. But it has at most 52 significant bits, so a signed 64-bit integer or double-precision float type are safe for storing this value. */
  file_size?: Integer
}

/**
 * Describes the paid media added to a message.
 * @see https://core.telegram.org/bots/api#paidmediainfo
 */
export interface PaidMediaInfo {
  /** The number of Telegram Stars that must be paid to buy access to the media */
  star_count: Integer
  /** Information about the paid media */
  paid_media: Array<PaidMedia>
}

/**
 * This object describes paid media. Currently, it can be one of PaidMediaPreview, PaidMediaPhoto, PaidMediaVideo
 * @see https://core.telegram.org/bots/api#paidmedia
 */
export type PaidMedia = PaidMediaPreview | PaidMediaPhoto | PaidMediaVideo

/**
 * The paid media isn't available before the payment.
 * @see https://core.telegram.org/bots/api#paidmediapreview
 */
export interface PaidMediaPreview {
  /** Type of the paid media, always "preview" */
  type: "preview"
  /** Optional. Media width as defined by the sender */
  width?: Integer
  /** Optional. Media height as defined by the sender */
  height?: Integer
  /** Optional. Duration of the media in seconds as defined by the sender */
  duration?: Integer
}

/**
 * The paid media is a photo.
 * @see https://core.telegram.org/bots/api#paidmediaphoto
 */
export interface PaidMediaPhoto {
  /** Type of the paid media, always "photo" */
  type: "photo"
  /** The photo */
  photo: Array<PhotoSize>
}

/**
 * The paid media is a video.
 * @see https://core.telegram.org/bots/api#paidmediavideo
 */
export interface PaidMediaVideo {
  /** Type of the paid media, always "video" */
  type: "video"
  /** The video */
  video: Video
}

/**
 * This object represents a phone contact.
 * @see https://core.telegram.org/bots/api#contact
 */
export interface Contact {
  /** Contact's phone number */
  phone_number: String
  /** Contact's first name */
  first_name: String
  /** Optional. Contact's last name */
  last_name?: String
  /** Optional. Contact's user identifier in Telegram. This number may have more than 32 significant bits and some programming languages may have difficulty/silent defects in interpreting it. But it has at most 52 significant bits, so a 64-bit integer or double-precision float type are safe for storing this identifier. */
  user_id?: Integer
  /** Optional. Additional data about the contact in the form of a vCard */
  vcard?: String
}

/**
 * This object represents an animated emoji that displays a random value.
 * @see https://core.telegram.org/bots/api#dice
 */
export interface Dice {
  /** Emoji on which the dice throw animation is based */
  emoji: String
  /** Value of the dice, 1-6 for "🎲", "🎯" and "🎳" base emoji, 1-5 for "🏀" and "⚽" base emoji, 1-64 for "🎰" base emoji */
  value: Integer
}

/**
 * This object contains information about one answer option in a poll.
 * @see https://core.telegram.org/bots/api#polloption
 */
export interface PollOption {
  /** Option text, 1-100 characters */
  text: String
  /** Optional. Special entities that appear in the option text. Currently, only custom emoji entities are allowed in poll option texts */
  text_entities?: Array<MessageEntity>
  /** Number of users that voted for this option */
  voter_count: Integer
}

/**
 * This object contains information about one answer option in a poll to be sent.
 * @see https://core.telegram.org/bots/api#inputpolloption
 */
export interface InputPollOption {
  /** Option text, 1-100 characters */
  text: String
  /** Optional. Mode for parsing entities in the text. See formatting options for more details. Currently, only custom emoji entities are allowed */
  text_parse_mode?: String
  /** Optional. A JSON-serialized list of special entities that appear in the poll option text. It can be specified instead of text_parse_mode */
  text_entities?: Array<MessageEntity>
}

/**
 * This object represents an answer of a user in a non-anonymous poll.
 * @see https://core.telegram.org/bots/api#pollanswer
 */
export interface PollAnswer {
  /** Unique poll identifier */
  poll_id: String
  /** Optional. The chat that changed the answer to the poll, if the voter is anonymous */
  voter_chat?: Chat
  /** Optional. The user that changed the answer to the poll, if the voter isn't anonymous */
  user?: User
  /** 0-based identifiers of chosen answer options. May be empty if the vote was retracted. */
  option_ids: Array<Integer>
}

/**
 * This object contains information about a poll.
 * @see https://core.telegram.org/bots/api#poll
 */
export interface Poll {
  /** Unique poll identifier */
  id: String
  /** Poll question, 1-300 characters */
  question: String
  /** Optional. Special entities that appear in the question. Currently, only custom emoji entities are allowed in poll questions */
  question_entities?: Array<MessageEntity>
  /** List of poll options */
  options: Array<PollOption>
  /** Total number of users that voted in the poll */
  total_voter_count: Integer
  /** True, if the poll is closed */
  is_closed: Boolean
  /** True, if the poll is anonymous */
  is_anonymous: Boolean
  /** Poll type, currently can be "regular" or "quiz" */
  type: String
  /** True, if the poll allows multiple answers */
  allows_multiple_answers: Boolean
  /** Optional. 0-based identifier of the correct answer option. Available only for polls in the quiz mode, which are closed, or was sent (not forwarded) by the bot or to the private chat with the bot. */
  correct_option_id?: Integer
  /** Optional. Text that is shown when a user chooses an incorrect answer or taps on the lamp icon in a quiz-style poll, 0-200 characters */
  explanation?: String
  /** Optional. Special entities like usernames, URLs, bot commands, etc. that appear in the explanation */
  explanation_entities?: Array<MessageEntity>
  /** Optional. Amount of time in seconds the poll will be active after creation */
  open_period?: Integer
  /** Optional. Point in time (Unix timestamp) when the poll will be automatically closed */
  close_date?: Integer
}

/**
 * Describes a task in a checklist.
 * @see https://core.telegram.org/bots/api#checklisttask
 */
export interface ChecklistTask {
  /** Unique identifier of the task */
  id: Integer
  /** Text of the task */
  text: String
  /** Optional. Special entities that appear in the task text */
  text_entities?: Array<MessageEntity>
  /** Optional. User that completed the task; omitted if the task wasn't completed */
  completed_by_user?: User
  /** Optional. Point in time (Unix timestamp) when the task was completed; 0 if the task wasn't completed */
  completion_date?: Integer
}

/**
 * Describes a checklist.
 * @see https://core.telegram.org/bots/api#checklist
 */
export interface Checklist {
  /** Title of the checklist */
  title: String
  /** Optional. Special entities that appear in the checklist title */
  title_entities?: Array<MessageEntity>
  /** List of tasks in the checklist */
  tasks: Array<ChecklistTask>
  /** Optional. True, if users other than the creator of the list can add tasks to the list */
  others_can_add_tasks?: True
  /** Optional. True, if users other than the creator of the list can mark tasks as done or not done */
  others_can_mark_tasks_as_done?: True
}

/**
 * Describes a task to add to a checklist.
 * @see https://core.telegram.org/bots/api#inputchecklisttask
 */
export interface InputChecklistTask {
  /** Unique identifier of the task; must be positive and unique among all task identifiers currently present in the checklist */
  id: Integer
  /** Text of the task; 1-100 characters after entities parsing */
  text: String
  /** Optional. Mode for parsing entities in the text. See formatting options for more details. */
  parse_mode?: String
  /** Optional. List of special entities that appear in the text, which can be specified instead of parse_mode. Currently, only bold, italic, underline, strikethrough, spoiler, and custom_emoji entities are allowed. */
  text_entities?: Array<MessageEntity>
}

/**
 * Describes a checklist to create.
 * @see https://core.telegram.org/bots/api#inputchecklist
 */
export interface InputChecklist {
  /** Title of the checklist; 1-255 characters after entities parsing */
  title: String
  /** Optional. Mode for parsing entities in the title. See formatting options for more details. */
  parse_mode?: String
  /** Optional. List of special entities that appear in the title, which can be specified instead of parse_mode. Currently, only bold, italic, underline, strikethrough, spoiler, and custom_emoji entities are allowed. */
  title_entities?: Array<MessageEntity>
  /** List of 1-30 tasks in the checklist */
  tasks: Array<InputChecklistTask>
  /** Optional. Pass True if other users can add tasks to the checklist */
  others_can_add_tasks?: Boolean
  /** Optional. Pass True if other users can mark tasks as done or not done in the checklist */
  others_can_mark_tasks_as_done?: Boolean
}

/**
 * Describes a service message about checklist tasks marked as done or not done.
 * @see https://core.telegram.org/bots/api#checklisttasksdone
 */
export interface ChecklistTasksDone {
  /** Optional. Message containing the checklist whose tasks were marked as done or not done. Note that the Message object in this field will not contain the reply_to_message field even if it itself is a reply. */
  checklist_message?: Message
  /** Optional. Identifiers of the tasks that were marked as done */
  marked_as_done_task_ids?: Array<Integer>
  /** Optional. Identifiers of the tasks that were marked as not done */
  marked_as_not_done_task_ids?: Array<Integer>
}

/**
 * Describes a service message about tasks added to a checklist.
 * @see https://core.telegram.org/bots/api#checklisttasksadded
 */
export interface ChecklistTasksAdded {
  /** Optional. Message containing the checklist to which the tasks were added. Note that the Message object in this field will not contain the reply_to_message field even if it itself is a reply. */
  checklist_message?: Message
  /** List of tasks added to the checklist */
  tasks: Array<ChecklistTask>
}

/**
 * This object represents a point on the map.
 * @see https://core.telegram.org/bots/api#location
 */
export interface Location {
  /** Latitude as defined by the sender */
  latitude: Float
  /** Longitude as defined by the sender */
  longitude: Float
  /** Optional. The radius of uncertainty for the location, measured in meters; 0-1500 */
  horizontal_accuracy?: Float
  /** Optional. Time relative to the message sending date, during which the location can be updated; in seconds. For active live locations only. */
  live_period?: Integer
  /** Optional. The direction in which user is moving, in degrees; 1-360. For active live locations only. */
  heading?: Integer
  /** Optional. The maximum distance for proximity alerts about approaching another chat member, in meters. For sent live locations only. */
  proximity_alert_radius?: Integer
}

/**
 * This object represents a venue.
 * @see https://core.telegram.org/bots/api#venue
 */
export interface Venue {
  /** Venue location. Can't be a live location */
  location: Location
  /** Name of the venue */
  title: String
  /** Address of the venue */
  address: String
  /** Optional. Foursquare identifier of the venue */
  foursquare_id?: String
  /** Optional. Foursquare type of the venue. (For example, "arts_entertainment/default", "arts_entertainment/aquarium" or "food/icecream".) */
  foursquare_type?: String
  /** Optional. Google Places identifier of the venue */
  google_place_id?: String
  /** Optional. Google Places type of the venue. (See supported types.) */
  google_place_type?: String
}

/**
 * Describes data sent from a Web App to the bot.
 * @see https://core.telegram.org/bots/api#webappdata
 */
export interface WebAppData {
  /** The data. Be aware that a bad client can send arbitrary data in this field. */
  data: String
  /** Text of the web_app keyboard button from which the Web App was opened. Be aware that a bad client can send arbitrary data in this field. */
  button_text: String
}

/**
 * This object represents the content of a service message, sent whenever a user in the chat triggers a proximity alert set by another user.
 * @see https://core.telegram.org/bots/api#proximityalerttriggered
 */
export interface ProximityAlertTriggered {
  /** User that triggered the alert */
  traveler: User
  /** User that set the alert */
  watcher: User
  /** The distance between the users */
  distance: Integer
}

/**
 * This object represents a service message about a change in auto-delete timer settings.
 * @see https://core.telegram.org/bots/api#messageautodeletetimerchanged
 */
export interface MessageAutoDeleteTimerChanged {
  /** New auto-delete time for messages in the chat; in seconds */
  message_auto_delete_time: Integer
}

/**
 * This object represents a service message about a user boosting a chat.
 * @see https://core.telegram.org/bots/api#chatboostadded
 */
export interface ChatBoostAdded {
  /** Number of boosts added by the user */
  boost_count: Integer
}

/**
 * This object describes the way a background is filled based on the selected colors. Currently, it can be one of BackgroundFillSolid, BackgroundFillGradient, BackgroundFillFreeformGradient
 * @see https://core.telegram.org/bots/api#backgroundfill
 */
export type BackgroundFill =
  | BackgroundFillSolid
  | BackgroundFillGradient
  | BackgroundFillFreeformGradient

/**
 * The background is filled using the selected color.
 * @see https://core.telegram.org/bots/api#backgroundfillsolid
 */
export interface BackgroundFillSolid {
  /** Type of the background fill, always "solid" */
  type: "solid"
  /** The color of the background fill in the RGB24 format */
  color: Integer
}

/**
 * The background is a gradient fill.
 * @see https://core.telegram.org/bots/api#backgroundfillgradient
 */
export interface BackgroundFillGradient {
  /** Type of the background fill, always "gradient" */
  type: "gradient"
  /** Top color of the gradient in the RGB24 format */
  top_color: Integer
  /** Bottom color of the gradient in the RGB24 format */
  bottom_color: Integer
  /** Clockwise rotation angle of the background fill in degrees; 0-359 */
  rotation_angle: Integer
}

/**
 * The background is a freeform gradient that rotates after every message in the chat.
 * @see https://core.telegram.org/bots/api#backgroundfillfreeformgradient
 */
export interface BackgroundFillFreeformGradient {
  /** Type of the background fill, always "freeform_gradient" */
  type: "freeform_gradient"
  /** A list of the 3 or 4 base colors that are used to generate the freeform gradient in the RGB24 format */
  colors: Array<Integer>
}

/**
 * This object describes the type of a background. Currently, it can be one of BackgroundTypeFill, BackgroundTypeWallpaper, BackgroundTypePattern, BackgroundTypeChatTheme
 * @see https://core.telegram.org/bots/api#backgroundtype
 */
export type BackgroundType =
  | BackgroundTypeFill
  | BackgroundTypeWallpaper
  | BackgroundTypePattern
  | BackgroundTypeChatTheme

/**
 * The background is automatically filled based on the selected colors.
 * @see https://core.telegram.org/bots/api#backgroundtypefill
 */
export interface BackgroundTypeFill {
  /** Type of the background, always "fill" */
  type: "fill"
  /** The background fill */
  fill: BackgroundFill
  /** Dimming of the background in dark themes, as a percentage; 0-100 */
  dark_theme_dimming: Integer
}

/**
 * The background is a wallpaper in the JPEG format.
 * @see https://core.telegram.org/bots/api#backgroundtypewallpaper
 */
export interface BackgroundTypeWallpaper {
  /** Type of the background, always "wallpaper" */
  type: "wallpaper"
  /** Document with the wallpaper */
  document: Document
  /** Dimming of the background in dark themes, as a percentage; 0-100 */
  dark_theme_dimming: Integer
  /** Optional. True, if the wallpaper is downscaled to fit in a 450x450 square and then box-blurred with radius 12 */
  is_blurred?: True
  /** Optional. True, if the background moves slightly when the device is tilted */
  is_moving?: True
}

/**
 * The background is a .PNG or .TGV (gzipped subset of SVG with MIME type "application/x-tgwallpattern") pattern to be combined with the background fill chosen by the user.
 * @see https://core.telegram.org/bots/api#backgroundtypepattern
 */
export interface BackgroundTypePattern {
  /** Type of the background, always "pattern" */
  type: "pattern"
  /** Document with the pattern */
  document: Document
  /** The background fill that is combined with the pattern */
  fill: BackgroundFill
  /** Intensity of the pattern when it is shown above the filled background; 0-100 */
  intensity: Integer
  /** Optional. True, if the background fill must be applied only to the pattern itself. All other pixels are black in this case. For dark themes only */
  is_inverted?: True
  /** Optional. True, if the background moves slightly when the device is tilted */
  is_moving?: True
}

/**
 * The background is taken directly from a built-in chat theme.
 * @see https://core.telegram.org/bots/api#backgroundtypechattheme
 */
export interface BackgroundTypeChatTheme {
  /** Type of the background, always "chat_theme" */
  type: "chat_theme"
  /** Name of the chat theme, which is usually an emoji */
  theme_name: String
}

/**
 * This object represents a chat background.
 * @see https://core.telegram.org/bots/api#chatbackground
 */
export interface ChatBackground {
  /** Type of the background */
  type: BackgroundType
}

/**
 * This object represents a service message about a new forum topic created in the chat.
 * @see https://core.telegram.org/bots/api#forumtopiccreated
 */
export interface ForumTopicCreated {
  /** Name of the topic */
  name: String
  /** Color of the topic icon in RGB format */
  icon_color: Integer
  /** Optional. Unique identifier of the custom emoji shown as the topic icon */
  icon_custom_emoji_id?: String
}

/**
 * This object represents a service message about a forum topic closed in the chat. Currently holds no information.
 * @see https://core.telegram.org/bots/api#forumtopicclosed
 */
export type ForumTopicClosed = object

/**
 * This object represents a service message about an edited forum topic.
 * @see https://core.telegram.org/bots/api#forumtopicedited
 */
export interface ForumTopicEdited {
  /** Optional. New name of the topic, if it was edited */
  name?: String
  /** Optional. New identifier of the custom emoji shown as the topic icon, if it was edited; an empty string if the icon was removed */
  icon_custom_emoji_id?: String
}

/**
 * This object represents a service message about a forum topic reopened in the chat. Currently holds no information.
 * @see https://core.telegram.org/bots/api#forumtopicreopened
 */
export type ForumTopicReopened = object

/**
 * This object represents a service message about General forum topic hidden in the chat. Currently holds no information.
 * @see https://core.telegram.org/bots/api#generalforumtopichidden
 */
export type GeneralForumTopicHidden = object

/**
 * This object represents a service message about General forum topic unhidden in the chat. Currently holds no information.
 * @see https://core.telegram.org/bots/api#generalforumtopicunhidden
 */
export type GeneralForumTopicUnhidden = object

/**
 * This object contains information about a user that was shared with the bot using a KeyboardButtonRequestUsers button.
 * @see https://core.telegram.org/bots/api#shareduser
 */
export interface SharedUser {
  /** Identifier of the shared user. This number may have more than 32 significant bits and some programming languages may have difficulty/silent defects in interpreting it. But it has at most 52 significant bits, so 64-bit integers or double-precision float types are safe for storing these identifiers. The bot may not have access to the user and could be unable to use this identifier, unless the user is already known to the bot by some other means. */
  user_id: Integer
  /** Optional. First name of the user, if the name was requested by the bot */
  first_name?: String
  /** Optional. Last name of the user, if the name was requested by the bot */
  last_name?: String
  /** Optional. Username of the user, if the username was requested by the bot */
  username?: String
  /** Optional. Available sizes of the chat photo, if the photo was requested by the bot */
  photo?: Array<PhotoSize>
}

/**
 * This object contains information about the users whose identifiers were shared with the bot using a KeyboardButtonRequestUsers button.
 * @see https://core.telegram.org/bots/api#usersshared
 */
export interface UsersShared {
  /** Identifier of the request */
  request_id: Integer
  /** Information about users shared with the bot. */
  users: Array<SharedUser>
}

/**
 * This object contains information about a chat that was shared with the bot using a KeyboardButtonRequestChat button.
 * @see https://core.telegram.org/bots/api#chatshared
 */
export interface ChatShared {
  /** Identifier of the request */
  request_id: Integer
  /** Identifier of the shared chat. This number may have more than 32 significant bits and some programming languages may have difficulty/silent defects in interpreting it. But it has at most 52 significant bits, so a 64-bit integer or double-precision float type are safe for storing this identifier. The bot may not have access to the chat and could be unable to use this identifier, unless the chat is already known to the bot by some other means. */
  chat_id: Integer
  /** Optional. Title of the chat, if the title was requested by the bot. */
  title?: String
  /** Optional. Username of the chat, if the username was requested by the bot and available. */
  username?: String
  /** Optional. Available sizes of the chat photo, if the photo was requested by the bot */
  photo?: Array<PhotoSize>
}

/**
 * This object represents a service message about a user allowing a bot to write messages after adding it to the attachment menu, launching a Web App from a link, or accepting an explicit request from a Web App sent by the method requestWriteAccess.
 * @see https://core.telegram.org/bots/api#writeaccessallowed
 */
export interface WriteAccessAllowed {
  /** Optional. True, if the access was granted after the user accepted an explicit request from a Web App sent by the method requestWriteAccess */
  from_request?: Boolean
  /** Optional. Name of the Web App, if the access was granted when the Web App was launched from a link */
  web_app_name?: String
  /** Optional. True, if the access was granted when the bot was added to the attachment or side menu */
  from_attachment_menu?: Boolean
}

/**
 * This object represents a service message about a video chat scheduled in the chat.
 * @see https://core.telegram.org/bots/api#videochatscheduled
 */
export interface VideoChatScheduled {
  /** Point in time (Unix timestamp) when the video chat is supposed to be started by a chat administrator */
  start_date: Integer
}

/**
 * This object represents a service message about a video chat started in the chat. Currently holds no information.
 * @see https://core.telegram.org/bots/api#videochatstarted
 */
export type VideoChatStarted = object

/**
 * This object represents a service message about a video chat ended in the chat.
 * @see https://core.telegram.org/bots/api#videochatended
 */
export interface VideoChatEnded {
  /** Video chat duration in seconds */
  duration: Integer
}

/**
 * This object represents a service message about new members invited to a video chat.
 * @see https://core.telegram.org/bots/api#videochatparticipantsinvited
 */
export interface VideoChatParticipantsInvited {
  /** New members that were invited to the video chat */
  users: Array<User>
}

/**
 * Describes a service message about a change in the price of paid messages within a chat.
 * @see https://core.telegram.org/bots/api#paidmessagepricechanged
 */
export interface PaidMessagePriceChanged {
  /** The new number of Telegram Stars that must be paid by non-administrator users of the supergroup chat for each sent message */
  paid_message_star_count: Integer
}

/**
 * Describes a service message about a change in the price of direct messages sent to a channel chat.
 * @see https://core.telegram.org/bots/api#directmessagepricechanged
 */
export interface DirectMessagePriceChanged {
  /** True, if direct messages are enabled for the channel chat; false otherwise */
  are_direct_messages_enabled: Boolean
  /** Optional. The new number of Telegram Stars that must be paid by users for each direct message sent to the channel. Does not apply to users who have been exempted by administrators. Defaults to 0. */
  direct_message_star_count?: Integer
}

/**
 * Describes a service message about the approval of a suggested post.
 * @see https://core.telegram.org/bots/api#suggestedpostapproved
 */
export interface SuggestedPostApproved {
  /** Optional. Message containing the suggested post. Note that the Message object in this field will not contain the reply_to_message field even if it itself is a reply. */
  suggested_post_message?: Message
  /** Optional. Amount paid for the post */
  price?: SuggestedPostPrice
  /** Date when the post will be published */
  send_date: Integer
}

/**
 * Describes a service message about the failed approval of a suggested post. Currently, only caused by insufficient user funds at the time of approval.
 * @see https://core.telegram.org/bots/api#suggestedpostapprovalfailed
 */
export interface SuggestedPostApprovalFailed {
  /** Optional. Message containing the suggested post whose approval has failed. Note that the Message object in this field will not contain the reply_to_message field even if it itself is a reply. */
  suggested_post_message?: Message
  /** Expected price of the post */
  price: SuggestedPostPrice
}

/**
 * Describes a service message about the rejection of a suggested post.
 * @see https://core.telegram.org/bots/api#suggestedpostdeclined
 */
export interface SuggestedPostDeclined {
  /** Optional. Message containing the suggested post. Note that the Message object in this field will not contain the reply_to_message field even if it itself is a reply. */
  suggested_post_message?: Message
  /** Optional. Comment with which the post was declined */
  comment?: String
}

/**
 * Describes a service message about a successful payment for a suggested post.
 * @see https://core.telegram.org/bots/api#suggestedpostpaid
 */
export interface SuggestedPostPaid {
  /** Optional. Message containing the suggested post. Note that the Message object in this field will not contain the reply_to_message field even if it itself is a reply. */
  suggested_post_message?: Message
  /** Currency in which the payment was made. Currently, one of "XTR" for Telegram Stars or "TON" for toncoins */
  currency: String
  /** Optional. The amount of the currency that was received by the channel in nanotoncoins; for payments in toncoins only */
  amount?: Integer
  /** Optional. The amount of Telegram Stars that was received by the channel; for payments in Telegram Stars only */
  star_amount?: StarAmount
}

/**
 * Describes a service message about a payment refund for a suggested post.
 * @see https://core.telegram.org/bots/api#suggestedpostrefunded
 */
export interface SuggestedPostRefunded {
  /** Optional. Message containing the suggested post. Note that the Message object in this field will not contain the reply_to_message field even if it itself is a reply. */
  suggested_post_message?: Message
  /** Reason for the refund. Currently, one of "post_deleted" if the post was deleted within 24 hours of being posted or removed from scheduled messages without being posted, or "payment_refunded" if the payer refunded their payment. */
  reason: String
}

/**
 * This object represents a service message about the creation of a scheduled giveaway.
 * @see https://core.telegram.org/bots/api#giveawaycreated
 */
export interface GiveawayCreated {
  /** Optional. The number of Telegram Stars to be split between giveaway winners; for Telegram Star giveaways only */
  prize_star_count?: Integer
}

/**
 * This object represents a message about a scheduled giveaway.
 * @see https://core.telegram.org/bots/api#giveaway
 */
export interface Giveaway {
  /** The list of chats which the user must join to participate in the giveaway */
  chats: Array<Chat>
  /** Point in time (Unix timestamp) when winners of the giveaway will be selected */
  winners_selection_date: Integer
  /** The number of users which are supposed to be selected as winners of the giveaway */
  winner_count: Integer
  /** Optional. True, if only users who join the chats after the giveaway started should be eligible to win */
  only_new_members?: True
  /** Optional. True, if the list of giveaway winners will be visible to everyone */
  has_public_winners?: True
  /** Optional. Description of additional giveaway prize */
  prize_description?: String
  /** Optional. A list of two-letter ISO 3166-1 alpha-2 country codes indicating the countries from which eligible users for the giveaway must come. If empty, then all users can participate in the giveaway. Users with a phone number that was bought on Fragment can always participate in giveaways. */
  country_codes?: Array<String>
  /** Optional. The number of Telegram Stars to be split between giveaway winners; for Telegram Star giveaways only */
  prize_star_count?: Integer
  /** Optional. The number of months the Telegram Premium subscription won from the giveaway will be active for; for Telegram Premium giveaways only */
  premium_subscription_month_count?: Integer
}

/**
 * This object represents a message about the completion of a giveaway with public winners.
 * @see https://core.telegram.org/bots/api#giveawaywinners
 */
export interface GiveawayWinners {
  /** The chat that created the giveaway */
  chat: Chat
  /** Identifier of the message with the giveaway in the chat */
  giveaway_message_id: Integer
  /** Point in time (Unix timestamp) when winners of the giveaway were selected */
  winners_selection_date: Integer
  /** Total number of winners in the giveaway */
  winner_count: Integer
  /** List of up to 100 winners of the giveaway */
  winners: Array<User>
  /** Optional. The number of other chats the user had to join in order to be eligible for the giveaway */
  additional_chat_count?: Integer
  /** Optional. The number of Telegram Stars that were split between giveaway winners; for Telegram Star giveaways only */
  prize_star_count?: Integer
  /** Optional. The number of months the Telegram Premium subscription won from the giveaway will be active for; for Telegram Premium giveaways only */
  premium_subscription_month_count?: Integer
  /** Optional. Number of undistributed prizes */
  unclaimed_prize_count?: Integer
  /** Optional. True, if only users who had joined the chats after the giveaway started were eligible to win */
  only_new_members?: True
  /** Optional. True, if the giveaway was canceled because the payment for it was refunded */
  was_refunded?: True
  /** Optional. Description of additional giveaway prize */
  prize_description?: String
}

/**
 * This object represents a service message about the completion of a giveaway without public winners.
 * @see https://core.telegram.org/bots/api#giveawaycompleted
 */
export interface GiveawayCompleted {
  /** Number of winners in the giveaway */
  winner_count: Integer
  /** Optional. Number of undistributed prizes */
  unclaimed_prize_count?: Integer
  /** Optional. Message with the giveaway that was completed, if it wasn't deleted */
  giveaway_message?: Message
  /** Optional. True, if the giveaway is a Telegram Star giveaway. Otherwise, currently, the giveaway is a Telegram Premium giveaway. */
  is_star_giveaway?: True
}

/**
 * Describes the options used for link preview generation.
 * @see https://core.telegram.org/bots/api#linkpreviewoptions
 */
export interface LinkPreviewOptions {
  /** Optional. True, if the link preview is disabled */
  is_disabled?: Boolean
  /** Optional. URL to use for the link preview. If empty, then the first URL found in the message text will be used */
  url?: String
  /** Optional. True, if the media in the link preview is supposed to be shrunk; ignored if the URL isn't explicitly specified or media size change isn't supported for the preview */
  prefer_small_media?: Boolean
  /** Optional. True, if the media in the link preview is supposed to be enlarged; ignored if the URL isn't explicitly specified or media size change isn't supported for the preview */
  prefer_large_media?: Boolean
  /** Optional. True, if the link preview must be shown above the message text; otherwise, the link preview will be shown below the message text */
  show_above_text?: Boolean
}

/**
 * Describes the price of a suggested post.
 * @see https://core.telegram.org/bots/api#suggestedpostprice
 */
export interface SuggestedPostPrice {
  /** Currency in which the post will be paid. Currently, must be one of "XTR" for Telegram Stars or "TON" for toncoins */
  currency: String
  /** The amount of the currency that will be paid for the post in the smallest units of the currency, i.e. Telegram Stars or nanotoncoins. Currently, price in Telegram Stars must be between 5 and 100000, and price in nanotoncoins must be between 10000000 and 10000000000000. */
  amount: Integer
}

/**
 * Contains information about a suggested post.
 * @see https://core.telegram.org/bots/api#suggestedpostinfo
 */
export interface SuggestedPostInfo {
  /** State of the suggested post. Currently, it can be one of "pending", "approved", "declined". */
  state: String
  /** Optional. Proposed price of the post. If the field is omitted, then the post is unpaid. */
  price?: SuggestedPostPrice
  /** Optional. Proposed send date of the post. If the field is omitted, then the post can be published at any time within 30 days at the sole discretion of the user or administrator who approves it. */
  send_date?: Integer
}

/**
 * Contains parameters of a post that is being suggested by the bot.
 * @see https://core.telegram.org/bots/api#suggestedpostparameters
 */
export interface SuggestedPostParameters {
  /** Optional. Proposed price for the post. If the field is omitted, then the post is unpaid. */
  price?: SuggestedPostPrice
  /** Optional. Proposed send date of the post. If specified, then the date must be between 300 second and 2678400 seconds (30 days) in the future. If the field is omitted, then the post can be published at any time within 30 days at the sole discretion of the user who approves it. */
  send_date?: Integer
}

/**
 * Describes a topic of a direct messages chat.
 * @see https://core.telegram.org/bots/api#directmessagestopic
 */
export interface DirectMessagesTopic {
  /** Unique identifier of the topic. This number may have more than 32 significant bits and some programming languages may have difficulty/silent defects in interpreting it. But it has at most 52 significant bits, so a 64-bit integer or double-precision float type are safe for storing this identifier. */
  topic_id: Integer
  /** Optional. Information about the user that created the topic. Currently, it is always present */
  user?: User
}

/**
 * This object represent a user's profile pictures.
 * @see https://core.telegram.org/bots/api#userprofilephotos
 */
export interface UserProfilePhotos {
  /** Total number of profile pictures the target user has */
  total_count: Integer
  /** Requested profile pictures (in up to 4 sizes each) */
  photos: Array<Array<PhotoSize>>
}

/**
 * This object represents a file ready to be downloaded. The file can be downloaded via the link https://api.telegram.org/file/bot<token>/<file_path>. It is guaranteed that the link will be valid for at least 1 hour. When the link expires, a new one can be requested by calling getFile. The maximum file size to download is 20 MB.
 * @see https://core.telegram.org/bots/api#file
 */
export interface File {
  /** Identifier for this file, which can be used to download or reuse the file */
  file_id: String
  /** Unique identifier for this file, which is supposed to be the same over time and for different bots. Can't be used to download or reuse the file. */
  file_unique_id: String
  /** Optional. File size in bytes. It can be bigger than 2^31 and some programming languages may have difficulty/silent defects in interpreting it. But it has at most 52 significant bits, so a signed 64-bit integer or double-precision float type are safe for storing this value. */
  file_size?: Integer
  /** Optional. File path. Use https://api.telegram.org/file/bot<token>/<file_path> to get the file. */
  file_path?: String
}

/**
 * Describes a Web App.
 * @see https://core.telegram.org/bots/api#webappinfo
 */
export interface WebAppInfo {
  /** An HTTPS URL of a Web App to be opened with additional data as specified in Initializing Web Apps */
  url: String
}

/**
 * This object represents a custom keyboard with reply options (see Introduction to bots for details and examples). Not supported in channels and for messages sent on behalf of a Telegram Business account.
 * @see https://core.telegram.org/bots/api#replykeyboardmarkup
 */
export interface ReplyKeyboardMarkup {
  /** Array of button rows, each represented by an Array of KeyboardButton objects */
  keyboard: Array<Array<KeyboardButton>>
  /** Optional. Requests clients to always show the keyboard when the regular keyboard is hidden. Defaults to false, in which case the custom keyboard can be hidden and opened with a keyboard icon. */
  is_persistent?: Boolean
  /** Optional. Requests clients to resize the keyboard vertically for optimal fit (e.g., make the keyboard smaller if there are just two rows of buttons). Defaults to false, in which case the custom keyboard is always of the same height as the app's standard keyboard. */
  resize_keyboard?: Boolean
  /** Optional. Requests clients to hide the keyboard as soon as it's been used. The keyboard will still be available, but clients will automatically display the usual letter-keyboard in the chat - the user can press a special button in the input field to see the custom keyboard again. Defaults to false. */
  one_time_keyboard?: Boolean
  /** Optional. The placeholder to be shown in the input field when the keyboard is active; 1-64 characters */
  input_field_placeholder?: String
  /** Optional. Use this parameter if you want to show the keyboard to specific users only. Targets: 1) users that are @mentioned in the text of the Message object; 2) if the bot's message is a reply to a message in the same chat and forum topic, sender of the original message.  Example: A user requests to change the bot's language, bot replies to the request with a keyboard to select the new language. Other users in the group don't see the keyboard. */
  selective?: Boolean
}

/**
 * This object represents one button of the reply keyboard. At most one of the optional fields must be used to specify type of the button. For simple text buttons, String can be used instead of this object to specify the button text.
 * @see https://core.telegram.org/bots/api#keyboardbutton
 */
export interface KeyboardButton {
  /** Text of the button. If none of the optional fields are used, it will be sent as a message when the button is pressed */
  text: String
  /** Optional. If specified, pressing the button will open a list of suitable users. Identifiers of selected users will be sent to the bot in a "users_shared" service message. Available in private chats only. */
  request_users?: KeyboardButtonRequestUsers
  /** Optional. If specified, pressing the button will open a list of suitable chats. Tapping on a chat will send its identifier to the bot in a "chat_shared" service message. Available in private chats only. */
  request_chat?: KeyboardButtonRequestChat
  /** Optional. If True, the user's phone number will be sent as a contact when the button is pressed. Available in private chats only. */
  request_contact?: Boolean
  /** Optional. If True, the user's current location will be sent when the button is pressed. Available in private chats only. */
  request_location?: Boolean
  /** Optional. If specified, the user will be asked to create a poll and send it to the bot when the button is pressed. Available in private chats only. */
  request_poll?: KeyboardButtonPollType
  /** Optional. If specified, the described Web App will be launched when the button is pressed. The Web App will be able to send a "web_app_data" service message. Available in private chats only. */
  web_app?: WebAppInfo
}

/**
 * This object defines the criteria used to request suitable users. Information about the selected users will be shared with the bot when the corresponding button is pressed. More about requesting users »
 * @see https://core.telegram.org/bots/api#keyboardbuttonrequestusers
 */
export interface KeyboardButtonRequestUsers {
  /** Signed 32-bit identifier of the request that will be received back in the UsersShared object. Must be unique within the message */
  request_id: Integer
  /** Optional. Pass True to request bots, pass False to request regular users. If not specified, no additional restrictions are applied. */
  user_is_bot?: Boolean
  /** Optional. Pass True to request premium users, pass False to request non-premium users. If not specified, no additional restrictions are applied. */
  user_is_premium?: Boolean
  /** Optional. The maximum number of users to be selected; 1-10. Defaults to 1. */
  max_quantity?: Integer
  /** Optional. Pass True to request the users' first and last names */
  request_name?: Boolean
  /** Optional. Pass True to request the users' usernames */
  request_username?: Boolean
  /** Optional. Pass True to request the users' photos */
  request_photo?: Boolean
}

/**
 * This object defines the criteria used to request a suitable chat. Information about the selected chat will be shared with the bot when the corresponding button is pressed. The bot will be granted requested rights in the chat if appropriate. More about requesting chats ».
 * @see https://core.telegram.org/bots/api#keyboardbuttonrequestchat
 */
export interface KeyboardButtonRequestChat {
  /** Signed 32-bit identifier of the request, which will be received back in the ChatShared object. Must be unique within the message */
  request_id: Integer
  /** Pass True to request a channel chat, pass False to request a group or a supergroup chat. */
  chat_is_channel: Boolean
  /** Optional. Pass True to request a forum supergroup, pass False to request a non-forum chat. If not specified, no additional restrictions are applied. */
  chat_is_forum?: Boolean
  /** Optional. Pass True to request a supergroup or a channel with a username, pass False to request a chat without a username. If not specified, no additional restrictions are applied. */
  chat_has_username?: Boolean
  /** Optional. Pass True to request a chat owned by the user. Otherwise, no additional restrictions are applied. */
  chat_is_created?: Boolean
  /** Optional. A JSON-serialized object listing the required administrator rights of the user in the chat. The rights must be a superset of bot_administrator_rights. If not specified, no additional restrictions are applied. */
  user_administrator_rights?: ChatAdministratorRights
  /** Optional. A JSON-serialized object listing the required administrator rights of the bot in the chat. The rights must be a subset of user_administrator_rights. If not specified, no additional restrictions are applied. */
  bot_administrator_rights?: ChatAdministratorRights
  /** Optional. Pass True to request a chat with the bot as a member. Otherwise, no additional restrictions are applied. */
  bot_is_member?: Boolean
  /** Optional. Pass True to request the chat's title */
  request_title?: Boolean
  /** Optional. Pass True to request the chat's username */
  request_username?: Boolean
  /** Optional. Pass True to request the chat's photo */
  request_photo?: Boolean
}

/**
 * This object represents type of a poll, which is allowed to be created and sent when the corresponding button is pressed.
 * @see https://core.telegram.org/bots/api#keyboardbuttonpolltype
 */
export interface KeyboardButtonPollType {
  /** Optional. If quiz is passed, the user will be allowed to create only polls in the quiz mode. If regular is passed, only regular polls will be allowed. Otherwise, the user will be allowed to create a poll of any type. */
  type?: String
}

/**
 * Upon receiving a message with this object, Telegram clients will remove the current custom keyboard and display the default letter-keyboard. By default, custom keyboards are displayed until a new keyboard is sent by a bot. An exception is made for one-time keyboards that are hidden immediately after the user presses a button (see ReplyKeyboardMarkup). Not supported in channels and for messages sent on behalf of a Telegram Business account.
 * @see https://core.telegram.org/bots/api#replykeyboardremove
 */
export interface ReplyKeyboardRemove {
  /** Requests clients to remove the custom keyboard (user will not be able to summon this keyboard; if you want to hide the keyboard from sight but keep it accessible, use one_time_keyboard in ReplyKeyboardMarkup) */
  remove_keyboard: True
  /** Optional. Use this parameter if you want to remove the keyboard for specific users only. Targets: 1) users that are @mentioned in the text of the Message object; 2) if the bot's message is a reply to a message in the same chat and forum topic, sender of the original message.  Example: A user votes in a poll, bot returns confirmation message in reply to the vote and removes the keyboard for that user, while still showing the keyboard with poll options to users who haven't voted yet. */
  selective?: Boolean
}

/**
 * This object represents an inline keyboard that appears right next to the message it belongs to.
 * @see https://core.telegram.org/bots/api#inlinekeyboardmarkup
 */
export interface InlineKeyboardMarkup {
  /** Array of button rows, each represented by an Array of InlineKeyboardButton objects */
  inline_keyboard: Array<Array<InlineKeyboardButton>>
}

/**
 * This object represents one button of an inline keyboard. Exactly one of the optional fields must be used to specify type of the button.
 * @see https://core.telegram.org/bots/api#inlinekeyboardbutton
 */
export interface InlineKeyboardButton {
  /** Label text on the button */
  text: String
  /** Optional. HTTP or tg:// URL to be opened when the button is pressed. Links tg://user?id=<user_id> can be used to mention a user by their identifier without using a username, if this is allowed by their privacy settings. */
  url?: String
  /** Optional. Data to be sent in a callback query to the bot when the button is pressed, 1-64 bytes */
  callback_data?: String
  /** Optional. Description of the answerWebAppQuery. Available only in private chats between a user and the bot. Not supported for messages sent on behalf of a Telegram Business account. */
  web_app?: WebAppInfo
  /** Optional. An HTTPS URL used to automatically authorize the user. Can be used as a replacement for the Telegram Login Widget. */
  login_url?: LoginUrl
  /** Optional. If set, pressing the button will prompt the user to select one of their chats, open that chat and insert the bot's username and the specified inline query in the input field. May be empty, in which case just the bot's username will be inserted. Not supported for messages sent in channel direct messages chats and on behalf of a Telegram Business account. */
  switch_inline_query?: String
  /** Optional. If set, pressing the button will insert the bot's username and the specified inline query in the current chat's input field. May be empty, in which case only the bot's username will be inserted.  This offers a quick way for the user to open your bot in inline mode in the same chat - good for selecting something from multiple options. Not supported in channels and for messages sent in channel direct messages chats and on behalf of a Telegram Business account. */
  switch_inline_query_current_chat?: String
  /** Optional. If set, pressing the button will prompt the user to select one of their chats of the specified type, open that chat and insert the bot's username and the specified inline query in the input field. Not supported for messages sent in channel direct messages chats and on behalf of a Telegram Business account. */
  switch_inline_query_chosen_chat?: SwitchInlineQueryChosenChat
  /** Optional. Description of the button that copies the specified text to the clipboard. */
  copy_text?: CopyTextButton
  /** Optional. Description of the game that will be launched when the user presses the button.  NOTE: This type of button must always be the first button in the first row. */
  callback_game?: CallbackGame
  /** Optional. Specify True, to send a Pay button. Substrings "⭐" and "XTR" in the buttons's text will be replaced with a Telegram Star icon.  NOTE: This type of button must always be the first button in the first row and can only be used in invoice messages. */
  pay?: Boolean
}

/**
 * This object represents a parameter of the inline keyboard button used to automatically authorize a user. Serves as a great replacement for the Telegram Login Widget when the user is coming from Telegram. All the user needs to do is tap/click a button and confirm that they want to log in. Telegram apps support these buttons as of version 5.7. Sample bot: @discussbot
 * @see https://core.telegram.org/bots/api#loginurl
 */
export interface LoginUrl {
  /** An HTTPS URL to be opened with user authorization data added to the query string when the button is pressed. If the user refuses to provide authorization data, the original URL without information about the user will be opened. The data added is the same as described in Checking authorization. */
  url: String
  /** Optional. New text of the button in forwarded messages. */
  forward_text?: String
  /** Optional. Username of a bot, which will be used for user authorization. See Linking your domain to the bot for more details. */
  bot_username?: String
  /** Optional. Pass True to request the permission for your bot to send messages to the user. */
  request_write_access?: Boolean
}

/**
 * This object represents an inline button that switches the current user to inline mode in a chosen chat, with an optional default inline query.
 * @see https://core.telegram.org/bots/api#switchinlinequerychosenchat
 */
export interface SwitchInlineQueryChosenChat {
  /** Optional. The default inline query to be inserted in the input field. If left empty, only the bot's username will be inserted */
  query?: String
  /** Optional. True, if private chats with users can be chosen */
  allow_user_chats?: Boolean
  /** Optional. True, if private chats with bots can be chosen */
  allow_bot_chats?: Boolean
  /** Optional. True, if group and supergroup chats can be chosen */
  allow_group_chats?: Boolean
  /** Optional. True, if channel chats can be chosen */
  allow_channel_chats?: Boolean
}

/**
 * This object represents an inline keyboard button that copies specified text to the clipboard.
 * @see https://core.telegram.org/bots/api#copytextbutton
 */
export interface CopyTextButton {
  /** The text to be copied to the clipboard; 1-256 characters */
  text: String
}

/**
 * This object represents an incoming callback query from a callback button in an inline mode), the field inline_message_id will be present. Exactly one of the fields data or game_short_name will be present.
 * @see https://core.telegram.org/bots/api#callbackquery
 */
export interface CallbackQuery {
  /** Unique identifier for this query */
  id: String
  /** Sender */
  from: User
  /** Optional. Message sent by the bot with the callback button that originated the query */
  message?: MaybeInaccessibleMessage
  /** Optional. Identifier of the message sent via the bot in inline mode, that originated the query. */
  inline_message_id?: String
  /** Global identifier, uniquely corresponding to the chat to which the message with the callback button was sent. Useful for high scores in games. */
  chat_instance: String
  /** Optional. Data associated with the callback button. Be aware that the message originated the query can contain no callback buttons with this data. */
  data?: String
  /** Optional. Short name of a Game to be returned, serves as the unique identifier for the game */
  game_short_name?: String
}

/**
 * Upon receiving a message with this object, Telegram clients will display a reply interface to the user (act as if the user has selected the bot's message and tapped 'Reply'). This can be extremely useful if you want to create user-friendly step-by-step interfaces without having to sacrifice privacy mode. Not supported in channels and for messages sent on behalf of a Telegram Business account.
 * @see https://core.telegram.org/bots/api#forcereply
 */
export interface ForceReply {
  /** Shows reply interface to the user, as if they manually selected the bot's message and tapped 'Reply' */
  force_reply: True
  /** Optional. The placeholder to be shown in the input field when the reply is active; 1-64 characters */
  input_field_placeholder?: String
  /** Optional. Use this parameter if you want to force reply from specific users only. Targets: 1) users that are @mentioned in the text of the Message object; 2) if the bot's message is a reply to a message in the same chat and forum topic, sender of the original message. */
  selective?: Boolean
}

/**
 * This object represents a chat photo.
 * @see https://core.telegram.org/bots/api#chatphoto
 */
export interface ChatPhoto {
  /** File identifier of small (160x160) chat photo. This file_id can be used only for photo download and only for as long as the photo is not changed. */
  small_file_id: String
  /** Unique file identifier of small (160x160) chat photo, which is supposed to be the same over time and for different bots. Can't be used to download or reuse the file. */
  small_file_unique_id: String
  /** File identifier of big (640x640) chat photo. This file_id can be used only for photo download and only for as long as the photo is not changed. */
  big_file_id: String
  /** Unique file identifier of big (640x640) chat photo, which is supposed to be the same over time and for different bots. Can't be used to download or reuse the file. */
  big_file_unique_id: String
}

/**
 * Represents an invite link for a chat.
 * @see https://core.telegram.org/bots/api#chatinvitelink
 */
export interface ChatInviteLink {
  /** The invite link. If the link was created by another chat administrator, then the second part of the link will be replaced with "…". */
  invite_link: String
  /** Creator of the link */
  creator: User
  /** True, if users joining the chat via the link need to be approved by chat administrators */
  creates_join_request: Boolean
  /** True, if the link is primary */
  is_primary: Boolean
  /** True, if the link is revoked */
  is_revoked: Boolean
  /** Optional. Invite link name */
  name?: String
  /** Optional. Point in time (Unix timestamp) when the link will expire or has been expired */
  expire_date?: Integer
  /** Optional. The maximum number of users that can be members of the chat simultaneously after joining the chat via this invite link; 1-99999 */
  member_limit?: Integer
  /** Optional. Number of pending join requests created using this link */
  pending_join_request_count?: Integer
  /** Optional. The number of seconds the subscription will be active for before the next payment */
  subscription_period?: Integer
  /** Optional. The amount of Telegram Stars a user must pay initially and after each subsequent subscription period to be a member of the chat using the link */
  subscription_price?: Integer
}

/**
 * Represents the rights of an administrator in a chat.
 * @see https://core.telegram.org/bots/api#chatadministratorrights
 */
export interface ChatAdministratorRights {
  /** True, if the user's presence in the chat is hidden */
  is_anonymous: Boolean
  /** True, if the administrator can access the chat event log, get boost list, see hidden supergroup and channel members, report spam messages, ignore slow mode, and send messages to the chat without paying Telegram Stars. Implied by any other administrator privilege. */
  can_manage_chat: Boolean
  /** True, if the administrator can delete messages of other users */
  can_delete_messages: Boolean
  /** True, if the administrator can manage video chats */
  can_manage_video_chats: Boolean
  /** True, if the administrator can restrict, ban or unban chat members, or access supergroup statistics */
  can_restrict_members: Boolean
  /** True, if the administrator can add new administrators with a subset of their own privileges or demote administrators that they have promoted, directly or indirectly (promoted by administrators that were appointed by the user) */
  can_promote_members: Boolean
  /** True, if the user is allowed to change the chat title, photo and other settings */
  can_change_info: Boolean
  /** True, if the user is allowed to invite new users to the chat */
  can_invite_users: Boolean
  /** True, if the administrator can post stories to the chat */
  can_post_stories: Boolean
  /** True, if the administrator can edit stories posted by other users, post stories to the chat page, pin chat stories, and access the chat's story archive */
  can_edit_stories: Boolean
  /** True, if the administrator can delete stories posted by other users */
  can_delete_stories: Boolean
  /** Optional. True, if the administrator can post messages in the channel, approve suggested posts, or access channel statistics; for channels only */
  can_post_messages?: Boolean
  /** Optional. True, if the administrator can edit messages of other users and can pin messages; for channels only */
  can_edit_messages?: Boolean
  /** Optional. True, if the user is allowed to pin messages; for groups and supergroups only */
  can_pin_messages?: Boolean
  /** Optional. True, if the user is allowed to create, rename, close, and reopen forum topics; for supergroups only */
  can_manage_topics?: Boolean
  /** Optional. True, if the administrator can manage direct messages of the channel and decline suggested posts; for channels only */
  can_manage_direct_messages?: Boolean
}

/**
 * This object represents changes in the status of a chat member.
 * @see https://core.telegram.org/bots/api#chatmemberupdated
 */
export interface ChatMemberUpdated {
  /** Chat the user belongs to */
  chat: Chat
  /** Performer of the action, which resulted in the change */
  from: User
  /** Date the change was done in Unix time */
  date: Integer
  /** Previous information about the chat member */
  old_chat_member: ChatMember
  /** New information about the chat member */
  new_chat_member: ChatMember
  /** Optional. Chat invite link, which was used by the user to join the chat; for joining by invite link events only. */
  invite_link?: ChatInviteLink
  /** Optional. True, if the user joined the chat after sending a direct join request without using an invite link and being approved by an administrator */
  via_join_request?: Boolean
  /** Optional. True, if the user joined the chat via a chat folder invite link */
  via_chat_folder_invite_link?: Boolean
}

/**
 * This object contains information about one member of a chat. Currently, the following 6 types of chat members are supported: ChatMemberOwner, ChatMemberAdministrator, ChatMemberMember, ChatMemberRestricted, ChatMemberLeft, ChatMemberBanned
 * @see https://core.telegram.org/bots/api#chatmember
 */
export type ChatMember =
  | ChatMemberOwner
  | ChatMemberAdministrator
  | ChatMemberMember
  | ChatMemberRestricted
  | ChatMemberLeft
  | ChatMemberBanned

/**
 * Represents a chat member that owns the chat and has all administrator privileges.
 * @see https://core.telegram.org/bots/api#chatmemberowner
 */
export interface ChatMemberOwner {
  /** The member's status in the chat, always "creator" */
  status: "creator"
  /** Information about the user */
  user: User
  /** True, if the user's presence in the chat is hidden */
  is_anonymous: Boolean
  /** Optional. Custom title for this user */
  custom_title?: String
}

/**
 * Represents a chat member that has some additional privileges.
 * @see https://core.telegram.org/bots/api#chatmemberadministrator
 */
export interface ChatMemberAdministrator {
  /** The member's status in the chat, always "administrator" */
  status: "administrator"
  /** Information about the user */
  user: User
  /** True, if the bot is allowed to edit administrator privileges of that user */
  can_be_edited: Boolean
  /** True, if the user's presence in the chat is hidden */
  is_anonymous: Boolean
  /** True, if the administrator can access the chat event log, get boost list, see hidden supergroup and channel members, report spam messages, ignore slow mode, and send messages to the chat without paying Telegram Stars. Implied by any other administrator privilege. */
  can_manage_chat: Boolean
  /** True, if the administrator can delete messages of other users */
  can_delete_messages: Boolean
  /** True, if the administrator can manage video chats */
  can_manage_video_chats: Boolean
  /** True, if the administrator can restrict, ban or unban chat members, or access supergroup statistics */
  can_restrict_members: Boolean
  /** True, if the administrator can add new administrators with a subset of their own privileges or demote administrators that they have promoted, directly or indirectly (promoted by administrators that were appointed by the user) */
  can_promote_members: Boolean
  /** True, if the user is allowed to change the chat title, photo and other settings */
  can_change_info: Boolean
  /** True, if the user is allowed to invite new users to the chat */
  can_invite_users: Boolean
  /** True, if the administrator can post stories to the chat */
  can_post_stories: Boolean
  /** True, if the administrator can edit stories posted by other users, post stories to the chat page, pin chat stories, and access the chat's story archive */
  can_edit_stories: Boolean
  /** True, if the administrator can delete stories posted by other users */
  can_delete_stories: Boolean
  /** Optional. True, if the administrator can post messages in the channel, approve suggested posts, or access channel statistics; for channels only */
  can_post_messages?: Boolean
  /** Optional. True, if the administrator can edit messages of other users and can pin messages; for channels only */
  can_edit_messages?: Boolean
  /** Optional. True, if the user is allowed to pin messages; for groups and supergroups only */
  can_pin_messages?: Boolean
  /** Optional. True, if the user is allowed to create, rename, close, and reopen forum topics; for supergroups only */
  can_manage_topics?: Boolean
  /** Optional. True, if the administrator can manage direct messages of the channel and decline suggested posts; for channels only */
  can_manage_direct_messages?: Boolean
  /** Optional. Custom title for this user */
  custom_title?: String
}

/**
 * Represents a chat member that has no additional privileges or restrictions.
 * @see https://core.telegram.org/bots/api#chatmembermember
 */
export interface ChatMemberMember {
  /** The member's status in the chat, always "member" */
  status: "member"
  /** Information about the user */
  user: User
  /** Optional. Date when the user's subscription will expire; Unix time */
  until_date?: Integer
}

/**
 * Represents a chat member that is under certain restrictions in the chat. Supergroups only.
 * @see https://core.telegram.org/bots/api#chatmemberrestricted
 */
export interface ChatMemberRestricted {
  /** The member's status in the chat, always "restricted" */
  status: "restricted"
  /** Information about the user */
  user: User
  /** True, if the user is a member of the chat at the moment of the request */
  is_member: Boolean
  /** True, if the user is allowed to send text messages, contacts, giveaways, giveaway winners, invoices, locations and venues */
  can_send_messages: Boolean
  /** True, if the user is allowed to send audios */
  can_send_audios: Boolean
  /** True, if the user is allowed to send documents */
  can_send_documents: Boolean
  /** True, if the user is allowed to send photos */
  can_send_photos: Boolean
  /** True, if the user is allowed to send videos */
  can_send_videos: Boolean
  /** True, if the user is allowed to send video notes */
  can_send_video_notes: Boolean
  /** True, if the user is allowed to send voice notes */
  can_send_voice_notes: Boolean
  /** True, if the user is allowed to send polls and checklists */
  can_send_polls: Boolean
  /** True, if the user is allowed to send animations, games, stickers and use inline bots */
  can_send_other_messages: Boolean
  /** True, if the user is allowed to add web page previews to their messages */
  can_add_web_page_previews: Boolean
  /** True, if the user is allowed to change the chat title, photo and other settings */
  can_change_info: Boolean
  /** True, if the user is allowed to invite new users to the chat */
  can_invite_users: Boolean
  /** True, if the user is allowed to pin messages */
  can_pin_messages: Boolean
  /** True, if the user is allowed to create forum topics */
  can_manage_topics: Boolean
  /** Date when restrictions will be lifted for this user; Unix time. If 0, then the user is restricted forever */
  until_date: Integer
}

/**
 * Represents a chat member that isn't currently a member of the chat, but may join it themselves.
 * @see https://core.telegram.org/bots/api#chatmemberleft
 */
export interface ChatMemberLeft {
  /** The member's status in the chat, always "left" */
  status: "left"
  /** Information about the user */
  user: User
}

/**
 * Represents a chat member that was banned in the chat and can't return to the chat or view chat messages.
 * @see https://core.telegram.org/bots/api#chatmemberbanned
 */
export interface ChatMemberBanned {
  /** The member's status in the chat, always "kicked" */
  status: "kicked"
  /** Information about the user */
  user: User
  /** Date when restrictions will be lifted for this user; Unix time. If 0, then the user is banned forever */
  until_date: Integer
}

/**
 * Represents a join request sent to a chat.
 * @see https://core.telegram.org/bots/api#chatjoinrequest
 */
export interface ChatJoinRequest {
  /** Chat to which the request was sent */
  chat: Chat
  /** User that sent the join request */
  from: User
  /** Identifier of a private chat with the user who sent the join request. This number may have more than 32 significant bits and some programming languages may have difficulty/silent defects in interpreting it. But it has at most 52 significant bits, so a 64-bit integer or double-precision float type are safe for storing this identifier. The bot can use this identifier for 5 minutes to send messages until the join request is processed, assuming no other administrator contacted the user. */
  user_chat_id: Integer
  /** Date the request was sent in Unix time */
  date: Integer
  /** Optional. Bio of the user. */
  bio?: String
  /** Optional. Chat invite link that was used by the user to send the join request */
  invite_link?: ChatInviteLink
}

/**
 * Describes actions that a non-administrator user is allowed to take in a chat.
 * @see https://core.telegram.org/bots/api#chatpermissions
 */
export interface ChatPermissions {
  /** Optional. True, if the user is allowed to send text messages, contacts, giveaways, giveaway winners, invoices, locations and venues */
  can_send_messages?: Boolean
  /** Optional. True, if the user is allowed to send audios */
  can_send_audios?: Boolean
  /** Optional. True, if the user is allowed to send documents */
  can_send_documents?: Boolean
  /** Optional. True, if the user is allowed to send photos */
  can_send_photos?: Boolean
  /** Optional. True, if the user is allowed to send videos */
  can_send_videos?: Boolean
  /** Optional. True, if the user is allowed to send video notes */
  can_send_video_notes?: Boolean
  /** Optional. True, if the user is allowed to send voice notes */
  can_send_voice_notes?: Boolean
  /** Optional. True, if the user is allowed to send polls and checklists */
  can_send_polls?: Boolean
  /** Optional. True, if the user is allowed to send animations, games, stickers and use inline bots */
  can_send_other_messages?: Boolean
  /** Optional. True, if the user is allowed to add web page previews to their messages */
  can_add_web_page_previews?: Boolean
  /** Optional. True, if the user is allowed to change the chat title, photo and other settings. Ignored in public supergroups */
  can_change_info?: Boolean
  /** Optional. True, if the user is allowed to invite new users to the chat */
  can_invite_users?: Boolean
  /** Optional. True, if the user is allowed to pin messages. Ignored in public supergroups */
  can_pin_messages?: Boolean
  /** Optional. True, if the user is allowed to create forum topics. If omitted defaults to the value of can_pin_messages */
  can_manage_topics?: Boolean
}

/**
 * Describes the birthdate of a user.
 * @see https://core.telegram.org/bots/api#birthdate
 */
export interface Birthdate {
  /** Day of the user's birth; 1-31 */
  day: Integer
  /** Month of the user's birth; 1-12 */
  month: Integer
  /** Optional. Year of the user's birth */
  year?: Integer
}

/**
 * Contains information about the start page settings of a Telegram Business account.
 * @see https://core.telegram.org/bots/api#businessintro
 */
export interface BusinessIntro {
  /** Optional. Title text of the business intro */
  title?: String
  /** Optional. Message text of the business intro */
  message?: String
  /** Optional. Sticker of the business intro */
  sticker?: Sticker
}

/**
 * Contains information about the location of a Telegram Business account.
 * @see https://core.telegram.org/bots/api#businesslocation
 */
export interface BusinessLocation {
  /** Address of the business */
  address: String
  /** Optional. Location of the business */
  location?: Location
}

/**
 * Describes an interval of time during which a business is open.
 * @see https://core.telegram.org/bots/api#businessopeninghoursinterval
 */
export interface BusinessOpeningHoursInterval {
  /** The minute's sequence number in a week, starting on Monday, marking the start of the time interval during which the business is open; 0 - 7 * 24 * 60 */
  opening_minute: Integer
  /** The minute's sequence number in a week, starting on Monday, marking the end of the time interval during which the business is open; 0 - 8 * 24 * 60 */
  closing_minute: Integer
}

/**
 * Describes the opening hours of a business.
 * @see https://core.telegram.org/bots/api#businessopeninghours
 */
export interface BusinessOpeningHours {
  /** Unique name of the time zone for which the opening hours are defined */
  time_zone_name: String
  /** List of time intervals describing business opening hours */
  opening_hours: Array<BusinessOpeningHoursInterval>
}

/**
 * Describes the position of a clickable area within a story.
 * @see https://core.telegram.org/bots/api#storyareaposition
 */
export interface StoryAreaPosition {
  /** The abscissa of the area's center, as a percentage of the media width */
  x_percentage: Float
  /** The ordinate of the area's center, as a percentage of the media height */
  y_percentage: Float
  /** The width of the area's rectangle, as a percentage of the media width */
  width_percentage: Float
  /** The height of the area's rectangle, as a percentage of the media height */
  height_percentage: Float
  /** The clockwise rotation angle of the rectangle, in degrees; 0-360 */
  rotation_angle: Float
  /** The radius of the rectangle corner rounding, as a percentage of the media width */
  corner_radius_percentage: Float
}

/**
 * Describes the physical address of a location.
 * @see https://core.telegram.org/bots/api#locationaddress
 */
export interface LocationAddress {
  /** The two-letter ISO 3166-1 alpha-2 country code of the country where the location is located */
  country_code: String
  /** Optional. State of the location */
  state?: String
  /** Optional. City of the location */
  city?: String
  /** Optional. Street address of the location */
  street?: String
}

/**
 * Describes the type of a clickable area on a story. Currently, it can be one of StoryAreaTypeLocation, StoryAreaTypeSuggestedReaction, StoryAreaTypeLink, StoryAreaTypeWeather, StoryAreaTypeUniqueGift
 * @see https://core.telegram.org/bots/api#storyareatype
 */
export type StoryAreaType =
  | StoryAreaTypeLocation
  | StoryAreaTypeSuggestedReaction
  | StoryAreaTypeLink
  | StoryAreaTypeWeather
  | StoryAreaTypeUniqueGift

/**
 * Describes a story area pointing to a location. Currently, a story can have up to 10 location areas.
 * @see https://core.telegram.org/bots/api#storyareatypelocation
 */
export interface StoryAreaTypeLocation {
  /** Type of the area, always "location" */
  type: "location"
  /** Location latitude in degrees */
  latitude: Float
  /** Location longitude in degrees */
  longitude: Float
  /** Optional. Address of the location */
  address?: LocationAddress
}

/**
 * Describes a story area pointing to a suggested reaction. Currently, a story can have up to 5 suggested reaction areas.
 * @see https://core.telegram.org/bots/api#storyareatypesuggestedreaction
 */
export interface StoryAreaTypeSuggestedReaction {
  /** Type of the area, always "suggested_reaction" */
  type: "suggested_reaction"
  /** Type of the reaction */
  reaction_type: ReactionType
  /** Optional. Pass True if the reaction area has a dark background */
  is_dark?: Boolean
  /** Optional. Pass True if reaction area corner is flipped */
  is_flipped?: Boolean
}

/**
 * Describes a story area pointing to an HTTP or tg:// link. Currently, a story can have up to 3 link areas.
 * @see https://core.telegram.org/bots/api#storyareatypelink
 */
export interface StoryAreaTypeLink {
  /** Type of the area, always "link" */
  type: "link"
  /** HTTP or tg:// URL to be opened when the area is clicked */
  url: String
}

/**
 * Describes a story area containing weather information. Currently, a story can have up to 3 weather areas.
 * @see https://core.telegram.org/bots/api#storyareatypeweather
 */
export interface StoryAreaTypeWeather {
  /** Type of the area, always "weather" */
  type: "weather"
  /** Temperature, in degree Celsius */
  temperature: Float
  /** Emoji representing the weather */
  emoji: String
  /** A color of the area background in the ARGB format */
  background_color: Integer
}

/**
 * Describes a story area pointing to a unique gift. Currently, a story can have at most 1 unique gift area.
 * @see https://core.telegram.org/bots/api#storyareatypeuniquegift
 */
export interface StoryAreaTypeUniqueGift {
  /** Type of the area, always "unique_gift" */
  type: "unique_gift"
  /** Unique name of the gift */
  name: String
}

/**
 * Describes a clickable area on a story media.
 * @see https://core.telegram.org/bots/api#storyarea
 */
export interface StoryArea {
  /** Position of the area */
  position: StoryAreaPosition
  /** Type of the area */
  type: StoryAreaType
}

/**
 * Represents a location to which a chat is connected.
 * @see https://core.telegram.org/bots/api#chatlocation
 */
export interface ChatLocation {
  /** The location to which the supergroup is connected. Can't be a live location. */
  location: Location
  /** Location address; 1-64 characters, as defined by the chat owner */
  address: String
}

/**
 * This object describes the type of a reaction. Currently, it can be one of ReactionTypeEmoji, ReactionTypeCustomEmoji, ReactionTypePaid
 * @see https://core.telegram.org/bots/api#reactiontype
 */
export type ReactionType =
  | ReactionTypeEmoji
  | ReactionTypeCustomEmoji
  | ReactionTypePaid

/**
 * The reaction is based on an emoji.
 * @see https://core.telegram.org/bots/api#reactiontypeemoji
 */
export interface ReactionTypeEmoji {
  /** Type of the reaction, always "emoji" */
  type: "emoji"
  /** Reaction emoji. Currently, it can be one of "❤", "👍", "👎", "🔥", "🥰", "👏", "😁", "🤔", "🤯", "😱", "🤬", "😢", "🎉", "🤩", "🤮", "💩", "🙏", "👌", "🕊", "🤡", "🥱", "🥴", "😍", "🐳", "❤‍🔥", "🌚", "🌭", "💯", "🤣", "⚡", "🍌", "🏆", "💔", "🤨", "😐", "🍓", "🍾", "💋", "🖕", "😈", "😴", "😭", "🤓", "👻", "👨‍💻", "👀", "🎃", "🙈", "😇", "😨", "🤝", "✍", "🤗", "🫡", "🎅", "🎄", "☃", "💅", "🤪", "🗿", "🆒", "💘", "🙉", "🦄", "😘", "💊", "🙊", "😎", "👾", "🤷‍♂", "🤷", "🤷‍♀", "😡" */
  emoji: String
}

/**
 * The reaction is based on a custom emoji.
 * @see https://core.telegram.org/bots/api#reactiontypecustomemoji
 */
export interface ReactionTypeCustomEmoji {
  /** Type of the reaction, always "custom_emoji" */
  type: "custom_emoji"
  /** Custom emoji identifier */
  custom_emoji_id: String
}

/**
 * The reaction is paid.
 * @see https://core.telegram.org/bots/api#reactiontypepaid
 */
export interface ReactionTypePaid {
  /** Type of the reaction, always "paid" */
  type: "paid"
}

/**
 * Represents a reaction added to a message along with the number of times it was added.
 * @see https://core.telegram.org/bots/api#reactioncount
 */
export interface ReactionCount {
  /** Type of the reaction */
  type: ReactionType
  /** Number of times the reaction was added */
  total_count: Integer
}

/**
 * This object represents a change of a reaction on a message performed by a user.
 * @see https://core.telegram.org/bots/api#messagereactionupdated
 */
export interface MessageReactionUpdated {
  /** The chat containing the message the user reacted to */
  chat: Chat
  /** Unique identifier of the message inside the chat */
  message_id: Integer
  /** Optional. The user that changed the reaction, if the user isn't anonymous */
  user?: User
  /** Optional. The chat on behalf of which the reaction was changed, if the user is anonymous */
  actor_chat?: Chat
  /** Date of the change in Unix time */
  date: Integer
  /** Previous list of reaction types that were set by the user */
  old_reaction: Array<ReactionType>
  /** New list of reaction types that have been set by the user */
  new_reaction: Array<ReactionType>
}

/**
 * This object represents reaction changes on a message with anonymous reactions.
 * @see https://core.telegram.org/bots/api#messagereactioncountupdated
 */
export interface MessageReactionCountUpdated {
  /** The chat containing the message */
  chat: Chat
  /** Unique message identifier inside the chat */
  message_id: Integer
  /** Date of the change in Unix time */
  date: Integer
  /** List of reactions that are present on the message */
  reactions: Array<ReactionCount>
}

/**
 * This object represents a forum topic.
 * @see https://core.telegram.org/bots/api#forumtopic
 */
export interface ForumTopic {
  /** Unique identifier of the forum topic */
  message_thread_id: Integer
  /** Name of the topic */
  name: String
  /** Color of the topic icon in RGB format */
  icon_color: Integer
  /** Optional. Unique identifier of the custom emoji shown as the topic icon */
  icon_custom_emoji_id?: String
}

/**
 * This object represents a gift that can be sent by the bot.
 * @see https://core.telegram.org/bots/api#gift
 */
export interface Gift {
  /** Unique identifier of the gift */
  id: String
  /** The sticker that represents the gift */
  sticker: Sticker
  /** The number of Telegram Stars that must be paid to send the sticker */
  star_count: Integer
  /** Optional. The number of Telegram Stars that must be paid to upgrade the gift to a unique one */
  upgrade_star_count?: Integer
  /** Optional. The total number of the gifts of this type that can be sent; for limited gifts only */
  total_count?: Integer
  /** Optional. The number of remaining gifts of this type that can be sent; for limited gifts only */
  remaining_count?: Integer
  /** Optional. Information about the chat that published the gift */
  publisher_chat?: Chat
}

/**
 * This object represent a list of gifts.
 * @see https://core.telegram.org/bots/api#gifts
 */
export interface Gifts {
  /** The list of gifts */
  gifts: Array<Gift>
}

/**
 * This object describes the model of a unique gift.
 * @see https://core.telegram.org/bots/api#uniquegiftmodel
 */
export interface UniqueGiftModel {
  /** Name of the model */
  name: String
  /** The sticker that represents the unique gift */
  sticker: Sticker
  /** The number of unique gifts that receive this model for every 1000 gifts upgraded */
  rarity_per_mille: Integer
}

/**
 * This object describes the symbol shown on the pattern of a unique gift.
 * @see https://core.telegram.org/bots/api#uniquegiftsymbol
 */
export interface UniqueGiftSymbol {
  /** Name of the symbol */
  name: String
  /** The sticker that represents the unique gift */
  sticker: Sticker
  /** The number of unique gifts that receive this model for every 1000 gifts upgraded */
  rarity_per_mille: Integer
}

/**
 * This object describes the colors of the backdrop of a unique gift.
 * @see https://core.telegram.org/bots/api#uniquegiftbackdropcolors
 */
export interface UniqueGiftBackdropColors {
  /** The color in the center of the backdrop in RGB format */
  center_color: Integer
  /** The color on the edges of the backdrop in RGB format */
  edge_color: Integer
  /** The color to be applied to the symbol in RGB format */
  symbol_color: Integer
  /** The color for the text on the backdrop in RGB format */
  text_color: Integer
}

/**
 * This object describes the backdrop of a unique gift.
 * @see https://core.telegram.org/bots/api#uniquegiftbackdrop
 */
export interface UniqueGiftBackdrop {
  /** Name of the backdrop */
  name: String
  /** Colors of the backdrop */
  colors: UniqueGiftBackdropColors
  /** The number of unique gifts that receive this backdrop for every 1000 gifts upgraded */
  rarity_per_mille: Integer
}

/**
 * This object describes a unique gift that was upgraded from a regular gift.
 * @see https://core.telegram.org/bots/api#uniquegift
 */
export interface UniqueGift {
  /** Human-readable name of the regular gift from which this unique gift was upgraded */
  base_name: String
  /** Unique name of the gift. This name can be used in https://t.me/nft/... links and story areas */
  name: String
  /** Unique number of the upgraded gift among gifts upgraded from the same regular gift */
  number: Integer
  /** Model of the gift */
  model: UniqueGiftModel
  /** Symbol of the gift */
  symbol: UniqueGiftSymbol
  /** Backdrop of the gift */
  backdrop: UniqueGiftBackdrop
  /** Optional. Information about the chat that published the gift */
  publisher_chat?: Chat
}

/**
 * Describes a service message about a regular gift that was sent or received.
 * @see https://core.telegram.org/bots/api#giftinfo
 */
export interface GiftInfo {
  /** Information about the gift */
  gift: Gift
  /** Optional. Unique identifier of the received gift for the bot; only present for gifts received on behalf of business accounts */
  owned_gift_id?: String
  /** Optional. Number of Telegram Stars that can be claimed by the receiver by converting the gift; omitted if conversion to Telegram Stars is impossible */
  convert_star_count?: Integer
  /** Optional. Number of Telegram Stars that were prepaid by the sender for the ability to upgrade the gift */
  prepaid_upgrade_star_count?: Integer
  /** Optional. True, if the gift can be upgraded to a unique gift */
  can_be_upgraded?: True
  /** Optional. Text of the message that was added to the gift */
  text?: String
  /** Optional. Special entities that appear in the text */
  entities?: Array<MessageEntity>
  /** Optional. True, if the sender and gift text are shown only to the gift receiver; otherwise, everyone will be able to see them */
  is_private?: True
}

/**
 * Describes a service message about a unique gift that was sent or received.
 * @see https://core.telegram.org/bots/api#uniquegiftinfo
 */
export interface UniqueGiftInfo {
  /** Information about the gift */
  gift: UniqueGift
  /** Origin of the gift. Currently, either "upgrade" for gifts upgraded from regular gifts, "transfer" for gifts transferred from other users or channels, or "resale" for gifts bought from other users */
  origin: String
  /** Optional. For gifts bought from other users, the price paid for the gift */
  last_resale_star_count?: Integer
  /** Optional. Unique identifier of the received gift for the bot; only present for gifts received on behalf of business accounts */
  owned_gift_id?: String
  /** Optional. Number of Telegram Stars that must be paid to transfer the gift; omitted if the bot cannot transfer the gift */
  transfer_star_count?: Integer
  /** Optional. Point in time (Unix timestamp) when the gift can be transferred. If it is in the past, then the gift can be transferred now */
  next_transfer_date?: Integer
}

/**
 * This object describes a gift received and owned by a user or a chat. Currently, it can be one of OwnedGiftRegular, OwnedGiftUnique
 * @see https://core.telegram.org/bots/api#ownedgift
 */
export type OwnedGift = OwnedGiftRegular | OwnedGiftUnique

/**
 * Describes a regular gift owned by a user or a chat.
 * @see https://core.telegram.org/bots/api#ownedgiftregular
 */
export interface OwnedGiftRegular {
  /** Type of the gift, always "regular" */
  type: "regular"
  /** Information about the regular gift */
  gift: Gift
  /** Optional. Unique identifier of the gift for the bot; for gifts received on behalf of business accounts only */
  owned_gift_id?: String
  /** Optional. Sender of the gift if it is a known user */
  sender_user?: User
  /** Date the gift was sent in Unix time */
  send_date: Integer
  /** Optional. Text of the message that was added to the gift */
  text?: String
  /** Optional. Special entities that appear in the text */
  entities?: Array<MessageEntity>
  /** Optional. True, if the sender and gift text are shown only to the gift receiver; otherwise, everyone will be able to see them */
  is_private?: True
  /** Optional. True, if the gift is displayed on the account's profile page; for gifts received on behalf of business accounts only */
  is_saved?: True
  /** Optional. True, if the gift can be upgraded to a unique gift; for gifts received on behalf of business accounts only */
  can_be_upgraded?: True
  /** Optional. True, if the gift was refunded and isn't available anymore */
  was_refunded?: True
  /** Optional. Number of Telegram Stars that can be claimed by the receiver instead of the gift; omitted if the gift cannot be converted to Telegram Stars */
  convert_star_count?: Integer
  /** Optional. Number of Telegram Stars that were paid by the sender for the ability to upgrade the gift */
  prepaid_upgrade_star_count?: Integer
}

/**
 * Describes a unique gift received and owned by a user or a chat.
 * @see https://core.telegram.org/bots/api#ownedgiftunique
 */
export interface OwnedGiftUnique {
  /** Type of the gift, always "unique" */
  type: "unique"
  /** Information about the unique gift */
  gift: UniqueGift
  /** Optional. Unique identifier of the received gift for the bot; for gifts received on behalf of business accounts only */
  owned_gift_id?: String
  /** Optional. Sender of the gift if it is a known user */
  sender_user?: User
  /** Date the gift was sent in Unix time */
  send_date: Integer
  /** Optional. True, if the gift is displayed on the account's profile page; for gifts received on behalf of business accounts only */
  is_saved?: True
  /** Optional. True, if the gift can be transferred to another owner; for gifts received on behalf of business accounts only */
  can_be_transferred?: True
  /** Optional. Number of Telegram Stars that must be paid to transfer the gift; omitted if the bot cannot transfer the gift */
  transfer_star_count?: Integer
  /** Optional. Point in time (Unix timestamp) when the gift can be transferred. If it is in the past, then the gift can be transferred now */
  next_transfer_date?: Integer
}

/**
 * Contains the list of gifts received and owned by a user or a chat.
 * @see https://core.telegram.org/bots/api#ownedgifts
 */
export interface OwnedGifts {
  /** The total number of gifts owned by the user or the chat */
  total_count: Integer
  /** The list of gifts */
  gifts: Array<OwnedGift>
  /** Optional. Offset for the next request. If empty, then there are no more results */
  next_offset?: String
}

/**
 * This object describes the types of gifts that can be gifted to a user or a chat.
 * @see https://core.telegram.org/bots/api#acceptedgifttypes
 */
export interface AcceptedGiftTypes {
  /** True, if unlimited regular gifts are accepted */
  unlimited_gifts: Boolean
  /** True, if limited regular gifts are accepted */
  limited_gifts: Boolean
  /** True, if unique gifts or gifts that can be upgraded to unique for free are accepted */
  unique_gifts: Boolean
  /** True, if a Telegram Premium subscription is accepted */
  premium_subscription: Boolean
}

/**
 * Describes an amount of Telegram Stars.
 * @see https://core.telegram.org/bots/api#staramount
 */
export interface StarAmount {
  /** Integer amount of Telegram Stars, rounded to 0; can be negative */
  amount: Integer
  /** Optional. The number of 1/1000000000 shares of Telegram Stars; from -999999999 to 999999999; can be negative if and only if amount is non-positive */
  nanostar_amount?: Integer
}

/**
 * This object represents a bot command.
 * @see https://core.telegram.org/bots/api#botcommand
 */
export interface BotCommand {
  /** Text of the command; 1-32 characters. Can contain only lowercase English letters, digits and underscores. */
  command: String
  /** Description of the command; 1-256 characters. */
  description: String
}

/**
This object represents the scope to which bot commands are applied. Currently, the following 7 scopes are supported: BotCommandScopeDefault, BotCommandScopeAllPrivateChats, BotCommandScopeAllGroupChats, BotCommandScopeAllChatAdministrators, BotCommandScopeChat, BotCommandScopeChatAdministrators, BotCommandScopeChatMember

Determining list of commands
The following algorithm is used to determine the list of commands for a particular user viewing the bot menu. The first list of commands which is set is returned:

Commands in the chat with the bot

- botCommandScopeChat + language_code
- botCommandScopeChat
- botCommandScopeAllPrivateChats + language_code
- botCommandScopeAllPrivateChats
- botCommandScopeDefault + language_code
- botCommandScopeDefault

Commands in group and supergroup chats

- botCommandScopeChatMember + language_code
- botCommandScopeChatMember
- botCommandScopeChatAdministrators + language_code (administrators only)
- botCommandScopeChatAdministrators (administrators only)
- botCommandScopeChat + language_code
- botCommandScopeChat
- botCommandScopeAllChatAdministrators + language_code (administrators only)
- botCommandScopeAllChatAdministrators (administrators only)
- botCommandScopeAllGroupChats + language_code
- botCommandScopeAllGroupChats
- botCommandScopeDefault + language_code
- botCommandScopeDefault
*/
export type BotCommandScope =
  | BotCommandScopeDefault
  | BotCommandScopeAllPrivateChats
  | BotCommandScopeAllGroupChats
  | BotCommandScopeAllChatAdministrators
  | BotCommandScopeChat
  | BotCommandScopeChatAdministrators
  | BotCommandScopeChatMember

/**
 * Represents the default narrower scope are specified for the user.
 * @see https://core.telegram.org/bots/api#botcommandscopedefault
 */
export interface BotCommandScopeDefault {
  /** Scope type, must be default */
  type: String
}

/**
 * Represents the scope of bot commands, covering all private chats.
 * @see https://core.telegram.org/bots/api#botcommandscopeallprivatechats
 */
export interface BotCommandScopeAllPrivateChats {
  /** Scope type, must be all_private_chats */
  type: String
}

/**
 * Represents the scope of bot commands, covering all group and supergroup chats.
 * @see https://core.telegram.org/bots/api#botcommandscopeallgroupchats
 */
export interface BotCommandScopeAllGroupChats {
  /** Scope type, must be all_group_chats */
  type: String
}

/**
 * Represents the scope of bot commands, covering all group and supergroup chat administrators.
 * @see https://core.telegram.org/bots/api#botcommandscopeallchatadministrators
 */
export interface BotCommandScopeAllChatAdministrators {
  /** Scope type, must be all_chat_administrators */
  type: String
}

/**
 * Represents the scope of bot commands, covering a specific chat.
 * @see https://core.telegram.org/bots/api#botcommandscopechat
 */
export interface BotCommandScopeChat {
  /** Scope type, must be chat */
  type: String
  /** Unique identifier for the target chat or username of the target supergroup (in the format @supergroupusername). Channel direct messages chats and channel chats aren't supported. */
  chat_id: Integer | String
}

/**
 * Represents the scope of bot commands, covering all administrators of a specific group or supergroup chat.
 * @see https://core.telegram.org/bots/api#botcommandscopechatadministrators
 */
export interface BotCommandScopeChatAdministrators {
  /** Scope type, must be chat_administrators */
  type: String
  /** Unique identifier for the target chat or username of the target supergroup (in the format @supergroupusername). Channel direct messages chats and channel chats aren't supported. */
  chat_id: Integer | String
}

/**
 * Represents the scope of bot commands, covering a specific member of a group or supergroup chat.
 * @see https://core.telegram.org/bots/api#botcommandscopechatmember
 */
export interface BotCommandScopeChatMember {
  /** Scope type, must be chat_member */
  type: String
  /** Unique identifier for the target chat or username of the target supergroup (in the format @supergroupusername). Channel direct messages chats and channel chats aren't supported. */
  chat_id: Integer | String
  /** Unique identifier of the target user */
  user_id: Integer
}

/**
 * This object represents the bot's name.
 * @see https://core.telegram.org/bots/api#botname
 */
export interface BotName {
  /** The bot's name */
  name: String
}

/**
 * This object represents the bot's description.
 * @see https://core.telegram.org/bots/api#botdescription
 */
export interface BotDescription {
  /** The bot's description */
  description: String
}

/**
 * This object represents the bot's short description.
 * @see https://core.telegram.org/bots/api#botshortdescription
 */
export interface BotShortDescription {
  /** The bot's short description */
  short_description: String
}

/**
 * This object describes the bot's menu button in a private chat. It should be one of MenuButtonCommands, MenuButtonWebApp, MenuButtonDefault. If a menu button other than MenuButtonDefault is set for a private chat, then it is applied in the chat. Otherwise the default menu button is applied. By default, the menu button opens the list of bot commands.
 * @see https://core.telegram.org/bots/api#menubutton
 */
export type MenuButton =
  | MenuButtonCommands
  | MenuButtonWebApp
  | MenuButtonDefault

/**
 * Represents a menu button, which opens the bot's list of commands.
 * @see https://core.telegram.org/bots/api#menubuttoncommands
 */
export interface MenuButtonCommands {
  /** Type of the button, must be commands */
  type: String
}

/**
 * Represents a menu button, which launches a Web App.
 * @see https://core.telegram.org/bots/api#menubuttonwebapp
 */
export interface MenuButtonWebApp {
  /** Type of the button, must be web_app */
  type: String
  /** Text on the button */
  text: String
  /** Description of the Web App that will be launched when the user presses the button. The Web App will be able to send an arbitrary message on behalf of the user using the method answerWebAppQuery. Alternatively, a t.me link to a Web App of the bot can be specified in the object instead of the Web App's URL, in which case the Web App will be opened as if the user pressed the link. */
  web_app: WebAppInfo
}

/**
 * Describes that no specific value for the menu button was set.
 * @see https://core.telegram.org/bots/api#menubuttondefault
 */
export interface MenuButtonDefault {
  /** Type of the button, must be default */
  type: String
}

/**
 * This object describes the source of a chat boost. It can be one of ChatBoostSourcePremium, ChatBoostSourceGiftCode, ChatBoostSourceGiveaway
 * @see https://core.telegram.org/bots/api#chatboostsource
 */
export type ChatBoostSource =
  | ChatBoostSourcePremium
  | ChatBoostSourceGiftCode
  | ChatBoostSourceGiveaway

/**
 * The boost was obtained by subscribing to Telegram Premium or by gifting a Telegram Premium subscription to another user.
 * @see https://core.telegram.org/bots/api#chatboostsourcepremium
 */
export interface ChatBoostSourcePremium {
  /** Source of the boost, always "premium" */
  source: "premium"
  /** User that boosted the chat */
  user: User
}

/**
 * The boost was obtained by the creation of Telegram Premium gift codes to boost a chat. Each such code boosts the chat 4 times for the duration of the corresponding Telegram Premium subscription.
 * @see https://core.telegram.org/bots/api#chatboostsourcegiftcode
 */
export interface ChatBoostSourceGiftCode {
  /** Source of the boost, always "gift_code" */
  source: "gift_code"
  /** User for which the gift code was created */
  user: User
}

/**
 * The boost was obtained by the creation of a Telegram Premium or a Telegram Star giveaway. This boosts the chat 4 times for the duration of the corresponding Telegram Premium subscription for Telegram Premium giveaways and prize_star_count / 500 times for one year for Telegram Star giveaways.
 * @see https://core.telegram.org/bots/api#chatboostsourcegiveaway
 */
export interface ChatBoostSourceGiveaway {
  /** Source of the boost, always "giveaway" */
  source: "giveaway"
  /** Identifier of a message in the chat with the giveaway; the message could have been deleted already. May be 0 if the message isn't sent yet. */
  giveaway_message_id: Integer
  /** Optional. User that won the prize in the giveaway if any; for Telegram Premium giveaways only */
  user?: User
  /** Optional. The number of Telegram Stars to be split between giveaway winners; for Telegram Star giveaways only */
  prize_star_count?: Integer
  /** Optional. True, if the giveaway was completed, but there was no user to win the prize */
  is_unclaimed?: True
}

/**
 * This object contains information about a chat boost.
 * @see https://core.telegram.org/bots/api#chatboost
 */
export interface ChatBoost {
  /** Unique identifier of the boost */
  boost_id: String
  /** Point in time (Unix timestamp) when the chat was boosted */
  add_date: Integer
  /** Point in time (Unix timestamp) when the boost will automatically expire, unless the booster's Telegram Premium subscription is prolonged */
  expiration_date: Integer
  /** Source of the added boost */
  source: ChatBoostSource
}

/**
 * This object represents a boost added to a chat or changed.
 * @see https://core.telegram.org/bots/api#chatboostupdated
 */
export interface ChatBoostUpdated {
  /** Chat which was boosted */
  chat: Chat
  /** Information about the chat boost */
  boost: ChatBoost
}

/**
 * This object represents a boost removed from a chat.
 * @see https://core.telegram.org/bots/api#chatboostremoved
 */
export interface ChatBoostRemoved {
  /** Chat which was boosted */
  chat: Chat
  /** Unique identifier of the boost */
  boost_id: String
  /** Point in time (Unix timestamp) when the boost was removed */
  remove_date: Integer
  /** Source of the removed boost */
  source: ChatBoostSource
}

/**
 * This object represents a list of boosts added to a chat by a user.
 * @see https://core.telegram.org/bots/api#userchatboosts
 */
export interface UserChatBoosts {
  /** The list of boosts added to the chat by the user */
  boosts: Array<ChatBoost>
}

/**
 * Represents the rights of a business bot.
 * @see https://core.telegram.org/bots/api#businessbotrights
 */
export interface BusinessBotRights {
  /** Optional. True, if the bot can send and edit messages in the private chats that had incoming messages in the last 24 hours */
  can_reply?: True
  /** Optional. True, if the bot can mark incoming private messages as read */
  can_read_messages?: True
  /** Optional. True, if the bot can delete messages sent by the bot */
  can_delete_sent_messages?: True
  /** Optional. True, if the bot can delete all private messages in managed chats */
  can_delete_all_messages?: True
  /** Optional. True, if the bot can edit the first and last name of the business account */
  can_edit_name?: True
  /** Optional. True, if the bot can edit the bio of the business account */
  can_edit_bio?: True
  /** Optional. True, if the bot can edit the profile photo of the business account */
  can_edit_profile_photo?: True
  /** Optional. True, if the bot can edit the username of the business account */
  can_edit_username?: True
  /** Optional. True, if the bot can change the privacy settings pertaining to gifts for the business account */
  can_change_gift_settings?: True
  /** Optional. True, if the bot can view gifts and the amount of Telegram Stars owned by the business account */
  can_view_gifts_and_stars?: True
  /** Optional. True, if the bot can convert regular gifts owned by the business account to Telegram Stars */
  can_convert_gifts_to_stars?: True
  /** Optional. True, if the bot can transfer and upgrade gifts owned by the business account */
  can_transfer_and_upgrade_gifts?: True
  /** Optional. True, if the bot can transfer Telegram Stars received by the business account to its own account, or use them to upgrade and transfer gifts */
  can_transfer_stars?: True
  /** Optional. True, if the bot can post, edit and delete stories on behalf of the business account */
  can_manage_stories?: True
}

/**
 * Describes the connection of the bot with a business account.
 * @see https://core.telegram.org/bots/api#businessconnection
 */
export interface BusinessConnection {
  /** Unique identifier of the business connection */
  id: String
  /** Business account user that created the business connection */
  user: User
  /** Identifier of a private chat with the user who created the business connection. This number may have more than 32 significant bits and some programming languages may have difficulty/silent defects in interpreting it. But it has at most 52 significant bits, so a 64-bit integer or double-precision float type are safe for storing this identifier. */
  user_chat_id: Integer
  /** Date the connection was established in Unix time */
  date: Integer
  /** Optional. Rights of the business bot */
  rights?: BusinessBotRights
  /** True, if the connection is active */
  is_enabled: Boolean
}

/**
 * This object is received when messages are deleted from a connected business account.
 * @see https://core.telegram.org/bots/api#businessmessagesdeleted
 */
export interface BusinessMessagesDeleted {
  /** Unique identifier of the business connection */
  business_connection_id: String
  /** Information about a chat in the business account. The bot may not have access to the chat or the corresponding user. */
  chat: Chat
  /** The list of identifiers of deleted messages in the chat of the business account */
  message_ids: Array<Integer>
}

/**
 * Describes why a request was unsuccessful.
 * @see https://core.telegram.org/bots/api#responseparameters
 */
export interface ResponseParameters {
  /** Optional. The group has been migrated to a supergroup with the specified identifier. This number may have more than 32 significant bits and some programming languages may have difficulty/silent defects in interpreting it. But it has at most 52 significant bits, so a signed 64-bit integer or double-precision float type are safe for storing this identifier. */
  migrate_to_chat_id?: Integer
  /** Optional. In case of exceeding flood control, the number of seconds left to wait before the request can be repeated */
  retry_after?: Integer
}

/**
 * This object represents the content of a media message to be sent. It should be one of InputMediaAnimation, InputMediaDocument, InputMediaAudio, InputMediaPhoto, InputMediaVideo
 * @see https://core.telegram.org/bots/api#inputmedia
 */
export type InputMedia =
  | InputMediaAnimation
  | InputMediaDocument
  | InputMediaAudio
  | InputMediaPhoto
  | InputMediaVideo

/**
 * Represents a photo to be sent.
 * @see https://core.telegram.org/bots/api#inputmediaphoto
 */
export interface InputMediaPhoto {
  /** Type of the result, must be photo */
  type: String
  /** File to send. Pass a file_id to send a file that exists on the Telegram servers (recommended), pass an HTTP URL for Telegram to get a file from the Internet, or pass "attach://<file_attach_name>" to upload a new one using multipart/form-data under <file_attach_name> name. More information on Sending Files » */
  media: String
  /** Optional. Caption of the photo to be sent, 0-1024 characters after entities parsing */
  caption?: String
  /** Optional. Mode for parsing entities in the photo caption. See formatting options for more details. */
  parse_mode?: String
  /** Optional. List of special entities that appear in the caption, which can be specified instead of parse_mode */
  caption_entities?: Array<MessageEntity>
  /** Optional. Pass True, if the caption must be shown above the message media */
  show_caption_above_media?: Boolean
  /** Optional. Pass True if the photo needs to be covered with a spoiler animation */
  has_spoiler?: Boolean
}

/**
 * Represents a video to be sent.
 * @see https://core.telegram.org/bots/api#inputmediavideo
 */
export interface InputMediaVideo {
  /** Type of the result, must be video */
  type: String
  /** File to send. Pass a file_id to send a file that exists on the Telegram servers (recommended), pass an HTTP URL for Telegram to get a file from the Internet, or pass "attach://<file_attach_name>" to upload a new one using multipart/form-data under <file_attach_name> name. More information on Sending Files » */
  media: String
  /** Optional. Thumbnail of the file sent; can be ignored if thumbnail generation for the file is supported server-side. The thumbnail should be in JPEG format and less than 200 kB in size. A thumbnail's width and height should not exceed 320. Ignored if the file is not uploaded using multipart/form-data. Thumbnails can't be reused and can be only uploaded as a new file, so you can pass "attach://<file_attach_name>" if the thumbnail was uploaded using multipart/form-data under <file_attach_name>. More information on Sending Files » */
  thumbnail?: String
  /** Optional. Cover for the video in the message. Pass a file_id to send a file that exists on the Telegram servers (recommended), pass an HTTP URL for Telegram to get a file from the Internet, or pass "attach://<file_attach_name>" to upload a new one using multipart/form-data under <file_attach_name> name. More information on Sending Files » */
  cover?: String
  /** Optional. Start timestamp for the video in the message */
  start_timestamp?: Integer
  /** Optional. Caption of the video to be sent, 0-1024 characters after entities parsing */
  caption?: String
  /** Optional. Mode for parsing entities in the video caption. See formatting options for more details. */
  parse_mode?: String
  /** Optional. List of special entities that appear in the caption, which can be specified instead of parse_mode */
  caption_entities?: Array<MessageEntity>
  /** Optional. Pass True, if the caption must be shown above the message media */
  show_caption_above_media?: Boolean
  /** Optional. Video width */
  width?: Integer
  /** Optional. Video height */
  height?: Integer
  /** Optional. Video duration in seconds */
  duration?: Integer
  /** Optional. Pass True if the uploaded video is suitable for streaming */
  supports_streaming?: Boolean
  /** Optional. Pass True if the video needs to be covered with a spoiler animation */
  has_spoiler?: Boolean
}

/**
 * Represents an animation file (GIF or H.264/MPEG-4 AVC video without sound) to be sent.
 * @see https://core.telegram.org/bots/api#inputmediaanimation
 */
export interface InputMediaAnimation {
  /** Type of the result, must be animation */
  type: String
  /** File to send. Pass a file_id to send a file that exists on the Telegram servers (recommended), pass an HTTP URL for Telegram to get a file from the Internet, or pass "attach://<file_attach_name>" to upload a new one using multipart/form-data under <file_attach_name> name. More information on Sending Files » */
  media: String
  /** Optional. Thumbnail of the file sent; can be ignored if thumbnail generation for the file is supported server-side. The thumbnail should be in JPEG format and less than 200 kB in size. A thumbnail's width and height should not exceed 320. Ignored if the file is not uploaded using multipart/form-data. Thumbnails can't be reused and can be only uploaded as a new file, so you can pass "attach://<file_attach_name>" if the thumbnail was uploaded using multipart/form-data under <file_attach_name>. More information on Sending Files » */
  thumbnail?: String
  /** Optional. Caption of the animation to be sent, 0-1024 characters after entities parsing */
  caption?: String
  /** Optional. Mode for parsing entities in the animation caption. See formatting options for more details. */
  parse_mode?: String
  /** Optional. List of special entities that appear in the caption, which can be specified instead of parse_mode */
  caption_entities?: Array<MessageEntity>
  /** Optional. Pass True, if the caption must be shown above the message media */
  show_caption_above_media?: Boolean
  /** Optional. Animation width */
  width?: Integer
  /** Optional. Animation height */
  height?: Integer
  /** Optional. Animation duration in seconds */
  duration?: Integer
  /** Optional. Pass True if the animation needs to be covered with a spoiler animation */
  has_spoiler?: Boolean
}

/**
 * Represents an audio file to be treated as music to be sent.
 * @see https://core.telegram.org/bots/api#inputmediaaudio
 */
export interface InputMediaAudio {
  /** Type of the result, must be audio */
  type: String
  /** File to send. Pass a file_id to send a file that exists on the Telegram servers (recommended), pass an HTTP URL for Telegram to get a file from the Internet, or pass "attach://<file_attach_name>" to upload a new one using multipart/form-data under <file_attach_name> name. More information on Sending Files » */
  media: String
  /** Optional. Thumbnail of the file sent; can be ignored if thumbnail generation for the file is supported server-side. The thumbnail should be in JPEG format and less than 200 kB in size. A thumbnail's width and height should not exceed 320. Ignored if the file is not uploaded using multipart/form-data. Thumbnails can't be reused and can be only uploaded as a new file, so you can pass "attach://<file_attach_name>" if the thumbnail was uploaded using multipart/form-data under <file_attach_name>. More information on Sending Files » */
  thumbnail?: String
  /** Optional. Caption of the audio to be sent, 0-1024 characters after entities parsing */
  caption?: String
  /** Optional. Mode for parsing entities in the audio caption. See formatting options for more details. */
  parse_mode?: String
  /** Optional. List of special entities that appear in the caption, which can be specified instead of parse_mode */
  caption_entities?: Array<MessageEntity>
  /** Optional. Duration of the audio in seconds */
  duration?: Integer
  /** Optional. Performer of the audio */
  performer?: String
  /** Optional. Title of the audio */
  title?: String
}

/**
 * Represents a general file to be sent.
 * @see https://core.telegram.org/bots/api#inputmediadocument
 */
export interface InputMediaDocument {
  /** Type of the result, must be document */
  type: String
  /** File to send. Pass a file_id to send a file that exists on the Telegram servers (recommended), pass an HTTP URL for Telegram to get a file from the Internet, or pass "attach://<file_attach_name>" to upload a new one using multipart/form-data under <file_attach_name> name. More information on Sending Files » */
  media: String
  /** Optional. Thumbnail of the file sent; can be ignored if thumbnail generation for the file is supported server-side. The thumbnail should be in JPEG format and less than 200 kB in size. A thumbnail's width and height should not exceed 320. Ignored if the file is not uploaded using multipart/form-data. Thumbnails can't be reused and can be only uploaded as a new file, so you can pass "attach://<file_attach_name>" if the thumbnail was uploaded using multipart/form-data under <file_attach_name>. More information on Sending Files » */
  thumbnail?: String
  /** Optional. Caption of the document to be sent, 0-1024 characters after entities parsing */
  caption?: String
  /** Optional. Mode for parsing entities in the document caption. See formatting options for more details. */
  parse_mode?: String
  /** Optional. List of special entities that appear in the caption, which can be specified instead of parse_mode */
  caption_entities?: Array<MessageEntity>
  /** Optional. Disables automatic server-side content type detection for files uploaded using multipart/form-data. Always True, if the document is sent as part of an album. */
  disable_content_type_detection?: Boolean
}

/**
 * This object represents the contents of a file to be uploaded. Must be posted using multipart/form-data in the usual way that files are uploaded via the browser.
 * @see https://core.telegram.org/bots/api#inputfile
 */
export interface InputFile {
  content?: string | Buffer | Blob
  file?: File
  filename?: string
}

/**
 * This object describes the paid media to be sent. Currently, it can be one of InputPaidMediaPhoto, InputPaidMediaVideo
 * @see https://core.telegram.org/bots/api#inputpaidmedia
 */
export type InputPaidMedia = InputPaidMediaPhoto | InputPaidMediaVideo

/**
 * The paid media to send is a photo.
 * @see https://core.telegram.org/bots/api#inputpaidmediaphoto
 */
export interface InputPaidMediaPhoto {
  /** Type of the media, must be photo */
  type: String
  /** File to send. Pass a file_id to send a file that exists on the Telegram servers (recommended), pass an HTTP URL for Telegram to get a file from the Internet, or pass "attach://<file_attach_name>" to upload a new one using multipart/form-data under <file_attach_name> name. More information on Sending Files » */
  media: String
}

/**
 * The paid media to send is a video.
 * @see https://core.telegram.org/bots/api#inputpaidmediavideo
 */
export interface InputPaidMediaVideo {
  /** Type of the media, must be video */
  type: String
  /** File to send. Pass a file_id to send a file that exists on the Telegram servers (recommended), pass an HTTP URL for Telegram to get a file from the Internet, or pass "attach://<file_attach_name>" to upload a new one using multipart/form-data under <file_attach_name> name. More information on Sending Files » */
  media: String
  /** Optional. Thumbnail of the file sent; can be ignored if thumbnail generation for the file is supported server-side. The thumbnail should be in JPEG format and less than 200 kB in size. A thumbnail's width and height should not exceed 320. Ignored if the file is not uploaded using multipart/form-data. Thumbnails can't be reused and can be only uploaded as a new file, so you can pass "attach://<file_attach_name>" if the thumbnail was uploaded using multipart/form-data under <file_attach_name>. More information on Sending Files » */
  thumbnail?: String
  /** Optional. Cover for the video in the message. Pass a file_id to send a file that exists on the Telegram servers (recommended), pass an HTTP URL for Telegram to get a file from the Internet, or pass "attach://<file_attach_name>" to upload a new one using multipart/form-data under <file_attach_name> name. More information on Sending Files » */
  cover?: String
  /** Optional. Start timestamp for the video in the message */
  start_timestamp?: Integer
  /** Optional. Video width */
  width?: Integer
  /** Optional. Video height */
  height?: Integer
  /** Optional. Video duration in seconds */
  duration?: Integer
  /** Optional. Pass True if the uploaded video is suitable for streaming */
  supports_streaming?: Boolean
}

/**
 * This object describes a profile photo to set. Currently, it can be one of InputProfilePhotoStatic, InputProfilePhotoAnimated
 * @see https://core.telegram.org/bots/api#inputprofilephoto
 */
export type InputProfilePhoto =
  | InputProfilePhotoStatic
  | InputProfilePhotoAnimated

/**
 * A static profile photo in the .JPG format.
 * @see https://core.telegram.org/bots/api#inputprofilephotostatic
 */
export interface InputProfilePhotoStatic {
  /** Type of the profile photo, must be static */
  type: String
  /** The static profile photo. Profile photos can't be reused and can only be uploaded as a new file, so you can pass "attach://<file_attach_name>" if the photo was uploaded using multipart/form-data under <file_attach_name>. More information on Sending Files » */
  photo: String
}

/**
 * An animated profile photo in the MPEG4 format.
 * @see https://core.telegram.org/bots/api#inputprofilephotoanimated
 */
export interface InputProfilePhotoAnimated {
  /** Type of the profile photo, must be animated */
  type: String
  /** The animated profile photo. Profile photos can't be reused and can only be uploaded as a new file, so you can pass "attach://<file_attach_name>" if the photo was uploaded using multipart/form-data under <file_attach_name>. More information on Sending Files » */
  animation: String
  /** Optional. Timestamp in seconds of the frame that will be used as the static profile photo. Defaults to 0.0. */
  main_frame_timestamp?: Float
}

/**
 * This object describes the content of a story to post. Currently, it can be one of InputStoryContentPhoto, InputStoryContentVideo
 * @see https://core.telegram.org/bots/api#inputstorycontent
 */
export type InputStoryContent = InputStoryContentPhoto | InputStoryContentVideo

/**
 * Describes a photo to post as a story.
 * @see https://core.telegram.org/bots/api#inputstorycontentphoto
 */
export interface InputStoryContentPhoto {
  /** Type of the content, must be photo */
  type: String
  /** The photo to post as a story. The photo must be of the size 1080x1920 and must not exceed 10 MB. The photo can't be reused and can only be uploaded as a new file, so you can pass "attach://<file_attach_name>" if the photo was uploaded using multipart/form-data under <file_attach_name>. More information on Sending Files » */
  photo: String
}

/**
 * Describes a video to post as a story.
 * @see https://core.telegram.org/bots/api#inputstorycontentvideo
 */
export interface InputStoryContentVideo {
  /** Type of the content, must be video */
  type: String
  /** The video to post as a story. The video must be of the size 720x1280, streamable, encoded with H.265 codec, with key frames added each second in the MPEG4 format, and must not exceed 30 MB. The video can't be reused and can only be uploaded as a new file, so you can pass "attach://<file_attach_name>" if the video was uploaded using multipart/form-data under <file_attach_name>. More information on Sending Files » */
  video: String
  /** Optional. Precise duration of the video in seconds; 0-60 */
  duration?: Float
  /** Optional. Timestamp in seconds of the frame that will be used as the static cover for the story. Defaults to 0.0. */
  cover_frame_timestamp?: Float
  /** Optional. Pass True if the video has no sound */
  is_animation?: Boolean
}

/**
 * A simple method for testing your bot's authentication token. Requires no parameters. Returns basic information about the bot in form of a User object.
 * @see https://core.telegram.org/bots/api#getme
 */
export type GetMeParams = object

/**
 * Use this method to log out from the cloud Bot API server before launching the bot locally. You must log out the bot before running it locally, otherwise there is no guarantee that the bot will receive updates. After a successful call, you can immediately log in on a local server, but will not be able to log in back to the cloud Bot API server for 10 minutes. Returns True on success. Requires no parameters.
 * @see https://core.telegram.org/bots/api#logout
 */
export type LogOutParams = object

/**
 * Use this method to close the bot instance before moving it from one local server to another. You need to delete the webhook before calling this method to ensure that the bot isn't launched again after server restart. The method will return error 429 in the first 10 minutes after the bot is launched. Returns True on success. Requires no parameters.
 * @see https://core.telegram.org/bots/api#close
 */
export type CloseParams = object

/**
 * Use this method to send text messages. On success, the sent Message is returned.
 * @see https://core.telegram.org/bots/api#sendmessage
 */
export interface SendMessageParams {
  /** Unique identifier of the business connection on behalf of which the message will be sent */
  business_connection_id?: String
  /** Unique identifier for the target chat or username of the target channel (in the format @channelusername) */
  chat_id: Integer | String
  /** Unique identifier for the target message thread (topic) of the forum; for forum supergroups only */
  message_thread_id?: Integer
  /** Identifier of the direct messages topic to which the message will be sent; required if the message is sent to a direct messages chat */
  direct_messages_topic_id?: Integer
  /** Text of the message to be sent, 1-4096 characters after entities parsing */
  text: String
  /** Mode for parsing entities in the message text. See formatting options for more details. */
  parse_mode?: String
  /** A JSON-serialized list of special entities that appear in message text, which can be specified instead of parse_mode */
  entities?: Array<MessageEntity>
  /** Link preview generation options for the message */
  link_preview_options?: LinkPreviewOptions
  /** Sends the message silently. Users will receive a notification with no sound. */
  disable_notification?: Boolean
  /** Protects the contents of the sent message from forwarding and saving */
  protect_content?: Boolean
  /** Pass True to allow up to 1000 messages per second, ignoring broadcasting limits for a fee of 0.1 Telegram Stars per message. The relevant Stars will be withdrawn from the bot's balance */
  allow_paid_broadcast?: Boolean
  /** Unique identifier of the message effect to be added to the message; for private chats only */
  message_effect_id?: String
  /** A JSON-serialized object containing the parameters of the suggested post to send; for direct messages chats only. If the message is sent as a reply to another suggested post, then that suggested post is automatically declined. */
  suggested_post_parameters?: SuggestedPostParameters
  /** Description of the message to reply to */
  reply_parameters?: ReplyParameters
  /** Additional interface options. A JSON-serialized object for an custom reply keyboard, instructions to remove a reply keyboard or to force a reply from the user */
  reply_markup?: ForceReply
}

/**
 * Use this method to forward messages of any kind. Service messages and messages with protected content can't be forwarded. On success, the sent Message is returned.
 * @see https://core.telegram.org/bots/api#forwardmessage
 */
export interface ForwardMessageParams {
  /** Unique identifier for the target chat or username of the target channel (in the format @channelusername) */
  chat_id: Integer | String
  /** Unique identifier for the target message thread (topic) of the forum; for forum supergroups only */
  message_thread_id?: Integer
  /** Identifier of the direct messages topic to which the messages will be forwarded; required if the messages are forwarded to a direct messages chat */
  direct_messages_topic_id?: Integer
  /** Unique identifier for the chat where the original messages were sent (or channel username in the format @channelusername) */
  from_chat_id: Integer | String
  /** New start timestamp for the forwarded video in the message */
  video_start_timestamp?: Integer
  /** Sends the message silently. Users will receive a notification with no sound. */
  disable_notification?: Boolean
  /** Protects the contents of the forwarded messages from forwarding and saving */
  protect_content?: Boolean
  /** A JSON-serialized object containing the parameters of the suggested post to send; for direct messages chats only */
  suggested_post_parameters?: SuggestedPostParameters
  /** Message identifier in the chat specified in from_chat_id */
  message_id: Integer
}

/**
 * Use this method to forward multiple messages of any kind. If some of the specified messages can't be found or forwarded, they are skipped. Service messages and messages with protected content can't be forwarded. Album grouping is kept for forwarded messages. On success, an array of MessageId of the sent messages is returned.
 * @see https://core.telegram.org/bots/api#forwardmessages
 */
export interface ForwardMessagesParams {
  /** Unique identifier for the target chat or username of the target channel (in the format @channelusername) */
  chat_id: Integer | String
  /** Unique identifier for the target message thread (topic) of the forum; for forum supergroups only */
  message_thread_id?: Integer
  /** Identifier of the direct messages topic to which the messages will be forwarded; required if the messages are forwarded to a direct messages chat */
  direct_messages_topic_id?: Integer
  /** Unique identifier for the chat where the original messages were sent (or channel username in the format @channelusername) */
  from_chat_id: Integer | String
  /** A JSON-serialized list of 1-100 identifiers of messages in the chat from_chat_id to forward. The identifiers must be specified in a strictly increasing order. */
  message_ids: Array<Integer>
  /** Sends the messages silently. Users will receive a notification with no sound. */
  disable_notification?: Boolean
  /** Protects the contents of the forwarded messages from forwarding and saving */
  protect_content?: Boolean
}

/**
 * Use this method to copy messages of any kind. Service messages, paid media messages, giveaway messages, giveaway winners messages, and invoice messages can't be copied. A quiz MessageId of the sent message on success.
 * @see https://core.telegram.org/bots/api#copymessage
 */
export interface CopyMessageParams {
  /** Unique identifier for the target chat or username of the target channel (in the format @channelusername) */
  chat_id: Integer | String
  /** Unique identifier for the target message thread (topic) of the forum; for forum supergroups only */
  message_thread_id?: Integer
  /** Identifier of the direct messages topic to which the message will be sent; required if the message is sent to a direct messages chat */
  direct_messages_topic_id?: Integer
  /** Unique identifier for the chat where the original message was sent (or channel username in the format @channelusername) */
  from_chat_id: Integer | String
  /** Message identifier in the chat specified in from_chat_id */
  message_id: Integer
  /** New start timestamp for the copied video in the message */
  video_start_timestamp?: Integer
  /** New caption for media, 0-1024 characters after entities parsing. If not specified, the original caption is kept */
  caption?: String
  /** Mode for parsing entities in the new caption. See formatting options for more details. */
  parse_mode?: String
  /** A JSON-serialized list of special entities that appear in the new caption, which can be specified instead of parse_mode */
  caption_entities?: Array<MessageEntity>
  /** Pass True, if the caption must be shown above the message media. Ignored if a new caption isn't specified. */
  show_caption_above_media?: Boolean
  /** Sends the message silently. Users will receive a notification with no sound. */
  disable_notification?: Boolean
  /** Protects the contents of the sent message from forwarding and saving */
  protect_content?: Boolean
  /** Pass True to allow up to 1000 messages per second, ignoring broadcasting limits for a fee of 0.1 Telegram Stars per message. The relevant Stars will be withdrawn from the bot's balance */
  allow_paid_broadcast?: Boolean
  /** A JSON-serialized object containing the parameters of the suggested post to send; for direct messages chats only. If the message is sent as a reply to another suggested post, then that suggested post is automatically declined. */
  suggested_post_parameters?: SuggestedPostParameters
  /** Description of the message to reply to */
  reply_parameters?: ReplyParameters
  /** Additional interface options. A JSON-serialized object for an custom reply keyboard, instructions to remove a reply keyboard or to force a reply from the user */
  reply_markup?: ForceReply
}

/**
 * Use this method to copy messages of any kind. If some of the specified messages can't be found or copied, they are skipped. Service messages, paid media messages, giveaway messages, giveaway winners messages, and invoice messages can't be copied. A quiz MessageId of the sent messages is returned.
 * @see https://core.telegram.org/bots/api#copymessages
 */
export interface CopyMessagesParams {
  /** Unique identifier for the target chat or username of the target channel (in the format @channelusername) */
  chat_id: Integer | String
  /** Unique identifier for the target message thread (topic) of the forum; for forum supergroups only */
  message_thread_id?: Integer
  /** Identifier of the direct messages topic to which the messages will be sent; required if the messages are sent to a direct messages chat */
  direct_messages_topic_id?: Integer
  /** Unique identifier for the chat where the original messages were sent (or channel username in the format @channelusername) */
  from_chat_id: Integer | String
  /** A JSON-serialized list of 1-100 identifiers of messages in the chat from_chat_id to copy. The identifiers must be specified in a strictly increasing order. */
  message_ids: Array<Integer>
  /** Sends the messages silently. Users will receive a notification with no sound. */
  disable_notification?: Boolean
  /** Protects the contents of the sent messages from forwarding and saving */
  protect_content?: Boolean
  /** Pass True to copy the messages without their captions */
  remove_caption?: Boolean
}

/**
 * Use this method to send photos. On success, the sent Message is returned.
 * @see https://core.telegram.org/bots/api#sendphoto
 */
export interface SendPhotoParams {
  /** Unique identifier of the business connection on behalf of which the message will be sent */
  business_connection_id?: String
  /** Unique identifier for the target chat or username of the target channel (in the format @channelusername) */
  chat_id: Integer | String
  /** Unique identifier for the target message thread (topic) of the forum; for forum supergroups only */
  message_thread_id?: Integer
  /** Identifier of the direct messages topic to which the message will be sent; required if the message is sent to a direct messages chat */
  direct_messages_topic_id?: Integer
  /** Photo to send. Pass a file_id as String to send a photo that exists on the Telegram servers (recommended), pass an HTTP URL as a String for Telegram to get a photo from the Internet, or upload a new photo using multipart/form-data. The photo must be at most 10 MB in size. The photo's width and height must not exceed 10000 in total. Width and height ratio must be at most 20. More information on Sending Files » */
  photo: InputFile | String
  /** Photo caption (may also be used when resending photos by file_id), 0-1024 characters after entities parsing */
  caption?: String
  /** Mode for parsing entities in the photo caption. See formatting options for more details. */
  parse_mode?: String
  /** A JSON-serialized list of special entities that appear in the caption, which can be specified instead of parse_mode */
  caption_entities?: Array<MessageEntity>
  /** Pass True, if the caption must be shown above the message media */
  show_caption_above_media?: Boolean
  /** Pass True if the photo needs to be covered with a spoiler animation */
  has_spoiler?: Boolean
  /** Sends the message silently. Users will receive a notification with no sound. */
  disable_notification?: Boolean
  /** Protects the contents of the sent message from forwarding and saving */
  protect_content?: Boolean
  /** Pass True to allow up to 1000 messages per second, ignoring broadcasting limits for a fee of 0.1 Telegram Stars per message. The relevant Stars will be withdrawn from the bot's balance */
  allow_paid_broadcast?: Boolean
  /** Unique identifier of the message effect to be added to the message; for private chats only */
  message_effect_id?: String
  /** A JSON-serialized object containing the parameters of the suggested post to send; for direct messages chats only. If the message is sent as a reply to another suggested post, then that suggested post is automatically declined. */
  suggested_post_parameters?: SuggestedPostParameters
  /** Description of the message to reply to */
  reply_parameters?: ReplyParameters
  /** Additional interface options. A JSON-serialized object for an custom reply keyboard, instructions to remove a reply keyboard or to force a reply from the user */
  reply_markup?: ForceReply
}

/**
 * Use this method to send audio files, if you want Telegram clients to display them in the music player. Your audio must be in the .MP3 or .M4A format. On success, the sent Message is returned. Bots can currently send audio files of up to 50 MB in size, this limit may be changed in the future. For sending voice messages, use the sendVoice method instead.
 * @see https://core.telegram.org/bots/api#sendaudio
 */
export interface SendAudioParams {
  /** Unique identifier of the business connection on behalf of which the message will be sent */
  business_connection_id?: String
  /** Unique identifier for the target chat or username of the target channel (in the format @channelusername) */
  chat_id: Integer | String
  /** Unique identifier for the target message thread (topic) of the forum; for forum supergroups only */
  message_thread_id?: Integer
  /** Identifier of the direct messages topic to which the message will be sent; required if the message is sent to a direct messages chat */
  direct_messages_topic_id?: Integer
  /** Audio file to send. Pass a file_id as String to send an audio file that exists on the Telegram servers (recommended), pass an HTTP URL as a String for Telegram to get an audio file from the Internet, or upload a new one using multipart/form-data. More information on Sending Files » */
  audio: InputFile | String
  /** Audio caption, 0-1024 characters after entities parsing */
  caption?: String
  /** Mode for parsing entities in the audio caption. See formatting options for more details. */
  parse_mode?: String
  /** A JSON-serialized list of special entities that appear in the caption, which can be specified instead of parse_mode */
  caption_entities?: Array<MessageEntity>
  /** Duration of the audio in seconds */
  duration?: Integer
  /** Performer */
  performer?: String
  /** Track name */
  title?: String
  /** Thumbnail of the file sent; can be ignored if thumbnail generation for the file is supported server-side. The thumbnail should be in JPEG format and less than 200 kB in size. A thumbnail's width and height should not exceed 320. Ignored if the file is not uploaded using multipart/form-data. Thumbnails can't be reused and can be only uploaded as a new file, so you can pass "attach://<file_attach_name>" if the thumbnail was uploaded using multipart/form-data under <file_attach_name>. More information on Sending Files » */
  thumbnail?: InputFile | String
  /** Sends the message silently. Users will receive a notification with no sound. */
  disable_notification?: Boolean
  /** Protects the contents of the sent message from forwarding and saving */
  protect_content?: Boolean
  /** Pass True to allow up to 1000 messages per second, ignoring broadcasting limits for a fee of 0.1 Telegram Stars per message. The relevant Stars will be withdrawn from the bot's balance */
  allow_paid_broadcast?: Boolean
  /** Unique identifier of the message effect to be added to the message; for private chats only */
  message_effect_id?: String
  /** A JSON-serialized object containing the parameters of the suggested post to send; for direct messages chats only. If the message is sent as a reply to another suggested post, then that suggested post is automatically declined. */
  suggested_post_parameters?: SuggestedPostParameters
  /** Description of the message to reply to */
  reply_parameters?: ReplyParameters
  /** Additional interface options. A JSON-serialized object for an custom reply keyboard, instructions to remove a reply keyboard or to force a reply from the user */
  reply_markup?: ForceReply
}

/**
 * Use this method to send general files. On success, the sent Message is returned. Bots can currently send files of any type of up to 50 MB in size, this limit may be changed in the future.
 * @see https://core.telegram.org/bots/api#senddocument
 */
export interface SendDocumentParams {
  /** Unique identifier of the business connection on behalf of which the message will be sent */
  business_connection_id?: String
  /** Unique identifier for the target chat or username of the target channel (in the format @channelusername) */
  chat_id: Integer | String
  /** Unique identifier for the target message thread (topic) of the forum; for forum supergroups only */
  message_thread_id?: Integer
  /** Identifier of the direct messages topic to which the message will be sent; required if the message is sent to a direct messages chat */
  direct_messages_topic_id?: Integer
  /** File to send. Pass a file_id as String to send a file that exists on the Telegram servers (recommended), pass an HTTP URL as a String for Telegram to get a file from the Internet, or upload a new one using multipart/form-data. More information on Sending Files » */
  document: InputFile | String
  /** Thumbnail of the file sent; can be ignored if thumbnail generation for the file is supported server-side. The thumbnail should be in JPEG format and less than 200 kB in size. A thumbnail's width and height should not exceed 320. Ignored if the file is not uploaded using multipart/form-data. Thumbnails can't be reused and can be only uploaded as a new file, so you can pass "attach://<file_attach_name>" if the thumbnail was uploaded using multipart/form-data under <file_attach_name>. More information on Sending Files » */
  thumbnail?: InputFile | String
  /** Document caption (may also be used when resending documents by file_id), 0-1024 characters after entities parsing */
  caption?: String
  /** Mode for parsing entities in the document caption. See formatting options for more details. */
  parse_mode?: String
  /** A JSON-serialized list of special entities that appear in the caption, which can be specified instead of parse_mode */
  caption_entities?: Array<MessageEntity>
  /** Disables automatic server-side content type detection for files uploaded using multipart/form-data */
  disable_content_type_detection?: Boolean
  /** Sends the message silently. Users will receive a notification with no sound. */
  disable_notification?: Boolean
  /** Protects the contents of the sent message from forwarding and saving */
  protect_content?: Boolean
  /** Pass True to allow up to 1000 messages per second, ignoring broadcasting limits for a fee of 0.1 Telegram Stars per message. The relevant Stars will be withdrawn from the bot's balance */
  allow_paid_broadcast?: Boolean
  /** Unique identifier of the message effect to be added to the message; for private chats only */
  message_effect_id?: String
  /** A JSON-serialized object containing the parameters of the suggested post to send; for direct messages chats only. If the message is sent as a reply to another suggested post, then that suggested post is automatically declined. */
  suggested_post_parameters?: SuggestedPostParameters
  /** Description of the message to reply to */
  reply_parameters?: ReplyParameters
  /** Additional interface options. A JSON-serialized object for an custom reply keyboard, instructions to remove a reply keyboard or to force a reply from the user */
  reply_markup?: ForceReply
}

/**
 * Use this method to send video files, Telegram clients support MPEG4 videos (other formats may be sent as Message is returned. Bots can currently send video files of up to 50 MB in size, this limit may be changed in the future.
 * @see https://core.telegram.org/bots/api#sendvideo
 */
export interface SendVideoParams {
  /** Unique identifier of the business connection on behalf of which the message will be sent */
  business_connection_id?: String
  /** Unique identifier for the target chat or username of the target channel (in the format @channelusername) */
  chat_id: Integer | String
  /** Unique identifier for the target message thread (topic) of the forum; for forum supergroups only */
  message_thread_id?: Integer
  /** Identifier of the direct messages topic to which the message will be sent; required if the message is sent to a direct messages chat */
  direct_messages_topic_id?: Integer
  /** Video to send. Pass a file_id as String to send a video that exists on the Telegram servers (recommended), pass an HTTP URL as a String for Telegram to get a video from the Internet, or upload a new video using multipart/form-data. More information on Sending Files » */
  video: InputFile | String
  /** Duration of sent video in seconds */
  duration?: Integer
  /** Video width */
  width?: Integer
  /** Video height */
  height?: Integer
  /** Thumbnail of the file sent; can be ignored if thumbnail generation for the file is supported server-side. The thumbnail should be in JPEG format and less than 200 kB in size. A thumbnail's width and height should not exceed 320. Ignored if the file is not uploaded using multipart/form-data. Thumbnails can't be reused and can be only uploaded as a new file, so you can pass "attach://<file_attach_name>" if the thumbnail was uploaded using multipart/form-data under <file_attach_name>. More information on Sending Files » */
  thumbnail?: InputFile | String
  /** Cover for the video in the message. Pass a file_id to send a file that exists on the Telegram servers (recommended), pass an HTTP URL for Telegram to get a file from the Internet, or pass "attach://<file_attach_name>" to upload a new one using multipart/form-data under <file_attach_name> name. More information on Sending Files » */
  cover?: InputFile | String
  /** Start timestamp for the video in the message */
  start_timestamp?: Integer
  /** Video caption (may also be used when resending videos by file_id), 0-1024 characters after entities parsing */
  caption?: String
  /** Mode for parsing entities in the video caption. See formatting options for more details. */
  parse_mode?: String
  /** A JSON-serialized list of special entities that appear in the caption, which can be specified instead of parse_mode */
  caption_entities?: Array<MessageEntity>
  /** Pass True, if the caption must be shown above the message media */
  show_caption_above_media?: Boolean
  /** Pass True if the video needs to be covered with a spoiler animation */
  has_spoiler?: Boolean
  /** Pass True if the uploaded video is suitable for streaming */
  supports_streaming?: Boolean
  /** Sends the message silently. Users will receive a notification with no sound. */
  disable_notification?: Boolean
  /** Protects the contents of the sent message from forwarding and saving */
  protect_content?: Boolean
  /** Pass True to allow up to 1000 messages per second, ignoring broadcasting limits for a fee of 0.1 Telegram Stars per message. The relevant Stars will be withdrawn from the bot's balance */
  allow_paid_broadcast?: Boolean
  /** Unique identifier of the message effect to be added to the message; for private chats only */
  message_effect_id?: String
  /** A JSON-serialized object containing the parameters of the suggested post to send; for direct messages chats only. If the message is sent as a reply to another suggested post, then that suggested post is automatically declined. */
  suggested_post_parameters?: SuggestedPostParameters
  /** Description of the message to reply to */
  reply_parameters?: ReplyParameters
  /** Additional interface options. A JSON-serialized object for an custom reply keyboard, instructions to remove a reply keyboard or to force a reply from the user */
  reply_markup?: ForceReply
}

/**
 * Use this method to send animation files (GIF or H.264/MPEG-4 AVC video without sound). On success, the sent Message is returned. Bots can currently send animation files of up to 50 MB in size, this limit may be changed in the future.
 * @see https://core.telegram.org/bots/api#sendanimation
 */
export interface SendAnimationParams {
  /** Unique identifier of the business connection on behalf of which the message will be sent */
  business_connection_id?: String
  /** Unique identifier for the target chat or username of the target channel (in the format @channelusername) */
  chat_id: Integer | String
  /** Unique identifier for the target message thread (topic) of the forum; for forum supergroups only */
  message_thread_id?: Integer
  /** Identifier of the direct messages topic to which the message will be sent; required if the message is sent to a direct messages chat */
  direct_messages_topic_id?: Integer
  /** Animation to send. Pass a file_id as String to send an animation that exists on the Telegram servers (recommended), pass an HTTP URL as a String for Telegram to get an animation from the Internet, or upload a new animation using multipart/form-data. More information on Sending Files » */
  animation: InputFile | String
  /** Duration of sent animation in seconds */
  duration?: Integer
  /** Animation width */
  width?: Integer
  /** Animation height */
  height?: Integer
  /** Thumbnail of the file sent; can be ignored if thumbnail generation for the file is supported server-side. The thumbnail should be in JPEG format and less than 200 kB in size. A thumbnail's width and height should not exceed 320. Ignored if the file is not uploaded using multipart/form-data. Thumbnails can't be reused and can be only uploaded as a new file, so you can pass "attach://<file_attach_name>" if the thumbnail was uploaded using multipart/form-data under <file_attach_name>. More information on Sending Files » */
  thumbnail?: InputFile | String
  /** Animation caption (may also be used when resending animation by file_id), 0-1024 characters after entities parsing */
  caption?: String
  /** Mode for parsing entities in the animation caption. See formatting options for more details. */
  parse_mode?: String
  /** A JSON-serialized list of special entities that appear in the caption, which can be specified instead of parse_mode */
  caption_entities?: Array<MessageEntity>
  /** Pass True, if the caption must be shown above the message media */
  show_caption_above_media?: Boolean
  /** Pass True if the animation needs to be covered with a spoiler animation */
  has_spoiler?: Boolean
  /** Sends the message silently. Users will receive a notification with no sound. */
  disable_notification?: Boolean
  /** Protects the contents of the sent message from forwarding and saving */
  protect_content?: Boolean
  /** Pass True to allow up to 1000 messages per second, ignoring broadcasting limits for a fee of 0.1 Telegram Stars per message. The relevant Stars will be withdrawn from the bot's balance */
  allow_paid_broadcast?: Boolean
  /** Unique identifier of the message effect to be added to the message; for private chats only */
  message_effect_id?: String
  /** A JSON-serialized object containing the parameters of the suggested post to send; for direct messages chats only. If the message is sent as a reply to another suggested post, then that suggested post is automatically declined. */
  suggested_post_parameters?: SuggestedPostParameters
  /** Description of the message to reply to */
  reply_parameters?: ReplyParameters
  /** Additional interface options. A JSON-serialized object for an custom reply keyboard, instructions to remove a reply keyboard or to force a reply from the user */
  reply_markup?: ForceReply
}

/**
 * Use this method to send audio files, if you want Telegram clients to display the file as a playable voice message. For this to work, your audio must be in an .OGG file encoded with OPUS, or in .MP3 format, or in .M4A format (other formats may be sent as Message is returned. Bots can currently send voice messages of up to 50 MB in size, this limit may be changed in the future.
 * @see https://core.telegram.org/bots/api#sendvoice
 */
export interface SendVoiceParams {
  /** Unique identifier of the business connection on behalf of which the message will be sent */
  business_connection_id?: String
  /** Unique identifier for the target chat or username of the target channel (in the format @channelusername) */
  chat_id: Integer | String
  /** Unique identifier for the target message thread (topic) of the forum; for forum supergroups only */
  message_thread_id?: Integer
  /** Identifier of the direct messages topic to which the message will be sent; required if the message is sent to a direct messages chat */
  direct_messages_topic_id?: Integer
  /** Audio file to send. Pass a file_id as String to send a file that exists on the Telegram servers (recommended), pass an HTTP URL as a String for Telegram to get a file from the Internet, or upload a new one using multipart/form-data. More information on Sending Files » */
  voice: InputFile | String
  /** Voice message caption, 0-1024 characters after entities parsing */
  caption?: String
  /** Mode for parsing entities in the voice message caption. See formatting options for more details. */
  parse_mode?: String
  /** A JSON-serialized list of special entities that appear in the caption, which can be specified instead of parse_mode */
  caption_entities?: Array<MessageEntity>
  /** Duration of the voice message in seconds */
  duration?: Integer
  /** Sends the message silently. Users will receive a notification with no sound. */
  disable_notification?: Boolean
  /** Protects the contents of the sent message from forwarding and saving */
  protect_content?: Boolean
  /** Pass True to allow up to 1000 messages per second, ignoring broadcasting limits for a fee of 0.1 Telegram Stars per message. The relevant Stars will be withdrawn from the bot's balance */
  allow_paid_broadcast?: Boolean
  /** Unique identifier of the message effect to be added to the message; for private chats only */
  message_effect_id?: String
  /** A JSON-serialized object containing the parameters of the suggested post to send; for direct messages chats only. If the message is sent as a reply to another suggested post, then that suggested post is automatically declined. */
  suggested_post_parameters?: SuggestedPostParameters
  /** Description of the message to reply to */
  reply_parameters?: ReplyParameters
  /** Additional interface options. A JSON-serialized object for an custom reply keyboard, instructions to remove a reply keyboard or to force a reply from the user */
  reply_markup?: ForceReply
}

/**
 * As of Message is returned.
 * @see https://core.telegram.org/bots/api#sendvideonote
 */
export interface SendVideoNoteParams {
  /** Unique identifier of the business connection on behalf of which the message will be sent */
  business_connection_id?: String
  /** Unique identifier for the target chat or username of the target channel (in the format @channelusername) */
  chat_id: Integer | String
  /** Unique identifier for the target message thread (topic) of the forum; for forum supergroups only */
  message_thread_id?: Integer
  /** Identifier of the direct messages topic to which the message will be sent; required if the message is sent to a direct messages chat */
  direct_messages_topic_id?: Integer
  /** Video note to send. Pass a file_id as String to send a video note that exists on the Telegram servers (recommended) or upload a new video using multipart/form-data. More information on Sending Files ». Sending video notes by a URL is currently unsupported */
  video_note: InputFile | String
  /** Duration of sent video in seconds */
  duration?: Integer
  /** Video width and height, i.e. diameter of the video message */
  length?: Integer
  /** Thumbnail of the file sent; can be ignored if thumbnail generation for the file is supported server-side. The thumbnail should be in JPEG format and less than 200 kB in size. A thumbnail's width and height should not exceed 320. Ignored if the file is not uploaded using multipart/form-data. Thumbnails can't be reused and can be only uploaded as a new file, so you can pass "attach://<file_attach_name>" if the thumbnail was uploaded using multipart/form-data under <file_attach_name>. More information on Sending Files » */
  thumbnail?: InputFile | String
  /** Sends the message silently. Users will receive a notification with no sound. */
  disable_notification?: Boolean
  /** Protects the contents of the sent message from forwarding and saving */
  protect_content?: Boolean
  /** Pass True to allow up to 1000 messages per second, ignoring broadcasting limits for a fee of 0.1 Telegram Stars per message. The relevant Stars will be withdrawn from the bot's balance */
  allow_paid_broadcast?: Boolean
  /** Unique identifier of the message effect to be added to the message; for private chats only */
  message_effect_id?: String
  /** A JSON-serialized object containing the parameters of the suggested post to send; for direct messages chats only. If the message is sent as a reply to another suggested post, then that suggested post is automatically declined. */
  suggested_post_parameters?: SuggestedPostParameters
  /** Description of the message to reply to */
  reply_parameters?: ReplyParameters
  /** Additional interface options. A JSON-serialized object for an custom reply keyboard, instructions to remove a reply keyboard or to force a reply from the user */
  reply_markup?: ForceReply
}

/**
 * Use this method to send paid media. On success, the sent Message is returned.
 * @see https://core.telegram.org/bots/api#sendpaidmedia
 */
export interface SendPaidMediaParams {
  /** Unique identifier of the business connection on behalf of which the message will be sent */
  business_connection_id?: String
  /** Unique identifier for the target chat or username of the target channel (in the format @channelusername). If the chat is a channel, all Telegram Star proceeds from this media will be credited to the chat's balance. Otherwise, they will be credited to the bot's balance. */
  chat_id: Integer | String
  /** Unique identifier for the target message thread (topic) of the forum; for forum supergroups only */
  message_thread_id?: Integer
  /** Identifier of the direct messages topic to which the message will be sent; required if the message is sent to a direct messages chat */
  direct_messages_topic_id?: Integer
  /** The number of Telegram Stars that must be paid to buy access to the media; 1-10000 */
  star_count: Integer
  /** A JSON-serialized array describing the media to be sent; up to 10 items */
  media: Array<InputPaidMedia>
  /** Bot-defined paid media payload, 0-128 bytes. This will not be displayed to the user, use it for your internal processes. */
  payload?: String
  /** Media caption, 0-1024 characters after entities parsing */
  caption?: String
  /** Mode for parsing entities in the media caption. See formatting options for more details. */
  parse_mode?: String
  /** A JSON-serialized list of special entities that appear in the caption, which can be specified instead of parse_mode */
  caption_entities?: Array<MessageEntity>
  /** Pass True, if the caption must be shown above the message media */
  show_caption_above_media?: Boolean
  /** Sends the message silently. Users will receive a notification with no sound. */
  disable_notification?: Boolean
  /** Protects the contents of the sent message from forwarding and saving */
  protect_content?: Boolean
  /** Pass True to allow up to 1000 messages per second, ignoring broadcasting limits for a fee of 0.1 Telegram Stars per message. The relevant Stars will be withdrawn from the bot's balance */
  allow_paid_broadcast?: Boolean
  /** A JSON-serialized object containing the parameters of the suggested post to send; for direct messages chats only. If the message is sent as a reply to another suggested post, then that suggested post is automatically declined. */
  suggested_post_parameters?: SuggestedPostParameters
  /** Description of the message to reply to */
  reply_parameters?: ReplyParameters
  /** Additional interface options. A JSON-serialized object for an custom reply keyboard, instructions to remove a reply keyboard or to force a reply from the user */
  reply_markup?: ForceReply
}

/**
 * Use this method to send a group of photos, videos, documents or audios as an album. Documents and audio files can be only grouped in an album with messages of the same type. On success, an array of Message objects that were sent is returned.
 * @see https://core.telegram.org/bots/api#sendmediagroup
 */
export interface SendMediaGroupParams {
  /** Unique identifier of the business connection on behalf of which the message will be sent */
  business_connection_id?: String
  /** Unique identifier for the target chat or username of the target channel (in the format @channelusername) */
  chat_id: Integer | String
  /** Unique identifier for the target message thread (topic) of the forum; for forum supergroups only */
  message_thread_id?: Integer
  /** Identifier of the direct messages topic to which the messages will be sent; required if the messages are sent to a direct messages chat */
  direct_messages_topic_id?: Integer
  /** A JSON-serialized array describing messages to be sent, must include 2-10 items */
  media: Array<InputMediaVideo>
  /** Sends messages silently. Users will receive a notification with no sound. */
  disable_notification?: Boolean
  /** Protects the contents of the sent messages from forwarding and saving */
  protect_content?: Boolean
  /** Pass True to allow up to 1000 messages per second, ignoring broadcasting limits for a fee of 0.1 Telegram Stars per message. The relevant Stars will be withdrawn from the bot's balance */
  allow_paid_broadcast?: Boolean
  /** Unique identifier of the message effect to be added to the message; for private chats only */
  message_effect_id?: String
  /** Description of the message to reply to */
  reply_parameters?: ReplyParameters
}

/**
 * Use this method to send point on the map. On success, the sent Message is returned.
 * @see https://core.telegram.org/bots/api#sendlocation
 */
export interface SendLocationParams {
  /** Unique identifier of the business connection on behalf of which the message will be sent */
  business_connection_id?: String
  /** Unique identifier for the target chat or username of the target channel (in the format @channelusername) */
  chat_id: Integer | String
  /** Unique identifier for the target message thread (topic) of the forum; for forum supergroups only */
  message_thread_id?: Integer
  /** Identifier of the direct messages topic to which the message will be sent; required if the message is sent to a direct messages chat */
  direct_messages_topic_id?: Integer
  /** Latitude of the location */
  latitude: Float
  /** Longitude of the location */
  longitude: Float
  /** The radius of uncertainty for the location, measured in meters; 0-1500 */
  horizontal_accuracy?: Float
  /** Period in seconds during which the location will be updated (see Live Locations, should be between 60 and 86400, or 0x7FFFFFFF for live locations that can be edited indefinitely. */
  live_period?: Integer
  /** For live locations, a direction in which the user is moving, in degrees. Must be between 1 and 360 if specified. */
  heading?: Integer
  /** For live locations, a maximum distance for proximity alerts about approaching another chat member, in meters. Must be between 1 and 100000 if specified. */
  proximity_alert_radius?: Integer
  /** Sends the message silently. Users will receive a notification with no sound. */
  disable_notification?: Boolean
  /** Protects the contents of the sent message from forwarding and saving */
  protect_content?: Boolean
  /** Pass True to allow up to 1000 messages per second, ignoring broadcasting limits for a fee of 0.1 Telegram Stars per message. The relevant Stars will be withdrawn from the bot's balance */
  allow_paid_broadcast?: Boolean
  /** Unique identifier of the message effect to be added to the message; for private chats only */
  message_effect_id?: String
  /** A JSON-serialized object containing the parameters of the suggested post to send; for direct messages chats only. If the message is sent as a reply to another suggested post, then that suggested post is automatically declined. */
  suggested_post_parameters?: SuggestedPostParameters
  /** Description of the message to reply to */
  reply_parameters?: ReplyParameters
  /** Additional interface options. A JSON-serialized object for an custom reply keyboard, instructions to remove a reply keyboard or to force a reply from the user */
  reply_markup?: ForceReply
}

/**
 * Use this method to send information about a venue. On success, the sent Message is returned.
 * @see https://core.telegram.org/bots/api#sendvenue
 */
export interface SendVenueParams {
  /** Unique identifier of the business connection on behalf of which the message will be sent */
  business_connection_id?: String
  /** Unique identifier for the target chat or username of the target channel (in the format @channelusername) */
  chat_id: Integer | String
  /** Unique identifier for the target message thread (topic) of the forum; for forum supergroups only */
  message_thread_id?: Integer
  /** Identifier of the direct messages topic to which the message will be sent; required if the message is sent to a direct messages chat */
  direct_messages_topic_id?: Integer
  /** Latitude of the venue */
  latitude: Float
  /** Longitude of the venue */
  longitude: Float
  /** Name of the venue */
  title: String
  /** Address of the venue */
  address: String
  /** Foursquare identifier of the venue */
  foursquare_id?: String
  /** Foursquare type of the venue, if known. (For example, "arts_entertainment/default", "arts_entertainment/aquarium" or "food/icecream".) */
  foursquare_type?: String
  /** Google Places identifier of the venue */
  google_place_id?: String
  /** Google Places type of the venue. (See supported types.) */
  google_place_type?: String
  /** Sends the message silently. Users will receive a notification with no sound. */
  disable_notification?: Boolean
  /** Protects the contents of the sent message from forwarding and saving */
  protect_content?: Boolean
  /** Pass True to allow up to 1000 messages per second, ignoring broadcasting limits for a fee of 0.1 Telegram Stars per message. The relevant Stars will be withdrawn from the bot's balance */
  allow_paid_broadcast?: Boolean
  /** Unique identifier of the message effect to be added to the message; for private chats only */
  message_effect_id?: String
  /** A JSON-serialized object containing the parameters of the suggested post to send; for direct messages chats only. If the message is sent as a reply to another suggested post, then that suggested post is automatically declined. */
  suggested_post_parameters?: SuggestedPostParameters
  /** Description of the message to reply to */
  reply_parameters?: ReplyParameters
  /** Additional interface options. A JSON-serialized object for an custom reply keyboard, instructions to remove a reply keyboard or to force a reply from the user */
  reply_markup?: ForceReply
}

/**
 * Use this method to send phone contacts. On success, the sent Message is returned.
 * @see https://core.telegram.org/bots/api#sendcontact
 */
export interface SendContactParams {
  /** Unique identifier of the business connection on behalf of which the message will be sent */
  business_connection_id?: String
  /** Unique identifier for the target chat or username of the target channel (in the format @channelusername) */
  chat_id: Integer | String
  /** Unique identifier for the target message thread (topic) of the forum; for forum supergroups only */
  message_thread_id?: Integer
  /** Identifier of the direct messages topic to which the message will be sent; required if the message is sent to a direct messages chat */
  direct_messages_topic_id?: Integer
  /** Contact's phone number */
  phone_number: String
  /** Contact's first name */
  first_name: String
  /** Contact's last name */
  last_name?: String
  /** Additional data about the contact in the form of a vCard, 0-2048 bytes */
  vcard?: String
  /** Sends the message silently. Users will receive a notification with no sound. */
  disable_notification?: Boolean
  /** Protects the contents of the sent message from forwarding and saving */
  protect_content?: Boolean
  /** Pass True to allow up to 1000 messages per second, ignoring broadcasting limits for a fee of 0.1 Telegram Stars per message. The relevant Stars will be withdrawn from the bot's balance */
  allow_paid_broadcast?: Boolean
  /** Unique identifier of the message effect to be added to the message; for private chats only */
  message_effect_id?: String
  /** A JSON-serialized object containing the parameters of the suggested post to send; for direct messages chats only. If the message is sent as a reply to another suggested post, then that suggested post is automatically declined. */
  suggested_post_parameters?: SuggestedPostParameters
  /** Description of the message to reply to */
  reply_parameters?: ReplyParameters
  /** Additional interface options. A JSON-serialized object for an custom reply keyboard, instructions to remove a reply keyboard or to force a reply from the user */
  reply_markup?: ForceReply
}

/**
 * Use this method to send a native poll. On success, the sent Message is returned.
 * @see https://core.telegram.org/bots/api#sendpoll
 */
export interface SendPollParams {
  /** Unique identifier of the business connection on behalf of which the message will be sent */
  business_connection_id?: String
  /** Unique identifier for the target chat or username of the target channel (in the format @channelusername). Polls can't be sent to channel direct messages chats. */
  chat_id: Integer | String
  /** Unique identifier for the target message thread (topic) of the forum; for forum supergroups only */
  message_thread_id?: Integer
  /** Poll question, 1-300 characters */
  question: String
  /** Mode for parsing entities in the question. See formatting options for more details. Currently, only custom emoji entities are allowed */
  question_parse_mode?: String
  /** A JSON-serialized list of special entities that appear in the poll question. It can be specified instead of question_parse_mode */
  question_entities?: Array<MessageEntity>
  /** A JSON-serialized list of 2-12 answer options */
  options: Array<InputPollOption>
  /** True, if the poll needs to be anonymous, defaults to True */
  is_anonymous?: Boolean
  /** Poll type, "quiz" or "regular", defaults to "regular" */
  type?: String
  /** True, if the poll allows multiple answers, ignored for polls in quiz mode, defaults to False */
  allows_multiple_answers?: Boolean
  /** 0-based identifier of the correct answer option, required for polls in quiz mode */
  correct_option_id?: Integer
  /** Text that is shown when a user chooses an incorrect answer or taps on the lamp icon in a quiz-style poll, 0-200 characters with at most 2 line feeds after entities parsing */
  explanation?: String
  /** Mode for parsing entities in the explanation. See formatting options for more details. */
  explanation_parse_mode?: String
  /** A JSON-serialized list of special entities that appear in the poll explanation. It can be specified instead of explanation_parse_mode */
  explanation_entities?: Array<MessageEntity>
  /** Amount of time in seconds the poll will be active after creation, 5-600. Can't be used together with close_date. */
  open_period?: Integer
  /** Point in time (Unix timestamp) when the poll will be automatically closed. Must be at least 5 and no more than 600 seconds in the future. Can't be used together with open_period. */
  close_date?: Integer
  /** Pass True if the poll needs to be immediately closed. This can be useful for poll preview. */
  is_closed?: Boolean
  /** Sends the message silently. Users will receive a notification with no sound. */
  disable_notification?: Boolean
  /** Protects the contents of the sent message from forwarding and saving */
  protect_content?: Boolean
  /** Pass True to allow up to 1000 messages per second, ignoring broadcasting limits for a fee of 0.1 Telegram Stars per message. The relevant Stars will be withdrawn from the bot's balance */
  allow_paid_broadcast?: Boolean
  /** Unique identifier of the message effect to be added to the message; for private chats only */
  message_effect_id?: String
  /** Description of the message to reply to */
  reply_parameters?: ReplyParameters
  /** Additional interface options. A JSON-serialized object for an custom reply keyboard, instructions to remove a reply keyboard or to force a reply from the user */
  reply_markup?: ForceReply
}

/**
 * Use this method to send a checklist on behalf of a connected business account. On success, the sent Message is returned.
 * @see https://core.telegram.org/bots/api#sendchecklist
 */
export interface SendChecklistParams {
  /** Unique identifier of the business connection on behalf of which the message will be sent */
  business_connection_id: String
  /** Unique identifier for the target chat */
  chat_id: Integer
  /** A JSON-serialized object for the checklist to send */
  checklist: InputChecklist
  /** Sends the message silently. Users will receive a notification with no sound. */
  disable_notification?: Boolean
  /** Protects the contents of the sent message from forwarding and saving */
  protect_content?: Boolean
  /** Unique identifier of the message effect to be added to the message */
  message_effect_id?: String
  /** A JSON-serialized object for description of the message to reply to */
  reply_parameters?: ReplyParameters
  /** A JSON-serialized object for an inline keyboard */
  reply_markup?: InlineKeyboardMarkup
}

/**
 * Use this method to send an animated emoji that will display a random value. On success, the sent Message is returned.
 * @see https://core.telegram.org/bots/api#senddice
 */
export interface SendDiceParams {
  /** Unique identifier of the business connection on behalf of which the message will be sent */
  business_connection_id?: String
  /** Unique identifier for the target chat or username of the target channel (in the format @channelusername) */
  chat_id: Integer | String
  /** Unique identifier for the target message thread (topic) of the forum; for forum supergroups only */
  message_thread_id?: Integer
  /** Identifier of the direct messages topic to which the message will be sent; required if the message is sent to a direct messages chat */
  direct_messages_topic_id?: Integer
  /** Emoji on which the dice throw animation is based. Currently, must be one of "🎲", "🎯", "🏀", "⚽", "🎳", or "🎰". Dice can have values 1-6 for "🎲", "🎯" and "🎳", values 1-5 for "🏀" and "⚽", and values 1-64 for "🎰". Defaults to "🎲" */
  emoji?: String
  /** Sends the message silently. Users will receive a notification with no sound. */
  disable_notification?: Boolean
  /** Protects the contents of the sent message from forwarding */
  protect_content?: Boolean
  /** Pass True to allow up to 1000 messages per second, ignoring broadcasting limits for a fee of 0.1 Telegram Stars per message. The relevant Stars will be withdrawn from the bot's balance */
  allow_paid_broadcast?: Boolean
  /** Unique identifier of the message effect to be added to the message; for private chats only */
  message_effect_id?: String
  /** A JSON-serialized object containing the parameters of the suggested post to send; for direct messages chats only. If the message is sent as a reply to another suggested post, then that suggested post is automatically declined. */
  suggested_post_parameters?: SuggestedPostParameters
  /** Description of the message to reply to */
  reply_parameters?: ReplyParameters
  /** Additional interface options. A JSON-serialized object for an custom reply keyboard, instructions to remove a reply keyboard or to force a reply from the user */
  reply_markup?: ForceReply
}

/**
 * Use this method when you need to tell the user that something is happening on the bot's side. The status is set for 5 seconds or less (when a message arrives from your bot, Telegram clients clear its typing status). Returns True on success. Example: The sendChatAction with action = upload_photo. The user will see a "sending photo" status for the bot. We only recommend using this method when a response from the bot will take a noticeable amount of time to arrive.
 * @see https://core.telegram.org/bots/api#sendchataction
 */
export interface SendChatActionParams {
  /** Unique identifier of the business connection on behalf of which the action will be sent */
  business_connection_id?: String
  /** Unique identifier for the target chat or username of the target supergroup (in the format @supergroupusername). Channel chats and channel direct messages chats aren't supported. */
  chat_id: Integer | String
  /** Unique identifier for the target message thread; for supergroups only */
  message_thread_id?: Integer
  /** Type of action to broadcast. Choose one, depending on what the user is about to receive: typing for video notes. */
  action: String
}

/**
 * Use this method to change the chosen reactions on a message. Service messages of some types can't be reacted to. Automatically forwarded messages from a channel to its discussion group have the same available reactions as messages in the channel. Bots can't use paid reactions. Returns True on success.
 * @see https://core.telegram.org/bots/api#setmessagereaction
 */
export interface SetMessageReactionParams {
  /** Unique identifier for the target chat or username of the target channel (in the format @channelusername) */
  chat_id: Integer | String
  /** Identifier of the target message. If the message belongs to a media group, the reaction is set to the first non-deleted message in the group instead. */
  message_id: Integer
  /** A JSON-serialized list of reaction types to set on the message. Currently, as non-premium users, bots can set up to one reaction per message. A custom emoji reaction can be used if it is either already present on the message or explicitly allowed by chat administrators. Paid reactions can't be used by bots. */
  reaction?: Array<ReactionType>
  /** Pass True to set the reaction with a big animation */
  is_big?: Boolean
}

/**
 * Use this method to get a list of profile pictures for a user. Returns a UserProfilePhotos object.
 * @see https://core.telegram.org/bots/api#getuserprofilephotos
 */
export interface GetUserProfilePhotosParams {
  /** Unique identifier of the target user */
  user_id: Integer
  /** Sequential number of the first photo to be returned. By default, all photos are returned. */
  offset?: Integer
  /** Limits the number of photos to be retrieved. Values between 1-100 are accepted. Defaults to 100. */
  limit?: Integer
}

/**
 * Changes the emoji status for a given user that previously allowed the bot to manage their emoji status via the Mini App method requestEmojiStatusAccess. Returns True on success.
 * @see https://core.telegram.org/bots/api#setuseremojistatus
 */
export interface SetUserEmojiStatusParams {
  /** Unique identifier of the target user */
  user_id: Integer
  /** Custom emoji identifier of the emoji status to set. Pass an empty string to remove the status. */
  emoji_status_custom_emoji_id?: String
  /** Expiration date of the emoji status, if any */
  emoji_status_expiration_date?: Integer
}

/**
 * Use this method to get basic information about a file and prepare it for downloading. For the moment, bots can download files of up to 20MB in size. On success, a getFile again.
 * @see https://core.telegram.org/bots/api#getfile
 */
export interface GetFileParams {
  /** File identifier to get information about */
  file_id: String
}

/**
 * Use this method to ban a user in a group, a supergroup or a channel. In the case of supergroups and channels, the user will not be able to return to the chat on their own using invite links, etc., unless unbanned first. The bot must be an administrator in the chat for this to work and must have the appropriate administrator rights. Returns True on success.
 * @see https://core.telegram.org/bots/api#banchatmember
 */
export interface BanChatMemberParams {
  /** Unique identifier for the target group or username of the target supergroup or channel (in the format @channelusername) */
  chat_id: Integer | String
  /** Unique identifier of the target user */
  user_id: Integer
  /** Date when the user will be unbanned; Unix time. If user is banned for more than 366 days or less than 30 seconds from the current time they are considered to be banned forever. Applied for supergroups and channels only. */
  until_date?: Integer
  /** Pass True to delete all messages from the chat for the user that is being removed. If False, the user will be able to see messages in the group that were sent before the user was removed. Always True for supergroups and channels. */
  revoke_messages?: Boolean
}

/**
 * Use this method to unban a previously banned user in a supergroup or channel. The user will not return to the group or channel automatically, but will be able to join via link, etc. The bot must be an administrator for this to work. By default, this method guarantees that after the call the user is not a member of the chat, but will be able to join it. So if the user is a member of the chat they will also be removed from the chat. If you don't want this, use the parameter only_if_banned. Returns True on success.
 * @see https://core.telegram.org/bots/api#unbanchatmember
 */
export interface UnbanChatMemberParams {
  /** Unique identifier for the target group or username of the target supergroup or channel (in the format @channelusername) */
  chat_id: Integer | String
  /** Unique identifier of the target user */
  user_id: Integer
  /** Do nothing if the user is not banned */
  only_if_banned?: Boolean
}

/**
 * Use this method to restrict a user in a supergroup. The bot must be an administrator in the supergroup for this to work and must have the appropriate administrator rights. Pass True for all permissions to lift restrictions from a user. Returns True on success.
 * @see https://core.telegram.org/bots/api#restrictchatmember
 */
export interface RestrictChatMemberParams {
  /** Unique identifier for the target chat or username of the target supergroup (in the format @supergroupusername) */
  chat_id: Integer | String
  /** Unique identifier of the target user */
  user_id: Integer
  /** A JSON-serialized object for new user permissions */
  permissions: ChatPermissions
  /** Pass True if chat permissions are set independently. Otherwise, the can_send_other_messages and can_add_web_page_previews permissions will imply the can_send_messages, can_send_audios, can_send_documents, can_send_photos, can_send_videos, can_send_video_notes, and can_send_voice_notes permissions; the can_send_polls permission will imply the can_send_messages permission. */
  use_independent_chat_permissions?: Boolean
  /** Date when restrictions will be lifted for the user; Unix time. If user is restricted for more than 366 days or less than 30 seconds from the current time, they are considered to be restricted forever */
  until_date?: Integer
}

/**
 * Use this method to promote or demote a user in a supergroup or a channel. The bot must be an administrator in the chat for this to work and must have the appropriate administrator rights. Pass False for all boolean parameters to demote a user. Returns True on success.
 * @see https://core.telegram.org/bots/api#promotechatmember
 */
export interface PromoteChatMemberParams {
  /** Unique identifier for the target chat or username of the target channel (in the format @channelusername) */
  chat_id: Integer | String
  /** Unique identifier of the target user */
  user_id: Integer
  /** Pass True if the administrator's presence in the chat is hidden */
  is_anonymous?: Boolean
  /** Pass True if the administrator can access the chat event log, get boost list, see hidden supergroup and channel members, report spam messages, ignore slow mode, and send messages to the chat without paying Telegram Stars. Implied by any other administrator privilege. */
  can_manage_chat?: Boolean
  /** Pass True if the administrator can delete messages of other users */
  can_delete_messages?: Boolean
  /** Pass True if the administrator can manage video chats */
  can_manage_video_chats?: Boolean
  /** Pass True if the administrator can restrict, ban or unban chat members, or access supergroup statistics */
  can_restrict_members?: Boolean
  /** Pass True if the administrator can add new administrators with a subset of their own privileges or demote administrators that they have promoted, directly or indirectly (promoted by administrators that were appointed by him) */
  can_promote_members?: Boolean
  /** Pass True if the administrator can change chat title, photo and other settings */
  can_change_info?: Boolean
  /** Pass True if the administrator can invite new users to the chat */
  can_invite_users?: Boolean
  /** Pass True if the administrator can post stories to the chat */
  can_post_stories?: Boolean
  /** Pass True if the administrator can edit stories posted by other users, post stories to the chat page, pin chat stories, and access the chat's story archive */
  can_edit_stories?: Boolean
  /** Pass True if the administrator can delete stories posted by other users */
  can_delete_stories?: Boolean
  /** Pass True if the administrator can post messages in the channel, approve suggested posts, or access channel statistics; for channels only */
  can_post_messages?: Boolean
  /** Pass True if the administrator can edit messages of other users and can pin messages; for channels only */
  can_edit_messages?: Boolean
  /** Pass True if the administrator can pin messages; for supergroups only */
  can_pin_messages?: Boolean
  /** Pass True if the user is allowed to create, rename, close, and reopen forum topics; for supergroups only */
  can_manage_topics?: Boolean
  /** Pass True if the administrator can manage direct messages within the channel and decline suggested posts; for channels only */
  can_manage_direct_messages?: Boolean
}

/**
 * Use this method to set a custom title for an administrator in a supergroup promoted by the bot. Returns True on success.
 * @see https://core.telegram.org/bots/api#setchatadministratorcustomtitle
 */
export interface SetChatAdministratorCustomTitleParams {
  /** Unique identifier for the target chat or username of the target supergroup (in the format @supergroupusername) */
  chat_id: Integer | String
  /** Unique identifier of the target user */
  user_id: Integer
  /** New custom title for the administrator; 0-16 characters, emoji are not allowed */
  custom_title: String
}

/**
 * Use this method to ban a channel chat in a supergroup or a channel. Until the chat is unbanned, the owner of the banned chat won't be able to send messages on behalf of any of their channels. The bot must be an administrator in the supergroup or channel for this to work and must have the appropriate administrator rights. Returns True on success.
 * @see https://core.telegram.org/bots/api#banchatsenderchat
 */
export interface BanChatSenderChatParams {
  /** Unique identifier for the target chat or username of the target channel (in the format @channelusername) */
  chat_id: Integer | String
  /** Unique identifier of the target sender chat */
  sender_chat_id: Integer
}

/**
 * Use this method to unban a previously banned channel chat in a supergroup or channel. The bot must be an administrator for this to work and must have the appropriate administrator rights. Returns True on success.
 * @see https://core.telegram.org/bots/api#unbanchatsenderchat
 */
export interface UnbanChatSenderChatParams {
  /** Unique identifier for the target chat or username of the target channel (in the format @channelusername) */
  chat_id: Integer | String
  /** Unique identifier of the target sender chat */
  sender_chat_id: Integer
}

/**
 * Use this method to set default chat permissions for all members. The bot must be an administrator in the group or a supergroup for this to work and must have the can_restrict_members administrator rights. Returns True on success.
 * @see https://core.telegram.org/bots/api#setchatpermissions
 */
export interface SetChatPermissionsParams {
  /** Unique identifier for the target chat or username of the target supergroup (in the format @supergroupusername) */
  chat_id: Integer | String
  /** A JSON-serialized object for new default chat permissions */
  permissions: ChatPermissions
  /** Pass True if chat permissions are set independently. Otherwise, the can_send_other_messages and can_add_web_page_previews permissions will imply the can_send_messages, can_send_audios, can_send_documents, can_send_photos, can_send_videos, can_send_video_notes, and can_send_voice_notes permissions; the can_send_polls permission will imply the can_send_messages permission. */
  use_independent_chat_permissions?: Boolean
}

/**
 * Use this method to generate a new primary invite link for a chat; any previously generated primary link is revoked. The bot must be an administrator in the chat for this to work and must have the appropriate administrator rights. Returns the new invite link as String on success.
 * @see https://core.telegram.org/bots/api#exportchatinvitelink
 */
export interface ExportChatInviteLinkParams {
  /** Unique identifier for the target chat or username of the target channel (in the format @channelusername) */
  chat_id: Integer | String
}

/**
 * Use this method to create an additional invite link for a chat. The bot must be an administrator in the chat for this to work and must have the appropriate administrator rights. The link can be revoked using the method ChatInviteLink object.
 * @see https://core.telegram.org/bots/api#createchatinvitelink
 */
export interface CreateChatInviteLinkParams {
  /** Unique identifier for the target chat or username of the target channel (in the format @channelusername) */
  chat_id: Integer | String
  /** Invite link name; 0-32 characters */
  name?: String
  /** Point in time (Unix timestamp) when the link will expire */
  expire_date?: Integer
  /** The maximum number of users that can be members of the chat simultaneously after joining the chat via this invite link; 1-99999 */
  member_limit?: Integer
  /** True, if users joining the chat via the link need to be approved by chat administrators. If True, member_limit can't be specified */
  creates_join_request?: Boolean
}

/**
 * Use this method to edit a non-primary invite link created by the bot. The bot must be an administrator in the chat for this to work and must have the appropriate administrator rights. Returns the edited invite link as a ChatInviteLink object.
 * @see https://core.telegram.org/bots/api#editchatinvitelink
 */
export interface EditChatInviteLinkParams {
  /** Unique identifier for the target chat or username of the target channel (in the format @channelusername) */
  chat_id: Integer | String
  /** The invite link to edit */
  invite_link: String
  /** Invite link name; 0-32 characters */
  name?: String
  /** Point in time (Unix timestamp) when the link will expire */
  expire_date?: Integer
  /** The maximum number of users that can be members of the chat simultaneously after joining the chat via this invite link; 1-99999 */
  member_limit?: Integer
  /** True, if users joining the chat via the link need to be approved by chat administrators. If True, member_limit can't be specified */
  creates_join_request?: Boolean
}

/**
 * Use this method to create a ChatInviteLink object.
 * @see https://core.telegram.org/bots/api#createchatsubscriptioninvitelink
 */
export interface CreateChatSubscriptionInviteLinkParams {
  /** Unique identifier for the target channel chat or username of the target channel (in the format @channelusername) */
  chat_id: Integer | String
  /** Invite link name; 0-32 characters */
  name?: String
  /** The number of seconds the subscription will be active for before the next payment. Currently, it must always be 2592000 (30 days). */
  subscription_period: Integer
  /** The amount of Telegram Stars a user must pay initially and after each subsequent subscription period to be a member of the chat; 1-10000 */
  subscription_price: Integer
}

/**
 * Use this method to edit a subscription invite link created by the bot. The bot must have the can_invite_users administrator rights. Returns the edited invite link as a ChatInviteLink object.
 * @see https://core.telegram.org/bots/api#editchatsubscriptioninvitelink
 */
export interface EditChatSubscriptionInviteLinkParams {
  /** Unique identifier for the target chat or username of the target channel (in the format @channelusername) */
  chat_id: Integer | String
  /** The invite link to edit */
  invite_link: String
  /** Invite link name; 0-32 characters */
  name?: String
}

/**
 * Use this method to revoke an invite link created by the bot. If the primary link is revoked, a new link is automatically generated. The bot must be an administrator in the chat for this to work and must have the appropriate administrator rights. Returns the revoked invite link as ChatInviteLink object.
 * @see https://core.telegram.org/bots/api#revokechatinvitelink
 */
export interface RevokeChatInviteLinkParams {
  /** Unique identifier of the target chat or username of the target channel (in the format @channelusername) */
  chat_id: Integer | String
  /** The invite link to revoke */
  invite_link: String
}

/**
 * Use this method to approve a chat join request. The bot must be an administrator in the chat for this to work and must have the can_invite_users administrator right. Returns True on success.
 * @see https://core.telegram.org/bots/api#approvechatjoinrequest
 */
export interface ApproveChatJoinRequestParams {
  /** Unique identifier for the target chat or username of the target channel (in the format @channelusername) */
  chat_id: Integer | String
  /** Unique identifier of the target user */
  user_id: Integer
}

/**
 * Use this method to decline a chat join request. The bot must be an administrator in the chat for this to work and must have the can_invite_users administrator right. Returns True on success.
 * @see https://core.telegram.org/bots/api#declinechatjoinrequest
 */
export interface DeclineChatJoinRequestParams {
  /** Unique identifier for the target chat or username of the target channel (in the format @channelusername) */
  chat_id: Integer | String
  /** Unique identifier of the target user */
  user_id: Integer
}

/**
 * Use this method to set a new profile photo for the chat. Photos can't be changed for private chats. The bot must be an administrator in the chat for this to work and must have the appropriate administrator rights. Returns True on success.
 * @see https://core.telegram.org/bots/api#setchatphoto
 */
export interface SetChatPhotoParams {
  /** Unique identifier for the target chat or username of the target channel (in the format @channelusername) */
  chat_id: Integer | String
  /** New chat photo, uploaded using multipart/form-data */
  photo: InputFile
}

/**
 * Use this method to delete a chat photo. Photos can't be changed for private chats. The bot must be an administrator in the chat for this to work and must have the appropriate administrator rights. Returns True on success.
 * @see https://core.telegram.org/bots/api#deletechatphoto
 */
export interface DeleteChatPhotoParams {
  /** Unique identifier for the target chat or username of the target channel (in the format @channelusername) */
  chat_id: Integer | String
}

/**
 * Use this method to change the title of a chat. Titles can't be changed for private chats. The bot must be an administrator in the chat for this to work and must have the appropriate administrator rights. Returns True on success.
 * @see https://core.telegram.org/bots/api#setchattitle
 */
export interface SetChatTitleParams {
  /** Unique identifier for the target chat or username of the target channel (in the format @channelusername) */
  chat_id: Integer | String
  /** New chat title, 1-128 characters */
  title: String
}

/**
 * Use this method to change the description of a group, a supergroup or a channel. The bot must be an administrator in the chat for this to work and must have the appropriate administrator rights. Returns True on success.
 * @see https://core.telegram.org/bots/api#setchatdescription
 */
export interface SetChatDescriptionParams {
  /** Unique identifier for the target chat or username of the target channel (in the format @channelusername) */
  chat_id: Integer | String
  /** New chat description, 0-255 characters */
  description?: String
}

/**
 * Use this method to add a message to the list of pinned messages in a chat. In private chats and channel direct messages chats, all non-service messages can be pinned. Conversely, the bot must be an administrator with the 'can_pin_messages' right or the 'can_edit_messages' right to pin messages in groups and channels respectively. Returns True on success.
 * @see https://core.telegram.org/bots/api#pinchatmessage
 */
export interface PinChatMessageParams {
  /** Unique identifier of the business connection on behalf of which the message will be pinned */
  business_connection_id?: String
  /** Unique identifier for the target chat or username of the target channel (in the format @channelusername) */
  chat_id: Integer | String
  /** Identifier of a message to pin */
  message_id: Integer
  /** Pass True if it is not necessary to send a notification to all chat members about the new pinned message. Notifications are always disabled in channels and private chats. */
  disable_notification?: Boolean
}

/**
 * Use this method to remove a message from the list of pinned messages in a chat. In private chats and channel direct messages chats, all messages can be unpinned. Conversely, the bot must be an administrator with the 'can_pin_messages' right or the 'can_edit_messages' right to unpin messages in groups and channels respectively. Returns True on success.
 * @see https://core.telegram.org/bots/api#unpinchatmessage
 */
export interface UnpinChatMessageParams {
  /** Unique identifier of the business connection on behalf of which the message will be unpinned */
  business_connection_id?: String
  /** Unique identifier for the target chat or username of the target channel (in the format @channelusername) */
  chat_id: Integer | String
  /** Identifier of the message to unpin. Required if business_connection_id is specified. If not specified, the most recent pinned message (by sending date) will be unpinned. */
  message_id?: Integer
}

/**
 * Use this method to clear the list of pinned messages in a chat. In private chats and channel direct messages chats, no additional rights are required to unpin all pinned messages. Conversely, the bot must be an administrator with the 'can_pin_messages' right or the 'can_edit_messages' right to unpin all pinned messages in groups and channels respectively. Returns True on success.
 * @see https://core.telegram.org/bots/api#unpinallchatmessages
 */
export interface UnpinAllChatMessagesParams {
  /** Unique identifier for the target chat or username of the target channel (in the format @channelusername) */
  chat_id: Integer | String
}

/**
 * Use this method for your bot to leave a group, supergroup or channel. Returns True on success.
 * @see https://core.telegram.org/bots/api#leavechat
 */
export interface LeaveChatParams {
  /** Unique identifier for the target chat or username of the target supergroup or channel (in the format @channelusername). Channel direct messages chats aren't supported; leave the corresponding channel instead. */
  chat_id: Integer | String
}

/**
 * Use this method to get up-to-date information about the chat. Returns a ChatFullInfo object on success.
 * @see https://core.telegram.org/bots/api#getchat
 */
export interface GetChatParams {
  /** Unique identifier for the target chat or username of the target supergroup or channel (in the format @channelusername) */
  chat_id: Integer | String
}

/**
 * Use this method to get a list of administrators in a chat, which aren't bots. Returns an Array of ChatMember objects.
 * @see https://core.telegram.org/bots/api#getchatadministrators
 */
export interface GetChatAdministratorsParams {
  /** Unique identifier for the target chat or username of the target supergroup or channel (in the format @channelusername) */
  chat_id: Integer | String
}

/**
 * Use this method to get the number of members in a chat. Returns Int on success.
 * @see https://core.telegram.org/bots/api#getchatmembercount
 */
export interface GetChatMemberCountParams {
  /** Unique identifier for the target chat or username of the target supergroup or channel (in the format @channelusername) */
  chat_id: Integer | String
}

/**
 * Use this method to get information about a member of a chat. The method is only guaranteed to work for other users if the bot is an administrator in the chat. Returns a ChatMember object on success.
 * @see https://core.telegram.org/bots/api#getchatmember
 */
export interface GetChatMemberParams {
  /** Unique identifier for the target chat or username of the target supergroup or channel (in the format @channelusername) */
  chat_id: Integer | String
  /** Unique identifier of the target user */
  user_id: Integer
}

/**
 * Use this method to set a new group sticker set for a supergroup. The bot must be an administrator in the chat for this to work and must have the appropriate administrator rights. Use the field can_set_sticker_set optionally returned in getChat requests to check if the bot can use this method. Returns True on success.
 * @see https://core.telegram.org/bots/api#setchatstickerset
 */
export interface SetChatStickerSetParams {
  /** Unique identifier for the target chat or username of the target supergroup (in the format @supergroupusername) */
  chat_id: Integer | String
  /** Name of the sticker set to be set as the group sticker set */
  sticker_set_name: String
}

/**
 * Use this method to delete a group sticker set from a supergroup. The bot must be an administrator in the chat for this to work and must have the appropriate administrator rights. Use the field can_set_sticker_set optionally returned in getChat requests to check if the bot can use this method. Returns True on success.
 * @see https://core.telegram.org/bots/api#deletechatstickerset
 */
export interface DeleteChatStickerSetParams {
  /** Unique identifier for the target chat or username of the target supergroup (in the format @supergroupusername) */
  chat_id: Integer | String
}

/**
 * Use this method to get custom emoji stickers, which can be used as a forum topic icon by any user. Requires no parameters. Returns an Array of Sticker objects.
 * @see https://core.telegram.org/bots/api#getforumtopiciconstickers
 */
export type GetForumTopicIconStickersParams = object

/**
 * Use this method to create a topic in a forum supergroup chat. The bot must be an administrator in the chat for this to work and must have the can_manage_topics administrator rights. Returns information about the created topic as a ForumTopic object.
 * @see https://core.telegram.org/bots/api#createforumtopic
 */
export interface CreateForumTopicParams {
  /** Unique identifier for the target chat or username of the target supergroup (in the format @supergroupusername) */
  chat_id: Integer | String
  /** Topic name, 1-128 characters */
  name: String
  /** Color of the topic icon in RGB format. Currently, must be one of 7322096 (0x6FB9F0), 16766590 (0xFFD67E), 13338331 (0xCB86DB), 9367192 (0x8EEE98), 16749490 (0xFF93B2), or 16478047 (0xFB6F5F) */
  icon_color?: Integer
  /** Unique identifier of the custom emoji shown as the topic icon. Use getForumTopicIconStickers to get all allowed custom emoji identifiers. */
  icon_custom_emoji_id?: String
}

/**
 * Use this method to edit name and icon of a topic in a forum supergroup chat. The bot must be an administrator in the chat for this to work and must have the can_manage_topics administrator rights, unless it is the creator of the topic. Returns True on success.
 * @see https://core.telegram.org/bots/api#editforumtopic
 */
export interface EditForumTopicParams {
  /** Unique identifier for the target chat or username of the target supergroup (in the format @supergroupusername) */
  chat_id: Integer | String
  /** Unique identifier for the target message thread of the forum topic */
  message_thread_id: Integer
  /** New topic name, 0-128 characters. If not specified or empty, the current name of the topic will be kept */
  name?: String
  /** New unique identifier of the custom emoji shown as the topic icon. Use getForumTopicIconStickers to get all allowed custom emoji identifiers. Pass an empty string to remove the icon. If not specified, the current icon will be kept */
  icon_custom_emoji_id?: String
}

/**
 * Use this method to close an open topic in a forum supergroup chat. The bot must be an administrator in the chat for this to work and must have the can_manage_topics administrator rights, unless it is the creator of the topic. Returns True on success.
 * @see https://core.telegram.org/bots/api#closeforumtopic
 */
export interface CloseForumTopicParams {
  /** Unique identifier for the target chat or username of the target supergroup (in the format @supergroupusername) */
  chat_id: Integer | String
  /** Unique identifier for the target message thread of the forum topic */
  message_thread_id: Integer
}

/**
 * Use this method to reopen a closed topic in a forum supergroup chat. The bot must be an administrator in the chat for this to work and must have the can_manage_topics administrator rights, unless it is the creator of the topic. Returns True on success.
 * @see https://core.telegram.org/bots/api#reopenforumtopic
 */
export interface ReopenForumTopicParams {
  /** Unique identifier for the target chat or username of the target supergroup (in the format @supergroupusername) */
  chat_id: Integer | String
  /** Unique identifier for the target message thread of the forum topic */
  message_thread_id: Integer
}

/**
 * Use this method to delete a forum topic along with all its messages in a forum supergroup chat. The bot must be an administrator in the chat for this to work and must have the can_delete_messages administrator rights. Returns True on success.
 * @see https://core.telegram.org/bots/api#deleteforumtopic
 */
export interface DeleteForumTopicParams {
  /** Unique identifier for the target chat or username of the target supergroup (in the format @supergroupusername) */
  chat_id: Integer | String
  /** Unique identifier for the target message thread of the forum topic */
  message_thread_id: Integer
}

/**
 * Use this method to clear the list of pinned messages in a forum topic. The bot must be an administrator in the chat for this to work and must have the can_pin_messages administrator right in the supergroup. Returns True on success.
 * @see https://core.telegram.org/bots/api#unpinallforumtopicmessages
 */
export interface UnpinAllForumTopicMessagesParams {
  /** Unique identifier for the target chat or username of the target supergroup (in the format @supergroupusername) */
  chat_id: Integer | String
  /** Unique identifier for the target message thread of the forum topic */
  message_thread_id: Integer
}

/**
 * Use this method to edit the name of the 'General' topic in a forum supergroup chat. The bot must be an administrator in the chat for this to work and must have the can_manage_topics administrator rights. Returns True on success.
 * @see https://core.telegram.org/bots/api#editgeneralforumtopic
 */
export interface EditGeneralForumTopicParams {
  /** Unique identifier for the target chat or username of the target supergroup (in the format @supergroupusername) */
  chat_id: Integer | String
  /** New topic name, 1-128 characters */
  name: String
}

/**
 * Use this method to close an open 'General' topic in a forum supergroup chat. The bot must be an administrator in the chat for this to work and must have the can_manage_topics administrator rights. Returns True on success.
 * @see https://core.telegram.org/bots/api#closegeneralforumtopic
 */
export interface CloseGeneralForumTopicParams {
  /** Unique identifier for the target chat or username of the target supergroup (in the format @supergroupusername) */
  chat_id: Integer | String
}

/**
 * Use this method to reopen a closed 'General' topic in a forum supergroup chat. The bot must be an administrator in the chat for this to work and must have the can_manage_topics administrator rights. The topic will be automatically unhidden if it was hidden. Returns True on success.
 * @see https://core.telegram.org/bots/api#reopengeneralforumtopic
 */
export interface ReopenGeneralForumTopicParams {
  /** Unique identifier for the target chat or username of the target supergroup (in the format @supergroupusername) */
  chat_id: Integer | String
}

/**
 * Use this method to hide the 'General' topic in a forum supergroup chat. The bot must be an administrator in the chat for this to work and must have the can_manage_topics administrator rights. The topic will be automatically closed if it was open. Returns True on success.
 * @see https://core.telegram.org/bots/api#hidegeneralforumtopic
 */
export interface HideGeneralForumTopicParams {
  /** Unique identifier for the target chat or username of the target supergroup (in the format @supergroupusername) */
  chat_id: Integer | String
}

/**
 * Use this method to unhide the 'General' topic in a forum supergroup chat. The bot must be an administrator in the chat for this to work and must have the can_manage_topics administrator rights. Returns True on success.
 * @see https://core.telegram.org/bots/api#unhidegeneralforumtopic
 */
export interface UnhideGeneralForumTopicParams {
  /** Unique identifier for the target chat or username of the target supergroup (in the format @supergroupusername) */
  chat_id: Integer | String
}

/**
 * Use this method to clear the list of pinned messages in a General forum topic. The bot must be an administrator in the chat for this to work and must have the can_pin_messages administrator right in the supergroup. Returns True on success.
 * @see https://core.telegram.org/bots/api#unpinallgeneralforumtopicmessages
 */
export interface UnpinAllGeneralForumTopicMessagesParams {
  /** Unique identifier for the target chat or username of the target supergroup (in the format @supergroupusername) */
  chat_id: Integer | String
}

/**
 * Use this method to send answers to callback queries sent from inline keyboards. The answer will be displayed to the user as a notification at the top of the chat screen or as an alert. On success, True is returned. Alternatively, the user can be redirected to the specified Game URL. For this option to work, you must first create a game for your bot via @BotFather and accept the terms. Otherwise, you may use links like t.me/your_bot?start=XXXX that open your bot with a parameter.
 * @see https://core.telegram.org/bots/api#answercallbackquery
 */
export interface AnswerCallbackQueryParams {
  /** Unique identifier for the query to be answered */
  callback_query_id: String
  /** Text of the notification. If not specified, nothing will be shown to the user, 0-200 characters */
  text?: String
  /** If True, an alert will be shown by the client instead of a notification at the top of the chat screen. Defaults to false. */
  show_alert?: Boolean
  /** URL that will be opened by the user's client. If you have created a callback_game button.  Otherwise, you may use links like t.me/your_bot?start=XXXX that open your bot with a parameter. */
  url?: String
  /** The maximum amount of time in seconds that the result of the callback query may be cached client-side. Telegram apps will support caching starting in version 3.14. Defaults to 0. */
  cache_time?: Integer
}

/**
 * Use this method to get the list of boosts added to a chat by a user. Requires administrator rights in the chat. Returns a UserChatBoosts object.
 * @see https://core.telegram.org/bots/api#getuserchatboosts
 */
export interface GetUserChatBoostsParams {
  /** Unique identifier for the chat or username of the channel (in the format @channelusername) */
  chat_id: Integer | String
  /** Unique identifier of the target user */
  user_id: Integer
}

/**
 * Use this method to get information about the connection of the bot with a business account. Returns a BusinessConnection object on success.
 * @see https://core.telegram.org/bots/api#getbusinessconnection
 */
export interface GetBusinessConnectionParams {
  /** Unique identifier of the business connection */
  business_connection_id: String
}

/**
 * Use this method to change the list of the bot's commands. See this manual for more details about bot commands. Returns True on success.
 * @see https://core.telegram.org/bots/api#setmycommands
 */
export interface SetMyCommandsParams {
  /** A JSON-serialized list of bot commands to be set as the list of the bot's commands. At most 100 commands can be specified. */
  commands: Array<BotCommand>
  /** A JSON-serialized object, describing scope of users for which the commands are relevant. Defaults to BotCommandScopeDefault. */
  scope?: BotCommandScope
  /** A two-letter ISO 639-1 language code. If empty, commands will be applied to all users from the given scope, for whose language there are no dedicated commands */
  language_code?: String
}

/**
 * Use this method to delete the list of the bot's commands for the given scope and user language. After deletion, higher level commands will be shown to affected users. Returns True on success.
 * @see https://core.telegram.org/bots/api#deletemycommands
 */
export interface DeleteMyCommandsParams {
  /** A JSON-serialized object, describing scope of users for which the commands are relevant. Defaults to BotCommandScopeDefault. */
  scope?: BotCommandScope
  /** A two-letter ISO 639-1 language code. If empty, commands will be applied to all users from the given scope, for whose language there are no dedicated commands */
  language_code?: String
}

/**
 * Use this method to get the current list of the bot's commands for the given scope and user language. Returns an Array of BotCommand objects. If commands aren't set, an empty list is returned.
 * @see https://core.telegram.org/bots/api#getmycommands
 */
export interface GetMyCommandsParams {
  /** A JSON-serialized object, describing scope of users. Defaults to BotCommandScopeDefault. */
  scope?: BotCommandScope
  /** A two-letter ISO 639-1 language code or an empty string */
  language_code?: String
}

/**
 * Use this method to change the bot's name. Returns True on success.
 * @see https://core.telegram.org/bots/api#setmyname
 */
export interface SetMyNameParams {
  /** New bot name; 0-64 characters. Pass an empty string to remove the dedicated name for the given language. */
  name?: String
  /** A two-letter ISO 639-1 language code. If empty, the name will be shown to all users for whose language there is no dedicated name. */
  language_code?: String
}

/**
 * Use this method to get the current bot name for the given user language. Returns BotName on success.
 * @see https://core.telegram.org/bots/api#getmyname
 */
export interface GetMyNameParams {
  /** A two-letter ISO 639-1 language code or an empty string */
  language_code?: String
}

/**
 * Use this method to change the bot's description, which is shown in the chat with the bot if the chat is empty. Returns True on success.
 * @see https://core.telegram.org/bots/api#setmydescription
 */
export interface SetMyDescriptionParams {
  /** New bot description; 0-512 characters. Pass an empty string to remove the dedicated description for the given language. */
  description?: String
  /** A two-letter ISO 639-1 language code. If empty, the description will be applied to all users for whose language there is no dedicated description. */
  language_code?: String
}

/**
 * Use this method to get the current bot description for the given user language. Returns BotDescription on success.
 * @see https://core.telegram.org/bots/api#getmydescription
 */
export interface GetMyDescriptionParams {
  /** A two-letter ISO 639-1 language code or an empty string */
  language_code?: String
}

/**
 * Use this method to change the bot's short description, which is shown on the bot's profile page and is sent together with the link when users share the bot. Returns True on success.
 * @see https://core.telegram.org/bots/api#setmyshortdescription
 */
export interface SetMyShortDescriptionParams {
  /** New short description for the bot; 0-120 characters. Pass an empty string to remove the dedicated short description for the given language. */
  short_description?: String
  /** A two-letter ISO 639-1 language code. If empty, the short description will be applied to all users for whose language there is no dedicated short description. */
  language_code?: String
}

/**
 * Use this method to get the current bot short description for the given user language. Returns BotShortDescription on success.
 * @see https://core.telegram.org/bots/api#getmyshortdescription
 */
export interface GetMyShortDescriptionParams {
  /** A two-letter ISO 639-1 language code or an empty string */
  language_code?: String
}

/**
 * Use this method to change the bot's menu button in a private chat, or the default menu button. Returns True on success.
 * @see https://core.telegram.org/bots/api#setchatmenubutton
 */
export interface SetChatMenuButtonParams {
  /** Unique identifier for the target private chat. If not specified, default bot's menu button will be changed */
  chat_id?: Integer
  /** A JSON-serialized object for the bot's new menu button. Defaults to MenuButtonDefault */
  menu_button?: MenuButton
}

/**
 * Use this method to get the current value of the bot's menu button in a private chat, or the default menu button. Returns MenuButton on success.
 * @see https://core.telegram.org/bots/api#getchatmenubutton
 */
export interface GetChatMenuButtonParams {
  /** Unique identifier for the target private chat. If not specified, default bot's menu button will be returned */
  chat_id?: Integer
}

/**
 * Use this method to change the default administrator rights requested by the bot when it's added as an administrator to groups or channels. These rights will be suggested to users, but they are free to modify the list before adding the bot. Returns True on success.
 * @see https://core.telegram.org/bots/api#setmydefaultadministratorrights
 */
export interface SetMyDefaultAdministratorRightsParams {
  /** A JSON-serialized object describing new default administrator rights. If not specified, the default administrator rights will be cleared. */
  rights?: ChatAdministratorRights
  /** Pass True to change the default administrator rights of the bot in channels. Otherwise, the default administrator rights of the bot for groups and supergroups will be changed. */
  for_channels?: Boolean
}

/**
 * Use this method to get the current default administrator rights of the bot. Returns ChatAdministratorRights on success.
 * @see https://core.telegram.org/bots/api#getmydefaultadministratorrights
 */
export interface GetMyDefaultAdministratorRightsParams {
  /** Pass True to get default administrator rights of the bot in channels. Otherwise, default administrator rights of the bot for groups and supergroups will be returned. */
  for_channels?: Boolean
}

/**
 * Returns the list of gifts that can be sent by the bot to users and channel chats. Requires no parameters. Returns a Gifts object.
 * @see https://core.telegram.org/bots/api#getavailablegifts
 */
export type GetAvailableGiftsParams = object

/**
 * Sends a gift to the given user or channel chat. The gift can't be converted to Telegram Stars by the receiver. Returns True on success.
 * @see https://core.telegram.org/bots/api#sendgift
 */
export interface SendGiftParams {
  /** Required if chat_id is not specified. Unique identifier of the target user who will receive the gift. */
  user_id?: Integer
  /** Required if user_id is not specified. Unique identifier for the chat or username of the channel (in the format @channelusername) that will receive the gift. */
  chat_id?: Integer | String
  /** Identifier of the gift */
  gift_id: String
  /** Pass True to pay for the gift upgrade from the bot's balance, thereby making the upgrade free for the receiver */
  pay_for_upgrade?: Boolean
  /** Text that will be shown along with the gift; 0-128 characters */
  text?: String
  /** Mode for parsing entities in the text. See formatting options for more details. Entities other than "bold", "italic", "underline", "strikethrough", "spoiler", and "custom_emoji" are ignored. */
  text_parse_mode?: String
  /** A JSON-serialized list of special entities that appear in the gift text. It can be specified instead of text_parse_mode. Entities other than "bold", "italic", "underline", "strikethrough", "spoiler", and "custom_emoji" are ignored. */
  text_entities?: Array<MessageEntity>
}

/**
 * Gifts a Telegram Premium subscription to the given user. Returns True on success.
 * @see https://core.telegram.org/bots/api#giftpremiumsubscription
 */
export interface GiftPremiumSubscriptionParams {
  /** Unique identifier of the target user who will receive a Telegram Premium subscription */
  user_id: Integer
  /** Number of months the Telegram Premium subscription will be active for the user; must be one of 3, 6, or 12 */
  month_count: Integer
  /** Number of Telegram Stars to pay for the Telegram Premium subscription; must be 1000 for 3 months, 1500 for 6 months, and 2500 for 12 months */
  star_count: Integer
  /** Text that will be shown along with the service message about the subscription; 0-128 characters */
  text?: String
  /** Mode for parsing entities in the text. See formatting options for more details. Entities other than "bold", "italic", "underline", "strikethrough", "spoiler", and "custom_emoji" are ignored. */
  text_parse_mode?: String
  /** A JSON-serialized list of special entities that appear in the gift text. It can be specified instead of text_parse_mode. Entities other than "bold", "italic", "underline", "strikethrough", "spoiler", and "custom_emoji" are ignored. */
  text_entities?: Array<MessageEntity>
}

/**
 * Verifies a user on behalf of the organization which is represented by the bot. Returns True on success.
 * @see https://core.telegram.org/bots/api#verifyuser
 */
export interface VerifyUserParams {
  /** Unique identifier of the target user */
  user_id: Integer
  /** Custom description for the verification; 0-70 characters. Must be empty if the organization isn't allowed to provide a custom verification description. */
  custom_description?: String
}

/**
 * Verifies a chat on behalf of the organization which is represented by the bot. Returns True on success.
 * @see https://core.telegram.org/bots/api#verifychat
 */
export interface VerifyChatParams {
  /** Unique identifier for the target chat or username of the target channel (in the format @channelusername). Channel direct messages chats can't be verified. */
  chat_id: Integer | String
  /** Custom description for the verification; 0-70 characters. Must be empty if the organization isn't allowed to provide a custom verification description. */
  custom_description?: String
}

/**
 * Removes verification from a user who is currently verified on behalf of the organization represented by the bot. Returns True on success.
 * @see https://core.telegram.org/bots/api#removeuserverification
 */
export interface RemoveUserVerificationParams {
  /** Unique identifier of the target user */
  user_id: Integer
}

/**
 * Removes verification from a chat that is currently verified on behalf of the organization represented by the bot. Returns True on success.
 * @see https://core.telegram.org/bots/api#removechatverification
 */
export interface RemoveChatVerificationParams {
  /** Unique identifier for the target chat or username of the target channel (in the format @channelusername) */
  chat_id: Integer | String
}

/**
 * Marks incoming message as read on behalf of a business account. Requires the can_read_messages business bot right. Returns True on success.
 * @see https://core.telegram.org/bots/api#readbusinessmessage
 */
export interface ReadBusinessMessageParams {
  /** Unique identifier of the business connection on behalf of which to read the message */
  business_connection_id: String
  /** Unique identifier of the chat in which the message was received. The chat must have been active in the last 24 hours. */
  chat_id: Integer
  /** Unique identifier of the message to mark as read */
  message_id: Integer
}

/**
 * Delete messages on behalf of a business account. Requires the can_delete_sent_messages business bot right to delete messages sent by the bot itself, or the can_delete_all_messages business bot right to delete any message. Returns True on success.
 * @see https://core.telegram.org/bots/api#deletebusinessmessages
 */
export interface DeleteBusinessMessagesParams {
  /** Unique identifier of the business connection on behalf of which to delete the messages */
  business_connection_id: String
  /** A JSON-serialized list of 1-100 identifiers of messages to delete. All messages must be from the same chat. See deleteMessage for limitations on which messages can be deleted */
  message_ids: Array<Integer>
}

/**
 * Changes the first and last name of a managed business account. Requires the can_change_name business bot right. Returns True on success.
 * @see https://core.telegram.org/bots/api#setbusinessaccountname
 */
export interface SetBusinessAccountNameParams {
  /** Unique identifier of the business connection */
  business_connection_id: String
  /** The new value of the first name for the business account; 1-64 characters */
  first_name: String
  /** The new value of the last name for the business account; 0-64 characters */
  last_name?: String
}

/**
 * Changes the username of a managed business account. Requires the can_change_username business bot right. Returns True on success.
 * @see https://core.telegram.org/bots/api#setbusinessaccountusername
 */
export interface SetBusinessAccountUsernameParams {
  /** Unique identifier of the business connection */
  business_connection_id: String
  /** The new value of the username for the business account; 0-32 characters */
  username?: String
}

/**
 * Changes the bio of a managed business account. Requires the can_change_bio business bot right. Returns True on success.
 * @see https://core.telegram.org/bots/api#setbusinessaccountbio
 */
export interface SetBusinessAccountBioParams {
  /** Unique identifier of the business connection */
  business_connection_id: String
  /** The new value of the bio for the business account; 0-140 characters */
  bio?: String
}

/**
 * Changes the profile photo of a managed business account. Requires the can_edit_profile_photo business bot right. Returns True on success.
 * @see https://core.telegram.org/bots/api#setbusinessaccountprofilephoto
 */
export interface SetBusinessAccountProfilePhotoParams {
  /** Unique identifier of the business connection */
  business_connection_id: String
  /** The new profile photo to set */
  photo: InputProfilePhoto
  /** Pass True to set the public photo, which will be visible even if the main photo is hidden by the business account's privacy settings. An account can have only one public photo. */
  is_public?: Boolean
}

/**
 * Removes the current profile photo of a managed business account. Requires the can_edit_profile_photo business bot right. Returns True on success.
 * @see https://core.telegram.org/bots/api#removebusinessaccountprofilephoto
 */
export interface RemoveBusinessAccountProfilePhotoParams {
  /** Unique identifier of the business connection */
  business_connection_id: String
  /** Pass True to remove the public photo, which is visible even if the main photo is hidden by the business account's privacy settings. After the main photo is removed, the previous profile photo (if present) becomes the main photo. */
  is_public?: Boolean
}

/**
 * Changes the privacy settings pertaining to incoming gifts in a managed business account. Requires the can_change_gift_settings business bot right. Returns True on success.
 * @see https://core.telegram.org/bots/api#setbusinessaccountgiftsettings
 */
export interface SetBusinessAccountGiftSettingsParams {
  /** Unique identifier of the business connection */
  business_connection_id: String
  /** Pass True, if a button for sending a gift to the user or by the business account must always be shown in the input field */
  show_gift_button: Boolean
  /** Types of gifts accepted by the business account */
  accepted_gift_types: AcceptedGiftTypes
}

/**
 * Returns the amount of Telegram Stars owned by a managed business account. Requires the can_view_gifts_and_stars business bot right. Returns StarAmount on success.
 * @see https://core.telegram.org/bots/api#getbusinessaccountstarbalance
 */
export interface GetBusinessAccountStarBalanceParams {
  /** Unique identifier of the business connection */
  business_connection_id: String
}

/**
 * Transfers Telegram Stars from the business account balance to the bot's balance. Requires the can_transfer_stars business bot right. Returns True on success.
 * @see https://core.telegram.org/bots/api#transferbusinessaccountstars
 */
export interface TransferBusinessAccountStarsParams {
  /** Unique identifier of the business connection */
  business_connection_id: String
  /** Number of Telegram Stars to transfer; 1-10000 */
  star_count: Integer
}

/**
 * Returns the gifts received and owned by a managed business account. Requires the can_view_gifts_and_stars business bot right. Returns OwnedGifts on success.
 * @see https://core.telegram.org/bots/api#getbusinessaccountgifts
 */
export interface GetBusinessAccountGiftsParams {
  /** Unique identifier of the business connection */
  business_connection_id: String
  /** Pass True to exclude gifts that aren't saved to the account's profile page */
  exclude_unsaved?: Boolean
  /** Pass True to exclude gifts that are saved to the account's profile page */
  exclude_saved?: Boolean
  /** Pass True to exclude gifts that can be purchased an unlimited number of times */
  exclude_unlimited?: Boolean
  /** Pass True to exclude gifts that can be purchased a limited number of times */
  exclude_limited?: Boolean
  /** Pass True to exclude unique gifts */
  exclude_unique?: Boolean
  /** Pass True to sort results by gift price instead of send date. Sorting is applied before pagination. */
  sort_by_price?: Boolean
  /** Offset of the first entry to return as received from the previous request; use empty string to get the first chunk of results */
  offset?: String
  /** The maximum number of gifts to be returned; 1-100. Defaults to 100 */
  limit?: Integer
}

/**
 * Converts a given regular gift to Telegram Stars. Requires the can_convert_gifts_to_stars business bot right. Returns True on success.
 * @see https://core.telegram.org/bots/api#convertgifttostars
 */
export interface ConvertGiftToStarsParams {
  /** Unique identifier of the business connection */
  business_connection_id: String
  /** Unique identifier of the regular gift that should be converted to Telegram Stars */
  owned_gift_id: String
}

/**
 * Upgrades a given regular gift to a unique gift. Requires the can_transfer_and_upgrade_gifts business bot right. Additionally requires the can_transfer_stars business bot right if the upgrade is paid. Returns True on success.
 * @see https://core.telegram.org/bots/api#upgradegift
 */
export interface UpgradeGiftParams {
  /** Unique identifier of the business connection */
  business_connection_id: String
  /** Unique identifier of the regular gift that should be upgraded to a unique one */
  owned_gift_id: String
  /** Pass True to keep the original gift text, sender and receiver in the upgraded gift */
  keep_original_details?: Boolean
  /** The amount of Telegram Stars that will be paid for the upgrade from the business account balance. If gift.prepaid_upgrade_star_count > 0, then pass 0, otherwise, the can_transfer_stars business bot right is required and gift.upgrade_star_count must be passed. */
  star_count?: Integer
}

/**
 * Transfers an owned unique gift to another user. Requires the can_transfer_and_upgrade_gifts business bot right. Requires can_transfer_stars business bot right if the transfer is paid. Returns True on success.
 * @see https://core.telegram.org/bots/api#transfergift
 */
export interface TransferGiftParams {
  /** Unique identifier of the business connection */
  business_connection_id: String
  /** Unique identifier of the regular gift that should be transferred */
  owned_gift_id: String
  /** Unique identifier of the chat which will own the gift. The chat must be active in the last 24 hours. */
  new_owner_chat_id: Integer
  /** The amount of Telegram Stars that will be paid for the transfer from the business account balance. If positive, then the can_transfer_stars business bot right is required. */
  star_count?: Integer
}

/**
 * Posts a story on behalf of a managed business account. Requires the can_manage_stories business bot right. Returns Story on success.
 * @see https://core.telegram.org/bots/api#poststory
 */
export interface PostStoryParams {
  /** Unique identifier of the business connection */
  business_connection_id: String
  /** Content of the story */
  content: InputStoryContent
  /** Period after which the story is moved to the archive, in seconds; must be one of 6 * 3600, 12 * 3600, 86400, or 2 * 86400 */
  active_period: Integer
  /** Caption of the story, 0-2048 characters after entities parsing */
  caption?: String
  /** Mode for parsing entities in the story caption. See formatting options for more details. */
  parse_mode?: String
  /** A JSON-serialized list of special entities that appear in the caption, which can be specified instead of parse_mode */
  caption_entities?: Array<MessageEntity>
  /** A JSON-serialized list of clickable areas to be shown on the story */
  areas?: Array<StoryArea>
  /** Pass True to keep the story accessible after it expires */
  post_to_chat_page?: Boolean
  /** Pass True if the content of the story must be protected from forwarding and screenshotting */
  protect_content?: Boolean
}

/**
 * Edits a story previously posted by the bot on behalf of a managed business account. Requires the can_manage_stories business bot right. Returns Story on success.
 * @see https://core.telegram.org/bots/api#editstory
 */
export interface EditStoryParams {
  /** Unique identifier of the business connection */
  business_connection_id: String
  /** Unique identifier of the story to edit */
  story_id: Integer
  /** Content of the story */
  content: InputStoryContent
  /** Caption of the story, 0-2048 characters after entities parsing */
  caption?: String
  /** Mode for parsing entities in the story caption. See formatting options for more details. */
  parse_mode?: String
  /** A JSON-serialized list of special entities that appear in the caption, which can be specified instead of parse_mode */
  caption_entities?: Array<MessageEntity>
  /** A JSON-serialized list of clickable areas to be shown on the story */
  areas?: Array<StoryArea>
}

/**
 * Deletes a story previously posted by the bot on behalf of a managed business account. Requires the can_manage_stories business bot right. Returns True on success.
 * @see https://core.telegram.org/bots/api#deletestory
 */
export interface DeleteStoryParams {
  /** Unique identifier of the business connection */
  business_connection_id: String
  /** Unique identifier of the story to delete */
  story_id: Integer
}

/**
 * Use this method to edit text and Message is returned, otherwise True is returned. Note that business messages that were not sent by the bot and do not contain an inline keyboard can only be edited within 48 hours from the time they were sent.
 * @see https://core.telegram.org/bots/api#editmessagetext
 */
export interface EditMessageTextParams {
  /** Unique identifier of the business connection on behalf of which the message to be edited was sent */
  business_connection_id?: String
  /** Required if inline_message_id is not specified. Unique identifier for the target chat or username of the target channel (in the format @channelusername) */
  chat_id?: Integer | String
  /** Required if inline_message_id is not specified. Identifier of the message to edit */
  message_id?: Integer
  /** Required if chat_id and message_id are not specified. Identifier of the inline message */
  inline_message_id?: String
  /** New text of the message, 1-4096 characters after entities parsing */
  text: String
  /** Mode for parsing entities in the message text. See formatting options for more details. */
  parse_mode?: String
  /** A JSON-serialized list of special entities that appear in message text, which can be specified instead of parse_mode */
  entities?: Array<MessageEntity>
  /** Link preview generation options for the message */
  link_preview_options?: LinkPreviewOptions
  /** A JSON-serialized object for an inline keyboard. */
  reply_markup?: InlineKeyboardMarkup
}

/**
 * Use this method to edit captions of messages. On success, if the edited message is not an inline message, the edited Message is returned, otherwise True is returned. Note that business messages that were not sent by the bot and do not contain an inline keyboard can only be edited within 48 hours from the time they were sent.
 * @see https://core.telegram.org/bots/api#editmessagecaption
 */
export interface EditMessageCaptionParams {
  /** Unique identifier of the business connection on behalf of which the message to be edited was sent */
  business_connection_id?: String
  /** Required if inline_message_id is not specified. Unique identifier for the target chat or username of the target channel (in the format @channelusername) */
  chat_id?: Integer | String
  /** Required if inline_message_id is not specified. Identifier of the message to edit */
  message_id?: Integer
  /** Required if chat_id and message_id are not specified. Identifier of the inline message */
  inline_message_id?: String
  /** New caption of the message, 0-1024 characters after entities parsing */
  caption?: String
  /** Mode for parsing entities in the message caption. See formatting options for more details. */
  parse_mode?: String
  /** A JSON-serialized list of special entities that appear in the caption, which can be specified instead of parse_mode */
  caption_entities?: Array<MessageEntity>
  /** Pass True, if the caption must be shown above the message media. Supported only for animation, photo and video messages. */
  show_caption_above_media?: Boolean
  /** A JSON-serialized object for an inline keyboard. */
  reply_markup?: InlineKeyboardMarkup
}

/**
 * Use this method to edit animation, audio, document, photo, or video messages, or to add media to text messages. If a message is part of a message album, then it can be edited only to an audio for audio albums, only to a document for document albums and to a photo or a video otherwise. When an inline message is edited, a new file can't be uploaded; use a previously uploaded file via its file_id or specify a URL. On success, if the edited message is not an inline message, the edited Message is returned, otherwise True is returned. Note that business messages that were not sent by the bot and do not contain an inline keyboard can only be edited within 48 hours from the time they were sent.
 * @see https://core.telegram.org/bots/api#editmessagemedia
 */
export interface EditMessageMediaParams {
  /** Unique identifier of the business connection on behalf of which the message to be edited was sent */
  business_connection_id?: String
  /** Required if inline_message_id is not specified. Unique identifier for the target chat or username of the target channel (in the format @channelusername) */
  chat_id?: Integer | String
  /** Required if inline_message_id is not specified. Identifier of the message to edit */
  message_id?: Integer
  /** Required if chat_id and message_id are not specified. Identifier of the inline message */
  inline_message_id?: String
  /** A JSON-serialized object for a new media content of the message */
  media: InputMedia
  /** A JSON-serialized object for a new inline keyboard. */
  reply_markup?: InlineKeyboardMarkup
}

/**
 * Use this method to edit live location messages. A location can be edited until its live_period expires or editing is explicitly disabled by a call to Message is returned, otherwise True is returned.
 * @see https://core.telegram.org/bots/api#editmessagelivelocation
 */
export interface EditMessageLiveLocationParams {
  /** Unique identifier of the business connection on behalf of which the message to be edited was sent */
  business_connection_id?: String
  /** Required if inline_message_id is not specified. Unique identifier for the target chat or username of the target channel (in the format @channelusername) */
  chat_id?: Integer | String
  /** Required if inline_message_id is not specified. Identifier of the message to edit */
  message_id?: Integer
  /** Required if chat_id and message_id are not specified. Identifier of the inline message */
  inline_message_id?: String
  /** Latitude of new location */
  latitude: Float
  /** Longitude of new location */
  longitude: Float
  /** New period in seconds during which the location can be updated, starting from the message send date. If 0x7FFFFFFF is specified, then the location can be updated forever. Otherwise, the new value must not exceed the current live_period by more than a day, and the live location expiration date must remain within the next 90 days. If not specified, then live_period remains unchanged */
  live_period?: Integer
  /** The radius of uncertainty for the location, measured in meters; 0-1500 */
  horizontal_accuracy?: Float
  /** Direction in which the user is moving, in degrees. Must be between 1 and 360 if specified. */
  heading?: Integer
  /** The maximum distance for proximity alerts about approaching another chat member, in meters. Must be between 1 and 100000 if specified. */
  proximity_alert_radius?: Integer
  /** A JSON-serialized object for a new inline keyboard. */
  reply_markup?: InlineKeyboardMarkup
}

/**
 * Use this method to stop updating a live location message before live_period expires. On success, if the message is not an inline message, the edited Message is returned, otherwise True is returned.
 * @see https://core.telegram.org/bots/api#stopmessagelivelocation
 */
export interface StopMessageLiveLocationParams {
  /** Unique identifier of the business connection on behalf of which the message to be edited was sent */
  business_connection_id?: String
  /** Required if inline_message_id is not specified. Unique identifier for the target chat or username of the target channel (in the format @channelusername) */
  chat_id?: Integer | String
  /** Required if inline_message_id is not specified. Identifier of the message with live location to stop */
  message_id?: Integer
  /** Required if chat_id and message_id are not specified. Identifier of the inline message */
  inline_message_id?: String
  /** A JSON-serialized object for a new inline keyboard. */
  reply_markup?: InlineKeyboardMarkup
}

/**
 * Use this method to edit a checklist on behalf of a connected business account. On success, the edited Message is returned.
 * @see https://core.telegram.org/bots/api#editmessagechecklist
 */
export interface EditMessageChecklistParams {
  /** Unique identifier of the business connection on behalf of which the message will be sent */
  business_connection_id: String
  /** Unique identifier for the target chat */
  chat_id: Integer
  /** Unique identifier for the target message */
  message_id: Integer
  /** A JSON-serialized object for the new checklist */
  checklist: InputChecklist
  /** A JSON-serialized object for the new inline keyboard for the message */
  reply_markup?: InlineKeyboardMarkup
}

/**
 * Use this method to edit only the reply markup of messages. On success, if the edited message is not an inline message, the edited Message is returned, otherwise True is returned. Note that business messages that were not sent by the bot and do not contain an inline keyboard can only be edited within 48 hours from the time they were sent.
 * @see https://core.telegram.org/bots/api#editmessagereplymarkup
 */
export interface EditMessageReplyMarkupParams {
  /** Unique identifier of the business connection on behalf of which the message to be edited was sent */
  business_connection_id?: String
  /** Required if inline_message_id is not specified. Unique identifier for the target chat or username of the target channel (in the format @channelusername) */
  chat_id?: Integer | String
  /** Required if inline_message_id is not specified. Identifier of the message to edit */
  message_id?: Integer
  /** Required if chat_id and message_id are not specified. Identifier of the inline message */
  inline_message_id?: String
  /** A JSON-serialized object for an inline keyboard. */
  reply_markup?: InlineKeyboardMarkup
}

/**
 * Use this method to stop a poll which was sent by the bot. On success, the stopped Poll is returned.
 * @see https://core.telegram.org/bots/api#stoppoll
 */
export interface StopPollParams {
  /** Unique identifier of the business connection on behalf of which the message to be edited was sent */
  business_connection_id?: String
  /** Unique identifier for the target chat or username of the target channel (in the format @channelusername) */
  chat_id: Integer | String
  /** Identifier of the original message with the poll */
  message_id: Integer
  /** A JSON-serialized object for a new message inline keyboard. */
  reply_markup?: InlineKeyboardMarkup
}

/**
 * Use this method to approve a suggested post in a direct messages chat. The bot must have the 'can_post_messages' administrator right in the corresponding channel chat. Returns True on success.
 * @see https://core.telegram.org/bots/api#approvesuggestedpost
 */
export interface ApproveSuggestedPostParams {
  /** Unique identifier for the target direct messages chat */
  chat_id: Integer
  /** Identifier of a suggested post message to approve */
  message_id: Integer
  /** Point in time (Unix timestamp) when the post is expected to be published; omit if the date has already been specified when the suggested post was created. If specified, then the date must be not more than 2678400 seconds (30 days) in the future */
  send_date?: Integer
}

/**
 * Use this method to decline a suggested post in a direct messages chat. The bot must have the 'can_manage_direct_messages' administrator right in the corresponding channel chat. Returns True on success.
 * @see https://core.telegram.org/bots/api#declinesuggestedpost
 */
export interface DeclineSuggestedPostParams {
  /** Unique identifier for the target direct messages chat */
  chat_id: Integer
  /** Identifier of a suggested post message to decline */
  message_id: Integer
  /** Comment for the creator of the suggested post; 0-128 characters */
  comment?: String
}

/**
 * Use this method to delete a message, including service messages, with the following limitations: - A message can only be deleted if it was sent less than 48 hours ago. - Service messages about a supergroup, channel, or forum topic creation can't be deleted. - A dice message in a private chat can only be deleted if it was sent more than 24 hours ago. - Bots can delete outgoing messages in private chats, groups, and supergroups. - Bots can delete incoming messages in private chats. - Bots granted can_post_messages permissions can delete outgoing messages in channels. - If the bot is an administrator of a group, it can delete any message there. - If the bot has can_delete_messages administrator right in a supergroup or a channel, it can delete any message there. - If the bot has can_manage_direct_messages administrator right in a channel, it can delete any message in the corresponding direct messages chat. Returns True on success.
 * @see https://core.telegram.org/bots/api#deletemessage
 */
export interface DeleteMessageParams {
  /** Unique identifier for the target chat or username of the target channel (in the format @channelusername) */
  chat_id: Integer | String
  /** Identifier of the message to delete */
  message_id: Integer
}

/**
 * Use this method to delete multiple messages simultaneously. If some of the specified messages can't be found, they are skipped. Returns True on success.
 * @see https://core.telegram.org/bots/api#deletemessages
 */
export interface DeleteMessagesParams {
  /** Unique identifier for the target chat or username of the target channel (in the format @channelusername) */
  chat_id: Integer | String
  /** A JSON-serialized list of 1-100 identifiers of messages to delete. See deleteMessage for limitations on which messages can be deleted */
  message_ids: Array<Integer>
}

/**
 * This object represents a sticker.
 * @see https://core.telegram.org/bots/api#sticker
 */
export interface Sticker {
  /** Identifier for this file, which can be used to download or reuse the file */
  file_id: String
  /** Unique identifier for this file, which is supposed to be the same over time and for different bots. Can't be used to download or reuse the file. */
  file_unique_id: String
  /** Type of the sticker, currently one of "regular", "mask", "custom_emoji". The type of the sticker is independent from its format, which is determined by the fields is_animated and is_video. */
  type: String
  /** Sticker width */
  width: Integer
  /** Sticker height */
  height: Integer
  /** True, if the sticker is animated */
  is_animated: Boolean
  /** True, if the sticker is a video sticker */
  is_video: Boolean
  /** Optional. Sticker thumbnail in the .WEBP or .JPG format */
  thumbnail?: PhotoSize
  /** Optional. Emoji associated with the sticker */
  emoji?: String
  /** Optional. Name of the sticker set to which the sticker belongs */
  set_name?: String
  /** Optional. For premium regular stickers, premium animation for the sticker */
  premium_animation?: File
  /** Optional. For mask stickers, the position where the mask should be placed */
  mask_position?: MaskPosition
  /** Optional. For custom emoji stickers, unique identifier of the custom emoji */
  custom_emoji_id?: String
  /** Optional. True, if the sticker must be repainted to a text color in messages, the color of the Telegram Premium badge in emoji status, white color on chat photos, or another appropriate color in other places */
  needs_repainting?: True
  /** Optional. File size in bytes */
  file_size?: Integer
}

/**
 * This object represents a sticker set.
 * @see https://core.telegram.org/bots/api#stickerset
 */
export interface StickerSet {
  /** Sticker set name */
  name: String
  /** Sticker set title */
  title: String
  /** Type of stickers in the set, currently one of "regular", "mask", "custom_emoji" */
  sticker_type: String
  /** List of all set stickers */
  stickers: Array<Sticker>
  /** Optional. Sticker set thumbnail in the .WEBP, .TGS, or .WEBM format */
  thumbnail?: PhotoSize
}

/**
 * This object describes the position on faces where a mask should be placed by default.
 * @see https://core.telegram.org/bots/api#maskposition
 */
export interface MaskPosition {
  /** The part of the face relative to which the mask should be placed. One of "forehead", "eyes", "mouth", or "chin". */
  point: String
  /** Shift by X-axis measured in widths of the mask scaled to the face size, from left to right. For example, choosing -1.0 will place mask just to the left of the default mask position. */
  x_shift: Float
  /** Shift by Y-axis measured in heights of the mask scaled to the face size, from top to bottom. For example, 1.0 will place the mask just below the default mask position. */
  y_shift: Float
  /** Mask scaling coefficient. For example, 2.0 means double size. */
  scale: Float
}

/**
 * This object describes a sticker to be added to a sticker set.
 * @see https://core.telegram.org/bots/api#inputsticker
 */
export interface InputSticker {
  /** The added sticker. Pass a file_id as a String to send a file that already exists on the Telegram servers, pass an HTTP URL as a String for Telegram to get a file from the Internet, or pass "attach://<file_attach_name>" to upload a new file using multipart/form-data under <file_attach_name> name. Animated and video stickers can't be uploaded via HTTP URL. More information on Sending Files » */
  sticker: String
  /** Format of the added sticker, must be one of "static" for a .WEBP or .PNG image, "animated" for a .TGS animation, "video" for a .WEBM video */
  format: String
  /** List of 1-20 emoji associated with the sticker */
  emoji_list: Array<String>
  /** Optional. Position where the mask should be placed on faces. For "mask" stickers only. */
  mask_position?: MaskPosition
  /** Optional. List of 0-20 search keywords for the sticker with total length of up to 64 characters. For "regular" and "custom_emoji" stickers only. */
  keywords?: Array<String>
}

/**
 * Use this method to send static .WEBP, Message is returned.
 * @see https://core.telegram.org/bots/api#sendsticker
 */
export interface SendStickerParams {
  /** Unique identifier of the business connection on behalf of which the message will be sent */
  business_connection_id?: String
  /** Unique identifier for the target chat or username of the target channel (in the format @channelusername) */
  chat_id: Integer | String
  /** Unique identifier for the target message thread (topic) of the forum; for forum supergroups only */
  message_thread_id?: Integer
  /** Identifier of the direct messages topic to which the message will be sent; required if the message is sent to a direct messages chat */
  direct_messages_topic_id?: Integer
  /** Sticker to send. Pass a file_id as String to send a file that exists on the Telegram servers (recommended), pass an HTTP URL as a String for Telegram to get a .WEBP sticker from the Internet, or upload a new .WEBP, .TGS, or .WEBM sticker using multipart/form-data. More information on Sending Files ». Video and animated stickers can't be sent via an HTTP URL. */
  sticker: InputFile | String
  /** Emoji associated with the sticker; only for just uploaded stickers */
  emoji?: String
  /** Sends the message silently. Users will receive a notification with no sound. */
  disable_notification?: Boolean
  /** Protects the contents of the sent message from forwarding and saving */
  protect_content?: Boolean
  /** Pass True to allow up to 1000 messages per second, ignoring broadcasting limits for a fee of 0.1 Telegram Stars per message. The relevant Stars will be withdrawn from the bot's balance */
  allow_paid_broadcast?: Boolean
  /** Unique identifier of the message effect to be added to the message; for private chats only */
  message_effect_id?: String
  /** A JSON-serialized object containing the parameters of the suggested post to send; for direct messages chats only. If the message is sent as a reply to another suggested post, then that suggested post is automatically declined. */
  suggested_post_parameters?: SuggestedPostParameters
  /** Description of the message to reply to */
  reply_parameters?: ReplyParameters
  /** Additional interface options. A JSON-serialized object for an custom reply keyboard, instructions to remove a reply keyboard or to force a reply from the user */
  reply_markup?: ForceReply
}

/**
 * Use this method to get a sticker set. On success, a StickerSet object is returned.
 * @see https://core.telegram.org/bots/api#getstickerset
 */
export interface GetStickerSetParams {
  /** Name of the sticker set */
  name: String
}

/**
 * Use this method to get information about custom emoji stickers by their identifiers. Returns an Array of Sticker objects.
 * @see https://core.telegram.org/bots/api#getcustomemojistickers
 */
export interface GetCustomEmojiStickersParams {
  /** A JSON-serialized list of custom emoji identifiers. At most 200 custom emoji identifiers can be specified. */
  custom_emoji_ids: Array<String>
}

/**
 * Use this method to upload a file with a sticker for later use in the File on success.
 * @see https://core.telegram.org/bots/api#uploadstickerfile
 */
export interface UploadStickerFileParams {
  /** User identifier of sticker file owner */
  user_id: Integer
  /** A file with the sticker in .WEBP, .PNG, .TGS, or .WEBM format. See More information on Sending Files » */
  sticker: InputFile
  /** Format of the sticker, must be one of "static", "animated", "video" */
  sticker_format: String
}

/**
 * Use this method to create a new sticker set owned by a user. The bot will be able to edit the sticker set thus created. Returns True on success.
 * @see https://core.telegram.org/bots/api#createnewstickerset
 */
export interface CreateNewStickerSetParams {
  /** User identifier of created sticker set owner */
  user_id: Integer
  /** Short name of sticker set, to be used in t.me/addstickers/ URLs (e.g., animals). Can contain only English letters, digits and underscores. Must begin with a letter, can't contain consecutive underscores and must end in "_by_<bot_username>". <bot_username> is case insensitive. 1-64 characters. */
  name: String
  /** Sticker set title, 1-64 characters */
  title: String
  /** A JSON-serialized list of 1-50 initial stickers to be added to the sticker set */
  stickers: Array<InputSticker>
  /** Type of stickers in the set, pass "regular", "mask", or "custom_emoji". By default, a regular sticker set is created. */
  sticker_type?: String
  /** Pass True if stickers in the sticker set must be repainted to the color of text when used in messages, the accent color if used as emoji status, white on chat photos, or another appropriate color based on context; for custom emoji sticker sets only */
  needs_repainting?: Boolean
}

/**
 * Use this method to add a new sticker to a set created by the bot. Emoji sticker sets can have up to 200 stickers. Other sticker sets can have up to 120 stickers. Returns True on success.
 * @see https://core.telegram.org/bots/api#addstickertoset
 */
export interface AddStickerToSetParams {
  /** User identifier of sticker set owner */
  user_id: Integer
  /** Sticker set name */
  name: String
  /** A JSON-serialized object with information about the added sticker. If exactly the same sticker had already been added to the set, then the set isn't changed. */
  sticker: InputSticker
}

/**
 * Use this method to move a sticker in a set created by the bot to a specific position. Returns True on success.
 * @see https://core.telegram.org/bots/api#setstickerpositioninset
 */
export interface SetStickerPositionInSetParams {
  /** File identifier of the sticker */
  sticker: String
  /** New sticker position in the set, zero-based */
  position: Integer
}

/**
 * Use this method to delete a sticker from a set created by the bot. Returns True on success.
 * @see https://core.telegram.org/bots/api#deletestickerfromset
 */
export interface DeleteStickerFromSetParams {
  /** File identifier of the sticker */
  sticker: String
}

/**
 * Use this method to replace an existing sticker in a sticker set with a new one. The method is equivalent to calling setStickerPositionInSet. Returns True on success.
 * @see https://core.telegram.org/bots/api#replacestickerinset
 */
export interface ReplaceStickerInSetParams {
  /** User identifier of the sticker set owner */
  user_id: Integer
  /** Sticker set name */
  name: String
  /** File identifier of the replaced sticker */
  old_sticker: String
  /** A JSON-serialized object with information about the added sticker. If exactly the same sticker had already been added to the set, then the set remains unchanged. */
  sticker: InputSticker
}

/**
 * Use this method to change the list of emoji assigned to a regular or custom emoji sticker. The sticker must belong to a sticker set created by the bot. Returns True on success.
 * @see https://core.telegram.org/bots/api#setstickeremojilist
 */
export interface SetStickerEmojiListParams {
  /** File identifier of the sticker */
  sticker: String
  /** A JSON-serialized list of 1-20 emoji associated with the sticker */
  emoji_list: Array<String>
}

/**
 * Use this method to change search keywords assigned to a regular or custom emoji sticker. The sticker must belong to a sticker set created by the bot. Returns True on success.
 * @see https://core.telegram.org/bots/api#setstickerkeywords
 */
export interface SetStickerKeywordsParams {
  /** File identifier of the sticker */
  sticker: String
  /** A JSON-serialized list of 0-20 search keywords for the sticker with total length of up to 64 characters */
  keywords?: Array<String>
}

/**
 * Use this method to change the mask position of a mask sticker. The sticker must belong to a sticker set that was created by the bot. Returns True on success.
 * @see https://core.telegram.org/bots/api#setstickermaskposition
 */
export interface SetStickerMaskPositionParams {
  /** File identifier of the sticker */
  sticker: String
  /** A JSON-serialized object with the position where the mask should be placed on faces. Omit the parameter to remove the mask position. */
  mask_position?: MaskPosition
}

/**
 * Use this method to set the title of a created sticker set. Returns True on success.
 * @see https://core.telegram.org/bots/api#setstickersettitle
 */
export interface SetStickerSetTitleParams {
  /** Sticker set name */
  name: String
  /** Sticker set title, 1-64 characters */
  title: String
}

/**
 * Use this method to set the thumbnail of a regular or mask sticker set. The format of the thumbnail file must match the format of the stickers in the set. Returns True on success.
 * @see https://core.telegram.org/bots/api#setstickersetthumbnail
 */
export interface SetStickerSetThumbnailParams {
  /** Sticker set name */
  name: String
  /** User identifier of the sticker set owner */
  user_id: Integer
  /** A .WEBP or .PNG image with the thumbnail, must be up to 128 kilobytes in size and have a width and height of exactly 100px, or a .TGS animation with a thumbnail up to 32 kilobytes in size (see More information on Sending Files ». Animated and video sticker set thumbnails can't be uploaded via HTTP URL. If omitted, then the thumbnail is dropped and the first sticker is used as the thumbnail. */
  thumbnail?: InputFile | String
  /** Format of the thumbnail, must be one of "static" for a .WEBP or .PNG image, "animated" for a .TGS animation, or "video" for a .WEBM video */
  format: String
}

/**
 * Use this method to set the thumbnail of a custom emoji sticker set. Returns True on success.
 * @see https://core.telegram.org/bots/api#setcustomemojistickersetthumbnail
 */
export interface SetCustomEmojiStickerSetThumbnailParams {
  /** Sticker set name */
  name: String
  /** Custom emoji identifier of a sticker from the sticker set; pass an empty string to drop the thumbnail and use the first sticker as the thumbnail. */
  custom_emoji_id?: String
}

/**
 * Use this method to delete a sticker set that was created by the bot. Returns True on success.
 * @see https://core.telegram.org/bots/api#deletestickerset
 */
export interface DeleteStickerSetParams {
  /** Sticker set name */
  name: String
}

/**
 * This object represents an incoming inline query. When the user sends an empty query, your bot could return some default or trending results.
 * @see https://core.telegram.org/bots/api#inlinequery
 */
export interface InlineQuery {
  /** Unique identifier for this query */
  id: String
  /** Sender */
  from: User
  /** Text of the query (up to 256 characters) */
  query: String
  /** Offset of the results to be returned, can be controlled by the bot */
  offset: String
  /** Optional. Type of the chat from which the inline query was sent. Can be either "sender" for a private chat with the inline query sender, "private", "group", "supergroup", or "channel". The chat type should be always known for requests sent from official clients and most third-party clients, unless the request was sent from a secret chat */
  chat_type?: String
  /** Optional. Sender location, only for bots that request user location */
  location?: Location
}

/**
 * Use this method to send answers to an inline query. On success, True is returned. No more than 50 results per query are allowed.
 * @see https://core.telegram.org/bots/api#answerinlinequery
 */
export interface AnswerInlineQueryParams {
  /** Unique identifier for the answered query */
  inline_query_id: String
  /** A JSON-serialized array of results for the inline query */
  results: Array<InlineQueryResult>
  /** The maximum amount of time in seconds that the result of the inline query may be cached on the server. Defaults to 300. */
  cache_time?: Integer
  /** Pass True if results may be cached on the server side only for the user that sent the query. By default, results may be returned to any user who sends the same query. */
  is_personal?: Boolean
  /** Pass the offset that a client should send in the next query with the same text to receive more results. Pass an empty string if there are no more results or if you don't support pagination. Offset length can't exceed 64 bytes. */
  next_offset?: String
  /** A JSON-serialized object describing a button to be shown above inline query results */
  button?: InlineQueryResultsButton
}

/**
 * This object represents a button to be shown above inline query results. You must use exactly one of the optional fields.
 * @see https://core.telegram.org/bots/api#inlinequeryresultsbutton
 */
export interface InlineQueryResultsButton {
  /** Label text on the button */
  text: String
  /** Optional. Description of the switchInlineQuery inside the Web App. */
  web_app?: WebAppInfo
  /** Optional. switch_inline button so that the user can easily return to the chat where they wanted to use the bot's inline capabilities. */
  start_parameter?: String
}

/**
 * This object represents one result of an inline query. Telegram clients currently support results of the following 20 types: InlineQueryResultCachedAudio, InlineQueryResultCachedDocument, InlineQueryResultCachedGif, InlineQueryResultCachedMpeg4Gif, InlineQueryResultCachedPhoto, InlineQueryResultCachedSticker, InlineQueryResultCachedVideo, InlineQueryResultCachedVoice, InlineQueryResultArticle, InlineQueryResultAudio, InlineQueryResultContact, InlineQueryResultGame, InlineQueryResultDocument, InlineQueryResultGif, InlineQueryResultLocation, InlineQueryResultMpeg4Gif, InlineQueryResultPhoto, InlineQueryResultVenue, InlineQueryResultVideo, InlineQueryResultVoice Note: All URLs passed in inline query results will be available to end users and therefore must be assumed to be public.
 * @see https://core.telegram.org/bots/api#inlinequeryresult
 */
export type InlineQueryResult =
  | InlineQueryResultCachedAudio
  | InlineQueryResultCachedDocument
  | InlineQueryResultCachedGif
  | InlineQueryResultCachedMpeg4Gif
  | InlineQueryResultCachedPhoto
  | InlineQueryResultCachedSticker
  | InlineQueryResultCachedVideo
  | InlineQueryResultCachedVoice
  | InlineQueryResultArticle
  | InlineQueryResultAudio
  | InlineQueryResultContact
  | InlineQueryResultGame
  | InlineQueryResultDocument
  | InlineQueryResultGif
  | InlineQueryResultLocation
  | InlineQueryResultMpeg4Gif
  | InlineQueryResultPhoto
  | InlineQueryResultVenue
  | InlineQueryResultVideo
  | InlineQueryResultVoice

/**
 * Represents a link to an article or web page.
 * @see https://core.telegram.org/bots/api#inlinequeryresultarticle
 */
export interface InlineQueryResultArticle {
  /** Type of the result, must be article */
  type: String
  /** Unique identifier for this result, 1-64 Bytes */
  id: String
  /** Title of the result */
  title: String
  /** Content of the message to be sent */
  input_message_content: InputMessageContent
  /** Optional. Inline keyboard attached to the message */
  reply_markup?: InlineKeyboardMarkup
  /** Optional. URL of the result */
  url?: String
  /** Optional. Short description of the result */
  description?: String
  /** Optional. Url of the thumbnail for the result */
  thumbnail_url?: String
  /** Optional. Thumbnail width */
  thumbnail_width?: Integer
  /** Optional. Thumbnail height */
  thumbnail_height?: Integer
}

/**
 * Represents a link to a photo. By default, this photo will be sent by the user with optional caption. Alternatively, you can use input_message_content to send a message with the specified content instead of the photo.
 * @see https://core.telegram.org/bots/api#inlinequeryresultphoto
 */
export interface InlineQueryResultPhoto {
  /** Type of the result, must be photo */
  type: String
  /** Unique identifier for this result, 1-64 bytes */
  id: String
  /** A valid URL of the photo. Photo must be in JPEG format. Photo size must not exceed 5MB */
  photo_url: String
  /** URL of the thumbnail for the photo */
  thumbnail_url: String
  /** Optional. Width of the photo */
  photo_width?: Integer
  /** Optional. Height of the photo */
  photo_height?: Integer
  /** Optional. Title for the result */
  title?: String
  /** Optional. Short description of the result */
  description?: String
  /** Optional. Caption of the photo to be sent, 0-1024 characters after entities parsing */
  caption?: String
  /** Optional. Mode for parsing entities in the photo caption. See formatting options for more details. */
  parse_mode?: String
  /** Optional. List of special entities that appear in the caption, which can be specified instead of parse_mode */
  caption_entities?: Array<MessageEntity>
  /** Optional. Pass True, if the caption must be shown above the message media */
  show_caption_above_media?: Boolean
  /** Optional. Inline keyboard attached to the message */
  reply_markup?: InlineKeyboardMarkup
  /** Optional. Content of the message to be sent instead of the photo */
  input_message_content?: InputMessageContent
}

/**
 * Represents a link to an animated GIF file. By default, this animated GIF file will be sent by the user with optional caption. Alternatively, you can use input_message_content to send a message with the specified content instead of the animation.
 * @see https://core.telegram.org/bots/api#inlinequeryresultgif
 */
export interface InlineQueryResultGif {
  /** Type of the result, must be gif */
  type: String
  /** Unique identifier for this result, 1-64 bytes */
  id: String
  /** A valid URL for the GIF file */
  gif_url: String
  /** Optional. Width of the GIF */
  gif_width?: Integer
  /** Optional. Height of the GIF */
  gif_height?: Integer
  /** Optional. Duration of the GIF in seconds */
  gif_duration?: Integer
  /** URL of the static (JPEG or GIF) or animated (MPEG4) thumbnail for the result */
  thumbnail_url: String
  /** Optional. MIME type of the thumbnail, must be one of "image/jpeg", "image/gif", or "video/mp4". Defaults to "image/jpeg" */
  thumbnail_mime_type?: String
  /** Optional. Title for the result */
  title?: String
  /** Optional. Caption of the GIF file to be sent, 0-1024 characters after entities parsing */
  caption?: String
  /** Optional. Mode for parsing entities in the caption. See formatting options for more details. */
  parse_mode?: String
  /** Optional. List of special entities that appear in the caption, which can be specified instead of parse_mode */
  caption_entities?: Array<MessageEntity>
  /** Optional. Pass True, if the caption must be shown above the message media */
  show_caption_above_media?: Boolean
  /** Optional. Inline keyboard attached to the message */
  reply_markup?: InlineKeyboardMarkup
  /** Optional. Content of the message to be sent instead of the GIF animation */
  input_message_content?: InputMessageContent
}

/**
 * Represents a link to a video animation (H.264/MPEG-4 AVC video without sound). By default, this animated MPEG-4 file will be sent by the user with optional caption. Alternatively, you can use input_message_content to send a message with the specified content instead of the animation.
 * @see https://core.telegram.org/bots/api#inlinequeryresultmpeg4gif
 */
export interface InlineQueryResultMpeg4Gif {
  /** Type of the result, must be mpeg4_gif */
  type: String
  /** Unique identifier for this result, 1-64 bytes */
  id: String
  /** A valid URL for the MPEG4 file */
  mpeg4_url: String
  /** Optional. Video width */
  mpeg4_width?: Integer
  /** Optional. Video height */
  mpeg4_height?: Integer
  /** Optional. Video duration in seconds */
  mpeg4_duration?: Integer
  /** URL of the static (JPEG or GIF) or animated (MPEG4) thumbnail for the result */
  thumbnail_url: String
  /** Optional. MIME type of the thumbnail, must be one of "image/jpeg", "image/gif", or "video/mp4". Defaults to "image/jpeg" */
  thumbnail_mime_type?: String
  /** Optional. Title for the result */
  title?: String
  /** Optional. Caption of the MPEG-4 file to be sent, 0-1024 characters after entities parsing */
  caption?: String
  /** Optional. Mode for parsing entities in the caption. See formatting options for more details. */
  parse_mode?: String
  /** Optional. List of special entities that appear in the caption, which can be specified instead of parse_mode */
  caption_entities?: Array<MessageEntity>
  /** Optional. Pass True, if the caption must be shown above the message media */
  show_caption_above_media?: Boolean
  /** Optional. Inline keyboard attached to the message */
  reply_markup?: InlineKeyboardMarkup
  /** Optional. Content of the message to be sent instead of the video animation */
  input_message_content?: InputMessageContent
}

/**
 * Represents a link to a page containing an embedded video player or a video file. By default, this video file will be sent by the user with an optional caption. Alternatively, you can use input_message_content to send a message with the specified content instead of the video. If an InlineQueryResultVideo message contains an embedded video (e.g., YouTube), you must replace its content using input_message_content.
 * @see https://core.telegram.org/bots/api#inlinequeryresultvideo
 */
export interface InlineQueryResultVideo {
  /** Type of the result, must be video */
  type: String
  /** Unique identifier for this result, 1-64 bytes */
  id: String
  /** A valid URL for the embedded video player or video file */
  video_url: String
  /** MIME type of the content of the video URL, "text/html" or "video/mp4" */
  mime_type: String
  /** URL of the thumbnail (JPEG only) for the video */
  thumbnail_url: String
  /** Title for the result */
  title: String
  /** Optional. Caption of the video to be sent, 0-1024 characters after entities parsing */
  caption?: String
  /** Optional. Mode for parsing entities in the video caption. See formatting options for more details. */
  parse_mode?: String
  /** Optional. List of special entities that appear in the caption, which can be specified instead of parse_mode */
  caption_entities?: Array<MessageEntity>
  /** Optional. Pass True, if the caption must be shown above the message media */
  show_caption_above_media?: Boolean
  /** Optional. Video width */
  video_width?: Integer
  /** Optional. Video height */
  video_height?: Integer
  /** Optional. Video duration in seconds */
  video_duration?: Integer
  /** Optional. Short description of the result */
  description?: String
  /** Optional. Inline keyboard attached to the message */
  reply_markup?: InlineKeyboardMarkup
  /** Optional. Content of the message to be sent instead of the video. This field is required if InlineQueryResultVideo is used to send an HTML-page as a result (e.g., a YouTube video). */
  input_message_content?: InputMessageContent
}

/**
 * Represents a link to an MP3 audio file. By default, this audio file will be sent by the user. Alternatively, you can use input_message_content to send a message with the specified content instead of the audio.
 * @see https://core.telegram.org/bots/api#inlinequeryresultaudio
 */
export interface InlineQueryResultAudio {
  /** Type of the result, must be audio */
  type: String
  /** Unique identifier for this result, 1-64 bytes */
  id: String
  /** A valid URL for the audio file */
  audio_url: String
  /** Title */
  title: String
  /** Optional. Caption, 0-1024 characters after entities parsing */
  caption?: String
  /** Optional. Mode for parsing entities in the audio caption. See formatting options for more details. */
  parse_mode?: String
  /** Optional. List of special entities that appear in the caption, which can be specified instead of parse_mode */
  caption_entities?: Array<MessageEntity>
  /** Optional. Performer */
  performer?: String
  /** Optional. Audio duration in seconds */
  audio_duration?: Integer
  /** Optional. Inline keyboard attached to the message */
  reply_markup?: InlineKeyboardMarkup
  /** Optional. Content of the message to be sent instead of the audio */
  input_message_content?: InputMessageContent
}

/**
 * Represents a link to a voice recording in an .OGG container encoded with OPUS. By default, this voice recording will be sent by the user. Alternatively, you can use input_message_content to send a message with the specified content instead of the the voice message.
 * @see https://core.telegram.org/bots/api#inlinequeryresultvoice
 */
export interface InlineQueryResultVoice {
  /** Type of the result, must be voice */
  type: String
  /** Unique identifier for this result, 1-64 bytes */
  id: String
  /** A valid URL for the voice recording */
  voice_url: String
  /** Recording title */
  title: String
  /** Optional. Caption, 0-1024 characters after entities parsing */
  caption?: String
  /** Optional. Mode for parsing entities in the voice message caption. See formatting options for more details. */
  parse_mode?: String
  /** Optional. List of special entities that appear in the caption, which can be specified instead of parse_mode */
  caption_entities?: Array<MessageEntity>
  /** Optional. Recording duration in seconds */
  voice_duration?: Integer
  /** Optional. Inline keyboard attached to the message */
  reply_markup?: InlineKeyboardMarkup
  /** Optional. Content of the message to be sent instead of the voice recording */
  input_message_content?: InputMessageContent
}

/**
 * Represents a link to a file. By default, this file will be sent by the user with an optional caption. Alternatively, you can use input_message_content to send a message with the specified content instead of the file. Currently, only .PDF and .ZIP files can be sent using this method.
 * @see https://core.telegram.org/bots/api#inlinequeryresultdocument
 */
export interface InlineQueryResultDocument {
  /** Type of the result, must be document */
  type: String
  /** Unique identifier for this result, 1-64 bytes */
  id: String
  /** Title for the result */
  title: String
  /** Optional. Caption of the document to be sent, 0-1024 characters after entities parsing */
  caption?: String
  /** Optional. Mode for parsing entities in the document caption. See formatting options for more details. */
  parse_mode?: String
  /** Optional. List of special entities that appear in the caption, which can be specified instead of parse_mode */
  caption_entities?: Array<MessageEntity>
  /** A valid URL for the file */
  document_url: String
  /** MIME type of the content of the file, either "application/pdf" or "application/zip" */
  mime_type: String
  /** Optional. Short description of the result */
  description?: String
  /** Optional. Inline keyboard attached to the message */
  reply_markup?: InlineKeyboardMarkup
  /** Optional. Content of the message to be sent instead of the file */
  input_message_content?: InputMessageContent
  /** Optional. URL of the thumbnail (JPEG only) for the file */
  thumbnail_url?: String
  /** Optional. Thumbnail width */
  thumbnail_width?: Integer
  /** Optional. Thumbnail height */
  thumbnail_height?: Integer
}

/**
 * Represents a location on a map. By default, the location will be sent by the user. Alternatively, you can use input_message_content to send a message with the specified content instead of the location.
 * @see https://core.telegram.org/bots/api#inlinequeryresultlocation
 */
export interface InlineQueryResultLocation {
  /** Type of the result, must be location */
  type: String
  /** Unique identifier for this result, 1-64 Bytes */
  id: String
  /** Location latitude in degrees */
  latitude: Float
  /** Location longitude in degrees */
  longitude: Float
  /** Location title */
  title: String
  /** Optional. The radius of uncertainty for the location, measured in meters; 0-1500 */
  horizontal_accuracy?: Float
  /** Optional. Period in seconds during which the location can be updated, should be between 60 and 86400, or 0x7FFFFFFF for live locations that can be edited indefinitely. */
  live_period?: Integer
  /** Optional. For live locations, a direction in which the user is moving, in degrees. Must be between 1 and 360 if specified. */
  heading?: Integer
  /** Optional. For live locations, a maximum distance for proximity alerts about approaching another chat member, in meters. Must be between 1 and 100000 if specified. */
  proximity_alert_radius?: Integer
  /** Optional. Inline keyboard attached to the message */
  reply_markup?: InlineKeyboardMarkup
  /** Optional. Content of the message to be sent instead of the location */
  input_message_content?: InputMessageContent
  /** Optional. Url of the thumbnail for the result */
  thumbnail_url?: String
  /** Optional. Thumbnail width */
  thumbnail_width?: Integer
  /** Optional. Thumbnail height */
  thumbnail_height?: Integer
}

/**
 * Represents a venue. By default, the venue will be sent by the user. Alternatively, you can use input_message_content to send a message with the specified content instead of the venue.
 * @see https://core.telegram.org/bots/api#inlinequeryresultvenue
 */
export interface InlineQueryResultVenue {
  /** Type of the result, must be venue */
  type: String
  /** Unique identifier for this result, 1-64 Bytes */
  id: String
  /** Latitude of the venue location in degrees */
  latitude: Float
  /** Longitude of the venue location in degrees */
  longitude: Float
  /** Title of the venue */
  title: String
  /** Address of the venue */
  address: String
  /** Optional. Foursquare identifier of the venue if known */
  foursquare_id?: String
  /** Optional. Foursquare type of the venue, if known. (For example, "arts_entertainment/default", "arts_entertainment/aquarium" or "food/icecream".) */
  foursquare_type?: String
  /** Optional. Google Places identifier of the venue */
  google_place_id?: String
  /** Optional. Google Places type of the venue. (See supported types.) */
  google_place_type?: String
  /** Optional. Inline keyboard attached to the message */
  reply_markup?: InlineKeyboardMarkup
  /** Optional. Content of the message to be sent instead of the venue */
  input_message_content?: InputMessageContent
  /** Optional. Url of the thumbnail for the result */
  thumbnail_url?: String
  /** Optional. Thumbnail width */
  thumbnail_width?: Integer
  /** Optional. Thumbnail height */
  thumbnail_height?: Integer
}

/**
 * Represents a contact with a phone number. By default, this contact will be sent by the user. Alternatively, you can use input_message_content to send a message with the specified content instead of the contact.
 * @see https://core.telegram.org/bots/api#inlinequeryresultcontact
 */
export interface InlineQueryResultContact {
  /** Type of the result, must be contact */
  type: String
  /** Unique identifier for this result, 1-64 Bytes */
  id: String
  /** Contact's phone number */
  phone_number: String
  /** Contact's first name */
  first_name: String
  /** Optional. Contact's last name */
  last_name?: String
  /** Optional. Additional data about the contact in the form of a vCard, 0-2048 bytes */
  vcard?: String
  /** Optional. Inline keyboard attached to the message */
  reply_markup?: InlineKeyboardMarkup
  /** Optional. Content of the message to be sent instead of the contact */
  input_message_content?: InputMessageContent
  /** Optional. Url of the thumbnail for the result */
  thumbnail_url?: String
  /** Optional. Thumbnail width */
  thumbnail_width?: Integer
  /** Optional. Thumbnail height */
  thumbnail_height?: Integer
}

/**
 * Represents a Game.
 * @see https://core.telegram.org/bots/api#inlinequeryresultgame
 */
export interface InlineQueryResultGame {
  /** Type of the result, must be game */
  type: String
  /** Unique identifier for this result, 1-64 bytes */
  id: String
  /** Short name of the game */
  game_short_name: String
  /** Optional. Inline keyboard attached to the message */
  reply_markup?: InlineKeyboardMarkup
}

/**
 * Represents a link to a photo stored on the Telegram servers. By default, this photo will be sent by the user with an optional caption. Alternatively, you can use input_message_content to send a message with the specified content instead of the photo.
 * @see https://core.telegram.org/bots/api#inlinequeryresultcachedphoto
 */
export interface InlineQueryResultCachedPhoto {
  /** Type of the result, must be photo */
  type: String
  /** Unique identifier for this result, 1-64 bytes */
  id: String
  /** A valid file identifier of the photo */
  photo_file_id: String
  /** Optional. Title for the result */
  title?: String
  /** Optional. Short description of the result */
  description?: String
  /** Optional. Caption of the photo to be sent, 0-1024 characters after entities parsing */
  caption?: String
  /** Optional. Mode for parsing entities in the photo caption. See formatting options for more details. */
  parse_mode?: String
  /** Optional. List of special entities that appear in the caption, which can be specified instead of parse_mode */
  caption_entities?: Array<MessageEntity>
  /** Optional. Pass True, if the caption must be shown above the message media */
  show_caption_above_media?: Boolean
  /** Optional. Inline keyboard attached to the message */
  reply_markup?: InlineKeyboardMarkup
  /** Optional. Content of the message to be sent instead of the photo */
  input_message_content?: InputMessageContent
}

/**
 * Represents a link to an animated GIF file stored on the Telegram servers. By default, this animated GIF file will be sent by the user with an optional caption. Alternatively, you can use input_message_content to send a message with specified content instead of the animation.
 * @see https://core.telegram.org/bots/api#inlinequeryresultcachedgif
 */
export interface InlineQueryResultCachedGif {
  /** Type of the result, must be gif */
  type: String
  /** Unique identifier for this result, 1-64 bytes */
  id: String
  /** A valid file identifier for the GIF file */
  gif_file_id: String
  /** Optional. Title for the result */
  title?: String
  /** Optional. Caption of the GIF file to be sent, 0-1024 characters after entities parsing */
  caption?: String
  /** Optional. Mode for parsing entities in the caption. See formatting options for more details. */
  parse_mode?: String
  /** Optional. List of special entities that appear in the caption, which can be specified instead of parse_mode */
  caption_entities?: Array<MessageEntity>
  /** Optional. Pass True, if the caption must be shown above the message media */
  show_caption_above_media?: Boolean
  /** Optional. Inline keyboard attached to the message */
  reply_markup?: InlineKeyboardMarkup
  /** Optional. Content of the message to be sent instead of the GIF animation */
  input_message_content?: InputMessageContent
}

/**
 * Represents a link to a video animation (H.264/MPEG-4 AVC video without sound) stored on the Telegram servers. By default, this animated MPEG-4 file will be sent by the user with an optional caption. Alternatively, you can use input_message_content to send a message with the specified content instead of the animation.
 * @see https://core.telegram.org/bots/api#inlinequeryresultcachedmpeg4gif
 */
export interface InlineQueryResultCachedMpeg4Gif {
  /** Type of the result, must be mpeg4_gif */
  type: String
  /** Unique identifier for this result, 1-64 bytes */
  id: String
  /** A valid file identifier for the MPEG4 file */
  mpeg4_file_id: String
  /** Optional. Title for the result */
  title?: String
  /** Optional. Caption of the MPEG-4 file to be sent, 0-1024 characters after entities parsing */
  caption?: String
  /** Optional. Mode for parsing entities in the caption. See formatting options for more details. */
  parse_mode?: String
  /** Optional. List of special entities that appear in the caption, which can be specified instead of parse_mode */
  caption_entities?: Array<MessageEntity>
  /** Optional. Pass True, if the caption must be shown above the message media */
  show_caption_above_media?: Boolean
  /** Optional. Inline keyboard attached to the message */
  reply_markup?: InlineKeyboardMarkup
  /** Optional. Content of the message to be sent instead of the video animation */
  input_message_content?: InputMessageContent
}

/**
 * Represents a link to a sticker stored on the Telegram servers. By default, this sticker will be sent by the user. Alternatively, you can use input_message_content to send a message with the specified content instead of the sticker.
 * @see https://core.telegram.org/bots/api#inlinequeryresultcachedsticker
 */
export interface InlineQueryResultCachedSticker {
  /** Type of the result, must be sticker */
  type: String
  /** Unique identifier for this result, 1-64 bytes */
  id: String
  /** A valid file identifier of the sticker */
  sticker_file_id: String
  /** Optional. Inline keyboard attached to the message */
  reply_markup?: InlineKeyboardMarkup
  /** Optional. Content of the message to be sent instead of the sticker */
  input_message_content?: InputMessageContent
}

/**
 * Represents a link to a file stored on the Telegram servers. By default, this file will be sent by the user with an optional caption. Alternatively, you can use input_message_content to send a message with the specified content instead of the file.
 * @see https://core.telegram.org/bots/api#inlinequeryresultcacheddocument
 */
export interface InlineQueryResultCachedDocument {
  /** Type of the result, must be document */
  type: String
  /** Unique identifier for this result, 1-64 bytes */
  id: String
  /** Title for the result */
  title: String
  /** A valid file identifier for the file */
  document_file_id: String
  /** Optional. Short description of the result */
  description?: String
  /** Optional. Caption of the document to be sent, 0-1024 characters after entities parsing */
  caption?: String
  /** Optional. Mode for parsing entities in the document caption. See formatting options for more details. */
  parse_mode?: String
  /** Optional. List of special entities that appear in the caption, which can be specified instead of parse_mode */
  caption_entities?: Array<MessageEntity>
  /** Optional. Inline keyboard attached to the message */
  reply_markup?: InlineKeyboardMarkup
  /** Optional. Content of the message to be sent instead of the file */
  input_message_content?: InputMessageContent
}

/**
 * Represents a link to a video file stored on the Telegram servers. By default, this video file will be sent by the user with an optional caption. Alternatively, you can use input_message_content to send a message with the specified content instead of the video.
 * @see https://core.telegram.org/bots/api#inlinequeryresultcachedvideo
 */
export interface InlineQueryResultCachedVideo {
  /** Type of the result, must be video */
  type: String
  /** Unique identifier for this result, 1-64 bytes */
  id: String
  /** A valid file identifier for the video file */
  video_file_id: String
  /** Title for the result */
  title: String
  /** Optional. Short description of the result */
  description?: String
  /** Optional. Caption of the video to be sent, 0-1024 characters after entities parsing */
  caption?: String
  /** Optional. Mode for parsing entities in the video caption. See formatting options for more details. */
  parse_mode?: String
  /** Optional. List of special entities that appear in the caption, which can be specified instead of parse_mode */
  caption_entities?: Array<MessageEntity>
  /** Optional. Pass True, if the caption must be shown above the message media */
  show_caption_above_media?: Boolean
  /** Optional. Inline keyboard attached to the message */
  reply_markup?: InlineKeyboardMarkup
  /** Optional. Content of the message to be sent instead of the video */
  input_message_content?: InputMessageContent
}

/**
 * Represents a link to a voice message stored on the Telegram servers. By default, this voice message will be sent by the user. Alternatively, you can use input_message_content to send a message with the specified content instead of the voice message.
 * @see https://core.telegram.org/bots/api#inlinequeryresultcachedvoice
 */
export interface InlineQueryResultCachedVoice {
  /** Type of the result, must be voice */
  type: String
  /** Unique identifier for this result, 1-64 bytes */
  id: String
  /** A valid file identifier for the voice message */
  voice_file_id: String
  /** Voice message title */
  title: String
  /** Optional. Caption, 0-1024 characters after entities parsing */
  caption?: String
  /** Optional. Mode for parsing entities in the voice message caption. See formatting options for more details. */
  parse_mode?: String
  /** Optional. List of special entities that appear in the caption, which can be specified instead of parse_mode */
  caption_entities?: Array<MessageEntity>
  /** Optional. Inline keyboard attached to the message */
  reply_markup?: InlineKeyboardMarkup
  /** Optional. Content of the message to be sent instead of the voice message */
  input_message_content?: InputMessageContent
}

/**
 * Represents a link to an MP3 audio file stored on the Telegram servers. By default, this audio file will be sent by the user. Alternatively, you can use input_message_content to send a message with the specified content instead of the audio.
 * @see https://core.telegram.org/bots/api#inlinequeryresultcachedaudio
 */
export interface InlineQueryResultCachedAudio {
  /** Type of the result, must be audio */
  type: String
  /** Unique identifier for this result, 1-64 bytes */
  id: String
  /** A valid file identifier for the audio file */
  audio_file_id: String
  /** Optional. Caption, 0-1024 characters after entities parsing */
  caption?: String
  /** Optional. Mode for parsing entities in the audio caption. See formatting options for more details. */
  parse_mode?: String
  /** Optional. List of special entities that appear in the caption, which can be specified instead of parse_mode */
  caption_entities?: Array<MessageEntity>
  /** Optional. Inline keyboard attached to the message */
  reply_markup?: InlineKeyboardMarkup
  /** Optional. Content of the message to be sent instead of the audio */
  input_message_content?: InputMessageContent
}

/**
 * This object represents the content of a message to be sent as a result of an inline query. Telegram clients currently support the following 5 types: InputTextMessageContent, InputLocationMessageContent, InputVenueMessageContent, InputContactMessageContent, InputInvoiceMessageContent
 * @see https://core.telegram.org/bots/api#inputmessagecontent
 */
export type InputMessageContent =
  | InputTextMessageContent
  | InputLocationMessageContent
  | InputVenueMessageContent
  | InputContactMessageContent
  | InputInvoiceMessageContent

/**
 * Represents the content of a text message to be sent as the result of an inline query.
 * @see https://core.telegram.org/bots/api#inputtextmessagecontent
 */
export interface InputTextMessageContent {
  /** Text of the message to be sent, 1-4096 characters */
  message_text: String
  /** Optional. Mode for parsing entities in the message text. See formatting options for more details. */
  parse_mode?: String
  /** Optional. List of special entities that appear in message text, which can be specified instead of parse_mode */
  entities?: Array<MessageEntity>
  /** Optional. Link preview generation options for the message */
  link_preview_options?: LinkPreviewOptions
}

/**
 * Represents the content of a location message to be sent as the result of an inline query.
 * @see https://core.telegram.org/bots/api#inputlocationmessagecontent
 */
export interface InputLocationMessageContent {
  /** Latitude of the location in degrees */
  latitude: Float
  /** Longitude of the location in degrees */
  longitude: Float
  /** Optional. The radius of uncertainty for the location, measured in meters; 0-1500 */
  horizontal_accuracy?: Float
  /** Optional. Period in seconds during which the location can be updated, should be between 60 and 86400, or 0x7FFFFFFF for live locations that can be edited indefinitely. */
  live_period?: Integer
  /** Optional. For live locations, a direction in which the user is moving, in degrees. Must be between 1 and 360 if specified. */
  heading?: Integer
  /** Optional. For live locations, a maximum distance for proximity alerts about approaching another chat member, in meters. Must be between 1 and 100000 if specified. */
  proximity_alert_radius?: Integer
}

/**
 * Represents the content of a venue message to be sent as the result of an inline query.
 * @see https://core.telegram.org/bots/api#inputvenuemessagecontent
 */
export interface InputVenueMessageContent {
  /** Latitude of the venue in degrees */
  latitude: Float
  /** Longitude of the venue in degrees */
  longitude: Float
  /** Name of the venue */
  title: String
  /** Address of the venue */
  address: String
  /** Optional. Foursquare identifier of the venue, if known */
  foursquare_id?: String
  /** Optional. Foursquare type of the venue, if known. (For example, "arts_entertainment/default", "arts_entertainment/aquarium" or "food/icecream".) */
  foursquare_type?: String
  /** Optional. Google Places identifier of the venue */
  google_place_id?: String
  /** Optional. Google Places type of the venue. (See supported types.) */
  google_place_type?: String
}

/**
 * Represents the content of a contact message to be sent as the result of an inline query.
 * @see https://core.telegram.org/bots/api#inputcontactmessagecontent
 */
export interface InputContactMessageContent {
  /** Contact's phone number */
  phone_number: String
  /** Contact's first name */
  first_name: String
  /** Optional. Contact's last name */
  last_name?: String
  /** Optional. Additional data about the contact in the form of a vCard, 0-2048 bytes */
  vcard?: String
}

/**
 * Represents the content of an invoice message to be sent as the result of an inline query.
 * @see https://core.telegram.org/bots/api#inputinvoicemessagecontent
 */
export interface InputInvoiceMessageContent {
  /** Product name, 1-32 characters */
  title: String
  /** Product description, 1-255 characters */
  description: String
  /** Bot-defined invoice payload, 1-128 bytes. This will not be displayed to the user, use it for your internal processes. */
  payload: String
  /** Optional. Payment provider token, obtained via Telegram Stars. */
  provider_token?: String
  /** Three-letter ISO 4217 currency code, see Telegram Stars. */
  currency: String
  /** Price breakdown, a JSON-serialized list of components (e.g. product price, tax, discount, delivery cost, delivery tax, bonus, etc.). Must contain exactly one item for payments in Telegram Stars. */
  prices: Array<LabeledPrice>
  /** Optional. The maximum accepted amount for tips in the smallest units of the currency (integer, not float/double). For example, for a maximum tip of US$ 1.45 pass max_tip_amount = 145. See the exp parameter in Telegram Stars. */
  max_tip_amount?: Integer
  /** Optional. A JSON-serialized array of suggested amounts of tip in the smallest units of the currency (integer, not float/double). At most 4 suggested tip amounts can be specified. The suggested tip amounts must be positive, passed in a strictly increased order and must not exceed max_tip_amount. */
  suggested_tip_amounts?: Array<Integer>
  /** Optional. A JSON-serialized object for data about the invoice, which will be shared with the payment provider. A detailed description of the required fields should be provided by the payment provider. */
  provider_data?: String
  /** Optional. URL of the product photo for the invoice. Can be a photo of the goods or a marketing image for a service. */
  photo_url?: String
  /** Optional. Photo size in bytes */
  photo_size?: Integer
  /** Optional. Photo width */
  photo_width?: Integer
  /** Optional. Photo height */
  photo_height?: Integer
  /** Optional. Pass True if you require the user's full name to complete the order. Ignored for payments in Telegram Stars. */
  need_name?: Boolean
  /** Optional. Pass True if you require the user's phone number to complete the order. Ignored for payments in Telegram Stars. */
  need_phone_number?: Boolean
  /** Optional. Pass True if you require the user's email address to complete the order. Ignored for payments in Telegram Stars. */
  need_email?: Boolean
  /** Optional. Pass True if you require the user's shipping address to complete the order. Ignored for payments in Telegram Stars. */
  need_shipping_address?: Boolean
  /** Optional. Pass True if the user's phone number should be sent to the provider. Ignored for payments in Telegram Stars. */
  send_phone_number_to_provider?: Boolean
  /** Optional. Pass True if the user's email address should be sent to the provider. Ignored for payments in Telegram Stars. */
  send_email_to_provider?: Boolean
  /** Optional. Pass True if the final price depends on the shipping method. Ignored for payments in Telegram Stars. */
  is_flexible?: Boolean
}

/**
 * Represents a result of an inline query that was chosen by the user and sent to their chat partner.
 * @see https://core.telegram.org/bots/api#choseninlineresult
 */
export interface ChosenInlineResult {
  /** The unique identifier for the result that was chosen */
  result_id: String
  /** The user that chose the result */
  from: User
  /** Optional. Sender location, only for bots that require user location */
  location?: Location
  /** Optional. Identifier of the sent inline message. Available only if there is an edit the message. */
  inline_message_id?: String
  /** The query that was used to obtain the result */
  query: String
}

/**
 * Use this method to set the result of an interaction with a SentWebAppMessage object is returned.
 * @see https://core.telegram.org/bots/api#answerwebappquery
 */
export interface AnswerWebAppQueryParams {
  /** Unique identifier for the query to be answered */
  web_app_query_id: String
  /** A JSON-serialized object describing the message to be sent */
  result: InlineQueryResult
}

/**
 * Describes an inline message sent by a Web App on behalf of a user.
 * @see https://core.telegram.org/bots/api#sentwebappmessage
 */
export interface SentWebAppMessage {
  /** Optional. Identifier of the sent inline message. Available only if there is an inline keyboard attached to the message. */
  inline_message_id?: String
}

/**
 * Stores a message that can be sent by a user of a Mini App. Returns a PreparedInlineMessage object.
 * @see https://core.telegram.org/bots/api#savepreparedinlinemessage
 */
export interface SavePreparedInlineMessageParams {
  /** Unique identifier of the target user that can use the prepared message */
  user_id: Integer
  /** A JSON-serialized object describing the message to be sent */
  result: InlineQueryResult
  /** Pass True if the message can be sent to private chats with users */
  allow_user_chats?: Boolean
  /** Pass True if the message can be sent to private chats with bots */
  allow_bot_chats?: Boolean
  /** Pass True if the message can be sent to group and supergroup chats */
  allow_group_chats?: Boolean
  /** Pass True if the message can be sent to channel chats */
  allow_channel_chats?: Boolean
}

/**
 * Describes an inline message to be sent by a user of a Mini App.
 * @see https://core.telegram.org/bots/api#preparedinlinemessage
 */
export interface PreparedInlineMessage {
  /** Unique identifier of the prepared message */
  id: String
  /** Expiration date of the prepared message, in Unix time. Expired prepared messages can no longer be used */
  expiration_date: Integer
}

/**
 * Use this method to send invoices. On success, the sent Message is returned.
 * @see https://core.telegram.org/bots/api#sendinvoice
 */
export interface SendInvoiceParams {
  /** Unique identifier for the target chat or username of the target channel (in the format @channelusername) */
  chat_id: Integer | String
  /** Unique identifier for the target message thread (topic) of the forum; for forum supergroups only */
  message_thread_id?: Integer
  /** Identifier of the direct messages topic to which the message will be sent; required if the message is sent to a direct messages chat */
  direct_messages_topic_id?: Integer
  /** Product name, 1-32 characters */
  title: String
  /** Product description, 1-255 characters */
  description: String
  /** Bot-defined invoice payload, 1-128 bytes. This will not be displayed to the user, use it for your internal processes. */
  payload: String
  /** Payment provider token, obtained via Telegram Stars. */
  provider_token?: String
  /** Three-letter ISO 4217 currency code, see Telegram Stars. */
  currency: String
  /** Price breakdown, a JSON-serialized list of components (e.g. product price, tax, discount, delivery cost, delivery tax, bonus, etc.). Must contain exactly one item for payments in Telegram Stars. */
  prices: Array<LabeledPrice>
  /** The maximum accepted amount for tips in the smallest units of the currency (integer, not float/double). For example, for a maximum tip of US$ 1.45 pass max_tip_amount = 145. See the exp parameter in Telegram Stars. */
  max_tip_amount?: Integer
  /** A JSON-serialized array of suggested amounts of tips in the smallest units of the currency (integer, not float/double). At most 4 suggested tip amounts can be specified. The suggested tip amounts must be positive, passed in a strictly increased order and must not exceed max_tip_amount. */
  suggested_tip_amounts?: Array<Integer>
  /** Unique deep-linking parameter. If left empty, forwarded copies of the sent message will have a Pay button, allowing multiple users to pay directly from the forwarded message, using the same invoice. If non-empty, forwarded copies of the sent message will have a URL button with a deep link to the bot (instead of a Pay button), with the value used as the start parameter */
  start_parameter?: String
  /** JSON-serialized data about the invoice, which will be shared with the payment provider. A detailed description of required fields should be provided by the payment provider. */
  provider_data?: String
  /** URL of the product photo for the invoice. Can be a photo of the goods or a marketing image for a service. People like it better when they see what they are paying for. */
  photo_url?: String
  /** Photo size in bytes */
  photo_size?: Integer
  /** Photo width */
  photo_width?: Integer
  /** Photo height */
  photo_height?: Integer
  /** Pass True if you require the user's full name to complete the order. Ignored for payments in Telegram Stars. */
  need_name?: Boolean
  /** Pass True if you require the user's phone number to complete the order. Ignored for payments in Telegram Stars. */
  need_phone_number?: Boolean
  /** Pass True if you require the user's email address to complete the order. Ignored for payments in Telegram Stars. */
  need_email?: Boolean
  /** Pass True if you require the user's shipping address to complete the order. Ignored for payments in Telegram Stars. */
  need_shipping_address?: Boolean
  /** Pass True if the user's phone number should be sent to the provider. Ignored for payments in Telegram Stars. */
  send_phone_number_to_provider?: Boolean
  /** Pass True if the user's email address should be sent to the provider. Ignored for payments in Telegram Stars. */
  send_email_to_provider?: Boolean
  /** Pass True if the final price depends on the shipping method. Ignored for payments in Telegram Stars. */
  is_flexible?: Boolean
  /** Sends the message silently. Users will receive a notification with no sound. */
  disable_notification?: Boolean
  /** Protects the contents of the sent message from forwarding and saving */
  protect_content?: Boolean
  /** Pass True to allow up to 1000 messages per second, ignoring broadcasting limits for a fee of 0.1 Telegram Stars per message. The relevant Stars will be withdrawn from the bot's balance */
  allow_paid_broadcast?: Boolean
  /** Unique identifier of the message effect to be added to the message; for private chats only */
  message_effect_id?: String
  /** A JSON-serialized object containing the parameters of the suggested post to send; for direct messages chats only. If the message is sent as a reply to another suggested post, then that suggested post is automatically declined. */
  suggested_post_parameters?: SuggestedPostParameters
  /** Description of the message to reply to */
  reply_parameters?: ReplyParameters
  /** A JSON-serialized object for an inline keyboard. If empty, one 'Pay total price' button will be shown. If not empty, the first button must be a Pay button. */
  reply_markup?: InlineKeyboardMarkup
}

/**
 * Use this method to create a link for an invoice. Returns the created invoice link as String on success.
 * @see https://core.telegram.org/bots/api#createinvoicelink
 */
export interface CreateInvoiceLinkParams {
  /** Unique identifier of the business connection on behalf of which the link will be created. For payments in Telegram Stars only. */
  business_connection_id?: String
  /** Product name, 1-32 characters */
  title: String
  /** Product description, 1-255 characters */
  description: String
  /** Bot-defined invoice payload, 1-128 bytes. This will not be displayed to the user, use it for your internal processes. */
  payload: String
  /** Payment provider token, obtained via Telegram Stars. */
  provider_token?: String
  /** Three-letter ISO 4217 currency code, see Telegram Stars. */
  currency: String
  /** Price breakdown, a JSON-serialized list of components (e.g. product price, tax, discount, delivery cost, delivery tax, bonus, etc.). Must contain exactly one item for payments in Telegram Stars. */
  prices: Array<LabeledPrice>
  /** The number of seconds the subscription will be active for before the next payment. The currency must be set to "XTR" (Telegram Stars) if the parameter is used. Currently, it must always be 2592000 (30 days) if specified. Any number of subscriptions can be active for a given bot at the same time, including multiple concurrent subscriptions from the same user. Subscription price must no exceed 10000 Telegram Stars. */
  subscription_period?: Integer
  /** The maximum accepted amount for tips in the smallest units of the currency (integer, not float/double). For example, for a maximum tip of US$ 1.45 pass max_tip_amount = 145. See the exp parameter in Telegram Stars. */
  max_tip_amount?: Integer
  /** A JSON-serialized array of suggested amounts of tips in the smallest units of the currency (integer, not float/double). At most 4 suggested tip amounts can be specified. The suggested tip amounts must be positive, passed in a strictly increased order and must not exceed max_tip_amount. */
  suggested_tip_amounts?: Array<Integer>
  /** JSON-serialized data about the invoice, which will be shared with the payment provider. A detailed description of required fields should be provided by the payment provider. */
  provider_data?: String
  /** URL of the product photo for the invoice. Can be a photo of the goods or a marketing image for a service. */
  photo_url?: String
  /** Photo size in bytes */
  photo_size?: Integer
  /** Photo width */
  photo_width?: Integer
  /** Photo height */
  photo_height?: Integer
  /** Pass True if you require the user's full name to complete the order. Ignored for payments in Telegram Stars. */
  need_name?: Boolean
  /** Pass True if you require the user's phone number to complete the order. Ignored for payments in Telegram Stars. */
  need_phone_number?: Boolean
  /** Pass True if you require the user's email address to complete the order. Ignored for payments in Telegram Stars. */
  need_email?: Boolean
  /** Pass True if you require the user's shipping address to complete the order. Ignored for payments in Telegram Stars. */
  need_shipping_address?: Boolean
  /** Pass True if the user's phone number should be sent to the provider. Ignored for payments in Telegram Stars. */
  send_phone_number_to_provider?: Boolean
  /** Pass True if the user's email address should be sent to the provider. Ignored for payments in Telegram Stars. */
  send_email_to_provider?: Boolean
  /** Pass True if the final price depends on the shipping method. Ignored for payments in Telegram Stars. */
  is_flexible?: Boolean
}

/**
 * If you sent an invoice requesting a shipping address and the parameter is_flexible was specified, the Bot API will send an Update with a shipping_query field to the bot. Use this method to reply to shipping queries. On success, True is returned.
 * @see https://core.telegram.org/bots/api#answershippingquery
 */
export interface AnswerShippingQueryParams {
  /** Unique identifier for the query to be answered */
  shipping_query_id: String
  /** Pass True if delivery to the specified address is possible and False if there are any problems (for example, if delivery to the specified address is not possible) */
  ok: Boolean
  /** Required if ok is True. A JSON-serialized array of available shipping options. */
  shipping_options?: Array<ShippingOption>
  /** Required if ok is False. Error message in human readable form that explains why it is impossible to complete the order (e.g. "Sorry, delivery to your desired address is unavailable"). Telegram will display this message to the user. */
  error_message?: String
}

/**
 * Once the user has confirmed their payment and shipping details, the Bot API sends the final confirmation in the form of an Update with the field pre_checkout_query. Use this method to respond to such pre-checkout queries. On success, True is returned. Note: The Bot API must receive an answer within 10 seconds after the pre-checkout query was sent.
 * @see https://core.telegram.org/bots/api#answerprecheckoutquery
 */
export interface AnswerPreCheckoutQueryParams {
  /** Unique identifier for the query to be answered */
  pre_checkout_query_id: String
  /** Specify True if everything is alright (goods are available, etc.) and the bot is ready to proceed with the order. Use False if there are any problems. */
  ok: Boolean
  /** Required if ok is False. Error message in human readable form that explains the reason for failure to proceed with the checkout (e.g. "Sorry, somebody just bought the last of our amazing black T-shirts while you were busy filling out your payment details. Please choose a different color or garment!"). Telegram will display this message to the user. */
  error_message?: String
}

/**
 * A method to get the current Telegram Stars balance of the bot. Requires no parameters. On success, returns a StarAmount object.
 * @see https://core.telegram.org/bots/api#getmystarbalance
 */
export type GetMyStarBalanceParams = object

/**
 * Returns the bot's Telegram Star transactions in chronological order. On success, returns a StarTransactions object.
 * @see https://core.telegram.org/bots/api#getstartransactions
 */
export interface GetStarTransactionsParams {
  /** Number of transactions to skip in the response */
  offset?: Integer
  /** The maximum number of transactions to be retrieved. Values between 1-100 are accepted. Defaults to 100. */
  limit?: Integer
}

/**
 * Refunds a successful payment in Telegram Stars. Returns True on success.
 * @see https://core.telegram.org/bots/api#refundstarpayment
 */
export interface RefundStarPaymentParams {
  /** Identifier of the user whose payment will be refunded */
  user_id: Integer
  /** Telegram payment identifier */
  telegram_payment_charge_id: String
}

/**
 * Allows the bot to cancel or re-enable extension of a subscription paid in Telegram Stars. Returns True on success.
 * @see https://core.telegram.org/bots/api#edituserstarsubscription
 */
export interface EditUserStarSubscriptionParams {
  /** Identifier of the user whose subscription will be edited */
  user_id: Integer
  /** Telegram payment identifier for the subscription */
  telegram_payment_charge_id: String
  /** Pass True to cancel extension of the user subscription; the subscription must be active up to the end of the current subscription period. Pass False to allow the user to re-enable a subscription that was previously canceled by the bot. */
  is_canceled: Boolean
}

/**
 * This object represents a portion of the price for goods or services.
 * @see https://core.telegram.org/bots/api#labeledprice
 */
export interface LabeledPrice {
  /** Portion label */
  label: String
  /** Price of the product in the smallest units of the currencies.json, it shows the number of digits past the decimal point for each currency (2 for the majority of currencies). */
  amount: Integer
}

/**
 * This object contains basic information about an invoice.
 * @see https://core.telegram.org/bots/api#invoice
 */
export interface Invoice {
  /** Product name */
  title: String
  /** Product description */
  description: String
  /** Unique bot deep-linking parameter that can be used to generate this invoice */
  start_parameter: String
  /** Three-letter ISO 4217 Telegram Stars */
  currency: String
  /** Total price in the smallest units of the currency (integer, not float/double). For example, for a price of US$ 1.45 pass amount = 145. See the exp parameter in currencies.json, it shows the number of digits past the decimal point for each currency (2 for the majority of currencies). */
  total_amount: Integer
}

/**
 * This object represents a shipping address.
 * @see https://core.telegram.org/bots/api#shippingaddress
 */
export interface ShippingAddress {
  /** Two-letter ISO 3166-1 alpha-2 country code */
  country_code: String
  /** State, if applicable */
  state: String
  /** City */
  city: String
  /** First line for the address */
  street_line1: String
  /** Second line for the address */
  street_line2: String
  /** Address post code */
  post_code: String
}

/**
 * This object represents information about an order.
 * @see https://core.telegram.org/bots/api#orderinfo
 */
export interface OrderInfo {
  /** Optional. User name */
  name?: String
  /** Optional. User's phone number */
  phone_number?: String
  /** Optional. User email */
  email?: String
  /** Optional. User shipping address */
  shipping_address?: ShippingAddress
}

/**
 * This object represents one shipping option.
 * @see https://core.telegram.org/bots/api#shippingoption
 */
export interface ShippingOption {
  /** Shipping option identifier */
  id: String
  /** Option title */
  title: String
  /** List of price portions */
  prices: Array<LabeledPrice>
}

/**
 * This object contains basic information about a successful payment. Note that if the buyer initiates a chargeback with the relevant payment provider following this transaction, the funds may be debited from your balance. This is outside of Telegram's control.
 * @see https://core.telegram.org/bots/api#successfulpayment
 */
export interface SuccessfulPayment {
  /** Three-letter ISO 4217 Telegram Stars */
  currency: String
  /** Total price in the smallest units of the currency (integer, not float/double). For example, for a price of US$ 1.45 pass amount = 145. See the exp parameter in currencies.json, it shows the number of digits past the decimal point for each currency (2 for the majority of currencies). */
  total_amount: Integer
  /** Bot-specified invoice payload */
  invoice_payload: String
  /** Optional. Expiration date of the subscription, in Unix time; for recurring payments only */
  subscription_expiration_date?: Integer
  /** Optional. True, if the payment is a recurring payment for a subscription */
  is_recurring?: True
  /** Optional. True, if the payment is the first payment for a subscription */
  is_first_recurring?: True
  /** Optional. Identifier of the shipping option chosen by the user */
  shipping_option_id?: String
  /** Optional. Order information provided by the user */
  order_info?: OrderInfo
  /** Telegram payment identifier */
  telegram_payment_charge_id: String
  /** Provider payment identifier */
  provider_payment_charge_id: String
}

/**
 * This object contains basic information about a refunded payment.
 * @see https://core.telegram.org/bots/api#refundedpayment
 */
export interface RefundedPayment {
  /** Three-letter ISO 4217 Telegram Stars. Currently, always "XTR" */
  currency: "XTR"
  /** Total refunded price in the smallest units of the currency (integer, not float/double). For example, for a price of US$ 1.45, total_amount = 145. See the exp parameter in currencies.json, it shows the number of digits past the decimal point for each currency (2 for the majority of currencies). */
  total_amount: Integer
  /** Bot-specified invoice payload */
  invoice_payload: String
  /** Telegram payment identifier */
  telegram_payment_charge_id: String
  /** Optional. Provider payment identifier */
  provider_payment_charge_id?: String
}

/**
 * This object contains information about an incoming shipping query.
 * @see https://core.telegram.org/bots/api#shippingquery
 */
export interface ShippingQuery {
  /** Unique query identifier */
  id: String
  /** User who sent the query */
  from: User
  /** Bot-specified invoice payload */
  invoice_payload: String
  /** User specified shipping address */
  shipping_address: ShippingAddress
}

/**
 * This object contains information about an incoming pre-checkout query.
 * @see https://core.telegram.org/bots/api#precheckoutquery
 */
export interface PreCheckoutQuery {
  /** Unique query identifier */
  id: String
  /** User who sent the query */
  from: User
  /** Three-letter ISO 4217 Telegram Stars */
  currency: String
  /** Total price in the smallest units of the currency (integer, not float/double). For example, for a price of US$ 1.45 pass amount = 145. See the exp parameter in currencies.json, it shows the number of digits past the decimal point for each currency (2 for the majority of currencies). */
  total_amount: Integer
  /** Bot-specified invoice payload */
  invoice_payload: String
  /** Optional. Identifier of the shipping option chosen by the user */
  shipping_option_id?: String
  /** Optional. Order information provided by the user */
  order_info?: OrderInfo
}

/**
 * This object contains information about a paid media purchase.
 * @see https://core.telegram.org/bots/api#paidmediapurchased
 */
export interface PaidMediaPurchased {
  /** User who purchased the media */
  from: User
  /** Bot-specified paid media payload */
  paid_media_payload: String
}

/**
 * This object describes the state of a revenue withdrawal operation. Currently, it can be one of RevenueWithdrawalStatePending, RevenueWithdrawalStateSucceeded, RevenueWithdrawalStateFailed
 * @see https://core.telegram.org/bots/api#revenuewithdrawalstate
 */
export type RevenueWithdrawalState =
  | RevenueWithdrawalStatePending
  | RevenueWithdrawalStateSucceeded
  | RevenueWithdrawalStateFailed

/**
 * The withdrawal is in progress.
 * @see https://core.telegram.org/bots/api#revenuewithdrawalstatepending
 */
export interface RevenueWithdrawalStatePending {
  /** Type of the state, always "pending" */
  type: "pending"
}

/**
 * The withdrawal succeeded.
 * @see https://core.telegram.org/bots/api#revenuewithdrawalstatesucceeded
 */
export interface RevenueWithdrawalStateSucceeded {
  /** Type of the state, always "succeeded" */
  type: "succeeded"
  /** Date the withdrawal was completed in Unix time */
  date: Integer
  /** An HTTPS URL that can be used to see transaction details */
  url: String
}

/**
 * The withdrawal failed and the transaction was refunded.
 * @see https://core.telegram.org/bots/api#revenuewithdrawalstatefailed
 */
export interface RevenueWithdrawalStateFailed {
  /** Type of the state, always "failed" */
  type: "failed"
}

/**
 * Contains information about the affiliate that received a commission via this transaction.
 * @see https://core.telegram.org/bots/api#affiliateinfo
 */
export interface AffiliateInfo {
  /** Optional. The bot or the user that received an affiliate commission if it was received by a bot or a user */
  affiliate_user?: User
  /** Optional. The chat that received an affiliate commission if it was received by a chat */
  affiliate_chat?: Chat
  /** The number of Telegram Stars received by the affiliate for each 1000 Telegram Stars received by the bot from referred users */
  commission_per_mille: Integer
  /** Integer amount of Telegram Stars received by the affiliate from the transaction, rounded to 0; can be negative for refunds */
  amount: Integer
  /** Optional. The number of 1/1000000000 shares of Telegram Stars received by the affiliate; from -999999999 to 999999999; can be negative for refunds */
  nanostar_amount?: Integer
}

/**
 * This object describes the source of a transaction, or its recipient for outgoing transactions. Currently, it can be one of TransactionPartnerUser, TransactionPartnerChat, TransactionPartnerAffiliateProgram, TransactionPartnerFragment, TransactionPartnerTelegramAds, TransactionPartnerTelegramApi, TransactionPartnerOther
 * @see https://core.telegram.org/bots/api#transactionpartner
 */
export type TransactionPartner =
  | TransactionPartnerUser
  | TransactionPartnerChat
  | TransactionPartnerAffiliateProgram
  | TransactionPartnerFragment
  | TransactionPartnerTelegramAds
  | TransactionPartnerTelegramApi
  | TransactionPartnerOther

/**
 * Describes a transaction with a user.
 * @see https://core.telegram.org/bots/api#transactionpartneruser
 */
export interface TransactionPartnerUser {
  /** Type of the transaction partner, always "user" */
  type: "user"
  /** Type of the transaction, currently one of "invoice_payment" for payments via invoices, "paid_media_payment" for payments for paid media, "gift_purchase" for gifts sent by the bot, "premium_purchase" for Telegram Premium subscriptions gifted by the bot, "business_account_transfer" for direct transfers from managed business accounts */
  transaction_type: String
  /** Information about the user */
  user: User
  /** Optional. Information about the affiliate that received a commission via this transaction. Can be available only for "invoice_payment" and "paid_media_payment" transactions. */
  affiliate?: AffiliateInfo
  /** Optional. Bot-specified invoice payload. Can be available only for "invoice_payment" transactions. */
  invoice_payload?: String
  /** Optional. The duration of the paid subscription. Can be available only for "invoice_payment" transactions. */
  subscription_period?: Integer
  /** Optional. Information about the paid media bought by the user; for "paid_media_payment" transactions only */
  paid_media?: Array<PaidMedia>
  /** Optional. Bot-specified paid media payload. Can be available only for "paid_media_payment" transactions. */
  paid_media_payload?: String
  /** Optional. The gift sent to the user by the bot; for "gift_purchase" transactions only */
  gift?: Gift
  /** Optional. Number of months the gifted Telegram Premium subscription will be active for; for "premium_purchase" transactions only */
  premium_subscription_duration?: Integer
}

/**
 * Describes a transaction with a chat.
 * @see https://core.telegram.org/bots/api#transactionpartnerchat
 */
export interface TransactionPartnerChat {
  /** Type of the transaction partner, always "chat" */
  type: "chat"
  /** Information about the chat */
  chat: Chat
  /** Optional. The gift sent to the chat by the bot */
  gift?: Gift
}

/**
 * Describes the affiliate program that issued the affiliate commission received via this transaction.
 * @see https://core.telegram.org/bots/api#transactionpartneraffiliateprogram
 */
export interface TransactionPartnerAffiliateProgram {
  /** Type of the transaction partner, always "affiliate_program" */
  type: "affiliate_program"
  /** Optional. Information about the bot that sponsored the affiliate program */
  sponsor_user?: User
  /** The number of Telegram Stars received by the bot for each 1000 Telegram Stars received by the affiliate program sponsor from referred users */
  commission_per_mille: Integer
}

/**
 * Describes a withdrawal transaction with Fragment.
 * @see https://core.telegram.org/bots/api#transactionpartnerfragment
 */
export interface TransactionPartnerFragment {
  /** Type of the transaction partner, always "fragment" */
  type: "fragment"
  /** Optional. State of the transaction if the transaction is outgoing */
  withdrawal_state?: RevenueWithdrawalState
}

/**
 * Describes a withdrawal transaction to the Telegram Ads platform.
 * @see https://core.telegram.org/bots/api#transactionpartnertelegramads
 */
export interface TransactionPartnerTelegramAds {
  /** Type of the transaction partner, always "telegram_ads" */
  type: "telegram_ads"
}

/**
 * Describes a transaction with payment for paid broadcasting.
 * @see https://core.telegram.org/bots/api#transactionpartnertelegramapi
 */
export interface TransactionPartnerTelegramApi {
  /** Type of the transaction partner, always "telegram_api" */
  type: "telegram_api"
  /** The number of successful requests that exceeded regular limits and were therefore billed */
  request_count: Integer
}

/**
 * Describes a transaction with an unknown source or recipient.
 * @see https://core.telegram.org/bots/api#transactionpartnerother
 */
export interface TransactionPartnerOther {
  /** Type of the transaction partner, always "other" */
  type: "other"
}

/**
 * Describes a Telegram Star transaction. Note that if the buyer initiates a chargeback with the payment provider from whom they acquired Stars (e.g., Apple, Google) following this transaction, the refunded Stars will be deducted from the bot's balance. This is outside of Telegram's control.
 * @see https://core.telegram.org/bots/api#startransaction
 */
export interface StarTransaction {
  /** Unique identifier of the transaction. Coincides with the identifier of the original transaction for refund transactions. Coincides with SuccessfulPayment.telegram_payment_charge_id for successful incoming payments from users. */
  id: String
  /** Integer amount of Telegram Stars transferred by the transaction */
  amount: Integer
  /** Optional. The number of 1/1000000000 shares of Telegram Stars transferred by the transaction; from 0 to 999999999 */
  nanostar_amount?: Integer
  /** Date the transaction was created in Unix time */
  date: Integer
  /** Optional. Source of an incoming transaction (e.g., a user purchasing goods or services, Fragment refunding a failed withdrawal). Only for incoming transactions */
  source?: TransactionPartner
  /** Optional. Receiver of an outgoing transaction (e.g., a user for a purchase refund, Fragment for a withdrawal). Only for outgoing transactions */
  receiver?: TransactionPartner
}

/**
 * Contains a list of Telegram Star transactions.
 * @see https://core.telegram.org/bots/api#startransactions
 */
export interface StarTransactions {
  /** The list of transactions */
  transactions: Array<StarTransaction>
}

/**
 * Describes Telegram Passport data shared with the bot by the user.
 * @see https://core.telegram.org/bots/api#passportdata
 */
export interface PassportData {
  /** Array with information about documents and other Telegram Passport elements that was shared with the bot */
  data: Array<EncryptedPassportElement>
  /** Encrypted credentials required to decrypt the data */
  credentials: EncryptedCredentials
}

/**
 * This object represents a file uploaded to Telegram Passport. Currently all Telegram Passport files are in JPEG format when decrypted and don't exceed 10MB.
 * @see https://core.telegram.org/bots/api#passportfile
 */
export interface PassportFile {
  /** Identifier for this file, which can be used to download or reuse the file */
  file_id: String
  /** Unique identifier for this file, which is supposed to be the same over time and for different bots. Can't be used to download or reuse the file. */
  file_unique_id: String
  /** File size in bytes */
  file_size: Integer
  /** Unix time when the file was uploaded */
  file_date: Integer
}

/**
 * Describes documents or other Telegram Passport elements shared with the bot by the user.
 * @see https://core.telegram.org/bots/api#encryptedpassportelement
 */
export interface EncryptedPassportElement {
  /** Element type. One of "personal_details", "passport", "driver_license", "identity_card", "internal_passport", "address", "utility_bill", "bank_statement", "rental_agreement", "passport_registration", "temporary_registration", "phone_number", "email". */
  type: String
  /** Optional. Base64-encoded encrypted Telegram Passport element data provided by the user; available only for "personal_details", "passport", "driver_license", "identity_card", "internal_passport" and "address" types. Can be decrypted and verified using the accompanying EncryptedCredentials. */
  data?: String
  /** Optional. User's verified phone number; available only for "phone_number" type */
  phone_number?: String
  /** Optional. User's verified email address; available only for "email" type */
  email?: String
  /** Optional. Array of encrypted files with documents provided by the user; available only for "utility_bill", "bank_statement", "rental_agreement", "passport_registration" and "temporary_registration" types. Files can be decrypted and verified using the accompanying EncryptedCredentials. */
  files?: Array<PassportFile>
  /** Optional. Encrypted file with the front side of the document, provided by the user; available only for "passport", "driver_license", "identity_card" and "internal_passport". The file can be decrypted and verified using the accompanying EncryptedCredentials. */
  front_side?: PassportFile
  /** Optional. Encrypted file with the reverse side of the document, provided by the user; available only for "driver_license" and "identity_card". The file can be decrypted and verified using the accompanying EncryptedCredentials. */
  reverse_side?: PassportFile
  /** Optional. Encrypted file with the selfie of the user holding a document, provided by the user; available if requested for "passport", "driver_license", "identity_card" and "internal_passport". The file can be decrypted and verified using the accompanying EncryptedCredentials. */
  selfie?: PassportFile
  /** Optional. Array of encrypted files with translated versions of documents provided by the user; available if requested for "passport", "driver_license", "identity_card", "internal_passport", "utility_bill", "bank_statement", "rental_agreement", "passport_registration" and "temporary_registration" types. Files can be decrypted and verified using the accompanying EncryptedCredentials. */
  translation?: Array<PassportFile>
  /** Base64-encoded element hash for using in PassportElementErrorUnspecified */
  hash: String
}

/**
 * Describes data required for decrypting and authenticating Telegram Passport Documentation for a complete description of the data decryption and authentication processes.
 * @see https://core.telegram.org/bots/api#encryptedcredentials
 */
export interface EncryptedCredentials {
  /** Base64-encoded encrypted JSON-serialized data with unique user's payload, data hashes and secrets required for EncryptedPassportElement decryption and authentication */
  data: String
  /** Base64-encoded data hash for data authentication */
  hash: String
  /** Base64-encoded secret, encrypted with the bot's public RSA key, required for data decryption */
  secret: String
}

/**
 * Informs a user that some of the Telegram Passport elements they provided contains errors. The user will not be able to re-submit their Passport to you until the errors are fixed (the contents of the field for which you returned the error must change). Returns True on success. Use this if the data submitted by the user doesn't satisfy the standards your service requires for any reason. For example, if a birthday date seems invalid, a submitted document is blurry, a scan shows evidence of tampering, etc. Supply some details in the error message to make sure the user knows how to correct the issues.
 * @see https://core.telegram.org/bots/api#setpassportdataerrors
 */
export interface SetPassportDataErrorsParams {
  /** User identifier */
  user_id: Integer
  /** A JSON-serialized array describing the errors */
  errors: Array<PassportElementError>
}

/**
 * This object represents an error in the Telegram Passport element which was submitted that should be resolved by the user. It should be one of: PassportElementErrorDataField, PassportElementErrorFrontSide, PassportElementErrorReverseSide, PassportElementErrorSelfie, PassportElementErrorFile, PassportElementErrorFiles, PassportElementErrorTranslationFile, PassportElementErrorTranslationFiles, PassportElementErrorUnspecified
 * @see https://core.telegram.org/bots/api#passportelementerror
 */
export type PassportElementError =
  | PassportElementErrorDataField
  | PassportElementErrorFrontSide
  | PassportElementErrorReverseSide
  | PassportElementErrorSelfie
  | PassportElementErrorFile
  | PassportElementErrorFiles
  | PassportElementErrorTranslationFile
  | PassportElementErrorTranslationFiles
  | PassportElementErrorUnspecified

/**
 * Represents an issue in one of the data fields that was provided by the user. The error is considered resolved when the field's value changes.
 * @see https://core.telegram.org/bots/api#passportelementerrordatafield
 */
export interface PassportElementErrorDataField {
  /** Error source, must be data */
  source: String
  /** The section of the user's Telegram Passport which has the error, one of "personal_details", "passport", "driver_license", "identity_card", "internal_passport", "address" */
  type: String
  /** Name of the data field which has the error */
  field_name: String
  /** Base64-encoded data hash */
  data_hash: String
  /** Error message */
  message: String
}

/**
 * Represents an issue with the front side of a document. The error is considered resolved when the file with the front side of the document changes.
 * @see https://core.telegram.org/bots/api#passportelementerrorfrontside
 */
export interface PassportElementErrorFrontSide {
  /** Error source, must be front_side */
  source: String
  /** The section of the user's Telegram Passport which has the issue, one of "passport", "driver_license", "identity_card", "internal_passport" */
  type: String
  /** Base64-encoded hash of the file with the front side of the document */
  file_hash: String
  /** Error message */
  message: String
}

/**
 * Represents an issue with the reverse side of a document. The error is considered resolved when the file with reverse side of the document changes.
 * @see https://core.telegram.org/bots/api#passportelementerrorreverseside
 */
export interface PassportElementErrorReverseSide {
  /** Error source, must be reverse_side */
  source: String
  /** The section of the user's Telegram Passport which has the issue, one of "driver_license", "identity_card" */
  type: String
  /** Base64-encoded hash of the file with the reverse side of the document */
  file_hash: String
  /** Error message */
  message: String
}

/**
 * Represents an issue with the selfie with a document. The error is considered resolved when the file with the selfie changes.
 * @see https://core.telegram.org/bots/api#passportelementerrorselfie
 */
export interface PassportElementErrorSelfie {
  /** Error source, must be selfie */
  source: String
  /** The section of the user's Telegram Passport which has the issue, one of "passport", "driver_license", "identity_card", "internal_passport" */
  type: String
  /** Base64-encoded hash of the file with the selfie */
  file_hash: String
  /** Error message */
  message: String
}

/**
 * Represents an issue with a document scan. The error is considered resolved when the file with the document scan changes.
 * @see https://core.telegram.org/bots/api#passportelementerrorfile
 */
export interface PassportElementErrorFile {
  /** Error source, must be file */
  source: String
  /** The section of the user's Telegram Passport which has the issue, one of "utility_bill", "bank_statement", "rental_agreement", "passport_registration", "temporary_registration" */
  type: String
  /** Base64-encoded file hash */
  file_hash: String
  /** Error message */
  message: String
}

/**
 * Represents an issue with a list of scans. The error is considered resolved when the list of files containing the scans changes.
 * @see https://core.telegram.org/bots/api#passportelementerrorfiles
 */
export interface PassportElementErrorFiles {
  /** Error source, must be files */
  source: String
  /** The section of the user's Telegram Passport which has the issue, one of "utility_bill", "bank_statement", "rental_agreement", "passport_registration", "temporary_registration" */
  type: String
  /** List of base64-encoded file hashes */
  file_hashes: Array<String>
  /** Error message */
  message: String
}

/**
 * Represents an issue with one of the files that constitute the translation of a document. The error is considered resolved when the file changes.
 * @see https://core.telegram.org/bots/api#passportelementerrortranslationfile
 */
export interface PassportElementErrorTranslationFile {
  /** Error source, must be translation_file */
  source: String
  /** Type of element of the user's Telegram Passport which has the issue, one of "passport", "driver_license", "identity_card", "internal_passport", "utility_bill", "bank_statement", "rental_agreement", "passport_registration", "temporary_registration" */
  type: String
  /** Base64-encoded file hash */
  file_hash: String
  /** Error message */
  message: String
}

/**
 * Represents an issue with the translated version of a document. The error is considered resolved when a file with the document translation change.
 * @see https://core.telegram.org/bots/api#passportelementerrortranslationfiles
 */
export interface PassportElementErrorTranslationFiles {
  /** Error source, must be translation_files */
  source: String
  /** Type of element of the user's Telegram Passport which has the issue, one of "passport", "driver_license", "identity_card", "internal_passport", "utility_bill", "bank_statement", "rental_agreement", "passport_registration", "temporary_registration" */
  type: String
  /** List of base64-encoded file hashes */
  file_hashes: Array<String>
  /** Error message */
  message: String
}

/**
 * Represents an issue in an unspecified place. The error is considered resolved when new data is added.
 * @see https://core.telegram.org/bots/api#passportelementerrorunspecified
 */
export interface PassportElementErrorUnspecified {
  /** Error source, must be unspecified */
  source: String
  /** Type of element of the user's Telegram Passport which has the issue */
  type: String
  /** Base64-encoded element hash */
  element_hash: String
  /** Error message */
  message: String
}

/**
 * Use this method to send a game. On success, the sent Message is returned.
 * @see https://core.telegram.org/bots/api#sendgame
 */
export interface SendGameParams {
  /** Unique identifier of the business connection on behalf of which the message will be sent */
  business_connection_id?: String
  /** Unique identifier for the target chat. Games can't be sent to channel direct messages chats and channel chats. */
  chat_id: Integer
  /** Unique identifier for the target message thread (topic) of the forum; for forum supergroups only */
  message_thread_id?: Integer
  /** Short name of the game, serves as the unique identifier for the game. Set up your games via @BotFather. */
  game_short_name: String
  /** Sends the message silently. Users will receive a notification with no sound. */
  disable_notification?: Boolean
  /** Protects the contents of the sent message from forwarding and saving */
  protect_content?: Boolean
  /** Pass True to allow up to 1000 messages per second, ignoring broadcasting limits for a fee of 0.1 Telegram Stars per message. The relevant Stars will be withdrawn from the bot's balance */
  allow_paid_broadcast?: Boolean
  /** Unique identifier of the message effect to be added to the message; for private chats only */
  message_effect_id?: String
  /** Description of the message to reply to */
  reply_parameters?: ReplyParameters
  /** A JSON-serialized object for an inline keyboard. If empty, one 'Play game_title' button will be shown. If not empty, the first button must launch the game. */
  reply_markup?: InlineKeyboardMarkup
}

/**
 * This object represents a game. Use BotFather to create and edit games, their short names will act as unique identifiers.
 * @see https://core.telegram.org/bots/api#game
 */
export interface Game {
  /** Title of the game */
  title: String
  /** Description of the game */
  description: String
  /** Photo that will be displayed in the game message in chats. */
  photo: Array<PhotoSize>
  /** Optional. Brief description of the game or high scores included in the game message. Can be automatically edited to include current high scores for the game when the bot calls editMessageText. 0-4096 characters. */
  text?: String
  /** Optional. Special entities that appear in text, such as usernames, URLs, bot commands, etc. */
  text_entities?: Array<MessageEntity>
  /** Optional. Animation that will be displayed in the game message in chats. Upload via BotFather */
  animation?: Animation
}

/**
 * A placeholder, currently holds no information. Use BotFather to set up your game.
 * @see https://core.telegram.org/bots/api#callbackgame
 */
export type CallbackGame = object

/**
 * Use this method to set the score of the specified user in a game message. On success, if the message is not an inline message, the Message is returned, otherwise True is returned. Returns an error, if the new score is not greater than the user's current score in the chat and force is False.
 * @see https://core.telegram.org/bots/api#setgamescore
 */
export interface SetGameScoreParams {
  /** User identifier */
  user_id: Integer
  /** New score, must be non-negative */
  score: Integer
  /** Pass True if the high score is allowed to decrease. This can be useful when fixing mistakes or banning cheaters */
  force?: Boolean
  /** Pass True if the game message should not be automatically edited to include the current scoreboard */
  disable_edit_message?: Boolean
  /** Required if inline_message_id is not specified. Unique identifier for the target chat */
  chat_id?: Integer
  /** Required if inline_message_id is not specified. Identifier of the sent message */
  message_id?: Integer
  /** Required if chat_id and message_id are not specified. Identifier of the inline message */
  inline_message_id?: String
}

/**
 * Use this method to get data for high score tables. Will return the score of the specified user and several of their neighbors in a game. Returns an Array of GameHighScore objects. This method will currently return scores for the target user, plus two of their closest neighbors on each side. Will also return the top three users if the user and their neighbors are not among them. Please note that this behavior is subject to change.
 * @see https://core.telegram.org/bots/api#getgamehighscores
 */
export interface GetGameHighScoresParams {
  /** Target user id */
  user_id: Integer
  /** Required if inline_message_id is not specified. Unique identifier for the target chat */
  chat_id?: Integer
  /** Required if inline_message_id is not specified. Identifier of the sent message */
  message_id?: Integer
  /** Required if chat_id and message_id are not specified. Identifier of the inline message */
  inline_message_id?: String
}

/**
 * This object represents one row of the high scores table for a game.
 * @see https://core.telegram.org/bots/api#gamehighscore
 */
export interface GameHighScore {
  /** Position in high score table for the game */
  position: Integer
  /** User */
  user: User
  /** Score */
  score: Integer
}

// =============================================================================
// HTTP Client and Request Handling Utilities
// =============================================================================

/**
 * Creates an HTTP request for a Telegram Bot API method
 * @param method The Telegram Bot API method name
 * @param params The parameters for the method
 * @param config The configuration object
 * @returns An HttpClientRequest
 */
const makeTelegramRequest = (
  method: string,
  params: any,
  config: TelegramBotApiConfig
): HttpClientRequest.HttpClientRequest => {
  const tokenValue = Redacted.value(config.token)
  const url = `${config.apiBaseUrl}${tokenValue}/${method}`

  // Determine if we need multipart/form-data (for file uploads)
  const hasFile = containsFile(params)

  if (hasFile) {
    // For file uploads, use multipart/form-data
    const formData = buildFormData(params)
    return HttpClientRequest.post(url).pipe(
      HttpClientRequest.bodyFormData(formData)
      // HttpClientRequest.timeout(config.timeout)
    )
  } else {
    // For regular requests, use JSON
    return HttpClientRequest.post(url).pipe(
      HttpClientRequest.bodyUnsafeJson(params),
      HttpClientRequest.setHeader("Content-Type", "application/json")
      // HttpClientRequest.timeout(config.timeout)
    )
  }
}

/**
 * Determines if the parameters contain a file (input file)
 * @param params The parameters to check
 * @returns Boolean indicating if the params contain a file
 */
const containsFile = (params: unknown): boolean => {
  if (typeof params !== "object" || params === null) {
    return false
  }

  const obj = params as Record<string, unknown>
  for (const key in obj) {
    const value = obj[key]
    if (value && typeof value === "object") {
      // Check if it's an InputFile type
      if ("file" in value || "fileId" in value || "content" in value) {
        return true
      }
      // Recursively check nested objects
      if (containsFile(value)) {
        return true
      }
    } else if (Array.isArray(value)) {
      // Check arrays of objects
      return value.some((item) => containsFile(item))
    }
  }

  return false
}

/**
 * Builds form data for file uploads
 * @param params The parameters to convert to form data
 * @returns FormData object
 */
const buildFormData = (params: unknown): FormData => {
  const formData = new FormData()
  if (typeof params !== "object" || params === null) {
    return formData
  }
  const obj = params as Record<string, unknown>
  for (const key in obj) {
    const value = obj[key]
    if (value !== undefined && value !== null) {
      if (typeof value === "object") {
        // Handle InputFile objects
        if ("file" in value && value.file instanceof File) {
          // File object
          formData.append(key, value.file)
        } else if ("content" in value) {
          // File content as string or buffer
          const content = (value as { content: string | Buffer }).content
          const filename = (value as { filename?: string }).filename || key
          if (typeof content === "string") {
            formData.append(key, new Blob([content]), filename)
          } else {
            // If content is a buffer, convert to Uint8Array first
            formData.append(key, new Blob([new Uint8Array(content)]), filename)
          }
        } else if (value instanceof File) {
          // Handle direct File objects
          formData.append(key, value)
        } else if (value instanceof Blob) {
          // Handle direct Blob objects
          formData.append(key, value)
        } else {
          // For other objects, stringify them
          formData.append(key, JSON.stringify(value))
        }
      } else {
        // For primitive values, append directly
        formData.append(key, String(value))
      }
    }
  }

  return formData
}

/**
 * Handles the HTTP response from a Telegram API request
 * @param response The HTTP response to process
 * @returns The parsed JSON response from Telegram API
 */
const handleTelegramResponse = <T>(
  response: HttpClientResponse.HttpClientResponse
): Effect.Effect<
  T,
  | ResponseError
  | TelegramBotApiError
  | TelegramBotApiInvalidResponseError
  | TelegramBotApiMethodError
  | TelegramBotApiRateLimitError
  | TelegramBotApiUnauthorizedError,
  never
> => {
  return pipe(
    response.json,
    Effect.andThen((json) => {
      if (
        typeof json === "object" &&
        json !== null &&
        "ok" in json &&
        json.ok
      ) {
        // Success response
        return Effect.succeed((json as any).result as T)
      } else if (
        typeof json === "object" &&
        json !== null &&
        "ok" in json &&
        !json.ok &&
        "description" in json
      ) {
        // Error response from Telegram API
        const errorCode = (json as any).error_code ? String((json as any).error_code) : undefined
        const description = String(json.description)
        const message = errorCode ? `${errorCode}: ${description}` : description

        // Check for specific error conditions
        if (
          errorCode === "409" &&
          description.toLowerCase().includes("conflict")
        ) {
          return Effect.fail(
            new TelegramBotApiError({ message: `Bot conflict: ${message}` })
          )
        } else if (errorCode === "401" || errorCode === "403") {
          return Effect.fail(
            new TelegramBotApiUnauthorizedError({
              message: `Unauthorized: ${message}`
            })
          )
        } else if (errorCode === "429") {
          const retryAfter = (json as any).parameters && "retry_after" in (json as any).parameters
            ? (((json as any).parameters as any).retry_after as number)
            : undefined
          return Effect.fail(
            new TelegramBotApiRateLimitError({
              message: `Rate limited: ${message}`,
              ...retryAfter ? { retryAfter } : {}
            })
          )
        } else {
          return Effect.fail(
            new TelegramBotApiMethodError({
              message,
              method: ((json as any).parameters?.method as string) || "unknown"
            })
          )
        }
      } else {
        // Invalid response format
        return Effect.fail(
          new TelegramBotApiInvalidResponseError({
            message: `Invalid response format: ${JSON.stringify(json)}`,
            response: json
          })
        )
      }
    })
  )
}

/**
 * Executes a Telegram API request with retry logic
 * @param method The Telegram Bot API method name
 * @param params The parameters for the method
 * @param config The configuration object
 * @returns The result of the API call
 */
const executeTelegramRequest = <T>(
  method: string,
  params: unknown,
  config: TelegramBotApiConfig
): Effect.Effect<T, TelegramBotApiError> => {
  const request = makeTelegramRequest(method, params, config)

  return pipe(
    HttpClient.HttpClient,
    Effect.flatMap((client) => client.execute(request)),
    Effect.flatMap((response) => handleTelegramResponse<T>(response)),
    Effect.retry({
      times: config.retryAttempts,
      // delay: config.retryDelay,
      until: (error) => {
        // Don't retry on unauthorized or method-specific errors
        if (
          error._tag === "TelegramBotApiUnauthorizedError" ||
          error._tag === "TelegramBotApiMethodError"
        ) {
          return true
        }
        // Retry on network errors and rate limits
        return (
          // error._tag === "TelegramBotApiNetworkError" ||
          error._tag === "TelegramBotApiRateLimitError"
        )
      }
    }),
    Effect.mapError((error) => {
      if (error._tag === "TelegramBotApiError") {
        return error
      }
      return new TelegramBotApiError({
        message: `Unexpected error: ${String(error)}`
      })
    })
  ).pipe(
    Effect.provide(FetchHttpClient.layer)
  )
}

// =============================================================================
// Complete Implementation
// =============================================================================

/**
 * The Telegram Bot API Service interface
 * Defines all available methods in the Telegram Bot API
 */
export interface TelegramBotApiService {
  // Getting updates
  getUpdates(params?: GetUpdatesParams): Effect.Effect<Array<Update>, TelegramBotApiError>
  setWebhook(params?: SetWebhookParams): Effect.Effect<true, TelegramBotApiError>
  deleteWebhook(params?: DeleteWebhookParams): Effect.Effect<true, TelegramBotApiError>
  getWebhookInfo(): Effect.Effect<WebhookInfo, TelegramBotApiError>

  // Available methods
  getMe(): Effect.Effect<User, TelegramBotApiError>
  logOut(): Effect.Effect<true, TelegramBotApiError>
  close(): Effect.Effect<true, TelegramBotApiError>
  sendMessage(params: SendMessageParams): Effect.Effect<Message, TelegramBotApiError>
  forwardMessage(params: ForwardMessageParams): Effect.Effect<Message, TelegramBotApiError>
  forwardMessages(params: ForwardMessagesParams): Effect.Effect<Array<MessageId>, TelegramBotApiError>
  copyMessage(params: CopyMessageParams): Effect.Effect<MessageId, TelegramBotApiError>
  copyMessages(params: CopyMessagesParams): Effect.Effect<Array<MessageId>, TelegramBotApiError>
  sendPhoto(params: SendPhotoParams): Effect.Effect<Message, TelegramBotApiError>
  sendAudio(params: SendAudioParams): Effect.Effect<Message, TelegramBotApiError>
  sendDocument(params: SendDocumentParams): Effect.Effect<Message, TelegramBotApiError>
  sendVideo(params: SendVideoParams): Effect.Effect<Message, TelegramBotApiError>
  sendAnimation(params: SendAnimationParams): Effect.Effect<Message, TelegramBotApiError>
  sendVoice(params: SendVoiceParams): Effect.Effect<Message, TelegramBotApiError>
  sendVideoNote(params: SendVideoNoteParams): Effect.Effect<Message, TelegramBotApiError>
  sendPaidMedia(params: SendPaidMediaParams): Effect.Effect<Message, TelegramBotApiError>
  sendMediaGroup(params: SendMediaGroupParams): Effect.Effect<Array<Message | boolean>, TelegramBotApiError>
  sendLocation(params: SendLocationParams): Effect.Effect<Message, TelegramBotApiError>
  sendVenue(params: SendVenueParams): Effect.Effect<Message, TelegramBotApiError>
  sendContact(params: SendContactParams): Effect.Effect<Message, TelegramBotApiError>
  sendPoll(params: SendPollParams): Effect.Effect<Message, TelegramBotApiError>
  sendChecklist(params: SendChecklistParams): Effect.Effect<Message, TelegramBotApiError>
  sendDice(params: SendDiceParams): Effect.Effect<Message, TelegramBotApiError>
  sendChatAction(params: SendChatActionParams): Effect.Effect<true, TelegramBotApiError>
  setMessageReaction(params: SetMessageReactionParams): Effect.Effect<true, TelegramBotApiError>
  getUserProfilePhotos(params: GetUserProfilePhotosParams): Effect.Effect<UserProfilePhotos, TelegramBotApiError>
  setUserEmojiStatus(params: SetUserEmojiStatusParams): Effect.Effect<true, TelegramBotApiError>
  getFile(params: GetFileParams): Effect.Effect<File, TelegramBotApiError>
  banChatMember(params: BanChatMemberParams): Effect.Effect<true, TelegramBotApiError>
  unbanChatMember(params: UnbanChatMemberParams): Effect.Effect<true, TelegramBotApiError>
  restrictChatMember(params: RestrictChatMemberParams): Effect.Effect<true, TelegramBotApiError>
  promoteChatMember(params: PromoteChatMemberParams): Effect.Effect<true, TelegramBotApiError>
  setChatAdministratorCustomTitle(
    params: SetChatAdministratorCustomTitleParams
  ): Effect.Effect<true, TelegramBotApiError>
  banChatSenderChat(params: BanChatSenderChatParams): Effect.Effect<true, TelegramBotApiError>
  unbanChatSenderChat(params: UnbanChatSenderChatParams): Effect.Effect<true, TelegramBotApiError>
  setChatPermissions(params: SetChatPermissionsParams): Effect.Effect<true, TelegramBotApiError>
  exportChatInviteLink(params: ExportChatInviteLinkParams): Effect.Effect<String, TelegramBotApiError>
  createChatInviteLink(params: CreateChatInviteLinkParams): Effect.Effect<ChatInviteLink, TelegramBotApiError>
  editChatInviteLink(params: EditChatInviteLinkParams): Effect.Effect<ChatInviteLink, TelegramBotApiError>
  createChatSubscriptionInviteLink(
    params: CreateChatSubscriptionInviteLinkParams
  ): Effect.Effect<ChatInviteLink, TelegramBotApiError>
  editChatSubscriptionInviteLink(
    params: EditChatSubscriptionInviteLinkParams
  ): Effect.Effect<ChatInviteLink, TelegramBotApiError>
  revokeChatInviteLink(params: RevokeChatInviteLinkParams): Effect.Effect<ChatInviteLink, TelegramBotApiError>
  approveChatJoinRequest(params: ApproveChatJoinRequestParams): Effect.Effect<true, TelegramBotApiError>
  declineChatJoinRequest(params: DeclineChatJoinRequestParams): Effect.Effect<true, TelegramBotApiError>
  setChatPhoto(params: SetChatPhotoParams): Effect.Effect<true, TelegramBotApiError>
  deleteChatPhoto(params: DeleteChatPhotoParams): Effect.Effect<true, TelegramBotApiError>
  setChatTitle(params: SetChatTitleParams): Effect.Effect<true, TelegramBotApiError>
  setChatDescription(params: SetChatDescriptionParams): Effect.Effect<true, TelegramBotApiError>
  pinChatMessage(params: PinChatMessageParams): Effect.Effect<true, TelegramBotApiError>
  unpinChatMessage(params: UnpinChatMessageParams): Effect.Effect<true, TelegramBotApiError>
  unpinAllChatMessages(params: UnpinAllChatMessagesParams): Effect.Effect<true, TelegramBotApiError>
  leaveChat(params: LeaveChatParams): Effect.Effect<true, TelegramBotApiError>
  getChat(params: GetChatParams): Effect.Effect<ChatFullInfo, TelegramBotApiError>
  getChatAdministrators(params: GetChatAdministratorsParams): Effect.Effect<Array<ChatMember>, TelegramBotApiError>
  getChatMemberCount(params: GetChatMemberCountParams): Effect.Effect<Integer, TelegramBotApiError>
  getChatMember(params: GetChatMemberParams): Effect.Effect<ChatMember, TelegramBotApiError>
  setChatStickerSet(params: SetChatStickerSetParams): Effect.Effect<true, TelegramBotApiError>
  deleteChatStickerSet(params: DeleteChatStickerSetParams): Effect.Effect<true, TelegramBotApiError>
  getForumTopicIconStickers(): Effect.Effect<
    Array<Sticker>,
    TelegramBotApiError
  >
  createForumTopic(params: CreateForumTopicParams): Effect.Effect<ForumTopic, TelegramBotApiError>
  editForumTopic(params: EditForumTopicParams): Effect.Effect<true, TelegramBotApiError>
  closeForumTopic(params: CloseForumTopicParams): Effect.Effect<true, TelegramBotApiError>
  reopenForumTopic(params: ReopenForumTopicParams): Effect.Effect<true, TelegramBotApiError>
  deleteForumTopic(params: DeleteForumTopicParams): Effect.Effect<true, TelegramBotApiError>
  unpinAllForumTopicMessages(params: UnpinAllForumTopicMessagesParams): Effect.Effect<true, TelegramBotApiError>
  editGeneralForumTopic(params: EditGeneralForumTopicParams): Effect.Effect<true, TelegramBotApiError>
  closeGeneralForumTopic(params: CloseGeneralForumTopicParams): Effect.Effect<true, TelegramBotApiError>
  reopenGeneralForumTopic(params: ReopenGeneralForumTopicParams): Effect.Effect<true, TelegramBotApiError>
  hideGeneralForumTopic(params: HideGeneralForumTopicParams): Effect.Effect<true, TelegramBotApiError>
  unhideGeneralForumTopic(params: UnhideGeneralForumTopicParams): Effect.Effect<true, TelegramBotApiError>
  unpinAllGeneralForumTopicMessages(
    params: UnpinAllGeneralForumTopicMessagesParams
  ): Effect.Effect<true, TelegramBotApiError>
  answerCallbackQuery(params: AnswerCallbackQueryParams): Effect.Effect<true, TelegramBotApiError>
  getUserChatBoosts(params: GetUserChatBoostsParams): Effect.Effect<UserChatBoosts, TelegramBotApiError>
  getBusinessConnection(params: GetBusinessConnectionParams): Effect.Effect<BusinessConnection, TelegramBotApiError>
  setMyCommands(params: SetMyCommandsParams): Effect.Effect<true, TelegramBotApiError>
  deleteMyCommands(params?: DeleteMyCommandsParams): Effect.Effect<true, TelegramBotApiError>
  getMyCommands(params?: GetMyCommandsParams): Effect.Effect<Array<BotCommand>, TelegramBotApiError>
  setMyName(params?: SetMyNameParams): Effect.Effect<true, TelegramBotApiError>
  getMyName(params?: GetMyNameParams): Effect.Effect<BotName, TelegramBotApiError>
  setMyDescription(params?: SetMyDescriptionParams): Effect.Effect<true, TelegramBotApiError>
  getMyDescription(params?: GetMyDescriptionParams): Effect.Effect<BotDescription, TelegramBotApiError>
  setMyShortDescription(params?: SetMyShortDescriptionParams): Effect.Effect<true, TelegramBotApiError>
  getMyShortDescription(params?: GetMyShortDescriptionParams): Effect.Effect<BotShortDescription, TelegramBotApiError>
  setChatMenuButton(params?: SetChatMenuButtonParams): Effect.Effect<true, TelegramBotApiError>
  getChatMenuButton(params?: GetChatMenuButtonParams): Effect.Effect<MenuButton, TelegramBotApiError>
  setMyDefaultAdministratorRights(
    params?: SetMyDefaultAdministratorRightsParams
  ): Effect.Effect<true, TelegramBotApiError>
  getMyDefaultAdministratorRights(
    params?: GetMyDefaultAdministratorRightsParams
  ): Effect.Effect<ChatAdministratorRights, TelegramBotApiError>
  getAvailableGifts(): Effect.Effect<Gifts, TelegramBotApiError>
  sendGift(params: SendGiftParams): Effect.Effect<true, TelegramBotApiError>
  giftPremiumSubscription(params: GiftPremiumSubscriptionParams): Effect.Effect<true, TelegramBotApiError>
  verifyUser(params: VerifyUserParams): Effect.Effect<true, TelegramBotApiError>
  verifyChat(params: VerifyChatParams): Effect.Effect<true, TelegramBotApiError>
  removeUserVerification(): Effect.Effect<true, TelegramBotApiError>
  removeChatVerification(): Effect.Effect<true, TelegramBotApiError>
  readBusinessMessage(params: ReadBusinessMessageParams): Effect.Effect<true, TelegramBotApiError>
  deleteBusinessMessages(params: DeleteBusinessMessagesParams): Effect.Effect<true, TelegramBotApiError>
  setBusinessAccountName(params: SetBusinessAccountNameParams): Effect.Effect<true, TelegramBotApiError>
  setBusinessAccountUsername(params: SetBusinessAccountUsernameParams): Effect.Effect<true, TelegramBotApiError>
  setBusinessAccountBio(params: SetBusinessAccountBioParams): Effect.Effect<true, TelegramBotApiError>
  setBusinessAccountProfilePhoto(params: SetBusinessAccountProfilePhotoParams): Effect.Effect<true, TelegramBotApiError>
  removeBusinessAccountProfilePhoto(): Effect.Effect<true, TelegramBotApiError>
  setBusinessAccountGiftSettings(params: SetBusinessAccountGiftSettingsParams): Effect.Effect<true, TelegramBotApiError>
  getBusinessAccountStarBalance(): Effect.Effect<
    StarAmount,
    TelegramBotApiError
  >
  transferBusinessAccountStars(params: TransferBusinessAccountStarsParams): Effect.Effect<true, TelegramBotApiError>
  getBusinessAccountGifts(): Effect.Effect<Gifts, TelegramBotApiError>
  convertGiftToStars(params: ConvertGiftToStarsParams): Effect.Effect<true, TelegramBotApiError>
  upgradeGift(params: UpgradeGiftParams): Effect.Effect<true, TelegramBotApiError>
  transferGift(params: TransferGiftParams): Effect.Effect<true, TelegramBotApiError>
  postStory(params: PostStoryParams): Effect.Effect<Message, TelegramBotApiError>
  editStory(params: EditStoryParams): Effect.Effect<true, TelegramBotApiError>
  deleteStory(params: DeleteStoryParams): Effect.Effect<true, TelegramBotApiError>

  // Updating messages
  editMessageText(params: EditMessageTextParams): Effect.Effect<Message | true, TelegramBotApiError>
  editMessageCaption(params: EditMessageCaptionParams): Effect.Effect<Message | true, TelegramBotApiError>
  editMessageMedia(params: EditMessageMediaParams): Effect.Effect<Message | true, TelegramBotApiError>
  editMessageLiveLocation(params: EditMessageLiveLocationParams): Effect.Effect<Message | true, TelegramBotApiError>
  stopMessageLiveLocation(params: StopMessageLiveLocationParams): Effect.Effect<Message | true, TelegramBotApiError>
  editMessageChecklist(params: EditMessageChecklistParams): Effect.Effect<Message | true, TelegramBotApiError>
  editMessageReplyMarkup(params: EditMessageReplyMarkupParams): Effect.Effect<Message | true, TelegramBotApiError>
  stopPoll(params: StopPollParams): Effect.Effect<Poll, TelegramBotApiError>
  approveSuggestedPost(params: ApproveSuggestedPostParams): Effect.Effect<true, TelegramBotApiError>
  declineSuggestedPost(params: DeclineSuggestedPostParams): Effect.Effect<true, TelegramBotApiError>
  deleteMessage(params: DeleteMessageParams): Effect.Effect<true, TelegramBotApiError>
  deleteMessages(params: DeleteMessagesParams): Effect.Effect<true, TelegramBotApiError>

  // Stickers
  sendSticker(params: SendStickerParams): Effect.Effect<Message, TelegramBotApiError>
  getStickerSet(params: GetStickerSetParams): Effect.Effect<StickerSet, TelegramBotApiError>
  getCustomEmojiStickers(params: GetCustomEmojiStickersParams): Effect.Effect<Array<Sticker>, TelegramBotApiError>
  uploadStickerFile(params: UploadStickerFileParams): Effect.Effect<File, TelegramBotApiError>
  createNewStickerSet(params: CreateNewStickerSetParams): Effect.Effect<true, TelegramBotApiError>
  addStickerToSet(params: AddStickerToSetParams): Effect.Effect<true, TelegramBotApiError>
  setStickerPositionInSet(params: SetStickerPositionInSetParams): Effect.Effect<true, TelegramBotApiError>
  deleteStickerFromSet(params: DeleteStickerFromSetParams): Effect.Effect<true, TelegramBotApiError>
  replaceStickerInSet(params: ReplaceStickerInSetParams): Effect.Effect<true, TelegramBotApiError>
  setStickerEmojiList(params: SetStickerEmojiListParams): Effect.Effect<true, TelegramBotApiError>
  setStickerKeywords(params: SetStickerKeywordsParams): Effect.Effect<true, TelegramBotApiError>
  setStickerMaskPosition(params: SetStickerMaskPositionParams): Effect.Effect<true, TelegramBotApiError>
  setStickerSetTitle(params: SetStickerSetTitleParams): Effect.Effect<true, TelegramBotApiError>
  setStickerSetThumbnail(params: SetStickerSetThumbnailParams): Effect.Effect<true, TelegramBotApiError>
  setCustomEmojiStickerSetThumbnail(
    params: SetCustomEmojiStickerSetThumbnailParams
  ): Effect.Effect<true, TelegramBotApiError>
  deleteStickerSet(params: DeleteStickerSetParams): Effect.Effect<true, TelegramBotApiError>

  // Inline mode
  answerInlineQuery(params: AnswerInlineQueryParams): Effect.Effect<true, TelegramBotApiError>
  answerWebAppQuery(params: AnswerWebAppQueryParams): Effect.Effect<SentWebAppMessage, TelegramBotApiError>
  savePreparedInlineMessage(
    params: SavePreparedInlineMessageParams
  ): Effect.Effect<PreparedInlineMessage, TelegramBotApiError>

  // Payments
  sendInvoice(params: SendInvoiceParams): Effect.Effect<Message, TelegramBotApiError>
  createInvoiceLink(params: CreateInvoiceLinkParams): Effect.Effect<String, TelegramBotApiError>
  answerShippingQuery(params: AnswerShippingQueryParams): Effect.Effect<true, TelegramBotApiError>
  answerPreCheckoutQuery(params: AnswerPreCheckoutQueryParams): Effect.Effect<true, TelegramBotApiError>
  getMyStarBalance(): Effect.Effect<StarAmount, TelegramBotApiError>
  getStarTransactions(params: GetStarTransactionsParams): Effect.Effect<StarTransactions, TelegramBotApiError>
  refundStarPayment(params: RefundStarPaymentParams): Effect.Effect<true, TelegramBotApiError>
  editUserStarSubscription(params: EditUserStarSubscriptionParams): Effect.Effect<true, TelegramBotApiError>

  // Telegram Passport
  setPassportDataErrors(params: SetPassportDataErrorsParams): Effect.Effect<true, TelegramBotApiError>

  // Games
  sendGame(params: SendGameParams): Effect.Effect<Message, TelegramBotApiError>
  setGameScore(params: SetGameScoreParams): Effect.Effect<Message | true, TelegramBotApiError>
  getGameHighScores(params: GetGameHighScoresParams): Effect.Effect<Array<GameHighScore>, TelegramBotApiError>
}

export class TelegramBotApiServiceContext extends Context.Tag(
  "@services/TelegramBotApiService"
)<TelegramBotApiServiceContext, TelegramBotApiService>() {}

/**
 * Live implementation of the Telegram Bot API Service
 */

export const TelegramBotApiServiceLive = Layer.effect(
  TelegramBotApiServiceContext,
  Effect.gen(function*() {
    const config = yield* TelegramBotApiConfigContext

    return TelegramBotApiServiceContext.of({
      // Getting updates
      getUpdates: (params) => executeTelegramRequest("getUpdates", params, config),
      setWebhook: (params) => executeTelegramRequest("setWebhook", params, config),
      deleteWebhook: (params) => executeTelegramRequest("deleteWebhook", params, config),
      getWebhookInfo: () => executeTelegramRequest("getWebhookInfo", {}, config),

      // Available methods
      getMe: () => executeTelegramRequest("getMe", {}, config),
      logOut: () => executeTelegramRequest("logOut", {}, config),
      close: () => executeTelegramRequest("close", {}, config),
      sendMessage: (params) => executeTelegramRequest("sendMessage", params, config),
      forwardMessage: (params) => executeTelegramRequest("forwardMessage", params, config),
      forwardMessages: (params) => executeTelegramRequest("forwardMessages", params, config),
      copyMessage: (params) => executeTelegramRequest("copyMessage", params, config),
      copyMessages: (params) => executeTelegramRequest("copyMessages", params, config),
      sendPhoto: (params) => executeTelegramRequest("sendPhoto", params, config),
      sendAudio: (params) => executeTelegramRequest("sendAudio", params, config),
      sendDocument: (params) => executeTelegramRequest("sendDocument", params, config),
      sendVideo: (params) => executeTelegramRequest("sendVideo", params, config),
      sendAnimation: (params) => executeTelegramRequest("sendAnimation", params, config),
      sendVoice: (params) => executeTelegramRequest("sendVoice", params, config),
      sendVideoNote: (params) => executeTelegramRequest("sendVideoNote", params, config),
      sendPaidMedia: (params) => executeTelegramRequest("sendPaidMedia", params, config),
      sendMediaGroup: (params) => executeTelegramRequest("sendMediaGroup", params, config),
      sendLocation: (params) => executeTelegramRequest("sendLocation", params, config),
      sendVenue: (params) => executeTelegramRequest("sendVenue", params, config),
      sendContact: (params) => executeTelegramRequest("sendContact", params, config),
      sendPoll: (params) => executeTelegramRequest("sendPoll", params, config),
      sendChecklist: (params) => executeTelegramRequest("sendChecklist", params, config),
      sendDice: (params) => executeTelegramRequest("sendDice", params, config),
      sendChatAction: (params) => executeTelegramRequest("sendChatAction", params, config),
      setMessageReaction: (params) => executeTelegramRequest("setMessageReaction", params, config),
      getUserProfilePhotos: (params) => executeTelegramRequest("getUserProfilePhotos", params, config),
      setUserEmojiStatus: (params) => executeTelegramRequest("setUserEmojiStatus", params, config),
      getFile: (params) => executeTelegramRequest("getFile", params, config),
      banChatMember: (params) => executeTelegramRequest("banChatMember", params, config),
      unbanChatMember: (params) => executeTelegramRequest("unbanChatMember", params, config),
      restrictChatMember: (params) => executeTelegramRequest("restrictChatMember", params, config),
      promoteChatMember: (params) => executeTelegramRequest("promoteChatMember", params, config),
      setChatAdministratorCustomTitle: (params) =>
        executeTelegramRequest("setChatAdministratorCustomTitle", params, config),
      banChatSenderChat: (params) => executeTelegramRequest("banChatSenderChat", params, config),
      unbanChatSenderChat: (params) => executeTelegramRequest("unbanChatSenderChat", params, config),
      setChatPermissions: (params) => executeTelegramRequest("setChatPermissions", params, config),
      exportChatInviteLink: (params) => executeTelegramRequest("exportChatInviteLink", params, config),
      createChatInviteLink: (params) => executeTelegramRequest("createChatInviteLink", params, config),
      editChatInviteLink: (params) => executeTelegramRequest("editChatInviteLink", params, config),
      createChatSubscriptionInviteLink: (params) =>
        executeTelegramRequest("createChatSubscriptionInviteLink", params, config),
      editChatSubscriptionInviteLink: (params) =>
        executeTelegramRequest("editChatSubscriptionInviteLink", params, config),
      revokeChatInviteLink: (params) => executeTelegramRequest("revokeChatInviteLink", params, config),
      approveChatJoinRequest: (params) => executeTelegramRequest("approveChatJoinRequest", params, config),
      declineChatJoinRequest: (params) => executeTelegramRequest("declineChatJoinRequest", params, config),
      setChatPhoto: (params) => executeTelegramRequest("setChatPhoto", params, config),
      deleteChatPhoto: (params) => executeTelegramRequest("deleteChatPhoto", params, config),
      setChatTitle: (params) => executeTelegramRequest("setChatTitle", params, config),
      setChatDescription: (params) => executeTelegramRequest("setChatDescription", params, config),
      pinChatMessage: (params) => executeTelegramRequest("pinChatMessage", params, config),
      unpinChatMessage: (params) => executeTelegramRequest("unpinChatMessage", params, config),
      unpinAllChatMessages: (params) => executeTelegramRequest("unpinAllChatMessages", params, config),
      leaveChat: (params) => executeTelegramRequest("leaveChat", params, config),
      getChat: (params) => executeTelegramRequest("getChat", params, config),
      getChatAdministrators: (params) => executeTelegramRequest("getChatAdministrators", params, config),
      getChatMemberCount: (params) => executeTelegramRequest("getChatMemberCount", params, config),
      getChatMember: (params) => executeTelegramRequest("getChatMember", params, config),
      setChatStickerSet: (params) => executeTelegramRequest("setChatStickerSet", params, config),
      deleteChatStickerSet: (params) => executeTelegramRequest("deleteChatStickerSet", params, config),
      getForumTopicIconStickers: () => executeTelegramRequest("getForumTopicIconStickers", {}, config),
      createForumTopic: (params) => executeTelegramRequest("createForumTopic", params, config),
      editForumTopic: (params) => executeTelegramRequest("editForumTopic", params, config),
      closeForumTopic: (params) => executeTelegramRequest("closeForumTopic", params, config),
      reopenForumTopic: (params) => executeTelegramRequest("reopenForumTopic", params, config),
      deleteForumTopic: (params) => executeTelegramRequest("deleteForumTopic", params, config),
      unpinAllForumTopicMessages: (params) => executeTelegramRequest("unpinAllForumTopicMessages", params, config),
      editGeneralForumTopic: (params) => executeTelegramRequest("editGeneralForumTopic", params, config),
      closeGeneralForumTopic: (params) => executeTelegramRequest("closeGeneralForumTopic", params, config),
      reopenGeneralForumTopic: (params) => executeTelegramRequest("reopenGeneralForumTopic", params, config),
      hideGeneralForumTopic: (params) => executeTelegramRequest("hideGeneralForumTopic", params, config),
      unhideGeneralForumTopic: (params) => executeTelegramRequest("unhideGeneralForumTopic", params, config),
      unpinAllGeneralForumTopicMessages: (params) =>
        executeTelegramRequest("unpinAllGeneralForumTopicMessages", params, config),
      answerCallbackQuery: (params) => executeTelegramRequest("answerCallbackQuery", params, config),
      getUserChatBoosts: (params) => executeTelegramRequest("getUserChatBoosts", params, config),
      getBusinessConnection: (params) => executeTelegramRequest("getBusinessConnection", params, config),
      setMyCommands: (params) => executeTelegramRequest("setMyCommands", params, config),
      deleteMyCommands: (params) => executeTelegramRequest("deleteMyCommands", params, config),
      getMyCommands: (params) => executeTelegramRequest("getMyCommands", params, config),
      setMyName: (params) => executeTelegramRequest("setMyName", params, config),
      getMyName: (params) => executeTelegramRequest("getMyName", params, config),
      setMyDescription: (params) => executeTelegramRequest("setMyDescription", params, config),
      getMyDescription: (params) => executeTelegramRequest("getMyDescription", params, config),
      setMyShortDescription: (params) => executeTelegramRequest("setMyShortDescription", params, config),
      getMyShortDescription: (params) => executeTelegramRequest("getMyShortDescription", params, config),
      setChatMenuButton: (params) => executeTelegramRequest("setChatMenuButton", params, config),
      getChatMenuButton: (params) => executeTelegramRequest("getChatMenuButton", params, config),
      setMyDefaultAdministratorRights: (params) =>
        executeTelegramRequest("setMyDefaultAdministratorRights", params, config),
      getMyDefaultAdministratorRights: (params) =>
        executeTelegramRequest("getMyDefaultAdministratorRights", params, config),
      getAvailableGifts: () => executeTelegramRequest("getAvailableGifts", {}, config),
      sendGift: (params) => executeTelegramRequest("sendGift", params, config),
      giftPremiumSubscription: (params) => executeTelegramRequest("giftPremiumSubscription", params, config),
      verifyUser: (params) => executeTelegramRequest("verifyUser", params, config),
      verifyChat: (params) => executeTelegramRequest("verifyChat", params, config),
      removeUserVerification: () => executeTelegramRequest("removeUserVerification", {}, config),
      removeChatVerification: () => executeTelegramRequest("removeChatVerification", {}, config),
      readBusinessMessage: (params) => executeTelegramRequest("readBusinessMessage", params, config),
      deleteBusinessMessages: (params) => executeTelegramRequest("deleteBusinessMessages", params, config),
      setBusinessAccountName: (params) => executeTelegramRequest("setBusinessAccountName", params, config),
      setBusinessAccountUsername: (params) => executeTelegramRequest("setBusinessAccountUsername", params, config),
      setBusinessAccountBio: (params) => executeTelegramRequest("setBusinessAccountBio", params, config),
      setBusinessAccountProfilePhoto: (params) =>
        executeTelegramRequest("setBusinessAccountProfilePhoto", params, config),
      removeBusinessAccountProfilePhoto: () => executeTelegramRequest("removeBusinessAccountProfilePhoto", {}, config),
      setBusinessAccountGiftSettings: (params) =>
        executeTelegramRequest("setBusinessAccountGiftSettings", params, config),
      getBusinessAccountStarBalance: () => executeTelegramRequest("getBusinessAccountStarBalance", {}, config),
      transferBusinessAccountStars: (params) => executeTelegramRequest("transferBusinessAccountStars", params, config),
      getBusinessAccountGifts: () => executeTelegramRequest("getBusinessAccountGifts", {}, config),
      convertGiftToStars: (params) => executeTelegramRequest("convertGiftToStars", params, config),
      upgradeGift: (params) => executeTelegramRequest("upgradeGift", params, config),
      transferGift: (params) => executeTelegramRequest("transferGift", params, config),
      postStory: (params) => executeTelegramRequest("postStory", params, config),
      editStory: (params) => executeTelegramRequest("editStory", params, config),
      deleteStory: (params) => executeTelegramRequest("deleteStory", params, config),

      // Updating messages
      editMessageText: (params) => executeTelegramRequest("editMessageText", params, config),
      editMessageCaption: (params) => executeTelegramRequest("editMessageCaption", params, config),
      editMessageMedia: (params) => executeTelegramRequest("editMessageMedia", params, config),
      editMessageLiveLocation: (params) => executeTelegramRequest("editMessageLiveLocation", params, config),
      stopMessageLiveLocation: (params) => executeTelegramRequest("stopMessageLiveLocation", params, config),
      editMessageChecklist: (params) => executeTelegramRequest("editMessageChecklist", params, config),
      editMessageReplyMarkup: (params) => executeTelegramRequest("editMessageReplyMarkup", params, config),
      stopPoll: (params) => executeTelegramRequest("stopPoll", params, config),
      approveSuggestedPost: (params) => executeTelegramRequest("approveSuggestedPost", params, config),
      declineSuggestedPost: (params) => executeTelegramRequest("declineSuggestedPost", params, config),
      deleteMessage: (params) => executeTelegramRequest("deleteMessage", params, config),
      deleteMessages: (params) => executeTelegramRequest("deleteMessages", params, config),

      // Stickers
      sendSticker: (params) => executeTelegramRequest("sendSticker", params, config),
      getStickerSet: (params) => executeTelegramRequest("getStickerSet", params, config),
      getCustomEmojiStickers: (params) => executeTelegramRequest("getCustomEmojiStickers", params, config),
      uploadStickerFile: (params) => executeTelegramRequest("uploadStickerFile", params, config),
      createNewStickerSet: (params) => executeTelegramRequest("createNewStickerSet", params, config),
      addStickerToSet: (params) => executeTelegramRequest("addStickerToSet", params, config),
      setStickerPositionInSet: (params) => executeTelegramRequest("setStickerPositionInSet", params, config),
      deleteStickerFromSet: (params) => executeTelegramRequest("deleteStickerFromSet", params, config),
      replaceStickerInSet: (params) => executeTelegramRequest("replaceStickerInSet", params, config),
      setStickerEmojiList: (params) => executeTelegramRequest("setStickerEmojiList", params, config),
      setStickerKeywords: (params) => executeTelegramRequest("setStickerKeywords", params, config),
      setStickerMaskPosition: (params) => executeTelegramRequest("setStickerMaskPosition", params, config),
      setStickerSetTitle: (params) => executeTelegramRequest("setStickerSetTitle", params, config),
      setStickerSetThumbnail: (params) => executeTelegramRequest("setStickerSetThumbnail", params, config),
      setCustomEmojiStickerSetThumbnail: (params) =>
        executeTelegramRequest("setCustomEmojiStickerSetThumbnail", params, config),
      deleteStickerSet: (params) => executeTelegramRequest("deleteStickerSet", params, config),

      // Inline mode
      answerInlineQuery: (params) => executeTelegramRequest("answerInlineQuery", params, config),
      answerWebAppQuery: (params) => executeTelegramRequest("answerWebAppQuery", params, config),
      savePreparedInlineMessage: (params) => executeTelegramRequest("savePreparedInlineMessage", params, config),

      // Payments
      sendInvoice: (params) => executeTelegramRequest("sendInvoice", params, config),
      createInvoiceLink: (params) => executeTelegramRequest("createInvoiceLink", params, config),
      answerShippingQuery: (params) => executeTelegramRequest("answerShippingQuery", params, config),
      answerPreCheckoutQuery: (params) => executeTelegramRequest("answerPreCheckoutQuery", params, config),
      getMyStarBalance: () => executeTelegramRequest("getMyStarBalance", {}, config),
      getStarTransactions: (params) => executeTelegramRequest("getStarTransactions", params, config),
      refundStarPayment: (params) => executeTelegramRequest("refundStarPayment", params, config),
      editUserStarSubscription: (params) => executeTelegramRequest("editUserStarSubscription", params, config),

      // Telegram Passport
      setPassportDataErrors: (params) => executeTelegramRequest("setPassportDataErrors", params, config),

      // Games
      sendGame: (params) => executeTelegramRequest("sendGame", params, config),
      setGameScore: (params) => executeTelegramRequest("setGameScore", params, config),
      getGameHighScores: (params) => executeTelegramRequest("getGameHighScores", params, config)
    })
  })
)

// =============================================================================
// Configuration Layer
// =============================================================================

/**
 * Configuration for the Telegram Bot API Service
 */
export interface TelegramBotApiConfig {
  readonly apiBaseUrl: string
  readonly rateLimitDelay: number
  readonly retryAttempts: number
  readonly retryDelay: number
  readonly timeout: number
  readonly token: Redacted.Redacted
}

export class TelegramBotApiConfigContext extends Context.Tag(
  "@services/TelegramBotApiConfig"
)<TelegramBotApiConfigContext, TelegramBotApiConfig>() {}

/**
 * Configuration layer that loads settings from environment variables
 */
export const TelegramBotApiConfigLive = Layer.effect(
  TelegramBotApiConfigContext,
  Effect.gen(function*() {
    const apiBaseUrl = yield* Config.withDefault(
      Config.string("TELEGRAM_API_BASE_URL"),
      "https://api.telegram.org/bot"
    )
    const rateLimitDelay = yield* Config.withDefault(
      Config.number("TELEGRAM_RATE_LIMIT_DELAY"),
      1000
    )
    const retryAttempts = yield* Config.withDefault(
      Config.number("TELEGRAM_RETRY_ATTEMPTS"),
      3
    )
    const retryDelay = yield* Config.withDefault(
      Config.number("TELEGRAM_RETRY_DELAY"),
      1000
    )
    const timeout = yield* Config.withDefault(
      Config.number("TELEGRAM_REQUEST_TIMEOUT"),
      30000
    )
    const token = yield* Config.redacted("TELEGRAM_BOT_TOKEN").pipe(
      Effect.filterOrFail(
        (token) => Redacted.value(token) !== "",
        () => new Error("TELEGRAM_BOT_TOKEN must not be empty")
      )
    )

    return {
      apiBaseUrl,
      rateLimitDelay,
      retryAttempts,
      retryDelay,
      timeout,
      token
    }
  })
)
