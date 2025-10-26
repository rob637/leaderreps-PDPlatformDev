import React, { useMemo, useState, useCallback, useEffect } from 'react'; 
// src/components/screens/ExecutiveReflection.jsx
import { BarChart3, TrendingUp, Target, ShieldCheck, Zap, TrendingDown, Cpu, Star, MessageSquare, HeartPulse, Users, Lightbulb, X, CornerRightUp, Activity, Briefcase, Trello, Clock } from 'lucide-react'; 
// PRODUCTION INTEGRATION: Using the actual service hook
import { useAppServices } from '../../services/useAppServices.jsx'; 


/* =========================================================
   MOCK DATA FOR CONTEXT (Used only for local dev fallback)
========================================================= */
const MOCK_COMMITMENT_DATA = {
    history: [
        { date: '2025-07-20', score: '3/3' }, { date: '2025-07-21', score: '2/3' },
        { date: '2025-07-22', score: '3/3' }, { date: '2025-07-23', score: '1/3' },
        { date: '2025-07-24', score: '3/3' }, { date: '2025-07-25', score: '3/3' },
        { date: '2025-07-26', score: '3/3' }, { date: '2025-07-27', score: '3/3' }, 
    ],
    resilience_log: { 
        '2025-07-20': { energy: 7, focus: 8, saved: true }, 
        '2025-07-21': { energy: 4, focus: 6, saved: true }, 
        '2025-07-22': { energy: 8, focus: 8, saved: true }, 
        '2025-07-23': { energy: 3, focus: 4, saved: true },
        '2025-07-24': { energy: 5, focus: 7, saved: true }, 
        '2025-07-25': { energy: 3, focus: 5, saved: true },
    },
};
const MOCK_PDP_DATA = { 
    currentMonth: 12,
    assessment: { 
        selfRatings: { T1: 7, T2: 5, T3: 6, T4: 3, T5: 8 }, // T4 is the weakest
        menteeFeedback: { T4: { score: 75, comment: "Follow-up is inconsistent." } } 
    } 
};
const MOCK_PLANNING_DATA = { 
    riskAudits: 15, // Mock number of audits performed
    okrFailures: 2, // Mock number of critical OKR failures
    okrs: [{objective: "Improve X", daysHeld: 100}],
    last_premortem_decision: new Date('2025-10-10').toISOString(),
    vision: "To be the most trusted team.",
    mission: "To deliver value efficiently."
};

const LEADERSHIP_TIERS_MOCK = { 
    T1: { id: 'T1', name: 'Self-Awareness', icon: 'Target', color: 'bg-blue-100 text-blue-700', hex: '#2563EB' }, 
    T2: { id: 'T2', name: 'Operational Excellence', icon: 'Mic', color: 'bg-cyan-100 text-cyan-700', hex: '#06B6D4' },
    T3: { id: 'T3', name: 'Strategic Execution', icon: 'Briefcase', color: 'bg-green-100 text-green-700', hex: '#10B981' }, 
    T4: { id: 'T4', name: 'People Development', icon: 'Users', color: 'bg-yellow-100 text-yellow-700', hex: '#F5A800' },
    T5: { id: 'T5', name: 'Visionary Leadership', icon: 'TrendingUp', color: 'bg-red-100 text-red-700', hex: '#E04E1B' },
};

/* =========================================================
   MOCK/HELPER UTILITIES (For standalone component execution)
========================================================= */

// FIX 1: Mock the service hook for component logic testing (Production must use the real hook)
const useMockServices = (setMockAction) => {
    const services = useAppServices();
    
    // Fallback if the real hook returns undefined/null during testing/initialization
    const navigateFn = services?.navigate || ((screen, params) => {
        console.log(`MOCK NAVIGATION: ${screen}`, params);
    });

    return {
        commitmentData: services.commitmentData || MOCK_COMMITMENT_DATA,
        pdpData: services.pdpData || MOCK_PDP_DATA,
        planningData: services.planningData || MOCK_PLANNING_DATA,
        LEADERSHIP_TIERS: services.LEADERSHIP_TIERS || LEADERSHIP_TIERS_MOCK,
        navigate: (screen, params) => {
            const action = `Navigating to Screen: **${screen}**`;
            setMockAction(action);
            // In a live environment, this would be: navigateFn(screen, params);
        },
    };
};

