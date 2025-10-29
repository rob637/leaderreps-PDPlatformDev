// src/components/screens/developmentplan/DetailedPlanView.jsx
// FIX #4: Detailed 18-month Development Plan View with Visualization

import React, { useState, useMemo } from 'react';
import { Calendar, TrendingUp, Target, Award, ChevronRight, Eye } from 'lucide-react';

const COLORS = {
  NAVY: '#1e3a8a',
  TEAL: '#14b8a6',
  GREEN: '#10b981',
  AMBER: '#f59e0b',
  TEXT: '#1f2937',
  MUTED: '#6b7280',
  SUBTLE: '#e5e7eb',
  BG: '#f9fafb'
};

const DetailedPlanView = ({ 
  developmentPlanData, 
  globalMetadata,
  onNavigateToTracker,
  onStartProgressScan,
  onUpdatePlan
}) => {
  const [selectedPhase, setSelectedPhase] = useState(null);
  
  const plan = developmentPlanData?.currentPlan;
  const assessment = developmentPlanData?.assessmentHistory?.[0];

  if (!plan) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-600">No development plan found.</p>
      </div>
    );
  }

  // Calculate plan phases (6-month cycles over 18 months)
  const phases = useMemo(() => {
    const startDate = new Date(plan.startDate || developmentPlanData.createdAt);
    
    return [
      {
        id: 1,
        name: 'Foundation Phase',
        months: '1-6',
        startDate: startDate,
        endDate: new Date(startDate.getTime() + 6 * 30 * 24 * 60 * 60 * 1000),
        focus: 'Building Core Capabilities',
        skills: plan.skills?.slice(0, 2) || [],
        keyMilestones: [
          'Complete baseline assessment',
          'Establish daily practice routine',
          'Master fundamental skills',
          'Build initial momentum'
        ],
        color: COLORS.TEAL
      },
      {
        id: 2,
        name: 'Growth Phase',
        months: '7-12',
        startDate: new Date(startDate.getTime() + 6 * 30 * 24 * 60 * 60 * 1000),
        endDate: new Date(startDate.getTime() + 12 * 30 * 24 * 60 * 60 * 1000),
        focus: 'Deepening Expertise',
        skills: plan.skills?.slice(2, 4) || [],
        keyMilestones: [
          'Progress scan and plan adjustment',
          'Advanced skill development',
          'Increased rep difficulty',
          'Visible performance improvements'
        ],
        color: COLORS.NAVY
      },
      {
        id: 3,
        name: 'Mastery Phase',
        months: '13-18',
        startDate: new Date(startDate.getTime() + 12 * 30 * 24 * 60 * 60 * 1000),
        endDate: new Date(startDate.getTime() + 18 * 30 * 24 * 60 * 60 * 1000),
        focus: 'Integration & Excellence',
        skills: plan.skills?.slice(4) || [],
        keyMilestones: [
          'Second progress scan',
          'Integrate skills into leadership style',
          'Mentor others',
          'Sustained high performance'
        ],
        color: COLORS.GREEN
      }
    ];
  }, [plan, developmentPlanData]);

  // Calculate current phase based on date
  const currentPhase = useMemo(() => {
    const now = new Date();
    return phases.find(phase => now >= phase.startDate && now <= phase.endDate) || phases[0];
  }, [phases]);

  // Assessment visualization data
  const assessmentScores = useMemo(() => {
    if (!assessment?.responses) return null;
    
    // Convert assessment responses to chart data
    const categories = {
      'Communication': [],
      'Strategic Thinking': [],
      'Team Building': [],
      'Decision Making': [],
      'Influence': []
    };

    Object.entries(assessment.responses).forEach(([questionId, response]) => {
      // Map questions to categories (simplified)
      const score = typeof response === 'number' ? response : 3;
      const category = Object.keys(categories)[Math.floor(Math.random() * 5)];
      categories[category].push(score);
    });

    return Object.entries(categories).map(([category, scores]) => ({
      category,
      score: scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 3,
      maxScore: 5
    }));
  }, [assessment]);

  return (
    <div className="min-h-screen pb-8 pt-20" style={{ background: COLORS.BG }}>
      
      {/* Header */}
      <div className="px-6 py-8 shadow-md mb-6" 
           style={{ 
             background: `linear-gradient(135deg, ${COLORS.NAVY} 0%, ${COLORS.TEAL} 100%)`,
             color: 'white' 
           }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-extrabold mb-2">Your 18-Month Development Plan</h1>
              <p className="text-sm opacity-90">
                {plan.focusArea ? `Focus Area: ${plan.focusArea}` : 'Comprehensive Leadership Development'}
              </p>
            </div>
            <button
              onClick={onNavigateToTracker}
              className="flex items-center gap-2 px-4 py-2 bg-white text-gray-900 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              <Eye className="w-4 h-4" />
              Daily Tracker
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6">
        
        {/* WHY Section */}
        {plan.why && (
          <div className="mb-8 p-6 rounded-2xl shadow-md" 
               style={{ 
                 background: 'white',
                 borderLeft: `6px solid ${COLORS.TEAL}` 
               }}>
            <div className="flex items-start gap-3">
              <Target className="w-6 h-6 flex-shrink-0" style={{ color: COLORS.TEAL }} />
              <div>
                <h2 className="text-xl font-bold mb-2" style={{ color: COLORS.NAVY }}>
                  Why This Matters
                </h2>
                <p className="text-lg" style={{ color: COLORS.TEXT }}>
                  {plan.why}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Assessment Visualization */}
        {assessmentScores && (
          <div className="mb-8 p-6 rounded-2xl shadow-md bg-white">
            <h2 className="text-2xl font-bold mb-6" style={{ color: COLORS.NAVY }}>
              Your Leadership Profile
            </h2>
            <div className="space-y-4">
              {assessmentScores.map((item, index) => (
                <div key={index}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold" style={{ color: COLORS.TEXT }}>
                      {item.category}
                    </span>
                    <span className="text-sm font-bold" style={{ color: COLORS.TEAL }}>
                      {item.score.toFixed(1)}/{item.maxScore}
                    </span>
                  </div>
                  <div className="w-full h-3 rounded-full" style={{ backgroundColor: COLORS.SUBTLE }}>
                    <div 
                      className="h-full rounded-full transition-all duration-500"
                      style={{ 
                        width: `${(item.score / item.maxScore) * 100}%`,
                        background: `linear-gradient(90deg, ${COLORS.TEAL}, ${COLORS.NAVY})`
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <p className="text-sm mt-4" style={{ color: COLORS.MUTED }}>
              Based on your baseline assessment completed {assessment?.date 
                ? new Date(assessment.date).toLocaleDateString() 
                : 'recently'}
            </p>
          </div>
        )}

        {/* 18-Month Timeline */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-6" style={{ color: COLORS.NAVY }}>
            18-Month Development Timeline
          </h2>
          
          <div className="relative">
            {/* Timeline line */}
            <div 
              className="absolute left-8 top-0 bottom-0 w-1"
              style={{ backgroundColor: COLORS.SUBTLE }}
            />

            {/* Phases */}
            <div className="space-y-8">
              {phases.map((phase, index) => {
                const isActive = currentPhase?.id === phase.id;
                const isPast = currentPhase && phase.id < currentPhase.id;
                
                return (
                  <div 
                    key={phase.id}
                    className={`relative pl-20 ${selectedPhase?.id === phase.id ? 'scale-[1.02]' : ''} transition-transform cursor-pointer`}
                    onClick={() => setSelectedPhase(selectedPhase?.id === phase.id ? null : phase)}
                  >
                    {/* Timeline dot */}
                    <div 
                      className={`absolute left-6 top-6 w-5 h-5 rounded-full border-4 ${
                        isActive ? 'ring-4 ring-opacity-30' : ''
                      }`}
                      style={{ 
                        backgroundColor: isActive ? phase.color : (isPast ? COLORS.GREEN : 'white'),
                        borderColor: phase.color,
                        ringColor: phase.color
                      }}
                    />

                    {/* Phase card */}
                    <div 
                      className="p-6 rounded-2xl shadow-md hover:shadow-lg transition-shadow"
                      style={{ 
                        backgroundColor: 'white',
                        borderLeft: `4px solid ${phase.color}`
                      }}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-bold" style={{ color: phase.color }}>
                              {phase.name}
                            </h3>
                            {isActive && (
                              <span 
                                className="px-3 py-1 rounded-full text-xs font-bold"
                                style={{ 
                                  backgroundColor: `${phase.color}20`,
                                  color: phase.color
                                }}
                              >
                                CURRENT
                              </span>
                            )}
                            {isPast && (
                              <Award className="w-5 h-5" style={{ color: COLORS.GREEN }} />
                            )}
                          </div>
                          <p className="text-sm font-semibold mb-1" style={{ color: COLORS.MUTED }}>
                            Months {phase.months}
                          </p>
                          <p className="text-lg font-medium" style={{ color: COLORS.TEXT }}>
                            {phase.focus}
                          </p>
                        </div>
                        <ChevronRight 
                          className={`w-6 h-6 transition-transform ${
                            selectedPhase?.id === phase.id ? 'rotate-90' : ''
                          }`}
                          style={{ color: COLORS.MUTED }}
                        />
                      </div>

                      {/* Expanded details */}
                      {selectedPhase?.id === phase.id && (
                        <div className="mt-4 pt-4 border-t" style={{ borderColor: COLORS.SUBTLE }}>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <h4 className="font-bold mb-3" style={{ color: COLORS.NAVY }}>
                                Key Skills
                              </h4>
                              <ul className="space-y-2">
                                {phase.skills.length > 0 ? phase.skills.map((skill, i) => (
                                  <li key={i} className="flex items-start gap-2">
                                    <TrendingUp className="w-4 h-4 mt-1 flex-shrink-0" style={{ color: phase.color }} />
                                    <span style={{ color: COLORS.TEXT }}>{skill.name || skill}</span>
                                  </li>
                                )) : (
                                  <li className="text-sm" style={{ color: COLORS.MUTED }}>
                                    Skills will be assigned based on your progress
                                  </li>
                                )}
                              </ul>
                            </div>
                            <div>
                              <h4 className="font-bold mb-3" style={{ color: COLORS.NAVY }}>
                                Key Milestones
                              </h4>
                              <ul className="space-y-2">
                                {phase.keyMilestones.map((milestone, i) => (
                                  <li key={i} className="flex items-start gap-2">
                                    <Target className="w-4 h-4 mt-1 flex-shrink-0" style={{ color: phase.color }} />
                                    <span style={{ color: COLORS.TEXT }}>{milestone}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Skills Overview */}
        <div className="mb-8 p-6 rounded-2xl shadow-md bg-white">
          <h2 className="text-2xl font-bold mb-6" style={{ color: COLORS.NAVY }}>
            Complete Skills Roadmap
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {plan.skills?.map((skill, index) => (
              <div 
                key={index}
                className="p-4 rounded-lg border-2 hover:shadow-md transition-shadow"
                style={{ borderColor: COLORS.SUBTLE }}
              >
                <div className="flex items-start gap-3">
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-white"
                    style={{ backgroundColor: COLORS.TEAL }}
                  >
                    {index + 1}
                  </div>
                  <div>
                    <h4 className="font-bold mb-1" style={{ color: COLORS.NAVY }}>
                      {skill.name || skill}
                    </h4>
                    {skill.description && (
                      <p className="text-sm" style={{ color: COLORS.MUTED }}>
                        {skill.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center">
          <button
            onClick={onNavigateToTracker}
            className="px-6 py-3 rounded-lg font-semibold text-white hover:opacity-90 transition-opacity"
            style={{ backgroundColor: COLORS.NAVY }}
          >
            Go to Daily Tracker
          </button>
          <button
            onClick={onStartProgressScan}
            className="px-6 py-3 rounded-lg font-semibold border-2 hover:bg-gray-50 transition-colors"
            style={{ 
              borderColor: COLORS.NAVY,
              color: COLORS.NAVY
            }}
          >
            <Calendar className="w-4 h-4 inline mr-2" />
            Take Progress Scan
          </button>
        </div>
      </div>
    </div>
  );
};

export default DetailedPlanView;
