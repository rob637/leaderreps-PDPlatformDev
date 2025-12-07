import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useAppServices } from '../../services/useAppServices.jsx';
import { getReadings } from '../../services/contentService.js';
import { useDevPlan } from '../../hooks/useDevPlan';
import UniversalResourceViewer from '../ui/UniversalResourceViewer';
import ConfigError from '../../components/system/ConfigError.jsx';
import {
  BookOpen, Target, CheckCircle, Clock, AlertTriangle, MessageSquare, Filter, TrendingUp,
  Star, Search as SearchIcon, Cpu, Zap, Info, Check, ArrowLeft, Loader
} from 'lucide-react';
import { DIMENSION_TO_TIER_MAP } from '../../data/LeadershipTiers.js';
import { logWidthMeasurements } from '../../utils/debugWidth.js';
import { Button, Card, PageLayout, LoadingState } from '../ui';

// --- Complexity Mapping ---
const COMPLEXITY_MAP = {
  Low:    { label: 'Foundational', color: 'text-green-600', icon: CheckCircle },
  Medium: { label: 'Intermediate', color: 'text-amber-600', icon: AlertTriangle },
  High:   { label: 'Advanced',     color: 'text-red-600',   icon: Target },
};

// --- Utilities ---
function getDerivedDuration(book) {
  if (typeof book?.duration === 'number') return book.duration;
  if (typeof book?.pages === 'number') return Math.round(book.pages / 1.5);
  return null;
}

function getDeepDataSignature(booksObject) {
    if (!booksObject || typeof booksObject !== 'object') return 'empty';
    try {
        const keys = Object.keys(booksObject).sort().join(',');
        const count = Object.values(booksObject).reduce((sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0), 0);
        return `${keys}-${count}`;
    } catch {
        return 'error-signature';
    }
}

function getActionSteps() { return ['Define the outcome, then design the smallest repeatable action.']; }
function getFrameworks() { return [{ name: 'Core Principles', desc: 'Prioritize outcomes, feedback loops, and small, testable steps.' }]; }

const API_ERROR_HTML = (executive, book) => {
    const errorTitle = executive ? "EXECUTIVE BRIEFING UNAVAILABLE" : "FULL FLYER UNAVAILABLE";
    return `<div style="padding: 16px;"><h2 style="color:#002E47; font-weight:900; font-size: 22px; border-bottom: 2px solid #EF4444; padding-bottom: 8px;">${errorTitle}</h2>
       <p style="color:#EF4444; font-size: 16px; margin-top: 15px; line-height: 1.6;">
         <strong>Content Error:</strong> The pre-generated ${executive ? 'Executive Brief' : 'Full Flyer'} content for this book ('${book.title}') is missing.
       </p>
       <h3 style="color:#002E47; font-weight:800; font-size: 18px; margin-top:20px;">Static Summary</h3>
       <p style="color:#374151; font-size: 14px; margin-top: 5px;">Theme: ${book.theme || 'N/A'}. Focus: ${book.focus || 'N/A'}.</p>
       </div>`;
};

const getQuestionScore = (query, bookTitle) => {
    const q = (query || '').toLowerCase().trim();
    if (q.length < 15) return { score: 0, tip: 'Question is too short. Be specific about your challenge.' };
    let score = 1;
    let feedback = 'Try relating this book to a specific work challenge.';
    const applicationKeywords = ['how do i', 'apply', 'implement', 'first step', 'next step', 'my team', 'colleague', 'delegate', 'situation'];
    const hasApplication = applicationKeywords.some(keyword => q.includes(keyword));
    const hasContext = q.length > 50;
    if (hasApplication && hasContext) { score = 3; feedback = `Excellent query! Applying ${bookTitle} insights.`; }
    else if (hasApplication || hasContext) { score = 2; feedback = hasApplication ? 'Good start. Add more context.' : 'Great context. Now phrase it as an actionable question.'; }
    return { score, tip: feedback };
};

