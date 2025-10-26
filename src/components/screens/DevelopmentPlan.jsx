// src/components/screens/DevelopmentPlan.jsx
import React, { useState, useMemo } from 'react';
import { useAppServices } from '../../services/useAppServices.jsx'; // <-- IMPORT SERVICES
import {
  Loader,
  CheckCircle,
  Briefcase,
  Target,
  Users,
  BarChart3,
  TrendingUp,
  Brain,
  MessageSquare,
  Award,
  RefreshCw,
  Flag,
  Calendar,
  Zap,
  UploadCloud, // <-- NEW ICON
  Lock, // <-- NEW ICON
  Lightbulb, // <-- NEW ICON
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend as RechartsLegend } from 'recharts';

/* =========================================================
   COLORS & UI COMPONENTS
========================================================= */
const COLORS = {
  NAVY: '#002E47',
  TEAL: '#47A88D',
  BLUE: '#2563EB',
  ORANGE: '#E04E1B',
  GREEN: '#10B981',
  AMBER: '#F5A800',
  RED: '#E04E1B',
  LIGHT_GRAY: '#FCFCFA',
  SUBTLE: '#E5E7EB',
  TEXT: '#002E47',
  MUTED: '#4B5355',
  PURPLE: '#7C3AED',
};

const Button = ({ children, onClick, disabled = false, variant = 'primary', className = '', ...rest }) => {
  let baseStyle = "px-6 py-3 rounded-xl font-semibold transition-all shadow-xl focus:outline-none focus:ring-4 text-white flex items-center justify-center gap-2";
  if (variant === 'primary') { baseStyle += ` bg-[${COLORS.TEAL}] hover:bg-[#349881] focus:ring-[${COLORS.TEAL}]/50`; }
  else if (variant === 'secondary') { baseStyle += ` bg-[${COLORS.ORANGE}] hover:bg-red-700 focus:ring-[${COLORS.ORANGE}]/50`; }
  else if (variant === 'outline') { baseStyle = `px-6 py-3 rounded-xl font-semibold transition-all shadow-md border-2 border-[${COLORS.TEAL}] text-[${COLORS.TEAL}] hover:bg-[#47A88D]/10 focus:ring-4 focus:ring-[${COLORS.TEAL}]/50 bg-[${COLORS.LIGHT_GRAY}] flex items-center justify-center gap-2`; }
  if (disabled) { baseStyle = "px-6 py-3 rounded-xl font-semibold bg-gray-300 text-gray-500 cursor-not-allowed shadow-inner transition-none flex items-center justify-center gap-2"; }
  return (
    <button {...rest} onClick={onClick} disabled={disabled} className={`${baseStyle} ${className}`}>
      {children}
    </button>
  );
};

const Card = ({ children, title, icon: Icon, className = '', accent = 'NAVY' }) => {
  const accentColor = COLORS[accent] || COLORS.NAVY;
  return (
    <div
      className={`relative p-6 rounded-2xl border-2 shadow-2xl bg-white text-left ${className}`}
      style={{ borderColor: COLORS.SUBTLE, color: COLORS.TEXT }}
    >
      <span style={{ position:'absolute', top:0, left:0, right:0, height:6, background: accentColor, borderTopLeftRadius:14, borderTopRightRadius:14 }} />
      {Icon && (
        <div className="w-10 h-10 rounded-lg flex items-center justify-center border mb-3" style={{ borderColor: COLORS.SUBTLE, background: COLORS.LIGHT_GRAY }}>
          <Icon className="w-5 h-5" style={{ color: COLORS.TEAL }} />
        </div>
      )}
      {title && <h2 className="text-xl font-extrabold mb-2" style={{ color: COLORS.NAVY }}>{title}</h2>}
      {children}
    </div>
  );
};

const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-100">
    <div className="flex flex-col items-center">
      <Loader className="animate-spin text-[#47A88D] h-12 w-12 mb-3" />
      <p className="text-[#002E47] font-semibold">Loading Development Plan...</p>
    </div>
  </div>
);

/* =========================================================
   ASSESSMENT QUESTIONS & SCORING LOGIC
========================================================= */

const ASSESSMENT_QUESTIONS = [
  { id: 'q1', text: 'I have a clear sense of who I am as a leader and why I choose to lead.' },
  { id: 'q2', text: 'When results fall short, I take full responsibility and look first at what I can do differently.' },
  { id: 'q3', text: 'I spend most of my time enabling others to perform rather than doing the work myself.' },
  { id: 'q4', text: 'My team has clear, measurable goals and knows what success looks like each week.' },
  { id: 'q5', text: 'I consistently set and reinforce clear expectations for quality, timelines, and ownership.' },
  { id: 'q6', text: 'I regularly give reinforcing and redirecting feedback that helps people grow.' },
  { id: 'q7', text: 'Decisions on my team are made efficiently, with the right people involved and clear follow-through.' },
  { id: 'q8', text: 'I intentionally model openness and vulnerability to build trust within my team.' },
  { id: 'q9', text: 'My team handles conflict directly and constructively, even when it’s uncomfortable.' },
  { id: 'q10', text: 'I frequently recognize and celebrate progress and contributions in meaningful ways.' },
];

