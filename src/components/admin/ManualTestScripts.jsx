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
 * - Zones
 * 
 * Features:
 * - View test scripts inline
 * - Track test progress
 * - Log bugs to GitHub Issues
 * - Export test results
 * 
 * NOTE: Test counts come from testSuiteConfig.js - single source of truth
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
  Download,
  Map,
  Zap
} from 'lucide-react';
import {
  MANUAL_TEST_SCRIPTS,
  MANUAL_TEST_ORDER,
  MANUAL_TOTAL_SCENARIOS,
  MANUAL_CRITICAL_PATH,
  MANUAL_SUITE_COUNT,
  E2E_SUITES_TOTAL,
  E2E_JOURNEYS_TOTAL,
  MANUAL_TEST_SUITES,
  SUITE_ORDER,
  E2E_JOURNEY_TESTS,
  JOURNEY_ORDER,
  SMOKE_TEST,
  MANUAL_TOTAL,
  E2E_SUITE_TOTAL,
  E2E_JOURNEY_TOTAL,
  SUITE_AUTOMATION_PERCENT
} from './testSuiteConfig';

// Icon mapping
const ICON_MAP = {
  Flame,
  UserPlus,
  Sun,
  Moon,
  Library,
  GraduationCap,
  Shield,
  Target,
  Map
};

// Convert config to array in recommended order
const TEST_SCRIPTS = MANUAL_TEST_ORDER.map(key => ({
  ...MANUAL_TEST_SCRIPTS[key],
  icon: ICON_MAP[MANUAL_TEST_SCRIPTS[key].icon] || Target
}));

// Priority badge colors
const getPriorityColor = (priority) => {
  switch (priority) {
    case 'Critical': return 'bg-red-100 dark:bg-red-900/30 text-red-700 border-red-200 dark:border-red-800';
    case 'High': return 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 border-amber-200 dark:border-amber-800';
    case 'Medium': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 border-blue-200 dark:border-blue-800';
    default: return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-700';
  }
};

