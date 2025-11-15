// src/components/screens/ExecutiveReflection.jsx (Refactored for Consistency, Context)

import React, { useMemo, useCallback, useEffect } from 'react';
// --- Core Services & Context ---
import { useAppServices } from '../../services/useAppServices.jsx'; // cite: useAppServices.jsx


// --- Icons ---
import {
  BarChart3, TrendingUp, Target, ShieldCheck, Zap, TrendingDown, Cpu, Star, MessageSquare,
  HeartPulse, Users, Lightbulb, X, CornerRightUp, Activity, Briefcase, Trello, Clock,
  ChevronsRight, CheckCircle, Mic, Archive, Sparkles, Loader // Added Loader
} from 'lucide-react';
import { CORPORATE_COLORS } from '../../styles/corporate-colors.js';
import { DIMENSION_TO_TIER_MAP } from '../../data/LeadershipTiers.js';

/* =========================================================
   PALETTE & UI COMPONENTS (Standardized)
========================================================= */
// --- Primary Color Palette ---
const COLORS = CORPORATE_COLORS;

// --- Standardized UI Components (Matches Dashboard/Dev Plan) ---
const Button = ({ children, onClick, disabled = false, variant = 'primary', className = '', size = 'md', ...rest }) => { /* ... Re-use exact Button definition from Dashboard.jsx ... */
    let baseStyle = `inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-4 disabled:opacity-50 disabled:cursor-not-allowed`;
    if (size === 'sm') baseStyle += ' px-4 py-2 text-sm'; else if (size === 'lg') baseStyle += ' px-8 py-4 text-lg'; else baseStyle += ' px-6 py-3 text-base'; // Default 'md'
    if (variant === 'primary') baseStyle += ` bg-[${COLORS.TEAL}] text-white shadow-lg hover:bg-[#47A88D] focus:ring-[${COLORS.TEAL}]/50`;
    else if (variant === 'secondary') baseStyle += ` bg-[${COLORS.ORANGE}] text-white shadow-lg hover:bg-[#C312] focus:ring-[${COLORS.ORANGE}]/50`;
    else if (variant === 'outline') baseStyle += ` bg-[${COLORS.OFF_WHITE}] text-[${COLORS.TEAL}] border-2 border-[${COLORS.TEAL}] shadow-md hover:bg-[${COLORS.TEAL}]/10 focus:ring-[${COLORS.TEAL}]/50`;
    else if (variant === 'nav-back') baseStyle += ` bg-white text-gray-700 border border-gray-300 shadow-sm hover:bg-gray-100 focus:ring-gray-300/50 px-4 py-2 text-sm`;
    else if (variant === 'ghost') baseStyle += ` bg-transparent text-gray-600 hover:bg-gray-100 focus:ring-gray-300/50 px-3 py-1.5 text-sm`;
    if (disabled) baseStyle += ' bg-gray-300 text-gray-500 shadow-inner border-transparent hover:bg-gray-300';
    return (<button {...rest} onClick={onClick} disabled={disabled} className={`${baseStyle} ${className}`}>{children}</button>);
};
const Card = ({ children, title, icon: Icon, className = '', onClick, accent = 'NAVY' }) => { /* ... Re-use exact Card definition from Dashboard.jsx ... */
    const interactive = !!onClick; const Tag = interactive ? 'button' : 'div'; const accentColor = COLORS[accent] || COLORS.NAVY; const handleKeyDown = (e) => { if (interactive && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onClick?.(); } };
    return (
        <Tag {...(interactive ? { type: 'button' } : {})} role={interactive ? 'button' : undefined} tabIndex={interactive ? 0 : undefined} onKeyDown={handleKeyDown} className={`relative p-6 rounded-2xl border-2 shadow-xl hover:shadow-lg transition-all duration-300 text-left ${className}`} style={{ background: 'linear-gradient(180deg,#FFFFFF, #FCFCFA)', borderColor: COLORS.SUBTLE, color: COLORS.NAVY }} onClick={onClick}>
            <span style={{ position:'absolute', top:0, left:0, right:0, height:6, background: accentColor, borderTopLeftRadius:14, borderTopRightRadius:14 }} />
            {Icon && title && ( <div className="flex items-center gap-3 mb-4"> <div className="w-10 h-10 rounded-lg flex items-center justify-center border flex-shrink-0" style={{ borderColor: COLORS.SUBTLE, background: COLORS.LIGHT_GRAY }}> <Icon className="w-5 h-5" style={{ color: accentColor }} /> </div> <h2 className="text-xl font-extrabold" style={{ color: COLORS.NAVY }}>{title}</h2> </div> )}
            {!Icon && title && <h2 className="text-xl font-extrabold mb-4 border-b pb-2" style={{ color: COLORS.NAVY, borderColor: COLORS.SUBTLE }}>{title}</h2>}
            <div className={Icon || title ? '' : ''}>{children}</div>
        </Tag>
    );
};
const LoadingSpinner = ({ message = "Loading..." }) => ( /* ... Re-use definition from DevelopmentPlan.jsx ... */
    <div className="min-h-screen flex items-center justify-center" style={{ background: COLORS.BG }}> <div className="flex flex-col items-center"> <Loader className="animate-spin h-12 w-12 mb-3" style={{ color: COLORS.TEAL }} /> <p className="font-semibold" style={{ color: COLORS.NAVY }}>{message}</p> </div> </div>
);

