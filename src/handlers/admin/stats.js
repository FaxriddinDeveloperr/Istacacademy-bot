'use strict';

const { getStats } = require('../../database/queries');
const { Markup } = require('telegraf');

async function showStats(ctx) {
  const stats = await getStats();

  const lines = [];
  lines.push('📊 <b>Statistika</b>\n');
  lines.push(`👥 Jami foydalanuvchilar: <b>${stats.totalUsers}</b>`);
  lines.push(`📅 Bugun qo'shilganlar: <b>${stats.todayUsers}</b>`);
  lines.push(`🎯 O'rtacha ball: <b>${stats.avgScorePercent}%</b>`);
  lines.push('');

  lines.push('🏆 <b>Eng faol foydalanuvchilar:</b>');
  if (stats.mostActiveUsers.length === 0) {
    lines.push('— hozircha ma\'lumot yo\'q');
  } else {
    stats.mostActiveUsers.forEach((u, i) => {
      lines.push(`${i + 1}. ${u.first_name} ${u.last_name} — ${u.attempts} ta urinish`);
    });
  }
  lines.push('');

  lines.push('🔥 <b>Eng ko\'p yechilgan vazifalar:</b>');
  if (stats.mostSolvedTasks.length === 0) {
    lines.push('— hozircha ma\'lumot yo\'q');
  } else {
    stats.mostSolvedTasks.forEach((t, i) => {
      lines.push(
        `${i + 1}. ${t.title} (${t.lesson_title}) — ${t.solves} marta`
      );
    });
  }

  const keyboard = Markup.inlineKeyboard([
    [Markup.button.callback('⬅️ Admin menyu', 'admin_back')],
  ]);

  const text = lines.join('\n');
  try {
    await ctx.editMessageText(text, {
      parse_mode: 'HTML',
      reply_markup: keyboard.reply_markup,
    });
  } catch (_) {
    await ctx.reply(text, { parse_mode: 'HTML', ...keyboard });
  }
}

module.exports = { showStats };
