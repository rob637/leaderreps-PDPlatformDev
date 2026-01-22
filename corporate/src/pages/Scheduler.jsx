import React from 'react';
import { Calendar, Clock } from 'lucide-react';

const Scheduler = () => {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-corporate-navy">Scheduler</h1>
        <p className="text-slate-500 mt-1">Calendly replacement — booking pages & availability</p>
        <p className="text-xs text-emerald-600 mt-1">💰 Will save $20/mo</p>
      </div>

      <div className="bg-slate-50 rounded-xl p-12 text-center border-2 border-dashed border-slate-200">
        <Clock className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-corporate-navy mb-2">Priority #5 on Roadmap</h3>
        <p className="text-slate-500 max-w-md mx-auto">
          Calendly replacement is planned but not urgent. We'll build this after 
          Sales Navigator, LinkedIn Helper, and Amplify replacements are done.
        </p>
      </div>
    </div>
  );
};

export default Scheduler;
