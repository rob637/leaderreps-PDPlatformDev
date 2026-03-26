/**
 * LinkedHelperStatusBadge
 * 
 * Shows the LinkedHelper sync status for a prospect.
 * Displays status (connected, replied, pending, etc.) with appropriate colors.
 */

import { 
  Linkedin, 
  Send, 
  UserCheck, 
  UserX, 
  MessageCircle, 
  MessageSquare, 
  Clock,
  Eye,
  Loader2,
  AlertCircle,
  Undo2
} from 'lucide-react';
import { useLinkedHelperStore } from '../../stores/linkedHelperStore';
import { getStatusLabel, getStatusColor } from '../../lib/linkedHelper';

export default function LinkedHelperStatusBadge({ prospectId, className = '' }) {
  const { getProspectSyncStatus, getCampaign } = useLinkedHelperStore();
  
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
      case 'pending':
        return <Send className="w-3 h-3" />;
      case 'queued':
        return <Clock className="w-3 h-3" />;
      case 'processing':
        return <Loader2 className="w-3 h-3 animate-spin" />;
      case 'connected':
        return <UserCheck className="w-3 h-3" />;
      case 'messaged':
        return <MessageCircle className="w-3 h-3" />;
      case 'replied':
        return <MessageSquare className="w-3 h-3" />;
      case 'declined':
        return <UserX className="w-3 h-3" />;
      case 'withdrawn':
        return <Undo2 className="w-3 h-3" />;
      case 'visited':
        return <Eye className="w-3 h-3" />;
      case 'error':
        return <AlertCircle className="w-3 h-3" />;
      default:
        return <Clock className="w-3 h-3" />;
    }
  };
  
  return (
    <div 
      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${colorClasses} ${className}`}
      title={`LinkedHelper: ${statusLabel}${campaign ? ` • ${campaign.name}` : ''}`}
    >
      <Linkedin className="w-3 h-3" />
      {getIcon()}
      <span>{statusLabel}</span>
    </div>
  );
}
