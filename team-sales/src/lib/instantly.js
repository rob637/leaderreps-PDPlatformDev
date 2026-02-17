/**
 * Instantly.ai API Client
 * 
 * Handles all interactions with the Instantly.ai cold email platform.
 * API calls are proxied through Cloud Functions to keep the API key secure.
 * 
 * API Docs: https://developer.instantly.ai/
 */

import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from './firebase';

// Initialize Firebase Functions
const functions = getFunctions(app, 'us-central1');

// Cloud Function callables
const instantlyProxyFn = httpsCallable(functions, 'instantlyProxy');

/**
 * Base API wrapper for Instantly operations
 * All calls are routed through our secure Cloud Function proxy
 * @param {string} action - The action to perform
 * @param {Object} payload - The payload for the action
 * @param {string} apiKey - The Instantly API key (from user settings)
 */
async function callInstantly(action, payload = {}, apiKey = null) {
  if (!apiKey) {
    throw new Error('Instantly API key is required. Please configure it in Settings.');
  }
  
  try {
    const result = await instantlyProxyFn({ action, apiKey, ...payload });
    return result.data;
  } catch (error) {
    console.error(`Instantly API error (${action}):`, error);
    throw new Error(error.message || `Failed to ${action}`);
  }
}

// ========================================
// CAMPAIGN OPERATIONS
// ========================================

/**
 * List all campaigns in Instantly account
 * @param {string} apiKey - Instantly API key
 * @returns {Promise<Array>} List of campaigns with id, name, status
 */
export async function listCampaigns(apiKey) {
  return callInstantly('listCampaigns', {}, apiKey);
}

/**
 * Get campaign details including stats
 * @param {string} campaignId - The Instantly campaign ID
 * @param {string} apiKey - Instantly API key
 * @returns {Promise<Object>} Campaign details
 */
export async function getCampaign(campaignId, apiKey) {
  return callInstantly('getCampaign', { campaignId }, apiKey);
}

/**
 * Get campaign analytics
 * @param {string} campaignId - The Instantly campaign ID
 * @param {string} apiKey - Instantly API key
 * @returns {Promise<Object>} Campaign analytics (sent, opened, replied, bounced)
 */
export async function getCampaignAnalytics(campaignId, apiKey) {
  return callInstantly('getCampaignAnalytics', { campaignId }, apiKey);
}

// ========================================
// LEAD OPERATIONS
// ========================================

/**
 * Add a single lead to a campaign
 * @param {string} campaignId - Target Instantly campaign
 * @param {Object} lead - Lead data
 * @param {string} lead.email - Required: Lead email
 * @param {string} [lead.firstName] - First name
 * @param {string} [lead.lastName] - Last name
 * @param {string} [lead.companyName] - Company name
 * @param {string} [lead.title] - Job title
 * @param {string} [lead.phone] - Phone number
 * @param {string} [lead.linkedin] - LinkedIn URL
 * @param {Object} [lead.customVariables] - Custom variables for email personalization
 * @param {string} apiKey - Instantly API key
 * @returns {Promise<Object>} Result with lead status
 */
export async function addLeadToCampaign(campaignId, lead, apiKey) {
  if (!campaignId) throw new Error('Campaign ID is required');
  if (!lead?.email) throw new Error('Lead email is required');
  
  return callInstantly('addLead', {
    campaignId,
    lead: {
      email: lead.email,
      first_name: lead.firstName || '',
      last_name: lead.lastName || '',
      company_name: lead.companyName || lead.company || '',
      personalization: lead.title || '',
      phone: lead.phone || '',
      website: lead.linkedin || '',
      custom_variables: lead.customVariables || {}
    }
  }, apiKey);
}

/**
 * Add multiple leads to a campaign (batch)
 * @param {string} campaignId - Target Instantly campaign  
 * @param {Array<Object>} leads - Array of lead objects
 * @param {string} apiKey - Instantly API key
 * @returns {Promise<Object>} Result with success/failure counts
 */
export async function addLeadsToCampaign(campaignId, leads, apiKey) {
  if (!campaignId) throw new Error('Campaign ID is required');
  if (!leads?.length) throw new Error('At least one lead is required');
  
  const formattedLeads = leads.map(lead => ({
    email: lead.email,
    first_name: lead.firstName || lead.name?.split(' ')[0] || '',
    last_name: lead.lastName || lead.name?.split(' ').slice(1).join(' ') || '',
    company_name: lead.companyName || lead.company || '',
    personalization: lead.title || '',
    phone: lead.phone || '',
    website: lead.linkedin || '',
    custom_variables: lead.customVariables || {}
  }));
  
  return callInstantly('addLeads', { campaignId, leads: formattedLeads }, apiKey);
}

