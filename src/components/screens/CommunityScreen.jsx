// src/components/screens/CommunityScreen.jsx (Refactored for Consistency, Context)

import React, { useState, useEffect, useMemo, useCallback } from 'react';
// --- Core Services & Context ---
import { useAppServices } from '../../services/useAppServices.jsx'; // cite: useAppServices.jsx

// --- Icons ---
import {
    Users, MessageSquare, Briefcase, Bell, PlusCircle, User, ArrowLeft, Target, Settings, Filter, Clock,
    Star, CheckCircle, Award, Link, Send, Loader, Heart // Added Award, Link, Send, Loader
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
    <div className="min-h-screen flex items-center justify-center" style={{ background: COLORS.BG }}> <div className="flex flex-col items-center"> <Loader className="animate-spin h-12 w-12 mb-3" style={{ color: COLORS.TEAL }} /> <p className="font-semibold" style={{ color: COLORS.NAVY }}>{message}</p> </div> </div>
);

/* =========================================================
   MOCK DATA & FALLBACKS
========================================================= */

// --- Mock Feed Data (Local Fallback - Replace with Service/API later) ---
// Note: Added `ownerName` to align with `user.name` usage
const MOCK_FEED_FALLBACK = [ // cite: CommunityFeed.jsx (original)
    { id: 't1', ownerName: 'Alex H.', ownerId: 'user-alex-h', rep: 'Used CLEAR framework in 1:1. Felt structured.', tier: 'T2', time: '15m ago', reactions: 8, comments: 2, isPodMember: true, impact: false },
    { id: 't2', ownerName: 'System Admin', ownerId: 'system', rep: 'New Rep Streak Coins unlocked! Keep up the great work.', tier: 'System', time: '1h ago', reactions: 25, comments: 5, isPodMember: false, impact: false },
    { id: 't3', ownerName: 'Sarah K.', ownerId: 'user-sarah-k', rep: 'Practiced mindful check-in before the QBR. Helped stay centered.', tier: 'T1', time: '3h ago', reactions: 12, comments: 1, isPodMember: true, impact: false },
    { id: 't4', ownerName: 'Justin M.', ownerId: 'user-justin-m', rep: 'Retired a rep (Delegation SOP). Shifting focus to T5 Strategic Alignment.', tier: 'T5', time: 'Yesterday', reactions: 18, comments: 3, isPodMember: true, impact: true },
    { id: 't5', ownerName: 'Coach Support', ownerId: 'system-coach', rep: 'Reminder: Office Hours today at 2 PM ET for T3 Coaching skills.', tier: 'System', time: 'Yesterday', reactions: 9, comments: 0, isPodMember: false, impact: false },
];

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
        console.log(`[CommunityHome] Navigate to comment thread for ID: ${threadId}`);
        // navigate('community-thread', { threadId }); // Example navigation
        alert(`Action: View details/comments for thread ${threadId}`);
    };
    const handleReactClick = (threadId) => {
        console.log(`[CommunityHome] Reacted to thread ID: ${threadId}`);
        alert(`Action: Liked thread ${threadId}`);
    };

    return (
        <div className="space-y-6">
            {/* Header: Title & New Thread Button */}
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b pb-4" style={{ borderColor: COLORS.SUBTLE }}>
                <h2 className="text-2xl font-bold" style={{ color: COLORS.NAVY }}>Community Feed ({safeTierMeta[currentTierFilter]?.name || 'All'})</h2>
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
                                    <User className="w-5 h-5 text-gray-400 flex-shrink-0" />
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
                            <p className="text-sm text-gray-800 mb-4 font-medium italic">"{thread.rep}"</p>

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
    const { user } = useAppServices(); // Get user info for potential future use // cite: useAppServices.jsx
    const [title, setTitle] = useState('');
    const [context, setContext] = useState('');
    const [question, setQuestion] = useState('');
    const [tier, setTier] = useState('T2'); // Default tier
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    // Mock Submission Handler (Replace with API call)
    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();
        if (!title || !context || !question || isSubmitting) return; // Basic validation

        setIsSubmitting(true);
        setIsSuccess(false);
        console.log("[NewThread] Submitting thread:", { title, context, question, tier });

        // --- MOCK API CALL ---
        await new Promise(resolve => setTimeout(resolve, 1000));
        // --- END MOCK ---

        // In a real app, you would send this data to your backend/Firestore
        // Example: addDoc(collection(db, 'community_threads'), { title, context, question, tier, ownerId: user.userId, ownerName: user.name, createdAt: serverTimestamp(), ... });

        setIsSubmitting(false);
        setIsSuccess(true);
        // Navigate back to home after success message
        setTimeout(() => setView('home'), 2000);

    }, [title, context, question, tier, isSubmitting, setView]); // Dependencies // Removed user dependency for now

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

