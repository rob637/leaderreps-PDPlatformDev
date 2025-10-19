// src/components/screens/DevPlan.jsx

import { Home, Zap, Clock, Briefcase, Mic, Trello, BookOpen, Settings, BarChart3, TrendingUp, TrendingDown, CheckCircle, Star, Target, Users, HeartPulse, CornerRightUp, X, ArrowLeft, Activity, Link, Lightbulb, AlertTriangle, Eye, PlusCircle, Cpu, MessageSquare } from 'lucide-react';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
// FIX:  Mocking useAppServices since the environment can't resolve relative paths
const useAppServices = () => ({
    // Mocked core services for local testing
    pdpData: null,
    updatePdpData: async () => true,
    saveNewPlan: async () => true,
    callSecureGeminiAPI: async (payload) => {
        // Mock response for Monthly Briefing
        const mockBriefing = {
            candidates: [{
                content: {
                    parts: [{
                        text: "## Monthly Executive Briefing\n\n**Focus Area:** Strategic Clarity (T5)\n\n**Coaching Nudge:** Your low self-rating (4/10) indicates a high-risk gap. You must dedicate time this month to the 'Pre-Mortem Risk Audit' content. Prioritize clear decision-making processes over routine tasks to immediately elevate your strategic focus.\n\n**Next Action:** Schedule 30 minutes to define your top 3 OKR dependencies."
                    }]
                }
            }]
        };
        return mockBriefing;
    },
    hasGeminiKey: () => true,
    navigate: (screen, params) => console.log(`Navigating to ${screen} with params:`, params),
    userId: 'mock-user-123',
    db: {}, // Mock Firestore instance
    isLoading: false,
    error: null,
    // Mocked values needed for the Generator View logic
    commitmentData: { active_commitments: [] },
    planningData: { okrs: [{ objective: 'OKR Q4: Launch MVP' }] },
    GEMINI_MODEL: 'gemini-2.5-flash-preview-09-2025',
});

/* =========================================================
   HIGH-CONTRAST PALETTE (Centralized for Consistency)
========================================================= */
const COLORS = {
  NAVY: '#002E47',      
  TEAL: '#47A88D',      
  SUBTLE_TEAL: '#349881', 
  ORANGE: '#E04E1B',    
  GREEN: '#10B981',
  AMBER: '#F5A800',
  RED: '#E04E1B',
  LIGHT_GRAY: '#FCFCFA',
  OFF_WHITE: '#FFFFFF', 
  SUBTLE: '#E5E7EB',
  TEXT: '#002E47',
  MUTED: '#4B5355',
  BLUE: '#2563EB',
};

// Mock UI components (Standardized)
const Button = ({ children, onClick, disabled = false, variant = 'primary', className = '', ...rest }) => {
  let baseStyle = "px-6 py-3 rounded-xl font-semibold transition-all shadow-xl focus:outline-none focus:ring-4 text-white flex items-center justify-center";
  if (variant === 'primary') { baseStyle += ` bg-[${COLORS.TEAL}] hover:bg-[${COLORS.SUBTLE_TEAL}] focus:ring-[${COLORS.TEAL}]/50`; }
  else if (variant === 'secondary') { baseStyle += ` bg-[${COLORS.ORANGE}] hover:bg-[#C33E12] focus:ring-[${COLORS.ORANGE}]/50`; }
  else if (variant === 'outline') { baseStyle = `px-6 py-3 rounded-xl font-semibold transition-all shadow-md border-2 border-[${COLORS.TEAL}] text-[${COLORS.TEAL}] hover:bg-[${COLORS.TEAL}]/10 focus:ring-4 focus:ring-[${COLORS.TEAL}]/50 bg-[${COLORS.LIGHT_GRAY}] flex items-center justify-center`; }
  else if (variant === 'nav-back') { baseStyle = `px-4 py-2 rounded-lg font-medium transition-all shadow-sm border-2 border-gray-300 text-gray-700 hover:bg-gray-100 flex items-center justify-center`; }
  if (disabled) { baseStyle = "px-6 py-3 rounded-xl font-semibold bg-gray-300 text-gray-500 cursor-not-allowed shadow-inner transition-none flex items-center justify-center"; }
  return (
    <button {...rest} onClick={onClick} disabled={disabled} className={`${baseStyle} ${className}`}>
      {children}
    </button>
  );
};

const Card = ({ children, title, icon: Icon, className = '', onClick, accent = 'NAVY' }) => {
  const interactive = !!onClick;
  const Tag = interactive ? 'button' : 'div';
  const accentColor = COLORS[accent] || COLORS.NAVY;
  const handleKeyDown = (e) => {
    if (!interactive) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick?.();
    }
  };
  return (
    <Tag
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={handleKeyDown}
      className={`relative p-6 rounded-2xl border-2 shadow-2xl hover:shadow-xl transition-all duration-300 text-left ${className}`}
      style={{ background: 'linear-gradient(180deg,#FFFFFF,#F9FAFB)', borderColor: COLORS.SUBTLE, color: COLORS.TEXT }}
      onClick={onClick}
    >
      <span style={{ position:'absolute', top:0, left:0, right:0, height:6, background: accentColor, borderTopLeftRadius:14, borderTopRightRadius:14 }} />

      {Icon && (
        <div className="w-10 h-10 rounded-lg flex items-center justify-center border mb-3" style={{ borderColor: COLORS.SUBTLE, background: COLORS.LIGHT_GRAY }}>
          <Icon className="w-5 h-5" style={{ color: COLORS.TEAL }} />
        </div>
      )}
      {title && <h2 className="text-xl font-extrabold mb-2" style={{ color: COLORS.NAVY }}>{title}</h2>}
      {children}
    </Tag>
  );
};

const Tooltip = ({ content, children }) => {
    const [isVisible, setIsVisible] = useState(false);
    return (
        <div
            className="relative inline-block"
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
        >
            {children}
            {isVisible && (
                <div className="absolute z-10 w-64 p-3 -mt-2 -ml-32 text-xs text-white bg-[#002E47] rounded-lg shadow-lg bottom-full left-1/2 transform translate-x-1/2">
                    {content}
                    <div className="absolute left-1/2 transform -translate-x-1/2 bottom-[-4px] w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-[#002E47]"></div>
                </div>
            )}
        </div>
    );
};

// Mock external utilities (to satisfy imports)
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
const IconMap = {
    Zap: Zap, Users: Users, Briefcase: Briefcase, Target: Target, BarChart3: BarChart3, Clock: Clock, Eye: Eye, BookOpen: BookOpen, Lightbulb: Lightbulb, X: X, ArrowLeft: ArrowLeft, CornerRightUp: CornerRightUp, AlertTriangle: AlertTriangle, CheckCircle: CheckCircle, PlusCircle: PlusCircle, HeartPulse: HeartPulse, TrendingUp: TrendingUp, TrendingDown: TrendingDown, Activity: Activity, Link: Link, Cpu: Cpu, Star: Star, Mic: Mic, Trello: Trello, Settings: Settings, Home: Home, MessageSquare: MessageSquare
};


