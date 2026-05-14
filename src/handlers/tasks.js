'use strict';

const {
  getActiveLessons,
  getActiveTasksByLesson,
  getLessonById,
  getTaskById,
} = require('../database/queries');
const {
  lessonsKeyboard,
  tasksKeyboard,
  mainMenuKeyboard,
} = require('../keyboards');
const { SCENES } = require('../constants');
const logger = require('../utils/logger');

// 📚 Vazifalar bo'limi — darslar ro'yxati
async function showLessons(ctx) {
  const lessons = await getActiveLessons();
  if (lessons.length === 0) {
    await ctx.reply(
      '📭 Hozircha darslar mavjud emas.\nIltimos, keyinroq qayta tekshiring.',
      mainMenuKeyboard()
    );
    return;
  }
  await ctx.reply(
    '📚 <b>Darslar</b>\n\nKerakli darsni tanlang:',
    { parse_mode: 'HTML', ...lessonsKeyboard(lessons) }
  );
}

// Dars tanlanganda — vazifalar ro'yxati
async function showTasksOfLesson(ctx, lessonId) {
  const lesson = await getLessonById(lessonId);
  if (!lesson || !lesson.is_active) {
    await ctx.answerCbQuery('Dars topilmadi yoki nofaol.');
    return;
  }
  const tasks = await getActiveTasksByLesson(lessonId);

  if (tasks.length === 0) {
    await ctx.editMessageText(
      `📭 <b>${lesson.title}</b>\n\nBu darsda hozircha vazifalar yo'q.`,
      {
        parse_mode: 'HTML',
        reply_markup: tasksKeyboard([]).reply_markup,
      }
    );
    return;
  }

  await ctx.editMessageText(
    `📚 <b>${lesson.title}</b>\n\nVazifani tanlang:`,
    {
      parse_mode: 'HTML',
      reply_markup: tasksKeyboard(tasks).reply_markup,
    }
  );
}

// Vazifa tanlanganda — PDF + javob so'rash
async function startTask(ctx, taskId) {
  try {
    const task = await getTaskById(taskId);
    if (!task || !task.is_active) {
      await ctx.answerCbQuery('Vazifa topilmadi yoki nofaol.');
      return;
    }

    await ctx.answerCbQuery();

    // Loading xabar
    const loadingMsg = await ctx.reply('📤 PDF yuborilmoqda...');

    // PDF'ni yuborish (file_id orqali)
    try {
      await ctx.replyWithDocument(task.pdf_file_id, {
        caption: `📄 ${task.title}`,
      });
    } catch (err) {
      logger.error('PDF send failed:', err);
      // Agar file_id eskirgan bo'lsa va mahalliy fayl mavjud bo'lsa
      if (task.pdf_path) {
        await ctx.replyWithDocument(
          { source: task.pdf_path },
          { caption: `📄 ${task.title}` }
        );
      } else {
        await ctx.reply(
          '❌ PDF yuborishda xatolik. Adminlar bilan bog\'laning.'
        );
        return;
      }
    } finally {
      // Loading xabarni o'chiramiz
      try {
        await ctx.deleteMessage(loadingMsg.message_id);
      } catch (_) {
        // muhim emas
      }
    }

    // Scene'ga o'tib javobni so'raymiz
    return ctx.scene.enter(SCENES.TASK_ANSWER, { task });
  } catch (err) {
    logger.error('startTask error:', err);
    await ctx.reply('❌ Xatolik yuz berdi.', mainMenuKeyboard());
  }
}

module.exports = { showLessons, showTasksOfLesson, startTask };
