import React from 'react';
import { Beaker, Clock } from 'lucide-react';

const FeatureLab = () => {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-corporate-navy">Feature Lab</h1>
        <p className="text-slate-500 mt-1">A/B testing and feature flags</p>
      </div>

      <div className="bg-slate-50 rounded-xl p-12 text-center border-2 border-dashed border-slate-200">
        <Clock className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-corporate-navy mb-2">Internal Tool</h3>
        <p className="text-slate-500 max-w-md mx-auto">
          Feature Lab for A/B testing will be built when we have enough users 
          to run meaningful experiments on the main LeaderReps app.
        </p>
      </div>
    </div>
  );
};

export default FeatureLab;
