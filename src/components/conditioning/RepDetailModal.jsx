// src/components/conditioning/RepDetailModal.jsx
// Rich rep detail view - shows full journey, evidence, assessment, and outcome
// V2: Google-style information-rich layout

import React, { useMemo, useState, useEffect } from 'react';
import { Button } from '../ui';
import { 
  User, Calendar, FileText, MessageSquare, Target, Info, 
  CheckCircle, XCircle, Clock, ChevronDown, Star, Award,
  MessageCircle, Mic, ClipboardList, ArrowRight, AlertTriangle,
  Sparkles, TrendingUp
} from 'lucide-react';
import { getRepTypeV2 } from '../../services/repTaxonomy.js';
import { formatDisplayDate } from '../../services/dateUtils.js';
import { useAppServices } from '../../services/useAppServices.jsx';
import conditioningService from '../../services/conditioningService.js';
import ConditioningModal from './ConditioningModal';
import QualityAssessmentCard from './QualityAssessmentCard';

// Status configuration
const STATUS_CONFIG = {
  draft: { label: 'Draft', color: 'text-slate-500', bg: 'bg-slate-100 dark:bg-slate-700', icon: FileText },
  committed: { label: 'Committed', color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30', icon: Clock },
  prepared: { label: 'Prepared', color: 'text-corporate-navy', bg: 'bg-slate-100 dark:bg-slate-700', icon: FileText },
  executed: { label: 'Executed', color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-900/30', icon: CheckCircle },
  debriefed: { label: 'Assessed', color: 'text-corporate-teal', bg: 'bg-corporate-teal/10', icon: Award },
  loop_closed: { label: 'Completed', color: 'text-emerald-600', bg: 'bg-emerald-100 dark:bg-emerald-900/30', icon: CheckCircle },
  missed: { label: 'Missed', color: 'text-corporate-orange', bg: 'bg-corporate-orange/10', icon: XCircle },
  canceled: { label: 'Canceled', color: 'text-slate-400', bg: 'bg-slate-100 dark:bg-slate-700', icon: XCircle },
};

// Timeline step component
const TimelineStep = ({ label, completed, active, timestamp }) => (
  <div className="flex items-center gap-2">
    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
      completed ? 'bg-corporate-teal text-white' :
      active ? 'bg-corporate-teal/20 text-corporate-teal border-2 border-corporate-teal' :
      'bg-slate-200 dark:bg-slate-700 text-slate-400'
    }`}>
      {completed ? <CheckCircle className="w-4 h-4" /> : null}
    </div>
    <div className="flex-1">
      <div className={`text-xs font-medium ${completed || active ? 'text-corporate-navy dark:text-white' : 'text-slate-400'}`}>
        {label}
      </div>
      {timestamp && (
        <div className="text-[10px] text-slate-400">{timestamp}</div>
      )}
    </div>
  </div>
);

// Expandable section component
const ExpandableSection = ({ title, icon: Icon, children, defaultExpanded = false, badge = null }) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  
  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-corporate-teal" />
          <span className="font-medium text-sm text-corporate-navy dark:text-white">{title}</span>
          {badge && (
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${badge.bg} ${badge.color}`}>
              {badge.label}
            </span>
          )}
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>
      {expanded && (
        <div className="p-3 bg-white dark:bg-slate-900">
          {children}
        </div>
      )}
    </div>
  );
};

