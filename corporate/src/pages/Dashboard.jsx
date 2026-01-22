import React from 'react';
import { Link } from 'react-router-dom';
import { 
    Users, 
    Target, 
    ArrowRight, 
    Activity, 
    Zap, 
    BarChart3, 
    Globe, 
    Mail, 
    Calendar,
    Award
} from 'lucide-react';

const Dashboard = () => {
  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex justify-between items-end">
        <div>
            <h1 className="text-3xl font-bold text-corporate-navy">Command Center</h1>
            <p className="text-slate-500 mt-1">Operational oversight and capability management.</p>
        </div>
        <div className="flex gap-3">
             <div className="bg-white px-4 py-2 rounded-lg border border-slate-200 flex items-center gap-2 text-sm font-medium text-slate-600">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                System Operational
             </div>
             <div className="bg-corporate-navy text-white px-4 py-2 rounded-lg text-sm font-bold">
                Q1 2026 Focus
             </div>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-blue-50 rounded-lg">
                    <Users className="w-5 h-5 text-blue-600" />
                </div>
                <span className="text-xs font-bold text-slate-400 flex items-center bg-slate-50 px-2 py-1 rounded-full">--</span>
            </div>
            <div>
                <span className="text-2xl font-bold text-slate-800">0</span>
                <p className="text-slate-500 text-sm">Active Prospects</p>
            </div>
        </div>
        
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-purple-50 rounded-lg">
                    <Activity className="w-5 h-5 text-purple-600" />
                </div>
                <span className="text-xs font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-full">--</span>
            </div>
            <div>
                <span className="text-2xl font-bold text-slate-800">100%</span>
                <p className="text-slate-500 text-sm">Email Deliverability</p>
            </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-amber-50 rounded-lg">
                    <Zap className="w-5 h-5 text-amber-600" />
                </div>
                <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-full">Active</span>
            </div>
            <div>
                <span className="text-2xl font-bold text-slate-800">0</span>
                <p className="text-slate-500 text-sm">Live Cohorts</p>
            </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-rose-50 rounded-lg">
                    <BarChart3 className="w-5 h-5 text-rose-600" />
                </div>
                <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded-full">$0/mo</span>
            </div>
            <div>
                <span className="text-2xl font-bold text-slate-800">Tools</span>
                <p className="text-slate-500 text-sm">Cost Saved</p>
            </div>
        </div>
      </div>

      {/* Main Capability Grid */}
      <h2 className="text-lg font-bold text-corporate-navy mb-4">Operational Capabilities</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        {/* Sales Enablement */}
        <div className="group bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden">
            <div className="h-1 bg-blue-500"></div>
            <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-blue-100 rounded-lg">
                        <Globe className="w-6 h-6 text-blue-600" />
                    </div>
                    <h3 className="font-bold text-slate-800">Sales Enablement</h3>
                </div>
                <p className="text-sm text-slate-500 mb-6 min-h-[40px]">
                    Pipeline management, prospect intelligence, and automated outreach systems.
                </p>
                <div className="space-y-2">
                    <Link to="/sales/prospects" className="flex items-center justify-between p-2 rounded hover:bg-slate-50 group/link">
                        <span className="text-sm font-medium text-slate-700">Prospect Finder</span>
                        <ArrowRight className="w-4 h-4 text-slate-300 group-hover/link:text-blue-500" />
                    </Link>
                    <Link to="/sales/outreach" className="flex items-center justify-between p-2 rounded hover:bg-slate-50 group/link">
                        <span className="text-sm font-medium text-slate-700">Campaign Manager</span>
                        <ArrowRight className="w-4 h-4 text-slate-300 group-hover/link:text-blue-500" />
                    </Link>
                </div>
            </div>
        </div>

        {/* Marketing & Brand */}
        <div className="group bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden">
            <div className="h-1 bg-purple-500"></div>
            <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-purple-100 rounded-lg">
                        <Mail className="w-6 h-6 text-purple-600" />
                    </div>
                    <h3 className="font-bold text-slate-800">Marketing & Brand</h3>
                </div>
                <p className="text-sm text-slate-500 mb-6 min-h-[40px]">
                    Reputation management, content amplification, and brand consistency.
                </p>
                <div className="space-y-2">
                    <Link to="/marketing/email-health" className="flex items-center justify-between p-2 rounded hover:bg-slate-50 group/link">
                        <span className="text-sm font-medium text-slate-700">Email Health Control</span>
                        <ArrowRight className="w-4 h-4 text-slate-300 group-hover/link:text-purple-500" />
                    </Link>
                    <Link to="/marketing/amplify" className="flex items-center justify-between p-2 rounded hover:bg-slate-50 group/link">
                        <span className="text-sm font-medium text-slate-700">Content Amplifier</span>
                        <ArrowRight className="w-4 h-4 text-slate-300 group-hover/link:text-purple-500" />
                    </Link>
                </div>
            </div>
        </div>

        {/* Operations */}
        <div className="group bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden">
            <div className="h-1 bg-emerald-500"></div>
            <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-emerald-100 rounded-lg">
                        <Calendar className="w-6 h-6 text-emerald-600" />
                    </div>
                    <h3 className="font-bold text-slate-800">Operations</h3>
                </div>
                <p className="text-sm text-slate-500 mb-6 min-h-[40px]">
                    Scheduling, resource allocation, and logistical management tools.
                </p>
                <div className="space-y-2">
                    <Link to="/ops/scheduler" className="flex items-center justify-between p-2 rounded hover:bg-slate-50 group/link">
                        <span className="text-sm font-medium text-slate-700">Unified Scheduler</span>
                        <ArrowRight className="w-4 h-4 text-slate-300 group-hover/link:text-emerald-500" />
                    </Link>
                </div>
            </div>
        </div>

        {/* Intelligence */}
        <div className="group bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden">
            <div className="h-1 bg-amber-500"></div>
            <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-amber-100 rounded-lg">
                        <Award className="w-6 h-6 text-amber-600" />
                    </div>
                    <h3 className="font-bold text-slate-800">Intelligence</h3>
                </div>
                <p className="text-sm text-slate-500 mb-6 min-h-[40px]">
                    Data-driven insights on leader performance and cohort health.
                </p>
                <div className="space-y-2">
                    <Link to="/analytics/leaders" className="flex items-center justify-between p-2 rounded hover:bg-slate-50 group/link">
                        <span className="text-sm font-medium text-slate-700">Leader Analytics</span>
                        <ArrowRight className="w-4 h-4 text-slate-300 group-hover/link:text-amber-500" />
                    </Link>
                    <div className="flex items-center justify-between p-2 rounded opacity-50 cursor-not-allowed">
                        <span className="text-sm font-medium text-slate-700">Cohort Prediction (Soon)</span>
                    </div>
                </div>
            </div>
        </div>

      </div>

      <div className="mt-8 bg-slate-50 rounded-xl border border-slate-200 p-6 flex items-center justify-between">
            <div>
                <h3 className="font-bold text-slate-700">System Development Status</h3>
                <p className="text-sm text-slate-500">Current sprint focus: Email Deliverability & Prospecting</p>
            </div>
            <div className="flex items-center gap-4">
                <div className="text-right">
                    <span className="block text-xs font-bold text-slate-400 uppercase">System Version</span>
                    <span className="font-mono text-corporate-navy">v1.1.0-alpha</span>
                </div>
            </div>
      </div>
    </div>
  );
};

export default Dashboard;
