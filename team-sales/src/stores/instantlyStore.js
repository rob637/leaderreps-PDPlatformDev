/**
 * Instantly.ai Integration Store
 * 
 * Manages state for Instantly campaigns, lead sync status, and integration settings.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import toast from 'react-hot-toast';
import * as instantly from '../lib/instantly';

export const useInstantlyStore = create(
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
      // { [prospectId]: { campaignId, status, lastSyncAt, instantlyEmail } }
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
          const settingsRef = doc(db, 'users', userId, 'settings', 'instantly');
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
          console.error('Error loading Instantly settings:', error);
          set({ apiKeyLoaded: true });
        }
      },
      
      /**
       * Save API key to user's settings in Firestore
       */
      saveApiKey: async (userId, newApiKey) => {
        if (!userId) return;
        
        try {
          const settingsRef = doc(db, 'users', userId, 'settings', 'instantly');
          await setDoc(settingsRef, {
            apiKey: newApiKey,
            updatedAt: new Date().toISOString(),
          }, { merge: true });
          
          set({ apiKey: newApiKey });
          toast.success('Instantly API key saved');
        } catch (error) {
          console.error('Error saving Instantly key:', error);
          toast.error('Failed to save API key');
        }
      },
      
      /**
       * Remove API key from user's settings
       */
      removeApiKey: async (userId) => {
        if (!userId) return;
        
        try {
          const settingsRef = doc(db, 'users', userId, 'settings', 'instantly');
          await deleteDoc(settingsRef);
          set({ apiKey: '' });
          toast.success('Instantly API key removed');
        } catch (error) {
          console.error('Error removing Instantly key:', error);
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
       * Fetch all campaigns from Instantly
       */
      fetchCampaigns: async () => {
        const apiKey = get().apiKey;
        if (!apiKey) {
          throw new Error('Instantly API key not configured. Please add it in Settings.');
        }
        
        set({ campaignsLoading: true, campaignsError: null });
        try {
          const campaigns = await instantly.listCampaigns(apiKey);
          set({ 
            campaigns: campaigns || [], 
            campaignsLoading: false 
          });
          return campaigns;
        } catch (error) {
          console.error('Failed to fetch Instantly campaigns:', error);
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
      // LEAD/PROSPECT PUSH ACTIONS
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
       * Push a single prospect to Instantly campaign
       */
      pushProspect: async (prospect, campaignId) => {
        const apiKey = get().apiKey;
        if (!apiKey) {
          throw new Error('Instantly API key not configured. Please add it in Settings.');
        }
        
        const lead = instantly.prospectToInstantlyLead(prospect);
        
        try {
          const result = await instantly.addLeadToCampaign(campaignId, lead, apiKey);
          
          // Update sync status
          set(state => ({
            syncStatus: {
              ...state.syncStatus,
              [prospect.id]: {
                campaignId,
                status: 'active',
                lastSyncAt: new Date().toISOString(),
                instantlyEmail: prospect.email
              }
            }
          }));
          
          return result;
        } catch (error) {
          console.error('Failed to push prospect to Instantly:', error);
          throw error;
        }
      },
      
      /**
       * Push multiple prospects to Instantly campaign
       */
      pushProspects: async (prospects, campaignId) => {
        const apiKey = get().apiKey;
        if (!apiKey) {
          throw new Error('Instantly API key not configured. Please add it in Settings.');
        }
        
        const leads = prospects.map(instantly.prospectToInstantlyLead);
        
        try {
          const result = await instantly.addLeadsToCampaign(campaignId, leads, apiKey);
          
          // Update sync status for all prospects
          const updates = {};
          prospects.forEach(p => {
            updates[p.id] = {
              campaignId,
              status: 'active',
              lastSyncAt: new Date().toISOString(),
              instantlyEmail: p.email
            };
          });
          
          set(state => ({
            syncStatus: { ...state.syncStatus, ...updates }
          }));
          
          return result;
        } catch (error) {
          console.error('Failed to push prospects to Instantly:', error);
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
       * Check if prospect is synced to Instantly
       */
      isProspectSynced: (prospectId) => {
        return !!get().syncStatus[prospectId];
      },
      
      /**
       * Refresh status from Instantly for a prospect
       */
      refreshProspectStatus: async (prospect) => {
        const apiKey = get().apiKey;
        if (!apiKey) return null;
        
        try {
          const status = await instantly.getLeadStatus(prospect.email, apiKey);
          
          if (status) {
            set(state => ({
              syncStatus: {
                ...state.syncStatus,
                [prospect.id]: {
                  ...state.syncStatus[prospect.id],
                  status: status.lead_status || status.status,
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
       * Pause a prospect in their campaign
       */
      pauseProspect: async (prospect) => {
        const apiKey = get().apiKey;
        if (!apiKey) {
          throw new Error('Instantly API key not configured. Please add it in Settings.');
        }
        
        const syncInfo = get().syncStatus[prospect.id];
        if (!syncInfo?.campaignId) {
          throw new Error('Prospect not synced to any campaign');
        }
        
        await instantly.pauseLead(syncInfo.campaignId, prospect.email, apiKey);
        
        set(state => ({
          syncStatus: {
            ...state.syncStatus,
            [prospect.id]: {
              ...state.syncStatus[prospect.id],
              status: 'paused',
              lastSyncAt: new Date().toISOString()
            }
          }
        }));
      },
      
      /**
       * Resume a paused prospect in their campaign
       */
      resumeProspect: async (prospect) => {
        const apiKey = get().apiKey;
        if (!apiKey) {
          throw new Error('Instantly API key not configured. Please add it in Settings.');
        }
        
        const syncInfo = get().syncStatus[prospect.id];
        if (!syncInfo?.campaignId) {
          throw new Error('Prospect not synced to any campaign');
        }
        
        await instantly.resumeLead(syncInfo.campaignId, prospect.email, apiKey);
        
        set(state => ({
          syncStatus: {
            ...state.syncStatus,
            [prospect.id]: {
              ...state.syncStatus[prospect.id],
              status: 'active',
              lastSyncAt: new Date().toISOString()
            }
          }
        }));
      },
      
      /**
       * Remove prospect from Instantly campaign
       */
      removeProspect: async (prospect) => {
        const apiKey = get().apiKey;
        if (!apiKey) {
          throw new Error('Instantly API key not configured. Please add it in Settings.');
        }
        
        const syncInfo = get().syncStatus[prospect.id];
        if (!syncInfo?.campaignId) {
          throw new Error('Prospect not synced to any campaign');
        }
        
        await instantly.removeLead(syncInfo.campaignId, prospect.email, apiKey);
        
        // Remove from sync status
        set(state => {
          const newStatus = { ...state.syncStatus };
          delete newStatus[prospect.id];
          return { syncStatus: newStatus };
        });
      },
      
      /**
       * Clear all sync data (for debugging/reset)
       */
      clearSyncData: () => {
        set({ syncStatus: {} });
      }
    }),
    {
      name: 'instantly-storage',
      partialize: (state) => ({
        selectedCampaignId: state.selectedCampaignId,
        syncStatus: state.syncStatus
      })
    }
  )
);

export default useInstantlyStore;
