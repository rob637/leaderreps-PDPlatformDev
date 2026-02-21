import React, { useState, useEffect, useRef } from 'react';
import { 
  User, Building2, CheckCircle, ChevronRight, Save, Loader,
  AlertCircle, X, Phone
} from 'lucide-react';
import { Button } from '../ui';
import { useLeaderProfile } from '../../hooks/useLeaderProfile';
import { logActivity, ACTIVITY_TYPES } from '../../services/activityLogger';
import { db } from '../../lib/firebase';
import { useAuth } from '../../hooks/useAuth';
import VoiceTextarea from '../conditioning/VoiceTextarea';

// Company size options
const COMPANY_SIZES = [
  { value: '1-10', label: '1-10 employees' },
  { value: '11-50', label: '11-50 employees' },
  { value: '51-200', label: '51-200 employees' },
  { value: '200+', label: '200+ employees' }
];

// --- New Leadership Profile Questions ---
const ROLE_OPTIONS = [
  'Individual contributor with people responsibilities',
  'Frontline manager',
  'Manager of managers',
  'Senior leader / executive',
];

const DIRECT_REPORTS_OPTIONS = [
  { value: '0', label: '0' },
  { value: '1-3', label: '1–3' },
  { value: '4-7', label: '4–7' },
  { value: '8-12', label: '8–12' },
  { value: '13+', label: '13+' },
];

const YEARS_LEADING_OPTIONS = [
  'Less than 1 year',
  '1–3 years',
  '3–7 years',
  '7+ years',
];

const TEAM_STATE_OPTIONS = [
  { value: 'stabilizing', label: 'Stabilizing', description: 'Fixing past messes or performance issues.' },
  { value: 'maintaining', label: 'Maintaining', description: 'Keeping the wheels turning on a steady ship.' },
  { value: 'scaling', label: 'Scaling', description: 'Growing fast and feeling the "stretch" pains.' },
  { value: 'transforming', label: 'Transforming', description: 'Changing the way we work entirely.' },
];

const UNDER_PRESSURE_OPTIONS = [
  'Over-explain',
  'Avoid conflict',
  'Move too fast',
  'Withdraw',
  'Get very directive',
  'Do it all myself',
  'Delay or stall',
  'Seek consensus',
];

const ENERGY_DRAIN_OPTIONS = [
  'Managing underperformance',
  'Politics',
  'Ambiguity',
  'Slow decisions',
  'Emotional conversations',
];

