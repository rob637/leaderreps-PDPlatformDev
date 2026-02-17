/**
 * LeaderReps Sales Hub - Chrome Extension Background Service Worker
 * 
 * Handles:
 * - Authentication state with Firebase
 * - API communication with Sales Hub backend
 * - Message passing between popup, sidebar, and content scripts
 * - LinkedHelper localhost bridge for pushing prospects
 */

const SALES_HUB_API_BASE = 'https://us-central1-leaderreps-pd-platform.cloudfunctions.net';
const LINKEDHELPER_LOCAL_URL = 'http://localhost:12080'; // Default LinkedHelper 2 port
const QUEUE_POLL_INTERVAL = 5000; // 5 seconds

// LinkedHelper bridge state
let linkedHelperBridgeEnabled = false;
let linkedHelperPollingInterval = null;

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
        
        // ========== LINKEDHELPER BRIDGE MESSAGES ==========
        
        case 'GET_LINKEDHELPER_STATUS':
          // Check if LinkedHelper is running locally
          try {
            const lhStatus = await checkLinkedHelperStatus();
            const bridgeSettings = await chrome.storage.local.get([
              'linkedHelperBridgeEnabled', 
              'linkedHelperApiKey'
            ]);
            sendResponse({ 
              success: true,
              running: lhStatus.running,
              version: lhStatus.version,
              bridgeEnabled: bridgeSettings.linkedHelperBridgeEnabled || false,
              hasApiKey: !!bridgeSettings.linkedHelperApiKey
            });
          } catch (error) {
            sendResponse({ success: false, error: error.message });
          }
          break;
        
        case 'SET_LINKEDHELPER_BRIDGE':
          // Enable/disable the LinkedHelper bridge
          try {
            setLinkedHelperBridgeEnabled(message.enabled);
            sendResponse({ success: true });
          } catch (error) {
            sendResponse({ success: false, error: error.message });
          }
          break;
        
        case 'SET_LINKEDHELPER_API_KEY':
          // Store LinkedHelper API key locally
          try {
            await chrome.storage.local.set({ linkedHelperApiKey: message.apiKey });
            sendResponse({ success: true });
          } catch (error) {
            sendResponse({ success: false, error: error.message });
          }
          break;
        
        case 'GET_LINKEDHELPER_CAMPAIGNS':
          // Fetch campaigns from local LinkedHelper
          try {
            const lhRunning = await checkLinkedHelperStatus();
            if (!lhRunning.running) {
              sendResponse({ success: false, error: 'LinkedHelper is not running' });
              break;
            }
            const campaigns = await callLinkedHelperLocal('/api/campaigns', 'GET');
            sendResponse({ success: true, campaigns });
          } catch (error) {
            sendResponse({ success: false, error: error.message });
          }
          break;
        
        case 'PUSH_TO_LINKEDHELPER_LOCAL':
          // Directly push to LinkedHelper (for testing/manual push)
          try {
            const lhRunning = await checkLinkedHelperStatus();
            if (!lhRunning.running) {
              sendResponse({ success: false, error: 'LinkedHelper is not running' });
              break;
            }
            const pushResult = await processQueueItem({
              campaignId: message.campaignId,
              prospect: message.prospect,
              prospectId: message.prospectId
            });
            sendResponse({ success: true, result: pushResult });
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
// LINKEDHELPER LOCALHOST BRIDGE
// ========================================

/**
 * Check if LinkedHelper is running locally
 */
async function checkLinkedHelperStatus() {
  try {
    const response = await fetch(`${LINKEDHELPER_LOCAL_URL}/api/status`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    if (response.ok) {
      const data = await response.json();
      return { running: true, version: data.version || 'unknown' };
    }
  } catch (error) {
    // LinkedHelper not running or not accessible
  }
  return { running: false };
}

/**
 * Get LinkedHelper API key from local storage
 */
async function getLinkedHelperApiKey() {
  const result = await chrome.storage.local.get(['linkedHelperApiKey']);
  return result.linkedHelperApiKey;
}

/**
 * Call LinkedHelper localhost API
 */
async function callLinkedHelperLocal(endpoint, method = 'GET', body = null) {
  const apiKey = await getLinkedHelperApiKey();
  
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json'
    }
  };
  
  if (apiKey) {
    options.headers['Authorization'] = `Bearer ${apiKey}`;
  }
  
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  const response = await fetch(`${LINKEDHELPER_LOCAL_URL}${endpoint}`, options);
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`LinkedHelper API error: ${response.status} - ${errorText}`);
  }
  
  return response.json();
}

