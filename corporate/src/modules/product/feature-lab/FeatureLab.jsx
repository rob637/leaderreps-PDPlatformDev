import React, { useState } from 'react';
import { 
  Beaker, FlaskConical, AlertTriangle, 
  CheckCircle, ToggleLeft, ToggleRight, X 
} from 'lucide-react';

const FeatureLab = () => {
    // Mock Data
    const [features, setFeatures] = useState([
        { id: '1', name: 'New Dashboard Layout', key: 'dashboard_v2', status: 'active', risk: 'low' },
        { id: '2', name: 'AI Auto-Response', key: 'ai_response_beta', status: 'inactive', risk: 'high' },
        { id: '3', name: 'Dark Mode', key: 'theme_dark', status: 'active', risk: 'low' },
        { id: '4', name: 'Stripe Integration', key: 'payments_v2', status: 'inactive', risk: 'medium' }
    ]);

    const toggleFeature = (id) => {
        setFeatures(features.map(f => 
            f.id === id ? { ...f, status: f.status === 'active' ? 'inactive' : 'active' } : f
        ));
    };

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="mb-8 flex items-center justify-between">
                <div>
                     <h1 className="text-3xl font-bold text-corporate-navy flex items-center gap-3">
                        <FlaskConical className="w-8 h-8 text-purple-600" />
                        Feature Lab
                     </h1>
                     <p className="text-slate-500 mt-1">Manage experimental features and system flags.</p>
                </div>
                <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-2 rounded-lg text-sm flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Changes here affect all users immediately.
                </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left hidden md:table">
                    <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-bold">
                        <tr>
                            <th className="p-4 pl-6">Feature Name</th>
                            <th className="p-4">Key</th>
                            <th className="p-4">Risk Level</th>
                            <th className="p-4 text-right pr-6">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {features.map(feature => (
                            <tr key={feature.id} className="hover:bg-slate-50/50">
                                <td className="p-4 pl-6 font-medium text-slate-800">
                                    <div className="flex items-center gap-2">
                                        <Beaker className="w-4 h-4 text-slate-400" />
                                        {feature.name}
                                    </div>
                                </td>
                                <td className="p-4 font-mono text-xs text-slate-500">{feature.key}</td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${
                                        feature.risk === 'high' ? 'bg-rose-100 text-rose-700' :
                                        feature.risk === 'medium' ? 'bg-amber-100 text-amber-700' :
                                        'bg-slate-100 text-slate-600'
                                    }`}>
                                        {feature.risk}
                                    </span>
                                </td>
                                <td className="p-4 pr-6 text-right">
                                    <button 
                                        onClick={() => toggleFeature(feature.id)}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                            feature.status === 'active' ? 'bg-emerald-500' : 'bg-slate-200'
                                        }`}
                                    >
                                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-all ${
                                            feature.status === 'active' ? 'translate-x-6' : 'translate-x-1'
                                        }`} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default FeatureLab;
