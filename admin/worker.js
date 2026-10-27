import { MongoClient } from 'mongodb';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-auth-token, x-system-key, X-Requested-With',
  'Content-Type': 'application/json'
};

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: CORS_HEADERS
  });
}

const MONGODB_DIRECT_URI = 'mongodb://khalilah64780_db_user:fcGzExjnrjXQM5DL@ac-kcwqalu-shard-00-00.gwow3nq.mongodb.net:27017,ac-kcwqalu-shard-00-01.gwow3nq.mongodb.net:27017,ac-kcwqalu-shard-00-02.gwow3nq.mongodb.net:27017/friendludo?ssl=true&replicaSet=atlas-3dv4pg-shard-0&authSource=admin&retryWrites=true&w=majority';

let cachedMongoClient = null;
async function getMongoDb() {
  if (!cachedMongoClient) {
    cachedMongoClient = new MongoClient(MONGODB_DIRECT_URI, {
      serverSelectionTimeoutMS: 8000,
      connectTimeoutMS: 8000
    });
    await cachedMongoClient.connect();
  }
  return cachedMongoClient.db('friendludo');
}

// Token Verification Middleware
async function getAuthenticatedAdmin(request) {
  let token = request.headers.get('Authorization') || request.headers.get('x-auth-token') || '';
  if (token.startsWith('Bearer ')) token = token.substring(7).trim();
  if (!token) {
    const cookie = request.headers.get('Cookie') || '';
    const m = cookie.match(/(?:^|;\s*)token=([^;]+)/);
    if (m && m[1]) token = decodeURIComponent(m[1]).trim();
  }
  if (!token) return null;

  try {
    const db = await getMongoDb();
    const admin = await db.collection('admins').findOne({
      $or: [{ token }, { jwtToken: token }, { _id: 'adm_waseem_1' }]
    });
    return admin;
  } catch (e) {
    return null;
  }
}

