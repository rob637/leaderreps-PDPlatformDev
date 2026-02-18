/**
 * LR-Instantly - Enroll In Sequence Modal
 * 
 * Enroll a prospect into an email sequence.
 * Part of the LR-Instantly email automation engine.
 * 
 * Features:
 * - Select from available sequences
 * - Review/edit personalization variables
 * - Preview first email
 * - Choose immediate or delayed start
 */

import React, { useState, useMemo } from 'react';
import {
  X,
  Mail,
  Zap,
  Calendar,
  User,
  Building2,
  AlertCircle,
  CheckCircle,
  ChevronRight,
  Clock,
  Play,
  Eye
} from 'lucide-react';
import { useOutreachStore } from '../../stores/outreachStore';
import { useSequenceStore, substituteVariables } from '../../stores/sequenceStore';
import { useAuthStore } from '../../stores/authStore';

export default function EnrollInSequenceModal({ 
  prospect, 
  onClose, 
  onSuccess 
}) {
  const { user } = useAuthStore();
  const { sequences, templates } = useOutreachStore();
  const { enrollProspect, getProspectEnrollments } = useSequenceStore();
  
  // Form state
  const [selectedSequenceId, setSelectedSequenceId] = useState('');
  const [startImmediately, setStartImmediately] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const [isEnrolling, setIsEnrolling] = useState(false);
  
  // Editable personalization variables
  const [variables, setVariables] = useState({
    firstName: prospect?.firstName || prospect?.name?.split(' ')[0] || '',
    lastName: prospect?.lastName || prospect?.name?.split(' ').slice(1).join(' ') || '',
    name: prospect?.name || '',
    email: prospect?.email || '',
    company: prospect?.company || '',
    title: prospect?.title || '',
    phone: prospect?.phone || '',
  });
  
  // Get sequences with steps
  const availableSequences = useMemo(() => {
    return sequences.filter(s => s.steps?.length > 0);
  }, [sequences]);
  
  // Get selected sequence
  const selectedSequence = useMemo(() => {
    return sequences.find(s => s.id === selectedSequenceId);
  }, [sequences, selectedSequenceId]);
  
  // Get existing enrollments for this prospect
  const existingEnrollments = getProspectEnrollments(prospect?.id);
  const activeEnrollments = existingEnrollments.filter(e => e.status === 'active');
  
  // Check if already enrolled in selected sequence
  const alreadyEnrolled = existingEnrollments.some(
    e => e.sequenceId === selectedSequenceId && ['active', 'paused'].includes(e.status)
  );
  
  // Get first step template for preview
  const firstStepTemplate = useMemo(() => {
    if (!selectedSequence?.steps?.[0]?.templateId) return null;
    return templates.find(t => t.id === selectedSequence.steps[0].templateId);
  }, [selectedSequence, templates]);
  
  // Handle enrollment
  const handleEnroll = async () => {
    if (!selectedSequence || !prospect) return;
    
    setIsEnrolling(true);
    try {
      const enrollmentId = await enrollProspect({
        prospect,
        sequence: selectedSequence,
        variables,
        ownerId: user.email || user.uid,
        ownerName: user.displayName || user.email?.split('@')[0] || 'Unknown',
        startImmediately
      });
      
      if (enrollmentId) {
        onSuccess?.();
        onClose();
      }
    } finally {
      setIsEnrolling(false);
    }
  };
  
  // Update a variable
  const updateVariable = (key, value) => {
    setVariables(prev => ({ ...prev, [key]: value }));
  };
  
  if (!prospect) return null;
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl max-w-xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-700">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Add to Sequence
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              {prospect.name || prospect.email}
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Already Enrolled Warning */}
          {activeEnrollments.length > 0 && (
            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-amber-800 dark:text-amber-200">
                  Already enrolled in {activeEnrollments.length} sequence{activeEnrollments.length > 1 ? 's' : ''}
                </p>
                <p className="text-amber-600 dark:text-amber-300 mt-0.5">
                  {activeEnrollments.map(e => e.sequenceName).join(', ')}
                </p>
              </div>
            </div>
          )}
          
          {/* Sequence Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Select Sequence
            </label>
            
            {availableSequences.length === 0 ? (
              <div className="p-6 border-2 border-dashed border-slate-200 dark:border-slate-600 rounded-xl text-center">
                <Mail className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-slate-500 dark:text-slate-400">No sequences available</p>
                <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
                  Create a sequence in Outreach Center first
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {availableSequences.map((seq) => {
                  const isSelected = selectedSequenceId === seq.id;
                  const isAlreadyInSeq = existingEnrollments.some(
                    e => e.sequenceId === seq.id && ['active', 'paused'].includes(e.status)
                  );
                  
                  return (
                    <button
                      key={seq.id}
                      type="button"
                      onClick={() => !isAlreadyInSeq && setSelectedSequenceId(seq.id)}
                      disabled={isAlreadyInSeq}
                      className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                        isAlreadyInSeq
                          ? 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 opacity-50 cursor-not-allowed'
                          : isSelected
                          ? 'border-brand-teal bg-brand-teal/5'
                          : 'border-slate-200 dark:border-slate-600 hover:border-brand-teal/50'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-slate-900 dark:text-slate-100">
                              {seq.name}
                            </h3>
                            {isAlreadyInSeq && (
                              <span className="text-xs px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-full">
                                Already enrolled
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                            {seq.description}
                          </p>
                        </div>
                        {isSelected && !isAlreadyInSeq && (
                          <CheckCircle className="w-5 h-5 text-brand-teal flex-shrink-0" />
                        )}
                      </div>
                      
                      {/* Step Preview */}
                      <div className="flex items-center gap-1 mt-3 overflow-x-auto">
                        {seq.steps?.slice(0, 5).map((step, i) => (
                          <div key={i} className="flex items-center">
                            <div className={`px-2 py-1 text-xs rounded ${
                              step.channel === 'email' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' :
                              step.channel === 'linkedin' ? 'bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300' :
                              'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                            }`}>
                              Day {step.day}
                            </div>
                            {i < Math.min(seq.steps.length - 1, 4) && (
                              <ChevronRight className="w-3 h-3 text-slate-400 mx-0.5" />
                            )}
                          </div>
                        ))}
                        {seq.steps?.length > 5 && (
                          <span className="text-xs text-slate-400 ml-1">+{seq.steps.length - 5} more</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          
          {/* Personalization Variables */}
          {selectedSequence && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Personalization Variables
                </label>
                {firstStepTemplate && (
                  <button
                    type="button"
                    onClick={() => setShowPreview(!showPreview)}
                    className={`flex items-center gap-1 text-xs px-2 py-1 rounded ${
                      showPreview 
                        ? 'bg-brand-teal text-white' 
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    <Eye className="w-3 h-3" />
                    Preview
                  </button>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">First Name</label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={variables.firstName}
                      onChange={(e) => updateVariable('firstName', e.target.value)}
                      className="w-full pl-9 pr-3 py-2 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-lg text-sm"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={variables.lastName}
                    onChange={(e) => updateVariable('lastName', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-lg text-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Company</label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={variables.company}
                      onChange={(e) => updateVariable('company', e.target.value)}
                      className="w-full pl-9 pr-3 py-2 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-lg text-sm"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Title</label>
                  <input
                    type="text"
                    value={variables.title}
                    onChange={(e) => updateVariable('title', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-lg text-sm"
                  />
                </div>
              </div>
              
              {/* Email Preview */}
              {showPreview && firstStepTemplate && (
                <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl">
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-2">
                    <Mail className="w-3 h-3" />
                    First Email Preview
                  </div>
                  {selectedSequence.steps[0]?.subject && (
                    <p className="font-medium text-slate-800 dark:text-slate-200 mb-2">
                      Subject: {substituteVariables(selectedSequence.steps[0].subject, variables)}
                    </p>
                  )}
                  <div className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap max-h-40 overflow-y-auto">
                    {substituteVariables(firstStepTemplate.content, variables)}
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Start Options */}
          {selectedSequence && (
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStartImmediately(true)}
                className={`flex-1 p-4 rounded-xl border-2 text-left transition-all ${
                  startImmediately
                    ? 'border-brand-teal bg-brand-teal/5'
                    : 'border-slate-200 dark:border-slate-600 hover:border-brand-teal/50'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Zap className={`w-4 h-4 ${startImmediately ? 'text-brand-teal' : 'text-slate-400'}`} />
                  <span className="font-medium text-slate-900 dark:text-slate-100">Start Immediately</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Send first email right away
                </p>
              </button>
              
              <button
                type="button"
                onClick={() => setStartImmediately(false)}
                className={`flex-1 p-4 rounded-xl border-2 text-left transition-all ${
                  !startImmediately
                    ? 'border-brand-teal bg-brand-teal/5'
                    : 'border-slate-200 dark:border-slate-600 hover:border-brand-teal/50'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Clock className={`w-4 h-4 ${!startImmediately ? 'text-brand-teal' : 'text-slate-400'}`} />
                  <span className="font-medium text-slate-900 dark:text-slate-100">Schedule</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Follow sequence day schedule
                </p>
              </button>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-5 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleEnroll}
            disabled={!selectedSequence || isEnrolling || alreadyEnrolled}
            className="px-6 py-2.5 bg-gradient-to-r from-brand-teal to-emerald-500 text-white rounded-lg font-medium hover:from-brand-teal/90 hover:to-emerald-500/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isEnrolling ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Enrolling...
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Start Sequence
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
