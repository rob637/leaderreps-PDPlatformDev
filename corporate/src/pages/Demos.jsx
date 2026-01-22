import React from 'react';
import { Presentation, Clock } from 'lucide-react';

const Demos = () => {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-corporate-navy">Demo Tracking</h1>
        <p className="text-slate-500 mt-1">Schedule and track product demos</p>
      </div>

      <div className="bg-slate-50 rounded-xl p-12 text-center border-2 border-dashed border-slate-200">
        <Clock className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-corporate-navy mb-2">Coming Soon</h3>
        <p className="text-slate-500 max-w-md mx-auto">
          Demo tracking will be added once we have the prospect pipeline working. 
          Demos will be linked to prospects for full funnel visibility.
        </p>
      </div>
    </div>
  );
};

export default Demos;