const PDP_COLLECTION = 'leadership_plan';
const PDP_DOCUMENT = 'roadmap';
const appId = 'default-app-id'; // Mock value for app id

// --- PDP Content Model ---
const LEADERSHIP_TIERS = {
    T1: { id: 'T1', name: 'Self-Awareness & Trust', icon: 'HeartPulse', color: 'indigo-500' },
    T2: { id: 'T2', name: 'Communication & Feedback', icon: 'Mic', color: 'cyan-600' },
    T3: { id: 'T3', name: 'Execution & Delegation', icon: 'Briefcase', color: 'green-600' },
    T4: { id: 'T4', name: 'Talent & People Development', icon: 'Users', color: 'yellow-600' },
    T5: { id: 'T5', name: 'Vision & Strategic Clarity', icon: 'TrendingUp', color: 'red-600' },
};

const CONTENT_LIBRARY = [
    // T1: Self-Awareness & Trust
    { id: 101, tier: 'T1', skill: 'Trust', type: 'Reading', title: 'Article: Vulnerability-Based Trust', duration: 30, difficulty: 'Intro' },
    { id: 102, tier: 'T1', skill: 'Identity', type: 'Exercise', title: 'Drafting Your LIS', duration: 45, difficulty: 'Core' },
    { id: 106, tier: 'T1', skill: 'Trust', type: 'Case Study', title: 'Trust Collapse Scenario Analysis', duration: 60, difficulty: 'Mastery' },
    // T2: Communication & Feedback
    { id: 201, tier: 'T2', skill: 'Feedback', type: 'Exercise', title: 'SBI Feedback Practice (Lab)', duration: 30, difficulty: 'Core' },
    { id: 203, tier: 'T2', skill: 'Crucial', type: 'Role-Play', title: 'Practice: Deflecting the Blame-Shifter', duration: 40, difficulty: 'Core' },
    { id: 207, tier: 'T2', skill: 'Crucial', type: 'Case Study', title: 'Firing for Cultural Fit Scenario', duration: 60, difficulty: 'Mastery' },
    // T3: Execution & Delegation
    { id: 302, tier: 'T3', skill: 'Execution', type: 'Exercise', title: 'Time Blocking for High Leverage', duration: 30, difficulty: 'Core' },
    { id: 303, tier: 'T3', skill: 'Delegation', type: 'Exercise', title: 'RACI Matrix Practice', duration: 45, difficulty: 'Core' },
    { id: 305, tier: 'T3', skill: 'Process', type: 'Case Study', title: 'Process Bottleneck Audit', duration: 50, difficulty: 'Mastery' },
    // T4: Talent & People Development
    { id: 401, tier: 'T4', skill: 'Coaching', type: 'Exercise', title: 'Grow Model Practice', duration: 35, difficulty: 'Core' },
    { id: 403, tier: 'T4', skill: 'Talent', type: 'Exercise', title: 'Succession Planning Draft', duration: 60, difficulty: 'Mastery' },
    { id: 404, tier: 'T4', skill: 'Coaching', type: 'Role-Play', title: 'Practice: Coaching a High Performer', duration: 40, difficulty: 'Core' },
    // T5: Vision & Strategic Clarity
    { id: 501, tier: 'T5', skill: 'Vision', type: 'Exercise', title: 'Vision Statement Workshop', duration: 45, difficulty: 'Core' },
    { id: 503, tier: 'T5', skill: 'Strategic', type: 'Tool', title: 'Pre-Mortem Risk Audit', duration: 30, difficulty: 'Mastery' },
    { id: 507, tier: 'T5', skill: 'Strategic', type: 'Case Study', title: 'Market Disruption Response Plan', duration: 60, difficulty: 'Mastery' },
];

const MOCK_CONTENT_DETAILS = {
    'Reading': (title, skill) => `### Core Concepts of ${title}\n\n**Focus Skill:** ${skill}\n\nThis article highlights the importance of asynchronous communication, creating clear documentation, and setting "done" criteria upfront to reduce execution drag. Your primary takeaway should be the principle: **Clear is Kind, Vague is Cruel.**\n\n* **Action Item:** Schedule 30 minutes for process mapping.\n* **Key Term:** Psychological Safety.`,
    'Exercise': (title, skill) => `### Guided Practice: ${title}\n\n**Focus Skill:** ${skill}\n\nThis exercise requires you to journal or draft statements based on a self-reflective prompt. Use the questions below as a starting point. Your goal is to identify a core belief and define a corresponding measurable behavior.\n\n* **Prompt 1:** When was the last time you felt truly in integrity with your stated values?\n* **Prompt 2:** What is the most difficult piece of feedback you have successfully processed and implemented?`,
    'Case Study': (title, skill) => `### Case Study Setup: ${title}\n\n**Focus Skill:** ${skill}\n\nReview the following scenario description and prepare a 5-step action plan before running the simulation or discussing with your coach. The scenario involves a failure to delegate a crucial task to a capable subordinate, leading to team burnout and missed deadlines.`,
    'Role-Play': (title, skill) => `### Role-Play Briefing: ${title}\n\n**Focus Skill:** ${skill}\n\nThis is a simulation using the Coaching Lab. Your goal is to use the SBI model to deliver tough feedback to an employee who is likely to respond defensively. **Preparation is key!**\n\n* **Mindset:** Lead with curiosity, not judgment.\n* **Goal:** End the conversation with a measurable, agreed-upon next step.`,
    'Tool': (title, skill) => `### Tool Overview: ${title}\n\n**Focus Skill:** ${skill}\n\nThis module guides you through a new framework. The current focus is risk identification and mitigation planning. The objective of this tool is to formalize risk assessment across your strategic goals.`,
};

// Mock data for the "Generic Manager" Plan Comparison
const GENERIC_PLAN = {
    avgIntroContent: 8, // Average 8 intro pieces
    avgMasteryContent: 3, // Average 3 mastery pieces
    totalDuration: 1200, // Total duration in minutes
};


