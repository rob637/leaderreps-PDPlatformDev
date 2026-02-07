// src/components/screens/AppSettings.jsx

import React, { useState, useEffect } from 'react';
import { useAppServices } from '../../services/useAppServices.jsx';
import { User, Lock, Code, Cpu, Settings, Shield, ArrowLeft, LogOut, Key, Mail, Bell, BellOff, CheckCircle } from 'lucide-react';
import { sendPasswordResetEmail, doc, getDoc } from '../../services/firebaseUtils';
import { Button, Card } from '../ui';
import { notificationService } from '../../services/notificationService';

const AppSettingsScreen = () => {
  const { user, API_KEY, auth, navigate, isAdmin, db } = useAppServices();
  const [notificationStatus, setNotificationStatus] = useState('checking');
  const [isEnablingNotifications, setIsEnablingNotifications] = useState(false);

  useEffect(() => {
    checkNotificationStatus();
  }, [user?.uid]);

  const checkNotificationStatus = async () => {
    if (!notificationService.isFCMSupported()) {
      setNotificationStatus('unsupported');
      return;
    }

    const permission = notificationService.getPermission();
    if (permission === 'denied') {
      setNotificationStatus('blocked');
      return;
    }

    if (user?.uid && db) {
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists() && userDoc.data().fcmTokens?.length > 0) {
          setNotificationStatus('enabled');
          return;
        }
      } catch (e) {
        console.error('Error checking notification status:', e);
      }
    }

    setNotificationStatus(permission === 'granted' ? 'available' : 'disabled');
  };

  const handleEnableNotifications = async () => {
    if (!user?.uid || !db) return;
    
    setIsEnablingNotifications(true);
    try {
      const token = await notificationService.registerForPushNotifications(db, user.uid);
      if (token) {
        setNotificationStatus('enabled');
      } else {
        const permission = notificationService.getPermission();
        setNotificationStatus(permission === 'denied' ? 'blocked' : 'disabled');
      }
    } catch (error) {
      console.error('Error enabling notifications:', error);
    }
    setIsEnablingNotifications(false);
  };

  const handleResetPassword = async () => {
    if (!user?.email || !auth) {
      alert('Cannot reset password: User email or authentication service is unavailable.');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, user.email);
      alert(`Password reset email sent successfully to ${user.email}. Please check your inbox (and spam folder).`);
    } catch (error) {
      console.error("[AppSettings] Password reset failed:", error);
      alert(`Failed to send password reset email: ${error.message}`);
    }
  };

  const handleSignOutAll = () => {
      console.warn("[AppSettings] 'Sign Out From All Devices' action triggered (Placeholder).");
      alert("Placeholder: This action would typically revoke refresh tokens via a backend function.");
  };

  return (
    <div className="min-h-screen bg-[#FAFBFC] dark:bg-slate-900 p-5 sm:p-8 lg:p-10" style={{ fontFamily: 'var(--font-body)' }}>
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="flex items-center gap-4 mb-10">
            <div className="w-14 h-14 rounded-2xl bg-corporate-teal/10 flex items-center justify-center text-corporate-teal">
                <Settings className="w-7 h-7" />
            </div>
            <div>
                <h1 className="text-2xl sm:text-3xl font-semibold text-corporate-navy tracking-tight" style={{ fontFamily: 'var(--font-heading)' }}>App Settings</h1>
                <p className="text-slate-500 mt-1">Manage your profile, security, and preferences.</p>
            </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* User Account Card */}
            <Card title="User Account" icon={User} accentColor="bg-corporate-teal">
                <div className="space-y-4">
                    <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-100">
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Full Name</p>
                        <p className="font-medium text-corporate-navy">{user?.name || 'N/A'}</p>
                    </div>
                    <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-100">
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Email Address</p>
                        <p className="font-medium text-corporate-navy">{user?.email || 'N/A'}</p>
                    </div>
                    <Button onClick={handleResetPassword} variant="outline" size="sm" className="w-full justify-center">
                        <Mail className="w-4 h-4" />
                        Send Password Reset Email
                    </Button>
                </div>
            </Card>

            {/* Security Card */}
            <Card title="Security" icon={Lock} accentColor="bg-corporate-orange">
                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-slate-50/80 rounded-xl border border-slate-100">
                        <div>
                            <p className="text-sm font-medium text-corporate-navy">Two-Factor Auth</p>
                            <p className="text-xs text-slate-400 mt-0.5">Extra layer of security</p>
                        </div>
                        <span className="px-2.5 py-1 bg-red-50 text-red-600 text-xs font-medium rounded-full">Disabled</span>
                    </div>
                    <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-100">
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Last Sign In</p>
                        <p className="font-mono text-sm text-slate-600">{new Date().toLocaleString()}</p>
                    </div>
                    <Button onClick={handleSignOutAll} variant="danger" size="sm" className="w-full justify-center">
                        <LogOut className="w-4 h-4" />
                        Sign Out From All Devices
                    </Button>
                </div>
            </Card>

            {/* Push Notifications Card */}
            <Card title="Push Notifications" icon={Bell} accentColor="bg-blue-600">
                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-slate-50/80 rounded-xl border border-slate-100">
                        <div>
                            <p className="text-sm font-medium text-corporate-navy">Daily Reminders</p>
                            <p className="text-xs text-slate-400 mt-0.5">Get notified about your daily plan</p>
                        </div>
                        {notificationStatus === 'enabled' ? (
                            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 text-xs font-medium rounded-full flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" /> Enabled
                            </span>
                        ) : notificationStatus === 'blocked' ? (
                            <span className="px-2.5 py-1 bg-red-50 text-red-600 text-xs font-medium rounded-full flex items-center gap-1">
                                <BellOff className="w-3 h-3" /> Blocked
                            </span>
                        ) : notificationStatus === 'unsupported' ? (
                            <span className="px-2.5 py-1 bg-slate-50 text-slate-500 text-xs font-medium rounded-full">Not Supported</span>
                        ) : (
                            <span className="px-2.5 py-1 bg-amber-50 text-amber-600 text-xs font-medium rounded-full">Disabled</span>
                        )}
                    </div>
                    
                    {notificationStatus === 'blocked' && (
                        <p className="text-xs text-amber-600 bg-amber-50 p-3 rounded-lg">
                            Notifications are blocked in your browser. To enable them, click the lock icon in your browser's address bar and allow notifications.
                        </p>
                    )}
                    
                    {notificationStatus === 'unsupported' && (
                        <p className="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg">
                            Push notifications are not supported in this browser. Try using Chrome, Firefox, or Edge.
                        </p>
                    )}

                    {(notificationStatus === 'disabled' || notificationStatus === 'available') && (
                        <Button 
                            onClick={handleEnableNotifications} 
                            variant="primary" 
                            size="sm" 
                            className="w-full justify-center"
                            disabled={isEnablingNotifications}
                        >
                            {isEnablingNotifications ? (
                                <>Processing...</>
                            ) : (
                                <>
                                    <Bell className="w-4 h-4" />
                                    Enable Push Notifications
                                </>
                            )}
                        </Button>
                    )}
                    
                    {notificationStatus === 'enabled' && (
                        <p className="text-xs text-emerald-600 bg-emerald-50 p-3 rounded-lg flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                            You'll receive daily reminders based on your program schedule.
                        </p>
                    )}
                </div>
            </Card>

            {/* AI Integration Card */}
            <Card title="AI Integration" icon={Code} accentColor="bg-purple-600">
                <div className="space-y-4">
                    <div>
                        <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Gemini API Key Status</label>
                        <div className={`flex items-center gap-2.5 p-3.5 rounded-xl border ${API_KEY ? 'bg-emerald-50/80 border-emerald-100 text-emerald-700' : 'bg-red-50/80 border-red-100 text-red-700'}`}>
                            <div className={`w-2 h-2 rounded-full ${API_KEY ? 'bg-emerald-500' : 'bg-red-500'}`} />
                            <span className="font-medium text-sm">{API_KEY ? 'Active / Configured' : 'Missing / Not Configured'}</span>
                        </div>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                        API Key is managed via environment variables. Status reflects runtime availability.
                    </p>
                </div>
            </Card>

            {/* Admin Tools Card */}
            {isAdmin && (
                <Card title="Administrator Tools" icon={Shield} accentColor="bg-corporate-navy">
                    <p className="text-sm text-slate-600 mb-4">Access tools for managing global application data and features.</p>
                    <div className="space-y-3">
                        <Button onClick={() => navigate('admin-functions')} variant="outline" size="sm" className="w-full justify-start">
                            <Settings className="w-4 h-4 text-slate-400" />
                            Manage Feature Flags
                        </Button>
                        <Button onClick={() => navigate('data-maintenance')} variant="outline" size="sm" className="w-full justify-start !text-corporate-orange !border-corporate-orange/30 hover:!bg-corporate-orange/5">
                            <Cpu className="w-4 h-4" />
                            Firestore Data Manager (Raw)
                        </Button>
                        <Button onClick={() => navigate('debug-data')} variant="outline" size="sm" className="w-full justify-start !text-blue-600 !border-blue-300 hover:!bg-blue-50">
                            <Code className="w-4 h-4" />
                            Raw Context Viewer
                        </Button>
                    </div>
                </Card>
            )}

        </div>
      </div>
    </div>
  );
};

export default AppSettingsScreen;
