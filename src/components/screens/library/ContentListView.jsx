import React, { useState, useEffect, useMemo } from 'react';
import PageLayout from '../../ui/PageLayout.jsx';
import { useAppServices } from '../../../services/useAppServices.jsx';
import { useContentAccess } from '../../../hooks/useContentAccess';
import { collection, query, where, onSnapshot, getDocs } from '../../../services/firebaseUtils';
import { UNIFIED_COLLECTION } from '../../../services/unifiedContentService';
import { Loader, Search, SlidersHorizontal, Lock, Zap } from 'lucide-react';
import SkillFilter from '../../ui/SkillFilter.jsx';
import { ContentListItem } from '../../ui/ContentListItem.jsx';

const ContentListView = ({ 
  type, 
  title, 
  subtitle, 
  icon: Icon, 
  detailRoute,
  indexRoute, // Optional: Explicitly define the index route (e.g., 'videos-index')
  color,
  bgColor
}) => {
  const { db, navigate } = useAppServices();
  const { isContentUnlocked } = useContentAccess();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    // Fetch from Unified Content Library
    // Query 1: Items with primary type match
    const typeQuery = query(
      collection(db, UNIFIED_COLLECTION), 
      where('type', '==', type), 
      where('status', '==', 'PUBLISHED')
    );
    
    // Query 2: Items with visibility array containing this type (cross-listed content)
    const visibilityQuery = query(
      collection(db, UNIFIED_COLLECTION),
      where('visibility', 'array-contains', type),
      where('status', '==', 'PUBLISHED')
    );

    // Set up real-time listener for primary type
    const unsubscribe = onSnapshot(typeQuery, async (typeSnapshot) => {
      const rawTypeItems = typeSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Filter out items that have explicitly opted out of this library via visibility settings
      const typeItems = rawTypeItems.filter(item => {
        // If visibility is defined, it must include the current type
        if (item.visibility && Array.isArray(item.visibility)) {
          return item.visibility.includes(type);
        }
        // If visibility is undefined/null, assume it belongs in its primary type library (legacy support)
        return true;
      });

      // Also fetch visibility-based items (one-time fetch, merged with real-time)
      try {
        const visibilitySnapshot = await getDocs(visibilityQuery);
        const visibilityItems = visibilitySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Merge and deduplicate
        const allItems = [...typeItems];
        const existingIds = new Set(typeItems.map(item => item.id));
        
        visibilityItems.forEach(item => {
          if (!existingIds.has(item.id)) {
            allItems.push(item);
          }
        });
        
        setItems(allItems);
      } catch (err) {
        console.error('Error fetching visibility items:', err);
        setItems(typeItems); // Fallback to type-only items
      }
      
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, [db, type]);

  // Filter items
  const filteredItems = useMemo(() => {
    let result = items;

    // Safety check: Ensure visibility rules are respected
    // This handles cases where items might have slipped through the initial fetch logic
    result = result.filter(item => {
      // If visibility is explicitly set as an array, it MUST include the current library type
      if (Array.isArray(item.visibility)) {
        return item.visibility.includes(type);
      }
      return true;
    });
    
    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(item => 
        item.title?.toLowerCase().includes(q) || 
        item.description?.toLowerCase().includes(q) ||
        item.metadata?.author?.toLowerCase().includes(q) ||
        item.metadata?.speaker?.toLowerCase().includes(q)
      );
    }
    
    // Skills filter
    if (selectedSkills.length > 0) {
      result = result.filter(item => 
        item.skills?.some(skill => {
          const skillId = typeof skill === 'object' ? skill.id : skill;
          return selectedSkills.includes(skillId);
        })
      );
    }
    
    // Sort: Active (unlocked) first, then Alphabetical
    result.sort((a, b) => {
      const aUnlocked = isContentUnlocked(a);
      const bUnlocked = isContentUnlocked(b);
      
      if (aUnlocked && !bUnlocked) return -1;
      if (!aUnlocked && bUnlocked) return 1;
      
      return (a.title || '').localeCompare(b.title || '');
    });
    
    return result;
  }, [items, searchQuery, selectedSkills, isContentUnlocked, type]);

  return (
    <PageLayout 
      title={title} 
      subtitle={subtitle}
      breadcrumbs={[
        { label: 'Home', path: 'dashboard' },
        { label: 'Content', path: 'library' },
        { label: title, path: null }
      ]}
      backTo="library"
      navigate={navigate}
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        
        {/* Hero Section */}
        <div className={`rounded-2xl p-8 text-white mb-8 shadow-lg bg-gradient-to-r ${
          type === 'PROGRAM' ? 'from-corporate-navy to-slate-700' :
          type === 'WORKOUT' ? 'from-corporate-orange to-amber-500' :
          type === 'READ_REP' ? 'from-corporate-navy to-slate-700' :
          type === 'VIDEO' ? 'from-corporate-orange to-amber-500' :
          type === 'TOOL' ? 'from-corporate-teal to-emerald-600' :
          type === 'DOCUMENT' ? 'from-corporate-navy to-slate-700' :
          'from-corporate-navy to-slate-700'
        }`}>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
              {Icon ? <Icon className="w-7 h-7" /> : <Zap className="w-7 h-7" />}
            </div>
            <div>
              <h1 className="text-3xl font-bold">{title}</h1>
              <p className="opacity-90">{subtitle}</p>
            </div>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder={`Search ${title.toLowerCase()}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-corporate-teal focus:ring-2 focus:ring-corporate-teal/20 outline-none transition-all"
            />
          </div>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-colors ${
              showFilters || selectedSkills.length > 0
                ? 'bg-corporate-teal/10 border-corporate-teal/30 text-corporate-teal'
                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
            }`}
          >
            <SlidersHorizontal className="w-5 h-5" />
            <span className="font-medium">Filters</span>
            {selectedSkills.length > 0 && (
              <span className="bg-corporate-teal text-white text-xs font-bold px-2 py-0.5 rounded-full">
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
          {loading ? 'Loading...' : `${filteredItems.length} item${filteredItems.length !== 1 ? 's' : ''}`}
        </div>
        
        {loading ? (
          <div className="flex justify-center p-12">
            <Loader className="animate-spin text-indigo-600 w-8 h-8" />
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center">
            <p className="text-slate-500">No content found matching your criteria.</p>
            {(searchQuery || selectedSkills.length > 0) && (
              <button 
                onClick={() => { setSearchQuery(''); setSelectedSkills([]); }}
                className="mt-4 text-indigo-600 font-medium hover:text-indigo-800"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filteredItems.map((item) => {
              const isUnlocked = isContentUnlocked(item);
              
              // Determine the correct detail route based on the item's actual type
              // This handles cross-listed items (e.g., a DOCUMENT showing in Videos list)
              const getDetailRoute = (itemType) => {
                switch (itemType) {
                  case 'VIDEO': return 'video-detail';
                  case 'DOCUMENT': return 'document-detail';
                  case 'TOOL': return 'tool-detail';
                  case 'READ_REP': return 'read-rep-detail';
                  case 'WORKOUT': return 'workout-detail';
                  case 'PROGRAM': return 'program-detail';
                  case 'SKILL': return 'skill-detail';
                  default: return detailRoute;
                }
              };
              
              const actualDetailRoute = getDetailRoute(item.type);
              
              return (
                <ContentListItem 
                  key={item.id}
                  {...item}
                  icon={Icon}
                  isUnlocked={isUnlocked}
                  color={color}
                  bgColor={bgColor}
                  onClick={() => {
                    if (isUnlocked && actualDetailRoute) {
                      // Determine the correct return path (index route)
                      // 1. Use explicit indexRoute prop if provided
                      // 2. Fallback to inferring from detailRoute (legacy behavior, though often incorrect for plural/singular)
                      const returnPath = indexRoute || detailRoute.replace('-detail', '-index');

                      navigate(actualDetailRoute, { 
                        id: item.id, 
                        title: item.title,
                        fromLibrary: {
                          title: title,
                          path: returnPath
                        }
                      });
                    }
                  }}
                />
              );
            })}
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default ContentListView;
