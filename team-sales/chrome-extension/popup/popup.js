/**
 * LeaderReps Sales Hub - Popup Script
 * 
 * Handles authentication and quick actions in the popup UI.
 */

const SALES_HUB_URL = 'https://leaderreps.team';

// DOM Elements
const loadingState = document.getElementById('loadingState');
const signinState = document.getElementById('signinState');
const signedInState = document.getElementById('signedInState');
const signinBtn = document.getElementById('signinBtn');
const logoutBtn = document.getElementById('logoutBtn');
const userAvatar = document.getElementById('userAvatar');
const userName = document.getElementById('userName');
const userEmail = document.getElementById('userEmail');
const openDashboardBtn = document.getElementById('openDashboardBtn');
const openProspectsBtn = document.getElementById('openProspectsBtn');
const syncGmailBtn = document.getElementById('syncGmailBtn');

// ========================================
// UI STATE MANAGEMENT
// ========================================

function showLoading() {
  loadingState.classList.remove('hidden');
  signinState.classList.add('hidden');
  signedInState.classList.add('hidden');
}

function showSignin() {
  loadingState.classList.add('hidden');
  signinState.classList.remove('hidden');
  signedInState.classList.add('hidden');
  logoutBtn.classList.add('hidden');
}

function showSignedIn(email) {
  loadingState.classList.add('hidden');
  signinState.classList.add('hidden');
  signedInState.classList.remove('hidden');
  logoutBtn.classList.remove('hidden');
  
  // Update user info
  if (email) {
    userEmail.textContent = email;
    const initial = email.charAt(0).toUpperCase();
    userAvatar.textContent = initial;
    
    // Try to extract name from email
    const localPart = email.split('@')[0];
    const nameParts = localPart.split(/[._-]/);
    const displayName = nameParts.map(p => 
      p.charAt(0).toUpperCase() + p.slice(1)
    ).join(' ');
    userName.textContent = displayName;
  }
}

// ========================================
// AUTHENTICATION
// ========================================

async function checkAuthState() {
  showLoading();
  
  try {
    const response = await chrome.runtime.sendMessage({ type: 'GET_AUTH_STATE' });
    
    if (response.authenticated) {
      showSignedIn(response.userEmail);
    } else {
      showSignin();
    }
  } catch (error) {
    console.error('Failed to check auth state:', error);
    showSignin();
  }
}

async function handleSignin() {
  // Open Sales Hub login page in a new tab
  // The user will sign in there and the page will communicate back
  chrome.tabs.create({ 
    url: `${SALES_HUB_URL}/login?extension=true` 
  });
  
  // Close popup
  window.close();
}

async function handleLogout() {
  try {
    await chrome.runtime.sendMessage({ type: 'LOGOUT' });
    showSignin();
  } catch (error) {
    console.error('Logout failed:', error);
  }
}

// ========================================
// QUICK ACTIONS
// ========================================

function openDashboard() {
  chrome.tabs.create({ url: SALES_HUB_URL });
  window.close();
}

function openProspects() {
  chrome.tabs.create({ url: `${SALES_HUB_URL}?view=prospects` });
  window.close();
}

async function syncGmail() {
  syncGmailBtn.disabled = true;
  syncGmailBtn.innerHTML = `
    <svg class="spinner" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M23 4v6h-6M1 20v-6h6"/>
      <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
    </svg>
    Syncing...
  `;
  
  try {
    // Trigger Gmail sync via background script (which calls the Cloud Function)
    const response = await chrome.runtime.sendMessage({ type: 'SYNC_GMAIL' });
    
    if (response.success) {
      syncGmailBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2">
          <path d="M20 6L9 17l-5-5"/>
        </svg>
        Synced!
      `;
    } else {
      throw new Error(response.error || 'Sync failed');
    }
  } catch (error) {
    console.error('Gmail sync failed:', error);
    syncGmailBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2">
        <circle cx="12" cy="12" r="10"/>
        <line x1="15" y1="9" x2="9" y2="15"/>
        <line x1="9" y1="9" x2="15" y2="15"/>
      </svg>
      Sync Failed
    `;
  }
  
  // Reset button after delay
  setTimeout(() => {
    syncGmailBtn.disabled = false;
    syncGmailBtn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M23 4v6h-6M1 20v-6h6"/>
        <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
      </svg>
      Sync Gmail Now
    `;
  }, 3000);
}

// ========================================
// EVENT LISTENERS
// ========================================

signinBtn.addEventListener('click', handleSignin);
logoutBtn.addEventListener('click', handleLogout);
openDashboardBtn.addEventListener('click', openDashboard);
openProspectsBtn.addEventListener('click', openProspects);
syncGmailBtn.addEventListener('click', syncGmail);

// ========================================
// INITIALIZATION
// ========================================

// Check auth state on popup open
checkAuthState();

// Listen for auth state changes from other parts of the extension
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'AUTH_STATE_CHANGED') {
    checkAuthState();
  }
});
