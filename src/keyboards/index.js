'use strict';

const { Markup } = require('telegraf');
const { MENU, NAV } = require('../constants');

// ===== USER KEYBOARDS =====

// Asosiy menyu — Reply Keyboard
function mainMenuKeyboard() {
  return Markup.keyboard([
    [MENU.TASKS],
    [MENU.DTM, MENU.CERTIFICATE],
  ]).resize();
}

// Telefon raqamini so'rash uchun Reply Keyboard
function phoneRequestKeyboard() {
  return Markup.keyboard([
    [Markup.button.contactRequest('📱 Raqamni yuborish')],
    [NAV.CANCEL],
  ])
    .resize()
    .oneTime();
}

// Cancel-only Reply Keyboard (scene'lar uchun)
function cancelKeyboard() {
  return Markup.keyboard([[NAV.CANCEL]]).resize().oneTime();
}

// Darslar ro'yxati — inline
function lessonsKeyboard(lessons) {
  const buttons = lessons.map((l) => [
    Markup.button.callback(l.title, `lesson_${l.id}`),
  ]);
  buttons.push([Markup.button.callback(NAV.HOME, 'home')]);
  return Markup.inlineKeyboard(buttons);
}

// Bitta dars ichidagi vazifalar
function tasksKeyboard(tasks) {
  const buttons = tasks.map((t) => [
    Markup.button.callback(t.title, `task_${t.id}`),
  ]);
  buttons.push([Markup.button.callback(NAV.BACK, 'lessons_back')]);
  buttons.push([Markup.button.callback(NAV.HOME, 'home')]);
  return Markup.inlineKeyboard(buttons);
}

// DTM variantlar
function dtmVariantsKeyboard(variants) {
  const buttons = variants.map((v) => [
    Markup.button.callback(v.title, `dtm_${v.id}`),
  ]);
  buttons.push([Markup.button.callback(NAV.HOME, 'home')]);
  return Markup.inlineKeyboard(buttons);
}

// Natijadan keyin (task uchun)
function afterTaskResultKeyboard(taskId, lessonId) {
  return Markup.inlineKeyboard([
    [Markup.button.callback('⬅️ Vazifalarga', `lesson_${lessonId}`)],
    [Markup.button.callback(NAV.HOME, 'home')],
  ]);
}

// Natijadan keyin (dtm uchun)
function afterDtmResultKeyboard(dtmId) {
  return Markup.inlineKeyboard([
    [Markup.button.callback('⬅️ DTM variantlar', 'dtm_back')],
    [Markup.button.callback(NAV.HOME, 'home')],
  ]);
}

// Sertifikat bo'limidan keyin
function certificateKeyboard() {
  return Markup.inlineKeyboard([[Markup.button.callback(NAV.HOME, 'home')]]);
}

// ===== ADMIN KEYBOARDS =====

function adminMainKeyboard() {
  return Markup.inlineKeyboard([
    [Markup.button.callback('📚 Darslar', 'admin_lessons')],
    [Markup.button.callback('📋 Vazifalar', 'admin_tasks')],
    [Markup.button.callback('📝 DTM variantlar', 'admin_dtm')],
    [Markup.button.callback('👥 Foydalanuvchilar', 'admin_users')],
    [Markup.button.callback('📊 Statistika', 'admin_stats')],
    [Markup.button.callback('📢 Broadcast', 'admin_broadcast')],
  ]);
}

// Darslar boshqaruvi ro'yxati
function adminLessonsKeyboard(lessons) {
  const buttons = lessons.map((l) => [
    Markup.button.callback(
      `${l.is_active ? '🟢' : '🔴'} ${l.title}`,
      `noop_${l.id}`
    ),
    Markup.button.callback('✏️', `admin_lesson_edit_${l.id}`),
    Markup.button.callback('🗑', `admin_lesson_delete_${l.id}`),
    Markup.button.callback('👁', `admin_lesson_toggle_${l.id}`),
  ]);
  buttons.push([
    Markup.button.callback('➕ Yangi dars qo\'shish', 'admin_lesson_add'),
  ]);
  buttons.push([Markup.button.callback('⬅️ Admin menyu', 'admin_back')]);
  return Markup.inlineKeyboard(buttons);
}

