/**
 * LeaderReps Sales Hub - Gmail Content Script
 * 
 * Injected into Gmail pages to:
 * 1. Detect when user opens an email
 * 2. Extract sender/recipient email addresses
 * 3. Show/hide the Sales Hub sidebar
 * 4. Pass email data to sidebar for CRM lookup
 */

const SIDEBAR_WIDTH = 320;
let sidebarFrame = null;
let sidebarVisible = false;
let lastExtractedEmail = null;

// ========================================
// SIDEBAR MANAGEMENT
// ========================================

function createSidebar() {
  if (sidebarFrame) return;
  
  // Create iframe for sidebar
  sidebarFrame = document.createElement('iframe');
  sidebarFrame.id = 'leaderreps-sidebar';
  sidebarFrame.src = chrome.runtime.getURL('sidebar/sidebar.html');
  sidebarFrame.setAttribute('allowtransparency', 'true');
  document.body.appendChild(sidebarFrame);
  
  // Listen for messages from sidebar
  window.addEventListener('message', handleSidebarMessage);
  
  console.log('LeaderReps sidebar created');
}

function showSidebar() {
  if (!sidebarFrame) createSidebar();
  
  sidebarFrame.classList.add('visible');
  sidebarVisible = true;
  
  // Shift Gmail content to make room
  adjustGmailLayout(true);
}

function hideSidebar() {
  if (!sidebarFrame) return;
  
  sidebarFrame.classList.remove('visible');
  sidebarVisible = false;
  
  // Restore Gmail layout
  adjustGmailLayout(false);
}

function toggleSidebar() {
  if (sidebarVisible) {
    hideSidebar();
  } else {
    showSidebar();
  }
}

function adjustGmailLayout(showSidebar) {
  // Target Gmail's main content area
  const mainContent = document.querySelector('.bkK') || 
                       document.querySelector('.aeF') ||
                       document.querySelector('[role="main"]');
  
  if (mainContent) {
    if (showSidebar) {
      mainContent.style.marginRight = `${SIDEBAR_WIDTH}px`;
      mainContent.style.transition = 'margin-right 0.3s ease';
    } else {
      mainContent.style.marginRight = '';
    }
  }
}

// ========================================
// EMAIL DETECTION
// ========================================

function extractEmailFromThread() {
  // Try different Gmail selectors for sender email
  const selectors = [
    // Sender in email header
    '[data-hovercard-id]',
    '.gD[email]',
    '[email]',
    // From line
    '.go',
    // Participant chip
    '.afV',
    // Expanded header
    '.ajA .g2'
  ];
  
  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element) {
      const email = element.getAttribute('email') || 
                    element.getAttribute('data-hovercard-id') ||
                    extractEmailFromText(element.textContent);
      if (email && isValidEmail(email)) {
        return email;
      }
    }
  }
  
  return null;
}

function extractEmailFromText(text) {
  if (!text) return null;
  const emailRegex = /[\w.+-]+@[\w.-]+\.[a-zA-Z]{2,}/;
  const match = text.match(emailRegex);
  return match ? match[0] : null;
}

function isValidEmail(email) {
  if (!email) return false;
  // Skip own domain emails if needed
  const emailRegex = /^[\w.+-]+@[\w.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
}

function handleEmailChange() {
  const email = extractEmailFromThread();
  
  if (email && email !== lastExtractedEmail) {
    lastExtractedEmail = email;
    
    // Show sidebar if not visible
    if (!sidebarVisible) {
      showSidebar();
    }
    
    // Send email to sidebar
    setTimeout(() => {
      if (sidebarFrame?.contentWindow) {
        sidebarFrame.contentWindow.postMessage({
          type: 'LOOKUP_EMAIL',
          email: email
        }, '*');
      }
    }, 100);
  }
}

// ========================================
// GMAIL NAVIGATION DETECTION
// ========================================

function setupNavigationObserver() {
  // Watch for URL changes (Gmail is a SPA)
  let lastUrl = window.location.href;
  
  const checkUrlChange = () => {
    if (window.location.href !== lastUrl) {
      lastUrl = window.location.href;
      
      // Check if we're viewing a thread
      if (lastUrl.includes('#inbox/') || 
          lastUrl.includes('#sent/') ||
          lastUrl.includes('#all/') ||
          lastUrl.includes('#label/')) {
        // Viewing a thread - extract email after DOM updates
        setTimeout(handleEmailChange, 500);
      } else {
        // Not viewing a thread - clear state
        lastExtractedEmail = null;
        if (sidebarFrame?.contentWindow) {
          sidebarFrame.contentWindow.postMessage({
            type: 'LOOKUP_EMAIL',
            email: null
          }, '*');
        }
      }
    }
  };
  
  // Use both popstate and MutationObserver
  window.addEventListener('popstate', checkUrlChange);
  window.addEventListener('hashchange', checkUrlChange);
  
  // Also watch for DOM changes that indicate email opening
  const observer = new MutationObserver((mutations) => {
    // Check if an email thread was opened
    const emailView = document.querySelector('.h7') || 
                       document.querySelector('.gs') ||
                       document.querySelector('[data-message-id]');
    
    if (emailView) {
      setTimeout(handleEmailChange, 200);
    }
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  // Initial check
  setTimeout(checkUrlChange, 1000);
}

// ========================================
// TOGGLE BUTTON
// ========================================

function createToggleButton() {
  const button = document.createElement('button');
  button.id = 'leaderreps-toggle';
  button.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
    </svg>
  `;
  button.title = 'Toggle Sales Hub';
  button.addEventListener('click', toggleSidebar);
  
  // Insert into Gmail toolbar
  const insertToggle = () => {
    const toolbar = document.querySelector('.aeH') || 
                     document.querySelector('[gh="tm"]') ||
                     document.querySelector('.G-atb');
    
    if (toolbar && !document.getElementById('leaderreps-toggle')) {
      toolbar.appendChild(button);
      return true;
    }
    return false;
  };
  
  // Try immediately, then retry
  if (!insertToggle()) {
    const retryInterval = setInterval(() => {
      if (insertToggle()) {
        clearInterval(retryInterval);
      }
    }, 1000);
    
    // Stop trying after 30 seconds
    setTimeout(() => clearInterval(retryInterval), 30000);
  }
}

// ========================================
// MESSAGE HANDLING
// ========================================

function handleSidebarMessage(event) {
  if (event.data?.type === 'CLOSE_SIDEBAR') {
    hideSidebar();
  }
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case 'PAGE_READY':
      // Background notifying us the page is ready
      handleEmailChange();
      sendResponse({ received: true });
      break;
      
    case 'TOGGLE_SIDEBAR':
      toggleSidebar();
      sendResponse({ visible: sidebarVisible });
      break;
      
    case 'SHOW_SIDEBAR':
      showSidebar();
      sendResponse({ visible: true });
      break;
      
    case 'HIDE_SIDEBAR':
      hideSidebar();
      sendResponse({ visible: false });
      break;
  }
  return true;
});

// ========================================
// INITIALIZATION
// ========================================

function initialize() {
  console.log('LeaderReps Sales Hub content script loaded');
  
  // Create sidebar (hidden initially)
  createSidebar();
  
  // Create toggle button in Gmail toolbar
  createToggleButton();
  
  // Set up navigation detection
  setupNavigationObserver();
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}
