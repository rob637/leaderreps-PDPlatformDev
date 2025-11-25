// src/components/screens/AppSettings.jsx

import React from 'react';
import { useAppServices } from '../../services/useAppServices.jsx';
import { User, Lock, Code, Cpu, Settings, Shield, ArrowLeft, LogOut, Key, Mail } from 'lucide-react';
import { sendPasswordResetEmail } from 'firebase/auth';

// --- Standardized UI Components ---
const Button = ({ children, onClick, disabled = false, variant = 'primary', className = '', size = 'md', ...rest }) => {
  const baseStyles = "inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-[#47A88D] text-white shadow-md hover:bg-[#3d917a] focus:ring-[#47A88D]/50",
    secondary: "bg-[#E04E1B] text-white shadow-md hover:bg-[#c44317] focus:ring-[#E04E1B]/50",
    outline: "bg-white text-[#47A88D] border-2 border-[#47A88D] shadow-sm hover:bg-[#47A88D]/10 focus:ring-[#47A88D]/50",
    danger: "bg-white text-red-600 border-2 border-red-200 shadow-sm hover:bg-red-50 focus:ring-red-200",
    ghost: "bg-transparent text-slate-600 hover:bg-slate-100",
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
        {title && (
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
            {Icon && (
              <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100 text-slate-600">
                <Icon className="w-5 h-5" />
              </div>
            )}
            <h3 className="text-xl font-bold text-[#002E47]">{title}</h3>
          </div>
        )}
        {children}
      </div>
    </div>
  );
};

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
            <div className="w-12 h-12 rounded-2xl bg-[#47A88D]/10 flex items-center justify-center text-[#47A88D]">
                <Settings className="w-6 h-6" />
            </div>
            <div>
                <h1 className="text-3xl font-bold text-[#002E47]">App Settings</h1>
                <p className="text-slate-600">Manage your profile, security, and application preferences.</p>
            </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* User Account Card */}
            <Card title="User Account" icon={User} accentColor="bg-[#47A88D]">
                <div className="space-y-4">
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <p className="text-xs font-bold text-slate-400 uppercase mb-1">Full Name</p>
                        <p className="font-semibold text-[#002E47]">{user?.name || 'N/A'}</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <p className="text-xs font-bold text-slate-400 uppercase mb-1">Email Address</p>
                        <p className="font-semibold text-[#002E47]">{user?.email || 'N/A'}</p>
                    </div>
                    <Button onClick={handleResetPassword} variant="outline" size="sm" className="w-full justify-center">
                        <Mail className="w-4 h-4" />
                        Send Password Reset Email
                    </Button>
                </div>
            </Card>

            {/* Security Card */}
            <Card title="Security" icon={Lock} accentColor="bg-[#E04E1B]">
                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <div>
                            <p className="text-sm font-bold text-[#002E47]">Two-Factor Auth</p>
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
                <Card title="Administrator Tools" icon={Shield} accentColor="bg-[#002E47]">
                    <p className="text-sm text-slate-600 mb-4">Access tools for managing global application data and features.</p>
                    <div className="space-y-3">
                        <Button onClick={() => navigate('admin-functions')} variant="outline" size="sm" className="w-full justify-start">
                            <Settings className="w-4 h-4 text-slate-400" />
                            Manage Feature Flags
                        </Button>
                        <Button onClick={() => navigate('data-maintenance')} variant="outline" size="sm" className="w-full justify-start !text-[#E04E1B] !border-[#E04E1B]/30 hover:!bg-[#E04E1B]/5">
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
