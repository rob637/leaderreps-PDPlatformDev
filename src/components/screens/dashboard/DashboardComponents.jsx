// src/components/screens/dashboard/DashboardComponents.jsx
// MODIFIED: Refactored to use Atomic Components

import React, { useState, useEffect } from 'react';
import { 
  Target, Clock, User, Save, Loader, CheckCircle, TrendingUp, Star, 
  ChevronDown, ChevronUp, Plus, X, Sunrise, Moon, Flame, Anchor,
  ToggleLeft, ToggleRight, Zap, AlertTriangle, MessageSquare, Trophy,
  Send, Users, Activity, Edit3, Calendar, ChevronRight
} from 'lucide-react';

// --- ATOMIC COMPONENTS ---
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { Input, Textarea } from '../../ui/Input';
import { Checkbox } from '../../ui/Checkbox';
import { Badge } from '../../ui/Badge';

// --- Helper function to format timestamps ---
const formatTimestamp = (timestamp) => {
  if (!timestamp) return 'Just now';
  
  try {
    // Handle both Date objects and Firestore Timestamps
    const date = timestamp instanceof Date ? timestamp : timestamp.toDate?.();
    if (!date) return 'Just now';
    
    const now = new Date();
    const diff = now - date;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (seconds < 60) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    return date.toLocaleDateString();
  } catch (error) {
    console.error('Error formatting timestamp:', error);
    return 'Recently';
  }
};

