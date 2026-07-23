# Vocabulary Flashcards Bot — Bot specification

**Archetype:** education

**Voice:** encouraging and concise — write every user-facing message, button label, error, and empty state in this voice.

A private Telegram bot that teaches vocabulary using spaced-repetition flashcards. Users can create decks and cards, review due cards with ease ratings, set daily limits, receive reminders, and track progress. Sessions persist for resuming later.

> This is the complete contract for the bot. Implement EVERY entry point, flow, feature, integration, and edge case below. The completeness review checks the bot against this document after each build pass.

## Primary audience

- language learners
- students
- self-learners

## Success criteria

- Users complete daily review sessions with 80%+ retention rate
- Users maintain 7-day+ learning streaks
- Users create and maintain 3+ custom decks

## Entry points

Every feature must be reachable from the bot's command/button surface (button-first; only /start and /help are slash commands).

- **/start** (command, actor: user, command: /start) — Open the main menu
- **Create Deck** (button, actor: user, callback: deck:create) — Start creating a new deck
- **Add Card** (button, actor: user, callback: card:add) — Add a new card to the current deck
- **Browse Decks** (button, actor: user, callback: deck:list) — View and select from existing decks
- **Start Review** (button, actor: user, callback: review:start) — Begin a spaced-repetition review session
- **View Progress** (button, actor: user, callback: progress:view) — Show learning statistics and streaks
- **Settings** (button, actor: user, callback: settings:open) — Configure daily limits and reminders

## Flows

### onboarding
_Trigger:_ /start

1. Welcome message
2. Choose starter deck or create new
3. Set daily new-card limit
4. Set reminder time

_Data touched:_ User

### review_session
_Trigger:_ review:start

1. Show card prompt
2. Show answer and example
3. Rate card (Again/Hard/Good/Easy)
4. Update scheduling
5. Show next card

_Data touched:_ Card, Review session

### deck_management
_Trigger:_ deck:list

1. List decks with pagination
2. Select deck to view/edit
3. Add/remove cards
4. Edit deck settings

_Data touched:_ Deck

### card_management
_Trigger:_ card:add

1. Enter word
2. Enter translation
3. Enter example (optional)
4. Save card

_Data touched:_ Card

### reminder_flow
_Trigger:_ scheduled_reminder

1. Send reminder message
2. Show due count
3. Offer 'Start Review' button

_Data touched:_ User

## Data entities

Durable data (must survive a restart) uses the toolkit's persistent store, never in-memory maps.

- **User** _(retention: persistent)_ — User account and settings
  - fields: timezone, daily_new_card_limit, reminder_time, language_directions
- **Deck** _(retention: persistent)_ — Named collection of cards
  - fields: name, is_starter_deck, user_id
- **Card** _(retention: persistent)_ — Vocabulary card with scheduling metadata
  - fields: word, translation, example, interval, ease, repetition_count, next_review
- **Review session** _(retention: session)_ — Transient state for active review sessions
  - fields: current_card_index, unsent_progress

## Integrations

- **Telegram** (required) — Bot API messaging
Call external APIs against their real contract (correct endpoints, ids, params); credentials from env. Do not fake responses.

## Owner controls

- Create/delete decks
- Edit card content
- Set daily limits
- Configure reminders
- View progress metrics

## Notifications

- Daily review reminder with due count
- Session resumption prompt after pause
- Progress milestones (e.g., 100 cards learned)

## Permissions & privacy

- Private decks and progress data
- No sharing by default
- User data stored securely

## Edge cases

- Empty decks (show friendly suggestion)
- Mid-session disconnects (preserve state)
- No due cards on review start (show motivational message)

## Required tests

- End-to-end review session with resume
- Deck creation and card management
- Reminder scheduling and delivery
- Progress tracking accuracy

## Assumptions

- SM-2 algorithm is appropriate for spaced repetition
- Default settings are suitable for most users
- CSV import can be added later if needed
