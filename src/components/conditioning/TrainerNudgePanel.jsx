// src/components/conditioning/TrainerNudgePanel.jsx
// Phase 3: Trainer Push Integration - Nudge Panel for sending messages to leaders

import React, { useState, useEffect, useCallback } from 'react';
import conditioningService from '../../services/conditioningService.js';
import { Card, Button } from '../ui';
import { 
  Send, MessageSquare, AlertTriangle, Heart, HelpCircle,
  CheckCircle, Users, ChevronDown, ChevronUp, Clock,
  RefreshCw, X, Check
} from 'lucide-react';

// ============================================
// NUDGE TYPE CONFIG
// ============================================
const NUDGE_TYPES = {
  reminder: {
    label: 'Reminder',
    description: 'Gentle reminder to commit/complete',
    icon: Clock,
    color: 'blue',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    textColor: 'text-blue-700'
  },
  encouragement: {
    label: 'Encouragement',
    description: 'Positive reinforcement',
    icon: Heart,
    color: 'green',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    textColor: 'text-green-700'
  },
  check_in: {
    label: 'Check-In',
    description: 'Direct check-in from trainer',
    icon: HelpCircle,
    color: 'sky',
    bgColor: 'bg-sky-100',
    textColor: 'text-sky-700'
  },
  escalation: {
    label: 'Escalation',
    description: 'Formal escalation notice',
    icon: AlertTriangle,
    color: 'red',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    textColor: 'text-red-700'
  }
};

