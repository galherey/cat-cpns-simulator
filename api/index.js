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

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store'
  });
  res.end(JSON.stringify(data));
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    // Vercel serverless function mungkin sudah melakukan parse req.body
    if (req.body && typeof req.body === 'object') {
      return resolve(req.body);
    }
    if (req.body && typeof req.body === 'string') {
      try {
        return resolve(JSON.parse(req.body));
      } catch (e) {
        return resolve({});
      }
    }

    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 2 * 1024 * 1024) reject(new Error('Payload too large'));
    });
    req.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        resolve({});
      }
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
      return sendJson(res, 200, {
        success: true,
        modes: Object.values(MODES)
      });
    }

    // 2. POST /api/exam/start
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

    // 3. GET /api/exam/:id
    const examGetMatch = pathname.match(/^(?:\/api)?\/exam\/([a-zA-Z0-9_-]+)$/);
    if (examGetMatch && method === 'GET') {
      const sessionId = examGetMatch[1];
      const clientSession = getClientSession(sessionId);
      if (!clientSession) {
        return sendJson(res, 404, { success: false, error: 'Sesi ujian tidak ditemukan' });
      }
      return sendJson(res, 200, { success: true, session: clientSession });
    }

    // 4. POST /api/exam/:id/answer
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

    // 5. POST /api/exam/:id/submit
    const examSubmitMatch = pathname.match(/^(?:\/api)?\/exam\/([a-zA-Z0-9_-]+)\/submit$/);
    if (examSubmitMatch && method === 'POST') {
      const sessionId = examSubmitMatch[1];
      const result = submitExam(sessionId);
      if (!result) {
        return sendJson(res, 404, { success: false, error: 'Sesi tidak ditemukan' });
      }
      return sendJson(res, 200, { success: true, result });
    }

    // 6. GET /api/exam/:id/result
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
