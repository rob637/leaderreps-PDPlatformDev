import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProspectsStore, PIPELINE_STAGES } from '../stores/prospectsStore';
import { useAuthStore } from '../stores/authStore';
import { TEAM_MEMBERS, getStageInfo } from '../config/team';
import {
  Users,
  Target,
  TrendingUp,
  DollarSign,
  ArrowRight,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus
} from 'lucide-react';

const StatCard = ({ icon: Icon, label, value, subValue, color, onClick }) => (
  <div 
    onClick={onClick}
    className={`bg-white rounded-xl border border-slate-200 p-5 ${onClick ? 'cursor-pointer hover:shadow-card transition' : ''}`}
  >
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-slate-500 mb-1">{label}</p>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
        {subValue && (
          <p className="text-sm text-slate-500 mt-1">{subValue}</p>
        )}
      </div>
      <div className={`p-2.5 rounded-xl ${color}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
    </div>
  </div>
);

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    loading,
    setCurrentUser,
    subscribeToProspects,
    getProspectsByOwner,
    getTeamStats,
    isCurrentUserAdmin
  } = useProspectsStore();

  useEffect(() => {
    if (user?.email) {
      setCurrentUser(user.email);
    }
    const unsubscribe = subscribeToProspects();
    return () => unsubscribe();
  }, [user?.email, setCurrentUser, subscribeToProspects]);

  const userIsAdmin = isCurrentUserAdmin();
  const myProspects = getProspectsByOwner(user?.email);
  const teamStats = userIsAdmin ? getTeamStats() : null;

  // Calculate my stats
  const myActiveProspects = myProspects.filter(p => !['won', 'lost'].includes(p.stage));
  const myWonProspects = myProspects.filter(p => p.stage === 'won');
  const myPipelineValue = myActiveProspects.reduce((sum, p) => sum + (p.value || 0), 0);
  const myWonValue = myWonProspects.reduce((sum, p) => sum + (p.value || 0), 0);

  // Calculate stages for my pipeline
  const myStagesCounts = PIPELINE_STAGES.filter(s => !['won', 'lost'].includes(s.id)).map(stage => ({
    ...stage,
    count: myProspects.filter(p => p.stage === stage.id).length
  }));

  // Recent activity (my prospects updated in last 7 days)
  const recentProspects = myProspects
    .filter(p => {
      if (!p.updatedAt) return false;
      const updated = new Date(p.updatedAt);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return updated > weekAgo;
    })
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    .slice(0, 5);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-brand-teal border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Welcome back, {user?.displayName || user?.email?.split('@')[0]}
          </h1>
          <p className="text-slate-500 mt-1">Here's what's happening with your pipeline today.</p>
        </div>
        <button
          onClick={() => navigate('/prospects')}
          className="flex items-center gap-2 px-4 py-2 bg-brand-teal hover:bg-brand-teal/90 text-white rounded-lg text-sm font-medium transition"
        >
          <Plus className="w-4 h-4" />
          <span>Add Prospect</span>
        </button>
      </div>

      {/* My Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Users}
          label="My Active Prospects"
          value={myActiveProspects.length}
          color="bg-blue-500"
          onClick={() => navigate('/prospects')}
        />
        <StatCard
          icon={DollarSign}
          label="My Pipeline Value"
          value={`$${myPipelineValue.toLocaleString()}`}
          color="bg-brand-teal"
        />
        <StatCard
          icon={CheckCircle}
          label="Won This Month"
          value={myWonProspects.length}
          subValue={`$${myWonValue.toLocaleString()}`}
          color="bg-green-500"
        />
        <StatCard
          icon={Target}
          label="Total Prospects"
          value={myProspects.length}
          color="bg-purple-500"
        />
      </div>

      {/* My Pipeline Overview */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-slate-900">My Pipeline</h2>
          <button
            onClick={() => navigate('/prospects')}
            className="text-sm text-brand-teal hover:underline flex items-center gap-1"
          >
            View all <ArrowRight className="w-4 h-4" />
          </button>
        </div>
        <div className="flex gap-2">
          {myStagesCounts.map(stage => (
            <div 
              key={stage.id}
              className="flex-1 text-center p-3 rounded-lg bg-slate-50"
            >
              <div 
                className="w-3 h-3 rounded-full mx-auto mb-2"
                style={{ backgroundColor: stage.color }}
              />
              <p className="text-lg font-bold text-slate-900">{stage.count}</p>
              <p className="text-xs text-slate-500">{stage.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-900 mb-4">Recent Activity</h2>
          {recentProspects.length > 0 ? (
            <div className="space-y-3">
              {recentProspects.map(prospect => {
                const stageInfo = getStageInfo(prospect.stage);
                return (
                  <div 
                    key={prospect.id}
                    onClick={() => navigate('/prospects')}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 cursor-pointer transition"
                  >
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
                      style={{ backgroundColor: stageInfo.color }}
                    >
                      {prospect.name?.charAt(0) || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{prospect.name}</p>
                      <p className="text-xs text-slate-500">{prospect.company || 'No company'}</p>
                    </div>
                    <span 
                      className="text-xs px-2 py-1 rounded-full text-white"
                      style={{ backgroundColor: stageInfo.color }}
                    >
                      {stageInfo.label}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500">
              <Clock className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p className="text-sm">No recent activity</p>
            </div>
          )}
        </div>

        {/* Team Overview (Admin Only) */}
        {userIsAdmin && teamStats ? (
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="font-semibold text-slate-900 mb-4">Team Overview</h2>
            <div className="space-y-3">
              {TEAM_MEMBERS.map(member => {
                const stats = teamStats[member.email] || { total: 0, value: 0 };
                return (
                  <div 
                    key={member.email}
                    className="flex items-center gap-3 p-2"
                  >
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
                      style={{ backgroundColor: member.color }}
                    >
                      {member.initials}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900">{member.name}</p>
                      <p className="text-xs text-slate-500">{stats.total} prospects</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-brand-teal">
                        ${stats.value.toLocaleString()}
                      </p>
                      <p className="text-xs text-slate-500">pipeline</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="font-semibold text-slate-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => navigate('/prospects')}
                className="flex flex-col items-center gap-2 p-4 rounded-lg border border-slate-200 hover:bg-slate-50 transition"
              >
                <Users className="w-6 h-6 text-brand-teal" />
                <span className="text-sm text-slate-700">View Prospects</span>
              </button>
              <button
                onClick={() => navigate('/outreach')}
                className="flex flex-col items-center gap-2 p-4 rounded-lg border border-slate-200 hover:bg-slate-50 transition"
              >
                <Target className="w-6 h-6 text-purple-500" />
                <span className="text-sm text-slate-700">Outreach Queue</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
