import React, { useState } from 'react';
import { 
  Puzzle, Cloud, Database, Lock, 
  CheckCircle, Plus, ChevronRight, AlertTriangle 
} from 'lucide-react';

const IntegrationHub = () => {
    const [integrations, setIntegrations] = useState([
        { 
            id: '1', 
            name: 'Slack', 
            category: 'Communication',
            status: 'connected',
            description: 'Send notifications to #sales-wins when a deal closes.',
            icon: <MessageSquareIcon className="w-8 h-8 text-[#4A154B]" />
        },
        { 
            id: '2', 
            name: 'Google Calendar', 
            category: 'Productivity',
            status: 'connected',
            description: 'Sync availability for the Scheduler.',
            icon: <CalendarIcon className="w-8 h-8 text-blue-500" />
        },
        { 
            id: '3', 
            name: 'Salesforce', 
            category: 'CRM',
            status: 'disconnected',
            description: 'Bi-directional sync of prospect data.',
            icon: <Cloud className="w-8 h-8 text-[#00A1E0]" />
        }
    ]);

    const MessageSquareIcon = ({className}) => (
         <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M6 15a2 2 0 0 1-2 2 2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A2 2 0 0 0 6 11V8a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3a2 2 0 0 1-2 2h-5l-5 5v-3z"/></svg> 
    );
    const CalendarIcon = ({className}) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
    );

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-corporate-navy flex items-center gap-3">
                    <Puzzle className="w-8 h-8 text-indigo-500" />
                    Integration Hub
                </h1>
                <p className="text-slate-500 mt-1">Connect LeaderReps to your enterprise stack.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {integrations.map(integration => (
                    <div key={integration.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 hover:shadow-md transition-all">
                        <div className="flex justify-between items-start mb-4">
                            <div className="bg-slate-50 p-3 rounded-xl">
                                {integration.icon}
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${
                                integration.status === 'connected' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'
                            }`}>
                                {integration.status}
                            </span>
                        </div>
                        
                        <h3 className="text-lg font-bold text-slate-800 mb-1">{integration.name}</h3>
                        <p className="text-sm text-slate-500 mb-4 h-10">{integration.description}</p>
                        
                        {integration.status === 'connected' ? (
                            <button className="w-full border border-slate-200 text-slate-700 py-2 rounded-lg text-sm font-medium hover:bg-slate-50">
                                Configure
                            </button>
                        ) : (
                            <button className="w-full bg-corporate-navy text-white py-2 rounded-lg text-sm font-medium hover:bg-slate-800">
                                Connect
                            </button>
                        )}
                    </div>
                ))}

                {/* Add New */}
                <button className="border-2 border-dashed border-slate-300 rounded-xl p-6 flex flex-col items-center justify-center text-slate-500 hover:border-corporate-teal hover:text-corporate-teal hover:bg-slate-50 transition-all">
                    <Plus className="w-8 h-8 mb-2 opacity-50" />
                    <span className="font-medium">Request Integration</span>
                </button>
            </div>
            
            <div className="mt-8 bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-4">
                 <div className="bg-white p-2 rounded-full h-fit">
                    <Lock className="w-5 h-5 text-amber-600" />
                 </div>
                 <div>
                    <h4 className="font-bold text-amber-900">Enterprise Security</h4>
                    <p className="text-sm text-amber-800 mt-1">
                        SSO (Single Sign-On) via OKTA and Azure AD is available only on the Enterprise plan. 
                        <a href="#" className="underline ml-1">Upgrade workspace</a>.
                    </p>
                 </div>
            </div>
        </div>
    );
};

export default IntegrationHub;
