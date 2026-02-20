/**
 * Gmail Integration Store
 * 
 * Manages state for Gmail OAuth connection at TEAM level.
 * All admins can see and use connected Gmail accounts for sending.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { collection, getDocs, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import toast from 'react-hot-toast';
import * as gmail from '../lib/gmail';

export const useGmailStore = create(
  persist(
    (set, get) => ({
      // Team-level connected accounts
      connectedAccounts: [],
      accountsLoaded: false,
      accountsLoading: false,
      
      // Legacy single-user state (kept for backward compat)
      accessToken: '',
      refreshToken: '',
      connectedEmail: '',
      connectedAt: null,
      tokensLoaded: false,
      isConnected: false,
      isConnecting: false,
      connectionError: null,
      lastSyncAt: null,
      syncing: false,
      syncError: null,
      recentEmails: [],
      emailsLoading: false,
      
      // ========================================
      // TEAM-LEVEL ACCOUNT MANAGEMENT
      // ========================================
      
      /**
       * Load all connected Gmail accounts (team-level)
       */
      loadConnectedAccounts: async () => {
        set({ accountsLoading: true });
        try {
          const accounts = await gmail.listConnectedAccounts();
          set({
            connectedAccounts: accounts,
            accountsLoaded: true,
            accountsLoading: false,
            // Update legacy state based on accounts
            isConnected: accounts.length > 0,
            tokensLoaded: true
          });
        } catch (error) {
          console.error('Error loading Gmail accounts:', error);
          set({ accountsLoaded: true, accountsLoading: false });
        }
      },
      
      /**
       * Load Gmail tokens from user's settings in Firestore (legacy)
       */
      loadTokens: async (userId) => {
        // Now just loads team accounts
        await get().loadConnectedAccounts();
      },
      
      /**
       * Get the OAuth URL to start Gmail connection (async)
       */
      getConnectUrl: async (userId) => {
        return await gmail.getOAuthUrl(userId);
      },
      
      /**
       * Disconnect a Gmail account (team-level)
       */
      disconnectAccount: async (emailDocId) => {
        try {
          const accountRef = doc(db, 'team_settings', 'gmail_accounts', 'accounts', emailDocId);
          await deleteDoc(accountRef);
          
          // Refresh the list
          await get().loadConnectedAccounts();
          toast.success('Gmail account disconnected');
        } catch (error) {
          console.error('Error disconnecting Gmail:', error);
          toast.error('Failed to disconnect account');
        }
      },
      
      /**
       * Legacy disconnect (single user)
       */
      disconnect: async (userId) => {
        // No longer used for team accounts
        console.warn('Use disconnectAccount for team accounts');
      },
      
      /**
       * Get current OAuth tokens
       */
      getTokens: () => ({
        accessToken: get().accessToken,
        refreshToken: get().refreshToken
      }),
      
      /**
       * Update access token (called when token is refreshed)
       */
      updateAccessToken: async (userId, newAccessToken) => {
        set({ accessToken: newAccessToken });
        
        if (userId) {
          try {
            const settingsRef = doc(db, 'users', userId, 'settings', 'gmail');
            await setDoc(settingsRef, {
              accessToken: newAccessToken,
              tokenUpdatedAt: new Date().toISOString()
            }, { merge: true });
          } catch (error) {
            console.error('Error updating access token:', error);
          }
        }
      },
      
      // ========================================
      // EMAIL OPERATIONS
      // ========================================
      
      /**
       * Get the connected user's Gmail profile
       */
      fetchProfile: async () => {
        const tokens = get().getTokens();
        if (!tokens.refreshToken) return null;
        
        try {
          const profile = await gmail.getProfile(tokens);
          set({ connectedEmail: profile.emailAddress });
          return profile;
        } catch (error) {
          console.error('Error fetching Gmail profile:', error);
          if (error.message?.includes('expired') || error.message?.includes('reconnect')) {
            set({ isConnected: false, connectionError: 'Token expired' });
          }
          return null;
        }
      },
      
      /**
       * Fetch recent emails from inbox
       */
      fetchRecentEmails: async (maxResults = 20) => {
        const tokens = get().getTokens();
        if (!tokens.refreshToken) return [];
        
        set({ emailsLoading: true });
        
        try {
          const result = await gmail.listMessages(tokens, { maxResults });
          
          // Get full details for each message
          const emails = [];
          for (const msg of (result.messages || []).slice(0, 10)) {
            try {
              const fullMsg = await gmail.getMessage(msg.id, tokens, 'metadata');
              const headers = gmail.parseHeaders(fullMsg);
              emails.push({
                id: msg.id,
                threadId: fullMsg.threadId,
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
          
          set({ recentEmails: emails, emailsLoading: false });
          return emails;
        } catch (error) {
          console.error('Error fetching recent emails:', error);
          set({ emailsLoading: false });
          return [];
        }
      },
      
      /**
       * Get a specific email thread
       */
      getThread: async (threadId) => {
        const tokens = get().getTokens();
        if (!tokens.refreshToken || !threadId) return null;
        
        try {
          return await gmail.getThread(threadId, tokens);
        } catch (error) {
          console.error('Error fetching thread:', error);
          return null;
        }
      },
      
      /**
       * Send an email
       */
      sendEmail: async (emailData) => {
        const tokens = get().getTokens();
        if (!tokens.refreshToken) {
          throw new Error('Gmail not connected. Please connect Gmail in Settings.');
        }
        
        try {
          const result = await gmail.sendEmail(emailData, tokens);
          toast.success('Email sent');
          return result;
        } catch (error) {
          console.error('Error sending email:', error);
          toast.error('Failed to send email');
          throw error;
        }
      },
      
      // ========================================
      // SYNC OPERATIONS
      // ========================================
      
      /**
       * Sync emails for tracked prospects
       */
      syncEmails: async (prospectEmails = [], daysBack = 7) => {
        const tokens = get().getTokens();
        if (!tokens.refreshToken) return { sent: [], received: [] };
        
        set({ syncing: true, syncError: null });
        
        try {
          const [sentResult, receivedResult] = await Promise.all([
            gmail.syncSentEmails(tokens, { prospectEmails, daysBack }),
            gmail.syncReceivedEmails(tokens, { prospectEmails, daysBack })
          ]);
          
          set({
            syncing: false,
            lastSyncAt: new Date().toISOString()
          });
          
          return {
            sent: sentResult.messages || [],
            received: receivedResult.messages || []
          };
        } catch (error) {
          console.error('Error syncing emails:', error);
          set({ syncing: false, syncError: error.message });
          return { sent: [], received: [] };
        }
      },
      
      /**
       * Clear sync data
       */
      clearSyncData: () => {
        set({
          recentEmails: [],
          lastSyncAt: null,
          syncError: null
        });
      }
    }),
    {
      name: 'gmail-storage',
      partialize: (state) => ({
        // Only persist connection status, not tokens (those come from Firestore)
        connectedEmail: state.connectedEmail,
        lastSyncAt: state.lastSyncAt
      })
    }
  )
);

export default useGmailStore;