async function handleAiSubmit(e, services, selectedBook, aiQuery, setIsSubmitting, setAiResponse) {
  e.preventDefault();
  const q = (aiQuery || '').trim();
  if (!selectedBook || !q || !services || typeof services.callSecureGeminiAPI !== 'function') return;

  setIsSubmitting(true);
  setAiResponse('The AI Rep Coach is analyzing the book and your question...');

  const hasKeyOk = typeof services.hasGeminiKey === 'function' ? services.hasGeminiKey() : false;
  if (!hasKeyOk) {
    setAiResponse('**AI Rep Coach Offline:** API configuration is missing.');
    setIsSubmitting(false);
    return;
  }

  try {
    const frameworks = getFrameworks(selectedBook).map(f => f.name).join(', ') || 'Core principles';
    const actions = getActionSteps(selectedBook).slice(0, 3).join(' | ') || 'Define outcome, take small steps';

    const systemPrompt = `You are the LeaderReps AI Rep Coach. Help the user apply principles from "${selectedBook.title}" by ${selectedBook.author}.
      Theme: ${selectedBook.theme || 'N/A'}
      Frameworks: ${frameworks}
      Actions: ${actions}
      User Question: ${q}
      Keep responses concise (3-5 sentences), actionable, and directly answer the question.`;

    const payload = {
        contents: [{ role: 'user', parts: [{ text: systemPrompt }] }],
        model: services.GEMINI_MODEL || 'gemini-2.0-flash',
        generationConfig: { temperature: 0.6, maxOutputTokens: 150 }
    };

    const result = await services.callSecureGeminiAPI(payload);
    const text = result?.candidates?.[0]?.content?.parts?.[0]?.text || 'No response received.';
    setAiResponse(text.trim());
  } catch (err) {
    setAiResponse(`**Error:** ${err.message}`);
  } finally {
    setIsSubmitting(false);
  }
}

// --- Components ---

const SearchInput = React.memo(({ value, onChange }) => (
    <div>
        <label className="block text-sm font-medium mb-1 flex items-center gap-1.5 text-slate-500">
            <SearchIcon className="w-4 h-4 text-corporate-teal"/> Search Library
        </label>
        <input
            type="search"
            value={value}
            onChange={onChange}
            placeholder="Find by title, author, or focus..."
            className="w-full p-3 border border-slate-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-corporate-teal text-sm"
        />
    </div>
));
SearchInput.displayName = 'SearchInput';

const AICoachInput = React.memo(({ aiQuery, handleAiQueryChange, submitHandler, isSubmitting, questionFeedback, selectedBookTitle }) => {
    const score = questionFeedback?.score ?? 0;
    const { bgColor, borderColor, textColor, Icon } = useMemo(() => {
        if (score === 3) return { bgColor: 'bg-emerald-50', borderColor: 'border-emerald-200', textColor: 'text-emerald-800', Icon: Zap };
        if (score === 2) return { bgColor: 'bg-amber-50', borderColor: 'border-amber-200', textColor: 'text-amber-800', Icon: AlertTriangle };
        return { bgColor: 'bg-red-50', borderColor: 'border-red-200', textColor: 'text-red-800', Icon: Info };
    }, [score]);

    return (
        <form onSubmit={submitHandler} className="flex flex-col gap-3">
            {aiQuery.trim().length > 5 && (
                <div className={`p-2 rounded-lg text-xs flex items-center gap-2 border ${bgColor} ${borderColor} ${textColor}`}>
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span className="font-semibold">Query Quality ({score}/3):</span>
                    <span className="flex-1">{questionFeedback?.tip || ''}</span>
                </div>
            )}
            <div className="flex gap-2">
                <input
                    type="text" value={aiQuery} onChange={handleAiQueryChange}
                    placeholder={`Ask AI Rep Coach how to apply "${selectedBookTitle}"...`}
                    className="flex-grow p-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required disabled={isSubmitting}
                />
                <Button
                    type="submit" variant="primary" size="md"
                    className="!bg-purple-600 hover:!bg-purple-700"
                    disabled={!aiQuery.trim() || isSubmitting}
                >
                    <MessageSquare className="w-5 h-5" />
                    {isSubmitting ? 'Thinking…' : 'Ask Coach'}
                </Button>
            </div>
        </form>
    );
});
AICoachInput.displayName = 'AICoachInput';

