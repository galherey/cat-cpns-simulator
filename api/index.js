'use strict';

const fs = require('fs');
const path = require('path');
const url = require('url');

const { MODES } = require('../lib/modes');
const {
  createExamSession,
  getClientSession,
  saveAnswer,
  submitExam,
  getExamResult
} = require('../lib/exam');

// Leaderboard in-memory (diisi data awal realistis + hasil peserta aktif)
const leaderboardRecords = [
  { rank: 1, name: 'Nurul Hidayati', mode: 'sim100', twk: 120, tiu: 160, tkp: 198, total: 478, passed: true, timestamp: '10 Menit lalu' },
  { rank: 2, name: 'Fajar Ramadhan', mode: 'sim100', twk: 115, tiu: 155, tkp: 192, total: 462, passed: true, timestamp: '25 Menit lalu' },
  { rank: 3, name: 'Siti Rahmawati', mode: 'sim100', twk: 105, tiu: 150, tkp: 188, total: 443, passed: true, timestamp: '1 Jam lalu' },
  { rank: 4, name: 'Rian Pratama', mode: 'sim100', twk: 95, tiu: 140, tkp: 190, total: 425, passed: true, timestamp: '2 Jam lalu' },
  { rank: 5, name: 'Bambang Tri', mode: 'sim100', twk: 110, tiu: 75, tkp: 205, total: 390, passed: false, timestamp: '3 Jam lalu' }, // Gagal TIU < 80
  { rank: 6, name: 'Anisa Kusuma', mode: 'sim100', twk: 85, tiu: 120, tkp: 180, total: 385, passed: true, timestamp: '4 Jam lalu' },
  { rank: 7, name: 'Dedi Saputra', mode: 'sim100', twk: 60, tiu: 135, tkp: 175, total: 370, passed: false, timestamp: '5 Jam lalu' }, // Gagal TWK < 65
  { rank: 8, name: 'Maya Anggraini', mode: 'sim100', twk: 90, tiu: 110, tkp: 165, total: 365, passed: true, timestamp: '6 Jam lalu' }
];

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store'
  });
  res.end(JSON.stringify(data));
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    if (req.body && typeof req.body === 'object') return resolve(req.body);
    if (req.body && typeof req.body === 'string') {
      try { return resolve(JSON.parse(req.body)); } catch (e) { return resolve({}); }
    }
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 2 * 1024 * 1024) reject(new Error('Payload too large'));
    });
    req.on('end', () => {
      if (!body) return resolve({});
      try { resolve(JSON.parse(body)); } catch (err) { resolve({}); }
    });
    req.on('error', reject);
  });
}

module.exports = async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const method = req.method.toUpperCase();

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  try {
    // 1. GET /api/modes
    if ((pathname === '/api/modes' || pathname === '/modes') && method === 'GET') {
      return sendJson(res, 200, { success: true, modes: Object.values(MODES) });
    }

    // 2. GET /api/ranking (Leaderboard Live ala oneshotasn)
    if ((pathname === '/api/ranking' || pathname === '/ranking') && method === 'GET') {
      // Urutkan berdasarkan total tertinggi
      const sorted = leaderboardRecords.slice().sort((a, b) => b.total - a.total);
      sorted.forEach((item, idx) => { item.rank = idx + 1; });
      return sendJson(res, 200, {
        success: true,
        updatedAt: new Date().toLocaleTimeString('id-ID'),
        totalParticipants: sorted.length,
        ranking: sorted
      });
    }

    // 3. POST /api/exam/start
    if ((pathname === '/api/exam/start' || pathname === '/exam/start') && method === 'POST') {
      const body = await parseBody(req);
      const session = createExamSession({
        userName: body.userName,
        modeId: body.modeId,
        participantNo: body.participantNo
      });
      return sendJson(res, 201, {
        success: true,
        sessionId: session.id,
        modeId: session.modeId,
        modeName: session.modeName,
        totalQuestions: session.totalQuestions,
        durationMin: session.durationMin,
        deadlineAt: session.deadlineAt
      });
    }

    // 4. GET /api/exam/:id
    const examGetMatch = pathname.match(/^(?:\/api)?\/exam\/([a-zA-Z0-9_-]+)$/);
    if (examGetMatch && method === 'GET') {
      const sessionId = examGetMatch[1];
      const clientSession = getClientSession(sessionId);
      if (!clientSession) {
        return sendJson(res, 404, { success: false, error: 'Sesi ujian tidak ditemukan' });
      }
      return sendJson(res, 200, { success: true, session: clientSession });
    }

    // 5. POST /api/exam/:id/answer
    const examAnsMatch = pathname.match(/^(?:\/api)?\/exam\/([a-zA-Z0-9_-]+)\/answer$/);
    if (examAnsMatch && method === 'POST') {
      const sessionId = examAnsMatch[1];
      const body = await parseBody(req);
      const { position, selectedLabel, isDoubt } = body;
      const result = saveAnswer(sessionId, Number(position), selectedLabel, isDoubt);
      if (result.error) {
        return sendJson(res, 400, { success: false, error: result.error });
      }
      return sendJson(res, 200, { success: true, answer: result.answer });
    }

    // 6. POST /api/exam/:id/submit
    const examSubmitMatch = pathname.match(/^(?:\/api)?\/exam\/([a-zA-Z0-9_-]+)\/submit$/);
    if (examSubmitMatch && method === 'POST') {
      const sessionId = examSubmitMatch[1];
      const result = submitExam(sessionId);
      if (!result) {
        return sendJson(res, 404, { success: false, error: 'Sesi tidak ditemukan' });
      }

      // Masukkan otomatis ke live leaderboard
      const newEntry = {
        name: result.userName || 'Peserta',
        mode: result.modeId,
        twk: Math.round(result.scores.normalized.twk),
        tiu: Math.round(result.scores.normalized.tiu),
        tkp: Math.round(result.scores.normalized.tkp),
        total: Math.round(result.scores.normalized.total),
        passed: result.scores.passingStatus.allPassed,
        timestamp: 'Baru saja'
      };
      leaderboardRecords.unshift(newEntry);

      return sendJson(res, 200, { success: true, result });
    }

    // 7. GET /api/exam/:id/result
    const examResultMatch = pathname.match(/^(?:\/api)?\/exam\/([a-zA-Z0-9_-]+)\/result$/);
    if (examResultMatch && method === 'GET') {
      const sessionId = examResultMatch[1];
      const result = getExamResult(sessionId);
      if (!result) {
        return sendJson(res, 404, { success: false, error: 'Sesi atau hasil tidak ditemukan' });
      }
      return sendJson(res, 200, { success: true, result });
    }

    return sendJson(res, 404, { success: false, error: 'Endpoint API tidak ditemukan' });
  } catch (err) {
    console.error('API Error:', err);
    return sendJson(res, 500, { success: false, error: err.message });
  }
};
