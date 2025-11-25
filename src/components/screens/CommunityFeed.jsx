// src/components/screens/CommunityFeed.jsx (Refactored for Consistency)

import React, { useState, useMemo, useEffect } from 'react';
// --- Core Services & Context ---
import { useAppServices } from '../../services/useAppServices.jsx'; // cite: useAppServices.jsx

// --- Icons ---
import { Users, Send, MessageSquare, Heart, CornerRightUp, Award, Link, Settings, User } from 'lucide-react';

// --- UI Components ---
import { Button, LoadingState } from '../ui';

/* =========================================================
   MOCK DATA (Local Fallback - Replace with Service/API)
========================================================= */
// Mock data for the feed items
const MOCK_FEED = [
    { id: 1, user: 'Alex H.', rep: 'Successfully used the CLEAR coaching framework in my 1:1 this morning.', tier: 'T4: People Dev', time: '5m ago', reactions: 8, comments: 2, isPod: true },
    { id: 2, user: 'Team Admin', rep: 'New LeaderRep Streak Coin Unlocked! Check your profile for details.', tier: 'Gamification', time: '2h ago', reactions: 15, comments: 10, isPod: false },
    { id: 3, user: 'Sarah K.', rep: 'Conducted a 10-minute mindful check before the quarterly review.', tier: 'T1: Self-Awareness', time: '3h ago', reactions: 4, comments: 0, isPod: true },
    { id: 4, user: 'Justin M.', rep: 'Retired a rep (SOP creation). Shifting focus to T3: Strategic Alignment.', tier: 'Weekly Review', time: 'Yesterday', reactions: 7, comments: 1, isPod: true },
];

// Mock data for the leaderboard
const MOCK_LEADERBOARD = [
    { rank: 1, name: 'Alex H.', streak: 12, reps: 68 },
    { rank: 2, name: 'Sarah K.', streak: 9, reps: 55 },
    { rank: 3, name: 'Justin M.', streak: 7, reps: 42 },
];

/* =========================================================
   SUB-COMPONENT: RepFeedItem
========================================================= */

/**
 * RepFeedItem Component
 * Renders a single item in the community feed.
 * Includes user info, rep text, actions (react, comment), and tags.
 */
