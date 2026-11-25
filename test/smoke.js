'use strict';

const assert = require('assert');
const http = require('http');
const { assembleQuestions } = require('../lib/bank');
const {
  createExamSession,
  getClientSession,
  saveAnswer,
  submitExam,
  getExamResult
} = require('../lib/exam');
const { server } = require('../server');

console.log('--- [SMOKE TEST] Memulai Pengujian Web CAT CPNS ---');

// 1. Uji Perakitan 100 Soal
console.log('1. Menguji Assembler 100 Soal (TWK 27, TIU 32, TKP 41)...');
const assembled = assembleQuestions('sim100', 'test_seed_123');
assert.strictEqual(assembled.questions.length, 100, 'Jumlah total soal harus tepat 100');

const twkCount = assembled.questions.filter(q => q.subtest === 'TWK').length;
const tiuCount = assembled.questions.filter(q => q.subtest === 'TIU').length;
const tkpCount = assembled.questions.filter(q => q.subtest === 'TKP').length;

assert.strictEqual(twkCount, 27, 'TWK harus tepat 27 soal');
assert.strictEqual(tiuCount, 32, 'TIU harus tepat 32 soal');
assert.strictEqual(tkpCount, 41, 'TKP harus tepat 41 soal');
console.log('   ✓ Komposisi soal 100 terpenuhi: TWK 27 · TIU 32 · TKP 41');

// 2. Uji Kelengkapan Pembahasan & Opsi
console.log('2. Memeriksa keberadaan opsi dan pembahasan...');
assembled.questions.forEach((q, idx) => {
  assert.strictEqual(q.options.length, 5, `Soal no ${idx+1} harus memiliki 5 opsi`);
  assert(q.explanation && q.explanation.length > 5, `Soal no ${idx+1} harus memiliki penjelasan langkah/pembahasan`);
});
console.log('   ✓ Seluruh 100 soal memiliki 5 pilihan jawaban (A-E) dan pembahasan lengkap');

// 3. Uji Session & Selesai Ujian (Grading)
console.log('3. Menguji Sesi Ujian, Penyimpanan Jawaban, dan Skoring Otoritatif...');
const session = createExamSession({ userName: 'Budi Santoso', modeId: 'sim100' });
assert.strictEqual(session.totalQuestions, 100);

// Client session tidak boleh membocorkan kunci jawaban / correct flag / explanation
const clientSession = getClientSession(session.id);
assert.strictEqual(clientSession.questions.length, 100);
clientSession.questions.forEach(q => {
  assert.strictEqual(q.explanation, undefined, 'Penjelasan tidak boleh bocor ke client saat ujian berlangsung');
  q.options.forEach(o => {
    assert.strictEqual(o.correct, undefined, 'Flag kunci jawaban tidak boleh bocor');
    assert.strictEqual(o.weight, undefined, 'Bobot TKP tidak boleh bocor saat ujian');
  });
});
console.log('   ✓ Keamanan CAT terjaga: Kunci jawaban dan penjelasan tidak dikirim ke klien saat ujian');

// Simpan jawaban untuk beberapa nomor
saveAnswer(session.id, 1, 'A', false);
saveAnswer(session.id, 2, 'B', true); // ragu-ragu
const updatedSession = getClientSession(session.id);
assert.strictEqual(updatedSession.answers[1].selectedLabel, 'A');
assert.strictEqual(updatedSession.answers[2].isDoubt, true);
console.log('   ✓ Penyimpanan jawaban dan status ragu-ragu berhasil');

// Submit dan periksa hasil serta pembahasan
const result = submitExam(session.id);
assert(result.scores.raw.total >= 0);
assert(result.scores.normalized.total >= 0);
assert.strictEqual(result.reviewItems.length, 100);
assert(result.reviewItems[0].explanation, 'Setelah submit, penjelasan harus tersedia');
console.log('   ✓ Skoring otomatis SKD selesai, skor normalisasi dihitung, dan pembahasan dibuka');

// 4. Uji Server HTTP
console.log('4. Menguji Server HTTP...');
const TEST_PORT = 3199;
server.listen(TEST_PORT, () => {
  http.get(`http://localhost:${TEST_PORT}/api/modes`, (res) => {
    assert.strictEqual(res.statusCode, 200);
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      const json = JSON.parse(data);
      assert(json.success);
      assert(json.modes.length >= 4);
      console.log('   ✓ Endpoint /api/modes merespons 200 OK dengan daftar mode ujian');
      server.close(() => {
        console.log('\n--- SEMUA PENGUJIAN BERHASIL (PASSED) ---');
        process.exit(0);
      });
    });
  });
});