const OPEN_ENDED_QUESTION = "What’s one leadership behavior you most want to strengthen in the next 90 days?";

const LIKERT_SCALE = [
  { value: 1, label: 'Strongly Disagree' },
  { value: 2, label: 'Disagree' },
  { value: 3, label: 'Neutral' },
  { value: 4, label: 'Agree' },
  { value: 5, label: 'Strongly Agree' },
];

const QUESTION_TO_DIMENSION_MAP = {
  q1: 'Leadership Mindset & Identity',
  q2: 'Ownership & Accountability',
  q3: 'Delegation & Empowerment',
  q4: 'Execution & Results',
  q5: 'Clarity & Communication',
  q6: 'Clarity & Communication',
  q7: 'Execution & Results',
  q8: 'Trust & Relationships',
  q9: 'Team Health & Culture',
  q10: 'Recognition & Motivation',
};

const DIMENSION_TO_TIER_MAP = {
    'Leadership Mindset & Identity': 'T1',
    'Ownership & Accountability': 'T1',
    'Execution & Results': 'T2',
    'Clarity & Communication': 'T2',
    'Delegation & Empowerment': 'T3',
    'Trust & Relationships': 'T3',
    'Team Health & Culture': 'T4',
    'Recognition & Motivation': 'T3',
};

const DIMENSIONS_MAP = {
  'Leadership Mindset & Identity': {
    courses: ['Leadership Identity', 'Motive', 'Shift from Player→Coach'],
    why: 'Clarity of “who you are” drives consistent leadership choices.',
    whatGoodLooksLike: 'You lead with authenticity, know your "why", and focus on coaching others.'
  },
  'Ownership & Accountability': {
    courses: ['Ownership', 'Relationship with Boss'],
    why: 'You take full responsibility for outcomes and model upward influence.',
    whatGoodLooksLike: 'You look first at what you can do differently and maintain a healthy, transparent relationship with your boss.'
  },
  'Delegation & Empowerment': {
    courses: ['Shift from Player→Coach', 'Delegation', 'Coaching'],
    why: 'The shift from “doing” to “developing others” is how you scale your leadership.',
    whatGoodLooksLike: 'You assign outcomes (not tasks), trust people with ownership, and coach instead of rescue.'
  },
  'Execution & Results': {
    courses: ['Goals', 'Metrics', 'Decision-Making', 'Accountability'],
    why: 'Your team may lack consistent structure or follow-through.',
    whatGoodLooksLike: 'Your team is aligned on clear goals, makes efficient decisions, and follows through on commitments.'
  },
  'Clarity & Communication': {
    courses: ['Feedback', 'Expectations', 'Meetings'],
    why: 'Communication gaps limit team effectiveness.',
    whatGoodLooksLike: 'You set expectations early, give frequent feedback, and run focused meetings that align your team.'
  },
  'Trust & Relationships': {
    courses: ['Go 1st with VB Trust', '1:1s'],
    why: 'Vulnerability and authenticity are the foundation for psychological safety.',
    whatGoodLooksLike: 'You intentionally model openness to build trust and use 1:1s to strengthen relationships.'
  },
  'Team Health & Culture': {
    courses: ['Conflict', 'Commitment', 'Accountability', 'Crucial Conversations'],
    why: 'Healthy teams debate openly, commit fully, and hold each other accountable.',
    whatGoodLooksLike: 'You model vulnerability, welcome conflict, and turn tension into trust.'
  },
  'Recognition & Motivation': {
    courses: ['Recognition', 'Motivation', 'Coaching'],
    why: 'People who feel seen and valued do their best work.',
    whatGoodLooksLike: 'You recognize contributions frequently and meaningfully, reinforcing behaviors that drive success.'
  },
};

const JOURNEY_MAP = [
  { cycle: 1, q: 'Q1 (0-3 mo)', phase: 'Foundation', performance: 'Feedback', people: 'Vulnerability-Based Trust', mindset: 'Player→Coach' },
  { cycle: 2, q: 'Q2 (3-6 mo)', phase: 'Foundation', performance: 'Goals & Expectations', people: '1:1s', mindset: 'Ownership & Accountability' },
  { cycle: 3, q: 'Q3 (6-9 mo)', phase: 'Performance', performance: 'Delegation', people: 'Coaching', mindset: 'Player→Coach (Deeper)' },
  { cycle: 4, q: 'Q4 (9-12 mo)', phase: 'Performance', performance: 'Decision-Making / Meetings', people: 'Recognition & Motivation', mindset: 'Leadership Motive' },
  { cycle: 5, q: 'Q5 (12-15 mo)', phase: 'Impact', performance: 'Accountability Systems', people: 'Team Health: Conflict & Commitment', mindset: 'Ownership (Revisited)' },
  { cycle: 6, q: 'Q6 (15-18 mo)', phase: 'Impact', performance: 'Coaching Mastery', people: 'Recognition & Vulnerability Integration', mindset: 'Leadership Identity (Capstone)' },
];

