'use strict';

const { Scenes, Markup } = require('telegraf');
const { SCENES, NAV } = require('../../constants');
const {
  createDtm,
  getNextDtmOrderNum,
} = require('../../database/queries');
const {
  isValidQuestionCount,
  parseAnswers,
} = require('../../utils/validators');
const { cancelKeyboard, adminMainKeyboard } = require('../../keyboards');
const { downloadPdfByFileId } = require('../../utils/downloadPdf');
const logger = require('../../utils/logger');

const addDtmScene = new Scenes.WizardScene(
  SCENES.ADD_DTM,

  async (ctx) => {
    await ctx.reply(
      '➕ <b>Yangi DTM variant</b>\n\nVariant nomini kiriting (masalan: "1-variant"):',
      { parse_mode: 'HTML', ...cancelKeyboard() }
    );
    return ctx.wizard.next();
  },

  async (ctx) => {
    const text = ctx.message?.text?.trim();
    if (text === NAV.CANCEL) {
      await ctx.reply('Bekor qilindi.', Markup.removeKeyboard());
      await ctx.reply('Admin menyu:', adminMainKeyboard());
      return ctx.scene.leave();
    }
    if (!text || text.length < 1 || text.length > 100) {
      await ctx.reply('❌ Nomi 1-100 belgi oralig\'ida bo\'lishi kerak.');
      return;
    }
    ctx.wizard.state.title = text;
    await ctx.reply('📄 Endi PDF faylni yuboring:', cancelKeyboard());
    return ctx.wizard.next();
  },

  async (ctx) => {
    if (ctx.message?.text === NAV.CANCEL) {
      await ctx.reply('Bekor qilindi.', Markup.removeKeyboard());
      await ctx.reply('Admin menyu:', adminMainKeyboard());
      return ctx.scene.leave();
    }
    const doc = ctx.message?.document;
    if (!doc) {
      await ctx.reply('❌ Iltimos, PDF fayl yuboring.');
      return;
    }
    if (doc.mime_type !== 'application/pdf') {
      await ctx.reply('❌ Faqat PDF formatdagi fayl qabul qilinadi.');
      return;
    }
    ctx.wizard.state.pdfFileId = doc.file_id;
    try {
      const localPath = await downloadPdfByFileId(ctx.telegram, doc.file_id);
      ctx.wizard.state.pdfPath = localPath;
    } catch (err) {
      logger.warn('DTM PDF zaxiralashda xato:', err.message);
      ctx.wizard.state.pdfPath = null;
    }
    await ctx.reply(
      '🔢 Nechta savol bor? (1-200 oralig\'ida):',
      cancelKeyboard()
    );
    return ctx.wizard.next();
  },

  async (ctx) => {
    const text = ctx.message?.text?.trim();
    if (text === NAV.CANCEL) {
      await ctx.reply('Bekor qilindi.', Markup.removeKeyboard());
      await ctx.reply('Admin menyu:', adminMainKeyboard());
      return ctx.scene.leave();
    }
    if (!isValidQuestionCount(text)) {
      await ctx.reply('❌ Savol soni 1-200 oralig\'ida butun son bo\'lishi kerak.');
      return;
    }
    ctx.wizard.state.questionCount = Number(text);
    await ctx.reply(
      `🔤 To'g'ri javoblarni kiriting (${ctx.wizard.state.questionCount} ta lotin kichik harfi):`,
      cancelKeyboard()
    );
    return ctx.wizard.next();
  },

  async (ctx) => {
    const text = ctx.message?.text?.trim();
    if (text === NAV.CANCEL) {
      await ctx.reply('Bekor qilindi.', Markup.removeKeyboard());
      await ctx.reply('Admin menyu:', adminMainKeyboard());
      return ctx.scene.leave();
    }
    const parsed = parseAnswers(text, ctx.wizard.state.questionCount);
    if (!parsed) {
      await ctx.reply(
        `❌ Javoblar noto'g'ri formatda. Aniq <b>${ctx.wizard.state.questionCount}</b> ta lotin kichik harfi kerak.`,
        { parse_mode: 'HTML' }
      );
      return;
    }
    ctx.wizard.state.correctAnswers = parsed;
    const orderNum = await getNextDtmOrderNum();
    ctx.wizard.state.orderNum = orderNum;

    await ctx.reply(
      `<b>Tasdiqlash:</b>\n\n` +
        `Nomi: <b>${ctx.wizard.state.title}</b>\n` +
        `Tartib: <b>${orderNum}</b>\n` +
        `Savol soni: <b>${ctx.wizard.state.questionCount}</b>\n` +
        `Javoblar: <code>${parsed}</code>\n\n` +
        `Saqlashga rozimisiz?`,
      {
        parse_mode: 'HTML',
        ...Markup.keyboard([['✅ Saqlashga roziman', '❌ Bekor qilish']])
          .resize()
          .oneTime(),
      }
    );
    return ctx.wizard.next();
  },

  async (ctx) => {
    const text = ctx.message?.text?.trim();
    if (text !== '✅ Saqlashga roziman') {
      await ctx.reply('Bekor qilindi.', Markup.removeKeyboard());
      await ctx.reply('Admin menyu:', adminMainKeyboard());
      return ctx.scene.leave();
    }
    try {
      const id = await createDtm({
        title: ctx.wizard.state.title,
        orderNum: ctx.wizard.state.orderNum,
        pdfFileId: ctx.wizard.state.pdfFileId,
        pdfPath: ctx.wizard.state.pdfPath,
        questionCount: ctx.wizard.state.questionCount,
        correctAnswers: ctx.wizard.state.correctAnswers,
      });
      await ctx.reply(
        `✅ DTM variant qo'shildi (ID: ${id}).`,
        Markup.removeKeyboard()
      );
      await ctx.reply('Admin menyu:', adminMainKeyboard());
    } catch (err) {
      logger.error('createDtm failed:', err);
      await ctx.reply('❌ Xatolik yuz berdi.', Markup.removeKeyboard());
    }
    return ctx.scene.leave();
  }
);

module.exports = addDtmScene;
