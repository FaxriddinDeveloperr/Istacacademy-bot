'use strict';

const { mainMenuKeyboard } = require('../keyboards');

async function showMainMenu(ctx) {
  await ctx.reply('🏠 Bosh menyu', mainMenuKeyboard());
}

module.exports = { showMainMenu };