const getStandardFoundationPlan = (cycle, openEndedAnswer) => {
    const focusNames = ['Clarity & Communication', 'Trust & Relationships', 'Delegation & Empowerment'];
    const focusAreas = focusNames.map(name => {
        const details = DIMENSIONS_MAP[name];
        return {
          name: name,
          score: 'N/A',
          why: details.why,
          whatGoodLooksLike: details.whatGoodLooksLike,
          courses: details.courses,
          reps: [
            { week: 'Week 1-3', rep: `Practice ${details.courses[0]}` },
            { week: 'Week 4-6', rep: `Practice ${details.courses[1] || details.courses[0]}` },
            { week: 'Week 7-9', rep: `Practice ${details.courses[2] || details.courses[0]}` },
          ]
        };
    });

    return {
        cycle: cycle,
        focusAreas: focusAreas,
        strengths: [],
        openEndedAnswer: openEndedAnswer,
        createdAt: new Date().toISOString(),
    };
};

const scoreAssessment = (answers) => {
  const scores = {};
  const dimensions = {};
  for (const qId in answers) {
    if (qId.startsWith('q')) {
      const dim = QUESTION_TO_DIMENSION_MAP[qId];
      if (!dimensions[dim]) {
        dimensions[dim] = [];
      }
      dimensions[dim].push(answers[qId]);
    }
  }
  for (const dimName in dimensions) {
    const arr = dimensions[dimName];
    const avg = arr.reduce((a, b) => a + b, 0) / arr.length;
    const score = parseFloat(avg.toFixed(1));
    let status;
    if (score >= 4.5) status = 'Strength';
    else if (score >= 3.5) status = 'Developing';
    else status = 'Growth Focus';
    scores[dimName] = { name: dimName, score: score, status: status };
  }
  return scores;
};

const generatePlanFromScores = (scores, openEndedAnswer, cycle) => {
    if (cycle === 1) {
        return getStandardFoundationPlan(cycle, openEndedAnswer);
    }
    const sortedScores = Object.values(scores).sort((a, b) => a.score - b.score);
    const cycleData = JOURNEY_MAP.find(j => j.cycle === cycle) || JOURNEY_MAP[JOURNEY_MAP.length - 1];

    const standardFocusNamesMap = {
      'Feedback': 'Clarity & Communication',
      'Goals & Expectations': 'Execution & Results',
      'Delegation': 'Delegation & Empowerment',
      'Decision-Making / Meetings': 'Execution & Results',
      'Accountability Systems': 'Ownership & Accountability',
      'Coaching Mastery': 'Delegation & Empowerment',
      'Vulnerability-Based Trust': 'Trust & Relationships',
      '1:1s': 'Trust & Relationships',
      'Coaching': 'Delegation & Empowerment',
      'Recognition & Motivation': 'Recognition & Motivation',
      'Team Health: Conflict & Commitment': 'Team Health & Culture',
      'Recognition & Vulnerability Integration': 'Recognition & Motivation'
    };

    let standardFocusNames = [
        standardFocusNamesMap[cycleData.performance] || 'Clarity & Communication',
        standardFocusNamesMap[cycleData.people] || 'Trust & Relationships'
    ];
    standardFocusNames = [...new Set(standardFocusNames)]; // Remove duplicates if mapping results in same dimension

    const personalFocus = sortedScores[0];
    if (personalFocus && !standardFocusNames.includes(personalFocus.name)) {
        standardFocusNames.push(personalFocus.name);
    }

    const finalFocus = standardFocusNames.slice(0, 3).map(name => {
        const details = DIMENSIONS_MAP[name];
        if (!details) {
            console.error(`Missing details for dimension: ${name}. Check DIMENSIONS_MAP.`);
            return null; // Handle missing dimension gracefully
        }
        const scoreData = scores[name];
        return {
          name: name,
          score: scoreData?.score !== undefined ? scoreData.score : 'N/A', // Handle case where score might be missing
          why: details.why,
          whatGoodLooksLike: details.whatGoodLooksLike,
          courses: details.courses,
          reps: [
            { week: 'Week 1-3', rep: `Practice ${details.courses[0]}` },
            { week: 'Week 4-6', rep: `Practice ${details.courses[1] || details.courses[0]}` },
            { week: 'Week 7-9', rep: `Practice ${details.courses[2] || details.courses[0]}` },
          ]
        };
    }).filter(Boolean); // Remove null entries if a dimension was missing

    const strengths = Object.values(scores)
        .filter(d => d.status === 'Strength')
        .slice(0, 2);

    return {
        cycle: cycle,
        focusAreas: finalFocus,
        strengths: strengths,
        openEndedAnswer: openEndedAnswer,
        createdAt: new Date().toISOString(),
    };
};

/* =========================================================
   SUB-COMPONENTS
========================================================= */

