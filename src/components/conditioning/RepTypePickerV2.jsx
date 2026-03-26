// src/components/conditioning/RepTypePickerV2.jsx
// V2 Rep Type Picker - 3 categories (Lead the Work/Team/Yourself), 10 rep types
// No difficulty labels, clean drill-down UX
// Updated: Milestone-based unlocking (March 2026)
// Updated: Simplified mode for 4-type flat view (March 2026)

import React, { useState, useMemo } from 'react';
import { 
  Briefcase, Users, User,
  ChevronRight, ChevronLeft, Check, Lock
} from 'lucide-react';
// Use RepTypeContext for Firestore-driven rep type data
import { useRepTypeContext } from '../../providers/RepTypeProvider';
// Still need these from repTaxonomy until migrated to Firestore
import { getBehaviorFocusReminder, SIMPLIFIED_REP_TYPES } from '../../services/repTaxonomy';

// Icon mapping for V2 categories
const CATEGORY_ICONS = {
  lead_the_work: Briefcase,
  lead_the_team: Users,
  lead_yourself: User
};

// Color mapping for V2 categories
const CATEGORY_COLORS = {
  lead_the_work: { 
    bg: 'bg-corporate-teal/10', 
    border: 'border-corporate-teal/30', 
    text: 'text-corporate-teal',
    ring: 'ring-corporate-teal'
  },
  lead_the_team: { 
    bg: 'bg-corporate-navy/10', 
    border: 'border-corporate-navy/30', 
    text: 'text-corporate-navy',
    ring: 'ring-corporate-navy'
  },
  lead_yourself: { 
    bg: 'bg-corporate-orange/10', 
    border: 'border-corporate-orange/30', 
    text: 'text-corporate-orange',
    ring: 'ring-corporate-orange'
  }
};

// ============================================
// CATEGORY CARD
// ============================================
const CategoryCard = ({ category, onClick, repCount, unlockedCount }) => {
  const Icon = CATEGORY_ICONS[category.id] || Briefcase;
  const colors = CATEGORY_COLORS[category.id] || CATEGORY_COLORS.lead_the_work;
  const hasLocked = unlockedCount !== undefined && unlockedCount < repCount;
  
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full p-4 rounded-xl border-2 bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-600 text-left transition-all hover:border-corporate-teal hover:shadow-md active:scale-[0.98]"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl ${colors.bg} border ${colors.border}`}>
            <Icon className={`w-5 h-5 ${colors.text}`} />
          </div>
          <div>
            <div className="font-semibold text-corporate-navy dark:text-white">{category.label}</div>
            <div className="text-xs text-gray-500 dark:text-slate-400">{category.description}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 dark:text-slate-500">
            {hasLocked ? `${unlockedCount}/${repCount}` : repCount}
          </span>
          {hasLocked && <Lock className="w-3.5 h-3.5 text-gray-400 dark:text-slate-500" />}
          <ChevronRight className="w-5 h-5 text-gray-400 dark:text-slate-500" />
        </div>
      </div>
    </button>
  );
};

