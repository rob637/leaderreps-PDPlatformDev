// src/components/screens/AdminDataMaintenance.jsx (Final Fix)

import React, { useState, useMemo, useEffect, useRef } from 'react'; // <-- Added useRef
// Path assumes this file is screens/AdminDataMaintenance.jsx and useAppServices is in services/
import { useAppServices } from '../../services/useAppServices'; 
import { ChevronsLeft, AlertTriangle, Save, Lock, Cpu, RotateCcw } from 'lucide-react';

// Admin Password 
const ADMIN_PASSWORD = '7777'; 
const NAVY = '#002E47';
const TEAL = '#47A88D';

// ... (JSONEditor component remains the same) ...

const JSONEditor = ({ data, setData, label, isSaving, setModified }) => {
    // Stringifies the current object data for the editor
    const initialJsonText = useMemo(() => JSON.stringify(data, null, 2), [data]);
    const [jsonText, setJsonText] = useState(initialJsonText);
    const [isError, setIsError] = useState(false);

    // Reset local state when external data changes (e.g., initial load or manual reset)
    useEffect(() => {
        setJsonText(initialJsonText);
        setIsError(false);
    }, [initialJsonText]);
    // ... (handleTextChange and handleReset remain the same)
    const handleTextChange = (e) => {
        const newText = e.target.value;
        setJsonText(newText);
        setModified(true); // Mark as modified
        
        try {
            const parsed = JSON.parse(newText);
            setData(parsed); // Update the parent state with parsed object
            setIsError(false);
        } catch (error) {
            setIsError(true);
        }
    };

    const handleReset = () => {
        setJsonText(initialJsonText);
        // Ensure reset doesn't break if initialJsonText parsing fails
        try {
             setData(JSON.parse(initialJsonText)); // Reset parent state
        } catch (e) {
             console.error("Reset failed: Could not parse initial JSON text.");
        }
        setIsError(false);
        setModified(false);
    };


    return (
        <div className="space-y-2">
            <div className='flex justify-between items-center'>
                <label className="block text-sm font-medium text-gray-700">{label}</label>
                <button onClick={handleReset} disabled={isSaving} className='flex items-center text-xs text-gray-500 hover:text-red-500 transition-colors'>
                    <RotateCcw size={14} className='mr-1'/> Revert Changes
                </button>
            </div>
            <textarea
                value={jsonText}
                onChange={handleTextChange}
                rows={20}
                disabled={isSaving}
                className={`w-full p-3 font-mono text-sm border-2 rounded-lg bg-white shadow-inner ${isError ? 'border-red-500' : 'border-gray-300 focus:border-[${TEAL}]'}`}
            />
             {isError && <p className="text-xs text-red-500">⚠️ Invalid JSON format. Please correct the syntax before saving.</p>}
        </div>
    );
};


