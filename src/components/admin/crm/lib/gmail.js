/**
 * Gmail API Client
 * 
 * Handles all interactions with Gmail for email sync and sending.
 * API calls are proxied through Cloud Functions for security.
 * OAuth tokens are stored at team level for shared access.
 * 
 * API Docs: https://developers.google.com/gmail/api/reference/rest
 */

import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from './firebase';

// Initialize Firebase Functions
const functions = getFunctions(app, 'us-central1');

// Cloud Function callables
const gmailProxyFn = httpsCallable(functions, 'gmailProxy');
const gmailGetAuthUrlFn = httpsCallable(functions, 'gmailGetAuthUrl');
const gmailListAccountsFn = httpsCallable(functions, 'gmailListAccounts');

/**
 * List all connected Gmail accounts (team-level)
 * @returns {Promise<Array>} Array of connected accounts
 */
export async function listConnectedAccounts() {
  try {
    const result = await gmailListAccountsFn();
    return result.data.accounts || [];
  } catch (error) {
    console.error('Error listing Gmail accounts:', error);
    return [];
  }
}

/**
 * Base API wrapper for Gmail operations
 * All calls are routed through our secure Cloud Function proxy
 * @param {string} action - The action to perform
 * @param {Object} payload - The payload for the action
 * @param {Object} tokens - OAuth tokens { accessToken, refreshToken }
 */
async function callGmail(action, payload = {}, tokens = {}) {
  if (!tokens.accessToken && !tokens.refreshToken) {
    throw new Error('Gmail not connected. Please connect Gmail in Settings.');
  }
  
  try {
    const result = await gmailProxyFn({ 
      action, 
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      ...payload 
    });
    return result.data;
  } catch (error) {
    console.error(`Gmail API error (${action}):`, error);
    throw new Error(error.message || `Failed to ${action}`);
  }
}

// ========================================
// OAUTH HELPERS
// ========================================

/**
 * Get the Gmail OAuth URL to start connection flow.
 * Calls Cloud Function which has access to OAuth secrets.
 * @param {string} userId - Current user's UID
 * @returns {Promise<string>} OAuth URL to redirect to
 */
export async function getOAuthUrl(userId) {
  try {
    const result = await gmailGetAuthUrlFn({ userId });
    return result.data.authUrl;
  } catch (error) {
    console.error('Error getting OAuth URL:', error);
    return null;
  }
}

// ========================================
// EMAIL OPERATIONS
// ========================================

/**
 * Get user's Gmail profile
 * @param {Object} tokens - OAuth tokens
 * @returns {Promise<Object>} Profile with emailAddress, messagesTotal, etc.
 */
export async function getProfile(tokens) {
  return callGmail('getProfile', {}, tokens);
}

/**
 * List emails from inbox
 * @param {Object} tokens - OAuth tokens
 * @param {Object} options - Query options
 * @param {number} [options.maxResults=50] - Max messages to return
 * @param {string} [options.pageToken] - Pagination token
 * @param {string} [options.query] - Gmail search query
 * @returns {Promise<Object>} { messages, nextPageToken, resultSizeEstimate }
 */
export async function listMessages(tokens, options = {}) {
  return callGmail('listMessages', {
    maxResults: options.maxResults || 50,
    pageToken: options.pageToken,
    query: options.query
  }, tokens);
}

/**
 * Get a single email message
 * @param {string} messageId - Gmail message ID
 * @param {Object} tokens - OAuth tokens
 * @param {string} [format='full'] - Format: 'full', 'metadata', 'minimal', 'raw'
 * @returns {Promise<Object>} Full message with headers, body, etc.
 */
export async function getMessage(messageId, tokens, format = 'full') {
  return callGmail('getMessage', { messageId, format }, tokens);
}

/**
 * Get an email thread (conversation)
 * @param {string} threadId - Gmail thread ID
 * @param {Object} tokens - OAuth tokens
 * @param {string} [format='full'] - Format: 'full', 'metadata', 'minimal'
 * @returns {Promise<Object>} Thread with all messages
 */
export async function getThread(threadId, tokens, format = 'full') {
  return callGmail('getThread', { threadId, format }, tokens);
}

/**
 * List Gmail labels
 * @param {Object} tokens - OAuth tokens
 * @returns {Promise<Object>} { labels: [...] }
 */
export async function listLabels(tokens) {
  return callGmail('listLabels', {}, tokens);
}

