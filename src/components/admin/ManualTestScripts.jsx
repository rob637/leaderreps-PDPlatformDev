/**
 * ManualTestScripts - Manual Test Scripts Hub
 * 
 * Provides access to all manual test scripts organized by phase/category:
 * - Smoke Test (Critical Path)
 * - Prep Phase
 * - Dev Phase AM Bookend
 * - Dev Phase PM Bookend
 * - Content Library
 * - Post Phase
 * - Authentication
 * 
 * Features:
 * - View test scripts inline
 * - Track test progress
 * - Log bugs to GitHub Issues
 * - Export test results
 */

import React, { useState } from 'react';
import { 
  FileText, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  ChevronRight,
  ChevronDown,
  Flame,
  Sun,
  Moon,
  Library,
  GraduationCap,
  Shield,
  UserPlus,
  ExternalLink,
  Clock,
  Target,
  Download
} from 'lucide-react';

// Test script metadata
const TEST_SCRIPTS = [
  {
    id: 'smoke-test',
    name: 'Critical Path Smoke Test',
    icon: Flame,
    file: '00-smoke-test.md',
    scenarios: 36,
    time: '3-4 hours',
    priority: 'Critical',
    description: 'Run before EVERY deployment. Tests core user journey end-to-end.',
    color: 'red'
  },
  {
    id: 'prep-phase',
    name: 'Prep Phase Tests',
    icon: UserPlus,
    file: '01-prep-phase.md',
    scenarios: 14,
    time: '2-3 hours',
    priority: 'High',
    description: 'New user registration, prep gate, leader profile, baseline assessment.',
    color: 'purple'
  },
  {
    id: 'am-bookend',
    name: 'AM Bookend Tests',
    icon: Sun,
    file: '02-dev-am-bookend.md',
    scenarios: 20,
    time: '2-3 hours',
    priority: 'High',
    description: 'Grounding Rep, Win the Day, Daily Reps, Scorecard.',
    color: 'amber'
  },
  {
    id: 'pm-bookend',
    name: 'PM Bookend Tests',
    icon: Moon,
    file: '03-dev-pm-bookend.md',
    scenarios: 18,
    time: '2 hours',
    priority: 'High',
    description: 'Win Review, Reflection (Good/Better/Best), Daily completion.',
    color: 'indigo'
  },
  {
    id: 'content-library',
    name: 'Content Library Tests',
    icon: Library,
    file: '04-content-library.md',
    scenarios: 22,
    time: '2-3 hours',
    priority: 'High',
    description: 'Video playback, readings, tools, filters, search, content gating.',
    color: 'blue'
  },
  {
    id: 'post-phase',
    name: 'Post Phase Tests',
    icon: GraduationCap,
    file: '05-post-phase.md',
    scenarios: 12,
    time: '1-2 hours',
    priority: 'Medium',
    description: 'Day 70→71 transition, full content access, continued practice.',
    color: 'green'
  },
  {
    id: 'authentication',
    name: 'Authentication Tests',
    icon: Shield,
    file: '06-authentication.md',
    scenarios: 16,
    time: '1-2 hours',
    priority: 'High',
    description: 'Login, logout, signup, password reset, protected routes.',
    color: 'gray'
  }
];

// Priority badge colors
const getPriorityColor = (priority) => {
  switch (priority) {
    case 'Critical': return 'bg-red-100 text-red-700 border-red-200';
    case 'High': return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'Medium': return 'bg-blue-100 text-blue-700 border-blue-200';
    default: return 'bg-gray-100 text-gray-700 border-gray-200';
  }
};

// Color to Tailwind class mapping
const getColorClasses = (color) => {
  const colors = {
    red: { bg: 'bg-red-50', border: 'border-red-200', icon: 'text-red-500', hover: 'hover:bg-red-100' },
    purple: { bg: 'bg-purple-50', border: 'border-purple-200', icon: 'text-purple-500', hover: 'hover:bg-purple-100' },
    amber: { bg: 'bg-amber-50', border: 'border-amber-200', icon: 'text-amber-500', hover: 'hover:bg-amber-100' },
    indigo: { bg: 'bg-indigo-50', border: 'border-indigo-200', icon: 'text-indigo-500', hover: 'hover:bg-indigo-100' },
    blue: { bg: 'bg-blue-50', border: 'border-blue-200', icon: 'text-blue-500', hover: 'hover:bg-blue-100' },
    green: { bg: 'bg-green-50', border: 'border-green-200', icon: 'text-green-500', hover: 'hover:bg-green-100' },
    gray: { bg: 'bg-gray-50', border: 'border-gray-200', icon: 'text-gray-500', hover: 'hover:bg-gray-100' }
  };
  return colors[color] || colors.gray;
};