/**
 * Process a single queue item - push prospect to LinkedHelper
 */
async function processQueueItem(item) {
  const { campaignId, prospect } = item;
  
  if (!prospect.linkedin) {
    throw new Error('Prospect has no LinkedIn URL');
  }
  
  // Call LinkedHelper local API to add contact to campaign
  const result = await callLinkedHelperLocal(`/api/campaigns/${campaignId}/contacts`, 'POST', {
    linkedin_url: prospect.linkedin,
    first_name: prospect.firstName || prospect.name?.split(' ')[0] || '',
    last_name: prospect.lastName || prospect.name?.split(' ').slice(1).join(' ') || '',
    company: prospect.company || '',
    title: prospect.title || '',
    email: prospect.email || '',
    notes: `Pushed from LeaderReps Sales Hub - Prospect ID: ${item.prospectId}`
  });
  
  return result;
}

/**
 * Poll Firestore queue for pending LinkedHelper tasks
 * This function is called by the Firebase SDK initialized in the extension
 */
async function pollLinkedHelperQueue() {
  if (!linkedHelperBridgeEnabled) return;
  
  const { userId, authToken } = await getAuthToken();
  if (!userId || !authToken) return;
  
  try {
    // Check if LinkedHelper is running first
    const status = await checkLinkedHelperStatus();
    if (!status.running) {
      console.log('LinkedHelper not running, skipping queue poll');
      return;
    }
    
    // Fetch pending queue items from our Cloud Function
    const response = await fetch(`${SALES_HUB_API_BASE}/linkedHelperQueuePoll`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ userId })
    });
    
    if (!response.ok) {
      console.error('Failed to poll LinkedHelper queue');
      return;
    }
    
    const { items } = await response.json();
    
    if (!items || items.length === 0) return;
    
    console.log(`Processing ${items.length} LinkedHelper queue items`);
    
    // Process each item
    for (const item of items) {
      try {
        const result = await processQueueItem(item);
        
        // Report success back to Cloud Function
        await fetch(`${SALES_HUB_API_BASE}/linkedHelperQueueComplete`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify({
            queueItemId: item.id,
            status: 'completed',
            result
          })
        });
        
        console.log(`Processed queue item ${item.id} successfully`);
      } catch (error) {
        console.error(`Failed to process queue item ${item.id}:`, error);
        
        // Report failure back to Cloud Function
        await fetch(`${SALES_HUB_API_BASE}/linkedHelperQueueComplete`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify({
            queueItemId: item.id,
            status: 'failed',
            error: error.message
          })
        });
      }
    }
  } catch (error) {
    console.error('LinkedHelper queue poll error:', error);
  }
}

/**
 * Start/stop the LinkedHelper bridge
 */
function setLinkedHelperBridgeEnabled(enabled) {
  linkedHelperBridgeEnabled = enabled;
  
  if (enabled) {
    // Start polling
    if (!linkedHelperPollingInterval) {
      linkedHelperPollingInterval = setInterval(pollLinkedHelperQueue, QUEUE_POLL_INTERVAL);
      console.log('LinkedHelper bridge started');
      // Poll immediately
      pollLinkedHelperQueue();
    }
  } else {
    // Stop polling
    if (linkedHelperPollingInterval) {
      clearInterval(linkedHelperPollingInterval);
      linkedHelperPollingInterval = null;
      console.log('LinkedHelper bridge stopped');
    }
  }
  
  // Persist setting
  chrome.storage.local.set({ linkedHelperBridgeEnabled: enabled });
}

/**
 * Initialize LinkedHelper bridge on startup
 */
async function initLinkedHelperBridge() {
  const result = await chrome.storage.local.get(['linkedHelperBridgeEnabled']);
  if (result.linkedHelperBridgeEnabled) {
    setLinkedHelperBridgeEnabled(true);
  }
}

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

// Initialize LinkedHelper bridge
initLinkedHelperBridge();