// ============================================
// NUDGE TYPE SELECTOR
// ============================================
const NudgeTypeSelector = ({ selected, onSelect }) => {
  return (
    <div className="grid grid-cols-2 gap-2">
      {Object.entries(NUDGE_TYPES).map(([key, config]) => {
        const Icon = config.icon;
        const isSelected = selected === key;
        
        return (
          <button
            key={key}
            type="button"
            onClick={() => onSelect(key)}
            className={`p-3 rounded-lg border text-left transition-all ${
              isSelected
                ? `border-${config.color}-500 ${config.bgColor} ring-2 ring-${config.color}-500`
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 bg-white dark:bg-slate-800'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <Icon className={`w-4 h-4 ${isSelected ? config.textColor : 'text-gray-500 dark:text-gray-400'}`} />
              <span className={`font-medium text-sm ${isSelected ? config.textColor : 'text-gray-700 dark:text-gray-200'}`}>
                {config.label}
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">{config.description}</p>
          </button>
        );
      })}
    </div>
  );
};

// ============================================
// LEADER SELECTOR
// ============================================
const LeaderSelector = ({ leaders, selectedIds, onToggle, onSelectAll, onDeselectAll }) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredLeaders = leaders.filter(leader => 
    leader.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    leader.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      {/* Search & Select All */}
      <div className="p-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search leaders..."
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm mb-2"
        />
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-500 dark:text-gray-400">{selectedIds.length} selected</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onSelectAll}
              className="text-corporate-navy hover:underline"
            >
              Select All
            </button>
            <button
              type="button"
              onClick={onDeselectAll}
              className="text-gray-500 dark:text-gray-400 hover:underline"
            >
              Clear
            </button>
          </div>
        </div>
      </div>
      
      {/* Leader List */}
      <div className="max-h-48 overflow-y-auto">
        {filteredLeaders.map(leader => {
          const isSelected = selectedIds.includes(leader.userId);
          return (
            <label
              key={leader.userId}
              className={`flex items-center gap-3 p-2 cursor-pointer hover:bg-gray-50 ${
                isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''
              }`}
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => onToggle(leader.userId)}
                className="rounded border-gray-300 dark:border-gray-600"
              />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  {leader.displayName || leader.email}
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  {leader.hasCommitted ? (
                    <span className="text-blue-600">Has active rep</span>
                  ) : (
                    <span className="text-amber-600">No commitment</span>
                  )}
                  {leader.consecutiveMissedWeeks > 0 && (
                    <span className="text-red-600">
                      {leader.consecutiveMissedWeeks}w missed
                    </span>
                  )}
                </div>
              </div>
              {leader.suggestedNudgeType && (
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  NUDGE_TYPES[leader.suggestedNudgeType]?.bgColor || 'bg-gray-100 dark:bg-gray-700'
                } ${NUDGE_TYPES[leader.suggestedNudgeType]?.textColor || 'text-gray-600 dark:text-gray-300'}`}>
                  {NUDGE_TYPES[leader.suggestedNudgeType]?.label}
                </span>
              )}
            </label>
          );
        })}
        
        {filteredLeaders.length === 0 && (
          <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
            No leaders found
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================
// SEND NUDGE FORM
// ============================================
const SendNudgeForm = ({ 
  db, 
  trainerId, 
  cohortId, 
  leadersNeedingNudge, 
  onNudgeSent,
  onClose 
}) => {
  const [nudgeType, setNudgeType] = useState('reminder');
  const [selectedLeaderIds, setSelectedLeaderIds] = useState([]);
  const [customMessage, setCustomMessage] = useState('');
  const [useCustomMessage, setUseCustomMessage] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [result, setResult] = useState(null);
  
  const defaultMessage = conditioningService.getDefaultNudgeMessage(nudgeType);
  
  const handleToggleLeader = (userId) => {
    setSelectedLeaderIds(prev => 
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };
  
  const handleSelectAll = () => {
    setSelectedLeaderIds(leadersNeedingNudge.map(l => l.userId));
  };
  
  const handleDeselectAll = () => {
    setSelectedLeaderIds([]);
  };
  
  const handleSend = async () => {
    if (selectedLeaderIds.length === 0) return;
    
    setIsSending(true);
    setResult(null);
    
    try {
      const message = useCustomMessage ? customMessage : defaultMessage;
      const sendResult = await conditioningService.sendBulkNudges(
        db,
        trainerId,
        selectedLeaderIds,
        cohortId,
        nudgeType,
        message
      );
      
      setResult(sendResult);
      
      if (sendResult.successful > 0) {
        onNudgeSent?.(sendResult);
      }
    } catch (err) {
      console.error('Error sending nudges:', err);
      setResult({ error: err.message });
    } finally {
      setIsSending(false);
    }
  };
  
  return (
    <Card className="border-l-4 border-l-corporate-navy">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Send className="w-5 h-5 text-corporate-navy" />
            <h3 className="font-bold text-corporate-navy">Send Nudge</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>
        
        {/* Nudge Type Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
            Nudge Type
          </label>
          <NudgeTypeSelector selected={nudgeType} onSelect={setNudgeType} />
        </div>
        
        {/* Leader Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
            Select Leaders ({leadersNeedingNudge.length} need nudging)
          </label>
          <LeaderSelector
            leaders={leadersNeedingNudge}
            selectedIds={selectedLeaderIds}
            onToggle={handleToggleLeader}
            onSelectAll={handleSelectAll}
            onDeselectAll={handleDeselectAll}
          />
        </div>
        
        {/* Message */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Message</label>
            <label className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 cursor-pointer">
              <input
                type="checkbox"
                checked={useCustomMessage}
                onChange={(e) => setUseCustomMessage(e.target.checked)}
                className="rounded border-gray-300 dark:border-gray-600"
              />
              Custom message
            </label>
          </div>
          
          {useCustomMessage ? (
            <textarea
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder="Write your custom message..."
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg text-sm min-h-[100px]"
            />
          ) : (
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-200 italic">
              "{defaultMessage}"
            </div>
          )}
        </div>
        
        {/* Result */}
        {result && (
          <div className={`mb-4 p-3 rounded-lg text-sm ${
            result.error 
              ? 'bg-red-50 dark:bg-red-900/20 text-red-700' 
              : 'bg-green-50 dark:bg-green-900/20 text-green-700'
          }`}>
            {result.error ? (
              <span>Error: {result.error}</span>
            ) : (
              <span>
                <CheckCircle className="w-4 h-4 inline mr-1" />
                Sent {result.successful} nudge{result.successful !== 1 ? 's' : ''} successfully!
                {result.failed.length > 0 && ` (${result.failed.length} failed)`}
              </span>
            )}
          </div>
        )}
        
        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={isSending}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSend}
            disabled={isSending || selectedLeaderIds.length === 0}
            className="flex-1"
          >
            {isSending ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Send to {selectedLeaderIds.length} Leader{selectedLeaderIds.length !== 1 ? 's' : ''}
              </>
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
};

// ============================================
// NUDGE HISTORY
// ============================================
const NudgeHistory = ({ nudges, isLoading }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (isLoading) {
    return (
      <Card className="p-4">
        <div className="flex items-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-gray-400" />
          <span className="text-sm text-gray-500 dark:text-gray-400">Loading nudge history...</span>
        </div>
      </Card>
    );
  }
  
  if (!nudges || nudges.length === 0) {
    return (
      <Card className="p-4">
        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
          <MessageSquare className="w-5 h-5" />
          <span className="text-sm">No nudges sent yet</span>
        </div>
      </Card>
    );
  }
  
  const displayNudges = isExpanded ? nudges : nudges.slice(0, 3);
  
  return (
    <Card>
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-corporate-navy" />
            <h4 className="font-semibold text-corporate-navy">Nudge History</h4>
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400">{nudges.length} total</span>
        </div>
      </div>
      
      <div className="divide-y divide-gray-100 dark:divide-gray-700">
        {displayNudges.map(nudge => {
          const config = NUDGE_TYPES[nudge.type] || NUDGE_TYPES.reminder;
          const Icon = config.icon;
          const sentDate = nudge.sentAt?.toDate?.() || new Date(nudge.sentAt);
          
          return (
            <div key={nudge.id} className="p-3">
              <div className="flex items-start gap-3">
                <div className={`p-1.5 rounded-full ${config.bgColor}`}>
                  <Icon className={`w-4 h-4 ${config.textColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${config.bgColor} ${config.textColor}`}>
                      {config.label}
                    </span>
                    <span className="text-xs text-gray-400">
                      {sentDate.toLocaleDateString()} {sentDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-200 line-clamp-2">{nudge.message}</p>
                  {nudge.readAt && (
                    <span className="text-xs text-green-600 flex items-center gap-1 mt-1">
                      <Check className="w-3 h-3" /> Read
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {nudges.length > 3 && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full p-2 text-sm text-corporate-navy hover:bg-gray-50 flex items-center justify-center gap-1"
        >
          {isExpanded ? (
            <>Show less <ChevronUp className="w-4 h-4" /></>
          ) : (
            <>Show {nudges.length - 3} more <ChevronDown className="w-4 h-4" /></>
          )}
        </button>
      )}
    </Card>
  );
};

// ============================================
// MAIN TRAINER NUDGE PANEL
// ============================================
const TrainerNudgePanel = ({ db, trainerId, cohortId, cohortUsers }) => {
  const [leadersNeedingNudge, setLeadersNeedingNudge] = useState([]);
  const [nudgeHistory, setNudgeHistory] = useState([]);
  const [showSendForm, setShowSendForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const loadData = useCallback(async () => {
    if (!db || !cohortId || !cohortUsers?.length) return;
    
    try {
      setIsLoading(true);
      
      const userIds = cohortUsers.map(u => u.userId || u.id);
      
      const [needingNudge, history] = await Promise.all([
        conditioningService.getLeadersNeedingNudge(db, cohortId, userIds),
        conditioningService.getCohortNudgeHistory(db, cohortId)
      ]);
      
      // Enrich with user display info
      const enrichedNeeders = needingNudge.map(n => {
        const user = cohortUsers.find(u => (u.userId || u.id) === n.userId);
        return {
          ...n,
          displayName: user?.displayName,
          email: user?.email
        };
      });
      
      setLeadersNeedingNudge(enrichedNeeders);
      setNudgeHistory(history);
    } catch (err) {
      console.error('Error loading nudge data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [db, cohortId, cohortUsers]);
  
  useEffect(() => {
    loadData();
  }, [loadData]);
  
  const handleNudgeSent = () => {
    loadData(); // Refresh data
    setShowSendForm(false);
  };
  
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Send className="w-5 h-5 text-corporate-navy" />
          <h3 className="font-bold text-corporate-navy">Trainer Nudges</h3>
          {leadersNeedingNudge.length > 0 && (
            <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 rounded-full text-xs font-medium">
              {leadersNeedingNudge.length} need nudging
            </span>
          )}
        </div>
        <Button
          onClick={() => setShowSendForm(true)}
          disabled={leadersNeedingNudge.length === 0}
          size="sm"
          className="bg-corporate-navy text-white"
        >
          <Send className="w-4 h-4 mr-1" />
          Send Nudge
        </Button>
      </div>
      
      {/* Send Form */}
      {showSendForm && (
        <SendNudgeForm
          db={db}
          trainerId={trainerId}
          cohortId={cohortId}
          leadersNeedingNudge={leadersNeedingNudge}
          onNudgeSent={handleNudgeSent}
          onClose={() => setShowSendForm(false)}
        />
      )}
      
      {/* Nudge History */}
      <NudgeHistory nudges={nudgeHistory} isLoading={isLoading} />
    </div>
  );
};

export default TrainerNudgePanel;
