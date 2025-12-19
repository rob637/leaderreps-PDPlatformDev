import React, { useState, useEffect, useMemo } from 'react';
import PageLayout from '../../ui/PageLayout.jsx';
import { useAppServices } from '../../../services/useAppServices.jsx';
import { useContentAccess } from '../../../hooks/useContentAccess';
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import { UNIFIED_COLLECTION } from '../../../services/unifiedContentService';
import { CONTENT_COLLECTIONS } from '../../../services/contentService';
import { Loader, FileText, Video, Link as LinkIcon, Download, Search, SlidersHorizontal, Wrench, ExternalLink, Lock } from 'lucide-react';
import { TierBadge, SkillTag } from '../../ui/ContentBadges.jsx';
import SkillFilter from '../../ui/SkillFilter.jsx';
import UniversalResourceViewer from '../../ui/UniversalResourceViewer.jsx';

const ToolsIndex = () => {
  const { db } = useAppServices();
  const { isContentUnlocked } = useContentAccess();
  const [tools, setTools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedTool, setSelectedTool] = useState(null);

  useEffect(() => {
    const loadTools = async () => {
      try {
        // 1. Fetch Unified Tools
        const unifiedQuery = query(collection(db, UNIFIED_COLLECTION), where('type', '==', 'TOOL'));
        const unifiedSnapshot = await getDocs(unifiedQuery);
        const unifiedItems = unifiedSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), source: 'unified' }));

        // 2. Fetch Legacy Documents (Wrapper) - Treat as Tools
        const legacyQuery = query(collection(db, CONTENT_COLLECTIONS.DOCUMENTS));
        const legacySnapshot = await getDocs(legacyQuery);
        const legacyItems = legacySnapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data(), 
          type: 'TOOL', // Normalize type
          metadata: { ...doc.data().metadata, toolType: 'DOCUMENT' }, // Ensure toolType exists
          source: 'legacy' 
        }));

        // 3. Merge
        const allItems = [...unifiedItems, ...legacyItems];
        setTools(allItems);
      } catch (error) {
        console.error("Error loading tools:", error);
      } finally {
        setLoading(false);
      }
    };

    loadTools();
  }, [db]);

  const getIcon = (toolType) => {
    if (toolType === 'VIDEO_RESOURCE') return <Video className="w-5 h-5" />;
    if (toolType === 'ARTICLE') return <LinkIcon className="w-5 h-5" />;
    return <FileText className="w-5 h-5" />;
  };

  const getColor = (toolType) => {
    if (toolType === 'VIDEO_RESOURCE') return { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200' };
    if (toolType === 'ARTICLE') return { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-200' };
    return { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' };
  };

  // Filter tools
  const filteredTools = useMemo(() => {
    let result = tools;
    
    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(t => 
        t.title?.toLowerCase().includes(q) || 
        t.description?.toLowerCase().includes(q)
      );
    }
    
    // Skills filter
    if (selectedSkills.length > 0) {
      result = result.filter(t => 
        t.skills?.some(skill => {
          const skillId = typeof skill === 'object' ? skill.id : skill;
          return selectedSkills.includes(skillId);
        })
      );
    }
    
    // Type filter
    if (typeFilter !== 'all') {
      result = result.filter(t => t.metadata?.toolType === typeFilter);
    }
    
    // Access Control Filter REMOVED to show locked content
    // result = result.filter(t => {
    //   if (t.isHiddenUntilUnlocked) {
    //     return isContentUnlocked(t);
    //   }
    //   return true;
    // });

    return result;
  }, [tools, searchQuery, selectedSkills, typeFilter, isContentUnlocked]);

  // Group by type for display
  const toolTypes = useMemo(() => {
    const types = new Set();
    tools.forEach(t => {
      if (t.metadata?.toolType) types.add(t.metadata.toolType);
    });
    return ['all', ...Array.from(types)];
  }, [tools]);

  return (
    <PageLayout title="Tools & Templates" breadcrumbs={[
      { label: 'Home', path: 'dashboard' },
      { label: 'Library', path: 'library' },
      { label: 'Tools', path: null }
    ]}>
      {selectedTool && (
        <UniversalResourceViewer 
          resource={selectedTool} 
          onClose={() => setSelectedTool(null)} 
        />
      )}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl p-8 text-white mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
              <Wrench className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Tools & Templates</h1>
              <p className="text-blue-100">Practical resources for execution</p>
            </div>
          </div>
          <p className="text-blue-100 text-lg max-w-2xl">
            Templates, frameworks, and reference materials you can use immediately in your leadership practice.
          </p>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search tools..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
            />
          </div>
          
          {/* Type Quick Filter */}
          <div className="flex gap-1 p-1 bg-slate-100 rounded-xl overflow-x-auto">
            {toolTypes.map(type => (
              <button
                key={type}
                onClick={() => setTypeFilter(type)}
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                  typeFilter === type 
                    ? 'bg-white shadow text-slate-800' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {type === 'all' ? 'All' : type.replace('_', ' ')}
              </button>
            ))}
          </div>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-colors ${
              showFilters || selectedSkills.length > 0
                ? 'bg-blue-50 border-blue-200 text-blue-700'
                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
            }`}
          >
            <SlidersHorizontal className="w-5 h-5" />
            <span className="font-medium hidden sm:inline">Skills</span>
            {selectedSkills.length > 0 && (
              <span className="bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
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
          {loading ? 'Loading...' : `${filteredTools.length} tool${filteredTools.length !== 1 ? 's' : ''}`}
        </div>
        
        {loading ? (
          <div className="flex justify-center p-12">
            <Loader className="animate-spin text-blue-600 w-8 h-8" />
          </div>
        ) : filteredTools.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center">
            <Wrench className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">No tools found matching your criteria.</p>
            {(searchQuery || selectedSkills.length > 0 || typeFilter !== 'all') && (
              <button 
                onClick={() => { setSearchQuery(''); setSelectedSkills([]); setTypeFilter('all'); }}
                className="mt-4 text-blue-600 font-medium hover:text-blue-800"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="divide-y divide-slate-100">
              {filteredTools.map((tool) => {
                const colors = getColor(tool.metadata?.toolType);
                const isUnlocked = isContentUnlocked(tool);
                
                return (
                  <div 
                    key={tool.id} 
                    className={`p-5 transition-colors group relative ${
                      isUnlocked ? 'hover:bg-slate-50' : 'opacity-75'
                    }`}
                  >
                    {!isUnlocked && (
                      <div className="absolute inset-0 bg-slate-50/50 backdrop-blur-[1px] z-10 flex items-center justify-center">
                        <div className="bg-white/90 p-2 rounded-full shadow-sm border border-slate-200">
                          <Lock className="w-5 h-5 text-slate-400" />
                        </div>
                      </div>
                    )}

                    <div className="flex items-start gap-4">
                      {/* Type Icon */}
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${colors.bg} ${colors.text}`}>
                        {getIcon(tool.metadata?.toolType)}
                      </div>
                      
                      {/* Content */}
                      <div className="flex-grow min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                              {tool.title}
                            </h3>
                            <p className="text-sm text-slate-500 line-clamp-2 mt-1">
                              {tool.description}
                            </p>
                          </div>
                          
                          {/* Tier Badge */}
                          {tool.tier && (
                            <TierBadge tier={tool.tier} size="sm" />
                          )}
                        </div>
                        
                        {/* Skills */}
                        {tool.skills?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-3">
                            {tool.skills.slice(0, 4).map(skill => (
                              <SkillTag key={skill} skill={skill.replace('skill_', '')} size="xs" />
                            ))}
                          </div>
                        )}
                      </div>
                      
                      {/* Action */}
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isUnlocked) {
                            const resourceUrl = tool.metadata?.url || tool.url || tool.fileUrl;
                            setSelectedTool({
                              ...tool,
                              url: resourceUrl
                            });
                          }
                        }}
                        disabled={!isUnlocked}
                        className={`p-2 rounded-lg transition-colors flex-shrink-0 ${
                          isUnlocked 
                            ? 'text-slate-400 hover:bg-blue-50 hover:text-blue-600 cursor-pointer' 
                            : 'text-slate-300 cursor-not-allowed'
                        }`}
                        title="Open Tool"
                      >
                        {getIcon(tool.metadata?.toolType)}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default ToolsIndex;
