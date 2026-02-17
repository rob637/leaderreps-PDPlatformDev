/**
 * LinkedHelper Integration Store
 * 
 * Manages state for LinkedHelper campaigns, contact sync status, and integration settings.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import toast from 'react-hot-toast';
import * as linkedHelper from '../lib/linkedHelper';

export const useLinkedHelperStore = create(
  persist(
    (set, get) => ({
      // API Key management
      apiKey: '',
      apiKeyLoaded: false,
      
      // State
      campaigns: [],
      campaignsLoading: false,
      campaignsError: null,
      selectedCampaignId: null,
      
      // Sync status for prospects (keyed by prospect ID)
      // { [prospectId]: { campaignId, contactId, status, lastSyncAt, linkedinUrl } }
      syncStatus: {},
      
      // Modal state
      showPushModal: false,
      pushModalProspects: [], // Prospects selected for push
      
      // ========================================
      // API KEY MANAGEMENT
      // ========================================
      
      /**
       * Load API key from user's settings in Firestore
       */
      loadApiKey: async (userId) => {
        if (!userId) {
          set({ apiKeyLoaded: true });
          return;
        }
        
        try {
          const settingsRef = doc(db, 'users', userId, 'settings', 'linkedHelper');
          const settingsSnap = await getDoc(settingsRef);
          
          if (settingsSnap.exists()) {
            const data = settingsSnap.data();
            set({
              apiKey: data.apiKey || '',
              apiKeyLoaded: true,
            });
            return;
          }
          
          set({ apiKeyLoaded: true });
        } catch (error) {
          console.error('Error loading LinkedHelper settings:', error);
          set({ apiKeyLoaded: true });
        }
      },
      
      /**
       * Save API key to user's settings in Firestore
       */
      saveApiKey: async (userId, newApiKey) => {
        if (!userId) return;
        
        try {
          const settingsRef = doc(db, 'users', userId, 'settings', 'linkedHelper');
          await setDoc(settingsRef, {
            apiKey: newApiKey,
            updatedAt: new Date().toISOString(),
          }, { merge: true });
          
          set({ apiKey: newApiKey });
          toast.success('LinkedHelper API key saved');
        } catch (error) {
          console.error('Error saving LinkedHelper key:', error);
          toast.error('Failed to save API key');
        }
      },
      
      /**
       * Remove API key from user's settings
       */
      removeApiKey: async (userId) => {
        if (!userId) return;
        
        try {
          const settingsRef = doc(db, 'users', userId, 'settings', 'linkedHelper');
          await deleteDoc(settingsRef);
          set({ apiKey: '' });
          toast.success('LinkedHelper API key removed');
        } catch (error) {
          console.error('Error removing LinkedHelper key:', error);
          toast.error('Failed to remove API key');
        }
      },
      
      /**
       * Get the current API key
       */
      getApiKey: () => get().apiKey,
      
      // ========================================
      // CAMPAIGN ACTIONS
      // ========================================
      
      /**
       * Fetch all campaigns from LinkedHelper
       */
      fetchCampaigns: async () => {
        const apiKey = get().apiKey;
        if (!apiKey) {
          throw new Error('LinkedHelper API key not configured. Please add it in Settings.');
        }
        
        set({ campaignsLoading: true, campaignsError: null });
        try {
          const campaigns = await linkedHelper.listCampaigns(apiKey);
          set({ 
            campaigns: campaigns || [], 
            campaignsLoading: false 
          });
          return campaigns;
        } catch (error) {
          console.error('Failed to fetch LinkedHelper campaigns:', error);
          set({ 
            campaignsError: error.message, 
            campaignsLoading: false 
          });
          throw error;
        }
      },
      
      /**
       * Set the active campaign for operations
       */
      setSelectedCampaign: (campaignId) => {
        set({ selectedCampaignId: campaignId });
      },
      
      /**
       * Get campaign by ID
       */
      getCampaign: (campaignId) => {
        return get().campaigns.find(c => c.id === campaignId);
      },
      
      // ========================================
      // CONTACT/PROSPECT PUSH ACTIONS
      // ========================================
      
      /**
       * Open the push modal with selected prospects
       */
      openPushModal: (prospects) => {
        set({ 
          showPushModal: true, 
          pushModalProspects: Array.isArray(prospects) ? prospects : [prospects]
        });
      },
      
      /**
       * Close the push modal
       */
      closePushModal: () => {
        set({ showPushModal: false, pushModalProspects: [] });
      },
      
      /**
       * Push a single prospect to LinkedHelper campaign
       */
      pushProspect: async (prospect, campaignId) => {
        const apiKey = get().apiKey;
        if (!apiKey) {
          throw new Error('LinkedHelper API key not configured. Please add it in Settings.');
        }
        
        // Validate LinkedIn URL
        if (!prospect.linkedin && !prospect.linkedinUrl) {
          throw new Error('Prospect must have a LinkedIn URL');
        }
        
        const contact = linkedHelper.prospectToLinkedHelperContact(prospect);
        
        try {
          const result = await linkedHelper.addContactToCampaign(campaignId, contact, apiKey);
          
          // Update sync status
          set(state => ({
            syncStatus: {
              ...state.syncStatus,
              [prospect.id]: {
                campaignId,
                contactId: result.contact_id || result.id,
                status: 'queued',
                lastSyncAt: new Date().toISOString(),
                linkedinUrl: prospect.linkedin || prospect.linkedinUrl
              }
            }
          }));
          
          return result;
        } catch (error) {
          console.error('Failed to push prospect to LinkedHelper:', error);
          throw error;
        }
      },
      
      /**
       * Push multiple prospects to LinkedHelper campaign
       */
      pushProspects: async (prospects, campaignId) => {
        const apiKey = get().apiKey;
        if (!apiKey) {
          throw new Error('LinkedHelper API key not configured. Please add it in Settings.');
        }
        
        // Filter to only prospects with LinkedIn URLs
        const validProspects = prospects.filter(p => p.linkedin || p.linkedinUrl);
        
        if (validProspects.length === 0) {
          throw new Error('No prospects have LinkedIn URLs');
        }
        
        const contacts = validProspects.map(linkedHelper.prospectToLinkedHelperContact);
        
        try {
          const result = await linkedHelper.addContactsToCampaign(campaignId, contacts, apiKey);
          
          // Update sync status for all valid prospects
          const updates = {};
          validProspects.forEach((p, idx) => {
            updates[p.id] = {
              campaignId,
              contactId: result.contacts?.[idx]?.id || null,
              status: 'queued',
              lastSyncAt: new Date().toISOString(),
              linkedinUrl: p.linkedin || p.linkedinUrl
            };
          });
          
          set(state => ({
            syncStatus: { ...state.syncStatus, ...updates }
          }));
          
          return { 
            ...result, 
            pushed: validProspects.length,
            skipped: prospects.length - validProspects.length
          };
        } catch (error) {
          console.error('Failed to push prospects to LinkedHelper:', error);
          throw error;
        }
      },
      
      /**
       * Get sync status for a prospect
       */
      getProspectSyncStatus: (prospectId) => {
        return get().syncStatus[prospectId] || null;
      },
      
      /**
       * Check if prospect is synced to LinkedHelper
       */
      isProspectSynced: (prospectId) => {
        return !!get().syncStatus[prospectId];
      },
      
      /**
       * Check if prospect has LinkedIn URL
       */
      hasLinkedInUrl: (prospect) => {
        return !!(prospect?.linkedin || prospect?.linkedinUrl);
      },
      
      /**
       * Refresh status from LinkedHelper for a prospect
       */
      refreshProspectStatus: async (prospect) => {
        const apiKey = get().apiKey;
        if (!apiKey) return null;
        
        const linkedinUrl = prospect.linkedin || prospect.linkedinUrl;
        if (!linkedinUrl) return null;
        
        try {
          const status = await linkedHelper.getContactStatus({ linkedinUrl }, apiKey);
          
          if (status) {
            set(state => ({
              syncStatus: {
                ...state.syncStatus,
                [prospect.id]: {
                  ...state.syncStatus[prospect.id],
                  status: status.status || status.contact_status,
                  lastSyncAt: new Date().toISOString()
                }
              }
            }));
          }
          
          return status;
        } catch (error) {
          console.error('Failed to refresh prospect status:', error);
          return null;
        }
      },
      
      /**
       * Update local status (from webhook or manual update)
       */
      updateProspectStatus: (prospectId, status) => {
        set(state => ({
          syncStatus: {
            ...state.syncStatus,
            [prospectId]: {
              ...state.syncStatus[prospectId],
              status,
              lastSyncAt: new Date().toISOString()
            }
          }
        }));
      },
      
      /**
       * Remove prospect from LinkedHelper campaign
       */
      removeProspect: async (prospect) => {
        const apiKey = get().apiKey;
        if (!apiKey) {
          throw new Error('LinkedHelper API key not configured. Please add it in Settings.');
        }
        
        const syncInfo = get().syncStatus[prospect.id];
        if (!syncInfo?.campaignId || !syncInfo?.contactId) {
          throw new Error('Prospect not synced to any campaign');
        }
        
        await linkedHelper.removeContact(syncInfo.campaignId, syncInfo.contactId, apiKey);
        
        // Remove from sync status
        set(state => {
          const newStatus = { ...state.syncStatus };
          delete newStatus[prospect.id];
          return { syncStatus: newStatus };
        });
      },
      
      /**
       * Get prospects missing LinkedIn URL from a list
       */
      getProspectsWithoutLinkedIn: (prospects) => {
        return prospects.filter(p => !p.linkedin && !p.linkedinUrl);
      },
      
      /**
       * Clear all sync data (for debugging/reset)
       */
      clearSyncData: () => {
        set({ syncStatus: {} });
      }
    }),
    {
      name: 'linkedhelper-storage',
      partialize: (state) => ({
        selectedCampaignId: state.selectedCampaignId,
        syncStatus: state.syncStatus
      })
    }
  )
);

export default useLinkedHelperStore;
