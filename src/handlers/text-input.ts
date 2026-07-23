import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard } from "../toolkit/index.js";
import { createCard, updateUser, getOrCreateUser, getDeck } from "../store.js";

const composer = new Composer<Ctx>();

composer.on("message:text", async (ctx, next) => {
  const step = ctx.session.step;
  if (!step) return next();

  const text = ctx.message.text.trim();

  if (step === "awaiting_deck_name") {
    if (text.length < 1 || text.length > 50) {
      await ctx.reply("Deck name should be 1–50 characters. Try again:", {
        reply_markup: { force_reply: true, input_field_placeholder: "Type a deck name…" },
      });
      return;
    }
    ctx.session.step = undefined;
    await ctx.reply(`Name: "${text}"\n\nCreate this deck?`, {
      reply_markup: inlineKeyboard([
        [inlineButton("Yes, create it", `deck:create:confirm:${text}`)],
        [inlineButton("Cancel", "deck:create:cancel")],
      ]),
    });
    return;
  }

  if (step === "awaiting_card_word") {
    const tempCard = ctx.session.temp_card;
    if (!tempCard?.deck_id) {
      ctx.session.step = undefined;
      return;
    }
    if (text.length < 1 || text.length > 100) {
      await ctx.reply("Word should be 1–100 characters. Try again:", {
        reply_markup: { force_reply: true, input_field_placeholder: "Type the word…" },
      });
      return;
    }
    tempCard.word = text;
    ctx.session.step = "awaiting_card_translation";
    await ctx.reply(`Got it! What's the translation of "${text}"?`, {
      reply_markup: { force_reply: true, input_field_placeholder: "Type the translation…" },
    });
    return;
  }

  if (step === "awaiting_card_translation") {
    const tempCard = ctx.session.temp_card;
    if (!tempCard?.deck_id || !tempCard.word) {
      ctx.session.step = undefined;
      return;
    }
    if (text.length < 1 || text.length > 200) {
      await ctx.reply("Translation should be 1–200 characters. Try again:", {
        reply_markup: { force_reply: true, input_field_placeholder: "Type the translation…" },
      });
      return;
    }
    tempCard.translation = text;
    ctx.session.step = "awaiting_card_example";
    await ctx.reply("Add an example sentence? (optional — tap Skip to save without one)", {
      reply_markup: inlineKeyboard([
        [inlineButton("Skip", "card:save")],
      ]),
    });
    return;
  }

  if (step === "awaiting_card_example") {
    const tempCard = ctx.session.temp_card;
    if (!tempCard?.deck_id || !tempCard.word || !tempCard.translation) {
      ctx.session.step = undefined;
      return;
    }
    const userId = String(ctx.from?.id ?? 0);
    createCard(userId, tempCard.deck_id, tempCard.word, tempCard.translation, text);
    const deck = getDeck(tempCard.deck_id);
    ctx.session.step = undefined;
    ctx.session.temp_card = undefined;
    await ctx.reply(
      `✅ Card saved!\n\n${tempCard.word} → ${tempCard.translation}` +
      (text ? `\nExample: ${text}` : "") +
      (deck ? `\n\nDeck: "${deck.name}"` : ""),
      { reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]) },
    );
    return;
  }

  if (step === "awaiting_reminder_time") {
    if (!/^\d{1,2}:\d{2}$/.test(text)) {
      await ctx.reply("Please use HH:MM format (e.g. 09:00). Try again:", {
        reply_markup: { force_reply: true, input_field_placeholder: "HH:MM" },
      });
      return;
    }
    const userId = String(ctx.from?.id ?? 0);
    updateUser(userId, { reminder_time: text });
    ctx.session.step = undefined;
    await ctx.reply(`✅ Reminder set for ${text}.`, {
      reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]),
    });
    return;
  }

  if (step === "awaiting_timezone") {
    const userId = String(ctx.from?.id ?? 0);
    updateUser(userId, { timezone: text });
    ctx.session.step = undefined;
    await ctx.reply(`✅ Timezone set to ${text}.`, {
      reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]),
    });
    return;
  }
});

export default composer;
