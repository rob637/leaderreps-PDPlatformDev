// src/components/screens/CommunityScreen.jsx (Refactored for Consistency, Context)

import React, { useState, useEffect, useMemo, useCallback } from 'react';
// --- Core Services & Context ---
import { useAppServices } from '../../services/useAppServices.jsx'; // cite: useAppServices.jsx
import { membershipService } from '../../services/membershipService.js';
import contentService, { CONTENT_COLLECTIONS } from '../../services/contentService.js';
import { logWidthMeasurements } from '../../utils/debugWidth.js';
import { useFeatures } from '../../providers/FeatureProvider';
import WidgetRenderer from '../admin/WidgetRenderer';

// --- Icons ---
import {
    Users, MessageSquare, Briefcase, Bell, PlusCircle, User, ArrowLeft, Target, Filter, Clock,
    Star, CheckCircle, Award, Link, Send, Loader, Heart, X, UserPlus, Video
} from 'lucide-react';

/* =========================================================
   PALETTE & UI COMPONENTS (Standardized)
========================================================= */
// LEADERREPS.COM OFFICIAL CORPORATE COLORS - VERIFIED 11/14/25
const COLORS = {
  // === PRIMARY BRAND COLORS (from leaderreps.com) ===
  NAVY: '#002E47',        // Primary text, headers, navigation
  ORANGE: '#E04E1B',      // Call-to-action buttons, highlights, alerts  
  TEAL: '#47A88D',        // Secondary buttons, success states, accents
  LIGHT_GRAY: '#FCFCFA',  // Page backgrounds, subtle surfaces
  
  // === SEMANTIC MAPPINGS (using ONLY corporate colors) ===
  BLUE: '#002E47',        // Map to NAVY
  GREEN: '#47A88D',       // Map to TEAL  
  AMBER: '#E04E1B',       // Map to ORANGE
  RED: '#E04E1B',         // Map to ORANGE
  PURPLE: '#47A88D',      // Map to TEAL
  
  // === TEXT & BACKGROUNDS (corporate colors only) ===
  TEXT: '#002E47',        // NAVY for all text
  MUTED: '#47A88D',       // TEAL for muted text
  BG: '#FCFCFA',          // LIGHT_GRAY for backgrounds
  OFF_WHITE: '#FCFCFA',   // Same as BG
  SUBTLE: '#47A88D'       // TEAL for subtle elements
};

