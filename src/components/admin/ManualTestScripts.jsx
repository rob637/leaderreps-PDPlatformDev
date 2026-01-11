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
  TEST_AREAS,
  TEST_ORDER,
  MANUAL_TOTAL,
  AUTOMATED_TOTAL,
  AUTOMATION_GAP,
  AUTOMATION_COVERAGE
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
    gray: { bg: 'bg-gray-50', border: 'border-gray-200', icon: 'text-gray-500', hover: 'hover:bg-gray-100' },
    teal: { bg: 'bg-teal-50', border: 'border-teal-200', icon: 'text-teal-500', hover: 'hover:bg-teal-100' }
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
          <div className="text-2xl font-bold text-corporate-navy">{MANUAL_SUITE_COUNT}</div>
          <div className="text-sm text-gray-500">Test Suites</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-2xl font-bold text-corporate-teal">{MANUAL_TOTAL_SCENARIOS}</div>
          <div className="text-sm text-gray-500">Total Scenarios</div>
        </div>
        <div className="bg-red-50 rounded-xl border border-red-200 p-4">
          <div className="text-2xl font-bold text-red-600">{MANUAL_CRITICAL_PATH}</div>
          <div className="text-sm text-red-700">Critical Path</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-2xl font-bold text-gray-600">~16 hrs</div>
          <div className="text-sm text-gray-500">Full Suite Time</div>
        </div>
      </div>
      
      {/* Test Coverage Reconciliation */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
        <h4 className="font-bold text-corporate-navy mb-3 flex items-center gap-2">
          <Zap className="w-4 h-4 text-blue-600" />
          Test Coverage Summary
        </h4>
        
        {/* Automation Coverage Bar */}
        <div className="bg-white rounded-lg p-4 border border-blue-100 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">E2E Automation Coverage</span>
            <span className="text-lg font-bold text-corporate-teal">{AUTOMATION_COVERAGE}%</span>
          </div>
          <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-corporate-teal to-green-500 rounded-full transition-all"
              style={{ width: `${AUTOMATION_COVERAGE}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-500">
            <span>{AUTOMATED_TOTAL} of {MANUAL_TOTAL} manual tests automated</span>
            <span className="text-amber-600 font-medium">{AUTOMATION_GAP} tests remaining</span>
          </div>
        </div>
        
        {/* Per-Area Breakdown */}
        <div className="bg-white rounded-lg border border-blue-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-2 px-3 font-medium text-gray-600">Test Area</th>
                <th className="text-center py-2 px-3 font-medium text-gray-600">Manual</th>
                <th className="text-center py-2 px-3 font-medium text-gray-600">Automated</th>
                <th className="text-center py-2 px-3 font-medium text-gray-600">Gap</th>
                <th className="text-center py-2 px-3 font-medium text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {TEST_ORDER.map(key => {
                const area = TEST_AREAS[key];
                const coverage = Math.round((area.automated / area.manual) * 100);
                return (
                  <tr key={key} className="hover:bg-gray-50">
                    <td className="py-2 px-3 font-medium text-gray-800">{area.name}</td>
                    <td className="py-2 px-3 text-center text-gray-600">{area.manual}</td>
                    <td className="py-2 px-3 text-center text-corporate-teal font-medium">{area.automated}</td>
                    <td className="py-2 px-3 text-center">
                      {area.gap > 0 ? (
                        <span className="text-amber-600 font-medium">-{area.gap}</span>
                      ) : area.gap < 0 ? (
                        <span className="text-blue-600 font-medium">+{Math.abs(area.gap)}</span>
                      ) : (
                        <span className="text-gray-400">0</span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-center">
                      {area.gap === 0 ? (
                        <span className="inline-flex items-center gap-1 text-green-600">
                          <CheckCircle2 className="w-4 h-4" /> 100%
                        </span>
                      ) : area.gap < 0 ? (
                        <span className="inline-flex items-center gap-1 text-blue-600">
                          <CheckCircle2 className="w-4 h-4" /> {coverage}%+
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-amber-600">
                          <AlertTriangle className="w-4 h-4" /> {coverage}%
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-gray-50 font-bold">
              <tr>
                <td className="py-2 px-3 text-gray-800">TOTAL</td>
                <td className="py-2 px-3 text-center text-gray-800">{MANUAL_TOTAL}</td>
                <td className="py-2 px-3 text-center text-corporate-teal">{AUTOMATED_TOTAL}</td>
                <td className="py-2 px-3 text-center text-amber-600">{AUTOMATION_GAP > 0 ? `-${AUTOMATION_GAP}` : '0'}</td>
                <td className="py-2 px-3 text-center text-corporate-teal">{AUTOMATION_COVERAGE}%</td>
              </tr>
            </tfoot>
          </table>
        </div>
        
        {/* Journey Tests Note */}
        <div className="mt-3 p-3 bg-white/60 rounded-lg border border-blue-100">
          <p className="text-xs text-gray-600">
            <strong className="text-indigo-600">+ {E2E_JOURNEYS_TOTAL} Journey Tests</strong> — Extended multi-step flows that test complete user journeys (additional to suite tests above).
          </p>
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
            <p className="opacity-90">Run the Smoke Test ({MANUAL_CRITICAL_PATH} scenarios) to validate core functionality before any release.</p>
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
          <span className="px-3 py-1 bg-teal-500 text-white text-sm rounded-full">area/zones</span>
        </div>
      </div>
      
      {/* Recommended Test Order */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h3 className="font-bold text-corporate-navy mb-4">Recommended Test Order</h3>
        <p className="text-sm text-gray-600 mb-4">Execute tests in this order to follow the natural user journey:</p>
        <ol className="space-y-3 text-sm">
          <li className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-red-100 text-red-700 flex items-center justify-center font-bold text-xs shrink-0">1</span>
            <div>
              <strong>Smoke Test</strong> - Always run first to catch critical issues ({MANUAL_TEST_SCRIPTS.smoke.scenarios} scenarios)
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-700 flex items-center justify-center font-bold text-xs shrink-0">2</span>
            <div>
              <strong>Authentication</strong> - Ensure users can access the system ({MANUAL_TEST_SCRIPTS.auth.scenarios} scenarios)
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs shrink-0">3</span>
            <div>
              <strong>Prep Phase</strong> - Test new user onboarding journey ({MANUAL_TEST_SCRIPTS.prep.scenarios} scenarios)
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs shrink-0">4</span>
            <div>
              <strong>AM Bookend</strong> - Core morning activities ({MANUAL_TEST_SCRIPTS.am.scenarios} scenarios)
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0">5</span>
            <div>
              <strong>PM Bookend</strong> - Evening wrap-up activities ({MANUAL_TEST_SCRIPTS.pm.scenarios} scenarios)
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">6</span>
            <div>
              <strong>Content Library</strong> - Media playback and content access ({MANUAL_TEST_SCRIPTS.content.scenarios} scenarios)
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-xs shrink-0">7</span>
            <div>
              <strong>Zones</strong> - Community (Day 15+), Coaching (Day 22+), Locker ({MANUAL_TEST_SCRIPTS.zones.scenarios} scenarios)
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold text-xs shrink-0">8</span>
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
