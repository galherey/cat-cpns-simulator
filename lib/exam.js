'use strict';

const crypto = require('crypto');
const { assembleQuestions } = require('./bank');
const { SKD, MODES } = require('./modes');

// Penyimpanan sesi ujian in-memory
const activeSessions = new Map();

/**
 * Buat sesi ujian baru
 */
function createExamSession({ userName = 'Peserta Ujian', modeId = 'sim100', participantNo } = {}) {
  const sessionId = crypto.randomUUID();
  const seed = `${Date.now()}_${Math.random()}`;
  const { mode, questions } = assembleQuestions(modeId, seed);

  const now = Date.now();
  const durationMs = mode.durationMin * 60 * 1000;
  const deadlineAt = now + durationMs;

  const session = {
    id: sessionId,
    userName: userName.trim() || 'Peserta Ujian',
    participantNo: participantNo || `CPNS-2026-${Math.floor(100000 + Math.random() * 900000)}`,
    modeId: mode.id,
    modeName: mode.name,
    durationMin: mode.durationMin,
    totalQuestions: questions.length,
    startedAt: now,
    deadlineAt,
    submittedAt: null,
    status: 'IN_PROGRESS', // IN_PROGRESS, COMPLETED
    answers: {}, // map position (1..N) -> { selectedLabel: 'A'..'E', isDoubt: boolean, updatedAt }
    questions, // Master soal lengkap termasuk kunci & penjelasan
    result: null
  };

  activeSessions.set(sessionId, session);
  return session;
}

/**
 * Ambil sesi yang aman untuk tampilan klien saat ujian (kunci jawaban & penjelasan disembunyikan!)
 */
function getClientSession(sessionId) {
  const session = activeSessions.get(sessionId);
  if (!session) return null;

  // Cek apakah waktu sudah habis otomatis
  const now = Date.now();
  if (session.status === 'IN_PROGRESS' && now > session.deadlineAt + 5000) {
    submitExam(sessionId);
  }

  const sanitizedQuestions = session.questions.map(q => ({
    position: q.position,
    subtest: q.subtest,
    category: q.category,
    difficulty: q.difficulty,
    body: q.body,
    options: q.options.map(o => ({
      label: o.label,
      text: o.text
    }))
  }));

  return {
    id: session.id,
    userName: session.userName,
    participantNo: session.participantNo,
    modeId: session.modeId,
    modeName: session.modeName,
    durationMin: session.durationMin,
    totalQuestions: session.totalQuestions,
    startedAt: session.startedAt,
    deadlineAt: session.deadlineAt,
    remainingSeconds: Math.max(0, Math.floor((session.deadlineAt - now) / 1000)),
    status: session.status,
    answers: session.answers,
    questions: sanitizedQuestions
  };
}

/**
 * Simpan atau perbarui jawaban peserta untuk nomor tertentu
 */
function saveAnswer(sessionId, position, selectedLabel, isDoubt) {
  const session = activeSessions.get(sessionId);
  if (!session) return { error: 'Sesi tidak ditemukan' };
  if (session.status !== 'IN_PROGRESS') return { error: 'Sesi ujian telah selesai' };

  if (Date.now() > session.deadlineAt + 5000) {
    submitExam(sessionId);
    return { error: 'Waktu ujian telah berakhir' };
  }

  session.answers[position] = {
    selectedLabel: selectedLabel || null,
    isDoubt: Boolean(isDoubt),
    updatedAt: Date.now()
  };

  return { success: true, answer: session.answers[position] };
}

/**
 * Selesaikan ujian dan hitung nilai secara otoritatif di server
 */
