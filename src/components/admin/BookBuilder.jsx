// src/components/admin/BookBuilder.jsx
// Book Builder for main arena app - adapted from team-sales/pages/BookBuilderPage.jsx
import { useState, useEffect, useCallback } from 'react';
import { 
  BookOpen, FileText, List, Edit3, Plus, Trash2, 
  Search, Filter, X, Save, ChevronRight, ChevronDown,
  GripVertical, Eye, Sparkles, Download, Settings,
  Clock, User, Tag, CheckCircle, AlertCircle, Loader2,
  LayoutDashboard, FolderOpen, ListOrdered, PenTool,
  RefreshCw, Wand2, ArrowLeft, StickyNote, Lightbulb,
  BookCopy, ChevronUp, Globe, Users, Zap, MessageSquare
} from 'lucide-react';
import { httpsCallable } from 'firebase/functions';
import { 
  collection, doc, getDoc, addDoc, updateDoc, deleteDoc, setDoc,
  query, orderBy, onSnapshot, serverTimestamp, writeBatch, where
} from 'firebase/firestore';
import { db, functions } from '../../lib/firebase';
import { useAppServices } from '../../services/useAppServices';

// Firestore collection paths
const BOOKS_COLLECTION = 'books'; // Multiple books
const CONTENT_LIBRARY_COLLECTION = 'content_library'; // Sources come from Content Library
const CHAPTERS_COLLECTION = 'book_chapters';
const NOTES_COLLECTION = 'book_notes'; // Author notes for context, direction, ideas

// Book style presets - each style has different AI generation instructions
const BOOK_STYLES = [
  { 
    id: 'methodology', 
    label: 'Methodology Book', 
    description: 'Comprehensive flagship system book (like "Traction")',
    icon: BookOpen,
    color: 'blue',
    defaultChapters: 10,
    stylePrompt: `Write as a comprehensive methodology book. Include:
- Clear, actionable frameworks with memorable names
- Step-by-step implementation guides
- Practical tools and templates readers can use immediately
- Real-world examples and case studies
- Assessment questions to help readers evaluate their situation
Target length: 50,000-70,000 words (250-300 pages)`
  },
  { 
    id: 'fable', 
    label: 'Business Fable', 
    description: 'Story-driven narrative following a character (like "Get a Grip")',
    icon: MessageSquare,
    color: 'purple',
    defaultChapters: 12,
    stylePrompt: `Write as a business fable/narrative. Include:
- A relatable protagonist (CEO/leader) facing real challenges
- Supporting characters who represent different perspectives
- A mentor/guide character who introduces the methodology
- Dramatic tension and character growth throughout
- The methodology revealed naturally through story events
- Emotional moments that make concepts memorable
Target length: 40,000-50,000 words (180-220 pages)`
  },
  { 
    id: 'primer', 
    label: 'Quick Primer', 
    description: 'Short introduction book (like "What the Heck is EOS?")',
    icon: Zap,
    color: 'green',
    defaultChapters: 6,
    stylePrompt: `Write as a quick, accessible primer. Include:
- Concise explanations of core concepts only
- Simple visuals and diagrams (described for illustration)
- FAQ sections addressing common questions
- Quick-start action items at the end of each chapter
- Minimal jargon - explain everything simply
- Perfect for skeptics or those exploring the methodology
Target length: 15,000-25,000 words (80-120 pages)`
  },
  { 
    id: 'deep-dive', 
    label: 'Deep Dive', 
    description: 'One concept explored fully (like "Rocket Fuel")',
    icon: Search,
    color: 'orange',
    defaultChapters: 8,
    stylePrompt: `Write as a deep-dive on a specific aspect of the methodology. Include:
- Exhaustive exploration of one key concept
- Advanced techniques and nuances
- Common pitfalls and how to avoid them
- Expert-level insights and refinements
- Detailed case studies showing the concept in action
- Tools specifically for this aspect
Target length: 35,000-45,000 words (150-200 pages)`
  },
  { 
    id: 'buyer-focused', 
    label: 'Buyer-Focused', 
    description: 'For HR/L&D decision makers - business case angle',
    icon: Users,
    color: 'teal',
    defaultChapters: 8,
    stylePrompt: `Write for HR leaders and L&D decision makers. Include:
- ROI frameworks and business case justifications
- Implementation considerations for organizations
- Change management and adoption strategies
- Metrics and success indicators
- Vendor evaluation criteria (positioned favorably)
- Executive summary sections for quick scanning
- Budget and resource planning guidance
Target length: 30,000-40,000 words (130-170 pages)`
  },
];

// Note categories for organization
const NOTE_CATEGORIES = [
  { id: 'context', label: 'Context & Background', color: 'blue', icon: 'info' },
  { id: 'direction', label: 'Direction & Vision', color: 'purple', icon: 'compass' },
  { id: 'idea', label: 'Ideas & Concepts', color: 'yellow', icon: 'lightbulb' },
  { id: 'structure', label: 'Structure & Flow', color: 'green', icon: 'list' },
  { id: 'tone', label: 'Tone & Style', color: 'pink', icon: 'pen' },
  { id: 'audience', label: 'Audience Insights', color: 'orange', icon: 'users' },
  { id: 'other', label: 'Other', color: 'gray', icon: 'note' },
];

// Map content_library types to display info
const CONTENT_TYPE_DISPLAY = {
  PROGRAM: { label: 'Program', color: 'blue' },
  WORKOUT: { label: 'Workout', color: 'purple' },
  EXERCISE: { label: 'Exercise', color: 'green' },
  REP: { label: 'Rep', color: 'orange' },
  READ_REP: { label: 'Read & Rep', color: 'yellow' },
  VIDEO: { label: 'Video', color: 'pink' },
  TOOL: { label: 'Tool', color: 'teal' },
  DOCUMENT: { label: 'Document', color: 'indigo' },
  SKILL: { label: 'Skill', color: 'cyan' },
  INTERACTIVE: { label: 'Interactive', color: 'emerald' },
};

// Legacy source types for backward compatibility display
const SOURCE_TYPES = [
  { id: 'field_guide', label: 'Field Guide', color: 'blue' },
  { id: 'session_guide', label: 'Session Guide', color: 'purple' },
  { id: 'website', label: 'Website Copy', color: 'green' },
  { id: 'transcript', label: 'Transcript', color: 'orange' },
  { id: 'notes', label: 'Notes/Ideas', color: 'yellow' },
  { id: 'research', label: 'Research', color: 'pink' },
  { id: 'case_study', label: 'Case Study', color: 'teal' },
  { id: 'other', label: 'Other', color: 'gray' },
];

// Chapter statuses
const CHAPTER_STATUSES = [
  { id: 'outline', label: 'Outline', color: 'gray' },
  { id: 'drafting', label: 'Drafting', color: 'yellow' },
  { id: 'review', label: 'In Review', color: 'blue' },
  { id: 'editing', label: 'Editing', color: 'purple' },
  { id: 'complete', label: 'Complete', color: 'green' },
];