const AdminDataMaintenance = ({ navigate }) => {
    // Destructure db directly from the context hook
    const { metadata, isLoading, error, updateGlobalMetadata, db } = useAppServices(); 
    
    // --- State for Screen Logic ---
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState('');
    
    // Initialize local state with empty objects
    const [configData, setConfigData] = useState({});
    const [catalogData, setCatalogData] = useState({});
    
    // Track if either editor has been modified
    const [isConfigModified, setIsConfigModified] = useState(false);
    const [isCatalogModified, setIsCatalogModified] = useState(false);
    
    // NEW: Ref to ensure we only run the initial load once, regardless of modification state
    const isDataPopulated = useRef(false);


    // FIX 2: Use useEffect to populate local state ONLY when new metadata arrives
    useEffect(() => {
        // Only run if metadata has keys AND it hasn't been populated yet
        if (Object.keys(metadata).length > 0 && !isDataPopulated.current) {
            
            // Split the fetched metadata into the two main documents for editing
            const { READING_CATALOG_SERVICE = {}, ...configMetadata } = metadata;
            
            setConfigData(configMetadata);
            setCatalogData(READING_CATALOG_SERVICE);
            
            // Set the flag to true so this only runs once for initial population
            isDataPopulated.current = true;
        }
        
        // Secondary use: If the user saves successfully, this hook will run again.
        // We need to ensure modification flags are reset when metadata updates from the save.
        if (metadata && Object.keys(metadata).length > 0 && !isLoading) {
             setIsConfigModified(false);
             setIsCatalogModified(false);
        }
        
    }, [metadata, isLoading]); // Depend on the fetched metadata object and loading status


    // --- Handlers ---
    const handleAuth = (e) => {
        e.preventDefault();
        if (password === ADMIN_PASSWORD) {
            setIsAuthenticated(true);
            setSaveStatus('');
        } else {
            setSaveStatus('Incorrect password.');
            setPassword('');
        }
    };

    const handleSave = async () => {
        setSaveStatus('');
        setIsSaving(true);
        const results = [];
        
        // Ensure JSON is valid before attempting to save
        if (!db) {
             setSaveStatus('❌ Save failed: Firestore database connection is missing.');
             setIsSaving(false);
             return;
        }

        try {
            // 1. Save Config Document (only if modified)
            if (isConfigModified) {
                console.log("Saving Config Document...");
                const configResult = await updateGlobalMetadata(
                    db, 
                    configData, 
                    { source: 'Admin Maintenance (config)', forceDocument: 'config' }
                );
                results.push(`Config Updated (${Object.keys(configResult).length} keys)`);
            }
            
            // 2. Save Catalog Document (only if modified)
            if (isCatalogModified) {
                 console.log("Saving Catalog Document...");
                 const catalogResult = await updateGlobalMetadata(
                    db, 
                    { READING_CATALOG_SERVICE: catalogData }, // Pass as an object with the key
                    { source: 'Admin Maintenance (catalog)', forceDocument: 'catalog' } // Force catalog write
                );
                results.push(`Catalog Updated (${Object.keys(catalogResult).length} keys)`);
            }

            if (results.length > 0) {
                 setSaveStatus(`✅ Save successful: ${results.join(' | ')}`);
                 // Note: The modification flags are now reset by the useEffect hook above
            } else {
                 setSaveStatus('Nothing to save. No changes detected.');
            }
            
        } catch (e) {
            console.error('Save failed:', e);
            setSaveStatus(`❌ Save failed: ${e.message}`);
        } finally {
            setIsSaving(false);
        }
    };
    
    const isSaveDisabled = isSaving || (!isConfigModified && !isCatalogModified);
    const hasError = error || saveStatus.startsWith('❌') || saveStatus.startsWith('⚠️');

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <form onSubmit={handleAuth} className="p-8 bg-white rounded-xl shadow-2xl text-center w-full max-w-sm border-t-4 border-red-500">
                    <Lock className="w-8 h-8 mx-auto text-red-500 mb-4" />
                    <h2 className={`text-2xl font-extrabold text-[${NAVY}] mb-4`}>Admin Access Required</h2>
                    <input 
                        type="password" 
                        placeholder="Admin Code (7777)" 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                        className={`w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 mb-4`} 
                        disabled={isSaving}
                    />
                    <button
                        type="submit"
                        disabled={isSaving}
                        className="w-full p-3 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:ring-2 focus:ring-red-500 font-semibold"
                    >
                        Authenticate
                    </button>
                    {saveStatus && (<p className='text-sm text-center font-medium mt-3 text-red-500'>{saveStatus}</p>)}
                </form>
            </div>
        );
    }
    
    // --- Authenticated View ---
    
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-4 border-gray-200 border-t-[#47A88D] mb-3"></div>
            </div>
        );
    }

    if (error) {
        return <div className="p-8 max-w-4xl mx-auto"><h1 className="text-3xl text-red-600">Error Loading Metadata</h1><pre>{error.message}</pre></div>;
    }

    return (
        <div className="p-8 space-y-8 max-w-6xl mx-auto">
            <header className="flex justify-between items-center border-b pb-4">
                <h1 className="text-4xl font-extrabold text-[#002E47] flex items-center gap-2">
                    Global Data Maintenance <Cpu size={32} className='text-[#47A88D]' />
                </h1>
                <div className='flex space-x-4'>
                    <button 
                        onClick={() => navigate('app-settings')} 
                        className={`flex items-center text-sm font-semibold text-gray-500 hover:text-[${NAVY}] transition-colors`}
                    >
                        <ChevronsLeft size={18} className='mr-1' /> Back to Settings
                    </button>
                    <button 
                        onClick={handleSave} 
                        disabled={isSaveDisabled}
                        className={`flex items-center px-4 py-2 rounded-lg text-white font-semibold transition-colors ${isSaveDisabled ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#E04E1B] hover:bg-red-700'}`}
                    >
                        <Save size={18} className='mr-2' /> {isSaving ? 'Saving...' : 'Save All Changes'}
                    </button>
                </div>
            </header>
            
            {saveStatus && (
                 <div className={`p-3 rounded-lg font-medium ${hasError ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                    {saveStatus}
                 </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className={`space-y-4 p-4 rounded-lg border-2 ${isConfigModified ? 'border-yellow-400 bg-yellow-50' : 'border-gray-200 bg-white'}`}>
                    <h2 className='text-2xl font-bold text-[#002E47]'>Config Document (metadata/config)</h2>
                    <p className='text-sm text-gray-600'>Contains Tiers, Domains, Scenarios, etc. {isConfigModified && <span className='font-semibold text-yellow-600'>(Modified)</span>}</p>
                    <JSONEditor 
                        data={configData} 
                        setData={setConfigData} 
                        label="Editable JSON" 
                        isSaving={isSaving}
                        setModified={setIsConfigModified}
                    />
                </div>
                <div className={`space-y-4 p-4 rounded-lg border-2 ${isCatalogModified ? 'border-yellow-400 bg-yellow-50' : 'border-gray-200 bg-white'}`}>
                    <h2 className='text-2xl font-bold text-[#002E47]'>Catalog Document (metadata/reading_catalog)</h2>
                    <p className='text-sm text-gray-600'>Contains the array of readings/videos. {isCatalogModified && <span className='font-semibold text-yellow-600'>(Modified)</span>}</p>
                    <JSONEditor 
                        data={catalogData} 
                        setData={setCatalogData} 
                        label="Editable JSON" 
                        isSaving={isSaving}
                        setModified={setIsCatalogModified}
                    />
                </div>
            </div>
            
        </div>
    );
};

export default AdminDataMaintenance;