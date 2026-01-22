import React, { useState, useEffect } from 'react';
import { 
  BarChart3, Users, FileText, Target, TrendingUp, User, 
  Calendar, ArrowRight, ShieldCheck, Mail, AlertTriangle
} from 'lucide-react';
import { collection, query, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../../../firebase';

const SalesAdmin = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPipeline: 0,
    activeDeals: 0,
    totalProspects: 0,
    repStats: {}, // { 'Rob': { prospects: 10, proposals: 2, value: 5000 } }
    feed: []
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // 1. Fetch Prospects
      const prospectsSnap = await getDocs(query(collection(db, 'corporate_prospects'), orderBy('createdAt', 'desc')));
      const prospects = prospectsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      // 2. Fetch Proposals
      const proposalsSnap = await getDocs(query(collection(db, 'corporate_proposals'), orderBy('createdAt', 'desc')));
      const proposals = proposalsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      
      // 3. Fetch Demos (Optional for leaderboard, good for feed)
      const demosSnap = await getDocs(query(collection(db, 'corporate_demo_links'), orderBy('createdAt', 'desc')));
      const demos = demosSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      // --- Aggregation Logic ---

      const repStats = {};
      const addStat = (name, type, value = 0) => {
        const key = name ? name.split(' ')[0] : 'Unassigned';
        if (!repStats[key]) repStats[key] = { name: key, prospects: 0, proposals: 0, pipeline: 0, demos: 0 };
        if (type === 'prospect') repStats[key].prospects++;
        if (type === 'proposal') {
            repStats[key].proposals++;
            repStats[key].pipeline += (value || 0);
        }
        if (type === 'demo') repStats[key].demos++;
      };

      // Process Prospects
      prospects.forEach(p => {
        addStat(p.ownerName, 'prospect');
      });

      // Process Proposals
      let pipelineTotal = 0;
      let activeDealsCount = 0;
      proposals.forEach(p => {
        addStat(p.ownerName, 'proposal', p.amount);
        if (['draft', 'sent', 'negotiation'].includes(p.status)) {
            pipelineTotal += (p.amount || 0);
            activeDealsCount++;
        }
      });

      // Process Demos
      demos.forEach(d => {
        addStat(d.ownerName, 'demo');
      });

      // Build Feed (Merge all events sorted by date)
      const feed = [
        ...prospects.map(p => ({ type: 'prospect', date: p.createdAt, user: p.ownerName, detail: `Added lead: ${p.company}` })),
        ...proposals.map(p => ({ type: 'proposal', date: p.createdAt, user: p.ownerName, detail: `Created proposal: ${p.clientName} ($${p.amount})` })),
        ...demos.map(d => ({ type: 'demo', date: d.createdAt, user: d.ownerName, detail: `Generated demo for ${d.prospect || 'Prospect'}` }))
      ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 20); // Top 20 recent events

      setStats({
        totalPipeline: pipelineTotal,
        activeDeals: activeDealsCount,
        totalProspects: prospects.length,
        repStats: repStats,
        feed: feed
      });

    } catch (e) {
      console.error("Error loading admin stats:", e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8">Loading Manager Dashboard...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto min-h-screen">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-corporate-navy flex items-center gap-3">
             <ShieldCheck className="text-corporate-teal" /> Sales Command Center
          </h1>
          <p className="text-slate-500 mt-1">Live visibility into team performance and pipeline health.</p>
        </div>
        <div className="bg-white border px-4 py-2 rounded-lg text-sm text-slate-500">
            Current Quarter: <span className="font-bold text-corporate-navy">Q1 2025</span>
        </div>
      </div>

      {/* Top Level Cards */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-slate-500 text-sm font-medium uppercase tracking-wide mb-1">Total Pipeline Value</div>
            <div className="text-3xl font-bold text-corporate-navy">
                ${stats.totalPipeline.toLocaleString()}
            </div>
            <div className="text-sm text-green-600 flex items-center gap-1 mt-2">
                <TrendingUp size={14} /> Active Deals: {stats.activeDeals}
            </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-slate-500 text-sm font-medium uppercase tracking-wide mb-1">Total Prospects</div>
            <div className="text-3xl font-bold text-corporate-navy">
                {stats.totalProspects}
            </div>
            <div className="text-sm text-blue-600 flex items-center gap-1 mt-2">
                <Users size={14} /> Database Size
            </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-slate-500 text-sm font-medium uppercase tracking-wide mb-1">Top Performer</div>
            <div className="text-3xl font-bold text-corporate-navy">
                {Object.values(stats.repStats).sort((a,b) => b.pipeline - a.pipeline)[0]?.name || '-'}
            </div>
            <div className="text-sm text-purple-600 flex items-center gap-1 mt-2">
                <Target size={14} /> By Revenue Potential
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Leaderboard */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                <h3 className="font-bold text-corporate-navy flex items-center gap-2">
                    <BarChart3 size={18} /> Team Leaderboard
                </h3>
            </div>
            <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Rep</th>
                        <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Prospects Added</th>
                        <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Demos Shared</th>
                        <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Proposals</th>
                        <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Pipeline ($)</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {Object.values(stats.repStats)
                        .sort((a,b) => b.pipeline - a.pipeline)
                        .map((rep, idx) => (
                        <tr key={rep.name} className="hover:bg-slate-50 transition">
                            <td className="py-3 px-4 font-medium text-corporate-navy flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-xs text-slate-600 font-bold">
                                    {rep.name[0]}
                                </span>
                                {rep.name}
                            </td>
                            <td className="py-3 px-4 text-right text-slate-600">{rep.prospects}</td>
                            <td className="py-3 px-4 text-right text-slate-600">{rep.demos}</td>
                            <td className="py-3 px-4 text-right text-slate-600">{rep.proposals}</td>
                            <td className="py-3 px-4 text-right font-medium text-green-700">
                                ${rep.pipeline.toLocaleString()}
                            </td>
                        </tr>
                    ))}
                    {Object.keys(stats.repStats).length === 0 && (
                        <tr>
                            <td colSpan={5} className="py-8 text-center text-slate-400">No activity data found yet.</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>

        {/* Activity Feed */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[500px]">
             <div className="p-4 border-b border-slate-200 bg-slate-50">
                <h3 className="font-bold text-corporate-navy flex items-center gap-2">
                    <Calendar size={18} /> Live Activity Feed
                </h3>
            </div>
            <div className="overflow-y-auto p-4 space-y-4 flex-1">
                {stats.feed.map((item, i) => (
                    <div key={i} className="flex gap-3 text-sm">
                        <div className={`mt-1 min-w-[32px] h-8 rounded-full flex items-center justify-center border ${
                            item.type === 'proposal' ? 'bg-green-50 border-green-200 text-green-600' :
                            item.type === 'demo' ? 'bg-purple-50 border-purple-200 text-purple-600' :
                            'bg-blue-50 border-blue-200 text-blue-600'
                        }`}>
                            {item.type === 'proposal' && <FileText size={14} />}
                            {item.type === 'demo' && <Target size={14} />}
                            {item.type === 'prospect' && <User size={14} />}
                        </div>
                        <div>
                            <p className="text-slate-800">
                                <span className="font-semibold">{item.user ? item.user.split(' ')[0] : 'Someone'}</span> {item.detail}
                            </p>
                            <p className="text-slate-400 text-xs">
                                {new Date(item.date).toLocaleDateString()} at {new Date(item.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </p>
                        </div>
                    </div>
                ))}
                 {stats.feed.length === 0 && (
                    <div className="text-center text-slate-400 mt-10">No recent activity.</div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default SalesAdmin;
