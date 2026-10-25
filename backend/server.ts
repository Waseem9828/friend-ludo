import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import fs from 'fs';
import dns from 'dns';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { createServer as createViteServer } from 'vite';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import apiRouter from './src/backend/routes.js';
import { connectMongo } from './src/backend/db.js';

try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
  dns.setDefaultResultOrder('ipv4first');
} catch (e) {}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = Number(process.env.PORT || 3000);
const isProduction = process.env.NODE_ENV === 'production';

// Sliding window rate limiter for Forward Protection
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute window
const MAX_REQUESTS_PER_WINDOW = 120; // max 120 requests per min per IP

// Evict expired rate-limit records every 5 minutes to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of rateLimitMap.entries()) {
    if (now > record.resetTime) {
      rateLimitMap.delete(ip);
    }
  }
}, 5 * 60 * 1000);

function rateLimiter(req: Request, res: Response, next: NextFunction) {
  const ip = req.ip || req.socket.remoteAddress || 'unknown-ip';
  if (ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1') {
    return next();
  }
  const now = Date.now();

  const record = rateLimitMap.get(ip);
  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return next();
  }

  record.count += 1;
  if (record.count > MAX_REQUESTS_PER_WINDOW) {
    return res.status(429).json({
      status: 429,
      error: 'Too Many Requests',
      message: 'Rate limit exceeded. Please try again later for forward protection.'
    });
  }

  next();
}

