import { MongoClient } from 'mongodb';
import fs from 'fs';
import path from 'path';
import dns from 'dns';

// Fix Windows DNS SRV resolution for MongoDB Atlas cluster
try {
  if (process.platform === 'win32') {
    dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
    dns.setDefaultResultOrder('ipv4first');
  }
} catch (dnsErr) {}

const MONGODB_URI = process.env.MONGODB_URI || '';
const DB_NAME = process.env.DB_NAME || 'friendludo';
const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NOW_REGION);
const LOCAL_STORE_PATH = isServerless ? path.resolve('/tmp', 'db_store.json') : path.resolve(process.cwd(), 'scratch', 'db_store.json');

let client = null;
let db = null;
let isConnected = false;
let isConnecting = false;

// Default initial state for WAludo
const defaultStore = {
  users: [],
  holdGames: [],
  resolvedGames: [],
  deposits: [],
  withdrawals: [],
  kycs: [],
  merchantEkycs: [],
  bonuses: [],
  penalties: [],
  settings: {
    upiId: 'waludo@upi',
    imbClientId: process.env.IMB_CLIENT_ID || '',
    imbClientSecret: process.env.IMB_CLIENT_SECRET || '',
    imbMerchantCode: process.env.IMB_MERCHANT_CODE || '',
    imbAuthToken: process.env.IMB_AUTH_TOKEN || '',
    minDeposit: 50,
    maxDeposit: 15000,
    minWithdrawal: 100,
    maxWithdrawal: 25000,
    whatsappNumber: '+919828786246',
    telegramLink: 'https://t.me/WAludo',
    notice: 'Welcome to WAludo Admin & Player Portal. Instant 24x7 payouts.',
    maintenanceMode: false
  },
  admins: [
    {
      _id: 'adm_waseem_1',
      id: 'adm_waseem_1',
      name: process.env.SUPER_ADMIN_NAME || 'Waseem akram',
      Name: process.env.SUPER_ADMIN_NAME || 'Waseem akram',
      email: process.env.SUPER_ADMIN_EMAIL || 'khalilah64780@gmail.com',
      secondaryEmail: process.env.SUPER_ADMIN_EMAIL || 'khalilah64780@gmail.com',
      role: 'Super Admin',
      phone: process.env.SUPER_ADMIN_PHONE || '9828786246',
      secondaryPhone: '8076214367',
      password: process.env.SUPER_ADMIN_PASSWORD || 'Mdwa@98.',
      status: 'Active',
      isAdmin: true,
      isSuperAdmin: true
    }
  ],
  maintain: {
    _id: 'maintain_config',
    ConvertChips: true,
    LogoutButton: true,
    autoWithdrawl: false,
    bankPayout: true,
    bankSellChips: true,
    buyChips: true,
    cyrusBankPayout: false,
    cyrusUpiPayout: false,
    firebase: true,
    maintenanceMode: false,
    manualKyc: false,
    payout: 'mypay3',
    playPage: false,
    playerPlaying: false,
    registration: false,
    requestedChallenge: false,
    rezorPayBankPayout: false,
    rezorPayUpiPayout: false,
    setAlertMessage: 'WAludo - 24x7 Customer Support WhatsApp: 9828786246',
    setChallenge: false,
    setMessage: 'Welcome to WAludo!',
    spinner: true,
    upiPayout: true,
    upisellChips: true,
    version: '1.0.5',
    wpSupport: '9828786246',
    bankAccountThreshold: 3000,
    maxSellAmount: 50000,
    minSellAmount: 195,
    upiMaxAmount: 3000,
    useNewSellPage: false,
    payIn: [
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
  }
};

let store = JSON.parse(JSON.stringify(defaultStore));
let lastDbSync = null;

// Initialize store from local file store fallback if present
try {
  if (fs.existsSync(LOCAL_STORE_PATH)) {
    const fileData = fs.readFileSync(LOCAL_STORE_PATH, 'utf8');
    const parsed = JSON.parse(fileData);
    if (parsed && typeof parsed === 'object') {
      store = {
        ...store,
        ...parsed,
        settings: { ...store.settings, ...(parsed.settings || {}) },
        maintain: { ...store.maintain, ...(parsed.maintain || {}) }
      };
      console.log('[Local Disk Cache] Pre-loaded memory store from disk cache.');
    }
  }
} catch (e) {
  console.warn('[Local Disk Cache Notice]:', e.message);
}

function isValidMongoUri(uri) {
  if (!uri || typeof uri !== 'string') return false;
  const trimmed = uri.trim();
  if (!trimmed.startsWith('mongodb://') && !trimmed.startsWith('mongodb+srv://')) return false;
  if (trimmed.includes('<username>') || trimmed.includes('<password>')) return false;
  if (trimmed.includes('%3Cusername%3E') || trimmed.includes('%3Cpassword%3E')) return false;
  if (trimmed.includes('<user>') || trimmed.includes('<pass>')) return false;
  return true;
}

export async function connectMongo() {
  if (isConnected && db) return db;
  if (!isValidMongoUri(MONGODB_URI)) {
    console.info('[Database] Running high-performance in-memory store with disk persistence (MongoDB URI not configured or contains placeholder credentials).');
    return null;
  }
  if (isConnecting) return null;
  isConnecting = true;
  try {
    client = new MongoClient(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
      maxPoolSize: 10,
      minPoolSize: 1
    });
    await client.connect();
    db = client.db(DB_NAME);
    isConnected = true;
    lastDbSync = new Date().toISOString();
    console.info(`[MongoDB] Connected directly to database: "${DB_NAME}"`);

    // Ensure database indexes on native collections
    await createDatabaseIndexes().catch(() => {});

    // Load or initialize state from native MongoDB collections & app_state document
    await loadInitialStateFromDb().catch(() => {});

    return db;
  } catch (err) {
    console.info(`[Database Info]: MongoDB connection skipped (${err.message}). Running high-performance memory store with disk persistence.`);
    return null;
  } finally {
    isConnecting = false;
  }
}

