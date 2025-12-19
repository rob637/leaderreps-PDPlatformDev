import React, { useState, useEffect, useMemo } from 'react';
import PageLayout from '../../ui/PageLayout.jsx';
import { useAppServices } from '../../../services/useAppServices.jsx';
import { useContentAccess } from '../../../hooks/useContentAccess';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { UNIFIED_COLLECTION } from '../../../services/unifiedContentService';
import { Loader, Dumbbell, Search, SlidersHorizontal, ArrowRight, Lock } from 'lucide-react';
import { DifficultyBadge, DurationBadge, TierBadge, SkillTag } from '../../ui/ContentBadges.jsx';
import SkillFilter from '../../ui/SkillFilter.jsx';

const WorkoutsIndex = () => {
  const { db, navigate } = useAppServices();
  const { isContentUnlocked } = useContentAccess();
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [difficultyFilter, setDifficultyFilter] = useState('all');

  useEffect(() => {
    const q = query(collection(db, UNIFIED_COLLECTION), where('type', '==', 'WORKOUT'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setWorkouts(items);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [db]);

  // Filter workouts
  const filteredWorkouts = useMemo(() => {
    let result = workouts;
    
    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(w => 
        w.title?.toLowerCase().includes(q) || 
        w.description?.toLowerCase().includes(q)
      );
    }
    
    // Skills filter
    if (selectedSkills.length > 0) {
      result = result.filter(w => 
        w.skills?.some(skill => {
          const skillId = typeof skill === 'object' ? skill.id : skill;
          return selectedSkills.includes(skillId);
        })
      );
    }
    
    // Difficulty filter
    if (difficultyFilter !== 'all') {
      result = result.filter(w => 
        (w.metadata?.difficulty || 'General').toUpperCase() === difficultyFilter.toUpperCase()
      );
    }
    
    return result;
  }, [workouts, searchQuery, selectedSkills, difficultyFilter]);

  return (
    <PageLayout title="Workouts" breadcrumbs={[
      { label: 'Home', path: 'dashboard' },
      { label: 'Library', path: 'library' },
      { label: 'Workouts', path: null }
    ]}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl p-8 text-white mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
              <Dumbbell className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Workouts</h1>
              <p className="text-orange-100">Stand-alone training sessions</p>
            </div>
          </div>
          <p className="text-orange-100 text-lg max-w-2xl">
            Focused practice sessions leaders can jump into anytime. Each workout targets specific skills with structured exercises.
          </p>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search workouts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none transition-all"
            />
          </div>
          
          {/* Difficulty Quick Filter */}
          <div className="flex gap-1 p-1 bg-slate-100 rounded-xl">
            {['all', 'FOUNDATION', 'CORE', 'PRO'].map(level => (
              <button
                key={level}
                onClick={() => setDifficultyFilter(level)}
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  difficultyFilter === level 
                    ? 'bg-white shadow text-slate-800' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {level === 'all' ? 'All' : level.charAt(0) + level.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
          
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
          {loading ? 'Loading...' : `${filteredWorkouts.length} workout${filteredWorkouts.length !== 1 ? 's' : ''}`}
        </div>
        
        {loading ? (
          <div className="flex justify-center p-12">
            <Loader className="animate-spin text-orange-600 w-8 h-8" />
          </div>
        ) : filteredWorkouts.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center">
            <Dumbbell className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">No workouts found matching your criteria.</p>
            {(searchQuery || selectedSkills.length > 0 || difficultyFilter !== 'all') && (
              <button 
                onClick={() => { setSearchQuery(''); setSelectedSkills([]); setDifficultyFilter('all'); }}
                className="mt-4 text-orange-600 font-medium hover:text-orange-800"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredWorkouts.map((workout) => {
              const isUnlocked = isContentUnlocked(workout);
              
              return (
              <div 
                key={workout.id} 
                onClick={() => isUnlocked ? navigate('workout-detail', { id: workout.id, title: workout.title }) : null}
                className={`bg-white border rounded-xl p-5 transition-all group relative ${
                  isUnlocked 
                    ? 'border-slate-200 hover:shadow-lg hover:border-orange-300 cursor-pointer' 
                    : 'border-slate-100 opacity-75 cursor-not-allowed'
                }`}
              >
                {!isUnlocked && (
                  <div className="absolute inset-0 bg-slate-50/50 backdrop-blur-[1px] z-10 flex items-center justify-center rounded-xl">
                    <div className="bg-white/90 p-3 rounded-full shadow-sm border border-slate-200">
                      <Lock className="w-6 h-6 text-slate-400" />
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Icon */}
                  <div className="w-16 h-16 bg-orange-50 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-orange-100 transition-colors">
                    <Dumbbell className="w-8 h-8 text-orange-500" />
                  </div>
                  
                  {/* Content */}
                  <div className="flex-grow">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-bold text-lg text-slate-800 group-hover:text-orange-600 transition-colors">
                          {workout.title}
                        </h3>
                        <p className="text-sm text-slate-500 line-clamp-2 mt-1">
                          {workout.description}
                        </p>
                      </div>
                      
                      {/* Tier Badge */}
                      {workout.tier && (
                        <TierBadge tier={workout.tier} size="sm" />
                      )}
                    </div>
                    
                    {/* Metadata Row */}
                    <div className="flex flex-wrap items-center gap-3 mt-4">
                      <DurationBadge minutes={workout.metadata?.durationMin || 45} />
                      <DifficultyBadge level={workout.metadata?.difficulty || 'General'} />
                      
                      {/* Skills */}
                      {workout.skills?.slice(0, 3).map(skill => (
                        <SkillTag key={skill} skill={skill.replace('skill_', '')} size="sm" />
                      ))}
                    </div>
                  </div>
                  
                  {/* Action */}
                  <div className="flex items-center sm:self-center">
                    <button className="flex items-center gap-2 px-5 py-2.5 bg-orange-600 text-white font-bold rounded-lg hover:bg-orange-700 transition-colors whitespace-nowrap group-hover:shadow-md">
                      Start <ArrowRight className="w-4 h-4" />
                    </button>
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

export default WorkoutsIndex;
