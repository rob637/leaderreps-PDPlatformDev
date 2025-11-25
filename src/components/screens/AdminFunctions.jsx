// src/components/screens/AdminFunctions.jsx

import React, { useState, useEffect, useMemo } from 'react';
import { useAppServices } from '../../services/useAppServices.jsx';
import { Shield, ToggleLeft, ToggleRight, Save, Loader, AlertTriangle, ArrowLeft, Key, Settings, Mail, Plus, X } from 'lucide-react';

// --- Standardized UI Components ---
const Button = ({ children, onClick, disabled = false, variant = 'primary', className = '', size = 'md', ...rest }) => {
  const baseStyles = "inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-[#47A88D] text-white shadow-md hover:bg-[#3d917a] focus:ring-[#47A88D]/50",
    secondary: "bg-[#E04E1B] text-white shadow-md hover:bg-[#c44317] focus:ring-[#E04E1B]/50",
    outline: "bg-white text-[#47A88D] border-2 border-[#47A88D] shadow-sm hover:bg-[#47A88D]/10 focus:ring-[#47A88D]/50",
    ghost: "bg-transparent text-slate-600 hover:bg-slate-100",
    'nav-back': "bg-white text-slate-700 border border-slate-300 shadow-sm hover:bg-slate-100 focus:ring-slate-300/50 px-4 py-2 text-sm",
    'action-write': "bg-green-600 text-white shadow-md hover:bg-green-700 focus:ring-green-500/50",
    'action-danger': "bg-red-600 text-white shadow-md hover:bg-red-700 focus:ring-red-500/50",
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
        <Card title="Administrator List" icon={Mail} accentColor="bg-[#002E47]">
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
                    className="flex-1 p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#47A88D] focus:border-[#47A88D] outline-none transition-all"
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

const AdminFunctionsScreen = () => {
    const {
        navigate, isAdmin,
        featureFlags: initialFlags,
        metadata,
        updateGlobalMetadata,
        isLoading: isAppLoading
    } = useAppServices();

    const [currentFlags, setCurrentFlags] = useState(() => initialFlags || {});
    const [isSaving, setIsSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState('');

    const adminEmails = useMemo(() => {
        const PRIMARY_ADMIN_EMAILS = ['rob@sagecg.com', 'admin@leaderreps.com'];
        const firestoreEmails = metadata?.adminemails;
        const allEmails = Array.isArray(firestoreEmails) ? firestoreEmails : [];
        const finalEmails = [...new Set([...PRIMARY_ADMIN_EMAILS, ...allEmails])].filter(Boolean);
        return finalEmails.sort();
    }, [metadata]);

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
                    <Loader className="w-5 h-5 animate-spin mr-2 text-[#47A88D]" />
                    Loading Admin Functions...
                </div>
            </div>
        );
    }
    
    if (!isAdmin) {
         return null;
    }

    return (
        <div className="p-6 md:p-10 min-h-screen bg-slate-50 animate-fade-in">
            <header className="mb-8">
                <h1 className="text-3xl md:text-4xl font-extrabold mb-2 flex items-center gap-3 text-[#002E47]">
                    <Shield className="w-8 h-8 text-[#47A88D]" /> Admin Functions
                </h1>
                <p className="text-lg text-slate-600">Manage application features and settings.</p>
            </header>

            <Button onClick={() => navigate('app-settings')} variant="nav-back" className="mb-6">
                <ArrowLeft className="w-5 h-5 mr-2" /> Back to App Settings
            </Button>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                <AdminEmailManager
                    initialEmails={adminEmails}
                    updateGlobalMetadata={updateGlobalMetadata}
                />

                <Card title="Feature Flags" icon={Settings} accentColor="bg-[#47A88D]">
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

             <Card title="Database Management" icon={Key} accentColor="bg-[#002E47]" className="mt-6">
                <p className="text-sm text-slate-600 mb-4">Direct access to the Firestore Data Manager to view and edit document/collection data.</p>
                <Button onClick={() => navigate('data-maintenance')} variant="outline" size="md">
                    <Shield className="w-5 h-5 mr-2" /> Open Data Manager
                </Button>
             </Card>

        </div>
    );
};

export default AdminFunctionsScreen; 
