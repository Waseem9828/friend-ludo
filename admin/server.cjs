const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 5002;
const HOST = '0.0.0.0';
const BACKEND_URL = process.env.BACKEND_URL || 'http://127.0.0.1:5003';
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
  const parsedTarget = new URL(targetPath, BACKEND_URL);
  const isHttps = parsedTarget.protocol === 'https:';
  const transport = isHttps ? https : http;

  const options = {
    hostname: parsedTarget.hostname,
    port: parsedTarget.port || (isHttps ? 443 : 80),
    path: parsedTarget.pathname + parsedTarget.search,
    method: req.method,
    headers: {
      ...req.headers,
      host: parsedTarget.host,
      origin: 'http://localhost:' + PORT,
      referer: 'http://localhost:' + PORT + '/',
    },
  };

  delete options.headers['cookie'];

  const proxyReq = transport.request(options, (proxyRes) => {
    const headers = { ...proxyRes.headers };
    headers['access-control-allow-origin'] = '*';
    headers['access-control-allow-methods'] = 'GET, POST, PUT, DELETE, OPTIONS, PATCH';
    headers['access-control-allow-headers'] = 'Content-Type, Authorization, x-auth-token, x-system-key';

    res.writeHead(proxyRes.statusCode, headers);
    proxyRes.pipe(res);
  });

  proxyReq.on('error', (err) => {
    console.error(`[WAludo Admin Proxy Error] ${req.method} ${targetPath}:`, err.message);
    if (!res.headersSent) {
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Bad Gateway connecting to WAludo backend API', details: err.message }));
    }
  });

  req.pipe(proxyReq);
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

  // 1. API Proxy to WAludo Backend
  if (
    pathname.startsWith('/api') || 
    pathname.startsWith('/admin/api') || 
    pathname.startsWith('/v1/core-sys-ops') || 
    pathname.startsWith('/waludo') ||
    pathname === '/maintain' || 
    pathname === '/version'
  ) {
    const targetPath = parsedUrl.path;
    console.log(`[WAludo Admin API ${req.method}] ${pathname}`);
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

  // 3. SPA Fallback for client-side routing (/admin/dashboard, /admin/users, etc.)
  const indexPath = path.join(STATIC_DIR, 'index.html');
  if (fs.existsSync(indexPath)) {
    serveFile(res, indexPath);
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('404 Not Found');
});

server.listen(PORT, HOST, () => {
  console.log(`=======================================================`);
  console.log(`🚀 WAludo Admin Server running on http://${HOST}:${PORT}`);
  console.log(`🌐 Local UI: http://localhost:${PORT}/admin/dashboard`);
  console.log(`📡 Connected to WAludo Backend: ${BACKEND_URL}`);
  console.log(`=======================================================`);
});