// Book statuses
const BOOK_STATUSES = [
  { id: 'planning', label: 'Planning' },
  { id: 'outlining', label: 'Outlining' },
  { id: 'drafting', label: 'Drafting' },
  { id: 'editing', label: 'Editing' },
  { id: 'complete', label: 'Complete' },
];

// Simple toast notification component
function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);
  
  return (
    <div className={`fixed bottom-4 right-4 px-4 py-2 rounded-lg shadow-lg z-50 flex items-center gap-2 ${
      type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
    }`}>
      {type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
      {message}
    </div>
  );
}

// ==================== BOOK SELECTOR ====================

function BookSelector({ books, selectedBook, onSelectBook, onCreateBook, booksLoading }) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [newBook, setNewBook] = useState({
    title: '',
    subtitle: '',
    style: 'methodology',
    authors: '',
    targetAudience: '',
  });
  const [creating, setCreating] = useState(false);
  
  const selectedStyle = BOOK_STYLES.find(s => s.id === selectedBook?.style);
  
  const getStyleColor = (styleId) => {
    const style = BOOK_STYLES.find(s => s.id === styleId);
    const colorMap = {
      blue: 'bg-blue-100 text-blue-700 border-blue-200',
      purple: 'bg-purple-100 text-purple-700 border-purple-200',
      green: 'bg-green-100 text-green-700 border-green-200',
      orange: 'bg-orange-100 text-orange-700 border-orange-200',
      teal: 'bg-teal-100 text-teal-700 border-teal-200',
    };
    return colorMap[style?.color] || colorMap.blue;
  };
  
  const handleCreate = async () => {
    if (!newBook.title.trim()) return;
    
    setCreating(true);
    try {
      const style = BOOK_STYLES.find(s => s.id === newBook.style);
      await onCreateBook({
        title: newBook.title.trim(),
        subtitle: newBook.subtitle.trim(),
        style: newBook.style,
        stylePrompt: style?.stylePrompt || '',
        authors: newBook.authors.split(',').map(a => a.trim()).filter(Boolean),
        targetAudience: newBook.targetAudience.trim(),
        tone: style?.id === 'fable' ? 'Narrative and engaging' : 'Professional yet conversational',
        status: 'planning',
      });
      setShowCreateModal(false);
      setNewBook({ title: '', subtitle: '', style: 'methodology', authors: '', targetAudience: '' });
    } catch (err) {
      console.error('Error creating book:', err);
    }
    setCreating(false);
  };
  
  if (booksLoading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
        <div className="flex items-center gap-2 text-slate-500">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading books...
        </div>
      </div>
    );
  }
  
  return (
    <>
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        {/* Selected Book Header */}
        <div 
          className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-corporate-teal/10 rounded-lg flex items-center justify-center">
              {selectedStyle?.icon ? <selectedStyle.icon className="w-5 h-5 text-corporate-teal" /> : <BookOpen className="w-5 h-5 text-corporate-teal" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-slate-900 dark:text-white">
                  {selectedBook?.title || 'Select a Book'}
                </h3>
                {selectedBook && (
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${getStyleColor(selectedBook.style)}`}>
                    {selectedStyle?.label}
                  </span>
                )}
              </div>
              {selectedBook?.subtitle && (
                <p className="text-sm text-slate-500">{selectedBook.subtitle}</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">{books.length} book{books.length !== 1 ? 's' : ''}</span>
            {isExpanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
          </div>
        </div>
        
        {/* Expanded Book List */}
        {isExpanded && (
          <div className="border-t border-slate-200 dark:border-slate-700 p-4 space-y-3">
            {/* Existing Books */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {books.map(book => {
                const style = BOOK_STYLES.find(s => s.id === book.style);
                const StyleIcon = style?.icon || BookOpen;
                const isSelected = selectedBook?.id === book.id;
                
                return (
                  <button
                    key={book.id}
                    onClick={() => {
                      onSelectBook(book);
                      setIsExpanded(false);
                    }}
                    className={`p-3 rounded-lg border text-left transition ${
                      isSelected 
                        ? 'border-corporate-teal bg-corporate-teal/5 ring-2 ring-corporate-teal/20' 
                        : 'border-slate-200 dark:border-slate-600 hover:border-corporate-teal'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <StyleIcon className={`w-4 h-4 mt-0.5 ${isSelected ? 'text-corporate-teal' : 'text-slate-400'}`} />
                      <div className="flex-1 min-w-0">
                        <p className={`font-medium truncate ${isSelected ? 'text-corporate-teal' : 'text-slate-900 dark:text-white'}`}>
                          {book.title}
                        </p>
                        <p className="text-xs text-slate-500 truncate">{style?.label}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
              
              {/* Create New Book Button */}
              <button
                onClick={() => setShowCreateModal(true)}
                className="p-3 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-corporate-teal hover:bg-corporate-teal/5 transition flex items-center justify-center gap-2 text-slate-500 hover:text-corporate-teal"
              >
                <Plus className="w-4 h-4" />
                <span className="text-sm font-medium">New Book</span>
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Create Book Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between sticky top-0 bg-white dark:bg-slate-800">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Create New Book</h2>
                <p className="text-sm text-slate-500">Choose a style and customize your book</p>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Style Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Book Style *</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {BOOK_STYLES.map(style => {
                    const StyleIcon = style.icon;
                    const isSelected = newBook.style === style.id;
                    return (
                      <button
                        key={style.id}
                        type="button"
                        onClick={() => setNewBook({ ...newBook, style: style.id })}
                        className={`p-4 rounded-xl border-2 text-left transition ${
                          isSelected 
                            ? 'border-corporate-teal bg-corporate-teal/5' 
                            : 'border-slate-200 dark:border-slate-600 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isSelected ? 'bg-corporate-teal text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'}`}>
                            <StyleIcon className="w-5 h-5" />
                          </div>
                          <div className="flex-1">
                            <p className={`font-medium ${isSelected ? 'text-corporate-teal' : 'text-slate-900 dark:text-white'}`}>
                              {style.label}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">{style.description}</p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
              
              {/* Book Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Book Title *</label>
                  <input
                    type="text"
                    value={newBook.title}
                    onChange={(e) => setNewBook({ ...newBook, title: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-corporate-teal/50 dark:bg-slate-700 dark:border-slate-600"
                    placeholder="e.g., The LeaderReps Method"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Subtitle</label>
                  <input
                    type="text"
                    value={newBook.subtitle}
                    onChange={(e) => setNewBook({ ...newBook, subtitle: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-corporate-teal/50 dark:bg-slate-700 dark:border-slate-600"
                    placeholder="e.g., A Practical Guide to Leadership Development"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Authors</label>
                  <input
                    type="text"
                    value={newBook.authors}
                    onChange={(e) => setNewBook({ ...newBook, authors: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-corporate-teal/50 dark:bg-slate-700 dark:border-slate-600"
                    placeholder="Author 1, Author 2"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Target Audience</label>
                  <input
                    type="text"
                    value={newBook.targetAudience}
                    onChange={(e) => setNewBook({ ...newBook, targetAudience: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-corporate-teal/50 dark:bg-slate-700 dark:border-slate-600"
                    placeholder="HR Leaders, L&D Professionals"
                  />
                </div>
              </div>
              
              {/* Style Preview */}
              {newBook.style && (
                <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                  <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">AI Generation Instructions</h4>
                  <p className="text-xs text-slate-500 whitespace-pre-wrap">
                    {BOOK_STYLES.find(s => s.id === newBook.style)?.stylePrompt}
                  </p>
                </div>
              )}
            </div>
            
            <div className="p-6 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3 sticky bottom-0 bg-white dark:bg-slate-800">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={creating || !newBook.title.trim()}
                className="px-4 py-2 text-sm bg-corporate-teal text-white rounded-lg hover:bg-corporate-teal/90 disabled:opacity-50 flex items-center gap-2"
              >
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Create Book
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ==================== DASHBOARD TAB ====================

function DashboardTab({ metadata, metadataLoading, updateMetadata, chapters, sources, notes, getProgress, showToast, setActiveTab, selectedBook }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [exporting, setExporting] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(null);
  
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
        <Loader2 className="w-6 h-6 animate-spin text-corporate-teal" />
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Book Info Card */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-corporate-teal/10 rounded-xl flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-corporate-teal" />
            </div>
            <div>
              {editing ? (
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="text-xl font-bold bg-transparent border-b border-corporate-teal focus:outline-none dark:text-white"
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
                className="px-3 py-1.5 text-sm bg-corporate-teal text-white rounded-lg hover:bg-corporate-teal/90 flex items-center gap-1"
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
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-corporate-teal/50 dark:bg-slate-700 dark:border-slate-600"
                placeholder="Author 1, Author 2"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Target Audience</label>
              <input
                type="text"
                value={form.targetAudience}
                onChange={(e) => setForm({ ...form, targetAudience: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-corporate-teal/50 dark:bg-slate-700 dark:border-slate-600"
                placeholder="HR Leaders, CEOs, etc."
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Tone/Style</label>
              <input
                type="text"
                value={form.tone}
                onChange={(e) => setForm({ ...form, tone: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-corporate-teal/50 dark:bg-slate-700 dark:border-slate-600"
                placeholder="Professional, conversational, etc."
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Book Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-corporate-teal/50 dark:bg-slate-700 dark:border-slate-600"
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
            <StickyNote className="w-4 h-4" />
            <span>Notes</span>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{notes.length}</p>
          <p className="text-xs text-slate-500 mt-1">Context & direction</p>
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
          <p className="text-2xl font-bold text-corporate-teal">{progress.percent}%</p>
          <p className="text-xs text-slate-500 mt-1">{progress.complete} of {progress.total} complete</p>
        </div>
      </div>
      
      {/* Progress Bar */}
      {chapters.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Chapter Progress</h3>
          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3">
            <div 
              className="bg-corporate-teal h-3 rounded-full transition-all duration-500"
              style={{ width: `${progress.percent}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-slate-500">
            <span>{progress.complete} Complete</span>
            <span>{progress.total - progress.complete} Remaining</span>
          </div>
        </div>
      )}
      
      {/* AI Book Generator - Primary Action */}
      <div className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-xl p-6 text-white">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">AI Book Generator</h2>
              <p className="text-purple-200 text-sm">
                {sources.length} source{sources.length !== 1 ? 's' : ''} available • 
                {notes.length > 0 ? ` ${notes.length} note${notes.length !== 1 ? 's' : ''} • ` : ' '}
                {chapters.length > 0 ? `${chapters.length} chapters exist` : 'No chapters yet'}
              </p>
            </div>
          </div>
        </div>
        
        <p className="mt-4 text-purple-100 text-sm">
          Generate a complete book outline and draft all chapters using AI. The AI will analyze 
          all your source materials and notes to create a cohesive book structure with full chapter content.
        </p>
        
        {generationProgress && (
          <div className="mt-4 p-3 bg-white/10 rounded-lg">
            <div className="flex items-center gap-2 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{generationProgress}</span>
            </div>
          </div>
        )}
        
        <div className="mt-4 flex gap-3">
          <button
            onClick={async () => {
              if (sources.length === 0) {
                showToast('Add source materials first', 'error');
                return;
              }
              
              const shouldRegenerate = chapters.length > 0 
                ? confirm(`This will replace all ${chapters.length} existing chapters. Continue?`)
                : true;
              
              if (!shouldRegenerate) return;
              
              setGenerating(true);
              setGenerationProgress('Analyzing sources and creating outline...');
              
              try {
                const generateFullBook = httpsCallable(functions, 'generateFullBook', { timeout: 540000 });
                const result = await generateFullBook({
                  bookMetadata: {
                    id: selectedBook?.id,
                    title: selectedBook?.title || metadata?.title || 'The LeaderReps Method',
                    subtitle: selectedBook?.subtitle || metadata?.subtitle || 'A Practical Guide to Leadership Development',
                    targetAudience: selectedBook?.targetAudience || metadata?.targetAudience || 'HR Leaders and L&D Professionals',
                    tone: selectedBook?.tone || metadata?.tone || 'Professional yet conversational',
                    stylePrompt: selectedBook?.stylePrompt || '',
                    style: selectedBook?.style || 'methodology',
                    authors: metadata?.authors || [],
                  },
                  regenerate: chapters.length > 0,
                });
                
                if (result.data?.success) {
                  showToast(`Book generated! ${result.data.chaptersGenerated} chapters, ${result.data.totalWordCount.toLocaleString()} words`);
                  setGenerationProgress(null);
                } else {
                  throw new Error(result.data?.error || 'Generation failed');
                }
              } catch (err) {
                console.error('Generation error:', err);
                showToast(err.message || 'Failed to generate book', 'error');
                setGenerationProgress(null);
              } finally {
                setGenerating(false);
              }
            }}
            disabled={generating || sources.length === 0}
            className="px-6 py-3 bg-white text-purple-700 font-semibold rounded-xl hover:bg-purple-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg"
          >
            {generating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generating Book...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                {chapters.length > 0 ? 'Regenerate Book' : 'Generate Book'}
              </>
            )}
          </button>
          
          {sources.length === 0 && (
            <button
              onClick={() => setActiveTab('sources')}
              className="px-4 py-3 bg-white/20 text-white font-medium rounded-xl hover:bg-white/30 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Sources First
            </button>
          )}
        </div>
        
        {chapters.length > 0 && (
          <p className="mt-3 text-purple-200 text-xs">
            💡 Tip: Update your sources, then click "Regenerate Book" to update all chapters.
          </p>
        )}
      </div>
      
      {/* Quick Actions */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
        <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Quick Actions</h3>
        <div className="flex gap-2 flex-wrap">
          <button 
            onClick={() => setActiveTab('sources')}
            className="px-3 py-2 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Source Material
          </button>
          <button 
            onClick={() => setActiveTab('outline')}
            className="px-3 py-2 text-sm bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 flex items-center gap-2"
          >
            <ListOrdered className="w-4 h-4" />
            Edit Outline
          </button>
          <button 
            onClick={async () => {
              if (chapters.length === 0) {
                showToast('No chapters to export', 'error');
                return;
              }
              setExporting(true);
              try {
                const exportBookToDocx = httpsCallable(functions, 'exportBookToDocx');
                const result = await exportBookToDocx({
                  chapters: chapters.map(c => ({
                    title: c.title,
                    content: c.content || '',
                    summary: c.summary || '',
                  })),
                  metadata: {
                    title: metadata?.title || 'Untitled Book',
                    subtitle: metadata?.subtitle || '',
                    authors: metadata?.authors || [],
                  },
                });
                
                if (result.data?.success && result.data?.docx) {
                  // Convert base64 to blob
                  const binaryString = atob(result.data.docx);
                  const bytes = new Uint8Array(binaryString.length);
                  for (let i = 0; i < binaryString.length; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                  }
                  const blob = new Blob([bytes], { 
                    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
                  });
                  
                  // Download the file
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = result.data.fileName || 'book.docx';
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                  showToast(`Book exported! (${result.data.chapterCount} chapters)`);
                } else {
                  throw new Error(result.data?.error || 'Export failed');
                }
              } catch (err) {
                console.error('Export error:', err);
                showToast('Failed to export book', 'error');
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
            {exporting ? 'Exporting...' : 'Export DOCX'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ==================== SOURCES TAB ====================

// Helper function to build content string from content_library item for AI consumption
function buildSourceContent(item) {
  const parts = [];
  
  if (item.description) {
    parts.push(item.description);
  }
  
  // Extract content from details based on content type
  if (item.details) {
    if (item.details.content) parts.push(item.details.content);
    if (item.details.overview) parts.push(item.details.overview);
    if (item.details.keyPoints?.length) parts.push('Key Points: ' + item.details.keyPoints.join(', '));
    if (item.details.summary) parts.push(item.details.summary);
    if (item.details.instructions) parts.push(item.details.instructions);
    if (item.details.steps?.length) parts.push('Steps: ' + item.details.steps.map(s => s.title || s).join(' → '));
    if (item.details.reflection) parts.push('Reflection: ' + item.details.reflection);
    if (item.details.applicationTips?.length) parts.push('Tips: ' + item.details.applicationTips.join(', '));
    // Include transcript for videos
    if (item.details.transcript) parts.push('Transcript:\n' + item.details.transcript);
    // Include full text for documents  
    if (item.details.fullText) parts.push('Document Content:\n' + item.details.fullText);
    if (item.details.keyTakeaways) parts.push('Key Takeaways: ' + item.details.keyTakeaways);
  }
  
  return parts.join('\n\n') || item.description || 'No content available';
}

function SourcesTab({ sources, sourcesLoading, showToast, navigate }) {
  const [selectedSource, setSelectedSource] = useState(null);
  const [searchFilter, setSearchFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  
  const filteredSources = sources.filter(s => {
    if (searchFilter) {
      const search = searchFilter.toLowerCase();
      const matchesSearch = 
        s.title?.toLowerCase().includes(search) ||
        s.content?.toLowerCase().includes(search) ||
        s.tags?.some(t => t.toLowerCase().includes(search));
      if (!matchesSearch) return false;
    }
    if (typeFilter !== 'all' && s.type !== typeFilter) return false;
    return true;
  });
  
  // Remove source from book by toggling includeInBook flag
  const handleRemoveFromBook = async (sourceId) => {
    if (confirm('Remove this item from the book? (It will remain in Content Library)')) {
      try {
        await updateDoc(doc(db, CONTENT_LIBRARY_COLLECTION, sourceId), {
          includeInBook: false,
          updatedAt: serverTimestamp()
        });
        if (selectedSource?.id === sourceId) setSelectedSource(null);
        showToast('Removed from book');
      } catch (err) {
        console.error('Error removing source:', err);
        showToast('Failed to remove source', 'error');
      }
    }
  };
  
  const getTypeColor = (type) => {
    const display = CONTENT_TYPE_DISPLAY[type];
    const colorMap = {
      blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
      purple: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
      green: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
      orange: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
      yellow: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
      pink: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
      teal: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300',
      indigo: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
      cyan: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300',
      emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
      gray: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
    };
    return colorMap[display?.color] || colorMap.gray;
  };
  
  if (sourcesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-corporate-teal" />
      </div>
    );
  }
  
  // Get unique content types from sources for filter dropdown
  const uniqueTypes = [...new Set(sources.map(s => s.type))];
  
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search sources..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-corporate-teal/50 dark:bg-slate-800 dark:border-slate-700"
            />
          </div>
          
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-corporate-teal/50 dark:bg-slate-800 dark:border-slate-700"
          >
            <option value="all">All Types</option>
            {uniqueTypes.map(t => (
              <option key={t} value={t}>{CONTENT_TYPE_DISPLAY[t]?.label || t}</option>
            ))}
          </select>
        </div>
        
        <button
          onClick={() => navigate('content-library')}
          className="px-4 py-2 bg-corporate-teal text-white rounded-lg text-sm font-medium hover:bg-corporate-teal/90 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add in Content Library
        </button>
      </div>
      
      {/* Info banner */}
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-3 flex items-start gap-3">
        <BookOpen className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-amber-800 dark:text-amber-200">
          <strong>Sources are managed in Content Library.</strong> To add content here, go to Content Library and check the "Include in Leadership Playbook" checkbox on any content item.
        </div>
      </div>
      
      {/* Sources Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSources.map(source => (
          <div
            key={source.id}
            onClick={() => setSelectedSource(source)}
            className={`bg-white dark:bg-slate-800 rounded-xl border p-4 cursor-pointer transition hover:shadow-md ${
              selectedSource?.id === source.id 
                ? 'border-corporate-teal ring-2 ring-corporate-teal/20' 
                : 'border-slate-200 dark:border-slate-700'
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getTypeColor(source.type)}`}>
                {CONTENT_TYPE_DISPLAY[source.type]?.label || source.type}
              </span>
              <button
                onClick={(e) => { e.stopPropagation(); handleRemoveFromBook(source.id); }}
                className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                title="Remove from book"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <h3 className="font-medium text-slate-900 dark:text-white mb-1">{source.title}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-3">
              {source.notes || source.content?.substring(0, 100)}...
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
          <div className="col-span-full text-center py-12 text-slate-500 dark:text-slate-400">
            <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="mb-3">No content marked for the book yet.</p>
            <button
              onClick={() => navigate('content-library')}
              className="px-4 py-2 bg-corporate-teal text-white rounded-lg text-sm font-medium hover:bg-corporate-teal/90"
            >
              Go to Content Library to add sources
            </button>
          </div>
        )}
      </div>
      
      {/* Source Detail Drawer */}
      {selectedSource && (
        <div className="fixed inset-0 bg-black/50 flex justify-end z-50">
          <div className="bg-white dark:bg-slate-800 w-full max-w-2xl h-full overflow-y-auto">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between sticky top-0 bg-white dark:bg-slate-800">
              <div>
                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getTypeColor(selectedSource.type)}`}>
                  {CONTENT_TYPE_DISPLAY[selectedSource.type]?.label || selectedSource.type}
                </span>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white mt-1">{selectedSource.title}</h2>
              </div>
              <button onClick={() => setSelectedSource(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              {selectedSource.notes && (
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 italic">{selectedSource.notes}</p>
              )}
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

// ==================== NOTES TAB ====================

function NotesTab({ notes, sharedNotes, bookNotes, notesLoading, showToast, userEmail, selectedBook }) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [newNote, setNewNote] = useState({ title: '', content: '', category: 'idea', isShared: false });
  const [saving, setSaving] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [scopeFilter, setScopeFilter] = useState('all'); // 'all', 'shared', 'book'
  const [expandedNotes, setExpandedNotes] = useState(new Set());
  
  const filteredNotes = notes.filter(n => {
    if (searchFilter) {
      const search = searchFilter.toLowerCase();
      const matchesSearch = 
        n.title?.toLowerCase().includes(search) ||
        n.content?.toLowerCase().includes(search);
      if (!matchesSearch) return false;
    }
    if (categoryFilter !== 'all' && n.category !== categoryFilter) return false;
    if (scopeFilter === 'shared' && n.bookId) return false;
    if (scopeFilter === 'book' && !n.bookId) return false;
    return true;
  });
  
  const getCategoryInfo = (categoryId) => {
    return NOTE_CATEGORIES.find(c => c.id === categoryId) || NOTE_CATEGORIES.find(c => c.id === 'other');
  };
  
  const getCategoryColor = (categoryId) => {
    const category = getCategoryInfo(categoryId);
    const colorMap = {
      blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
      purple: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
      yellow: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
      green: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
      pink: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
      orange: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
      gray: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
    };
    return colorMap[category?.color] || colorMap.gray;
  };
  
  const toggleNoteExpand = (noteId) => {
    const newExpanded = new Set(expandedNotes);
    if (newExpanded.has(noteId)) {
      newExpanded.delete(noteId);
    } else {
      newExpanded.add(noteId);
    }
    setExpandedNotes(newExpanded);
  };
  
  const handleAddNote = async () => {
    if (!newNote.title.trim()) {
      showToast('Note title is required', 'error');
      return;
    }
    
    setSaving(true);
    try {
      await addDoc(collection(db, NOTES_COLLECTION), {
        title: newNote.title.trim(),
        content: newNote.content.trim(),
        category: newNote.category,
        bookId: newNote.isShared ? null : selectedBook?.id, // null = shared, bookId = book-specific
        createdBy: userEmail,
        lastEditedBy: userEmail,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      showToast(newNote.isShared ? 'Shared note added' : 'Book note added');
      setShowAddModal(false);
      setNewNote({ title: '', content: '', category: 'idea', isShared: false });
    } catch (err) {
      console.error('Error adding note:', err);
      showToast('Failed to add note', 'error');
    }
    setSaving(false);
  };
  
  const handleUpdateNote = async () => {
    if (!editingNote || !editingNote.title.trim()) {
      showToast('Note title is required', 'error');
      return;
    }
    
    setSaving(true);
    try {
      await updateDoc(doc(db, NOTES_COLLECTION, editingNote.id), {
        title: editingNote.title.trim(),
        content: editingNote.content.trim(),
        category: editingNote.category,
        bookId: editingNote.bookId || null,
        lastEditedBy: userEmail,
        updatedAt: serverTimestamp(),
      });
      showToast('Note updated');
      setEditingNote(null);
    } catch (err) {
      console.error('Error updating note:', err);
      showToast('Failed to update note', 'error');
    }
    setSaving(false);
  };
  
  const handleDeleteNote = async (noteId) => {
    if (confirm('Delete this note? This cannot be undone.')) {
      try {
        await deleteDoc(doc(db, NOTES_COLLECTION, noteId));
        showToast('Note deleted');
        if (editingNote?.id === noteId) setEditingNote(null);
      } catch (err) {
        console.error('Error deleting note:', err);
        showToast('Failed to delete note', 'error');
      }
    }
  };
  
  if (notesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-corporate-teal" />
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1 flex-wrap">
          <div className="relative flex-1 max-w-md min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search notes..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-corporate-teal/50 dark:bg-slate-800 dark:border-slate-700"
            />
          </div>
          
          <select
            value={scopeFilter}
            onChange={(e) => setScopeFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-corporate-teal/50 dark:bg-slate-800 dark:border-slate-700"
          >
            <option value="all">All Notes ({notes.length})</option>
            <option value="shared">Shared Notes ({sharedNotes?.length || 0})</option>
            <option value="book">This Book Only ({bookNotes?.length || 0})</option>
          </select>
          
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-corporate-teal/50 dark:bg-slate-800 dark:border-slate-700"
          >
            <option value="all">All Categories</option>
            {NOTE_CATEGORIES.map(c => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </div>
        
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-corporate-teal text-white rounded-lg text-sm font-medium hover:bg-corporate-teal/90 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Note
        </button>
      </div>
      
      {/* Info banner */}
      <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-lg p-3 flex items-start gap-3">
        <Lightbulb className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-purple-800 dark:text-purple-200">
          <strong>Two types of notes:</strong> <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
            <Globe className="w-3 h-3" />Shared
          </span> notes apply to ALL books. <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-xs font-medium">
            <BookOpen className="w-3 h-3" />This Book
          </span> notes apply only to "{selectedBook?.title || 'this book'}".
        </div>
      </div>
      
      {/* Notes List */}
      <div className="space-y-3">
        {filteredNotes.map(note => {
          const isExpanded = expandedNotes.has(note.id);
          const category = getCategoryInfo(note.category);
          const isSharedNote = !note.bookId;
          
          return (
            <div
              key={note.id}
              className={`bg-white dark:bg-slate-800 rounded-xl border overflow-hidden ${
                isSharedNote 
                  ? 'border-blue-200 dark:border-blue-800' 
                  : 'border-slate-200 dark:border-slate-700'
              }`}
            >
              <div 
                className="p-4 cursor-pointer flex items-start gap-4 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                onClick={() => toggleNoteExpand(note.id)}
              >
                <button className="text-slate-400 hover:text-slate-600 mt-0.5">
                  {isExpanded ? (
                    <ChevronDown className="w-5 h-5" />
                  ) : (
                    <ChevronRight className="w-5 h-5" />
                  )}
                </button>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getCategoryColor(note.category)}`}>
                      {category?.label}
                    </span>
                    {isSharedNote ? (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded text-xs font-medium">
                        <Globe className="w-3 h-3" />Shared
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 rounded text-xs font-medium">
                        <BookOpen className="w-3 h-3" />This Book
                      </span>
                    )}
                    <h3 className="font-medium text-slate-900 dark:text-white">{note.title}</h3>
                  </div>
                  
                  {!isExpanded && note.content && (
                    <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-1">
                      {note.content}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
                    <Clock className="w-3 h-3" />
                    {note.updatedAt?.toDate?.()?.toLocaleDateString() || 'Just now'}
                    {note.lastEditedBy && (
                      <>
                        <span className="text-slate-300">•</span>
                        <span>by {note.lastEditedBy.split('@')[0]}</span>
                      </>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                  <button
                    onClick={() => setEditingNote({ ...note })}
                    className="p-2 text-slate-400 hover:text-corporate-teal hover:bg-corporate-teal/10 rounded-lg"
                    title="Edit note"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteNote(note.id)}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                    title="Delete note"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              {/* Expanded Content */}
              {isExpanded && note.content && (
                <div className="px-4 pb-4 pl-14">
                  <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                    {note.content}
                  </div>
                </div>
              )}
            </div>
          );
        })}
        
        {filteredNotes.length === 0 && (
          <div className="text-center py-12 text-slate-500 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <StickyNote className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="mb-3">No notes yet. Add notes to guide the AI in creating your book!</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-corporate-teal text-white rounded-lg text-sm font-medium hover:bg-corporate-teal/90"
            >
              Add Your First Note
            </button>
          </div>
        )}
      </div>
      
      {/* Category Summary */}
      {notes.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Notes by Category</h3>
          <div className="flex flex-wrap gap-2">
            {NOTE_CATEGORIES.map(cat => {
              const count = notes.filter(n => n.category === cat.id).length;
              if (count === 0) return null;
              return (
                <button
                  key={cat.id}
                  onClick={() => setCategoryFilter(categoryFilter === cat.id ? 'all' : cat.id)}
                  className={`px-3 py-1.5 text-sm rounded-lg flex items-center gap-2 transition ${
                    categoryFilter === cat.id 
                      ? 'bg-corporate-teal text-white' 
                      : getCategoryColor(cat.id)
                  }`}
                >
                  {cat.label}
                  <span className="px-1.5 py-0.5 bg-white/20 rounded text-xs font-bold">{count}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Add Note Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-lg">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Add Note</h2>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              {/* Scope Toggle */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Note Scope</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setNewNote({ ...newNote, isShared: true })}
                    className={`flex-1 px-4 py-3 rounded-lg border-2 text-sm font-medium transition flex items-center justify-center gap-2 ${
                      newNote.isShared 
                        ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' 
                        : 'border-slate-200 dark:border-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <Globe className="w-4 h-4" />
                    Shared (All Books)
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewNote({ ...newNote, isShared: false })}
                    className={`flex-1 px-4 py-3 rounded-lg border-2 text-sm font-medium transition flex items-center justify-center gap-2 ${
                      !newNote.isShared 
                        ? 'border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' 
                        : 'border-slate-200 dark:border-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <BookOpen className="w-4 h-4" />
                    This Book Only
                  </button>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {newNote.isShared 
                    ? 'This note will apply to ALL book styles' 
                    : `This note will only apply to "${selectedBook?.title || 'this book'}"`}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Category</label>
                <select
                  value={newNote.category}
                  onChange={(e) => setNewNote({ ...newNote, category: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-corporate-teal/50 dark:bg-slate-700 dark:border-slate-600"
                >
                  {NOTE_CATEGORIES.map(c => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Title *</label>
                <input
                  type="text"
                  value={newNote.title}
                  onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-corporate-teal/50 dark:bg-slate-700 dark:border-slate-600"
                  placeholder="e.g., Target audience pain points"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Content</label>
                <textarea
                  value={newNote.content}
                  onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                  rows={6}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-corporate-teal/50 dark:bg-slate-700 dark:border-slate-600"
                  placeholder="Write your thoughts, ideas, context, etc. This will help guide the AI when generating your book..."
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
                onClick={handleAddNote}
                disabled={saving || !newNote.title.trim()}
                className="px-4 py-2 text-sm bg-corporate-teal text-white rounded-lg hover:bg-corporate-teal/90 disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Add Note
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Edit Note Modal */}
      {editingNote && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-lg">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Edit Note</h2>
              <button onClick={() => setEditingNote(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              {/* Scope Toggle */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Note Scope</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingNote({ ...editingNote, bookId: null })}
                    className={`flex-1 px-4 py-3 rounded-lg border-2 text-sm font-medium transition flex items-center justify-center gap-2 ${
                      !editingNote.bookId 
                        ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' 
                        : 'border-slate-200 dark:border-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <Globe className="w-4 h-4" />
                    Shared (All Books)
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingNote({ ...editingNote, bookId: selectedBook?.id || 'default' })}
                    className={`flex-1 px-4 py-3 rounded-lg border-2 text-sm font-medium transition flex items-center justify-center gap-2 ${
                      editingNote.bookId 
                        ? 'border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' 
                        : 'border-slate-200 dark:border-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <BookOpen className="w-4 h-4" />
                    This Book Only
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Category</label>
                <select
                  value={editingNote.category}
                  onChange={(e) => setEditingNote({ ...editingNote, category: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-corporate-teal/50 dark:bg-slate-700 dark:border-slate-600"
                >
                  {NOTE_CATEGORIES.map(c => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Title *</label>
                <input
                  type="text"
                  value={editingNote.title}
                  onChange={(e) => setEditingNote({ ...editingNote, title: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-corporate-teal/50 dark:bg-slate-700 dark:border-slate-600"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Content</label>
                <textarea
                  value={editingNote.content}
                  onChange={(e) => setEditingNote({ ...editingNote, content: e.target.value })}
                  rows={6}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-corporate-teal/50 dark:bg-slate-700 dark:border-slate-600"
                />
              </div>
            </div>
            
            <div className="p-6 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
              <button
                onClick={() => setEditingNote(null)}
                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateNote}
                disabled={saving || !editingNote.title.trim()}
                className="px-4 py-2 text-sm bg-corporate-teal text-white rounded-lg hover:bg-corporate-teal/90 disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== OUTLINE TAB ====================

function OutlineTab({ chapters, chaptersLoading, showToast, userEmail, setSelectedChapter, setActiveTab, selectedBook }) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newChapter, setNewChapter] = useState({ title: '', summary: '' });
  const [saving, setSaving] = useState(false);
  const [draggedChapter, setDraggedChapter] = useState(null);
  
  const handleAddChapter = async () => {
    if (!newChapter.title.trim()) {
      showToast('Chapter title is required', 'error');
      return;
    }
    
    setSaving(true);
    try {
      const maxOrder = chapters.reduce((max, c) => Math.max(max, c.order || 0), 0);
      await addDoc(collection(db, CHAPTERS_COLLECTION), {
        bookId: selectedBook?.id || null,
        order: maxOrder + 1,
        title: newChapter.title || 'Untitled Chapter',
        summary: newChapter.summary || '',
        status: 'outline',
        sourceRefs: [],
        content: '',
        notes: '',
        createdBy: userEmail,
        lastEditedBy: userEmail,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      showToast('Chapter added');
      setShowAddModal(false);
      setNewChapter({ title: '', summary: '' });
    } catch (err) {
      console.error('Error adding chapter:', err);
      showToast('Failed to add chapter', 'error');
    }
    setSaving(false);
  };
  
  const handleDeleteChapter = async (chapterId) => {
    if (confirm('Delete this chapter? This cannot be undone.')) {
      try {
        await deleteDoc(doc(db, CHAPTERS_COLLECTION, chapterId));
        showToast('Chapter deleted');
      } catch (err) {
        console.error('Error deleting chapter:', err);
        showToast('Failed to delete chapter', 'error');
      }
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
    
    // Update order in Firestore
    try {
      const batch = writeBatch(db);
      reordered.forEach((chapter, index) => {
        const ref = doc(db, CHAPTERS_COLLECTION, chapter.id);
        batch.update(ref, { order: index + 1, updatedAt: serverTimestamp() });
      });
      await batch.commit();
      showToast('Chapters reordered');
    } catch (err) {
      console.error('Error reordering chapters:', err);
      showToast('Failed to reorder chapters', 'error');
    }
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
        <Loader2 className="w-6 h-6 animate-spin text-corporate-teal" />
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
          className="px-4 py-2 bg-corporate-teal text-white rounded-lg text-sm font-medium hover:bg-corporate-teal/90 flex items-center gap-2"
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
            
            <div className="w-10 h-10 bg-corporate-navy text-white rounded-lg flex items-center justify-center font-bold text-sm">
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
                  setSelectedChapter(chapter);
                  setActiveTab('chapters');
                }}
                className="p-2 text-slate-400 hover:text-corporate-teal hover:bg-corporate-teal/10 rounded-lg"
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
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-corporate-teal/50 dark:bg-slate-700 dark:border-slate-600"
                  placeholder="e.g., Chapter 1: The Leadership Gap"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Summary</label>
                <textarea
                  value={newChapter.summary}
                  onChange={(e) => setNewChapter({ ...newChapter, summary: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-corporate-teal/50 dark:bg-slate-700 dark:border-slate-600"
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
                className="px-4 py-2 text-sm bg-corporate-teal text-white rounded-lg hover:bg-corporate-teal/90 disabled:opacity-50 flex items-center gap-2"
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

function ChaptersTab({ chapters, selectedChapter, setSelectedChapter, sources, metadata, showToast, userEmail }) {
  const [content, setContent] = useState('');
  const [autoSaveTimer, setAutoSaveTimer] = useState(null);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [aiMode, setAiMode] = useState('draft');
  const [showSourcePicker, setShowSourcePicker] = useState(false);
  
  // Get linked sources for the selected chapter
  const linkedSources = selectedChapter?.sourceRefs 
    ? sources.filter(s => selectedChapter.sourceRefs.includes(s.id))
    : [];
  
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
      try {
        await updateDoc(doc(db, CHAPTERS_COLLECTION, selectedChapter.id), {
          content,
          lastEditedBy: userEmail,
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        console.error('Error saving chapter:', err);
      }
      setSaving(false);
    }, 2000);
    
    setAutoSaveTimer(timer);
    
    return () => clearTimeout(timer);
  }, [content]);
  
  const handleStatusChange = async (status) => {
    try {
      await updateDoc(doc(db, CHAPTERS_COLLECTION, selectedChapter.id), {
        status,
        lastEditedBy: userEmail,
        updatedAt: serverTimestamp(),
      });
      showToast('Status updated');
    } catch (err) {
      console.error('Error updating status:', err);
      showToast('Failed to update status', 'error');
    }
  };
  
  // AI Generation handler
  const handleAIGenerate = async (mode) => {
    if (!selectedChapter) return;
    
    setGenerating(true);
    setAiMode(mode);
    
    try {
      const generateBookDraft = httpsCallable(functions, 'generateBookDraft');
      
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
        showToast(`${mode === 'draft' ? 'Draft generated' : mode === 'expand' ? 'Content expanded' : 'Content refined'}!`);
      } else {
        throw new Error(result.data?.error || 'Generation failed');
      }
    } catch (err) {
      console.error('AI generation error:', err);
      showToast(err.message || 'Failed to generate content', 'error');
    } finally {
      setGenerating(false);
    }
  };
  
  // Source linking
  const handleLinkSource = async (sourceId) => {
    try {
      const newRefs = [...(selectedChapter.sourceRefs || []), sourceId];
      await updateDoc(doc(db, CHAPTERS_COLLECTION, selectedChapter.id), {
        sourceRefs: newRefs,
        updatedAt: serverTimestamp(),
      });
      setShowSourcePicker(false);
      showToast('Source linked');
    } catch (err) {
      console.error('Error linking source:', err);
      showToast('Failed to link source', 'error');
    }
  };
  
  const handleUnlinkSource = async (sourceId) => {
    try {
      const newRefs = (selectedChapter.sourceRefs || []).filter(id => id !== sourceId);
      await updateDoc(doc(db, CHAPTERS_COLLECTION, selectedChapter.id), {
        sourceRefs: newRefs,
        updatedAt: serverTimestamp(),
      });
      showToast('Source unlinked');
    } catch (err) {
      console.error('Error unlinking source:', err);
      showToast('Failed to unlink source', 'error');
    }
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
              className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 text-left hover:border-corporate-teal transition"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-corporate-navy text-white rounded-lg flex items-center justify-center font-bold text-sm">
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
    <div className="flex gap-6 h-[calc(100vh-16rem)]">
      {/* Chapter List Sidebar */}
      <div className="w-64 flex-shrink-0 space-y-2 overflow-y-auto">
        {chapters.map((chapter, index) => (
          <button
            key={chapter.id}
            onClick={() => setSelectedChapter(chapter)}
            className={`w-full p-3 rounded-lg text-left transition ${
              selectedChapter?.id === chapter.id
                ? 'bg-corporate-teal text-white'
                : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-corporate-teal'
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
              className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-corporate-teal/50 dark:bg-slate-700 dark:border-slate-600"
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
              className="p-1 text-corporate-teal hover:bg-corporate-teal/10 rounded"
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

// ==================== TAB NAVIGATION ====================

const tabs = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'sources', label: 'Sources', icon: FolderOpen },
  { id: 'notes', label: 'Notes', icon: StickyNote },
  { id: 'outline', label: 'Outline', icon: ListOrdered },
  { id: 'chapters', label: 'Chapters', icon: PenTool },
];

// ==================== MAIN COMPONENT ====================

export default function BookBuilder() {
  const { user, navigate } = useAppServices();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [toast, setToast] = useState(null);
  
  // Books state
  const [books, setBooks] = useState([]);
  const [booksLoading, setBooksLoading] = useState(true);
  const [selectedBook, setSelectedBook] = useState(null);
  
  // Data state
  const [sources, setSources] = useState([]);
  const [sourcesLoading, setSourcesLoading] = useState(true);
  const [chapters, setChapters] = useState([]);
  const [chaptersLoading, setChaptersLoading] = useState(true);
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [notes, setNotes] = useState([]);
  const [notesLoading, setNotesLoading] = useState(true);
  
  // Toast helper
  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
  }, []);
  
  // Subscribe to books
  useEffect(() => {
    const q = query(collection(db, BOOKS_COLLECTION), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setBooks(data);
      setBooksLoading(false);
      
      // Auto-select first book if none selected
      if (!selectedBook && data.length > 0) {
        setSelectedBook(data[0]);
      }
      // Update selected book if it changed
      if (selectedBook) {
        const updated = data.find(b => b.id === selectedBook.id);
        if (updated) setSelectedBook(updated);
      }
    }, (err) => {
      console.error('Error subscribing to books:', err);
      setBooksLoading(false);
    });
    
    return () => unsubscribe();
  }, [selectedBook?.id]);
  
  // Subscribe to sources from content_library where includeInBook === true
  useEffect(() => {
    const q = query(
      collection(db, CONTENT_LIBRARY_COLLECTION), 
      where('includeInBook', '==', true),
      orderBy('createdAt', 'desc')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => {
        const item = doc.data();
        return {
          id: doc.id,
          title: item.title || 'Untitled',
          type: item.type || 'DOCUMENT',
          content: buildSourceContent(item),
          tags: [...(item.programs || []), ...(item.skills || [])],
          notes: item.description || '',
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
          _original: item
        };
      });
      setSources(data);
      setSourcesLoading(false);
    }, (err) => {
      console.error('Error subscribing to sources:', err);
      setSourcesLoading(false);
    });
    
    return () => unsubscribe();
  }, []);
  
  // Subscribe to chapters for selected book
  useEffect(() => {
    if (!selectedBook?.id) {
      setChapters([]);
      setChaptersLoading(false);
      return;
    }
    
    setChaptersLoading(true);
    const q = query(
      collection(db, CHAPTERS_COLLECTION), 
      where('bookId', '==', selectedBook.id),
      orderBy('order', 'asc')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setChapters(data);
      setChaptersLoading(false);
      
      if (selectedChapter) {
        const updated = data.find(c => c.id === selectedChapter.id);
        if (updated) setSelectedChapter(updated);
        else setSelectedChapter(null); // Chapter no longer in this book
      }
    }, (err) => {
      console.error('Error subscribing to chapters:', err);
      setChaptersLoading(false);
    });
    
    return () => unsubscribe();
  }, [selectedBook?.id]);
  
  // Subscribe to notes - both shared (bookId null) and book-specific
  useEffect(() => {
    // Subscribe to all notes, then filter client-side for shared + book-specific
    const q = query(collection(db, NOTES_COLLECTION), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allNotes = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      // Filter: shared notes (no bookId) + book-specific notes
      const filteredNotes = allNotes.filter(note => 
        !note.bookId || note.bookId === selectedBook?.id
      );
      setNotes(filteredNotes);
      setNotesLoading(false);
    }, (err) => {
      console.error('Error subscribing to notes:', err);
      setNotesLoading(false);
    });
    
    return () => unsubscribe();
  }, [selectedBook?.id]);
  
  // Create a new book
  const createBook = async (bookData) => {
    try {
      const docRef = await addDoc(collection(db, BOOKS_COLLECTION), {
        ...bookData,
        createdBy: user?.email,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      showToast('Book created!');
      // Auto-select the new book
      setSelectedBook({ id: docRef.id, ...bookData });
    } catch (err) {
      console.error('Error creating book:', err);
      showToast('Failed to create book', 'error');
    }
  };
  
  // Update selected book
  const updateBook = async (updates) => {
    if (!selectedBook?.id) return;
    
    try {
      await updateDoc(doc(db, BOOKS_COLLECTION, selectedBook.id), {
        ...updates,
        updatedAt: serverTimestamp(),
      });
      setSelectedBook(prev => ({ ...prev, ...updates }));
      showToast('Book details saved');
    } catch (err) {
      console.error('Error updating book:', err);
      showToast('Failed to save book details', 'error');
    }
  };
  
  // Progress calculation for current book
  const getProgress = () => {
    if (chapters.length === 0) return { total: 0, complete: 0, percent: 0 };
    const complete = chapters.filter(c => c.status === 'complete').length;
    return {
      total: chapters.length,
      complete,
      percent: Math.round((complete / chapters.length) * 100),
    };
  };
  
  // Get shared notes vs book-specific notes
  const sharedNotes = notes.filter(n => !n.bookId);
  const bookNotes = notes.filter(n => n.bookId === selectedBook?.id);
  
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('marketing-center')}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-white rounded-lg"
              title="Back to Sales & Marketing Center"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="w-10 h-10 bg-corporate-teal/10 rounded-xl flex items-center justify-center">
              <BookCopy className="w-5 h-5 text-corporate-teal" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">Book Builder</h1>
              <p className="text-sm text-slate-500">Create your leadership book series</p>
            </div>
          </div>
        </div>
        
        {/* Book Selector */}
        <BookSelector
          books={books}
          selectedBook={selectedBook}
          onSelectBook={setSelectedBook}
          onCreateBook={createBook}
          booksLoading={booksLoading}
        />
        
        {/* Show tabs only if a book is selected */}
        {selectedBook && (
          <>
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
                        ? 'bg-white dark:bg-slate-700 text-corporate-teal shadow-sm'
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
              {activeTab === 'dashboard' && (
                <DashboardTab 
                  metadata={selectedBook}
                  metadataLoading={booksLoading}
                  updateMetadata={updateBook}
                  chapters={chapters}
                  sources={sources}
                  notes={notes}
                  sharedNotes={sharedNotes}
                  bookNotes={bookNotes}
                  getProgress={getProgress}
                  showToast={showToast}
                  setActiveTab={setActiveTab}
                  selectedBook={selectedBook}
                />
              )}
              {activeTab === 'sources' && (
                <SourcesTab 
                  sources={sources}
                  sourcesLoading={sourcesLoading}
                  showToast={showToast}
                  navigate={navigate}
                />
              )}
              {activeTab === 'notes' && (
                <NotesTab
                  notes={notes}
                  sharedNotes={sharedNotes}
                  bookNotes={bookNotes}
                  notesLoading={notesLoading}
                  showToast={showToast}
                  userEmail={user?.email}
                  selectedBook={selectedBook}
                />
              )}
              {activeTab === 'outline' && (
                <OutlineTab 
                  chapters={chapters}
                  chaptersLoading={chaptersLoading}
                  showToast={showToast}
                  userEmail={user?.email}
                  setSelectedChapter={setSelectedChapter}
                  setActiveTab={setActiveTab}
                  selectedBook={selectedBook}
                />
              )}
              {activeTab === 'chapters' && (
                <ChaptersTab 
                  chapters={chapters}
                  selectedChapter={selectedChapter}
                  setSelectedChapter={setSelectedChapter}
                  sources={sources}
                  metadata={selectedBook}
                  showToast={showToast}
                  userEmail={user?.email}
                  selectedBook={selectedBook}
                />
              )}
            </div>
          </>
        )}
        
        {/* No book selected state */}
        {!booksLoading && !selectedBook && books.length === 0 && (
          <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <BookCopy className="w-16 h-16 mx-auto mb-4 text-slate-300" />
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">No Books Yet</h2>
            <p className="text-slate-500 mb-6">Create your first book to get started with the Book Builder.</p>
            <p className="text-sm text-slate-400">Click "New Book" above to create a Methodology Book, Business Fable, Quick Primer, or other book style.</p>
          </div>
        )}
      </div>
      
      {/* Toast Notification */}
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}
    </div>
  );
}