// Vazifalar uchun avval qaysi dars?
function adminLessonsForTasksKeyboard(lessons) {
  const buttons = lessons.map((l) => [
    Markup.button.callback(l.title, `admin_tasks_of_${l.id}`),
  ]);
  buttons.push([Markup.button.callback('⬅️ Admin menyu', 'admin_back')]);
  return Markup.inlineKeyboard(buttons);
}

// Bitta darsning vazifalari (admin uchun)
function adminTasksKeyboard(tasks, lessonId) {
  const buttons = tasks.map((t) => [
    Markup.button.callback(
      `${t.is_active ? '🟢' : '🔴'} ${t.title}`,
      `noop_${t.id}`
    ),
    Markup.button.callback('✏️', `admin_task_edit_${t.id}`),
    Markup.button.callback('🗑', `admin_task_delete_${t.id}`),
    Markup.button.callback('👁', `admin_task_toggle_${t.id}`),
  ]);
  buttons.push([
    Markup.button.callback(
      '➕ Yangi vazifa qo\'shish',
      `admin_task_add_${lessonId}`
    ),
  ]);
  buttons.push([Markup.button.callback('⬅️ Darslarni tanlash', 'admin_tasks')]);
  return Markup.inlineKeyboard(buttons);
}

// DTM ro'yxati (admin)
function adminDtmListKeyboard(variants) {
  const buttons = variants.map((v) => [
    Markup.button.callback(
      `${v.is_active ? '🟢' : '🔴'} ${v.title}`,
      `noop_${v.id}`
    ),
    Markup.button.callback('✏️', `admin_dtm_edit_${v.id}`),
    Markup.button.callback('🗑', `admin_dtm_delete_${v.id}`),
    Markup.button.callback('👁', `admin_dtm_toggle_${v.id}`),
  ]);
  buttons.push([
    Markup.button.callback('➕ Yangi DTM qo\'shish', 'admin_dtm_add'),
  ]);
  buttons.push([Markup.button.callback('⬅️ Admin menyu', 'admin_back')]);
  return Markup.inlineKeyboard(buttons);
}

// O'chirishni tasdiqlash
function confirmDeleteKeyboard(yesCb, noCb) {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback('✅ Ha, o\'chirish', yesCb),
      Markup.button.callback('❌ Yo\'q', noCb),
    ],
  ]);
}

// Foydalanuvchilar ro'yxati — har bir user bosiladigan tugma + paginatsiya
function usersListKeyboard(users, page, totalPages) {
  const buttons = users.map((u) => {
    const label = `${u.first_name} ${u.last_name} — 📞 ${u.phone}`;
    // Telegram callback_data max 64 byte — id juda kichik, muammo yo'q
    return [Markup.button.callback(label, `admin_user_view_${u.id}`)];
  });
  const navRow = [];
  if (page > 1) {
    navRow.push(
      Markup.button.callback('⬅️ Oldingi', `admin_users_page_${page - 1}`)
    );
  }
  navRow.push(Markup.button.callback(`${page}/${totalPages}`, 'noop'));
  if (page < totalPages) {
    navRow.push(
      Markup.button.callback('Keyingi ➡️', `admin_users_page_${page + 1}`)
    );
  }
  buttons.push(navRow);
  buttons.push([Markup.button.callback('⬅️ Admin menyu', 'admin_back')]);
  return Markup.inlineKeyboard(buttons);
}

