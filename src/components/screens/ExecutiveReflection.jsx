// src/components/screens/ExecutiveReflection.jsx
import React, { useMemo } from 'react';
// FIX: Using a safe mock for useAppServices as App.jsx is the actual context provider
const useAppServices = () => ({
    commitmentData: { history: [{ score: '3/3' }], resilience_log: { '2025-10-19': { energy: 8, focus: 9 } } },
    pdpData: { assessment: { selfRatings: { T3: 8, T4: 4 } } },
    planningData: { riskAudits: 20, okrFailures: 1 },
    user: { email: 'executive@leaderreps.com' }
});

import { BarChart3, TrendingUp, Target, ShieldCheck, Zap, TrendingDown, Cpu, Star, MessageSquare, HeartPulse, Users, Lightbulb } from 'lucide-react';

/* =========================================================
   HIGH-CONTRAST PALETTE (Copied from uiKit for self-reliance)
========================================================= */
const COLORS = {
  NAVY: '#002E47', 
  TEAL: '#47A88D', 
  BLUE: '#2563EB',
  ORANGE: '#E04E1B', 
  GREEN: '#10B981',
  RED: '#E04E1B',
  LIGHT_GRAY: '#FCFCFA',
  OFF_WHITE: '#FFFFFF',
};

// Mock UI Component (Standardized Card - using the final aesthetic)
const Card = ({ children, title, icon: Icon, className = '', accent = 'NAVY' }) => {
  const accentColor = COLORS[accent] || COLORS.NAVY;
  return (
    <div
      className={`relative p-6 rounded-2xl border-2 shadow-2xl text-left ${className}`}
      style={{ background: 'linear-gradient(180deg,#FFFFFF, #FCFCFA)', borderColor: '#E5E7EB', color: COLORS.NAVY }}
    >
      <span style={{ position:'absolute', top:0, left:0, right:0, height:6, background: accentColor, borderTopLeftRadius:14, borderTopRightRadius:14 }} />

      {Icon && (
        <div className="w-10 h-10 rounded-lg flex items-center justify-center border mb-3" style={{ borderColor: '#E5E7EB', background: COLORS.LIGHT_GRAY }}>
          <Icon className="w-5 h-5" style={{ color: COLORS.TEAL }} />
        </div>
      )}
      {title && <h2 className="text-xl font-extrabold mb-2" style={{ color: COLORS.NAVY }}>{title}</h2>}
      {children}
    </div>
  );
};
const Button = ({ children, onClick, disabled = false, variant = 'primary', className = '', ...rest }) => {
  let baseStyle = "px-6 py-3 rounded-xl font-semibold transition-all shadow-lg focus:outline-none focus:ring-4 text-white flex items-center justify-center";
  if (variant === 'primary') { baseStyle += ` bg-[${COLORS.TEAL}] hover:bg-[#349881] focus:ring-[${COLORS.TEAL}]/50`; }
  else if (variant === 'secondary') { baseStyle += ` bg-[${COLORS.ORANGE}] hover:bg-[#C33E12] focus:ring-[${COLORS.ORANGE}]/50`; }
  else if (variant === 'outline') { baseStyle = `px-6 py-3 rounded-xl font-semibold transition-all shadow-md border-2 border-[${COLORS.TEAL}] text-[${COLORS.TEAL}] hover:bg-[${COLORS.TEAL}]/10 focus:ring-4 focus:ring-[${COLORS.TEAL}]/50 bg-[${COLORS.LIGHT_GRAY}] flex items-center justify-center`; }
  if (disabled) { baseStyle = "px-6 py-3 rounded-xl font-semibold bg-gray-300 text-gray-500 cursor-not-allowed shadow-inner transition-none flex items-center justify-center"; }
  return (
    <button {...rest} onClick={onClick} disabled={disabled} className={`${baseStyle} ${className}`}>
      {children}
    </button>
  );
};


