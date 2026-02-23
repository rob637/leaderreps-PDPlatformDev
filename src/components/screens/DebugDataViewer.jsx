// src/components/screens/DebugDataViewer.jsx

import React, { useMemo } from 'react';
import { useAppServices } from '../../services/useAppServices.jsx';
import { RefreshCw, Code, ArrowLeft, Loader, Globe, Clock, Briefcase } from 'lucide-react';
import { Button, Card } from '../ui';

const DebugDataViewer = () => {
    const {
        metadata, developmentPlanData, dailyPracticeData,
        isLoading, error,
        navigate, isAdmin
    } = useAppServices();

    // Admin-only screen - redirect non-admins
    if (!isAdmin) {
        return (
            <div className="p-6 md:p-10 min-h-screen bg-slate-50 dark:bg-slate-800 flex items-center justify-center">
                <div className="text-center">
                    <Code className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-slate-600 mb-2">Admin Access Required</h2>
                    <p className="text-slate-500 mb-4">This screen is only available to administrators.</p>
                    <Button onClick={() => navigate('dashboard')} variant="secondary">
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
                    </Button>
                </div>
            </div>
        );
    }

    const formattedMetadata = useMemo(() => JSON.stringify(metadata || {}, null, 2), [metadata]);
    const formattedDevPlanData = useMemo(() => JSON.stringify(developmentPlanData || {}, null, 2), [developmentPlanData]);
    const formattedDailyPracticeData = useMemo(() => JSON.stringify(dailyPracticeData || {}, null, 2), [dailyPracticeData]);

    return (
        <div className="p-6 md:p-10 min-h-screen bg-slate-50 dark:bg-slate-800 animate-fade-in">
            <Button onClick={() => navigate('app-settings')} variant="nav-back" size="sm" className="mb-6">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Settings
            </Button>
            
            <header className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-200 dark:border-slate-700 pb-4 mb-6">
                <h1 className="text-3xl md:text-4xl font-extrabold flex items-center gap-3 text-corporate-navy">
                    <Code size={32} className='text-red-500 flex-shrink-0' /> DEBUG: Raw Context Data
                </h1>
            </header>

            <div className={`p-4 rounded-xl border flex items-center gap-2 text-sm font-semibold mb-6 ${
                error ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700' :
                isLoading ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700' :
                'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700'
            }`}>
                 <RefreshCw className={`w-4 h-4 flex-shrink-0 ${isLoading ? 'animate-spin' : ''}`} />
                 Status: {isLoading ? 'Loading context data...' : error ? 'Error loading data' : 'Data Ready'}
            </div>
            
            {error && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-700 border border-red-200 dark:border-red-800 rounded-xl text-xs mb-6">
                    <p className='font-bold mb-1'>Error Details:</p>
                    <pre className='whitespace-pre-wrap break-words'>{error.message || String(error)}</pre>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                <div className="md:col-span-2">
                    <Card title="Global Metadata & Value Sets" icon={Globe} accentColor="bg-corporate-teal">
                        <p className='text-xs text-slate-600 dark:text-slate-300 mb-3 italic'>Source for Catalogs, Tiers, Feature Flags etc. (Loaded from Firestore <code>metadata/config</code> & <code>metadata/reading_catalog</code>).</p>
                        <textarea
                            readOnly value={formattedMetadata} rows={30}
                            className="w-full p-3 font-mono text-[10px] leading-tight border border-slate-300 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-800 shadow-inner resize-y focus:outline-none focus:ring-2 focus:ring-corporate-teal"
                            aria-label="Formatted Global Metadata"
                        />
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card title="Daily Practice State (User)" icon={Clock} accentColor="bg-corporate-orange">
                         <p className='text-xs text-slate-600 dark:text-slate-300 mb-3 italic'>Source: <code>daily_practice/[uid]/state</code>.</p>
                        <textarea
                            readOnly value={formattedDailyPracticeData} rows={15}
                            className="w-full p-3 font-mono text-[10px] leading-tight border border-slate-300 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-800 shadow-inner resize-y focus:outline-none focus:ring-2 focus:ring-corporate-teal"
                            aria-label="Formatted Daily Practice Data"
                        />
                    </Card>
                    <Card title="Development Plan (User)" icon={Briefcase} accentColor="bg-corporate-navy">
                         <p className='text-xs text-slate-600 dark:text-slate-300 mb-3 italic'>Source: <code>development_plan/[uid]/profile</code>.</p>
                        <textarea
                            readOnly value={formattedDevPlanData} rows={10}
                            className="w-full p-3 font-mono text-[10px] leading-tight border border-slate-300 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-800 shadow-inner resize-y focus:outline-none focus:ring-2 focus:ring-corporate-teal"
                            aria-label="Formatted Development Plan Data"
                        />
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default DebugDataViewer;
