import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, Command, Users, Target, Mail, Calendar, FileText, 
  BarChart3, FlaskConical, Presentation, Building2, Megaphone,
  ArrowRight, Plus, Zap, X, BrainCircuit, ShieldCheck
} from 'lucide-react';

/**
 * Quick Actions Command Bar (⌘K / Ctrl+K)
 * 
 * This component provides a spotlight-style command palette for:
 * - Quick navigation to any module
 * - Creating new items (prospects, proposals, goals)
 * - Searching across the app
 * 
 * KEYBOARD SHORTCUTS:
 * - Cmd/Ctrl + K: Open command bar
 * - Arrow Up/Down: Navigate results
 * - Enter: Execute selected action
 * - Escape: Close
 */

const CommandBar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  // Define all available commands
  const commands = [
    // Navigation
    { id: 'nav-dashboard', type: 'navigation', label: 'Go to Dashboard', icon: Command, path: '/', keywords: ['home', 'main', 'overview'] },
    { id: 'nav-prospects', type: 'navigation', label: 'Go to Prospects', icon: Users, path: '/sales/prospects', keywords: ['leads', 'contacts', 'apollo'] },
    { id: 'nav-outreach', type: 'navigation', label: 'Go to Outreach', icon: Target, path: '/sales/outreach', keywords: ['email', 'sequence', 'campaign'] },
    { id: 'nav-demos', type: 'navigation', label: 'Go to Demo Center', icon: Presentation, path: '/sales/demos', keywords: ['video', 'tour', 'presentation'] },
    { id: 'nav-proposals', type: 'navigation', label: 'Go to Proposals', icon: FileText, path: '/sales/proposals', keywords: ['quote', 'roi', 'contract'] },
    { id: 'nav-vendors', type: 'navigation', label: 'Go to Partners/Vendors', icon: Building2, path: '/sales/vendors', keywords: ['partner', 'vendor', 'network'] },
    { id: 'nav-email', type: 'navigation', label: 'Go to Email Control', icon: Mail, path: '/marketing/email-health', keywords: ['deliverability', 'dns', 'templates'] },
    { id: 'nav-amplify', type: 'navigation', label: 'Go to Content Amplify', icon: Megaphone, path: '/marketing/amplify', keywords: ['social', 'content', 'marketing'] },
    { id: 'nav-scheduler', type: 'navigation', label: 'Go to Scheduler', icon: Calendar, path: '/ops/scheduler', keywords: ['calendar', 'booking', 'availability'] },
    { id: 'nav-goals', type: 'navigation', label: 'Go to Goal Frameworks', icon: Target, path: '/coaching/goals', keywords: ['smart', 'woop', 'objectives'] },
    { id: 'nav-ai', type: 'navigation', label: 'Go to AI Coach Logic', icon: BrainCircuit, path: '/coaching/ai', keywords: ['prompt', 'tuner', 'gemini'] },
    { id: 'nav-analytics', type: 'navigation', label: 'Go to Leader Analytics', icon: BarChart3, path: '/analytics/leaders', keywords: ['metrics', 'reports', 'data'] },
    { id: 'nav-lab', type: 'navigation', label: 'Go to Feature Lab', icon: FlaskConical, path: '/product/lab', keywords: ['features', 'flags', 'experiments'] },
    { id: 'nav-admin', type: 'navigation', label: 'Go to Sales Admin', icon: ShieldCheck, path: '/sales/admin', keywords: ['admin', 'manager', 'settings'] },
    
    // Quick Actions
    { id: 'action-new-prospect', type: 'action', label: 'Create New Prospect', icon: Plus, action: 'new-prospect', keywords: ['add', 'lead', 'contact'] },
    { id: 'action-new-proposal', type: 'action', label: 'Create New Proposal', icon: Plus, action: 'new-proposal', keywords: ['quote', 'deal', 'contract'] },
    { id: 'action-new-goal', type: 'action', label: 'Set New Goal', icon: Plus, action: 'new-goal', keywords: ['objective', 'target', 'smart'] },
    { id: 'action-start-sequence', type: 'action', label: 'Start Outreach Sequence', icon: Zap, action: 'start-sequence', keywords: ['campaign', 'email', 'outreach'] },
  ];

  // Filter commands based on query
  const filteredCommands = query.trim() === '' 
    ? commands.slice(0, 8) // Show top 8 by default
    : commands.filter(cmd => {
        const searchText = `${cmd.label} ${cmd.keywords.join(' ')}`.toLowerCase();
        return searchText.includes(query.toLowerCase());
      });

  // Group commands by type for display
  const groupedCommands = {
    navigation: filteredCommands.filter(c => c.type === 'navigation'),
    action: filteredCommands.filter(c => c.type === 'action'),
  };

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Open with Cmd+K or Ctrl+K
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
      
      // Close with Escape
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Handle keyboard navigation within the command bar
  const handleInputKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, filteredCommands.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      executeCommand(filteredCommands[selectedIndex]);
    }
  };

  // Execute a command
  const executeCommand = (cmd) => {
    if (!cmd) return;
    
    setIsOpen(false);
    
    if (cmd.type === 'navigation') {
      navigate(cmd.path);
    } else if (cmd.type === 'action') {
      // Dispatch custom events for actions that other components can listen to
      window.dispatchEvent(new CustomEvent('commandbar:action', { detail: cmd.action }));
      
      // Navigate to relevant page for certain actions
      switch (cmd.action) {
        case 'new-prospect':
          navigate('/sales/prospects');
          setTimeout(() => window.dispatchEvent(new CustomEvent('prospect:open-add-modal')), 100);
          break;
        case 'new-proposal':
          navigate('/sales/proposals');
          setTimeout(() => window.dispatchEvent(new CustomEvent('proposal:open-builder')), 100);
          break;
        case 'new-goal':
          navigate('/coaching/goals');
          break;
        case 'start-sequence':
          navigate('/sales/outreach');
          break;
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-start justify-center pt-[15vh]"
      onClick={() => setIsOpen(false)}
    >
      <div 
        className="bg-white rounded-xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200">
          <Search size={20} className="text-slate-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleInputKeyDown}
            placeholder="Type a command or search..."
            className="flex-1 text-lg outline-none placeholder:text-slate-400"
          />
          <div className="flex items-center gap-1">
            <kbd className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-xs font-mono">esc</kbd>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="p-1 text-slate-400 hover:text-slate-600"
          >
            <X size={18} />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-[400px] overflow-y-auto">
          {filteredCommands.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <Search size={32} className="mx-auto mb-2 opacity-50" />
              <p>No commands found for "{query}"</p>
            </div>
          ) : (
            <>
              {/* Navigation Section */}
              {groupedCommands.navigation.length > 0 && (
                <div>
                  <div className="px-4 py-2 bg-slate-50 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Navigation
                  </div>
                  {groupedCommands.navigation.map((cmd) => {
                    const globalIdx = filteredCommands.indexOf(cmd);
                    return (
                      <button
                        key={cmd.id}
                        onClick={() => executeCommand(cmd)}
                        onMouseEnter={() => setSelectedIndex(globalIdx)}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left transition ${
                          selectedIndex === globalIdx 
                            ? 'bg-corporate-teal/10 text-corporate-teal' 
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <cmd.icon size={18} className={selectedIndex === globalIdx ? 'text-corporate-teal' : 'text-slate-400'} />
                        <span className="flex-1 font-medium">{cmd.label}</span>
                        <ArrowRight size={14} className="opacity-50" />
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Actions Section */}
              {groupedCommands.action.length > 0 && (
                <div>
                  <div className="px-4 py-2 bg-slate-50 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Quick Actions
                  </div>
                  {groupedCommands.action.map((cmd) => {
                    const globalIdx = filteredCommands.indexOf(cmd);
                    return (
                      <button
                        key={cmd.id}
                        onClick={() => executeCommand(cmd)}
                        onMouseEnter={() => setSelectedIndex(globalIdx)}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left transition ${
                          selectedIndex === globalIdx 
                            ? 'bg-purple-50 text-purple-700' 
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                          selectedIndex === globalIdx ? 'bg-purple-100' : 'bg-slate-100'
                        }`}>
                          <cmd.icon size={14} className={selectedIndex === globalIdx ? 'text-purple-600' : 'text-slate-500'} />
                        </div>
                        <span className="flex-1 font-medium">{cmd.label}</span>
                        <kbd className="px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded text-[10px] font-mono">↵</kbd>
                      </button>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px]">↑</kbd>
              <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px]">↓</kbd>
              to navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px]">↵</kbd>
              to select
            </span>
          </div>
          <div className="flex items-center gap-1 text-corporate-teal font-medium">
            <Command size={12} />
            <span>LeaderReps Command</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommandBar;
