// src/components/admin/SalesMarketingCenter.jsx
// Sales & Marketing Center — full CRM, lead generation, marketing tools

import React, { useState, useEffect } from 'react';
import {
  Megaphone, Globe, Users,
  ShieldAlert, ExternalLink, Sparkles, BookOpen,
  FlaskConical, Brain, Zap, Presentation, Briefcase
} from 'lucide-react';
import SocialMediaManager from './SocialMediaManager';
import AssessmentLeadsManager from './AssessmentLeadsManager';
import CRMApp from './crm/CRMApp';
import { BreadcrumbNav } from '../ui/BreadcrumbNav.jsx';
import { getBreadcrumbs } from '../../config/breadcrumbConfig.js';
import { useAppServices } from '../../services/useAppServices';
import { useNavigation } from '../../providers/NavigationProvider';

const TAB_GROUPS = [
  {
    label: 'CRM',
    tabs: [
      { id: 'crm-full', label: 'CRM', icon: Sparkles, fullCRM: true },
    ],
  },
  {
    label: 'Lead Generation',
    tabs: [
      { id: 'assessment-leads', label: 'Lead Magnets', icon: Users },
    ],
  },
  {
    label: 'Social Media',
    tabs: [
      { id: 'social-media', label: 'Social Media Monitor', icon: Globe },
    ],
  },
  {
    label: 'Content',
    tabs: [
      { id: 'book-builder', label: 'Book Builder', icon: BookOpen },
    ],
  },
  {
    label: 'LeaderReps Lab',
    tabs: [
      { id: 'lab-srs', label: 'SRS Engine', icon: FlaskConical },
      { id: 'lab-account-intel', label: 'Account Intelligence', icon: Brain },
      { id: 'lab-trigger-talktrack', label: 'Trigger → Talk Track', icon: Zap },
      { id: 'lab-demo-autopilot', label: 'Demo Auto-Pilot', icon: Presentation },
      { id: 'lab-champion-kits', label: 'Champion Kits', icon: Briefcase },
    ],
  },
];

const STATUS_STYLES = {
  Live: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  Beta: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  Concept: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
};

