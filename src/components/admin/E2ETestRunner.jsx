/**
 * E2ETestRunner - World-Class Browser E2E Test Runner
 * 
 * Integrates Playwright E2E tests into the Admin Command Center.
 * 
 * FEATURES:
 * - Environment selection (Local, Dev, Test)
 * - Journey-based test organization (Prep, Daily Practice, Content, Zones)
 * - Visual test coverage dashboard
 * - Configure test credentials
 * - View test results with errors and screenshots
 * - Real-time results from Firestore
 * 
 * TEST COVERAGE: 133 automated test scenarios in 7 suites
 */

import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Copy,
  Check,
  Lock,
  Shield,
  Target,
  UserCheck,
  Library,
  GraduationCap,
  Map,
  PlayCircle,
  BarChart3,
  Sun,
  Moon,
  Globe,
  Image,
  ExternalLink
} from 'lucide-react';
import { useAppServices } from '../../services/useAppServices';
import { 
  doc,
  onSnapshot
} from 'firebase/firestore';
import { TEST_SUITES, TOTAL_TEST_COUNT, QUICK_COMMAND_COUNTS, ENVIRONMENTS } from './testSuiteConfig';

// ═══════════════════════════════════════════════════════════════════════════════
// E2E Test Runner Component
// ═══════════════════════════════════════════════════════════════════════════════

