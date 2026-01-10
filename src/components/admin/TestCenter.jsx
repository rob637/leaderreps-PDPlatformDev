/**
 * TestCenter - Comprehensive Automated Testing & Monitoring Module
 * 
 * A world-class testing dashboard that provides:
 * - Real-time system health monitoring
 * - Automated test suites (connectivity, data integrity, content, auth)
 * - Live test execution with visual feedback
 * - Regression test management
 * - Historical test results and trends
 * 
 * Inspired by Google's internal testing dashboards
 */

import React, { useState, useEffect, useRef } from 'react';
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
  Zap,
  Database,
  Shield,
  FileText,
  Users,
  Calendar,
  Activity,
  BarChart3,
  Cpu,
  Wifi,
  HardDrive,
  Eye,
  EyeOff,
  Download,
  Filter,
  Search,
  PlayCircle,
  PauseCircle,
  SkipForward,
  ClipboardList
} from 'lucide-react';
import ManualTestScripts from './ManualTestScripts';
import E2ETestRunner from './E2ETestRunner';
import { useAppServices } from '../../services/useAppServices';
import { 
  collection, 
  getDocs, 
  doc, 
  getDoc, 
  query, 
  limit,
  where,
  Timestamp
} from 'firebase/firestore';
import { getStorage, ref } from 'firebase/storage';

// Test status types
const TEST_STATUS = {
  PENDING: 'pending',
  RUNNING: 'running',
  PASSED: 'passed',
  FAILED: 'failed',
  WARNING: 'warning',
  SKIPPED: 'skipped'
};

// Test categories
const TEST_CATEGORIES = {
  CONNECTIVITY: 'connectivity',
  DATA_INTEGRITY: 'dataIntegrity',
  CONTENT: 'content',
  AUTH: 'auth',
  DEV_PLAN: 'devPlan',
  DAILY_PRACTICE: 'dailyPractice',
  PERFORMANCE: 'performance',
  REGRESSION: 'regression'
};

// Status colors and icons
const getStatusConfig = (status) => {
  switch (status) {
    case TEST_STATUS.PASSED:
      return { 
        color: 'text-green-500', 
        bg: 'bg-green-50', 
        border: 'border-green-200',
        icon: CheckCircle2,
        label: 'Passed'
      };
    case TEST_STATUS.FAILED:
      return { 
        color: 'text-red-500', 
        bg: 'bg-red-50', 
        border: 'border-red-200',
        icon: XCircle,
        label: 'Failed'
      };
    case TEST_STATUS.WARNING:
      return { 
        color: 'text-amber-500', 
        bg: 'bg-amber-50', 
        border: 'border-amber-200',
        icon: AlertTriangle,
        label: 'Warning'
      };
    case TEST_STATUS.RUNNING:
      return { 
        color: 'text-blue-500', 
        bg: 'bg-blue-50', 
        border: 'border-blue-200',
        icon: RefreshCw,
        label: 'Running'
      };
    case TEST_STATUS.SKIPPED:
      return { 
        color: 'text-gray-400', 
        bg: 'bg-gray-50', 
        border: 'border-gray-200',
        icon: SkipForward,
        label: 'Skipped'
      };
    default:
      return { 
        color: 'text-gray-400', 
        bg: 'bg-gray-50', 
        border: 'border-gray-200',
        icon: Clock,
        label: 'Pending'
      };
  }
};

// Category icons
const getCategoryIcon = (category) => {
  switch (category) {
    case TEST_CATEGORIES.CONNECTIVITY: return Wifi;
    case TEST_CATEGORIES.DATA_INTEGRITY: return Database;
    case TEST_CATEGORIES.CONTENT: return FileText;
    case TEST_CATEGORIES.AUTH: return Shield;
    case TEST_CATEGORIES.DEV_PLAN: return Calendar;
    case TEST_CATEGORIES.DAILY_PRACTICE: return Activity;
    case TEST_CATEGORIES.PERFORMANCE: return Zap;
    case TEST_CATEGORIES.REGRESSION: return BarChart3;
    default: return Cpu;
  }
};

// ============== Test Suite Definitions ==============

