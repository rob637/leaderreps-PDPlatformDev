import React from 'react';
import { BarChart3, Download } from 'lucide-react';

const ROIReport = () => (
  <div className="p-8 max-w-6xl mx-auto">
    <header className="mb-8">
      <h1 className="text-3xl font-bold text-corporate-navy">Executive ROI Report</h1>
      <p className="text-slate-500">Track your leadership growth and impact.</p>
    </header>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h3 className="text-sm font-bold text-slate-400 uppercase mb-4">Engagement Score</h3>
        <div className="text-4xl font-bold text-corporate-navy mb-2">92%</div>
        <p className="text-green-600 text-sm font-semibold">↑ 5% vs last month</p>
      </div>
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h3 className="text-sm font-bold text-slate-400 uppercase mb-4">Competency Growth</h3>
        <div className="text-4xl font-bold text-corporate-navy mb-2">+12</div>
        <p className="text-green-600 text-sm font-semibold">Skills mastered</p>
      </div>
    </div>
    <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between">
      <div>
        <h3 className="font-bold text-lg text-corporate-navy">Monthly Progress Report (November)</h3>
        <p className="text-slate-500">Generated on Nov 20, 2025</p>
      </div>
      <button className="px-4 py-2 border border-slate-300 rounded-lg font-semibold hover:bg-slate-50 flex items-center gap-2">
        <Download className="w-4 h-4" /> Download PDF
      </button>
    </div>
  </div>
);
export default ROIReport;
