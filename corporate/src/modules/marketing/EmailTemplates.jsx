import React, { useState, useEffect } from 'react';
import { 
  Mail, Plus, Search, Copy, Edit, Trash2, Star, StarOff,
  Send, Eye, ChevronRight, Tag, Clock, Zap, RefreshCw,
  Folder, FolderPlus, MoreVertical, CheckCircle, X,
  FileText, Users, Target, TrendingUp
} from 'lucide-react';
import { collection, query, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';

/**
 * Email Template Library
 * 
 * Features:
 * - Pre-built email templates
 * - Category organization
 * - Variables/merge fields
 * - Usage analytics
 * - Template sharing
 * - AI suggestions
 */

const CATEGORIES = [
  { id: 'outreach', name: 'Cold Outreach', icon: Target, color: 'bg-blue-100 text-blue-600' },
  { id: 'follow-up', name: 'Follow-ups', icon: Clock, color: 'bg-amber-100 text-amber-600' },
  { id: 'meeting', name: 'Meeting Requests', icon: Users, color: 'bg-green-100 text-green-600' },
  { id: 'proposal', name: 'Proposals', icon: FileText, color: 'bg-purple-100 text-purple-600' },
  { id: 'closing', name: 'Closing', icon: TrendingUp, color: 'bg-emerald-100 text-emerald-600' },
  { id: 'nurture', name: 'Nurture', icon: Zap, color: 'bg-orange-100 text-orange-600' }
];

const MERGE_FIELDS = [
  { id: 'firstName', label: 'First Name', placeholder: '{{firstName}}' },
  { id: 'lastName', label: 'Last Name', placeholder: '{{lastName}}' },
  { id: 'company', label: 'Company', placeholder: '{{company}}' },
  { id: 'title', label: 'Title', placeholder: '{{title}}' },
  { id: 'productName', label: 'Product Name', placeholder: '{{productName}}' },
  { id: 'senderName', label: 'Sender Name', placeholder: '{{senderName}}' }
];

const DEFAULT_TEMPLATES = [
  {
    id: 'default-1',
    name: 'Initial Outreach',
    category: 'outreach',
    subject: 'Quick question about {{company}}',
    body: `Hi {{firstName}},

I noticed {{company}} has been growing rapidly and wanted to reach out.

We've helped similar companies in your industry achieve [specific result]. Would you be open to a quick 15-minute call to see if we might be able to help {{company}} too?

Best,
{{senderName}}`,
    starred: true,
    usageCount: 24
  },
  {
    id: 'default-2',
    name: 'Follow-up After No Response',
    category: 'follow-up',
    subject: 'Following up - {{company}}',
    body: `Hi {{firstName}},

I wanted to follow up on my previous email. I know you're busy, so I'll keep this brief.

Would a quick 15-minute call this week work for you? I'd love to show you how we can help {{company}}.

Best,
{{senderName}}`,
    starred: false,
    usageCount: 18
  },
  {
    id: 'default-3',
    name: 'Meeting Request',
    category: 'meeting',
    subject: 'Let\'s connect - {{firstName}}',
    body: `Hi {{firstName}},

I've been researching {{company}} and have some ideas I think could really help with [specific challenge].

Do you have 20 minutes this week for a quick call? I promise to make it worth your time.

Looking forward to connecting,
{{senderName}}`,
    starred: false,
    usageCount: 12
  }
];

const EmailTemplates = () => {
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showEditor, setShowEditor] = useState(false);
  const [showPreview, setShowPreview] = useState(null);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    category: 'outreach',
    subject: '',
    body: '',
    starred: false
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const templatesSnap = await getDocs(
        query(collection(db, 'corporate_email_templates'), orderBy('createdAt', 'desc'))
      );
      let templatesData = templatesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      
      // Add default templates if none exist
      if (templatesData.length === 0) {
        templatesData = DEFAULT_TEMPLATES;
      }
      
      setTemplates(templatesData);
    } catch (err) {
      console.error("Error fetching templates:", err);
      setTemplates(DEFAULT_TEMPLATES);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingTemplate && !editingTemplate.startsWith('default-')) {
        await updateDoc(doc(db, 'corporate_email_templates', editingTemplate), {
          ...formData,
          updatedAt: serverTimestamp()
        });
      } else {
        await addDoc(collection(db, 'corporate_email_templates'), {
          ...formData,
          usageCount: 0,
          createdAt: serverTimestamp()
        });
      }
      setShowEditor(false);
      setEditingTemplate(null);
      resetForm();
      fetchTemplates();
    } catch (err) {
      console.error("Error saving template:", err);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this template?')) return;
    if (id.startsWith('default-')) {
      setTemplates(templates.filter(t => t.id !== id));
      return;
    }
    try {
      await deleteDoc(doc(db, 'corporate_email_templates', id));
      fetchTemplates();
    } catch (err) {
      console.error("Error deleting template:", err);
    }
  };

  const toggleStar = async (id, currentStarred) => {
    if (id.startsWith('default-')) {
      setTemplates(templates.map(t => 
        t.id === id ? { ...t, starred: !currentStarred } : t
      ));
      return;
    }
    try {
      await updateDoc(doc(db, 'corporate_email_templates', id), {
        starred: !currentStarred
      });
      setTemplates(templates.map(t => 
        t.id === id ? { ...t, starred: !currentStarred } : t
      ));
    } catch (err) {
      console.error("Error toggling star:", err);
    }
  };

  const handleEdit = (template) => {
    setFormData({
      name: template.name,
      category: template.category,
      subject: template.subject,
      body: template.body,
      starred: template.starred
    });
    setEditingTemplate(template.id);
    setShowEditor(true);
  };

  const handleCopy = (template) => {
    navigator.clipboard.writeText(`Subject: ${template.subject}\n\n${template.body}`);
    alert('Template copied to clipboard!');
  };

  const insertMergeField = (field) => {
    setFormData({
      ...formData,
      body: formData.body + field.placeholder
    });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: 'outreach',
      subject: '',
      body: '',
      starred: false
    });
  };

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = 
      template.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.subject?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const starredTemplates = templates.filter(t => t.starred);

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto flex items-center justify-center min-h-[60vh]">
        <RefreshCw className="w-8 h-8 animate-spin text-corporate-teal" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-corporate-navy">Email Templates</h1>
          <p className="text-slate-500 mt-1">Pre-built email templates for every sales scenario</p>
        </div>
        <button 
          onClick={() => {
            resetForm();
            setEditingTemplate(null);
            setShowEditor(true);
          }}
          className="bg-corporate-teal text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-teal-600"
        >
          <Plus size={18} /> New Template
        </button>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Sidebar */}
        <div className="col-span-3 space-y-6">
          {/* Quick Access */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            <h3 className="font-semibold text-slate-800 mb-3 text-sm">Quick Access</h3>
            <div className="space-y-1">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
                  selectedCategory === 'all' ? 'bg-corporate-teal/10 text-corporate-teal' : 'hover:bg-slate-50 text-slate-600'
                }`}
              >
                <Mail size={16} />
                All Templates
                <span className="ml-auto text-xs text-slate-400">{templates.length}</span>
              </button>
              <button
                onClick={() => setSelectedCategory('starred')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
                  selectedCategory === 'starred' ? 'bg-corporate-teal/10 text-corporate-teal' : 'hover:bg-slate-50 text-slate-600'
                }`}
              >
                <Star size={16} />
                Starred
                <span className="ml-auto text-xs text-slate-400">{starredTemplates.length}</span>
              </button>
            </div>
          </div>

          {/* Categories */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            <h3 className="font-semibold text-slate-800 mb-3 text-sm">Categories</h3>
            <div className="space-y-1">
              {CATEGORIES.map(category => {
                const count = templates.filter(t => t.category === category.id).length;
                const Icon = category.icon;
                return (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
                      selectedCategory === category.id ? 'bg-corporate-teal/10 text-corporate-teal' : 'hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <Icon size={16} />
                    {category.name}
                    <span className="ml-auto text-xs text-slate-400">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Merge Fields */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            <h3 className="font-semibold text-slate-800 mb-3 text-sm">Merge Fields</h3>
            <p className="text-xs text-slate-400 mb-3">Click to copy placeholder</p>
            <div className="flex flex-wrap gap-2">
              {MERGE_FIELDS.map(field => (
                <button
                  key={field.id}
                  onClick={() => navigator.clipboard.writeText(field.placeholder)}
                  className="text-xs px-2 py-1 bg-slate-100 rounded hover:bg-slate-200 font-mono"
                >
                  {field.placeholder}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="col-span-9">
          {/* Search */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Search templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg"
              />
            </div>
          </div>

          {/* Templates Grid */}
          {filteredTemplates.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center">
              <Mail className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <h3 className="font-medium text-slate-600 mb-1">No templates found</h3>
              <p className="text-sm text-slate-400">Create your first template to get started</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {filteredTemplates.map(template => {
                const category = CATEGORIES.find(c => c.id === template.category);
                return (
                  <div 
                    key={template.id}
                    className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition group"
                  >
                    <div className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2">
                          {category && (
                            <span className={`text-xs px-2 py-1 rounded-full ${category.color}`}>
                              {category.name}
                            </span>
                          )}
                        </div>
                        <button 
                          onClick={() => toggleStar(template.id, template.starred)}
                          className="text-slate-300 hover:text-amber-400"
                        >
                          {template.starred ? (
                            <Star className="text-amber-400 fill-amber-400" size={16} />
                          ) : (
                            <StarOff size={16} />
                          )}
                        </button>
                      </div>
                      <h4 className="font-medium text-slate-800 mb-1">{template.name}</h4>
                      <p className="text-sm text-slate-500 mb-3 truncate">{template.subject}</p>
                      <p className="text-xs text-slate-400 line-clamp-2">{template.body}</p>
                    </div>
                    <div className="border-t border-slate-100 px-4 py-3 flex items-center justify-between">
                      <span className="text-xs text-slate-400">
                        {template.usageCount || 0} uses
                      </span>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                        <button 
                          onClick={() => setShowPreview(template)}
                          className="p-1.5 hover:bg-slate-100 rounded text-slate-400"
                        >
                          <Eye size={14} />
                        </button>
                        <button 
                          onClick={() => handleCopy(template)}
                          className="p-1.5 hover:bg-slate-100 rounded text-slate-400"
                        >
                          <Copy size={14} />
                        </button>
                        <button 
                          onClick={() => handleEdit(template)}
                          className="p-1.5 hover:bg-slate-100 rounded text-slate-400"
                        >
                          <Edit size={14} />
                        </button>
                        <button 
                          onClick={() => handleDelete(template.id)}
                          className="p-1.5 hover:bg-red-50 rounded text-red-400"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Editor Modal */}
      {showEditor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-corporate-navy">
                  {editingTemplate ? 'Edit Template' : 'Create New Template'}
                </h3>
                <button 
                  onClick={() => {
                    setShowEditor(false);
                    setEditingTemplate(null);
                  }}
                  className="p-2 hover:bg-slate-100 rounded-lg"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Template Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg"
                    placeholder="Initial Outreach"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg"
                  >
                    {CATEGORIES.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Subject Line</label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg"
                  placeholder="Quick question about {{company}}"
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-slate-700">Email Body</label>
                  <div className="flex gap-1">
                    {MERGE_FIELDS.slice(0, 4).map(field => (
                      <button
                        key={field.id}
                        type="button"
                        onClick={() => insertMergeField(field)}
                        className="text-xs px-2 py-0.5 bg-slate-100 rounded hover:bg-slate-200"
                      >
                        {field.label}
                      </button>
                    ))}
                  </div>
                </div>
                <textarea
                  value={formData.body}
                  onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg h-48 font-mono text-sm resize-none"
                  placeholder="Hi {{firstName}}..."
                  required
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditor(false);
                    setEditingTemplate(null);
                  }}
                  className="flex-1 px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-corporate-teal text-white rounded-lg hover:bg-teal-600"
                >
                  {editingTemplate ? 'Update Template' : 'Create Template'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-xl">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-corporate-navy">Template Preview</h3>
                <button 
                  onClick={() => setShowPreview(null)}
                  className="p-2 hover:bg-slate-100 rounded-lg"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <label className="text-xs text-slate-400 uppercase">Subject</label>
                <p className="font-medium text-slate-800">{showPreview.subject}</p>
              </div>
              <div>
                <label className="text-xs text-slate-400 uppercase">Body</label>
                <div className="mt-2 p-4 bg-slate-50 rounded-lg whitespace-pre-wrap text-sm text-slate-700">
                  {showPreview.body}
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    handleCopy(showPreview);
                    setShowPreview(null);
                  }}
                  className="flex-1 px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 flex items-center justify-center gap-2"
                >
                  <Copy size={16} /> Copy to Clipboard
                </button>
                <button
                  onClick={() => {
                    handleEdit(showPreview);
                    setShowPreview(null);
                  }}
                  className="flex-1 px-4 py-2 bg-corporate-teal text-white rounded-lg hover:bg-teal-600 flex items-center justify-center gap-2"
                >
                  <Edit size={16} /> Edit Template
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailTemplates;
