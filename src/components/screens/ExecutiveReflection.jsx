// src/components/screens/ExecutiveReflection.jsx (Refactored for Consistency, Context)

import React, { useMemo, useCallback, useEffect } from 'react';
import { useAppServices } from '../../services/useAppServices.jsx';
import {
  BarChart3, TrendingUp, Target, ShieldCheck, Zap, TrendingDown, Cpu, Star, MessageSquare,
  HeartPulse, Users, Lightbulb, X, CornerRightUp, Activity, Briefcase, Trello, Clock,
  ChevronsRight, CheckCircle, Mic, Archive, Sparkles, Loader
} from 'lucide-react';
import { Button, Card, LoadingSpinner } from '../ui';
import { DIMENSION_TO_TIER_MAP } from '../../data/LeadershipTiers.js';

const StatCard = ({ icon: Icon, label, value, onClick, trend = 0, accentColor = 'bg-corporate-navy', size = 'full', className = '', ...rest }) => {
  const TrendIcon = trend > 0 ? TrendingUp : TrendingDown;
  const showTrend = trend !== 0;
  const trendColor = trend > 0 ? 'text-green-600 bg-green-50' : trend < 0 ? 'text-orange-600 bg-orange-50' : 'text-slate-400 bg-slate-50';
  const widthClass = size === 'half' ? 'md:col-span-1' : (size === 'third' ? 'lg:col-span-1 md:col-span-2' : 'col-span-1');

  return (
    <Card {...rest} icon={Icon} title={value} onClick={onClick} className={`${widthClass} ${className}`} accentColor={accentColor}>
      <div className="flex justify-between items-center -mt-2">
        <div className="flex-1 mr-2">
          <div className="text-xs font-medium text-slate-500 truncate">{label}</div>
        </div>
        {showTrend && (
          <div className={`text-xs font-bold flex items-center gap-1 px-2 py-1 rounded-full ${trendColor}`}>
            <TrendIcon size={12} strokeWidth={3} />
            <span>{Math.abs(trend)}{label.includes("Reps Completed Today") ? '' : '%'}</span>
          </div>
        )}
      </div>
      {onClick && <CornerRightUp className="absolute top-4 right-4 text-slate-300 group-hover:text-slate-500 transition-colors" size={16} />}
    </Card>
  );
};

/* =========================================================
   UTILITIES (Streak Calculation)
========================================================= */

/**
 * Calculates the current streak of consecutive days where all assigned reps were completed.
 * Looks back up to 7 days.
 * @param {Array} history - Array of daily practice history objects, typically from `dailyPracticeData.practiceHistory`.
 * Each object should have a `date` (YYYY-MM-DD) and `score` ('X/Y').
 * @returns {number} The current streak length (0-7).
 */
function calculateStreak(history) { // cite: Original Dashboard Logic
    let streak = 0;
    const validHistory = Array.isArray(history) ? history : []; // Ensure it's an array
    // Sort history descending by date to easily check previous days
    const sortedHistory = [...validHistory].sort((a, b) => new Date(b.date) - new Date(a.date));

    // Get today's date (at midnight UTC for consistent comparison)
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    // Check completion for today and the previous 6 days
    for (let i = 0; i < 7; i++) {
        const checkDate = new Date(today);
        checkDate.setUTCDate(today.getUTCDate() - i); // Go back i days
        const dateString = checkDate.toISOString().split('T')[0]; // YYYY-MM-DD format

        // Find the history entry for that date
        const historyEntry = sortedHistory.find(h => h.date === dateString);

        if (historyEntry) {
            // Check if score indicates completion (e.g., '3/3', '1/1')
            const scoreParts = (historyEntry.score || '0/1').split('/'); // Default to non-complete score
            if (scoreParts.length === 2) {
                const [committed, total] = scoreParts.map(Number);
                // Check if all were committed AND there was at least one rep
                if (committed === total && total > 0) {
                    streak++; // Increment streak if complete
                } else {
                    break; // Streak broken if not complete
                }
            } else {
                break; // Streak broken if score format is invalid
            }
        } else {
            // Streak broken if no entry found for a past day (within the 7-day window)
            // Allow streak to start today even if yesterday is missing
            if (i > 0) break;
        }
    }
    return streak;
}

