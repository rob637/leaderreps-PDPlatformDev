import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, ArrowLeft, Users, Building2, DollarSign,
  TrendingDown, Calculator, CheckCircle2, HelpCircle,
  Briefcase
} from 'lucide-react';
import { INDUSTRY_BENCHMARKS, SALARY_RANGES } from '../data/calculations';

const steps = [
  {
    id: 'leaders',
    title: 'Number of Leaders',
    subtitle: 'How many managers/leaders would you develop?',
    icon: Users,
  },
  {
    id: 'team-size',
    title: 'Average Team Size',
    subtitle: 'How many people does each leader manage?',
    icon: Users,
  },
  {
    id: 'industry',
    title: 'Your Industry',
    subtitle: 'Select your industry for accurate benchmarks',
    icon: Building2,
  },
  {
    id: 'salary',
    title: 'Average Salary',
    subtitle: 'Approximate salary of employees managed',
    icon: DollarSign,
  },
  {
    id: 'turnover',
    title: 'Current Turnover',
    subtitle: 'What\'s your current annual turnover rate?',
    icon: TrendingDown,
  },
  {
    id: 'investment',
    title: 'Training Investment',
    subtitle: 'Estimated investment per leader',
    icon: Briefcase,
  },
];

const CalculatorFlow = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [inputs, setInputs] = useState({
    numLeaders: 10,
    avgTeamSize: 8,
    industry: '',
    avgSalary: 75000,
    currentTurnover: null,
    trainingInvestment: 5000,
  });
  const [showTooltip, setShowTooltip] = useState(null);

  const progress = ((currentStep + 1) / steps.length) * 100;
  const step = steps[currentStep];

  const updateInput = (key, value) => {
    setInputs(prev => ({ ...prev, [key]: value }));
  };

  const canProceed = () => {
    switch (step.id) {
      case 'leaders': return inputs.numLeaders >= 1;
      case 'team-size': return inputs.avgTeamSize >= 1;
      case 'industry': return inputs.industry !== '';
      case 'salary': return inputs.avgSalary >= 20000;
      case 'turnover': return true; // Optional
      case 'investment': return inputs.trainingInvestment >= 100;
      default: return true;
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
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && canProceed()) {
      handleNext();
    }
  };

  useEffect(() => {
    window.addEventListener('keypress', handleKeyPress);
    return () => window.removeEventListener('keypress', handleKeyPress);
  }, [currentStep, inputs]);

  // Set default turnover when industry is selected
  useEffect(() => {
    if (inputs.industry && inputs.currentTurnover === null) {
      const industryData = INDUSTRY_BENCHMARKS[inputs.industry];
      if (industryData) {
        updateInput('currentTurnover', industryData.avgTurnover);
      }
    }
  }, [inputs.industry]);

  const renderStepContent = () => {
    switch (step.id) {
      case 'leaders':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="text-6xl sm:text-7xl font-bold text-corporate-navy mb-4">
                {inputs.numLeaders}
              </div>
              <div className="text-slate-500">leaders to develop</div>
            </div>
            <input
              type="range"
              min="1"
              max="100"
              value={inputs.numLeaders}
              onChange={(e) => updateInput('numLeaders', parseInt(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-slate-400">
              <span>1</span>
              <span>100</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[5, 10, 25, 50].map(n => (
                <button
                  key={n}
                  onClick={() => updateInput('numLeaders', n)}
                  className={`py-2 rounded-lg font-medium transition-colors ${
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
        );

      case 'team-size':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="text-6xl sm:text-7xl font-bold text-corporate-navy mb-4">
                {inputs.avgTeamSize}
              </div>
              <div className="text-slate-500">direct reports per leader</div>
            </div>
            <input
              type="range"
              min="1"
              max="30"
              value={inputs.avgTeamSize}
              onChange={(e) => updateInput('avgTeamSize', parseInt(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-slate-400">
              <span>1</span>
              <span>30</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[5, 8, 12, 20].map(n => (
                <button
                  key={n}
                  onClick={() => updateInput('avgTeamSize', n)}
                  className={`py-2 rounded-lg font-medium transition-colors ${
                    inputs.avgTeamSize === n
                      ? 'bg-corporate-teal text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
              <strong>Total employees impacted:</strong> {inputs.numLeaders * inputs.avgTeamSize} people
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

      case 'salary':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="text-5xl sm:text-6xl font-bold text-corporate-navy mb-4">
                ${inputs.avgSalary.toLocaleString()}
              </div>
              <div className="text-slate-500">average employee salary</div>
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
              <span>Consider the average salary of employees managed by these leaders, not the leaders themselves.</span>
            </div>
          </div>
        );

      case 'turnover':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="text-6xl sm:text-7xl font-bold text-corporate-navy mb-4">
                {inputs.currentTurnover ?? INDUSTRY_BENCHMARKS[inputs.industry]?.avgTurnover ?? 15}%
              </div>
              <div className="text-slate-500">annual turnover rate</div>
            </div>
            <input
              type="range"
              min="0"
              max="50"
              value={inputs.currentTurnover ?? INDUSTRY_BENCHMARKS[inputs.industry]?.avgTurnover ?? 15}
              onChange={(e) => updateInput('currentTurnover', parseInt(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-slate-400">
              <span>0%</span>
              <span>50%</span>
            </div>
            {inputs.industry && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
                <strong>Industry average:</strong> {INDUSTRY_BENCHMARKS[inputs.industry].avgTurnover}% for {INDUSTRY_BENCHMARKS[inputs.industry].name}
              </div>
            )}
            <button
              onClick={() => updateInput('currentTurnover', INDUSTRY_BENCHMARKS[inputs.industry]?.avgTurnover)}
              className="w-full py-2 text-sm text-corporate-teal hover:underline"
            >
              Use industry average
            </button>
          </div>
        );

      case 'investment':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="text-5xl sm:text-6xl font-bold text-corporate-navy mb-4">
                ${inputs.trainingInvestment.toLocaleString()}
              </div>
              <div className="text-slate-500">per leader investment</div>
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
                  ${(n/1000)}K
                </button>
              ))}
            </div>
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-sm text-emerald-800">
              <strong>Total investment:</strong> ${(inputs.trainingInvestment * inputs.numLeaders).toLocaleString()} for {inputs.numLeaders} leaders
            </div>
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
                    Calculate My ROI
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