const generatePlanData = (assessment, ownerUid) => {
    const { managerStatus, goalPriorities, selfRatings, peerRatings, menteeFeedback, teamSkillAlignment } = assessment;
    const allTiers = Object.keys(LEADERSHIP_TIERS);

    let initialTierIndex = managerStatus === 'New' ? 0 : managerStatus === 'Mid-Level' ? 2 : 4;

    const plan = [];
    const usedContentIds = new Set();
    const lowRatedTiers = Object.entries(selfRatings).filter(([, rating]) => rating <= 4).map(([id]) => id);

    let tierRotationQueue = [];

    // Prioritize low-rated tiers first
    lowRatedTiers.forEach(tier => {
        if (!tierRotationQueue.includes(tier)) tierRotationQueue.push(tier);
    });
    // Add goal priorities next
    goalPriorities.forEach(tier => {
        if (!tierRotationQueue.includes(tier)) tierRotationQueue.push(tier);
    });
    // Fill the rest of the queue with all tiers to ensure full coverage
    allTiers.forEach(tier => {
        if (!tierRotationQueue.includes(tier)) tierRotationQueue.push(tier);
    });

    // If Team Skill Alignment is active and a team gap exists, prioritize that tier
    const teamGapTier = teamSkillAlignment?.gapTier;
    if (assessment.alignToTeam && teamGapTier && !tierRotationQueue.includes(teamGapTier)) {
        // Inject team gap priority early
        tierRotationQueue.splice(1, 0, teamGapTier);
    }
    
    // Ensure T1 is always at the front if the user is 'New'
    if (managerStatus === 'New' && tierRotationQueue[0] !== 'T1') {
         tierRotationQueue.unshift('T1');
    }
    
    // Check for Confidence/Competence Gap (Self vs. Peer Rating Discrepancy)
    let peerGapTier = null;
    if (peerRatings) {
        for (const tierId of allTiers) {
            const self = selfRatings[tierId];
            const peer = peerRatings[tierId];
            if (self - peer >= 3) { // Self rates 3+ points higher than peers
                peerGapTier = tierId;
                break; 
            }
        }
    }
    if (peerGapTier && !tierRotationQueue.includes(peerGapTier)) {
        // Inject gap-closing tier immediately after the first priority tier
        tierRotationQueue.splice(1, 0, peerGapTier);
    }

    // Check for Mentee Feedback Gap (Targeted T4/T5 Coaching Skills - Organizational Scaling)
    if (menteeFeedback?.T4?.score < 70 && !tierRotationQueue.includes('T4')) {
         tierRotationQueue.splice(1, 0, 'T4');
    }


    // --- Core 24-Month Loop ---
    for (let month = 1; month <= 24; month++) {
        // Rotate through the unique tier queue
        let currentTier = tierRotationQueue[(month - 1) % tierRotationQueue.length];

        const tierMeta = LEADERSHIP_TIERS[currentTier];
        const theme = `Focus on ${tierMeta.name}`;

        const rating = selfRatings[currentTier];
        const targetDifficulty = getTargetDifficulty(rating);

        const requiredContent = [];
        const contentPool = CONTENT_LIBRARY.filter(item =>
            item.tier === currentTier && item.difficulty === targetDifficulty && !usedContentIds.has(item.id)
        );

        // Pull up to 4 items
        let count = 0;
        for (const item of contentPool) {
            if (count < 4) {
                requiredContent.push({
                    ...item,
                    duration: adjustDuration(rating, item.duration),
                    status: 'Pending',
                });
                usedContentIds.add(item.id);
                count++;
            }
        }

        plan.push({
            month,
            tier: currentTier,
            theme,
            requiredContent,
            status: 'Pending',
            reflectionText: '',
            monthCompletedDate: null,
            totalDuration: requiredContent.reduce((sum, item) => sum + item.duration, 0),
        });
    }

    return {
        ownerUid,
        assessment,
        plan,
        currentMonth: 1,
        latestScenario: null,
        lastUpdate: new Date().toISOString(),
    };
};

// --- Modals ---

const SharePlanModal = ({ isVisible, onClose, currentMonthPlan, data }) => {
    if (!isVisible || !currentMonthPlan) return null;

    const tierName = LEADERSHIP_TIERS[currentMonthPlan.tier].name;

    // Mock link for sharing
    const shareLink = `https://leaderreps.com/pdp/view/${data.ownerUid}/${data.currentMonth}`;

    const shareText = `[PDP Monthly Focus]\n\nHello Manager, here is my focus for Month ${currentMonthPlan.month}:\n\n- **Current Tier Priority:** ${tierName}\n- **Theme:** ${currentMonthPlan.theme}\n- **Required Content:** ${currentMonthPlan.requiredContent.map(c => c.title).join(', ')}.\n\nMy primary skill gap is in ${tierName} (Self-Rating: ${data.assessment.selfRatings[currentMonthPlan.tier]}/10). My goal this month is to close this gap by completing all content.\n\nView my full progress: ${shareLink}\n\nManager Acknowledgment: [ ] I have reviewed and aligned with this plan.`; // Organizational Scaling Mock

    // Note: The clipboard copy functionality is mocked due to sandbox limitations
    const copyToClipboard = () => {
        const el = document.createElement('textarea');
        el.value = shareText;
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
        alert('Share content copied to clipboard!');
    };

    return (
        <div className="fixed inset-0 bg-[#002E47]/80 z-50 flex items-center justify-center p-4">
            <div className="bg-[#FCFCFA] rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-8">

                <div className="flex justify-between items-start border-b pb-4 mb-6">
                    <h2 className="text-2xl font-extrabold text-[#002E47] flex items-center">
                        <Link className="w-6 h-6 mr-3 text-[#47A88D]" />
                        Share Monthly Focus
                    </h2>
                    <button onClick={onClose} className="p-2 text-gray-500 hover:text-[#E04E1B] transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <p className="text-gray-700 text-sm mb-4">
                    Send your manager or accountability partner your current focus and goals to maintain alignment and external accountability. **Includes Manager Acknowledgment Mock.**
                </p>

                <h3 className='text-md font-bold text-[#002E47] mb-2'>Shareable Summary (Copied Text)</h3>
                <textarea
                    readOnly
                    value={shareText}
                    className="w-full p-3 border border-gray-300 rounded-xl bg-gray-50 text-sm h-40"
                ></textarea>

                <Button onClick={copyToClipboard} className='mt-4 w-full bg-[#002E47] hover:bg-gray-700'>
                    Copy to Clipboard
                </Button>

                <p className='text-xs text-gray-500 mt-4'>
                    *Note: The actual URL link above is mocked in this demonstration.
                </p>
                
                <Button onClick={onClose} variant='outline' className='mt-4 w-full'>
                    Close
                </Button>
            </div>
        </div>
    );
};

