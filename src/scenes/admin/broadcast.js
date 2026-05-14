'use strict';

const { Scenes, Markup } = require('telegraf');
const { SCENES, NAV } = require('../../constants');
const { getAllUsers } = require('../../database/queries');
const { cancelKeyboard, adminMainKeyboard } = require('../../keyboards');
const logger = require('../../utils/logger');

const broadcastScene = new Scenes.BaseScene(SCENES.BROADCAST);

broadcastScene.enter(async (ctx) => {
  await ctx.reply(
    '📢 <b>Broadcast</b>\n\nBarcha foydalanuvchilarga yuboriladigan xabar matnini kiriting:',
    { parse_mode: 'HTML', ...cancelKeyboard() }
  );
});

broadcastScene.hears(NAV.CANCEL, async (ctx) => {
  await ctx.reply('Bekor qilindi.', Markup.removeKeyboard());
  await ctx.reply('Admin menyu:', adminMainKeyboard());
  return ctx.scene.leave();
});

broadcastScene.on('text', async (ctx) => {
  const text = ctx.message.text;
  if (!text || text.trim().length === 0) {
    await ctx.reply('Iltimos, matn kiriting.');
    return;
  }

  const users = await getAllUsers();
  await ctx.reply(
    `📤 Xabar <b>${users.length}</b> ta foydalanuvchiga yuborilmoqda...`,
    { parse_mode: 'HTML', ...Markup.removeKeyboard() }
  );

  let success = 0;
  let failed = 0;

  for (const user of users) {
    try {
      await ctx.telegram.sendMessage(user.telegram_id, text);
      success++;
      // Telegram rate limit'iga rioya: har 30ta dan keyin 1s pauza
      if (success % 30 === 0) {
        await new Promise((r) => setTimeout(r, 1000));
      }
    } catch (err) {
      failed++;
      logger.warn(`Broadcast failed for ${user.telegram_id}:`, err.message);
    }
  }

  await ctx.reply(
    `✅ Broadcast yakunlandi.\n\nYuborildi: <b>${success}</b>\nXatoliklar: <b>${failed}</b>`,
    { parse_mode: 'HTML', ...adminMainKeyboard() }
  );
  return ctx.scene.leave();
});

broadcastScene.on('message', async (ctx) => {
  await ctx.reply('Hozircha faqat matn ko\'rinishidagi xabarlar qo\'llab-quvvatlanadi.');
});

module.exports = broadcastScene;
