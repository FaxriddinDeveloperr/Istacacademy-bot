'use strict';

const pool = require('./db');

// Yordamchi: bitta qator olish
async function one(sql, params = []) {
  const res = await pool.query(sql, params);
  return res.rows[0] || null;
}

// Yordamchi: bir nechta qatorlar olish
async function many(sql, params = []) {
  const res = await pool.query(sql, params);
  return res.rows;
}

// Yordamchi: o'zgartirish (rowCount qaytaradi)
async function run(sql, params = []) {
  const res = await pool.query(sql, params);
  return res.rowCount;
}

// ===== USERS =====

async function getUserByTelegramId(telegramId) {
  return one('SELECT * FROM users WHERE telegram_id = $1', [telegramId]);
}

async function createUser({ telegramId, firstName, lastName, phone, username }) {
  const row = await one(
    `INSERT INTO users (telegram_id, first_name, last_name, phone, username)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id`,
    [telegramId, firstName, lastName, phone, username || null]
  );
  return row?.id;
}

async function getAllUsers() {
  return many('SELECT * FROM users ORDER BY registered_at DESC');
}

async function getUsersPaginated(limit, offset) {
  return many(
    'SELECT * FROM users ORDER BY registered_at DESC LIMIT $1 OFFSET $2',
    [limit, offset]
  );
}

async function getUserById(id) {
  return one('SELECT * FROM users WHERE id = $1', [id]);
}

async function getUsersCount() {
  const row = await one('SELECT COUNT(*)::int AS cnt FROM users');
  return row?.cnt ?? 0;
}

async function getTodayUsersCount() {
  const row = await one(
    `SELECT COUNT(*)::int AS cnt FROM users
     WHERE registered_at >= date_trunc('day', NOW())`
  );
  return row?.cnt ?? 0;
}

// ===== LESSONS =====

async function getActiveLessons() {
  return many(
    'SELECT * FROM lessons WHERE is_active = 1 ORDER BY order_num ASC'
  );
}

async function getAllLessons() {
  return many('SELECT * FROM lessons ORDER BY order_num ASC');
}

async function getLessonById(id) {
  return one('SELECT * FROM lessons WHERE id = $1', [id]);
}

async function createLesson({ title, orderNum }) {
  const row = await one(
    'INSERT INTO lessons (title, order_num) VALUES ($1, $2) RETURNING id',
    [title, orderNum]
  );
  return row?.id;
}

async function updateLesson(id, { title, orderNum, isActive }) {
  const lesson = await getLessonById(id);
  if (!lesson) return false;
  const newTitle = title !== undefined ? title : lesson.title;
  const newOrder = orderNum !== undefined ? orderNum : lesson.order_num;
  const newActive = isActive !== undefined ? isActive : lesson.is_active;
  await run(
    'UPDATE lessons SET title = $1, order_num = $2, is_active = $3 WHERE id = $4',
    [newTitle, newOrder, newActive, id]
  );
  return true;
}

async function deleteLesson(id) {
  const cnt = await run('DELETE FROM lessons WHERE id = $1', [id]);
  return cnt > 0;
}

async function getNextLessonOrderNum() {
  const row = await one(
    'SELECT COALESCE(MAX(order_num), 0) + 1 AS next FROM lessons'
  );
  return Number(row?.next ?? 1);
}

// ===== TASKS =====

async function getActiveTasksByLesson(lessonId) {
  return many(
    'SELECT * FROM tasks WHERE lesson_id = $1 AND is_active = 1 ORDER BY order_num ASC',
    [lessonId]
  );
}

async function getAllTasksByLesson(lessonId) {
  return many(
    'SELECT * FROM tasks WHERE lesson_id = $1 ORDER BY order_num ASC',
    [lessonId]
  );
}

async function getTaskById(id) {
  return one('SELECT * FROM tasks WHERE id = $1', [id]);
}

async function createTask({
  lessonId,
  title,
  orderNum,
  pdfFileId,
  pdfPath,
  questionCount,
  correctAnswers,
}) {
  const row = await one(
    `INSERT INTO tasks
       (lesson_id, title, order_num, pdf_file_id, pdf_path, question_count, correct_answers)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id`,
    [
      lessonId,
      title,
      orderNum,
      pdfFileId,
      pdfPath || null,
      questionCount,
      correctAnswers,
    ]
  );
  return row?.id;
}

