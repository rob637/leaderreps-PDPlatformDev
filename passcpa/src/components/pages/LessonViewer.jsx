import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  CheckCircle, 
  ChevronLeft, 
  ChevronRight,
  Clock,
  BookOpen,
  HelpCircle,
  Bot,
  Bookmark,
  Share2,
  Volume2,
  Pause,
  Play
} from 'lucide-react';
import { useStudy } from '../../hooks/useStudy';
import clsx from 'clsx';

// Mock lesson content
const MOCK_LESSON = {
  id: 'reg-3-6',
  title: 'Capital Gains & Losses',
  area: 'Federal Taxation of Individuals',
  duration: 30,
  content: `
    <h2>Overview</h2>
    <p>Capital gains and losses arise from the sale or exchange of capital assets. Understanding how to properly classify and calculate these gains and losses is essential for the CPA exam.</p>
    
    <h3>What is a Capital Asset?</h3>
    <p>Under IRC Section 1221, a <strong>capital asset</strong> is defined as all property held by a taxpayer <em>except</em> for specific exclusions:</p>
    <ul>
      <li>Inventory or property held for sale to customers</li>
      <li>Depreciable property or real property used in a trade or business</li>
      <li>Copyrights, literary, musical, or artistic compositions (if created by the taxpayer)</li>
      <li>Accounts or notes receivable acquired in the ordinary course of business</li>
      <li>U.S. government publications</li>
      <li>Commodities derivative financial instruments held by dealers</li>
      <li>Hedging transactions</li>
      <li>Supplies regularly used or consumed in ordinary course of business</li>
    </ul>
    
    <div class="callout callout-tip">
      <strong>Exam Tip:</strong> The most common capital assets tested on the CPA exam include stocks, bonds, personal-use property (like your home or car), and investment property.
    </div>
    
    <h3>Holding Period</h3>
    <p>The holding period determines whether a gain or loss is short-term or long-term:</p>
    <table>
      <tr>
        <th>Holding Period</th>
        <th>Classification</th>
        <th>Tax Rate</th>
      </tr>
      <tr>
        <td>≤ 1 year</td>
        <td>Short-term</td>
        <td>Ordinary income rates (10%-37%)</td>
      </tr>
      <tr>
        <td>> 1 year</td>
        <td>Long-term</td>
        <td>Preferential rates (0%, 15%, or 20%)</td>
      </tr>
    </table>
    
    <div class="callout callout-important">
      <strong>Important:</strong> The holding period begins the day <em>after</em> acquisition and includes the day of sale. "More than one year" means at least one year and one day.
    </div>
    
    <h3>Calculating Capital Gains and Losses</h3>
    <p>The basic formula for calculating gain or loss is:</p>
    <div class="formula">
      <strong>Gain/Loss = Amount Realized - Adjusted Basis</strong>
    </div>
    <p>Where:</p>
    <ul>
      <li><strong>Amount Realized</strong> = Cash received + FMV of property received + Liabilities assumed by buyer</li>
      <li><strong>Adjusted Basis</strong> = Original cost + Capital improvements - Depreciation</li>
    </ul>
    
    <h3>Netting Process</h3>
    <p>Capital gains and losses must be netted in a specific order:</p>
    <ol>
      <li>Net short-term capital gains (STCG) against short-term capital losses (STCL)</li>
      <li>Net long-term capital gains (LTCG) against long-term capital losses (LTCL)</li>
      <li>Net the results from steps 1 and 2 against each other</li>
    </ol>
    
    <h3>Capital Loss Limitations</h3>
    <p>Individual taxpayers can only deduct up to <strong>$3,000</strong> ($1,500 if married filing separately) of net capital losses against ordinary income each year. Excess losses are carried forward indefinitely.</p>
    
    <div class="callout callout-example">
      <strong>Example:</strong> Sarah has $10,000 in LTCL and $2,000 in STCG. Her net capital loss is $8,000. She can deduct $3,000 this year and carry forward $5,000 to future years.
    </div>
  `,
  keyPoints: [
    'Capital assets are all property except specific exclusions under IRC §1221',
    'Holding period > 1 year = long-term (preferential rates)',
    'Netting: STCG/STCL first, then LTCG/LTCL, then combine',
    '$3,000 annual limit on capital loss deduction ($1,500 MFS)',
    'Unused capital losses carry forward indefinitely'
  ],
  relatedQuestions: 12,
  nextLesson: { id: 'reg-3-7', title: 'Property Transactions' },
  prevLesson: { id: 'reg-3-5', title: 'Tax Credits' }
};

