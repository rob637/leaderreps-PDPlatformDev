// src/components/screens/ExecutiveReflection.jsx
import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { BarChart3, TrendingUp, Target, ShieldCheck, Zap, TrendingDown, Cpu, Star, MessageSquare, HeartPulse, Users, Lightbulb, X, CornerRightUp, Activity, Briefcase, Trello, Clock, ChevronsRight, CheckCircle, Mic, Archive, Sparkles } from 'lucide-react'; // Added needed icons
import { useAppServices } from '../../services/useAppServices.jsx';

/* =========================================================
   PALETTE & UI COMPONENTS (Using existing definitions)
========================================================= */
const COLORS = { NAVY: '#002E47', TEAL: '#47A88D', BLUE: '#2563EB', ORANGE: '#E04E1B', GREEN: '#10B981', RED: '#E04E1B', LIGHT_GRAY: '#FCFCFA', OFF_WHITE: '#FFFFFF', SUBTLE: '#E5E7EB', AMBER: '#F5A800', PURPLE: '#7C3AED', MUTED: '#4B5355' }; // Added missing colors

// Card and Button Components (Assuming definitions from previous files)
const Card = ({ children, title, icon: Icon, className = '', accent = 'NAVY' }) => { /* ... same as before ... */
  const accentColor = COLORS[accent] || COLORS.NAVY; return ( <div className={`relative p-6 rounded-2xl border-2 shadow-2xl text-left ${className}`} style={{ background: 'linear-gradient(180deg,#FFFFFF, #FCFCFA)', borderColor: '#E5E7EB', color: COLORS.NAVY }}> <span style={{ position:'absolute', top:0, left:0, right:0, height:6, background: accentColor, borderTopLeftRadius:14, borderTopRightRadius:14 }} /> {Icon && ( <div className="w-10 h-10 rounded-lg flex items-center justify-center border mb-3" style={{ borderColor: '#E5E7EB', background: COLORS.LIGHT_GRAY }}> <Icon className="w-5 h-5" style={{ color: COLORS.TEAL }} /> </div> )} {title && <h2 className="text-xl font-extrabold mb-2" style={{ color: COLORS.NAVY }}>{title}</h2>} {children} </div> );
};
const Button = ({ children, onClick, disabled = false, variant = 'primary', className = '', ...rest }) => { /* ... same as before ... */
  let baseStyle = "px-6 py-3 rounded-xl font-semibold transition-all shadow-lg focus:outline-none focus:ring-4 text-white flex items-center justify-center"; if (variant === 'primary') { baseStyle += ` bg-[${COLORS.TEAL}] hover:bg-[#349881] focus:ring-[${COLORS.TEAL}]/50`; } else if (variant === 'secondary') { baseStyle += ` bg-[${COLORS.ORANGE}] hover:bg-[#C33E12] focus:ring-[${COLORS.ORANGE}]/50`; } else if (variant === 'outline') { baseStyle = `px-6 py-3 rounded-xl font-semibold transition-all shadow-md border-2 border-[${COLORS.TEAL}] text-[${COLORS.TEAL}] hover:bg-[${COLORS.TEAL}]/10 focus:ring-4 focus:ring-[${COLORS.TEAL}]/50 bg-[${COLORS.LIGHT_GRAY}] flex items-center justify-center`; } if (disabled) { baseStyle = "px-6 py-3 rounded-xl font-semibold bg-gray-300 text-gray-500 cursor-not-allowed shadow-inner transition-none flex items-center justify-center"; } return ( <button {...rest} onClick={onClick} disabled={disabled} className={`${baseStyle} ${className}`}>{children}</button> );
};
// StatCard Component (Copied from old Dashboard for use here)
const StatCard = ({ icon: Icon, label, value, onClick, trend = 0, colorHex, size = 'full', accent = 'NAVY', ...rest }) => {
  const TrendIcon = trend > 0 ? TrendingUp : TrendingDown; const showTrend = trend !== 0; const trendColor = trend > 0 ? COLORS.TEAL : trend < 0 ? COLORS.ORANGE : COLORS.MUTED;
  let widthClass = 'w-full'; if (size === 'half') widthClass = 'md:w-1/2'; if (size === 'third') widthClass = 'md:w-1/3';
  return ( <Card {...rest} icon={Icon} title={value} onClick={onClick} className={`${widthClass}`} accent={accent}> <div className="flex justify-between items-center -mt-1"> <div className="flex-1"> <div className="text-sm font-medium text-gray-500">{label}</div> </div> {showTrend && ( <div className={`text-sm font-semibold flex items-center gap-1`} style={{ color: trendColor }}> <span className={`p-1 rounded-full`} style={{ background: trend > 0 ? COLORS.TEAL + '1A' : COLORS.ORANGE + '1A' }}> <span className='block leading-none'><TrendIcon size={14} /></span> </span> <span className='font-bold'>{Math.abs(trend)}{label.includes("Reps") ? '%' : ''}</span> </div> )} </div> {onClick && <CornerRightUp className="absolute top-8 right-8 text-gray-400" size={20} />} </Card> );
};
// Streak calculation utility (Copied from old Dashboard)
function calculateStreak(history) { /* ... same as before ... */ let streak = 0; const validHistory = Array.isArray(history) ? history : []; const sortedHistory = [...validHistory].sort((a, b) => new Date(b.date) - new Date(a.date)); let yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1); for (let i = 0; i < 7; i++) { const checkDate = new Date(yesterday); checkDate.setDate(yesterday.getDate() - i); const dateString = checkDate.toISOString().split('T')[0]; const historyEntry = sortedHistory.find(h => h.date === dateString); if (historyEntry) { const scoreParts = historyEntry.score.split('/'); if (scoreParts.length === 2) { const [committed, total] = scoreParts.map(Number); if (committed === total && total > 0) streak++; else break; } } else break; } return streak; }

