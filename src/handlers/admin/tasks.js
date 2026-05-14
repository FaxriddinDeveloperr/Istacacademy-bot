'use strict';

const {
  getAllLessons,
  getLessonById,
  getAllTasksByLesson,
  getTaskById,
  updateTask,
  deleteTask,
} = require('../../database/queries');
const {
  adminLessonsForTasksKeyboard,
  adminTasksKeyboard,
  taskEditFieldsKeyboard,
  confirmDeleteKeyboard,
} = require('../../keyboards');
const { SCENES } = require('../../constants');
const logger = require('../../utils/logger');

// 1-bosqich: dars tanlash
async function showLessonsForTasks(ctx) {
  const lessons = await getAllLessons();
  const text =
    lessons.length === 0
      ? '❌ Hech qanday dars yo\'q. Avval dars qo\'shing.'
      : '📋 <b>Vazifalar boshqaruvi</b>\n\nQaysi darsning vazifalari?';
  try {
    await ctx.editMessageText(text, {
      parse_mode: 'HTML',
      reply_markup: adminLessonsForTasksKeyboard(lessons).reply_markup,
    });
  } catch (_) {
    await ctx.reply(text, {
      parse_mode: 'HTML',
      ...adminLessonsForTasksKeyboard(lessons),
    });
  }
}

// 2-bosqich: dars tanlangandan keyin vazifalar
async function showTasksOfLessonAdmin(ctx, lessonId) {
  const lesson = await getLessonById(lessonId);
  if (!lesson) {
    await ctx.answerCbQuery('Dars topilmadi');
    return;
  }
  const tasks = await getAllTasksByLesson(lessonId);
  const text = `📋 <b>${lesson.title}</b> vazifalari\n\n🟢 — faol, 🔴 — nofaol`;
  try {
    await ctx.editMessageText(text, {
      parse_mode: 'HTML',
      reply_markup: adminTasksKeyboard(tasks, lessonId).reply_markup,
    });
  } catch (_) {
    await ctx.reply(text, {
      parse_mode: 'HTML',
      ...adminTasksKeyboard(tasks, lessonId),
    });
  }
}

async function handleAddTask(ctx, lessonId) {
  await ctx.answerCbQuery();
  return ctx.scene.enter(SCENES.ADD_TASK, { lessonId });
}

async function handleEditTask(ctx, taskId) {
  const task = await getTaskById(taskId);
  if (!task) {
    await ctx.answerCbQuery('Vazifa topilmadi');
    return;
  }
  await ctx.answerCbQuery();
  await ctx.editMessageText(
    `✏️ <b>Tahrirlash:</b> ${task.title}\n\nQaysi maydonni tahrirlamoqchisiz?`,
    {
      parse_mode: 'HTML',
      reply_markup: taskEditFieldsKeyboard(taskId).reply_markup,
    }
  );
}

async function handleEditTaskField(ctx, taskId, field) {
  await ctx.answerCbQuery();
  return ctx.scene.enter(SCENES.EDIT_TASK, { taskId, field });
}

async function handleToggleTask(ctx, taskId) {
  const task = await getTaskById(taskId);
  if (!task) {
    await ctx.answerCbQuery('Vazifa topilmadi');
    return;
  }
  const newActive = task.is_active ? 0 : 1;
  await updateTask(taskId, { isActive: newActive });
  await ctx.answerCbQuery(newActive ? 'Faol qilindi' : 'Nofaol qilindi');
  return showTasksOfLessonAdmin(ctx, task.lesson_id);
}

async function handleDeleteTask(ctx, taskId) {
  const task = await getTaskById(taskId);
  if (!task) {
    await ctx.answerCbQuery('Vazifa topilmadi');
    return;
  }
  await ctx.answerCbQuery();
  await ctx.editMessageText(
    `⚠️ <b>O'chirish:</b> ${task.title}\n\nRostdan ham o'chirmoqchimisiz?`,
    {
      parse_mode: 'HTML',
      reply_markup: confirmDeleteKeyboard(
        `admin_task_delete_confirm_${taskId}`,
        `admin_tasks_of_${task.lesson_id}`
      ).reply_markup,
    }
  );
}

async function handleDeleteTaskConfirm(ctx, taskId) {
  const task = await getTaskById(taskId);
  if (!task) {
    await ctx.answerCbQuery('Vazifa topilmadi');
    return;
  }
  const lessonId = task.lesson_id;
  try {
    await deleteTask(taskId);
    await ctx.answerCbQuery('O\'chirildi');
  } catch (err) {
    logger.error('deleteTask failed:', err);
    await ctx.answerCbQuery('Xatolik');
  }
  return showTasksOfLessonAdmin(ctx, lessonId);
}

async function handleTaskBackToList(ctx, taskId) {
  const task = await getTaskById(taskId);
  if (!task) {
    await ctx.answerCbQuery();
    return showLessonsForTasks(ctx);
  }
  await ctx.answerCbQuery();
  return showTasksOfLessonAdmin(ctx, task.lesson_id);
}

module.exports = {
  showLessonsForTasks,
  showTasksOfLessonAdmin,
  handleAddTask,
  handleEditTask,
  handleEditTaskField,
  handleToggleTask,
  handleDeleteTask,
  handleDeleteTaskConfirm,
  handleTaskBackToList,
};
