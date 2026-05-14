'use strict';

const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const https = require('https');

const UPLOADS_DIR = process.env.UPLOADS_DIR || './uploads';

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

/**
 * Telegramdan kelgan PDF faylni `uploads/` papkasiga zaxira sifatida saqlaydi.
 * Asosan biz file_id ishlatamiz, lekin zaxira nusxa ham foydali bo'lishi mumkin.
 *
 * @param {import('telegraf').Telegraf['telegram']} telegram - bot.telegram
 * @param {string} fileId
 * @returns {Promise<string>} - saqlangan fayl yo'li
 */
async function downloadPdfByFileId(telegram, fileId) {
  const fileLink = await telegram.getFileLink(fileId);
  const filename = `${uuidv4()}.pdf`;
  const fullPath = path.join(UPLOADS_DIR, filename);

  await new Promise((resolve, reject) => {
    https
      .get(fileLink.href, (res) => {
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode}`));
          return;
        }
        const stream = fs.createWriteStream(fullPath);
        res.pipe(stream);
        stream.on('finish', () => stream.close(resolve));
        stream.on('error', reject);
      })
      .on('error', reject);
  });

  return fullPath;
}

module.exports = { downloadPdfByFileId };