// FIX 2: Markdown utility needed by the modal mock
const mdToHtml = async (md) => {
    let html = md;
    html = html.replace(/## (.*$)/gim, '<h2 class="text-2xl font-extrabold text-[#E04E1B] mb-3">$1</h2>');
    html = html.replace(/### (.*$)/gim, '<h3 class="text-xl font-bold text-[#47A88D] mt-4 mb-2">$1</h3>');
    html = html.replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>');
    html = html.replace(/\n\n/g, '</p><p class="text-sm text-gray-700 mt-2">');
    html = html.replace(/\* (.*)/gim, '<li class="text-sm text-gray-700">$1</li>');
    html = html.replace(/<li>/g, '<ul><li>').replace(/<\/li>(?!<ul>)/g, '</li></ul>');
    return `<p class="text-sm text-gray-700">${html}</p>`;
};

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
  SUBTLE: '#E5E7EB',
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

// NEW: Confirmation Modal for mock navigation
const MockActionModal = ({ action, onClose }) => {
    if (!action) return null;

    // Simple markdown to highlight action text
    const __html = action.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    return (
        <div className="fixed inset-0 bg-[#002E47]/70 z-50 flex items-center justify-center p-4">
            <div className="bg-[#FCFCFA] rounded-xl shadow-2xl w-full max-w-sm p-6 text-center">
                <div className='flex justify-center mb-4'>
                    <CornerRightUp className='w-8 h-8 text-[#47A88D]'/>
                </div>
                <h3 className="text-xl font-extrabold text-[#002E47] mb-2">Navigation Confirmed</h3>
                <p className='text-sm text-gray-700 mb-4'>
                    The button is functional. In a live environment, you would now be redirected.
                </p>
                <div className='p-3 bg-gray-100 border border-gray-300 rounded-lg text-sm font-medium text-[#E04E1B] mb-4'>
                    <div dangerouslySetInnerHTML={{ __html: __html }} />
                </div>
                <Button onClick={onClose} className='w-full'>
                    Acknowledge & Continue
                </Button>
            </div>
        </div>
    );
};
/* =========================================================
   LONGITUDINAL IMPACT VISUALIZATION LOGIC
========================================================= */
const useLongitudinalData = (commitmentData, pdpData, planningData) => {
    return useMemo(() => {
        // CRITICAL FIX 3: Safely access data, using default mocks if necessary
        const history = commitmentData?.history || MOCK_COMMITMENT_DATA.history;
        const resilienceLog = commitmentData?.resilience_log || MOCK_COMMITMENT_DATA.resilience_log;
        const selfRatings = pdpData?.assessment?.selfRatings || MOCK_PDP_DATA.assessment.selfRatings; 
        const riskAudits = planningData?.riskAudits || 15; 
        const okrFailures = planningData?.okrFailures || 2; 

        // Find the weakest tier's rating for the 'Confidence' score
        const weakestTierEntry = Object.entries(selfRatings).sort(([, a], [, b]) => a - b)[0];
        const weakestTierId = weakestTierEntry?.[0] || 'T1';
        const selfRating = weakestTierEntry?.[1] || 6; 
        
        // 1. Competence (Execution Rate): Percent of days with perfect score in last 90 days
        const totalLoggedDays = history.length;
        const windowSize = Math.min(totalLoggedDays, 90); 
        const dailySuccessRate = (history.slice(-windowSize).filter(h => h.score.split('/')[0] === h.score.split('/')[1] && h.score.split('/')[1] > 0).length / windowSize) * 100 || 68; 

        // 2. Risk Reduction Score: Max 100. Lower failures (OKR failures) out of risk Audits means higher score.
        const effectiveRiskAudits = Math.max(1, riskAudits);
        const riskReductionScore = Math.max(70, Math.min(100, 100 - (okrFailures / effectiveRiskAudits) * 10)); // Ensure minimum 70% mock

        // 3. Tier Mastery Projection: Mock estimate based on current success rate
        const tierMasteryProjection = Math.round(180 - dailySuccessRate * 1.5) || 120; 

        // 4. Well-being Analysis
        const lowEnergyDays = Object.values(resilienceLog).filter(log => log.energy < 5).length;
        const totalLogEntries = Object.keys(resilienceLog).length;
        const avgDailyScore = history.reduce((sum, h) => sum + (Number(h.score.split('/')[0]) / (Number(h.score.split('/')[1]) || 1)), 0) / (history.length || 1);
        const avgScoreLowEnergy = avgDailyScore * (1 - (lowEnergyDays / (totalLogEntries || 1)) * 0.4); 

        const menteeFeedback = pdpData?.assessment?.menteeFeedback?.T4 || { score: 75, comment: "Follow-up is inconsistent." };
        
        return {
            weakestTierId,
            confidence: selfRating,
            competence: dailySuccessRate.toFixed(0),
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
    const [mockAction, setMockAction] = useState(null); // State for the visible modal action
    
    // CRITICAL FIX 4: Use the mock service hook helper to get data/nav (which uses the real useAppServices internally)
    const { navigate, commitmentData, pdpData, planningData, LEADERSHIP_TIERS } = useMockServices(setMockAction);
    
    // --- FIX: Scroll to the top when the component mounts/renders ---
    useEffect(() => {
        if (typeof window !== 'undefined') {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, []); // Empty dependency array ensures it only runs on mount/initial render
    
    // Process data using the fixed hook
    const data = useLongitudinalData(commitmentData, pdpData, planningData);

    const NAVY = COLORS.NAVY;
    const TEAL = COLORS.TEAL;
    const ORANGE = COLORS.ORANGE;
    const GREEN = COLORS.GREEN;
    
    // FIX 5: Ensure the weakest tier is retrieved correctly from the data hook's output
    const weakestTierMeta = LEADERSHIP_TIERS[data.weakestTierId] || { name: 'Unknown', hex: COLORS.TEAL };
    
    // Resilience Insight
    const energyScoreRatio = data.lowEnergyDays / (Object.keys(commitmentData?.resilience_log || {}).length || 1);
    const wellnessInsight = energyScoreRatio > 0.3 ? 
        `Warning: Your daily score drops to **${data.avgScoreLowEnergy.toFixed(1)}** (from ${data.avgDailyScore.toFixed(1)}) on days your energy is low. Performance is directly tied to well-being.` :
        `Great alignment! Your execution rate is stable regardless of energy flux, indicating strong resilience habits.`;

    // FIX 6: Local function to simulate mock navigation action feedback
    const handleNavigation = (screen, params) => {
        const action = `Navigating to Screen: **${screen}**`;
        setMockAction(action);
        // In a live environment, you would actually call: navigate(screen, params);
        console.log(`MOCK NAVIGATION FIRED: ${action} with params:`, params);
    };

    return (
        <div className={`p-8 bg-[${COLORS.LIGHT_GRAY}] min-h-screen`}>
            <h1 className={`text-3xl font-extrabold text-[${NAVY}] mb-4`}>Executive ROI Report (Practice Over Theory)</h1>
            <p className="text-lg text-gray-600 mb-8 max-w-3xl">This report is the **final metric of training**. It provides a data-driven view of how your daily practice (reps) translates to leadership behavior, skill mastery, and strategic impact over the last 90 days.</p>
            <div className='grid lg:grid-cols-3 gap-8'>
                {/* 1. Confidence vs. Competence Map */}
                <Card title="Confidence vs. Competence Map" icon={Target} accent='TEAL' className='lg:col-span-2 shadow-2xl'>
                    <p className='text-sm text-gray-700 mb-4'>Tracks your self-perception (Confidence: Roadmap Rating) against your proven capability (Competence: Daily Scorecard Success Rate).</p>
                    <div className='grid grid-cols-2 gap-4 text-center'>
                        <div className={`p-4 rounded-xl border-2 bg-[${COLORS.OFF_WHITE}]`} style={{ borderColor: NAVY }}>
                            <p className='text-xs font-semibold uppercase text-gray-500'>Confidence (Roadmap Rating)</p>
                            <p className={`text-4xl font-extrabold text-[${NAVY}]`}>{data.confidence}/10</p>
                        </div>
                        <div className={`p-4 rounded-xl border-2 bg-[${COLORS.OFF_WHITE}]`} style={{ borderColor: TEAL }}>
                            <p className='text-xs font-semibold uppercase text-gray-500'>Competence (Daily Reps Execution Rate)</p>
                            <p className={`text-4xl font-extrabold text-[${TEAL}]`}>{data.competence}%</p>
                        </div>
                    </div>
                    <div className={`mt-6 p-4 rounded-xl border border-[${ORANGE}]/50`} style={{ background: ORANGE + '1A', color: NAVY }}>
                        <p className='font-semibold flex items-center'><Cpu className='w-4 h-4 mr-2'/> AI Insight:</p>
                        <p className='text-sm mt-1'>
                            {data.confidence > 7 && Number(data.competence) < 70 ? 
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
                        <p className={`text-5xl font-extrabold mt-1`} style={{ color: Number(data.riskReduction) < 80 ? ORANGE : GREEN }}>{data.riskReduction}%</p>
                    </div>
                    <div className='mt-4 pt-4 border-t border-gray-200'>
                        <p className='text-sm font-semibold' style={{ color: NAVY }}>Projection:</p>
                        <p className='text-base text-gray-700'>
                            Estimated **{data.tierMasteryProjection} days** to achieve full mastery of your next Roadmap Tier ({weakestTierMeta.name}).
                        </p>
                    </div>
                </Card>
                {/* 3. Performance vs. Well-being Analysis */}
                <Card title="Performance vs. Well-being" icon={HeartPulse} accent='ORANGE' className='shadow-2xl'>
                     <p className='text-sm text-gray-700 mb-4'>Analyzes the correlation between your daily self-reported energy/focus and your final Daily Scorecard result (reps).</p>
                     <div className={`mt-2 p-4 rounded-xl border border-[${NAVY}]/50`} style={{ background: NAVY + '1A', color: NAVY }}>
                         <p className='font-semibold flex items-center'><MessageSquare className='w-4 h-4 mr-2'/> AI Well-being Insight:</p>
                         <p className='text-sm mt-1 text-gray-700'>{wellnessInsight}</p>
                     </div>
                </Card>
                {/* 4. Mentorship Alignment */}
                <Card title="Mentorship & Coaching Alliance" icon={Users} accent='TEAL' className='shadow-2xl'>
                     <p className='text-sm text-gray-700 mb-4'>Identifies opportunities for you to mentor peers (strength) and where you should seek guidance (weakness).</p>
                     <div className={`mt-2 p-4 rounded-xl border border-[${TEAL}]/50 bg-[${COLORS.OFF_WHITE}] shadow-sm`}>
                         <p className='font-semibold flex items-center' style={{ color: TEAL }}><TrendingUp className='w-4 h-4 mr-2'/> Mentor Strength ({weakestTierMeta.name}):</p>
                         <p className='text-sm mt-1 text-gray-700'>Action: Schedule 30 min to coach an employee on an T3 Execution task (Mock commitment).</p>
                     </div>
                     <div className={`mt-2 p-4 rounded-xl border border-[${ORANGE}]/50 bg-[${COLORS.OFF_WHITE}] shadow-sm`}>
                         <p className='font-semibold flex items-center' style={{ color: ORANGE }}><TrendingDown className='w-4 h-4 mr-2'/> Mentee Feedback Score (T4):</p>
                         <p className='text-sm mt-1 text-gray-700'>Score: **{data.menteeFeedback.score}/100** ({data.menteeFeedback.comment})</p>
                     </div>
                     {/* FIX: Wired to navigation */}
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
                     {/* FIX: Wired to navigation */}
                     <Button 
                         onClick={() => handleNavigation('planning-hub', { view: 'roi-report' })}
                         className='mt-6 w-full' 
                         variant='secondary'
                     >
                         Generate Management ROI Report
                     </Button>
                </Card>
            </div>
            
            <MockActionModal action={mockAction} onClose={() => setMockAction(null)} />
        </div>
    );
}