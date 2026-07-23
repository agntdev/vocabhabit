import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard } from "../toolkit/index.js";
import { getDecks, deleteDeck } from "../store.js";

const composer = new Composer<Ctx>();

composer.callbackQuery("deck:list", async (ctx) => {
  await ctx.answerCallbackQuery();
  const userId = String(ctx.from?.id ?? 0);
  const decks = getDecks(userId);
  if (decks.length === 0) {
    await ctx.reply("No decks yet — tap 🃏 Create Deck to make your first one.", {
      reply_markup: inlineKeyboard([
        [inlineButton("🃏 Create Deck", "deck:create")],
        [inlineButton("⬅️ Back to menu", "menu:main")],
      ]),
    });
    return;
  }
  const rows = decks.map((d) => [inlineButton(d.name, `deck:view:${d.id}`)]);
  rows.push([inlineButton("⬅️ Back to menu", "menu:main")]);
  await ctx.reply("Your decks:", { reply_markup: inlineKeyboard(rows) });
});

composer.callbackQuery(/^deck:view:(.+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const deckId = ctx.match![1];
  const { getDeck, getCards } = await import("../store.js");
  const deck = getDeck(deckId);
  if (!deck) {
    await ctx.reply("That deck doesn't exist anymore.");
    return;
  }
  const cards = getCards(deckId);
  const text = cards.length === 0
    ? `"${deck.name}" has no cards yet — add some words to get started!`
    : `"${deck.name}" has ${cards.length} card${cards.length === 1 ? "" : "s"}.\n\nTap a button below to manage it.`;
  await ctx.editMessageText(text, {
    reply_markup: inlineKeyboard([
      [inlineButton("➕ Add Card", `card:add:${deckId}`)],
      [inlineButton("🗑 Delete Deck", `deck:delete:${deckId}`)],
      [inlineButton("⬅️ Back to decks", "deck:list")],
    ]),
  });
});

composer.callbackQuery(/^deck:delete:(.+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const deckId = ctx.match![1];
  const deck = getDecks(String(ctx.from?.id ?? 0)).find((d) => d.id === deckId);
  if (!deck) {
    await ctx.reply("That deck doesn't exist anymore.");
    return;
  }
  await ctx.editMessageText(`Are you sure you want to delete "${deck.name}"?`, {
    reply_markup: inlineKeyboard([
      [
        inlineButton("Yes, delete it", `deck:delete:confirm:${deckId}`),
        inlineButton("Cancel", `deck:view:${deckId}`),
      ],
    ]),
  });
});

composer.callbackQuery(/^deck:delete:confirm:(.+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const deckId = ctx.match![1];
  deleteDeck(deckId);
  await ctx.editMessageText("Deck deleted.", {
    reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]),
  });
});

export default composer;
