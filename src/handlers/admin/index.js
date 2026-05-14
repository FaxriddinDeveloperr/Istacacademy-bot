'use strict';

const { adminMainKeyboard } = require('../../keyboards');

async function showAdminMenu(ctx) {
  await ctx.reply(
    '🛠 <b>Admin paneli</b>\n\nKerakli bo\'limni tanlang:',
    { parse_mode: 'HTML', ...adminMainKeyboard() }
  );
}

// Inline tugmadan qaytishda
async function showAdminMenuEdit(ctx) {
  try {
    await ctx.editMessageText('🛠 <b>Admin paneli</b>\n\nKerakli bo\'limni tanlang:', {
      parse_mode: 'HTML',
      reply_markup: adminMainKeyboard().reply_markup,
    });
  } catch (_) {
    // Agar tahrirlash imkonsiz bo'lsa — yangi xabar
    await showAdminMenu(ctx);
  }
}

module.exports = { showAdminMenu, showAdminMenuEdit };
