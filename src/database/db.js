'use strict';

const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  // index.js dan oldin ham talab qilinishi mumkin (masalan, migration scriptida)
  // shu yerda darhol xato beramiz
  throw new Error('❌ DATABASE_URL .env faylida ko\'rsatilmagan!');
}

// SSL sozlamasi:
//   - DATABASE_URL'da ?sslmode=require bo'lsa pg avtomatik tushunadi
//   - aks holda PGSSL=true bo'lsa, rejectUnauthorized:false bilan ulanamiz
//     (ko'p cloud providerlar self-signed sertifikat beradi)
const useExplicitSsl =
  String(process.env.PGSSL || '').toLowerCase() === 'true';

const pool = new Pool({
  connectionString,
  ssl: useExplicitSsl ? { rejectUnauthorized: false } : undefined,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on('error', (err) => {
  // Idle client'da kutilmagan xato — log qilamiz, lekin jarayonni o'ldirmaymiz
  console.error('[PG POOL ERROR]', err);
});

module.exports = pool;
