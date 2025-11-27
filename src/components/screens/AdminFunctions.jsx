// src/components/screens/AdminFunctions.jsx

import React, { useState, useEffect, useMemo } from 'react';
import { useAppServices } from '../../services/useAppServices.jsx';
import { useNotifications } from '../../services/notificationService';
import { Shield, ToggleLeft, ToggleRight, Save, Loader, AlertTriangle, ArrowLeft, Key, Settings, Mail, Plus, X } from 'lucide-react';
import { Button, Card, WidgetRenderer } from '../ui';

const AdminEmailManager = ({ initialEmails, updateGlobalMetadata }) => {
    const [emails, setEmails] = useState(initialEmails || []);
    const [newEmail, setNewEmail] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState('');
    const [hasChanges, setHasChanges] = useState(false);

    useEffect(() => {
        const initialString = JSON.stringify(initialEmails || []);
        const localString = JSON.stringify(emails);
        
        if (initialString !== localString && !isSaving && !saveStatus.startsWith('✅')) {
            setEmails(initialEmails || []);
            setHasChanges(false);
        }
    }, [initialEmails, emails, isSaving, saveStatus]);
    
    useEffect(() => {
        const initialString = JSON.stringify(initialEmails || []);
        const localString = JSON.stringify(emails);
        setHasChanges(initialString !== localString);
    }, [emails, initialEmails]);
    
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
        
        setEmails(prev => [...prev, emailToAdd]);
        setNewEmail('');
        setSaveStatus('');
    };

    const handleRemoveEmail = (emailToRemove) => {
        setEmails(prev => prev.filter(email => email !== emailToRemove));
        setSaveStatus('');
    };

    const handleSaveChanges = async () => {
        setIsSaving(true);
        setSaveStatus('');
        
        const dataToSave = {
            adminemails: emails
        };

        try {
            await updateGlobalMetadata(dataToSave, {});
            setSaveStatus('✅ Admin emails updated successfully!');
        } catch (error) {
            console.error("[AdminEmailManager] Failed to save admin emails:", error);
            setSaveStatus(`❌ Error saving emails: ${error.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Card title="Administrator List" icon={Mail} accentColor="bg-corporate-navy">
            <p className="text-sm text-slate-600 mb-4">Emails listed here are granted full access to Admin Functions and all hidden features.</p>
            
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 mb-4 max-h-48 overflow-y-auto">
                {emails.length === 0 && (
                    <p className="text-sm text-slate-500 italic">No admin emails currently set.</p>
                )}
                {emails.map((email) => (
                    <div key={email} className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200 shadow-sm">
                        <span className="text-sm font-medium text-slate-800 break-all">{email}</span>
                        <Button 
                            onClick={() => handleRemoveEmail(email)} 
                            variant="ghost" 
                            size="sm"
                            className="text-red-500 hover:bg-red-50 hover:text-red-600"
                            disabled={isSaving}
                        >
                            <X size={14} />
                        </Button>
                    </div>
                ))}
            </div>

            <div className="flex gap-2 mb-6">
                <input
                    type="email"
                    placeholder="new.admin@email.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddEmail()}
                    className="flex-1 p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-corporate-teal focus:border-corporate-teal outline-none transition-all"
                    disabled={isSaving}
                />
                <Button onClick={handleAddEmail} variant="primary" size="sm" disabled={isSaving || !newEmail.trim().includes('@')}>
                    <Plus size={16} /> Add
                </Button>
            </div>

            <div className="pt-4 border-t border-slate-200 flex items-center gap-4">
                <Button 
                    onClick={handleSaveChanges} 
                    disabled={isSaving || !hasChanges} 
                    variant="action-write" 
                    size="md"
                >
                    {isSaving ? <Loader className="w-5 h-5 mr-2 animate-spin"/> : <Save className="w-5 h-5 mr-2" />}
                    {isSaving ? 'Saving List...' : 'Save Admin List'}
                </Button>
                {saveStatus && (
                    <span className={`text-sm font-semibold ${saveStatus.includes('Error') ? 'text-red-600' : 'text-green-600'}`}>
                        {saveStatus}
                    </span>
                )}
            </div>
            <p className="text-xs text-slate-500 mt-2 italic">
                    You must refresh the app to take effect after saving changes.
            </p>
        </Card>
    );
};

const AdminFunctions = () => {
    const { 
        navigate, 
        isAdmin, 
        featureFlags: initialFlags, 
        metadata, 
        updateGlobalMetadata, 
        isLoading: isAppLoading, 
        globalMetadata 
    } = useAppServices();
    
    const notificationService = useNotifications();

    const scope = useMemo(() => ({
        ...notificationService,
        Button,
        Card,
        Loader,
        Shield,
        AlertTriangle
    }), [notificationService]);

    const [currentFlags, setCurrentFlags] = useState(() => initialFlags || {});
    const [isSaving, setIsSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState('');

    useEffect(() => {
        if (!isAppLoading && !isAdmin) {
            console.warn("[AdminFunctions] Non-admin user detected. Redirecting to dashboard.");
            navigate('dashboard');
        }
    }, [isAdmin, isAppLoading, navigate]);

    useEffect(() => {
        if (!initialFlags) return;

        const initialFlagsString = JSON.stringify(initialFlags);
        const currentFlagsString = JSON.stringify(currentFlags);

        if (initialFlagsString !== currentFlagsString) {
            if (saveStatus.startsWith('✅')) {
                 return;
            }
            setCurrentFlags(initialFlags);
        }
    }, [initialFlags, saveStatus, currentFlags]);

    const handleToggleFlag = (flagName) => {
        setCurrentFlags(prevFlags => {
            const currentVal = prevFlags[flagName] !== false; 
            const updatedFlags = { ...prevFlags, [flagName]: !currentVal };
            return updatedFlags;
        });
        setSaveStatus('');
    };

    const handleSaveChanges = async () => {
        setIsSaving(true);
        setSaveStatus('');

        try {
            await updateGlobalMetadata({ featureFlags: currentFlags }, {});
            setSaveStatus('✅ Flags updated successfully!');
        } catch (error) {
            console.error("[AdminFunctions] Failed to save feature flags:", error);
            setSaveStatus(`❌ Error saving flags: ${error.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    if (isAppLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
                <div className="flex items-center justify-center p-8 text-center text-slate-500 bg-white rounded-xl shadow-sm min-h-[100px]">
                    <Loader className="w-5 h-5 animate-spin mr-2 text-corporate-teal" />
                    Loading Admin Functions...
                </div>
            </div>
        );
    }
    
    if (!isAdmin) {
         return null;
    }

    return (
        <div className="min-h-screen bg-slate-50 p-6 space-y-8">
            <div className="max-w-7xl mx-auto">
                <Button onClick={() => navigate('dashboard')} variant="nav-back" size="sm" className="mb-6">
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    Back to Dashboard
                </Button>

                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-corporate-navy mb-2">Admin Functions</h1>
                    <p className="text-slate-600">Manage system settings, feature flags, and user access.</p>
                </header>

                <WidgetRenderer widgetId="system-reminders-controller" scope={scope} />

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <AdminEmailManager 
                        initialEmails={globalMetadata?.adminemails} 
                        updateGlobalMetadata={updateGlobalMetadata} 
                    />

                    <Card title="Feature Flags" icon={Settings} accentColor="bg-corporate-teal">
                        <p className="text-sm text-slate-600 mb-6">Enable or disable application features globally. Changes affect all users on next load.</p>

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
                                'enableMembershipModule',
                            ]
                             .sort() 
                             .map((flagName) => {
                                const isEnabled = currentFlags[flagName]; 

                                return (
                                    <div key={flagName} className="flex items-center justify-between p-3 border border-slate-200 rounded-xl bg-white shadow-sm hover:border-slate-300 transition-colors">
                                        <span className="text-sm font-medium text-slate-800">{flagName.replace('enable', '').replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim()}</span>
                                        
                                        <button
                                            onClick={() => handleToggleFlag(flagName)}
                                            disabled={isSaving}
                                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                                                isEnabled !== false ? `bg-green-100 border-green-200 text-green-700` : `bg-red-100 border-red-200 text-red-700`
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

                        <div className="mt-6 pt-4 border-t border-slate-200 flex items-center gap-4">
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

                        <p className="text-xs text-slate-500 mt-4 italic">
                            Feature flags are loaded from <code>metadata/config</code> document in Firestore.
                        </p>
                    </Card>
                </div>

                 <Card title="Database Management" icon={Key} accentColor="bg-corporate-navy" className="mt-6">
                    <p className="text-sm text-slate-600 mb-4">Direct access to the Firestore Data Manager to view and edit document/collection data.</p>
                    <Button onClick={() => navigate('data-maintenance')} variant="outline" size="md">
                        <Shield className="w-5 h-5 mr-2" /> Open Data Manager
                    </Button>
                 </Card>

            </div>
        </div>
    );
};

export default AdminFunctions;
