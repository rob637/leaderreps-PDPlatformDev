// src/components/screens/AdminDataMaintenance.jsx

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAppServices } from '../../services/useAppServices.jsx';
import { ArrowLeft, Cpu, Lock, CheckCircle, AlertTriangle, CornerRightUp, Settings, BarChart3, TrendingUp, Download, Code, List, BookOpen, Target, Users } from 'lucide-react';

/* =========================================================
   HIGH-CONTRAST PALETTE (Centralized for Consistency)
========================================================= */
const COLORS = {
  NAVY: '#002E47', 
  TEAL: '#47A88D', 
  ORANGE: '#E04E1B', 
  GREEN: '#10B981',
  LIGHT_GRAY: '#FCFCFA',
  OFF_WHITE: '#FFFFFF',
  SUBTLE: '#E5E7EB',
  TEXT: '#002E47',
};

const PASSWORD = "7036238835"; // Required password

const Card = ({ children, title, icon: Icon, className = '', accent = 'NAVY', isSmall = false }) => {
    const accentColor = COLORS[accent] || COLORS.NAVY;
    const Tag = isSmall ? 'div' : 'div';
    return (
        <Tag
            className={`relative p-6 rounded-2xl border-2 shadow-2xl transition-all duration-300 text-left ${className}`}
            style={{ background: 'linear-gradient(180deg,#FFFFFF, #FCFCFA)', borderColor: COLORS.SUBTLE, color: COLORS.TEXT }}
        >
            <span style={{ position:'absolute', top:0, left:0, right:0, height:6, background: accentColor, borderTopLeftRadius:14, borderTopRightRadius:14 }} />
            {Icon && (
                <div className="w-10 h-10 rounded-lg flex items-center justify-center border mb-3" style={{ borderColor: COLORS.SUBTLE, background: COLORS.LIGHT_GRAY }}>
                    <Icon className="w-5 h-5" style={{ color: COLORS.TEAL }} />
                </div>
            )}
            {title && <h2 className="text-xl font-extrabold mb-2" style={{ color: COLORS.NAVY }}>{title}</h2>}
            {children}
        </Tag>
    );
};

const Button = ({ children, onClick, disabled = false, variant = 'primary', className = '', ...rest }) => {
    let baseStyle = "px-6 py-3 rounded-xl font-semibold transition-all shadow-lg focus:outline-none focus:ring-4 text-white flex items-center justify-center";
    if (variant === 'primary') { baseStyle += ` bg-[${COLORS.TEAL}] hover:bg-[#349881] focus:ring-[${COLORS.TEAL}]/50`; }
    else if (variant === 'secondary') { baseStyle += ` bg-[${COLORS.ORANGE}] hover:bg-red-700 focus:ring-[${COLORS.ORANGE}]/50`; }
    else if (variant === 'outline') { baseStyle = `px-6 py-3 rounded-xl font-semibold transition-all shadow-md border-2 border-[${COLORS.TEAL}] text-[${COLORS.TEAL}] hover:bg-[#47A88D]/10 focus:ring-4 focus:ring-[${COLORS.TEAL}]/50 bg-[${COLORS.LIGHT_GRAY}] flex items-center justify-center`; }
    if (disabled) { baseStyle = "px-6 py-3 rounded-xl font-semibold bg-gray-300 text-gray-500 cursor-not-allowed shadow-inner transition-none flex items-center justify-center"; }
    return (<button {...rest} onClick={onClick} disabled={disabled} className={`${baseStyle} ${className}`}>{children}</button>);
};

