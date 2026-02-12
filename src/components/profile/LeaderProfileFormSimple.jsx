import React, { useState, useEffect, useRef } from 'react';
import { 
  User, Building2, CheckCircle, ChevronRight, Save, Loader,
  AlertCircle, X, Bell, Mail, Phone, Globe, Smartphone, Zap, Shield, VolumeX, Check, ChevronDown, MessageSquare
} from 'lucide-react';
import { Button } from '../ui';
import { useLeaderProfile } from '../../hooks/useLeaderProfile';
import { logActivity, ACTIVITY_TYPES } from '../../services/activityLogger';
import { db } from '../../lib/firebase';
import { useAuth } from '../../hooks/useAuth';

// Notification strategy presets
const NOTIFICATION_STRATEGIES = {
  smart_escalation: {
    id: 'smart_escalation',
    name: 'Smart Escalation',
    description: 'Starts gentle, escalates if you miss days',
    icon: Zap,
    recommended: true,
    channels: { push: true, email: true, sms: true }
  },
  push_only: {
    id: 'push_only',
    name: 'Push Only',
    description: 'App notifications only - least intrusive',
    icon: Smartphone,
    channels: { push: true, email: false, sms: false }
  },
  full_accountability: {
    id: 'full_accountability',
    name: 'Full Accountability',
    description: 'All channels, every reminder',
    icon: Shield,
    channels: { push: true, email: true, sms: true }
  },
  disabled: {
    id: 'disabled',
    name: 'Notifications Off',
    description: 'No reminders (not recommended)',
    icon: VolumeX,
    channels: { push: false, email: false, sms: false }
  }
};

// Common timezones for the dropdown
const COMMON_TIMEZONES = [
  { value: "America/New_York", label: "Eastern Time (New York)" },
  { value: "America/Chicago", label: "Central Time (Chicago)" },
  { value: "America/Denver", label: "Mountain Time (Denver)" },
  { value: "America/Los_Angeles", label: "Pacific Time (Los Angeles)" },
  { value: "America/Phoenix", label: "Arizona (Phoenix)" },
  { value: "America/Anchorage", label: "Alaska (Anchorage)" },
  { value: "America/Honolulu", label: "Hawaii (Honolulu)" },
  { value: "Europe/London", label: "London (GMT)" },
  { value: "Europe/Paris", label: "Paris (CET)" },
  { value: "Asia/Tokyo", label: "Tokyo (JST)" },
  { value: "Australia/Sydney", label: "Sydney (AEST)" },
  { value: "UTC", label: "UTC" }
];

// Company size options
const COMPANY_SIZES = [
  { value: '1-10', label: '1-10 employees' },
  { value: '11-50', label: '11-50 employees' },
  { value: '51-200', label: '51-200 employees' },
  { value: '200+', label: '200+ employees' }
];

// Direct reports options
const DIRECT_REPORTS_OPTIONS = [
  { value: '1-3', label: '1-3 people' },
  { value: '4-7', label: '4-7 people' },
  { value: '8+', label: '8+ people' }
];

