'use strict';

const {
  getActiveDtmVariants,
  getDtmById,
} = require('../database/queries');
const {
  dtmVariantsKeyboard,
  mainMenuKeyboard,
} = require('../keyboards');
const { SCENES } = require('../constants');
const logger = require('../utils/logger');

// DTM bo'limi — variantlar
async function showDtmVariants(ctx) {
  const variants = await getActiveDtmVariants();
  if (variants.length === 0) {
    await ctx.reply(
      '📭 Hozircha DTM variantlari mavjud emas.\nIltimos, keyinroq qayta tekshiring.',
      mainMenuKeyboard()
    );
    return;
  }
  await ctx.reply(
    '📝 <b>DTM variantlari</b>\n\nKerakli variantni tanlang:',
    { parse_mode: 'HTML', ...dtmVariantsKeyboard(variants) }
  );
}

// Inline tugmadan qaytishda
async function showDtmVariantsEdit(ctx) {
  const variants = await getActiveDtmVariants();
  if (variants.length === 0) {
    await ctx.editMessageText('📭 Hozircha DTM variantlari mavjud emas.');
    return;
  }
  await ctx.editMessageText(
    '📝 <b>DTM variantlari</b>\n\nKerakli variantni tanlang:',
    { parse_mode: 'HTML', reply_markup: dtmVariantsKeyboard(variants).reply_markup }
  );
}

async function startDtm(ctx, dtmId) {
  try {
    const dtm = await getDtmById(dtmId);
    if (!dtm || !dtm.is_active) {
      await ctx.answerCbQuery('Variant topilmadi yoki nofaol.');
      return;
    }
    await ctx.answerCbQuery();

    const loadingMsg = await ctx.reply('📤 PDF yuborilmoqda...');

    try {
      await ctx.replyWithDocument(dtm.pdf_file_id, {
        caption: `📄 ${dtm.title}`,
      });
    } catch (err) {
      logger.error('DTM PDF send failed:', err);
      if (dtm.pdf_path) {
        await ctx.replyWithDocument(
          { source: dtm.pdf_path },
          { caption: `📄 ${dtm.title}` }
        );
      } else {
        await ctx.reply(
          '❌ PDF yuborishda xatolik. Adminlar bilan bog\'laning.'
        );
        return;
      }
    } finally {
      try {
        await ctx.deleteMessage(loadingMsg.message_id);
      } catch (_) {
        // muhim emas
      }
    }

    return ctx.scene.enter(SCENES.DTM_ANSWER, { dtm });
  } catch (err) {
    logger.error('startDtm error:', err);
    await ctx.reply('❌ Xatolik yuz berdi.', mainMenuKeyboard());
  }
}

module.exports = { showDtmVariants, showDtmVariantsEdit, startDtm };
