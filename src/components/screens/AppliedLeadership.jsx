// src/components/screens/AppliedLeadership.jsx

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
    Briefcase, Aperture, Users, Heart, Gavel, Code, PiggyBank, GraduationCap, X, ChevronRight, Zap, Target, CornerRightUp, Lightbulb, Mic, MessageSquare, Compass, Network, Globe, TrendingDown, Clock, Cpu, CornerDownRight, ArrowLeft, BookOpen, Download
} from 'lucide-react';

/* =========================================================
   MOCK/UI UTILITIES 
========================================================= */
const COLORS = {
    NAVY: '#002E47', 
    TEAL: '#47A88D', 
    ORANGE: '#E04E1B', 
    LIGHT_GRAY: '#FCFCFA',
    OFF_WHITE: '#FFFFFF',
    SUBTLE: '#E5E7EB',
};

// Mocking useAppServices assuming Gemini API setup from App.jsx is robust
const useAppServices = () => ({
    navigate: (screen, params) => console.log(`Navigating to ${screen} with params:`, params),
    callSecureGeminiAPI: async (payload) => {
        const query = payload.contents[0].parts[0].text;
        
        if (payload.generationConfig?.responseMimeType === 'application/json') {
            return { candidates: [{ content: { parts: [{ text: JSON.stringify([
                "Schedule one 15-minute 1:1 with an intern to discuss their long-term career path (T4).",
                "Start every team communication by linking it to the organization's overarching mission (T5).",
                "Practice silence for 10 seconds after asking a difficult question in a board meeting (T1)."
            ]) }] } }] };
        } 
        
        // Highly contextual mock response based on Core Tension (Fallback if API is down)
        const feedback = query.includes("Scarcity Mindset") 
            ? "EXECUTIVE COACHING INSIGHT: Your operational thinking is constrained by the **Scarcity Mindset**. Reframe your challenge from 'lack of resources' to 'prioritizing leverage.' Delegate budgeting to free up 5 hours for strategic partner engagement (T5)."
            : query.includes("Digital Distance")
            ? "EXECUTIVE COACHING INSIGHT: The **Digital Distance** requires over-indexing on written clarity. Structure your next complex decision in a single, high-fidelity document before discussing it live (T2)."
            : "VISIONARY INSIGHT: The greatest leverage point in your scenario is to redefine success metrics away from vanity metrics towards core social impact. How does your leadership team reflect that mandate?";

        return { candidates: [{ content: { parts: [{ text: feedback }] } }] };
    },
    hasGeminiKey: () => true,
    GEMINI_MODEL: 'gemini-2.5-flash-preview-09-2025',
});


const Card = ({ children, title, icon: Icon, className = '', onClick, accent = 'TEAL' }) => {
    const accentColor = COLORS[accent] || COLORS.TEAL;
    return (
        <div
            className={`relative p-6 rounded-2xl border-2 shadow-xl transition-all duration-300 text-left bg-[${COLORS.LIGHT_GRAY}] ${className}`}
            style={{ borderColor: COLORS.SUBTLE, color: COLORS.NAVY }}
        >
            <span style={{ position:'absolute', top:0, left:0, right:0, height:6, background: accentColor, borderTopLeftRadius:14, borderTopRightRadius:14 }} />
            {Icon && (<div className="w-10 h-10 rounded-lg flex items-center justify-center border mb-3" style={{ borderColor: COLORS.SUBTLE, background: COLORS.OFF_WHITE }}><Icon className="w-5 h-5" style={{ color: accentColor }} /></div>)}
            {title && <h2 className="text-xl font-extrabold mb-2" style={{ color: COLORS.NAVY }}>{title}</h2>}
            {children}
        </div>
    );
};

const Button = ({ children, onClick, disabled = false, variant = 'primary', className = '', ...rest }) => {
    let baseStyle = "px-6 py-3 rounded-xl font-semibold transition-all shadow-lg focus:outline-none focus:ring-4 text-white flex items-center justify-center";
    if (variant === 'primary') { baseStyle += ` bg-[${COLORS.TEAL}] hover:bg-[#349881] focus:ring-[${COLORS.TEAL}]/50`; }
    else if (variant === 'secondary') { baseStyle += ` bg-[${COLORS.ORANGE}] hover:bg-[#C33E12] focus:ring-[${COLORS.ORANGE}]/50`; }
    else if (variant === 'outline') { baseStyle = `px-6 py-3 rounded-xl font-semibold transition-all shadow-md border-2 border-[${COLORS.TEAL}] text-[${COLORS.TEAL}] hover:bg-[${COLORS.TEAL}]/10 focus:ring-4 focus:ring-[${COLORS.TEAL}]/50 bg-[${COLORS.OFF_WHITE}] flex items-center justify-center`; }
    else if (variant === 'nav-back') { baseStyle = `px-4 py-2 rounded-xl font-semibold transition-all shadow-md border-2 border-gray-300 text-gray-700 hover:bg-gray-100 flex items-center justify-center`; }
    if (disabled) { baseStyle = "px-6 py-3 rounded-xl font-semibold bg-gray-300 text-gray-500 cursor-not-allowed shadow-inner transition-none flex items-center justify-center"; }
    return (<button {...rest} onClick={onClick} disabled={disabled} className={`${baseStyle} ${className}`}>{children}</button>);
};

