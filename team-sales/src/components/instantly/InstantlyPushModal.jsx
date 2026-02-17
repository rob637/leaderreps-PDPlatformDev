/**
 * InstantlyPushModal
 * 
 * Modal for pushing prospects to Instantly.ai campaigns.
 * Allows selecting a campaign and pushing one or more prospects.
 */

import { useState, useEffect } from 'react';
import { 
  X, 
  Zap, 
  Mail, 
  Users, 
  ChevronRight, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  RefreshCw,
  Building2
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useInstantlyStore } from '../../stores/instantlyStore';

export default function InstantlyPushModal() {
  const {
    showPushModal,
    closePushModal,
    pushModalProspects,
    campaigns,
    campaignsLoading,
    campaignsError,
    fetchCampaigns,
    selectedCampaignId,
    setSelectedCampaign,
    pushProspects,
    isProspectSynced
  } = useInstantlyStore();
  
  const [pushing, setPushing] = useState(false);
  const [pushResult, setPushResult] = useState(null); // { success: true, count: 5 } or { success: false, error: '...' }
  const [localSelectedCampaign, setLocalSelectedCampaign] = useState(selectedCampaignId);
  
  // Fetch campaigns on mount if empty
  useEffect(() => {
    if (showPushModal && campaigns.length === 0 && !campaignsLoading) {
      fetchCampaigns();
    }
  }, [showPushModal, campaigns.length, campaignsLoading, fetchCampaigns]);
  
  // Reset state when modal opens
  useEffect(() => {
    if (showPushModal) {
      setPushResult(null);
      setLocalSelectedCampaign(selectedCampaignId);
    }
  }, [showPushModal, selectedCampaignId]);
  
  if (!showPushModal) return null;
  
  // Filter out already synced prospects
  const newProspects = pushModalProspects.filter(p => !isProspectSynced(p.id));
  const alreadySynced = pushModalProspects.filter(p => isProspectSynced(p.id));
  
  const handlePush = async () => {
    if (!localSelectedCampaign || newProspects.length === 0) return;
    
    setPushing(true);
    setPushResult(null);
    
    try {
      await pushProspects(newProspects, localSelectedCampaign);
      setSelectedCampaign(localSelectedCampaign);
      setPushResult({ success: true, count: newProspects.length });
      
      // Auto-close after success
      setTimeout(() => {
        closePushModal();
      }, 2000);
    } catch (error) {
      setPushResult({ success: false, error: error.message });
    } finally {
      setPushing(false);
    }
  };
  
  const selectedCampaignData = campaigns.find(c => c.id === localSelectedCampaign);
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
        onClick={(e) => e.target === e.currentTarget && closePushModal()}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="p-5 border-b border-slate-200 bg-gradient-to-r from-purple-600 to-purple-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Push to Instantly</h2>
                  <p className="text-purple-200 text-sm">
                    {pushModalProspects.length} prospect{pushModalProspects.length !== 1 ? 's' : ''} selected
                  </p>
                </div>
              </div>
              <button
                onClick={closePushModal}
                className="text-white/70 hover:text-white p-2 rounded-lg hover:bg-white/10 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          <div className="p-5">
            {/* Result State */}
            {pushResult && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mb-4 p-4 rounded-xl flex items-center gap-3 ${
                  pushResult.success 
                    ? 'bg-green-50 border border-green-200' 
                    : 'bg-red-50 border border-red-200'
                }`}
              >
                {pushResult.success ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                    <span className="text-green-700">
                      Successfully pushed {pushResult.count} prospect{pushResult.count !== 1 ? 's' : ''} to Instantly!
                    </span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                    <span className="text-red-700">{pushResult.error}</span>
                  </>
                )}
              </motion.div>
            )}
            
            {/* Already Synced Warning */}
            {alreadySynced.length > 0 && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-xl text-sm">
                <div className="flex items-center gap-2 text-yellow-700">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>
                    {alreadySynced.length} prospect{alreadySynced.length !== 1 ? 's are' : ' is'} already in Instantly
                  </span>
                </div>
              </div>
            )}
            
            {/* Prospects Preview */}
            <div className="mb-5">
              <label className="text-sm font-medium text-slate-700 mb-2 block">
                Prospects to Push ({newProspects.length})
              </label>
              <div className="border border-slate-200 rounded-xl max-h-40 overflow-y-auto">
                {newProspects.length > 0 ? (
                  newProspects.map((prospect, idx) => (
                    <div 
                      key={prospect.id} 
                      className={`flex items-center gap-3 px-3 py-2 ${
                        idx !== newProspects.length - 1 ? 'border-b border-slate-100' : ''
                      }`}
                    >
                      <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 text-xs font-medium">
                        {(prospect.firstName?.[0] || prospect.name?.[0] || '?').toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">
                          {prospect.name || `${prospect.firstName} ${prospect.lastName}`.trim()}
                        </p>
                        <p className="text-xs text-slate-500 truncate">{prospect.email}</p>
                      </div>
                      {prospect.company && (
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                          <Building2 className="w-3 h-3" />
                          <span className="truncate max-w-[100px]">{prospect.company}</span>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-slate-500 text-sm">
                    All selected prospects are already in Instantly
                  </div>
                )}
              </div>
            </div>
            
            {/* Campaign Selector */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-slate-700">
                  Select Campaign
                </label>
                <button
                  onClick={() => fetchCampaigns()}
                  disabled={campaignsLoading}
                  className="text-xs text-purple-600 hover:text-purple-700 flex items-center gap-1"
                >
                  <RefreshCw className={`w-3 h-3 ${campaignsLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>
              
              {campaignsLoading ? (
                <div className="border border-slate-200 rounded-xl p-4 flex items-center justify-center gap-2 text-slate-500">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading campaigns...
                </div>
              ) : campaignsError ? (
                <div className="border border-red-200 bg-red-50 rounded-xl p-4 text-red-600 text-sm">
                  <p className="font-medium">Failed to load campaigns</p>
                  <p className="text-xs mt-1">{campaignsError}</p>
                </div>
              ) : campaigns.length === 0 ? (
                <div className="border border-slate-200 rounded-xl p-4 text-center text-slate-500 text-sm">
                  No campaigns found. Create a campaign in Instantly first.
                </div>
              ) : (
                <div className="border border-slate-200 rounded-xl max-h-48 overflow-y-auto">
                  {campaigns.map((campaign, idx) => (
                    <button
                      key={campaign.id}
                      onClick={() => setLocalSelectedCampaign(campaign.id)}
                      className={`w-full flex items-center gap-3 px-3 py-3 text-left transition ${
                        localSelectedCampaign === campaign.id
                          ? 'bg-purple-50 border-l-4 border-purple-600'
                          : 'hover:bg-slate-50'
                      } ${idx !== campaigns.length - 1 ? 'border-b border-slate-100' : ''}`}
                    >
                      <Mail className={`w-4 h-4 ${
                        localSelectedCampaign === campaign.id ? 'text-purple-600' : 'text-slate-400'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${
                          localSelectedCampaign === campaign.id ? 'text-purple-700' : 'text-slate-700'
                        }`}>
                          {campaign.name}
                        </p>
                        {campaign.status && (
                          <p className="text-xs text-slate-500 capitalize">{campaign.status}</p>
                        )}
                      </div>
                      {localSelectedCampaign === campaign.id && (
                        <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            {/* Selected Campaign Summary */}
            {selectedCampaignData && (
              <div className="mb-5 p-3 bg-purple-50 border border-purple-200 rounded-xl">
                <div className="flex items-center gap-2 text-purple-700">
                  <ChevronRight className="w-4 h-4" />
                  <span className="text-sm">
                    Push to: <strong>{selectedCampaignData.name}</strong>
                  </span>
                </div>
              </div>
            )}
          </div>
          
          {/* Footer */}
          <div className="p-5 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
            <button
              onClick={closePushModal}
              className="px-4 py-2 text-slate-600 hover:text-slate-800 font-medium transition"
            >
              Cancel
            </button>
            <button
              onClick={handlePush}
              disabled={!localSelectedCampaign || newProspects.length === 0 || pushing || pushResult?.success}
              className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 
                text-white font-medium rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {pushing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Pushing...
                </>
              ) : pushResult?.success ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Done!
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  Push {newProspects.length} to Instantly
                </>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
