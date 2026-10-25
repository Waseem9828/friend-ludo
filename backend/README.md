# FriendLudo Standalone Backend Server & Socket.IO Engine

A 100% reverse-engineered, standalone Node.js/Express + Socket.IO backend service for the **FriendLudo** platform.

---

## 1. Features & Architecture

- **Runtime**: Node.js (ES Modules)
- **Framework**: Express 5 + Socket.IO 4
- **Database Architecture**:
  - **Primary**: MongoDB Atlas (SRV resolution with fallback for Windows DNS)
  - **Resilient Fallback**: Local persistent JSON store (`scratch/db_store.json`) allowing the entire platform to run 100% offline without database dependencies.
- **Security & Shielding**:
  - Forward Protection & Rate Limiting (120 req/min per IP with auto-eviction)
  - CORS Multi-Origin support
  - Security headers (`nosniff`, `SAMEORIGIN`, `strict-origin-when-cross-origin`)

---

## 2. API Endpoints Map

### System & Health
- `GET /health` / `GET /api/health` — Service health & uptime
- `GET /maintain` / `GET /api/maintain` — Maintenance mode flags & version status
- `GET /version` / `GET /api/version` — Application version check

### Authentication
- `POST /api/auth/login` — Phone number / OTP login
- `POST /api/auth/resendOTP` — Resend verification SMS
- `GET /api/auth/logout` — Invalidate user session

### User Profile & KYC
- `GET /api/user/getUserProfileData` — Player profile, stats, and balance
- `GET /api/user/kycDetails` — Aadhaar / PAN verification status
- `POST /api/user/kycRegister` — Submit Aadhaar number for KYC
- `POST /api/user/kycOtp` — Verify UIDAI OTP
- `POST /api/user/manualkyc` — Manual KYC image upload
- `GET /api/user/AllBanks` — Saved IMPS/NEFT bank accounts
- `GET /api/user/AllUpiBanks` — Saved UPI IDs
- `GET /api/user/delete/upids/:id` — Remove saved UPI handle

### Cashier & Wallet
- `GET /api/transaction/wallet` — Chip ledger (deposit, win, bonus chips)
- `POST /api/transaction/verify-vpa` — Real-time UPI VPA verification
- `POST /api/user/chipsConvert` — Convert win chips to withdrawal balance

### Matches & Disputes
- `POST /api/game/upload-game-image/:id` — Match screenshot proof upload
- `POST /api/challenges/win/:id` — Submit victory claim with room proof
- `POST /api/challenges/loose/:id` — Forfeit match
- `POST /api/challenges/cancel/:id` — Cancel lobby if opponent fails to enter room code

### Realtime Matchmaking (Socket.IO)
- `join_game_room` — Join match room for real-time room code sharing
- `getChallenges` — Live challenge broadcast to lobby players

---

## 3. How to Run

```bash
cd c:\Users\WASEEM\Desktop\rea\friendludo-backend
node server.js
```
The server will start on port `5003` (`http://localhost:5003`).
