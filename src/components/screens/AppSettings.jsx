// src/components/screens/AppSettings.jsx (Extracted and Refined)

import React from 'react';
// --- Core Services & Context ---
import { useAppServices } from '../../services/useAppServices.jsx'; // cite: useAppServices.jsx

// --- Icons ---
import { User, Lock, Code, Cpu, Settings, Shield, ArrowLeft } from 'lucide-react'; // Added Shield, ArrowLeft
import { sendPasswordResetEmail } from 'firebase/auth';

/* =========================================================
   PALETTE & UI COMPONENTS (Standardized)
========================================================= */
// --- Primary Color Palette ---
const COLORS = { NAVY: '#002E47', TEAL: '#47A88D', BLUE: '#002E47', ORANGE: '#E04E1B', GREEN: '#47A88D', AMBER: '#E04E1B', RED: '#E04E1B', LIGHT_GRAY: '#FCFCFA', OFF_WHITE: '#FFFFFF', SUBTLE: '#E5E7EB', TEXT: '#374151', MUTED: '#4B5355', PURPLE: '#47A88D', BG: '#F9FAFB' }; // cite: App.jsx

// --- Standardized UI Components (Assume imported or globally available) ---
// Using placeholder comments, assuming Button and Card are correctly defined elsewhere or globally
// const Button = ({...}) => { /* ... Standard Button ... */ };
// const Card = ({...}) => { /* ... Standard Card ... */ };

// --- Standardized Button Component (Local Definition for standalone use) ---
const Button = ({ children, onClick, disabled = false, variant = 'primary', className = '', size = 'md', ...rest }) => {
    let baseStyle = `inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-4 disabled:opacity-50 disabled:cursor-not-allowed`;
    if (size === 'sm') baseStyle += ' px-4 py-2 text-sm'; else if (size === 'lg') baseStyle += ' px-8 py-4 text-lg'; else baseStyle += ' px-6 py-3 text-base'; // Default 'md'
    if (variant === 'primary') baseStyle += ` bg-[${COLORS.TEAL}] text-white shadow-lg hover:bg-[#47A88D] focus:ring-[${COLORS.TEAL}]/50`;
    else if (variant === 'secondary') baseStyle += ` bg-[${COLORS.ORANGE}] text-white shadow-lg hover:bg-[#C312] focus:ring-[${COLORS.ORANGE}]/50`;
    else if (variant === 'outline') baseStyle += ` bg-[${COLORS.OFF_WHITE}] text-[${COLORS.TEAL}] border-2 border-[${COLORS.TEAL}] shadow-md hover:bg-[${COLORS.TEAL}]/10 focus:ring-[${COLORS.TEAL}]/50`;
    else if (variant === 'nav-back') baseStyle += ` bg-white text-gray-700 border border-gray-300 shadow-sm hover:bg-gray-100 focus:ring-gray-300/50 px-4 py-2 text-sm`;
    else if (variant === 'ghost') baseStyle += ` bg-transparent text-gray-600 hover:bg-gray-100 focus:ring-gray-300/50 px-3 py-1.5 text-sm`;
    if (disabled) baseStyle += ' bg-gray-300 text-gray-500 shadow-inner border-transparent hover:bg-gray-300';
    return (<button {...rest} onClick={onClick} disabled={disabled} className={`${baseStyle} ${className}`}>{children}</button>);
};
// --- Standardized Card Component (Local Definition for standalone use) ---
const Card = ({ children, title, icon: Icon, className = '', accent = 'NAVY' }) => {
    const accentColor = COLORS[accent] || COLORS.NAVY;
    return (
        <div className={`relative p-6 rounded-2xl border-2 shadow-xl hover:shadow-lg transition-all duration-300 text-left ${className}`} style={{ background: 'linear-gradient(180deg,#FFFFFF, #FCFCFA)', borderColor: COLORS.SUBTLE, color: COLORS.NAVY }}>
            <span style={{ position:'absolute', top:0, left:0, right:0, height:6, background: accentColor, borderTopLeftRadius:14, borderTopRightRadius:14 }} />
            {Icon && title && ( <div className="flex items-center gap-3 mb-4"> <div className="w-10 h-10 rounded-lg flex items-center justify-center border flex-shrink-0" style={{ borderColor: COLORS.SUBTLE, background: COLORS.LIGHT_GRAY }}> <Icon className="w-5 h-5" style={{ color: accentColor }} /> </div> <h2 className="text-xl font-extrapold" style={{ color: COLORS.NAVY }}>{title}</h2> </div> )}
            {!Icon && title && <h2 className="text-xl font-extrabold mb-4 border-b pb-2" style={{ color: COLORS.NAVY, borderColor: COLORS.SUBTLE }}>{title}</h2>}
            <div className={Icon || title ? '' : ''}>{children}</div>
        </div>
    );
};

/* =========================================================
   AppSettingsScreen Component
========================================================= */

/**
 * AppSettingsScreen Component
 * Allows users to view account details, manage security settings (placeholder),
 * check AI integration status, and access admin tools (if authorized).
 */