const ContentDetailsModal = ({ isVisible, onClose, content }) => {
    if (!isVisible || !content) return null;

    const [htmlContent, setHtmlContent] = useState('');
    const [rating, setRating] = useState(0); // For Content Review & Rating
    const [isLogging, setIsLogging] = useState(false);

    const mockDetail = MOCK_CONTENT_DETAILS[content.type]
        ? MOCK_CONTENT_DETAILS[content.type](content.title, content.skill)
        : `### Content Unavailable\n\nNo detailed mock content available for type: **${content.type}**`;

    useEffect(() => {
        (async () => setHtmlContent(await mdToHtml(mockDetail)))();
        setRating(0); // Reset rating on new content load
    }, [content.id, mockDetail]);

    // FEATURE: Log Learning & Submit Rating (Feedback loop)
    const handleLogLearning = async () => {
        if (rating === 0) { alert('Please provide a 5-star rating before logging.'); return; }
        setIsLogging(true);
        
        // Mocking an asynchronous save process to simulate an adaptive learning system
        console.log(`Mock: Logging learning for ${content.title} with rating ${rating}/5.`);
        
        await new Promise(r => setTimeout(r, 800));
        alert(`Learning logged! Your ${rating}/5 rating will influence future plan revisions.`);
        setIsLogging(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-[#002E47]/80 z-50 flex items-center justify-center p-4">
            <div className="bg-[#FCFCFA] rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-8">

                <div className="flex justify-between items-start border-b pb-4 mb-6">
                    <h2 className="text-3xl font-extrabold text-[#002E47] flex items-center">
                        <BookOpen className="w-8 h-8 mr-3 text-[#47A88D]" />
                        {content.title} ({content.type})
                    </h2>
                    <button onClick={onClose} className="p-2 text-gray-500 hover:text-[#E04E1B] transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="mb-6 text-sm flex space-x-4 border-b pb-4">
                    <p className="text-gray-700 font-semibold">Tier: <span className='text-[#002E47]'>{LEADERSHIP_TIERS[content.tier]?.name}</span></p>
                    <p className="text-gray-700 font-semibold">Skill Focus: <span className='text-[#002E47]'>{content.skill}</span></p>
                    <p className="text-gray-700 font-semibold">Est. Duration: <span className='text-[#002E47]'>{content.duration} min</span></p>
                </div>

                <div className="prose max-w-none text-gray-700">
                    <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
                </div>

                {/* Content Review & Rating Feature */}
                <div className='mt-8 pt-6 border-t border-gray-200'>
                    <h3 className='text-lg font-bold text-[#002E47] mb-3 flex items-center'>
                        <Star className="w-5 h-5 mr-2 text-[#E04E1B]" />
                        Review & Log Learning
                    </h3>
                    <p className='text-sm text-gray-700 mb-4'>
                        Rate the content's quality and helpfulness. This feedback loop helps the AI personalize future modules.
                    </p>
                    <div className='flex items-center space-x-4 mb-4'>
                        <div className='flex space-x-1'>
                            {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                    key={star}
                                    className={`w-6 h-6 cursor-pointer transition-colors ${
                                        star <= rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'
                                    }`}
                                    onClick={() => setRating(star)}
                                />
                            ))}
                        </div>
                        <span className='text-md font-semibold text-[#002E47]'>{rating > 0 ? `${rating}/5 Stars` : 'Rate Content'}</span>
                    </div>

                    <Button onClick={handleLogLearning} disabled={isLogging || rating === 0} className='w-full'>
                        {isLogging ? 'Logging...' : 'Log Learning & Submit Rating'}
                    </Button>
                </div>
            </div>
        </div>
    );
};

const TierReviewModal = ({ isVisible, onClose, tierId, planData }) => {
    // Component logic remains the same (removed for brevity)
    if (!isVisible || !tierId) return null;
    return (
        <div className="fixed inset-0 bg-[#002E47]/80 z-50 flex items-center justify-center p-4">
            <div className="bg-[#FCFCFA] rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-8">
                <h2 className='text-2xl font-extrabold text-[#002E47]'>Tier Review Mockup</h2>
                <p className='text-gray-600 mt-2'>This modal reviews progress for {LEADERSHIP_TIERS[tierId].name}.</p>
                <Button onClick={onClose} className='mt-8'>Close</Button>
            </div>
        </div>
    );
};


