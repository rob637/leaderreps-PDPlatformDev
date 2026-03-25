/**
 * LinkedHelper API Client
 * 
 * Handles all interactions with LinkedHelper 2 for LinkedIn automation.
 * API calls are proxied through Cloud Functions to keep the API key secure.
 * 
 * API Docs: https://docs.linkedhelper.com/api/
 */

import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from './firebase';

// Initialize Firebase Functions
const functions = getFunctions(app, 'us-central1');

// Cloud Function callables
const linkedHelperProxyFn = httpsCallable(functions, 'linkedHelperProxy');
const linkedHelperQueueAddFn = httpsCallable(functions, 'linkedHelperQueueAdd');

/**
 * Base API wrapper for LinkedHelper operations
 * All calls are routed through our secure Cloud Function proxy
 * @param {string} action - The action to perform
 * @param {Object} payload - The payload for the action
 * @param {string} apiKey - The LinkedHelper API key (from user settings)
 */
async function callLinkedHelper(action, payload = {}, apiKey = null) {
  if (!apiKey) {
    throw new Error('LinkedHelper API key is required. Please configure it in Settings.');
  }
  
  try {
    const result = await linkedHelperProxyFn({ action, apiKey, ...payload });
    return result.data;
  } catch (error) {
    console.error(`LinkedHelper API error (${action}):`, error);
    throw new Error(error.message || `Failed to ${action}`);
  }
}

// ========================================
// CAMPAIGN OPERATIONS
// ========================================

/**
 * List all campaigns in LinkedHelper
 * @param {string} apiKey - LinkedHelper API key
 * @returns {Promise<Array>} List of campaigns with id, name, status
 */
export async function listCampaigns(apiKey) {
  return callLinkedHelper('listCampaigns', {}, apiKey);
}

/**
 * Get campaign details
 * @param {string} campaignId - The LinkedHelper campaign ID
 * @param {string} apiKey - LinkedHelper API key
 * @returns {Promise<Object>} Campaign details
 */
export async function getCampaign(campaignId, apiKey) {
  return callLinkedHelper('getCampaign', { campaignId }, apiKey);
}

/**
 * Get campaign statistics
 * @param {string} campaignId - The LinkedHelper campaign ID
 * @param {string} apiKey - LinkedHelper API key
 * @returns {Promise<Object>} Campaign stats (sent, connected, replied)
 */
export async function getCampaignStats(campaignId, apiKey) {
  return callLinkedHelper('getCampaignStats', { campaignId }, apiKey);
}

// ========================================
// CONTACT OPERATIONS
// ========================================

/**
 * Add a single contact to a campaign
 * @param {string} campaignId - Target LinkedHelper campaign
 * @param {Object} contact - Contact data
 * @param {string} contact.linkedinUrl - Required: LinkedIn profile URL
 * @param {string} [contact.firstName] - First name
 * @param {string} [contact.lastName] - Last name
 * @param {string} [contact.company] - Company name
 * @param {string} [contact.title] - Job title
 * @param {string} [contact.email] - Email address
 * @param {Object} [contact.customData] - Custom data for personalization
 * @param {string} apiKey - LinkedHelper API key
 * @returns {Promise<Object>} Result with contact status
 */
export async function addContactToCampaign(campaignId, contact, apiKey) {
  if (!campaignId) throw new Error('Campaign ID is required');
  if (!contact?.linkedinUrl && !contact?.linkedin) {
    throw new Error('LinkedIn URL is required');
  }
  
  return callLinkedHelper('addContact', {
    campaignId,
    contact: {
      linkedinUrl: contact.linkedinUrl || contact.linkedin,
      firstName: contact.firstName || '',
      lastName: contact.lastName || '',
      company: contact.company || '',
      title: contact.title || '',
      email: contact.email || '',
      customData: contact.customData || {}
    }
  }, apiKey);
}

/**
 * Add multiple contacts to a campaign (batch)
 * @param {string} campaignId - Target LinkedHelper campaign  
 * @param {Array<Object>} contacts - Array of contact objects
 * @param {string} apiKey - LinkedHelper API key
 * @returns {Promise<Object>} Result with success/failure counts
 */
