'use strict';

// CSV cell ichidagi maxsus belgilarni escape qiladi (RFC 4180)
function escapeCell(value) {
  if (value === null || value === undefined) return '';
  const str = String(value);
  // Agar ichida ", , yoki \n bo'lsa — tirnoq ichiga olamiz, ichkaridagi tirnoqlar ikki barobar bo'ladi
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Massivni CSV string'ga aylantiradi.
 * @param {string[]} headers — sarlavhalar
 * @param {Array<Array>} rows — har bir element bitta qator
 * @returns {Buffer} — UTF-8 BOM bilan (Excel chiroyli ochishi uchun)
 */
function toCsvBuffer(headers, rows) {
  const lines = [];
  lines.push(headers.map(escapeCell).join(','));
  for (const row of rows) {
    lines.push(row.map(escapeCell).join(','));
  }
  // UTF-8 BOM — Excel cyrillic/lotin O'zbek harflarini to'g'ri o'qishi uchun
  const BOM = Buffer.from([0xef, 0xbb, 0xbf]);
  const body = Buffer.from(lines.join('\r\n'), 'utf8');
  return Buffer.concat([BOM, body]);
}

module.exports = { toCsvBuffer };