const LessonViewer = () => {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const { completeLesson, logActivity } = useStudy();
  
  const [lesson, setLesson] = useState(MOCK_LESSON);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  // Track reading progress
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = Math.round((scrollTop / docHeight) * 100);
      setProgress(Math.min(100, scrollPercent));
      
      if (scrollPercent >= 90 && !isComplete) {
        setIsComplete(true);
      }
    };

    window.addEventListener('scroll', handleScroll);
    logActivity('lesson_started', { lessonId });
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lessonId]);

  const handleComplete = async () => {
    await completeLesson(lessonId, lesson.title, lesson.area);
    navigate('/lessons');
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Sticky Header */}
      <div className="sticky top-0 z-20 bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <Link 
              to="/lessons" 
              className="flex items-center gap-2 text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden sm:inline">Back to Lessons</span>
            </Link>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsBookmarked(!isBookmarked)}
                className={clsx(
                  "p-2 rounded-lg transition-colors",
                  isBookmarked ? "bg-amber-100 text-amber-600" : "text-slate-400 hover:bg-slate-100"
                )}
              >
                <Bookmark className="w-5 h-5" />
              </button>
              <button className="p-2 rounded-lg text-slate-400 hover:bg-slate-100">
                <Share2 className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setIsPlaying(!isPlaying)}
                className={clsx(
                  "p-2 rounded-lg transition-colors",
                  isPlaying ? "bg-primary-100 text-primary-600" : "text-slate-400 hover:bg-slate-100"
                )}
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="h-1 bg-slate-100 rounded-full mt-3 overflow-hidden">
            <div 
              className="h-full bg-primary-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Lesson Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-primary-600 mb-2">
            <BookOpen className="w-4 h-4" />
            <span>{lesson.area}</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-4">{lesson.title}</h1>
          <div className="flex items-center gap-4 text-sm text-slate-500">
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {lesson.duration} min read
            </span>
            <span className="flex items-center gap-1">
              <HelpCircle className="w-4 h-4" />
              {lesson.relatedQuestions} practice questions
            </span>
          </div>
        </div>

        {/* Lesson Content */}
        <div 
          className="prose prose-slate max-w-none mb-12"
          dangerouslySetInnerHTML={{ __html: lesson.content }}
        />

        {/* Key Points Summary */}
        <div className="bg-primary-50 border border-primary-200 rounded-2xl p-6 mb-8">
          <h3 className="font-semibold text-primary-900 mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            Key Points to Remember
          </h3>
          <ul className="space-y-2">
            {lesson.keyPoints.map((point, index) => (
              <li key={index} className="flex items-start gap-2 text-primary-800">
                <span className="text-primary-400">•</span>
                {point}
              </li>
            ))}
          </ul>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <Link 
            to={`/practice?topic=${lesson.id}`}
            className="card p-4 hover:shadow-md transition-shadow group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-accent-100 rounded-xl flex items-center justify-center">
                <HelpCircle className="w-5 h-5 text-accent-600" />
              </div>
              <div>
                <h4 className="font-medium text-slate-900 group-hover:text-accent-600">
                  Practice Questions
                </h4>
                <p className="text-sm text-slate-500">
                  {lesson.relatedQuestions} questions available
                </p>
              </div>
            </div>
          </Link>

          <Link 
            to="/tutor"
            className="card p-4 hover:shadow-md transition-shadow group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
                <Bot className="w-5 h-5 text-violet-600" />
              </div>
              <div>
                <h4 className="font-medium text-slate-900 group-hover:text-violet-600">
                  Ask Penny
                </h4>
                <p className="text-sm text-slate-500">
                  Get help understanding this topic
                </p>
              </div>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between gap-4 pt-8 border-t border-slate-200">
          {lesson.prevLesson ? (
            <Link 
              to={`/lessons/${lesson.prevLesson.id}`}
              className="flex items-center gap-2 text-slate-600 hover:text-primary-600"
            >
              <ChevronLeft className="w-5 h-5" />
              <div className="text-left">
                <div className="text-xs text-slate-400">Previous</div>
                <div className="font-medium">{lesson.prevLesson.title}</div>
              </div>
            </Link>
          ) : <div />}

          {lesson.nextLesson ? (
            <Link 
              to={`/lessons/${lesson.nextLesson.id}`}
              className="flex items-center gap-2 text-slate-600 hover:text-primary-600 text-right"
            >
              <div>
                <div className="text-xs text-slate-400">Next</div>
                <div className="font-medium">{lesson.nextLesson.title}</div>
              </div>
              <ChevronRight className="w-5 h-5" />
            </Link>
          ) : <div />}
        </div>
      </div>

      {/* Completion Banner */}
      {isComplete && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-lg p-4 z-30">
          <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-accent-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-accent-600" />
              </div>
              <div>
                <div className="font-medium text-slate-900">Lesson Complete!</div>
                <div className="text-sm text-slate-500">+10 points earned</div>
              </div>
            </div>
            <button onClick={handleComplete} className="btn-primary">
              Mark Complete & Continue
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LessonViewer;
