/**
 * LR-Instantly - Sequence Builder
 * 
 * Visual sequence step editor for multi-step outreach.
 * Part of the LR-Instantly email automation engine.
 * 
 * Features:
 * - Drag-and-drop step reordering (visual only for now)
 * - Day delay configuration
 * - Template selection per step
 * - Subject line customization
 * - Settings like stopOnReply, send window
 */

import React, { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  Mail,
  Linkedin,
  Phone,
  MessageSquare,
  GripVertical,
  Clock,
  ArrowRight,
  Zap,
  Settings,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle,
  Eye
} from 'lucide-react';
import { useOutreachStore, CHANNELS } from '../../stores/outreachStore';
import { substituteVariables } from '../../stores/sequenceStore';

const CHANNEL_ICONS = {
  email: Mail,
  linkedin: Linkedin,
  call: Phone,
  text: MessageSquare,
};

const CHANNEL_COLORS = {
  email: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', icon: 'text-blue-600' },
  linkedin: { bg: 'bg-sky-50', border: 'border-sky-200', text: 'text-sky-700', icon: 'text-sky-600' },
  call: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', icon: 'text-green-600' },
  text: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', icon: 'text-purple-600' },
};

// Default send window settings
const DEFAULT_SEND_WINDOW = {
  startHour: 8,
  endHour: 18,
  timezone: 'America/New_York',
  weekdaysOnly: true
};