const ManualTestScripts = () => {
  const [expandedScript, setExpandedScript] = useState(null);
  
  // Calculate totals
  const totalScenarios = TEST_SCRIPTS.reduce((sum, script) => sum + script.scenarios, 0);
  
  const openTestScript = (filename) => {
    // For now, link to GitHub. In production, could open in-app viewer
    const baseUrl = 'https://github.com/rob637/leaderreps-PDPlatformDev/blob/main/test-scripts/';
    window.open(baseUrl + filename, '_blank');
  };
  
  const openGitHubIssues = () => {
    window.open('https://github.com/rob637/leaderreps-PDPlatformDev/issues/new?labels=bug&template=bug_report.md', '_blank');
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-corporate-navy font-serif flex items-center gap-2">
            <FileText className="w-6 h-6 text-corporate-teal" />
            Manual Test Scripts
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Comprehensive test scenarios for QA execution
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={openGitHubIssues}
            className="px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors flex items-center gap-2"
          >
            <AlertTriangle className="w-4 h-4" />
            Report Bug
          </button>
        </div>
      </div>
      
      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-2xl font-bold text-corporate-navy">{TEST_SCRIPTS.length}</div>
          <div className="text-sm text-gray-500">Test Suites</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-2xl font-bold text-corporate-teal">{totalScenarios}</div>
          <div className="text-sm text-gray-500">Total Scenarios</div>
        </div>
        <div className="bg-red-50 rounded-xl border border-red-200 p-4">
          <div className="text-2xl font-bold text-red-600">36</div>
          <div className="text-sm text-red-700">Critical Path</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-2xl font-bold text-gray-600">~16 hrs</div>
          <div className="text-sm text-gray-500">Full Suite Time</div>
        </div>
      </div>
      
      {/* Quick Start Guide */}
      <div className="bg-gradient-to-br from-corporate-navy to-corporate-navy/90 rounded-xl p-6 text-white">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Target className="w-5 h-5" />
          Quick Start Guide
        </h3>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="bg-white/10 rounded-lg p-4">
            <div className="font-bold text-amber-300 mb-2">Before Deployment</div>
            <p className="opacity-90">Run the Smoke Test (36 scenarios) to validate core functionality before any release.</p>
          </div>
          <div className="bg-white/10 rounded-lg p-4">
            <div className="font-bold text-green-300 mb-2">Full Regression</div>
            <p className="opacity-90">Run all suites quarterly or after major changes. Takes ~16 hours total.</p>
          </div>
          <div className="bg-white/10 rounded-lg p-4">
            <div className="font-bold text-blue-300 mb-2">Bug Found?</div>
            <p className="opacity-90">Click "Report Bug" above to create a GitHub Issue with test scenario details.</p>
          </div>
        </div>
      </div>
      
      {/* Test Scripts List */}
      <div className="space-y-4">
        {TEST_SCRIPTS.map(script => {
          const IconComponent = script.icon;
          const colorClasses = getColorClasses(script.color);
          const isExpanded = expandedScript === script.id;
          
          return (
            <div 
              key={script.id} 
              className={`bg-white rounded-xl border border-gray-200 overflow-hidden transition-all
                ${isExpanded ? 'ring-2 ring-corporate-teal/50' : ''}`}
            >
              {/* Script Header */}
              <div 
                className={`px-5 py-4 flex items-center justify-between cursor-pointer ${colorClasses.hover} transition-colors`}
                onClick={() => setExpandedScript(isExpanded ? null : script.id)}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${colorClasses.bg} ${colorClasses.border} border`}>
                    <IconComponent className={`w-6 h-6 ${colorClasses.icon}`} />
                  </div>
                  <div>
                    <div className="font-bold text-corporate-navy text-lg">{script.name}</div>
                    <div className="text-sm text-gray-500 mt-0.5">{script.description}</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  {/* Stats */}
                  <div className="flex items-center gap-4 text-sm">
                    <span className={`px-2 py-1 rounded border font-medium ${getPriorityColor(script.priority)}`}>
                      {script.priority}
                    </span>
                    <span className="text-gray-600 font-medium">
                      {script.scenarios} scenarios
                    </span>
                    <span className="text-gray-400 flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {script.time}
                    </span>
                  </div>
                  
                  {isExpanded ? (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              </div>
              
              {/* Expanded Content */}
              {isExpanded && (
                <div className={`border-t border-gray-200 px-5 py-4 ${colorClasses.bg}`}>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      <strong>File:</strong> <code className="bg-white/50 px-2 py-1 rounded">{script.file}</code>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => openTestScript(script.file)}
                        className="px-4 py-2 bg-corporate-teal text-white rounded-lg font-medium hover:bg-corporate-teal/90 transition-colors flex items-center gap-2"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Open Test Script
                      </button>
                    </div>
                  </div>
                  
                  {/* Test Categories Preview */}
                  {script.id === 'smoke-test' && (
                    <div className="mt-4 grid grid-cols-3 gap-3">
                      <div className="bg-white/80 rounded-lg p-3 text-sm">
                        <div className="font-medium text-gray-700">Authentication</div>
                        <div className="text-gray-500">6 scenarios</div>
                      </div>
                      <div className="bg-white/80 rounded-lg p-3 text-sm">
                        <div className="font-medium text-gray-700">Prep Phase</div>
                        <div className="text-gray-500">5 scenarios</div>
                      </div>
                      <div className="bg-white/80 rounded-lg p-3 text-sm">
                        <div className="font-medium text-gray-700">Day 1 + AM Bookend</div>
                        <div className="text-gray-500">10 scenarios</div>
                      </div>
                      <div className="bg-white/80 rounded-lg p-3 text-sm">
                        <div className="font-medium text-gray-700">PM Bookend</div>
                        <div className="text-gray-500">7 scenarios</div>
                      </div>
                      <div className="bg-white/80 rounded-lg p-3 text-sm">
                        <div className="font-medium text-gray-700">Content + Plan</div>
                        <div className="text-gray-500">5 scenarios</div>
                      </div>
                      <div className="bg-white/80 rounded-lg p-3 text-sm">
                        <div className="font-medium text-gray-700">Post Phase</div>
                        <div className="text-gray-500">3 scenarios</div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* GitHub Labels Reference */}
      <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
        <h3 className="font-bold text-corporate-navy mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-500" />
          Bug Reporting Labels
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          When creating a GitHub Issue for a bug, use these labels:
        </p>
        <div className="flex flex-wrap gap-2">
          <span className="px-3 py-1 bg-red-500 text-white text-sm rounded-full">bug/critical</span>
          <span className="px-3 py-1 bg-orange-500 text-white text-sm rounded-full">bug/high</span>
          <span className="px-3 py-1 bg-yellow-500 text-white text-sm rounded-full">bug/medium</span>
          <span className="px-3 py-1 bg-purple-500 text-white text-sm rounded-full">area/prep</span>
          <span className="px-3 py-1 bg-amber-500 text-white text-sm rounded-full">area/am-bookend</span>
          <span className="px-3 py-1 bg-indigo-500 text-white text-sm rounded-full">area/pm-bookend</span>
          <span className="px-3 py-1 bg-blue-500 text-white text-sm rounded-full">area/content</span>
          <span className="px-3 py-1 bg-green-500 text-white text-sm rounded-full">area/post</span>
          <span className="px-3 py-1 bg-gray-500 text-white text-sm rounded-full">area/auth</span>
        </div>
      </div>
      
      {/* Recommended Test Order */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h3 className="font-bold text-corporate-navy mb-4">Recommended Test Order</h3>
        <ol className="space-y-3 text-sm">
          <li className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-red-100 text-red-700 flex items-center justify-center font-bold text-xs shrink-0">1</span>
            <div>
              <strong>Smoke Test</strong> - Always run first to catch critical issues
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs shrink-0">2</span>
            <div>
              <strong>Authentication</strong> - Ensure users can access the system
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0">3</span>
            <div>
              <strong>Prep Phase</strong> - Test new user onboarding journey
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs shrink-0">4</span>
            <div>
              <strong>AM Bookend</strong> - Core morning activities
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">5</span>
            <div>
              <strong>PM Bookend</strong> - Evening wrap-up activities
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-cyan-100 text-cyan-700 flex items-center justify-center font-bold text-xs shrink-0">6</span>
            <div>
              <strong>Content Library</strong> - Media playback and content access
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold text-xs shrink-0">7</span>
            <div>
              <strong>Post Phase</strong> - Program completion and ongoing access
            </div>
          </li>
        </ol>
      </div>
    </div>
  );
};

export default ManualTestScripts;
