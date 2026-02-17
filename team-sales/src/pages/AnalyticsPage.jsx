import React, { useEffect, useState } from 'react';
import { useProspectsStore, PIPELINE_STAGES } from '../stores/prospectsStore';
import { useOutreachStore } from '../stores/outreachStore';
import { useAuthStore } from '../stores/authStore';
import { TEAM_MEMBERS } from '../config/team';
import { subDays, startOfDay, endOfDay, isWithinInterval } from 'date-fns';
import {
  BarChart3,
  TrendingUp,
  Users,
  Mail,
  Linkedin,
  Phone,
  MessageSquare,
  Calendar,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  DollarSign
} from 'lucide-react';

// Channel configuration
const CHANNELS = [
  { id: 'email', label: 'Email', icon: Mail, color: '#3b82f6' },
  { id: 'linkedin', label: 'LinkedIn', icon: Linkedin, color: '#0077b5' },
  { id: 'call', label: 'Calls', icon: Phone, color: '#8b5cf6' },
  { id: 'sms', label: 'SMS', icon: MessageSquare, color: '#10b981' },
];

// Date range options
const DATE_RANGES = [
  { id: '7d', label: '7 Days', days: 7 },
  { id: '30d', label: '30 Days', days: 30 },
  { id: '90d', label: '90 Days', days: 90 },
  { id: 'all', label: 'All Time', days: null },
];

// Stat card component
// eslint-disable-next-line no-unused-vars
const StatCard = ({ icon: IconComponent, label, value, subValue, trend, color = 'bg-brand-teal' }) => (
  <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">{label}</p>
        <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{value}</p>
        {subValue && (
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{subValue}</p>
        )}
        {trend !== undefined && (
          <div className={`flex items-center gap-1 mt-1 text-sm ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {trend >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
            <span>{Math.abs(trend)}% vs prev period</span>
          </div>
        )}
      </div>
      <div className={`p-2.5 rounded-xl ${color}`}>
        <IconComponent className="w-5 h-5 text-white" />
      </div>
    </div>
  </div>
);

// Channel bar component
const ChannelBar = ({ channel, count, percentage, maxCount }) => {
  const Icon = channel.icon;
  const barWidth = maxCount > 0 ? (count / maxCount) * 100 : 0;
  
  return (
    <div className="flex items-center gap-3">
      <div 
        className="w-8 h-8 rounded-lg flex items-center justify-center"
        style={{ backgroundColor: `${channel.color}20` }}
      >
        <Icon className="w-4 h-4" style={{ color: channel.color }} />
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{channel.label}</span>
          <span className="text-sm text-slate-500 dark:text-slate-400">
            {count} ({percentage}%)
          </span>
        </div>
        <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
          <div 
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${barWidth}%`, backgroundColor: channel.color }}
          />
        </div>
      </div>
    </div>
  );
};

