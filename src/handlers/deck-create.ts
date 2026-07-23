import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard } from "../toolkit/index.js";
import { createDeck } from "../store.js";

const composer = new Composer<Ctx>();

composer.callbackQuery("deck:create", async (ctx) => {
  await ctx.answerCallbackQuery();
  ctx.session.step = "awaiting_deck_name";
  await ctx.reply("What should we call this deck?", {
    reply_markup: { force_reply: true, input_field_placeholder: "Type a deck name…" },
  });
});

composer.callbackQuery("deck:create:cancel", async (ctx) => {
  await ctx.answerCallbackQuery();
  ctx.session.step = undefined;
  await ctx.reply("No worries — deck creation cancelled.");
});

composer.callbackQuery(/^deck:create:confirm:/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const name = ctx.callbackQuery.data.split(":").slice(3).join(":");
  const userId = String(ctx.from?.id ?? 0);
  createDeck(userId, name);
  ctx.session.step = undefined;
  await ctx.editMessageText(`"${name}" is ready! Tap "Add Card" to put some words in it.`, {
    reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]),
  });
});

export default composer;