// --- Standardized UI Components (Matches Dashboard/Dev Plan) ---
const Button = ({ children, onClick, disabled = false, variant = 'primary', className = '', size = 'md', ...rest }) => { /* ... Re-use exact Button definition from Dashboard.jsx ... */
    let baseStyle = `inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-4 disabled:opacity-50 disabled:cursor-not-allowed`;
    if (size === 'sm') baseStyle += ' px-4 py-2 text-sm'; else if (size === 'lg') baseStyle += ' px-8 py-4 text-lg'; else baseStyle += ' px-6 py-3 text-base'; // Default 'md'
    if (variant === 'primary') baseStyle += ` bg-[${COLORS.TEAL}] text-white shadow-lg hover:opacity-90 focus:ring-[${COLORS.TEAL}]/50`;
    else if (variant === 'secondary') baseStyle += ` bg-[${COLORS.ORANGE}] text-white shadow-lg hover:opacity-90 focus:ring-[${COLORS.ORANGE}]/50`;
    else if (variant === 'outline') baseStyle += ` bg-[${COLORS.OFF_WHITE}] text-[${COLORS.TEAL}] border-2 border-[${COLORS.TEAL}] shadow-md hover:bg-[${COLORS.TEAL}]/10 focus:ring-[${COLORS.TEAL}]/50`;
    else if (variant === 'nav-back') baseStyle += ` bg-[${COLORS.LIGHT_GRAY}] text-[${COLORS.NAVY}] border border-[${COLORS.TEAL}] shadow-sm hover:opacity-90 focus:ring-[${COLORS.TEAL}]/50 px-4 py-2 text-sm`;
    else if (variant === 'ghost') baseStyle += ` bg-transparent text-[${COLORS.MUTED}] hover:bg-[${COLORS.LIGHT_GRAY}] focus:ring-[${COLORS.TEAL}]/50 px-3 py-1.5 text-sm`;
    if (disabled) baseStyle += ` bg-[${COLORS.LIGHT_GRAY}] text-[${COLORS.MUTED}] shadow-inner border-transparent opacity-50 hover:bg-[${COLORS.LIGHT_GRAY}]`;
    return (<button {...rest} onClick={onClick} disabled={disabled} className={`${baseStyle} ${className}`}>{children}</button>);
};
const Card = ({ children, title, icon: Icon, className = '', onClick, accent = 'NAVY' }) => { /* ... Re-use exact Card definition from Dashboard.jsx ... */
    const interactive = !!onClick; const Tag = interactive ? 'button' : 'div'; const accentColor = COLORS[accent] || COLORS.NAVY; const handleKeyDown = (e) => { if (interactive && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onClick?.(); } };
    return (
        <Tag {...(interactive ? { type: 'button' } : {})} role={interactive ? 'button' : undefined} tabIndex={interactive ? 0 : undefined} onKeyDown={handleKeyDown} className={`relative p-6 rounded-2xl border-2 shadow-xl hover:shadow-lg transition-all duration-300 text-left ${className}`} style={{ background: `linear-gradient(180deg, ${COLORS.OFF_WHITE}, ${COLORS.LIGHT_GRAY})`, borderColor: COLORS.SUBTLE, color: COLORS.NAVY }} onClick={onClick}>
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

/* =========================================================
   MOCK DATA & FALLBACKS
========================================================= */

// --- Mock Feed Data (Local Fallback - Replace with Service/API later) ---
// Note: Added `ownerName` to align with `user.name` usage
// const MOCK_FEED_FALLBACK = []; // Removed in favor of Firestore data

// --- Tier Metadata Fallback (If LEADERSHIP_TIERS fails to load) ---
const LEADERSHIP_TIERS_META_FALLBACK = { // cite: CommunityScreen.jsx (original)
    'All': { name: 'All Tiers', hex: COLORS.TEAL, color: 'teal-500' }, // Added color class for potential use
    'T1': { name: 'Lead Self', hex: COLORS.GREEN, color: 'green-500' },
    'T2': { name: 'Lead Work', hex: COLORS.BLUE, color: 'blue-500' },
    'T3': { name: 'Lead People', hex: COLORS.AMBER, color: 'amber-500' },
    'T4': { name: 'Lead Teams', hex: COLORS.ORANGE, color: 'orange-500' },
    'T5': { name: 'Lead Strategy', hex: COLORS.PURPLE, color: 'purple-500' },
    'System': { name: 'System Info', hex: COLORS.MUTED, color: 'gray-500' },
};


/* =========================================================
   SUB-COMPONENTS (Refactored for Consistency)
========================================================= */

/**
 * CommunityHomeView Component
 * Displays the main feed, filters, and the "Start Discussion" button.
 */
const CommunityHomeView = ({ setView, user, currentTierFilter, setCurrentTierFilter, filteredThreads, tierMeta }) => {
    // Determine which tier metadata to use (context or fallback)
    const safeTierMeta = useMemo(() => {
        // Add 'All' option dynamically if not present in context Tiers
        const tiers = tierMeta || LEADERSHIP_TIERS_META_FALLBACK; // cite: useAppServices.jsx, LEADERSHIP_TIERS_META_FALLBACK
        return tiers.All ? tiers : { All: { name: 'All Tiers', hex: COLORS.TEAL, color: 'teal-500' }, ...tiers };
    }, [tierMeta]);

    // --- Mock Handlers (Replace with actual interaction logic) ---
    const handleCommentClick = (threadId) => {
        // navigate('community-thread', { threadId }); // Example navigation
        alert(`Action: View details/comments for thread ${threadId}`);
    };
    const handleReactClick = (threadId) => {
        alert(`Action: Liked thread ${threadId}`);
    };

    return (
        <div className="space-y-4 sm:space-y-5 lg:space-y-6">
            {/* Header: Title & New Thread Button */}
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b pb-4" style={{ borderColor: COLORS.SUBTLE }}>
                <h2 className="text-xl sm:text-2xl font-bold" style={{ color: COLORS.NAVY }}>Community Feed ({safeTierMeta[currentTierFilter]?.name || 'All'})</h2>
                <Button onClick={() => setView('new-thread')} size="sm"> {/* Use standard Button */}
                    <PlusCircle className="w-4 h-4 mr-2" /> Start Discussion
                </Button>
            </div>

            {/* Tier Filter Bar */}
            <Card accent="TEAL" className="!p-3"> {/* Use Card for consistent container */}
                <div className="flex flex-wrap items-center gap-2">
                    <Filter className="w-5 h-5 flex-shrink-0" style={{ color: COLORS.NAVY }} />
                    <span className="text-sm font-semibold mr-2" style={{ color: COLORS.NAVY }}>Filter:</span>
                    {/* Map through available tiers from safeTierMeta */}
                    {Object.keys(safeTierMeta).map(tierId => {
                        const meta = safeTierMeta[tierId];
                        const isActive = currentTierFilter === tierId;
                        return (
                            <button
                                key={tierId}
                                onClick={() => setCurrentTierFilter(tierId)}
                                // Consistent button styling for filters
                                className={`px-3 py-1 text-[11px] font-bold rounded-full transition-all duration-200 border ${
                                    isActive
                                        ? 'text-white shadow-md scale-105' // Active style
                                        : 'text-gray-700 bg-white hover:bg-gray-100 border-gray-300' // Inactive style
                                }`}
                                style={{ backgroundColor: isActive ? meta.hex : undefined, borderColor: isActive ? meta.hex : undefined }}
                                aria-pressed={isActive} // Accessibility
                            >
                                {tierId === 'System' ? 'Admin' : tierId} {/* Shorten label */}
                            </button>
                        );
                    })}
                </div>
            </Card>

            {/* Thread List */}
            <div className="space-y-4">
                {/* Empty State */}
                {filteredThreads.length === 0 && (
                    <Card className="text-center border-dashed">
                        <p className="text-gray-500 italic py-6">
                            No posts match the "{safeTierMeta[currentTierFilter]?.name || currentTierFilter}" filter. {currentTierFilter !== 'All' && 'Try selecting "All".'}
                        </p>
                    </Card>
                )}
                {/* Render Threads */}
                {filteredThreads.map(thread => {
                    // Determine if the current user owns this thread
                    const isMyThread = user?.userId && thread.ownerId === user.userId; // Use userId // cite: useAppServices.jsx
                    // Get tier metadata for color/styling
                    const threadTierMeta = safeTierMeta[thread.tier] || { hex: COLORS.MUTED };

                    return (
                        // Use Card for each thread item
                        <Card key={thread.id} accent={isMyThread ? 'TEAL' : (thread.impact ? 'ORANGE' : 'NAVY')} className="transition-shadow duration-200 hover:shadow-lg">
                            {/* Thread Header */}
                            <div className="flex justify-between items-start mb-3 border-b pb-2" style={{ borderColor: COLORS.SUBTLE }}>
                                {/* User Info */}
                                <div className="flex items-center space-x-3">
                                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center font-bold text-xs text-gray-600 shrink-0">
                                        {thread.rep}
                                    </div>
                                    <div>
                                        <p className="font-bold text-md leading-tight" style={{ color: COLORS.NAVY }}>{thread.ownerName || 'User'}</p>
                                        <p className="text-xs text-gray-500">{thread.time}</p>
                                    </div>
                                </div>
                                {/* Tags/Badges */}
                                <div className='flex items-center gap-2 ml-2 flex-shrink-0'>
                                    {/* Pod Member Tag (Example - adjust logic based on real data) */}
                                    {thread.isPodMember && <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700`}>Pod</span>}
                                    {/* Impact Tag */}
                                    {thread.impact && <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full text-white bg-[${COLORS.ORANGE}] flex items-center gap-1`}><Star size={10} fill="currentColor"/> Impact</span>}
                                    {/* Tier Tag */}
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full`} style={{ background: `${threadTierMeta.hex}1A`, color: threadTierMeta.hex }}>{thread.tier}</span>
                                </div>
                            </div>

                            {/* Rep/Post Content */}
                            {thread.title && thread.title !== thread.content && <h4 className="font-bold text-sm mb-1" style={{ color: COLORS.NAVY }}>{thread.title}</h4>}
                            <p className="text-sm text-gray-800 mb-4 font-medium whitespace-pre-wrap">{thread.content}</p>

                            {/* Actions Footer */}
                            <div className="flex justify-between items-center text-xs pt-3 border-t" style={{ borderColor: COLORS.SUBTLE }}>
                                {/* Reactions & Comments */}
                                <div className="flex space-x-4">
                                    <button onClick={() => handleReactClick(thread.id)} className="flex items-center text-red-500 hover:text-red-700 transition-colors group">
                                        <Heart className="w-3.5 h-3.5 mr-1 group-hover:fill-current" /> {thread.reactions || 0}
                                    </button>
                                    <button onClick={() => handleCommentClick(thread.id)} className="flex items-center text-gray-500 hover:text-blue-600 transition-colors group">
                                        <MessageSquare className="w-3.5 h-3.5 mr-1" /> {thread.comments || 0}
                                    </button>
                                </div>
                                {/* View Details Link */}
                                <button onClick={() => handleCommentClick(thread.id)} className="font-semibold text-blue-600 hover:underline">View</button>
                            </div>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
};


/**
 * MyThreadsView Component
 * Displays threads started by the current user.
 */
const MyThreadsView = ({ user, allThreads }) => { // Pass allThreads from parent
    // Filter threads based on the current user's ID
    const myThreads = useMemo(() => {
        // Safety check for user and userId
        const userId = user?.userId; // cite: useAppServices.jsx
        if (!userId) return [];
        return (allThreads || []).filter(thread => thread.ownerId === userId);
    }, [user, allThreads]);

    return (
        // Use Card container
        <Card title="My Active Discussions" icon={Briefcase} accent="TEAL">
            {myThreads.length > 0 ? (
                <div className="space-y-3">
                    {myThreads.map(thread => (
                        // Simpler card for list view
                        <div key={thread.id} className="p-4 rounded-lg border-l-4 shadow-sm transition-shadow hover:shadow-md cursor-pointer" style={{ borderColor: COLORS.TEAL, backgroundColor: COLORS.OFF_WHITE }}
                             onClick={() => alert(`Maps to details for thread ${thread.id}`)} // Placeholder action
                        >
                            <h3 className="font-semibold text-md mb-1" style={{ color: COLORS.NAVY }}>{thread.title}</h3>
                            <p className="text-xs text-gray-600">
                                Tier: {thread.tier} | {thread.replies} Replies | Last active: {thread.lastActive}
                            </p>
                        </div>
                    ))}
                </div>
            ) : (
                // Consistent empty state message
                <p className="text-gray-500 italic text-sm text-center py-6">You haven't started any discussions yet. Post in the Community Feed!</p>
            )}
        </Card>
    );
};

/**
 * MentorshipView Component (Placeholder)
 * Provides information and actions related to mentorship.
 */
const MentorshipView = () => {
    const { navigate } = useAppServices(); // cite: useAppServices.jsx

    return (
        // Use Card container
        <Card title="Mentorship Network" icon={Users} accent="ORANGE">
            <p className="text-gray-600 text-sm mb-4">Connect with experienced leaders (T5 Visionaries) for personalized guidance and support.</p>
            {/* Placeholder content - Needs real implementation */}
            <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg text-center text-orange-700 font-medium italic mb-4">
                Mentorship matching feature coming soon...
            </div>
            {/* Button linking to another relevant section (e.g., Development Plan) */}
            <Button
                onClick={() => navigate('development-plan')} // Example navigation // cite: useAppServices.jsx
                variant="secondary" size="sm" className="w-full"
            >
                <User className="w-4 h-4 mr-2" /> Review Your Development Plan
            </Button>
        </Card>
    );
};

/**
 * NotificationsView Component (Placeholder)
 * Displays recent notifications for the user.
 */
const NotificationsView = () => (
    // Use Card container
    <Card title="Notifications" icon={Bell} accent="RED">
        <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar pr-2">
            {/* Placeholder Notifications */}
            {[
                {id: 1, text: "A **T5 Leader** replied to your thread on 'Delegation Challenges'."},
                {id: 2, text: "Your **Weekly Progress Summary** is ready for review."},
                {id: 3, text: "Sarah K. liked your post about 'Mindful Check-ins'."},
                {id: 4, text: "Reminder: **Office Hours** with Coach Support at 2 PM today."},
                {id: 5, text: "You earned the **'Consistent Contributor'** badge!"},
            ].map(notif => (
                <div key={notif.id} className="text-sm text-gray-700 border-b pb-2 last:border-b-0" style={{ borderColor: COLORS.SUBTLE }}>
                     <p dangerouslySetInnerHTML={{ __html: notif.text.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>') }} />
                     <span className="text-xs text-gray-400"> (Mock time)</span>
                </div>
            ))}
             {/* Empty State */}
             {/* <p className="text-gray-500 italic text-sm text-center py-6">No new notifications.</p> */}
        </div>
    </Card>
);


/**
 * NewThreadView Component
 * Form for creating a new discussion thread.
 */
const NewThreadView = ({ setView }) => {
    const { db, user } = useAppServices();
    const [title, setTitle] = useState('');
    const [context, setContext] = useState('');
    const [question, setQuestion] = useState('');
    const [tier, setTier] = useState('T2'); // Default tier
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    // Submission Handler
    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();
        if (!title || !context || !question || isSubmitting) return; // Basic validation

        setIsSubmitting(true);
        setIsSuccess(false);

        try {
            await contentService.addContent(db, CONTENT_COLLECTIONS.COMMUNITY, {
                title: title,
                content: `${context}\n\n${question}`, // Combine context and question for now as 'content'
                tier: tier,
                author: user?.name || 'Anonymous',
                authorId: user?.userId || 'anonymous',
                type: 'thread',
                context: context,
                question: question,
                reactions: 0,
                comments: 0,
                isPodMember: false, // Default
                impact: false // Default
            });
            setIsSuccess(true);
            // Navigate back to home after success message
            setTimeout(() => setView('home'), 2000);
        } catch (error) {
            console.error("Error posting thread:", error);
            alert("Failed to post thread. Please try again.");
        } finally {
            setIsSubmitting(false);
        }

    }, [title, context, question, tier, isSubmitting, setView, db, user]);

    return (
        // Use Card container
        <Card title="Start a New Discussion" icon={PlusCircle} accent="TEAL">
            {/* Back Button */}
            <button onClick={() => setView('home')} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 transition-colors">
                <X className="w-5 h-5" />
            </button>
            <p className="text-sm text-gray-700 mb-4 border-l-4 pl-3 italic" style={{ borderColor: COLORS.TEAL }}>
                Use the structure below for high-quality discussions and faster responses from peers and coaches.
            </p>

            {/* New Thread Form */}
            <form className="space-y-4" onSubmit={handleSubmit}>
                {/* Title */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">1. Thread Title / Topic <span className="text-red-500">*</span></label>
                    <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Applying SBI to high performers" className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[${COLORS.TEAL}]" required />
                </div>
                {/* Context */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">2. Situation & Context (1-2 sentences) <span className="text-red-500">*</span></label>
                    <textarea value={context} onChange={(e) => setContext(e.target.value)} placeholder="e.g., Giving feedback to a senior engineer who is technically strong but dismissive in code reviews." className="w-full p-3 border border-gray-300 rounded-lg h-20 text-sm focus:ring-2 focus:ring-[${COLORS.TEAL}]" required />
                </div>
                {/* Question */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">3. Specific Question / Challenge <span className="text-red-500">*</span></label>
                    <textarea value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="e.g., How can I deliver this feedback using SBI without demotivating them, focusing on the impact on team collaboration?" className="w-full p-3 border border-gray-300 rounded-lg h-24 text-sm focus:ring-2 focus:ring-[${COLORS.TEAL}]" required />
                </div>
                {/* Tier Selection */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">4. Primary Leadership Tier Focus</label>
                    {/* TODO: Populate options from LEADERSHIP_TIERS context */}
                    <select value={tier} onChange={(e) => setTier(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-[${COLORS.TEAL}]">
                        <option value="T1">T1: Lead Self</option>
                        <option value="T2">T2: Lead Work</option>
                        <option value="T3">T3: Lead People</option>
                        <option value="T4">T4: Lead Teams</option>
                        <option value="T5">T5: Lead Strategy</option>
                    </select>
                </div>

                {/* Success Message */}
                {isSuccess && (
                    <div className="flex items-center p-3 text-sm font-semibold text-white rounded-lg bg-[${COLORS.GREEN}] animate-pulse">
                        <CheckCircle className='w-4 h-4 mr-2'/> Thread Posted! Redirecting...
                    </div>
                )}

                {/* Submit Button */}
                <Button type="submit" disabled={isSubmitting || isSuccess} size="md" className="w-full">
                    {isSubmitting ? <Loader className="w-5 h-5 mr-2 animate-spin"/> : <Send className="w-4 h-4 mr-2" />}
                    {isSubmitting ? 'Posting Thread...' : 'Post Discussion'}
                </Button>
            </form>
        </Card>
    );
};


/* =========================================================
   MAIN COMPONENT: CommunityScreen (Router)
========================================================= */

const CommunityScreen = ({ simulatedTier }) => {
    // --- Consume Services ---
    const { db, user, navigate, LEADERSHIP_TIERS, featureFlags, isAdmin, membershipData, isLoading: isAppLoading, error: appError } = useAppServices(); // cite: useAppServices.jsx
    const { isFeatureEnabled, getFeatureOrder } = useFeatures();
    // Use safeUser structure even if user context is briefly null during auth changes
    const safeUser = useMemo(() => user || { userId: null, name: 'Guest' }, [user]); // cite: useAppServices.jsx (provides user)
    
    // Check membership access - use simulatedTier if provided, otherwise use actual membership
    const currentTier = simulatedTier || membershipData?.currentTier || user?.membershipTier || 'free';
    const hasCommunityAccess = membershipService.canAccessFeature(currentTier, 'communitySubmit');
    
    console.log('🏘️ [CommunityScreen] Tier check:', {
        simulatedTier,
        membershipDataTier: membershipData?.currentTier,
        userMembershipTier: user?.membershipTier,
        computedCurrentTier: currentTier,
        hasCommunityAccess
    });

    // --- Local State ---
    const [view, setView] = useState('home'); // Controls which sub-view is displayed
    const [currentTierFilter, setCurrentTierFilter] = useState('All'); // Filter for the home feed
    const [allThreads, setAllThreads] = useState([]);
    const [isLoadingThreads, setIsLoadingThreads] = useState(true);

    // Effect to set initial view based on enabled features
    useEffect(() => {
        if (view === 'home' && !isFeatureEnabled('community-feed')) {
            // If home is disabled, try to find the first enabled feature
            if (isFeatureEnabled('my-discussions')) setView('my-threads');
            else if (isFeatureEnabled('mastermind')) setView('mentorship');
            else if (isFeatureEnabled('live-events')) setView('events');
            // If nothing is enabled, it will stay on 'home' but render the disabled message
        }
    }, [isFeatureEnabled, view]);

    // --- Determine Data Sources ---
    // Use LEADERSHIP_TIERS from context if available, otherwise use fallback
    const tierMeta = useMemo(() => LEADERSHIP_TIERS || LEADERSHIP_TIERS_META_FALLBACK, [LEADERSHIP_TIERS]); // cite: useAppServices.jsx, LEADERSHIP_TIERS_META_FALLBACK
    
    // Fetch Threads
    useEffect(() => {
        const fetchThreads = async () => {
            setIsLoadingThreads(true);
            try {
                const threads = await contentService.getContent(db, CONTENT_COLLECTIONS.COMMUNITY);
                // Map to expected format if needed
                const mappedThreads = threads.map(t => ({
                    ...t,
                    ownerName: t.author || t.ownerName,
                    ownerId: t.authorId || t.ownerId,
                    rep: t.rep || (t.author ? t.author.substring(0, 2).toUpperCase() : 'U'), 
                    content: t.content || t.title, // Fallback to title if content missing
                    time: t.createdAt?.toDate ? t.createdAt.toDate().toLocaleDateString() : 'Just now'
                }));
                setAllThreads(mappedThreads);
            } catch (error) {
                console.error("Error fetching threads:", error);
            } finally {
                setIsLoadingThreads(false);
            }
        };
        
        if (db) {
            fetchThreads();
        }
    }, [db]);

    // --- Effect to scroll to top when view changes ---
    useEffect(() => { 
        window.scrollTo({ top: 0, behavior: 'smooth' }); 
        logWidthMeasurements('Community');
    }, [view]);

    // --- Filter Threads for Home View ---
    const filteredThreads = useMemo(() => {
        // Filter based on selected tier, or show all non-system if 'All'
        return allThreads.filter(thread =>
            thread.tier !== 'System' && // Always exclude system messages from main feed
            (currentTierFilter === 'All' || thread.tier === currentTierFilter)
        );
    }, [currentTierFilter, allThreads]);

    // --- Sidebar Navigation Items ---
    const navItems = useMemo(() => {
        const allItems = [
            { featureId: 'community-feed', screen: 'home', label: 'Community Feed', icon: MessageSquare },
            { featureId: 'my-discussions', screen: 'my-threads', label: 'My Discussions', icon: Briefcase },
            { featureId: 'mastermind', screen: 'mentorship', label: 'Mastermind Groups', icon: Users },
            { featureId: 'live-events', screen: 'events', label: 'Live Events', icon: Video },
        ];

        const sortedItems = allItems
            .filter(item => isFeatureEnabled(item.featureId))
            .sort((a, b) => {
                const orderA = getFeatureOrder(a.featureId);
                const orderB = getFeatureOrder(b.featureId);
                return orderA - orderB;
            });

        return [
            ...sortedItems,
            { screen: 'notifications', label: 'Notifications', icon: Bell, notify: true }
        ];
    }, [isFeatureEnabled, getFeatureOrder]);

    // --- Scope for Widgets ---
    const scope = {
        // State
        view, setView,
        currentTierFilter, setCurrentTierFilter,
        allThreads, filteredThreads,
        isLoadingThreads,
        
        // Data
        user: safeUser,
        tierMeta,
        navItems,
        hasCommunityAccess,
        
        // Utils
        navigate,
        isFeatureEnabled,
        COLORS,
        
        // Icons
        Users, MessageSquare, Briefcase, Bell, PlusCircle, User, ArrowLeft, Target, Filter, Clock,
        Star, CheckCircle, Award, Link, Send, Loader, Heart, X, UserPlus, Video
    };

    // --- Render Logic ---
    const renderContent = () => {
        switch(view) {
            case 'my-threads':
                return isFeatureEnabled('my-discussions') ? (
                    <MyThreadsView user={safeUser} allThreads={allThreads} />
                ) : null;
            
            case 'mastermind':
                return isFeatureEnabled('mastermind') ? (
                    <Card title="Mastermind Groups" icon={Users}>
                        <div className="p-8 text-center text-gray-500">
                            <h3 className="text-lg font-bold mb-2">Mastermind Groups</h3>
                            <p>Join a small group of peers for focused growth and accountability.</p>
                            <p className="text-xs mt-4 text-gray-400">(Feature Module Placeholder)</p>
                        </div>
                    </Card>
                ) : null;

            case 'mentorship':
                return isFeatureEnabled('mentor-match') ? (
                    <Card title="Mentor Match" icon={UserPlus}>
                        <div className="p-8 text-center text-gray-500">
                            <h3 className="text-lg font-bold mb-2">Mentor Match</h3>
                            <p>Find a mentor or become one to accelerate your leadership journey.</p>
                            <p className="text-xs mt-4 text-gray-400">(Feature Module Placeholder)</p>
                        </div>
                    </Card>
                ) : null;

            case 'events':
                return isFeatureEnabled('live-events') ? (
                    <Card title="Live Events" icon={Video}>
                        <div className="p-8 text-center text-gray-500">
                            <h3 className="text-lg font-bold mb-2">Live Events</h3>
                            <p>Register for upcoming webinars, workshops, and live Q&A sessions.</p>
                            <p className="text-xs mt-4 text-gray-400">(Feature Module Placeholder)</p>
                        </div>
                    </Card>
                ) : null;

            case 'notifications':
                return <NotificationsView />;
            case 'new-thread':
                return <NewThreadView setView={setView} />;
            case 'home':
            default:
                return isFeatureEnabled('community-feed') ? (
                    <CommunityHomeView
                        setView={setView}
                        user={safeUser} // Pass safeUser
                        currentTierFilter={currentTierFilter}
                        setCurrentTierFilter={setCurrentTierFilter}
                        filteredThreads={filteredThreads} // Pass filtered data
                        tierMeta={tierMeta} // Pass tier metadata
                    />
                ) : (
                    <WidgetRenderer widgetId="community-feed-disabled" scope={scope} />
                );
        }
    };

    // --- Main Render ---
    // Feature Flag Check for entire screen (bypass for admins)
    if (!isAdmin && !featureFlags?.enableCommunity) { // cite: useAppServices.jsx
         return (
             <div className="p-4 sm:p-3 sm:p-4 lg:p-6 lg:p-8 text-center text-gray-500">
                 <Users className="w-12 h-12 mx-auto mb-4 text-gray-400"/>
                 <h1 className="text-xl sm:text-2xl font-bold mb-2">Community Hub Unavailable</h1>
                 <p>This feature is currently disabled.</p>
                 <Button onClick={() => navigate('dashboard')} variant="outline" size="sm" className="mt-4">Back to Arena</Button>
             </div>
         );
    }
    // Loading/Error States
    if (isAppLoading) return <LoadingSpinner message="Loading Community Hub..." />;
    // Note: appError check might be redundant if handled globally, but included for robustness
    if (appError) return <ConfigError message={`Failed to load Community Hub: ${appError.message}`} />;

    return (
        <div className="page-corporate container-corporate animate-corporate-fade-in">
            <div className="content-full">
            <div>
            {/* Back Button */}
            <div className="flex items-center gap-2 mb-6 text-gray-600 hover:text-gray-800 cursor-pointer transition-colors" onClick={() => navigate('dashboard')}>
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm font-medium">Back to Dashboard</span>
            </div>

            {/* Header */}
            <div className="text-center mb-12">
                <div className="flex items-center justify-center gap-2 mb-4">
                    <Users className='w-8 h-8' style={{color: COLORS.TEAL}}/>
                    <h1 className="corporate-heading-xl" style={{ color: COLORS.NAVY }}>Community</h1>
                    <Users className='w-8 h-8' style={{color: COLORS.TEAL}}/>
                </div>
                {!hasCommunityAccess && (
                    <span className="inline-block bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-semibold mb-4">Requires Premium</span>
                )}
                <p className="corporate-text-body text-gray-600 mx-auto px-4">Connect, share insights, and grow with fellow leaders.</p>
            </div>

            {/* Main Layout Grid (Sidebar + Content) */}
            <div className={`grid grid-cols-1 lg:grid-cols-6 gap-3 ${!hasCommunityAccess ? 'opacity-60 pointer-events-none' : ''}`}>
                {/* Sidebar Navigation */}
                <aside className="lg:col-span-1 space-y-4 lg:sticky lg:top-3 sm:p-4 lg:p-6 self-start"> {/* Make sidebar sticky */}
                    <WidgetRenderer widgetId="community-sidebar" scope={scope} />
                </aside>

                {/* Main Content Area */}
                <main className="lg:col-span-5">
                    {renderContent()}
                </main>
            </div>
            
            {/* Unlock Section for Free Users */}
            {!hasCommunityAccess && (
                <div className="mt-8 bg-white rounded-2xl border-2 shadow-lg" style={{ borderColor: COLORS.TEAL }}>
                    
                    <div className="relative z-10 p-8 text-center">
                        <h3 className="text-2xl font-bold mb-4" style={{ color: COLORS.NAVY }}>
                            Unlock Leadership Community
                        </h3>
                        
                        <p className="text-lg text-gray-700 mb-6">
                            Join our community of leaders sharing insights and supporting each other's growth through meaningful discussions.
                        </p>
                        
                        <div className="text-center mb-6">
                            <span className="inline-block bg-orange-100 text-orange-800 px-4 py-2 rounded-full text-sm font-semibold">Requires Premium</span>
                        </div>
                        
                        <button
                            onClick={() => navigate('membership-upgrade')}
                            className="bg-gradient-to-r from-teal-600 to-navy-600 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300"
                        >
                            Upgrade Now
                        </button>
                        
                        <p className="text-xs text-gray-500 mt-3">Connect with leaders who are growing just like you</p>
                    </div>
                </div>
            )}
            </div>
            </div>
        </div>
    );
};

export default CommunityScreen;