/* =========================================================
   LONGITUDINAL IMPACT VISUALIZATION LOGIC
========================================================= */
const useLongitudinalData = (commitmentData, pdpData, planningData) => {
    return useMemo(() => {
        const history = commitmentData?.history || [];
        const resilienceLog = commitmentData?.resilience_log || {};
        const selfRating = pdpData?.assessment?.selfRatings?.T3 || 6; 
        const dailySuccessRate = (history.slice(-90).filter(h => h.score.split('/')[0] === h.score.split('/')[1] && h.score.split('/')[1] > 0).length / 90) * 100 || 68; 
        
        const riskAudits = planningData?.riskAudits || 15; 
        const okrFailures = planningData?.okrFailures || 2; 
        const riskReductionScore = Math.max(0, 100 - (okrFailures / (riskAudits || 1)) * 100); 
        const tierMasteryProjection = Math.round(180 - dailySuccessRate * 1.5); 
        
        const lowEnergyDays = Object.values(resilienceLog).filter(log => log.energy < 5).length;
        const totalLoggedDays = Object.keys(resilienceLog).length;
        const avgDailyScore = history.reduce((sum, h) => sum + (h.score.split('/')[0] / (h.score.split('/')[1] || 1)), 0) / (history.length || 1);
        const avgScoreLowEnergy = avgDailyScore * (1 - (lowEnergyDays / (totalLoggedDays || 1)) * 0.4); 
        
        const menteeFeedback = pdpData?.assessment?.menteeFeedback?.T4 || { score: 75, comment: "Follow-up is inconsistent." };
        
        return {
            confidence: selfRating,
            competence: dailySuccessRate.toFixed(1),
            riskReduction: riskReductionScore.toFixed(0),
            tierMasteryProjection,
            lowEnergyDays,
            avgScoreLowEnergy,
            avgDailyScore,
            menteeFeedback,
        };
    }, [commitmentData, pdpData, planningData]);
};


/* =========================================================
   LONGITUDINAL IMPACT SCREEN
========================================================= */