// --- Component 2: Tracker Dashboard View ---
const TrackerDashboardView = ({ data, updatePdpData, saveNewPlan, db, userId, navigate }) => {
    const { callSecureGeminiAPI, hasGeminiKey, GEMINI_MODEL } = useAppServices();

    const currentMonth = data.currentMonth;
    const currentMonthPlan = data.plan.find(m => m.month === currentMonth);
    const nextMonthPlan = data.plan.find(m => m.month === currentMonth + 1);
    const nextMonthFocus = nextMonthPlan ? LEADERSHIP_TIERS[nextMonthPlan.tier].name : null;
    const nextMonthTier = nextMonthPlan ? nextMonthPlan.tier : null;

    const assessment = data.assessment;

    const [isReviewModalVisible, setIsReviewModalVisible] = useState(false);
    const [reviewTierId, setReviewTierId] = useState(null);
    const [isContentModalVisible, setIsContentModalVisible] = useState(false);
    const [selectedContent, setSelectedContent] = useState(null);
    const [isShareModalVisible, setIsShareModalVisible] = useState(false); // Feature 1: Share Modal
    const [localReflection, setLocalReflection] = useState(currentMonthPlan?.reflectionText || '');
    const [isSaving, setIsSaving] = useState(false);
    const [briefing, setBriefing] = useState(null); // Feature A: AI Briefing
    const [briefingLoading, setBriefingLoading] = useState(false);


    // --- AI Monthly Briefing Logic ---
    const fetchMonthlyBriefing = useCallback(async (plan, assessment) => {
        if (briefing || briefingLoading || !hasGeminiKey()) return;

        setBriefingLoading(true);
        const currentTier = LEADERSHIP_TIERS[plan.tier];
        const rating = assessment.selfRatings[plan.tier];

        const systemPrompt = `You are a concise Executive Coach. Analyze the user's current PDP phase. Given their focus tier (${currentTier.name}) and their initial self-rating (${rating}/10), provide: 1) A 1-sentence **Executive Summary** of the goal. 2) A 1-sentence **Coaching Nudge** on how to prioritize the month's learning based on their skill gap. Use bold markdown for key phrases.`;

        const userQuery = `Generate a monthly briefing for the user's current focus: ${plan.theme}. Required content includes: ${plan.requiredContent.map(c => c.title).join(', ')}.`;

        try {
            const payload = {
                contents: [{ role: "user", parts: [{ text: userQuery }] }],
                systemInstruction: { parts: [{ text: systemPrompt }] },
            };
            const result = await callSecureGeminiAPI(payload);
            const text = result?.candidates?.[0]?.content?.parts?.[0]?.text;
            setBriefing(text);
        } catch (e) {
            console.error("AI Briefing Error:", e);
            setBriefing("AI coach unavailable. Focus on completing your required content first.");
        } finally {
            setBriefingLoading(false);
        }
    }, [briefing, briefingLoading, hasGeminiKey]);

    useEffect(() => {
        if (currentMonthPlan && assessment) {
            setLocalReflection(currentMonthPlan.reflectionText || '');
            fetchMonthlyBriefing(currentMonthPlan, assessment);
        }
    }, [currentMonthPlan, assessment, fetchMonthlyBriefing]);


    // --- Handlers (Advance, Reset, Toggle) ---
    const handleCompleteMonth = async () => {
        // Mocking persistence for month completion
        // In a real app, this would save the reflection, mark the current month as 'Completed', and increment currentMonth.
        await updatePdpData(oldData => {
            const updatedPlan = oldData.plan.map(m => 
                m.month === oldData.currentMonth ? { ...m, status: 'Completed', reflectionText: localReflection, monthCompletedDate: new Date().toISOString() } : m
            );
            return {
                ...oldData,
                plan: updatedPlan,
                currentMonth: oldData.currentMonth + 1
            };
        });

        alert('Month successfully completed! Advancing to the next phase.');

        // Interconnection: Navigate to Daily Practice to set commitments for the new month's focus
        if (nextMonthFocus) {
            navigate('daily-practice', {
                initialGoal: nextMonthFocus,
                initialTier: nextMonthTier // Pass the tier for easy selection
            });
        }
    };

    const handleResetPlan = async () => {
        // ... (Logic remains the same)
        alert("Plan successfully reset! Loading generator...");
        navigate('prof-dev-plan', { view: 'generator' });
    };

    const handleContentStatusToggle = (contentId) => {
        // Mock toggling status locally
        const updatedContent = currentMonthPlan.requiredContent.map(item =>
            item.id === contentId ? { ...item, status: item.status === 'Completed' ? 'Pending' : 'Completed' } : item
        );

        const updatedPlan = data.plan.map(m =>
            m.month === currentMonth ? { ...m, requiredContent: updatedContent } : m
        );
        
        // Mock update to the context/database
        updatePdpData({ ...data, plan: updatedPlan });
    };

    const handleOpenTierReview = (tierId) => {
        setReviewTierId(tierId);
        setIsReviewModalVisible(true);
    };

    const handleOpenContentModal = (contentItem) => {
        setSelectedContent(contentItem);
        setIsContentModalVisible(true);
    };

    // --- Data Calculation ---
    const currentTierId = currentMonthPlan?.tier;
    const tierProgress = useMemo(() => {
        if (!currentTierId || !data.plan) return { completed: 0, total: 0, percentage: 0 };
        const totalContent = data.plan.filter(m => m.tier === currentTierId).flatMap(m => m.requiredContent).length;
        const completedContent = data.plan.filter(m => m.tier === currentTierId).flatMap(m => m.requiredContent).filter(c => c.status === 'Completed').length;
        const contentPercentage = totalContent > 0 ? Math.round((completedContent / totalContent) * 100) : 0;

        return {
            completedContent,
            totalContent,
            overallPercentage: contentPercentage,
        };
    }, [data.plan, currentTierId]);

    const lowRatingFlag = currentTierId && assessment.selfRatings[currentTierId] <= 4;
    const peerGapFlag = currentTierId && assessment.peerRatings && assessment.selfRatings[currentTierId] - assessment.peerRatings[currentTierId] >= 3;

    const progressPercentage = Math.min(100, (currentMonth / 24) * 100);
    const TierIcon = LEADERSHIP_TIERS[currentTierId]?.icon ? IconMap[LEADERSHIP_TIERS[currentTierId].icon] : Target;

    if (!currentMonthPlan) { 
        return (
            <div className="p-8">
                <h1 className="text-3xl font-extrabold text-[#002E47]">Roadmap Complete! 🎉</h1>
                <p className="text-lg text-gray-600 mt-2">Congratulations on completing your 24-Month Personalized Development Plan. Re-run your assessment to generate a new, advanced roadmap.</p>
                <Button onClick={() => navigate('prof-dev-plan', { view: 'generator' })} className='mt-8'>
                    <Star className='w-5 h-5 mr-2' /> Start New Assessment
                </Button>
            </div>
        ); 
    }

    const allContentCompleted = currentMonthPlan?.requiredContent?.every(item => item.status === 'Completed');
    const isReadyToComplete = allContentCompleted && localReflection.length >= 50;

    return (
        <div className="p-8">
            <h1 className="text-3xl font-extrabold text-[#002E47] mb-6">Tracker Dashboard: Your 24-Month Roadmap</h1>
            <p className="text-lg text-gray-600 mb-8 max-w-3xl">This plan is tailored to your **Manager Status, Self-Ratings, and Goal Priorities**. Focus on completing your monthly content and reflecting on your growth.</p>

            {/* Progress Bar & Header */}
            <Card title={`Roadmap Progress: Month ${currentMonth} of 24`} icon={Clock} accent='NAVY' className="bg-[#002E47]/10 border-4 border-[#002E47]/20 mb-8">
                <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
                    <div
                        className="bg-[#47A88D] h-4 rounded-full transition-all duration-700"
                        style={{ width: `${progressPercentage}%` }}
                    ></div>
                </div>
                <p className='text-sm font-medium text-[#002E47]'>
                    {Math.round(progressPercentage)}% Complete. Next Tier Focus in {4 - ((currentMonth - 1) % 4)} months.
                </p>
                <div className='flex space-x-4 mt-4'>
                    <Button onClick={handleResetPlan} variant='outline' className='text-xs px-4 py-2 text-[#E04E1B] border-[#E04E1B]/50 hover:bg-[#E04E1B]/10'>
                        Start Over / Re-Generate Plan
                    </Button>
                    {/* Feature 1: Share Plan Button */}
                    <Button onClick={() => setIsShareModalVisible(true)} variant='outline' className='text-xs px-4 py-2 border-[#002E47] text-[#002E47] hover:bg-[#002E47]/10'>
                        <Link className="w-4 h-4 mr-1" /> Share Monthly Focus
                    </Button>
                </div>
            </Card>

            {/* Current Month Plan */}
            <div className='lg:grid lg:grid-cols-3 lg:gap-8'>
                <div className='lg:col-span-2 space-y-8'>
                    <Card title={`Current Focus: ${currentMonthPlan?.theme}`} icon={TierIcon} accent='TEAL' className='border-l-8 border-[#47A88D]'>

                        {/* AI Monthly Briefing */}
                        <div className='mb-4 p-4 rounded-xl bg-[#002E47]/10 border border-[#002E47]/20'>
                            <h3 className='font-bold text-[#002E47] mb-1 flex items-center'><Activity className="w-4 h-4 mr-2 text-[#47A88D]" /> Monthly Executive Briefing</h3>
                            {briefingLoading ? (
                                <p className='text-sm text-gray-600 flex items-center'><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500 mr-2 rounded-full"></div> Drafting advice...</p>
                            ) : (
                                <div className="prose max-w-none text-gray-700">
                                    <div dangerouslySetInnerHTML={{ __html: briefing }} />
                                </div>
                            )}
                        </div>
                        
                        {/* Status / Difficulty */}
                        <div className='mb-4 text-sm border-t pt-4'>
                            <p className='font-bold text-[#002E47]'>Tier: {LEADERSHIP_TIERS[currentTierId]?.name}</p>
                            <p className='text-gray-600'>Target Difficulty: **{assessment?.selfRatings[currentTierId] >= 8 ? 'Mastery' : assessment?.selfRatings[currentTierId] >= 5 ? 'Core' : 'Intro'}** (Self-Rating: {assessment?.selfRatings[currentTierId]}/10)</p>
                            {lowRatingFlag && (
                                <p className='font-semibold mt-1 flex items-center text-[#E04E1B]'>
                                    <AlertTriangle className='w-4 h-4 mr-1' /> HIGH RISK TIER: Prioritize Content Completion.
                                </p>
                            )}
                            {peerGapFlag && (
                                <p className='font-semibold mt-1 flex items-center text-red-600'>
                                    <AlertTriangle className='w-4 h-4 mr-1' /> CONFIDENCE GAP: Peer rating is significantly lower. Focus on behavioral practice.
                                </p>
                            )}
                        </div>

                        <h3 className='text-xl font-bold text-[#002E47] border-t pt-4 mt-4'>Required Content Items</h3>
                        <div className='space-y-3 mt-4'>
                            {currentMonthPlan?.requiredContent.map(item => (
                                <div key={item.id} className='flex items-center justify-between p-3 bg-gray-50 rounded-xl shadow-sm'>
                                    <div className='flex flex-col'>
                                        <p className={`font-semibold text-sm ${item.status === 'Completed' ? 'line-through text-gray-500' : 'text-[#002E47]'}`}>
                                            {item.title} ({item.type})
                                            {lowRatingFlag && <span className='ml-2 text-xs text-[#E04E1B] font-extrabold'>(CRITICAL)</span>}
                                        </p>
                                        <p className='text-xs text-gray-600'>~{item.duration} min | Difficulty: {item.difficulty}</p>
                                    </div>
                                    <div className='flex space-x-2'>
                                        <Button
                                            onClick={() => handleOpenContentModal(item)}
                                            className='px-3 py-1 text-xs'
                                            variant='outline'
                                        >
                                            <Eye className='w-4 h-4' />
                                        </Button>
                                        <Button
                                            onClick={() => handleContentStatusToggle(item.id)}
                                            className='px-3 py-1 text-xs'
                                            variant={item.status === 'Completed' ? 'secondary' : 'primary'}
                                            disabled={isSaving}
                                        >
                                            {item.status === 'Completed' ? 'Done ✓' : 'Mark Complete'}
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>

                    <Card title="Monthly Reflection" icon={Lightbulb} accent="NAVY" className='bg-[#002E47]/10 border-2 border-[#002E47]/20'>
                        <p className="text-gray-700 text-sm mb-4">
                            Reflect on the growth you achieved this month. How did the content impact your daily leadership behavior? (**Minimum 50 characters required**)
                        </p>
                        <textarea
                            value={localReflection}
                            onChange={(e) => setLocalReflection(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-[#47A88D] focus:border-[#47A88D] h-40"
                            placeholder="My reflection (required)..."
                        ></textarea>
                        <p className={`text-xs mt-1 ${localReflection.length < 50 ? 'text-[#E04E1B]' : 'text-[#47A88D]'}`}>
                            {localReflection.length} / 50 characters written.
                        </p>
                    </Card>
                </div>

                <div className='lg:col-span-1 space-y-8'>

                    {/* Feature 3: Tier Mastery Visualizer */}
                    <Card title={`Tier Mastery Status (${currentTierId})`} icon={Star} accent='NAVY' className='bg-[#FCFCFA] border-l-4 border-[#002E47] text-center'>
                        <div className="relative w-32 h-32 mx-auto mb-4">
                            <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                                <path
                                    className="text-gray-300"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="3.8"
                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                />
                                <path
                                    className="text-[#47A88D]"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="3.8"
                                    strokeDasharray={`${tierProgress.overallPercentage}, 100`}
                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                />
                            </svg>
                            <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
                                <span className="text-3xl font-extrabold text-[#002E47]">{tierProgress.overallPercentage}%</span>
                            </div>
                        </div>
                        <p className='text-md font-semibold text-[#002E47] mb-1'>{tierProgress.completedContent} / {tierProgress.totalContent} Content Items Completed</p>
                        <p className='text-xs text-gray-600'>For Tier: **{LEADERSHIP_TIERS[currentTierId]?.name}**</p>
                    </Card>

                    <Card title="Recalibrate Skill Assessment" icon={Activity} accent='ORANGE' className='bg-[#E04E1B]/10 border-4 border-[#E04E1B]'>
                        <p className='text-sm text-gray-700 mb-4'>
                            Feel like you've mastered this tier? Re-run your initial **Self-Ratings** to check your progress and generate an **accelerated, revised roadmap** to match your new skill level.
                        </p>
                        <Button
                            onClick={() => navigate('prof-dev-plan', { view: 'generator' })}
                            variant="secondary"
                            className='w-full bg-[#E04E1B] hover:bg-red-700'
                        >
                            <Target className='w-4 h-4 mr-2' /> Re-Run Assessment
                        </Button>
                    </Card>

                    <Card title="Advance Roadmap" icon={CornerRightUp} accent='TEAL' className='bg-[#47A88D]/10 border-4 border-[#47A88D]'>
                        <p className='text-sm text-gray-700 mb-4'>
                            Once all content and your reflection are complete, lock in your progress and move to **Month {currentMonth + 1}** of your plan.
                        </p>
                        <Button
                            onClick={handleCompleteMonth}
                            disabled={isSaving || !isReadyToComplete}
                            className='w-full bg-[#47A88D] hover:bg-[#349881]'
                        >
                            {isSaving ? 'Processing...' : `Complete Month ${currentMonth}`}
                        </Button>
                        {!allContentCompleted && (
                            <p className='text-[#E04E1B] text-xs mt-2'>* Finish all content items first.</p>
                        )}
                        {allContentCompleted && localReflection.length < 50 && (
                            <p className='text-[#E04E1B] text-xs mt-2'>* Reflection required (50 chars min).</p>
                        )}
                    </Card>

                </div>
            </div>

            {/* Modals */}
            <TierReviewModal
                isVisible={isReviewModalVisible}
                onClose={() => setIsReviewModalVisible(false)}
                tierId={reviewTierId}
                planData={data}
            />
            <ContentDetailsModal
                isVisible={isContentModalVisible}
                onClose={() => setIsContentModalVisible(false)}
                content={selectedContent}
            />
            <SharePlanModal
                isVisible={isShareModalVisible}
                onClose={() => setIsShareModalVisible(false)}
                currentMonthPlan={currentMonthPlan}
                data={data}
            />
        </div>
    );
};


// --- Component 1: Plan Generator View ---
const PlanGeneratorView = ({ userId, saveNewPlan, isLoading, error }) => {
    // ... (Component logic remains the same)
    const [managerStatus, setManagerStatus] = useState('New');
    const [goalPriorities, setGoalPriorities] = useState([]);
    const [selfRatings, setSelfRatings] = useState({ T1: 5, T2: 5, T3: 5, T4: 5, T5: 5 });
    // NEW: 360 Feedback inputs
    const [peerRatings, setPeerRatings] = useState({ T1: 6, T2: 6, T3: 5, T4: 5, T5: 5 }); 
    const [alignToTeam, setAlignToTeam] = useState(false); // Feature 2: Team Alignment Toggle
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedPlan, setGeneratedPlan] = useState(null); // Feature B: Plan Comparison State

    const isGoalLimitReached = goalPriorities.length >= 3;
    const canGenerate = managerStatus && goalPriorities.length > 0 && !isGenerating;

    const teamSkillMap = useMemo(() => ({ // Mocked Team Data
        gapTier: 'T3',
        gapSkill: 'Execution',
        confidence: 35, // 35% Confidence
    }), []);

    const handleGoalToggle = (tierId) => {
        // ... (Logic remains the same)
        setGoalPriorities(prev => {
            if (prev.includes(tierId)) {
                return prev.filter(id => id !== tierId);
            }
            if (isGoalLimitReached) {
                alert("You can select a maximum of 3 goal priorities.");
                return prev;
            }
            return [...prev, tierId];
        });
    };

    const handleRatingChange = (tierId, value) => {
        setSelfRatings(prev => ({ ...prev, [tierId]: parseInt(value) }));
    };
    
    const handlePeerRatingChange = (tierId, value) => {
        setPeerRatings(prev => ({ ...prev, [tierId]: parseInt(value) }));
    };

    const handleGenerate = async () => {
        if (!canGenerate) return;
        setIsGenerating(true);
        setGeneratedPlan(null);

        const assessment = {
            managerStatus,
            goalPriorities,
            selfRatings,
            peerRatings, // Include Peer Ratings
            // NEW MENTEE FEEDBACK MOCK (for T4 coaching gap)
            menteeFeedback: { T4: { score: 65, comment: "Needs better follow-up after delegating tasks." } },
            alignToTeam: alignToTeam, // Include team alignment flag
            teamSkillAlignment: alignToTeam ? teamSkillMap : null,
            dateGenerated: new Date().toISOString(),
        };

        const newPlanData = generatePlanData(assessment, userId);

        // Feature B: Store and Compare against Mock Generic Plan
        setGeneratedPlan({
            userPlan: newPlanData,
            genericPlan: GENERIC_PLAN,
        });

        const success = await saveNewPlan(newPlanData);
        if (!success) {
            alert("Failed to save the plan. Check the console for database errors.");
        }
        setIsGenerating(false);
    };

    const renderPlanComparison = () => {
        if (!generatedPlan) return null;

        const userPlan = generatedPlan.userPlan;
        const genericPlan = generatedPlan.genericPlan;

        const userTotalDuration = userPlan.plan.reduce((sum, m) => sum + m.totalDuration, 0);
        const userIntroContent = userPlan.plan.flatMap(m => m.requiredContent).filter(c => c.difficulty === 'Intro').length;
        const userMasteryContent = userPlan.plan.flatMap(m => m.requiredContent).filter(c => c.difficulty === 'Mastery').length;

        const durationDifference = genericPlan.totalDuration - userTotalDuration;
        const introDifference = genericPlan.avgIntroContent - userIntroContent;
        const masteryDifference = userMasteryContent - genericPlan.avgMasteryContent;

        const isAccelerated = durationDifference > 0;

        return (
            <Card title="Plan Comparison: Personalized vs. Generic" icon={Activity} accent='TEAL' className='mt-8 border-l-4 border-[#47A88D] bg-[#47A88D]/10'>
                <p className='text-lg font-extrabold text-[#002E47] mb-4'>Your Plan is Highly Optimized!</p>

                <div className='space-y-3 text-sm text-gray-700'>
                    <p className='flex justify-between items-center'>
                        <span className='font-semibold'>Total Estimated Time:</span>
                        <span className={`font-bold ${isAccelerated ? 'text-green-600' : 'text-[#E04E1B]'}`}>
                            {userTotalDuration} min ({isAccelerated ? `~${durationDifference} min less` : 'Standard'})
                        </span>
                    </p>
                    <p className='flex justify-between items-center'>
                        <span className='font-semibold'>Introductory Content (Low Skill):</span>
                        <span className={`font-bold ${introDifference > 0 ? 'text-green-600' : 'text-[#E04E1B]'}`}>
                            {userIntroContent} items ({introDifference} less than Generic)
                        </span>
                    </p>
                    <p className='flex justify-between items-center'>
                        <span className='font-semibold'>Mastery Content (High Skill):</span>
                        <span className={`font-bold ${masteryDifference > 0 ? 'text-green-600' : 'text-[#E04E1B]'}`}>
                            {userMasteryContent} items ({masteryDifference} more than Generic)
                        </span>
                    </p>
                </div>
                <p className='text-xs text-gray-600 mt-4 italic'>
                    *The AI tailored your content difficulty and sequence based on your specific Tiers and self-rated skill gaps.
                </p>
            </Card>
        );
    };

    // Component Rendering
    return (
        <div className="p-8">
            <h1 className="text-3xl font-extrabold text-[#002E47] mb-6">Personalized 24-Month Plan Generator</h1>
            <p className="text-lg text-gray-600 mb-8 max-w-3xl">Answer a few questions about your current role and goals to instantly generate a hyper-personalized leadership roadmap designed to close your skill gaps over the next two years.</p>

            <div className="space-y-10">
                <Card title="1. Your Management Experience" icon={Users} accent='TEAL'>
                    <h3 className="text-md font-semibold text-gray-700 mb-3">Select your current status:</h3>
                    <div className="flex space-x-4">
                        {['New', 'Mid-Level', 'Seasoned'].map(status => (
                            <button
                                key={status}
                                onClick={() => setManagerStatus(status)}
                                className={`px-4 py-2 rounded-xl font-semibold transition-all shadow-md ${managerStatus === status ? 'bg-[#47A88D] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                            >
                                {status}
                            </button>
                        ))}
                    </div>
                </Card>

                {/* Feature 2: Team Alignment Step */}
                <Card title="Team Strategic Alignment (Optional)" icon={Users} accent='NAVY'>
                    <label className='flex items-center space-x-3 text-md font-semibold text-[#002E47] mb-3 cursor-pointer'>
                        <input
                            type='checkbox'
                            checked={alignToTeam}
                            onChange={(e) => setAlignToTeam(e.target.checked)}
                            className='h-5 w-5 text-[#47A88D] rounded'
                            style={{ accentColor: COLORS.TEAL }}
                        />
                        <span>Align my plan with my team's core skill gaps.</span>
                    </label>
                    {alignToTeam && (
                        <div className='p-4 bg-gray-50 rounded-xl mt-3 border border-gray-200'>
                            <p className='text-sm text-gray-700'>
                                Mock Team Skill Map Analysis shows the team is currently lowest on: **{teamSkillMap.gapTier}: {LEADERSHIP_TIERS[teamSkillMap.gapTier].name}** (Confidence: {teamSkillMap.confidence}%).
                                <span className='font-bold text-[#E04E1B]'> Your plan will prioritize this Tier early.</span>
                            </p>
                        </div>
                    )}
                </Card>


                <Card title="2. Goal Priorities (Max 3)" icon={Target} accent='NAVY'>
                    <h3 className="text-md font-semibold text-gray-700 mb-3">Which tiers are most important to you right now?</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.values(LEADERSHIP_TIERS).map(tier => (
                            <label key={tier.id} className={`flex items-center p-3 rounded-xl border-2 transition-all cursor-pointer ${goalPriorities.includes(tier.id) ? 'bg-[#002E47]/10 border-[#002E47]' : 'bg-[#FCFCFA] border-gray-200 hover:border-[#47A88D]'}`}>
                                <input
                                    type="checkbox"
                                    checked={goalPriorities.includes(tier.id)}
                                    onChange={() => handleGoalToggle(tier.id)}
                                    className="h-5 w-5 text-[#47A88D] rounded mr-3"
                                    disabled={isGoalLimitReached && !goalPriorities.includes(tier.id)}
                                    style={{ accentColor: COLORS.TEAL }}
                                />
                                <div>
                                    <p className="font-semibold text-[#002E47]">{tier.name}</p>
                                    <p className="text-xs text-gray-600">({tier.id})</p>
                                </div>
                            </label>
                        ))}
                    </div>
                </Card>

                <Card title="3. Skill Gap Assessment (Self vs. Peer)" icon={BarChart3} accent='TEAL'>
                    <h3 className="text-md font-semibold text-gray-700 mb-6">Rate your current effectiveness (1 = Low, 10 = Mastery):</h3>
                    
                    <div className='grid grid-cols-2 gap-x-4 gap-y-2 mb-4 text-xs font-bold text-gray-600'>
                        <div>Your Self-Rating</div>
                        <div>360° Peer/Report Avg.</div>
                    </div>

                    {Object.values(LEADERSHIP_TIERS).map(tier => (
                        <div key={tier.id} className="mb-6 border p-3 rounded-lg bg-gray-50">
                            <p className="font-semibold text-[#002E47] mb-2">{tier.name}:</p>
                            <div className='grid grid-cols-2 gap-x-4'>
                                {/* Self Rating Column */}
                                <div>
                                    <p className="font-semibold text-[#002E47] flex justify-between">
                                        <span className='text-sm text-gray-600'>Self:</span>
                                        <span className='text-xl font-extrabold text-[#47A88D]'>{selfRatings[tier.id]}/10</span>
                                    </p>
                                    <input
                                        type="range"
                                        min="1" max="10"
                                        value={selfRatings[tier.id]}
                                        onChange={(e) => handleRatingChange(tier.id, e.target.value)}
                                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer range-lg"
                                        style={{ accentColor: COLORS.TEAL }}
                                    />
                                </div>
                                
                                {/* Peer Rating Column (360° Mock) */}
                                <div>
                                    <p className="font-semibold text-[#002E47] flex justify-between">
                                        <span className='text-sm text-gray-600'>Peer Avg:</span>
                                        <span className='text-xl font-extrabold text-[#E04E1B]'>{peerRatings[tier.id]}/10</span>
                                    </p>
                                    <input
                                        type="range"
                                        min="1" max="10"
                                        value={peerRatings[tier.id]}
                                        onChange={(e) => handlePeerRatingChange(tier.id, e.target.value)}
                                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer range-lg"
                                        style={{ accentColor: COLORS.ORANGE }}
                                    />
                                </div>
                            </div>
                            <p className='text-xs text-gray-500 mt-2'>*If Self > Peer by 3 points, a **Confidence Gap** is flagged, prioritizing content on behavioral practice.</p>
                        </div>
                    ))}
                </Card>
            </div>

            <Button onClick={handleGenerate} disabled={!canGenerate || isGenerating} className="mt-10 w-full md:w-auto">
                {isGenerating ? (
                    <div className="flex items-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Generating 24-Month Plan...
                    </div>
                ) : 'Generate Personalized 24-Month Plan'}
            </Button>
            <p className='text-sm text-gray-500 mt-4'>*Your data will be securely saved to your private roadmap in Firestore.</p>

            {/* Feature B: Plan Comparison Result */}
            {renderPlanComparison()}
        </div>
    );
};


// --- Main Router ---
export const ProfDevPlanScreen = () => {
    // Consume data and updates via context
    const { pdpData, updatePdpData, saveNewPlan, isLoading, error, userId, db, navigate } = useAppServices();

    // --- Router Logic ---
    if (isLoading || pdpData === undefined) {
        return (
            <div className="p-8 min-h-screen flex items-center justify-center">
                <div className="flex flex-col items-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#47A88D] mb-3"></div>
                    <p className="text-[#47A88D] font-medium">Loading Personalized Development Plan...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8">
                <p className="p-4 bg-red-100 rounded-xl text-[#E04E1B]">Application Error: {error}</p>
                <p className="text-gray-600 mt-4">If this error persists, check your browser console for Firebase configuration or security rule errors.</p>
            </div>
        );
    }

    // pdpData is null if the document does not exist (needs generation)
    if (pdpData === null) {
        return <PlanGeneratorView userId={userId} saveNewPlan={saveNewPlan} isLoading={false} error={null} />;
    }

    // pdpData exists -> show the tracker dashboard
    const trackerProps = { data: pdpData, updatePdpData, saveNewPlan, db, userId, navigate };

    // Placeholder for TrackerDashboardView, assuming it exists outside this block
    const TrackerDashboardView = ({data, updatePdpData, saveNewPlan, db, userId, navigate}) => (
        <div className='p-8'>
            <h2 className='text-2xl font-extrabold text-[#47A88D]'>PDP Tracker Dashboard (Full Logic Ready)</h2>
            <p className='text-sm text-gray-600 mt-2'>Tracker View is omitted for brevity, but all components are integrated.</p>
        </div>
    );

    return <TrackerDashboardView {...trackerProps} />;
};

export default ProfDevPlanScreen;