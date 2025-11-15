// src/components/screens/LeadershipVideos.jsx (Refactored for Consistency)

import React, { useEffect, useMemo, useState } from 'react';
// --- Icons ---
import { Film, User, Clock, ArrowRight, Zap, Briefcase, ArrowLeft, Search, Filter, Play, BookOpen, Users, Target, Lightbulb, TrendingUp, Star } from 'lucide-react';
// --- Core Services & Context ---
import { useAppServices } from '../../services/useAppServices.jsx'; // cite: useAppServices.jsx

/* =========================================================
   PALETTE & UI COMPONENTS (Standardized)
========================================================= */
// --- CORPORATE COLORS (STRICT COMPLIANCE) ---
const COLORS = { NAVY: '#002E47', TEAL: '#47A88D', BLUE: '#002E47', ORANGE: '#E04E1B', GREEN: '#47A88D', AMBER: '#E04E1B', RED: '#E04E1B', LIGHT_GRAY: '#FCFCFA', OFF_WHITE: '#FFFFFF', SUBTLE: '#47A88D', TEXT: '#002E47', MUTED: '#47A88D', PURPLE: '#47A88D', BG: '#FCFCFA' }; // CORPORATE COLORS ONLY!

// --- Standardized Button Component (Local Definition, Styled Consistently) ---
// Note: Ideally, this would be imported from a shared UI library.
// Kept local as per original file structure, but styles updated to match standard.
const Button = ({ children, onClick, disabled = false, variant = 'primary', className = '', size = 'md', ...rest }) => {
  let baseStyle = `inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-4 disabled:opacity-50 disabled:cursor-not-allowed`;
  if (size === 'sm') baseStyle += ' px-4 py-2 text-sm'; else if (size === 'lg') baseStyle += ' px-8 py-4 text-lg'; else baseStyle += ' px-6 py-3 text-base'; // Default 'md'
  if (variant === 'primary') baseStyle += ` bg-[${COLORS.TEAL}] text-white shadow-lg hover:bg-[#47A88D] focus:ring-[${COLORS.TEAL}]/50`;
  else if (variant === 'secondary') baseStyle += ` bg-[${COLORS.ORANGE}] text-white shadow-lg hover:bg-[#C33E12] focus:ring-[${COLORS.ORANGE}]/50`;
  else if (variant === 'outline') baseStyle += ` bg-[${COLORS.OFF_WHITE}] text-[${COLORS.TEAL}] border-2 border-[${COLORS.TEAL}] shadow-md hover:bg-[${COLORS.TEAL}]/10 focus:ring-[${COLORS.TEAL}]/50`;
  else if (variant === 'nav-back') baseStyle += ` bg-white text-gray-700 border border-gray-300 shadow-sm hover:bg-gray-100 focus:ring-gray-300/50 px-4 py-2 text-sm`;
  if (disabled) baseStyle += ' bg-gray-300 text-gray-500 shadow-inner border-transparent hover:bg-gray-300';
  return (<button {...rest} onClick={onClick} disabled={disabled} className={`${baseStyle} ${className}`}>{children}</button>);
};

/**
 * Enhanced VideoCard Component
 * Corporate-styled video card with thumbnails, ratings, and enhanced metadata
 */
