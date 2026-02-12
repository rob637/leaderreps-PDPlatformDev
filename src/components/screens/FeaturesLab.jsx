// src/components/screens/FeaturesLab.jsx

import React, { useState, useEffect } from 'react';
import { 
  Beaker, 
  Zap, 
  MessageSquare, 
  Video, 
  Users, 
  Mic, 
  BookOpen, 
  BarChart3, 
  ToggleLeft, 
  ToggleRight,
  Info,
  AlertTriangle,
  ArrowLeft
} from 'lucide-react';
import { useAppServices } from '../../services/useAppServices.jsx';
import { Button } from '../ui';

// Feature Categories
const CATEGORIES = {
  CONTENT: 'Content',
  COMMUNITY: 'Community',
  COACHING: 'Coaching'
};

// Feature Definitions
const FEATURES = [
  // --- CONTENT ---
  {
    id: 'content_smart_summaries',
    category: CATEGORIES.CONTENT,
    title: 'Smart Summaries',
    description: 'AI-generated key takeaways for long articles and videos.',
    icon: Zap,
    status: 'beta'
  },
  {
    id: 'content_audio_mode',
    category: CATEGORIES.CONTENT,
    title: 'Audio Mode',
    description: 'Text-to-speech player for all reading materials.',
    icon: Mic,
    status: 'alpha'
  },
  {
    id: 'content_speed_reader',
    category: CATEGORIES.CONTENT,
    title: 'Speed Reader',
    description: 'Bionic reading mode highlighting first letters for faster consumption.',
    icon: BookOpen,
    status: 'concept'
  },
  {
    id: 'content_deep_dives',
    category: CATEGORIES.CONTENT,
    title: 'Related Deep Dives',
    description: 'AI-suggested academic papers and case studies linked to current topics.',
    icon: BookOpen,
    status: 'concept'
  },
  {
    id: 'content_clipper',
    category: CATEGORIES.CONTENT,
    title: 'Content Clipper',
    description: 'Save external URLs to your personal library for later reading.',
    icon: BookOpen,
    status: 'concept'
  },

  // --- COMMUNITY ---
  {
    id: 'community_icebreakers',
    category: CATEGORIES.COMMUNITY,
    title: 'Icebreaker Generator',
    description: 'AI suggests daily discussion prompts to spark team engagement.',
    icon: MessageSquare,
    status: 'beta'
  },
  {
    id: 'community_peer_match',
    category: CATEGORIES.COMMUNITY,
    title: 'Peer Match Beta',
    description: 'Random coffee chat matching with other leaders in your tier.',
    icon: Users,
    status: 'alpha'
  },
  {
    id: 'community_sentiment',
    category: CATEGORIES.COMMUNITY,
    title: 'Sentiment Pulse',
    description: 'Anonymous team mood tracking and trend analysis.',
    icon: BarChart3,
    status: 'concept'
  },
  {
    id: 'community_kudos',
    category: CATEGORIES.COMMUNITY,
    title: 'Kudos Board',
    description: 'Public recognition feed for celebrating small wins.',
    icon: Users,
    status: 'concept'
  },
  {
    id: 'community_expert_ama',
    category: CATEGORIES.COMMUNITY,
    title: 'Expert AMA',
    description: '"Ask Me Anything" module with industry experts.',
    icon: Video,
    status: 'concept'
  },

  // --- COACHING ---
  {
    id: 'coaching_voice_input',
    category: CATEGORIES.COACHING,
    title: 'Voice Input',
    description: 'Speech-to-text for hands-free role-play sessions.',
    icon: Mic,
    status: 'beta'
  },
  {
    id: 'coaching_tone_analyzer',
    category: CATEGORIES.COACHING,
    title: 'Tone Analyzer',
    description: 'Real-time sentiment analysis of your replies during role-play.',
    icon: BarChart3,
    status: 'alpha'
  },
  {
    id: 'coaching_persona_creator',
    category: CATEGORIES.COACHING,
    title: 'Persona Creator',
    description: 'Advanced custom persona builder with specific behavioral traits.',
    icon: Users,
    status: 'beta'
  },
  {
    id: 'coaching_session_replay',
    category: CATEGORIES.COACHING,
    title: 'Session Replay',
    description: 'Visual playback of chat history to review conversation flow.',
    icon: Video,
    status: 'concept'
  },
  {
    id: 'coaching_instant_feedback',
    category: CATEGORIES.COACHING,
    title: 'Instant Feedback',
    description: 'Real-time AI hints and suggestions while you type.',
    icon: Zap,
    status: 'alpha'
  }
];

