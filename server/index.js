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
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'jianhao-admin-secret';
const COLLECTIONS_WITH_AUTO_ID = new Set([
  'portfolio',
  'photographers',
  'services',
  'testimonials',
  'timelineStages'
]);

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
    'Access-Control-Allow-Methods': 'GET,POST,PATCH,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(responseBody);
}

function handleOptions(req, res) {
  res.writeHead(204, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PATCH,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Token, Authorization'
  });
  res.end();
}

function collectRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
    });
    req.on('end', () => {
      if (!body) {
        resolve({});
        return;
      }
      try {
        const parsed = JSON.parse(body);
        resolve(parsed);
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });
}

function ensureAdmin(req, res) {
  const tokenHeader = req.headers['x-admin-token'] || req.headers['authorization'] || '';
  const normalized = tokenHeader.startsWith('Bearer ')
    ? tokenHeader.slice('Bearer '.length)
    : tokenHeader;
  if (normalized === ADMIN_TOKEN) {
    return true;
  }
  sendJSON(res, 401, { message: '管理员认证失败，请提供有效的令牌' });
  return false;
}

function cloneContent(content) {
  return JSON.parse(JSON.stringify(content));
}

function findCollectionIndex(collection, identifier) {
  if (!Array.isArray(collection)) {
    return -1;
  }
  const byIdIndex = collection.findIndex(item => item && item.id === identifier);
  if (byIdIndex !== -1) {
    return byIdIndex;
  }
  const numeric = Number(identifier);
  if (!Number.isNaN(numeric) && numeric >= 0 && numeric < collection.length) {
    return numeric;
  }
  return -1;
}

function normalizeToggleValue(value) {
  if (typeof value === 'string') {
    const lowered = value.toLowerCase();
    if (lowered === 'true') {
      return true;
    }
    if (lowered === 'false') {
      return false;
    }
  }
  return Boolean(value);
}

