'use strict';

const { Scenes, Markup } = require('telegraf');
const { SCENES, NAV } = require('../constants');
const { parseAnswers } = require('../utils/validators');
const {
  getTaskById,
  getUserByTelegramId,
  saveResult,
} = require('../database/queries');
const { checkAnswers, formatResultMessage } = require('../utils/checkAnswers');
const {
  afterTaskResultKeyboard,
  cancelKeyboard,
  mainMenuKeyboard,
} = require('../keyboards');
const { RESULT_TYPE } = require('../constants');
const logger = require('../utils/logger');

const taskAnswerScene = new Scenes.BaseScene(SCENES.TASK_ANSWER);

// Scene boshlanganda: vazifa ma'lumotlari state'da bo'lishi kerak
taskAnswerScene.enter(async (ctx) => {
  const task = ctx.scene.state.task;
  if (!task) {
    await ctx.reply('❌ Xatolik. Vazifa topilmadi.', mainMenuKeyboard());
    return ctx.scene.leave();
  }
  await ctx.reply(
    `📋 Bu vazifada <b>${task.question_count}</b> ta savol bor.\n\n` +
      `Javoblaringizni quyidagi formatda yuboring:\n` +
      `Misol: <code>abcde</code> (5 ta savol uchun)\n` +
      `Yoki: <code>1a2b3c4d5e</code>\n\n` +
      `❗️ Faqat lotin kichik harflari (a, b, c, d, e, ...).`,
    { parse_mode: 'HTML', ...cancelKeyboard() }
  );
});

taskAnswerScene.hears(NAV.CANCEL, async (ctx) => {
  await ctx.reply('Bekor qilindi.', mainMenuKeyboard());
  return ctx.scene.leave();
});

taskAnswerScene.on('text', async (ctx) => {
  try {
    const task = ctx.scene.state.task;
    if (!task) {
      await ctx.reply('❌ Xatolik. Vazifa topilmadi.', mainMenuKeyboard());
      return ctx.scene.leave();
    }

    // Fresh task ma'lumotini olamiz
    const freshTask = await getTaskById(task.id);
    if (!freshTask) {
      await ctx.reply(
        '❌ Vazifa endi mavjud emas.',
        mainMenuKeyboard()
      );
      return ctx.scene.leave();
    }

    const userInput = ctx.message.text;
    const parsed = parseAnswers(userInput, freshTask.question_count);

    if (!parsed) {
      await ctx.reply(
        `❌ Javob noto'g'ri formatda.\n\n` +
          `Aniq <b>${freshTask.question_count}</b> ta lotin kichik harfini kiriting.\n` +
          `Misol: <code>${'a'.repeat(freshTask.question_count)}</code>`,
        { parse_mode: 'HTML' }
      );
      return;
    }

    const result = checkAnswers(parsed, freshTask.correct_answers);

    // Natijani DB'ga yozamiz
    const dbUser = await getUserByTelegramId(ctx.from.id);
    if (dbUser) {
      await saveResult({
        userId: dbUser.id,
        type: RESULT_TYPE.TASK,
        referenceId: freshTask.id,
        userAnswers: parsed,
        correctCount: result.correctCount,
        wrongCount: result.wrongCount,
        totalCount: result.totalCount,
      });
    }

    const messageText = formatResultMessage(result);

    // Avval reply keyboard'ni asosiy menyuga qaytaramiz
    await ctx.reply(messageText, {
      parse_mode: 'HTML',
      ...mainMenuKeyboard(),
    });

    // So'ng inline tugmalarni alohida xabarda yuboramiz
    await ctx.reply(
      'Quyidagilardan birini tanlang:',
      afterTaskResultKeyboard(freshTask.id, freshTask.lesson_id)
    );

    return ctx.scene.leave();
  } catch (err) {
    logger.error('taskAnswerScene error:', err);
    await ctx.reply(
      '❌ Xatolik yuz berdi. Iltimos, qaytadan urinib ko\'ring.',
      mainMenuKeyboard()
    );
    return ctx.scene.leave();
  }
});

// Boshqa har qanday tipdagi xabar — eslatma
taskAnswerScene.on('message', async (ctx) => {
  await ctx.reply('Iltimos, javoblaringizni matn ko\'rinishida yuboring.');
});

module.exports = taskAnswerScene;
