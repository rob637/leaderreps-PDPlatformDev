import React from 'react';
import { Building2, Clock } from 'lucide-react';

const Vendors = () => {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-corporate-navy">Vendors & Clients</h1>
        <p className="text-slate-500 mt-1">Manage existing client relationships</p>
      </div>

      <div className="bg-slate-50 rounded-xl p-12 text-center border-2 border-dashed border-slate-200">
        <Clock className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-corporate-navy mb-2">Coming After Prospects</h3>
        <p className="text-slate-500 max-w-md mx-auto">
          We're building the Prospects module first (Sales Navigator replacement). 
          Client management will be built once we have prospects flowing into the pipeline.
        </p>
      </div>
    </div>
  );
};

export default Vendors;
