import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard } from "../toolkit/index.js";
import { getStats, getDecks } from "../store.js";

const composer = new Composer<Ctx>();

composer.callbackQuery("progress:view", async (ctx) => {
  await ctx.answerCallbackQuery();
  const userId = String(ctx.from?.id ?? 0);
  const stats = getStats(userId);
  const decks = getDecks(userId);

  if (stats.total_cards === 0) {
    await ctx.reply("No cards yet — create a deck and add some words to start tracking progress!", {
      reply_markup: inlineKeyboard([
        [inlineButton("🃏 Create Deck", "deck:create")],
        [inlineButton("⬅️ Back to menu", "menu:main")],
      ]),
    });
    return;
  }

  const deckLines = decks.map((d) => `  • ${d.name}`).join("\n");
  const text =
    `📊 Your Progress\n\n` +
    `🃏 ${stats.total_cards} total cards across ${decks.length} deck${decks.length === 1 ? "" : "s"}\n` +
    `📝 ${stats.reviewed_cards} cards reviewed\n` +
    `🔥 ${stats.streak}-day streak\n` +
    `📈 ${stats.retention_rate}% retention rate` +
    (deckLines ? `\n\nDecks:\n${deckLines}` : "");

  await ctx.reply(text, {
    reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]),
  });
});

export default composer;
