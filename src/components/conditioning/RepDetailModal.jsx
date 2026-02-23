// src/components/conditioning/RepDetailModal.jsx
// Phase 6: View details of any rep (especially completed ones)
// Shows full rep history: person, type, prep, debrief, quality, loop closure

import React from 'react';
import { Card, Button } from '../ui';
import { 
  X, User, Calendar, Clock, FileText, MessageSquare,
  CheckCircle, AlertTriangle, RefreshCw, Star, Target
} from 'lucide-react';
import { getRepType } from '../../services/repTaxonomy.js';
import { REP_STATUS } from '../../services/conditioningService.js';

// ============================================
// STATUS DISPLAY
// ============================================
const StatusDisplay = ({ status }) => {
  const configs = {
    committed: { label: 'Planned', color: 'bg-blue-100 text-blue-700', icon: Clock },
    prepared: { label: 'Prepared', color: 'bg-slate-100 text-slate-700', icon: FileText },
    scheduled: { label: 'Scheduled', color: 'bg-sky-100 text-sky-700', icon: Calendar },
    executed: { label: 'Delivered', color: 'bg-teal-100 text-teal-700', icon: Target },
    debriefed: { label: 'Debriefed', color: 'bg-green-100 text-green-700', icon: CheckCircle },
    follow_up_pending: { label: 'Follow-Up', color: 'bg-orange-100 text-orange-700', icon: RefreshCw },
    loop_closed: { label: 'Loop Closed', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
    missed: { label: 'Missed', color: 'bg-amber-100 text-amber-700', icon: AlertTriangle },
    canceled: { label: 'Canceled', color: 'bg-gray-100 text-gray-700', icon: X }
  };
  
  const config = configs[status] || configs.committed;
  const Icon = config.icon;
  
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
      <Icon className="w-4 h-4" />
      {config.label}
    </span>
  );
};

// ============================================
// SECTION COMPONENT
// ============================================
const Section = ({ title, icon: Icon, children, empty = false }) => {
  if (empty) return null;
  
  return (
    <div className="border-t border-gray-100 dark:border-slate-700 pt-4 mt-4 first:border-t-0 first:pt-0 first:mt-0">
      <h4 className="flex items-center gap-2 text-sm font-semibold text-corporate-navy dark:text-white mb-2">
        {Icon && <Icon className="w-4 h-4" />}
        {title}
      </h4>
      <div className="text-sm text-gray-700 dark:text-slate-300">{children}</div>
    </div>
  );
};

