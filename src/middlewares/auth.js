'use strict';

const { getUserByTelegramId } = require('../database/queries');
const { SCENES } = require('../constants');

/**
 * Foydalanuvchi tekshiruvi.
 * Agar foydalanuvchi ro'yxatdan o'tmagan bo'lsa — registratsiya scene'ga jo'natadi.
 * /start buyrug'iga tegmaydi (uni start handleri o'zi boshqaradi).
 */
async function authMiddleware(ctx, next) {
  // Yangi xabar bo'lmasa (masalan, channel_post) — o'tkazib yuboramiz
  if (!ctx.from) return next();

  // /start handleri o'zini boshqaradi
  const text = ctx.message?.text;
  if (text && text.startsWith('/start')) {
    return next();
  }

  // Agar foydalanuvchi allaqachon scene ichida bo'lsa (masalan, registratsiya) — o'tkazib yuboramiz
  if (ctx.scene?.current) {
    return next();
  }

  const user = await getUserByTelegramId(ctx.from.id);
  if (!user) {
    // ro'yxatdan o'tmagan — registratsiyaga yuboramiz
    return ctx.scene.enter(SCENES.REGISTRATION);
  }

  // user obyektini context'ga biriktirib qo'yamiz
  ctx.dbUser = user;
  return next();
}

module.exports = authMiddleware;