export async function addContactsToCampaign(campaignId, contacts, apiKey) {
  if (!campaignId) throw new Error('Campaign ID is required');
  if (!contacts?.length) throw new Error('At least one contact is required');
  
  const formattedContacts = contacts.map(contact => ({
    linkedinUrl: contact.linkedinUrl || contact.linkedin,
    firstName: contact.firstName || contact.name?.split(' ')[0] || '',
    lastName: contact.lastName || contact.name?.split(' ').slice(1).join(' ') || '',
    company: contact.company || '',
    title: contact.title || '',
    email: contact.email || '',
    customData: contact.customData || {}
  }));
  
  return callLinkedHelper('addContacts', { campaignId, contacts: formattedContacts }, apiKey);
}

/**
 * Get contact status from LinkedHelper
 * @param {Object} params - Search params
 * @param {string} [params.linkedinUrl] - LinkedIn URL to look up
 * @param {string} [params.email] - Email to look up
 * @param {string} apiKey - LinkedHelper API key
 * @returns {Promise<Object|null>} Contact status or null if not found
 */
export async function getContactStatus({ linkedinUrl, email }, apiKey) {
  if (!linkedinUrl && !email) throw new Error('LinkedIn URL or email is required');
  return callLinkedHelper('getContactStatus', { linkedinUrl, email }, apiKey);
}

/**
 * Get contacts from a campaign with their status
 * @param {string} campaignId - Campaign ID
 * @param {Object} options - Query options
 * @param {number} [options.limit=100] - Max contacts to return
 * @param {number} [options.offset=0] - Offset for pagination
 * @param {string} [options.status] - Filter by status
 * @param {string} apiKey - LinkedHelper API key
 * @returns {Promise<Array>} List of contacts with status
 */
export async function getCampaignContacts(campaignId, options = {}, apiKey) {
  return callLinkedHelper('getCampaignContacts', {
    campaignId,
    limit: options.limit || 100,
    offset: options.offset || 0,
    status: options.status || null
  }, apiKey);
}

/**
 * Update a contact's status in a campaign
 * @param {string} campaignId - Campaign ID
 * @param {string} contactId - Contact ID
 * @param {string} status - New status
 * @param {string} apiKey - LinkedHelper API key
 * @returns {Promise<Object>} Result
 */
export async function updateContactStatus(campaignId, contactId, status, apiKey) {
  return callLinkedHelper('updateContactStatus', { campaignId, contactId, status }, apiKey);
}

/**
 * Remove a contact from a campaign
 * @param {string} campaignId - Campaign ID
 * @param {string} contactId - Contact ID
 * @param {string} apiKey - LinkedHelper API key
 * @returns {Promise<Object>} Result
 */
export async function removeContact(campaignId, contactId, apiKey) {
  return callLinkedHelper('removeContact', { campaignId, contactId }, apiKey);
}

/**
 * Sync campaign results (for bulk status updates)
 * @param {string} campaignId - Campaign ID
 * @param {string} [since] - ISO date string to get updates since
 * @param {string} apiKey - LinkedHelper API key
 * @returns {Promise<Object>} Updated contacts
 */
export async function syncCampaignResults(campaignId, since = null, apiKey) {
  return callLinkedHelper('syncCampaignResults', { campaignId, since }, apiKey);
}

// ========================================
// QUEUE OPERATIONS (Chrome Extension Bridge)
// ========================================

/**
 * Add a prospect to the LinkedHelper queue.
 * Instead of calling LinkedHelper API directly (which requires localhost access),
 * we queue the request for the Chrome extension to process.
 * 
 * @param {string} prospectId - The prospect's Firestore document ID
 * @param {string} campaignId - Target LinkedHelper campaign ID
 * @param {string} campaignName - Campaign name (for display)
 * @returns {Promise<Object>} Queue item with ID
 */
export async function queueProspectPush(prospectId, campaignId, campaignName = null) {
  if (!prospectId) throw new Error('Prospect ID is required');
  if (!campaignId) throw new Error('Campaign ID is required');
  
  try {
    const result = await linkedHelperQueueAddFn({ prospectId, campaignId, campaignName });
    return result.data;
  } catch (error) {
    console.error('Failed to queue prospect for LinkedHelper:', error);
    throw new Error(error.message || 'Failed to add to queue');
  }
}

