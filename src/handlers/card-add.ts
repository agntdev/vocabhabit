import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard } from "../toolkit/index.js";
import { createCard, getDecks, getDeck } from "../store.js";

const composer = new Composer<Ctx>();

composer.callbackQuery(/^card:add:(.+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const deckId = ctx.match![1];
  const deck = getDeck(deckId);
  if (!deck) {
    await ctx.reply("That deck doesn't exist anymore.");
    return;
  }
  ctx.session.temp_card = { deck_id: deckId };
  ctx.session.step = "awaiting_card_word";
  await ctx.reply(`Adding a card to "${deck.name}". What's the word?`, {
    reply_markup: { force_reply: true, input_field_placeholder: "Type the word…" },
  });
});

composer.callbackQuery("card:add", async (ctx) => {
  await ctx.answerCallbackQuery();
  const userId = String(ctx.from?.id ?? 0);
  const decks = getDecks(userId);
  if (decks.length === 0) {
    await ctx.reply("You need a deck first — create one before adding cards.", {
      reply_markup: inlineKeyboard([
        [inlineButton("🃏 Create Deck", "deck:create")],
        [inlineButton("⬅️ Back to menu", "menu:main")],
      ]),
    });
    return;
  }
  const rows = decks.map((d) => [inlineButton(d.name, `card:add:${d.id}`)]);
  rows.push([inlineButton("⬅️ Back to menu", "menu:main")]);
  await ctx.reply("Which deck should the card go in?", { reply_markup: inlineKeyboard(rows) });
});

composer.callbackQuery("card:save", async (ctx) => {
  await ctx.answerCallbackQuery();
  const tempCard = ctx.session.temp_card;
  if (!tempCard?.deck_id || !tempCard.word || !tempCard.translation) {
    ctx.session.step = undefined;
    ctx.session.temp_card = undefined;
    await ctx.reply("Something went wrong. Let's start over — tap a button from the menu.");
    return;
  }
  const userId = String(ctx.from?.id ?? 0);
  createCard(userId, tempCard.deck_id, tempCard.word, tempCard.translation, "");
  const deck = getDeck(tempCard.deck_id);
  ctx.session.step = undefined;
  ctx.session.temp_card = undefined;
  await ctx.reply(
    `✅ Card saved!\n\n${tempCard.word} → ${tempCard.translation}` +
    (deck ? `\n\nDeck: "${deck.name}"` : ""),
    { reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]) },
  );
});

export default composer;
