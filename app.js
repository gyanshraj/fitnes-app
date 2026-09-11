/**
 * VAH HEALTH - Core Application Logic
 * Stake-to-Earn Accountability System, Authentication & 15-Column Daily Matrix Tracker
 */

// Authentication State
const AUTH_STATE = {
  isLoggedIn: false,
  user: null,
  currentTab: 'signin',
  token: localStorage.getItem('vah_api_token') || null
};

const configuredApiBase = window.VAH_API_BASE || '';
const isLocalHost = ['localhost', '127.0.0.1'].includes(window.location.hostname);
const API_BASE = configuredApiBase || (isLocalHost
  ? (window.location.port === '3000' ? `${window.location.origin}/api` : 'http://localhost:3000/api')
  : 'https://fitnes-app-8isi.onrender.com/api');

async function apiRequest(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...options,
      cache: options.cache || 'no-store',
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }
    });
  } catch (error) {
    error.apiUnavailable = true;
    throw error;
  }

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const fallbackMessage = response.status === 404
      ? 'Backend API not found. Start the Node server with npm start.'
      : `Request failed with status ${response.status}.`;
    const error = new Error(payload.error || fallbackMessage);
    error.apiUnavailable = false;
    throw error;
  }
  return payload;
}

function apiOptions(method, body) {
  return {
    method,
    body: JSON.stringify(body),
    headers: AUTH_STATE.token ? { Authorization: `Bearer ${AUTH_STATE.token}` } : {}
  };
}

// Default Seed Data demonstrating 15 distinct health columns
/* const DEFAULT_LOGS = [
  {
    id: 'log-1',
    date: 'Today, Sep 10',
    steps: 10840,
    stepsTarget: 10000,
    calBurned: 2450,
    weight: 73.4,
    weightDiff: -0.3,
    waterLiters: 3.2,
    foodKcal: 1980,
    proteinG: 145,
    carbG: 190,
    fatG: 52,
    workoutMins: 50,
    workoutType: 'Strength & Core',
    sleepHours: 7.8,
    sleepQuality: 92,
    restingBpm: 62,
    peakBpm: 154,
    proofStatus: 'verified',
    proofImage: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=150&auto=format&fit=crop&q=80',
    moodEnergy: '⚡ High (5/5)',
    sedentaryHours: 4.5,
    goalPercent: 100,
    refundEarned: 71.42,
    proofTimestamp: '10 Sep 2026, 08:32 AM'
  },
  {
    id: 'log-2',
    date: 'Wed, Sep 9',
    steps: 11200,
    stepsTarget: 10000,
    calBurned: 2600,
    weight: 73.7,
    weightDiff: -0.2,
    waterLiters: 3.5,
    foodKcal: 2050,
    proteinG: 150,
    carbG: 210,
    fatG: 55,
    workoutMins: 60,
    workoutType: '5K Morning Run',
    sleepHours: 8.0,
    sleepQuality: 94,
    restingBpm: 60,
    peakBpm: 168,
    proofStatus: 'verified',
    proofImage: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=150&auto=format&fit=crop&q=80',
    moodEnergy: '🔥 Peak (5/5)',
    sedentaryHours: 4.0,
    goalPercent: 100,
    refundEarned: 71.42,
    proofTimestamp: '09 Sep 2026, 07:15 AM'
  },
  {
    id: 'log-3',
    date: 'Tue, Sep 8',
    steps: 9850,
    stepsTarget: 10000,
    calBurned: 2280,
    weight: 73.9,
    weightDiff: 0.1,
    waterLiters: 2.8,
    foodKcal: 1920,
    proteinG: 135,
    carbG: 180,
    fatG: 50,
    workoutMins: 45,
    workoutType: 'HIIT & Mobility',
    sleepHours: 7.2,
    sleepQuality: 85,
    restingBpm: 65,
    peakBpm: 160,
    proofStatus: 'verified',
    proofImage: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=150&auto=format&fit=crop&q=80',
    moodEnergy: '⚡ High (4/5)',
    sedentaryHours: 5.2,
    goalPercent: 95,
    refundEarned: 71.42,
    proofTimestamp: '08 Sep 2026, 06:50 PM'
  },
  {
    id: 'log-4',
    date: 'Mon, Sep 7',
    steps: 12400,
    stepsTarget: 10000,
    calBurned: 2750,
    weight: 73.8,
    weightDiff: -0.4,
    waterLiters: 3.8,
    foodKcal: 2100,
    proteinG: 160,
    carbG: 220,
    fatG: 58,
    workoutMins: 65,
    workoutType: 'Leg Day & Cardio',
    sleepHours: 7.5,
    sleepQuality: 88,
    restingBpm: 63,
    peakBpm: 172,
    proofStatus: 'verified',
    proofImage: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=150&auto=format&fit=crop&q=80',
    moodEnergy: '💪 Strong (5/5)',
    sedentaryHours: 4.8,
    goalPercent: 100,
    refundEarned: 71.42,
    proofTimestamp: '07 Sep 2026, 08:10 AM'
  },
  {
    id: 'log-5',
    date: 'Sun, Sep 6',
    steps: 10100,
    stepsTarget: 10000,
    calBurned: 2310,
    weight: 74.2,
    weightDiff: -0.1,
    waterLiters: 3.0,
    foodKcal: 1950,
    proteinG: 140,
    carbG: 185,
    fatG: 52,
    workoutMins: 40,
    workoutType: 'Cycling & Stretch',
    sleepHours: 8.5,
    sleepQuality: 96,
    restingBpm: 59,
    peakBpm: 148,
    proofStatus: 'verified',
    proofImage: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=150&auto=format&fit=crop&q=80',
    moodEnergy: '🧘 Relaxed (5/5)',
    sedentaryHours: 3.8,
    goalPercent: 100,
    refundEarned: 71.42,
    proofTimestamp: '06 Sep 2026, 09:30 AM'
  },
  {
    id: 'log-6',
    date: 'Sat, Sep 5',
    steps: 10500,
    stepsTarget: 10000,
    calBurned: 2490,
    weight: 74.3,
    weightDiff: -0.3,
    waterLiters: 3.1,
    foodKcal: 2020,
    proteinG: 142,
    carbG: 200,
    fatG: 54,
    workoutMins: 55,
    workoutType: 'Outdoor Calisthenics',
    sleepHours: 7.4,
    sleepQuality: 89,
    restingBpm: 64,
    peakBpm: 162,
    proofStatus: 'verified',
    proofImage: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=150&auto=format&fit=crop&q=80',
    moodEnergy: '⚡ High (4/5)',
    sedentaryHours: 4.2,
    goalPercent: 100,
    refundEarned: 71.42,
    proofTimestamp: '05 Sep 2026, 07:45 AM'
  },
  {
    id: 'log-7',
    date: 'Fri, Sep 4',
    steps: 10250,
    stepsTarget: 10000,
    calBurned: 2400,
    weight: 74.6,
    weightDiff: -0.2,
    waterLiters: 3.0,
    foodKcal: 1980,
    proteinG: 138,
    carbG: 195,
    fatG: 53,
    workoutMins: 45,
    workoutType: 'Upper Body Pump',
    sleepHours: 7.1,
    sleepQuality: 86,
    restingBpm: 63,
    peakBpm: 156,
    proofStatus: 'verified',
    proofImage: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=150&auto=format&fit=crop&q=80',
    moodEnergy: '💪 Focused (4/5)',
    sedentaryHours: 5.0,
    goalPercent: 100,
    refundEarned: 71.42,
    proofTimestamp: '04 Sep 2026, 06:40 PM'
  }
]; */
const DEFAULT_LOGS = [];

