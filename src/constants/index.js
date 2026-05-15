'use strict';

// Asosiy menyu tugmalari (Reply Keyboard matni)
const MENU = {
  TASKS: '📚 Vazifalar',
  DTM: '📝 DTM',
  CERTIFICATE: '🎓 Sertifikat',
};

// Umumiy navigatsiya matnlari
const NAV = {
  BACK: '⬅️ Orqaga',
  HOME: '🏠 Bosh menyu',
  CANCEL: '❌ Bekor qilish',
  RETRY: '🔄 Qayta yechish',
  CONFIRM_YES: '✅ Ha, saqlash',
  CONFIRM_NO: '❌ Yo\'q',
};

// Scene nomlari
const SCENES = {
  REGISTRATION: 'registrationScene',
  TASK_ANSWER: 'taskAnswerScene',
  DTM_ANSWER: 'dtmAnswerScene',
  ADD_LESSON: 'addLessonScene',
  EDIT_LESSON: 'editLessonScene',
  ADD_TASK: 'addTaskScene',
  EDIT_TASK: 'editTaskScene',
  ADD_DTM: 'addDtmScene',
  EDIT_DTM: 'editDtmScene',
  BROADCAST: 'broadcastScene',
};

// Validatsiya cheklovlari
const LIMITS = {
  NAME_MIN: 2,
  NAME_MAX: 50,
  MAX_QUESTIONS: 200,
  USERS_PER_PAGE: 10,
  RESULTS_PER_PAGE: 10,
};

// Result type
const RESULT_TYPE = {
  TASK: 'task',
  DTM: 'dtm',
};

// To'g'ri javob harflari (a..z — barcha kichik harflar qabul qilinadi)
const VALID_ANSWER_LETTERS = 'abcdefghijklmnopqrstuvwxyz'.split('');

module.exports = {
  MENU,
  NAV,
  SCENES,
  LIMITS,
  RESULT_TYPE,
  VALID_ANSWER_LETTERS,
};
