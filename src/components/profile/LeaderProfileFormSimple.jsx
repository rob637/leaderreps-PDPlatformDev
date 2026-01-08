import React, { useState, useEffect, useRef } from 'react';
import { 
  User, Building2, CheckCircle, ChevronRight, Save, Loader,
  AlertCircle, X, Bell, Mail, Phone
} from 'lucide-react';
import { Button } from '../ui';
import { useLeaderProfile } from '../../hooks/useLeaderProfile';
import { logActivity, ACTIVITY_TYPES } from '../../services/activityLogger';
import { db } from '../../lib/firebase';
import { useAuth } from '../../hooks/useAuth';

// Company size options
const COMPANY_SIZES = [
  { value: '1-10', label: '1-10 employees' },
  { value: '11-50', label: '11-50 employees' },
  { value: '51-200', label: '51-200 employees' },
  { value: '200+', label: '200+ employees' }
];

// Direct reports options
const DIRECT_REPORTS_OPTIONS = [
  { value: '0', label: 'None yet' },
  { value: '1-3', label: '1-3 people' },
  { value: '4-7', label: '4-7 people' },
  { value: '8+', label: '8+ people' }
];

// Input field component - MOVED OUTSIDE to prevent re-creation on each render
const InputField = ({ field, label, type = 'text', required = false, placeholder = '', value, onChange, error }) => (
  <div className="space-y-1">
    <label className="block text-sm font-medium text-slate-700">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <input
      type={type}
      value={value || ''}
      onChange={e => onChange(field, e.target.value)}
      placeholder={placeholder}
      className={`w-full px-4 py-3 rounded-xl border-2 transition-all
        ${error 
          ? 'border-red-300 bg-red-50 focus:border-red-500' 
          : 'border-slate-200 bg-white focus:border-corporate-teal'
        }
        focus:outline-none focus:ring-4 focus:ring-corporate-teal/20`}
    />
    {error && (
      <p className="text-xs text-red-500 flex items-center gap-1">
        <AlertCircle className="w-3 h-3" /> {error}
      </p>
    )}
  </div>
);

// Select field component - MOVED OUTSIDE to prevent re-creation on each render
const SelectField = ({ field, label, options, required = false, placeholder = 'Select...', value, onChange, error }) => (
  <div className="space-y-1">
    <label className="block text-sm font-medium text-slate-700">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <select
      value={value || ''}
      onChange={e => onChange(field, e.target.value)}
      className={`w-full px-4 py-3 rounded-xl border-2 transition-all appearance-none bg-white
        ${error ? 'border-red-300 bg-red-50' : 'border-slate-200 focus:border-corporate-teal'}
        focus:outline-none focus:ring-4 focus:ring-corporate-teal/20`}
    >
      <option value="">{placeholder}</option>
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
    {error && (
      <p className="text-xs text-red-500 flex items-center gap-1">
        <AlertCircle className="w-3 h-3" /> {error}
      </p>
    )}
  </div>
);

/**
 * Simplified Leader Profile Form
 * Single page with essential fields only:
 * - Name (first, last)
 * - Email
 * - Company & Role
 * - Team size
 * - Primary goal (optional but helpful)
 */
