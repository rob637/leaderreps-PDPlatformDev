import { 
  Flame, Trophy, MessageSquare, Calendar, BookOpen, Play, Book, Video, FileText, Users, UserPlus, Search, Radio, History, BarChart2, Bot, Cpu, Dumbbell, TrendingUp, CheckCircle, Edit, Lightbulb, CheckSquare, X, Plus, Loader, Save, Bell, Target, Zap, Crosshair, Flag, MessageCircle, Heart, Sun, Moon
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
<div className="flex items-center gap-3 mb-4 mt-8">
  <Sun className="w-6 h-6 text-orange-500" />
  <h2 className="text-xl font-bold text-[#002E47]">AM Bookend: Start Strong</h2>
  <div className="h-px bg-slate-200 flex-1 ml-4"></div>
</div>
    `,
    'weekly-focus': `
<Card title="Weekly Focus" icon={Target} accent="INDIGO">
  <div className="space-y-3">
    <p className="text-sm text-slate-500">What is your primary theme for this week?</p>
    <textarea 
      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm font-medium"
      rows={2}
      placeholder="e.g. Team Alignment, Q4 Strategy..."
    />
  </div>
</Card>
    `,
    'grounding-rep': `
<Card title="Grounding Rep" icon={Zap} accent="YELLOW">
  <div className="flex items-start gap-4">
    <div className="p-3 bg-yellow-100 rounded-xl text-yellow-700">
      <Zap className="w-6 h-6" />
    </div>
    <div>
      <h3 className="font-bold text-slate-800">5-Minute Meditation</h3>
      <p className="text-xs text-slate-500 mb-3">Clear your mind before the day begins.</p>
      <button className="px-4 py-2 bg-[#002E47] text-white text-xs font-bold rounded-lg hover:bg-[#003E5F] transition-colors">
        Start Session
      </button>
    </div>
  </div>
</Card>
    `,
    'win-the-day': `
<Card title="Win the Day" icon={Trophy} accent="TEAL">
  <div className="space-y-4">
    <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">
      Identify 3 High-Impact Actions
    </p>
    
    {morningWins.map((win) => (
      <div key={win.id} className="flex gap-2 items-center">
        <div className="flex-1 relative">
          <input 
            type="text"
            value={win.text}
            onChange={(e) => handleUpdateWin(win.id, e.target.value)}
            placeholder={\`Priority #\${win.id}\`}
            disabled={win.saved}
            className={\`w-full p-3 pl-4 border rounded-xl outline-none transition-all text-sm font-medium \${
              win.saved 
                ? 'bg-slate-50 border-slate-200 text-slate-500' 
                : 'bg-white border-slate-200 focus:ring-2 focus:ring-teal-500'
            }\`}
          />
          {win.saved && (
            <CheckCircle className="w-4 h-4 text-green-500 absolute right-3 top-1/2 -translate-y-1/2" />
          )}
        </div>

        {!win.saved ? (
          <button 
            onClick={() => handleSaveSingleWin(win.id)}
            disabled={!win.text.trim()}
            className="p-3 bg-teal-50 text-teal-600 rounded-xl hover:bg-teal-100 disabled:opacity-50 transition-colors"
            title="Save Priority"
          >
            <Save className="w-5 h-5" />
          </button>
        ) : (
          <button 
            onClick={() => handleToggleWinComplete(win.id)}
            className={\`p-3 rounded-xl transition-colors \${
              win.completed 
                ? 'bg-green-500 text-white' 
                : 'bg-slate-100 text-slate-300 hover:bg-green-100 hover:text-green-600'
            }\`}
            title="Mark Complete"
          >
            <CheckSquare className="w-5 h-5" />
          </button>
        )}
      </div>
    ))}
  </div>
</Card>
    `,
    'daily-leader-reps': `
<Card title="Daily Leader Reps" icon={Dumbbell} accent="BLUE">
  <div className="space-y-2">
    {(developmentPlanData?.currentPlan?.weeklyReps || [
      { id: 'r1', label: 'Review Calendar', time: '2m' },
      { id: 'r2', label: 'Check Team Pulse', time: '5m' },
      { id: 'r3', label: 'Send 1 Appreciation', time: '3m' }
    ]).map(rep => (
      <div key={rep.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl hover:bg-blue-50 transition-colors cursor-pointer group">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 rounded border-2 border-slate-300 group-hover:border-blue-400 flex items-center justify-center">
            {/* Checkbox logic would go here */}
          </div>
          <span className="text-sm font-bold text-slate-700">{rep.label}</span>
        </div>
        <span className="text-xs font-bold text-slate-400 bg-white px-2 py-1 rounded border border-slate-200">
          {rep.time}
        </span>
      </div>
    ))}
  </div>
</Card>
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
<div className="flex items-center gap-3 mb-4 mt-8">
  <Moon className="w-6 h-6 text-indigo-500" />
  <h2 className="text-xl font-bold text-[#002E47]">PM Bookend: Finish Strong</h2>
  <div className="h-px bg-slate-200 flex-1 ml-4"></div>
</div>
    `,
    'progress-feedback': `
<Card title="Progress & Feedback" icon={TrendingUp} accent="GREEN">
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
<Card title="PM Reflection" icon={MessageSquare} accent="INDIGO">
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
        className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm"
        rows={1}
        placeholder="One word to describe today..."
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
<Card title="Today Scorecard" icon={Trophy} accent="YELLOW">
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-medium text-slate-700">I did my reps today</span>
        </div>
        <div className="text-right">
          <span className="font-bold text-xl text-[#002E47]">{scorecard.reps.done}</span>
          <span className="text-slate-400 text-sm"> / {scorecard.reps.total}</span>
          <span className={\`ml-2 text-sm font-bold \${
            scorecard.reps.pct === 100 ? 'text-green-500' : 'text-slate-400'
          }\`}>
            {scorecard.reps.pct}%
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-medium text-slate-700">I won the day</span>
        </div>
        <div className="text-right">
          <span className="font-bold text-xl text-[#002E47]">{scorecard.win.done}</span>
          <span className="text-slate-400 text-sm"> / {scorecard.win.total}</span>
          <span className={\`ml-2 text-sm font-bold \${
            scorecard.win.pct === 100 ? 'text-green-500' : 'text-slate-400'
          }\`}>
            {scorecard.win.pct}%
          </span>
        </div>
      </div>
    </div>

    <div className="mt-6 pt-6 border-t border-slate-100 flex justify-between items-center">
      <div className="flex items-center gap-2">
        <Flame className="w-5 h-5 text-orange-500" />
        <span className="font-bold text-xl text-[#002E47]">{streakCount}</span>
        <span className="text-xs text-slate-400 uppercase tracking-wider">Day Streak</span>
      </div>
      <button 
        onClick={() => handleSaveScorecard()}
        disabled={isSavingScorecard}
        className="text-xs font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1 disabled:opacity-50"
      >
        {isSavingScorecard ? <Loader className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
        Save to Locker
      </button>
    </div>
</Card>
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
<Card title="Featured Talk" icon={Video} accent="RED">
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
<Card title="Templates" icon={FileText} accent="BLUE">
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
<Card title="Community Feed" icon={MessageSquare} accent="INDIGO">
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
<Card title="My Discussions" icon={MessageCircle} accent="BLUE">
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
<Card title="Mastermind Groups" icon={Users} accent="PURPLE">
  <p className="text-gray-600 text-sm mb-4">Join a peer group of leaders at your level to share challenges and grow together.</p>
  <button className="w-full py-2 bg-indigo-600 text-white rounded-lg font-bold text-sm hover:bg-indigo-700 transition-colors">
    Find a Group
  </button>
</Card>
    `,
    'mentor-match': `
<Card title="Mentor Match" icon={UserPlus} accent="GREEN">
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
<Card title="Upcoming Events" icon={Calendar} accent="PINK">
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
<Card title="Growth Analytics" icon={BarChart2} accent="BLUE">
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
<Card title="AI Roleplay" icon={Bot} accent="PURPLE">
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
<Card title="ROI Report" icon={TrendingUp} accent="GREEN">
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
    'dev-plan-header-v2': `
<Card title="Development Plan" icon={Target} accent="TEAL">
  <div className="flex items-center justify-between mb-6">
    <div>
      <p className="text-gray-600">
        Cycle {cycle} • {summary.totalSkills} skills • {summary.progress}% complete
      </p>
    </div>
    <Button
      onClick={() => onEditPlan()}
      variant="nav-back"
      className="flex items-center gap-2"
    >
      <Edit size={16} />
      Quick Edit
    </Button>
  </div>
  <ProgressBar progress={summary.progress} color={COLORS.TEAL} />
</Card>
    `,
    'dev-plan-stats': `
<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
  <Card accent="BLUE">
    <div className="flex items-center gap-3">
      <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
        <Target size={24} />
      </div>
      <div>
        <div className="text-2xl font-bold text-[#002E47]">
          {summary.totalSkills}
        </div>
        <div className="text-sm text-gray-600">Total Skills</div>
      </div>
    </div>
  </Card>

  <Card accent="GREEN">
    <div className="flex items-center gap-3">
      <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center text-green-600">
        <TrendingUp size={24} />
      </div>
      <div>
        <div className="text-2xl font-bold text-[#002E47]">
          {summary.completedSkills}
        </div>
        <div className="text-sm text-gray-600">Completed</div>
      </div>
    </div>
  </Card>

  <Card accent="ORANGE">
    <div className="flex items-center gap-3">
      <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600">
        <Calendar size={24} />
      </div>
      <div>
        <div className="text-2xl font-bold text-[#002E47]">
          {summary.currentWeek || 0}
        </div>
        <div className="text-sm text-gray-600">Current Week</div>
      </div>
    </div>
  </Card>
</div>
    `,
    'dev-plan-actions-v3': `
<Card title="Actions" icon={Zap} accent="TEAL">
  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
    <Button
      onClick={() => setShowBreakdown(true)}
      variant="soft-teal"
      className="flex items-center justify-center gap-2"
    >
      <Target size={16} />
      View Progress Breakdown
    </Button>
    
    {onScan && (
      <Button
        onClick={onScan}
        variant="soft-teal"
        className="flex items-center justify-center gap-2"
      >
        <TrendingUp size={16} />
        Start Progress Scan
      </Button>
    )}
    
    {onTimeline && (
      <Button
        onClick={onTimeline}
        variant="nav-back"
        className="flex items-center justify-center gap-2"
      >
        <Calendar size={16} />
        View Timeline
      </Button>
    )}
    
    {onDetail && (
      <Button
        onClick={onDetail}
        variant="nav-back"
        className="flex items-center justify-center gap-2"
      >
        View Detailed Plan
      </Button>
    )}
  </div>
</Card>
    `,
    'dev-plan-focus-areas': `
<Card title="Focus Areas" icon={Crosshair} accent="PURPLE">
  <div className="space-y-3">
    {plan.focusAreas && plan.focusAreas.map((area, index) => (
      <div key={index} className="p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold mb-2" style={{ color: COLORS.NAVY }}>
          {area.name}
        </h3>
        <p className="text-sm text-gray-600 mb-2">
          {area.why}
        </p>
        <div className="text-xs text-gray-500">
          {area.reps?.length || 0} practice reps • {area.courses?.length || 0} courses
        </div>
      </div>
    ))}
  </div>
</Card>
    `,
    'dev-plan-goal': `
<Card title="Your Goal" icon={Flag} accent="YELLOW">
  <p className="text-gray-700">{plan.openEndedAnswer}</p>
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
  };

export const FEATURE_METADATA = {
  'am-bookend-header': { core: true, category: 'Planning', description: 'AM Bookend Header' },
  'weekly-focus': { core: true, category: 'Planning', description: 'Weekly Focus' },
  'grounding-rep': { core: true, category: 'Planning', description: 'Grounding Rep' },
  'win-the-day': { core: true, category: 'Planning', description: 'Morning planning' },
  'daily-leader-reps': { core: true, category: 'Planning', description: 'Daily Leader Reps' },
  'notifications': { core: true, category: 'General', description: 'Notifications' },
  'pm-bookend-header': { core: true, category: 'Reflection', description: 'PM Bookend Header' },
  'progress-feedback': { core: true, category: 'Tracking', description: 'Progress Feedback' },
  'pm-bookend': { core: true, category: 'Reflection', description: 'Evening reflection' },
  'scorecard': { core: true, category: 'Tracking', description: 'Daily habit scorecard' },
  'daily-quote': { core: true, category: 'Inspiration', description: 'Daily quote' },
  'welcome-message': { core: true, category: 'General', description: 'Welcome message' },
  'dev-plan-header-v2': { core: true, category: 'Development', description: 'Development Plan Header' },
  'dev-plan-stats': { core: true, category: 'Development', description: 'Development Plan Stats' },
  'dev-plan-actions-v3': { core: true, category: 'Development', description: 'Development Plan Actions' },
  'dev-plan-focus-areas': { core: true, category: 'Development', description: 'Development Plan Focus Areas' },
  'dev-plan-goal': { core: true, category: 'Development', description: 'Development Plan Goal' },
  'course-library': { core: false, category: 'Learning', description: 'Course library' },
  'reading-hub': { core: false, category: 'Learning', description: 'Reading hub' },
  'leadership-videos': { core: false, category: 'Learning', description: 'Leadership videos' },
  'strat-templates': { core: false, category: 'Resources', description: 'Strategic templates' },
  'community-feed': { core: false, category: 'Community', description: 'Community feed' },
  'my-discussions': { core: false, category: 'Community', description: 'My discussions' },
  'mastermind': { core: false, category: 'Community', description: 'Mastermind groups' },
  'mentor-match': { core: false, category: 'Community', description: 'Mentor match' },
  'live-events': { core: false, category: 'Community', description: 'Live events' },
  'practice-history': { core: false, category: 'Tracking', description: 'Practice history' },
  'progress-analytics': { core: false, category: 'Tracking', description: 'Progress analytics' },
  'ai-roleplay': { core: false, category: 'Practice', description: 'AI Roleplay' },
  'scenario-sim': { core: false, category: 'Practice', description: 'Scenario simulation' },
  'feedback-gym': { core: false, category: 'Practice', description: 'Feedback gym' },
  'roi-report': { core: false, category: 'Reporting', description: 'ROI Report' },
};

