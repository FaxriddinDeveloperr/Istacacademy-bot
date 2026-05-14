'use strict';

const {
  getUsersCount,
  getUsersPaginated,
  getUserById,
  getUserDetailedResults,
  getUserResultsCount,
  getUserDetailedStats,
  getResultByIdWithDetails,
} = require('../../database/queries');
const {
  usersListKeyboard,
  userDetailKeyboard,
  resultDetailKeyboard,
} = require('../../keyboards');
const { LIMITS, SCENES, RESULT_TYPE } = require('../../constants');
const { toCsvBuffer } = require('../../utils/csv');
const { checkAnswers } = require('../../utils/checkAnswers');
const logger = require('../../utils/logger');

// HTML maxsus belgilarni escape qilish
function escapeHtml(s) {
  if (s === null || s === undefined) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function fmtDate(d) {
  const dt = new Date(d);
  const pad = (n) => String(n).padStart(2, '0');
  return (
    `${pad(dt.getDate())}.${pad(dt.getMonth() + 1)}.${dt.getFullYear()} ` +
    `${pad(dt.getHours())}:${pad(dt.getMinutes())}`
  );
}

// Uzun matnni Telegram limitiga (4096) sig'adigan bo'laklarga bo'lish
function chunkText(text, maxLen = 4000) {
  if (text.length <= maxLen) return [text];
  const chunks = [];
  const lines = text.split('\n');
  let current = '';
  for (const line of lines) {
    if (current.length + line.length + 1 > maxLen) {
      if (current) chunks.push(current);
      current = line;
    } else {
      current = current ? current + '\n' + line : line;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

// ===== 1. Foydalanuvchilar ro'yxati =====
async function showUsers(ctx, page = 1) {
  const total = await getUsersCount();
  if (total === 0) {
    const text = '👥 Hozircha foydalanuvchilar yo\'q.';
    try {
      await ctx.editMessageText(text);
    } catch (_) {
      await ctx.reply(text);
    }
    return;
  }

  const perPage = LIMITS.USERS_PER_PAGE;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const offset = (currentPage - 1) * perPage;
  const users = await getUsersPaginated(perPage, offset);

  const text =
    `👥 <b>Foydalanuvchilar</b> (jami: ${total})\n\n` +
    `Batafsil ko'rish uchun foydalanuvchiga bosing 👇`;

  const keyboard = usersListKeyboard(users, currentPage, totalPages);

  try {
    await ctx.editMessageText(text, {
      parse_mode: 'HTML',
      reply_markup: keyboard.reply_markup,
    });
  } catch (_) {
    await ctx.reply(text, { parse_mode: 'HTML', ...keyboard });
  }
}

// ===== 2. User detail =====
async function showUserDetail(ctx, userId, page = 1) {
  const user = await getUserById(userId);
  if (!user) {
    await ctx.answerCbQuery('Foydalanuvchi topilmadi');
    return;
  }

  const stats = await getUserDetailedStats(userId);
  const totalResults = await getUserResultsCount(userId);
  const perPage = LIMITS.RESULTS_PER_PAGE;
  const totalPages = Math.max(1, Math.ceil(totalResults / perPage));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const offset = (currentPage - 1) * perPage;
  const results = await getUserDetailedResults(userId, perPage, offset);

  const uname = user.username ? '@' + user.username : '—';
  const lines = [];
  lines.push(
    `👤 <b>${escapeHtml(user.first_name)} ${escapeHtml(user.last_name)}</b>`
  );
  lines.push(`📞 ${escapeHtml(user.phone)}`);
  lines.push(`🆔 TG: <code>${user.telegram_id}</code> | ${escapeHtml(uname)}`);
  lines.push(`📅 Ro'yxatdan: ${fmtDate(user.registered_at)}`);
  lines.push('');
  lines.push('📊 <b>Statistika</b>');
  if (stats.total === 0) {
    lines.push('Hali hech qanday vazifa yechilmagan.');
  } else {
    lines.push(`• Jami urinishlar: <b>${stats.total}</b>`);
    lines.push(
      `• Vazifalar: <b>${stats.tasksCount}</b> | DTM: <b>${stats.dtmCount}</b>`
    );
    lines.push(`• O'rtacha ball: <b>${stats.avgPercent}%</b>`);
    lines.push(`• Eng yaxshi: <b>${stats.bestPercent}%</b>`);
  }

  if (totalResults > 0) {
    lines.push('');
    lines.push(
      `📋 <b>Natijalar</b> (sahifa ${currentPage}/${totalPages}, jami ${totalResults})`
    );
    lines.push(
      `Batafsil ko'rish uchun natijaga bosing 👇`
    );
  }

  const text = lines.join('\n');
  const keyboard = userDetailKeyboard(userId, currentPage, totalPages, results);

  try {
    await ctx.editMessageText(text, {
      parse_mode: 'HTML',
      reply_markup: keyboard.reply_markup,
    });
  } catch (_) {
    await ctx.reply(text, { parse_mode: 'HTML', ...keyboard });
  }
}

// ===== 3. Bitta natija batafsil =====
async function showResultDetail(ctx, resultId, userId) {
  const result = await getResultByIdWithDetails(resultId);
  if (!result) {
    await ctx.answerCbQuery('Natija topilmadi');
    return;
  }

  // Agar vazifa/DTM o'chirilgan bo'lsa correct_answers null
  // Bu holda batafsil tahlil qila olmaymiz
  if (!result.correct_answers) {
    const fallback =
      `📊 <b>Natija tafsiloti</b>\n\n` +
      `👤 <b>${escapeHtml(result.first_name)} ${escapeHtml(result.last_name)}</b>\n` +
      `📅 ${fmtDate(result.submitted_at)}\n\n` +
      `⚠️ Bu vazifa/DTM o'chirilgan, savol-javoblarni ko'rsatib bo'lmaydi.\n\n` +
      `To'g'ri: <b>${result.correct_count}/${result.total_count}</b>\n` +
      `Noto'g'ri: <b>${result.wrong_count}</b>\n` +
      `Foydalanuvchi javoblari: <code>${escapeHtml(result.user_answers)}</code>`;
    try {
      await ctx.editMessageText(fallback, {
        parse_mode: 'HTML',
        reply_markup: resultDetailKeyboard(userId).reply_markup,
      });
    } catch (_) {
      await ctx.reply(fallback, {
        parse_mode: 'HTML',
        ...resultDetailKeyboard(userId),
      });
    }
    return;
  }

  // Tahlilni qayta hisoblaymiz
  const breakdown = checkAnswers(
    result.user_answers,
    result.correct_answers
  );

  // Sarlavha
  const headerLines = [];
  headerLines.push('📊 <b>Natija tafsiloti</b>');
  headerLines.push('');
  headerLines.push(
    `👤 <b>${escapeHtml(result.first_name)} ${escapeHtml(result.last_name)}</b>`
  );
  headerLines.push(`📞 ${escapeHtml(result.phone)}`);
  const typeLabel =
    result.type === RESULT_TYPE.TASK ? 'Vazifa' : 'DTM variant';
  headerLines.push(`📋 ${typeLabel}: <b>${escapeHtml(result.item_title)}</b>`);
  if (result.type === RESULT_TYPE.TASK && result.lesson_title) {
    headerLines.push(`📚 Dars: ${escapeHtml(result.lesson_title)}`);
  }
  headerLines.push(`📅 ${fmtDate(result.submitted_at)}`);
  headerLines.push('');
  headerLines.push(
    `✅ To'g'ri: <b>${breakdown.correctCount}/${breakdown.totalCount}</b> (${breakdown.percent}%)`
  );
  headerLines.push(`❌ Noto'g'ri: <b>${breakdown.wrongCount}</b>`);
  headerLines.push('');
  headerLines.push('<b>Savol-javoblar:</b>');

  // To'g'ri/noto'g'rilar ro'yxati
  const detailLines = breakdown.details.map((d) => {
    if (d.isCorrect) {
      return `${d.idx}-savol: ✅ <code>${d.correct}</code> (siz: <code>${d.user}</code>)`;
    }
    return `${d.idx}-savol: ❌ siz: <code>${d.user}</code> — to'g'ri: <code>${d.correct}</code>`;
  });

  // Faqat noto'g'rilar — qisqa ko'rinish
  const wrongLines = breakdown.details
    .filter((d) => !d.isCorrect)
    .map(
      (d) =>
        `${d.idx}-savol: siz: <code>${d.user}</code> — to'g'ri: <code>${d.correct}</code>`
    );

  let fullText = [...headerLines, ...detailLines].join('\n');

  // Agar uzunlik 4000 dan oshsa — faqat noto'g'ri javoblarni ko'rsatamiz
  if (fullText.length > 4000) {
    const shortHeader = [...headerLines];
    // Oxiridagi "Savol-javoblar:" o'rniga "Noto'g'ri javoblar:" qo'yamiz
    shortHeader[shortHeader.length - 1] =
      `<b>Noto'g'ri javoblar</b> (jami ${breakdown.totalCount} ta savoldan):`;
    fullText = [
      ...shortHeader,
      ...(wrongLines.length > 0 ? wrongLines : ['🎉 Hammasi to\'g\'ri!']),
      '',
      `<i>Eslatma: savollar soni ko'p bo'lgani uchun faqat noto'g'rilar ko'rsatildi.</i>`,
    ].join('\n');
  }

  // Hali ham uzun bo'lsa — bo'laklab yuboramiz
  const chunks = chunkText(fullText, 4000);
  const keyboard = resultDetailKeyboard(userId);

  try {
    // Birinchi bo'lakni mavjud xabarni tahrirlash orqali
    await ctx.editMessageText(chunks[0], {
      parse_mode: 'HTML',
      reply_markup: chunks.length === 1 ? keyboard.reply_markup : undefined,
    });
    // Qolgan bo'laklar
    for (let i = 1; i < chunks.length; i++) {
      await ctx.reply(chunks[i], {
        parse_mode: 'HTML',
        ...(i === chunks.length - 1 ? keyboard : {}),
      });
    }
  } catch (err) {
    logger.error('showResultDetail edit failed:', err);
    // Edit imkonsiz bo'lsa — oddiy reply
    for (let i = 0; i < chunks.length; i++) {
      await ctx.reply(chunks[i], {
        parse_mode: 'HTML',
        ...(i === chunks.length - 1 ? keyboard : {}),
      });
    }
  }
}

// ===== 4. CSV export =====
async function exportUserResultsCsv(ctx, userId) {
  const user = await getUserById(userId);
  if (!user) {
    await ctx.answerCbQuery('Foydalanuvchi topilmadi');
    return;
  }

  await ctx.answerCbQuery('CSV tayyorlanmoqda...');

  const total = await getUserResultsCount(userId);
  if (total === 0) {
    await ctx.reply('📭 Bu foydalanuvchining natijalari yo\'q.');
    return;
  }

  const all = await getUserDetailedResults(userId, total, 0);

  const headers = [
    '№',
    'Tur',
    'Nomi',
    'Dars',
    'To\'g\'ri',
    'Noto\'g\'ri',
    'Jami',
    'Foiz',
    'Javoblar',
    'Sana',
  ];

  const rows = all.map((r, i) => {
    const percent =
      r.total_count > 0
        ? Math.round((r.correct_count / r.total_count) * 100)
        : 0;
    return [
      i + 1,
      r.type === RESULT_TYPE.TASK ? 'Vazifa' : 'DTM',
      r.item_title || '(o\'chirilgan)',
      r.lesson_title || '',
      r.correct_count,
      r.wrong_count,
      r.total_count,
      `${percent}%`,
      r.user_answers,
      new Date(r.submitted_at).toISOString(),
    ];
  });

  const buf = toCsvBuffer(headers, rows);
  const filename = `user_${user.id}_${user.first_name}_${user.last_name}_results.csv`
    .replace(/[^a-zA-Z0-9._-]/g, '_');

  try {
    await ctx.replyWithDocument(
      { source: buf, filename },
      {
        caption: `📊 ${user.first_name} ${user.last_name} — ${total} ta natija`,
      }
    );
  } catch (err) {
    logger.error('CSV export failed:', err);
    await ctx.reply('❌ CSV yuborishda xatolik.');
  }
}

async function handleBroadcast(ctx) {
  await ctx.answerCbQuery();
  return ctx.scene.enter(SCENES.BROADCAST);
}

module.exports = {
  showUsers,
  showUserDetail,
  showResultDetail,
  exportUserResultsCsv,
  handleBroadcast,
};
