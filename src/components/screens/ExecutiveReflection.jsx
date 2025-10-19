// src/components/screens/ExecutiveReflection.jsx
import React, { useMemo } from 'react';
import { useAppServices } from '../../App.jsx'; 
import { BarChart3, TrendingUp, Target, ShieldCheck, Zap, TrendingDown, Cpu, Star, MessageSquare, HeartPulse, CornerRightUp, Users, Briefcase, Clock, Lightbulb } from 'lucide-react';

/* =========================================================
   HIGH-CONTRAST PALETTE
========================================================= */
const COLORS = {
  NAVY: '#0B3B5B', // Deep Navy
  TEAL: '#219E8B', // Leadership Teal
  BLUE: '#2563EB',
  ORANGE: '#E04E1B', // High-Impact Orange
  GREEN: '#10B981',
  RED: '#EF4444',
  MUTED: '#4B5563',
  LIGHT_GRAY: '#FCFCFA'
};

// Mock UI Component (Standardized Card)
const Card = ({ children, title, icon: Icon, className = '', accent = 'NAVY' }) => {
  const accentColor = COLORS[accent] || COLORS.NAVY;
  return (
    <div
      className={`relative p-6 rounded-2xl border-2 shadow-xl text-left ${className}`}
      style={{ background: 'linear-gradient(180deg,#FFFFFF,#F9FAFB)', borderColor: '#E5E7EB', color: COLORS.TEXT }}
    >
      <span style={{ position:'absolute', top:0, left:0, right:0, height:6, background: accentColor, borderTopLeftRadius:14, borderTopRightRadius:14 }} />

      {Icon && (
        <div className="w-10 h-10 rounded-lg flex items-center justify-center border mb-3" style={{ borderColor: '#E5E7EB', background: '#F3F4F6' }}>
          <Icon className="w-5 h-5" style={{ color: COLORS.TEAL }} />
        </div>
      )}
      {title && <h2 className="text-xl font-extrabold mb-2" style={{ color: COLORS.NAVY }}>{title}</h2>}
      {children}
    </div>
  );
};

/* =========================================================
   LONGITUDINAL IMPACT VISUALIZATION LOGIC
========================================================= */

