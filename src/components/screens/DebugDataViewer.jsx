// src/components/screens/DebugDataViewer.jsx

import React, { useMemo } from 'react';
import { useAppServices } from '../../services/useAppServices.jsx';
import { RefreshCw, Code, ArrowLeft, Loader, Globe, Clock, Briefcase } from 'lucide-react';

// --- Standardized UI Components ---
const Button = ({ children, onClick, disabled = false, variant = 'primary', className = '', size = 'md', ...rest }) => {
  const baseStyles = "inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-[#47A88D] text-white shadow-md hover:bg-[#3d917a] focus:ring-[#47A88D]/50",
    secondary: "bg-[#E04E1B] text-white shadow-md hover:bg-[#c44317] focus:ring-[#E04E1B]/50",
    outline: "bg-white text-[#47A88D] border-2 border-[#47A88D] shadow-sm hover:bg-[#47A88D]/10 focus:ring-[#47A88D]/50",
    ghost: "bg-transparent text-slate-600 hover:bg-slate-100",
    'nav-back': "bg-white text-slate-700 border border-slate-300 shadow-sm hover:bg-slate-100 focus:ring-slate-300/50 px-4 py-2 text-sm",
  };
  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-5 py-2.5 text-base",
    lg: "px-8 py-4 text-lg",
  };
  return (
    <button 
      onClick={onClick} 
      disabled={disabled} 
      className={`${baseStyles} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
};

const Card = ({ children, title, icon: Icon, className = '', accentColor = 'bg-[#002E47]' }) => {
  return (
    <div className={`relative w-full text-left bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden ${className}`}>
      <div className={`absolute top-0 left-0 right-0 h-1.5 ${accentColor}`} />
      <div className="p-6">
        {(Icon || title) && (
            <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
                {Icon && (
                    <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100">
                        <Icon className="w-5 h-5 text-[#002E47]" />
                    </div>
                )}
                {title && (
                    <h2 className="text-xl font-bold text-[#002E47]">{title}</h2>
                )}
            </div>
        )}
        {children}
      </div>
    </div>
  );
};

const DebugDataViewer = () => {
    const {
        metadata, developmentPlanData, dailyPracticeData,
        isLoading, error,
        navigate
    } = useAppServices();

    const formattedMetadata = useMemo(() => JSON.stringify(metadata || {}, null, 2), [metadata]);
    const formattedDevPlanData = useMemo(() => JSON.stringify(developmentPlanData || {}, null, 2), [developmentPlanData]);
    const formattedDailyPracticeData = useMemo(() => JSON.stringify(dailyPracticeData || {}, null, 2), [dailyPracticeData]);

    return (
        <div className="p-6 md:p-10 min-h-screen bg-slate-50 animate-fade-in">
            <Button onClick={() => navigate('app-settings')} variant="nav-back" size="sm" className="mb-6">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Settings
            </Button>
            
            <header className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-200 pb-4 mb-6">
                <h1 className="text-3xl md:text-4xl font-extrabold flex items-center gap-3 text-[#002E47]">
                    <Code size={32} className='text-red-500 flex-shrink-0' /> DEBUG: Raw Context Data
                </h1>
            </header>

            <div className={`p-4 rounded-xl border flex items-center gap-2 text-sm font-semibold mb-6 ${
                error ? 'bg-red-50 border-red-200 text-red-700' :
                isLoading ? 'bg-blue-50 border-blue-200 text-blue-700' :
                'bg-green-50 border-green-200 text-green-700'
            }`}>
                 <RefreshCw className={`w-4 h-4 flex-shrink-0 ${isLoading ? 'animate-spin' : ''}`} />
                 Status: {isLoading ? 'Loading context data...' : error ? 'Error loading data' : 'Data Ready'}
            </div>
            
            {error && (
                <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs mb-6">
                    <p className='font-bold mb-1'>Error Details:</p>
                    <pre className='whitespace-pre-wrap break-words'>{error.message || String(error)}</pre>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                <div className="md:col-span-2">
                    <Card title="Global Metadata & Value Sets" icon={Globe} accentColor="bg-[#47A88D]">
                        <p className='text-xs text-slate-600 mb-3 italic'>Source for Catalogs, Tiers, Feature Flags etc. (Loaded from Firestore <code>metadata/config</code> & <code>metadata/reading_catalog</code>).</p>
                        <textarea
                            readOnly value={formattedMetadata} rows={30}
                            className="w-full p-3 font-mono text-[10px] leading-tight border border-slate-300 rounded-xl bg-slate-50 shadow-inner resize-y focus:outline-none focus:ring-2 focus:ring-[#47A88D]"
                            aria-label="Formatted Global Metadata"
                        />
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card title="Daily Practice State (User)" icon={Clock} accentColor="bg-[#E04E1B]">
                         <p className='text-xs text-slate-600 mb-3 italic'>Source: <code>daily_practice/[uid]/state</code>.</p>
                        <textarea
                            readOnly value={formattedDailyPracticeData} rows={15}
                            className="w-full p-3 font-mono text-[10px] leading-tight border border-slate-300 rounded-xl bg-slate-50 shadow-inner resize-y focus:outline-none focus:ring-2 focus:ring-[#47A88D]"
                            aria-label="Formatted Daily Practice Data"
                        />
                    </Card>
                    <Card title="Development Plan (User)" icon={Briefcase} accentColor="bg-[#002E47]">
                         <p className='text-xs text-slate-600 mb-3 italic'>Source: <code>development_plan/[uid]/profile</code>.</p>
                        <textarea
                            readOnly value={formattedDevPlanData} rows={10}
                            className="w-full p-3 font-mono text-[10px] leading-tight border border-slate-300 rounded-xl bg-slate-50 shadow-inner resize-y focus:outline-none focus:ring-2 focus:ring-[#47A88D]"
                            aria-label="Formatted Development Plan Data"
                        />
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default DebugDataViewer;
