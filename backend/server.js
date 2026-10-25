import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import dns from 'dns';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';

import apiRouter from './src/backend/routes.js';
import { connectMongo, getStore } from './src/backend/db.js';

try {
  if (process.platform === 'win32') {
    dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
    dns.setDefaultResultOrder('ipv4first');
  }
} catch (e) {}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 5003);
const app = express();
const httpServer = createServer(app);

// Initialize Socket.IO with multi-origin CORS
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

app.disable('x-powered-by');

app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token', 'x-system-key', 'X-Requested-With']
}));

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Health and Maintenance status endpoints
app.get(['/maintain', '/api/maintain'], (req, res) => {
  try {
    const store = getStore();
    res.status(200).json(store.maintain || { version: '1.0.5', maintenanceMode: false });
  } catch (e) {
    res.status(200).json({ version: '1.0.5', maintenanceMode: false });
  }
});

app.get(['/version', '/api/version'], (req, res) => {
  try {
    const store = getStore();
    res.status(200).json({ version: store.maintain?.version || '1.0.5' });
  } catch (e) {
    res.status(200).json({ version: '1.0.5' });
  }
});

app.get(['/health', '/api/health'], (req, res) => {
  res.status(200).json({
    status: 'online',
    appName: 'FriendLudo Fully Autonomous Backend Engine',
    timestamp: new Date().toISOString()
  });
});

// Mount Routes
app.use('/api', apiRouter);
app.use('/payment', apiRouter);
app.use('/transaction', apiRouter);
app.use('/v1/core-sys-ops', apiRouter);
app.use('/', apiRouter);

// Socket.IO Matchmaking & Real-time Game Hub
io.on('connection', (socket) => {
  console.log(`[Socket Connected] Client ID: ${socket.id}`);

  socket.on('join_game_room', (roomId) => {
    socket.join(roomId);
    console.log(`[Socket] Client ${socket.id} joined room ${roomId}`);
  });

  socket.on('getChallenges', (payload) => {
    try {
      const store = getStore();
      const challenges = store.holdGames || [];
      socket.emit('getChallenges', challenges);
    } catch (e) {
      socket.emit('getChallenges', []);
    }
  });

  socket.on('disconnect', () => {
    console.log(`[Socket Disconnected] Client ID: ${socket.id}`);
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Backend Server Error]:', err?.stack || err?.message || err);
  res.status(err?.status || 500).json({
    status: err?.status || 500,
    error: 'SERVER_ERROR',
    message: err?.message || 'An unexpected internal server error occurred.'
  });
});

httpServer.listen(PORT, '0.0.0.0', async () => {
  console.log(`=======================================================`);
  console.log(`🚀 FriendLudo Standalone Backend Server Running!`);
  console.log(`🌐 Port: ${PORT}`);
  console.log(`📡 REST API & Socket.IO: http://localhost:${PORT}`);
  console.log(`=======================================================`);
  
  try {
    await connectMongo();
  } catch (e) {
    console.warn(`[Notice] Running in resilient local JSON storage mode (db_store.json)`);
  }
});
