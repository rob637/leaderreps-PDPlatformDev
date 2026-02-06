import { 
  Flame, Trophy, MessageSquare, Calendar, BookOpen, Play, Book, Video, FileText, Users, UserPlus, Search, Radio, History, BarChart2, Bot, Cpu, Dumbbell, TrendingUp, CheckCircle, Edit, Lightbulb, CheckSquare, X, Plus, Loader, Save, Bell, Target, Zap, Crosshair, Flag, MessageCircle, Heart, Sun, Moon, PenTool, Quote, User, Repeat, Clock, Circle, ChevronDown, Info, Coffee
} from 'lucide-react';

// Helper for Roadmap Widgets
export const createRoadmapWidget = (title, ideas) => `
<div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
  <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
    <Lightbulb className="w-5 h-5 text-yellow-500" />
    ${title}
  </h3>
  <div className="space-y-3">
    ${ideas.map(idea => `
    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm opacity-80 hover:opacity-100 transition-opacity">
      <div className="flex justify-between items-start mb-1">
        <h4 className="font-bold text-slate-800 text-sm">${idea.title}</h4>
        <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-full uppercase tracking-wider">Coming Soon</span>
      </div>
      <p className="text-xs text-slate-500 leading-relaxed">${idea.desc}</p>
    </div>
    `).join('')}
  </div>
</div>
`;

// Idea Lists - REMOVED












