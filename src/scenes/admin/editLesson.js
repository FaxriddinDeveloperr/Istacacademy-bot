'use strict';

const { Scenes, Markup } = require('telegraf');
const { SCENES, NAV } = require('../../constants');
const { updateLesson, getLessonById } = require('../../database/queries');
const { isValidOrderNum } = require('../../utils/validators');
const { cancelKeyboard, adminMainKeyboard } = require('../../keyboards');
const logger = require('../../utils/logger');

const editLessonScene = new Scenes.BaseScene(SCENES.EDIT_LESSON);

// state.lessonId va state.field ('title' yoki 'order') kutiladi
editLessonScene.enter(async (ctx) => {
  const { lessonId, field } = ctx.scene.state;
  const lesson = await getLessonById(lessonId);
  if (!lesson) {
    await ctx.reply('❌ Dars topilmadi.', adminMainKeyboard());
    return ctx.scene.leave();
  }
  if (field === 'title') {
    await ctx.reply(
      `Hozirgi nomi: <b>${lesson.title}</b>\n\nYangi nomini kiriting:`,
      { parse_mode: 'HTML', ...cancelKeyboard() }
    );
  } else if (field === 'order') {
    await ctx.reply(
      `Hozirgi tartib raqami: <b>${lesson.order_num}</b>\n\nYangi tartib raqamini kiriting:`,
      { parse_mode: 'HTML', ...cancelKeyboard() }
    );
  } else {
    await ctx.reply('❌ Noma\'lum maydon.', adminMainKeyboard());
    return ctx.scene.leave();
  }
});

editLessonScene.hears(NAV.CANCEL, async (ctx) => {
  await ctx.reply('Bekor qilindi.', Markup.removeKeyboard());
  await ctx.reply('Admin menyu:', adminMainKeyboard());
  return ctx.scene.leave();
});

editLessonScene.on('text', async (ctx) => {
  try {
    const { lessonId, field } = ctx.scene.state;
    const text = ctx.message.text.trim();

    if (field === 'title') {
      if (text.length < 1 || text.length > 100) {
        await ctx.reply('❌ Nomi 1-100 belgi oralig\'ida bo\'lishi kerak.');
        return;
      }
      await updateLesson(lessonId, { title: text });
      await ctx.reply('✅ Dars nomi yangilandi.', Markup.removeKeyboard());
    } else if (field === 'order') {
      if (!isValidOrderNum(text)) {
        await ctx.reply('❌ Tartib raqami 1-10000 oralig\'ida butun son bo\'lishi kerak.');
        return;
      }
      await updateLesson(lessonId, { orderNum: Number(text) });
      await ctx.reply('✅ Tartib raqami yangilandi.', Markup.removeKeyboard());
    }
    await ctx.reply('Admin menyu:', adminMainKeyboard());
  } catch (err) {
    logger.error('editLessonScene error:', err);
    await ctx.reply('❌ Xatolik yuz berdi.', Markup.removeKeyboard());
  }
  return ctx.scene.leave();
});

module.exports = editLessonScene;