const CommunityScreen = () => {
    // --- Consume Services ---
    const { user, navigate, LEADERSHIP_TIERS, featureFlags, isLoading: isAppLoading, error: appError } = useAppServices(); // cite: useAppServices.jsx
    // Use safeUser structure even if user context is briefly null during auth changes
    const safeUser = useMemo(() => user || { userId: null, name: 'Guest' }, [user]); // cite: useAppServices.jsx (provides user)

    // --- Local State ---
    const [view, setView] = useState('home'); // Controls which sub-view is displayed
    const [currentTierFilter, setCurrentTierFilter] = useState('All'); // Filter for the home feed

    // --- Determine Data Sources ---
    // Use LEADERSHIP_TIERS from context if available, otherwise use fallback
    const tierMeta = useMemo(() => LEADERSHIP_TIERS || LEADERSHIP_TIERS_META_FALLBACK, [LEADERSHIP_TIERS]); // cite: useAppServices.jsx, LEADERSHIP_TIERS_META_FALLBACK
    // Use mock feed data for now. Replace with fetched data later.
    // TODO: Fetch real thread data, potentially filter based on user's pod
    const allThreads = useMemo(() => MOCK_FEED_FALLBACK, []); // cite: MOCK_FEED_FALLBACK

    // --- Effect to scroll to top when view changes ---
    useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }, [view]);

    // --- Filter Threads for Home View ---
    const filteredThreads = useMemo(() => {
        console.log(`[CommunityScreen] Filtering threads for: ${currentTierFilter}`);
        // Filter based on selected tier, or show all non-system if 'All'
        return allThreads.filter(thread =>
            thread.tier !== 'System' && // Always exclude system messages from main feed
            (currentTierFilter === 'All' || thread.tier === currentTierFilter)
        );
    }, [currentTierFilter, allThreads]);

    // --- Sidebar Navigation Items ---
    const navItems = useMemo(() => [
        { screen: 'home', label: 'Community Feed', icon: MessageSquare },
        { screen: 'my-threads', label: 'My Discussions', icon: Briefcase },
        // Conditionally include Mentorship based on flag
        ...(featureFlags?.enableMentorship ? [{ screen: 'mentorship', label: 'Mentorship Network', icon: Users }] : []), // Example flag // cite: useAppServices.jsx
        { screen: 'notifications', label: 'Notifications', icon: Bell, notify: true }, // Mock notification indicator
    ], [featureFlags]); // Rebuild if flags change

    // --- Render Logic ---
    const renderContent = () => {
        switch(view) {
            case 'my-threads':
                return <MyThreadsView user={safeUser} allThreads={allThreads} />; // Pass safeUser and allThreads
            case 'mentorship':
                 // Only render if feature is enabled (redundant check if nav item is hidden, but safe)
                return featureFlags?.enableMentorship ? <MentorshipView /> : <CommunityHomeView /* Fallback or redirect */ />;
            case 'notifications':
                return <NotificationsView />; // Placeholder
            case 'new-thread':
                return <NewThreadView setView={setView} />; // Pass setter
            case 'home':
            default:
                return <CommunityHomeView
                    setView={setView}
                    user={safeUser} // Pass safeUser
                    currentTierFilter={currentTierFilter}
                    setCurrentTierFilter={setCurrentTierFilter}
                    filteredThreads={filteredThreads} // Pass filtered data
                    tierMeta={tierMeta} // Pass tier metadata
                />;
        }
    };

    // --- Main Render ---
    // Feature Flag Check for entire screen
    if (!featureFlags?.enableCommunity) { // cite: useAppServices.jsx
         return (
             <div className="p-8 text-center text-gray-500">
                 <Users className="w-12 h-12 mx-auto mb-4 text-gray-400"/>
                 <h1 className="text-2xl font-bold mb-2">Community Hub Unavailable</h1>
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
        // Consistent page structure and padding
        <div className="p-6 md:p-8 lg:p-10 min-h-screen" style={{ background: COLORS.BG }}>
            {/* Header */}
            <header className='flex items-center gap-4 border-b-2 pb-3 mb-8' style={{borderColor: COLORS.NAVY+'30'}}>
                <Users className='w-10 h-10 flex-shrink-0' style={{color: COLORS.TEAL}}/>
                <div>
                     <h1 className="text-3xl md:text-4xl font-extrabold" style={{ color: COLORS.NAVY }}>Leadership Community</h1>
                     <p className="text-md text-gray-600 mt-1">(Community Pillar 3)</p>
                </div>
            </header>

            {/* Main Layout Grid (Sidebar + Content) */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Sidebar Navigation */}
                <aside className="lg:col-span-1 space-y-4 lg:sticky lg:top-6 self-start"> {/* Make sidebar sticky */}
                    <h3 className="text-xs font-extrabold uppercase tracking-wider px-3 py-1 rounded text-gray-500 bg-gray-100 border border-gray-200">
                        Community Channels
                    </h3>
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = view === item.screen;
                        // Use Purple for Notifications icon, Navy otherwise
                        const iconColor = item.screen === 'notifications' ? COLORS.ORANGE : COLORS.NAVY;

                        return (
                            <button
                                key={item.screen}
                                onClick={() => setView(item.screen)}
                                // Consistent button styling for sidebar nav
                                className={`flex items-center w-full p-3 rounded-xl font-semibold text-sm relative transition-all duration-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[${COLORS.TEAL}] ${
                                    isActive
                                        ? `bg-white text-[${COLORS.NAVY}] ring-1 ring-[${COLORS.TEAL}] shadow-md` // Active style
                                        : `text-gray-700 bg-white hover:bg-gray-50 hover:shadow-md border border-gray-200` // Inactive style
                                }`}
                            >
                                <Icon className="w-5 h-5 mr-3 flex-shrink-0" style={{ color: isActive ? COLORS.TEAL : iconColor }} />
                                <span className="flex-1 text-left truncate">{item.label}</span>
                                {/* Notification Indicator */}
                                {item.notify && <div className={`h-2 w-2 rounded-full ml-auto`} style={{ background: COLORS.ORANGE }} />}
                            </button>
                        );
                    })}
                     {/* Settings Link (Optional) */}
                     <Button onClick={() => navigate('app-settings')} variant="ghost" size="sm" className="w-full justify-start text-gray-500 hover:text-gray-700">
                        <Settings className="w-4 h-4 mr-2"/> Community Settings
                     </Button>
                </aside>

                {/* Main Content Area */}
                <main className="lg:col-span-3">
                    {renderContent()}
                </main>
            </div>
        </div>
    );
};

export default CommunityScreen;