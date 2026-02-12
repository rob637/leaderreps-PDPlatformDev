// src/components/screens/library/ContentGroupsListView.jsx
// Displays a list of content groups (Programs, Workouts, Skills) from system_lovs
// Clicking a group navigates to a detail page showing all content in that group

import React, { useState, useEffect, useMemo } from 'react';
import PageLayout from '../../ui/PageLayout.jsx';
import { useAppServices } from '../../../services/useAppServices.jsx';
import { useContentAccess } from '../../../hooks/useContentAccess';
import { Loader, Search, Lock, Zap, ChevronRight } from 'lucide-react';
import { getContentGroups, GROUP_TYPES } from '../../../services/contentGroupsService';

const ContentGroupsListView = ({ 
  groupType,  // GROUP_TYPES.PROGRAMS | GROUP_TYPES.WORKOUTS | GROUP_TYPES.SKILLS
  title, 
  subtitle, 
  icon: Icon, 
  detailRoute,  // Route to navigate when clicking a group
  color,
  bgColor
}) => {
  const { db, navigate } = useAppServices();
  const { isContentUnlocked } = useContentAccess();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        setLoading(true);
        const data = await getContentGroups(db, groupType);
        setGroups(data);
      } catch (error) {
        console.error(`Error fetching ${groupType}:`, error);
      } finally {
        setLoading(false);
      }
    };
    fetchGroups();
  }, [db, groupType]);

  // Filter groups by search
  const filteredGroups = useMemo(() => {
    let result = groups;
    
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(group => 
        group.label?.toLowerCase().includes(q) || 
        group.description?.toLowerCase().includes(q)
      );
    }
    
    // Sort: Unlocked first (based on lock/key), then by displayOrder
    result.sort((a, b) => {
      const aUnlocked = !a.isHiddenUntilUnlocked || isContentUnlocked(a);
      const bUnlocked = !b.isHiddenUntilUnlocked || isContentUnlocked(b);
      
      if (aUnlocked && !bUnlocked) return -1;
      if (!aUnlocked && bUnlocked) return 1;
      
      return (a.displayOrder || 0) - (b.displayOrder || 0);
    });
    
    return result;
  }, [groups, searchQuery, isContentUnlocked]);

  const handleGroupClick = (group) => {
    // Check if locked
    if (group.isHiddenUntilUnlocked && !isContentUnlocked(group)) {
      return; // Don't navigate if locked
    }
    navigate(detailRoute, { id: group.id, title: group.label });
  };

  // Determine gradient based on group type
  const getGradient = () => {
    switch (groupType) {
      case GROUP_TYPES.PROGRAMS: return 'from-indigo-600 to-purple-600';
      case GROUP_TYPES.WORKOUTS: return 'from-orange-500 to-red-500';
      case GROUP_TYPES.SKILLS: return 'from-teal-500 to-emerald-500';
      default: return 'from-slate-700 to-slate-900';
    }
  };

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
        <div className={`rounded-2xl p-8 text-white mb-8 shadow-lg bg-gradient-to-r ${getGradient()}`}>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 bg-white/20 dark:bg-slate-800/20 rounded-xl flex items-center justify-center">
              {Icon ? <Icon className="w-7 h-7" /> : <Zap className="w-7 h-7" />}
            </div>
            <div>
              <h1 className="text-3xl font-bold">{title}</h1>
              <p className="opacity-90">{subtitle}</p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="flex gap-4 mb-6">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder={`Search ${title.toLowerCase()}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-corporate-teal focus:border-transparent bg-white dark:bg-slate-800 shadow-sm"
            />
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center py-12">
            <Loader className="w-8 h-8 animate-spin text-corporate-teal" />
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredGroups.length === 0 && (
          <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              {Icon ? <Icon className="w-8 h-8 text-gray-400" /> : <Zap className="w-8 h-8 text-gray-400" />}
            </div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
              No {title} Found
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {searchQuery ? 'Try adjusting your search.' : `No ${title.toLowerCase()} have been created yet.`}
            </p>
          </div>
        )}

        {/* Groups List */}
        {!loading && filteredGroups.length > 0 && (
          <div className="space-y-3">
            {filteredGroups.map((group) => {
              const isLocked = group.isHiddenUntilUnlocked && !isContentUnlocked(group);
              
              return (
                <div
                  key={group.id}
                  onClick={() => handleGroupClick(group)}
                  className={`
                    group bg-white dark:bg-slate-800 rounded-xl border shadow-sm p-4 
                    flex items-center gap-4 transition-all
                    ${isLocked 
                      ? 'border-gray-200 dark:border-gray-700 opacity-60 cursor-not-allowed' 
                      : 'border-gray-200 dark:border-gray-700 hover:border-corporate-teal hover:shadow-md cursor-pointer'
                    }
                  `}
                >
                  {/* Icon */}
                  <div className={`
                    w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0
                    ${isLocked 
                      ? 'bg-gray-100 dark:bg-gray-700 text-gray-400' 
                      : `${bgColor || 'bg-corporate-teal/10'} ${color || 'text-corporate-teal'}`
                    }
                  `}>
                    {isLocked 
                      ? <Lock className="w-6 h-6" />
                      : (Icon ? <Icon className="w-6 h-6" /> : <Zap className="w-6 h-6" />)
                    }
                  </div>

                  {/* Content */}
                  <div className="flex-grow min-w-0">
                    <h3 className={`font-bold text-lg mb-1 ${isLocked ? 'text-gray-400' : 'text-gray-900 dark:text-gray-100'}`}>
                      {group.label}
                    </h3>
                    {group.description && (
                      <p className={`text-sm line-clamp-2 ${isLocked ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'}`}>
                        {group.description}
                      </p>
                    )}
                    {isLocked && group.unlockDay && (
                      <p className="text-xs text-gray-400 mt-1">
                        Unlocks on Day {group.unlockDay}
                      </p>
                    )}
                  </div>

                  {/* Arrow */}
                  {!isLocked && (
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-corporate-teal transition-colors flex-shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Count */}
        {!loading && filteredGroups.length > 0 && (
          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
            Showing {filteredGroups.length} {filteredGroups.length === 1 ? title.slice(0, -1).toLowerCase() : title.toLowerCase()}
          </p>
        )}
      </div>
    </PageLayout>
  );
};

export default ContentGroupsListView;
