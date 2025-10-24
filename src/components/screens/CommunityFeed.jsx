// src/components/screens/CommunityFeed.jsx

import React, { useState, useMemo } from 'react';
import { Users, Send, MessageSquare, Heart, CornerRightUp, Award, Link } from 'lucide-react';
import { useAppServices } from '../../services/useAppServices.jsx';

const COLORS = {
  NAVY: '#002E47', TEAL: '#47A88D', ORANGE: '#E04E1B', BLUE: '#2563EB', OFF_WHITE: '#FFFFFF', SUBTLE: '#E5E7EB',
};

// --- MOCK DATA ---
const MOCK_FEED = [
    { id: 1, user: 'Alex H.', rep: 'Successfully used the CLEAR coaching framework in my 1:1 this morning.', tier: 'T4: People Dev', time: '5m ago', reactions: 8, comments: 2, isPod: true },
    { id: 2, user: 'Team Admin', rep: 'New LeaderRep Streak Coin Unlocked! Check your profile for details.', tier: 'Gamification', time: '2h ago', reactions: 15, comments: 10, isPod: false },
    { id: 3, user: 'Sarah K.', rep: 'Conducted a 10-minute mindful check before the quarterly review.', tier: 'T1: Self-Awareness', time: '3h ago', reactions: 4, comments: 0, isPod: true },
    { id: 4, user: 'Justin M.', rep: 'Retired a rep (SOP creation). Shifting focus to T3: Strategic Alignment.', tier: 'Weekly Review', time: 'Yesterday', reactions: 7, comments: 1, isPod: true },
];

const RepFeedItem = ({ item }) => {
    const { navigate } = useAppServices();

    const handleComment = () => {
        console.log(`Navigating to comment thread for Rep ${item.id}`);
        // Mock navigation to a detailed view
        navigate('community-thread', { repId: item.id }); 
    };
    const handleReact = () => {
        // Mock reaction logic
        console.log(`Reacted to Rep ${item.id}`);
    };

    return (
        <div className="p-4 bg-white border border-gray-200 rounded-xl shadow-md transition-shadow duration-200 hover:shadow-lg">
            <div className="flex justify-between items-start mb-3 border-b pb-2">
                <div className="flex items-center space-x-3">
                    <User className="w-5 h-5 text-gray-500" />
                    <div>
                        <p className="font-bold text-lg text-[#002E47]">{item.user}</p>
                        <p className="text-xs text-gray-500">{item.time}</p>
                    </div>
                </div>
                {item.isPod && <span className={`text-xs font-semibold px-2 py-0.5 rounded-full bg-[${COLORS.BLUE}]/10 text-[${COLORS.BLUE}] flex items-center gap-1`}><Users size={12}/> My Pod</span>}
            </div>

            <p className="text-base text-gray-800 mb-4 font-medium italic">"{item.rep}"</p>
            
            <div className="flex justify-between items-center text-sm pt-2 border-t border-gray-100">
                <div className="flex space-x-4">
                    <button onClick={handleReact} className="flex items-center text-red-500 hover:text-red-700 transition-colors">
                        <Heart className="w-4 h-4 mr-1" /> {item.reactions}
                    </button>
                    <button onClick={handleComment} className="flex items-center text-gray-500 hover:text-gray-700 transition-colors">
                        <MessageSquare className="w-4 h-4 mr-1" /> {item.comments}
                    </button>
                </div>
                <span className={`text-xs text-gray-500`}>{item.tier}</span>
            </div>
        </div>
    );
};

const CommunityFeedScreen = () => {
    const { navigate } = useAppServices();
    const [feedFilter, setFeedFilter] = useState('pod');
    
    // Simulate a simple Leaderboard (Feature 5)
    const MOCK_LEADERBOARD = [
        { rank: 1, name: 'Alex H.', streak: 12, reps: 68 },
        { rank: 2, name: 'Sarah K.', streak: 9, reps: 55 },
        { rank: 3, name: 'Justin M.', streak: 7, reps: 42 },
    ];

    const filteredFeed = useMemo(() => {
        if (feedFilter === 'pod') return MOCK_FEED.filter(item => item.isPod);
        return MOCK_FEED;
    }, [feedFilter]);

    return (
        <div className="p-8 space-y-8 bg-gray-50 min-h-screen">
            <div className="flex justify-between items-center border-b pb-4 border-gray-300">
                <h1 className="text-4xl font-extrabold text-[#002E47] flex items-center gap-3">
                    <Users size={32} className="text-[#2563EB]" /> Accountability Pod
                </h1>
                <Button onClick={() => navigate('app-settings')} variant="outline" className="text-sm px-4 py-2 text-gray-700 border-gray-400">
                   <Settings size={16} className='mr-2'/> Pod Settings
                </Button>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                
                {/* Left Column: Leaderboard and Stats */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="p-6 bg-white border border-gray-200 rounded-xl shadow-lg">
                        <h2 className="text-xl font-bold text-[#002E47] mb-4 flex items-center gap-2 border-b pb-2">
                            <Award className="w-5 h-5 text-yellow-500" /> Rep Streak Leaderboard
                        </h2>
                        {MOCK_LEADERBOARD.map((leader, index) => (
                            <div key={leader.rank} className="flex justify-between items-center py-2 border-b last:border-b-0">
                                <span className={`font-extrabold w-6 text-center ${index === 0 ? 'text-yellow-600' : 'text-gray-500'}`}>{leader.rank}.</span>
                                <span className="flex-1 font-semibold text-gray-800">{leader.name}</span>
                                <span className="text-sm font-medium text-[#47A88D]">{leader.streak} Day Streak</span>
                            </div>
                        ))}
                    </div>

                    <div className="p-6 bg-white border border-gray-200 rounded-xl shadow-lg">
                        <h2 className="text-xl font-bold text-[#002E47] mb-4 flex items-center gap-2 border-b pb-2">
                            <Link className="w-5 h-5 text-gray-500" /> Quick Share
                        </h2>
                        <textarea
                            placeholder="Share your latest rep with your pod..."
                            className="w-full p-3 border border-gray-300 rounded-lg text-sm mb-3"
                            rows="3"
                        />
                        <Button className="w-full text-sm">
                            <Send className="w-4 h-4 mr-2" /> Share Rep to Pod
                        </Button>
                    </div>
                </div>

                {/* Right Column: Activity Feed */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex space-x-3">
                        <Button 
                            onClick={() => setFeedFilter('pod')}
                            variant={feedFilter === 'pod' ? 'primary' : 'outline'}
                            className="px-4 py-2 text-sm"
                        >
                            My Pod Activity
                        </Button>
                        <Button 
                            onClick={() => setFeedFilter('all')}
                            variant={feedFilter === 'all' ? 'primary' : 'outline'}
                            className="px-4 py-2 text-sm"
                        >
                            All Community (Global)
                        </Button>
                    </div>
                    
                    {filteredFeed.map(item => <RepFeedItem key={item.id} item={item} />)}
                    
                    {filteredFeed.length === 0 && (
                        <p className="text-center text-gray-500 py-10">Nothing in the feed yet. Log a rep to get started!</p>
                    )}
                </div>

            </div>
        </div>
    );
};

export default CommunityFeedScreen;