/**
 * Send an email
 * @param {Object} email - Email data
 * @param {string} email.to - Recipient email
 * @param {string} email.subject - Email subject
 * @param {string} email.body - HTML body
 * @param {string} [email.cc] - CC recipients
 * @param {string} [email.bcc] - BCC recipients
 * @param {string} [email.replyToMessageId] - Message ID to reply to
 * @param {string} [email.threadId] - Thread ID for replies
 * @param {Object} tokens - OAuth tokens
 * @returns {Promise<Object>} Sent message info
 */
export async function sendEmail(email, tokens) {
  if (!email.to || !email.subject || !email.body) {
    throw new Error('To, subject, and body are required');
  }
  
  return callGmail('sendEmail', email, tokens);
}

// ========================================
// SYNC OPERATIONS
// ========================================

/**
 * Sync sent emails for tracked prospects
 * @param {Object} tokens - OAuth tokens
 * @param {Object} options - Sync options
 * @param {number} [options.daysBack=7] - How many days back to sync
 * @param {string[]} [options.prospectEmails] - Filter to these prospect emails
 * @returns {Promise<Object>} { messages: [...] }
 */
export async function syncSentEmails(tokens, options = {}) {
  return callGmail('syncSentEmails', {
    daysBack: options.daysBack || 7,
    prospectEmails: options.prospectEmails || []
  }, tokens);
}

/**
 * Sync received emails from tracked prospects
 * @param {Object} tokens - OAuth tokens
 * @param {Object} options - Sync options
 * @param {number} [options.daysBack=7] - How many days back to sync
 * @param {string[]} [options.prospectEmails] - Filter to these prospect emails
 * @returns {Promise<Object>} { messages: [...] }
 */
export async function syncReceivedEmails(tokens, options = {}) {
  return callGmail('syncReceivedEmails', {
    daysBack: options.daysBack || 7,
    prospectEmails: options.prospectEmails || []
  }, tokens);
}

/**
 * Sync emails for a specific prospect using team account (fromEmail lookup)
 * @param {string} prospectEmail - The prospect's email address
 * @param {string} fromEmail - The team Gmail account to use
 * @param {number} [daysBack=30] - How many days back to sync
 * @returns {Promise<Object>} { sent: [...], received: [...] }
 */
export async function syncEmailsForProspect(prospectEmail, fromEmail, daysBack = 30) {
  try {
    const emailFilter = prospectEmail ? [prospectEmail] : [];
    const [sentResult, receivedResult] = await Promise.all([
      gmailProxyFn({
        action: 'syncSentEmails',
        fromEmail,
        prospectEmails: emailFilter,
        daysBack
      }),
      gmailProxyFn({
        action: 'syncReceivedEmails',
        fromEmail,
        prospectEmails: emailFilter,
        daysBack
      })
    ]);
    
    return {
      sent: sentResult.data?.messages || [],
      received: receivedResult.data?.messages || []
    };
  } catch (error) {
    console.error('Error syncing emails for prospect:', error);
    throw error;
  }
}

/**
 * List recent emails from a connected team account
 * @param {string} fromEmail - The team Gmail account to use
 * @param {number} [maxResults=50] - Max messages to return
 * @returns {Promise<Array>} Array of email objects with parsed headers
 */
export async function listConnectedAccountEmails(fromEmail, maxResults = 50) {
  try {
    // Get list of messages
    const listResult = await gmailProxyFn({
      action: 'listMessages',
      fromEmail,
      maxResults
    });
    
    const messages = listResult.data?.messages || [];
    const emails = [];
    
    // Get details for each message (limit to avoid timeout)
    for (const msg of messages.slice(0, Math.min(25, maxResults))) {
      try {
        const msgResult = await gmailProxyFn({
          action: 'getMessage',
          fromEmail,
          messageId: msg.id,
          format: 'metadata'
        });
        
        const fullMsg = msgResult.data;
        const headers = parseHeaders(fullMsg);
        
        emails.push({
          id: fullMsg.id,
          threadId: fullMsg.threadId,
          labelIds: fullMsg.labelIds,
          from: headers.from,
          to: headers.to,
          subject: headers.subject,
          date: headers.date,
          snippet: fullMsg.snippet
        });
      } catch (e) {
        console.warn('Could not fetch message:', msg.id);
      }
    }
    
    return emails;
  } catch (error) {
    console.error('Error listing account emails:', error);
    throw error;
  }
}

// ========================================
// HELPERS
// ========================================

/**
 * Parse email headers from Gmail message format
 * @param {Object} message - Gmail message object
 * @returns {Object} Parsed headers { from, to, subject, date, etc. }
 */
