/**
 * Friend Ludo API & Realtime Client
 * Demonstrates authenticated REST calls and Socket.IO protocol
 * extracted from friendludo.com bundle reverse-engineering.
 */

const https = require('https');

const BASE_API = 'https://apiv2.friendludo.com/api';
const SOCKET_URL = 'https://socketv2.friendludo.com/';

class FriendLudoClient {
  constructor(token = null, userId = null) {
    this.token = token;
    this.userId = userId;
  }

  setSession(token, userId) {
    this.token = token;
    this.userId = userId;
  }

  async request(endpoint, method = 'GET', body = null) {
    const url = new URL(endpoint.startsWith('http') ? endpoint : `${BASE_API}${endpoint}`);
    const headers = {
      'Content-Type': 'application/json',
    };
    if (this.token) {
      headers['Authorization'] = this.token;
    }

    return new Promise((resolve, reject) => {
      const req = https.request(url, {
        method,
        headers,
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(data) });
          } catch (e) {
            resolve({ status: res.statusCode, raw: data });
          }
        });
      });

      req.on('error', reject);
      if (body) {
        req.write(JSON.stringify(body));
      }
      req.end();
    });
  }

  // 1. Auth Methods
  async requestOtp(phone) {
    return this.request('/auth/OTP', 'POST', { phone });
  }

  async confirmOtp(phone, otp) {
    const res = await this.request('/auth/confirmOTP', 'POST', { phone, otp });
    if (res.data?.data?.jwtToken?.jwtToken) {
      this.setSession(res.data.data.jwtToken.jwtToken, res.data.data.userId);
    }
    return res;
  }

  // 2. User & Wallet
  async getProfile() {
    return this.request('/user/getUserProfileData', 'GET');
  }

  async getWallet() {
    return this.request('/transaction/wallet', 'GET');
  }

  // 3. Match Operations
  async concedeMatch(challengeId) {
    return this.request(`/challenges/loose/${challengeId}`, 'POST', { createdAt: new Date() });
  }

  // 4. Socket Helper Messages
  createChallengePayload(amount, username, mode = 'CLASSIC') {
    return JSON.stringify({
      type: 'create',
      payload: {
        amount,
        userId: this.userId,
        username,
        mode
      }
    });
  }

  setRoomCodePayload(challengeId, roomCode) {
    return JSON.stringify({
      type: 'setRoomCode',
      payload: {
        userId: this.userId,
        ChallengeId: challengeId,
        roomCode: String(roomCode)
      }
    });
  }

  getChallengePayload(challengeId) {
    return JSON.stringify({
      type: 'getChallengeByChallengeId',
      payload: {
        challengeId,
        userId: this.userId
      }
    });
  }
}

// Quick status test
if (require.main === module) {
  const client = new FriendLudoClient();
  console.log('Testing connection to Friend Ludo API (https://apiv2.friendludo.com/api)...');
  client.request('/version', 'GET')
    .then(res => {
      console.log('Version Endpoint Status:', res.status);
      console.log('Response:', res.data || res.raw);
    })
    .catch(err => {
      console.error('Request failed:', err.message);
    });
}

module.exports = FriendLudoClient;