// User detail sahifasi: natija tugmalari + paginatsiya + CSV export + orqaga
function userDetailKeyboard(userId, page, totalPages, results) {
  const buttons = [];

  // Har bir natija — bosiladigan tugma (batafsil ko'rish uchun)
  results.forEach((r) => {
    const percent =
      r.total_count > 0
        ? Math.round((r.correct_count / r.total_count) * 100)
        : 0;
    const icon = r.type === 'task' ? '✅' : '📝';
    const title = r.item_title || '(o\'chirilgan)';
    // Sana qisqa formatda: DD.MM HH:MM
    const dt = new Date(r.submitted_at);
    const pad = (n) => String(n).padStart(2, '0');
    const shortDate = `${pad(dt.getDate())}.${pad(dt.getMonth() + 1)} ${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
    const label = `${icon} ${title} — ${r.correct_count}/${r.total_count} (${percent}%) • ${shortDate}`;
    // Telegram tugma matni max ~60-70 belgi, qisqartiramiz
    const safeLabel = label.length > 64 ? label.slice(0, 61) + '...' : label;
    buttons.push([
      Markup.button.callback(safeLabel, `admin_result_view_${r.id}_${userId}`),
    ]);
  });

  if (totalPages > 1) {
    const navRow = [];
    if (page > 1) {
      navRow.push(
        Markup.button.callback(
          '⬅️ Oldingi',
          `admin_user_results_page_${userId}_${page - 1}`
        )
      );
    }
    navRow.push(Markup.button.callback(`${page}/${totalPages}`, 'noop'));
    if (page < totalPages) {
      navRow.push(
        Markup.button.callback(
          'Keyingi ➡️',
          `admin_user_results_page_${userId}_${page + 1}`
        )
      );
    }
    buttons.push(navRow);
  }
  if (results.length > 0) {
    buttons.push([
      Markup.button.callback(
        '📥 CSV yuklab olish',
        `admin_user_export_${userId}`
      ),
    ]);
  }
  buttons.push([
    Markup.button.callback('⬅️ Foydalanuvchilarga', 'admin_users'),
    Markup.button.callback('🏠 Admin menyu', 'admin_back'),
  ]);
  return Markup.inlineKeyboard(buttons);
}

// Natija batafsil sahifasidan ortga qaytish
function resultDetailKeyboard(userId) {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback(
        '⬅️ Foydalanuvchiga',
        `admin_user_view_${userId}`
      ),
    ],
    [Markup.button.callback('🏠 Admin menyu', 'admin_back')],
  ]);
}

// Vazifa tahriri uchun maydon tanlash
function taskEditFieldsKeyboard(taskId) {
  return Markup.inlineKeyboard([
    [Markup.button.callback('✏️ Nomi', `admin_task_edit_field_${taskId}_title`)],
    [Markup.button.callback('📄 PDF', `admin_task_edit_field_${taskId}_pdf`)],
    [
      Markup.button.callback(
        '🔢 Savol soni',
        `admin_task_edit_field_${taskId}_count`
      ),
    ],
    [
      Markup.button.callback(
        '🔤 To\'g\'ri javoblar',
        `admin_task_edit_field_${taskId}_answers`
      ),
    ],
    [Markup.button.callback('⬅️ Orqaga', `admin_task_back_to_list_${taskId}`)],
  ]);
}

function dtmEditFieldsKeyboard(dtmId) {
  return Markup.inlineKeyboard([
    [Markup.button.callback('✏️ Nomi', `admin_dtm_edit_field_${dtmId}_title`)],
    [Markup.button.callback('📄 PDF', `admin_dtm_edit_field_${dtmId}_pdf`)],
    [
      Markup.button.callback(
        '🔢 Savol soni',
        `admin_dtm_edit_field_${dtmId}_count`
      ),
    ],
    [
      Markup.button.callback(
        '🔤 To\'g\'ri javoblar',
        `admin_dtm_edit_field_${dtmId}_answers`
      ),
    ],
    [Markup.button.callback('⬅️ Orqaga', 'admin_dtm')],
  ]);
}

// Dars tahriri
function lessonEditFieldsKeyboard(lessonId) {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback(
        '✏️ Nomi',
        `admin_lesson_edit_field_${lessonId}_title`
      ),
    ],
    [
      Markup.button.callback(
        '🔢 Tartibi',
        `admin_lesson_edit_field_${lessonId}_order`
      ),
    ],
    [Markup.button.callback('⬅️ Orqaga', 'admin_lessons')],
  ]);
}

module.exports = {
  mainMenuKeyboard,
  phoneRequestKeyboard,
  cancelKeyboard,
  lessonsKeyboard,
  tasksKeyboard,
  dtmVariantsKeyboard,
  afterTaskResultKeyboard,
  afterDtmResultKeyboard,
  certificateKeyboard,
  adminMainKeyboard,
  adminLessonsKeyboard,
  adminLessonsForTasksKeyboard,
  adminTasksKeyboard,
  adminDtmListKeyboard,
  confirmDeleteKeyboard,
  usersListKeyboard,
  userDetailKeyboard,
  resultDetailKeyboard,
  taskEditFieldsKeyboard,
  dtmEditFieldsKeyboard,
  lessonEditFieldsKeyboard,
};
