# FriendLudo Admin Panel — Complete Reverse Engineering & Recovery

## 1. Overview & Live Access

This directory contains the completely recovered frontend application, original React source code, API proxy server, and executable API client for the **FriendLudo Admin Panel** (originally hosted at `https://akadmin2.friendludo.com`).

- **Public Cloudflare Live URL**: [https://absent-render-surgical-former.trycloudflare.com/admin/login](https://absent-render-surgical-former.trycloudflare.com/admin/login)
- **Local Development URL**: [http://localhost:5002/admin/login](http://localhost:5002/admin/login)
- **Backend API Target**: `https://apiv2.friendludo.com/api`

---

## 2. Directory Structure

```text
friendludo-admin/
├── index.html                   # Production SPA entry point
├── static/
│   ├── js/
│   │   └── main.2a3058b4.js     # Production Webpack bundle (patched with relative /api proxy)
│   ├── css/
│   │   └── main.c4d5c49b.css    # Material UI & Tailwind styling
│   └── media/
│       └── vs.9597fd4fa3bc901dab26.webp
├── src/                         # Fully recovered unminified React source code
│   ├── App.jsx                  # Main router & routes definition
│   ├── App.css
│   ├── index.css
│   ├── components/              # Layout, Sidebar, Navbar, ProtectedRoute
│   ├── context/                 # AuthContext (JWT management)
│   ├── pages/
│   │   ├── Login.jsx            # Admin credentials login screen
│   │   ├── Dashboard.jsx        # Metrics, deposit/withdrawal totals, active games
│   │   ├── Users.jsx            # User list, search, balances, ban toggling
│   │   ├── UserDetails.jsx      # Per-user profile, ledger, game history
│   │   ├── HoldGames.jsx        # Disputed matches & conflict resolution modal
│   │   ├── GameView.jsx         # Proof screenshot viewer & match inspector
│   │   ├── ResolvedGames.jsx    # Historical resolved disputes
│   │   ├── TotalGames.jsx       # Complete game ledger
│   │   ├── Deposits.jsx         # Completed deposits list
│   │   ├── PendingDeposits.jsx  # Manual deposit verifications
│   │   ├── Withdrawals.jsx      # UPI payout approvals and rejections
│   │   ├── BankWithdrawals.jsx  # IMPS/NEFT bank payout queue
│   │   ├── PendingKyc.jsx       # Aadhaar / PAN verification queue
│   │   ├── Bonus.jsx            # User promotional credits
│   │   ├── Penalty.jsx          # User penalty deductions
│   │   ├── Settings.jsx         # Platform commission, min withdrawal, UPI IDs
│   │   └── Admins.jsx           # Sub-admin role management
│   ├── redux/
│   │   ├── actionTypes.js       # All admin action type definitions
│   │   ├── store.js             # Redux root store
│   │   └── reducers/            # auth, dashboard, game, setting, user reducers
│   └── services/
│       └── api.js               # Axios instance with auth interceptor
├── server.cjs                   # Node.js runner with CORS spoofing & SPA fallback
├── api-client.cjs               # Standalone programmatic Admin API client
├── tunnel_url.txt               # Current active Cloudflare tunnel URL
└── README.md                    # Documentation
```

---

## 3. Reverse Engineered Admin API Contract

All requests to the backend (`https://apiv2.friendludo.com/api`) require the following spoofed headers to bypass CORS origin checks:
- `Origin: https://akadmin2.friendludo.com`
- `Referer: https://akadmin2.friendludo.com/`
- `Authorization: Bearer <JWT_TOKEN>`

### Authentication
- `POST /api/admin/login`
  - Payload: `{ "username": "...", "password": "..." }`
  - Response: `{ "token": "...", "admin": { "_id": "...", "username": "..." } }`

### Dashboard
- `GET /api/admin/dashboard`
  - Returns total users, total deposits, total payouts, total games, dispute counts.

### Users
- `GET /api/admin/users?page=1&search=...`
  - Returns paginated list of registered users.
- `GET /api/admin/details/:id`
  - Returns detailed profile, wallet balance, transaction ledger, and KYC docs.

### Disputed & Hold Games (Dispute Management)
- `GET /api/admin/hold-games`
  - Returns all matches in conflict state where both players claimed win or disputed room code.
- `GET /api/admin/view-game/:id`
  - Returns game details, submitted screenshot proof URLs from S3 (`https://ludo3.s3.ap-south-1.amazonaws.com`).
- `POST /api/admin/update-challenge`
  - Payload: `{ "gameId": "<ID>", "winnerId": "<USER_ID_OR_CANCEL>", "status": "completed" | "cancelled" }`

### Financials & Payouts
- `GET /api/admin/withdrawal-requests`
  - Returns pending user UPI withdrawals.
- `POST /api/admin/all-withdraw/:id`
  - Payload: `{ "status": "approved" | "rejected" }`
- `GET /api/admin/deposits`
- `GET /api/admin/pending-deposits`
- `GET /api/admin/bank-withdrawals`

### System Configuration
- `GET /api/admin/settings`
- `POST /api/admin/settings`
  - Controls platform commission percentage, minimum withdrawal limit, WhatsApp support number, and gateway credentials.

---

## 4. How to Run

### Run Local Admin Server
```bash
cd c:\Users\WASEEM\Desktop\rea\friendludo-admin
node server.cjs
```
The server will run on `http://localhost:5002`.

### Use Programmatic API Client
```bash
node -e "
const { AdminClient } = require('./api-client.cjs');
const client = new AdminClient('http://localhost:5002');
client.login('username', 'password').then(console.log).catch(console.error);
"
```