const useLongitudinalData = (commitmentData, pdpData, planningData) => {
    // Mocking Tier Definitions for Visualization
    const LEADERSHIP_TIERS_MOCK = { T3: { name: 'Execution' }, T4: { name: 'People Dev' } };

    return useMemo(() => {
        const history = commitmentData?.history || [];
        const resilienceLog = commitmentData?.resilience_log || {};
        const selfRating = pdpData?.assessment?.selfRatings?.T3 || 6; 
        const dailySuccessRate = (history.slice(-90).filter(h => h.score.split('/')[0] === h.score.split('/')[1] && h.score.split('/')[1] > 0).length / 90) * 100 || 68; 
        
        // Mock data for Risk Reduction Scorecard
        const riskAudits = planningData?.riskAudits || 15; 
        const okrFailures = planningData?.okrFailures || 2; 
        const riskReductionScore = Math.max(0, 100 - (okrFailures / (riskAudits || 1)) * 100); 
        
        const tierMasteryProjection = Math.round(180 - dailySuccessRate * 1.5); 
        
        // Mock data for Wellness Analysis
        const lowEnergyDays = Object.values(resilienceLog).filter(log => log.energy < 5).length;
        const totalLoggedDays = Object.keys(resilienceLog).length;
        const avgDailyScore = history.reduce((sum, h) => sum + (h.score.split('/')[0] / (h.score.split('/')[1] || 1)), 0) / (history.length || 1);
        const avgScoreLowEnergy = avgDailyScore * (1 - (lowEnergyDays / (totalLoggedDays || 1)) * 0.4); 
        
        // Mentee Feedback Mock Data
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
    
    // Logic for Wellness Insight
    const energyScore = data.lowEnergyDays / Object.keys(commitmentData?.resilience_log || {}).length;
    const wellnessInsight = energyScore > 0.3 ? 
        `Warning: Your daily score drops to **${data.avgScoreLowEnergy.toFixed(1)}** (from ${data.avgDailyScore.toFixed(1)}) on days your energy is low. Performance is directly tied to well-being.` :
        `Great alignment! Your execution rate is stable regardless of energy flux, indicating strong resilience habits.`;

    return (
        <div className="p-8">
            <h1 className="text-3xl font-extrabold text-[#0B3B5B] mb-4">Executive Reflection & Growth Analytics</h1>
            <p className="text-lg text-gray-600 mb-8 max-w-3xl">A data-driven view of your leadership behavior, skill mastery, and growth trends over the last 90 days. This is your personal **Leadership ROI Report**.</p>
            
            <div className='grid lg:grid-cols-3 gap-8'>
                
                {/* 1. Confidence vs. Competence Map */}
                <Card title="Confidence vs. Competence Map" icon={Target} accent='TEAL' className='lg:col-span-2'>
                    <p className='text-sm text-gray-700 mb-4'>Tracks your self-perception (Confidence: PDP Rating) against your proven capability (Competence: Daily Scorecard Success Rate).</p>
                    <div className='grid grid-cols-2 gap-4 text-center'>
                        <div className='p-4 rounded-xl border-2 bg-gray-50' style={{ borderColor: COLORS.NAVY }}>
                            <p className='text-xs font-semibold uppercase text-gray-500'>Confidence (PDP Self-Rating)</p>
                            <p className='text-4xl font-extrabold' style={{ color: COLORS.NAVY }}>{data.confidence}/10</p>
                        </div>
                        <div className='p-4 rounded-xl border-2 bg-gray-50' style={{ borderColor: COLORS.TEAL }}>
                            <p className='text-xs font-semibold uppercase text-gray-500'>Competence (Daily Success Rate)</p>
                            <p className='text-4xl font-extrabold' style={{ color: COLORS.TEAL }}>{data.competence}%</p>
                        </div>
                    </div>
                    
                    <div className='mt-6 p-4 rounded-xl border' style={{ background: COLORS.ORANGE + '1A', borderColor: COLORS.ORANGE, color: COLORS.NAVY }}>
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
                <Card title="Risk Reduction Scorecard" icon={ShieldCheck} accent='ORANGE'>
                    <p className='text-sm text-gray-700 mb-4'>Measures the direct business impact of your **Pre-Mortem Audits** over the past quarter.</p>
                    
                    <div className='text-center'>
                        <p className='text-xs font-semibold uppercase text-gray-500'>Risk Mitigation Effectiveness</p>
                        <p className={`text-5xl font-extrabold mt-1`} style={{ color: data.riskReduction < 70 ? COLORS.ORANGE : COLORS.GREEN }}>{data.riskReduction}%</p>
                    </div>
                    
                    <div className='mt-4 pt-4 border-t border-gray-200'>
                        <p className='text-sm font-semibold' style={{ color: COLORS.NAVY }}>Projection:</p>
                        <p className='text-base text-gray-700'>
                            Estimated **{data.tierMasteryProjection} days** to achieve full mastery of your next PDP Tier (T4). Keep the execution rate above 75% to accelerate by 30 days.
                        </p>
                    </div>
                </Card>
                
                {/* 3. Performance vs. Well-being Analysis */}
                <Card title="Performance vs. Well-being" icon={HeartPulse} accent='RED'>
                     <p className='text-sm text-gray-700 mb-4'>Analyzes the correlation between your daily self-reported energy/focus and your final Daily Scorecard result.</p>
                     
                     <div className='mt-2 p-4 rounded-xl border' style={{ background: COLORS.NAVY + '1A', borderColor: COLORS.NAVY, color: COLORS.NAVY }}>
                         <p className='font-semibold flex items-center'><MessageSquare className='w-4 h-4 mr-2'/> AI Well-being Insight:</p>
                         <p className='text-sm mt-1 text-gray-700'>{wellnessInsight}</p>
                     </div>
                </Card>
                
                {/* 4. Mentorship Alignment (New Feature 1) */}
                <Card title="Mentorship & Coaching Alliance" icon={Users} accent='BLUE'>
                     <p className='text-sm text-gray-700 mb-4'>Identifies opportunities for you to mentor peers (strength) and where you should seek guidance (weakness).</p>
                     
                     <div className='mt-2 p-4 rounded-xl border bg-gray-50' style={{ borderColor: COLORS.TEAL }}>
                         <p className='font-semibold flex items-center' style={{ color: COLORS.TEAL }}><TrendingUp className='w-4 h-4 mr-2'/> Mentor Strength (T3 Execution):</p>
                         <p className='text-sm mt-1 text-gray-700'>
                            Action: Schedule 30 min to coach an employee on an T3 Execution task (Mock commitment).
                         </p>
                     </div>
                     <div className='mt-2 p-4 rounded-xl border bg-gray-50' style={{ borderColor: COLORS.ORANGE }}>
                         <p className='font-semibold flex items-center' style={{ color: COLORS.ORANGE }}><TrendingDown className='w-4 h-4 mr-2'/> Mentee Feedback Score (T4):</p>
                         <p className='text-sm mt-1 text-gray-700'>
                            Score: **{data.menteeFeedback.score}/100** ({data.menteeFeedback.comment})
                         </p>
                     </div>
                     <Button className='mt-4 w-full' accent='BLUE'>
                         Review Full Mentee Feedback &rarr;
                     </Button>
                </Card>
                
                {/* 5. Organizational Impact Metrics (Mock) */}
                <Card title="Organizational Impact Score" icon={BarChart3} accent='NAVY'>
                     <p className='text-sm text-gray-700 mb-4'>Aggregated view of how your development efforts translate to measurable team outcomes (based on mock data for a full system).</p>
                     
                     <div className='space-y-3'>
                         <p className='flex justify-between text-sm font-semibold text-gray-700'>
                             Psychological Safety Index: <span className='font-extrabold' style={{ color: COLORS.GREEN }}>+15%</span>
                         </p>
                         <p className='flex justify-between text-sm font-semibold text-gray-700'>
                             Team Turnover Rate: <span className='font-extrabold' style={{ color: COLORS.GREEN }}>-8%</span>
                         </p>
                         <p className='flex justify-between text-sm font-semibold text-gray-700'>
                             Project Cycle Time: <span className='font-extrabold' style={{ color: COLORS.ORANGE }}>+5 Days</span>
                         </p>
                     </div>
                </Card>
            </div>
        </div>
    );
}