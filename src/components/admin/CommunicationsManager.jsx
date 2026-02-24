import React, { useState, useEffect, useCallback } from 'react';
import { useAppServices } from '../../services/useAppServices';
import { collection, getDocs, doc, setDoc, updateDoc } from 'firebase/firestore';
import { Card, Button, Input, Select, Badge, TextArea } from '../ui';
import { 
  Mail, MessageSquare, Bell, Save, RefreshCw, Eye, 
  ChevronDown, ChevronRight, AlertCircle, CheckCircle,
  Send, Copy, Info, Edit2, X
} from 'lucide-react';

/**
 * CommunicationsManager - Centralized admin interface for all external communications
 * 
 * Manages email, SMS, and push notification templates stored in Firestore.
 * Templates use {{variable}} syntax for dynamic content substitution.
 */

const CATEGORIES = [
  { id: 'invitation', label: 'Platform Invitations', icon: Mail },
  { id: 'coaching', label: 'Coaching Sessions', icon: MessageSquare },
  { id: 'community', label: 'Community Events', icon: Bell },
  { id: 'notification', label: 'Scheduled Notifications', icon: Bell },
  { id: 'milestone', label: 'Milestones & Graduation', icon: CheckCircle },
  { id: 'general', label: 'General / Test', icon: Send }
];

const CHANNEL_ICONS = {
  email: Mail,
  sms: MessageSquare,
  push: Bell,
  all: Send
};

const VariableBadge = ({ variable, onClick }) => (
  <button
    onClick={() => onClick(variable)}
    className="inline-flex items-center px-2 py-0.5 mr-1 mb-1 text-xs font-mono 
               bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors
               dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50"
  >
    {`{{${variable}}}`}
  </button>
);

const TemplateEditor = ({ template, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: template?.name || '',
    subject: template?.subject || '',
    headline: template?.headline || '',
    body: template?.body || '',
    smsBody: template?.smsBody || '',
    pushTitle: template?.pushTitle || '',
    pushBody: template?.pushBody || '',
    buttonText: template?.buttonText || 'Open LeaderReps',
    footerText: template?.footerText || '',
    enabled: template?.enabled !== false
  });
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('email');

  const variables = template?.variables || [];

  const insertVariable = (variable, field) => {
    const textarea = document.getElementById(`template-${field}`);
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = formData[field] || '';
      const newText = text.substring(0, start) + `{{${variable}}}` + text.substring(end);
      setFormData(prev => ({ ...prev, [field]: newText }));
      // Restore cursor position after React re-render
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + variable.length + 4, start + variable.length + 4);
      }, 0);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({ ...template, ...formData });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            {template?.name || 'New Template'}
          </h3>
          <p className="text-sm text-slate-500">
            ID: <code className="text-xs bg-slate-100 dark:bg-slate-700 px-1 rounded">{template?.id}</code>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={formData.enabled}
              onChange={(e) => setFormData(prev => ({ ...prev, enabled: e.target.checked }))}
              className="rounded border-slate-300"
            />
            Enabled
          </label>
        </div>
      </div>

      {/* Variables */}
      {variables.length > 0 && (
        <div className="mb-4 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
          <div className="flex items-center gap-1 mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">
            <Info size={14} />
            Available Variables (click to insert):
          </div>
          <div className="flex flex-wrap">
            {variables.map(v => (
              <VariableBadge key={v} variable={v} onClick={(variable) => {
                const field = activeTab === 'email' ? 'body' : activeTab === 'sms' ? 'smsBody' : 'pushBody';
                insertVariable(variable, field);
              }} />
            ))}
          </div>
        </div>
      )}

      {/* Channel Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-700 mb-4">
        {['email', 'sms', 'push'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-corporate-teal text-corporate-teal'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Email Tab */}
      {activeTab === 'email' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Display Name
            </label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Registration Confirmation"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Subject Line
            </label>
            <Input
              id="template-subject"
              value={formData.subject}
              onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
              placeholder="e.g., ✅ Registration Confirmed: {{sessionTitle}}"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Headline
            </label>
            <Input
              id="template-headline"
              value={formData.headline}
              onChange={(e) => setFormData(prev => ({ ...prev, headline: e.target.value }))}
              placeholder="e.g., Registration Confirmed!"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Body Content
            </label>
            <textarea
              id="template-body"
              value={formData.body}
              onChange={(e) => setFormData(prev => ({ ...prev, body: e.target.value }))}
              placeholder="Email body content with {{variables}}..."
              rows={8}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg 
                         bg-white dark:bg-slate-800 text-slate-900 dark:text-white
                         focus:ring-2 focus:ring-corporate-teal focus:border-transparent"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Button Text
              </label>
              <Input
                value={formData.buttonText}
                onChange={(e) => setFormData(prev => ({ ...prev, buttonText: e.target.value }))}
                placeholder="Open LeaderReps"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Footer Text
              </label>
              <Input
                value={formData.footerText}
                onChange={(e) => setFormData(prev => ({ ...prev, footerText: e.target.value }))}
                placeholder="Optional footer message"
              />
            </div>
          </div>
        </div>
      )}

      {/* SMS Tab */}
      {activeTab === 'sms' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              SMS Message (160 chars recommended)
            </label>
            <textarea
              id="template-smsBody"
              value={formData.smsBody}
              onChange={(e) => setFormData(prev => ({ ...prev, smsBody: e.target.value }))}
              placeholder="Short SMS message with {{variables}}..."
              rows={4}
              maxLength={320}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg 
                         bg-white dark:bg-slate-800 text-slate-900 dark:text-white
                         focus:ring-2 focus:ring-corporate-teal focus:border-transparent"
            />
            <p className="text-xs text-slate-500 mt-1">
              {formData.smsBody?.length || 0}/320 characters
            </p>
          </div>
        </div>
      )}

      {/* Push Tab */}
      {activeTab === 'push' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Push Notification Title
            </label>
            <Input
              id="template-pushTitle"
              value={formData.pushTitle}
              onChange={(e) => setFormData(prev => ({ ...prev, pushTitle: e.target.value }))}
              placeholder="e.g., Session Reminder"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Push Notification Body
            </label>
            <textarea
              id="template-pushBody"
              value={formData.pushBody}
              onChange={(e) => setFormData(prev => ({ ...prev, pushBody: e.target.value }))}
              placeholder="Short push notification message..."
              rows={3}
              maxLength={200}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg 
                         bg-white dark:bg-slate-800 text-slate-900 dark:text-white
                         focus:ring-2 focus:ring-corporate-teal focus:border-transparent"
            />
            <p className="text-xs text-slate-500 mt-1">
              {formData.pushBody?.length || 0}/200 characters
            </p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
          Save Changes
        </Button>
      </div>
    </div>
  );
};

