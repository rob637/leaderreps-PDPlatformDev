// src/components/screens/RoadmapTracker.jsx

import { Home, Settings, Zap, Clock, Briefcase, Mic, Trello, BookOpen, BarChart3, TrendingUp, TrendingDown, CheckCircle, Star, Target, Users, HeartPulse, CornerRightUp, X, ArrowLeft, Activity, Link, Lightbulb, AlertTriangle, Check, Calendar, Dumbbell, Send, Send as ShareIcon } from 'lucide-react';
import React, { useState, useEffect, useMemo, useCallback } from 'react';

// --- SERVICES (production) ---
import { useAppServices } from '../../services/useAppServices.jsx';

/* =========================================================
   HIGH-CONTRAST PALETTE (Centralized for Consistency)
========================================================= */
const COLORS = {
  NAVY: '#002E47',      
  TEAL: '#47A88D',      
  SUBTLE_TEAL: '#47A88D', 
  ORANGE: '#E04E1B',    
  GREEN: '#47A88D',
  AMBER: '#F5A500', 
  RED: '#E04E1B',
  LIGHT_GRAY: '#FCFCFA',
  OFF_WHITE: '#FFFFFF', 
  SUBTLE: '#E5E7EB',
  TEXT: '#002E47',
  MUTED: '#4B5355',
  BLUE: '#002E47',
  BG: '#F9FAFB', 
  PURPLE: '#47A88D', 
};

