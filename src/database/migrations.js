'use strict';

require('dotenv').config();
const pool = require('./db');

// PostgreSQL DDL — barcha jadval va indekslar
async function migrate() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id BIGSERIAL PRIMARY KEY,
        telegram_id BIGINT UNIQUE NOT NULL,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        phone TEXT NOT NULL,
        username TEXT,
        registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    await client.query(
      `CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON users(telegram_id);`
    );

    await client.query(`
      CREATE TABLE IF NOT EXISTS lessons (
        id BIGSERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        order_num INTEGER NOT NULL,
        is_active SMALLINT NOT NULL DEFAULT 1,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    await client.query(
      `CREATE INDEX IF NOT EXISTS idx_lessons_order ON lessons(order_num);`
    );

    await client.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id BIGSERIAL PRIMARY KEY,
        lesson_id BIGINT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        order_num INTEGER NOT NULL,
        pdf_file_id TEXT NOT NULL,
        pdf_path TEXT,
        question_count INTEGER NOT NULL,
        correct_answers TEXT NOT NULL,
        is_active SMALLINT NOT NULL DEFAULT 1,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    await client.query(
      `CREATE INDEX IF NOT EXISTS idx_tasks_lesson_id ON tasks(lesson_id);`
    );
    await client.query(
      `CREATE INDEX IF NOT EXISTS idx_tasks_order ON tasks(lesson_id, order_num);`
    );

    await client.query(`
      CREATE TABLE IF NOT EXISTS dtm_variants (
        id BIGSERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        order_num INTEGER NOT NULL,
        pdf_file_id TEXT NOT NULL,
        pdf_path TEXT,
        question_count INTEGER NOT NULL,
        correct_answers TEXT NOT NULL,
        is_active SMALLINT NOT NULL DEFAULT 1,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    await client.query(
      `CREATE INDEX IF NOT EXISTS idx_dtm_order ON dtm_variants(order_num);`
    );

    await client.query(`
      CREATE TABLE IF NOT EXISTS results (
        id BIGSERIAL PRIMARY KEY,
        user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type TEXT NOT NULL,
        reference_id BIGINT NOT NULL,
        user_answers TEXT NOT NULL,
        correct_count INTEGER NOT NULL,
        wrong_count INTEGER NOT NULL,
        total_count INTEGER NOT NULL,
        submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    await client.query(
      `CREATE INDEX IF NOT EXISTS idx_results_user_id ON results(user_id);`
    );
    await client.query(
      `CREATE INDEX IF NOT EXISTS idx_results_type_ref ON results(type, reference_id);`
    );

    await client.query('COMMIT');
    console.log('✅ Migration muvaffaqiyatli yakunlandi. Jadvallar tayyor.');
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

// Faqat to'g'ridan-to'g'ri ishga tushirilganda bajariladi
if (require.main === module) {
  migrate()
    .then(() => pool.end())
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Migration xatosi:', err);
      pool.end().finally(() => process.exit(1));
    });
}

module.exports = migrate;
