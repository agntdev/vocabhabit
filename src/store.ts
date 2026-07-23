const users = new Map<string, User>();
const decks = new Map<string, Deck>();
const cards = new Map<string, Card>();

export interface User {
  id: string;
  timezone: string;
  daily_new_card_limit: number;
  reminder_time: string;
  streak: number;
  last_review_date: string;
}

export interface Deck {
  id: string;
  name: string;
  user_id: string;
  created_at: string;
}

export interface Card {
  id: string;
  deck_id: string;
  user_id: string;
  word: string;
  translation: string;
  example: string;
  interval: number;
  ease: number;
  repetition_count: number;
  next_review: string;
}

export interface ReviewSession {
  deck_id: string;
  card_ids: string[];
  current_index: number;
  reviewed_count: number;
  correct_count: number;
}

export function clearStore(): void {
  users.clear();
  decks.clear();
  cards.clear();
}

export function getUser(userId: string): User | undefined {
  return users.get(userId);
}

export function getOrCreateUser(userId: string): User {
  let user = users.get(userId);
  if (!user) {
    user = {
      id: userId,
      timezone: "UTC",
      daily_new_card_limit: 10,
      reminder_time: "09:00",
      streak: 0,
      last_review_date: "",
    };
    users.set(userId, user);
  }
  return user;
}

export function updateUser(userId: string, updates: Partial<Omit<User, "id">>): User {
  const user = getOrCreateUser(userId);
  Object.assign(user, updates);
  return user;
}

export function createDeck(userId: string, name: string): Deck {
  const id = `deck_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const deck: Deck = { id, name, user_id: userId, created_at: new Date().toISOString() };
  decks.set(id, deck);
  return deck;
}

export function getDecks(userId: string): Deck[] {
  return [...decks.values()].filter((d) => d.user_id === userId);
}

export function getDeck(deckId: string): Deck | undefined {
  return decks.get(deckId);
}

export function deleteDeck(deckId: string): boolean {
  const deck = decks.get(deckId);
  if (!deck) return false;
  for (const card of cards.values()) {
    if (card.deck_id === deckId) cards.delete(card.id);
  }
  return decks.delete(deckId);
}

export function createCard(userId: string, deckId: string, word: string, translation: string, example: string): Card {
  const id = `card_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const card: Card = {
    id,
    deck_id: deckId,
    user_id: userId,
    word,
    translation,
    example,
    interval: 0,
    ease: 2.5,
    repetition_count: 0,
    next_review: new Date().toISOString(),
  };
  cards.set(id, card);
  return card;
}

export function getCards(deckId: string): Card[] {
  return [...cards.values()].filter((c) => c.deck_id === deckId);
}

export function getUserCards(userId: string): Card[] {
  return [...cards.values()].filter((c) => c.user_id === userId);
}

export function getCard(cardId: string): Card | undefined {
  return cards.get(cardId);
}

export function updateCard(cardId: string, updates: Partial<Omit<Card, "id">>): Card | undefined {
  const card = cards.get(cardId);
  if (!card) return undefined;
  Object.assign(card, updates);
  return card;
}

export function deleteCard(cardId: string): boolean {
  return cards.delete(cardId);
}

export function getDueCards(userId: string, deckId?: string): Card[] {
  const now = new Date().toISOString();
  return [...cards.values()].filter(
    (c) =>
      c.user_id === userId &&
      (!deckId || c.deck_id === deckId) &&
      c.next_review <= now,
  );
}

export function updateStreak(userId: string, today: string): void {
  const user = getOrCreateUser(userId);
  if (user.last_review_date === today) return;
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
  if (user.last_review_date === yesterday) {
    user.streak += 1;
  } else {
    user.streak = 1;
  }
  user.last_review_date = today;
}

export function getStats(userId: string): {
  total_cards: number;
  reviewed_cards: number;
  streak: number;
  retention_rate: number;
} {
  const allCards = getUserCards(userId);
  const total = allCards.length;
  const reviewed = allCards.filter((c) => c.repetition_count > 0).length;
  const user = getUser(userId);
  const streak = user?.streak ?? 0;
  const totalReviews = allCards.reduce((sum, c) => sum + c.repetition_count, 0);
  const retentionRate = totalReviews > 0
    ? Math.round(
        allCards.reduce((sum, c) => {
          const quality = (c.ease - 1) / 2;
          return sum + quality * c.repetition_count;
        }, 0) / totalReviews * 100,
      )
    : 0;
  return { total_cards: total, reviewed_cards: reviewed, streak, retention_rate: retentionRate };
}
