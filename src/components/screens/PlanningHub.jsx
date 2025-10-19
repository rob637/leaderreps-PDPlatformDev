import { useAppServices } from '../../services/useAppServices.jsx';
/* eslint-disable no-console */
import React, { useState, useEffect, useMemo, useCallback } from 'react';

import { 
    Home, Zap, HeartPulse, BookOpen, Users, Settings, Briefcase,
    TrendingUp, Target, Mic, ArrowLeft, CheckCircle, Lightbulb, Clock, PlusCircle, X, BarChart3, MessageSquare, AlertTriangle, ShieldCheck, CornerRightUp, Play, Info, Eye
} from 'lucide-react';
// We don't need direct Firestore imports here, as all data access is via useAppServices hooks.
import { mdToHtml, hasGeminiKey, callSecureGeminiAPI } from '../../utils/ApiHelpers.js'; 
// --- COLOR PALETTE (From App.jsx) ---
const COLORS = {
    NAVY: '#002E47',
    TEAL: '#47A88D',
    ORANGE: '#E04E1B',
    LIGHT_GRAY: '#FCFCFA',
};

// --- Custom/Placeholder UI Components (Replicated for self-contained file) ---
const Button = ({ children, onClick, disabled = false, variant = 'primary', className = '', ...rest }) => {
    let baseStyle = "px-6 py-3 rounded-xl font-semibold transition-all shadow-xl focus:outline-none focus:ring-4 text-white";

    if (variant === 'primary') { baseStyle += ` bg-[${COLORS.TEAL}] hover:bg-[#349881] focus:ring-[#47A88D]/50`; } 
    else if (variant === 'secondary') { baseStyle += ` bg-[${COLORS.ORANGE}] hover:bg-red-700 focus:ring-[#E04E1B]/50`; } 
    else if (variant === 'outline') { baseStyle = `px-6 py-3 rounded-xl font-semibold transition-all shadow-md border-2 border-[${COLORS.TEAL}] text-[${COLORS.TEAL}] hover:bg-[#47A88D]/10 focus:ring-4 focus:ring-[#47A88D]/50 bg-[${COLORS.LIGHT_GRAY}]`; }

    if (disabled) { baseStyle = "px-6 py-3 rounded-xl font-semibold bg-gray-300 text-gray-500 cursor-not-allowed shadow-inner transition-none"; }

    return (
        <button {...rest} onClick={onClick} disabled={disabled} className={`${baseStyle} ${className}`}>
            {children}
        </button>
    );
};