// Color to Tailwind class mapping
const getColorClasses = (color) => {
  const colors = {
    red: { bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-200 dark:border-red-800', icon: 'text-red-500', hover: 'hover:bg-red-100' },
    purple: { bg: 'bg-purple-50 dark:bg-purple-900/20', border: 'border-purple-200 dark:border-purple-800', icon: 'text-purple-500', hover: 'hover:bg-purple-100' },
    amber: { bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-200 dark:border-amber-800', icon: 'text-amber-500', hover: 'hover:bg-amber-100' },
    indigo: { bg: 'bg-indigo-50 dark:bg-indigo-900/20', border: 'border-indigo-200 dark:border-indigo-800', icon: 'text-indigo-500', hover: 'hover:bg-indigo-100' },
    blue: { bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-800', icon: 'text-blue-500', hover: 'hover:bg-blue-100' },
    green: { bg: 'bg-green-50 dark:bg-green-900/20', border: 'border-green-200 dark:border-green-800', icon: 'text-green-500', hover: 'hover:bg-green-100' },
    gray: { bg: 'bg-gray-50 dark:bg-gray-800', border: 'border-gray-200 dark:border-gray-700', icon: 'text-gray-500 dark:text-gray-400', hover: 'hover:bg-gray-100' },
    teal: { bg: 'bg-teal-50 dark:bg-teal-900/20', border: 'border-teal-200 dark:border-teal-800', icon: 'text-teal-500', hover: 'hover:bg-teal-100' }
  };
  return colors[color] || colors.gray;
};

const ManualTestScripts = () => {
  const [expandedScript, setExpandedScript] = useState(null);
  
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
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
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
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="text-2xl font-bold text-corporate-navy">{MANUAL_SUITE_COUNT}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Test Suites</div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="text-2xl font-bold text-corporate-teal">{MANUAL_TOTAL}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Unique Scenarios</div>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800 p-4">
          <div className="text-2xl font-bold text-red-600">{SMOKE_TEST.manualCount}</div>
          <div className="text-sm text-red-700">Smoke (Subset)</div>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800 p-4">
          <div className="text-2xl font-bold text-green-600">{SUITE_AUTOMATION_PERCENT}%</div>
          <div className="text-sm text-green-700">Automated</div>
        </div>
      </div>
      
      {/* Test Coverage - Clean Layout */}
      <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
        <div className="bg-gradient-to-r from-corporate-navy to-corporate-navy/90 px-4 py-3">
          <h4 className="font-bold text-white flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Test Coverage at a Glance
          </h4>
        </div>
        
        <div className="p-4 space-y-4">
          {/* Manual vs E2E Suite Comparison */}
          <div className="grid grid-cols-2 gap-4">
            {/* Manual Tests */}
            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4 border border-amber-200 dark:border-amber-800">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-5 h-5 text-amber-600" />
                <span className="font-bold text-gray-800 dark:text-gray-200">Manual Test Scripts</span>
              </div>
              <div className="text-4xl font-bold text-amber-600 mb-1">{MANUAL_TOTAL}</div>
              <div className="text-sm text-gray-600 dark:text-gray-300">unique scenarios in {MANUAL_SUITE_COUNT} suites</div>
              <div className="mt-3 pt-3 border-t border-amber-200 dark:border-amber-800">
                <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                  {SUITE_ORDER.map(key => (
                    <div key={key} className="flex justify-between">
                      <span>{MANUAL_TEST_SUITES[key].name}</span>
                      <span className="font-medium">{MANUAL_TEST_SUITES[key].manualCount}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* E2E Suite Tests */}
            <div className="bg-teal-50 dark:bg-teal-900/20 rounded-lg p-4 border border-teal-200 dark:border-teal-800">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-5 h-5 text-corporate-teal" />
                <span className="font-bold text-gray-800 dark:text-gray-200">E2E Suite Tests</span>
              </div>
              <div className="text-4xl font-bold text-corporate-teal mb-1">{E2E_SUITE_TOTAL}</div>
              <div className="text-sm text-gray-600 dark:text-gray-300">automated (1:1 with manual)</div>
              <div className="mt-3 pt-3 border-t border-teal-200 dark:border-teal-800">
                <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                  {SUITE_ORDER.map(key => (
                    <div key={key} className="flex justify-between">
                      <span>{MANUAL_TEST_SUITES[key].name}</span>
                      <span className={`font-medium ${MANUAL_TEST_SUITES[key].e2eCount >= MANUAL_TEST_SUITES[key].manualCount ? 'text-green-600' : 'text-amber-600'}`}>
                        {MANUAL_TEST_SUITES[key].e2eCount}
                        {MANUAL_TEST_SUITES[key].e2eCount !== MANUAL_TEST_SUITES[key].manualCount && (
                          <span className="text-gray-400 ml-1">
                            ({MANUAL_TEST_SUITES[key].e2eCount > MANUAL_TEST_SUITES[key].manualCount ? '+' : ''}{MANUAL_TEST_SUITES[key].e2eCount - MANUAL_TEST_SUITES[key].manualCount})
                          </span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          {/* Journey Tests */}
          <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-4 border border-indigo-200 dark:border-indigo-800">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Map className="w-5 h-5 text-indigo-600" />
                <span className="font-bold text-gray-800 dark:text-gray-200">E2E Journey Tests</span>
                <span className="text-xs bg-indigo-200 text-indigo-700 px-2 py-0.5 rounded">Additional Coverage</span>
              </div>
              <div className="text-2xl font-bold text-indigo-600">{E2E_JOURNEY_TOTAL}</div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
              Extended multi-step flows testing complete user journeys. These are <strong>additional</strong> to suite tests.
            </p>
            <div className="grid grid-cols-5 gap-2 text-xs">
              {JOURNEY_ORDER.map(key => (
                <div key={key} className="bg-white dark:bg-slate-800 rounded p-2 text-center border border-indigo-100">
                  <div className="font-bold text-indigo-600">{E2E_JOURNEY_TESTS[key].count}</div>
                  <div className="text-gray-500 dark:text-gray-400 truncate">{E2E_JOURNEY_TESTS[key].name}</div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Smoke Test Explanation */}
          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-800">
            <div className="flex items-center gap-2 mb-2">
              <Flame className="w-5 h-5 text-red-500" />
              <span className="font-bold text-gray-800 dark:text-gray-200">Smoke Test</span>
              <span className="text-xs bg-red-200 text-red-700 px-2 py-0.5 rounded">Pre-Deployment</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              <strong>{SMOKE_TEST.manualCount} key scenarios</strong> selected from the {MANUAL_TOTAL} above. 
              This is a curated checklist for quick validation before deployment—<em>not additional tests</em>.
            </p>
          </div>
        </div>
      </div>
      
      {/* Quick Start Guide */}
      <div className="bg-gradient-to-br from-corporate-navy to-corporate-navy/90 rounded-xl p-6 text-white">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Target className="w-5 h-5" />
          Quick Start Guide
        </h3>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="bg-white/10 dark:bg-slate-800/10 rounded-lg p-4">
            <div className="font-bold text-amber-300 mb-2">Before Deployment</div>
            <p className="opacity-90">Run the Smoke Test ({SMOKE_TEST.manualCount} key scenarios) to validate core functionality before any release.</p>
          </div>
          <div className="bg-white/10 dark:bg-slate-800/10 rounded-lg p-4">
            <div className="font-bold text-green-300 mb-2">Full Regression</div>
            <p className="opacity-90">Run all {MANUAL_SUITE_COUNT} suites ({MANUAL_TOTAL} scenarios) quarterly or after major changes.</p>
          </div>
          <div className="bg-white/10 dark:bg-slate-800/10 rounded-lg p-4">
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
              className={`bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden transition-all
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
                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{script.description}</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  {/* Stats */}
                  <div className="flex items-center gap-4 text-sm">
                    <span className={`px-2 py-1 rounded border font-medium ${getPriorityColor(script.priority)}`}>
                      {script.priority}
                    </span>
                    <span className="text-gray-600 dark:text-gray-300 font-medium">
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
                <div className={`border-t border-gray-200 dark:border-gray-700 px-5 py-4 ${colorClasses.bg}`}>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      <strong>File:</strong> <code className="bg-white/50 dark:bg-slate-800/50 px-2 py-1 rounded">{script.file}</code>
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
                      <div className="bg-white/80 dark:bg-slate-800/80 rounded-lg p-3 text-sm">
                        <div className="font-medium text-gray-700 dark:text-gray-200">Authentication</div>
                        <div className="text-gray-500 dark:text-gray-400">6 scenarios</div>
                      </div>
                      <div className="bg-white/80 dark:bg-slate-800/80 rounded-lg p-3 text-sm">
                        <div className="font-medium text-gray-700 dark:text-gray-200">Prep Phase</div>
                        <div className="text-gray-500 dark:text-gray-400">5 scenarios</div>
                      </div>
                      <div className="bg-white/80 dark:bg-slate-800/80 rounded-lg p-3 text-sm">
                        <div className="font-medium text-gray-700 dark:text-gray-200">Day 1 + AM Bookend</div>
                        <div className="text-gray-500 dark:text-gray-400">10 scenarios</div>
                      </div>
                      <div className="bg-white/80 dark:bg-slate-800/80 rounded-lg p-3 text-sm">
                        <div className="font-medium text-gray-700 dark:text-gray-200">PM Bookend</div>
                        <div className="text-gray-500 dark:text-gray-400">7 scenarios</div>
                      </div>
                      <div className="bg-white/80 dark:bg-slate-800/80 rounded-lg p-3 text-sm">
                        <div className="font-medium text-gray-700 dark:text-gray-200">Content + Plan</div>
                        <div className="text-gray-500 dark:text-gray-400">5 scenarios</div>
                      </div>
                      <div className="bg-white/80 dark:bg-slate-800/80 rounded-lg p-3 text-sm">
                        <div className="font-medium text-gray-700 dark:text-gray-200">Post Phase</div>
                        <div className="text-gray-500 dark:text-gray-400">3 scenarios</div>
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
      <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="font-bold text-corporate-navy mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-500" />
          Bug Reporting Labels
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
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
          <span className="px-3 py-1 bg-teal-500 text-white text-sm rounded-full">area/zones</span>
        </div>
      </div>
      
      {/* Recommended Test Order */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="font-bold text-corporate-navy mb-4">Recommended Test Order</h3>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">Execute tests in this order to follow the natural user journey:</p>
        <ol className="space-y-3 text-sm">
          <li className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 flex items-center justify-center font-bold text-xs shrink-0">1</span>
            <div>
              <strong>Smoke Test</strong> - Always run first to catch critical issues ({MANUAL_TEST_SCRIPTS.smoke.scenarios} scenarios)
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 flex items-center justify-center font-bold text-xs shrink-0">2</span>
            <div>
              <strong>Authentication</strong> - Ensure users can access the system ({MANUAL_TEST_SCRIPTS.auth.scenarios} scenarios)
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 flex items-center justify-center font-bold text-xs shrink-0">3</span>
            <div>
              <strong>Prep Phase</strong> - Test new user onboarding journey ({MANUAL_TEST_SCRIPTS.prep.scenarios} scenarios)
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 flex items-center justify-center font-bold text-xs shrink-0">4</span>
            <div>
              <strong>AM Bookend</strong> - Core morning activities ({MANUAL_TEST_SCRIPTS.am.scenarios} scenarios)
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0">5</span>
            <div>
              <strong>PM Bookend</strong> - Evening wrap-up activities ({MANUAL_TEST_SCRIPTS.pm.scenarios} scenarios)
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">6</span>
            <div>
              <strong>Content Library</strong> - Media playback and content access ({MANUAL_TEST_SCRIPTS.content.scenarios} scenarios)
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-teal-100 dark:bg-teal-900/30 text-teal-700 flex items-center justify-center font-bold text-xs shrink-0">7</span>
            <div>
              <strong>Zones</strong> - Community (Day 15+), Coaching (Day 22+), Locker ({MANUAL_TEST_SCRIPTS.zones.scenarios} scenarios)
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 flex items-center justify-center font-bold text-xs shrink-0">8</span>
            <div>
              <strong>Post Phase</strong> - Program completion and ongoing access ({MANUAL_TEST_SCRIPTS.post.scenarios} scenarios)
            </div>
          </li>
        </ol>
      </div>
    </div>
  );
};

export default ManualTestScripts;
