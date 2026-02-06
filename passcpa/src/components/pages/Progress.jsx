import { useState } from 'react';
import { 
  TrendingUp, 
  Target, 
  Flame, 
  Calendar,
  Clock,
  CheckCircle,
  BookOpen,
  HelpCircle,
  BarChart3,
  PieChart
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useStudy } from '../../hooks/useStudy';
import { CPA_SECTIONS } from '../../config/examConfig';
import { format, subDays, startOfWeek, eachDayOfInterval } from 'date-fns';
import clsx from 'clsx';

const Progress = () => {
  const { userProfile } = useAuth();
  const { currentStreak, longestStreak, studyPlan } = useStudy();
  const [timeRange, setTimeRange] = useState('week'); // week, month, all

  const currentSection = userProfile?.examSection || 'REG';
  const sectionInfo = CPA_SECTIONS[currentSection];

  // Mock data for demonstration
  const weeklyActivity = eachDayOfInterval({
    start: subDays(new Date(), 6),
    end: new Date()
  }).map(date => ({
    date,
    points: Math.floor(Math.random() * 80) + 20,
    goal: userProfile?.dailyGoal || 50,
    questions: Math.floor(Math.random() * 30),
    lessons: Math.floor(Math.random() * 3),
    minutes: Math.floor(Math.random() * 60) + 15
  }));

  const topicPerformance = [
    { topic: 'Ethics & Procedures', accuracy: 85, questions: 45 },
    { topic: 'Business Law', accuracy: 72, questions: 38 },
    { topic: 'Individual Taxation', accuracy: 68, questions: 67 },
    { topic: 'Entity Taxation', accuracy: 78, questions: 52 },
  ];

  const overallStats = {
    totalQuestions: 202,
    correctAnswers: 154,
    lessonsCompleted: 12,
    totalLessons: 42,
    studyHours: 28,
    averageAccuracy: 76
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Your Progress</h1>
          <p className="text-slate-600 mt-1">
            Track your journey to passing {sectionInfo?.shortName}
          </p>
        </div>
        
        {/* Time Range Selector */}
        <div className="flex items-center gap-2 bg-slate-100 rounded-lg p-1">
          {['week', 'month', 'all'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={clsx(
                "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                timeRange === range
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              {range === 'week' ? 'Week' : range === 'month' ? 'Month' : 'All Time'}
            </button>
          ))}
        </div>
      </div>

      {/* Key Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
              <Flame className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">{currentStreak}</div>
              <div className="text-sm text-slate-500">Day Streak</div>
            </div>
          </div>
          <div className="mt-2 text-xs text-slate-400">
            Best: {longestStreak || currentStreak} days
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
              <HelpCircle className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">{overallStats.totalQuestions}</div>
              <div className="text-sm text-slate-500">Questions</div>
            </div>
          </div>
          <div className="mt-2 text-xs text-slate-400">
            {overallStats.correctAnswers} correct
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-accent-100 rounded-xl flex items-center justify-center">
              <Target className="w-5 h-5 text-accent-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">{overallStats.averageAccuracy}%</div>
              <div className="text-sm text-slate-500">Accuracy</div>
            </div>
          </div>
          <div className="mt-2 text-xs text-slate-400">
            Target: 80%+
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
              <Clock className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">{overallStats.studyHours}h</div>
              <div className="text-sm text-slate-500">Study Time</div>
            </div>
          </div>
          <div className="mt-2 text-xs text-slate-400">
            This {timeRange}
          </div>
        </div>
      </div>

      {/* Weekly Activity Chart */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary-600" />
            <h2 className="font-semibold text-slate-900">Weekly Activity</h2>
          </div>
        </div>
        <div className="card-body">
          <div className="flex items-end justify-between gap-2 h-40">
            {weeklyActivity.map((day, index) => {
              const heightPercent = Math.min(100, (day.points / (day.goal * 1.5)) * 100);
              const isToday = index === weeklyActivity.length - 1;
              const metGoal = day.points >= day.goal;
              
              return (
                <div key={index} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full flex flex-col items-center justify-end h-32">
                    <div 
                      className={clsx(
                        "w-full max-w-8 rounded-t-lg transition-all",
                        metGoal ? "bg-accent-500" : "bg-primary-400",
                        isToday && "ring-2 ring-primary-300 ring-offset-2"
                      )}
                      style={{ height: `${heightPercent}%` }}
                    />
                  </div>
                  <div className="text-xs text-slate-500">
                    {format(day.date, 'EEE')}
                  </div>
                  <div className={clsx(
                    "text-xs font-medium",
                    metGoal ? "text-accent-600" : "text-slate-600"
                  )}>
                    {day.points}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-accent-500 rounded" />
              <span className="text-sm text-slate-600">Goal met</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-primary-400 rounded" />
              <span className="text-sm text-slate-600">Below goal</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Topic Performance */}
        <div className="card">
          <div className="card-header">
            <div className="flex items-center gap-2">
              <PieChart className="w-5 h-5 text-primary-600" />
              <h2 className="font-semibold text-slate-900">Topic Performance</h2>
            </div>
          </div>
          <div className="card-body">
            <div className="space-y-4">
              {topicPerformance.map((topic, index) => (
                <div key={index}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-slate-700">{topic.topic}</span>
                    <span className={clsx(
                      "text-sm font-semibold",
                      topic.accuracy >= 80 ? "text-accent-600" :
                      topic.accuracy >= 70 ? "text-amber-600" : "text-red-600"
                    )}>
                      {topic.accuracy}%
                    </span>
                  </div>
                  <div className="relative h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={clsx(
                        "h-full rounded-full transition-all",
                        topic.accuracy >= 80 ? "bg-accent-500" :
                        topic.accuracy >= 70 ? "bg-amber-500" : "bg-red-500"
                      )}
                      style={{ width: `${topic.accuracy}%` }}
                    />
                    <div 
                      className="absolute top-0 bottom-0 w-0.5 bg-slate-400"
                      style={{ left: '80%' }}
                    />
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    {topic.questions} questions attempted
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Section Progress */}
        <div className="card">
          <div className="card-header">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary-600" />
              <h2 className="font-semibold text-slate-900">Section Progress</h2>
            </div>
          </div>
          <div className="card-body">
            <div className="flex items-center gap-4 mb-6">
              <div 
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold text-xl"
                style={{ backgroundColor: sectionInfo?.color }}
              >
                {sectionInfo?.shortName}
              </div>
              <div>
                <div className="text-3xl font-bold text-slate-900">
                  {Math.round((overallStats.lessonsCompleted / overallStats.totalLessons) * 100)}%
                </div>
                <div className="text-sm text-slate-500">Overall Progress</div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-slate-600">Lessons</span>
                  <span className="font-medium text-slate-900">
                    {overallStats.lessonsCompleted} / {overallStats.totalLessons}
                  </span>
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-bar-fill"
                    style={{ width: `${(overallStats.lessonsCompleted / overallStats.totalLessons) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-slate-600">Questions Mastered</span>
                  <span className="font-medium text-slate-900">
                    {overallStats.correctAnswers} / 1,200+
                  </span>
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-bar-fill"
                    style={{ width: `${(overallStats.correctAnswers / 1200) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-slate-600">Simulations</span>
                  <span className="font-medium text-slate-900">0 / 45</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-bar-fill" style={{ width: '0%' }} />
                </div>
              </div>
            </div>

            {/* Exam Readiness */}
            <div className="mt-6 p-4 bg-slate-50 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-slate-900">Exam Readiness</span>
                <span className="text-sm text-slate-500">Not ready yet</span>
              </div>
              <div className="text-sm text-slate-600">
                Complete at least 80% of lessons and achieve 80%+ accuracy to be exam-ready.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Achievements */}
      <div className="card">
        <div className="card-header">
          <h2 className="font-semibold text-slate-900">Recent Achievements</h2>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { name: 'First Steps', desc: 'Complete your first lesson', earned: true },
              { name: '7-Day Streak', desc: 'Study 7 days in a row', earned: true },
              { name: 'Century Club', desc: 'Answer 100 questions', earned: true },
              { name: 'Perfect 10', desc: '10 correct in a row', earned: false },
            ].map((achievement, index) => (
              <div 
                key={index}
                className={clsx(
                  "p-4 rounded-xl text-center",
                  achievement.earned ? "bg-accent-50" : "bg-slate-50 opacity-50"
                )}
              >
                <div className={clsx(
                  "w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2",
                  achievement.earned ? "bg-accent-100" : "bg-slate-200"
                )}>
                  <CheckCircle className={clsx(
                    "w-6 h-6",
                    achievement.earned ? "text-accent-600" : "text-slate-400"
                  )} />
                </div>
                <div className={clsx(
                  "font-medium text-sm",
                  achievement.earned ? "text-accent-900" : "text-slate-500"
                )}>
                  {achievement.name}
                </div>
                <div className="text-xs text-slate-500 mt-1">{achievement.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Progress;
