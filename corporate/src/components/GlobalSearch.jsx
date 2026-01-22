import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Search, Command, X, FileText, Users, Calendar, Mail,
  DollarSign, Target, Building2, Settings, ChevronRight,
  Sparkles, Clock, TrendingUp, MessageSquare, Zap, Folder,
  ArrowRight, BarChart2, RefreshCw, User, Briefcase, Send
} from 'lucide-react';
import { collection, query, getDocs, limit, orderBy, where } from 'firebase/firestore';
import { db } from '../firebase';
import { useNavigate } from 'react-router-dom';

/**
 * Global Search & AI Assistant
 * 
 * Features:
 * - Universal search across all entities
 * - AI-powered natural language queries
 * - Quick actions
 * - Recent searches
 * - Search suggestions
 */

const ENTITY_TYPES = {
  prospect: { icon: Building2, color: 'text-blue-500', bg: 'bg-blue-100', label: 'Prospect' },
  proposal: { icon: FileText, color: 'text-purple-500', bg: 'bg-purple-100', label: 'Proposal' },
  demo: { icon: Calendar, color: 'text-green-500', bg: 'bg-green-100', label: 'Demo' },
  document: { icon: Folder, color: 'text-amber-500', bg: 'bg-amber-100', label: 'Document' },
  activity: { icon: MessageSquare, color: 'text-cyan-500', bg: 'bg-cyan-100', label: 'Activity' },
  template: { icon: Mail, color: 'text-pink-500', bg: 'bg-pink-100', label: 'Template' },
  team: { icon: Users, color: 'text-indigo-500', bg: 'bg-indigo-100', label: 'Team Member' }
};

const QUICK_ACTIONS = [
  { id: 'new-prospect', label: 'Add new prospect', icon: Building2, path: '/sales/prospects' },
  { id: 'new-proposal', label: 'Create proposal', icon: FileText, path: '/sales/proposals' },
  { id: 'schedule-demo', label: 'Schedule demo', icon: Calendar, path: '/sales/demos' },
  { id: 'view-pipeline', label: 'View pipeline', icon: BarChart2, path: '/analytics/pipeline' },
  { id: 'upload-document', label: 'Upload document', icon: Folder, path: '/sales/documents' },
  { id: 'log-activity', label: 'Log activity', icon: MessageSquare, path: '/sales/activities' }
];

const AI_SUGGESTIONS = [
  "Show me deals closing this week",
  "What's my pipeline value?",
  "Find prospects in tech industry",
  "Show overdue follow-ups",
  "List my top proposals"
];

