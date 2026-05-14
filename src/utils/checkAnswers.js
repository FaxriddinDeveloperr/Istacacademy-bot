'use strict';

/**
 * Foydalanuvchi javoblarini to'g'ri javoblar bilan solishtiradi.
 * userAnswers va correctAnswers — bir xil uzunlikdagi string'lar (masalan "abcda").
 *
 * Qaytaradi:
 *  - correctCount, wrongCount, totalCount
 *  - percent (foiz, 0..100, butun son)
 *  - details: har bir savol uchun { idx, user, correct, isCorrect }
 */
function checkAnswers(userAnswers, correctAnswers) {
  const total = correctAnswers.length;
  const details = [];
  let correctCount = 0;

  for (let i = 0; i < total; i++) {
    const u = userAnswers[i];
    const c = correctAnswers[i];
    const isCorrect = u === c;
    if (isCorrect) correctCount += 1;
    details.push({
      idx: i + 1,
      user: u,
      correct: c,
      isCorrect,
    });
  }

  const wrongCount = total - correctCount;
  const percent =
    total === 0 ? 0 : Math.round((correctCount / total) * 100);

  return { correctCount, wrongCount, totalCount: total, percent, details };
}

/**
 * Natijani chiroyli matn ko'rinishida formatlaydi.
 */
function formatResultMessage({ correctCount, wrongCount, totalCount, percent, details }) {
  const lines = [];
  lines.push('✅ <b>Natija:</b>');
  lines.push('');
  lines.push(`To'g'ri: <b>${correctCount}</b> / ${totalCount}`);
  lines.push(`Noto'g'ri: <b>${wrongCount}</b>`);
  lines.push('');
  lines.push('<b>Tahlil:</b>');
  for (const d of details) {
    if (d.isCorrect) {
      lines.push(`${d.idx}-savol: ✅ ${d.correct} (siz: ${d.user})`);
    } else {
      lines.push(
        `${d.idx}-savol: ❌ ${d.correct} (siz: ${d.user}) — to'g'ri javob: <b>${d.correct}</b>`
      );
    }
  }
  lines.push('');
  lines.push(`Ball: <b>${percent}%</b>`);
  return lines.join('\n');
}

module.exports = { checkAnswers, formatResultMessage };
