// src/components/screens/CommunityScreen.jsx

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    Users, MessageSquare, Briefcase, Bell, PlusCircle, User, ArrowLeft, Target, Settings, Filter, Clock,
    // FIX: Import Star component
    Star 
} from 'lucide-react';
import { useAppServices } from '../../services/useAppServices.jsx';

/* =========================================================
   HIGH-CONTRAST PALETTE
========================================================= */
const COLORS = {
  NAVY: '#002E47', 
  TEAL: '#47A88D', 
  ORANGE: '#E04E1B', 
  LIGHT_GRAY: '#FCFCFA', 
  OFF_WHITE: '#FFFFFF',
  SUBTLE: '#E5E7EB',
};

/* =========================================================
   UTILITIES & MOCKS
========================================================= */

const LEADERSHIP_TIERS_META = { 
    'All': { name: 'All Tiers', hex: COLORS.TEAL },
    'T3': { name: 'Strategic Execution', hex: '#F5C900' },
    'T4': { name: 'People Development', hex: COLORS.ORANGE },
    'T5': { name: 'Visionary Leadership', hex: COLORS.NAVY },
};

// Mock data now includes Tier and a High-Impact Flag
const MOCK_THREADS = [
    { id: 1, title: 'Optimizing Delegation with T3 Leaders', tier: 'T4', replies: 32, lastActive: '1 hour ago', impact: true },
    { id: 2, title: 'Questioning our Q4 Vision Statement', tier: 'T5', replies: 15, lastActive: '4 hours ago', impact: false },
    { id: 3, title: 'Micro-Habits for Daily Self-Awareness', tier: 'T1', replies: 5, lastActive: '1 day ago', impact: false },
    { id: 4, title: 'SBI Feedback during High Tension Meetings', tier: 'T4', replies: 45, lastActive: '30 min ago', impact: true },
    { id: 5, title: 'My best practice for effective Pre-Mortems', tier: 'T3', replies: 8, lastActive: '2 hours ago', impact: false },
];

/* =========================================================
   MOCK/PLACEHOLDER SCREENS
========================================================= */

