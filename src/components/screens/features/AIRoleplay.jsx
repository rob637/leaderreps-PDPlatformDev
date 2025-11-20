import React from 'react';
import { Mic, MessageSquare } from 'lucide-react';

const AIRoleplay = () => (
  <div className="p-8 max-w-6xl mx-auto">
    <header className="mb-8">
      <h1 className="text-3xl font-bold text-corporate-navy">AI Roleplay Scenarios</h1>
      <p className="text-slate-500">Practice difficult conversations in a safe space.</p>
    </header>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {['Firing an Employee', 'Salary Negotiation', 'Conflict Resolution', 'Delivering Bad News'].map((scenario, i) => (
        <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:border-purple-300 transition-colors cursor-pointer">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
              <Mic className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-slate-400 uppercase">Intermediate</span>
          </div>
          <h3 className="font-bold text-lg text-corporate-navy mb-2">{scenario}</h3>
          <p className="text-sm text-slate-500 mb-4">
            Simulate a real-time conversation with an AI persona. Receive instant feedback on your tone and empathy.
          </p>
          <button className="w-full py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700">
            Start Scenario
          </button>
        </div>
      ))}
    </div>
  </div>
);
export default AIRoleplay;
