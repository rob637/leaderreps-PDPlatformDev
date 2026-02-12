/**
 * E2ETestResults - Live Test Results Display
 * 
 * Fetches and displays E2E test results from Firestore.
 * Shows real-time results, history, and detailed logs.
 * 
 * Features:
 * - Real-time results display
 * - Test history with filtering
 * - Pass/fail breakdown by suite
 * - Detailed error logs
 * - Export results
 */

import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  RefreshCw,
  AlertTriangle,
  Download,
  ChevronRight,
  ChevronDown,
  FileText,
  BarChart3,
  Calendar,
  Activity,
  Target,
  Zap,
  Shield,
  Sun,
  Moon,
  Library,
  Map,
  GraduationCap,
  UserCheck,
  Filter,
  Search
} from 'lucide-react';
import { useAppServices } from '../../services/useAppServices';
import { 
  doc, 
  getDoc, 
  collection,
  getDocs,
  query,
  orderBy,
  limit,
  onSnapshot
} from 'firebase/firestore';

// Suite icons mapping
const SUITE_ICONS = {
  'Authentication': Shield,
  'Prep Phase': UserCheck,
  'AM Bookend': Sun,
  'PM Bookend': Moon,
  'Content Library': Library,
  'Post Phase': GraduationCap,
  'Zones': Map,
  'Smoke': Zap,
  'default': Target
};

// Get icon for suite name
const getSuiteIcon = (suiteName) => {
  for (const [key, Icon] of Object.entries(SUITE_ICONS)) {
    if (suiteName.toLowerCase().includes(key.toLowerCase())) {
      return Icon;
    }
  }
  return SUITE_ICONS.default;
};

// Format duration
const formatDuration = (ms) => {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  const mins = Math.floor(ms / 60000);
  const secs = Math.round((ms % 60000) / 1000);
  return `${mins}m ${secs}s`;
};

// Status badge component
const StatusBadge = ({ status, size = 'md' }) => {
  const styles = {
    passed: 'bg-green-100 dark:bg-green-900/30 text-green-700 border-green-200 dark:border-green-800',
    failed: 'bg-red-100 dark:bg-red-900/30 text-red-700 border-red-200 dark:border-red-800',
    skipped: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700',
    timedOut: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 border-amber-200 dark:border-amber-800'
  };
  
  const icons = {
    passed: CheckCircle2,
    failed: XCircle,
    skipped: Clock,
    timedOut: AlertTriangle
  };
  
  const Icon = icons[status] || icons.skipped;
  const sizeClass = size === 'sm' ? 'text-xs px-1.5 py-0.5' : 'text-sm px-2 py-1';
  
  return (
    <span className={`inline-flex items-center gap-1 ${sizeClass} rounded border font-medium ${styles[status] || styles.skipped}`}>
      <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />
      {status}
    </span>
  );
};

// Progress ring component
const ProgressRing = ({ percentage, size = 80 }) => {
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;
  
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          className="text-gray-200"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          className={percentage >= 90 ? 'text-green-500' : percentage >= 70 ? 'text-amber-500' : 'text-red-500'}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg font-bold">{percentage}%</span>
      </div>
    </div>
  );
};

// Test result row component
const TestRow = ({ test, expanded, onToggle }) => {
  return (
    <div className="border-b border-gray-100 last:border-b-0">
      <div 
        className="flex items-center justify-between py-2 px-3 hover:bg-gray-50 cursor-pointer"
        onClick={onToggle}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {test.error && (
            expanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />
          )}
          <span className={`truncate ${test.status === 'passed' ? 'text-gray-700 dark:text-gray-200' : 'text-red-700 font-medium'}`}>
            {test.name}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">{formatDuration(test.duration)}</span>
          <StatusBadge status={test.status} size="sm" />
        </div>
      </div>
      
      {expanded && test.error && (
        <div className="px-3 py-2 bg-red-50 dark:bg-red-900/20 border-t border-red-100">
          <p className="text-sm font-medium text-red-800 mb-1">Error:</p>
          <pre className="text-xs text-red-700 whitespace-pre-wrap overflow-x-auto font-mono">
            {test.error.message}
          </pre>
          {test.error.stack && (
            <pre className="text-xs text-red-600 whitespace-pre-wrap overflow-x-auto font-mono mt-2 opacity-75">
              {test.error.stack}
            </pre>
          )}
        </div>
      )}
    </div>
  );
};