async function updateTask(id, fields) {
  const task = await getTaskById(id);
  if (!task) return false;
  const merged = {
    title: fields.title !== undefined ? fields.title : task.title,
    order_num: fields.orderNum !== undefined ? fields.orderNum : task.order_num,
    pdf_file_id:
      fields.pdfFileId !== undefined ? fields.pdfFileId : task.pdf_file_id,
    pdf_path: fields.pdfPath !== undefined ? fields.pdfPath : task.pdf_path,
    question_count:
      fields.questionCount !== undefined
        ? fields.questionCount
        : task.question_count,
    correct_answers:
      fields.correctAnswers !== undefined
        ? fields.correctAnswers
        : task.correct_answers,
    is_active:
      fields.isActive !== undefined ? fields.isActive : task.is_active,
  };
  await run(
    `UPDATE tasks SET
       title=$1, order_num=$2, pdf_file_id=$3, pdf_path=$4,
       question_count=$5, correct_answers=$6, is_active=$7
     WHERE id=$8`,
    [
      merged.title,
      merged.order_num,
      merged.pdf_file_id,
      merged.pdf_path,
      merged.question_count,
      merged.correct_answers,
      merged.is_active,
      id,
    ]
  );
  return true;
}

async function deleteTask(id) {
  const cnt = await run('DELETE FROM tasks WHERE id = $1', [id]);
  return cnt > 0;
}

async function getNextTaskOrderNum(lessonId) {
  const row = await one(
    'SELECT COALESCE(MAX(order_num), 0) + 1 AS next FROM tasks WHERE lesson_id = $1',
    [lessonId]
  );
  return Number(row?.next ?? 1);
}

// ===== DTM VARIANTS =====

async function getActiveDtmVariants() {
  return many(
    'SELECT * FROM dtm_variants WHERE is_active = 1 ORDER BY order_num ASC'
  );
}

async function getAllDtmVariants() {
  return many('SELECT * FROM dtm_variants ORDER BY order_num ASC');
}

async function getDtmById(id) {
  return one('SELECT * FROM dtm_variants WHERE id = $1', [id]);
}

async function createDtm({
  title,
  orderNum,
  pdfFileId,
  pdfPath,
  questionCount,
  correctAnswers,
}) {
  const row = await one(
    `INSERT INTO dtm_variants
       (title, order_num, pdf_file_id, pdf_path, question_count, correct_answers)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id`,
    [
      title,
      orderNum,
      pdfFileId,
      pdfPath || null,
      questionCount,
      correctAnswers,
    ]
  );
  return row?.id;
}

async function updateDtm(id, fields) {
  const dtm = await getDtmById(id);
  if (!dtm) return false;
  const merged = {
    title: fields.title !== undefined ? fields.title : dtm.title,
    order_num: fields.orderNum !== undefined ? fields.orderNum : dtm.order_num,
    pdf_file_id:
      fields.pdfFileId !== undefined ? fields.pdfFileId : dtm.pdf_file_id,
    pdf_path: fields.pdfPath !== undefined ? fields.pdfPath : dtm.pdf_path,
    question_count:
      fields.questionCount !== undefined
        ? fields.questionCount
        : dtm.question_count,
    correct_answers:
      fields.correctAnswers !== undefined
        ? fields.correctAnswers
        : dtm.correct_answers,
    is_active:
      fields.isActive !== undefined ? fields.isActive : dtm.is_active,
  };
  await run(
    `UPDATE dtm_variants SET
       title=$1, order_num=$2, pdf_file_id=$3, pdf_path=$4,
       question_count=$5, correct_answers=$6, is_active=$7
     WHERE id=$8`,
    [
      merged.title,
      merged.order_num,
      merged.pdf_file_id,
      merged.pdf_path,
      merged.question_count,
      merged.correct_answers,
      merged.is_active,
      id,
    ]
  );
  return true;
}

async function deleteDtm(id) {
  const cnt = await run('DELETE FROM dtm_variants WHERE id = $1', [id]);
  return cnt > 0;
}

async function getNextDtmOrderNum() {
  const row = await one(
    'SELECT COALESCE(MAX(order_num), 0) + 1 AS next FROM dtm_variants'
  );
  return Number(row?.next ?? 1);
}

// ===== RESULTS =====

async function saveResult({
  userId,
  type,
  referenceId,
  userAnswers,
  correctCount,
  wrongCount,
  totalCount,
}) {
  const row = await one(
    `INSERT INTO results
       (user_id, type, reference_id, user_answers, correct_count, wrong_count, total_count)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id`,
    [
      userId,
      type,
      referenceId,
      userAnswers,
      correctCount,
      wrongCount,
      totalCount,
    ]
  );
  return row?.id;
}

async function getUserResults(userId, limit = 50) {
  return many(
    'SELECT * FROM results WHERE user_id = $1 ORDER BY submitted_at DESC LIMIT $2',
    [userId, limit]
  );
}

