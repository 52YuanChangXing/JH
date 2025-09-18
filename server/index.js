const http = require('http');
const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');

const PORT = process.env.PORT || 8080;
const ROOT_DIR = __dirname;
const DATA_DIR = path.join(ROOT_DIR, 'data');
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');
const BOOKINGS_FILE = path.join(DATA_DIR, 'bookings.json');
const STATIC_CONTENT_FILE = path.join(DATA_DIR, 'static-content.json');

function readJSONFile(filePath, defaultValue) {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, 'utf-8', (err, data) => {
      if (err) {
        if (err.code === 'ENOENT') {
          resolve(defaultValue);
          return;
        }
        reject(err);
        return;
      }
      try {
        const parsed = JSON.parse(data || 'null');
        resolve(parsed ?? defaultValue);
      } catch (parseError) {
        reject(parseError);
      }
    });
  });
}

function writeJSONFile(filePath, data) {
  return new Promise((resolve, reject) => {
    fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8', err => {
      if (err) {
        reject(err);
        return;
      }
      resolve();
    });
  });
}

function sendJSON(res, statusCode, payload) {
  const responseBody = JSON.stringify(payload);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PATCH,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(responseBody);
}

function handleOptions(req, res) {
  res.writeHead(204, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PATCH,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end();
}

async function handleApiRequest(req, res, url) {
  if (req.method === 'OPTIONS') {
    handleOptions(req, res);
    return;
  }

  const staticContent = await readJSONFile(STATIC_CONTENT_FILE, {});

  if (req.method === 'GET' && url.pathname === '/api/content') {
    sendJSON(res, 200, staticContent);
    return;
  }

  if (req.method === 'GET' && url.pathname === '/api/portfolio') {
    sendJSON(res, 200, staticContent.portfolio || []);
    return;
  }

  if (req.method === 'GET' && url.pathname === '/api/photographers') {
    sendJSON(res, 200, staticContent.photographers || []);
    return;
  }

  if (req.method === 'GET' && url.pathname === '/api/services') {
    sendJSON(res, 200, staticContent.services || []);
    return;
  }

  if (req.method === 'GET' && url.pathname === '/api/testimonials') {
    sendJSON(res, 200, staticContent.testimonials || []);
    return;
  }

  if (req.method === 'GET' && url.pathname === '/api/dashboard') {
    const bookings = await readJSONFile(BOOKINGS_FILE, []);
    const totalBookings = bookings.length;
    const now = new Date();
    const monthlyCount = bookings.filter(item => {
      const created = new Date(item.createdAt);
      return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
    }).length;
    const statusGroups = bookings.reduce((groups, item) => {
      groups[item.status] = (groups[item.status] || 0) + 1;
      return groups;
    }, {});

    sendJSON(res, 200, {
      metrics: staticContent.metrics || {},
      totalBookings,
      monthlyCount,
      statusGroups
    });
    return;
  }

  if (url.pathname.startsWith('/api/bookings')) {
    const bookings = await readJSONFile(BOOKINGS_FILE, []);
    const segments = url.pathname.split('/').filter(Boolean); // ['api', 'bookings', ...]

    if (req.method === 'GET' && segments.length === 2) {
      sendJSON(res, 200, bookings);
      return;
    }

    if (segments.length >= 3) {
      const bookingId = segments[2];
      const booking = bookings.find(item => item.id === bookingId);

      if (!booking) {
        sendJSON(res, 404, { message: '未找到预约信息' });
        return;
      }

      const isProgressUpdate = segments.length === 4 && segments[3] === 'progress';

      if (req.method === 'GET' && !isProgressUpdate) {
        sendJSON(res, 200, booking);
        return;
      }

      if (req.method === 'PATCH' && isProgressUpdate) {
        let body = '';
        req.on('data', chunk => {
          body += chunk;
        });
        req.on('end', async () => {
          try {
            const payload = JSON.parse(body || '{}');
            const { stage, note } = payload;
            if (!stage) {
              sendJSON(res, 400, { message: 'stage 为必填字段' });
              return;
            }
            const now = new Date().toISOString();
            booking.progress.push({
              stage,
              note: note || '',
              timestamp: now
            });
            booking.status = stage;
            await writeJSONFile(BOOKINGS_FILE, bookings);
            sendJSON(res, 200, booking);
          } catch (error) {
            sendJSON(res, 400, { message: '请求体格式错误' });
          }
        });
        return;
      }

      sendJSON(res, 405, { message: '不支持的操作' });
      return;
    }

    if (req.method === 'POST' && segments.length === 2) {
      let body = '';
      req.on('data', chunk => {
        body += chunk;
      });
      req.on('end', async () => {
        try {
          const payload = JSON.parse(body || '{}');
          const {
            clientName,
            email,
            phone,
            serviceId,
            eventDate,
            location,
            notes
          } = payload;

          if (!clientName || !email || !serviceId || !eventDate) {
            sendJSON(res, 400, { message: '请完整填写预约信息' });
            return;
          }

          const service = (staticContent.services || []).find(item => item.id === serviceId);
          const newBooking = {
            id: `bk-${randomUUID()}`,
            clientName,
            email,
            phone: phone || '',
            serviceId,
            serviceName: service ? service.name : '自定义服务',
            eventDate,
            location: location || '',
            status: 'consultation',
            createdAt: new Date().toISOString(),
            notes: notes || '',
            progress: [
              {
                stage: 'consultation',
                timestamp: new Date().toISOString(),
                note: '预约已创建，顾问将尽快联系'
              }
            ]
          };
          bookings.push(newBooking);
          await writeJSONFile(BOOKINGS_FILE, bookings);
          sendJSON(res, 201, newBooking);
        } catch (error) {
          sendJSON(res, 400, { message: '请求体格式错误' });
        }
      });
      return;
    }

    sendJSON(res, 405, { message: '不支持的操作' });
    return;
  }

  sendJSON(res, 404, { message: '未找到接口' });
}

function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const map = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
  };
  return map[ext] || 'application/octet-stream';
}

function serveStatic(req, res, url) {
  let filePath = path.join(PUBLIC_DIR, url.pathname === '/' ? 'index.html' : url.pathname);
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Not Found');
        return;
      }
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Internal Server Error');
      return;
    }

    res.writeHead(200, {
      'Content-Type': getContentType(filePath),
      'Cache-Control': 'public, max-age=600'
    });
    res.end(data);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (url.pathname.startsWith('/api/')) {
    try {
      await handleApiRequest(req, res, url);
    } catch (error) {
      console.error('API error', error);
      sendJSON(res, 500, { message: '服务器内部错误' });
    }
    return;
  }

  if (req.method === 'GET') {
    serveStatic(req, res, url);
    return;
  }

  res.writeHead(405, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Method Not Allowed');
});

server.listen(PORT, () => {
  console.log(`Jianhao Film Studio server is running on http://localhost:${PORT}`);
});
