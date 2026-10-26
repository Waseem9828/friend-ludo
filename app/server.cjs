/**
 * WAludo Local Development & Application Runner Server
 * - Serves frontend SPA assets (HTML, CSS, JS, manifest, icons) with SPA routing fallback.
 * - Proxies /api/*, /maintain, /version, /waludo/* to WAludo Backend (http://127.0.0.1:5003).
 * - Proxies /socket.io/* WebSocket & polling to WAludo Backend.
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
const BACKEND_URL = process.env.BACKEND_URL || 'http://127.0.0.1:5003';

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

function proxyRequest(req, res, targetUrlStr) {
  req.on('error', () => {});
  res.on('error', () => {});

  const parsedTarget = new URL(targetUrlStr);
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
      referer: 'http://localhost:' + PORT + '/'
    }
  };

  delete options.headers['connection'];

  const proxyReq = transport.request(options, (proxyRes) => {
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
      res.end(JSON.stringify({ success: false, message: 'WAludo Backend Gateway Error: ' + err.message }));
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

  // 1. API and Realtime proxy to WAludo Backend
  if (
    pathname.startsWith('/api') || 
    pathname.startsWith('/waludo') || 
    pathname === '/maintain' || 
    pathname === '/version' || 
    pathname.startsWith('/socket.io')
  ) {
    const backendTarget = new URL(url.pathname + url.search, BACKEND_URL);
    return proxyRequest(req, res, backendTarget.toString());
  }

  // 2. Static file resolution
  let safePath = path.normalize(decodeURIComponent(pathname)).replace(/^(\.\.[\/\\])+/, '');
  let filePath = path.join(ROOT_DIR, safePath);

  fs.stat(filePath, (err, stats) => {
    if (!err && stats.isFile()) {
      return serveFile(res, filePath);
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
