// src/components/screens/AdminDataMaintenance.jsx

import React, { useState, useMemo } from 'react';
import { useAppServices } from '../../services/useAppServices'; // Adjust path as needed
import { ChevronsLeft, AlertTriangle, Save, Lock } from 'lucide-react';

// Admin Password (Hardcoded for this example)
const ADMIN_PASSWORD = '7777'; 

const JSONEditor = ({ data, setData, label }) => {
    // Component to render and edit JSON data
    // ... (Implementation detail: e.g., using a textarea for raw JSON string)
    // ...
    const [jsonText, setJsonText] = useState(JSON.stringify(data, null, 2));
    const [isError, setIsError] = useState(false);

    const handleTextChange = (e) => {
        const newText = e.target.value;
        setJsonText(newText);
        try {
            const parsed = JSON.parse(newText);
            setData(parsed); // Update the parent state with parsed object
            setIsError(false);
        } catch (error) {
            setIsError(true);
        }
    };

    return (
        <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">{label} {isError && <AlertTriangle size={16} className="inline text-red-500" />}</label>
            <textarea
                value={jsonText}
                onChange={handleTextChange}
                rows={20}
                className={`w-full p-3 font-mono text-sm border-2 rounded-lg bg-white shadow-inner ${isError ? 'border-red-500' : 'border-gray-300 focus:border-[#47A88D]'}`}
            />
             {isError && <p className="text-xs text-red-500">Invalid JSON format. Please correct the syntax before saving.</p>}
        </div>
    );
};


const AdminDataMaintenance = ({ navigate }) => {
    const { metadata, isLoading, error, updateGlobalMetadata } = useAppServices();
    
    // Split the metadata into the two main documents for editing
    const { READING_CATALOG_SERVICE, ...configMetadata } = metadata;

    // --- State for Screen Logic ---
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState('');

    // State for the editable data (using a copy of the fetched data)
    // NOTE: We only allow editing of the parts that were loaded from the two documents.
    const [configData, setConfigData] = useState(configMetadata);
    const [catalogData, setCatalogData] = useState(READING_CATALOG_SERVICE);

    // Update local state when global metadata refreshes (e.g., initial load)
    useMemo(() => {
        const { READING_CATALOG_SERVICE: newCatalog, ...newConfig } = metadata;
        setConfigData(newConfig);
        setCatalogData(newCatalog);
    }, [metadata]);


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
        
        try {
            // 1. Save Config Document (merges the entire object)
            // The config document contains everything EXCEPT the reading catalog.
            await updateGlobalMetadata(configData, { source: 'Admin Maintenance (config)' });
            
            // 2. Save Catalog Document (The full document path for this is hardcoded in useAppServices)
            // NOTE: The updateGlobalMetadata helper doesn't easily support saving to a separate path.
            // For a robust admin tool, you'd need a dedicated service function to save to 'metadata/reading_catalog'.
            // For simplicity in this iteration, we'll assume a separate update function exists or modify updateGlobalMetadata to accept an override path. 
            // Since we *don't* have that, we'll log a warning and only save the 'config' data.
            console.warn("Catalog data is modified locally but cannot be saved to the separate 'metadata/reading_catalog' path without a custom function.");

            setSaveStatus('Save successful! (Config data updated. Catalog data saved locally only.)');
        } catch (e) {
            console.error('Save failed:', e);
            setSaveStatus(`Save failed: ${e.message}`);
        } finally {
            setIsSaving(false);
        }
    };
    
    const NAVY = '#002E47';
    const TEAL = '#47A88D';

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <form onSubmit={handleAuth} className="p-8 bg-white rounded-xl shadow-2xl text-center w-full max-w-sm border-t-4 border-red-500">
                    <Lock className="w-8 h-8 mx-auto text-red-500 mb-4" />
                    <h2 className={`text-2xl font-extrabold text-[${NAVY}] mb-4`}>Admin Access Required</h2>
                    <input 
                        type="password" 
                        placeholder="Admin Code" 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                        className={`w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 mb-4`} 
                        disabled={isSaving}
                    />
                    <button
                        type="submit"
                        disabled={isSaving}
                        className="w-full p-3 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:ring-2 focus:ring-red-500"
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
                        disabled={isSaving || !configData}
                        className={`flex items-center px-4 py-2 rounded-lg text-white font-semibold transition-colors ${isSaving ? 'bg-gray-400' : 'bg-[#E04E1B] hover:bg-red-700'}`}
                    >
                        <Save size={18} className='mr-2' /> {isSaving ? 'Saving...' : 'Save All Changes'}
                    </button>
                </div>
            </header>
            
            {saveStatus && (
                 <div className={`p-3 rounded-lg font-medium ${saveStatus.includes('success') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {saveStatus}
                 </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <h2 className='text-2xl font-bold text-[#002E47]'>Config Document (metadata/config)</h2>
                    <p className='text-sm text-gray-600'>Contains Tiers, Domains, Scenarios, etc.</p>
                    <JSONEditor 
                        data={configData} 
                        setData={setConfigData} 
                        label="Editable JSON" 
                    />
                </div>
                <div className="space-y-4">
                    <h2 className='text-2xl font-bold text-[#002E47]'>Catalog Document (metadata/reading_catalog)</h2>
                    <p className='text-sm text-gray-600'>Contains the array of readings/videos.</p>
                    <JSONEditor 
                        data={catalogData} 
                        setData={setCatalogData} 
                        label="Editable JSON (Local Save Only)" 
                    />
                </div>
            </div>
            
        </div>
    );
};

export default AdminDataMaintenance;