// Pipeline funnel component
const PipelineFunnel = ({ stages }) => {
  const maxCount = Math.max(...stages.map(s => s.count), 1);
  
  return (
    <div className="space-y-2">
      {stages.map((stage) => {
        const width = (stage.count / maxCount) * 100;
        return (
          <div key={stage.id} className="flex items-center gap-3">
            <div className="w-24 text-sm text-slate-600 dark:text-slate-400 truncate">{stage.label}</div>
            <div className="flex-1 h-8 bg-slate-100 dark:bg-slate-700 rounded relative overflow-hidden">
              <div 
                className="h-full rounded transition-all duration-500 flex items-center justify-end px-2"
                style={{ 
                  width: `${Math.max(width, 5)}%`,
                  backgroundColor: stage.color 
                }}
              >
                <span className="text-xs font-medium text-white">{stage.count}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Team leaderboard component
const TeamLeaderboard = ({ members }) => {
  return (
    <div className="space-y-3">
      {members.map((member, i) => (
        <div key={member.email} className="flex items-center gap-3">
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
            i === 0 ? 'bg-amber-400 text-amber-900' :
            i === 1 ? 'bg-slate-300 text-slate-700' :
            i === 2 ? 'bg-amber-600 text-amber-100' :
            'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
          }`}>
            {i + 1}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">{member.name}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">{member.activities} activities</div>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium text-slate-900 dark:text-slate-100">{member.prospects}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">prospects</div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default function AnalyticsPage() {
  useAuthStore(); // For potential future user-specific filtering
  const { prospects, subscribeToProspects, isCurrentUserAdmin } = useProspectsStore();
  const { activities, initialize, cleanup } = useOutreachStore();
  
  const [dateRange, setDateRange] = useState('30d');
  
  useEffect(() => {
    const unsubscribe = subscribeToProspects();
    initialize();
    return () => {
      unsubscribe();
      cleanup();
    };
  }, [subscribeToProspects, initialize, cleanup]);

  const isAdmin = isCurrentUserAdmin();
  
  // Get date filter
  const rangeConfig = DATE_RANGES.find(r => r.id === dateRange);
  const filterStartDate = rangeConfig?.days 
    ? startOfDay(subDays(new Date(), rangeConfig.days))
    : null;
  const filterEndDate = endOfDay(new Date());
  
  // Filter activities by date range
  const filteredActivities = activities.filter(a => {
    if (!filterStartDate) return true;
    const activityDate = a.createdAt?.toDate?.() || new Date(a.createdAt);
    return isWithinInterval(activityDate, { start: filterStartDate, end: filterEndDate });
  });
  
  // Calculate outreach by channel
  const channelCounts = CHANNELS.map(channel => {
    const count = filteredActivities.filter(a => {
      if (channel.id === 'email') return a.channel === 'email' || a.type?.includes('email');
      if (channel.id === 'linkedin') return a.channel === 'linkedin' || a.type?.includes('linkedin');
      if (channel.id === 'call') return a.channel === 'call' || a.type === 'call';
      if (channel.id === 'sms') return a.channel === 'text' || a.type === 'sms';
      return false;
    }).length;
    return { ...channel, count };
  });
  
  const totalActivities = channelCounts.reduce((sum, c) => sum + c.count, 0);
  const maxChannelCount = Math.max(...channelCounts.map(c => c.count), 1);
  
  // Calculate response rates (activities with positive outcomes)
  const positiveOutcomes = ['replied', 'meeting_booked', 'connected', 'interested'];
  const responsiveActivities = filteredActivities.filter(a => 
    positiveOutcomes.includes(a.outcome)
  ).length;
  const responseRate = totalActivities > 0 
    ? Math.round((responsiveActivities / totalActivities) * 100) 
    : 0;
  
  // Pipeline stats
  const pipelineStages = PIPELINE_STAGES.filter(s => !['won', 'lost'].includes(s.id)).map(stage => ({
    ...stage,
    count: prospects.filter(p => p.stage === stage.id).length
  }));
  
  const activeProspects = prospects.filter(p => !['won', 'lost'].includes(p.stage)).length;
  const wonProspects = prospects.filter(p => p.stage === 'won').length;
  const pipelineValue = prospects
    .filter(p => !['won', 'lost'].includes(p.stage))
    .reduce((sum, p) => sum + (p.value || 0), 0);
  const wonValue = prospects
    .filter(p => p.stage === 'won')
    .reduce((sum, p) => sum + (p.value || 0), 0);
  
  // Team leaderboard (admin only)
  const teamStats = isAdmin ? TEAM_MEMBERS.map(member => {
    const memberProspects = prospects.filter(p => 
      p.owner?.toLowerCase() === member.email.toLowerCase() ||
      p.ownerEmail?.toLowerCase() === member.email.toLowerCase()
    );
    const memberActivities = filteredActivities.filter(a =>
      a.userEmail?.toLowerCase() === member.email.toLowerCase() ||
      a.userId === member.email
    );
    return {
      ...member,
      prospects: memberProspects.length,
      activities: memberActivities.length
    };
  }).sort((a, b) => b.activities - a.activities) : [];
  
  // Stale prospects (no activity in 7+ days)
  const staleProspects = prospects.filter(p => {
    if (['won', 'lost'].includes(p.stage)) return false;
    const lastActivity = p.lastActivityAt || p.updatedAt;
    if (!lastActivity) return true;
    const daysSince = Math.floor((Date.now() - new Date(lastActivity).getTime()) / (1000 * 60 * 60 * 24));
    return daysSince >= 7;
  }).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Analytics</h1>
          <p className="text-slate-600 dark:text-slate-400">Track outreach performance and pipeline health</p>
        </div>
        
        {/* Date range filter */}
        <div className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-1">
          {DATE_RANGES.map(range => (
            <button
              key={range.id}
              onClick={() => setDateRange(range.id)}
              className={`px-3 py-1.5 text-sm rounded-md transition ${
                dateRange === range.id
                  ? 'bg-brand-teal text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>
      
      {/* Key metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          icon={BarChart3}
          label="Total Activities"
          value={totalActivities}
          subValue={`${filteredActivities.length} in period`}
          color="bg-brand-teal"
        />
        <StatCard
          icon={TrendingUp}
          label="Response Rate"
          value={`${responseRate}%`}
          subValue={`${responsiveActivities} positive responses`}
          color="bg-blue-500"
        />
        <StatCard
          icon={Users}
          label="Active Prospects"
          value={activeProspects}
          subValue={`${staleProspects} need attention`}
          color="bg-amber-500"
        />
        <StatCard
          icon={DollarSign}
          label="Pipeline Value"
          value={`$${pipelineValue.toLocaleString()}`}
          subValue={`$${wonValue.toLocaleString()} won`}
          color="bg-green-500"
        />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Outreach by Channel */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
            <Mail className="w-5 h-5 text-brand-teal" />
            Outreach by Channel
          </h2>
          <div className="space-y-4">
            {channelCounts.map(channel => (
              <ChannelBar
                key={channel.id}
                channel={channel}
                count={channel.count}
                percentage={totalActivities > 0 ? Math.round((channel.count / totalActivities) * 100) : 0}
                maxCount={maxChannelCount}
              />
            ))}
          </div>
          {totalActivities === 0 && (
            <p className="text-center text-slate-500 dark:text-slate-400 py-8">
              No activities in selected period
            </p>
          )}
        </div>
        
        {/* Pipeline Funnel */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-brand-teal" />
            Pipeline Funnel
          </h2>
          <PipelineFunnel stages={pipelineStages} />
          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-600">{wonProspects}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Won</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-400">{prospects.filter(p => p.stage === 'lost').length}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Lost</div>
            </div>
          </div>
        </div>
        
        {/* Team Leaderboard (admin only) */}
        {isAdmin && teamStats.length > 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-brand-teal" />
              Team Leaderboard
            </h2>
            <TeamLeaderboard members={teamStats} />
          </div>
        )}
        
        {/* Stale Prospects Alert */}
        {staleProspects > 0 && (
          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800 p-6">
            <h2 className="text-lg font-semibold text-amber-800 dark:text-amber-300 mb-2 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Prospects Need Attention
            </h2>
            <p className="text-amber-700 dark:text-amber-400 mb-3">
              {staleProspects} prospects haven't been contacted in 7+ days
            </p>
            <button
              onClick={() => {/* Could navigate to prospects filtered by stale */}}
              className="text-sm text-amber-800 dark:text-amber-300 hover:underline font-medium"
            >
              View stale prospects →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