export const WIDGET_TEMPLATES = {
    'am-bookend-header': `
<>
{/* Catch Up Alert */}
{(() => {
   if (typeof missedWeeks !== 'undefined' && missedWeeks && missedWeeks.length > 0) {
       return (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between mb-4">
             <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-full text-amber-600">
                   <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                   <h4 className="font-bold text-amber-900">You have {missedWeeks.length} missed {missedWeeks.length === 1 ? 'week' : 'weeks'}</h4>
                   <p className="text-xs text-amber-700">Complete key activities from prior weeks to keep up with your cohort.</p>
                </div>
             </div>
             <button 
                onClick={() => setIsCatchUpModalOpen(true)}
                className="px-3 py-1.5 bg-amber-100 text-amber-800 text-xs font-bold rounded-lg hover:bg-amber-200 transition-colors"
             >
                View Missed
             </button>
          </div>
       );
   }
   return null;
})()}

<div className="flex items-center gap-3 mb-4 mt-4">
  <Sun className="w-6 h-6 text-orange-500" />
  <h2 className="text-xl font-bold text-[#002E47]">AM Bookend: Start Strong</h2>
  <div className="h-px bg-slate-200 flex-1 ml-4"></div>
</div>

</>
    `,
    'weekly-focus': `
(() => {
  // Check for Daily Plan data (New Architecture)
  if (typeof currentDayData !== 'undefined' && currentDayData) {
     const dayNum = currentDayData.dayNumber;
     const isPrep = dayNum < 1;
     const isWeekend = currentDayData.isWeekend;
     
     // Get the focus text
     const focus = currentDayData.focus || (isWeekend ? "Recharge and Reflect" : "Win The Day");
     
     // Dynamic accent based on context
     let accent = "NAVY";
     let icon = Target;
     
     if (isPrep) {
        accent = "ORANGE";
        icon = Zap;
     } else if (isWeekend) {
        accent = "TEAL";
        icon = Coffee;
     }

     // Single-line format: "Today's Focus: [focus text]"
     const prefix = isWeekend ? "Weekend Focus" : (isPrep ? "Prep Focus" : "Today's Focus");
     
     return (
        <div className="flex items-center gap-3 bg-white rounded-xl p-4 border-l-4 border-l-corporate-navy border border-slate-200 shadow-sm">
           <div className="p-2 bg-corporate-navy/10 rounded-lg">
              {React.createElement(icon, { className: "w-5 h-5 text-corporate-navy" })}
           </div>
           <p className="text-lg text-corporate-navy"><span className="font-bold">{prefix}:</span> {focus}</p>
        </div>
     );
  }

  // Get the weekly focus from scope (calculated by Dashboard using useDevPlan with time travel)
  const focus = weeklyFocus || "Leadership Identity";
  
  return (
    <div className="flex items-center gap-3 bg-white rounded-xl p-4 border-l-4 border-l-corporate-navy border border-slate-200 shadow-sm">
       <div className="p-2 bg-corporate-navy/10 rounded-lg">
          <Target className="w-5 h-5 text-corporate-navy" />
       </div>
       <p className="text-lg text-corporate-navy"><span className="font-bold">Today's Focus:</span> {focus}</p>
    </div>
  );
})()
    `,
    'lis-maker': `
<Card title="LIS Maker" icon={PenTool} accent="NAVY" helpText={widgetHelpText}>
  <div className="space-y-2">
    <div className="bg-teal-50 p-3 rounded-xl border border-teal-100">
      <h4 className="font-bold text-teal-900 mb-1">Build Your Identity</h4>
      <p className="text-sm text-teal-800 mb-2">
        Your Leadership Identity Statement (LIS) anchors you in who you want to be.
      </p>
      <p className="text-xs text-teal-600 italic mb-1">
        Try this format: "I am a [Core Value] leader who [Action] to create [Impact]."
      </p>
    </div>

    <div>
      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
        Your Statement
      </label>
      <textarea 
        value={identityStatement}
        onChange={(e) => setIdentityStatement(e.target.value)}
        className="w-full p-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none transition-all text-sm min-h-[80px]"
        placeholder="I am a..."
      />
    </div>

    <button 
      onClick={() => handleSaveIdentity(identityStatement)}
      className="w-full py-2 bg-[#002E47] text-white rounded-xl font-bold hover:bg-[#003E5F] transition-colors flex items-center justify-center gap-2"
    >
      <Save className="w-4 h-4" />
      Save Identity
    </button>
  </div>
</Card>
    `,
    'grounding-rep': `
(() => {
  // Don't show in Week 1 - Grounding Rep starts Week 2
  const weekNum = typeof currentWeekNumber !== 'undefined' ? currentWeekNumber : 1;
  if (weekNum <= 1) {
    return (
      <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
        <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
          <Zap className="w-4 h-4 text-orange-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-700">Grounding Rep</p>
          <p className="text-xs text-slate-500">Unlocks Week 2</p>
        </div>
        <div className="flex items-center gap-1 px-2 py-1 bg-slate-200 rounded-full">
          <Clock className="w-3 h-3 text-slate-500" />
          <span className="text-[10px] font-medium text-slate-500 uppercase">Soon</span>
        </div>
      </div>
    );
  }
  
  const hasLIS = identityStatement && identityStatement.trim().length > 0;
  const isEditing = typeof isEditingLIS !== 'undefined' ? isEditingLIS : false;
  const setEditing = typeof setIsEditingLIS !== 'undefined' ? setIsEditingLIS : () => {};
  
  // Use scope state instead of React.useState (react-live can't handle hooks in IIFE)
  const isRevealed = typeof groundingRepRevealed !== 'undefined' ? groundingRepRevealed : false;
  const showConfetti = typeof groundingRepConfetti !== 'undefined' ? groundingRepConfetti : false;
  const groundingRepDone = typeof groundingRepCompleted !== 'undefined' ? groundingRepCompleted : false;
  
  // Handle reveal - calls scope handler
  const handleReveal = () => {
    if (typeof handleGroundingRepComplete === 'function') {
      handleGroundingRepComplete();
    }
  };
  
  // Handle close - calls scope handler
  const handleClose = () => {
    if (typeof handleGroundingRepClose === 'function') {
      handleGroundingRepClose();
    }
  };

  if (isEditing) {
    return (
      <Card title="LIS Maker" icon={PenTool} accent="NAVY" helpText={widgetHelpText}>
        <div className="space-y-2">
          <div className="bg-teal-50 p-2 rounded-xl border border-teal-100">
            <h4 className="font-bold text-teal-900 mb-0 text-sm">Build Your Identity</h4>
            <p className="text-xs text-teal-800 mb-1">
              Your Leadership Identity Statement (LIS) anchors you in who you want to be.
            </p>
            <p className="text-[10px] text-teal-600 italic mb-0">
              Try this format: "I am a [Core Value] leader who [Action] to create [Impact]."
            </p>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0">
              Your Statement
            </label>
            <textarea 
              value={identityStatement}
              onChange={(e) => setIdentityStatement(e.target.value)}
              className="w-full p-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none transition-all text-xs min-h-[60px]"
              placeholder="I am a..."
            />
          </div>

          <div className="flex gap-2">
            <button 
              onClick={() => setEditing(false)}
              className="flex-1 py-1 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors text-xs"
            >
              Cancel
            </button>
            <button 
              onClick={() => {
                handleSaveIdentity(identityStatement);
                setEditing(false);
              }}
              className="flex-1 py-1 bg-[#002E47] text-white rounded-xl font-bold hover:bg-[#003E5F] transition-colors flex items-center justify-center gap-2 text-xs"
            >
              <Save className="w-3 h-3" />
              Save
            </button>
          </div>
        </div>
      </Card>
    );
  }

  // Revealed state - show the LIS with close button
  // Only show if actively revealed (not just because it's done today - user can close it)
  if (isRevealed) {
    return (
      <Card title="Grounding Rep" icon={Zap} accent="ORANGE" helpText={widgetHelpText}>
        <div className="text-center relative overflow-hidden pt-0">
          {showConfetti && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className="text-4xl animate-bounce absolute top-0 left-1/4">🎉</div>
              <div className="text-4xl animate-bounce absolute top-0 right-1/4" style={{animationDelay: '0.1s'}}>✨</div>
            </div>
          )}
          
          <div className="flex items-center justify-center gap-2 mb-1">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span className="text-[10px] font-bold text-green-600 uppercase tracking-wider">Grounding Rep Complete!</span>
          </div>
          
          <Quote className="w-4 h-4 text-yellow-300 mx-auto mb-0 opacity-60" />
          
          <p className="text-sm font-serif font-medium text-slate-800 italic px-4 leading-tight">
            "{identityStatement}"
          </p>
          
          <div className="mt-1 flex justify-center gap-3">
            <button 
              className="text-[10px] font-bold text-slate-500 hover:text-slate-700 uppercase tracking-wider flex items-center gap-1"
              onClick={handleClose}
            >
              <X className="w-3 h-3" />
              Close
            </button>
            <button 
              className="text-[10px] font-bold text-yellow-700 hover:text-yellow-800 uppercase tracking-wider flex items-center gap-1"
              onClick={() => setEditing(true)}
            >
              Edit
            </button>
          </div>
        </div>
      </Card>
    );
  }

  // Completed today but closed - show completion badge with option to view again
  if (groundingRepDone) {
    return (
      <Card title="Grounding Rep" icon={Zap} accent="ORANGE" helpText={widgetHelpText}>
        <div className="text-center py-0">
          <div className="flex items-center justify-center gap-2 mb-0">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span className="text-xs font-bold text-green-600">Complete for Today!</span>
          </div>
          <button
            onClick={handleReveal}
            className="text-[10px] font-medium text-slate-500 hover:text-slate-700 underline"
          >
            View Your LIS Again
          </button>
        </div>
      </Card>
    );
  }

  // Default state - click to reveal
  return (
    <Card title="Grounding Rep" icon={Zap} accent="ORANGE" helpText={widgetHelpText}>
      {hasLIS ? (
        <div className="text-center py-0">
          <button
            onClick={handleReveal}
            className="group relative w-full py-2 px-4 bg-gradient-to-br from-yellow-50 via-orange-50 to-yellow-50 rounded-xl border-2 border-dashed border-yellow-300 hover:border-yellow-400 hover:from-yellow-100 hover:via-orange-100 hover:to-yellow-100 transition-all duration-300"
          >
            <div className="flex flex-col items-center gap-1">
              <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <Zap className="w-4 h-4 text-yellow-600 group-hover:text-yellow-700" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800 mb-0">Ground Yourself</p>
                <p className="text-[10px] text-slate-500">Tap to reveal your Leadership Identity</p>
              </div>
              <div className="text-[10px] font-medium text-yellow-600 bg-yellow-100 px-2 py-0.5 rounded-full">
                +1 Rep Earned
              </div>
            </div>
          </button>
        </div>
      ) : (
        <div className="text-center py-2">
          <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-2 text-slate-400">
            <User className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-slate-700 mb-1">Who are you as a leader?</h4>
          <p className="text-sm text-slate-500 mb-3">
            You haven't defined your Leadership Identity Statement yet.
          </p>
          <button 
            className="px-4 py-2 bg-[#002E47] text-white rounded-lg text-sm font-bold hover:bg-[#003E5F] transition-colors"
            onClick={() => setEditing(true)}
          >
            Create LIS
          </button>
        </div>
      )}
    </Card>
  );
})()
    `,
    'win-the-day': `
(() => {
  return (
    <Card title="Win the Day" icon={Trophy} accent="TEAL">
      <div className="space-y-1">
        <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">
          Identify 3 High-Impact Actions
        </p>
        
        {morningWins.map((win, index) => {
          const hasText = win.text && win.text.trim().length > 0;
          return (
          <div key={win.id} className="flex gap-2 items-center p-2 rounded-xl bg-slate-50 border border-slate-100">
            <button 
              onClick={() => hasText && handleToggleWinComplete(index)}
              className={\`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors \${
                win.completed 
                  ? 'bg-green-500 border-green-500' 
                  : hasText ? 'border-slate-300 hover:border-blue-400 cursor-pointer' : 'border-slate-200 bg-slate-100 cursor-not-allowed opacity-50'
              }\`}
              title={win.completed ? "Mark Incomplete" : "Mark Complete"}
            >
              {win.completed && <CheckCircle className="w-3 h-3 text-white" />}
            </button>

            <div className="flex-1">
              <input 
                type="text"
                value={win.text}
                onChange={(e) => handleUpdateWin(index, e.target.value)}
                onBlur={() => handleSaveSingleWin && handleSaveSingleWin(index)}
                placeholder={\`Enter Priority #\${index + 1}\`}
                className={\`w-full bg-transparent outline-none text-sm font-bold \${
                  win.completed
                    ? 'text-green-700 line-through placeholder:text-green-300' 
                    : 'text-slate-700 placeholder:text-slate-400'
                }\`}
              />
            </div>
          </div>
        )})}
        
        <button 
          onClick={() => handleSaveAllWins && handleSaveAllWins()}
          className="w-full mt-2 py-2 bg-[#002E47] text-white rounded-xl font-bold hover:bg-[#003E5F] transition-colors flex items-center justify-center gap-2 text-sm"
        >
          {isSavingWIN ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Priorities
        </button>
      </div>
    </Card>
  );
})()
    `,
    'daily-plan': `
(() => {
  // New Daily Plan Logic
  if (typeof currentDayData !== 'undefined' && currentDayData) {
      const content = currentDayData.content || [];
      const actions = currentDayData.actions || [];
      const hasItems = content.length > 0 || actions.length > 0;
      const navFn = typeof navigate !== 'undefined' ? navigate : (typeof scope !== 'undefined' && scope.navigate ? scope.navigate : () => {});
      
      return (
        <Card title="Today's Plan" icon={Calendar} accent="TEAL">
           <div className="space-y-3">
              {!hasItems && (
                 <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
                    <p className="text-sm text-slate-500">No specific items scheduled for today.</p>
                 </div>
              )}
              
              {/* Actions */}
              {actions.map((action, idx) => (
                 <div key={\`action-\${idx}\`} className="flex gap-3 items-center p-3 bg-white rounded-lg border border-slate-200 shadow-sm">
                    <div className={\`w-2 h-2 rounded-full \${action.type === 'daily_rep' ? 'bg-corporate-teal' : 'bg-orange-400'}\`}></div>
                    <div className="flex-1">
                        <div className="text-sm font-medium text-slate-700">{action.label}</div>
                        {action.resourceId && (
                            <div className="mt-1 text-xs text-blue-600 flex items-center gap-1 cursor-pointer hover:underline" onClick={() => navFn('business-readings')}>
                                <BookOpen className="w-3 h-3" />
                                <span>{action.resourceTitle || 'View Resource'}</span>
                            </div>
                        )}
                    </div>
                 </div>
              ))}

              {/* Content */}
              {content.map((item, idx) => (
                 <div key={\`content-\${idx}\`} className="flex gap-3 items-center p-2 bg-blue-50 rounded-lg border border-blue-100 cursor-pointer hover:bg-blue-100 transition-colors" onClick={() => navFn('business-readings')}>
                    <div className="p-1.5 bg-blue-100 rounded-full text-blue-600"><BookOpen className="w-4 h-4" /></div>
                    <div className="flex-1">
                       <div className="text-sm font-bold text-blue-900">{item.title}</div>
                       <div className="text-xs text-blue-600">{item.type}</div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-blue-400" />
                 </div>
              ))}
           </div>
        </Card>
      );
  }

  // Get current week data
  const currentWeek = typeof devPlanCurrentWeek !== 'undefined' ? devPlanCurrentWeek : null;
  const navFn = typeof navigate !== 'undefined' ? navigate : (typeof scope !== 'undefined' && scope.navigate ? scope.navigate : () => {});
  
  // Get Today's Day Name
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const today = new Date();
  const todayName = dayNames[today.getDay()];
  
  // Filter Items for Today
  // We include items marked for 'Any' day, specific day, or if the day field is missing (legacy support)
  const content = (currentWeek?.content || []).filter(i => i.day === todayName || i.day === 'Any' || !i.day);
  
  // Community items might use 'day' or 'recommendedWeekDay'
  const community = (currentWeek?.community || []).filter(i => {
      const day = i.day || i.recommendedWeekDay;
      return day === todayName || day === 'Any' || !day;
  });

  const coaching = (currentWeek?.coaching || []).filter(i => i.day === todayName || i.day === 'Any' || !i.day);
  
  // Reps are handled by the daily-leader-reps widget usually, but we can show them here too if they are specific to a day
  const reps = (currentWeek?.dailyReps || currentWeek?.reps || []).filter(i => i.day === todayName);

  const hasItems = content.length > 0 || community.length > 0 || coaching.length > 0 || reps.length > 0;

  return (
    <Card title={\`Today's Plan (\${todayName})\`} icon={Calendar} accent="TEAL">
      <div className="space-y-3">
        {!hasItems && (
           <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
            <p className="text-sm text-slate-500">No specific items scheduled for today.</p>
            <p className="text-xs text-slate-400 mt-1">Check the Weekly Focus or catch up on previous days.</p>
          </div>
        )}

        {/* Content */}
        {content.map((item, idx) => (
           <div key={\`content-\${idx}\`} className="flex gap-3 items-center p-2 bg-blue-50 rounded-lg border border-blue-100 cursor-pointer hover:bg-blue-100 transition-colors" onClick={() => navFn('business-readings')}>
              <div className="p-1.5 bg-blue-100 rounded-full text-blue-600"><BookOpen className="w-4 h-4" /></div>
              <div className="flex-1">
                <p className="text-xs font-bold text-blue-800 uppercase">{item.contentItemType || 'Content'}</p>
                <p className="text-sm font-medium text-slate-800">{item.contentItemLabel || item.title}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-blue-300" />
           </div>
        ))}

        {/* Community */}
        {community.map((item, idx) => (
           <div key={\`comm-\${idx}\`} className="flex gap-3 items-center p-2 bg-teal-50 rounded-lg border border-teal-100 cursor-pointer hover:bg-teal-100 transition-colors" onClick={() => navFn('community')}>
              <div className="p-1.5 bg-teal-100 rounded-full text-teal-600"><Users className="w-4 h-4" /></div>
              <div className="flex-1">
                <p className="text-xs font-bold text-teal-800 uppercase">{item.communityItemType || 'Community'}</p>
                <p className="text-sm font-medium text-slate-800">{item.communityItemLabel || item.label}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-teal-300" />
           </div>
        ))}

        {/* Coaching */}
        {coaching.map((item, idx) => (
           <div key={\`coach-\${idx}\`} className="flex gap-3 items-center p-2 bg-orange-50 rounded-lg border border-orange-100 cursor-pointer hover:bg-orange-100 transition-colors" onClick={() => navFn('coaching-lab')}>
              <div className="p-1.5 bg-orange-100 rounded-full text-orange-600"><MessageSquare className="w-4 h-4" /></div>
              <div className="flex-1">
                <p className="text-xs font-bold text-orange-800 uppercase">{item.coachingItemType || 'Coaching'}</p>
                <p className="text-sm font-medium text-slate-800">{item.coachingItemLabel || item.label}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-orange-300" />
           </div>
        ))}
        
        {/* Specific Daily Reps */}
        {reps.map((rep, idx) => (
           <div key={\`rep-\${idx}\`} className="flex gap-3 items-center p-2 bg-slate-50 rounded-lg border border-slate-100">
              <div className="p-1.5 bg-slate-200 rounded-full text-slate-600"><Dumbbell className="w-4 h-4" /></div>
              <div className="flex-1">
                <p className="text-xs font-bold text-slate-500 uppercase">Daily Rep</p>
                <p className="text-sm font-medium text-slate-800">{rep.repLabel || rep.label}</p>
              </div>
           </div>
        ))}

      </div>
    </Card>
  );
})()
    `,
    'daily-leader-reps': `
const DailyLeaderRepsWidget = () => {
  const { useState } = React;
  
  // Get current week's daily reps from the Development Plan
  const currentWeek = typeof devPlanCurrentWeek !== 'undefined' ? devPlanCurrentWeek : null;
  
  // NEW: Get daily reps from Day-by-Day architecture
  // Check if currentDayData is available in scope
  const dayReps = (typeof currentDayData !== 'undefined' && currentDayData?.actions) 
    ? currentDayData.actions.filter(a => a.type === 'daily_rep')
    : [];

  // Daily reps come from the Dev Plan week data (dailyReps or reps array) OR Day-by-Day actions
  const weekReps = dayReps.length > 0 
    ? dayReps 
    : (currentWeek?.dailyReps || currentWeek?.reps || []);
  
  // Map to consistent format with id, label, and description
  const reps = weekReps.length > 0 
    ? weekReps.map((rep, idx) => ({
        id: rep.repId || rep.id || \`rep-\${idx}\`,
        label: rep.repLabel || rep.label || rep.name || 'Daily Rep',
        description: rep.repDescription || rep.description || ''
      }))
    : []; // No default reps - only show what's in the Dev Plan
  
  // Track completed state and expanded description
  const commitmentsList = Array.isArray(additionalCommitments) ? additionalCommitments : [];
  const safeIsSaving = typeof isSavingReps !== 'undefined' ? isSavingReps : false;
  const [expandedRep, setExpandedRep] = useState(null);
  
  // Debrief modal state
  const [debriefRep, setDebriefRep] = useState(null);
  const [debriefNotes, setDebriefNotes] = useState('');
  const [debriefRating, setDebriefRating] = useState(null);
  
  // Toggle completion handler - now opens debrief modal instead of immediate toggle
  const handleToggle = (e, rep, currentStatus) => {
    e.stopPropagation();
    
    // If already completed, uncomplete immediately
    if (currentStatus === 'Committed') {
      if (handleToggleAdditionalRep) {
        handleToggleAdditionalRep(rep.id, 'Committed', rep.label);
      }
    } else {
      // If not completed, open debrief modal
      setDebriefRep(rep);
      setDebriefNotes('');
      setDebriefRating(null);
    }
  };
  
  // Submit debrief and complete rep
  const handleDebriefSubmit = () => {
    if (!debriefRep) return;
    
    if (handleToggleAdditionalRep) {
      // Pass the debrief data along with the toggle
      handleToggleAdditionalRep(debriefRep.id, 'Pending', debriefRep.label, {
        debriefNotes: debriefNotes,
        debriefRating: debriefRating,
        debriefedAt: new Date().toISOString()
      });
    }
    
    setDebriefRep(null);
    setDebriefNotes('');
    setDebriefRating(null);
  };
  
  // Skip debrief but still complete
  const handleDebriefSkip = () => {
    if (!debriefRep) return;
    
    if (handleToggleAdditionalRep) {
      handleToggleAdditionalRep(debriefRep.id, 'Pending', debriefRep.label);
    }
    
    setDebriefRep(null);
    setDebriefNotes('');
    setDebriefRating(null);
  };
  
  // Toggle description expansion
  const toggleDescription = (repId) => {
    setExpandedRep(expandedRep === repId ? null : repId);
  };
  
  return (
    <Card title="Daily Reps" icon={Dumbbell} accent="NAVY" helpText={widgetHelpText}>
      <div className="space-y-2">
        {reps.length === 0 && (
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
            <p className="text-sm text-slate-500">No daily reps assigned for this week.</p>
            <p className="text-xs text-slate-400 mt-1">Check your Development Plan for updates.</p>
          </div>
        )}
        {reps.map(rep => {
          const commitment = commitmentsList.find(c => c.id === rep.id);
          const isCompleted = commitment?.status === 'Committed';
          const isExpanded = expandedRep === rep.id;
          const hasDescription = rep.description && rep.description.trim().length > 0;
          
          return (
            <div key={rep.id} className="space-y-0">
              <div 
                onClick={() => hasDescription && toggleDescription(rep.id)}
                className={\`flex items-center justify-between p-3 rounded-xl transition-all \${
                  hasDescription ? 'cursor-pointer' : ''
                } \${
                  isCompleted 
                    ? 'bg-green-50 border border-green-200' 
                    : 'bg-slate-50 hover:bg-blue-50 border border-slate-100'
                } \${
                  isExpanded ? 'rounded-b-none border-b-0' : ''
                }\`}
              >
                <div className="flex items-center gap-3 flex-1">
                  <div 
                    onClick={(e) => handleToggle(e, rep, isCompleted ? 'Committed' : 'Pending')}
                    className={\`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all cursor-pointer hover:scale-110 \${
                      isCompleted 
                        ? 'bg-green-500 border-green-500' 
                        : 'border-slate-300 hover:border-blue-400 hover:bg-blue-50'
                    }\`}
                  >
                    {isCompleted && <CheckCircle className="w-4 h-4 text-white" />}
                  </div>
                  <div className="flex-1">
                    <span className={\`text-sm font-bold \${isCompleted ? 'text-green-700 line-through' : 'text-slate-700'}\`}>
                      {rep.label}
                    </span>
                    {hasDescription && (
                      <p className="text-xs text-slate-400 mt-0.5">Tap for details</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {safeIsSaving && <Loader className="w-3 h-3 animate-spin text-slate-400" />}
                  {hasDescription && (
                    <ChevronDown className={\`w-4 h-4 text-slate-400 transition-transform \${isExpanded ? 'rotate-180' : ''}\`} />
                  )}
                </div>
              </div>
              
              {/* Expandable Description */}
              {isExpanded && hasDescription && (
                <div className="bg-blue-50 border border-blue-100 border-t-0 rounded-b-xl p-4">
                  <div className="flex gap-2 mb-2">
                    <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{rep.description}</p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Debrief Modal */}
      {debriefRep && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-4 text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <Dumbbell className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Quick Debrief</h3>
                  <p className="text-sm text-white/80">How did "{debriefRep.label}" go?</p>
                </div>
              </div>
            </div>
            
            {/* Modal Body */}
            <div className="p-4 space-y-4">
              {/* Rating */}
              <div>
                <label className="text-sm font-semibold text-slate-700 block mb-2">How'd it go?</label>
                <div className="flex gap-2">
                  {[
                    { value: 'great', emoji: '🎯', label: 'Nailed it' },
                    { value: 'good', emoji: '👍', label: 'Good' },
                    { value: 'ok', emoji: '👌', label: 'OK' },
                    { value: 'struggled', emoji: '💪', label: 'Struggled' }
                  ].map(option => (
                    <button
                      key={option.value}
                      onClick={() => setDebriefRating(option.value)}
                      className={\`flex-1 py-2 px-1 rounded-lg border-2 text-center transition-all \${
                        debriefRating === option.value
                          ? 'border-emerald-500 bg-emerald-50'
                          : 'border-slate-200 hover:border-emerald-300'
                      }\`}
                    >
                      <div className="text-xl mb-0.5">{option.emoji}</div>
                      <div className="text-xs text-slate-600">{option.label}</div>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Notes */}
              <div>
                <label className="text-sm font-semibold text-slate-700 block mb-2">
                  What did you learn? <span className="font-normal text-slate-400">(optional)</span>
                </label>
                <textarea
                  value={debriefNotes}
                  onChange={(e) => setDebriefNotes(e.target.value)}
                  placeholder="Share a quick insight or takeaway..."
                  className="w-full h-20 p-3 border border-slate-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
            </div>
            
            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-3">
              <button
                onClick={handleDebriefSkip}
                className="flex-1 py-2.5 px-4 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Skip Debrief
              </button>
              <button
                onClick={handleDebriefSubmit}
                disabled={!debriefRating}
                className={\`flex-1 py-2.5 px-4 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 \${
                  debriefRating
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:opacity-90'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }\`}
              >
                <CheckCircle className="w-4 h-4" />
                Complete Rep
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Streak Recognition - only show when there's a streak */}
      {(() => {
        const safeRepStreak = typeof repStreak !== 'undefined' ? repStreak : { currentStreak: 0, longestStreak: 0 };
        const currentStreak = safeRepStreak.currentStreak || 0;
        const longestStreak = safeRepStreak.longestStreak || 0;
        const hasCompletedToday = safeRepStreak.hasCompletedRepToday || false;
        const isNewBest = safeRepStreak.isNewPersonalBest || false;
        
        if (currentStreak === 0 && longestStreak === 0) return null;
        
        return (
          <div className="mt-3 pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Flame className={\`w-4 h-4 \${currentStreak > 0 ? 'text-orange-500' : 'text-slate-300'}\`} />
                <span className="text-slate-600">
                  <span className="font-semibold text-[#002E47]">{currentStreak}</span> day streak
                </span>
                {isNewBest && <span className="text-xs text-amber-600 font-medium">Personal best!</span>}
              </div>
              {longestStreak > currentStreak && (
                <span className="text-xs text-slate-400">Best: {longestStreak}</span>
              )}
            </div>
          </div>
        );
      })()}

    </Card>
  );
};

render(<DailyLeaderRepsWidget />);
    `,
    'notifications': `
const NotificationsWidget = () => {
  const { useState, useEffect, useMemo } = React;

  // Get current week data from scope
  const currentWeek = typeof devPlanCurrentWeek !== 'undefined' ? devPlanCurrentWeek : null;
  const currentDayData = typeof scope !== 'undefined' && scope.currentDayData ? scope.currentDayData : null;
  const practiceData = typeof dailyPracticeData !== 'undefined' ? dailyPracticeData : null;
  const navFn = typeof navigate !== 'undefined' ? navigate : (typeof scope !== 'undefined' && scope.navigate ? scope.navigate : () => {});

  // State for dismissed items
  const [dismissedIds, setDismissedIds] = useState(() => {
    try {
      const saved = localStorage.getItem('lr_dismissed_notifications');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const handleDismiss = (e, id) => {
    e.stopPropagation();
    const newDismissed = [...dismissedIds, id];
    setDismissedIds(newDismissed);
    localStorage.setItem('lr_dismissed_notifications', JSON.stringify(newDismissed));
  };

  // Helper to check if an item is completed in Daily Practice
  const isItemCompleted = (resourceId) => {
    if (!practiceData?.activeCommitments) return false;
    const idStr = String(resourceId);
    return practiceData.activeCommitments.some(c => 
      c.status === 'Completed' && c.id.includes(idStr)
    );
  };
  
  // Extract all items from the current week
  const content = currentWeek?.content || [];
  const community = currentWeek?.community || [];
  const coaching = currentWeek?.coaching || [];
  
  // Find items with recommendedWeekDay (Upcoming Practice / Meetings)
  const today = new Date();
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayName = dayNames[today.getDay()];
  
  // Get community items scheduled for specific days (like Live QS1 Meeting on Monday)
  const upcomingPractice = community.filter(item => 
    item.recommendedWeekDay
  ).map(item => ({
    ...item,
    isPast: dayNames.indexOf(item.recommendedWeekDay) < today.getDay(),
    isToday: item.recommendedWeekDay === todayName
  }));
  
  // Build content unlocks with proper routes based on content type
  const newUnlocks = [];
  
  content.forEach(item => {
    const label = item.contentItemLabel || item.label || item.title || 'Content';
    const itemType = (item.contentItemType || item.type || '').toLowerCase();
    
    // Determine route based on content type
    let route = 'business-readings';
    let category = item.contentItemType || item.type || 'Content';
    
    // Special routing for Foundation items (Workbook, PDQ)
    if (label.toLowerCase().includes('workbook') || label.toLowerCase().includes('pdq') || label.toLowerCase().includes('feedback loop')) {
      route = 'quick-start-accelerator';
      category = 'Foundation Tool';
    } else if (itemType.includes('video') || itemType.includes('workout')) {
      route = 'leadership-videos';
      category = itemType.includes('workout') ? 'Workout' : 'Video';
    } else if (itemType.includes('read') || itemType.includes('pdf')) {
      route = 'business-readings';
      category = 'Reading';
    }
    
    const resourceId = item.resourceId || item.contentItemId;
    if (dismissedIds.includes(resourceId) || isItemCompleted(resourceId)) return;

    newUnlocks.push({ 
      type: 'Content', 
      label, 
      category,
      route, 
      resourceId 
    });
  });

  // Add community items that don't have a specific day (or show all)
  community.forEach(item => {
    const resourceId = item.resourceId || item.communityItemId;
    if (dismissedIds.includes(resourceId)) return;

    const label = item.communityItemLabel || item.label || 'Community';
    newUnlocks.push({ 
      type: 'Community', 
      label, 
      category: item.communityItemType || item.type || 'Community',
      route: 'community', 
      resourceId,
      day: item.recommendedWeekDay
    });
  });

  // Add coaching items
  coaching.forEach(item => {
    const resourceId = item.resourceId || item.coachingItemId;
    if (dismissedIds.includes(resourceId)) return;

    const label = item.coachingItemLabel || item.label || 'Coaching';
    newUnlocks.push({ 
      type: 'Coaching', 
      label, 
      category: item.coachingItemType || item.type || 'Coaching',
      route: 'coaching-lab', 
      resourceId 
    });
  });

  // Check if we have any data
  const hasData = newUnlocks.length > 0;

  return (
    <Card title="Notifications" icon={Bell} accent="GRAY" helpText={widgetHelpText}>
      <div className="space-y-3">
        {!hasData && (
          <div className="flex gap-3 items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div className="w-2 h-2 rounded-full bg-slate-300" />
            <p className="text-sm text-slate-500">No new notifications for this week.</p>
          </div>
        )}

        {/* Upcoming/Past Meetings - Community items with recommendedWeekDay */}
        {upcomingPractice.map((item, idx) => (
          <div 
            key={\`practice-\${idx}\`} 
            className={\`flex gap-3 items-start p-3 rounded-xl border cursor-pointer transition-colors \${
              item.isPast 
                ? 'bg-slate-50 border-slate-200 opacity-75' 
                : 'bg-[#00A896]/10 border-[#00A896]/20 hover:bg-[#00A896]/20'
            }\`}
            onClick={() => navFn('community')}
          >
            <div className="mt-1">
              <div className={\`w-2 h-2 rounded-full \${item.isPast ? 'bg-slate-400' : 'bg-[#00A896]'}\`} />
            </div>
            <div className="flex-1">
              <p className={\`text-xs font-bold uppercase mb-1 \${item.isPast ? 'text-slate-500' : 'text-[#00A896]'}\`}>
                {item.isPast ? 'Past Meeting' : item.isToday ? 'Today' : 'Upcoming'}
              </p>
              <p className="text-sm font-medium text-slate-800">
                {item.communityItemLabel || item.label}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                {item.recommendedWeekDay} • {item.communityItemType || item.type}
              </p>
            </div>
          </div>
        ))}

        {/* Content Unlocks - Videos, Readings, Workbooks */}
        {newUnlocks.filter(u => u.type === 'Content').map((unlock, idx) => (
          <div 
            key={\`content-\${idx}\`} 
            className="group relative flex gap-3 items-start p-3 bg-blue-50 rounded-xl border border-blue-100 cursor-pointer hover:bg-blue-100 transition-colors"
            onClick={() => navFn(unlock.route, { state: { autoOpenId: unlock.resourceId } })}
          >
            <div className="mt-1">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
            </div>
            <div className="flex-1 min-w-0 pr-6">
              <p className="text-xs font-bold text-blue-800 uppercase mb-1">
                New Unlock • {unlock.category}
              </p>
              <p className="text-sm font-medium text-slate-800 underline decoration-blue-300 underline-offset-2 break-words">
                {unlock.label}
              </p>
            </div>
            <button 
              onClick={(e) => handleDismiss(e, unlock.resourceId)}
              className="absolute top-2 right-2 p-1 text-slate-400 hover:text-slate-600 hover:bg-blue-200 rounded-full opacity-0 group-hover:opacity-100 transition-all"
              title="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}

        {/* Coaching Unlocks */}
        {newUnlocks.filter(u => u.type === 'Coaching').map((unlock, idx) => (
          <div 
            key={\`coaching-\${idx}\`} 
            className="group relative flex gap-3 items-start p-3 bg-orange-50 rounded-xl border border-orange-100 cursor-pointer hover:bg-orange-100 transition-colors"
            onClick={() => navFn(unlock.route, { state: { autoOpenId: unlock.resourceId } })}
          >
            <div className="mt-1">
              <div className="w-2 h-2 rounded-full bg-orange-500" />
            </div>
            <div className="flex-1 min-w-0 pr-6">
              <p className="text-xs font-bold text-orange-800 uppercase mb-1">
                Coaching • {unlock.category}
              </p>
              <p className="text-sm font-medium text-slate-800 underline decoration-orange-300 underline-offset-2 break-words">
                {unlock.label}
              </p>
            </div>
            <button 
              onClick={(e) => handleDismiss(e, unlock.resourceId)}
              className="absolute top-2 right-2 p-1 text-slate-400 hover:text-slate-600 hover:bg-orange-200 rounded-full opacity-0 group-hover:opacity-100 transition-all"
              title="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}

        {/* Community Unlocks */}
        {newUnlocks.filter(u => u.type === 'Community').map((unlock, idx) => (
          <div 
            key={\`community-\${idx}\`} 
            className="group relative flex gap-3 items-start p-3 bg-teal-50 rounded-xl border border-teal-100 cursor-pointer hover:bg-teal-100 transition-colors"
            onClick={() => navFn(unlock.route, { state: { autoOpenId: unlock.resourceId } })}
          >
            <div className="mt-1">
              <div className="w-2 h-2 rounded-full bg-teal-500" />
            </div>
            <div className="flex-1 min-w-0 pr-6">
              <p className="text-xs font-bold text-teal-800 uppercase mb-1">
                Community • {unlock.category}
              </p>
              <p className="text-sm font-medium text-slate-800 underline decoration-teal-300 underline-offset-2 break-words">
                {unlock.label}
              </p>
            </div>
            <button 
              onClick={(e) => handleDismiss(e, unlock.resourceId)}
              className="absolute top-2 right-2 p-1 text-slate-400 hover:text-slate-600 hover:bg-teal-200 rounded-full opacity-0 group-hover:opacity-100 transition-all"
              title="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </Card>
  );
};

render(<NotificationsWidget />);
    `,
    'pm-bookend-header': `
<>
<div className="flex items-center gap-3 mb-4 mt-4">
  <Moon className="w-6 h-6 text-indigo-500" />
  <h2 className="text-xl font-bold text-[#002E47]">PM Bookend: Finish Strong</h2>
  <div className="h-px bg-slate-200 flex-1 ml-4"></div>
</div>

</>
    `,
    'progress-feedback': `
<Card title="Progress & Feedback" icon={TrendingUp} accent="TEAL">
  <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl border border-green-100 mb-4">
    <div>
      <p className="text-xs font-bold text-green-800 uppercase">Weekly Completion</p>
      <p className="text-2xl font-bold text-[#002E47]">85%</p>
    </div>
    <div className="h-12 w-12 rounded-full border-4 border-green-500 flex items-center justify-center bg-white">
      <span className="text-xs font-bold text-green-700">A</span>
    </div>
  </div>
  <p className="text-sm text-slate-600 mb-3">
    "Great job staying consistent with your morning planning this week!"
  </p>
  <div className="w-full bg-slate-100 rounded-full h-2">
    <div className="bg-green-500 h-2 rounded-full" style={{ width: '85%' }}></div>
  </div>

</Card>
    `,
    'pm-bookend': `
<Card title="PM Reflection" icon={MessageSquare} accent="NAVY" helpText={widgetHelpText}>
  <div className="space-y-2">
    <div>
      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
        1. What went well?
      </label>
      <textarea 
        value={reflectionGood}
        onChange={(e) => setReflectionGood(e.target.value)}
        className="w-full p-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm"
        rows={1}
        placeholder="Celebrate a win..."
      />
    </div>

    <div>
      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
        2. What needs work?
      </label>
      <textarea 
        value={reflectionBetter}
        onChange={(e) => setReflectionBetter(e.target.value)}
        className="w-full p-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm"
        rows={1}
        placeholder="Identify an improvement..."
      />
    </div>

    <div>
      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
        3. Closing thought
      </label>
      <textarea 
        value={reflectionBest}
        onChange={(e) => setReflectionBest(e.target.value)}
        className="w-full p-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm"
        rows={1}
        placeholder="What will I do 1% better tomorrow?"
      />
    </div>

    <button 
      onClick={() => handleSaveEveningBookend()}
      disabled={isSavingBookend || (!reflectionGood && !reflectionBetter)}
      className="w-full py-3 bg-[#002E47] text-white rounded-xl font-bold hover:bg-[#003E5F] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
    >
      {isSavingBookend ? <Loader className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
      Save Reflection
    </button>
  </div>

</Card>
    `,
    'scorecard': `
(() => {
  const safeScorecard = typeof scorecard !== 'undefined' ? scorecard : { grounding: { done: 0, total: 1, pct: 0 }, reps: { done: 0, total: 0, pct: 0 }, win: { done: 0, total: 0, pct: 0 } };
  const safeIsSaving = typeof isSavingScorecard !== 'undefined' ? isSavingScorecard : false;
  const weekNum = typeof currentWeekNumber !== 'undefined' ? currentWeekNumber : 1;
  
  // Rep Streak data (Daily Rep specific, excludes weekends/holidays)
  const safeRepStreak = typeof repStreak !== 'undefined' ? repStreak : { currentStreak: 0, longestStreak: 0, milestone: null };
  const currentStreak = safeRepStreak.currentStreak || 0;
  const longestStreak = safeRepStreak.longestStreak || 0;
  const milestone = safeRepStreak.milestone;
  const isNewPersonalBest = safeRepStreak.isNewPersonalBest || false;
  
  // Get conditioning status - weekly tracking
  const safeConditioningStatus = typeof conditioningStatus !== 'undefined' ? conditioningStatus : { requiredRepCompleted: false, totalCompleted: 0 };
  const conditioningMet = safeConditioningStatus.requiredRepCompleted;
  const conditioningTotal = safeConditioningStatus.totalCompleted || 0;

  return (
<Card title="Today's Scorecard" icon={Trophy} accent="ORANGE" helpText={widgetHelpText}>
    <div className="space-y-2">
      {/* Win the Day */}
      <div className={\`flex items-center justify-between p-2 rounded-lg border \${safeScorecard.win.done > 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-blue-50 border-blue-100'}\`}>
        <div className="flex items-center gap-2">
          <Trophy className={\`w-4 h-4 \${safeScorecard.win.done > 0 ? 'text-emerald-600' : 'text-blue-600'}\`} />
          <span className="font-medium text-slate-700">Win the Day</span>
        </div>
        <div className="text-right flex items-center gap-2">
          <span className="font-bold text-lg text-[#002E47]">{safeScorecard.win.done}</span>
          <span className="text-slate-400 text-sm">/ {safeScorecard.win.total}</span>
          {safeScorecard.win.pct === 100 && <CheckCircle className="w-4 h-4 text-emerald-500" />}
        </div>
      </div>

      {/* Conditioning - Weekly */}
      <div className={\`flex items-center justify-between p-2 rounded-lg border \${conditioningMet ? 'bg-emerald-50 border-emerald-100' : 'bg-blue-50 border-blue-100'}\`}>
        <div className="flex items-center gap-2">
          <Dumbbell className={\`w-4 h-4 \${conditioningMet ? 'text-emerald-600' : 'text-blue-600'}\`} />
          <span className="font-medium text-slate-700">Conditioning</span>
          <span className="text-xs text-slate-400">(weekly)</span>
        </div>
        <div className="text-right flex items-center gap-2">
          <span className="font-bold text-lg text-[#002E47]">{conditioningTotal}</span>
          <span className="text-slate-400 text-sm">/ 1</span>
          {conditioningMet && <CheckCircle className="w-4 h-4 text-emerald-500" />}
        </div>
      </div>
    </div>

    {/* Rep Streak Section */}
    <div className="mt-4 pt-4 border-t border-slate-100">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={\`w-10 h-10 rounded-lg flex items-center justify-center \${currentStreak > 0 ? 'bg-gradient-to-br from-orange-400 to-amber-500' : 'bg-slate-100'}\`}>
            <Flame className={\`w-5 h-5 \${currentStreak > 0 ? 'text-white' : 'text-slate-400'}\`} />
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-bold text-2xl text-[#002E47]">{currentStreak}</span>
              <span className="text-sm text-slate-500">day streak</span>
            </div>
            {milestone && (
              <p className="text-xs text-slate-500 mt-0.5">{milestone.message}</p>
            )}
          </div>
        </div>
        
        {/* Longest Streak */}
        {longestStreak > 0 && (
          <div className="text-right">
            <p className="text-xs text-slate-400 uppercase tracking-wide">Best</p>
            <p className={\`text-lg font-semibold \${isNewPersonalBest ? 'text-amber-600' : 'text-slate-600'}\`}>
              {longestStreak}
              {isNewPersonalBest && <span className="text-xs ml-1">★</span>}
            </p>
          </div>
        )}
      </div>
      
      {/* Weekend/Holiday note */}
      {safeRepStreak.isTodayExcluded && (
        <p className="text-xs text-slate-400 mt-2 text-center italic">
          Weekends & holidays don't affect your streak
        </p>
      )}
    </div>

</Card>
  );
})()
    `,
    'course-library': `
<Card title="Course Library" icon={BookOpen} accent="TEAL" helpText={widgetHelpText}>
  <div className="text-center py-6">
    <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
      <BookOpen className="w-6 h-6 text-slate-400" />
    </div>
    <p className="text-sm font-medium text-slate-600">Course Library Coming Soon</p>
    <p className="text-xs text-slate-400 mt-1">Check back for new learning modules.</p>
  </div>
</Card>
    `,
    'reading-hub': `
<Card title="Reading Hub" icon={Book} accent="ORANGE" helpText={widgetHelpText}>
  <div className="flex gap-3 overflow-x-auto pb-2">
    <div className="min-w-[100px] bg-gray-100 rounded-lg p-2 text-center">
      <div className="w-full h-16 bg-gray-300 rounded mb-2"></div>
      <p className="text-xs font-bold text-gray-700 truncate">Atomic Habits</p>
    </div>
    <div className="min-w-[100px] bg-gray-100 rounded-lg p-2 text-center">
      <div className="w-full h-16 bg-gray-300 rounded mb-2"></div>
      <p className="text-xs font-bold text-gray-700 truncate">Dare to Lead</p>
    </div>
    <div className="min-w-[100px] bg-gray-100 rounded-lg p-2 text-center">
      <div className="w-full h-16 bg-gray-300 rounded mb-2"></div>
      <p className="text-xs font-bold text-gray-700 truncate">Start with Why</p>
    </div>
  </div>

</Card>
    `,
    'leadership-videos': `
<Card title="Featured Talk" icon={Video} accent="ORANGE" helpText={widgetHelpText}>
  <div className="relative w-full aspect-video bg-gray-800 rounded-lg flex items-center justify-center mb-3 group cursor-pointer">
    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
      <Play className="w-6 h-6 text-white fill-current" />
    </div>
    <span className="absolute bottom-2 right-2 bg-black/60 px-2 py-1 rounded text-xs text-white">12:45</span>
  </div>
  <p className="font-bold text-sm text-gray-800">Simon Sinek: How Great Leaders Inspire Action</p>

</Card>
    `,
    'strat-templates': `
<Card title="Templates" icon={FileText} accent="NAVY" helpText={widgetHelpText}>
  <div className="grid grid-cols-2 gap-2">
    <button className="p-3 bg-blue-50 hover:bg-blue-100 rounded-lg text-left transition-colors">
      <FileText className="w-5 h-5 text-blue-600 mb-2" />
      <p className="text-xs font-bold text-blue-900">QBR Deck</p>
    </button>
    <button className="p-3 bg-green-50 hover:bg-green-100 rounded-lg text-left transition-colors">
      <FileText className="w-5 h-5 text-green-600 mb-2" />
      <p className="text-xs font-bold text-green-900">1:1 Agenda</p>
    </button>
    <button className="p-3 bg-teal-50 hover:bg-teal-100 rounded-lg text-left transition-colors">
      <FileText className="w-5 h-5 text-teal-600 mb-2" />
      <p className="text-xs font-bold text-teal-900">OKRs Sheet</p>
    </button>
    <button className="p-3 bg-orange-50 hover:bg-orange-100 rounded-lg text-left transition-colors">
      <FileText className="w-5 h-5 text-orange-600 mb-2" />
      <p className="text-xs font-bold text-orange-900">Feedback Form</p>
    </button>
  </div>

</Card>
    `,
    'community-feed': `
<Card title="Community Feed" icon={MessageSquare} accent="NAVY" helpText={widgetHelpText}>
  <div className="space-y-4">
    <div className="flex gap-3">
      <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0"></div>
      <div>
        <p className="text-sm font-bold text-gray-800">Sarah J. <span className="font-normal text-gray-500">posted in</span> Leadership</p>
        <p className="text-sm text-gray-600 mt-1">"How do you handle skip-level meetings effectively?"</p>
        <div className="flex gap-3 mt-2 text-xs text-gray-400">
          <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" /> 12</span>
          <span className="flex items-center gap-1"><Heart className="w-3 h-3" /> 5</span>
        </div>
      </div>
    </div>
    <div className="border-t border-gray-100 pt-3 flex gap-3">
      <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0"></div>
      <div>
        <p className="text-sm font-bold text-gray-800">Mike T. <span className="font-normal text-gray-500">replied to</span> Strategy</p>
        <p className="text-sm text-gray-600 mt-1">"The key is alignment on the north star metric..."</p>
      </div>
    </div>
  </div>

</Card>
    `,
    'my-discussions': `
<Card title="My Discussions" icon={MessageCircle} accent="NAVY" helpText={widgetHelpText}>
  <div className="space-y-2">
    <div className="p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors flex justify-between items-center">
      <span className="text-sm font-medium text-gray-700">Q3 Planning Thread</span>
      <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full">2 new</span>
    </div>
    <div className="p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors flex justify-between items-center">
      <span className="text-sm font-medium text-gray-700">Remote Culture</span>
      <span className="text-xs text-gray-400">Yesterday</span>
    </div>
    <div className="p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors flex justify-between items-center">
      <span className="text-sm font-medium text-gray-700">Hiring Best Practices</span>
      <span className="text-xs text-gray-400">3d ago</span>
    </div>
  </div>

</Card>
    `,
    'mastermind': `
<Card title="Mastermind Groups" icon={Users} accent="NAVY" helpText={widgetHelpText}>
  <p className="text-gray-600 text-sm mb-4">Join a peer group of leaders at your level to share challenges and grow together.</p>
  <button className="w-full py-2 bg-indigo-600 text-white rounded-lg font-bold text-sm hover:bg-indigo-700 transition-colors">
    Find a Group
  </button>

</Card>
    `,
    'mentor-match': `
<Card title="Mentor Match" icon={UserPlus} accent="TEAL" helpText={widgetHelpText}>
  <div className="flex items-center gap-3 mb-3">
    <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
    <div>
      <p className="font-bold text-gray-800">David Chen</p>
      <p className="text-xs text-gray-500">VP Engineering @ TechCorp</p>
    </div>
  </div>
  <p className="text-xs text-gray-600 mb-3">"Happy to help with scaling teams and technical strategy."</p>
  <button className="w-full py-2 border border-indigo-600 text-indigo-600 rounded-lg font-bold text-sm hover:bg-indigo-50 transition-colors">
    Request Intro
  </button>

</Card>
    `,
    'live-events': `
<Card title="Upcoming Events" icon={Calendar} accent="ORANGE">
  <div className="space-y-3">
    <div className="flex gap-3 items-start border-b border-gray-100 pb-3">
      <div className="bg-indigo-100 text-indigo-700 rounded px-2 py-1 text-center min-w-[50px]">
        <p className="text-xs font-bold">OCT</p>
        <p className="text-lg font-bold">24</p>
      </div>
      <div>
        <p className="font-bold text-gray-800 text-sm">Leadership Summit 2024</p>
        <p className="text-xs text-gray-500">2:00 PM EST • Virtual</p>
      </div>
    </div>
    <div className="flex gap-3 items-start">
      <div className="bg-gray-100 text-gray-700 rounded px-2 py-1 text-center min-w-[50px]">
        <p className="text-xs font-bold">NOV</p>
        <p className="text-lg font-bold">02</p>
      </div>
      <div>
        <p className="font-bold text-gray-800 text-sm">Q4 Planning Workshop</p>
        <p className="text-xs text-gray-500">11:00 AM EST • Virtual</p>
      </div>
    </div>
  </div>

</Card>
    `,
    'practice-history': `
<Card title="Recent Practice" icon={History} accent="GRAY">
  <div className="space-y-3">
    <div className="flex justify-between items-center">
      <div>
        <p className="text-sm font-bold text-gray-800">Difficult Conversation</p>
        <p className="text-xs text-gray-500">Yesterday</p>
      </div>
      <span className="text-green-600 font-bold text-sm">92%</span>
    </div>
    <div className="flex justify-between items-center">
      <div>
        <p className="text-sm font-bold text-gray-800">Public Speaking</p>
        <p className="text-xs text-gray-500">3 days ago</p>
      </div>
      <span className="text-yellow-600 font-bold text-sm">78%</span>
    </div>
  </div>

</Card>
    `,
    'progress-analytics': `
<Card title="Growth Analytics" icon={BarChart2} accent="NAVY">
  <div className="flex items-end gap-2 h-24 mt-4">
    <div className="flex-1 bg-blue-100 rounded-t hover:bg-blue-200 transition-colors relative group">
      <div className="absolute bottom-0 w-full bg-blue-500 rounded-t" style={{ height: '40%' }}></div>
    </div>
    <div className="flex-1 bg-blue-100 rounded-t hover:bg-blue-200 transition-colors relative group">
      <div className="absolute bottom-0 w-full bg-blue-500 rounded-t" style={{ height: '60%' }}></div>
    </div>
    <div className="flex-1 bg-blue-100 rounded-t hover:bg-blue-200 transition-colors relative group">
      <div className="absolute bottom-0 w-full bg-blue-500 rounded-t" style={{ height: '55%' }}></div>
    </div>
    <div className="flex-1 bg-blue-100 rounded-t hover:bg-blue-200 transition-colors relative group">
      <div className="absolute bottom-0 w-full bg-blue-500 rounded-t" style={{ height: '85%' }}></div>
    </div>
    <div className="flex-1 bg-blue-100 rounded-t hover:bg-blue-200 transition-colors relative group">
      <div className="absolute bottom-0 w-full bg-blue-500 rounded-t" style={{ height: '75%' }}></div>
    </div>
  </div>
  <div className="flex justify-between mt-2 text-xs text-gray-400">
    <span>Mon</span>
    <span>Fri</span>
  </div>

</Card>
    `,
    'ai-roleplay': `
<Card title="AI Roleplay" icon={Bot} accent="NAVY">
  <p className="text-xs text-gray-500 mb-4">Practice real-world scenarios with AI.</p>
  <div className="bg-teal-50 rounded-lg p-3 mb-3 border border-teal-100">
    <p className="text-xs font-bold text-teal-600 uppercase mb-1">Recommended</p>
    <p className="text-sm font-bold text-teal-900">Giving Constructive Feedback</p>
  </div>
  <button className="w-full py-2 bg-[#002E47] text-white rounded-lg text-sm font-bold hover:bg-[#003E5F] transition-colors">
    Start Session
  </button>

</Card>
    `,
    'scenario-sim': `
<Card title="Scenario Sim" icon={Cpu} accent="ORANGE">
  <div className="space-y-3">
    <div className="border border-gray-200 rounded-lg p-3 hover:border-orange-300 transition-colors cursor-pointer">
      <div className="flex justify-between mb-1">
        <span className="text-xs font-bold text-orange-600">Crisis Management</span>
        <span className="text-xs text-gray-400">Hard</span>
      </div>
      <p className="text-sm font-bold text-gray-800">Data Breach Response</p>
    </div>
    <div className="border border-gray-200 rounded-lg p-3 hover:border-orange-300 transition-colors cursor-pointer">
      <div className="flex justify-between mb-1">
        <span className="text-xs font-bold text-green-600">Strategy</span>
        <span className="text-xs text-gray-400">Medium</span>
      </div>
      <p className="text-sm font-bold text-gray-800">Market Expansion</p>
    </div>
  </div>

</Card>
    `,
    'feedback-gym': `
<Card title="Feedback Gym" icon={Dumbbell} accent="TEAL">
  <p className="text-xs text-gray-500 mb-3">Quick drills to improve your delivery.</p>
  <div className="grid grid-cols-2 gap-2">
    <div className="bg-teal-50 p-2 rounded-lg text-center cursor-pointer hover:bg-teal-100 transition-colors">
      <p className="text-lg font-bold text-teal-700">Radical</p>
      <p className="text-[10px] text-teal-600">Candor</p>
    </div>
    <div className="bg-blue-50 p-2 rounded-lg text-center cursor-pointer hover:bg-blue-100 transition-colors">
      <p className="text-lg font-bold text-blue-700">SBI</p>
      <p className="text-[10px] text-blue-600">Model</p>
    </div>
  </div>

</Card>
    `,
    'roi-report': `
<Card title="ROI Report" icon={TrendingUp} accent="TEAL">
  <div className="flex items-center justify-between mb-4">
    <div>
      <p className="text-xs text-gray-500">Leadership Score</p>
      <p className="text-2xl font-bold text-gray-800">+15%</p>
    </div>
    <div className="text-right">
      <p className="text-xs text-gray-500">Team Engagement</p>
      <p className="text-2xl font-bold text-gray-800">+8%</p>
    </div>
  </div>
  <button className="w-full py-2 border border-gray-200 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors">
    Download PDF
  </button>

</Card>
    `,
    'dev-plan-header': `
<Card title="Development Plan" icon={Target} accent="TEAL">
  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
    <div>
      <p className="text-slate-600 font-medium">
        Cycle {cycle} • {summary.totalSkills} skills
      </p>
      <p className="text-sm text-slate-500 mt-1">
        {summary.progress}% complete
      </p>
    </div>
    <Button
      onClick={() => handleEdit()}
      variant="secondary"
      size="sm"
      className="flex items-center gap-2"
    >
      <Edit size={16} />
      Quick Edit
    </Button>
  </div>
  <ProgressBar progress={summary.progress} color="#47A88D" />

</Card>
    `,
    'dev-plan-stats': `
<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
    <div className="w-12 h-12 rounded-lg bg-corporate-navy/10 flex items-center justify-center text-corporate-navy">
      <Target size={24} />
    </div>
    <div>
      <div className="text-2xl font-bold text-corporate-navy">
        {summary.totalSkills}
      </div>
      <div className="text-sm text-slate-600">Total Skills</div>
    </div>
  </div>

  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
    <div className="w-12 h-12 rounded-lg bg-corporate-teal/10 flex items-center justify-center text-corporate-teal">
      <TrendingUp size={24} />
    </div>
    <div>
      <div className="text-2xl font-bold text-corporate-navy">
        {summary.completedSkills}
      </div>
      <div className="text-sm text-slate-600">Completed</div>
    </div>
  </div>

  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
    <div className="w-12 h-12 rounded-lg bg-corporate-orange/10 flex items-center justify-center text-corporate-orange">
      <Calendar size={24} />
    </div>
    <div>
      <div className="text-2xl font-bold text-corporate-navy">
        {summary.currentWeek || 0}
      </div>
      <div className="text-sm text-slate-600">Current Week</div>
    </div>
  </div>
</div>

    `,
    'dev-plan-actions': `
<Card title="Actions" icon={Zap} accent="NAVY">
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
    <Button
      onClick={handleShowBreakdown}
      variant="primary"
      className="flex items-center justify-center gap-2"
    >
      <Target size={16} />
      View Progress Breakdown
    </Button>
    
    {handleScan && (
      <Button
        onClick={handleScan}
        variant="outline"
        className="flex items-center justify-center gap-2"
      >
        <TrendingUp size={16} />
        Start Progress Scan
      </Button>
    )}
    
    {handleTimeline && (
      <Button
        onClick={handleTimeline}
        variant="ghost"
        className="flex items-center justify-center gap-2"
      >
        <Calendar size={16} />
        View Timeline
      </Button>
    )}
    
    {handleDetail && (
      <Button
        onClick={handleDetail}
        variant="ghost"
        className="flex items-center justify-center gap-2"
      >
        View Detailed Plan
      </Button>
    )}
  </div>

</Card>
    `,
    'dev-plan-focus-areas': `
<Card title="Focus Areas" icon={Crosshair} accent="TEAL">
  <div className="space-y-3">
    {plan && plan.focusAreas && plan.focusAreas.map((area, index) => (
      <div key={index} className="p-4 bg-slate-50 rounded-lg border border-slate-100">
        <h3 className="font-bold text-corporate-navy mb-1">
          {area.name}
        </h3>
        <p className="text-sm text-slate-600 mb-2">
          {area.why}
        </p>
        <div className="flex items-center gap-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
          <span>{area.reps?.length || 0} REPS</span>
          <span>•</span>
          <span>{area.courses?.length || 0} COURSES</span>
        </div>
      </div>
    ))}
  </div>

</Card>
    `,
    'dev-plan-goal': `
{plan && plan.openEndedAnswer && (
<Card title="Your Goal" icon={Flag} accent="ORANGE">
  <p className="text-slate-700 italic border-l-4 border-corporate-orange pl-4 py-1">
    "{plan.openEndedAnswer}"
  </p>
</Card>
)}
    `,
    'daily-quote': `(() => {
  // Helper to parse quote
  const parseQuote = (q) => {
    if (!q) return { text: '', author: '' };
    const parts = q.split('|');
    return { text: parts[0], author: parts[1] || '' };
  };

  const current = parseQuote(dailyQuote || "Leadership is influence.|John Maxwell");
  const quotesList = allQuotes && allQuotes.length > 0 ? allQuotes : ["Leadership is influence.|John Maxwell"];
  
  // Use options from scope if available
  const isScrolling = typeof options !== 'undefined' && options.scrollMode === 'true';

  return (
    <>
    <div className="overflow-hidden bg-[#002E47] text-white rounded-2xl shadow-lg">
      {isScrolling ? (
        <div className="relative w-full overflow-hidden py-3 group">
          <div className="animate-marquee whitespace-nowrap inline-block group-hover:[animation-play-state:paused]">
            {/* Repeat quotes to ensure we fill the screen and loop smoothly */}
            {[...quotesList, ...quotesList].map((q, i) => {
                const { text, author } = parseQuote(q);
                return (
                    <span key={i} className="inline-block text-sm font-medium mx-8 opacity-90 hover:opacity-100 transition-opacity">
                    <span className="italic mr-2">"{text}"</span>
                    {author && <span className="text-teal-400 font-bold text-xs uppercase tracking-wider">— {author}</span>}
                    </span>
                );
            })}
          </div>
        </div>
      ) : (
        <div className="py-4 px-6 text-center">
          <p className="text-lg italic font-medium text-white/90">
            "{current.text}"
          </p>
          {current.author && (
            <p className="text-xs text-teal-400 font-bold uppercase tracking-wider mt-2">
              — {current.author}
            </p>
          )}
        </div>
      )}
    </div>

    <style>{\`
    @keyframes marquee {
      0% { transform: translateX(0); }
      100% { transform: translateX(-50%); }
    }
    .animate-marquee {
      display: inline-block;
      animation: marquee \${Math.max(60, (quotesList.length || 1) * 10)}s linear infinite;
    }
    \`}</style>
    </>
  );
})()
    `,
    'welcome-message': `
<div className="mb-6">
  <h1 className="text-3xl sm:text-4xl font-bold text-[#002E47] mb-2">
    {greeting || 'Welcome, Leader.'}
  </h1>
  <p className="text-slate-500 text-lg">
    Ready to win the day? Let's get to work.
  </p>

</div>
    `,
    'locker-controller': `
const LockerController = () => {
  const [currentTime, setCurrentTime] = React.useState(new Date());

  // Get scope data
  const { developmentPlanData } = typeof scope !== 'undefined' ? scope : {};
  
  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 1) User's Name
  const userName = user?.displayName || 'User';

  // 2) Local Date and Time (respects time travel)
  const timeOffset = parseInt(localStorage.getItem('time_travel_offset') || '0', 10);
  const simulatedNow = new Date(currentTime.getTime() + timeOffset);
  
  const formattedDate = simulatedNow.toLocaleDateString(undefined, { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  const formattedTime = simulatedNow.toLocaleTimeString();

  // 3) Release Group
  const releaseGroup = "Alpha Group";

  // 4) Plan Start Date from Firestore - handle multiple formats
  const rawStartDate = developmentPlanData?.startDate;
  let startDate = null;
  
  if (rawStartDate) {
    // Handle Firestore Timestamp
    if (rawStartDate.toDate && typeof rawStartDate.toDate === 'function') {
      startDate = rawStartDate.toDate();
    }
    // Handle seconds/nanoseconds object (serialized Firestore Timestamp)
    else if (rawStartDate.seconds) {
      startDate = new Date(rawStartDate.seconds * 1000);
    }
    // Handle ISO string or date string
    else if (typeof rawStartDate === 'string') {
      startDate = new Date(rawStartDate);
    }
    // Handle Date object or timestamp number
    else if (rawStartDate instanceof Date) {
      startDate = rawStartDate;
    }
    else if (typeof rawStartDate === 'number') {
      startDate = new Date(rawStartDate);
    }
    
    // Validate the date
    if (startDate && isNaN(startDate.getTime())) {
      console.warn('[Controller] Invalid startDate:', rawStartDate);
      startDate = null;
    }
  }

  // 5) Calculate Current Week based on startDate and simulated time
  const currentWeekNum = startDate 
    ? Math.floor((simulatedNow.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1
    : null;
  
  const currentWeek = currentWeekNum && currentWeekNum > 0 
    ? \`Week \${currentWeekNum}\` 
    : (startDate ? 'Not Started Yet' : 'Not Set');

  return (
    <Card 
      title="Controller" 
      icon={Settings}
      accent="NAVY"
      className="mb-6"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* User Name */}
        <div className="flex items-center p-3 bg-slate-50 rounded-lg">
          <div className="p-2 bg-blue-100 rounded-full mr-3">
            <Users className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase font-semibold">User</p>
            <p className="font-medium text-slate-900">{userName}</p>
          </div>
        </div>

        {/* Date & Time */}
        <div className="flex items-center p-3 bg-slate-50 rounded-lg">
          <div className="p-2 bg-green-100 rounded-full mr-3">
            <Clock className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase font-semibold">Local Time</p>
            <p className="font-medium text-slate-900">{formattedDate}</p>
            <p className="text-xs text-slate-600">{formattedTime}</p>
            {timeOffset !== 0 && (
              <p className="text-xs text-indigo-600 font-semibold">⏰ Time Travel Active</p>
            )}
          </div>
        </div>

        {/* Release Group */}
        <div className="flex items-center p-3 bg-slate-50 rounded-lg">
          <div className="p-2 bg-teal-100 rounded-full mr-3">
            <Settings className="w-5 h-5 text-teal-600" />
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase font-semibold">Release Group</p>
            <p className="font-medium text-slate-900">{releaseGroup}</p>
          </div>
        </div>

        {/* Current Week */}
        <div className="flex items-center p-3 bg-slate-50 rounded-lg">
          <div className="p-2 bg-orange-100 rounded-full mr-3">
            <Calendar className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase font-semibold">Plan Progress</p>
            <p className="font-medium text-slate-900">{currentWeek}</p>
          </div>
        </div>
      </div>

      {/* Plan Start Date Section */}
      <div className="mt-4 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-100">
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="text-xs text-indigo-600 uppercase font-semibold">Plan Start Date</p>
            <p className="font-bold text-indigo-900">
              {startDate ? startDate.toLocaleDateString(undefined, { 
                weekday: 'short', 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
              }) : 'Not Set'}
            </p>
          </div>
        </div>
      </div>

    </Card>
  );
};
render(<LockerController />);
    `,
    'locker-reminders': `
const LockerReminders = () => {
  const useNotificationsHook = typeof useNotifications !== 'undefined' ? useNotifications : () => ({ 
    permission: 'denied', 
    requestPermission: () => {}, 
    reminders: {}, 
    updateReminder: () => {}, 
    isSupported: false 
  });

  const { 
    permission, 
    requestPermission, 
    reminders, 
    updateReminder,
    isSupported 
  } = useNotificationsHook();

  if (!isSupported) {
    return (
      <Card title="Daily Reminders" icon={Bell} accent="ORANGE">
        <div className="p-4 text-center text-slate-500">
          <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-slate-400" />
          <p>Notifications are not supported in this browser.</p>
        </div>
      </Card>
    );
  }

  if (permission !== 'granted') {
    return (
      <Card title="Daily Reminders" icon={Bell} accent="ORANGE">
        <div className="flex items-center gap-2 -mt-2">
          <div className="p-2 bg-orange-100 rounded-full flex-shrink-0">
            <Bell className="w-5 h-5 text-orange-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-slate-900 text-sm">Enable Notifications</h3>
            <p className="text-xs text-slate-600">Get timely nudges for your AM/PM bookends.</p>
          </div>
          <button
            onClick={requestPermission}
            className="px-3 py-1.5 bg-teal-600 text-white rounded-lg text-xs font-medium hover:bg-teal-700 transition-colors flex-shrink-0"
          >
            Allow
          </button>
        </div>
        {permission === 'denied' && (
          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg text-left">
            <p className="text-xs font-semibold text-red-700 mb-1">Notifications are blocked</p>
            <p className="text-[10px] text-red-600">Click the lock icon (🔒) in your address bar → Site settings → Notifications → Allow</p>
          </div>
        )}
      </Card>
    );
  }

  return (
    <Card title="Daily Reminders" icon={Bell} accent="TEAL">
      <div className="space-y-1.5 -mt-2">
        {Object.values(reminders).map((reminder) => (
          <div key={reminder.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-0.5">
                <p className={\`font-semibold text-sm \${reminder.enabled ? 'text-slate-900' : 'text-slate-400'}\`}>
                  {reminder.label}
                </p>
                {reminder.enabled && (
                  <span className="text-[10px] px-1.5 py-0.5 bg-green-100 text-green-700 rounded-full">
                    Active
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <Clock className="w-3 h-3 text-slate-400" />
                <input
                  type="time"
                  value={reminder.time}
                  onChange={(e) => updateReminder(reminder.id, { time: e.target.value })}
                  disabled={!reminder.enabled}
                  className="bg-transparent border-none p-0 text-xs text-slate-600 focus:ring-0 cursor-pointer"
                />
              </div>
            </div>

            {/* Toggle Switch */}
            <button
              onClick={() => updateReminder(reminder.id, { enabled: !reminder.enabled })}
              className={\`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 \${
                reminder.enabled ? 'bg-teal-600' : 'bg-slate-200'
              }\`}
            >
              <span
                className={\`inline-block h-4 w-4 transform rounded-full bg-white transition-transform \${
                  reminder.enabled ? 'translate-x-6' : 'translate-x-1'
                }\`}
              />
            </button>
          </div>
        ))}
      </div>
      
      <div className="mt-4 pt-4 border-t border-slate-100">
        <p className="text-xs text-slate-400 text-center">
          Reminders are sent only if the task is not yet completed.
        </p>
      </div>

    </Card>
  );
};
render(<LockerReminders />);
    `,
    'system-reminders-controller': `
const SystemRemindersController = () => {
  const useNotificationsHook = typeof useNotifications !== 'undefined' ? useNotifications : () => ({ 
    permission: 'denied', 
    requestPermission: () => {}, 
    sendTestNotification: () => {}, 
    isSupported: false 
  });

  const { 
    permission, 
    requestPermission, 
    sendTestNotification,
    isSupported 
  } = useNotificationsHook();

  return (
    <Card 
      title="System Reminders Controller" 
      icon={Shield} 
      accent="NAVY"
      className="mb-6"
    >
      <div className="space-y-6">
        {/* Status Section */}
        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
          <div className="flex items-center gap-3">
            <div className={\`p-2 rounded-full \${
              permission === 'granted' ? 'bg-green-100 text-green-600' : 
              permission === 'denied' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'
            }\`}>
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900">Notification Permission</p>
              <p className="text-xs text-slate-500 capitalize">{permission || 'Unknown'}</p>
            </div>
          </div>
          
          {permission !== 'granted' && (
            <button
              onClick={requestPermission}
              className="px-3 py-1.5 text-xs font-medium text-white bg-[#002E47] rounded hover:bg-navy-700"
            >
              Request Access
            </button>
          )}
        </div>

        {/* Controls Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 border border-slate-200 rounded-lg">
            <h4 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
              <Radio className="w-4 h-4 text-teal-600" />
              Test Channel
            </h4>
            <p className="text-xs text-slate-500 mb-4">
              Send a test notification to verify the browser's delivery system.
            </p>
            <button
              onClick={sendTestNotification}
              disabled={permission !== 'granted'}
              className="w-full px-4 py-2 text-sm font-medium text-teal-600 bg-teal-50 rounded hover:bg-teal-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send Test Notification
            </button>
          </div>

          <div className="p-4 border border-slate-200 rounded-lg">
            <h4 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-orange-500" />
              System Status
            </h4>
            <div className="space-y-2 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Browser Support:</span>
                <span className={isSupported ? "text-green-600 font-bold" : "text-red-600 font-bold"}>
                  {isSupported ? "Yes" : "No"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Service Worker:</span>
                <span className="font-mono">
                  {navigator.serviceWorker ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

    </Card>
  );
};
render(<SystemRemindersController />);
    `,
    'admin-access-viewer': `
// Hardcoded widget: AdminAccessViewer
// This widget is rendered directly by WidgetRenderer.jsx
// This template is a placeholder for the Widget Manager.
<Card title="Admin Access Viewer" icon={Shield} accent="NAVY">
  <div className="p-4 text-center text-slate-500">
    <p>This widget is rendered via a hardcoded component.</p>
  </div>
</Card>
    `,
    'time-traveler': `
const TimeTravelerWidget = () => {
  const [targetDate, setTargetDate] = React.useState('');
  const [targetTime, setTargetTime] = React.useState('');
  
  const { handleResetPlanStartDate, developmentPlanData } = typeof scope !== 'undefined' ? scope : {};
  
  // Handle multiple startDate formats (Firestore Timestamp, {seconds}, Date, string)
  const rawStartDate = developmentPlanData?.startDate;
  let startDate = null;
  if (rawStartDate) {
    if (rawStartDate.toDate && typeof rawStartDate.toDate === 'function') {
      startDate = rawStartDate.toDate();
    } else if (rawStartDate.seconds !== undefined) {
      startDate = new Date(rawStartDate.seconds * 1000);
    } else if (rawStartDate instanceof Date) {
      startDate = rawStartDate;
    } else if (typeof rawStartDate === 'string' || typeof rawStartDate === 'number') {
      startDate = new Date(rawStartDate);
    }
  }

  // Check if time travel is currently active
  const offset = parseInt(localStorage.getItem('time_travel_offset') || '0', 10);
  const isActive = offset !== 0;
  const simulatedTime = new Date(Date.now() + offset);
  
  // Calculate current week based on time offset
  const currentWeekNum = startDate 
    ? Math.floor((simulatedTime.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1
    : 1;
  
  const handleTravel = () => {
    if (!targetDate) {
      alert('Please select a date');
      return;
    }
    const dateStr = targetDate + 'T' + (targetTime || '12:00');
    const target = new Date(dateStr);
    const newOffset = target.getTime() - Date.now();
    localStorage.setItem('time_travel_offset', newOffset.toString());
    window.location.reload(); // Force reload to sync timeService and banner
  };
  
  const handleReset = () => {
    localStorage.removeItem('time_travel_offset');
    window.location.reload(); // Force reload to sync everything
  };
  
  const presets = [
    { label: 'Tonight 11:58 PM', hours: 23, minutes: 58 },
    { label: 'Tomorrow 6:00 AM', days: 1, hours: 6, minutes: 0 },
    { label: '+1 Week', days: 7 },
    { label: '+2 Weeks', days: 14 },
    { label: '+4 Weeks', days: 28 }
  ];
  
  const applyPreset = (preset) => {
    const now = new Date();
    const target = new Date(now);
    if (preset.days) target.setDate(target.getDate() + preset.days);
    if (preset.hours !== undefined) target.setHours(preset.hours, preset.minutes || 0, 0, 0);
    const newOffset = target.getTime() - Date.now();
    localStorage.setItem('time_travel_offset', newOffset.toString());
    window.location.reload(); // Force reload to sync everything
  };

  return (
    <Card title="Time Traveler" icon={Clock} accent="indigo">
      <div className="space-y-4">
        {isActive && (
          <div className="bg-indigo-100 border border-indigo-300 rounded-lg p-3">
            <div className="flex items-center gap-2 text-indigo-800">
              <Clock className="w-4 h-4" />
              <span className="font-bold">TIME TRAVEL ACTIVE</span>
            </div>
            <p className="text-sm text-indigo-700 mt-1">
              Simulated: {simulatedTime.toLocaleString()}
            </p>
            <p className="text-sm text-indigo-700 font-bold">
              Current Week: {currentWeekNum > 0 ? currentWeekNum : 'Not Started'}
            </p>
            <button
              onClick={handleReset}
              className="mt-2 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Reset to Real Time
            </button>
          </div>
        )}
        
        <div className="space-y-3">
          <div className="font-medium text-slate-700 text-sm">Quick Presets:</div>
          <div className="flex flex-wrap gap-2">
            {presets.map((preset, i) => (
              <button
                key={i}
                onClick={() => applyPreset(preset)}
                className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-sm font-medium rounded-lg transition-colors border border-indigo-200"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
        
        <div className="border-t border-slate-200 pt-3">
          <div className="font-medium text-slate-700 text-sm mb-2">Custom Date/Time:</div>
          <div className="flex gap-2">
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            <input
              type="time"
              value={targetTime}
              onChange={(e) => setTargetTime(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <button
            onClick={handleTravel}
            className="mt-2 w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
          >
            Travel to Date
          </button>
        </div>
        
        <p className="text-xs text-slate-400 italic">
          Admin only. Test midnight rollover and time-dependent features.
        </p>

        <div className="border-t border-slate-200 pt-3 mt-3">
           <div className="font-medium text-slate-700 text-sm mb-2">Plan Debug:</div>
           <div className="text-xs text-slate-500 mb-2">
             Start Date: {startDate ? (() => {
               const d = startDate;
               return \`\${String(d.getMonth() + 1).padStart(2, '0')}/\${String(d.getDate()).padStart(2, '0')}/\${d.getFullYear()}\`;
             })() : 'Not Set'}
           </div>
           <div className="text-xs text-slate-400 italic">
             Start Date is now managed by Cohort settings.
           </div>
        </div>
      </div>
    </Card>
  );
};
render(<TimeTravelerWidget />);
    `,
    'locker-progress': `
// This widget is rendered as a React component directly in Locker.jsx
// The template here is a placeholder for the feature flag system
const LockerProgressPlaceholder = () => {
  return (
    <Card title="My Progress" icon={Trophy} accent="TEAL">
      <div className="p-4 text-center text-slate-500">
        <p>Progress widget is loading...</p>
      </div>
    </Card>
  );
};
render(<LockerProgressPlaceholder />);
    `,
    'locker-wins-history': `
const WinsHistoryWidget = () => {
  const safeWinsList = typeof winsList !== 'undefined' ? winsList : [];
  const [visibleCount, setVisibleCount] = React.useState(3);
  
  // Group wins by date
  const groupedWins = {};
  safeWinsList.forEach(win => {
    // Normalize date string to avoid duplicates if formats vary slightly
    let dateKey = win.date || 'Unknown Date'; 
    
    // Try to normalize to YYYY-MM-DD (only if not already in that format)
    if (dateKey !== 'Unknown Date' && !/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(dateKey)) {
        try {
            const d = new Date(dateKey + 'T12:00:00'); // Add noon to avoid timezone day shift
            if (!isNaN(d.getTime())) {
                // Use en-CA for YYYY-MM-DD format
                dateKey = d.toLocaleDateString('en-CA');
            }
        } catch (e) {
            // Keep original if parse fails
        }
    }

    if (!groupedWins[dateKey]) groupedWins[dateKey] = [];
    groupedWins[dateKey].push(win);
  });

  // Sort dates descending (newest first)
  const sortedDates = Object.keys(groupedWins).sort((a, b) => {
      if (a === 'Unknown Date') return 1;
      if (b === 'Unknown Date') return -1;
      return new Date(b) - new Date(a);
  });
  
  const visibleDates = sortedDates.slice(0, visibleCount);
  const hasMore = sortedDates.length > visibleCount;
  const canShowLess = visibleCount > 3;

  // Helper to format date for display (MM/DD/YYYY)
  const formatDisplayDate = (dateStr) => {
    if (!dateStr) return '';
    // Parse YYYY-MM-DD and convert to MM/DD/YYYY
    if (/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(dateStr)) {
        const [year, month, day] = dateStr.split('-');
        return \`\${month}/\${day}/\${year}\`;
    }
    // Try to parse and format other date formats
    try {
      const d = new Date(dateStr + 'T12:00:00');
      if (!isNaN(d.getTime())) {
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const year = d.getFullYear();
        return \`\${month}/\${day}/\${year}\`;
      }
    } catch (e) {}
    return dateStr;
  };

  return (
    <Card title="AM Bookend (Wins History)" icon={Trophy} accent="ORANGE">
      <div className="overflow-x-auto rounded-xl border border-slate-200/60">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gradient-to-r from-slate-50 to-slate-100/50">
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider w-32">Date</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Win #1</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Win #2</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Win #3</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {visibleDates.length > 0 ? (
              visibleDates.map((date) => {
                const wins = groupedWins[date];
                // Use slot property to place wins in correct columns (1, 2, 3)
                // If no slot property, fall back to array position
                const slots = [null, null, null];
                wins.forEach((win, idx) => {
                  const slotIdx = win.slot ? win.slot - 1 : idx;
                  if (slotIdx >= 0 && slotIdx < 3) {
                    slots[slotIdx] = win;
                  }
                });
                
                return (
                  <tr key={date} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap font-semibold text-slate-700">
                      {formatDisplayDate(date)}
                    </td>
                    {slots.map((win, i) => (
                      <td key={i} className="px-4 py-3">
                        {win && win.text && win.text.trim() ? (
                          <div className="flex items-start gap-2">
                            <div className={\`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 \${
                              win.completed ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'
                            }\`}>
                              {win.completed ? <CheckCircle className="w-3.5 h-3.5" /> : <div className="w-2 h-2 rounded-full bg-slate-300" />}
                            </div>
                            <span className={\`text-sm \${win.completed ? 'text-slate-800 font-medium' : 'text-slate-500'}\`}>
                              {win.text}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-300 text-xs">—</span>
                        )}
                      </td>
                    ))}
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="4" className="px-4 py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center gap-2">
                    <Trophy className="w-8 h-8 text-slate-300" />
                    <p>No wins recorded yet</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {sortedDates.length > 3 && (
        <div className="flex justify-center gap-3 mt-4 pt-4 border-t border-slate-100">
          {canShowLess && (
            <button 
              onClick={() => setVisibleCount(3)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all duration-200"
            >
              Show Less
            </button>
          )}
          {hasMore && (
            <button 
              onClick={() => setVisibleCount(visibleCount + 3)}
              className="px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-corporate-orange to-orange-500 hover:from-orange-600 hover:to-orange-500 rounded-xl shadow-sm hover:shadow transition-all duration-200"
            >
              Show More ({sortedDates.length - visibleCount} remaining)
            </button>
          )}
        </div>
      )}
    </Card>
  );
};
render(<WinsHistoryWidget />);
    `,
    'locker-scorecard-history': `
const ScorecardHistoryWidget = () => {
  const safeHistory = typeof commitmentHistory !== 'undefined' ? commitmentHistory : [];
  const safeLiveScorecard = typeof liveScorecard !== 'undefined' ? liveScorecard : null;
  const [visibleCount, setVisibleCount] = React.useState(3);
  
  // Get today's date for comparison (respects time travel) - USE LOCAL DATE
  const timeOffset = parseInt(localStorage.getItem('time_travel_offset') || '0', 10);
  const simulatedNow = new Date(Date.now() + timeOffset);
  // Use local date format YYYY-MM-DD (not UTC to avoid timezone issues)
  const todayStr = \`\${simulatedNow.getFullYear()}-\${String(simulatedNow.getMonth() + 1).padStart(2, '0')}-\${String(simulatedNow.getDate()).padStart(2, '0')}\`;
  
  // Helper to normalize any date format to YYYY-MM-DD for comparison
  const normalizeDate = (dateStr) => {
    if (!dateStr) return null;
    // Already YYYY-MM-DD format
    if (/^\\d{4}-\\d{2}-\\d{2}$/.test(dateStr)) return dateStr;
    // Handle M/D/YYYY or MM/DD/YYYY format
    if (dateStr.includes('/')) {
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        const [month, day, year] = parts;
        return \`\${year}-\${String(month).padStart(2, '0')}-\${String(day).padStart(2, '0')}\`;
      }
    }
    // Fallback: try to parse and format using LOCAL date
    try {
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) {
        return \`\${d.getFullYear()}-\${String(d.getMonth() + 1).padStart(2, '0')}-\${String(d.getDate()).padStart(2, '0')}\`;
      }
    } catch (e) {}
    return dateStr;
  };
  
  // Deduplicate entries by normalized date (keep most recent/highest score)
  // EXCLUDE today's entry from history - we'll show the live one instead
  const deduplicatedHistory = (() => {
    const byDate = {};
    safeHistory.forEach(entry => {
      const normalized = normalizeDate(entry.date);
      if (!normalized) return;
      // Skip today's entry from history - live scorecard takes precedence
      if (normalized === todayStr) return;
      // Keep the entry with the higher score or the first one encountered
      if (!byDate[normalized]) {
        byDate[normalized] = { ...entry, normalizedDate: normalized };
      } else {
        // Compare scores - keep the higher one
        const existingScore = parseInt((byDate[normalized].score || '0').split('/')[0], 10);
        const newScore = parseInt((entry.score || '0').split('/')[0], 10);
        if (newScore > existingScore) {
          byDate[normalized] = { ...entry, normalizedDate: normalized };
        }
      }
    });
    return Object.values(byDate);
  })();
  
  // Sort by date descending (latest first)
  const sortedPastHistory = [...deduplicatedHistory].sort((a, b) => {
    if (!a.normalizedDate) return 1;
    if (!b.normalizedDate) return -1;
    return b.normalizedDate.localeCompare(a.normalizedDate);
  });
  
  // Create live "Today" entry from liveScorecard
  const liveTodayEntry = safeLiveScorecard ? {
    date: todayStr,
    normalizedDate: todayStr,
    score: safeLiveScorecard.score,
    isLive: true // Flag to identify this as real-time data
  } : null;
  
  // Combine: Today (live) first, then past history
  const sortedHistory = liveTodayEntry 
    ? [liveTodayEntry, ...sortedPastHistory]
    : sortedPastHistory;
  
  const visibleHistory = sortedHistory.slice(0, visibleCount);
  const hasMore = sortedHistory.length > visibleCount;
  const canShowLess = visibleCount > 3;
  
  // Format date for display (MM/DD/YYYY)
  const formatDisplayDate = (dateStr) => {
    const normalized = normalizeDate(dateStr);
    if (!normalized) return dateStr;
    // Convert YYYY-MM-DD to MM/DD/YYYY
    const [year, month, day] = normalized.split('-');
    return \`\${month}/\${day}/\${year}\`;
  };

  return (
    <Card title="Win the Day Scorecard" icon={Calendar} accent="TEAL">
      <div className="overflow-x-auto rounded-xl border border-slate-200/60">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gradient-to-r from-slate-50 to-slate-100/50">
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Date</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Wins</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {visibleHistory.length > 0 ? (
              visibleHistory.map((entry, index) => {
                // Parse score "X/Y"
                const [done, total] = (entry.score || "0/0").split('/').map(Number);
                const pct = total > 0 ? Math.round((done / total) * 100) : 0;
                const isPerfect = pct === 100;
                // Use pre-normalized date for comparison
                const isToday = entry.normalizedDate === todayStr;
                
                return (
                  <tr key={index} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap font-semibold text-slate-700">
                      {formatDisplayDate(entry.normalizedDate)}{isToday && <span className="ml-2 px-2 py-0.5 text-[10px] font-bold bg-blue-100 text-blue-700 rounded-full">TODAY</span>}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap font-bold text-slate-800">
                      {entry.score} <span className="text-xs text-slate-400 font-normal ml-1">({pct}%)</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {isToday ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-semibold">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                          In Progress
                        </span>
                      ) : isPerfect ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-xs font-semibold">
                          <CheckCircle className="w-3.5 h-3.5" /> Perfect
                        </span>
                      ) : pct > 0 ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-600 text-xs font-semibold">
                          Complete
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-500 text-xs font-semibold">
                          No Activity
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="3" className="px-4 py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center gap-2">
                    <Calendar className="w-8 h-8 text-slate-300" />
                    <p>No scorecard history available</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {sortedHistory.length > 3 && (
        <div className="flex justify-center gap-3 mt-4 pt-4 border-t border-slate-100">
          {canShowLess && (
            <button 
              onClick={() => setVisibleCount(3)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all duration-200"
            >
              Show Less
            </button>
          )}
          {hasMore && (
            <button 
              onClick={() => setVisibleCount(visibleCount + 3)}
              className="px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-corporate-teal to-teal-500 hover:from-teal-600 hover:to-teal-500 rounded-xl shadow-sm hover:shadow transition-all duration-200"
            >
              Show More ({sortedHistory.length - visibleCount} remaining)
            </button>
          )}
        </div>
      )}
    </Card>
  );
};
render(<ScorecardHistoryWidget />);
    `,
    'locker-latest-reflection': `
const ReflectionHistoryWidget = () => {
  const safeReflections = typeof reflectionHistory !== 'undefined' ? reflectionHistory : [];
  const [visibleCount, setVisibleCount] = React.useState(3);
  
  // Normalize and dedupe reflections
  const normalizedReflectionsMap = {};
  
  safeReflections.forEach(entry => {
      if (!entry.date) return;
      
      let dateKey = entry.date;
      // If already YYYY-MM-DD format, use as-is (don't convert via Date which causes timezone issues)
      if (!/^\\d{4}-\\d{2}-\\d{2}$/.test(dateKey)) {
          try {
              // Only parse non-standard date formats
              const d = new Date(dateKey + 'T12:00:00'); // Add noon time to avoid timezone day shift
              if (!isNaN(d.getTime())) {
                  dateKey = d.toLocaleDateString('en-CA');
              }
          } catch (e) {}
      }
      
      // If duplicate, prefer the one with more content
      if (!normalizedReflectionsMap[dateKey]) {
          normalizedReflectionsMap[dateKey] = { ...entry, date: dateKey };
      } else {
          const existing = normalizedReflectionsMap[dateKey];
          const existingContentLength = (existing.reflectionGood || '').length + (existing.reflectionWork || '').length;
          const newContentLength = (entry.reflectionGood || '').length + (entry.reflectionWork || '').length;
          
          if (newContentLength > existingContentLength) {
              normalizedReflectionsMap[dateKey] = { ...entry, date: dateKey };
          }
      }
  });

  const normalizedReflections = Object.values(normalizedReflectionsMap);

  // Sort by date descending (latest first)
  const sortedReflections = normalizedReflections.sort((a, b) => {
    if (!a.date) return 1;
    if (!b.date) return -1;
    return new Date(b.date) - new Date(a.date);
  });
  
  const visibleReflections = sortedReflections.slice(0, visibleCount);
  const hasMore = sortedReflections.length > visibleCount;
  const canShowLess = visibleCount > 3;

  // Helper to format date for display (MM/DD/YYYY)
  const formatDisplayDate = (dateStr) => {
    if (!dateStr) return '';
    // Parse YYYY-MM-DD and convert to MM/DD/YYYY
    if (/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(dateStr)) {
        const [year, month, day] = dateStr.split('-');
        return \`\${month}/\${day}/\${year}\`;
    }
    // Try to parse and format other date formats
    try {
      const d = new Date(dateStr + 'T12:00:00');
      if (!isNaN(d.getTime())) {
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const year = d.getFullYear();
        return \`\${month}/\${day}/\${year}\`;
      }
    } catch (e) {}
    return dateStr;
  };

  return (
    <Card title="Reflection History" icon={BookOpen} accent="NAVY">
      <div className="overflow-x-auto rounded-xl border border-slate-200/60">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gradient-to-r from-slate-50 to-slate-100/50">
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Date</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">What Went Well</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">What Needs Work</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Tomorrow's Improvement</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {visibleReflections.length > 0 ? (
              visibleReflections.map((log, index) => (
                <tr key={log.id || index} className="hover:bg-slate-50/50 transition-colors align-top">
                  <td className="px-4 py-3 whitespace-nowrap font-semibold text-slate-700">
                    {formatDisplayDate(log.date)}
                  </td>
                  <td className="px-4 py-3 text-slate-700 min-w-[200px]">
                    {log.reflectionGood || <span className="text-slate-300">—</span>}
                  </td>
                  <td className="px-4 py-3 text-slate-700 min-w-[200px]">
                    {log.reflectionWork || <span className="text-slate-300">—</span>}
                  </td>
                  <td className="px-4 py-3 text-slate-700 min-w-[200px]">
                    {log.reflectionTomorrow || <span className="text-slate-300">—</span>}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="px-4 py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center gap-2">
                    <BookOpen className="w-8 h-8 text-slate-300" />
                    <p>No reflection history found</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {sortedReflections.length > 3 && (
        <div className="flex justify-center gap-3 mt-4 pt-4 border-t border-slate-100">
          {canShowLess && (
            <button 
              onClick={() => setVisibleCount(3)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all duration-200"
            >
              Show Less
            </button>
          )}
          {hasMore && (
            <button 
              onClick={() => setVisibleCount(visibleCount + 3)}
              className="px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-corporate-navy to-slate-700 hover:from-slate-700 hover:to-slate-600 rounded-xl shadow-sm hover:shadow transition-all duration-200"
            >
              Show More ({sortedReflections.length - visibleCount} remaining)
            </button>
          )}
        </div>
      )}
    </Card>
  );
};
render(<ReflectionHistoryWidget />);
    `,
    'locker-reps-history': `
const RepsHistoryWidget = () => {
  const safeHistory = typeof repsHistory !== 'undefined' ? repsHistory : [];
  const [visibleCount, setVisibleCount] = React.useState(3);
  
  // Normalize and dedupe history
  const normalizedHistoryMap = {};
  
  safeHistory.forEach(entry => {
      if (!entry.date) return;
      
      let dateKey = entry.date;
      // Only parse if not already YYYY-MM-DD format to avoid timezone issues
      if (!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(dateKey)) {
          try {
              const d = new Date(dateKey + 'T12:00:00'); // Add noon to avoid timezone day shift
              if (!isNaN(d.getTime())) {
                  dateKey = d.toLocaleDateString('en-CA');
              }
          } catch (e) {}
      }
      
      if (!normalizedHistoryMap[dateKey]) {
          normalizedHistoryMap[dateKey] = { ...entry, date: dateKey };
      } else {
          // Merge items if duplicate exists (prefer the one with more items or most recent)
          const existing = normalizedHistoryMap[dateKey];
          // If current entry has more items, use it but keep the normalized date
          if ((entry.items?.length || 0) > (existing.items?.length || 0)) {
              normalizedHistoryMap[dateKey] = { ...entry, date: dateKey };
          }
      }
  });

  const normalizedHistory = Object.values(normalizedHistoryMap);

  // Sort dates descending (newest first)
  const sortedHistory = normalizedHistory.sort((a, b) => {
    if (!a.date) return 1;
    if (!b.date) return -1;
    return new Date(b.date) - new Date(a.date);
  });
  
  const visibleHistory = sortedHistory.slice(0, visibleCount);
  const hasMore = sortedHistory.length > visibleCount;
  const canShowLess = visibleCount > 3;

  // Helper to format date for display (MM/DD/YYYY)
  const formatDisplayDate = (dateStr) => {
    if (!dateStr) return '';
    // Parse YYYY-MM-DD and convert to MM/DD/YYYY
    if (/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(dateStr)) {
        const [year, month, day] = dateStr.split('-');
        return \`\${month}/\${day}/\${year}\`;
    }
    // Try to parse and format other date formats
    try {
      const d = new Date(dateStr + 'T12:00:00');
      if (!isNaN(d.getTime())) {
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const year = d.getFullYear();
        return \`\${month}/\${day}/\${year}\`;
      }
    } catch (e) {}
    return dateStr;
  };

  return (
    <Card title="Daily Reps History" icon={Dumbbell} accent="NAVY">
      <div className="overflow-x-auto rounded-xl border border-slate-200/60">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gradient-to-r from-slate-50 to-slate-100/50">
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider w-32">Date</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Reps Completed</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider w-24">Count</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {visibleHistory.length > 0 ? (
              visibleHistory.map((entry, dateIndex) => (
                <tr key={dateIndex} className="hover:bg-slate-50/50 transition-colors align-top">
                  <td className="px-4 py-3 whitespace-nowrap font-semibold text-slate-700">
                    {formatDisplayDate(entry.date)}
                  </td>
                  <td className="px-4 py-3">
                    {entry.items && entry.items.length > 0 ? (
                      <div className="space-y-1">
                        {entry.items.map((rep, repIndex) => (
                          <div key={repIndex} className="flex items-start gap-2">
                            <div className="mt-0.5 w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0">
                              <CheckCircle className="w-3.5 h-3.5" />
                            </div>
                            <span className="text-sm text-slate-700">{rep.text || rep.label || 'Completed rep'}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-slate-400 text-sm">No rep details recorded</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <span className="font-bold text-corporate-teal">{entry.completedCount || (entry.items?.length || 0)}</span>
                    <span className="text-slate-400 text-xs ml-1">reps</span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="3" className="px-4 py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center gap-2">
                    <Dumbbell className="w-8 h-8 text-slate-300" />
                    <p>No reps history available yet</p>
                    <p className="text-xs text-slate-400">Complete your daily reps to start building your history!</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {sortedHistory.length > 3 && (
        <div className="flex justify-center gap-3 mt-4 pt-4 border-t border-slate-100">
          {canShowLess && (
            <button 
              onClick={() => setVisibleCount(3)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all duration-200"
            >
              Show Less
            </button>
          )}
          {hasMore && (
            <button 
              onClick={() => setVisibleCount(visibleCount + 3)}
              className="px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-corporate-navy to-slate-700 hover:from-slate-700 hover:to-slate-600 rounded-xl shadow-sm hover:shadow transition-all duration-200"
            >
              Show More ({sortedHistory.length - visibleCount} remaining)
            </button>
          )}
        </div>
      )}
    </Card>
  );
};
render(<RepsHistoryWidget />);
    `,
    'development-plan': `
(() => {
  const safeScope = typeof scope !== 'undefined' ? scope : {};
  const { 
    currentWeek,
    userProgress,
    handleItemToggle,
    handleReflectionUpdate
  } = safeScope;

  if (!currentWeek) return null;

  const { 
    title, 
    focus, 
    phase, 
    description,
    weekNumber,
    estimatedTimeMinutes,
    skills = [],
    pillars = [],
    difficultyLevel,
    content = [], 
    community = [], 
    coaching = [],
    dailyReps = [],
    reps = [],
    reflectionPrompt
  } = currentWeek;

  const {
    completedItems = [],
    reflectionResponse = ''
  } = userProgress || {};

  const allItems = [...content, ...community, ...coaching];
  
  const requiredItems = allItems.filter(i => i.required !== false && i.optional !== true);
  const requiredCompletedCount = requiredItems.filter(i => completedItems.includes(i.id)).length;
  const progressPercent = requiredItems.length > 0 ? (requiredCompletedCount / requiredItems.length) * 100 : 0;

  const getItemIcon = (type) => {
    switch (type) {
      case 'workout': return Video;
      case 'read_and_rep': return BookOpen;
      case 'leader_circle': return Users;
      case 'open_gym': return Users; 
      default: return Circle;
    }
  };

  return (
    <Card title={phase} subtitle={title} icon={BookOpen} accent="NAVY">
      <div className="space-y-4">
        {/* Header Info */}
        <div>
          <div className="flex justify-between items-start mb-1">
            <h3 className="text-lg font-bold text-slate-800">{focus}</h3>
            {weekNumber && (
              <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-full uppercase tracking-wider">
                Week {weekNumber}
              </span>
            )}
          </div>
          <p className="text-sm text-slate-600 mb-3">{description}</p>
          
          {/* Metadata Tags */}
          <div className="flex flex-wrap gap-2 mb-2">
            {difficultyLevel && (
              <span className="text-[10px] font-bold text-slate-500 border border-slate-200 px-2 py-0.5 rounded uppercase">
                {difficultyLevel}
              </span>
            )}
            {estimatedTimeMinutes && (
              <span className="text-[10px] font-bold text-slate-500 border border-slate-200 px-2 py-0.5 rounded uppercase">
                {estimatedTimeMinutes} mins
              </span>
            )}
            {pillars.map(p => (
              <span key={p} className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase">
                {p}
              </span>
            ))}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs font-medium text-slate-500">
            <span>Progress</span>
            <span>{Math.round(progressPercent)}%</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500 transition-all duration-500"
              style={{ width: \`\${progressPercent}%\` }}
            />
          </div>
        </div>

        {/* Action Items */}
        <div className="space-y-2">
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">
            This Week's Actions
          </p>
          {allItems.map(item => {
            const isCompleted = completedItems.includes(item.id);
            const Icon = getItemIcon(item.type);
            
            return (
              <div 
                key={item.id} 
                className={\`flex items-center gap-3 p-3 rounded-xl transition-colors cursor-pointer border \${
                  isCompleted 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-white hover:bg-slate-50 border-slate-200'
                }\`}
                onClick={() => handleItemToggle(item.id)}
              >
                <div className={\`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center \${
                  isCompleted ? 'bg-green-100 text-green-600' : 'bg-blue-50 text-blue-600'
                }\`}>
                  <Icon size={16} />
                </div>
                
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <p className={\`text-sm font-medium \${isCompleted ? 'text-slate-500' : 'text-slate-800'}\`}>
                      {item.label}
                    </p>
                    {item.recommendedWeekDay && !isCompleted && (
                      <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded uppercase ml-2 whitespace-nowrap">
                        {item.recommendedWeekDay}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 capitalize">
                    {item.type.replace(/_/g, ' ')} • {item.required === false || item.optional ? 'Optional' : 'Required'}
                  </p>
                </div>

                {isCompleted && <CheckCircle className="w-5 h-5 text-green-500" />}
              </div>
            );
          })}
        </div>

        {/* Daily Reps Section */}
        {(dailyReps.length > 0 || reps.length > 0) && (
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider flex items-center gap-2">
              <Zap className="w-4 h-4 text-purple-500" />
              Daily Reps
            </p>
            <p className="text-xs text-slate-400 mb-2">
              Practice these daily to reinforce learning
            </p>
            <div className="space-y-2">
              {[...dailyReps, ...reps].map((rep, idx) => (
                <div 
                  key={rep.repId || rep.id || idx}
                  className="flex items-start gap-3 p-3 bg-purple-50 border border-purple-100 rounded-xl"
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-purple-100 text-purple-600">
                    <Repeat className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-800">
                      {rep.repLabel || rep.label || rep.name || 'Daily Rep'}
                    </p>
                    {rep.repType && (
                      <p className="text-xs text-purple-600 capitalize">
                        {rep.repType}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reflection */}
        {reflectionPrompt && (
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <p className="text-sm font-medium text-slate-700">
              Reflection
            </p>
            <p className="text-xs text-slate-500 italic">
              {reflectionPrompt}
            </p>
            <textarea
              value={reflectionResponse}
              onChange={(e) => handleReflectionUpdate(e.target.value)}
              placeholder="Type your reflection here..."
              className="w-full p-3 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
              rows={3}
            />
          </div>
        )}
      </div>
    </Card>
  );
})()
    `,
    
    'baseline-assessment': `
(() => {
  // Get assessment data from developmentPlanData
  const assessmentHistory = developmentPlanData?.assessmentHistory || [];
  const hasCompletedAssessment = assessmentHistory.length > 0;
  const latestAssessment = hasCompletedAssessment ? assessmentHistory[assessmentHistory.length - 1] : null;
  
  // Format date if available
  const assessmentDate = latestAssessment?.date 
    ? new Date(latestAssessment.date).toLocaleDateString(undefined, { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      })
    : null;
  
  // Navigation handlers
  const handleTakeAssessment = () => {
    if (navigate) {
      navigate('development-plan', { view: 'baseline', _t: Date.now() });
    }
  };
  
  const handleViewBaseline = () => {
    if (navigate) {
      // Navigate to view/update the baseline assessment
      navigate('development-plan', { view: 'baseline', mode: 'view', _t: Date.now() });
    }
  };

  return (
    <Card 
      title="Baseline Assessment" 
      icon={ClipboardList}
      accent="NAVY"
    >
      <div className="space-y-2">
        {/* Assessment Row - Similar to My Settings style */}
        <button
          onClick={hasCompletedAssessment ? handleViewBaseline : handleTakeAssessment}
          className="w-full p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between hover:bg-slate-50 hover:border-corporate-teal/30 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className={\`w-8 h-8 rounded-full flex items-center justify-center \${hasCompletedAssessment ? 'bg-green-100' : 'bg-corporate-orange/10'}\`}>
              {hasCompletedAssessment ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <AlertCircle className="w-4 h-4 text-corporate-orange" />
              )}
            </div>
            <div className="text-left">
              <h4 className="font-medium text-corporate-navy text-sm">
                {hasCompletedAssessment ? 'Assessment Complete' : 'Assessment Required'}
              </h4>
              <p className="text-xs text-slate-500">
                {hasCompletedAssessment 
                  ? \`Completed \${assessmentDate}\` 
                  : 'Complete to unlock your plan'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-corporate-teal">
            <span className="text-xs font-medium">{hasCompletedAssessment ? 'View' : 'Start'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </button>
      </div>
    </Card>
  );
})()
    `,

    'this-weeks-actions': `
<ThisWeeksActionsWidget scope={scope} />
    `,

    // Coaching Hub Widgets
    'coaching-upcoming-sessions': `
<CoachingUpcomingSessionsWidget scope={scope} />
    `,
    
    'coaching-on-demand': `
<CoachingOnDemandWidget scope={scope} />
    `,
    
    'coaching-my-sessions': `
<CoachingMySessionsWidget scope={scope} />
    `,

  };

