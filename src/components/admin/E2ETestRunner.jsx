/**
 * E2ETestRunner - World-Class Browser E2E Test Runner
 * 
 * Integrates Playwright E2E tests into the Admin Command Center.
 * 
 * FEATURES:
 * - Journey-based test organization (Prep, Daily Practice, Content, Zones)
 * - Visual test coverage dashboard
 * - Configure test credentials
 * - Select test suites to run
 * - View live test progress
 * - Detailed failure logs with screenshots
 * - Historical test results
 * 
 * TEST COVERAGE: 108+ automated test scenarios covering:
 * - Prep Phase: 18 tests (onboarding, profile, baseline, actions)
 * - Daily Practice: 27 tests (AM/PM bookends, scorecard, commitments)
 * - Content Library: 28 tests (browsing, filtering, viewing)
 * - Zones: 35 tests (Community, Coaching, Locker)
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Play, 
  Square, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  Clock,
  RefreshCw,
  ChevronRight,
  ChevronDown,
  Eye,
  EyeOff,
  Download,
  Settings,
  Terminal,
  Copy,
  Check,
  ExternalLink,
  Image,
  Video,
  FileText,
  Zap,
  Globe,
  Lock,
  Trash2,
  RotateCcw,
  Smartphone,
  Monitor,
  Shield,
  Users,
  BookOpen,
  Calendar,
  Activity,
  Target,
  UserCheck,
  Library,
  MessageSquare,
  GraduationCap,
  Trophy,
  Map,
  Layers,
  PlayCircle,
  BarChart3
} from 'lucide-react';
import { useAppServices } from '../../services/useAppServices';
import { 
  doc, 
  getDoc, 
  onSnapshot,
  deleteDoc
} from 'firebase/firestore';

// ═══════════════════════════════════════════════════════════════════════════════
// JOURNEY-BASED TEST SUITES - Organized by User Experience
// ═══════════════════════════════════════════════════════════════════════════════

const JOURNEY_SUITES = [
  {
    id: 'prep-phase',
    name: 'Prep Phase Journey',
    file: 'journeys/prep-phase.spec.js',
    description: 'New user onboarding: account creation, profile setup, baseline assessment, prep actions',
    icon: UserCheck,
    testCount: 18,
    estimatedTime: '3-4 min',
    priority: 'Critical',
    category: 'onboarding',
    tests: [
      'Account creation flow',
      'Email verification',
      'Prep phase gate',
      'Leader Profile setup',
      'Baseline Assessment (4 pages)',
      'Prep Actions completion',
      'Prep to Start transition'
    ]
  },
  {
    id: 'daily-practice',
    name: 'Daily Practice Journey',
    file: 'journeys/daily-practice.spec.js',
    description: 'AM/PM bookends, grounding rep, WIN, scorecard, commitments, streak tracking',
    icon: Activity,
    testCount: 27,
    estimatedTime: '4-5 min',
    priority: 'Critical',
    category: 'core',
    tests: [
      'Grounding Rep (5 tests)',
      'Win the Day (5 tests)',
      'Other Tasks (5 tests)',
      'PM Reflection (6 tests)',
      'Scorecard (3 tests)',
      'Streak Tracking (3 tests)',
      'Commitment Management (14 tests)'
    ]
  },
  {
    id: 'content-library',
    name: 'Content Library Journey',
    file: 'journeys/content-library.spec.js',
    description: 'Content browsing, skills, videos, documents, search, filtering, resource viewer',
    icon: Library,
    testCount: 28,
    estimatedTime: '4-5 min',
    priority: 'High',
    category: 'content',
    tests: [
      'Library Navigation (3 tests)',
      'Skills Browsing (5 tests)',
      'Video Content (5 tests)',
      'Read & Reps (4 tests)',
      'Tools Section (3 tests)',
      'Documents (3 tests)',
      'Search & Filter (7 tests)',
      'Content Gating (4 tests)'
    ]
  },
  {
    id: 'zones',
    name: 'Zones Journey',
    file: 'journeys/zones.spec.js',
    description: 'Community (Day 15+), Coaching (Day 22+), 1:1 scheduling, Locker features',
    icon: Map,
    testCount: 35,
    estimatedTime: '5-6 min',
    priority: 'High',
    category: 'zones',
    tests: [
      'Community Access Gate (4 tests)',
      'Community Tabs (5 tests)',
      'Feed Features (6 tests)',
      'Community Resources (5 tests)',
      'Coaching Access Gate (4 tests)',
      'Coaching Tabs (6 tests)',
      'My Coaching (5 tests)',
      'Locker Features (10 tests)'
    ]
  }
];

// Legacy test suites for backwards compatibility
const LEGACY_SUITES = [
  {
    id: 'smoke',
    name: 'Smoke Test',
    file: 'smoke.spec.js',
    description: 'Critical path tests - run before every deployment',
    icon: Zap,
    testCount: 20,
    estimatedTime: '2-3 min',
    priority: 'Critical',
    category: 'smoke'
  },
  {
    id: 'auth',
    name: 'Authentication',
    file: 'auth.spec.js',
    description: 'Login, logout, signup, protected routes',
    icon: Shield,
    testCount: 14,
    estimatedTime: '1-2 min',
    priority: 'High',
    category: 'auth'
  }
];

// Combine all suites
const ALL_SUITES = [...JOURNEY_SUITES, ...LEGACY_SUITES];

const ENVIRONMENTS = [
  { id: 'local', name: 'Local Dev', url: 'http://localhost:5173' },
  { id: 'dev', name: 'Development', url: 'https://leaderreps-pd-platform.web.app' },
  { id: 'test', name: 'Test', url: 'https://leaderreps-test.web.app' },
  { id: 'prod', name: 'Production', url: 'https://leaderreps-prod.web.app' }
];

// Status colors and styling
const getStatusStyle = (status) => {
  switch (status) {
    case 'passed':
      return { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', icon: CheckCircle2 };
    case 'failed':
      return { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', icon: XCircle };
    case 'running':
      return { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', icon: RefreshCw };
    case 'skipped':
      return { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-500', icon: ChevronRight };
    default:
      return { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-500', icon: Clock };
  }
};

const E2ETestRunner = () => {
  const { db } = useAppServices();
  
  // Configuration state
  const [showConfig, setShowConfig] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [testPassword, setTestPassword] = useState('');
  const [selectedEnv, setSelectedEnv] = useState('test');
  const [selectedSuites, setSelectedSuites] = useState(['prep-phase']);
  
  // Results state
  const [currentRun, setCurrentRun] = useState(null);
  const [historicalRuns, setHistoricalRuns] = useState([]);
  const [expandedTests, setExpandedTests] = useState(new Set());
  const [copiedCommand, setCopiedCommand] = useState(false);
  
  // Load saved configuration
  useEffect(() => {
    const savedConfig = localStorage.getItem('e2e-test-config');
    if (savedConfig) {
      try {
        const config = JSON.parse(savedConfig);
        setTestEmail(config.email || '');
        setSelectedEnv(config.env || 'test');
        setSelectedSuites(config.suites || ['smoke']);
        // Don't store password in localStorage for security
      } catch (e) {
        console.error('Failed to load saved config:', e);
      }
    }
  }, []);
  
  // Save configuration when changed
  useEffect(() => {
    localStorage.setItem('e2e-test-config', JSON.stringify({
      email: testEmail,
      env: selectedEnv,
      suites: selectedSuites
    }));
  }, [testEmail, selectedEnv, selectedSuites]);
  
  // Subscribe to current run results from Firestore
  useEffect(() => {
    if (!db) return;
    
    const unsubscribe = onSnapshot(
      doc(db, 'metadata', 'e2e-current-run'),
      (snapshot) => {
        if (snapshot.exists()) {
          setCurrentRun(snapshot.data());
        }
      },
      (error) => {
        console.error('Error subscribing to test results:', error);
      }
    );
    
    return () => unsubscribe();
  }, [db]);
  
  // Load historical runs
  useEffect(() => {
    if (!db) return;
    
    const loadHistory = async () => {
      try {
        const historyDoc = await getDoc(doc(db, 'metadata', 'e2e-history'));
        if (historyDoc.exists()) {
          setHistoricalRuns(historyDoc.data().runs || []);
        }
      } catch (e) {
        console.error('Failed to load test history:', e);
      }
    };
    
    loadHistory();
  }, [db]);
  
  // Generate CLI command
  const generateCommand = useCallback(() => {
    const suitesArg = selectedSuites.length === ALL_SUITES.length 
      ? '--suite=all' 
      : selectedSuites.map(s => ALL_SUITES.find(suite => suite.id === s)?.file || `${s}.spec.js`).join(' ');
    
    let cmd = `E2E_ENV=${selectedEnv}`;
    if (testEmail) cmd += ` E2E_ADMIN_EMAIL="${testEmail}"`;
    if (testPassword) cmd += ` E2E_ADMIN_PASSWORD="***"`;
    cmd += ` npx playwright test ${suitesArg} --project=chromium`;
    
    return cmd;
  }, [selectedEnv, selectedSuites, testEmail, testPassword]);
  
  // Copy command to clipboard
  const copyCommand = () => {
    let cmd = `E2E_ENV=${selectedEnv}`;
    if (testEmail) cmd += ` E2E_ADMIN_EMAIL="${testEmail}"`;
    if (testPassword) cmd += ` E2E_ADMIN_PASSWORD="${testPassword}"`;
    
    const suitesArg = selectedSuites.length === ALL_SUITES.length 
      ? '' 
      : selectedSuites.map(s => ALL_SUITES.find(suite => suite.id === s)?.file || `${s}.spec.js`).join(' ');
    
    cmd += ` npx playwright test ${suitesArg} --project=chromium`;
    
    navigator.clipboard.writeText(cmd);
    setCopiedCommand(true);
    setTimeout(() => setCopiedCommand(false), 2000);
  };
  
  // Toggle suite selection
  const toggleSuite = (suiteId) => {
    setSelectedSuites(prev => {
      if (prev.includes(suiteId)) {
        return prev.filter(s => s !== suiteId);
      }
      return [...prev, suiteId];
    });
  };
  
  // Toggle all suites
  const toggleAllSuites = () => {
    if (selectedSuites.length === ALL_SUITES.length) {
      setSelectedSuites(['prep-phase']); // Keep at least one
    } else {
      setSelectedSuites(ALL_SUITES.map(s => s.id));
    }
  };
  
  // Toggle test expansion
  const toggleTest = (testId) => {
    setExpandedTests(prev => {
      const next = new Set(prev);
      if (next.has(testId)) {
        next.delete(testId);
      } else {
        next.add(testId);
      }
      return next;
    });
  };
  
  // Clear current run
  const clearCurrentRun = async () => {
    if (!db) return;
    
    try {
      await deleteDoc(doc(db, 'metadata', 'e2e-current-run'));
      setCurrentRun(null);
    } catch (e) {
      console.error('Failed to clear run:', e);
    }
  };
  
  // Calculate totals from selected suites
  const selectedStats = selectedSuites.reduce((acc, suiteId) => {
    const suite = ALL_SUITES.find(s => s.id === suiteId);
    if (suite) {
      acc.tests += suite.testCount;
    }
    return acc;
  }, { tests: 0 });
  
  return (
    <div className="space-y-6">
      {/* Important Notice Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-amber-800">For Developers & CI/CD Only</h4>
            <p className="text-sm text-amber-700 mt-1">
              These automated browser tests require a development environment to run (Node.js, Playwright). 
              They're designed for developers and automated pipelines, not manual execution.
            </p>
            <p className="text-sm text-amber-700 mt-2">
              <strong>Looking to test manually?</strong> Use the <strong>"QA Test Scenarios"</strong> tab instead — 
              it provides step-by-step checklists you can follow without any technical setup.
            </p>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-corporate-navy font-serif flex items-center gap-2">
            <Terminal className="w-5 h-5 text-corporate-teal" />
            Automated Browser Tests
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            108+ Playwright tests for automated regression testing
          </p>
        </div>
        
        <button
          onClick={() => setShowConfig(!showConfig)}
          className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors
            ${showConfig 
              ? 'bg-corporate-teal text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
        >
          <Settings className="w-4 h-4" />
          Developer Config
        </button>
      </div>
      
      {/* Configuration Panel */}
      {showConfig && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
          <h4 className="font-bold text-corporate-navy flex items-center gap-2">
            <Lock className="w-4 h-4" />
            Test Configuration
          </h4>
          
          {/* Credentials */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Test Email
              </label>
              <input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="admin@example.com"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-corporate-teal/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Test Password
              </label>
              <input
                type="password"
                value={testPassword}
                onChange={(e) => setTestPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-corporate-teal/50"
              />
              <p className="text-xs text-gray-400 mt-1">
                Not stored - only used for this session
              </p>
            </div>
          </div>
          
          {/* Environment Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Target Environment
            </label>
            <div className="flex gap-2">
              {ENVIRONMENTS.map(env => (
                <button
                  key={env.id}
                  onClick={() => setSelectedEnv(env.id)}
                  className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors
                    ${selectedEnv === env.id 
                      ? 'bg-corporate-teal text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  <Globe className="w-4 h-4" />
                  {env.name}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {ENVIRONMENTS.find(e => e.id === selectedEnv)?.url}
            </p>
          </div>
          
          {/* Suite Selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">
                Test Suites
              </label>
              <button
                onClick={toggleAllSuites}
                className="text-sm text-corporate-teal hover:underline"
              >
                {selectedSuites.length === ALL_SUITES.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {ALL_SUITES.map(suite => {
                const Icon = suite.icon;
                const isSelected = selectedSuites.includes(suite.id);
                return (
                  <button
                    key={suite.id}
                    onClick={() => toggleSuite(suite.id)}
                    className={`p-4 rounded-xl border text-left transition-all
                      ${isSelected 
                        ? 'bg-corporate-teal/5 border-corporate-teal ring-1 ring-corporate-teal' 
                        : 'bg-white border-gray-200 hover:border-gray-300'}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${isSelected ? 'bg-corporate-teal/10' : 'bg-gray-100'}`}>
                        <Icon className={`w-5 h-5 ${isSelected ? 'text-corporate-teal' : 'text-gray-500'}`} />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-corporate-navy">{suite.name}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{suite.description}</div>
                        <div className="flex items-center gap-2 mt-2 text-xs">
                          <span className="text-gray-500">{suite.testCount} tests</span>
                          <span className="text-gray-300">•</span>
                          <span className="text-gray-500">{suite.estimatedTime}</span>
                          <span className={`px-1.5 py-0.5 rounded text-xs font-medium
                            ${suite.priority === 'Critical' ? 'bg-red-100 text-red-700' :
                              suite.priority === 'High' ? 'bg-amber-100 text-amber-700' :
                              'bg-blue-100 text-blue-700'}`}>
                            {suite.priority}
                          </span>
                        </div>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center
                        ${isSelected ? 'bg-corporate-teal border-corporate-teal' : 'border-gray-300'}`}>
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
      
      {/* Command Panel */}
      <div className="bg-gray-900 rounded-xl p-4 text-white">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-gray-400">Run Command</span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">
              {selectedStats.tests} tests selected
            </span>
            <button
              onClick={copyCommand}
              className="px-3 py-1.5 bg-gray-700 rounded-lg text-sm font-medium hover:bg-gray-600 flex items-center gap-2"
            >
              {copiedCommand ? (
                <>
                  <Check className="w-4 h-4 text-green-400" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy
                </>
              )}
            </button>
          </div>
        </div>
        <code className="text-sm text-green-400 font-mono block overflow-x-auto">
          {generateCommand()}
        </code>
        <p className="text-xs text-gray-500 mt-3">
          Run this command in your terminal. Results will appear here automatically.
        </p>
      </div>
      
      {/* Current Run Results */}
      {currentRun && (
        <div className={`rounded-xl border overflow-hidden
          ${currentRun.status === 'running' ? 'bg-blue-50 border-blue-200' :
            currentRun.status === 'passed' ? 'bg-green-50 border-green-200' :
            'bg-red-50 border-red-200'}`}>
          
          {/* Run Header */}
          <div className="px-5 py-4 flex items-center justify-between border-b border-inherit">
            <div className="flex items-center gap-4">
              {currentRun.status === 'running' ? (
                <RefreshCw className="w-6 h-6 text-blue-500 animate-spin" />
              ) : currentRun.status === 'passed' ? (
                <CheckCircle2 className="w-6 h-6 text-green-500" />
              ) : (
                <XCircle className="w-6 h-6 text-red-500" />
              )}
              <div>
                <div className="font-bold text-corporate-navy">
                  {currentRun.status === 'running' ? 'Running Tests...' :
                   currentRun.status === 'passed' ? 'All Tests Passed!' :
                   'Some Tests Failed'}
                </div>
                <div className="text-sm text-gray-500">
                  {currentRun.environment} • Started {new Date(currentRun.startTime).toLocaleTimeString()}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {currentRun.status !== 'running' && (
                <button
                  onClick={clearCurrentRun}
                  className="p-2 hover:bg-white/50 rounded-lg transition-colors"
                  title="Clear results"
                >
                  <Trash2 className="w-4 h-4 text-gray-400" />
                </button>
              )}
            </div>
          </div>
          
          {/* Summary Stats */}
          <div className="px-5 py-4 grid grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-corporate-navy">{currentRun.summary?.total || 0}</div>
              <div className="text-xs text-gray-500">Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{currentRun.summary?.passed || 0}</div>
              <div className="text-xs text-green-700">Passed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{currentRun.summary?.failed || 0}</div>
              <div className="text-xs text-red-700">Failed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-400">{currentRun.summary?.skipped || 0}</div>
              <div className="text-xs text-gray-500">Skipped</div>
            </div>
          </div>
          
          {/* Progress Bar */}
          {currentRun.status === 'running' && currentRun.summary?.total > 0 && (
            <div className="px-5 pb-4">
              <div className="h-2 bg-white/50 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 transition-all duration-300"
                  style={{ 
                    width: `${((currentRun.summary.passed + currentRun.summary.failed + currentRun.summary.skipped) / currentRun.summary.total) * 100}%` 
                  }}
                />
              </div>
            </div>
          )}
          
          {/* Test Results */}
          {currentRun.tests && currentRun.tests.length > 0 && (
            <div className="border-t border-inherit">
              <div className="px-5 py-3 bg-white/30">
                <span className="text-sm font-medium text-gray-700">Test Details</span>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {currentRun.tests.map((test, idx) => {
                  const style = getStatusStyle(test.status);
                  const StatusIcon = style.icon;
                  const isExpanded = expandedTests.has(test.id);
                  
                  return (
                    <div 
                      key={test.id || idx}
                      className={`px-5 py-3 border-t border-gray-100 ${style.bg}`}
                    >
                      <div 
                        className="flex items-center justify-between cursor-pointer"
                        onClick={() => test.error && toggleTest(test.id)}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <StatusIcon className={`w-5 h-5 ${style.text} flex-shrink-0 
                            ${test.status === 'running' ? 'animate-spin' : ''}`} 
                          />
                          <div className="min-w-0 flex-1">
                            <div className={`font-medium truncate ${style.text}`}>
                              {test.name}
                            </div>
                            {test.suite && (
                              <div className="text-xs text-gray-400 truncate">
                                {test.suite}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {test.duration > 0 && (
                            <span className="text-xs text-gray-400">
                              {test.duration}ms
                            </span>
                          )}
                          {test.attachments?.length > 0 && (
                            <div className="flex items-center gap-1">
                              {test.attachments.some(a => a.contentType?.includes('image')) && (
                                <Image className="w-4 h-4 text-gray-400" />
                              )}
                              {test.attachments.some(a => a.contentType?.includes('video')) && (
                                <Video className="w-4 h-4 text-gray-400" />
                              )}
                            </div>
                          )}
                          {test.error && (
                            isExpanded ? (
                              <ChevronDown className="w-4 h-4 text-gray-400" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-gray-400" />
                            )
                          )}
                        </div>
                      </div>
                      
                      {/* Error Details */}
                      {isExpanded && test.error && (
                        <div className="mt-3 p-3 bg-white rounded-lg border border-red-200">
                          <div className="text-sm font-medium text-red-800 mb-2">
                            {test.error.message}
                          </div>
                          {test.error.snippet && (
                            <pre className="text-xs text-gray-600 bg-gray-50 p-2 rounded overflow-x-auto">
                              {test.error.snippet}
                            </pre>
                          )}
                          {test.error.stack && (
                            <details className="mt-2">
                              <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                                Stack trace
                              </summary>
                              <pre className="text-xs text-gray-500 mt-2 overflow-x-auto max-h-32">
                                {test.error.stack}
                              </pre>
                            </details>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          
          {/* Duration */}
          {currentRun.endTime && (
            <div className="px-5 py-3 bg-white/30 border-t border-inherit text-sm text-gray-600">
              Completed in {((new Date(currentRun.endTime) - new Date(currentRun.startTime)) / 1000).toFixed(1)}s
            </div>
          )}
        </div>
      )}
      
      {/* Empty State */}
      {!currentRun && (
        <div className="bg-gray-50 border border-dashed border-gray-300 rounded-xl p-8 text-center">
          <Terminal className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h4 className="font-medium text-gray-700 mb-2">No Test Results Yet</h4>
          <p className="text-sm text-gray-500 mb-4">
            Configure your tests above and run the command in your terminal.
            Results will stream here in real-time.
          </p>
          <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
            <Monitor className="w-4 h-4" />
            <span>Desktop Chrome</span>
            <span className="mx-2">•</span>
            <Smartphone className="w-4 h-4" />
            <span>Mobile viewport supported</span>
          </div>
        </div>
      )}
      
      {/* Historical Runs */}
      {historicalRuns.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
            <h4 className="font-bold text-corporate-navy flex items-center gap-2">
              <RotateCcw className="w-4 h-4" />
              Recent Runs
            </h4>
            <span className="text-sm text-gray-500">{historicalRuns.length} runs</span>
          </div>
          <div className="divide-y divide-gray-100">
            {historicalRuns.slice(0, 5).map((run, idx) => {
              const style = getStatusStyle(run.status);
              const StatusIcon = style.icon;
              
              return (
                <div key={run.runId || idx} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <StatusIcon className={`w-5 h-5 ${style.text}`} />
                    <div>
                      <div className="font-medium text-sm text-corporate-navy">
                        {run.suite === 'all' ? 'All Tests' : run.suite}
                      </div>
                      <div className="text-xs text-gray-500">
                        {run.environment} • {new Date(run.startTime).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="text-sm">
                    <span className="text-green-600">{run.summary?.passed || 0}✓</span>
                    {run.summary?.failed > 0 && (
                      <span className="text-red-600 ml-2">{run.summary.failed}✗</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Quick Tips */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <h4 className="font-medium text-amber-800 mb-2 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          Tips for Running E2E Tests
        </h4>
        <ul className="text-sm text-amber-700 space-y-1">
          <li>• Run <code className="bg-amber-100 px-1 rounded">npm run e2e:headed</code> to watch tests in a real browser</li>
          <li>• Run <code className="bg-amber-100 px-1 rounded">npm run e2e:ui</code> for interactive test debugging</li>
          <li>• Screenshots are automatically captured on failures</li>
          <li>• Run smoke tests before every deployment</li>
        </ul>
      </div>
    </div>
  );
};

export default E2ETestRunner;