// --- DATA EDITOR COMPONENT: Reading Hub Tab ---
const ReadingHubEditor = ({ catalog, isSaving, setGlobalData, navigate, currentEditorKey }) => { // currentEditorKey prop is added
    
    // CRITICAL FIX 1: Ensure JSON.stringify uses an empty object if catalog is null/undefined
    const initialJson = useMemo(() => {
        try {
            return JSON.stringify(catalog || {}, null, 2);
        } catch {
            return JSON.stringify({});
        }
    }, [catalog]);

    const [jsonText, setJsonText] = useState(initialJson);
    const [status, setStatus] = useState(null); // null, 'success', 'error'
    
    useEffect(() => {
        // Reset JSON text when the catalog changes (e.g., switching tabs)
        setJsonText(initialJson);
    }, [initialJson]);

    const isJsonValid = useMemo(() => {
        try {
            JSON.parse(jsonText);
            return true;
        } catch (e) {
            return false;
        }
    }, [jsonText]);

    const handleSave = () => {
        if (!isJsonValid) {
            setStatus({ type: 'error', message: 'Invalid JSON format. Cannot stage changes.' });
            return;
        }
        
        try {
            const parsedData = JSON.parse(jsonText);

            // Determine which key to update in the global data object
            let updateObject = {};

            if (currentEditorKey === 'READING_CATALOG_SERVICE') {
                 updateObject.READING_CATALOG_SERVICE = parsedData;
                 setStatus({ type: 'success', message: 'Reading Catalog staged locally. Click "Finalize & Write" to commit.' });
            } else if (currentEditorKey === 'RAW_CONFIG') {
                 // For the raw tab, replace the entire object with the parsed data
                 setGlobalData(() => parsedData);
                 setStatus({ type: 'success', message: 'Raw Config staged locally. Click "Finalize & Write" to commit.' });
                 return; // Exit early as setGlobalData was called with the full object
            } else {
                 setStatus({ type: 'error', message: 'Unknown editor key. Stage operation failed.' });
                 return;
            }
            
            // This calls the main setGlobalData function, which updates the local state
            setGlobalData(prev => ({ 
                ...prev, 
                ...updateObject 
            }));
            
        } catch (e) {
            setStatus({ type: 'error', message: `Internal error staging data: ${e.message}` });
        }
    };
    
    const editorTitle = currentEditorKey === 'READING_CATALOG_SERVICE' 
        ? 'Reading Catalog JSON (Key: READING_CATALOG_SERVICE)'
        : 'FULL Global Config JSON (Key: metadata/config)';

    return (
        <div className='mt-4'>
            <p className='text-sm font-bold text-[#002E47] mb-2'>{editorTitle}</p>
            <p className='text-sm text-gray-700 mb-4'>
                Ensure your data is structured as a valid JSON object. For the Reading Hub, the top level keys should be the category names (e.g., "Strategy & Execution").
            </p>
            <textarea
                value={jsonText}
                onChange={(e) => {setJsonText(e.target.value); setStatus(null);}}
                className="w-full p-4 border border-gray-300 rounded-lg focus:ring-[#E04E1B] focus:border-[#E04E1B] h-[400px] font-mono text-sm resize-y"
                disabled={isSaving}
            />
            {status && (
                <div className className={`mt-4 p-3 rounded-lg font-semibold flex items-center gap-2 ${
                    status.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                    {status.type === 'success' ? <CheckCircle className='w-5 h-5'/> : <AlertTriangle className='w-5 h-5'/>}
                    {status.message}
                </div>
            )}
            <Button onClick={handleSave} disabled={isSaving || !isJsonValid} className={`mt-4 w-full bg-[${COLORS.TEAL}] hover:bg-[#349881]`}>
                <Code className='w-5 h-5 mr-2'/> Stage Changes for Database Write
            </Button>
            {!isJsonValid && <p className='text-xs text-red-500 mt-2'>* Fix JSON syntax before staging changes.</p>}
        </div>
    );
};


// --- MAIN ROUTER ---
const GlobalDataEditor = ({ globalMetadata, updateGlobalMetadata, db, navigate }) => {
    
    // CRITICAL: We maintain a local copy of ALL metadata to be written to the database
    // CRITICAL FIX 2: Ensure globalMetadata defaults to an empty object for safe destructuring/use
    const [localGlobalData, setLocalGlobalData] = useState(globalMetadata || {});
    const [currentTab, setCurrentTab] = useState('summary');
    const [isSaving, setIsSaving] = useState(false);
    const [status, setStatus] = useState(null); // Save status for the final write

    // Sync local state when the global metadata object updates from the hook
    useEffect(() => {
        setLocalGlobalData(globalMetadata || {});
        setStatus(null); // Clear status on external data load
    }, [globalMetadata]);


    // --- FINAL DATABASE WRITE HANDLER ---
    const handleFinalSave = async () => {
        setIsSaving(true);
        setStatus(null);
        
        try {
            // Write the merged local object back to the metadata/config document
            const success = await updateGlobalMetadata(db, localGlobalData);

            if (success) {
                setStatus({ type: 'success', message: 'ALL global configurations successfully saved to Firestore.' });
            } else {
                setStatus({ type: 'error', message: 'Database write failed. Check console logs.' });
            }
        } catch (e) {
            setStatus({ type: 'error', message: `Critical error during final save: ${e.message}` });
        } finally {
            setIsSaving(false);
        }
    };
    
    // CRITICAL FIX 3: Add safe guarding for accessing nested catalog data
    const countItems = (obj) => Object.values(obj || {}).flat().length;

    const navItems = useMemo(() => [
        { key: 'summary', label: 'Summary', icon: BarChart3, accent: 'NAVY' },
        { key: 'reading', label: 'Content Editor (Reading Hub)', icon: BookOpen, accent: 'TEAL', count: countItems(localGlobalData.READING_CATALOG_SERVICE) },
        { key: 'tiers', label: 'Tiers & Goals', icon: Target, accent: 'ORANGE', count: Object.keys(localGlobalData.LEADERSHIP_TIERS || {}).length },
        { key: 'scenarios', label: 'Coaching Scenarios', icon: Users, accent: 'BLUE', count: countItems(localGlobalData.SCENARIO_CATALOG) },
        { key: 'raw', label: 'Advanced: Raw Config', icon: Code, accent: 'RED' },
    ], [localGlobalData]);

    const renderTabContent = () => {
        switch (currentTab) {
            case 'reading':
                return <ReadingHubEditor 
                    // CRITICAL FIX 4: Provide safe fallback to the editor
                    catalog={localGlobalData.READING_CATALOG_SERVICE || {}}
                    isSaving={isSaving}
                    setGlobalData={setLocalGlobalData}
                    navigate={navigate}
                    currentEditorKey={'READING_CATALOG_SERVICE'} // Pass specific key
                />;
            case 'raw':
                return (
                    <ReadingHubEditor // Re-use the editor component for raw JSON editing
                        catalog={localGlobalData}
                        isSaving={isSaving}
                        setGlobalData={setLocalGlobalData}
                        navigate={navigate}
                        currentEditorKey={'RAW_CONFIG'} // Pass specific key
                    />
                );
            case 'tiers':
                return <Card title="Tier/Goal Editor (Coming Soon)" isSmall={true}>
                    <p className='text-sm text-gray-600'>This view will allow friendly table editing of the **LEADERSHIP\_TIERS** and **COMMITMENT\_BANK** arrays.</p>
                </Card>;
            case 'scenarios':
                return <Card title="Scenario Editor (Coming Soon)" isSmall={true}>
                    <p className='text-sm text-gray-600'>This view will allow easy table editing of the **SCENARIO\_CATALOG** array.</p>
                </Card>;
            case 'summary':
            default:
                return (
                    <Card title="Database Summary Snapshot" accent='TEAL' isSmall={true}>
                        <p className='text-sm text-gray-700 mb-4'>Review the current counts before committing changes. *Use the "Stage Changes" buttons in the tabs before saving globally.*</p>
                        <div className='space-y-2'>
                            {navItems.filter(i => i.count !== undefined).map(item => (
                                <div key={item.key} className='flex justify-between items-center text-sm border-b pb-1'>
                                    <span className='font-semibold'>{item.label}:</span>
                                    <span className='font-extrabold text-[#E04E1B]'>{item.count} Items</span>
                                </div>
                            ))}
                        </div>
                    </Card>
                );
        }
    };


    return (
        <>
            <div className='flex space-x-2 border-b border-gray-300 overflow-x-auto'>
                {navItems.map(item => (
                    <button
                        key={item.key}
                        onClick={() => setCurrentTab(item.key)}
                        className={`flex items-center px-4 py-2 text-sm font-semibold transition-colors whitespace-nowrap ${currentTab === item.key ? 'border-[#47A88D] border-b-4 text-[#002E47]' : 'border-transparent text-gray-500 hover:text-[#002E47]'}`}
                    >
                        <item.icon className='w-4 h-4 mr-1' />
                        {item.label} {item.count !== undefined && `(${item.count})`}
                    </button>
                ))}
            </div>

            <div className='mt-6 p-6 rounded-xl border-2 shadow-lg bg-white'>
                {renderTabContent()}
            </div>
            
            {status && (
                <div className={`mt-4 p-3 rounded-lg font-semibold flex items-center gap-2 ${
                    status.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                    {status.type === 'success' ? <CheckCircle className='w-5 h-5'/> : <AlertTriangle className='w-5 h-5'/>}
                    {status.message}
                </div>
            )}

            <Button onClick={handleFinalSave} disabled={isSaving} className={`mt-8 w-full bg-[#E04E1B] hover:bg-red-700`}>
                {isSaving ? (
                    <span className="flex items-center justify-center"><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div> COMMITTING ALL STAGED CHANGES...</span>
                ) : <><ShieldCheck className='w-5 h-5 mr-2'/> Finalize & Write All Staged Changes to Database</>}
            </Button>
        </>
    );
};

export default function AdminDataMaintenanceScreen({ navigate }) {
    const { metadata, isLoading: isMetadataLoading, db, updateGlobalMetadata } = useAppServices();
    
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [password, setPassword] = useState('');
    const [loginError, setLoginError] = useState(null);

    const handleLogin = (e) => {
        e.preventDefault();
        if (password === PASSWORD) {
            setIsLoggedIn(true);
            setLoginError(null);
        } else {
            setLoginError('Invalid Administrator Password.');
            setPassword('');
        }
    };
    
    // --- PROTECTION SCREEN ---
    if (!isLoggedIn) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
                <Card title="Administrator Access Required" icon={Lock} accent='ORANGE' className='w-full max-w-md text-center'>
                    <p className='text-gray-700 mb-4'>Enter the maintenance password to access global configuration data.</p>
                    <form onSubmit={handleLogin} className='space-y-4'>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => {setPassword(e.target.value); setLoginError(null);}}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-[#E04E1B] focus:border-[#E04E1B] text-gray-800"
                            placeholder="Maintenance Password"
                        />
                        {loginError && <p className='text-sm text-red-500 font-semibold flex items-center justify-center'><AlertTriangle className='w-4 h-4 mr-1'/> {loginError}</p>}
                        <Button type="submit" className='w-full bg-[#E04E1B] hover:bg-red-700'>
                            <CornerRightUp className='w-5 h-5 mr-2'/> Unlock Maintenance Tools
                        </Button>
                        <Button onClick={() => navigate('app-settings')} variant='outline' className='w-full mt-2'>
                             <ArrowLeft className='w-5 h-5 mr-2'/> Return to App Settings
                        </Button>
                    </form>
                </Card>
            </div>
        );
    }
    
    // --- LOADING/MAIN SCREEN ---
    if (isMetadataLoading) {
        return (
            <div className="p-8 min-h-screen flex items-center justify-center" style={{ background: COLORS.LIGHT_GRAY }}>
                <div className="flex flex-col items-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#47A88D] mb-3"></div>
                    <p className="text-[#47A88D] font-medium">Loading Global Metadata...</p>
                </div>
            </div>
        );
    }

    // MAIN EDITOR RENDER
    return (
        <div className="p-6 md:p-10 min-h-screen" style={{ background: COLORS.BG }}>
            <div className='flex items-center gap-4 border-b-2 pb-2 mb-8' style={{borderColor: COLORS.NAVY+'30'}}>
                <Cpu className='w-10 h-10' style={{color: COLORS.NAVY}}/>
                <h1 className="text-4xl font-extrabold" style={{ color: COLORS.NAVY }}>Global Data Maintenance Hub</h1>
            </div>
            <p className="text-lg text-gray-600 mb-8 max-w-3xl">Admin Tools: Directly manage all non-user application data (tiers, catalogs) stored in the Firebase collection **`metadata`**.</p>
            
            <GlobalDataEditor 
                globalMetadata={metadata} 
                updateGlobalMetadata={updateGlobalMetadata} 
                db={db}
                navigate={navigate}
            />
        </div>
    );
}
