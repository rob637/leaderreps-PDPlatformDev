/**
 * LR-Instantly - Sequence Enrollments Dashboard
 * 
 * Monitor and manage all active sequence enrollments.
 * Part of the LR-Instantly email automation engine.
 * 
 * Features:
 * - Overall stats (active, paused, completed, replied)
 * - Filter by status/sequence
 * - Pause/resume/cancel enrollments
 * - View progress through sequence
 * - Quick actions
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  Zap,
  Pause,
  Play,
  StopCircle,
  MessageSquare,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Mail,
  Clock,
  Search,
  Filter,
  ChevronDown,
  MoreHorizontal,
  ExternalLink,
  RefreshCw,
  TrendingUp,
  Users,
  Calendar,
  ArrowRight
} from 'lucide-react';
import { useSequenceStore, STATUS_CONFIG } from '../../stores/sequenceStore';
import { useOutreachStore } from '../../stores/outreachStore';
import { formatDistanceToNow, format } from 'date-fns';

// Status icons mapping
const STATUS_ICONS = {
  active: Zap,
  paused: Pause,
  completed: CheckCircle,
  replied: MessageSquare,
  bounced: AlertTriangle,
  error: XCircle,
  cancelled: XCircle
};

export default function SequenceEnrollmentsDashboard() {
  const { 
    enrollments, 
    enrollmentsLoading,
    initialize,
    cleanup,
    toggleEnrollmentPause,
    cancelEnrollment,
    markAsReplied,
    getEnrollmentStats
  } = useSequenceStore();
  
  const { sequences } = useOutreachStore();
  
  const [statusFilter, setStatusFilter] = useState('all');
  const [sequenceFilter, setSequenceFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showActions, setShowActions] = useState(null);
  
  // Initialize on mount
  useEffect(() => {
    initialize();
    return () => cleanup();
  }, [initialize, cleanup]);
  
  // Get stats
  const stats = getEnrollmentStats();
  
  // Filter enrollments
  const filteredEnrollments = useMemo(() => {
    return enrollments.filter(e => {
      // Status filter
      if (statusFilter !== 'all' && e.status !== statusFilter) return false;
      
      // Sequence filter
      if (sequenceFilter !== 'all' && e.sequenceId !== sequenceFilter) return false;
      
      // Search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          e.prospectName?.toLowerCase().includes(query) ||
          e.prospectEmail?.toLowerCase().includes(query) ||
          e.sequenceName?.toLowerCase().includes(query)
        );
      }
      
      return true;
    });
  }, [enrollments, statusFilter, sequenceFilter, searchQuery]);
  
  // Group by sequence for summary
  const enrollmentsBySequence = useMemo(() => {
    const bySeq = {};
    enrollments.forEach(e => {
      if (!bySeq[e.sequenceId]) {
        bySeq[e.sequenceId] = {
          sequenceId: e.sequenceId,
          sequenceName: e.sequenceName,
          total: 0,
          active: 0,
          replied: 0,
          completed: 0
        };
      }
      bySeq[e.sequenceId].total++;
      if (e.status === 'active') bySeq[e.sequenceId].active++;
      if (e.status === 'replied') bySeq[e.sequenceId].replied++;
      if (e.status === 'completed') bySeq[e.sequenceId].completed++;
    });
    return Object.values(bySeq);
  }, [enrollments]);
  
  // Get step progress for an enrollment
  const getStepProgress = (enrollment) => {
    const sequence = sequences.find(s => s.id === enrollment.sequenceId);
    if (!sequence?.steps) return { current: 0, total: 0 };
    return {
      current: enrollment.currentStep + 1,
      total: sequence.steps.length
    };
  };
  
  // Format next send time
  const formatNextSend = (enrollment) => {
    if (!enrollment.nextSendAt) return 'Not scheduled';
    const date = enrollment.nextSendAt.toDate ? enrollment.nextSendAt.toDate() : new Date(enrollment.nextSendAt);
    const now = new Date();
    
    if (date < now) {
      return 'Processing...';
    }
    
    if (date.toDateString() === now.toDateString()) {
      return `Today at ${format(date, 'h:mm a')}`;
    }
    
    return formatDistanceToNow(date, { addSuffix: true });
  };
  
  // Handle actions
  const handlePauseResume = async (enrollment) => {
    await toggleEnrollmentPause(enrollment.id, enrollment.status);
    setShowActions(null);
  };
  
  const handleCancel = async (enrollment) => {
    if (confirm(`Cancel sequence for ${enrollment.prospectName}?`)) {
      await cancelEnrollment(enrollment.id, enrollment.sequenceId);
    }
    setShowActions(null);
  };
  
  const handleMarkReplied = async (enrollment) => {
    await markAsReplied(enrollment.id, enrollment.sequenceId);
    setShowActions(null);
  };
  
  return (
    <div className="space-y-6">
      {/* Automations Header */}
      <div className="flex items-center gap-3 pb-2 border-b border-slate-200 dark:border-slate-700">
        <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg">
          <Zap className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Active Automations</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Monitor and manage sequence enrollments</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard
          label="Active"
          value={stats.active}
          icon={Zap}
          color="emerald"
        />
        <StatCard
          label="Due Today"
          value={stats.dueToday}
          icon={Calendar}
          color="blue"
        />
        <StatCard
          label="Paused"
          value={stats.paused}
          icon={Pause}
          color="amber"
        />
        <StatCard
          label="Replied"
          value={stats.replied}
          icon={MessageSquare}
          color="green"
        />
        <StatCard
          label="Emails Sent"
          value={stats.totalEmailsSent}
          icon={Mail}
          color="purple"
        />
      </div>
      
      {/* Sequence Summary */}
      {enrollmentsBySequence.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
            By Sequence
          </h3>
          <div className="flex flex-wrap gap-2">
            {enrollmentsBySequence.map((seq) => (
              <button
                key={seq.sequenceId}
                onClick={() => setSequenceFilter(seq.sequenceId === sequenceFilter ? 'all' : seq.sequenceId)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
                  sequenceFilter === seq.sequenceId
                    ? 'border-brand-teal bg-brand-teal/10 text-brand-teal'
                    : 'border-slate-200 dark:border-slate-600 hover:border-brand-teal/50'
                }`}
              >
                <span className="font-medium text-slate-900 dark:text-slate-100">{seq.sequenceName}</span>
                <span className="text-xs px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-slate-600 dark:text-slate-300">
                  {seq.active} active
                </span>
                {seq.replied > 0 && (
                  <span className="text-xs px-1.5 py-0.5 bg-green-100 dark:bg-green-900/30 rounded text-green-700 dark:text-green-300">
                    {seq.replied} replied
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search prospects..."
            className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
          />
        </div>
        
        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="paused">Paused</option>
          <option value="replied">Replied</option>
          <option value="completed">Completed</option>
          <option value="error">Error</option>
        </select>
        
        {/* Sequence Filter */}
        <select
          value={sequenceFilter}
          onChange={(e) => setSequenceFilter(e.target.value)}
          className="px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
        >
          <option value="all">All Sequences</option>
          {sequences.map(seq => (
            <option key={seq.id} value={seq.id}>{seq.name}</option>
          ))}
        </select>
      </div>
      
      {/* Enrollments List */}
      {enrollmentsLoading ? (
        <div className="text-center py-12 text-slate-500 dark:text-slate-400">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
          Loading enrollments...
        </div>
      ) : filteredEnrollments.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center">
          <Users className="w-12 h-12 text-slate-400 dark:text-slate-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">No enrollments found</h3>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            {enrollments.length === 0 
              ? 'Add prospects to sequences from the Prospects page'
              : 'Try adjusting your filters'}
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">
            <div className="col-span-3">Prospect</div>
            <div className="col-span-2">Sequence</div>
            <div className="col-span-2">Progress</div>
            <div className="col-span-2">Next Send</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-1"></div>
          </div>
          
          {/* Rows */}
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {filteredEnrollments.map((enrollment) => {
              const StatusIcon = STATUS_ICONS[enrollment.status] || Zap;
              const statusConfig = STATUS_CONFIG[enrollment.status] || STATUS_CONFIG.active;
              const progress = getStepProgress(enrollment);
              
              return (
                <div 
                  key={enrollment.id}
                  className="grid grid-cols-12 gap-4 px-4 py-3 items-center hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors"
                >
                  {/* Prospect */}
                  <div className="col-span-3">
                    <p className="font-medium text-slate-900 dark:text-slate-100 truncate">
                      {enrollment.prospectName}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {enrollment.prospectEmail}
                    </p>
                  </div>
                  
                  {/* Sequence */}
                  <div className="col-span-2">
                    <p className="text-sm text-slate-700 dark:text-slate-300 truncate">
                      {enrollment.sequenceName}
                    </p>
                  </div>
                  
                  {/* Progress */}
                  <div className="col-span-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-brand-teal rounded-full transition-all"
                          style={{ width: `${(progress.current / progress.total) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {progress.current}/{progress.total}
                      </span>
                    </div>
                    {enrollment.emailsSent > 0 && (
                      <p className="text-xs text-slate-400 mt-0.5">
                        {enrollment.emailsSent} sent
                      </p>
                    )}
                  </div>
                  
                  {/* Next Send */}
                  <div className="col-span-2">
                    {enrollment.status === 'active' ? (
                      <div className="flex items-center gap-1 text-sm text-slate-600 dark:text-slate-300">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {formatNextSend(enrollment)}
                      </div>
                    ) : (
                      <span className="text-sm text-slate-400">—</span>
                    )}
                  </div>
                  
                  {/* Status */}
                  <div className="col-span-2">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-${statusConfig.color}-100 dark:bg-${statusConfig.color}-900/30 text-${statusConfig.color}-700 dark:text-${statusConfig.color}-300`}>
                      <StatusIcon className="w-3 h-3" />
                      {statusConfig.label}
                    </span>
                  </div>
                  
                  {/* Actions */}
                  <div className="col-span-1 relative">
                    <button
                      onClick={() => setShowActions(showActions === enrollment.id ? null : enrollment.id)}
                      className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                    >
                      <MoreHorizontal className="w-4 h-4 text-slate-400" />
                    </button>
                    
                    {showActions === enrollment.id && (
                      <>
                        <div 
                          className="fixed inset-0 z-10" 
                          onClick={() => setShowActions(null)}
                        />
                        <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 py-1 z-20">
                          {enrollment.status === 'active' && (
                            <button
                              onClick={() => handlePauseResume(enrollment)}
                              className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2"
                            >
                              <Pause className="w-4 h-4 text-amber-500" />
                              Pause
                            </button>
                          )}
                          {enrollment.status === 'paused' && (
                            <button
                              onClick={() => handlePauseResume(enrollment)}
                              className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2"
                            >
                              <Play className="w-4 h-4 text-emerald-500" />
                              Resume
                            </button>
                          )}
                          {['active', 'paused'].includes(enrollment.status) && (
                            <>
                              <button
                                onClick={() => handleMarkReplied(enrollment)}
                                className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2"
                              >
                                <MessageSquare className="w-4 h-4 text-green-500" />
                                Mark as Replied
                              </button>
                              <button
                                onClick={() => handleCancel(enrollment)}
                                className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2 text-red-600"
                              >
                                <StopCircle className="w-4 h-4" />
                                Cancel
                              </button>
                            </>
                          )}
                          {!['active', 'paused'].includes(enrollment.status) && (
                            <p className="px-4 py-2 text-sm text-slate-400">
                              No actions available
                            </p>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// Stat Card Component
function StatCard({ label, value, icon, color }) {
  const Icon = icon;
  const colorClasses = {
    emerald: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
    blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    amber: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
    green: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
    purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
    red: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
  };
  
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{value}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
        </div>
      </div>
    </div>
  );
}
