/**
 * WAludo Cloudflare Worker - Autonomous Admin Edge Engine
 * - Brand: WAludo
 * - Full compatibility with React Admin Dashboard & RTK Query
 * - Direct SuperAdmin privileges without external dependencies
 * - Fix: All UI paths (/admin/dashboard, /admin/users, /) ALWAYS serve React HTML
 * - Only explicit API paths (/api/*, /v1/core-sys-ops/*, /waludo/*) serve JSON
 */

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

const SUPER_ADMIN = {
  _id: 'adm_waseem_1',
  id: 'adm_waseem_1',
  Name: 'Waseem akram',
  name: 'Waseem akram',
  email: 'khalilah64780@gmail.com',
  phone: '9828786246',
  role: 'Super Admin',
  status: 'Active',
  isAdmin: true,
  isSuperAdmin: true,
  permissions: [{ id: 'all' }]
};

export default {
  async fetch(request, env) {
    try {
      const url = new URL(request.url);

      // 1. Handle CORS preflight
      if (request.method === 'OPTIONS') {
        return new Response(null, {
          status: 204,
          headers: CORS_HEADERS
        });
      }

      // 2. Service Worker fallback
      if (url.pathname === '/service-worker.js' || url.pathname === '/sw.js') {
        return new Response('// Empty service worker\nself.addEventListener("fetch", () => {});', {
          headers: {
            'Content-Type': 'application/javascript; charset=utf-8',
            'Cache-Control': 'no-cache'
          }
        });
      }

      // 3. FRONTEND UI & STATIC ASSETS:
      // If the URL is NOT an explicit backend API endpoint, ALWAYS serve static assets or React index.html!
      const isApiRequest = url.pathname.startsWith('/api/') || 
                           url.pathname.startsWith('/v1/core-sys-ops') || 
                           url.pathname.startsWith('/waludo') || 
                           url.pathname === '/maintain' || 
                           url.pathname === '/version' ||
                           (request.headers.get('Accept') || '').includes('application/json');

      if (!isApiRequest) {
        // Try serving static asset directly (JS, CSS, images, or index.html)
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

        return new Response('WAludo Admin UI Loading...', {
          headers: { 'Content-Type': 'text/html; charset=utf-8' }
        });
      }

      // 4. BACKEND API PROXY (When env.BACKEND_API_URL is configured)
      const backendUrl = env?.BACKEND_API_URL || env?.WALUDO_BACKEND_URL;
      if (backendUrl) {
        const targetUrl = new URL(url.pathname + url.search, backendUrl);
        const newHeaders = new Headers(request.headers);
        newHeaders.set('Origin', url.origin);
        newHeaders.set('Referer', url.origin + '/');
        newHeaders.set('Host', new URL(backendUrl).host);

        const proxyReq = new Request(targetUrl.toString(), {
          method: request.method,
          headers: newHeaders,
          body: ['GET', 'HEAD'].includes(request.method) ? undefined : request.body,
          redirect: 'follow'
        });

        try {
          const res = await fetch(proxyReq);
          const resHeaders = new Headers(res.headers);
          resHeaders.set('Access-Control-Allow-Origin', '*');
          resHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
          resHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-auth-token, x-system-key');
          return new Response(res.body, { status: res.status, headers: resHeaders });
        } catch (e) {}
      }

      // 5. WAludo Autonomous Edge API Engine (Only invoked via AJAX/fetch from the UI)
      // Health / Status
      if (url.pathname.includes('/health') || url.pathname.includes('/waludo/status')) {
        return jsonResponse({
          status: 'online',
          brand: 'WAludo',
          appName: 'WAludo Admin Edge Engine',
          admin: SUPER_ADMIN,
          timestamp: new Date().toISOString()
        });
      }

      // Admin Login
      if (url.pathname.includes('/login') || url.pathname.includes('/auth/login')) {
        const token = 'waludo_admin_token_' + Date.now();
        return jsonResponse({
          status: 200,
          success: true,
          token,
          jwtToken: token,
          user: SUPER_ADMIN,
          data: 'Login successful'
        });
      }

      // Admin Dashboard Stats (AJAX)
      if (url.pathname.includes('/dashboard')) {
        return jsonResponse({
          totalUsers: 1,
          usersCount: 1,
          holdGames: 0,
          disputedGames: 0,
          pendingDeposits: 0,
          depositPendingCount: 0,
          pendingWithdrawals: 0,
          withdrawPendingCount: 0,
          totalGames: 0,
          gamesCount: 0,
          pendingKyc: 0,
          kycCount: 0,
          user: SUPER_ADMIN
        });
      }

      // Admin Customers & Users (AJAX)
      if (url.pathname.includes('/all-users') || url.pathname.includes('/users') || url.pathname.includes('/user-search')) {
        const userList = [
          {
            _id: 'usr_9828786246',
            id: 'usr_9828786246',
            Name: 'Waseem akram',
            name: 'Waseem akram',
            Phone: '9828786246',
            phone: '9828786246',
            Wallet: 1000,
            wallet: 1000,
            depositCash: 1000,
            winningAmount: 0,
            bonus: 0,
            status: 'Active',
            role: 'Super Admin',
            createdAt: '2026-10-26T12:00:00.000Z'
          }
        ];
        return jsonResponse({
          users: userList,
          total: userList.length,
          totalUsers: userList.length,
          data: userList
        });
      }

      // Single User Details (AJAX)
      if (url.pathname.includes('/admin/user/') || url.pathname.includes('/details/')) {
        return jsonResponse({
          success: true,
          user: {
            _id: 'usr_9828786246',
            id: 'usr_9828786246',
            Name: 'Waseem akram',
            name: 'Waseem akram',
            Phone: '9828786246',
            phone: '9828786246',
            Wallet: 1000,
            wallet: 1000,
            depositCash: 1000,
            winningAmount: 0,
            bonus: 0,
            status: 'Active'
          }
        });
      }

      // Deposits List (AJAX)
      if (url.pathname.includes('/deposits')) {
        return jsonResponse({ deposits: [], total: 0, data: [] });
      }

      // Withdrawals List (AJAX)
      if (url.pathname.includes('/withDrawRequests') || url.pathname.includes('/all-withdraw') || url.pathname.includes('/withdrawals')) {
        return jsonResponse({ withdrawals: [], withDrawRequests: [], total: 0, data: [] });
      }

      // Hold Games & Challenges (AJAX)
      if (url.pathname.includes('/hold-challenge') || url.pathname.includes('/HoldGamesSearch') || url.pathname.includes('/hold-games')) {
        return jsonResponse({ games: [], total: 0, data: [] });
      }

      // Total & All Challenges (AJAX)
      if (url.pathname.includes('/all-challenge') || url.pathname.includes('/challenge-search') || url.pathname.includes('/total-games')) {
        return jsonResponse({ games: [], total: 0, data: [] });
      }

      // KYC List (AJAX)
      if (url.pathname.includes('/kyc') || url.pathname.includes('/pending-kyc')) {
        return jsonResponse({ kycs: [], total: 0, data: [] });
      }

      // Bonus & Penalty (AJAX)
      if (url.pathname.includes('/bonus')) {
        return jsonResponse({ bonuses: [] });
      }
      if (url.pathname.includes('/penalty')) {
        return jsonResponse({ penalties: [] });
      }

      // Settings (AJAX)
      if (url.pathname.includes('/settings')) {
        return jsonResponse({
          settings: {
            upiId: 'waludo@upi',
            whatsappNumber: '+919828786246',
            telegramLink: 'https://t.me/WAludo',
            minDeposit: 50,
            maxDeposit: 15000,
            minWithdrawal: 100,
            maxWithdrawal: 25000,
            buyChips: true,
            upisellChips: true,
            bankSellChips: true,
            autoWithdrawl: false,
            upigateway1: true
          },
          maintain: {
            version: '1.0.5',
            appName: 'WAludo',
            wpSupport: '9828786246',
            setMessage: 'Welcome to WAludo!',
            setAlertMessage: 'WAludo - 24x7 Customer Support WhatsApp: 9828786246',
            maintenanceMode: false
          }
        });
      }

      // Maintain / Config (AJAX)
      if (url.pathname === '/maintain' || url.pathname === '/api/maintain') {
        return jsonResponse({
          version: '1.0.5',
          appName: 'WAludo',
          wpSupport: '9828786246',
          setMessage: 'Welcome to WAludo!',
          setAlertMessage: 'WAludo - 24x7 Customer Support WhatsApp: 9828786246',
          maintenanceMode: false
        });
      }

      // Version (AJAX)
      if (url.pathname === '/version' || url.pathname === '/api/version') {
        return jsonResponse({ version: '1.0.5', appName: 'WAludo' });
      }

      // Admins Management (AJAX)
      if (url.pathname.includes('/management/admins') || url.pathname.includes('/admins')) {
        return jsonResponse({
          success: true,
          admins: [SUPER_ADMIN],
          users: [SUPER_ADMIN]
        });
      }

      // Generic API Fallback
      return jsonResponse({ success: true, data: [] });
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
