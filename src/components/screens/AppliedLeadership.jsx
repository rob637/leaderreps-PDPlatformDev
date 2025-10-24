// src/components/screens/AppliedLeadership.jsx

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
    Briefcase, Aperture, Users, Heart, Gavel, Code, PiggyBank, GraduationCap, X, ChevronRight, Zap, Target, CornerRightUp, Lightbulb, Mic, MessageSquare, Compass, Network, Globe, TrendingDown, Clock, Cpu, CornerDownRight, ArrowLeft, BookOpen, Download
} from 'lucide-react';
// CRITICAL FIX: Use the actual service hook from the context
import { useAppServices } from '../../services/useAppServices.jsx'; 


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
    BG: '#F9FAFB',
};

// FIX 1: Defined Card and Button components locally to resolve any potential ReferenceError
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
   WORLD-CLASS DOMAIN DATA STRUCTURE - DELETED
========================================================= */
// Note: LEADERSHIP_DOMAINS and RESOURCE_LIBRARY are deleted.
// We use icon map here to reference the correct Lucide icon based on the ID string
const IconMap = {
    'women-exec': Users, 'lgbtqia-leader': Heart, 'poc-leader': Network, 
    'non-profit': PiggyBank, 'public-sector': Gavel, 'tech-lead': Code, 
    'global-remote': Globe, 'crisis-turnaround': TrendingDown, 
    'emerging-leader': GraduationCap, 'veteran-leader': Briefcase
};


/* =========================================================
   AI COACHING SIMULATOR (Sub-Component)
========================================================= */

const AICoachingSimulator = ({ domain, RESOURCES }) => {
    // FIX 1: Accessing services from useAppServices
    const { callSecureGeminiAPI, hasGeminiKey, navigate, GEMINI_MODEL, updateCommitmentData } = useAppServices();
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
            // FIX 2: Final payload structure for Gemini call
            const payload = {
                contents: [{ parts: [{ text: userQuery }] }],
                systemInstruction: { parts: [{ text: systemPrompt }] },
                model: GEMINI_MODEL,
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
        const userQuery = `Generate 3 micro-habits for the domain: ${domain.title}. Ensure they include a Tier focus (T1-T5) in parentheses, e.g., "(T4)".`;

        const jsonSchema = {
            type: "ARRAY",
            items: { type: "STRING" }
        };

        try {
            // FIX 4: Final payload structure for Gemini call
            const payload = {
                contents: [{ parts: [{ text: userQuery }] }],
                systemInstruction: { parts: [{ text: systemPrompt }] },
                generationConfig: {
                    responseMimeType: "application/json",
                    responseSchema: jsonSchema
                },
                model: GEMINI_MODEL,
            };
            const response = await callSecureGeminiAPI(payload);
            const jsonText = response?.candidates?.[0]?.content?.parts?.[0]?.text;
            
            const cleanJsonText = jsonText.trim().replace(/^[^\[]*/, '').replace(/[^\]]*$/, '').trim(); // Robustly clean JSON array wrapper

            const habits = JSON.parse(cleanJsonText);
            
            setResult(
                <div className='mt-4 p-4 bg-white rounded-xl border border-dashed border-gray-300'>
                    <h4 className='text-sm font-bold text-[#002E47] mb-2 flex items-center'><CornerRightUp className='w-4 h-4 mr-2 text-[#47A88D]'/> Suggested Daily Micro-Habits:</h4>
                    <ul className='list-disc list-inside space-y-1 text-sm text-gray-700'>
                        {habits.map((h, i) => <li key={i}>{h}</li>)}
                    </ul>
                    <Button onClick={() => handleAddHabitsToScorecard(habits)} variant='outline' className='mt-4 text-xs px-3 py-1 w-full'>
                        <Clock className='w-3 h-3 mr-1'/> Add to Daily Practice
                    </Button>
                </div>
            );

        } catch (e) {
            console.error("Habit Suggestion Error:", e);
            setResult("Failed to generate habits. Please check API or try again. Raw error: " + e.message);
        } finally {
            setIsLoading(false);
        }
    }

    // FIX 5: New handler to process AI-generated habits and commit them
    const handleAddHabitsToScorecard = async (habits) => {
        if (!updateCommitmentData) return;
        
        const newCommitments = habits.map((text, index) => {
            // Simple logic to extract T-tier for linking (e.g., "(T4)")
            const tierMatch = text.match(/\((T[1-5])\)/);
            const linkedTier = tierMatch ? tierMatch[1] : 'T3'; 
            
            return {
                id: `applied-${domain.id}-${Date.now()}-${index}`,
                text: text,
                status: 'Pending',
                isCustom: true,
                linkedGoal: domain.title,
                linkedTier: linkedTier,
                targetColleague: 'Self-Directed Practice',
            };
        });

        // Use the commitment update service
        const success = await updateCommitmentData(data => ({ 
            ...data, // Preserve other data in the commitment object
            active_commitments: [...(data?.active_commitments || []), ...newCommitments] 
        }));

        if (success) {
            alert("3 Micro-Habits added to your Daily Practice Scorecard!");
            navigate('daily-practice'); 
        } else {
            alert("Failed to save new commitments.");
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
                        {typeof result === 'string' ? result : result}
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
    // CRITICAL: Pull all necessary data from the service context
    const { LEADERSHIP_DOMAINS: DOMAINS, RESOURCE_LIBRARY: RESOURCES } = useAppServices();

    // Use a safe, empty array fallback if data is still loading
    const safeDomains = DOMAINS || []; 

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
        // CRITICAL FIX: Access resources from the loaded service data
        const resources = RESOURCES?.[domain.id] || []; 

        // CRITICAL FIX: Get the icon component from the local map based on the domain ID
        const Icon = IconMap[domain.id];

        return (
            <div className="p-8 bg-white rounded-3xl shadow-2xl sticky top-0 md:top-4 z-30">
                <Button onClick={() => setSelectedDomain(null)} variant='nav-back' className='mb-6'>
                    <ArrowLeft className="w-5 h-5 mr-2" /> Back to Domains
                </Button>

                <h1 className="text-3xl font-extrabold flex items-center mb-2" style={{ color: COLORS.NAVY }}>
                    <Icon className='w-8 h-8 mr-3' style={{ color: COLORS[domain.color] }}/>
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
                       <AICoachingSimulator domain={domain} RESOURCES={RESOURCES} />
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
            <h1 className="text-4xl font-extrabold text-[#002E47] mb-4">Applied Content Library (Pillar 1)</h1>
            <p className="text-xl text-gray-600 mb-10 max-w-4xl">
                Go beyond generic advice. Access micro-habits, resources, and AI coaching tailored to your specific industry, identity, or high-stakes operational context. **Practice over theory.**
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {safeDomains.map((domain) => {
                    // CRITICAL FIX: Pull Icon component from the local map based on the domain ID
                    const Icon = IconMap[domain.id];
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
                                        {Icon && <Icon className="w-6 h-6" style={{ color: accentColor }} />}
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
            {safeDomains.length === 0 && (
                 <p className="text-gray-500 italic text-center py-10">Loading applied content tracks...</p>
            )}
        </div>
    );

    return (
        <div className='min-h-screen bg-gray-50'>
            {selectedDomain ? renderDomainDetail() : renderDomainGrid()}
        </div>
    );
}