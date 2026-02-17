/**
 * LeaderReps Sales Hub - Sidebar Script
 * 
 * Displays CRM data for the currently viewed email in Gmail.
 * Communicates with background script for data fetching.
 */

const SALES_HUB_URL = 'https://leaderreps.team';

// DOM Elements
const loadingState = document.getElementById('loadingState');
const emptyState = document.getElementById('emptyState');
const notFoundState = document.getElementById('notFoundState');
const prospectState = document.getElementById('prospectState');
const closeBtn = document.getElementById('closeBtn');

// Prospect elements
const prospectAvatar = document.getElementById('prospectAvatar');
const prospectName = document.getElementById('prospectName');
const prospectTitle = document.getElementById('prospectTitle');
const prospectCompany = document.getElementById('prospectCompany');
const prospectStatus = document.getElementById('prospectStatus');
const prospectPhone = document.getElementById('prospectPhone');
const prospectLinkedIn = document.getElementById('prospectLinkedIn');
const contactList = document.getElementById('contactList');
const activityList = document.getElementById('activityList');
const notFoundEmail = document.getElementById('notFoundEmail');

// Action buttons
const addProspectBtn = document.getElementById('addProspectBtn');
const sendEmailBtn = document.getElementById('sendEmailBtn');
const logCallBtn = document.getElementById('logCallBtn');
const addNoteBtn = document.getElementById('addNoteBtn');
const openProfileBtn = document.getElementById('openProfileBtn');
const viewAllActivity = document.getElementById('viewAllActivity');

// State
let currentProspect = null;
let currentEmail = null;

// ========================================
// STATE MANAGEMENT
// ========================================

function showState(state) {
  loadingState.classList.add('hidden');
  emptyState.classList.add('hidden');
  notFoundState.classList.add('hidden');
  prospectState.classList.add('hidden');
  
  switch (state) {
    case 'loading':
      loadingState.classList.remove('hidden');
      break;
    case 'empty':
      emptyState.classList.remove('hidden');
      break;
    case 'not-found':
      notFoundState.classList.remove('hidden');
      break;
    case 'prospect':
      prospectState.classList.remove('hidden');
      break;
  }
}

// ========================================
// PROSPECT DISPLAY
// ========================================

