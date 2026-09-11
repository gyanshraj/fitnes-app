const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { DatabaseSync } = require('node:sqlite');

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;
const DATA_FILE = path.join(ROOT, 'data.json');
const SCHEMA_FILE = path.join(ROOT, 'schema.sql');
const DB_FILE = process.env.DATABASE_FILE || path.join(ROOT, 'vah-health.db');
const sessions = new Map();
let lastRedistributionDate = null;

const database = new DatabaseSync(DB_FILE);
database.exec('PRAGMA journal_mode = WAL');
database.exec(fs.readFileSync(SCHEMA_FILE, 'utf8'));

function syncWorkoutLogs(user) {
  const logs = Array.isArray(user.state?.logs) ? user.state.logs : [];
  database.prepare('DELETE FROM workout_logs WHERE user_email = ?').run(user.email);
  const insert = database.prepare(`
    INSERT INTO workout_logs (id, user_email, workout_date, duration_minutes, workout_type)
    VALUES (?, ?, ?, ?, ?)
  `);

  logs.forEach((log, index) => {
    insert.run(
      String(log.id || `${user.email}-${index}`),
      user.email,
      String(log.date || ''),
      Number(log.workoutMins) || 0,
      String(log.workoutType || 'General Workout')
    );
  });
}

function migrateJsonDatabase() {
  const userCount = database.prepare('SELECT COUNT(*) AS count FROM users').get().count;
  if (userCount > 0 || !fs.existsSync(DATA_FILE)) return;

  try {
    const legacy = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    const insert = database.prepare(`
      INSERT OR IGNORE INTO users (email, name, password_hash, state_json)
      VALUES (@email, @name, @passwordHash, @state)
    `);
    for (const user of Object.values(legacy.users || {})) {
      insert.run({
        email: user.email,
        name: user.name,
        passwordHash: user.passwordHash,
        state: user.state ? JSON.stringify(user.state) : null
      });
      syncWorkoutLogs(user);
    }
    console.log('Imported existing users from data.json into SQLite.');
  } catch (error) {
    console.error('Could not migrate data.json:', error.message);
  }
}

migrateJsonDatabase();

function getUser(email) {
  const row = database.prepare('SELECT email, name, password_hash, state_json FROM users WHERE email = ?').get(email);
  if (!row) return null;
  return {
    email: row.email,
    name: row.name,
    passwordHash: row.password_hash,
    state: row.state_json ? JSON.parse(row.state_json) : null
  };
}

function saveUser(user) {
  database.prepare(`
    INSERT INTO users (email, name, password_hash, state_json)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(email) DO UPDATE SET
      name = excluded.name,
      password_hash = excluded.password_hash,
      state_json = excluded.state_json
  `).run(user.email, user.name, user.passwordHash, user.state ? JSON.stringify(user.state) : null);
  syncWorkoutLogs(user);
}

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function createToken() {
  return crypto.randomBytes(32).toString('hex');
}

function sendJson(response, status, payload) {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store, no-cache, must-revalidate',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS'
  });
  response.end(JSON.stringify(payload));
}

function getBody(request) {
  return new Promise((resolve, reject) => {
    let body = '';
    request.on('data', chunk => { body += chunk; });
    request.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(new Error('Request body must be valid JSON'));
      }
    });
    request.on('error', reject);
  });
}

function authenticatedUser(request) {
  const authHeader = request.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  const email = sessions.get(token);
  return email ? getUser(email) : null;
}

