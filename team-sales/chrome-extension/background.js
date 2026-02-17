/**
 * LeaderReps Sales Hub - Chrome Extension Background Service Worker
 * 
 * Handles:
 * - Authentication state with Firebase
 * - API communication with Sales Hub backend
 * - Message passing between popup, sidebar, and content scripts
 */

const SALES_HUB_API_BASE = 'https://us-central1-leaderreps-pd-platform.cloudfunctions.net';

// ========================================
// STORAGE HELPERS
// ========================================

async function getAuthToken() {
  const result = await chrome.storage.local.get(['authToken', 'userId', 'userEmail']);
  return result;
}

async function setAuthToken(data) {
  await chrome.storage.local.set(data);
}

async function clearAuthToken() {
  await chrome.storage.local.remove(['authToken', 'userId', 'userEmail']);
}

// ========================================
// API HELPERS
// ========================================

async function callSalesHubAPI(endpoint, data = {}) {
  const { authToken, userId } = await getAuthToken();
  
  if (!authToken || !userId) {
    throw new Error('Not authenticated. Please sign in.');
  }
  
  const response = await fetch(`${SALES_HUB_API_BASE}/${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    },
    body: JSON.stringify({ ...data, userId })
  });
  
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  
  return response.json();
}

// ========================================
// PROSPECT LOOKUP
// ========================================

async function lookupProspect(email) {
  const { userId } = await getAuthToken();
  
  if (!userId) {
    return { found: false, error: 'Not authenticated' };
  }
  
  try {
    // Call the prospects lookup function (we'll need to create this Cloud Function)
    const result = await callSalesHubAPI('prospectLookup', { email });
    return result;
  } catch (error) {
    console.error('Prospect lookup failed:', error);
    return { found: false, error: error.message };
  }
}

// ========================================
// MESSAGE HANDLING
// ========================================

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Handle async operations
  (async () => {
    try {
      switch (message.type) {
        case 'GET_AUTH_STATE':
          const auth = await getAuthToken();
          sendResponse({ 
            authenticated: !!(auth.authToken && auth.userId),
            userEmail: auth.userEmail 
          });
          break;
          
        case 'SET_AUTH_TOKEN':
          await setAuthToken(message.data);
          sendResponse({ success: true });
          break;
          
        case 'LOGOUT':
          await clearAuthToken();
          sendResponse({ success: true });
          break;
          
        case 'LOOKUP_PROSPECT':
          const result = await lookupProspect(message.email);
          sendResponse(result);
          break;
          
        case 'GET_PROSPECT_DATA':
          // Fetch full prospect data from Firebase
          try {
            const prospectData = await callSalesHubAPI('getProspect', { 
              prospectId: message.prospectId 
            });
            sendResponse({ success: true, data: prospectData });
          } catch (error) {
            sendResponse({ success: false, error: error.message });
          }
          break;
          
        case 'LOG_ACTIVITY':
          // Log an activity to prospect timeline
          try {
            await callSalesHubAPI('logActivity', {
              prospectId: message.prospectId,
              activity: message.activity
            });
            sendResponse({ success: true });
          } catch (error) {
            sendResponse({ success: false, error: error.message });
          }
          break;
          
        case 'UPDATE_PROSPECT_STATUS':
          // Update prospect status
          try {
            await callSalesHubAPI('updateProspectStatus', {
              prospectId: message.prospectId,
              status: message.status
            });
            sendResponse({ success: true });
          } catch (error) {
            sendResponse({ success: false, error: error.message });
          }
          break;
          
        default:
          sendResponse({ error: 'Unknown message type' });
      }
    } catch (error) {
      console.error('Background script error:', error);
      sendResponse({ error: error.message });
    }
  })();
  
  // Return true to indicate we'll respond asynchronously
  return true;
});

// ========================================
// EXTENSION INSTALLATION
// ========================================

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('LeaderReps Sales Hub extension installed');
    // Open welcome/login page
    chrome.tabs.create({ 
      url: 'popup/popup.html?view=welcome' 
    });
  }
});

// ========================================
// TAB UPDATE LISTENER (for Gmail detection)
// ========================================

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url?.includes('mail.google.com')) {
    // Notify content script that page is ready
    chrome.tabs.sendMessage(tabId, { type: 'PAGE_READY' }).catch(() => {
      // Content script might not be ready yet, that's okay
    });
  }
});

console.log('LeaderReps Sales Hub background service worker initialized');