const GlobalSearch = ({ isOpen, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const [aiMode, setAiMode] = useState(false);
  const [aiResponse, setAiResponse] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
    // Reset state when opening
    if (isOpen) {
      setSearchTerm('');
      setResults([]);
      setAiResponse('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    // Load recent searches from localStorage
    const saved = localStorage.getItem('cc_recent_searches');
    if (saved) {
      setRecentSearches(JSON.parse(saved).slice(0, 5));
    }
  }, [isOpen]);

  useEffect(() => {
    if (searchTerm.length >= 2 && !aiMode) {
      performSearch(searchTerm);
    } else if (searchTerm.length === 0) {
      setResults([]);
    }
  }, [searchTerm, aiMode]);

  const performSearch = async (term) => {
    setLoading(true);
    const searchResults = [];

    try {
      // Search prospects
      const prospectsSnap = await getDocs(collection(db, 'corporate_prospects'));
      prospectsSnap.docs.forEach(doc => {
        const data = doc.data();
        if (data.company?.toLowerCase().includes(term.toLowerCase()) ||
            data.name?.toLowerCase().includes(term.toLowerCase())) {
          searchResults.push({
            id: doc.id,
            type: 'prospect',
            title: data.company || data.name,
            subtitle: `${data.stage || 'New'} • $${(data.value || 0).toLocaleString()}`,
            data
          });
        }
      });

      // Search proposals
      const proposalsSnap = await getDocs(collection(db, 'corporate_proposals'));
      proposalsSnap.docs.forEach(doc => {
        const data = doc.data();
        if (data.title?.toLowerCase().includes(term.toLowerCase()) ||
            data.prospectName?.toLowerCase().includes(term.toLowerCase())) {
          searchResults.push({
            id: doc.id,
            type: 'proposal',
            title: data.title,
            subtitle: `${data.prospectName} • $${(data.amount || 0).toLocaleString()}`,
            data
          });
        }
      });

      // Search activities
      const activitiesSnap = await getDocs(collection(db, 'corporate_activities'));
      activitiesSnap.docs.forEach(doc => {
        const data = doc.data();
        if (data.title?.toLowerCase().includes(term.toLowerCase()) ||
            data.notes?.toLowerCase().includes(term.toLowerCase())) {
          searchResults.push({
            id: doc.id,
            type: 'activity',
            title: data.title || `${data.type} with ${data.prospectName}`,
            subtitle: data.prospectName,
            data
          });
        }
      });

      // Search email templates
      const templatesSnap = await getDocs(collection(db, 'corporate_email_templates'));
      templatesSnap.docs.forEach(doc => {
        const data = doc.data();
        if (data.name?.toLowerCase().includes(term.toLowerCase()) ||
            data.subject?.toLowerCase().includes(term.toLowerCase())) {
          searchResults.push({
            id: doc.id,
            type: 'template',
            title: data.name,
            subtitle: data.subject,
            data
          });
        }
      });

      setResults(searchResults.slice(0, 10));
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAIQuery = async () => {
    if (!searchTerm.trim()) return;
    
    setLoading(true);
    setAiMode(true);

    // Save to recent
    saveRecentSearch(searchTerm);

    // Simulate AI response (in production, this would call Gemini)
    setTimeout(() => {
      const query = searchTerm.toLowerCase();
      let response = '';

      if (query.includes('pipeline') || query.includes('value')) {
        response = "📊 **Pipeline Summary**\n\nYour current pipeline value is **$847,500** across 12 active deals.\n\n- 🟢 Qualified: $125,000 (3 deals)\n- 🔵 Demo: $340,000 (4 deals)\n- 🟣 Proposal: $382,500 (5 deals)\n\nTip: Focus on the proposal stage - 5 deals ready to close!";
      } else if (query.includes('closing') || query.includes('this week')) {
        response = "📅 **Deals Closing This Week**\n\n1. **TechCorp Inc** - $85,000 (Contract sent)\n2. **GlobalRetail** - $42,000 (Final review)\n3. **StartupX** - $28,000 (Negotiation)\n\nTotal: **$155,000** potential this week";
      } else if (query.includes('overdue') || query.includes('follow')) {
        response = "⚠️ **Overdue Follow-ups**\n\nYou have 4 prospects needing attention:\n\n1. Acme Corp - Last contact 8 days ago\n2. DataStream - Demo scheduled, no follow-up\n3. CloudFirst - Proposal sent 5 days ago\n4. TechVentures - Initial contact, no response\n\nWould you like me to draft follow-up emails?";
      } else if (query.includes('top') || query.includes('proposal')) {
        response = "📋 **Top Proposals**\n\n1. **Enterprise Platform License** - TechCorp - $120,000\n2. **Annual Support Contract** - GlobalRetail - $85,000\n3. **Implementation Package** - StartupX - $65,000\n4. **Custom Integration** - DataCo - $48,000\n\nTotal pending: **$318,000**";
      } else {
        response = `I searched for "${searchTerm}" across your data.\n\nI found potential matches in:\n- 3 Prospects\n- 2 Proposals\n- 1 Activity\n\nWould you like me to show detailed results or help you with something specific?`;
      }

      setAiResponse(response);
      setLoading(false);
    }, 1000);
  };

  const saveRecentSearch = (term) => {
    const updated = [term, ...recentSearches.filter(s => s !== term)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('cc_recent_searches', JSON.stringify(updated));
  };

  const handleSelect = (result) => {
    saveRecentSearch(result.title);
    onClose();
    
    // Navigate based on type
    switch (result.type) {
      case 'prospect':
        navigate('/sales/prospects');
        break;
      case 'proposal':
        navigate('/sales/proposals');
        break;
      case 'activity':
        navigate('/sales/activities');
        break;
      case 'template':
        navigate('/marketing/templates');
        break;
      default:
        break;
    }
  };

  const handleQuickAction = (action) => {
    onClose();
    navigate(action.path);
  };

  const handleKeyDown = (e) => {
    const totalItems = aiMode ? 0 : (results.length > 0 ? results.length : QUICK_ACTIONS.length);
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % totalItems);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + totalItems) % totalItems);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (searchTerm.startsWith('/ai ') || e.metaKey || e.ctrlKey) {
        handleAIQuery();
      } else if (results.length > 0) {
        handleSelect(results[selectedIndex]);
      } else if (QUICK_ACTIONS[selectedIndex]) {
        handleQuickAction(QUICK_ACTIONS[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center pt-[15vh] z-50 p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="p-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            {aiMode ? (
              <Sparkles className="w-5 h-5 text-purple-500" />
            ) : (
              <Search className="w-5 h-5 text-slate-400" />
            )}
            <input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setAiMode(e.target.value.startsWith('/ai '));
                setSelectedIndex(0);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Search prospects, proposals, activities... or /ai for AI assistant"
              className="flex-1 text-lg outline-none"
            />
            {searchTerm && (
              <button onClick={() => { setSearchTerm(''); setAiMode(false); setAiResponse(''); }}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            )}
            <div className="flex items-center gap-2 text-xs text-slate-400 border-l border-slate-200 pl-3">
              <kbd className="px-1.5 py-0.5 bg-slate-100 rounded">⌘</kbd>
              <span>+</span>
              <kbd className="px-1.5 py-0.5 bg-slate-100 rounded">K</kbd>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center">
              <RefreshCw className="w-8 h-8 animate-spin text-corporate-teal mx-auto" />
              <p className="text-sm text-slate-500 mt-2">
                {aiMode ? 'AI is thinking...' : 'Searching...'}
              </p>
            </div>
          ) : aiMode && aiResponse ? (
            <div className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-purple-500" />
                <span className="font-medium text-purple-600">AI Response</span>
              </div>
              <div className="bg-slate-50 rounded-xl p-4 prose prose-sm max-w-none">
                {aiResponse.split('\n').map((line, i) => (
                  <p key={i} className={line.startsWith('**') ? 'font-semibold' : ''}>
                    {line.replace(/\*\*/g, '')}
                  </p>
                ))}
              </div>
              <div className="mt-4 flex gap-2">
                <button 
                  onClick={() => { setAiMode(false); setAiResponse(''); setSearchTerm(''); }}
                  className="text-sm text-slate-500 hover:text-slate-700"
                >
                  ← Back to search
                </button>
              </div>
            </div>
          ) : searchTerm && results.length > 0 ? (
            <div className="py-2">
              <div className="px-4 py-2 text-xs font-medium text-slate-400 uppercase">
                Results ({results.length})
              </div>
              {results.map((result, idx) => {
                const typeInfo = ENTITY_TYPES[result.type] || ENTITY_TYPES.prospect;
                const Icon = typeInfo.icon;
                return (
                  <button
                    key={result.id}
                    onClick={() => handleSelect(result)}
                    className={`w-full flex items-center gap-4 px-4 py-3 text-left transition ${
                      selectedIndex === idx ? 'bg-corporate-teal/5' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-lg ${typeInfo.bg} flex items-center justify-center`}>
                      <Icon className={typeInfo.color} size={20} />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-slate-800">{result.title}</div>
                      <div className="text-sm text-slate-500">{result.subtitle}</div>
                    </div>
                    <span className="text-xs px-2 py-1 bg-slate-100 rounded text-slate-500">
                      {typeInfo.label}
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-300" />
                  </button>
                );
              })}
            </div>
          ) : searchTerm && results.length === 0 ? (
            <div className="p-8 text-center">
              <Search className="w-12 h-12 text-slate-200 mx-auto mb-3" />
              <p className="text-slate-500">No results for "{searchTerm}"</p>
              <button
                onClick={handleAIQuery}
                className="mt-4 text-sm text-corporate-teal hover:underline flex items-center gap-2 mx-auto"
              >
                <Sparkles size={14} /> Ask AI instead
              </button>
            </div>
          ) : (
            <div className="py-2">
              {/* AI Suggestions */}
              <div className="px-4 py-2 text-xs font-medium text-slate-400 uppercase flex items-center gap-2">
                <Sparkles size={12} /> AI Suggestions
              </div>
              <div className="px-4 pb-4 flex flex-wrap gap-2">
                {AI_SUGGESTIONS.map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => { setSearchTerm('/ai ' + suggestion); setAiMode(true); }}
                    className="text-xs px-3 py-1.5 bg-purple-50 text-purple-600 rounded-full hover:bg-purple-100"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>

              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <>
                  <div className="px-4 py-2 text-xs font-medium text-slate-400 uppercase flex items-center gap-2">
                    <Clock size={12} /> Recent Searches
                  </div>
                  {recentSearches.map((search, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSearchTerm(search)}
                      className="w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-slate-50"
                    >
                      <Clock className="w-4 h-4 text-slate-300" />
                      <span className="text-sm text-slate-600">{search}</span>
                    </button>
                  ))}
                </>
              )}

              {/* Quick Actions */}
              <div className="px-4 py-2 text-xs font-medium text-slate-400 uppercase flex items-center gap-2">
                <Zap size={12} /> Quick Actions
              </div>
              {QUICK_ACTIONS.map((action, idx) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.id}
                    onClick={() => handleQuickAction(action)}
                    className={`w-full flex items-center gap-4 px-4 py-3 text-left transition ${
                      !searchTerm && selectedIndex === idx ? 'bg-corporate-teal/5' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                      <Icon className="text-slate-500" size={16} />
                    </div>
                    <span className="text-sm text-slate-700">{action.label}</span>
                    <ChevronRight className="w-4 h-4 text-slate-300 ml-auto" />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 bg-white rounded shadow-sm">↵</kbd> to select
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 bg-white rounded shadow-sm">↑↓</kbd> to navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 bg-white rounded shadow-sm">esc</kbd> to close
            </span>
          </div>
          <span className="flex items-center gap-1">
            <Sparkles size={12} className="text-purple-400" /> Powered by AI
          </span>
        </div>
      </div>
    </div>
  );
};

export default GlobalSearch;
