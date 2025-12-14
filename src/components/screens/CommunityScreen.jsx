// src/components/screens/CommunityScreen.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAppServices } from '../../services/useAppServices.jsx';
import { membershipService } from '../../services/membershipService.js';
import contentService, { CONTENT_COLLECTIONS } from '../../services/contentService.js';
import { useDevPlan } from '../../hooks/useDevPlan';
import UniversalResourceViewer from '../ui/UniversalResourceViewer';
import { logWidthMeasurements } from '../../utils/debugWidth.js';
import { useFeatures } from '../../providers/FeatureProvider';
import WidgetRenderer from '../admin/WidgetRenderer';
import { useLayout } from '../../providers/LayoutProvider';

import {
    Users, MessageSquare, Briefcase, Bell, PlusCircle, User, Target, Filter, Clock,
    Star, CheckCircle, Award, Link, Send, Loader, Heart, X, UserPlus, Video, BookOpen, FileText,
    Calendar
} from 'lucide-react';
import { Button, Card, LoadingSpinner, PageLayout, NoWidgetsEnabled } from '../ui';

// --- Tab Button Component ---
const TabButton = ({ active, onClick, icon: IconComponent, label, badge }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-3 min-h-[44px] font-medium text-sm border-b-2 transition-all duration-150 whitespace-nowrap touch-manipulation active:scale-[0.98] ${
      active 
        ? 'border-corporate-teal text-corporate-teal' 
        : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 active:bg-slate-50'
    }`}
  >
    <IconComponent className="w-4 h-4" />
    {label}
    {badge > 0 && (
      <span className="bg-corporate-teal/10 text-corporate-teal text-xs font-bold px-2 py-0.5 rounded-full">
        {badge}
      </span>
    )}
  </button>
);

// --- Sub-Components ---

const CommunityHomeView = ({ setView, user, currentTierFilter, setCurrentTierFilter, filteredThreads, tierMeta }) => {
    const safeTierMeta = useMemo(() => {
        const tiers = tierMeta || {};
        return tiers.All ? tiers : { All: { name: 'All Tiers', hex: 'var(--corporate-teal)', color: 'teal-500' }, ...tiers };
    }, [tierMeta]);

    const handleCommentClick = (threadId) => {
        alert(`Action: View details/comments for thread ${threadId}`);
    };
    const handleReactClick = (threadId) => {
        alert(`Action: Liked thread ${threadId}`);
    };

    return (
        <div className="space-y-4 sm:space-y-5 lg:space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b pb-4 border-slate-200">
                <h2 className="text-xl sm:text-2xl font-bold text-corporate-navy">Community Feed ({safeTierMeta[currentTierFilter]?.name || 'All'})</h2>
                <Button onClick={() => setView('new-thread')} size="sm">
                    <PlusCircle className="w-4 h-4 mr-2" /> Start Discussion
                </Button>
            </div>

            <Card accent="TEAL" className="!p-3">
                <div className="flex flex-wrap items-center gap-2">
                    <Filter className="w-5 h-5 flex-shrink-0 text-corporate-navy" />
                    <span className="text-sm font-semibold mr-2 text-corporate-navy">Filter:</span>
                    {Object.keys(safeTierMeta).map(tierId => {
                        const meta = safeTierMeta[tierId];
                        const isActive = currentTierFilter === tierId;
                        return (
                            <button
                                key={tierId}
                                onClick={() => setCurrentTierFilter(tierId)}
                                className={`px-3 py-1 text-[11px] font-bold rounded-full transition-all duration-200 border ${
                                    isActive
                                        ? 'text-white shadow-md scale-105'
                                        : 'text-gray-700 bg-white hover:bg-gray-100 border-gray-300'
                                }`}
                                style={{ backgroundColor: isActive ? meta.hex : undefined, borderColor: isActive ? meta.hex : undefined }}
                            >
                                {tierId === 'System' ? 'Admin' : tierId}
                            </button>
                        );
                    })}
                </div>
            </Card>

            <div className="space-y-4">
                {filteredThreads.length === 0 && (
                    <Card className="text-center border-dashed">
                        <p className="text-gray-500 italic py-6">
                            No posts match the "{safeTierMeta[currentTierFilter]?.name || currentTierFilter}" filter. {currentTierFilter !== 'All' && 'Try selecting "All".'}
                        </p>
                    </Card>
                )}
                {filteredThreads.map(thread => {
                    const isMyThread = user?.userId && thread.ownerId === user.userId;
                    const threadTierMeta = safeTierMeta[thread.tier] || { hex: 'var(--corporate-subtle-teal)' };

                    return (
                        <Card key={thread.id} accent={isMyThread ? 'TEAL' : (thread.impact ? 'ORANGE' : 'NAVY')} className="transition-shadow duration-200 hover:shadow-lg">
                            <div className="flex justify-between items-start mb-3 border-b pb-2 border-slate-200">
                                <div className="flex items-center space-x-3">
                                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center font-bold text-xs text-gray-600 shrink-0">
                                        {thread.rep}
                                    </div>
                                    <div>
                                        <p className="font-bold text-md leading-tight text-corporate-navy">{thread.ownerName || 'User'}</p>
                                        <p className="text-xs text-gray-500">{thread.time}</p>
                                    </div>
                                </div>
                                <div className='flex items-center gap-2 ml-2 flex-shrink-0'>
                                    {thread.isPodMember && <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700`}>Pod</span>}
                                    {thread.impact && <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full text-white bg-corporate-orange flex items-center gap-1`}><Star size={10} fill="currentColor"/> Impact</span>}
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full`} style={{ background: `${threadTierMeta.hex}1A`, color: threadTierMeta.hex }}>{thread.tier}</span>
                                </div>
                            </div>

                            {thread.title && thread.title !== thread.content && <h4 className="font-bold text-sm mb-1 text-corporate-navy">{thread.title}</h4>}
                            <p className="text-sm text-gray-800 mb-4 font-medium whitespace-pre-wrap">{thread.content}</p>

                            <div className="flex justify-between items-center text-xs pt-3 border-t border-slate-200">
                                <div className="flex space-x-4">
                                    <button onClick={() => handleReactClick(thread.id)} className="flex items-center text-red-500 hover:text-red-700 transition-colors group">
                                        <Heart className="w-3.5 h-3.5 mr-1 group-hover:fill-current" /> {thread.reactions || 0}
                                    </button>
                                    <button onClick={() => handleCommentClick(thread.id)} className="flex items-center text-gray-500 hover:text-blue-600 transition-colors group">
                                        <MessageSquare className="w-3.5 h-3.5 mr-1" /> {thread.comments || 0}
                                    </button>
                                </div>
                                <button onClick={() => handleCommentClick(thread.id)} className="font-semibold text-blue-600 hover:underline">View</button>
                            </div>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
};

