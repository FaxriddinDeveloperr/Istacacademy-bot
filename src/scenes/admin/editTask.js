'use strict';

const { Scenes, Markup } = require('telegraf');
const { SCENES, NAV } = require('../../constants');
const { updateTask, getTaskById } = require('../../database/queries');
const {
  isValidQuestionCount,
  parseAnswers,
} = require('../../utils/validators');
const { cancelKeyboard, adminMainKeyboard } = require('../../keyboards');
const { downloadPdfByFileId } = require('../../utils/downloadPdf');
const logger = require('../../utils/logger');

const editTaskScene = new Scenes.BaseScene(SCENES.EDIT_TASK);

// state: { taskId, field }
editTaskScene.enter(async (ctx) => {
  const { taskId, field } = ctx.scene.state;
  const task = await getTaskById(taskId);
  if (!task) {
    await ctx.reply('❌ Vazifa topilmadi.', adminMainKeyboard());
    return ctx.scene.leave();
  }

  switch (field) {
    case 'title':
      await ctx.reply(
        `Hozirgi nomi: <b>${task.title}</b>\n\nYangi nomini kiriting:`,
        { parse_mode: 'HTML', ...cancelKeyboard() }
      );
      break;
    case 'pdf':
      await ctx.reply('📄 Yangi PDF faylni yuboring:', cancelKeyboard());
      break;
    case 'count':
      await ctx.reply(
        `Hozirgi savol soni: <b>${task.question_count}</b>\n\n` +
          `⚠️ Diqqat: savol sonini o'zgartirish javoblar bilan mos tushishi uchun keyin javoblarni ham yangilashingiz kerak bo'ladi.\n\n` +
          `Yangi savol sonini kiriting:`,
        { parse_mode: 'HTML', ...cancelKeyboard() }
      );
      break;
    case 'answers':
      await ctx.reply(
        `Hozirgi to'g'ri javoblar: <code>${task.correct_answers}</code>\n\n` +
          `Yangi javoblarni kiriting (${task.question_count} ta a/b/c/d):`,
        { parse_mode: 'HTML', ...cancelKeyboard() }
      );
      break;
    default:
      await ctx.reply('❌ Noma\'lum maydon.', adminMainKeyboard());
      return ctx.scene.leave();
  }
});

editTaskScene.hears(NAV.CANCEL, async (ctx) => {
  await ctx.reply('Bekor qilindi.', Markup.removeKeyboard());
  await ctx.reply('Admin menyu:', adminMainKeyboard());
  return ctx.scene.leave();
});

editTaskScene.on(['text', 'document'], async (ctx) => {
  try {
    const { taskId, field } = ctx.scene.state;
    const task = await getTaskById(taskId);
    if (!task) {
      await ctx.reply('❌ Vazifa topilmadi.', adminMainKeyboard());
      return ctx.scene.leave();
    }

    if (field === 'title') {
      const text = ctx.message.text?.trim();
      if (!text || text.length < 1 || text.length > 100) {
        await ctx.reply('❌ Nomi 1-100 belgi oralig\'ida bo\'lishi kerak.');
        return;
      }
      await updateTask(taskId, { title: text });
      await ctx.reply('✅ Nomi yangilandi.', Markup.removeKeyboard());
    } else if (field === 'pdf') {
      const doc = ctx.message.document;
      if (!doc || doc.mime_type !== 'application/pdf') {
        await ctx.reply('❌ Iltimos, PDF faylni yuboring.');
        return;
      }
      let pdfPath = null;
      try {
        pdfPath = await downloadPdfByFileId(ctx.telegram, doc.file_id);
      } catch (err) {
        logger.warn('PDF zaxiralashda xato:', err.message);
      }
      await updateTask(taskId, { pdfFileId: doc.file_id, pdfPath });
      await ctx.reply('✅ PDF yangilandi.', Markup.removeKeyboard());
    } else if (field === 'count') {
      const text = ctx.message.text?.trim();
      if (!isValidQuestionCount(text)) {
        await ctx.reply('❌ Savol soni 1-200 oralig\'ida butun son bo\'lishi kerak.');
        return;
      }
      // Eslatma: agar yangi savol soni javoblar uzunligidan farq qilsa,
      // adminga eslatib qo'yamiz. Lekin saqlaymiz.
      await updateTask(taskId, { questionCount: Number(text) });
      await ctx.reply(
        `✅ Savol soni yangilandi.\n\n⚠️ Hozirgi javoblar uzunligi (${task.correct_answers.length}) yangi soniga mos kelmasligi mumkin. "To'g'ri javoblar" maydonini ham yangilang.`,
        Markup.removeKeyboard()
      );
    } else if (field === 'answers') {
      const text = ctx.message.text?.trim();
      const parsed = parseAnswers(text, task.question_count);
      if (!parsed) {
        await ctx.reply(
          `❌ Javoblar noto'g'ri formatda. Aniq <b>${task.question_count}</b> ta a/b/c/d harfi kerak.`,
          { parse_mode: 'HTML' }
        );
        return;
      }
      await updateTask(taskId, { correctAnswers: parsed });
      await ctx.reply('✅ Javoblar yangilandi.', Markup.removeKeyboard());
    }
    await ctx.reply('Admin menyu:', adminMainKeyboard());
  } catch (err) {
    logger.error('editTaskScene error:', err);
    await ctx.reply('❌ Xatolik yuz berdi.', Markup.removeKeyboard());
  }
  return ctx.scene.leave();
});

module.exports = editTaskScene;
