'use strict';

const { Scenes, Markup } = require('telegraf');
const { SCENES, NAV } = require('../../constants');
const {
  createLesson,
  getNextLessonOrderNum,
} = require('../../database/queries');
const { isValidOrderNum } = require('../../utils/validators');
const { cancelKeyboard, adminMainKeyboard } = require('../../keyboards');
const logger = require('../../utils/logger');

const addLessonScene = new Scenes.WizardScene(
  SCENES.ADD_LESSON,

  // Qadam 1: dars nomini so'rash
  async (ctx) => {
    await ctx.reply(
      '➕ <b>Yangi dars qo\'shish</b>\n\nDars nomini kiriting (masalan: "1-dars"):',
      { parse_mode: 'HTML', ...cancelKeyboard() }
    );
    return ctx.wizard.next();
  },

  // Qadam 2: tartib raqamini so'rash
  async (ctx) => {
    const text = ctx.message?.text?.trim();
    if (!text) {
      await ctx.reply('Iltimos, matn kiriting.');
      return;
    }
    if (text === NAV.CANCEL) {
      await ctx.reply('Bekor qilindi.', Markup.removeKeyboard());
      await ctx.reply('Admin menyu:', adminMainKeyboard());
      return ctx.scene.leave();
    }
    if (text.length < 1 || text.length > 100) {
      await ctx.reply('❌ Nomi 1-100 belgi oralig\'ida bo\'lishi kerak.');
      return;
    }
    ctx.wizard.state.title = text;
    const nextOrder = await getNextLessonOrderNum();
    ctx.wizard.state.nextOrder = nextOrder;
    await ctx.reply(
      `Tartib raqamini kiriting (avtomatik taklif: <b>${nextOrder}</b>).\n\n` +
        `Shu raqamni ishlatish uchun "${nextOrder}" deb yozing yoki boshqasini kiriting:`,
      { parse_mode: 'HTML', ...cancelKeyboard() }
    );
    return ctx.wizard.next();
  },

  // Qadam 3: saqlash
  async (ctx) => {
    const text = ctx.message?.text?.trim();
    if (!text) {
      await ctx.reply('Iltimos, son kiriting.');
      return;
    }
    if (text === NAV.CANCEL) {
      await ctx.reply('Bekor qilindi.', Markup.removeKeyboard());
      await ctx.reply('Admin menyu:', adminMainKeyboard());
      return ctx.scene.leave();
    }
    if (!isValidOrderNum(text)) {
      await ctx.reply('❌ Tartib raqami 1 dan 10000 gacha bo\'lgan butun son bo\'lishi kerak.');
      return;
    }
    const orderNum = Number(text);

    try {
      const id = await createLesson({ title: ctx.wizard.state.title, orderNum });
      await ctx.reply(
        `✅ Dars qo'shildi!\n\n<b>${ctx.wizard.state.title}</b> (tartib: ${orderNum}, ID: ${id})`,
        { parse_mode: 'HTML', ...Markup.removeKeyboard() }
      );
      await ctx.reply('Admin menyu:', adminMainKeyboard());
    } catch (err) {
      logger.error('createLesson failed:', err);
      await ctx.reply('❌ Xatolik yuz berdi.', Markup.removeKeyboard());
    }
    return ctx.scene.leave();
  }
);

module.exports = addLessonScene;