// Input field component - MOVED OUTSIDE to prevent re-creation on each render
const InputField = ({ field, label, type = 'text', required = false, placeholder = '', value, onChange, error }) => (
  <div className="space-y-1">
    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <input
      type={type}
      value={value || ''}
      onChange={e => onChange(field, e.target.value)}
      placeholder={placeholder}
      className={`w-full px-4 py-3 rounded-xl border-2 transition-all
        ${error 
          ? 'border-red-300 bg-red-50 dark:bg-red-900/20 focus:border-red-500' 
          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:border-corporate-teal'
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
    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <select
      value={value || ''}
      onChange={e => onChange(field, e.target.value)}
      className={`w-full px-4 py-3 rounded-xl border-2 transition-all appearance-none bg-white dark:bg-slate-800
        ${error ? 'border-red-300 bg-red-50 dark:bg-red-900/20' : 'border-slate-200 dark:border-slate-700 focus:border-corporate-teal'}
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
      // Ensure notificationSettings has a default strategy
      const notificationSettings = profile.notificationSettings || {};
      if (!notificationSettings.strategy) {
        notificationSettings.strategy = 'smart_escalation';
        notificationSettings.enabled = true;
        notificationSettings.channels = { push: true, email: true, sms: true };
      }
      setFormData({ ...profile, notificationSettings });
    } else if (user) {
      // Pre-fill from Firebase Auth if available
      const nameParts = (user.displayName || '').split(' ');
      setFormData({
        firstName: nameParts[0] || '',
        lastName: nameParts.slice(1).join(' ') || '',
        email: user.email || '',
        // Set default notification settings for new users
        notificationSettings: {
          strategy: 'smart_escalation',
          enabled: true,
          channels: { push: true, email: true, sms: true }
        }
      });
    }
  }, [profile, user]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  // Validate phone number - must have at least 10 digits
  const isValidPhoneNumber = (phone) => {
    if (!phone) return true; // Optional field
    const digitsOnly = phone.replace(/\D/g, '');
    return digitsOnly.length >= 10;
  };

  // Format phone number to (xxx) xxx-xxxx
  const formatPhoneNumber = (phone) => {
    if (!phone) return '';
    const digitsOnly = phone.replace(/\D/g, '');
    if (digitsOnly.length < 10) return phone; // Return as-is if not enough digits
    // Take last 10 digits (in case country code is included)
    const last10 = digitsOnly.slice(-10);
    return `(${last10.slice(0, 3)}) ${last10.slice(3, 6)}-${last10.slice(6, 10)}`;
  };

  // Validate and format phone on blur (when user tabs out of field)
  const validatePhoneOnBlur = () => {
    if (formData.phoneNumber) {
      if (!isValidPhoneNumber(formData.phoneNumber)) {
        setErrors(prev => ({ ...prev, phoneNumber: 'Please enter a valid phone number (at least 10 digits)' }));
      } else {
        // Format the phone number and clear any error
        const formatted = formatPhoneNumber(formData.phoneNumber);
        setFormData(prev => ({ ...prev, phoneNumber: formatted }));
        setErrors(prev => ({ ...prev, phoneNumber: null }));
      }
    } else {
      setErrors(prev => ({ ...prev, phoneNumber: null }));
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
    
    // Check if selected strategy requires phone number (SMS-enabled strategies)
    const strategy = formData.notificationSettings?.strategy || 'smart_escalation';
    const strategyRequiresPhone = strategy === 'smart_escalation' || strategy === 'full_accountability';
    
    if (strategyRequiresPhone && !formData.phoneNumber?.trim()) {
      newErrors.phoneNumber = 'Phone number is required for SMS reminders. Add one or choose "Push Only".';
    } else if (formData.phoneNumber && !isValidPhoneNumber(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Please enter a valid phone number (at least 10 digits)';
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
      <div className="flex items-center justify-center h-64 bg-white dark:bg-slate-800 rounded-2xl">
        <Loader className="w-8 h-8 animate-spin text-corporate-teal" />
      </div>
    );
  }

  if (showSuccess) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center bg-white dark:bg-slate-800 rounded-2xl">
        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
          <CheckCircle className="w-10 h-10 text-green-500" />
        </div>
        <h3 className="text-xl font-bold text-corporate-navy mb-2">Profile Complete!</h3>
        <p className="text-slate-600 dark:text-slate-300">Your personalized journey is ready.</p>
      </div>
    );
  }

  return (
    <div ref={formRef} className={`${isModal ? 'bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[calc(100vh-6rem)] md:max-h-[85vh]' : ''}`}>
      {/* Header - Fixed */}
      <div className="bg-gradient-to-r from-corporate-navy to-corporate-navy/90 text-white p-4 relative flex-shrink-0">
        {isModal && onClose && (
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-slate-700/60 hover:bg-slate-600/80 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        )}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 dark:bg-slate-800/20 rounded-xl flex items-center justify-center">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Complete Your Profile</h2>
            <p className="text-white/80 text-sm">Help us personalize your journey</p>
          </div>
        </div>
      </div>

      {/* Action Bar - Fixed at top for mobile accessibility */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
        {onClose && (
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 transition-colors font-medium"
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

      {/* Form - Scrollable */}
      <div className="p-4 pb-32 space-y-4 overflow-y-auto flex-1">
        {/* Name Row */}
        <div className="grid grid-cols-2 gap-4">
          <InputField field="firstName" label="First Name" required placeholder="John" value={formData.firstName} onChange={handleChange} error={errors.firstName} />
          <InputField field="lastName" label="Last Name" required placeholder="Smith" value={formData.lastName} onChange={handleChange} error={errors.lastName} />
        </div>

        {/* Email */}
        <InputField field="email" label="Email" type="email" required placeholder="john@company.com" value={formData.email} onChange={handleChange} error={errors.email} />

        {/* Phone Number */}
        {(() => {
          const strategy = formData.notificationSettings?.strategy || 'smart_escalation';
          const phoneRequired = strategy === 'smart_escalation' || strategy === 'full_accountability';
          return (
            <div className="space-y-1">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                Phone Number {phoneRequired ? (
                  <span className="text-red-500">*</span>
                ) : (
                  <span className="text-slate-400">(optional)</span>
                )}
              </label>
              <input
                type="tel"
                value={formData.phoneNumber || ''}
                onChange={e => handleChange('phoneNumber', e.target.value)}
                onBlur={validatePhoneOnBlur}
                placeholder="+1 (555) 123-4567"
                className={`w-full px-4 py-3 rounded-xl border-2 transition-all
                  ${errors.phoneNumber 
                    ? 'border-red-300 bg-red-50 dark:bg-red-900/20 focus:border-red-500 focus:ring-red-200' 
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:border-corporate-teal focus:ring-corporate-teal/20'
                  }
                  focus:outline-none focus:ring-4`}
              />
              {errors.phoneNumber ? (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.phoneNumber}
                </p>
              ) : (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {phoneRequired 
                    ? 'Required for Smart Escalation to send text reminders on Day 3+.'
                    : 'By providing your phone number, you consent to receive text messages including habit reminders and event notifications.'
                  }
                </p>
              )}
            </div>
          );
        })()}

        {/* Notification Preferences - Enhanced with Visual Escalation */}
        <div className="bg-gradient-to-br from-slate-50 to-teal-50/30 p-5 rounded-xl space-y-4 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-corporate-navy flex items-center gap-2">
              <Bell className="w-4 h-4" /> Stay Accountable
            </h4>
            <span className="text-[10px] px-2 py-0.5 bg-corporate-teal/10 text-corporate-teal rounded-full font-medium">
              Recommended: ON
            </span>
          </div>
          
          <p className="text-sm text-slate-600 dark:text-slate-300">
            We'll remind you to practice daily. Choose how persistent you want us to be:
          </p>

          {/* Visual Escalation Diagram */}
          <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Smart Escalation Timeline</span>
            </div>
            
            {/* Timeline */}
            <div className="relative">
              {/* Connection line */}
              <div className="absolute top-5 left-5 right-5 h-0.5 bg-gradient-to-r from-green-300 via-amber-300 to-red-300 rounded-full" />
              
              {/* Steps */}
              <div className="relative flex justify-between">
                {/* Day 1 - Push */}
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 border-2 border-green-400 flex items-center justify-center z-10">
                    <Smartphone className="w-5 h-5 text-green-600" />
                  </div>
                  <span className="text-xs font-bold text-green-600 mt-2">Day 1</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">Nudge</span>
                </div>
                
                {/* Day 2 - Email */}
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 border-2 border-amber-400 flex items-center justify-center z-10">
                    <Mail className="w-5 h-5 text-amber-600" />
                  </div>
                  <span className="text-xs font-bold text-amber-600 mt-2">Day 2</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">+ Email</span>
                </div>
                
                {/* Day 3+ - SMS */}
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 border-2 border-red-400 flex items-center justify-center z-10">
                    <MessageSquare className="w-5 h-5 text-red-600" />
                  </div>
                  <span className="text-xs font-bold text-red-600 mt-2">Day 3+</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">+ Text</span>
                </div>
              </div>
            </div>
            
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 text-center italic">
              Miss a day? We'll gently escalate to help you stay on track.
            </p>
          </div>

          {/* Strategy Selection */}
          <div className="space-y-2">
            {Object.values(NOTIFICATION_STRATEGIES).map((strategy) => {
              const Icon = strategy.icon;
              const currentStrategy = formData.notificationSettings?.strategy || 'smart_escalation';
              const isSelected = currentStrategy === strategy.id;
              const needsPhone = strategy.channels.sms && !formData.phoneNumber;
              
              return (
                <button
                  key={strategy.id}
                  type="button"
                  onClick={() => {
                    const newChannels = { ...strategy.channels };
                    // Only enable SMS if phone number exists
                    if (!formData.phoneNumber) {
                      newChannels.sms = false;
                    }
                    setFormData(prev => ({
                      ...prev,
                      notificationSettings: {
                        ...prev.notificationSettings,
                        strategy: strategy.id,
                        enabled: strategy.id !== 'disabled',
                        channels: {
                          push: newChannels.push,
                          email: newChannels.email,
                          sms: newChannels.sms && !!formData.phoneNumber
                        }
                      }
                    }));
                  }}
                  className={`w-full p-3 rounded-lg border-2 transition-all text-left flex items-center gap-3 ${
                    isSelected 
                      ? 'border-corporate-teal bg-white dark:bg-slate-800 shadow-sm' 
                      : 'border-transparent bg-white/50 dark:bg-slate-800/50 hover:bg-white hover:border-slate-200'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${isSelected ? 'bg-corporate-teal text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`font-medium text-sm ${isSelected ? 'text-corporate-navy' : 'text-slate-600 dark:text-slate-300'}`}>
                        {strategy.name}
                      </span>
                      {strategy.recommended && (
                        <span className="text-[9px] px-1.5 py-0.5 bg-corporate-teal/10 text-corporate-teal rounded font-bold">
                          RECOMMENDED
                        </span>
                      )}
                      {needsPhone && (
                        <span className="text-[9px] px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 rounded font-medium">
                          NEEDS PHONE
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{strategy.description}</p>
                  </div>
                  {isSelected && (
                    <Check className="w-5 h-5 text-corporate-teal shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
          
          {/* Warning if strategy needs phone but none provided */}
          {(formData.notificationSettings?.strategy === 'smart_escalation' || 
            formData.notificationSettings?.strategy === 'full_accountability') && 
            !formData.phoneNumber && (
            <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-amber-800 font-medium">Phone number recommended</p>
                <p className="text-xs text-amber-600">
                  Add your phone number above to receive text reminders on Day 3+ if you miss days. Without it, we'll only use push & email.
                </p>
              </div>
            </div>
          )}

          {/* Timezone - Compact */}
          <div className="flex items-center gap-3 pt-2 border-t border-slate-200 dark:border-slate-700">
            <Globe className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={formData.notificationSettings?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || "America/New_York"}
              onChange={(e) => {
                setFormData(prev => ({
                  ...prev,
                  notificationSettings: {
                    ...prev.notificationSettings,
                    timezone: e.target.value
                  }
                }));
              }}
              className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800
                focus:border-corporate-teal focus:outline-none focus:ring-2 focus:ring-corporate-teal/20
                transition-all text-sm"
            >
              {COMMON_TIMEZONES.map(tz => (
                <option key={tz.value} value={tz.value}>{tz.label}</option>
              ))}
            </select>
          </div>
          
          <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
            You can change these settings anytime from your Locker.
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
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
            What's your main leadership goal? <span className="text-slate-400">(optional)</span>
          </label>
          <textarea
            value={formData.primaryGoal || ''}
            onChange={e => handleChange('primaryGoal', e.target.value)}
            placeholder="e.g., Become more confident giving feedback, build a stronger team culture..."
            rows={2}
            className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800
              focus:border-corporate-teal focus:outline-none focus:ring-4 focus:ring-corporate-teal/20
              resize-none transition-all"
          />
        </div>
      </div>
    </div>
  );
};

export default LeaderProfileFormSimple;