const BaselineAssessment = ({ onComplete }) => {
  const [answers, setAnswers] = useState({});
  const [openEnded, setOpenEnded] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAnswerChange = (qId, value) => {
    setAnswers(prev => ({ ...prev, [qId]: value }));
  };

  const completedQuestions = Object.keys(answers).filter(k => k.startsWith('q')).length;
  const isComplete = completedQuestions === ASSESSMENT_QUESTIONS.length;

  const handleSubmit = async () => {
    if (!isComplete) {
      alert('Please answer all 10 questions to generate your plan.');
      return;
    }
    setIsSubmitting(true);
    const scores = scoreAssessment(answers);
    const plan = generatePlanFromScores(scores, openEnded, 1);
    const assessmentData = {
      id: `assessment_${new Date().getTime()}`,
      date: new Date().toISOString(),
      scores: scores,
      answers: answers,
      openEnded: openEnded,
    };
    await new Promise(res => setTimeout(res, 1000));
    onComplete(plan, assessmentData);
    setIsSubmitting(false);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-4xl font-extrabold text-[#002E47] mb-2">Your Arena Leadership Assessment</h1>
      <p className="text-lg text-gray-600 mb-8">
        This 10-question assessment will create your standardized <strong>Foundational 90-Day Plan</strong> and personalize your 18-month journey.
      </p>

      <Card title="Leadership Assessment" icon={BarChart3} accent="TEAL" className="space-y-6">
        {ASSESSMENT_QUESTIONS.map((q, index) => (
          <div key={q.id} className="border-b pb-6">
            <label className="block text-lg font-semibold text-[#002E47] mb-3">
              {index + 1}. {q.text}
            </label>
            <div className="flex flex-col sm:flex-row justify-between sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
              <span className="text-xs font-medium text-gray-500">{LIKERT_SCALE[0].label}</span>
              <div className="flex justify-center space-x-2 sm:space-x-3">
                {LIKERT_SCALE.map(option => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleAnswerChange(q.id, option.value)}
                    className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full font-bold text-lg transition-all duration-200 border-2
                      ${answers[q.id] === option.value
                        ? 'bg-[#002E47] text-white scale-110 border-[#002E47]'
                        : 'bg-white text-[#4B5355] border-gray-300 hover:bg-gray-100'
                      }`}
                    aria-label={option.label}
                  >
                    {option.value}
                  </button>
                ))}
              </div>
              <span className="text-xs font-medium text-gray-500 text-right">{LIKERT_SCALE[LIKERT_SCALE.length - 1].label}</span>
            </div>
          </div>
        ))}
        <div className="pt-4">
            <label className="block text-lg font-semibold text-[#002E47] mb-3">
              {OPEN_ENDED_QUESTION}
            </label>
            <textarea
              value={openEnded}
              onChange={(e) => setOpenEnded(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#47A88D]"
              rows="3"
              placeholder="e.g., 'Giving constructive feedback more consistently'..."
            />
        </div>
      </Card>
      <div className="mt-8 text-center">
        <Button
          onClick={handleSubmit}
          disabled={!isComplete || isSubmitting}
          variant="primary"
          className="px-12 py-4 text-lg"
        >
          {isSubmitting ? <Loader className="animate-spin" /> : <CheckCircle />}
          {isSubmitting ? 'Generating Your Plan...' : `Generate My 90-Day Plan (${completedQuestions}/${ASSESSMENT_QUESTIONS.length})`}
        </Button>
      </div>
    </div>
  );
};


const DevelopmentPlanTracker = ({ pdpData, onStartProgressScan }) => {
  const { user, navigate } = useAppServices(); // <-- Get navigate
  const assessmentHistory = pdpData.assessmentHistory || [];
  const latestAssessment = assessmentHistory[assessmentHistory.length - 1];
  const currentPlan = pdpData.currentPlan;

  if (!currentPlan || !latestAssessment) {
     return (
        <div className="p-8 text-center">
            <h2 className="text-2xl font-bold text-red-600">Plan Data Error</h2>
            <p className="text-gray-600">Could not find a valid plan or assessment. Please try refreshing.</p>
        </div>
     )
  }

  const currentCycle = currentPlan.cycle;
  const journeyPhase = JOURNEY_MAP.find(j => j.cycle === currentCycle)?.phase || 'Foundation';

  const radarData = Object.values(latestAssessment.scores).map(dim => ({
    subject: dim.name.replace(/&/g, '&\n'),
    score: dim.score,
    fullMark: 5,
  }));

  const scoreHistory = assessmentHistory.map(a => ({
      date: new Date(a.date).toLocaleDateString(),
      ...Object.keys(a.scores).reduce((acc, key) => {
          acc[key] = a.scores[key].score;
          return acc;
      }, {})
  }));

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-start">
        <div>
            <h1 className="text-4xl font-extrabold text-[#002E47] mb-2">Your Arena Development Plan</h1>
            <p className="text-lg text-gray-600">
                This is your 18-month journey. You are currently in <strong>Cycle {currentCycle} ({journeyPhase} Phase)</strong>.
            </p>
        </div>
        <Button onClick={onStartProgressScan} variant="secondary">
          <RefreshCw />
          Start 90-Day Progress Scan
        </Button>
      </div>

      <Card title="Your 18-Month Leadership Journey" icon={Calendar} accent="NAVY">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {JOURNEY_MAP.map(item => (
                <div
                    key={item.cycle}
                    className={`p-4 rounded-lg border-2
                        ${item.cycle === currentCycle ? 'bg-[#47A88D]/10 border-[#47A88D] shadow-lg' : 'bg-gray-50 border-gray-200'}
                        ${item.cycle < currentCycle ? 'opacity-50' : ''}
                    `}
                >
                    <span className={`text-xs font-bold px-2 py-0.5 rounded
                        ${item.phase === 'Foundation' ? 'bg-blue-100 text-blue-800' : ''}
                        ${item.phase === 'Performance' ? 'bg-green-100 text-green-800' : ''}
                        ${item.phase === 'Impact' ? 'bg-purple-100 text-purple-800' : ''}
                    `}>{item.phase}</span>
                    <h4 className="font-bold text-sm text-[#002E47] mt-2 mb-1">{item.q}</h4>
                    <ul className="text-xs text-gray-600 space-y-0.5">
                        <li><strong>Perf:</strong> {item.performance}</li>
                        <li><strong>People:</strong> {item.people}</li>
                        <li><strong>Mindset:</strong> {item.mindset}</li>
                    </ul>
                    {item.cycle === currentCycle && <span className="block text-center text-xs font-bold text-[#47A88D] mt-2">Current Focus</span>}
                </div>
            ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
            <Card title="Leadership Profile Snapshot" icon={BarChart3} accent="TEAL">
                 <p className="text-sm text-gray-600 mb-4">Your latest assessment scores (from {new Date(latestAssessment.date).toLocaleDateString()}).</p>
                <div style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer>
                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                            <PolarGrid />
                            <PolarAngleAxis dataKey="subject" fontSize={10} />
                            <PolarRadiusAxis angle={30} domain={[0, 5]} />
                            <Radar name={user.name} dataKey="score" stroke={COLORS.TEAL} fill={COLORS.TEAL} fillOpacity={0.6} />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>
            </Card>
        </div>

        <div className="lg:col-span-2">
             <Card title="Your 90-Day Focus Plan" icon={Target} accent="ORANGE">
                 <p className="text-sm text-gray-600 mb-6">
                    Based on your assessment, here are your <strong>Top {currentPlan.focusAreas.length} Growth Focus Areas</strong> for this 90-day cycle.
                 </p>
                <div className="space-y-6">
                    {currentPlan.focusAreas.map((area, index) => (
                        <div key={index} className="flex gap-4 border-b pb-6 last:border-b-0">
                             <div className={`w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center bg-[${COLORS.ORANGE}] text-white text-2xl font-bold`}>
                                {index + 1}
                             </div>
                             <div>
                                <h3 className="text-lg font-bold text-[#002E47]">{area.name}
                                    {area.score !== 'N/A' && <span className="text-sm font-normal text-gray-500"> (Score: {area.score})</span>}
                                </h3>
                                <p className="text-sm italic text-gray-600 mt-1 mb-2"><strong>Why It Matters:</strong> {area.why}</p>
                                <p className="text-sm text-gray-600 mb-3"><strong>What Good Looks Like:</strong> {area.whatGoodLooksLike}</p>
                                <h5 className="text-sm font-bold text-[#002E47] mb-2">Your Training Plan:</h5>
                                <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                                    {area.courses.map(course => <li key={course}>Arena Course: <strong>{course}</strong></li>)}
                                    <li className="text-blue-600 font-semibold">
                                        <CheckCircle className="w-4 h-4 inline-block mr-1" />
                                        Core reps added to your Daily Practice Scorecard.
                                    </li>
                                </ul>
                             </div>
                        </div>
                    ))}
                    {/* --- NEW: Add 80/20 explanation --- */}
                    {currentCycle > 1 && (
                      <p className="text-sm text-gray-500 mt-4 bg-gray-100 p-3 rounded-lg border">
                        <Lightbulb className="w-4 h-4 inline-block mr-1 text-blue-500" />
                        <strong>Note:</strong> This 90-day plan follows our 80/20 model. It includes standard focus areas based on the 18-month map, plus one personalized area based on your lowest assessment score.
                      </p>
                    )}
                </div>
                {/* --- NEW: Add navigation button --- */}
                <Button onClick={() => navigate('daily-practice')} variant="primary" className="mt-6 w-full">
                  <Zap className="w-5 h-5 mr-2" /> Go to My Daily Practice Scorecard
                </Button>
             </Card>
        </div>
      </div>

       <Card title="🗓️ 90-Day Rep Tracker Summary" icon={Zap} accent="BLUE">
          <p className="text-sm text-gray-600 mb-4">Log your weekly reps on your <strong className="text-blue-600 cursor-pointer hover:underline" onClick={() => navigate('daily-practice')}>Daily Practice Scorecard</strong>. This tracker shows a high-level summary of your plan.</p>
          <table className="w-full">
            <thead className="border-b-2 border-gray-200">
                <tr>
                    <th className="p-2 text-left text-sm font-semibold text-[#002E47]">Week</th>
                    <th className="p-2 text-left text-sm font-semibold text-[#002E47]">Focus Skill</th>
                    <th className="p-2 text-left text-sm font-semibold text-[#002E47]">Example Rep</th>
                </tr>
            </thead>
            <tbody>
                <tr className="border-b border-gray-100">
                    <td className="p-3 text-sm">1-3</td>
                    <td className="p-3 text-sm font-medium">{currentPlan.focusAreas[0]?.name}</td>
                    <td className="p-3 text-sm">{currentPlan.focusAreas[0]?.reps[0]?.rep}</td>
                </tr>
                 <tr className="border-b border-gray-100 bg-gray-50">
                    <td className="p-3 text-sm">4-6</td>
                    <td className="p-3 text-sm font-medium">{currentPlan.focusAreas[1]?.name}</td>
                    <td className="p-3 text-sm">{currentPlan.focusAreas[1]?.reps[1]?.rep}</td>
                </tr>
                 <tr className="border-b border-gray-100">
                    <td className="p-3 text-sm">7-9</td>
                    <td className="p-3 text-sm font-medium">{currentPlan.focusAreas[2]?.name}</td>
                    <td className="p-3 text-sm">{currentPlan.focusAreas[2]?.reps[2]?.rep}</td>
                </tr>
            </tbody>
          </table>
       </Card>

      {scoreHistory.length > 1 && (
        <Card title="Progress Over Time" icon={TrendingUp} accent="PURPLE">
            <p className="text-sm text-gray-600 mb-4">Visualizing your growth across all 8 dimensions from each 90-day scan.</p>
            <div style={{ width: '100%', height: 400 }}>
                 <ResponsiveContainer>
                    <BarChart data={scoreHistory}>
                        <XAxis dataKey="date" />
                        <YAxis domain={[0, 5]}/>
                        <Tooltip />
                        <RechartsLegend />
                        <Bar dataKey="Leadership Mindset & Identity" fill={COLORS.TEAL} />
                        <Bar dataKey="Ownership & Accountability" fill={COLORS.ORANGE} />
                        <Bar dataKey="Delegation & Empowerment" fill={COLORS.BLUE} />
                        <Bar dataKey="Execution & Results" fill={COLORS.PURPLE} />
                        <Bar dataKey="Clarity & Communication" fill={COLORS.GREEN} />
                        <Bar dataKey="Trust & Relationships" fill={COLORS.AMBER} />
                        <Bar dataKey="Team Health & Culture" fill={COLORS.RED} />
                        <Bar dataKey="Recognition & Motivation" fill={COLORS.NAVY} />
                    </BarChart>
                 </ResponsiveContainer>
            </div>
        </Card>
      )}
    </div>
  );
};

const ProgressScan = ({ pdpData, onCompleteScan }) => {
  const [answers, setAnswers] = useState({});
  const [reflection, setReflection] = useState({ q1: '', q2: '', q3: '' });
  const [artifact, setArtifact] = useState({ file: null, context: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const previousPlan = pdpData.currentPlan;

  const handleAnswerChange = (qId, value) => {
    setAnswers(prev => ({ ...prev, [qId]: value }));
  };

  const handleReflectionChange = (qId, value) => {
    setReflection(prev => ({ ...prev, [qId]: value }));
  };

  const completedQuestions = Object.keys(answers).filter(k => k.startsWith('q')).length;
  const isComplete = completedQuestions === ASSESSMENT_QUESTIONS.length;

  // --- NEW: Add check for artifact context ---
  const canSubmit = isComplete && artifact.context.trim().length > 0;

  const handleSubmit = async () => {
    if (!isComplete) {
      alert('Please answer all 10 questions to generate your new plan.');
      return;
    }
    // --- NEW: Artifact context check ---
    if (!artifact.context.trim()) {
        alert('Please provide context for your uploaded artifact.');
        return;
    }
    setIsSubmitting(true);

    const newScores = scoreAssessment(answers);
    const nextCycle = (pdpData.currentCycle || 1) + 1;

    const newPlan = generatePlanFromScores(newScores, reflection.q1, nextCycle);

    const newAssessmentData = {
      id: `assessment_${new Date().getTime()}`,
      date: new Date().toISOString(),
      scores: newScores,
      answers: answers,
      openEnded: reflection.q1,
      reflection: reflection,
      artifact: {
          fileName: artifact.file?.name || 'N/A',
          context: artifact.context,
          focusArea: previousPlan.focusAreas[0].name
      }
    };

    await new Promise(res => setTimeout(res, 1000));

    onCompleteScan(newPlan, newAssessmentData);
    setIsSubmitting(false);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-4xl font-extrabold text-[#002E47] mb-2">👏 The Arena 90-Day Progress Scan</h1>
      <p className="text-lg text-gray-600 mb-8">
        "Measure. Reflect. Refocus." Let's see how you've evolved and set your next 90-day plan.
      </p>

      <Card title="💭 Quick Reflection" icon={MessageSquare} accent="AMBER" className="mb-8 space-y-4">
         <div>
            <label className="block text-md font-semibold text-[#002E47] mb-2">
              🪞 What leadership behavior feels easier now than it did 3 months ago?
            </label>
            <input
              type="text"
              value={reflection.q1}
              onChange={(e) => handleReflectionChange('q1', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F5A800]"
              placeholder="e.g., 'Giving reinforcing feedback...'"
            />
         </div>
         <div>
            <label className="block text-md font-semibold text-[#002E47] mb-2">
              ⚡ Where did you get stuck or lose consistency?
            </label>
            <input
              type="text"
              value={reflection.q2}
              onChange={(e) => handleReflectionChange('q2', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F5A800]"
              placeholder="e.g., 'My 1:1s kept getting cancelled...'"
            />
         </div>
      </Card>

      <Card title="📊 Evidence of Practice (Artifact)" icon={UploadCloud} accent="BLUE" className="mb-8 space-y-4">
         <p className="text-sm text-gray-600">
           To validate your progress, please upload one artifact (evidence) of your work on a previous focus area, like <strong>"{previousPlan.focusAreas[0].name}"</strong>.
         </p>
         <p className="text-xs text-gray-500 italic">Examples: A meeting agenda, a feedback email (names redacted), a project plan, or an expectations doc.</p>

         <div>
            <label className="block text-md font-semibold text-[#002E47] mb-2">
              Context (Required) <span className="text-red-500">*</span>
            </label>
            <textarea
              value={artifact.context}
              onChange={(e) => setArtifact(prev => ({...prev, context: e.target.value}))}
              className={`w-full p-2 border rounded-lg focus:ring-2 ${!artifact.context.trim() ? 'border-red-300 ring-red-300' : 'border-gray-300 ring-[#2563EB]'}`}
              rows="2"
              placeholder="e.g., 'This is the new agenda I created for my weekly team meeting...'"
            />
            {!artifact.context.trim() && <p className="text-xs text-red-600 mt-1">Please provide context for your artifact.</p>}
         </div>

         <div className="flex items-center justify-center w-full">
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <UploadCloud className="w-8 h-8 mb-3 text-gray-400" />
                    {artifact.file ? (
                         <p className="font-semibold text-green-600">{artifact.file.name} selected</p>
                    ) : (
                         <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Click to upload</span> (PDF, DOCX, PNG)</p>
                    )}
                </div>
                <input
                    type="file"
                    className="hidden"
                    onChange={(e) => setArtifact(prev => ({...prev, file: e.target.files[0]}))}
                    accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" // Added typical file types
                />
            </label>
        </div>
      </Card>

      <Card title="🧩 Mini-Assessment (10 Questions)" icon={BarChart3} accent="TEAL" className="space-y-6">
        {ASSESSMENT_QUESTIONS.map((q, index) => (
          <div key={q.id} className="border-b pb-6">
            <label className="block text-lg font-semibold text-[#002E47] mb-3">
              {index + 1}. {q.text}
            </label>
            <div className="flex flex-col sm:flex-row justify-between sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
              <span className="text-xs font-medium text-gray-500">{LIKERT_SCALE[0].label}</span>
              <div className="flex justify-center space-x-2 sm:space-x-3">
                {LIKERT_SCALE.map(option => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleAnswerChange(q.id, option.value)}
                    className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full font-bold text-lg transition-all duration-200 border-2
                      ${answers[q.id] === option.value
                        ? 'bg-[#002E47] text-white scale-110 border-[#002E47]'
                        : 'bg-white text-[#4B5355] border-gray-300 hover:bg-gray-100'
                      }`}
                    aria-label={option.label}
                  >
                    {option.value}
                  </button>
                ))}
              </div>
              <span className="text-xs font-medium text-gray-500 text-right">{LIKERT_SCALE[LIKERT_SCALE.length - 1].label}</span>
            </div>
          </div>
        ))}
      </Card>

      <div className="mt-8 text-center">
        <Button
          onClick={handleSubmit}
          disabled={!canSubmit || isSubmitting} // <-- UPDATED disabled check
          variant="primary"
          className="px-12 py-4 text-lg"
        >
          {isSubmitting ? <Loader className="animate-spin" /> : <CheckCircle />}
          {isSubmitting ? 'Generating New Plan...' : `Lock In My Next 90-Day Plan`}
        </Button>
      </div>
    </div>
  );
};