// Mock Action Modal (Optional, if needed for testing nav buttons)
const MockActionModal = ({ action, onClose }) => { /* ... same as before ... */ if (!action) return null; const __html = action.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>'); return ( <div className="fixed inset-0 bg-[#002E47]/70 z-50 flex items-center justify-center p-4"> <div className="bg-[#FCFCFA] rounded-xl shadow-2xl w-full max-w-sm p-6 text-center"> <div className='flex justify-center mb-4'><CornerRightUp className='w-8 h-8 text-[#47A88D]'/></div> <h3 className="text-xl font-extrabold text-[#002E47] mb-2">Navigation Confirmed</h3> <p className='text-sm text-gray-700 mb-4'>The button is functional. In a live environment, you would now be redirected.</p> <div className='p-3 bg-gray-100 border border-gray-300 rounded-lg text-sm font-medium text-[#E04E1B] mb-4'><div dangerouslySetInnerHTML={{ __html: __html }} /></div> <Button onClick={onClose} className='w-full'>Acknowledge & Continue</Button> </div> </div> ); };

/* =========================================================
   LONGITUDINAL IMPACT VISUALIZATION LOGIC (Unchanged)
========================================================= */
const useLongitudinalData = (commitmentData, pdpData, planningData) => { /* ... same as before ... */
  return useMemo(() => { const history = commitmentData?.history || []; const resilienceLog = commitmentData?.resilience_log || {}; const selfRatings = pdpData?.assessment?.scores || {}; const riskAudits = planningData?.riskAudits || 15; const okrFailures = planningData?.okrFailures || 2; const weakestTierEntry = Object.values(selfRatings).sort((a,b) => a.score - b.score)[0]; const weakestTierId = weakestTierEntry?.tierId || 'T1'; const selfRating = weakestTierEntry?.score || 6; const totalLoggedDays = history.length; const windowSize = Math.min(totalLoggedDays, 90); const dailySuccessRate = (history.slice(-windowSize).filter(h => h.score.split('/')[0] === h.score.split('/')[1] && h.score.split('/')[1] > 0).length / Math.max(1, windowSize)) * 100 || 68; const effectiveRiskAudits = Math.max(1, riskAudits); const riskReductionScore = Math.max(70, Math.min(100, 100 - (okrFailures / effectiveRiskAudits) * 10)); const tierMasteryProjection = Math.round(180 - dailySuccessRate * 1.5) || 120; const lowEnergyDays = Object.values(resilienceLog).filter(log => log.energy < 5).length; const totalLogEntries = Object.keys(resilienceLog).length || 1; const avgDailyScore = history.reduce((sum, h) => sum + (Number(h.score.split('/')[0]) / (Number(h.score.split('/')[1]) || 1)), 0) / (history.length || 1); const avgScoreLowEnergy = avgDailyScore * (1 - (lowEnergyDays / totalLogEntries) * 0.4); const menteeFeedback = pdpData?.assessment?.menteeFeedback?.T4 || { score: 75, comment: "Follow-up is inconsistent." }; return { weakestTierId, confidence: selfRating, competence: dailySuccessRate.toFixed(0), riskReduction: riskReductionScore.toFixed(0), tierMasteryProjection, lowEnergyDays, avgScoreLowEnergy, avgDailyScore, menteeFeedback }; }, [commitmentData, pdpData, planningData]);
};


/* =========================================================
   EXECUTIVE REFLECTION SCREEN (UPDATED with Scorecard)
========================================================= */
export default function ExecutiveReflection() {
    const [mockAction, setMockAction] = useState(null); // State for the visible modal action (if using mocks)
    const { navigate, commitmentData, pdpData, planningData, LEADERSHIP_TIERS, MOCK_ACTIVITY_DATA } = useAppServices(); // Use real services

    useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }, []);

    // Process data using the longitudinal hook
    const longitudinalData = useLongitudinalData(commitmentData, pdpData, planningData);

    // --- NEW: Calculate Stats for Scorecard (copied from old Dashboard) ---
    const commitsTotal = useMemo(() => commitmentData?.active_commitments?.length || 0, [commitmentData]);
    const commitsCompleted = useMemo(() => commitmentData?.active_commitments?.filter(c => c.status === 'Committed').length || 0, [commitmentData]);
    const perfectStreak = useMemo(() => calculateStreak(commitmentData?.history || []), [commitmentData?.history]);
    const totalRepsCompleted = useMemo(() => MOCK_ACTIVITY_DATA?.total_reps_completed || 0, [MOCK_ACTIVITY_DATA]); // Assuming mock or needs real data source
    const totalCoachingLabs = useMemo(() => MOCK_ACTIVITY_DATA?.total_coaching_labs || 0, [MOCK_ACTIVITY_DATA]); // Assuming mock or needs real data source
    const goalsCount = useMemo(() => pdpData?.currentMonth || 0, [pdpData]); // Example, adjust as needed
    const okrs = useMemo(() => planningData?.okrs || [], [planningData]);
    const longestHeldOKR = useMemo(() => { /* ... same calculation as old Dashboard ... */ const longest = okrs.reduce((max, okr) => (okr.daysHeld > max.daysHeld ? okr : max), { daysHeld: 0, objective: 'N/A' }); return { days: longest.daysHeld, objective: longest.objective }; }, [okrs]);
    const weakestTierMeta = LEADERSHIP_TIERS[longitudinalData.weakestTierId] || { name: 'Unknown', hex: COLORS.TEAL };

    // Handle navigation (using real navigate now)
    const handleNavigation = (screen, params) => {
        // setMockAction(`Navigating to Screen: **${screen}**`); // Keep mock modal if desired for testing
        navigate(screen, params);
    };

    return (
        <div className={`p-8 bg-[${COLORS.LIGHT_GRAY}] min-h-screen space-y-8`}> {/* Added space-y-8 */}
            {/* --- Section 1: ROI Report Title --- */}
            <div>
                 <h1 className={`text-3xl font-extrabold text-[${COLORS.NAVY}] mb-4`}>Executive ROI Report (Practice Over Theory)</h1>
                 <p className="text-lg text-gray-600 mb-8 max-w-3xl">This report provides a data-driven view of how your daily practice translates to leadership behavior, skill mastery, and strategic impact over the last 90 days.</p>
            </div>

            {/* --- NEW Section 2: Performance Scorecard --- */}
             <Card title="Performance Scorecard Snapshot" icon={Activity} accent='PURPLE'>
                 <p className='text-sm text-gray-700 mb-4'>Key metrics summarizing your recent activity and progress.</p>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                     {/* Metric: Daily Reps Completed Today */}
                    <StatCard
                        icon={CheckCircle} label="Daily Reps Completed Today"
                        value={`${commitsCompleted} / ${commitsTotal}`}
                        onClick={() => handleNavigation('daily-practice')}
                        accent='ORANGE' trend={commitsCompleted} size="half"
                    />
                    {/* Metric: Total Reps Completed (Cumulative) */}
                    <StatCard
                        icon={ChevronsRight} label="Total Reps Completed (All Time)"
                        value={`${totalRepsCompleted}`} // Needs real data source if not using mock
                        onClick={() => handleNavigation('daily-practice')}
                        accent='TEAL' trend={1} size="half"
                    />
                    {/* Metric: Current Streak */}
                    <StatCard
                        icon={Star} label="Current Perfect Score Streak"
                        value={`${perfectStreak} Days`}
                        onClick={() => handleNavigation('daily-practice')}
                        accent='GREEN' trend={perfectStreak >= 3 ? 5 : 0} size="half"
                    />
                     {/* Metric: Weakest Tier Focus */}
                     <StatCard
                        icon={Target} label="Current Weakest Tier Focus"
                        value={`${weakestTierMeta?.name || 'N/A'}`}
                        onClick={() => handleNavigation('development-plan')}
                        accent='AMBER' trend={0} size="half"
                    />
                     {/* Metric: Total Coaching Labs */}
                     <StatCard
                        icon={Mic} label="Total Coaching Labs Performed"
                        value={`${totalCoachingLabs}`} // Needs real data source if not using mock
                        onClick={() => handleNavigation('coaching-lab')}
                        accent='PURPLE' trend={1} size="half"
                    />
                     {/* Metric: Roadmap Months Remaining */}
                     <StatCard
                        icon={Briefcase} label="Roadmap Months Remaining"
                        value={`${24 - goalsCount}`} // Assuming 24 months total
                        onClick={() => handleNavigation('development-plan')}
                        accent='NAVY' trend={24 - goalsCount > 0 ? -4 : 0} size="half"
                    />
                      {/* Metric: Longest Held OKR */}
                    <StatCard
                        icon={Archive} label="Longest-Held OKR (Days)"
                        value={`${longestHeldOKR.days} Days`}
                        onClick={() => handleNavigation('planning-hub')}
                        accent='BLUE' trend={5} size="half"
                    />
                     {/* Metric: Placeholder for AI Reflection */}
                    <StatCard
                        icon={Lightbulb} label="AI Reflection Summary"
                        value={`Ready`}
                        onClick={() => handleNavigation('coaching-lab', { view: 'reflection-summary' })} // Example nav param
                        accent='NAVY' trend={0} size="half"
                    />
                 </div>
             </Card>


            {/* --- Section 3: Longitudinal Impact Grid (Original Content) --- */}
            <div className='grid lg:grid-cols-3 gap-8'>
                {/* 1. Confidence vs. Competence Map */}
                <Card title="Confidence vs. Competence Map" icon={Target} accent='TEAL' className='lg:col-span-2 shadow-2xl'>
                    <p className='text-sm text-gray-700 mb-4'>Tracks your self-perception (Confidence: Roadmap Rating) against your proven capability (Competence: Daily Scorecard Success Rate).</p>
                    <div className='grid grid-cols-2 gap-4 text-center'>
                        <div className={`p-4 rounded-xl border-2 bg-[${COLORS.OFF_WHITE}]`} style={{ borderColor: COLORS.NAVY }}>
                            <p className='text-xs font-semibold uppercase text-gray-500'>Confidence (Self-Rating)</p> {/* Updated Label */}
                            <p className={`text-4xl font-extrabold text-[${COLORS.NAVY}]`}>{longitudinalData.confidence.toFixed(1)}/5</p> {/* Use score out of 5 */}
                        </div>
                        <div className={`p-4 rounded-xl border-2 bg-[${COLORS.OFF_WHITE}]`} style={{ borderColor: COLORS.TEAL }}>
                            <p className='text-xs font-semibold uppercase text-gray-500'>Competence (% Daily Execution)</p> {/* Updated Label */}
                            <p className={`text-4xl font-extrabold text-[${COLORS.TEAL}]`}>{longitudinalData.competence}%</p>
                        </div>
                    </div>
                    <div className={`mt-6 p-4 rounded-xl border border-[${COLORS.ORANGE}]/50`} style={{ background: COLORS.ORANGE + '1A', color: COLORS.NAVY }}>
                        <p className='font-semibold flex items-center'><Cpu className='w-4 h-4 mr-2'/> AI Insight:</p>
                        <p className='text-sm mt-1'>
                            {longitudinalData.confidence > 4 && Number(longitudinalData.competence) < 70 ?
                                `You have a **Competence Gap**! Your high confidence is not matched by your daily execution rate. Focus on ${weakestTierMeta.name} habits.` :
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
                        <p className={`text-5xl font-extrabold mt-1`} style={{ color: Number(longitudinalData.riskReduction) < 80 ? COLORS.ORANGE : COLORS.GREEN }}>{longitudinalData.riskReduction}%</p>
                    </div>
                    <div className='mt-4 pt-4 border-t border-gray-200'>
                        <p className='text-sm font-semibold' style={{ color: COLORS.NAVY }}>Projection:</p>
                        <p className='text-base text-gray-700'>
                            Estimated **{longitudinalData.tierMasteryProjection} days** to achieve full mastery of your next Roadmap Tier ({weakestTierMeta.name}).
                        </p>
                    </div>
                </Card>

                {/* 3. Performance vs. Well-being Analysis */}
                <Card title="Performance vs. Well-being" icon={HeartPulse} accent='ORANGE' className='shadow-2xl'>
                     <p className='text-sm text-gray-700 mb-4'>Analyzes the correlation between your daily self-reported energy/focus and your final Daily Scorecard result (reps).</p>
                     <div className={`mt-2 p-4 rounded-xl border border-[${COLORS.NAVY}]/50`} style={{ background: COLORS.NAVY + '1A', color: COLORS.NAVY }}>
                         <p className='font-semibold flex items-center'><MessageSquare className='w-4 h-4 mr-2'/> AI Well-being Insight:</p>
                         {/* Using wellnessInsight calculation from original */}
                         <p className='text-sm mt-1 text-gray-700'>
                            { (longitudinalData.lowEnergyDays / (Object.keys(commitmentData?.resilience_log || {}).length || 1)) > 0.3 ?
                                `Warning: Your daily score drops to **${longitudinalData.avgScoreLowEnergy.toFixed(1)}** (from ${longitudinalData.avgDailyScore.toFixed(1)}) on days your energy is low. Performance is directly tied to well-being.` :
                                `Great alignment! Your execution rate is stable regardless of energy flux, indicating strong resilience habits.`
                             }
                         </p>
                     </div>
                </Card>

                {/* 4. Mentorship Alignment */}
                <Card title="Mentorship & Coaching Alliance" icon={Users} accent='TEAL' className='shadow-2xl'>
                     <p className='text-sm text-gray-700 mb-4'>Identifies opportunities for you to mentor peers (strength) and where you should seek guidance (weakness).</p>
                     <div className={`mt-2 p-4 rounded-xl border border-[${COLORS.TEAL}]/50 bg-[${COLORS.OFF_WHITE}] shadow-sm`}>
                         <p className='font-semibold flex items-center' style={{ color: COLORS.TEAL }}><TrendingUp className='w-4 h-4 mr-2'/> Mentor Strength ({weakestTierMeta.name}):</p>
                         <p className='text-sm mt-1 text-gray-700'>Action: Schedule 30 min to coach an employee on an T3 Execution task (Mock commitment).</p>
                     </div>
                     <div className={`mt-2 p-4 rounded-xl border border-[${COLORS.ORANGE}]/50 bg-[${COLORS.OFF_WHITE}] shadow-sm`}>
                         <p className='font-semibold flex items-center' style={{ color: COLORS.ORANGE }}><TrendingDown className='w-4 h-4 mr-2'/> Mentee Feedback Score (T4):</p> {/* Assuming T4 is weakest */}
                         <p className='text-sm mt-1 text-gray-700'>Score: **{longitudinalData.menteeFeedback.score}/100** ({longitudinalData.menteeFeedback.comment})</p>
                     </div>
                     <Button
                         onClick={() => handleNavigation('coaching-lab', { view: 'feedback-review', tier: 'T4' })}
                         className='mt-4 w-full'
                         variant='primary'
                     >
                         Review Full Mentee Feedback &rarr;
                     </Button>
                </Card>

                {/* 5. Organizational Impact Metrics */}
                <Card title="Organizational Impact Score" icon={BarChart3} accent='NAVY' className='shadow-2xl'>
                     <p className='text-sm text-gray-700 mb-4'>Aggregated view of how your development efforts translate to measurable team outcomes.</p>
                     {/* Keep mock data for Org Impact until real data is available */}
                     <div className='space-y-3'>
                         <p className='flex justify-between text-sm font-semibold text-gray-700'>Psychological Safety Index: <span className='font-extrabold' style={{ color: COLORS.GREEN }}>+15%</span></p>
                         <p className='flex justify-between text-sm font-semibold text-gray-700'>Team Turnover Rate: <span className='font-extrabold' style={{ color: COLORS.GREEN }}>-8%</span></p>
                         <p className='flex justify-between text-sm font-semibold text-gray-700'>Project Cycle Time: <span className='font-extrabold' style={{ color: COLORS.ORANGE }}>+5 Days</span></p>
                     </div>
                     <Button
                         onClick={() => handleNavigation('planning-hub', { view: 'roi-report' })}
                         className='mt-6 w-full'
                         variant='secondary'
                     >
                         Generate Management ROI Report
                     </Button>
                </Card>
            </div>

            {/* Mock Modal (optional) */}
            <MockActionModal action={mockAction} onClose={() => setMockAction(null)} />
        </div>
    );
}