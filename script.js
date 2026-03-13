// ── Firebase ──────────────────────────────────────────────────────────────────
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.6.0/firebase-app.js';
import { getDatabase, ref, onValue } from 'https://www.gstatic.com/firebasejs/9.6.0/firebase-database.js';

const firebaseConfig = {
  apiKey: "AIzaSyAsUAVmIsCq3V9aWfnV6PFm3bd3cqGM_0w",
  authDomain: "xpo-iot.firebaseapp.com",
  databaseURL: "https://xpo-iot-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "xpo-iot",
  storageBucket: "xpo-iot.firebasestorage.app",
  messagingSenderId: "1064490535871",
  appId: "1:1064490535871:web:f731d0f198dcd2cb9baf0a"
};

const firebaseApp = initializeApp(firebaseConfig);
const database   = getDatabase(firebaseApp);

// Active Firebase listeners — kept so we can unsubscribe on logout
let unsubscribeValue     = null;
let unsubscribeParameter = null;

// ── Helpers ───────────────────────────────────────────────────────────────────
function setStatus(text, cls = '') {
  const el = document.getElementById('status-dot');
  const tx = document.getElementById('status-text');
  el.className = 'dot ' + cls;
  tx.textContent = text;
}

function setTimestamp() {
  const el = document.getElementById('last-update');
  if (el) el.textContent = 'Last update: ' + new Date().toLocaleTimeString();
}

function animateValue(elementId, newText) {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.classList.remove('pop');
  // Force reflow so animation re-triggers even for same value change
  void el.offsetWidth;
  el.textContent = newText;
  el.classList.add('pop');
}

function showToast(msg, type = 'info') {
  if (window.toastr) {
    toastr[type](msg);
  }
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export function authenticate() {
  const usernameRaw = document.getElementById('userId').value.trim();
  const password    = document.getElementById('password').value;
  const username    = usernameRaw.split('@')[0];

  if (!username || !password) {
    showToast('Please fill in all fields.', 'warning');
    return;
  }

  setStatus('Authenticating…', 'yellow');

  const passwordRef = ref(database, `/${username}/iot_password`);
  onValue(passwordRef, (snapshot) => {
    const correct = snapshot.val();

    if (correct === null) {
      showToast('User not found.', 'error');
      setStatus('Not connected', 'red');
      return;
    }

    if (password === correct) {
      // Persist credentials
      localStorage.setItem('username', username);
      localStorage.setItem('password', password);

      showLogin(false);
      fetchAndDisplayData(username);
      document.getElementById('user-display').textContent = username;
    } else {
      showToast('Incorrect username or password.', 'error');
      setStatus('Not connected', 'red');
    }
  }, (err) => {
    console.error(err);
    showToast('Firebase error. Check console.', 'error');
    setStatus('Error', 'red');
  }, { onlyOnce: true });
}

// ── Data Listener ─────────────────────────────────────────────────────────────
function fetchAndDisplayData(userId) {
  setStatus('Connecting…', 'yellow');

  // Unsubscribe previous listeners
  if (unsubscribeParameter) unsubscribeParameter();
  if (unsubscribeValue)     unsubscribeValue();

  const paramRef = ref(database, `/${userId}/Parameter`);
  const valueRef = ref(database, `/${userId}/Value`);

  unsubscribeParameter = onValue(paramRef, (snap) => {
    const val = snap.val() ?? '—';
    animateValue('parameter-iot', val);
    setTimestamp();
    setStatus('Live', 'green');
  });

  unsubscribeValue = onValue(valueRef, (snap) => {
    const val = snap.val() ?? '—';
    animateValue('value-iot', val);
    setTimestamp();
    setStatus('Live', 'green');
  });
}

// ── Logout ────────────────────────────────────────────────────────────────────
function logout() {
  // Stop Firebase listeners
  if (unsubscribeParameter) { unsubscribeParameter(); unsubscribeParameter = null; }
  if (unsubscribeValue)     { unsubscribeValue();     unsubscribeValue     = null; }

  localStorage.removeItem('username');
  localStorage.removeItem('password');

  animateValue('parameter-iot', '—');
  animateValue('value-iot',     '—');
  setStatus('Not connected', 'red');
  showToast('Logged out.', 'info');
  showLogin(true);
}

// ── Auto-login ────────────────────────────────────────────────────────────────
function autoLogin() {
  const savedUser = localStorage.getItem('username');
  const savedPass = localStorage.getItem('password');
  if (!savedUser || !savedPass) return;

  setStatus('Auto-login…', 'yellow');

  const passwordRef = ref(database, `/${savedUser}/iot_password`);
  onValue(passwordRef, (snap) => {
    const correct = snap.val();
    if (savedPass === correct) {
      showLogin(false);
      fetchAndDisplayData(savedUser);
      document.getElementById('user-display').textContent = savedUser;
    } else {
      localStorage.clear();
      setStatus('Session expired', 'red');
    }
  }, (err) => {
    console.error('Auto-login error:', err);
    setStatus('Auto-login failed', 'red');
  }, { onlyOnce: true });
}

// ── UI helpers ────────────────────────────────────────────────────────────────
function showLogin(show) {
  document.getElementById('login-container').style.display = show ? 'flex' : 'none';
  document.getElementById('data-container').style.display  = show ? 'none' : 'block';
}

// ── Event Wiring ──────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  autoLogin();

  document.getElementById('login-form').addEventListener('submit', (e) => {
    e.preventDefault();
    authenticate();
  });

  document.getElementById('logout-button').addEventListener('click', logout);
});