function submitExam(sessionId) {
  const session = activeSessions.get(sessionId);
  if (!session) return null;
  if (session.status === 'COMPLETED' && session.result) {
    return session.result;
  }

  session.status = 'COMPLETED';
  session.submittedAt = Date.now();

  const answers = session.answers;
  const questions = session.questions;

  let rawTwk = 0;
  let rawTiu = 0;
  let rawTkp = 0;

  let answeredCount = 0;
  let doubtCount = 0;
  let twkCorrectCount = 0;
  let tiuCorrectCount = 0;

  // Analisis per butir untuk pembahasan
  const reviewItems = questions.map(q => {
    const userAns = answers[q.position] || null;
    const selectedLabel = userAns ? userAns.selectedLabel : null;
    const isDoubt = userAns ? userAns.isDoubt : false;

    if (selectedLabel) answeredCount++;
    if (isDoubt) doubtCount++;

    let scoreAwarded = 0;
    let bestOption = null;
    let selectedOption = null;

    if (q.subtest === 'TWK' || q.subtest === 'TIU') {
      const correctOpt = q.options.find(o => o.correct);
      bestOption = correctOpt ? correctOpt.label : null;

      if (selectedLabel) {
        selectedOption = q.options.find(o => o.label === selectedLabel);
        if (selectedOption && selectedOption.correct) {
          scoreAwarded = 5;
          if (q.subtest === 'TWK') twkCorrectCount++;
          if (q.subtest === 'TIU') tiuCorrectCount++;
        }
      }

      if (q.subtest === 'TWK') rawTwk += scoreAwarded;
      if (q.subtest === 'TIU') rawTiu += scoreAwarded;

    } else if (q.subtest === 'TKP') {
      // Cari opsi dengan bobot terbaik (5)
      const topOpt = q.options.slice().sort((a, b) => b.weight - a.weight)[0];
      bestOption = topOpt ? topOpt.label : null;

      if (selectedLabel) {
        selectedOption = q.options.find(o => o.label === selectedLabel);
        if (selectedOption && typeof selectedOption.weight === 'number') {
          scoreAwarded = selectedOption.weight;
        }
      }

      rawTkp += scoreAwarded;
    }

    return {
      position: q.position,
      subtest: q.subtest,
      category: q.category,
      difficulty: q.difficulty,
      body: q.body,
      options: q.options.map(o => ({
        label: o.label,
        text: o.text,
        correct: Boolean(o.correct),
        weight: o.weight
      })),
      userAnswer: selectedLabel,
      isDoubt,
      scoreAwarded,
      bestOption,
      explanation: q.explanation
    };
  });

  const rawTotal = rawTwk + rawTiu + rawTkp;

  // Hitung Skor Setara (Normalisasi ke standar SKD 110 Soal jika memakai mode 100 soal)
  const mode = MODES[session.modeId] || MODES.sim100;
  const comp = mode.composition;

  // Formula normalisasi: (skorMentah / (jumlahSoal * 5)) * (standarN * 5)
  const normalize = (raw, count, officialN) => {
    if (count <= 0 || officialN <= 0) return 0;
    const maxCurrent = count * 5;
    const maxOfficial = officialN * 5;
    return Math.round((raw / maxCurrent) * maxOfficial * 10) / 10;
  };

  const normTwk = comp.TWK === SKD.TWK.N ? rawTwk : normalize(rawTwk, comp.TWK, SKD.TWK.N);
  const normTiu = comp.TIU === SKD.TIU.N ? rawTiu : normalize(rawTiu, comp.TIU, SKD.TIU.N);
  const normTkp = comp.TKP === SKD.TKP.N ? rawTkp : normalize(rawTkp, comp.TKP, SKD.TKP.N);
  const normTotal = Math.round((normTwk + normTiu + normTkp) * 10) / 10;

  // Evaluasi Passing Grade SKD Resmi (berdasarkan skor ternormalisasi atau langsung)
  const passTwk = (mode.official ? rawTwk : normTwk) >= SKD.TWK.pg;
  const passTiu = (mode.official ? rawTiu : normTiu) >= SKD.TIU.pg;
  const passTkp = (mode.official ? rawTkp : normTkp) >= SKD.TKP.pg;
  const isAllPassed = passTwk && passTiu && passTkp;

  const result = {
    sessionId,
    userName: session.userName,
    participantNo: session.participantNo,
    modeId: session.modeId,
    modeName: session.modeName,
    submittedAt: session.submittedAt,
    timeSpentSeconds: Math.floor((session.submittedAt - session.startedAt) / 1000),
    stats: {
      totalQuestions: questions.length,
      answeredCount,
      unansweredCount: questions.length - answeredCount,
      doubtCount,
      twkCorrectCount,
      tiuCorrectCount
    },
    scores: {
      raw: {
        twk: rawTwk,
        tiu: rawTiu,
        tkp: rawTkp,
        total: rawTotal
      },
      normalized: {
        twk: normTwk,
        tiu: normTiu,
        tkp: normTkp,
        total: normTotal
      },
      passingGrades: {
        twk: SKD.TWK.pg,
        tiu: SKD.TIU.pg,
        tkp: SKD.TKP.pg
      },
      passingStatus: {
        twk: passTwk,
        tiu: passTiu,
        tkp: passTkp,
        allPassed: isAllPassed
      }
    },
    reviewItems
  };

  session.result = result;
  return result;
}

function getExamResult(sessionId) {
  const session = activeSessions.get(sessionId);
  if (!session) return null;
  if (session.status !== 'COMPLETED') {
    return submitExam(sessionId);
  }
  return session.result;
}

module.exports = {
  createExamSession,
  getClientSession,
  saveAnswer,
  submitExam,
  getExamResult
};
