# Friend Ludo (friendludo.com) — Master Project Workspace

This folder separates all Friend Ludo components into clean, dedicated directories:

```text
friend-ludo/
├── app/       👉 User Web App (React PWA, match lobbies, wallet, static assets)
│                 Local: http://localhost:5001
├── admin/     👉 Admin Panel (Complete React source code, dispute resolution, payouts)
│                 Local: http://localhost:5002/admin/login
└── backend/   👉 Standalone REST API & Socket.IO Matchmaking Server
                  Local: http://localhost:5003
```

---

## Quick Run Commands

### 1. Run User App
```bash
cd app
node server.cjs
```

### 2. Run Admin Panel
```bash
cd admin
node server.cjs
```

### 3. Run Backend Engine
```bash
cd backend
node server.js
```