// ============================================
// QUALITY DISPLAY
// ============================================
const QualityDisplay = ({ assessment }) => {
  if (!assessment) return null;
  
  const dimensions = assessment.dimensions || {};
  const dimensionLabels = {
    specific_language: 'Specific Language',
    clear_request: 'Clear Request',
    named_commitment: 'Named Commitment',
    reflection: 'Reflection'
  };
  
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
          assessment.meetsStandard 
            ? 'bg-green-100 text-green-700' 
            : 'bg-amber-100 text-amber-700'
        }`}>
          {assessment.passedCount}/{assessment.totalDimensions} dimensions
        </span>
        {assessment.meetsStandard && (
          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
        )}
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        {Object.entries(dimensions).map(([key, value]) => (
          <div 
            key={key}
            className={`p-2 rounded text-xs ${
              value.passed 
                ? 'bg-green-50 text-green-700' 
                : 'bg-gray-50 text-gray-500'
            }`}
          >
            <div className="flex items-center gap-1">
              {value.passed ? (
                <CheckCircle className="w-3 h-3" />
              ) : (
                <span className="w-3 h-3 rounded-full border border-current" />
              )}
              <span>{dimensionLabels[key] || key}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================
// MAIN MODAL COMPONENT
// ============================================
const RepDetailModal = ({ isOpen, onClose, rep }) => {
  if (!isOpen || !rep) return null;
  
  const repTypeConfig = getRepType(rep.repType);
  
  const formatDate = (timestamp) => {
    if (!timestamp) return null;
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };
  
  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50 p-4 pb-20 md:pb-4"
      onClick={onClose}
    >
      <div onClick={(e) => e.stopPropagation()}>
        <Card 
          className="w-full max-w-xl max-h-[calc(100vh-6rem)] md:max-h-[90vh] overflow-hidden flex flex-col"
          style={{ marginBottom: 'env(safe-area-inset-bottom, 0px)' }}
        >
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-slate-700 bg-gradient-to-r from-corporate-navy to-corporate-navy/90">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-bold text-white">Rep Details</h3>
            <button
              onClick={onClose}
              className="p-2.5 -mr-1 hover:bg-white/10 rounded-lg text-white/80 hover:text-white transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Person & Type */}
          <div className="flex items-center gap-2 text-white">
            <User className="w-4 h-4" />
            <span className="font-medium">{rep.person}</span>
          </div>
          <div className="flex items-center gap-2 text-white/80 text-sm mt-1">
            <Target className="w-3 h-3" />
            <span>{repTypeConfig?.label || repTypeConfig?.name || rep.repType}</span>
          </div>
        </div>
        
        {/* Status & Timeline */}
        <div className="p-4 bg-gray-50 dark:bg-slate-700/50 border-b border-gray-200 dark:border-slate-700">
          <div className="flex flex-wrap items-center gap-3">
            <StatusDisplay status={rep.status} />
            
            {rep.deadline && (
              <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-slate-400">
                <Calendar className="w-3 h-3" />
                <span>Due: {formatDate(rep.deadline)}</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Notes */}
          {rep.notes && (
            <Section title="Notes" icon={MessageSquare}>
              <p className="italic text-gray-600 dark:text-slate-400">"{rep.notes}"</p>
            </Section>
          )}
          
          {/* Risk Level */}
          {rep.riskLevel && (
            <Section title="Risk Level" icon={AlertTriangle}>
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                rep.riskLevel === 'high' 
                  ? 'bg-red-100 text-red-700' 
                  : rep.riskLevel === 'medium'
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-green-100 text-green-700'
              }`}>
                {rep.riskLevel.charAt(0).toUpperCase() + rep.riskLevel.slice(1)} Risk
              </span>
            </Section>
          )}
          
          {/* Prep Data */}
          {rep.prep && Object.keys(rep.prep).length > 0 && (
            <Section title="Prep Notes" icon={FileText}>
              <div className="space-y-2 bg-corporate-navy/5 dark:bg-corporate-navy/20 rounded-lg p-3">
                {rep.prep.opening_language && (
                  <div>
                    <span className="text-xs font-medium text-corporate-navy/70 dark:text-slate-400">Opening:</span>
                    <p className="text-corporate-navy dark:text-slate-200">{rep.prep.opening_language}</p>
                  </div>
                )}
                {rep.prep.behavior_to_address && (
                  <div>
                    <span className="text-xs font-medium text-corporate-navy/70 dark:text-slate-400">Behavior:</span>
                    <p className="text-corporate-navy dark:text-slate-200">{rep.prep.behavior_to_address}</p>
                  </div>
                )}
                {rep.prep.commitment_to_request && (
                  <div>
                    <span className="text-xs font-medium text-corporate-navy/70 dark:text-slate-400">Commitment:</span>
                    <p className="text-corporate-navy dark:text-slate-200">{rep.prep.commitment_to_request}</p>
                  </div>
                )}
              </div>
            </Section>
          )}
          
          {/* Evidence/Debrief */}
          {rep.evidence && (
            <Section title="Debrief" icon={CheckCircle}>
              <div className="space-y-3">
                {/* Evidence Level */}
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-400 dark:text-slate-500" />
                  <span className="text-xs text-gray-500 dark:text-slate-400">
                    {rep.evidence.level === 'level_1' ? 'Same-day capture' : 'Later capture'}
                  </span>
                </div>
                
                {/* Debrief Responses */}
                {rep.evidence.responses && Object.entries(rep.evidence.responses).length > 0 && (
                  <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-3 space-y-2">
                    {Object.entries(rep.evidence.responses).map(([key, value]) => (
                      <div key={key}>
                        <span className="text-xs font-medium text-green-700 dark:text-green-400 capitalize">
                          {key.replace(/_/g, ' ')}:
                        </span>
                        <p className="text-green-900 dark:text-green-200">{value}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Section>
          )}
          
          {/* Quality Assessment */}
          {rep.qualityAssessment && (
            <Section title="Quality Assessment" icon={Star}>
              <QualityDisplay assessment={rep.qualityAssessment} />
            </Section>
          )}
          
          {/* Loop Closure */}
          {rep.loopClosure && (
            <Section title="Loop Closure" icon={CheckCircle}>
              <div className="bg-emerald-50 dark:bg-emerald-900/30 rounded-lg p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    rep.loopClosure.outcome === 'behavior_changed' || rep.loopClosure.outcome === 'commitment_held'
                      ? 'bg-emerald-100 text-emerald-700'
                      : rep.loopClosure.outcome === 'partial_change'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {rep.loopClosure.outcome?.replace(/_/g, ' ')}
                  </span>
                </div>
                
                {rep.loopClosure.behavior_observed && (
                  <div>
                    <span className="text-xs font-medium text-emerald-700">Observed:</span>
                    <p className="text-emerald-900">{rep.loopClosure.behavior_observed}</p>
                  </div>
                )}
                
                {rep.loopClosure.notes && (
                  <div>
                    <span className="text-xs font-medium text-emerald-700">Notes:</span>
                    <p className="text-emerald-900">{rep.loopClosure.notes}</p>
                  </div>
                )}
                
                {rep.loopClosedAt && (
                  <div className="text-xs text-emerald-600">
                    Closed: {formatDate(rep.loopClosedAt)}
                  </div>
                )}
              </div>
            </Section>
          )}
          
          {/* Cancel Reason */}
          {rep.cancelReason && (
            <Section title="Cancellation" icon={X}>
              <div className="bg-gray-100 dark:bg-slate-700 rounded-lg p-3">
                <p className="text-gray-700 dark:text-slate-300">{rep.cancelReason}</p>
              </div>
            </Section>
          )}
          
          {/* Timeline */}
          <Section title="Timeline" icon={Clock}>
            <div className="space-y-1 text-xs text-gray-500 dark:text-slate-400">
              {rep.createdAt && <div>Created: {formatDate(rep.createdAt)}</div>}
              {rep.preparedAt && <div>Prepared: {formatDate(rep.preparedAt)}</div>}
              {rep.scheduledAt && <div>Scheduled: {formatDate(rep.scheduledAt)}</div>}
              {rep.executedAt && <div>Executed: {formatDate(rep.executedAt)}</div>}
              {rep.debriefedAt && <div>Debriefed: {formatDate(rep.debriefedAt)}</div>}
              {rep.loopClosedAt && <div>Loop Closed: {formatDate(rep.loopClosedAt)}</div>}
            </div>
          </Section>
        </div>
        
        {/* Footer - Mobile-safe padding */}
        <div 
          className="p-4 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-700/50"
          style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))' }}
        >
          <Button
            onClick={onClose}
            className="w-full bg-corporate-navy hover:bg-corporate-navy/90 text-white"
          >
            Close
          </Button>
        </div>
      </Card>
      </div>
    </div>
  );
};

export default RepDetailModal;
