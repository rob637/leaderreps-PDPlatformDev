import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  BookOpen, 
  CheckCircle, 
  ChevronRight, 
  Clock, 
  Lock,
  PlayCircle,
  Search,
  Filter,
  TrendingUp
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { CPA_SECTIONS } from '../../config/examConfig';
import clsx from 'clsx';

// Mock lesson data structure
const MOCK_LESSONS = {
  REG: [
    {
      id: 'area-1',
      title: 'Ethics, Professional Responsibilities, and Federal Tax Procedures',
      shortTitle: 'Ethics & Procedures',
      lessons: [
        { id: 'reg-1-1', title: 'Circular 230 Overview', duration: 15, completed: true },
        { id: 'reg-1-2', title: 'Treasury Department Regulations', duration: 12, completed: true },
        { id: 'reg-1-3', title: 'Preparer Penalties', duration: 18, completed: false },
        { id: 'reg-1-4', title: 'Taxpayer Penalties', duration: 20, completed: false },
        { id: 'reg-1-5', title: 'IRS Audit Process', duration: 15, completed: false },
      ]
    },
    {
      id: 'area-2',
      title: 'Business Law',
      shortTitle: 'Business Law',
      lessons: [
        { id: 'reg-2-1', title: 'Contracts: Formation', duration: 22, completed: false },
        { id: 'reg-2-2', title: 'Contracts: Performance & Remedies', duration: 18, completed: false },
        { id: 'reg-2-3', title: 'Agency Relationships', duration: 16, completed: false },
        { id: 'reg-2-4', title: 'Debtor-Creditor Relationships', duration: 20, completed: false },
        { id: 'reg-2-5', title: 'Federal Securities Regulation', duration: 25, completed: false },
      ]
    },
    {
      id: 'area-3',
      title: 'Federal Taxation of Individuals',
      shortTitle: 'Individual Taxation',
      lessons: [
        { id: 'reg-3-1', title: 'Gross Income Inclusions', duration: 25, completed: false },
        { id: 'reg-3-2', title: 'Gross Income Exclusions', duration: 20, completed: false },
        { id: 'reg-3-3', title: 'Above-the-Line Deductions', duration: 22, completed: false },
        { id: 'reg-3-4', title: 'Itemized Deductions', duration: 28, completed: false },
        { id: 'reg-3-5', title: 'Tax Credits', duration: 24, completed: false },
        { id: 'reg-3-6', title: 'Capital Gains & Losses', duration: 30, completed: false },
        { id: 'reg-3-7', title: 'Property Transactions', duration: 35, completed: false },
      ]
    },
    {
      id: 'area-4',
      title: 'Federal Taxation of Entities',
      shortTitle: 'Entity Taxation',
      lessons: [
        { id: 'reg-4-1', title: 'C Corporation Formation', duration: 20, completed: false },
        { id: 'reg-4-2', title: 'C Corporation Operations', duration: 25, completed: false },
        { id: 'reg-4-3', title: 'S Corporation Rules', duration: 28, completed: false },
        { id: 'reg-4-4', title: 'Partnership Taxation', duration: 30, completed: false },
        { id: 'reg-4-5', title: 'Tax-Exempt Entities', duration: 18, completed: false },
      ]
    }
  ]
};