// ============================================
// REP TYPE CARD (With milestone locking support)
// ============================================
const RepTypeCard = ({ repType, isSelected, onClick, unlockStatus }) => {
  const isLocked = unlockStatus && !unlockStatus.unlocked;
  
  return (
    <button
      type="button"
      onClick={isLocked ? undefined : onClick}
      disabled={isLocked}
      className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
        isLocked
          ? 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 opacity-60 cursor-not-allowed'
          : isSelected 
            ? 'bg-corporate-teal/5 dark:bg-corporate-teal/10 border-corporate-teal ring-2 ring-corporate-teal' 
            : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-600 hover:border-corporate-teal hover:shadow-sm'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className={`font-medium flex items-center gap-2 ${
            isLocked 
              ? 'text-slate-400 dark:text-slate-500'
              : isSelected 
                ? 'text-corporate-teal' 
                : 'text-corporate-navy dark:text-white'
          }`}>
            {repType.label}
            {isLocked && <Lock className="w-3.5 h-3.5" />}
          </div>
          <div className={`text-sm mt-0.5 ${
            isLocked 
              ? 'text-slate-400 dark:text-slate-500' 
              : 'text-gray-600 dark:text-slate-400'
          }`}>
            {isLocked ? unlockStatus.reason : repType.description}
          </div>
        </div>
        
        {isSelected && !isLocked && (
          <div className="p-1 rounded-full bg-corporate-teal/10">
            <Check className="w-4 h-4 text-corporate-teal" />
          </div>
        )}
      </div>
    </button>
  );
};

// ============================================
// SELECTED REP SUMMARY
// ============================================
const SelectedRepSummary = ({ repType, onClear }) => {
  if (!repType) return null;
  
  const colors = CATEGORY_COLORS[repType.category] || CATEGORY_COLORS.lead_the_work;
  const Icon = CATEGORY_ICONS[repType.category] || Briefcase;
  
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onClear}
          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
          aria-label="Change rep type"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-slate-300" />
        </button>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${colors.bg} ${colors.border} border`}>
          <Icon className={`w-4 h-4 ${colors.text}`} />
          <span className={`font-medium ${colors.text}`}>{repType.shortLabel}</span>
        </div>
      </div>
      <p className="text-xs text-gray-500 dark:text-slate-400 ml-9">{repType.description}</p>
    </div>
  );
};