const AppSettingsScreen = () => {
  // --- Consume Services ---
  const { user, API_KEY, auth, navigate, isAdmin } = useAppServices(); // cite: useAppServices.jsx

  // --- Handlers ---
  /**
   * Sends a password reset email using Firebase Auth.
   */
  const handleResetPassword = async () => {
    if (!user?.email || !auth) { // Added auth check
      alert('Cannot reset password: User email or authentication service is unavailable.');
      return;
    }
    try {
      // Use the sendPasswordResetEmail function from firebase/auth
      await sendPasswordResetEmail(auth, user.email); // cite: App.jsx (original location)
      alert(`Password reset email sent successfully to ${user.email}. Please check your inbox (and spam folder).`);
    } catch (error) {
      console.error("[AppSettings] Password reset failed:", error);
      alert(`Failed to send password reset email: ${error.message}`);
    }
  };

  /**
   * Placeholder function for signing out from all devices.
   * Requires more complex backend/Firebase Functions implementation.
   */
  const handleSignOutAll = () => {
      console.warn("[AppSettings] 'Sign Out From All Devices' action triggered (Placeholder).");
      alert("Placeholder: This action would typically revoke refresh tokens via a backend function.");
      // Implementation might involve Firebase Admin SDK to revoke refresh tokens.
  };

  return (
    // Consistent page structure and padding
    <div className="p-6 md:p-4 sm:p-3 sm:p-4 lg:p-6 lg:p-8 lg:p-10 min-h-screen" style={{ background: COLORS.BG }}>
      {/* Header */}
      <header className="mb-8">
        <h1 className="text-xl sm:text-2xl sm:text-3xl md:text-4xl font-extrabold mb-2 flex items-center gap-3" style={{ color: COLORS.NAVY }}>
            <Settings className="w-8 h-8" style={{ color: COLORS.TEAL }} /> App Settings
        </h1>
        <p className="text-lg text-gray-700">Manage your profile, security, and application preferences.</p>
      </header>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 sm:p-4 lg:p-6 mx-auto"> {/* Centered content */}

        {/* User Account Card */}
        <Card title="User Account" icon={User} accent="TEAL">
          <div className="space-y-2 text-sm">
              <p className="text-gray-700"><strong>Full Name:</strong> <span className="font-semibold">{user?.name || 'N/A'}</span></p>
              <p className="text-gray-700"><strong>Email:</strong> <span className="font-semibold">{user?.email || 'N/A'}</span></p>
              {/* <p className="text-gray-700"><strong>User ID:</strong> <span className="font-mono text-xs bg-gray-100 px-1 rounded">{user?.userId || 'N/A'}</span></p> */}
          </div>
          {/* Change Password Button */}
          <Button onClick={handleResetPassword} variant="outline" size="sm" className="mt-4 w-full !text-orange-600 !border-orange-300 hover:!bg-orange-50">
            Change Password (Send Reset Link)
          </Button>
        </Card>

        {/* Security Card (Placeholders) */}
        <Card title="Security" icon={Lock} accent="ORANGE">
          <div className="space-y-2 text-sm">
              <p className="text-gray-700">
                <strong>Two-Factor Auth:</strong> <span className="font-semibold text-red-500">Disabled</span> {/* Placeholder */}
              </p>
              <p className="text-gray-700">
                <strong>Last Sign In:</strong> <span className="font-semibold">{/* Placeholder - Could get from user.metadata.lastSignInTime */} {new Date().toLocaleString()}</span>
              </p>
          </div>
           {/* Sign Out All Button */}
           <Button onClick={handleSignOutAll} variant="outline" size="sm" className="mt-4 w-full !text-gray-600 !border-gray-300 hover:!bg-gray-100">
            Sign Out From All Devices (Placeholder)
           </Button>
        </Card>

        {/* AI Integration Card */}
        <Card title="AI Integration" icon={Code} accent="PURPLE">
          <label htmlFor="apiKeyStatus" className="block text-sm font-medium text-gray-700 mb-1">Gemini API Key Status</label>
          {/* Display API Key Status (Read-only) */}
          <input
            id="apiKeyStatus" type="text"
            value={API_KEY ? 'Active / Configured' : 'Missing / Not Configured'} // cite: useAppServices.jsx (provides API_KEY)
            readOnly disabled
            className={`w-full p-2 border rounded-lg text-sm font-semibold text-center ${API_KEY ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}
          />
          <p className="text-xs text-gray-500 mt-1">
            API Key is managed via environment variables (not editable here). Status reflects runtime availability.
          </p>
        </Card>

        {/* Admin Tools Card (Conditional) */}
        {/* Render this card only if the user is identified as an admin */}
        {isAdmin && ( // cite: useAppServices.jsx (provides isAdmin)
            <Card title="Administrator Tools" icon={Shield} accent="NAVY">
              <p className="text-sm text-gray-700 mb-4">Access tools for managing global application data and features.</p>
              <div className="space-y-2">
                  {/* Link to Feature Flag Management */}
                  <Button onClick={() => navigate('admin-functions')} variant="outline" size="sm" className="w-full">
                    <Settings size={14} className="mr-1" /> Manage Feature Flags
                  </Button>
                  {/* Link to Raw Data Editor */}
                  <Button onClick={() => navigate('data-maintenance')} variant="outline" size="sm" className="w-full !text-orange-600 !border-orange-300 hover:!bg-orange-50">
                    <Cpu size={14} className="mr-1" /> Firestore Data Manager (Raw)
                  </Button>
                  {/* Link to Debug Data Viewer */}
                  <Button onClick={() => navigate('debug-data')} variant="outline" size="sm" className="w-full !text-blue-600 !border-blue-300 hover:!bg-blue-50">
                    <Code size={14} className="mr-1" /> Raw Context Viewer
                  </Button>
              </div>
            </Card>
        )}
      </div>


    </div>
  );
};

// Export the component
export default AppSettingsScreen;