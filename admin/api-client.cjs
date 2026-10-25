/**
 * FriendLudo Admin Panel API Client
 * Usage:
 *   const { AdminClient } = require('./api-client.cjs');
 *   const client = new AdminClient('http://localhost:5002');
 *   await client.login('admin_username', 'admin_password');
 *   const dashboard = await client.getDashboard();
 */

const http = require('http');
const https = require('https');
const url = require('url');

class AdminClient {
  constructor(baseUrl = 'http://localhost:5002') {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.token = null;
  }

  setToken(token) {
    this.token = token;
  }

  async request(endpoint, options = {}) {
    const fullUrl = `${this.baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
    const parsed = url.parse(fullUrl);
    const isHttps = parsed.protocol === 'https:';
    const lib = isHttps ? https : http;

    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
      headers['x-auth-token'] = this.token;
      headers['x-system-key'] = this.token;
    }

    const body = options.body ? JSON.stringify(options.body) : null;

    return new Promise((resolve, reject) => {
      const req = lib.request({
        hostname: parsed.hostname,
        port: parsed.port || (isHttps ? 443 : 80),
        path: parsed.path,
        method: options.method || 'GET',
        headers
      }, (res) => {
        let raw = '';
        res.on('data', chunk => raw += chunk);
        res.on('end', () => {
          try {
            const json = JSON.parse(raw);
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve(json);
            } else {
              reject(new Error(`API Error [${res.statusCode}]: ${json.error || json.message || raw}`));
            }
          } catch (e) {
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve(raw);
            } else {
              reject(new Error(`HTTP ${res.statusCode}: ${raw}`));
            }
          }
        });
      });

      req.on('error', reject);
      if (body) req.write(body);
      req.end();
    });
  }

  // Authentication
  async login(username, password) {
    const res = await this.request('/api/admin/login', {
      method: 'POST',
      body: { username, password }
    });
    if (res.token) {
      this.token = res.token;
    }
    return res;
  }

  // Dashboard Stats
  async getDashboard() {
    return this.request('/api/admin/dashboard');
  }

  // User Management
  async getUsers(page = 1, search = '') {
    const q = search ? `?search=${encodeURIComponent(search)}&page=${page}` : `?page=${page}`;
    return this.request(`/api/admin/users${q}`);
  }

  async getUserDetails(userId) {
    return this.request(`/api/admin/details/${userId}`);
  }

  // Disputed / Hold Games
  async getHoldGames() {
    return this.request('/api/admin/hold-games');
  }

  async getGameDetails(gameId) {
    return this.request(`/api/admin/view-game/${gameId}`);
  }

  async resolveGame(gameId, winnerId, status = 'completed') {
    return this.request('/api/admin/update-challenge', {
      method: 'POST',
      body: {
        gameId,
        winnerId,
        status: winnerId === 'cancel' ? 'cancelled' : status
      }
    });
  }

  async getResolvedGames() {
    return this.request('/api/admin/resolved-games');
  }

  async getTotalGames() {
    return this.request('/api/admin/total-games');
  }

  // Withdrawals
  async getWithdrawalRequests() {
    return this.request('/api/admin/withdrawal-requests');
  }

  async processWithdrawal(withdrawalId, status = 'approved') {
    return this.request(`/api/admin/all-withdraw/${withdrawalId}`, {
      method: 'POST',
      body: { status }
    });
  }

  async getBankWithdrawals() {
    return this.request('/api/admin/bank-withdrawals');
  }

  async getSuccessfulWithdrawals() {
    return this.request('/api/admin/successful-withdrawls');
  }

  // Deposits
  async getDeposits() {
    return this.request('/api/admin/deposits');
  }

  async getPendingDeposits() {
    return this.request('/api/admin/pending-deposits');
  }

  // KYC
  async getPendingKyc() {
    return this.request('/api/admin/pending_kyc');
  }

  // System Settings
  async getSettings() {
    return this.request('/api/admin/settings');
  }

  async updateSettings(settings) {
    return this.request('/api/admin/settings', {
      method: 'POST',
      body: settings
    });
  }
}

module.exports = { AdminClient };

if (require.main === module) {
  console.log('FriendLudo Admin API Client initialized.');
  console.log('To test with credentials:');
  console.log('  const client = new AdminClient();');
  console.log('  await client.login("username", "password");');
}
