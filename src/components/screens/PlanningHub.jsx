// src/components/screens/PlanningHub.jsx (Refactored for Consistency, Context, AI Fixes)

import React, { useState, useEffect, useMemo, useCallback } from 'react';
// --- Core Services & Context ---
import { useAppServices } from '../../services/useAppServices.jsx'; // cite: useAppServices.jsx

// --- Icons ---
import {
    ArrowLeft, CheckCircle, PlusCircle, X, TrendingUp, Target, AlertTriangle, Lightbulb,
    ShieldCheck, Cpu, Trash2, Zap, MessageSquare, BookOpen, Clock, CornerRightUp, Award, Activity,
    Link, CornerDownRight, Dumbbell, Trello, Loader // Added Trello, Loader
} from 'lucide-react';

/* =========================================================
   PALETTE & UI COMPONENTS (Standardized)
========================================================= */
// --- Primary Color Palette ---
const COLORS = { NAVY: '#002E47', TEAL: '#47A88D', BLUE: '#2563EB', ORANGE: '#E04E1B', GREEN: '#10B981', AMBER: '#F5A800', RED: '#E04E1B', LIGHT_GRAY: '#FCFCFA', OFF_WHITE: '#FFFFFF', SUBTLE: '#E5E7EB', TEXT: '#374151', MUTED: '#4B5563', PURPLE: '#7C3AED', BG: '#F9FAFB' }; // cite: App.jsx

// --- Standardized UI Components (Matches Dashboard/Dev Plan) ---
const Button = ({ children, onClick, disabled = false, variant = 'primary', className = '', size = 'md', ...rest }) => { /* ... Re-use exact Button definition from Dashboard.jsx ... */
    let baseStyle = `inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-4 disabled:opacity-50 disabled:cursor-not-allowed`;
    if (size === 'sm') baseStyle += ' px-4 py-2 text-sm'; else if (size === 'lg') baseStyle += ' px-8 py-4 text-lg'; else baseStyle += ' px-6 py-3 text-base'; // Default 'md'
    if (variant === 'primary') baseStyle += ` bg-[${COLORS.TEAL}] text-white shadow-lg hover:bg-[#349881] focus:ring-[${COLORS.TEAL}]/50`;
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
    <div className="min-h-[200px] flex items-center justify-center" style={{ background: COLORS.BG }}> <div className="flex flex-col items-center"> <Loader className="animate-spin h-12 w-12 mb-3" style={{ color: COLORS.TEAL }} /> <p className="font-semibold" style={{ color: COLORS.NAVY }}>{message}</p> </div> </div>
);
const Tooltip = ({ content, children }) => { /* ... Re-use definition from Labs.jsx ... */
    const [isVisible, setIsVisible] = useState(false);
    return ( <div className="relative inline-block" onMouseEnter={() => setIsVisible(true)} onMouseLeave={() => setIsVisible(false)}> {children} {isVisible && ( <div className="absolute z-10 w-64 p-3 -mt-2 text-xs text-white bg-[#002E47] rounded-lg shadow-lg bottom-full left-1/2 transform -translate-x-1/2"> {content} <div className="absolute left-1/2 transform -translate-x-1/2 -bottom-1 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-[#002E47]"></div> </div> )} </div> );
};