// ============================================
// MAIN MODAL COMPONENT
// ============================================
const RepDetailModal = ({ isOpen, onClose, rep, ownerUserId, children }) => {
  const { db, user } = useAppServices();
  const [evidence, setEvidence] = useState(null);
  const [loading, setLoading] = useState(false);
  const effectiveUserId = ownerUserId || user?.uid;
  
  const repTypeConfig = useMemo(() => getRepTypeV2(rep?.repType), [rep?.repType]);
  const statusConfig = STATUS_CONFIG[rep?.status] || STATUS_CONFIG.committed;
  const StatusIcon = statusConfig.icon;
  
  // Get situation text
  const situationText = useMemo(() => {
    if (typeof rep?.situation === 'object') {
      return rep.situation.customContext || rep.situation.selected || 'Not specified';
    }
    return rep?.situation || rep?.context || 'Not specified';
  }, [rep?.situation, rep?.context]);
  
  // Timeline stages
  const stages = useMemo(() => {
    const stageList = ['Commit', 'Prep', 'Do Rep', 'Assess', 'Complete'];
    const statusOrder = { draft: 0, committed: 1, prepared: 2, executed: 3, debriefed: 4, loop_closed: 5 };
    const currentStage = statusOrder[rep?.status] ?? 0;
    
    return stageList.map((label, idx) => ({
      label,
      completed: idx < currentStage || rep?.status === 'loop_closed',
      active: idx === currentStage && rep?.status !== 'loop_closed',
      timestamp: idx === 0 && rep?.committedAt ? formatDisplayDate(rep.committedAt) :
                 idx === 1 && rep?.preparedAt ? formatDisplayDate(rep.preparedAt) :
                 idx === 2 && rep?.executedAt ? formatDisplayDate(rep.executedAt) :
                 idx === 3 && rep?.debriefedAt ? formatDisplayDate(rep.debriefedAt) :
                 idx === 4 && rep?.completedAt ? formatDisplayDate(rep.completedAt) : null
    }));
  }, [rep?.status, rep?.committedAt, rep?.preparedAt, rep?.executedAt, rep?.debriefedAt, rep?.completedAt]);
  
  // Load evidence when modal opens
  useEffect(() => {
    if (!isOpen || !rep?.id || !db || !effectiveUserId) return;
    
    const loadEvidence = async () => {
      setLoading(true);
      try {
        const evidenceData = await conditioningService.getEvidence(db, effectiveUserId, rep.id);
        setEvidence(evidenceData);
      } catch (err) {
        console.error('Error loading evidence:', err);
      } finally {
        setLoading(false);
      }
    };
    
    loadEvidence();
  }, [isOpen, rep?.id, db, effectiveUserId]);
  
  // Early return after all hooks
  if (!isOpen || !rep) return null;
  
  // Extract evidence details
  const sceResponses = evidence?.sce_responses || {};
  const selfAssessment = evidence?.self_assessment || {};
  const qualityAssessment = evidence?.qualityAssessment;
  const loopClosure = rep.loopClosure;
  
  // Format SCE response key to label
  const formatSCEKey = (key) => {
    const labels = {
      what_you_said: 'What You Said',
      their_response: 'Their Response',
      ownership_response: 'Ownership Response',
      other_notes: 'Additional Notes'
    };
    return labels[key] || key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };
  
  return (
    <ConditioningModal
      isOpen={isOpen}
      onClose={onClose}
      title="Rep Details"
      icon={Info}
      maxWidth="max-w-lg"
    >
      <div className="p-4 space-y-4 max-h-[75vh] overflow-y-auto">
        
        {/* Header: Rep Type + Status */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-corporate-teal" />
              <span className="font-bold text-lg text-corporate-navy dark:text-white">
                {repTypeConfig?.label || 'Real Rep'}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <User className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-600 dark:text-slate-300">{rep.person || 'Unknown'}</span>
            </div>
          </div>
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full ${statusConfig.bg}`}>
            <StatusIcon className={`w-4 h-4 ${statusConfig.color}`} />
            <span className={`text-sm font-medium ${statusConfig.color}`}>{statusConfig.label}</span>
          </div>
        </div>
        
        {/* Timeline */}
        <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
          <div className="flex items-center justify-between gap-1">
            {stages.map((stage, i) => (
              <React.Fragment key={stage.label}>
                <TimelineStep {...stage} />
                {i < stages.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-1 ${stage.completed ? 'bg-corporate-teal' : 'bg-slate-200 dark:bg-slate-700'}`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
        
        {/* Situation Context */}
        <ExpandableSection title="Situation" icon={MessageSquare} defaultExpanded>
          <p className="text-sm text-slate-600 dark:text-slate-300">{situationText}</p>
          {rep.commitContext && (
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 italic">"{rep.commitContext}"</p>
          )}
        </ExpandableSection>
        
        {/* Evidence Captured */}
        {(Object.keys(sceResponses).length > 0 || evidence?.notes) && (
          <ExpandableSection 
            title="Evidence Captured" 
            icon={ClipboardList} 
            defaultExpanded={rep.status === 'debriefed' || rep.status === 'loop_closed'}
            badge={evidence?.recordingUrl ? { label: 'Audio', bg: 'bg-blue-100 dark:bg-blue-900/30', color: 'text-blue-600' } : null}
          >
            <div className="space-y-3">
              {Object.entries(sceResponses).map(([key, value]) => {
                if (!value || (typeof value === 'string' && !value.trim())) return null;
                const displayValue = typeof value === 'object' 
                  ? (value.comment || value.answer || JSON.stringify(value))
                  : value;
                return (
                  <div key={key}>
                    <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                      {formatSCEKey(key)}
                    </div>
                    <div className="text-sm text-corporate-navy dark:text-white bg-slate-50 dark:bg-slate-800 p-2 rounded">
                      "{displayValue}"
                    </div>
                  </div>
                );
              })}
              {evidence?.notes && (
                <div>
                  <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Notes</div>
                  <div className="text-sm text-corporate-navy dark:text-white bg-slate-50 dark:bg-slate-800 p-2 rounded">
                    {evidence.notes}
                  </div>
                </div>
              )}
            </div>
          </ExpandableSection>
        )}
        
        {/* Self Assessment */}
        {Object.keys(selfAssessment).length > 0 && (
          <ExpandableSection title="Self-Assessment" icon={Sparkles}>
            <div className="space-y-2">
              {Object.entries(selfAssessment).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-800 rounded">
                  <span className="text-sm text-slate-600 dark:text-slate-300">
                    {key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                  </span>
                  <span className="text-sm font-medium text-corporate-navy dark:text-white">{value}</span>
                </div>
              ))}
            </div>
          </ExpandableSection>
        )}
        
        {/* AI Assessment */}
        {qualityAssessment && (
          <ExpandableSection 
            title="RepUp Assessment" 
            icon={Award} 
            defaultExpanded
            badge={{
              label: qualityAssessment.repPassed ? 'Passed' : 'Not Passed',
              bg: qualityAssessment.repPassed ? 'bg-corporate-teal/10' : 'bg-corporate-orange/10',
              color: qualityAssessment.repPassed ? 'text-corporate-teal' : 'text-corporate-orange'
            }}
          >
            <QualityAssessmentCard 
              qualityAssessment={qualityAssessment}
              compact={false}
              defaultExpanded
            />
          </ExpandableSection>
        )}
        
        {/* Outcome / Loop Closure */}
        {loopClosure && (
          <ExpandableSection 
            title="Outcome" 
            icon={CheckCircle}
            defaultExpanded
            badge={{
              label: loopClosure.outcome?.replace(/_/g, ' ') || 'Completed',
              bg: loopClosure.outcome === 'achieved' ? 'bg-corporate-teal/10' : 'bg-slate-100 dark:bg-slate-700',
              color: loopClosure.outcome === 'achieved' ? 'text-corporate-teal' : 'text-slate-600'
            }}
          >
            <div className="space-y-3">
              {loopClosure.outcome && (
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-corporate-teal" />
                  <span className="text-sm text-corporate-navy dark:text-white">
                    {loopClosure.outcome === 'achieved' ? 'Expectations met' : 
                     loopClosure.outcome === 'partial' ? 'Partially achieved' :
                     loopClosure.outcome === 'not_achieved' ? 'Not achieved - follow-up needed' :
                     loopClosure.outcome?.replace(/_/g, ' ')}
                  </span>
                </div>
              )}
              {loopClosure.reflection && (
                <div>
                  <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Reflection</div>
                  <div className="text-sm text-corporate-navy dark:text-white bg-slate-50 dark:bg-slate-800 p-2 rounded italic">
                    "{loopClosure.reflection}"
                  </div>
                </div>
              )}
              {loopClosure.nextSteps && (
                <div>
                  <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Next Steps</div>
                  <div className="text-sm text-corporate-navy dark:text-white bg-slate-50 dark:bg-slate-800 p-2 rounded">
                    {loopClosure.nextSteps}
                  </div>
                </div>
              )}
            </div>
          </ExpandableSection>
        )}
        
        {/* Dates */}
        <div className="flex items-center gap-4 text-xs text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
          {rep.committedAt && (
            <span>Committed: {formatDisplayDate(rep.committedAt)}</span>
          )}
          {rep.completedAt && (
            <span>Completed: {formatDisplayDate(rep.completedAt)}</span>
          )}
        </div>
        
        {/* Loading indicator */}
        {loading && (
          <div className="flex items-center justify-center py-4">
            <div className="w-5 h-5 border-2 border-corporate-teal/20 border-t-corporate-teal rounded-full animate-spin" />
          </div>
        )}
        
        {/* Optional extra content (e.g., facilitator feedback in admin context) */}
        {children}

        {/* Close Button */}
        <Button
          onClick={onClose}
          className="w-full bg-corporate-teal hover:bg-corporate-teal/90 text-white"
        >
          Close
        </Button>
      </div>
    </ConditioningModal>
  );
};

export default RepDetailModal;