async function createDatabaseIndexes() {
  if (!db) return;
  try {
    await db.collection('users').createIndex({ phone: 1 }, { unique: true, sparse: true });
    await db.collection('users').createIndex({ token: 1 }, { sparse: true });
    await db.collection('users').createIndex({ jwtToken: 1 }, { sparse: true });
    await db.collection('deposits').createIndex({ status: 1 });
    await db.collection('withdrawals').createIndex({ status: 1 });
    await db.collection('hold_games').createIndex({ status: 1 });
    await db.collection('resolved_games').createIndex({ status: 1 });
    await db.collection('kycs').createIndex({ status: 1 });
    console.log('[MongoDB] Verified collection indexes for users, deposits, withdrawals, games, and kycs.');
  } catch (err) {
    console.warn('[MongoDB Index Notice]:', err.message);
  }
}

async function loadInitialStateFromDb() {
  if (!db) return;
  try {
    const stateCol = db.collection('app_state');
    const existing = await stateCol.findOne({ _id: 'main_state' });
    if (existing && existing.data) {
      store = {
        ...defaultStore,
        ...existing.data,
        settings: { ...defaultStore.settings, ...existing.data.settings },
        maintain: { ...defaultStore.maintain, ...existing.data.maintain }
      };
    }

    // Read native collections if populated
    const usersList = await db.collection('users').find({}).toArray();
    if (usersList && usersList.length > 0) {
      store.users = usersList;
    }

    const depositsList = await db.collection('deposits').find({}).toArray();
    if (depositsList && depositsList.length > 0) {
      store.deposits = depositsList;
    }

    const withdrawalsList = await db.collection('withdrawals').find({}).toArray();
    if (withdrawalsList && withdrawalsList.length > 0) {
      store.withdrawals = withdrawalsList;
    }

    const holdGamesList = await db.collection('hold_games').find({}).toArray();
    if (holdGamesList && holdGamesList.length > 0) {
      store.holdGames = holdGamesList;
    }

    const resolvedGamesList = await db.collection('resolved_games').find({}).toArray();
    if (resolvedGamesList && resolvedGamesList.length > 0) {
      store.resolvedGames = resolvedGamesList;
    }

    const kycsList = await db.collection('kycs').find({}).toArray();
    if (kycsList && kycsList.length > 0) {
      store.kycs = kycsList;
    }

    const settingsDoc = await db.collection('settings').findOne({ _id: 'global_config' });
    if (settingsDoc) {
      const { _id, updatedAt, ...sData } = settingsDoc;
      store.settings = { ...store.settings, ...sData };
    }

    const maintainDoc = await db.collection('maintain').findOne({ _id: 'maintain_config' });
    if (maintainDoc) {
      const { _id, updatedAt, ...mData } = maintainDoc;
      store.maintain = { ...store.maintain, ...mData };
    }

    // Preserve maintain settings as loaded without forcing defaults
    store.maintain = {
      ...defaultStore.maintain,
      ...store.maintain
    };

    const adminsList = await db.collection('admins').find({}).toArray();
    if (adminsList && Array.isArray(adminsList) && adminsList.length > 0) {
      store.admins = adminsList;
    } else {
      const defaultAdmin = defaultStore.admins[0];
      await db.collection('admins').updateOne({ _id: defaultAdmin._id }, { $set: defaultAdmin }, { upsert: true });
      store.admins = [defaultAdmin];
    }

    console.log(`[MongoDB] Loaded native collections: ${store.users.length} users, ${store.deposits.length} deposits, ${store.withdrawals.length} withdrawals, ${store.admins.length} admins.`);
  } catch (err) {
    console.warn('[MongoDB Load State Error]:', err.message);
  }
}