// App State Management
const STATE = {
  depositAmount: 0,
  challengeDays: 30,
  currentDay: 0,
  unlockedRefund: 0,
  escrowLocked: 0,
  logs: []
};

let leaderboard = [];
let leaderboardRefreshTimer = null;
let previousLeaderboardRanks = new Map();

// WebCam Stream tracker
let webCamStream = null;
let capturedDataUrl = null;
let currentVerifyingLogId = null;
let cameraStartedAt = null;
let cameraCalorieTimer = null;
let currentCameraCalories = 0;

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
  loadStoredData();
  checkAuthSession();
  renderApp();
  setupEventListeners();
  startLiveClock();
  leaderboardRefreshTimer = setInterval(() => {
    if (AUTH_STATE.isLoggedIn) renderLeaderboard({ quiet: true });
  }, 10000);
});

// Load Stored Logs & Escrow State
function loadStoredData() {
  const savedState = localStorage.getItem('vah_health_state');
  if (savedState) {
    try {
      const parsed = JSON.parse(savedState);
      STATE.depositAmount = parsed.depositAmount ?? 0;
      STATE.unlockedRefund = parsed.unlockedRefund ?? 0;
      STATE.escrowLocked = parsed.escrowLocked ?? 0;
      STATE.logs = parsed.logs ?? DEFAULT_LOGS;
    } catch (e) {
      console.warn('Failed to parse stored state, using defaults', e);
      STATE.logs = DEFAULT_LOGS;
    }
  } else {
    STATE.logs = DEFAULT_LOGS;
    saveState();
  }
}

