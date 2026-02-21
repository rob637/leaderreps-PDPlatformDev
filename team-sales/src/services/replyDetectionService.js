/**
 * Reply Detection Service
 * 
 * Scans Gmail for replies from prospects and auto-logs them as activities.
 * Uses the team Gmail accounts to check for incoming emails from prospect addresses.
 */

import * as gmail from '../lib/gmail';
import { collection, query, where, getDocs, addDoc, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';

// Use same collection as the rest of the app
const ACTIVITIES_COLLECTION = 'outreach_activities';

/**
 * Check for replies from prospects
 * @param {string} fromEmail - The team Gmail account to check
 * @param {number} daysBack - How many days back to check
 * @returns {Promise<Object>} { newReplies: number, processed: number }
 */
export async function checkForReplies(fromEmail, daysBack = 7) {
  // Get all prospects with email addresses directly from Firestore
  // (can't rely on Zustand store being populated on every page)
  const prospectsSnap = await getDocs(collection(db, 'corporate_prospects'));
  const prospectsWithEmail = [];
  prospectsSnap.forEach(doc => {
    const data = doc.data();
    if (data.email) {
      prospectsWithEmail.push({ id: doc.id, ...data });
    }
  });
  
  if (prospectsWithEmail.length === 0) {
    return { newReplies: 0, processed: 0, message: 'No prospects with emails' };
  }
  
  // Get email addresses to check
  const prospectEmails = prospectsWithEmail.map(p => p.email.toLowerCase());
  
  // Build a lookup map: email -> prospect
  const emailToProspect = {};
  prospectsWithEmail.forEach(p => {
    emailToProspect[p.email.toLowerCase()] = p;
  });
  
  // Sync received emails from Gmail
  const result = await gmail.syncEmailsForProspect('', fromEmail, daysBack);
  const receivedEmails = result.received || [];
  
  let newReplies = 0;
  let processed = 0;
  
  // Process each received email
  for (const email of receivedEmails) {
    const headers = gmail.parseHeaders(email);
    const fromAddress = gmail.extractEmail(headers.from || '');
    
    if (!fromAddress) continue;
    
    // Check if this is from a known prospect
    const matchedProspect = emailToProspect[fromAddress.toLowerCase()];
    if (!matchedProspect) continue;
    
    processed++;
    
    // Check if we've already logged this email (by Gmail message ID)
    const existingActivity = await checkExistingActivity(email.id, matchedProspect.id);
    if (existingActivity) continue;
    
    // Log the reply as an activity
    await logReplyActivity({
      prospect: matchedProspect,
      email,
      headers,
      fromEmail
    });
    
    newReplies++;
  }
  
  return { 
    newReplies, 
    processed,
    total: receivedEmails.length,
    message: newReplies > 0 
      ? `Found ${newReplies} new ${newReplies === 1 ? 'reply' : 'replies'}!`
      : 'No new replies found'
  };
}

/**
 * Check if an activity already exists for this Gmail message
 */
async function checkExistingActivity(gmailMessageId, prospectId) {
  try {
    const q = query(
      collection(db, ACTIVITIES_COLLECTION),
      where('prospectId', '==', prospectId),
      where('gmailMessageId', '==', gmailMessageId),
      limit(1)
    );
    const snapshot = await getDocs(q);
    return !snapshot.empty;
  } catch (error) {
    console.error('Error checking existing activity:', error);
    return false;
  }
}

/**
 * Log a reply as an activity
 */
async function logReplyActivity({ prospect, email, headers, fromEmail }) {
  const subject = headers.subject || '(No subject)';
  const date = headers.date ? new Date(headers.date) : new Date();
  
  const activity = {
    prospectId: prospect.id,
    prospectEmail: prospect.email,
    prospectName: prospect.name || `${prospect.firstName} ${prospect.lastName}`.trim(),
    channel: 'email',
    outcome: 'replied',
    type: 'email_received',
    content: `Reply received: "${subject}"\n\n${email.snippet || ''}`,
    subject,
    gmailMessageId: email.id,
    gmailThreadId: email.threadId,
    fromEmail: headers.from,
    toEmail: fromEmail,
    createdAt: date.toISOString(),
    userEmail: 'system@leaderreps.com',
    userName: 'Reply Detection',
    isAutoDetected: true
  };
  
  try {
    await addDoc(collection(db, ACTIVITIES_COLLECTION), activity);
    console.log(`Logged reply from ${prospect.name}: ${subject}`);
  } catch (error) {
    console.error('Error logging reply activity:', error);
  }
}

/**
 * Check replies for all connected Gmail accounts
 * @param {number} daysBack - How many days back to check
 * @returns {Promise<Object>} Summary of all accounts checked
 */
export async function checkAllAccountsForReplies(daysBack = 7) {
  // Get connected accounts
  const accounts = await gmail.listConnectedAccounts();
  
  if (accounts.length === 0) {
    return { 
      accounts: 0, 
      newReplies: 0, 
      message: 'No Gmail accounts connected' 
    };
  }
  
  let totalNewReplies = 0;
  let totalProcessed = 0;
  const results = [];
  
  for (const account of accounts) {
    try {
      const result = await checkForReplies(account.email, daysBack);
      totalNewReplies += result.newReplies;
      totalProcessed += result.processed;
      results.push({ account: account.email, ...result });
    } catch (error) {
      console.error(`Error checking replies for ${account.email}:`, error);
      results.push({ account: account.email, error: error.message });
    }
  }
  
  return {
    accounts: accounts.length,
    newReplies: totalNewReplies,
    processed: totalProcessed,
    results,
    message: totalNewReplies > 0
      ? `Found ${totalNewReplies} new ${totalNewReplies === 1 ? 'reply' : 'replies'} across ${accounts.length} account${accounts.length !== 1 ? 's' : ''}`
      : `Checked ${accounts.length} account${accounts.length !== 1 ? 's' : ''}, no new replies`
  };
}

export default {
  checkForReplies,
  checkAllAccountsForReplies
};
