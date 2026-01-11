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

import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  ChevronDown,
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
  Moon
} from 'lucide-react';
import { useAppServices } from '../../services/useAppServices';
import { 
  doc,
  onSnapshot
} from 'firebase/firestore';
import { TEST_SUITES, TOTAL_TEST_COUNT, QUICK_COMMAND_COUNTS } from './testSuiteConfig';

// ═══════════════════════════════════════════════════════════════════════════════
// E2E Test Runner Component
// ═══════════════════════════════════════════════════════════════════════════════

const E2ETestRunner = () => {
  const { db } = useAppServices();
  
  // Configuration state
  const [showConfig, setShowConfig] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [testPassword, setTestPassword] = useState('');
  const [copiedCommand, setCopiedCommand] = useState(false);
  const [firestoreResults, setFirestoreResults] = useState(null);
  
  // Load saved configuration
  useEffect(() => {
    const savedConfig = localStorage.getItem('e2e-test-config');
    if (savedConfig) {
      try {
        const config = JSON.parse(savedConfig);
        setTestEmail(config.email || '');
      } catch (e) {
        console.error('Failed to load saved config:', e);
      }
    }
  }, []);
  
  // Save configuration when changed
  useEffect(() => {
    localStorage.setItem('e2e-test-config', JSON.stringify({
      email: testEmail
    }));
  }, [testEmail]);
  
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
  
  return (
    <div className="space-y-6">
      {/* Developer Config - FIRST (needed for tests to work) */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-corporate-navy flex items-center gap-2">
            <Lock className="w-4 h-4 text-corporate-teal" />
            Developer Config
          </h4>
          <span className="text-xs text-gray-500">Required for authenticated tests</span>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Test Email</label>
            <input
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="admin@example.com"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-corporate-teal/50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Test Password</label>
            <input
              type="password"
              value={testPassword}
              onChange={(e) => setTestPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-corporate-teal/50"
            />
          </div>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-xs text-blue-700">
            <strong>Before running tests:</strong> Set these in your terminal:
          </p>
          <code className="block mt-1 text-xs bg-blue-100 p-2 rounded font-mono">
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
            <p className="text-sm text-gray-600 mt-1 mb-4">
              Copy and run these in your terminal from the project root.
            </p>
            
            <div className="grid gap-3">
              {/* Smoke Test */}
              <div className="bg-white rounded-lg border border-gray-200 p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded">CRITICAL</span>
                    <span className="font-medium text-sm">Smoke Test ({QUICK_COMMAND_COUNTS.smoke} tests)</span>
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
                    <span className="font-medium text-sm">Authentication Tests ({QUICK_COMMAND_COUNTS.auth} tests)</span>
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
              
              {/* Full Test */}
              <div className="bg-white rounded-lg border border-gray-200 p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded">FULL</span>
                    <span className="font-medium text-sm">All Tests ({QUICK_COMMAND_COUNTS.full} tests, ~15 min)</span>
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
              
              {/* Debug/UI Mode */}
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
            </div>
          </div>
        </div>
      </div>

      {/* Full Test Suites (collapsible) */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <button 
          onClick={() => setShowConfig(!showConfig)}
          className="w-full flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-blue-600" />
            <span className="font-semibold text-sm text-gray-700">
              Individual Test Suites ({TOTAL_TEST_COUNT} tests)
            </span>
          </div>
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showConfig ? 'rotate-180' : ''}`} />
        </button>
        
        {showConfig && (
          <div className="mt-4 grid grid-cols-2 gap-2">
            {/* Auth Suite */}
            <button
              onClick={() => {
                navigator.clipboard.writeText(`E2E_ENV=test npx playwright test --project=${TEST_SUITES.auth.id}`);
                setCopiedCommand(TEST_SUITES.auth.id);
                setTimeout(() => setCopiedCommand(false), 2000);
              }}
              className="px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded border text-xs font-mono flex items-center justify-between gap-2"
            >
              <span className="flex items-center gap-2">
                <Shield className="w-3 h-3 text-gray-500" />
                {TEST_SUITES.auth.name} ({TEST_SUITES.auth.count})
              </span>
              {copiedCommand === TEST_SUITES.auth.id ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3 text-gray-400" />}
            </button>
            
            {/* Prep Suite */}
            <button
              onClick={() => {
                navigator.clipboard.writeText(`E2E_ENV=test npx playwright test --project=${TEST_SUITES.prep.id}`);
                setCopiedCommand(TEST_SUITES.prep.id);
                setTimeout(() => setCopiedCommand(false), 2000);
              }}
              className="px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded border text-xs font-mono flex items-center justify-between gap-2"
            >
              <span className="flex items-center gap-2">
                <UserCheck className="w-3 h-3 text-purple-500" />
                {TEST_SUITES.prep.name} ({TEST_SUITES.prep.count})
              </span>
              {copiedCommand === TEST_SUITES.prep.id ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3 text-gray-400" />}
            </button>
            
            {/* AM Suite */}
            <button
              onClick={() => {
                navigator.clipboard.writeText(`E2E_ENV=test npx playwright test --project=${TEST_SUITES.am.id}`);
                setCopiedCommand(TEST_SUITES.am.id);
                setTimeout(() => setCopiedCommand(false), 2000);
              }}
              className="px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded border text-xs font-mono flex items-center justify-between gap-2"
            >
              <span className="flex items-center gap-2">
                <Sun className="w-3 h-3 text-amber-500" />
                {TEST_SUITES.am.name} ({TEST_SUITES.am.count})
              </span>
              {copiedCommand === TEST_SUITES.am.id ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3 text-gray-400" />}
            </button>
            
            {/* PM Suite */}
            <button
              onClick={() => {
                navigator.clipboard.writeText(`E2E_ENV=test npx playwright test --project=${TEST_SUITES.pm.id}`);
                setCopiedCommand(TEST_SUITES.pm.id);
                setTimeout(() => setCopiedCommand(false), 2000);
              }}
              className="px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded border text-xs font-mono flex items-center justify-between gap-2"
            >
              <span className="flex items-center gap-2">
                <Moon className="w-3 h-3 text-indigo-500" />
                {TEST_SUITES.pm.name} ({TEST_SUITES.pm.count})
              </span>
              {copiedCommand === TEST_SUITES.pm.id ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3 text-gray-400" />}
            </button>
            
            {/* Content Suite */}
            <button
              onClick={() => {
                navigator.clipboard.writeText(`E2E_ENV=test npx playwright test --project=${TEST_SUITES.content.id}`);
                setCopiedCommand(TEST_SUITES.content.id);
                setTimeout(() => setCopiedCommand(false), 2000);
              }}
              className="px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded border text-xs font-mono flex items-center justify-between gap-2"
            >
              <span className="flex items-center gap-2">
                <Library className="w-3 h-3 text-blue-500" />
                {TEST_SUITES.content.name} ({TEST_SUITES.content.count})
              </span>
              {copiedCommand === TEST_SUITES.content.id ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3 text-gray-400" />}
            </button>
            
            {/* Post Suite */}
            <button
              onClick={() => {
                navigator.clipboard.writeText(`E2E_ENV=test npx playwright test --project=${TEST_SUITES.post.id}`);
                setCopiedCommand(TEST_SUITES.post.id);
                setTimeout(() => setCopiedCommand(false), 2000);
              }}
              className="px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded border text-xs font-mono flex items-center justify-between gap-2"
            >
              <span className="flex items-center gap-2">
                <GraduationCap className="w-3 h-3 text-green-500" />
                {TEST_SUITES.post.name} ({TEST_SUITES.post.count})
              </span>
              {copiedCommand === TEST_SUITES.post.id ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3 text-gray-400" />}
            </button>
            
            {/* Zones Suite */}
            <button
              onClick={() => {
                navigator.clipboard.writeText(`E2E_ENV=test npx playwright test --project=${TEST_SUITES.zones.id}`);
                setCopiedCommand(TEST_SUITES.zones.id);
                setTimeout(() => setCopiedCommand(false), 2000);
              }}
              className="px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded border text-xs font-mono flex items-center justify-between gap-2"
            >
              <span className="flex items-center gap-2">
                <Map className="w-3 h-3 text-teal-500" />
                {TEST_SUITES.zones.name} ({TEST_SUITES.zones.count})
              </span>
              {copiedCommand === TEST_SUITES.zones.id ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3 text-gray-400" />}
            </button>
            
            {/* ALL */}
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
                <strong>ALL ({TOTAL_TEST_COUNT})</strong>
              </span>
              {copiedCommand === 'all-suites' ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3 text-blue-400" />}
            </button>
          </div>
        )}
      </div>

      {/* Latest Results from Firestore */}
      {firestoreResults && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-bold text-corporate-navy flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-corporate-teal" />
              Latest Test Results
            </h4>
            <span className="text-xs text-gray-500">
              {firestoreResults.updatedAt ? new Date(firestoreResults.updatedAt).toLocaleString() : 'Unknown'}
            </span>
          </div>
          
          <div className="grid grid-cols-4 gap-3">
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
              <div className="text-xl font-bold text-green-700">{firestoreResults.summary?.passed || 0}</div>
              <div className="text-xs text-green-600">Passed</div>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
              <div className="text-xl font-bold text-red-700">{firestoreResults.summary?.failed || 0}</div>
              <div className="text-xs text-red-600">Failed</div>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
              <div className="text-xl font-bold text-gray-700">{firestoreResults.summary?.skipped || 0}</div>
              <div className="text-xs text-gray-600">Skipped</div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
              <div className="text-xl font-bold text-blue-700">{firestoreResults.summary?.passRate || 0}%</div>
              <div className="text-xs text-blue-600">Pass Rate</div>
            </div>
          </div>
          
          {/* Show failures if any */}
          {firestoreResults.failedTests?.length > 0 && (
            <div className="mt-3 border border-red-200 rounded-lg overflow-hidden">
              <div className="bg-red-50 px-3 py-2 text-sm font-medium text-red-700 flex items-center gap-2">
                <XCircle className="w-4 h-4" />
                Failed Tests
              </div>
              <div className="max-h-40 overflow-y-auto">
                {firestoreResults.failedTests.map((suite, idx) => (
                  <div key={idx} className="px-3 py-2 border-t border-red-100">
                    <div className="font-medium text-sm text-red-800">{suite.name}</div>
                    {suite.tests?.map((test, tidx) => (
                      <div key={tidx} className="text-xs text-red-600 ml-4 mt-1">
                        • {test.name}
                        {test.error?.message && (
                          <span className="text-red-400 ml-2">— {test.error.message.slice(0, 100)}</span>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Quick Tips */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <h4 className="font-medium text-amber-800 mb-2 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          Tips
        </h4>
        <ul className="text-sm text-amber-700 space-y-1">
          <li>• Run <code className="bg-amber-100 px-1 rounded">npm run e2e:smoke</code> before every deploy</li>
          <li>• Use <code className="bg-amber-100 px-1 rounded">npm run e2e:ui</code> to debug test failures interactively</li>
          <li>• Screenshots are auto-captured on failures in <code className="bg-amber-100 px-1 rounded">test-results/</code></li>
        </ul>
      </div>
    </div>
  );
};

export default E2ETestRunner;
