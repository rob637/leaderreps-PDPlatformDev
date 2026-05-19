import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight, ArrowLeft, Users, Building2, DollarSign,
  TrendingDown, Calculator, HelpCircle, Briefcase, UserCog, Target,
} from 'lucide-react';
import { INDUSTRY_BENCHMARKS, SALARY_RANGES, DEPARTMENTS } from '../data/calculations';

// Per the May 2026 design call: anchor on ONE leader and ONE direct report.
// Optional scaling lives in the "Scope" step but never as the headline.
const steps = [
  {
    id: 'scope',
    title: 'Scope',
    subtitle: 'Start with one leader, one direct report — scale only if you need to',
    icon: Users,
  },
  {
    id: 'department',
    title: 'Department',
    subtitle: 'Where does the leader you want to develop sit?',
    icon: Target,
  },
  {
    id: 'industry',
    title: 'Your Industry',
    subtitle: 'For turnover benchmarks only',
    icon: Building2,
  },
  {
    id: 'leader-salary',
    title: 'Leader Salary',
    subtitle: 'Fully-loaded annual cost of the leader being developed',
    icon: UserCog,
  },
  {
    id: 'report-salary',
    title: 'Direct Report Salary',
    subtitle: 'Average annual salary of the people they manage',
    icon: DollarSign,
  },
  {
    id: 'turnover',
    title: 'Turnover & Regretted Attrition',
    subtitle: 'Total turnover is noise — regretted attrition is the kicker',
    icon: TrendingDown,
  },
  {
    id: 'investment',
    title: 'Training Investment',
    subtitle: 'Annual investment per leader',
    icon: Briefcase,
  },
];

