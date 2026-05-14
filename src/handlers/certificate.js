'use strict';

const { certificateKeyboard } = require('../keyboards');

async function showCertificate(ctx) {
  await ctx.reply(
    '🎓 Hali sertifikat yo\'q.',
    certificateKeyboard()
  );
}

module.exports = { showCertificate };
