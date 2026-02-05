import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Linkedin, Mail, Target, GitMerge, Presentation, BarChart3,
  Calendar, BrainCircuit, Zap, Users, FileText, Search,
  ArrowRight, Sparkles
} from 'lucide-react';

/**
 * FeatureDiscovery - Dripify-inspired feature grid
 * 
 * A visual grid showing all platform capabilities with icons,
 * descriptions, and quick-start links. Organized like Dripify's
 * dropdown menu but as persistent cards.
 */

const FEATURES = [
  {
    category: 'Lead Generation',
    items: [
      {
        id: 'prospects',
        title: 'Prospect Finder',
        description: 'Build targeted lists of qualified B2B leads',
        icon: Search,
        link: '/sales/prospects',
        badge: 'Sales Nav',
        color: 'blue'
      },
      {
        id: 'outreach',
        title: 'Automated Outreach',
        description: 'Connect and engage with your target audience on complete autopilot',
        icon: Linkedin,
        link: '/sales/outreach',
        badge: 'LinkedIn',
        color: 'blue'
      },
      {
        id: 'sequences',
        title: 'Drip Campaigns',
        description: 'Build smart sequences using email actions, delays, and conditions',
        icon: GitMerge,
        link: '/sales/sequences',
        color: 'fuchsia'
      },
      {
        id: 'enrich',
        title: 'Enrich Leads',
        description: 'Arm yourself with extensive lists of qualified B2B leads',
        icon: Users,
        link: '/sales/prospects',
        color: 'indigo'
      }
    ]
  },
  {
    category: 'Engagement',
    items: [
      {
        id: 'email',
        title: 'Email Outreach',
        description: 'Send high-converting personalized emails with automated sequences',
        icon: Mail,
        link: '/marketing/email-health',
        color: 'purple'
      },
      {
        id: 'demos',
        title: 'Demo Center',
        description: 'Create shareable demos and track engagement in real-time',
        icon: Presentation,
        link: '/sales/demos',
        badge: 'AI',
        color: 'emerald'
      },
      {
        id: 'proposals',
        title: 'Proposal Builder',
        description: 'Generate professional proposals with ROI calculators',
        icon: FileText,
        link: '/sales/proposals',
        color: 'orange'
      }
    ]
  },
  {
    category: 'Intelligence',
    items: [
      {
        id: 'analytics',
        title: 'Performance Analytics',
        description: 'Track and evaluate campaign performance and conversion rates',
        icon: BarChart3,
        link: '/analytics/leaders',
        color: 'cyan'
      },
      {
        id: 'ai-coach',
        title: 'AI Coach Tuner',
        description: 'Customize AI responses with psychology-backed frameworks',
        icon: BrainCircuit,
        link: '/coaching/ai',
        badge: 'New',
        color: 'violet'
      },
      {
        id: 'scheduler',
        title: 'Smart Scheduler',
        description: 'Automated booking with calendar sync and timezone detection',
        icon: Calendar,
        link: '/ops/scheduler',
        badge: 'Calendly',
        color: 'rose'
      }
    ]
  }
];

const colorMap = {
  blue: { bg: 'bg-blue-50', text: 'text-blue-600', hover: 'hover:bg-blue-100' },
  fuchsia: { bg: 'bg-fuchsia-50', text: 'text-fuchsia-600', hover: 'hover:bg-fuchsia-100' },
  purple: { bg: 'bg-purple-50', text: 'text-purple-600', hover: 'hover:bg-purple-100' },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', hover: 'hover:bg-emerald-100' },
  orange: { bg: 'bg-orange-50', text: 'text-orange-600', hover: 'hover:bg-orange-100' },
  indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', hover: 'hover:bg-indigo-100' },
  cyan: { bg: 'bg-cyan-50', text: 'text-cyan-600', hover: 'hover:bg-cyan-100' },
  violet: { bg: 'bg-violet-50', text: 'text-violet-600', hover: 'hover:bg-violet-100' },
  rose: { bg: 'bg-rose-50', text: 'text-rose-600', hover: 'hover:bg-rose-100' }
};

const FeatureDiscovery = ({ compact = false }) => {
  if (compact) {
    // Compact version for sidebars/dropdowns
    return (
      <div className="grid grid-cols-2 gap-3 p-4">
        {FEATURES.flatMap(cat => cat.items).slice(0, 6).map(feature => {
          const colors = colorMap[feature.color];
          const Icon = feature.icon;
          return (
            <Link
              key={feature.id}
              to={feature.link}
              className={`flex items-center gap-3 p-3 rounded-lg ${colors.bg} ${colors.hover} transition-colors`}
            >
              <Icon className={`w-5 h-5 ${colors.text}`} />
              <span className="text-sm font-medium text-slate-700">{feature.title}</span>
            </Link>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {FEATURES.map(category => (
        <div key={category.category}>
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            {category.category}
            <div className="flex-1 h-px bg-slate-200"></div>
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {category.items.map(feature => {
              const colors = colorMap[feature.color];
              const Icon = feature.icon;
              
              return (
                <Link
                  key={feature.id}
                  to={feature.link}
                  className={`group bg-white rounded-xl border border-slate-200 p-5 hover:shadow-lg hover:border-slate-300 transition-all`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl ${colors.bg} group-hover:scale-110 transition-transform`}>
                      <Icon className={`w-6 h-6 ${colors.text}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-slate-800 group-hover:text-corporate-navy transition-colors">
                          {feature.title}
                        </h4>
                        {feature.badge && (
                          <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                            feature.badge === 'New' 
                              ? 'bg-emerald-100 text-emerald-700' 
                              : 'bg-slate-100 text-slate-500'
                          }`}>
                            {feature.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-500 leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end">
                    <span className={`text-xs font-semibold ${colors.text} flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity`}>
                      Get Started <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
      
      {/* See All Features Link */}
      <div className="text-center pt-4">
        <button className="inline-flex items-center gap-2 text-corporate-teal font-semibold hover:underline">
          <Sparkles className="w-4 h-4" />
          See all features
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default FeatureDiscovery;
