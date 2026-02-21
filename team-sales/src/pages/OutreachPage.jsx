import { useState, useEffect, useMemo } from 'react';
import { 
  Mail, Phone, Linkedin, MessageSquare, Plus, Edit2, Trash2, 
  Copy, Check, X, ChevronRight, ChevronUp, ChevronDown, Clock, BarChart3, Users, Zap,
  PlayCircle, Send, Inbox, RefreshCw, Search, Filter
} from 'lucide-react';
import { useOutreachStore, CHANNELS, OUTCOMES } from '../stores/outreachStore';
import { useAuthStore } from '../stores/authStore';
import { useSequenceStore } from '../stores/sequenceStore';
import useGmailStore from '../stores/gmailStore';
import * as gmail from '../lib/gmail';
import { format, formatDistanceToNow } from 'date-fns';
import { SequenceBuilder, SequenceEnrollmentsDashboard, EmailQueue } from '../components/sequences';

const CHANNEL_ICONS = {
  email: Mail,
  linkedin: Linkedin,
  call: Phone,
  text: MessageSquare,
};

// Template categories
const TEMPLATE_CATEGORIES = [
  { value: 'cold_outreach', label: 'Cold Outreach' },
  { value: 'follow_up', label: 'Follow Up' },
  { value: 'meeting_request', label: 'Meeting Request' },
  { value: 'referral', label: 'Referral' },
  { value: 'nurture', label: 'Nurture' },
  { value: 'breakup', label: 'Break Up' },
];

