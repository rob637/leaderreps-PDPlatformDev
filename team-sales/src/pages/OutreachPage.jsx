import { useState, useEffect } from 'react';
import { 
  Mail, Phone, Linkedin, MessageSquare, Plus, Edit2, Trash2, 
  Copy, Check, X, ChevronRight, Clock, BarChart3, Users, Zap,
  PlayCircle, Send, Inbox
} from 'lucide-react';
import { useOutreachStore, CHANNELS, OUTCOMES } from '../stores/outreachStore';
import { useAuthStore } from '../stores/authStore';
import { useSequenceStore } from '../stores/sequenceStore';
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
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">LR-Instantly</h1>
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
      <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">
            {template ? 'Edit Template' : 'New Template'}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 dark:bg-slate-700 rounded">
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
      <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">
            {sequence ? 'Edit Sequence' : 'New Sequence'}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 dark:bg-slate-700 rounded">
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