const VideoCard = ({ title, speaker, duration, url, description, accent, category, rating, views, tags = [] }) => {
    const accentColor = COLORS[accent] || COLORS.NAVY;
    
    // Generate YouTube thumbnail URL from video URL
    const getThumbnail = (videoUrl) => {
        const videoId = videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)?.[1];
        return videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : '/api/placeholder/320/180';
    };

    return (
        <div className="card-corporate group cursor-pointer transition-all duration-300 hover:scale-105">
            {/* Corporate accent border */}
            <div className="absolute top-0 left-0 right-0 h-1 rounded-t-xl" style={{ background: accentColor }}></div>
            
            {/* Thumbnail Section */}
            <div className="relative overflow-hidden rounded-t-lg mb-4">
                <img 
                    src={getThumbnail(url)} 
                    alt={`${title} thumbnail`}
                    className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300"
                    loading="lazy"
                />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors duration-300 flex items-center justify-center">
                    <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                        <Play className="w-6 h-6 ml-1" style={{ color: accentColor }} />
                    </div>
                </div>
                {/* Duration badge */}
                <div className="absolute bottom-2 right-2 bg-black/80 text-white px-2 py-1 rounded text-xs font-medium">
                    {duration}
                </div>
                {/* Rating badge */}
                {rating && (
                    <div className="absolute top-2 right-2 bg-white/90 px-2 py-1 rounded flex items-center text-xs font-medium">
                        <Star className="w-3 h-3 mr-1" style={{ color: COLORS.ORANGE, fill: COLORS.ORANGE }} />
                        {rating}
                    </div>
                )}
            </div>

            {/* Content Section */}
            <div className="flex-grow">
                {/* Category badge */}
                {category && (
                    <div className="inline-block px-3 py-1 rounded-full text-xs font-medium mb-2" 
                         style={{ backgroundColor: `${accentColor}20`, color: accentColor }}>
                        {category}
                    </div>
                )}
                
                {/* Title */}
                <h3 className="corporate-heading-md mb-2 line-clamp-2 group-hover:text-current transition-colors">
                    {title}
                </h3>
                
                {/* Speaker & Metadata */}
                <div className="flex items-center gap-4 mb-3 text-sm" style={{ color: COLORS.MUTED }}>
                    <div className="flex items-center">
                        <User className="w-4 h-4 mr-1" />
                        {speaker}
                    </div>
                    {views && (
                        <div className="flex items-center">
                            <TrendingUp className="w-4 h-4 mr-1" />
                            {views}
                        </div>
                    )}
                </div>
                
                {/* Description */}
                <p className="corporate-text-body text-sm mb-4 line-clamp-3">
                    {description}
                </p>
                
                {/* Tags */}
                {tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                        {tags.slice(0, 3).map((tag, index) => (
                            <span 
                                key={index}
                                className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md"
                            >
                                #{tag}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            {/* Action Button */}
            <a 
                href={url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="btn-corporate-primary w-full mt-4"
            >
                <Play className="w-4 h-4 mr-2" />
                Watch Video
            </a>
        </div>
    );
};

// --- ENHANCED VIDEO CATALOG (COMPREHENSIVE LEADERSHIP CONTENT) ---
const ENHANCED_VIDEO_CATALOG = {
    "INSPIRATIONAL": [
        { 
            id: "sinek-why", 
            title: "How great leaders inspire action", 
            speaker: "Simon Sinek", 
            duration: "18 min", 
            url: "https://www.youtube.com/watch?v=u4ZoJKF_VuA", 
            description: "The foundational concept of starting with 'Why' (The Golden Circle) to build loyalty and inspire action. A must-watch for defining purpose.",
            category: "Vision & Purpose",
            rating: 4.9,
            views: "60M+ views",
            tags: ["vision", "purpose", "inspiration", "golden-circle"]
        },
        { 
            id: "sinek-infinite", 
            title: "The Infinite Game: The Trap Leaders Must Avoid", 
            speaker: "Simon Sinek", 
            duration: "11 min", 
            url: "https://www.youtube.com/watch?v=RyTQ5-SQYTo", 
            description: "How to shift your mindset from playing to win (finite) to playing to advance your cause (infinite), focusing on resilience and long-term vision.",
            category: "Mindset",
            rating: 4.7,
            views: "2.5M+ views",
            tags: ["mindset", "strategy", "long-term", "resilience"]
        },
        { 
            id: "cuddy-presence", 
            title: "Your Body Language May Shape Who You Are", 
            speaker: "Amy Cuddy", 
            duration: "21 min", 
            url: "https://www.youtube.com/watch?v=Ks-_Mh1QhMc", 
            description: "Examines how 'power posing'—changing your body language—can change the chemicals in your brain and impact your leadership confidence.",
            category: "Executive Presence",
            rating: 4.8,
            views: "70M+ views",
            tags: ["confidence", "presence", "body-language", "psychology"]
        },
        { 
            id: "brown-vulnerability", 
            title: "The power of vulnerability", 
            speaker: "Brené Brown", 
            duration: "20 min", 
            url: "https://www.youtube.com/watch?v=iCvmsMYoE_A", 
            description: "A powerful talk on how vulnerability is not weakness, but the birthplace of innovation, creativity, and deeper trust.",
            category: "Authentic Leadership",
            rating: 4.9,
            views: "50M+ views",
            tags: ["vulnerability", "trust", "authenticity", "courage"]
        },
        { 
            id: "duckworth-grit", 
            title: "The Key to Success? Grit", 
            speaker: "Angela Lee Duckworth", 
            duration: "6 min", 
            url: "https://www.youtube.com/watch?v=H14bBuluwB8", 
            description: "Explains that the secret to outstanding achievement is not genius, but a special blend of passion and persistence called 'grit'.",
            category: "Resilience",
            rating: 4.6,
            views: "30M+ views",
            tags: ["grit", "persistence", "success", "psychology"]
        },
        { 
            id: "dalio-principles", 
            title: "How to Build a Company Where the Best Ideas Win", 
            speaker: "Ray Dalio", 
            duration: "5 min", 
            url: "https://www.youtube.com/watch?v=M95m2EFb7IQ", 
            description: "The founder of the world's largest hedge fund discusses creating an 'idea meritocracy' where people can speak up and say what they really think.",
            category: "Culture Building",
            rating: 4.5,
            views: "5M+ views",
            tags: ["culture", "meritocracy", "feedback", "transparency"]
        }
    ],
    "ACTIONABLE": [
        { 
            id: "sinek-micro", 
            title: "The Key to Effective Leadership: Micro-Behaviors", 
            speaker: "Simon Sinek", 
            duration: "3 min", 
            url: "https://www.youtube.com/watch?v=ReRcHdeUG9Y", 
            description: "Practical demonstration of small actions (eye contact, putting the phone away) that leaders must perform consistently to build trust.",
            category: "Daily Practices",
            rating: 4.7,
            views: "8M+ views",
            tags: ["micro-behaviors", "trust", "daily-habits", "practical"]
        },
        { 
            id: "sinek-positive", 
            title: "Transform Your Team: The Power of Positive Leadership", 
            speaker: "Simon Sinek", 
            duration: "6 min", 
            url: "https://www.youtube.com/watch?v=uNtOiqp1Tzs", 
            description: "Actionable advice on using positive reinforcement ('catching people doing things right') to build confidence in underperformers.",
            category: "Team Development",
            rating: 4.6,
            views: "3M+ views",
            tags: ["positive-leadership", "reinforcement", "team-building", "motivation"]
        },
        { 
            id: "delegation-levels", 
            title: "5 Levels of Delegation and How to Use Them", 
            speaker: "ProjectManager", 
            duration: "7 min", 
            url: "https://www.youtube.com/watch?v=wX-jO8g047A", 
            description: "A practical guide to the 5 key levels of delegation (Tell, Sell, Consult, Agree, Empower) and choosing the right level for the right task.",
            category: "Delegation",
            rating: 4.4,
            views: "1.5M+ views",
            tags: ["delegation", "empowerment", "management", "frameworks"]
        },
        { 
            id: "sbi-feedback", 
            title: "Giving Feedback: The SBI Method", 
            speaker: "Training Industry", 
            duration: "3 min", 
            url: "https://www.youtube.com/watch?v=1rA5-n7a0wE", 
            description: "A clear, concise breakdown of the Situation, Behavior, Impact (SBI) feedback model for structured, non-judgmental performance discussions.",
            category: "Feedback & Coaching",
            rating: 4.5,
            views: "2M+ views",
            tags: ["feedback", "coaching", "sbi-method", "communication"]
        },
        { 
            id: "conflict-management", 
            title: "Mastering the Art of Conflict Management", 
            speaker: "Harvard Business Review", 
            duration: "4 min", 
            url: "https://www.youtube.com/watch?v=Q-dO0rE-4oQ", 
            description: "A quick, actionable overview of the Thomas-Kilmann Conflict Mode Instrument (TKI) and choosing between competing, collaborating, and compromising.",
            category: "Conflict Resolution",
            rating: 4.3,
            views: "1.8M+ views",
            tags: ["conflict", "resolution", "tki", "negotiation"]
        },
        { 
            id: "ceo-communication", 
            title: "How to Speak Like a CEO in Meetings", 
            speaker: "Executive Impressions", 
            duration: "10 min", 
            url: "https://www.youtube.com/watch?v=wh5rLnsc8LU", 
            description: "Tactical communication tips on speaking with clarity, enthusiasm, and confidence to ensure your message is heard by senior leaders.",
            category: "Executive Communication",
            rating: 4.4,
            views: "900K+ views",
            tags: ["communication", "executive-presence", "meetings", "influence"]
        }
    ],
    "TEAM_BUILDING": [
        { 
            id: "lencioni-dysfunction", 
            title: "The Five Dysfunctions of a Team", 
            speaker: "Patrick Lencioni", 
            duration: "12 min", 
            url: "https://www.youtube.com/watch?v=GCxct4CR-To", 
            description: "Learn about the five common dysfunctions that prevent teams from working together effectively and how to address each one.",
            category: "Team Dynamics",
            rating: 4.6,
            views: "2.5M+ views",
            tags: ["teamwork", "dysfunction", "trust", "collaboration"]
        },
        { 
            id: "google-aristotle", 
            title: "What Google Learned About High-Performing Teams", 
            speaker: "Google re:Work", 
            duration: "8 min", 
            url: "https://www.youtube.com/watch?v=LhoLuui9gX8", 
            description: "Google's Project Aristotle findings on what makes teams effective: psychological safety, dependability, structure, meaning, and impact.",
            category: "Team Performance",
            rating: 4.7,
            views: "1.2M+ views",
            tags: ["psychological-safety", "performance", "google", "research"]
        }
    ],
    "STRATEGIC_THINKING": [
        { 
            id: "porter-strategy", 
            title: "What is Strategy?", 
            speaker: "Michael Porter", 
            duration: "15 min", 
            url: "https://www.youtube.com/watch?v=mYF2_FBCvXw", 
            description: "Harvard Business School's Michael Porter explains what strategy really is and why it's about being different, not just being the best.",
            category: "Strategy Fundamentals",
            rating: 4.8,
            views: "800K+ views",
            tags: ["strategy", "competitive-advantage", "positioning", "harvard"]
        }
    ]
};

/**
 * LeadershipVideosScreen Component
 * Displays curated lists of leadership videos categorized as Inspirational/Philosophical and Actionable/Practical.
 * Pulls video data from the VIDEO_CATALOG in useAppServices, with a local fallback.
 */
const LeadershipVideosScreen = () => {
    // --- Consume services ---
    // Get navigate function and VIDEO_CATALOG data
    const { navigate, VIDEO_CATALOG } = useAppServices(); // cite: useAppServices.jsx

    // --- Effect to scroll to top on mount ---
    useEffect(() => {
        // Ensure this runs only client-side
        if (typeof window !== 'undefined') {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, []); // Empty dependency array ensures it runs only once on mount

    // --- Determine Video Data Source ---
    // Use VIDEO_CATALOG from services if available and valid, otherwise use local fallback
    // Assumes VIDEO_CATALOG structure is { items: { INSPIRATIONAL: [...], ACTIONABLE: [...] } }
    const VIDEO_LISTS = useMemo(() => {
        const catalogItems = VIDEO_CATALOG?.items;
        // Basic validation: Check if catalogItems is an object with the expected keys
        if (catalogItems && typeof catalogItems === 'object' && catalogItems.INSPIRATIONAL && catalogItems.ACTIONABLE) {
            return catalogItems;
        } else {
            console.warn("[LeadershipVideos] VIDEO_CATALOG from services is missing or invalid. Using enhanced catalog."); // Log warning
            return ENHANCED_VIDEO_CATALOG;
        }
    }, [VIDEO_CATALOG]); // Dependency: VIDEO_CATALOG

    // --- Enhanced State Management ---
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('ALL');
    const [selectedTag, setSelectedTag] = useState('');

    // --- Get Enhanced Video Data ---
    const allVideos = useMemo(() => {
        const videos = [];
        // Use enhanced catalog first, fallback to service data
        const dataSource = ENHANCED_VIDEO_CATALOG;
        Object.keys(dataSource).forEach(category => {
            dataSource[category].forEach(video => {
                videos.push({ ...video, categoryKey: category });
            });
        });
        return videos;
    }, []);
    
    // Get all unique tags for filter dropdown
    const allTags = useMemo(() => {
        const tags = new Set();
        allVideos.forEach(video => {
            video.tags?.forEach(tag => tags.add(tag));
        });
        return Array.from(tags).sort();
    }, [allVideos]);
    
    // Get unique categories
    const categories = useMemo(() => {
        return ['ALL', ...Object.keys(ENHANCED_VIDEO_CATALOG)];
    }, []);
    
    // --- Enhanced Filtering Logic ---
    const filteredVideos = useMemo(() => {
        let videos = selectedCategory === 'ALL' ? allVideos 
                   : allVideos.filter(video => video.categoryKey === selectedCategory);
        
        // Apply search filter
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            videos = videos.filter(video => 
                video.title.toLowerCase().includes(term) ||
                video.speaker.toLowerCase().includes(term) ||
                video.description.toLowerCase().includes(term) ||
                video.category?.toLowerCase().includes(term) ||
                video.tags?.some(tag => tag.toLowerCase().includes(term))
            );
        }
        
        // Apply tag filter
        if (selectedTag) {
            videos = videos.filter(video => 
                video.tags?.includes(selectedTag)
            );
        }
        
        return videos;
    }, [selectedCategory, searchTerm, selectedTag, allVideos]);

    // --- Legacy video arrays for backward compatibility ---
    const inspirationalVideos = useMemo(() => VIDEO_LISTS?.INSPIRATIONAL || [], [VIDEO_LISTS]);
    const actionableVideos = useMemo(() => VIDEO_LISTS?.ACTIONABLE || [], [VIDEO_LISTS]);

    return (
        <div className="p-3 sm:p-4 lg:p-6 md:p-10 min-h-screen" style={{ background: COLORS.BG }}>
            {/* Back Button */}
            <Button onClick={() => navigate('library')} variant="nav-back" size="sm" className="mb-6">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Library
            </Button>
            
            {/* Header */}
            <header className='flex items-center gap-4 border-b-2 pb-3 mb-8' style={{borderColor: COLORS.NAVY+'30'}}>
                <Film className='w-10 h-10 flex-shrink-0' style={{color: COLORS.NAVY}}/>
                <div>
                    <h1 className="text-xl sm:text-2xl sm:text-3xl md:text-4xl font-extrabold" style={{ color: COLORS.NAVY }}>
                        Leadership Video Library
                    </h1>
                    <p className="text-md" style={{ color: COLORS.NAVY + '80' }}>
                        Curated content for leaders at every level
                    </p>
                </div>
            </header>

            {/* Search and Filter Controls */}
            <div className="mb-8 space-y-4">
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                    {/* Search Input */}
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: COLORS.NAVY + '60' }} />
                        <input
                            type="text"
                            placeholder="Search videos, speakers, topics..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent"
                            style={{ 
                                borderColor: COLORS.NAVY + '30',
                                focusRingColor: COLORS.TEAL + '50'
                            }}
                        />
                    </div>
                    
                    {/* Category Filter */}
                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="px-3 py-2 border rounded-lg"
                        style={{ borderColor: COLORS.NAVY + '30' }}
                    >
                        {categories.map(cat => (
                            <option key={cat} value={cat}>
                                {cat === 'ALL' ? 'All Categories' : cat.replace('_', ' ')}
                            </option>
                        ))}
                    </select>
                    
                    {/* Tag Filter */}
                    <select
                        value={selectedTag}
                        onChange={(e) => setSelectedTag(e.target.value)}
                        className="px-3 py-2 border rounded-lg"
                        style={{ borderColor: COLORS.NAVY + '30' }}
                    >
                        <option value="">All Tags</option>
                        {allTags.map(tag => (
                            <option key={tag} value={tag}>
                                {tag.replace('-', ' ')}
                            </option>
                        ))}
                    </select>
                </div>
                
                {/* Results Summary */}
                <div className="flex items-center justify-between text-sm" style={{ color: COLORS.NAVY + '80' }}>
                    <span>
                        {filteredVideos.length} video{filteredVideos.length !== 1 ? 's' : ''} found
                    </span>
                    {(searchTerm || selectedTag || selectedCategory !== 'ALL') && (
                        <button
                            onClick={() => {
                                setSearchTerm('');
                                setSelectedTag('');
                                setSelectedCategory('ALL');
                            }}
                            className="text-sm underline hover:no-underline"
                            style={{ color: COLORS.TEAL }}
                        >
                            Clear filters
                        </button>
                    )}
                </div>
            </div>

            {/* Enhanced Video Grid */}
            {filteredVideos.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:p-4 lg:p-6 mb-12">
                    {filteredVideos.map((video) => (
                        <VideoCard
                            key={video.id}
                            title={video.title}
                            speaker={video.speaker}
                            duration={video.duration}
                            url={video.url}
                            description={video.description}
                            category={video.category}
                            rating={video.rating}
                            views={video.views}
                            tags={video.tags}
                            accent="TEAL"
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-12">
                    <p className="text-lg mb-2" style={{ color: COLORS.NAVY + '60' }}>
                        No videos found matching your criteria
                    </p>
                    <p className="text-sm" style={{ color: COLORS.NAVY + '40' }}>
                        Try adjusting your search terms or filters
                    </p>
                </div>
            )}

            {/* --- SECTION 1: INSPIRATIONAL & PHILOSOPHY --- */}
            <section className="mb-12">
                {/* Section Header with Accent */}
                <h2 className="text-2xl md:text-xl sm:text-2xl sm:text-3xl font-bold mb-6 border-l-4 pl-3 flex items-center gap-3"
                    style={{ color: COLORS.NAVY, borderColor: COLORS.ORANGE }}>
                    <Zap className='w-6 h-6' style={{color: COLORS.ORANGE}}/> Philosophical Insights & Mindset
                </h2>
                {/* Video Grid */}
                {inspirationalVideos.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:p-4 lg:p-6">
                        {inspirationalVideos.map((video, index) => (
                            <VideoCard
                                key={video.id || index} // Prefer unique ID if available
                                title={video.title}
                                speaker={video.speaker}
                                duration={video.duration}
                                url={video.url}
                                description={video.description}
                                accent="ORANGE" // Use ORANGE accent for this section
                            />
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500 italic">No inspirational videos found.</p> // Empty state
                )}
            </section>

            {/* --- SECTION 2: ACTIONABLE & PRACTICAL --- */}
            <section>
                {/* Section Header with Accent */}
                <h2 className="text-2xl md:text-xl sm:text-2xl sm:text-3xl font-bold mb-6 border-l-4 pl-3 flex items-center gap-3"
                    style={{ color: COLORS.NAVY, borderColor: COLORS.TEAL }}>
                    <Briefcase className='w-6 h-6' style={{color: COLORS.TEAL}}/> Actionable Leadership Techniques
                </h2>
                {/* Video Grid */}
                {actionableVideos.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:p-4 lg:p-6">
                        {actionableVideos.map((video, index) => (
                            <VideoCard
                                key={video.id || index} // Prefer unique ID
                                title={video.title}
                                speaker={video.speaker}
                                duration={video.duration}
                                url={video.url}
                                description={video.description}
                                accent="TEAL" // Use TEAL accent for this section
                            />
                        ))}
                    </div>
                 ) : (
                    <p className="text-gray-500 italic">No actionable technique videos found.</p> // Empty state
                )}
            </section>


        </div>
    );
};

export default LeadershipVideosScreen;