function userResponse(user) {
  return { name: user.name, email: user.email };
}
function getTodayKey() {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${today.getFullYear()}-${month}-${day}`;
}

function isTodayLog(log) {
  return log.dateKey === getTodayKey() || String(log.date || '').toLowerCase().startsWith('today');
}

// ---------------------------------------------------------------
// Leaderboard Reward Redistribution Engine
// ---------------------------------------------------------------

function getTodayDateKey() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

function calculateRewardAdjustment(rank, totalUsers) {
  if (totalUsers < 2) return 0;

  const topCutoff = Math.max(1, Math.floor(totalUsers * 0.25));
  const bottomStart = totalUsers - Math.max(1, Math.floor(totalUsers * 0.25)) + 1;

  if (rank <= topCutoff) {
    // Top 25%: earn ₹5–15 bonus, scaled by how high the rank is
    const maxBonus = 15;
    const minBonus = 5;
    const positionRatio = topCutoff > 1 ? (topCutoff - rank) / (topCutoff - 1) : 1;
    return Math.round(minBonus + positionRatio * (maxBonus - minBonus));
  }

  if (rank >= bottomStart) {
    // Bottom 25%: mild deduction ₹5–15, scaled by how low the rank is
    const maxPenalty = 15;
    const minPenalty = 5;
    const bottomCount = totalUsers - bottomStart + 1;
    const positionInBottom = rank - bottomStart;
    const positionRatio = bottomCount > 1 ? positionInBottom / (bottomCount - 1) : 0;
    return -Math.round(minPenalty + positionRatio * (maxPenalty - minPenalty));
  }

  // Middle 50%: no adjustment
  return 0;
}

function redistributeRewards() {
  const todayKey = getTodayDateKey();

  // Only run once per calendar day
  if (lastRedistributionDate === todayKey) return;

  // Check if already recorded in database for today
  const existing = database.prepare(
    'SELECT COUNT(*) AS count FROM reward_history WHERE adjustment_date = ?'
  ).get(todayKey);
  if (existing.count > 0) {
    lastRedistributionDate = todayKey;
    return;
  }

  // Load all users and rank them
  const allUsers = database.prepare('SELECT email, name, state_json FROM users').all();
  const ranked = allUsers.map(user => {
    const state = user.state_json ? JSON.parse(user.state_json) : {};
    const logs = Array.isArray(state.logs) ? state.logs : [];
    const depositAmount = Number(state.depositAmount) || 0;
    const escrowLocked = Number(state.escrowLocked) || 0;
    const todayLog = logs.find(isTodayLog) || null;
    const verifiedDays = logs.filter(log => log.proofStatus === 'verified').length;
    const goalPercent = logs.length
      ? Math.round(logs.reduce((total, log) => total + (Number(log.goalPercent) || 0), 0) / logs.length)
      : 0;
    const averageSteps = logs.length
      ? Math.round(logs.reduce((total, log) => total + (Number(log.steps) || 0), 0) / logs.length)
      : 0;
    const todaySteps = todayLog ? Number(todayLog.steps) || 0 : 0;
    const todayGoalPercent = todayLog ? Number(todayLog.goalPercent) || 0 : 0;
    const lastUpdated = logs.reduce((latest, log) => {
      const timestamp = Date.parse(log.proofTimestamp || log.date || '') || 0;
      return Math.max(latest, timestamp);
    }, 0);

    return { email: user.email, state, depositAmount, escrowLocked, todaySteps, todayGoalPercent, verifiedDays, goalPercent, averageSteps, lastUpdated };
  }).sort((a, b) => {
    if (b.todaySteps !== a.todaySteps) return b.todaySteps - a.todaySteps;
    if (b.todayGoalPercent !== a.todayGoalPercent) return b.todayGoalPercent - a.todayGoalPercent;
    if (b.verifiedDays !== a.verifiedDays) return b.verifiedDays - a.verifiedDays;
    if (b.goalPercent !== a.goalPercent) return b.goalPercent - a.goalPercent;
    if (b.averageSteps !== a.averageSteps) return b.averageSteps - a.averageSteps;
    return b.lastUpdated - a.lastUpdated;
  });

  // Filter to only users with deposits for redistribution
  const eligibleUsers = ranked.filter(u => u.depositAmount > 0);
  if (eligibleUsers.length < 2) {
    lastRedistributionDate = todayKey;
    return;
  }

  const totalEligible = eligibleUsers.length;
  const insertHistory = database.prepare(
    'INSERT INTO reward_history (user_email, adjustment_date, amount, rank, total_users) VALUES (?, ?, ?, ?, ?)'
  );

  eligibleUsers.forEach((user, index) => {
    const rank = index + 1;
    let adjustment = calculateRewardAdjustment(rank, totalEligible);

    // For deductions: don't push escrow below 0
    if (adjustment < 0) {
      adjustment = Math.max(adjustment, -user.escrowLocked);
    }

    if (adjustment === 0) {
      insertHistory.run(user.email, todayKey, 0, rank, totalEligible);
      return;
    }

    // Apply the adjustment to the user's state
    const updatedState = { ...user.state };
    if (adjustment > 0) {
      // Bonus: increase unlocked refund
      updatedState.unlockedRefund = (Number(updatedState.unlockedRefund) || 0) + adjustment;
    } else {
      // Deduction: decrease from escrow locked, add to a penalty tracker
      updatedState.escrowLocked = Math.max(0, (Number(updatedState.escrowLocked) || 0) + adjustment);
    }
    updatedState.lastRewardAdjustment = adjustment;
    updatedState.lastRewardDate = todayKey;

    // Save updated state
    database.prepare(
      'UPDATE users SET state_json = ? WHERE email = ?'
    ).run(JSON.stringify(updatedState), user.email);

    // Record in history
    insertHistory.run(user.email, todayKey, adjustment, rank, totalEligible);
  });

  lastRedistributionDate = todayKey;
  console.log(`Reward redistribution completed for ${todayKey} (${totalEligible} eligible users).`);
}

function getTodayRewardForUser(email) {
  const todayKey = getTodayDateKey();
  const row = database.prepare(
    'SELECT amount FROM reward_history WHERE user_email = ? AND adjustment_date = ? LIMIT 1'
  ).get(email, todayKey);
  return row ? row.amount : 0;
}

function leaderboardResponse(currentUserEmail) {
  // Trigger daily redistribution if it hasn't run yet today
  redistributeRewards();

  const users = database.prepare('SELECT email, name, state_json FROM users').all();
  return users.map(user => {
    const state = user.state_json ? JSON.parse(user.state_json) : {};
    const logs = Array.isArray(state.logs) ? state.logs : [];
    const todayLog = logs.find(isTodayLog) || null;
    const verifiedDays = logs.filter(log => log.proofStatus === 'verified').length;
    const depositAmount = Number(state.depositAmount) || 0;
    const goalPercent = logs.length
      ? Math.round(logs.reduce((total, log) => total + (Number(log.goalPercent) || 0), 0) / logs.length)
      : 0;
    const averageSteps = logs.length
      ? Math.round(logs.reduce((total, log) => total + (Number(log.steps) || 0), 0) / logs.length)
      : 0;

    return {
      name: user.name,
      daysLogged: logs.length,
      verifiedDays,
      goalPercent,
      averageSteps,
      today: todayLog ? {
        steps: Number(todayLog.steps) || 0,
        workout: String(todayLog.workoutType || 'Workout recorded'),
        minutes: Number(todayLog.workoutMins) || 0,
        calories: Number(todayLog.calBurned) || 0,
        goalPercent: Number(todayLog.goalPercent) || 0,
        status: todayLog.proofStatus === 'verified' ? 'Verified' : 'Recorded'
      } : null,
      todaySteps: todayLog ? Number(todayLog.steps) || 0 : 0,
      rewardAdjustment: getTodayRewardForUser(user.email),
      hasDeposit: depositAmount > 0,
      lastUpdated: logs.reduce((latest, log) => {
        const timestamp = Date.parse(log.proofTimestamp || log.date || '') || 0;
        return Math.max(latest, timestamp);
      }, 0),
      isCurrentUser: user.email === currentUserEmail
    };
  }).sort((first, second) => {
    if (second.todaySteps !== first.todaySteps) return second.todaySteps - first.todaySteps;
    if ((second.today?.goalPercent || 0) !== (first.today?.goalPercent || 0)) {
      return (second.today?.goalPercent || 0) - (first.today?.goalPercent || 0);
    }
    if (second.verifiedDays !== first.verifiedDays) return second.verifiedDays - first.verifiedDays;
    if (second.goalPercent !== first.goalPercent) return second.goalPercent - first.goalPercent;
    if (second.averageSteps !== first.averageSteps) return second.averageSteps - first.averageSteps;
    return second.lastUpdated - first.lastUpdated;
  }).slice(2).map((user, index) => ({ ...user, rank: index + 1 }));
}

function handleApi(request, response, pathname) {
  if (request.method === 'POST' && (pathname === '/api/auth/register' || pathname === '/api/auth/login')) {
    return getBody(request).then(body => {
      const email = String(body.email || '').trim().toLowerCase();
      const password = String(body.password || '');
      if (!email || !password) return sendJson(response, 400, { error: 'Email and password are required.' });
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return sendJson(response, 400, { error: 'Enter a valid email address.' });
      }
      if (password.length < 8) {
        return sendJson(response, 400, { error: 'Password must be at least 8 characters.' });
      }

      const existing = getUser(email);
      if (pathname.endsWith('/register')) {
        if (existing) return sendJson(response, 409, { error: 'An account with this email already exists.' });
        if (!String(body.name || '').trim()) return sendJson(response, 400, { error: 'Full name is required.' });
        const newUser = {
          name: String(body.name || 'Alex Patel').trim() + ' (Student)',
          email,
          passwordHash: hashPassword(password),
          state: null
        };
        saveUser(newUser);
      } else {
        if (!existing || existing.passwordHash !== hashPassword(password)) {
          return sendJson(response, 401, { error: 'Invalid email or password.' });
        }
      }

      const user = getUser(email);
      const token = createToken();
      sessions.set(token, email);
      return sendJson(response, 200, { token, user: userResponse(user), state: user.state });
    }).catch(error => sendJson(response, 400, { error: error.message }));
  }

  if (request.method === 'GET' && pathname === '/api/state') {
    const user = authenticatedUser(request);
    if (!user) return sendJson(response, 401, { error: 'Authentication required.' });
    return sendJson(response, 200, { state: user.state });
  }

  if (request.method === 'GET' && pathname === '/api/leaderboard') {
    const user = authenticatedUser(request);
    if (!user) return sendJson(response, 401, { error: 'Authentication required.' });
    const lb = leaderboardResponse(user.email);
    // After redistribution may have updated the current user's state, re-fetch it
    const freshUser = getUser(user.email);
    return sendJson(response, 200, {
      leaderboard: lb,
      updatedState: freshUser ? freshUser.state : null
    });
  }

  if (request.method === 'PUT' && pathname === '/api/state') {
    const user = authenticatedUser(request);
    if (!user) return sendJson(response, 401, { error: 'Authentication required.' });
    return getBody(request).then(body => {
      user.state = body.state || null;
      saveUser(user);
      sendJson(response, 200, { state: user.state });
    }).catch(error => sendJson(response, 400, { error: error.message }));
  }

  if (request.method === 'POST' && pathname === '/api/demo') {
    const email = 'demo@vah.health';
    let user = getUser(email);
    if (!user) {
      user = {
        name: 'Alex Patel (Student)',
        email,
        passwordHash: hashPassword(crypto.randomBytes(16).toString('hex')),
        state: null
      };
      saveUser(user);
    }
    const token = createToken();
    sessions.set(token, email);
    return sendJson(response, 200, { token, user: userResponse(user), state: user.state });
  }

  return sendJson(response, 404, { error: 'API route not found.' });
}

function serveStatic(request, response, pathname) {
  const requestedPath = pathname === '/' ? '/main.html' : pathname;
  const filePath = path.normalize(path.join(ROOT, requestedPath));
  if (!filePath.startsWith(ROOT)) return sendJson(response, 403, { error: 'Forbidden.' });

  fs.readFile(filePath, (error, content) => {
    if (error) {
      response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      return response.end('Not found');
    }
    const extension = path.extname(filePath);
    const contentTypes = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };
    response.writeHead(200, { 'Content-Type': contentTypes[extension] || 'application/octet-stream' });
    response.end(content);
  });
}

const server = http.createServer((request, response) => {
  const pathname = new URL(request.url, `http://${request.headers.host}`).pathname;
  if (request.method === 'OPTIONS' && pathname.startsWith('/api/')) {
    response.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS'
    });
    return response.end();
  }
  if (pathname.startsWith('/api/')) return handleApi(request, response, pathname);
  serveStatic(request, response, pathname);
});

server.listen(PORT, () => {
  console.log(`VAH Health is running at http://localhost:${PORT}`);
});
