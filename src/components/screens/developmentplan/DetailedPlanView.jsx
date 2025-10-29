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

/* =========================================================
   COLORS & COMPONENTS (Match Dashboard)
========================================================= */
const COLORS = { 
  NAVY: '#002E47', TEAL: '#47A88D', BLUE: '#2563EB', ORANGE: '#E04E1B', 
  GREEN: '#10B981', AMBER: '#F5A800', RED: '#E04E1B', LIGHT_GRAY: '#FCFCFA', 
  OFF_WHITE: '#FFFFFF', SUBTLE: '#E5E7EB', TEXT: '#374151', MUTED: '#4B5563', 
  PURPLE: '#7C3AED', BG: '#F9FAFB' 
};

const Button = ({ children, onClick, disabled = false, variant = 'primary', className = '', size = 'md', ...rest }) => {
    let baseStyle = `inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-4 disabled:opacity-50 disabled:cursor-not-allowed`;
    if (size === 'sm') baseStyle += ' px-4 py-2 text-sm'; 
    else if (size === 'lg') baseStyle += ' px-8 py-4 text-lg'; 
    else baseStyle += ' px-6 py-3 text-base';
    if (variant === 'primary') baseStyle += ` bg-[${COLORS.TEAL}] text-white shadow-lg hover:bg-[#349881] focus:ring-[${COLORS.TEAL}]/50`;
    else if (variant === 'secondary') baseStyle += ` bg-[${COLORS.ORANGE}] text-white shadow-lg hover:bg-[#C33E12] focus:ring-[${COLORS.ORANGE}]/50`;
    else if (variant === 'outline') baseStyle += ` bg-[${COLORS.OFF_WHITE}] text-[${COLORS.TEAL}] border-2 border-[${COLORS.TEAL}] shadow-md hover:bg-[${COLORS.TEAL}]/10 focus:ring-[${COLORS.TEAL}]/50`;
    else if (variant === 'nav-back') baseStyle += ` bg-white text-gray-700 border border-gray-300 shadow-sm hover:bg-gray-100 focus:ring-gray-300/50 px-4 py-2 text-sm`;
    else if (variant === 'ghost') baseStyle += ` bg-transparent text-gray-600 hover:bg-gray-100 focus:ring-gray-300/50 px-3 py-1.5 text-sm`;
    if (disabled) baseStyle += ' bg-gray-300 text-gray-500 shadow-inner border-transparent hover:bg-gray-300';
    return (<button {...rest} onClick={onClick} disabled={disabled} className={`${baseStyle} ${className}`}>{children}</button>);
};

