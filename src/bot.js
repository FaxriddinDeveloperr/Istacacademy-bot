'use strict';

const { Telegraf, Scenes, session } = require('telegraf');

// Scenes
const registrationScene = require('./scenes/registration');
const taskAnswerScene = require('./scenes/taskAnswer');
const dtmAnswerScene = require('./scenes/dtmAnswer');
const addLessonScene = require('./scenes/admin/addLesson');
const editLessonScene = require('./scenes/admin/editLesson');
const addTaskScene = require('./scenes/admin/addTask');
const editTaskScene = require('./scenes/admin/editTask');
const addDtmScene = require('./scenes/admin/addDtm');
const editDtmScene = require('./scenes/admin/editDtm');
const broadcastScene = require('./scenes/admin/broadcast');

// Middlewares
const authMiddleware = require('./middlewares/auth');
const { adminOnly } = require('./middlewares/adminOnly');

// Handlers
const startHandler = require('./handlers/start');
const { showMainMenu } = require('./handlers/menu');
const {
  showLessons,
  showTasksOfLesson,
  startTask,
} = require('./handlers/tasks');
const {
  showDtmVariants,
  startDtm,
} = require('./handlers/dtm');
const { showCertificate } = require('./handlers/certificate');

// Admin handlers
const adminMenu = require('./handlers/admin');
const adminLessons = require('./handlers/admin/lessons');
const adminTasks = require('./handlers/admin/tasks');
const adminDtm = require('./handlers/admin/dtm');
const adminUsers = require('./handlers/admin/users');
const adminStats = require('./handlers/admin/stats');

const { MENU } = require('./constants');
const logger = require('./utils/logger');

