import { 
  Flame, Trophy, MessageSquare, Calendar, BookOpen, Play, Book, Video, FileText, Users, UserPlus, Search, Radio, History, BarChart2, Bot, Cpu, Dumbbell, TrendingUp, CheckCircle, Edit, Lightbulb, CheckSquare, X, Plus, Loader, Save, Bell, Target, Zap, Crosshair, Flag, MessageCircle, Heart, Sun, Moon, PenTool, Quote, User
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
<div className="flex items-center gap-3 mb-4 mt-8">
  <Sun className="w-6 h-6 text-orange-500" />
  <h2 className="text-xl font-bold text-[#002E47]">AM Bookend: Start Strong</h2>
  <div className="h-px bg-slate-200 flex-1 ml-4"></div>
</div>

</>
    `,
    'weekly-focus': `
(() => {
  const focus = (typeof developmentPlanData !== 'undefined' && developmentPlanData?.focus) 
    ? developmentPlanData.focus 
    : "Strategic Thinking";

  return (
    <Card title="Weekly Focus" icon={Target} accent="NAVY">
      <div className="p-2">
        <p className="text-lg font-medium text-slate-700">
          {focus}
        </p>
      </div>
    </Card>
  );
})()
    `,
    'lis-maker': `
<Card title="LIS Maker" icon={PenTool} accent="NAVY">
  <div className="space-y-4">
    <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
      <h4 className="font-bold text-purple-900 mb-2">Build Your Identity</h4>
      <p className="text-sm text-purple-800 mb-3">
        Your Leadership Identity Statement (LIS) anchors you in who you want to be.
      </p>
      <p className="text-xs text-purple-600 italic mb-2">
        Try this format: "I am a [Core Value] leader who [Action] to create [Impact]."
      </p>
    </div>

    <div>
      <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
        Your Statement
      </label>
      <textarea 
        value={identityStatement}
        onChange={(e) => setIdentityStatement(e.target.value)}
        className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-all text-sm min-h-[100px]"
        placeholder="I am a..."
      />
    </div>

    <button 
      onClick={() => handleSaveIdentity(identityStatement)}
      className="w-full py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
    >
      <Save className="w-4 h-4" />
      Save Identity
    </button>
  </div>
</Card>
    `,
    'grounding-rep': `
(() => {
  const hasLIS = identityStatement && identityStatement.trim().length > 0;

  return (
    <Card title="Grounding Rep" icon={Zap} accent="ORANGE">
      {hasLIS ? (
        <div className="p-6 bg-yellow-50 rounded-xl border border-yellow-100 text-center relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-yellow-400"></div>
          <Quote className="w-8 h-8 text-yellow-300 absolute top-4 left-4 opacity-50" />
          
          <p className="text-lg font-serif font-medium text-slate-800 relative z-10 italic">
            "{identityStatement}"
          </p>
          
          <div className="mt-4 flex justify-center">
             <button 
               className="text-xs font-bold text-yellow-700 hover:text-yellow-800 uppercase tracking-wider flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
               onClick={() => setIsAnchorModalOpen(true)}
             >
               Edit Statement
             </button>
          </div>
        </div>
      ) : (
        <div className="p-6 bg-slate-50 rounded-xl border border-slate-200 text-center border-dashed">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
            <User className="w-6 h-6" />
          </div>
          <h4 className="font-bold text-slate-700 mb-1">Who are you as a leader?</h4>
          <p className="text-sm text-slate-500 mb-4">
            You haven't defined your Leadership Identity Statement yet.
          </p>
          <button 
            className="px-4 py-2 bg-[#002E47] text-white rounded-lg text-sm font-bold hover:bg-[#003E5F] transition-colors"
            onClick={() => setIsAnchorModalOpen(true)}
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
<Card title="Win the Day" icon={Trophy} accent="TEAL">
  <div className="space-y-4">
    <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">
      Identify 3 High-Impact Actions
    </p>
    
    {morningWins.map((win, index) => {
      // [NUCLEAR] Log render
      // console.log(\`[NUCLEAR] Rendering Win \${index}: \`, win);
      return (
      <div key={win.id} className="flex gap-3 items-center">
        <button 
          onClick={() => handleToggleWinComplete(index)}
          className={\`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-colors \${
            win.completed 
              ? 'bg-green-500 text-white shadow-sm' 
              : 'bg-slate-50 text-slate-300 hover:bg-green-50 hover:text-green-500 border border-slate-200'
          }\`}
          title={win.completed ? "Mark Incomplete" : "Mark Complete"}
        >
          <CheckSquare className="w-6 h-6" />
        </button>

        <div className="flex-1">
          <input 
            type="text"
            value={win.text}
            onChange={(e) => {
                console.log('[NUCLEAR] Input Change:', index, e.target.value);
                handleUpdateWin(index, e.target.value);
            }}
            placeholder={\`Enter Priority #\${index + 1}\`}
            className={\`w-full p-3 border rounded-xl outline-none transition-all text-sm font-medium \${
              win.completed
                ? 'bg-slate-50 border-slate-200 text-slate-400 line-through' 
                : 'bg-white border-slate-200 focus:ring-2 focus:ring-teal-500 text-slate-700'
            }\`}
          />
        </div>
      </div>
    )})}
  </div>

</Card>
    `,
    'daily-leader-reps': `
(() => {
  // Default reps if no development plan exists
  const defaultReps = [
    { id: 'r1', label: 'Review Calendar' },
    { id: 'r2', label: 'Check Team Pulse' },
    { id: 'r3', label: 'Send 1 Appreciation' }
  ];
  
  // Safely access developmentPlanData
  const reps = (typeof developmentPlanData !== 'undefined' && developmentPlanData?.reps) 
    ? developmentPlanData.reps 
    : defaultReps;
  
  // Track completed state locally
  // additionalCommitments is an array of objects { id, status, text }
  const commitmentsList = Array.isArray(additionalCommitments) ? additionalCommitments : [];
  
  return (
    <Card title="Daily Reps" icon={Dumbbell} accent="NAVY">
      <div className="space-y-2">
        {reps.map(rep => {
          const commitment = commitmentsList.find(c => c.id === rep.id);
          const isCompleted = commitment?.status === 'Committed';
          
          return (
            <div 
              key={rep.id} 
              onClick={() => handleToggleAdditionalRep && handleToggleAdditionalRep(rep.id, isCompleted ? 'Committed' : 'Pending', rep.label)}
              className={\`flex items-center justify-between p-3 rounded-xl transition-colors cursor-pointer group \${
                isCompleted ? 'bg-green-50 border border-green-200' : 'bg-slate-50 hover:bg-blue-50'
              }\`}
            >
              <div className="flex items-center gap-3">
                <div className={\`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors \${
                  isCompleted 
                    ? 'bg-green-500 border-green-500' 
                    : 'border-slate-300 group-hover:border-blue-400'
                }\`}>
                  {isCompleted && <CheckCircle className="w-3 h-3 text-white" />}
                </div>
                <span className={\`text-sm font-bold \${isCompleted ? 'text-green-700 line-through' : 'text-slate-700'}\`}>
                  {rep.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>

    </Card>
  );
})()
    `,
    'notifications': `
<Card title="Notifications" icon={Bell} accent="GRAY">
  <div className="space-y-4">
    {/* Category 1: Yesterday's Needs Work */}
    <div className="flex gap-3 items-start p-3 bg-orange-50 rounded-xl border border-orange-100">
      <div className="mt-1">
        <div className="w-2 h-2 rounded-full bg-orange-500" />
      </div>
      <div>
        <p className="text-xs font-bold text-orange-800 uppercase mb-1">Reflection Insight</p>
        <p className="text-sm font-medium text-slate-800">
          You flagged "Active Listening" as needing work yesterday.
        </p>
        <button className="mt-2 text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1">
          View Resource <Play className="w-3 h-3" />
        </button>
      </div>
    </div>

    {/* Category 2: Upcoming Practice */}
    <div className="flex gap-3 items-start p-3 bg-teal-50 rounded-xl border border-teal-100">
      <div className="mt-1">
        <div className="w-2 h-2 rounded-full bg-teal-500" />
      </div>
      <div>
        <p className="text-xs font-bold text-teal-800 uppercase mb-1">Upcoming Practice</p>
        <p className="text-sm font-medium text-slate-800">
          "Difficult Conversations" workshop starts in 2 hours.
        </p>
      </div>
    </div>

    {/* Category 3: New Content */}
    <div className="flex gap-3 items-start p-3 bg-blue-50 rounded-xl border border-blue-100">
      <div className="mt-1">
        <div className="w-2 h-2 rounded-full bg-blue-500" />
      </div>
      <div>
        <p className="text-xs font-bold text-blue-800 uppercase mb-1">New Unlock</p>
        <p className="text-sm font-medium text-slate-800">
          Module 4: "Strategic Vision" is now available.
        </p>
      </div>
    </div>
  </div>

</Card>
    `,
    'pm-bookend-header': `
<>
<div className="flex items-center gap-3 mb-4 mt-8">
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
<Card title="PM Reflection" icon={MessageSquare} accent="NAVY">
  <div className="space-y-4">
    <div>
      <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
        1. What went well?
      </label>
      <textarea 
        value={reflectionGood}
        onChange={(e) => setReflectionGood(e.target.value)}
        className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm"
        rows={2}
        placeholder="Celebrate a win..."
      />
    </div>

    <div>
      <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
        2. What needs work?
      </label>
      <textarea 
        value={reflectionBetter}
        onChange={(e) => setReflectionBetter(e.target.value)}
        className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm"
        rows={2}
        placeholder="Identify an improvement..."
      />
    </div>

    <div>
      <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
        3. Closing thought
      </label>
      <textarea 
        value={reflectionBest}
        onChange={(e) => setReflectionBest(e.target.value)}
        className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm"
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
      Save Journal
    </button>
  </div>

</Card>
    `,
    'scorecard': `
(() => {
  const safeScorecard = typeof scorecard !== 'undefined' ? scorecard : { reps: { done: 0, total: 0, pct: 0 }, win: { done: 0, total: 0, pct: 0 } };
  const safeIsSaving = typeof isSavingScorecard !== 'undefined' ? isSavingScorecard : false;
  const safeStreak = typeof streakCount !== 'undefined' ? streakCount : 0;
  const safeHandleSave = typeof handleSaveScorecard !== 'undefined' ? handleSaveScorecard : () => {};

  return (
<Card title="Today Scorecard" icon={Trophy} accent="ORANGE">
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-medium text-slate-700">I did my reps today</span>
        </div>
        <div className="text-right">
          <span className="font-bold text-xl text-[#002E47]">{safeScorecard.reps.done}</span>
          <span className="text-slate-400 text-sm"> / {safeScorecard.reps.total}</span>
          <span className={\`ml-2 text-sm font-bold \${
            safeScorecard.reps.pct === 100 ? 'text-green-500' : 'text-slate-400'
          }\`}>
            {safeScorecard.reps.pct}%
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-medium text-slate-700">I won the day</span>
        </div>
        <div className="text-right">
          <span className="font-bold text-xl text-[#002E47]">{safeScorecard.win.done}</span>
          <span className="text-slate-400 text-sm"> / {safeScorecard.win.total}</span>
          <span className={\`ml-2 text-sm font-bold \${
            safeScorecard.win.pct === 100 ? 'text-green-500' : 'text-slate-400'
          }\`}>
            {safeScorecard.win.pct}%
          </span>
        </div>
      </div>
    </div>

    <div className="mt-6 pt-6 border-t border-slate-100 flex justify-between items-center">
      <div className="flex items-center gap-2">
        <Flame className="w-5 h-5 text-orange-500" />
        <span className="font-bold text-xl text-[#002E47]">{safeStreak}</span>
        <span className="text-xs text-slate-400 uppercase tracking-wider">Day Streak</span>
      </div>
      <div className="text-xs text-slate-400 italic flex items-center gap-1">
        <CheckCircle className="w-3 h-3" />
        Auto-saves at 11:59 PM
      </div>
    </div>

</Card>
  );
})()
    `,
    'course-library': `
<Card title="Course Library" icon={BookOpen} accent="TEAL">
  <div className="space-y-3">
    <div className="flex gap-3 items-center p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors">
      <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center text-teal-600">
        <Play className="w-5 h-5" />
      </div>
      <div>
        <p className="text-sm font-bold text-gray-800">Strategic Thinking</p>
        <p className="text-xs text-gray-500">Module 3 • 15 mins</p>
      </div>
    </div>
    <div className="flex gap-3 items-center p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors">
      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600">
        <Play className="w-5 h-5" />
      </div>
      <div>
        <p className="text-sm font-bold text-gray-800">Team Dynamics</p>
        <p className="text-xs text-gray-500">Module 1 • 20 mins</p>
      </div>
    </div>
  </div>

</Card>
    `,
    'reading-hub': `
<Card title="Reading Hub" icon={Book} accent="ORANGE">
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
<Card title="Featured Talk" icon={Video} accent="ORANGE">
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
<Card title="Templates" icon={FileText} accent="NAVY">
  <div className="grid grid-cols-2 gap-2">
    <button className="p-3 bg-blue-50 hover:bg-blue-100 rounded-lg text-left transition-colors">
      <FileText className="w-5 h-5 text-blue-600 mb-2" />
      <p className="text-xs font-bold text-blue-900">QBR Deck</p>
    </button>
    <button className="p-3 bg-green-50 hover:bg-green-100 rounded-lg text-left transition-colors">
      <FileText className="w-5 h-5 text-green-600 mb-2" />
      <p className="text-xs font-bold text-green-900">1:1 Agenda</p>
    </button>
    <button className="p-3 bg-purple-50 hover:bg-purple-100 rounded-lg text-left transition-colors">
      <FileText className="w-5 h-5 text-purple-600 mb-2" />
      <p className="text-xs font-bold text-purple-900">OKRs Sheet</p>
    </button>
    <button className="p-3 bg-orange-50 hover:bg-orange-100 rounded-lg text-left transition-colors">
      <FileText className="w-5 h-5 text-orange-600 mb-2" />
      <p className="text-xs font-bold text-orange-900">Feedback Form</p>
    </button>
  </div>

</Card>
    `,
    'community-feed': `
<Card title="Community Feed" icon={MessageSquare} accent="NAVY">
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
        <p className="text-sm font-bold text-gray-800">Mike T. <span className="font-normal text-gray-500">replied to</span> Strategy</span></p>
        <p className="text-sm text-gray-600 mt-1">"The key is alignment on the north star metric..."</p>
      </div>
    </div>
  </div>

</Card>
    `,
    'my-discussions': `
<Card title="My Discussions" icon={MessageCircle} accent="NAVY">
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
<Card title="Mastermind Groups" icon={Users} accent="NAVY">
  <p className="text-gray-600 text-sm mb-4">Join a peer group of leaders at your level to share challenges and grow together.</p>
  <button className="w-full py-2 bg-indigo-600 text-white rounded-lg font-bold text-sm hover:bg-indigo-700 transition-colors">
    Find a Group
  </button>

</Card>
    `,
    'mentor-match': `
<Card title="Mentor Match" icon={UserPlus} accent="TEAL">
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
  <div className="bg-purple-50 rounded-lg p-3 mb-3 border border-purple-100">
    <p className="text-xs font-bold text-purple-600 uppercase mb-1">Recommended</p>
    <p className="text-sm font-bold text-purple-900">Giving Constructive Feedback</p>
  </div>
  <button className="w-full py-2 bg-purple-600 text-white rounded-lg text-sm font-bold hover:bg-purple-700 transition-colors">
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
    {plan.focusAreas && plan.focusAreas.map((area, index) => (
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
<Card title="Your Goal" icon={Flag} accent="ORANGE">
  <p className="text-slate-700 italic border-l-4 border-corporate-orange pl-4 py-1">
    "{plan.openEndedAnswer}"
  </p>

</Card>
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

  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 1) User's Name
  const userName = user?.displayName || 'User';

  // 2) Local Date and Time
  const formattedDate = currentTime.toLocaleDateString(undefined, { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  const formattedTime = currentTime.toLocaleTimeString();

  // 3) Release Group (Placeholder)
  const releaseGroup = "Alpha Group"; // To be setup later

  // 4) Current Week of Plan (Placeholder)
  const currentWeek = "Week 1"; // To be setup later

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
          </div>
        </div>

        {/* Release Group */}
        <div className="flex items-center p-3 bg-slate-50 rounded-lg">
          <div className="p-2 bg-purple-100 rounded-full mr-3">
            <Settings className="w-5 h-5 text-purple-600" />
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
        <div className="flex flex-col items-center justify-center p-6 text-center space-y-4">
          <div className="p-3 bg-orange-100 rounded-full">
            <Bell className="w-8 h-8 text-orange-600" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900">Enable Notifications</h3>
            <p className="text-sm text-slate-600 mt-1">
              Get timely nudges for your AM/PM bookends and to seize the day.
            </p>
          </div>
          <button
            onClick={requestPermission}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition-colors"
          >
            Allow Notifications
          </button>
          {permission === 'denied' && (
            <p className="text-xs text-red-500">
              Notifications are blocked. Please enable them in your browser settings.
            </p>
          )}
        </div>
      </Card>
    );
  }

  return (
    <Card title="Daily Reminders" icon={Bell} accent="TEAL">
      <div className="space-y-4">
        {Object.values(reminders).map((reminder) => (
          <div key={reminder.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <p className={\`font-semibold \${reminder.enabled ? 'text-slate-900' : 'text-slate-400'}\`}>
                  {reminder.label}
                </p>
                {reminder.enabled && (
                  <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                    Active
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400" />
                <input
                  type="time"
                  value={reminder.time}
                  onChange={(e) => updateReminder(reminder.id, { time: e.target.value })}
                  disabled={!reminder.enabled}
                  className="bg-transparent border-none p-0 text-sm text-slate-600 focus:ring-0 cursor-pointer"
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
  const { 
    permission, 
    requestPermission, 
    sendTestNotification,
    isSupported 
  } = useNotifications();

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
    'locker-wins-history': `
(() => {
  const safeWinsList = typeof winsList !== 'undefined' ? winsList : [];
  
  // Group wins by date
  const groupedWins = {};
  safeWinsList.forEach(win => {
    // Normalize date string to avoid duplicates if formats vary slightly
    const dateKey = win.date || 'Unknown Date'; 
    if (!groupedWins[dateKey]) groupedWins[dateKey] = [];
    groupedWins[dateKey].push(win);
  });

  // Sort dates descending (newest first)
  const sortedDates = Object.keys(groupedWins).sort((a, b) => {
      if (a === 'Unknown Date') return 1;
      if (b === 'Unknown Date') return -1;
      return new Date(b) - new Date(a);
  });

  return (
    <Card title="AM Bookend (Wins History)" icon={Trophy} className="border-t-4 border-corporate-orange">
      <div className="overflow-x-auto border border-gray-300 rounded-sm">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-3 py-2 text-left font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap w-32">Date</th>
              <th className="border border-gray-300 px-3 py-2 text-left font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">Win #1</th>
              <th className="border border-gray-300 px-3 py-2 text-left font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">Win #2</th>
              <th className="border border-gray-300 px-3 py-2 text-left font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">Win #3</th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {sortedDates.length > 0 ? (
              sortedDates.map((date) => {
                const wins = groupedWins[date];
                // Ensure we have 3 slots, fill with empty if needed
                const slots = [wins[0], wins[1], wins[2]];
                
                return (
                  <tr key={date} className="hover:bg-blue-50 transition-colors">
                    <td className="border border-gray-300 px-3 py-2 whitespace-nowrap font-mono text-gray-600 font-bold">
                      {date}
                    </td>
                    {slots.map((win, i) => (
                      <td key={i} className="border border-gray-300 px-3 py-2">
                        {win ? (
                          <div className="flex items-start gap-2">
                            <div className={\`mt-0.5 w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 \${
                              win.completed ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-300'
                            }\`}>
                              {win.completed ? <CheckCircle className="w-3 h-3" /> : <div className="w-2 h-2 rounded-full bg-slate-300" />}
                            </div>
                            <span className={\`text-sm \${win.completed ? 'text-gray-900 font-medium' : 'text-gray-500'}\`}>
                              {win.text}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-300 text-xs italic">-</span>
                        )}
                      </td>
                    ))}
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="4" className="border border-gray-300 px-3 py-8 text-center text-gray-500 italic">
                  No wins recorded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
})()
    `,
    'locker-scorecard-history': `
(() => {
  const safeHistory = typeof commitmentHistory !== 'undefined' ? commitmentHistory : [];

  return (
    <Card title="Scorecard History" icon={Calendar} className="border-t-4 border-corporate-teal">
      <div className="overflow-x-auto border border-gray-300 rounded-sm">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-3 py-2 text-left font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">Date</th>
              <th className="border border-gray-300 px-3 py-2 text-left font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">Score</th>
              <th className="border border-gray-300 px-3 py-2 text-left font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {safeHistory.length > 0 ? (
              safeHistory.map((entry, index) => {
                // Parse score "X/Y"
                const [done, total] = (entry.score || "0/0").split('/').map(Number);
                const pct = total > 0 ? Math.round((done / total) * 100) : 0;
                const isPerfect = pct === 100;
                
                return (
                  <tr key={index} className="hover:bg-blue-50 transition-colors">
                    <td className="border border-gray-300 px-3 py-2 whitespace-nowrap font-mono text-gray-600">
                      {entry.date}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 whitespace-nowrap font-mono font-bold text-gray-900 text-center">
                      {entry.score} <span className="text-xs text-gray-400 font-normal ml-1">({pct}%)</span>
                    </td>
                    <td className="border border-gray-300 px-3 py-2 whitespace-nowrap text-center">
                      {isPerfect ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold">
                          <CheckCircle className="w-3 h-3" /> PERFECT
                        </span>
                      ) : pct > 0 ? (
                         <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">
                          IN PROGRESS
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 text-gray-500 text-xs font-bold">
                          NO ACTIVITY
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="3" className="border border-gray-300 px-3 py-8 text-center text-gray-500 italic">
                  No scorecard history available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
})()
    `,
    'locker-latest-reflection': `
(() => {
  const safeReflections = typeof reflectionHistory !== 'undefined' ? reflectionHistory : [];

  return (
    <Card title="Reflection History" icon={BookOpen} className="lg:col-span-2 border-t-4 border-corporate-navy">
      <div className="overflow-x-auto border border-gray-300 rounded-sm">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-3 py-2 text-left font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">Date</th>
              <th className="border border-gray-300 px-3 py-2 text-left font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">What Went Well</th>
              <th className="border border-gray-300 px-3 py-2 text-left font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">What Needs Work</th>
              <th className="border border-gray-300 px-3 py-2 text-left font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">Tomorrow's Focus</th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {safeReflections.length > 0 ? (
              safeReflections.map((log, index) => (
                <tr key={log.id || index} className="hover:bg-blue-50 transition-colors align-top">
                  <td className="border border-gray-300 px-3 py-2 whitespace-nowrap font-mono text-gray-600">
                    {new Date(log.date).toLocaleDateString(undefined, { month: 'numeric', day: 'numeric', year: '2-digit' })}
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-gray-800 min-w-[200px]">
                    {log.reflectionGood || '-'}
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-gray-800 min-w-[200px]">
                    {log.reflectionWork || '-'}
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-gray-800 min-w-[200px]">
                    {log.reflectionTomorrow || '-'}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="border border-gray-300 px-3 py-8 text-center text-gray-500 italic">
                  No reflection history found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
})()
    `,
    'development-plan': `
(() => {
  const { 
    currentWeek,
    userProgress,
    handleItemToggle,
    handleReflectionUpdate
  } = scope;

  if (!currentWeek) return null;

  const { 
    title, 
    focus, 
    phase, 
    description, 
    content = [], 
    community = [], 
    coaching = [],
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
          <h3 className="text-lg font-bold text-slate-800">{focus}</h3>
          <p className="text-sm text-slate-600">{description}</p>
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
  'am-bookend-header': { core: true, category: 'Planning', name: 'AM Bookend Header', description: 'AM Bookend Header', purpose: 'Visual separator for the Morning Routine.', extendedDescription: 'Marks the beginning of the AM Bookend section, signaling the start of the daily planning process.' },
  'weekly-focus': { core: true, category: 'Planning', name: 'Weekly Focus', description: 'Weekly Focus', purpose: 'Highlights the primary development goal for the week.', extendedDescription: 'Displays the active focus area from the user\'s Development Plan to keep it top-of-mind.' },
  'lis-maker': { core: true, category: 'Dashboard', name: 'LIS Maker', description: 'LIS Maker', purpose: 'Builds the Leadership Identity Statement.', extendedDescription: 'A guided tool to help the user craft and refine their Leadership Identity Statement (LIS).' },
  'grounding-rep': { core: true, category: 'Planning', name: 'Grounding Rep', description: 'Grounding Rep', purpose: 'Reconnects the leader with their core identity.', extendedDescription: 'Provides a quick link or display of the Leadership Identity Statement (LIS) to ground the user before starting their day.' },
  'win-the-day': { core: true, category: 'Planning', name: 'Win the Day', description: 'Win the Day', purpose: 'Sets daily priorities.', extendedDescription: 'Allows the user to define and track 3 high-impact actions for the day.' },
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
                  <p className={\`text-sm font-medium \${isCompleted ? 'text-slate-500' : 'text-slate-800'}\`}>
                    {item.label}
                  </p>
                  <p className="text-xs text-slate-500 capitalize">
                    {item.type.replace(/_/g, ' ')} • {item.required === false || item.optional ? 'Optional' : 'Required'}
                  </p>
                </div>

                {isCompleted && <CheckCircle className="w-5 h-5 text-green-500" />}
              </div>
            );
          })}
        </div>

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

  };

export const FEATURE_METADATA = {
  'locker-controller': { core: true, category: 'Locker', name: 'Controller', description: 'Locker Controller', purpose: 'Dashboard metadata.', extendedDescription: 'Displays current user, time, release group, and plan progress.' },
  'locker-reminders': { core: true, category: 'Locker', name: 'Reminders', description: 'Locker Reminders', purpose: 'Notification management.', extendedDescription: 'Allows the user to toggle and schedule daily reminders for key habits.' },
  'system-reminders-controller': { core: true, category: 'System', name: 'System Reminders', description: 'System Reminders Controller', purpose: 'Admin notification tools.', extendedDescription: 'Provides system status and test controls for the notification infrastructure.' },
  'locker-wins-history': { core: true, category: 'Locker', name: 'AM Bookend History', description: 'AM Bookend History', purpose: 'History of daily wins.', extendedDescription: 'Displays a spreadsheet-style history of AM Bookend wins and their completion status.' },
  'locker-scorecard-history': { core: true, category: 'Locker', name: 'Scorecard History', description: 'Scorecard History', purpose: 'History of daily scores.', extendedDescription: 'Displays a spreadsheet-style history of daily scorecard results.' },
  'locker-latest-reflection': { core: true, category: 'Locker', name: 'Reflection History', description: 'Reflection History', purpose: 'History of daily reflections.', extendedDescription: 'Displays a spreadsheet-style history of PM Bookend reflections.' },
  'am-bookend-header': { core: true, category: 'Planning', name: 'AM Bookend Header', description: 'AM Bookend Header', purpose: 'Visual separator for the Morning Routine.', extendedDescription: 'Marks the beginning of the AM Bookend section, signaling the start of the daily planning process.' },
  'weekly-focus': { core: true, category: 'Planning', name: 'Weekly Focus', description: 'Weekly Focus', purpose: 'Highlights the primary development goal for the week.', extendedDescription: 'Displays the active focus area from the user\'s Development Plan to keep it top-of-mind.' },
  'lis-maker': { core: true, category: 'Dashboard', name: 'LIS Maker', description: 'LIS Maker', purpose: 'Builds the Leadership Identity Statement.', extendedDescription: 'A guided tool to help the user craft and refine their Leadership Identity Statement (LIS).' },
  'grounding-rep': { core: true, category: 'Planning', name: 'Grounding Rep', description: 'Grounding Rep', purpose: 'Reconnects the leader with their core identity.', extendedDescription: 'Provides a quick link or display of the Leadership Identity Statement (LIS) to ground the user before starting their day.' },
  'win-the-day': { core: true, category: 'Planning', name: 'Win the Day', description: 'Win the Day', purpose: 'Sets daily priorities.', extendedDescription: 'Allows the user to define and track 3 high-impact actions for the day.' },
  'daily-leader-reps': { core: true, category: 'Planning', name: 'Daily Reps', description: 'Daily Reps', purpose: 'Tracks daily habits.', extendedDescription: 'A checklist of small, consistent actions (reps) that build leadership muscle over time.' },
  'notifications': { core: true, category: 'General', name: 'Notifications', description: 'Notifications', purpose: 'Centralized alerts and updates.', extendedDescription: 'Aggregates important information like reflection insights, upcoming practice sessions, and new content unlocks.' },
  'pm-bookend-header': { core: true, category: 'Reflection', name: 'PM Bookend Header', description: 'PM Bookend Header', purpose: 'Visual separator for the Evening Routine.', extendedDescription: 'Marks the beginning of the PM Bookend section, signaling the transition to reflection and closing the day.' },
  'progress-feedback': { core: true, category: 'Tracking', name: 'Progress Feedback', description: 'Progress Feedback', purpose: 'Visualizes weekly consistency.', extendedDescription: 'Shows a progress bar and grade based on the completion of daily planning and reflection tasks.' },
  'pm-bookend': { core: true, category: 'Reflection', name: 'Reflection', description: 'Reflection', purpose: 'Daily reflection journal.', extendedDescription: 'A structured form for reviewing the day, identifying wins and improvements, and setting a closing thought.' },
  'scorecard': { core: true, category: 'Tracking', name: 'Daily Progress', description: 'Daily Progress', purpose: 'Daily performance summary.', extendedDescription: 'Displays stats on completed reps and "Win the Day" tasks, along with the current streak count.' },
  'daily-quote': { core: true, category: 'Inspiration', name: 'Daily quote', description: 'Daily quote', purpose: 'Daily inspiration.', extendedDescription: 'Displays a rotating leadership quote to inspire the user.' },
  'welcome-message': { core: true, category: 'General', name: 'Welcome message', description: 'Welcome message', purpose: 'Personal greeting.', extendedDescription: 'Welcomes the user by name and sets a positive tone for the session.' },
  'dev-plan-header': { core: true, category: 'Development Plan', name: 'DP Header', description: 'Development Plan Header', purpose: 'Development Plan Overview.', extendedDescription: 'Shows the current cycle, total skills, and overall progress of the active Development Plan.' },
  'dev-plan-stats': { core: true, category: 'Development Plan', name: 'DP Stats', description: 'Development Plan Stats', purpose: 'Detailed progress metrics.', extendedDescription: 'Breaks down skills into total, completed, and current week focus.' },
  'dev-plan-actions': { core: true, category: 'Development Plan', name: 'DP Actions', description: 'Development Plan Actions', purpose: 'Plan management.', extendedDescription: 'Quick actions to view breakdowns, scan progress, or edit the plan.' },
  'dev-plan-focus-areas': { core: true, category: 'Development Plan', name: 'DP Focus Areas', description: 'Development Plan Focus Areas', purpose: 'Strategic priorities.', extendedDescription: 'Lists the specific areas the user is working on, including the "why" and associated resources.' },
  'dev-plan-goal': { core: true, category: 'Development Plan', name: 'DP Goal', description: 'Development Plan Goal', purpose: 'North Star.', extendedDescription: 'Displays the user\'s primary open-ended goal for the current development cycle.' },
  'development-plan': { core: true, category: 'Development Plan', name: 'DP Weekly Plan', description: 'Development Plan', purpose: 'Weekly development plan.', extendedDescription: 'Displays the current week\'s focus, content, and reflection for the user\'s development plan.' },
  'course-library': { core: false, category: 'Learning', name: 'Course library', description: 'Course library', purpose: 'Quick access to learning modules.', extendedDescription: 'Displays a list of available courses with progress indicators and duration.' },
  'reading-hub': { core: false, category: 'Learning', name: 'Reading hub', description: 'Reading hub', purpose: 'Digital bookshelf.', extendedDescription: 'Showcases recommended or current reading materials for leadership development.' },
  'leadership-videos': { core: false, category: 'Learning', name: 'Leadership videos', description: 'Leadership videos', purpose: 'Curated video content.', extendedDescription: 'Features high-impact talks and lessons from thought leaders.' },
  'strat-templates': { core: false, category: 'Resources', name: 'Strategic templates', description: 'Strategic templates', purpose: 'Downloadable resources.', extendedDescription: 'Provides quick access to common leadership templates like QBR decks, 1:1 agendas, and OKR sheets.' },
  'community-feed': { core: false, category: 'Community', name: 'Community feed', description: 'Community feed', purpose: 'Social interaction.', extendedDescription: 'A stream of posts and discussions from the leadership community.' },
  'my-discussions': { core: false, category: 'Community', name: 'My discussions', description: 'My discussions', purpose: 'Personal thread tracking.', extendedDescription: 'Lists discussions the user is participating in or following.' },
  'mastermind': { core: false, category: 'Community', name: 'Mastermind groups', description: 'Mastermind groups', purpose: 'Peer group connection.', extendedDescription: 'Facilitates joining or managing small peer accountability groups.' },
  'mentor-match': { core: false, category: 'Community', name: 'Mentor match', description: 'Mentor match', purpose: 'Professional guidance.', extendedDescription: 'Connects users with mentors for specific leadership challenges.' },
  'live-events': { core: false, category: 'Community', name: 'Live events', description: 'Live events', purpose: 'Event calendar.', extendedDescription: 'Lists upcoming webinars, workshops, and summits.' },
  'practice-history': { core: false, category: 'Tracking', name: 'Practice history', description: 'Practice history', purpose: 'Skill tracking.', extendedDescription: 'Shows a log of recently practiced scenarios and their scores.' },
  'progress-analytics': { core: false, category: 'Tracking', name: 'Progress analytics', description: 'Progress analytics', purpose: 'Long-term growth visualization.', extendedDescription: 'A chart showing performance trends over time.' },
  'ai-roleplay': { core: false, category: 'Practice', name: 'AI Roleplay', description: 'AI Roleplay', purpose: 'Simulated practice.', extendedDescription: 'Launches interactive AI roleplay sessions for skills like feedback or conflict resolution.' },
  'scenario-sim': { core: false, category: 'Practice', name: 'Scenario simulation', description: 'Scenario simulation', purpose: 'Decision-making practice.', extendedDescription: 'Presents text-based scenarios to test strategic thinking and crisis management.' },
  'feedback-gym': { core: false, category: 'Practice', name: 'Feedback gym', description: 'Feedback gym', purpose: 'Communication drills.', extendedDescription: 'Quick exercises to practice specific feedback models like Radical Candor or SBI.' },
  'roi-report': { core: false, category: 'Reporting', name: 'ROI Report', description: 'ROI Report', purpose: 'Value demonstration.', extendedDescription: 'Summarizes the impact of leadership development on team metrics.' },
};

