import React, { useState, useEffect, useMemo } from 'react';
import PageLayout from '../../ui/PageLayout.jsx';
import { useAppServices } from '../../../services/useAppServices.jsx';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { Loader, Search, SlidersHorizontal } from 'lucide-react';
import { DifficultyBadge, DurationBadge, TierBadge, SkillTag } from '../../ui/ContentBadges.jsx';
import SkillFilter from '../../ui/SkillFilter.jsx';

const ProgramsIndex = () => {
  const { db, navigate } = useAppServices();
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'content'), where('type', '==', 'PROGRAM'));
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
        p.skills?.some(skill => selectedSkills.includes(skill))
      );
    }
    
    return result;
  }, [programs, searchQuery, selectedSkills]);

  return (
    <PageLayout title="Programs" breadcrumbs={[
      { label: 'Home', path: 'dashboard' },
      { label: 'Library', path: 'library' },
      { label: 'Programs', path: null }
    ]}>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPrograms.map((program) => (
              <div 
                key={program.id} 
                onClick={() => navigate('program-detail', { id: program.id, title: program.title })}
                className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:shadow-lg hover:border-indigo-300 transition-all cursor-pointer group flex flex-col h-full"
              >
                {/* Program Image/Header */}
                <div className="h-36 bg-gradient-to-br from-indigo-50 to-purple-100 flex items-center justify-center relative">
                  <span className="text-5xl font-bold text-indigo-200 group-hover:text-indigo-300 transition-colors">
                    {program.title?.charAt(0)}
                  </span>
                  {/* Tier Badge */}
                  {program.tier && (
                    <div className="absolute top-3 right-3">
                      <TierBadge tier={program.tier} size="xs" />
                    </div>
                  )}
                </div>
                
                {/* Content */}
                <div className="p-5 flex flex-col flex-grow">
                  <h3 className="font-bold text-lg text-slate-800 mb-2 group-hover:text-indigo-600 transition-colors">
                    {program.title}
                  </h3>
                  <p className="text-sm text-slate-500 mb-4 line-clamp-2 flex-grow">
                    {program.description}
                  </p>
                  
                  {/* Skills Tags */}
                  {program.skills?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {program.skills.slice(0, 3).map(skill => (
                        <SkillTag key={skill} skill={skill.replace('skill_', '')} size="xs" />
                      ))}
                      {program.skills.length > 3 && (
                        <span className="text-xs text-slate-400">+{program.skills.length - 3}</span>
                      )}
                    </div>
                  )}
                  
                  {/* Metadata Footer */}
                  <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <DurationBadge minutes={(program.metadata?.durationWeeks || 4) * 7 * 60} size="xs" />
                    <DifficultyBadge level={program.metadata?.difficulty || 'FOUNDATION'} size="xs" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default ProgramsIndex;
