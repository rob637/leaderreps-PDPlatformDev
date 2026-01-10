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
  BarChart3,
  Sun,
  Moon
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
  },
  {
    id: 'post-phase',
    name: 'Post Phase Journey',
    file: 'journeys/post-phase.spec.js',
    description: 'Day 71+ experience: full content access, continued practice, historical data',
    icon: GraduationCap,
    testCount: 26,
    estimatedTime: '4-5 min',
    priority: 'High',
    category: 'graduation',
    tests: [
      'Day 70→71 Transition (3 tests)',
      'Full Content Access (4 tests)',
      'Continued Daily Practice (7 tests)',
      'Daily Rollover (2 tests)',
      'Historical Data (4 tests)',
      'Zone Access Post Phase (3 tests)',
      'Long-Term Day 100+ (3 tests)'
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
    testCount: 22,  // Actual count from smoke.spec.js
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
    testCount: 19,  // Actual count from auth.spec.js
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
  const [showPasteResults, setShowPasteResults] = useState(false);
  const [pastedResults, setPastedResults] = useState('');
  const [parsedResults, setParsedResults] = useState(null);
  
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
  
  // Parse Playwright terminal output to extract test results
  const parsePlaywrightOutput = (output) => {
    const lines = output.split('\n');
    const tests = [];
    let passed = 0, failed = 0, skipped = 0;
    let duration = '';
    
    for (const line of lines) {
      // Match test results: ✓, ✘, or -
      const passMatch = line.match(/✓\s+\d+.*?›\s+(.*)/);
      const failMatch = line.match(/✘\s+\d+.*?›\s+(.*)/);
      const skipMatch = line.match(/-\s+\d+.*?›\s+(.*)/);
      
      if (passMatch) {
        tests.push({ name: passMatch[1].trim(), status: 'passed' });
        passed++;
      } else if (failMatch) {
        tests.push({ name: failMatch[1].trim(), status: 'failed' });
        failed++;
      } else if (skipMatch) {
        tests.push({ name: skipMatch[1].trim(), status: 'skipped' });
        skipped++;
      }
      
      // Match summary line: "22 passed (42.9s)"
      const summaryMatch = line.match(/(\d+)\s+passed.*?(\d+\.?\d*s)/);
      if (summaryMatch) {
        duration = summaryMatch[2];
      }
      
      // Also check for failed summary
      const failedSummary = line.match(/(\d+)\s+failed/);
      if (failedSummary) {
        failed = parseInt(failedSummary[1]);
      }
    }
    
    return {
      tests,
      summary: { passed, failed, skipped, total: passed + failed + skipped },
      duration,
      timestamp: new Date().toISOString()
    };
  };
  
  // Handle paste results
  const handleParseResults = () => {
    if (!pastedResults.trim()) return;
    
    const results = parsePlaywrightOutput(pastedResults);
    setParsedResults(results);
    
    // Add to history
    setHistoricalRuns(prev => [{
      ...results,
      id: Date.now(),
      env: selectedEnv
    }, ...prev.slice(0, 9)]); // Keep last 10 runs
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
      {/* Quick Run Commands - Most Important Section */}
      <div className="bg-gradient-to-r from-corporate-teal/10 to-blue-50 border border-corporate-teal/30 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-corporate-teal rounded-lg">
            <PlayCircle className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-corporate-navy text-lg">Quick Run Commands</h3>
            <p className="text-sm text-gray-600 mt-1 mb-4">
              Run these in your terminal from the project root. Tests run in headless Chrome.
            </p>
            
            <div className="grid gap-3">
              {/* Smoke Test */}
              <div className="bg-white rounded-lg border border-gray-200 p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded">CRITICAL</span>
                    <span className="font-medium text-sm">Smoke Test (Run before every deploy)</span>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText('npm run e2e:smoke');
                      setCopiedCommand('smoke');
                      setTimeout(() => setCopiedCommand(false), 2000);
                    }}
                    className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs font-mono flex items-center gap-2"
                  >
                    {copiedCommand === 'smoke' ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                    npm run e2e:smoke
                  </button>
                </div>
              </div>
              
              {/* Auth Test */}
              <div className="bg-white rounded-lg border border-gray-200 p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded">HIGH</span>
                    <span className="font-medium text-sm">Authentication Tests</span>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText('npm run e2e:auth');
                      setCopiedCommand('auth');
                      setTimeout(() => setCopiedCommand(false), 2000);
                    }}
                    className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs font-mono flex items-center gap-2"
                  >
                    {copiedCommand === 'auth' ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                    npm run e2e:auth
                  </button>
                </div>
              </div>
              
              {/* All Journey Tests */}
              <div className="bg-white rounded-lg border border-gray-200 p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded">FULL</span>
                    <span className="font-medium text-sm">All Journey Tests (~15 min)</span>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText('npm run e2e');
                      setCopiedCommand('all');
                      setTimeout(() => setCopiedCommand(false), 2000);
                    }}
                    className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs font-mono flex items-center gap-2"
                  >
                    {copiedCommand === 'all' ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                    npm run e2e
                  </button>
                </div>
              </div>
              
              {/* UI Mode */}
              <div className="bg-white rounded-lg border border-gray-200 p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded">DEBUG</span>
                    <span className="font-medium text-sm">Interactive UI Mode (see browser)</span>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText('npm run e2e:ui');
                      setCopiedCommand('ui');
                      setTimeout(() => setCopiedCommand(false), 2000);
                    }}
                    className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs font-mono flex items-center gap-2"
                  >
                    {copiedCommand === 'ui' ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                    npm run e2e:ui
                  </button>
                </div>
              </div>
              
              {/* FULL SUITES - 168 Manual Test Scenarios */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center gap-2 mb-3">
                  <Target className="w-4 h-4 text-blue-600" />
                  <span className="font-semibold text-sm text-gray-700">Full Test Suites (168 Manual Scenarios Automated)</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {/* Auth Suite */}
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText('E2E_ENV=test npx playwright test --project=suite-auth');
                      setCopiedCommand('suite-auth');
                      setTimeout(() => setCopiedCommand(false), 2000);
                    }}
                    className="px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded border text-xs font-mono flex items-center justify-between gap-2"
                  >
                    <span className="flex items-center gap-2">
                      <Shield className="w-3 h-3 text-gray-500" />
                      Auth (16)
                    </span>
                    {copiedCommand === 'suite-auth' ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3 text-gray-400" />}
                  </button>
                  
                  {/* Prep Suite */}
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText('E2E_ENV=test npx playwright test --project=suite-prep');
                      setCopiedCommand('suite-prep');
                      setTimeout(() => setCopiedCommand(false), 2000);
                    }}
                    className="px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded border text-xs font-mono flex items-center justify-between gap-2"
                  >
                    <span className="flex items-center gap-2">
                      <UserCheck className="w-3 h-3 text-purple-500" />
                      Prep (14)
                    </span>
                    {copiedCommand === 'suite-prep' ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3 text-gray-400" />}
                  </button>
                  
                  {/* AM Bookend Suite */}
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText('E2E_ENV=test npx playwright test --project=suite-am');
                      setCopiedCommand('suite-am');
                      setTimeout(() => setCopiedCommand(false), 2000);
                    }}
                    className="px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded border text-xs font-mono flex items-center justify-between gap-2"
                  >
                    <span className="flex items-center gap-2">
                      <Sun className="w-3 h-3 text-amber-500" />
                      AM (21)
                    </span>
                    {copiedCommand === 'suite-am' ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3 text-gray-400" />}
                  </button>
                  
                  {/* PM Bookend Suite */}
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText('E2E_ENV=test npx playwright test --project=suite-pm');
                      setCopiedCommand('suite-pm');
                      setTimeout(() => setCopiedCommand(false), 2000);
                    }}
                    className="px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded border text-xs font-mono flex items-center justify-between gap-2"
                  >
                    <span className="flex items-center gap-2">
                      <Moon className="w-3 h-3 text-indigo-500" />
                      PM (13)
                    </span>
                    {copiedCommand === 'suite-pm' ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3 text-gray-400" />}
                  </button>
                  
                  {/* Content Suite */}
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText('E2E_ENV=test npx playwright test --project=suite-content');
                      setCopiedCommand('suite-content');
                      setTimeout(() => setCopiedCommand(false), 2000);
                    }}
                    className="px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded border text-xs font-mono flex items-center justify-between gap-2"
                  >
                    <span className="flex items-center gap-2">
                      <Library className="w-3 h-3 text-blue-500" />
                      Content (22)
                    </span>
                    {copiedCommand === 'suite-content' ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3 text-gray-400" />}
                  </button>
                  
                  {/* Post Phase Suite */}
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText('E2E_ENV=test npx playwright test --project=suite-post');
                      setCopiedCommand('suite-post');
                      setTimeout(() => setCopiedCommand(false), 2000);
                    }}
                    className="px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded border text-xs font-mono flex items-center justify-between gap-2"
                  >
                    <span className="flex items-center gap-2">
                      <GraduationCap className="w-3 h-3 text-green-500" />
                      Post (12)
                    </span>
                    {copiedCommand === 'suite-post' ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3 text-gray-400" />}
                  </button>
                  
                  {/* Zones Suite */}
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText('E2E_ENV=test npx playwright test --project=suite-zones');
                      setCopiedCommand('suite-zones');
                      setTimeout(() => setCopiedCommand(false), 2000);
                    }}
                    className="px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded border text-xs font-mono flex items-center justify-between gap-2"
                  >
                    <span className="flex items-center gap-2">
                      <Map className="w-3 h-3 text-teal-500" />
                      Zones (35)
                    </span>
                    {copiedCommand === 'suite-zones' ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3 text-gray-400" />}
                  </button>
                  
                  {/* ALL 168 */}
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText('E2E_ENV=test npx playwright test --project=all-suites');
                      setCopiedCommand('all-suites');
                      setTimeout(() => setCopiedCommand(false), 2000);
                    }}
                    className="px-3 py-2 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200 text-xs font-mono flex items-center justify-between gap-2"
                  >
                    <span className="flex items-center gap-2">
                      <Target className="w-3 h-3 text-blue-600" />
                      <strong>ALL (168)</strong>
                    </span>
                    {copiedCommand === 'all-suites' ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3 text-blue-400" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* CI/CD Integration */}
      <div className="bg-green-50 border border-green-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-green-800">✅ CI/CD Integration Active</h4>
            <p className="text-sm text-green-700 mt-1">
              E2E tests run automatically on every push to main and on pull requests via GitHub Actions.
              View results at: <a 
                href="https://github.com/rob637/leaderreps-PDPlatformDev/actions" 
                target="_blank" 
                rel="noopener noreferrer"
                className="underline font-medium hover:text-green-900"
              >
                GitHub Actions Dashboard →
              </a>
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
            {parsedResults 
              ? `${parsedResults.summary.passed} passed, ${parsedResults.summary.failed} failed (${parsedResults.duration})`
              : '46+ Playwright tests for automated regression testing'
            }
          </p>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => setShowPasteResults(!showPasteResults)}
            className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors
              ${showPasteResults 
                ? 'bg-blue-500 text-white' 
                : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}`}
          >
            <FileText className="w-4 h-4" />
            {parsedResults ? 'View Results' : 'Paste Results'}
          </button>
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
      </div>
      
      {/* Paste Results Panel */}
      {showPasteResults && (
        <div className="bg-white rounded-xl border border-blue-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-corporate-navy flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-500" />
              Paste Terminal Output
            </h4>
            {parsedResults && (
              <button
                onClick={() => { setParsedResults(null); setPastedResults(''); }}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Clear Results
              </button>
            )}
          </div>
          
          {!parsedResults ? (
            <>
              <p className="text-sm text-gray-600">
                Run tests in your terminal, then paste the output here to see results in the app.
              </p>
              <textarea
                value={pastedResults}
                onChange={(e) => setPastedResults(e.target.value)}
                placeholder={`Paste your Playwright output here...