/* =========================================================
   LONGITUDINAL IMPACT DATA HOOK (UPDATED FOR NEW CONTEXT)
========================================================= */

/**
 * Custom Hook: useLongitudinalData
 * Calculates key long-term metrics based on user's practice history, assessments, and planning data.
 * @param {object} dailyPracticeData - Data from `useDailyPracticeData`.
 * @param {object} developmentPlanData - Data from `useDevelopmentPlanData`.
 * @param {object} strategicContentData - Data from `useStrategicContentData`.
 * @returns {object} An object containing calculated longitudinal metrics.
 */
const useLongitudinalData = (dailyPracticeData, developmentPlanData, strategicContentData) => { // cite: Original Logic, useAppServices.jsx for data sources
  return useMemo(() => {
    // --- Safely Extract Input Data ---
    // Practice History (Array of { date, score: 'X/Y', ... })
    const history = dailyPracticeData?.practiceHistory || []; // cite: useAppServices.jsx (assumes practiceHistory field)
    // Resilience Log (Object { date: { energy, focus, ... } }) - Placeholder structure
    const resilienceLog = dailyPracticeData?.resilienceLog || {}; // cite: useAppServices.jsx (assumes resilienceLog field)
    // Latest Assessment Scores (Object { dimension: { name, score, status }, ... })
    const latestAssessment = developmentPlanData?.assessmentHistory?.[developmentPlanData.assessmentHistory.length - 1]; // cite: useAppServices.jsx
    const selfRatings = latestAssessment?.scores || {}; // cite: useAppServices.jsx
    // Planning Data (Mock values for now, replace with real fields if available)
    // E.g., Number of pre-mortem audits conducted this quarter
    const riskAudits = strategicContentData?.quarterlyRiskAudits || 5; // Placeholder // cite: useAppServices.jsx
    // E.g., Number of OKRs significantly missed this quarter
    const okrFailures = strategicContentData?.quarterlyOkrFailures || 1; // Placeholder // cite: useAppServices.jsx

    // --- Calculate Metrics ---
    // 1. Weakest Tier & Confidence (Self-Rating for that tier)
    let weakestTierId = 'T1';
    let selfRating = 3.0; // Default confidence score (out of 5)
    if (Object.keys(selfRatings).length > 0) {
        try {
            const sorted = Object.values(selfRatings).sort((a,b) => a.score - b.score);
            const weakestEntry = sorted[0];
            if (weakestEntry) {
                 selfRating = weakestEntry.score;
                 // Attempt to find Tier ID (requires mapping or tierId on score object)
                 // Assuming DIMENSION_TO_TIER_MAP is available or Tiers are in context
                 weakestTierId = DIMENSION_TO_TIER_MAP[weakestEntry.name] || 'T1'; // Fallback
            }
        } catch (e) { console.error("Error processing selfRatings:", e, selfRatings); }
    }

    // 2. Competence (Daily Execution Success Rate - last 90 days or available data)
    const totalLoggedDays = history.length;
    const windowSize = Math.min(totalLoggedDays, 90); // Look back max 90 days
    let completedDays = 0;
    if (windowSize > 0) {
        completedDays = history.slice(-windowSize).filter(h => {
            const parts = (h.score || '0/1').split('/');
            return parts.length === 2 && Number(parts[0]) === Number(parts[1]) && Number(parts[1]) > 0;
        }).length;
    }
    const competence = (completedDays / Math.max(1, windowSize)) * 100 || 0; // Avoid division by zero, default 0

    // 3. Risk Reduction Score (Based on Pre-Mortems vs. Failures - Placeholder Logic)
    const effectiveRiskAudits = Math.max(1, riskAudits);
    const riskReduction = Math.max(0, Math.min(100, 100 - (okrFailures / effectiveRiskAudits) * 50)); // Scaled impact

    // 4. Tier Mastery Projection (Days - Placeholder Logic)
    // Simple heuristic: Faster mastery with higher competence
    const tierMasteryProjection = Math.round(Math.max(30, 180 - competence * 1.5)) || 90; // Estimate days, min 30

    // 5. Well-being vs. Performance (Placeholder Logic)
    const lowEnergyDays = Object.values(resilienceLog).filter(log => log.energy < 5).length;
    const totalResilienceEntries = Math.max(1, Object.keys(resilienceLog).length);
    // Calculate average score across all history
    const avgDailyScore = history.reduce((sum, h) => {
        const parts = (h.score || '0/1').split('/');
        const denominator = Number(parts[1]) || 1; // Avoid division by zero
        return sum + (Number(parts[0]) / denominator);
    }, 0) / Math.max(1, history.length);
    // Estimate score drop based on frequency of low energy days (heuristic)
    const avgScoreLowEnergyImpactFactor = 1 - (lowEnergyDays / totalResilienceEntries) * 0.3; // Max 30% drop estimate
    const avgScoreLowEnergy = avgDailyScore * avgScoreLowEnergyImpactFactor;

    // 6. Mentee Feedback (Placeholder - Assumes structure in developmentPlanData)
    // This needs a real data source; using mock structure for now
    const menteeFeedback = developmentPlanData?.menteeFeedback?.T4 || { score: 75, comment: "Needs more consistent follow-up." }; // Example for T4

    const result = {
        weakestTierId,
        confidence: selfRating, // Self-rating score (1-5)
        competence: competence.toFixed(0), // Daily success rate % (0-100)
        riskReduction: riskReduction.toFixed(0), // Risk mitigation effectiveness % (0-100)
        tierMasteryProjection, // Estimated days to next tier
        lowEnergyDays, // Count of low energy days logged
        avgScoreLowEnergy: (avgScoreLowEnergy * 100).toFixed(0), // Avg score % adjusted for low energy
        avgDailyScore: (avgDailyScore * 100).toFixed(0), // Overall avg score %
        menteeFeedback, // Placeholder feedback object
    };
    return result;

  }, [dailyPracticeData, developmentPlanData, strategicContentData]); // Dependencies: Recalculate if source data changes
};


