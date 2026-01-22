import React from 'react';
import { Construction } from 'lucide-react';

const ModulePlaceholder = ({ title, description, features = [] }) => {
  return (
    <div className="p-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center max-w-2xl mx-auto mt-10">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Construction className="w-8 h-8 text-corporate-teal" />
        </div>
        <h2 className="text-2xl font-bold text-corporate-navy mb-2">{title}</h2>
        <p className="text-slate-500 mb-8">{description}</p>
        
        {features.length > 0 && (
            <div className="text-left bg-slate-50 p-6 rounded-lg border border-slate-100">
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4">Planned Capabilities</h3>
                <ul className="space-y-3">
                    {features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-slate-600">
                            <span className="w-1.5 h-1.5 rounded-full bg-corporate-teal mt-1.5"></span>
                            {feature}
                        </li>
                    ))}
                </ul>
            </div>
        )}

        <div className="mt-8 flex justify-center">
            <button disabled className="px-4 py-2 bg-slate-100 text-slate-400 rounded-lg cursor-not-allowed font-medium text-sm">
                Coming Soon
            </button>
        </div>
      </div>
    </div>
  );
};

export default ModulePlaceholder;
