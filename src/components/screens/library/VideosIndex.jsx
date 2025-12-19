import React, { useState, useEffect, useMemo } from 'react';
import PageLayout from '../../ui/PageLayout.jsx';
import { useAppServices } from '../../../services/useAppServices.jsx';
import { useContentAccess } from '../../../hooks/useContentAccess';
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import { UNIFIED_COLLECTION } from '../../../services/unifiedContentService';
import { CONTENT_COLLECTIONS } from '../../../services/contentService';
import { Loader, Film, Search, SlidersHorizontal, User, Tag, Lock, Play, Clock, ExternalLink } from 'lucide-react';
import { DifficultyBadge, DurationBadge, TierBadge, SkillTag } from '../../ui/ContentBadges.jsx';
import SkillFilter from '../../ui/SkillFilter.jsx';
import UniversalResourceViewer from '../../ui/UniversalResourceViewer.jsx';

const VideosIndex = () => {
  const { db, navigate } = useAppServices();
  const { isContentUnlocked } = useContentAccess();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedVideo, setSelectedVideo] = useState(null);

  useEffect(() => {
    const loadVideos = async () => {
      try {
        // 1. Fetch Unified Videos
        const unifiedQuery = query(collection(db, UNIFIED_COLLECTION), where('type', '==', 'VIDEO'));
        const unifiedSnapshot = await getDocs(unifiedQuery);
        const unifiedItems = unifiedSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), source: 'unified' }));

        // 2. Fetch Legacy Videos (Wrapper)
        const legacyQuery = query(collection(db, CONTENT_COLLECTIONS.VIDEOS));
        const legacySnapshot = await getDocs(legacyQuery);
        const legacyItems = legacySnapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data(), 
          type: 'VIDEO', // Normalize type
          source: 'legacy' 
        }));

        // 3. Merge and Deduplicate
        const allItems = [...unifiedItems, ...legacyItems];
        // Simple dedupe by ID if needed, but collections are distinct so just concat is fine usually
        
        setVideos(allItems);
      } catch (error) {
        console.error("Error loading videos:", error);
      } finally {
        setLoading(false);
      }
    };

    loadVideos();
  }, [db]);

  // Get unique categories
  const categories = useMemo(() => {
    const cats = new Set();
    videos.forEach(v => {
      if (v.metadata?.category) cats.add(v.metadata.category);
    });
    return ['all', ...Array.from(cats).sort()];
  }, [videos]);

  // Filter videos
  const filteredVideos = useMemo(() => {
    let result = videos;
    
    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(v => 
        v.title?.toLowerCase().includes(q) || 
        v.description?.toLowerCase().includes(q) ||
        v.metadata?.speaker?.toLowerCase().includes(q) ||
        v.metadata?.source?.toLowerCase().includes(q)
      );
    }
    
    // Skills filter
    if (selectedSkills.length > 0) {
      result = result.filter(v => 
        v.skills?.some(skill => {
          const skillId = typeof skill === 'object' ? skill.id : skill;
          return selectedSkills.includes(skillId);
        })
      );
    }
    
    // Category filter
    if (categoryFilter !== 'all') {
      result = result.filter(v => v.metadata?.category === categoryFilter);
    }
    
    // Access Control Filter: Only show unlocked content (Progressive Disclosure)
    // If an item is marked "Hidden Until Unlocked", hide it if not unlocked.
    // If it's public (default), show it.
    result = result.filter(v => {
      // If explicitly hidden until unlocked, check access
      if (v.isHiddenUntilUnlocked) {
        return isContentUnlocked(v);
      }
      // Otherwise show it (it might still be locked visually if we want, but user asked for "available when accessed")
      return true;
    });

    return result;
  }, [videos, searchQuery, selectedSkills, categoryFilter, isContentUnlocked]);

  // Extract YouTube thumbnail from URL
  const getYouTubeThumbnail = (url) => {
    if (!url) return null;
    const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (match) {
      return `https://img.youtube.com/vi/${match[1]}/mqdefault.jpg`;
    }
    return null;
  };

  // Handle video click - open in modal
  const handleVideoClick = (video) => {
    // Normalize video object for viewer
    const normalizedVideo = {
      ...video,
      url: video.url || video.videoUrl || video.link || video.metadata?.externalUrl,
      resourceType: 'video'
    };
    setSelectedVideo(normalizedVideo);
  };

  return (
    <PageLayout title="Videos" breadcrumbs={[
      { label: 'Home', path: 'dashboard' },
      { label: 'Library', path: 'library' },
      { label: 'Videos', path: null }
    ]}>
      {selectedVideo && (
        <UniversalResourceViewer 
          resource={selectedVideo} 
          onClose={() => setSelectedVideo(null)} 
        />
      )}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl p-8 text-white mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
              <Film className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Videos</h1>
              <p className="text-orange-100">Leadership talks & training</p>
            </div>
          </div>
          <p className="text-orange-100 text-lg max-w-2xl">
            Curated leadership videos from experts, TED talks, and training content to inspire and educate.
          </p>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search videos, speakers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none transition-all"
            />
          </div>
          
          {/* Category Filter */}
          {categories.length > 2 && (
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-600 focus:border-orange-400 outline-none"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat === 'all' ? 'All Categories' : cat}
                </option>
              ))}
            </select>
          )}
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-colors ${
              showFilters || selectedSkills.length > 0
                ? 'bg-orange-50 border-orange-200 text-orange-700'
                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
            }`}
          >
            <SlidersHorizontal className="w-5 h-5" />
            <span className="font-medium hidden sm:inline">Skills</span>
            {selectedSkills.length > 0 && (
              <span className="bg-orange-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {selectedSkills.length}
              </span>
            )}
          </button>
        </div>

        {/* Skill Filter Panel */}
        {showFilters && (
          <div className="mb-6">
            <SkillFilter 
              db={db} 
              selectedSkills={selectedSkills} 
              onSkillsChange={setSelectedSkills} 
            />
          </div>
        )}

        {/* Results Count */}
        <div className="text-sm text-slate-500 mb-4">
          {loading ? 'Loading...' : `${filteredVideos.length} video${filteredVideos.length !== 1 ? 's' : ''}`}
        </div>
        
        {loading ? (
          <div className="flex justify-center p-12">
            <Loader className="animate-spin text-orange-600 w-8 h-8" />
          </div>
        ) : filteredVideos.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center">
            <Film className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">No videos found matching your criteria.</p>
            {(searchQuery || selectedSkills.length > 0 || categoryFilter !== 'all') && (
              <button 
                onClick={() => { setSearchQuery(''); setSelectedSkills([]); setCategoryFilter('all'); }}
                className="mt-4 text-orange-600 font-medium hover:text-orange-800"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVideos.map((video) => {
              const isUnlocked = isContentUnlocked(video);
              const thumbnail = video.metadata?.thumbnail || getYouTubeThumbnail(video.metadata?.externalUrl);
              
              return (
                <div 
                  key={video.id} 
                  onClick={() => isUnlocked ? handleVideoClick(video) : null}
                  className={`bg-white border rounded-xl overflow-hidden transition-all group flex flex-col h-full relative ${
                    isUnlocked 
                      ? 'border-slate-200 hover:shadow-lg hover:border-orange-300 cursor-pointer' 
                      : 'border-slate-100 opacity-75 cursor-not-allowed'
                  }`}
                >
                  {!isUnlocked && (
                    <div className="absolute inset-0 bg-slate-50/50 backdrop-blur-[1px] z-10 flex items-center justify-center">
                      <div className="bg-white/90 p-3 rounded-full shadow-sm border border-slate-200">
                        <Lock className="w-6 h-6 text-slate-400" />
                      </div>
                    </div>
                  )}

                  {/* Video Thumbnail */}
                  <div className="aspect-video bg-gradient-to-br from-slate-800 to-slate-900 relative overflow-hidden">
                    {thumbnail ? (
                      <img 
                        src={thumbnail} 
                        alt={video.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Film className="w-16 h-16 text-slate-600 group-hover:text-orange-400 transition-colors" />
                      </div>
                    )}
                    
                    {/* Play Button Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center shadow-lg">
                        <Play className="w-8 h-8 text-white ml-1" fill="white" />
                      </div>
                    </div>
                    
                    {/* Duration Badge */}
                    {video.metadata?.durationMin && (
                      <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs font-medium px-2 py-1 rounded flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {video.metadata.durationMin}m
                      </div>
                    )}
                    
                    {/* Tier Badge */}
                    {video.tier && (
                      <div className="absolute top-2 right-2">
                        <TierBadge tier={video.tier} size="xs" />
                      </div>
                    )}
                    
                    {/* External Link Indicator */}
                    {video.metadata?.externalUrl && (
                      <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                        <ExternalLink className="w-3 h-3" />
                        External
                      </div>
                    )}
                  </div>
                  
                  {/* Content */}
                  <div className="p-4 flex flex-col flex-grow">
                    <h3 className="font-bold text-slate-800 line-clamp-2 mb-1 group-hover:text-orange-600 transition-colors">
                      {video.title}
                    </h3>
                    
                    {video.metadata?.speaker && (
                      <p className="text-sm text-slate-500 flex items-center gap-1 mb-2">
                        <User className="w-3 h-3" />
                        {video.metadata.speaker}
                      </p>
                    )}
                    
                    <p className="text-xs text-slate-400 line-clamp-2 flex-grow mb-3">
                      {video.description}
                    </p>
                    
                    {/* Category/Source */}
                    <div className="flex items-center gap-2 mb-3">
                      {video.metadata?.category && (
                        <span className="inline-flex items-center gap-1 text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                          <Tag className="w-3 h-3" />
                          {video.metadata.category}
                        </span>
                      )}
                      {video.metadata?.source && (
                        <span className="text-xs text-slate-400">
                          {video.metadata.source}
                        </span>
                      )}
                    </div>
                    
                    {/* Skills */}
                    {video.skills?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {video.skills.slice(0, 2).map(skill => (
                          <SkillTag key={skill} skill={skill.replace('skill_', '')} size="xs" />
                        ))}
                      </div>
                    )}
                    
                    {/* Metadata */}
                    <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-auto">
                      <DurationBadge minutes={video.metadata?.durationMin || 10} size="xs" />
                      <DifficultyBadge level={video.metadata?.difficulty || 'FOUNDATION'} size="xs" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default VideosIndex;
