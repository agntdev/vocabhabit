import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard } from "../toolkit/index.js";
import { getDecks, getDueCards, getCard, updateCard, updateStreak } from "../store.js";

const composer = new Composer<Ctx>();

composer.callbackQuery("review:start", async (ctx) => {
  await ctx.answerCallbackQuery();
  const userId = String(ctx.from?.id ?? 0);
  const decks = getDecks(userId);
  if (decks.length === 0) {
    await ctx.reply("No decks yet — create one to start reviewing!", {
      reply_markup: inlineKeyboard([
        [inlineButton("🃏 Create Deck", "deck:create")],
        [inlineButton("⬅️ Back to menu", "menu:main")],
      ]),
    });
    return;
  }
  const rows = decks.map((d) => [inlineButton(d.name, `review:pick:${d.id}`)]);
  rows.push([inlineButton("⬅️ Back to menu", "menu:main")]);
  await ctx.reply("Pick a deck to review:", { reply_markup: inlineKeyboard(rows) });
});

composer.callbackQuery(/^review:pick:(.+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const deckId = ctx.match![1];
  const userId = String(ctx.from?.id ?? 0);
  const dueCards = getDueCards(userId, deckId);
  if (dueCards.length === 0) {
    await ctx.editMessageText("No cards due for review right now — come back later!", {
      reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]),
    });
    return;
  }
  const cardIds = dueCards.map((c) => c.id);
  ctx.session.review = {
    deck_id: deckId,
    card_ids: cardIds,
    current_index: 0,
    reviewed_count: 0,
    correct_count: 0,
  };
  showCard(ctx, cardIds[0], 0, cardIds.length);
});

composer.callbackQuery("review:show", async (ctx) => {
  await ctx.answerCallbackQuery();
  const review = ctx.session.review;
  if (!review) return;
  const cardId = review.card_ids[review.current_index];
  const card = getCard(cardId);
  if (!card) return;
  const answer = card.translation + (card.example ? `\n\nExample: ${card.example}` : "");
  await ctx.editMessageText(`${card.word}\n\n${answer}`, {
    reply_markup: inlineKeyboard([
      [
        inlineButton("❌ Again", "review:rate:0"),
        inlineButton("😅 Hard", "review:rate:1"),
      ],
      [
        inlineButton("👍 Good", "review:rate:2"),
        inlineButton("🎯 Easy", "review:rate:3"),
      ],
    ]),
  });
});

composer.callbackQuery(/^review:rate:(\d)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const quality = parseInt(ctx.match![1]);
  const review = ctx.session.review;
  if (!review) return;
  const cardId = review.card_ids[review.current_index];
  const card = getCard(cardId);
  if (!card) return;

  const { interval, ease, repetition_count } = sm2(quality, card.interval, card.ease, card.repetition_count);
  const nextReview = new Date(Date.now() + interval * 86400000).toISOString();
  updateCard(cardId, { interval, ease, repetition_count, next_review: nextReview });

  review.reviewed_count++;
  if (quality >= 2) review.correct_count++;

  const userId = String(ctx.from?.id ?? 0);
  const today = new Date().toISOString().split("T")[0];
  updateStreak(userId, today);

  review.current_index++;
  if (review.current_index >= review.card_ids.length) {
    const rate = review.reviewed_count > 0
      ? Math.round((review.correct_count / review.reviewed_count) * 100)
      : 0;
    await ctx.editMessageText(
      `Review complete! 🎉\n\nReviewed ${review.reviewed_count} cards with ${rate}% retention.\nKeep it up!`,
      { reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]) },
    );
    ctx.session.review = undefined;
  } else {
    showCard(ctx, review.card_ids[review.current_index], review.current_index, review.card_ids.length);
  }
});

composer.callbackQuery("review:skip", async (ctx) => {
  await ctx.answerCallbackQuery();
  const review = ctx.session.review;
  if (!review) return;
  review.current_index++;
  if (review.current_index >= review.card_ids.length) {
    await ctx.editMessageText("Review complete! 🎉", {
      reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]),
    });
    ctx.session.review = undefined;
  } else {
    showCard(ctx, review.card_ids[review.current_index], review.current_index, review.card_ids.length);
  }
});

function showCard(ctx: Ctx, cardId: string, index: number, total: number): void {
  const card = getCard(cardId);
  if (!card) return;
  ctx.editMessageText(
    `Card ${index + 1}/${total}\n\n${card.word}`,
    {
      reply_markup: inlineKeyboard([
        [inlineButton("Show answer", "review:show")],
        [inlineButton("Skip", "review:skip")],
        [inlineButton("⬅️ End review", "menu:main")],
      ]),
    },
  );
}

function sm2(quality: number, interval: number, ease: number, repetitionCount: number) {
  if (quality < 2) {
    return { interval: 1, ease: Math.max(1.3, ease - 0.2), repetition_count: 0 };
  }
  let newInterval: number;
  let newEase = ease + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  newEase = Math.max(1.3, newEase);
  if (repetitionCount === 0) {
    newInterval = 1;
  } else if (repetitionCount === 1) {
    newInterval = 6;
  } else {
    newInterval = Math.round(interval * ease);
  }
  return { interval: newInterval, ease: newEase, repetition_count: repetitionCount + 1 };
}

export default composer;
