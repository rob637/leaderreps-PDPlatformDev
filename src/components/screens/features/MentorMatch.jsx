import React from 'react';
import { UserPlus, Search } from 'lucide-react';

const MentorMatch = () => (
  <div className="p-8 max-w-6xl mx-auto">
    <header className="mb-8">
      <h1 className="text-3xl font-bold text-corporate-navy">Mentor Match</h1>
      <p className="text-slate-500">Connect with senior executives for guidance.</p>
    </header>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 text-center">
          <div className="w-20 h-20 bg-slate-200 rounded-full mx-auto mb-4"></div>
          <h3 className="font-bold text-lg text-corporate-navy">Executive Mentor {i}</h3>
          <p className="text-sm text-slate-500 mb-4">CTO at Tech Corp • 15 Yrs Exp</p>
          <div className="flex flex-wrap gap-2 justify-center mb-4">
            <span className="px-2 py-1 bg-slate-100 text-xs rounded">Strategy</span>
            <span className="px-2 py-1 bg-slate-100 text-xs rounded">Scaling</span>
          </div>
          <button className="w-full py-2 border border-corporate-teal text-corporate-teal rounded-lg font-semibold hover:bg-teal-50">
            Request Session
          </button>
        </div>
      ))}
    </div>
  </div>
);
export default MentorMatch;
