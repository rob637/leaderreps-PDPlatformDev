import React from 'react';
import { Users, Send } from 'lucide-react';

const Feedback360 = () => (
  <div className="p-8 max-w-6xl mx-auto">
    <header className="mb-8">
      <h1 className="text-3xl font-bold text-corporate-navy">360° Feedback Tool</h1>
      <p className="text-slate-500">Gather anonymous insights from your team.</p>
    </header>
    <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
      <h2 className="text-xl font-bold text-corporate-navy mb-4">Request Feedback</h2>
      <p className="text-slate-600 mb-6">
        Send a standardized survey to your direct reports, peers, and manager. We'll aggregate the results into a confidential report.
      </p>
      <div className="flex gap-4 mb-8">
        <input 
          type="email" 
          placeholder="Enter colleague's email" 
          className="flex-1 p-3 border border-slate-300 rounded-lg"
        />
        <button className="px-6 py-3 bg-corporate-teal text-white rounded-lg font-bold flex items-center gap-2">
          <Send className="w-4 h-4" /> Send Request
        </button>
      </div>
      <div className="border-t border-slate-100 pt-6">
        <h3 className="font-bold text-slate-700 mb-4">Active Requests</h3>
        <div className="text-sm text-slate-500 italic">No active feedback requests.</div>
      </div>
    </div>
  </div>
);
export default Feedback360;
