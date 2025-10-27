// src/components/screens/DebugDataViewer.jsx (Refactored for Consistency)

import React, { useMemo } from 'react';
// --- Core Services & Context ---
import { useAppServices } from '../../services/useAppServices.jsx'; // cite: useAppServices.jsx

// --- Icons ---
import { RefreshCw, Code, ArrowLeft, Loader } from 'lucide-react'; // Added Loader, ArrowLeft

/* =========================================================
   PALETTE & UI COMPONENTS (Standardized)
========================================================= */
// --- Primary Color Palette ---
const COLORS = { NAVY: '#002E47', TEAL: '#47A88D', BLUE: '#2563EB', ORANGE: '#E04E1B', GREEN: '#10B981', AMBER: '#F5A800', RED: '#E04E1B', LIGHT_GRAY: '#FCFCFA', OFF_WHITE: '#FFFFFF', SUBTLE: '#E5E7EB', TEXT: '#374151', MUTED: '#4B5563', PURPLE: '#7C3AED', BG: '#F9FAFB' }; // cite: App.jsx

// --- Standardized UI Components (Assume imported or globally available) ---
// Using placeholder comments, assuming Button and Card are correctly defined elsewhere or globally
// const Button = ({...}) => { /* ... Standard Button ... */ };
// const Card = ({...}) => { /* ... Standard Card ... */ };
// --- Standardized Button Component (Local Definition for standalone use) ---
const Button = ({ children, onClick, disabled = false, variant = 'primary', className = '', size = 'md', ...rest }) => { /* ... Re-use definition ... */
    let baseStyle = `inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-4 disabled:opacity-50 disabled:cursor-not-allowed`;
    if (size === 'sm') baseStyle += ' px-4 py-2 text-sm'; else if (size === 'lg') baseStyle += ' px-8 py-4 text-lg'; else baseStyle += ' px-6 py-3 text-base'; // Default 'md'
    if (variant === 'primary') baseStyle += ` bg-[${COLORS.TEAL}] text-white shadow-lg hover:bg-[#349881] focus:ring-[${COLORS.TEAL}]/50`;
    else if (variant === 'secondary') baseStyle += ` bg-[${COLORS.ORANGE}] text-white shadow-lg hover:bg-[#C312] focus:ring-[${COLORS.ORANGE}]/50`;
    else if (variant === 'outline') baseStyle += ` bg-[${COLORS.OFF_WHITE}] text-[${COLORS.TEAL}] border-2 border-[${COLORS.TEAL}] shadow-md hover:bg-[${COLORS.TEAL}]/10 focus:ring-[${COLORS.TEAL}]/50`;
    else if (variant === 'nav-back') baseStyle += ` bg-white text-gray-700 border border-gray-300 shadow-sm hover:bg-gray-100 focus:ring-gray-300/50 px-4 py-2 text-sm`;
    else if (variant === 'ghost') baseStyle += ` bg-transparent text-gray-600 hover:bg-gray-100 focus:ring-gray-300/50 px-3 py-1.5 text-sm`;
    if (disabled) baseStyle += ' bg-gray-300 text-gray-500 shadow-inner border-transparent hover:bg-gray-300';
    return (<button {...rest} onClick={onClick} disabled={disabled} className={`${baseStyle} ${className}`}>{children}</button>);
};
// --- Standardized Card Component (Local Definition for standalone use) ---
const Card = ({ children, title, icon: Icon, className = '', accent = 'NAVY' }) => { /* ... Re-use definition ... */
    const accentColor = COLORS[accent] || COLORS.NAVY;
    return ( <div className={`relative p-6 rounded-2xl border-2 shadow-xl ${className}`} style={{ background: 'linear-gradient(180deg,#FFFFFF, #FCFCFA)', borderColor: COLORS.SUBTLE, color: COLORS.NAVY }}> <span style={{ position:'absolute', top:0, left:0, right:0, height:6, background: accentColor, borderTopLeftRadius:14, borderTopRightRadius:14 }} /> {Icon && title && ( <div className="flex items-center gap-3 mb-4"> <div className="w-10 h-10 rounded-lg flex items-center justify-center border flex-shrink-0" style={{ borderColor: COLORS.SUBTLE, background: COLORS.LIGHT_GRAY }}> <Icon className="w-5 h-5" style={{ color: accentColor }} /> </div> <h2 className="text-xl font-extrabold" style={{ color: COLORS.NAVY }}>{title}</h2> </div> )} {!Icon && title && <h2 className="text-xl font-extrabold mb-4 border-b pb-2" style={{ color: COLORS.NAVY, borderColor: COLORS.SUBTLE }}>{title}</h2>} <div>{children}</div> </div> );
};
const LoadingSpinner = ({ message = "Loading..." }) => ( /* ... Re-use definition ... */
    <div className="min-h-[200px] flex items-center justify-center" style={{ background: COLORS.BG }}> <div className="flex flex-col items-center"> <Loader className="animate-spin h-12 w-12 mb-3" style={{ color: COLORS.TEAL }} /> <p className="font-semibold" style={{ color: COLORS.NAVY }}>{message}</p> </div> </div>
);


/* =========================================================
   DebugDataViewer Component
========================================================= */