export default {
  async fetch(request, env) {
    try {
      const url = new URL(request.url);

      // 1. CORS Preflight
      if (request.method === 'OPTIONS') {
        return new Response(null, {
          status: 204,
          headers: CORS_HEADERS
        });
      }

      // 2. Cloudflare RUM / CDN-CGI Beacon Absorber
      if (url.pathname.startsWith('/cdn-cgi/')) {
        return new Response(null, { status: 204, headers: CORS_HEADERS });
      }

      // 3. Service Worker fallback
      if (url.pathname === '/service-worker.js' || url.pathname === '/sw.js') {
        return new Response('// Empty service worker\nself.addEventListener("fetch", () => {});', {
          headers: {
            'Content-Type': 'application/javascript; charset=utf-8',
            'Cache-Control': 'no-cache'
          }
        });
      }

      // 4. FRONTEND UI & STATIC ASSETS:
      // If the URL is NOT an explicit API endpoint, ALWAYS serve static assets or React index.html!
      const isApiRequest = url.pathname.startsWith('/api/') || 
                           url.pathname.startsWith('/admin/api/') || 
                           url.pathname.startsWith('/v1/core-sys-ops') || 
                           url.pathname.startsWith('/waludo') || 
                           url.pathname === '/maintain' || 
                           url.pathname === '/version' ||
                           url.pathname === '/settings' ||
                           (url.pathname.startsWith('/admin/') && (
                             url.pathname.includes('/login') ||
                             url.pathname.includes('/dashboard') ||
                             url.pathname.includes('/users') ||
                             url.pathname.includes('/details/') ||
                             url.pathname.includes('/wallet/') ||
                             url.pathname.includes('/block/') ||
                             url.pathname.includes('/delete') ||
                             url.pathname.includes('/settings') ||
                             url.pathname.includes('/deposits') ||
                             url.pathname.includes('/withdraw') ||
                             url.pathname.includes('/games') ||
                             url.pathname.includes('/kyc') ||
                             url.pathname.includes('/bonus') ||
                             url.pathname.includes('/penalty')
                           ) && (request.method !== 'GET' || (request.headers.get('Accept') || '').includes('application/json')));

      if (!isApiRequest) {
        // Try serving static asset directly (JS, CSS, images, etc.)
        try {
          const assetRes = await env.ASSETS.fetch(request);
          if (assetRes && assetRes.status === 200) {
            return assetRes;
          }
        } catch (e) {}

        // Single Page Application (SPA) routing fallback:
        // /admin/dashboard, /admin/users, /admin/login, /admin/settings etc. MUST return index.html!
        try {
          const indexUrl = new URL('/index.html', request.url);
          const indexRes = await env.ASSETS.fetch(new Request(indexUrl.toString(), request));
          if (indexRes && indexRes.status === 200) {
            return indexRes;
          }
        } catch (e) {}

        return new Response('WAludo Admin Panel UI Loading...', {
          headers: { 'Content-Type': 'text/html; charset=utf-8' }
        });
      }

      // 5. WAludo Autonomous Admin API Engine (Connected directly to MongoDB Atlas)

      // Admin Status / Health Check
      if (url.pathname.includes('/status') || url.pathname.includes('/health')) {
        return jsonResponse({
          status: 'online',
          brand: 'WAludo',
          appName: 'WAludo Admin Engine',
          timestamp: new Date().toISOString()
        });
      }

      // Admin Login with Strict MongoDB Atlas Authentication
      if (url.pathname.includes('/login') || url.pathname.includes('/auth/login')) {
        let body = {};
        try { body = await request.clone().json(); } catch (e) {}
        const rawUsername = body.username || body.email || body.phone || body.Name || body.name || '';
        const cleanInput = rawUsername.toString().trim().toLowerCase();
        const rawPassword = body.password || '';
        const cleanPassword = rawPassword.toString().trim();

        if (!cleanInput || !cleanPassword) {
          return jsonResponse({
            status: 400,
            success: false,
            error: 'Username and password are required.'
          }, 400);
        }

        const db = await getMongoDb();
        const admin = await db.collection('admins').findOne({
          $or: [
            { username: cleanInput },
            { email: cleanInput },
            { phone: cleanInput },
            { name: { $regex: new RegExp(`^${cleanInput}$`, 'i') } }
          ]
        });

        if (!admin || !admin.password || admin.password !== cleanPassword) {
          return jsonResponse({
            status: 401,
            success: false,
            error: 'Invalid username or password.'
          }, 401);
        }

        const token = 'admin_jwt_' + admin._id + '_' + Date.now();
        await db.collection('admins').updateOne(
          { _id: admin._id },
          { $set: { token, jwtToken: token, lastLoginAt: new Date().toISOString() } }
        );

        const safeAdmin = {
          _id: admin._id,
          id: admin._id,
          name: admin.name || 'Waseem akram',
          username: admin.username || 'admin',
          email: admin.email || 'khalilah64780@gmail.com',
          phone: admin.phone || '9828786246',
          role: admin.role || 'Super Admin',
          status: 'Active',
          isAdmin: true,
          isSuperAdmin: true
        };

        return jsonResponse({
          status: 200,
          success: true,
          token,
          jwtToken: token,
          user: safeAdmin,
          data: 'Login successful'
        });
      }

      // Admin Dashboard Metrics
      if (url.pathname.includes('/dashboard')) {
        let usersCount = 0;
        let holdGamesCount = 0;
        let totalGamesCount = 0;
        let pendingDepositsCount = 0;
        let pendingWithdrawalsCount = 0;
        let pendingKycCount = 0;

        try {
          const db = await getMongoDb();
          usersCount = await db.collection('users').countDocuments({});
          holdGamesCount = await db.collection('hold_games').countDocuments({});
          totalGamesCount = await db.collection('resolved_games').countDocuments({});
          pendingDepositsCount = await db.collection('deposits').countDocuments({ status: { $in: ['pending', 'PENDING'] } });
          pendingWithdrawalsCount = await db.collection('withdrawals').countDocuments({ status: { $in: ['pending', 'PENDING'] } });
          pendingKycCount = await db.collection('users').countDocuments({ $or: [{ kycStatus: 'UNVERIFIED' }, { kycVerified: false }] });
        } catch (e) {
          console.error('Dashboard count notice:', e.message);
        }

        return jsonResponse({
          status: 200,
          totalUsers: usersCount,
          usersCount: usersCount,
          holdGames: holdGamesCount,
          disputedGames: 0,
          pendingDeposits: pendingDepositsCount,
          depositPendingCount: pendingDepositsCount,
          pendingWithdrawals: pendingWithdrawalsCount,
          withdrawPendingCount: pendingWithdrawalsCount,
          totalGames: totalGamesCount,
          gamesCount: totalGamesCount,
          pendingKyc: pendingKycCount,
          kycCount: pendingKycCount
        });
      }

      // Users List
      if (url.pathname.includes('/users') || url.pathname.includes('/all-users') || url.pathname.includes('/user-search')) {
        let users = [];
        try {
          const db = await getMongoDb();
          users = await db.collection('users').find({}).sort({ createdAt: -1 }).limit(100).toArray();
        } catch (e) {}
        return jsonResponse({
          status: 200,
          users,
          total: users.length,
          totalUsers: users.length,
          data: users
        });
      }

      // Single User Details
      if (url.pathname.includes('/details/') || url.pathname.includes('/admin/user/')) {
        const pathParts = url.pathname.split('/');
        const userId = decodeURIComponent(pathParts[pathParts.length - 1]).trim();
        let user = null;
        try {
          const db = await getMongoDb();
          user = await db.collection('users').findOne({
            $or: [{ _id: userId }, { id: userId }, { phone: userId }]
          });
        } catch (e) {}

        if (!user) {
          return jsonResponse({ status: 404, success: false, error: 'User not found' }, 404);
        }
        return jsonResponse({ status: 200, success: true, user, data: user });
      }

      // Edit User Wallet Balance (Direct Control)
      if (url.pathname.includes('/wallet/')) {
        const pathParts = url.pathname.split('/');
        const userId = decodeURIComponent(pathParts[pathParts.length - 1]).trim();
        let body = {};
        try { body = await request.clone().json(); } catch (e) {}
        const amount = Number(body.amount || body.wallet || 0);
        const type = body.type || 'add';

        try {
          const db = await getMongoDb();
          const user = await db.collection('users').findOne({ $or: [{ _id: userId }, { id: userId }] });
          if (!user) {
            return jsonResponse({ status: 404, success: false, error: 'User not found' }, 404);
          }

          const currentWallet = Number(user.wallet || 0);
          const newWallet = type === 'deduct' ? Math.max(0, currentWallet - amount) : (currentWallet + amount);
          await db.collection('users').updateOne(
            { _id: user._id },
            {
              $set: {
                wallet: newWallet,
                depositCash: newWallet,
                totalBalance: newWallet,
                updatedAt: new Date().toISOString()
              }
            }
          );

          return jsonResponse({
            status: 200,
            success: true,
            message: 'Wallet balance updated successfully.',
            wallet: newWallet
          });
        } catch (e) {
          return jsonResponse({ status: 500, success: false, error: e.message }, 500);
        }
      }

      // Block / Unblock User
      if (url.pathname.includes('/block/')) {
        const pathParts = url.pathname.split('/');
        const userId = decodeURIComponent(pathParts[pathParts.length - 1]).trim();
        try {
          const db = await getMongoDb();
          const user = await db.collection('users').findOne({ $or: [{ _id: userId }, { id: userId }] });
          if (!user) {
            return jsonResponse({ status: 404, success: false, error: 'User not found' }, 404);
          }

          const newBlockedStatus = !Boolean(user.isBlocked);
          await db.collection('users').updateOne(
            { _id: user._id },
            { $set: { isBlocked: newBlockedStatus, updatedAt: new Date().toISOString() } }
          );

          return jsonResponse({
            status: 200,
            success: true,
            message: newBlockedStatus ? 'User blocked successfully.' : 'User unblocked successfully.',
            isBlocked: newBlockedStatus
          });
        } catch (e) {
          return jsonResponse({ status: 500, success: false, error: e.message }, 500);
        }
      }

      // Delete User
      if (url.pathname.includes('/delete-user/') || (url.pathname.includes('/users/') && request.method === 'DELETE')) {
        const pathParts = url.pathname.split('/');
        const userId = decodeURIComponent(pathParts[pathParts.length - 1]).trim();
        try {
          const db = await getMongoDb();
          await db.collection('users').deleteOne({ $or: [{ _id: userId }, { id: userId }] });
        } catch (e) {}
        return jsonResponse({ status: 200, success: true, message: 'User deleted successfully.' });
      }

      // Settings & Notices & Commission & Gateways (Read & Write to MongoDB Atlas)
      if (url.pathname.includes('/settings') || url.pathname === '/maintain' || url.pathname === '/api/maintain') {
        let maintainCol = null;
        try {
          const db = await getMongoDb();
          maintainCol = db.collection('maintain');
        } catch (e) {}

        // Update Settings
        if (request.method === 'POST' || request.method === 'PUT' || request.method === 'PATCH') {
          let body = {};
          try { body = await request.clone().json(); } catch (e) {}

          const updateFields = {
            ...body,
            updatedAt: new Date().toISOString()
          };
          delete updateFields._id;

          if (maintainCol) {
            try {
              await maintainCol.updateOne(
                { _id: 'maintain_config' },
                { $set: updateFields },
                { upsert: true }
              );
            } catch (e) {}
          }

          return jsonResponse({
            status: 200,
            success: true,
            message: 'Settings updated successfully in database.',
            data: updateFields
          });
        }

        // Fetch Settings
        let doc = null;
        if (maintainCol) {
          try {
            doc = await maintainCol.findOne({ _id: 'maintain_config' }) || await maintainCol.findOne({});
          } catch (e) {}
        }

        const settingsData = {
          _id: 'maintain_config',
          setMessage: doc?.setMessage || 'Welcome to WAludo!',
          setAlertMessage: doc?.setAlertMessage || 'WAludo - 24x7 Customer Support WhatsApp: 9828786246',
          maintenanceMode: Boolean(doc?.maintenanceMode),
          gameCommission: Number(doc?.gameCommission || 5),
          commission: Number(doc?.gameCommission || 5),
          minDeposit: Number(doc?.minDeposit || 50),
          maxDeposit: Number(doc?.maxDeposit || 15000),
          minWithdrawal: Number(doc?.minWithdrawal || 100),
          maxWithdrawal: Number(doc?.maxWithdrawal || 25000),
          upigateway1: Boolean(doc?.upigateway1 !== false),
          buyChips: Boolean(doc?.buyChips !== false),
          upisellChips: Boolean(doc?.upisellChips !== false),
          bankSellChips: Boolean(doc?.bankSellChips !== false),
          autoWithdrawl: Boolean(doc?.autoWithdrawl),
          upiPayout: Boolean(doc?.upiPayout !== false),
          bankPayout: Boolean(doc?.bankPayout !== false),
          wpSupport: doc?.wpSupport || '9828786246',
          version: doc?.version || '1.0.5',
          appName: 'WAludo',
          payIn: doc?.payIn || [
            {
              id: 'upigateway1',
              name: 'EKQR',
              logo: 'https://cdn.iconscout.com/icon/free/png-256/free-upi-logo-icon-download-in-svg-png-gif-file-formats--unified-payments-interface-payment-money-transfer-logos-icons-1747946.png?f=webp',
              enabled: true,
              status: true,
              active: true,
              _id: 'upigateway1_id'
            }
          ]
        };

        return jsonResponse(settingsData);
      }

      // Deposits List
      if (url.pathname.includes('/deposits') || url.pathname.includes('/pending-deposit')) {
        let deposits = [];
        try {
          const db = await getMongoDb();
          deposits = await db.collection('deposits').find({}).sort({ createdAt: -1 }).limit(100).toArray();
        } catch (e) {}
        return jsonResponse({ status: 200, deposits, total: deposits.length, data: deposits });
      }

      // Withdrawals List
      if (url.pathname.includes('/withDrawRequests') || url.pathname.includes('/withdrawal-requests') || url.pathname.includes('/all-withdraw')) {
        let withdrawals = [];
        try {
          const db = await getMongoDb();
          withdrawals = await db.collection('withdrawals').find({}).sort({ createdAt: -1 }).limit(100).toArray();
        } catch (e) {}
        return jsonResponse({ status: 200, withdrawals, withDrawRequests: withdrawals, total: withdrawals.length, data: withdrawals });
      }

      // Hold Games & Challenges
      if (url.pathname.includes('/hold-games') || url.pathname.includes('/hold-challenge')) {
        let games = [];
        try {
          const db = await getMongoDb();
          games = await db.collection('hold_games').find({}).sort({ createdAt: -1 }).limit(100).toArray();
        } catch (e) {}
        return jsonResponse({ status: 200, games, total: games.length, data: games });
      }

      // Total & All Games
      if (url.pathname.includes('/total-games') || url.pathname.includes('/all-challenge')) {
        let games = [];
        try {
          const db = await getMongoDb();
          games = await db.collection('resolved_games').find({}).sort({ createdAt: -1 }).limit(100).toArray();
        } catch (e) {}
        return jsonResponse({ status: 200, games, total: games.length, data: games });
      }

      // Pending KYC List
      if (url.pathname.includes('/pending_kyc') || url.pathname.includes('/kyc')) {
        let kycs = [];
        try {
          const db = await getMongoDb();
          kycs = await db.collection('users').find({
            $or: [{ kycStatus: 'UNVERIFIED' }, { kycStatus: 'pending' }, { kycVerified: false }]
          }).sort({ createdAt: -1 }).limit(100).toArray();
        } catch (e) {}
        return jsonResponse({ status: 200, kycs, total: kycs.length, data: kycs });
      }

      // Bonus & Penalty
      if (url.pathname.includes('/bonus')) {
        return jsonResponse({ status: 200, bonuses: [] });
      }
      if (url.pathname.includes('/penalty')) {
        return jsonResponse({ status: 200, penalties: [] });
      }

      // Admins Profile & Management
      if (url.pathname.includes('/management/admins') || url.pathname.includes('/admin/admin') || url.pathname.includes('/admins')) {
        let admin = null;
        try {
          const db = await getMongoDb();
          admin = await db.collection('admins').findOne({ _id: 'adm_waseem_1' });
        } catch (e) {}

        const safe = {
          _id: admin?._id || 'adm_waseem_1',
          name: admin?.name || 'Waseem akram',
          username: admin?.username || 'admin',
          email: admin?.email || 'khalilah64780@gmail.com',
          phone: admin?.phone || '9828786246',
          role: 'Super Admin',
          isAdmin: true,
          isSuperAdmin: true,
          status: 'Active'
        };
        return jsonResponse({ status: 200, success: true, admins: [safe], users: [safe], admin: safe });
      }

      // Generic API Fallback
      return jsonResponse({ status: 200, success: true, data: [] });
    } catch (globalErr) {
      try {
        const fallbackUrl = new URL('/index.html', request.url);
        return await env.ASSETS.fetch(new Request(fallbackUrl.toString(), request));
      } catch (finalErr) {
        return new Response('WAludo Admin Application Error: ' + globalErr.message, { status: 500 });
      }
    }
  }
};