// Sync documents into individual MongoDB collections
export async function syncNativeCollections() {
  if (!isConnected || !db) return;
  try {
    // 1. Sync users batch
    if (store.users && store.users.length > 0) {
      const usersCol = db.collection('users');
      const ops = store.users.map(u => {
        const id = u._id || u.id;
        return {
          updateOne: {
            filter: { _id: id },
            update: { $set: { ...u, updatedAt: new Date() } },
            upsert: true
          }
        };
      });
      if (ops.length > 0) await usersCol.bulkWrite(ops, { ordered: false });
    }

    // 2. Sync deposits batch
    if (store.deposits && store.deposits.length > 0) {
      const depCol = db.collection('deposits');
      const ops = store.deposits.map(d => ({
        updateOne: {
          filter: { _id: d._id || d.id },
          update: { $set: { ...d, updatedAt: new Date() } },
          upsert: true
        }
      }));
      if (ops.length > 0) await depCol.bulkWrite(ops, { ordered: false });
    }

    // 3. Sync withdrawals batch
    if (store.withdrawals && store.withdrawals.length > 0) {
      const wCol = db.collection('withdrawals');
      const ops = store.withdrawals.map(w => ({
        updateOne: {
          filter: { _id: w._id || w.id },
          update: { $set: { ...w, updatedAt: new Date() } },
          upsert: true
        }
      }));
      if (ops.length > 0) await wCol.bulkWrite(ops, { ordered: false });
    }

    // 4. Sync hold games batch & cleanup resolved games from hold_games collection
    if (store.holdGames && store.holdGames.length > 0) {
      const gCol = db.collection('hold_games');
      const ops = store.holdGames.map(g => ({
        updateOne: {
          filter: { _id: g._id || g.id },
          update: { $set: { ...g, updatedAt: new Date() } },
          upsert: true
        }
      }));
      if (ops.length > 0) await gCol.bulkWrite(ops, { ordered: false });
    }

    // Cleanup finished/resolved games from native hold_games collection
    if (store.resolvedGames && store.resolvedGames.length > 0) {
      const resolvedIds = store.resolvedGames.map(r => r._id || r.id).filter(Boolean);
      if (resolvedIds.length > 0) {
        await db.collection('hold_games').deleteMany({
          $or: [
            { _id: { $in: resolvedIds } },
            { id: { $in: resolvedIds } }
          ]
        }).catch(() => {});
      }
    }

    // 5. Sync resolved games batch
    if (store.resolvedGames && store.resolvedGames.length > 0) {
      const gCol = db.collection('resolved_games');
      const ops = store.resolvedGames.map(g => ({
        updateOne: {
          filter: { _id: g._id || g.id },
          update: { $set: { ...g, updatedAt: new Date() } },
          upsert: true
        }
      }));
      if (ops.length > 0) await gCol.bulkWrite(ops, { ordered: false });
    }

    // 6. Sync KYCs batch
    if (store.kycs && store.kycs.length > 0) {
      const kCol = db.collection('kycs');
      const ops = store.kycs.map(k => ({
        updateOne: {
          filter: { _id: k._id || k.id },
          update: { $set: { ...k, updatedAt: new Date() } },
          upsert: true
        }
      }));
      if (ops.length > 0) await kCol.bulkWrite(ops, { ordered: false });
    }

    // 7. Sync settings & maintain
    if (store.settings) {
      await db.collection('settings').updateOne({ _id: 'global_config' }, { $set: { ...store.settings, updatedAt: new Date() } }, { upsert: true });
    }
    if (store.maintain) {
      await db.collection('maintain').updateOne({ _id: 'maintain_config' }, { $set: { ...store.maintain, updatedAt: new Date() } }, { upsert: true });
    }
    lastDbSync = new Date().toISOString();
  } catch (syncErr) {
    console.warn('[MongoDB] Collection background sync notice:', syncErr.message);
  }
}