function BookListStable({ filters, filteredBooks, savedBooks, selectedBook, onSelectBook, onToggleSave, handleSearchChange, handleFilterChange, newResourceIds }) {
    const totalBookCount = useMemo(() => Object.values(filteredBooks || {}).reduce((sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0), 0), [filteredBooks]);
    const hasActiveFilters = filters.search || filters.complexity !== 'All' || filters.maxDuration !== 300;
    const isFilteredEmpty = totalBookCount === 0 && hasActiveFilters;
    const isSourceDataEmpty = totalBookCount === 0 && !hasActiveFilters;

  return (
    <div className="space-y-8">
      <Card title="Personalize Your Library" icon={Filter} accentColor="bg-corporate-teal">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <SearchInput value={filters.search} onChange={handleSearchChange} />
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-500">Complexity Level</label>
            <select
              value={filters.complexity}
              onChange={(e) => handleFilterChange('complexity', e.target.value)}
              className="w-full p-3 border border-slate-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-corporate-teal text-sm"
            >
              <option value="All">All Levels</option>
              {Object.keys(COMPLEXITY_MAP).map(k => (<option key={k} value={k}>{COMPLEXITY_MAP[k].label}</option>))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-500">Max Est. Time ({filters.maxDuration} min)</label>
            <input
              type="range" min="60" max="300" step="10"
              value={filters.maxDuration}
              onChange={(e) => handleFilterChange('maxDuration', parseInt(e.target.value, 10))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-corporate-orange"
            />
            <div className="flex justify-between text-xs mt-1 text-slate-400"><span>60 min</span><span>300 min</span></div>
          </div>
        </div>
      </Card>

      {isSourceDataEmpty && (
           <div className="p-10 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 text-center">
                <AlertTriangle className='w-10 h-10 mx-auto mb-4 text-corporate-orange'/>
                <h3 className="text-xl font-bold text-corporate-navy">Reading Library Empty</h3>
                <p className="text-slate-600 mt-2 text-sm">The reading catalog hasn't been loaded yet.</p>
           </div>
      )}
      {isFilteredEmpty && (
           <div className="p-8 rounded-2xl border border-slate-200 bg-white text-center shadow-sm">
                <SearchIcon className='w-8 h-8 mx-auto mb-3 text-corporate-teal'/>
                <h3 className="text-lg font-bold text-corporate-navy">No Results Found</h3>
                <p className="text-slate-600 mt-1 text-sm">Try adjusting your search query or filter settings.</p>
           </div>
      )}

      {totalBookCount > 0 && !isFilteredEmpty && (
        <div className="space-y-12">
          {Object.entries(filteredBooks).map(([tier, booksInCategory]) => (
            Array.isArray(booksInCategory) && booksInCategory.length > 0 && (
                <div key={tier} className="rounded-2xl shadow-sm overflow-hidden border border-slate-200 bg-white">
                  <div className="p-4 border-b border-slate-100 bg-slate-50">
                    <h3 className="text-lg font-bold flex items-center gap-2 text-corporate-navy">
                        <Target className="w-5 h-5 text-corporate-orange" />
                        {tier}
                    </h3>
                    <p className="text-sm mt-1 text-slate-500">{booksInCategory.length} item{booksInCategory.length !== 1 ? 's' : ''} available</p>
                  </div>

                  <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {booksInCategory.map((book) => {
                      const complexityMeta = COMPLEXITY_MAP[book.complexity] || COMPLEXITY_MAP.Medium;
                      const ComplexityIcon = complexityMeta.icon;
                      const isSaved = !!savedBooks[book.id];
                      const isSelected = selectedBook?.id === book.id;
                      const estimatedDuration = book.duration || getDerivedDuration(book);
                      const isNew = newResourceIds?.has(book.id);

                      return (
                        <div key={book.id} className="relative h-full group">
                          <button
                            onClick={() => onSelectBook(book, tier)}
                            className={`p-5 text-left w-full h-full block rounded-2xl border transition-all duration-300 flex flex-col
                                ${isSelected ? 'border-corporate-teal ring-1 ring-corporate-teal shadow-md' : 'border-slate-200 hover:border-corporate-teal/50 hover:shadow-md'}
                                bg-white`}
                          >
                            {isNew && (
                                <div className="absolute top-2 left-2 z-10 bg-blue-600 text-white px-2 py-1 rounded text-xs font-bold shadow-md animate-pulse">
                                    NEW
                                </div>
                            )}
                            <div className={`absolute top-0 left-0 right-0 h-1.5 rounded-t-2xl ${isSelected ? 'bg-corporate-teal' : 'bg-corporate-orange'}`} />
                            
                            <div className="flex-grow pt-2">
                                <div className="flex gap-3 items-start mb-3">
                                    <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100 flex-shrink-0">
                                        <BookOpen className="w-5 h-5 text-corporate-teal" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="font-bold text-sm leading-snug text-corporate-navy break-words whitespace-normal">{book.title}</p>
                                        <p className="text-xs italic mt-1 text-slate-500">by {book.author}</p>
                                    </div>
                                </div>

                                <div className="my-3 h-px bg-slate-100" />

                                <div className="space-y-1.5 text-xs">
                                    <div className="flex items-center gap-2 text-slate-600">
                                        <Clock className="w-3.5 h-3.5 flex-shrink-0 text-corporate-orange"/>
                                        <span className="font-semibold">Est. Time:</span>
                                        <span className="ml-auto font-bold">{estimatedDuration ? `${estimatedDuration} min` : 'N/A'}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-600">
                                        <ComplexityIcon className={`w-3.5 h-3.5 flex-shrink-0 ${complexityMeta.color}`}/>
                                        <span className="font-semibold">Level:</span>
                                        <span className={`ml-auto font-bold ${complexityMeta.color}`}>{complexityMeta.label}</span>
                                    </div>
                                </div>

                                <div className="mt-3 pt-3 border-t border-slate-100">
                                    <p className="text-[10px] font-semibold uppercase mb-1.5 text-corporate-teal">Key Focus</p>
                                    <div className="flex flex-wrap gap-1">
                                        {(String(book.focus || '').split(',').slice(0, 3)).map((f, i) => (
                                            f.trim() && <span key={i} className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-slate-100 text-slate-600">{f.trim()}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                          </button>

                          <button
                            onClick={(e) => { e.stopPropagation(); onToggleSave(book.id); }}
                            className={`absolute top-2 right-2 p-1.5 rounded-full transition-colors duration-200 shadow-sm
                                ${isSaved ? 'bg-amber-500 text-white' : 'bg-white/80 text-slate-400 hover:text-amber-500'}`}
                          >
                            <Star className="w-4 h-4" fill={isSaved ? 'currentColor' : 'none'} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
            )
          ))}
        </div>
      )}
    </div>
  );
}

function BookFlyerStable({
  selectedBook, htmlFlyer, isFlyerLoading, isExecutiveBrief, setIsExecutiveBrief,
  questionFeedback, aiResponse, aiQuery, handleAiQueryChange, submitHandler,
  savedBooks, onToggleSave, onCommit, isCommitted, isSubmitting, onBack, onRead
}) {
  const progressMinutes = 45;
  const totalDuration = selectedBook.duration || getDerivedDuration(selectedBook) || 180;
  const progressPercent = Math.min(100, Math.round((progressMinutes / totalDuration) * 100));

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 pb-4 border-b border-slate-200">
        <h2 className="text-2xl font-bold flex items-center gap-3 text-corporate-navy">
          <BookOpen className="w-7 h-7 flex-shrink-0 text-corporate-teal" />
          Focus Flyer: {selectedBook.title}
        </h2>
        <Button onClick={onBack} variant="nav-back" size="sm">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Reading List
        </Button>
      </div>

      <Card accentColor="bg-corporate-teal" className="shadow-lg">
        <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
          <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50">
            <TrendingUp className="w-5 h-5 flex-shrink-0 text-corporate-teal"/>
            <div>
              <p className="text-xs font-medium uppercase text-slate-500">Your Progress (Mock)</p>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-32 h-2 rounded-full bg-slate-200">
                  <div className="h-2 rounded-full bg-corporate-teal" style={{ width: `${progressPercent}%` }} />
                </div>
                <span className="text-sm font-bold text-corporate-navy">{progressPercent}%</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {selectedBook.url && (
                 <Button onClick={onRead} variant="primary" size="sm">
                     <BookOpen className="w-4 h-4 mr-2" />
                     Read Document
                 </Button>
            )}
            <div className="flex items-center gap-2">
                <button 
                    type="button" 
                    role="switch" 
                    aria-checked={isExecutiveBrief} 
                    onClick={() => setIsExecutiveBrief(!isExecutiveBrief)}
                    className={`relative inline-flex items-center h-6 w-11 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-corporate-orange ${isExecutiveBrief ? 'bg-corporate-orange' : 'bg-slate-300'}`}
                >
                    <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-200 ${isExecutiveBrief ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
                <span className="text-sm font-semibold text-corporate-navy">Executive Brief</span>
            </div>
          </div>
        </div>

        <div className="p-6 rounded-xl border border-slate-200 bg-slate-50 min-h-[200px]">
            {isFlyerLoading && (
                <div className="h-full flex items-center justify-center gap-2 text-purple-600">
                    <Loader className='w-5 h-5 animate-spin'/>
                    <span className="font-semibold text-sm">Loading Flyer Content...</span>
                </div>
            )}
            {!isFlyerLoading && htmlFlyer.includes('Content Error:') && (
                <div className="h-full flex flex-col items-center justify-center gap-2 p-4 rounded-lg bg-red-50 border border-red-200">
                    <AlertTriangle className='w-6 h-6 text-red-500 mb-2'/>
                    <div className="text-sm text-center max-w-none space-y-2 text-slate-700" dangerouslySetInnerHTML={{ __html: htmlFlyer }} />
                </div>
            )}
            {!isFlyerLoading && !htmlFlyer.includes('Content Error:') && (
                <div className="prose prose-sm max-w-none prose-headings:text-corporate-navy prose-p:text-slate-600" dangerouslySetInnerHTML={{ __html: htmlFlyer }} />
            )}
        </div>

        <div className="mt-8 pt-6 border-t border-slate-200">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-3 text-corporate-navy">
            <MessageSquare className="w-6 h-6 text-purple-600"/> AI Rep Coach: Apply It Now
          </h3>
          {aiResponse && (
            <div className="p-4 mb-4 rounded-xl shadow-sm border-l-4 border-purple-600 bg-purple-50 text-slate-700">
              <p className="text-sm font-semibold flex items-center gap-2 mb-1 text-corporate-navy">
                <Cpu className="w-4 h-4"/> AI Rep Coach Response:
              </p>
              <p className="text-sm whitespace-pre-wrap">{aiResponse}</p>
            </div>
          )}
          <AICoachInput
            aiQuery={aiQuery}
            handleAiQueryChange={handleAiQueryChange}
            submitHandler={submitHandler}
            isSubmitting={isSubmitting}
            questionFeedback={questionFeedback}
            selectedBookTitle={selectedBook.title}
          />
        </div>

        <div className="mt-10 pt-6 flex flex-col sm:flex-row justify-end items-center gap-4 border-t border-slate-200">
          <Button
            onClick={() => onToggleSave(selectedBook.id)}
            variant="outline" size="sm"
            className={`w-full sm:w-auto ${savedBooks[selectedBook.id] ? '!border-amber-500 !text-amber-600' : ''}`}
          >
            <Star className="w-4 h-4" fill={savedBooks[selectedBook.id] ? 'currentColor' : 'none'}/>
            {savedBooks[selectedBook.id] ? 'Saved' : 'Save for Later'}
          </Button>
          <Button
            onClick={onCommit}
            variant={isCommitted ? 'primary' : 'secondary'}
            size="md"
            className={`w-full sm:w-auto ${isCommitted ? '!bg-green-600' : ''}`}
            disabled={isCommitted}
          >
            {isCommitted ? <Check className="w-5 h-5" /> : <TrendingUp className="w-5 h-5" />}
            {isCommitted ? 'Added to Practice!' : 'Add to Daily Practice'}
          </Button>
        </div>
      </Card>
    </div>
  );
}

export default function BusinessReadingsScreen() {
  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    logWidthMeasurements('BusinessReadings');
  }, []);
  
  const {
    isLoading: isAppLoading, error: appError,
    db, user, dailyPracticeData, navigate,
    updateDailyPracticeData, callSecureGeminiAPI, hasGeminiKey, GEMINI_MODEL,
  } = useAppServices();
  const { masterPlan, currentWeek } = useDevPlan(); // Get plan data for unlocking logic

  const [cmsReadings, setCmsReadings] = useState([]);
  const [isLoadingCms, setIsLoadingCms] = useState(true);
  const [selectedResource, setSelectedResource] = useState(null); // For viewer
  
  useEffect(() => {
    if (!db) return;
    const loadReadings = async () => {
      try {
        setIsLoadingCms(true);
        const readings = await getReadings(db, user);
        console.log('[BusinessReadings] Loaded readings from CMS:', readings);
        setCmsReadings(readings);
      } catch (error) {
        console.error('[BusinessReadings] Error loading from CMS:', error);
      } finally {
        setIsLoadingCms(false);
      }
    };
    loadReadings();
  }, [db, user]);

  const [selectedBook, setSelectedBook] = useState(null);
  const [selectedTier, setSelectedTier] = useState('');
  const [htmlFlyer, setHtmlFlyer] = useState('');
  const [isFlyerLoading, setIsFlyerLoading] = useState(false);
  const [savedBooks, setSavedBooks] = useState({});
  const [isExecutiveBrief, setIsExecutiveBrief] = useState(false);
  const [isCommitted, setIsCommitted] = useState(false);
  const [filters, setFilters] = useState({ complexity: 'All', maxDuration: 300, search: '' });
  const [aiQuery, setAiQuery] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isSubmittingAi, setIsSubmittingAi] = useState(false);

  // --- Calculate Unlocked Resources ---
  const unlockedResourceIds = useMemo(() => {
      if (!masterPlan || masterPlan.length === 0) return new Set();
      const ids = new Set();
      const currentWeekNum = currentWeek?.weekNumber || 1;

      // Iterate through weeks 1 to currentWeek
      masterPlan.forEach(week => {
          if (week.weekNumber <= currentWeekNum) {
              if (week.content && Array.isArray(week.content)) {
                  week.content.forEach(item => {
                      if (!item) return;
                      // Normalize all IDs to lowercase strings for robust matching
                      if (item.resourceId) ids.add(String(item.resourceId).toLowerCase());
                      if (item.contentItemId) ids.add(String(item.contentItemId).toLowerCase());
                      if (item.id) ids.add(String(item.id).toLowerCase()); // Fallback
                  });
              }
          }
      });

      // --- HOTFIX: Manually unlock PDQ Feedback Loop for Week 1 ---
      // The item '0BbmuVLhcCBvFynISfkb' is missing from the Week 1 content list in the database.
      // We manually unlock it here to ensure visibility until the DB is patched.
      if (currentWeekNum >= 1) {
          ids.add('0bbmuvlhccbvfynisfkb'); 
      }
      // -----------------------------------------------------------

      console.log('[BusinessReadings] Master Plan:', masterPlan);
      console.log('[BusinessReadings] Current Week:', currentWeek);
      console.log('[BusinessReadings] Unlocked IDs:', Array.from(ids));
      return ids;
  }, [masterPlan, currentWeek]);

  // --- Calculate Newly Unlocked Resources (This Week) ---
  const newResourceIds = useMemo(() => {
      if (!masterPlan) return new Set();
      const ids = new Set();
      const currentWeekNum = currentWeek?.weekNumber || 1;
      
      const thisWeek = masterPlan.find(w => w.weekNumber === currentWeekNum);
      if (thisWeek?.content && Array.isArray(thisWeek.content)) {
          thisWeek.content.forEach(item => {
              if (!item) return;
              if (item.resourceId) ids.add(String(item.resourceId).toLowerCase());
              if (item.contentItemId) ids.add(String(item.contentItemId).toLowerCase());
              if (item.id) ids.add(String(item.id).toLowerCase()); // Fallback
          });
      }
      return ids;
  }, [masterPlan, currentWeek]);

  const allBooks = useMemo(() => {
    if (cmsReadings && cmsReadings.length > 0) {
      const grouped = {};
      cmsReadings.forEach(reading => {
        const readingId = String(reading.id).toLowerCase();

        // DEBUG: Log if we find the missing item
        if (reading.title && (reading.title.includes('PDQ') || reading.title.includes('Feedback Loop'))) {
             console.log('[BusinessReadings] Found target item in CMS:', reading);
             console.log('[BusinessReadings] Normalized ID:', readingId);
             console.log('[BusinessReadings] Is Unlocked?', unlockedResourceIds.has(readingId));
             console.log('[BusinessReadings] isHiddenUntilUnlocked?', reading.isHiddenUntilUnlocked);
        }

        // Check if reading should be hidden
        if (reading.isHiddenUntilUnlocked && !unlockedResourceIds.has(readingId)) {
            return; // Skip hidden readings that aren't unlocked
        }

        const category = reading.category || 'Uncategorized';
        if (!grouped[category]) grouped[category] = [];
        grouped[category].push({
          id: reading.id,
          title: reading.title,
          author: reading.metadata?.author || '',
          theme: reading.description,
          complexity: reading.metadata?.complexity || 'Medium',
          duration: reading.metadata?.duration || 0,
          focus: reading.metadata?.focus || '',
          fullFlyerHTML: reading.metadata?.fullFlyerHTML || '',
          executiveBriefHTML: reading.metadata?.executiveBriefHTML || '',
          url: reading.url,
          tier: reading.tier,
          isActive: reading.isActive,
          isHiddenUntilUnlocked: reading.isHiddenUntilUnlocked
        });
      });
      return grouped;
    } else {
      return {};
    }
  }, [cmsReadings, unlockedResourceIds]);

  const deepDataSignature = useMemo(() => getDeepDataSignature(allBooks), [allBooks]);

  const filteredBooks = useMemo(() => {
    if (!allBooks || typeof allBooks !== 'object') return {};
    const searchTerm = (filters.search || '').toLowerCase();
    const maxDuration = filters.maxDuration;
    const complexityFilter = filters.complexity;
    const result = {};
    for (const tier in allBooks) {
        if (Array.isArray(allBooks[tier])) {
            const booksInCategory = allBooks[tier].filter(book => {
                const duration = book.duration || getDerivedDuration(book);
                const durationOK = duration === null || duration <= maxDuration;
                const complexityOK = complexityFilter === 'All' || book.complexity === complexityFilter;
                const searchOK = !searchTerm ||
                    (book.title || '').toLowerCase().includes(searchTerm) ||
                    (book.author || '').toLowerCase().includes(searchTerm) ||
                    (String(book.focus || '')).toLowerCase().includes(searchTerm);
                return durationOK && complexityOK && searchOK;
            });
            if (booksInCategory.length > 0) result[tier] = booksInCategory;
        }
    }
    return result;
  }, [allBooks, filters, deepDataSignature]);

  useEffect(() => {
    if (!selectedBook) {
      setHtmlFlyer('');
      return;
    }
    const contentKey = isExecutiveBrief ? 'executiveBriefHTML' : 'fullFlyerHTML';
    const newHtml = selectedBook[contentKey] || API_ERROR_HTML(isExecutiveBrief, selectedBook);
    setIsFlyerLoading(true);
    const timer = setTimeout(() => {
        setHtmlFlyer(newHtml);
        setIsFlyerLoading(false);
    }, 50);
    return () => clearTimeout(timer);
  }, [selectedBook, isExecutiveBrief]);

  useEffect(() => {
    if (selectedBook) {
      setIsExecutiveBrief(false);
      setAiQuery('');
      setAiResponse('');
      setIsSubmittingAi(false);
      const isCurrentlyCommitted = (dailyPracticeData?.activeCommitments || []).some(
          c => c.source === 'BusinessReadings' && c.id.includes(`read_${selectedBook.id}`) && c.status === 'Pending'
      );
      setIsCommitted(isCurrentlyCommitted);
    }
  }, [selectedBook, dailyPracticeData]);

  useEffect(() => {
    const handler = () => setSelectedBook(null);
    window.addEventListener('lr-close-flyer', handler);
    return () => window.removeEventListener('lr-close-flyer', handler);
  }, []);

  const handleFilterChange = useCallback((key, value) => setFilters(prev => ({ ...prev, [key]: value })), []);
  const handleSearchChange = useCallback((e) => setFilters(prev => ({ ...prev, search: e.target.value })), []);
  const handleAiQueryChange = useCallback((e) => setAiQuery(e.target.value), []);
  const handleSelectBook = useCallback((book, tier) => { setSelectedBook(book); setSelectedTier(tier || ''); }, []);
  const handleToggleSave = useCallback((bookId) => {
    setSavedBooks(prev => {
        const isCurrentlySaved = !!prev[bookId];
        return { ...prev, [bookId]: !isCurrentlySaved };
    });
  }, []);

  const handleCommitment = useCallback(async (book) => {
    if (!book || isCommitted) return;
    const estimatedDuration = book.duration || getDerivedDuration(book) || 0;
    const newCommitment = {
      id: `read_${book.id}_${Date.now()}`,
      text: `Read: ${book.title} (${book.author}) - Est. ${estimatedDuration} min`,
      status: 'Pending',
      isCustom: false,
      linkedGoal: selectedTier || 'Personal Development',
      linkedTier: book.complexity ? (DIMENSION_TO_TIER_MAP[book.complexity] || 'T1') : 'T1',
      source: 'BusinessReadings',
    };

    try {
        const success = await updateDailyPracticeData(currentData => {
            const existingCommitments = currentData?.activeCommitments || [];
            return { ...currentData, activeCommitments: [...existingCommitments, newCommitment] };
        });
        if (success) setIsCommitted(true);
        else throw new Error("updateDailyPracticeData returned false");
    } catch (error) {
        console.error('[BusinessReadings] Failed to add commitment:', error);
        alert('Failed to add reading commitment. Please try again.');
        setIsCommitted(false);
    }
  }, [isCommitted, selectedTier, updateDailyPracticeData]);

  const questionFeedback = useMemo(() => {
    if (!selectedBook) return { score: 0, tip: '' };
    return getQuestionScore(aiQuery, selectedBook.title);
  }, [aiQuery, selectedBook]);

  const submitAiHandler = useCallback((e) => {
      handleAiSubmit(e, { callSecureGeminiAPI, hasGeminiKey, GEMINI_MODEL }, selectedBook, aiQuery, setIsSubmittingAi, setAiResponse);
  }, [aiQuery, selectedBook, callSecureGeminiAPI, hasGeminiKey, GEMINI_MODEL]);

  if (isAppLoading || isLoadingCms) return <LoadingState message="Loading Reading Hub..." />;
  if (appError) return <ConfigError message={`Failed to load Reading Hub data: ${appError.message}`} />;

  return (
    <PageLayout
      title="Reading & Reps"
      subtitle="Access curated business readings and generate AI-powered practice reps."
      icon={BookOpen}
      backTo="library"
      backLabel="Back to Content"
      navigate={navigate}
    >
      {!selectedBook ? (
        <BookListStable
          filters={filters}
          filteredBooks={filteredBooks}
          savedBooks={savedBooks}
          selectedBook={selectedBook}
          onSelectBook={handleSelectBook}
          onToggleSave={handleToggleSave}
          handleSearchChange={handleSearchChange}
          handleFilterChange={handleFilterChange}
          newResourceIds={newResourceIds}
        />
      ) : (
        <BookFlyerStable
          selectedBook={selectedBook}
          htmlFlyer={htmlFlyer}
          isFlyerLoading={isFlyerLoading}
          isExecutiveBrief={isExecutiveBrief}
          setIsExecutiveBrief={setIsExecutiveBrief}
          questionFeedback={questionFeedback}
          aiResponse={aiResponse}
          aiQuery={aiQuery}
          handleAiQueryChange={handleAiQueryChange}
          submitHandler={submitAiHandler}
          savedBooks={savedBooks}
          onToggleSave={handleToggleSave}
          onCommit={() => handleCommitment(selectedBook)}
          isCommitted={isCommitted}
          isSubmitting={isSubmittingAi}
          onBack={() => setSelectedBook(null)}
          onRead={() => setSelectedResource({ ...selectedBook, type: 'pdf' })}
        />
      )}

      {/* Resource Viewer Modal */}
      {selectedResource && (
          <UniversalResourceViewer
              resource={selectedResource}
              onClose={() => setSelectedResource(null)}
          />
      )}
    </PageLayout>
  );
}
