'use strict';

const { LIMITS, VALID_ANSWER_LETTERS } = require('../constants');

// Ism va familiya: faqat harflar (lotin + kirill + o'zbek harflari), 2-50
// O'zbek lotin harflari: o', g' (apostrof) ham qabul qilamiz
function isValidName(name) {
  if (typeof name !== 'string') return false;
  const trimmed = name.trim();
  if (trimmed.length < LIMITS.NAME_MIN || trimmed.length > LIMITS.NAME_MAX) {
    return false;
  }
  // Harflar, bo'sh joy, apostrof (o'zbek o' va g' uchun), defis
  return /^[A-Za-zА-Яа-яЎўҚқҒғҲҳЁё'ʻ\s-]+$/u.test(trimmed);
}

// Telefon raqami: +998XXXXXXXXX yoki 998XXXXXXXXX yoki contact orqali keladi
function isValidPhone(phone) {
  if (typeof phone !== 'string') return false;
  const clean = phone.replace(/\s+/g, '').replace(/-/g, '');
  // +998 bilan boshlanadi yoki shunchaki 998 bilan
  return /^\+?998\d{9}$/.test(clean);
}

function normalizePhone(phone) {
  const clean = String(phone).replace(/\s+/g, '').replace(/-/g, '');
  if (clean.startsWith('+')) return clean;
  if (clean.startsWith('998')) return '+' + clean;
  return clean;
}

// Javoblar formatini tekshirish.
// Foydalanuvchi kiritishi mumkin: "abcda" yoki "1a2b3c4d5a" yoki "a b c d a"
// Bu funksiya inputni standart "abcda" formatga keltiradi.
// Agar format buzilgan yoki harf noto'g'ri bo'lsa — null qaytaradi.
function parseAnswers(raw, expectedCount) {
  if (typeof raw !== 'string') return null;

  // Faqat harflar va raqamlarni qoldiramiz (bo'sh joy, vergul va h.k. olib tashlaymiz)
  let cleaned = raw.toLowerCase().replace(/\s+/g, '').replace(/,/g, '');

  // Agar "1a2b3c..." formatda bo'lsa — raqamlarni olib tashlaymiz
  // (raqamlar faqat tartibni bildiradi)
  // Eslatma: bu yondashuv juda oddiy — har bir harf javob deb qabul qilinadi
  const letters = cleaned.replace(/\d+/g, '');

  // Faqat lotin kichik harflari bo'lishi shart (a..z)
  if (!/^[a-z]+$/.test(letters)) return null;
  if (letters.length !== expectedCount) return null;
  return letters;
}

// Admin uchun: to'g'ri javoblarni kiritishda validatsiya
function isValidCorrectAnswers(raw, expectedCount) {
  return parseAnswers(raw, expectedCount) !== null;
}

// Savol soni 1..MAX_QUESTIONS oralig'ida
function isValidQuestionCount(value) {
  const n = Number(value);
  return Number.isInteger(n) && n >= 1 && n <= LIMITS.MAX_QUESTIONS;
}

// Tartib raqami: musbat butun son
function isValidOrderNum(value) {
  const n = Number(value);
  return Number.isInteger(n) && n >= 1 && n <= 10000;
}

module.exports = {
  isValidName,
  isValidPhone,
  normalizePhone,
  parseAnswers,
  isValidCorrectAnswers,
  isValidQuestionCount,
  isValidOrderNum,
};
