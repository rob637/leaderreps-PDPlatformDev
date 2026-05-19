import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  Users,
  Clock,
  Target,
  Calendar,
  ArrowRight,
  Share2,
  RefreshCw,
  CheckCircle2,
  Info,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Calculator,
} from 'lucide-react';
import { formatCurrency } from '../data/calculations';

const SCENARIO_ICONS = {
  users: Users,
  clock: Clock,
  target: Target,
};

const SCENARIO_GRADIENTS = {
  'retain-one':          'from-emerald-500 to-emerald-600',
  'reclaim-capacity':    'from-cyan-500 to-cyan-600',
  'one-more-deal':       'from-corporate-orange to-orange-500',
  'ship-initiative':     'from-corporate-orange to-orange-500',
  'retain-account':      'from-corporate-orange to-orange-500',
  'process-improvement': 'from-corporate-orange to-orange-500',
  'better-hire':         'from-corporate-orange to-orange-500',
};

const Results = ({ results, inputs, onRestart }) => {
  const {
    scenarios = [],
    perLeader = {},
    indirectBreakdown = {},
    roleLabel,
    replacementPct,
    totalAnnualSavings,
    totalInvestment,
    paybackMonths,
    numLeaders,
    totalEmployeesImpacted,
    industry,
    departmentName,
    regrettedAttrition,
    regrettedAttritionProvided,
    totalTurnover,
    roiPercentage,
  } = results;

  const [showMath, setShowMath] = useState(false);
  const regrettedTier = regrettedAttrition == null
    ? null
    : regrettedAttrition <= 5
      ? { label: 'Healthy', tone: 'text-emerald-700 bg-emerald-50 border-emerald-200' }
      : regrettedAttrition <= 8
        ? { label: 'Watch zone', tone: 'text-amber-700 bg-amber-50 border-amber-200' }
        : { label: 'Problematic', tone: 'text-red-700 bg-red-50 border-red-200' };

  const handleShare = async () => {
    const shareText = `I just looked at the per-leader ROI of leadership development with LeaderReps. Worth a couple minutes to walk through.`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Leadership Development ROI',
          text: shareText,
          url: window.location.href,
        });
      } catch (err) { /* user cancelled */ }
    } else {
      navigator.clipboard.writeText(shareText + ' ' + window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-corporate-navy via-corporate-navy to-corporate-navy/90 text-white py-10 sm:py-14">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/20 text-emerald-300 text-sm font-medium mb-4">
            <CheckCircle2 className="w-4 h-4" />
            Per-Leader View
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            Three ways one better leader pays back
          </h1>
          <p className="text-white/70 text-base sm:text-lg max-w-2xl mx-auto">
            Conservative, defensible scenarios you can take to a CFO —
            not big-number projections.
            {numLeaders > 1 && (
              <> Scale by {numLeaders}× for your full {numLeaders}-leader scope.</>
            )}
          </p>
        </div>
      </div>

      {/* The three "verbal ROI" scenarios */}
      <div className="max-w-5xl mx-auto px-4 -mt-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="grid sm:grid-cols-3 gap-4"
        >
          {scenarios.map((s, i) => {
            const Icon = SCENARIO_ICONS[s.icon] || Target;
            const gradient = SCENARIO_GRADIENTS[s.id] || 'from-slate-600 to-slate-700';
            return (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                className={`bg-gradient-to-br ${gradient} rounded-2xl p-6 text-white shadow-xl`}
              >
                <div className="flex items-center gap-2 text-white/80 text-sm mb-3">
                  <Icon className="w-4 h-4" />
                  Scenario {i + 1}
                </div>
                <div className="text-2xl sm:text-3xl font-bold mb-2 leading-tight">
                  {formatCurrency(s.value)}
                </div>
                <div className="font-semibold text-white mb-2">{s.title}</div>
                <div className="text-white/80 text-sm mb-3">{s.premise}</div>
                <div className="text-white/60 text-xs border-t border-white/20 pt-3">
                  {s.math}
                  {s.illustrative && <span className="block mt-1 italic">Illustrative</span>}
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      {/* Manager Effectiveness ROI summary */}
      <div className="max-w-5xl mx-auto px-4 mt-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="bg-white rounded-2xl shadow-lg p-6 sm:p-8"
        >
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-corporate-teal/10 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-corporate-teal" />
            </div>
            <div>
              <h3 className="font-bold text-corporate-navy text-lg">Manager Effectiveness ROI</h3>
              <p className="text-slate-500 text-sm">
                Per leader, per year — the conservative picture, without the optimistic upside
                {departmentName ? ` · ${departmentName}` : ''}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mt-6">
            <div className="bg-slate-50 rounded-xl p-5">
              <div className="text-slate-500 text-xs uppercase tracking-wide mb-2">Conservative annual value</div>
              <div className="text-3xl font-bold text-corporate-navy">
                {formatCurrency(perLeader.conservativeValue || 0)}
              </div>
              <div className="text-slate-400 text-xs mt-1">retain 1 + reclaim capacity</div>
            </div>

            <div className="bg-slate-50 rounded-xl p-5">
              <div className="text-slate-500 text-xs uppercase tracking-wide mb-2">Annual investment</div>
              <div className="text-3xl font-bold text-corporate-navy">
                {formatCurrency(totalInvestment || 0)}
              </div>
              <div className="text-slate-400 text-xs mt-1">
                {numLeaders > 1 ? `${numLeaders} leaders × ${formatCurrency(totalInvestment / numLeaders)}` : 'per leader, per year'}
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-5">
              <div className="text-slate-500 text-xs uppercase tracking-wide mb-2">ROI</div>
              <div className="text-3xl font-bold text-corporate-navy">
                {roiPercentage != null ? `${roiPercentage}%` : '—'}
              </div>
              <div className="text-slate-400 text-xs mt-1">conservative scenario only</div>
            </div>

            <div className="bg-slate-50 rounded-xl p-5">
              <div className="text-slate-500 text-xs uppercase tracking-wide mb-2">Payback</div>
              <div className="text-3xl font-bold text-corporate-navy">
                {paybackMonths != null ? `${paybackMonths} mo` : '—'}
              </div>
              <div className="text-slate-400 text-xs mt-1">based on conservative scenario</div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-900 mt-6 flex items-start gap-2">
            <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>
              We deliberately don't lead with one big "ROI %" headline.
              The <em>logic</em> of the impact — saving one regretted departure,
              reclaiming hours, or the department-specific upside — is what
              holds up under scrutiny.
            </span>
          </div>

          {/* Show the math */}
          <button
            onClick={() => setShowMath(v => !v)}
            className="mt-4 w-full flex items-center justify-between gap-2 px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors text-sm font-medium text-corporate-navy"
          >
            <span className="flex items-center gap-2">
              <Calculator className="w-4 h-4" />
              {showMath ? 'Hide' : 'Show'} the math
            </span>
            {showMath ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {showMath && (
            <div className="mt-3 space-y-3 text-sm">
              {scenarios.map((s, i) => (
                <div key={s.id} className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-corporate-navy">
                      Scenario {i + 1}: {s.title}
                    </span>
                    <span className="font-mono font-bold text-corporate-navy">
                      {formatCurrency(s.value)}
                    </span>
                  </div>
                  <div className="text-slate-600 font-mono text-xs">{s.math}</div>
                  {s.illustrative && (
                    <div className="text-slate-400 text-xs mt-1 italic">
                      Illustrative — not counted in the conservative headline.
                    </div>
                  )}
                </div>
              ))}
              <div className="bg-corporate-navy text-white rounded-xl p-4 font-mono text-xs space-y-1">
                <div>conservative = retain-one + reclaim-capacity = {formatCurrency(perLeader.conservativeValue || 0)}</div>
                <div>investment   = {numLeaders}× {formatCurrency((totalInvestment || 0) / Math.max(numLeaders, 1))} = {formatCurrency(totalInvestment || 0)}</div>
                <div>ROI%         = (conservative × {numLeaders} − investment) ÷ investment × 100 = {roiPercentage}%</div>
                <div>payback      = investment ÷ (annual savings ÷ 12) = {paybackMonths != null ? `${paybackMonths} mo` : '—'}</div>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Regretted attrition callout */}
      {regrettedTier && (
        <div className="max-w-5xl mx-auto px-4 mt-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-2xl shadow-lg p-6 sm:p-8"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-corporate-orange/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-corporate-orange" />
              </div>
              <div>
                <h3 className="font-bold text-corporate-navy text-lg">Regretted attrition is the kicker</h3>
                <p className="text-slate-500 text-sm">Total turnover is noise — losing the people you didn't want to lose is the cost</p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 mt-4">
              <div className={`rounded-xl p-4 border ${regrettedTier.tone}`}>
                <div className="text-xs uppercase tracking-wide opacity-70 mb-1">Your regretted attrition</div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold">{regrettedAttrition}%</span>
                  <span className="text-sm font-semibold">{regrettedTier.label}</span>
                </div>
                {!regrettedAttritionProvided && (
                  <div className="text-xs opacity-70 mt-1 italic">
                    Using the healthy benchmark for {departmentName || 'this department'} — share your real number for a sharper picture.
                  </div>
                )}
              </div>

              <div className="bg-slate-50 rounded-xl p-4">
                <div className="text-xs uppercase tracking-wide text-slate-500 mb-1">Total turnover</div>
                <div className="text-3xl font-bold text-corporate-navy">{totalTurnover}%</div>
                <div className="text-xs text-slate-500 mt-1">
                  A great manager may <em>raise</em> total turnover by moving out
                  underperformers while <em>lowering</em> regretted attrition.
                  That's the win — and the reason this is the line that matters.
                </div>
              </div>
            </div>

            <div className="text-xs text-slate-500 mt-4">
              Tech-industry rule of thumb: ≤5% healthy · 5–8% watch · 8%+ problematic.
            </div>
          </motion.div>
        </div>
      )}

      {/* Law of the Lid narrative */}
      <div className="max-w-5xl mx-auto px-4 mt-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="bg-gradient-to-br from-corporate-navy to-slate-800 rounded-2xl p-6 sm:p-8 text-white"
        >
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="w-6 h-6 text-corporate-teal" />
            <h3 className="text-xl sm:text-2xl font-bold">The Law of the Lid</h3>
          </div>
          <p className="text-white/85 text-base leading-relaxed mb-4">
            The growth ceiling of any team is set by the leadership capacity at the top.
            Better leaders <strong>raise the lid</strong> — they don't usually let you
            cut headcount, but they do let you grow without adding headcount you'd
            otherwise need.
          </p>
          <p className="text-white/70 text-sm leading-relaxed">
            That's why the most defensible ROI story isn't "we'll save $X million."
            It's: "as we grow, we won't need to hire the next manager / specialist
            quite as soon, because the ones we have can hold more."
          </p>
        </motion.div>
      </div>

      {/* Why turnover is expensive — indirect costs */}
      <div className="max-w-5xl mx-auto px-4 mt-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65 }}
          className="bg-white rounded-2xl shadow-lg p-6 sm:p-8"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
              <Target className="w-5 h-5 text-corporate-orange" />
            </div>
            <div>
              <h3 className="font-bold text-corporate-navy text-lg">
                Why losing a {roleLabel?.toLowerCase() || 'mid-level'} employee really costs ~{Math.round((replacementPct || 0.5) * 100)}% of salary
              </h3>
              <p className="text-slate-500 text-sm">Direct fees are the small part. These hidden costs are the rest.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
            <div className="bg-slate-50 rounded-xl p-4">
              <div className="text-slate-500 text-xs mb-1">Recruiting & sourcing</div>
              <div className="text-lg font-bold text-corporate-navy">
                {formatCurrency(indirectBreakdown.recruitingFees || 0)}
              </div>
              <div className="text-slate-400 text-xs mt-1">~15% of salary</div>
            </div>
            <div className="bg-slate-50 rounded-xl p-4">
              <div className="text-slate-500 text-xs mb-1">Vacancy gap</div>
              <div className="text-lg font-bold text-corporate-navy">
                {formatCurrency(indirectBreakdown.vacancyProductivity || 0)}
              </div>
              <div className="text-slate-400 text-xs mt-1">~6 weeks of lost output</div>
            </div>
            <div className="bg-slate-50 rounded-xl p-4">
              <div className="text-slate-500 text-xs mb-1">Ramp-up time</div>
              <div className="text-lg font-bold text-corporate-navy">
                {formatCurrency(indirectBreakdown.rampUpTime || 0)}
              </div>
              <div className="text-slate-400 text-xs mt-1">3-6 months to full productivity</div>
            </div>
            <div className="bg-slate-50 rounded-xl p-4">
              <div className="text-slate-500 text-xs mb-1">Top performer drag</div>
              <div className="text-lg font-bold text-corporate-navy">
                {formatCurrency(indirectBreakdown.topPerformerTraining || 0)}
              </div>
              <div className="text-slate-400 text-xs mt-1">peers absorb training load</div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Sources & assumptions */}
      <div className="max-w-5xl mx-auto px-4 mt-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.75 }}
          className="bg-slate-100 rounded-xl p-6"
        >
          <h4 className="font-bold text-slate-700 mb-3">Assumptions used</h4>
          <ul className="text-sm text-slate-600 space-y-1 mb-4">
            {departmentName && <li>• <strong>Department:</strong> {departmentName}</li>}
            <li>• <strong>Industry:</strong> {industry} (avg turnover used as default)</li>
            <li>• <strong>Replacement cost:</strong> {Math.round((replacementPct || 0.5) * 100)}% of salary for {roleLabel || 'this role'}</li>
            <li>• <strong>Capacity reclaimed:</strong> 2 hours/week × 50 weeks (intentionally conservative)</li>
            <li>• <strong>Regretted attrition:</strong> {regrettedAttrition}% {regrettedAttritionProvided ? '(your number)' : '(department healthy benchmark)'}</li>
            <li>• Total team in scope: {totalEmployeesImpacted} {totalEmployeesImpacted === 1 ? 'person' : 'people'}</li>
          </ul>
          <h4 className="font-bold text-slate-700 mb-2">Research sources</h4>
          <div className="grid sm:grid-cols-2 gap-1 text-sm text-slate-600">
            <div>• Gallup State of the Global Workplace</div>
            <div>• SHRM (Society for Human Resource Management)</div>
            <div>• Center for American Progress (CAP)</div>
            <div>• Work Institute Retention Reports</div>
            <div>• Harvard Business Review</div>
            <div>• John Maxwell — The 21 Irrefutable Laws of Leadership</div>
          </div>
        </motion.div>
      </div>

      {/* CTAs */}
      <div className="max-w-5xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.85 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-12"
        >
          <button
            onClick={handleShare}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 transition-colors"
          >
            <Share2 className="w-5 h-5" />
            Share
          </button>

          <a
            href="https://leaderreps.com/programs"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-8 py-4 rounded-xl bg-corporate-teal text-white font-bold text-lg hover:bg-emerald-600 transition-colors shadow-lg"
          >
            See How LeaderReps Works
            <ArrowRight className="w-5 h-5" />
          </a>

          <button
            onClick={onRestart}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
            Run another
          </button>
        </motion.div>

        {/* Footer CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="bg-gradient-to-r from-corporate-teal to-emerald-500 rounded-2xl p-8 mt-12 text-center text-white"
        >
          <h3 className="text-2xl sm:text-3xl font-bold mb-3">
            Want to talk through your numbers?
          </h3>
          <p className="text-white/85 mb-6 max-w-xl mx-auto">
            We're happy to walk through your specific situation —
            no pitch, just a conversation about what would actually move the needle.
          </p>
          <a
            href="https://leaderreps.com/contact"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-white text-corporate-teal font-bold text-lg hover:bg-slate-50 transition-colors shadow-lg"
          >
            Schedule a Conversation
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
          <p className="text-white/40 text-xs mt-2">
            Conservative figures by design. Your real numbers will vary.
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default Results;
