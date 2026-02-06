import { Link } from 'react-router-dom';
import { 
  BookOpen, 
  HelpCircle, 
  Target, 
  Flame, 
  Clock, 
  TrendingUp,
  ChevronRight,
  Calendar,
  Bot,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useStudy } from '../../hooks/useStudy';
import { CPA_SECTIONS } from '../../config/examConfig';
import { differenceInDays, format } from 'date-fns';
import clsx from 'clsx';

const Dashboard = () => {
  const { userProfile } = useAuth();
  const { todayLog, currentStreak, dailyProgress, dailyGoalMet, studyPlan } = useStudy();

  const examSection = userProfile?.examSection ? CPA_SECTIONS[userProfile.examSection] : null;
  const examDate = userProfile?.examDate?.toDate?.() || userProfile?.examDate;
  const daysUntilExam = examDate ? differenceInDays(new Date(examDate), new Date()) : null;

  // Check if onboarding is needed
  if (!userProfile?.onboardingComplete) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
        <div className="card p-8 text-center">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-primary-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Complete Your Setup</h2>
          <p className="text-slate-600 mb-6">
            Let's get you set up with your study plan. It only takes a minute!
          </p>
          <Link to="/onboarding" className="btn-primary">
            Get Started
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Welcome back, {userProfile?.displayName?.split(' ')[0] || 'Student'}!
          </h1>
          <p className="text-slate-600 mt-1">
            {format(new Date(), 'EEEE, MMMM d, yyyy')}
          </p>
        </div>
        
        {/* Exam Countdown */}
        {examDate && daysUntilExam !== null && (
          <div className={clsx(
            "flex items-center gap-3 px-4 py-2 rounded-xl",
            daysUntilExam <= 7 ? "bg-red-50 border border-red-200" :
            daysUntilExam <= 30 ? "bg-amber-50 border border-amber-200" :
            "bg-primary-50 border border-primary-200"
          )}>
            <Calendar className={clsx(
              "w-5 h-5",
              daysUntilExam <= 7 ? "text-red-600" :
              daysUntilExam <= 30 ? "text-amber-600" :
              "text-primary-600"
            )} />
            <div>
              <span className={clsx(
                "text-xl font-bold",
                daysUntilExam <= 7 ? "text-red-700" :
                daysUntilExam <= 30 ? "text-amber-700" :
                "text-primary-700"
              )}>
                {daysUntilExam}
              </span>
              <span className="text-sm text-slate-600 ml-1">
                days until {examSection?.shortName || 'exam'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Daily Progress Card */}
      <div className="card">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary-600" />
              <h2 className="font-semibold text-slate-900">Today's Goal</h2>
            </div>
            <div className="flex items-center gap-2 text-amber-600">
              <Flame className="w-5 h-5" />
              <span className="font-semibold">{currentStreak} day streak</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="relative mb-4">
            <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className={clsx(
                  "h-full transition-all duration-500 rounded-full",
                  dailyGoalMet ? "bg-gradient-to-r from-accent-500 to-accent-400" : "bg-gradient-to-r from-primary-500 to-primary-400"
                )}
                style={{ width: `${Math.min(100, dailyProgress)}%` }}
              />
            </div>
            <div className="flex justify-between mt-2 text-sm">
              <span className="text-slate-600">
                {todayLog?.earnedPoints || 0} / {todayLog?.goalPoints || 50} points
              </span>
              <span className={clsx(
                "font-medium",
                dailyGoalMet ? "text-accent-600" : "text-slate-600"
              )}>
                {dailyGoalMet ? "Goal Complete! 🎉" : `${dailyProgress}%`}
              </span>
            </div>
          </div>

          {/* Today's Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-slate-50 rounded-lg">
              <div className="text-2xl font-bold text-slate-900">
                {todayLog?.questionsAttempted || 0}
              </div>
              <div className="text-xs text-slate-500">Questions</div>
            </div>
            <div className="text-center p-3 bg-slate-50 rounded-lg">
              <div className="text-2xl font-bold text-slate-900">
                {todayLog?.lessonsCompleted || 0}
              </div>
              <div className="text-xs text-slate-500">Lessons</div>
            </div>
            <div className="text-center p-3 bg-slate-50 rounded-lg">
              <div className="text-2xl font-bold text-slate-900">
                {todayLog?.studyTimeMinutes || 0}
              </div>
              <div className="text-xs text-slate-500">Minutes</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Continue Learning */}
        <Link to="/lessons" className="card group hover:shadow-md transition-shadow">
          <div className="p-5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center group-hover:bg-primary-200 transition-colors">
                <BookOpen className="w-6 h-6 text-primary-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900 group-hover:text-primary-600 transition-colors">
                  Continue Learning
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  Resume your last lesson
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-primary-600 transition-colors" />
            </div>
          </div>
        </Link>

        {/* Practice Questions */}
        <Link to="/practice" className="card group hover:shadow-md transition-shadow">
          <div className="p-5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-accent-100 rounded-xl flex items-center justify-center group-hover:bg-accent-200 transition-colors">
                <HelpCircle className="w-6 h-6 text-accent-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900 group-hover:text-accent-600 transition-colors">
                  Practice Questions
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  Test your knowledge
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-accent-600 transition-colors" />
            </div>
          </div>
        </Link>

        {/* AI Tutor */}
        <Link to="/tutor" className="card group hover:shadow-md transition-shadow">
          <div className="p-5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center group-hover:bg-violet-200 transition-colors">
                <Bot className="w-6 h-6 text-violet-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900 group-hover:text-violet-600 transition-colors">
                  Ask Penny
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  Get help from your AI tutor
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-violet-600 transition-colors" />
            </div>
          </div>
        </Link>
      </div>

      {/* Study Plan Overview */}
      {examSection && (
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">
              {examSection.name} Study Plan
            </h2>
            <Link to="/progress" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
              View Details
            </Link>
          </div>
          <div className="card-body">
            <div className="flex items-center gap-4 mb-4">
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold"
                style={{ backgroundColor: examSection.color }}
              >
                {examSection.shortName}
              </div>
              <div>
                <div className="font-medium text-slate-900">{examSection.shortName} Section</div>
                <div className="text-sm text-slate-500">{examSection.description}</div>
              </div>
            </div>

            {/* Section Progress Placeholder */}
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-600">Overall Progress</span>
                  <span className="font-medium text-slate-900">32%</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-bar-fill" style={{ width: '32%' }} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-500">Lessons Completed:</span>
                  <span className="font-medium text-slate-900 ml-2">12 / 40</span>
                </div>
                <div>
                  <span className="text-slate-500">Questions Practiced:</span>
                  <span className="font-medium text-slate-900 ml-2">247</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Weak Areas */}
      <div className="card">
        <div className="card-header flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-amber-500" />
            <h2 className="font-semibold text-slate-900">Areas to Improve</h2>
          </div>
          <Link to="/practice?mode=weak" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
            Practice These
          </Link>
        </div>
        <div className="card-body">
          <div className="space-y-3">
            {/* Placeholder weak areas */}
            {[
              { topic: 'Capital Gains & Losses', accuracy: 62, section: 'REG' },
              { topic: 'Leases (ASC 842)', accuracy: 68, section: 'FAR' },
              { topic: 'Audit Sampling', accuracy: 71, section: 'AUD' },
            ].map((area, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div>
                  <div className="font-medium text-slate-900">{area.topic}</div>
                  <div className="text-xs text-slate-500">{area.section}</div>
                </div>
                <div className="text-right">
                  <div className={clsx(
                    "font-semibold",
                    area.accuracy < 70 ? "text-red-600" : "text-amber-600"
                  )}>
                    {area.accuracy}%
                  </div>
                  <div className="text-xs text-slate-500">accuracy</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