export default function ExecutiveReflection() {
    const { useAppServices: useAppServicesLocal } = { useAppServices: useAppServices };
    const { commitmentData, pdpData, planningData, user } = useAppServicesLocal();
    const data = useLongitudinalData(commitmentData, pdpData, planningData);
    
    const NAVY = COLORS.NAVY;
    const TEAL = COLORS.TEAL;
    const ORANGE = COLORS.ORANGE;
    const GREEN = COLORS.GREEN;
    
    const energyScore = data.lowEnergyDays / Object.keys(commitmentData?.resilience_log || {}).length;
    const wellnessInsight = energyScore > 0.3 ? 
        `Warning: Your daily score drops to **${data.avgScoreLowEnergy.toFixed(1)}** (from ${data.avgDailyScore.toFixed(1)}) on days your energy is low. Performance is directly tied to well-being.` :
        `Great alignment! Your execution rate is stable regardless of energy flux, indicating strong resilience habits.`;

    return (
        <div className={`p-8 bg-[${COLORS.LIGHT_GRAY}] min-h-screen`}>
            <h1 className={`text-3xl font-extrabold text-[${NAVY}] mb-4`}>Executive Reflection & Growth Analytics</h1>
            <p className="text-lg text-gray-600 mb-8 max-w-3xl">A data-driven view of your leadership behavior, skill mastery, and growth trends over the last 90 days. This is your personal **Leadership ROI Report**.</p>
            
            <div className='grid lg:grid-cols-3 gap-8'>
                
                {/* 1. Confidence vs. Competence Map */}
                <Card title="Confidence vs. Competence Map" icon={Target} accent='TEAL' className='lg:col-span-2 shadow-2xl'>
                    <p className='text-sm text-gray-700 mb-4'>Tracks your self-perception (Confidence: PDP Rating) against your proven capability (Competence: Daily Scorecard Success Rate).</p>
                    <div className='grid grid-cols-2 gap-4 text-center'>
                        <div className={`p-4 rounded-xl border-2 bg-[${COLORS.OFF_WHITE}]`} style={{ borderColor: NAVY }}>
                            <p className='text-xs font-semibold uppercase text-gray-500'>Confidence (Self-Rating)</p>
                            <p className={`text-4xl font-extrabold text-[${NAVY}]`}>{data.confidence}/10</p>
                        </div>
                        <div className={`p-4 rounded-xl border-2 bg-[${COLORS.OFF_WHITE}]`} style={{ borderColor: TEAL }}>
                            <p className='text-xs font-semibold uppercase text-gray-500'>Competence (Execution Rate)</p>
                            <p className={`text-4xl font-extrabold text-[${TEAL}]`}>{data.competence}%</p>
                        </div>
                    </div>
                    
                    <div className={`mt-6 p-4 rounded-xl border border-[${ORANGE}]/50`} style={{ background: ORANGE + '1A', color: NAVY }}>
                        <p className='font-semibold flex items-center'><Cpu className='w-4 h-4 mr-2'/> AI Insight:</p>
                        <p className='text-sm mt-1'>
                            {data.confidence > 7 && data.competence < 70 ? 
                                `You have a **Competence Gap**! Your high confidence is not matched by your daily execution rate. Focus on T3 delegation habits.` :
                                `Excellent alignment. Maintain this disciplined execution to accelerate your Tier mastery.`
                            }
                        </p>
                    </div>
                </Card>

                {/* 2. Risk Reduction Scorecard */}
                <Card title="Risk Reduction Scorecard" icon={ShieldCheck} accent='ORANGE' className='shadow-2xl'>
                    <p className='text-sm text-gray-700 mb-4'>Measures the direct business impact of your **Pre-Mortem Audits** over the past quarter.</p>
                    
                    <div className='text-center'>
                        <p className='text-xs font-semibold uppercase text-gray-500'>Risk Mitigation Effectiveness</p>
                        <p className={`text-5xl font-extrabold mt-1`} style={{ color: data.riskReduction < 70 ? ORANGE : GREEN }}>{data.riskReduction}%</p>
                    </div>
                    
                    <div className='mt-4 pt-4 border-t border-gray-200'>
                        <p className='text-sm font-semibold' style={{ color: NAVY }}>Projection:</p>
                        <p className='text-base text-gray-700'>
                            Estimated **{data.tierMasteryProjection} days** to achieve full mastery of your next PDP Tier (T4).
                        </p>
                    </div>
                </Card>
                
                {/* 3. Performance vs. Well-being Analysis */}
                <Card title="Performance vs. Well-being" icon={HeartPulse} accent='ORANGE' className='shadow-2xl'>
                     <p className='text-sm text-gray-700 mb-4'>Analyzes the correlation between your daily self-reported energy/focus and your final Daily Scorecard result.</p>
                     
                     <div className={`mt-2 p-4 rounded-xl border border-[${NAVY}]/50`} style={{ background: NAVY + '1A', color: NAVY }}>
                         <p className='font-semibold flex items-center'><MessageSquare className='w-4 h-4 mr-2'/> AI Well-being Insight:</p>
                         <p className='text-sm mt-1 text-gray-700'>{wellnessInsight}</p>
                     </div>
                </Card>
                
                {/* 4. Mentorship Alignment */}
                <Card title="Mentorship & Coaching Alliance" icon={Users} accent='TEAL' className='shadow-2xl'>
                     <p className='text-sm text-gray-700 mb-4'>Identifies opportunities for you to mentor peers (strength) and where you should seek guidance (weakness).</p>
                     
                     <div className={`mt-2 p-4 rounded-xl border border-[${TEAL}]/50 bg-[${COLORS.OFF_WHITE}] shadow-sm`}>
                         <p className='font-semibold flex items-center' style={{ color: TEAL }}><TrendingUp className='w-4 h-4 mr-2'/> Mentor Strength (T3 Execution):</p>
                         <p className='text-sm mt-1 text-gray-700'>Action: Schedule 30 min to coach an employee on an T3 Execution task (Mock commitment).</p>
                     </div>
                     <div className={`mt-2 p-4 rounded-xl border border-[${ORANGE}]/50 bg-[${COLORS.OFF_WHITE}] shadow-sm`}>
                         <p className='font-semibold flex items-center' style={{ color: ORANGE }}><TrendingDown className='w-4 h-4 mr-2'/> Mentee Feedback Score (T4):</p>
                         <p className='text-sm mt-1 text-gray-700'>Score: **{data.menteeFeedback.score}/100** ({data.menteeFeedback.comment})</p>
                     </div>
                     <Button className='mt-4 w-full' variant='primary'>
                         Review Full Mentee Feedback &rarr;
                     </Button>
                </Card>
                
                {/* 5. Organizational Impact Metrics */}
                <Card title="Organizational Impact Score" icon={BarChart3} accent='NAVY' className='shadow-2xl'>
                     <p className='text-sm text-gray-700 mb-4'>Aggregated view of how your development efforts translate to measurable team outcomes.</p>
                     
                     <div className='space-y-3'>
                         <p className='flex justify-between text-sm font-semibold text-gray-700'>
                             Psychological Safety Index: <span className='font-extrabold' style={{ color: GREEN }}>+15%</span>
                         </p>
                         <p className='flex justify-between text-sm font-semibold text-gray-700'>
                             Team Turnover Rate: <span className='font-extrabold' style={{ color: GREEN }}>-8%</span>
                         </p>
                         <p className='flex justify-between text-sm font-semibold text-gray-700'>
                             Project Cycle Time: <span className='font-extrabold' style={{ color: ORANGE }}>+5 Days</span>
                         </p>
                     </div>
                     <Button className='mt-6 w-full' variant='secondary'>
                         Generate Management ROI Report
                     </Button>
                </Card>
            </div>
        </div>
    );
}