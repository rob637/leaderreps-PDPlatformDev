// src/components/developmentplan/ProgressBreakdown.jsx
// Enhanced progress breakdown showing skill-level detail and statistics

import React, { useMemo } from 'react';
import { TrendingUp, Target, Award, Clock, BarChart3 } from 'lucide-react';
import { Card, ProgressBar, Badge, StatCard } from './DevPlanComponents';
import { calculateSkillProgress, COLORS } from './devPlanUtils';

const ProgressBreakdown = ({ plan, globalMetadata }) => {
  const skillCatalog = globalMetadata?.config?.catalog?.SKILL_CATALOG || [];
  
  // Calculate detailed progress for each skill
  const skillProgress = useMemo(() => {
    if (!plan || !plan.coreReps) return [];
    
    return plan.coreReps.map(rep => {
      const skill = skillCatalog.find(s => s.id === rep.skillId);
      const weeksCompleted = rep.weeksCompleted || 0;
      const progressPercent = Math.round((weeksCompleted / 12) * 100);
      
      return {
        skillId: rep.skillId,
        skillName: skill?.name || 'Unknown Skill',
        tier: skill?.tier || 'T1',
        weeksCompleted,
        progressPercent,
        isComplete: weeksCompleted >= 12,
        dimension: skill?.dimension || 'General',
      };
    });
  }, [plan, skillCatalog]);

  // Calculate overall stats
  const stats = useMemo(() => {
    const totalWeeks = skillProgress.length * 12;
    const completedWeeks = skillProgress.reduce((sum, s) => sum + s.weeksCompleted, 0);
    const avgProgress = skillProgress.length > 0 
      ? Math.round(completedWeeks / skillProgress.length)
      : 0;
    const completedSkills = skillProgress.filter(s => s.isComplete).length;
    
    return {
      overallProgress: Math.round((completedWeeks / totalWeeks) * 100),
      avgWeeksPerSkill: avgProgress,
      completedSkills,
      totalSkills: skillProgress.length,
      remainingWeeks: totalWeeks - completedWeeks,
    };
  }, [skillProgress]);

  // Group skills by tier
  const skillsByTier = useMemo(() => {
    const grouped = { T1: [], T2: [], T3: [], T4: [] };
    skillProgress.forEach(skill => {
      if (grouped[skill.tier]) {
        grouped[skill.tier].push(skill);
      }
    });
    return grouped;
  }, [skillProgress]);

  return (
    <Card title="Progress Breakdown" icon={BarChart3} accent="BLUE">
      {/* Overall Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Overall Progress"
          value={`${stats.overallProgress}%`}
          icon={TrendingUp}
          color={COLORS.TEAL}
        />
        <StatCard
          label="Avg per Skill"
          value={`${stats.avgWeeksPerSkill}w`}
          icon={Target}
          trend={`${stats.avgWeeksPerSkill} weeks average`}
          color={COLORS.BLUE}
        />
        <StatCard
          label="Completed"
          value={`${stats.completedSkills}/${stats.totalSkills}`}
          icon={Award}
          trend={`${stats.totalSkills - stats.completedSkills} in progress`}
          color={COLORS.GREEN}
        />
        <StatCard
          label="Remaining"
          value={`${stats.remainingWeeks}w`}
          icon={Clock}
          trend={`${Math.ceil(stats.remainingWeeks / skillProgress.length)} weeks avg`}
          color={COLORS.ORANGE}
        />
      </div>

      {/* Skill-Level Progress */}
      <div className="space-y-6">
        <h4 className="font-bold text-sm mb-3" style={{ color: COLORS.NAVY }}>
          Skill-Level Detail
        </h4>

        {/* By Tier */}
        {Object.entries(skillsByTier).map(([tier, skills]) => {
          if (skills.length === 0) return null;
          
          const tierColor = {
            T1: COLORS.BLUE,
            T2: COLORS.TEAL,
            T3: COLORS.PURPLE,
            T4: COLORS.ORANGE,
          }[tier];

          return (
            <div key={tier} className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant="primary">{tier}</Badge>
                <span className="text-sm font-semibold text-gray-600">
                  {skills.length} skill{skills.length !== 1 ? 's' : ''}
                </span>
              </div>
              
              {skills.map(skill => (
                <SkillProgressCard 
                  key={skill.skillId}
                  skill={skill}
                  tierColor={tierColor}
                />
              ))}
            </div>
          );
        })}
      </div>

      {/* Weekly Trend */}
      <div className="mt-6 p-4 rounded-xl border-2" style={{ borderColor: COLORS.SUBTLE, background: COLORS.LIGHT_GRAY }}>
        <h5 className="font-bold text-sm mb-3" style={{ color: COLORS.NAVY }}>
          Weekly Progress Trend
        </h5>
        <div className="space-y-2">
          {skillProgress.map(skill => {
            const weeksArray = Array.from({ length: 12 }, (_, i) => i + 1);
            
            return (
              <div key={skill.skillId} className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-600 w-32 truncate">
                  {skill.skillName}
                </span>
                <div className="flex-1 flex gap-1">
                  {weeksArray.map(week => {
                    const isCompleted = week <= skill.weeksCompleted;
                    return (
                      <div
                        key={week}
                        className="flex-1 h-2 rounded-sm"
                        style={{
                          background: isCompleted ? COLORS.GREEN : COLORS.SUBTLE,
                        }}
                        title={`Week ${week}`}
                      />
                    );
                  })}
                </div>
                <span className="text-xs font-semibold text-gray-500 w-12 text-right">
                  {skill.weeksCompleted}/12
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
};

// Skill Progress Card Component
const SkillProgressCard = ({ skill, tierColor }) => {
  return (
    <div 
      className="p-4 rounded-xl border-2 transition-all hover:shadow-md"
      style={{ borderColor: COLORS.SUBTLE, background: 'white' }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h5 className="font-bold text-sm" style={{ color: COLORS.NAVY }}>
              {skill.skillName}
            </h5>
            {skill.isComplete && (
              <Badge variant="success" size="sm">Complete</Badge>
            )}
          </div>
          <p className="text-xs text-gray-600">{skill.dimension}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold" style={{ color: tierColor }}>
            {skill.progressPercent}%
          </p>
          <p className="text-xs text-gray-500">
            {skill.weeksCompleted}/12 weeks
          </p>
        </div>
      </div>
      
      <ProgressBar 
        progress={skill.progressPercent}
        color={tierColor}
        height={6}
      />
      
      {/* Status Message */}
      <div className="mt-2">
        {skill.isComplete ? (
          <p className="text-xs text-green-600 font-medium">
            ✓ Mastery achieved
          </p>
        ) : skill.progressPercent >= 50 ? (
          <p className="text-xs text-blue-600 font-medium">
            → {12 - skill.weeksCompleted} weeks to mastery
          </p>
        ) : (
          <p className="text-xs text-gray-500 font-medium">
            → Building foundation
          </p>
        )}
      </div>
    </div>
  );
};

export default ProgressBreakdown;