// Suite panel component
const SuitePanel = ({ suite }) => {
  const [expanded, setExpanded] = useState(false);
  const [expandedTests, setExpandedTests] = useState(new Set());
  
  const Icon = getSuiteIcon(suite.name);
  const passRate = suite.tests.length > 0 
    ? Math.round((suite.passed / suite.tests.length) * 100) 
    : 0;
  
  const toggleTest = (testName) => {
    const newExpanded = new Set(expandedTests);
    if (newExpanded.has(testName)) {
      newExpanded.delete(testName);
    } else {
      newExpanded.add(testName);
    }
    setExpandedTests(newExpanded);
  };
  
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden mb-3">
      <div 
        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 cursor-pointer hover:bg-gray-100"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          {expanded ? <ChevronDown className="w-5 h-5 text-gray-500 dark:text-gray-400" /> : <ChevronRight className="w-5 h-5 text-gray-500 dark:text-gray-400" />}
          <Icon className="w-5 h-5 text-blue-600" />
          <span className="font-medium">{suite.name}</span>
          <span className="text-sm text-gray-500 dark:text-gray-400">({suite.tests.length} tests)</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-sm">
            <span className="text-green-600">{suite.passed} ✓</span>
            {suite.failed > 0 && <span className="text-red-600">{suite.failed} ✗</span>}
            {suite.skipped > 0 && <span className="text-gray-400">{suite.skipped} ○</span>}
          </div>
          <div className={`px-2 py-0.5 rounded text-sm font-medium ${
            passRate === 100 ? 'bg-green-100 dark:bg-green-900/30 text-green-700' :
            passRate >= 80 ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700' :
            'bg-red-100 dark:bg-red-900/30 text-red-700'
          }`}>
            {passRate}%
          </div>
        </div>
      </div>
      
      {expanded && (
        <div className="border-t border-gray-200 dark:border-gray-700">
          {suite.tests.map((test, idx) => (
            <TestRow 
              key={idx} 
              test={test} 
              expanded={expandedTests.has(test.name)}
              onToggle={() => toggleTest(test.name)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Main component
export default function E2ETestResults() {
  const { firestore } = useAppServices();
  const [results, setResults] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [view, setView] = useState('latest'); // 'latest' | 'history'
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Fetch latest results
  const fetchResults = async () => {
    if (!firestore) return;
    
    setLoading(true);
    try {
      const docRef = doc(firestore, 'metadata', 'e2e-test-results');
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        setResults(docSnap.data());
      } else {
        setError('No test results found. Run tests with: npm run e2e:all');
      }
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };
  
  // Fetch history
  const fetchHistory = async () => {
    if (!firestore) return;
    
    try {
      const historyRef = collection(firestore, 'metadata', 'e2e-test-history', 'runs');
      const q = query(historyRef, orderBy('startTime', 'desc'), limit(20));
      const snapshot = await getDocs(q);
      
      const runs = [];
      snapshot.forEach(doc => {
        runs.push({ id: doc.id, ...doc.data() });
      });
      setHistory(runs);
    } catch (err) {
      console.warn('Could not fetch history:', err);
    }
  };
  
  // Real-time updates
  useEffect(() => {
    if (!firestore) return;
    
    const docRef = doc(firestore, 'metadata', 'e2e-test-results');
    const unsubscribe = onSnapshot(docRef, (doc) => {
      if (doc.exists()) {
        setResults(doc.data());
        setLoading(false);
      }
    }, (err) => {
      console.warn('Firestore listener error:', err);
    });
    
    fetchHistory();
    
    return () => unsubscribe();
  }, [firestore]);
  
  // Initial fetch
  useEffect(() => {
    fetchResults();
  }, [firestore]);
  
  // Filter suites
  const filteredSuites = results?.suites?.filter(suite => {
    const matchesSearch = !searchQuery || 
      suite.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      suite.tests.some(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'passed' && suite.failed === 0) ||
      (statusFilter === 'failed' && suite.failed > 0);
    
    return matchesSearch && matchesStatus;
  }) || [];
  
  // Export results
  const exportResults = () => {
    const data = JSON.stringify(results, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `e2e-results-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };
  
  if (loading && !results) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
        <span className="ml-3 text-gray-600 dark:text-gray-300">Loading test results...</span>
      </div>
    );
  }
  
  if (error && !results) {
    return (
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
        <div className="flex items-center gap-2 text-amber-700">
          <AlertTriangle className="w-5 h-5" />
          <span className="font-medium">No Results Available</span>
        </div>
        <p className="mt-2 text-sm text-amber-600">{error}</p>
        <div className="mt-4 p-3 bg-amber-100 dark:bg-amber-900/30 rounded text-sm font-mono">
          npx playwright test --project=all-suites
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Activity className="w-6 h-6 text-blue-600" />
          <h2 className="text-lg font-semibold">E2E Test Results</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchResults}
            className="p-2 hover:bg-gray-100 rounded transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={exportResults}
            className="p-2 hover:bg-gray-100 rounded transition-colors"
            title="Export JSON"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {/* Summary Cards */}
      {results && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="bg-white dark:bg-slate-800 border rounded-lg p-3 text-center">
            <ProgressRing percentage={results.summary.passRate} size={60} />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Pass Rate</p>
          </div>
          <div className="bg-white dark:bg-slate-800 border rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">{results.summary.total}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Total Tests</p>
          </div>
          <div className="bg-white dark:bg-slate-800 border rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-green-600">{results.summary.passed}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Passed</p>
          </div>
          <div className="bg-white dark:bg-slate-800 border rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-red-600">{results.summary.failed}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Failed</p>
          </div>
          <div className="bg-white dark:bg-slate-800 border rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-gray-600 dark:text-gray-300">{formatDuration(results.duration)}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Duration</p>
          </div>
        </div>
      )}
      
      {/* Meta info */}
      {results && (
        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 flex-wrap">
          <span className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            {new Date(results.startTime).toLocaleString()}
          </span>
          <span className="flex items-center gap-1">
            <Target className="w-4 h-4" />
            {results.environment}
          </span>
          <StatusBadge status={results.overallStatus} size="sm" />
        </div>
      )}
      
      {/* Tabs */}
      <div className="flex border-b">
        <button
          onClick={() => setView('latest')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            view === 'latest' 
              ? 'border-blue-500 text-blue-600' 
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700'
          }`}
        >
          Latest Results
        </button>
        <button
          onClick={() => setView('history')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            view === 'history' 
              ? 'border-blue-500 text-blue-600' 
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700'
          }`}
        >
          History ({history.length})
        </button>
      </div>
      
      {view === 'latest' && results && (
        <>
          {/* Filters */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search tests..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm"
            >
              <option value="all">All Suites</option>
              <option value="passed">Passed Only</option>
              <option value="failed">Failed Only</option>
            </select>
          </div>
          
          {/* Suite Results */}
          <div className="space-y-1">
            {filteredSuites.map((suite, idx) => (
              <SuitePanel key={idx} suite={suite} />
            ))}
            
            {filteredSuites.length === 0 && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No matching test suites</p>
              </div>
            )}
          </div>
        </>
      )}
      
      {view === 'history' && (
        <div className="space-y-2">
          {history.map((run) => (
            <div 
              key={run.id}
              className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 border rounded-lg hover:bg-gray-50"
            >
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${
                  run.overallStatus === 'passed' ? 'bg-green-500' : 'bg-red-500'
                }`} />
                <div>
                  <p className="text-sm font-medium">
                    {new Date(run.startTime).toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {run.environment} • {run.summary.total} tests
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right text-sm">
                  <span className="text-green-600">{run.summary.passed}✓</span>
                  {run.summary.failed > 0 && <span className="text-red-600 ml-2">{run.summary.failed}✗</span>}
                </div>
                <div className={`px-2 py-0.5 rounded text-xs font-medium ${
                  run.summary.passRate === 100 ? 'bg-green-100 dark:bg-green-900/30 text-green-700' :
                  run.summary.passRate >= 80 ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700' :
                  'bg-red-100 dark:bg-red-900/30 text-red-700'
                }`}>
                  {run.summary.passRate}%
                </div>
              </div>
            </div>
          ))}
          
          {history.length === 0 && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No test history available</p>
              <p className="text-xs mt-1">Run tests to start building history</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
