/**
 * Friend Ludo Local Development & Application Runner Server
 * - Serves frontend SPA assets (HTML, CSS, JS, manifest, icons) with SPA routing fallback.
 * - Proxies /api/* requests to https://apiv2.friendludo.com/api/* with required CORS and Referer headers.
 * - Proxies /socket.io/* WebSocket connections to socketv2.friendludo.com.
 * - Robust error handling (no unhandled ECONNRESET crashes).
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const os = require('os');

const PORT = process.env.PORT || 5001;
const HOST = '0.0.0.0';
const ROOT_DIR = __dirname;
const REMOTE_API = 'apiv2.friendludo.com';
const REMOTE_SOCKET = 'socketv2.friendludo.com';

// Prevent crashes on client disconnects / network resets
process.on('uncaughtException', (err) => {
  if (err.code === 'ECONNRESET' || err.code === 'EPIPE' || err.code === 'ECANCELED') {
    return;
  }
  console.error('⚠️ Uncaught server error:', err.message);
});

process.on('unhandledRejection', (reason) => {
  console.error('⚠️ Unhandled rejection:', reason);
});

function getLanIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml'
};

function serveFile(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('500 Internal Server Error');
      }
      return;
    }
    if (!res.headersSent) {
      res.writeHead(200, {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache'
      });
      res.end(content);
    }
  });
}

function proxyRequest(req, res, targetHost, targetPath) {
  req.on('error', () => {});
  res.on('error', () => {});

  const options = {
    hostname: targetHost,
    port: 443,
    path: targetPath,
    method: req.method,
    headers: {
      ...req.headers,
      host: targetHost,
      origin: 'https://friendludo.com',
      referer: 'https://friendludo.com/'
    }
  };

  delete options.headers['connection'];

  const proxyReq = https.request(options, (proxyRes) => {
    proxyRes.on('error', () => {});

    const headers = { ...proxyRes.headers };
    headers['access-control-allow-origin'] = '*';
    headers['access-control-allow-headers'] = '*';
    headers['access-control-allow-methods'] = 'GET, POST, PUT, DELETE, OPTIONS, PATCH';

    if (!res.headersSent) {
      res.writeHead(proxyRes.statusCode, headers);
      proxyRes.pipe(res, { end: true });
    }
  });

  proxyReq.on('error', (err) => {
    if (!res.headersSent) {
      res.writeHead(502, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({ success: false, message: 'Proxy Gateway Error: ' + err.message }));
    }
  });

  req.pipe(proxyReq, { end: true });
}

const server = http.createServer((req, res) => {
  req.on('error', () => {});
  res.on('error', () => {});

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(200, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH'
    });
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname;

  // 1. API proxy
  if (pathname.startsWith('/api/') || pathname === '/api') {
    return proxyRequest(req, res, REMOTE_API, req.url);
  }

  // 2. Socket.io polling fallback
  if (pathname.startsWith('/socket.io/')) {
    return proxyRequest(req, res, REMOTE_SOCKET, req.url);
  }

  // 3. Static file resolution
  let safePath = path.normalize(decodeURIComponent(pathname)).replace(/^(\.\.[\/\\])+/, '');
  let filePath = path.join(ROOT_DIR, safePath);

  fs.stat(filePath, (err, stats) => {
    if (!err && stats.isFile()) {
      return serveFile(res, filePath);
    }

    // If it is an asset or media file not found locally, proxy from friendludo.com
    if (pathname.startsWith('/assets/') || pathname.startsWith('/static/media/') || pathname.startsWith('/images/')) {
      return proxyRequest(req, res, 'friendludo.com', req.url);
    }

    // Default to index.html for SPA routing
    const indexPath = path.join(ROOT_DIR, 'index.html');
    fs.stat(indexPath, (indexErr, indexStats) => {
      if (!indexErr && indexStats.isFile()) {
        return serveFile(res, indexPath);
      }
      if (!res.headersSent) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
      }
    });
  });
});

// Proxy WebSocket / Socket.io upgrades
server.on('upgrade', (req, socket, head) => {
  socket.on('error', (err) => {
    try { socket.destroy(); } catch (_) {}
  });

  if (req.url.startsWith('/socket.io/')) {
    const proxyReq = https.request({
      hostname: REMOTE_SOCKET,
      port: 443,
      path: req.url,
      method: req.method,
      headers: {
        ...req.headers,
        host: REMOTE_SOCKET,
        origin: 'https://friendludo.com'
      }
    });

    proxyReq.on('upgrade', (proxyRes, proxySocket, proxyHead) => {
      proxySocket.on('error', (err) => {
        try { socket.destroy(); } catch (_) {}
      });

      socket.on('error', (err) => {
        try { proxySocket.destroy(); } catch (_) {}
      });

      socket.write(
        `HTTP/${proxyRes.httpVersion} ${proxyRes.statusCode} ${proxyRes.statusMessage}\r\n` +
        Object.entries(proxyRes.headers)
          .map(([k, v]) => `${k}: ${v}\r\n`)
          .join('') +
        '\r\n'
      );
      if (proxyHead && proxyHead.length) socket.write(proxyHead);
      if (head && head.length) proxySocket.write(head);
      proxySocket.pipe(socket);
      socket.pipe(proxySocket);
    });

    proxyReq.on('error', (err) => {
      try { socket.destroy(); } catch (_) {}
    });

    proxyReq.end();
  } else {
    try { socket.destroy(); } catch (_) {}
  }
});

server.listen(PORT, HOST, () => {
  const lanIp = getLanIp();
  console.log(`=======================================================`);
  console.log(`🚀 Friend Ludo Application running!`);
  console.log(`💻 Local URL:   http://localhost:${PORT}`);
  console.log(`📱 Network URL: http://${lanIp}:${PORT}`);
  console.log(`📡 Backend Proxy: https://${REMOTE_API}`);
  console.log(`=======================================================`);
});
