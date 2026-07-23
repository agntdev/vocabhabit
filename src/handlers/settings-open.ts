import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard } from "../toolkit/index.js";
import { getOrCreateUser, updateUser } from "../store.js";

const composer = new Composer<Ctx>();

composer.callbackQuery("settings:open", async (ctx) => {
  await ctx.answerCallbackQuery();
  const userId = String(ctx.from?.id ?? 0);
  const user = getOrCreateUser(userId);
  const text =
    `⚙️ Settings\n\n` +
    `Daily new card limit: ${user.daily_new_card_limit}\n` +
    `Reminder time: ${user.reminder_time}\n` +
    `Timezone: ${user.timezone}`;

  await ctx.reply(text, {
    reply_markup: inlineKeyboard([
      [
        inlineButton("−", "settings:limit:dec"),
        inlineButton(`${user.daily_new_card_limit} cards/day`, "settings:limit"),
        inlineButton("+", "settings:limit:inc"),
      ],
      [inlineButton("Set reminder time", "settings:reminder")],
      [inlineButton("Set timezone", "settings:timezone")],
      [inlineButton("⬅️ Back to menu", "menu:main")],
    ]),
  });
});

composer.callbackQuery("settings:limit:inc", async (ctx) => {
  await ctx.answerCallbackQuery();
  const userId = String(ctx.from?.id ?? 0);
  const user = getOrCreateUser(userId);
  const newLimit = Math.min(50, user.daily_new_card_limit + 5);
  updateUser(userId, { daily_new_card_limit: newLimit });
  await ctx.editMessageText(
    `⚙️ Settings\n\nDaily new card limit: ${newLimit}\nReminder time: ${user.reminder_time}\nTimezone: ${user.timezone}`,
    {
      reply_markup: inlineKeyboard([
        [
          inlineButton("−", "settings:limit:dec"),
          inlineButton(`${newLimit} cards/day`, "settings:limit"),
          inlineButton("+", "settings:limit:inc"),
        ],
        [inlineButton("Set reminder time", "settings:reminder")],
        [inlineButton("Set timezone", "settings:timezone")],
        [inlineButton("⬅️ Back to menu", "menu:main")],
      ]),
    },
  );
});

composer.callbackQuery("settings:limit:dec", async (ctx) => {
  await ctx.answerCallbackQuery();
  const userId = String(ctx.from?.id ?? 0);
  const user = getOrCreateUser(userId);
  const newLimit = Math.max(5, user.daily_new_card_limit - 5);
  updateUser(userId, { daily_new_card_limit: newLimit });
  await ctx.editMessageText(
    `⚙️ Settings\n\nDaily new card limit: ${newLimit}\nReminder time: ${user.reminder_time}\nTimezone: ${user.timezone}`,
    {
      reply_markup: inlineKeyboard([
        [
          inlineButton("−", "settings:limit:dec"),
          inlineButton(`${newLimit} cards/day`, "settings:limit"),
          inlineButton("+", "settings:limit:inc"),
        ],
        [inlineButton("Set reminder time", "settings:reminder")],
        [inlineButton("Set timezone", "settings:timezone")],
        [inlineButton("⬅️ Back to menu", "menu:main")],
      ]),
    },
  );
});

composer.callbackQuery("settings:reminder", async (ctx) => {
  await ctx.answerCallbackQuery();
  ctx.session.step = "awaiting_reminder_time";
  await ctx.reply("What time should I remind you to review? (e.g. 09:00)", {
    reply_markup: { force_reply: true, input_field_placeholder: "HH:MM" },
  });
});

composer.callbackQuery("settings:timezone", async (ctx) => {
  await ctx.answerCallbackQuery();
  ctx.session.step = "awaiting_timezone";
  await ctx.reply("What's your timezone? (e.g. UTC, America/New_York)", {
    reply_markup: { force_reply: true, input_field_placeholder: "Timezone" },
  });
});

export default composer;