const Card = ({ children, title, icon: Icon, className = '', onClick }) => {
    const interactive = !!onClick;
    const Tag = interactive ? 'button' : 'div';

    return (
        <Tag 
            role={interactive ? "button" : undefined}
            tabIndex={interactive ? 0 : undefined}
            className={`bg-[${COLORS.LIGHT_GRAY}] p-6 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 ${interactive ? `cursor-pointer hover:border-[${COLORS.NAVY}] border-2 border-transparent` : ''} ${className}`}
            onClick={onClick}
        >
            {Icon && <Icon className="w-8 h-8 text-[#47A88D] mb-4" />}
            {title && <h2 className="text-xl font-bold text-[#002E47] mb-2">{title}</h2>}
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
// --- END Custom UI Components ---

// --- Planning Hub Views ---

const PreMortemView = ({ setPlanningView }) => {
    const { planningData, updatePlanningData, updateCommitmentData, navigate } = useAppServices();
    // Fallback/initial data (using optional chaining for safety)
    const [decision, setDecision] = useState(planningData?.last_premortem_decision || 'Should we launch a new product feature aimed at the enterprise market next quarter?');
    const [outcome, setOutcome] = useState('Successfully launch the feature and secure 5 new enterprise customers.'); 
    const [risks, setRisks] = useState(['Misalignment between sales and product teams on target customer.', 'Feature dependencies delay launch by 4 weeks.']); 

    const [isGenerating, setIsGenerating] = useState(false);
    const [auditResult, setAuditResult] = useState('');
    const [auditHtml, setAuditHtml] = useState('');
    const [mitigationText, setMitigationText] = useState(''); 

    useEffect(() => {
        if (planningData?.last_premortem_decision) {
             setDecision(planningData.last_premortem_decision);
        }
    }, [planningData?.last_premortem_decision]);

    useEffect(() => {
        if (!auditResult) { setAuditHtml(''); setMitigationText(''); return; }
        (async () => setAuditHtml(await mdToHtml(auditResult)))();
        // Attempt to parse Mitigation Strategy for commitment button
        const mitigationMatch = auditResult.match(/### Mitigation Strategy\s*([\s\S]*)/i);
        if (mitigationMatch && mitigationMatch[1]) {
            // Extract and clean the first key action
            const strategy = mitigationMatch[1].trim().split('\n').slice(0, 3).join(' ').replace(/[\*\-]/g, '').trim();
            setMitigationText(strategy);
        }
    }, [auditResult]);

    const handleRiskChange = (index, value) => {
        const newRisks = [...risks];
        newRisks[index] = value;
        setRisks(newRisks);
        setAuditResult(''); // Clear audit on risk change
    };

    const handleAddRisk = () => {
        setRisks([...risks, '']);
    };

    const handleRemoveRisk = (index) => {
        setRisks(risks.filter((_, i) => i !== index));
    };

    const runPreMortemAudit = async () => {
        const primaryRisks = risks.filter(r => r.trim());
        if (!decision.trim() || !outcome.trim() || primaryRisks.length < 2) {
            alert("Please fill in the Decision, Desired Outcome, and at least two Risks before running the audit.");
            return;
        }

        setIsGenerating(true);
        setAuditResult('');

        if (!hasGeminiKey()) {
            setAuditResult("## AI Critique Unavailable\n\n**ERROR**: The Gemini API Key is missing. Please check App Settings.");
            setIsGenerating(false);
            return;
        }

        const userQuery = `**Decision:** ${decision}\n**Desired Outcome:** ${outcome}\n**Identified Risks:** ${primaryRisks.join('; ')}`;
        const systemPrompt = "You are the Decision-Making Auditor, acting as the 'Devil's Advocate' and a strategic planning expert. Your task is to perform a pre-mortem analysis. Critique the user's inputs based on: 1) **Unforeseen Blind Spots (Top 2-3 new risks)**: Identify risks the user is likely missing. 2) **Risk Amplification**: Select the user's biggest risk and explain how it could be worse. 3) **Mitigation Strategy**: Suggest a concrete action plan (1-2 steps) for the highest combined risk (yours or the user's). Use clear Markdown headings and bold key points. Use the following structure: ## Pre-Mortem Audit Results; ### Unforeseen Blind Spots; ### Risk Amplification; ### Mitigation Strategy";

        try {
            const payload = {
                contents: [{ role: "user", parts: [{ text: userQuery }] }],
                systemInstruction: { parts: [{ text: systemPrompt }] },
            };

            const result = await callSecureGeminiAPI(payload);
            const text = result?.candidates?.[0]?.content?.parts?.[0]?.text || "Audit failed to generate results.";
            setAuditResult(text);
            await updatePlanningData({ last_premortem_decision: decision });

        } catch (error) {
            console.error("Gemini API Error:", error);
            setAuditResult("An error occurred during the Pre-Mortem Audit. Please check your network connection.");
        } finally {
            setIsGenerating(false);
        }
    };
    const handleCommitmentCreation = async () => {
        if (!mitigationText || !updateCommitmentData) return;
        const commitmentText = `(Pre-Mortem Mit.) Implement mitigation for decision: ${mitigationText}.`;
        const newCommitment = { 
            id: Date.now(), 
            text: commitmentText, 
            status: 'Pending', 
            isCustom: true, 
            linkedGoal: 'Risk Mitigation Strategy',
            linkedTier: 'T5', 
            targetColleague: null,
        };

        const success = await updateCommitmentData(data => {
            const existingCommitments = data?.active_commitments || [];
            return { active_commitments: [...existingCommitments, newCommitment] };
        });

        if (success) {
            alert("Mitigation Commitment created! Review it in your Daily Practice Scorecard.");
            navigate('daily-practice', { 
                initialGoal: newCommitment.linkedGoal, 
                initialTier: newCommitment.linkedTier 
            }); 
        } else {
            alert("Failed to save new commitment.");
        }
    };
    return (
        <div className="p-8">
            <h1 className="text-3xl font-extrabold text-[#002E47] mb-4">Decision-Making Matrix (Pre-Mortem Audit)</h1>
            <p className="text-lg text-gray-600 mb-6 max-w-3xl">Analyze high-stakes decisions by actively looking for failure points. The AI acts as your **Devil's Advocate**, identifying risks you missed.</p>
            <Button onClick={() => setPlanningView('planning-home')} variant="outline" className="mb-8">
                <ArrowLeft className="w-5 h-5 mr-2" /> Back to Planning Hub
            </Button>

            <div className="space-y-6">
                <Card title="1. The Decision & Outcome" icon={TrendingUp}>
                    <p className="text-gray-700 text-sm mb-2 font-semibold">What is the critical decision you are facing?</p>
                    <textarea 
                        value={decision} 
                        onChange={(e) => setDecision(e.target.value)} 
                        className="w-full p-3 mb-4 border border-gray-300 rounded-xl focus:ring-[#47A88D] focus:border-[#47A88D] h-20" 
                        placeholder="e.g., Should we expand into the European market next quarter?"
                    ></textarea>
                    <p className="text-gray-700 text-sm mb-2 font-semibold">What is the specific desired outcome?</p>
                    <input type="text" value={outcome} onChange={(e) => setOutcome(e.target.value)} className="w-full p-3 border border-gray-300 rounded-xl focus:ring-[#47A88D] focus:border-[#47A88D]" placeholder="e.g., Achieve $500k in ARR from the new region in Q4."/>
                </Card>

                <Card title="2. Identify Initial Risks" icon={AlertTriangle}>
                    <p className="text-gray-700 text-sm mb-3">List the primary risks and failure modes you have already identified. (Minimum 2)</p>
                    <div className="space-y-3">
                        {risks.map((risk, index) => (
                            <div key={index} className="flex items-center space-x-2">
                                <input
                                    type="text"
                                    value={risk}
                                    onChange={(e) => handleRiskChange(index, e.target.value)}
                                    className="flex-1 p-3 border border-gray-200 rounded-xl focus:ring-[#47A88D] focus:border-[#47A88D] text-sm"
                                    placeholder={`Risk ${index + 1}`}
                                />
                                <button onClick={() => handleRemoveRisk(index)} className="text-[#E04E1B] hover:text-red-700">
                                    <X className='w-4 h-4' />
                                </button>
                            </div>
                        ))}
                    </div>
                    <Button onClick={handleAddRisk} variant="outline" className="mt-4 text-xs px-4 py-2 border-dashed text-[#002E47] hover:bg-[#002E47]/10">
                        + Add Risk
                    </Button>
                </Card>
            </div >

            <Tooltip
                content={hasGeminiKey() 
                    ? "Submits your decision analysis to the AI Auditor for risk identification." 
                    : "Requires Gemini API Key to run. Check App Settings."
                }
            >
                <Button onClick={runPreMortemAudit} disabled={isGenerating || !decision || !outcome || risks.filter(r => r.trim()).length < 2} className="mt-8 w-full md:w-auto">
                    {isGenerating ? (
                        <div className="flex items-center">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                            Running Pre-Mortem Audit...
                        </div>
                    ) : 'Run Pre-Mortem Audit'}
                </Button>
            </Tooltip>

            {auditHtml && (
                <Card title="Decision Audit & Blind Spots" className="mt-8 bg-[#002E47]/10 border-4 border-[#002E47]/20 rounded-3xl">
                    <div className="prose max-w-none prose-h2:text-[#002E47] prose-h2:text-2xl prose-h3:text-[#47A88D] prose-p:text-gray-700 prose-ul:space-y-2">
                        <div dangerouslySetInnerHTML={{ __html: auditHtml }} />
                    </div>
                    {mitigationText && hasGeminiKey() && (
                        <Button onClick={handleCommitmentCreation} className="mt-6 w-full bg-[#349881] hover:bg-[#47A88D]">
                            <PlusCircle className='w-5 h-5 mr-2' /> Turn Mitigation Strategy into Daily Commitment
                        </Button>
                    )}
                </Card>
            )}
        </div>
    );
};

const VisionBuilderView = ({ setPlanningView }) => {
    const { planningData, updatePlanningData } = useAppServices();

    const [vision, setVision] = useState(planningData?.vision || '');
    const [mission, setMission] = useState(planningData?.mission || '');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (planningData) {
            setVision(planningData.vision);
            setMission(planningData.mission);
        }
    }, [planningData]);

    const handleSave = async () => {
        if (!vision || !mission) return;
        setIsSaving(true);
        // Persist only vision and mission fields
        await updatePlanningData({ vision: vision, mission: mission });
        setIsSaving(false);
    };

    return (
        <div className="p-8">
            <h1 className="text-3xl font-extrabold text-[#002E47] mb-4">Vision Statement Builder</h1>
            <p className="text-lg text-gray-600 mb-6 max-w-3xl">Define your aspirational 3-5 year leadership and team Vision and Mission, setting your strategic North Star. **(Data is persistent)**</p>
            <Button onClick={() => setPlanningView('planning-home')} variant="outline" className="mb-8">
                <ArrowLeft className="w-5 h-5 mr-2" /> Back to Planning Hub
            </Button>

            <div className="space-y-6">
                <Card title="1. Define Your Vision (The Future State)" icon={TrendingUp}>
                    <p className="text-gray-700 text-sm mb-2">What does success look like 3-5 years from now? Keep it inspiring and memorable.</p>
                    <textarea 
                        value={vision} 
                        onChange={(e) => setVision(e.target.value)} 
                        className="w-full p-3 mt-4 border border-gray-300 rounded-xl focus:ring-[#47A88D] focus:border-[#47A88D] h-32" 
                        placeholder="e.g., 'To be the most trusted and innovative team in the industry, delivering exceptional value through empowered leadership.'"
                    ></textarea>
                </Card>

                <Card title="2. Define Your Mission (The Purpose)" icon={Target}>
                    <p className="text-gray-700 text-sm mb-2">Why does your team exist? What is the core business purpose and the primary value you deliver?</p>
                    <textarea 
                        value={mission} 
                        onChange={(e) => setMission(e.target.value)} 
                        className="w-full p-3 mt-4 border border-gray-300 rounded-xl focus:ring-[#47A88D] focus:border-[#47A88D] h-24" 
                        placeholder="e.g., 'To cultivate a culture of psychological safety that drives continuous improvement and world-class product delivery.'"
                    ></textarea>
                </Card>
                <Card title="Vision Checkpoints" icon={CheckCircle}>
                    <ul className='list-disc pl-5 text-sm text-gray-700 space-y-1'>
                        <li>Is your Vision concise (under 20 words)?</li>
                        <li>Is your Mission clear (defines purpose)?</li>
                        <li>Is it emotionally engaging?</li>
                    </ul>
                </Card>
            </div>

            <Button onClick={handleSave} disabled={isSaving || !vision || !mission} className="mt-8 w-full md:w-auto">
                {isSaving ? (
                    <><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div> Saving...</>
                ) : <><CheckCircle className="w-5 h-5 mr-2" /> Save Vision & Mission</>}
            </Button>
        </div>
    );
};

const OKRDraftingView = ({ setPlanningView }) => {
    const { planningData, updatePlanningData } = useAppServices();

    // Set initial state from planningData, safely defaulting to an empty array if undefined
    const [okrs, setOkrs] = useState(planningData?.okrs || []);
    const [isSaving, setIsSaving] = useState(false);
    const [okrCritique, setOkrCritique] = useState('');
    const [critiqueHtml, setCritiqueHtml] = useState('');
    const [isCritiquing, setIsCritiquing] = useState(false);

    useEffect(() => {
        // Sync local state when planningData updates (e.g., after initial load)
        if (planningData?.okrs) {
            setOkrs(planningData.okrs);
        }
    }, [planningData?.okrs]);

    useEffect(() => {
        if (!okrCritique) { setCritiqueHtml(''); return; }
        (async () => setCritiqueHtml(await mdToHtml(okrCritique)))();
    }, [okrCritique]);

    const updateObjective = (id, value) => {
        setOkrs(okrs.map(o => o.id === id ? { ...o, objective: value } : o));
        setOkrCritique(''); 
    };

    const updateKR = (objId, krId, value) => {
        setOkrs(okrs.map(o => o.id === objId ? {
            ...o,
            keyResults: o.keyResults.map(kr => kr.id === krId ? { ...kr, kr: value } : kr)
        } : o));
        setOkrCritique(''); 
    };

    const addKR = (objId) => {
        setOkrs(okrs.map(o => o.id === objId ? {
            ...o,
            keyResults: [...o.keyResults, { id: Date.now(), kr: '' }]
        } : o));
    };
    const removeKR = (objId, krId) => {
        setOkrs(okrs.map(o => o.id === objId ? {
            ...o,
            keyResults: o.keyResults.filter(kr => kr.id !== krId)
        } : o));
    };
    const removeObjective = (id) => {
        setOkrs(okrs.filter(o => o.id !== id));
    };
    const addObjective = () => {
        // Generate unique IDs for objective and initial key result
        const newObjId = Date.now();
        const newKRId = newObjId + 1;
        setOkrs([...okrs, { 
            id: newObjId, 
            objective: 'New Ambitious Objective', 
            keyResults: [{ id: newKRId, kr: '' }] 
        }]);
    };

    const handleSave = async () => {
        setIsSaving(true);
        // Filter out objectives/KRs that are completely empty before saving
        const validOkrs = okrs.filter(o => o.objective.trim() && o.keyResults.some(kr => kr.kr.trim()));
        await updatePlanningData({ okrs: validOkrs });
        setIsSaving(false);
    };

    const critiqueOKRs = async () => {
        const allInputsFilled = okrs.every(o => o.objective.trim() && o.keyResults.every(kr => kr.kr.trim()));
        if (!allInputsFilled) {
            alert("Please fill out all Objective and Key Result fields before requesting a critique.");
            return;
        }

        setIsCritiquing(true);
        setOkrCritique('');

        if (!hasGeminiKey()) {
            setOkrCritique("## AI Critique Unavailable\n\n**ERROR**: The Gemini API Key is missing. Please check App Settings.");
            setIsCritiquing(false);
            return;
        }
        const draftedOKRs = okrs.map((o, i) =>
          `Objective ${i + 1}: ${o.objective}\nKey Results:\n${o.keyResults.map(kr => `- ${kr.kr}`).join('\n')}`
        ).join('\n\n---\n\n');

        const systemPrompt = "You are an expert Strategic Planning Coach and OKR Auditor. Your task is to critique the user's drafted Objectives and Key Results (OKRs). Focus your feedback on three points: 1) Is the Objective ambitious and inspiring? 2) Are the Key Results measurable, time-bound, and quantitative (ideally formatted 'from X to Y')? 3) Do the KRs collectively measure the Objective's success? Provide a professional summary critique and then a refined example for the weakest Objective, maintaining the Objective text but fixing the Key Results to be measurable (from X to Y).";
        const userQuery = `Critique this set of Quarterly OKRs:\n\n${draftedOKRs}`;

        try {
            const payload = {
                contents: [{ role: "user", parts: [{ text: userQuery }] }],
                systemInstruction: { parts: [{ text: systemPrompt }] },
            };

            const result = await callSecureGeminiAPI(payload);

            const candidate = result?.candidates?.[0];

            if (candidate && candidate.content?.parts?.[0]?.text) {
                setOkrCritique(candidate.content.parts[0].text);
            } else {
                setOkrCritique("Could not generate critique. The model may have blocked the request or the response was empty.");
            }
        } catch (error) {
            console.error("Gemini API Error:", error);
            setOkrCritique("An error occurred while connecting to the AI coach. Please check your inputs and network connection.");
        } finally {
            setIsCritiquing(false);
        }
    };

    return (
        <div className="p-8">
            <h1 className="text-3xl font-extrabold text-[#002E47] mb-4">Quarterly OKR Drafting Tool</h1>
            <p className="text-lg text-gray-600 mb-6 max-w-3xl">Set 3-5 ambitious Objectives (What) and 3-4 Key Results (How) for the current quarter, directly tied to your Vision. Use the OKR Auditor below to ensure your KRs are measurable and high-impact. **(Data is persistent)**</p>
            <Button onClick={() => setPlanningView('planning-home')} variant="outline" className="mb-8">
                <ArrowLeft className="w-5 h-5 mr-2" /> Back to Planning Hub
            </Button>

            <div className="space-y-8">
                {okrs.map(obj => (
                    <Card key={obj.id} title={`Objective: ${obj.objective || 'New Objective'}`} icon={Target} className="border-l-4 border-[#002E47] rounded-3xl">
                        <div className='flex justify-between items-center mb-4'>
                            <p className="text-gray-700 text-sm font-semibold">Objective (What to achieve? Must be Inspiring)</p>
                            <button onClick={() => removeObjective(obj.id)} className='text-gray-400 hover:text-[#E04E1B] transition-colors'>
                                <Trash2 className='w-4 h-4'/>
                            </button>
                        </div>
                        <input
                            type="text"
                            value={obj.objective}
                            onChange={(e) => updateObjective(obj.id, e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-[#47A88D] focus:border-[#47A88D] mb-6"
                            placeholder="e.g., Dramatically improve team execution quality and velocity"
                        />

                        <h3 className="text-lg font-semibold text-[#47A88D] mb-3">Key Results (How to measure it? Must be 'from X to Y')</h3>
                        <div className="space-y-3">
                            {obj.keyResults.map((kr, index) => (
                                <div key={kr.id} className='flex items-center space-x-2'>
                                    <span className='font-mono text-sm text-gray-600 w-4'>{index + 1}.</span>
                                    <input
                                        type="text"
                                        value={kr.kr}
                                        onChange={(e) => updateKR(obj.id, kr.id, e.target.value)}
                                        className="flex-1 p-3 border border-gray-200 rounded-xl focus:ring-[#47A88D] focus:border-[#47A88D] text-sm"
                                        placeholder="e.g., Reduce customer reported bugs from 45 to 15 by EOD Q2."
                                    />
                                    <button onClick={() => removeKR(obj.id, kr.id)} className='text-gray-400 hover:text-[#E04E1B] transition-colors p-1'>
                                        <X className='w-4 h-4'/>
                                    </button>
                                </div>
                            ))}
                        </div>
                        <Button onClick={() => addKR(obj.id)} variant="outline" className="mt-4 text-xs px-4 py-2 border-dashed border-[#002E47]/30 text-[#002E47] hover:bg-[#002E47]/10">
                            + Add Key Result
                        </Button>
                    </Card>
                ))}
            </div>

            <div className='flex space-x-4 mt-8'>
                <Button onClick={addObjective} variant="outline" className="w-full md:w-auto px-6 py-3 border-dashed border-[#47A88D] text-[#47A88D] hover:bg-[#47A88D]/10">
                    + Add New Objective
                </Button>
                <Button onClick={handleSave} disabled={isSaving} className="w-full md:w-auto">
                    {isSaving ? (
                    <div className="flex items-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Saving...
                    </div>
                    ) : <><CheckCircle className="w-5 h-5 mr-2" /> Save Quarterly OKRs</>}
                </Button>
            </div>
            <Card title="OKR Auditor (AI Critique)" icon={Mic} className='mt-8 bg-[#47A88D]/10 border-2 border-[#47A88D]'>
                <p className='text-gray-700 text-sm mb-4'>Use the AI coach to review your drafted OKRs against industry best practices for measurability and ambition. **(Requires API Key)**</p>
                <Tooltip
                    content={hasGeminiKey() 
                        ? "Submits your OKRs to the AI Auditor for measurability and ambition critique." 
                        : "Requires Gemini API Key to run. Check App Settings."
                    }
                >
                    <Button onClick={critiqueOKRs} disabled={isCritiquing} className="w-full">
                        {isCritiquing ? (
                            <div className="flex items-center justify-center">
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                Auditing Strategy...
                            </div>
                        ) : 'Run OKR Audit'}
                    </Button>
                </Tooltip>

                {critiqueHtml && (
                    <div className="mt-6 pt-4 border-t border-[#47A88D]/30">
                        <div className="prose max-w-none prose-h3:text-[#002E47] prose-p:text-gray-700 prose-ul:space-y-2">
                            <div dangerouslySetInnerHTML={{ __html: critiqueHtml }} />
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
};

const AlignmentTrackerView = ({ setPlanningView }) => {
    const { planningData } = useAppServices();

    // Mock progress data for visualization, using loaded objectives for titles
    const objectives = planningData?.okrs?.map((o, index) => {
        const progress = (index === 0 ? 0.65 : index === 1 ? 0.80 : 0.30);
        const status = (progress >= 0.75 ? 'Ahead of Schedule' : progress >= 0.5 ? 'On Track' : 'At Risk');
        return { id: o.id, title: o.objective, progress, status };
    }) || [
        { id: 1, title: 'Improve Team Execution Quality (Mock)', progress: 0.65, status: 'On Track' },
        { id: 2, title: 'Formalize Succession Planning (Mock)', progress: 0.80, status: 'Ahead of Schedule' },
        { id: 3, title: 'Develop Cross-Functional Skills (Mock)', progress: 0.30, status: 'At Risk' },
    ];

    return (
        <div className="p-8">
            <h1 className="text-3xl font-extrabold text-[#002E47] mb-4">Strategic Alignment Tracker</h1>
            <p className="text-lg text-gray-600 mb-6 max-w-3xl">Review your current OKR progress and ensure your daily activity is aligned with your long-term Vision. (Goals are loaded from Firestore data).</p>
            <Button onClick={() => setPlanningView('planning-home')} variant="outline" className="mb-8">
                <ArrowLeft className="w-5 h-5 mr-2" /> Back to Planning Hub
            </Button>

            <div className="space-y-6">
                {objectives.map(obj => (
                    <Card key={obj.id} title={obj.title} icon={CheckCircle} className="border-l-4 border-[#47A88D] rounded-3xl">
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-gray-700">Progress: {Math.round(obj.progress * 100)}%</p>
                            <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                                obj.status === 'On Track' ? 'bg-[#47A88D]/20 text-[#002E47]' :
                                obj.status === 'Ahead of Schedule' ? 'bg-[#002E47]/20 text-[#002E47]' :
                                'bg-[#E04E1B]/20 text-[#E04E1B]'
                            }`}>{obj.status}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                            <div className="bg-[#47A88D] h-2.5 rounded-full transition-all duration-500" style={{ width: `${obj.progress * 100}%` }}></div>
                        </div>
                        <h3 className="text-lg font-semibold text-[#002E47] mt-4 mb-2">Quarterly Reflection</h3>
                        <p className="text-sm text-gray-700">
                            <strong>What went well:</strong> The team adopted the new execution checklist immediately, leading to better early-stage quality.
                        </p>
                        <p className="text-sm text-gray-700 mt-2">
                            <strong>Next steps:</strong> Need to address Objective 3—the key result tracking is too passive. Must switch to a leading indicator.
                        </p>
                    </Card>
                ))}

                <Card title="Vision Alignment Check" icon={Lightbulb} className="bg-[#002E47]/10 border-2 border-[#002E47]/20 rounded-3xl">
                    <p className="text-gray-700 text-sm">
                        Does your current priority list directly contribute to these Objectives? Use this space to log any activities that are draining time but <strong>not</strong> aligning with your Vision.
                    </p>
                    <textarea className="w-full p-3 mt-4 border border-gray-300 rounded-xl focus:ring-[#47A88D] focus:focus:border-[#47A88D] h-24" placeholder="Log strategic misalignment issues here..."></textarea>
                    <Button variant="secondary" className="mt-4">Save Reflection</Button>
                </Card>
            </div>
        </div>
    );
};
// --- MAIN ROUTER ---
export default function PlanningHubScreen() {
    const { isLoading, error } = useAppServices();

    if (isLoading) {
        return (
            <div className="p-8 min-h-screen flex items-center justify-center">
                <div className="flex flex-col items-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#47A88D] mb-3"></div>
                    <p className="text-[#47A88D] font-medium">Loading Strategic Planning Hub...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return <div className="p-8"><p className="text-[#E04E1B] p-4 bg-red-100 rounded-xl">Error loading data: {error}</p></div>;
    }

    const [view, setPlanningView] = useState('planning-home');
    const viewProps = { setPlanningView: setPlanningView };

    const renderView = () => {
        switch (view) {
            case 'vision-builder':
                return <VisionBuilderView {...viewProps} />;
            case 'okr-drafting':
                return <OKRDraftingView {...viewProps} />;
            case 'alignment-tracker':
                return <AlignmentTrackerView {...viewProps} />;
            case 'pre-mortem':
                return <PreMortemView {...viewProps} />;
            case 'planning-home':
            default:
                return (
                    <div className="p-8">
                        <h1 className="text-3xl font-extrabold text-[#002E47] mb-6">Vision & OKR Planning Hub</h1>
                        <p className="text-lg text-gray-600 mb-8 max-w-3xl">Transform abstract ideas into actionable goals. Build a clear Vision, draft measurable OKRs, and ensure strategic alignment. **(All data is persistent)**</p>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <Card title="Vision Builder" icon={TrendingUp} onClick={() => setPlanningView('vision-builder')} className="border-l-4 border-[#47A88D] rounded-3xl">
                                <p className="text-gray-700 text-sm">Define your 3-5 year Vision and Mission Statement. Get clarity on your strategic North Star.</p>
                                <div className="mt-4 text-[#47A88D] font-semibold flex items-center">
                                    Launch Tool &rarr;
                                </div>
                            </Card>

                            <Card title="OKR Drafting Tool" icon={Target} onClick={() => setPlanningView('okr-drafting')} className="border-l-4 border-[#002E47] rounded-3xl">
                                <p className="text-gray-700 text-sm">Structured templates for creating Quarterly Objectives and Key Results (KRs) with **AI Audit**.</p>
                                <div className="mt-4 text-[#002E47] font-semibold flex items-center">
                                    Launch Tool &rarr;
                                </div>
                            </Card>
                            <Card title="Decision-Making Matrix (Pre-Mortem)" icon={AlertTriangle} onClick={() => setPlanningView('pre-mortem')} className="border-l-4 border-[#E04E1B] rounded-3xl bg-[#E04E1B]/10">
                                <p className="text-gray-700 text-sm">Use the **Devil's Advocate AI** to identify critical blind spots and failure modes before you commit to a major decision. **(Requires API Key)**</p>
                                <div className="mt-4 text-[#E04E1B] font-semibold flex items-center">
                                    Launch Auditor &rarr;
                                </div>
                            </Card>

                            <Card title="Strategic Alignment Tracker" icon={Zap} onClick={() => setPlanningView('alignment-tracker')} className="border-l-4 border-[#47A88D] rounded-3xl">
                                <p className="text-gray-700 text-sm">Review your OKR progress, conduct quarterly reflections, and track how daily priorities map to your goals.</p>
                                <div className="mt-4 text-[#47A88D] font-semibold flex items-center">
                                    Launch Tracker &rarr;
                                </div>
                            </Card>
                        </div>
                    </div>
                );
        }
    };

    return renderView();
}