// Foydalanuvchining natijalari — task/dtm nomlari va dars nomi bilan
async function getUserDetailedResults(userId, limit, offset) {
  return many(
    `SELECT
       r.id, r.type, r.reference_id, r.correct_count, r.wrong_count, r.total_count,
       r.submitted_at, r.user_answers,
       CASE WHEN r.type = 'task' THEN t.title
            WHEN r.type = 'dtm'  THEN d.title END AS item_title,
       l.title AS lesson_title
     FROM results r
     LEFT JOIN tasks t        ON r.type = 'task' AND r.reference_id = t.id
     LEFT JOIN lessons l      ON t.lesson_id = l.id
     LEFT JOIN dtm_variants d ON r.type = 'dtm'  AND r.reference_id = d.id
     WHERE r.user_id = $1
     ORDER BY r.submitted_at DESC
     LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  );
}

async function getUserResultsCount(userId) {
  const row = await one(
    'SELECT COUNT(*)::int AS cnt FROM results WHERE user_id = $1',
    [userId]
  );
  return row?.cnt ?? 0;
}

// Bitta natijani to'liq ma'lumoti bilan olish (admin batafsil ko'rishi uchun)
async function getResultByIdWithDetails(resultId) {
  return one(
    `SELECT
       r.id, r.user_id, r.type, r.reference_id, r.user_answers,
       r.correct_count, r.wrong_count, r.total_count, r.submitted_at,
       u.first_name, u.last_name, u.phone, u.telegram_id,
       CASE WHEN r.type = 'task' THEN t.title
            WHEN r.type = 'dtm'  THEN d.title END AS item_title,
       CASE WHEN r.type = 'task' THEN t.correct_answers
            WHEN r.type = 'dtm'  THEN d.correct_answers END AS correct_answers,
       l.title AS lesson_title
     FROM results r
     JOIN users u             ON u.id = r.user_id
     LEFT JOIN tasks t        ON r.type = 'task' AND r.reference_id = t.id
     LEFT JOIN lessons l      ON t.lesson_id = l.id
     LEFT JOIN dtm_variants d ON r.type = 'dtm'  AND r.reference_id = d.id
     WHERE r.id = $1`,
    [resultId]
  );
}

async function getUserDetailedStats(userId) {
  const row = await one(
    `SELECT
       COUNT(*)::int AS total,
       COUNT(*) FILTER (WHERE type = 'task')::int AS tasks_count,
       COUNT(*) FILTER (WHERE type = 'dtm')::int  AS dtm_count,
       ROUND(AVG(correct_count::numeric * 100.0 / NULLIF(total_count, 0)), 1) AS avg_pct,
       ROUND(MAX(correct_count::numeric * 100.0 / NULLIF(total_count, 0)), 1) AS best_pct
     FROM results
     WHERE user_id = $1`,
    [userId]
  );
  return {
    total: row?.total ?? 0,
    tasksCount: row?.tasks_count ?? 0,
    dtmCount: row?.dtm_count ?? 0,
    avgPercent: row?.avg_pct != null ? Number(row.avg_pct) : 0,
    bestPercent: row?.best_pct != null ? Number(row.best_pct) : 0,
  };
}

async function getStats() {
  const totalUsers = await getUsersCount();
  const todayUsers = await getTodayUsersCount();

  const avgRow = await one(
    `SELECT ROUND(AVG(correct_count::numeric * 100.0 / NULLIF(total_count, 0)), 1) AS avg_pct
     FROM results
     WHERE total_count > 0`
  );

  const mostActiveUsers = await many(
    `SELECT u.first_name, u.last_name, u.telegram_id, COUNT(r.id)::int AS attempts
     FROM users u
     LEFT JOIN results r ON r.user_id = u.id
     GROUP BY u.id
     ORDER BY attempts DESC
     LIMIT 5`
  );

  const mostSolvedTasks = await many(
    `SELECT t.title, l.title AS lesson_title, COUNT(r.id)::int AS solves
     FROM results r
     JOIN tasks t ON t.id = r.reference_id AND r.type = 'task'
     JOIN lessons l ON l.id = t.lesson_id
     GROUP BY t.id, l.title
     ORDER BY solves DESC
     LIMIT 5`
  );

  return {
    totalUsers,
    todayUsers,
    avgScorePercent: avgRow?.avg_pct != null ? Number(avgRow.avg_pct) : 0,
    mostActiveUsers,
    mostSolvedTasks,
  };
}

module.exports = {
  // users
  getUserByTelegramId,
  createUser,
  getAllUsers,
  getUsersPaginated,
  getUserById,
  getUsersCount,
  getTodayUsersCount,
  // lessons
  getActiveLessons,
  getAllLessons,
  getLessonById,
  createLesson,
  updateLesson,
  deleteLesson,
  getNextLessonOrderNum,
  // tasks
  getActiveTasksByLesson,
  getAllTasksByLesson,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  getNextTaskOrderNum,
  // dtm
  getActiveDtmVariants,
  getAllDtmVariants,
  getDtmById,
  createDtm,
  updateDtm,
  deleteDtm,
  getNextDtmOrderNum,
  // results
  saveResult,
  getUserResults,
  getUserDetailedResults,
  getUserResultsCount,
  getUserDetailedStats,
  getResultByIdWithDetails,
  getStats,
};