const Card = ({ children, title, icon: Icon, className = '', accent = 'NAVY' }) => {
    const accentColor = COLORS[accent] || COLORS.NAVY;
    return (
        <div className={`relative p-6 rounded-2xl border-2 shadow-xl hover:shadow-lg transition-all duration-300 text-left ${className}`} 
             style={{ background: 'linear-gradient(180deg,#FFFFFF, #FCFCFA)', borderColor: COLORS.SUBTLE, color: COLORS.NAVY }}>
            <span style={{ position:'absolute', top:0, left:0, right:0, height:6, background: accentColor, borderTopLeftRadius:14, borderTopRightRadius:14 }} />
            {Icon && title && (
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center border flex-shrink-0" 
                         style={{ borderColor: COLORS.SUBTLE, background: COLORS.LIGHT_GRAY }}> 
                        <Icon className="w-5 h-5" style={{ color: accentColor }} /> 
                    </div>
                    <h2 className="text-xl font-extrabold" style={{ color: COLORS.NAVY }}>{title}</h2>
                </div>
            )}
            {!Icon && title && <h2 className="text-xl font-extrabold mb-4 border-b pb-2" style={{ color: COLORS.NAVY, borderColor: COLORS.SUBTLE }}>{title}</h2>}
            <div>{children}</div>
        </div>
    );
};

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
  globalMetadata,
  onNavigateToTracker,
  onStartProgressScan,
  onUpdatePlan 
}) => {
  
  const currentPlan = developmentPlanData?.currentPlan;
  const currentCycle = developmentPlanData?.currentCycle || 1;
  const latestAssessment = developmentPlanData?.assessmentHistory?.[developmentPlanData.assessmentHistory.length - 1];
  
  const journeyPhase = useMemo(() => 
    JOURNEY_MAP.find(j => j.cycle === currentCycle)?.phase || 'Foundation', 
    [currentCycle]
  );

  // Prepare data for Radar Chart
  const radarData = useMemo(() => {
    if (!latestAssessment?.scores) return [];
    
    return Object.entries(latestAssessment.scores).map(([dimension, data]) => ({
      subject: dimension.split(' ').slice(0, 2).join(' '), // Shorten labels
      score: typeof data === 'object' ? data.score : data,
      fullMark: 5
    }));
  }, [latestAssessment]);

  if (!currentPlan) {
    return (
      <div className="p-8 text-center">
        <p className="text-lg text-gray-600">No development plan found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: COLORS.BG }}>
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        
        {/* Header Area */}
        <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <Button onClick={onNavigateToTracker} variant="nav-back" size="sm">
                <ArrowLeft className="w-4 h-4" /> Back to Tracker
              </Button>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold mb-2" style={{ color: COLORS.NAVY }}>
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
                    backgroundColor: item.phase === 'Foundation' ? `${COLORS.BLUE}20` : 
                                    item.phase === 'Performance' ? `${COLORS.TEAL}20` : `${COLORS.ORANGE}20`,
                    color: item.phase === 'Foundation' ? COLORS.BLUE : 
                          item.phase === 'Performance' ? COLORS.TEAL : COLORS.ORANGE
                  }}
                >
                  {item.phase}
                </span>
                
                {/* Cycle Title */}
                <h4 className="font-bold text-xs mt-2 mb-1" style={{ color: COLORS.NAVY }}>
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
                        style={{ color: COLORS.TEAL }}>
                    ← YOU ARE HERE
                  </span>
                )}
                
                {/* Completed Indicator */}
                {item.cycle < currentCycle && (
                  <div className="flex justify-center mt-1">
                    <CheckCircle className="w-3 h-3" style={{ color: COLORS.GREEN }} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Assessment Snapshot & Focus Plan Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          
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
                      <PolarGrid stroke={COLORS.SUBTLE} />
                      <PolarAngleAxis 
                        dataKey="subject" 
                        tick={{ fontSize: 9, fill: COLORS.MUTED }} 
                      />
                      <PolarRadiusAxis 
                        angle={30} 
                        domain={[0, 5]} 
                        tick={{ fontSize: 10, fill: COLORS.MUTED }} 
                      />
                      <Radar 
                        name="Your Scores" 
                        dataKey="score" 
                        stroke={COLORS.TEAL} 
                        fill={COLORS.TEAL} 
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
              <div className="space-y-6">
                {currentPlan.focusAreas?.map((area, index) => (
                  <div key={index} 
                       className="flex flex-col sm:flex-row gap-4 border-b pb-6 last:border-b-0" 
                       style={{ borderColor: COLORS.SUBTLE }}>
                    
                    {/* Number Badge */}
                    <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xl font-bold mb-2 sm:mb-0`} 
                         style={{ background: COLORS.ORANGE }}>
                      {index + 1}
                    </div>
                    
                    {/* Area Details */}
                    <div className="flex-1">
                      <h3 className="text-lg font-bold" style={{ color: COLORS.NAVY }}>
                        {area.name}
                        {area.score !== 'N/A' && (
                          <span className="text-sm font-normal text-gray-500"> (Score: {area.score})</span>
                        )}
                      </h3>
                      
                      {/* FIX #3: WHY it Matters & What Good Looks Like */}
                      <div className="mt-2 space-y-2">
                        <div className="p-2 rounded" style={{ backgroundColor: `${COLORS.BLUE}05` }}>
                          <p className="text-xs font-semibold" style={{ color: COLORS.BLUE }}>
                            💡 WHY IT MATTERS:
                          </p>
                          <p className="text-sm italic text-gray-600 mt-1">{area.why}</p>
                        </div>
                        
                        <div className="p-2 rounded" style={{ backgroundColor: `${COLORS.TEAL}05` }}>
                          <p className="text-xs font-semibold" style={{ color: COLORS.TEAL }}>
                            🎯 WHAT GREAT LOOKS LIKE:
                          </p>
                          <p className="text-sm text-gray-600 mt-1">{area.whatGoodLooksLike}</p>
                        </div>
                      </div>
                      
                      {/* Training Plan / Courses */}
                      <h5 className="text-sm font-bold mt-3 mb-2" style={{ color: COLORS.NAVY }}>
                        Related Training:
                      </h5>
                      <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                        {area.courses?.map((course, idx) => (
                          <li key={idx}>Arena Course: <strong>{course}</strong></li>
                        ))}
                        <li className="font-semibold" style={{ color: COLORS.TEAL }}>
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