/* =========================================================
   UNIFIED ANCHOR EDITOR MODAL
========================================================= */
const AnchorInputSection = ({ 
    title, description, value, setValue, 
    suggestions, onSelectSuggestion, isTextArea = false,
    icon: Icon 
}) => {
    const suggestionPrefix = title === '1. Identity Anchor' ? '... ' : ''; 
        
    return (
        <div className="p-4 rounded-xl border border-slate-200">
            <div className="flex items-center gap-2 mb-2">
                <Icon className="w-5 h-5 text-corporate-teal" />
                <h3 className="text-lg font-bold text-corporate-navy">
                    {title}
                </h3>
            </div>
            <p className="text-xs mb-3 text-slate-500">
                {description}
            </p>
            
            {isTextArea ? (
                <Textarea 
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder="Enter your anchor..."
                    className="mb-4"
                    rows={3}
                />
            ) : (
                <Input 
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder="Enter your anchor..."
                    className="mb-4"
                />
            )}
            
            {suggestions && suggestions.length > 0 && (
                <>
                    <p className="text-xs font-semibold mb-2 text-slate-500">
                        SUGGESTIONS:
                    </p>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                        {suggestions.slice(0, 3).map((suggestion, index) => (
                            <button
                                key={index}
                                onClick={() => onSelectSuggestion(suggestion.text)}
                                className="w-full text-left p-2 rounded-lg text-sm transition-all bg-slate-50 hover:bg-teal-50 text-corporate-navy"
                            >
                                {suggestionPrefix} {suggestion.text}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

export const UnifiedAnchorEditorModal = ({ 
    isOpen = false,
    initialIdentity = '', initialHabit = '', initialWhy = '',
    identitySuggestions = [], habitSuggestions = [], whySuggestions = [],
    onSave, onClose
}) => {
    const [identity, setIdentity] = useState(initialIdentity);
    const [habit, setHabit] = useState(initialHabit);
    const [why, setWhy] = useState(initialWhy);

    const handleSave = () => {
        if (onSave) {
            onSave({ identity, habit, why });
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center mb-6 border-b pb-4 border-slate-100">
                    <h2 className="text-xl font-bold text-corporate-navy flex items-center gap-2">
                        <Anchor className="w-6 h-6 text-corporate-teal" />
                        Define Your Leadership Anchors
                    </h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-100">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                
                <div className="overflow-y-auto flex-1 space-y-4 pr-2">
                    <AnchorInputSection
                        title="1. Identity Anchor"
                        icon={User}
                        description='Complete the statement: "I am the kind of leader who..."'
                        value={identity}
                        setValue={setIdentity}
                        suggestions={identitySuggestions}
                        onSelectSuggestion={setIdentity}
                    />

                    <AnchorInputSection
                        title="2. Habit Anchor (Cue)"
                        icon={Clock}
                        description='Your daily cue: "When I..."'
                        value={habit}
                        setValue={setHabit}
                        suggestions={habitSuggestions}
                        onSelectSuggestion={setHabit}
                    />
                    
                    <AnchorInputSection
                        title="3. Your 'Why It Matters'"
                        icon={Zap}
                        description='Your core purpose: Why does this leadership journey matter to you?'
                        value={why}
                        setValue={setWhy}
                        suggestions={whySuggestions}
                        onSelectSuggestion={setWhy}
                        isTextArea={true}
                    />
                </div>

                <div className="mt-4 pt-4 border-t border-slate-200 flex gap-3">
                    <Button onClick={handleSave} variant="primary" className="flex-1">
                        <Save className="w-4 h-4 mr-2" /> Save All Anchors
                    </Button>
                    <Button onClick={onClose} variant="outline" className="flex-1">
                        Cancel
                    </Button>
                </div>
            </div>
        </div>
    );
};

export const CalendarSyncModal = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    const handleSync = (provider) => {
        alert(`Integration with ${provider} is coming soon!`);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
                <div className="flex justify-between items-center mb-6 border-b pb-4 border-slate-100">
                    <h2 className="text-xl font-bold text-corporate-navy flex items-center gap-2">
                        <Calendar className="w-6 h-6 text-corporate-teal" />
                        Calendar Integration
                    </h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-100">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                
                <p className="text-slate-600 mb-6">
                    Sync your Daily Reps and Coaching Sessions directly to your personal calendar. Never miss a beat in your leadership journey.
                </p>

                <div className="space-y-3">
                    <button 
                        onClick={() => handleSync('Google Calendar')}
                        className="w-full flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-corporate-teal hover:bg-teal-50 transition-all group"
                    >
                        <span className="font-semibold text-slate-700 group-hover:text-teal-700">Google Calendar</span>
                        <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-corporate-teal" />
                    </button>
                    
                    <button 
                        onClick={() => handleSync('Outlook')}
                        className="w-full flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-corporate-teal hover:bg-teal-50 transition-all group"
                    >
                        <span className="font-semibold text-slate-700 group-hover:text-teal-700">Outlook Calendar</span>
                        <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-corporate-teal" />
                    </button>
                    
                    <button 
                        onClick={() => handleSync('Apple Calendar')}
                        className="w-full flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-corporate-teal hover:bg-teal-50 transition-all group"
                    >
                        <span className="font-semibold text-slate-700 group-hover:text-teal-700">Apple Calendar (iCal)</span>
                        <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-corporate-teal" />
                    </button>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 text-center">
                    <p className="text-xs text-slate-400">
                        Secure one-way sync. We never read your personal events.
                    </p>
                </div>
            </div>
        </div>
    );
};

// --- Legacy Components (Kept for compatibility but refactored where easy) ---

export const ModeSwitch = ({ isArenaMode, onToggle, isLoading }) => (
  <Button
    onClick={onToggle}
    disabled={isLoading}
    variant={isArenaMode ? 'primary' : 'secondary'}
    className="flex items-center gap-2"
  >
    {isArenaMode ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
    <span>{isArenaMode ? 'Arena Mode' : 'Solo Mode'}</span>
  </Button>
);

export const StreakTracker = ({ streakCount, streakCoins, userEmail }) => {
  const isDeveloper = userEmail === 'rob@sagecg.com';
  return (
    <div className="flex items-center gap-4 px-4 py-2 rounded-lg border border-slate-200 bg-slate-50">
      <div className="flex items-center gap-2">
        <Flame className="w-5 h-5 text-corporate-orange" />
        <span className="font-bold text-lg text-corporate-navy">{streakCount}</span>
        <span className="text-sm text-slate-500">Day Streak</span>
      </div>
      {isDeveloper && (
        <>
          <div className="h-6 w-px bg-slate-300" />
          <div className="flex items-center gap-2">
            <span className="text-xl">🪙</span>
            <span className="font-bold text-lg text-corporate-navy">{streakCoins}</span>
            <span className="text-sm text-slate-500">Tokens</span>
          </div>
        </>
      )}
    </div>
  );
};

export const TabButton = ({ active, onClick, label, minimized = false }) => (
  <button
    type="button"
    aria-pressed={active}
    onClick={onClick}
    className={`flex-1 px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 relative ${
      active 
        ? 'bg-corporate-teal text-white shadow-md' 
        : 'bg-transparent text-slate-600 border-2 border-slate-200 hover:bg-slate-50'
    }`}
  >
    {label}
    {minimized && !active && (
      <span 
        className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-corporate-orange"
        title="Incomplete"
      />
    )}
  </button>
);

// ... (Other components like MorningBookend, EveningBookend are omitted for brevity as they are not used in the new Dashboard. 
// If they are needed, they should be refactored similarly. For now, I'm keeping the file clean with just the used exports and minimal legacy support.)

export const SuggestionModal = ({ title, prefix, suggestions, onSelect, onClose }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-2xl p-3 sm:p-4 lg:p-6 max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl sm:text-2xl font-bold text-corporate-navy">
          {title}
        </h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
          <X className="w-6 h-6" />
        </button>
      </div>
      <div className="overflow-y-auto flex-1 space-y-2">
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            onClick={() => onSelect(suggestion.value || suggestion.text || suggestion)}
            className="w-full text-left p-4 rounded-lg border-2 border-slate-200 transition-all hover:border-corporate-teal hover:bg-teal-50"
          >
            <p className="text-sm font-medium text-slate-700">
              {prefix} <strong>{suggestion.value || suggestion.text || suggestion}</strong>
            </p>
            {suggestion.description && (
              <p className="text-xs mt-1 text-slate-500">
                {suggestion.description}
              </p>
            )}
          </button>
        ))}
      </div>
      <div className="mt-4 pt-4 border-t border-slate-200">
        <Button onClick={onClose} variant="outline" className="w-full">
          Close
        </Button>
      </div>
    </div>
  </div>
);

export const SaveIndicator = ({ show, message = "Saved!" }) => {
  if (!show) return null;
  return (
    <div className="fixed bottom-4 right-4 z-50 animate-fade-in-up">
      <div className="bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2">
        <CheckCircle className="w-5 h-5" />
        <span className="font-semibold">{message}</span>
      </div>
    </div>
  );
};