function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diff = now - date;
  
  // Less than 24 hours
  if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) {
      const mins = Math.floor(diff / 60000);
      return mins < 1 ? 'Just now' : `${mins}m ago`;
    }
    return `${hours}h ago`;
  }
  
  // Less than 7 days
  if (diff < 604800000) {
    const days = Math.floor(diff / 86400000);
    return days === 1 ? 'Yesterday' : `${days} days ago`;
  }
  
  // Otherwise show date
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getActivityIcon(type) {
  const icons = {
    email: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
      <path d="M22 6l-10 7L2 6"/>
    </svg>`,
    linkedin: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6z"/>
      <rect x="2" y="9" width="4" height="12"/>
      <circle cx="4" cy="4" r="2"/>
    </svg>`,
    call: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/>
    </svg>`,
    meeting: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>`,
    note: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
      <path d="M14 2v6h6"/>
    </svg>`
  };
  return icons[type] || icons.note;
}

function displayProspect(prospect) {
  currentProspect = prospect;
  
  // Header
  prospectAvatar.textContent = getInitials(prospect.name || prospect.email);
  prospectName.textContent = prospect.name || prospect.email?.split('@')[0] || 'Unknown';
  prospectTitle.textContent = prospect.title || '';
  prospectTitle.classList.toggle('hidden', !prospect.title);
  prospectCompany.textContent = prospect.company || '';
  prospectCompany.classList.toggle('hidden', !prospect.company);
  
  // Status badge
  const status = prospect.status?.toLowerCase() || 'lead';
  prospectStatus.textContent = status.charAt(0).toUpperCase() + status.slice(1);
  prospectStatus.className = `status-badge ${status}`;
  
  // Contact info
  if (prospect.phone) {
    prospectPhone.textContent = prospect.phone;
    prospectPhone.parentElement.classList.remove('hidden');
  } else {
    prospectPhone.parentElement.classList.add('hidden');
  }
  
  if (prospect.linkedinUrl) {
    prospectLinkedIn.href = prospect.linkedinUrl;
    prospectLinkedIn.parentElement.classList.remove('hidden');
  } else {
    prospectLinkedIn.parentElement.classList.add('hidden');
  }
  
  // Activity timeline
  renderActivities(prospect.activities || []);
  
  showState('prospect');
}

function renderActivities(activities) {
  if (!activities.length) {
    activityList.innerHTML = `
      <div style="text-align: center; padding: 16px; color: #9ca3af; font-size: 12px;">
        No activity yet
      </div>
    `;
    return;
  }
  
  const recentActivities = activities.slice(0, 5);
  activityList.innerHTML = recentActivities.map(activity => `
    <div class="activity-item">
      <div class="activity-icon ${activity.type || 'note'}">
        ${getActivityIcon(activity.type)}
      </div>
      <div class="activity-content">
        <div class="activity-title">${escapeHtml(activity.title || activity.description || 'Activity')}</div>
        <div class="activity-date">${formatDate(activity.date || activity.createdAt)}</div>
      </div>
    </div>
  `).join('');
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ========================================
// API COMMUNICATION
// ========================================

async function lookupEmail(email) {
  if (!email) {
    showState('empty');
    return;
  }
  
  currentEmail = email;
  showState('loading');
  
  try {
    // Send message to background script
    const response = await new Promise((resolve) => {
      chrome.runtime.sendMessage(
        { type: 'LOOKUP_PROSPECT', email },
        resolve
      );
    });
    
    if (response.found && response.prospect) {
      displayProspect(response.prospect);
    } else {
      notFoundEmail.textContent = email;
      showState('not-found');
    }
  } catch (error) {
    console.error('Lookup failed:', error);
    showState('empty');
  }
}

async function addProspectToCRM() {
  if (!currentEmail) return;
  
  addProspectBtn.disabled = true;
  addProspectBtn.innerHTML = `
    <div class="spinner" style="width: 16px; height: 16px; margin-right: 8px;"></div>
    Adding...
  `;
  
  try {
    // Open Sales Hub with pre-filled prospect form
    const url = `${SALES_HUB_URL}?view=add-prospect&email=${encodeURIComponent(currentEmail)}`;
    window.open(url, '_blank');
    
    // Reset button
    addProspectBtn.disabled = false;
    addProspectBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
        <circle cx="8.5" cy="7" r="4"/>
        <line x1="20" y1="8" x2="20" y2="14"/>
        <line x1="23" y1="11" x2="17" y2="11"/>
      </svg>
      Add to CRM
    `;
  } catch (error) {
    console.error('Add prospect failed:', error);
    addProspectBtn.disabled = false;
  }
}

// ========================================
// EVENT HANDLERS
// ========================================

closeBtn.addEventListener('click', () => {
  // Tell content script to hide sidebar
  window.parent.postMessage({ type: 'CLOSE_SIDEBAR' }, '*');
});

addProspectBtn.addEventListener('click', addProspectToCRM);

sendEmailBtn.addEventListener('click', () => {
  if (currentProspect?.email) {
    window.open(`mailto:${currentProspect.email}`, '_blank');
  }
});

logCallBtn.addEventListener('click', () => {
  if (currentProspect?.id) {
    const url = `${SALES_HUB_URL}?view=prospect&id=${currentProspect.id}&action=log-call`;
    window.open(url, '_blank');
  }
});

addNoteBtn.addEventListener('click', () => {
  if (currentProspect?.id) {
    const url = `${SALES_HUB_URL}?view=prospect&id=${currentProspect.id}&action=add-note`;
    window.open(url, '_blank');
  }
});

openProfileBtn.addEventListener('click', () => {
  if (currentProspect?.id) {
    const url = `${SALES_HUB_URL}?view=prospect&id=${currentProspect.id}`;
    window.open(url, '_blank');
  }
});

viewAllActivity.addEventListener('click', (e) => {
  e.preventDefault();
  if (currentProspect?.id) {
    const url = `${SALES_HUB_URL}?view=prospect&id=${currentProspect.id}&tab=activity`;
    window.open(url, '_blank');
  }
});

// ========================================
// MESSAGE HANDLING
// ========================================

// Listen for messages from content script
window.addEventListener('message', (event) => {
  if (event.data?.type === 'LOOKUP_EMAIL') {
    lookupEmail(event.data.email);
  }
});

// Initial state
showState('empty');

console.log('Sales Hub sidebar initialized');