async function handleApiRequest(req, res, url) {
  if (req.method === 'OPTIONS') {
    handleOptions(req, res);
    return;
  }

  const segments = url.pathname.split('/').filter(Boolean);
  let staticContent = await readJSONFile(STATIC_CONTENT_FILE, {});

  if (segments.length >= 2 && segments[1] === 'admin') {
    if (!ensureAdmin(req, res)) {
      return;
    }

    if (req.method === 'GET' && segments.length === 3 && segments[2] === 'content') {
      sendJSON(res, 200, staticContent);
      return;
    }

    if (req.method === 'PUT' && segments.length === 3 && segments[2] === 'content') {
      let payload;
      try {
        payload = await collectRequestBody(req);
      } catch (error) {
        sendJSON(res, 400, { message: '请求体必须为合法的 JSON' });
        return;
      }
      if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
        sendJSON(res, 400, { message: '站点内容必须为对象结构' });
        return;
      }
      await writeJSONFile(STATIC_CONTENT_FILE, payload);
      staticContent = payload;
      sendJSON(res, 200, staticContent);
      return;
    }

    if (req.method === 'PATCH' && segments.length === 4 && segments[2] === 'sections') {
      let payload;
      try {
        payload = await collectRequestBody(req);
      } catch (error) {
        sendJSON(res, 400, { message: '请求体必须为合法的 JSON' });
        return;
      }
      if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
        sendJSON(res, 400, { message: '板块内容必须为对象' });
        return;
      }
      const sectionKey = segments[3];
      const currentValue = staticContent[sectionKey];
      if (Array.isArray(currentValue)) {
        sendJSON(res, 400, { message: '该板块为集合，请使用集合接口进行管理' });
        return;
      }
      const merged = {
        ...(currentValue && typeof currentValue === 'object' ? currentValue : {}),
        ...payload
      };
      staticContent[sectionKey] = merged;
      await writeJSONFile(STATIC_CONTENT_FILE, staticContent);
      sendJSON(res, 200, merged);
      return;
    }

    if (req.method === 'PATCH' && segments.length === 3 && segments[2] === 'feature-toggles') {
      let payload;
      try {
        payload = await collectRequestBody(req);
      } catch (error) {
        sendJSON(res, 400, { message: '请求体必须为合法的 JSON' });
        return;
      }
      if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
        sendJSON(res, 400, { message: '功能开关必须为对象' });
        return;
      }
      const toggles = {
        ...(staticContent.featureToggles || {})
      };
      Object.entries(payload).forEach(([key, value]) => {
        toggles[key] = normalizeToggleValue(value);
      });
      staticContent.featureToggles = toggles;
      await writeJSONFile(STATIC_CONTENT_FILE, staticContent);
      sendJSON(res, 200, toggles);
      return;
    }

    if (segments.length >= 4 && segments[2] === 'collections') {
      const collectionKey = segments[3];
      const collection = Array.isArray(staticContent[collectionKey])
        ? [...staticContent[collectionKey]]
        : [];

      if (req.method === 'PUT' && segments.length === 4) {
        let payload;
        try {
          payload = await collectRequestBody(req);
        } catch (error) {
          sendJSON(res, 400, { message: '请求体必须为合法的 JSON' });
          return;
        }
        if (!Array.isArray(payload)) {
          sendJSON(res, 400, { message: '集合内容必须为数组' });
          return;
        }
        staticContent[collectionKey] = payload;
        await writeJSONFile(STATIC_CONTENT_FILE, staticContent);
        sendJSON(res, 200, staticContent[collectionKey]);
        return;
      }

      if (req.method === 'POST' && segments.length === 4) {
        let payload;
        try {
          payload = await collectRequestBody(req);
        } catch (error) {
          sendJSON(res, 400, { message: '请求体必须为合法的 JSON' });
          return;
        }
        if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
          sendJSON(res, 400, { message: '集合条目必须为对象' });
          return;
        }
        const newItem = { ...payload };
        if (!newItem.id && COLLECTIONS_WITH_AUTO_ID.has(collectionKey)) {
          newItem.id = `${collectionKey.slice(0, 2)}-${randomUUID()}`;
        }
        collection.push(newItem);
        staticContent[collectionKey] = collection;
        await writeJSONFile(STATIC_CONTENT_FILE, staticContent);
        sendJSON(res, 201, newItem);
        return;
      }

      if (segments.length === 5 && (req.method === 'PATCH' || req.method === 'DELETE')) {
        const identifier = segments[4];
        const index = findCollectionIndex(collection, identifier);
        if (index === -1) {
          sendJSON(res, 404, { message: '未找到对应的集合条目' });
          return;
        }

        if (req.method === 'DELETE') {
          const removed = collection.splice(index, 1);
          staticContent[collectionKey] = collection;
          await writeJSONFile(STATIC_CONTENT_FILE, staticContent);
          sendJSON(res, 200, { removed: removed[0] });
          return;
        }

        let payload;
        try {
          payload = await collectRequestBody(req);
        } catch (error) {
          sendJSON(res, 400, { message: '请求体必须为合法的 JSON' });
          return;
        }
        if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
          sendJSON(res, 400, { message: '集合条目更新必须为对象' });
          return;
        }
        collection[index] = {
          ...(collection[index] && typeof collection[index] === 'object' ? collection[index] : {}),
          ...payload
        };
        staticContent[collectionKey] = collection;
        await writeJSONFile(STATIC_CONTENT_FILE, staticContent);
        sendJSON(res, 200, collection[index]);
        return;
      }
    }

    sendJSON(res, 404, { message: '未找到后台管理接口' });
    return;
  }

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
    const bookingSegments = url.pathname.split('/').filter(Boolean); // ['api', 'bookings', ...]

    if (req.method === 'GET' && bookingSegments.length === 2) {
      sendJSON(res, 200, bookings);
      return;
    }

    if (bookingSegments.length >= 3) {
      const bookingId = bookingSegments[2];
      const booking = bookings.find(item => item.id === bookingId);

      if (!booking) {
        sendJSON(res, 404, { message: '未找到预约信息' });
        return;
      }

      const isProgressUpdate = bookingSegments.length === 4 && bookingSegments[3] === 'progress';

      if (req.method === 'GET' && !isProgressUpdate) {
        sendJSON(res, 200, booking);
        return;
      }

      if (req.method === 'PATCH' && isProgressUpdate) {
        if (!ensureAdmin(req, res)) {
          return;
        }
        let payload;
        try {
          payload = await collectRequestBody(req);
        } catch (error) {
          sendJSON(res, 400, { message: '请求体格式错误' });
          return;
        }
        const { stage, note } = payload || {};
        if (!stage) {
          sendJSON(res, 400, { message: 'stage 为必填字段' });
          return;
        }
        const nowIso = new Date().toISOString();
        booking.progress.push({
          stage,
          note: note || '',
          timestamp: nowIso
        });
        booking.status = stage;
        await writeJSONFile(BOOKINGS_FILE, bookings);
        sendJSON(res, 200, booking);
        return;
      }

      sendJSON(res, 405, { message: '不支持的操作' });
      return;
    }

    if (req.method === 'POST' && bookingSegments.length === 2) {
      let payload;
      try {
        payload = await collectRequestBody(req);
      } catch (error) {
        sendJSON(res, 400, { message: '请求体格式错误' });
        return;
      }
      const {
        clientName,
        email,
        phone,
        serviceId,
        eventDate,
        location,
        notes
      } = payload || {};

      if (!clientName || !email || !serviceId || !eventDate) {
        sendJSON(res, 400, { message: '请完整填写预约信息' });
        return;
      }

      const service = (staticContent.services || []).find(item => item.id === serviceId);
      const nowIso = new Date().toISOString();
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
        createdAt: nowIso,
        notes: notes || '',
        progress: [
          {
            stage: 'consultation',
            timestamp: nowIso,
            note: '预约已创建，顾问将尽快联系'
          }
        ]
      };
      bookings.push(newBooking);
      await writeJSONFile(BOOKINGS_FILE, bookings);
      sendJSON(res, 201, newBooking);
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
  let relativePath = url.pathname.replace(/^\/+/, '');
  if (!relativePath) {
    relativePath = 'index.html';
  }

  let filePath = path.join(PUBLIC_DIR, relativePath);
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.stat(filePath, (statErr, stats) => {
    let finalPath = filePath;
    if (!statErr && stats.isDirectory()) {
      finalPath = path.join(filePath, 'index.html');
    } else if (statErr && statErr.code === 'ENOENT' && !relativePath.endsWith('.html')) {
      finalPath = `${filePath}.html`;
    }

    fs.readFile(finalPath, (err, data) => {
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
        'Content-Type': getContentType(finalPath),
        'Cache-Control': 'public, max-age=600'
      });
      res.end(data);
    });
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
