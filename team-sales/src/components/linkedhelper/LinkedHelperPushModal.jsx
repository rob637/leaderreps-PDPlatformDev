/**
 * LinkedHelperPushModal
 * 
 * Modal for pushing prospects to LinkedHelper campaigns.
 * Validates LinkedIn URLs and allows selecting a campaign.
 */

import { useState, useEffect } from 'react';
import { 
  X, 
  Linkedin, 
  Users, 
  ChevronRight, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  AlertTriangle,
  RefreshCw,
  Building2,
  Link2
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useLinkedHelperStore } from '../../stores/linkedHelperStore';

export default function LinkedHelperPushModal() {
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
    isProspectSynced,
    hasLinkedInUrl
  } = useLinkedHelperStore();
  
  const [pushing, setPushing] = useState(false);
  const [pushResult, setPushResult] = useState(null);
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
  
  // Categorize prospects
  const alreadySynced = pushModalProspects.filter(p => isProspectSynced(p.id));
  const withLinkedIn = pushModalProspects.filter(p => !isProspectSynced(p.id) && hasLinkedInUrl(p));
  const withoutLinkedIn = pushModalProspects.filter(p => !isProspectSynced(p.id) && !hasLinkedInUrl(p));
  
  const handlePush = async () => {
    if (!localSelectedCampaign || withLinkedIn.length === 0) return;
    
    setPushing(true);
    setPushResult(null);
    
    try {
      const selectedCampaignInfo = campaigns.find(c => c.id === localSelectedCampaign);
      const result = await pushProspects(withLinkedIn, localSelectedCampaign, selectedCampaignInfo?.name);
      setSelectedCampaign(localSelectedCampaign);
      setPushResult({ 
        success: true, 
        queued: result.queued || withLinkedIn.length,
        skipped: withoutLinkedIn.length
      });
      
      // Auto-close after success
      setTimeout(() => {
        closePushModal();
      }, 2500);
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
          className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="p-5 border-b border-slate-200 bg-gradient-to-r from-blue-600 to-blue-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <Linkedin className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Push to LinkedHelper</h2>
                  <p className="text-blue-200 text-sm">
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
                className={`mb-4 p-4 rounded-xl flex items-start gap-3 ${
                  pushResult.success 
                    ? 'bg-green-50 border border-green-200' 
                    : 'bg-red-50 border border-red-200'
                }`}
              >
                {pushResult.success ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                    <div className="text-green-700">
                      <p className="font-medium">
                        Queued {pushResult.queued} prospect{pushResult.queued !== 1 ? 's' : ''} for LinkedHelper!
                      </p>
                      <p className="text-sm text-green-600 mt-1">
                        The Chrome extension will push them when LinkedHelper is running.
                      </p>
                      {pushResult.skipped > 0 && (
                        <p className="text-sm mt-1">
                          {pushResult.skipped} skipped (no LinkedIn URL)
                        </p>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                    <span className="text-red-700">{pushResult.error}</span>
                  </>
                )}
              </motion.div>
            )}
            
            {/* Warning: No LinkedIn URLs */}
            {withoutLinkedIn.length > 0 && (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                <div className="flex items-start gap-2 text-amber-700">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <span className="font-medium">
                      {withoutLinkedIn.length} prospect{withoutLinkedIn.length !== 1 ? 's' : ''} missing LinkedIn URL
                    </span>
                    <p className="text-amber-600 mt-0.5">
                      Add LinkedIn URLs to include them in campaigns.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Already Synced Warning */}
            {alreadySynced.length > 0 && (
              <div className="mb-4 p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm">
                <div className="flex items-center gap-2 text-slate-600">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>
                    {alreadySynced.length} prospect{alreadySynced.length !== 1 ? 's are' : ' is'} already in LinkedHelper
                  </span>
                </div>
              </div>
            )}
            
            {/* Prospects Preview */}
            <div className="mb-5">
              <label className="text-sm font-medium text-slate-700 mb-2 block">
                Prospects to Push ({withLinkedIn.length})
              </label>
              <div className="border border-slate-200 rounded-xl max-h-40 overflow-y-auto">
                {withLinkedIn.length > 0 ? (
                  withLinkedIn.map((prospect, idx) => (
                    <div 
                      key={prospect.id} 
                      className={`flex items-center gap-3 px-3 py-2 ${
                        idx !== withLinkedIn.length - 1 ? 'border-b border-slate-100' : ''
                      }`}
                    >
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-xs font-medium">
                        <Linkedin className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">
                          {prospect.name || `${prospect.firstName} ${prospect.lastName}`.trim()}
                        </p>
                        <p className="text-xs text-slate-500 truncate flex items-center gap-1">
                          <Link2 className="w-3 h-3" />
                          {(prospect.linkedin || prospect.linkedinUrl || '').replace('https://www.linkedin.com/in/', '')}
                        </p>
                      </div>
                      {prospect.company && (
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                          <Building2 className="w-3 h-3" />
                          <span className="truncate max-w-[80px]">{prospect.company}</span>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-slate-500 text-sm">
                    {withoutLinkedIn.length > 0 
                      ? 'All selected prospects are missing LinkedIn URLs'
                      : 'All selected prospects are already in LinkedHelper'
                    }
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
                  className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
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
                  No campaigns found. Create a campaign in LinkedHelper first.
                </div>
              ) : (
                <div className="border border-slate-200 rounded-xl max-h-48 overflow-y-auto">
                  {campaigns.map((campaign, idx) => (
                    <button
                      key={campaign.id}
                      onClick={() => setLocalSelectedCampaign(campaign.id)}
                      className={`w-full flex items-center gap-3 px-3 py-3 text-left transition ${
                        localSelectedCampaign === campaign.id
                          ? 'bg-blue-50 border-l-4 border-blue-600'
                          : 'hover:bg-slate-50'
                      } ${idx !== campaigns.length - 1 ? 'border-b border-slate-100' : ''}`}
                    >
                      <Linkedin className={`w-4 h-4 ${
                        localSelectedCampaign === campaign.id ? 'text-blue-600' : 'text-slate-400'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${
                          localSelectedCampaign === campaign.id ? 'text-blue-700' : 'text-slate-700'
                        }`}>
                          {campaign.name}
                        </p>
                        {campaign.status && (
                          <p className="text-xs text-slate-500 capitalize">{campaign.status}</p>
                        )}
                      </div>
                      {localSelectedCampaign === campaign.id && (
                        <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            {/* Selected Campaign Summary */}
            {selectedCampaignData && (
              <div className="mb-5 p-3 bg-blue-50 border border-blue-200 rounded-xl">
                <div className="flex items-center gap-2 text-blue-700">
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
              disabled={!localSelectedCampaign || withLinkedIn.length === 0 || pushing || pushResult?.success}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 
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
                  <Linkedin className="w-4 h-4" />
                  Push {withLinkedIn.length} to LinkedHelper
                </>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
