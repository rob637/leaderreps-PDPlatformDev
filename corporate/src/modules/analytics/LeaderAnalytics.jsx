import React, { useState, useEffect } from 'react';
import { 
  BarChart, TrendingUp, Users, Target, 
  ArrowUp, Activity, PieChart, Download, Calendar,
  RefreshCw, HelpCircle, CheckCircle, Eye, Send,
  FileText, Clock
} from 'lucide-react';
import { collection, query, getDocs, orderBy, where, Timestamp } from 'firebase/firestore';
import { db } from '../../firebase';

/**
 * LeaderAnalytics - Corporate Dashboard Analytics
 * 
 * HOW TO USE:
 * This dashboard aggregates data from multiple Firestore collections:
 * - corporate_prospects: Pipeline & prospect data
 * - corporate_proposals: Proposals sent and accepted
 * - corporate_demo_links: Demo engagement tracking
 * - corporate_goals: Goal tracking metrics
 * 
 * All data is fetched in real-time from Firestore.
 * Use the Export Report button to download CSV of current metrics.
 */

const LeaderAnalytics = () => {
    const [period, setPeriod] = useState('week');
    const [loading, setLoading] = useState(true);
    const [metrics, setMetrics] = useState({
        activeProspects: 0,
        totalPipelineValue: 0,
        proposalsSent: 0,
        proposalsAccepted: 0,
        demoLinksCreated: 0,
        totalDemoViews: 0,
        goalsCreated: 0,
        goalsCompleted: 0
    });
    const [recentActivity, setRecentActivity] = useState([]);
    const [prospectsByStage, setProspectsByStage] = useState([]);

    // Calculate date range based on period
    const getDateRange = () => {
        const now = new Date();
        let startDate;
        
        switch (period) {
            case 'week':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case 'month':
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            case 'quarter':
                startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
                break;
            default:
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        }
        
        return startDate.toISOString();
    };

    // Fetch all analytics data
    useEffect(() => {
        const fetchAnalytics = async () => {
            setLoading(true);
            const dateRange = getDateRange();
            
            try {
                // Fetch Prospects
                const prospectsSnap = await getDocs(collection(db, 'corporate_prospects'));
                const prospects = prospectsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
                
                // Fetch Proposals
                const proposalsSnap = await getDocs(collection(db, 'corporate_proposals'));
                const proposals = proposalsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
                
                // Fetch Demo Links
                const demosSnap = await getDocs(collection(db, 'corporate_demo_links'));
                const demos = demosSnap.docs.map(d => ({ id: d.id, ...d.data() }));
                
                // Fetch Goals
                const goalsSnap = await getDocs(collection(db, 'corporate_goals'));
                const goals = goalsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

                // Calculate metrics
                const activeProspects = prospects.filter(p => p.stage && p.stage !== 'lost').length;
                const totalPipelineValue = prospects.reduce((acc, p) => acc + (p.value || 0), 0);
                const proposalsSent = proposals.filter(p => p.status === 'sent' || p.status === 'accepted').length;
                const proposalsAccepted = proposals.filter(p => p.status === 'accepted').length;
                const demoLinksCreated = demos.length;
                const totalDemoViews = demos.reduce((acc, d) => acc + (d.views || 0), 0);
                const goalsCreated = goals.length;
                const goalsCompleted = goals.filter(g => g.status === 'completed').length;

                setMetrics({
                    activeProspects,
                    totalPipelineValue,
                    proposalsSent,
                    proposalsAccepted,
                    demoLinksCreated,
                    totalDemoViews,
                    goalsCreated,
                    goalsCompleted
                });

                // Calculate prospects by stage
                const stages = ['new', 'contacted', 'qualified', 'demo', 'proposal', 'negotiation', 'won', 'lost'];
                const byStage = stages.map(stage => ({
                    stage,
                    count: prospects.filter(p => p.stage === stage).length,
                    value: prospects.filter(p => p.stage === stage).reduce((acc, p) => acc + (p.value || 0), 0)
                })).filter(s => s.count > 0);
                setProspectsByStage(byStage);

                // Build recent activity feed
                const activity = [
                    ...proposals.filter(p => p.createdAt).map(p => ({
                        type: 'proposal',
                        title: `Proposal for ${p.clientName}`,
                        status: p.status,
                        amount: p.amount,
                        date: p.createdAt
                    })),
                    ...demos.filter(d => d.createdAt).map(d => ({
                        type: 'demo',
                        title: `Demo shared: ${d.demoTitle}`,
                        views: d.views,
                        date: d.createdAt
                    })),
                    ...prospects.filter(p => p.createdAt).map(p => ({
                        type: 'prospect',
                        title: `New prospect: ${p.name || p.company}`,
                        stage: p.stage,
                        date: p.createdAt
                    }))
                ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10);
                
                setRecentActivity(activity);

            } catch (err) {
                console.error("Error fetching analytics:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchAnalytics();
    }, [period]);

    // Export to CSV
    const handleExport = () => {
        const csvData = [
            ['Metric', 'Value'],
            ['Active Prospects', metrics.activeProspects],
            ['Total Pipeline Value', metrics.totalPipelineValue],
            ['Proposals Sent', metrics.proposalsSent],
            ['Proposals Accepted', metrics.proposalsAccepted],
            ['Demo Links Created', metrics.demoLinksCreated],
            ['Total Demo Views', metrics.totalDemoViews],
            ['Goals Created', metrics.goalsCreated],
            ['Goals Completed', metrics.goalsCompleted]
        ];
        
        const csv = csvData.map(row => row.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `leaderreps-analytics-${period}-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-corporate-navy">Leader Analytics</h1>
                    <p className="text-slate-500 mt-1">Detailed engagement and ROI metrics for client cohorts.</p>
                </div>
                <div className="flex gap-2">
                    <select 
                        value={period}
                        onChange={(e) => setPeriod(e.target.value)}
                        className="bg-white border border-slate-300 text-slate-700 text-sm rounded-lg p-2.5 focus:ring-corporate-teal outline-none"
                    >
                        <option value="week">This Week</option>
                        <option value="month">This Month</option>
                        <option value="quarter">This Quarter</option>
                    </select>
                    <button 
                        onClick={handleExport}
                        className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-slate-50"
                    >
                        <Download className="w-4 h-4" /> Export Report
                    </button>
                </div>
            </div>

            {/* Loading State */}
            {loading && (
                <div className="flex items-center justify-center py-12">
                    <RefreshCw className="w-6 h-6 animate-spin text-corporate-teal" />
                    <span className="ml-2 text-slate-500">Loading analytics...</span>
                </div>
            )}

            {!loading && (
                <>
                    {/* Top Level KPIs */}
                    <div className="grid grid-cols-4 gap-4 mb-8">
                        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                            <div className="text-slate-500 text-sm font-medium mb-1 flex items-center gap-2">
                                <Users size={14} /> Active Prospects
                            </div>
                            <div className="text-3xl font-bold text-slate-800">{metrics.activeProspects}</div>
                            <div className="flex items-center text-slate-400 text-xs mt-2">
                                In pipeline (excluding lost)
                            </div>
                        </div>
                        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                            <div className="text-slate-500 text-sm font-medium mb-1 flex items-center gap-2">
                                <TrendingUp size={14} /> Pipeline Value
                            </div>
                            <div className="text-3xl font-bold text-slate-800">${metrics.totalPipelineValue.toLocaleString()}</div>
                            <div className="flex items-center text-slate-400 text-xs mt-2">
                                Total potential revenue
                            </div>
                        </div>
                        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                            <div className="text-slate-500 text-sm font-medium mb-1 flex items-center gap-2">
                                <Send size={14} /> Proposals Sent
                            </div>
                            <div className="text-3xl font-bold text-slate-800">{metrics.proposalsSent}</div>
                            <div className="flex items-center text-green-600 text-xs mt-2">
                                <CheckCircle size={12} className="mr-1" /> {metrics.proposalsAccepted} accepted
                            </div>
                        </div>
                        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                            <div className="text-slate-500 text-sm font-medium mb-1 flex items-center gap-2">
                                <Eye size={14} /> Demo Engagement
                            </div>
                            <div className="text-3xl font-bold text-slate-800">{metrics.totalDemoViews}</div>
                            <div className="text-xs text-slate-400 mt-2">
                                views across {metrics.demoLinksCreated} links
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-12 gap-6">
                        {/* Pipeline Breakdown */}
                        <div className="col-span-8 bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                    <Activity className="w-5 h-5 text-purple-600" />
                                    Pipeline by Stage
                                </h3>
                            </div>
                            
                            {prospectsByStage.length === 0 ? (
                                <div className="text-center py-8 text-slate-400">
                                    <Users className="w-12 h-12 mx-auto mb-2 opacity-30" />
                                    <p>No prospects yet. Add prospects in the Prospects module.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {prospectsByStage.map((stage) => (
                                        <div key={stage.stage} className="flex items-center gap-4">
                                            <div className="w-24 text-sm font-medium text-slate-600 capitalize">{stage.stage}</div>
                                            <div className="flex-1">
                                                <div className="w-full bg-slate-100 rounded-full h-6 overflow-hidden">
                                                    <div 
                                                        className={`h-full rounded-full flex items-center justify-end pr-2 text-xs font-bold text-white ${
                                                            stage.stage === 'won' ? 'bg-green-500' :
                                                            stage.stage === 'lost' ? 'bg-red-400' :
                                                            stage.stage === 'proposal' ? 'bg-purple-500' :
                                                            stage.stage === 'demo' ? 'bg-blue-500' :
                                                            'bg-corporate-teal'
                                                        }`}
                                                        style={{ width: `${Math.max(15, (stage.count / Math.max(...prospectsByStage.map(s => s.count))) * 100)}%` }}
                                                    >
                                                        {stage.count}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="w-24 text-right text-sm font-mono text-slate-500">
                                                ${stage.value.toLocaleString()}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Recent Activity */}
                        <div className="col-span-4 bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                    <Clock className="w-5 h-5 text-blue-600" />
                                    Recent Activity
                                </h3>
                            </div>
                            
                            {recentActivity.length === 0 ? (
                                <div className="text-center py-8 text-slate-400">
                                    <Activity className="w-10 h-10 mx-auto mb-2 opacity-30" />
                                    <p className="text-sm">No recent activity</p>
                                </div>
                            ) : (
                                <div className="space-y-3 max-h-80 overflow-y-auto">
                                    {recentActivity.map((item, idx) => (
                                        <div key={idx} className="flex items-start gap-3 p-2 rounded-lg hover:bg-slate-50">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                                item.type === 'proposal' ? 'bg-purple-100' :
                                                item.type === 'demo' ? 'bg-blue-100' :
                                                'bg-green-100'
                                            }`}>
                                                {item.type === 'proposal' && <FileText size={14} className="text-purple-600" />}
                                                {item.type === 'demo' && <Eye size={14} className="text-blue-600" />}
                                                {item.type === 'prospect' && <Users size={14} className="text-green-600" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-slate-700 truncate">{item.title}</p>
                                                <p className="text-xs text-slate-400">
                                                    {new Date(item.date).toLocaleDateString()}
                                                    {item.amount && ` • $${item.amount.toLocaleString()}`}
                                                    {item.views !== undefined && ` • ${item.views} views`}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Goals Progress */}
                        <div className="col-span-12 bg-gradient-to-r from-corporate-navy to-slate-800 rounded-xl p-6 text-white">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold flex items-center gap-2">
                                    <Target className="w-5 h-5" />
                                    Goal Frameworks Progress
                                </h3>
                                <span className="text-xs text-blue-200">From Goal Frameworks module</span>
                            </div>
                            
                            <div className="grid grid-cols-4 gap-6">
                                <div className="bg-white/10 rounded-lg p-4">
                                    <div className="text-2xl font-bold">{metrics.goalsCreated}</div>
                                    <div className="text-sm text-blue-200">Goals Created</div>
                                </div>
                                <div className="bg-white/10 rounded-lg p-4">
                                    <div className="text-2xl font-bold">{metrics.goalsCompleted}</div>
                                    <div className="text-sm text-blue-200">Goals Completed</div>
                                </div>
                                <div className="bg-white/10 rounded-lg p-4">
                                    <div className="text-2xl font-bold">
                                        {metrics.goalsCreated > 0 ? Math.round((metrics.goalsCompleted / metrics.goalsCreated) * 100) : 0}%
                                    </div>
                                    <div className="text-sm text-blue-200">Completion Rate</div>
                                </div>
                                <div className="bg-white/10 rounded-lg p-4">
                                    <div className="text-2xl font-bold">{metrics.goalsCreated - metrics.goalsCompleted}</div>
                                    <div className="text-sm text-blue-200">In Progress</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Instructions */}
                    <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-3">
                        <HelpCircle size={18} className="text-blue-500 shrink-0 mt-0.5" />
                        <div>
                            <h4 className="font-medium text-blue-800 text-sm">About This Dashboard</h4>
                            <p className="text-xs text-blue-700 mt-1">
                                All metrics are pulled in real-time from your Firestore data. Add prospects, create proposals, 
                                share demos, and set goals to see this dashboard populate with your actual business metrics.
                            </p>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default LeaderAnalytics;
