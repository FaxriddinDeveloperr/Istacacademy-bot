'use strict';

const { Scenes } = require('telegraf');
const { SCENES, NAV, RESULT_TYPE } = require('../constants');
const { parseAnswers } = require('../utils/validators');
const {
  getDtmById,
  getUserByTelegramId,
  saveResult,
} = require('../database/queries');
const { checkAnswers, formatResultMessage } = require('../utils/checkAnswers');
const {
  afterDtmResultKeyboard,
  cancelKeyboard,
  mainMenuKeyboard,
} = require('../keyboards');
const logger = require('../utils/logger');

const dtmAnswerScene = new Scenes.BaseScene(SCENES.DTM_ANSWER);

dtmAnswerScene.enter(async (ctx) => {
  const dtm = ctx.scene.state.dtm;
  if (!dtm) {
    await ctx.reply('❌ Xatolik. Variant topilmadi.', mainMenuKeyboard());
    return ctx.scene.leave();
  }
  await ctx.reply(
    `📋 Bu variantda <b>${dtm.question_count}</b> ta savol bor.\n\n` +
      `Javoblaringizni quyidagi formatda yuboring:\n` +
      `Misol: <code>abcde</code> (5 ta savol uchun)\n` +
      `Yoki: <code>1a2b3c4d5e</code>\n\n` +
      `❗️ Faqat lotin kichik harflari (a, b, c, d, e, ...).`,
    { parse_mode: 'HTML', ...cancelKeyboard() }
  );
});

dtmAnswerScene.hears(NAV.CANCEL, async (ctx) => {
  await ctx.reply('Bekor qilindi.', mainMenuKeyboard());
  return ctx.scene.leave();
});

dtmAnswerScene.on('text', async (ctx) => {
  try {
    const dtm = ctx.scene.state.dtm;
    if (!dtm) {
      await ctx.reply('❌ Xatolik. Variant topilmadi.', mainMenuKeyboard());
      return ctx.scene.leave();
    }

    const fresh = await getDtmById(dtm.id);
    if (!fresh) {
      await ctx.reply('❌ Variant endi mavjud emas.', mainMenuKeyboard());
      return ctx.scene.leave();
    }

    const parsed = parseAnswers(ctx.message.text, fresh.question_count);
    if (!parsed) {
      await ctx.reply(
        `❌ Javob noto'g'ri formatda.\n\n` +
          `Aniq <b>${fresh.question_count}</b> ta lotin kichik harfini kiriting.\n` +
          `Misol: <code>${'a'.repeat(fresh.question_count)}</code>`,
        { parse_mode: 'HTML' }
      );
      return;
    }

    const result = checkAnswers(parsed, fresh.correct_answers);

    const dbUser = await getUserByTelegramId(ctx.from.id);
    if (dbUser) {
      await saveResult({
        userId: dbUser.id,
        type: RESULT_TYPE.DTM,
        referenceId: fresh.id,
        userAnswers: parsed,
        correctCount: result.correctCount,
        wrongCount: result.wrongCount,
        totalCount: result.totalCount,
      });
    }

    const messageText = formatResultMessage(result);

    await ctx.reply(messageText, {
      parse_mode: 'HTML',
      ...mainMenuKeyboard(),
    });

    await ctx.reply(
      'Quyidagilardan birini tanlang:',
      afterDtmResultKeyboard(fresh.id)
    );

    return ctx.scene.leave();
  } catch (err) {
    logger.error('dtmAnswerScene error:', err);
    await ctx.reply(
      '❌ Xatolik yuz berdi. Iltimos, qaytadan urinib ko\'ring.',
      mainMenuKeyboard()
    );
    return ctx.scene.leave();
  }
});

dtmAnswerScene.on('message', async (ctx) => {
  await ctx.reply('Iltimos, javoblaringizni matn ko\'rinishida yuboring.');
});

module.exports = dtmAnswerScene;
