// src/components/screens/AdminDataMaintenance.jsx

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAppServices } from '../../services/useAppServices.jsx';
import { ArrowLeft, Cpu, Lock, CheckCircle, AlertTriangle, CornerRightUp, Settings, BarChart3, TrendingUp, Download, Code } from 'lucide-react';

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

const Card = ({ children, title, icon: Icon, className = '', accent = 'NAVY' }) => {
    const accentColor = COLORS[accent] || COLORS.NAVY;
    return (
        <div
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
        </div>
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

// --- DATA EDITOR COMPONENT ---
const GlobalDataEditor = ({ globalMetadata, updateGlobalMetadata, db, navigate }) => {
    
    // Convert object to pretty JSON string for display/editing
    const initialJson = useMemo(() => {
        try {
            return JSON.stringify(globalMetadata, null, 2);
        } catch {
            return JSON.stringify({});
        }
    }, [globalMetadata]);
    
    const [jsonText, setJsonText] = useState(initialJson);
    const [isSaving, setIsSaving] = useState(false);
    const [status, setStatus] = useState(null); // null, 'success', 'error'

    // Update internal state if the original metadata changes (e.g., initial load completes)
    useEffect(() => {
        setJsonText(initialJson);
    }, [initialJson]);

    const handleSave = async () => {
        setIsSaving(true);
        setStatus(null);
        let parsedData;

        try {
            // 1. Validate and parse JSON
            parsedData = JSON.parse(jsonText);
        } catch (e) {
            setStatus({ type: 'error', message: `Invalid JSON format: ${e.message}` });
            setIsSaving(false);
            return;
        }

        try {
            // 2. Write the new object back to Firestore
            const success = await updateGlobalMetadata(db, parsedData);

            if (success) {
                setStatus({ type: 'success', message: 'Global Configuration saved successfully! Changes will appear shortly.' });
            } else {
                setStatus({ type: 'error', message: 'Database write failed. Check console logs.' });
            }
        } catch (e) {
            setStatus({ type: 'error', message: `Critical error during save: ${e.message}` });
        } finally {
            setIsSaving(false);
        }
    };
    
    const isJsonValid = useMemo(() => {
        try {
            JSON.parse(jsonText);
            return true;
        } catch (e) {
            return false;
        }
    }, [jsonText]);

    return (
        <Card title="Global Configuration Editor (metadata/config)" icon={Code} accent='NAVY' className='mt-8'>
            <p className='text-sm text-gray-700 mb-4 border-l-4 pl-3' style={{ borderColor: COLORS.ORANGE }}>
                **DANGER ZONE:** This controls the global data for the entire application (tiers, content catalogs, etc.). Edits must be valid JSON to avoid breaking the app.
            </p>
            <textarea
                value={jsonText}
                onChange={(e) => setJsonText(e.target.value)}
                className="w-full p-4 border border-gray-300 rounded-lg focus:ring-[#E04E1B] focus:border-[#E04E1B] h-[500px] font-mono text-sm resize-none"
                disabled={isSaving}
            />

            {status && (
                <div className={`mt-4 p-3 rounded-lg font-semibold flex items-center gap-2 ${
                    status.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                    {status.type === 'success' ? <CheckCircle className='w-5 h-5'/> : <AlertTriangle className='w-5 h-5'/>}
                    {status.message}
                </div>
            )}

            <Button onClick={handleSave} disabled={isSaving || !isJsonValid} className={`mt-4 w-full ${!isJsonValid ? 'bg-gray-500' : 'bg-[#E04E1B] hover:bg-red-700'}`}>
                {isSaving ? (
                    <span className="flex items-center justify-center"><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div> Saving Configuration...</span>
                ) : <><TrendingUp className='w-5 h-5 mr-2'/> Save Global Config</>}
            </Button>
            
            {!isJsonValid && <p className='text-xs text-red-500 mt-2'>* Cannot save: Please fix the JSON syntax errors in the editor above.</p>}

            <Button onClick={() => navigate('app-settings')} variant='outline' className='mt-4 w-full'>
                <ArrowLeft className='w-5 h-5 mr-2'/> Back to App Settings
            </Button>
        </Card>
    );
};

// --- MAIN ROUTER ---
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
            <p className="text-lg text-gray-600 mb-8 max-w-3xl">Admin Tools: Directly manage all non-user application data (tiers, catalogs, mock activities) stored in the Firebase collection **`metadata`**.</p>
            
            <GlobalDataEditor 
                globalMetadata={metadata} 
                updateGlobalMetadata={updateGlobalMetadata} 
                db={db}
                navigate={navigate}
            />
        </div>
    );
}