export default function SequenceBuilder({ 
  sequence, 
  onClose, 
  onSave,
  isLoading = false 
}) {
  const { templates } = useOutreachStore();
  
  // Form state
  const [name, setName] = useState(sequence?.name || '');
  const [description, setDescription] = useState(sequence?.description || '');
  const [steps, setSteps] = useState(sequence?.steps || [
    { day: 0, channel: 'email', templateId: '', subject: '' }
  ]);
  const [stopOnReply, setStopOnReply] = useState(sequence?.stopOnReply ?? true);
  const [sendWindow, setSendWindow] = useState(sequence?.sendWindow || DEFAULT_SEND_WINDOW);
  const [showSettings, setShowSettings] = useState(false);
  const [previewStep, setPreviewStep] = useState(null);
  
  // Validation
  const [errors, setErrors] = useState({});
  
  // Sample variables for preview
  const sampleVariables = {
    firstName: 'John',
    lastName: 'Smith',
    name: 'John Smith',
    email: 'john@acme.com',
    company: 'Acme Corp',
    title: 'VP of Sales'
  };
  
  // Get template by ID
  const getTemplate = (templateId) => templates.find(t => t.id === templateId);
  
  // Add a new step
  const addStep = () => {
    const lastStep = steps[steps.length - 1];
    const newDay = (lastStep?.day || 0) + 3;
    setSteps([...steps, { 
      day: newDay, 
      channel: 'email', 
      templateId: '', 
      subject: '' 
    }]);
  };
  
  // Remove a step
  const removeStep = (index) => {
    if (steps.length > 1) {
      setSteps(steps.filter((_, i) => i !== index));
    }
  };
  
  // Update a step
  const updateStep = (index, updates) => {
    setSteps(steps.map((step, i) => 
      i === index ? { ...step, ...updates } : step
    ));
  };
  
  // Move step up/down
  const moveStep = (index, direction) => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === steps.length - 1)
    ) return;
    
    const newSteps = [...steps];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newSteps[index], newSteps[targetIndex]] = [newSteps[targetIndex], newSteps[index]];
    setSteps(newSteps);
  };
  
  // Validate form
  const validate = () => {
    const newErrors = {};
    
    if (!name.trim()) {
      newErrors.name = 'Sequence name is required';
    }
    
    if (steps.length === 0) {
      newErrors.steps = 'At least one step is required';
    }
    
    steps.forEach((step, i) => {
      if (step.channel === 'email' && !step.templateId && !step.subject) {
        newErrors[`step_${i}`] = 'Email steps need a template or subject';
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle submit
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    const sequenceData = {
      name: name.trim(),
      description: description.trim(),
      steps: steps.map((step, index) => ({
        ...step,
        order: index
      })),
      stopOnReply,
      sendWindow,
      updatedAt: new Date().toISOString()
    };
    
    onSave(sequenceData);
  };
  
  // Get available templates for a channel
  const getChannelTemplates = (channel) => 
    templates.filter(t => t.channel === channel);
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-brand-teal/10 to-blue-500/10">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              {sequence ? 'Edit Sequence' : 'Create Sequence'}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
              Build an automated multi-step outreach workflow
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>
        
        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Sequence Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., VP Sales Cold Outreach"
                className={`w-full px-4 py-2.5 border rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-teal focus:border-transparent transition-all ${
                  errors.name ? 'border-red-300' : 'border-slate-200 dark:border-slate-600'
                }`}
              />
              {errors.name && (
                <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.name}
                </p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Description
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of this sequence"
                className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-teal focus:border-transparent transition-all"
              />
            </div>
          </div>
          
          {/* Sequence Steps */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Sequence Steps
              </label>
              <button
                type="button"
                onClick={addStep}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-brand-teal hover:bg-brand-teal/10 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Step
              </button>
            </div>
            
            {errors.steps && (
              <p className="text-red-500 text-xs mb-2 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.steps}
              </p>
            )}
            
            {/* Steps Timeline */}
            <div className="space-y-3">
              {steps.map((step, index) => {
                const StepIcon = CHANNEL_ICONS[step.channel] || Mail;
                const colors = CHANNEL_COLORS[step.channel] || CHANNEL_COLORS.email;
                const template = getTemplate(step.templateId);
                const channelTemplates = getChannelTemplates(step.channel);
                const hasError = errors[`step_${index}`];
                
                return (
                  <div 
                    key={index}
                    className={`relative rounded-xl border-2 transition-all ${
                      hasError 
                        ? 'border-red-300 bg-red-50 dark:bg-red-900/20' 
                        : `${colors.border} ${colors.bg} dark:bg-slate-900`
                    }`}
                  >
                    {/* Step Header */}
                    <div className="flex items-center gap-3 px-4 py-3">
                      {/* Step Number & Icon */}
                      <div className={`flex items-center justify-center w-10 h-10 rounded-xl ${colors.bg} border ${colors.border}`}>
                        <StepIcon className={`w-5 h-5 ${colors.icon}`} />
                      </div>
                      
                      {/* Step Info */}
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-3">
                        {/* Day */}
                        <div>
                          <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                            Send on Day
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min="0"
                              value={step.day}
                              onChange={(e) => updateStep(index, { day: parseInt(e.target.value) || 0 })}
                              className="w-20 px-3 py-1.5 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                            />
                            {step.day === 0 && (
                              <span className="text-xs text-emerald-600 flex items-center gap-1">
                                <Zap className="w-3 h-3" /> Immediate
                              </span>
                            )}
                          </div>
                        </div>
                        
                        {/* Channel */}
                        <div>
                          <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                            Channel
                          </label>
                          <select
                            value={step.channel}
                            onChange={(e) => updateStep(index, { 
                              channel: e.target.value, 
                              templateId: '' // Reset template when channel changes
                            })}
                            className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                          >
                            {CHANNELS.map(ch => (
                              <option key={ch.value} value={ch.value}>{ch.label}</option>
                            ))}
                          </select>
                        </div>
                        
                        {/* Template */}
                        <div className="md:col-span-2">
                          <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                            Template
                          </label>
                          <select
                            value={step.templateId}
                            onChange={(e) => {
                              const tmpl = getTemplate(e.target.value);
                              updateStep(index, { 
                                templateId: e.target.value,
                                subject: tmpl?.subject || step.subject
                              });
                            }}
                            className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                          >
                            <option value="">Select template...</option>
                            {channelTemplates.map(t => (
                              <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex items-center gap-1">
                        {/* Preview */}
                        {template && (
                          <button
                            type="button"
                            onClick={() => setPreviewStep(previewStep === index ? null : index)}
                            className={`p-2 rounded-lg transition-colors ${
                              previewStep === index 
                                ? 'bg-brand-teal text-white' 
                                : 'hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500'
                            }`}
                            title="Preview"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
                        
                        {/* Move Up/Down */}
                        <button
                          type="button"
                          onClick={() => moveStep(index, 'up')}
                          disabled={index === 0}
                          className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed text-slate-500"
                          title="Move up"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveStep(index, 'down')}
                          disabled={index === steps.length - 1}
                          className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed text-slate-500"
                          title="Move down"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                        
                        {/* Delete */}
                        {steps.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeStep(index)}
                            className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg text-slate-500 hover:text-red-600 transition-colors"
                            title="Remove step"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                    
                    {/* Custom Subject Line (for email) */}
                    {step.channel === 'email' && (
                      <div className="px-4 pb-3">
                        <input
                          type="text"
                          value={step.subject}
                          onChange={(e) => updateStep(index, { subject: e.target.value })}
                          placeholder="Subject line (use {{firstName}}, {{company}}, etc.)"
                          className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                        />
                      </div>
                    )}
                    
                    {/* Template Preview */}
                    {previewStep === index && template && (
                      <div className="mx-4 mb-4 p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-600">
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Preview (with sample data):</p>
                        {step.subject && (
                          <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Subject: {substituteVariables(step.subject, sampleVariables)}
                          </p>
                        )}
                        <div className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap">
                          {substituteVariables(template.content, sampleVariables)}
                        </div>
                      </div>
                    )}
                    
                    {/* Error Message */}
                    {hasError && (
                      <div className="px-4 pb-3">
                        <p className="text-red-500 text-xs flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> {errors[`step_${index}`]}
                        </p>
                      </div>
                    )}
                    
                    {/* Arrow to next step */}
                    {index < steps.length - 1 && (
                      <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 z-10">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 border-2 border-white dark:border-slate-800 shadow">
                          <ArrowRight className="w-4 h-4 text-slate-400 rotate-90" />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            
            {/* Add Step Button (bottom) */}
            <button
              type="button"
              onClick={addStep}
              className="w-full mt-4 py-3 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl text-slate-500 dark:text-slate-400 hover:border-brand-teal hover:text-brand-teal transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add Another Step
            </button>
          </div>
          
          {/* Settings */}
          <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
            <button
              type="button"
              onClick={() => setShowSettings(!showSettings)}
              className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            >
              <Settings className="w-4 h-4" />
              Sequence Settings
              <ChevronDown className={`w-4 h-4 transition-transform ${showSettings ? 'rotate-180' : ''}`} />
            </button>
            
            {showSettings && (
              <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-xl space-y-4">
                {/* Stop on Reply */}
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={stopOnReply}
                    onChange={(e) => setStopOnReply(e.target.checked)}
                    className="w-5 h-5 rounded border-slate-300 text-brand-teal focus:ring-brand-teal"
                  />
                  <div>
                    <p className="font-medium text-slate-900 dark:text-slate-100">Stop on Reply</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Automatically pause sequence when prospect replies
                    </p>
                  </div>
                </label>
                
                {/* Send Window */}
                <div>
                  <p className="font-medium text-slate-900 dark:text-slate-100 mb-2">Send Window</p>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Start Hour</label>
                      <select
                        value={sendWindow.startHour}
                        onChange={(e) => setSendWindow(prev => ({ ...prev, startHour: parseInt(e.target.value) }))}
                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                      >
                        {Array.from({ length: 24 }, (_, i) => (
                          <option key={i} value={i}>
                            {i === 0 ? '12 AM' : i < 12 ? `${i} AM` : i === 12 ? '12 PM' : `${i - 12} PM`}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">End Hour</label>
                      <select
                        value={sendWindow.endHour}
                        onChange={(e) => setSendWindow(prev => ({ ...prev, endHour: parseInt(e.target.value) }))}
                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                      >
                        {Array.from({ length: 24 }, (_, i) => (
                          <option key={i} value={i}>
                            {i === 0 ? '12 AM' : i < 12 ? `${i} AM` : i === 12 ? '12 PM' : `${i - 12} PM`}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Timezone</label>
                      <select
                        value={sendWindow.timezone}
                        onChange={(e) => setSendWindow(prev => ({ ...prev, timezone: e.target.value }))}
                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                      >
                        <option value="America/New_York">Eastern</option>
                        <option value="America/Chicago">Central</option>
                        <option value="America/Denver">Mountain</option>
                        <option value="America/Los_Angeles">Pacific</option>
                      </select>
                    </div>
                  </div>
                  
                  <label className="flex items-center gap-2 mt-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sendWindow.weekdaysOnly}
                      onChange={(e) => setSendWindow(prev => ({ ...prev, weekdaysOnly: e.target.checked }))}
                      className="w-4 h-4 rounded border-slate-300 text-brand-teal focus:ring-brand-teal"
                    />
                    <span className="text-sm text-slate-600 dark:text-slate-400">Weekdays only</span>
                  </label>
                </div>
              </div>
            )}
          </div>
        </form>
        
        {/* Footer */}
        <div className="flex items-center justify-between gap-3 p-5 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
          <div className="text-sm text-slate-500 dark:text-slate-400">
            {steps.length} step{steps.length !== 1 ? 's' : ''} • 
            {steps[steps.length - 1]?.day || 0} day{steps[steps.length - 1]?.day !== 1 ? 's' : ''} total
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="px-6 py-2.5 bg-gradient-to-r from-brand-teal to-emerald-500 text-white rounded-lg font-medium hover:from-brand-teal/90 hover:to-emerald-500/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  {sequence ? 'Update Sequence' : 'Create Sequence'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