const RepFeedItem = ({ item }) => {
    // --- Mock Handlers (Replace with actual interaction logic) ---
    const handleComment = () => {
        // Example navigation (route needs to be defined in App.jsx)
        // navigate('community-thread', { feedItemId: item.id });
        // For now, just show an alert
        console.log('Comment clicked');
    };

    const handleReact = (item) => {
        // For now, just show an alert
        console.log('React clicked');
    };

    return (
        // Use consistent card styling from Card component (applied manually here for structure)
        <div className="p-4 bg-white border border-gray-200 rounded-xl shadow-md transition-shadow duration-200 hover:shadow-lg">
            {/* Header: User Info & Tags */}
            <div className="flex justify-between items-start mb-3 border-b border-gray-200 pb-2">
                {/* User Avatar (Placeholder) & Name/Time */}
                <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center"> {/* Placeholder Avatar */}
                        <User className="w-4 h-4 text-gray-500" />
                    </div>
                    <div>
                        <p className="font-bold text-sm text-corporate-navy">{item.user}</p>
                        <p className="text-xs text-gray-500">{item.time}</p>
                    </div>
                </div>
                {/* Pod Tag */}
                {item.isPod && (
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 flex items-center gap-1`}>
                        <Users size={12}/> Pod
                    </span>
                )}
            </div>

            {/* Rep/Post Content */}
            <p className="text-sm text-gray-800 mb-4 font-medium italic">"{item.rep}"</p>

            {/* Footer: Actions & Tier */}
            <div className="flex justify-between items-center text-xs pt-3 border-t border-gray-200">
                {/* Actions: React & Comment */}
                <div className="flex space-x-4">
                    <button onClick={handleReact} className="flex items-center text-red-500 hover:text-red-700 transition-colors group" aria-label={`Like post by ${item.user}`}>
                        <Heart className="w-3.5 h-3.5 mr-1 group-hover:fill-current" /> {item.reactions}
                    </button>
                    <button onClick={handleComment} className="flex items-center text-gray-500 hover:text-blue-600 transition-colors group" aria-label={`Comment on post by ${item.user}`}>
                        <MessageSquare className="w-3.5 h-3.5 mr-1" /> {item.comments}
                    </button>
                </div>
                {/* Tier Tag */}
                <span className={`text-[10px] font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded`}>{item.tier}</span>
            </div>
        </div>
    );
};

/* =========================================================
   MAIN COMPONENT: CommunityFeedScreen
========================================================= */

/**
 * CommunityFeedScreen Component (Placeholder/Mock)
 * Displays the main community activity feed, leaderboard, and quick share functionality.
 * Currently uses mock data. Should be updated to fetch/post real data.
 */
const CommunityFeedScreen = () => {
    // --- Consume Services ---
    const { navigate, user, featureFlags, isLoading: isAppLoading, error: appError } = useAppServices(); // cite: useAppServices.jsx
    const safeUser = useMemo(() => user || { userId: null, name: 'Guest' }, [user]); // Safe user object

    // --- Local State ---
    const [feedFilter, setFeedFilter] = useState('pod'); // Filter state: 'pod' or 'all'
    const [quickShareText, setQuickShareText] = useState(''); // Text for quick share input
    const [isSharing, setIsSharing] = useState(false); // Loading state for quick share

    // --- Effect for scrolling ---
    useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }, []);

    // --- Filter Feed Data (Memoized) ---
    // Uses local MOCK_FEED for now
    const filteredFeed = useMemo(() => {
        if (feedFilter === 'pod') return MOCK_FEED.filter(item => item.isPod);
        return MOCK_FEED; // 'all' filter shows everything (including non-pod)
    }, [feedFilter]);

    // --- Mock Quick Share Handler ---
    const handleQuickShare = async () => {
        const textToShare = quickShareText.trim();
        if (!textToShare || isSharing) return;

        setIsSharing(true);
        // --- MOCK API CALL ---
        await new Promise(resolve => setTimeout(resolve, 800));
        // --- END MOCK ---

        // TODO: Replace with actual API call to post to the feed
        // Example: addDoc(collection(db, 'community_feed'), { userId: safeUser.userId, userName: safeUser.name, text: textToShare, isPod: true, createdAt: serverTimestamp(), ... });

        setQuickShareText(''); // Clear input
        setIsSharing(false);
        // TODO: Optionally refresh the feed after posting
    };

    // --- Render Logic ---
    // Feature Flag Check
        if (!featureFlags?.enableCommunity) {
      return (
        <div className="p-4 sm:p-3 sm:p-4 lg:p-6 lg:p-8 text-center">
          <h2 className="text-xl sm:text-2xl font-bold mb-4">Community Feature Disabled</h2>
          <p>This feature is currently not enabled. Please contact support for more information.</p>
        </div>
      );
    }
    // Loading/Error States
    if (isAppLoading) return <LoadingState fullPage message="Loading Community Feed..." />;
    if (appError) return <div className="p-4 text-red-500">Failed to load Community Feed: {appError.message}</div>;

    return (
        // Consistent page structure and padding
        <div className="p-6 md:p-4 sm:p-3 sm:p-4 lg:p-6 lg:p-8 lg:p-10 space-y-4 sm:space-y-6 lg:space-y-8 min-h-screen bg-[#F9FAFB]">
            {/* Header */}
            <header className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-gray-200 pb-4">
                <h1 className="text-xl sm:text-2xl sm:text-3xl md:text-4xl font-extrabold flex items-center gap-3 text-corporate-navy">
                    <Users size={32} className="text-corporate-navy" /> Accountability Pod Feed
                </h1>
                {/* Link to Community Settings */}
                <Button onClick={() => navigate('app-settings', { section: 'community' })} variant="outline" size="sm">
                   <Settings size={16} className='mr-2'/> Pod Settings
                </Button>
            </header>

            {/* Main Layout Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:p-3 sm:p-4 lg:p-6 lg:p-8">

                {/* Left Column: Leaderboard & Quick Share */}
                <aside className="lg:col-span-1 space-y-4 sm:space-y-5 lg:space-y-6 lg:sticky lg:top-3 sm:p-4 lg:p-6 self-start"> {/* Sticky sidebar */}
                    {/* Leaderboard Card */}
                    <div className="p-3 sm:p-4 lg:p-6 bg-white border border-gray-200 rounded-xl shadow-lg">
                        <h2 className="text-lg font-bold mb-4 flex items-center gap-2 border-b border-gray-200 pb-2 text-corporate-navy">
                            <Award className="w-5 h-5 text-amber-500" /> Rep Streak Leaderboard (Pod)
                        </h2>
                        {MOCK_LEADERBOARD.map((leader, index) => (
                            <div key={leader.rank} className={`flex items-center py-2 border-b border-gray-200 last:border-b-0 ${index < 3 ? '' : 'opacity-70'}`}>
                                {/* Rank */}
                                <span className={`font-extrabold w-6 text-center text-sm ${
                                    index === 0 ? 'text-amber-500' : index === 1 ? 'text-gray-500' : index === 2 ? 'text-orange-700' : 'text-gray-400'
                                }`}>{leader.rank}.</span>
                                {/* Name */}
                                <span className="flex-1 font-semibold text-sm ml-2 truncate text-corporate-navy">{leader.name}</span>
                                {/* Streak */}
                                <span className="text-xs font-medium ml-2 text-corporate-teal">{leader.streak} Day Streak</span>
                            </div>
                        ))}
                         {/* Optional: Link to full leaderboard */}
                         {/* <Button variant="ghost" size="sm" className="w-full mt-3 !text-xs">View Full Leaderboard</Button> */}
                    </div>

                    {/* Quick Share Card */}
                    <div className="p-3 sm:p-4 lg:p-6 bg-white border border-gray-200 rounded-xl shadow-lg">
                        <h2 className="text-lg font-bold mb-4 flex items-center gap-2 border-b border-gray-200 pb-2 text-corporate-navy">
                            <Link className="w-5 h-5 text-gray-500" /> Quick Share
                        </h2>
                        {/* Input */}
                        <textarea
                            value={quickShareText}
                            onChange={(e) => setQuickShareText(e.target.value)}
                            placeholder="Share your latest rep or a quick win..."
                            className="w-full p-3 border border-gray-300 rounded-lg text-sm mb-3 focus:ring-2 focus:ring-corporate-teal"
                            rows="3" disabled={isSharing}
                        />
                        {/* Share Button */}
                        <Button onClick={handleQuickShare} size="md" className="w-full" disabled={!quickShareText.trim() || isSharing}>
                            {isSharing ? <Loader className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                            {isSharing ? 'Sharing...' : 'Share Rep to Pod'}
                        </Button>
                    </div>
                </aside>

                {/* Right Column: Activity Feed */}
                <main className="lg:col-span-2 space-y-4 sm:space-y-5 lg:space-y-6">
                    {/* Feed Filter Buttons */}
                    <div className="flex space-x-3">
                        <Button
                            onClick={() => setFeedFilter('pod')}
                            variant={feedFilter === 'pod' ? 'primary' : 'outline'}
                            size="sm" // Small filter buttons
                        >
                            My Pod Activity
                        </Button>
                        <Button
                            onClick={() => setFeedFilter('all')}
                            variant={feedFilter === 'all' ? 'primary' : 'outline'}
                            size="sm"
                        >
                            All Community (Global)
                        </Button>
                    </div>

                    {/* Feed Items */}
                    {filteredFeed.length === 0 ? (
                         <div className="text-center text-gray-500 py-16 italic border-2 border-dashed border-gray-300 rounded-xl bg-white">
                            <MessageSquare className="w-10 h-10 mx-auto mb-3 text-gray-400"/>
                            The feed is quiet... Log a rep to share your progress!
                         </div>
                    ) : (
                        filteredFeed.map(item => <RepFeedItem key={item.id} item={item} />)
                    )}

                    {/* Optional: Load More Button */}
                    {/* {filteredFeed.length > 0 && <Button variant="outline" size="sm" className="w-full mt-4">Load More Posts</Button>} */}
                </main>

            </div>
        </div>
    );
};

// Export the component
export default CommunityFeedScreen;

// Note: This screen relies heavily on MOCK_FEED.
// TODO: Replace MOCK_FEED with data fetched from Firestore (e.g., a 'community_feed' collection).
// TODO: Implement real Quick Share functionality (posting to Firestore).
// TODO: Implement real Reaction and Comment functionality.
// TODO: Implement real Leaderboard data fetching/calculation.
