const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 5002;
const HOST = '0.0.0.0';
const BACKEND_HOST = 'apiv2.friendludo.com';
const LIVE_ADMIN_ORIGIN = 'https://akadmin2.friendludo.com';
const STATIC_DIR = __dirname;

process.on('uncaughtException', (err) => {
  if (['ECONNRESET', 'EPIPE', 'ETIMEDOUT'].includes(err.code)) {
    return;
  }
  console.error('[UNCAUGHT EXCEPTION]', err.message);
});

const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
};

function serveFile(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('500 Internal Server Error');
      return;
    }
    res.writeHead(200, {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-cache',
    });
    res.end(data);
  });
}

function proxyApiRequest(req, res, targetPath) {
  const options = {
    hostname: BACKEND_HOST,
    port: 443,
    path: targetPath,
    method: req.method,
    headers: {
      ...req.headers,
      host: BACKEND_HOST,
      origin: LIVE_ADMIN_ORIGIN,
      referer: `${LIVE_ADMIN_ORIGIN}/`,
    },
  };

  delete options.headers['cookie'];

  const proxyReq = https.request(options, (proxyRes) => {
    const headers = { ...proxyRes.headers };
    headers['access-control-allow-origin'] = '*';
    headers['access-control-allow-methods'] = 'GET, POST, PUT, DELETE, OPTIONS, PATCH';
    headers['access-control-allow-headers'] = 'Content-Type, Authorization, x-auth-token, x-system-key';

    res.writeHead(proxyRes.statusCode, headers);
    proxyRes.pipe(res);
  });

  proxyReq.on('error', (err) => {
    console.error(`[API Proxy Error] ${req.method} ${targetPath}:`, err.message);
    if (!res.headersSent) {
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Bad Gateway connecting to backend API', details: err.message }));
    }
  });

  req.pipe(proxyReq);
}

function fetchRemoteAsset(reqUrlPath, localPath, res) {
  const remoteUrl = `${LIVE_ADMIN_ORIGIN}${reqUrlPath}`;
  console.log(`[Asset Fallback] Fetching ${remoteUrl} -> ${localPath}`);

  https.get(remoteUrl, (remoteRes) => {
    if (remoteRes.statusCode === 200) {
      fs.mkdirSync(path.dirname(localPath), { recursive: true });
      const fileStream = fs.createWriteStream(localPath);
      remoteRes.pipe(fileStream);

      const ext = path.extname(localPath).toLowerCase();
      const contentType = MIME_TYPES[ext] || remoteRes.headers['content-type'] || 'application/octet-stream';
      res.writeHead(200, {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
      });
      remoteRes.pipe(res);
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
    }
  }).on('error', (err) => {
    console.error(`[Asset Fetch Error] ${reqUrlPath}:`, err.message);
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('404 Not Found');
  });
}

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // Handle CORS Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-auth-token, x-system-key',
    });
    res.end();
    return;
  }

  // 1. API Proxy: /api/* -> https://apiv2.friendludo.com/api/*
  if (pathname.startsWith('/api')) {
    const targetPath = parsedUrl.path; // includes query string
    console.log(`[API ${req.method}] ${pathname}`);
    proxyApiRequest(req, res, targetPath);
    return;
  }

  // 2. Static File Resolution
  const cleanPath = pathname === '/' ? '/index.html' : pathname;
  const filePath = path.join(STATIC_DIR, cleanPath);

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    serveFile(res, filePath);
    return;
  }

  // 3. Fallback for missing static assets
  if (pathname.startsWith('/static/') || pathname.includes('.')) {
    fetchRemoteAsset(pathname, filePath, res);
    return;
  }

  // 4. SPA Fallback for client-side routing (/admin/dashboard, /admin/users, etc.)
  const indexPath = path.join(STATIC_DIR, 'index.html');
  if (fs.existsSync(indexPath)) {
    serveFile(res, indexPath);
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('404 Not Found');
});

server.listen(PORT, HOST, () => {
  console.log(`FriendLudo Admin Server running on http://${HOST}:${PORT}`);
  console.log(`Local UI: http://localhost:${PORT}/admin/login`);
  console.log(`Proxying /api to https://${BACKEND_HOST}/api with Origin: ${LIVE_ADMIN_ORIGIN}`);
});
