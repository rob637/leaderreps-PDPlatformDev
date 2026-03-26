// src/components/admin/AssessmentLeadsManager.jsx
// View and manage leads from Leadership DNA Assessment, Accountability Assessment, and ROI Calculator

import React, { useState, useEffect } from 'react';
import {
  Users, Download, Mail, Search, RefreshCw, ExternalLink,
  TrendingUp, Calendar, Target, Award, ChevronDown, ChevronUp,
  Copy, Check, Filter, Dna, ShieldCheck, Calculator, DollarSign, Building2
} from 'lucide-react';
import { collection, query, orderBy, getDocs, limit, startAfter } from 'firebase/firestore';
import { useAppServices } from '../../services/useAppServices';

// Leadership DNA Assessment Archetypes
const LEADERSHIP_ARCHETYPE_COLORS = {
  'visionary-innovator': '#8B5CF6',
  'empathetic-communicator': '#10B981',
  'strategic-executor': '#EF4444',
  'adaptive-navigator': '#06B6D4',
  'people-champion': '#10B981',
  'balanced-leader': '#F59E0B',
};

const LEADERSHIP_ARCHETYPE_NAMES = {
  'visionary-innovator': 'Visionary Innovator',
  'empathetic-communicator': 'Empathetic Communicator',
  'strategic-executor': 'Strategic Executor',
  'adaptive-navigator': 'Adaptive Navigator',
  'people-champion': 'People Champion',
  'balanced-leader': 'Balanced Leader',
};

// Accountability Assessment Archetypes
const ACCOUNTABILITY_ARCHETYPE_COLORS = {
  'ownership-champion': '#E04E1B',      // Orange (brand)
  'reliable-executor': '#10B981',       // Green
  'transparent-communicator': '#06B6D4', // Cyan
  'standards-setter': '#8B5CF6',        // Purple
  'accountability-coach': '#F59E0B',    // Amber
  'balanced-accountable': '#002E47',    // Navy (brand)
};

const ACCOUNTABILITY_ARCHETYPE_NAMES = {
  'ownership-champion': 'Ownership Champion',
  'reliable-executor': 'Reliable Executor',
  'transparent-communicator': 'Transparent Communicator',
  'standards-setter': 'Standards Setter',
  'accountability-coach': 'Accountability Coach',
  'balanced-accountable': 'Balanced Accountable Leader',
};

// ROI Calculator Industries
const ROI_INDUSTRY_COLORS = {
  'technology': '#8B5CF6',
  'healthcare': '#EF4444',
  'financial-services': '#10B981',
  'manufacturing': '#F59E0B',
  'retail': '#06B6D4',
  'professional-services': '#6366F1',
  'education': '#EC4899',
  'government': '#002E47',
  'hospitality': '#E04E1B',
  'other': '#6B7280',
};

