// src/components/screens/LeadershipVideos.jsx (Refactored for Consistency)

import React, { useEffect, useMemo, useState } from 'react';
// --- Icons ---
import { Film, User, Clock, ArrowRight, Zap, Briefcase, ArrowLeft, Search, Filter, Play, BookOpen, Users, Target, Lightbulb, TrendingUp, Star } from 'lucide-react';
// --- Core Services & Context ---
import { useAppServices } from '../../services/useAppServices.jsx'; // cite: useAppServices.jsx
import { getVideos } from '../../services/contentService.js'; // NEW: Load from CMS
import { logWidthMeasurements } from '../../utils/debugWidth.js';

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
  if (variant === 'primary') baseStyle += ` bg-[#47A88D] text-white shadow-lg hover:bg-[#47A88D] focus:ring-[#47A88D]/50`;
  else if (variant === 'secondary') baseStyle += ` bg-[#E04E1B] text-white shadow-lg hover:bg-[#C33E12] focus:ring-[#E04E1B]/50`;
  else if (variant === 'outline') baseStyle += ` bg-[#FFFFFF] text-[#47A88D] border-2 border-[#47A88D] shadow-md hover:bg-[#47A88D]/10 focus:ring-[#47A88D]/50`;
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

// --- ALL VIDEO DATA NOW LOADED FROM CMS (content_videos collection) ---
// Hardcoded fallback data removed - manage videos via Content Management

/**
 * LeadershipVideosScreen Component
 * Displays curated lists of leadership videos categorized as Inspirational/Philosophical and Actionable/Practical.
 * Pulls video data from the VIDEO_CATALOG in useAppServices, with a local fallback.
 */
const LeadershipVideosScreen = () => {
    // --- Consume services ---
    const { navigate, db, user } = useAppServices(); // cite: useAppServices.jsx

    // --- Load Videos from CMS ---
    const [cmsVideos, setCmsVideos] = useState([]);
    const [isLoadingCms, setIsLoadingCms] = useState(true);
    
    useEffect(() => {
        if (!db) return;
        
        const loadVideos = async () => {
            try {
                setIsLoadingCms(true);
                const userTier = user?.membershipData?.tier || 'premium';
                console.log('[LeadershipVideos] Loading with tier:', userTier);
                const videos = await getVideos(db, userTier);
                console.log('[LeadershipVideos] Loaded from CMS:', videos.length, 'videos');
                setCmsVideos(videos);
            } catch (error) {
                console.error('[LeadershipVideos] Error loading from CMS:', error);
            } finally {
                setIsLoadingCms(false);
            }
        };
        
        loadVideos();
    }, [db, user]);

    // --- Effect to scroll to top on mount ---
    useEffect(() => {
        // Ensure this runs only client-side
        if (typeof window !== 'undefined') {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
        logWidthMeasurements('LeadershipVideos');
    }, []); // Empty dependency array ensures it runs only once on mount

    // --- Convert CMS videos to grouped format by category ---
    const VIDEO_LISTS = useMemo(() => {
        const grouped = {};
        cmsVideos.forEach(video => {
            const category = video.category || 'GENERAL';
            if (!grouped[category]) {
                grouped[category] = [];
            }
            grouped[category].push({
                id: video.id,
                title: video.title,
                speaker: video.metadata?.speaker || '',
                duration: video.metadata?.duration || '',
                url: video.url,
                description: video.description,
                category: video.category,
                rating: video.metadata?.rating || 4.5,
                views: video.metadata?.views || '',
                tags: video.metadata?.tags || []
            });
        });
        console.log('[LeadershipVideos] Loaded', cmsVideos.length, 'videos from CMS in', Object.keys(grouped).length, 'categories');
        return grouped;
    }, [cmsVideos]);

    // --- Enhanced State Management ---
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('ALL');
    const [selectedTag, setSelectedTag] = useState('');

    // --- Get Enhanced Video Data ---
    const allVideos = useMemo(() => {
        const videos = [];
        // Use CMS data (VIDEO_LISTS already has fallback logic)
        Object.keys(VIDEO_LISTS).forEach(category => {
            VIDEO_LISTS[category].forEach(video => {
                videos.push({ ...video, categoryKey: category });
            });
        });
        return videos;
    }, [VIDEO_LISTS]);
    
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
        return ['ALL', ...Object.keys(VIDEO_LISTS)];
    }, [VIDEO_LISTS]);
    
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

    // Get category display names and colors
    const categoryConfig = {
        'INSPIRATIONAL': { name: 'Philosophical Insights & Mindset', icon: Zap, color: 'ORANGE' },
        'ACTIONABLE': { name: 'Actionable Leadership Techniques', icon: Briefcase, color: 'TEAL' },
        'TEAM_BUILDING': { name: 'Team Building & Collaboration', icon: Users, color: 'NAVY' },
        'STRATEGIC_THINKING': { name: 'Strategic Thinking & Vision', icon: Lightbulb, color: 'ORANGE' },
    };
    
    // Get all video categories dynamically from CMS data
    const videoCategories = useMemo(() => {
        return Object.keys(VIDEO_LISTS).filter(cat => VIDEO_LISTS[cat].length > 0);
    }, [VIDEO_LISTS]);

    // Show loading if CMS data is still loading
    if (isLoadingCms) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: COLORS.BG }}>
                <div className="text-center">
                    <Film className="w-12 h-12 animate-pulse mb-4 mx-auto" style={{ color: COLORS.TEAL }} />
                    <p className="text-lg font-semibold" style={{ color: COLORS.NAVY }}>Loading Videos...</p>
                </div>
            </div>
        );
    }

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

            {/* --- DYNAMIC CATEGORY SECTIONS (with filtering applied) --- */}
            {/* Show filtered results if search/filter is active, otherwise show by category */}
            {(searchTerm || selectedTag || selectedCategory !== 'ALL') ? (
                // Filtered view
                filteredVideos.length > 0 ? (
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
                )
            ) : (
                // Category view (no filters active)
                <>
                {videoCategories.map((categoryKey, idx) => {
                const config = categoryConfig[categoryKey] || { 
                    name: categoryKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                    icon: Film,
                    color: 'TEAL'
                };
                const CategoryIcon = config.icon;
                const videos = VIDEO_LISTS[categoryKey] || [];
                
                return (
                    <section key={categoryKey} className={idx < videoCategories.length - 1 ? "mb-12" : ""}>
                        <h2 className="text-2xl md:text-xl sm:text-2xl sm:text-3xl font-bold mb-6 border-l-4 pl-3 flex items-center gap-3"
                            style={{ color: COLORS.NAVY, borderColor: COLORS[config.color] }}>
                            <CategoryIcon className='w-6 h-6' style={{color: COLORS[config.color]}} />
                            {config.name}
                        </h2>
                        {videos.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:p-4 lg:p-6">
                                {videos.map((video, index) => (
                                    <VideoCard
                                        key={video.id || index}
                                        title={video.title}
                                        speaker={video.speaker}
                                        duration={video.duration}
                                        url={video.url}
                                        description={video.description}
                                        accent={config.color}
                                    />
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500 italic">No videos found in this category.</p>
                        )}
                    </section>
                );
                })}
                </>
            )}


        </div>
    );
};

export default LeadershipVideosScreen;