const E2ETestRunner = () => {
  const { db } = useAppServices();
  
  // Configuration state
  const [showSuites, setShowSuites] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [testPassword, setTestPassword] = useState('');
  const [selectedEnv, setSelectedEnv] = useState('test');
  const [copiedCommand, setCopiedCommand] = useState(false);
  const [firestoreResults, setFirestoreResults] = useState(null);
  const [expandedFailures, setExpandedFailures] = useState(new Set());
  
  // Load saved configuration
  useEffect(() => {
    const savedConfig = localStorage.getItem('e2e-test-config');
    if (savedConfig) {
      try {
        const config = JSON.parse(savedConfig);
        setTestEmail(config.email || '');
        setSelectedEnv(config.env || 'test');
      } catch (e) {
        console.error('Failed to load saved config:', e);
      }
    }
  }, []);
  
  // Save configuration when changed
  useEffect(() => {
    localStorage.setItem('e2e-test-config', JSON.stringify({
      email: testEmail,
      env: selectedEnv
    }));
  }, [testEmail, selectedEnv]);
  
  // Load latest test results from Firestore
  useEffect(() => {
    if (!db) return;
    
    const unsubscribe = onSnapshot(
      doc(db, 'metadata', 'e2e-test-results'),
      (snapshot) => {
        if (snapshot.exists()) {
          setFirestoreResults(snapshot.data());
        }
      },
      (error) => {
        console.error('Error loading test results:', error);
      }
    );
    
    return () => unsubscribe();
  }, [db]);
  
  // Generate command with selected environment
  const getCommand = (baseCmd) => {
    return `E2E_ENV=${selectedEnv} ${baseCmd}`;
  };
  
  // Copy command helper
  const copyCmd = (cmd, key) => {
    navigator.clipboard.writeText(getCommand(cmd));
    setCopiedCommand(key);
    setTimeout(() => setCopiedCommand(false), 2000);
  };
  
  // Toggle expanded failure
  const toggleFailure = (idx) => {
    setExpandedFailures(prev => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
      }
      return next;
    });
  };
  
  return (
    <div className="space-y-6">
      {/* Developer Config - Environment & Credentials */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-corporate-navy flex items-center gap-2">
            <Lock className="w-4 h-4 text-corporate-teal" />
            Test Configuration
          </h4>
        </div>
        
        {/* Environment Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
            <Globe className="w-3 h-3 inline mr-1" />
            Target Environment
          </label>
          <div className="flex gap-2">
            {ENVIRONMENTS.map(env => (
              <button
                key={env.id}
                onClick={() => setSelectedEnv(env.id)}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors
                  ${selectedEnv === env.id 
                    ? 'bg-corporate-teal text-white' 
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200'}`}
              >
                {env.name}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {ENVIRONMENTS.find(e => e.id === selectedEnv)?.url}
          </p>
        </div>
        
        {/* Credentials */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Test Email</label>
            <input
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="admin@example.com"
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-corporate-teal/50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Test Password</label>
            <input
              type="password"
              value={testPassword}
              onChange={(e) => setTestPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-corporate-teal/50"
            />
          </div>
        </div>
        
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
          <p className="text-xs text-blue-700">
            <strong>Before running tests:</strong> Set these environment variables in your terminal:
          </p>
          <code className="block mt-1 text-xs bg-blue-100 dark:bg-blue-900/30 p-2 rounded font-mono">
            export E2E_ENV={selectedEnv}<br/>
            export E2E_ADMIN_EMAIL="{testEmail || 'your-email'}"<br/>
            export E2E_ADMIN_PASSWORD="{testPassword ? '••••••••' : 'your-password'}"
          </code>
        </div>
      </div>

      {/* Quick Run Commands */}
      <div className="bg-gradient-to-r from-corporate-teal/10 to-blue-50 border border-corporate-teal/30 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-corporate-teal rounded-lg">
            <PlayCircle className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-corporate-navy text-lg">Quick Run Commands</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 mb-4">
              Copy and run in terminal. Tests run against <strong>{ENVIRONMENTS.find(e => e.id === selectedEnv)?.name}</strong>.
            </p>
            
            <div className="grid gap-3">
              {/* Smoke Test */}
              <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 text-xs font-bold rounded">CRITICAL</span>
                    <span className="font-medium text-sm">Smoke Test ({QUICK_COMMAND_COUNTS.smoke} tests)</span>
                  </div>
                  <button
                    onClick={() => copyCmd('npm run e2e:smoke', 'smoke')}
                    className="px-3 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 rounded text-xs font-mono flex items-center gap-2"
                  >
                    {copiedCommand === 'smoke' ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                    npm run e2e:smoke
                  </button>
                </div>
              </div>
              
              {/* Auth Test */}
              <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 text-xs font-bold rounded">HIGH</span>
                    <span className="font-medium text-sm">Authentication Tests ({QUICK_COMMAND_COUNTS.auth} tests)</span>
                  </div>
                  <button
                    onClick={() => copyCmd('npm run e2e:auth', 'auth')}
                    className="px-3 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 rounded text-xs font-mono flex items-center gap-2"
                  >
                    {copiedCommand === 'auth' ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                    npm run e2e:auth
                  </button>
                </div>
              </div>
              
              {/* All Suites */}
              <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 text-xs font-bold rounded">FULL</span>
                    <span className="font-medium text-sm">All Test Suites ({QUICK_COMMAND_COUNTS.suites} tests, ~10 min)</span>
                  </div>
                  <button
                    onClick={() => copyCmd('npx playwright test --project=all-suites', 'all')}
                    className="px-3 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 rounded text-xs font-mono flex items-center gap-2"
                  >
                    {copiedCommand === 'all' ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                    npx playwright test --project=all-suites
                  </button>
                </div>
              </div>
              
              {/* Debug/UI Mode */}
              <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 text-xs font-bold rounded">DEBUG</span>
                    <span className="font-medium text-sm">Interactive UI Mode (watch tests)</span>
                  </div>
                  <button
                    onClick={() => copyCmd('npm run e2e:ui', 'ui')}
                    className="px-3 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 rounded text-xs font-mono flex items-center gap-2"
                  >
                    {copiedCommand === 'ui' ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                    npm run e2e:ui
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Individual Test Suites (collapsible) */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <button 
          onClick={() => setShowSuites(!showSuites)}
          className="w-full flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-blue-600" />
            <span className="font-semibold text-sm text-gray-700 dark:text-gray-200">
              Individual Test Suites ({TOTAL_TEST_COUNT} tests)
            </span>
          </div>
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showSuites ? 'rotate-180' : ''}`} />
        </button>
        
        {showSuites && (
          <div className="mt-4 grid grid-cols-2 gap-2">
            {/* Auth Suite */}
            <button
              onClick={() => copyCmd(`npx playwright test --project=${TEST_SUITES.auth.id}`, TEST_SUITES.auth.id)}
              className="px-3 py-2 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 rounded border text-xs font-mono flex items-center justify-between gap-2"
            >
              <span className="flex items-center gap-2">
                <Shield className="w-3 h-3 text-gray-500 dark:text-gray-400" />
                {TEST_SUITES.auth.name} ({TEST_SUITES.auth.count})
              </span>
              {copiedCommand === TEST_SUITES.auth.id ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3 text-gray-400" />}
            </button>
            
            {/* Prep Suite */}
            <button
              onClick={() => copyCmd(`npx playwright test --project=${TEST_SUITES.prep.id}`, TEST_SUITES.prep.id)}
              className="px-3 py-2 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 rounded border text-xs font-mono flex items-center justify-between gap-2"
            >
              <span className="flex items-center gap-2">
                <UserCheck className="w-3 h-3 text-purple-500" />
                {TEST_SUITES.prep.name} ({TEST_SUITES.prep.count})
              </span>
              {copiedCommand === TEST_SUITES.prep.id ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3 text-gray-400" />}
            </button>
            
            {/* AM Suite */}
            <button
              onClick={() => copyCmd(`npx playwright test --project=${TEST_SUITES.am.id}`, TEST_SUITES.am.id)}
              className="px-3 py-2 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 rounded border text-xs font-mono flex items-center justify-between gap-2"
            >
              <span className="flex items-center gap-2">
                <Sun className="w-3 h-3 text-amber-500" />
                {TEST_SUITES.am.name} ({TEST_SUITES.am.count})
              </span>
              {copiedCommand === TEST_SUITES.am.id ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3 text-gray-400" />}
            </button>
            
            {/* PM Suite */}
            <button
              onClick={() => copyCmd(`npx playwright test --project=${TEST_SUITES.pm.id}`, TEST_SUITES.pm.id)}
              className="px-3 py-2 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 rounded border text-xs font-mono flex items-center justify-between gap-2"
            >
              <span className="flex items-center gap-2">
                <Moon className="w-3 h-3 text-indigo-500" />
                {TEST_SUITES.pm.name} ({TEST_SUITES.pm.count})
              </span>
              {copiedCommand === TEST_SUITES.pm.id ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3 text-gray-400" />}
            </button>
            
            {/* Content Suite */}
            <button
              onClick={() => copyCmd(`npx playwright test --project=${TEST_SUITES.content.id}`, TEST_SUITES.content.id)}
              className="px-3 py-2 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 rounded border text-xs font-mono flex items-center justify-between gap-2"
            >
              <span className="flex items-center gap-2">
                <Library className="w-3 h-3 text-blue-500" />
                {TEST_SUITES.content.name} ({TEST_SUITES.content.count})
              </span>
              {copiedCommand === TEST_SUITES.content.id ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3 text-gray-400" />}
            </button>
            
            {/* Post Suite */}
            <button
              onClick={() => copyCmd(`npx playwright test --project=${TEST_SUITES.post.id}`, TEST_SUITES.post.id)}
              className="px-3 py-2 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 rounded border text-xs font-mono flex items-center justify-between gap-2"
            >
              <span className="flex items-center gap-2">
                <GraduationCap className="w-3 h-3 text-green-500" />
                {TEST_SUITES.post.name} ({TEST_SUITES.post.count})
              </span>
              {copiedCommand === TEST_SUITES.post.id ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3 text-gray-400" />}
            </button>
            
            {/* Zones Suite */}
            <button
              onClick={() => copyCmd(`npx playwright test --project=${TEST_SUITES.zones.id}`, TEST_SUITES.zones.id)}
              className="px-3 py-2 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 rounded border text-xs font-mono flex items-center justify-between gap-2"
            >
              <span className="flex items-center gap-2">
                <Map className="w-3 h-3 text-teal-500" />
                {TEST_SUITES.zones.name} ({TEST_SUITES.zones.count})
              </span>
              {copiedCommand === TEST_SUITES.zones.id ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3 text-gray-400" />}
            </button>
            
            {/* ALL */}
            <button
              onClick={() => copyCmd('npx playwright test --project=all-suites', 'all-suites')}
              className="px-3 py-2 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 rounded border border-blue-200 dark:border-blue-800 text-xs font-mono flex items-center justify-between gap-2"
            >
              <span className="flex items-center gap-2">
                <Target className="w-3 h-3 text-blue-600" />
                <strong>ALL ({TOTAL_TEST_COUNT})</strong>
              </span>
              {copiedCommand === 'all-suites' ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3 text-blue-400" />}
            </button>
          </div>
        )}
      </div>

      {/* Latest Results from Firestore */}
      {firestoreResults && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-bold text-corporate-navy flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-corporate-teal" />
              Latest Test Results
              {firestoreResults.environment && (
                <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded">
                  {firestoreResults.environment}
                </span>
              )}
            </h4>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {firestoreResults.updatedAt ? new Date(firestoreResults.updatedAt).toLocaleString() : 'Unknown'}
            </span>
          </div>
          
          <div className="grid grid-cols-4 gap-3">
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 text-center">
              <div className="text-xl font-bold text-green-700">{firestoreResults.summary?.passed || 0}</div>
              <div className="text-xs text-green-600">Passed</div>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-center">
              <div className="text-xl font-bold text-red-700">{firestoreResults.summary?.failed || 0}</div>
              <div className="text-xs text-red-600">Failed</div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 text-center">
              <div className="text-xl font-bold text-gray-700 dark:text-gray-200">{firestoreResults.summary?.skipped || 0}</div>
              <div className="text-xs text-gray-600 dark:text-gray-300">Skipped</div>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-center">
              <div className="text-xl font-bold text-blue-700">{firestoreResults.summary?.passRate || 0}%</div>
              <div className="text-xs text-blue-600">Pass Rate</div>
            </div>
          </div>
          
          {/* Duration info */}
          {firestoreResults.duration && (
            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
              Duration: {(firestoreResults.duration / 1000).toFixed(1)}s
            </div>
          )}
          
          {/* Show failures with expandable details */}
          {firestoreResults.failedTests?.length > 0 && (
            <div className="mt-4 border border-red-200 dark:border-red-800 rounded-lg overflow-hidden">
              <div className="bg-red-50 dark:bg-red-900/20 px-3 py-2 text-sm font-medium text-red-700 flex items-center gap-2">
                <XCircle className="w-4 h-4" />
                Failed Tests ({firestoreResults.summary?.failed || 0})
              </div>
              <div className="divide-y divide-red-100">
                {firestoreResults.failedTests.map((suite, idx) => (
                  <div key={idx} className="bg-white dark:bg-slate-800">
                    <button
                      onClick={() => toggleFailure(idx)}
                      className="w-full px-3 py-2 flex items-center justify-between hover:bg-red-50/50"
                    >
                      <div className="flex items-center gap-2">
                        {expandedFailures.has(idx) ? (
                          <ChevronDown className="w-4 h-4 text-red-400" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-red-400" />
                        )}
                        <span className="font-medium text-sm text-red-800">{suite.name}</span>
                        <span className="text-xs text-red-500">({suite.failed} failed)</span>
                      </div>
                    </button>
                    
                    {expandedFailures.has(idx) && suite.tests?.map((test, tidx) => (
                      <div key={tidx} className="px-6 py-3 bg-red-50/30 dark:bg-red-900/20/30 border-t border-red-100">
                        <div className="flex items-start gap-2">
                          <XCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm text-red-800">{test.name}</div>
                            {test.error?.message && (
                              <div className="mt-1 p-2 bg-red-100 dark:bg-red-900/30 rounded text-xs text-red-700 font-mono overflow-x-auto">
                                {test.error.message}
                              </div>
                            )}
                            {/* Screenshot link if available */}
                            {test.screenshotUrl && (
                              <a 
                                href={test.screenshotUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-2 inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
                              >
                                <Image className="w-3 h-3" />
                                View Screenshot
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* All passed message */}
          {firestoreResults.summary?.failed === 0 && firestoreResults.summary?.passed > 0 && (
            <div className="mt-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 text-center">
              <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <div className="font-medium text-green-800">All Tests Passed!</div>
              <div className="text-sm text-green-600">{firestoreResults.summary.passed} tests completed successfully</div>
            </div>
          )}
        </div>
      )}
      
      {/* No results yet */}
      {!firestoreResults && (
        <div className="bg-gray-50 dark:bg-gray-800 border border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center">
          <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h4 className="font-medium text-gray-700 dark:text-gray-200 mb-2">No Test Results Yet</h4>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Run tests with the Firestore reporter to see results here.
          </p>
        </div>
      )}

      {/* Quick Tips */}
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
        <h4 className="font-medium text-amber-800 mb-2 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          Tips
        </h4>
        <ul className="text-sm text-amber-700 space-y-1">
          <li>• Run <code className="bg-amber-100 dark:bg-amber-900/30 px-1 rounded">npm run e2e:smoke</code> before every deploy</li>
          <li>• Use <code className="bg-amber-100 dark:bg-amber-900/30 px-1 rounded">npm run e2e:ui</code> to debug test failures interactively</li>
          <li>• Screenshots saved to <code className="bg-amber-100 dark:bg-amber-900/30 px-1 rounded">test-results/</code> on failures</li>
          <li>• View HTML report: <code className="bg-amber-100 dark:bg-amber-900/30 px-1 rounded">npx playwright show-report</code></li>
        </ul>
      </div>
    </div>
  );
};

export default E2ETestRunner;