export default function ExecutiveReflection() {
    const {
        navigate,
        isLoading: isAppLoading, error: appError,
        dailyPracticeData, developmentPlanData, strategicContentData,
        LEADERSHIP_TIERS,
    } = useAppServices();

    useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }, []);

    const longitudinalData = useLongitudinalData(dailyPracticeData, developmentPlanData, strategicContentData);

    const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
    const targetRepCompletedToday = dailyPracticeData?.dailyTargetRepStatus === 'Committed' && dailyPracticeData?.dailyTargetRepDate === todayStr;
    const additionalCompletedToday = useMemo(() => (dailyPracticeData?.activeCommitments || []).filter(c => c.status === 'Committed').length, [dailyPracticeData]);
    const commitsCompletedToday = (targetRepCompletedToday ? 1 : 0) + additionalCompletedToday;
    const targetRepAssignedToday = !!dailyPracticeData?.dailyTargetRepId && dailyPracticeData?.dailyTargetRepDate === todayStr;
    const additionalAssignedToday = useMemo(() => (dailyPracticeData?.activeCommitments || []).length, [dailyPracticeData]);
    const commitsTotalToday = (targetRepAssignedToday ? 1 : 0) + additionalAssignedToday;

    const perfectStreak = useMemo(() => calculateStreak(dailyPracticeData?.practiceHistory || []), [dailyPracticeData?.practiceHistory]);

    const totalRepsCompletedAllTime = dailyPracticeData?.stats?.totalRepsCompleted || 128;
    const totalCoachingLabsCompleted = dailyPracticeData?.practiceHistory?.length || 5;

    const currentDevPlanCycle = developmentPlanData?.currentCycle || 1;
    const totalCycles = 6;
    const roadmapProgressPercent = Math.round((currentDevPlanCycle / totalCycles) * 100);

    const okrsDefined = strategicContentData?.okrs?.length || 3;
    const okrsAtRisk = (strategicContentData?.okrs || []).filter(o => (o.progress || 0) < 0.5).length;

    const weakestTierMeta = useMemo(() => LEADERSHIP_TIERS?.[longitudinalData.weakestTierId] || { name: 'N/A', hex: '#94a3b8' }, [longitudinalData.weakestTierId, LEADERSHIP_TIERS]);

    const handleNavigation = useCallback((screen, params = {}) => {
        navigate(screen, params);
    }, [navigate]);

    if (isAppLoading) return <LoadingSpinner message="Loading Executive ROI Report..." />;
    if (appError) return <div className="p-6 text-red-600">Failed to load report data: {appError.message}</div>;

    return (
        <div className="min-h-screen bg-slate-50 p-6 space-y-8">
            <div className="max-w-7xl mx-auto space-y-8">
                <header className="text-center space-y-4">
                     <h1 className="text-3xl font-bold text-corporate-navy">Executive ROI Report</h1>
                     <p className="text-lg text-slate-600 max-w-3xl mx-auto">Data-driven insights into your leadership development progress and impact (Last 90 Days).</p>
                </header>

                 <Card title="Performance Scorecard" icon={Activity} accentColor="bg-purple-600">
                     <p className='text-sm text-slate-600 mb-6'>Key metrics summarizing recent activity and progress.</p>
                     <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <StatCard icon={CheckCircle} label="Reps Completed Today" value={`${commitsCompletedToday} / ${commitsTotalToday}`} onClick={() => handleNavigation('daily-practice')} accentColor="bg-corporate-orange" trend={commitsCompletedToday > 0 ? 5 : 0} />
                        <StatCard icon={Star} label="Current Streak" value={`${perfectStreak} Days`} onClick={() => handleNavigation('daily-practice')} accentColor="bg-amber-500" trend={perfectStreak * 2} />
                        <StatCard icon={ChevronsRight} label="Total Reps Logged" value={`${totalRepsCompletedAllTime}`} onClick={() => handleNavigation('daily-practice')} accentColor="bg-corporate-teal" trend={totalRepsCompletedAllTime > 100 ? 10 : 0} />
                         <StatCard icon={Target} label="Current Focus Tier" value={`${weakestTierMeta?.name || 'N/A'}`} onClick={() => handleNavigation('development-plan')} accentColor="bg-red-600" />
                         <StatCard icon={Mic} label="Coaching Labs Done" value={`${totalCoachingLabsCompleted}`} onClick={() => handleNavigation('coaching-lab')} accentColor="bg-purple-600" trend={totalCoachingLabsCompleted * 5} />
                         <StatCard icon={Briefcase} label="Dev Plan Progress" value={`${roadmapProgressPercent}%`} onClick={() => handleNavigation('development-plan')} accentColor="bg-corporate-navy" trend={roadmapProgressPercent / 10} />
                        <StatCard icon={Archive} label="OKRs At Risk" value={`${okrsAtRisk} / ${okrsDefined}`} onClick={() => handleNavigation('planning-hub')} accentColor="bg-blue-600" trend={okrsAtRisk > 0 ? -okrsAtRisk * 10 : 0} />
                        <StatCard icon={Lightbulb} label="AI Reflection Insights" value={`View`} onClick={() => handleNavigation('coaching-lab', { view: 'reflection-summary' })} accentColor="bg-corporate-navy" />
                     </div>
                 </Card>

                <h2 className='text-2xl font-bold pt-4 border-t border-slate-200 mt-10 text-corporate-navy'>Longitudinal Impact (90-Day View)</h2>
                <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
                    <Card title="Confidence vs. Competence" icon={Target} accentColor="bg-corporate-teal" className='lg:col-span-2'>
                        <p className='text-sm text-slate-600 mb-4'>Self-perception (Assessment Score) vs. Proven capability (Daily Rep Execution %).</p>
                        <div className='grid grid-cols-2 gap-4 text-center'>
                            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 shadow-inner">
                                <p className='text-xs font-semibold uppercase text-slate-500'>Confidence</p>
                                <p className="text-4xl font-bold mt-1 text-corporate-navy">{longitudinalData.confidence.toFixed(1)}<span className="text-xl sm:text-2xl text-slate-400">/5</span></p>
                                <p className='text-[10px] text-slate-500'>(Latest Self-Assessment)</p>
                            </div>
                            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 shadow-inner">
                                <p className='text-xs font-semibold uppercase text-slate-500'>Competence</p>
                                <p className="text-4xl font-bold mt-1 text-corporate-teal">{longitudinalData.competence}%</p>
                                 <p className='text-[10px] text-slate-500'>(Daily Rep Success Rate)</p>
                            </div>
                        </div>
                        <div className="mt-6 p-4 rounded-xl border border-corporate-teal/20 bg-corporate-teal/5 text-corporate-navy">
                            <p className='font-semibold text-sm flex items-center gap-2'><Cpu className='w-4 h-4 text-corporate-teal'/> AI Rep Coach Insight:</p>
                            <p className='text-sm mt-1 italic text-slate-700'>
                                {longitudinalData.confidence >= 4 && Number(longitudinalData.competence) < 75 ?
                                    `High confidence, moderate execution. Focus daily reps on bridging the gap in ${weakestTierMeta.name}. Consistency is key.` :
                                longitudinalData.confidence < 3.5 && Number(longitudinalData.competence) >= 75 ?
                                    `Strong execution, lower self-rating. Recognize your progress in ${weakestTierMeta.name}! What evidence supports higher confidence?` :
                                    `Good alignment between perception and practice. Continue disciplined execution to master ${weakestTierMeta.name}.`
                                }
                            </p>
                        </div>
                    </Card>

                    <Card title="Risk Reduction Scorecard" icon={ShieldCheck} accentColor="bg-corporate-orange">
                        <p className='text-sm text-slate-600 mb-4'>Impact of Pre-Mortem Audits on mitigating strategic failures.</p>
                        <div className='text-center mb-4'>
                            <p className='text-xs font-semibold uppercase text-slate-500'>Risk Mitigation Impact</p>
                            <p className={`text-5xl font-bold mt-1 ${Number(longitudinalData.riskReduction) < 80 ? 'text-corporate-orange' : 'text-green-600'}`}>
                                {longitudinalData.riskReduction}%
                            </p>
                        </div>
                        <div className='mt-4 pt-4 border-t border-slate-200'>
                            <p className='text-sm font-semibold text-corporate-navy'>Tier Mastery Projection:</p>
                            <p className='text-sm text-slate-600 mt-1'>
                                Est. <strong className='text-lg text-corporate-navy'>{longitudinalData.tierMasteryProjection}</strong> days to master <strong style={{ color: weakestTierMeta.hex }}>{weakestTierMeta.name}</strong> based on current execution rate.
                            </p>
                             <Button onClick={() => handleNavigation('planning-hub', { view: 'pre-mortem' })} variant="outline" size="sm" className="w-full mt-4 !border-orange-200 !text-corporate-orange hover:!bg-orange-50">
                                 Go to Pre-Mortem Tool
                             </Button>
                        </div>
                    </Card>

                    <Card title="Performance vs. Well-being" icon={HeartPulse} accentColor="bg-red-600">
                         <p className='text-sm text-slate-600 mb-4'>Correlation between daily energy/focus and rep completion rate.</p>
                         <div className="grid grid-cols-2 gap-4 text-center mb-4">
                             <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                                 <p className="text-xs text-slate-500 uppercase font-semibold">Overall Avg Score</p>
                                 <p className="text-xl sm:text-2xl font-bold text-corporate-navy">{longitudinalData.avgDailyScore}%</p>
                             </div>
                             <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                                 <p className="text-xs text-slate-500 uppercase font-semibold">Avg on Low Energy Days</p>
                                 <p className={`text-2xl font-bold ${Number(longitudinalData.avgScoreLowEnergy) < Number(longitudinalData.avgDailyScore) ? 'text-red-600' : 'text-green-600'}`}>{longitudinalData.avgScoreLowEnergy}%</p>
                             </div>
                         </div>
                         <div className="mt-4 p-4 rounded-xl border border-red-200 bg-red-50 text-corporate-navy">
                             <p className='font-semibold text-sm flex items-center gap-2'><MessageSquare className='w-4 h-4 text-corporate-orange'/> AI Rep Coach Insight:</p>
                             <p className='text-sm mt-1 italic text-slate-700'>
                                { (longitudinalData.lowEnergyDays / Math.max(1, Object.keys(dailyPracticeData?.resilienceLog || {}).length)) > 0.3 ?
                                    `Significant drop (${Number(longitudinalData.avgDailyScore) - Number(longitudinalData.avgScoreLowEnergy)} pts) on low energy days (${longitudinalData.lowEnergyDays} logged). Prioritize recovery reps.` :
                                    `Execution rate remains relatively stable despite energy fluctuations. Strong resilience practices evident.`
                                 }
                             </p>
                         </div>
                    </Card>

                    <Card title="Mentorship & Coaching Alliance" icon={Users} accentColor="bg-blue-600">
                         <p className='text-sm text-slate-600 mb-4'>Opportunities to mentor peers vs. areas to seek guidance.</p>
                         <div className="p-3 rounded-xl border border-blue-200 bg-blue-50 shadow-sm mb-3">
                             <p className='font-semibold text-sm flex items-center gap-2 text-blue-800'><TrendingUp className='w-4 h-4'/> Mentor Opportunity:</p>
                             <p className='text-xs mt-1 text-slate-700'>Your strength in <strong>{weakestTierMeta.name}</strong> suggests you could mentor others. Action: Coach a peer on a related task this week.</p>
                         </div>
                         <div className="p-3 rounded-xl border border-red-200 bg-red-50 shadow-sm">
                             <p className='font-semibold text-sm flex items-center gap-2 text-red-800'><TrendingDown className='w-4 h-4'/> Mentee Feedback (Example T4):</p>
                             <p className='text-xs mt-1 text-slate-700'>Score: <strong>{longitudinalData.menteeFeedback.score}/100</strong>. Comment: "{longitudinalData.menteeFeedback.comment}"</p>
                         </div>
                         <Button onClick={() => handleNavigation('coaching-lab', { view: 'feedback-review', tier: 'T4' })} size="sm" variant="primary" className='mt-4 w-full !bg-corporate-navy hover:!bg-corporate-navy/90'>
                             Review Full Mentee Feedback
                         </Button>
                    </Card>

                    <Card title="Organizational Impact Score" icon={BarChart3} accentColor="bg-purple-600">
                         <p className='text-sm text-slate-600 mb-4'>Aggregated view of how development efforts correlate with team/org outcomes.</p>
                         <div className='space-y-3 text-sm bg-slate-50 p-4 rounded-xl border border-slate-200'>
                             <p className='flex justify-between font-semibold text-slate-700'>Psych Safety Index: <span className='font-bold text-green-600'>+12%</span></p>
                             <p className='flex justify-between font-semibold text-slate-700'>Team Turnover Rate: <span className='font-bold text-green-600'>-6%</span></p>
                             <p className='flex justify-between font-semibold text-slate-700'>Project On-Time Rate: <span className='font-bold text-amber-600'>+5%</span></p>
                         </div>
                         <Button onClick={() => handleNavigation('planning-hub', { view: 'roi-report' })} size="sm" variant="secondary" className='mt-6 w-full !bg-corporate-teal hover:!bg-corporate-teal-dark'>
                             Generate Full Management ROI Report
                         </Button>
                    </Card>
                </div>
            </div>
        </div>
    );
}