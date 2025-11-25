// src/components/screens/developmentplan/DetailedPlanView.jsx
// FIX #4: RESTORED DETAILED 18-MONTH PLAN VIEW WITH GRAPHICS
// This was in the OLD Development Plan and user wants it back

import React, { useMemo } from 'react';
import { 
  Target, Calendar, BarChart3, Zap, CheckCircle, Lightbulb, ArrowLeft 
} from 'lucide-react';
import { 
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, 
  ResponsiveContainer 
} from 'recharts';
import { Button, Card } from './DevPlanComponents';

/* =========================================================
   18-MONTH JOURNEY MAP (from OLD Development Plan)
========================================================= */
const JOURNEY_MAP = [
  { cycle: 1, q: 'Q1 (0-3 mo)', phase: 'Foundation', performance: 'Feedback', people: 'Vulnerability-Based Trust', mindset: 'Player→Coach' },
  { cycle: 2, q: 'Q2 (3-6 mo)', phase: 'Foundation', performance: 'Goals & Expectations', people: '1:1s', mindset: 'Ownership & Accountability' },
  { cycle: 3, q: 'Q3 (6-9 mo)', phase: 'Performance', performance: 'Delegation', people: 'Coaching', mindset: 'Player→Coach (Deeper)' },
  { cycle: 4, q: 'Q4 (9-12 mo)', phase: 'Performance', performance: 'Decision-Making / Meetings', people: 'Recognition & Motivation', mindset: 'Leadership Motive' },
  { cycle: 5, q: 'Q5 (12-15 mo)', phase: 'Impact', performance: 'Accountability Systems', people: 'Team Health: Conflict & Commitment', mindset: 'Ownership (Revisited)' },
  { cycle: 6, q: 'Q6 (15-18 mo)', phase: 'Impact', performance: 'Coaching Mastery', people: 'Recognition & Vulnerability Integration', mindset: 'Leadership Identity (Capstone)' },
];