const NewThreadView = ({ setView }) => {
    const { db, user } = useAppServices();
    const [title, setTitle] = useState('');
    const [context, setContext] = useState('');
    const [question, setQuestion] = useState('');
    const [tier, setTier] = useState('T2');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();
        if (!title || !context || !question || isSubmitting) return;

        setIsSubmitting(true);
        setIsSuccess(false);

        try {
            await contentService.addContent(db, CONTENT_COLLECTIONS.COMMUNITY, {
                title: title,
                content: `${context}\n\n${question}`,
                tier: tier,
                author: user?.name || 'Anonymous',
                authorId: user?.userId || 'anonymous',
                type: 'thread',
                context: context,
                question: question,
                reactions: 0,
                comments: 0,
                isPodMember: false,
                impact: false
            });
            setIsSuccess(true);
            setTimeout(() => setView('feed'), 2000);
        } catch (error) {
            console.error("Error posting thread:", error);
            alert("Failed to post thread. Please try again.");
        } finally {
            setIsSubmitting(false);
        }

    }, [title, context, question, tier, isSubmitting, setView, db, user]);

    return (
        <Card title="Start a New Discussion" icon={PlusCircle} accent="TEAL">
            <button onClick={() => setView('feed')} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 transition-colors">
                <X className="w-5 h-5" />
            </button>
            <p className="text-sm text-gray-700 mb-4 border-l-4 pl-3 italic border-corporate-teal">
                Use the structure below for high-quality discussions and faster responses from peers and coaches.
            </p>

            <form className="space-y-4" onSubmit={handleSubmit}>
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">1. Thread Title / Topic <span className="text-red-500">*</span></label>
                    <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Applying SBI to high performers" className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-corporate-teal" required />
                </div>
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">2. Situation & Context (1-2 sentences) <span className="text-red-500">*</span></label>
                    <textarea value={context} onChange={(e) => setContext(e.target.value)} placeholder="e.g., Giving feedback to a senior engineer who is technically strong but dismissive in code reviews." className="w-full p-3 border border-gray-300 rounded-lg h-20 text-sm focus:ring-2 focus:ring-corporate-teal" required />
                </div>
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">3. Specific Question / Challenge <span className="text-red-500">*</span></label>
                    <textarea value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="e.g., How can I deliver this feedback using SBI without demotivating them, focusing on the impact on team collaboration?" className="w-full p-3 border border-gray-300 rounded-lg h-24 text-sm focus:ring-2 focus:ring-corporate-teal" required />
                </div>
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">4. Primary Leadership Tier Focus</label>
                    <select value={tier} onChange={(e) => setTier(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-corporate-teal">
                        <option value="T1">T1: Lead Self</option>
                        <option value="T2">T2: Lead Work</option>
                        <option value="T3">T3: Lead People</option>
                        <option value="T4">T4: Lead Teams</option>
                        <option value="T5">T5: Lead Strategy</option>
                    </select>
                </div>

                {isSuccess && (
                    <div className="flex items-center p-3 text-sm font-semibold text-white rounded-lg bg-corporate-teal animate-pulse">
                        <CheckCircle className='w-4 h-4 mr-2'/> Thread Posted! Redirecting...
                    </div>
                )}

                <Button type="submit" disabled={isSubmitting || isSuccess} size="md" className="w-full">
                    {isSubmitting ? <Loader className="w-5 h-5 mr-2 animate-spin"/> : <Send className="w-4 h-4 mr-2" />}
                    {isSubmitting ? 'Posting Thread...' : 'Post Discussion'}
                </Button>
            </form>
        </Card>
    );
};

const CommunityResourcesView = ({ db }) => {
    const { plan, currentWeek } = useDevPlan();
    const [resources, setResources] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedResource, setSelectedResource] = useState(null);

    useEffect(() => {
        const fetchResources = async () => {
            if (!db) return;
            setIsLoading(true);
            try {
                const allItems = await contentService.getContent(db, CONTENT_COLLECTIONS.COMMUNITY);
                setResources(allItems);
            } catch (error) {
                console.error("Error fetching community resources:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchResources();
    }, [db]);

    const unlockedResourceIds = useMemo(() => {
        if (!plan) return new Set();
        const ids = new Set();
        for (let i = 1; i <= currentWeek; i++) {
            const weekKey = `week${i}`;
            if (plan[weekKey]?.items) {
                plan[weekKey].items.forEach(item => {
                    if (item.resourceId) ids.add(item.resourceId);
                });
            }
        }
        return ids;
    }, [plan, currentWeek]);

    const newResourceIds = useMemo(() => {
        if (!plan) return new Set();
        const ids = new Set();
        const weekKey = `week${currentWeek}`;
        if (plan[weekKey]?.items) {
            plan[weekKey].items.forEach(item => {
                if (item.resourceId) ids.add(item.resourceId);
            });
        }
        return ids;
    }, [plan, currentWeek]);

    const visibleResources = useMemo(() => {
        return resources.filter(item => {
            if (item.isHiddenUntilUnlocked && !unlockedResourceIds.has(item.id)) return false;
            return item.url || item.resourceType === 'file' || item.resourceType === 'video';
        });
    }, [resources, unlockedResourceIds]);

    if (isLoading) return <LoadingSpinner message="Loading Resources..." />;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-corporate-navy">Community Resources</h2>
            </div>

            {visibleResources.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {visibleResources.map(resource => {
                        const isNew = newResourceIds.has(resource.id);
                        return (
                        <Card key={resource.id} className="hover:shadow-md transition-shadow cursor-pointer relative" onClick={() => setSelectedResource(resource)}>
                            {isNew && (
                                <div className="absolute top-2 right-2 bg-blue-600 text-white px-2 py-1 rounded text-xs font-bold shadow-md animate-pulse">
                                    NEW
                                </div>
                            )}
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-teal-50 rounded-lg">
                                    {resource.resourceType === 'video' ? <Video className="w-6 h-6 text-teal-600" /> :
                                     resource.resourceType === 'file' ? <FileText className="w-6 h-6 text-teal-600" /> :
                                     <Link className="w-6 h-6 text-teal-600" />}
                                </div>
                                <div>
                                    <h3 className="font-semibold text-corporate-navy line-clamp-1">{resource.title}</h3>
                                    <p className="text-sm text-slate-500 line-clamp-2 mt-1">{resource.description || 'No description'}</p>
                                </div>
                            </div>
                        </Card>
                    )})}
                </div>
            ) : (
                <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                    <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500">No resources available yet.</p>
                </div>
            )}

            {selectedResource && (
                <UniversalResourceViewer
                    resource={selectedResource}
                    onClose={() => setSelectedResource(null)}
                />
            )}
        </div>
    );
};

// --- Main Component ---

const CommunityScreen = ({ simulatedTier }) => {
    const { db, user, navigate, LEADERSHIP_TIERS, isLoading: isAppLoading, error: appError } = useAppServices();
    const { isFeatureEnabled } = useFeatures();
    const { getUnlockedResources } = useDevPlan();
    
    const safeUser = useMemo(() => user || { userId: null, name: 'Guest' }, [user]);
    
    // Tab State
    const [activeTab, setActiveTab] = useState('events'); // Default to events
    const [view, setView] = useState('feed'); // For sub-views within feed tab (feed vs new-thread)
    
    // Feed State
    const [currentTierFilter, setCurrentTierFilter] = useState('All');
    const [allThreads, setAllThreads] = useState([]);
    const [isLoadingThreads, setIsLoadingThreads] = useState(true);

    // Fetch Threads
    useEffect(() => {
        const fetchThreads = async () => {
            setIsLoadingThreads(true);
            try {
                const threads = await contentService.getContent(db, CONTENT_COLLECTIONS.COMMUNITY);
                const unlockedIds = getUnlockedResources('community');
                const unlockedThreads = threads.filter(t => unlockedIds.has(t.id));
                
                const mappedThreads = unlockedThreads.map(t => ({
                    ...t,
                    ownerName: t.author || t.ownerName,
                    ownerId: t.authorId || t.ownerId,
                    rep: t.rep || (t.author ? t.author.substring(0, 2).toUpperCase() : 'U'), 
                    content: t.content || t.title,
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

    // Filter Threads
    const filteredThreads = useMemo(() => {
        return allThreads.filter(thread =>
            thread.tier !== 'System' &&
            (currentTierFilter === 'All' || thread.tier === currentTierFilter)
        );
    }, [currentTierFilter, allThreads]);

    const tierMeta = useMemo(() => LEADERSHIP_TIERS || {}, [LEADERSHIP_TIERS]);

    if (isAppLoading) return <LoadingSpinner message="Loading Community Hub..." />;
    if (appError) return <div className="p-4 text-red-500">Error: {appError.message}</div>;

    return (
        <PageLayout
            title="Community Hub"
            subtitle="Connect, share insights, and grow with fellow leaders."
            icon={Users}
            navigate={navigate}
        >
            {/* Tab Navigation */}
            <div className="flex overflow-x-auto border-b border-slate-200 mb-6 no-scrollbar">
                <TabButton 
                    active={activeTab === 'events'} 
                    onClick={() => setActiveTab('events')} 
                    icon={Video} 
                    label="Live Events" 
                />
                <TabButton 
                    active={activeTab === 'my-community'} 
                    onClick={() => setActiveTab('my-community')} 
                    icon={Calendar} 
                    label="My Community" 
                />
                <TabButton 
                    active={activeTab === 'feed'} 
                    onClick={() => setActiveTab('feed')} 
                    icon={MessageSquare} 
                    label="Community Feed" 
                />
                <TabButton 
                    active={activeTab === 'resources'} 
                    onClick={() => setActiveTab('resources')} 
                    icon={BookOpen} 
                    label="Resources" 
                />
            </div>

            {/* Tab Content */}
            <div className="space-y-6 max-w-5xl mx-auto">
                {activeTab === 'events' && (
                    <div className="space-y-6">
                        <WidgetRenderer widgetId="community-upcoming-sessions" />
                    </div>
                )}

                {activeTab === 'my-community' && (
                    <div className="space-y-6">
                        <WidgetRenderer widgetId="community-my-registrations" />
                    </div>
                )}

                {activeTab === 'feed' && (
                    <>
                        {view === 'feed' && (
                            <CommunityHomeView
                                setView={setView}
                                user={safeUser}
                                currentTierFilter={currentTierFilter}
                                setCurrentTierFilter={setCurrentTierFilter}
                                filteredThreads={filteredThreads}
                                tierMeta={tierMeta}
                            />
                        )}
                        {view === 'new-thread' && (
                            <NewThreadView setView={setView} />
                        )}
                    </>
                )}

                {activeTab === 'resources' && (
                    <CommunityResourcesView db={db} />
                )}
            </div>
        </PageLayout>
    );
};

export default CommunityScreen;
