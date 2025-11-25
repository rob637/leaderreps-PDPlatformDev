// src/components/screens/AppSettings.jsx

import React from 'react';
import { useAppServices } from '../../services/useAppServices.jsx';
import { User, Lock, Code, Cpu, Settings, Shield, ArrowLeft, LogOut, Key, Mail } from 'lucide-react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { Button, Card } from '../ui';

const AppSettingsScreen = () => {
  const { user, API_KEY, auth, navigate, isAdmin } = useAppServices();

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
    <div className="min-h-screen bg-slate-50 p-6 md:p-10 animate-fade-in">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-corporate-teal/10 flex items-center justify-center text-corporate-teal">
                <Settings className="w-6 h-6" />
            </div>
            <div>
                <h1 className="text-3xl font-bold text-corporate-navy">App Settings</h1>
                <p className="text-slate-600">Manage your profile, security, and application preferences.</p>
            </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* User Account Card */}
            <Card title="User Account" icon={User} accentColor="bg-corporate-teal">
                <div className="space-y-4">
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <p className="text-xs font-bold text-slate-400 uppercase mb-1">Full Name</p>
                        <p className="font-semibold text-corporate-navy">{user?.name || 'N/A'}</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <p className="text-xs font-bold text-slate-400 uppercase mb-1">Email Address</p>
                        <p className="font-semibold text-corporate-navy">{user?.email || 'N/A'}</p>
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
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <div>
                            <p className="text-sm font-bold text-corporate-navy">Two-Factor Auth</p>
                            <p className="text-xs text-slate-500">Extra layer of security</p>
                        </div>
                        <span className="px-2 py-1 bg-red-100 text-red-600 text-xs font-bold rounded-full">Disabled</span>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <p className="text-xs font-bold text-slate-400 uppercase mb-1">Last Sign In</p>
                        <p className="font-mono text-sm text-slate-600">{new Date().toLocaleString()}</p>
                    </div>
                    <Button onClick={handleSignOutAll} variant="danger" size="sm" className="w-full justify-center">
                        <LogOut className="w-4 h-4" />
                        Sign Out From All Devices
                    </Button>
                </div>
            </Card>

            {/* AI Integration Card */}
            <Card title="AI Integration" icon={Code} accentColor="bg-purple-600">
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Gemini API Key Status</label>
                        <div className={`flex items-center gap-2 p-3 rounded-xl border ${API_KEY ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                            <div className={`w-2 h-2 rounded-full ${API_KEY ? 'bg-green-500' : 'bg-red-500'}`} />
                            <span className="font-bold text-sm">{API_KEY ? 'Active / Configured' : 'Missing / Not Configured'}</span>
                        </div>
                    </div>
                    <p className="text-xs text-slate-500 italic">
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
