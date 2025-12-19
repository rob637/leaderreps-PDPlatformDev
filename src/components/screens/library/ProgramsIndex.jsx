import React, { useState, useEffect, useMemo } from 'react';
import PageLayout from '../../ui/PageLayout.jsx';
import { useAppServices } from '../../../services/useAppServices.jsx';
import { useContentAccess } from '../../../hooks/useContentAccess';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { UNIFIED_COLLECTION } from '../../../services/unifiedContentService';
import { Loader, Search, SlidersHorizontal, Lock } from 'lucide-react';
import { DifficultyBadge, DurationBadge, TierBadge, SkillTag } from '../../ui/ContentBadges.jsx';
import SkillFilter from '../../ui/SkillFilter.jsx';

const ProgramsIndex = () => {
  const { db, navigate } = useAppServices();
  const { isContentUnlocked } = useContentAccess();
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const q = query(collection(db, UNIFIED_COLLECTION), where('type', '==', 'PROGRAM'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPrograms(items);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [db]);

  // Filter programs based on search and skills
  const filteredPrograms = useMemo(() => {
    let result = programs;
    
    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p => 
        p.title?.toLowerCase().includes(q) || 
        p.description?.toLowerCase().includes(q)
      );
    }
    
    // Skills filter
    if (selectedSkills.length > 0) {
      result = result.filter(p => 
        p.skills?.some(skill => {
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
  }, [programs, searchQuery, selectedSkills, isContentUnlocked]);

  return (
    <PageLayout 
      title="Programs" 
      subtitle="Structured learning paths to master specific leadership capabilities."
      breadcrumbs={[
        { label: 'Home', path: 'dashboard' },
        { label: 'Content', path: 'library' },
        { label: 'Programs', path: null }
      ]}
      backTo="library"
      navigate={navigate}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-white mb-8">
          <h1 className="text-3xl font-bold mb-2">Programs</h1>
          <p className="text-indigo-100 text-lg max-w-2xl">
            Structured, sequential learning paths designed to build leadership capabilities over weeks.
          </p>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search programs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-colors ${
              showFilters || selectedSkills.length > 0
                ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
            }`}
          >
            <SlidersHorizontal className="w-5 h-5" />
            <span className="font-medium">Filters</span>
            {selectedSkills.length > 0 && (
              <span className="bg-indigo-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
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
          {loading ? 'Loading...' : `${filteredPrograms.length} program${filteredPrograms.length !== 1 ? 's' : ''}`}
        </div>
        
        {loading ? (
          <div className="flex justify-center p-12">
            <Loader className="animate-spin text-indigo-600 w-8 h-8" />
          </div>
        ) : filteredPrograms.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center">
            <p className="text-slate-500">No programs found matching your criteria.</p>
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
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="divide-y divide-slate-100">
            {filteredPrograms.map((program) => {
              const isUnlocked = isContentUnlocked(program);
              
              return (
              <div 
                key={program.id} 
                onClick={() => {
                  if (isUnlocked) {
                    navigate('program-detail', { id: program.id, title: program.title });
                  }
                }}
                className={`p-5 transition-all group relative ${
                  isUnlocked 
                    ? 'hover:bg-slate-50 cursor-pointer' 
                    : 'bg-slate-50/50 opacity-75 cursor-not-allowed'
                }`}
              >
                {/* Lock Overlay */}
                {!isUnlocked && (
                  <div className="absolute right-4 top-4 z-10">
                    <Lock className="w-5 h-5 text-slate-400" />
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Program Image/Header */}
                  <div className="w-24 h-24 bg-gradient-to-br from-indigo-50 to-purple-100 rounded-xl flex items-center justify-center relative overflow-hidden flex-shrink-0">
                    {(program.coverUrl || program.image || program.thumbnail) ? (
                      <img 
                        src={program.coverUrl || program.image || program.thumbnail} 
                        alt={program.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <span className="text-3xl font-bold text-indigo-200 group-hover:text-indigo-300 transition-colors">
                        {program.title?.charAt(0)}
                      </span>
                    )}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-grow">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-bold text-lg text-slate-800 group-hover:text-indigo-600 transition-colors">
                          {program.title}
                        </h3>
                        <p className="text-sm text-slate-500 line-clamp-2 mt-1">
                          {program.description}
                        </p>
                      </div>
                      
                      {/* Tier Badge */}
                      {program.tier && (
                        <TierBadge tier={program.tier} size="sm" />
                      )}
                    </div>
                    
                    {/* Metadata Row */}
                    <div className="flex flex-wrap items-center gap-3 mt-4">
                      <DurationBadge minutes={(program.metadata?.durationWeeks || 4) * 7 * 60} />
                      <DifficultyBadge level={program.metadata?.difficulty || 'FOUNDATION'} />
                      
                      {/* Skills Tags */}
                      {program.skills?.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {program.skills.slice(0, 3).map(skill => (
                            <SkillTag key={skill.id || skill} skill={skill.title || skill.replace('skill_', '')} size="sm" />
                          ))}
                          {program.skills.length > 3 && (
                            <span className="text-xs text-slate-400">+{program.skills.length - 3}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
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

export default ProgramsIndex;