const ROI_INDUSTRY_NAMES = {
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

const ASSESSMENT_CONFIG = {
  leadership: {
    collection: 'assessment-leads',
    title: 'Leadership DNA Assessment',
    subtitle: 'Leads from the Leadership DNA Assessment',
    icon: Dna,
    accentColor: 'purple',
    archetypeColors: LEADERSHIP_ARCHETYPE_COLORS,
    archetypeNames: LEADERSHIP_ARCHETYPE_NAMES,
    assessmentUrl: 'https://leaderreps-assessment.web.app',
    scoresLabel: 'Leadership Scores',
    filterLabel: 'Archetypes',
    isROI: false,
    marketingTips: [
      'Welcome sequence with leadership tips based on their archetype',
      'Invite to free leadership webinar or workshop',
      'Offer a free coaching discovery call',
      'Segment by archetype for personalized nurture campaigns',
    ],
  },
  accountability: {
    collection: 'accountability-leads',
    title: 'Accountability Assessment',
    subtitle: 'Leads from the Accountability Assessment',
    icon: ShieldCheck,
    accentColor: 'orange',
    archetypeColors: ACCOUNTABILITY_ARCHETYPE_COLORS,
    archetypeNames: ACCOUNTABILITY_ARCHETYPE_NAMES,
    assessmentUrl: 'https://leaderreps-accountability.web.app',
    scoresLabel: 'Accountability Scores',
    filterLabel: 'Archetypes',
    isROI: false,
    marketingTips: [
      'Welcome sequence with accountability tips based on their archetype',
      'Share accountability frameworks and tools',
      'Invite to accountability coaching sessions',
      'Offer a free Accountability Acceleration workshop',
      'Segment by archetype for targeted follow-up',
    ],
  },
  roi: {
    collection: 'roi-calculator-leads',
    title: 'ROI Calculator',
    subtitle: 'Leads from the Leadership Development ROI Calculator',
    icon: Calculator,
    accentColor: 'emerald',
    archetypeColors: ROI_INDUSTRY_COLORS,
    archetypeNames: ROI_INDUSTRY_NAMES,
    assessmentUrl: 'https://leaderreps-roi.web.app',
    scoresLabel: 'ROI Results',
    filterLabel: 'Industries',
    isROI: true,
    marketingTips: [
      'Follow up with personalized ROI summary email',
      'Share case studies from their industry',
      'Offer a free consultation to discuss their specific situation',
      'Invite to a leadership development ROI webinar',
      'Segment by company size for targeted enterprise outreach',
    ],
  },
};

const AssessmentLeadsManager = () => {
  const { db } = useAppServices();
  const [activeTab, setActiveTab] = useState('leadership');
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [expandedLead, setExpandedLead] = useState(null);
  const [copiedEmail, setCopiedEmail] = useState(null);
  const [stats, setStats] = useState({ total: 0, today: 0, thisWeek: 0, avgROI: 0, totalSavings: 0 });
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);

  const config = ASSESSMENT_CONFIG[activeTab];

  const fetchLeads = async (isLoadMore = false) => {
    if (!db) return;
    setLoading(true);
    
    try {
      const leadsRef = collection(db, config.collection);
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
        
        // ROI-specific stats
        let avgROI = 0;
        let totalSavings = 0;
        if (config.isROI && newLeads.length > 0) {
          avgROI = Math.round(newLeads.reduce((sum, l) => sum + (l.results?.roiPercentage || 0), 0) / newLeads.length);
          totalSavings = newLeads.reduce((sum, l) => sum + (l.results?.totalAnnualSavings || 0), 0);
        }
        
        setStats({ total: newLeads.length, today, thisWeek, avgROI, totalSavings });
      }
      
      setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
      setHasMore(snapshot.docs.length === 50);
    } catch (err) {
      console.error('Error fetching leads:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch leads when tab changes or db becomes available
  useEffect(() => {
    setLeads([]);
    setLastDoc(null);
    setHasMore(true);
    setFilterCategory('all');
    setSearchTerm('');
    setExpandedLead(null);
    fetchLeads();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db, activeTab]);

  // Get category value based on tab type (archetype for assessments, industry for ROI)
  const getLeadCategory = (lead) => {
    if (config.isROI) {
      return lead.inputs?.industry;
    }
    return lead.results?.archetype;
  };

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = !searchTerm || 
      lead.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (config.isROI && lead.company?.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = filterCategory === 'all' || 
      getLeadCategory(lead) === filterCategory;
    
    return matchesSearch && matchesCategory;
  });

  const copyEmail = async (email) => {
    await navigator.clipboard.writeText(email);
    setCopiedEmail(email);
    setTimeout(() => setCopiedEmail(null), 2000);
  };

  const exportToCsv = () => {
    let headers, rows;
    
    if (config.isROI) {
      headers = ['Email', 'First Name', 'Last Name', 'Company', 'Title', 'Industry', 
                 'Leaders', 'Annual Savings', 'ROI %', 'Date', 'Email Sent'];
      rows = filteredLeads.map(lead => [
        lead.email,
        lead.firstName || '',
        lead.lastName || '',
        lead.company || '',
        lead.title || '',
        config.archetypeNames[lead.inputs?.industry] || lead.inputs?.industry || '',
        lead.inputs?.numLeaders || '',
        lead.results?.totalAnnualSavings || '',
        lead.results?.roiPercentage || '',
        lead.createdAt?.toLocaleDateString?.() || '',
        lead.emailSent ? 'Yes' : 'No',
      ]);
    } else {
      headers = ['Email', 'First Name', 'Archetype', 'Date', 'Email Sent'];
      rows = filteredLeads.map(lead => [
        lead.email,
        lead.firstName || '',
        config.archetypeNames[lead.results?.archetype] || 'Unknown',
        lead.createdAt?.toLocaleDateString?.() || '',
        lead.emailSent ? 'Yes' : 'No',
      ]);
    }
    
    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeTab}-leads-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyAllEmails = async () => {
    const emails = filteredLeads.map(l => l.email).join(', ');
    await navigator.clipboard.writeText(emails);
    setCopiedEmail('all');
    setTimeout(() => setCopiedEmail(null), 2000);
  };

  const IconComponent = config.icon;
  const accentClasses = {
    purple: {
      icon: 'text-purple-600',
      badge: 'bg-purple-100 text-purple-800',
      button: 'bg-purple-600 hover:bg-purple-700',
      gradient: 'from-purple-600 to-indigo-600',
      bar: 'bg-purple-500',
      tabActive: 'border-purple-600 text-purple-600',
    },
    orange: {
      icon: 'text-orange-600',
      badge: 'bg-orange-100 text-orange-800',
      button: 'bg-orange-600 hover:bg-orange-700',
      gradient: 'from-orange-600 to-red-600',
      bar: 'bg-orange-500',
      tabActive: 'border-orange-600 text-orange-600',
    },
    emerald: {
      icon: 'text-emerald-600',
      badge: 'bg-emerald-100 text-emerald-800',
      button: 'bg-emerald-600 hover:bg-emerald-700',
      gradient: 'from-emerald-600 to-teal-600',
      bar: 'bg-emerald-500',
      tabActive: 'border-emerald-600 text-emerald-600',
    },
  };
  const accent = accentClasses[config.accentColor];

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-700">
        <div className="flex gap-4 overflow-x-auto">
          <button
            onClick={() => setActiveTab('leadership')}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
              activeTab === 'leadership'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Dna className="w-4 h-4" />
            Leadership DNA
          </button>
          <button
            onClick={() => setActiveTab('accountability')}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
              activeTab === 'accountability'
                ? 'border-orange-600 text-orange-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            Accountability
          </button>
          <button
            onClick={() => setActiveTab('roi')}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
              activeTab === 'roi'
                ? 'border-emerald-600 text-emerald-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Calculator className="w-4 h-4" />
            ROI Calculator
          </button>
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <IconComponent className={`w-6 h-6 ${accent.icon}`} />
              {config.title}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {config.subtitle}
            </p>
          </div>
          {/* Assessment Link - Prominent placement */}
          <a
            href={config.assessmentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`hidden sm:inline-flex items-center gap-2 px-4 py-2 ${accent.button} text-white rounded-lg text-sm font-medium transition-colors`}
          >
            <ExternalLink className="w-4 h-4" />
            View Assessment
          </a>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Mobile assessment link */}
          <a
            href={config.assessmentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`sm:hidden p-2 rounded-lg ${accent.button} text-white transition-colors`}
            title={`View ${config.title}`}
          >
            <ExternalLink className="w-4 h-4" />
          </a>
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
            className={`flex items-center gap-2 px-3 py-2 rounded-lg ${accent.button} text-white transition-colors text-sm`}
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className={`grid ${config.isROI ? 'grid-cols-2 md:grid-cols-5' : 'grid-cols-3'} gap-4`}>
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
          <div className={`text-2xl font-bold ${accent.icon}`}>{stats.thisWeek}</div>
        </div>
        {config.isROI && (
          <>
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
          </>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder={config.isROI ? "Search by email, name, or company..." : "Search by email or name..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="pl-10 pr-8 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none"
          >
            <option value="all">All {config.filterLabel}</option>
            {Object.entries(config.archetypeNames).map(([key, name]) => (
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
            <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
            No leads found
          </div>
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-slate-700">
            {filteredLeads.map((lead) => {
              const category = getLeadCategory(lead);
              return (
              <div key={lead.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                {/* Lead Row */}
                <div
                  className="p-4 flex items-center gap-4 cursor-pointer"
                  onClick={() => setExpandedLead(expandedLead === lead.id ? null : lead.id)}
                >
                  {/* Avatar */}
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                    style={{ backgroundColor: config.archetypeColors[category] || '#6B7280' }}
                  >
                    {lead.firstName?.[0]?.toUpperCase() || lead.email?.[0]?.toUpperCase() || '?'}
                  </div>
                  
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-slate-800 dark:text-white truncate">
                        {config.isROI 
                          ? `${lead.firstName || ''} ${lead.lastName || ''}`.trim() || 'Unknown'
                          : lead.firstName || 'Unknown'}
                      </span>
                      <span 
                        className="px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{ 
                          backgroundColor: `${config.archetypeColors[category] || '#6B7280'}20`,
                          color: config.archetypeColors[category] || '#6B7280'
                        }}
                      >
                        {config.archetypeNames[category] || 'Unknown'}
                      </span>
                      {config.isROI && lead.company && (
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Building2 className="w-3 h-3" />
                          {lead.company}
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-slate-500 dark:text-slate-400 truncate">
                      {lead.email}
                    </div>
                  </div>
                  
                  {/* Date & Actions */}
                  <div className="flex items-center gap-3 text-sm text-slate-500">
                    {config.isROI && lead.results?.roiPercentage && (
                      <span className="hidden md:inline px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 font-medium text-xs">
                        {lead.results.roiPercentage}% ROI
                      </span>
                    )}
                    <span className="hidden sm:inline">
                      {lead.createdAt?.toLocaleDateString?.() || 'Unknown'}
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); copyEmail(lead.email); }}
                      className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                      title="Copy email"
                    >
                      {copiedEmail === lead.email ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                    {expandedLead === lead.id ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                </div>
                
                {/* Expanded Details */}
                {expandedLead === lead.id && (
                  <div className="px-4 pb-4 pt-0 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      {/* Scores or ROI Results */}
                      <div>
                        <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                          {config.scoresLabel}
                        </h4>
                        {config.isROI ? (
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-500">Total Annual Savings:</span>
                              <span className="font-medium text-emerald-600">{formatCurrency(lead.results?.totalAnnualSavings)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-500">ROI Percentage:</span>
                              <span className="font-medium text-cyan-600">{lead.results?.roiPercentage}%</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-500">Payback Period:</span>
                              <span className="font-medium">{lead.results?.paybackMonths} months</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-500">Investment:</span>
                              <span className="font-medium">{formatCurrency(lead.results?.totalInvestment)}</span>
                            </div>
                          </div>
                        ) : (
                        <div className="space-y-2">
                          {lead.results?.scores && Object.entries(lead.results.scores).map(([dim, score]) => (
                            <div key={dim} className="flex items-center gap-2">
                              <span className="text-xs text-slate-500 w-24 capitalize">{dim}</span>
                              <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full ${accent.bar} rounded-full`}
                                  style={{ width: `${score}%` }}
                                />
                              </div>
                              <span className="text-xs text-slate-500 w-8">{score}%</span>
                            </div>
                          ))}
                        </div>
                        )}
                      </div>
                      
                      {/* Details */}
                      <div>
                        <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                          Details
                        </h4>
                        <div className="space-y-1 text-sm">
                          {config.isROI ? (
                            <>
                              <div className="flex justify-between">
                                <span className="text-slate-500">Company:</span>
                                <span className="text-slate-700 dark:text-slate-300">
                                  {lead.company || 'N/A'}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-500">Title:</span>
                                <span className="text-slate-700 dark:text-slate-300">
                                  {lead.title || 'N/A'}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-500">Leaders:</span>
                                <span className="text-slate-700 dark:text-slate-300">
                                  {lead.inputs?.numLeaders || 'N/A'}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-500">Team Size:</span>
                                <span className="text-slate-700 dark:text-slate-300">
                                  {lead.inputs?.teamSize || 'N/A'}
                                </span>
                              </div>
                            </>
                          ) : (
                            <>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Top Dimensions:</span>
                            <span className="text-slate-700 dark:text-slate-300">
                              {lead.results?.topDimensions?.join(', ') || 'N/A'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Source:</span>
                            <span className="text-slate-700 dark:text-slate-300">
                              {lead.source || 'N/A'}
                            </span>
                          </div>
                            </>
                          )}
                          <div className="flex justify-between">
                            <span className="text-slate-500">Email Sent:</span>
                            <span className={lead.emailSent ? 'text-green-600' : 'text-red-500'}>
                              {lead.emailSent ? 'Yes' : 'No'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Created:</span>
                            <span className="text-slate-700 dark:text-slate-300">
                              {lead.createdAt?.toLocaleString?.() || 'Unknown'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* AI Insights Preview */}
                    {lead.aiInsights && (
                      <div className="mt-4">
                        <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                          AI Insights (Preview)
                        </h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-3">
                          {lead.aiInsights}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );})}
          </div>
        )}
        
        {/* Load More */}
        {hasMore && filteredLeads.length > 0 && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-700 text-center">
            <button
              onClick={() => fetchLeads(true)}
              disabled={loading}
              className={`px-4 py-2 text-sm font-medium ${accent.icon} hover:opacity-80 transition-colors`}
            >
              {loading ? 'Loading...' : 'Load More'}
            </button>
          </div>
        )}
      </div>
      
      {/* Quick Actions */}
      <div className={`bg-gradient-to-r ${accent.gradient} rounded-xl p-6 text-white`}>
        <h3 className="font-bold text-lg mb-2">📧 Email Marketing Ideas</h3>
        <p className="text-white/80 text-sm mb-4">
          These leads have completed the {config.title} and opted in. Consider:
        </p>
        <ul className="text-sm text-white/80 space-y-1 ml-4 list-disc">
          {config.marketingTips.map((tip, index) => (
            <li key={index}>{tip}</li>
          ))}
        </ul>
        <a
          href={config.assessmentUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          View {config.title}
        </a>
      </div>
    </div>
  );
};

export default AssessmentLeadsManager;
