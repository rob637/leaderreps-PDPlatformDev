/**
 * UxAuditPanel — Admin UI for Browser-Use UX Audits
 * 
 * Lets admins configure and queue AI-powered UX audits, then view the 
 * resulting reports. Uses browser-use + Claude to drive a real browser
 * and evaluate the app like a real user.
 * 
 * Architecture:
 *   1. Admin fills out audit config (env, type, custom task) → saved to Firestore
 *   2. Python runner watches Firestore for pending audits → runs browser-use → writes report
 *   3. Admin sees live status updates and final report in this panel
 * 
 * Firestore collection: admin/ux-audits/runs/{runId}
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Play,
  Eye,
  Monitor,
  Globe,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader,
  RefreshCw,
  Copy,
  Check,
  Trash2,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Terminal,
  Mic,
  Layout,
  Dumbbell,
  Zap,
} from 'lucide-react';
import { useAppServices } from '../../services/useAppServices';
import {
  collection,
  doc,
  addDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
  serverTimestamp,
} from 'firebase/firestore';

// ============================================
// CONSTANTS
// ============================================

const ENVIRONMENTS = {
  dev: { label: 'Dev', url: 'https://leaderreps-pd-platform.web.app', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700' },
  test: { label: 'Test', url: 'https://leaderreps-test.web.app', color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700' },
  prod: { label: 'Prod', url: 'https://leaderreps-prod.web.app', color: 'bg-red-100 dark:bg-red-900/30 text-red-700' },
  local: { label: 'Local', url: 'http://localhost:5173', color: 'bg-green-100 dark:bg-green-900/30 text-green-700' },
};

const AUDIT_TYPES = [
  {
    id: 'conditioning',
    label: 'Conditioning Flow',
    description: 'Walk through conditioning — commit rep, debrief, modals, colors',
    icon: Dumbbell,
    color: 'text-corporate-teal',
  },
  {
    id: 'dashboard',
    label: 'Dashboard',
    description: 'Check widget loads, layout, navigation, empty states',
    icon: Layout,
    color: 'text-blue-600',
  },
  {
    id: 'full',
    label: 'Full App Audit',
    description: 'Visit every screen, score each, report top 5 fixes',
    icon: Globe,
    color: 'text-corporate-orange',
  },
  {
    id: 'custom',
    label: 'Custom Task',
    description: 'Write your own task for the AI to perform',
    icon: Sparkles,
    color: 'text-purple-600',
  },
];

const STATUS_CONFIG = {
  pending: { label: 'Queued', icon: Clock, color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800' },
  running: { label: 'Running', icon: Loader, color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800', animate: true },
  completed: { label: 'Completed', icon: CheckCircle2, color: 'text-green-600 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' },
  failed: { label: 'Failed', icon: XCircle, color: 'text-red-600 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' },
};

// ============================================
// STATUS BADGE
// ============================================

const StatusBadge = ({ status }) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.color}`}>
      <Icon className={`w-3.5 h-3.5 ${config.animate ? 'animate-spin' : ''}`} />
      {config.label}
    </span>
  );
};

// ============================================
// COPY BUTTON
// ============================================

const CopyButton = ({ text }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
      title="Copy to clipboard"
    >
      {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
    </button>
  );
};

// ============================================
// NEW AUDIT FORM
// ============================================

const NewAuditForm = ({ onSubmit, isSubmitting }) => {
  const [selectedType, setSelectedType] = useState('conditioning');
  const [selectedEnv, setSelectedEnv] = useState('dev');
  const [customTask, setCustomTask] = useState('');
  const [email, setEmail] = useState('rob@sagecg.com');

  const handleSubmit = () => {
    onSubmit({
      auditType: selectedType,
      environment: selectedEnv,
      customTask: selectedType === 'custom' ? customTask : null,
      email,
    });
  };

  const isValid = selectedType !== 'custom' || customTask.trim().length >= 10;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 bg-gradient-to-r from-corporate-navy to-corporate-navy/90 text-white">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/10 dark:bg-slate-800/10 rounded-lg">
            <Eye className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">New UX Audit</h3>
            <p className="text-white/70 text-sm">AI will log in and use the app like a real user</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Audit Type Selection */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
            What should the AI audit?
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {AUDIT_TYPES.map((type) => {
              const Icon = type.icon;
              const isSelected = selectedType === type.id;
              return (
                <button
                  key={type.id}
                  onClick={() => setSelectedType(type.id)}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    isSelected
                      ? 'border-corporate-teal bg-corporate-teal/5 ring-1 ring-corporate-teal/20'
                      : 'border-slate-200 hover:border-slate-300 dark:border-slate-600'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Icon className={`w-5 h-5 mt-0.5 ${isSelected ? 'text-corporate-teal' : type.color}`} />
                    <div>
                      <p className={`text-sm font-medium ${isSelected ? 'text-corporate-navy' : 'text-slate-700 dark:text-slate-300'}`}>
                        {type.label}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{type.description}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Task Input */}
        {selectedType === 'custom' && (
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Custom Task
            </label>
            <textarea
              value={customTask}
              onChange={(e) => setCustomTask(e.target.value)}
              placeholder='e.g., "Navigate to the conditioning screen, try to commit a rep for a difficult conversation with John, then check if voice input works on all text fields"'
              rows={4}
              className="w-full px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl text-sm 
                         focus:ring-2 focus:ring-corporate-teal/50 focus:border-corporate-teal 
                         dark:bg-slate-700 dark:text-white resize-none"
            />
            <p className="text-xs text-slate-400 mt-1">
              Minimum 10 characters. Be specific about what you want the AI to do and check.
            </p>
          </div>
        )}

        {/* Environment Selection */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
            Target Environment
          </label>
          <div className="flex flex-wrap gap-2">
            {Object.entries(ENVIRONMENTS).map(([key, env]) => (
              <button
                key={key}
                onClick={() => setSelectedEnv(key)}
                className={`px-4 py-2 rounded-xl text-sm font-medium border-2 transition-all ${
                  selectedEnv === key
                    ? 'border-corporate-teal bg-corporate-teal/5 text-corporate-navy'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:border-slate-600 dark:text-slate-400'
                }`}
              >
                {env.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-slate-400 mt-2">
            URL: {ENVIRONMENTS[selectedEnv].url}
          </p>
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Login Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl text-sm
                       focus:ring-2 focus:ring-corporate-teal/50 focus:border-corporate-teal
                       dark:bg-slate-700 dark:text-white"
          />
          <p className="text-xs text-slate-400 mt-1">
            Password is provided via the runner environment, never stored in Firestore.
          </p>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-between pt-2">
          <div className="text-xs text-slate-400">
            <Terminal className="w-3.5 h-3.5 inline mr-1" />
            Requires the Python runner to be active
          </div>
          <button
            onClick={handleSubmit}
            disabled={!isValid || isSubmitting}
            className="px-6 py-2.5 bg-corporate-teal text-white rounded-xl font-medium text-sm
                       hover:bg-corporate-teal/90 disabled:opacity-50 disabled:cursor-not-allowed
                       transition-colors flex items-center gap-2"
          >
            {isSubmitting ? (
              <Loader className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            Queue Audit
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================
// CLI COMMAND HELPER
// ============================================

const CliCommandHelper = () => {
  const [isOpen, setIsOpen] = useState(false);

  const commands = [
    {
      label: 'Start the runner (watches Firestore)',
      command: 'python3 scripts/browser-use/run_ux_audit.py --watch',
    },
    {
      label: 'One-off conditioning audit',
      command: 'python3 scripts/browser-use/run_ux_audit.py --audit conditioning --env dev',
    },
    {
      label: 'Full app audit with visible browser',
      command: 'python3 scripts/browser-use/run_ux_audit.py --audit full --headed',
    },
  ];

  return (
    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between text-sm"
      >
        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
          <Terminal className="w-4 h-4" />
          <span className="font-medium">Runner Setup & CLI Commands</span>
        </div>
        {isOpen ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
      </button>

      {isOpen && (
        <div className="px-4 pb-4 space-y-3 border-t border-slate-200 dark:border-slate-700 pt-3">
          <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
            <p className="text-xs text-amber-700 dark:text-amber-400 font-medium mb-1">
              Prerequisites
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-500">
              Set <code className="bg-amber-100 dark:bg-amber-900 px-1 rounded">ANTHROPIC_API_KEY</code> and{' '}
              <code className="bg-amber-100 dark:bg-amber-900 px-1 rounded">E2E_ADMIN_PASSWORD</code>{' '}
              environment variables before running.
            </p>
          </div>

          {commands.map((cmd, i) => (
            <div key={i} className="group">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">{cmd.label}</p>
              <div className="flex items-center gap-2 bg-slate-900 rounded-lg px-3 py-2">
                <code className="text-xs text-green-400 font-mono flex-1 overflow-x-auto">
                  {cmd.command}
                </code>
                <CopyButton text={cmd.command} />
              </div>
            </div>
          ))}

          <div className="p-3 bg-corporate-navy/5 rounded-lg border border-corporate-navy/10">
            <p className="text-xs text-corporate-navy font-medium mb-1">
              How it works
            </p>
            <ol className="text-xs text-slate-600 dark:text-slate-300 space-y-1 list-decimal list-inside">
              <li>Queue an audit using the form above — config is saved to Firestore</li>
              <li>Run the Python runner in your terminal (it watches Firestore)</li>
              <li>The runner launches a real browser, logs in, and performs the audit</li>
              <li>Results are written back to Firestore and appear here automatically</li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================
// AUDIT REPORT CARD
// ============================================

const AuditReportCard = ({ audit, onDelete }) => {
  const [expanded, setExpanded] = useState(false);
  const typeConfig = AUDIT_TYPES.find((t) => t.id === audit.auditType) || AUDIT_TYPES[0];
  const TypeIcon = typeConfig.icon;
  const envConfig = ENVIRONMENTS[audit.environment] || ENVIRONMENTS.dev;

  const formatDate = (ts) => {
    if (!ts) return '—';
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      {/* Summary Row */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-5 py-4 flex items-center gap-4 text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
      >
        <TypeIcon className={`w-5 h-5 flex-shrink-0 ${typeConfig.color}`} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-corporate-navy dark:text-white">
              {typeConfig.label}
            </span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${envConfig.color}`}>
              {envConfig.label}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="text-xs text-slate-400">{formatDate(audit.createdAt)}</span>
            {audit.email && (
              <span className="text-xs text-slate-400">{audit.email}</span>
            )}
          </div>
        </div>

        <StatusBadge status={audit.status} />

        <div className="flex items-center gap-1">
          {expanded ? (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronRight className="w-4 h-4 text-slate-400" />
          )}
        </div>
      </button>

      {/* Expanded Content */}
      {expanded && (
        <div className="border-t border-slate-200 dark:border-slate-700">
          {/* Custom task if any */}
          {audit.customTask && (
            <div className="px-5 py-3 bg-slate-50 dark:bg-slate-700/30 border-b border-slate-200 dark:border-slate-700">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Custom Task</p>
              <p className="text-sm text-slate-700 dark:text-slate-300">{audit.customTask}</p>
            </div>
          )}

          {/* Report content */}
          {audit.status === 'completed' && audit.report ? (
            <div className="px-5 py-4">
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 max-h-[600px] overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-xs text-slate-700 dark:text-slate-300 font-sans leading-relaxed">
                    {audit.report}
                  </pre>
                </div>
              </div>

              {audit.score && (
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Overall Score:</span>
                  <span className={`text-lg font-bold ${
                    audit.score >= 8 ? 'text-green-600' :
                    audit.score >= 5 ? 'text-amber-600' : 'text-red-600'
                  }`}>
                    {audit.score}/10
                  </span>
                </div>
              )}
            </div>
          ) : audit.status === 'failed' ? (
            <div className="px-5 py-4">
              <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <p className="text-sm text-red-700 dark:text-red-400">
                  {audit.error || 'Audit failed — check the runner logs for details.'}
                </p>
              </div>
            </div>
          ) : audit.status === 'running' ? (
            <div className="px-5 py-4 flex items-center gap-3 text-sm text-blue-600">
              <Loader className="w-4 h-4 animate-spin" />
              <span>Audit in progress — the AI is navigating the app...</span>
            </div>
          ) : (
            <div className="px-5 py-4 flex items-center gap-3 text-sm text-amber-600">
              <Clock className="w-4 h-4" />
              <span>Waiting for the Python runner to pick up this audit...</span>
            </div>
          )}

          {/* Actions */}
          <div className="px-5 py-3 bg-slate-50 dark:bg-slate-700/30 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
            <div className="text-xs text-slate-400">
              ID: {audit.id?.substring(0, 8)}...
            </div>
            <div className="flex items-center gap-2">
              {audit.report && (
                <CopyButton text={audit.report} />
              )}
              <button
                onClick={() => onDelete(audit.id)}
                className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                title="Delete audit"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================
// MAIN PANEL
// ============================================

const UxAuditPanel = () => {
  const { db } = useAppServices();
  const [audits, setAudits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Firestore collection path
  const getCollectionRef = useCallback(() => {
    return collection(db, 'admin', 'ux-audits', 'runs');
  }, [db]);

  // Real-time listener for audit runs
  useEffect(() => {
    if (!db) return;

    const q = query(
      getCollectionRef(),
      orderBy('createdAt', 'desc'),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const runs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setAudits(runs);
      setLoading(false);
    }, (err) => {
      console.error('Error loading audits:', err);
      setError('Failed to load audits');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [db, getCollectionRef]);

  // Queue a new audit
  const handleSubmitAudit = async (config) => {
    try {
      setIsSubmitting(true);
      setError(null);

      await addDoc(getCollectionRef(), {
        auditType: config.auditType,
        environment: config.environment,
        customTask: config.customTask || null,
        email: config.email,
        url: ENVIRONMENTS[config.environment]?.url || ENVIRONMENTS.dev.url,
        status: 'pending',
        report: null,
        error: null,
        score: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.error('Error queuing audit:', err);
      setError('Failed to queue audit. Check console for details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete an audit
  const handleDeleteAudit = async (auditId) => {
    try {
      await deleteDoc(doc(db, 'admin', 'ux-audits', 'runs', auditId));
    } catch (err) {
      console.error('Error deleting audit:', err);
    }
  };

  // Stats
  const completedCount = audits.filter((a) => a.status === 'completed').length;
  const pendingCount = audits.filter((a) => a.status === 'pending' || a.status === 'running').length;
  const avgScore = audits
    .filter((a) => a.score)
    .reduce((sum, a, _, arr) => sum + a.score / arr.length, 0);

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-1">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-corporate-navy dark:text-white flex items-center gap-2">
            <Eye className="w-6 h-6 text-corporate-teal" />
            UX Audit Lab
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            AI-powered UX testing — Claude logs in and uses the app like a real user
          </p>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 text-center">
          <p className="text-2xl font-bold text-corporate-navy dark:text-white">{completedCount}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Completed</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 text-center">
          <p className="text-2xl font-bold text-amber-600">{pendingCount}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">In Queue</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 text-center">
          <p className="text-2xl font-bold text-corporate-teal">
            {avgScore ? avgScore.toFixed(1) : '—'}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Avg Score</p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-400 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* New Audit Form */}
      <NewAuditForm onSubmit={handleSubmitAudit} isSubmitting={isSubmitting} />

      {/* CLI Commands */}
      <CliCommandHelper />

      {/* Audit History */}
      <div>
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Audit History
          {loading && <Loader className="w-3.5 h-3.5 animate-spin text-slate-400" />}
        </h3>

        {audits.length === 0 && !loading ? (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-8 text-center">
            <Monitor className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-500 dark:text-slate-400">No audits yet</p>
            <p className="text-xs text-slate-400 mt-1">
              Queue your first audit above, then start the Python runner
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {audits.map((audit) => (
              <AuditReportCard key={audit.id} audit={audit} onDelete={handleDeleteAudit} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UxAuditPanel;