async function startServer() {
  const app = express();
  const httpServer = createServer(app);

  // Trust first proxy (Cloudflare, Nginx, Vercel, AWS ALB) for accurate IP resolution
  app.set('trust proxy', 1);

  // Disable powered-by header to prevent fingerprinting
  app.disable('x-powered-by');

  // Forward Protection & Security Headers Middleware
  app.use((req: Request, res: Response, next: NextFunction) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('X-Gateway-Protection', 'Secured-API-Shield-v1.0');
    next();
  });

  // Dynamic CORS configuration supporting explicit ALLOWED_ORIGINS for multi-domain deployment
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean)
    : [];

  app.use(cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS policy blocked request from origin: ${origin}`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token', 'x-system-key', 'X-Requested-With']
  }));

  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ extended: true, limit: '15mb' }));

  // Apply rate limiting to all incoming requests
  app.use(rateLimiter);

  // Connect to MongoDB Atlas
  await connectMongo();

  // Custom rewrite for /admin before static or SPA
  // Custom SPA Fallback for /admin and /admin/* browser page navigation
  app.use((req: Request, res: Response, next: NextFunction) => {
    const url = req.url || '';
    const accept = req.headers.accept || '';
    const isApiRequest = url.startsWith('/api') || 
                         url.startsWith('/v1') || 
                         url.startsWith('/payment') || 
                         url.startsWith('/transaction') || 
                         url.startsWith('/socket.io') ||
                         accept.includes('application/json') || 
                         req.headers['x-requested-with'] === 'XMLHttpRequest';

    if (!isApiRequest && (url.startsWith('/admin') || url.startsWith('/super_admin_'))) {
      const distAdminHtml = resolve(__dirname, 'dist/admin.html');
      const publicAdminHtml = resolve(__dirname, 'public/admin.html');
      if (fs.existsSync(distAdminHtml)) {
        return res.sendFile(distAdminHtml);
      } else if (fs.existsSync(publicAdminHtml)) {
        return res.sendFile(publicAdminHtml);
      }
    }
    next();
  });

  // Serve static assets (SVGs, PNGs, WebP, CSS, JS) from public and app-user directories
  app.use(express.static(resolve(__dirname, 'public')));
  app.use('/static', express.static(resolve(__dirname, 'public/static')));
  app.use('/assets', express.static(resolve(__dirname, 'public/assets')));
  app.use('/plugins', express.static(resolve(__dirname, 'public/plugins')));
  app.use('/app-user', express.static(resolve(__dirname, 'app-user')));
  app.use('/uploads', express.static(resolve(__dirname, 'public/uploads')));

  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    },
    transports: ['polling', 'websocket']
  });

  app.set('io', io);
  (global as any).io = io;

  io.on('connection', (socket) => {
    console.log(`[Socket.IO Client Connected]: ${socket.id}`);
    socket.on('join_game_room', (roomId) => {
      if (roomId && typeof roomId === 'string' && roomId.trim() !== '') {
        const cleanRoomId = roomId.trim().replace(/[^a-zA-Z0-9_-]/g, '');
        if (cleanRoomId) socket.join(`room_${cleanRoomId}`);
      }
    });
    socket.on('disconnect', () => {
      console.log(`[Socket.IO Client Disconnected]: ${socket.id}`);
    });
  });

  // Chrome DevTools & App Specific well-known endpoint
  app.use('/.well-known', (req: Request, res: Response) => {
    res.status(200).json({ status: 'ok' });
  });

  // Dedicated Web Payment Checkout & QR Code Page Endpoint (Direct App Mount)
  app.get(['/payment/pay-qr', '/pay-qr', '/api/payment/pay-qr'], (req: Request, res: Response) => {
    const { order_id, upi, am } = req.query || {};
    const orderId = (order_id || 'LL_' + Date.now().toString().slice(-8)).toString();
    const amount = (am || '100').toString();
    const upiUri = (upi || `upi://pay?pa=ludoleague@icici&pn=LudoLeague&am=${amount}&cu=INR&tn=${orderId}`).toString();
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(upiUri)}`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>EKQR UPI Payment | Ludo League Online</title>
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Poppins', sans-serif; }
    body { background: #0f172a; color: #ffffff; display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 20px; }
    .card { background: #1e293b; border-radius: 20px; box-shadow: 0 20px 40px rgba(0,0,0,0.5); max-width: 420px; width: 100%; text-align: center; padding: 30px 24px; border: 1px solid rgba(255,255,255,0.1); }
    .header { font-size: 20px; font-weight: 700; color: #38bdf8; margin-bottom: 6px; }
    .sub { font-size: 13px; color: #94a3b8; margin-bottom: 20px; }
    .amount-box { background: rgba(56, 189, 248, 0.1); border: 1px solid rgba(56, 189, 248, 0.3); border-radius: 12px; padding: 12px; margin-bottom: 20px; }
    .amount-box .val { font-size: 28px; font-weight: 800; color: #4ade80; }
    .qr-container { background: #ffffff; padding: 16px; border-radius: 16px; display: inline-block; margin-bottom: 20px; box-shadow: 0 10px 20px rgba(0,0,0,0.2); }
    .qr-container img { width: 220px; height: 220px; display: block; border-radius: 8px; }
    .apps-title { font-size: 13px; color: #cbd5e1; margin-bottom: 12px; font-weight: 600; }
    .app-btns { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px; }
    .btn-app { background: #334155; color: #ffffff; text-decoration: none; padding: 10px; border-radius: 10px; font-size: 12px; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 6px; border: 1px solid rgba(255,255,255,0.1); transition: all 0.2s; }
    .btn-app:hover { background: #475569; transform: translateY(-1px); }
    .status-msg { font-size: 13px; color: #fbbf24; font-weight: 500; display: flex; align-items: center; justify-content: center; gap: 8px; }
    .spinner { width: 14px; height: 14px; border: 2px solid #fbbf24; border-top-color: transparent; border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">EKQR Payment Checkout</div>
    <div class="sub">Order ID: <b>${orderId}</b></div>
    <div class="amount-box">
      <div style="font-size: 12px; color: #94a3b8;">Amount to Pay</div>
      <div class="val">₹${amount}</div>
    </div>
    <div class="qr-container">
      <img src="${qrCodeUrl}" alt="Scan UPI QR Code">
    </div>
    <div class="apps-title">Scan QR Code using any UPI App or click below:</div>
    <div class="app-btns">
      <a href="${upiUri}" class="btn-app">📱 Pay with UPI App</a>
      <a href="gpay://upi/pay?pa=${encodeURIComponent(upiUri.split('pa=')[1] || '')}" class="btn-app">🟢 Google Pay</a>
      <a href="phonepe://pay?pa=${encodeURIComponent(upiUri.split('pa=')[1] || '')}" class="btn-app">🟣 PhonePe</a>
      <a href="paytmmp://pay?pa=${encodeURIComponent(upiUri.split('pa=')[1] || '')}" class="btn-app">🔵 Paytm</a>
    </div>
    <div class="status-msg" id="status-text">
      <div class="spinner"></div>
      <span>Waiting for payment completion...</span>
    </div>
  </div>

  <script>
    const orderId = "${orderId}";
    async function checkPaymentStatus() {
      try {
        const res = await fetch('/transaction/check-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ client_txn_id: orderId })
        });
        const data = await res.json();
        if (data && (data.depositStatus === 'Approved' || data.success === true)) {
          document.getElementById('status-text').innerHTML = '✅ <span style="color:#4ade80;">Payment Successful! Redirecting...</span>';
          setTimeout(() => {
            window.location.href = '/user-wallet';
          }, 1500);
        }
      } catch (e) {}
    }
    setInterval(checkPaymentStatus, 3000);
  </script>
</body>
</html>`);
  });

  // Mount protected backend API routes under designated gateways
  app.use('/api', apiRouter);
  app.use('/payment', apiRouter);
  app.use('/transaction', apiRouter);
  app.use('/v1/core-sys-ops', apiRouter);
  app.use('/', apiRouter);

  // Global Error Handler Middleware
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error('[Unhandled Request Error]:', err.stack || err.message || err);
    res.status(err.status || 500).json({
      status: err.status || 500,
      error: 'SERVER_ERROR',
      message: err.message || 'An unexpected internal server error occurred.'
    });
  });

  const distPath = resolve(__dirname, 'dist');
  const hasDist = fs.existsSync(distPath);

  if (isProduction || hasDist) {
    app.use(express.static(distPath));
    app.get('{*path}', (req: Request, res: Response, next: NextFunction) => {
      const url = req.url || '';
      const accept = req.headers.accept || '';

      const isExplicitApi = url.startsWith('/api/') || 
                            url.startsWith('/v1/') || 
                            url.startsWith('/payment/') || 
                            url.startsWith('/transaction/') || 
                            url.startsWith('/socket.io');

      if (!isExplicitApi && (accept.includes('text/html') || !url.includes('.'))) {
        if (url.startsWith('/admin') || url.startsWith('/super_admin_')) {
          return res.sendFile(resolve(distPath, 'admin.html'));
        }
        return res.sendFile(resolve(distPath, 'index.html'));
      }

      if (url.startsWith('/user/') || url.startsWith('/spin/') || url.startsWith('/challenges/') || url.startsWith('/game/') || url.startsWith('/aadhaar/')) {
        return next();
      }

      if (url.startsWith('/admin') || url.startsWith('/super_admin_')) {
        return res.sendFile(resolve(distPath, 'admin.html'));
      } else {
        return res.sendFile(resolve(distPath, 'index.html'));
      }
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`[Ludo League Online Server] Running on http://0.0.0.0:${PORT}`);
    console.log(`[Ludo League Online Server] Admin portal: http://0.0.0.0:${PORT}/admin`);
    console.log(`[Ludo League Online Server] Player app: http://0.0.0.0:${PORT}/`);
    console.log(`[Ludo League Online Server] Backend API (Secured): http://0.0.0.0:${PORT}/api/health`);
  });
}

startServer().catch((err) => {
  console.error('[Server Error]', err);
  process.exit(1);
});