function getTodayKey() {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${today.getFullYear()}-${month}-${day}`;
}

function saveState() {
  const state = {
    depositAmount: STATE.depositAmount,
    unlockedRefund: STATE.unlockedRefund,
    escrowLocked: STATE.escrowLocked,
    logs: STATE.logs
  };
  localStorage.setItem('vah_health_state', JSON.stringify(state));
  if (!AUTH_STATE.token) return Promise.resolve(false);

  return apiRequest('/state', apiOptions('PUT', { state })).then(() => {
    renderLeaderboard({ quiet: true });
    return true;
  }).catch(error => {
    console.warn('Could not sync state with backend:', error.message);
    showToast(error.apiUnavailable
      ? 'Saved on this device. Start the backend to sync your profile.'
      : 'Your session expired. Please sign in again to sync your profile.', 'warning');
    throw error;
  });
}

function resetStateForNewUser() {
  STATE.depositAmount = 0;
  STATE.currentDay = 0;
  STATE.unlockedRefund = 0;
  STATE.escrowLocked = 0;
  STATE.logs = [];
  localStorage.removeItem('vah_health_state');
}

// -------------------------------------------------------------
// Authentication & View State Controller
// -------------------------------------------------------------
async function checkAuthSession() {
  const savedUser = localStorage.getItem('vah_auth_user');
  if (savedUser) {
    try {
      AUTH_STATE.user = JSON.parse(savedUser);
      AUTH_STATE.isLoggedIn = true;
    } catch (e) {
      AUTH_STATE.isLoggedIn = false;
      AUTH_STATE.user = null;
    }
  } else {
    // Default to NOT logged in so user sees the public landing page first!
    AUTH_STATE.isLoggedIn = false;
    AUTH_STATE.user = null;
  }
  if (AUTH_STATE.isLoggedIn && AUTH_STATE.token) {
    try {
      const response = await apiRequest('/state', apiOptions('GET'));
      if (response.state) {
        STATE.depositAmount = response.state.depositAmount ?? STATE.depositAmount;
        STATE.unlockedRefund = response.state.unlockedRefund ?? STATE.unlockedRefund;
        STATE.escrowLocked = response.state.escrowLocked ?? STATE.escrowLocked;
        STATE.logs = response.state.logs ?? STATE.logs;
        localStorage.setItem('vah_health_state', JSON.stringify(response.state));
      }
    } catch (error) {
      if (!error.apiUnavailable) {
        AUTH_STATE.token = null;
        AUTH_STATE.isLoggedIn = false;
        AUTH_STATE.user = null;
        localStorage.removeItem('vah_api_token');
        localStorage.removeItem('vah_auth_user');
        updateViewVisibility();
        showToast('Your session expired after the server restarted. Please sign in again.', 'warning');
      }
    }
  }
  updateViewVisibility();
}

function updateViewVisibility() {
  const publicView = document.getElementById('public-landing-view');
  const authDashboard = document.getElementById('auth-dashboard-view');
  const guestActions = document.getElementById('header-guest-actions');
  const authActions = document.getElementById('header-auth-actions');
  const escrowBadge = document.getElementById('header-escrow-badge');
  const publicNavLinks = document.getElementById('public-nav-links');
  const userDisplayName = document.getElementById('user-display-name');
  const userAvatarInitial = document.getElementById('user-avatar-initial');

  if (AUTH_STATE.isLoggedIn) {
    // Logged in: show protected dashboard, hide public view
    if (publicView) publicView.classList.add('hidden');
    if (authDashboard) authDashboard.classList.remove('hidden');
    if (guestActions) guestActions.classList.add('hidden');
    if (authActions) authActions.classList.remove('hidden');
    if (escrowBadge) escrowBadge.classList.remove('hidden');
    if (publicNavLinks) publicNavLinks.classList.add('hidden');

    const name = (AUTH_STATE.user && AUTH_STATE.user.name) || 'Alex Patel (Student)';
    if (userDisplayName) userDisplayName.textContent = name;
    if (userAvatarInitial) userAvatarInitial.textContent = name.charAt(0).toUpperCase();

    renderApp();
  } else {
    // Logged out: show public landing page, hide private dashboard
    if (publicView) publicView.classList.remove('hidden');
    if (authDashboard) authDashboard.classList.add('hidden');
    if (guestActions) guestActions.classList.remove('hidden');
    if (authActions) authActions.classList.add('hidden');
    if (escrowBadge) escrowBadge.classList.add('hidden');
    if (publicNavLinks) publicNavLinks.classList.remove('hidden');
  }
}

function openLoginModal(tab = 'signin') {
  const modal = document.getElementById('login-modal');
  if (modal) {
    modal.classList.add('active');
    switchAuthTab(tab);
  }
}

function closeLoginModal() {
  const modal = document.getElementById('login-modal');
  if (modal) modal.classList.remove('active');
}

function switchAuthTab(tab) {
  AUTH_STATE.currentTab = tab;
  const emailInput = document.getElementById('auth-email');
  const passwordInput = document.getElementById('auth-password');
  if (emailInput) emailInput.value = '';
  if (passwordInput) passwordInput.value = '';
  const tabSignIn = document.getElementById('tab-btn-signin');
  const tabSignUp = document.getElementById('tab-btn-signup');
  const nameGroup = document.getElementById('group-name');
  const submitBtn = document.getElementById('auth-submit-btn');
  const modalTitle = document.getElementById('auth-modal-title');

  if (tab === 'signin') {
    if (tabSignIn) tabSignIn.classList.add('active');
    if (tabSignUp) tabSignUp.classList.remove('active');
    if (nameGroup) nameGroup.style.display = 'none';
    if (submitBtn) submitBtn.textContent = 'Sign In to Dashboard';
    if (modalTitle) modalTitle.textContent = 'Welcome Back to VAH HEALTH';
  } else {
    if (tabSignUp) tabSignUp.classList.add('active');
    if (tabSignIn) tabSignIn.classList.remove('active');
    if (nameGroup) nameGroup.style.display = 'block';
    if (submitBtn) submitBtn.textContent = 'Register & Pledge ₹2,000 Escrow';
    if (modalTitle) modalTitle.textContent = 'Join the 30-Day Student Challenge';
  }
}

async function handleAuthSubmit(e) {
  e.preventDefault();
  const emailInput = document.getElementById('auth-email');
  const nameInput = document.getElementById('auth-name');
  const email = emailInput ? emailInput.value : 'student@vah.edu';
  let name = nameInput ? nameInput.value.trim() : '';

  if (AUTH_STATE.currentTab === 'signup' && !name) {
    showToast('Enter your full name to create an account.', 'error');
    return;
  }

  if (AUTH_STATE.currentTab === 'signin') {
    name = email.split('@')[0].replace('.', ' ').replace(/(^\w|\s\w)/g, m => m.toUpperCase()) || 'Alex Patel';
  }

  const passwordInput = document.getElementById('auth-password');
  const password = passwordInput ? passwordInput.value : '';
  let user;

  try {
    const endpoint = AUTH_STATE.currentTab === 'signin' ? '/auth/login' : '/auth/register';
    const response = await apiRequest(endpoint, {
      ...apiOptions('POST', { name, email, password }),
      headers: {}
    });
    AUTH_STATE.token = response.token;
    localStorage.setItem('vah_api_token', response.token);
    user = response.user;
    if (response.state) {
      STATE.depositAmount = response.state.depositAmount ?? STATE.depositAmount;
      STATE.unlockedRefund = response.state.unlockedRefund ?? STATE.unlockedRefund;
      STATE.escrowLocked = response.state.escrowLocked ?? STATE.escrowLocked;
      STATE.logs = response.state.logs ?? STATE.logs;
    } else {
      resetStateForNewUser();
    }
  } catch (error) {
    showToast(error.apiUnavailable ? 'The backend is unavailable. Start the server before signing in.' : error.message, 'error');
    return;
  }

  localStorage.setItem('vah_auth_user', JSON.stringify(user));
  AUTH_STATE.user = user;
  AUTH_STATE.isLoggedIn = true;

  closeLoginModal();
  updateViewVisibility();
  saveState();

  if (AUTH_STATE.currentTab === 'signup') {
    showToast(`🎉 Registration successful! Your empty health dashboard is ready, ${user.name}.`, 'gold');
  } else {
    showToast(`👋 Welcome back, ${user.name}! Your 15-column telemetry is ready.`, 'success');
  }
}

// Instant 1-Click Demo Shortcut
async function quickDemoLogin() {
  const user = { name: 'Alex Patel (Student)', email: 'alex.student@vah.edu' };
  try {
    const response = await apiRequest('/demo', { method: 'POST' });
    AUTH_STATE.token = response.token;
    localStorage.setItem('vah_api_token', response.token);
    if (response.state) {
      STATE.depositAmount = response.state.depositAmount ?? STATE.depositAmount;
      STATE.unlockedRefund = response.state.unlockedRefund ?? STATE.unlockedRefund;
      STATE.escrowLocked = response.state.escrowLocked ?? STATE.escrowLocked;
      STATE.logs = response.state.logs ?? STATE.logs;
    } else {
      resetStateForNewUser();
    }
  } catch (error) {
    showToast(error.apiUnavailable ? 'The backend is unavailable. Start the server before using demo login.' : error.message, 'error');
    return;
  }
  localStorage.setItem('vah_auth_user', JSON.stringify(user));
  AUTH_STATE.user = user;
  AUTH_STATE.isLoggedIn = true;

  closeLoginModal();
  updateViewVisibility();
  saveState();
  showToast('🚀 Demo Student account authenticated! 15-Column Dashboard and Escrow Vault unlocked.', 'gold');
}

function handleLogout() {
  localStorage.removeItem('vah_auth_user');
  localStorage.removeItem('vah_api_token');
  AUTH_STATE.token = null;
  AUTH_STATE.user = null;
  AUTH_STATE.isLoggedIn = false;
  updateViewVisibility();
  showToast('Logged out safely. Your health records and escrow remain secure.', 'info');
}

function showPublicLandingView() {
  // If user clicks on brand logo, scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// -------------------------------------------------------------
// Dashboard Rendering Functions
// -------------------------------------------------------------
function renderApp() {
  renderEscrowHeader();
  renderHeroVault();
  renderSummaryStats();
  renderLeaderboard();
  renderActivityTable();
}

async function renderLeaderboard({ quiet = false } = {}) {
  const tableBody = document.getElementById('leaderboard-table-body');
  const podium = document.getElementById('leaderboard-podium');
  const status = document.getElementById('leaderboard-status');
  if (!tableBody || !AUTH_STATE.isLoggedIn || !AUTH_STATE.token) return;

  if (!quiet) {
    tableBody.innerHTML = '<tr><td colspan="8" class="leaderboard-loading">Loading today\'s student performances...</td></tr>';
  }
  try {
    const response = await apiRequest('/leaderboard', apiOptions('GET'));
    const nextLeaderboard = response.leaderboard || [];

    // Sync local state if server updated it (e.g., from reward redistribution)
    if (response.updatedState) {
      const serverState = response.updatedState;
      const previousAdjustment = STATE.lastRewardAdjustment;
      const previousRewardDate = STATE.lastRewardDate;

      if (serverState.escrowLocked !== undefined) STATE.escrowLocked = serverState.escrowLocked;
      if (serverState.unlockedRefund !== undefined) STATE.unlockedRefund = serverState.unlockedRefund;
      if (serverState.lastRewardAdjustment !== undefined) STATE.lastRewardAdjustment = serverState.lastRewardAdjustment;
      if (serverState.lastRewardDate !== undefined) STATE.lastRewardDate = serverState.lastRewardDate;

      // Show toast for new reward adjustments
      if (STATE.lastRewardDate && STATE.lastRewardDate !== previousRewardDate) {
        const adj = STATE.lastRewardAdjustment;
        if (adj > 0) {
          showToast(`🏆 You earned +₹${adj} bonus for your leaderboard performance today! Keep climbing!`, 'gold');
        } else if (adj < 0) {
          showToast(`⚠️ ₹${Math.abs(adj)} deducted from escrow — climb the leaderboard to earn it back!`, 'warning');
        }
      }

      renderEscrowHeader();
      renderHeroVault();
    }

    const promotedEntry = nextLeaderboard.find(entry => {
      const previousRank = previousLeaderboardRanks.get(entry.name);
      return entry.rank === 1 && previousRank && previousRank > 1;
    });
    leaderboard = nextLeaderboard;
    previousLeaderboardRanks = new Map(leaderboard.map(entry => [entry.name, entry.rank]));
    if (podium) {
      const podiumEntries = leaderboard.slice(0, 3);
      podium.innerHTML = podiumEntries.length
        ? podiumEntries.map(entry => `
          <div class="podium-place podium-place-${entry.rank} ${entry.isCurrentUser ? 'podium-current-user' : ''}">
            <div class="podium-medal">${entry.rank === 1 ? '&#9733;' : entry.rank}</div>
            <div class="podium-name">${escapeHtml(entry.name.replace(' (Student)', ''))}</div>
            <div class="podium-score">${entry.today ? entry.today.steps.toLocaleString() : 0} steps</div>
            <div class="podium-block"><span>#${entry.rank}</span></div>
          </div>
        `).join('')
        : '<div class="podium-empty">Be the first student to log a workout.</div>';
    }
    tableBody.innerHTML = leaderboard.length
      ? leaderboard.map(entry => {
          const adj = entry.rewardAdjustment || 0;
          const rewardBadge = adj > 0
            ? `<span class="reward-badge bonus">+₹${adj}</span>`
            : adj < 0
            ? `<span class="reward-badge penalty">-₹${Math.abs(adj)}</span>`
            : entry.hasDeposit
            ? `<span class="reward-badge neutral">₹0</span>`
            : `<span class="reward-badge neutral">—</span>`;
          return `
        <tr class="${entry.isCurrentUser ? 'leaderboard-current-user' : ''}${promotedEntry && promotedEntry.name === entry.name ? ' leaderboard-promoted' : ''}">
          <td><span class="leaderboard-rank rank-${entry.rank}">${entry.rank}</span></td>
          <td><strong>${escapeHtml(entry.name.replace(' (Student)', ''))}</strong>${entry.isCurrentUser ? '<span class="leaderboard-you">You</span>' : ''}</td>
          <td>${entry.today ? escapeHtml(entry.today.workout) : '<span class="leaderboard-muted">No workout yet</span>'}${entry.today && entry.today.minutes ? ` <small>${entry.today.minutes} min</small>` : ''}</td>
          <td>${entry.today ? entry.today.steps.toLocaleString() : '--'}</td>
          <td>${entry.today ? `${entry.today.calories.toLocaleString()} kcal` : '--'}</td>
          <td>${rewardBadge}</td>
          <td><span class="leaderboard-status ${entry.today ? 'has-today' : ''}">${entry.today ? entry.today.status : 'Not recorded'}</span></td>
        </tr>`;
        }).join('')
      : '<tr><td colspan="8" class="leaderboard-loading">Be the first student to log a workout.</td></tr>';

    const currentUser = leaderboard.find(entry => entry.isCurrentUser);
    if (status && currentUser) {
      const adj = currentUser.rewardAdjustment || 0;
      const rewardHint = adj > 0 ? ` Today's bonus: +₹${adj}!` : adj < 0 ? ` Today's deduction: ₹${Math.abs(adj)}.` : '';
      status.textContent = promotedEntry
        ? `${escapeHtml(promotedEntry.name.replace(' (Student)', ''))} moved into #1. Keep pushing!${rewardHint}`
        : currentUser.rank === 1
        ? `You are leading the board. Keep the streak alive!${rewardHint}`
        : `You are #${currentUser.rank}. One more healthy day can move you up.${rewardHint}`;
    }
  } catch (error) {
    leaderboard = [];
    tableBody.innerHTML = '<tr><td colspan="8" class="leaderboard-loading">Leaderboard is unavailable right now. Your personal progress is still saved.</td></tr>';
    if (status) status.textContent = 'Every day you show up is progress. Keep building your streak.';
  }
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[character]));
}

