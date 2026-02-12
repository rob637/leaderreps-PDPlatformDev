// src/components/developmentplan/ProgressBreakdown.jsx
// Visual breakdown of skill progress across development plan
// FIXED: Updated to work with adapted plan structure (coreReps), group by focus area

import React, { useMemo, useEffect } from 'react';
import { TrendingUp, Target, Award } from 'lucide-react';
import { Card, ProgressBar, Badge } from './DevPlanComponents';
import { calculateSkillProgress } from './devPlanUtils';

const ProgressBreakdown = ({ plan, globalMetadata }) => {
  // Width debugging
  useEffect(() => {
    setTimeout(() => {
      const container = document.querySelector('.space-y-4');
      if (container) {
        const rect = container.getBoundingClientRect();
        const computed = window.getComputedStyle(container);
        console.log('📐 [PROGRESS BREAKDOWN] Width Measurements:', {
          component: 'ProgressBreakdown',
          actualWidth: `${rect.width}px`,
          maxWidth: computed.maxWidth,
          padding: computed.padding,
          margin: computed.margin,
          classList: container.className
        });
      }
    }, 100);
  }, []);
  const skillProgress = useMemo(() => {
    if (!plan || !plan.coreReps) return [];
    
    // const skillCatalog = globalMetadata?.SKILL_CATALOG?.items || globalMetadata?.SKILL_CATALOG || [];
    
    return plan.coreReps.map(rep => {
      // Use skillName from adapted rep (already has the name!)
      const skillName = rep.skillName || rep.skillId;
      
      // Calculate progress from weeksCompleted
      const progress = calculateSkillProgress(rep.weeksCompleted || 0);
      
      return {
        ...rep,
        skillName,
        progress,
        focusArea: rep.focusArea || rep.dimension || 'General'
      };
    });
  }, [plan, globalMetadata]);

  // FIXED: Group by focus area instead of tier
  const skillsByFocusArea = useMemo(() => {
    const grouped = {};
    skillProgress.forEach(skill => {
      const area = skill.focusArea || 'General';
      if (!grouped[area]) {
        grouped[area] = [];
      }
      grouped[area].push(skill);
    });
    
    return grouped;
  }, [skillProgress]);

  const overallProgress = useMemo(() => {
    if (skillProgress.length === 0) return 0;
    const total = skillProgress.reduce((sum, skill) => sum + skill.progress, 0);
    return Math.round(total / skillProgress.length);
  }, [skillProgress]);

  if (!plan || skillProgress.length === 0) {
    return (
      <div>
        <Card accent="BLUE">
          <p className="text-gray-600 dark:text-gray-300">No skills to display. Complete your baseline assessment to get started.</p>
        </Card>
      </div>
    );
  }

  // Focus area colors - use CSS variable names for consistency
  const areaColors = {
    'Clarity & Communication': 'var(--corporate-navy)',
    'Trust & Relationships': 'var(--corporate-teal)',
    'Delegation & Empowerment': 'var(--corporate-teal)',
    'Execution & Results': 'var(--corporate-orange)',
    'Leadership Mindset & Identity': 'var(--corporate-navy)',
    'Ownership & Accountability': 'var(--corporate-teal)',
    'Recognition & Motivation': 'var(--corporate-orange)',
    'Team Health & Culture': 'var(--corporate-orange)'
  };

  return (
    <div className="space-y-4 sm:space-y-5 lg:space-y-6">
      {/* Overall Progress */}
      <Card accent="BLUE">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold" style={{ color: 'var(--corporate-navy)' }}>
              Overall Progress
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              {skillProgress.length} skills across {Object.keys(skillsByFocusArea).length} focus areas
            </p>
          </div>
          <div className="text-right">
            <div className="text-xl sm:text-2xl sm:text-3xl font-bold" style={{ color: 'var(--corporate-navy)' }}>
              {overallProgress}%
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300">complete</p>
          </div>
        </div>
        <ProgressBar progress={overallProgress} color={'var(--corporate-navy)'} />
      </Card>

      {/* Skills by Focus Area */}
      {Object.entries(skillsByFocusArea).map(([area, skills]) => {
        if (skills.length === 0) return null;
        
        const areaColor = areaColors[area] || 'var(--corporate-orange)';
        const areaProgress = Math.round(
          skills.reduce((sum, s) => sum + s.progress, 0) / skills.length
        );

        return (
          <Card key={area} accent="BLUE">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Badge variant="primary" style={{ backgroundColor: areaColor }}>
                  {area}
                </Badge>
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  {skills.length} {skills.length === 1 ? 'skill' : 'skills'}
                </span>
              </div>
              <div className="text-right">
                <span className="text-xl font-bold" style={{ color: areaColor }}>
                  {areaProgress}%
                </span>
              </div>
            </div>

            <div className="space-y-3">
              {skills.map((skill, idx) => {
                const isComplete = skill.progress >= 100;
                const isMastered = skill.weeksCompleted >= 12;

                return (
                  <div
                    key={skill.skillId || idx}
                    className="p-4 rounded-lg border-2"
                    style={{
                      borderColor: isComplete ? areaColor : '#E5E7EB',
                      background: isComplete ? `${areaColor}08` : 'white'
                    }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold mb-1" style={{ color: 'var(--corporate-navy)' }}>
                          {skill.skillName}
                        </h3>
                        {skill.phase && (
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            Current phase: {skill.phase}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {isMastered && (
                          <Award size={20} style={{ color: 'var(--corporate-orange)' }} />
                        )}
                        <span className="text-sm font-medium" style={{ color: areaColor }}>
                          {skill.weeksCompleted || 0} weeks
                        </span>
                      </div>
                    </div>
                    <ProgressBar progress={skill.progress} color={areaColor} height="h-2" />
                  </div>
                );
              })}
            </div>
          </Card>
        );
      })}

      {/* Insights */}
      <Card accent="TEAL">
        <div className="flex items-center gap-3 mb-3">
          <TrendingUp size={24} style={{ color: 'var(--corporate-teal)' }} />
          <h3 className="font-bold" style={{ color: 'var(--corporate-navy)' }}>
            Key Insights
          </h3>
        </div>
        <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
          <li>• You have {skillProgress.filter(s => s.progress >= 100).length} skills at or above 100% completion</li>
          <li>• {skillProgress.filter(s => s.weeksCompleted >= 12).length} skills have reached mastery (12+ weeks)</li>
          <li>• Focus area with most progress: {
            Object.entries(skillsByFocusArea)
              .map(([area, skills]) => ({
                area,
                progress: skills.reduce((sum, s) => sum + s.progress, 0) / skills.length
              }))
              .sort((a, b) => b.progress - a.progress)[0]?.area || 'None'
          }</li>
        </ul>
      </Card>
    </div>
  );
};

export default ProgressBreakdown;
