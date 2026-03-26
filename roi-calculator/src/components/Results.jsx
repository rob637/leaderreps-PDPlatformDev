import { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { 
  TrendingUp, 
  DollarSign, 
  Users, 
  Clock, 
  Calendar,
  ArrowRight,
  Download,
  Share2,
  BarChart3,
  PiggyBank,
  Target,
  Zap,
  CheckCircle2,
  ArrowUpRight,
  RefreshCw
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { formatCurrency, formatPercent, LEADERSHIP_IMPACT } from '../data/calculations';

const COLORS = {
  teal: '#47A88D',
  navy: '#002E47',
  orange: '#E04E1B',
  cyan: '#06B6D4',
  emerald: '#10B981',
  slate: '#64748B',
};

const Results = ({ results, inputs, onRestart }) => {
  const hasAnimated = useRef(false);
  
  useEffect(() => {
    if (!hasAnimated.current) {
      hasAnimated.current = true;
      // Celebration confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#47A88D', '#002E47', '#E04E1B', '#10B981'],
      });
    }
  }, []);
  
  const {
    totalAnnualSavings,
    roiPercentage,
    paybackMonths,
    turnoverSavings,
    productivityGains,
    absenteeismSavings,
    engagementValue,
    totalInvestment,
    savingsRange,
    numLeaders,
    totalEmployeesImpacted,
  } = results;
  
  // Chart data
  const savingsBreakdown = [
    { name: 'Reduced Turnover', value: turnoverSavings, color: COLORS.teal },
    { name: 'Productivity Gains', value: productivityGains, color: COLORS.cyan },
    { name: 'Absenteeism Reduction', value: absenteeismSavings, color: COLORS.emerald },
    { name: 'Engagement Boost', value: engagementValue, color: COLORS.orange },
  ].filter(item => item.value > 0);
  
  const roiOverTime = [
    { month: 'M1', savings: totalAnnualSavings / 12, investment: totalInvestment, cumulative: totalAnnualSavings / 12 - totalInvestment },
    { month: 'M2', savings: totalAnnualSavings / 12 * 2, investment: totalInvestment, cumulative: totalAnnualSavings / 12 * 2 - totalInvestment },
    { month: 'M3', savings: totalAnnualSavings / 12 * 3, investment: totalInvestment, cumulative: totalAnnualSavings / 12 * 3 - totalInvestment },
    { month: 'M6', savings: totalAnnualSavings / 12 * 6, investment: totalInvestment, cumulative: totalAnnualSavings / 12 * 6 - totalInvestment },
    { month: '1Y', savings: totalAnnualSavings, investment: totalInvestment, cumulative: totalAnnualSavings - totalInvestment },
    { month: '3Y', savings: totalAnnualSavings * 3, investment: totalInvestment, cumulative: totalAnnualSavings * 3 - totalInvestment },
  ];
  
  const impactMetrics = [
    { 
      label: 'Turnover Reduction', 
      before: `${inputs?.turnoverRate || 15}%`,
      after: `${Math.round((inputs?.turnoverRate || 15) * (1 - LEADERSHIP_IMPACT.turnoverReduction.moderate))}%`,
      improvement: `${Math.round(LEADERSHIP_IMPACT.turnoverReduction.moderate * 100)}%`
    },
    { 
      label: 'Productivity Increase',
      before: 'Baseline',
      after: `+${Math.round(LEADERSHIP_IMPACT.productivityGain.moderate * 100)}%`,
      improvement: `${Math.round(LEADERSHIP_IMPACT.productivityGain.moderate * 100)}%`
    },
    { 
      label: 'Engagement Score',
      before: '30%',
      after: '65%+',
      improvement: `${Math.round(LEADERSHIP_IMPACT.absenteeismReduction.moderate * 100)}%`
    },
  ];
  
  const handleShare = async () => {
    const shareText = `I just calculated my organization's leadership development ROI: ${formatCurrency(totalAnnualSavings)} in annual savings with a ${roiPercentage}% return. Try it yourself!`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Leadership Development ROI Calculator',
          text: shareText,
          url: window.location.href,
        });
      } catch (err) {
        // User cancelled or error
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(shareText + ' ' + window.location.href);
      alert('Results copied to clipboard!');
    }
  };
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-corporate-navy via-corporate-navy to-corporate-navy/90 text-white py-8 sm:py-12">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/20 text-emerald-300 text-sm font-medium mb-4">
              <CheckCircle2 className="w-4 h-4" />
              Analysis Complete
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
              Your Leadership Development ROI
            </h1>
            <p className="text-white/70 text-lg max-w-2xl mx-auto">
              Based on {numLeaders} leader{numLeaders !== 1 ? 's' : ''} impacting {totalEmployeesImpacted} employees in the {inputs?.industry || 'your'} industry
            </p>
          </motion.div>
        </div>
      </div>
      
      {/* Main Stats */}
      <div className="max-w-6xl mx-auto px-4 -mt-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid sm:grid-cols-3 gap-4"
        >
          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-6 text-white shadow-xl">
            <div className="flex items-center gap-2 text-emerald-100 text-sm mb-2">
              <DollarSign className="w-4 h-4" />
              Annual Savings
            </div>
            <div className="text-3xl sm:text-4xl font-bold">
              {formatCurrency(totalAnnualSavings)}
            </div>
            <div className="text-emerald-100 text-sm mt-2">
              Range: {formatCurrency(savingsRange.conservative)} - {formatCurrency(savingsRange.optimistic)}
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-2xl p-6 text-white shadow-xl">
            <div className="flex items-center gap-2 text-cyan-100 text-sm mb-2">
              <TrendingUp className="w-4 h-4" />
              Return on Investment
            </div>
            <div className="text-3xl sm:text-4xl font-bold">
              {roiPercentage}%
            </div>
            <div className="text-cyan-100 text-sm mt-2">
              For every $1 invested
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-corporate-navy to-slate-800 rounded-2xl p-6 text-white shadow-xl">
            <div className="flex items-center gap-2 text-slate-300 text-sm mb-2">
              <Clock className="w-4 h-4" />
              Payback Period
            </div>
            <div className="text-3xl sm:text-4xl font-bold">
              {paybackMonths} months
            </div>
            <div className="text-slate-300 text-sm mt-2">
              Investment: {formatCurrency(totalInvestment)}
            </div>
          </div>
        </motion.div>
      </div>
      
      {/* Charts Section */}
      <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Savings Breakdown Pie */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl shadow-lg p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-corporate-teal/10 flex items-center justify-center">
                <PiggyBank className="w-5 h-5 text-corporate-teal" />
              </div>
              <div>
                <h3 className="font-bold text-corporate-navy">Savings Breakdown</h3>
                <p className="text-slate-500 text-sm">Where your savings come from</p>
              </div>
            </div>
            
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={savingsBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                  >
                    {savingsBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => formatCurrency(value)}
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: 'none', 
                      borderRadius: '12px', 
                      boxShadow: '0 4px 20px rgba(0,0,0,0.1)' 
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="grid grid-cols-2 gap-3 mt-4">
              {savingsBreakdown.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm text-slate-600">{item.name}</span>
                </div>
              ))}
            </div>
          </motion.div>
          
          {/* ROI Over Time */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-2xl shadow-lg p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-cyan-500" />
              </div>
              <div>
                <h3 className="font-bold text-corporate-navy">Cumulative ROI Over Time</h3>
                <p className="text-slate-500 text-sm">Your net return trajectory</p>
              </div>
            </div>
            
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={roiOverTime}>
                  <defs>
                    <linearGradient id="colorSavings" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.teal} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={COLORS.teal} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" axisLine={false} tickLine={false} />
                  <YAxis 
                    tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`} 
                    axisLine={false} 
                    tickLine={false}
                  />
                  <Tooltip
                    formatter={(value) => formatCurrency(value)}
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: 'none', 
                      borderRadius: '12px', 
                      boxShadow: '0 4px 20px rgba(0,0,0,0.1)' 
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="cumulative"
                    stroke={COLORS.teal}
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorSavings)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>
        
        {/* Impact Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-2xl shadow-lg p-6 mt-8"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
              <Target className="w-5 h-5 text-corporate-orange" />
            </div>
            <div>
              <h3 className="font-bold text-corporate-navy">Projected Impact Metrics</h3>
              <p className="text-slate-500 text-sm">Before and after leadership development</p>
            </div>
          </div>
          
          <div className="grid sm:grid-cols-3 gap-6">
            {impactMetrics.map((metric, i) => (
              <div key={i} className="bg-slate-50 rounded-xl p-4">
                <div className="text-sm font-medium text-slate-600 mb-3">{metric.label}</div>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className="text-xs text-slate-400 mb-1">Before</div>
                    <div className="text-lg font-bold text-slate-500">{metric.before}</div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-corporate-teal" />
                  <div className="text-center">
                    <div className="text-xs text-slate-400 mb-1">After</div>
                    <div className="text-lg font-bold text-emerald-600">{metric.after}</div>
                  </div>
                  <div className="ml-auto px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium flex items-center gap-1">
                    <ArrowUpRight className="w-3 h-3" />
                    {metric.improvement}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
        
        {/* Detailed Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-gradient-to-br from-corporate-navy to-slate-800 rounded-2xl p-6 mt-8 text-white"
        >
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-400" />
            Detailed Savings Analysis
          </h3>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white/10 rounded-xl p-4">
              <div className="text-white/60 text-sm mb-2">Turnover Cost Savings</div>
              <div className="text-2xl font-bold text-emerald-400">{formatCurrency(turnoverSavings)}</div>
              <div className="text-white/40 text-xs mt-2">
                From {Math.round(LEADERSHIP_IMPACT.turnoverReduction.moderate * 100)}% reduction in turnover
              </div>
            </div>
            
            <div className="bg-white/10 rounded-xl p-4">
              <div className="text-white/60 text-sm mb-2">Productivity Gains</div>
              <div className="text-2xl font-bold text-cyan-400">{formatCurrency(productivityGains)}</div>
              <div className="text-white/40 text-xs mt-2">
                From {Math.round(LEADERSHIP_IMPACT.productivityGain.moderate * 100)}% productivity boost
              </div>
            </div>
            
            <div className="bg-white/10 rounded-xl p-4">
              <div className="text-white/60 text-sm mb-2">Absenteeism Reduction</div>
              <div className="text-2xl font-bold text-yellow-400">{formatCurrency(absenteeismSavings)}</div>
              <div className="text-white/40 text-xs mt-2">
                From {Math.round(LEADERSHIP_IMPACT.absenteeismReduction.moderate * 100)}% fewer absences
              </div>
            </div>
            
            <div className="bg-white/10 rounded-xl p-4">
              <div className="text-white/60 text-sm mb-2">Engagement Value</div>
              <div className="text-2xl font-bold text-orange-400">{formatCurrency(engagementValue)}</div>
              <div className="text-white/40 text-xs mt-2">
                From improved team engagement
              </div>
            </div>
          </div>
        </motion.div>
        
        {/* Sources */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-slate-100 rounded-xl p-6 mt-8"
        >
          <h4 className="font-bold text-slate-700 mb-3">Research Sources</h4>
          <div className="grid sm:grid-cols-2 gap-2 text-sm text-slate-600">
            <div>• Gallup State of the Global Workplace Report</div>
            <div>• Society for Human Resource Management (SHRM)</div>
            <div>• Brandon Hall Group Research</div>
            <div>• McKinsey & Company Studies</div>
            <div>• Harvard Business Review</div>
            <div>• Center for Creative Leadership</div>
          </div>
        </motion.div>
        
        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-12"
        >
          <button
            onClick={handleShare}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 transition-colors"
          >
            <Share2 className="w-5 h-5" />
            Share Results
          </button>
          
          <a 
            href="https://leaderreps.com/programs"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-8 py-4 rounded-xl bg-corporate-teal text-white font-bold text-lg hover:bg-emerald-600 transition-colors shadow-lg"
          >
            Explore Programs
            <ArrowRight className="w-5 h-5" />
          </a>
          
          <button
            onClick={onRestart}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
            New Calculation
          </button>
        </motion.div>
        
        {/* Footer CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="bg-gradient-to-r from-corporate-teal to-emerald-500 rounded-2xl p-8 mt-12 text-center text-white"
        >
          <h3 className="text-2xl sm:text-3xl font-bold mb-4">
            Ready to Realize These Savings?
          </h3>
          <p className="text-white/80 mb-6 max-w-xl mx-auto">
            Our leadership development programs are designed to deliver measurable results. 
            Let's discuss how we can help your organization achieve these outcomes.
          </p>
          <a 
            href="https://leaderreps.com/contact"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-white text-corporate-teal font-bold text-lg hover:bg-slate-50 transition-colors shadow-lg"
          >
            Schedule a Consultation
            <Calendar className="w-5 h-5" />
          </a>
        </motion.div>
      </div>
      
      {/* Footer */}
      <div className="bg-corporate-navy text-white py-8 mt-12">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <img 
            src="/logo-white.png" 
            alt="LeaderReps" 
            className="h-8 mx-auto mb-4"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          <p className="text-white/60 text-sm">
            © {new Date().getFullYear()} LeaderReps. Developing exceptional leaders.
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default Results;