/* =========================================================
   DETAILED PLAN VIEW COMPONENT
========================================================= */
const DetailedPlanView = ({ 
  developmentPlanData, 
  onNavigateToTracker,
  onStartProgressScan
}) => {
  
  const currentPlan = developmentPlanData?.currentPlan;
  const currentCycle = developmentPlanData?.currentCycle || 1;
  const latestAssessment = developmentPlanData?.assessmentHistory?.[developmentPlanData.assessmentHistory.length - 1];
  
  // Width debugging
  React.useEffect(() => {
    setTimeout(() => {
      const container = document.querySelector('.w-full.max-w-7xl');
      if (container) {
        const rect = container.getBoundingClientRect();
        const computed = window.getComputedStyle(container);
        console.log('📐 [DETAILED PLAN VIEW] Width Measurements:', {
          component: 'DetailedPlanView',
          actualWidth: `${rect.width}px`,
          maxWidth: computed.maxWidth,
          padding: computed.padding,
          margin: computed.margin,
          classList: container.className
        });
      }
    }, 100);
  }, []);
  
  const journeyPhase = useMemo(() => 
    JOURNEY_MAP.find(j => j.cycle === currentCycle)?.phase || 'Foundation', 
    [currentCycle]
  );

  // Prepare data for Radar Chart
  const radarData = useMemo(() => {
    // FIXED: Use scores from assessmentHistory's latest item
    const scores = latestAssessment?.assessmentScores || latestAssessment?.answers;

    if (!scores) return [];
    
    return Object.entries(scores).map(([dimension, score]) => {
        // Find the full category name from devPlanUtils.js context (Q_TO_CATEGORY or SKILL_CATEGORIES)
        // Since we don't have devPlanUtils, we'll use simple mapping for display
        const subjectMap = {
            'STRATEGIC': 'Strategy',
            'PEOPLE': 'People',
            'EXECUTION': 'Execution',
            'INFLUENCE': 'Influence',
            'SELF': 'Self-Mgt',
            // Fallback for Q IDs
            'q1': 'Prio.', 'q2': 'Fdbk', 'q3': 'Dev.', 'q4': 'Comm.', 'q5': 'Time',
            'q6': 'Rels.', 'q7': 'Decs.', 'q8': 'Trust', 'q9': 'Cnflict', 'q10': 'Recog.',
        };
        
        const fullSubject = subjectMap[dimension] || dimension.split(' ').slice(0, 2).join(' ');
        
        // Ensure score is a number between 1 and 5
        const numericScore = typeof score === 'string' ? parseInt(score, 10) : Number(score);

        return {
          subject: fullSubject,
          score: isNaN(numericScore) ? 3 : Math.min(5, Math.max(1, numericScore)), // Clamp between 1-5
          fullMark: 5
        };
    }).filter(d => d.subject.length > 0);
  }, [latestAssessment]);


  if (!currentPlan) {
    return (
      <div className="p-4 sm:p-3 sm:p-4 lg:p-6 lg:p-8 text-center">
        <p className="text-lg text-gray-600">No development plan found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#F9FAFB' }}>
      <div className="w-full mx-auto px-4 py-6">
        
        {/* Header Area */}
        <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <Button onClick={onNavigateToTracker} variant="nav-back" size="sm">
                <ArrowLeft className="w-4 h-4" /> Back to Tracker
              </Button>
            </div>
            <h1 className="text-xl sm:text-2xl sm:text-3xl md:text-4xl font-extrabold mb-2" style={{ color: '#002E47' }}>
              Your Arena Development Plan
            </h1>
            <p className="text-lg text-gray-600">
              18-month leadership journey | Current: <strong>Cycle {currentCycle} ({journeyPhase} Phase)</strong>
            </p>
          </div>
          
          {/* Progress Scan Button */}
          <Button onClick={onStartProgressScan} variant="secondary" size="md">
            <Target className="w-5 h-5" /> Start Next 90-Day Scan
          </Button>
        </div>

        {/* FIX #4: 18-Month Journey Map Card (RESTORED from OLD version) */}
        <Card title="Your 18-Month Leadership Journey" icon={Calendar} accent="NAVY">
          <p className="text-sm text-gray-600 mb-4">
            Your complete development path across 6 quarters. Each cycle builds on the previous.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {JOURNEY_MAP.map(item => (
              <div 
                key={item.cycle}
                className={`p-3 rounded-lg border-2 transition-all duration-300 ${
                  item.cycle === currentCycle 
                    ? 'bg-[#47A88D]/10 border-[#47A88D] shadow-lg scale-105' 
                    : 'bg-gray-50 border-gray-200'
                } ${item.cycle < currentCycle ? 'opacity-60' : ''}`}
              >
                {/* Phase Badge */}
                <span 
                  className={`text-[10px] font-bold px-2 py-0.5 rounded`}
                  style={{
                    backgroundColor: item.phase === 'Foundation' ? `${'#002E47'}20` : 
                                    item.phase === 'Performance' ? `${'#47A88D'}20` : `${'#E04E1B'}20`,
                    color: item.phase === 'Foundation' ? '#002E47' : 
                          item.phase === 'Performance' ? '#47A88D' : '#E04E1B'
                  }}
                >
                  {item.phase}
                </span>
                
                {/* Cycle Title */}
                <h4 className="font-bold text-xs mt-2 mb-1" style={{ color: '#002E47' }}>
                  {item.q}
                </h4>
                
                {/* Focus Areas */}
                <ul className="text-[10px] text-gray-600 space-y-0.5">
                  <li><strong>Perf:</strong> {item.performance}</li>
                  <li><strong>People:</strong> {item.people}</li>
                  <li><strong>Mindset:</strong> {item.mindset}</li>
                </ul>
                
                {/* Current Cycle Indicator */}
                {item.cycle === currentCycle && (
                  <span className="block text-center text-[10px] font-bold mt-1" 
                        style={{ color: '#47A88D' }}>
                    ← YOU ARE HERE
                  </span>
                )}
                
                {/* Completed Indicator */}
                {item.cycle < currentCycle && (
                  <div className="flex justify-center mt-1">
                    <CheckCircle className="w-3 h-3" style={{ color: '#47A88D' }} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Assessment Snapshot & Focus Plan Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:p-4 lg:p-6 mt-6">
          
          {/* Left Column: Radar Chart (RESTORED from OLD version) */}
          <div className="lg:col-span-1">
            <Card title="Leadership Profile Snapshot" icon={BarChart3} accent="TEAL">
              <p className="text-sm text-gray-600 mb-4">
                {latestAssessment 
                  ? `Latest assessment scores (as of ${new Date(latestAssessment.date).toLocaleDateString()})`
                  : 'Complete an assessment to see your profile'
                }
              </p>
              
              {radarData.length > 0 ? (
                <div style={{ width: '100%', height: 300 }}>
                  <ResponsiveContainer>
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                      <PolarGrid stroke={'#E5E7EB'} />
                      <PolarAngleAxis 
                        dataKey="subject" 
                        tick={{ fontSize: 9, fill: '#4B5563' }} 
                      />
                      <PolarRadiusAxis 
                        angle={30} 
                        domain={[0, 5]} 
                        tick={{ fontSize: 10, fill: '#4B5563' }} 
                      />
                      <Radar 
                        name="Your Scores" 
                        dataKey="score" 
                        stroke={'#47A88D'} 
                        fill={'#47A88D'} 
                        fillOpacity={0.6} 
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">Complete assessment to view profile</p>
                </div>
              )}
            </Card>
          </div>

          {/* Right Column: 90-Day Focus Plan (RESTORED from OLD version) */}
          <div className="lg:col-span-2">
            <Card title="Your Current 90-Day Focus Plan" icon={Target} accent="ORANGE">
              <p className="text-sm text-gray-600 mb-6">
                Based on your {currentPlan.type === 'Standard Foundation' ? 'standard foundation' : 'latest assessment'}, 
                focus on these <strong>Top {currentPlan.focusAreas?.length || 0} Growth Areas</strong> for this cycle.
              </p>
              
              {/* Focus Areas List */}
              <div className="space-y-4 sm:space-y-5 lg:space-y-6">
                {currentPlan.focusAreas?.map((area, index) => (
                  <div key={index} 
                       className="flex flex-col sm:flex-row gap-4 border-b pb-6 last:border-b-0" 
                       style={{ borderColor: '#E5E7EB' }}>
                    
                    {/* Number Badge */}
                    <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xl font-bold mb-2 sm:mb-0`} 
                         style={{ background: '#E04E1B' }}>
                      {index + 1}
                    </div>
                    
                    {/* Area Details */}
                    <div className="flex-1">
                      <h3 className="text-lg font-bold" style={{ color: '#002E47' }}>
                        {area.name}
                        {area.score !== 'N/A' && (
                          <span className="text-sm font-normal text-gray-500"> (Score: {area.score})</span>
                        )}
                      </h3>
                      
                      {/* FIX #3: WHY it Matters & What Good Looks Like */}
                      <div className="mt-2 space-y-2">
                        <div className="p-2 rounded" style={{ backgroundColor: `${'#002E47'}05` }}>
                          <p className="text-xs font-semibold" style={{ color: '#002E47' }}>
                            💡 WHY IT MATTERS:
                          </p>
                          <p className="text-sm italic text-gray-600 mt-1">{area.why}</p>
                        </div>
                        
                        <div className="p-2 rounded" style={{ backgroundColor: `${'#47A88D'}05` }}>
                          <p className="text-xs font-semibold" style={{ color: '#47A88D' }}>
                            🎯 WHAT GREAT LOOKS LIKE:
                          </p>
                          <p className="text-sm text-gray-600 mt-1">{area.whatGoodLooksLike}</p>
                        </div>
                      </div>
                      
                      {/* Training Plan / Courses */}
                      <h5 className="text-sm font-bold mt-3 mb-2" style={{ color: '#002E47' }}>
                        Related Training:
                      </h5>
                      <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                        {area.courses?.map((course, idx) => (
                          <li key={idx}>Arena Course: <strong>{course}</strong></li>
                        ))}
                        <li className="font-semibold" style={{ color: '#47A88D' }}>
                          <CheckCircle className="w-4 h-4 inline-block mr-1" />
                          Core reps added to Daily Practice
                        </li>
                      </ul>
                    </div>
                  </div>
                ))}
                
                {/* 80/20 Model Note (if applicable) */}
                {currentPlan.type === 'Personalized' && (
                  <p className="text-xs text-gray-500 mt-4 bg-gray-100 p-3 rounded-lg border flex items-start gap-2">
                    <Lightbulb className="w-4 h-4 inline-block mr-1 text-blue-500 flex-shrink-0 mt-0.5" />
                    <span>
                      <strong>80/20 Plan:</strong> Includes standard areas for Cycle {currentCycle} from 
                      the 18-month map, plus one personalized area based on your lowest score.
                    </span>
                  </p>
                )}
              </div>
              
              {/* Button to Daily Practice */}
              <Button 
                onClick={() => window.location.href = '#'} 
                variant="primary" 
                size="md" 
                className="mt-6 w-full"
              >
                <Zap className="w-5 h-5" /> Go to Daily Practice
              </Button>
            </Card>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mt-6">
          <Button 
            onClick={onNavigateToTracker} 
            variant="outline" 
            size="md"
            className="flex-1"
          >
            View Rep Tracker
          </Button>
          <Button 
            onClick={onStartProgressScan} 
            variant="primary" 
            size="md"
            className="flex-1"
          >
            <Target className="w-5 h-5" /> Start 90-Day Progress Scan
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DetailedPlanView;