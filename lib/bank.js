'use strict';

const twkRaw = require('../data/twk');
const tkpRaw = require('../data/tkp');
const { TIU_CATEGORIES, generate: generateTiu } = require('./generators');
const { makeRng } = require('./rng');
const { MODES, SKD } = require('./modes');

// Normalisasi soal statis TWK & TKP
const staticTwk = twkRaw.map((item, idx) => {
  const [category, difficulty, body, options, explanation] = item;
  return {
    id: `twk:${idx + 1}`,
    subtest: 'TWK',
    category,
    difficulty,
    body,
    // options[0] adalah jawaban benar sebelum diacak
    options: options.map((opt, i) => ({
      text: opt,
      correct: i === 0,
      weight: i === 0 ? 5 : 0
    })),
    explanation,
    lockOrder: false,
    generated: false
  };
});

const staticTkp = tkpRaw.map((item, idx) => {
  const [category, difficulty, body, options, explanation] = item;
  return {
    id: `tkp:${idx + 1}`,
    subtest: 'TKP',
    category,
    difficulty,
    body,
    // options[0..4] berbobot 5, 4, 3, 2, 1
    options: options.map((opt, i) => ({
      text: opt,
      correct: i === 0, // opsi berbobot 5
      weight: 5 - i
    })),
    explanation,
    lockOrder: false,
    generated: false
  };
});

/**
 * Question Assembler
 * Mengumpulkan bank soal, memilih jumlah soal sesuai konfigurasi mode (contoh mode 100 soal: TWK 27, TIU 32, TKP 41),
 * melakukan stratifikasi kesulitan, dan melakukan seeded shuffle untuk soal dan opsi.
 */
function assembleQuestions(modeId, seedString) {
  const mode = MODES[modeId] || MODES.sim100;
  const rng = makeRng(seedString || Date.now().toString());
  const { composition } = mode;

  // 1. Ambil TWK
  const twkSelected = selectQuestionsFromPool(staticTwk, composition.TWK, rng);

  // 2. Buat TIU secara dinamis dari generator parametrik
  const tiuSelected = generateTiuQuestions(composition.TIU, rng);

  // 3. Ambil TKP
  const tkpSelected = selectQuestionsFromPool(staticTkp, composition.TKP, rng);

  // Gabungkan semua soal
  const combined = [...twkSelected, ...tiuSelected, ...tkpSelected];

  // Acak urutan soal (atau jika ingin standar berurutan TWK -> TIU -> TKP, atau acak merata)
  // Standar BKN: nomor tersusun rapi per subtes atau terdistribusi. Kita sajikan per subtes berurutan agar peserta nyaman fokus
  // Nomor 1..TWK, lalu TIU, lalu TKP
  let position = 1;
  const preparedQuestions = combined.map(q => {
    // Acak urutan opsi jawaban jika tidak dikunci
    let opts = q.options.map((o, idx) => ({ ...o, originalIndex: idx }));
    if (!q.lockOrder) {
      opts = rng.shuffle(opts);
    }

    const labels = ['A', 'B', 'C', 'D', 'E'];
    const finalOptions = opts.map((o, idx) => ({
      label: labels[idx],
      text: o.text,
      correct: o.correct,
      weight: o.weight
    }));

    const sessionQ = {
      position: position++,
      id: q.id,
      subtest: q.subtest,
      category: q.category,
      difficulty: q.difficulty,
      body: q.body,
      options: finalOptions,
      explanation: q.explanation,
      lockOrder: q.lockOrder
    };

    return sessionQ;
  });

  return {
    mode,
    questions: preparedQuestions
  };
}

function selectQuestionsFromPool(pool, count, rng) {
  if (count <= 0) return [];
  if (pool.length <= count) {
    // Jika pool kurang, shuffle dan duplicate sedikit jika dibutuhkan (fallback)
    const shuffled = rng.shuffle(pool);
    const result = [...shuffled];
    while (result.length < count) {
      result.push({ ...rng.pick(pool), id: `${rng.pick(pool).id}_copy_${result.length}` });
    }
    return result.slice(0, count);
  }

  // Pengelompokan berdasarkan kesulitan
  const mudah = pool.filter(q => q.difficulty === 'mudah');
  const sedang = pool.filter(q => q.difficulty === 'sedang');
  const sulit = pool.filter(q => q.difficulty === 'sulit');

  const targetMudah = Math.round(count * 0.3);
  const targetSulit = Math.round(count * 0.2);
  const targetSedang = count - targetMudah - targetSulit;

  const pickN = (arr, n) => rng.shuffle(arr).slice(0, n);

  let selected = [
    ...pickN(mudah, targetMudah),
    ...pickN(sedang, targetSedang),
    ...pickN(sulit, targetSulit)
  ];

  if (selected.length < count) {
    const remainingNeeded = count - selected.length;
    const remainingPool = pool.filter(q => !selected.includes(q));
    selected.push(...pickN(remainingPool, remainingNeeded));
  }

  return rng.shuffle(selected.slice(0, count));
}

function generateTiuQuestions(count, rng) {
  if (count <= 0) return [];
  const results = [];
  const difficulties = ['mudah', 'sedang', 'sulit'];

  for (let i = 0; i < count; i++) {
    // Pilih kategori bergiliran atau berbobot
    const cat = TIU_CATEGORIES[i % TIU_CATEGORIES.length];
    // Proporsi kesulitan: 30% mudah, 50% sedang, 20% sulit
    let diff = 'sedang';
    const roll = rng();
    if (roll < 0.3) diff = 'mudah';
    else if (roll > 0.8) diff = 'sulit';

    const itemSeed = rng.int(100000, 9999999);
    const q = generateTiu(cat.name, diff, itemSeed);
    results.push(q);
  }

  return rng.shuffle(results);
}

module.exports = {
  staticTwk,
  staticTkp,
  assembleQuestions
};
