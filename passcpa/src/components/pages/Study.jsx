import { Link } from 'react-router-dom';
import { 
  BookOpen, 
  HelpCircle, 
  Target, 
  Clock,
  ChevronRight,
  TrendingUp,
  Zap
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useStudy } from '../../hooks/useStudy';
import { CPA_SECTIONS } from '../../config/examConfig';
import clsx from 'clsx';

const Study = () => {
  const { userProfile } = useAuth();
  const { todayLog, dailyProgress, dailyGoalMet } = useStudy();

  const currentSection = userProfile?.examSection || 'REG';
  const sectionInfo = CPA_SECTIONS[currentSection];

  // Study modes
  const studyModes = [
    {
      id: 'continue',
      title: 'Continue Learning',
      description: 'Pick up where you left off with your current lesson',
      icon: BookOpen,
      color: 'primary',
      link: '/lessons',
      recommended: true
    },
    {
      id: 'practice',
      title: 'Practice Questions',
      description: 'Test your knowledge with MCQ questions',
      icon: HelpCircle,
      color: 'accent',
      link: '/practice'
    },
    {
      id: 'weak',
      title: 'Focus on Weak Areas',
      description: 'Practice topics where you need improvement',
      icon: TrendingUp,
      color: 'amber',
      link: '/practice?mode=weak'
    },
    {
      id: 'quick',
      title: 'Quick 10',
      description: '10 random questions for a quick review',
      icon: Zap,
      color: 'violet',
      link: '/practice?count=10&shuffle=true'
    }
  ];

  const colorClasses = {
    primary: {
      bg: 'bg-primary-100',
      icon: 'text-primary-600',
      border: 'border-primary-200',
      hover: 'hover:border-primary-400'
    },
    accent: {
      bg: 'bg-accent-100',
      icon: 'text-accent-600',
      border: 'border-accent-200',
      hover: 'hover:border-accent-400'
    },
    amber: {
      bg: 'bg-amber-100',
      icon: 'text-amber-600',
      border: 'border-amber-200',
      hover: 'hover:border-amber-400'
    },
    violet: {
      bg: 'bg-violet-100',
      icon: 'text-violet-600',
      border: 'border-violet-200',
      hover: 'hover:border-violet-400'
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm"
            style={{ backgroundColor: sectionInfo?.color }}
          >
            {sectionInfo?.shortName}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Study Session</h1>
            <p className="text-slate-600">Choose how you want to study today</p>
          </div>
        </div>
      </div>

      {/* Today's Progress */}
      <div className="card mb-6">
        <div className="card-body">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-900">Today's Progress</h2>
            <span className={clsx(
              "text-sm font-medium",
              dailyGoalMet ? "text-accent-600" : "text-slate-600"
            )}>
              {dailyGoalMet ? "Goal Complete! 🎉" : `${dailyProgress}% of goal`}
            </span>
          </div>
          
          <div className="relative mb-4">
            <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className={clsx(
                  "h-full transition-all duration-500 rounded-full",
                  dailyGoalMet ? "bg-gradient-to-r from-accent-500 to-accent-400" : "bg-gradient-to-r from-primary-500 to-primary-400"
                )}
                style={{ width: `${Math.min(100, dailyProgress)}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-xl font-bold text-slate-900">
                {todayLog?.earnedPoints || 0}
              </div>
              <div className="text-xs text-slate-500">Points Earned</div>
            </div>
            <div>
              <div className="text-xl font-bold text-slate-900">
                {todayLog?.questionsAttempted || 0}
              </div>
              <div className="text-xs text-slate-500">Questions</div>
            </div>
            <div>
              <div className="text-xl font-bold text-slate-900">
                {todayLog?.studyTimeMinutes || 0}
              </div>
              <div className="text-xs text-slate-500">Minutes</div>
            </div>
          </div>
        </div>
      </div>

      {/* Study Modes */}
      <div className="space-y-4">
        <h2 className="font-semibold text-slate-900">Choose Study Mode</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {studyModes.map((mode) => {
            const colors = colorClasses[mode.color];
            
            return (
              <Link
                key={mode.id}
                to={mode.link}
                className={clsx(
                  "card p-5 border-2 transition-all hover:shadow-md group relative",
                  colors.border,
                  colors.hover
                )}
              >
                {mode.recommended && (
                  <span className="absolute -top-2 -right-2 bg-primary-500 text-white text-xs font-medium px-2 py-1 rounded-full">
                    Recommended
                  </span>
                )}
                
                <div className="flex items-start gap-4">
                  <div className={clsx(
                    "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0",
                    colors.bg
                  )}>
                    <mode.icon className={clsx("w-6 h-6", colors.icon)} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900 group-hover:text-primary-600 transition-colors">
                      {mode.title}
                    </h3>
                    <p className="text-sm text-slate-500 mt-1">
                      {mode.description}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-primary-500 transition-colors" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="mt-8">
        <h2 className="font-semibold text-slate-900 mb-4">Continue Where You Left Off</h2>
        
        <div className="card">
          <div className="divide-y divide-slate-100">
            {/* Mock recent items */}
            {[
              { type: 'lesson', title: 'Capital Gains & Losses', progress: 65 },
              { type: 'practice', title: 'Individual Taxation Quiz', score: '8/10' },
              { type: 'lesson', title: 'Property Transactions', progress: 0 },
            ].map((item, index) => (
              <Link
                key={index}
                to={item.type === 'lesson' ? '/lessons' : '/practice'}
                className="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors"
              >
                <div className={clsx(
                  "w-10 h-10 rounded-xl flex items-center justify-center",
                  item.type === 'lesson' ? "bg-primary-100" : "bg-accent-100"
                )}>
                  {item.type === 'lesson' ? (
                    <BookOpen className="w-5 h-5 text-primary-600" />
                  ) : (
                    <HelpCircle className="w-5 h-5 text-accent-600" />
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-slate-900">{item.title}</h4>
                  <div className="text-sm text-slate-500">
                    {item.progress !== undefined ? (
                      `${item.progress}% complete`
                    ) : (
                      `Score: ${item.score}`
                    )}
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-300" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Study;