export default function OutreachPage() {
  const { user } = useAuthStore();
  const {
    templates,
    templatesLoading,
    sequences,
    sequencesLoading,
    initialize,
    cleanup,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    createSequence,
    updateSequence,
    deleteSequence,
    getActivityStats,
  } = useOutreachStore();
  
  const [activeTab, setActiveTab] = useState('queue'); // queue, templates, sequences, enrollments
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showSequenceModal, setShowSequenceModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [editingSequence, setEditingSequence] = useState(null);
  const [copiedTemplateId, setCopiedTemplateId] = useState(null);
  
  // Sequence Engine stats
  const { getEnrollmentStats } = useSequenceStore();
  const enrollmentStats = getEnrollmentStats();
  
  const activityStats = getActivityStats();
  
  useEffect(() => {
    initialize();
    return () => cleanup();
  }, [initialize, cleanup]);
  
  const handleCopyTemplate = async (template) => {
    try {
      await navigator.clipboard.writeText(template.content);
      setCopiedTemplateId(template.id);
      setTimeout(() => setCopiedTemplateId(null), 2000);
    } catch (e) {
      // Fallback for older browsers
    }
  };
  
  const handleDeleteTemplate = async (templateId) => {
    if (confirm('Delete this template?')) {
      await deleteTemplate(templateId);
    }
  };
  
  const handleDeleteSequence = async (sequenceId) => {
    if (confirm('Delete this sequence?')) {
      await deleteSequence(sequenceId);
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">LR-Outreach</h1>
          <p className="text-slate-600 dark:text-slate-400">Email automation engine — templates, sequences, and enrollments</p>
        </div>
      </div>
      
      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Mail className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{activityStats.today}</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">Today</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <BarChart3 className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{activityStats.thisWeek}</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">This Week</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <MessageSquare className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{activityStats.replies}</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">Replies</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{activityStats.meetings}</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">Meetings</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab('queue')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'queue'
              ? 'border-brand-teal text-brand-teal'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:text-slate-100'
          }`}
        >
          <Inbox className="w-4 h-4" />
          Queue
          {enrollmentStats.dueToday > 0 && (
            <span className="px-1.5 py-0.5 text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-full">
              {enrollmentStats.dueToday}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('templates')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'templates'
              ? 'border-brand-teal text-brand-teal'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:text-slate-100'
          }`}
        >
          Templates ({templates.length})
        </button>
        <button
          onClick={() => setActiveTab('sequences')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'sequences'
              ? 'border-brand-teal text-brand-teal'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:text-slate-100'
          }`}
        >
          Sequences ({sequences.length})
        </button>
        <button
          onClick={() => setActiveTab('enrollments')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'enrollments'
              ? 'border-brand-teal text-brand-teal'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:text-slate-100'
          }`}
        >
          <Zap className="w-4 h-4" />
          Automations
          {enrollmentStats.active > 0 && (
            <span className="px-1.5 py-0.5 text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-full">
              {enrollmentStats.active}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('communications')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'communications'
              ? 'border-brand-teal text-brand-teal'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:text-slate-100'
          }`}
        >
          <Mail className="w-4 h-4" />
          Communications
        </button>
      </div>
      
      {/* Queue Tab */}
      {activeTab === 'queue' && (
        <EmailQueue />
      )}
      
      {/* Templates Tab */}
      {activeTab === 'templates' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => {
                setEditingTemplate(null);
                setShowTemplateModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-brand-teal text-white rounded-lg hover:bg-brand-teal/90"
            >
              <Plus className="w-4 h-4" />
              New Template
            </button>
          </div>
          
          {templatesLoading ? (
            <div className="text-center py-12 text-slate-500 dark:text-slate-400">Loading templates...</div>
          ) : templates.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center">
              <Mail className="w-12 h-12 text-slate-400 dark:text-slate-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">No templates yet</h3>
              <p className="text-slate-600 dark:text-slate-400 mt-1">Create your first outreach template</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {templates.map((template) => {
                const ChannelIcon = CHANNEL_ICONS[template.channel] || Mail;
                return (
                  <div key={template.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded ${
                          template.channel === 'email' ? 'bg-blue-100 text-blue-600' :
                          template.channel === 'linkedin' ? 'bg-sky-100 text-sky-600' :
                          template.channel === 'call' ? 'bg-green-100 text-green-600' :
                          'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                        }`}>
                          <ChannelIcon className="w-4 h-4" />
                        </div>
                        <h3 className="font-medium text-slate-900 dark:text-slate-100">{template.name}</h3>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleCopyTemplate(template)}
                          className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:bg-slate-700 rounded"
                          title="Copy content"
                        >
                          {copiedTemplateId === template.id ? (
                            <Check className="w-4 h-4 text-green-600" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => {
                            setEditingTemplate(template);
                            setShowTemplateModal(true);
                          }}
                          className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:bg-slate-700 rounded"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteTemplate(template.id)}
                          className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    {template.subject && (
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Subject: {template.subject}
                      </p>
                    )}
                    
                    <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-3 whitespace-pre-wrap">
                      {template.content}
                    </p>
                    
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                      <span className="text-xs px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded">
                        {TEMPLATE_CATEGORIES.find(c => c.value === template.category)?.label || template.category}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">by {template.ownerName}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
      
      {/* Sequences Tab */}
      {activeTab === 'sequences' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => {
                setEditingSequence(null);
                setShowSequenceModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-brand-teal text-white rounded-lg hover:bg-brand-teal/90"
            >
              <Plus className="w-4 h-4" />
              New Sequence
            </button>
          </div>
          
          {sequencesLoading ? (
            <div className="text-center py-12 text-slate-500 dark:text-slate-400">Loading sequences...</div>
          ) : sequences.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center">
              <Clock className="w-12 h-12 text-slate-400 dark:text-slate-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">No sequences yet</h3>
              <p className="text-slate-600 dark:text-slate-400 mt-1">Create multi-step outreach workflows</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sequences.map((sequence) => (
                <div key={sequence.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-medium text-slate-900 dark:text-slate-100">{sequence.name}</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400">{sequence.description}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingSequence(sequence);
                          setShowSequenceModal(true);
                        }}
                        className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:bg-slate-700 rounded"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteSequence(sequence.id)}
                        className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Sequence Steps */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-2">
                    {sequence.steps?.map((step, idx) => {
                      const StepIcon = CHANNEL_ICONS[step.channel] || Mail;
                      return (
                        <div key={idx} className="flex items-center">
                          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm whitespace-nowrap ${
                            step.channel === 'email' ? 'bg-blue-100 text-blue-700' :
                            step.channel === 'linkedin' ? 'bg-sky-100 text-sky-700' :
                            step.channel === 'call' ? 'bg-green-100 text-green-700' :
                            'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                          }`}>
                            <StepIcon className="w-3 h-3" />
                            Day {step.day}
                          </div>
                          {idx < sequence.steps.length - 1 && (
                            <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-500 mx-1" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                  
                  <div className="flex items-center gap-4 mt-3 pt-3 border-t text-sm text-slate-500 dark:text-slate-400">
                    <span>{sequence.steps?.length || 0} steps</span>
                    <span>by {sequence.ownerName}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* LR-Instantly Tab (Sequence Automation Engine) */}
      {activeTab === 'enrollments' && (
        <SequenceEnrollmentsDashboard />
      )}
      
      {/* Communications Tab */}
      {activeTab === 'communications' && (
        <CommunicationsTab />
      )}
      
      {/* Template Modal */}
      {showTemplateModal && (
        <TemplateModal
          template={editingTemplate}
          onClose={() => {
            setShowTemplateModal(false);
            setEditingTemplate(null);
          }}
          onSave={async (data) => {
            if (editingTemplate) {
              await updateTemplate(editingTemplate.id, data);
            } else {
              await createTemplate(data, user.uid, user.displayName || user.email);
            }
            setShowTemplateModal(false);
            setEditingTemplate(null);
          }}
        />
      )}
      
      {/* Sequence Builder Modal */}
      {showSequenceModal && (
        <SequenceBuilder
          sequence={editingSequence}
          onClose={() => {
            setShowSequenceModal(false);
            setEditingSequence(null);
          }}
          onSave={async (data) => {
            if (editingSequence) {
              await updateSequence(editingSequence.id, data);
            } else {
              await createSequence(data, user.uid, user.displayName || user.email);
            }
            setShowSequenceModal(false);
            setEditingSequence(null);
          }}
        />
      )}
    </div>
  );
}

// Template Modal Component
function TemplateModal({ template, onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: template?.name || '',
    channel: template?.channel || 'email',
    category: template?.category || 'cold_outreach',
    subject: template?.subject || '',
    content: template?.content || '',
  });
  
  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            {template ? 'Edit Template' : 'New Template'}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-500 dark:text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Template Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Initial Cold Email"
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-brand-teal focus:border-transparent"
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Channel
              </label>
              <select
                value={formData.channel}
                onChange={(e) => setFormData(prev => ({ ...prev, channel: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-brand-teal focus:border-transparent"
              >
                {CHANNELS.map(ch => (
                  <option key={ch.value} value={ch.value}>{ch.label}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-brand-teal focus:border-transparent"
              >
                {TEMPLATE_CATEGORIES.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>
          </div>
          
          {formData.channel === 'email' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Subject Line
              </label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                placeholder="e.g., Quick question about {{company}}"
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-brand-teal focus:border-transparent"
              />
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Content *
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              placeholder="Use {{name}}, {{company}}, {{title}} as placeholders..."
              rows={8}
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-brand-teal focus:border-transparent"
              required
            />
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Variables: {'{{name}}'}, {'{{company}}'}, {'{{title}}'}, {'{{industry}}'}
            </p>
          </div>
          
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-brand-teal text-white rounded-lg hover:bg-brand-teal/90"
            >
              {template ? 'Update' : 'Create'} Template
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Sequence Modal Component
function SequenceModal({ sequence, templates, onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: sequence?.name || '',
    description: sequence?.description || '',
    steps: sequence?.steps || [{ day: 1, channel: 'email', templateId: '' }],
  });
  
  const addStep = () => {
    const lastStep = formData.steps[formData.steps.length - 1];
    setFormData(prev => ({
      ...prev,
      steps: [...prev.steps, { day: (lastStep?.day || 0) + 3, channel: 'email', templateId: '' }]
    }));
  };
  
  const removeStep = (idx) => {
    setFormData(prev => ({
      ...prev,
      steps: prev.steps.filter((_, i) => i !== idx)
    }));
  };
  
  const updateStep = (idx, updates) => {
    setFormData(prev => ({
      ...prev,
      steps: prev.steps.map((step, i) => i === idx ? { ...step, ...updates } : step)
    }));
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            {sequence ? 'Edit Sequence' : 'New Sequence'}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-500 dark:text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Sequence Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., VP Sales Outreach"
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-brand-teal focus:border-transparent"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Description
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Brief description of this sequence"
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-brand-teal focus:border-transparent"
            />
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Steps
              </label>
              <button
                type="button"
                onClick={addStep}
                className="text-sm text-brand-teal hover:underline flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Add Step
              </button>
            </div>
            
            <div className="space-y-3">
              {formData.steps.map((step, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1 grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Day</label>
                      <input
                        type="number"
                        min="1"
                        value={step.day}
                        onChange={(e) => updateStep(idx, { day: parseInt(e.target.value) || 1 })}
                        className="w-full px-2 py-1 border rounded text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Channel</label>
                      <select
                        value={step.channel}
                        onChange={(e) => updateStep(idx, { channel: e.target.value })}
                        className="w-full px-2 py-1 border rounded text-sm"
                      >
                        {CHANNELS.map(ch => (
                          <option key={ch.value} value={ch.value}>{ch.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Template</label>
                      <select
                        value={step.templateId}
                        onChange={(e) => updateStep(idx, { templateId: e.target.value })}
                        className="w-full px-2 py-1 border rounded text-sm"
                      >
                        <option value="">None</option>
                        {templates
                          .filter(t => t.channel === step.channel)
                          .map(t => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                          ))
                        }
                      </select>
                    </div>
                  </div>
                  {formData.steps.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeStep(idx)}
                      className="p-1 text-slate-400 dark:text-slate-500 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-brand-teal text-white rounded-lg hover:bg-brand-teal/90"
            >
              {sequence ? 'Update' : 'Create'} Sequence
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Communications Tab - Unified Gmail Inbox
function CommunicationsTab() {
  const { connectedAccounts, loadConnectedAccounts } = useGmailStore();
  const [selectedAccount, setSelectedAccount] = useState('');
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all'); // all, sent, received
  const [viewMode, setViewMode] = useState('threads'); // threads, list
  const [expandedThreads, setExpandedThreads] = useState(new Set());
  
  // Load connected accounts on mount
  useEffect(() => {
    loadConnectedAccounts();
  }, [loadConnectedAccounts]);
  
  // Set default account when loaded
  useEffect(() => {
    if (connectedAccounts.length > 0 && !selectedAccount) {
      setSelectedAccount(connectedAccounts[0].email);
    }
  }, [connectedAccounts, selectedAccount]);
  
  // Fetch emails when account selected
  const handleFetchEmails = async () => {
    if (!selectedAccount) return;
    
    setLoading(true);
    try {
      // Fetch recent sent and received emails
      const [sentResult, receivedResult] = await Promise.all([
        gmail.syncEmailsForProspect('', selectedAccount, 30), // Empty prospectEmail = all
      ].filter(Boolean));
      
      // Just get recent messages for now using listMessages action
      const result = await gmail.listConnectedAccountEmails(selectedAccount, 50);
      
      const allEmails = (result || []).map(msg => ({
        ...msg,
        type: msg.labelIds?.includes('SENT') ? 'sent' : 'received'
      }));
      
      setEmails(allEmails);
    } catch (error) {
      console.error('Error fetching emails:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Filter emails
  const filteredEmails = emails.filter(email => {
    if (filter === 'sent' && email.type !== 'sent') return false;
    if (filter === 'received' && email.type !== 'received') return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        email.subject?.toLowerCase().includes(query) ||
        email.from?.toLowerCase().includes(query) ||
        email.to?.toLowerCase().includes(query) ||
        email.snippet?.toLowerCase().includes(query)
      );
    }
    return true;
  });
  
  // Group emails by thread
  const threadedEmails = useMemo(() => {
    const threads = {};
    
    filteredEmails.forEach(email => {
      const threadId = email.threadId || email.id;
      if (!threads[threadId]) {
        threads[threadId] = {
          threadId,
          emails: [],
          latestDate: null,
          subject: '',
          participants: new Set(),
          hasReplies: false
        };
      }
      threads[threadId].emails.push(email);
      
      // Track latest date
      const emailDate = email.date ? new Date(email.date) : new Date(0);
      if (!threads[threadId].latestDate || emailDate > threads[threadId].latestDate) {
        threads[threadId].latestDate = emailDate;
        threads[threadId].subject = email.subject?.replace(/^(Re:|Fwd:)\s*/gi, '') || '(No subject)';
      }
      
      // Track participants
      if (email.from) threads[threadId].participants.add(email.from);
      if (email.to) threads[threadId].participants.add(email.to);
    });
    
    // Sort threads by latest date and emails within threads
    return Object.values(threads)
      .map(thread => ({
        ...thread,
        emails: thread.emails.sort((a, b) => 
          new Date(a.date || 0) - new Date(b.date || 0)
        ),
        hasReplies: thread.emails.length > 1,
        participants: Array.from(thread.participants)
      }))
      .sort((a, b) => (b.latestDate || 0) - (a.latestDate || 0));
  }, [filteredEmails]);
  
  // Toggle thread expansion
  const toggleThread = (threadId) => {
    setExpandedThreads(prev => {
      const newSet = new Set(prev);
      if (newSet.has(threadId)) {
        newSet.delete(threadId);
      } else {
        newSet.add(threadId);
      }
      return newSet;
    });
  };
  
  if (connectedAccounts.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center">
        <Mail className="w-12 h-12 text-slate-400 dark:text-slate-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">No Gmail accounts connected</h3>
        <p className="text-slate-600 dark:text-slate-400 mt-1">Connect a Gmail account in Settings to view communications</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {/* Header with account selector */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600 dark:text-slate-400">Account:</span>
            <select
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
              className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
            >
              {connectedAccounts.map(acc => (
                <option key={acc.email} value={acc.email}>{acc.email}</option>
              ))}
            </select>
          </div>
          
          <button
            onClick={handleFetchEmails}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-1.5 bg-brand-teal text-white rounded-lg text-sm hover:bg-brand-teal/90 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Loading...' : 'Fetch Emails'}
          </button>
        </div>
        
        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-700 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('threads')}
              className={`px-3 py-1 text-sm rounded-md transition ${
                viewMode === 'threads'
                  ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-slate-100 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Threads
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 text-sm rounded-md transition ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-slate-100 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              List
            </button>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search emails..."
              className="pl-9 pr-4 py-1.5 w-64 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
            />
          </div>
          
          {/* Filter */}
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
          >
            <option value="all">All Emails</option>
            <option value="sent">Sent</option>
            <option value="received">Received</option>
          </select>
        </div>
      </div>
      
      {/* Email list */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        {emails.length === 0 ? (
          <div className="p-12 text-center">
            <Inbox className="w-12 h-12 text-slate-400 dark:text-slate-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">No emails loaded</h3>
            <p className="text-slate-600 dark:text-slate-400 mt-1">Click "Fetch Emails" to load recent communications</p>
          </div>
        ) : viewMode === 'threads' ? (
          /* Threaded View */
          <div className="divide-y divide-slate-200 dark:divide-slate-700">
            {threadedEmails.length === 0 ? (
              <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                No emails match your search
              </div>
            ) : (
              threadedEmails.map((thread) => {
                const isExpanded = expandedThreads.has(thread.threadId);
                const latestEmail = thread.emails[thread.emails.length - 1];
                
                return (
                  <div key={thread.threadId} className="group">
                    {/* Thread header */}
                    <div 
                      onClick={() => thread.hasReplies && toggleThread(thread.threadId)}
                      className={`p-4 transition ${thread.hasReplies ? 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50' : ''}`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Thread indicator */}
                        <div className="flex flex-col items-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                            latestEmail.type === 'sent' ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-green-100 dark:bg-green-900/30'
                          }`}>
                            {latestEmail.type === 'sent' 
                              ? <Send className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                              : <Inbox className="w-4 h-4 text-green-600 dark:text-green-400" />
                            }
                          </div>
                          {thread.hasReplies && (
                            <div className="mt-1">
                              {isExpanded 
                                ? <ChevronUp className="w-4 h-4 text-slate-400" />
                                : <ChevronDown className="w-4 h-4 text-slate-400" />
                              }
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-slate-900 dark:text-slate-100 truncate">
                                {thread.participants.slice(0, 2).join(', ')}
                                {thread.participants.length > 2 && ` +${thread.participants.length - 2}`}
                              </p>
                              {thread.hasReplies && (
                                <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 text-xs rounded-full">
                                  {thread.emails.length}
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-slate-400 dark:text-slate-500 whitespace-nowrap">
                              {thread.latestDate ? formatDistanceToNow(thread.latestDate, { addSuffix: true }) : ''}
                            </span>
                          </div>
                          <p className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate mt-0.5">
                            {thread.subject}
                          </p>
                          <p className="text-sm text-slate-500 dark:text-slate-400 truncate mt-1">
                            {latestEmail.snippet}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Expanded thread messages */}
                    {isExpanded && thread.hasReplies && (
                      <div className="bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700">
                        {thread.emails.map((email, idx) => (
                          <div 
                            key={email.id}
                            className={`p-4 pl-16 ${idx !== thread.emails.length - 1 ? 'border-b border-slate-200/50 dark:border-slate-700/50' : ''}`}
                          >
                            <div className="flex items-start gap-2">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                                email.type === 'sent' ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-green-100 dark:bg-green-900/30'
                              }`}>
                                {email.type === 'sent' 
                                  ? <Send className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                                  : <Inbox className="w-3 h-3 text-green-600 dark:text-green-400" />
                                }
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">
                                    {email.type === 'sent' ? `To: ${email.to}` : `From: ${email.from}`}
                                  </p>
                                  <span className="text-xs text-slate-400 whitespace-nowrap">
                                    {email.date ? formatDistanceToNow(new Date(email.date), { addSuffix: true }) : ''}
                                  </span>
                                </div>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                  {email.snippet}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        ) : (
          /* List View */
          filteredEmails.length === 0 ? (
            <div className="p-8 text-center text-slate-500 dark:text-slate-400">
              No emails match your search
            </div>
          ) : (
            <div className="divide-y divide-slate-200 dark:divide-slate-700">
              {filteredEmails.map((email) => (
                <div 
                  key={email.id}
                  className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition cursor-pointer"
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      email.type === 'sent' ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-green-100 dark:bg-green-900/30'
                    }`}>
                      {email.type === 'sent' 
                        ? <Send className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        : <Inbox className="w-4 h-4 text-green-600 dark:text-green-400" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium text-slate-900 dark:text-slate-100 truncate">
                          {email.type === 'sent' ? `To: ${email.to}` : `From: ${email.from}`}
                        </p>
                        <span className="text-xs text-slate-400 dark:text-slate-500 whitespace-nowrap">
                          {email.date ? formatDistanceToNow(new Date(email.date), { addSuffix: true }) : ''}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate mt-0.5">
                        {email.subject}
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-400 truncate mt-1">
                        {email.snippet}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}