// ============================================
// MAIN PICKER COMPONENT
// ============================================
const RepTypePickerV2 = ({ 
  selectedRepTypeId, 
  onSelect,
  // Header text customization
  headerText = 'Select the type of Real Rep',
  // Lifted category state for parent control
  selectedCategory: selectedCategoryProp,
  onCategoryChange,
  // Show behavior focus reminder below selection
  showBehaviorFocus = false,
  // Session-based unlocking (primary)
  sessionAttendance = null,
  // Milestone-based unlocking (legacy fallback)
  milestoneProgress = {},
  completedRepTypes = [],
  // Simplified mode: show 4 core rep types directly (no category drill-down)
  simplifiedMode = true
}) => {
  // Get rep type data from context (Firestore-driven with fallback)
  const { 
    getCategoriesArrayV2, 
    getRepTypesByCategoryV2, 
    getRepTypeV2,
    isRepUnlocked 
  } = useRepTypeContext();
  
  // Internal state as fallback if not controlled by parent
  const [internalCategory, setInternalCategory] = useState(null);
  
  // Use controlled or internal state
  const selectedCategory = selectedCategoryProp !== undefined ? selectedCategoryProp : internalCategory;
  const setSelectedCategory = onCategoryChange || setInternalCategory;
  
  const categories = useMemo(() => getCategoriesArrayV2(), []);
  
  const selectedRepType = useMemo(() => {
    return selectedRepTypeId ? getRepTypeV2(selectedRepTypeId) : null;
  }, [selectedRepTypeId]);
  
  const behaviorFocus = useMemo(() => {
    return selectedRepTypeId ? getBehaviorFocusReminder(selectedRepTypeId) : null;
  }, [selectedRepTypeId]);
  
  // Get simplified rep types for flat view
  const simplifiedRepTypes = useMemo(() => {
    return SIMPLIFIED_REP_TYPES.map(id => getRepTypeV2(id)).filter(Boolean);
  }, [getRepTypeV2]);
  
  // If a rep type is already selected, show summary with change option
  if (selectedRepType && !selectedCategory) {
    return (
      <div className="space-y-3">
        <SelectedRepSummary 
          repType={selectedRepType} 
          onClear={() => {
            // In simplified mode, just clear selection; in full mode, go to category
            if (simplifiedMode) {
              onSelect(null);
            } else {
              setSelectedCategory(selectedRepType.category);
            }
          }} 
        />
        {showBehaviorFocus && behaviorFocus && (
          <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg">
            <p className="text-sm text-amber-800 dark:text-amber-300 font-medium">
              Behavior Focus
            </p>
            <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
              {behaviorFocus}
            </p>
          </div>
        )}
      </div>
    );
  }
  
  // SIMPLIFIED MODE: Show 4 core rep types directly (no categories)
  if (simplifiedMode && !selectedCategory) {
    return (
      <div className="space-y-3">
        <label className="block text-base font-bold text-corporate-navy dark:text-white">
          {headerText}
        </label>
        <div className="space-y-2">
          {simplifiedRepTypes.map((repType) => {
            const unlockStatus = isRepUnlocked(repType.id, milestoneProgress, completedRepTypes, sessionAttendance);
            return (
              <RepTypeCard
                key={repType.id}
                repType={repType}
                isSelected={selectedRepTypeId === repType.id}
                unlockStatus={unlockStatus}
                onClick={() => {
                  onSelect(repType.id);
                }}
              />
            );
          })}
        </div>
        {/* Show behavior focus for selected type */}
        {showBehaviorFocus && selectedRepType && behaviorFocus && (
          <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg">
            <p className="text-sm text-amber-800 dark:text-amber-300 font-medium">
              Behavior Focus
            </p>
            <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
              {behaviorFocus}
            </p>
          </div>
        )}
      </div>
    );
  }
  
  // Category selection view
  if (!selectedCategory) {
    return (
      <div className="space-y-3">
        <label className="block text-base font-bold text-corporate-navy dark:text-white">
          {headerText}
        </label>
        <div className="space-y-2">
          {categories.map((category) => {
            const repTypes = getRepTypesByCategoryV2(category.id)
              .filter(rt => rt.id !== 'make_clean_handoff'); // Turned off for now: moved to later level
            const unlockedCount = repTypes.filter(rt => 
              isRepUnlocked(rt.id, milestoneProgress, completedRepTypes, sessionAttendance).unlocked
            ).length;
            return (
              <CategoryCard
                key={category.id}
                category={category}
                repCount={repTypes.length}
                unlockedCount={unlockedCount}
                onClick={() => setSelectedCategory(category.id)}
              />
            );
          })}
        </div>
      </div>
    );
  }
  
  // Rep type selection within category
  const repTypesInCategory = getRepTypesByCategoryV2(selectedCategory)
    .filter(rt => rt.id !== 'make_clean_handoff'); // Turned off for now: moved to later level
  const categoryInfo = categories.find(c => c.id === selectedCategory);
  const colors = CATEGORY_COLORS[selectedCategory] || CATEGORY_COLORS.lead_the_work;
  const Icon = CATEGORY_ICONS[selectedCategory] || Briefcase;
  
  return (
    <div className="space-y-3">
      {/* Category header with back */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => {
            setSelectedCategory(null);
            onSelect(null);
          }}
          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
          aria-label="Back to categories"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-slate-300" />
        </button>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${colors.bg} ${colors.border} border`}>
          <Icon className={`w-4 h-4 ${colors.text}`} />
          <span className={`font-medium ${colors.text}`}>{categoryInfo?.label}</span>
        </div>
      </div>
      
      {/* Rep types list */}
      <div className="space-y-2">
        {repTypesInCategory.map((repType) => {
          const unlockStatus = isRepUnlocked(repType.id, milestoneProgress, completedRepTypes, sessionAttendance);
          return (
            <RepTypeCard
              key={repType.id}
              repType={repType}
              isSelected={selectedRepTypeId === repType.id}
              unlockStatus={unlockStatus}
              onClick={() => {
                onSelect(repType.id);
              }}
            />
          );
        })}
      </div>
      
      {/* Show behavior focus for selected type */}
      {showBehaviorFocus && selectedRepType && behaviorFocus && (
        <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg">
          <p className="text-sm text-amber-800 dark:text-amber-300 font-medium">
            Behavior Focus
          </p>
          <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
            {behaviorFocus}
          </p>
        </div>
      )}
    </div>
  );
};

// ============================================
// V2 REP TYPE BADGE (for display)
// ============================================
export const RepTypeBadgeV2 = ({ repTypeId, showCategory = false }) => {
  const { getRepTypeV2 } = useRepTypeContext();
  const repType = getRepTypeV2(repTypeId);
  if (!repType) return null;
  
  const colors = CATEGORY_COLORS[repType.category] || CATEGORY_COLORS.lead_the_work;
  const Icon = CATEGORY_ICONS[repType.category] || Briefcase;
  
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg ${colors.bg} ${colors.text} text-sm font-medium`}>
      <Icon className="w-3.5 h-3.5" />
      {showCategory ? repType.label : repType.shortLabel}
    </span>
  );
};

export default RepTypePickerV2;