function createBot(token) {
  const bot = new Telegraf(token);

  // Stage va sceneslar
  const stage = new Scenes.Stage([
    registrationScene,
    taskAnswerScene,
    dtmAnswerScene,
    addLessonScene,
    editLessonScene,
    addTaskScene,
    editTaskScene,
    addDtmScene,
    editDtmScene,
    broadcastScene,
  ]);

  bot.use(session());
  bot.use(stage.middleware());

  // /start — auth middleware'siz
  bot.start(startHandler);

  // Boshqa hammasi auth orqali
  bot.use(authMiddleware);

  // === Asosiy menyu tugmalari (Reply Keyboard) ===
  bot.hears(MENU.TASKS, async (ctx) => {
    await showLessons(ctx);
  });
  bot.hears(MENU.DTM, async (ctx) => {
    await showDtmVariants(ctx);
  });
  bot.hears(MENU.CERTIFICATE, async (ctx) => {
    await showCertificate(ctx);
  });

  // === Inline callback'lar (foydalanuvchi qismi) ===

  bot.action('home', async (ctx) => {
    try {
      await ctx.answerCbQuery();
      await ctx.deleteMessage().catch(() => {});
    } catch (_) {
      // ignore
    }
    await showMainMenu(ctx);
  });

  bot.action('lessons_back', async (ctx) => {
    await ctx.answerCbQuery();
    const { getActiveLessons } = require('./database/queries');
    const { lessonsKeyboard } = require('./keyboards');
    const lessons = await getActiveLessons();
    if (lessons.length === 0) {
      await ctx.editMessageText('📭 Hozircha darslar mavjud emas.');
      return;
    }
    await ctx.editMessageText('📚 <b>Darslar</b>\n\nKerakli darsni tanlang:', {
      parse_mode: 'HTML',
      reply_markup: lessonsKeyboard(lessons).reply_markup,
    });
  });

  bot.action(/^lesson_(\d+)$/, async (ctx) => {
    const lessonId = Number(ctx.match[1]);
    await ctx.answerCbQuery();
    await showTasksOfLesson(ctx, lessonId);
  });

  bot.action(/^task_(\d+)$/, async (ctx) => {
    const taskId = Number(ctx.match[1]);
    await startTask(ctx, taskId);
  });

  bot.action('dtm_back', async (ctx) => {
    await ctx.answerCbQuery();
    const { getActiveDtmVariants } = require('./database/queries');
    const { dtmVariantsKeyboard } = require('./keyboards');
    const variants = await getActiveDtmVariants();
    if (variants.length === 0) {
      await ctx.editMessageText('📭 Hozircha DTM variantlari mavjud emas.');
      return;
    }
    await ctx.editMessageText(
      '📝 <b>DTM variantlari</b>\n\nKerakli variantni tanlang:',
      {
        parse_mode: 'HTML',
        reply_markup: dtmVariantsKeyboard(variants).reply_markup,
      }
    );
  });

  bot.action(/^dtm_(\d+)$/, async (ctx) => {
    const dtmId = Number(ctx.match[1]);
    await startDtm(ctx, dtmId);
  });

  // === /admin — faqat ADMIN_IDS uchun ===
  bot.command('admin', adminOnly, async (ctx) => {
    await adminMenu.showAdminMenu(ctx);
  });

  // Barcha admin callback'lar uchun adminOnly middleware
  // Telegraf'da action middleware'larini chain qilamiz
  const adminGuard = async (ctx, next) => {
    if (!ctx.from) return;
    const { isAdmin } = require('./middlewares/adminOnly');
    if (!isAdmin(ctx.from.id)) {
      try {
        await ctx.answerCbQuery();
      } catch (_) {
        // ignore
      }
      return;
    }
    return next();
  };

  // Admin menyu navigatsiyasi
  bot.action('admin_back', adminGuard, async (ctx) => {
    await ctx.answerCbQuery();
    await adminMenu.showAdminMenuEdit(ctx);
  });

  // === Lessons ===
  bot.action('admin_lessons', adminGuard, async (ctx) => {
    await ctx.answerCbQuery();
    await adminLessons.showLessonsAdmin(ctx);
  });
  bot.action('admin_lesson_add', adminGuard, adminLessons.handleAddLesson);
  bot.action(/^admin_lesson_edit_(\d+)$/, adminGuard, async (ctx) => {
    await adminLessons.handleEditLesson(ctx, Number(ctx.match[1]));
  });
  bot.action(
    /^admin_lesson_edit_field_(\d+)_(title|order)$/,
    adminGuard,
    async (ctx) => {
      await adminLessons.handleEditLessonField(
        ctx,
        Number(ctx.match[1]),
        ctx.match[2]
      );
    }
  );
  bot.action(/^admin_lesson_toggle_(\d+)$/, adminGuard, async (ctx) => {
    await adminLessons.handleToggleLesson(ctx, Number(ctx.match[1]));
  });
  bot.action(/^admin_lesson_delete_(\d+)$/, adminGuard, async (ctx) => {
    await adminLessons.handleDeleteLesson(ctx, Number(ctx.match[1]));
  });
  bot.action(/^admin_lesson_delete_confirm_(\d+)$/, adminGuard, async (ctx) => {
    await adminLessons.handleDeleteLessonConfirm(ctx, Number(ctx.match[1]));
  });

  // === Tasks ===
  bot.action('admin_tasks', adminGuard, async (ctx) => {
    await ctx.answerCbQuery();
    await adminTasks.showLessonsForTasks(ctx);
  });
  bot.action(/^admin_tasks_of_(\d+)$/, adminGuard, async (ctx) => {
    await ctx.answerCbQuery();
    await adminTasks.showTasksOfLessonAdmin(ctx, Number(ctx.match[1]));
  });
  bot.action(/^admin_task_add_(\d+)$/, adminGuard, async (ctx) => {
    await adminTasks.handleAddTask(ctx, Number(ctx.match[1]));
  });
  bot.action(/^admin_task_edit_(\d+)$/, adminGuard, async (ctx) => {
    await adminTasks.handleEditTask(ctx, Number(ctx.match[1]));
  });
  bot.action(
    /^admin_task_edit_field_(\d+)_(title|pdf|count|answers)$/,
    adminGuard,
    async (ctx) => {
      await adminTasks.handleEditTaskField(
        ctx,
        Number(ctx.match[1]),
        ctx.match[2]
      );
    }
  );
  bot.action(/^admin_task_toggle_(\d+)$/, adminGuard, async (ctx) => {
    await adminTasks.handleToggleTask(ctx, Number(ctx.match[1]));
  });
  bot.action(/^admin_task_delete_(\d+)$/, adminGuard, async (ctx) => {
    await adminTasks.handleDeleteTask(ctx, Number(ctx.match[1]));
  });
  bot.action(/^admin_task_delete_confirm_(\d+)$/, adminGuard, async (ctx) => {
    await adminTasks.handleDeleteTaskConfirm(ctx, Number(ctx.match[1]));
  });
  bot.action(/^admin_task_back_to_list_(\d+)$/, adminGuard, async (ctx) => {
    await adminTasks.handleTaskBackToList(ctx, Number(ctx.match[1]));
  });

  // === DTM ===
  bot.action('admin_dtm', adminGuard, async (ctx) => {
    await ctx.answerCbQuery();
    await adminDtm.showDtmAdmin(ctx);
  });
  bot.action('admin_dtm_add', adminGuard, adminDtm.handleAddDtm);
  bot.action(/^admin_dtm_edit_(\d+)$/, adminGuard, async (ctx) => {
    await adminDtm.handleEditDtm(ctx, Number(ctx.match[1]));
  });
  bot.action(
    /^admin_dtm_edit_field_(\d+)_(title|pdf|count|answers)$/,
    adminGuard,
    async (ctx) => {
      await adminDtm.handleEditDtmField(
        ctx,
        Number(ctx.match[1]),
        ctx.match[2]
      );
    }
  );
  bot.action(/^admin_dtm_toggle_(\d+)$/, adminGuard, async (ctx) => {
    await adminDtm.handleToggleDtm(ctx, Number(ctx.match[1]));
  });
  bot.action(/^admin_dtm_delete_(\d+)$/, adminGuard, async (ctx) => {
    await adminDtm.handleDeleteDtm(ctx, Number(ctx.match[1]));
  });
  bot.action(/^admin_dtm_delete_confirm_(\d+)$/, adminGuard, async (ctx) => {
    await adminDtm.handleDeleteDtmConfirm(ctx, Number(ctx.match[1]));
  });

  // === Users ===
  bot.action('admin_users', adminGuard, async (ctx) => {
    await ctx.answerCbQuery();
    await adminUsers.showUsers(ctx, 1);
  });
  bot.action(/^admin_users_page_(\d+)$/, adminGuard, async (ctx) => {
    await ctx.answerCbQuery();
    await adminUsers.showUsers(ctx, Number(ctx.match[1]));
  });
  bot.action(/^admin_user_view_(\d+)$/, adminGuard, async (ctx) => {
    await ctx.answerCbQuery();
    await adminUsers.showUserDetail(ctx, Number(ctx.match[1]), 1);
  });
  bot.action(
    /^admin_user_results_page_(\d+)_(\d+)$/,
    adminGuard,
    async (ctx) => {
      await ctx.answerCbQuery();
      await adminUsers.showUserDetail(
        ctx,
        Number(ctx.match[1]),
        Number(ctx.match[2])
      );
    }
  );
  bot.action(/^admin_user_export_(\d+)$/, adminGuard, async (ctx) => {
    await adminUsers.exportUserResultsCsv(ctx, Number(ctx.match[1]));
  });
  bot.action(
    /^admin_result_view_(\d+)_(\d+)$/,
    adminGuard,
    async (ctx) => {
      await ctx.answerCbQuery();
      await adminUsers.showResultDetail(
        ctx,
        Number(ctx.match[1]),
        Number(ctx.match[2])
      );
    }
  );
  bot.action('admin_broadcast', adminGuard, adminUsers.handleBroadcast);

  // === Stats ===
  bot.action('admin_stats', adminGuard, async (ctx) => {
    await ctx.answerCbQuery();
    await adminStats.showStats(ctx);
  });

  // No-op tugmalar (faqat ko'rinish uchun)
  bot.action(/^noop/, async (ctx) => {
    await ctx.answerCbQuery();
  });

  // === Global xato boshqaruvi ===
  bot.catch((err, ctx) => {
    logger.error('Telegraf error:', err);
    try {
      ctx.reply('❌ Xatolik yuz berdi. Iltimos, qaytadan urinib ko\'ring.');
    } catch (_) {
      // ignore
    }
  });

  return bot;
}

module.exports = { createBot };
