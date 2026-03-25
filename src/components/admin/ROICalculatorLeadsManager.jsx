// src/components/admin/ROICalculatorLeadsManager.jsx
// View and manage leads from the ROI Calculator

import React, { useState, useEffect } from 'react';
import {
  Users, Download, Mail, Search, RefreshCw, ExternalLink,
  TrendingUp, Calendar, Calculator, DollarSign, ChevronDown, ChevronUp,
  Copy, Check, Filter, Building2, Briefcase
} from 'lucide-react';
import { collection, query, orderBy, getDocs, limit, startAfter } from 'firebase/firestore';
import { useAppServices } from '../../services/useAppServices';

const INDUSTRY_LABELS = {
  'technology': 'Technology',
  'healthcare': 'Healthcare',
  'financial-services': 'Financial Services',
  'manufacturing': 'Manufacturing',
  'retail': 'Retail',
  'professional-services': 'Professional Services',
  'education': 'Education',
  'government': 'Government',
  'hospitality': 'Hospitality',
  'other': 'Other',
};

const formatCurrency = (num) => 
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(num || 0);

const ROICalculatorLeadsManager = () => {
  const { db } = useAppServices();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterIndustry, setFilterIndustry] = useState('all');
  const [expandedLead, setExpandedLead] = useState(null);
  const [copiedEmail, setCopiedEmail] = useState(null);
  const [stats, setStats] = useState({ total: 0, today: 0, thisWeek: 0, avgROI: 0, totalSavings: 0 });
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);

  const fetchLeads = async (isLoadMore = false) => {
    if (!db) return;
    setLoading(true);
    
    try {
      const leadsRef = collection(db, 'roi-calculator-leads');
      let q = query(leadsRef, orderBy('createdAt', 'desc'), limit(50));
      
      if (isLoadMore && lastDoc) {
        q = query(leadsRef, orderBy('createdAt', 'desc'), startAfter(lastDoc), limit(50));
      }
      
      const snapshot = await getDocs(q);
      const newLeads = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
      }));
      
      if (isLoadMore) {
        setLeads(prev => [...prev, ...newLeads]);
      } else {
        setLeads(newLeads);
        
        // Calculate stats
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - 7);
        
        const today = newLeads.filter(l => l.createdAt >= startOfDay).length;
        const thisWeek = newLeads.filter(l => l.createdAt >= startOfWeek).length;
        
        const avgROI = newLeads.length > 0 
          ? Math.round(newLeads.reduce((sum, l) => sum + (l.results?.roiPercentage || 0), 0) / newLeads.length)
          : 0;
        
        const totalSavings = newLeads.reduce((sum, l) => sum + (l.results?.totalAnnualSavings || 0), 0);
        
        setStats({ total: newLeads.length, today, thisWeek, avgROI, totalSavings });
      }
      
      setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
      setHasMore(snapshot.docs.length === 50);
    } catch (err) {
      console.error('Error fetching ROI leads:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db]);

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = !searchTerm || 
      lead.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.company?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesIndustry = filterIndustry === 'all' || 
      lead.inputs?.industry === filterIndustry;
    
    return matchesSearch && matchesIndustry;
  });

  const copyEmail = async (email) => {
    await navigator.clipboard.writeText(email);
    setCopiedEmail(email);
    setTimeout(() => setCopiedEmail(null), 2000);
  };

  const exportToCsv = () => {
    const headers = [
      'Email', 'First Name', 'Last Name', 'Company', 'Title', 'Industry',
      'Leaders', 'Team Size', 'Avg Salary', 'Turnover Rate', 'Investment',
      'Annual Savings', 'ROI %', 'Payback (months)', 'Date', 'Email Sent'
    ];
    const rows = filteredLeads.map(lead => [
      lead.email,
      lead.firstName || '',
      lead.lastName || '',
      lead.company || '',
      lead.title || '',
      INDUSTRY_LABELS[lead.inputs?.industry] || lead.inputs?.industry || '',
      lead.inputs?.numLeaders || '',
      lead.inputs?.teamSize || '',
      lead.inputs?.avgSalary || '',
      lead.inputs?.turnoverRate || '',
      lead.inputs?.investmentPerLeader || '',
      lead.results?.totalAnnualSavings || '',
      lead.results?.roiPercentage || '',
      lead.results?.paybackMonths || '',
      lead.createdAt?.toLocaleDateString?.() || '',
      lead.emailSent ? 'Yes' : 'No',
    ]);
    
    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `roi-calculator-leads-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyAllEmails = async () => {
    const emails = filteredLeads.map(l => l.email).join(', ');
    await navigator.clipboard.writeText(emails);
    setCopiedEmail('all');
    setTimeout(() => setCopiedEmail(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Calculator className="w-6 h-6 text-emerald-600" />
            ROI Calculator Leads
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Leads from the Leadership Development ROI Calculator
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchLeads()}
            disabled={loading}
            className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 text-slate-600 dark:text-slate-300 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={copyAllEmails}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-sm"
          >
            {copiedEmail === 'all' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            Copy All Emails
          </button>
          <button
            onClick={exportToCsv}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors text-sm"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm mb-1">
            <Users className="w-4 h-4" />
            Total Leads
          </div>
          <div className="text-2xl font-bold text-slate-800 dark:text-white">{stats.total}</div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm mb-1">
            <Calendar className="w-4 h-4" />
            Today
          </div>
          <div className="text-2xl font-bold text-green-600">{stats.today}</div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm mb-1">
            <TrendingUp className="w-4 h-4" />
            This Week
          </div>
          <div className="text-2xl font-bold text-emerald-600">{stats.thisWeek}</div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm mb-1">
            <TrendingUp className="w-4 h-4" />
            Avg ROI
          </div>
          <div className="text-2xl font-bold text-cyan-600">{stats.avgROI}%</div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm mb-1">
            <DollarSign className="w-4 h-4" />
            Total Savings
          </div>
          <div className="text-xl font-bold text-emerald-600">{formatCurrency(stats.totalSavings)}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by email, name, or company..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <select
            value={filterIndustry}
            onChange={(e) => setFilterIndustry(e.target.value)}
            className="pl-10 pr-8 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent appearance-none"
          >
            <option value="all">All Industries</option>
            {Object.entries(INDUSTRY_LABELS).map(([key, name]) => (
              <option key={key} value={key}>{name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Leads List */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        {loading && leads.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
            Loading leads...
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <Calculator className="w-8 h-8 mx-auto mb-2 opacity-50" />
            No leads yet
          </div>
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-slate-700">
            {filteredLeads.map((lead) => (
              <div key={lead.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                <div 
                  className="flex items-start justify-between cursor-pointer"
                  onClick={() => setExpandedLead(expandedLead === lead.id ? null : lead.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-slate-800 dark:text-white truncate">
                        {lead.email}
                      </span>
                      <button
                        onClick={(e) => { e.stopPropagation(); copyEmail(lead.email); }}
                        className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-600"
                      >
                        {copiedEmail === lead.email ? (
                          <Check className="w-3 h-3 text-green-500" />
                        ) : (
                          <Copy className="w-3 h-3 text-slate-400" />
                        )}
                      </button>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                      {lead.firstName && (
                        <span>{lead.firstName} {lead.lastName || ''}</span>
                      )}
                      {lead.company && (
                        <span className="flex items-center gap-1">
                          <Building2 className="w-3 h-3" />
                          {lead.company}
                        </span>
                      )}
                      {lead.title && (
                        <span className="flex items-center gap-1">
                          <Briefcase className="w-3 h-3" />
                          {lead.title}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 ml-4">
                    <div className="text-right">
                      <div className="text-lg font-bold text-emerald-600">
                        {formatCurrency(lead.results?.totalAnnualSavings)}
                      </div>
                      <div className="text-xs text-slate-500">
                        {lead.results?.roiPercentage}% ROI
                      </div>
                    </div>
                    <div className="text-xs text-slate-400">
                      {lead.createdAt?.toLocaleDateString?.()}
                    </div>
                    {expandedLead === lead.id ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </div>
                
                {expandedLead === lead.id && (
                  <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-600">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-3">
                        <div className="text-xs text-slate-500 mb-1">Industry</div>
                        <div className="font-medium text-slate-800 dark:text-white">
                          {INDUSTRY_LABELS[lead.inputs?.industry] || lead.inputs?.industry}
                        </div>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-3">
                        <div className="text-xs text-slate-500 mb-1">Leaders</div>
                        <div className="font-medium text-slate-800 dark:text-white">
                          {lead.inputs?.numLeaders}
                        </div>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-3">
                        <div className="text-xs text-slate-500 mb-1">Team Size</div>
                        <div className="font-medium text-slate-800 dark:text-white">
                          {lead.inputs?.teamSize} per leader
                        </div>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-3">
                        <div className="text-xs text-slate-500 mb-1">Avg Salary</div>
                        <div className="font-medium text-slate-800 dark:text-white">
                          {formatCurrency(lead.inputs?.avgSalary)}
                        </div>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-3">
                        <div className="text-xs text-slate-500 mb-1">Turnover Rate</div>
                        <div className="font-medium text-slate-800 dark:text-white">
                          {lead.inputs?.turnoverRate}%
                        </div>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-3">
                        <div className="text-xs text-slate-500 mb-1">Investment/Leader</div>
                        <div className="font-medium text-slate-800 dark:text-white">
                          {formatCurrency(lead.inputs?.investmentPerLeader)}
                        </div>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-3">
                        <div className="text-xs text-slate-500 mb-1">Payback Period</div>
                        <div className="font-medium text-slate-800 dark:text-white">
                          {lead.results?.paybackMonths} months
                        </div>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-3">
                        <div className="text-xs text-slate-500 mb-1">Email Sent</div>
                        <div className="font-medium text-slate-800 dark:text-white">
                          {lead.emailSent ? '✅ Yes' : '❌ No'}
                        </div>
                      </div>
                    </div>
                    
                    {/* Savings Breakdown */}
                    <div className="bg-corporate-navy dark:bg-slate-900 rounded-lg p-4 text-white">
                      <div className="text-sm font-medium mb-3 text-white/80">Savings Breakdown</div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div>
                          <div className="text-xs text-white/50">Turnover</div>
                          <div className="text-emerald-400 font-medium">
                            {formatCurrency(lead.results?.turnoverSavings)}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-white/50">Productivity</div>
                          <div className="text-cyan-400 font-medium">
                            {formatCurrency(lead.results?.productivityGains)}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-white/50">Absenteeism</div>
                          <div className="text-yellow-400 font-medium">
                            {formatCurrency(lead.results?.absenteeismSavings)}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-white/50">Engagement</div>
                          <div className="text-orange-400 font-medium">
                            {formatCurrency(lead.results?.engagementValue)}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* AI Insights */}
                    {lead.aiInsights && (
                      <div className="mt-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-4 border border-emerald-200 dark:border-emerald-800">
                        <div className="text-sm font-medium text-emerald-800 dark:text-emerald-300 mb-2">
                          💡 AI Executive Summary
                        </div>
                        <p className="text-sm text-emerald-700 dark:text-emerald-400 whitespace-pre-wrap">
                          {lead.aiInsights}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        
        {/* Load More */}
        {hasMore && filteredLeads.length > 0 && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-700">
            <button
              onClick={() => fetchLeads(true)}
              disabled={loading}
              className="w-full py-2 text-sm text-emerald-600 hover:text-emerald-700 font-medium"
            >
              {loading ? 'Loading...' : 'Load more leads'}
            </button>
          </div>
        )}
      </div>
      
      {/* Calculator Link */}
      <div className="flex justify-center">
        <a
          href="https://leaderreps-roi.web.app"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-emerald-600 transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          Open ROI Calculator
        </a>
      </div>
    </div>
  );
};

export default ROICalculatorLeadsManager;
