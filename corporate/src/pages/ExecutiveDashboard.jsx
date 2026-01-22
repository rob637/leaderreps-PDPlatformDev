import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, Target, ArrowRight, Activity, Zap, BarChart3, 
  Calendar, DollarSign, TrendingUp, TrendingDown, Clock,
  CheckCircle, AlertCircle, Eye, Mail, FileText, Bell,
  ChevronRight, Plus, RefreshCw, Filter, MoreHorizontal
} from 'lucide-react';
import { collection, query, getDocs, orderBy, where, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

/**
 * Executive Dashboard - Command Center Home Screen
 * 
 * A unified dashboard showing:
 * - Today's priorities and calendar
 * - Pipeline snapshot with deals closing soon
 * - Key metrics with trends
 * - Activity feed from all modules
 * - Quick action cards
 */

const ExecutiveDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalPipelineValue: 0,
    dealsClosingThisWeek: 0,
    activeProspects: 0,
    proposalsPending: 0,
    demoViewsToday: 0,
    emailsSent: 0,
    conversionRate: 0,
    avgDealSize: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [upcomingTasks, setUpcomingTasks] = useState([]);
  const [dealsClosingSoon, setDealsClosingSoon] = useState([]);
  const [todayDate] = useState(new Date());

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch prospects
      const prospectsSnap = await getDocs(collection(db, 'corporate_prospects'));
      const prospects = prospectsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      
      // Fetch proposals
      const proposalsSnap = await getDocs(collection(db, 'corporate_proposals'));
      const proposals = proposalsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      
      // Fetch demos
      const demosSnap = await getDocs(collection(db, 'corporate_demo_links'));
      const demos = demosSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      
      // Fetch goals
      const goalsSnap = await getDocs(collection(db, 'corporate_goals'));
      const goals = goalsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      // Calculate metrics
      const activeProspects = prospects.filter(p => p.stage && p.stage !== 'lost' && p.stage !== 'won');
      const wonDeals = prospects.filter(p => p.stage === 'won');
      const totalPipelineValue = activeProspects.reduce((acc, p) => acc + (p.value || 0), 0);
      const proposalsPending = proposals.filter(p => p.status === 'sent').length;
      const totalDemoViews = demos.reduce((acc, d) => acc + (d.views || 0), 0);
      
      // Deals closing this week (prospects in proposal/negotiation stage)
      const closingStages = ['proposal', 'negotiation'];
      const dealsClosing = activeProspects.filter(p => closingStages.includes(p.stage));
      
      // Calculate conversion rate
      const totalClosed = wonDeals.length + prospects.filter(p => p.stage === 'lost').length;
      const conversionRate = totalClosed > 0 ? Math.round((wonDeals.length / totalClosed) * 100) : 0;
      
      // Average deal size from won deals
      const avgDealSize = wonDeals.length > 0 
        ? Math.round(wonDeals.reduce((acc, p) => acc + (p.value || 0), 0) / wonDeals.length)
        : 0;

      setMetrics({
        totalPipelineValue,
        dealsClosingThisWeek: dealsClosing.length,
        activeProspects: activeProspects.length,
        proposalsPending,
        demoViewsToday: totalDemoViews,
        emailsSent: 0,
        conversionRate,
        avgDealSize
      });

      setDealsClosingSoon(dealsClosing.slice(0, 5));

      // Build activity feed
      const activity = [
        ...proposals.filter(p => p.createdAt).map(p => ({
          type: 'proposal',
          title: `Proposal created for ${p.clientName}`,
          amount: p.amount,
          timestamp: new Date(p.createdAt),
          icon: FileText,
          color: 'purple'
        })),
        ...demos.filter(d => d.views > 0 && d.lastViewed).map(d => ({
          type: 'demo',
          title: `${d.prospect || 'Someone'} viewed ${d.demoTitle}`,
          views: d.views,
          timestamp: new Date(d.lastViewed),
          icon: Eye,
          color: 'blue'
        })),
        ...prospects.filter(p => p.createdAt).map(p => ({
          type: 'prospect',
          title: `New prospect: ${p.name || p.company}`,
          stage: p.stage,
          timestamp: new Date(p.createdAt),
          icon: Users,
          color: 'green'
        }))
      ].sort((a, b) => b.timestamp - a.timestamp).slice(0, 8);
      
      setRecentActivity(activity);

      // Build tasks from various sources
      const tasks = [
        ...dealsClosing.map(d => ({
          title: `Follow up with ${d.name || d.company}`,
          type: 'follow-up',
          priority: 'high',
          link: '/sales/prospects'
        })),
        ...proposals.filter(p => p.status === 'sent').map(p => ({
          title: `Check status: ${p.clientName} proposal`,
          type: 'proposal',
          priority: 'medium',
          link: '/sales/proposals'
        })),
        ...goals.filter(g => g.status === 'active').slice(0, 3).map(g => ({
          title: g.title || 'Work on goal',
          type: 'goal',
          priority: 'low',
          link: '/coaching/goals'
        }))
      ].slice(0, 6);
      
      setUpcomingTasks(tasks);

    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value}`;
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto flex items-center justify-center min-h-[60vh]">
        <RefreshCw className="w-8 h-8 animate-spin text-corporate-teal" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-corporate-navy">
            {getGreeting()}, {user?.displayName?.split(' ')[0] || 'there'}
          </h1>
          <p className="text-slate-500 mt-1">
            {todayDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={fetchDashboardData}
            className="bg-white border border-slate-200 px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-50 flex items-center gap-2 text-sm"
          >
            <RefreshCw size={14} /> Refresh
          </button>
          <Link 
            to="/sales/prospects"
            className="bg-corporate-teal text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-teal-600"
          >
            <Plus size={16} /> New Prospect
          </Link>
        </div>
      </div>

      {/* Primary KPIs */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-gradient-to-br from-corporate-navy to-slate-800 text-white p-5 rounded-xl shadow-lg">
          <div className="flex justify-between items-start mb-3">
            <span className="text-blue-200 text-sm font-medium">Total Pipeline</span>
            <DollarSign className="w-5 h-5 text-blue-300" />
          </div>
          <div className="text-3xl font-bold">{formatCurrency(metrics.totalPipelineValue)}</div>
          <div className="mt-2 text-xs text-blue-200">
            {metrics.activeProspects} active opportunities
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start mb-3">
            <span className="text-slate-500 text-sm font-medium">Closing This Week</span>
            <Target className="w-5 h-5 text-amber-500" />
          </div>
          <div className="text-3xl font-bold text-slate-800">{metrics.dealsClosingThisWeek}</div>
          <div className="mt-2 text-xs text-amber-600 font-medium">
            {metrics.dealsClosingThisWeek > 0 ? 'Needs attention' : 'No urgent deals'}
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start mb-3">
            <span className="text-slate-500 text-sm font-medium">Conversion Rate</span>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <div className="text-3xl font-bold text-slate-800">{metrics.conversionRate}%</div>
          <div className="mt-2 text-xs text-green-600">
            Win rate from closed deals
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start mb-3">
            <span className="text-slate-500 text-sm font-medium">Avg Deal Size</span>
            <BarChart3 className="w-5 h-5 text-purple-500" />
          </div>
          <div className="text-3xl font-bold text-slate-800">{formatCurrency(metrics.avgDealSize)}</div>
          <div className="mt-2 text-xs text-slate-500">
            From won deals
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Left Column - Tasks & Deals */}
        <div className="col-span-8 space-y-6">
          {/* Today's Priorities */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center">
              <h2 className="font-bold text-corporate-navy flex items-center gap-2">
                <CheckCircle size={18} className="text-corporate-teal" />
                Today's Priorities
              </h2>
              <span className="text-xs text-slate-400">{upcomingTasks.length} items</span>
            </div>
            <div className="divide-y divide-slate-100">
              {upcomingTasks.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  <CheckCircle className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p>No pending tasks. You're all caught up!</p>
                </div>
              ) : (
                upcomingTasks.map((task, idx) => (
                  <Link 
                    key={idx} 
                    to={task.link}
                    className="flex items-center gap-4 p-4 hover:bg-slate-50 transition"
                  >
                    <div className={`w-2 h-2 rounded-full ${
                      task.priority === 'high' ? 'bg-red-500' :
                      task.priority === 'medium' ? 'bg-amber-500' : 'bg-green-500'
                    }`} />
                    <span className="flex-1 text-sm font-medium text-slate-700">{task.title}</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      task.type === 'follow-up' ? 'bg-blue-50 text-blue-600' :
                      task.type === 'proposal' ? 'bg-purple-50 text-purple-600' :
                      'bg-green-50 text-green-600'
                    }`}>
                      {task.type}
                    </span>
                    <ChevronRight size={16} className="text-slate-300" />
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* Deals Closing Soon */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center">
              <h2 className="font-bold text-corporate-navy flex items-center gap-2">
                <Target size={18} className="text-amber-500" />
                Deals Closing Soon
              </h2>
              <Link to="/sales/prospects" className="text-xs text-corporate-teal hover:underline">
                View pipeline →
              </Link>
            </div>
            {dealsClosingSoon.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <Target className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p>No deals in closing stage</p>
                <Link to="/sales/prospects" className="text-corporate-teal text-sm mt-2 hover:underline">
                  Add prospects to pipeline
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {dealsClosingSoon.map((deal, idx) => (
                  <div key={idx} className="flex items-center gap-4 p-4 hover:bg-slate-50">
                    <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                      <Users size={18} className="text-slate-500" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-slate-800">{deal.name || deal.company}</h4>
                      <p className="text-xs text-slate-500">{deal.company} • {deal.stage}</p>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-corporate-navy">{formatCurrency(deal.value || 0)}</div>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        deal.stage === 'negotiation' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {deal.stage}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Stats Row */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center">
                <Eye className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-800">{metrics.demoViewsToday}</div>
                <div className="text-xs text-slate-500">Demo Views</div>
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-purple-50 flex items-center justify-center">
                <FileText className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-800">{metrics.proposalsPending}</div>
                <div className="text-xs text-slate-500">Proposals Pending</div>
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-green-50 flex items-center justify-center">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-800">{metrics.activeProspects}</div>
                <div className="text-xs text-slate-500">Active Prospects</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Activity Feed */}
        <div className="col-span-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm sticky top-6">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center">
              <h2 className="font-bold text-corporate-navy flex items-center gap-2">
                <Activity size={18} className="text-corporate-teal" />
                Recent Activity
              </h2>
              <button className="text-slate-400 hover:text-slate-600">
                <MoreHorizontal size={16} />
              </button>
            </div>
            <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
              {recentActivity.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  <Activity className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No recent activity</p>
                </div>
              ) : (
                recentActivity.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-4 hover:bg-slate-50">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      item.color === 'purple' ? 'bg-purple-100' :
                      item.color === 'blue' ? 'bg-blue-100' :
                      item.color === 'green' ? 'bg-green-100' :
                      'bg-slate-100'
                    }`}>
                      <item.icon size={14} className={`${
                        item.color === 'purple' ? 'text-purple-600' :
                        item.color === 'blue' ? 'text-blue-600' :
                        item.color === 'green' ? 'text-green-600' :
                        'text-slate-600'
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-700 truncate">{item.title}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {item.timestamp.toLocaleDateString()} {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="p-3 border-t border-slate-100 bg-slate-50">
              <Link 
                to="/analytics/leaders"
                className="text-xs text-corporate-teal font-medium hover:underline flex items-center justify-center gap-1"
              >
                View full analytics <ArrowRight size={12} />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions Bar */}
      <div className="mt-8 bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl p-6 border border-slate-200">
        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-4">Quick Actions</h3>
        <div className="grid grid-cols-5 gap-4">
          <Link 
            to="/sales/prospects"
            className="bg-white p-4 rounded-lg border border-slate-200 hover:border-corporate-teal hover:shadow-md transition text-center group"
          >
            <Users className="w-6 h-6 mx-auto mb-2 text-slate-400 group-hover:text-corporate-teal" />
            <span className="text-sm font-medium text-slate-700">Add Prospect</span>
          </Link>
          <Link 
            to="/sales/demos"
            className="bg-white p-4 rounded-lg border border-slate-200 hover:border-corporate-teal hover:shadow-md transition text-center group"
          >
            <Eye className="w-6 h-6 mx-auto mb-2 text-slate-400 group-hover:text-corporate-teal" />
            <span className="text-sm font-medium text-slate-700">Share Demo</span>
          </Link>
          <Link 
            to="/sales/proposals"
            className="bg-white p-4 rounded-lg border border-slate-200 hover:border-corporate-teal hover:shadow-md transition text-center group"
          >
            <FileText className="w-6 h-6 mx-auto mb-2 text-slate-400 group-hover:text-corporate-teal" />
            <span className="text-sm font-medium text-slate-700">New Proposal</span>
          </Link>
          <Link 
            to="/ops/scheduler"
            className="bg-white p-4 rounded-lg border border-slate-200 hover:border-corporate-teal hover:shadow-md transition text-center group"
          >
            <Calendar className="w-6 h-6 mx-auto mb-2 text-slate-400 group-hover:text-corporate-teal" />
            <span className="text-sm font-medium text-slate-700">Schedule Call</span>
          </Link>
          <Link 
            to="/coaching/goals"
            className="bg-white p-4 rounded-lg border border-slate-200 hover:border-corporate-teal hover:shadow-md transition text-center group"
          >
            <Target className="w-6 h-6 mx-auto mb-2 text-slate-400 group-hover:text-corporate-teal" />
            <span className="text-sm font-medium text-slate-700">Set Goal</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ExecutiveDashboard;
