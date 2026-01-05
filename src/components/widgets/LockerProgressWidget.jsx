import React, { useState, useMemo } from 'react';
import { 
  Trophy, ChevronDown, ChevronUp, CheckCircle, Clock, 
  Flame, Award, Target, Star, Calendar, TrendingUp,
  BookOpen, Users, MessageSquare, AlertTriangle
} from 'lucide-react';
import { Card } from '../ui';
import { useActionProgress, BADGES, POINTS } from '../../hooks/useActionProgress';
import { useDailyPlan } from '../../hooks/useDailyPlan';

/**
 * LockerProgressWidget - Comprehensive Progress Tracking Display
 * 
 * Shows:
 * - Progress bars for current week and overall
 * - Accomplishments grouped by week (accordion)
 * - Outstanding items
 * - Gamification: badges, points, streaks
 */

const LockerProgressWidget = () => {
  const [expandedWeeks, setExpandedWeeks] = useState([]);
  const [activeTab, setActiveTab] = useState('accomplishments');
  
  const { 
    stats, 
    getAccomplishments, 
    getOutstandingItems,
    getEarnedBadges,
    loading 
  } = useActionProgress();
  
  const { phaseDayNumber, currentPhase } = useDailyPlan();
  
  const accomplishments = useMemo(() => getAccomplishments(), [getAccomplishments]);
  const outstandingItems = useMemo(() => getOutstandingItems(), [getOutstandingItems]);
  const earnedBadges = useMemo(() => getEarnedBadges(), [getEarnedBadges]);
  
  // Calculate overall progress
  const totalWeeks = 8;
  const currentWeekNum = useMemo(() => {
    if (currentPhase?.id === 'pre-start') return 0;
    if (currentPhase?.id === 'start') {
      return Math.ceil(phaseDayNumber / 7);
    }
    return 1;
  }, [currentPhase, phaseDayNumber]);

  const overallProgressPercent = Math.round((currentWeekNum / totalWeeks) * 100);

  const toggleWeek = (weekNum) => {
    setExpandedWeeks(prev => 
      prev.includes(weekNum) 
        ? prev.filter(w => w !== weekNum)
        : [...prev, weekNum]
    );
  };

  const getCategoryIcon = (category) => {
    switch (category?.toLowerCase()) {
      case 'content': return BookOpen;
      case 'community': return Users;
      case 'coaching': return MessageSquare;
      default: return CheckCircle;
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    // Standard format: MM/DD/YYYY
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  };

  if (loading) {
    return (
      <Card title="My Progress" icon={Trophy} accent="TEAL">
        <div className="p-8 text-center">
          <div className="animate-spin w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full mx-auto mb-2" />
          <p className="text-sm text-slate-500">Loading progress...</p>
        </div>
      </Card>
    );
  }

  return (
    <Card title="My Progress" icon={Trophy} accent="TEAL">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-gradient-to-br from-teal-50 to-emerald-50 rounded-xl p-3 border border-teal-100">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle className="w-4 h-4 text-teal-600" />
            <span className="text-xs font-medium text-teal-700">Completed</span>
          </div>
          <p className="text-2xl font-bold text-teal-800">{stats.totalCompleted}</p>
        </div>
        
        <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-3 border border-orange-100">
          <div className="flex items-center gap-2 mb-1">
            <Flame className="w-4 h-4 text-orange-600" />
            <span className="text-xs font-medium text-orange-700">Streak</span>
          </div>
          <p className="text-2xl font-bold text-orange-800">{stats.currentStreak} days</p>
        </div>
        
        <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl p-3 border border-teal-100">
          <div className="flex items-center gap-2 mb-1">
            <Star className="w-4 h-4 text-teal-600" />
            <span className="text-xs font-medium text-teal-700">Points</span>
          </div>
          <p className="text-2xl font-bold text-teal-800">{stats.totalPoints}</p>
        </div>
        
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-3 border border-blue-100">
          <div className="flex items-center gap-2 mb-1">
            <Award className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-medium text-blue-700">Badges</span>
          </div>
          <p className="text-2xl font-bold text-blue-800">{earnedBadges.length}</p>
        </div>
      </div>

      {/* Progress Bars */}
      <div className="space-y-4 mb-6">
        {/* Current Week Progress */}
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-slate-700">
              Week {currentWeekNum} Progress
            </span>
            <span className="text-xs font-medium text-slate-500">
              {stats.contentCompleted + stats.communityCompleted + stats.coachingCompleted} items
            </span>
          </div>
          <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full transition-all duration-700"
              style={{ width: `${Math.min(100, (stats.totalCompleted / Math.max(1, stats.totalCompleted + outstandingItems.length)) * 100)}%` }}
            />
          </div>
        </div>

        {/* Overall Journey Progress */}
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-slate-700">
              26-Week Journey
            </span>
            <span className="text-xs font-medium text-slate-500">
              Week {currentWeekNum} of {totalWeeks}
            </span>
          </div>
          <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full transition-all duration-700"
              style={{ width: `${overallProgressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Badges Section */}
      {earnedBadges.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-500" />
            Earned Badges
          </h3>
          <div className="flex flex-wrap gap-2">
            {earnedBadges.map(badge => (
              <div 
                key={badge.id}
                className="group relative bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-200 rounded-lg px-3 py-2 flex items-center gap-2"
                title={badge.description}
              >
                <span className="text-xl">{badge.icon}</span>
                <span className="text-xs font-medium text-amber-800">{badge.name}</span>
                
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                  <div className="bg-slate-800 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap">
                    {badge.description}
                  </div>
                  <div className="absolute left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Next Badge Preview */}
      {earnedBadges.length < Object.keys(BADGES).length && (
        <div className="mb-6 p-3 bg-slate-50 rounded-xl border border-slate-200">
          <h4 className="text-xs font-medium text-slate-500 mb-2">Next Badge to Earn</h4>
          {(() => {
            const nextBadge = Object.values(BADGES).find(b => !earnedBadges.some(eb => eb.id === b.id));
            if (!nextBadge) return null;
            return (
              <div className="flex items-center gap-3">
                <span className="text-2xl opacity-50">{nextBadge.icon}</span>
                <div>
                  <p className="text-sm font-medium text-slate-700">{nextBadge.name}</p>
                  <p className="text-xs text-slate-500">{nextBadge.description}</p>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-4 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('accomplishments')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'accomplishments'
              ? 'text-teal-700 border-b-2 border-teal-500'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Accomplishments
        </button>
        <button
          onClick={() => setActiveTab('outstanding')}
          className={`px-4 py-2 text-sm font-medium transition-colors flex items-center gap-1 ${
            activeTab === 'outstanding'
              ? 'text-teal-700 border-b-2 border-teal-500'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Outstanding
          {outstandingItems.length > 0 && (
            <span className="bg-amber-100 text-amber-700 text-xs font-bold px-1.5 py-0.5 rounded-full">
              {outstandingItems.length}
            </span>
          )}
        </button>
      </div>

      {/* Accomplishments Tab */}
      {activeTab === 'accomplishments' && (
        <div className="space-y-2">
          {accomplishments.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <Target className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No completed items yet.</p>
              <p className="text-xs mt-1">Complete your first action to see it here!</p>
            </div>
          ) : (
            accomplishments.map(({ weekNumber, items }) => (
              <div key={weekNumber} className="border border-slate-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => toggleWeek(weekNumber)}
                  className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-500" />
                    <span className="text-sm font-semibold text-slate-700">
                      Week {weekNumber}
                    </span>
                    <span className="text-xs text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full">
                      {items.length} item{items.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  {expandedWeeks.includes(weekNumber) ? (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </button>
                
                {expandedWeeks.includes(weekNumber) && (
                  <div className="p-2 space-y-1 bg-white">
                    {items.map((item, idx) => {
                      const CategoryIcon = getCategoryIcon(item.category);
                      return (
                        <div 
                          key={item.id || idx}
                          className="flex items-start gap-3 p-2 rounded-lg bg-teal-50/50"
                        >
                          <CheckCircle className="w-4 h-4 text-teal-500 mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-slate-700 line-through opacity-75">
                              {item.label || item.title || 'Completed Action'}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                              <CategoryIcon className="w-3 h-3" />
                              <span className="capitalize">{item.category}</span>
                              {item.completedAt && (
                                <>
                                  <span>•</span>
                                  <span>{formatDate(item.completedAt)}</span>
                                </>
                              )}
                              {item.carriedOver && (
                                <span className="text-orange-600 flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  Carried
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Outstanding Tab */}
      {activeTab === 'outstanding' && (
        <div className="space-y-2">
          {outstandingItems.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <CheckCircle className="w-12 h-12 mx-auto mb-2 opacity-30 text-teal-500" />
              <p className="text-sm font-medium text-teal-700">All caught up!</p>
              <p className="text-xs mt-1">You have no outstanding items.</p>
            </div>
          ) : (
            outstandingItems.map((item, idx) => {
              const CategoryIcon = getCategoryIcon(item.category);
              const carryCount = item.carryCount || 0;
              
              return (
                <div 
                  key={item.id || idx}
                  className={`flex items-start gap-3 p-3 rounded-xl border ${
                    carryCount >= 2 
                      ? 'bg-red-50 border-red-200' 
                      : item.carriedOver 
                        ? 'bg-amber-50 border-amber-200'
                        : 'bg-white border-slate-200'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 ${
                    carryCount >= 2 ? 'border-red-400' : item.carriedOver ? 'border-amber-400' : 'border-slate-300'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-slate-700">
                        {item.label || item.title || 'Pending Action'}
                      </p>
                      {item.carriedOver && (
                        <span className="text-[10px] font-bold text-orange-600 bg-orange-100 px-1.5 py-0.5 rounded flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          From Week {item.originalWeek}
                        </span>
                      )}
                      {carryCount >= 2 && (
                        <span className="text-[10px] font-bold text-red-600 bg-red-100 px-1.5 py-0.5 rounded flex items-center gap-1">
                          <AlertTriangle className="w-2.5 h-2.5" />
                          {carryCount}x carried - Last chance!
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                      <CategoryIcon className="w-3 h-3" />
                      <span className="capitalize">{item.category}</span>
                      {item.weekNumber && (
                        <>
                          <span>•</span>
                          <span>Week {item.weekNumber}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Category Breakdown */}
      <div className="mt-6 pt-4 border-t border-slate-200">
        <h4 className="text-xs font-medium text-slate-500 mb-3">Completion by Category</h4>
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center p-2 bg-blue-50 rounded-lg">
            <BookOpen className="w-5 h-5 text-blue-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-blue-800">{stats.contentCompleted}</p>
            <p className="text-xs text-blue-600">Content</p>
          </div>
          <div className="text-center p-2 bg-green-50 rounded-lg">
            <Users className="w-5 h-5 text-green-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-green-800">{stats.communityCompleted}</p>
            <p className="text-xs text-green-600">Community</p>
          </div>
          <div className="text-center p-2 bg-teal-50 rounded-lg">
            <MessageSquare className="w-5 h-5 text-teal-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-teal-800">{stats.coachingCompleted}</p>
            <p className="text-xs text-teal-600">Coaching</p>
          </div>
        </div>
      </div>

      {/* Longest Streak */}
      {stats.longestStreak > 0 && (
        <div className="mt-4 p-3 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl border border-orange-200">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-orange-500" />
            <div>
              <p className="text-sm font-medium text-orange-800">
                Longest Streak: {stats.longestStreak} days
              </p>
              <p className="text-xs text-orange-600">
                {stats.currentStreak > 0 
                  ? `Current: ${stats.currentStreak} days - Keep it going!` 
                  : 'Start a new streak today!'}
              </p>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default LockerProgressWidget;