export function parseHeaders(message) {
  const headers = {};
  const headersList = message?.payload?.headers || [];
  
  headersList.forEach(header => {
    const name = header.name.toLowerCase();
    headers[name] = header.value;
  });
  
  return headers;
}

/**
 * Extract email address from "Name <email>" format
 * @param {string} emailString - Email string like "John Doe <john@example.com>"
 * @returns {string} Just the email address
 */
export function extractEmail(emailString) {
  if (!emailString) return '';
  const match = emailString.match(/<([^>]+)>/);
  return match ? match[1] : emailString.trim();
}

/**
 * Get human-readable date from Gmail timestamp
 * @param {string|number} timestamp - Gmail internalDate (ms since epoch)
 * @returns {string} Formatted date
 */
export function formatTimestamp(timestamp) {
  if (!timestamp) return '';
  const date = new Date(typeof timestamp === 'string' ? parseInt(timestamp) : timestamp);
  return date.toLocaleString();
}

/**
 * Decode base64 URL-safe encoded body
 * @param {string} encodedBody - Base64 URL-safe encoded string
 * @returns {string} Decoded string
 */
export function decodeBody(encodedBody) {
  if (!encodedBody) return '';
  try {
    // Replace URL-safe characters
    const base64 = encodedBody.replace(/-/g, '+').replace(/_/g, '/');
    return atob(base64);
  } catch (e) {
    console.error('Error decoding body:', e);
    return '';
  }
}

/**
 * Extract plain text body from message
 * @param {Object} message - Gmail message object
 * @returns {string} Plain text body content
 */
export function extractTextBody(message) {
  const parts = message?.payload?.parts || [];
  
  // Look for text/plain part
  for (const part of parts) {
    if (part.mimeType === 'text/plain' && part.body?.data) {
      return decodeBody(part.body.data);
    }
    // Recursively check nested parts
    if (part.parts) {
      for (const subPart of part.parts) {
        if (subPart.mimeType === 'text/plain' && subPart.body?.data) {
          return decodeBody(subPart.body.data);
        }
      }
    }
  }
  
  // Fallback: try the payload body directly
  if (message?.payload?.body?.data) {
    return decodeBody(message.payload.body.data);
  }
  
  // Use snippet as last resort
  return message?.snippet || '';
}

/**
 * Extract HTML body from message
 * @param {Object} message - Gmail message object
 * @returns {string} HTML body content
 */
export function extractHtmlBody(message) {
  const parts = message?.payload?.parts || [];
  
  // Look for text/html part
  for (const part of parts) {
    if (part.mimeType === 'text/html' && part.body?.data) {
      return decodeBody(part.body.data);
    }
    if (part.parts) {
      for (const subPart of part.parts) {
        if (subPart.mimeType === 'text/html' && subPart.body?.data) {
          return decodeBody(subPart.body.data);
        }
      }
    }
  }
  
  return '';
}

// ========================================
// TEAM ACCOUNT OPERATIONS
// ========================================

/**
 * Send an email using a team account (tokens looked up server-side)
 * @param {Object} email - Email data
 * @param {string} email.to - Recipient email
 * @param {string} email.subject - Email subject
 * @param {string} email.body - HTML body
 * @param {string} email.cc - CC recipients (optional)
 * @param {string} email.bcc - BCC recipients (optional)
 * @param {string} fromEmail - The team Gmail account to send from
 * @returns {Promise<Object>} Sent message info
 */
export async function sendEmailAsTeamAccount(email, fromEmail) {
  if (!email.to || !email.subject || !email.body) {
    throw new Error('To, subject, and body are required');
  }
  
  if (!fromEmail) {
    throw new Error('From email address is required');
  }
  
  try {
    const result = await gmailProxyFn({
      action: 'sendEmail',
      fromEmail,
      to: email.to,
      subject: email.subject,
      body: email.body,
      cc: email.cc,
      bcc: email.bcc
    });
    return result.data;
  } catch (error) {
    console.error('Error sending email via team account:', error);
    throw new Error(error.message || 'Failed to send email');
  }
}

export default {
  // OAuth
  getOAuthUrl,
  listConnectedAccounts,
  
  // Operations
  getProfile,
  listMessages,
  getMessage,
  getThread,
  listLabels,
  sendEmail,
  sendEmailAsTeamAccount,
  
  // Sync
  syncSentEmails,
  syncReceivedEmails,
  syncEmailsForProspect,
  listConnectedAccountEmails,
  
  // Helpers
  parseHeaders,
  extractEmail,
  formatTimestamp,
  decodeBody,
  extractTextBody,
  extractHtmlBody
};