/**
 * Add multiple prospects to the LinkedHelper queue
 * @param {Array<string>} prospectIds - Array of prospect IDs
 * @param {string} campaignId - Target LinkedHelper campaign ID
 * @param {string} campaignName - Campaign name (for display)
 * @returns {Promise<Object>} Results with success/failure counts
 */
export async function queueProspectsPush(prospectIds, campaignId, campaignName = null) {
  if (!prospectIds?.length) throw new Error('At least one prospect ID is required');
  if (!campaignId) throw new Error('Campaign ID is required');
  
  const results = {
    queued: 0,
    failed: 0,
    errors: []
  };
  
  // Queue each prospect (could batch this in future)
  for (const prospectId of prospectIds) {
    try {
      await linkedHelperQueueAddFn({ prospectId, campaignId, campaignName });
      results.queued++;
    } catch (error) {
      results.failed++;
      results.errors.push({ prospectId, error: error.message });
    }
  }
  
  return results;
}

// ========================================
// SYNC HELPERS
// ========================================

/**
 * Map prospect data to LinkedHelper contact format
 * @param {Object} prospect - Prospect from Firestore
 * @returns {Object} Formatted contact for LinkedHelper
 */
export function prospectToLinkedHelperContact(prospect) {
  // Split name into first/last if not already split
  let firstName = prospect.firstName || '';
  let lastName = prospect.lastName || '';
  
  if (!firstName && prospect.name) {
    const parts = prospect.name.trim().split(' ');
    firstName = parts[0] || '';
    lastName = parts.slice(1).join(' ') || '';
  }
  
  return {
    linkedinUrl: prospect.linkedin || prospect.linkedinUrl || '',
    firstName,
    lastName,
    company: prospect.company || '',
    title: prospect.title || '',
    email: prospect.email || '',
    customData: {
      prospect_id: prospect.id,
      source: 'team-sales-hub'
    }
  };
}

/**
 * Map LinkedHelper status to our terminology
 */
export const LINKEDHELPER_STATUS_MAP = {
  pending: 'Invite Sent',
  connected: 'Connected',
  messaged: 'Messaged',
  replied: 'Replied',
  declined: 'Declined',
  withdrawn: 'Withdrawn',
  visited: 'Profile Visited',
  queued: 'Queued',
  processing: 'Processing',
  error: 'Error'
};

/**
 * Get human-readable status label
 * @param {string} status - LinkedHelper status
 * @returns {string} Human-readable label
 */
export function getStatusLabel(status) {
  return LINKEDHELPER_STATUS_MAP[status] || status || 'Unknown';
}

/**
 * Get status color for UI
 * @param {string} status - LinkedHelper status
 * @returns {string} Tailwind color classes
 */
export function getStatusColor(status) {
  const colors = {
    pending: 'bg-yellow-100 text-yellow-700',
    queued: 'bg-slate-100 text-slate-600',
    processing: 'bg-blue-100 text-blue-700',
    connected: 'bg-green-100 text-green-700',
    messaged: 'bg-indigo-100 text-indigo-700',
    replied: 'bg-emerald-100 text-emerald-700',
    declined: 'bg-red-100 text-red-700',
    withdrawn: 'bg-orange-100 text-orange-700',
    visited: 'bg-purple-100 text-purple-700',
    error: 'bg-red-100 text-red-700'
  };
  return colors[status] || 'bg-gray-100 text-gray-700';
}

/**
 * Get status icon name
 * @param {string} status - LinkedHelper status
 * @returns {string} Lucide icon name
 */
export function getStatusIcon(status) {
  const icons = {
    pending: 'Send',
    queued: 'Clock',
    processing: 'Loader2',
    connected: 'UserCheck',
    messaged: 'MessageCircle',
    replied: 'MessageSquare',
    declined: 'UserX',
    withdrawn: 'Undo2',
    visited: 'Eye',
    error: 'AlertCircle'
  };
  return icons[status] || 'HelpCircle';
}

export default {
  // Campaigns
  listCampaigns,
  getCampaign,
  getCampaignStats,
  
  // Contacts
  addContactToCampaign,
  addContactsToCampaign,
  getContactStatus,
  getCampaignContacts,
  updateContactStatus,
  removeContact,
  syncCampaignResults,
  
  // Helpers
  prospectToLinkedHelperContact,
  getStatusLabel,
  getStatusColor,
  getStatusIcon
};