const Lessons = () => {
  const [searchParams] = useSearchParams();
  const { userProfile } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArea, setSelectedArea] = useState(null);

  const currentSection = userProfile?.examSection || 'REG';
  const sectionInfo = CPA_SECTIONS[currentSection];
  const lessonAreas = MOCK_LESSONS[currentSection] || [];

  // Filter lessons based on search
  const filteredAreas = lessonAreas.map(area => ({
    ...area,
    lessons: area.lessons.filter(lesson =>
      lesson.title.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(area => 
    selectedArea === null || area.id === selectedArea
  ).filter(area => 
    searchQuery === '' || area.lessons.length > 0
  );

  // Calculate stats
  const totalLessons = lessonAreas.reduce((acc, area) => acc + area.lessons.length, 0);
  const completedLessons = lessonAreas.reduce((acc, area) => 
    acc + area.lessons.filter(l => l.completed).length, 0
  );
  const totalDuration = lessonAreas.reduce((acc, area) =>
    acc + area.lessons.reduce((a, l) => a + l.duration, 0), 0
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div 
            className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold"
            style={{ backgroundColor: sectionInfo?.color }}
          >
            {sectionInfo?.shortName}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Lessons</h1>
            <p className="text-slate-600">{sectionInfo?.name}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="card p-4 text-center">
            <div className="text-2xl font-bold text-slate-900">{completedLessons}/{totalLessons}</div>
            <div className="text-sm text-slate-500">Completed</div>
          </div>
          <div className="card p-4 text-center">
            <div className="text-2xl font-bold text-slate-900">{Math.round((completedLessons/totalLessons)*100)}%</div>
            <div className="text-sm text-slate-500">Progress</div>
          </div>
          <div className="card p-4 text-center">
            <div className="text-2xl font-bold text-slate-900">{Math.round(totalDuration/60)}h</div>
            <div className="text-sm text-slate-500">Total Time</div>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search lessons..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <select
            value={selectedArea || ''}
            onChange={(e) => setSelectedArea(e.target.value || null)}
            className="px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">All Areas</option>
            {lessonAreas.map(area => (
              <option key={area.id} value={area.id}>{area.shortTitle}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Lesson Areas */}
      <div className="space-y-6">
        {filteredAreas.map((area, areaIndex) => {
          const areaCompleted = area.lessons.filter(l => l.completed).length;
          const areaProgress = Math.round((areaCompleted / area.lessons.length) * 100);

          return (
            <div key={area.id} className="card">
              {/* Area Header */}
              <div className="card-header">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-primary-600">
                        Area {areaIndex + 1}
                      </span>
                      {areaProgress === 100 && (
                        <CheckCircle className="w-4 h-4 text-accent-500" />
                      )}
                    </div>
                    <h2 className="font-semibold text-slate-900 mt-1">{area.title}</h2>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-slate-900">{areaProgress}%</div>
                    <div className="text-xs text-slate-500">{areaCompleted}/{area.lessons.length}</div>
                  </div>
                </div>
                <div className="mt-3 progress-bar">
                  <div 
                    className="progress-bar-fill"
                    style={{ width: `${areaProgress}%` }}
                  />
                </div>
              </div>

              {/* Lessons List */}
              <div className="divide-y divide-slate-100">
                {area.lessons.map((lesson, lessonIndex) => {
                  const isLocked = false; // Can implement prerequisite logic
                  const isNext = !lesson.completed && area.lessons.slice(0, lessonIndex).every(l => l.completed);

                  return (
                    <Link
                      key={lesson.id}
                      to={isLocked ? '#' : `/lessons/${lesson.id}`}
                      className={clsx(
                        "flex items-center gap-4 p-4 transition-colors",
                        isLocked ? "opacity-50 cursor-not-allowed" : "hover:bg-slate-50",
                        isNext && "bg-primary-50"
                      )}
                    >
                      {/* Status Icon */}
                      <div className={clsx(
                        "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                        lesson.completed && "bg-accent-100",
                        isNext && !lesson.completed && "bg-primary-100",
                        !lesson.completed && !isNext && "bg-slate-100"
                      )}>
                        {isLocked ? (
                          <Lock className="w-5 h-5 text-slate-400" />
                        ) : lesson.completed ? (
                          <CheckCircle className="w-5 h-5 text-accent-600" />
                        ) : isNext ? (
                          <PlayCircle className="w-5 h-5 text-primary-600" />
                        ) : (
                          <BookOpen className="w-5 h-5 text-slate-400" />
                        )}
                      </div>

                      {/* Lesson Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className={clsx(
                          "font-medium truncate",
                          lesson.completed ? "text-slate-600" : "text-slate-900"
                        )}>
                          {lesson.title}
                        </h3>
                        <div className="flex items-center gap-3 text-sm text-slate-500 mt-0.5">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {lesson.duration} min
                          </span>
                          {isNext && (
                            <span className="text-primary-600 font-medium">Up Next</span>
                          )}
                        </div>
                      </div>

                      {/* Arrow */}
                      {!isLocked && (
                        <ChevronRight className={clsx(
                          "w-5 h-5 flex-shrink-0",
                          lesson.completed ? "text-slate-300" : "text-slate-400"
                        )} />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredAreas.length === 0 && (
        <div className="card p-8 text-center">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="font-semibold text-slate-900 mb-2">No lessons found</h3>
          <p className="text-slate-600">
            Try adjusting your search or filter criteria
          </p>
        </div>
      )}
    </div>
  );
};

export default Lessons;