// Persist mutations directly to MongoDB & Local Cache
export async function saveState() {
  try {
    const dir = path.dirname(LOCAL_STORE_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(LOCAL_STORE_PATH, JSON.stringify({
      users: store.users,
      settings: store.settings,
      maintain: store.maintain,
      admins: store.admins,
      deposits: store.deposits,
      withdrawals: store.withdrawals,
      holdGames: store.holdGames,
      resolvedGames: store.resolvedGames,
      kycs: store.kycs,
      bonuses: store.bonuses,
      penalties: store.penalties
    }, null, 2));
  } catch (fileErr) {
    console.warn('[Local Disk Storage Notice]:', fileErr.message);
  }

  if (isConnected && db) {
    try {
      const stateCol = db.collection('app_state');
      const payload = {
        users: store.users.slice(0, 500),
        settings: store.settings,
        maintain: store.maintain,
        admins: store.admins
      };
      await stateCol.updateOne(
        { _id: 'main_state' },
        { $set: { data: payload, updatedAt: new Date() } },
        { upsert: true }
      );
      lastDbSync = new Date().toISOString();
      await syncNativeCollections().catch(() => {});
    } catch (err) {
      console.error('[MongoDB] State sync error:', err.message);
    }
  }
}

// Atomic User Wallet Increment Helper
export async function atomicUpdateUserWallet(userId, deltaAmount, field = 'depositCash') {
  const amount = Number(deltaAmount);
  if (isNaN(amount)) return null;

  const targetUser = store.users.find(u => u._id === userId || u.id === userId);
  if (targetUser) {
    const targetField = field || 'depositCash';
    const currentVal = Number(targetUser[targetField] ?? (targetField === 'depositCash' ? targetUser.cash : targetField === 'winningAmount' ? targetUser.winningCash : 0) ?? 0);
    const newVal = Math.max(0, currentVal + amount);

    targetUser[targetField] = newVal;
    if (targetField === 'depositCash' || targetField === 'Wallet' || targetField === 'wallet') {
      targetUser.depositCash = newVal;
      targetUser.cash = newVal;
    }
    if (targetField === 'cash') {
      targetUser.cash = newVal;
      targetUser.depositCash = newVal;
    }
    if (targetField === 'winningAmount') {
      targetUser.winningAmount = newVal;
      targetUser.winningCash = newVal;
    }
    if (targetField === 'winningCash') {
      targetUser.winningCash = newVal;
      targetUser.winningAmount = newVal;
    }
    if (targetField === 'bonus') {
      targetUser.bonus = newVal;
    }

    const dep = Number(targetUser.depositCash ?? targetUser.cash ?? 0);
    const win = Number(targetUser.winningAmount ?? targetUser.winningCash ?? 0);
    const bon = Number(targetUser.bonus ?? 0);
    const total = dep + win + bon;

    targetUser.Wallet = total;
    targetUser.wallet = total;
    targetUser.totalBalance = total;

    if (!Array.isArray(targetUser.history)) targetUser.history = [];
    targetUser.history.unshift({
      _id: 'txn_adm_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      id: 'txn_adm_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      type: amount >= 0 ? 'Admin Wallet Credit' : 'Admin Wallet Debit',
      amount: Math.abs(amount),
      closingBalance: total,
      status: 'SUCCESS',
      createdAt: new Date().toISOString()
    });

    if (isConnected && db) {
      try {
        await db.collection('users').updateOne(
          { $or: [{ _id: userId }, { id: userId }] },
          {
            $set: {
              depositCash: targetUser.depositCash,
              cash: targetUser.cash,
              winningAmount: targetUser.winningAmount,
              winningCash: targetUser.winningCash,
              bonus: targetUser.bonus,
              Wallet: total,
              wallet: total,
              totalBalance: total,
              history: targetUser.history,
              updatedAt: new Date()
            }
          }
        );
      } catch (e) {
        console.error('[Atomic Wallet Update Mongo Error]:', e.message);
      }
    }
  }

  await saveState();
  return targetUser;
}

export async function deleteUserFromDbAndStore(userId) {
  if (!userId) return { success: false, message: 'User ID is required' };

  const initialCount = store.users?.length || 0;
  store.users = (store.users || []).filter(u => u._id !== userId && u.id !== userId);
  const deletedCount = initialCount - store.users.length;

  if (db && isConnected) {
    try {
      await db.collection('users').deleteOne({
        $or: [{ _id: userId }, { id: userId }]
      });
      console.log(`[MongoDB] Permanently deleted user ${userId} from MongoDB users collection.`);
    } catch (err) {
      console.error('[MongoDB User Delete Error]:', err.message);
    }
  }

  await saveState();
  return { success: true, deletedCount, userId };
}

export async function deleteAllUsersFromDbAndStore() {
  const previousCount = store.users?.length || 0;
  store.users = [];
  if (db && isConnected) {
    try {
      await db.collection('users').deleteMany({});
      await db.collection('app_state').updateOne(
        { _id: 'main_state' },
        { $set: { 'data.users': [], updatedAt: new Date().toISOString() } },
        { upsert: true }
      );
      console.log(`[MongoDB] Purged all ${previousCount} users from MongoDB users collection.`);
    } catch (err) {
      console.error('[MongoDB User Purge Error]:', err.message);
    }
  }
  await saveState();
  return { deletedCount: previousCount, success: true };
}

export function getStore() {
  return store;
}

export function getDb() {
  return db;
}

export function getDbStatus() {
  return {
    connected: isConnected,
    database: DB_NAME,
    cluster: 'cluster0.ubtmliq.mongodb.net',
    lastSync: lastDbSync || new Date().toISOString(),
    records: {
      usersCount: store.users?.length || 0,
      holdGamesCount: store.holdGames?.length || 0,
      resolvedGamesCount: store.resolvedGames?.length || 0,
      depositsCount: store.deposits?.length || 0,
      withdrawalsCount: store.withdrawals?.length || 0,
      adminsCount: store.admins?.length || 1
    }
  };
}