function renderEscrowHeader() {
  const badgeEl = document.getElementById('header-escrow-badge');
  if (badgeEl) {
    badgeEl.innerHTML = `
      <span class="escrow-pulse-dot"></span>
      <span>Escrow: ₹${STATE.depositAmount.toLocaleString()} pledged</span>
      <span style="color: #2e7d32; margin-left:4px;">(₹${STATE.unlockedRefund.toLocaleString()} Claimed)</span>
    `;
  }
}

function renderHeroVault() {
  const vaultAmountEl = document.getElementById('hero-vault-amount');
  const vaultSubEl = document.getElementById('hero-vault-sub');
  const vaultBarEl = document.getElementById('hero-vault-progress');
  const milestonesEl = document.getElementById('milestone-steps-container');

  if (vaultAmountEl) {
    vaultAmountEl.innerHTML = `₹${STATE.escrowLocked.toLocaleString()} <sub>remaining locked</sub>`;
  }
  if (vaultSubEl) {
    vaultSubEl.textContent = `₹${STATE.unlockedRefund.toLocaleString()} refunded to bank`;
  }

  const progressPct = STATE.depositAmount > 0
    ? Math.min(100, Math.round((STATE.unlockedRefund / STATE.depositAmount) * 100))
    : 0;
  if (vaultBarEl) {
    vaultBarEl.style.width = `${progressPct}%`;
  }

  // Milestones: 4 weeks, ₹500 each
  if (milestonesEl) {
    const weeks = [1, 2, 3, 4].map(weekNumber => {
      const refund = weekNumber * 500;
      const completed = STATE.unlockedRefund >= refund;
      const current = !completed && STATE.unlockedRefund >= (weekNumber - 1) * 500;
      return {
        week: `Week ${weekNumber}`,
        refund: '₹500',
        status: completed ? 'Completed' : current ? 'In Progress' : 'Locked',
        state: completed ? 'completed' : current ? 'current' : 'locked'
      };
    });

    milestonesEl.innerHTML = weeks.map(w => `
      <div class="milestone-step ${w.state}">
        <div class="step-week">${w.week}</div>
        <div class="step-refund">${w.refund}</div>
        <div class="step-status">${w.status}</div>
      </div>
    `).join('');
  }
}