// Mock UI components (Standardized)
const Button = ({ children, onClick, disabled = false, variant = 'primary', className = '', ...rest }) => {
  const variantStyles = {
    primary: 'bg-[#47A88D] hover:bg-[#47A88D] focus:ring-[#47A88D]/50 text-white',
    secondary: 'bg-[#E04E1B] hover:bg-[#C33E12] focus:ring-[#E04E1B]/50 text-white',
    outline: 'border-2 border-[#47A88D] text-[#47A88D] hover:bg-[#47A88D]/10 focus:ring-[#47A88D]/50 bg-[#FCFCFA]',
    'nav-back': 'border-2 border-gray-300 text-gray-700 hover:bg-gray-100',
  };

  const baseStyle = "px-6 py-3 rounded-xl font-semibold transition-all shadow-xl focus:outline-none focus:ring-4 flex items-center justify-center";
  const disabledStyle = "bg-gray-300 text-gray-500 cursor-not-allowed shadow-inner transition-none";

  const finalClassName = `${baseStyle} ${disabled ? disabledStyle : variantStyles[variant]} ${className}`;

  return (
    <button {...rest} onClick={onClick} disabled={disabled} className={finalClassName}>
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
      className={`relative p-6 rounded-2xl border-2 shadow-2xl transition-all duration-300 text-left ${className}`}
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

// --- Tooltip Component ---
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
const mdToHtml = async (md) => {
    let html = md;
    html = html.replace(/## (.*$)/gim, '<h2 class="text-2xl font-extrabold text-[#E04E1B] mb-3">$1</h2>');
    html = html.replace(/### (.*$)/gim, '<h3 class="text-xl font-bold text-[#47A88D] mt-4 mb-2">$1</h3>');
    html = html.replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>');
    html = html.split('\n').map(line => line.trim()).filter(line => line.length > 0).map(line => {
        if (line.startsWith('<ul>') || line.startsWith('<li>') || line.startsWith('<h') || line.startsWith('<s')) return line;
        return `<p class="text-sm text-gray-700">${line}</p>`;
    }).join('');
    html = html.replace(/<p><\/p>/g, ''); 
    html = html.replace(/<ul>/g, '<ul><li class="text-sm text-gray-700">').replace(/<\/li>/g, '</li></ul>');
    return html;
};
// FIX: Removed 'Eye' and other missing/unused icons from the import list based on the error.
const IconMap = {
    Zap: Zap, Users: Users, Briefcase: Briefcase, Target: Target, BarChart3: BarChart3, Clock: Clock, BookOpen: BookOpen, Lightbulb: Lightbulb, X: X, ArrowLeft: ArrowLeft, CornerRightUp: CornerRightUp, AlertTriangle: AlertTriangle, CheckCircle: CheckCircle, Star: Star, Mic: Mic, Trello: Trello, Settings: Settings, Home: Home, Check: Check, Calendar: Calendar, HeartPulse: HeartPulse, TrendingUp: TrendingUp, TrendingDown: TrendingDown, Activity: Activity, Link: Link, Dumbbell: Dumbbell
};

// --- PDP Utility & Plan Generation stubs ---
const LEADERSHIP_TIERS = {
    T1: { id: 'T1', name: 'Lead Self & Mindsets', icon: 'HeartPulse', color: 'indigo-500' },
    T2: { id: 'T2', name: 'Lead Work & Execution', icon: 'Briefcase', color: 'green-600' },
    T3: { id: 'T3', name: 'Lead People & Coaching', icon: 'Users', color: 'yellow-600' },
    T4: { id: 'T4', name: 'Conflict & Team Health', icon: 'AlertTriangle', color: 'red-640' },
    T5: { id: 'T5', name: 'Strategy & Vision', icon: 'TrendingUp', color: 'cyan-600' },
};

// NOTE: All assessment and generator constants/functions are removed from this file.

const MOCK_CONTENT_DETAILS_FINAL = {
    Reading: (title, skill) => `## Reading: ${title}\n### Focus: ${skill}\nThis is a reading module focusing on ${skill} theory.`,
    Exercise: (title, skill) => `## Exercise: ${title}\n### Focus: ${skill}\nThis is a practical exercise for skill ${skill}.`,
    'Role-Play': (title, skill) => `## Role-Play: ${title}\n### Focus: ${skill}\nThis is a simulation for skill ${skill}.`, 
    CaseStudy: (title, skill) => `## Executive Analysis: ${title}\n### Focus: ${skill}\nThis is a case study analysis for skill ${skill}.`,
    Tool: (title, skill) => `## Tool Implementation: ${title}\n### Focus: ${skill}\nThis is a tool implementation module for skill ${skill}.`,
    Coaching: (title, skill) => `## AI Coaching Lab: ${title}\n### Focus: ${skill}\nThis is an AI coaching session for skill ${skill}.`,
};

// --- Component 4: PDP Content Details Modal ---
const ContentDetailsModal = ({ isVisible, onClose, content }) => { 
    const [htmlContent, setHtmlContent] = useState('');
    const [rating, setRating] = useState(0); 
    const [isLogging, setIsLogging] = useState(false);

    const mockDetail = useMemo(() => content ? (MOCK_CONTENT_DETAILS_FINAL[content.type]
        ? MOCK_CONTENT_DETAILS_FINAL[content.type](content.title, content.skill)
        : `## Content Unavailable\n\nNo detailed content available for **${content.title}** (Type: ${content.type}).`) : '', [content]);

    useEffect(() => {
        if (!isVisible || !content) return;

        let isCancelled = false;
        setHtmlContent('');
        setRating(0);

        (async () => {
            const html = await mdToHtml(mockDetail);
            if (!isCancelled) {
                setHtmlContent(html);
            }
        })();

        return () => {
            isCancelled = true;
        };
    }, [isVisible, content, mockDetail]);

    if (!isVisible || !content) return null;
    
    return <ContentDetailsModalInternal 
        content={content} 
        onClose={onClose} 
        htmlContent={htmlContent}
        rating={rating}
        setRating={setRating}
        isLogging={isLogging}
        setIsLogging={setIsLogging}
    />;
};

const ContentDetailsModalInternal = ({ content, onClose, htmlContent, rating, setRating, isLogging, setIsLogging }) => {
    const tierData = LEADERSHIP_TIERS[content.tier] || { name: 'Unknown Tier' };
    
    const handleLogLearning = async () => {
        if (rating === 0) { return; }
        setIsLogging(true);
        await new Promise(r => setTimeout(r, 800));
        // NOTE: In a real app, you would dispatch a data update here to log learning progress.
        setIsLogging(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-[#002E47]/80 z-50 flex items-center justify-center p-4">
            <div className="bg-[#FCFCFA] rounded-3xl shadow-2xl w-full max-h-[90vh] overflow-y-auto p-3 sm:p-4 lg:p-6">
                <div className="flex justify-between items-start border-b pb-4 mb-6">
                    <h2 className="text-xl sm:text-2xl sm:text-3xl font-extrabold text-[#002E47] flex items-center">
                        <BookOpen className="w-8 h-8 mr-3 text-[#47A88D]" />
                        {content.title} ({content.type})
                    </h2>
                    <button onClick={onClose} className="p-2 text-gray-500 hover:text-[#E04E1B] transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>
                <div className="mb-6 text-sm flex space-x-4 border-b pb-4">
                    <p className="text-gray-700 font-semibold">Tier: <span className='text-[#002E47]'>{tierData.name}</span></p>
                    <p className="text-gray-700 font-semibold">Skill Focus: <span className='text-[#002E47]'>{content.skill}</span></p>
                    <p className="text-gray-700 font-semibold">Est. Duration: <span className='text-[#002E47]'>{content.duration} min</span></p>
                </div>
                <div className="prose max-w-none text-gray-700">
                    {htmlContent ? (
                        <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
                    ) : (
                        <p className='text-gray-500 flex items-center'>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500 mr-2"></div>
                            Loading content details...
                        </p>
                    )}
                </div>
                <div className='mt-8 pt-6 border-t border-gray-200'>
                    <h3 className='text-lg font-bold text-[#002E47] mb-3 flex items-center'>
                        <Star className="w-5 h-5 mr-2 text-[#E04E1B]" />
                        Review & Log Learning
                    </h3>
                    <p className="text-sm text-gray-700 mb-4">
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


// --- Component 3: Roadmap Timeline View (Unchanged) ---
const RoadmapTimeline = ({ data, navigateToMonth, viewMonth }) => {
    return (
        <Card title="24-Month Roadmap Timeline" icon={Trello} accent="PURPLE" className='lg:sticky lg:top-4 bg-white shadow-2xl border-l-4 border-[#47A88D]'>
            <p className='text-sm text-gray-600 mb-4'>Review your full two-year journey. Click a month to review its content and reflection.</p>
            <div className='max-h-96 overflow-y-auto space-y-2 pr-2'>
                {data.plan.map(monthData => {
                    const isCurrentView = monthData.month === viewMonth;
                    const isFuture = monthData.month > data.currentMonth; 
                    const isCompleted = monthData.status === 'Completed';
                    const isClickable = true; 

                    return (
                        <div key={monthData.month}
                             className={`p-3 rounded-lg border flex justify-between items-center transition-all cursor-pointer shadow-sm
                                         ${isCurrentView ? 'bg-[#47A88D]/20 border-[#47A88D] font-extrabold' : isCompleted ? 'bg-[#47A88D]/10 border-[#47A88D]' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'}
                                         ${isFuture && !isCurrentView ? 'opacity-80' : ''}` 
                             }
                             onClick={() => {
                                 if (isClickable) navigateToMonth(monthData.month); 
                             }}
                        >
                            <span className={`text-sm ${isCurrentView ? 'text-[#47A88D]' : 'text-[#002E47]'}`}>
                                **Training Month {monthData.month}**: {monthData.theme}
                            </span>
                            <span className="flex items-center space-x-1 text-xs">
                                <Check size={16} className={isCompleted ? 'text-green-600' : 'text-gray-400'} />
                                <span className={isCompleted ? 'text-green-600' : 'text-gray-400'}>
                                    {monthData.month === data.currentMonth ? 'CURRENT' : isCompleted ? 'COMPLETED' : isFuture ? 'FUTURE' : 'PENDING'}
                                </span>
                            </span>
                        </div>
                    );
                })}
            </div>
        </Card>
    );
};


// --- Component 2: Tracker Dashboard View ---
const TrackerDashboardView = ({ data, updatePdpData, navigate }) => {
    const [viewMonth, setViewMonth] = useState(data.currentMonth); 
    
    const monthPlan = useMemo(() => data.plan.find(m => m.month === viewMonth), [data.plan, viewMonth]);
    
    const isCurrentView = viewMonth === data.currentMonth; 
    const isPastOrCurrent = viewMonth <= data.currentMonth; 
    
    const assessment = data.assessment;

    const [localReflection, setLocalReflection] = useState(monthPlan?.reflectionText || '');
    const [isSaving, setIsSaving] = useState(false);
    const [briefing, setBriefing] = useState(monthPlan?.briefingText || null); 
    const [briefingLoading, setBriefingLoading] = useState(false);
    
    const [isContentModalVisible, setIsContentModalVisible] = useState(false);
    const [selectedContent, setSelectedContent] = useState(null);

    const [togglingIds, setTogglingIds] = useState(() => new Set());

    const { callSecureGeminiAPI, hasGeminiKey } = useAppServices(); 

    // --- Handlers ---
    const handleContentStatusToggle = useCallback((contentId) => {
        if (!isCurrentView) return; 
        updatePdpData(oldData => {
            const updatedContent = monthPlan.requiredContent.map(item =>
                item.id === contentId ? { 
                    ...item, 
                    status: item.status === 'Completed' ? 'Pending' : 'Completed',
                    dateCompleted: item.status === 'Completed' ? null : new Date().toISOString(), // NEW: Completion Timestamp
                } : item
            );
            const updatedPlan = oldData.plan.map(m =>
                m.month === data.currentMonth ? { ...m, requiredContent: updatedContent } : m
            );
            return { ...oldData, plan: updatedPlan };
        });
    }, [isCurrentView, updatePdpData, monthPlan, data.currentMonth]);

    const toggleContent = useCallback((id) => {
        if (!isPastOrCurrent) return; 
        setTogglingIds(prev => { const n = new Set(prev); n.add(id); return n; });
        handleContentStatusToggle(id);
        setTimeout(() => {
            setTogglingIds(prev => { const n = new Set(prev); n.delete(id); return n; });
        }, 400);
    }, [isPastOrCurrent, handleContentStatusToggle]);

    useEffect(() => {
        const fetchMonthlyBriefing = async (plan, assessment) => {
            if (briefingLoading || !hasGeminiKey() || !plan || !assessment || !isCurrentView) return;
            
            if (plan.briefingText || briefing) {
                setBriefing(plan.briefingText || briefing);
                return;
            }
    
            setBriefingLoading(true);
            const currentTier = LEADERSHIP_TIERS[plan.tier];
            const rating = 5; 
    
            const systemPrompt = `You are a concise Executive Coach. Analyze the user's current Roadmap phase (fitness training). Given their focus tier (${currentTier.name}) and their initial self-rating (${rating}/10), provide: 1) A 1-sentence **Executive Summary** of the goal (the rep/skill). 2) A 1-sentence **Coaching Nudge** on how to prioritize the month's learning based on their skill gap. Use bold markdown for key phrases.`;
    
            const userQuery = `Generate a monthly briefing for the user's current focus: ${plan.theme}. Required content/reps includes: ${plan.requiredContent.map(c => c.title).join(', ')}.`;
    
            try {
                const payload = {
                    contents: [{ role: "user", parts: [{ text: userQuery }] }],
                    systemInstruction: { parts: [{ text: systemPrompt }] },
                    model: 'gemini-2.5-flash',
                };
                const result = await callSecureGeminiAPI(payload);
                const text = result?.candidates?.[0]?.content?.parts?.[0]?.text;
                
                if (text && text !== briefing) {
                    setBriefing(text);
                }
    
            } catch (e) {
                setBriefing("AI coach unavailable. Focus on completing your required content first.");
            } finally {
                setBriefingLoading(false);
            }
        };

        if (monthPlan && assessment && isCurrentView && !monthPlan.briefingText && !briefingLoading) {
            fetchMonthlyBriefing(monthPlan, assessment);
        }
    }, [monthPlan, assessment, isCurrentView, briefingLoading, hasGeminiKey, callSecureGeminiAPI, briefing]);

    const handleCompleteMonth = async () => {
        // Check if this month is the end of a 90-day block (Month 3, 6, 9, etc.)
        const is90DayCheckPoint = data.currentMonth % 3 === 0;

        setIsSaving(true);
        const briefingToSave = briefing ? briefing.replace('## Monthly Executive Briefing', '## Saved Executive Briefing') : '';
        
        await updatePdpData(oldData => {
            const updatedPlan = oldData.plan.map(m => 
                m.month === oldData.currentMonth ? { 
                    ...m, 
                    status: 'Completed', 
                    reflectionText: localReflection, 
                    monthCompletedDate: new Date().toISOString(),
                    briefingText: briefingToSave, 
                } : m
            );
            return { 
                ...oldData, 
                plan: updatedPlan, 
                currentMonth: oldData.currentMonth + 1 
            };
        });
        setIsSaving(false);
        
        if (is90DayCheckPoint) {
            // CRITICAL: Navigate to the old generator screen to trigger the re-assessment flow if needed
            navigate('prof-dev-plan-review'); // Navigate to a review/re-assessment screen
        } else {
            setViewMonth(data.currentMonth + 1);
            window.scrollTo(0, 0); 
        }
    };

    // FIX: Implement robust plan clearing logic here.
    const handleResetPlan = async () => {
        // CRITICAL: Save a minimum, empty data structure to the document to clear the old plan's existence.
        setIsSaving(true);
        try {
            await updatePdpData({ 
  });
            // After data is cleared, navigate to the generator screen.
            navigate('prof-dev-plan');
            window.scrollTo(0,0); 
        } catch(e) {
            console.error("Failed to reset plan:", e);
            alert("Failed to reset plan data. Check database permissions or refresh the page manually.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleOpenContentModal = (contentItem) => { setSelectedContent(contentItem); setIsContentModalVisible(true); };

    const handleSaveReflection = () => {
        if (!isCurrentView || localReflection === monthPlan?.reflectionText || localReflection.length === 0) return;

        setIsSaving(true);
        updatePdpData(oldData => {
            const updatedPlan = oldData.plan.map(m =>
                m.month === data.currentMonth ? { ...m, reflectionText: localReflection } : m
            );
            
            // NOTE: Use the current assessment scores for the snapshot
            const selfRatings = data.assessment?.selfRatings || {};
            const newProgressScan = {
                cycle: Math.ceil(data.currentMonth / 3), 
                month: data.currentMonth,
                date: new Date().toISOString(),
                scores: selfRatings, 
                reflection: localReflection,
            };

            return { 
                ...oldData, 
                plan: updatedPlan,
                progressScans: [...(oldData.progressScans || []), newProgressScan] 
            };
        }).then(() => {
            setIsSaving(false);
        }).catch((e) => {
             console.error("Reflection Save Failed:", e);
             setIsSaving(false);
        });
    };
    
    // Effects simplified for this context
    useEffect(() => { setLocalReflection(monthPlan?.reflectionText || ''); setBriefing(monthPlan?.briefingText || null); setBriefingLoading(false); window.scrollTo(0, 0); }, [monthPlan]);
    
    
    // --- Data Calculation ---
    const currentTierId = monthPlan?.tier;
    const selfRating = data.assessment?.selfRatings?.[currentTierId] || 5; // Use 5 as a fallback
    const lowRatingFlag = currentTierId && selfRating <= 4;
    const allContentCompleted = monthPlan?.requiredContent?.every(item => item.status === 'Completed');
    const isReadyToComplete = allContentCompleted && localReflection.length >= 50;
    const requiredContent = monthPlan?.requiredContent || [];
    const totalDuration = data.plan.reduce((sum, m) => sum + m.totalDuration, 0);
    const completedDuration = data.plan.filter(m => m.month < data.currentMonth).reduce((sum, m) => sum + m.totalDuration, 0);
    const progressPercentage = totalDuration > 0 ? Math.round((completedDuration / totalDuration) * 100) : 0;
    const TierIcon = IconMap[LEADERSHIP_TIERS[currentTierId]?.icon || 'Target'];
    const completedItems = requiredContent.filter(item => item.status === 'Completed').length;
    const tierProgress = { overallPercentage: requiredContent.length > 0 ? Math.round((completedItems / requiredContent.length) * 100) : 0, completedContent: completedItems, totalContent: requiredContent.length }; 
    const safeBriefing = briefingLoading && isCurrentView ? 'Loading AI Briefing...' : (typeof briefing === 'string' ? briefing : 'Historical briefing unavailable.');


    return (
        <div className="p-3 sm:p-4 lg:p-6 md:p-10 min-h-screen" style={{ background: COLORS.BG, color: COLORS.TEXT }}>
            <div className='flex items-center gap-4 border-b-2 pb-2 mb-8' style={{borderColor: COLORS.PURPLE+'30'}}>
                <Dumbbell className='w-10 h-10' style={{color: COLORS.PURPLE}}/>
                <h1 className="text-4xl font-extrabold" style={{ color: COLORS.NAVY }}>Development Roadmap Tracker</h1>
            </div>

            {/* Progress Bar & Header */}
            <Card title={`Roadmap Progress: Training Month ${data.currentMonth} of 24`} icon={Clock} accent='NAVY' className="bg-[#002E47]/10 border-4 border-[#002E47]/20 mb-8">
                <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
                    <div
                        className="bg-[#47A88D] h-4 rounded-full transition-all duration-700"
                        style={{ width: `${progressPercentage}%` }}
                    ></div>
                </div>
                <p className='text-sm font-medium text-[#002E47]'>
                    {Math.round(progressPercentage)}% Complete. Next Tier Focus in {4 - ((data.currentMonth - 1) % 4)} months.
                </p>
                <div className='flex space-x-4 mt-4'>
                    <Button onClick={handleResetPlan} variant='outline' className='text-xs px-4 py-2 text-[#E04E1B] border-[#E04E1B]/50 hover:bg-[#E04E1B]/10'>
                        Start Over / Re-Run Assessment
                    </Button>
                    <Button onClick={() => {}} variant='outline' className='text-xs px-4 py-2 border-[#002E47] text-[#002E47] hover:bg-[#002E47]/10'>
                        <ShareIcon className="w-4 h-4 mr-1" /> Share Monthly Focus
                    </Button>
                </div>
            </Card>

            {/* Current Month Plan */}
            <div className='lg:grid lg:grid-cols-4 lg:gap-4 sm:gap-6 lg:gap-8'>
                
                <div className='lg:col-span-1 space-y-4 sm:space-y-6 lg:space-y-8 order-1'>
                    <RoadmapTimeline data={data} currentMonth={data.currentMonth} navigateToMonth={setViewMonth} viewMonth={viewMonth} />
                    
                    <Card title={`Tier Mastery Status (${currentTierId})`} icon={Star} accent='NAVY' className='bg-[#FCFCFA] border-l-4 border-[#002E47] text-center'>
                         <div className="relative w-32 h-32 mx-auto mb-4">
                            <svg viewBox="0 0 36 36" className="w-full h-32 h-full transform -rotate-90">
                                <path className="text-gray-300" fill="none" stroke="currentColor" strokeWidth="3.8" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"/>
                                <path className="text-[#47A88D]" fill="none" stroke="currentColor" strokeWidth="3.8" strokeDasharray={`${tierProgress.overallPercentage}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"/>
                            </svg>
                            <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
                                <span className="text-xl sm:text-2xl sm:text-3xl font-extrabold text-[#002E47]">{tierProgress.overallPercentage}%</span>
                            </div>
                        </div>
                        <p className='text-md font-semibold text-[#002E47] mb-1'>{tierProgress.completedContent} / {tierProgress.totalContent} Content Reps Completed</p>
                        <p className='text-xs text-gray-600'>For Tier: **{LEADERSHIP_TIERS[currentTierId]?.name}**</p>
                    </Card>

                </div>


                <div className='lg:col-span-3 space-y-4 sm:space-y-6 lg:space-y-8 order-2'>
                    
                    {/* VIEWING WARNINGS - THESE DISPLAY FOR FUTURE/PAST MONTHS */}
                    {viewMonth > data.currentMonth && ( // Check if viewing a future month
                        <div className='p-4 rounded-xl bg-yellow-100 border-2 border-yellow-400 shadow-md text-yellow-800 font-semibold flex items-center gap-3'>
                            <AlertTriangle className='w-5 h-5'/> 
                            Viewing **Future Training Month {viewMonth}**. You must complete Month **{data.currentMonth}** before accessing this content. Content is read-only.
                        </div>
                    )}
                    {!isCurrentView && isPastOrCurrent && (
                        <div className='p-4 rounded-xl bg-gray-100 border-2 border-gray-400 shadow-md text-gray-800 font-semibold flex items-center gap-3'>
                            <Clock className='w-5 h-5'/> 
                            Viewing **Historical Training Month {viewMonth}**. Content and Reflection are read-only.
                        </div>
                    )}

                    {/* CONTENT CARD (Always Renders) */}
                    <Card title={`Focus: ${monthPlan?.theme} (Training Month ${viewMonth})`} icon={TierIcon} accent='TEAL' className='border-l-8 border-[#47A88D]'>

                        {/* AI Monthly Briefing (Renders for all months) */}
                        <div className='mb-4 p-4 rounded-xl bg-[#002E47]/10 border border-[#002E47]/20'>
                            <h3 className='font-bold text-[#002E47] mb-1 flex items-center'><Activity className="w-4 h-4 mr-2 text-[#47A88D]" /> Monthly Executive Briefing</h3>
                            {briefingLoading && isCurrentView ? (
                                <p className='text-sm text-gray-600 flex items-center'><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500 mr-2 rounded-full"></div> Drafting advice...</p>
                            ) : (
                                <div className="prose max-w-none text-gray-700">
                                    <div dangerouslySetInnerHTML={{ __html: safeBriefing }} /> 
                                </div>
                            )}
                        </div>
                        
                        {/* Status / Difficulty (Renders for all months) */}
                        <div className='mb-4 text-sm border-t pt-4'>
                            <p className='font-bold text-[#002E47]'>Tier: {LEADERSHIP_TIERS[currentTierId]?.name}</p>
                            <p className='text-gray-600'>Target Difficulty: **{selfRating >= 8 ? 'Mastery' : selfRating >= 5 ? 'Core' : 'Intro'}** (Self-Rating: {selfRating}/10)</p>
                            {lowRatingFlag && (
                                <p className='font-semibold mt-1 flex items-center text-[#E04E1B]'>
                                    <AlertTriangle className='w-4 h-4 mr-1' /> HIGH RISK TIER: Prioritize Content Completion.
                                </p>
                            )}
                        </div>

                        <h3 className='text-xl font-bold text-[#002E47] border-t pt-4 mt-4'>Required Content Reps (Lessons)</h3>
                        <div className='space-y-3 mt-4'>
                            {requiredContent.map(item => {
                                const isCompleted = item.status === 'Completed';
                                const isToggling = togglingIds.has(item.id);
                                // UPGRADE 2: Action button text is always "View Content" or "Go to Practice" regardless of month status
                                const actionButtonText = (item.type === 'Role-Play' || item.type === 'Exercise' || item.type === 'Tool') ? 'Go to Practice' : 'View Content/Rep'; 

                                return (
                                    <div key={item.id} className='flex items-center justify-between p-3 bg-gray-50 rounded-xl shadow-sm'>
                                        <div className='flex flex-col'>
                                            <p className={`font-semibold text-sm ${isCompleted && isPastOrCurrent ? 'line-through text-gray-500' : 'text-[#002E47]'}`}>
                                                {item.title} ({item.type})
                                                {lowRatingFlag && <span className='ml-2 text-xs text-[#E04E1B] font-extrabold'>(CRITICAL)</span>}
                                            </p>
                                            <p className='text-xs text-gray-600'>~{item.duration} min | Difficulty: {item.difficulty}</p>
                                        </div>
                                        <div className='flex space-x-2'>
                                            <Button
                                                onClick={() => {
                                                    // UPGRADE 2: Allow viewing of ALL content in future, current, and past months
                                                    handleOpenContentModal(item);
                                                }}
                                                className='px-3 py-1 text-xs'
                                                variant='primary'
                                                disabled={false} // Always enabled for viewing
                                            >
                                                {actionButtonText}
                                            </Button>

                                            <Button
                                                onClick={() => toggleContent(item.id)}
                                                className={`px-3 py-1 text-xs transition-colors duration-300 ${isToggling ? 'opacity-50' : ''}`}
                                                variant={isCompleted ? 'secondary' : 'primary'}
                                                // UPGRADE 2: Only enabled for the current month.
                                                disabled={isSaving || isToggling || !isCurrentView}
                                            >
                                                {isToggling ? 'Updating...' : isCompleted ? 'Rep Completed ✓' : 'Mark Complete'}
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </Card>

                    {/* REFLECTION AND ADVANCEMENT CARDS (Only render if current month) */}
                    {isCurrentView && (
                    <>
                        <Card title="Monthly Reflection" icon={Lightbulb} accent="NAVY" className='bg-[#002E47]/10 border-2 border-[#002E47]/20'>
                            <p className="text-gray-700 text-sm mb-4">
                                Reflect on the growth you achieved this month. How did the content/reps impact your daily leadership behavior? (**Minimum 50 characters required**)
                            </p>
                            <textarea
                                value={localReflection} 
                                onChange={(e) => setLocalReflection(e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-[#47A88D] focus:border-[#47A88D] h-40"
                                placeholder="My reflection (required)..."
                                readOnly={!isCurrentView}
                            ></textarea>
                            {isCurrentView && (
                                <div className='flex justify-between items-center mt-1'>
                                    <p className={`text-xs ${localReflection.length < 50 ? 'text-[#E04E1B]' : 'text-[#47A88D]'}`}>
                                        {localReflection.length} / 50 characters written.
                                    </p>
                                    <span className={`text-xs font-semibold ${isSaving ? 'text-gray-500' : 'text-[#47A88D]'}`}>
                                        {isSaving ? 'Saving...' : 'Reflection ready'}
                                    </span>
                                </div>
                            )}
                            {!isCurrentView && <p className='text-xs text-gray-500 mt-2'>Reflection is read-only for this month.</p>}
                            
                            {isCurrentView && (
                                 <Button
                                    onClick={handleSaveReflection}
                                    disabled={isSaving || localReflection === monthPlan?.reflectionText || localReflection.length === 0}
                                    className='w-full mt-4 bg-[#002E47] hover:bg-gray-700'
                                >
                                    {isSaving ? 'Saving Reflection...' : 'Save Reflection'}
                                </Button>
                            )}
                        </Card>

                        <Card title="Recalibrate Skill Assessment" icon={Activity} accent='ORANGE' className='bg-[#E04E1B]/10 border-4 border-[#E04E1B]'>
                            <p className="text-gray-700 text-sm mb-4">
                                Feel like you've mastered this tier? Re-run your initial **Self-Ratings** to check your progress and generate an **accelerated, revised roadmap** to match your new skill level.
                            </p>
                            <Button
                                onClick={handleResetPlan} 
                                variant="secondary"
                                className='w-full bg-[#E04E1B] hover:bg-red-700'
                            >
                                <Target className='w-4 h-4 mr-2' /> Re-Run Assessment
                            </Button>
                        </Card>
                        
                        <Card title="Advance Roadmap" icon={CornerRightUp} accent='TEAL' className='bg-[#47A88D]/10 border-4 border-[#47A88D]'>
                            <p className='text-sm text-gray-700 mb-4'>
                                Once all content and your reflection are complete, lock in your progress and move to **Training Month {data.currentMonth + 1}** of your Roadmap (Progressive Overload).
                            </p>
                            <Button
                                onClick={handleCompleteMonth}
                                disabled={isSaving || !isReadyToComplete}
                                className='w-full bg-[#47A88D] hover:bg-[#47A88D]'
                            >
                                {isSaving ? 'Processing...' : `Complete Month ${data.currentMonth} and Advance`}
                            </Button>
                            {!allContentCompleted && (
                                <p className='text-[#E04E1B] text-xs mt-2'>* Finish all content reps first.</p>
                            )}
                            {allContentCompleted && localReflection.length < 50 && (
                                <p className='text-[#E04E1B] text-xs mt-2'>* Reflection required (50 chars min).</p>
                            )}
                        </Card>
                    </>
                    )} 
                </div>
            </div>
            
            <ContentDetailsModal 
                isVisible={isContentModalVisible} 
                onClose={() => setIsContentModalVisible(false)} 
                content={selectedContent}
            />

        </div>
    );
};


// --- Main Router (Simplified to only be the Tracker View) ---
export const RoadmapTrackerScreen = () => {
    // The service layer (useAppServices) still provides the data, but we use it directly.
    const services = useAppServices(); 
    const { pdpData, isLoading, error, navigate, updatePdpData } = services;

    // Local override state is no longer strictly needed but kept for safety/future dev
    const [pdpIsReady, setPdpIsReady] = useState(false);

    // CRITICAL: New logic for plan existence check
    const planExistsAndIsValid = useMemo(() => {
        const data = pdpData;
        return data !== null && Array.isArray(data?.plan) && data.plan.length > 0;
    }, [pdpData]);
    
    // Safety check: When initial data loads, set the ready flag
    useEffect(() => {
        if (pdpData !== undefined && !pdpIsReady) {
            setPdpIsReady(true);
        }
    }, [pdpData, pdpIsReady]);

    if (isLoading || !pdpIsReady) {
        return (
            <div className="p-4 sm:p-3 sm:p-4 lg:p-6 lg:p-8 min-h-screen flex items-center justify-center">
                <div className="flex flex-col items-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#47A88D] mb-3"></div>
                    <p className="text-[#47A88D] font-medium">Loading Roadmap Data...</p>
                </div>
            </div>
        );
    }
    
    if (error || !planExistsAndIsValid) {
        // If data is missing or invalid, prompt the user to go to the generator screen.
        return (
            <div className="p-3 sm:p-4 lg:p-6 md:p-10 min-h-screen" style={{ background: COLORS.BG, color: COLORS.TEXT }}>
                <div className='flex items-center gap-4 border-b-2 pb-2 mb-8' style={{borderColor: COLORS.RED+'30'}}>
                    <AlertTriangle className='w-10 h-10' style={{color: COLORS.RED}}/>
                    <h1 className="text-4xl font-extrabold" style={{ color: COLORS.NAVY }}>Roadmap Required</h1>
                </div>
                <p className="text-lg text-gray-600 mb-8 max-w-3xl">
                    Your personalized development plan has not been generated yet. Please complete the initial assessment to unlock the Roadmap Tracker.
                </p>
                <Button onClick={() => navigate('prof-dev-plan')} variant='secondary' className='bg-[#E04E1B] hover:bg-red-700'>
                    <Target className='w-5 h-5 mr-2' /> Go to Assessment Generator
                </Button>
            </div>
        );
    }

    // Tracker View: If the plan is valid, show the tracker dashboard
    const trackerProps = { data: pdpData, updatePdpData, navigate };
    return <TrackerDashboardView {...trackerProps} />;
};

export default RoadmapTrackerScreen;