import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, User, Building2, Briefcase, ArrowRight, Sparkles, Lock, CheckCircle2 } from 'lucide-react';
import { formatCurrency } from '../data/calculations';

const EmailCapture = ({ results, onSubmit, isLoading }) => {
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    company: '',
    title: '',
  });
  const [errors, setErrors] = useState({});

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const newErrors = {};
    if (!formData.email) newErrors.email = 'Email is required';
    else if (!validateEmail(formData.email)) newErrors.email = 'Please enter a valid email';
    if (!formData.firstName) newErrors.firstName = 'First name is required';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    onSubmit(formData);
  };

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100"
    >
      <div className="max-w-5xl mx-auto px-4 py-8 sm:py-12">
        <div className="grid lg:grid-cols-2 gap-8 items-start">
          {/* Results Preview */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-corporate-navy to-corporate-navy/90 rounded-3xl p-8 text-white"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 text-sm mb-6">
              <Sparkles className="w-4 h-4 text-yellow-400" />
              Your Results Preview
            </div>
            
            <h2 className="text-2xl sm:text-3xl font-bold mb-2">
              Your Potential Savings
            </h2>
            <p className="text-white/60 mb-8">Unlock your full report by providing your details below.</p>
            
            {/* Blurred preview */}
            <div className="space-y-6">
              <div className="bg-white/10 rounded-2xl p-6 relative overflow-hidden">
                <div className="text-white/60 text-sm mb-2">Annual Savings</div>
                <div className="text-4xl sm:text-5xl font-bold text-emerald-400">
                  {formatCurrency(results?.totalAnnualSavings || 0)}
                </div>
                <div className="text-white/40 text-sm mt-2">
                  with {results?.numLeaders || 0} leaders impacting {results?.totalEmployeesImpacted || 0} employees
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 rounded-xl p-4 relative">
                  <div className="text-white/40 text-xs mb-1">ROI</div>
                  <div className="text-2xl font-bold text-emerald-400 blur-sm select-none">
                    {results?.roiPercentage || 0}%
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center bg-white/5 rounded-xl backdrop-blur-sm">
                    <Lock className="w-4 h-4 text-white/40" />
                  </div>
                </div>
                <div className="bg-white/5 rounded-xl p-4 relative">
                  <div className="text-white/40 text-xs mb-1">Payback</div>
                  <div className="text-2xl font-bold text-cyan-400 blur-sm select-none">
                    {results?.paybackMonths || 0} mo
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center bg-white/5 rounded-xl backdrop-blur-sm">
                    <Lock className="w-4 h-4 text-white/40" />
                  </div>
                </div>
              </div>
              
              <div className="bg-white/5 rounded-xl p-4">
                <div className="text-white/40 text-xs mb-3">Savings Breakdown</div>
                <div className="space-y-2">
                  {[
                    { label: 'Turnover Savings', blurred: true },
                    { label: 'Productivity Gains', blurred: true },
                    { label: 'Absenteeism Reduction', blurred: true },
                  ].map((item, i) => (
                    <div key={i} className="flex justify-between items-center">
                      <span className="text-white/60 text-sm">{item.label}</span>
                      <span className="text-white font-medium blur-sm">$XXX,XXX</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
          
          {/* Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-3xl shadow-xl p-8"
          >
            <img 
              src="/logo-full.png" 
              alt="LeaderReps" 
              className="h-8 mb-6"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
            
            <h2 className="text-2xl font-bold text-corporate-navy mb-2">
              Get Your Full Report
            </h2>
            <p className="text-slate-500 mb-6">
              Enter your details to unlock your complete ROI analysis with AI-powered insights.
            </p>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    First Name *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => updateField('firstName', e.target.value)}
                      placeholder="John"
                      className={`w-full pl-10 pr-4 py-3 rounded-xl border ${
                        errors.firstName ? 'border-red-300 bg-red-50' : 'border-slate-200'
                      } focus:border-corporate-teal transition-colors`}
                    />
                  </div>
                  {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => updateField('lastName', e.target.value)}
                    placeholder="Smith"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-corporate-teal transition-colors"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Work Email *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    placeholder="john@company.com"
                    className={`w-full pl-10 pr-4 py-3 rounded-xl border ${
                      errors.email ? 'border-red-300 bg-red-50' : 'border-slate-200'
                    } focus:border-corporate-teal transition-colors`}
                  />
                </div>
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Company
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) => updateField('company', e.target.value)}
                    placeholder="Acme Inc."
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-corporate-teal transition-colors"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Job Title
                </label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => updateField('title', e.target.value)}
                    placeholder="HR Director"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-corporate-teal transition-colors"
                  />
                </div>
              </div>
              
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full flex items-center justify-center gap-3 py-4 rounded-xl font-bold text-lg transition-all ${
                  isLoading
                    ? 'bg-slate-200 text-slate-400 cursor-wait'
                    : 'bg-corporate-teal text-white hover:bg-emerald-600 shadow-lg hover:shadow-xl'
                }`}
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Generating Your Report...
                  </>
                ) : (
                  <>
                    Unlock My Full Report
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
            
            <div className="mt-6 space-y-3">
              <div className="flex items-start gap-2 text-sm text-slate-500">
                <CheckCircle2 className="w-4 h-4 text-corporate-teal mt-0.5 flex-shrink-0" />
                <span>Complete breakdown of turnover, productivity, and engagement savings</span>
              </div>
              <div className="flex items-start gap-2 text-sm text-slate-500">
                <CheckCircle2 className="w-4 h-4 text-corporate-teal mt-0.5 flex-shrink-0" />
                <span>AI-powered recommendations tailored to your industry</span>
              </div>
              <div className="flex items-start gap-2 text-sm text-slate-500">
                <CheckCircle2 className="w-4 h-4 text-corporate-teal mt-0.5 flex-shrink-0" />
                <span>Shareable executive summary for stakeholder buy-in</span>
              </div>
            </div>
            
            <p className="text-xs text-slate-400 mt-6 text-center">
              By submitting, you agree to receive occasional leadership insights. Unsubscribe anytime.
            </p>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default EmailCapture;
