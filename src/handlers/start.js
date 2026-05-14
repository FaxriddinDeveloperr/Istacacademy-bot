'use strict';

const { getUserByTelegramId } = require('../database/queries');
const { mainMenuKeyboard } = require('../keyboards');
const { SCENES } = require('../constants');

async function startHandler(ctx) {
  const user = await getUserByTelegramId(ctx.from.id);

  if (user) {
    await ctx.reply(
      `Xush kelibsiz, <b>${user.first_name}</b>! 👋\n\n` +
        `Quyidagi menyudan kerakli bo'limni tanlang:`,
      { parse_mode: 'HTML', ...mainMenuKeyboard() }
    );
    return;
  }

  // Ro'yxatdan o'tmagan — registratsiya scene'ga yuboramiz
  return ctx.scene.enter(SCENES.REGISTRATION);
}

module.exports = startHandler;
