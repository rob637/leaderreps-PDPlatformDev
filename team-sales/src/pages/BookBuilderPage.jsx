import { useState, useEffect, useCallback } from 'react';
import { 
  BookOpen, FileText, List, Edit3, Plus, Trash2, 
  Search, Filter, X, Save, ChevronRight, ChevronDown,
  GripVertical, Eye, Sparkles, Download, Settings,
  Clock, User, Tag, CheckCircle, AlertCircle, Loader2,
  LayoutDashboard, FolderOpen, ListOrdered, PenTool,
  RefreshCw, Wand2
} from 'lucide-react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '../lib/firebase';
import { useBookStore, SOURCE_TYPES, CHAPTER_STATUSES, BOOK_STATUSES } from '../stores/bookStore';
import { useAuthStore } from '../stores/authStore';
import toast from 'react-hot-toast';

// Initialize Firebase Functions
const functions = getFunctions(app, 'us-central1');

// ==================== TAB NAVIGATION ====================

const tabs = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'sources', label: 'Sources', icon: FolderOpen },
  { id: 'outline', label: 'Outline', icon: ListOrdered },
  { id: 'chapters', label: 'Chapters', icon: PenTool },
];

// ==================== DASHBOARD TAB ====================

function DashboardTab() {
  const { metadata, metadataLoading, updateMetadata, chapters, sources, getProgress } = useBookStore();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [exporting, setExporting] = useState(false);
  
  useEffect(() => {
    if (metadata) {
      setForm({
        title: metadata.title || '',
        subtitle: metadata.subtitle || '',
        authors: metadata.authors?.join(', ') || '',
        targetAudience: metadata.targetAudience || '',
        tone: metadata.tone || '',
        status: metadata.status || 'planning',
      });
    }
  }, [metadata]);
  
  const progress = getProgress();
  
  const handleSave = async () => {
    await updateMetadata({
      ...form,
      authors: form.authors.split(',').map(a => a.trim()).filter(Boolean),
    });
    setEditing(false);
  };
  
  if (metadataLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-brand-teal" />
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Book Info Card */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-brand-teal/10 rounded-xl flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-brand-teal" />
            </div>
            <div>
              {editing ? (
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="text-xl font-bold bg-transparent border-b border-brand-teal focus:outline-none dark:text-white"
                  placeholder="Book Title"
                />
              ) : (
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {metadata?.title || 'Untitled Book'}
                </h2>
              )}
              {editing ? (
                <input
                  type="text"
                  value={form.subtitle}
                  onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                  className="text-sm text-slate-500 bg-transparent border-b border-slate-300 focus:outline-none mt-1 w-full"
                  placeholder="Subtitle (optional)"
                />
              ) : (
                metadata?.subtitle && (
                  <p className="text-sm text-slate-500 dark:text-slate-400">{metadata.subtitle}</p>
                )
              )}
            </div>
          </div>
          
          {editing ? (
            <div className="flex gap-2">
              <button
                onClick={() => setEditing(false)}
                className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-3 py-1.5 text-sm bg-brand-teal text-white rounded-lg hover:bg-brand-teal/90 flex items-center gap-1"
              >
                <Save className="w-4 h-4" />
                Save
              </button>
            </div>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              <Edit3 className="w-4 h-4" />
            </button>
          )}
        </div>
        
        {editing && (
          <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Authors (comma-separated)</label>
              <input
                type="text"
                value={form.authors}
                onChange={(e) => setForm({ ...form, authors: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-teal/50 dark:bg-slate-700 dark:border-slate-600"
                placeholder="Author 1, Author 2"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Target Audience</label>
              <input
                type="text"
                value={form.targetAudience}
                onChange={(e) => setForm({ ...form, targetAudience: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-teal/50 dark:bg-slate-700 dark:border-slate-600"
                placeholder="HR Leaders, CEOs, etc."
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Tone/Style</label>
              <input
                type="text"
                value={form.tone}
                onChange={(e) => setForm({ ...form, tone: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-teal/50 dark:bg-slate-700 dark:border-slate-600"
                placeholder="Professional, conversational, etc."
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Book Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-teal/50 dark:bg-slate-700 dark:border-slate-600"
              >
                {BOOK_STATUSES.map(s => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>
        )}
        
        {!editing && metadata?.authors?.length > 0 && (
          <div className="flex items-center gap-2 mt-4 text-sm text-slate-500">
            <User className="w-4 h-4" />
            <span>By {metadata.authors.join(', ')}</span>
          </div>
        )}
      </div>
      
      {/* Progress & Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
            <FolderOpen className="w-4 h-4" />
            <span>Sources</span>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{sources.length}</p>
          <p className="text-xs text-slate-500 mt-1">Materials collected</p>
        </div>
        
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
            <ListOrdered className="w-4 h-4" />
            <span>Chapters</span>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{chapters.length}</p>
          <p className="text-xs text-slate-500 mt-1">In outline</p>
        </div>
        
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
            <CheckCircle className="w-4 h-4" />
            <span>Progress</span>
          </div>
          <p className="text-2xl font-bold text-brand-teal">{progress.percent}%</p>
          <p className="text-xs text-slate-500 mt-1">{progress.complete} of {progress.total} complete</p>
        </div>
      </div>
      
      {/* Progress Bar */}
      {chapters.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Chapter Progress</h3>
          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3">
            <div 
              className="bg-brand-teal h-3 rounded-full transition-all duration-500"
              style={{ width: `${progress.percent}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-slate-500">
            <span>{progress.complete} Complete</span>
            <span>{progress.total - progress.complete} Remaining</span>
          </div>
        </div>
      )}
      
      {/* Quick Actions */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
        <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Quick Actions</h3>
        <div className="flex gap-2 flex-wrap">
          <button 
            onClick={() => useBookStore.getState().setActiveTab('sources')}
            className="px-3 py-2 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Source Material
          </button>
          <button 
            onClick={() => useBookStore.getState().setActiveTab('outline')}
            className="px-3 py-2 text-sm bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 flex items-center gap-2"
          >
            <ListOrdered className="w-4 h-4" />
            Edit Outline
          </button>
          <button 
            onClick={async () => {
              if (chapters.length === 0) {
                toast.error('No chapters to export');
                return;
              }
              setExporting(true);
              try {
                const exportBookToDocx = httpsCallable(functions, 'exportBookToDocx');
                const result = await exportBookToDocx({
                  chapters: chapters.map(c => ({
                    title: c.title,
                    content: c.content || '',
                  })),
                  metadata: {
                    title: metadata?.title || 'Untitled Book',
                    subtitle: metadata?.subtitle || '',
                    authors: metadata?.authors || [],
                  },
                });
                
                if (result.data?.success) {
                  // Download as markdown file
                  const blob = new Blob([result.data.content], { type: 'text/markdown' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `${(metadata?.title || 'book').toLowerCase().replace(/\s+/g, '-')}.md`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                  toast.success('Book exported!');
                } else {
                  throw new Error(result.data?.error || 'Export failed');
                }
              } catch (err) {
                console.error('Export error:', err);
                toast.error('Failed to export book');
              } finally {
                setExporting(false);
              }
            }}
            disabled={exporting || chapters.length === 0}
            className="px-3 py-2 text-sm bg-green-50 text-green-600 rounded-lg hover:bg-green-100 disabled:opacity-50 flex items-center gap-2"
          >
            {exporting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            {exporting ? 'Exporting...' : 'Export Draft'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ==================== SOURCES TAB ====================

function SourcesTab() {
  const { user } = useAuthStore();
  const { 
    sources, sourcesLoading, selectedSource, 
    addSource, updateSource, deleteSource, 
    setSelectedSource, getFilteredSources, sourceFilters, setSourceFilters 
  } = useBookStore();
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSource, setNewSource] = useState({ title: '', type: 'notes', content: '', tags: '' });
  const [saving, setSaving] = useState(false);
  
  const filteredSources = getFilteredSources();
  
  const handleAddSource = async () => {
    if (!newSource.title.trim() || !newSource.content.trim()) {
      toast.error('Title and content are required');
      return;
    }
    
    setSaving(true);
    await addSource({
      ...newSource,
      tags: newSource.tags.split(',').map(t => t.trim()).filter(Boolean),
    }, user?.email);
    setSaving(false);
    setShowAddModal(false);
    setNewSource({ title: '', type: 'notes', content: '', tags: '' });
  };
  
  const handleDeleteSource = async (sourceId) => {
    if (confirm('Delete this source? This cannot be undone.')) {
      await deleteSource(sourceId);
    }
  };
  
  const getTypeColor = (typeId) => {
    const type = SOURCE_TYPES.find(t => t.id === typeId);
    const colors = {
      blue: 'bg-blue-100 text-blue-700',
      purple: 'bg-purple-100 text-purple-700',
      green: 'bg-green-100 text-green-700',
      orange: 'bg-orange-100 text-orange-700',
      yellow: 'bg-yellow-100 text-yellow-700',
      pink: 'bg-pink-100 text-pink-700',
      teal: 'bg-teal-100 text-teal-700',
      gray: 'bg-gray-100 text-gray-700',
    };
    return colors[type?.color] || colors.gray;
  };
  
  if (sourcesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-brand-teal" />
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={sourceFilters.search}
              onChange={(e) => setSourceFilters({ search: e.target.value })}
              placeholder="Search sources..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-teal/50 dark:bg-slate-800 dark:border-slate-700"
            />
          </div>
          
          <select
            value={sourceFilters.type}
            onChange={(e) => setSourceFilters({ type: e.target.value })}
            className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-teal/50 dark:bg-slate-800 dark:border-slate-700"
          >
            <option value="all">All Types</option>
            {SOURCE_TYPES.map(t => (
              <option key={t.id} value={t.id}>{t.label}</option>
            ))}
          </select>
        </div>
        
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-brand-teal text-white rounded-lg text-sm font-medium hover:bg-brand-teal/90 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Source
        </button>
      </div>
      
      {/* Sources Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSources.map(source => (
          <div
            key={source.id}
            onClick={() => setSelectedSource(source)}
            className={`bg-white dark:bg-slate-800 rounded-xl border p-4 cursor-pointer transition hover:shadow-md ${
              selectedSource?.id === source.id 
                ? 'border-brand-teal ring-2 ring-brand-teal/20' 
                : 'border-slate-200 dark:border-slate-700'
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getTypeColor(source.type)}`}>
                {SOURCE_TYPES.find(t => t.id === source.type)?.label || source.type}
              </span>
              <button
                onClick={(e) => { e.stopPropagation(); handleDeleteSource(source.id); }}
                className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            
            <h3 className="font-medium text-slate-900 dark:text-white mb-1">{source.title}</h3>
            <p className="text-sm text-slate-500 line-clamp-2 mb-3">
              {source.content?.substring(0, 100)}...
            </p>
            
            {source.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {source.tags.slice(0, 3).map((tag, i) => (
                  <span key={i} className="px-2 py-0.5 text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded">
                    {tag}
                  </span>
                ))}
                {source.tags.length > 3 && (
                  <span className="text-xs text-slate-400">+{source.tags.length - 3}</span>
                )}
              </div>
            )}
            
            <div className="flex items-center gap-2 mt-3 text-xs text-slate-400">
              <Clock className="w-3 h-3" />
              {source.createdAt?.toDate?.()?.toLocaleDateString() || 'Just now'}
            </div>
          </div>
        ))}
        
        {filteredSources.length === 0 && (
          <div className="col-span-full text-center py-12 text-slate-500">
            <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No sources yet. Add your first source material!</p>
          </div>
        )}
      </div>
      
      {/* Add Source Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Add Source Material</h2>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Title *</label>
                <input
                  type="text"
                  value={newSource.title}
                  onChange={(e) => setNewSource({ ...newSource, title: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-teal/50 dark:bg-slate-700 dark:border-slate-600"
                  placeholder="e.g., Field Guide - Coaching Sessions"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Type</label>
                <select
                  value={newSource.type}
                  onChange={(e) => setNewSource({ ...newSource, type: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-teal/50 dark:bg-slate-700 dark:border-slate-600"
                >
                  {SOURCE_TYPES.map(t => (
                    <option key={t.id} value={t.id}>{t.label}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Content *</label>
                <textarea
                  value={newSource.content}
                  onChange={(e) => setNewSource({ ...newSource, content: e.target.value })}
                  rows={10}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-teal/50 dark:bg-slate-700 dark:border-slate-600 font-mono text-sm"
                  placeholder="Paste your source material here..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tags (comma-separated)</label>
                <input
                  type="text"
                  value={newSource.tags}
                  onChange={(e) => setNewSource({ ...newSource, tags: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-teal/50 dark:bg-slate-700 dark:border-slate-600"
                  placeholder="coaching, week1, feedback"
                />
              </div>
            </div>
            
            <div className="p-6 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleAddSource}
                disabled={saving || !newSource.title.trim() || !newSource.content.trim()}
                className="px-4 py-2 text-sm bg-brand-teal text-white rounded-lg hover:bg-brand-teal/90 disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Add Source
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Source Detail Drawer */}
      {selectedSource && (
        <div className="fixed inset-0 bg-black/50 flex justify-end z-50">
          <div className="bg-white dark:bg-slate-800 w-full max-w-2xl h-full overflow-y-auto">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between sticky top-0 bg-white dark:bg-slate-800">
              <div>
                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getTypeColor(selectedSource.type)}`}>
                  {SOURCE_TYPES.find(t => t.id === selectedSource.type)?.label}
                </span>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white mt-1">{selectedSource.title}</h2>
              </div>
              <button onClick={() => setSelectedSource(null)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              <pre className="whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300 font-sans">
                {selectedSource.content}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== OUTLINE TAB ====================

function OutlineTab() {
  const { user } = useAuthStore();
  const { chapters, chaptersLoading, addChapter, updateChapter, deleteChapter, reorderChapters, setActiveTab } = useBookStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newChapter, setNewChapter] = useState({ title: '', summary: '' });
  const [saving, setSaving] = useState(false);
  const [draggedChapter, setDraggedChapter] = useState(null);
  
  const handleAddChapter = async () => {
    if (!newChapter.title.trim()) {
      toast.error('Chapter title is required');
      return;
    }
    
    setSaving(true);
    await addChapter(newChapter, user?.email);
    setSaving(false);
    setShowAddModal(false);
    setNewChapter({ title: '', summary: '' });
  };
  
  const handleDeleteChapter = async (chapterId) => {
    if (confirm('Delete this chapter? This cannot be undone.')) {
      await deleteChapter(chapterId);
    }
  };
  
  const handleDragStart = (e, chapter) => {
    setDraggedChapter(chapter);
    e.dataTransfer.effectAllowed = 'move';
  };
  
  const handleDragOver = (e, targetChapter) => {
    e.preventDefault();
    if (!draggedChapter || draggedChapter.id === targetChapter.id) return;
  };
  
  const handleDrop = async (e, targetChapter) => {
    e.preventDefault();
    if (!draggedChapter || draggedChapter.id === targetChapter.id) return;
    
    const reordered = [...chapters];
    const draggedIndex = reordered.findIndex(c => c.id === draggedChapter.id);
    const targetIndex = reordered.findIndex(c => c.id === targetChapter.id);
    
    reordered.splice(draggedIndex, 1);
    reordered.splice(targetIndex, 0, draggedChapter);
    
    await reorderChapters(reordered);
    setDraggedChapter(null);
  };
  
  const getStatusBadge = (status) => {
    const statusConfig = CHAPTER_STATUSES.find(s => s.id === status);
    const colors = {
      gray: 'bg-slate-100 text-slate-600',
      yellow: 'bg-yellow-100 text-yellow-700',
      blue: 'bg-blue-100 text-blue-700',
      purple: 'bg-purple-100 text-purple-700',
      green: 'bg-green-100 text-green-700',
    };
    return (
      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${colors[statusConfig?.color] || colors.gray}`}>
        {statusConfig?.label || status}
      </span>
    );
  };
  
  if (chaptersLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-brand-teal" />
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Book Outline</h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-brand-teal text-white rounded-lg text-sm font-medium hover:bg-brand-teal/90 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Chapter
        </button>
      </div>
      
      {/* Chapters List */}
      <div className="space-y-2">
        {chapters.map((chapter, index) => (
          <div
            key={chapter.id}
            draggable
            onDragStart={(e) => handleDragStart(e, chapter)}
            onDragOver={(e) => handleDragOver(e, chapter)}
            onDrop={(e) => handleDrop(e, chapter)}
            className={`bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 flex items-center gap-4 cursor-move hover:shadow-md transition ${
              draggedChapter?.id === chapter.id ? 'opacity-50' : ''
            }`}
          >
            <div className="text-slate-400 hover:text-slate-600">
              <GripVertical className="w-5 h-5" />
            </div>
            
            <div className="w-10 h-10 bg-brand-navy text-white rounded-lg flex items-center justify-center font-bold text-sm">
              {index + 1}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-medium text-slate-900 dark:text-white truncate">{chapter.title}</h3>
                {getStatusBadge(chapter.status)}
              </div>
              {chapter.summary && (
                <p className="text-sm text-slate-500 truncate">{chapter.summary}</p>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  useBookStore.getState().setSelectedChapter(chapter);
                  setActiveTab('chapters');
                }}
                className="p-2 text-slate-400 hover:text-brand-teal hover:bg-brand-teal/10 rounded-lg"
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDeleteChapter(chapter.id)}
                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
        
        {chapters.length === 0 && (
          <div className="text-center py-12 text-slate-500 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <ListOrdered className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No chapters yet. Add your first chapter!</p>
          </div>
        )}
      </div>
      
      {/* Add Chapter Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-lg">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Add Chapter</h2>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Chapter Title *</label>
                <input
                  type="text"
                  value={newChapter.title}
                  onChange={(e) => setNewChapter({ ...newChapter, title: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-teal/50 dark:bg-slate-700 dark:border-slate-600"
                  placeholder="e.g., Chapter 1: The Leadership Gap"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Summary</label>
                <textarea
                  value={newChapter.summary}
                  onChange={(e) => setNewChapter({ ...newChapter, summary: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-teal/50 dark:bg-slate-700 dark:border-slate-600"
                  placeholder="Brief description of what this chapter covers..."
                />
              </div>
            </div>
            
            <div className="p-6 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleAddChapter}
                disabled={saving || !newChapter.title.trim()}
                className="px-4 py-2 text-sm bg-brand-teal text-white rounded-lg hover:bg-brand-teal/90 disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Add Chapter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== CHAPTERS TAB (Editor) ====================

function ChaptersTab() {
  const { user } = useAuthStore();
  const { chapters, selectedChapter, setSelectedChapter, updateChapter, sources, getSourcesByChapter, metadata, linkSourceToChapter, unlinkSourceFromChapter } = useBookStore();
  const [content, setContent] = useState('');
  const [autoSaveTimer, setAutoSaveTimer] = useState(null);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [aiMode, setAiMode] = useState('draft'); // 'draft', 'expand', 'refine'
  const [showSourcePicker, setShowSourcePicker] = useState(false);
  
  // Load content when chapter is selected
  useEffect(() => {
    if (selectedChapter) {
      setContent(selectedChapter.content || '');
    }
  }, [selectedChapter?.id]);
  
  // Auto-save content after 2 seconds of inactivity
  useEffect(() => {
    if (!selectedChapter || content === selectedChapter.content) return;
    
    if (autoSaveTimer) clearTimeout(autoSaveTimer);
    
    const timer = setTimeout(async () => {
      setSaving(true);
      await updateChapter(selectedChapter.id, { content }, user?.email);
      setSaving(false);
    }, 2000);
    
    setAutoSaveTimer(timer);
    
    return () => clearTimeout(timer);
  }, [content]);
  
  const handleStatusChange = async (status) => {
    await updateChapter(selectedChapter.id, { status }, user?.email);
  };
  
  const linkedSources = selectedChapter ? getSourcesByChapter(selectedChapter.id) : [];
  
  // AI Generation handler
  const handleAIGenerate = async (mode) => {
    if (!selectedChapter) return;
    
    setGenerating(true);
    setAiMode(mode);
    
    try {
      const generateBookDraft = httpsCallable(functions, 'generateBookDraft');
      
      // Prepare source content for AI
      const sourceContent = linkedSources.map(s => ({
        title: s.title,
        type: s.type,
        content: s.content || '',
        notes: s.notes || '',
      }));
      
      const result = await generateBookDraft({
        chapterTitle: selectedChapter.title,
        chapterSummary: selectedChapter.summary || '',
        sources: sourceContent,
        existingContent: content,
        bookMetadata: {
          title: metadata?.title || 'Untitled Book',
          targetAudience: metadata?.targetAudience || '',
          tone: metadata?.tone || '',
        },
        mode,
      });
      
      if (result.data?.success) {
        const newContent = mode === 'draft' 
          ? result.data.content 
          : content + '\n\n' + result.data.content;
        setContent(newContent);
        toast.success(`${mode === 'draft' ? 'Draft generated' : mode === 'expand' ? 'Content expanded' : 'Content refined'}!`);
      } else {
        throw new Error(result.data?.error || 'Generation failed');
      }
    } catch (err) {
      console.error('AI generation error:', err);
      toast.error(err.message || 'Failed to generate content');
    } finally {
      setGenerating(false);
    }
  };
  
  // Source linking
  const handleLinkSource = async (sourceId) => {
    await linkSourceToChapter(sourceId, selectedChapter.id);
    setShowSourcePicker(false);
  };
  
  const handleUnlinkSource = async (sourceId) => {
    await unlinkSourceFromChapter(sourceId, selectedChapter.id);
  };
  
  const unlinkedSources = sources.filter(s => !linkedSources.find(ls => ls.id === s.id));
  
  if (!selectedChapter) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Select a Chapter to Edit</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {chapters.map((chapter, index) => (
            <button
              key={chapter.id}
              onClick={() => setSelectedChapter(chapter)}
              className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 text-left hover:border-brand-teal transition"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-brand-navy text-white rounded-lg flex items-center justify-center font-bold text-sm">
                  {index + 1}
                </div>
                <h3 className="font-medium text-slate-900 dark:text-white">{chapter.title}</h3>
              </div>
              {chapter.summary && (
                <p className="text-sm text-slate-500 line-clamp-2">{chapter.summary}</p>
              )}
            </button>
          ))}
        </div>
        
        {chapters.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            <PenTool className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No chapters in your outline yet. Add chapters in the Outline tab first.</p>
          </div>
        )}
      </div>
    );
  }
  
  return (
    <div className="flex gap-6 h-[calc(100vh-12rem)]">
      {/* Chapter List Sidebar */}
      <div className="w-64 flex-shrink-0 space-y-2 overflow-y-auto">
        {chapters.map((chapter, index) => (
          <button
            key={chapter.id}
            onClick={() => setSelectedChapter(chapter)}
            className={`w-full p-3 rounded-lg text-left transition ${
              selectedChapter?.id === chapter.id
                ? 'bg-brand-teal text-white'
                : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-brand-teal'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold opacity-60">Ch {index + 1}</span>
              <span className="text-sm font-medium truncate">{chapter.title}</span>
            </div>
          </button>
        ))}
      </div>
      
      {/* Editor Area */}
      <div className="flex-1 flex flex-col bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{selectedChapter.title}</h2>
            {selectedChapter.summary && (
              <p className="text-sm text-slate-500">{selectedChapter.summary}</p>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            {saving && (
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" />
                Saving...
              </span>
            )}
            
            <select
              value={selectedChapter.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-teal/50 dark:bg-slate-700 dark:border-slate-600"
            >
              {CHAPTER_STATUSES.map(s => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
            
            <button
              onClick={() => setSelectedChapter(null)}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* Content Editor */}
        <div className="flex-1 p-4 overflow-y-auto">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full h-full resize-none border-none focus:outline-none text-slate-700 dark:text-slate-300 leading-relaxed"
            placeholder="Start writing your chapter content here... 

You can use markdown formatting:
# Heading 1
## Heading 2
**bold** or *italic*
- Bullet points
1. Numbered lists

The content auto-saves as you type."
          />
        </div>
        
        {/* Word Count Footer */}
        <div className="px-4 py-2 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-400 flex justify-between">
          <span>{content.split(/\s+/).filter(Boolean).length} words</span>
          <span>{content.length} characters</span>
        </div>
      </div>
      
      {/* Source References Panel */}
      <div className="w-64 flex-shrink-0 space-y-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <FolderOpen className="w-4 h-4" />
              Linked Sources
            </h3>
            <button
              onClick={() => setShowSourcePicker(!showSourcePicker)}
              className="p-1 text-brand-teal hover:bg-brand-teal/10 rounded"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          
          {/* Source Picker Dropdown */}
          {showSourcePicker && unlinkedSources.length > 0 && (
            <div className="mb-3 p-2 bg-slate-50 dark:bg-slate-700/50 rounded-lg max-h-32 overflow-y-auto">
              {unlinkedSources.map(source => (
                <button
                  key={source.id}
                  onClick={() => handleLinkSource(source.id)}
                  className="w-full p-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-600 rounded"
                >
                  {source.title}
                </button>
              ))}
            </div>
          )}
          
          {linkedSources.length > 0 ? (
            <div className="space-y-2">
              {linkedSources.map(source => (
                <div key={source.id} className="p-2 bg-slate-50 dark:bg-slate-700/50 rounded-lg text-sm flex items-center justify-between group">
                  <p className="font-medium truncate flex-1">{source.title}</p>
                  <button
                    onClick={() => handleUnlinkSource(source.id)}
                    className="p-1 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">No sources linked. Click + to add sources the AI can reference.</p>
          )}
        </div>
        
        {/* AI Writing Assistant */}
        <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl border border-purple-200 dark:border-purple-800 p-4">
          <h3 className="text-sm font-medium text-purple-700 dark:text-purple-300 mb-2 flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            AI Writing Assistant
          </h3>
          <p className="text-xs text-purple-600 dark:text-purple-400 mb-3">
            {linkedSources.length > 0 
              ? `Using ${linkedSources.length} source${linkedSources.length > 1 ? 's' : ''} for context`
              : 'Link sources above for richer drafts'}
          </p>
          
          <div className="space-y-2">
            <button 
              onClick={() => handleAIGenerate('draft')}
              disabled={generating}
              className="w-full px-3 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {generating && aiMode === 'draft' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              {generating && aiMode === 'draft' ? 'Generating...' : 'Generate Draft'}
            </button>
            
            {content && (
              <>
                <button 
                  onClick={() => handleAIGenerate('expand')}
                  disabled={generating}
                  className="w-full px-3 py-2 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium hover:bg-purple-200 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {generating && aiMode === 'expand' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Wand2 className="w-4 h-4" />
                  )}
                  {generating && aiMode === 'expand' ? 'Expanding...' : 'Expand Ideas'}
                </button>
                
                <button 
                  onClick={() => handleAIGenerate('refine')}
                  disabled={generating}
                  className="w-full px-3 py-2 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium hover:bg-purple-200 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {generating && aiMode === 'refine' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  {generating && aiMode === 'refine' ? 'Refining...' : 'Refine Writing'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ==================== MAIN PAGE ====================

export default function BookBuilderPage() {
  const { activeTab, setActiveTab, loadMetadata, subscribeToSources, subscribeToChapters, cleanup } = useBookStore();
  
  // Initialize data on mount
  useEffect(() => {
    loadMetadata();
    const unsubSources = subscribeToSources();
    const unsubChapters = subscribeToChapters();
    
    return () => {
      cleanup();
    };
  }, []);
  
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-teal/10 rounded-xl flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-brand-teal" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Book Builder</h1>
            <p className="text-sm text-slate-500">Create your leadership book</p>
          </div>
        </div>
      </div>
      
      {/* Tab Navigation */}
      <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl w-fit">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-slate-700 text-brand-teal shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>
      
      {/* Tab Content */}
      <div>
        {activeTab === 'dashboard' && <DashboardTab />}
        {activeTab === 'sources' && <SourcesTab />}
        {activeTab === 'outline' && <OutlineTab />}
        {activeTab === 'chapters' && <ChaptersTab />}
      </div>
    </div>
  );
}
