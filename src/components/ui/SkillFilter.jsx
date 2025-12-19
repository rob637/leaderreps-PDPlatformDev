// src/components/ui/SkillFilter.jsx
// Skill-based filtering component for content libraries

import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { UNIFIED_COLLECTION } from '../../services/unifiedContentService';
import { Target, X, ChevronDown } from 'lucide-react';

// Pillar colors (matching SkillsIndex)
const PILLAR_COLORS = {
  'Lead Self': { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200', activeBg: 'bg-teal-600' },
  'Lead Work': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', activeBg: 'bg-blue-600' },
  'Lead People': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', activeBg: 'bg-purple-600' },
};

const SkillFilter = ({ db, selectedSkills = [], onSkillsChange, compact = false }) => {
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const fetchSkills = async () => {
      try {
        // Fetch from Unified Content Library (New System)
        const q = query(collection(db, UNIFIED_COLLECTION), where('type', '==', 'SKILL'));
        const snapshot = await getDocs(q);
        
        const items = snapshot.docs.map(doc => {
          const data = doc.data();
          return { 
            id: doc.id, 
            name: data.title, 
            pillar: data.details?.domain || 'Uncategorized',
            ...data 
          };
        });

        // Sort by pillar then name
        items.sort((a, b) => {
          const pillarOrder = ['Lead Self', 'Lead Work', 'Lead People'];
          const pillarDiff = pillarOrder.indexOf(a.pillar) - pillarOrder.indexOf(b.pillar);
          // If not in known pillars, put at end
          if (pillarDiff !== 0) {
             if (pillarOrder.indexOf(a.pillar) === -1) return 1;
             if (pillarOrder.indexOf(b.pillar) === -1) return -1;
             return pillarDiff;
          }
          return a.name.localeCompare(b.name);
        });
        setSkills(items);
      } catch (error) {
        console.error('Error fetching skills:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSkills();
  }, [db]);

  const toggleSkill = (skillId) => {
    if (selectedSkills.includes(skillId)) {
      onSkillsChange(selectedSkills.filter(s => s !== skillId));
    } else {
      onSkillsChange([...selectedSkills, skillId]);
    }
  };

  const clearAll = () => {
    onSkillsChange([]);
  };

  if (loading) return null;

  // Group skills by pillar
  const skillsByPillar = skills.reduce((acc, skill) => {
    const pillar = skill.pillar || 'Other';
    if (!acc[pillar]) acc[pillar] = [];
    acc[pillar].push(skill);
    return acc;
  }, {});

  // Compact view - just show selected + dropdown
  if (compact) {
    return (
      <div className="relative">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
            selectedSkills.length > 0 
              ? 'bg-indigo-50 border-indigo-200 text-indigo-700' 
              : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
          }`}
        >
          <Target className="w-4 h-4" />
          <span className="text-sm font-medium">
            {selectedSkills.length === 0 
              ? 'Filter by Skill' 
              : `${selectedSkills.length} skill${selectedSkills.length > 1 ? 's' : ''}`}
          </span>
          <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
        </button>

        {isExpanded && (
          <div className="absolute top-full left-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 z-50 p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-bold text-slate-800">Filter by Skills</span>
              {selectedSkills.length > 0 && (
                <button 
                  onClick={clearAll}
                  className="text-xs text-red-500 hover:text-red-700 font-medium"
                >
                  Clear all
                </button>
              )}
            </div>
            
            <div className="space-y-4 max-h-64 overflow-y-auto">
              {Object.entries(skillsByPillar).map(([pillar, pillarSkills]) => {
                const colors = PILLAR_COLORS[pillar] || PILLAR_COLORS['Lead Self'];
                return (
                  <div key={pillar}>
                    <div className={`text-xs font-bold uppercase tracking-wide mb-2 ${colors.text}`}>
                      {pillar}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {pillarSkills.map(skill => {
                        const isSelected = selectedSkills.includes(skill.id);
                        return (
                          <button
                            key={skill.id}
                            onClick={() => toggleSkill(skill.id)}
                            className={`px-2 py-1 text-xs font-medium rounded-full transition-all ${
                              isSelected 
                                ? `${colors.activeBg} text-white` 
                                : `${colors.bg} ${colors.text} hover:opacity-80`
                            }`}
                          >
                            {skill.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Click outside to close */}
        {isExpanded && (
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsExpanded(false)}
          />
        )}
      </div>
    );
  }

  // Full view - show all skills inline
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-indigo-600" />
          <span className="font-bold text-slate-800">Filter by Skills</span>
        </div>
        {selectedSkills.length > 0 && (
          <button 
            onClick={clearAll}
            className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 font-medium"
          >
            <X className="w-3 h-3" /> Clear ({selectedSkills.length})
          </button>
        )}
      </div>

      <div className="space-y-3">
        {Object.entries(skillsByPillar).map(([pillar, pillarSkills]) => {
          const colors = PILLAR_COLORS[pillar] || PILLAR_COLORS['Lead Self'];
          return (
            <div key={pillar}>
              <div className={`text-xs font-bold uppercase tracking-wide mb-2 ${colors.text}`}>
                {pillar}
              </div>
              <div className="flex flex-wrap gap-2">
                {pillarSkills.map(skill => {
                  const isSelected = selectedSkills.includes(skill.id);
                  return (
                    <button
                      key={skill.id}
                      onClick={() => toggleSkill(skill.id)}
                      className={`px-3 py-1.5 text-sm font-medium rounded-full transition-all ${
                        isSelected 
                          ? `${colors.activeBg} text-white shadow-sm` 
                          : `${colors.bg} ${colors.text} ${colors.border} border hover:opacity-80`
                      }`}
                    >
                      {skill.name}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SkillFilter;