export const FEATURE_METADATA = {
  'program-status-debug': {
    core: true,
    category: 'System',
    name: 'Program Status Debug',
    description: 'Debug Day/Week',
    purpose: 'Debug tool for Day/Week calculation.',
    extendedDescription: 'Allows admins to view and reset the calculated Day and Week numbers.',
    inputs: [],
    outputs: [],
  },
  'leader-profile': {
    core: false,  // DEPRECATED - Now handled as INTERACTIVE content in ThisWeeksActionsWidget
    category: 'Dashboard',
    name: 'Leader Profile (Legacy)',
    description: 'Complete Your Leader Profile',
    purpose: 'DEPRECATED: Now handled as INTERACTIVE content type in ThisWeeksActionsWidget.',
    extendedDescription: 'Legacy widget. Leader Profile is now managed as an INTERACTIVE content item in the Content Library and appears inline in the Actions list.',
    inputs: ['userProfile'],
    outputs: ['saveProfile'],
    componentPath: 'src/components/widgets/LeaderProfileWidget.jsx',
    deprecated: true,
    replacedBy: 'INTERACTIVE content type (interactive-leader-profile)'
  },
  'baseline-assessment': {
    core: false,  // DEPRECATED - Now handled as INTERACTIVE content in ThisWeeksActionsWidget
    category: 'Dashboard',
    name: 'Baseline Assessment (Legacy)',
    description: 'Complete Your Baseline Assessment',
    purpose: 'DEPRECATED: Now handled as INTERACTIVE content type in ThisWeeksActionsWidget.',
    extendedDescription: 'Legacy widget. Baseline Assessment is now managed as an INTERACTIVE content item in the Content Library and appears inline in the Actions list.',
    inputs: ['developmentPlanData'],
    outputs: ['assessmentHistory'],
    componentPath: 'src/components/widgets/BaselineAssessmentWidget.jsx',
    deprecated: true,
    replacedBy: 'INTERACTIVE content type (interactive-baseline-assessment)'
  },
  'prep-welcome-banner': {
    core: true,
    category: 'Dashboard',
    name: 'Prep Welcome Banner',
    description: 'Welcome Banner (Prep)',
    purpose: 'Welcome banner for Prep Phase.',
    extendedDescription: 'Displays the "Welcome to The Arena" banner. Only visible during Prep Phase (Day < 1).',
    inputs: [],
    outputs: [],
  },
  'locker-controller': {
    core: true,
    category: 'Locker',
    name: 'Controller',
    description: 'Locker Controller',
    purpose: 'Dashboard metadata.',
    extendedDescription: 'Displays current user, time, release group, and plan progress.',
    inputs: ['user', 'releaseGroup', 'planProgress'],
    outputs: [],
  },
  'locker-reminders': {
    core: true,
    category: 'Locker',
    name: 'Reminders',
    description: 'Locker Reminders',
    purpose: 'Notification management.',
    extendedDescription: 'Allows the user to toggle and schedule daily reminders for key habits.',
    inputs: ['userSettings'],
    outputs: ['updateSettings'],
  },
  'system-reminders-controller': {
    core: true,
    category: 'System',
    name: 'System Reminders',
    description: 'System Reminders Controller',
    purpose: 'Admin notification tools.',
    extendedDescription: 'Provides system status and test controls for the notification infrastructure.',
    inputs: ['systemStatus'],
    outputs: ['triggerTestNotification'],
  },
  'admin-access-viewer': {
    core: true,
    category: 'System',
    name: 'Admin Access Viewer',
    description: 'View user access levels.',
    purpose: 'Admin tool for checking user unlocks.',
    extendedDescription: 'Allows admins to view unlocked content and cumulative access for any user.',
    inputs: [],
    outputs: [],
    componentPath: 'src/components/admin/AdminAccessViewer.jsx',
  },
  'time-traveler': {
    core: true,
    category: 'System',
    name: 'Time Traveler',
    description: 'Time Travel Testing Widget',
    purpose: 'Test time-sensitive features.',
    extendedDescription: 'Allows admins to simulate different dates and times to test midnight rollover, scheduling, and time-based logic. Only visible to admin users.',
    inputs: ['currentTime'],
    outputs: ['setTime'],
  },
  'locker-wins-history': {
    core: true,
    category: 'Locker',
    name: 'AM Bookend History',
    description: 'AM Bookend History',
    purpose: 'History of daily wins.',
    extendedDescription: 'Displays a spreadsheet-style history of AM Bookend wins and their completion status.',
    inputs: ['winsHistory'],
    outputs: [],
  },
  'locker-scorecard-history': {
    core: true,
    category: 'Locker',
    name: 'Win the Day Scorecard',
    description: 'Win the Day Scorecard History',
    purpose: 'History of daily Win the Day completions.',
    extendedDescription: 'Displays a spreadsheet-style history of Win the Day results (morning wins only). Shows a live "Today" row that updates in real-time as you complete your wins.',
    inputs: ['scorecardHistory', 'liveScorecard'],
    outputs: [],
  },
  'locker-progress': {
    core: true,
    category: 'Locker',
    name: 'My Progress',
    description: 'Action Progress Tracker',
    purpose: 'Track completion of weekly actions with gamification.',
    extendedDescription: 'Comprehensive progress tracking for "This Week\'s Actions" including completion stats, streaks, badges, accomplishments by week, and outstanding items. Features gamification with points and achievements.',
    inputs: ['actionProgress'],
    outputs: ['completeItem', 'skipItem'],
  },
  'locker-latest-reflection': {
    core: true,
    category: 'Locker',
    name: 'Reflection History',
    description: 'Reflection History',
    purpose: 'History of daily reflections.',
    extendedDescription: 'Displays a spreadsheet-style history of PM Bookend reflections.',
    inputs: ['reflectionHistory'],
    outputs: [],
  },
  'locker-reps-history': {
    core: false, // DEPRECATED - replaced by locker-conditioning-history
    category: 'Locker',
    name: 'Reps History (Deprecated)',
    description: 'Reps History',
    purpose: 'History of daily reps.',
    extendedDescription: 'DEPRECATED: Use locker-conditioning-history instead. Displays a spreadsheet-style history of daily reps completion.',
    inputs: ['repsHistory'],
    outputs: [],
  },
  'locker-conditioning-history': {
    core: true,
    category: 'Locker',
    name: 'Conditioning History',
    description: 'Weekly conditioning rep history',
    purpose: 'Track your weekly leadership conditioning reps.',
    extendedDescription: 'Displays your conditioning rep history grouped by week. Shows completed and canceled reps with details about the person, rep type, and completion status.',
    inputs: ['conditioningReps'],
    outputs: [],
    componentPath: 'src/components/widgets/ConditioningHistoryWidget.jsx',
  },
  'am-bookend-header': {
    core: true,
    category: 'Planning',
    name: 'AM Bookend Header',
    description: 'AM Bookend Header',
    purpose: 'Visual separator for the Morning Routine.',
    extendedDescription: 'Marks the beginning of the AM Bookend section, signaling the start of the daily planning process.',
    inputs: [],
    outputs: [],
  },
  'weekly-focus': {
    core: true,
    category: 'Planning',
    name: 'Weekly Focus',
    description: 'Weekly Focus',
    purpose: 'Highlights the primary development goal for the week.',
    extendedDescription: 'Displays the active focus area from the user\'s Development Plan to keep it top-of-mind.',
    inputs: ['devPlanCurrentWeek'],
    outputs: [],
  },
  'lis-maker': {
    core: true,
    category: 'Dashboard',
    name: 'LIS Maker',
    description: 'LIS Maker',
    purpose: 'Builds the Leadership Identity Statement.',
    extendedDescription: 'A guided tool to help the user craft and refine their Leadership Identity Statement (LIS).',
    inputs: ['identityStatement'],
    outputs: ['setIdentityStatement', 'saveIdentity'],
  },
  'grounding-rep': {
    core: true,
    category: 'Planning',
    name: 'Grounding Rep',
    description: 'Grounding Rep',
    purpose: 'Reconnects the leader with their core identity.',
    extendedDescription: 'Provides a quick link or display of the Leadership Identity Statement (LIS) to ground the user before starting their day.',
    inputs: ['identityStatement', 'isEditingLIS'],
    outputs: ['setIdentityStatement', 'handleSaveIdentity', 'setIsEditingLIS'],
    componentPath: 'src/components/widgets/GroundingRepWidget.jsx',
  },
  'win-the-day': {
    core: true,
    category: 'Planning',
    name: 'Win the Day',
    description: 'Win the Day',
    purpose: 'Sets daily priorities.',
    extendedDescription: 'Allows the user to define and track 3 high-impact actions for the day.',
    inputs: ['morningWins', 'scope'],
    outputs: ['handleUpdateWin', 'handleToggleWinComplete', 'handleSaveSingleWin', 'handleSaveAllWins'],
    componentPath: 'src/components/widgets/WinTheDayWidget.jsx',
  },
  'daily-leader-reps': {
    core: true,
    category: 'Planning',
    name: 'Daily Reps',
    description: 'Daily Reps',
    purpose: 'Tracks daily habits.',
    extendedDescription: 'A checklist of small, consistent actions (reps) that build leadership muscle over time.',
    inputs: ['devPlanCurrentWeek', 'additionalCommitments', 'isSavingReps'],
    outputs: ['handleToggleAdditionalRep'],
  },
  'conditioning': {
    core: true,
    category: 'Dashboard',
    name: 'Conditioning',
    description: 'Daily Conditioning Reps',
    purpose: 'Track your daily leadership conditioning routine.',
    extendedDescription: 'Shows your weekly conditioning progress and allows quick access to log your daily reps through a slide-in panel.',
    inputs: ['cohortId', 'user'],
    outputs: [],
    componentPath: 'src/components/widgets/ConditioningWidget.jsx',
  },
  'notifications': {
    core: true,
    category: 'General',
    name: 'Notifications',
    description: 'Notifications',
    purpose: 'Centralized alerts and updates.',
    extendedDescription: 'Aggregates important information like reflection insights, upcoming practice sessions, and new content unlocks.',
    inputs: ['devPlanCurrentWeek', 'navigate'],
    outputs: ['navigate'],
  },
  'pm-bookend-header': {
    core: true,
    category: 'Reflection',
    name: 'PM Bookend Header',
    description: 'PM Bookend Header',
    purpose: 'Visual separator for the Evening Routine.',
    extendedDescription: 'Marks the beginning of the PM Bookend section, signaling the transition to reflection and closing the day.',
    inputs: [],
    outputs: [],
  },
  'progress-feedback': {
    core: true,
    category: 'Tracking',
    name: 'Progress Feedback',
    description: 'Progress Feedback',
    purpose: 'Visualizes weekly consistency.',
    extendedDescription: 'Shows a progress bar and grade based on the completion of daily planning and reflection tasks.',
    inputs: ['userProgress'],
    outputs: [],
  },
  'pm-bookend': {
    core: true,
    category: 'Reflection',
    name: 'Reflection',
    description: 'Reflection',
    purpose: 'Daily reflection journal.',
    extendedDescription: 'A structured form for reviewing the day, identifying wins and improvements, and setting a closing thought.',
    inputs: ['reflectionGood', 'reflectionBetter', 'reflectionBest', 'isSavingBookend'],
    outputs: ['setReflectionGood', 'setReflectionBetter', 'setReflectionBest', 'handleSaveEveningBookend'],
    componentPath: 'src/components/widgets/PMReflectionWidget.jsx',
  },
  'scorecard': {
    core: true,
    category: 'Tracking',
    name: 'Daily Progress',
    description: 'Daily Progress',
    purpose: 'Daily performance summary.',
    extendedDescription: 'Displays stats on completed reps and "Win the Day" tasks, along with the current streak count.',
    inputs: ['scorecardData'],
    outputs: [],
  },
  'daily-quote': {
    core: true,
    category: 'Inspiration',
    name: 'Daily quote',
    description: 'Daily quote',
    purpose: 'Daily inspiration.',
    extendedDescription: 'Displays a rotating leadership quote to inspire the user.',
    inputs: [],
    outputs: [],
  },
  'welcome-message': {
    core: true,
    category: 'General',
    name: 'Welcome message',
    description: 'Welcome message',
    purpose: 'Personal greeting.',
    extendedDescription: 'Welcomes the user by name and sets a positive tone for the session.',
    inputs: ['userDisplayName'],
    outputs: [],
  },
  'dev-plan-header': {
    core: true,
    category: 'Development Plan',
    name: 'DP Header',
    description: 'Development Plan Header',
    purpose: 'Development Plan Overview.',
    extendedDescription: 'Shows the current cycle, total skills, and overall progress of the active Development Plan.',
    inputs: ['devPlan'],
    outputs: [],
  },
  'dev-plan-stats': {
    core: true,
    category: 'Development Plan',
    name: 'DP Stats',
    description: 'Development Plan Stats',
    purpose: 'Detailed progress metrics.',
    extendedDescription: 'Breaks down skills into total, completed, and current week focus.',
    inputs: ['devPlanStats'],
    outputs: [],
  },
  'dev-plan-actions': {
    core: true,
    category: 'Development Plan',
    name: 'DP Actions',
    description: 'Development Plan Actions',
    purpose: 'Plan management.',
    extendedDescription: 'Quick actions to view breakdowns, scan progress, or edit the plan.',
    inputs: [],
    outputs: ['navigate'],
  },
  'this-weeks-actions': {
    core: true,
    category: 'Dashboard',
    name: 'This Week\'s Actions',
    description: 'This Week\'s Actions',
    purpose: 'Weekly To-Do List.',
    extendedDescription: 'Lists all actionable items (Readings, Videos, Exercises) from the current week of the Development Plan with checkboxes for completion.',
    inputs: ['currentWeek', 'userProgress'],
    outputs: ['toggleItemComplete'],
    componentPath: 'src/components/widgets/ThisWeeksActionsWidget.jsx',
  },
  'dev-plan-focus-areas': {
    core: true,
    category: 'Development Plan',
    name: 'DP Focus Areas',
    description: 'Development Plan Focus Areas',
    purpose: 'Strategic priorities.',
    extendedDescription: 'Lists the specific areas the user is working on, including the "why" and associated resources.',
    inputs: ['devPlanFocus'],
    outputs: [],
  },
  'dev-plan-goal': {
    core: true,
    category: 'Development Plan',
    name: 'DP Goal',
    description: 'Development Plan Goal',
    purpose: 'North Star.',
    extendedDescription: 'Displays the user\'s primary open-ended goal for the current development cycle.',
    inputs: ['devPlanGoal'],
    outputs: [],
  },
  'dev-plan-tracker': {
    core: true,
    category: 'Development Plan',
    name: 'Plan Tracker',
    description: 'Main Plan Tracker',
    purpose: 'Track weekly progress.',
    extendedDescription: 'The main interface for tracking weekly development plan activities.',
    inputs: ['devPlanTrackerData'],
    outputs: [],
  },
  'dev-plan-timeline': {
    core: true,
    category: 'Development Plan',
    name: 'Plan Timeline',
    description: 'Plan Timeline',
    purpose: 'Visual timeline.',
    extendedDescription: 'A visual timeline showing the progression of the development plan.',
    inputs: ['devPlanTimeline'],
    outputs: [],
  },
  'dev-plan-details': {
    core: true,
    category: 'Development Plan',
    name: 'Plan Details',
    description: 'Plan Details',
    purpose: 'Detailed view.',
    extendedDescription: 'A detailed breakdown of the development plan structure and content.',
    inputs: ['devPlanDetails'],
    outputs: [],
  },
  'dev-plan-journey': {
    core: true,
    category: 'Development Plan',
    name: 'Development Journey',
    description: 'Full Journey Overview',
    purpose: 'Visual journey map.',
    extendedDescription: 'A comprehensive visual widget showing the entire development journey including Prep Phase, Development weeks, and Post Phase with dynamic progress tracking.',
    inputs: ['dailyPlan', 'currentPhase', 'userProgress'],
    outputs: [],
    componentPath: 'src/components/widgets/DevelopmentJourneyWidget.jsx',
  },
  'development-plan': {
    core: true,
    category: 'Development Plan',
    name: 'DP Weekly Plan',
    description: 'Development Plan',
    purpose: 'Weekly development plan.',
    extendedDescription: 'Displays the current week\'s focus, content, and reflection for the user\'s development plan.',
    inputs: ['currentWeek', 'userProgress'],
    outputs: ['handleItemToggle', 'handleReflectionUpdate'],
    componentPath: 'src/components/widgets/DevelopmentPlanWidget.jsx',
  },
  'course-library': {
    core: false,
    category: 'Learning',
    name: 'Course library',
    description: 'Course library',
    purpose: 'Quick access to learning modules.',
    extendedDescription: 'Displays a list of available courses with progress indicators and duration.',
    inputs: ['courses'],
    outputs: ['navigate'],
  },
  'reading-hub': {
    core: false,
    category: 'Learning',
    name: 'Reading hub',
    description: 'Reading hub',
    purpose: 'Digital bookshelf.',
    extendedDescription: 'Showcases recommended or current reading materials for leadership development.',
    inputs: ['readings'],
    outputs: ['navigate'],
  },
  'leadership-videos': {
    core: false,
    category: 'Learning',
    name: 'Leadership videos',
    description: 'Leadership videos',
    purpose: 'Curated video content.',
    extendedDescription: 'Features high-impact talks and lessons from thought leaders.',
    inputs: ['videos'],
    outputs: ['navigate'],
  },
  'strat-templates': {
    core: false,
    category: 'Resources',
    name: 'Strategic templates',
    description: 'Strategic templates',
    purpose: 'Downloadable resources.',
    extendedDescription: 'Provides quick access to common leadership templates like QBR decks, 1:1 agendas, and OKR sheets.',
    inputs: ['templates'],
    outputs: ['download'],
  },
  'community-feed': {
    core: false,
    category: 'Community',
    name: 'Community feed',
    description: 'Community feed',
    purpose: 'Social interaction.',
    extendedDescription: 'A stream of posts and discussions from the leadership community.',
    inputs: ['feedItems'],
    outputs: ['post', 'comment'],
  },
  'my-discussions': {
    core: false,
    category: 'Community',
    name: 'My discussions',
    description: 'My discussions',
    purpose: 'Personal thread tracking.',
    extendedDescription: 'Lists discussions the user is participating in or following.',
    inputs: ['userDiscussions'],
    outputs: ['navigate'],
  },
  'mastermind': {
    core: false,
    category: 'Community',
    name: 'Mastermind groups',
    description: 'Mastermind groups',
    purpose: 'Peer group connection.',
    extendedDescription: 'Facilitates joining or managing small peer accountability groups.',
    inputs: ['groups'],
    outputs: ['join', 'leave'],
  },
  'mentor-match': {
    core: false,
    category: 'Community',
    name: 'Mentor match',
    description: 'Mentor match',
    purpose: 'Professional guidance.',
    extendedDescription: 'Connects users with mentors for specific leadership challenges.',
    inputs: ['mentors'],
    outputs: ['request'],
  },
  'live-events': {
    core: false,
    category: 'Community',
    name: 'Live events',
    description: 'Live events',
    purpose: 'Event calendar.',
    extendedDescription: 'Lists upcoming webinars, workshops, and summits.',
    inputs: ['events'],
    outputs: ['register'],
  },
  'practice-history': {
    core: false,
    category: 'Tracking',
    name: 'Practice history',
    description: 'Practice history',
    purpose: 'Skill tracking.',
    extendedDescription: 'Shows a log of recently practiced scenarios and their scores.',
    inputs: ['practiceLog'],
    outputs: [],
  },
  'progress-analytics': {
    core: false,
    category: 'Tracking',
    name: 'Progress analytics',
    description: 'Progress analytics',
    purpose: 'Long-term growth visualization.',
    extendedDescription: 'A chart showing performance trends over time.',
    inputs: ['analyticsData'],
    outputs: [],
  },
  'ai-roleplay': {
    core: false,
    category: 'Practice',
    name: 'AI Roleplay',
    description: 'AI Roleplay',
    purpose: 'Simulated practice.',
    extendedDescription: 'Launches interactive AI roleplay sessions for skills like feedback or conflict resolution.',
    inputs: [],
    outputs: ['startSession'],
  },
  'scenario-sim': {
    core: false,
    category: 'Practice',
    name: 'Scenario simulation',
    description: 'Scenario simulation',
    purpose: 'Decision-making practice.',
    extendedDescription: 'Presents text-based scenarios to test strategic thinking and crisis management.',
    inputs: [],
    outputs: ['startSimulation'],
  },
  'feedback-gym': {
    core: false,
    category: 'Practice',
    name: 'Feedback gym',
    description: 'Feedback gym',
    purpose: 'Communication drills.',
    extendedDescription: 'Quick exercises to practice specific feedback models like Radical Candor or SBI.',
    inputs: [],
    outputs: ['startDrill'],
  },
  'roi-report': {
    core: false,
    category: 'Reporting',
    name: 'ROI Report',
    description: 'ROI Report',
    purpose: 'Value demonstration.',
    extendedDescription: 'Summarizes the impact of leadership development on team metrics.',
    inputs: ['roiData'],
    outputs: [],
  },
  // Coaching Hub Features
  'coaching-upcoming-sessions': {
    core: true,
    category: 'Coaching',
    name: 'Live Coaching Sessions',
    description: 'Upcoming Live Sessions',
    purpose: 'Live coaching session listings.',
    extendedDescription: 'Displays scheduled coaching sessions (Open Gym, Leader Circle, Workshops) that users can register for.',
    inputs: ['sessions', 'upcomingSessions', 'registeredIds', 'handleRegister', 'handleCancel'],
    outputs: ['register', 'cancel'],
    componentPath: 'src/components/widgets/CoachingUpcomingSessionsWidget.jsx',
  },
  'coaching-on-demand': {
    core: true,
    category: 'Coaching',
    name: 'On-Demand Coaching',
    description: 'On-Demand Practice',
    purpose: 'Self-paced coaching resources.',
    extendedDescription: 'AI roleplay scenarios and practice exercises available anytime.',
    inputs: ['scenarios', 'navigate'],
    outputs: ['startPractice'],
    componentPath: 'src/components/widgets/CoachingOnDemandWidget.jsx',
  },
  'coaching-my-sessions': {
    core: true,
    category: 'Coaching',
    name: 'My Coaching',
    description: 'My Coaching Sessions',
    purpose: 'Personal coaching dashboard.',
    extendedDescription: 'Shows sessions the user has registered for and their coaching history.',
    inputs: ['registeredSessions', 'pastSessions', 'handleCancel'],
    outputs: ['cancel', 'navigate'],
    componentPath: 'src/components/widgets/CoachingMySessionsWidget.jsx',
  },
  // Community Hub Features
  'community-upcoming-sessions': {
    core: true,
    category: 'Community',
    name: 'Community Events',
    description: 'Upcoming Community Events',
    purpose: 'Community event listings.',
    extendedDescription: 'Displays scheduled community events (Leader Circles, Networking) that users can register for.',
    inputs: ['sessions', 'upcomingSessions', 'registeredIds', 'handleRegister', 'handleCancel'],
    outputs: ['register', 'cancel'],
    componentPath: 'src/components/widgets/CommunityUpcomingSessionsWidget.jsx',
  },
  'community-my-registrations': {
    core: true,
    category: 'Community',
    name: 'My Community',
    description: 'My Community Events',
    purpose: 'Personal community dashboard.',
    extendedDescription: 'Shows community events the user has registered for.',
    inputs: ['registeredSessions', 'pastSessions', 'handleCancel'],
    outputs: ['cancel', 'navigate'],
    componentPath: 'src/components/widgets/CommunityMyRegistrationsWidget.jsx',
  },
};