/* =========================================================
   MAIN EXPORT: DevelopmentPlanScreen
========================================================= */

const DevelopmentPlanScreen = () => {
  const { pdpData, updatePdpData, commitmentData, updateCommitmentData, isLoading } = useAppServices();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [view, setView] = useState('loading');

  useMemo(() => {
    if (isLoading) {
      setView('loading');
      return;
    }

    const hasPlan = pdpData?.currentPlan;

    if (hasPlan) {
        const lastScanDate = new Date(pdpData.lastAssessmentDate || pdpData.createdAt || 0); // Use 0 if no date found
        const now = new Date();
        const daysSinceLastScan = (now - lastScanDate) / (1000 * 60 * 60 * 24);

        // Allow scan slightly early (e.g., day 85) for flexibility
        if (daysSinceLastScan >= 85) {
            setView('scan');
        } else {
            setView('tracker');
        }
    } else {
      setView('assessment');
    }
  }, [pdpData, isLoading]);

  const syncPlanToDailyPractice = async (newPlan) => {
      const newCoreReps = newPlan.focusAreas.map((area, index) => {
          const tier = DIMENSION_TO_TIER_MAP[area.name] || 'T1';
          return {
              id: `pdp-${newPlan.cycle}-${index}-${Date.now()}`,
              text: `[90-Day Focus] ${area.reps[0].rep}`,
              status: 'Pending',
              isCustom: false,
              linkedGoal: `Plan: ${area.name}`,
              linkedTier: tier,
              targetColleague: 'Self-Focus',
              source: 'DevelopmentPlan'
          };
      });

      const existingCommitments = commitmentData?.active_commitments || [];
      const nonCoreCommitments = existingCommitments.filter(c => c.source !== 'DevelopmentPlan');

      await updateCommitmentData(data => ({
          ...data,
          active_commitments: [
              ...nonCoreCommitments,
              ...newCoreReps
          ]
      }));
  };

  const handleAssessmentComplete = async (plan, assessment) => {
    setIsSubmitting(true);

    // Prepare data for the main doc update
    const newPdpData = {
      // Don't spread pdpData here to avoid accidentally including old history arrays if they exist
      currentPlan: plan,
      currentCycle: 1,
      createdAt: new Date().toISOString(), // Use ISO string for consistency
      lastAssessmentDate: assessment.date,
    };

    try {
      // 1. Update the main PDP document
      // We assume updatePdpData is smart enough to handle merge/overwrite correctly
      await updatePdpData(newPdpData);

      // 2. Simulate saving assessment to subcollection (In real app, call a separate function)
      console.log("[SAVE] Saving assessment to assessment_history subcollection:", assessment);
      // await saveToSubcollection('assessment_history', assessment); // Placeholder for actual function

      // 3. Simulate saving plan to subcollection
      console.log("[SAVE] Saving plan to plan_history subcollection:", plan);
      // await saveToSubcollection('plan_history', plan); // Placeholder for actual function

      // 4. Sync this first plan with DailyPractice
      await syncPlanToDailyPractice(plan);

    } catch (error) {
      console.error("Error completing assessment:", error);
      alert("There was an error saving your assessment. Please try again.");
    } finally {
      setIsSubmitting(false);
      // State will update via listener, triggering useMemo -> setView('tracker')
    }
  };

  const handleScanComplete = async (newPlan, newAssessment) => {
     setIsSubmitting(true);

     // Prepare data for the main doc update
     const newPdpData = {
       // Don't spread pdpData here
       currentPlan: newPlan,
       currentCycle: newPlan.cycle,
       lastAssessmentDate: newAssessment.date,
       // Include other top-level fields if necessary, but exclude history arrays
       createdAt: pdpData?.createdAt || new Date().toISOString(), // Preserve original creation date
     };

     try {
       // 1. Update the main PDP document
       await updatePdpData(newPdpData);

       // 2. Simulate saving assessment to subcollection
       console.log("[SAVE] Saving assessment to assessment_history subcollection:", newAssessment);
       // await saveToSubcollection('assessment_history', newAssessment); // Placeholder

       // 3. Simulate saving plan to subcollection
       console.log("[SAVE] Saving plan to plan_history subcollection:", newPlan);
       // await saveToSubcollection('plan_history', newPlan); // Placeholder

       // 4. Sync this new plan with DailyPractice
       await syncPlanToDailyPractice(newPlan);

     } catch (error) {
       console.error("Error completing progress scan:", error);
       alert("There was an error saving your progress scan. Please try again.");
     } finally {
       setIsSubmitting(false);
       // State will update via listener, triggering useMemo -> setView('tracker')
     }
  };

  if (view === 'loading' || isSubmitting) {
    return <LoadingSpinner />;
  }

  if (view === 'assessment') {
    return <BaselineAssessment onComplete={handleAssessmentComplete} />;
  }

  if (view === 'scan') {
    return <ProgressScan pdpData={pdpData} onCompleteScan={handleScanComplete} />;
  }

  if (view === 'tracker') {
    // Pass only necessary data. History would be fetched within Tracker if needed.
    // For now, pass a placeholder if assessmentHistory isn't in main doc.
    const historyForTracker = pdpData.assessmentHistory || [{ date: pdpData.lastAssessmentDate, scores: {} }]; // Placeholder/Fallback
    return (
        <DevelopmentPlanTracker
            pdpData={{...pdpData, assessmentHistory: historyForTracker }}
            onStartProgressScan={() => setView('scan')}
        />
    );
  }

  return (
     <div className="p-8 text-center">
        <h2 className="text-2xl font-bold text-red-600">Error</h2>
        <p className="text-gray-600">Could not determine the correct view state ({view}). Please try again.</p>
    </div>
  );
};

export default DevelopmentPlanScreen;