const CommunityHomeView = ({ setView, user, currentTierFilter, setCurrentTierFilter }) => {
    const filteredThreads = MOCK_THREADS.filter(thread => 
        currentTierFilter === 'All' || thread.tier === currentTierFilter
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center border-b pb-3" style={{ borderColor: COLORS.SUBTLE }}>
                <h2 className="text-2xl font-bold" style={{ color: COLORS.NAVY }}>Community Feed ({currentTierFilter} Focus)</h2>
                <button 
                    onClick={() => setView('new-thread')} 
                    className="flex items-center px-4 py-2 text-sm font-semibold rounded-lg text-white shadow-md hover:opacity-90 transition-opacity"
                    style={{ backgroundColor: COLORS.TEAL }}
                >
                    <PlusCircle className="w-4 h-4 mr-2" /> Start Discussion
                </button>
            </div>

            {/* Tier Filter Bar */}
            <div className="flex space-x-3 p-3 rounded-xl border" style={{ borderColor: COLORS.SUBTLE, backgroundColor: COLORS.LIGHT_GRAY }}>
                <Filter className="w-5 h-5" style={{ color: COLORS.NAVY }} />
                <span className="text-sm font-semibold" style={{ color: COLORS.NAVY }}>Filter by Executive Tier:</span>
                {Object.keys(LEADERSHIP_TIERS_META).map(tierId => (
                    <button
                        key={tierId}
                        onClick={() => setCurrentTierFilter(tierId)}
                        className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors ${
                            currentTierFilter === tierId
                                ? 'text-white shadow-md'
                                : 'text-gray-700 bg-white hover:bg-gray-200'
                        }`}
                        style={{ backgroundColor: currentTierFilter === tierId ? LEADERSHIP_TIERS_META[tierId].hex : '#F3F4F6', color: currentTierFilter === tierId ? COLORS.OFF_WHITE : COLORS.NAVY }}
                    >
                        {tierId}
                    </button>
                ))}
            </div>

            {/* Thread List */}
            <div className="space-y-3">
                {filteredThreads.map(thread => (
                    <div key={thread.id} className="p-4 rounded-xl border-l-4 shadow-md transition-shadow hover:shadow-lg" 
                        style={{ borderColor: thread.impact ? COLORS.ORANGE : COLORS.TEAL, backgroundColor: COLORS.OFF_WHITE }}>
                        
                        <div className="flex justify-between items-center">
                            <h3 className="font-semibold text-lg" style={{ color: COLORS.NAVY }}>{thread.title}</h3>
                            {thread.impact && (
                                <span className="text-xs font-bold px-3 py-1 rounded-full text-white" style={{ backgroundColor: COLORS.ORANGE }}>
                                    <Star className='w-3 h-3 inline mr-1'/> High-Impact
                                </span>
                            )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                            **Focus Tier:** {thread.tier} | {thread.replies} Replies | Last active {thread.lastActive}
                        </p>
                    </div>
                ))}
            </div>
            {filteredThreads.length === 0 && (
                <div className="p-6 text-center text-gray-500 italic border rounded-xl" style={{ borderColor: COLORS.SUBTLE, backgroundColor: COLORS.OFF_WHITE }}>
                    No active threads match the {currentTierFilter} filter.
                </div>
            )}
        </div>
    );
};

const MyThreadsView = ({ user }) => (
    <div className="p-6 rounded-xl border shadow-lg" style={{ borderColor: COLORS.SUBTLE, backgroundColor: COLORS.OFF_WHITE }}>
        <h2 className="text-2xl font-bold mb-4" style={{ color: COLORS.NAVY }}>My Active Threads</h2>
        <p className="text-gray-600">You haven't started any threads yet, {user?.name || 'Leader'}. Start a discussion in the Global Feed!</p>
    </div>
);

const MentorshipView = () => (
    <div className="p-6 rounded-xl border shadow-lg" style={{ borderColor: COLORS.SUBTLE, backgroundColor: COLORS.OFF_WHITE }}>
        <h2 className="text-2xl font-bold mb-4" style={{ color: COLORS.NAVY }}>Mentorship Network</h2>
        <p className="text-gray-600">Connect with expert leaders (T5 Visionaries) for one-on-one guidance.</p>
        <button 
            className="mt-4 flex items-center px-6 py-3 font-semibold rounded-xl text-white shadow-md hover:shadow-lg transition-shadow"
            style={{ backgroundColor: COLORS.ORANGE }}
        >
            <User className="w-5 h-5 mr-2" /> Find a Mentor
        </button>
    </div>
);

const NotificationsView = () => (
    <div className="p-6 rounded-xl border shadow-lg" style={{ borderColor: COLORS.SUBTLE, backgroundColor: COLORS.OFF_WHITE }}>
        <h2 className="text-2xl font-bold mb-4" style={{ color: COLORS.NAVY }}>Notifications</h2>
        <div className="space-y-3">
            {[1, 2].map(i => (
                <p key={i} className="text-sm text-gray-700 border-b pb-2">A **T4 Leader** provided a strategic alternative to your **T3 Execution** challenge.</p>
            ))}
        </div>
    </div>
);


const NewThreadView = ({ setView }) => (
    <div className="p-6 rounded-xl border shadow-lg" style={{ borderColor: COLORS.SUBTLE, backgroundColor: COLORS.OFF_WHITE }}>
        <button onClick={() => setView('home')} className="flex items-center text-gray-600 mb-4 hover:text-gray-800">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Global Feed
        </button>
        <h2 className="text-2xl font-bold mb-4" style={{ color: COLORS.NAVY }}>Start a Structured Discussion</h2>
        <p className="text-sm text-gray-700 mb-4 border-l-4 pl-3" style={{ borderColor: COLORS.TEAL }}>
            Use the structure below to ensure high-leverage responses from senior leaders.
        </p>

        <form className="space-y-4">
            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">1. Thread Title / Core Topic</label>
                <input type="text" placeholder="e.g., How to apply SBI feedback to high performers?" className="w-full p-3 border rounded-lg" />
            </div>

            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">2. Context / Constraint (1-2 Sentences Max)</label>
                <textarea placeholder="e.g., The employee is highly sensitive, and I only have 15 minutes for the conversation." className="w-full p-3 border rounded-lg h-20" />
            </div>

            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">3. Detailed Question / Challenge</label>
                <textarea placeholder="What specific T4 coaching approach should I use to prioritize listening over advice in this scenario?" className="w-full p-3 border rounded-lg h-32" />
            </div>

            <button 
                type="submit"
                className="px-6 py-3 font-semibold text-white rounded-xl shadow-md hover:shadow-lg transition-shadow"
                style={{ backgroundColor: COLORS.TEAL }}
            >
                Post Thread for Executive Review
            </button>
        </form>
    </div>
);


/* =========================================================
   MAIN COMPONENT: CommunityScreen
========================================================= */

const CommunityScreen = () => {
    const { user, navigate } = useAppServices();
    const [view, setView] = useState('home');
    const [currentTierFilter, setCurrentTierFilter] = useState('All');

    const navItems = [
        { screen: 'home', label: 'Global Feed', icon: MessageSquare },
        { screen: 'my-threads', label: 'My Threads', icon: Briefcase },
        { screen: 'mentorship', label: 'Mentorship Network', icon: Users },
        { screen: 'notifications', label: 'Notifications (1)', icon: Bell, notify: true },
    ];
    
    const renderContent = () => {
        switch(view) {
            case 'my-threads':
                return <MyThreadsView user={user} />;
            case 'mentorship':
                return <MentorshipView />;
            case 'notifications':
                return <NotificationsView />;
            case 'new-thread':
                return <NewThreadView setView={setView} />;
            case 'home':
            default:
                return <CommunityHomeView 
                    setView={setView} 
                    user={user} 
                    currentTierFilter={currentTierFilter} 
                    setCurrentTierFilter={setCurrentTierFilter}
                />;
        }
    };

    return (
        <div className="p-6 md:p-10 min-h-screen" style={{ background: COLORS.BG }}>
            {/* Header */}
            <div className='flex items-center gap-4 border-b-2 pb-2 mb-8' style={{borderColor: COLORS.NAVY+'30'}}>
                <Users className='w-10 h-10' style={{color: COLORS.TEAL}}/>
                <h1 className="text-4xl font-extrabold" style={{ color: COLORS.NAVY }}>Executive Community</h1>
            </div>

            <div className="grid lg:grid-cols-4 gap-8">
                {/* Sidebar Navigation (1/4 on the left) */}
                <div className="lg:col-span-1 space-y-4">
                    <h3 className="text-xs font-extrabold uppercase tracking-widest px-2 py-1 rounded" style={{ color: COLORS.NAVY, backgroundColor: COLORS.SUBTLE }}>
                        Community Channels
                    </h3>
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = view === item.screen;
                        const accentColor = item.screen === 'notifications' ? COLORS.ORANGE : COLORS.NAVY;

                        return (
                            <button
                                key={item.screen}
                                onClick={() => setView(item.screen)}
                                className={`flex items-center w-full p-4 rounded-xl font-semibold relative transition-all duration-200 shadow-md ${
                                    isActive
                                        ? `bg-white text-[${COLORS.NAVY}] ring-2 ring-[${COLORS.TEAL}] shadow-lg`
                                        : `text-gray-700 bg-white hover:bg-gray-50`
                                }`}
                                style={{ borderLeft: isActive ? `4px solid ${COLORS.TEAL}` : '1px solid #E5E7EB' }}
                            >
                                <Icon className="w-5 h-5 mr-3" style={{ color: accentColor }} />
                                <span className="flex-1 text-left">{item.label}</span>
                                {item.notify && <div className={`h-2 w-2 bg-[${COLORS.ORANGE}] rounded-full`} />}
                            </button>
                        );
                    })}
                </div>

                {/* Main Content Area (3/4 on the right) */}
                <div className="lg:col-span-3">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};

export default CommunityScreen;