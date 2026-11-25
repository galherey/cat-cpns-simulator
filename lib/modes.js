'use strict';
// Semua parameter ujian bersifat konfigurasi. Verifikasi ke regulasi BKN terbaru sebelum dipakai resmi.

// Ukuran & passing grade SKD resmi (acuan normalisasi skor).
const SKD = {
  TWK: { N: 30, pg: 65, label: 'Tes Wawasan Kebangsaan' },
  TIU: { N: 35, pg: 80, label: 'Tes Intelegensia Umum' },
  TKP: { N: 45, pg: 156, label: 'Tes Karakteristik Pribadi' },
};

const DIFFICULTY_MIX = { mudah: 0.3, sedang: 0.5, sulit: 0.2 };

const MODES = {
  sim100: {
    id: 'sim100',
    name: 'Simulasi 100 Soal',
    desc: '100 soal acak (TWK 27 · TIU 32 · TKP 41). Skor dinormalkan ke skala SKD.',
    composition: { TWK: 27, TIU: 32, TKP: 41 },
    durationMin: 90,
    official: false,
    featured: true,
  },
  skd110: {
    id: 'skd110',
    name: 'Simulasi SKD Resmi (110 Soal)',
    desc: 'Format paling mirip CAT BKN: TWK 30 · TIU 35 · TKP 45, 100 menit.',
    composition: { TWK: 30, TIU: 35, TKP: 45 },
    durationMin: 100,
    official: true,
  },
  mini20: {
    id: 'mini20',
    name: 'Mini Test 20 Soal',
    desc: 'Latihan singkat campuran (TWK 7 · TIU 7 · TKP 6), 20 menit.',
    composition: { TWK: 7, TIU: 7, TKP: 6 },
    durationMin: 20,
    official: false,
  },
  twk25: {
    id: 'twk25',
    name: 'Latihan TWK (25 Soal)',
    desc: 'Fokus Tes Wawasan Kebangsaan.',
    composition: { TWK: 25, TIU: 0, TKP: 0 },
    durationMin: 25,
    official: false,
  },
  tiu25: {
    id: 'tiu25',
    name: 'Latihan TIU (25 Soal)',
    desc: 'Fokus Tes Intelegensia Umum (verbal & numerik).',
    composition: { TWK: 0, TIU: 25, TKP: 0 },
    durationMin: 35,
    official: false,
  },
  tkp25: {
    id: 'tkp25',
    name: 'Latihan TKP (25 Soal)',
    desc: 'Fokus Tes Karakteristik Pribadi (skor 1–5 per opsi).',
    composition: { TWK: 0, TIU: 0, TKP: 25 },
    durationMin: 25,
    official: false,
  },
};

for (const m of Object.values(MODES)) {
  m.total = m.composition.TWK + m.composition.TIU + m.composition.TKP;
  m.difficultyMix = DIFFICULTY_MIX;
}

module.exports = { SKD, MODES, DIFFICULTY_MIX };