Example:
  ✓ [chromium] test.spec.js:10 › My Test Name (1.2s)
  ✘ [chromium] test.spec.js:20 › Failed Test (0.8s)
  22 passed (42.9s)`}
                className="w-full h-40 px-3 py-2 border border-gray-200 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
              <button
                onClick={handleParseResults}
                disabled={!pastedResults.trim()}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <BarChart3 className="w-4 h-4" />
                Parse Results
              </button>
            </>
          ) : (
            <div className="space-y-4">
              {/* Results Summary */}
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-700">{parsedResults.summary.passed}</div>
                  <div className="text-sm text-green-600">Passed</div>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-red-700">{parsedResults.summary.failed}</div>
                  <div className="text-sm text-red-600">Failed</div>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-gray-700">{parsedResults.summary.skipped}</div>
                  <div className="text-sm text-gray-600">Skipped</div>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-700">{parsedResults.duration || 'N/A'}</div>
                  <div className="text-sm text-blue-600">Duration</div>
                </div>
              </div>
              
              {/* Pass Rate Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-gray-700">Pass Rate</span>
                  <span className="font-bold text-gray-900">
                    {parsedResults.summary.total > 0 
                      ? Math.round((parsedResults.summary.passed / parsedResults.summary.total) * 100)
                      : 0}%
                  </span>
                </div>
                <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-green-400 to-green-500 transition-all duration-500"
                    style={{ 
                      width: parsedResults.summary.total > 0 
                        ? `${(parsedResults.summary.passed / parsedResults.summary.total) * 100}%` 
                        : '0%' 
                    }}
                  />
                </div>
              </div>
              
              {/* Test List */}
              {parsedResults.tests.length > 0 && (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                    <span className="font-medium text-sm text-gray-700">Test Results ({parsedResults.tests.length})</span>
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    {parsedResults.tests.map((test, idx) => (
                      <div key={idx} className={`px-4 py-2 border-b border-gray-100 flex items-center gap-2 text-sm
                        ${test.status === 'passed' ? 'bg-green-50/50' : test.status === 'failed' ? 'bg-red-50/50' : 'bg-gray-50/50'}`}>
                        {test.status === 'passed' ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                        ) : test.status === 'failed' ? (
                          <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        )}
                        <span className={test.status === 'failed' ? 'text-red-700' : 'text-gray-700'}>{test.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <p className="text-xs text-gray-500 text-center">
                Results parsed at {new Date(parsedResults.timestamp).toLocaleString()}
              </p>
            </div>
          )}
        </div>
      )}
      
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