/**
 * DebugDataViewer Screen
 * Displays raw data fetched by the useAppServices context for debugging purposes.
 * Shows global metadata, development plan data, and daily practice data.
 */
const DebugDataViewer = () => {
    // --- Consume Services ---
    const {
        // Data objects
        metadata, developmentPlanData, dailyPracticeData, // Use renamed data keys // cite: useAppServices.jsx
        // Status
        isLoading, error,
        // Navigation
        navigate // Get navigate from context // cite: useAppServices.jsx
    } = useAppServices();

    // --- Format Data for Display (Memoized) ---
    // Safely stringify context data, handling potential undefined/null states during loading
    const formattedMetadata = useMemo(() => JSON.stringify(metadata || {}, null, 2), [metadata]);
    const formattedDevPlanData = useMemo(() => JSON.stringify(developmentPlanData || {}, null, 2), [developmentPlanData]); // Use renamed key
    const formattedDailyPracticeData = useMemo(() => JSON.stringify(dailyPracticeData || {}, null, 2), [dailyPracticeData]); // Use renamed key

    // --- Render Logic ---
    return (
        // Consistent page structure and padding
        <div className="p-6 md:p-8 lg:p-10 space-y-6 max-w-7xl mx-auto min-h-screen" style={{ background: COLORS.BG }}> {/* Use BG color */}
            {/* Header */}
            <header className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b pb-4 mb-6" style={{ borderColor: COLORS.SUBTLE }}>
                <h1 className="text-3xl md:text-4xl font-extrabold flex items-center gap-3" style={{ color: COLORS.NAVY }}>
                    <Code size={32} className='text-red-500 flex-shrink-0' /> DEBUG: Raw Context Data
                </h1>
                {/* Back Button */}
                <Button onClick={() => navigate('app-settings')} variant="nav-back" size="sm"> {/* Use Button */}
                    <ArrowLeft size={16} className="mr-1" /> Back to Settings
                </Button>
            </header>

            {/* Loading / Error Status Display */}
            <div className={`p-3 rounded-lg border flex items-center gap-2 text-sm font-semibold ${
                error ? 'bg-red-50 border-red-300 text-red-700' :
                isLoading ? 'bg-blue-50 border-blue-300 text-blue-700' :
                'bg-green-50 border-green-300 text-green-700'
            }`}>
                 <RefreshCw className={`w-4 h-4 flex-shrink-0 ${isLoading ? 'animate-spin' : ''}`} />
                 Status: {isLoading ? 'Loading context data...' : error ? 'Error loading data' : 'Data Ready'}
            </div>
            {/* Display Error Details */}
            {error && (
                <div className="p-3 bg-red-50 text-red-700 border border-red-300 rounded-lg text-xs">
                    <p className='font-bold mb-1'>Error Details:</p>
                    <pre className='whitespace-pre-wrap break-words'>{error.message || String(error)}</pre>
                </div>
            )}

            {/* Data Display Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Global Metadata Card */}
                <div className="md:col-span-2"> {/* Wider column */}
                    <Card title="Global Metadata & Value Sets" icon={Globe} accent="PURPLE">
                        <p className='text-xs text-gray-600 mb-3 italic'>Source for Catalogs, Tiers, Feature Flags etc. (Loaded from Firestore <code>metadata/config</code> & <code>metadata/reading_catalog</code>).</p>
                        <textarea
                            readOnly value={formattedMetadata} rows={30}
                            className="w-full p-3 font-mono text-[10px] leading-tight border rounded-lg bg-gray-50/50 shadow-inner resize-y custom-scrollbar" // Smaller text, allow resize
                            style={{ borderColor: COLORS.SUBTLE }}
                            aria-label="Formatted Global Metadata"
                        />
                    </Card>
                </div>

                {/* User Data Cards */}
                <div className="space-y-6">
                    {/* Daily Practice Data */}
                    <Card title="Daily Practice State (User)" icon={Clock} accent="TEAL">
                         <p className='text-xs text-gray-600 mb-3 italic'>Source: <code>daily_practice/[uid]/state</code>.</p>
                        <textarea
                            readOnly value={formattedDailyPracticeData} rows={15}
                            className="w-full p-3 font-mono text-[10px] leading-tight border rounded-lg bg-gray-50/50 shadow-inner resize-y custom-scrollbar"
                            style={{ borderColor: COLORS.SUBTLE }}
                            aria-label="Formatted Daily Practice Data"
                        />
                    </Card>
                    {/* Development Plan Data */}
                    <Card title="Development Plan (User)" icon={Briefcase} accent="NAVY">
                         <p className='text-xs text-gray-600 mb-3 italic'>Source: <code>development_plan/[uid]/profile</code>.</p>
                        <textarea
                            readOnly value={formattedDevPlanData} rows={10}
                            className="w-full p-3 font-mono text-[10px] leading-tight border rounded-lg bg-gray-50/50 shadow-inner resize-y custom-scrollbar"
                            style={{ borderColor: COLORS.SUBTLE }}
                            aria-label="Formatted Development Plan Data"
                        />
                    </Card>
                    {/* Strategic Content Data (Optional Display) */}
                    {/* <Card title="Strategic Content (User)" icon={Trello} accent="BLUE"> ... </Card> */}
                </div>
            </div>
        </div>
    );
};

// Export the component
export default DebugDataViewer;