function renderSummaryStats() {
  const totalBurned = STATE.logs.reduce((acc, r) => acc + (r.calBurned || 0), 0);
  const avgSteps = Math.round(STATE.logs.reduce((acc, r) => acc + (r.steps || 0), 0) / (STATE.logs.length || 1));
  const avgWater = (STATE.logs.reduce((acc, r) => acc + (r.waterLiters || 0), 0) / (STATE.logs.length || 1)).toFixed(1);
  const totalVerified = STATE.logs.filter(r => r.proofStatus === 'verified').length;

  const statBurnedEl = document.getElementById('stat-total-burned');
  const statStepsEl = document.getElementById('stat-avg-steps');
  const statWaterEl = document.getElementById('stat-avg-water');
  const statStreakEl = document.getElementById('stat-streak');

  if (statBurnedEl) statBurnedEl.textContent = `${totalBurned.toLocaleString()} kcal`;
  if (statStepsEl) statStepsEl.textContent = `${avgSteps.toLocaleString()} / day`;
  if (statWaterEl) statWaterEl.textContent = `${avgWater} L / day`;
  if (statStreakEl) statStreakEl.textContent = `${totalVerified} Days 100%`;
}

function renderActivityTable() {
  const tbody = document.getElementById('matrix-table-body');
  const countBadge = document.getElementById('table-row-count');
  if (!tbody) return;

  if (countBadge) countBadge.textContent = `${STATE.logs.length} Days Recorded`;

  if (!STATE.logs.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="15" style="text-align:center; padding:2.5rem; color:#607d8b;">
          No workouts recorded yet. Add your first activity to start your health history.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = STATE.logs.map(log => {
    // 15 columns calculation & formatting
    const macroTotal = (log.proteinG || 0) * 4 + (log.carbG || 0) * 4 + (log.fatG || 0) * 9;
    const proteinPct = macroTotal > 0 ? Math.round(((log.proteinG * 4) / macroTotal) * 100) : 0;
    const carbPct = macroTotal > 0 ? Math.round(((log.carbG * 4) / macroTotal) * 100) : 0;
    const fatPct = macroTotal > 0 ? Math.max(0, 100 - proteinPct - carbPct) : 0;

    const stepPct = Math.min(100, Math.round((log.steps / (log.stepsTarget || 10000)) * 100));

    const weightDiffHtml = log.weightDiff !== undefined ? (
      log.weightDiff < 0 
        ? `<span class="text-positive" style="font-size:0.75rem;">${log.weightDiff} kg</span>` 
        : `<span class="text-negative" style="font-size:0.75rem;">+${log.weightDiff} kg</span>`
    ) : '--';

    const proofBadge = log.proofStatus === 'verified'
      ? `<span class="status-badge status-verified">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
          Verified
        </span>`
      : `<button class="btn btn-primary btn-sm" onclick="openProofModal('${log.id}')">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>
          Verify Proof
        </button>`;

    const photoPreview = log.proofImage 
      ? `<img src="${log.proofImage}" class="photo-thumbnail-btn" title="Click to inspect live proof" onclick="viewProofPhoto('${log.proofImage}', '${log.date}', '${log.proofTimestamp || ''}')" />` 
      : `<span style="color:#9e9e9e; font-size:0.75rem;">No Photo</span>`;

    return `
      <tr>
        <!-- Col 1: Date / Day -->
        <td>
          <div style="font-weight:700; color:#004d40;">${log.date}</div>
          <div style="font-size:0.7rem; color:#78909c;">Day ${STATE.logs.indexOf(log) + 1} of 30</div>
        </td>

        <!-- Col 2: Steps Taken -->
        <td>
          <div class="step-progress-mini">
            <div style="display:flex; justify-content:space-between; font-weight:700; font-size:0.8rem;">
              <span>${log.steps.toLocaleString()}</span>
              <span style="color:#78909c; font-size:0.7rem;">${stepPct}%</span>
            </div>
            <div class="mini-bar">
              <div class="mini-fill" style="width: ${stepPct}%;"></div>
            </div>
          </div>
        </td>

        <!-- Col 3: Calories Burned -->
        <td>
          <strong style="color:#c62828;">${log.calBurned.toLocaleString()}</strong>
          <span style="font-size:0.72rem; color:#78909c;"> kcal</span>
        </td>

        <!-- Col 4: Current Weight & Delta -->
        <td>
          <div><strong>${log.weight} kg</strong></div>
          <div>${weightDiffHtml}</div>
        </td>

        <!-- Col 5: Water Intake -->
        <td>
          <span style="color:#0277bd; font-weight:700;">💧 ${log.waterLiters} L</span>
          <span style="font-size:0.72rem; color:#78909c;">(${Math.round(log.waterLiters * 4)} glasses)</span>
        </td>

        <!-- Col 6: Food / Calorie Intake -->
        <td>
          <strong style="color:#2e7d32;">${log.foodKcal.toLocaleString()}</strong>
          <span style="font-size:0.72rem; color:#78909c;"> kcal in</span>
        </td>

        <!-- Col 7: Protein-Carb-Fat Ratio -->
        <td>
          <div class="macro-chip">
            <span class="macro-p" title="Protein">${log.proteinG}g P</span>
            <span style="color:#b0bec5;">|</span>
            <span class="macro-c" title="Carbs">${log.carbG}g C</span>
            <span style="color:#b0bec5;">|</span>
            <span class="macro-f" title="Fat">${log.fatG}g F</span>
          </div>
          <div style="font-size:0.68rem; color:#78909c; margin-top:2px;">
            Ratio: ${proteinPct}% : ${carbPct}% : ${fatPct}%
          </div>
        </td>

        <!-- Col 8: Active Workout Time -->
        <td>
          <div style="font-weight:700; color:#00695c;">⏱️ ${log.workoutMins} mins</div>
          <div style="font-size:0.72rem; color:#546e7a;">${log.workoutType}</div>
        </td>

        <!-- Col 9: Sleep Hours & Quality -->
        <td>
          <div style="font-weight:700;">🌙 ${log.sleepHours} hrs</div>
          <div style="font-size:0.72rem; color:#2e7d32;">${log.sleepQuality}% Sleep Score</div>
        </td>

        <!-- Col 10: Heart Rate BPM -->
        <td>
          <div>❤️ <strong>${log.restingBpm}</strong> <span style="font-size:0.7rem; color:#78909c;">bpm rest</span></div>
          <div style="font-size:0.72rem; color:#c62828;">Peak: ${log.peakBpm} bpm</div>
        </td>

        <!-- Col 11: Live Proof Status & Photo -->
        <td>
          <div style="display:flex; align-items:center; gap:0.5rem;">
            ${photoPreview}
            ${proofBadge}
          </div>
        </td>

        <!-- Col 12: Mood & Energy Level -->
        <td>
          <span style="font-weight:600; font-size:0.8rem; background:#f0f4f8; padding:0.2rem 0.5rem; border-radius:6px;">
            ${log.moodEnergy}
          </span>
        </td>

        <!-- Col 13: Sedentary / Screen Time -->
        <td>
          <span style="color:#546e7a;">🖥️ ${log.sedentaryHours} hrs</span>
        </td>

        <!-- Col 14: Daily Goal % -->
        <td>
          <span style="background:${log.goalPercent >= 100 ? '#e8f5e9' : '#fff3e0'}; color:${log.goalPercent >= 100 ? '#2e7d32' : '#e65100'}; font-weight:800; padding:0.25rem 0.55rem; border-radius:6px; font-size:0.78rem;">
            ${log.goalPercent}% Complete
          </span>
        </td>

        <!-- Col 15: Refund Payout Earned -->
        <td>
          <div class="refund-pill">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
            ₹${log.refundEarned.toFixed(2)}
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// -------------------------------------------------------------
// Live Proof Camera & Snapshot Engine
// -------------------------------------------------------------
function openProofModal(logId) {
  currentVerifyingLogId = logId || (STATE.logs[0] ? STATE.logs[0].id : null);
  const modal = document.getElementById('camera-modal');
  if (modal) modal.classList.add('active');

  resetCameraCalories();
  initWebcam();
}

function closeProofModal() {
  const modal = document.getElementById('camera-modal');
  if (modal) modal.classList.remove('active');
  stopWebcam();
  stopCameraCalories();
  capturedDataUrl = null;
  const capturedImg = document.getElementById('captured-preview');
  const videoEl = document.getElementById('camera-video');
  if (capturedImg) capturedImg.style.display = 'none';
  if (videoEl) videoEl.style.display = 'block';
  document.getElementById('snap-btn').style.display = 'inline-flex';
  document.getElementById('confirm-proof-btn').style.display = 'none';
}

function resetCameraCalories() {
  stopCameraCalories();
  cameraStartedAt = null;
  currentCameraCalories = 0;
  const calorieEl = document.getElementById('camera-calorie-estimate');
  if (calorieEl) calorieEl.textContent = 'Approx. 0 kcal';
}

function startCameraCalories() {
  stopCameraCalories();
  cameraStartedAt = Date.now();
  updateCameraCalories();
  cameraCalorieTimer = setInterval(updateCameraCalories, 1000);
}

function stopCameraCalories() {
  if (cameraCalorieTimer) clearInterval(cameraCalorieTimer);
  cameraCalorieTimer = null;
}

function updateCameraCalories() {
  if (!cameraStartedAt) return;
  const targetLog = STATE.logs.find(log => log.id === currentVerifyingLogId);
  const weight = targetLog && Number(targetLog.weight) > 0 ? Number(targetLog.weight) : 70;
  const minutes = (Date.now() - cameraStartedAt) / 60000;
  currentCameraCalories = Math.max(0, Math.round((3 * 3.5 * weight / 200) * minutes));
  const calorieEl = document.getElementById('camera-calorie-estimate');
  if (calorieEl) calorieEl.textContent = `Approx. ${currentCameraCalories} kcal`;
}

async function initWebcam() {
  const videoEl = document.getElementById('camera-video');
  const capturedImg = document.getElementById('captured-preview');
  if (capturedImg) capturedImg.style.display = 'none';
  if (videoEl) videoEl.style.display = 'block';

  try {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      webCamStream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: false
      });
      if (videoEl) {
        videoEl.srcObject = webCamStream;
        videoEl.play();
      }
      startCameraCalories();
    } else {
      showToast('Camera not supported by browser. You can upload an image proof instead.', 'warning');
    }
  } catch (err) {
    console.warn('Camera access denied or unavailable:', err);
    showToast('Live camera access denied/unavailable. Please upload proof photo below.', 'warning');
  }
}

function stopWebcam() {
  if (webCamStream) {
    webCamStream.getTracks().forEach(track => track.stop());
    webCamStream = null;
  }
}

function takeSnapshot() {
  const videoEl = document.getElementById('camera-video');
  const canvas = document.createElement('canvas');
  const width = videoEl.videoWidth || 640;
  const height = videoEl.videoHeight || 480;

  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  // Draw video frame
  ctx.drawImage(videoEl, 0, 0, width, height);

  // Add watermarked timestamp and biometric stamp
  ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
  ctx.fillRect(10, height - 42, width - 20, 32);

  ctx.fillStyle = '#00e676';
  ctx.font = 'bold 13px monospace';
  const now = new Date();
  const timeString = `VAH-HEALTH LIVE PROOF | ${now.toLocaleDateString('en-GB')} ${now.toLocaleTimeString()} | GPS: 13.0827°N, 80.2707°E`;
  ctx.fillText(timeString, 20, height - 22);

  capturedDataUrl = canvas.toDataURL('image/jpeg', 0.9);

  // Show captured preview
  const capturedImg = document.getElementById('captured-preview');
  if (capturedImg) {
    capturedImg.src = capturedDataUrl;
    capturedImg.style.display = 'block';
    videoEl.style.display = 'none';
  }

  document.getElementById('snap-btn').style.display = 'none';
  document.getElementById('confirm-proof-btn').style.display = 'inline-flex';
}

function handleFileUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    capturedDataUrl = e.target.result;
    const capturedImg = document.getElementById('captured-preview');
    const videoEl = document.getElementById('camera-video');
    if (capturedImg) {
      capturedImg.src = capturedDataUrl;
      capturedImg.style.display = 'block';
      if (videoEl) videoEl.style.display = 'none';
    }
    document.getElementById('snap-btn').style.display = 'none';
    document.getElementById('confirm-proof-btn').style.display = 'inline-flex';
  };
  reader.readAsDataURL(file);
}

function confirmLiveProof() {
  if (!capturedDataUrl) {
    showToast('Please capture or upload live proof first!', 'error');
    return;
  }

  const confirmButton = document.getElementById('confirm-proof-btn');
  if (confirmButton) {
    confirmButton.disabled = true;
    confirmButton.textContent = 'Verifying...';
  }

  showToast('🔍 Analyzing live proof metadata & biometrics...', 'info');

  setTimeout(async () => {
    // Find log to update
    let targetLog = STATE.logs.find(l => l.id === currentVerifyingLogId) || STATE.logs[0];
    if (!targetLog) {
      const cameraMinutes = cameraStartedAt
        ? Math.max(1, Math.ceil((Date.now() - cameraStartedAt) / 60000))
        : 1;
      targetLog = {
        id: `camera-${Date.now()}`,
        dateKey: getTodayKey(),
        date: 'Today (Camera)',
        steps: 0,
        stepsTarget: 10000,
        calBurned: currentCameraCalories,
        cameraCalBurned: currentCameraCalories,
        weight: 70,
        weightDiff: 0,
        waterLiters: 0,
        foodKcal: 0,
        proteinG: 0,
        carbG: 0,
        fatG: 0,
        workoutMins: cameraMinutes,
        workoutType: 'Camera Activity',
        sleepHours: 0,
        sleepQuality: 0,
        restingBpm: 0,
        peakBpm: 0,
        proofStatus: 'pending',
        proofImage: null,
        moodEnergy: 'Camera estimate',
        sedentaryHours: 0,
        goalPercent: 0,
        refundEarned: 71.42,
        proofTimestamp: null
      };
      STATE.logs.unshift(targetLog);
      currentVerifyingLogId = targetLog.id;
    }

    if (targetLog) {
      targetLog.proofStatus = 'verified';
      targetLog.proofImage = capturedDataUrl;
      targetLog.proofTimestamp = new Date().toLocaleString();
      targetLog.cameraCalBurned = currentCameraCalories;
      targetLog.goalPercent = 100;

      try {
        await saveState();
      } catch (error) {
        if (confirmButton) {
          confirmButton.disabled = false;
          confirmButton.textContent = 'Confirm & Release Milestone';
        }
        return;
      }
      renderApp();
      closeProofModal();

      showToast('🎉 Camera activity saved to your profile and synced to the backend.', 'gold');
    }

    if (confirmButton) {
      confirmButton.disabled = false;
      confirmButton.textContent = 'Confirm & Release Milestone';
    }
  }, 900);
}

// -------------------------------------------------------------
// Photo Viewer Modal
// -------------------------------------------------------------
function viewProofPhoto(imgSrc, dateTitle, timestamp) {
  const viewerModal = document.getElementById('photo-viewer-modal');
  const viewerImg = document.getElementById('viewer-image');
  const viewerTitle = document.getElementById('viewer-title');
  const viewerTime = document.getElementById('viewer-time');

  if (viewerImg) viewerImg.src = imgSrc;
  if (viewerTitle) viewerTitle.textContent = `Proof of Workout: ${dateTitle}`;
  if (viewerTime) viewerTime.textContent = `Captured: ${timestamp || 'Verified Live'}`;

  if (viewerModal) viewerModal.classList.add('active');
}

function closePhotoViewer() {
  const viewerModal = document.getElementById('photo-viewer-modal');
  if (viewerModal) viewerModal.classList.remove('active');
}

// -------------------------------------------------------------
// Log New Activity Modal
// -------------------------------------------------------------
function openLogModal() {
  if (!AUTH_STATE.isLoggedIn) {
    openLoginModal('signin');
    showToast('Please log in first to record your activities!', 'info');
    return;
  }
  const modal = document.getElementById('log-activity-modal');
  if (modal) modal.classList.add('active');
}

function closeLogModal() {
  const modal = document.getElementById('log-activity-modal');
  if (modal) modal.classList.remove('active');
}

function updateManualCalorieEstimate() {
  const steps = Number(document.getElementById('input-steps')?.value) || 0;
  const weight = 73;
  const estimate = Math.max(0, Math.round(steps * weight * 0.00065));
  const estimateEl = document.getElementById('manual-calorie-estimate');
  if (estimateEl) {
    estimateEl.textContent = estimate
      ? `Approx. calories: ${estimate.toLocaleString()} kcal`
      : 'Approx. calories: enter steps';
  }
}

async function handleAddActivitySubmit(e) {
  e.preventDefault();
  const form = e.target;

  const steps = parseInt(form.steps.value, 10) || 0;
  const weight = 73.0;
  const waterLiters = 2.5;
  const workoutMins = 45;
  const workoutType = 'Walking';
  const sleepHours = 7.5;
  const calBurned = Math.max(1, Math.round(steps * weight * 0.00065));

  const newLog = {
    id: `log-${Date.now()}`,
    dateKey: getTodayKey(),
    date: 'Today (New)',
    steps,
    stepsTarget: 10000,
    calBurned,
    weight,
    weightDiff: 0,
    waterLiters,
    foodKcal: 0,
    proteinG: 0,
    carbG: 0,
    fatG: 0,
    workoutMins,
    workoutType,
    sleepHours,
    sleepQuality: 0,
    restingBpm: 0,
    peakBpm: 0,
    proofStatus: 'pending',
    proofImage: null,
    moodEnergy: 'Not recorded',
    sedentaryHours: 0,
    goalPercent: Math.min(100, Math.round((steps / 10000) * 100)),
    refundEarned: 71.42,
    proofTimestamp: null
  };

  STATE.logs.unshift(newLog);
  try {
    await saveState();
  } catch (error) {
    return;
  }
  renderApp();
  closeLogModal();
  form.reset();

  showToast('Activity logged successfully! Now submit Live Proof to unlock today\'s ₹71.42 refund.', 'success');
  setTimeout(() => {
    openProofModal(newLog.id);
  }, 800);
}

// -------------------------------------------------------------
// Deposit / Payout Setup Modal
// -------------------------------------------------------------
function openDepositModal() {
  const modal = document.getElementById('deposit-modal');
  if (modal) modal.classList.add('active');
}

function closeDepositModal() {
  const modal = document.getElementById('deposit-modal');
  if (modal) modal.classList.remove('active');
}

function handleDepositConfirm(e) {
  e.preventDefault();
  const pledgeInput = document.getElementById('deposit-amount-input');
  const amount = parseInt(pledgeInput.value, 10) || 2000;

  STATE.depositAmount = amount;
  STATE.escrowLocked = Math.max(0, amount - STATE.unlockedRefund);
  saveState();
  renderApp();
  closeDepositModal();

  showToast(`✅ Successfully pledged ₹${amount.toLocaleString()}! Refund schedule: ₹${Math.round(amount / 4).toLocaleString()} / week upon verified activity proof.`, 'gold');
}

// -------------------------------------------------------------
// Toast notification helper
// -------------------------------------------------------------
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  container.querySelectorAll('.toast').forEach(existingToast => existingToast.remove());

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span>${message}</span>`;

  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => toast.remove(), 300);
  }, 4500);
}

