import React, { useState, useEffect } from 'react';
import { 
  User, Building2, Briefcase, Users, Target, Clock, 
  CheckCircle, ChevronRight, ChevronLeft, Save, Loader,
  Phone, Mail, MapPin, Award, Sparkles, AlertCircle
} from 'lucide-react';
import { Card, Button } from '../ui';
import { useLeaderProfile } from '../../hooks/useLeaderProfile';

// Company size options
const COMPANY_SIZES = [
  { value: '1-10', label: '1-10' },
  { value: '11-50', label: '11-50' },
  { value: '51-200', label: '51-200' },
  { value: '200+', label: '200+' },
  { value: 'n/a', label: 'n/a' }
];

// Industry options
const INDUSTRIES = [
  'Technology', 'Healthcare', 'Finance & Banking', 'Manufacturing',
  'Retail & Consumer Goods', 'Professional Services', 'Education',
  'Government', 'Non-Profit', 'Construction', 'Transportation & Logistics',
  'Energy & Utilities', 'Media & Entertainment', 'Other'
];

// Years in role options
const YEARS_OPTIONS = [
  { value: '<1', label: 'Less than 1 year' },
  { value: '1-2', label: '1-2 years' },
  { value: '3-5', label: '3-5 years' },
  { value: '6-10', label: '6-10 years' },
  { value: '10+', label: '10+ years' }
];

// Direct reports options
const DIRECT_REPORTS_OPTIONS = [
  { value: '0', label: 'None yet!' },
  { value: '1-2', label: '1-2' },
  { value: '3-5', label: '3-5' },
  { value: '6-10', label: '6-10' },
  { value: '11+', label: '11+' }
];

// Years managing options
const YEARS_MANAGING_OPTIONS = [
  { value: '0', label: 'None yet!' },
  { value: '<1', label: '<1' },
  { value: '1', label: '1' },
  { value: '2', label: '2' },
  { value: '3', label: '3' },
  { value: '4+', label: '4+' }
];

// Feedback preference options
const FEEDBACK_PREFERENCE_OPTIONS = [
  { value: 'direct', label: 'Direct and to the point' },
  { value: 'encouraging', label: 'Encouraging and positive' },
  { value: 'examples', label: 'Clear examples and suggestions' }
];

// Learning time preferences
const LEARNING_TIMES = [
  { value: 'early-morning', label: 'Early Morning (5-7am)', icon: '🌅' },
  { value: 'morning', label: 'Morning (7-10am)', icon: '☀️' },
  { value: 'midday', label: 'Midday (10am-2pm)', icon: '🌤️' },
  { value: 'afternoon', label: 'Afternoon (2-5pm)', icon: '⛅' },
  { value: 'evening', label: 'Evening (5-8pm)', icon: '🌆' },
  { value: 'night', label: 'Night (8pm+)', icon: '🌙' }
];

// Step configuration
const STEPS = [
  { id: 'personal', title: 'Personal Info', icon: User, description: 'Basic contact information' },
  { id: 'professional', title: 'Professional', icon: Building2, description: 'Your role and company' },
  { id: 'leadership', title: 'Leadership', icon: Award, description: 'Your leadership context' },
  { id: 'goals', title: 'Goals', icon: Target, description: 'What you want to achieve' }
];

