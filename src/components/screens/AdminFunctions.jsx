// src/components/screens/AdminFunctions.jsx (Updated with Admin Email Manager)

import React, { useState, useEffect, useMemo, useCallback } from 'react';
// --- Core Services & Context ---
import { useAppServices } from '../../services/useAppServices.jsx'; // cite: useAppServices.jsx

// --- Icons ---
// Added Mail, Plus, X
import { Shield, ToggleLeft, ToggleRight, Save, Loader, AlertTriangle, ArrowLeft, Key, Settings, Mail, Plus, X } from 'lucide-react'; 

/* =========================================================
   PALETTE & UI COMPONENTS (Standardized)
========================================================= */
// --- Primary Color Palette ---
const COLORS = { NAVY: '#002E47', TEAL: '#47A88D', BLUE: '#2563EB', ORANGE: '#E04E1B', GREEN: '#10B981', AMBER: '#F5A800', RED: '#E04E1B', LIGHT_GRAY: '#FCFCFA', OFF_WHITE: '#FFFFFF', SUBTLE: '#E5E7EB', TEXT: '#374151', MUTED: '#4B5355', PURPLE: '#7C3AED', BG: '#F9FAFB' }; // cite: App.jsx

// --- Standardized UI Components (Local Definition for standalone use) ---
const Button = ({ children, onClick, disabled = false, variant = 'primary', className = '', size = 'md', ...rest }) => { /* ... Re-use definition ... */
    let baseStyle = `inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-4 disabled:opacity-50 disabled:cursor-not-allowed`;
    if (size === 'sm') baseStyle += ' px-4 py-2 text-sm'; else if (size === 'lg') baseStyle += ' px-8 py-4 text-lg'; else baseStyle += ' px-6 py-3 text-base'; // Default 'md'
    if (variant === 'primary') baseStyle += ` bg-[${COLORS.TEAL}] text-white shadow-lg hover:bg-[#349881] focus:ring-[${COLORS.TEAL}]/50`;
    else if (variant === 'secondary') baseStyle += ` bg-[${COLORS.ORANGE}] text-white shadow-lg hover:bg-[#C312] focus:ring-[${COLORS.ORANGE}]/50`;
    else if (variant === 'outline') baseStyle += ` bg-[${COLORS.OFF_WHITE}] text-[${COLORS.TEAL}] border-2 border-[${COLORS.TEAL}] shadow-md hover:bg-[${COLORS.TEAL}]/10 focus:ring-[${COLORS.TEAL}]/50`;
    else if (variant === 'nav-back') baseStyle += ` bg-white text-gray-700 border border-gray-300 shadow-sm hover:bg-gray-100 focus:ring-gray-300/50 px-4 py-2 text-sm`;
    else if (variant === 'ghost') baseStyle += ` bg-transparent text-gray-600 hover:bg-gray-100 focus:ring-gray-300/50 px-3 py-1.5 text-sm`;
     // Added specific variants for this admin tool
    else if (variant === 'action-write') baseStyle += ` bg-green-600 text-white shadow-md hover:bg-green-700 focus:ring-green-500/50 px-4 py-2 text-sm`;
    else if (variant === 'action-danger') baseStyle += ` bg-red-600 text-white shadow-md hover:bg-red-700 focus:ring-red-500/50 px-4 py-2 text-sm`;
    if (disabled) baseStyle += ' bg-gray-300 text-gray-500 shadow-inner border-transparent hover:bg-gray-300';
    return (<button {...rest} onClick={onClick} disabled={disabled} className={`${baseStyle} ${className}`}>{children}</button>);
};
// --- Standardized Card Component (Local Definition for standalone use) ---
const Card = ({ children, title, icon: Icon, className = '', accent = 'NAVY' }) => { /* ... Re-use definition ... */
    const accentColor = COLORS[accent] || COLORS.NAVY;
    return ( <div className={`relative p-6 rounded-2xl border-2 shadow-xl ${className}`} style={{ background: 'linear-gradient(180deg,#FFFFFF, #FCFCFA)', borderColor: COLORS.SUBTLE, color: COLORS.NAVY }}> <span style={{ position:'absolute', top:0, left:0, right:0, height:6, background: accentColor, borderTopLeftRadius:14, borderTopRightRadius:14 }} /> {Icon && title && ( <div className="flex items-center gap-3 mb-4"> <div className="w-10 h-10 rounded-lg flex items-center justify-center border flex-shrink-0" style={{ borderColor: COLORS.SUBTLE, background: COLORS.LIGHT_GRAY }}> <Icon className="w-5 h-5" style={{ color: accentColor }} /> </div> <h2 className="text-xl font-extrabold" style={{ color: COLORS.NAVY }}>{title}</h2> </div> )} {!Icon && title && <h2 className="text-xl font-extrapold mb-4 border-b pb-2" style={{ color: COLORS.NAVY, borderColor: COLORS.SUBTLE }}>{title}</h2>} <div>{children}</div> </div> );
};

