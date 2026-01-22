import React, { useState, useEffect } from 'react';
import { 
  DollarSign, TrendingUp, TrendingDown, Calendar, 
  Target, BarChart2, PieChart, Download, Filter,
  CheckCircle, Clock, AlertCircle, ArrowUp, ArrowDown,
  RefreshCw, ChevronRight, Award, Users
} from 'lucide-react';
import { collection, query, getDocs, orderBy, where } from 'firebase/firestore';
import { db } from '../../firebase';

/**
 * Revenue Forecasting & Won Deals Tracker
 * 
 * Post-sale tracking with:
 * - Won deals history with ARR/MRR tracking
 * - Revenue by month/quarter visualization
 * - Pipeline-weighted forecast
 * - Quota tracking
 * - Win/loss analysis
 */

const STAGE_WEIGHTS = {
  new: 0.1,
  contacted: 0.2,
  qualified: 0.3,
  demo: 0.5,
  proposal: 0.7,
  negotiation: 0.9,
  won: 1.0,
  lost: 0
};

const RevenueForecasting = () => {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('quarter');
  const [wonDeals, setWonDeals] = useState([]);
  const [lostDeals, setLostDeals] = useState([]);
  const [allProspects, setAllProspects] = useState([]);
  const [metrics, setMetrics] = useState({
    totalRevenue: 0,
    mrr: 0,
    arr: 0,
    avgDealSize: 0,
    winRate: 0,
    weightedPipeline: 0,
    quotaProgress: 0
  });
  const [monthlyRevenue, setMonthlyRevenue] = useState([]);

  // Configurable quota
  const QUARTERLY_QUOTA = 100000;

  useEffect(() => {
    fetchRevenueData();
  }, [period]);

  const fetchRevenueData = async () => {
    setLoading(true);
    try {
      const prospectsSnap = await getDocs(collection(db, 'corporate_prospects'));
      const prospects = prospectsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      
      setAllProspects(prospects);
      
      const won = prospects.filter(p => p.stage === 'won');
      const lost = prospects.filter(p => p.stage === 'lost');
      const active = prospects.filter(p => p.stage && p.stage !== 'won' && p.stage !== 'lost');
      
      setWonDeals(won);
      setLostDeals(lost);

      // Calculate metrics
      const totalRevenue = won.reduce((acc, d) => acc + (d.value || 0), 0);
      const avgDealSize = won.length > 0 ? Math.round(totalRevenue / won.length) : 0;
      const closedDeals = won.length + lost.length;
      const winRate = closedDeals > 0 ? Math.round((won.length / closedDeals) * 100) : 0;
      
      // Weighted pipeline
      const weightedPipeline = active.reduce((acc, p) => {
        const weight = STAGE_WEIGHTS[p.stage] || 0;
        return acc + (p.value || 0) * weight;
      }, 0);

      // MRR/ARR (assuming deals are monthly subscriptions)
      const mrr = totalRevenue / 12; // Simplified
      const arr = totalRevenue;

      // Quota progress
      const quotaProgress = Math.min(100, Math.round((totalRevenue / QUARTERLY_QUOTA) * 100));

      setMetrics({
        totalRevenue,
        mrr: Math.round(mrr),
        arr,
        avgDealSize,
        winRate,
        weightedPipeline: Math.round(weightedPipeline),
        quotaProgress
      });

      // Build monthly revenue data
      const monthlyData = buildMonthlyRevenue(won);
      setMonthlyRevenue(monthlyData);

    } catch (err) {
      console.error("Error fetching revenue data:", err);
    } finally {
      setLoading(false);
    }
  };

  const buildMonthlyRevenue = (deals) => {
    const months = {};
    const now = new Date();
    
    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = date.toLocaleString('default', { month: 'short', year: '2-digit' });
      months[key] = 0;
    }

    // Add deal values
    deals.forEach(deal => {
      if (deal.wonAt || deal.createdAt) {
        const date = new Date(deal.wonAt || deal.createdAt);
        const key = date.toLocaleString('default', { month: 'short', year: '2-digit' });
        if (months[key] !== undefined) {
          months[key] += (deal.value || 0);
        }
      }
    });

    return Object.entries(months).map(([month, value]) => ({ month, value }));
  };

  const formatCurrency = (value) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value.toLocaleString()}`;
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
          <h1 className="text-3xl font-bold text-corporate-navy">Revenue & Forecasting</h1>
          <p className="text-slate-500 mt-1">Track closed deals, revenue, and forecast future performance</p>
        </div>
        <div className="flex gap-3">
          <select 
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-4 py-2 border border-slate-200 rounded-lg text-sm"
          >
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>
          <button className="bg-white border border-slate-200 px-4 py-2 rounded-lg text-sm flex items-center gap-2 hover:bg-slate-50">
            <Download size={16} /> Export
          </button>
        </div>
      </div>

      {/* Primary KPIs */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 text-white p-5 rounded-xl shadow-lg">
          <div className="flex justify-between items-start mb-3">
            <span className="text-green-100 text-sm font-medium">Total Revenue</span>
            <DollarSign className="w-5 h-5 text-green-200" />
          </div>
          <div className="text-3xl font-bold">{formatCurrency(metrics.totalRevenue)}</div>
          <div className="mt-2 text-xs text-green-200">
            {wonDeals.length} closed deals
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start mb-3">
            <span className="text-slate-500 text-sm font-medium">Weighted Pipeline</span>
            <Target className="w-5 h-5 text-blue-500" />
          </div>
          <div className="text-3xl font-bold text-slate-800">{formatCurrency(metrics.weightedPipeline)}</div>
          <div className="mt-2 text-xs text-slate-500">
            Probability-adjusted forecast
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start mb-3">
            <span className="text-slate-500 text-sm font-medium">Win Rate</span>
            <Award className="w-5 h-5 text-amber-500" />
          </div>
          <div className="text-3xl font-bold text-slate-800">{metrics.winRate}%</div>
          <div className="mt-2 text-xs text-slate-500">
            {wonDeals.length}W / {lostDeals.length}L
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start mb-3">
            <span className="text-slate-500 text-sm font-medium">Avg Deal Size</span>
            <BarChart2 className="w-5 h-5 text-purple-500" />
          </div>
          <div className="text-3xl font-bold text-slate-800">{formatCurrency(metrics.avgDealSize)}</div>
          <div className="mt-2 text-xs text-slate-500">
            Per closed deal
          </div>
        </div>
      </div>

      {/* Quota Progress */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-bold text-corporate-navy flex items-center gap-2">
            <Target size={18} />
            Quarterly Quota Progress
          </h2>
          <span className="text-sm text-slate-500">
            {formatCurrency(metrics.totalRevenue)} / {formatCurrency(QUARTERLY_QUOTA)}
          </span>
        </div>
        <div className="relative">
          <div className="w-full h-6 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                metrics.quotaProgress >= 100 ? 'bg-green-500' :
                metrics.quotaProgress >= 70 ? 'bg-corporate-teal' :
                metrics.quotaProgress >= 40 ? 'bg-amber-500' : 'bg-red-500'
              }`}
              style={{ width: `${Math.min(100, metrics.quotaProgress)}%` }}
            />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm font-bold text-slate-700">{metrics.quotaProgress}%</span>
          </div>
        </div>
        <div className="flex justify-between text-xs text-slate-400 mt-2">
          <span>$0</span>
          <span>{formatCurrency(QUARTERLY_QUOTA / 2)}</span>
          <span>{formatCurrency(QUARTERLY_QUOTA)}</span>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Monthly Revenue Chart */}
        <div className="col-span-8 bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="font-bold text-corporate-navy mb-6 flex items-center gap-2">
            <TrendingUp size={18} />
            Monthly Revenue
          </h2>
          <div className="flex items-end gap-4 h-48">
            {monthlyRevenue.map((month, idx) => {
              const maxValue = Math.max(...monthlyRevenue.map(m => m.value), 1);
              const height = (month.value / maxValue) * 100;
              return (
                <div key={idx} className="flex-1 flex flex-col items-center">
                  <div className="w-full flex flex-col items-center justify-end h-40">
                    <span className="text-xs font-bold text-slate-600 mb-1">
                      {month.value > 0 ? formatCurrency(month.value) : '-'}
                    </span>
                    <div 
                      className="w-full bg-gradient-to-t from-corporate-teal to-teal-400 rounded-t transition-all duration-300"
                      style={{ height: `${Math.max(4, height)}%` }}
                    />
                  </div>
                  <span className="text-xs text-slate-500 mt-2">{month.month}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Pipeline by Stage */}
        <div className="col-span-4 bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="font-bold text-corporate-navy mb-4 flex items-center gap-2">
            <PieChart size={18} />
            Pipeline by Stage
          </h2>
          <div className="space-y-3">
            {Object.entries(STAGE_WEIGHTS).filter(([stage]) => stage !== 'won' && stage !== 'lost').map(([stage, weight]) => {
              const stageProspects = allProspects.filter(p => p.stage === stage);
              const stageValue = stageProspects.reduce((acc, p) => acc + (p.value || 0), 0);
              const weighted = stageValue * weight;
              return (
                <div key={stage} className="flex items-center gap-3">
                  <div className="w-20 text-xs font-medium text-slate-600 capitalize">{stage}</div>
                  <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-corporate-teal rounded-full"
                      style={{ width: `${Math.min(100, (stageValue / (metrics.weightedPipeline || 1)) * 100 * weight)}%` }}
                    />
                  </div>
                  <div className="text-xs text-slate-500 w-16 text-right">
                    {formatCurrency(stageValue)}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100">
            <div className="text-xs text-slate-400">
              Pipeline values are weighted by stage probability
            </div>
          </div>
        </div>

        {/* Won Deals List */}
        <div className="col-span-6 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="font-bold text-corporate-navy flex items-center gap-2">
              <CheckCircle size={18} className="text-green-500" />
              Won Deals
            </h2>
            <span className="text-xs text-slate-400">{wonDeals.length} deals</span>
          </div>
          <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
            {wonDeals.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <CheckCircle className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No won deals yet</p>
              </div>
            ) : (
              wonDeals.map((deal) => (
                <div key={deal.id} className="flex items-center gap-4 p-4 hover:bg-slate-50">
                  <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                    <CheckCircle size={14} className="text-green-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-slate-800">{deal.name || deal.company}</h4>
                    <p className="text-xs text-slate-500">{deal.company}</p>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-green-600">{formatCurrency(deal.value || 0)}</div>
                    <div className="text-xs text-slate-400">
                      {deal.wonAt ? new Date(deal.wonAt).toLocaleDateString() : 'Recent'}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Lost Deals Analysis */}
        <div className="col-span-6 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="font-bold text-corporate-navy flex items-center gap-2">
              <AlertCircle size={18} className="text-red-500" />
              Lost Deals
            </h2>
            <span className="text-xs text-slate-400">{lostDeals.length} deals</span>
          </div>
          <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
            {lostDeals.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <AlertCircle className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No lost deals recorded</p>
              </div>
            ) : (
              lostDeals.map((deal) => (
                <div key={deal.id} className="flex items-center gap-4 p-4 hover:bg-slate-50">
                  <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                    <AlertCircle size={14} className="text-red-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-slate-800">{deal.name || deal.company}</h4>
                    <p className="text-xs text-slate-500">{deal.lostReason || 'No reason recorded'}</p>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-slate-400 line-through">{formatCurrency(deal.value || 0)}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RevenueForecasting;
