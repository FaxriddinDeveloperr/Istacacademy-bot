'use strict';

const { Scenes, Markup } = require('telegraf');
const { SCENES, NAV } = require('../../constants');
const { updateDtm, getDtmById } = require('../../database/queries');
const {
  isValidQuestionCount,
  parseAnswers,
} = require('../../utils/validators');
const { cancelKeyboard, adminMainKeyboard } = require('../../keyboards');
const { downloadPdfByFileId } = require('../../utils/downloadPdf');
const logger = require('../../utils/logger');

const editDtmScene = new Scenes.BaseScene(SCENES.EDIT_DTM);

editDtmScene.enter(async (ctx) => {
  const { dtmId, field } = ctx.scene.state;
  const dtm = await getDtmById(dtmId);
  if (!dtm) {
    await ctx.reply('❌ DTM topilmadi.', adminMainKeyboard());
    return ctx.scene.leave();
  }

  switch (field) {
    case 'title':
      await ctx.reply(
        `Hozirgi nomi: <b>${dtm.title}</b>\n\nYangi nomini kiriting:`,
        { parse_mode: 'HTML', ...cancelKeyboard() }
      );
      break;
    case 'pdf':
      await ctx.reply('📄 Yangi PDF faylni yuboring:', cancelKeyboard());
      break;
    case 'count':
      await ctx.reply(
        `Hozirgi savol soni: <b>${dtm.question_count}</b>\n\nYangi savol sonini kiriting:`,
        { parse_mode: 'HTML', ...cancelKeyboard() }
      );
      break;
    case 'answers':
      await ctx.reply(
        `Hozirgi to'g'ri javoblar: <code>${dtm.correct_answers}</code>\n\nYangi javoblarni kiriting (${dtm.question_count} ta a/b/c/d):`,
        { parse_mode: 'HTML', ...cancelKeyboard() }
      );
      break;
    default:
      await ctx.reply('❌ Noma\'lum maydon.', adminMainKeyboard());
      return ctx.scene.leave();
  }
});

editDtmScene.hears(NAV.CANCEL, async (ctx) => {
  await ctx.reply('Bekor qilindi.', Markup.removeKeyboard());
  await ctx.reply('Admin menyu:', adminMainKeyboard());
  return ctx.scene.leave();
});

editDtmScene.on(['text', 'document'], async (ctx) => {
  try {
    const { dtmId, field } = ctx.scene.state;
    const dtm = await getDtmById(dtmId);
    if (!dtm) {
      await ctx.reply('❌ DTM topilmadi.', adminMainKeyboard());
      return ctx.scene.leave();
    }

    if (field === 'title') {
      const text = ctx.message.text?.trim();
      if (!text || text.length < 1 || text.length > 100) {
        await ctx.reply('❌ Nomi 1-100 belgi oralig\'ida bo\'lishi kerak.');
        return;
      }
      await updateDtm(dtmId, { title: text });
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
      await updateDtm(dtmId, { pdfFileId: doc.file_id, pdfPath });
      await ctx.reply('✅ PDF yangilandi.', Markup.removeKeyboard());
    } else if (field === 'count') {
      const text = ctx.message.text?.trim();
      if (!isValidQuestionCount(text)) {
        await ctx.reply('❌ Savol soni 1-200 oralig\'ida butun son bo\'lishi kerak.');
        return;
      }
      await updateDtm(dtmId, { questionCount: Number(text) });
      await ctx.reply(
        `✅ Savol soni yangilandi.\n\n⚠️ "To'g'ri javoblar" maydonini ham yangilang.`,
        Markup.removeKeyboard()
      );
    } else if (field === 'answers') {
      const text = ctx.message.text?.trim();
      const parsed = parseAnswers(text, dtm.question_count);
      if (!parsed) {
        await ctx.reply(
          `❌ Javoblar noto'g'ri formatda. Aniq <b>${dtm.question_count}</b> ta a/b/c/d harfi kerak.`,
          { parse_mode: 'HTML' }
        );
        return;
      }
      await updateDtm(dtmId, { correctAnswers: parsed });
      await ctx.reply('✅ Javoblar yangilandi.', Markup.removeKeyboard());
    }
    await ctx.reply('Admin menyu:', adminMainKeyboard());
  } catch (err) {
    logger.error('editDtmScene error:', err);
    await ctx.reply('❌ Xatolik yuz berdi.', Markup.removeKeyboard());
  }
  return ctx.scene.leave();
});

module.exports = editDtmScene;
