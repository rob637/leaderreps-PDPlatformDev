// src/components/conditioning/RepTypePicker.jsx
// Hierarchical picker for 16 rep types: Category → Type drill-down
// Mobile-first, easy to use

import React, { useState, useMemo } from 'react';
import { 
  MessageSquare, Heart, Shield, AlertTriangle,
  ChevronRight, ChevronLeft, Check, Info
} from 'lucide-react';
import { 
  getCategoriesArray, 
  getRepTypesByCategory, 
  getRepType,
  DIFFICULTY_LEVELS,
  RISK_LEVELS
} from '../../services/repTaxonomy';

// Icon mapping for categories
const CATEGORY_ICONS = {
  reinforcing_redirecting: MessageSquare,
  ambiguous_emotional: Heart,
  standards_authority: Shield,
  escalation_decisions: AlertTriangle
};

// Color mapping for categories
const CATEGORY_COLORS = {
  reinforcing_redirecting: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', ring: 'ring-blue-500' },
  ambiguous_emotional: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', ring: 'ring-purple-500' },
  standards_authority: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', ring: 'ring-amber-500' },
  escalation_decisions: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', ring: 'ring-red-500' }
};

// ============================================
// CATEGORY CARD
// ============================================
const CategoryCard = ({ category, onClick, repCount }) => {
  const Icon = CATEGORY_ICONS[category.id] || MessageSquare;
  const colors = CATEGORY_COLORS[category.id] || CATEGORY_COLORS.reinforcing_redirecting;
  
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full p-4 rounded-lg border-2 ${colors.bg} ${colors.border} text-left transition-all hover:shadow-md active:scale-[0.98]`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg bg-white shadow-sm`}>
            <Icon className={`w-5 h-5 ${colors.text}`} />
          </div>
          <div>
            <div className={`font-semibold ${colors.text}`}>{category.shortLabel}</div>
            <div className="text-xs text-gray-500">{category.description}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">{repCount} types</span>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </div>
      </div>
    </button>
  );
};

// ============================================
// REP TYPE CARD
// ============================================
const RepTypeCard = ({ repType, isSelected, onClick }) => {
  const colors = CATEGORY_COLORS[repType.category] || CATEGORY_COLORS.reinforcing_redirecting;
  
  const difficultyLabel = repType.defaultDifficulty === 'level_3' ? 'Hard' : 
                          repType.defaultDifficulty === 'level_2' ? 'Medium' : 'Easier';
  const difficultyColor = repType.defaultDifficulty === 'level_3' ? 'text-red-600' : 
                          repType.defaultDifficulty === 'level_2' ? 'text-amber-600' : 'text-green-600';
  
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
        isSelected 
          ? `${colors.bg} ${colors.border} ring-2 ${colors.ring}` 
          : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="font-medium text-corporate-navy">{repType.shortLabel}</div>
          <div className="text-sm text-gray-600 mt-0.5">{repType.description}</div>
          
          <div className="flex items-center gap-3 mt-2 text-xs">
            <span className={`font-medium ${difficultyColor}`}>{difficultyLabel}</span>
            {repType.prepRequired && (
              <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded">Prep Required</span>
            )}
          </div>
        </div>
        
        {isSelected && (
          <div className={`p-1 rounded-full ${colors.bg}`}>
            <Check className={`w-4 h-4 ${colors.text}`} />
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
  
  const colors = CATEGORY_COLORS[repType.category] || CATEGORY_COLORS.reinforcing_redirecting;
  const Icon = CATEGORY_ICONS[repType.category] || MessageSquare;
  
  return (
    <div className={`p-3 rounded-lg ${colors.bg} ${colors.border} border`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className={`w-4 h-4 ${colors.text}`} />
          <span className={`font-medium ${colors.text}`}>{repType.shortLabel}</span>
        </div>
        <button
          type="button"
          onClick={onClear}
          className="text-xs text-gray-500 hover:text-gray-700 underline"
        >
          Change
        </button>
      </div>
      <p className="text-xs text-gray-600 mt-1">{repType.description}</p>
    </div>
  );
};

// ============================================
// MAIN PICKER COMPONENT
// ============================================
const RepTypePicker = ({ 
  selectedRepTypeId, 
  onSelect, 
  showDetails = true,
  // eslint-disable-next-line no-unused-vars
  compact = false // Reserved for future compact mode styling
}) => {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const categories = useMemo(() => getCategoriesArray(), []);
  
  const selectedRepType = useMemo(() => {
    return selectedRepTypeId ? getRepType(selectedRepTypeId) : null;
  }, [selectedRepTypeId]);
  
  // If a rep type is already selected, show summary with change option
  if (selectedRepType && !selectedCategory) {
    return (
      <SelectedRepSummary 
        repType={selectedRepType} 
        onClear={() => {
          setSelectedCategory(selectedRepType.category);
        }} 
      />
    );
  }
  
  // Category selection view
  if (!selectedCategory) {
    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          What kind of rep is this?
        </label>
        {categories.map((category) => {
          const repTypes = getRepTypesByCategory(category.id);
          return (
            <CategoryCard
              key={category.id}
              category={category}
              repCount={repTypes.length}
              onClick={() => setSelectedCategory(category.id)}
            />
          );
        })}
      </div>
    );
  }
  
  // Rep type selection within category
  const repTypesInCategory = getRepTypesByCategory(selectedCategory);
  const categoryInfo = categories.find(c => c.id === selectedCategory);
  const colors = CATEGORY_COLORS[selectedCategory] || CATEGORY_COLORS.reinforcing_redirecting;
  
  return (
    <div className="space-y-3">
      {/* Back button + category header */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setSelectedCategory(null)}
          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div className={`px-2 py-1 rounded-lg ${colors.bg}`}>
          <span className={`text-sm font-medium ${colors.text}`}>{categoryInfo?.shortLabel}</span>
        </div>
      </div>
      
      <label className="block text-sm font-medium text-gray-700">
        Choose the specific rep type:
      </label>
      
      {/* Rep types list */}
      <div className="space-y-2">
        {repTypesInCategory.map((repType) => (
          <RepTypeCard
            key={repType.id}
            repType={repType}
            isSelected={selectedRepTypeId === repType.id}
            onClick={() => {
              onSelect(repType.id);
              // V1 UX: Auto-collapse after selection to bring form fields into view
              // Small delay to show the selection animation
              setTimeout(() => setSelectedCategory(null), 150);
            }}
          />
        ))}
      </div>
      
      {/* Show "hard part" for selected type */}
      {showDetails && selectedRepType && selectedRepType.category === selectedCategory && (
        <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
            <div>
              <div className="text-xs font-medium text-gray-700">The hard part:</div>
              <div className="text-sm text-gray-600">{selectedRepType.hardPart}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================
// COMPACT INLINE VERSION (for display, not editing)
// ============================================
export const RepTypeBadge = ({ repTypeId, repType: repTypeProp, showCategory = false }) => {
  // Support both repTypeId and repType props for backward compatibility
  const id = repTypeId || repTypeProp;
  const repType = getRepType(id);
  if (!repType) return null;
  
  const colors = CATEGORY_COLORS[repType.category] || CATEGORY_COLORS.reinforcing_redirecting;
  const Icon = CATEGORY_ICONS[repType.category] || MessageSquare;
  
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg ${colors.bg} ${colors.text} text-sm font-medium`}>
      <Icon className="w-3.5 h-3.5" />
      {showCategory ? repType.label : repType.shortLabel}
    </span>
  );
};

export default RepTypePicker;
