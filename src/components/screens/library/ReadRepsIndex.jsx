import React, { useState, useEffect, useMemo } from 'react';
import PageLayout from '../../ui/PageLayout.jsx';
import { useAppServices } from '../../../services/useAppServices.jsx';
import { useContentAccess } from '../../../hooks/useContentAccess';
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import { UNIFIED_COLLECTION } from '../../../services/unifiedContentService';
import { CONTENT_COLLECTIONS } from '../../../services/contentService';
import { Loader, BookOpen, Search, SlidersHorizontal, User, Tag, Lock } from 'lucide-react';
import { DifficultyBadge, DurationBadge, TierBadge, SkillTag } from '../../ui/ContentBadges.jsx';
import SkillFilter from '../../ui/SkillFilter.jsx';

const ReadRepsIndex = () => {
  const { db, navigate } = useAppServices();
  const { isContentUnlocked } = useContentAccess();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('all');

  useEffect(() => {
    const loadBooks = async () => {
      try {
        // 1. Fetch Unified Read & Reps
        const unifiedQuery = query(collection(db, UNIFIED_COLLECTION), where('type', '==', 'READ_REP'));
        const unifiedSnapshot = await getDocs(unifiedQuery);
        const unifiedItems = unifiedSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), source: 'unified' }));

        // 2. Fetch Legacy Readings (Wrapper)
        const legacyQuery = query(collection(db, CONTENT_COLLECTIONS.READINGS));
        const legacySnapshot = await getDocs(legacyQuery);
        const legacyItems = legacySnapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data(), 
          type: 'READ_REP', // Normalize type
          source: 'legacy' 
        }));

        // 3. Merge
        const allItems = [...unifiedItems, ...legacyItems];
        setBooks(allItems);
      } catch (error) {
        console.error("Error loading books:", error);
      } finally {
        setLoading(false);
      }
    };

    loadBooks();
  }, [db]);

  // Get unique categories
  const categories = useMemo(() => {
    const cats = new Set();
    books.forEach(b => {
      if (b.metadata?.category) cats.add(b.metadata.category);
    });
    return ['all', ...Array.from(cats).sort()];
  }, [books]);

  // Filter books
  const filteredBooks = useMemo(() => {
    let result = books;
    
    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(b => 
        b.title?.toLowerCase().includes(q) || 
        b.description?.toLowerCase().includes(q) ||
        b.metadata?.author?.toLowerCase().includes(q)
      );
    }
    
    // Skills filter
    if (selectedSkills.length > 0) {
      result = result.filter(b => 
        b.skills?.some(skill => {
          const skillId = typeof skill === 'object' ? skill.id : skill;
          return selectedSkills.includes(skillId);
        })
      );
    }
    
    // Category filter
    if (categoryFilter !== 'all') {
      result = result.filter(b => b.metadata?.category === categoryFilter);
    }
    
    // Access Control Filter: Only show unlocked content (Progressive Disclosure)
    result = result.filter(b => {
      if (b.isHiddenUntilUnlocked) {
        return isContentUnlocked(b);
      }
      return true;
    });

    return result;
  }, [books, searchQuery, selectedSkills, categoryFilter, isContentUnlocked]);

  return (
    <PageLayout title="Read & Reps" breadcrumbs={[
      { label: 'Home', path: 'dashboard' },
      { label: 'Library', path: 'library' },
      { label: 'Read & Reps', path: null }
    ]}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-8 text-white mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
              <BookOpen className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Read & Reps</h1>
              <p className="text-emerald-100">Book-based learning & reflection</p>
            </div>
          </div>
          <p className="text-emerald-100 text-lg max-w-2xl">
            Curated book summaries and reading guides with structured reflection exercises to apply what you learn.
          </p>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search books, authors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition-all"
            />
          </div>
          
          {/* Category Filter */}
          {categories.length > 2 && (
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-600 focus:border-emerald-400 outline-none"
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
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
            }`}
          >
            <SlidersHorizontal className="w-5 h-5" />
            <span className="font-medium hidden sm:inline">Skills</span>
            {selectedSkills.length > 0 && (
              <span className="bg-emerald-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
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
          {loading ? 'Loading...' : `${filteredBooks.length} book${filteredBooks.length !== 1 ? 's' : ''}`}
        </div>
        
        {loading ? (
          <div className="flex justify-center p-12">
            <Loader className="animate-spin text-emerald-600 w-8 h-8" />
          </div>
        ) : filteredBooks.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center">
            <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">No books found matching your criteria.</p>
            {(searchQuery || selectedSkills.length > 0 || categoryFilter !== 'all') && (
              <button 
                onClick={() => { setSearchQuery(''); setSelectedSkills([]); setCategoryFilter('all'); }}
                className="mt-4 text-emerald-600 font-medium hover:text-emerald-800"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredBooks.map((book) => {
              const isUnlocked = isContentUnlocked(book);
              
              return (
              <div 
                key={book.id} 
                onClick={() => isUnlocked ? navigate('read-rep-detail', { id: book.id, title: book.title }) : null}
                className={`bg-white border rounded-xl overflow-hidden transition-all group flex flex-col h-full relative ${
                  isUnlocked 
                    ? 'border-slate-200 hover:shadow-lg hover:border-emerald-300 cursor-pointer' 
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

                {/* Book Cover */}
                <div className="h-48 bg-gradient-to-br from-slate-100 to-slate-200 relative overflow-hidden group-hover:shadow-inner transition-all">
                  {(book.details?.coverUrl || book.metadata?.coverUrl || book.coverUrl) ? (
                    <img 
                      src={book.details?.coverUrl || book.metadata?.coverUrl || book.coverUrl} 
                      alt={book.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <BookOpen className="w-16 h-16 text-slate-300 group-hover:text-emerald-400 transition-colors" />
                    </div>
                  )}
                  
                  {/* Category Badge */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                    <span className="inline-flex items-center gap-1 text-white text-xs font-bold">
                      <Tag className="w-3 h-3" />
                      {book.metadata?.category || 'General'}
                    </span>
                  </div>
                  
                  {/* Tier Badge */}
                  {book.tier && (
                    <div className="absolute top-3 right-3">
                      <TierBadge tier={book.tier} size="xs" />
                    </div>
                  )}
                </div>
                
                {/* Content */}
                <div className="p-4 flex flex-col flex-grow">
                  <h3 className="font-bold text-slate-800 line-clamp-2 mb-1 group-hover:text-emerald-600 transition-colors">
                    {book.title}
                  </h3>
                  
                  {book.metadata?.author && (
                    <p className="text-sm text-slate-500 flex items-center gap-1 mb-2">
                      <User className="w-3 h-3" />
                      {book.metadata.author}
                    </p>
                  )}
                  
                  <p className="text-xs text-slate-400 line-clamp-2 flex-grow mb-3">
                    {book.description}
                  </p>
                  
                  {/* Skills */}
                  {book.skills?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {book.skills.slice(0, 2).map(skill => (
                        <SkillTag key={skill} skill={skill.replace('skill_', '')} size="xs" />
                      ))}
                    </div>
                  )}
                  
                  {/* Metadata */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-auto">
                    <DurationBadge minutes={book.metadata?.readingTimeMin || 30} size="xs" />
                    <DifficultyBadge level={book.metadata?.difficulty || 'FOUNDATION'} size="xs" />
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

export default ReadRepsIndex;
