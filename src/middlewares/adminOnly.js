'use strict';

/**
 * Faqat .env'dagi ADMIN_IDS ro'yxatidagi foydalanuvchilarni o'tkazadi.
 * Boshqalar uchun hech qanday javob qaytarmaydi — go'yo handler mavjud emas.
 */
function getAdminIds() {
  const raw = process.env.ADMIN_IDS || '';
  return raw
    .split(',')
    .map((id) => Number(id.trim()))
    .filter((id) => Number.isInteger(id) && id > 0);
}

function isAdmin(telegramId) {
  return getAdminIds().includes(Number(telegramId));
}

async function adminOnly(ctx, next) {
  if (!ctx.from) return; // hech qanday ma'lumotsiz — jim turamiz
  if (!isAdmin(ctx.from.id)) {
    // jim — go'yo /admin yo'q
    return;
  }
  return next();
}

module.exports = { adminOnly, isAdmin, getAdminIds };
