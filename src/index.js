'use strict';

require('dotenv').config();

const { createBot } = require('./bot');
const migrate = require('./database/migrations');
const pool = require('./database/db');
const logger = require('./utils/logger');

async function main() {
  const token = process.env.BOT_TOKEN;
  if (!token) {
    logger.error('❌ BOT_TOKEN .env faylida ko\'rsatilmagan!');
    process.exit(1);
  }

  // Pool healthcheck
  try {
    await pool.query('SELECT 1');
    logger.info('✅ PostgreSQL ulanish tekshirildi.');
  } catch (err) {
    logger.error('❌ PostgreSQL ulanib bo\'lmadi:', err.message);
    process.exit(1);
  }

  // Migration (jadval/indekslar mavjud bo'lmasa yaratiladi)
  try {
    await migrate();
  } catch (err) {
    logger.error('Migration xatosi:', err);
    process.exit(1);
  }

  const bot = createBot(token);

  try {
    await bot.launch({
      dropPendingUpdates: true,
    });
    logger.info('🚀 Bot ishga tushdi.');
  } catch (err) {
    logger.error('Bot launch xatosi:', err);
    await pool.end().catch(() => {});
    process.exit(1);
  }

  // Graceful stop
  const shutdown = async (signal) => {
    logger.info(`${signal} — bot to'xtatilmoqda...`);
    bot.stop(signal);
    try {
      await pool.end();
      logger.info('PG pool yopildi.');
    } catch (err) {
      logger.error('Pool yopishda xato:', err);
    }
    process.exit(0);
  };

  process.once('SIGINT', () => shutdown('SIGINT'));
  process.once('SIGTERM', () => shutdown('SIGTERM'));
}

main().catch((err) => {
  logger.error('Fatal error:', err);
  process.exit(1);
});