/* =========================================================
   NEW: AdminEmailManager Component
========================================================= */
const AdminEmailManager = ({ initialEmails, updateGlobalMetadata }) => {
    // Treat initialEmails as the source of truth, but manage local edits
    const [emails, setEmails] = useState(initialEmails || []);
    const [newEmail, setNewEmail] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState('');
    const [hasChanges, setHasChanges] = useState(false);

    // Sync emails from context only if context changes and we're not currently saving
    useEffect(() => {
        const initialString = JSON.stringify(initialEmails || []);
        const localString = JSON.stringify(emails);
        
        // Only re-sync if the initial data has changed externally AND we aren't displaying a local, successful save status
        // The check for hasChanges prevents re-syncing if the user simply hasn't edited anything yet
        if (initialString !== localString && !isSaving && !saveStatus.startsWith('✅')) {
            // Check if the local state has actual *unsaved* changes. If it does, a re-sync would overwrite them.
            // For now, we trust the external source (Firestore) is the single source of truth and must overwrite local edits.
            setEmails(initialEmails || []);
            setHasChanges(false);
        }
    }, [initialEmails]);
    
    // Check for changes against the initial value
    useEffect(() => {
        const initialString = JSON.stringify(initialEmails || []);
        const localString = JSON.stringify(emails);
        setHasChanges(initialString !== localString);
    }, [emails, initialEmails]);
    
    // Handler to add a new email
    const handleAddEmail = () => {
        const emailToAdd = newEmail.trim().toLowerCase();
        if (!emailToAdd || !emailToAdd.includes('@')) {
            alert('Please enter a valid email address.');
            return;
        }
        if (emails.includes(emailToAdd)) {
            alert('This email is already an admin.');
            return;
        }
        
        setEmails(prev => [...prev, emailToAdd]); // Use functional update
        setNewEmail('');
        setSaveStatus('');
    };

    // Handler to remove an email
    const handleRemoveEmail = (emailToRemove) => {
        setEmails(prev => prev.filter(email => email !== emailToRemove)); // Use functional update
        setSaveStatus('');
    };

    // Handler to save changes to Firestore
    const handleSaveChanges = async () => {
        setIsSaving(true);
        setSaveStatus('');
        
        // Finalize data structure
        const dataToSave = {
            adminemails: emails
        };

        try {
            // Use the updateGlobalMetadata function provided by context
            await updateGlobalMetadata(dataToSave, { 
                source: 'AdminEmailManager',
                merge: true
            });
            setSaveStatus('✅ Admin emails updated successfully!');
            // The useEffect syncs the local state after the context update.
        } catch (error) {
            console.error("[AdminEmailManager] Failed to save admin emails:", error);
            setSaveStatus(`❌ Error saving emails: ${error.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Card title="Administrator List" icon={Mail} accent="BLUE">
            <p className="text-sm text-gray-600 mb-4">Emails listed here are granted full access to Admin Functions and all hidden features.</p>
            
            {/* Current Admin List */}
            <div className="bg-gray-50 p-4 rounded-lg border space-y-2 mb-4 max-h-48 overflow-y-auto">
                {emails.length === 0 && (
                    <p className="text-sm text-gray-500 italic">No admin emails currently set.</p>
                )}
                {emails.map((email, index) => (
                    <div key={email} className="flex items-center justify-between p-2 rounded-md bg-white border">
                        <span className="text-sm font-medium text-gray-800 break-all">{email}</span>
                        <Button 
                            onClick={() => handleRemoveEmail(email)} 
                            variant="ghost" 
                            size="sm"
                            className="text-red-500 hover:bg-red-50"
                            disabled={isSaving}
                        >
                            <X size={14} />
                        </Button>
                    </div>
                ))}
            </div>

            {/* Add New Email Input */}
            <div className="flex gap-2 mb-6">
                <input
                    type="email"
                    placeholder="new.admin@email.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddEmail()}
                    className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={isSaving}
                />
                <Button onClick={handleAddEmail} variant="primary" size="sm" disabled={isSaving || !newEmail.trim().includes('@')}>
                    <Plus size={16} /> Add
                </Button>
            </div>

            {/* Save Changes Button & Status */}
            <div className="pt-4 border-t border-gray-200 flex items-center gap-4">
                <Button 
                    onClick={handleSaveChanges} 
                    disabled={isSaving || !hasChanges} 
                    variant="action-write" 
                    size="md"
                >
                    {isSaving ? <Loader className="w-5 h-5 mr-2 animate-spin"/> : <Save className="w-5 h-5 mr-2" />}
                    {isSaving ? 'Saving List...' : 'Save Admin List'}
                </Button>
                {/* Display Save Status */}
                {saveStatus && (
                    <span className={`text-sm font-semibold ${saveStatus.includes('Error') ? 'text-red-600' : 'text-green-600'}`}>
                        {saveStatus}
                    </span>
                )}
            </div>
            <p className="text-xs text-gray-500 mt-2 italic">
                    You must refresh the app to take effect after saving changes.
            </p>
        </Card>
    );
};


/* =========================================================
   AdminFunctionsScreen Component (MODIFIED)
========================================================= */

/**
 * AdminFunctionsScreen Component
 * Provides administrators with tools to manage application features,
 * protected by a simple password prompt.
 */
const AdminFunctionsScreen = () => {
    // --- Consume Services ---
    const {
        navigate, isAdmin, ADMIN_PASSWORD, // Get admin status, password constant, and navigation // cite: useAppServices.jsx
        featureFlags: initialFlags, // Get initial feature flags // cite: useAppServices.jsx
        metadata, // Access the global metadata object for adminemails <-- NEW
        updateGlobalMetadata, // Function to save changes to Firestore // cite: useAppServices.jsx
        isLoading: isAppLoading // App loading state
    } = useAppServices();

    // --- Local State ---
    const [isAuthenticated, setIsAuthenticated] = useState(false); // Controls access to admin functions
    const [passwordInput, setPasswordInput] = useState(''); // Input for password check
    const [authError, setAuthError] = useState(''); // Error message for password check
    // State to hold the feature flags being edited
    const [currentFlags, setCurrentFlags] = useState(() => initialFlags || {}); // cite: useAppServices.jsx
    const [isSaving, setIsSaving] = useState(false); // Loading state for saving flags
    const [saveStatus, setSaveStatus] = useState(''); // Status message after save attempt

    // Extract admin emails from metadata
    const adminEmails = useMemo(() => {
        // Ensure metadata is available and adminemails is an array
        // Fallback to empty array if not found
        const emails = metadata?.adminemails;
        return Array.isArray(emails) ? emails : [];
    }, [metadata]);

    // --- Effect to redirect if not admin ---
    useEffect(() => {
        // Redirect non-admins immediately after checking context
        if (!isAppLoading && !isAdmin) {
            console.warn("[AdminFunctions] Non-admin user detected. Redirecting to dashboard.");
            navigate('dashboard'); // Redirect to a safe default screen // cite: useAppServices.jsx
        }
    }, [isAdmin, isAppLoading, navigate]); // Dependencies

    // --- Effect to update local flags if context flags change ---
    useEffect(() => {
        // Only update if the screen is authenticated and context flags are available.
        if (!isAuthenticated || !initialFlags) return;

        const initialFlagsString = JSON.stringify(initialFlags);
        const currentFlagsString = JSON.stringify(currentFlags);

        // Check if context flags are different from local flags.
        if (initialFlagsString !== currentFlagsString) {
            
            // If a save was *just* successful, assume the local state is ahead of the context 
            // and temporarily wait for the next external context update to reflect the change.
            if (saveStatus.startsWith('✅')) {
                 console.log("[AdminFunctions] Successful save detected. Skipping immediate local state sync with context (Firestore latency expected).");
                 return;
            }

            console.log("[AdminFunctions] Context feature flags updated or initial load finished. Syncing local state.");
            setCurrentFlags(initialFlags);
        }
    }, [initialFlags, isAuthenticated, saveStatus]); // Dependency on initialFlags and saveStatus

    // --- Handlers (Password, ToggleFlag, SaveChanges are unchanged) ---
    const handlePasswordCheck = () => {
        setAuthError(''); // Clear previous error
        if (passwordInput === ADMIN_PASSWORD) { // cite: useAppServices.jsx (provides ADMIN_PASSWORD)
            console.log("[AdminFunctions] Admin password correct. Granting access.");
            setIsAuthenticated(true); // Grant access
        } else {
            console.warn("[AdminFunctions] Incorrect admin password entered.");
            setAuthError('Incorrect password. Please try again.'); // Show error
            setPasswordInput(''); // Clear input on failure
        }
    };

    const handleToggleFlag = (flagName) => {
        setCurrentFlags(prevFlags => {
            const currentVal = prevFlags[flagName] !== false; 
            const updatedFlags = { ...prevFlags, [flagName]: !currentVal };
            console.log(`[AdminFunctions] Toggling flag '${flagName}' to ${!currentVal}. New local state:`, updatedFlags);
            return updatedFlags;
        });
        setSaveStatus(''); // Clear save status when flags are changed
    };

    const handleSaveChanges = async () => {
        setIsSaving(true);
        setSaveStatus(''); // Clear previous status
        console.log("[AdminFunctions] Saving feature flags:", currentFlags);

        try {
            await updateGlobalMetadata({ featureFlags: currentFlags }, { // cite: useAppServices.jsx
                source: 'AdminFunctionsScreen', // Identify the source of the update
                merge: true // CRITICAL FIX: Ensure merge is true for safe global updates
            });
            console.log("[AdminFunctions] Feature flags saved successfully.");
            setSaveStatus('✅ Flags updated successfully!');
        } catch (error) {
            console.error("[AdminFunctions] Failed to save feature flags:", error);
            setSaveStatus(`❌ Error saving flags: ${error.message}`);
        } finally {
            setIsSaving(false); // Reset loading state
        }
    };

    // --- Render Logic (Same as original, but now includes AdminEmailManager) ---
    if (isAppLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4" style={{ background: COLORS.BG }}>
                <div className="flex items-center justify-center p-8 text-center text-gray-500 bg-gray-50 rounded-lg min-h-[100px]">
                    <Loader className="w-5 h-5 animate-spin mr-2" style={{ color: COLORS.TEAL }} />
                    Loading Admin Functions...
                </div>
            </div>
        );
    }
    
    if (!isAdmin) {
         return null;
    }

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4" style={{ background: COLORS.BG }}>
                <Card title="Admin Access Required" icon={Key} accent="ORANGE" className="max-w-md w-full text-center">
                    <p className="text-sm text-gray-600 mb-4">Enter the administrator password to manage application features.</p>
                    <form onSubmit={(e) => { e.preventDefault(); handlePasswordCheck(); }} className="space-y-4">
                        <input
                            type="password"
                            value={passwordInput}
                            onChange={(e) => setPasswordInput(e.target.value)}
                            className={`w-full p-3 border rounded-lg text-center focus:ring-2 ${authError ? 'border-red-400 ring-red-300' : 'border-gray-300 ring-[#E04E1B]'}`} // Style based on error
                            placeholder="Admin Password"
                            aria-label="Admin Password"
                            required
                        />
                        {authError && <p className="text-xs text-red-600">{authError}</p>}
                        <Button type="submit" variant="secondary" size="md" className="w-full">
                            Authenticate
                        </Button>
                    </form>
                    <Button onClick={() => navigate('app-settings')} variant="outline" size="sm" className="mt-6 w-full">
                         <ArrowLeft className="w-4 h-4 mr-2" /> Back to Settings
                    </Button>
                </Card>
            </div>
        );
    }

    return (
        <div className="p-6 md:p-8 lg:p-10 min-h-screen" style={{ background: COLORS.BG }}>
            {/* Header */}
            <header className="mb-8">
                <h1 className="text-3xl md:text-4xl font-extrabold mb-2 flex items-center gap-3" style={{ color: COLORS.NAVY }}>
                    <Shield className="w-8 h-8" style={{ color: COLORS.PURPLE }} /> Admin Functions
                </h1>
                <p className="text-lg text-gray-700">Manage application features and settings.</p>
            </header>

             {/* Back Button */}
            <Button onClick={() => navigate('app-settings')} variant="nav-back" className="mb-6">
                <ArrowLeft className="w-5 h-5 mr-2" /> Back to App Settings
            </Button>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* 1. Admin Email Manager <-- NEW CARD */}
                <AdminEmailManager
                    initialEmails={adminEmails}
                    updateGlobalMetadata={updateGlobalMetadata}
                />

                {/* 2. Feature Flags Management Card */}
                <Card title="Feature Flags" icon={Settings} accent="PURPLE">
                    <p className="text-sm text-gray-600 mb-6">Enable or disable application features globally. Changes affect all users on next load.</p>

                   {/* List of Toggles */}
                    <div className="space-y-4">
                        {[
                            'enableLabs',
                            'enableLabsAdvanced',
                            'enableCommunity',
                            'enablePlanningHub',
                            'enableRoiReport',
                            'enableCourses',
                            'enableVideos',
                            'enableReadings',
                            'enableDevPlan',
                            'enableQuickStart',
                            'enableDailyPractice',
                        ]
                         .sort() 
                         .map((flagName) => {
                            const isEnabled = currentFlags[flagName]; 

                            return (
                                <div key={flagName} className="flex items-center justify-between p-3 border rounded-lg bg-white shadow-sm">
                                    <span className="text-sm font-medium text-gray-800">{flagName.replace('enable', '').replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim()}</span>
                                    
                                    <button
                                        onClick={() => handleToggleFlag(flagName)}
                                        disabled={isSaving}
                                        className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-semibold border transition-colors ${
                                            isEnabled !== false ? `bg-green-100 border-green-300 text-green-700` : `bg-red-100 border-red-300 text-red-700`
                                        }`}
                                        aria-pressed={isEnabled !== false} 
                                        aria-label={`Toggle ${flagName}`}
                                    >
                                        {isEnabled !== false ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                                        {isEnabled !== false ? 'Enabled' : 'Disabled'}
                                    </button>
                                </div>
                            );
                        })}
                    </div>

                    {/* Save Changes Button & Status */}
                    <div className="mt-6 pt-4 border-t border-gray-200 flex items-center gap-4">
                        <Button onClick={handleSaveChanges} disabled={isSaving} variant="action-write" size="md">
                            {isSaving ? <Loader className="w-5 h-5 mr-2 animate-spin"/> : <Save className="w-5 h-5 mr-2" />}
                            {isSaving ? 'Saving Changes...' : 'Save Feature Flags'}
                        </Button>
                        {saveStatus && (
                            <span className={`text-sm font-semibold ${saveStatus.includes('Error') ? 'text-red-600' : 'text-green-600'}`}>
                                {saveStatus}
                            </span>
                        )}
                    </div>

                    <p className="text-xs text-gray-500 mt-4 italic">
                        Feature flags are loaded from <code>metadata/config</code> document in Firestore.
                    </p>
                </Card>
            </div>

             {/* Data Manager Link Card */}
             <Card title="Database Management" icon={Key} accent="NAVY" className="mt-6">
                <p className="text-sm text-gray-600 mb-4">Direct access to the Firestore Data Manager to view and edit document/collection data.</p>
                <Button onClick={() => navigate('data-maintenance')} variant="outline" size="md">
                    <Shield className="w-5 h-5 mr-2" /> Open Data Manager
                </Button>
             </Card>

        </div>
    );
};

// Export the component
export default AdminFunctionsScreen;