// Utility function to convert Markdown to HTML (used in the modal)
async function mdToHtml(md) {
    let html = md;
    html = html.replace(/## (.*$)/gim, '<h2 style="font-size: 24px; font-weight: 800; color: #002E47; border-bottom: 2px solid #E5E7EB; padding-bottom: 5px; margin-top: 20px;">$1</h2>');
    html = html.replace(/### (.*$)/gim, '<h3 style="font-size: 18px; font-weight: 700; color: #47A88D; margin-top: 15px;">$1</h3>');
    html = html.replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>');
    // Replace double newlines with closing/opening p tags
    html = html.replace(/\n\n/g, '</p><p style="font-size: 16px; color: #374151; margin-top: 10px;">');
    // Replace single newlines followed by a bullet with <li>
    html = html.replace(/\n\* (.*)/gim, '<li>$1</li>');
    // Wrap loose <li>s in <ul> tags
    html = html.replace(/(<li>.*<\/li>)+/gim, (match) => `<ul style="list-style: disc; margin-left: 25px; margin-top: 10px; font-size: 16px; color: #374151;">${match}</ul>`);
    // Final wrap for any remaining text (ensuring we don't double-wrap)
    if (!html.startsWith('<') && html.trim().length > 0) {
        html = `<p style="font-size: 16px; color: #374151;">${html}</p>`;
    }
    return html;
}


/* =========================================================
   WORLD-CLASS DOMAIN DATA STRUCTURE
   (Defined by Core Leadership Tension and precise Focus Areas)
========================================================= */

const LEADERSHIP_DOMAINS = [
    // 1. Gender/Identity Focus
    { 
        id: 'women-exec', 
        title: 'Executive Edge: Women’s Track', 
        icon: Users, 
        color: 'ORANGE', 
        subtitle: 'Mastering influence, negotiation, and executive presence to accelerate advancement.', 
        coreTension: 'The **Double Bind** requires balancing competence with likability; leadership must be intentional and sponsorship-focused, not mentorship-reliant.',
        focus: ['Sponsorship vs. Mentorship Leverage', 'Strategic Negotiation Tactics', 'Cultivating Executive Presence', 'Managing Systemic Bias & Microaggressions'] 
    },
    { 
        id: 'lgbtqia-leader', 
        title: 'Inclusion & Identity: LGBTQIA+', 
        icon: Heart, 
        color: 'NAVY', 
        subtitle: 'Leading authentically, championing intersectional inclusion, and influencing organizational culture.', 
        coreTension: 'The pressure to conform inhibits genuine influence. High-impact leadership requires **vulnerability** as a tool to build psychological safety for others.',
        focus: ['Authentic Leadership & Vulnerability', 'Sponsorship & Advocacy', 'Navigating Disclosure', 'Creating Psychological Safety'] 
    },
    { 
        id: 'poc-leader', 
        title: 'Culture & Identity: Leaders of Color', 
        icon: Network, 
        color: 'TEAL', 
        subtitle: 'Strategies for navigating unique cultural expectations, leveraging diverse perspectives, and combating microaggressions.', 
        coreTension: 'The **"Cultural Tax"** drains strategic bandwidth. Leadership must focus on mitigating microaggressions while strategically leveraging diverse insights.',
        focus: ['Mitigating the "Cultural Tax"', 'Leveraging Diverse Networks', 'Strategic Communication', 'Sponsorship & Visibility'] 
    },
    // 2. Sector Focus
    { 
        id: 'non-profit', 
        title: 'Impact & Mission Mastery (Non-Profit)', 
        icon: PiggyBank, 
        color: 'TEAL', 
        subtitle: 'Leading with resource scarcity, maximizing social impact, and managing diverse boards and volunteer teams.', 
        coreTension: 'The **Scarcity Mindset** is endemic. Effective leadership balances mission fidelity with rigorous financial stewardship and measurable social impact.',
        focus: ['Social Impact Measurement & KPIs', 'Resource Stewardship & Grant Maximization', 'High-Stakes Board Dynamics', 'Volunteer Motivation & Retention'] 
    },
    { 
        id: 'public-sector', 
        title: 'Public Sector & Governance', 
        icon: Gavel, 
        color: 'ORANGE', 
        subtitle: 'Navigating bureaucracy, driving large-scale policy implementation, and managing political stakeholders.', 
        coreTension: 'The **Accountability Vacuum** demands precise communication. Influence requires managing complex inter-agency politics and maintaining transparency.',
        focus: ['Policy Implementation Strategy', 'Navigating Bureaucracy', 'Public Accountability & Transparency', 'Cross-Agency Collaboration'] 
    },
    // 3. Functional/Operational Focus
    { 
        id: 'tech-lead', 
        title: 'Leading the Technical Edge', 
        icon: Code, 
        color: 'NAVY', 
        subtitle: 'Translating code debt into business risk, managing innovation velocity, and retaining top tech talent.', 
        coreTension: 'The **Translation Gap** means technical risks are invisible to the executive suite. Leadership must connect agile process to quantifiable business outcomes.',
        focus: ['Agile Leadership & Innovation Velocity', 'Translating Technical Debt to Business Risk', 'Data Governance & Ethics', 'Talent Retention in Hyper-Competitive Markets'] 
    },
    { 
        id: 'global-remote', 
        title: 'Distributed & Global Influence', 
        icon: Globe, 
        color: 'TEAL', 
        subtitle: 'Mastering cultural competency, leading asynchronously, and maintaining team cohesion across time zones.', 
        coreTension: 'The **Digital Distance** erodes trust. Leadership must proactively engineer cohesion, enforce asynchronous communication, and build cultural competency across borders.',
        focus: ['Asynchronous Management Protocols', 'Cross-Cultural Communication', 'Building Digital Trust', 'Global Talent Management'] 
    },
    // 4. Situational/Career Stage Focus
    { 
        id: 'crisis-turnaround', 
        title: 'Crisis & Turnaround Strategy', 
        icon: TrendingDown, 
        color: 'ORANGE', 
        subtitle: 'Rapid decision-making, stakeholder containment, and maintaining leadership resilience under existential pressure.', 
        coreTension: 'The **Urgency Bias** mandates action over analysis. Leadership must enforce disciplined decision triage to ensure short-term survival does not jeopardize long-term recovery.',
        focus: ['High-Stakes Decision Triage', 'Crisis Communication Playbook', 'Emotional Triage for Teams', 'Ethical Recovery Planning'] 
    },
    { 
        id: 'emerging-leader', 
        title: 'The Emerging Leader Playbook', 
        icon: GraduationCap, 
        color: 'NAVY', 
        subtitle: 'Transitioning from individual contributor to first-time manager: delegation, difficult feedback, and team motivation.', 
        coreTension: 'The **"Doer Identity"** must be retired. Success depends on shifting focus from personal execution to coaching and empowering former peers.',
        focus: ['Retiring the "Doer" Identity', 'Foundational Coaching Skills', 'Mastering Effective Delegation', 'Defining a Leadership Philosophy'] 
    },
    { 
        id: 'veteran-leader', 
        title: 'Military to Executive (Veteran’s Track)', 
        icon: Briefcase, 
        color: 'ORANGE', 
        subtitle: 'Translating military precision and discipline into corporate agility and complex organizational management.', 
        coreTension: 'The **Pacing Conflict** arises from differing operational tempos. Leadership must translate disciplined planning into agile strategy adapted for decentralized corporate environments.',
        focus: ['Translating Military Skills to Corporate KPIs', 'Navigating Corporate Culture & Pacing', 'Adaptive Planning & Resilience', 'Building New Mentorship Networks'] 
    },
];

/* =========================================================
   RICH EMBEDDED RESOURCE LIBRARY (Actual Content)
========================================================= */

const RESOURCE_LIBRARY = {
    'women-exec': [
        { title: 'Playbook: The Intentional Sponsorship Matrix', type: 'Playbook', description: 'A structured tool for identifying and cultivating sponsors (not just mentors) to drive career advancement.', 
            content: `## The Intentional Sponsorship Matrix: Your Strategy for Advancement

### The Mentorship Trap vs. The Sponsorship Ladder
Mentors offer advice (passive support). **Sponsors** offer advocacy, visibility, and high-leverage assignments (active support). To overcome the Double Bind, you must maximize sponsorship.

### How to Build Your Matrix
1.  **Identify Advocates (The A-Team):** List 3-5 senior leaders (internal/external) who have power, respect your work, and are willing to take risks on you.
2.  **Define High-Leverage Projects (HLP):** List 2-3 projects that directly impact the company P&L or mission and provide maximum visibility.
3.  **Monthly Advocacy Habit (MAH):** Commit to one monthly action where you proactively share **metrics of success** (not effort) with your A-Team. Never wait for an annual review.

* **Primary Takeaway:** Sponsorship requires evidence (quantifiable impact), not just relationship. Lead with data showing competence and impact.` },
        { title: 'Case Study: Navigating the "Double Bind" Negotiation', type: 'Case Study', description: 'Analysis of a high-stakes negotiation where the leader balanced assertiveness with perceived likability.', content: `## Case Study: The $20K Negotiation Gap

### Scenario Breakdown
A rising female executive, 'Sarah,' was offered a Director role with a starting salary $20K below the market average. If she negotiates forcefully, she risks being labeled "aggressive" (likability penalty). If she accepts, she internalizes the pay gap.

### The Win/Win Framework Used
Sarah anchored her negotiation not on her needs, but on **de-risking the organization** for hiring her. She presented a 90-day plan detailing exactly how her leadership would generate $100K in new revenue.

* **Result:** The negotiation shifted from being about Sarah's value to the company's future success. She secured the full salary increase and gained executive buy-in for her first-quarter plan.` }
    ],
    'non-profit': [
        { title: 'Playbook: Financial Stewardship for Mission Fidelity', type: 'Playbook', description: 'Techniques for rigorous budgeting and balancing program expansion with limited donor funds.', content: `## The Lean Mission Budgeting Playbook

### Overcoming the Scarcity Mindset
The Scarcity Mindset causes mission drift and burnout. **Solution:** Enforce a "mission-first, budget-aligned" approach, treating every program as a cost center that must justify its existence against core strategic impact goals.

### The 80/20 Rule for Program Evaluation
1.  **Identify 20% of Programs** that deliver 80% of the measurable social impact.
2.  **Identify 20% of Costs** that deliver 80% of administrative burden/mission misalignment (e.g., outdated software, inefficient fundraising channels).
3.  **Action:** Proactively retire or significantly streamline non-core 20% programs to reallocate resources to the high-impact core.

* **Primary Takeaway:** Focus funding on the activities that deliver the highest measurable impact, ruthlessly cutting administrative "motion."` }
    ],
    'tech-lead': [
        { title: 'Playbook: Quantifying Technical Debt as Business Risk', type: 'Playbook', description: 'A model to translate engineering priorities into clear financial and strategic metrics for executive consumption.', content: `## The Technical Translation Model: From Code to Capital Risk

### The Translation Gap
Executive leadership does not understand "technical debt" (TD). They understand **risk and cost**. The goal is to translate engineering concepts into the language of the C-Suite.

### Translation Framework (The 3 Cs)
1.  **Cost of Delay (CoD):** Calculate the lost revenue or increased operational cost incurred *per month* until the debt is paid.
2.  **Compliance Risk (CR):** Link specific TD items to regulatory failure points (e.g., GDPR, SOC 2).
3.  **Competitor Velocity (CV):** Show how long TD will block your team from releasing a feature already deployed by a key competitor.

* **Primary Takeaway:** Never ask for permission to fix debt; present it as a **mitigation strategy** to a quantifiable business threat.` }
    ],
    'emerging-leader': [
        { title: 'Toolkit: Mastering the Delegation Matrix', type: 'Toolkit', description: 'A practical tool to assess direct reports\' readiness for delegation and manage follow-up without micromanagement.', content: `## Toolkit: The Empowerment Delegation Matrix

### Retiring the "Doer" Identity
Your success is now measured by your team's execution, not your own. Delegation is not abdication; it is empowerment.

### The 4-Stage Readiness Model
1.  **Direct (R1 - Low Readiness):** Delegate the process (How), maintain tight follow-up. Used for new or low-skill reports.
2.  **Coach (R2 - Moderate Readiness):** Delegate the task (What), maintain scheduled check-ins.
3.  **Support (R3 - High Readiness):** Delegate the outcome (Why), check in only when asked.
4.  **Delegate (R4 - Mastery):** Delegate the strategic problem; they own the entire solution, including informing you of progress.

* **Primary Takeaway:** Never delegate the "How" to an R3/R4 report. Delegate the "Why" and allow them to own the intellectual property of the solution.` }
    ],
    'veteran-leader': [
        { title: 'Guide: Translating Military Discipline to Corporate Agility', type: 'Guide', description: 'A lexicon and framework for adapting formal planning (TTPs) into agile corporate execution.', content: `## The Pacing Conflict: Adapting TTPs to the Corporate World

### Core Tension: Precision vs. Speed
Military discipline (standard operating procedures, TTPs) conflicts with corporate agility (fail fast, iterate).

### Translation Lexicon
* **TTP (Tactics, Techniques, Procedures) $\rightarrow$ SOP (Standard Operating Procedures):** Use SOPs for repeatable maintenance tasks, not strategic decisions.
* **Commander's Intent $\rightarrow$ Strategic Vision:** Use the intent to empower decentralized decision-making (Leader-Leader Model).
* **AAR (After Action Review) $\rightarrow$ Blameless Post-Mortem:** Shift focus from "Who failed?" to "What failed in the process?"

* **Primary Takeaway:** Use the rigor of military planning to create clarity and trust, but allow the **agility of the field** to dictate pace and execution within clear guardrails.` }
    ],
    'crisis-turnaround': [
        { title: 'Playbook: The 48-Hour Crisis Communication Triage', type: 'Playbook', description: 'A step-by-step guide for rapid, transparent, and stabilizing communication during an existential crisis.', content: `## Crisis Communication Triage: The First 48 Hours

### Countering the Urgency Bias
In the first 48 hours, the urge is to communicate instantly without full facts. This leads to compounding trust failures.

### The Communication Triage
1.  **Internal (Hour 1):** Communicate **what you know** and **what you are doing** to find the rest. Establish a single, immediate source of truth (e.g., a dedicated slack channel).
2.  **Stakeholder (Hour 6):** Deliver a brief, factual statement of impact and commitment to recovery. Over-communicate stability, under-communicate future guarantees.
3.  **External (Hour 24+):** Be seen, be transparent, and own the immediate impact. Avoid legal jargon; use human language.

* **Primary Takeaway:** Don't wait for perfect information to communicate. Communicate your **process of seeking information** and your **commitment to ownership.**` }
    ],
    // The rest of the groups need minimal rich content defined for the modal to function fully
    'lgbtqia-leader': [
        { title: 'Guide: Leading with Authentic Vulnerability (Strategy)', type: 'Guide', url: 'https://leaderreps.co/lauthguide', description: 'A framework for strategic disclosure to build team trust and champion safety without compromising personal boundaries.', content: '## Strategic Vulnerability: Building the Safety Net\n\n**Tension:** Conformity vs. Influence. Leadership requires authenticity.\n\n* **Actionable Steps:**\n    * Define your "vulnerability zone" (what you share and what you keep private).\n    * Share one personal, high-leverage challenge you are currently facing (e.g., work/life balance).\n    * Actively advocate for an employee who has less power than you. This models safety for others.' },
    ],
    'poc-leader': [
        { title: 'Toolkit: Mitigating the Microaggression Cascade', type: 'Toolkit', url: 'https://leaderreps.co/pmicro', description: 'Scripts and practice scenarios for responding effectively to microaggressions in real-time.', content: '## The Microaggression Intervention Toolkit\n\n**Tension:** The Cultural Tax. Mitigation requires immediate, low-emotion response.\n\n* **The "Ouch-Say-Do" Script:**\n    * **Ouch:** Acknowledge the feeling ("Ouch, that comment made me pause."). \n    * **Say:** State the objective impact ("The implication that only men can lead this project is inappropriate."). \n    * **Do:** Redirect to the expected standard ("I expect all team members to be assessed solely on merit.").' },
    ],
    'public-sector': [
        { title: 'Report: Policy Implementation vs. Political Reality', type: 'Report', url: 'https://leaderreps.co/pspolicy', description: 'Analysis of implementation failure points and how to secure cross-agency buy-in.', content: '## Overcoming the Policy-to-Practice Gap\n\n**Tension:** Accountability Vacuum. Successful policy requires buy-in from competing agencies.\n\n* **Strategy:** Treat every internal agency as an external client. Map their specific success metrics. Present your policy not as a mandate, but as a lever that helps *them* achieve *their* goals. Influence is key; direct authority is limited.' },
    ],
    'global-remote': [
        { title: 'Guide: Asynchronous Management Protocol', type: 'Guide', url: 'https://leaderreps.co/gasync', description: 'Rules for minimizing real-time meetings and maximizing output using written communication and documentation.', content: '## The Asynchronous Team Charter\n\n**Tension:** Digital Distance. Real-time meetings should be the exception, not the rule.\n\n* **Rule 1:** Default to Documentation (DR): All decisions must be written down and searchable.\n* **Rule 2:** High-Friction Communication (HFC): If a decision takes more than 5 Slack/Email messages, schedule a 15-minute call.\n* **Rule 3:** Asynchronous 1:1s (A-1s): Use recorded video updates or shared written documents for routine check-ins to respect time zones.' },
    ],
};

/* =========================================================
   AI COACHING SIMULATOR (Sub-Component)
========================================================= */

const AICoachingSimulator = ({ domain }) => {
    const { callSecureGeminiAPI, hasGeminiKey, navigate } = useAppServices();
    const [scenario, setScenario] = useState('');
    const [result, setResult] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSimulate = async () => {
        if (!scenario.trim()) return;
        setIsLoading(true);
        setResult(null);

        // --- PRODUCTION AI PROMPT (High-Value Context) ---
        const systemPrompt = `You are a world-class executive coach specializing in ${domain.title}. Your primary focus is on addressing the core leadership tension: "${domain.coreTension}". Provide a single, concise coaching insight based on the user's scenario. Do not use markdown headers or lists. Focus on strategic leverage.`;
        
        const userQuery = `Context: ${domain.title}. Core Tension: ${domain.coreTension}. Analyze this scenario: "${scenario}". Provide a single, high-leverage coaching insight (1-2 sentences) relevant to this domain's challenges.`;
        // --- END PROMPT ---

        try {
            const payload = {
                contents: [{ parts: [{ text: userQuery }] }],
                systemInstruction: { parts: [{ text: systemPrompt }] },
                tools: [{ "google_search": {} }], // Enable grounding for world-class advice
            };
            const response = await callSecureGeminiAPI(payload);
            const text = response?.candidates?.[0]?.content?.parts?.[0]?.text;
            setResult(text?.trim() || "Simulation failed. Please try a different scenario.");
        } catch (e) {
            console.error("AI Simulation Error:", e);
            setResult("An error occurred during the simulation. Please check your API configuration.");
        } finally {
            setIsLoading(false);
        }
    };
    
    // Suggest 3 Micro-Habits for the Daily Practice
    const handleSuggestHabits = async () => {
        if (isLoading) return;
        setIsLoading(true);
        setResult(null);

        const systemPrompt = `You are an AI habit architect. Based on the domain ${domain.title}, generate an array of 3 hyper-specific, actionable micro-habits that could be added to a daily scorecard. The response MUST be a JSON array of strings.`;
        const userQuery = `Generate 3 micro-habits for the domain: ${domain.title}. Ensure they include a Tier focus (T1-T5) in parentheses.`;

        const jsonSchema = {
            type: "ARRAY",
            items: { type: "STRING" }
        };

        try {
            const payload = {
                contents: [{ parts: [{ text: userQuery }] }],
                systemInstruction: { parts: [{ text: systemPrompt }] },
                generationConfig: {
                    responseMimeType: "application/json",
                    responseSchema: jsonSchema
                },
            };
            const response = await callSecureGeminiAPI(payload);
            const jsonText = response?.candidates?.[0]?.content?.parts?.[0]?.text;
            const habits = JSON.parse(jsonText);
            
            setResult(
                <div className='mt-4 p-4 bg-white rounded-xl border border-dashed border-gray-300'>
                    <h4 className='text-sm font-bold text-[#002E47] mb-2 flex items-center'><CornerRightUp className='w-4 h-4 mr-2 text-[#47A88D]'/> Suggested Daily Micro-Habits:</h4>
                    <ul className='list-disc list-inside space-y-1 text-sm text-gray-700'>
                        {habits.map((h, i) => <li key={i}>{h}</li>)}
                    </ul>
                    <Button onClick={() => navigate('daily-practice', { initialGoal: domain.title, initialTier: 'T3' })} variant='outline' className='mt-4 text-xs px-3 py-1 w-full'>
                        <Clock className='w-3 h-3 mr-1'/> Add to Daily Practice
                    </Button>
                </div>
            );

        } catch (e) {
            console.error("Habit Suggestion Error:", e);
            setResult("Failed to generate habits. Please check API or try again.");
        } finally {
            setIsLoading(false);
        }
    }


    return (
        <Card title="AI Context Coach" icon={Mic} accent={domain.color} className='w-full'>
            <p className='text-sm text-gray-700 mb-4'>
                Simulate a real-world dilemma specific to **{domain.title}** and get immediate, context-aware coaching feedback.
            </p>
            <textarea
                value={scenario}
                onChange={(e) => setScenario(e.target.value)}
                placeholder={`Describe a current challenge in your ${domain.title} role... (e.g., "My non-profit board is resisting a necessary digital transformation due to fear of fundraising impact.")`}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-[#47A88D] focus:border-[#47A88D] h-24 mb-4"
            />
            
            <div className='flex space-x-3'>
                <Button onClick={handleSimulate} disabled={isLoading || !scenario.trim()} className="flex-1">
                    {isLoading ? <span className="flex items-center justify-center"><div className="animate-spin h-4 w-4 border-b-2 border-white mr-2 rounded-full"></div> Simulating...</span> : <><Lightbulb className='w-4 h-4 mr-2'/> Get Coaching Insight</>}
                </Button>
                <Button onClick={handleSuggestHabits} disabled={isLoading} variant='secondary' className="flex-1">
                    {isLoading ? <span className="flex items-center justify-center"><div className="animate-spin h-4 w-4 border-b-2 border-white mr-2 rounded-full"></div> Generating...</span> : <><Target className='w-4 h-4 mr-2'/> Generate Daily Habits</>}
                </Button>
            </div>


            {result && (
                <div className='mt-6 p-4 rounded-xl border-l-4 border-[#002E47] bg-white shadow-inner'>
                    <p className='text-xs font-semibold uppercase text-[#002E47] mb-1'>Coach's Insight</p>
                    <div className='text-sm text-gray-700 font-medium'>
                        {result}
                    </div>
                </div>
            )}
        </Card>
    );
};


/* =========================================================
   NEW FEATURE: Resource Detail Modal
========================================================= */

const ResourceDetailModal = ({ isVisible, onClose, resource, domain }) => {
    if (!isVisible || !resource) return null;

    const [htmlContent, setHtmlContent] = useState('');

    useEffect(() => {
        if (resource?.content) {
            (async () => {
                setHtmlContent(await mdToHtml(resource.content));
            })();
        }
    }, [resource]);

    return (
        <div className="fixed inset-0 bg-[#002E47]/90 z-50 flex items-center justify-center p-4">
            <div className="bg-[#FCFCFA] rounded-3xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-y-auto p-8">
                <div className="flex justify-between items-start border-b pb-4 mb-6">
                    <h2 className="text-2xl font-extrabold text-[#002E47] flex items-center">
                        <BookOpen className="w-6 h-6 mr-3 text-[#47A88D]" />
                        {resource.title} ({resource.type})
                    </h2>
                    <button onClick={onClose} className="p-2 text-gray-500 hover:text-[#E04E1B] transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>
                
                <div className="mb-6 text-sm flex space-x-4 border-b pb-4">
                    <p className="text-gray-700 font-semibold">Track: <span className='text-[#002E47]'>{domain.title}</span></p>
                    <p className="text-gray-700 font-semibold">Focus: <span className='text-[#002E47]'>{domain.coreTension}</span></p>
                </div>

                <div className="prose max-w-none text-gray-700">
                    {htmlContent 
                        ? <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
                        : <p>Loading detailed content...</p>
                    }
                </div>
                
                <div className='mt-8 pt-6 border-t border-gray-200'>
                    <Button onClick={onClose} variant='primary' className='w-full'>
                        <Download className='w-5 h-5 mr-2'/> Save & Close
                    </Button>
                </div>
            </div>
        </div>
    );
};


/* =========================================================
   MAIN SCREEN COMPONENT
========================================================= */

export default function AppliedLeadershipScreen() {
    const [selectedDomain, setSelectedDomain] = useState(null);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [selectedResource, setSelectedResource] = useState(null);
    
    // Function to handle opening a domain detail view
    const handleSelectDomain = useCallback((domain) => {
        setSelectedDomain(domain);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, []);
    
    const handleOpenResource = useCallback((resource) => {
        setSelectedResource(resource);
        setIsModalVisible(true);
    }, []);

    // Detail View Renderer
    const renderDomainDetail = () => {
        if (!selectedDomain) return null;

        const domain = selectedDomain;
        const resources = RESOURCE_LIBRARY[domain.id] || [];

        return (
            <div className="p-8 bg-white rounded-3xl shadow-2xl sticky top-0 md:top-4 z-30">
                <Button onClick={() => setSelectedDomain(null)} variant='nav-back' className='mb-6'>
                    <ArrowLeft className="w-5 h-5 mr-2" /> Back to Domains
                </Button>

                <h1 className="text-3xl font-extrabold flex items-center mb-2" style={{ color: COLORS.NAVY }}>
                    <domain.icon className='w-8 h-8 mr-3' style={{ color: COLORS[domain.color] }}/>
                    {domain.title}
                </h1>
                <p className='text-xl font-medium text-gray-600 mb-6'>{domain.subtitle}</p>

                {/* --- CORE TENSION CARD (Highlights uniqueness) --- */}
                <Card 
                    title="Core Leadership Tension" 
                    icon={Target} 
                    accent={domain.color} 
                    className={`mb-8 border-l-4 border-dashed border-[${COLORS.NAVY}]`}
                >
                    <p className='text-md font-semibold text-gray-700'>
                        {domain.coreTension}
                    </p>
                </Card>
                {/* --- END NEW CARD --- */}

                <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
                    {/* Feature 1: Key Focus Areas */}
                    <Card title="Skill Development Focus" icon={Compass} accent={domain.color} className='lg:col-span-1'>
                        <p className='text-sm text-gray-700 mb-3'>Critical skills and challenges addressed in this leadership domain:</p>
                        <ul className='list-disc list-inside space-y-2 text-sm text-[#002E47] font-medium'>
                            {domain.focus.map((f, i) => (
                                <li key={i} className='flex items-start'>
                                    <CornerDownRight className='w-4 h-4 mt-1 mr-1 flex-shrink-0' style={{ color: COLORS[domain.color] }}/>
                                    <span>{f}</span>
                                </li>
                            ))}
                        </ul>
                    </Card>

                    {/* Feature 2: Simulated AI Coaching */}
                    <div className='lg:col-span-2'>
                       <AICoachingSimulator domain={domain} />
                    </div>
                </div>
                
                {/* Feature 3: Curated Resource List (Built Out) */}
                <Card title="Curated Deep Dive Resources" icon={BookOpen} accent='NAVY' className='mt-8 lg:col-span-3'>
                    <p className='text-sm text-gray-700 mb-4'>Access specialized playbooks and case studies tailored to the **{domain.title}** context. Use these high-leverage resources to master your domain's core tensions.</p>
                    <div className='space-y-4'>
                        {resources.map((resource, index) => (
                            <button 
                                key={index} 
                                onClick={() => handleOpenResource(resource)}
                                className='group flex justify-between items-start p-4 bg-white border rounded-xl shadow-sm transition-all hover:shadow-lg hover:border-[#47A88D] w-full text-left'
                            >
                                <div className='flex flex-col'>
                                    <span className='text-md font-medium text-[#002E47] group-hover:text-[#47A88D]'>{resource.title}</span>
                                    <p className='text-xs text-gray-500 mt-1'>{resource.description}</p>
                                </div>
                                <div className='flex items-center space-x-3 flex-shrink-0 ml-4'>
                                    <span className={`text-xs px-3 py-1 rounded-full font-bold bg-gray-100 text-gray-600`}>
                                        {resource.type}
                                    </span>
                                    <ChevronRight className='w-5 h-5 text-[#002E47] group-hover:text-[#47A88D] transition-colors' />
                                </div>
                            </button>
                        ))}
                    </div>
                </Card>
            
            
            {/* The Resource Modal */}
            <ResourceDetailModal
                isVisible={isModalVisible}
                onClose={() => setIsModalVisible(false)}
                resource={selectedResource}
                domain={selectedDomain}
            />
        </div>
    );
    };

    // Main Domain Grid Renderer
    const renderDomainGrid = () => (
        <div className="p-8">
            <h1 className="text-4xl font-extrabold text-[#002E47] mb-4">Applied Leadership Domains</h1>
            <p className="text-xl text-gray-600 mb-10 max-w-4xl">
                Go beyond generic advice. Access micro-habits, resources, and AI coaching tailored to your specific industry, identity, or high-stakes operational context.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {LEADERSHIP_DOMAINS.map((domain) => {
                    const Icon = domain.icon;
                    const accentColor = COLORS[domain.color];
                    
                    return (
                        <button
                            key={domain.id}
                            onClick={() => handleSelectDomain(domain)}
                            className="text-left block w-full"
                        >
                            <div className={`p-6 rounded-2xl border-2 shadow-2xl transition-all duration-300 hover:scale-[1.03] hover:shadow-3xl`} style={{ borderColor: accentColor + '30', background: COLORS.LIGHT_GRAY }}>
                                <div className='flex items-center space-x-3 mb-4'>
                                    <div className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg" style={{ background: accentColor + '1A' }}>
                                        <Icon className="w-6 h-6" style={{ color: accentColor }} />
                                    </div>
                                    <h2 className="text-lg font-extrabold" style={{ color: COLORS.NAVY }}>{domain.title}</h2>
                                </div>
                                <p className="text-sm text-gray-600">{domain.subtitle}</p>
                                <div className='mt-4 flex justify-between items-center border-t pt-3'>
                                    <span className='text-xs font-semibold uppercase' style={{ color: accentColor }}>{domain.focus.length} Key Focus Areas</span>
                                    <ChevronRight className='w-4 h-4' style={{ color: accentColor }}/>
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );

    return (
        <div className='min-h-screen bg-gray-50'>
            {selectedDomain ? renderDomainDetail() : renderDomainGrid()}
        </div>
    );
}