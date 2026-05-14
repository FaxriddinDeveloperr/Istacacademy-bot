'use strict';

const { Scenes, Markup } = require('telegraf');
const { SCENES, NAV } = require('../constants');
const {
  isValidName,
  isValidPhone,
  normalizePhone,
} = require('../utils/validators');
const { createUser, getUserByTelegramId } = require('../database/queries');
const {
  mainMenuKeyboard,
  phoneRequestKeyboard,
  cancelKeyboard,
} = require('../keyboards');
const logger = require('../utils/logger');

const registrationScene = new Scenes.WizardScene(
  SCENES.REGISTRATION,

  // Qadam 1: ismni so'rash
  async (ctx) => {
    // Allaqachon ro'yxatdan o'tgan bo'lsa — chiqib ketamiz
    const existing = await getUserByTelegramId(ctx.from.id);
    if (existing) {
      await ctx.reply('Siz allaqachon ro\'yxatdan o\'tgansiz ✅', mainMenuKeyboard());
      return ctx.scene.leave();
    }
    await ctx.reply(
      '👋 Assalomu alaykum!\n\nIltimos, <b>ismingizni</b> kiriting:',
      { parse_mode: 'HTML', ...cancelKeyboard() }
    );
    return ctx.wizard.next();
  },

  // Qadam 2: familiyani so'rash
  async (ctx) => {
    const text = ctx.message?.text?.trim();
    if (!text) {
      await ctx.reply('Iltimos, ismingizni matn ko\'rinishida kiriting.');
      return;
    }
    if (text === NAV.CANCEL) {
      await ctx.reply('Ro\'yxatdan o\'tish bekor qilindi.', Markup.removeKeyboard());
      return ctx.scene.leave();
    }
    if (!isValidName(text)) {
      await ctx.reply(
        '❌ Ism noto\'g\'ri kiritildi. Faqat harflardan iborat 2-50 belgili ism kiriting.'
      );
      return;
    }
    ctx.wizard.state.firstName = text;
    await ctx.reply('Endi <b>familiyangizni</b> kiriting:', {
      parse_mode: 'HTML',
      ...cancelKeyboard(),
    });
    return ctx.wizard.next();
  },

  // Qadam 3: telefonni so'rash
  async (ctx) => {
    const text = ctx.message?.text?.trim();
    if (!text) {
      await ctx.reply('Iltimos, familiyangizni matn ko\'rinishida kiriting.');
      return;
    }
    if (text === NAV.CANCEL) {
      await ctx.reply('Ro\'yxatdan o\'tish bekor qilindi.', Markup.removeKeyboard());
      return ctx.scene.leave();
    }
    if (!isValidName(text)) {
      await ctx.reply(
        '❌ Familiya noto\'g\'ri kiritildi. Faqat harflardan iborat 2-50 belgili familiya kiriting.'
      );
      return;
    }
    ctx.wizard.state.lastName = text;
    await ctx.reply(
      '📱 Telefon raqamingizni yuboring.\n\nQuyidagi tugmadan foydalaning yoki +998XXXXXXXXX formatda yozing:',
      phoneRequestKeyboard()
    );
    return ctx.wizard.next();
  },

  // Qadam 4: telefonni qabul qilish va saqlash
  async (ctx) => {
    let phone = null;

    // Agar contact yuborilgan bo'lsa
    if (ctx.message?.contact) {
      // Foydalanuvchi o'zining raqamini yuborganligiga ishonch hosil qilamiz
      if (
        ctx.message.contact.user_id &&
        ctx.message.contact.user_id !== ctx.from.id
      ) {
        await ctx.reply(
          '❌ Iltimos, faqat o\'zingizning raqamingizni yuboring.'
        );
        return;
      }
      phone = ctx.message.contact.phone_number;
    } else if (ctx.message?.text) {
      const text = ctx.message.text.trim();
      if (text === NAV.CANCEL) {
        await ctx.reply(
          'Ro\'yxatdan o\'tish bekor qilindi.',
          Markup.removeKeyboard()
        );
        return ctx.scene.leave();
      }
      phone = text;
    } else {
      await ctx.reply('Iltimos, telefon raqamingizni yuboring.');
      return;
    }

    if (!isValidPhone(phone)) {
      await ctx.reply(
        '❌ Telefon raqami noto\'g\'ri. Format: +998XXXXXXXXX yoki tugma orqali yuboring.',
        phoneRequestKeyboard()
      );
      return;
    }

    const normalized = normalizePhone(phone);

    try {
      await createUser({
        telegramId: ctx.from.id,
        firstName: ctx.wizard.state.firstName,
        lastName: ctx.wizard.state.lastName,
        phone: normalized,
        username: ctx.from.username || null,
      });

      await ctx.reply(
        `✅ Ro'yxatdan o'tdingiz!\n\n` +
          `Ism: <b>${ctx.wizard.state.firstName}</b>\n` +
          `Familiya: <b>${ctx.wizard.state.lastName}</b>\n` +
          `Telefon: <b>${normalized}</b>\n\n` +
          `Quyidagi menyudan kerakli bo'limni tanlang:`,
        { parse_mode: 'HTML', ...mainMenuKeyboard() }
      );
    } catch (err) {
      logger.error('createUser failed:', err);
      await ctx.reply(
        '❌ Xatolik yuz berdi. Iltimos, /start orqali qaytadan urinib ko\'ring.',
        Markup.removeKeyboard()
      );
    }
    return ctx.scene.leave();
  }
);

module.exports = registrationScene;
