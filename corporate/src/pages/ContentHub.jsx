import React from 'react';
import { FileText, Clock } from 'lucide-react';

const ContentHub = () => {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-corporate-navy">Content Hub</h1>
        <p className="text-slate-500 mt-1">Amplify replacement — content sharing & tracking</p>
        <p className="text-xs text-emerald-600 mt-1">💰 Will save $100/mo</p>
      </div>

      <div className="bg-slate-50 rounded-xl p-12 text-center border-2 border-dashed border-slate-200">
        <Clock className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-corporate-navy mb-2">Priority #3 on Roadmap</h3>
        <p className="text-slate-500 max-w-md mx-auto">
          Amplify replacement is coming after we finish Sales Navigator and LinkedIn Helper. 
          This will let you share content and track engagement.
        </p>
      </div>
    </div>
  );
};

export default ContentHub;
