'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const { MODES } = require('./lib/modes');
const {
  createExamSession,
  getClientSession,
  saveAnswer,
  submitExam,
  getExamResult
} = require('./lib/exam');

const DEFAULT_PORT = parseInt(process.env.PORT, 10) || 3050; // Menggunakan 3050 sebagai default agar tidak bentrok dengan port 3000
const PUBLIC_DIR = path.join(__dirname, 'public');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store'
  });
  res.end(JSON.stringify(data));
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 2 * 1024 * 1024) {
        // limit 2MB
        reject(new Error('Payload too large'));
      }
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

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const method = req.method.toUpperCase();

  // CORS headers jika diperlukan
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // API Routes
  if (pathname.startsWith('/api/')) {
    try {
      // 1. GET /api/modes
      if (pathname === '/api/modes' && method === 'GET') {
        return sendJson(res, 200, {
          success: true,
          modes: Object.values(MODES)
        });
      }

      // 2. POST /api/exam/start
      if (pathname === '/api/exam/start' && method === 'POST') {
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
      const examGetMatch = pathname.match(/^\/api\/exam\/([a-zA-Z0-9_-]+)$/);
      if (examGetMatch && method === 'GET') {
        const sessionId = examGetMatch[1];
        const clientSession = getClientSession(sessionId);
        if (!clientSession) {
          return sendJson(res, 404, { success: false, error: 'Sesi ujian tidak ditemukan' });
        }
        return sendJson(res, 200, { success: true, session: clientSession });
      }

      // 4. POST /api/exam/:id/answer
      const examAnsMatch = pathname.match(/^\/api\/exam\/([a-zA-Z0-9_-]+)\/answer$/);
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
      const examSubmitMatch = pathname.match(/^\/api\/exam\/([a-zA-Z0-9_-]+)\/submit$/);
      if (examSubmitMatch && method === 'POST') {
        const sessionId = examSubmitMatch[1];
        const result = submitExam(sessionId);
        if (!result) {
          return sendJson(res, 404, { success: false, error: 'Sesi tidak ditemukan' });
        }
        return sendJson(res, 200, { success: true, result });
      }

      // 6. GET /api/exam/:id/result
      const examResultMatch = pathname.match(/^\/api\/exam\/([a-zA-Z0-9_-]+)\/result$/);
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
  }

  // Static File Serving
  let safePath = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, '');
  if (safePath === '/' || safePath === '\\') {
    safePath = '/index.html';
  }

  const filePath = path.join(PUBLIC_DIR, safePath);

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // Fallback ke index.html untuk Single Page Application jika bukan file aset
      const indexPath = path.join(PUBLIC_DIR, 'index.html');
      fs.readFile(indexPath, (readErr, content) => {
        if (readErr) {
          res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
          res.end('404 Not Found');
          return;
        }
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(content);
      });
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, { 'Content-Type': contentType });
    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });
});

function startServer(port) {
  server.listen(port, () => {
    console.log(`\n==================================================`);
    console.log(`[CAT CPNS Simulator] Berhasil berjalan!`);
    console.log(`👉 Akses di browser: http://localhost:${port}`);
    console.log(`==================================================\n`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`[Info] Port ${port} sedang digunakan. Mencoba port ${port + 1}...`);
      startServer(port + 1);
    } else {
      console.error('[Error] Server error:', err);
    }
  });
}

if (require.main === module) {
  startServer(DEFAULT_PORT);
}

module.exports = { server, startServer };