/**
 * Get lead status from Instantly
 * @param {string} email - Lead email to look up
 * @param {string} apiKey - Instantly API key
 * @returns {Promise<Object|null>} Lead status or null if not found
 */
export async function getLeadStatus(email, apiKey) {
  if (!email) throw new Error('Email is required');
  return callInstantly('getLeadStatus', { email }, apiKey);
}

/**
 * Get leads from a campaign with their status
 * @param {string} campaignId - Campaign ID
 * @param {Object} options - Query options
 * @param {number} [options.limit=100] - Max leads to return
 * @param {number} [options.skip=0] - Offset for pagination
 * @param {string} apiKey - Instantly API key
 * @returns {Promise<Array>} List of leads with status
 */
export async function getCampaignLeads(campaignId, options = {}, apiKey) {
  return callInstantly('getCampaignLeads', {
    campaignId,
    limit: options.limit || 100,
    skip: options.skip || 0
  }, apiKey);
}

/**
 * Pause a lead in a campaign (stop sending emails)
 * @param {string} campaignId - Campaign ID
 * @param {string} email - Lead email
 * @param {string} apiKey - Instantly API key
 * @returns {Promise<Object>} Result
 */
export async function pauseLead(campaignId, email, apiKey) {
  return callInstantly('pauseLead', { campaignId, email }, apiKey);
}

/**
 * Resume a paused lead in a campaign
 * @param {string} campaignId - Campaign ID
 * @param {string} email - Lead email
 * @param {string} apiKey - Instantly API key
 * @returns {Promise<Object>} Result
 */
export async function resumeLead(campaignId, email, apiKey) {
  return callInstantly('resumeLead', { campaignId, email }, apiKey);
}

/**
 * Remove a lead from a campaign
 * @param {string} campaignId - Campaign ID
 * @param {string} email - Lead email
 * @param {string} apiKey - Instantly API key
 * @returns {Promise<Object>} Result
 */
export async function removeLead(campaignId, email, apiKey) {
  return callInstantly('removeLead', { campaignId, email }, apiKey);
}

// ========================================
// SYNC HELPERS
// ========================================

/**
 * Map prospect data to Instantly lead format
 * @param {Object} prospect - Prospect from Firestore
 * @returns {Object} Formatted lead for Instantly
 */
export function prospectToInstantlyLead(prospect) {
  // Split name into first/last if not already split
  let firstName = prospect.firstName || '';
  let lastName = prospect.lastName || '';
  
  if (!firstName && prospect.name) {
    const parts = prospect.name.trim().split(' ');
    firstName = parts[0] || '';
    lastName = parts.slice(1).join(' ') || '';
  }
  
  return {
    email: prospect.email,
    firstName,
    lastName,
    companyName: prospect.company || '',
    title: prospect.title || '',
    phone: prospect.phone || '',
    linkedin: prospect.linkedin || '',
    customVariables: {
      prospect_id: prospect.id,
      source: 'team-sales-hub'
    }
  };
}

/**
 * Map Instantly status to our pipeline terminology
 */
export const INSTANTLY_STATUS_MAP = {
  active: 'In Sequence',
  paused: 'Paused',
  completed: 'Sequence Complete',
  bounced: 'Bounced',
  replied: 'Replied',
  unsubscribed: 'Unsubscribed',
  interested: 'Interested',
  not_interested: 'Not Interested',
  meeting_booked: 'Meeting Booked'
};

/**
 * Get human-readable status label
 * @param {string} status - Instantly status
 * @returns {string} Human-readable label
 */
export function getStatusLabel(status) {
  return INSTANTLY_STATUS_MAP[status] || status || 'Unknown';
}

/**
 * Get status color for UI
 * @param {string} status - Instantly status
 * @returns {string} Tailwind color classes
 */
export function getStatusColor(status) {
  const colors = {
    active: 'bg-blue-100 text-blue-700',
    paused: 'bg-yellow-100 text-yellow-700',
    completed: 'bg-gray-100 text-gray-700',
    bounced: 'bg-red-100 text-red-700',
    replied: 'bg-green-100 text-green-700',
    unsubscribed: 'bg-orange-100 text-orange-700',
    interested: 'bg-emerald-100 text-emerald-700',
    not_interested: 'bg-slate-100 text-slate-700',
    meeting_booked: 'bg-purple-100 text-purple-700'
  };
  return colors[status] || 'bg-gray-100 text-gray-700';
}

export default {
  // Campaigns
  listCampaigns,
  getCampaign,
  getCampaignAnalytics,
  
  // Leads
  addLeadToCampaign,
  addLeadsToCampaign,
  getLeadStatus,
  getCampaignLeads,
  pauseLead,
  resumeLead,
  removeLead,
  
  // Helpers
  prospectToInstantlyLead,
  getStatusLabel,
  getStatusColor
};