const LeaderProfileFormSimple = ({ onComplete, onClose, isModal = true }) => {
  const { profile, loading, saving, saveProfile, isComplete: profileAlreadyComplete } = useLeaderProfile();
  const { user } = useAuth();
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [showSuccess, setShowSuccess] = useState(false);
  const formRef = useRef(null);

  // Scroll to top when form mounts
  useEffect(() => {
    if (formRef.current) {
      formRef.current.scrollTop = 0;
    }
    // Also scroll window for non-modal usage
    window.scrollTo(0, 0);
  }, []);

  // Initialize form data from profile or user
  useEffect(() => {
    if (profile) {
      setFormData(profile);
    } else if (user) {
      // Pre-fill from Firebase Auth if available
      const nameParts = (user.displayName || '').split(' ');
      setFormData({
        firstName: nameParts[0] || '',
        lastName: nameParts.slice(1).join(' ') || '',
        email: user.email || ''
      });
    }
  }, [profile, user]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.firstName?.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName?.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.email?.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    if (!formData.companyName?.trim()) newErrors.companyName = 'Company name is required';
    if (!formData.jobTitle?.trim()) newErrors.jobTitle = 'Job title is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    
    const success = await saveProfile(formData, true);
    
    if (success) {
      try {
        await logActivity(db, ACTIVITY_TYPES.PROFILE_COMPLETE, {
          userId: user?.uid,
          userName: `${formData.firstName} ${formData.lastName}`,
          userEmail: formData.email,
          company: formData.companyName,
          role: formData.jobTitle
        });
      } catch (e) {
        console.error('Failed to log profile completion:', e);
      }
      
      setShowSuccess(true);
      setTimeout(() => {
        onComplete?.();
      }, 1500);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-white rounded-2xl">
        <Loader className="w-8 h-8 animate-spin text-corporate-teal" />
      </div>
    );
  }

  if (showSuccess) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center bg-white rounded-2xl">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <CheckCircle className="w-10 h-10 text-green-500" />
        </div>
        <h3 className="text-xl font-bold text-corporate-navy mb-2">Profile Complete!</h3>
        <p className="text-slate-600">Your personalized journey is ready.</p>
      </div>
    );
  }

  return (
    <div ref={formRef} className={`${isModal ? 'bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[85vh]' : ''}`}>
      {/* Header - Fixed */}
      <div className="bg-gradient-to-r from-corporate-navy to-corporate-navy/90 text-white p-4 relative flex-shrink-0">
        {isModal && onClose && (
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Complete Your Profile</h2>
            <p className="text-white/80 text-sm">Help us personalize your journey</p>
          </div>
        </div>
      </div>

      {/* Form - Scrollable */}
      <div className="p-4 space-y-4 overflow-y-auto flex-1">
        {/* Name Row */}
        <div className="grid grid-cols-2 gap-4">
          <InputField field="firstName" label="First Name" required placeholder="John" value={formData.firstName} onChange={handleChange} error={errors.firstName} />
          <InputField field="lastName" label="Last Name" required placeholder="Smith" value={formData.lastName} onChange={handleChange} error={errors.lastName} />
        </div>

        {/* Email */}
        <InputField field="email" label="Email" type="email" required placeholder="john@company.com" value={formData.email} onChange={handleChange} error={errors.email} />

        {/* Phone Number */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-slate-700">
            Phone Number <span className="text-slate-400">(optional)</span>
          </label>
          <input
            type="tel"
            value={formData.phoneNumber || ''}
            onChange={e => handleChange('phoneNumber', e.target.value)}
            placeholder="+1 (555) 123-4567"
            className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 bg-white
              focus:border-corporate-teal focus:outline-none focus:ring-4 focus:ring-corporate-teal/20
              transition-all"
          />
          <p className="text-xs text-slate-500">
            By providing your phone number, you consent to receive text messages including habit reminders and event notifications.
          </p>
        </div>

        {/* Company & Role */}
        <div className="grid grid-cols-2 gap-4">
          <InputField field="companyName" label="Company" required placeholder="Acme Corp" value={formData.companyName} onChange={handleChange} error={errors.companyName} />
          <InputField field="jobTitle" label="Job Title" required placeholder="Engineering Manager" value={formData.jobTitle} onChange={handleChange} error={errors.jobTitle} />
        </div>

        {/* Team Size */}
        <div className="grid grid-cols-2 gap-4">
          <SelectField field="companySize" label="Company Size" options={COMPANY_SIZES} value={formData.companySize} onChange={handleChange} error={errors.companySize} />
          <SelectField field="directReports" label="Direct Reports" options={DIRECT_REPORTS_OPTIONS} value={formData.directReports} onChange={handleChange} error={errors.directReports} />
        </div>

        {/* Primary Goal - Optional but helpful */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-slate-700">
            What's your main leadership goal? <span className="text-slate-400">(optional)</span>
          </label>
          <textarea
            value={formData.primaryGoal || ''}
            onChange={e => handleChange('primaryGoal', e.target.value)}
            placeholder="e.g., Become more confident giving feedback, build a stronger team culture..."
            rows={2}
            className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 bg-white
              focus:border-corporate-teal focus:outline-none focus:ring-4 focus:ring-corporate-teal/20
              resize-none transition-all"
          />
        </div>

        {/* Notification Preferences */}
        <div className="bg-slate-50 p-4 rounded-xl space-y-3 border border-slate-200">
          <h4 className="text-sm font-semibold text-corporate-navy flex items-center gap-2">
            <Bell className="w-4 h-4" /> Notification Preferences
          </h4>
          
          {/* Email Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-slate-500" />
              <span className="text-sm text-slate-700">Email Notifications</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer"
                checked={formData.notificationSettings?.channels?.email ?? true}
                onChange={(e) => {
                  const currentSettings = formData.notificationSettings || { channels: { email: true, sms: false } };
                  setFormData(prev => ({
                    ...prev,
                    notificationSettings: {
                      ...currentSettings,
                      channels: {
                        ...currentSettings.channels || {},
                        email: e.target.checked
                      }
                    }
                  }));
                }}
              />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-corporate-teal/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-corporate-teal"></div>
            </label>
          </div>

          {/* SMS Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-slate-500" />
              <span className="text-sm text-slate-700">SMS Notifications</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer"
                checked={formData.notificationSettings?.channels?.sms ?? false}
                disabled={!formData.phoneNumber}
                onChange={(e) => {
                  const currentSettings = formData.notificationSettings || { channels: { email: true, sms: false } };
                  setFormData(prev => ({
                    ...prev,
                    notificationSettings: {
                      ...currentSettings,
                      channels: {
                        ...currentSettings.channels || {},
                        sms: e.target.checked
                      }
                    }
                  }));
                }}
              />
              <div className={`w-9 h-5 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all ${!formData.phoneNumber ? 'bg-slate-100 cursor-not-allowed' : 'bg-slate-200 peer-checked:bg-corporate-teal peer-focus:ring-4 peer-focus:ring-corporate-teal/20'}`}></div>
            </label>
          </div>
          {!formData.phoneNumber && (
            <p className="text-xs text-slate-400 italic ml-6">Add a phone number to enable SMS</p>
          )}
        </div>
      </div>

      {/* Footer - Fixed */}
      <div className="flex items-center justify-between p-3 bg-slate-50 border-t border-slate-200 flex-shrink-0">
        {onClose && (
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-600 hover:text-slate-900 transition-colors"
          >
            Cancel
          </button>
        )}
        <div className="flex-1" />
        <Button
          onClick={handleSubmit}
          disabled={saving}
          className="flex items-center gap-2 bg-corporate-teal hover:bg-corporate-teal/90"
        >
          {saving ? <Loader className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
          {profileAlreadyComplete ? 'Update Profile' : 'Complete Profile'}
        </Button>
      </div>
    </div>
  );
};

export default LeaderProfileFormSimple;
