'use strict';

const {
  getAllLessons,
  getLessonById,
  updateLesson,
  deleteLesson,
} = require('../../database/queries');
const {
  adminLessonsKeyboard,
  confirmDeleteKeyboard,
  lessonEditFieldsKeyboard,
} = require('../../keyboards');
const { SCENES } = require('../../constants');
const logger = require('../../utils/logger');

async function showLessonsAdmin(ctx) {
  const lessons = await getAllLessons();
  const text =
    lessons.length === 0
      ? '📚 <b>Darslar</b>\n\nHozircha darslar yo\'q.'
      : '📚 <b>Darslar</b>\n\n🟢 — faol, 🔴 — nofaol';
  try {
    await ctx.editMessageText(text, {
      parse_mode: 'HTML',
      reply_markup: adminLessonsKeyboard(lessons).reply_markup,
    });
  } catch (_) {
    await ctx.reply(text, {
      parse_mode: 'HTML',
      ...adminLessonsKeyboard(lessons),
    });
  }
}

async function handleAddLesson(ctx) {
  await ctx.answerCbQuery();
  return ctx.scene.enter(SCENES.ADD_LESSON);
}

async function handleEditLesson(ctx, lessonId) {
  const lesson = await getLessonById(lessonId);
  if (!lesson) {
    await ctx.answerCbQuery('Dars topilmadi');
    return;
  }
  await ctx.answerCbQuery();
  await ctx.editMessageText(
    `✏️ <b>Tahrirlash:</b> ${lesson.title}\n\nQaysi maydonni tahrirlamoqchisiz?`,
    {
      parse_mode: 'HTML',
      reply_markup: lessonEditFieldsKeyboard(lessonId).reply_markup,
    }
  );
}

async function handleEditLessonField(ctx, lessonId, field) {
  await ctx.answerCbQuery();
  return ctx.scene.enter(SCENES.EDIT_LESSON, { lessonId, field });
}

async function handleToggleLesson(ctx, lessonId) {
  const lesson = await getLessonById(lessonId);
  if (!lesson) {
    await ctx.answerCbQuery('Dars topilmadi');
    return;
  }
  const newActive = lesson.is_active ? 0 : 1;
  await updateLesson(lessonId, { isActive: newActive });
  await ctx.answerCbQuery(newActive ? 'Faol qilindi' : 'Nofaol qilindi');
  return showLessonsAdmin(ctx);
}

async function handleDeleteLesson(ctx, lessonId) {
  const lesson = await getLessonById(lessonId);
  if (!lesson) {
    await ctx.answerCbQuery('Dars topilmadi');
    return;
  }
  await ctx.answerCbQuery();
  await ctx.editMessageText(
    `⚠️ <b>O'chirish:</b> ${lesson.title}\n\nDars va uning barcha vazifalari o'chiriladi.\nRostdan ham o'chirmoqchimisiz?`,
    {
      parse_mode: 'HTML',
      reply_markup: confirmDeleteKeyboard(
        `admin_lesson_delete_confirm_${lessonId}`,
        'admin_lessons'
      ).reply_markup,
    }
  );
}

async function handleDeleteLessonConfirm(ctx, lessonId) {
  try {
    await deleteLesson(lessonId);
    await ctx.answerCbQuery('O\'chirildi');
  } catch (err) {
    logger.error('deleteLesson failed:', err);
    await ctx.answerCbQuery('Xatolik');
  }
  return showLessonsAdmin(ctx);
}

module.exports = {
  showLessonsAdmin,
  handleAddLesson,
  handleEditLesson,
  handleEditLessonField,
  handleToggleLesson,
  handleDeleteLesson,
  handleDeleteLessonConfirm,
};
