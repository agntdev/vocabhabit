import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { mainMenuKeyboard, registerMainMenuItem } from "../toolkit/index.js";
import { getOrCreateUser } from "../store.js";

registerMainMenuItem({ label: "🃏 Create Deck", data: "deck:create", order: 10 });
registerMainMenuItem({ label: "📚 Browse Decks", data: "deck:list", order: 20 });
registerMainMenuItem({ label: "🔄 Start Review", data: "review:start", order: 30 });
registerMainMenuItem({ label: "📊 View Progress", data: "progress:view", order: 40 });
registerMainMenuItem({ label: "⚙️ Settings", data: "settings:open", order: 50 });

const WELCOME = "👋 Welcome! Tap a button below to get started.";

const composer = new Composer<Ctx>();

composer.command("start", async (ctx) => {
  const userId = String(ctx.from?.id ?? 0);
  getOrCreateUser(userId);
  await ctx.reply(WELCOME, { reply_markup: mainMenuKeyboard() });
});

composer.callbackQuery("menu:main", async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.editMessageText(WELCOME, { reply_markup: mainMenuKeyboard() });
});

export default composer;