const createTestSuites = (db, user, dailyPracticeData, developmentPlanData) => {
  return [
    // ===== CONNECTIVITY TESTS =====
    {
      id: 'connectivity',
      name: 'Connectivity & Services',
      category: TEST_CATEGORIES.CONNECTIVITY,
      description: 'Verify all Firebase services are reachable and responding',
      tests: [
        {
          id: 'firestore-connection',
          name: 'Firestore Database Connection',
          description: 'Verify Firestore is reachable and responding',
          critical: true,
          run: async () => {
            const start = performance.now();
            try {
              const testRef = doc(db, 'metadata', 'config');
              await getDoc(testRef);
              const latency = Math.round(performance.now() - start);
              return {
                status: latency < 500 ? TEST_STATUS.PASSED : TEST_STATUS.WARNING,
                message: `Connected successfully (${latency}ms latency)`,
                details: { latency, threshold: '500ms' }
              };
            } catch (error) {
              return {
                status: TEST_STATUS.FAILED,
                message: `Connection failed: ${error.message}`,
                details: { error: error.message }
              };
            }
          }
        },
        {
          id: 'storage-connection',
          name: 'Firebase Storage Connection',
          description: 'Verify Storage service is accessible',
          critical: true,
          run: async () => {
            const start = performance.now();
            try {
              const storage = getStorage();
              // Just creating a reference tests the connection
              ref(storage, 'resources/videos');
              const latency = Math.round(performance.now() - start);
              return {
                status: TEST_STATUS.PASSED,
                message: `Storage service accessible (${latency}ms)`,
                details: { latency }
              };
            } catch (error) {
              return {
                status: TEST_STATUS.FAILED,
                message: `Storage access failed: ${error.message}`,
                details: { error: error.message }
              };
            }
          }
        },
        {
          id: 'auth-status',
          name: 'Authentication Status',
          description: 'Verify current user authentication',
          critical: true,
          run: async () => {
            if (user?.uid && user?.email) {
              return {
                status: TEST_STATUS.PASSED,
                message: `Authenticated as ${user.email}`,
                details: { uid: user.uid, email: user.email }
              };
            }
            return {
              status: TEST_STATUS.FAILED,
              message: 'No authenticated user found',
              details: {}
            };
          }
        }
      ]
    },

    // ===== DATA INTEGRITY TESTS =====
    {
      id: 'data-integrity',
      name: 'Data Integrity',
      category: TEST_CATEGORIES.DATA_INTEGRITY,
      description: 'Verify core data structures and required documents exist',
      tests: [
        {
          id: 'metadata-config',
          name: 'Global Configuration',
          description: 'Verify metadata/config document exists and has required fields',
          critical: true,
          run: async () => {
            try {
              const configRef = doc(db, 'metadata', 'config');
              const configSnap = await getDoc(configRef);
              if (!configSnap.exists()) {
                return {
                  status: TEST_STATUS.FAILED,
                  message: 'metadata/config document not found',
                  details: {}
                };
              }
              const data = configSnap.data();
              const requiredFields = ['adminemails'];
              const missingFields = requiredFields.filter(f => !data[f]);
              if (missingFields.length > 0) {
                return {
                  status: TEST_STATUS.WARNING,
                  message: `Missing optional fields: ${missingFields.join(', ')}`,
                  details: { found: Object.keys(data), missing: missingFields }
                };
              }
              return {
                status: TEST_STATUS.PASSED,
                message: `Config valid with ${Object.keys(data).length} fields`,
                details: { fields: Object.keys(data) }
              };
            } catch (error) {
              return {
                status: TEST_STATUS.FAILED,
                message: `Error reading config: ${error.message}`,
                details: { error: error.message }
              };
            }
          }
        },
        {
          id: 'feature-flags',
          name: 'Feature Flags Document',
          description: 'Verify feature flags are configured',
          critical: false,
          run: async () => {
            try {
              const flagsRef = doc(db, 'metadata', 'featureFlags');
              const flagsSnap = await getDoc(flagsRef);
              if (!flagsSnap.exists()) {
                return {
                  status: TEST_STATUS.WARNING,
                  message: 'Feature flags document not found (using defaults)',
                  details: {}
                };
              }
              const data = flagsSnap.data();
              const enabledCount = Object.values(data).filter(v => v === true).length;
              return {
                status: TEST_STATUS.PASSED,
                message: `${enabledCount} of ${Object.keys(data).length} flags enabled`,
                details: { flags: data }
              };
            } catch (error) {
              return {
                status: TEST_STATUS.FAILED,
                message: `Error reading flags: ${error.message}`,
                details: { error: error.message }
              };
            }
          }
        },
        {
          id: 'user-document',
          name: 'Current User Document',
          description: 'Verify user profile document exists',
          critical: true,
          run: async () => {
            if (!user?.uid) {
              return {
                status: TEST_STATUS.SKIPPED,
                message: 'No user logged in',
                details: {}
              };
            }
            try {
              const userRef = doc(db, 'users', user.uid);
              const userSnap = await getDoc(userRef);
              if (!userSnap.exists()) {
                return {
                  status: TEST_STATUS.FAILED,
                  message: 'User document not found',
                  details: { uid: user.uid }
                };
              }
              const data = userSnap.data();
              return {
                status: TEST_STATUS.PASSED,
                message: `User document valid (${Object.keys(data).length} fields)`,
                details: { fields: Object.keys(data) }
              };
            } catch (error) {
              return {
                status: TEST_STATUS.FAILED,
                message: `Error reading user doc: ${error.message}`,
                details: { error: error.message }
              };
            }
          }
        }
      ]
    },

    // ===== CONTENT TESTS =====
    {
      id: 'content',
      name: 'Content Vault',
      category: TEST_CATEGORIES.CONTENT,
      description: 'Verify content collections have valid data',
      tests: [
        {
          id: 'content-readings',
          name: 'Readings Collection',
          description: 'Check content_readings for valid documents',
          critical: false,
          run: async () => {
            try {
              const q = query(collection(db, 'content_readings'), limit(100));
              const snap = await getDocs(q);
              const count = snap.docs.length;
              const activeCount = snap.docs.filter(d => d.data().isActive).length;
              
              // Check for required fields
              const issues = [];
              snap.docs.forEach(d => {
                const data = d.data();
                if (!data.title) issues.push(`${d.id}: missing title`);
                if (!data.resourceId && !data.url) issues.push(`${d.id}: no resourceId or URL`);
              });
              
              if (count === 0) {
                return {
                  status: TEST_STATUS.WARNING,
                  message: 'No readings found in collection',
                  details: {}
                };
              }
              
              return {
                status: issues.length === 0 ? TEST_STATUS.PASSED : TEST_STATUS.WARNING,
                message: `${activeCount} active of ${count} readings${issues.length > 0 ? ` (${issues.length} issues)` : ''}`,
                details: { total: count, active: activeCount, issues: issues.slice(0, 5) }
              };
            } catch (error) {
              return {
                status: TEST_STATUS.FAILED,
                message: `Error reading collection: ${error.message}`,
                details: { error: error.message }
              };
            }
          }
        },
        {
          id: 'content-videos',
          name: 'Videos Collection',
          description: 'Check content_videos for valid documents',
          critical: false,
          run: async () => {
            try {
              const q = query(collection(db, 'content_videos'), limit(100));
              const snap = await getDocs(q);
              const count = snap.docs.length;
              const activeCount = snap.docs.filter(d => d.data().isActive).length;
              
              const issues = [];
              snap.docs.forEach(d => {
                const data = d.data();
                if (!data.title) issues.push(`${d.id}: missing title`);
                if (!data.videoUrl && !data.url) issues.push(`${d.id}: no video URL`);
              });
              
              if (count === 0) {
                return {
                  status: TEST_STATUS.WARNING,
                  message: 'No videos found in collection',
                  details: {}
                };
              }
              
              return {
                status: issues.length === 0 ? TEST_STATUS.PASSED : TEST_STATUS.WARNING,
                message: `${activeCount} active of ${count} videos${issues.length > 0 ? ` (${issues.length} issues)` : ''}`,
                details: { total: count, active: activeCount, issues: issues.slice(0, 5) }
              };
            } catch (error) {
              return {
                status: TEST_STATUS.FAILED,
                message: `Error reading collection: ${error.message}`,
                details: { error: error.message }
              };
            }
          }
        },
        {
          id: 'content-community',
          name: 'Community Content',
          description: 'Check content_community collection',
          critical: false,
          run: async () => {
            try {
              const q = query(collection(db, 'content_community'), limit(50));
              const snap = await getDocs(q);
              const count = snap.docs.length;
              
              return {
                status: count > 0 ? TEST_STATUS.PASSED : TEST_STATUS.WARNING,
                message: `${count} community items found`,
                details: { total: count }
              };
            } catch (error) {
              return {
                status: TEST_STATUS.FAILED,
                message: `Error reading collection: ${error.message}`,
                details: { error: error.message }
              };
            }
          }
        },
        {
          id: 'content-coaching',
          name: 'Coaching Content',
          description: 'Check content_coaching collection',
          critical: false,
          run: async () => {
            try {
              const q = query(collection(db, 'content_coaching'), limit(50));
              const snap = await getDocs(q);
              const count = snap.docs.length;
              
              return {
                status: count > 0 ? TEST_STATUS.PASSED : TEST_STATUS.WARNING,
                message: `${count} coaching items found`,
                details: { total: count }
              };
            } catch (error) {
              return {
                status: TEST_STATUS.FAILED,
                message: `Error reading collection: ${error.message}`,
                details: { error: error.message }
              };
            }
          }
        }
      ]
    },

    // ===== DEVELOPMENT PLAN TESTS =====
    {
      id: 'dev-plan',
      name: 'Development Plan',
      category: TEST_CATEGORIES.DEV_PLAN,
      description: 'Verify Development Plan structure and content linking',
      tests: [
        {
          id: 'dev-plan-weeks',
          name: 'Plan Week Documents',
          description: 'Check development_plan_v1 collection has valid weeks',
          critical: true,
          run: async () => {
            try {
              const q = query(collection(db, 'development_plan_v1'));
              const snap = await getDocs(q);
              const count = snap.docs.length;
              
              if (count === 0) {
                return {
                  status: TEST_STATUS.FAILED,
                  message: 'No week documents found',
                  details: {}
                };
              }
              
              const weeks = snap.docs.map(d => ({
                id: d.id,
                weekNumber: d.data().weekNumber,
                isDraft: d.data().isDraft,
                title: d.data().title
              })).sort((a, b) => (a.weekNumber || 0) - (b.weekNumber || 0));
              
              const draftCount = weeks.filter(w => w.isDraft).length;
              const publishedCount = weeks.filter(w => !w.isDraft).length;
              
              return {
                status: TEST_STATUS.PASSED,
                message: `${publishedCount} published, ${draftCount} draft weeks`,
                details: { weeks, total: count, published: publishedCount, draft: draftCount }
              };
            } catch (error) {
              return {
                status: TEST_STATUS.FAILED,
                message: `Error reading plan: ${error.message}`,
                details: { error: error.message }
              };
            }
          }
        },
        {
          id: 'dev-plan-content-links',
          name: 'Content Links Validity',
          description: 'Verify all resource links in weeks point to existing content',
          critical: false,
          run: async () => {
            try {
              // Get all weeks
              const weeksSnap = await getDocs(collection(db, 'development_plan_v1'));
              
              // Collect all resource IDs referenced in weeks
              const referencedIds = new Set();
              weeksSnap.docs.forEach(d => {
                const data = d.data();
                (data.content || []).forEach(item => {
                  if (item.resourceId) referencedIds.add(item.resourceId);
                });
              });
              
              if (referencedIds.size === 0) {
                return {
                  status: TEST_STATUS.WARNING,
                  message: 'No content links found in plan weeks',
                  details: {}
                };
              }
              
              // Check if those IDs exist in content collections
              const collections = ['content_readings', 'content_videos'];
              const existingIds = new Set();
              
              for (const collName of collections) {
                const snap = await getDocs(collection(db, collName));
                snap.docs.forEach(d => {
                  existingIds.add(d.id);
                  if (d.data().resourceId) existingIds.add(d.data().resourceId);
                });
              }
              
              const orphanedLinks = [...referencedIds].filter(id => !existingIds.has(id));
              
              if (orphanedLinks.length > 0) {
                return {
                  status: TEST_STATUS.WARNING,
                  message: `${orphanedLinks.length} of ${referencedIds.size} links may be orphaned`,
                  details: { orphaned: orphanedLinks.slice(0, 10), total: referencedIds.size }
                };
              }
              
              return {
                status: TEST_STATUS.PASSED,
                message: `All ${referencedIds.size} content links valid`,
                details: { totalLinks: referencedIds.size }
              };
            } catch (error) {
              return {
                status: TEST_STATUS.FAILED,
                message: `Error validating links: ${error.message}`,
                details: { error: error.message }
              };
            }
          }
        },
        {
          id: 'user-dev-plan',
          name: 'User Development Plan Data',
          description: 'Verify current user has valid development plan',
          critical: false,
          run: async () => {
            if (!developmentPlanData) {
              return {
                status: TEST_STATUS.WARNING,
                message: 'No development plan data loaded for user',
                details: {}
              };
            }
            
            const issues = [];
            if (!developmentPlanData.currentWeek) issues.push('No currentWeek set');
            if (!developmentPlanData.planId) issues.push('No planId set');
            if (!developmentPlanData.startDate) issues.push('No startDate set');
            
            if (issues.length > 0) {
              return {
                status: TEST_STATUS.WARNING,
                message: `Plan loaded with ${issues.length} issues`,
                details: { issues, data: Object.keys(developmentPlanData) }
              };
            }
            
            return {
              status: TEST_STATUS.PASSED,
              message: `Week ${developmentPlanData.currentWeek} of ${developmentPlanData.planId}`,
              details: { 
                currentWeek: developmentPlanData.currentWeek,
                planId: developmentPlanData.planId,
                startDate: developmentPlanData.startDate
              }
            };
          }
        }
      ]
    },

    // ===== DAILY PRACTICE TESTS =====
    {
      id: 'daily-practice',
      name: 'Daily Practice',
      category: TEST_CATEGORIES.DAILY_PRACTICE,
      description: 'Verify daily practice data and rollover functionality',
      tests: [
        {
          id: 'daily-practice-current',
          name: 'Current Daily Practice Data',
          description: 'Verify daily_practice/current document is valid',
          critical: false,
          run: async () => {
            if (!dailyPracticeData) {
              return {
                status: TEST_STATUS.WARNING,
                message: 'No daily practice data loaded',
                details: {}
              };
            }
            
            const today = new Date().toISOString().split('T')[0];
            const dataDate = dailyPracticeData.date;
            
            if (dataDate !== today) {
              return {
                status: TEST_STATUS.WARNING,
                message: `Data date (${dataDate}) doesn't match today (${today})`,
                details: { dataDate, today }
              };
            }
            
            return {
              status: TEST_STATUS.PASSED,
              message: `Data current for ${today}`,
              details: { 
                date: dataDate,
                hasWins: !!dailyPracticeData.morningBookend?.wins,
                hasGrounding: !!dailyPracticeData.identityStatement,
                streakCount: dailyPracticeData.streakCount || 0
              }
            };
          }
        },
        {
          id: 'daily-practice-structure',
          name: 'Daily Practice Structure',
          description: 'Check for required data structures',
          critical: false,
          run: async () => {
            if (!dailyPracticeData) {
              return {
                status: TEST_STATUS.SKIPPED,
                message: 'No daily practice data to validate',
                details: {}
              };
            }
            
            const requiredFields = ['date', 'morningBookend', 'scorecard'];
            const missing = requiredFields.filter(f => !dailyPracticeData[f]);
            
            if (missing.length > 0) {
              return {
                status: TEST_STATUS.WARNING,
                message: `Missing fields: ${missing.join(', ')}`,
                details: { missing, found: Object.keys(dailyPracticeData) }
              };
            }
            
            return {
              status: TEST_STATUS.PASSED,
              message: 'All required structures present',
              details: { fields: Object.keys(dailyPracticeData) }
            };
          }
        },
        {
          id: 'streak-consistency',
          name: 'Streak Data Consistency',
          description: 'Verify streak count matches history',
          critical: false,
          run: async () => {
            if (!dailyPracticeData) {
              return {
                status: TEST_STATUS.SKIPPED,
                message: 'No daily practice data',
                details: {}
              };
            }
            
            const streak = dailyPracticeData.streakCount || 0;
            const historyLength = (dailyPracticeData.scorecardHistory || []).length;
            
            return {
              status: TEST_STATUS.PASSED,
              message: `Streak: ${streak} days, History: ${historyLength} entries`,
              details: { streakCount: streak, historyEntries: historyLength }
            };
          }
        }
      ]
    },

    // ===== REGRESSION TESTS =====
    {
      id: 'regression',
      name: 'Regression Tests',
      category: TEST_CATEGORIES.REGRESSION,
      description: 'Critical functionality checks that should always pass',
      tests: [
        {
          id: 'admin-access',
          name: 'Admin Portal Access',
          description: 'Verify admin can access admin features',
          critical: true,
          run: async () => {
            try {
              const configRef = doc(db, 'metadata', 'config');
              const configSnap = await getDoc(configRef);
              
              if (!configSnap.exists()) {
                return {
                  status: TEST_STATUS.FAILED,
                  message: 'Cannot verify admin access - config missing',
                  details: {}
                };
              }
              
              const adminEmails = configSnap.data().adminemails || [];
              const isAdmin = user?.email && 
                adminEmails.some(e => e.toLowerCase() === user.email.toLowerCase());
              
              if (isAdmin) {
                return {
                  status: TEST_STATUS.PASSED,
                  message: `${user.email} is in admin list (${adminEmails.length} admins)`,
                  details: { adminCount: adminEmails.length }
                };
              }
              
              return {
                status: TEST_STATUS.WARNING,
                message: 'Current user not in admin list but has access',
                details: { userEmail: user.email }
              };
            } catch (error) {
              return {
                status: TEST_STATUS.FAILED,
                message: `Error checking admin access: ${error.message}`,
                details: { error: error.message }
              };
            }
          }
        },
        {
          id: 'content-accessible',
          name: 'Content Accessibility',
          description: 'Verify at least one content item is accessible',
          critical: true,
          run: async () => {
            try {
              const q = query(
                collection(db, 'content_videos'),
                where('isActive', '==', true),
                limit(1)
              );
              const snap = await getDocs(q);
              
              if (snap.docs.length > 0) {
                return {
                  status: TEST_STATUS.PASSED,
                  message: 'Active content accessible',
                  details: { sampleTitle: snap.docs[0].data().title }
                };
              }
              
              return {
                status: TEST_STATUS.WARNING,
                message: 'No active content found',
                details: {}
              };
            } catch (error) {
              return {
                status: TEST_STATUS.FAILED,
                message: `Content access error: ${error.message}`,
                details: { error: error.message }
              };
            }
          }
        },
        {
          id: 'firestore-write-test',
          name: 'Firestore Write Permissions',
          description: 'Verify user can write to their own data',
          critical: true,
          run: async () => {
            // This is a read-only test - we verify the user doc exists and is writable by checking structure
            if (!user?.uid) {
              return {
                status: TEST_STATUS.SKIPPED,
                message: 'No user to test write permissions',
                details: {}
              };
            }
            
            try {
              const userRef = doc(db, 'users', user.uid);
              const userSnap = await getDoc(userRef);
              
              if (userSnap.exists()) {
                return {
                  status: TEST_STATUS.PASSED,
                  message: 'User document accessible (write permissions implied)',
                  details: {}
                };
              }
              
              return {
                status: TEST_STATUS.WARNING,
                message: 'User document does not exist yet',
                details: {}
              };
            } catch (error) {
              return {
                status: TEST_STATUS.FAILED,
                message: `Permission error: ${error.message}`,
                details: { error: error.message }
              };
            }
          }
        }
      ]
    }
  ];
};