// Input field component - MOVED OUTSIDE to prevent re-creation on each render
const InputField = ({ field, label, type = 'text', required = false, placeholder = '', value, onChange, error }) => (
  <div className="space-y-1">
    <label className="block text-sm font-medium text-corporate-navy dark:text-white">
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
    <label className="block text-sm font-medium text-corporate-navy dark:text-white">
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
      setFormData({ ...profile });
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
    
    
    // Phone number is optional - validation only if provided
    if (formData.phoneNumber && !isValidPhoneNumber(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Please enter a valid phone number (at least 10 digits)';
    }
    if (!formData.companyName?.trim()) newErrors.companyName = 'Company name is required';
    if (!formData.jobTitle?.trim()) newErrors.jobTitle = 'Job title is required';

    // Leadership context (Q1-Q4)
    if (!formData.roleAlignment) newErrors.roleAlignment = 'Please select your role';
    if (!formData.directReports) newErrors.directReports = 'Please select the number of direct reports';
    if (!formData.yearsLeading) newErrors.yearsLeading = 'Please select how long you\'ve been leading';
    if (!formData.teamState) newErrors.teamState = 'Please select the state of your team';

    // Quick reflection (Q5-Q6)
    if (!formData.whatWouldBreak?.trim()) newErrors.whatWouldBreak = 'Please share what would break first';
    if (!formData.catchPhrase?.trim()) newErrors.catchPhrase = 'Please share a phrase that describes your job';

    // Patterns & energy (Q7-Q8)
    if (!formData.underPressure?.length) newErrors.underPressure = 'Please select at least 1 option';
    if (!formData.energyDrain?.length) newErrors.energyDrain = 'Please select at least 1 option';

    // Foundation goals (Q9-Q10)
    if (!formData.leadershipMuscle?.trim()) newErrors.leadershipMuscle = 'Please share the leadership muscle you want to strengthen';
    if (!formData.successDefinition?.trim()) newErrors.successDefinition = 'Please describe what success looks like for you';
    
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
      <div className="flex items-center justify-center h-64 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700">
        <Loader className="w-8 h-8 animate-spin text-corporate-teal" />
      </div>
    );
  }

  if (showSuccess) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700">
        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
          <CheckCircle className="w-10 h-10 text-green-500" />
        </div>
        <h3 className="text-xl font-bold text-corporate-navy mb-2">Profile Complete!</h3>
        <p className="text-slate-600 dark:text-slate-300">Your personalized journey is ready.</p>
      </div>
    );
  }

  return (
    <>
    <div ref={formRef} className={`${isModal ? 'bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden flex flex-col max-h-[calc(100vh-6rem)] md:max-h-[90vh]' : ''}`}>
      {/* Header — navy gradient, conditioning-consistent */}
      <div className="p-5 pb-4 bg-gradient-to-r from-corporate-navy to-corporate-navy/90 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <User className="w-5 h-5 text-white/90" />
            <h3 className="text-lg font-bold text-white">{profileAlreadyComplete ? 'Update Your Profile' : 'Complete Your Profile'}</h3>
          </div>
          {isModal && onClose && (
            <button
              onClick={onClose}
              className="p-2.5 -mr-1 bg-transparent hover:bg-white/10 rounded-lg text-white/80 hover:text-white transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
        <div className="mt-1 text-sm text-white/70">Help us personalize your journey</div>
      </div>

      {/* Form — Scrollable body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">

        {/* ===== SECTION: Contact Info ===== */}
        <div>
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Contact Info</h3>
          <div className="space-y-4">
            {/* Name Row */}
            <div className="grid grid-cols-2 gap-4">
              <InputField field="firstName" label="First Name" required placeholder="John" value={formData.firstName} onChange={handleChange} error={errors.firstName} />
              <InputField field="lastName" label="Last Name" required placeholder="Smith" value={formData.lastName} onChange={handleChange} error={errors.lastName} />
            </div>
            {/* Email */}
            <InputField field="email" label="Email" type="email" required placeholder="john@company.com" value={formData.email} onChange={handleChange} error={errors.email} />
            {/* Phone Number */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-corporate-navy dark:text-white">
                Phone Number <span className="text-slate-400">(optional)</span>
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
                  Add your phone number to receive text message reminders.
                </p>
              )}
            </div>
            {/* Company & Role */}
            <div className="grid grid-cols-2 gap-4">
              <InputField field="companyName" label="Company" required placeholder="Acme Corp" value={formData.companyName} onChange={handleChange} error={errors.companyName} />
              <InputField field="jobTitle" label="Job Title" required placeholder="Engineering Manager" value={formData.jobTitle} onChange={handleChange} error={errors.jobTitle} />
            </div>
          </div>
        </div>

        {/* ===== SECTION: Leadership Context (Q1-Q4) ===== */}
        <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-4">Leadership Context</h3>
          <div className="space-y-5">

            {/* Q1 — Role alignment */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-corporate-navy dark:text-white">
                1. Your role most closely aligns with: <span className="text-red-500">*</span>
              </label>
              {errors.roleAlignment && (
                <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.roleAlignment}</p>
              )}
              <div className="space-y-2">
                {ROLE_OPTIONS.map(option => (
                  <label
                    key={option}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all border-2 ${
                      formData.roleAlignment === option
                        ? 'bg-corporate-teal/10 border-corporate-teal text-corporate-navy dark:text-white font-medium'
                        : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="roleAlignment"
                      checked={formData.roleAlignment === option}
                      onChange={() => { handleChange('roleAlignment', option); }}
                      className="w-4 h-4 text-corporate-teal focus:ring-corporate-teal/50"
                    />
                    <span className="text-sm">{option}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Q2 — Direct reports */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-corporate-navy dark:text-white">
                2. Approximate number of direct reports: <span className="text-red-500">*</span>
              </label>
              {errors.directReports && (
                <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.directReports}</p>
              )}
              <div className="flex flex-wrap gap-2">
                {DIRECT_REPORTS_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleChange('directReports', opt.value)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium border-2 transition-all ${
                      formData.directReports === opt.value
                        ? 'bg-corporate-teal/10 border-corporate-teal text-corporate-navy dark:text-white'
                        : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-gray-300'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Q3 — Years leading */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-corporate-navy dark:text-white">
                3. How long have you been leading people? <span className="text-red-500">*</span>
              </label>
              {errors.yearsLeading && (
                <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.yearsLeading}</p>
              )}
              <div className="space-y-2">
                {YEARS_LEADING_OPTIONS.map(option => (
                  <label
                    key={option}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all border-2 ${
                      formData.yearsLeading === option
                        ? 'bg-corporate-teal/10 border-corporate-teal text-corporate-navy dark:text-white font-medium'
                        : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="yearsLeading"
                      checked={formData.yearsLeading === option}
                      onChange={() => handleChange('yearsLeading', option)}
                      className="w-4 h-4 text-corporate-teal focus:ring-corporate-teal/50"
                    />
                    <span className="text-sm">{option}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Q4 — Team state */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-corporate-navy dark:text-white">
                4. Which best describes the current state of your team? <span className="text-red-500">*</span>
              </label>
              {errors.teamState && (
                <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.teamState}</p>
              )}
              <div className="space-y-2">
                {TEAM_STATE_OPTIONS.map(opt => (
                  <label
                    key={opt.value}
                    className={`flex items-start gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all border-2 ${
                      formData.teamState === opt.value
                        ? 'bg-corporate-teal/10 border-corporate-teal text-corporate-navy dark:text-white font-medium'
                        : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="teamState"
                      checked={formData.teamState === opt.value}
                      onChange={() => handleChange('teamState', opt.value)}
                      className="w-4 h-4 mt-0.5 text-corporate-teal focus:ring-corporate-teal/50"
                    />
                    <div>
                      <span className="text-sm font-medium">{opt.label}:</span>
                      <span className="text-sm text-slate-500 dark:text-slate-400 ml-1">{opt.description}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ===== SECTION: Quick Reflection (Q5-Q6) ===== */}
        <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-4">Quick Reflection</h3>
          <div className="space-y-5">

            {/* Q5 — What would break */}
            <VoiceTextarea
              id="whatWouldBreak"
              label="5. If you left your role tomorrow, what would break first?"
              helpText="Be honest — what's most dependent on you?"
              value={formData.whatWouldBreak || ''}
              onChange={(val) => handleChange('whatWouldBreak', val)}
              placeholder="Type or tap the mic to speak..."
              rows={2}
              required
              error={errors.whatWouldBreak}
            />

            {/* Q6 — Catch phrase */}
            <VoiceTextarea
              id="catchPhrase"
              label="6. Describe your job using just a phrase you say over and over."
              value={formData.catchPhrase || ''}
              onChange={(val) => handleChange('catchPhrase', val)}
              placeholder='e.g., "Putting out fires" or "Herding cats"'
              rows={1}
              required
              error={errors.catchPhrase}
            />
          </div>
        </div>

        {/* ===== SECTION: Under Pressure (Q7-Q8) — Multi-select with Other ===== */}
        <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-4">Patterns & Energy</h3>
          <div className="space-y-5">

            {/* Q7 — Under pressure */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-corporate-navy dark:text-white">
                7. When I'm under pressure, I tend to… <span className="text-slate-400 font-normal">(select 1–2)</span> <span className="text-red-500">*</span>
              </label>
              {errors.underPressure && (
                <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.underPressure}</p>
              )}
              <div className="space-y-2">
                {UNDER_PRESSURE_OPTIONS.map(option => {
                  const selected = (formData.underPressure || []).includes(option);
                  return (
                    <label
                      key={option}
                      className={`flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer transition-all border-2 ${
                        selected
                          ? 'bg-corporate-teal/10 border-corporate-teal text-corporate-navy dark:text-white font-medium'
                          : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => {
                          const prev = formData.underPressure || [];
                          const next = selected ? prev.filter(o => o !== option) : [...prev, option];
                          handleChange('underPressure', next);
                        }}
                        className="w-4 h-4 rounded border-slate-300 text-corporate-teal focus:ring-corporate-teal/50"
                      />
                      <span className="text-sm">{option}</span>
                    </label>
                  );
                })}
                {/* Other */}
                <div className="flex items-start gap-3 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                  <span className="text-sm text-slate-500 pt-1">Other:</span>
                  <input
                    type="text"
                    value={formData.underPressureOther1 || ''}
                    onChange={e => handleChange('underPressureOther1', e.target.value)}
                    placeholder="..."
                    className="flex-1 px-2 py-1 text-sm border-b border-slate-300 dark:border-slate-600 bg-transparent focus:border-corporate-teal focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Q8 — Energy drain */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-corporate-navy dark:text-white">
                8. What drains my energy most as a leader is… <span className="text-slate-400 font-normal">(select 1–2)</span> <span className="text-red-500">*</span>
              </label>
              {errors.energyDrain && (
                <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.energyDrain}</p>
              )}
              <div className="space-y-2">
                {ENERGY_DRAIN_OPTIONS.map(option => {
                  const selected = (formData.energyDrain || []).includes(option);
                  return (
                    <label
                      key={option}
                      className={`flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer transition-all border-2 ${
                        selected
                          ? 'bg-corporate-teal/10 border-corporate-teal text-corporate-navy dark:text-white font-medium'
                          : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => {
                          const prev = formData.energyDrain || [];
                          const next = selected ? prev.filter(o => o !== option) : [...prev, option];
                          handleChange('energyDrain', next);
                        }}
                        className="w-4 h-4 rounded border-slate-300 text-corporate-teal focus:ring-corporate-teal/50"
                      />
                      <span className="text-sm">{option}</span>
                    </label>
                  );
                })}
                {/* Other */}
                <div className="flex items-start gap-3 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                  <span className="text-sm text-slate-500 pt-1">Other:</span>
                  <input
                    type="text"
                    value={formData.energyDrainOther1 || ''}
                    onChange={e => handleChange('energyDrainOther1', e.target.value)}
                    placeholder="..."
                    className="flex-1 px-2 py-1 text-sm border-b border-slate-300 dark:border-slate-600 bg-transparent focus:border-corporate-teal focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ===== SECTION: Foundation Goals (Q9-Q10) ===== */}
        <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-4">Foundation Goals</h3>
          <div className="space-y-5">

            {/* Q9 — Leadership muscle */}
            <VoiceTextarea
              id="leadershipMuscle"
              label="9. One leadership muscle I want to strengthen by the end of Foundation is…"
              value={formData.leadershipMuscle || ''}
              onChange={(val) => handleChange('leadershipMuscle', val)}
              placeholder="e.g., Giving more direct feedback, holding accountability conversations..."
              rows={2}
              required
              error={errors.leadershipMuscle}
            />

            {/* Q10 — Success definition */}
            <VoiceTextarea
              id="successDefinition"
              label="10. What would make this Foundation experience a success for you?"
              value={formData.successDefinition || ''}
              onChange={(val) => handleChange('successDefinition', val)}
              placeholder="Describe what success looks like for you..."
              rows={2}
              required
              error={errors.successDefinition}
            />
          </div>
        </div>

      </div>

      {/* Footer — consistent gray bar with action buttons */}
      <div className="px-5 py-4 border-t border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700/50 flex-shrink-0">
        <div className="flex items-center justify-between gap-3">
          {onClose && (
            <button
              onClick={onClose}
              className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 transition-colors text-sm font-medium"
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
    </div>
    </>
  );
};

export default LeaderProfileFormSimple;