const LeaderProfileForm = ({ onComplete, onClose, isModal = true }) => {
  const { profile, loading, saving, saveProfile, isComplete: profileAlreadyComplete } = useLeaderProfile();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [showSuccess, setShowSuccess] = useState(false);

  // Initialize form data from profile
  useEffect(() => {
    if (profile) {
      setFormData(profile);
    }
  }, [profile]);

  // Handle field change
  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user types
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  // Validate current step
  const validateStep = () => {
    const newErrors = {};
    
    if (currentStep === 0) {
      if (!formData.firstName?.trim()) newErrors.firstName = 'First name is required';
      if (!formData.lastName?.trim()) newErrors.lastName = 'Last name is required';
      if (!formData.email?.trim()) newErrors.email = 'Email is required';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'Please enter a valid email';
      }
    }
    
    if (currentStep === 1) {
      if (!formData.companyName?.trim()) newErrors.companyName = 'Company name is required';
      if (!formData.department?.trim()) newErrors.department = 'Department is required';
      if (!formData.companySize) newErrors.companySize = 'Please select company size';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle next step
  const handleNext = async () => {
    if (!validateStep()) return;
    
    // Auto-save progress
    await saveProfile(formData, false);
    
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  // Handle previous step
  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  // Handle form completion
  const handleComplete = async () => {
    if (!validateStep()) return;
    
    const success = await saveProfile(formData, true);
    
    if (success) {
      setShowSuccess(true);
      setTimeout(() => {
        onComplete?.();
      }, 2000);
    }
  };

  // Render input field
  const renderInput = (field, label, type = 'text', required = false, placeholder = '', helpText = '') => (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-slate-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        value={formData[field] || ''}
        onChange={e => handleChange(field, e.target.value)}
        placeholder={placeholder}
        className={`w-full px-4 py-3 rounded-xl border-2 transition-all
          ${errors[field] 
            ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-200' 
            : 'border-slate-200 bg-white focus:border-corporate-teal focus:ring-corporate-teal/20'
          }
          focus:outline-none focus:ring-4`}
      />
      {helpText && !errors[field] && (
        <p className="text-xs text-slate-500">{helpText}</p>
      )}
      {errors[field] && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" /> {errors[field]}
        </p>
      )}
    </div>
  );

  // Render select field
  const renderSelect = (field, label, options, required = false, placeholder = 'Select...') => (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-slate-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <select
        value={formData[field] || ''}
        onChange={e => handleChange(field, e.target.value)}
        className={`w-full px-4 py-3 rounded-xl border-2 transition-all appearance-none bg-white
          ${errors[field] 
            ? 'border-red-300 bg-red-50' 
            : 'border-slate-200 focus:border-corporate-teal'
          }
          focus:outline-none focus:ring-4 focus:ring-corporate-teal/20`}
      >
        <option value="">{placeholder}</option>
        {options.map(opt => (
          <option key={opt.value || opt} value={opt.value || opt}>
            {opt.label || opt}
          </option>
        ))}
      </select>
      {errors[field] && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" /> {errors[field]}
        </p>
      )}
    </div>
  );

  // Render textarea
  const renderTextarea = (field, label, placeholder = '', rows = 3) => (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-slate-700">{label}</label>
      <textarea
        value={formData[field] || ''}
        onChange={e => handleChange(field, e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 bg-white
          focus:border-corporate-teal focus:outline-none focus:ring-4 focus:ring-corporate-teal/20
          resize-none transition-all"
      />
    </div>
  );

  // Render option cards (for single select visual options)
  const renderOptionCards = (field, options) => (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      {options.map(opt => (
        <button
          key={opt.value}
          type="button"
          onClick={() => handleChange(field, opt.value)}
          className={`p-3 rounded-xl border-2 transition-all text-left
            ${formData[field] === opt.value
              ? 'border-corporate-teal bg-corporate-teal/10 text-corporate-teal'
              : 'border-slate-200 hover:border-slate-300 bg-white'
            }`}
        >
          {opt.icon && <span className="text-lg mr-1">{opt.icon}</span>}
          <span className="text-sm font-medium">{opt.label}</span>
        </button>
      ))}
    </div>
  );

  // Render linear scale
  const renderLinearScale = (field, label, minLabel = 'Not Comfortable', maxLabel = 'Very Comfortable') => (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-700">{label}</label>
      <div className="flex items-center justify-between px-2 bg-slate-50 p-3 rounded-xl">
        <span className="text-xs text-slate-500 w-20">{minLabel}</span>
        <div className="flex gap-4 sm:gap-8">
          {[1, 2, 3, 4, 5].map(val => (
            <label key={val} className="flex flex-col items-center cursor-pointer group">
              <input
                type="radio"
                name={field}
                value={val}
                checked={parseInt(formData[field]) === val}
                onChange={() => handleChange(field, val)}
                className="w-5 h-5 text-corporate-teal focus:ring-corporate-teal border-slate-300 cursor-pointer"
              />
              <span className={`text-xs mt-1 font-medium ${parseInt(formData[field]) === val ? 'text-corporate-teal' : 'text-slate-400 group-hover:text-slate-600'}`}>{val}</span>
            </label>
          ))}
        </div>
        <span className="text-xs text-slate-500 w-20 text-right">{maxLabel}</span>
      </div>
    </div>
  );

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Personal Info
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {renderInput('firstName', 'First Name', 'text', true, 'John')}
              {renderInput('lastName', 'Last Name', 'text', true, 'Smith')}
            </div>
            {renderInput('email', 'Email Address', 'email', true, 'john@company.com')}
            {renderInput('phoneNumber', 'Phone Number', 'tel', false, '+1 (555) 123-4567',
              'By providing your phone number, you consent to receive text messages including habit reminders and notifications of upcoming event dates and times.'
            )}
            {formData.phoneNumber && (
              <label className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">
                <input
                  type="checkbox"
                  checked={formData.preferSMS || false}
                  onChange={e => handleChange('preferSMS', e.target.checked)}
                  className="rounded border-slate-300 text-corporate-teal focus:ring-corporate-teal"
                />
                I consent to receive SMS notifications about QuickStart events and reminders
              </label>
            )}
          </div>
        );

      case 1: // Professional
        return (
          <div className="space-y-4">
            {renderInput('companyName', 'Company Name', 'text', true, 'Acme Corporation')}
            {renderSelect('companySize', 'Company Size (# of employees)', COMPANY_SIZES, true)}
            {renderSelect('industry', 'Industry', INDUSTRIES.map(i => ({ value: i, label: i })))}
            {renderInput('department', 'Department or Function', 'text', true, 'e.g., Sales, Marketing, Operations, etc.')}
            {renderInput('jobTitle', 'Current Job Title', 'text', true)}
            {renderTextarea('roleResponsibility', 'In your role, what are you responsible for delivering?', 'We\'re looking for more of an understanding of your current role, not just title.')}
          </div>
        );

      case 2: // Leadership
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
                {renderSelect('yearsInRole', 'Years in Current Role', YEARS_OPTIONS)}
                {renderSelect('directReports', 'How many direct reports do you have?', DIRECT_REPORTS_OPTIONS)}
            </div>
            {renderSelect('yearsManaging', 'How many years of experience do you have managing direct reports?', YEARS_MANAGING_OPTIONS)}
            
            {renderTextarea('leadershipStyleDescription', 'Describe your leadership style in 1-2 sentences.')}
            {renderTextarea('currentHabit', 'What is one leadership habit or mindset you\'re working on right now?')}
            {renderTextarea('successDefinition', 'What would success look like for you at the end of this program?')}
            
            <div className="space-y-4 pt-4 border-t border-slate-100">
                {renderLinearScale('feedbackReceptionScore', 'On a scale of 1-5, how comfortable are you receiving feedback?')}
                {renderLinearScale('feedbackGivingScore', 'On a scale of 1-5, how comfortable are you giving feedback?')}
            </div>

            <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">What type of feedback helps you grow the most?</label>
                <div className="space-y-2">
                    {FEEDBACK_PREFERENCE_OPTIONS.map(opt => (
                        <label key={opt.value} className="flex items-center gap-3 p-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                            <input
                                type="radio"
                                name="feedbackPreference"
                                value={opt.value}
                                checked={formData.feedbackPreference === opt.value}
                                onChange={() => handleChange('feedbackPreference', opt.value)}
                                className="w-4 h-4 text-corporate-teal focus:ring-corporate-teal border-slate-300"
                            />
                            <span className="text-sm text-slate-700">{opt.label}</span>
                        </label>
                    ))}
                </div>
            </div>

            <div className="space-y-1 pt-4 border-t border-slate-100">
              <label className="block text-sm font-medium text-slate-700">
                Preferred Learning Time
              </label>
              <p className="text-xs text-slate-500 mb-2">When do you typically have time for leadership development?</p>
              {renderOptionCards('preferredLearningTime', LEARNING_TIMES)}
            </div>
          </div>
        );

      case 3: // Goals
        return (
          <div className="space-y-4">
            {renderTextarea('biggestChallenge', 'What is your biggest leadership challenge right now?',
              'e.g., Managing a growing team, giving difficult feedback, time management...'
            )}
            {renderTextarea('primaryGoal', 'What do you hope to achieve through QuickStart?',
              'e.g., Become more confident in difficult conversations, build a stronger team culture...'
            )}
            <div className="bg-gradient-to-r from-corporate-teal/10 to-corporate-orange/10 p-4 rounded-xl border border-corporate-teal/20">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-corporate-orange mt-0.5" />
                <div>
                  <h4 className="font-semibold text-corporate-navy">You're almost there!</h4>
                  <p className="text-sm text-slate-600 mt-1">
                    Your responses help us personalize your QuickStart journey. 
                    We'll use this to recommend relevant content and coaching.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="w-8 h-8 animate-spin text-corporate-teal" />
      </div>
    );
  }

  if (showSuccess) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <CheckCircle className="w-10 h-10 text-green-500" />
        </div>
        <h3 className="text-xl font-bold text-corporate-navy mb-2">Profile Complete!</h3>
        <p className="text-slate-600">Welcome to QuickStart Leadership Development</p>
      </div>
    );
  }

  const currentStepData = STEPS[currentStep];
  const StepIcon = currentStepData.icon;

  // Handle save and exit
  const handleSaveAndExit = async () => {
    await saveProfile(formData, false);
    onClose?.();
  };

  return (
    <div className={`${isModal ? 'bg-white rounded-2xl shadow-xl overflow-hidden w-full mx-auto' : ''}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-corporate-navy to-corporate-navy/90 text-white p-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <User className="w-6 h-6" />
          Complete Your Leader Profile
        </h2>
        <p className="text-white/80 mt-1">Help us personalize your leadership journey</p>
        
        {/* Progress bar */}
        <div className="mt-4">
          <div className="flex justify-between text-xs text-white/60 mb-1">
            <span>Progress</span>
            <span>{Math.round(((currentStep + 1) / STEPS.length) * 100)}%</span>
          </div>
          <div className="h-2 bg-white/20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-corporate-teal transition-all duration-500"
              style={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Step Indicators */}
      <div className="flex border-b border-slate-200 bg-slate-50">
        {STEPS.map((step, idx) => {
          const Icon = step.icon;
          const isActive = idx === currentStep;
          const isComplete = idx < currentStep;
          
          return (
            <button
              key={step.id}
              onClick={() => idx <= currentStep && setCurrentStep(idx)}
              disabled={idx > currentStep}
              className={`flex-1 py-3 px-2 text-center transition-all
                ${isActive 
                  ? 'bg-white border-b-2 border-corporate-teal' 
                  : isComplete
                    ? 'text-corporate-teal hover:bg-white/50 cursor-pointer'
                    : 'text-slate-400 cursor-not-allowed'
                }`}
            >
              <div className="flex flex-col items-center gap-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center
                  ${isActive 
                    ? 'bg-corporate-teal text-white' 
                    : isComplete
                      ? 'bg-corporate-teal/20 text-corporate-teal'
                      : 'bg-slate-200 text-slate-400'
                  }`}
                >
                  {isComplete ? <CheckCircle className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                </div>
                <span className={`text-xs font-medium hidden sm:block
                  ${isActive ? 'text-corporate-navy' : ''}`}
                >
                  {step.title}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Form Content */}
      <div className="p-6">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <StepIcon className="w-5 h-5 text-corporate-teal" />
            <h3 className="text-lg font-bold text-corporate-navy">{currentStepData.title}</h3>
          </div>
          <p className="text-sm text-slate-500">{currentStepData.description}</p>
        </div>

        {renderStepContent()}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between p-4 bg-slate-50 border-t border-slate-200">
        <button
          onClick={currentStep === 0 ? onClose : handlePrevious}
          className="flex items-center gap-1 px-4 py-2 text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          {currentStep === 0 ? 'Cancel' : 'Back'}
        </button>

        <div className="flex items-center gap-3">
          {/* Save & Exit - available on middle steps only (not first, not last) */}
          {currentStep > 0 && currentStep < STEPS.length - 1 && (
            <button
              onClick={handleSaveAndExit}
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 text-slate-600 hover:text-slate-900 border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors text-sm font-medium"
            >
              <Save className="w-4 h-4" />
              Save & Exit
            </button>
          )}

          {currentStep < STEPS.length - 1 ? (
            <Button
              onClick={handleNext}
              disabled={saving}
              className="flex items-center gap-2"
            >
              {saving ? <Loader className="w-4 h-4 animate-spin" /> : null}
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              onClick={handleComplete}
              disabled={saving}
              variant="primary"
              className="flex items-center gap-2 bg-corporate-teal hover:bg-corporate-teal/90"
            >
              {saving ? <Loader className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              {profileAlreadyComplete ? 'Update Profile' : 'Complete Profile'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeaderProfileForm;
