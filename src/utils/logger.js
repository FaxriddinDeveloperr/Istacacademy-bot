'use strict';

// Oddiy logger — kerak bo'lsa keyinchalik fayl/yangi sistemaga ko'chiriladi
function info(...args) {
  console.log('[INFO]', new Date().toISOString(), ...args);
}

function warn(...args) {
  console.warn('[WARN]', new Date().toISOString(), ...args);
}

function error(...args) {
  console.error('[ERROR]', new Date().toISOString(), ...args);
}

module.exports = { info, warn, error };