const CalculatorFlow = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [inputs, setInputs] = useState({
    numLeaders: 1,
    avgTeamSize: 1,
    department: '',
    industry: '',
    avgSalary: 75000,         // direct-report salary
    leaderSalary: 110000,     // leader salary (NEW)
    currentTurnover: null,
    regrettedAttrition: null, // NEW: % of departures the org didn't want to lose
    trainingInvestment: 5000,
    dealValue: null,          // optional, used by "land one more deal" scenario (sales only)
  });

  const progress = ((currentStep + 1) / steps.length) * 100;
  const step = steps[currentStep];
  const departmentData = useMemo(
    () => DEPARTMENTS[inputs.department] || null,
    [inputs.department],
  );
  const showDealValue = !!departmentData?.askDealValue;

  const updateInput = (key, value) => {
    setInputs(prev => ({ ...prev, [key]: value }));
  };

  const canProceed = () => {
    switch (step.id) {
      case 'scope':         return inputs.numLeaders >= 1 && inputs.avgTeamSize >= 1;
      case 'department':    return inputs.department !== '';
      case 'industry':      return inputs.industry !== '';
      case 'leader-salary': return inputs.leaderSalary >= 30000;
      case 'report-salary': return inputs.avgSalary >= 20000;
      case 'turnover':      return true; // optional
      case 'investment':    return inputs.trainingInvestment >= 100;
      default:              return true;
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onComplete(inputs);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep(prev => prev - 1);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && canProceed()) handleNext();
  };

  useEffect(() => {
    window.addEventListener('keypress', handleKeyPress);
    return () => window.removeEventListener('keypress', handleKeyPress);
  }, [currentStep, inputs]);

  // Set default turnover when industry is selected
  useEffect(() => {
    if (inputs.industry && inputs.currentTurnover === null) {
      const industryData = INDUSTRY_BENCHMARKS[inputs.industry];
      if (industryData) updateInput('currentTurnover', industryData.avgTurnover);
    }
  }, [inputs.industry]);

  const renderStepContent = () => {
    switch (step.id) {
      case 'scope':
        return (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
              <strong>Why start with one?</strong> The strongest case for leadership
              development is the per-leader case. Once you can defend it for one
              manager and one direct report, the same logic scales.
            </div>

            <div>
              <div className="flex items-baseline justify-between mb-2">
                <label className="text-sm font-medium text-slate-600">Leaders to develop</label>
                <span className="text-3xl font-bold text-corporate-navy">{inputs.numLeaders}</span>
              </div>
              <input
                type="range"
                min="1"
                max="50"
                value={inputs.numLeaders}
                onChange={(e) => updateInput('numLeaders', parseInt(e.target.value))}
                className="w-full"
              />
              <div className="grid grid-cols-4 gap-2 mt-2">
                {[1, 5, 10, 25].map(n => (
                  <button
                    key={n}
                    onClick={() => updateInput('numLeaders', n)}
                    className={`py-2 rounded-lg text-sm font-medium transition-colors ${
                      inputs.numLeaders === n
                        ? 'bg-corporate-teal text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-baseline justify-between mb-2">
                <label className="text-sm font-medium text-slate-600">Direct reports per leader</label>
                <span className="text-3xl font-bold text-corporate-navy">{inputs.avgTeamSize}</span>
              </div>
              <input
                type="range"
                min="1"
                max="20"
                value={inputs.avgTeamSize}
                onChange={(e) => updateInput('avgTeamSize', parseInt(e.target.value))}
                className="w-full"
              />
              <div className="grid grid-cols-4 gap-2 mt-2">
                {[1, 5, 8, 12].map(n => (
                  <button
                    key={n}
                    onClick={() => updateInput('avgTeamSize', n)}
                    className={`py-2 rounded-lg text-sm font-medium transition-colors ${
                      inputs.avgTeamSize === n
                        ? 'bg-corporate-teal text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case 'industry':
        return (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {Object.entries(INDUSTRY_BENCHMARKS).map(([key, data]) => (
              <button
                key={key}
                onClick={() => updateInput('industry', key)}
                className={`p-4 rounded-xl text-left transition-all ${
                  inputs.industry === key
                    ? 'bg-corporate-teal text-white shadow-lg scale-[1.02]'
                    : 'bg-white border-2 border-slate-200 hover:border-corporate-teal hover:shadow'
                }`}
              >
                <div className="text-2xl mb-2">{data.icon}</div>
                <div className={`font-medium text-sm ${inputs.industry === key ? 'text-white' : 'text-slate-700'}`}>
                  {data.name}
                </div>
                <div className={`text-xs mt-1 ${inputs.industry === key ? 'text-white/70' : 'text-slate-400'}`}>
                  {data.avgTurnover}% avg turnover
                </div>
              </button>
            ))}
          </div>
        );

      case 'department':
        return (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
              <strong>Why this matters:</strong> sales, engineering, and people-leader
              functions each have different attrition profiles and different upside levers.
              We'll tailor the third ROI scenario to your department.
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {Object.entries(DEPARTMENTS).map(([key, data]) => (
                <button
                  key={key}
                  onClick={() => updateInput('department', key)}
                  className={`p-4 rounded-xl text-left transition-all ${
                    inputs.department === key
                      ? 'bg-corporate-teal text-white shadow-lg scale-[1.02]'
                      : 'bg-white border-2 border-slate-200 hover:border-corporate-teal hover:shadow'
                  }`}
                >
                  <div className="text-2xl mb-2">{data.icon}</div>
                  <div className={`font-medium text-sm ${inputs.department === key ? 'text-white' : 'text-slate-700'}`}>
                    {data.name}
                  </div>
                  <div className={`text-xs mt-1 ${inputs.department === key ? 'text-white/70' : 'text-slate-400'}`}>
                    Healthy regretted: ≤{data.regrettedBaseline}%
                  </div>
                </button>
              ))}
            </div>
          </div>
        );

      case 'leader-salary':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="text-5xl sm:text-6xl font-bold text-corporate-navy mb-4">
                ${inputs.leaderSalary.toLocaleString()}
              </div>
              <div className="text-slate-500">leader / manager annual cost</div>
            </div>
            <input
              type="range"
              min="60000"
              max="300000"
              step="5000"
              value={inputs.leaderSalary}
              onChange={(e) => updateInput('leaderSalary', parseInt(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-slate-400">
              <span>$60K</span>
              <span>$300K</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[90000, 125000, 175000, 250000].map(n => (
                <button
                  key={n}
                  onClick={() => updateInput('leaderSalary', n)}
                  className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                    inputs.leaderSalary === n
                      ? 'bg-corporate-teal text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  ${(n / 1000)}K
                </button>
              ))}
            </div>
            <div className="flex items-start gap-2 text-sm text-slate-500">
              <HelpCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>
                Used to value the <strong>capacity</strong> a better-developed leader
                gets back each week (fewer fires, cleaner decisions).
              </span>
            </div>
          </div>
        );

      case 'report-salary':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="text-5xl sm:text-6xl font-bold text-corporate-navy mb-4">
                ${inputs.avgSalary.toLocaleString()}
              </div>
              <div className="text-slate-500">average direct-report salary</div>
            </div>
            <input
              type="range"
              min="30000"
              max="200000"
              step="5000"
              value={inputs.avgSalary}
              onChange={(e) => updateInput('avgSalary', parseInt(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-slate-400">
              <span>$30K</span>
              <span>$200K</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {Object.entries(SALARY_RANGES).map(([key, data]) => (
                <button
                  key={key}
                  onClick={() => updateInput('avgSalary', data.midpoint)}
                  className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                    inputs.avgSalary === data.midpoint
                      ? 'bg-corporate-teal text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {data.label}
                </button>
              ))}
            </div>
            <div className="flex items-start gap-2 text-sm text-slate-500">
              <HelpCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>
                Replacing a departing employee runs ~35% (entry) to ~150% (executive)
                of their salary once recruiting, ramp-up, and lost productivity are counted.
              </span>
            </div>
          </div>
        );

      case 'turnover': {
        const totalTurnover = inputs.currentTurnover ?? INDUSTRY_BENCHMARKS[inputs.industry]?.avgTurnover ?? 15;
        const regrettedDefault = departmentData?.regrettedBaseline ?? 5;
        const regretted = inputs.regrettedAttrition ?? regrettedDefault;
        const regrettedTier = regretted <= 5
          ? { label: 'Healthy', tone: 'text-emerald-700 bg-emerald-50 border-emerald-200' }
          : regretted <= 8
            ? { label: 'Watch', tone: 'text-amber-700 bg-amber-50 border-amber-200' }
            : { label: 'Problematic', tone: 'text-red-700 bg-red-50 border-red-200' };
        return (
          <div className="space-y-8">
            {/* Total turnover */}
            <div className="space-y-3">
              <div className="flex items-baseline justify-between">
                <label className="text-sm font-medium text-slate-600">Total annual turnover</label>
                <span className="text-3xl font-bold text-corporate-navy">{totalTurnover}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                value={totalTurnover}
                onChange={(e) => updateInput('currentTurnover', parseInt(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-slate-400">
                <span>0%</span>
                <span>50%</span>
              </div>
              {inputs.industry && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">
                  <strong>Industry average:</strong> {INDUSTRY_BENCHMARKS[inputs.industry].avgTurnover}% for {INDUSTRY_BENCHMARKS[inputs.industry].name}
                </div>
              )}
              <button
                onClick={() => updateInput('currentTurnover', INDUSTRY_BENCHMARKS[inputs.industry]?.avgTurnover)}
                className="w-full py-1 text-xs text-corporate-teal hover:underline"
              >
                Use industry average
              </button>
            </div>

            {/* Regretted attrition — the kicker */}
            <div className="space-y-3 border-t border-slate-200 pt-6">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
                <strong>This is the kicker.</strong> Regretted attrition is the share of
                departures you <em>didn't</em> want to lose. A great manager might
                actually <em>raise</em> total turnover by moving out underperformers
                — while <em>lowering</em> regretted attrition. That's the win.
              </div>
              <div className="flex items-baseline justify-between">
                <label className="text-sm font-medium text-slate-600">Regretted attrition</label>
                <span className="text-3xl font-bold text-corporate-navy">{regretted}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="25"
                value={regretted}
                onChange={(e) => updateInput('regrettedAttrition', parseInt(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-slate-400">
                <span>0%</span>
                <span>25%</span>
              </div>
              <div className={`rounded-xl p-3 text-xs border ${regrettedTier.tone}`}>
                <strong>{regrettedTier.label}.</strong> Tech-industry rule of thumb:
                ≤5% healthy · 5–8% watch · 8%+ problematic.
                {departmentData && (
                  <> Healthy benchmark for {departmentData.name}: ≤{departmentData.regrettedBaseline}%.</>
                )}
              </div>
            </div>
          </div>
        );
      }

      case 'investment':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="text-5xl sm:text-6xl font-bold text-corporate-navy mb-4">
                ${inputs.trainingInvestment.toLocaleString()}
              </div>
              <div className="text-slate-500">per leader, per year</div>
            </div>
            <input
              type="range"
              min="500"
              max="20000"
              step="500"
              value={inputs.trainingInvestment}
              onChange={(e) => updateInput('trainingInvestment', parseInt(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-slate-400">
              <span>$500</span>
              <span>$20,000</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[2000, 5000, 10000, 15000].map(n => (
                <button
                  key={n}
                  onClick={() => updateInput('trainingInvestment', n)}
                  className={`py-2 rounded-lg text-sm font-medium transition-colors ${
                    inputs.trainingInvestment === n
                      ? 'bg-corporate-teal text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  ${(n / 1000)}K
                </button>
              ))}
            </div>
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-sm text-emerald-800">
              <strong>Total investment:</strong> ${(inputs.trainingInvestment * inputs.numLeaders).toLocaleString()} for {inputs.numLeaders} leader{inputs.numLeaders !== 1 ? 's' : ''}
            </div>

            {/* Optional: typical deal value (sales only) */}
            {showDealValue && (
              <div className="border-t border-slate-200 pt-4">
                <label className="text-sm font-medium text-slate-600 mb-2 block">
                  Typical deal value <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <input
                  type="number"
                  value={inputs.dealValue || ''}
                  onChange={(e) => updateInput('dealValue', e.target.value ? parseInt(e.target.value) : null)}
                  placeholder="e.g. 50000"
                  className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-corporate-teal focus:outline-none"
                />
                <p className="text-xs text-slate-500 mt-2">
                  Sales-specific. We'll use it in the "land one more deal" scenario.
                  Skip and we'll show an illustrative figure.
                </p>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header with progress */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <img
                src="/logo-full.png"
                alt="LeaderReps"
                className="h-6"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            </div>
            <span className="text-sm text-slate-500">
              Step {currentStep + 1} of {steps.length}
            </span>
          </div>
          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-corporate-teal to-corporate-navy rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {/* Step header */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-corporate-teal/20 to-corporate-navy/20 flex items-center justify-center mx-auto mb-4">
                <step.icon className="w-8 h-8 text-corporate-teal" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-corporate-navy mb-2">
                {step.title}
              </h2>
              <p className="text-slate-500">{step.subtitle}</p>
            </div>

            {/* Step content */}
            <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 mb-8">
              {renderStepContent()}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <button
                onClick={handleBack}
                disabled={currentStep === 0}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  currentStep === 0
                    ? 'text-slate-300 cursor-not-allowed'
                    : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>

              <button
                onClick={handleNext}
                disabled={!canProceed()}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${
                  canProceed()
                    ? 'bg-corporate-teal text-white hover:bg-emerald-600 shadow-lg hover:shadow-xl'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                {currentStep === steps.length - 1 ? (
                  <>
                    <Calculator className="w-5 h-5" />
                    See My ROI
                  </>
                ) : (
                  <>
                    Continue
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default CalculatorFlow;