const ExperimentCard = ({ icon: Icon, title, status, tagline, description, primaryAction, gradient }) => {
  const ActionIcon = primaryAction?.icon;
  const statusClass = STATUS_STYLES[status] || STATUS_STYLES.Concept;

  const buttonClasses = `px-6 py-3 font-semibold rounded-xl shadow-lg transition-all flex items-center gap-2 mx-auto ${
    primaryAction?.disabled
      ? 'bg-slate-300 text-slate-500 cursor-not-allowed dark:bg-slate-700 dark:text-slate-400'
      : 'bg-[#47A88D] hover:bg-[#3d9179] text-white'
  }`;

  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 py-12">
      <div className={`p-6 bg-gradient-to-br ${gradient} rounded-2xl shadow-xl`}>
        <Icon className="w-16 h-16 text-white" />
      </div>
      <div className="text-center max-w-xl">
        <div className="flex items-center justify-center gap-3 mb-3">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{title}</h2>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusClass}`}>
            {status}
          </span>
        </div>
        <p className="text-base font-medium text-slate-700 dark:text-slate-200 mb-3">
          {tagline}
        </p>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          {description}
        </p>
        {primaryAction && (
          primaryAction.href ? (
            <a
              href={primaryAction.href}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClasses}
              style={{ display: 'inline-flex' }}
            >
              {ActionIcon && <ActionIcon className="w-5 h-5" />}
              {primaryAction.label}
            </a>
          ) : (
            <button
              type="button"
              onClick={primaryAction.onClick}
              disabled={primaryAction.disabled}
              className={buttonClasses}
            >
              {ActionIcon && <ActionIcon className="w-5 h-5" />}
              {primaryAction.label}
            </button>
          )
        )}
      </div>
    </div>
  );
};

const SalesMarketingCenter = () => {
  const { user, isAdmin, navigate } = useAppServices();
  const { navParams } = useNavigation();
  const [activeTab, setActiveTab] = useState(navParams?.tab || 'crm-full');
  const [showFullCRM, setShowFullCRM] = useState(false);

  useEffect(() => {
    if (navParams?.tab) setActiveTab(navParams.tab);
  }, [navParams]);

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <ShieldAlert className="w-16 h-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold text-corporate-navy mb-2">Access Denied</h1>
      </div>
    );
  }
  
  // Show full CRM overlay
  if (showFullCRM) {
    return <CRMApp user={user} onClose={() => setShowFullCRM(false)} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'crm-full':
        return (
          <div className="flex flex-col items-center justify-center h-96 gap-6">
            <div className="p-6 bg-gradient-to-br from-[#002E47] to-[#003d5c] rounded-2xl shadow-xl">
              <Sparkles className="w-16 h-16 text-[#47A88D]" />
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                CRM
              </h2>
              <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-md">
                Full-featured CRM with Apollo integration, email automation, 
                LinkedIn outreach, analytics, and more.
              </p>
              <button
                onClick={() => setShowFullCRM(true)}
                className="px-6 py-3 bg-[#47A88D] hover:bg-[#3d9179] text-white font-semibold rounded-xl shadow-lg transition-all flex items-center gap-2 mx-auto"
              >
                <ExternalLink className="w-5 h-5" />
                Launch CRM
              </button>
            </div>
          </div>
        );
      case 'assessment-leads': 
      case 'roi-calculator-leads':
        return <AssessmentLeadsManager />;
      case 'social-media':
        return <SocialMediaManager />;
      case 'book-builder':
        return (
          <div className="flex flex-col items-center justify-center h-96 gap-6">
            <div className="p-6 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl shadow-xl">
              <BookOpen className="w-16 h-16 text-white" />
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                Book Builder
              </h2>
              <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-md">
                Create your leadership book with AI-powered drafting, source management, 
                chapter organization, and export to markdown.
              </p>
              <button
                onClick={() => navigate('book-builder')}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl shadow-lg transition-all flex items-center gap-2 mx-auto"
              >
                <BookOpen className="w-5 h-5" />
                Open Book Builder
              </button>
            </div>
          </div>
        );
      case 'lab-srs':
        return (
          <ExperimentCard
            icon={FlaskConical}
            title="SRS Engine"
            status="Live"
            tagline="Spaced Repetition System for leadership reps."
            description="Active experiment hosted on Firebase. Tests adaptive scheduling for daily leadership reps to maximize retention and behavior change. Use this engine to validate spacing intervals before rolling features into the main platform."
            primaryAction={{
              label: 'Launch SRS Engine',
              href: 'https://leaderreps-lab.web.app/',
              icon: ExternalLink,
            }}
            gradient="from-emerald-600 to-teal-600"
          />
        );
      case 'lab-account-intel':
        return (
          <ExperimentCard
            icon={Brain}
            title="Account Intelligence Engine"
            status="Concept"
            tagline="Persistent dossiers on every target account, refreshed weekly."
            description="Tracks leadership turnover, layoffs, earnings call mentions of culture/talent, Glassdoor sentiment shifts, and new VP hires across your CRM accounts. Delivers a Monday digest to reps: 'These 3 accounts had leadership changes this week — strike now.' Turns cold calls into warm calls."
            primaryAction={{
              label: 'Design Experiment',
              icon: Sparkles,
              disabled: true,
            }}
            gradient="from-blue-600 to-indigo-600"
          />
        );
      case 'lab-trigger-talktrack':
        return (
          <ExperimentCard
            icon={Zap}
            title="Trigger → Talk Track Generator"
            status="Concept"
            tagline="Auto-generate 3-touch outreach the moment a buying signal fires."
            description="When the system detects a trigger (new VP, layoff, bad earnings, 'leadership development' in a job posting), it generates a personalized email + LinkedIn message + call script referencing the specific trigger. Reps just click Send or Edit. Flips the 70/30 research-to-selling ratio."
            primaryAction={{
              label: 'Design Experiment',
              icon: Sparkles,
              disabled: true,
            }}
            gradient="from-amber-500 to-orange-600"
          />
        );
      case 'lab-demo-autopilot':
        return (
          <ExperimentCard
            icon={Presentation}
            title="Demo Auto-Pilot"
            status="Concept"
            tagline="Live ROI calculator + guided discovery during the sales call."
            description="A guided discovery tool reps use during Zoom calls. Asks the prospect 5 questions live → generates a custom 'Leadership ROI Projection' with their company's specific numbers (turnover cost, missed promotion cost) → emailed to them before the call ends. Wires into the existing roi-calculator/ workspace."
            primaryAction={{
              label: 'Design Experiment',
              icon: Sparkles,
              disabled: true,
            }}
            gradient="from-pink-500 to-rose-600"
          />
        );
      case 'lab-champion-kits':
        return (
          <ExperimentCard
            icon={Briefcase}
            title="Champion Enablement Kits"
            status="Concept"
            tagline="The 'Internal Sale' tool — arm your champion to close for you."
            description="Generates a personalized board deck PDF for each prospect: their company logo, named pain points from discovery, peer benchmarks, and custom pricing. The champion forwards it to their CFO. Solves the #1 reason enterprise deals stall — 'I need to get buy-in.' Hand them the buy-in."
            primaryAction={{
              label: 'Design Experiment',
              icon: Sparkles,
              disabled: true,
            }}
            gradient="from-violet-600 to-purple-700"
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col">
      <div className="px-6 pt-4 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <BreadcrumbNav
          items={getBreadcrumbs('marketing-center')}
          navigate={navigate}
        />
      </div>

      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
            <Megaphone className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-corporate-navy dark:text-white">
              Sales & Marketing
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-56 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 overflow-y-auto flex-shrink-0">
          <div className="p-3 space-y-4">
            {TAB_GROUPS.map((group) => (
              <div key={group.label}>
                <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  {group.label}
                </div>
                <div className="space-y-0.5 mt-1">
                  {group.tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`
                          w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                          ${isActive
                            ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}
                        `}
                      >
                        <Icon className={`w-4 h-4 ${isActive ? 'text-purple-600 dark:text-purple-400' : 'text-slate-400'}`} />
                        {tab.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default SalesMarketingCenter;
