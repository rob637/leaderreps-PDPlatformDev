// src/components/screens/DebugDataViewer.jsx

import React, { useMemo } from 'react'; // <-- Ensure useMemo is imported
import { useAppServices } from '../../services/useAppServices';
import { RefreshCw, Code } from 'lucide-react';

const NAVY = '#002E47';
const TEAL = '#47A88D';

const DebugDataViewer = ({ navigate }) => {
    const { metadata, isLoading, error, pdpData, commitmentData } = useAppServices();

    // CRITICAL FIX: Use useMemo to ensure the string is recalculated ONLY when metadata changes.
    // This forces the text area to update when the context loads the data.
    const formattedMetadata = useMemo(() => {
        if (!metadata || Object.keys(metadata).length === 0) {
            return "{}"; // Display empty object text if data is not yet available
        }
        return JSON.stringify(metadata, null, 2);
    }, [metadata]);
    
    const formattedPdpData = JSON.stringify(pdpData, null, 2);
    const formattedCommitmentData = JSON.stringify(commitmentData, null, 2);

    return (
        <div className="p-8 space-y-6 max-w-7xl mx-auto">
            <header className="flex justify-between items-center border-b pb-4">
                <h1 className="text-4xl font-extrabold" style={{ color: NAVY }}>
                    <Code size={32} className='inline mr-2 text-red-500' /> DEBUG: Raw Data Viewer
                </h1>
                <button 
                    onClick={() => navigate('app-settings')} 
                    className={`flex items-center text-sm font-semibold text-gray-500 hover:text-[${NAVY}] transition-colors`}
                >
                    Back to Settings
                </button>
            </header>

            {error && (
                <div className="p-4 bg-red-100 text-red-700 border border-red-500 rounded-lg">
                    <p className='font-bold'>Fetch Error:</p>
                    <pre className='text-xs whitespace-pre-wrap'>{error.message}</pre>
                </div>
            )}
            
            <div className='flex items-center text-lg font-bold'>
                 <RefreshCw className={`w-5 h-5 mr-2 ${isLoading ? 'animate-spin text-red-500' : 'text-green-500'}`} /> 
                 Status: <span className={`ml-2 ${isLoading ? 'text-red-500' : 'text-green-600'}`}>{isLoading ? 'Loading...' : 'Data Ready'}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Global Metadata */}
                <div className="md:col-span-2 space-y-2">
                    <h2 className='text-2xl font-bold' style={{ color: NAVY }}>Global Metadata (metadata/config + /reading_catalog)</h2>
                    <p className='text-sm text-gray-600'>This is the source for the **Admin Data Maintenance** screen.</p>
                    <textarea 
                        readOnly 
                        value={formattedMetadata} 
                        rows={30} 
                        className="w-full p-3 font-mono text-xs border-2 rounded-lg bg-white shadow-inner"
                    />
                </div>
                
                {/* User Data (For Comparison - Should be working) */}
                <div className="space-y-2">
                    <h2 className='text-xl font-bold' style={{ color: NAVY }}>Commitment Data (User)</h2>
                    <p className='text-sm text-gray-600'>Example of data successfully loading in other screens.</p>
                    <textarea 
                        readOnly 
                        value={formattedCommitmentData} 
                        rows={15} 
                        className="w-full p-3 font-mono text-xs border-2 rounded-lg bg-white shadow-inner"
                    />

                    <h2 className='text-xl font-bold' style={{ color: NAVY }}>PDP Data (User)</h2>
                    <textarea 
                        readOnly 
                        value={formattedPdpData} 
                        rows={10} 
                        className="w-full p-3 font-mono text-xs border-2 rounded-lg bg-white shadow-inner"
                    />
                </div>
            </div>
        </div>
    );
};

export default DebugDataViewer;