const FeaturesLab = () => {
  const { navigate } = useAppServices();
  const [featureFlags, setFeatureFlags] = useState({});

  // Load flags from localStorage on mount
  useEffect(() => {
    const storedFlags = localStorage.getItem('arena_feature_flags');
    if (storedFlags) {
      setFeatureFlags(JSON.parse(storedFlags));
    }
  }, []);

  // Save flags to localStorage whenever they change
  const toggleFeature = (featureId) => {
    const newFlags = {
      ...featureFlags,
      [featureId]: !featureFlags[featureId]
    };
    setFeatureFlags(newFlags);
    localStorage.setItem('arena_feature_flags', JSON.stringify(newFlags));
    
    // Dispatch event for other components to listen
    window.dispatchEvent(new CustomEvent('featureFlagsUpdated', { detail: newFlags }));
  };

  const renderFeatureCard = (feature) => {
    const isEnabled = featureFlags[feature.id] || false;
    const Icon = feature.icon;

    return (
      <div 
        key={feature.id} 
        className={`p-4 rounded-xl border transition-all duration-200 ${
          isEnabled 
            ? 'bg-white dark:bg-slate-800 border-corporate-teal shadow-md' 
            : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 opacity-75 hover:opacity-100'
        }`}
      >
        <div className="flex justify-between items-start mb-3">
          <div className={`p-2 rounded-lg ${isEnabled ? 'bg-teal-100 dark:bg-teal-900/30 text-teal-700' : 'bg-slate-200 text-slate-500 dark:text-slate-400'}`}>
            <Icon className="w-6 h-6" />
          </div>
          <button 
            onClick={() => toggleFeature(feature.id)}
            className={`transition-colors ${isEnabled ? 'text-corporate-teal' : 'text-slate-400'}`}
          >
            {isEnabled ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8" />}
          </button>
        </div>
        
        <h3 className="font-bold text-corporate-navy mb-1">{feature.title}</h3>
        <p className="text-sm text-slate-600 dark:text-slate-300 mb-3 min-h-[40px]">{feature.description}</p>
        
        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wider ${
            feature.status === 'beta' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700' :
            feature.status === 'alpha' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700' :
            'bg-slate-200 text-slate-600 dark:text-slate-300'
          }`}>
            {feature.status}
          </span>
          {isEnabled && (
            <span className="text-xs font-bold text-corporate-teal flex items-center gap-1">
              <Zap className="w-3 h-3" /> Active
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-800 p-6 md:p-10 animate-fade-in">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="space-y-4">
          <Button onClick={() => navigate('app-settings')} variant="nav-back" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Settings
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-corporate-navy rounded-xl text-white shadow-lg">
              <Beaker className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-corporate-navy">Features Lab</h1>
              <p className="text-slate-500 dark:text-slate-400">Experimental features playground. Toggle features to test functionality without impacting the main application.</p>
            </div>
          </div>
          
          <div className="bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-400 p-4 rounded-r-xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
            <div>
              <p className="font-bold text-amber-800">Experimental Zone</p>
              <p className="text-sm text-amber-700">
                Features enabled here are stored locally in your browser. They may be incomplete, unstable, or change without notice. 
                Use at your own risk for testing purposes.
              </p>
            </div>
          </div>
        </header>

        {/* Categories */}
        {Object.values(CATEGORIES).map(category => (
          <section key={category} className="space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
              <h2 className="text-xl font-bold text-corporate-navy">{category} Experiments</h2>
              <span className="bg-slate-200 text-slate-600 dark:text-slate-300 text-xs font-bold px-2 py-1 rounded-full">
                {FEATURES.filter(f => f.category === category).length}
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {FEATURES.filter(f => f.category === category).map(renderFeatureCard)}
            </div>
          </section>
        ))}

      </div>
    </div>
  );
};

export default FeaturesLab;
