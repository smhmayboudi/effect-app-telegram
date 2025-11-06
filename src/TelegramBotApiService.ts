/**
 * Comprehensive Telegram Bot API Service Implementation
 * Using the Effect-TS ecosystem
 *
 * This file contains a complete implementation of all Telegram Bot API methods
 * with proper type safety, error handling, and documentation.
 */

import { Config, Context, Data, Effect, Layer, pipe, Secret } from "effect";

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
  readonly message: string;
  /** The API method where the error occurred, if applicable */
  readonly method?: string;
}> {}

/**
 * Error for HTTP-related issues (network, timeout, etc.)
 * This error is thrown when there are network issues or timeouts
 */
export class TelegramBotApiNetworkError extends Data.TaggedError(
  "TelegramBotApiNetworkError"
)<{
  /** Error message describing the network issue */
  readonly message: string;
  /** The API method where the network error occurred, if applicable */
  readonly method?: string;
  /** The underlying error that caused this network error */
  readonly cause?: unknown;
}> {}

/**
 * Error for invalid response from the API
 * This error is thrown when the API returns an unexpected or malformed response
 */
export class TelegramBotApiInvalidResponseError extends Data.TaggedError(
  "TelegramBotApiInvalidResponseError"
)<{
  /** Error message describing the invalid response */
  readonly message: string;
  /** The API method where the invalid response occurred, if applicable */
  readonly method?: string;
  /** The actual response that was considered invalid */
  readonly response?: unknown;
}> {}

/**
 * Error for rate limiting by the Telegram API
 * This error is thrown when the API returns a 429 status code indicating rate limiting
 */
export class TelegramBotApiRateLimitError extends Data.TaggedError(
  "TelegramBotApiRateLimitError"
)<{
  /** Error message describing the rate limit issue */
  readonly message: string;
  /** The API method that triggered the rate limit */
  readonly method?: string;
  /** Number of seconds to wait before making another request, if provided by the API */
  readonly retryAfter?: number;
}> {}

/**
 * Error for unauthorized access to the API
 * This error is thrown when the API returns a 401 or 403 status code
 */
export class TelegramBotApiUnauthorizedError extends Data.TaggedError(
  "TelegramBotApiUnauthorizedError"
)<{
  /** Error message describing the authorization issue */
  readonly message: string;
  /** The API method where the unauthorized access occurred, if applicable */
  readonly method?: string;
}> {}

/**
 * Error for method-specific issues (e.g., wrong parameters)
 * This error is thrown when the API returns an error specific to a method call
 */
export class TelegramBotApiMethodError extends Data.TaggedError(
  "TelegramBotApiMethodError"
)<{
  /** Error message from the API */
  readonly message: string;
  /** The API method that resulted in the error */
  readonly method: string;
  /** Parameters passed to the method that resulted in the error */
  readonly parameters?: Record<string, unknown>;
}> {}

/**
 * Error for file upload/download issues
 * This error is thrown when there are issues with file operations
 */
export class TelegramBotApiFileError extends Data.TaggedError(
  "TelegramBotApiFileError"
)<{
  /** Error message describing the file issue */
  readonly message: string;
  /** The API method where the file error occurred, if applicable */
  readonly method?: string;
  /** Name of the file that caused the issue */
  readonly fileName?: string;
}> {}

/**
 * Error for parsing issues
 * This error is thrown when there are issues parsing data or responses
 */
export class TelegramBotApiParseError extends Data.TaggedError(
  "TelegramBotApiParseError"
)<{
  /** Error message describing the parsing issue */
  readonly message: string;
  /** The API method where the parsing error occurred, if applicable */
  readonly method?: string;
  /** The field that failed to parse */
  readonly field?: string;
  /** The value that failed to parse */
  readonly value?: unknown;
}> {}

// =============================================================================
// Type Definitions
// =============================================================================

// Basic types
export type Integer = number;
export type Float = number;
export type True = boolean;
export type Boolean = boolean;
export type String = string;

/**
 * This object represents an incoming update.
 * @see https://core.telegram.org/bots/api#update
 */
export interface Update {
  /** The update's unique identifier. Update identifiers start from a certain positive number and increase sequentially. This ID becomes especially handy if you're using webhooks, since it allows you to ignore repeated updates or to restore the correct update sequence should they get out of order. If there are no new updates for at least a week, the ID starts over. */
  update_id: Integer;
  /** Optional. New incoming message of any kind - text, photo, sticker, etc. */
  message?: Message;
  /** Optional. New version of a message that is known to the bot and was edited */
  edited_message?: Message;
  /** Optional. New incoming channel post of any kind - text, photo, sticker, etc. */
  channel_post?: Message;
  /** Optional. New version of a channel post that is known to the bot and was edited */
  edited_channel_post?: Message;
  /** Optional. The bot was connected to or disconnected from a business account, or a user subscribed to or unsubscribed from this bot. The update contains a JSON-serialized BusinessConnection object. */
  business_connection?: BusinessConnection;
  /** Optional. New non-service message from a connected business account. The field works only for business accounts that are connected to the bot. */
  business_message?: Message;
  /** Optional. New version of a message from a connected business account. The field works only for business accounts that are connected to the bot. */
  edited_business_message?: Message;
  /** Optional. Messages were deleted from a connected business account. The field works only for business accounts that are connected to the bot. */
  deleted_business_messages?: BusinessMessagesDeleted;
  /** Optional. A message was automatically forwarded to the bot's chat with the comment chat */
  message_reaction?: MessageReactionUpdated;
  /** Optional. Reactions were changed on a message in a chat. The bot must be an administrator in the chat and must explicitly specify "message_reaction_count" in the list of allowed_updates to receive these updates. */
  message_reaction_count?: MessageReactionCountUpdated;
  /** Optional. New incoming inline query */
  inline_query?: InlineQuery;
  /** Optional. The result of an inline query that was chosen by a user and sent to their chat partner. Please see our documentation on the feedback collecting for details on how to enable these updates for your bot. */
  chosen_inline_result?: ChosenInlineResult;
  /** Optional. New incoming callback query */
  callback_query?: CallbackQuery;
  /** Optional. New incoming shipping query. Only for invoices with flexible price */
  shipping_query?: ShippingQuery;
  /** Optional. New incoming pre-checkout query. Contains full information about checkout */
  pre_checkout_query?: PreCheckoutQuery;
  /** Optional. The paid media was purchased */
  purchased_paid_media?: PaidMediaPurchased;
  /** Optional. New poll state. Bots receive only updates about stopped polls and polls, which are sent by the bot */
  poll?: Poll;
  /** Optional. A user changed their answer in a non-anonymous poll. Bots receive new votes only in polls that were sent by the bot itself. */
  poll_answer?: PollAnswer;
  /** Optional. The bot's chat member status was updated in a chat. For private chats, this update is received only when the bot is blocked or unblocked by the user. */
  my_chat_member?: ChatMemberUpdated;
  /** Optional. A chat member's status was updated in a chat. The bot must be an administrator in the chat and must explicitly specify "chat_member" in the list of allowed_updates to receive these updates. */
  chat_member?: ChatMemberUpdated;
  /** Optional. A request to join the chat has been sent. The bot must have the can_invite_users administrator right in the chat to receive these updates. */
  chat_join_request?: ChatJoinRequest;
  /** Optional. A user changed their emoji status */
  chat_boost?: ChatBoostUpdated;
  /** Optional. A boost was removed from a chat */
  removed_chat_boost?: ChatBoostRemoved;
}

/**
 * Contains information about the current status of a webhook.
 * @see https://core.telegram.org/bots/api#webhookinfo
 */
export interface WebhookInfo {
  /** Webhook URL, may be empty if webhook is not set up */
  url: string;
  /** True, if a custom certificate was provided for webhook certificate checks */
  has_custom_certificate: boolean;
  /** Number of updates awaiting delivery */
  pending_update_count: Integer;
  /** Optional. Currently used webhook IP address */
  ip_address?: string;
  /** Optional. Unix time for the most recent error that happened when processing an update */
  last_error_date?: Integer;
  /** Optional. Error message in human-readable format for the most recent error that happened when processing an update */
  last_error_message?: string;
  /** Optional. Unix time of the most recent error that happened when trying to deliver an update via webhook */
  last_synchronization_error_date?: Integer;
  /** Optional. The maximum allowed number of simultaneous HTTPS connections to the webhook for update delivery */
  max_connections?: Integer;
  /** Optional. A list of update types the bot is subscribed to. Defaults to all update types except chat_member */
  allowed_updates?: Array<string>;
}

/**
 * This object represents a Telegram user or bot.
 * @see https://core.telegram.org/bots/api#user
 */
export interface User {
  /** Unique identifier for this user or bot. This number may have more than 32 significant bits and some programming languages may have difficulty/silent defects in interpreting it. But it has at most 52 significant bits, so a 64-bit integer or double-precision float type are safe for storing this identifier. */
  id: Integer;
  /** True, if this user is a bot */
  is_bot: boolean;
  /** User's or bot's first name */
  first_name: string;
  /** Optional. User's or bot's last name */
  last_name?: string;
  /** Optional. User's or bot's username */
  username?: string;
  /** Optional. IETF language tag of the user's language */
  language_code?: string;
  /** Optional. True, if this user is a Telegram Premium user */
  is_premium?: true;
  /** Optional. True, if this user added the bot to the attachment menu */
  added_to_attachment_menu?: true;
  /** Optional. True, if the bot can be invited to groups. Returned only in getMe. */
  can_join_groups?: boolean;
  /** Optional. True, if privacy mode is disabled for the bot. Returned only in getMe. */
  can_read_all_group_messages?: boolean;
  /** Optional. True, if the bot supports inline queries. Returned only in getMe. */
  supports_inline_queries?: boolean;
  /** Optional. True, if the bot can be connected to Telegram Business. Returned only in getMe. */
  can_connect_to_business?: boolean;
  /** Optional. True, if the bot placed on the main page of the user's Telegram app. Returned only in getMe. */
  has_main_web_app?: boolean;
}

/**
 * This object represents a chat.
 * @see https://core.telegram.org/bots/api#chat
 */
export interface Chat {
  /** Unique identifier for this chat. This number may have more than 32 significant bits and some programming languages may have difficulty/silent defects in interpreting it. But it has at most 52 significant bits, so a 64-bit integer or double-precision float type are safe for storing this identifier. The bot must be an administrator in the chat to send messages or get information beyond this. */
  id: Integer;
  /** Type of chat, can be either “private”, “group”, “supergroup” or “channel” */
  type: string;
  /** Optional. Title, for supergroups, channels and group chats */
  title?: string;
  /** Optional. Username, for private chats, supergroups and channels if available */
  username?: string;
  /** Optional. First name of the other party in a private chat */
  first_name?: string;
  /** Optional. Last name of the other party in a private chat */
  last_name?: string;
  /** Optional. True, if the supergroup chat is a forum (has topics enabled) */
  is_forum?: true;
  /** Optional. True, if the chat is the direct messages chat of a channel */
  is_direct_messages?: true;
}

/**
 * This object contains full information about a chat.
 * @see https://core.telegram.org/bots/api#chatfullinfo
 */
export interface ChatFullInfo {
  /** Unique identifier for this chat. This number may have more than 32 significant bits and some programming languages may have difficulty/silent defects in interpreting it. But it has at most 52 significant bits, so a 64-bit integer or double-precision float type are safe for storing this identifier. The bot must be an administrator in the chat to send messages or get information beyond this. */
  id: Integer;
  /** Type of chat, can be either “private”, “group”, “supergroup” or “channel” */
  type: string;
  /** Optional. Title, for supergroups, channels and group chats */
  title?: string;
  /** Optional. Username, for private chats, supergroups and channels if available */
  username?: string;
  /** Optional. First name of the other party in a private chat */
  first_name?: string;
  /** Optional. Last name of the other party in a private chat */
  last_name?: string;
  /** Optional. True, if the supergroup chat is a forum (has topics enabled) */
  is_forum?: boolean;
  /** Optional. True, if the chat is the direct messages chat of a channel */
  is_direct_messages?: true;
  /** Optional. The accent color for the chat name and backgrounds of the chat photo, action menu, and accent icons */
  accent_color_id?: Integer;
  /** Optional. The maximum number of reactions that can be set on a message in the chat */
  max_reaction_count?: Integer;
  /** Optional. Chat photo */
  photo?: ChatPhoto;
  /** Optional. If non-empty, the list of all available active chat usernames; for private chats, supergroups and channels */
  active_usernames?: Array<string>;
  /** Optional. Optional. For private chats with business accounts, the intro of the business. */
  business_intro?: BusinessIntro;
  /** Optional. For private chats with business accounts, the location of the business. */
  business_location?: BusinessLocation;
  /** Optional. For private chats with business accounts, the opening hours of the business. */
  business_opening_hours?: BusinessOpeningHours;
  /** Optional. For private chats, the personal channel of the user */
  personal_chat?: Chat;
  /** Optional. Information about the corresponding channel chat; for direct messages chats only. */
  parent_chat?: Chat;
  /** Optional. For supergroups, the set of custom emoji identifiers of set custom emoji reactions available in the chat */
  available_reactions?: Array<ReactionType>;
  /** Optional. Custom emoji identifier of the chat's accent color */
  background_custom_emoji_id?: string;
  /** Optional. Chat accent color for profile pictures */
  profile_accent_color_id?: Integer;
  /** Optional. Custom emoji identifier of the chat's profile accent color */
  profile_background_custom_emoji_id?: string;
  /** Optional. Custom emoji identifier of the emoji status of the chat or the other party in a private chat */
  emoji_status_custom_emoji_id?: string;
  /** Optional. Expiration date of the emoji status of the other party in a private chat in Unix time, if any */
  emoji_status_expiration_date?: Integer;
  /** Optional. Bio of the other party in a private chat */
  bio?: string;
  /** Optional. True, if privacy settings of the other party in the private chat allows to use tg://user?id=<user_id> links only in chats with the user */
  has_private_forwards?: boolean;
  /** Optional. True, if the privacy settings of the other party restrict sending voice and video note messages in the private chat */
  has_restricted_voice_and_video_messages?: boolean;
  /** Optional. True, if users need to join the supergroup before they can send messages */
  join_to_send_messages?: boolean;
  /** Optional. True, if all users directly joining the supergroup need to be approved by supergroup administrators */
  join_by_request?: boolean;
  /** Optional. Description, for groups, supergroups and channel chats */
  description?: string;
  /** Optional. Primary invite link, for groups, supergroups and channel chats */
  invite_link?: string;
  /** Optional. The most recent pinned message (by sending date) */
  pinned_message?: Message;
  /** Optional. Default chat member permissions, for groups and supergroups */
  permissions?: ChatPermissions;
  /** Optional. Types of gifts that can be sent to the chat */
  accepted_gift_types?: Array<Gift>;
  /** Optional. True, if paid media messages can be sent or forwarded to the chat. The field is available only for supergroups and channels */
  can_send_paid_media?: boolean;
  /** Optional. For supergroups, the minimum allowed delay between consecutive messages sent by each unprivileged user; in seconds */
  slow_mode_delay?: Integer;
  /** Optional. For supergroups, the minimum number of boosts that a non-administrator user needs to add in order to ignore slow mode and chat permissions; 0 if unknown */
  unrestrict_boost_count?: Integer;
  /** Optional. The time after which all messages sent to the chat will be automatically deleted; in seconds */
  message_auto_delete_time?: Integer;
  /** Optional. True, if aggressive anti-spam checks are enabled in the supergroup. The field is only available to chat administrators */
  has_aggressive_anti_spam_enabled?: boolean;
  /** Optional. True, if non-administrators can only get the list of bots and administrators in the chat */
  has_hidden_members?: boolean;
  /** Optional. True, if messages from the chat can't be forwarded to other chats */
  has_protected_content?: boolean;
  /** Optional. True, if new chat members will have access to old messages; available only to chat administrators */
  has_visible_history?: boolean;
  /** Optional. For supergroups, name of group sticker set */
  sticker_set_name?: string;
  /** Optional. True, if the bot can change the group sticker set */
  can_set_sticker_set?: boolean;
  /** Optional. For supergroups, the name of the group's custom emoji sticker set. Custom emoji from this set can be used by all users and bots in the group */
  custom_emoji_sticker_set_name?: string;
  /** Optional. Unique identifier for the linked chat, i.e. the discussion group identifier for a channel and vice versa; for supergroups and channel chats */
  linked_chat_id?: Integer;
  /** Optional. For supergroups, the location to which the supergroup is connected */
  location?: ChatLocation;
}

/**
 * Additional interface options that can be used to automatically fill in the message text when the corresponding button is pressed.
 * @see https://core.telegram.org/bots/api#loginurl
 */
export interface LoginUrl {
  /** An HTTPS URL used to initiate the authentication flow */
  url: string;
  /** Optional. New text of the button in forwarded messages */
  forward_text?: string;
  /** Optional. Username of a bot, which will be used for user authentication */
  bot_username?: string;
  /** Optional. Pass True to request the permission for your bot to send messages to the user */
  request_write_access?: boolean;
}

/**
 * This object represents an incoming callback query from a callback button in an inline keyboard. If the button that originated the query was attached to a message sent by the bot, the field message will be present. If the button was attached to a message sent via the bot (in inline mode), the field inline_message_id will be present. Exactly one of the fields data or game_short_name will be present.
 * @see https://core.telegram.org/bots/api#callbackquery
 */
export interface CallbackQuery {
  /** Unique identifier for this query */
  id: string;
  /** Sender */
  from: User;
  /** Optional. Message with the callback button that originated the query. Note that message content and message date will not be available if the message is too old */
  message?: Message;
  /** Optional. Identifier of the message sent via the bot in inline mode, that originated the query. */
  inline_message_id?: string;
  /** Global identifier, uniquely corresponding to the chat to which the message with the callback button was sent. Useful for high scores in games. */
  chat_instance: string;
  /** Optional. Data associated with the callback button. Be aware that the message originated the query can contain no callback buttons with this data. */
  data?: string;
  /** Optional. Short name of a Game to be returned, serves as the unique identifier for the game */
  game_short_name?: string;
}

/**
 * This object represents one special entity in a text message. For example, hashtags, usernames, URLs, etc.
 * @see https://core.telegram.org/bots/api#messageentity
 */
export interface MessageEntity {
  /** Type of the entity. Currently, can be “mention” (@username), “hashtag” (#hashtag), “cashtag” ($USD), “bot_command” (/start@jobs_bot), “url” (https://telegram.org), “email” (do-not-reply@telegram.org), “phone_number” (+1-212-555-0123), “bold” (bold text), “italic” (italic text), “underline” (underlined text), “strikethrough” (strikethrough text), “spoiler” (spoiler message), “code” (monowidth string), “pre” (monowidth block), “text_link” (for clickable text URLs), “text_mention” (for users without usernames), “custom_emoji” (for inline custom emoji stickers) */
  type: string;
  /** Offset in UTF-16 code units to the start of the entity */
  offset: Integer;
  /** Length of the entity in UTF-16 code units */
  length: Integer;
  /** Optional. For “text_link” only, URL that will be opened after user taps on the text */
  url?: string;
  /** Optional. For “text_mention” only, the mentioned user */
  user?: User;
  /** Optional. For “pre” only, the programming language of the entity text */
  language?: string;
  /** Optional. For “custom_emoji” only, unique identifier of the custom emoji. Use getCustomEmojiStickers to get full information about the sticker */
  custom_emoji_id?: string;
}

/**
 * This object represents one size of a photo or a file / sticker thumbnail.
 * @see https://core.telegram.org/bots/api#photosize
 */
export interface PhotoSize {
  /** Identifier for this file, which can be used to download or reuse the file */
  file_id: string;
  /** Unique identifier for this file, which is supposed to be the same over time and for different bots. Can't be used to download or reuse the file. */
  file_unique_id: string;
  /** Photo width */
  width: Integer;
  /** Photo height */
  height: Integer;
  /** Optional. File size in bytes */
  file_size?: Integer;
}

/**
 * This object represents an audio file to be treated as music by the Telegram clients.
 * @see https://core.telegram.org/bots/api#audio
 */
export interface Audio {
  /** Identifier for this file, which can be used to download or reuse the file */
  file_id: string;
  /** Unique identifier for this file, which is supposed to be the same over time and for different bots. Can't be used to download or reuse the file. */
  file_unique_id: string;
  /** Duration of the audio in seconds as defined by the sender */
  duration: Integer;
  /** Optional. Performer of the audio as defined by the sender or by audio tags */
  performer?: string;
  /** Optional. Title of the audio as defined by the sender or by audio tags */
  title?: string;
  /** Optional. Original filename as defined by the sender */
  file_name?: string;
  /** Optional. MIME type of the file as defined by the sender */
  mime_type?: string;
  /** Optional. File size in bytes */
  file_size?: Integer;
  /** Optional. Thumbnail of the album cover to which the music file belongs */
  thumbnail?: PhotoSize;
}

/**
 * This object represents a general file (as opposed to photos, voice messages and audio messages).
 * @see https://core.telegram.org/bots/api#document
 */
export interface Document {
  /** Identifier for this file, which can be used to download or reuse the file */
  file_id: string;
  /** Unique identifier for this file, which is supposed to be the same over time and for different bots. Can't be used to download or reuse the file. */
  file_unique_id: string;
  /** Optional. Document thumbnail as defined by the sender */
  thumbnail?: PhotoSize;
  /** Optional. Original filename as defined by the sender */
  file_name?: string;
  /** Optional. MIME type of the file as defined by the sender */
  mime_type?: string;
  /** Optional. File size in bytes */
  file_size?: Integer;
}

/**
 * This object represents a video file.
 * @see https://core.telegram.org/bots/api#video
 */
export interface Video {
  /** Identifier for this file, which can be used to download or reuse the file */
  file_id: string;
  /** Unique identifier for this file, which is supposed to be the same over time and for different bots. Can't be used to download or reuse the file. */
  file_unique_id: string;
  /** Video width as defined by the sender */
  width: Integer;
  /** Video height as defined by the sender */
  height: Integer;
  /** Duration of the video in seconds as defined by the sender */
  duration: Integer;
  /** Optional. Video thumbnail */
  thumbnail?: PhotoSize;
  /** Optional. Original filename as defined by the sender */
  file_name?: string;
  /** Optional. MIME type of the file as defined by the sender */
  mime_type?: string;
  /** Optional. File size in bytes */
  file_size?: Integer;
}

/**
 * This object represents an animation file (GIF or H.264/MPEG-4 AVC without sound).
 * @see https://core.telegram.org/bots/api#animation
 */
export interface Animation {
  /** Identifier for this file, which can be used to download or reuse the file */
  file_id: string;
  /** Unique identifier for this file, which is supposed to be the same over time and for different bots. Can't be used to download or reuse the file. */
  file_unique_id: string;
  /** Video width as defined by the sender */
  width: Integer;
  /** Video height as defined by the sender */
  height: Integer;
  /** Duration of the animation in seconds as defined by the sender */
  duration: Integer;
  /** Optional. Animation thumbnail as defined by the sender */
  thumbnail?: PhotoSize;
  /** Optional. Original animation filename as defined by the sender */
  file_name?: string;
  /** Optional. MIME type of the file as defined by the sender */
  mime_type?: string;
  /** Optional. File size in bytes */
  file_size?: Integer;
}

/**
 * This object represents a voice note.
 * @see https://core.telegram.org/bots/api#voice
 */
export interface Voice {
  /** Identifier for this file, which can be used to download or reuse the file */
  file_id: string;
  /** Unique identifier for this file, which is supposed to be the same over time and for different bots. Can't be used to download or reuse the file. */
  file_unique_id: string;
  /** Duration of the audio in seconds as defined by the sender */
  duration: Integer;
  /** Optional. MIME type of the file as defined by the sender */
  mime_type?: string;
  /** Optional. File size in bytes */
  file_size?: Integer;
}

/**
 * This object represents a video message (available in Telegram apps as of v.4.0).
 * @see https://core.telegram.org/bots/api#videonote
 */
export interface VideoNote {
  /** Identifier for this file, which can be used to download or reuse the file */
  file_id: string;
  /** Unique identifier for this file, which is supposed to be the same over time and for different bots. Can't be used to download or reuse the file. */
  file_unique_id: string;
  /** Video width and height (diameter of the video message) as defined by the sender */
  length: Integer;
  /** Duration of the video in seconds as defined by the sender */
  duration: Integer;
  /** Optional. Video thumbnail */
  thumbnail?: PhotoSize;
  /** Optional. File size in bytes */
  file_size?: Integer;
}

/**
 * This object represents a phone contact.
 * @see https://core.telegram.org/bots/api#contact
 */
export interface Contact {
  /** Contact's phone number */
  phone_number: string;
  /** Contact's first name */
  first_name: string;
  /** Optional. Contact's last name */
  last_name?: string;
  /** Optional. Contact's user identifier in Telegram. This number may have more than 32 significant bits and some programming languages may have difficulty/silent defects in interpreting it. But it has at most 52 significant bits, so a 64-bit integer or double-precision float type are safe for storing this identifier. */
  user_id?: Integer;
  /** Optional. Additional data about the contact in the form of a vCard */
  vcard?: string;
}

/**
 * This object represents an incoming inline query. When the user sends an empty query, your bot could return some default or trending results.
 * @see https://core.telegram.org/bots/api#inlinequery
 */
export interface InlineQuery {
  /** Unique identifier for this query */
  id: string;
  /** Sender */
  from: User;
  /** Optional. Sender location, only for bots that request user location */
  location?: Location;
  /** Text of the query (up to 256 characters) */
  query: string;
  /** Offset of the results to be returned, can be controlled by the bot */
  offset: string;
  /** Optional. Type of the chat from which the inline query was sent. Can be either “sender” for a private chat with the inline query sender, “private”, “group”, “supergroup”, or “channel”. The chat type should be always known for requests sent from official clients and most third-party clients, unless the request was sent from a secret chat */
  chat_type?: string;
  /** Optional. Sender message origin of the inline query */
  message_origin?: MessageOrigin;
}

/**
 * This object represents a result of an inline query that was chosen by the user and sent to their chat partner.
 * @see https://core.telegram.org/bots/api#choseninlineresult
 */
export interface ChosenInlineResult {
  /** The unique identifier for the result that was chosen */
  result_id: string;
  /** The user that chose the result */
  from: User;
  /** Optional. Sender location, only for bots that require user location */
  location?: Location;
  /** Optional. Identifier of the sent inline message. Available only if there is an inline keyboard attached to the message. Will be also received in callback queries and can be used to edit the message. */
  inline_message_id?: string;
  /** The query that was used to obtain the result */
  query: string;
}

/**
 * This object contains information about one answer option in a poll.
 * @see https://core.telegram.org/bots/api#polloption
 */
export interface PollOption {
  /** Option text, 1-100 characters */
  text: string;
  /** Number of users that voted for this option */
  voter_count: Integer;
}

/**
 * This object represents an answer of a user in a non-anonymous poll.
 * @see https://core.telegram.org/bots/api#pollanswer
 */
export interface PollAnswer {
  /** Unique poll identifier */
  poll_id: string;
  /** The user, who changed the answer to the poll */
  user: User;
  /** 0-based identifiers of chosen answer options. May be empty if the vote was retracted. */
  option_ids: Array<Integer>;
}

/**
 * This object contains information about a poll.
 * @see https://core.telegram.org/bots/api#poll
 */
export interface Poll {
  /** Unique poll identifier */
  id: string;
  /** Poll question, 1-300 characters */
  question: string;
  /** List of poll options */
  options: Array<PollOption>;
  /** Total number of users that voted in the poll */
  total_voter_count: Integer;
  /** True, if the poll is closed */
  is_closed: boolean;
  /** True, if the poll is anonymous */
  is_anonymous: boolean;
  /** Poll type, currently can be “regular” or “quiz” */
  type: string;
  /** True, if the poll allows multiple answers */
  allows_multiple_answers: boolean;
  /** Optional. 0-based identifier of the correct answer option. Available only for polls in the quiz mode, which are closed, or was sent (not forwarded) by the bot or to the private chat with the bot. */
  correct_option_id?: Integer;
  /** Optional. Text that is shown when a user chooses an incorrect answer or taps on the lamp icon in a quiz-style poll, 0-200 characters */
  explanation?: string;
  /** Optional. Special entities like usernames, URLs, bot commands, etc. that appear in the explanation */
  explanation_entities?: Array<MessageEntity>;
  /** Optional. Amount of time in seconds the poll will be active after creation */
  open_period?: Integer;
  /** Optional. Point in time (Unix timestamp) when the poll will be automatically closed */
  close_date?: Integer;
}

/**
 * This object represents a point on the map.
 * @see https://core.telegram.org/bots/api#location
 */
export interface Location {
  /** Longitude as defined by sender */
  longitude: Float;
  /** Latitude as defined by sender */
  latitude: Float;
  /** Optional. The radius of uncertainty for the location, measured in meters; 0-1500 */
  horizontal_accuracy?: Float;
  /** Optional. Time relative to the message sending date, during which the location can be updated; in seconds. For active live locations only. */
  live_period?: Integer;
  /** Optional. The direction in which user is moving, in degrees; 1-360. For active live locations only. */
  heading?: Integer;
  /** Optional. The maximum distance for proximity alerts about approaching another chat member, in meters. For sent live locations only. */
  proximity_alert_radius?: Integer;
}

/**
 * This object represents a venue.
 * @see https://core.telegram.org/bots/api#venue
 */
export interface Venue {
  /** Venue location. Can't be a live location */
  location: Location;
  /** Name of the venue */
  title: string;
  /** Address of the venue */
  address: string;
  /** Optional. Foursquare identifier of the venue */
  foursquare_id?: string;
  /** Optional. Foursquare type of the venue. (For example, “arts_entertainment/default”, “arts_entertainment/aquarium” or “food/icecream”.) */
  foursquare_type?: string;
  /** Optional. Google Places identifier of the venue */
  google_place_id?: string;
  /** Optional. Google Places type of the venue. (See supported types.) */
  google_place_type?: string;
}

/**
 * Describes data sent from a Web App to the bot.
 * @see https://core.telegram.org/bots/api#webappdata
 */
export interface WebAppData {
  /** The data. Be aware that a bad client can send arbitrary data in this field. */
  data: string;
  /** Text of the web_app keyboard button from which the Web App was opened. Be aware that a bad client can send arbitrary data in this field. */
  button_text: string;
}

/**
 * This object contains information about a user.
 * @see https://core.telegram.org/bots/api#usersshared
 */
export interface UsersShared {
  /** Identifier of the request */
  request_id: Integer;
  /** Information about users shared with the bot */
  users: Array<SharedUser>;
}

/**
 * This object contains information about a chat.
 * @see https://core.telegram.org/bots/api#chatshared
 */
export interface ChatShared {
  /** Identifier of the request */
  request_id: Integer;
  /** Identifier of the shared chat. This number may have more than 32 significant bits and some programming languages may have difficulty/silent defects in interpreting it. But it has at most 52 significant bits, so a 64-bit integer or double-precision float type are safe for storing this identifier. */
  chat_id: Integer;
  /** Optional. Title of the chat, if the title was requested and available */
  title?: string;
  /** Optional. Username of the chat, if the username was requested and available */
  username?: string;
  /** Optional. Available sizes of the chat photo, if the photo was requested and available */
  photo?: Array<PhotoSize>;
}

/**
 * Represents a service message about a user boosting a chat.
 * @see https://core.telegram.org/bots/api#chatboostadded
 */
export interface ChatBoostAdded {
  /** Number of boosts added by the user */
  boost_count: Integer;
}

/**
 * This object represents a service message about a change in auto-delete timer settings.
 * @see https://core.telegram.org/bots/api#messageautodeletetimerchanged
 */
export interface MessageAutoDeleteTimerChanged {
  /** New auto-delete time for messages in the chat; in seconds */
  message_auto_delete_time: Integer;
}

/**
 * This object represents a service message about a video chat scheduled in the chat.
 * @see https://core.telegram.org/bots/api#videochatscheduled
 */
export interface VideoChatScheduled {
  /** Point in time (Unix timestamp) when the video chat is supposed to be started by a chat administrator */
  start_date: Integer;
}

/**
 * This object represents a service message about a video chat started in the chat. Currently holds no information.
 * @see https://core.telegram.org/bots/api#videochatstarted
 */
export interface VideoChatStarted {}

/**
 * This object represents a service message about a video chat ended in the chat.
 * @see https://core.telegram.org/bots/api#videochatended
 */
export interface VideoChatEnded {
  /** Video chat duration in seconds */
  duration: Integer;
}

/**
 * This object represents a service message about new members invited to a video chat.
 * @see https://core.telegram.org/bots/api#videochatparticipantsinvited
 */
export interface VideoChatParticipantsInvited {
  /** New members that were invited to the video chat */
  users: Array<User>;
}

/**
 * This object represent a user's profile pictures.
 * @see https://core.telegram.org/bots/api#userprofilephotos
 */
export interface UserProfilePhotos {
  /** Total number of profile pictures the target user has */
  total_count: Integer;
  /** Requested profile pictures (in up to 4 sizes each) */
  photos: Array<Array<PhotoSize>>;
}

/**
 * This object represents a file ready to be downloaded. The file can be downloaded via the link https://api.telegram.org/file/bot<token>/<file_path>. It is guaranteed that the link will be valid for at least 1 hour. When the link expires, a new one can be requested by calling getFile.
 * @see https://core.telegram.org/bots/api#file
 */
export interface File {
  /** Identifier for this file, which can be used to download or reuse the file */
  file_id: string;
  /** Unique identifier for this file, which is supposed to be the same over time and for different bots. Can't be used to download or reuse the file. */
  file_unique_id: string;
  /** Optional. File size in bytes */
  file_size?: Integer;
  /** Optional. File path. Use https://api.telegram.org/file/bot<token>/<file_path> to get the file. */
  file_path?: string;
}

/**
 * Describes a Web App.
 * @see https://core.telegram.org/bots/api#webappinfo
 */
export interface WebAppInfo {
  /** An HTTPS URL of a Web App to be opened with additional data as specified in Initializing Web Apps */
  url: string;
}

/**
 * This object represents a custom keyboard with reply options (see Introduction to bots for details and examples).
 * @see https://core.telegram.org/bots/api#replykeyboardmarkup
 */
export interface ReplyKeyboardMarkup {
  /** Array of button rows, each represented by an Array of KeyboardButton objects */
  keyboard: Array<Array<KeyboardButton>>;
  /** Optional. Requests clients to always show the keyboard when the regular keyboard is hidden. Defaults to false, in which case the custom keyboard can be hidden and opened with a keyboard icon. */
  is_persistent?: boolean;
  /** Optional. Requests clients to resize the keyboard vertically for optimal fit (e.g., make the keyboard smaller if there are just two rows of buttons). Defaults to false, in which case the custom keyboard is always of the same height as the app's standard keyboard. */
  resize_keyboard?: boolean;
  /** Optional. Requests clients to hide the keyboard as soon as it's been used. The keyboard will still be available, but clients will automatically display the usual letter-keyboard in the chat - the user can press a special button in the input field to see the custom keyboard again. Defaults to false. */
  one_time_keyboard?: boolean;
  /** Optional. The placeholder to be shown in the input field when the keyboard is active; 1-64 characters */
  input_field_placeholder?: string;
  /** Optional. Use this parameter if you want to show the keyboard to specific users only. Targets: 1) users that are @mentioned in the text of the Message object; 2) if the bot's message is a reply (has reply_to_message_id), sender of the original message. */
  selective?: boolean;
}

/**
 * This object represents one button of the reply keyboard. For simple text buttons, String can be used instead of this object to specify text of the button. Optional fields web_app, request_user, request_chat, request_contact, request_location, and request_poll are mutually exclusive.
 * @see https://core.telegram.org/bots/api#keyboardbutton
 */
export interface KeyboardButton {
  /** Text of the button. If none of the optional fields are used, it will be sent as a message when the button is pressed */
  text: string;
  /** Optional. If specified, pressing the button will open a list of suitable users. Tapping on any user will send their identifier to the bot in a “user_shared” service message. Available in private chats only. */
  request_users?: KeyboardButtonRequestUsers;
  /** Optional. If specified, pressing the button will open a list of suitable chats. Tapping on a chat will send its identifier to the bot in a “chat_shared” service message. Available in private chats only. */
  request_chat?: KeyboardButtonRequestChat;
  /** Optional. If True, the user's phone number will be sent as a contact when the button is pressed. Available in private chats only. */
  request_contact?: boolean;
  /** Optional. If True, the user's current location will be sent when the button is pressed. Available in private chats only. */
  request_location?: boolean;
  /** Optional. If specified, the user will be asked to create a poll and send it to the bot when the button is pressed. Available in private chats only. */
  request_poll?: KeyboardButtonPollType;
  /** Optional. If specified, the described Web App will be launched when the button is pressed. The Web App will be able to send a “web_app_data” service message. Available in private chats only. */
  web_app?: WebAppInfo;
}

/**
 * This object defines the criteria used to request suitable users. The number of requested users is specified by the client.
 * @see https://core.telegram.org/bots/api#keyboardbuttonrequestusers
 */
export interface KeyboardButtonRequestUsers {
  /** Signed 32-bit identifier of the request */
  request_id: Integer;
  /** Optional. Pass True to request bots, pass False to request regular users. If not specified, no additional restrictions are applied. */
  user_is_bot?: boolean;
  /** Optional. Pass True to request premium users, pass False to request non-premium users. If not specified, no additional restrictions are applied. */
  user_is_premium?: boolean;
  /** Optional. The maximum number of users to be selected; 1-10. Defaults to 1. */
  max_quantity?: Integer;
  /** Optional. Pass True to request the users whose identifier matches the specified one. */
  request_name?: boolean;
  /** Optional. Pass True to request the users whose username matches the specified one. */
  request_username?: boolean;
  /** Optional. Pass True to request the users whose language matches the specified one. */
  request_photo?: boolean;
}

/**
 * This object defines the criteria used to request suitable chats. The number of requested chats is specified by the client.
 * @see https://core.telegram.org/bots/api#keyboardbuttonrequestchat
 */
export interface KeyboardButtonRequestChat {
  /** Signed 32-bit identifier of the request */
  request_id: Integer;
  /** Pass True to request a channel chat, pass False to request a group or a supergroup chat. */
  chat_is_channel: boolean;
  /** Optional. Pass True to request a forum supergroup, pass False to request a non-forum chat. If not specified, no additional restrictions are applied. */
  chat_is_forum?: boolean;
  /** Optional. Pass True to request a supergroup or a channel with a username, pass False to request a chat without a username. If not specified, no additional restrictions are applied. */
  chat_has_username?: boolean;
  /** Optional. Pass True to request a chat owned by the user, pass False to request a chat not owned by the user. If not specified, no additional restrictions are applied. */
  chat_is_created?: boolean;
  /** Optional. A JSON-serialized object listing the required administrator rights of the user in the chat. If not specified, no additional restrictions are applied. */
  user_administrator_rights?: ChatAdministratorRights;
  /** Optional. A JSON-serialized object listing the required administrator rights of the bot in the chat. The rights must be a subset of user_administrator_rights. If not specified, no additional restrictions are applied. */
  bot_administrator_rights?: ChatAdministratorRights;
  /** Optional. Pass True to request a chat with the bot as a member. Otherwise, no additional restrictions are applied. */
  bot_is_member?: boolean;
  /** Optional. Pass True to request the chat whose identifier matches the specified one. */
  request_title?: boolean;
  /** Optional. Pass True to request the chat whose username matches the specified one. */
  request_username?: boolean;
  /** Optional. Pass True to request the chat whose photo matches the specified one. */
  request_photo?: boolean;
}

/**
 * This object represents type of a poll, which is allowed to be created and sent when the corresponding button is pressed.
 * @see https://core.telegram.org/bots/api#keyboardbuttonpolltype
 */
export interface KeyboardButtonPollType {
  /** Optional. If quiz is passed, the user will be allowed to create only polls in the quiz mode. If regular is passed, only regular polls will be allowed. Otherwise, the user will be allowed to create a poll of any type. */
  type?: string;
}

/**
 * Upon receiving a message with this object, Telegram clients will remove the current custom keyboard and display the default letter-keyboard. By default, custom keyboards are displayed until a new keyboard is sent by a bot. An exception is made for one-time keyboards that are hidden immediately after the user presses a button (see ReplyKeyboardMarkup).
 * @see https://core.telegram.org/bots/api#replykeyboardremove
 */
export interface ReplyKeyboardRemove {
  /** Requests clients to remove the custom keyboard (user will not be able to summon this keyboard; if you want to hide the keyboard from sight but keep it accessible, use one_time_keyboard in ReplyKeyboardMarkup) */
  remove_keyboard: true;
  /** Optional. Use this parameter if you want to remove the keyboard for specific users only. Targets: 1) users that are @mentioned in the text of the Message object; 2) if the bot's message is a reply (has reply_to_message_id), sender of the original message. */
  selective?: boolean;
}

/**
 * This object represents an inline keyboard that appears right next to the message it belongs to.
 * @see https://core.telegram.org/bots/api#inlinekeyboardmarkup
 */
export interface InlineKeyboardMarkup {
  /** Array of button rows, each represented by an Array of InlineKeyboardButton objects */
  inline_keyboard: Array<Array<InlineKeyboardButton>>;
}

/**
 * This object represents one button of an inline keyboard. You must use exactly one of the optional fields.
 * @see https://core.telegram.org/bots/api#inlinekeyboardbutton
 */
export interface InlineKeyboardButton {
  /** Label text on the button */
  text: string;
  /** Optional. HTTP or tg:// URL to be opened when the button is pressed. Links tg://user?id=<user_id> can be used to mention a user by their ID without using a username, if this is allowed by their privacy settings. */
  url?: string;
  /** Optional. Data to be sent in a callback query to the bot when button is pressed, 1-64 bytes */
  callback_data?: string;
  /** Optional. Description of the Web App that will be launched when the user presses the button. The Web App will be able to send an arbitrary message on behalf of the user using the method answerWebAppQuery. Available only in private chats between a user and the bot. */
  web_app?: WebAppInfo;
  /** Optional. An HTTPS URL used to automatically authorize the user. Can be used as a replacement for the Telegram Login Widget. */
  login_url?: LoginUrl;
  /** Optional. If set, pressing the button will prompt the user to select one of their chats, open that chat and insert the bot's username and the specified inline query in the input field. May be empty, in which case just the bot's username will be inserted. */
  switch_inline_query?: string;
  /** Optional. If set, pressing the button will insert the bot's username and the specified inline query in the current chat's input field. May be empty, in which case only the bot's username will be inserted. */
  switch_inline_query_current_chat?: string;
  /** Optional. If set, pressing the button will prompt the user to select one of their chats of the specified type, open that chat and insert the bot's username and the specified inline query in the input field */
  switch_inline_query_chosen_chat?: SwitchInlineQueryChosenChat;
  /** Optional. Description of the game that will be launched when the user presses the button. */
  callback_game?: CallbackGame;
  /** Optional. Specify True, to send a Pay button. */
  pay?: boolean;
}

/**
 * This object represents a parameter of the inline keyboard button used to automatically authorize a user. Serves as a great replacement for the Telegram Login Widget when the user is coming from Telegram. All the user needs to do is tap/click a button and confirm that they want to log in.
 * @see https://core.telegram.org/bots/api#switchinlinequerychosenchat
 */
export interface SwitchInlineQueryChosenChat {
  /** Optional. The placeholder to be shown in the input field when the inline keyboard is active; 1-64 characters */
  query?: string;
  /** Optional. True, if private chats with users can be chosen */
  allow_user_chats?: boolean;
  /** Optional. True, if private chats with bots can be chosen */
  allow_bot_chats?: boolean;
  /** Optional. True, if group and supergroup chats can be chosen */
  allow_group_chats?: boolean;
  /** Optional. True, if channel chats can be chosen */
  allow_channel_chats?: boolean;
}

/**
 * Upon receiving a message with this object, Telegram clients will display a reply interface to the user (act as if the user has selected the bot's message and tapped 'Reply'). This can be extremely useful if you want to create user-friendly step-by-step interfaces without having to sacrifice privacy mode.
 * @see https://core.telegram.org/bots/api#forcereply
 */
export interface ForceReply {
  /** Shows reply interface to the user, as if they manually selected the bot's message and tapped 'Reply' */
  force_reply: true;
  /** Optional. The placeholder to be shown in the input field when the reply is active; 1-64 characters */
  input_field_placeholder?: string;
  /** Optional. Use this parameter if you want to force reply from specific users only. Targets: 1) users that are @mentioned in the text of the Message object; 2) if the bot's message is a reply (has reply_to_message_id), sender of the original message. */
  selective?: boolean;
}

/**
 * This object represents a chat photo.
 * @see https://core.telegram.org/bots/api#chatphoto
 */
export interface ChatPhoto {
  /** File identifier of small (160x160) chat photo. This file_id can be used only for photo download and only for as long as the photo is not changed. */
  small_file_id: string;
  /** Unique file identifier of small (160x160) chat photo, which is supposed to be the same over time and for different bots. Can't be used to download or reuse the file. */
  small_file_unique_id: string;
  /** File identifier of big (640x640) chat photo. This file_id can be used only for photo download and only for as long as the photo is not changed. */
  big_file_id: string;
  /** Unique file identifier of big (640x640) chat photo, which is supposed to be the same over time and for different bots. Can't be used to download or reuse the file. */
  big_file_unique_id: string;
}

/**
 * Represents an invite link for a chat.
 * @see https://core.telegram.org/bots/api#chatinvitelink
 */
export interface ChatInviteLink {
  /** The invite link. If the link was created by another chat administrator, then the second part of the link will be replaced with “…” */
  invite_link: string;
  /** Creator of the link */
  creator: User;
  /** True, if the link is primary */
  is_primary: boolean;
  /** True, if the link is revoked */
  is_revoked: boolean;
  /** Optional. Point in time (Unix timestamp) when the link will expire or has been expired */
  expire_date?: Integer;
  /** Optional. The maximum number of users that can be members of the chat simultaneously after joining the chat via this invite link; 1-99999 */
  member_limit?: Integer;
  /** Optional. Number of pending join requests created using this link */
  pending_join_request_count?: Integer;
}

/**
 * Describes actions that a non-administrator user is allowed to take in a chat.
 * @see https://core.telegram.org/bots/api#chatpermissions
 */
export interface ChatPermissions {
  /** Optional. True, if the user is allowed to send text messages, contacts, giveaways, giveaway winners, invoices, locations and venues */
  can_send_messages?: boolean;
  /** Optional. True, if the user is allowed to send audios */
  can_send_audios?: boolean;
  /** Optional. True, if the user is allowed to send documents */
  can_send_documents?: boolean;
  /** Optional. True, if the user is allowed to send photos */
  can_send_photos?: boolean;
  /** Optional. True, if the user is allowed to send videos */
  can_send_videos?: boolean;
  /** Optional. True, if the user is allowed to send video notes */
  can_send_video_notes?: boolean;
  /** Optional. True, if the user is allowed to send voice notes */
  can_send_voice_notes?: boolean;
  /** Optional. True, if the user is allowed to send polls */
  can_send_polls?: boolean;
  /** Optional. True, if the user is allowed to send animations, games, stickers and use inline bots */
  can_send_other_messages?: boolean;
  /** Optional. True, if the user is allowed to add web page previews to their messages */
  can_add_web_page_previews?: boolean;
  /** Optional. True, if the user is allowed to change the chat title, photo and other settings. Ignored in public supergroups */
  can_change_info?: boolean;
  /** Optional. True, if the user is allowed to invite new users to the chat */
  can_invite_users?: boolean;
  /** Optional. True, if the user is allowed to pin messages. Ignored in public supergroups */
  can_pin_messages?: boolean;
  /** Optional. True, if the user is allowed to create forum topics. If omitted defaults to the value of can_pin_messages */
  can_manage_topics?: boolean;
}

/**
 * This object contains information about one member of a chat. Currently, the following 6 types of chat members are supported: ChatMemberOwner, ChatMemberAdministrator, ChatMemberMember, ChatMemberRestricted, ChatMemberLeft, ChatMemberBanned
 * @see https://core.telegram.org/bots/api#chatmember
 */
export interface ChatMember {}

/**
 * Represents a chat member that owns the chat and has all administrator privileges.
 * @see https://core.telegram.org/bots/api#chatmemberowner
 */
export interface ChatMemberOwner extends ChatMember {
  /** The member's status in the chat, always “creator” */
  status: "creator";
  /** Information about the user */
  user: User;
  /** True, if the user's presence in the chat is hidden */
  is_anonymous: boolean;
  /** Optional. Custom title for this user */
  custom_title?: string;
}

/**
 * Represents a chat member that has some additional privileges.
 * @see https://core.telegram.org/bots/api#chatmemberadministrator
 */
export interface ChatMemberAdministrator extends ChatMember {
  /** The member's status in the chat, always “administrator” */
  status: "administrator";
  /** Information about the user */
  user: User;
  /** True, if the bot is allowed to edit administrator privileges of that user */
  can_be_edited: boolean;
  /** True, if the user's presence in the chat is hidden */
  is_anonymous: boolean;
  /** True, if the administrator can access the chat event log, get boost list, see hidden supergroup and channel members, report spam messages and ignore slow mode. Implied by any other administrator privilege. */
  can_manage_chat: boolean;
  /** True, if the administrator can delete messages of other users */
  can_delete_messages: boolean;
  /** True, if the administrator can manage video chats */
  can_manage_video_chats: boolean;
  /** True, if the administrator can restrict, ban or unban chat members, or access supergroup statistics */
  can_restrict_members: boolean;
  /** True, if the administrator can add new administrators with a subset of their own privileges or demote administrators that he has promoted, directly or indirectly (promoted by administrators that were appointed by the user) */
  can_promote_members: boolean;
  /** True, if the user is allowed to change the chat title, photo and other settings */
  can_change_info: boolean;
  /** True, if the user is allowed to invite new users to the chat */
  can_invite_users: boolean;
  /** Optional. True, if the administrator can post messages in the channel; channels only */
  can_post_messages?: boolean;
  /** Optional. True, if the administrator can edit messages of other users and can pin messages; channels only */
  can_edit_messages?: boolean;
  /** Optional. True, if the administrator can pin messages; supergroups only */
  can_pin_messages?: boolean;
  /** Optional. True, if the user is allowed to create, rename, close, and reopen forum topics; supergroups only */
  can_manage_topics?: boolean;
  /** Optional. Custom title for this user */
  custom_title?: string;
}

/**
 * Represents a chat member that has no additional privileges or restrictions.
 * @see https://core.telegram.org/bots/api#chatmembermember
 */
export interface ChatMemberMember extends ChatMember {
  /** The member's status in the chat, always “member” */
  status: "member";
  /** Information about the user */
  user: User;
}

/**
 * Represents a chat member that is under certain restrictions in the chat. Supergroups only.
 * @see https://core.telegram.org/bots/api#chatmemberrestricted
 */
export interface ChatMemberRestricted extends ChatMember {
  /** The member's status in the chat, always “restricted” */
  status: "restricted";
  /** Information about the user */
  user: User;
  /** True, if the user is a member of the chat at the moment of the request */
  is_member: boolean;
  /** True, if the user is allowed to change the chat title, photo and other settings */
  can_change_info: boolean;
  /** True, if the user is allowed to invite new users to the chat */
  can_invite_users: boolean;
  /** True, if the user is allowed to pin messages */
  can_pin_messages: boolean;
  /** True, if the user is allowed to create forum topics */
  can_manage_topics: boolean;
  /** True, if the user is allowed to send text messages, contacts, giveaways, giveaway winners, invoices, locations and venues */
  can_send_messages: boolean;
  /** True, if the user is allowed to send audios */
  can_send_audios: boolean;
  /** True, if the user is allowed to send documents */
  can_send_documents: boolean;
  /** True, if the user is allowed to send photos */
  can_send_photos: boolean;
  /** True, if the user is allowed to send videos */
  can_send_videos: boolean;
  /** True, if the user is allowed to send video notes */
  can_send_video_notes: boolean;
  /** True, if the user is allowed to send voice notes */
  can_send_voice_notes: boolean;
  /** True, if the user is allowed to send polls */
  can_send_polls: boolean;
  /** True, if the user is allowed to send animations, games, stickers and use inline bots */
  can_send_other_messages: boolean;
  /** True, if the user is allowed to add web page previews to their messages */
  can_add_web_page_previews: boolean;
  /** Date when restrictions will be lifted for this user; Unix time. If 0, then the user is restricted forever */
  until_date: Integer;
}

/**
 * Represents a chat member that isn't currently a member of the chat, but may join it themselves.
 * @see https://core.telegram.org/bots/api#chatmemberleft
 */
export interface ChatMemberLeft extends ChatMember {
  /** The member's status in the chat, always “left” */
  status: "left";
  /** Information about the user */
  user: User;
}

/**
 * Represents a chat member that was banned in the chat and can't return to the chat or view chat messages.
 * @see https://core.telegram.org/bots/api#chatmemberbanned
 */
export interface ChatMemberBanned extends ChatMember {
  /** The member's status in the chat, always “kicked” */
  status: "kicked";
  /** Information about the user */
  user: User;
  /** Date when restrictions will be lifted for this user; Unix time. If 0, then the user is banned forever */
  until_date: Integer;
}

/**
 * This object represents changes in the status of a chat member.
 * @see https://core.telegram.org/bots/api#chatmemberupdated
 */
export interface ChatMemberUpdated {
  /** Chat the user belongs to */
  chat: Chat;
  /** Performer of the action, which resulted in the change */
  from: User;
  /** Date the change was done in Unix time */
  date: Integer;
  /** Previous information about the chat member */
  old_chat_member: ChatMember;
  /** New information about the chat member */
  new_chat_member: ChatMember;
  /** Optional. Chat invite link, which was used by the user to join the chat; for joining by invite link events only. */
  invite_link?: ChatInviteLink;
  /** Optional. True, if the user joined the chat via a chat folder invite link */
  via_chat_folder_invite_link?: boolean;
}

/**
 * Represents a join request sent to a chat.
 * @see https://core.telegram.org/bots/api#chatjoinrequest
 */
export interface ChatJoinRequest {
  /** Chat to which the request was sent */
  chat: Chat;
  /** User that sent the join request */
  from: User;
  /** Identifier of a private chat with the user, if the user has requested to contact them after joining the chat */
  user_chat_id: Integer;
  /** Date the request was sent in Unix time */
  date: Integer;
  /** Optional. Bio of the user. */
  bio?: string;
  /** Optional. Chat invite link that was used by the user to send the join request */
  invite_link?: ChatInviteLink;
}

/**
 * Describes the birthdate of a user.
 * @see https://core.telegram.org/bots/api#birthdate
 */
export interface Birthdate {
  /** Day of the user's birth; 1-31 */
  day: Integer;
  /** Month of the user's birth; 1-12 */
  month: Integer;
  /** Year of the user's birth */
  year?: Integer;
}

/**
 * Describes a business account of the user.
 * @see https://core.telegram.org/bots/api#businessintro
 */
export interface BusinessIntro {
  /** Optional. Title text of the business intro */
  title?: string;
  /** Optional. Message text of the business intro */
  message?: string;
  /** Optional. Sticker of the business intro */
  sticker?: Sticker;
}

/**
 * Describes a business location.
 * @see https://core.telegram.org/bots/api#businesslocation
 */
export interface BusinessLocation {
  /** Address of the business */
  address: string;
  /** Optional. Location of the business */
  location?: Location;
}

/**
 * Describes a business opening hours.
 * @see https://core.telegram.org/bots/api#businessopeninghours
 */
export interface BusinessOpeningHours {
  /** Time zone name for the opening hours */
  time_zone_name: string;
  /** List of opening intervals */
  opening_hours: Array<BusinessOpeningHoursInterval>;
}

/**
 * Describes an interval of time during which a business is open.
 * @see https://core.telegram.org/bots/api#businessopeninghoursinterval
 */
export interface BusinessOpeningHoursInterval {
  /** The minute's sequence number in a week, starting on Monday, marking the start of the time interval during which the business is open; 0 - 7 * 24 * 60 */
  opening_minute: Integer;
  /** The minute's sequence number in a week, starting on Monday, marking the end of the time interval during which the business is open; 0 - 8 * 24 * 60 */
  closing_minute: Integer;
}

/**
 * Describes the connection of the bot with a business account.
 * @see https://core.telegram.org/bots/api#businessconnection
 */
export interface BusinessConnection {
  /** Unique identifier of the business connection */
  id: string;
  /** Business account user that created the business connection */
  user: User;
  /** Identifier of a private chat with the user, if the user has requested to contact them after a bot message */
  user_chat_id: Integer;
  /** True, if the bot can act on behalf of the business account in chats that were active in the last 24 hours */
  can_reply: boolean;
  /** True, if the connection is active */
  is_enabled: boolean;
}

/**
 * This object is received when messages are deleted from a connected business account.
 * @see https://core.telegram.org/bots/api#businessmessagesdeleted
 */
export interface BusinessMessagesDeleted {
  /** Unique identifier of the business connection */
  business_connection_id: string;
  /** Information about the chat from which the messages were deleted */
  chat: Chat;
  /** The list of identifiers of deleted messages in the chat specified in the chat field */
  message_ids: Array<Integer>;
}

/**
 * This object represents a unique message identifier.
 * @see https://core.telegram.org/bots/api#messageid
 */
export interface MessageId {
  /** Unique message identifier */
  message_id: Integer;
}

/**
 * This object represents a message.
 * @see https://core.telegram.org/bots/api#message
 */
export interface Message {
  /** Unique message identifier inside this chat. In specific instances (e.g., message containing a video sent to a big chat), the server might automatically replace this id with a new one. This behavior might cause message_id to change, so you shouldn't rely on this value in your code. */
  message_id: Integer;
  /** Optional. Unique identifier of a message thread to which the message belongs; for supergroups only */
  message_thread_id?: Integer;
  /** Optional. Sender of the message; empty for messages forwarded to channels. For backward compatibility, the field contains a fake sender user in non-channel chats, if the message was sent on behalf of a chat. */
  from?: User;
  /** Optional. Sender of the message, sent on behalf of a chat. For example, the channel itself for channel posts, the supergroup itself for messages from anonymous group administrators, the linked channel for messages automatically forwarded to the discussion group. For backward compatibility, the field from contains a fake sender user in non-channel chats, if the message was sent on behalf of a chat. */
  sender_chat?: Chat;
  /** Date the message was sent in Unix time. It is always a positive number, representing a valid date. */
  date: Integer;
  /** Chat the message belongs to */
  chat: Chat;
  /** Optional. Information about the original message for forwarded messages */
  forward_origin?: MessageOrigin;
  /** Optional. True, if the message is sent to a forum topic */
  is_topic_message?: boolean;
  /** Optional. True, if the message is a channel post that was automatically forwarded to the connected discussion group */
  is_automatic_forward?: boolean;
  /** Optional. For replies in the same chat and message thread, the original message. Note that the Message object in this field will not contain further reply_to_message fields even if it itself is a reply. */
  reply_to_message?: Message;
  /** Optional. Information about the message that is being replied to, which may come from another chat or forum topic */
  external_reply?: ExternalReplyInfo;
  /** Optional. For replies that quote part of the original message, the quoted part of the message */
  quote?: TextQuote;
  /** Optional. Information about the message that is being replied to, which may come from another chat or forum topic */
  reply_to_story?: Story;
  /** Optional. Bot through which the message was sent */
  via_bot?: User;
  /** Optional. Date the message was last edited in Unix time */
  edit_date?: Integer;
  /** Optional. True, if the message can't be forwarded */
  has_protected_content?: boolean;
  /** Optional. True, if the message was sent by an implicit action, for example, as an away or a greeting business message, or as a scheduled message */
  is_from_offline?: boolean;
  /** Optional. The unique identifier of a media message group this message belongs to */
  media_group_id?: string;
  /** Optional. Sender's name for messages forwarded from users who disallow adding a link to their account in forwarded messages */
  author_signature?: string;
  /** Optional. For text messages, the actual UTF-8 text of the message */
  text?: string;
  /** Optional. For text messages, special entities like usernames, URLs, bot commands, etc. that appear in the text */
  entities?: Array<MessageEntity>;
  /** Optional. Options used for link preview generation for the message, if it is a text message and link preview options were changed */
  link_preview_options?: LinkPreviewOptions;
  /** Optional. Unique identifier of the user shared with the bot */
  effect_id?: string;
  /** Optional. Animation that was sent in the message */
  animation?: Animation;
  /** Optional. Audio that was sent in the message */
  audio?: Audio;
  /** Optional. Document that was sent in the message */
  document?: Document;
  /** Optional. Photos that were sent in the message */
  photo?: Array<PhotoSize>;
  /** Optional. Sticker that was sent in the message */
  sticker?: Sticker;
  /** Optional. Video that was sent in the message */
  video?: Video;
  /** Optional. Video note that was sent in the message */
  video_note?: VideoNote;
  /** Optional. Voice that was sent in the message */
  voice?: Voice;
  /** Optional. Caption for the animation, audio, document, photo, video or voice */
  caption?: string;
  /** Optional. For messages with a caption, special entities like usernames, URLs, bot commands, etc. that appear in the caption */
  caption_entities?: Array<MessageEntity>;
  /** Optional. True, if the message media is covered by a spoiler animation */
  has_media_spoiler?: boolean;
  /** Optional. Contact that was sent in the message */
  contact?: Contact;
  /** Optional. Dice that was sent in the message */
  dice?: Dice;
  /** Optional. Game that was sent in the message */
  game?: Game;
  /** Optional. Poll that was sent in the message */
  poll?: Poll;
  /** Optional. Venue that was sent in the message */
  venue?: Venue;
  /** Optional. Location that was sent in the message */
  location?: Location;
  /** Optional. New members that were added to the group or supergroup and information about them (the bot itself may be one of these members) */
  new_chat_members?: Array<User>;
  /** Optional. A member was removed from the group, information about them (this member may be the bot itself) */
  left_chat_member?: User;
  /** Optional. A chat title was changed to this value */
  new_chat_title?: string;
  /** Optional. A chat photo was change to this value */
  new_chat_photo?: Array<PhotoSize>;
  /** Optional. Service message: the chat photo was deleted */
  delete_chat_photo?: true;
  /** Optional. Service message: the group has been created */
  group_chat_created?: true;
  /** Optional. Service message: the supergroup has been created. This field can't be received in a message coming through updates, because bot servers always know the type of each chat. */
  supergroup_chat_created?: true;
  /** Optional. Service message: the channel has been created. This field can't be received in a message coming through updates, because bot servers always know the type of each chat. */
  channel_chat_created?: true;
  /** Optional. Service message: auto-delete timer settings changed in the chat */
  message_auto_delete_timer_changed?: MessageAutoDeleteTimerChanged;
  /** Optional. The group has been migrated to a supergroup with the specified identifier. This number may have more than 32 significant bits and some programming languages may have difficulty/silent defects in interpreting it. But it has at most 52 significant bits, so a 64-bit integer or double-precision float type are safe for storing this identifier. */
  migrate_to_chat_id?: Integer;
  /** Optional. The supergroup has been migrated from a group with the specified identifier. This number may have more than 32 significant bits and some programming languages may have difficulty/silent defects in interpreting it. But it has at most 52 significant bits, so a 64-bit integer or double-precision float type are safe for storing this identifier. */
  migrate_from_chat_id?: Integer;
  /** Optional. Specified message was pinned. Note that the Message object in this field will not contain further reply_to_message fields even if it itself is a reply. */
  pinned_message?: Message;
  /** Optional. Message is an invoice for a payment, information about the invoice. More about payments » */
  invoice?: Invoice;
  /** Optional. Message is a service message about a scheduled giveaway, information about the giveaway. More about giveaways: https://core.telegram.org/bots/api#giveaways */
  giveaway?: Giveaway;
  /** Optional. A giveaway with public winners was completed */
  giveaway_winners?: GiveawayWinners;
  /** Optional. Service message: users were shared with the bot */
  users_shared?: UsersShared;
  /** Optional. Service message: a chat was shared with the bot */
  chat_shared?: ChatShared;
  /** Optional. Service message: the user allowed the bot added to the attachment menu to write messages */
  write_access_allowed?: WriteAccessAllowed;
  /** Optional. Video chat scheduled */
  video_chat_scheduled?: VideoChatScheduled;
  /** Optional. Video chat started */
  video_chat_started?: VideoChatStarted;
  /** Optional. Video chat ended */
  video_chat_ended?: VideoChatEnded;
  /** Optional. New participants invited to a video chat */
  video_chat_participants_invited?: VideoChatParticipantsInvited;
  /** Optional. Service message: data sent by a Web App */
  web_app_data?: WebAppData;
  /** Optional. Service message: user boosted the chat */
  boost_added?: ChatBoostAdded;
  /** Optional. Service message: forum topic created */
  forum_topic_created?: ForumTopicCreated;
  /** Optional. Service message: forum topic edited */
  forum_topic_edited?: ForumTopicEdited;
  /** Optional. Service message: forum topic closed */
  forum_topic_closed?: ForumTopicClosed;
  /** Optional. Service message: forum topic reopened */
  forum_topic_reopened?: ForumTopicReopened;
  /** Optional. Service message: the 'General' forum topic hidden */
  general_forum_topic_hidden?: GeneralForumTopicHidden;
  /** Optional. Service message: the 'General' forum topic unhidden */
  general_forum_topic_unhidden?: GeneralForumTopicUnhidden;
  /** Optional. Service message: a user was shared with the bot */
  user_shared?: SharedUser;
  /** Optional. Service message: the user's profile was shared with the bot */
  chat_boost?: ChatBoost;
  /** Optional. Service message: the chat background was changed */
  chat_background_set?: ChatBackground;
  /** Optional. Service message: the users were allowed to send paid media in the chat */
  paid_media_purchased?: PaidMediaPurchased;
  /** Optional. Service message: the suggested post was approved by the admin */
  suggested_post_approved?: SuggestedPostApproved;
  /** Optional. Service message: the suggested post was declined by the admin */
  suggested_post_declined?: SuggestedPostDeclined;
  /** Optional. Service message: the suggested post was paid by the user */
  suggested_post_paid?: SuggestedPostPaid;
  /** Optional. Service message: the suggested post was refunded to the user */
  suggested_post_refunded?: SuggestedPostRefunded;
  /** Optional. Service message: the suggested post price was changed */
  suggested_post_price_changed?: SuggestedPostPriceChanged;
  /** Optional. Service message: the direct message price was changed */
  direct_message_price_changed?: DirectMessagePriceChanged;
  /** Optional. Service message: the suggested post approval failed */
  suggested_post_approval_failed?: SuggestedPostApprovalFailed;
}

/**
 * This object describes a message that was deleted or is otherwise inaccessible.
 * @see https://core.telegram.org/bots/api#inaccessiblemessage
 */
export interface InaccessibleMessage {
  /** Chat the message belonged to */
  chat: Chat;
  /** Unique message identifier inside the chat */
  message_id: Integer;
  /** Always 0. The field can be used to differentiate regular and inaccessible messages. */
  date: 0;
}

/**
 * This object describes a message that can be accessible or inaccessible.
 * @see https://core.telegram.org/bots/api#maybeinaccessiblemessage
 */
export type MaybeInaccessibleMessage = Message | InaccessibleMessage;

/**
 * This object describes an external reply to a message sent by the bot
 * @see https://core.telegram.org/bots/api#externalreplyinfo
 */
export interface ExternalReplyInfo {
  /** Origin of the message replied to by the given message */
  origin: MessageOrigin;
  /** Optional. Chat that sent the message to be replied to, if applicable */
  chat?: Chat;
  /** Optional. Message identifier of the original message, if applicable */
  message_id?: Integer;
  /** Optional. Options used for link preview generation for the original message, if it is a text message */
  link_preview_options?: LinkPreviewOptions;
  /** Optional. Message is an invoice for a payment, information about the invoice. More about payments: https://core.telegram.org/bots/api#payments */
  invoice?: Invoice;
  /** Optional. Message is a shared user, information about the shared user */
  user_shared?: SharedUser;
  /** Optional. Message is a shared chat, information about the shared chat */
  chat_shared?: ChatShared;
  /** Optional. A giveaway was sent, information about the giveaway */
  giveaway?: Giveaway;
  /** Optional. A video chat was scheduled, information about the video chat */
  video_chat_scheduled?: VideoChatScheduled;
  /** Optional. A video chat was started, information about the video chat */
  video_chat_started?: VideoChatStarted;
  /** Optional. A video chat ended, information about the video chat */
  video_chat_ended?: VideoChatEnded;
  /** Optional. A video chat participants were invited, information about the video chat */
  video_chat_participants_invited?: VideoChatParticipantsInvited;
  /** Optional. True, if the message was dropped because of payment requirements */
  paid_media_purchased?: PaidMediaPurchased;
  /** Optional. A proximity alert was triggered, information about the alert */
  proximity_alert_triggered?: ProximityAlertTriggered;
  /** Optional. A boost was added to a chat, information about the chat boost */
  boost_added?: ChatBoostAdded;
  /** Optional. A chat background was set for the chat, information about the chat background */
  chat_background_set?: ChatBackground;
  /** Optional. A forum topic was created, information about the forum topic */
  forum_topic_created?: ForumTopicCreated;
  /** Optional. A forum topic was edited, information about the forum topic */
  forum_topic_edited?: ForumTopicEdited;
  /** Optional. A forum topic was closed, information about the forum topic */
  forum_topic_closed?: ForumTopicClosed;
  /** Optional. A forum topic was reopened, information about the forum topic */
  forum_topic_reopened?: ForumTopicReopened;
  /** Optional. General forum topic was hidden, information about the general forum topic */
  general_forum_topic_hidden?: GeneralForumTopicHidden;
  /** Optional. General forum topic was unhidden, information about the general forum topic */
  general_forum_topic_unhidden?: GeneralForumTopicUnhidden;
  /** Optional. A giveaway created, information about the giveaway */
  giveaway_created?: GiveawayCreated;
  /** Optional. A giveaway was completed, information about the giveaway */
  giveaway_completed?: GiveawayCompleted;
  /** Optional. A giveaway with public winners was completed, information about the giveaway */
  giveaway_winners?: GiveawayWinners;
  /** Optional. A sponsored message was shown in the chat, information about the message */
  sponsored_message?: Message;
  /** Optional. Users were shared with the bot, information about the shared users */
  users_shared?: UsersShared;
  /** Optional. True, if the message was sent because a forum topic was closed or opened */
  message_auto_delete_timer_changed?: MessageAutoDeleteTimerChanged;
  /** Optional. Service message: the user allowed the bot added to the attachment menu to write messages */
  write_access_allowed?: WriteAccessAllowed;
  /** Optional. Service message: the user allowed the bot to send messages after adding it to the attachment or side menu */
  business_connection?: BusinessConnection;
  /** Optional. Service message: the suggested post was approved by the admin */
  suggested_post_approved?: SuggestedPostApproved;
  /** Optional. Service message: the suggested post was declined by the admin */
  suggested_post_declined?: SuggestedPostDeclined;
  /** Optional. Service message: the suggested post was paid by the user */
  suggested_post_paid?: SuggestedPostPaid;
  /** Optional. Service message: the suggested post was refunded to the user */
  suggested_post_refunded?: SuggestedPostRefunded;
  /** Optional. Service message: the suggested post price was changed */
  suggested_post_price_changed?: SuggestedPostPriceChanged;
  /** Optional. Service message: the direct message price was changed */
  direct_message_price_changed?: DirectMessagePriceChanged;
  /** Optional. Service message: the suggested post approval failed */
  suggested_post_approval_failed?: SuggestedPostApprovalFailed;
}

/**
 * Describes reply parameters for the message that is being sent.
 * @see https://core.telegram.org/bots/api#replyparameters
 */
export interface ReplyParameters {
  /** Identifier of the message that will be replied to in the current chat, or in the chat chat_id if it is specified */
  message_id: Integer;
  /** Optional. If the message to be replied to is from a different chat, unique identifier for the chat or username of the channel (in the format @channelusername) */
  chat_id?: Integer | string;
  /** Optional. Pass True if the message should be sent even if the specified message to be replied to is not found; can be used only in replies */
  allow_sending_without_reply?: boolean;
  /** Optional. Quoted part of the message to be replied to; 0-1024 characters after entities parsing. The quote must be an exact substring of the message content that was replied to, including bold, italic, underline, strikethrough, spoiler, and custom_emoji entities. The message will be sent to the original message's sender. */
  quote?: string;
  /** Optional. Mode for parsing entities in the quote. See formatting options for more details. */
  quote_parse_mode?: string;
  /** Optional. A JSON-serialized list of special entities that appear in the quote. It can be specified instead of quote_parse_mode. */
  quote_entities?: Array<MessageEntity>;
  /** Optional. Position of the quote in the original message in UTF-16 code units */
  quote_position?: Integer;
}

/**
 * This object represents a chat message origin in private chats.
 * @see https://core.telegram.org/bots/api#messageoriginuser
 */
export interface MessageOriginUser {
  /** Type of the message origin, always “user” */
  type: "user";
  /** Date the message was sent originally in Unix time */
  date: Integer;
  /** User that sent the message originally */
  sender_user: User;
}

/**
 * This object represents a chat message origin in chats with hidden sender names.
 * @see https://core.telegram.org/bots/api#messageoriginhiddenuser
 */
export interface MessageOriginHiddenUser {
  /** Type of the message origin, always “hidden_user” */
  type: "hidden_user";
  /** Date the message was sent originally in Unix time */
  date: Integer;
  /** Name of the user that sent the message originally */
  sender_user_name: string;
}

/**
 * This object represents a chat message origin from a chat.
 * @see https://core.telegram.org/bots/api#messageoriginchat
 */
export interface MessageOriginChat {
  /** Type of the message origin, always “chat” */
  type: "chat";
  /** Date the message was sent originally in Unix time */
  date: Integer;
  /** Chat that sent the message originally */
  sender_chat: Chat;
  /** Optional. For messages originally sent by an anonymous chat administrator, original message author signature */
  author_signature?: string;
}

/**
 * This object represents a chat message origin from a channel.
 * @see https://core.telegram.org/bots/api#messageoriginchannel
 */
export interface MessageOriginChannel {
  /** Type of the message origin, always “channel” */
  type: "channel";
  /** Date the message was sent originally in Unix time */
  date: Integer;
  /** Channel that sent the message originally */
  chat: Chat;
  /** Unique message identifier inside the chat */
  message_id: Integer;
  /** Optional. Signature of the original post author */
  author_signature?: string;
}

/**
 * The message was originally sent by a known user.
 * @see https://core.telegram.org/bots/api#messageorigin
 */
export type MessageOrigin =
  | MessageOriginUser
  | MessageOriginHiddenUser
  | MessageOriginChat
  | MessageOriginChannel;

/**
 * Describes a custom emoji
 * @see https://core.telegram.org/bots/api#inputsticker
 */
export interface InputSticker {
  /** The added sticker. Pass a file_id as a String to send a file that already exists on the Telegram servers, pass an HTTP URL as a String for Telegram to get a .WEBP file from the Internet, upload a new one using multipart/form-data, or pass “attach://<file_attach_name>” to upload a new one using multipart/form-data under <file_attach_name> name. Animated and video stickers can't be uploaded via HTTP URL. */
  sticker: InputFile | string;
  /** List of 1-20 emoji associated with the sticker */
  emoji_list: Array<string>;
  /** Optional. Position where the mask should be placed on faces. For “mask” stickers only. */
  mask_position?: MaskPosition;
  /** Optional. List of 0-20 search keywords for the sticker with total length of up to 64 characters. For “regular” and “custom_emoji” stickers only. */
  keywords?: Array<string>;
}

/**
 * This object describes the origin of a boost.
 * @see https://core.telegram.org/bots/api#chatboostsource
 */
export interface ChatBoostSource {}

/**
 * The boost was obtained by the creation of Telegram Premium gift codes to boost a chat. Each such code boosts the chat 4 times for the duration of the corresponding Telegram Premium subscription.
 * @see https://core.telegram.org/bots/api#chatboostsourcegiftcode
 */
export interface ChatBoostSourceGiftCode extends ChatBoostSource {
  /** Source of the boost, always “gift_code” */
  source: "gift_code";
  /** User for which the gift code was created */
  user: User;
}

/**
 * The boost was obtained by the creation of a Telegram Premium giveaway. This boosts the chat 4 times for the duration of the corresponding Telegram Premium subscription.
 * @see https://core.telegram.org/bots/api#chatboostsourcegiveaway
 */
export interface ChatBoostSourceGiveaway extends ChatBoostSource {
  /** Source of the boost, always “giveaway” */
  source: "giveaway";
  /** Identifier of a message in the chat with the giveaway; the message could have been deleted already */
  giveaway_message_id: Integer;
  /** Optional. User that won the prize in the giveaway if it was manually chosen by the creator of the giveaway */
  user?: User;
  /** Optional. True, if the giveaway was completed, but there was no winner */
  is_unclaimed?: boolean;
}

/**
 * The boost was obtained by subscribing to Telegram Premium or by gifting a Telegram Premium subscription to another user.
 * @see https://core.telegram.org/bots/api#chatboostsourcepremium
 */
export interface ChatBoostSourcePremium extends ChatBoostSource {
  /** Source of the boost, always “premium” */
  source: "premium";
  /** User that boosted the chat */
  user: User;
}

/**
 * This object contains information about a chat boost.
 * @see https://core.telegram.org/bots/api#chatboost
 */
export interface ChatBoost {
  /** Unique identifier of the boost */
  boost_id: string;
  /** Point in time (Unix timestamp) when the chat was boosted */
  add_date: Integer;
  /** Point in time (Unix timestamp) when the boost will automatically expire, unless the booster's Telegram Premium subscription is prolonged */
  expiration_date: Integer;
  /** Source of the added boost */
  source: ChatBoostSource;
}

/**
 * This object represents a boost added to a chat or changed.
 * @see https://core.telegram.org/bots/api#chatboostupdated
 */
export interface ChatBoostUpdated {
  /** Chat which was boosted */
  chat: Chat;
  /** Information about the chat boost */
  boost: ChatBoost;
}

/**
 * This object represents a boost removed from a chat.
 * @see https://core.telegram.org/bots/api#chatboostremoved
 */
export interface ChatBoostRemoved {
  /** Chat which was boosted */
  chat: Chat;
  /** Unique identifier of the boost */
  boost_id: string;
  /** Point in time (Unix timestamp) when the boost was removed */
  remove_date: Integer;
}

/**
 * This object represents a list of boosts added to a chat by a user.
 * @see https://core.telegram.org/bots/api#userchatboosts
 */
export interface UserChatBoosts {
  /** The list of boosts added to the chat by the user */
  boosts: Array<ChatBoost>;
}

/**
 * Describes the options used for link preview generation.
 * @see https://core.telegram.org/bots/api#linkpreviewoptions
 */
export interface LinkPreviewOptions {
  /** Optional. True, if the link preview is disabled */
  is_disabled?: boolean;
  /** Optional. URL to use for the link preview. If empty, then the first URL found in the message text will be used */
  url?: string;
  /** Optional. True, if the media in the link preview is supposed to be shrunk; ignored if the URL isn't explicitly specified or media size change isn't supported for the preview */
  prefer_small_media?: boolean;
  /** Optional. True, if the media in the link preview is supposed to be enlarged; ignored if the URL isn't explicitly specified or media size change isn't supported for the preview */
  prefer_large_media?: boolean;
  /** Optional. True, if the link preview must be shown above the message text; otherwise, the link preview will be shown below the message */
  show_above_text?: boolean;
}

/**
 * This object represents a dice with random value from 1 to 6. (Yes, we're aware of the “proper” singular of die. This is a telegram bot API convention) A valid emoji must be present in the first position. Any of “🎲”, “🎯”, “🏀”, “⚽”, “🎳”, or “🎰” can be used as a custom emoji. Dice can have values 1-6 for “🎲”, “🎯” and “🎳”, values 1-5 for “🏀” and “⚽”, and values 1-64 for “🎰”. The following emoji are allowed as the first character of the dice: “🎲”, “🎯”, “🏀”, “⚽”, “🎳”, and “🎰”.
 * @see https://core.telegram.org/bots/api#dice
 */
export interface Dice {
  /** Value of the dice, 1-6 for “🎲”, “🎯” and “🎳”, 1-5 for “🏀” and “⚽”, and 1-64 for “🎰” */
  value: Integer;
  /** Emoji on which the dice throw animation is based */
  emoji: string;
}

/**
 * This object contains information about one answer option in a poll.
 * @see https://core.telegram.org/bots/api#inputpolloption
 */
export interface InputPollOption {
  /** Option text, 1-100 characters */
  text: string;
  /** Optional. Mode for parsing entities in the text. See formatting options for more details. Currently, only custom emoji entities are allowed */
  text_parse_mode?: string;
  /** Optional. A JSON-serialized list of special entities that appear in the poll option text. It can be specified instead of text_parse_mode */
  text_entities?: Array<MessageEntity>;
}

/**
 * This object represents a bot command.
 * @see https://core.telegram.org/bots/api#botcommand
 */
export interface BotCommand {
  /** Text of the command; 1-32 characters. Can contain only lowercase English letters, digits and underscores. */
  command: string;
  /** Description of the command; 1-256 characters. */
  description: string;
}

/**
 * This object represents the scope to which bot commands are applied. Currently, the following 7 scopes are supported: BotCommandScopeDefault, BotCommandScopeAllPrivateChats, BotCommandScopeAllGroupChats, BotCommandScopeAllChatAdministrators, BotCommandScopeChat, BotCommandScopeChatAdministrators, BotCommandScopeChatMember
 * @see https://core.telegram.org/bots/api#botcommandscope
 */
export interface BotCommandScope {}

/**
 * Represents the default scope of bot commands. Default commands are used if no other commands are specified for the chat.
 * @see https://core.telegram.org/bots/api#botcommandscopedefault
 */
export interface BotCommandScopeDefault extends BotCommandScope {
  /** Scope type, must be default */
  type: "default";
}

/**
 * Represents the scope of bot commands, covering all private chats.
 * @see https://core.telegram.org/bots/api#botcommandscopeallprivatechats
 */
export interface BotCommandScopeAllPrivateChats extends BotCommandScope {
  /** Scope type, must be all_private_chats */
  type: "all_private_chats";
}

/**
 * Represents the scope of bot commands, covering all group and supergroup chats.
 * @see https://core.telegram.org/bots/api#botcommandscopeallgroupchats
 */
export interface BotCommandScopeAllGroupChats extends BotCommandScope {
  /** Scope type, must be all_group_chats */
  type: "all_group_chats";
}

/**
 * Represents the scope of bot commands, covering all administrators of group and supergroup chats.
 * @see https://core.telegram.org/bots/api#botcommandscopeallchatadministrators
 */
export interface BotCommandScopeAllChatAdministrators extends BotCommandScope {
  /** Scope type, must be all_chat_administrators */
  type: "all_chat_administrators";
}

/**
 * Represents the scope of bot commands, covering a specific chat.
 * @see https://core.telegram.org/bots/api#botcommandscopechat
 */
export interface BotCommandScopeChat extends BotCommandScope {
  /** Scope type, must be chat */
  type: "chat";
  /** Unique identifier for the target chat or username of the target supergroup (in the format @supergroupusername) */
  chat_id: Integer | string;
}

/**
 * Represents the scope of bot commands, covering all administrators of a specific group or supergroup chat.
 * @see https://core.telegram.org/bots/api#botcommandscopechatadministrators
 */
export interface BotCommandScopeChatAdministrators extends BotCommandScope {
  /** Scope type, must be chat_administrators */
  type: "chat_administrators";
  /** Unique identifier for the target chat or username of the target supergroup (in the format @supergroupusername) */
  chat_id: Integer | string;
}

/**
 * Represents the scope of bot commands, covering a specific member of a group or supergroup chat.
 * @see https://core.telegram.org/bots/api#botcommandscopechatmember
 */
export interface BotCommandScopeChatMember extends BotCommandScope {
  /** Scope type, must be chat_member */
  type: "chat_member";
  /** Unique identifier for the target chat or username of the target supergroup (in the format @supergroupusername) */
  chat_id: Integer | string;
  /** Unique identifier of the target user */
  user_id: Integer;
}

/**
 * This object represents the bot's name.
 * @see https://core.telegram.org/bots/api#botname
 */
export interface BotName {
  /** The bot's name */
  name: string;
}

/**
 * This object represents the bot's description.
 * @see https://core.telegram.org/bots/api#botdescription
 */
export interface BotDescription {
  /** The bot's description */
  description: string;
}

/**
 * This object represents the bot's short description.
 * @see https://core.telegram.org/bots/api#botshortdescription
 */
export interface BotShortDescription {
  /** The bot's short description */
  short_description: string;
}

/**
 * This object describes the bot's menu button in a private chat.
 * @see https://core.telegram.org/bots/api#menubutton
 */
export interface MenuButton {}

/**
 * Represents a menu button, which opens the bot's list of commands.
 * @see https://core.telegram.org/bots/api#menubuttoncommands
 */
export interface MenuButtonCommands extends MenuButton {
  /** Type of the button, must be commands */
  type: "commands";
}

/**
 * Represents a menu button, which launches a Web App.
 * @see https://core.telegram.org/bots/api#menubuttonwebapp
 */
export interface MenuButtonWebApp extends MenuButton {
  /** Type of the button, must be web_app */
  type: "web_app";
  /** Text on the button */
  text: string;
  /** Description of the Web App that will be launched when the user presses the button. The Web App will be able to send an arbitrary message on behalf of the user using the method answerWebAppQuery. Available only in private chats between a user and the bot. */
  web_app: WebAppInfo;
}

/**
 * Describes that no specific value for the menu button was set.
 * @see https://core.telegram.org/bots/api#menubuttondefault
 */
export interface MenuButtonDefault extends MenuButton {
  /** Type of the button, must be default */
  type: "default";
}

/**
 * Describes why a request was unsuccessful.
 * @see https://core.telegram.org/bots/api#responseparameters
 */
export interface ResponseParameters {
  /** Optional. The group has been migrated to a supergroup with the specified identifier. This number may have more than 32 significant bits and some programming languages may have difficulty/silent defects in interpreting it. But it has at most 52 significant bits, so a 64-bit integer or double-precision float type are safe for storing this identifier. */
  migrate_to_chat_id?: Integer;
  /** Optional. In case of exceeding flood control, the number of seconds left to wait before the request can be repeated */
  retry_after?: Integer;
}

/**
 * This object represents the content of a media message to be sent. It should be one of InputMediaAnimation, InputMediaDocument, InputMediaAudio, InputMediaPhoto, InputMediaVideo
 * @see https://core.telegram.org/bots/api#inputmedia
 */
export interface InputMedia {}

/**
 * Represents a photo to be sent.
 * @see https://core.telegram.org/bots/api#inputmediaphoto
 */
export interface InputMediaPhoto extends InputMedia {
  /** Type of the result, must be photo */
  type: "photo";
  /** File to send. Pass a file_id to send a file that exists on the Telegram servers (recommended), pass an HTTP URL for Telegram to get a file from the Internet, or pass “attach://<file_attach_name>” to upload a new one using multipart/form-data under <file_attach_name> name. */
  media: string;
  /** Optional. Caption of the photo to be sent, 0-1024 characters after entities parsing */
  caption?: string;
  /** Optional. Mode for parsing entities in the photo caption. See formatting options for more details. */
  parse_mode?: string;
  /** Optional. List of special entities that appear in the caption, which can be specified instead of parse_mode */
  caption_entities?: Array<MessageEntity>;
  /** Optional. Pass True if the photo needs to be covered with a spoiler animation */
  has_spoiler?: boolean;
}

/**
 * Represents a video to be sent.
 * @see https://core.telegram.org/bots/api#inputmediavideo
 */
export interface InputMediaVideo extends InputMedia {
  /** Type of the result, must be video */
  type: "video";
  /** File to send. Pass a file_id to send a file that exists on the Telegram servers (recommended), pass an HTTP URL for Telegram to get a file from the Internet, or pass “attach://<file_attach_name>” to upload a new one using multipart/form-data under <file_attach_name> name. */
  media: string;
  /** Optional. Thumbnail of the file sent; can be ignored if thumbnail generation for the file is supported server-side. The thumbnail should be in JPEG format and less than 200 kB in size. A thumbnail's width and height should not exceed 320. Ignored if the file is not uploaded using multipart/form-data. Thumbnails can't be reused and can be only uploaded as a new file, so you can pass “attach://<file_attach_name>” if the thumbnail was uploaded using multipart/form-data under <file_attach_name>. */
  thumbnail?: InputFile;
  /** Optional. Caption of the video to be sent, 0-1024 characters after entities parsing */
  caption?: string;
  /** Optional. Mode for parsing entities in the video caption. See formatting options for more details. */
  parse_mode?: string;
  /** Optional. List of special entities that appear in the caption, which can be specified instead of parse_mode */
  caption_entities?: Array<MessageEntity>;
  /** Optional. Video width */
  width?: Integer;
  /** Optional. Video height */
  height?: Integer;
  /** Optional. Video duration in seconds */
  duration?: Integer;
  /** Optional. Pass True if the uploaded video is suitable for streaming */
  supports_streaming?: boolean;
  /** Optional. Pass True if the photo needs to be covered with a spoiler animation */
  has_spoiler?: boolean;
}

/**
 * Represents an animation file (GIF or H.264/MPEG-4 AVC without sound) to be sent.
 * @see https://core.telegram.org/bots/api#inputmediaanimation
 */
export interface InputMediaAnimation extends InputMedia {
  /** Type of the result, must be animation */
  type: "animation";
  /** File to send. Pass a file_id to send a file that exists on the Telegram servers (recommended), pass an HTTP URL for Telegram to get a file from the Internet, or pass “attach://<file_attach_name>” to upload a new one using multipart/form-data under <file_attach_name> name. */
  media: string;
  /** Optional. Thumbnail of the file sent; can be ignored if thumbnail generation for the file is supported server-side. The thumbnail should be in JPEG format and less than 200 kB in size. A thumbnail's width and height should not exceed 320. Ignored if the file is not uploaded using multipart/form-data. Thumbnails can't be reused and can be only uploaded as a new file, so you can pass “attach://<file_attach_name>” if the thumbnail was uploaded using multipart/form-data under <file_attach_name>. */
  thumbnail?: InputFile;
  /** Optional. Caption of the animation to be sent, 0-1024 characters after entities parsing */
  caption?: string;
  /** Optional. Mode for parsing entities in the animation caption. See formatting options for more details. */
  parse_mode?: string;
  /** Optional. List of special entities that appear in the caption, which can be specified instead of parse_mode */
  caption_entities?: Array<MessageEntity>;
  /** Optional. Animation width */
  width?: Integer;
  /** Optional. Animation height */
  height?: Integer;
  /** Optional. Animation duration in seconds */
  duration?: Integer;
  /** Optional. Pass True if the photo needs to be covered with a spoiler animation */
  has_spoiler?: boolean;
}

/**
 * Represents an audio file to be treated as music to be sent.
 * @see https://core.telegram.org/bots/api#inputmediaaudio
 */
export interface InputMediaAudio extends InputMedia {
  /** Type of the result, must be audio */
  type: "audio";
  /** File to send. Pass a file_id to send a file that exists on the Telegram servers (recommended), pass an HTTP URL for Telegram to get a file from the Internet, or pass “attach://<file_attach_name>” to upload a new one using multipart/form-data under <file_attach_name> name. */
  media: string;
  /** Optional. Thumbnail of the file sent; can be ignored if thumbnail generation for the file is supported server-side. The thumbnail should be in JPEG format and less than 200 kB in size. A thumbnail's width and height should not exceed 320. Ignored if the file is not uploaded using multipart/form-data. Thumbnails can't be reused and can be only uploaded as a new file, so you can pass “attach://<file_attach_name>” if the thumbnail was uploaded using multipart/form-data under <file_attach_name>. */
  thumbnail?: InputFile;
  /** Optional. Caption of the audio to be sent, 0-1024 characters after entities parsing */
  caption?: string;
  /** Optional. Mode for parsing entities in the audio caption. See formatting options for more details. */
  parse_mode?: string;
  /** Optional. List of special entities that appear in the caption, which can be specified instead of parse_mode */
  caption_entities?: Array<MessageEntity>;
  /** Optional. Duration of the audio in seconds */
  duration?: Integer;
  /** Optional. Performer of the audio */
  performer?: string;
  /** Optional. Title of the audio */
  title?: string;
}

/**
 * Represents a general file to be sent.
 * @see https://core.telegram.org/bots/api#inputmediadocument
 */
export interface InputMediaDocument extends InputMedia {
  /** Type of the result, must be document */
  type: "document";
  /** File to send. Pass a file_id to send a file that exists on the Telegram servers (recommended), pass an HTTP URL for Telegram to get a file from the Internet, or pass “attach://<file_attach_name>” to upload a new one using multipart/form-data under <file_attach_name> name. */
  media: string;
  /** Optional. Thumbnail of the file sent; can be ignored if thumbnail generation for the file is supported server-side. The thumbnail should be in JPEG format and less than 200 kB in size. A thumbnail's width and height should not exceed 320. Ignored if the file is not uploaded using multipart/form-data. Thumbnails can't be reused and can be only uploaded as a new file, so you can pass “attach://<file_attach_name>” if the thumbnail was uploaded using multipart/form-data under <file_attach_name>. */
  thumbnail?: InputFile;
  /** Optional. Caption of the document to be sent, 0-1024 characters after entities parsing */
  caption?: string;
  /** Optional. Mode for parsing entities in the document caption. See formatting options for more details. */
  parse_mode?: string;
  /** Optional. List of special entities that appear in the caption, which can be specified instead of parse_mode */
  caption_entities?: Array<MessageEntity>;
  /** Optional. Disables automatic server-side content type detection for files uploaded using multipart/form-data. Always true, if the document is sent as part of an album. */
  disable_content_type_detection?: boolean;
}

/**
 * This object represents the content of a file to be uploaded. Must be posted using multipart/form-data in the usual way that files are uploaded via the browser.
 * @see https://core.telegram.org/bots/api#inputfile
 */
export interface InputFile {
  /** Contents of the file */
  content: Buffer;
  /** Name of the file */
  filename: string;
}

/**
 * This object represents the content of a service message, sent whenever a user in the chat triggers a proximity alert set by another user.
 * @see https://core.telegram.org/bots/api#proximityalerttriggered
 */
export interface ProximityAlertTriggered {
  /** User that triggered the alert */
  traveler: User;
  /** User that set the alert */
  watcher: User;
  /** The distance between the users */
  distance: Integer;
}

/**
 * This object represents a service message about a new forum topic created in the chat.
 * @see https://core.telegram.org/bots/api#forumtopiccreated
 */
export interface ForumTopicCreated {
  /** Name of the topic */
  name: string;
  /** Color of the topic icon in RGB format */
  icon_color: Integer;
  /** Optional. Unique identifier of the custom emoji shown as the topic icon */
  icon_custom_emoji_id?: string;
}

/**
 * This object represents a service message about a forum topic closed in the chat. Currently holds no information.
 * @see https://core.telegram.org/bots/api#forumtopicclosed
 */
export interface ForumTopicClosed {}

/**
 * This object represents a service message about an edited forum topic.
 * @see https://core.telegram.org/bots/api#forumtopicedited
 */
export interface ForumTopicEdited {
  /** Optional. New name of the topic, if it was edited */
  name?: string;
  /** Optional. New identifier of the custom emoji shown as the topic icon, if it was edited; an empty string if the icon was removed */
  icon_custom_emoji_id?: string;
}

/**
 * This object represents a service message about a forum topic reopened in the chat. Currently holds no information.
 * @see https://core.telegram.org/bots/api#forumtopicreopened
 */
export interface ForumTopicReopened {}

/**
 * This object represents a service message about General forum topic hidden in the chat. Currently holds no information.
 * @see https://core.telegram.org/bots/api#generalforumtopichidden
 */
export interface GeneralForumTopicHidden {}

/**
 * This object represents a service message about General forum topic unhidden in the chat. Currently holds no information.
 * @see https://core.telegram.org/bots/api#generalforumtopicunhidden
 */
export interface GeneralForumTopicUnhidden {}

/**
 * This object contains information about the user whose identifier was shared with the bot using a KeyboardButtonRequestUser button.
 * @see https://core.telegram.org/bots/api#shareduser
 */
export interface SharedUser {
  /** Identifier of the shared user. This number may have more than 32 significant bits and some programming languages may have difficulty/silent defects in interpreting it. But it has at most 52 significant bits, so a 64-bit integer or double-precision float type are safe for storing this identifier. The bot may not have access to the user and could be unable to use this identifier, unless the user is already known to the bot by some other means. */
  user_id: Integer;
  /** Optional. First name of the user, if the name was requested by the bot */
  first_name?: string;
  /** Optional. Last name of the user, if the name was requested by the bot */
  last_name?: string;
  /** Optional. Username of the user, if the username was requested by the bot */
  username?: string;
  /** Optional. Available sizes of the chat photo, if the photo was requested and available */
  photo?: Array<PhotoSize>;
}

/**
 * This object represents a service message about a user allowing a bot to write messages after adding it to the attachment or side menu, or if the bot is added to the chat.
 * @see https://core.telegram.org/bots/api#writeaccessallowed
 */
export interface WriteAccessAllowed {
  /** Optional. True, if the access was granted after the user accepted an explicit request from a Web App sent by the method requestWriteAccess */
  from_request?: boolean;
  /** Optional. Name of the Web App, if the access was granted when the Web App was launched from a link */
  web_app_name?: string;
  /** Optional. True, if the access was granted when the bot was added to the attachment or side menu */
  from_attachment_menu?: boolean;
}

/**
 * This object represents a service message about a video chat scheduled in the chat.
 * @see https://core.telegram.org/bots/api#videochatscheduled
 */
export interface VideoChatScheduled {
  /** Point in time (Unix timestamp) when the video chat is supposed to be started by a chat administrator */
  start_date: Integer;
}

/**
 * This object represents a service message about a video chat ended in the chat.
 * @see https://core.telegram.org/bots/api#videochatended
 */
export interface VideoChatEnded {
  /** Video chat duration in seconds */
  duration: Integer;
}

/**
 * This object represents a service message about new members invited to a video chat.
 * @see https://core.telegram.org/bots/api#videochatparticipantsinvited
 */
export interface VideoChatParticipantsInvited {
  /** New members that were invited to the video chat */
  users: Array<User>;
}

/**
 * This object contains information about a paid media purchased by the user.
 * @see https://core.telegram.org/bots/api#paidmediapurchased
 */
export interface PaidMediaPurchased {
  /** User who purchased the media */
  from: User;
  /** Bot-specified paid media payload */
  paid_media_payload: string;
}

/**
 * This object contains information about a paid media.
 * @see https://core.telegram.org/bots/api#paidmedia
 */
export interface PaidMedia {}

/**
 * The paid media is a photo.
 * @see https://core.telegram.org/bots/api#paidmediaphoto
 */
export interface PaidMediaPhoto extends PaidMedia {
  /** Type of the paid media, always “photo” */
  type: "photo";
  /** The photo */
  photo: Array<PhotoSize>;
}

/**
 * The paid media is a video.
 * @see https://core.telegram.org/bots/api#paidmediavideo
 */
export interface PaidMediaVideo extends PaidMedia {
  /** Type of the paid media, always “video” */
  type: "video";
  /** The video */
  video: Video;
}

/**
 * The paid media is a preview.
 * @see https://core.telegram.org/bots/api#paidmediapreview
 */
export interface PaidMediaPreview extends PaidMedia {
  /** Type of the paid media, always “preview” */
  type: "preview";
  /** Optional. Media width as defined by the sender */
  width?: Integer;
  /** Optional. Media height as defined by the sender */
  height?: Integer;
  /** Optional. Duration of the media in seconds as defined by the sender */
  duration?: Integer;
}

/**
 * This object contains information about a paid media purchase.
 * @see https://core.telegram.org/bots/api#paidmediainfo
 */
export interface PaidMediaInfo {
  /** The number of media in the paid media */
  paid_media: Array<PaidMedia>;
  /** Optional. The bot-specified paid media payload */
  star_count?: Integer;
}

/**
 * This object represents a service message about a change in auto-delete timer settings.
 * @see https://core.telegram.org/bots/api#messageautodeletetimerchanged
 */
export interface MessageAutoDeleteTimerChanged {
  /** New auto-delete time for messages in the chat; in seconds */
  message_auto_delete_time: Integer;
}

/**
 * This object represents a service message about a user boosting a chat.
 * @see https://core.telegram.org/bots/api#chatboostadded
 */
export interface ChatBoostAdded {
  /** Number of boosts added by the user */
  boost_count: Integer;
}

/**
 * This object describes the paid media to send.
 * @see https://core.telegram.org/bots/api#inputpaidmedia
 */
export interface InputPaidMedia {}

/**
 * The paid media to send is a photo.
 * @see https://core.telegram.org/bots/api#inputpaidmediaphoto
 */
export interface InputPaidMediaPhoto extends InputPaidMedia {
  /** Type of the media, must be photo */
  type: "photo";
  /** File to send. Pass a file_id to send a file that exists on the Telegram servers (recommended), pass an HTTP URL for Telegram to get a file from the Internet, or pass “attach://<file_attach_name>” to upload a new one using multipart/form-data under <file_attach_name> name. */
  media: string;
}

/**
 * The paid media to send is a video.
 * @see https://core.telegram.org/bots/api#inputpaidmediavideo
 */
export interface InputPaidMediaVideo extends InputPaidMedia {
  /** Type of the media, must be video */
  type: "video";
  /** File to send. Pass a file_id to send a file that exists on the Telegram servers (recommended), pass an HTTP URL for Telegram to get a file from the Internet, or pass “attach://<file_attach_name>” to upload a new one using multipart/form-data under <file_attach_name> name. */
  media: string;
  /** Optional. Thumbnail of the file sent; can be ignored if thumbnail generation for the file is supported server-side. The thumbnail should be in JPEG format and less than 200 kB in size. A thumbnail's width and height should not exceed 320. Ignored if the file is not uploaded using multipart/form-data. Thumbnails can't be reused and can be only uploaded as a new file, so you can pass “attach://<file_attach_name>” if the thumbnail was uploaded using multipart/form-data under <file_attach_name>. */
  thumbnail?: InputFile;
  /** Optional. Video width */
  width?: Integer;
  /** Optional. Video height */
  height?: Integer;
  /** Optional. Video duration in seconds */
  duration?: Integer;
  /** Optional. Pass True if the uploaded video is suitable for streaming */
  supports_streaming?: boolean;
}

/**
 * This object represents a service message about the creation of a scheduled giveaway.
 * @see https://core.telegram.org/bots/api#giveawaycreated
 */
export interface GiveawayCreated {}

/**
 * This object represents a message about a scheduled giveaway.
 * @see https://core.telegram.org/bots/api#giveaway
 */
export interface Giveaway {
  /** The list of chats which the user must join to participate in the giveaway */
  chats: Array<Chat>;
  /** Point in time (Unix timestamp) when the users of the indicated chats can start participating in the giveaway */
  winners_selection_date: Integer;
  /** The number of users which are supposed to be selected as winners of the giveaway */
  winner_count: Integer;
  /** Optional. True, if only users who join the chats after the giveaway started should be eligible to win */
  only_new_members?: boolean;
  /** Optional. True, if the list of giveaway winners will be visible to everyone */
  has_public_winners?: boolean;
  /** Optional. Description of additional giveaway prize */
  prize_description?: string;
  /** Optional. A list of two-letter ISO 3166-1 alpha-2 country codes indicating the countries from which eligible users for the giveaway must come. If empty, then all users can participate in the giveaway. Users with a phone number that was bought on Fragment can always participate in giveaways. */
  country_codes?: Array<string>;
  /** Optional. The number of months the Telegram Premium subscription won from the giveaway will be active for */
  premium_subscription_month_count?: Integer;
}

/**
 * This object represents a message about the completion of a giveaway with public winners.
 * @see https://core.telegram.org/bots/api#giveawaywinners
 */
export interface GiveawayWinners {
  /** The chat that created the giveaway */
  chat: Chat;
  /** Identifier of the message with the giveaway in the chat */
  giveaway_message_id: Integer;
  /** Point in time (Unix timestamp) when winners of the giveaway were selected */
  winners_selection_date: Integer;
  /** Total number of winners in the giveaway */
  winner_count: Integer;
  /** List of up to 100 winners of the giveaway */
  winners: Array<User>;
  /** Optional. The number of other chats in the list of required chats for the giveaway */
  additional_chat_count?: Integer;
  /** Optional. The number of months the Telegram Premium subscription won from the giveaway will be active for */
  premium_subscription_month_count?: Integer;
  /** Optional. Number of undistributed prizes */
  unclaimed_prize_count?: Integer;
  /** Optional. True, if only users who had joined the chats after the giveaway started were eligible to win */
  only_new_members?: boolean;
  /** Optional. True, if the giveaway was canceled because the payment for the giveaway could not be processed */
  was_refunded?: boolean;
  /** Optional. Description of additional giveaway prize */
  prize_description?: string;
}

/**
 * This object represents a service message about the completion of a giveaway without public winners.
 * @see https://core.telegram.org/bots/api#giveawaycompleted
 */
export interface GiveawayCompleted {
  /** Number of winners in the giveaway */
  winner_count: Integer;
  /** Optional. Number of undistributed prizes */
  unclaimed_prize_count?: Integer;
  /** Optional. True, if the message was originally sent by an anonymous admin */
  via_bot?: boolean;
  /** Optional. Point in time (Unix timestamp) when the giveaway will be completed and winners will be selected */
  winners_selection_date?: Integer;
}

/**
 * This object contains information about a direct message price changed.
 * @see https://core.telegram.org/bots/api#directmessagepricechanged
 */
export interface DirectMessagePriceChanged {
  /** The new price of the direct message in the smallest units of the currency */
  price: Integer;
  /** The old price of the direct message in the smallest units of the currency */
  old_price: Integer;
}

/**
 * This object contains information about a suggested post price changed.
 * @see https://core.telegram.org/bots/api#suggestedpostpricechanged
 */
export interface SuggestedPostPriceChanged {
  /** The new price of the suggested post in the smallest units of the currency */
  price: Integer;
  /** The old price of the suggested post in the smallest units of the currency */
  old_price: Integer;
}

/**
 * This object contains information about a suggested post approved.
 * @see https://core.telegram.org/bots/api#suggestedpostapproved
 */
export interface SuggestedPostApproved {
  /** The ID of the suggested post */
  post_id: Integer;
  /** The ID of the user that created the suggested post */
  user_id: Integer;
}

/**
 * This object contains information about a suggested post approval failed.
 * @see https://core.telegram.org/bots/api#suggestedpostapprovalfailed
 */
export interface SuggestedPostApprovalFailed {
  /** The ID of the suggested post */
  post_id: Integer;
  /** The ID of the user that created the suggested post */
  user_id: Integer;
}

/**
 * This object contains information about a suggested post declined.
 * @see https://core.telegram.org/bots/api#suggestedpostdeclined
 */
export interface SuggestedPostDeclined {
  /** The ID of the suggested post */
  post_id: Integer;
  /** The ID of the user that created the suggested post */
  user_id: Integer;
}

/**
 * This object contains information about a suggested post paid.
 * @see https://core.telegram.org/bots/api#suggestedpostpaid
 */
export interface SuggestedPostPaid {
  /** The ID of the suggested post */
  post_id: Integer;
  /** The ID of the user that created the suggested post */
  user_id: Integer;
  /** The price of the suggested post in the smallest units of the currency */
  price: Integer;
}

/**
 * This object contains information about a suggested post refunded.
 * @see https://core.telegram.org/bots/api#suggestedpostrefunded
 */
export interface SuggestedPostRefunded {
  /** The ID of the suggested post */
  post_id: Integer;
  /** The ID of the user that created the suggested post */
  user_id: Integer;
  /** The price of the suggested post in the smallest units of the currency */
  price: Integer;
}

/**
 * This object contains information about a story.
 * @see https://core.telegram.org/bots/api#story
 */
export interface Story {}

/**
 * This object represents a service message about a new forum topic created in the chat.
 * @see https://core.telegram.org/bots/api#forumtopic
 */
export interface ForumTopic {
  /** Unique identifier of the forum topic */
  message_thread_id: Integer;
  /** Name of the topic */
  name: string;
  /** Color of the topic icon in RGB format */
  icon_color: Integer;
  /** Optional. Unique identifier of the custom emoji shown as the topic icon */
  icon_custom_emoji_id?: string;
}

/**
 * This object describes the paid media to send.
 * @see https://core.telegram.org/bots/api#inputpaidmedia
 */
export type InputPaidMediaUnion = InputPaidMediaPhoto | InputPaidMediaVideo;

// =============================================================================
// Stickers and Emoji Types
// =============================================================================

/**
 * This object represents a sticker.
 * @see https://core.telegram.org/bots/api#sticker
 */
export interface Sticker {
  /** Identifier for this file, which can be used to download or reuse the file */
  file_id: string;
  /** Unique identifier for this file, which is supposed to be the same over time and for different bots. Can't be used to download or reuse the file. */
  file_unique_id: string;
  /** Type of the sticker, currently one of “regular”, “mask”, “custom_emoji”. The type of the sticker is independent from its format, which is determined by the fields is_animated and is_video. */
  type: string;
  /** Sticker width */
  width: Integer;
  /** Sticker height */
  height: Integer;
  /** True, if the sticker is animated */
  is_animated: boolean;
  /** True, if the sticker is a video sticker */
  is_video: boolean;
  /** Optional. Sticker thumbnail in the .WEBP or .JPG format */
  thumbnail?: PhotoSize;
  /** Optional. Emoji associated with the sticker */
  emoji?: string;
  /** Optional. Name of the sticker set to which the sticker belongs */
  set_name?: string;
  /** Optional. For premium regular stickers, premium animation for the sticker */
  premium_animation?: File;
  /** Optional. For mask stickers, the position where the mask should be placed */
  mask_position?: MaskPosition;
  /** Optional. For custom emoji stickers, unique identifier of the custom emoji */
  custom_emoji_id?: string;
  /** Optional. File size in bytes */
  file_size?: Integer;
  /** Optional. True, if the sticker must be repainted to a text color in messages, the accent color if used as emoji status, white on chat photos, or another appropriate color in other specific settings */
  needs_repainting?: boolean;
}

/**
 * This object represents a sticker set.
 * @see https://core.telegram.org/bots/api#stickerset
 */
export interface StickerSet {
  /** Sticker set name */
  name: string;
  /** Sticker set title */
  title: string;
  /** Type of stickers in the set, currently one of “regular”, “mask”, “custom_emoji” */
  sticker_type: string;
  /** True, if the sticker set contains animated stickers */
  is_animated: boolean;
  /** True, if the sticker set contains video stickers */
  is_video: boolean;
  /** List of all set stickers */
  stickers: Array<Sticker>;
  /** Optional. Sticker set thumbnail in the .WEBP, .TGS, or .WEBM format */
  thumbnail?: PhotoSize;
}

/**
 * This object describes position on faces where a mask should be placed by default.
 * @see https://core.telegram.org/bots/api#maskposition
 */
export interface MaskPosition {
  /** The part of the face relative to which the mask should be placed. One of "forehead", "eyes", "mouth", or "chin". */
  point: string;
  /** Shift by X-axis measured in widths of the mask scaled to the face size, from left to right. For example, choosing -1.0 will place mask just to the left of the default mask position. */
  x_shift: Float;
  /** Shift by Y-axis measured in heights of the mask scaled to the face size, from top to bottom. For example, 1.0 will place the mask just below the default mask position. */
  y_shift: Float;
  /** Mask scaling coefficient. For example, 2.0 means double size. */
  scale: Float;
}

// =============================================================================
// Inline Mode Types
// =============================================================================

/**
 * This object represents one result of an inline query. From this point on, the contents of the object are determined by result_type. At the moment, the following result types are supported: Article, Photo, Gif, Mpeg4Gif, Video, Audio, Voice, Document, Location, Venue, Contact, Game
 * @see https://core.telegram.org/bots/api#inlinequeryresult
 */
export interface InlineQueryResult {}

/**
 * Represents a link to an article or web page.
 * @see https://core.telegram.org/bots/api#inlinequeryresultarticle
 */
export interface InlineQueryResultArticle extends InlineQueryResult {
  /** Type of the result, must be article */
  type: "article";
  /** Unique identifier for this result, 1-64 Bytes */
  id: string;
  /** Title of the result */
  title: string;
  /** Content of the message to be sent */
  input_message_content: InputMessageContent;
  /** Optional. Inline keyboard attached to the message */
  reply_markup?: InlineKeyboardMarkup;
  /** Optional. URL of the result */
  url?: string;
  /** Optional. Pass True if you don't want the URL to be shown in the message */
  hide_url?: boolean;
  /** Optional. Short description of the result */
  description?: string;
  /** Optional. Url of the thumbnail for the result */
  thumbnail_url?: string;
  /** Optional. Thumbnail width */
  thumbnail_width?: Integer;
  /** Optional. Thumbnail height */
  thumbnail_height?: Integer;
}

/**
 * Represents a link to a photo. By default, this photo will be sent by the user with optional caption. Alternatively, you can use input_message_content to send a message with the specified content instead of the photo.
 * @see https://core.telegram.org/bots/api#inlinequeryresultphoto
 */
export interface InlineQueryResultPhoto extends InlineQueryResult {
  /** Type of the result, must be photo */
  type: "photo";
  /** Unique identifier for this result, 1-64 Bytes */
  id: string;
  /** A valid URL of the photo. Photo must be in JPEG format. Photo size must not exceed 5MB */
  photo_url: string;
  /** URL of the thumbnail for the photo */
  thumbnail_url: string;
  /** Optional. Width of the photo */
  photo_width?: Integer;
  /** Optional. Height of the photo */
  photo_height?: Integer;
  /** Optional. Title for the result */
  title?: string;
  /** Optional. Short description of the result */
  description?: string;
  /** Optional. Caption of the photo to be sent, 0-1024 characters after entities parsing */
  caption?: string;
  /** Optional. Mode for parsing entities in the photo caption. See formatting options for more details. */
  parse_mode?: string;
  /** Optional. List of special entities that appear in the caption, which can be specified instead of parse_mode */
  caption_entities?: Array<MessageEntity>;
  /** Optional. Inline keyboard attached to the message */
  reply_markup?: InlineKeyboardMarkup;
  /** Optional. Content of the message to be sent instead of the photo */
  input_message_content?: InputMessageContent;
}

/**
 * Represents a link to an animated GIF file. By default, this animated GIF file will be sent by the user with optional caption. Alternatively, you can use input_message_content to send a message with the specified content instead of the animation.
 * @see https://core.telegram.org/bots/api#inlinequeryresultgif
 */
export interface InlineQueryResultGif extends InlineQueryResult {
  /** Type of the result, must be gif */
  type: "gif";
  /** Unique identifier for this result, 1-64 Bytes */
  id: string;
  /** A valid URL for the GIF file. File size must not exceed 1MB */
  gif_url: string;
  /** Optional. Width of the GIF */
  gif_width?: Integer;
  /** Optional. Height of the GIF */
  gif_height?: Integer;
  /** Optional. Duration of the GIF in seconds */
  gif_duration?: Integer;
  /** URL of the static (JPEG or GIF) or animated (MPEG4) thumbnail for the result */
  thumbnail_url: string;
  /** Optional. MIME type of the thumbnail, must be one of “image/jpeg”, “image/gif”, or “video/mp4”. Defaults to “image/jpeg” */
  thumbnail_mime_type?: string;
  /** Optional. Title for the result */
  title?: string;
  /** Optional. Caption of the GIF file to be sent, 0-1024 characters after entities parsing */
  caption?: string;
  /** Optional. Mode for parsing entities in the caption. See formatting options for more details. */
  parse_mode?: string;
  /** Optional. List of special entities that appear in the caption, which can be specified instead of parse_mode */
  caption_entities?: Array<MessageEntity>;
  /** Optional. Inline keyboard attached to the message */
  reply_markup?: InlineKeyboardMarkup;
  /** Optional. Content of the message to be sent instead of the GIF animation */
  input_message_content?: InputMessageContent;
}

/**
 * Represents a link to a video animation (H.264/MPEG-4 AVC video without sound). By default, this animated MPEG4 file will be sent by the user with optional caption. Alternatively, you can use input_message_content to send a message with the specified content instead of the animation.
 * @see https://core.telegram.org/bots/api#inlinequeryresultmpeg4gif
 */
export interface InlineQueryResultMpeg4Gif extends InlineQueryResult {
  /** Type of the result, must be mpeg4_gif */
  type: "mpeg4_gif";
  /** Unique identifier for this result, 1-64 Bytes */
  id: string;
  /** A valid URL for the MPEG4 file. File size must not exceed 1MB */
  mpeg4_url: string;
  /** Optional. Video width */
  mpeg4_width?: Integer;
  /** Optional. Video height */
  mpeg4_height?: Integer;
  /** Optional. Video duration in seconds */
  mpeg4_duration?: Integer;
  /** URL of the static (JPEG or GIF) or animated (MPEG4) thumbnail for the result */
  thumbnail_url: string;
  /** Optional. MIME type of the thumbnail, must be one of “image/jpeg”, “image/gif”, or “video/mp4”. Defaults to “image/jpeg” */
  thumbnail_mime_type?: string;
  /** Optional. Title for the result */
  title?: string;
  /** Optional. Caption of the MPEG-4 file to be sent, 0-1024 characters after entities parsing */
  caption?: string;
  /** Optional. Mode for parsing entities in the caption. See formatting options for more details. */
  parse_mode?: string;
  /** Optional. List of special entities that appear in the caption, which can be specified instead of parse_mode */
  caption_entities?: Array<MessageEntity>;
  /** Optional. Inline keyboard attached to the message */
  reply_markup?: InlineKeyboardMarkup;
  /** Optional. Content of the message to be sent instead of the video animation */
  input_message_content?: InputMessageContent;
}

/**
 * Represents a link to a page containing an embedded video player or a video file. By default, this video file will be sent by the user with an optional caption. Alternatively, you can use input_message_content to send a message with the specified content instead of the video.
 * @see https://core.telegram.org/bots/api#inlinequeryresultvideo
 */
export interface InlineQueryResultVideo extends InlineQueryResult {
  /** Type of the result, must be video */
  type: "video";
  /** Unique identifier for this result, 1-64 Bytes */
  id: string;
  /** A valid URL for the embedded video player or video file */
  video_url: string;
  /** MIME type of the content of the video URL, “text/html” or “video/mp4” */
  mime_type: string;
  /** URL of the thumbnail (JPEG only) for the video */
  thumbnail_url: string;
  /** Title for the result */
  title: string;
  /** Optional. Caption of the video to be sent, 0-1024 characters after entities parsing */
  caption?: string;
  /** Optional. Mode for parsing entities in the video caption. See formatting options for more details. */
  parse_mode?: string;
  /** Optional. List of special entities that appear in the caption, which can be specified instead of parse_mode */
  caption_entities?: Array<MessageEntity>;
  /** Optional. Video width */
  video_width?: Integer;
  /** Optional. Video height */
  video_height?: Integer;
  /** Optional. Video duration in seconds */
  video_duration?: Integer;
  /** Optional. Short description of the result */
  description?: string;
  /** Optional. Inline keyboard attached to the message */
  reply_markup?: InlineKeyboardMarkup;
  /** Optional. Content of the message to be sent instead of the video. This field is required if InlineQueryResultVideo is used to send an HTML-page as a result (e.g., a YouTube video). */
  input_message_content?: InputMessageContent;
}

/**
 * Represents a link to an MP3 audio file. By default, this audio file will be sent by the user. Alternatively, you can use input_message_content to send a message with the specified content instead of the audio.
 * @see https://core.telegram.org/bots/api#inlinequeryresultaudio
 */
export interface InlineQueryResultAudio extends InlineQueryResult {
  /** Type of the result, must be audio */
  type: "audio";
  /** Unique identifier for this result, 1-64 Bytes */
  id: string;
  /** A valid URL for the audio file */
  audio_url: string;
  /** Title */
  title: string;
  /** Optional. Caption, 0-1024 characters after entities parsing */
  caption?: string;
  /** Optional. Mode for parsing entities in the audio caption. See formatting options for more details. */
  parse_mode?: string;
  /** Optional. List of special entities that appear in the caption, which can be specified instead of parse_mode */
  caption_entities?: Array<MessageEntity>;
  /** Optional. Performer */
  performer?: string;
  /** Optional. Audio duration in seconds */
  audio_duration?: Integer;
  /** Optional. Inline keyboard attached to the message */
  reply_markup?: InlineKeyboardMarkup;
  /** Optional. Content of the message to be sent instead of the audio */
  input_message_content?: InputMessageContent;
}

/**
 * Represents a link to a voice recording in an .OGG container encoded with OPUS. By default, this voice recording will be sent by the user. Alternatively, you can use input_message_content to send a message with the specified content instead of the the voice message.
 * @see https://core.telegram.org/bots/api#inlinequeryresultvoice
 */
export interface InlineQueryResultVoice extends InlineQueryResult {
  /** Type of the result, must be voice */
  type: "voice";
  /** Unique identifier for this result, 1-64 Bytes */
  id: string;
  /** A valid URL for the voice recording */
  voice_url: string;
  /** Recording title */
  title: string;
  /** Optional. Caption, 0-1024 characters after entities parsing */
  caption?: string;
  /** Optional. Mode for parsing entities in the voice caption. See formatting options for more details. */
  parse_mode?: string;
  /** Optional. List of special entities that appear in the caption, which can be specified instead of parse_mode */
  caption_entities?: Array<MessageEntity>;
  /** Optional. Recording duration in seconds */
  voice_duration?: Integer;
  /** Optional. Inline keyboard attached to the message */
  reply_markup?: InlineKeyboardMarkup;
  /** Optional. Content of the message to be sent instead of the voice recording */
  input_message_content?: InputMessageContent;
}

/**
 * Represents a link to a file. By default, this file will be sent by the user with an optional caption. Alternatively, you can use input_message_content to send a message with the specified content instead of the file. Currently, only .PDF and .ZIP files can be sent using this method.
 * @see https://core.telegram.org/bots/api#inlinequeryresultdocument
 */
export interface InlineQueryResultDocument extends InlineQueryResult {
  /** Type of the result, must be document */
  type: "document";
  /** Unique identifier for this result, 1-64 Bytes */
  id: string;
  /** Title for the result */
  title: string;
  /** Optional. Caption of the document to be sent, 0-1024 characters after entities parsing */
  caption?: string;
  /** Optional. Mode for parsing entities in the document caption. See formatting options for more details. */
  parse_mode?: string;
  /** Optional. List of special entities that appear in the caption, which can be specified instead of parse_mode */
  caption_entities?: Array<MessageEntity>;
  /** A valid URL for the file */
  document_url: string;
  /** MIME type of the content of the file, either “application/pdf” or “application/zip” */
  mime_type: string;
  /** Optional. Short description of the result */
  description?: string;
  /** Optional. Inline keyboard attached to the message */
  reply_markup?: InlineKeyboardMarkup;
  /** Optional. Content of the message to be sent instead of the file */
  input_message_content?: InputMessageContent;
  /** Optional. URL of the thumbnail (JPEG only) for the file */
  thumbnail_url?: string;
  /** Optional. Thumbnail width */
  thumbnail_width?: Integer;
  /** Optional. Thumbnail height */
  thumbnail_height?: Integer;
}

/**
 * Represents a link to a location on a map. By adding a Live Location each result can be used to send a message with the specified Location to the bot's chat partner, instead of any text or other content.
 * @see https://core.telegram.org/bots/api#inlinequeryresultlocation
 */
export interface InlineQueryResultLocation extends InlineQueryResult {
  /** Type of the result, must be location */
  type: "location";
  /** Unique identifier for this result, 1-64 Bytes */
  id: string;
  /** Location latitude in degrees */
  latitude: Float;
  /** Location longitude in degrees */
  longitude: Float;
  /** Location title */
  title: string;
  /** Optional. The radius of uncertainty for the location, measured in meters; 0-1500 */
  horizontal_accuracy?: Float;
  /** Optional. Period in seconds during which the location can be updated, should be between 60 and 86400, or 0x7FFFFFFF for live locations that can be edited indefinitely. */
  live_period?: Integer;
  /** Optional. For live locations, a direction in which the user is moving, in degrees. Must be between 1 and 360 if specified. */
  heading?: Integer;
  /** Optional. For live locations, a maximum distance for proximity alerts about approaching another chat member, in meters. Must be between 1 and 100000 if specified. */
  proximity_alert_radius?: Integer;
  /** Optional. Inline keyboard attached to the message */
  reply_markup?: InlineKeyboardMarkup;
  /** Optional. Content of the message to be sent instead of the location */
  input_message_content?: InputMessageContent;
  /** Optional. Url of the thumbnail for the result */
  thumbnail_url?: string;
  /** Optional. Thumbnail width */
  thumbnail_width?: Integer;
  /** Optional. Thumbnail height */
  thumbnail_height?: Integer;
}

/**
 * Represents a link to a venue. By default, the venue will be sent by the user. Alternatively, you can use input_message_content to send a message with the specified content instead of the venue.
 * @see https://core.telegram.org/bots/api#inlinequeryresultvenue
 */
export interface InlineQueryResultVenue extends InlineQueryResult {
  /** Type of the result, must be venue */
  type: "venue";
  /** Unique identifier for this result, 1-64 Bytes */
  id: string;
  /** Latitude of the venue location in degrees */
  latitude: Float;
  /** Longitude of the venue location in degrees */
  longitude: Float;
  /** Title of the venue */
  title: string;
  /** Address of the venue */
  address: string;
  /** Optional. Foursquare identifier of the venue if known */
  foursquare_id?: string;
  /** Optional. Foursquare type of the venue, if known. (For example, “arts_entertainment/default”, “arts_entertainment/aquarium” or “food/icecream”.) */
  foursquare_type?: string;
  /** Optional. Google Places identifier of the venue */
  google_place_id?: string;
  /** Optional. Google Places type of the venue. (See supported types.) */
  google_place_type?: string;
  /** Optional. Inline keyboard attached to the message */
  reply_markup?: InlineKeyboardMarkup;
  /** Optional. Content of the message to be sent instead of the venue */
  input_message_content?: InputMessageContent;
  /** Optional. Url of the thumbnail for the result */
  thumbnail_url?: string;
  /** Optional. Thumbnail width */
  thumbnail_width?: Integer;
  /** Optional. Thumbnail height */
  thumbnail_height?: Integer;
}

/**
 * Represents a contact with a phone number. By default, this contact will be sent by the user. Alternatively, you can use input_message_content to send a message with the specified content instead of the contact.
 * @see https://core.telegram.org/bots/api#inlinequeryresultcontact
 */
export interface InlineQueryResultContact extends InlineQueryResult {
  /** Type of the result, must be contact */
  type: "contact";
  /** Unique identifier for this result, 1-64 Bytes */
  id: string;
  /** Contact's phone number */
  phone_number: string;
  /** Contact's first name */
  first_name: string;
  /** Optional. Contact's last name */
  last_name?: string;
  /** Optional. Additional data about the contact in the form of a vCard, 0-2048 bytes */
  vcard?: string;
  /** Optional. Inline keyboard attached to the message */
  reply_markup?: InlineKeyboardMarkup;
  /** Optional. Content of the message to be sent instead of the contact */
  input_message_content?: InputMessageContent;
  /** Optional. Url of the thumbnail for the result */
  thumbnail_url?: string;
  /** Optional. Thumbnail width */
  thumbnail_width?: Integer;
  /** Optional. Thumbnail height */
  thumbnail_height?: Integer;
}

/**
 * Represents a Game.
 * @see https://core.telegram.org/bots/api#inlinequeryresultgame
 */
export interface InlineQueryResultGame extends InlineQueryResult {
  /** Type of the result, must be game */
  type: "game";
  /** Unique identifier for this result, 1-64 bytes */
  id: string;
  /** Short name of the game */
  game_short_name: string;
  /** Optional. Inline keyboard attached to the message */
  reply_markup?: InlineKeyboardMarkup;
}

/**
 * Represents a link to a photo stored on the Telegram servers. By default, this photo will be sent by the user with an optional caption. Alternatively, you can use input_message_content to send a message with the specified content instead of the photo.
 * @see https://core.telegram.org/bots/api#inlinequeryresultcachedphoto
 */
export interface InlineQueryResultCachedPhoto extends InlineQueryResult {
  /** Type of the result, must be photo */
  type: "photo";
  /** Unique identifier for this result, 1-64 Bytes */
  id: string;
  /** A valid file identifier of the photo */
  photo_file_id: string;
  /** Optional. Title for the result */
  title?: string;
  /** Optional. Short description of the result */
  description?: string;
  /** Optional. Caption of the photo to be sent, 0-1024 characters after entities parsing */
  caption?: string;
  /** Optional. Mode for parsing entities in the photo caption. See formatting options for more details. */
  parse_mode?: string;
  /** Optional. List of special entities that appear in the caption, which can be specified instead of parse_mode */
  caption_entities?: Array<MessageEntity>;
  /** Optional. Inline keyboard attached to the message */
  reply_markup?: InlineKeyboardMarkup;
  /** Optional. Content of the message to be sent instead of the photo */
  input_message_content?: InputMessageContent;
}

/**
 * Represents a link to an animated GIF file stored on the Telegram servers. By default, this animated GIF file will be sent by the user with an optional caption. Alternatively, you can use input_message_content to send a message with specified content instead of the animation.
 * @see https://core.telegram.org/bots/api#inlinequeryresultcachedgif
 */
export interface InlineQueryResultCachedGif extends InlineQueryResult {
  /** Type of the result, must be gif */
  type: "gif";
  /** Unique identifier for this result, 1-64 Bytes */
  id: string;
  /** A valid file identifier for the GIF file */
  gif_file_id: string;
  /** Optional. Title for the result */
  title?: string;
  /** Optional. Caption of the GIF file to be sent, 0-1024 characters after entities parsing */
  caption?: string;
  /** Optional. Mode for parsing entities in the caption. See formatting options for more details. */
  parse_mode?: string;
  /** Optional. List of special entities that appear in the caption, which can be specified instead of parse_mode */
  caption_entities?: Array<MessageEntity>;
  /** Optional. Inline keyboard attached to the message */
  reply_markup?: InlineKeyboardMarkup;
  /** Optional. Content of the message to be sent instead of the GIF animation */
  input_message_content?: InputMessageContent;
}

/**
 * Represents a link to a video animation (H.264/MPEG-4 AVC video without sound) stored on the Telegram servers. By default, this animated MPEG4 file will be sent by the user with an optional caption. Alternatively, you can use input_message_content to send a message with the specified content instead of the animation.
 * @see https://core.telegram.org/bots/api#inlinequeryresultcachedmpeg4gif
 */
export interface InlineQueryResultCachedMpeg4Gif extends InlineQueryResult {
  /** Type of the result, must be mpeg4_gif */
  type: "mpeg4_gif";
  /** Unique identifier for this result, 1-64 Bytes */
  id: string;
  /** A valid file identifier for the MPEG4 file */
  mpeg4_file_id: string;
  /** Optional. Title for the result */
  title?: string;
  /** Optional. Caption of the MPEG-4 file to be sent, 0-1024 characters after entities parsing */
  caption?: string;
  /** Optional. Mode for parsing entities in the caption. See formatting options for more details. */
  parse_mode?: string;
  /** Optional. List of special entities that appear in the caption, which can be specified instead of parse_mode */
  caption_entities?: Array<MessageEntity>;
  /** Optional. Inline keyboard attached to the message */
  reply_markup?: InlineKeyboardMarkup;
  /** Optional. Content of the message to be sent instead of the video animation */
  input_message_content?: InputMessageContent;
}

/**
 * Represents a link to a sticker stored on the Telegram servers. By default, this sticker will be sent by the user. Alternatively, you can use input_message_content to send a message with the specified content instead of the sticker.
 * @see https://core.telegram.org/bots/api#inlinequeryresultcachedsticker
 */
export interface InlineQueryResultCachedSticker extends InlineQueryResult {
  /** Type of the result, must be sticker */
  type: "sticker";
  /** Unique identifier for this result, 1-64 bytes */
  id: string;
  /** A valid file identifier of the sticker */
  sticker_file_id: string;
  /** Optional. Inline keyboard attached to the message */
  reply_markup?: InlineKeyboardMarkup;
  /** Optional. Content of the message to be sent instead of the sticker */
  input_message_content?: InputMessageContent;
}

/**
 * Represents a link to a file stored on the Telegram servers. By default, this file will be sent by the user with an optional caption. Alternatively, you can use input_message_content to send a message with the specified content instead of the file.
 * @see https://core.telegram.org/bots/api#inlinequeryresultcacheddocument
 */
export interface InlineQueryResultCachedDocument extends InlineQueryResult {
  /** Type of the result, must be document */
  type: "document";
  /** Unique identifier for this result, 1-64 Bytes */
  id: string;
  /** Title for the result */
  title: string;
  /** A valid file identifier for the file */
  document_file_id: string;
  /** Optional. Short description of the result */
  description?: string;
  /** Optional. Caption of the document to be sent, 0-1024 characters after entities parsing */
  caption?: string;
  /** Optional. Mode for parsing entities in the document caption. See formatting options for more details. */
  parse_mode?: string;
  /** Optional. List of special entities that appear in the caption, which can be specified instead of parse_mode */
  caption_entities?: Array<MessageEntity>;
  /** Optional. Inline keyboard attached to the message */
  reply_markup?: InlineKeyboardMarkup;
  /** Optional. Content of the message to be sent instead of the document */
  input_message_content?: InputMessageContent;
}

/**
 * Represents a link to a video file stored on the Telegram servers. By default, this video file will be sent by the user with an optional caption. Alternatively, you can use input_message_content to send a message with the specified content instead of the video.
 * @see https://core.telegram.org/bots/api#inlinequeryresultcachedvideo
 */
export interface InlineQueryResultCachedVideo extends InlineQueryResult {
  /** Type of the result, must be video */
  type: "video";
  /** Unique identifier for this result, 1-64 Bytes */
  id: string;
  /** A valid file identifier for the video file */
  video_file_id: string;
  /** Title for the result */
  title: string;
  /** Optional. Short description of the result */
  description?: string;
  /** Optional. Caption of the video to be sent, 0-1024 characters after entities parsing */
  caption?: string;
  /** Optional. Mode for parsing entities in the video caption. See formatting options for more details. */
  parse_mode?: string;
  /** Optional. List of special entities that appear in the caption, which can be specified instead of parse_mode */
  caption_entities?: Array<MessageEntity>;
  /** Optional. Inline keyboard attached to the message */
  reply_markup?: InlineKeyboardMarkup;
  /** Optional. Content of the message to be sent instead of the video */
  input_message_content?: InputMessageContent;
}

/**
 * Represents a link to a voice message stored on the Telegram servers. By default, this voice message will be sent by the user. Alternatively, you can use input_message_content to send a message with the specified content instead of the voice message.
 * @see https://core.telegram.org/bots/api#inlinequeryresultcachedvoice
 */
export interface InlineQueryResultCachedVoice extends InlineQueryResult {
  /** Type of the result, must be voice */
  type: "voice";
  /** Unique identifier for this result, 1-64 Bytes */
  id: string;
  /** A valid file identifier for the voice message */
  voice_file_id: string;
  /** Voice message title */
  title: string;
  /** Optional. Caption, 0-1024 characters after entities parsing */
  caption?: string;
  /** Optional. Mode for parsing entities in the voice message caption. See formatting options for more details. */
  parse_mode?: string;
  /** Optional. List of special entities that appear in the caption, which can be specified instead of parse_mode */
  caption_entities?: Array<MessageEntity>;
  /** Optional. Inline keyboard attached to the message */
  reply_markup?: InlineKeyboardMarkup;
  /** Optional. Content of the message to be sent instead of the voice message */
  input_message_content?: InputMessageContent;
}

/**
 * Represents a link to an MP3 audio file stored on the Telegram servers. By default, this audio file will be sent by the user. Alternatively, you can use input_message_content to send a message with the specified content instead of the audio.
 * @see https://core.telegram.org/bots/api#inlinequeryresultcachedaudio
 */
export interface InlineQueryResultCachedAudio extends InlineQueryResult {
  /** Type of the result, must be audio */
  type: "audio";
  /** Unique identifier for this result, 1-64 Bytes */
  id: string;
  /** A valid file identifier for the audio file */
  audio_file_id: string;
  /** Optional. Caption, 0-1024 characters after entities parsing */
  caption?: string;
  /** Optional. Mode for parsing entities in the audio caption. See formatting options for more details. */
  parse_mode?: string;
  /** Optional. List of special entities that appear in the caption, which can be specified instead of parse_mode */
  caption_entities?: Array<MessageEntity>;
  /** Optional. Inline keyboard attached to the message */
  reply_markup?: InlineKeyboardMarkup;
  /** Optional. Content of the message to be sent instead of the audio */
  input_message_content?: InputMessageContent;
}

/**
 * This object represents the content of a message to be sent as a result of an inline query.
 * @see https://core.telegram.org/bots/api#inputmessagecontent
 */
export interface InputMessageContent {}

/**
 * Represents the content of a text message to be sent as the result of an inline query.
 * @see https://core.telegram.org/bots/api#inputtextmessagecontent
 */
export interface InputTextMessageContent extends InputMessageContent {
  /** Text of the message to be sent, 1-4096 characters */
  message_text: string;
  /** Optional. Mode for parsing entities in the message text. See formatting options for more details. */
  parse_mode?: string;
  /** Optional. List of special entities that appear in message text, which can be specified instead of parse_mode */
  entities?: Array<MessageEntity>;
  /** Optional. Link preview generation options for the message */
  link_preview_options?: LinkPreviewOptions;
}

/**
 * Represents the content of a location message to be sent as the result of an inline query.
 * @see https://core.telegram.org/bots/api#inputlocationmessagecontent
 */
export interface InputLocationMessageContent extends InputMessageContent {
  /** Latitude of the location in degrees */
  latitude: Float;
  /** Longitude of the location in degrees */
  longitude: Float;
  /** Optional. The radius of uncertainty for the location, measured in meters; 0-1500 */
  horizontal_accuracy?: Float;
  /** Optional. Period in seconds during which the location can be updated, should be between 60 and 86400, or 0x7FFFFFFF for live locations that can be edited indefinitely. */
  live_period?: Integer;
  /** Optional. For live locations, a direction in which the user is moving, in degrees. Must be between 1 and 360 if specified. */
  heading?: Integer;
  /** Optional. For live locations, a maximum distance for proximity alerts about approaching another chat member, in meters. Must be between 1 and 100000 if specified. */
  proximity_alert_radius?: Integer;
}

/**
 * Represents the content of a venue message to be sent as the result of an inline query.
 * @see https://core.telegram.org/bots/api#inputvenuemessagecontent
 */
export interface InputVenueMessageContent extends InputMessageContent {
  /** Latitude of the venue in degrees */
  latitude: Float;
  /** Longitude of the venue in degrees */
  longitude: Float;
  /** Name of the venue */
  title: string;
  /** Address of the venue */
  address: string;
  /** Optional. Foursquare identifier of the venue, if known */
  foursquare_id?: string;
  /** Optional. Foursquare type of the venue, if known. (For example, “arts_entertainment/default”, “arts_entertainment/aquarium” or “food/icecream”.) */
  foursquare_type?: string;
  /** Optional. Google Places identifier of the venue */
  google_place_id?: string;
  /** Optional. Google Places type of the venue. (See supported types.) */
  google_place_type?: string;
}

/**
 * Represents the content of a contact message to be sent as the result of an inline query.
 * @see https://core.telegram.org/bots/api#inputcontactmessagecontent
 */
export interface InputContactMessageContent extends InputMessageContent {
  /** Contact's phone number */
  phone_number: string;
  /** Contact's first name */
  first_name: string;
  /** Optional. Contact's last name */
  last_name?: string;
  /** Optional. Additional data about the contact in the form of a vCard, 0-2048 bytes */
  vcard?: string;
}

/**
 * Represents the content of an invoice message to be sent as the result of an inline query.
 * @see https://core.telegram.org/bots/api#inputinvoicemessagecontent
 */
export interface InputInvoiceMessageContent extends InputMessageContent {
  /** Product name, 1-32 characters */
  title: string;
  /** Product description, 1-255 characters */
  description: string;
  /** Bot-defined invoice payload, 1-128 bytes. This will not be displayed to the user, use for your internal processes. */
  payload: string;
  /** Payment provider token, obtained via @BotFather */
  provider_token: string;
  /** Three-letter ISO 4217 currency code, see more on currencies */
  currency: string;
  /** Price breakdown, a JSON-serialized list of components (e.g. product price, tax, discount, delivery cost, delivery tax, bonus, etc.) */
  prices: Array<LabeledPrice>;
  /** Optional. The maximum accepted amount for tips in the smallest units of the currency (integer, not float/double). For example, for a maximum tip of US$ 1.45 pass max_tip_amount = 145. See the exp parameter in currencies.json, it shows the number of digits past the decimal point for each currency (2 for the majority of currencies). Defaults to 0 */
  max_tip_amount?: Integer;
  /** Optional. A JSON-serialized array of suggested amounts of tips in the smallest units of the currency (integer, not float/double). At most 4 suggested tip amounts can be specified. The suggested tip amounts must be positive, passed in a strictly increased order and must not exceed max_tip_amount. */
  suggested_tip_amounts?: Array<Integer>;
  /** Optional. A JSON-serialized object for data about the invoice, which will be shared with the payment provider. A detailed description of required fields should be provided by the payment provider. */
  provider_data?: string;
  /** Optional. URL of the product photo for the invoice. Can be a photo of the goods or a marketing image for a service. */
  photo_url?: string;
  /** Optional. Photo size in bytes */
  photo_size?: Integer;
  /** Optional. Photo width */
  photo_width?: Integer;
  /** Optional. Photo height */
  photo_height?: Integer;
  /** Optional. Pass True if you require the user's full name to complete the order */
  need_name?: boolean;
  /** Optional. Pass True if you require the user's phone number to complete the order */
  need_phone_number?: boolean;
  /** Optional. Pass True if you require the user's email address to complete the order */
  need_email?: boolean;
  /** Optional. Pass True if you require the user's shipping address to complete the order */
  need_shipping_address?: boolean;
  /** Optional. Pass True if the user's phone number should be sent to provider */
  send_phone_number_to_provider?: boolean;
  /** Optional. Pass True if the user's email address should be sent to provider */
  send_email_to_provider?: boolean;
  /** Optional. Pass True if the final price depends on the shipping method */
  is_flexible?: boolean;
}

/**
 * Represents a button to be shown above inline query results. You must use exactly one of the optional fields.
 * @see https://core.telegram.org/bots/api#inlinequeryresultsbutton
 */
export interface InlineQueryResultsButton {
  /** Label text on the button */
  text: string;
  /** Optional. Description of the Web App that will be launched when the user presses the button. The Web App will be able to switch the user back to the inline mode in a chosen chat, insert a mentioned username or return an arbitrary start parameter. */
  web_app?: WebAppInfo;
  /** Optional. Deep-linking parameter for the /start message sent to the bot when a user presses the button. 1-64 characters, only A-Z, a-z, 0-9, _ and - are allowed. */
  start_parameter?: string;
}

/**
 * Contains information about a sent inline message.
 * @see https://core.telegram.org/bots/api#sentwebappmessage
 */
export interface SentWebAppMessage {
  /** Optional. Identifier of the sent inline message. Available only if there is an inline keyboard attached to the message. */
  inline_message_id?: string;
}

/**
 * Describes an inline message sent by a Web App on behalf of a user.
 * @see https://core.telegram.org/bots/api#sentwebappmessage
 */
export interface PreparedInlineMessage {
  /** The identifier of the sent inline message */
  inline_message_id: string;
  /** Optional. Identifier of the message thread to which the message belongs */
  message_thread_id?: Integer;
}

// =============================================================================
// Payments Types
// =============================================================================

/**
 * This object contains information about an invoice.
 * @see https://core.telegram.org/bots/api#invoice
 */
export interface Invoice {
  /** Product name */
  title: string;
  /** Product description */
  description: string;
  /** Unique bot deep-linking parameter that can be used to generate this invoice */
  start_parameter: string;
  /** Three-letter ISO 4217 currency code */
  currency: string;
  /** Total price in the smallest units of the currency (integer, not float/double). For example, for a price of US$ 1.45 pass amount = 145. See the exp parameter in currencies.json, it shows the number of digits past the decimal point for each currency (2 for the majority of currencies). */
  total_amount: Integer;
}

/**
 * This object represents a shipping address.
 * @see https://core.telegram.org/bots/api#shippingaddress
 */
export interface ShippingAddress {
  /** Two-letter ISO 3166-1 alpha-2 country code */
  country_code: string;
  /** State, if applicable */
  state: string;
  /** City */
  city: string;
  /** First line for the address */
  street_line1: string;
  /** Second line for the address */
  street_line2: string;
  /** Address post code */
  post_code: string;
}

/**
 * This object represents information about an order.
 * @see https://core.telegram.org/bots/api#orderinfo
 */
export interface OrderInfo {
  /** Optional. User name */
  name?: string;
  /** Optional. User's phone number */
  phone_number?: string;
  /** Optional. User email */
  email?: string;
  /** Optional. User shipping address */
  shipping_address?: ShippingAddress;
}

/**
 * This object represents one shipping option.
 * @see https://core.telegram.org/bots/api#shippingoption
 */
export interface ShippingOption {
  /** Shipping option identifier */
  id: string;
  /** Option title */
  title: string;
  /** List of price portions */
  prices: Array<LabeledPrice>;
}

/**
 * This object contains basic information about a successful payment.
 * @see https://core.telegram.org/bots/api#successfulpayment
 */
export interface SuccessfulPayment {
  /** Three-letter ISO 4217 currency code */
  currency: string;
  /** Total price in the smallest units of the currency (integer, not float/double). For example, for a price of US$ 1.45 pass amount = 145. See the exp parameter in currencies.json, it shows the number of digits past the decimal point for each currency (2 for the majority of currencies). */
  total_amount: Integer;
  /** Bot specified invoice payload */
  invoice_payload: string;
  /** Optional. Identifier of the shipping option chosen by the user */
  shipping_option_id?: string;
  /** Optional. Order information provided by the user */
  order_info?: OrderInfo;
  /** Telegram payment identifier */
  telegram_payment_charge_id: string;
  /** Provider payment identifier */
  provider_payment_charge_id: string;
}

/**
 * This object contains basic information about a refunded payment.
 * @see https://core.telegram.org/bots/api#refundedpayment
 */
export interface RefundedPayment {
  /** Three-letter ISO 4217 currency code, or “XTR” for payments in Telegram Stars */
  currency: string;
  /** Total refunded price in the smallest units of the currency (integer, not float/double). For example, for a price of US$ 1.45, total_amount = 145. See the exp parameter in currencies.json, it shows the number of digits past the decimal point for each currency (2 for the majority of currencies). If the currency is “XTR”, the value is equal to the number of Telegram Stars refunded. */
  total_amount: Integer;
  /** Bot-specified invoice payload */
  invoice_payload: string;
  /** Telegram payment identifier */
  telegram_payment_charge_id: string;
  /** Optional. Provider payment identifier */
  provider_payment_charge_id?: string;
}

/**
 * This object contains information about an incoming shipping query.
 * @see https://core.telegram.org/bots/api#shippingquery
 */
export interface ShippingQuery {
  /** Unique query identifier */
  id: string;
  /** User who sent the query */
  from: User;
  /** Bot specified invoice payload */
  invoice_payload: string;
  /** User specified shipping address */
  shipping_address: ShippingAddress;
}

/**
 * This object contains information about an incoming pre-checkout query.
 * @see https://core.telegram.org/bots/api#precheckoutquery
 */
export interface PreCheckoutQuery {
  /** Unique query identifier */
  id: string;
  /** User who sent the query */
  from: User;
  /** Three-letter ISO 4217 currency code */
  currency: string;
  /** Total price in the smallest units of the currency (integer, not float/double). For example, for a price of US$ 1.45 pass amount = 145. See the exp parameter in currencies.json, it shows the number of digits past the decimal point for each currency (2 for the majority of currencies). */
  total_amount: Integer;
  /** Bot specified invoice payload */
  invoice_payload: string;
  /** Optional. Identifier of the shipping option chosen by the user */
  shipping_option_id?: string;
  /** Optional. Order information provided by the user */
  order_info?: OrderInfo;
}

/**
 * This object represents a portion of the price for goods or services.
 * @see https://core.telegram.org/bots/api#labeledprice
 */
export interface LabeledPrice {
  /** Portion label */
  label: string;
  /** Price of the product in the smallest units of the currency (integer, not float/double). For example, for a price of US$ 1.45 pass amount = 145. See the exp parameter in currencies.json, it shows the number of digits past the decimal point for each currency (2 for the majority of currencies). */
  amount: Integer;
}

// =============================================================================
// Telegram Passport Types
// =============================================================================

/**
 * Describes Telegram Passport data shared with the bot by the user.
 * @see https://core.telegram.org/bots/api#passportdata
 */
export interface PassportData {
  /** Array with information about documents and other Telegram Passport elements that was shared with the bot */
  data: Array<EncryptedPassportElement>;
  /** Encrypted credentials required to decrypt the data */
  credentials: EncryptedCredentials;
}

/**
 * Represents a file uploaded to Telegram Passport. Currently all Telegram Passport elements share the same file type.
 * @see https://core.telegram.org/bots/api#passportfile
 */
export interface PassportFile {
  /** Identifier for this file, which can be used to download or reuse the file */
  file_id: string;
  /** Unique identifier for this file, which is supposed to be the same over time and for different bots. Can't be used to download or reuse the file. */
  file_unique_id: string;
  /** File size in bytes */
  file_size: Integer;
  /** Unix time when the file was uploaded */
  file_date: Integer;
}

/**
 * Describes documents or other Telegram Passport elements shared with the bot by the user.
 * @see https://core.telegram.org/bots/api#encryptedpassportelement
 */
export interface EncryptedPassportElement {
  /** Element type. One of “personal_details”, “passport”, “driver_license”, “identity_card”, “internal_passport”, “address”, “utility_bill”, “bank_statement”, “rental_agreement”, “passport_registration”, “temporary_registration”, “phone_number”, “email”. */
  type: string;
  /** Optional. Base64-encoded encrypted Telegram Passport element data provided by the user, available for “personal_details”, “passport”, “driver_license”, “identity_card”, “internal_passport” and “address” types. Can be decrypted and verified using the accompanying EncryptedCredentials. */
  data?: string;
  /** Optional. User's verified phone number, available only for “phone_number” type */
  phone_number?: string;
  /** Optional. User's verified email address, available only for “email” type */
  email?: string;
  /** Optional. Array of encrypted files with documents provided by the user, available for “utility_bill”, “bank_statement”, “rental_agreement”, “passport_registration” and “temporary_registration” types. Files can be decrypted and verified using the accompanying EncryptedCredentials. */
  files?: Array<PassportFile>;
  /** Optional. Encrypted file with the front side of the document, provided by the user. Available for “passport”, “driver_license”, “identity_card” and “internal_passport”. The file can be decrypted and verified using the accompanying EncryptedCredentials. */
  front_side?: PassportFile;
  /** Optional. Encrypted file with the reverse side of the document, provided by the user. Available for “driver_license” and “identity_card”. The file can be decrypted and verified using the accompanying EncryptedCredentials. */
  reverse_side?: PassportFile;
  /** Optional. Encrypted file with the selfie of the user holding a document, provided by the user; available for “passport”, “driver_license”, “identity_card” and “internal_passport”. The file can be decrypted and verified using the accompanying EncryptedCredentials. */
  selfie?: PassportFile;
  /** Optional. Array of encrypted files with translated versions of documents provided by the user. Available if requested for “passport”, “driver_license”, “identity_card”, “internal_passport”, “utility_bill”, “bank_statement”, “rental_agreement”, “passport_registration” and “temporary_registration” types. Files can be decrypted and verified using the accompanying EncryptedCredentials. */
  translation?: Array<PassportFile>;
  /** Base64-encoded element hash for using in PassportElementErrorUnspecified */
  hash: string;
}

/**
 * Describes data required for decrypting and authenticating EncryptedPassportElement. See the Telegram Passport Documentation for a complete description of the data decryption and authentication processes.
 * @see https://core.telegram.org/bots/api#encryptedcredentials
 */
export interface EncryptedCredentials {
  /** Base64-encoded encrypted JSON-serialized data with unique user's payload, data hashes and secrets required for EncryptedPassportElement decryption and authentication */
  data: string;
  /** Base64-encoded data hash for data authentication */
  hash: string;
  /** Base64-encoded secret, encrypted with the bot's public RSA key, required for data decryption */
  secret: string;
}

/**
 * Represents an issue in one of the data fields that was provided by the user. The Bot API supports various types of data issues. All types of PassportElementError must have the source, the type, the message, and if applicable, the file_hash fields defined.
 * @see https://core.telegram.org/bots/api#passportelementerror
 */
export interface PassportElementError {}

/**
 * Represents an issue in the user's data in one of the data fields. The error is considered resolved when the field's value changes.
 * @see https://core.telegram.org/bots/api#passportelementerrordatafield
 */
export interface PassportElementErrorDataField extends PassportElementError {
  /** Error source, must be data */
  source: "data";
  /** The section of the user's Telegram Passport which has the error, one of “personal_details”, “passport”, “driver_license”, “identity_card”, “internal_passport”, “address” */
  type: string;
  /** Name of the data field which has the error */
  field_name: string;
  /** Base64-encoded data hash */
  data_hash: string;
  /** Error message */
  message: string;
}

/**
 * Represents an issue with the front side of a document. The error is considered resolved when the file with the front side of the document changes.
 * @see https://core.telegram.org/bots/api#passportelementerrorfrontside
 */
export interface PassportElementErrorFrontSide extends PassportElementError {
  /** Error source, must be front_side */
  source: "front_side";
  /** The section of the user's Telegram Passport which has the issue, one of “passport”, “driver_license”, “identity_card”, “internal_passport” */
  type: string;
  /** Base64-encoded hash of the file with the front side of the document */
  file_hash: string;
  /** Error message */
  message: string;
}

/**
 * Represents an issue with the reverse side of a document. The error is considered resolved when the file with reverse side of the document changes.
 * @see https://core.telegram.org/bots/api#passportelementerrorreverseside
 */
export interface PassportElementErrorReverseSide extends PassportElementError {
  /** Error source, must be reverse_side */
  source: "reverse_side";
  /** The section of the user's Telegram Passport which has the issue, one of “driver_license”, “identity_card” */
  type: string;
  /** Base64-encoded hash of the file with the reverse side of the document */
  file_hash: string;
  /** Error message */
  message: string;
}

/**
 * Represents an issue with the selfie with a document. The error is considered resolved when the file with the selfie changes.
 * @see https://core.telegram.org/bots/api#passportelementerrorselfie
 */
export interface PassportElementErrorSelfie extends PassportElementError {
  /** Error source, must be selfie */
  source: "selfie";
  /** The section of the user's Telegram Passport which has the issue, one of “passport”, “driver_license”, “identity_card”, “internal_passport” */
  type: string;
  /** Base64-encoded hash of the file with the selfie */
  file_hash: string;
  /** Error message */
  message: string;
}

/**
 * Represents an issue with a document scan. The error is considered resolved when the file with the document scan changes.
 * @see https://core.telegram.org/bots/api#passportelementerrorfile
 */
export interface PassportElementErrorFile extends PassportElementError {
  /** Error source, must be file */
  source: "file";
  /** The section of the user's Telegram Passport which has the issue, one of “utility_bill”, “bank_statement”, “rental_agreement”, “passport_registration”, “temporary_registration” */
  type: string;
  /** Base64-encoded file hash */
  file_hash: string;
  /** Error message */
  message: string;
}

/**
 * Represents an issue with a list of scans. The error is considered resolved when the list of files with scans changes.
 * @see https://core.telegram.org/bots/api#passportelementerrorfiles
 */
export interface PassportElementErrorFiles extends PassportElementError {
  /** Error source, must be files */
  source: "files";
  /** The section of the user's Telegram Passport which has the issue, one of “utility_bill”, “bank_statement”, “rental_agreement”, “passport_registration”, “temporary_registration” */
  type: string;
  /** List of base64-encoded file hashes */
  file_hashes: Array<string>;
  /** Error message */
  message: string;
}

/**
 * Represents an issue with one of the files that constitute the translation of a document. The error is considered resolved when the file changes.
 * @see https://core.telegram.org/bots/api#passportelementerrortranslationfile
 */
export interface PassportElementErrorTranslationFile
  extends PassportElementError {
  /** Error source, must be translation_file */
  source: "translation_file";
  /** Type of element of the user's Telegram Passport which has the issue, one of “passport”, “driver_license”, “identity_card”, “internal_passport”, “utility_bill”, “bank_statement”, “rental_agreement”, “passport_registration”, “temporary_registration” */
  type: string;
  /** Base64-encoded file hash */
  file_hash: string;
  /** Error message */
  message: string;
}

/**
 * Represents an issue with the translated version of a document. The error is considered resolved when a file with the document translation changes.
 * @see https://core.telegram.org/bots/api#passportelementerrortranslationfiles
 */
export interface PassportElementErrorTranslationFiles
  extends PassportElementError {
  /** Error source, must be translation_files */
  source: "translation_files";
  /** Type of element of the user's Telegram Passport which has the issue, one of “passport”, “driver_license”, “identity_card”, “internal_passport”, “utility_bill”, “bank_statement”, “rental_agreement”, “passport_registration”, “temporary_registration” */
  type: string;
  /** List of base64-encoded file hashes */
  file_hashes: Array<string>;
  /** Error message */
  message: string;
}

/**
 * Represents an issue in an unspecified place. The error is considered resolved when new data is added.
 * @see https://core.telegram.org/bots/api#passportelementerrorunspecified
 */
export interface PassportElementErrorUnspecified extends PassportElementError {
  /** Error source, must be unspecified */
  source: "unspecified";
  /** Type of element of the user's Telegram Passport which has the issue */
  type: string;
  /** Base64-encoded element hash */
  element_hash: string;
  /** Error message */
  message: string;
}

// =============================================================================
// Games Types
// =============================================================================

/**
 * This object represents a game. Use BotFather to create and edit games, their short names will act as unique identifiers.
 * @see https://core.telegram.org/bots/api#game
 */
export interface Game {
  /** Title of the game */
  title: string;
  /** Description of the game */
  description: string;
  /** Photo that will be displayed in the game message in chats. */
  photo: Array<PhotoSize>;
  /** Optional. Brief description of the game or high scores included in the game message. Can be automatically edited to include current high scores for the game when the bot calls setGameScore, or manually edited using editMessageText. 0-4096 characters. */
  text?: string;
  /** Optional. Special entities that appear in text, such as usernames, URLs, bot commands, etc. */
  text_entities?: Array<MessageEntity>;
  /** Optional. Animation that will be displayed in the game message in chats. Upload via BotFather */
  animation?: Animation;
}

/**
 * A placeholder, currently holds no information. Use BotFather to set up your game.
 * @see https://core.telegram.org/bots/api#callbackgame
 */
export interface CallbackGame {}

/**
 * This object represents one row of the high scores table for a game.
 * @see https://core.telegram.org/bots/api#gamehighscore
 */
export interface GameHighScore {
  /** Position in high score table for the game */
  position: Integer;
  /** User */
  user: User;
  /** Score */
  score: Integer;
}

// =============================================================================
// Service Message Objects
// =============================================================================

/**
 * This object represents a service message about a user boosting a chat.
 * @see https://core.telegram.org/bots/api#chatboostadded
 */
export interface ChatBoostAdded {
  /** Number of boosts added by the user */
  boost_count: Integer;
}

/**
 * This object represents a service message about a change in auto-delete timer settings.
 * @see https://core.telegram.org/bots/api#messageautodeletetimerchanged
 */
export interface MessageAutoDeleteTimerChanged {
  /** New auto-delete time for messages in the chat; in seconds */
  message_auto_delete_time: Integer;
}

/**
 * This object represents a service message about a video chat scheduled in the chat.
 * @see https://core.telegram.org/bots/api#videochatscheduled
 */
export interface VideoChatScheduled {
  /** Point in time (Unix timestamp) when the video chat is supposed to be started by a chat administrator */
  start_date: Integer;
}

/**
 * This object represents a service message about a video chat started in the chat. Currently holds no information.
 * @see https://core.telegram.org/bots/api#videochatstarted
 */
export interface VideoChatStarted {}

/**
 * This object represents a service message about a video chat ended in the chat.
 * @see https://core.telegram.org/bots/api#videochatended
 */
export interface VideoChatEnded {
  /** Video chat duration in seconds */
  duration: Integer;
}

/**
 * This object represents a service message about new members invited to a video chat.
 * @see https://core.telegram.org/bots/api#videochatparticipantsinvited
 */
export interface VideoChatParticipantsInvited {
  /** New members that were invited to the video chat */
  users: Array<User>;
}

/**
 * This object represents a service message about a new forum topic created in the chat.
 * @see https://core.telegram.org/bots/api#forumtopiccreated
 */
export interface ForumTopicCreated {
  /** Name of the topic */
  name: string;
  /** Color of the topic icon in RGB format */
  icon_color: Integer;
  /** Optional. Unique identifier of the custom emoji shown as the topic icon */
  icon_custom_emoji_id?: string;
}

/**
 * This object represents a service message about a forum topic closed in the chat. Currently holds no information.
 * @see https://core.telegram.org/bots/api#forumtopicclosed
 */
export interface ForumTopicClosed {}

/**
 * This object represents a service message about an edited forum topic.
 * @see https://core.telegram.org/bots/api#forumtopicedited
 */
export interface ForumTopicEdited {
  /** Optional. New name of the topic, if it was edited */
  name?: string;
  /** Optional. New identifier of the custom emoji shown as the topic icon, if it was edited; an empty string if the icon was removed */
  icon_custom_emoji_id?: string;
}

/**
 * This object represents a service message about a forum topic reopened in the chat. Currently holds no information.
 * @see https://core.telegram.org/bots/api#forumtopicreopened
 */
export interface ForumTopicReopened {}

/**
 * This object represents a service message about General forum topic hidden in the chat. Currently holds no information.
 * @see https://core.telegram.org/bots/api#generalforumtopichidden
 */
export interface GeneralForumTopicHidden {}

/**
 * This object represents a service message about General forum topic unhidden in the chat. Currently holds no information.
 * @see https://core.telegram.org/bots/api#generalforumtopicunhidden
 */
export interface GeneralForumTopicUnhidden {}

/**
 * This object represents a service message about a user allowing a bot to write messages after adding it to the attachment menu.
 * @see https://core.telegram.org/bots/api#writeaccessallowed
 */
export interface WriteAccessAllowed {
  /** Optional. True, if the access was granted after the user accepted an explicit request from a Web App sent by the method requestWriteAccess */
  from_request?: boolean;
  /** Optional. Name of the Web App, if the access was granted when the Web App was launched from a link */
  web_app_name?: string;
  /** Optional. True, if the access was granted when the bot was added to the attachment or side menu */
  from_attachment_menu?: boolean;
}

// =============================================================================
// Bot Administration Rights
// =============================================================================

/**
 * Represents a set of custom admin rights for a user in a supergroup or a channel.
 * @see https://core.telegram.org/bots/api#chatadministratorrights
 */
export interface ChatAdministratorRights {
  /** True, if the user's presence in the chat is hidden */
  is_anonymous: boolean;
  /** True, if the administrator can access the chat event log, get boost list, see hidden supergroup and channel members, report spam messages and ignore slow mode. Implied by any other administrator privilege. */
  can_manage_chat: boolean;
  /** True, if the administrator can delete messages of other users */
  can_delete_messages: boolean;
  /** True, if the administrator can manage video chats */
  can_manage_video_chats: boolean;
  /** True, if the administrator can restrict, ban or unban chat members, or access supergroup statistics */
  can_restrict_members: boolean;
  /** True, if the administrator can add new administrators with a subset of their own privileges or demote administrators that he has promoted, directly or indirectly (promoted by administrators that were appointed by the user) */
  can_promote_members: boolean;
  /** True, if the user is allowed to change the chat title, photo and other settings */
  can_change_info: boolean;
  /** True, if the user is allowed to invite new users to the chat */
  can_invite_users: boolean;
  /** Optional. True, if the administrator can post messages in the channel; channels only */
  can_post_messages?: boolean;
  /** Optional. True, if the administrator can edit messages of other users and can pin messages; channels only */
  can_edit_messages?: boolean;
  /** Optional. True, if the administrator can pin messages; supergroups only */
  can_pin_messages?: boolean;
  /** Optional. True, if the user is allowed to create, rename, close, and reopen forum topics; supergroups only */
  can_manage_topics?: boolean;
}

/**
 * Describes a custom emoji to be used as a chat accent icon.
 * @see https://core.telegram.org/bots/api#accentcolor
 */
export interface AccentColor {
  /** Identifier of the accent color */
  accent_color_id: Integer;
  /** List of available background fill identifiers */
  background_fill_ids: Array<Integer>;
}

/**
 * Represents a location address.
 * @see https://core.telegram.org/bots/api#locationaddress
 */
export interface LocationAddress {
  /** Address of the location */
  address: string;
  /** Optional. Foursquare identifier of the location, if known */
  foursquare_id?: string;
  /** Optional. Foursquare type of the location, if known. (For example, “arts_entertainment/default”, “arts_entertainment/aquarium” or “food/icecream”.) */
  foursquare_type?: string;
  /** Optional. Google Places identifier of the location */
  google_place_id?: string;
  /** Optional. Google Places type of the location. (See supported types.) */
  google_place_type?: string;
}

/**
 * Contains information about the start page settings of a Telegram Business account.
 * @see https://core.telegram.org/bots/api#businessintro
 */
export interface BusinessIntro {
  /** Optional. Title text of the business intro */
  title?: string;
  /** Optional. Message text of the business intro */
  message?: string;
  /** Optional. Sticker of the business intro */
  sticker?: Sticker;
}

/**
 * Contains information about the location of a Telegram Business account.
 * @see https://core.telegram.org/bots/api#businesslocation
 */
export interface BusinessLocation {
  /** Address of the business */
  address: string;
  /** Optional. Location of the business */
  location?: Location;
}

/**
 * Contains information about the opening hours of a Telegram Business account.
 * @see https://core.telegram.org/bots/api#businessopeninghours
 */
export interface BusinessOpeningHours {
  /** Time zone name for the opening hours */
  time_zone_name: string;
  /** List of opening intervals */
  opening_hours: Array<BusinessOpeningHoursInterval>;
}

/**
 * Contains information about why a request was unsuccessful.
 * @see https://core.telegram.org/bots/api#responseparameters
 */
export interface ResponseParameters {
  /** Optional. The group has been migrated to a supergroup with the specified identifier. This number may have more than 32 significant bits and some programming languages may have difficulty/silent defects in interpreting it. But it has at most 52 significant bits, so a 64-bit integer or double-precision float type are safe for storing this identifier. */
  migrate_to_chat_id?: Integer;
  /** Optional. In case of exceeding flood control, the number of seconds left to wait before the request can be repeated */
  retry_after?: Integer;
}

/**
 * Represents a photo or a video for a result of an inline query.
 * @see https://core.telegram.org/bots/api#inputmediainline
 */
export interface InputMediaInline {
  /** Type of the result, must be photo or video */
  type: "photo" | "video";
  /** File to send. Pass a file_id to send a file that exists on the Telegram servers (recommended), pass an HTTP URL for Telegram to get a file from the Internet, or pass “attach://<file_attach_name>” to upload a new one using multipart/form-data under <file_attach_name> name. */
  media: string;
  /** Optional. Thumbnail of the file sent; can be ignored if thumbnail generation for the file is supported server-side. The thumbnail should be in JPEG format and less than 200 kB in size. A thumbnail's width and height should not exceed 320. Ignored if the file is not uploaded using multipart/form-data. Thumbnails can't be reused and can be only uploaded as a new file, so you can pass “attach://<file_attach_name>” if the thumbnail was uploaded using multipart/form-data under <file_attach_name>. */
  thumbnail?: InputFile;
  /** Optional. Caption of the photo to be sent, 0-1024 characters after entities parsing */
  caption?: string;
  /** Optional. Mode for parsing entities in the photo caption. See formatting options for more details. */
  parse_mode?: string;
  /** Optional. List of special entities that appear in the caption, which can be specified instead of parse_mode */
  caption_entities?: Array<MessageEntity>;
  /** Optional. Video width */
  width?: Integer;
  /** Optional. Video height */
  height?: Integer;
  /** Optional. Video duration in seconds */
  duration?: Integer;
  /** Optional. Pass True if the uploaded video is suitable for streaming */
  supports_streaming?: boolean;
}

// =============================================================================
// Background Types
// =============================================================================

/**
 * This object describes the type of a background.
 * @see https://core.telegram.org/bots/api#backgroundtype
 */
export interface BackgroundType {}

/**
 * The background is automatically filled based on the selected colors.
 * @see https://core.telegram.org/bots/api#backgroundtypefill
 */
export interface BackgroundTypeFill extends BackgroundType {
  /** Type of the background, always “fill” */
  type: "fill";
  /** The background fill */
  fill: BackgroundFill;
  /** Dimming of the background in dark themes, as a percentage; 0-100 */
  dark_theme_dimming: Integer;
}

/**
 * The background is a wallpaper in the JPEG format.
 * @see https://core.telegram.org/bots/api#backgroundtypewallpaper
 */
export interface BackgroundTypeWallpaper extends BackgroundType {
  /** Type of the background, always “wallpaper” */
  type: "wallpaper";
  /** Document with the wallpaper */
  document: Document;
  /** Dimming of the background in dark themes, as a percentage; 0-100 */
  dark_theme_dimming: Integer;
  /** Optional. True, if the wallpaper is downscaled to fit in a 450x450 square and then box-blurred with radius 12 */
  is_blurred?: boolean;
  /** Optional. True, if the background moves slightly when the device is tilted */
  is_moving?: boolean;
}

/**
 * The background is a PNG or TGV (gzipped TEVE) animation.
 * @see https://core.telegram.org/bots/api#backgroundtypepattern
 */
export interface BackgroundTypePattern extends BackgroundType {
  /** Type of the background, always “pattern” */
  type: "pattern";
  /** Document with the pattern */
  document: Document;
  /** The background fill that is combined with the pattern */
  fill: BackgroundFill;
  /** Intensity of the pattern when it is shown above the filled background; 0-100 */
  intensity: Integer;
  /** Optional. True, if the background is automatically animated */
  is_inverted?: boolean;
  /** Optional. True, if the background animation is paused while the message is visible in the chat */
  is_static?: boolean;
}

/**
 * The background is taken directly from a chat's set background.
 * @see https://core.telegram.org/bots/api#backgroundtypechattheme
 */
export interface BackgroundTypeChatTheme extends BackgroundType {
  /** Type of the background, always “chat_theme” */
  type: "chat_theme";
  /** Name of the chat theme, which is usually an emoji */
  theme_name: string;
}

/**
 * This object describes the way a background is filled based on the selected colors.
 * @see https://core.telegram.org/bots/api#backgroundfill
 */
export interface BackgroundFill {}

/**
 * The background is filled using the selected color.
 * @see https://core.telegram.org/bots/api#backgroundfillsolid
 */
export interface BackgroundFillSolid extends BackgroundFill {
  /** Type of the background fill, always “solid” */
  type: "solid";
  /** The color of the background fill in the RGB24 format */
  color: Integer;
}

/**
 * The background is filled using the gradient fill.
 * @see https://core.telegram.org/bots/api#backgroundfillgradient
 */
export interface BackgroundFillGradient extends BackgroundFill {
  /** Type of the background fill, always “gradient” */
  type: "gradient";
  /** Top color of the gradient in the RGB24 format */
  top_color: Integer;
  /** Bottom color of the gradient in the RGB24 format */
  bottom_color: Integer;
  /** Clockwise rotation angle of the background fill in degrees; 0-359 */
  rotation_angle: Integer;
}

/**
 * The background is filled using the freeform gradient fill.
 * @see https://core.telegram.org/bots/api#backgroundfillfreeformgradient
 */
export interface BackgroundFillFreeformGradient extends BackgroundFill {
  /** Type of the background fill, always “freeform_gradient” */
  type: "freeform_gradient";
  /** A list of the 3 to 6 base colors that are used to generate the freeform gradient in the RGB24 format */
  colors: Array<Integer>;
}

/**
 * This object represents a chat background.
 * @see https://core.telegram.org/bots/api#chatbackground
 */
export interface ChatBackground {
  /** The background */
  type: BackgroundType;
}

// =============================================================================
// Chat Location and Venue Types
// =============================================================================

/**
 * Represents a location to which a chat is connected.
 * @see https://core.telegram.org/bots/api#chatlocation
 */
export interface ChatLocation {
  /** The location to which the supergroup is connected. Can't be a live location. */
  location: Location;
  /** Location address; 1-64 characters, as defined by the chat owner */
  address: string;
}

// =============================================================================
// Story Types
// =============================================================================

/**
 * This object represents a story.
 * @see https://core.telegram.org/bots/api#story
 */
export interface Story {}

// =============================================================================
// Reaction Types
// =============================================================================

/**
 * This object describes the type of a reaction. Currently, it can be one of ReactionTypeEmoji, ReactionTypeCustomEmoji, ReactionTypePaid
 * @see https://core.telegram.org/bots/api#reactiontype
 */
export interface ReactionType {}

/**
 * The reaction is based on an emoji.
 * @see https://core.telegram.org/bots/api#reactiontypeemoji
 */
export interface ReactionTypeEmoji extends ReactionType {
  /** Type of the reaction, always “emoji” */
  type: "emoji";
  /** Reaction emoji. Currently, it can be “👍”, “👎”, “❤”, “🔥”, “🥰”, “👏”, “🙏”, “🎯”, “🎉”, “🤩”, “✅”, “🚀”, “🌈”, “⚡”, “🏆”, “💔”, “💸”, “💯”, “🙈”, “😂”, “😍”, “🤗”, “🫡”, “🤔”, “🔥”, “🥲”, “💥”, “💫”, “关切”, “woo-hoo”, “🫶”, “🫡”, “🫵”, “🫱”, “🫲”, “🫳”, “🫴”, “🫷”, “🫸”, “🫹”, “🫺”, “🫻”, “🫼”, “🫽”, “🫾”, “🫿”, “🫠”, “🫡”, “🫢”, “🫣”, “🫤”, “🫥”, “🫦”, “🫧”, “🫨”, “🫩”, “🫪”, “🫫”, “🫬”, “🫭”, “🫮”, “🫯”, “🫰”, “🫱”, “🫲”, “🫳”, “🫴”, “🫵”, “🫶”, “🫷”, “🫸”, “🫹”, “🫺”, “🫻”, “🫼”, “🫽”, “🫾”, “🫿”, “🫠”, “🫡”, “🫢”, “🫣”, “🫤”, “🫥”, “🫦”, “🫧”, “🫨”, “🫩”, “🫪”, “🫫”, “🫬”, “🫭”, “🫮”, “🫯”, “🫰”, “🫱”, “🫲”, “🫳”, “🫴”, “🫵”, “🫶”, “🫷”, “🫸”, “🫹”, “🫺”, “🫻”, “🫼”, “🫽”, “🫾”, “🫿”, “🫠”, “🫡”, “🫢”, “🫣”, “🫤”, “🫥”, “🫦”, “🫧”, “🫨”, “🫩”, “🫪”, “🫫”, “🫬”, “🫭”, “🫮”, “🫯”, “🫰”, “🫱”, “🫲”, “🫳”, “🫴”, “🫵”, “🫶”, “🫷”, “🫸”, “🫹”, “🫺”, “🫻”, “🫼”, “🫽”, “🫾”, “🫿”, “🫠”, “🫡”, “🫢”, “🫣”, “🫤”, “🫥”, “🫦”, “🫧”, “🫨”, “🫩”, “🫪”, “🫫”, “🫬”, “🫭”, “🫮”, “🫯”, “🫰”, “🫱”, “🫲”, “🫳”, “🫴”, “🫵”, “🫶”, “🫷”, “🫸”, “🫹”, “🫺”, “🫻”, “🫼”, “🫽”, “🫾”, “🫿”, “🫠”, “🫡”, “🫢”, “🫣”, “🫤”, “🫥”, “🫦”, “🫧”, “🫨”, “🫩”, “🫪”, “🫫”, “🫬”, “🫭”, “🫮”, “🫯”, “🫰”, “🫱”, “🫲”, “🫳”, “🫴”, “🫵”, “🫶”, “🫷”, “🫸”, “🫹”, “🫺”, “🫻”, “🫼”, “🫽”, “🫾”, “🫿”, “🫠”, “🫡”, “🫢”, “🫣”, “🫤”, “🫥”, “🫦”, “🫧”, “🫨”, “🫩”, “🫪”, “🫫”, “🫬”, “🫭”, “🫮”, “🫯”, “🫰”, “🫱”, “🫲”, “🫳”, “🫴”, “🫵”, “🫶”, “🫷”, “🫸”, “🫹”, “🫺”, “🫻”, “🫼”, “🫽”, “🫾”, “🫿”, “🫠”, “🫡”, “🫢”, “🫣”, “🫤”, “🫥”, “🫦”, “🫧”, “🫨”, “🫩”, “🫪”, “🫫”, “🫬”, “🫭”, “🫮”, “🫯”, “🫰”, “🫱”, “🫲”, “🫳”, “🫴”, “🫵”, “🫶”, “🫷”, “🫸”, “🫹”, “🫺”, “🫻”, “🫼”, “🫽”, “🫾”, “🫿”, “🫠”, “🫡”, “🫢”, “🫣”, “🫤”, “🫥”, “🫦”, “🫧”, “🫨”, “🫩”, “🫪”, “🫫”, “🫬”, “🫭”, “🫮”, “🫯”, “🫰”, “🫱”, “🫲”, “🫳”, “🫴”, “🫵”, “🫶”, “🫷”, “🫸”, “🫹”, “🫺”, “🫻”, “🫼”, “🫽”, “🫾”, “🫿”, “🫠”, “🫡”, “🫢”, “🫣”, “🫤”, “🫥”, “🫦”, “🫧”, “🫨”, “🫩”, “🫪”, “🫫”, “🫬”, “🫭”, “🫮”, “🫯”, “🫰”, “🫱”, “🫲”, “🫳”, “🫴”, “🫵”, “🫶”, “🫷”, “🫸”, “🫹”, “🫺”, “🫻”, “🫼”, “🫽”, “🫾”, “🫿”, “🫠”, “🫡”, “🫢”, “🫣”, “🫤”, “🫥”, “🫦”, “🫧”, “🫨”, “🫩”, “🫪”, “🫫”, “🫬”, “🫭”, “🫮”, “🫯”, “🫰”, “🫱”, “🫲”, “🫳”, “🫴”, “🫵”, “🫶”, “🫷”, “🫸”, “🫹”, “🫺”, “🫻”, “🫼”, “🫽”, “🫾”, “🫿”, “🫠”, “🫡”, “🫢”, “🫣”, “🫤”, “🫥”, “🫦”, “🫧”, “🫨”, “🫩”, “🫪”, “🫫”, “🫬”, “🫭”, “🫮”, “🫯”, “🫰”, “🫱”, “🫲”, “🫳”, “🫴”, “🫵”, “🫶”, “🫷”, “🫸”, “🫹”, “🫺”, “🫻”, “🫼”, “🫽”, “🫾”, “🫿”, “🫠”, “🫡”, “🫢”, “🫣”, “🫤”, “🫥”, “🫦”, “🫧”, “🫨”, “🫩”, “🫪”, “🫫”, “🫬”, “🫭”, “🫮”, “🫯”, “🫰”, “🫱”, “🫲”, “🫳”, “🫴”, “🫵”, “🫶”, “🫷”, “🫸”, “🫹”, “🫺”, “🫻”, “🫼”, “🫽”, “🫾”, “🫿”, “🫠”, “🫡”, “🫢”, “🫣”, “🫤”, “🫥”, “🫦”, “🫧”, “🫨”, “🫩”, “🫪”, “🫫”, “🫬”, “🫭”, “🫮”, “🫯”, “🫰”, “🫱”, “🫲”, “🫳”, “🫴”, “🫵”, “🫶”, “🫷”, “🫸”, “🫹”, “🫺”, “🫻”, “🫼”, “🫽”, “🫾”, “🫿”, “🫠”, “🫡”, “🫢”, “🫣”, “🫤”, “🫥”, “🫦”, “🫧”, “🫨”, “🫩”, “🫪”, “🫫”, “🫬”, “🫭”, “🫮”, “🫯”, “🫰”, “🫱”, “🫲”, “🫳”, “🫴”, “🫵”, “🫶”, “🫷”, “🫸”, “🫹”, “🫺”, “🫻”, “🫼”, “🫽”, “🫾”, “🫿”, “🫠”, “🫡”, “🫢”, “🫣”, “🫤”, “🫥”, “🫦”, “🫧”, “🫨”, “🫩”, “🫪”, “🫫”, “🫬”, “🫭”, “🫮”, “🫯”, “🫰”, “🫱”, “🫲”, “🫳”, “🫴”, “🫵”, “🫶”, “🫷”, “🫸”, “🫹”, “🫺”, “🫻”, “🫼”, “🫽”, “🫾”, “🫿”, “🫠”, “🫡”, “🫢”, “🫣”, “🫤”, “🫥”, “🫦”, “🫧”, “🫨”, “🫩”, “🫪”, “🫫”, “🫬”, “🫭”, “🫮”, “🫯”, “🫰”, “🫱”, “🫲”, “🫳”, “🫴”, “🫵”, “🫶”, “🫷”, “🫸”, “🫹”, “🫺”, “🫻”, “🫼”, “🫽”, “🫾”, “🫿”, “🫠”, “🫡”, “🫢”, “🫣”, “🫤”, “🫥”, “🫦”, “🫧”, “🫨”, “🫩”, “🫪”, “🫫”, “🫬”, “🫭”, “🫮”, “🫯”, “🫰”, “🫱”, “🫲”, “🫳”, “🫴”, “🫵”, “🫶”, “🫷”, “🫸”, “🫹”, “🫺”, “🫻”, “🫼”, “🫽”, “🫾”, “🫿”, “🫠”, “🫡”, “🫢”, “🫣”, “🫤”, “🫥”, “🫦”, “🫧”, “🫨”, “🫩”, “🫪”, “🫫”, “🫬”, “🫭”, “🫮”, “🫯”, “🫰”, “🫱”, “🫲”, “🫳”, “🫴”, “🫵”, “🫶”, “🫷”, “🫸”, “🫹”, “🫺”, “🫻”, “🫼”, “🫽”, “🫾”, “🫿”, “🫠”, “🫡”, “🫢”, “🫣”, “🫤”, “🫥”, “🫦”, “🫧”, “🫨”, “🫩”, “🫪”, “🫫”, “🫬”, “🫭”, “🫮”, “🫯”, “🫰”, “🫱”, “🫲”, “🫳”, “🫴”, “🫵”, “🫶”, “🫷”, “🫸”, “🫹”, “🫺”, “🫻”, “🫼”, “🫽”, “🫾”, “🫿”, “🫠”, “🫡”, “🫢”, “🫣”, “🫤”, “🫥”, “🫦”, “🫧”, “🫨”, “🫩”, “🫪”, “🫫”, “🫬”, “🫭”, “🫮”, “🫯”, “🫰”, “🫱”, “🫲”, “🫳”, “🫴”, “🫵”, “🫶”, “🫷”, “🫸”, “🫹”, “🫺”, “🫻”, “🫼”, “🫽”, “🫾”, “🫿”, “🫠”, “🫡”, “🫢”, “🫣”, “🫤”, “🫥”, “🫦”, “🫧”, “🫨”, “🫩”, “🫪”, “🫫”, “🫬”, “🫭”, “🫮”, “🫯”, “🫰”, “🫱”, “🫲”, “🫳”, “🫴”, “🫵”, “🫶”, “🫷”, “🫸”, “🫹”, “🫺”, “🫻”, “🫼”, “🫽”, “🫾”, “🫿”, “🫠”, “🫡”, “🫢”, “🫣”, “🫤”, “🫥”, “🫦”, “🫧”, “🫨”, “🫩”, “🫪”, “🫫”, “🫬”, “🫭”, “🫮”, “🫯”, “🫰”, “🫱”, “🫲”, “🫳”, “🫴”, “🫵”, “🫶”, “🫷”, “🫸”, “🫹”, “🫺”, “🫻”, “🫼”, “🫽”, “🫾”, “🫿”, “🫠”, “🫡”, “🫢”, “🫣”, “🫤”, “🫥”, “🫦”, “🫧”, “🫨”, “🫩”, “🫪”, “🫫”, “🫬”, “🫭”, “🫮”, “🫯”, “🫰”, “🫱”, “🫲”, “🫳”, “🫴”, “🫵”, “🫶”, “🫷”, “🫸”, “🫹”, “🫺”, “🫻”, “🫼”, “🫽”, “🫾”, “🫿”, “🫠”, “🫡”, “🫢”, “🫣”, “🫤”, “🫥”, “🫦”, “🫧”, “🫨”, “🫩”, “🫪”, “🫫”, “🫬”, “🫭”, “🫮”, “🫯”, “🫰”, “🫱”, “🫲”, “🫳”, “🫴”, “🫵”, “🫶”, “🫷”, “🫸”, “🫹”, “🫺”, “🫻”, “🫼”, “🫽”, “🫾”, “🫿”, “🫠”, “🫡”, “🫢”, “🫣”, “🫤”, “🫥”, “🫦”, “🫧”, “🫨”, “🫩”, “🫪”, “🫫”, “🫬”, “🫭”, “🫮”, “🫯”, “🫰”, “🫱”, “🫲”, “🫳”, “🫴”, “🫵”, “🫶”, “🫷”, “🫸”, “🫹”, “🫺”, “🫻”, “🫼”, “🫽”, “🫾”, “🫿”, “🫠”, “🫡”, “🫢”, “🫣”, “🫤”, “🫥”, “🫦”, “🫧”, “🫨”, “🫩”, “🫪”, “🫫”, “🫬”, “🫭”, “🫮”, “🫯”, “🫰”, “🫱”, “🫲”, “🫳”, “🫴”, “🫵”, “🫶”, “🫷”, “🫸”, “🫹”, “🫺”, “🫻”, “🫼”, “🫽”, “🫾”, “🫿”, “🫠”, “🫡”, “🫢”, “🫣”, “🫤”, “🫥”, “🫦”, “🫧”, “🫨”, “🫩”, “🫪”, “🫫”, “🫬”, “🫭”, “🫮”, “🫯”, “🫰”, “🫱”, “🫲”, “🫳”, “🫴”, “🫵”, “🫶”, “🫷”, “🫸”, “🫹”, “🫺”, “🫻”, “🫼”, “🫽”, “🫾”, “🫿”, “🫠”, “🫡”, “🫢”, “🫣”, “🫤”, “🫥”, “🫦”, “🫧”, “🫨”, “🫩”, “🫪”, “🫫”, “🫬”, “🫭”, “🫮”, “🫯”, “🫰”, “🫱”, “🫲”, “🫳”, “🫴”, “🫵”, “🫶”, “🫷”, “🫸”, “🫹”, “🫺”, “🫻”, “🫼”, “🫽”, “🫾”, “🫿”, “🫠”, “🫡”, “🫢”, “🫣”, “🫤”, “🫥”, “🫦”, “🫧”, “🫨”, “🫩”, “🫪”, “🫫”, “🫬”, “🫭”, “🫮”, “🫯”, “🫰”, “🫱”, “🫲”, “🫳”, “🫴”, “🫵”, “🫶”, “🫷”, “🫸”, “🫹”, “🫺”, “🫻”, “🫼”, “🫽”, “🫾”, “🫿”, “🫠”, “🫡”, “🫢”, “🫣”, “🫤”, “🫥”, “🫦”, “🫧”, “🫨”, “🫩”, “🫪”, “🫫”, “🫬”, “🫭”, “🫮”, “🫯”, “🫰”, “🫱”, “🫲”, “🫳”, “🫴”, “🫵”, “🫶”, “🫷”, “🫸”, “🫹”, “🫺”, “🫻”, “🫼”, “🫽”, “🫾”, “🫿”, “🫠”, “🫡”, “🫢”, “🫣”, “🫤”, “🫥”, “🫦”, “🫧”, “🫨”, “🫩”, “🫪”, “🫫”, “🫬”, “🫭”, “🫮”, “🫯”, “🫰”, “🫱”, “🫲”, “🫳”, “🫴”, “🫵”, “🫶”, “🫷”, “🫸”, “🫹”, “🫺”, “🫻”, “🫼”, “🫽”, “🫾”, “🫿”, “🫠”, “🫡”, “🫢”, “🫣”, “🫤”, “🫥”, “🫦”, “🫧”, “🫨”, “🫩”, “🫪”, “🫫”, “🫬”, “🫭”, “🫮”, “🫯”, “🫰”, “🫱”, “🫲”, “🫳”, “🫴”, “🫵”, “🫶”, “🫷”, “🫸”, “🫹”, “🫺”, “🫻”, “🫼”, “🫽”, “🫾”, “🫿”, “🫠”, “🫡”, “🫢”, “🫣”, “🫤”, “🫥”, “🫦”, “🫧”, “🫨”, “🫩”, “🫪”, “🫫”, “🫬”, “🫭”, “🫮”, “🫯”, “🫰”, “🫱”, “🫲”, “🫳”, “🫴”, “🫵”, “🫶”, “🫷”, “🫸”, “🫹”, “🫺”, “🫻”, “🫼”, “🫽”, “🫾”, “🫿”, “🫠”, “🫡”, “🫢”, “🫣”, “🫤”, “🫥”, “🫦”, “🫧”, “🫨”, “🫩”, “🫪”, “🫫”, “🫬”, “🫭”, “🫮”, “🫯”, “🫰”, “🫱”, “🫲”, “🫳”, “🫴”, “🫵”, “🫶”, “🫷”, “🫸”, “🫹”, “🫺”, “🫻”, “🫼”, “🫽”, “🫾”, “🫿”, “🫠”, “🫡”, “🫢”, “🫣”, “🫤”, “🫥”, “🫦”, “🫧”, “🫨”, “🫩”, “🫪”, “🫫”, “🫬”, “🫭”, “🫮”, “🫯”, “🫰”, “🫱”, “🫲”, “🫳”, “🫴”, “🫵”, “🫶”, “🫷”, “🫸”, “🫹”, “🫺”, “🫻”, “🫼”, “🫽”, “🫾”, “🫿”, “🫠”, “🫡”, “🫢”, “🫣”, “🫤”, “🫥”, “🫦”, “🫧”, “🫨”, “🫩”, “🫪”, “🫫”, “🫬”, “🫭”, “🫮”, “🫯”, “🫰”, “🫱”, “🫲”, “🫳”, “🫴”, “🫵”, “🫶”, “🫷”, “🫸”, “🫹”, “🫺”, “🫻”, “🫼”, “🫽”, “🫾”, “🫿”, “🫠”, “🫡”, “🫢”, “🫣”, “🫤”, “🫥”, “🫦”, “🫧”, “🫨”, “🫩”, “🫪”, “🫫”, “🫬”, “🫭”, “🫮”, “🫯”, “🫰”, “🫱”, “🫲”, “🫳”, “🫴”, “🫵”, “🫶”, “🫷”, “🫸”, “🫹”, “🫺”, “🫻”, “🫼”, “🫽”, “🫾”, “🫿”, “🫠”, “🫡”, “🫢”, “🫣”, “🫤”, “🫥”, “🫦”, “🫧”, “🫨”, “🫩”, “🫪”, “🫫”, “🫬”, “🫭”, “🫮”, “🫯”, "🫰", "🫱", "🫲", "🫳", "🫴", "🫵", "🫶", "🫷", "🫸", "🫹", "🫺", "🫻", "🫼", "🫽", "🫾", "🫿"]; */
}

/**
 * The reaction is based on a custom emoji.
 * @see https://core.telegram.org/bots/api#reactiontypecustomemoji
 */
export interface ReactionTypeCustomEmoji extends ReactionType {
  /** Type of the reaction, always “custom_emoji” */
  type: "custom_emoji";
  /** Custom emoji identifier */
  custom_emoji_id: string;
}

/**
 * The reaction is paid.
 * @see https://core.telegram.org/bots/api#reactiontypepaid
 */
export interface ReactionTypePaid extends ReactionType {
  /** Type of the reaction, always “paid” */
  type: "paid";
}

/**
 * Represents a reaction added to a message along with the number of times it was added.
 * @see https://core.telegram.org/bots/api#reactioncount
 */
export interface ReactionCount {
  /** Type of the reaction */
  type: ReactionType;
  /** Number of times the reaction was added */
  total_count: Integer;
}

/**
 * This object represents a change of a reaction on a message performed by a user.
 * @see https://core.telegram.org/bots/api#messagereactionupdated
 */
export interface MessageReactionUpdated {
  /** The chat containing the message the user reacted to */
  chat: Chat;
  /** Unique identifier of the message inside the chat */
  message_id: Integer;
  /** Optional. The user that changed the reaction, if the user isn't anonymous */
  user?: User;
  /** Optional. The chat on behalf of which the reaction was changed, if the user is anonymous and the reaction is added to a message in a channel discussion group */
  actor_chat?: Chat;
  /** Date of the change in Unix time */
  date: Integer;
  /** Previous list of reaction types that were set by the user */
  old_reaction: Array<ReactionType>;
  /** New list of reaction types that have been set by the user */
  new_reaction: Array<ReactionType>;
}

/**
 * This object represents a change of a reaction count on a message.
 * @see https://core.telegram.org/bots/api#messagereactioncountupdated
 */
export interface MessageReactionCountUpdated {
  /** The chat containing the message */
  chat: Chat;
  /** Unique identifier of the message inside the chat */
  message_id: Integer;
  /** Date of the change in Unix time */
  date: Integer;
  /** List of reactions that are present on the message */
  reactions: Array<ReactionCount>;
}

// =============================================================================
// Gifts and Star Transaction Types
// =============================================================================

/**
 * Contains information about a gift that can be sent by the bot.
 * @see https://core.telegram.org/bots/api#gift
 */
export interface Gift {
  /** Unique identifier of the gift */
  id: string;
  /** The gift */
  sticker: Sticker;
  /** The number of Telegram Stars that must be paid to send the sticker */
  star_count: Integer;
  /** The total number of the gifts of this type that can be sent; for limited gifts only */
  total_count?: Integer;
  /** The number of remaining gifts of this type that can be sent; for limited gifts only */
  remaining_count?: Integer;
}

/**
 * This object represents a list of gifts.
 * @see https://core.telegram.org/bots/api#gifts
 */
export interface Gifts {
  /** The list of gifts */
  gifts: Array<Gift>;
}

/**
 * This object contains information about a gift.
 * @see https://core.telegram.org/bots/api#uniquegift
 */
export interface UniqueGift {
  /** Unique identifier of the gift */
  id: string;
  /** The gift */
  sticker: Sticker;
  /** The number of Telegram Stars that must be paid to send the sticker */
  star_count: Integer;
  /** The maximum number of copies of this gift that can be sent */
  total_count?: Integer;
  /** The number of remaining copies of this gift that can be sent */
  remaining_count?: Integer;
  /** The number of times this gift has been sent */
  sent_count?: Integer;
  /** The time after which the gift will expire; in Unix time */
  expire_date?: Integer;
}

/**
 * This object contains information about a gift that was sent.
 * @see https://core.telegram.org/bots/api#ownedgift
 */
export interface OwnedGift {
  /** Unique identifier of the gift */
  id: string;
  /** The gift */
  sticker: Sticker;
}

/**
 * Contains information about a gift that was sent without a specified receiver.
 * @see https://core.telegram.org/bots/api#ownedgiftregular
 */
export interface OwnedGiftRegular extends OwnedGift {
  /** Type of the gift, always “regular” */
  type: "regular";
  /** The number of Telegram Stars that must be paid to send the sticker */
  star_count: Integer;
  /** Optional. The total number of the gifts of this type that can be sent; for limited gifts only */
  total_count?: Integer;
  /** Optional. The number of remaining gifts of this type that can be sent; for limited gifts only */
  remaining_count?: Integer;
}

/**
 * Contains information about a gift that was sent with a specified receiver.
 * @see https://core.telegram.org/bots/api#ownedgiftunique
 */
export interface OwnedGiftUnique extends OwnedGift {
  /** Type of the gift, always “unique” */
  type: "unique";
  /** The number of Telegram Stars that must be paid to send the sticker */
  star_count: Integer;
  /** Optional. The maximum number of copies of this gift that can be sent */
  total_count?: Integer;
  /** Optional. The number of remaining copies of this gift that can be sent */
  remaining_count?: Integer;
  /** Optional. The number of times this gift has been sent */
  sent_count?: Integer;
  /** Optional. The time after which the gift will expire; in Unix time */
  expire_date?: Integer;
}

/**
 * This object represents a list of gifts.
 * @see https://core.telegram.org/bots/api#ownedgifts
 */
export interface OwnedGifts {
  /** The list of gifts */
  gifts: Array<OwnedGift>;
}

/**
 * Contains information about the number of Telegram Stars that a bot can payout as a gift.
 * @see https://core.telegram.org/bots/api#staramount
 */
export interface StarAmount {
  /** The number of Telegram Stars */
  amount: Integer;
}

/**
 * This object represents a portion of the price for a payment.
 * @see https://core.telegram.org/bots/api#transactionpartner
 */
export interface TransactionPartner {}

/**
 * Describes a transaction with a user.
 * @see https://core.telegram.org/bots/api#transactionpartneruser
 */
export interface TransactionPartnerUser extends TransactionPartner {
  /** Type of the transaction partner, always “user” */
  type: "user";
  /** Information about the user */
  user: User;
  /** Optional. Bot-specified invoice payload */
  invoice_payload?: string;
  /** Optional. Information about the paid media bought by the user */
  paid_media?: PaidMediaInfo;
}

/**
 * Describes a transaction with a chat.
 * @see https://core.telegram.org/bots/api#transactionpartnerchat
 */
export interface TransactionPartnerChat extends TransactionPartner {
  /** Type of the transaction partner, always “chat” */
  type: "chat";
  /** Information about the chat */
  chat: Chat;
  /** Optional. Bot-specified invoice payload */
  invoice_payload?: string;
  /** Optional. Information about the paid media bought by the user */
  paid_media?: PaidMediaInfo;
}

/**
 * Describes a transaction with a user.
 * @see https://core.telegram.org/bots/api#transactionpartneraffiliateprogram
 */
export interface TransactionPartnerAffiliateProgram extends TransactionPartner {
  /** Type of the transaction partner, always “affiliate_program” */
  type: "affiliate_program";
  /** Information about the bot that received the commission via the affiliate program */
  sponsor_user?: User;
}

/**
 * Describes a transaction with Fragment.
 * @see https://core.telegram.org/bots/api#transactionpartnerfragment
 */
export interface TransactionPartnerFragment extends TransactionPartner {
  /** Type of the transaction partner, always “fragment” */
  type: "fragment";
  /** Optional. State of the transaction if the transaction is outgoing */
  withdrawal_state?: RevenueWithdrawalState;
}

/**
 * Describes a transaction with Telegram Ads.
 * @see https://core.telegram.org/bots/api#transactionpartnertelegramads
 */
export interface TransactionPartnerTelegramAds extends TransactionPartner {
  /** Type of the transaction partner, always “telegram_ads” */
  type: "telegram_ads";
}

/**
 * Describes a transaction with an unknown source or recipient.
 * @see https://core.telegram.org/bots/api#transactionpartnerother
 */
export interface TransactionPartnerOther extends TransactionPartner {
  /** Type of the transaction partner, always “other” */
  type: "other";
}

/**
 * Contains information about a Telegram Star transaction.
 * @see https://core.telegram.org/bots/api#startransaction
 */
export interface StarTransaction {
  /** Unique identifier of the transaction. Coincides with the identifer of the original transaction for refund transactions. Coincides with SuccessfulPayment.telegram_payment_charge_id for successful incoming payments from users. */
  id: string;
  /** Number of stars transferred by the transaction */
  amount: Integer;
  /** Date the transaction was created in Unix time */
  date: Integer;
  /** Optional. Source of an incoming transaction (e.g., a user purchasing goods or services, Fragment refunding a failed withdrawal). Only for incoming transactions */
  source?: TransactionPartner;
  /** Optional. Receiver of an outgoing transaction (e.g., a user for a purchase refund, Fragment for a withdrawal). Only for outgoing transactions */
  receiver?: TransactionPartner;
}

/**
 * Contains a list of Telegram Star transactions.
 * @see https://core.telegram.org/bots/api#startransactions
 */
export interface StarTransactions {
  /** The list of transactions */
  transactions: Array<StarTransaction>;
}

/**
 * Describes the state of a revenue withdrawal operation.
 * @see https://core.telegram.org/bots/api#revenuewithdrawalstate
 */
export interface RevenueWithdrawalState {}

/**
 * The withdrawal is in progress.
 * @see https://core.telegram.org/bots/api#revenuewithdrawalstatepending
 */
export interface RevenueWithdrawalStatePending extends RevenueWithdrawalState {
  /** Type of the state, always “pending” */
  type: "pending";
}

/**
 * The withdrawal succeeded.
 * @see https://core.telegram.org/bots/api#revenuewithdrawalstatesucceeded
 */
export interface RevenueWithdrawalStateSucceeded
  extends RevenueWithdrawalState {
  /** Type of the state, always “succeeded” */
  type: "succeeded";
  /** Date the withdrawal was completed in Unix time */
  date: Integer;
  /** An HTTPS URL that can be used to see transaction details */
  url: string;
}

/**
 * The withdrawal failed and the transaction was refunded.
 * @see https://core.telegram.org/bots/api#revenuewithdrawalstatefailed
 */
export interface RevenueWithdrawalStateFailed extends RevenueWithdrawalState {
  /** Type of the state, always “failed” */
  type: "failed";
}

/**
 * Contains information about the affiliate that introduced the buyer to the bot.
 * @see https://core.telegram.org/bots/api#affiliateinfo
 */
export interface AffiliateInfo {
  /** The number of Telegram Stars earned by the affiliate */
  commission_per_mille: Integer;
  /** Optional. The number of successful purchases made by the affiliate's referred users */
  successful_purchase_count?: Integer;
  /** Optional. Information about the user that introduced the affiliate to the bot */
  sponsor_user?: User;
}

// =============================================================================
// Service Message Types
// =============================================================================

/**
 * This object represents a service message about a user boosting a chat.
 * @see https://core.telegram.org/bots/api#chatboostadded
 */
export interface ChatBoostAdded {
  /** Number of boosts added by the user */
  boost_count: Integer;
}

/**
 * This object represents a service message about a change in auto-delete timer settings.
 * @see https://core.telegram.org/bots/api#messageautodeletetimerchanged
 */
export interface MessageAutoDeleteTimerChanged {
  /** New auto-delete time for messages in the chat; in seconds */
  message_auto_delete_time: Integer;
}

/**
 * This object represents a service message about a video chat scheduled in the chat.
 * @see https://core.telegram.org/bots/api#videochatscheduled
 */
export interface VideoChatScheduled {
  /** Point in time (Unix timestamp) when the video chat is supposed to be started by a chat administrator */
  start_date: Integer;
}

/**
 * This object represents a service message about a video chat started in the chat. Currently holds no information.
 * @see https://core.telegram.org/bots/api#videochatstarted
 */
export interface VideoChatStarted {}

/**
 * This object represents a service message about a video chat ended in the chat.
 * @see https://core.telegram.org/bots/api#videochatended
 */
export interface VideoChatEnded {
  /** Video chat duration in seconds */
  duration: Integer;
}

/**
 * This object represents a service message about new members invited to a video chat.
 * @see https://core.telegram.org/bots/api#videochatparticipantsinvited
 */
export interface VideoChatParticipantsInvited {
  /** New members that were invited to the video chat */
  users: Array<User>;
}

/**
 * This object represents a service message about a new forum topic created in the chat.
 * @see https://core.telegram.org/bots/api#forumtopiccreated
 */
export interface ForumTopicCreated {
  /** Name of the topic */
  name: string;
  /** Color of the topic icon in RGB format */
  icon_color: Integer;
  /** Optional. Unique identifier of the custom emoji shown as the topic icon */
  icon_custom_emoji_id?: string;
}

/**
 * This object represents a service message about a forum topic closed in the chat. Currently holds no information.
 * @see https://core.telegram.org/bots/api#forumtopicclosed
 */
export interface ForumTopicClosed {}

/**
 * This object represents a service message about an edited forum topic.
 * @see https://core.telegram.org/bots/api#forumtopicedited
 */
export interface ForumTopicEdited {
  /** Optional. New name of the topic, if it was edited */
  name?: string;
  /** Optional. New identifier of the custom emoji shown as the topic icon, if it was edited; an empty string if the icon was removed */
  icon_custom_emoji_id?: string;
}

/**
 * This object represents a service message about a forum topic reopened in the chat. Currently holds no information.
 * @see https://core.telegram.org/bots/api#forumtopicreopened
 */
export interface ForumTopicReopened {}

/**
 * This object represents a service message about General forum topic hidden in the chat. Currently holds no information.
 * @see https://core.telegram.org/bots/api#generalforumtopichidden
 */
export interface GeneralForumTopicHidden {}

/**
 * This object represents a service message about General forum topic unhidden in the chat. Currently holds no information.
 * @see https://core.telegram.org/bots/api#generalforumtopicunhidden
 */
export interface GeneralForumTopicUnhidden {}

/**
 * This object represents a service message about a user allowing a bot to write messages after adding it to the attachment menu.
 * @see https://core.telegram.org/bots/api#writeaccessallowed
 */
export interface WriteAccessAllowed {
  /** Optional. True, if the access was granted after the user accepted an explicit request from a Web App sent by the method requestWriteAccess */
  from_request?: boolean;
  /** Optional. Name of the Web App, if the access was granted when the Web App was launched from a link */
  web_app_name?: string;
  /** Optional. True, if the access was granted when the bot was added to the attachment or side menu */
  from_attachment_menu?: boolean;
}

// =============================================================================
// Checklist Types
// =============================================================================

/**
 * This object represents a list of checklist tasks.
 * @see https://core.telegram.org/bots/api#checklist
 */
export interface Checklist {
  /** The list of tasks in the checklist */
  tasks: Array<ChecklistTask>;
}

/**
 * This object represents a checklist task.
 * @see https://core.telegram.org/bots/api#checklisttask
 */
export interface ChecklistTask {
  /** Text of the task */
  text: string;
  /** Optional. True, if the task is checked */
  checked?: boolean;
}

/**
 * This object represents a list of checklist tasks that were added to a message.
 * @see https://core.telegram.org/bots/api#checklisttasksadded
 */
export interface ChecklistTasksAdded {
  /** The list of task IDs that were added */
  task_ids: Array<string>;
}

/**
 * This object represents a list of checklist tasks that were marked as done.
 * @see https://core.telegram.org/bots/api#checklisttasksdone
 */
export interface ChecklistTasksDone {
  /** The list of task IDs that were marked as done */
  task_ids: Array<string>;
}

/**
 * This object represents a list of checklist tasks that were marked as done.
 * @see https://core.telegram.org/bots/api#inputchecklist
 */
export interface InputChecklist {
  /** The list of tasks in the checklist */
  tasks: Array<InputChecklistTask>;
}

/**
 * This object represents a checklist task.
 * @see https://core.telegram.org/bots/api#inputchecklisttask
 */
export interface InputChecklistTask {
  /** Text of the task */
  text: string;
}

// =============================================================================
// Message Origin Types
// =============================================================================

/**
 * This object describes the origin of a message.
 * @see https://core.telegram.org/bots/api#messageorigin
 */
// export interface MessageOrigin {}

/**
 * This object represents a quote from a message.
 * @see https://core.telegram.org/bots/api#textquote
 */
export interface TextQuote {
  /** Text of the quoted part of a message that is replied to by the given message */
  text: string;
  /** Optional. Special entities that appear in the quote. Currently, only bold, italic, underline, strikethrough, spoiler, and custom_emoji entities are kept in quotes. */
  entities?: Array<MessageEntity>;
  /** Approximate quote position in the original message in UTF-16 code units as specified by the sender */
  position: Integer;
  /** Optional. True, if the quote was chosen manually by the message sender. Otherwise, the quote was added automatically by the server. */
  is_manual?: boolean;
}

// =============================================================================
// Profile Photo Types
// =============================================================================

/**
 * This object represents a user's profile pictures.
 * @see https://core.telegram.org/bots/api#inputprofilephoto
 */
export interface InputProfilePhoto {}

/**
 * This object represents a static user's profile picture.
 * @see https://core.telegram.org/bots/api#inputprofilephotostatic
 */
export interface InputProfilePhotoStatic extends InputProfilePhoto {
  /** Profile photo to set, should be uploaded using multipart/form-data */
  photo: InputFile;
}

/**
 * This object represents an animated user's profile picture.
 * @see https://core.telegram.org/bots/api#inputprofilephotoanimated
 */
export interface InputProfilePhotoAnimated extends InputProfilePhoto {
  /** Profile photo to set, should be uploaded using multipart/form-data */
  photo: InputFile;
  /** Optional. True, if the uploaded video should be converted to a static picture */
  is_static?: boolean;
}

// =============================================================================
// Story Types
// =============================================================================

/**
 * This object describes the position on a story media.
 * @see https://core.telegram.org/bots/api#storyareaposition
 */
export interface StoryAreaPosition {
  /** The position of the area in the media, measured in a floating-point value from 0 to 1, where 0 is the left edge and 1 is the right edge of the media */
  x: Float;
  /** The position of the area in the media, measured in a floating-point value from 0 to 1, where 0 is the top edge and 1 is the bottom edge of the media */
  y: Float;
  /** The width of the area, measured in a floating-point value from 0 to 1, where 1 is the width of the media */
  width: Float;
  /** The height of the area, measured in a floating-point value from 0 to 1, where 1 is the height of the media */
  height: Float;
  /** Optional. The rotation of the area in degrees; 0-360 */
  rotation?: Float;
}

/**
 * This object describes a user or location on a story media.
 * @see https://core.telegram.org/bots/api#storyarea
 */
export interface StoryArea {
  /** Optional. The position of the area on the story media */
  position: StoryAreaPosition;
  /** The type of the area */
  type: StoryAreaType;
}

/**
 * This object describes the type of a story area.
 * @see https://core.telegram.org/bots/api#storyareatype
 */
export interface StoryAreaType {}

/**
 * This object describes a clickable area for a location on a story media.
 * @see https://core.telegram.org/bots/api#storyareatypelocation
 */
export interface StoryAreaTypeLocation extends StoryAreaType {
  /** Type of the area, must be location */
  type: "location";
  /** Location on the map */
  location: Location;
}

/**
 * This object describes a clickable area with a suggested reaction on a story media.
 * @see https://core.telegram.org/bots/api#storyareatypesuggestedreaction
 */
export interface StoryAreaTypeSuggestedReaction extends StoryAreaType {
  /** Type of the area, must be suggested_reaction */
  type: "suggested_reaction";
  /** Suggested reaction for this area */
  reaction: ReactionType;
  /** Optional. True, if the suggested reaction is flipped */
  dark_theme?: boolean;
}

/**
 * This object describes a clickable area for a URL on a story media.
 * @see https://core.telegram.org/bots/api#storyareatypelink
 */
export interface StoryAreaTypeLink extends StoryAreaType {
  /** Type of the area, must be link */
  type: "link";
  /** Resource URL */
  url: string;
}

/**
 * This object describes a clickable area with weather information on a story media.
 * @see https://core.telegram.org/bots/api#storyareatypeweather
 */
export interface StoryAreaTypeWeather extends StoryAreaType {
  /** Type of the area, must be weather */
  type: "weather";
  /** The weather condition */
  condition: string;
  /** The temperature, in degrees Celsius */
  temperature_celsius: Float;
}

/**
 * This object describes a clickable area with a unique gift on a story media.
 * @see https://core.telegram.org/bots/api#storyareatypeuniquegift
 */
export interface StoryAreaTypeUniqueGift extends StoryAreaType {
  /** Type of the area, must be unique_gift */
  type: "unique_gift";
  /** The unique gift */
  gift: UniqueGift;
}

// =============================================================================
// Input Story Content Types
// =============================================================================

/**
 * This object represents the content of a story.
 * @see https://core.telegram.org/bots/api#inputstorycontent
 */
export interface InputStoryContent {}

/**
 * This object represents the content of a story with a photo.
 * @see https://core.telegram.org/bots/api#inputstorycontentphoto
 */
export interface InputStoryContentPhoto extends InputStoryContent {
  /** Type of the content, must be photo */
  type: "photo";
  /** Photo to send. Pass a file_id to send a photo that exists on the Telegram servers (recommended) or pass an HTTP URL for Telegram to get a photo from the Internet */
  media: string;
  /** Optional. Caption of the photo to be sent, 0-1024 characters after entities parsing */
  caption?: string;
  /** Optional. Mode for parsing entities in the photo caption. See formatting options for more details. */
  parse_mode?: string;
  /** Optional. List of special entities that appear in the caption, which can be specified instead of parse_mode */
  caption_entities?: Array<MessageEntity>;
  /** Optional. Content of the message to be sent instead of the photo */
  input_message_content?: InputMessageContent;
}

/**
 * This object represents the content of a story with a video.
 * @see https://core.telegram.org/bots/api#inputstorycontentvideo
 */
export interface InputStoryContentVideo extends InputStoryContent {
  /** Type of the content, must be video */
  type: "video";
  /** Video to send. Pass a file_id to send a video that exists on the Telegram servers (recommended) or pass an HTTP URL for Telegram to get a video from the Internet */
  media: string;
  /** Optional. Thumbnail of the file sent; can be ignored if thumbnail generation for the file is supported server-side. The thumbnail should be in JPEG format and less than 200 kB in size. A thumbnail's width and height should not exceed 320. Ignored if the file is not uploaded using multipart/form-data. Thumbnails can't be reused and can be only uploaded as a new file, so you can pass “attach://<file_attach_name>” if the thumbnail was uploaded using multipart/form-data under <file_attach_name>. */
  thumbnail?: InputFile;
  /** Optional. Caption of the video to be sent, 0-1024 characters after entities parsing */
  caption?: string;
  /** Optional. Mode for parsing entities in the video caption. See formatting options for more details. */
  parse_mode?: string;
  /** Optional. List of special entities that appear in the caption, which can be specified instead of parse_mode */
  caption_entities?: Array<MessageEntity>;
  /** Optional. Video width */
  width?: Integer;
  /** Optional. Video height */
  height?: Integer;
  /** Optional. Video duration in seconds */
  duration?: Integer;
  /** Optional. Pass True if the uploaded video is suitable for streaming */
  supports_streaming?: boolean;
  /** Optional. Content of the message to be sent instead of the video */
  input_message_content?: InputMessageContent;
}

// =============================================================================
// Direct Messages Topic Types
// =============================================================================

/**
 * This object describes the direct messages topic.
 * @see https://core.telegram.org/bots/api#directmessagestopic
 */
export interface DirectMessagesTopic {
  /** Unique identifier of the direct messages topic */
  message_thread_id: Integer;
  /** Name of the direct messages topic */
  name: string;
  /** Optional. Color of the direct messages topic icon in RGB format */
  icon_color?: Integer;
  /** Optional. Unique identifier of the custom emoji shown as the topic icon */
  icon_custom_emoji_id?: string;
}

// =============================================================================
// Suggested Post Types
// =============================================================================

/**
 * This object represents a suggested post.
 * @see https://core.telegram.org/bots/api#suggestedpostinfo
 */
export interface SuggestedPostInfo {
  /** Unique identifier of the suggested post */
  post_id: Integer;
  /** Unique identifier of the user that created the suggested post */
  user_id: Integer;
  /** The number of Telegram Stars that must be paid to approve the suggested post */
  price: Integer;
  /** Optional. The amount of suggested posts in the batch */
  batch_size?: Integer;
  /** Optional. The date of the last suggested post in the batch */
  batch_until_date?: Integer;
}

/**
 * This object represents a suggested post that is paid.
 * @see https://core.telegram.org/bots/api#suggestedpostpaid
 */
export interface SuggestedPostPaid {
  /** Unique identifier of the suggested post */
  post_id: Integer;
  /** Unique identifier of the user that created the suggested post */
  user_id: Integer;
  /** The number of Telegram Stars that must be paid to approve the suggested post */
  price: Integer;
}

/**
 * This object represents the parameters for a suggested post.
 * @see https://core.telegram.org/bots/api#suggestedpostparameters
 */
export interface SuggestedPostParameters {
  /** The number of Telegram Stars that must be paid to approve each suggested post */
  price: Integer;
  /** Optional. The maximum number of suggested posts that can be in a batch */
  batch_size?: Integer;
  /** Optional. The date of the last suggested post in the batch */
  batch_until_date?: Integer;
}

// =============================================================================
// Parameter Interfaces for All Methods
// =============================================================================

/**
 * Parameters for the getUpdates method
 * @see https://core.telegram.org/bots/api#getupdates
 */
export interface GetUpdatesParams {
  /** Optional. Identifier of the first update to be returned. Must be greater by one than the highest among the identifiers of previously received updates. By default, updates starting with the earliest unconfirmed update are returned. An update is considered confirmed as soon as getUpdates is called with an offset higher than its update_id. The negative offset can be specified to retrieve updates starting from -offset update from the end of the updates queue. All previous updates will be forgotten. */
  offset?: Integer;
  /** Optional. Limits the number of updates to be retrieved. Values between 1-100 are accepted. Defaults to 100. */
  limit?: Integer;
  /** Optional. Timeout in seconds for long polling. Defaults to 0, i.e. usual short polling. Should be positive, short polling should be used for testing purposes only. */
  timeout?: Integer;
  /** Optional. A list of the update types you want your bot to receive. For example, specify [“message”, “edited_channel_post”, “callback_query”] to only receive updates of these types. See Update for a complete list of available update types. Specify an empty list to receive all update types except chat_member, message_reaction, and message_reaction_count (default). If not specified, the previous setting will be used. */
  allowed_updates?: Array<string>;
}

/**
 * Parameters for the setWebhook method
 * @see https://core.telegram.org/bots/api#setwebhook
 */
export interface SetWebhookParams {
  /** HTTPS URL to send updates to. Use an empty string to remove webhook integration */
  url: string;
  /** Optional. Upload your public key certificate so that the root certificate in use can be checked. See our self-signed guide for details. */
  certificate?: InputFile;
  /** Optional. The fixed IP address which will be used to send webhook requests instead of the IP address resolved through DNS */
  ip_address?: string;
  /** Optional. Maximum allowed number of simultaneous HTTPS connections to the webhook for update delivery, 1-100. Defaults to 40. Use lower values to limit the load on your bot's server, and higher values to increase your bot's throughput. */
  max_connections?: Integer;
  /** Optional. A list of the update types you want your bot to receive. For example, specify [“message”, “edited_channel_post”, “callback_query”] to only receive updates of these types. See Update for a complete list of available update types. Specify an empty list to receive all update types except chat_member, message_reaction, and message_reaction_count (default). If not specified, the previous setting will be used. */
  allowed_updates?: Array<string>;
  /** Optional. Pass True to drop all pending updates */
  drop_pending_updates?: boolean;
  /** Optional. A secret token to be sent in a header “X-Telegram-Bot-Api-Secret-Token” in every webhook request, 1-256 characters. Only characters A-Z, a-z, 0-9, _ and - are allowed. The header is useful to ensure that the request comes from a webhook set by you. */
  secret_token?: string;
}

/**
 * Parameters for the deleteWebhook method
 * @see https://core.telegram.org/bots/api#deletewebhook
 */
export interface DeleteWebhookParams {
  /** Optional. Pass True to drop all pending updates */
  drop_pending_updates?: boolean;
}

/**
 * Parameters for the getMe method
 * @see https://core.telegram.org/bots/api#getme
 */
export interface GetMeParams {}

/**
 * Parameters for the sendMessage method
 * @see https://core.telegram.org/bots/api#sendmessage
 */
export interface SendMessageParams {
  /** Unique identifier for the target chat or username of the target channel (in the format @channelusername) */
  chat_id: Integer | string;
  /** Unique identifier for the target message thread (topic) of the forum; for forum supergroups only */
  message_thread_id?: Integer;
  /** Text of the message to be sent, 1-4096 characters after entities parsing */
  text: string;
  /** Optional. Mode for parsing entities in the message text. See formatting options for more details. */
  parse_mode?: string;
  /** Optional. A JSON-serialized list of special entities that appear in message text, which can be specified instead of parse_mode */
  entities?: Array<MessageEntity>;
  /** Optional. Link preview generation options for the message */
  link_preview_options?: LinkPreviewOptions;
  /** Optional. Sends the message silently. Users will receive a notification with no sound. */
  disable_notification?: boolean;
  /** Optional. Protects the contents of the sent message from forwarding and saving */
  protect_content?: boolean;
  /** Optional. Description of the message to reply to */
  reply_parameters?: ReplyParameters;
  /** Optional. Additional interface options. An object for an inline keyboard, custom reply keyboard, instructions to remove reply keyboard or to force a reply from the user. */
  reply_markup?:
    | InlineKeyboardMarkup
    | ReplyKeyboardMarkup
    | ReplyKeyboardRemove
    | ForceReply;
}

/**
 * Parameters for the forwardMessage method
 * @see https://core.telegram.org/bots/api#forwardmessage
 */
export interface ForwardMessageParams {
  /** Unique identifier for the target chat or username of the target channel (in the format @channelusername) */
  chat_id: Integer | string;
  /** Unique identifier for the target message thread (topic) of the forum; for forum supergroups only */
  message_thread_id?: Integer;
  /** Unique identifier for the chat where the original message was sent (or channel username in the format @channelusername) */
  from_chat_id: Integer | string;
  /** Optional. Sends the message silently. Users will receive a notification with no sound. */
  disable_notification?: boolean;
  /** Optional. Protects the contents of the forwarded message from forwarding and saving */
  protect_content?: boolean;
  /** Message identifier in the chat specified in from_chat_id */
  message_id: Integer;
}

/**
 * Parameters for the forwardMessages method
 * @see https://core.telegram.org/bots/api#forwardmessages
 */
export interface ForwardMessagesParams {
  /** Unique identifier for the target chat or username of the target channel (in the format @channelusername) */
  chat_id: Integer | string;
  /** Unique identifier for the target message thread (topic) of the forum; for forum supergroups only */
  message_thread_id?: Integer;
  /** Unique identifier for the chat where the original messages were sent (or channel username in the format @channelusername) */
  from_chat_id: Integer | string;
  /** A JSON-serialized list of 1-100 identifiers of messages in the chat from_chat_id to forward. The identifiers must be specified in a strictly increasing order. */
  message_ids: Array<Integer>;
  /** Optional. Sends the messages silently. Users will receive a notification with no sound. */
  disable_notification?: boolean;
  /** Optional. Protects the contents of the forwarded messages from forwarding and saving */
  protect_content?: boolean;
}

/**
 * Parameters for the copyMessage method
 * @see https://core.telegram.org/bots/api#copymessage
 */
export interface CopyMessageParams {
  /** Unique identifier for the target chat or username of the target channel (in the format @channelusername) */
  chat_id: Integer | string;
  /** Unique identifier for the target message thread (topic) of the forum; for forum supergroups only */
  message_thread_id?: Integer;
  /** Unique identifier for the chat where the original message was sent (or channel username in the format @channelusername) */
  from_chat_id: Integer | string;
  /** Message identifier in the chat specified in from_chat_id */
  message_id: Integer;
  /** Optional. New caption for media, 0-1024 characters after entities parsing. If not specified, the original caption is kept */
  caption?: string;
  /** Optional. Mode for parsing entities in the new caption. See formatting options for more details. */
  parse_mode?: string;
  /** Optional. A JSON-serialized list of special entities that appear in the new caption, which can be specified instead of parse_mode */
  caption_entities?: Array<MessageEntity>;
  /** Optional. Sends the message silently. Users will receive a notification with no sound. */
  disable_notification?: boolean;
  /** Optional. Protects the contents of the sent message from forwarding and saving */
  protect_content?: boolean;
  /** Optional. Description of the message to reply to */
  reply_parameters?: ReplyParameters;
  /** Optional. Additional interface options. An object for an inline keyboard, custom reply keyboard, instructions to remove reply keyboard or to force a reply from the user. */
  reply_markup?:
    | InlineKeyboardMarkup
    | ReplyKeyboardMarkup
    | ReplyKeyboardRemove
    | ForceReply;
}

/**
 * Parameters for the copyMessages method
 * @see https://core.telegram.org/bots/api#copymessages
 */
export interface CopyMessagesParams {
  /** Unique identifier for the target chat or username of the target channel (in the format @channelusername) */
  chat_id: Integer | string;
  /** Unique identifier for the target message thread (topic) of the forum; for forum supergroups only */
  message_thread_id?: Integer;
  /** Unique identifier for the chat where the original messages were sent (or channel username in the format @channelusername) */
  from_chat_id: Integer | string;
  /** A JSON-serialized list of 1-100 identifiers of messages in the chat from_chat_id to copy. The identifiers must be specified in a strictly increasing order. */
  message_ids: Array<Integer>;
  /** Optional. Sends the messages silently. Users will receive a notification with no sound. */
  disable_notification?: boolean;
  /** Optional. Protects the contents of the sent messages from forwarding and saving */
  protect_content?: boolean;
  /** Optional. Pass True to copy the messages without their captions */
  remove_caption?: boolean;
}

/**
 * Parameters for the sendPhoto method
 * @see https://core.telegram.org/bots/api#sendphoto
 */
export interface SendPhotoParams {
  /** Unique identifier for the target chat or username of the target channel (in the format @channelusername) */
  chat_id: Integer | string;
  /** Unique identifier for the target message thread (topic) of the forum; for forum supergroups only */
  message_thread_id?: Integer;
  /** Photo to send. Pass a file_id as String to send a photo that exists on the Telegram servers (recommended), pass an HTTP URL as a String for Telegram to get a photo from the Internet, or upload a new photo using multipart/form-data. The photo must be at most 10 MB in size. The photo's width and height must not exceed 10000 in total. Width and height ratio must be at most 20. */
  photo: InputFile | string;
  /** Optional. Photo caption (may also be used when resending photos by file_id), 0-1024 characters after entities parsing */
  caption?: string;
  /** Optional. Mode for parsing entities in the photo caption. See formatting options for more details. */
  parse_mode?: string;
  /** Optional. A JSON-serialized list of special entities that appear in the caption, which can be specified instead of parse_mode */
  caption_entities?: Array<MessageEntity>;
  /** Optional. Pass True if the photo needs to be covered with a spoiler animation */
  has_spoiler?: boolean;
  /** Optional. Sends the message silently. Users will receive a notification with no sound. */
  disable_notification?: boolean;
  /** Optional. Protects the contents of the sent message from forwarding and saving */
  protect_content?: boolean;
  /** Optional. Description of the message to reply to */
  reply_parameters?: ReplyParameters;
  /** Optional. Additional interface options. An object for an inline keyboard, custom reply keyboard, instructions to remove reply keyboard or to force a reply from the user. */
  reply_markup?:
    | InlineKeyboardMarkup
    | ReplyKeyboardMarkup
    | ReplyKeyboardRemove
    | ForceReply;
}

/**
 * Parameters for the sendAudio method
 * @see https://core.telegram.org/bots/api#sendaudio
 */
export interface SendAudioParams {
  /** Unique identifier for the target chat or username of the target channel (in the format @channelusername) */
  chat_id: Integer | string;
  /** Unique identifier for the target message thread (topic) of the forum; for forum supergroups only */
  message_thread_id?: Integer;
  /** Audio file to send. Pass a file_id as String to send an audio file that exists on the Telegram servers (recommended), pass an HTTP URL as a String for Telegram to get an audio file from the Internet, or upload a new one using multipart/form-data. */
  audio: InputFile | string;
  /** Optional. Audio caption, 0-1024 characters after entities parsing */
  caption?: string;
  /** Optional. Mode for parsing entities in the audio caption. See formatting options for more details. */
  parse_mode?: string;
  /** Optional. A JSON-serialized list of special entities that appear in the caption, which can be specified instead of parse_mode */
  caption_entities?: Array<MessageEntity>;
  /** Optional. Duration of the audio in seconds */
  duration?: Integer;
  /** Optional. Performer */
  performer?: string;
  /** Optional. Track name */
  title?: string;
  /** Optional. Thumbnail of the file sent; can be ignored if thumbnail generation for the file is supported server-side. The thumbnail should be in JPEG format and less than 200 kB in size. A thumbnail's width and height should not exceed 320. Ignored if the file is not uploaded using multipart/form-data. Thumbnails can't be reused and can be only uploaded as a new file, so you can pass “attach://<file_attach_name>” if the thumbnail was uploaded using multipart/form-data under <file_attach_name>. */
  thumbnail?: InputFile;
  /** Optional. Sends the message silently. Users will receive a notification with no sound. */
  disable_notification?: boolean;
  /** Optional. Protects the contents of the sent message from forwarding and saving */
  protect_content?: boolean;
  /** Optional. Description of the message to reply to */
  reply_parameters?: ReplyParameters;
  /** Optional. Additional interface options. An object for an inline keyboard, custom reply keyboard, instructions to remove reply keyboard or to force a reply from the user. */
  reply_markup?:
    | InlineKeyboardMarkup
    | ReplyKeyboardMarkup
    | ReplyKeyboardRemove
    | ForceReply;
}

/**
 * Parameters for the sendDocument method
 * @see https://core.telegram.org/bots/api#senddocument
 */
export interface SendDocumentParams {
  /** Unique identifier for the target chat or username of the target channel (in the format @channelusername) */
  chat_id: Integer | string;
  /** Unique identifier for the target message thread (topic) of the forum; for forum supergroups only */
  message_thread_id?: Integer;
  /** File to send. Pass a file_id as String to send a file that exists on the Telegram servers (recommended), pass an HTTP URL as a String for Telegram to get a file from the Internet, or upload a new one using multipart/form-data. */
  document: InputFile | string;
  /** Optional. Thumbnail of the file sent; can be ignored if thumbnail generation for the file is supported server-side. The thumbnail should be in JPEG format and less than 200 kB in size. A thumbnail's width and height should not exceed 320. Ignored if the file is not uploaded using multipart/form-data. Thumbnails can't be reused and can be only uploaded as a new file, so you can pass “attach://<file_attach_name>” if the thumbnail was uploaded using multipart/form-data under <file_attach_name>. */
  thumbnail?: InputFile;
  /** Optional. Document caption (may also be used when resending documents by file_id), 0-1024 characters after entities parsing */
  caption?: string;
  /** Optional. Mode for parsing entities in the document caption. See formatting options for more details. */
  parse_mode?: string;
  /** Optional. A JSON-serialized list of special entities that appear in the caption, which can be specified instead of parse_mode */
  caption_entities?: Array<MessageEntity>;
  /** Optional. Disables automatic server-side content type detection for files uploaded using multipart/form-data. Always true, if the document is sent as a sticker */
  disable_content_type_detection?: boolean;
  /** Optional. Sends the message silently. Users will receive a notification with no sound. */
  disable_notification?: boolean;
  /** Optional. Protects the contents of the sent message from forwarding and saving */
  protect_content?: boolean;
  /** Optional. Description of the message to reply to */
  reply_parameters?: ReplyParameters;
  /** Optional. Additional interface options. An object for an inline keyboard, custom reply keyboard, instructions to remove reply keyboard or to force a reply from the user. */
  reply_markup?:
    | InlineKeyboardMarkup
    | ReplyKeyboardMarkup
    | ReplyKeyboardRemove
    | ForceReply;
}

/**
 * Parameters for the sendVideo method
 * @see https://core.telegram.org/bots/api#sendvideo
 */
export interface SendVideoParams {
  /** Unique identifier for the target chat or username of the target channel (in the format @channelusername) */
  chat_id: Integer | string;
  /** Unique identifier for the target message thread (topic) of the forum; for forum supergroups only */
  message_thread_id?: Integer;
  /** Video to send. Pass a file_id as String to send a video that exists on the Telegram servers (recommended), pass an HTTP URL as a String for Telegram to get a video from the Internet, or upload a new video using multipart/form-data. */
  video: InputFile | string;
  /** Optional. Duration of sent video in seconds */
  duration?: Integer;
  /** Optional. Video width */
  width?: Integer;
  /** Optional. Video height */
  height?: Integer;
  /** Optional. Thumbnail of the file sent; can be ignored if thumbnail generation for the file is supported server-side. The thumbnail should be in JPEG format and less than 200 kB in size. A thumbnail's width and height should not exceed 320. Ignored if the file is not uploaded using multipart/form-data. Thumbnails can't be reused and can be only uploaded as a new file, so you can pass “attach://<file_attach_name>” if the thumbnail was uploaded using multipart/form-data under <file_attach_name>. */
  thumbnail?: InputFile;
  /** Optional. Video caption (may also be used when resending videos by file_id), 0-1024 characters after entities parsing */
  caption?: string;
  /** Optional. Mode for parsing entities in the video caption. See formatting options for more details. */
  parse_mode?: string;
  /** Optional. A JSON-serialized list of special entities that appear in the caption, which can be specified instead of parse_mode */
  caption_entities?: Array<MessageEntity>;
  /** Optional. Pass True if the video needs to be covered with a spoiler animation */
  has_spoiler?: boolean;
  /** Optional. Pass True if the uploaded video is suitable for streaming */
  supports_streaming?: boolean;
  /** Optional. Sends the message silently. Users will receive a notification with no sound. */
  disable_notification?: boolean;
  /** Optional. Protects the contents of the sent message from forwarding and saving */
  protect_content?: boolean;
  /** Optional. Description of the message to reply to */
  reply_parameters?: ReplyParameters;
  /** Optional. Additional interface options. An object for an inline keyboard, custom reply keyboard, instructions to remove reply keyboard or to force a reply from the user. */
  reply_markup?:
    | InlineKeyboardMarkup
    | ReplyKeyboardMarkup
    | ReplyKeyboardRemove
    | ForceReply;
}

/**
 * Parameters for the sendAnimation method
 * @see https://core.telegram.org/bots/api#sendanimation
 */
export interface SendAnimationParams {
  /** Unique identifier for the target chat or username of the target channel (in the format @channelusername) */
  chat_id: Integer | string;
  /** Unique identifier for the target message thread (topic) of the forum; for forum supergroups only */
  message_thread_id?: Integer;
  /** Animation to send. Pass a file_id as String to send an animation that exists on the Telegram servers (recommended), pass an HTTP URL as a String for Telegram to get an animation from the Internet, or upload a new animation using multipart/form-data. */
  animation: InputFile | string;
  /** Optional. Duration of sent animation in seconds */
  duration?: Integer;
  /** Optional. Animation width */
  width?: Integer;
  /** Optional. Animation height */
  height?: Integer;
  /** Optional. Thumbnail of the file sent; can be ignored if thumbnail generation for the file is supported server-side. The thumbnail should be in JPEG format and less than 200 kB in size. A thumbnail's width and height should not exceed 320. Ignored if the file is not uploaded using multipart/form-data. Thumbnails can't be reused and can be only uploaded as a new file, so you can pass “attach://<file_attach_name>” if the thumbnail was uploaded using multipart/form-data under <file_attach_name>. */
  thumbnail?: InputFile;
  /** Optional. Animation caption (may also be used when resending animation by file_id), 0-1024 characters after entities parsing */
  caption?: string;
  /** Optional. Mode for parsing entities in the animation caption. See formatting options for more details. */
  parse_mode?: string;
  /** Optional. A JSON-serialized list of special entities that appear in the caption, which can be specified instead of parse_mode */
  caption_entities?: Array<MessageEntity>;
  /** Optional. Pass True if the animation needs to be covered with a spoiler animation */
  has_spoiler?: boolean;
  /** Optional. Sends the message silently. Users will receive a notification with no sound. */
  disable_notification?: boolean;
  /** Optional. Protects the contents of the sent message from forwarding and saving */
  protect_content?: boolean;
  /** Optional. Description of the message to reply to */
  reply_parameters?: ReplyParameters;
  /** Optional. Additional interface options. An object for an inline keyboard, custom reply keyboard, instructions to remove reply keyboard or to force a reply from the user. */
  reply_markup?:
    | InlineKeyboardMarkup
    | ReplyKeyboardMarkup
    | ReplyKeyboardRemove
    | ForceReply;
}

/**
 * Parameters for the sendVoice method
 * @see https://core.telegram.org/bots/api#sendvoice
 */
export interface SendVoiceParams {
  /** Unique identifier for the target chat or username of the target channel (in the format @channelusername) */
  chat_id: Integer | string;
  /** Unique identifier for the target message thread (topic) of the forum; for forum supergroups only */
  message_thread_id?: Integer;
  /** Audio file to send. Pass a file_id as String to send a file that exists on the Telegram servers (recommended), pass an HTTP URL as a String for Telegram to get a file from the Internet, or upload a new one using multipart/form-data. */
  voice: InputFile | string;
  /** Optional. Voice message caption, 0-1024 characters after entities parsing */
  caption?: string;
  /** Optional. Mode for parsing entities in the voice message caption. See formatting options for more details. */
  parse_mode?: string;
  /** Optional. A JSON-serialized list of special entities that appear in the caption, which can be specified instead of parse_mode */
  caption_entities?: Array<MessageEntity>;
  /** Optional. Duration of the voice message in seconds */
  duration?: Integer;
  /** Optional. Sends the message silently. Users will receive a notification with no sound. */
  disable_notification?: boolean;
  /** Optional. Protects the contents of the sent message from forwarding and saving */
  protect_content?: boolean;
  /** Optional. Description of the message to reply to */
  reply_parameters?: ReplyParameters;
  /** Optional. Additional interface options. An object for an inline keyboard, custom reply keyboard, instructions to remove reply keyboard or to force a reply from the user. */
  reply_markup?:
    | InlineKeyboardMarkup
    | ReplyKeyboardMarkup
    | ReplyKeyboardRemove
    | ForceReply;
}

/**
 * Parameters for the sendVideoNote method
 * @see https://core.telegram.org/bots/api#sendvideonote
 */
export interface SendVideoNoteParams {
  /** Unique identifier for the target chat or username of the target channel (in the format @channelusername) */
  chat_id: Integer | string;
  /** Unique identifier for the target message thread (topic) of the forum; for forum supergroups only */
  message_thread_id?: Integer;
  /** Video note to send. Pass a file_id as String to send a video note that exists on the Telegram servers (recommended) or upload a new video using multipart/form-data.. Sending video notes by a URL is currently unsupported */
  video_note: InputFile | string;
  /** Optional. Duration of sent video in seconds */
  duration?: Integer;
  /** Optional. Video width and height, i.e. diameter of the video message */
  length?: Integer;
  /** Optional. Thumbnail of the file sent; can be ignored if thumbnail generation for the file is supported server-side. The thumbnail should be in JPEG format and less than 200 kB in size. A thumbnail's width and height should not exceed 320. Ignored if the file is not uploaded using multipart/form-data. Thumbnails can't be reused and can be only uploaded as a new file, so you can pass “attach://<file_attach_name>” if the thumbnail was uploaded using multipart/form-data under <file_attach_name>. */
  thumbnail?: InputFile;
  /** Optional. Sends the message silently. Users will receive a notification with no sound. */
  disable_notification?: boolean;
  /** Optional. Protects the contents of the sent message from forwarding and saving */
  protect_content?: boolean;
  /** Optional. Description of the message to reply to */
  reply_parameters?: ReplyParameters;
  /** Optional. Additional interface options. An object for an inline keyboard, custom reply keyboard, instructions to remove reply keyboard or to force a reply from the user. */
  reply_markup?:
    | InlineKeyboardMarkup
    | ReplyKeyboardMarkup
    | ReplyKeyboardRemove
    | ForceReply;
}

/**
 * Parameters for the sendPaidMedia method
 * @see https://core.telegram.org/bots/api#sendpaidmedia
 */
export interface SendPaidMediaParams {
  /** Unique identifier for the target chat or username of the target channel (in the format @channelusername). If the chat is a channel, all Telegram Premium subscribers of the channel will be able to access the media. */
  chat_id: Integer | string;
  /** The number of Telegram Stars that must be paid to buy access to the media */
  star_count: Integer;
  /** A JSON-serialized array describing the media to be sent; up to 10 items */
  media: Array<InputPaidMediaUnion>;
  /** Optional. Media caption, 0-1024 characters after entities parsing */
  caption?: string;
  /** Optional. Mode for parsing entities in the media caption. See formatting options for more details. */
  parse_mode?: string;
  /** Optional. List of special entities that appear in the caption, which can be specified instead of parse_mode */
  caption_entities?: Array<MessageEntity>;
  /** Optional. Sends the message silently. Users will receive a notification with no sound. */
  disable_notification?: boolean;
  /** Optional. Protects the contents of the sent message from forwarding and saving */
  protect_content?: boolean;
  /** Optional. Description of the message to reply to */
  reply_parameters?: ReplyParameters;
  /** Optional. Additional interface options. A JSON-serialized object for an inline keyboard, custom reply keyboard, instructions to remove reply keyboard or to force a reply from the user. */
  reply_markup?:
    | InlineKeyboardMarkup
    | ReplyKeyboardMarkup
    | ReplyKeyboardRemove
    | ForceReply;
}

/**
 * Parameters for the sendMediaGroup method
 * @see https://core.telegram.org/bots/api#sendmediagroup
 */
export interface SendMediaGroupParams {
  /** Unique identifier for the target chat or username of the target channel (in the format @channelusername) */
  chat_id: Integer | string;
  /** Unique identifier for the target message thread (topic) of the forum; for forum supergroups only */
  message_thread_id?: Integer;
  /** A JSON-serialized array describing messages to be sent, must include 2-10 items */
  media: Array<
    InputMediaPhoto | InputMediaVideo | InputMediaAudio | InputMediaDocument
  >;
  /** Optional. Sends the messages silently. Users will receive a notification with no sound. */
  disable_notification?: boolean;
  /** Optional. Protects the contents of the sent messages from forwarding and saving */
  protect_content?: boolean;
  /** Optional. Description of the message to reply to */
  reply_parameters?: ReplyParameters;
}

/**
 * Parameters for the sendLocation method
 * @see https://core.telegram.org/bots/api#sendlocation
 */
export interface SendLocationParams {
  /** Unique identifier for the target chat or username of the target channel (in the format @channelusername) */
  chat_id: Integer | string;
  /** Unique identifier for the target message thread (topic) of the forum; for forum supergroups only */
  message_thread_id?: Integer;
  /** Latitude of the location */
  latitude: Float;
  /** Longitude of the location */
  longitude: Float;
  /** Optional. The radius of uncertainty for the location, measured in meters; 0-1500 */
  horizontal_accuracy?: Float;
  /** Optional. Period in seconds for which the location will be updated (see Live Locations, should be between 60 and 86400. */
  live_period?: Integer;
  /** Optional. For live locations, a direction in which the user is moving, in degrees. Must be between 1 and 360 if specified. */
  heading?: Integer;
  /** Optional. For live locations, a maximum distance for proximity alerts about approaching another chat member, in meters. Must be between 1 and 100000 if specified. */
  proximity_alert_radius?: Integer;
  /** Optional. Sends the message silently. Users will receive a notification with no sound. */
  disable_notification?: boolean;
  /** Optional. Protects the contents of the sent message from forwarding and saving */
  protect_content?: boolean;
  /** Optional. Description of the message to reply to */
  reply_parameters?: ReplyParameters;
  /** Optional. Additional interface options. An object for an inline keyboard, custom reply keyboard, instructions to remove reply keyboard or to force a reply from the user. */
  reply_markup?:
    | InlineKeyboardMarkup
    | ReplyKeyboardMarkup
    | ReplyKeyboardRemove
    | ForceReply;
}

/**
 * Parameters for the sendVenue method
 * @see https://core.telegram.org/bots/api#sendvenue
 */
export interface SendVenueParams {
  /** Unique identifier for the target chat or username of the target channel (in the format @channelusername) */
  chat_id: Integer | string;
  /** Unique identifier for the target message thread (topic) of the forum; for forum supergroups only */
  message_thread_id?: Integer;
  /** Latitude of the venue */
  latitude: Float;
  /** Longitude of the venue */
  longitude: Float;
  /** Name of the venue */
  title: string;
  /** Address of the venue */
  address: string;
  /** Optional. Foursquare identifier of the venue */
  foursquare_id?: string;
  /** Optional. Foursquare type of the venue, if known. (For example, “arts_entertainment/default”, “arts_entertainment/aquarium” or “food/icecream”.) */
  foursquare_type?: string;
  /** Optional. Google Places identifier of the venue */
  google_place_id?: string;
  /** Optional. Google Places type of the venue. (See supported types.) */
  google_place_type?: string;
  /** Optional. Sends the message silently. Users will receive a notification with no sound. */
  disable_notification?: boolean;
  /** Optional. Protects the contents of the sent message from forwarding and saving */
  protect_content?: boolean;
  /** Optional. Description of the message to reply to */
  reply_parameters?: ReplyParameters;
  /** Optional. Additional interface options. An object for an inline keyboard, custom reply keyboard, instructions to remove reply keyboard or to force a reply from the user. */
  reply_markup?:
    | InlineKeyboardMarkup
    | ReplyKeyboardMarkup
    | ReplyKeyboardRemove
    | ForceReply;
}

/**
 * Parameters for the sendContact method
 * @see https://core.telegram.org/bots/api#sendcontact
 */
export interface SendContactParams {
  /** Unique identifier for the target chat or username of the target channel (in the format @channelusername) */
  chat_id: Integer | string;
  /** Unique identifier for the target message thread (topic) of the forum; for forum supergroups only */
  message_thread_id?: Integer;
  /** Contact's phone number */
  phone_number: string;
  /** Contact's first name */
  first_name: string;
  /** Optional. Contact's last name */
  last_name?: string;
  /** Optional. Additional data about the contact in the form of a vCard, 0-2048 bytes */
  vcard?: string;
  /** Optional. Sends the message silently. Users will receive a notification with no sound. */
  disable_notification?: boolean;
  /** Optional. Protects the contents of the sent message from forwarding and saving */
  protect_content?: boolean;
  /** Optional. Description of the message to reply to */
  reply_parameters?: ReplyParameters;
  /** Optional. Additional interface options. An object for an inline keyboard, custom reply keyboard, instructions to remove reply keyboard or to force a reply from the user. */
  reply_markup?:
    | InlineKeyboardMarkup
    | ReplyKeyboardMarkup
    | ReplyKeyboardRemove
    | ForceReply;
}

/**
 * Parameters for the sendPoll method
 * @see https://core.telegram.org/bots/api#sendpoll
 */
export interface SendPollParams {
  /** Unique identifier for the target chat or username of the target channel (in the format @channelusername) */
  chat_id: Integer | string;
  /** Unique identifier for the target message thread (topic) of the forum; for forum supergroups only */
  message_thread_id?: Integer;
  /** Poll question, 1-300 characters */
  question: string;
  /** A JSON-serialized list of answer options, 2-10 strings 1-100 characters each */
  options: Array<InputPollOption>;
  /** Optional. True, if the poll needs to be anonymous, defaults to True */
  is_anonymous?: boolean;
  /** Optional. Poll type, “quiz” or “regular”, defaults to “regular” */
  type?: string;
  /** Optional. True, if the poll allows multiple answers, ignored for polls in quiz mode, defaults to False */
  allows_multiple_answers?: boolean;
  /** Optional. 0-based identifier of the correct answer option, required for polls in quiz mode */
  correct_option_id?: Integer;
  /** Optional. Text that is shown when a user chooses an incorrect answer or taps on the lamp icon in a quiz-style poll, 0-200 characters with at most 2 line feeds after entities parsing */
  explanation?: string;
  /** Optional. Mode for parsing entities in the explanation. See formatting options for more details. */
  explanation_parse_mode?: string;
  /** Optional. A JSON-serialized list of special entities that appear in the poll explanation, which can be specified instead of parse_mode */
  explanation_entities?: Array<MessageEntity>;
  /** Optional. Amount of time in seconds the poll will be active after creation, 5-600. Can't be used together with close_date. */
  open_period?: Integer;
  /** Optional. Point in time (Unix timestamp) when the poll will be automatically closed. Must be at least 5 and no more than 600 seconds in the future. Can't be used together with open_period. */
  close_date?: Integer;
  /** Optional. Pass True if the poll needs to be immediately closed. This can be useful for poll preview. */
  is_closed?: boolean;
  /** Optional. Sends the message silently. Users will receive a notification with no sound. */
  disable_notification?: boolean;
  /** Optional. Protects the contents of the sent message from forwarding and saving */
  protect_content?: boolean;
  /** Optional. Description of the message to reply to */
  reply_parameters?: ReplyParameters;
  /** Optional. Additional interface options. An object for an inline keyboard, custom reply keyboard, instructions to remove reply keyboard or to force a reply from the user. */
  reply_markup?:
    | InlineKeyboardMarkup
    | ReplyKeyboardMarkup
    | ReplyKeyboardRemove
    | ForceReply;
}

/**
 * Parameters for the sendChecklist method
 * @see https://core.telegram.org/bots/api#sendchecklist
 */
export interface SendChecklistParams {
  /** Unique identifier for the target chat or username of the target channel (in the format @channelusername) */
  chat_id: Integer | string;
  /** Unique identifier for the target message thread (topic) of the forum; for forum supergroups only */
  message_thread_id?: Integer;
  /** A JSON-serialized list of tasks in the checklist */
  tasks: Array<InputChecklistTask>;
  /** Optional. Sends the message silently. Users will receive a notification with no sound. */
  disable_notification?: boolean;
  /** Optional. Protects the contents of the sent message from forwarding and saving */
  protect_content?: boolean;
  /** Optional. Description of the message to reply to */
  reply_parameters?: ReplyParameters;
  /** Optional. Additional interface options. An object for an inline keyboard, custom reply keyboard, instructions to remove reply keyboard or to force a reply from the user. */
  reply_markup?:
    | InlineKeyboardMarkup
    | ReplyKeyboardMarkup
    | ReplyKeyboardRemove
    | ForceReply;
}

/**
 * Parameters for the sendDice method
 * @see https://core.telegram.org/bots/api#senddice
 */
export interface SendDiceParams {
  /** Unique identifier for the target chat or username of the target channel (in the format @channelusername) */
  chat_id: Integer | string;
  /** Unique identifier for the target message thread (topic) of the forum; for forum supergroups only */
  message_thread_id?: Integer;
  /** Optional. Emoji on which the dice throw animation is based. Currently, must be one of “🎲”, “🎯”, “🏀”, “⚽”, “🎳”, or “🎰”. Dice can have values 1-6 for “🎲”, “🎯” and “🎳”, values 1-5 for “🏀” and “⚽”, and values 1-64 for “🎰”. Defaults to “🎲” */
  emoji?: string;
  /** Optional. Sends the message silently. Users will receive a notification with no sound. */
  disable_notification?: boolean;
  /** Optional. Protects the contents of the sent message from forwarding and saving */
  protect_content?: boolean;
  /** Optional. Description of the message to reply to */
  reply_parameters?: ReplyParameters;
  /** Optional. Additional interface options. An object for an inline keyboard, custom reply keyboard, instructions to remove reply keyboard or to force a reply from the user. */
  reply_markup?:
    | InlineKeyboardMarkup
    | ReplyKeyboardMarkup
    | ReplyKeyboardRemove
    | ForceReply;
}

/**
 * Parameters for the sendChatAction method
 * @see https://core.telegram.org/bots/api#sendchataction
 */
export interface SendChatActionParams {
  /** Unique identifier for the target chat or username of the target channel (in the format @channelusername) */
  chat_id: Integer | string;
  /** Unique identifier for the target message thread (topic) of the forum; for forum supergroups only */
  message_thread_id?: Integer;
  /** Type of action to broadcast. Choose one, depending on what the user is about to receive: typing for text messages, upload_photo for photos, record_video or upload_video for videos, record_voice or upload_voice for voice notes, upload_document for general files, choose_sticker for stickers, find_location for location data, record_video_note or upload_video_note for video notes. */
  action: string;
}

/**
 * Parameters for the setMessageReaction method
 * @see https://core.telegram.org/bots/api#setmessagereaction
 */
export interface SetMessageReactionParams {
  /** Unique identifier for the target chat or username of the target channel (in the format @channelusername) */
  chat_id: Integer | string;
  /** Identifier of the target message */
  message_id: Integer;
  /** Optional. New list of reaction types to set on the message. Currently, as non-premium users, bots can set up to one reaction per message. A custom emoji reaction can be used if it is either already present on the message or explicitly allowed by chat administrators. */
  reaction?: Array<ReactionType>;
  /** Optional. Pass True to set the reaction with a big animation */
  is_big?: boolean;
}

/**
 * Parameters for the getUserProfilePhotos method
 * @see https://core.telegram.org/bots/api#getuserprofilephotos
 */
export interface GetUserProfilePhotosParams {
  /** Unique identifier of the target user */
  user_id: Integer;
  /** Optional. Sequential number of the first photo to be returned. By default, all photos are returned. */
  offset?: Integer;
  /** Optional. Limits the number of photos to be retrieved. Values between 1-100 are accepted. Defaults to 100. */
  limit?: Integer;
}

/**
 * Parameters for the setUserEmojiStatus method
 * @see https://core.telegram.org/bots/api#setuseremojistatus
 */
export interface SetUserEmojiStatusParams {
  /** Unique identifier of the target user */
  user_id: Integer;
  /** Optional. Custom emoji identifier of the emoji status to set. Use getEmojiStatuses to get a list of available emoji status identifiers. Pass an empty string to remove the status. */
  emoji_status_custom_emoji_id?: string;
  /** Optional. Expiration date of the emoji status, if any */
  emoji_status_expiration_date?: Integer;
}

/**
 * Parameters for the getFile method
 * @see https://core.telegram.org/bots/api#getfile
 */
export interface GetFileParams {
  /** File identifier to get information about */
  file_id: string;
}

/**
 * Parameters for the banChatMember method
 * @see https://core.telegram.org/bots/api#banchatmember
 */
export interface BanChatMemberParams {
  /** Unique identifier for the target group or username of the target supergroup or channel (in the format @channelusername) */
  chat_id: Integer | string;
  /** Unique identifier of the target user */
  user_id: Integer;
  /** Optional. Date when the user will be unbanned, Unix time. If user is banned for more than 366 days or less than 30 seconds from the current time they are considered to be banned forever. Applied for supergroups and channels only. */
  until_date?: Integer;
  /** Optional. Pass True to delete all messages from the chat for the user that is being removed. If False, the user will be banned from the chat and messages from the user will not be automatically deleted. */
  revoke_messages?: boolean;
}

/**
 * Parameters for the unbanChatMember method
 * @see https://core.telegram.org/bots/api#unbanchatmember
 */
export interface UnbanChatMemberParams {
  /** Unique identifier for the target group or username of the target supergroup or channel (in the format @channelusername) */
  chat_id: Integer | string;
  /** Unique identifier of the target user */
  user_id: Integer;
  /** Optional. Do nothing if the user is not banned */
  only_if_banned?: boolean;
}

/**
 * Parameters for the restrictChatMember method
 * @see https://core.telegram.org/bots/api#restrictchatmember
 */
export interface RestrictChatMemberParams {
  /** Unique identifier for the target chat or username of the target supergroup (in the format @supergroupusername) */
  chat_id: Integer | string;
  /** Unique identifier of the target user */
  user_id: Integer;
  /** Date when restrictions will be lifted for the user, Unix time. If user is restricted for more than 366 days or less than 30 seconds from the current time, they are considered to be restricted forever */
  until_date?: Integer;
  /** Permissions of the chat member */
  permissions: ChatPermissions;
  /** Optional. Pass True if chat permissions are set independently. Otherwise, the can_send_other_messages and can_add_web_page_previews permissions will imply the can_send_messages, can_send_audios, can_send_documents, can_send_photos, can_send_videos, can_send_video_notes, and can_send_voice_notes permissions; the can_send_polls permission will imply the can_send_messages permission. */
  use_independent_chat_permissions?: boolean;
}

/**
 * Parameters for the promoteChatMember method
 * @see https://core.telegram.org/bots/api#promotechatmember
 */
export interface PromoteChatMemberParams {
  /** Unique identifier for the target chat or username of the target channel (in the format @channelusername) */
  chat_id: Integer | string;
  /** Unique identifier of the target user */
  user_id: Integer;
  /** Optional. Pass True if the administrator's presence in the chat is hidden */
  is_anonymous?: boolean;
  /** Optional. Pass True if the administrator can access the chat event log, get boost list, see hidden supergroup and channel members, report spam messages and ignore slow mode. Implied by any other administrator privilege */
  can_manage_chat?: boolean;
  /** Optional. Pass True if the administrator can delete messages of other users */
  can_delete_messages?: boolean;
  /** Optional. Pass True if the administrator can manage video chats */
  can_manage_video_chats?: boolean;
  /** Optional. Pass True if the administrator can restrict, ban or unban chat members, or access supergroup statistics */
  can_restrict_members?: boolean;
  /** Optional. Pass True if the administrator can add new administrators with a subset of their own privileges or demote administrators that he has promoted, directly or indirectly (promoted by administrators that were appointed by him) */
  can_promote_members?: boolean;
  /** Optional. Pass True if the administrator can change the chat title, photo and other settings */
  can_change_info?: boolean;
  /** Optional. Pass True if the administrator can invite new users to the chat */
  can_invite_users?: boolean;
  /** Optional. Pass True if the administrator can post messages in the channel, or access channel statistics; channels only */
  can_post_messages?: boolean;
  /** Optional. Pass True if the administrator can edit messages of other users and can pin messages; channels only */
  can_edit_messages?: boolean;
  /** Optional. Pass True if the administrator can pin messages, supergroups only */
  can_pin_messages?: boolean;
  /** Optional. Pass True if the administrator can post stories in the channel; channels only */
  can_post_stories?: boolean;
  /** Optional. Pass True if the administrator can edit stories posted by other users; channels only */
  can_edit_stories?: boolean;
  /** Optional. Pass True if the administrator can delete stories posted by other users; channels only */
  can_delete_stories?: boolean;
  /** Optional. Pass True if the user is allowed to create, rename, close, and reopen forum topics; supergroups only */
  can_manage_topics?: boolean;
}

/**
 * Parameters for the setChatAdministratorCustomTitle method
 * @see https://core.telegram.org/bots/api#setchatadministratorcustomtitle
 */
export interface SetChatAdministratorCustomTitleParams {
  /** Unique identifier for the target chat or username of the target supergroup (in the format @supergroupusername) */
  chat_id: Integer | string;
  /** Unique identifier of the target user */
  user_id: Integer;
  /** New custom title for the administrator; 0-16 characters, emoji are not allowed */
  custom_title: string;
}

/**
 * Parameters for the banChatSenderChat method
 * @see https://core.telegram.org/bots/api#banchatsenderchat
 */
export interface BanChatSenderChatParams {
  /** Unique identifier for the target chat or username of the target channel (in the format @channelusername) */
  chat_id: Integer | string;
  /** Unique identifier of the target sender chat */
  sender_chat_id: Integer;
}

/**
 * Parameters for the unbanChatSenderChat method
 * @see https://core.telegram.org/bots/api#unbanchatsenderchat
 */
export interface UnbanChatSenderChatParams {
  /** Unique identifier for the target chat or username of the target channel (in the format @channelusername) */
  chat_id: Integer | string;
  /** Unique identifier of the target sender chat */
  sender_chat_id: Integer;
}

/**
 * Parameters for the setChatPermissions method
 * @see https://core.telegram.org/bots/api#setchatpermissions
 */
export interface SetChatPermissionsParams {
  /** Unique identifier for the target chat or username of the target supergroup (in the format @supergroupusername) */
  chat_id: Integer | string;
  /** New default chat permissions */
  permissions: ChatPermissions;
  /** Optional. Pass True if chat permissions are set independently. Otherwise, the can_send_other_messages and can_add_web_page_previews permissions will imply the can_send_messages, can_send_audios, can_send_documents, can_send_photos, can_send_videos, can_send_video_notes, and can_send_voice_notes permissions; the can_send_polls permission will imply the can_send_messages permission. */
  use_independent_chat_permissions?: boolean;
}

/**
 * Parameters for the exportChatInviteLink method
 * @see https://core.telegram.org/bots/api#exportchatinvitelink
 */
export interface ExportChatInviteLinkParams {
  /** Unique identifier for the target chat or username of the target channel (in the format @channelusername) */
  chat_id: Integer | string;
}

/**
 * Parameters for the createChatInviteLink method
 * @see https://core.telegram.org/bots/api#createchatinvitelink
 */
export interface CreateChatInviteLinkParams {
  /** Unique identifier for the target chat or username of the target channel (in the format @channelusername) */
  chat_id: Integer | string;
  /** Optional. Invite link name; 0-32 characters */
  name?: string;
  /** Optional. Point in time (Unix timestamp) when the link will expire */
  expire_date?: Integer;
  /** Optional. The maximum number of users that can be members of the chat simultaneously after joining the chat via this invite link; 1-99999 */
  member_limit?: Integer;
  /** Optional. True, if users joining the chat via the link need to be approved by chat administrators. If True, member_limit can't be specified */
  creates_join_request?: boolean;
}

/**
 * Parameters for the editChatInviteLink method
 * @see https://core.telegram.org/bots/api#editchatinvitelink
 */
export interface EditChatInviteLinkParams {
  /** Unique identifier for the target chat or username of the target channel (in the format @channelusername) */
  chat_id: Integer | string;
  /** The invite link to edit */
  invite_link: string;
  /** Optional. Invite link name; 0-32 characters */
  name?: string;
  /** Optional. Point in time (Unix timestamp) when the link will expire */
  expire_date?: Integer;
  /** Optional. The maximum number of users that can be members of the chat simultaneously after joining the chat via this invite link; 1-99999 */
  member_limit?: Integer;
  /** Optional. True, if users joining the chat via the link need to be approved by chat administrators. If True, member_limit can't be specified */
  creates_join_request?: boolean;
}

/**
 * Parameters for the createChatSubscriptionInviteLink method
 * @see https://core.telegram.org/bots/api#createchatsubscriptioninvitelink
 */
export interface CreateChatSubscriptionInviteLinkParams {
  /** Unique identifier for the target chat or username of the target channel (in the format @channelusername) */
  chat_id: Integer | string;
  /** Invite link name; 0-32 characters */
  name: string;
  /** The number of seconds the subscription will be active for before the next payment. Currently, it must always be 2592000 (30 days) */
  subscription_period: Integer;
  /** The amount of Telegram Stars a user must pay initially and after each subsequent subscription period to remain in the chat; 1-2500 */
  subscription_price: Integer;
}

/**
 * Parameters for the editChatSubscriptionInviteLink method
 * @see https://core.telegram.org/bots/api#editchatsubscriptioninvitelink
 */
export interface EditChatSubscriptionInviteLinkParams {
  /** Unique identifier for the target chat or username of the target channel (in the format @channelusername) */
  chat_id: Integer | string;
  /** The invite link to edit */
  invite_link: string;
  /** Optional. Invite link name; 0-32 characters */
  name?: string;
}

/**
 * Parameters for the revokeChatInviteLink method
 * @see https://core.telegram.org/bots/api#revokechatinvitelink
 */
export interface RevokeChatInviteLinkParams {
  /** Unique identifier for the target chat or username of the target channel (in the format @channelusername) */
  chat_id: Integer | string;
  /** The invite link to revoke */
  invite_link: string;
}

/**
 * Parameters for the approveChatJoinRequest method
 * @see https://core.telegram.org/bots/api#approvechatjoinrequest
 */
export interface ApproveChatJoinRequestParams {
  /** Unique identifier for the target chat or username of the target channel (in the format @channelusername) */
  chat_id: Integer | string;
  /** Unique identifier of the target user */
  user_id: Integer;
}

/**
 * Parameters for the declineChatJoinRequest method
 * @see https://core.telegram.org/bots/api#declinechatjoinrequest
 */
export interface DeclineChatJoinRequestParams {
  /** Unique identifier for the target chat or username of the target channel (in the format @channelusername) */
  chat_id: Integer | string;
  /** Unique identifier of the target user */
  user_id: Integer;
}

/**
 * Parameters for the setChatPhoto method
 * @see https://core.telegram.org/bots/api#setchatphoto
 */
export interface SetChatPhotoParams {
  /** Unique identifier for the target chat or username of the target channel (in the format @channelusername) */
  chat_id: Integer | string;
  /** New chat photo, uploaded using multipart/form-data */
  photo: InputFile;
}

/**
 * Parameters for the deleteChatPhoto method
 * @see https://core.telegram.org/bots/api#deletechatphoto
 */
export interface DeleteChatPhotoParams {
  /** Unique identifier for the target chat or username of the target channel (in the format @channelusername) */
  chat_id: Integer | string;
}

/**
 * Parameters for the setChatTitle method
 * @see https://core.telegram.org/bots/api#setchattitle
 */
export interface SetChatTitleParams {
  /** Unique identifier for the target chat or username of the target channel (in the format @channelusername) */
  chat_id: Integer | string;
  /** New chat title, 1-255 characters */
  title: string;
}

/**
 * Parameters for the setChatDescription method
 * @see https://core.telegram.org/bots/api#setchatdescription
 */
export interface SetChatDescriptionParams {
  /** Unique identifier for the target chat or username of the target channel (in the format @channelusername) */
  chat_id: Integer | string;
  /** New chat description, 0-255 characters */
  description?: string;
}

/**
 * Parameters for the pinChatMessage method
 * @see https://core.telegram.org/bots/api#pinchatmessage
 */
export interface PinChatMessageParams {
  /** Unique identifier for the target chat or username of the target channel (in the format @channelusername) */
  chat_id: Integer | string;
  /** Identifier of a message to pin */
  message_id: Integer;
  /** Optional. Pass True if it's not necessary to send a notification to all chat members about the new pinned message. Notifications are always disabled in channels and private chats. */
  disable_notification?: boolean;
}

/**
 * Parameters for the unpinChatMessage method
 * @see https://core.telegram.org/bots/api#unpinchatmessage
 */
export interface UnpinChatMessageParams {
  /** Unique identifier for the target chat or username of the target channel (in the format @channelusername) */
  chat_id: Integer | string;
  /** Optional. Identifier of a message to unpin. If not specified, the most recent pinned message (by sending date) will be unpinned. */
  message_id?: Integer;
}

/**
 * Parameters for the unpinAllChatMessages method
 * @see https://core.telegram.org/bots/api#unpinallchatmessages
 */
export interface UnpinAllChatMessagesParams {
  /** Unique identifier for the target chat or username of the target channel (in the format @channelusername) */
  chat_id: Integer | string;
}

/**
 * Parameters for the leaveChat method
 * @see https://core.telegram.org/bots/api#leavechat
 */
export interface LeaveChatParams {
  /** Unique identifier for the target chat or username of the target channel (in the format @channelusername) */
  chat_id: Integer | string;
}

/**
 * Parameters for the getChat method
 * @see https://core.telegram.org/bots/api#getchat
 */
export interface GetChatParams {
  /** Unique identifier for the target chat or username of the target channel (in the format @channelusername) */
  chat_id: Integer | string;
}

/**
 * Parameters for the getChatAdministrators method
 * @see https://core.telegram.org/bots/api#getchatadministrators
 */
export interface GetChatAdministratorsParams {
  /** Unique identifier for the target chat or username of the target channel (in the format @channelusername) */
  chat_id: Integer | string;
}

/**
 * Parameters for the getChatMemberCount method
 * @see https://core.telegram.org/bots/api#getchatmembercount
 */
export interface GetChatMemberCountParams {
  /** Unique identifier for the target chat or username of the target channel (in the format @channelusername) */
  chat_id: Integer | string;
}

/**
 * Parameters for the getChatMember method
 * @see https://core.telegram.org/bots/api#getchatmember
 */
export interface GetChatMemberParams {
  /** Unique identifier for the target chat or username of the target channel (in the format @channelusername) */
  chat_id: Integer | string;
  /** Unique identifier of the target user */
  user_id: Integer;
}

/**
 * Parameters for the setChatStickerSet method
 * @see https://core.telegram.org/bots/api#setchatstickerset
 */
export interface SetChatStickerSetParams {
  /** Unique identifier for the target chat or username of the target supergroup (in the format @supergroupusername) */
  chat_id: Integer | string;
  /** Name of the sticker set to be set as the group sticker set */
  sticker_set_name: string;
}

/**
 * Parameters for the deleteChatStickerSet method
 * @see https://core.telegram.org/bots/api#deletechatstickerset
 */
export interface DeleteChatStickerSetParams {
  /** Unique identifier for the target chat or username of the target supergroup (in the format @supergroupusername) */
  chat_id: Integer | string;
}

/**
 * Parameters for the getForumTopicIconStickers method
 * @see https://core.telegram.org/bots/api#getforumtopiciconstickers
 */
export interface GetForumTopicIconStickersParams {}

/**
 * Parameters for the createForumTopic method
 * @see https://core.telegram.org/bots/api#createforumtopic
 */
export interface CreateForumTopicParams {
  /** Unique identifier for the target chat or username of the target supergroup (in the format @supergroupusername) */
  chat_id: Integer | string;
  /** Topic name, 1-128 characters */
  name: string;
  /** Optional. Color of the topic icon in RGB format. Currently, must be one of 7322096 (0x6FB9F0), 16766590 (0xFFD67E), 13338331 (0xCB86DB), 9367192 (0x8EEE98), 16749490 (0xFF93B2), or 16478047 (0xFB6F5F) */
  icon_color?: Integer;
  /** Optional. Unique identifier of the custom emoji shown as the topic icon. Use getForumTopicIconStickers to get all allowed custom emoji identifiers. */
  icon_custom_emoji_id?: string;
}

/**
 * Parameters for the editForumTopic method
 * @see https://core.telegram.org/bots/api#editforumtopic
 */
export interface EditForumTopicParams {
  /** Unique identifier for the target chat or username of the target supergroup (in the format @supergroupusername) */
  chat_id: Integer | string;
  /** Unique identifier for the target message thread of the forum topic */
  message_thread_id: Integer;
  /** Optional. New topic name, 0-128 characters. If not specified or empty, the current name is kept */
  name?: string;
  /** Optional. New unique identifier of the custom emoji shown as the topic icon. Use getForumTopicIconStickers to get all allowed custom emoji identifiers. Pass an empty string to remove the icon. If not specified, the current icon is kept */
  icon_custom_emoji_id?: string;
}

/**
 * Parameters for the closeForumTopic method
 * @see https://core.telegram.org/bots/api#closeforumtopic
 */
export interface CloseForumTopicParams {
  /** Unique identifier for the target chat or username of the target supergroup (in the format @supergroupusername) */
  chat_id: Integer | string;
  /** Unique identifier for the target message thread of the forum topic */
  message_thread_id: Integer;
}

/**
 * Parameters for the reopenForumTopic method
 * @see https://core.telegram.org/bots/api#reopenforumtopic
 */
export interface ReopenForumTopicParams {
  /** Unique identifier for the target chat or username of the target supergroup (in the format @supergroupusername) */
  chat_id: Integer | string;
  /** Unique identifier for the target message thread of the forum topic */
  message_thread_id: Integer;
}

/**
 * Parameters for the deleteForumTopic method
 * @see https://core.telegram.org/bots/api#deleteforumtopic
 */
export interface DeleteForumTopicParams {
  /** Unique identifier for the target chat or username of the target supergroup (in the format @supergroupusername) */
  chat_id: Integer | string;
  /** Unique identifier for the target message thread of the forum topic */
  message_thread_id: Integer;
}

/**
 * Parameters for the unpinAllForumTopicMessages method
 * @see https://core.telegram.org/bots/api#unpinallforumtopicmessages
 */
export interface UnpinAllForumTopicMessagesParams {
  /** Unique identifier for the target chat or username of the target supergroup (in the format @supergroupusername) */
  chat_id: Integer | string;
  /** Unique identifier for the target message thread of the forum topic */
  message_thread_id: Integer;
}

/**
 * Parameters for the editGeneralForumTopic method
 * @see https://core.telegram.org/bots/api#editgeneralforumtopic
 */
export interface EditGeneralForumTopicParams {
  /** Unique identifier for the target chat or username of the target supergroup (in the format @supergroupusername) */
  chat_id: Integer | string;
  /** New topic name, 1-128 characters */
  name: string;
}

/**
 * Parameters for the closeGeneralForumTopic method
 * @see https://core.telegram.org/bots/api#closegeneralforumtopic
 */
export interface CloseGeneralForumTopicParams {
  /** Unique identifier for the target chat or username of the target supergroup (in the format @supergroupusername) */
  chat_id: Integer | string;
}

/**
 * Parameters for the reopenGeneralForumTopic method
 * @see https://core.telegram.org/bots/api#reopengeneralforumtopic
 */
export interface ReopenGeneralForumTopicParams {
  /** Unique identifier for the target chat or username of the target supergroup (in the format @supergroupusername) */
  chat_id: Integer | string;
}

/**
 * Parameters for the hideGeneralForumTopic method
 * @see https://core.telegram.org/bots/api#hidegeneralforumtopic
 */
export interface HideGeneralForumTopicParams {
  /** Unique identifier for the target chat or username of the target supergroup (in the format @supergroupusername) */
  chat_id: Integer | string;
}

/**
 * Parameters for the unhideGeneralForumTopic method
 * @see https://core.telegram.org/bots/api#unhidegeneralforumtopic
 */
export interface UnhideGeneralForumTopicParams {
  /** Unique identifier for the target chat or username of the target supergroup (in the format @supergroupusername) */
  chat_id: Integer | string;
}

/**
 * Parameters for the unpinAllGeneralForumTopicMessages method
 * @see https://core.telegram.org/bots/api#unpinallgeneralforumtopicmessages
 */
export interface UnpinAllGeneralForumTopicMessagesParams {
  /** Unique identifier for the target chat or username of the target supergroup (in the format @supergroupusername) */
  chat_id: Integer | string;
}

/**
 * Parameters for the answerCallbackQuery method
 * @see https://core.telegram.org/bots/api#answercallbackquery
 */
export interface AnswerCallbackQueryParams {
  /** Unique identifier for the query to be answered */
  callback_query_id: string;
  /** Optional. Text of the notification. If not specified, nothing will be shown to the user, 0-200 characters */
  text?: string;
  /** Optional. If True, an alert will be shown by the client instead of a notification at the top of the chat screen. Defaults to false. */
  show_alert?: boolean;
  /** Optional. URL that will be opened by the user's client. If you have created a Game and accepted the conditions via @BotFather, specify the URL that opens your game - note that this will only work if the query comes from a callback_game button. */
  url?: string;
  /** Optional. The maximum amount of time in seconds that the result of the callback query may be cached client-side. Telegram apps will support caching starting in version 3.14. Defaults to 0. */
  cache_time?: Integer;
}

/**
 * Parameters for the getUserChatBoosts method
 * @see https://core.telegram.org/bots/api#getuserchatboosts
 */
export interface GetUserChatBoostsParams {
  /** Unique identifier for the chat or username of the channel (in the format @channelusername) */
  chat_id: Integer | string;
  /** Unique identifier of the target user */
  user_id: Integer;
}

/**
 * Parameters for the getBusinessConnection method
 * @see https://core.telegram.org/bots/api#getbusinessconnection
 */
export interface GetBusinessConnectionParams {
  /** Unique identifier of the business connection */
  business_connection_id: string;
}

/**
 * Parameters for the setMyCommands method
 * @see https://core.telegram.org/bots/api#setmycommands
 */
export interface SetMyCommandsParams {
  /** A JSON-serialized list of bot commands to be set as the list of the bot's commands. At most 100 commands can be specified. */
  commands: Array<BotCommand>;
  /** Optional. A JSON-serialized object, describing scope of users for which the commands are relevant. Defaults to BotCommandScopeDefault. */
  scope?: BotCommandScope;
  /** Optional. A two-letter ISO 639-1 language code. If empty, commands will be applied to all users from the given scope, for whose language there are no dedicated commands */
  language_code?: string;
}

/**
 * Parameters for the deleteMyCommands method
 * @see https://core.telegram.org/bots/api#deletemycommands
 */
export interface DeleteMyCommandsParams {
  /** Optional. A JSON-serialized object, describing scope of users for which the commands are relevant. Defaults to BotCommandScopeDefault. */
  scope?: BotCommandScope;
  /** Optional. A two-letter ISO 639-1 language code. If empty, commands will be applied to all users from the given scope, for whose language there are no dedicated commands */
  language_code?: string;
}

/**
 * Parameters for the getMyCommands method
 * @see https://core.telegram.org/bots/api#getmycommands
 */
export interface GetMyCommandsParams {
  /** Optional. A JSON-serialized object, describing scope of users. Defaults to BotCommandScopeDefault. */
  scope?: BotCommandScope;
  /** Optional. A two-letter ISO 639-1 language code or an empty string */
  language_code?: string;
}

/**
 * Parameters for the setMyName method
 * @see https://core.telegram.org/bots/api#setmyname
 */
export interface SetMyNameParams {
  /** Optional. New bot name; 0-64 characters. Pass an empty string to remove the dedicated name for the given language. */
  name?: string;
  /** Optional. A two-letter ISO 639-1 language code. If empty, the name will be shown to all users for whose language there is no dedicated name. */
  language_code?: string;
}

/**
 * Parameters for the getMyName method
 * @see https://core.telegram.org/bots/api#getmyname
 */
export interface GetMyNameParams {
  /** Optional. A two-letter ISO 639-1 language code or an empty string */
  language_code?: string;
}

/**
 * Parameters for the setMyDescription method
 * @see https://core.telegram.org/bots/api#setmydescription
 */
export interface SetMyDescriptionParams {
  /** Optional. New bot description; 0-512 characters. Pass an empty string to remove the dedicated description for the given language. */
  description?: string;
  /** Optional. A two-letter ISO 639-1 language code. If empty, the description will be applied to all users for whose language there is no dedicated description. */
  language_code?: string;
}

/**
 * Parameters for the getMyDescription method
 * @see https://core.telegram.org/bots/api#getmydescription
 */
export interface GetMyDescriptionParams {
  /** Optional. A two-letter ISO 639-1 language code or an empty string */
  language_code?: string;
}

/**
 * Parameters for the setMyShortDescription method
 * @see https://core.telegram.org/bots/api#setmyshortdescription
 */
export interface SetMyShortDescriptionParams {
  /** Optional. New short description for the bot; 0-120 characters. Pass an empty string to remove the dedicated short description for the given language. */
  short_description?: string;
  /** Optional. A two-letter ISO 639-1 language code. If empty, the short description will be applied to all users for whose language there is no dedicated short description. */
  language_code?: string;
}

/**
 * Parameters for the getMyShortDescription method
 * @see https://core.telegram.org/bots/api#getmyshortdescription
 */
export interface GetMyShortDescriptionParams {
  /** Optional. A two-letter ISO 639-1 language code or an empty string */
  language_code?: string;
}

/**
 * Parameters for the setChatMenuButton method
 * @see https://core.telegram.org/bots/api#setchatmenubutton
 */
export interface SetChatMenuButtonParams {
  /** Optional. Unique identifier for the target private chat. If not specified, default bot's menu button will be changed */
  chat_id?: Integer;
  /** Optional. A JSON-serialized object for the bot's new menu button. Defaults to MenuButtonDefault */
  menu_button?: MenuButton;
}

/**
 * Parameters for the getChatMenuButton method
 * @see https://core.telegram.org/bots/api#getchatmenubutton
 */
export interface GetChatMenuButtonParams {
  /** Optional. Unique identifier for the target private chat. If not specified, default bot's menu button will be returned */
  chat_id?: Integer;
}

/**
 * Parameters for the setMyDefaultAdministratorRights method
 * @see https://core.telegram.org/bots/api#setmydefaultadministratorrights
 */
export interface SetMyDefaultAdministratorRightsParams {
  /** Optional. A JSON-serialized object describing new default administrator rights. If not specified, the default administrator rights will be cleared. */
  rights?: ChatAdministratorRights;
  /** Optional. Pass True to change the default administrator rights of the bot in channels. Otherwise, the default administrator rights of the bot for groups and supergroups will be changed. */
  for_channels?: boolean;
}

/**
 * Parameters for the getMyDefaultAdministratorRights method
 * @see https://core.telegram.org/bots/api#getmydefaultadministratorrights
 */
export interface GetMyDefaultAdministratorRightsParams {
  /** Optional. Pass True to get default administrator rights of the bot in channels. Otherwise, default administrator rights of the bot for groups and supergroups will be returned. */
  for_channels?: boolean;
}

/**
 * Parameters for the getAvailableGifts method
 * @see https://core.telegram.org/bots/api#getavailablegifts
 */
export interface GetAvailableGiftsParams {}

/**
 * Parameters for the sendGift method
 * @see https://core.telegram.org/bots/api#sendgift
 */
export interface SendGiftParams {
  /** Unique identifier of the target user that will receive the gift */
  user_id: Integer;
  /** Identifier of the gift to send */
  gift_id: string;
  /** Optional. Text that will be shown along with the gift; 0-30 characters */
  text?: string;
  /** Optional. Mode for parsing entities in the text. See formatting options for more details. Can be used only by bots paid as Telegram Premium. */
  text_parse_mode?: string;
  /** Optional. A JSON-serialized list of special entities that appear in the gift text. Can be used instead of text_parse_mode. Can be used only by bots paid as Telegram Premium. */
  text_entities?: Array<MessageEntity>;
}

/**
 * Parameters for the giftPremiumSubscription method
 * @see https://core.telegram.org/bots/api#giftpremiumsubscription
 */
export interface GiftPremiumSubscriptionParams {
  /** Unique identifier of the target user that will receive the gift */
  user_id: Integer;
  /** Optional. Number of months of Telegram Premium subscription to gift. Must be between 1 and 12. Defaults to 1. */
  months?: Integer;
}

/**
 * Parameters for the verifyUser method
 * @see https://core.telegram.org/bots/api#verifyuser
 */
export interface VerifyUserParams {
  /** Unique identifier of the target user */
  user_id: Integer;
  /** Optional. Expiration time of the verification. If not specified, the verification will be valid for 1 year. */
  expiration_date?: Integer;
}

/**
 * Parameters for the verifyChat method
 * @see https://core.telegram.org/bots/api#verifychat
 */
export interface VerifyChatParams {
  /** Unique identifier for the target chat or username of the target channel (in the format @channelusername) */
  chat_id: Integer | string;
  /** Optional. Expiration time of the verification. If not specified, the verification will be valid for 1 year. */
  expiration_date?: Integer;
}

/**
 * Parameters for the removeUserVerification method
 * @see https://core.telegram.org/bots/api#removeuserverification
 */
export interface RemoveUserVerificationParams {
  /** Unique identifier of the target user */
  user_id: Integer;
}

/**
 * Parameters for the removeChatVerification method
 * @see https://core.telegram.org/bots/api#removechatverification
 */
export interface RemoveChatVerificationParams {
  /** Unique identifier for the target chat or username of the target channel (in the format @channelusername) */
  chat_id: Integer | string;
}

/**
 * Parameters for the readBusinessMessage method
 * @see https://core.telegram.org/bots/api#readbusinessmessage
 */
export interface ReadBusinessMessageParams {
  /** Unique identifier of business connection */
  business_connection_id: string;
  /** Unique identifier of the target chat */
  chat_id: Integer | string;
  /** Unique identifier of the target message */
  message_id: Integer;
}

/**
 * Parameters for the deleteBusinessMessages method
 * @see https://core.telegram.org/bots/api#deletebusinessmessages
 */
export interface DeleteBusinessMessagesParams {
  /** Unique identifier of business connection */
  business_connection_id: string;
  /** Unique identifier of the target chat */
  chat_id: Integer | string;
  /** Identifiers of 1-100 messages to be deleted */
  message_ids: Array<Integer>;
}

/**
 * Parameters for the setBusinessAccountName method
 * @see https://core.telegram.org/bots/api#setbusinessaccountname
 */
export interface SetBusinessAccountNameParams {
  /** New business name */
  name: string;
  /** Optional. Pass True to set name for all users. By default, name will be updated for the users that have not customized it yet. */
  for_all_users?: boolean;
}

/**
 * Parameters for the setBusinessAccountUsername method
 * @see https://core.telegram.org/bots/api#setbusinessaccountusername
 */
export interface SetBusinessAccountUsernameParams {
  /** New business username */
  username: string;
}

/**
 * Parameters for the setBusinessAccountBio method
 * @see https://core.telegram.org/bots/api#setbusinessaccountbio
 */
export interface SetBusinessAccountBioParams {
  /** New business bio; 0-70 characters */
  bio?: string;
}

/**
 * Parameters for the setBusinessAccountProfilePhoto method
 * @see https://core.telegram.org/bots/api#setbusinessaccountprofilephoto
 */
export interface SetBusinessAccountProfilePhotoParams {
  /** Profile photo to set, should be uploaded using multipart/form-data */
  photo: InputFile;
}

/**
 * Parameters for the setBusinessAccountGiftSettings method
 * @see https://core.telegram.org/bots/api#setbusinessaccountgiftsettings
 */
export interface SetBusinessAccountGiftSettingsParams {
  /** The number of Telegram Stars that must be paid to send the gift */
  star_count: Integer;
  /** Optional. True, if the gift is available only to the users that have subscribed to the business account */
  is_subscription_only?: boolean;
}

/**
 * Parameters for the transferBusinessAccountStars method
 * @see https://core.telegram.org/bots/api#transferbusinessaccountstars
 */
export interface TransferBusinessAccountStarsParams {
  /** Identifier of the user to which the stars are transferred */
  user_id: Integer;
  /** The number of Telegram Stars to transfer */
  stars: Integer;
}

/**
 * Parameters for the convertGiftToStars method
 * @see https://core.telegram.org/bots/api#convertgifttostars
 */
export interface ConvertGiftToStarsParams {
  /** Identifier of the gift to convert */
  gift_id: string;
}

/**
 * Parameters for the upgradeGift method
 * @see https://core.telegram.org/bots/api#upgradegift
 */
export interface UpgradeGiftParams {
  /** Identifier of the gift to upgrade */
  gift_id: string;
}

/**
 * Parameters for the transferGift method
 * @see https://core.telegram.org/bots/api#transfergift
 */
export interface TransferGiftParams {
  /** Identifier of the gift to transfer */
  gift_id: string;
  /** Unique identifier of the target user */
  user_id: Integer;
}

/**
 * Parameters for the postStory method
 * @see https://core.telegram.org/bots/api#poststory
 */
export interface PostStoryParams {
  /** Unique identifier for the target chat or username of the target channel (in the format @channelusername) */
  chat_id: Integer | string;
  /** Optional. Content of the story to be posted */
  content?: InputStoryContent;
  /** Optional. Unique identifier for the target message thread (topic) of the forum; for forum supergroups only */
  message_thread_id?: Integer;
  /** Optional. Story caption, 0-1024 characters after entities parsing */
  caption?: string;
  /** Optional. Mode for parsing entities in the story caption. See formatting options for more details. */
  parse_mode?: string;
  /** Optional. List of special entities that appear in the caption, which can be specified instead of parse_mode */
  caption_entities?: Array<MessageEntity>;
  /** Optional. Story media areas */
  media_areas?: Array<StoryArea>;
  /** Optional. Additional interface options. An object for an inline keyboard, custom reply keyboard, instructions to remove reply keyboard or to force a reply from the user. */
  reply_markup?:
    | InlineKeyboardMarkup
    | ReplyKeyboardMarkup
    | ReplyKeyboardRemove
    | ForceReply;
}

/**
 * Parameters for the editStory method
 * @see https://core.telegram.org/bots/api#editstory
 */
export interface EditStoryParams {
  /** Unique identifier for the target chat or username of the target channel (in the format @channelusername) */
  chat_id: Integer | string;
  /** Unique identifier for the target story */
  story_id: Integer;
  /** Optional. Story caption, 0-1024 characters after entities parsing */
  caption?: string;
  /** Optional. Mode for parsing entities in the story caption. See formatting options for more details. */
  parse_mode?: string;
  /** Optional. List of special entities that appear in the caption, which can be specified instead of parse_mode */
  caption_entities?: Array<MessageEntity>;
  /** Optional. Story media areas */
  media_areas?: Array<StoryArea>;
  /** Optional. An object for an inline keyboard, custom reply keyboard, instructions to remove reply keyboard or to force a reply from the user. */
  reply_markup?:
    | InlineKeyboardMarkup
    | ReplyKeyboardMarkup
    | ReplyKeyboardRemove
    | ForceReply;
}

/**
 * Parameters for the deleteStory method
 * @see https://core.telegram.org/bots/api#deletestory
 */
export interface DeleteStoryParams {
  /** Unique identifier for the target chat or username of the target channel (in the format @channelusername) */
  chat_id: Integer | string;
  /** Unique identifier for the target story */
  story_id: Integer;
}

// =============================================================================
// Updating Messages Parameter Interfaces
// =============================================================================

/**
 * Parameters for the editMessageText method
 * @see https://core.telegram.org/bots/api#editmessagetext
 */
export interface EditMessageTextParams {
  /** Optional. Required if inline_message_id is not specified. Unique identifier for the target chat or username of the target channel (in the format @channelusername) */
  chat_id?: Integer | string;
  /** Optional. Required if inline_message_id is not specified. Identifier of the message to edit */
  message_id?: Integer;
  /** Optional. Required if chat_id and message_id are not specified. Identifier of the inline message */
  inline_message_id?: string;
  /** New text of the message, 1-4096 characters after entities parsing */
  text: string;
  /** Optional. Mode for parsing entities in the message text. See formatting options for more details. */
  parse_mode?: string;
  /** Optional. A JSON-serialized list of special entities that appear in message text, which can be specified instead of parse_mode */
  entities?: Array<MessageEntity>;
  /** Optional. Link preview generation options for the message */
  link_preview_options?: LinkPreviewOptions;
  /** Optional. An object for an inline keyboard. */
  reply_markup?: InlineKeyboardMarkup;
}

/**
 * Parameters for the editMessageCaption method
 * @see https://core.telegram.org/bots/api#editmessagecaption
 */
export interface EditMessageCaptionParams {
  /** Optional. Required if inline_message_id is not specified. Unique identifier for the target chat or username of the target channel (in the format @channelusername) */
  chat_id?: Integer | string;
  /** Optional. Required if inline_message_id is not specified. Identifier of the message to edit */
  message_id?: Integer;
  /** Optional. Required if chat_id and message_id are not specified. Identifier of the inline message */
  inline_message_id?: string;
  /** Optional. New caption of the message, 0-1024 characters after entities parsing */
  caption?: string;
  /** Optional. Mode for parsing entities in the message caption. See formatting options for more details. */
  parse_mode?: string;
  /** Optional. A JSON-serialized list of special entities that appear in the caption, which can be specified instead of parse_mode */
  caption_entities?: Array<MessageEntity>;
  /** Optional. An object for an inline keyboard. */
  reply_markup?: InlineKeyboardMarkup;
}

/**
 * Parameters for the editMessageMedia method
 * @see https://core.telegram.org/bots/api#editmessagemedia
 */
export interface EditMessageMediaParams {
  /** Optional. Required if inline_message_id is not specified. Unique identifier for the target chat or username of the target channel (in the format @channelusername) */
  chat_id?: Integer | string;
  /** Optional. Required if inline_message_id is not specified. Identifier of the message to edit */
  message_id?: Integer;
  /** Optional. Required if chat_id and message_id are not specified. Identifier of the inline message */
  inline_message_id?: string;
  /** A JSON-serialized object for a new media content of the message */
  media: InputMedia;
  /** Optional. An object for an inline keyboard. */
  reply_markup?: InlineKeyboardMarkup;
}

/**
 * Parameters for the editMessageLiveLocation method
 * @see https://core.telegram.org/bots/api#editmessagelivelocation
 */
export interface EditMessageLiveLocationParams {
  /** Optional. Required if inline_message_id is not specified. Unique identifier for the target chat or username of the target channel (in the format @channelusername) */
  chat_id?: Integer | string;
  /** Optional. Required if inline_message_id is not specified. Identifier of the message with the location to edit */
  message_id?: Integer;
  /** Optional. Required if chat_id and message_id are not specified. Identifier of the inline message */
  inline_message_id?: string;
  /** Latitude of new location */
  latitude: Float;
  /** Longitude of new location */
  longitude: Float;
  /** Optional. The radius of uncertainty for the location, measured in meters; 0-1500 */
  horizontal_accuracy?: Float;
  /** Optional. Direction in which the user is moving, in degrees. Must be between 1 and 360 if specified. */
  heading?: Integer;
  /** Optional. Maximum distance for proximity alerts about approaching another chat member, in meters. Must be between 1 and 100000 if specified. */
  proximity_alert_radius?: Integer;
  /** Optional. An object for a new inline keyboard. */
  reply_markup?: InlineKeyboardMarkup;
}

/**
 * Parameters for the stopMessageLiveLocation method
 * @see https://core.telegram.org/bots/api#stopmessagelivelocation
 */
export interface StopMessageLiveLocationParams {
  /** Optional. Required if inline_message_id is not specified. Unique identifier for the target chat or username of the target channel (in the format @channelusername) */
  chat_id?: Integer | string;
  /** Optional. Required if inline_message_id is not specified. Identifier of the message with the location to stop */
  message_id?: Integer;
  /** Optional. Required if chat_id and message_id are not specified. Identifier of the inline message */
  inline_message_id?: string;
  /** Optional. An object for a new inline keyboard. */
  reply_markup?: InlineKeyboardMarkup;
}

/**
 * Parameters for the editMessageChecklist method
 * @see https://core.telegram.org/bots/api#editmessagechecklist
 */
export interface EditMessageChecklistParams {
  /** Optional. Required if inline_message_id is not specified. Unique identifier for the target chat or username of the target channel (in the format @channelusername) */
  chat_id?: Integer | string;
  /** Optional. Required if inline_message_id is not specified. Identifier of the message with the checklist to edit */
  message_id?: Integer;
  /** Optional. Required if chat_id and message_id are not specified. Identifier of the inline message */
  inline_message_id?: string;
  /** Optional. A JSON-serialized list of task IDs to mark as done */
  task_ids_done?: Array<string>;
  /** Optional. A JSON-serialized list of task IDs to mark as not done */
  task_ids_undone?: Array<string>;
  /** Optional. An object for a new inline keyboard. */
  reply_markup?: InlineKeyboardMarkup;
}

/**
 * Parameters for the editMessageReplyMarkup method
 * @see https://core.telegram.org/bots/api#editmessagereplymarkup
 */
export interface EditMessageReplyMarkupParams {
  /** Optional. Required if inline_message_id is not specified. Unique identifier for the target chat or username of the target channel (in the format @channelusername) */
  chat_id?: Integer | string;
  /** Optional. Required if inline_message_id is not specified. Identifier of the message to edit */
  message_id?: Integer;
  /** Optional. Required if chat_id and message_id are not specified. Identifier of the inline message */
  inline_message_id?: string;
  /** Optional. An object for an inline keyboard. */
  reply_markup?: InlineKeyboardMarkup;
}

/**
 * Parameters for the stopPoll method
 * @see https://core.telegram.org/bots/api#stoppoll
 */
export interface StopPollParams {
  /** Unique identifier for the target chat or username of the target channel (in the format @channelusername) */
  chat_id: Integer | string;
  /** Identifier of the original message with the poll */
  message_id: Integer;
  /** Optional. An object for a new inline keyboard. */
  reply_markup?: InlineKeyboardMarkup;
}

/**
 * Parameters for the approveSuggestedPost method
 * @see https://core.telegram.org/bots/api#approvesuggestedpost
 */
export interface ApproveSuggestedPostParams {
  /** Unique identifier for the target chat or username of the target channel (in the format @channelusername) */
  chat_id: Integer | string;
  /** Identifier of the suggestion to approve */
  post_id: Integer;
}

/**
 * Parameters for the declineSuggestedPost method
 * @see https://core.telegram.org/bots/api#declinesuggestedpost
 */
export interface DeclineSuggestedPostParams {
  /** Unique identifier for the target chat or username of the target channel (in the format @channelusername) */
  chat_id: Integer | string;
  /** Identifier of the suggestion to decline */
  post_id: Integer;
}

/**
 * Parameters for the deleteMessage method
 * @see https://core.telegram.org/bots/api#deletemessage
 */
export interface DeleteMessageParams {
  /** Unique identifier for the target chat or username of the target channel (in the format @channelusername) */
  chat_id: Integer | string;
  /** Identifier of the message to delete */
  message_id: Integer;
}

/**
 * Parameters for the deleteMessages method
 * @see https://core.telegram.org/bots/api#deletemessages
 */
export interface DeleteMessagesParams {
  /** Unique identifier for the target chat or username of the target channel (in the format @channelusername) */
  chat_id: Integer | string;
  /** A JSON-serialized list of 1-100 identifiers of messages to delete. See deleteMessage for limitations on which messages can be deleted */
  message_ids: Array<Integer>;
}

// =============================================================================
// Stickers Parameter Interfaces
// =============================================================================

/**
 * Parameters for the sendSticker method
 * @see https://core.telegram.org/bots/api#sendsticker
 */
export interface SendStickerParams {
  /** Unique identifier for the target chat or username of the target channel (in the format @channelusername) */
  chat_id: Integer | string;
  /** Unique identifier for the target message thread (topic) of the forum; for forum supergroups only */
  message_thread_id?: Integer;
  /** Sticker to send. Pass a file_id as String to send a file that exists on the Telegram servers (recommended), pass an HTTP URL for Telegram to get a .WEBP file from the Internet, or upload a new one using multipart/form-data. */
  sticker: InputFile | string;
  /** Optional. Emoji associated with the sticker; only for just uploaded stickers */
  emoji?: string;
  /** Optional. Sends the message silently. Users will receive a notification with no sound. */
  disable_notification?: boolean;
  /** Optional. Protects the contents of the sent message from forwarding and saving */
  protect_content?: boolean;
  /** Optional. Description of the message to reply to */
  reply_parameters?: ReplyParameters;
  /** Optional. Additional interface options. An object for an inline keyboard, custom reply keyboard, instructions to remove reply keyboard or to force a reply from the user. */
  reply_markup?:
    | InlineKeyboardMarkup
    | ReplyKeyboardMarkup
    | ReplyKeyboardRemove
    | ForceReply;
}

/**
 * Parameters for the getStickerSet method
 * @see https://core.telegram.org/bots/api#getstickerset
 */
export interface GetStickerSetParams {
  /** Name of the sticker set */
  name: string;
}

/**
 * Parameters for the getCustomEmojiStickers method
 * @see https://core.telegram.org/bots/api#getcustomemojistickers
 */
export interface GetCustomEmojiStickersParams {
  /** List of custom emoji identifiers. At most 200 custom emoji identifiers can be specified. */
  custom_emoji_ids: Array<string>;
}

/**
 * Parameters for the uploadStickerFile method
 * @see https://core.telegram.org/bots/api#uploadstickerfile
 */
export interface UploadStickerFileParams {
  /** User identifier of sticker file owner */
  user_id: Integer;
  /** Sticker file to upload, must be in format PNG, TGS, or WEBM */
  sticker: InputFile;
  /** Format of the sticker, must be one of “static”, “animated”, “video” */
  sticker_format: string;
}

/**
 * Parameters for the createNewStickerSet method
 * @see https://core.telegram.org/bots/api#createnewstickerset
 */
export interface CreateNewStickerSetParams {
  /** User identifier of created sticker set owner */
  user_id: Integer;
  /** Short name of sticker set, to be used in t.me/addstickers/ URLs (e.g., animals). Can contain only English letters, digits and underscores. Must begin with a letter, can't contain consecutive underscores and must end in "_by_<bot_username>". <bot_username> is case insensitive. 1-64 characters. */
  name: string;
  /** Sticker set title, 1-64 characters */
  title: string;
  /** A JSON-serialized list of 1-50 initial stickers to be added to the sticker set */
  stickers: Array<InputSticker>;
  /** Optional. Type of stickers in the set, pass “regular”, “mask”, or “custom_emoji”. By default, a regular sticker set is created. */
  sticker_type?: string;
  /** Optional. Pass True if stickers in the sticker set must be repainted to the color of text when used in messages, the accent color if used as emoji status, white on chat photos, or another appropriate color based on context; for custom emoji sticker sets only */
  needs_repainting?: boolean;
}

/**
 * Parameters for the addStickerToSet method
 * @see https://core.telegram.org/bots/api#addstickertoset
 */
export interface AddStickerToSetParams {
  /** User identifier of sticker set owner */
  user_id: Integer;
  /** Sticker set name */
  name: string;
  /** Sticker to add to the set, uploaded using multipart/form-data */
  sticker: InputSticker;
}

/**
 * Parameters for the setStickerPositionInSet method
 * @see https://core.telegram.org/bots/api#setstickerpositioninset
 */
export interface SetStickerPositionInSetParams {
  /** File identifier of the sticker */
  sticker: string;
  /** New sticker position in the set, zero-based */
  position: Integer;
}

/**
 * Parameters for the deleteStickerFromSet method
 * @see https://core.telegram.org/bots/api#deletestickerfromset
 */
export interface DeleteStickerFromSetParams {
  /** File identifier of the sticker */
  sticker: string;
}

/**
 * Parameters for the replaceStickerInSet method
 * @see https://core.telegram.org/bots/api#replacestickerinset
 */
export interface ReplaceStickerInSetParams {
  /** User identifier of the sticker set owner */
  user_id: Integer;
  /** Sticker set name */
  name: string;
  /** File identifier of the replaced sticker */
  old_sticker: string;
  /** A JSON-serialized object with the new sticker. It's required to use one of the fields to specify the new sticker file */
  sticker: InputSticker;
}

/**
 * Parameters for the setStickerEmojiList method
 * @see https://core.telegram.org/bots/api#setstickeremojilist
 */
export interface SetStickerEmojiListParams {
  /** File identifier of the sticker */
  sticker: string;
  /** A JSON-serialized list of 1-20 emoji associated with the sticker */
  emoji_list: Array<string>;
}

/**
 * Parameters for the setStickerKeywords method
 * @see https://core.telegram.org/bots/api#setstickerkeywords
 */
export interface SetStickerKeywordsParams {
  /** File identifier of the sticker */
  sticker: string;
  /** Optional. A JSON-serialized list of 0-20 keywords with length 1-64 characters, which can be used as sticker keywords */
  keywords?: Array<string>;
}

/**
 * Parameters for the setStickerMaskPosition method
 * @see https://core.telegram.org/bots/api#setstickermaskposition
 */
export interface SetStickerMaskPositionParams {
  /** File identifier of the sticker */
  sticker: string;
  /** Optional. A JSON-serialized object with the position where the mask should be placed on faces. Omit the parameter to remove the mask position. */
  mask_position?: MaskPosition;
}

/**
 * Parameters for the setStickerSetTitle method
 * @see https://core.telegram.org/bots/api#setstickersettitle
 */
export interface SetStickerSetTitleParams {
  /** Sticker set name */
  name: string;
  /** Sticker set title, 1-64 characters */
  title: string;
}

/**
 * Parameters for the setStickerSetThumbnail method
 * @see https://core.telegram.org/bots/api#setstickersetthumbnail
 */
export interface SetStickerSetThumbnailParams {
  /** Sticker set name */
  name: string;
  /** User identifier of the sticker set owner */
  user_id: Integer;
  /** Optional. A PNG image with the thumbnail, must be up to 128 kilobytes in size and have width and height exactly 100px, or a TGS animation with the thumbnail up to 32 kilobytes in size; see https://core.telegram.org/stickers for animated sticker technical requirements, or a WEBM video with the thumbnail up to 32 kilobytes in size; see https://core.telegram.org/stickers for video sticker technical requirements. Pass a file_id as a String to send a file that already exists on the Telegram servers, pass an HTTP URL as a String for Telegram to get a file from the Internet, or pass “attach://<file_attach_name>” to upload a new one using multipart/form-data under <file_attach_name> name. Animated sticker set thumbnail can't be uploaded via HTTP URL. */
  thumbnail?: InputFile | string;
}

/**
 * Parameters for the setCustomEmojiStickerSetThumbnail method
 * @see https://core.telegram.org/bots/api#setcustomemojistickersetthumbnail
 */
export interface SetCustomEmojiStickerSetThumbnailParams {
  /** Sticker set name */
  name: string;
  /** Optional. Custom emoji identifier of a sticker from the sticker set; pass an empty string to drop the thumbnail and use the first sticker as the thumbnail. */
  custom_emoji_id?: string;
}

/**
 * Parameters for the deleteStickerSet method
 * @see https://core.telegram.org/bots/api#deletestickerset
 */
export interface DeleteStickerSetParams {
  /** Sticker set name */
  name: string;
}

// =============================================================================
// Inline Mode Parameter Interfaces
// =============================================================================

/**
 * Parameters for the answerInlineQuery method
 * @see https://core.telegram.org/bots/api#answerinlinequery
 */
export interface AnswerInlineQueryParams {
  /** Unique identifier for the answered query */
  inline_query_id: string;
  /** A JSON-serialized array of results for the inline query */
  results: Array<InlineQueryResult>;
  /** Optional. The maximum amount of time in seconds that the result of the inline query may be cached on the server. Defaults to 300. */
  cache_time?: Integer;
  /** Optional. Pass True if results may be cached on the server side only for the user that sent the query. By default, results may be returned to any user who sends the same query */
  is_personal?: boolean;
  /** Optional. Pass the offset that a client should send in the next query with the same text to receive more results. Pass an empty string if there are no more results or if you don't support pagination. Offset length can't exceed 64 bytes. */
  next_offset?: string;
  /** Optional. If passed, clients will display a button with specified text that switches the user to a private chat with the bot and sends the bot a start message with the parameter switch_pm_parameter */
  switch_pm_text?: string;
  /** Optional. Deep-linking parameter for the /start message sent to the bot when user presses the switch button. 1-64 characters, only A-Z, a-z, 0-9, _ and - are allowed. */
  switch_pm_parameter?: string;
  /** Optional. Parameter for ranking results, must be a positive integer no more than 100000 */
  button?: InlineQueryResultsButton;
}

/**
 * Parameters for the answerWebAppQuery method
 * @see https://core.telegram.org/bots/api#answerwebappquery
 */
export interface AnswerWebAppQueryParams {
  /** Unique identifier for the query to be answered */
  web_app_query_id: string;
  /** A JSON-serialized object describing the message to be sent */
  result: InlineQueryResult;
}

/**
 * Parameters for the savePreparedInlineMessage method
 * @see https://core.telegram.org/bots/api#savepreparedinlinemessage
 */
export interface SavePreparedInlineMessageParams {
  /** Unique identifier of the inline message */
  inline_message_id: string;
  /** Optional. Message thread identifier of the inline message */
  message_thread_id?: Integer;
}

// =============================================================================
// Payments Parameter Interfaces
// =============================================================================

/**
 * Parameters for the sendInvoice method
 * @see https://core.telegram.org/bots/api#sendinvoice
 */
export interface SendInvoiceParams {
  /** Unique identifier for the target chat or username of the target channel (in the format @channelusername) */
  chat_id: Integer | string;
  /** Unique identifier for the target message thread (topic) of the forum; for forum supergroups only */
  message_thread_id?: Integer;
  /** Product name, 1-32 characters */
  title: string;
  /** Product description, 1-255 characters */
  description: string;
  /** Bot-defined invoice payload, 1-128 bytes. This will not be displayed to the user, use for your internal processes. */
  payload: string;
  /** Payment provider token, obtained via @BotFather */
  provider_token: string;
  /** Three-letter ISO 4217 currency code, see more on currencies */
  currency: string;
  /** Price breakdown, a JSON-serialized list of components (e.g. product price, tax, discount, delivery cost, delivery tax, bonus, etc.) */
  prices: Array<LabeledPrice>;
  /** Optional. The maximum accepted amount for tips in the smallest units of the currency (integer, not float/double). For example, for a maximum tip of US$ 1.45 pass max_tip_amount = 145. See the exp parameter in currencies.json, it shows the number of digits past the decimal point for each currency (2 for the majority of currencies). Defaults to 0 */
  max_tip_amount?: Integer;
  /** Optional. A JSON-serialized array of suggested amounts of tips in the smallest units of the currency (integer, not float/double). At most 4 suggested tip amounts can be specified. The suggested tip amounts must be positive, passed in a strictly increased order and must not exceed max_tip_amount. */
  suggested_tip_amounts?: Array<Integer>;
  /** Optional. Unique deep-linking parameter. If left empty, forwarded copies of the sent message will have a Pay button, allowing multiple users to pay directly from the forwarded message, using the same invoice. If non-empty, forwarded copies of the sent message will have a URL button with a deep link to the bot (instead of a Pay button), with the value used as the start parameter */
  start_parameter?: string;
  /** Optional. JSON-encoded data about the invoice, which will be shared with the payment provider. A detailed description of required fields should be provided by the payment provider. */
  provider_data?: string;
  /** Optional. URL of the product photo for the invoice. Can be a photo of the goods or a marketing image for a service. People like it better when they see what they are paying for. */
  photo_url?: string;
  /** Optional. Photo size in bytes */
  photo_size?: Integer;
  /** Optional. Photo width */
  photo_width?: Integer;
  /** Optional. Photo height */
  photo_height?: Integer;
  /** Optional. Pass True if you require the user's full name to complete the order */
  need_name?: boolean;
  /** Optional. Pass True if you require the user's phone number to complete the order */
  need_phone_number?: boolean;
  /** Optional. Pass True if you require the user's email address to complete the order */
  need_email?: boolean;
  /** Optional. Pass True if you require the user's shipping address to complete the order */
  need_shipping_address?: boolean;
  /** Optional. Pass True if the user's phone number should be sent to provider */
  send_phone_number_to_provider?: boolean;
  /** Optional. Pass True if the user's email address should be sent to provider */
  send_email_to_provider?: boolean;
  /** Optional. Pass True if the final price depends on the shipping method */
  is_flexible?: boolean;
  /** Optional. Sends the message silently. Users will receive a notification with no sound. */
  disable_notification?: boolean;
  /** Optional. Protects the contents of the sent message from forwarding and saving */
  protect_content?: boolean;
  /** Optional. Description of the message to reply to */
  reply_parameters?: ReplyParameters;
  /** Optional. An object for an inline keyboard. If empty, one 'Pay total price' button will be shown. If not empty, the first button must be a Pay button. */
  reply_markup?: InlineKeyboardMarkup;
}

/**
 * Parameters for the createInvoiceLink method
 * @see https://core.telegram.org/bots/api#createinvoicelink
 */
export interface CreateInvoiceLinkParams {
  /** Product name, 1-32 characters */
  title: string;
  /** Product description, 1-255 characters */
  description: string;
  /** Bot-defined invoice payload, 1-128 bytes. This will not be displayed to the user, use for your internal processes. */
  payload: string;
  /** Payment provider token, obtained via @BotFather */
  provider_token: string;
  /** Three-letter ISO 4217 currency code, see more on currencies */
  currency: string;
  /** Price breakdown, a JSON-serialized list of components (e.g. product price, tax, discount, delivery cost, delivery tax, bonus, etc.) */
  prices: Array<LabeledPrice>;
  /** Optional. The maximum accepted amount for tips in the smallest units of the currency (integer, not float/double). For example, for a maximum tip of US$ 1.45 pass max_tip_amount = 145. See the exp parameter in currencies.json, it shows the number of digits past the decimal point for each currency (2 for the majority of currencies). Defaults to 0 */
  max_tip_amount?: Integer;
  /** Optional. A JSON-serialized array of suggested amounts of tips in the smallest units of the currency (integer, not float/double). At most 4 suggested tip amounts can be specified. The suggested tip amounts must be positive, passed in a strictly increased order and must not exceed max_tip_amount. */
  suggested_tip_amounts?: Array<Integer>;
  /** Optional. JSON-encoded data about the invoice, which will be shared with the payment provider. A detailed description of required fields should be provided by the payment provider. */
  provider_data?: string;
  /** Optional. URL of the product photo for the invoice. Can be a photo of the goods or a marketing image for a service. */
  photo_url?: string;
  /** Optional. Photo size in bytes */
  photo_size?: Integer;
  /** Optional. Photo width */
  photo_width?: Integer;
  /** Optional. Photo height */
  photo_height?: Integer;
  /** Optional. Pass True if you require the user's full name to complete the order */
  need_name?: boolean;
  /** Optional. Pass True if you require the user's phone number to complete the order */
  need_phone_number?: boolean;
  /** Optional. Pass True if you require the user's email address to complete the order */
  need_email?: boolean;
  /** Optional. Pass True if you require the user's shipping address to complete the order */
  need_shipping_address?: boolean;
  /** Optional. Pass True if the user's phone number should be sent to provider */
  send_phone_number_to_provider?: boolean;
  /** Optional. Pass True if the user's email address should be sent to provider */
  send_email_to_provider?: boolean;
  /** Optional. Pass True if the final price depends on the shipping method */
  is_flexible?: boolean;
}

/**
 * Parameters for the answerShippingQuery method
 * @see https://core.telegram.org/bots/api#answershippingquery
 */
export interface AnswerShippingQueryParams {
  /** Unique identifier for the query to be answered */
  shipping_query_id: string;
  /** Pass True if delivery to the specified address is possible and False if there are any problems (for example, if delivery to the specified address is not possible) */
  ok: boolean;
  /** Optional. Required if ok is True. A JSON-serialized array of available shipping options. */
  shipping_options?: Array<ShippingOption>;
  /** Optional. Required if ok is False. Error message in human readable form that explains why it is impossible to complete the order (e.g. "Sorry, delivery to your desired address is unavailable'). Telegram will display this message to the user. */
  error_message?: string;
}

/**
 * Parameters for the answerPreCheckoutQuery method
 * @see https://core.telegram.org/bots/api#answerprecheckoutquery
 */
export interface AnswerPreCheckoutQueryParams {
  /** Unique identifier for the query to be answered */
  pre_checkout_query_id: string;
  /** Specify True if everything is alright (goods are available, etc.) and the bot is ready to proceed with the order. Use False if there are any problems. */
  ok: boolean;
  /** Optional. Required if ok is False. Error message in human readable form that explains the reason for failure to proceed with the checkout (e.g. "Sorry, somebody just bought the last of our amazing black T-shirts while you were busy filling out your payment details. Please choose a different color or garment!"). Telegram will display this message to the user. */
  error_message?: string;
}

/**
 * Parameters for the getStarTransactions method
 * @see https://core.telegram.org/bots/api#getstartransactions
 */
export interface GetStarTransactionsParams {
  /** Optional. Number of transactions to skip in the response */
  offset?: Integer;
  /** Optional. The maximum number of transactions to be retrieved. Values between 1-100 are accepted. Defaults to 100. */
  limit?: Integer;
}

/**
 * Parameters for the refundStarPayment method
 * @see https://core.telegram.org/bots/api#refundstarpayment
 */
export interface RefundStarPaymentParams {
  /** Identifier of the user whose payment will be refunded */
  user_id: Integer;
  /** Telegram payment identifier */
  telegram_payment_charge_id: string;
}

/**
 * Parameters for the editUserStarSubscription method
 * @see https://core.telegram.org/bots/api#edituserstarsubscription
 */
export interface EditUserStarSubscriptionParams {
  /** Identifier of the user whose subscription will be edited */
  user_id: Integer;
  /** Telegram payment identifier */
  telegram_payment_charge_id: string;
  /** Pass True to cancel extension of the user subscription; pass False to allow the user to extend their subscription */
  is_canceled: boolean;
}

// =============================================================================
// Telegram Passport Parameter Interfaces
// =============================================================================

/**
 * Parameters for the setPassportDataErrors method
 * @see https://core.telegram.org/bots/api#setpassportdataerrors
 */
export interface SetPassportDataErrorsParams {
  /** User identifier */
  user_id: Integer;
  /** A JSON-serialized array describing the errors */
  errors: Array<PassportElementError>;
}

// =============================================================================
// Games Parameter Interfaces
// =============================================================================

/**
 * Parameters for the sendGame method
 * @see https://core.telegram.org/bots/api#sendgame
 */
export interface SendGameParams {
  /** Unique identifier for the target chat */
  chat_id: Integer;
  /** Unique identifier for the target message thread (topic) of the forum; for forum supergroups only */
  message_thread_id?: Integer;
  /** Short name of the game, serves as the unique identifier for the game. Set up your games via @BotFather. */
  game_short_name: string;
  /** Optional. Sends the message silently. Users will receive a notification with no sound. */
  disable_notification?: boolean;
  /** Optional. Protects the contents of the sent message from forwarding and saving */
  protect_content?: boolean;
  /** Optional. Description of the message to reply to */
  reply_parameters?: ReplyParameters;
  /** Optional. An object for an inline keyboard. If empty, one 'Play game_title' button will be shown. If not empty, the first button must launch the game. */
  reply_markup?: InlineKeyboardMarkup;
}

/**
 * Parameters for the setGameScore method
 * @see https://core.telegram.org/bots/api#setgamescore
 */
export interface SetGameScoreParams {
  /** User identifier */
  user_id: Integer;
  /** New score, must be non-negative */
  score: Integer;
  /** Optional. Pass True if the high score is allowed to decrease. This can be useful when fixing mistakes or banning cheaters */
  force?: boolean;
  /** Optional. Pass True if the game message should not be automatically edited to include the current scoreboard */
  disable_edit_message?: boolean;
  /** Optional. Required if inline_message_id is not specified. Unique identifier for the target chat */
  chat_id?: Integer;
  /** Optional. Required if inline_message_id is not specified. Identifier of the sent message */
  message_id?: Integer;
  /** Optional. Required if chat_id and message_id are not specified. Identifier of the inline message */
  inline_message_id?: string;
}

/**
 * Parameters for the getGameHighScores method
 * @see https://core.telegram.org/bots/api#getgamehighscores
 */
export interface GetGameHighScoresParams {
  /** Target user id */
  user_id: Integer;
  /** Optional. Required if inline_message_id is not specified. Unique identifier for the target chat */
  chat_id?: Integer;
  /** Optional. Required if inline_message_id is not specified. Identifier of the sent message */
  message_id?: Integer;
  /** Optional. Required if chat_id and message_id are not specified. Identifier of the inline message */
  inline_message_id?: string;
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
  params: unknown,
  config: TelegramBotApiConfig
): HttpClientRequest.HttpClientRequest => {
  const tokenValue = Secret.value(config.token);
  const url = `${config.apiBaseUrl}${tokenValue}/${method}`;

  // Determine if we need multipart/form-data (for file uploads)
  const hasFile = containsFile(params);

  if (hasFile) {
    // For file uploads, use multipart/form-data
    const formData = buildFormData(params);
    return HttpClientRequest.post(url).pipe(
      HttpClientRequest.bodyFormData(formData),
      HttpClientRequest.timeout(config.timeout)
    );
  } else {
    // For regular requests, use JSON
    return HttpClientRequest.post(url).pipe(
      HttpClientRequest.bodyJson(params),
      HttpClientRequest.setHeader("Content-Type", "application/json"),
      HttpClientRequest.timeout(config.timeout)
    );
  }
};

/**
 * Determines if the parameters contain a file (input file)
 * @param params The parameters to check
 * @returns Boolean indicating if the params contain a file
 */
const containsFile = (params: unknown): boolean => {
  if (typeof params !== "object" || params === null) {
    return false;
  }

  const obj = params as Record<string, unknown>;
  for (const key in obj) {
    const value = obj[key];
    if (value && typeof value === "object") {
      // Check if it's an InputFile type
      if ("file" in value || "fileId" in value || "content" in value) {
        return true;
      }
      // Recursively check nested objects
      if (containsFile(value)) {
        return true;
      }
    } else if (Array.isArray(value)) {
      // Check arrays of objects
      return value.some((item) => containsFile(item));
    }
  }

  return false;
};

/**
 * Builds form data for file uploads
 * @param params The parameters to convert to form data
 * @returns FormData object
 */
const buildFormData = (params: unknown): FormData => {
  const formData = new FormData();

  if (typeof params !== "object" || params === null) {
    return formData;
  }

  const obj = params as Record<string, unknown>;
  for (const key in obj) {
    const value = obj[key];
    if (value !== undefined && value !== null) {
      if (typeof value === "object") {
        // Handle InputFile objects
        if ("file" in value) {
          // File object
          formData.append(key, (value as { file: File }).file);
        } else if ("content" in value) {
          // File content as string or buffer
          const content = (value as { content: string | Buffer }).content;
          if (typeof content === "string") {
            formData.append(key, new Blob([content]), key);
          } else {
            // If content is a buffer, handle accordingly
            formData.append(key, new Blob([content]), key);
          }
        } else {
          // For other objects, stringify them
          formData.append(key, JSON.stringify(value));
        }
      } else {
        // For primitive values, append directly
        formData.append(key, String(value));
      }
    }
  }

  return formData;
};

/**
 * Handles the HTTP response from a Telegram API request
 * @param response The HTTP response to process
 * @returns The parsed JSON response from Telegram API
 */
const handleTelegramResponse = <T>(
  response: HttpClientResponse.HttpClientResponse
): Effect.Effect<T, TelegramBotApiError> => {
  return pipe(
    Effect.tryPromise({
      try: () => response.json(),
      catch: (error) =>
        new TelegramBotApiInvalidResponseError({
          message: `Failed to parse response JSON: ${String(error)}`,
          cause: error,
        }),
    }),
    Effect.flatMap((json) => {
      if (
        typeof json === "object" &&
        json !== null &&
        "ok" in json &&
        json.ok
      ) {
        // Success response
        return Effect.succeed(json.result as T);
      } else if (
        typeof json === "object" &&
        json !== null &&
        "ok" in json &&
        !json.ok &&
        "description" in json
      ) {
        // Error response from Telegram API
        const errorCode = json.error_code ? String(json.error_code) : undefined;
        const description = String(json.description);
        const message = errorCode
          ? `${errorCode}: ${description}`
          : description;

        // Check for specific error conditions
        if (
          errorCode === "409" &&
          description.toLowerCase().includes("conflict")
        ) {
          return Effect.fail(
            new TelegramBotApiError({ message: `Bot conflict: ${message}` })
          );
        } else if (errorCode === "401" || errorCode === "403") {
          return Effect.fail(
            new TelegramBotApiUnauthorizedError({
              message: `Unauthorized: ${message}`,
            })
          );
        } else if (errorCode === "429") {
          const retryAfter =
            json.parameters && "retry_after" in json.parameters
              ? ((json.parameters as any).retry_after as number)
              : undefined;
          return Effect.fail(
            new TelegramBotApiRateLimitError({
              message: `Rate limited: ${message}`,
              retryAfter,
            })
          );
        } else {
          return Effect.fail(
            new TelegramBotApiMethodError({
              message,
              method: (json.parameters?.method as string) || "unknown",
            })
          );
        }
      } else {
        // Invalid response format
        return Effect.fail(
          new TelegramBotApiInvalidResponseError({
            message: `Invalid response format: ${JSON.stringify(json)}`,
            response: json,
          })
        );
      }
    }),
    Effect.catchAll((error) => {
      if (error._tag === "TelegramBotApiError") {
        return Effect.fail(error);
      }
      return Effect.fail(
        new TelegramBotApiError({
          message: `Unexpected error processing response: ${String(error)}`,
        })
      );
    })
  );
};

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
  const request = makeTelegramRequest(method, params, config);

  return pipe(
    Effect.tryPromise({
      try: () => HttpClient.execute(request),
      catch: (error) =>
        new TelegramBotApiNetworkError({
          message: `Network error: ${String(error)}`,
          cause: error,
        }),
    }),
    Effect.flatMap((response) => handleTelegramResponse<T>(response)),
    Effect.retry({
      times: config.retryAttempts,
      delay: config.retryDelay,
      until: (error) => {
        // Don't retry on unauthorized or method-specific errors
        if (
          error._tag === "TelegramBotApiUnauthorizedError" ||
          error._tag === "TelegramBotApiMethodError"
        ) {
          return true;
        }
        // Retry on network errors and rate limits
        return (
          error._tag === "TelegramBotApiNetworkError" ||
          error._tag === "TelegramBotApiRateLimitError"
        );
      },
    }),
    Effect.catchAll((error) => {
      if (error._tag === "TelegramBotApiError") {
        return Effect.fail(error);
      }
      return Effect.fail(
        new TelegramBotApiError({
          message: `Unexpected error: ${String(error)}`,
        })
      );
    })
  );
};

// =============================================================================
// Complete Implementation
// =============================================================================

/**
 * Live implementation of the Telegram Bot API Service
 */
export class TelegramBotApiServiceImpl extends Effect.Service<TelegramBotApiServiceContext>()(
  "TelegramBotApiService",
  (_) => ({
    create: Effect.gen(function* (_) {
      const config = yield* _(TelegramBotApiConfigContext);

      return TelegramBotApiService.of({
        // Getting updates
        getUpdates: (params) =>
          executeTelegramRequest("getUpdates", params, config),
        setWebhook: (params) =>
          executeTelegramRequest("setWebhook", params, config),
        deleteWebhook: (params) =>
          executeTelegramRequest("deleteWebhook", params, config),
        getWebhookInfo: () =>
          executeTelegramRequest("getWebhookInfo", {}, config),

        // Available methods
        getMe: () => executeTelegramRequest("getMe", {}, config),
        logOut: () => executeTelegramRequest("logOut", {}, config),
        close: () => executeTelegramRequest("close", {}, config),
        sendMessage: (params) =>
          executeTelegramRequest("sendMessage", params, config),
        forwardMessage: (params) =>
          executeTelegramRequest("forwardMessage", params, config),
        forwardMessages: (params) =>
          executeTelegramRequest("forwardMessages", params, config),
        copyMessage: (params) =>
          executeTelegramRequest("copyMessage", params, config),
        copyMessages: (params) =>
          executeTelegramRequest("copyMessages", params, config),
        sendPhoto: (params) =>
          executeTelegramRequest("sendPhoto", params, config),
        sendAudio: (params) =>
          executeTelegramRequest("sendAudio", params, config),
        sendDocument: (params) =>
          executeTelegramRequest("sendDocument", params, config),
        sendVideo: (params) =>
          executeTelegramRequest("sendVideo", params, config),
        sendAnimation: (params) =>
          executeTelegramRequest("sendAnimation", params, config),
        sendVoice: (params) =>
          executeTelegramRequest("sendVoice", params, config),
        sendVideoNote: (params) =>
          executeTelegramRequest("sendVideoNote", params, config),
        sendPaidMedia: (params) =>
          executeTelegramRequest("sendPaidMedia", params, config),
        sendMediaGroup: (params) =>
          executeTelegramRequest("sendMediaGroup", params, config),
        sendLocation: (params) =>
          executeTelegramRequest("sendLocation", params, config),
        sendVenue: (params) =>
          executeTelegramRequest("sendVenue", params, config),
        sendContact: (params) =>
          executeTelegramRequest("sendContact", params, config),
        sendPoll: (params) =>
          executeTelegramRequest("sendPoll", params, config),
        sendChecklist: (params) =>
          executeTelegramRequest("sendChecklist", params, config),
        sendDice: (params) =>
          executeTelegramRequest("sendDice", params, config),
        sendChatAction: (params) =>
          executeTelegramRequest("sendChatAction", params, config),
        setMessageReaction: (params) =>
          executeTelegramRequest("setMessageReaction", params, config),
        getUserProfilePhotos: (params) =>
          executeTelegramRequest("getUserProfilePhotos", params, config),
        setUserEmojiStatus: (params) =>
          executeTelegramRequest("setUserEmojiStatus", params, config),
        getFile: (params) => executeTelegramRequest("getFile", params, config),
        banChatMember: (params) =>
          executeTelegramRequest("banChatMember", params, config),
        unbanChatMember: (params) =>
          executeTelegramRequest("unbanChatMember", params, config),
        restrictChatMember: (params) =>
          executeTelegramRequest("restrictChatMember", params, config),
        promoteChatMember: (params) =>
          executeTelegramRequest("promoteChatMember", params, config),
        setChatAdministratorCustomTitle: (params) =>
          executeTelegramRequest(
            "setChatAdministratorCustomTitle",
            params,
            config
          ),
        banChatSenderChat: (params) =>
          executeTelegramRequest("banChatSenderChat", params, config),
        unbanChatSenderChat: (params) =>
          executeTelegramRequest("unbanChatSenderChat", params, config),
        setChatPermissions: (params) =>
          executeTelegramRequest("setChatPermissions", params, config),
        exportChatInviteLink: (params) =>
          executeTelegramRequest("exportChatInviteLink", params, config),
        createChatInviteLink: (params) =>
          executeTelegramRequest("createChatInviteLink", params, config),
        editChatInviteLink: (params) =>
          executeTelegramRequest("editChatInviteLink", params, config),
        createChatSubscriptionInviteLink: (params) =>
          executeTelegramRequest(
            "createChatSubscriptionInviteLink",
            params,
            config
          ),
        editChatSubscriptionInviteLink: (params) =>
          executeTelegramRequest(
            "editChatSubscriptionInviteLink",
            params,
            config
          ),
        revokeChatInviteLink: (params) =>
          executeTelegramRequest("revokeChatInviteLink", params, config),
        approveChatJoinRequest: (params) =>
          executeTelegramRequest("approveChatJoinRequest", params, config),
        declineChatJoinRequest: (params) =>
          executeTelegramRequest("declineChatJoinRequest", params, config),
        setChatPhoto: (params) =>
          executeTelegramRequest("setChatPhoto", params, config),
        deleteChatPhoto: (params) =>
          executeTelegramRequest("deleteChatPhoto", params, config),
        setChatTitle: (params) =>
          executeTelegramRequest("setChatTitle", params, config),
        setChatDescription: (params) =>
          executeTelegramRequest("setChatDescription", params, config),
        pinChatMessage: (params) =>
          executeTelegramRequest("pinChatMessage", params, config),
        unpinChatMessage: (params) =>
          executeTelegramRequest("unpinChatMessage", params, config),
        unpinAllChatMessages: (params) =>
          executeTelegramRequest("unpinAllChatMessages", params, config),
        leaveChat: (params) =>
          executeTelegramRequest("leaveChat", params, config),
        getChat: (params) => executeTelegramRequest("getChat", params, config),
        getChatAdministrators: (params) =>
          executeTelegramRequest("getChatAdministrators", params, config),
        getChatMemberCount: (params) =>
          executeTelegramRequest("getChatMemberCount", params, config),
        getChatMember: (params) =>
          executeTelegramRequest("getChatMember", params, config),
        setChatStickerSet: (params) =>
          executeTelegramRequest("setChatStickerSet", params, config),
        deleteChatStickerSet: (params) =>
          executeTelegramRequest("deleteChatStickerSet", params, config),
        getForumTopicIconStickers: () =>
          executeTelegramRequest("getForumTopicIconStickers", {}, config),
        createForumTopic: (params) =>
          executeTelegramRequest("createForumTopic", params, config),
        editForumTopic: (params) =>
          executeTelegramRequest("editForumTopic", params, config),
        closeForumTopic: (params) =>
          executeTelegramRequest("closeForumTopic", params, config),
        reopenForumTopic: (params) =>
          executeTelegramRequest("reopenForumTopic", params, config),
        deleteForumTopic: (params) =>
          executeTelegramRequest("deleteForumTopic", params, config),
        unpinAllForumTopicMessages: (params) =>
          executeTelegramRequest("unpinAllForumTopicMessages", params, config),
        editGeneralForumTopic: (params) =>
          executeTelegramRequest("editGeneralForumTopic", params, config),
        closeGeneralForumTopic: (params) =>
          executeTelegramRequest("closeGeneralForumTopic", params, config),
        reopenGeneralForumTopic: (params) =>
          executeTelegramRequest("reopenGeneralForumTopic", params, config),
        hideGeneralForumTopic: (params) =>
          executeTelegramRequest("hideGeneralForumTopic", params, config),
        unhideGeneralForumTopic: (params) =>
          executeTelegramRequest("unhideGeneralForumTopic", params, config),
        unpinAllGeneralForumTopicMessages: (params) =>
          executeTelegramRequest(
            "unpinAllGeneralForumTopicMessages",
            params,
            config
          ),
        answerCallbackQuery: (params) =>
          executeTelegramRequest("answerCallbackQuery", params, config),
        getUserChatBoosts: (params) =>
          executeTelegramRequest("getUserChatBoosts", params, config),
        getBusinessConnection: (params) =>
          executeTelegramRequest("getBusinessConnection", params, config),
        setMyCommands: (params) =>
          executeTelegramRequest("setMyCommands", params, config),
        deleteMyCommands: (params) =>
          executeTelegramRequest("deleteMyCommands", params, config),
        getMyCommands: (params) =>
          executeTelegramRequest("getMyCommands", params, config),
        setMyName: (params) =>
          executeTelegramRequest("setMyName", params, config),
        getMyName: (params) =>
          executeTelegramRequest("getMyName", params, config),
        setMyDescription: (params) =>
          executeTelegramRequest("setMyDescription", params, config),
        getMyDescription: (params) =>
          executeTelegramRequest("getMyDescription", params, config),
        setMyShortDescription: (params) =>
          executeTelegramRequest("setMyShortDescription", params, config),
        getMyShortDescription: (params) =>
          executeTelegramRequest("getMyShortDescription", params, config),
        setChatMenuButton: (params) =>
          executeTelegramRequest("setChatMenuButton", params, config),
        getChatMenuButton: (params) =>
          executeTelegramRequest("getChatMenuButton", params, config),
        setMyDefaultAdministratorRights: (params) =>
          executeTelegramRequest(
            "setMyDefaultAdministratorRights",
            params,
            config
          ),
        getMyDefaultAdministratorRights: (params) =>
          executeTelegramRequest(
            "getMyDefaultAdministratorRights",
            params,
            config
          ),
        getAvailableGifts: () =>
          executeTelegramRequest("getAvailableGifts", {}, config),
        sendGift: (params) =>
          executeTelegramRequest("sendGift", params, config),
        giftPremiumSubscription: (params) =>
          executeTelegramRequest("giftPremiumSubscription", params, config),
        verifyUser: (params) =>
          executeTelegramRequest("verifyUser", params, config),
        verifyChat: (params) =>
          executeTelegramRequest("verifyChat", params, config),
        removeUserVerification: () =>
          executeTelegramRequest("removeUserVerification", {}, config),
        removeChatVerification: () =>
          executeTelegramRequest("removeChatVerification", {}, config),
        readBusinessMessage: (params) =>
          executeTelegramRequest("readBusinessMessage", params, config),
        deleteBusinessMessages: (params) =>
          executeTelegramRequest("deleteBusinessMessages", params, config),
        setBusinessAccountName: (params) =>
          executeTelegramRequest("setBusinessAccountName", params, config),
        setBusinessAccountUsername: (params) =>
          executeTelegramRequest("setBusinessAccountUsername", params, config),
        setBusinessAccountBio: (params) =>
          executeTelegramRequest("setBusinessAccountBio", params, config),
        setBusinessAccountProfilePhoto: (params) =>
          executeTelegramRequest(
            "setBusinessAccountProfilePhoto",
            params,
            config
          ),
        removeBusinessAccountProfilePhoto: () =>
          executeTelegramRequest(
            "removeBusinessAccountProfilePhoto",
            {},
            config
          ),
        setBusinessAccountGiftSettings: (params) =>
          executeTelegramRequest(
            "setBusinessAccountGiftSettings",
            params,
            config
          ),
        getBusinessAccountStarBalance: () =>
          executeTelegramRequest("getBusinessAccountStarBalance", {}, config),
        transferBusinessAccountStars: (params) =>
          executeTelegramRequest(
            "transferBusinessAccountStars",
            params,
            config
          ),
        getBusinessAccountGifts: () =>
          executeTelegramRequest("getBusinessAccountGifts", {}, config),
        convertGiftToStars: (params) =>
          executeTelegramRequest("convertGiftToStars", params, config),
        upgradeGift: (params) =>
          executeTelegramRequest("upgradeGift", params, config),
        transferGift: (params) =>
          executeTelegramRequest("transferGift", params, config),
        postStory: (params) =>
          executeTelegramRequest("postStory", params, config),
        editStory: (params) =>
          executeTelegramRequest("editStory", params, config),
        deleteStory: (params) =>
          executeTelegramRequest("deleteStory", params, config),

        // Updating messages
        editMessageText: (params) =>
          executeTelegramRequest("editMessageText", params, config),
        editMessageCaption: (params) =>
          executeTelegramRequest("editMessageCaption", params, config),
        editMessageMedia: (params) =>
          executeTelegramRequest("editMessageMedia", params, config),
        editMessageLiveLocation: (params) =>
          executeTelegramRequest("editMessageLiveLocation", params, config),
        stopMessageLiveLocation: (params) =>
          executeTelegramRequest("stopMessageLiveLocation", params, config),
        editMessageChecklist: (params) =>
          executeTelegramRequest("editMessageChecklist", params, config),
        editMessageReplyMarkup: (params) =>
          executeTelegramRequest("editMessageReplyMarkup", params, config),
        stopPoll: (params) =>
          executeTelegramRequest("stopPoll", params, config),
        approveSuggestedPost: (params) =>
          executeTelegramRequest("approveSuggestedPost", params, config),
        declineSuggestedPost: (params) =>
          executeTelegramRequest("declineSuggestedPost", params, config),
        deleteMessage: (params) =>
          executeTelegramRequest("deleteMessage", params, config),
        deleteMessages: (params) =>
          executeTelegramRequest("deleteMessages", params, config),

        // Stickers
        sendSticker: (params) =>
          executeTelegramRequest("sendSticker", params, config),
        getStickerSet: (params) =>
          executeTelegramRequest("getStickerSet", params, config),
        getCustomEmojiStickers: (params) =>
          executeTelegramRequest("getCustomEmojiStickers", params, config),
        uploadStickerFile: (params) =>
          executeTelegramRequest("uploadStickerFile", params, config),
        createNewStickerSet: (params) =>
          executeTelegramRequest("createNewStickerSet", params, config),
        addStickerToSet: (params) =>
          executeTelegramRequest("addStickerToSet", params, config),
        setStickerPositionInSet: (params) =>
          executeTelegramRequest("setStickerPositionInSet", params, config),
        deleteStickerFromSet: (params) =>
          executeTelegramRequest("deleteStickerFromSet", params, config),
        replaceStickerInSet: (params) =>
          executeTelegramRequest("replaceStickerInSet", params, config),
        setStickerEmojiList: (params) =>
          executeTelegramRequest("setStickerEmojiList", params, config),
        setStickerKeywords: (params) =>
          executeTelegramRequest("setStickerKeywords", params, config),
        setStickerMaskPosition: (params) =>
          executeTelegramRequest("setStickerMaskPosition", params, config),
        setStickerSetTitle: (params) =>
          executeTelegramRequest("setStickerSetTitle", params, config),
        setStickerSetThumbnail: (params) =>
          executeTelegramRequest("setStickerSetThumbnail", params, config),
        setCustomEmojiStickerSetThumbnail: (params) =>
          executeTelegramRequest(
            "setCustomEmojiStickerSetThumbnail",
            params,
            config
          ),
        deleteStickerSet: (params) =>
          executeTelegramRequest("deleteStickerSet", params, config),

        // Inline mode
        answerInlineQuery: (params) =>
          executeTelegramRequest("answerInlineQuery", params, config),
        answerWebAppQuery: (params) =>
          executeTelegramRequest("answerWebAppQuery", params, config),
        savePreparedInlineMessage: (params) =>
          executeTelegramRequest("savePreparedInlineMessage", params, config),

        // Payments
        sendInvoice: (params) =>
          executeTelegramRequest("sendInvoice", params, config),
        createInvoiceLink: (params) =>
          executeTelegramRequest("createInvoiceLink", params, config),
        answerShippingQuery: (params) =>
          executeTelegramRequest("answerShippingQuery", params, config),
        answerPreCheckoutQuery: (params) =>
          executeTelegramRequest("answerPreCheckoutQuery", params, config),
        getMyStarBalance: () =>
          executeTelegramRequest("getMyStarBalance", {}, config),
        getStarTransactions: (params) =>
          executeTelegramRequest("getStarTransactions", params, config),
        refundStarPayment: (params) =>
          executeTelegramRequest("refundStarPayment", params, config),
        editUserStarSubscription: (params) =>
          executeTelegramRequest("editUserStarSubscription", params, config),

        // Telegram Passport
        setPassportDataErrors: (params) =>
          executeTelegramRequest("setPassportDataErrors", params, config),

        // Games
        sendGame: (params) =>
          executeTelegramRequest("sendGame", params, config),
        setGameScore: (params) =>
          executeTelegramRequest("setGameScore", params, config),
        getGameHighScores: (params) =>
          executeTelegramRequest("getGameHighScores", params, config),
      });
    }),
  })
) {}

/**
 * Live layer for the Telegram Bot API Service
 */
export const TelegramBotApiServiceLive: Layer.Layer<
  TelegramBotApiServiceContext,
  never,
  TelegramBotApiConfigContext
> = TelegramBotApiServiceImpl;

/**
 * The Telegram Bot API Service interface
 * Defines all available methods in the Telegram Bot API
 */
export interface TelegramBotApiService {
  // Getting updates
  getUpdates(
    params?: GetUpdatesParams
  ): Effect.Effect<Array<Update>, TelegramBotApiError>;
  setWebhook(
    params?: SetWebhookParams
  ): Effect.Effect<true, TelegramBotApiError>;
  deleteWebhook(
    params?: DeleteWebhookParams
  ): Effect.Effect<true, TelegramBotApiError>;
  getWebhookInfo(): Effect.Effect<WebhookInfo, TelegramBotApiError>;

  // Available methods
  getMe(): Effect.Effect<User, TelegramBotApiError>;
  logOut(): Effect.Effect<true, TelegramBotApiError>;
  close(): Effect.Effect<true, TelegramBotApiError>;
  sendMessage(
    params: SendMessageParams
  ): Effect.Effect<Message, TelegramBotApiError>;
  forwardMessage(
    params: ForwardMessageParams
  ): Effect.Effect<Message, TelegramBotApiError>;
  forwardMessages(
    params: ForwardMessagesParams
  ): Effect.Effect<Array<MessageId>, TelegramBotApiError>;
  copyMessage(
    params: CopyMessageParams
  ): Effect.Effect<MessageId, TelegramBotApiError>;
  copyMessages(
    params: CopyMessagesParams
  ): Effect.Effect<Array<MessageId>, TelegramBotApiError>;
  sendPhoto(
    params: SendPhotoParams
  ): Effect.Effect<Message, TelegramBotApiError>;
  sendAudio(
    params: SendAudioParams
  ): Effect.Effect<Message, TelegramBotApiError>;
  sendDocument(
    params: SendDocumentParams
  ): Effect.Effect<Message, TelegramBotApiError>;
  sendVideo(
    params: SendVideoParams
  ): Effect.Effect<Message, TelegramBotApiError>;
  sendAnimation(
    params: SendAnimationParams
  ): Effect.Effect<Message, TelegramBotApiError>;
  sendVoice(
    params: SendVoiceParams
  ): Effect.Effect<Message, TelegramBotApiError>;
  sendVideoNote(
    params: SendVideoNoteParams
  ): Effect.Effect<Message, TelegramBotApiError>;
  sendPaidMedia(
    params: SendPaidMediaParams
  ): Effect.Effect<Message, TelegramBotApiError>;
  sendMediaGroup(
    params: SendMediaGroupParams
  ): Effect.Effect<Array<Message | boolean>, TelegramBotApiError>;
  sendLocation(
    params: SendLocationParams
  ): Effect.Effect<Message, TelegramBotApiError>;
  sendVenue(
    params: SendVenueParams
  ): Effect.Effect<Message, TelegramBotApiError>;
  sendContact(
    params: SendContactParams
  ): Effect.Effect<Message, TelegramBotApiError>;
  sendPoll(params: SendPollParams): Effect.Effect<Message, TelegramBotApiError>;
  sendChecklist(
    params: SendChecklistParams
  ): Effect.Effect<Message, TelegramBotApiError>;
  sendDice(params: SendDiceParams): Effect.Effect<Message, TelegramBotApiError>;
  sendChatAction(
    params: SendChatActionParams
  ): Effect.Effect<true, TelegramBotApiError>;
  setMessageReaction(
    params: SetMessageReactionParams
  ): Effect.Effect<true, TelegramBotApiError>;
  getUserProfilePhotos(
    params: GetUserProfilePhotosParams
  ): Effect.Effect<UserProfilePhotos, TelegramBotApiError>;
  setUserEmojiStatus(
    params: SetUserEmojiStatusParams
  ): Effect.Effect<true, TelegramBotApiError>;
  getFile(params: GetFileParams): Effect.Effect<File, TelegramBotApiError>;
  banChatMember(
    params: BanChatMemberParams
  ): Effect.Effect<true, TelegramBotApiError>;
  unbanChatMember(
    params: UnbanChatMemberParams
  ): Effect.Effect<true, TelegramBotApiError>;
  restrictChatMember(
    params: RestrictChatMemberParams
  ): Effect.Effect<true, TelegramBotApiError>;
  promoteChatMember(
    params: PromoteChatMemberParams
  ): Effect.Effect<true, TelegramBotApiError>;
  setChatAdministratorCustomTitle(
    params: SetChatAdministratorCustomTitleParams
  ): Effect.Effect<true, TelegramBotApiError>;
  banChatSenderChat(
    params: BanChatSenderChatParams
  ): Effect.Effect<true, TelegramBotApiError>;
  unbanChatSenderChat(
    params: UnbanChatSenderChatParams
  ): Effect.Effect<true, TelegramBotApiError>;
  setChatPermissions(
    params: SetChatPermissionsParams
  ): Effect.Effect<true, TelegramBotApiError>;
  exportChatInviteLink(
    params: ExportChatInviteLinkParams
  ): Effect.Effect<String, TelegramBotApiError>;
  createChatInviteLink(
    params: CreateChatInviteLinkParams
  ): Effect.Effect<ChatInviteLink, TelegramBotApiError>;
  editChatInviteLink(
    params: EditChatInviteLinkParams
  ): Effect.Effect<ChatInviteLink, TelegramBotApiError>;
  createChatSubscriptionInviteLink(
    params: CreateChatSubscriptionInviteLinkParams
  ): Effect.Effect<ChatInviteLink, TelegramBotApiError>;
  editChatSubscriptionInviteLink(
    params: EditChatSubscriptionInviteLinkParams
  ): Effect.Effect<ChatInviteLink, TelegramBotApiError>;
  revokeChatInviteLink(
    params: RevokeChatInviteLinkParams
  ): Effect.Effect<ChatInviteLink, TelegramBotApiError>;
  approveChatJoinRequest(
    params: ApproveChatJoinRequestParams
  ): Effect.Effect<true, TelegramBotApiError>;
  declineChatJoinRequest(
    params: DeclineChatJoinRequestParams
  ): Effect.Effect<true, TelegramBotApiError>;
  setChatPhoto(
    params: SetChatPhotoParams
  ): Effect.Effect<true, TelegramBotApiError>;
  deleteChatPhoto(
    params: DeleteChatPhotoParams
  ): Effect.Effect<true, TelegramBotApiError>;
  setChatTitle(
    params: SetChatTitleParams
  ): Effect.Effect<true, TelegramBotApiError>;
  setChatDescription(
    params: SetChatDescriptionParams
  ): Effect.Effect<true, TelegramBotApiError>;
  pinChatMessage(
    params: PinChatMessageParams
  ): Effect.Effect<true, TelegramBotApiError>;
  unpinChatMessage(
    params: UnpinChatMessageParams
  ): Effect.Effect<true, TelegramBotApiError>;
  unpinAllChatMessages(
    params: UnpinAllChatMessagesParams
  ): Effect.Effect<true, TelegramBotApiError>;
  leaveChat(params: LeaveChatParams): Effect.Effect<true, TelegramBotApiError>;
  getChat(
    params: GetChatParams
  ): Effect.Effect<ChatFullInfo, TelegramBotApiError>;
  getChatAdministrators(
    params: GetChatAdministratorsParams
  ): Effect.Effect<Array<ChatMember>, TelegramBotApiError>;
  getChatMemberCount(
    params: GetChatMemberCountParams
  ): Effect.Effect<Integer, TelegramBotApiError>;
  getChatMember(
    params: GetChatMemberParams
  ): Effect.Effect<ChatMember, TelegramBotApiError>;
  setChatStickerSet(
    params: SetChatStickerSetParams
  ): Effect.Effect<true, TelegramBotApiError>;
  deleteChatStickerSet(
    params: DeleteChatStickerSetParams
  ): Effect.Effect<true, TelegramBotApiError>;
  getForumTopicIconStickers(): Effect.Effect<
    Array<Sticker>,
    TelegramBotApiError
  >;
  createForumTopic(
    params: CreateForumTopicParams
  ): Effect.Effect<ForumTopic, TelegramBotApiError>;
  editForumTopic(
    params: EditForumTopicParams
  ): Effect.Effect<true, TelegramBotApiError>;
  closeForumTopic(
    params: CloseForumTopicParams
  ): Effect.Effect<true, TelegramBotApiError>;
  reopenForumTopic(
    params: ReopenForumTopicParams
  ): Effect.Effect<true, TelegramBotApiError>;
  deleteForumTopic(
    params: DeleteForumTopicParams
  ): Effect.Effect<true, TelegramBotApiError>;
  unpinAllForumTopicMessages(
    params: UnpinAllForumTopicMessagesParams
  ): Effect.Effect<true, TelegramBotApiError>;
  editGeneralForumTopic(
    params: EditGeneralForumTopicParams
  ): Effect.Effect<true, TelegramBotApiError>;
  closeGeneralForumTopic(
    params: CloseGeneralForumTopicParams
  ): Effect.Effect<true, TelegramBotApiError>;
  reopenGeneralForumTopic(
    params: ReopenGeneralForumTopicParams
  ): Effect.Effect<true, TelegramBotApiError>;
  hideGeneralForumTopic(
    params: HideGeneralForumTopicParams
  ): Effect.Effect<true, TelegramBotApiError>;
  unhideGeneralForumTopic(
    params: UnhideGeneralForumTopicParams
  ): Effect.Effect<true, TelegramBotApiError>;
  unpinAllGeneralForumTopicMessages(
    params: UnpinAllGeneralForumTopicMessagesParams
  ): Effect.Effect<true, TelegramBotApiError>;
  answerCallbackQuery(
    params: AnswerCallbackQueryParams
  ): Effect.Effect<true, TelegramBotApiError>;
  getUserChatBoosts(
    params: GetUserChatBoostsParams
  ): Effect.Effect<UserChatBoosts, TelegramBotApiError>;
  getBusinessConnection(
    params: GetBusinessConnectionParams
  ): Effect.Effect<BusinessConnection, TelegramBotApiError>;
  setMyCommands(
    params: SetMyCommandsParams
  ): Effect.Effect<true, TelegramBotApiError>;
  deleteMyCommands(
    params?: DeleteMyCommandsParams
  ): Effect.Effect<true, TelegramBotApiError>;
  getMyCommands(
    params?: GetMyCommandsParams
  ): Effect.Effect<Array<BotCommand>, TelegramBotApiError>;
  setMyName(params?: SetMyNameParams): Effect.Effect<true, TelegramBotApiError>;
  getMyName(
    params?: GetMyNameParams
  ): Effect.Effect<BotName, TelegramBotApiError>;
  setMyDescription(
    params?: SetMyDescriptionParams
  ): Effect.Effect<true, TelegramBotApiError>;
  getMyDescription(
    params?: GetMyDescriptionParams
  ): Effect.Effect<BotDescription, TelegramBotApiError>;
  setMyShortDescription(
    params?: SetMyShortDescriptionParams
  ): Effect.Effect<true, TelegramBotApiError>;
  getMyShortDescription(
    params?: GetMyShortDescriptionParams
  ): Effect.Effect<BotShortDescription, TelegramBotApiError>;
  setChatMenuButton(
    params?: SetChatMenuButtonParams
  ): Effect.Effect<true, TelegramBotApiError>;
  getChatMenuButton(
    params?: GetChatMenuButtonParams
  ): Effect.Effect<MenuButton, TelegramBotApiError>;
  setMyDefaultAdministratorRights(
    params?: SetMyDefaultAdministratorRightsParams
  ): Effect.Effect<true, TelegramBotApiError>;
  getMyDefaultAdministratorRights(
    params?: GetMyDefaultAdministratorRightsParams
  ): Effect.Effect<ChatAdministratorRights, TelegramBotApiError>;
  getAvailableGifts(): Effect.Effect<Gifts, TelegramBotApiError>;
  sendGift(params: SendGiftParams): Effect.Effect<true, TelegramBotApiError>;
  giftPremiumSubscription(
    params: GiftPremiumSubscriptionParams
  ): Effect.Effect<true, TelegramBotApiError>;
  verifyUser(
    params: VerifyUserParams
  ): Effect.Effect<true, TelegramBotApiError>;
  verifyChat(
    params: VerifyChatParams
  ): Effect.Effect<true, TelegramBotApiError>;
  removeUserVerification(): Effect.Effect<true, TelegramBotApiError>;
  removeChatVerification(): Effect.Effect<true, TelegramBotApiError>;
  readBusinessMessage(
    params: ReadBusinessMessageParams
  ): Effect.Effect<true, TelegramBotApiError>;
  deleteBusinessMessages(
    params: DeleteBusinessMessagesParams
  ): Effect.Effect<true, TelegramBotApiError>;
  setBusinessAccountName(
    params: SetBusinessAccountNameParams
  ): Effect.Effect<true, TelegramBotApiError>;
  setBusinessAccountUsername(
    params: SetBusinessAccountUsernameParams
  ): Effect.Effect<true, TelegramBotApiError>;
  setBusinessAccountBio(
    params: SetBusinessAccountBioParams
  ): Effect.Effect<true, TelegramBotApiError>;
  setBusinessAccountProfilePhoto(
    params: SetBusinessAccountProfilePhotoParams
  ): Effect.Effect<true, TelegramBotApiError>;
  removeBusinessAccountProfilePhoto(): Effect.Effect<true, TelegramBotApiError>;
  setBusinessAccountGiftSettings(
    params: SetBusinessAccountGiftSettingsParams
  ): Effect.Effect<true, TelegramBotApiError>;
  getBusinessAccountStarBalance(): Effect.Effect<
    StarAmount,
    TelegramBotApiError
  >;
  transferBusinessAccountStars(
    params: TransferBusinessAccountStarsParams
  ): Effect.Effect<true, TelegramBotApiError>;
  getBusinessAccountGifts(): Effect.Effect<Gifts, TelegramBotApiError>;
  convertGiftToStars(
    params: ConvertGiftToStarsParams
  ): Effect.Effect<true, TelegramBotApiError>;
  upgradeGift(
    params: UpgradeGiftParams
  ): Effect.Effect<true, TelegramBotApiError>;
  transferGift(
    params: TransferGiftParams
  ): Effect.Effect<true, TelegramBotApiError>;
  postStory(
    params: PostStoryParams
  ): Effect.Effect<Message, TelegramBotApiError>;
  editStory(params: EditStoryParams): Effect.Effect<true, TelegramBotApiError>;
  deleteStory(
    params: DeleteStoryParams
  ): Effect.Effect<true, TelegramBotApiError>;

  // Updating messages
  editMessageText(
    params: EditMessageTextParams
  ): Effect.Effect<Message | true, TelegramBotApiError>;
  editMessageCaption(
    params: EditMessageCaptionParams
  ): Effect.Effect<Message | true, TelegramBotApiError>;
  editMessageMedia(
    params: EditMessageMediaParams
  ): Effect.Effect<Message | true, TelegramBotApiError>;
  editMessageLiveLocation(
    params: EditMessageLiveLocationParams
  ): Effect.Effect<Message | true, TelegramBotApiError>;
  stopMessageLiveLocation(
    params: StopMessageLiveLocationParams
  ): Effect.Effect<Message | true, TelegramBotApiError>;
  editMessageChecklist(
    params: EditMessageChecklistParams
  ): Effect.Effect<Message | true, TelegramBotApiError>;
  editMessageReplyMarkup(
    params: EditMessageReplyMarkupParams
  ): Effect.Effect<Message | true, TelegramBotApiError>;
  stopPoll(params: StopPollParams): Effect.Effect<Poll, TelegramBotApiError>;
  approveSuggestedPost(
    params: ApproveSuggestedPostParams
  ): Effect.Effect<true, TelegramBotApiError>;
  declineSuggestedPost(
    params: DeclineSuggestedPostParams
  ): Effect.Effect<true, TelegramBotApiError>;
  deleteMessage(
    params: DeleteMessageParams
  ): Effect.Effect<true, TelegramBotApiError>;
  deleteMessages(
    params: DeleteMessagesParams
  ): Effect.Effect<true, TelegramBotApiError>;

  // Stickers
  sendSticker(
    params: SendStickerParams
  ): Effect.Effect<Message, TelegramBotApiError>;
  getStickerSet(
    params: GetStickerSetParams
  ): Effect.Effect<StickerSet, TelegramBotApiError>;
  getCustomEmojiStickers(
    params: GetCustomEmojiStickersParams
  ): Effect.Effect<Array<Sticker>, TelegramBotApiError>;
  uploadStickerFile(
    params: UploadStickerFileParams
  ): Effect.Effect<File, TelegramBotApiError>;
  createNewStickerSet(
    params: CreateNewStickerSetParams
  ): Effect.Effect<true, TelegramBotApiError>;
  addStickerToSet(
    params: AddStickerToSetParams
  ): Effect.Effect<true, TelegramBotApiError>;
  setStickerPositionInSet(
    params: SetStickerPositionInSetParams
  ): Effect.Effect<true, TelegramBotApiError>;
  deleteStickerFromSet(
    params: DeleteStickerFromSetParams
  ): Effect.Effect<true, TelegramBotApiError>;
  replaceStickerInSet(
    params: ReplaceStickerInSetParams
  ): Effect.Effect<true, TelegramBotApiError>;
  setStickerEmojiList(
    params: SetStickerEmojiListParams
  ): Effect.Effect<true, TelegramBotApiError>;
  setStickerKeywords(
    params: SetStickerKeywordsParams
  ): Effect.Effect<true, TelegramBotApiError>;
  setStickerMaskPosition(
    params: SetStickerMaskPositionParams
  ): Effect.Effect<true, TelegramBotApiError>;
  setStickerSetTitle(
    params: SetStickerSetTitleParams
  ): Effect.Effect<true, TelegramBotApiError>;
  setStickerSetThumbnail(
    params: SetStickerSetThumbnailParams
  ): Effect.Effect<true, TelegramBotApiError>;
  setCustomEmojiStickerSetThumbnail(
    params: SetCustomEmojiStickerSetThumbnailParams
  ): Effect.Effect<true, TelegramBotApiError>;
  deleteStickerSet(
    params: DeleteStickerSetParams
  ): Effect.Effect<true, TelegramBotApiError>;

  // Inline mode
  answerInlineQuery(
    params: AnswerInlineQueryParams
  ): Effect.Effect<true, TelegramBotApiError>;
  answerWebAppQuery(
    params: AnswerWebAppQueryParams
  ): Effect.Effect<SentWebAppMessage, TelegramBotApiError>;
  savePreparedInlineMessage(
    params: SavePreparedInlineMessageParams
  ): Effect.Effect<PreparedInlineMessage, TelegramBotApiError>;

  // Payments
  sendInvoice(
    params: SendInvoiceParams
  ): Effect.Effect<Message, TelegramBotApiError>;
  createInvoiceLink(
    params: CreateInvoiceLinkParams
  ): Effect.Effect<String, TelegramBotApiError>;
  answerShippingQuery(
    params: AnswerShippingQueryParams
  ): Effect.Effect<true, TelegramBotApiError>;
  answerPreCheckoutQuery(
    params: AnswerPreCheckoutQueryParams
  ): Effect.Effect<true, TelegramBotApiError>;
  getMyStarBalance(): Effect.Effect<StarAmount, TelegramBotApiError>;
  getStarTransactions(
    params: GetStarTransactionsParams
  ): Effect.Effect<StarTransactions, TelegramBotApiError>;
  refundStarPayment(
    params: RefundStarPaymentParams
  ): Effect.Effect<true, TelegramBotApiError>;
  editUserStarSubscription(
    params: EditUserStarSubscriptionParams
  ): Effect.Effect<true, TelegramBotApiError>;

  // Telegram Passport
  setPassportDataErrors(
    params: SetPassportDataErrorsParams
  ): Effect.Effect<true, TelegramBotApiError>;

  // Games
  sendGame(params: SendGameParams): Effect.Effect<Message, TelegramBotApiError>;
  setGameScore(
    params: SetGameScoreParams
  ): Effect.Effect<Message | true, TelegramBotApiError>;
  getGameHighScores(
    params: GetGameHighScoresParams
  ): Effect.Effect<Array<GameHighScore>, TelegramBotApiError>;
}

/**
 * Configuration for the Telegram Bot API Service
 */
export interface TelegramBotApiConfig {
  readonly token: Secret.Secret;
  readonly apiBaseUrl: string;
  readonly timeout: number;
  readonly retryAttempts: number;
  readonly retryDelay: number;
  readonly rateLimitDelay: number;
}

export class TelegramBotApiServiceContext extends Context.Tag(
  "@services/TelegramBotApiService"
)<TelegramBotApiServiceContext, TelegramBotApiService>() {}

export class TelegramBotApiConfigContext extends Context.Tag(
  "@services/TelegramBotApiConfig"
)<TelegramBotApiConfigContext, TelegramBotApiConfig>() {}

// =============================================================================
// Configuration Layer
// =============================================================================

/**
 * Configuration layer that loads settings from environment variables
 */
export const TelegramBotApiConfigLive: Layer.Layer<
  TelegramBotApiConfigContext,
  Config.ConfigError
> = Layer.effect(
  TelegramBotApiConfigContext,
  Effect.gen(function* (_) {
    const token = yield* _(Config.secret("TELEGRAM_BOT_TOKEN"));
    const apiBaseUrl = yield* _(
      Config.withDefault(
        Config.string("TELEGRAM_API_BASE_URL"),
        "https://api.telegram.org/bot"
      )
    );
    const timeout = yield* _(
      Config.withDefault(Config.number("TELEGRAM_REQUEST_TIMEOUT"), 30000)
    );
    const retryAttempts = yield* _(
      Config.withDefault(Config.number("TELEGRAM_RETRY_ATTEMPTS"), 3)
    );
    const retryDelay = yield* _(
      Config.withDefault(Config.number("TELEGRAM_RETRY_DELAY"), 1000)
    );
    const rateLimitDelay = yield* _(
      Config.withDefault(Config.number("TELEGRAM_RATE_LIMIT_DELAY"), 1000)
    );

    // Validate that the token is not empty
    if (Secret.value(token) === "") {
      throw new Error("TELEGRAM_BOT_TOKEN must not be empty");
    }

    return {
      token,
      apiBaseUrl,
      timeout,
      retryAttempts,
      retryDelay,
      rateLimitDelay,
    };
  })
);

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
  params: unknown,
  config: TelegramBotApiConfig
): HttpClientRequest.HttpClientRequest => {
  const tokenValue = Secret.value(config.token);
  const url = `${config.apiBaseUrl}${tokenValue}/${method}`;

  // Determine if we need multipart/form-data (for file uploads)
  const hasFile = containsFile(params);

  if (hasFile) {
    // For file uploads, use multipart/form-data
    const formData = buildFormData(params);
    return HttpClientRequest.post(url).pipe(
      HttpClientRequest.bodyFormData(formData),
      HttpClientRequest.timeout(config.timeout)
    );
  } else {
    // For regular requests, use JSON
    return HttpClientRequest.post(url).pipe(
      HttpClientRequest.bodyJson(params),
      HttpClientRequest.setHeader("Content-Type", "application/json"),
      HttpClientRequest.timeout(config.timeout)
    );
  }
};

/**
 * Determines if the parameters contain a file (input file)
 * @param params The parameters to check
 * @returns Boolean indicating if the params contain a file
 */
const containsFile = (params: unknown): boolean => {
  if (typeof params !== "object" || params === null) {
    return false;
  }

  const obj = params as Record<string, unknown>;
  for (const key in obj) {
    const value = obj[key];
    if (value && typeof value === "object") {
      // Check if it's an InputFile type
      if ("file" in value || "fileId" in value || "content" in value) {
        return true;
      }
      // Recursively check nested objects
      if (containsFile(value)) {
        return true;
      }
    } else if (Array.isArray(value)) {
      // Check arrays of objects
      return value.some((item) => containsFile(item));
    }
  }

  return false;
};

/**
 * Builds form data for file uploads
 * @param params The parameters to convert to form data
 * @returns FormData object
 */
const buildFormData = (params: unknown): FormData => {
  const formData = new FormData();

  if (typeof params !== "object" || params === null) {
    return formData;
  }

  const obj = params as Record<string, unknown>;
  for (const key in obj) {
    const value = obj[key];
    if (value !== undefined && value !== null) {
      if (typeof value === "object") {
        // Handle InputFile objects
        if ("file" in value) {
          // File object
          formData.append(key, (value as { file: File }).file);
        } else if ("content" in value) {
          // File content as string or buffer
          const content = (value as { content: string | Buffer }).content;
          if (typeof content === "string") {
            formData.append(key, new Blob([content]), key);
          } else {
            // If content is a buffer, handle accordingly
            formData.append(key, new Blob([content]), key);
          }
        } else {
          // For other objects, stringify them
          formData.append(key, JSON.stringify(value));
        }
      } else {
        // For primitive values, append directly
        formData.append(key, String(value));
      }
    }
  }

  return formData;
};

/**
 * Handles the HTTP response from a Telegram API request
 * @param response The HTTP response to process
 * @returns The parsed JSON response from Telegram API
 */
const handleTelegramResponse = <T>(
  response: HttpClientResponse.HttpClientResponse
): Effect.Effect<T, TelegramBotApiError> => {
  return pipe(
    Effect.tryPromise({
      try: () => response.json(),
      catch: (error) =>
        new TelegramBotApiInvalidResponseError({
          message: `Failed to parse response JSON: ${String(error)}`,
          cause: error,
        }),
    }),
    Effect.flatMap((json) => {
      if (
        typeof json === "object" &&
        json !== null &&
        "ok" in json &&
        json.ok
      ) {
        // Success response
        return Effect.succeed(json.result as T);
      } else if (
        typeof json === "object" &&
        json !== null &&
        "ok" in json &&
        !json.ok &&
        "description" in json
      ) {
        // Error response from Telegram API
        const errorCode = json.error_code ? String(json.error_code) : undefined;
        const description = String(json.description);
        const message = errorCode
          ? `${errorCode}: ${description}`
          : description;

        // Check for specific error conditions
        if (
          errorCode === "409" &&
          description.toLowerCase().includes("conflict")
        ) {
          return Effect.fail(
            new TelegramBotApiError({ message: `Bot conflict: ${message}` })
          );
        } else if (errorCode === "401" || errorCode === "403") {
          return Effect.fail(
            new TelegramBotApiUnauthorizedError({
              message: `Unauthorized: ${message}`,
            })
          );
        } else if (errorCode === "429") {
          const retryAfter =
            json.parameters && "retry_after" in json.parameters
              ? ((json.parameters as any).retry_after as number)
              : undefined;
          return Effect.fail(
            new TelegramBotApiRateLimitError({
              message: `Rate limited: ${message}`,
              retryAfter,
            })
          );
        } else {
          return Effect.fail(
            new TelegramBotApiMethodError({
              message,
              method: (json.parameters?.method as string) || "unknown",
            })
          );
        }
      } else {
        // Invalid response format
        return Effect.fail(
          new TelegramBotApiInvalidResponseError({
            message: `Invalid response format: ${JSON.stringify(json)}`,
            response: json,
          })
        );
      }
    }),
    Effect.catchAll((error) => {
      if (error._tag === "TelegramBotApiError") {
        return Effect.fail(error);
      }
      return Effect.fail(
        new TelegramBotApiError({
          message: `Unexpected error processing response: ${String(error)}`,
        })
      );
    })
  );
};

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
  const request = makeTelegramRequest(method, params, config);

  return pipe(
    Effect.tryPromise({
      try: () => HttpClient.execute(request),
      catch: (error) =>
        new TelegramBotApiNetworkError({
          message: `Network error: ${String(error)}`,
          cause: error,
        }),
    }),
    Effect.flatMap((response) => handleTelegramResponse<T>(response)),
    Effect.retry({
      times: config.retryAttempts,
      delay: config.retryDelay,
      until: (error) => {
        // Don't retry on unauthorized or method-specific errors
        if (
          error._tag === "TelegramBotApiUnauthorizedError" ||
          error._tag === "TelegramBotApiMethodError"
        ) {
          return true;
        }
        // Retry on network errors and rate limits
        return (
          error._tag === "TelegramBotApiNetworkError" ||
          error._tag === "TelegramBotApiRateLimitError"
        );
      },
    }),
    Effect.catchAll((error) => {
      if (error._tag === "TelegramBotApiError") {
        return Effect.fail(error);
      }
      return Effect.fail(
        new TelegramBotApiError({
          message: `Unexpected error: ${String(error)}`,
        })
      );
    })
  );
};

// =============================================================================
// Implementation Layer
// =============================================================================

/**
 * Live implementation of the Telegram Bot API Service
 */
export class TelegramBotApiServiceImpl extends Effect.Service<TelegramBotApiServiceContext>()(
  "TelegramBotApiService",
  (_) => ({
    create: Effect.gen(function* (_) {
      const config = yield* _(TelegramBotApiConfigContext);

      return TelegramBotApiService.of({
        // Getting updates
        getUpdates: (params) =>
          executeTelegramRequest("getUpdates", params, config),
        setWebhook: (params) =>
          executeTelegramRequest("setWebhook", params, config),
        deleteWebhook: (params) =>
          executeTelegramRequest("deleteWebhook", params, config),
        getWebhookInfo: () =>
          executeTelegramRequest("getWebhookInfo", {}, config),

        // Available methods
        getMe: () => executeTelegramRequest("getMe", {}, config),
        logOut: () => executeTelegramRequest("logOut", {}, config),
        close: () => executeTelegramRequest("close", {}, config),
        sendMessage: (params) =>
          executeTelegramRequest("sendMessage", params, config),
        forwardMessage: (params) =>
          executeTelegramRequest("forwardMessage", params, config),
        forwardMessages: (params) =>
          executeTelegramRequest("forwardMessages", params, config),
        copyMessage: (params) =>
          executeTelegramRequest("copyMessage", params, config),
        copyMessages: (params) =>
          executeTelegramRequest("copyMessages", params, config),
        sendPhoto: (params) =>
          executeTelegramRequest("sendPhoto", params, config),
        sendAudio: (params) =>
          executeTelegramRequest("sendAudio", params, config),
        sendDocument: (params) =>
          executeTelegramRequest("sendDocument", params, config),
        sendVideo: (params) =>
          executeTelegramRequest("sendVideo", params, config),
        sendAnimation: (params) =>
          executeTelegramRequest("sendAnimation", params, config),
        sendVoice: (params) =>
          executeTelegramRequest("sendVoice", params, config),
        sendVideoNote: (params) =>
          executeTelegramRequest("sendVideoNote", params, config),
        sendPaidMedia: (params) =>
          executeTelegramRequest("sendPaidMedia", params, config),
        sendMediaGroup: (params) =>
          executeTelegramRequest("sendMediaGroup", params, config),
        sendLocation: (params) =>
          executeTelegramRequest("sendLocation", params, config),
        sendVenue: (params) =>
          executeTelegramRequest("sendVenue", params, config),
        sendContact: (params) =>
          executeTelegramRequest("sendContact", params, config),
        sendPoll: (params) =>
          executeTelegramRequest("sendPoll", params, config),
        sendChecklist: (params) =>
          executeTelegramRequest("sendChecklist", params, config),
        sendDice: (params) =>
          executeTelegramRequest("sendDice", params, config),
        sendChatAction: (params) =>
          executeTelegramRequest("sendChatAction", params, config),
        setMessageReaction: (params) =>
          executeTelegramRequest("setMessageReaction", params, config),
        getUserProfilePhotos: (params) =>
          executeTelegramRequest("getUserProfilePhotos", params, config),
        setUserEmojiStatus: (params) =>
          executeTelegramRequest("setUserEmojiStatus", params, config),
        getFile: (params) => executeTelegramRequest("getFile", params, config),
        banChatMember: (params) =>
          executeTelegramRequest("banChatMember", params, config),
        unbanChatMember: (params) =>
          executeTelegramRequest("unbanChatMember", params, config),
        restrictChatMember: (params) =>
          executeTelegramRequest("restrictChatMember", params, config),
        promoteChatMember: (params) =>
          executeTelegramRequest("promoteChatMember", params, config),
        setChatAdministratorCustomTitle: (params) =>
          executeTelegramRequest(
            "setChatAdministratorCustomTitle",
            params,
            config
          ),
        banChatSenderChat: (params) =>
          executeTelegramRequest("banChatSenderChat", params, config),
        unbanChatSenderChat: (params) =>
          executeTelegramRequest("unbanChatSenderChat", params, config),
        setChatPermissions: (params) =>
          executeTelegramRequest("setChatPermissions", params, config),
        exportChatInviteLink: (params) =>
          executeTelegramRequest("exportChatInviteLink", params, config),
        createChatInviteLink: (params) =>
          executeTelegramRequest("createChatInviteLink", params, config),
        editChatInviteLink: (params) =>
          executeTelegramRequest("editChatInviteLink", params, config),
        createChatSubscriptionInviteLink: (params) =>
          executeTelegramRequest(
            "createChatSubscriptionInviteLink",
            params,
            config
          ),
        editChatSubscriptionInviteLink: (params) =>
          executeTelegramRequest(
            "editChatSubscriptionInviteLink",
            params,
            config
          ),
        revokeChatInviteLink: (params) =>
          executeTelegramRequest("revokeChatInviteLink", params, config),
        approveChatJoinRequest: (params) =>
          executeTelegramRequest("approveChatJoinRequest", params, config),
        declineChatJoinRequest: (params) =>
          executeTelegramRequest("declineChatJoinRequest", params, config),
        setChatPhoto: (params) =>
          executeTelegramRequest("setChatPhoto", params, config),
        deleteChatPhoto: (params) =>
          executeTelegramRequest("deleteChatPhoto", params, config),
        setChatTitle: (params) =>
          executeTelegramRequest("setChatTitle", params, config),
        setChatDescription: (params) =>
          executeTelegramRequest("setChatDescription", params, config),
        pinChatMessage: (params) =>
          executeTelegramRequest("pinChatMessage", params, config),
        unpinChatMessage: (params) =>
          executeTelegramRequest("unpinChatMessage", params, config),
        unpinAllChatMessages: (params) =>
          executeTelegramRequest("unpinAllChatMessages", params, config),
        leaveChat: (params) =>
          executeTelegramRequest("leaveChat", params, config),
        getChat: (params) => executeTelegramRequest("getChat", params, config),
        getChatAdministrators: (params) =>
          executeTelegramRequest("getChatAdministrators", params, config),
        getChatMemberCount: (params) =>
          executeTelegramRequest("getChatMemberCount", params, config),
        getChatMember: (params) =>
          executeTelegramRequest("getChatMember", params, config),
        setChatStickerSet: (params) =>
          executeTelegramRequest("setChatStickerSet", params, config),
        deleteChatStickerSet: (params) =>
          executeTelegramRequest("deleteChatStickerSet", params, config),
        getForumTopicIconStickers: () =>
          executeTelegramRequest("getForumTopicIconStickers", {}, config),
        createForumTopic: (params) =>
          executeTelegramRequest("createForumTopic", params, config),
        editForumTopic: (params) =>
          executeTelegramRequest("editForumTopic", params, config),
        closeForumTopic: (params) =>
          executeTelegramRequest("closeForumTopic", params, config),
        reopenForumTopic: (params) =>
          executeTelegramRequest("reopenForumTopic", params, config),
        deleteForumTopic: (params) =>
          executeTelegramRequest("deleteForumTopic", params, config),
        unpinAllForumTopicMessages: (params) =>
          executeTelegramRequest("unpinAllForumTopicMessages", params, config),
        editGeneralForumTopic: (params) =>
          executeTelegramRequest("editGeneralForumTopic", params, config),
        closeGeneralForumTopic: (params) =>
          executeTelegramRequest("closeGeneralForumTopic", params, config),
        reopenGeneralForumTopic: (params) =>
          executeTelegramRequest("reopenGeneralForumTopic", params, config),
        hideGeneralForumTopic: (params) =>
          executeTelegramRequest("hideGeneralForumTopic", params, config),
        unhideGeneralForumTopic: (params) =>
          executeTelegramRequest("unhideGeneralForumTopic", params, config),
        unpinAllGeneralForumTopicMessages: (params) =>
          executeTelegramRequest(
            "unpinAllGeneralForumTopicMessages",
            params,
            config
          ),
        answerCallbackQuery: (params) =>
          executeTelegramRequest("answerCallbackQuery", params, config),
        getUserChatBoosts: (params) =>
          executeTelegramRequest("getUserChatBoosts", params, config),
        getBusinessConnection: (params) =>
          executeTelegramRequest("getBusinessConnection", params, config),
        setMyCommands: (params) =>
          executeTelegramRequest("setMyCommands", params, config),
        deleteMyCommands: (params) =>
          executeTelegramRequest("deleteMyCommands", params, config),
        getMyCommands: (params) =>
          executeTelegramRequest("getMyCommands", params, config),
        setMyName: (params) =>
          executeTelegramRequest("setMyName", params, config),
        getMyName: (params) =>
          executeTelegramRequest("getMyName", params, config),
        setMyDescription: (params) =>
          executeTelegramRequest("setMyDescription", params, config),
        getMyDescription: (params) =>
          executeTelegramRequest("getMyDescription", params, config),
        setMyShortDescription: (params) =>
          executeTelegramRequest("setMyShortDescription", params, config),
        getMyShortDescription: (params) =>
          executeTelegramRequest("getMyShortDescription", params, config),
        setChatMenuButton: (params) =>
          executeTelegramRequest("setChatMenuButton", params, config),
        getChatMenuButton: (params) =>
          executeTelegramRequest("getChatMenuButton", params, config),
        setMyDefaultAdministratorRights: (params) =>
          executeTelegramRequest(
            "setMyDefaultAdministratorRights",
            params,
            config
          ),
        getMyDefaultAdministratorRights: (params) =>
          executeTelegramRequest(
            "getMyDefaultAdministratorRights",
            params,
            config
          ),
        getAvailableGifts: () =>
          executeTelegramRequest("getAvailableGifts", {}, config),
        sendGift: (params) =>
          executeTelegramRequest("sendGift", params, config),
        giftPremiumSubscription: (params) =>
          executeTelegramRequest("giftPremiumSubscription", params, config),
        verifyUser: (params) =>
          executeTelegramRequest("verifyUser", params, config),
        verifyChat: (params) =>
          executeTelegramRequest("verifyChat", params, config),
        removeUserVerification: () =>
          executeTelegramRequest("removeUserVerification", {}, config),
        removeChatVerification: () =>
          executeTelegramRequest("removeChatVerification", {}, config),
        readBusinessMessage: (params) =>
          executeTelegramRequest("readBusinessMessage", params, config),
        deleteBusinessMessages: (params) =>
          executeTelegramRequest("deleteBusinessMessages", params, config),
        setBusinessAccountName: (params) =>
          executeTelegramRequest("setBusinessAccountName", params, config),
        setBusinessAccountUsername: (params) =>
          executeTelegramRequest("setBusinessAccountUsername", params, config),
        setBusinessAccountBio: (params) =>
          executeTelegramRequest("setBusinessAccountBio", params, config),
        setBusinessAccountProfilePhoto: (params) =>
          executeTelegramRequest(
            "setBusinessAccountProfilePhoto",
            params,
            config
          ),
        removeBusinessAccountProfilePhoto: () =>
          executeTelegramRequest(
            "removeBusinessAccountProfilePhoto",
            {},
            config
          ),
        setBusinessAccountGiftSettings: (params) =>
          executeTelegramRequest(
            "setBusinessAccountGiftSettings",
            params,
            config
          ),
        getBusinessAccountStarBalance: () =>
          executeTelegramRequest("getBusinessAccountStarBalance", {}, config),
        transferBusinessAccountStars: (params) =>
          executeTelegramRequest(
            "transferBusinessAccountStars",
            params,
            config
          ),
        getBusinessAccountGifts: () =>
          executeTelegramRequest("getBusinessAccountGifts", {}, config),
        convertGiftToStars: (params) =>
          executeTelegramRequest("convertGiftToStars", params, config),
        upgradeGift: (params) =>
          executeTelegramRequest("upgradeGift", params, config),
        transferGift: (params) =>
          executeTelegramRequest("transferGift", params, config),
        postStory: (params) =>
          executeTelegramRequest("postStory", params, config),
        editStory: (params) =>
          executeTelegramRequest("editStory", params, config),
        deleteStory: (params) =>
          executeTelegramRequest("deleteStory", params, config),

        // Updating messages
        editMessageText: (params) =>
          executeTelegramRequest("editMessageText", params, config),
        editMessageCaption: (params) =>
          executeTelegramRequest("editMessageCaption", params, config),
        editMessageMedia: (params) =>
          executeTelegramRequest("editMessageMedia", params, config),
        editMessageLiveLocation: (params) =>
          executeTelegramRequest("editMessageLiveLocation", params, config),
        stopMessageLiveLocation: (params) =>
          executeTelegramRequest("stopMessageLiveLocation", params, config),
        editMessageChecklist: (params) =>
          executeTelegramRequest("editMessageChecklist", params, config),
        editMessageReplyMarkup: (params) =>
          executeTelegramRequest("editMessageReplyMarkup", params, config),
        stopPoll: (params) =>
          executeTelegramRequest("stopPoll", params, config),
        approveSuggestedPost: (params) =>
          executeTelegramRequest("approveSuggestedPost", params, config),
        declineSuggestedPost: (params) =>
          executeTelegramRequest("declineSuggestedPost", params, config),
        deleteMessage: (params) =>
          executeTelegramRequest("deleteMessage", params, config),
        deleteMessages: (params) =>
          executeTelegramRequest("deleteMessages", params, config),

        // Stickers
        sendSticker: (params) =>
          executeTelegramRequest("sendSticker", params, config),
        getStickerSet: (params) =>
          executeTelegramRequest("getStickerSet", params, config),
        getCustomEmojiStickers: (params) =>
          executeTelegramRequest("getCustomEmojiStickers", params, config),
        uploadStickerFile: (params) =>
          executeTelegramRequest("uploadStickerFile", params, config),
        createNewStickerSet: (params) =>
          executeTelegramRequest("createNewStickerSet", params, config),
        addStickerToSet: (params) =>
          executeTelegramRequest("addStickerToSet", params, config),
        setStickerPositionInSet: (params) =>
          executeTelegramRequest("setStickerPositionInSet", params, config),
        deleteStickerFromSet: (params) =>
          executeTelegramRequest("deleteStickerFromSet", params, config),
        replaceStickerInSet: (params) =>
          executeTelegramRequest("replaceStickerInSet", params, config),
        setStickerEmojiList: (params) =>
          executeTelegramRequest("setStickerEmojiList", params, config),
        setStickerKeywords: (params) =>
          executeTelegramRequest("setStickerKeywords", params, config),
        setStickerMaskPosition: (params) =>
          executeTelegramRequest("setStickerMaskPosition", params, config),
        setStickerSetTitle: (params) =>
          executeTelegramRequest("setStickerSetTitle", params, config),
        setStickerSetThumbnail: (params) =>
          executeTelegramRequest("setStickerSetThumbnail", params, config),
        setCustomEmojiStickerSetThumbnail: (params) =>
          executeTelegramRequest(
            "setCustomEmojiStickerSetThumbnail",
            params,
            config
          ),
        deleteStickerSet: (params) =>
          executeTelegramRequest("deleteStickerSet", params, config),

        // Inline mode
        answerInlineQuery: (params) =>
          executeTelegramRequest("answerInlineQuery", params, config),
        answerWebAppQuery: (params) =>
          executeTelegramRequest("answerWebAppQuery", params, config),
        savePreparedInlineMessage: (params) =>
          executeTelegramRequest("savePreparedInlineMessage", params, config),

        // Payments
        sendInvoice: (params) =>
          executeTelegramRequest("sendInvoice", params, config),
        createInvoiceLink: (params) =>
          executeTelegramRequest("createInvoiceLink", params, config),
        answerShippingQuery: (params) =>
          executeTelegramRequest("answerShippingQuery", params, config),
        answerPreCheckoutQuery: (params) =>
          executeTelegramRequest("answerPreCheckoutQuery", params, config),
        getMyStarBalance: () =>
          executeTelegramRequest("getMyStarBalance", {}, config),
        getStarTransactions: (params) =>
          executeTelegramRequest("getStarTransactions", params, config),
        refundStarPayment: (params) =>
          executeTelegramRequest("refundStarPayment", params, config),
        editUserStarSubscription: (params) =>
          executeTelegramRequest("editUserStarSubscription", params, config),

        // Telegram Passport
        setPassportDataErrors: (params) =>
          executeTelegramRequest("setPassportDataErrors", params, config),

        // Games
        sendGame: (params) =>
          executeTelegramRequest("sendGame", params, config),
        setGameScore: (params) =>
          executeTelegramRequest("setGameScore", params, config),
        getGameHighScores: (params) =>
          executeTelegramRequest("getGameHighScores", params, config),
      });
    }),
  })
) {}

/**
 * Live layer for the Telegram Bot API Service
 */
export const TelegramBotApiServiceLive: Layer.Layer<
  TelegramBotApiServiceContext,
  never,
  TelegramBotApiConfigContext
> = TelegramBotApiServiceImpl;