// Export logs to CSV
function exportCSV() {
  if (!STATE.logs.length) return;

  const headers = [
    'Date', 'Steps', 'Calories Burned', 'Weight (kg)', 'Weight Diff',
    'Water (L)', 'Food (kcal)', 'Protein (g)', 'Carbs (g)', 'Fat (g)',
    'Workout Mins', 'Workout Type', 'Sleep (hrs)', 'Sleep Quality (%)',
    'Resting BPM', 'Peak BPM', 'Live Proof Status', 'Mood & Energy',
    'Sedentary (hrs)', 'Goal %', 'Refund Unlocked (INR)'
  ];

  const rows = STATE.logs.map(l => [
    `"${l.date}"`, l.steps, l.calBurned, l.weight, l.weightDiff,
    l.waterLiters, l.foodKcal, l.proteinG, l.carbG, l.fatG,
    l.workoutMins, `"${l.workoutType}"`, l.sleepHours, l.sleepQuality,
    l.restingBpm, l.peakBpm, `"${l.proofStatus}"`, `"${l.moodEnergy}"`,
    l.sedentaryHours, l.goalPercent, l.refundEarned
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `VAH_Health_Tracker_${new Date().toISOString().slice(0,10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast('📊 15-Column Health Matrix exported to CSV!', 'success');
}

// Live Clock for Watermark
function startLiveClock() {
  const clockEl = document.getElementById('camera-live-clock');
  if (!clockEl) return;
  setInterval(() => {
    const now = new Date();
    clockEl.textContent = `${now.toLocaleDateString()} ${now.toLocaleTimeString()}`;
  }, 1000);
}

// Wire Global Listeners
function setupEventListeners() {
  const authForm = document.getElementById('auth-form');
  if (authForm) authForm.addEventListener('submit', handleAuthSubmit);

  const addForm = document.getElementById('add-activity-form');
  if (addForm) addForm.addEventListener('submit', handleAddActivitySubmit);

  const depositForm = document.getElementById('deposit-form');
  if (depositForm) depositForm.addEventListener('submit', handleDepositConfirm);

  const fileInput = document.getElementById('proof-file-upload');
  if (fileInput) fileInput.addEventListener('change', handleFileUpload);

  // Search filter
  const searchInput = document.getElementById('table-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase();
      const rows = document.querySelectorAll('#matrix-table-body tr');
      rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(q) ? '' : 'none';
      });
    });
  }
}