/**
 * StatCard Component (Local Definition, Styled Consistently)
 * Displays a single key metric with an optional trend indicator.
 */
const StatCard = ({ icon: Icon, label, value, onClick, trend = 0, accent = 'NAVY', size = 'full', className = '', ...rest }) => {
  const TrendIcon = trend > 0 ? TrendingUp : TrendingDown; // Determine trend icon
  const showTrend = trend !== 0; // Only show if trend is non-zero
  // Determine trend color based on value
  const trendColor = trend > 0 ? COLORS.GREEN : trend < 0 ? COLORS.ORANGE : COLORS.MUTED;
  // Determine card width class (simplified for this layout)
  const widthClass = size === 'half' ? 'md:col-span-1' : (size === 'third' ? 'lg:col-span-1 md:col-span-2' : 'col-span-1'); // Adjust grid span

  return (
    // Use standard Card component as the base
    <Card {...rest} icon={Icon} title={value} onClick={onClick} className={`${widthClass} ${className} ${onClick ? 'cursor-pointer' : ''}`} accent={accent}>
      <div className="flex justify-between items-center -mt-1">
        {/* Label */}
        <div className="flex-1 mr-2">
          <div className="text-xs font-medium text-gray-500 truncate">{label}</div> {/* Smaller label, truncate */}
        </div>
        {/* Trend Indicator (Conditional) */}
        {showTrend && (
          <div className={`text-xs font-semibold flex items-center gap-1 flex-shrink-0`} style={{ color: trendColor }}>
            {/* Trend Icon with Background */}
            <span className={`p-0.5 rounded-full`} style={{ background: trend > 0 ? `${COLORS.GREEN}1A` : `${COLORS.ORANGE}1A` }}>
              <TrendIcon size={12} strokeWidth={3} /> {/* Smaller icon */}
            </span>
            {/* Trend Value */}
            <span className='font-bold'>{Math.abs(trend)}{label.includes("Reps Completed Today") ? '' : '%'}</span> {/* Adjust unit based on label */}
          </div>
        )}
      </div>
      {/* Navigation Arrow (if clickable) */}
      {onClick && <CornerRightUp className="absolute top-4 right-4 text-gray-300 group-hover:text-gray-500 transition-colors" size={16} />}
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


/* =========================================================
   MAIN SCREEN COMPONENT: ExecutiveReflection (ROI Report)
========================================================= */
export default function ExecutiveReflection() {
    // --- Consume Services ---
    const {
        navigate, // Core context
        isLoading: isAppLoading, error: appError, // App loading/error state
        dailyPracticeData, developmentPlanData, strategicContentData, // Renamed user data // cite: useAppServices.jsx
        LEADERSHIP_TIERS, // Global metadata // cite: useAppServices.jsx
        // Mock data source for stats - replace later
        // MOCK_ACTIVITY_DATA (Removed - Define stats locally or fetch properly)
    } = useAppServices();

    // --- Effect for scrolling to top ---
    useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }, []);

    // --- Calculate Longitudinal Data ---
    // This hook processes data from the context hooks
    const longitudinalData = useLongitudinalData(dailyPracticeData, developmentPlanData, strategicContentData); // cite: useLongitudinalData (above)

    // --- Calculate Scorecard Stats (Using Context Data) ---
    // Reps Completed Today (Target + Additional)
    const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
    const targetRepCompletedToday = dailyPracticeData?.dailyTargetRepStatus === 'Committed' && dailyPracticeData?.dailyTargetRepDate === todayStr; // cite: useAppServices.jsx
    const additionalCompletedToday = useMemo(() => (dailyPracticeData?.activeCommitments || []).filter(c => c.status === 'Committed').length, [dailyPracticeData]); // cite: useAppServices.jsx
    const commitsCompletedToday = (targetRepCompletedToday ? 1 : 0) + additionalCompletedToday; // cite: Dashboard.jsx (logic)
    // Total Reps Assigned Today
    const targetRepAssignedToday = !!dailyPracticeData?.dailyTargetRepId && dailyPracticeData?.dailyTargetRepDate === todayStr; // cite: useAppServices.jsx
    const additionalAssignedToday = useMemo(() => (dailyPracticeData?.activeCommitments || []).length, [dailyPracticeData]); // cite: useAppServices.jsx
    const commitsTotalToday = (targetRepAssignedToday ? 1 : 0) + additionalAssignedToday; // cite: Dashboard.jsx (logic)

    // Current Streak (Calculated from practice history)
    const perfectStreak = useMemo(() => calculateStreak(dailyPracticeData?.practiceHistory || []), [dailyPracticeData?.practiceHistory]); // cite: calculateStreak (above), useAppServices.jsx

    // --- Placeholder Stats (Replace with real data sources) ---
    // These need to be sourced from aggregated data (e.g., Firestore aggregation, separate stats doc)
    const totalRepsCompletedAllTime = dailyPracticeData?.stats?.totalRepsCompleted || 128; // Example: Read from stats field
    const totalCoachingLabsCompleted = dailyPracticeData?.practiceHistory?.length || 5; // Count lab history entries // cite: useAppServices.jsx

    // Development Plan Progress
    const currentDevPlanCycle = developmentPlanData?.currentCycle || 1; // cite: useAppServices.jsx
    const totalCycles = 6; // Based on JOURNEY_MAP in Dev Plan // cite: DevelopmentPlan.jsx (constant)
    const roadmapProgressPercent = Math.round((currentDevPlanCycle / totalCycles) * 100);

    // Strategic Content (OKRs) - Placeholder
    const okrsDefined = strategicContentData?.okrs?.length || 3; // cite: useAppServices.jsx
    const okrsAtRisk = (strategicContentData?.okrs || []).filter(o => (o.progress || 0) < 0.5).length; // Mock progress check // cite: PlanningHub.jsx (mock logic)

    // Weakest Tier Meta
    const weakestTierMeta = useMemo(() => LEADERSHIP_TIERS?.[longitudinalData.weakestTierId] || { name: 'N/A', hex: COLORS.MUTED }, [longitudinalData.weakestTierId, LEADERSHIP_TIERS]); // cite: useAppServices.jsx

    // --- Navigation Handler ---
    const handleNavigation = useCallback((screen, params = {}) => {
        navigate(screen, params); // Use navigate from context // cite: useAppServices.jsx
    }, [navigate]); // Dependency: navigate function


    // --- Render Logic ---
    if (isAppLoading) return <LoadingSpinner message="Loading Executive ROI Report..." />;
    if (appError) return <ConfigError message={`Failed to load report data: ${appError.message}`} />;

    return (
        // Consistent page structure and padding
        <div className={`p-6 md:p-8 lg:p-10 min-h-screen space-y-4 sm:space-y-6 lg:space-y-8`} style={{ background: COLORS.BG }}> {/* Use BG color */}

            {/* --- Section 1: Header --- */}
            <header>
                 <h1 className={`text-2xl sm:text-3xl md:text-4xl font-extrabold mb-2`} style={{ color: COLORS.NAVY }}>Executive ROI Report</h1>
                 <p className="text-lg text-gray-700 max-w-3xl">Data-driven insights into your leadership development progress and impact (Last 90 Days).</p>
            </header>

            {/* --- Section 2: Performance Scorecard --- */}
             <Card title="Performance Scorecard" icon={Activity} accent='PURPLE'>
                 <p className='text-sm text-gray-700 mb-6'>Key metrics summarizing recent activity and progress.</p>
                 {/* Grid for Stat Cards */}
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {/* Reps Today */}
                    <StatCard icon={CheckCircle} label="Reps Completed Today" value={`${commitsCompletedToday} / ${commitsTotalToday}`} onClick={() => handleNavigation('daily-practice')} accent='ORANGE' trend={commitsCompletedToday > 0 ? 5 : 0} />
                    {/* Streak */}
                    <StatCard icon={Star} label="Current Streak" value={`${perfectStreak} Days`} onClick={() => handleNavigation('daily-practice')} accent='AMBER' trend={perfectStreak * 2} />
                    {/* Total Reps */}
                    <StatCard icon={ChevronsRight} label="Total Reps Logged" value={`${totalRepsCompletedAllTime}`} onClick={() => handleNavigation('daily-practice')} accent='TEAL' trend={totalRepsCompletedAllTime > 100 ? 10 : 0} />
                    {/* Weakest Tier */}
                     <StatCard icon={Target} label="Current Focus Tier" value={`${weakestTierMeta?.name || 'N/A'}`} onClick={() => handleNavigation('development-plan')} accent='RED' />
                    {/* Coaching Labs */}
                     <StatCard icon={Mic} label="Coaching Labs Done" value={`${totalCoachingLabsCompleted}`} onClick={() => handleNavigation('coaching-lab')} accent='PURPLE' trend={totalCoachingLabsCompleted * 5} />
                    {/* Roadmap Progress */}
                     <StatCard icon={Briefcase} label="Dev Plan Progress" value={`${roadmapProgressPercent}%`} onClick={() => handleNavigation('development-plan')} accent='NAVY' trend={roadmapProgressPercent / 10} />
                    {/* OKRs At Risk */}
                    <StatCard icon={Archive} label="OKRs At Risk" value={`${okrsAtRisk} / ${okrsDefined}`} onClick={() => handleNavigation('planning-hub')} accent='BLUE' trend={okrsAtRisk > 0 ? -okrsAtRisk * 10 : 0} />
                     {/* AI Reflection Summary (Placeholder Link) */}
                    <StatCard icon={Lightbulb} label="AI Reflection Insights" value={`View`} onClick={() => handleNavigation('coaching-lab', { view: 'reflection-summary' })} accent='NAVY' />
                 </div>
             </Card>

            {/* --- Section 3: Longitudinal Impact Grid --- */}
            <h2 className='text-2xl font-extrabold pt-4 border-t mt-10' style={{ color: COLORS.NAVY, borderColor: COLORS.SUBTLE }}>Longitudinal Impact (90-Day View)</h2>
            <div className='grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8'>
                {/* 1. Confidence vs. Competence */}
                <Card title="Confidence vs. Competence" icon={Target} accent='TEAL' className='lg:col-span-2'>
                    <p className='text-sm text-gray-700 mb-4'>Self-perception (Assessment Score) vs. Proven capability (Daily Rep Execution %).</p>
                    <div className='grid grid-cols-2 gap-4 text-center'>
                        {/* Confidence */}
                        <div className={`p-4 rounded-xl border-2 bg-white shadow-inner`} style={{ borderColor: COLORS.NAVY }}>
                            <p className='text-xs font-semibold uppercase text-gray-500'>Confidence</p>
                            <p className={`text-4xl font-extrabold mt-1`} style={{ color: COLORS.NAVY }}>{longitudinalData.confidence.toFixed(1)}<span className="text-xl sm:text-2xl text-gray-400">/5</span></p>
                            <p className='text-[10px] text-gray-500'>(Latest Self-Assessment)</p>
                        </div>
                        {/* Competence */}
                        <div className={`p-4 rounded-xl border-2 bg-white shadow-inner`} style={{ borderColor: COLORS.TEAL }}>
                            <p className='text-xs font-semibold uppercase text-gray-500'>Competence</p>
                            <p className={`text-4xl font-extrabold mt-1`} style={{ color: COLORS.TEAL }}>{longitudinalData.competence}%</p>
                             <p className='text-[10px] text-gray-500'>(Daily Rep Success Rate)</p>
                        </div>
                    </div>
                    {/* AI Insight */}
                    <div className={`mt-6 p-3 rounded-lg border`} style={{ background: COLORS.TEAL + '10', borderColor: COLORS.TEAL + '30', color: COLORS.NAVY }}>
                        <p className='font-semibold text-sm flex items-center gap-1.5'><Cpu className='w-4 h-4 text-[#47A88D]'/> AI Rep Coach Insight:</p>
                        <p className='text-xs mt-1 italic'>
                            {longitudinalData.confidence >= 4 && Number(longitudinalData.competence) < 75 ? // Adjusted threshold
                                `High confidence, moderate execution. Focus daily reps on bridging the gap in ${weakestTierMeta.name}. Consistency is key.` :
                            longitudinalData.confidence < 3.5 && Number(longitudinalData.competence) >= 75 ?
                                `Strong execution, lower self-rating. Recognize your progress in ${weakestTierMeta.name}! What evidence supports higher confidence?` :
                                `Good alignment between perception and practice. Continue disciplined execution to master ${weakestTierMeta.name}.`
                            }
                        </p>
                    </div>
                </Card>

                {/* 2. Risk Reduction */}
                <Card title="Risk Reduction Scorecard" icon={ShieldCheck} accent='ORANGE'>
                    <p className='text-sm text-gray-700 mb-4'>Impact of Pre-Mortem Audits on mitigating strategic failures (Placeholder calculation).</p>
                    <div className='text-center mb-4'>
                        <p className='text-xs font-semibold uppercase text-gray-500'>Risk Mitigation Impact</p>
                        <p className={`text-5xl font-extrabold mt-1`} style={{ color: Number(longitudinalData.riskReduction) < 80 ? COLORS.ORANGE : COLORS.GREEN }}>
                            {longitudinalData.riskReduction}%
                        </p>
                    </div>
                    <div className='mt-4 pt-4 border-t border-gray-200'>
                        <p className='text-sm font-semibold' style={{ color: COLORS.NAVY }}>Tier Mastery Projection:</p>
                        <p className='text-sm text-gray-700'>
                            Est. <strong className='text-lg'>{longitudinalData.tierMasteryProjection}</strong> days to master <strong style={{ color: weakestTierMeta.hex }}>{weakestTierMeta.name}</strong> based on current execution rate.
                        </p>
                         <Button onClick={() => handleNavigation('planning-hub', { view: 'pre-mortem' })} variant="outline" size="sm" className="w-full mt-3 !border-orange-300 !text-orange-600 hover:!bg-orange-50">
                             Go to Pre-Mortem Tool
                         </Button>
                    </div>
                </Card>

                {/* 3. Performance vs. Well-being */}
                <Card title="Performance vs. Well-being" icon={HeartPulse} accent='RED'>
                     <p className='text-sm text-gray-700 mb-4'>Correlation between daily energy/focus (if logged) and rep completion rate.</p>
                     {/* Score Comparison */}
                     <div className="grid grid-cols-2 gap-4 text-center mb-4">
                         <div className="p-3 bg-gray-50 border rounded-lg">
                             <p className="text-xs text-gray-500 uppercase font-semibold">Overall Avg Score</p>
                             <p className="text-xl sm:text-2xl font-bold" style={{ color: COLORS.NAVY }}>{longitudinalData.avgDailyScore}%</p>
                         </div>
                         <div className="p-3 bg-gray-50 border rounded-lg">
                             <p className="text-xs text-gray-500 uppercase font-semibold">Avg on Low Energy Days</p>
                             <p className={`text-2xl font-bold ${Number(longitudinalData.avgScoreLowEnergy) < Number(longitudinalData.avgDailyScore) ? 'text-red-600' : 'text-green-600'}`}>{longitudinalData.avgScoreLowEnergy}%</p>
                         </div>
                     </div>
                     {/* AI Insight */}
                     <div className={`mt-4 p-3 rounded-lg border`} style={{ background: COLORS.RED + '10', borderColor: COLORS.RED + '30', color: COLORS.NAVY }}>
                         <p className='font-semibold text-sm flex items-center gap-1.5'><MessageSquare className='w-4 h-4 text-[#E04E1B]'/> AI Rep Coach Insight:</p>
                         <p className='text-xs mt-1 italic'>
                            { (longitudinalData.lowEnergyDays / Math.max(1, Object.keys(dailyPracticeData?.resilienceLog || {}).length)) > 0.3 ? // Check if >30% days are low energy
                                `Significant drop (${Number(longitudinalData.avgDailyScore) - Number(longitudinalData.avgScoreLowEnergy)} pts) on low energy days (${longitudinalData.lowEnergyDays} logged). Prioritize recovery reps.` :
                                `Execution rate remains relatively stable despite energy fluctuations. Strong resilience practices evident.`
                             }
                         </p>
                         {/* TODO: Add link to log resilience if not available */}
                         {/* <Button variant="outline" size="sm" className="mt-2 w-full !text-xs">Log Daily Resilience</Button> */}
                     </div>
                </Card>

                {/* 4. Mentorship Alignment (Placeholder Data) */}
                <Card title="Mentorship & Coaching Alliance" icon={Users} accent='BLUE'>
                     <p className='text-sm text-gray-700 mb-4'>Opportunities to mentor peers (strengths) vs. areas to seek guidance (weaknesses).</p>
                     {/* Strength Area */}
                     <div className={`p-3 rounded-lg border border-blue-200 bg-blue-50 shadow-sm mb-3`}>
                         <p className='font-semibold text-sm flex items-center gap-1.5' style={{ color: COLORS.BLUE }}><TrendingUp className='w-4 h-4'/> Mentor Opportunity (Example):</p>
                         <p className='text-xs mt-1 text-gray-700'>Your strength in <strong>{weakestTierMeta.name}</strong> suggests you could mentor others. Action: Coach a peer on a related task this week.</p>
                     </div>
                     {/* Weakness Area (Placeholder) */}
                     <div className={`p-3 rounded-lg border border-red-200 bg-red-50 shadow-sm`}>
                         <p className='font-semibold text-sm flex items-center gap-1.5' style={{ color: COLORS.RED }}><TrendingDown className='w-4 h-4'/> Mentee Feedback (Example T4):</p>
                         <p className='text-xs mt-1 text-gray-700'>Score: <strong>{longitudinalData.menteeFeedback.score}/100</strong>. Comment: "{longitudinalData.menteeFeedback.comment}"</p>
                     </div>
                     {/* Button to Feedback Area */}
                     <Button onClick={() => handleNavigation('coaching-lab', { view: 'feedback-review', tier: 'T4' })} size="sm" variant="primary" className='mt-4 w-full bg-[#002E47] hover:bg-blue-700'> {/* Blue Button */}
                         Review Full Mentee Feedback
                     </Button>
                </Card>

                {/* 5. Organizational Impact (Placeholder Data) */}
                <Card title="Organizational Impact Score" icon={BarChart3} accent='PURPLE'>
                     <p className='text-sm text-gray-700 mb-4'>Aggregated view of how development efforts correlate with team/org outcomes (Placeholder data).</p>
                     <div className='space-y-2 text-sm'>
                         <p className='flex justify-between font-semibold text-gray-700'>Psych Safety Index: <span className='font-extrabold text-green-600'>+12%</span></p>
                         <p className='flex justify-between font-semibold text-gray-700'>Team Turnover Rate: <span className='font-extrabold text-green-600'>-6%</span></p>
                         <p className='flex justify-between font-semibold text-gray-700'>Project On-Time Rate: <span className='font-extrabold text-amber-600'>+5%</span></p>
                     </div>
                     {/* Button to Generate Detailed Report */}
                     <Button onClick={() => handleNavigation('planning-hub', { view: 'roi-report' })} size="sm" variant="secondary" className='mt-6 w-full bg-[#47A88D] hover:bg-purple-700'> {/* Purple Button */}
                         Generate Full Management ROI Report
                     </Button>
                </Card>
            </div>

            {/* Mock Modal removed */}
        </div>
    );
}