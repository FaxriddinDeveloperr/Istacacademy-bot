'use strict';

const {
  getAllDtmVariants,
  getDtmById,
  updateDtm,
  deleteDtm,
} = require('../../database/queries');
const {
  adminDtmListKeyboard,
  dtmEditFieldsKeyboard,
  confirmDeleteKeyboard,
} = require('../../keyboards');
const { SCENES } = require('../../constants');
const logger = require('../../utils/logger');

async function showDtmAdmin(ctx) {
  const variants = await getAllDtmVariants();
  const text =
    variants.length === 0
      ? '📝 <b>DTM variantlar</b>\n\nHozircha variantlar yo\'q.'
      : '📝 <b>DTM variantlar</b>\n\n🟢 — faol, 🔴 — nofaol';
  try {
    await ctx.editMessageText(text, {
      parse_mode: 'HTML',
      reply_markup: adminDtmListKeyboard(variants).reply_markup,
    });
  } catch (_) {
    await ctx.reply(text, {
      parse_mode: 'HTML',
      ...adminDtmListKeyboard(variants),
    });
  }
}

async function handleAddDtm(ctx) {
  await ctx.answerCbQuery();
  return ctx.scene.enter(SCENES.ADD_DTM);
}

async function handleEditDtm(ctx, dtmId) {
  const dtm = await getDtmById(dtmId);
  if (!dtm) {
    await ctx.answerCbQuery('Variant topilmadi');
    return;
  }
  await ctx.answerCbQuery();
  await ctx.editMessageText(
    `✏️ <b>Tahrirlash:</b> ${dtm.title}\n\nQaysi maydonni tahrirlamoqchisiz?`,
    {
      parse_mode: 'HTML',
      reply_markup: dtmEditFieldsKeyboard(dtmId).reply_markup,
    }
  );
}

async function handleEditDtmField(ctx, dtmId, field) {
  await ctx.answerCbQuery();
  return ctx.scene.enter(SCENES.EDIT_DTM, { dtmId, field });
}

async function handleToggleDtm(ctx, dtmId) {
  const dtm = await getDtmById(dtmId);
  if (!dtm) {
    await ctx.answerCbQuery('Variant topilmadi');
    return;
  }
  const newActive = dtm.is_active ? 0 : 1;
  await updateDtm(dtmId, { isActive: newActive });
  await ctx.answerCbQuery(newActive ? 'Faol qilindi' : 'Nofaol qilindi');
  return showDtmAdmin(ctx);
}

async function handleDeleteDtm(ctx, dtmId) {
  const dtm = await getDtmById(dtmId);
  if (!dtm) {
    await ctx.answerCbQuery('Variant topilmadi');
    return;
  }
  await ctx.answerCbQuery();
  await ctx.editMessageText(
    `⚠️ <b>O'chirish:</b> ${dtm.title}\n\nRostdan ham o'chirmoqchimisiz?`,
    {
      parse_mode: 'HTML',
      reply_markup: confirmDeleteKeyboard(
        `admin_dtm_delete_confirm_${dtmId}`,
        'admin_dtm'
      ).reply_markup,
    }
  );
}

async function handleDeleteDtmConfirm(ctx, dtmId) {
  try {
    await deleteDtm(dtmId);
    await ctx.answerCbQuery('O\'chirildi');
  } catch (err) {
    logger.error('deleteDtm failed:', err);
    await ctx.answerCbQuery('Xatolik');
  }
  return showDtmAdmin(ctx);
}

module.exports = {
  showDtmAdmin,
  handleAddDtm,
  handleEditDtm,
  handleEditDtmField,
  handleToggleDtm,
  handleDeleteDtm,
  handleDeleteDtmConfirm,
};
