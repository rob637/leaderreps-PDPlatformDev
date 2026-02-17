/**
 * InstantlyStatusBadge
 * 
 * Shows the Instantly.ai sync status for a prospect.
 * Displays status (active, replied, bounced, etc.) with appropriate colors.
 */

import { Zap, Mail, MailCheck, MailX, Pause, Play, Clock } from 'lucide-react';
import { useInstantlyStore } from '../../stores/instantlyStore';
import { getStatusLabel, getStatusColor } from '../../lib/instantly';

export default function InstantlyStatusBadge({ prospectId, className = '' }) {
  const { getProspectSyncStatus, getCampaign } = useInstantlyStore();
  
  const syncInfo = getProspectSyncStatus(prospectId);
  
  if (!syncInfo) {
    return null;
  }
  
  const campaign = getCampaign(syncInfo.campaignId);
  const statusLabel = getStatusLabel(syncInfo.status);
  const colorClasses = getStatusColor(syncInfo.status);
  
  // Icon based on status
  const getIcon = () => {
    switch (syncInfo.status) {
      case 'active':
        return <Play className="w-3 h-3" />;
      case 'paused':
        return <Pause className="w-3 h-3" />;
      case 'replied':
        return <MailCheck className="w-3 h-3" />;
      case 'bounced':
        return <MailX className="w-3 h-3" />;
      case 'completed':
        return <Clock className="w-3 h-3" />;
      default:
        return <Mail className="w-3 h-3" />;
    }
  };
  
  return (
    <div 
      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${colorClasses} ${className}`}
      title={`Instantly: ${statusLabel}${campaign ? ` • ${campaign.name}` : ''}`}
    >
      <Zap className="w-3 h-3" />
      {getIcon()}
      <span>{statusLabel}</span>
    </div>
  );
}