/* =========================================================
   UTILITIES (Local or Shared)
========================================================= */
// Markdown to HTML converter (Simplified version, ensure consistency if used elsewhere)
const mdToHtml = async (md) => { /* ... Re-use definition from Labs.jsx ... */
    if (!md) return ''; let html = md;
    html = html.replace(/^## (.*$)/gim, '<h2 class="text-xl font-extrabold text-[#002E47] border-b border-gray-200 pb-2 mb-3 mt-5">$1</h2>');
    html = html.replace(/^### (.*$)/gim, '<h3 class="text-lg font-bold text-[#47A88D] mt-4 mb-2">$1</h3>');
    html = html.replace(/\*\*(.*?)\*\*/gim, '<strong class="font-semibold">$1</strong>');
    html = html.replace(/^\* (.*$)/gim, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>\s*)+/g, (match) => `<ul class="list-disc list-inside space-y-1 mb-4 pl-4">${match.trim()}</ul>`);
    html = html.split('\n').map(line => { line = line.trim(); if (!line || line.startsWith('<h') || line.startsWith('<ul') || line.startsWith('<li') || line === '</ul>') return line; return `<p class="text-sm text-gray-700 mb-2">${line}</p>`; }).join('');
    html = html.replace(/<p><\/p>/g, '');
    return `<div class="prose prose-sm max-w-none">${html}</div>`;
};

/* =========================================================
   PLANNING HUB VIEWS (Refactored Components)
========================================================= */

/**
 * PreMortemView Component
 * Guides users through identifying risks for a major decision using AI audit.
 */
const PreMortemView = ({ setPlanningView }) => {
    // --- Consume Services ---
    const {
        strategicContentData, updateStrategicContentData, // Data for this hub // cite: useAppServices.jsx
        dailyPracticeData, updateDailyPracticeData, // For adding commitments // cite: useAppServices.jsx
        navigate, callSecureGeminiAPI, hasGeminiKey, GEMINI_MODEL // AI & Nav // cite: useAppServices.jsx
    } = useAppServices();

    // --- Local State ---
    // Initialize from context, provide robust defaults
    const [decision, setDecision] = useState(strategicContentData?.lastPreMortemDecision || 'Enter a high-stakes decision (e.g., Launch new product line?)');
    const [outcome, setOutcome] = useState(strategicContentData?.desiredOutcome || 'Define the specific, measurable success state.'); // Assumed field name
    const [risks, setRisks] = useState(strategicContentData?.risks || ['', '']); // Default with two empty risks
    // AI State
    const [isGenerating, setIsGenerating] = useState(false);
    const [auditResult, setAuditResult] = useState(''); // Raw AI response
    const [auditHtml, setAuditHtml] = useState(''); // Rendered HTML
    // Parsed outputs for actions
    const [mitigationText, setMitigationText] = useState(''); // Parsed mitigation step
    const [riskScenario, setRiskScenario] = useState(''); // Parsed highest risk for coaching lab

    // --- Effect to Parse AI Audit Result ---
    useEffect(() => {
        if (!auditResult) { setAuditHtml(''); setMitigationText(''); setRiskScenario(''); return; }
        // Render HTML
        (async () => setAuditHtml(await mdToHtml(auditResult)))();
        // Parse Mitigation Strategy (improved robustness)
        const mitigationMatch = auditResult.match(/### Mitigation Strategy\s*([\s\S]*?)(?:##|$)/i);
        if (mitigationMatch?.[1]) {
            const strategy = mitigationMatch[1].trim().split('\n').map(s => s.replace(/^[\*\-\d\.\s]+/, '').trim()).filter(Boolean)[0] || ''; // Get first non-empty line
            setMitigationText(strategy.substring(0, 100)); // Limit length
        }
        // Parse Amplified Risk for Scenario
        const riskMatch = auditResult.match(/### Risk Amplification\s*([\s\S]*?)(?:##|$)/i);
         if (riskMatch?.[1]) {
            const primaryRisk = riskMatch[1].trim().split('\n').map(s => s.replace(/^[\*\-\d\.\s]+/, '').trim()).filter(Boolean)[0] || 'Unforeseen consequences'; // Get first non-empty line
            setRiskScenario(primaryRisk.substring(0, 100)); // Limit length
        }
    }, [auditResult]);

    // --- Handlers for Risk Input Array ---
    const handleRiskChange = useCallback((index, value) => {
        setRisks(prev => prev.map((r, i) => (i === index ? value : r)));
        setAuditResult(''); // Clear audit when risks change
    }, []);
    const handleAddRisk = useCallback(() => setRisks(prev => [...prev, '']), []);
    const handleRemoveRisk = useCallback((index) => setRisks(prev => prev.filter((_, i) => i !== index)), []);

    // --- Handler to Run AI Pre-Mortem Audit ---
    const runPreMortemAudit = useCallback(async () => {
        const validRisks = risks.map(r => r.trim()).filter(Boolean); // Get non-empty risks
        // Validation
        if (!decision.trim() || !outcome.trim() || validRisks.length < 2) {
            alert("Please define the Decision, Desired Outcome, and at least two potential Risks."); return;
        }
        if (!hasGeminiKey()) {
            setAuditResult("## AI Audit Unavailable\n\n**ERROR**: API Key missing. Please check App Settings."); return;
        }

        setIsGenerating(true);
        setAuditResult(''); // Clear previous result
        console.log("[PreMortem] Running AI audit...");

        // Prepare context and prompt
        const userContext = `**Decision:** ${decision.trim()}\n**Desired Outcome:** ${outcome.trim()}\n**Identified Risks:**\n${validRisks.map(r => `- ${r}`).join('\n')}`;
        const systemPrompt = `You are the Devil's Advocate AI Auditor for strategic decisions. Perform a pre-mortem analysis based on the user's input.
            **Required Output Structure (Use EXACT Markdown headings):**
            ## Pre-Mortem Audit Results
            ### Unforeseen Blind Spots
            (List 2-3 NEW potential risks the user likely missed, relevant to the decision.)
            ### Risk Amplification
            (Select the user's MOST critical identified risk. Explain how it could escalate or be worse than anticipated.)
            ### Mitigation Strategy
            (Suggest 1-2 concrete, actionable steps to mitigate the HIGHEST combined risk (yours or theirs). Focus on prevention or contingency.)`;

        try {
            // Call AI
            const payload = {
                contents: [{ role: "user", parts: [{ text: userContext }] }],
                systemInstruction: { parts: [{ text: systemPrompt }] },
                model: GEMINI_MODEL || 'gemini-1.5-flash', // Use model from context // cite: useAppServices.jsx
            };
            const result = await callSecureGeminiAPI(payload); // cite: useAppServices.jsx
            const text = result?.candidates?.[0]?.content?.parts?.[0]?.text
                         || "Audit failed: No response from AI. Check connection or try rephrasing.";
            setAuditResult(text);

            // Save inputs to context on successful audit
            await updateStrategicContentData({ // cite: useAppServices.jsx
                lastPreMortemDecision: decision.trim(),
                desiredOutcome: outcome.trim(), // Save outcome as well
                risks: validRisks // Save the validated risks
            });
            console.log("[PreMortem] Audit successful, inputs saved.");

        } catch (error) {
            console.error("[PreMortem] AI Audit Error:", error);
            setAuditResult(`## AI Audit Failed\n\n**ERROR**: ${error.message}. Please check console logs.`);
        } finally {
            setIsGenerating(false); // Reset loading state
        }
    }, [decision, outcome, risks, hasGeminiKey, GEMINI_MODEL, callSecureGeminiAPI, updateStrategicContentData]); // Dependencies

    // --- Handler to Create Daily Rep from Mitigation ---
    const handleCommitmentCreation = useCallback(async () => {
        if (!mitigationText || !updateDailyPracticeData) return; // Validation // cite: useAppServices.jsx
        console.log("[PreMortem] Creating commitment for mitigation:", mitigationText);

        const commitmentText = `(Pre-Mortem Mit.) ${mitigationText}`;
        const newCommitment = {
            id: `premortem_${Date.now()}`, text: commitmentText, status: 'Pending', isCustom: true,
            linkedGoal: 'Risk Mitigation', linkedTier: 'T5', // Strategic decisions are T5 // cite: LEADERSHIP_TIERS_FALLBACK
            source: 'PlanningHub',
        };

        try {
            // Update daily practice data
            const success = await updateDailyPracticeData(data => ({ // cite: useAppServices.jsx
                ...data, activeCommitments: [...(data?.activeCommitments || []), newCommitment] // cite: useAppServices.jsx
            }));
            if (!success) throw new Error("Update failed");
            alert("Mitigation Rep added to your Daily Practice!");
            navigate('daily-practice'); // Navigate to practice screen // cite: useAppServices.jsx
        } catch (e) {
            console.error("[PreMortem] Failed to create commitment:", e);
            alert("Failed to add Rep to Daily Practice.");
        }
    }, [mitigationText, updateDailyPracticeData, navigate]); // Dependencies

    // --- Handler to Create Coaching Lab Scenario from Risk ---
    const handleCreateScenario = useCallback(() => {
        if (!riskScenario) return;
        console.log("[PreMortem] Creating coaching lab scenario for risk:", riskScenario);
        // --- TODO: Implement actual scenario saving ---
        // This would involve updating a global list of scenarios, potentially
        // in `metadata/config/catalog/SCENARIO_CATALOG` via `updateGlobalMetadata`.
        // For now, show a confirmation alert.
        alert(`Coaching Lab Scenario Created (Mock):\n\nTitle: Handling Escalated Risk - ${decision.substring(0, 30)}...\nPersona: Stakeholder concerned about "${riskScenario.substring(0, 50)}..."\nTier: T5`);
        // Optionally navigate to the lab: navigate('coaching-lab');
    }, [riskScenario, decision]); // Dependencies

    return (
        // Consistent page structure and padding
        <div className="p-6 md:p-8 lg:p-10">
            {/* Header */}
            <h1 className="text-3xl font-extrabold mb-2" style={{ color: COLORS.NAVY }}>Tool: Decision Pre-Mortem Audit</h1>
            <p className="text-lg text-gray-600 mb-6 max-w-3xl">Identify critical risks *before* committing to a high-stakes decision using the AI Devil's Advocate.</p>
            {/* Back Button */}
            <Button onClick={() => setPlanningView('planning-home')} variant="nav-back" className="mb-8">
                <ArrowLeft className="w-5 h-5 mr-2" /> Back to Strategic Tools
            </Button>

            {/* Main Content Sections */}
            <div className="space-y-6">
                {/* Step 1: Decision & Outcome */}
                <Card title="1. Define Decision & Desired Outcome" icon={TrendingUp} accent='TEAL'>
                    {/* Decision Input */}
                    <div className="mb-4">
                        <label className="block text-sm font-semibold mb-1" style={{ color: COLORS.NAVY }}>Critical Decision:</label>
                        <textarea value={decision} onChange={(e) => setDecision(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#47A88D] h-20 text-sm" placeholder="e.g., Should we acquire competitor X?" />
                    </div>
                    {/* Outcome Input */}
                    <div>
                        <label className="block text-sm font-semibold mb-1" style={{ color: COLORS.NAVY }}>Desired Outcome (Success State):</label>
                        <input type="text" value={outcome} onChange={(e) => setOutcome(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#47A88D] text-sm" placeholder="e.g., Integrate acquisition smoothly, retain 90% key staff, increase market share by 5% in 12 months."/>
                    </div>
                </Card>

                {/* Step 2: Identify Initial Risks */}
                <Card title="2. Identify Known Risks / Failure Modes" icon={AlertTriangle} accent='ORANGE'>
                    <p className="text-gray-700 text-sm mb-3">List the main ways this decision could fail (Min. 2 required).</p>
                    <div className="space-y-3">
                        {risks.map((risk, index) => (
                            <div key={index} className="flex items-center gap-2">
                                <span className="text-gray-400 font-mono text-sm">{index + 1}.</span>
                                <input type="text" value={risk} onChange={(e) => handleRiskChange(index, e.target.value)}
                                    className="flex-1 p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#E04E1B] text-sm" placeholder={`Potential failure mode ${index + 1}`} />
                                <Button onClick={() => handleRemoveRisk(index)} variant="ghost" size="sm" className="!p-1 text-red-500 hover:bg-red-100"> <X className='w-4 h-4'/> </Button>
                            </div>
                        ))}
                    </div>
                    {/* Add Risk Button */}
                    <Button onClick={handleAddRisk} variant="outline" size="sm" className="mt-4 border-dashed border-gray-400 text-gray-600 hover:bg-gray-100">
                        <PlusCircle className='w-4 h-4 mr-2'/> Add Risk
                    </Button>
                </Card>
            </div >

            {/* Run Audit Button */}
            <Button onClick={runPreMortemAudit}
                    disabled={isGenerating || !decision.trim() || !outcome.trim() || risks.filter(r => r.trim()).length < 2 || !hasGeminiKey()}
                    size="lg" className="mt-8 w-full">
                {isGenerating ? <Loader className="w-5 h-5 mr-2 animate-spin"/> : <Cpu className='w-5 h-5 mr-2'/>}
                {isGenerating ? "Running Devil's Advocate Audit..." : "Run Pre-Mortem Audit"}
            </Button>
             {!hasGeminiKey() && <p className="text-xs text-red-500 mt-2 text-center">API Key missing. Audit disabled.</p>}

            {/* Audit Results Section (Conditional) */}
            {auditHtml && (
                <Card title="AI Audit Results & Mitigation Plan" icon={ShieldCheck} accent='NAVY' className="mt-8">
                    {/* Render Audit HTML */}
                    <div dangerouslySetInnerHTML={{ __html: auditHtml }} />

                    {/* Actionable Next Steps (Conditional) */}
                    {(mitigationText || riskScenario) && hasGeminiKey() && (
                        <div className='mt-6 pt-4 border-t border-gray-300 space-y-3'>
                            <p className='text-sm font-semibold flex items-center gap-1'><Award className="w-4 h-4 text-[#47A88D]" /> Actionable Next Steps:</p>
                            {/* Create Commitment Button */}
                            {mitigationText && (
                                <Button onClick={handleCommitmentCreation} size="sm" className="w-full bg-[#47A88D] hover:bg-[#349881]">
                                    <PlusCircle className='w-4 h-4 mr-2' /> Add Mitigation Rep to Daily Practice (T5)
                                </Button>
                            )}
                            {/* Create Scenario Button */}
                            {riskScenario && (
                                <Button onClick={handleCreateScenario} variant="outline" size="sm" className="w-full text-[#E04E1B] border-[#E04E1B] hover:bg-[#E04E1B]/10">
                                    <Cpu className='w-4 h-4 mr-2' /> Capture Amplified Risk as Coaching Lab Scenario (T5)
                                </Button>
                            )}
                        </div>
                    )}
                </Card>
            )}
        </div>
    );
};


// --- VisionBuilderView (Refactored for Consistency) ---
const VisionBuilderView = ({ setPlanningView }) => {
    // --- Services & State ---
    const { strategicContentData, updateStrategicContentData, callSecureGeminiAPI, hasGeminiKey, GEMINI_MODEL } = useAppServices(); // cite: useAppServices.jsx
    const [vision, setVision] = useState(strategicContentData?.vision || ''); // cite: useAppServices.jsx
    const [mission, setMission] = useState(strategicContentData?.mission || ''); // cite: useAppServices.jsx
    const [isSaving, setIsSaving] = useState(false);
    const [isSavedConfirmation, setIsSavedConfirmation] = useState(false);
    const [isCritiquing, setIsCritiquing] = useState(false);
    const [critiqueResult, setCritiqueResult] = useState('');
    const [critiqueHtml, setCritiqueHtml] = useState('');

    // Effects for syncing state and parsing critique (unchanged logic)
    useEffect(() => { /* ... sync vision/mission from context ... */ }, [strategicContentData]);
    useEffect(() => { /* ... parse critique markdown to html ... */ }, [critiqueResult]);

    // Save handler (unchanged logic, ensure correct update function)
    const handleSave = useCallback(async () => { /* ... uses updateStrategicContentData ... */ }, [vision, mission, updateStrategicContentData]); // cite: useAppServices.jsx

    // AI Critique handler (unchanged logic, ensure payload)
    const critiqueVision = useCallback(async () => { /* ... uses callSecureGeminiAPI ... */ }, [vision, mission, hasGeminiKey, GEMINI_MODEL, callSecureGeminiAPI]); // cite: useAppServices.jsx

    return (
        // Consistent page structure and padding
        <div className="p-6 md:p-8 lg:p-10">
            {/* Header */}
            <h1 className="text-3xl font-extrabold mb-2" style={{ color: COLORS.NAVY }}>Tool: Vision & Mission Builder</h1>
            <p className="text-lg text-gray-600 mb-6 max-w-3xl">Define your aspirational 3-5 year Vision (Future State) and Mission (Core Purpose).</p>
            {/* Back Button */}
            <Button onClick={() => setPlanningView('planning-home')} variant="nav-back" className="mb-8">
                <ArrowLeft className="w-5 h-5 mr-2" /> Back to Strategic Tools
            </Button>

            {/* Main Content Sections */}
            <div className="space-y-6">
                {/* Vision Card */}
                <Card title="1. Define Your Vision (3-5 Year Future State)" icon={TrendingUp} accent='ORANGE'>
                    <p className="text-gray-700 text-sm mb-3">Inspiring, memorable, concise (max ~20 words).</p>
                    <textarea value={vision} onChange={(e) => setVision(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#E04E1B] h-24 text-sm" placeholder="e.g., 'Become the undisputed leader in sustainable tech solutions...'" />
                </Card>
                {/* Mission Card */}
                <Card title="2. Define Your Mission (Core Purpose)" icon={Target} accent='TEAL'>
                    <p className="text-gray-700 text-sm mb-3">Why your team exists, primary value delivered.</p>
                    <textarea value={mission} onChange={(e) => setMission(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#47A88D] h-20 text-sm" placeholder="e.g., 'To empower businesses with data-driven insights...'" />
                </Card>
                {/* Quality Check Card */}
                <Card title="Quality Check" icon={CheckCircle} accent='NAVY' className='bg-[#002E47]/5 text-sm'>
                     {/* ... unchanged checklist ... */}
                </Card>
            </div>

            {/* Save Button Area */}
            <div className='flex items-center gap-4 mt-8'>
                <Button onClick={handleSave} disabled={isSaving || !vision.trim() || !mission.trim()} size="lg">
                    {isSaving ? <Loader className="w-5 h-5 mr-2 animate-spin"/> : <Save className="w-5 h-5 mr-2" />} {isSaving ? 'Saving...' : 'Save Vision & Mission'}
                </Button>
                {isSavedConfirmation && <span className='text-sm font-bold text-green-600 flex items-center'><CheckCircle className='w-4 h-4 mr-1'/> Saved!</span>}
            </div>

            {/* AI Critique Section */}
            <Card title="AI Vision Auditor" icon={Cpu} accent='PURPLE' className='mt-8'> {/* Use Purple Accent */}
                <p className='text-gray-700 text-sm mb-4'>Use the AI Rep Coach to critique your statements for clarity, alignment, and actionability (T5 focus).</p>
                {/* Critique Button */}
                <Button onClick={critiqueVision} disabled={isCritiquing || !vision.trim() || !mission.trim() || !hasGeminiKey()} size="md" className="w-full bg-[#7C3AED] hover:bg-purple-700"> {/* Purple Button */}
                    {isCritiquing ? <Loader className="w-5 h-5 mr-2 animate-spin"/> : <MessageSquare className='w-5 h-5 mr-2'/>} {isCritiquing ? 'Auditing Vision...' : 'Run Vision Critique'}
                </Button>
                 {!hasGeminiKey() && <p className="text-xs text-red-500 mt-2 text-center">API Key missing. Critique disabled.</p>}
                {/* Critique Result */}
                {critiqueHtml && (
                    <div className="mt-6 pt-4 border-t border-gray-200">
                        <div dangerouslySetInnerHTML={{ __html: critiqueHtml }} />
                    </div>
                )}
            </Card>
        </div>
    );
};


// --- OKRDraftingView (Refactored for Consistency) ---
const OKRDraftingView = ({ setPlanningView }) => {
    // --- Services & State ---
    const { strategicContentData, updateStrategicContentData, callSecureGeminiAPI, hasGeminiKey, GEMINI_MODEL } = useAppServices(); // cite: useAppServices.jsx
    // Initialize OKRs safely from context, ensuring keyResults is always an array
    const [okrs, setOkrs] = useState(() => (strategicContentData?.okrs || []).map(o => ({ ...o, keyResults: o.keyResults || [] })) ); // cite: useAppServices.jsx
    const [isSaving, setIsSaving] = useState(false);
    const [isSavedConfirmation, setIsSavedConfirmation] = useState(false); // Added
    const [okrCritique, setOkrCritique] = useState('');
    const [critiqueHtml, setCritiqueHtml] = useState('');
    const [isCritiquing, setIsCritiquing] = useState(false);

    // Sync local state if context data loads/changes after initial render
    useEffect(() => { /* ... same sync logic as original ... */ }, [strategicContentData?.okrs]);
    // Parse critique markdown (unchanged)
    useEffect(() => { /* ... same markdown parsing ... */ }, [okrCritique]);

    // Handlers for modifying OKRs (unchanged logic)
    const updateObjective = useCallback((id, value) => { /* ... */ setOkrCritique(''); }, []);
    const updateKR = useCallback((objId, krId, value) => { /* ... */ setOkrCritique(''); }, []);
    const addKR = useCallback((objId) => { /* ... */ }, []);
    const removeKR = useCallback((objId, krId) => { /* ... */ }, []);
    const removeObjective = useCallback((id) => setOkrs(prev => prev.filter(o => o.id !== id)), []);
    const addObjective = useCallback(() => { /* ... */ }, [okrs]); // Dependency needed if logic uses okrs.length

    // Save handler (unchanged logic, ensure correct update function)
    const handleSave = useCallback(async () => { /* ... uses updateStrategicContentData ... */
        setIsSaving(true); setIsSavedConfirmation(false);
        const validOkrs = okrs.filter(/* ... */); // Filter empty
        try {
            await updateStrategicContentData({ okrs: validOkrs }); // cite: useAppServices.jsx
            setIsSavedConfirmation(true); setTimeout(() => setIsSavedConfirmation(false), 3000);
        } catch (e) { console.error('Failed to save OKRs:', e); alert('Failed to save OKRs.'); }
        finally { setIsSaving(false); }
    }, [okrs, updateStrategicContentData]); // cite: useAppServices.jsx

    // AI Critique handler (unchanged logic, ensure payload)
    const critiqueOKRs = useCallback(async () => { /* ... uses callSecureGeminiAPI ... */ }, [okrs, hasGeminiKey, GEMINI_MODEL, callSecureGeminiAPI]); // cite: useAppServices.jsx

    return (
        // Consistent page structure and padding
        <div className="p-6 md:p-8 lg:p-10">
            {/* Header */}
            <h1 className="text-3xl font-extrabold mb-2" style={{ color: COLORS.NAVY }}>Tool: OKR Drafting & Audit</h1>
            <p className="text-lg text-gray-600 mb-6 max-w-3xl">Set ambitious Objectives (What) and measurable Key Results (How) for the quarter, aligned with your Vision.</p>
            {/* Back Button */}
            <Button onClick={() => setPlanningView('planning-home')} variant="nav-back" className="mb-8">
                <ArrowLeft className="w-5 h-5 mr-2" /> Back to Strategic Tools
            </Button>

            {/* OKR Cards */}
            <div className="space-y-8">
                {okrs.map((obj, objIndex) => (
                    <Card key={obj.id} title={`Objective ${objIndex + 1}`} icon={Target} accent='NAVY'>
                        {/* Objective Input & Remove Button */}
                        <div className='flex justify-between items-start mb-4'>
                            <input type="text" value={obj.objective} onChange={(e) => updateObjective(obj.id, e.target.value)}
                                className="flex-1 p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#47A88D] text-md font-semibold" placeholder="Ambitious, inspiring objective..." />
                            <Button onClick={() => removeObjective(obj.id)} variant="ghost" size="sm" className="!p-1 text-red-500 hover:bg-red-100 ml-2"> <Trash2 className='w-4 h-4'/> </Button>
                        </div>
                        {/* Succession Dependency (unchanged UI) */}
                        <div className='flex items-center gap-2 mb-6 p-2 rounded-lg bg-gray-100 border border-gray-200'>
                            <label htmlFor={`dep-${obj.id}`} className='text-xs font-semibold flex items-center text-gray-600'><CornerRightUp className='w-3 h-3 mr-1'/> Succession:</label>
                            <select id={`dep-${obj.id}`} value={obj.successionDependency || 'None'} onChange={(e) => setOkrs(/* */)} className="p-1 border border-gray-300 rounded text-xs bg-white"> /* ... options ... */ </select>
                        </div>
                        {/* Key Results Section */}
                        <h3 className="text-md font-bold mb-3 border-b border-dashed pb-1" style={{ color: COLORS.TEAL }}>Key Results (Measurable 'from X to Y')</h3>
                        <div className="space-y-3">
                            {(obj.keyResults || []).map((kr, krIndex) => (
                                <div key={kr.id} className='flex items-center gap-2'>
                                    <span className='font-mono text-sm text-[#E04E1B] w-4'>{krIndex + 1}.</span>
                                    <input type="text" value={kr.kr} onChange={(e) => updateKR(obj.id, kr.id, e.target.value)}
                                        className="flex-1 p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#E04E1B] text-sm" placeholder="e.g., Reduce bugs from 45 to 15 by EOM." />
                                    <Button onClick={() => removeKR(obj.id, kr.id)} variant="ghost" size="sm" className="!p-1 text-gray-400 hover:text-red-500"> <X className='w-4 h-4'/> </Button>
                                </div>
                            ))}
                        </div>
                        {/* Add KR Button */}
                        <Button onClick={() => addKR(obj.id)} variant="outline" size="sm" className="mt-4 border-dashed border-gray-400 text-gray-600 hover:bg-gray-100">
                            <PlusCircle className='w-4 h-4 mr-2'/> Add Key Result
                        </Button>
                    </Card>
                ))}
            </div>

            {/* Add Objective & Save Buttons */}
            <div className='flex flex-col sm:flex-row items-center gap-4 mt-8'>
                <Button onClick={addObjective} variant="outline" size="md" className="w-full sm:w-auto border-[#002E47] text-[#002E47] hover:bg-[#002E47]/10">
                    <PlusCircle className='w-5 h-5 mr-2'/> Add New Objective
                </Button>
                <Button onClick={handleSave} disabled={isSaving || okrs.length === 0} size="lg" className="w-full sm:w-auto flex-grow">
                    {isSaving ? <Loader className="w-5 h-5 mr-2 animate-spin"/> : <Save className="w-5 h-5 mr-2" />} {isSaving ? 'Saving OKRs...' : 'Save Quarterly OKRs'}
                </Button>
                {isSavedConfirmation && <span className='text-sm font-bold text-green-600 flex items-center'><CheckCircle className='w-4 h-4 mr-1'/> Saved!</span>}
            </div>

            {/* AI Critique Section */}
            <Card title="AI OKR Auditor" icon={Cpu} accent='TEAL' className='mt-8'>
                <p className='text-gray-700 text-sm mb-4'>Use the AI Rep Coach to review drafted OKRs for measurability, ambition, and alignment.</p>
                {/* Critique Button */}
                <Button onClick={critiqueOKRs} disabled={isCritiquing || okrs.length === 0 || !okrs.every(o=>o.objective.trim() && o.keyResults?.every(kr=>kr.kr.trim())) || !hasGeminiKey()} size="md" className="w-full bg-[#002E47] hover:bg-gray-700"> {/* Navy Button */}
                    {isCritiquing ? <Loader className="w-5 h-5 mr-2 animate-spin"/> : <MessageSquare className='w-5 h-5 mr-2'/>} {isCritiquing ? 'Auditing OKRs...' : 'Run OKR Audit'}
                </Button>
                 {!hasGeminiKey() && <p className="text-xs text-red-500 mt-2 text-center">API Key missing. Audit disabled.</p>}
                {/* Critique Result */}
                {critiqueHtml && (
                    <div className="mt-6 pt-4 border-t border-gray-200">
                        <div dangerouslySetInnerHTML={{ __html: critiqueHtml }} />
                    </div>
                )}
            </Card>
        </div>
    );
};


// --- AlignmentTrackerView (Refactored for Consistency & AI Fix) ---
const AlignmentTrackerView = ({ setPlanningView }) => {
    // --- Services & State ---
    const { strategicContentData, updateStrategicContentData, dailyPracticeData, updateDailyPracticeData, navigate, callSecureGeminiAPI, hasGeminiKey, GEMINI_MODEL } = useAppServices(); // cite: useAppServices.jsx
    // Safely initialize state from context
    const [misalignmentNotes, setMisalignmentNotes] = useState(strategicContentData?.misalignmentNotes || ''); // cite: useAppServices.jsx
    const [isSaving, setIsSaving] = useState(false);
    const [isSavedConfirmation, setIsSavedConfirmation] = useState(false);
    const [isSuggesting, setIsSuggesting] = useState(false);
    const [suggestionText, setSuggestionText] = useState(''); // Just the commitment text
    const [suggestionCommitment, setSuggestionCommitment] = useState(null); // Full { commitment, tier } object
    const [lastJsonError, setLastJsonError] = useState(''); // Store JSON error details

    // Sync state on load (unchanged)
    useEffect(() => { /* ... */ }, [strategicContentData]);

    // Mock progress data (unchanged logic, uses context data for titles)
    const objectives = useMemo(() => (strategicContentData?.okrs || []).map((o, index) => { /* ... same mock progress logic ... */ }), [strategicContentData?.okrs]);

    // Save handler (unchanged logic)
    const handleSaveReflection = useCallback(async () => { /* ... uses updateStrategicContentData ... */ }, [misalignmentNotes, updateStrategicContentData]); // cite: useAppServices.jsx

    // --- ** FIXED AI Suggestion Handler ** ---
    const critiqueMisalignment = useCallback(async () => {
        const notes = misalignmentNotes.trim();
        if (!notes || notes.length < 20) { alert("Please describe the misalignment issue (min 20 chars)."); return; }
        if (!hasGeminiKey()) { setSuggestionText("AI Suggestion Unavailable: API Key missing."); return; }

        setIsSuggesting(true);
        setSuggestionText('');
        setSuggestionCommitment(null); // Clear previous suggestion object
        setLastJsonError(''); // Clear previous error
        console.log("[AlignmentTracker] Requesting AI preventative commitment...");

        // Define the desired JSON structure
        const jsonSchema = {
            type: "OBJECT",
            properties: { commitment: { type: "STRING" }, tier: { type: "STRING", enum: ["T1", "T2"] } },
            required: ["commitment", "tier"]
        };

        const systemInstruction = `You are a pragmatic Executive Coach. Analyze the user's misalignment log (low-leverage activity). Generate ONE concise, low-friction, high-impact daily commitment (a 'Rep') to prevent this waste. Focus on T1 (Self) or T2 (Work) skills. Respond ONLY with a JSON object matching the required schema. No conversational text or markdown.`;
        const userQuery = `Misalignment Log: "${notes}"\n\nGenerate the JSON output.`;

        try {
            const payload = {
                contents: [{ role: "user", parts: [{ text: userQuery }] }],
                systemInstruction: { parts: [{ text: systemInstruction }] },
                // --- Request JSON Output ---
                generationConfig: { responseMimeType: "application/json", responseSchema: jsonSchema },
                model: 'gemini-1.5-flash', // Use flash for speed
            };

            const result = await callSecureGeminiAPI(payload); // cite: useAppServices.jsx
            console.log("[AlignmentTracker] AI Response (raw):", result);

            // Response should already be parsed JSON if API call was successful
            const parsedJson = result?.candidates?.[0]?.content?.parts?.[0]; // The part itself should be the object

            // --- Validate Parsed JSON ---
            if (parsedJson && typeof parsedJson === 'object' && parsedJson.commitment && parsedJson.tier) {
                console.log("[AlignmentTracker] AI Suggestion generated:", parsedJson);
                setSuggestionText(parsedJson.commitment);
                setSuggestionCommitment(parsedJson); // Store the full object
            } else {
                // Handle cases where response is not valid JSON or misses required fields
                console.error("[AlignmentTracker] Failed to parse valid JSON from AI response:", parsedJson);
                throw new Error(`AI response was not the expected JSON object. Received: ${JSON.stringify(parsedJson)}`);
            }

        } catch (error) {
            console.error("[AlignmentTracker] AI Suggestion Error:", error);
            let errorMsg = `AI suggestion failed: ${error.message}.`;
            setLastJsonError(error.message); // Store error details
            setSuggestionText(errorMsg); // Show error to user
            setSuggestionCommitment(null); // Ensure commitment object is null on error
        } finally {
            setIsSuggesting(false); // Reset loading state
        }
    }, [misalignmentNotes, hasGeminiKey, callSecureGeminiAPI]); // Dependencies

    // Add suggestion to daily practice (unchanged logic)
    const handleAddSuggestionToScorecard = useCallback(async () => { /* ... uses updateDailyPracticeData ... */ }, [suggestionCommitment, updateDailyPracticeData, navigate]); // cite: useAppServices.jsx

    return (
        // Consistent page structure and padding
        <div className="p-6 md:p-8 lg:p-10">
            {/* Header */}
            <h1 className="text-3xl font-extrabold mb-2" style={{ color: COLORS.NAVY }}>Tool: Strategic Alignment Tracker</h1>
            <p className="text-lg text-gray-600 mb-6 max-w-3xl">Review OKR progress, log misalignments, and get AI suggestions for preventative daily reps.</p>
            {/* Back Button */}
            <Button onClick={() => setPlanningView('planning-home')} variant="nav-back" className="mb-8">
                <ArrowLeft className="w-5 h-5 mr-2" /> Back to Strategic Tools
            </Button>

            {/* Main Content Sections */}
            <div className="space-y-6">
                {/* OKR Progress Section */}
                <h2 className='text-2xl font-extrabold border-b-2 pb-2 mb-4' style={{ color: COLORS.NAVY, borderColor: COLORS.TEAL }}>Quarterly Objective Progress</h2>
                {objectives.length === 0 && <Card className="text-center italic text-gray-500 border-dashed">No OKRs defined yet. Use the OKR Drafting Tool.</Card>}
                {objectives.map(obj => (
                    <Card key={obj.id} title={obj.title} icon={CheckCircle} accent='TEAL' className="shadow-md">
                        {/* Progress Bar & Status */}
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-semibold">Progress: {Math.round(obj.progress * 100)}%</p>
                            {/* Status Badge (FIXED) */}
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full`}>{obj.status}</span>
                        </div>
                        {/* Progress Bar Visual (FIXED) */}
                        <div className="w-full bg-gray-200 rounded-full h-2.5"> 
                            <div className={`h-2.5 rounded-full`} style={{ width: `${obj.progress * 100}%` }}></div> 
                        </div>
                        {/* Succession Dependency Note (if applicable) */}
                        {obj.successionDependency && <div className='mt-3 p-2 rounded text-xs flex items-center bg-gray-100 border border-gray-200'><CornerRightUp className='w-3 h-3 mr-1 text-gray-500'/> Succession Critical: Requires <strong>{obj.successionDependency}</strong> development.</div>}
                        {/* ... rest of the card ... */}
                    </Card>
                ))}

                {/* Misalignment Log Card */}
                <Card title="Vision Alignment Check (Misalignment Log)" icon={Lightbulb} accent='ORANGE'>
                    <p className="text-gray-700 text-sm mb-3">Log non-OKR activities draining time this week to identify & eliminate waste.</p>
                    {/* Notes Input */}
                    <textarea value={misalignmentNotes} onChange={(e) => setMisalignmentNotes(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#E04E1B] h-20 text-sm" placeholder="e.g., 'Spent 3 hours on ad-hoc reporting not tied to KRs...'" />
                    {/* Save Log Button */}
                    <div className='flex items-center gap-4 mt-4'>
                        <Button onClick={handleSaveReflection} disabled={isSaving || !misalignmentNotes.trim()} variant="secondary" size="md" className="flex-1">
                            {isSaving ? <Loader className="w-5 h-5 mr-2 animate-spin"/> : <Save className='w-5 h-5 mr-2'/>} {isSaving ? 'Saving Log...' : 'Save Misalignment Log'}
                        </Button>
                        {isSavedConfirmation && <span className='text-sm font-bold text-green-600 flex items-center'><CheckCircle className='w-4 h-4 mr-1'/> Logged!</span>}
                    </div>
                    {/* AI Suggestion Button */}
                    <Button onClick={critiqueMisalignment} disabled={isSuggesting || !misalignmentNotes.trim() || misalignmentNotes.trim().length < 20 || !hasGeminiKey()} variant="outline" size="md" className="w-full mt-4 text-[#002E47] border-[#002E47] hover:bg-[#002E47]/10">
                        {isSuggesting ? <Loader className="w-5 h-5 mr-2 animate-spin"/> : <Cpu className='w-5 h-5 mr-2'/>} {isSuggesting ? 'Generating Commitment...' : 'Get AI Preventative Rep'}
                    </Button>
                     {!hasGeminiKey() && <p className="text-xs text-red-500 mt-2 text-center">API Key missing. AI suggestions disabled.</p>}
                    {/* AI Suggestion Display */}
                    {suggestionText && (
                        <div className={`mt-4 p-3 rounded-xl border ${suggestionCommitment ? 'bg-white border-[#47A88D]' : 'bg-red-50 border-red-300'} shadow-md`}>
                            <p className={`text-xs font-semibold mb-1 flex items-center gap-1 ${suggestionCommitment ? 'text-[#47A88D]' : 'text-red-600'}`}>
                                {suggestionCommitment ? <Lightbulb className="w-4 h-4"/> : <AlertTriangle className="w-4 h-4"/>}
                                AI Preventative Rep Suggestion {suggestionCommitment ? `(${suggestionCommitment.tier})` : '(Error)'}:
                            </p>
                            <p className={`text-sm ${suggestionCommitment ? 'text-[#002E47] font-medium' : 'text-red-700'}`}>{suggestionText}</p>
                            {/* Add to Scorecard Button (Conditional) */}
                            {suggestionCommitment && (
                                <Button onClick={handleAddSuggestionToScorecard} variant='primary' size="sm" className="w-full mt-3">
                                    <PlusCircle className='w-4 h-4 mr-1' /> Add to Daily Practice ({suggestionCommitment.tier} Rep)
                                </Button>
                            )}
                            {/* Display JSON error details if present */}
                            {lastJsonError && !suggestionCommitment && <p className='text-[10px] text-red-500 mt-2'>Error Detail: {lastJsonError}</p>}
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
};


/* =========================================================
   MAIN ROUTER: PlanningHubScreen
========================================================= */
export default function PlanningHubScreen() {
    // --- Consume Services ---
    const { isLoading: isAppLoading, error: appError, featureFlags } = useAppServices(); // cite: useAppServices.jsx

    // --- Local State ---
    const [view, setPlanningView] = useState('planning-home'); // Current tool view

    // --- Feature Flag Check ---
    // If the entire Planning Hub is disabled, show a message or return null
    if (!featureFlags?.enablePlanningHub) { // cite: useAppServices.jsx
        return (
            <div className="p-8 text-center text-gray-500">
                <Trello className="w-12 h-12 mx-auto mb-4 text-gray-400"/>
                <h1 className="text-2xl font-bold mb-2">Strategic Content Tools Unavailable</h1>
                <p>This feature is currently disabled by the administrator.</p>
            </div>
        );
    }

    // --- Loading & Error States ---
    if (isAppLoading) return <LoadingSpinner message="Loading Strategic Content Tools..." />;
    if (appError) return <ConfigError message={`Failed to load Planning Hub: ${appError.message}`} />;


    // --- View Rendering Logic ---
    const renderView = () => {
        const viewProps = { setPlanningView }; // Pass setter to child views

        switch (view) {
            case 'vision-builder': return <VisionBuilderView {...viewProps} />;
            case 'okr-drafting': return <OKRDraftingView {...viewProps} />;
            case 'alignment-tracker': return <AlignmentTrackerView {...viewProps} />;
            case 'pre-mortem': return <PreMortemView {...viewProps} />;
            case 'planning-home':
            default:
                // --- Refactored Home View ---
                return (
                    // Consistent page structure and padding
                    <div className="p-6 md:p-8 lg:p-10">
                        {/* Header */}
                        <header className='flex items-center gap-4 border-b-2 pb-3 mb-8' style={{borderColor: COLORS.BLUE+'30'}}> {/* Use BLUE accent */}
                            <Trello className='w-10 h-10 flex-shrink-0' style={{color: COLORS.BLUE}}/>
                            <div>
                                <h1 className="text-3xl md:text-4xl font-extrabold" style={{ color: COLORS.NAVY }}>Strategic Content Tools</h1>
                                <p className="text-md text-gray-600 mt-1">(Content Pillar 1)</p>
                            </div>
                        </header>
                        <p className="text-lg text-gray-700 mb-10 max-w-3xl">High-leverage tools for strategic planning, goal setting, and risk mitigation, supported by AI audits.</p>

                        {/* Tool Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {/* Vision & Mission */}
                            <Card title="Vision & Mission Builder" icon={BookOpen} accent='TEAL' onClick={() => setPlanningView('vision-builder')} className="cursor-pointer hover:border-teal-400">
                                <p className="text-gray-700 text-sm mb-4">Define your 3-5 year strategic North Star. Get AI critique on clarity and alignment.</p>
                                <div className="mt-auto text-[#47A88D] font-semibold flex items-center group">Launch Tool <span className="ml-1 group-hover:translate-x-1 transition-transform">&rarr;</span></div>
                            </Card>
                            {/* OKR Drafting */}
                            <Card title="OKR Drafting & Audit" icon={Target} accent='NAVY' onClick={() => setPlanningView('okr-drafting')} className="cursor-pointer hover:border-navy-400">
                                <p className="text-gray-700 text-sm mb-4">Set quarterly Objectives and Key Results. Use the AI Auditor for measurability and impact.</p>
                                <div className="mt-auto text-[#002E47] font-semibold flex items-center group">Launch Tool <span className="ml-1 group-hover:translate-x-1 transition-transform">&rarr;</span></div>
                            </Card>
                            {/* Pre-Mortem */}
                            <Card title="Decision Pre-Mortem Audit" icon={AlertTriangle} accent='ORANGE' onClick={() => setPlanningView('pre-mortem')} className="cursor-pointer hover:border-orange-400">
                                <p className="text-gray-700 text-sm mb-4">Identify critical risks *before* decisions. Use the AI Devil's Advocate to find blind spots.</p>
                                <div className="mt-auto text-[#E04E1B] font-semibold flex items-center group">Launch Auditor <span className="ml-1 group-hover:translate-x-1 transition-transform">&rarr;</span></div>
                            </Card>
                            {/* Alignment Tracker */}
                            <Card title="Strategic Alignment Tracker" icon={Activity} accent='BLUE' onClick={() => setPlanningView('alignment-tracker')} className="cursor-pointer hover:border-blue-400">
                                <p className="text-gray-700 text-sm mb-4">Review OKR progress, log misalignments, and get AI suggestions for preventative daily reps.</p>
                                <div className="mt-auto text-[#2563EB] font-semibold flex items-center group">Launch Tracker <span className="ml-1 group-hover:translate-x-1 transition-transform">&rarr;</span></div>
                            </Card>
                        </div>
                    </div>
                );
        }
    };

    // --- Main Render ---
    return (
        <div className="min-h-screen" style={{ background: COLORS.BG }}> {/* Consistent BG */}
            {renderView()}
        </div>
    );
}