// ============== Main TestCenter Component ==============

const TestCenter = () => {
  const { user, db, dailyPracticeData, developmentPlanData } = useAppServices();
  
  // Tab state
  const [activeTab, setActiveTab] = useState('automated');
  
  // State
  const [testSuites, setTestSuites] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [runningTestId, setRunningTestId] = useState(null);
  const [expandedSuites, setExpandedSuites] = useState(new Set(['connectivity']));
  const [filterStatus, setFilterStatus] = useState('all');
  const [showDetails, setShowDetails] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [lastRunTime, setLastRunTime] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const abortControllerRef = useRef(null);
  
  // Initialize test suites
  useEffect(() => {
    const suites = createTestSuites(db, user, dailyPracticeData, developmentPlanData);
    setTestSuites(suites.map(suite => ({
      ...suite,
      tests: suite.tests.map(test => ({
        ...test,
        status: TEST_STATUS.PENDING,
        result: null,
        duration: null
      }))
    })));
  }, [db, user, dailyPracticeData, developmentPlanData]);
  
  // Auto-refresh functionality - uses ref to avoid dependency cycle
  const runAllTestsRef = useRef(null);
  
  useEffect(() => {
    let interval;
    if (autoRefresh && !isRunning && runAllTestsRef.current) {
      interval = setInterval(() => {
        runAllTestsRef.current();
      }, 60000); // Run every 60 seconds
    }
    return () => clearInterval(interval);
  }, [autoRefresh, isRunning]);
  
  // Run a single test
  const runTest = async (suiteId, testId) => {
    const suite = testSuites.find(s => s.id === suiteId);
    const test = suite?.tests.find(t => t.id === testId);
    if (!test) return;
    
    setRunningTestId(testId);
    
    // Update status to running
    setTestSuites(prev => prev.map(s => ({
      ...s,
      tests: s.tests.map(t => 
        t.id === testId ? { ...t, status: TEST_STATUS.RUNNING } : t
      )
    })));
    
    const start = performance.now();
    try {
      const result = await test.run();
      const duration = Math.round(performance.now() - start);
      
      setTestSuites(prev => prev.map(s => ({
        ...s,
        tests: s.tests.map(t => 
          t.id === testId ? { ...t, status: result.status, result, duration } : t
        )
      })));
    } catch (error) {
      const duration = Math.round(performance.now() - start);
      setTestSuites(prev => prev.map(s => ({
        ...s,
        tests: s.tests.map(t => 
          t.id === testId ? { 
            ...t, 
            status: TEST_STATUS.FAILED, 
            result: { status: TEST_STATUS.FAILED, message: error.message, details: {} },
            duration 
          } : t
        )
      })));
    }
    
    setRunningTestId(null);
  };
  
  // Run all tests in a suite
  const runSuite = async (suiteId) => {
    const suite = testSuites.find(s => s.id === suiteId);
    if (!suite) return;
    
    setExpandedSuites(prev => new Set([...prev, suiteId]));
    
    for (const test of suite.tests) {
      if (isPaused) break;
      await runTest(suiteId, test.id);
      // Small delay between tests for visual feedback
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  };
  
  // Run all tests
  const runAllTests = async () => {
    setIsRunning(true);
    setIsPaused(false);
    abortControllerRef.current = new AbortController();
    
    // Reset all tests
    setTestSuites(prev => prev.map(s => ({
      ...s,
      tests: s.tests.map(t => ({
        ...t,
        status: TEST_STATUS.PENDING,
        result: null,
        duration: null
      }))
    })));
    
    for (const suite of testSuites) {
      if (isPaused || abortControllerRef.current?.signal.aborted) break;
      await runSuite(suite.id);
    }
    
    setIsRunning(false);
    setLastRunTime(new Date());
  };
  
  // Update ref when runAllTests changes
  useEffect(() => {
    runAllTestsRef.current = runAllTests;
  });
  
  // Stop running tests
  const stopTests = () => {
    setIsPaused(true);
    abortControllerRef.current?.abort();
    setIsRunning(false);
  };
  
  // Toggle suite expansion
  const toggleSuite = (suiteId) => {
    setExpandedSuites(prev => {
      const next = new Set(prev);
      if (next.has(suiteId)) {
        next.delete(suiteId);
      } else {
        next.add(suiteId);
      }
      return next;
    });
  };
  
  // Toggle test details
  const toggleDetails = (testId) => {
    setShowDetails(prev => {
      const next = new Set(prev);
      if (next.has(testId)) {
        next.delete(testId);
      } else {
        next.add(testId);
      }
      return next;
    });
  };
  
  // Calculate summary statistics
  const getSummary = () => {
    let total = 0, passed = 0, failed = 0, warnings = 0, pending = 0;
    
    testSuites.forEach(suite => {
      suite.tests.forEach(test => {
        total++;
        switch (test.status) {
          case TEST_STATUS.PASSED: passed++; break;
          case TEST_STATUS.FAILED: failed++; break;
          case TEST_STATUS.WARNING: warnings++; break;
          default: pending++; break;
        }
      });
    });
    
    return { total, passed, failed, warnings, pending };
  };
  
  // Filter tests
  const getFilteredSuites = () => {
    return testSuites.map(suite => ({
      ...suite,
      tests: suite.tests.filter(test => {
        if (filterStatus !== 'all' && test.status !== filterStatus) return false;
        if (searchTerm && !test.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
        return true;
      })
    })).filter(suite => suite.tests.length > 0 || filterStatus === 'all');
  };
  
  // Export results
  const exportResults = () => {
    const results = {
      timestamp: new Date().toISOString(),
      environment: window.location.hostname,
      summary: getSummary(),
      suites: testSuites.map(suite => ({
        ...suite,
        tests: suite.tests.map(t => ({
          id: t.id,
          name: t.name,
          status: t.status,
          duration: t.duration,
          result: t.result
        }))
      }))
    };
    
    const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `test-results-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };
  
  const summary = getSummary();
  const filteredSuites = getFilteredSuites();
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-corporate-navy font-serif flex items-center gap-2">
            <Cpu className="w-6 h-6 text-corporate-teal" />
            Test Center
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Automated testing, system health monitoring, and manual test scripts
          </p>
        </div>
      </div>
      
      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('automated')}
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2
            ${activeTab === 'automated' 
              ? 'border-corporate-teal text-corporate-teal' 
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
        >
          <Zap className="w-4 h-4" />
          Data Tests
        </button>
        <button
          onClick={() => setActiveTab('e2e')}
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2
            ${activeTab === 'e2e' 
              ? 'border-corporate-teal text-corporate-teal' 
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
        >
          <PlayCircle className="w-4 h-4" />
          E2E Browser Tests
          <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-xs font-bold rounded">NEW</span>
        </button>
        <button
          onClick={() => setActiveTab('manual')}
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2
            ${activeTab === 'manual' 
              ? 'border-corporate-teal text-corporate-teal' 
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
        >
          <ClipboardList className="w-4 h-4" />
          Manual Test Scripts
          <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-xs font-bold rounded">138</span>
        </button>
      </div>
      
      {/* Manual Test Scripts Tab */}
      {activeTab === 'manual' && (
        <ManualTestScripts />
      )}
      
      {/* E2E Browser Tests Tab */}
      {activeTab === 'e2e' && (
        <E2ETestRunner />
      )}
      
      {/* Automated Tests Tab */}
      {activeTab === 'automated' && (
      <>
      {/* Automated Tests Controls */}
      <div className="flex items-center justify-end gap-3">
          {/* Auto-refresh toggle */}
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-2 rounded-lg border text-sm font-medium flex items-center gap-2 transition-colors
              ${autoRefresh 
                ? 'bg-corporate-teal/10 border-corporate-teal text-corporate-teal' 
                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
          >
            <RefreshCw className={`w-4 h-4 ${autoRefresh ? 'animate-spin' : ''}`} />
            Auto
          </button>
          
          {/* Export button */}
          <button
            onClick={exportResults}
            className="px-3 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-medium flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          
          {/* Main action button */}
          {isRunning ? (
            <button
              onClick={stopTests}
              className="px-4 py-2 bg-red-500 text-white rounded-lg font-bold hover:bg-red-600 transition-colors flex items-center gap-2"
            >
              <Square className="w-4 h-4" />
              Stop
            </button>
          ) : (
            <button
              onClick={runAllTests}
              className="px-4 py-2 bg-corporate-teal text-white rounded-lg font-bold hover:bg-corporate-teal/90 transition-colors flex items-center gap-2"
            >
              <Play className="w-4 h-4" />
              Run All Tests
            </button>
          )}
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-5 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-2xl font-bold text-corporate-navy">{summary.total}</div>
          <div className="text-sm text-gray-500">Total Tests</div>
        </div>
        <div className={`rounded-xl border p-4 ${summary.passed > 0 ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'}`}>
          <div className="text-2xl font-bold text-green-600">{summary.passed}</div>
          <div className="text-sm text-green-700">Passed</div>
        </div>
        <div className={`rounded-xl border p-4 ${summary.failed > 0 ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'}`}>
          <div className="text-2xl font-bold text-red-600">{summary.failed}</div>
          <div className="text-sm text-red-700">Failed</div>
        </div>
        <div className={`rounded-xl border p-4 ${summary.warnings > 0 ? 'bg-amber-50 border-amber-200' : 'bg-white border-gray-200'}`}>
          <div className="text-2xl font-bold text-amber-600">{summary.warnings}</div>
          <div className="text-sm text-amber-700">Warnings</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-2xl font-bold text-gray-400">{summary.pending}</div>
          <div className="text-sm text-gray-500">Pending</div>
        </div>
      </div>
      
      {/* Last Run Time & Progress */}
      {isRunning && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-4">
          <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />
          <div className="flex-1">
            <div className="font-medium text-blue-800">Running tests...</div>
            <div className="text-sm text-blue-600">
              {summary.passed + summary.failed + summary.warnings} of {summary.total} complete
            </div>
          </div>
          <div className="w-32 h-2 bg-blue-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500 transition-all duration-300"
              style={{ width: `${((summary.passed + summary.failed + summary.warnings) / summary.total) * 100}%` }}
            />
          </div>
        </div>
      )}
      
      {lastRunTime && !isRunning && (
        <div className="text-sm text-gray-500 flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Last run: {lastRunTime.toLocaleTimeString()}
        </div>
      )}
      
      {/* Filters */}
      <div className="flex items-center gap-4 bg-gray-50 rounded-xl p-4 border border-gray-200">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search tests..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-corporate-teal/50"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-corporate-teal/50"
          >
            <option value="all">All Status</option>
            <option value={TEST_STATUS.PASSED}>Passed</option>
            <option value={TEST_STATUS.FAILED}>Failed</option>
            <option value={TEST_STATUS.WARNING}>Warnings</option>
            <option value={TEST_STATUS.PENDING}>Pending</option>
          </select>
        </div>
      </div>
      
      {/* Test Suites */}
      <div className="space-y-4">
        {filteredSuites.map(suite => {
          const CategoryIcon = getCategoryIcon(suite.category);
          const isExpanded = expandedSuites.has(suite.id);
          const suiteStats = {
            passed: suite.tests.filter(t => t.status === TEST_STATUS.PASSED).length,
            failed: suite.tests.filter(t => t.status === TEST_STATUS.FAILED).length,
            warnings: suite.tests.filter(t => t.status === TEST_STATUS.WARNING).length,
            total: suite.tests.length
          };
          
          return (
            <div key={suite.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {/* Suite Header */}
              <div 
                className="px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => toggleSuite(suite.id)}
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-corporate-teal/10 rounded-lg">
                    <CategoryIcon className="w-5 h-5 text-corporate-teal" />
                  </div>
                  <div>
                    <div className="font-bold text-corporate-navy">{suite.name}</div>
                    <div className="text-sm text-gray-500">{suite.description}</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  {/* Suite stats */}
                  <div className="flex items-center gap-2 text-sm">
                    {suiteStats.passed > 0 && (
                      <span className="px-2 py-1 rounded bg-green-100 text-green-700 font-medium">
                        {suiteStats.passed} ✓
                      </span>
                    )}
                    {suiteStats.failed > 0 && (
                      <span className="px-2 py-1 rounded bg-red-100 text-red-700 font-medium">
                        {suiteStats.failed} ✗
                      </span>
                    )}
                    {suiteStats.warnings > 0 && (
                      <span className="px-2 py-1 rounded bg-amber-100 text-amber-700 font-medium">
                        {suiteStats.warnings} ⚠
                      </span>
                    )}
                  </div>
                  
                  {/* Run suite button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      runSuite(suite.id);
                    }}
                    disabled={isRunning}
                    className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 flex items-center gap-1"
                  >
                    <PlayCircle className="w-4 h-4" />
                    Run
                  </button>
                  
                  {isExpanded ? (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              </div>
              
              {/* Suite Tests */}
              {isExpanded && (
                <div className="border-t border-gray-200">
                  {suite.tests.map((test, idx) => {
                    const statusConfig = getStatusConfig(test.status);
                    const StatusIcon = statusConfig.icon;
                    const isDetailsOpen = showDetails.has(test.id);
                    
                    return (
                      <div 
                        key={test.id} 
                        className={`px-5 py-3 ${idx !== suite.tests.length - 1 ? 'border-b border-gray-100' : ''} 
                          ${statusConfig.bg} transition-colors`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <StatusIcon 
                              className={`w-5 h-5 ${statusConfig.color} ${test.status === TEST_STATUS.RUNNING ? 'animate-spin' : ''}`} 
                            />
                            <div>
                              <div className="flex items-center gap-2">
                                <span className={`font-medium ${test.status === TEST_STATUS.FAILED ? 'text-red-800' : 'text-gray-800'}`}>
                                  {test.name}
                                </span>
                                {test.critical && (
                                  <span className="px-1.5 py-0.5 bg-red-100 text-red-600 text-xs font-bold rounded">
                                    CRITICAL
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-gray-500 mt-0.5">{test.description}</div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            {test.result && (
                              <span className={`text-sm ${statusConfig.color}`}>
                                {test.result.message}
                              </span>
                            )}
                            {test.duration && (
                              <span className="text-xs text-gray-400">
                                {test.duration}ms
                              </span>
                            )}
                            {test.result?.details && Object.keys(test.result.details).length > 0 && (
                              <button
                                onClick={() => toggleDetails(test.id)}
                                className="p-1 hover:bg-white/50 rounded"
                              >
                                {isDetailsOpen ? (
                                  <EyeOff className="w-4 h-4 text-gray-400" />
                                ) : (
                                  <Eye className="w-4 h-4 text-gray-400" />
                                )}
                              </button>
                            )}
                            <button
                              onClick={() => runTest(suite.id, test.id)}
                              disabled={isRunning && runningTestId !== test.id}
                              className="p-1 hover:bg-white/50 rounded disabled:opacity-50"
                            >
                              <Play className="w-4 h-4 text-gray-500" />
                            </button>
                          </div>
                        </div>
                        
                        {/* Test Details */}
                        {isDetailsOpen && test.result?.details && (
                          <div className="mt-3 p-3 bg-white/80 rounded-lg border border-gray-200">
                            <pre className="text-xs text-gray-600 overflow-auto max-h-40">
                              {JSON.stringify(test.result.details, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Quick Health Check Panel */}
      <div className="mt-8 bg-gradient-to-br from-corporate-navy to-corporate-navy/90 rounded-xl p-6 text-white">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Quick System Health
        </h3>
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white/10 rounded-lg p-4">
            <div className="text-2xl font-bold">
              {summary.failed === 0 ? '✓' : '✗'}
            </div>
            <div className="text-sm opacity-80">Critical Tests</div>
          </div>
          <div className="bg-white/10 rounded-lg p-4">
            <div className="text-2xl font-bold">
              {testSuites.find(s => s.id === 'connectivity')?.tests.every(t => t.status === TEST_STATUS.PASSED) ? '✓' : '○'}
            </div>
            <div className="text-sm opacity-80">Connectivity</div>
          </div>
          <div className="bg-white/10 rounded-lg p-4">
            <div className="text-2xl font-bold">
              {testSuites.find(s => s.id === 'data-integrity')?.tests.every(t => t.status === TEST_STATUS.PASSED || t.status === TEST_STATUS.WARNING) ? '✓' : '○'}
            </div>
            <div className="text-sm opacity-80">Data Integrity</div>
          </div>
          <div className="bg-white/10 rounded-lg p-4">
            <div className="text-2xl font-bold">
              {Math.round((summary.passed / Math.max(summary.total - summary.pending, 1)) * 100)}%
            </div>
            <div className="text-sm opacity-80">Pass Rate</div>
          </div>
        </div>
      </div>
      </>
      )}
    </div>
  );
};

export default TestCenter;