const TemplateCard = ({ template, onEdit }) => {
  const [expanded, setExpanded] = useState(false);
  
  // Determine which channels have content
  const hasEmail = !!(template.subject || template.body);
  const hasSms = !!template.smsBody;
  const hasPush = !!(template.pushTitle || template.pushBody);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          {/* Channel indicators */}
          <div className="flex items-center gap-1">
            <Mail className={`w-4 h-4 ${hasEmail ? 'text-corporate-teal' : 'text-slate-300 dark:text-slate-600'}`} title={hasEmail ? 'Email configured' : 'No email content'} />
            <MessageSquare className={`w-4 h-4 ${hasSms ? 'text-corporate-teal' : 'text-slate-300 dark:text-slate-600'}`} title={hasSms ? 'SMS configured' : 'No SMS content'} />
            <Bell className={`w-4 h-4 ${hasPush ? 'text-corporate-teal' : 'text-slate-300 dark:text-slate-600'}`} title={hasPush ? 'Push configured' : 'No push content'} />
          </div>
          <div className="text-left">
            <h4 className="font-medium text-slate-900 dark:text-white">{template.name}</h4>
            <p className="text-xs text-slate-500">{template.id}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={template.enabled ? 'success' : 'secondary'}>
            {template.enabled ? 'Active' : 'Disabled'}
          </Badge>
          {expanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
        </div>
      </button>
      
      {expanded && (
        <div className="px-4 pb-4 border-t border-slate-100 dark:border-slate-700 pt-3">
          {/* Channel summary */}
          <div className="flex gap-4 mb-4 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
            <div className={`flex items-center gap-2 ${hasEmail ? 'text-corporate-teal' : 'text-slate-400'}`}>
              <Mail size={16} />
              <span className="text-xs font-medium">{hasEmail ? '✓ Email' : '✗ Email'}</span>
            </div>
            <div className={`flex items-center gap-2 ${hasSms ? 'text-corporate-teal' : 'text-slate-400'}`}>
              <MessageSquare size={16} />
              <span className="text-xs font-medium">{hasSms ? `✓ SMS (${template.smsBody?.length || 0} chars)` : '✗ SMS'}</span>
            </div>
            <div className={`flex items-center gap-2 ${hasPush ? 'text-corporate-teal' : 'text-slate-400'}`}>
              <Bell size={16} />
              <span className="text-xs font-medium">{hasPush ? '✓ Push' : '✗ Push'}</span>
            </div>
          </div>
          
          <div className="space-y-2 mb-4">
            {template.subject && (
              <div>
                <span className="text-xs font-medium text-slate-500">Email Subject:</span>
                <p className="text-sm text-slate-700 dark:text-slate-300">{template.subject}</p>
              </div>
            )}
            {template.smsBody && (
              <div>
                <span className="text-xs font-medium text-slate-500">SMS Message:</span>
                <p className="text-sm text-slate-600 dark:text-slate-400 italic">{template.smsBody}</p>
              </div>
            )}
            {template.pushTitle && (
              <div>
                <span className="text-xs font-medium text-slate-500">Push Title:</span>
                <p className="text-sm text-slate-600 dark:text-slate-400">{template.pushTitle}</p>
              </div>
            )}
            {template.variables?.length > 0 && (
              <div>
                <span className="text-xs font-medium text-slate-500">Variables:</span>
                <div className="flex flex-wrap mt-1">
                  {template.variables.map(v => (
                    <span key={v} className="text-xs bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded mr-1 mb-1 font-mono">
                      {`{{${v}}}`}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
          <Button size="sm" variant="outline" onClick={() => onEdit(template)}>
            <Edit2 size={14} className="mr-1" /> Edit Template
          </Button>
        </div>
      )}
    </div>
  );
};

const CommunicationsManager = () => {
  const { db } = useAppServices();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [successMessage, setSuccessMessage] = useState(null);

  const fetchTemplates = useCallback(async () => {
    if (!db) return;
    setLoading(true);
    setError(null);
    
    try {
      const snapshot = await getDocs(collection(db, 'communication_templates'));
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      // Sort by category then name
      items.sort((a, b) => {
        if (a.category !== b.category) return (a.category || '').localeCompare(b.category || '');
        return (a.name || '').localeCompare(b.name || '');
      });
      setTemplates(items);
    } catch (err) {
      console.error('Error fetching communication templates:', err);
      setError('Failed to load communication templates');
    } finally {
      setLoading(false);
    }
  }, [db]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const handleSave = async (template) => {
    try {
      const templateRef = doc(db, 'communication_templates', template.id);
      const { id, ...data } = template;
      data.updatedAt = new Date().toISOString();
      await setDoc(templateRef, data, { merge: true });
      
      setSuccessMessage(`Template "${template.name}" saved successfully`);
      setTimeout(() => setSuccessMessage(null), 3000);
      
      setEditingTemplate(null);
      fetchTemplates();
    } catch (err) {
      console.error('Error saving template:', err);
      setError('Failed to save template');
    }
  };

  const filteredTemplates = selectedCategory === 'all' 
    ? templates 
    : templates.filter(t => t.category === selectedCategory);

  const groupedTemplates = CATEGORIES.reduce((acc, cat) => {
    acc[cat.id] = filteredTemplates.filter(t => t.category === cat.id);
    return acc;
  }, {});

  if (editingTemplate) {
    return (
      <div className="p-6">
        <TemplateEditor
          template={editingTemplate}
          onSave={handleSave}
          onCancel={() => setEditingTemplate(null)}
        />
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Communications Manager
          </h2>
          <p className="text-slate-500 mt-1">
            Manage all email, SMS, and push notification templates
          </p>
        </div>
        <Button onClick={fetchTemplates} variant="outline" size="sm">
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-2 text-green-700 dark:text-green-300">
          <CheckCircle size={18} />
          {successMessage}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-red-700 dark:text-red-300">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        <Button
          size="sm"
          variant={selectedCategory === 'all' ? 'primary' : 'ghost'}
          onClick={() => setSelectedCategory('all')}
        >
          All ({templates.length})
        </Button>
        {CATEGORIES.map(cat => {
          const count = templates.filter(t => t.category === cat.id).length;
          const Icon = cat.icon;
          return (
            <Button
              key={cat.id}
              size="sm"
              variant={selectedCategory === cat.id ? 'primary' : 'ghost'}
              onClick={() => setSelectedCategory(cat.id)}
            >
              <Icon size={14} className="mr-1" />
              {cat.label} ({count})
            </Button>
          );
        })}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin text-slate-400" />
        </div>
      )}

      {/* Empty State */}
      {!loading && templates.length === 0 && (
        <Card className="p-8 text-center">
          <Mail className="w-12 h-12 mx-auto text-slate-300 mb-4" />
          <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
            No Templates Found
          </h3>
          <p className="text-slate-500 mb-4">
            Communication templates haven't been set up yet. Run the seed script to initialize default templates.
          </p>
          <code className="text-xs bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded block">
            node scripts/seed-communication-templates.cjs
          </code>
        </Card>
      )}

      {/* Template List */}
      {!loading && templates.length > 0 && (
        <div className="space-y-6">
          {selectedCategory === 'all' ? (
            // Grouped view
            CATEGORIES.map(cat => {
              const catTemplates = groupedTemplates[cat.id];
              if (catTemplates.length === 0) return null;
              const Icon = cat.icon;
              return (
                <div key={cat.id}>
                  <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-800 dark:text-slate-200 mb-3">
                    <Icon size={20} className="text-corporate-teal" />
                    {cat.label}
                  </h3>
                  <div className="space-y-2">
                    {catTemplates.map(template => (
                      <TemplateCard 
                        key={template.id} 
                        template={template} 
                        onEdit={setEditingTemplate}
                      />
                    ))}
                  </div>
                </div>
              );
            })
          ) : (
            // Filtered view
            <div className="space-y-2">
              {filteredTemplates.map(template => (
                <TemplateCard 
                  key={template.id} 
                  template={template} 
                  onEdit={setEditingTemplate}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CommunicationsManager;
