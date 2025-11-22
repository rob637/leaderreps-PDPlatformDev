import { 
  Flame, Trophy, MessageSquare, Calendar, BookOpen, Play, Book, Video, FileText, Users, UserPlus, Search, Radio, History, BarChart2, Bot, Cpu, Dumbbell, TrendingUp, CheckCircle, Edit, Lightbulb, CheckSquare, X, Plus, Loader, Save, Bell, Target, Zap, Crosshair, Flag, MessageCircle, Heart
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
    'win-the-day': `
<Card title="AM Bookend - Win the Day" icon={Trophy} accent="TEAL">
  <div className="space-y-6">
    {/* 1. Top Priority */}
    <div className="text-left">
      <label className="block text-xs font-bold text-slate-400 uppercase mb-2 text-left">
        1. Top Priority (The WIN)
      </label>
      <div className="flex gap-3">
        {amWinCompleted ? (
          <div className="flex-1 p-3 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
            <CheckSquare className="w-5 h-5 text-green-600" />
            <span className="font-bold text-green-900 line-through opacity-75">{morningWIN}</span>
          </div>
        ) : (
          <div className="flex-1 flex gap-2">
            <input 
              type="text"
              value={morningWIN}
              onChange={(e) => setMorningWIN(e.target.value)}
              placeholder="What is the ONE thing that must get done?"
              className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none transition-all font-medium"
              disabled={amWinCompleted}
            />
            {!amWinCompleted && morningWIN && (
                <button 
                  onClick={() => handleSaveWINWrapper()}
                  disabled={isSavingWIN || isWinSaved}
                  className={\`p-3 rounded-xl transition-colors disabled:opacity-50 \${
                    isWinSaved ? 'bg-green-500 text-white' : 'bg-teal-500 text-white hover:bg-teal-600'
                  }\`}
                  title="Save WIN"
                >
                  {isSavingWIN ? <Loader className="w-5 h-5 animate-spin" /> : 
                  isWinSaved ? <CheckSquare className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                </button>
            )}
          </div>
        )}
        
        {morningWIN && !isSavingWIN && (
          <button
            onClick={() => handleToggleWIN()}
            className={\`p-3 rounded-xl border-2 transition-colors \${
              amWinCompleted 
                ? 'bg-green-500 border-green-500 text-white' 
                : 'bg-white border-slate-200 text-slate-300 hover:border-green-400'
            }\`}
          >
            <CheckSquare className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>

    {/* 2 & 3. Next Most Important */}
    <div className="space-y-3 text-left">
      <div className="flex justify-between items-center">
        <label className="block text-xs font-bold text-slate-400 uppercase text-left">
          2 & 3. Next Most Important
        </label>
        {otherTasks.length > 0 && (
          <span className="text-xs text-green-600 font-medium flex items-center gap-1">
            <CheckSquare className="w-3 h-3" /> Auto-saved
          </span>
        )}
      </div>
      
      {otherTasks.map((task, idx) => (
        <div key={task.id || idx} className="flex items-center gap-3">
          <div className={\`flex-1 p-3 rounded-xl border \${
            task.completed ? 'bg-slate-50 border-slate-200' : 'bg-white border-slate-200'
          }\`}>
            <span className={\`font-medium \${task.completed ? 'line-through text-slate-400' : 'text-slate-700'}\`}>
              {task.text}
            </span>
          </div>
          <button
            onClick={() => handleToggleTask(task.id)}
            className={\`p-3 rounded-xl border-2 transition-colors \${
              task.completed
                ? 'bg-teal-500 border-teal-500 text-white' 
                : 'bg-white border-slate-200 text-slate-300 hover:border-teal-400'
            }\`}
          >
            <CheckSquare className="w-5 h-5" />
          </button>
          <button 
            onClick={() => handleRemoveTask(task.id)}
            className="p-3 text-slate-300 hover:text-red-400 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      ))}

      {otherTasks.length < 2 && (
        <div className="flex gap-2">
          <input 
            type="text"
            value={newTaskText}
            onChange={(e) => setNewTaskText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddOtherTask()}
            placeholder="Add another priority..."
            className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none transition-all text-sm"
          />
          <button 
            onClick={() => handleAddOtherTask()}
            disabled={!newTaskText.trim()}
            className="p-3 bg-slate-200 text-slate-600 rounded-xl hover:bg-teal-500 hover:text-white transition-colors disabled:opacity-50"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  </div>
</Card>
    `,
    'notifications': `
<Card title="Notifications" icon={Bell} accent="GRAY">
  <div className="space-y-3 text-left">
    
    {/* Dev Note */}
    <div className="bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-500 italic text-center">
      Waiting for inputs to be defined and built. (Mock Data)
    </div>

    <div className="flex gap-3 items-start p-2 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer">
      <div className="w-2 h-2 mt-2 rounded-full bg-orange-500 flex-shrink-0" />
      <div>
        <p className="text-sm font-semibold text-[#002E47]">Yesterday's "Needs Work"</p>
        <p className="text-xs text-slate-500">Review your reflection from yesterday.</p>
      </div>
    </div>
    <div className="flex gap-3 items-start p-2 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer">
      <div className="w-2 h-2 mt-2 rounded-full bg-teal-500 flex-shrink-0" />
      <div>
        <p className="text-sm font-semibold text-[#002E47]">Upcoming Feedback Practice</p>
        <p className="text-xs text-slate-500">Nov 29, 4:00 PM <span className="text-teal-600 font-bold ml-1">Register</span></p>
      </div>
    </div>
    <div className="flex gap-3 items-start p-2 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer">
      <div className="w-2 h-2 mt-2 rounded-full bg-purple-500 flex-shrink-0" />
      <div>
        <p className="text-sm font-semibold text-[#002E47]">New R&R Unlocked</p>
        <p className="text-xs text-slate-500">Check your resource library.</p>
      </div>
    </div>
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
    'pm-bookend': `
<Card title="PM Bookend - Reflection" icon={MessageSquare} accent="INDIGO">
  <div className="space-y-4">
    <div>
      <label className="block text-sm font-bold text-green-700 mb-2 text-left">
        What went well today?
      </label>
      <textarea 
        value={reflectionGood}
        onChange={(e) => setReflectionGood(e.target.value)}
        className="w-full p-3 bg-green-50 border border-green-100 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition-all text-sm"
        rows={2}
        placeholder="Celebrate a win..."
      />
    </div>

    <div>
      <label className="block text-sm font-bold text-orange-700 mb-2 text-left">
        What needs work?
      </label>
      <textarea 
        value={reflectionBetter}
        onChange={(e) => setReflectionBetter(e.target.value)}
        className="w-full p-3 bg-orange-50 border border-orange-100 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all text-sm"
        rows={2}
        placeholder="Identify an improvement..."
      />
    </div>

    <button 
      onClick={() => handleSaveEveningBookend()}
      disabled={isSavingBookend || (!reflectionGood && !reflectionBetter)}
      className="w-full py-3 bg-[#002E47] text-white rounded-xl font-bold hover:bg-[#003E5F] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
    >
      {isSavingBookend ? <Loader className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
      Save Journal Page
    </button>
    <p className="text-xs text-center text-slate-400">
      Saved to history in Locker
    </p>
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
    'dev-plan-header': `
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
    'dev-plan-actions-v2': `
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
        variant="soft-orange"
        className="flex items-center justify-center gap-2"
      >
        <Calendar size={16} />
        View Timeline
      </Button>
    )}
    
    {onDetail && (
      <Button
        onClick={onDetail}
        variant="soft-orange"
        className="flex items-center justify-center gap-2"
      >
        View Detailed Plan
      </Button>
    )}
  </div>
</Card>
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
    'dev-plan-actions': `
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
        variant="soft-orange"
        className="flex items-center justify-center gap-2"
      >
        <Calendar size={16} />
        View Timeline
      </Button>
    )}
    
    {onDetail && (
      <Button
        onClick={onDetail}
        variant="soft-orange"
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
    'win-the-day-v2': `
<Card title="AM Bookend - Win the Day" icon={Trophy} accent="TEAL">
  <div className="space-y-6">
    {/* 1. Top Priority */}
    <div className="text-left">
      <label className="block text-xs font-bold text-slate-400 uppercase mb-2 text-left">
        1. Top Priority (The WIN)
      </label>
      <div className="flex gap-3">
        {amWinCompleted ? (
          <div className="flex-1 p-3 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
            <CheckSquare className="w-5 h-5 text-green-600" />
            <span className="font-bold text-green-900 line-through opacity-75">{morningWIN}</span>
          </div>
        ) : (
          <div className="flex-1 flex gap-2">
            <input 
              type="text"
              value={morningWIN}
              onChange={(e) => setMorningWIN(e.target.value)}
              placeholder="What is the ONE thing that must get done?"
              className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none transition-all font-medium"
              disabled={amWinCompleted}
            />
            {!amWinCompleted && morningWIN && (
                <button 
                  onClick={() => handleSaveWINWrapper()}
                  disabled={isSavingWIN || isWinSaved}
                  className={\`p-3 rounded-xl transition-colors disabled:opacity-50 \${
                    isWinSaved ? 'bg-green-500 text-white' : 'bg-teal-500 text-white hover:bg-teal-600'
                  }\`}
                  title="Save WIN"
                >
                  {isSavingWIN ? <Loader className="w-5 h-5 animate-spin" /> : 
                  isWinSaved ? <CheckSquare className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                </button>
            )}
          </div>
        )}
        
        {morningWIN && !isSavingWIN && (
          <button
            onClick={() => handleToggleWIN()}
            className={\`p-3 rounded-xl border-2 transition-colors \${
              amWinCompleted 
                ? 'bg-green-500 border-green-500 text-white' 
                : 'bg-white border-slate-200 text-slate-300 hover:border-green-400'
            }\`}
          >
            <CheckSquare className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>

    {/* 2 & 3. Next Most Important */}
    <div className="space-y-3 text-left">
      <div className="flex justify-between items-center">
        <label className="block text-xs font-bold text-slate-400 uppercase text-left">
          2 & 3. Next Most Important
        </label>
        {otherTasks.length > 0 && (
          <span className="text-xs text-green-600 font-medium flex items-center gap-1">
            <CheckSquare className="w-3 h-3" /> Auto-saved
          </span>
        )}
      </div>
      
      {otherTasks.map((task, idx) => (
        <div key={task.id || idx} className="flex items-center gap-3">
          <div className={\`flex-1 p-3 rounded-xl border \${
            task.completed ? 'bg-slate-50 border-slate-200' : 'bg-white border-slate-200'
          }\`}>
            <span className={\`font-medium \${task.completed ? 'line-through text-slate-400' : 'text-slate-700'}\`}>
              {task.text}
            </span>
          </div>
          <button
            onClick={() => handleToggleTask(task.id)}
            className={\`p-3 rounded-xl border-2 transition-colors \${
              task.completed
                ? 'bg-teal-500 border-teal-500 text-white' 
                : 'bg-white border-slate-200 text-slate-300 hover:border-teal-400'
            }\`}
          >
            <CheckSquare className="w-5 h-5" />
          </button>
          <button 
            onClick={() => handleRemoveTask(task.id)}
            className="p-3 text-slate-300 hover:text-red-400 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      ))}

      {otherTasks.length < 2 && (
        <div className="flex gap-2">
          <input 
            type="text"
            value={newTaskText}
            onChange={(e) => setNewTaskText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddOtherTask()}
            placeholder="Add another priority..."
            className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none transition-all text-sm"
          />
          <button 
            onClick={() => handleAddOtherTask()}
            disabled={!newTaskText.trim()}
            className="p-3 bg-slate-200 text-slate-600 rounded-xl hover:bg-teal-500 hover:text-white transition-colors disabled:opacity-50"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  </div>
</Card>
    `,
    'notifications-v2': `
<Card title="Notifications" icon={Bell} accent="GRAY">
  <div className="space-y-3 text-left">
    
    {/* Dev Note */}
    <div className="bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-500 italic text-center">
      Waiting for inputs to be defined and built. (Mock Data)
    </div>

    <div className="flex gap-3 items-start p-2 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer">
      <div className="w-2 h-2 mt-2 rounded-full bg-orange-500 flex-shrink-0" />
      <div>
        <p className="text-sm font-semibold text-[#002E47]">Yesterday's "Needs Work"</p>
        <p className="text-xs text-slate-500">Review your reflection from yesterday.</p>
      </div>
    </div>
    <div className="flex gap-3 items-start p-2 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer">
      <div className="w-2 h-2 mt-2 rounded-full bg-teal-500 flex-shrink-0" />
      <div>
        <p className="text-sm font-semibold text-[#002E47]">Upcoming Feedback Practice</p>
        <p className="text-xs text-slate-500">Nov 29, 4:00 PM <span className="text-teal-600 font-bold ml-1">Register</span></p>
      </div>
    </div>
    <div className="flex gap-3 items-start p-2 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer">
      <div className="w-2 h-2 mt-2 rounded-full bg-purple-500 flex-shrink-0" />
      <div>
        <p className="text-sm font-semibold text-[#002E47]">New R&R Unlocked</p>
        <p className="text-xs text-slate-500">Check your resource library.</p>
      </div>
    </div>
  </div>
</Card>
    `,
    'scorecard-v2': `
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
    'pm-bookend-v2': `
<Card title="PM Bookend - Reflection" icon={MessageSquare} accent="INDIGO">
  <div className="space-y-4">
    <div>
      <label className="block text-sm font-bold text-green-700 mb-2 text-left">
        What went well today?
      </label>
      <textarea 
        value={reflectionGood}
        onChange={(e) => setReflectionGood(e.target.value)}
        className="w-full p-3 bg-green-50 border border-green-100 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition-all text-sm"
        rows={2}
        placeholder="Celebrate a win..."
      />
    </div>

    <div>
      <label className="block text-sm font-bold text-orange-700 mb-2 text-left">
        What needs work?
      </label>
      <textarea 
        value={reflectionBetter}
        onChange={(e) => setReflectionBetter(e.target.value)}
        className="w-full p-3 bg-orange-50 border border-orange-100 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all text-sm"
        rows={2}
        placeholder="Identify an improvement..."
      />
    </div>

    <button 
      onClick={() => handleSaveEveningBookend()}
      disabled={isSavingBookend || (!reflectionGood && !reflectionBetter)}
      className="w-full py-3 bg-[#002E47] text-white rounded-xl font-bold hover:bg-[#003E5F] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
    >
      {isSavingBookend ? <Loader className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
      Save Journal Page
    </button>
    <p className="text-xs text-center text-slate-400">
      Saved to history in Locker
    </p>
  </div>
</Card>
    `,
    'daily-quote-v2': `(() => {
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
    'welcome-message-v2': `
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
  'scorecard': { core: true, category: 'Tracking', description: 'Daily habit scorecard' },
  'scorecard-v2': { core: true, category: 'Tracking', description: 'Daily habit scorecard V2' },
  'pm-bookend': { core: true, category: 'Reflection', description: 'Evening reflection' },
  'pm-bookend-v2': { core: true, category: 'Reflection', description: 'Evening reflection V2' },
  'win-the-day-v2': { core: true, category: 'Planning', description: 'Morning planning V2' },
  'daily-quote': { core: true, category: 'Inspiration', description: 'Daily quote' },
  'daily-quote-v2': { core: true, category: 'Inspiration', description: 'Daily quote V2' },
  'welcome-message': { core: true, category: 'General', description: 'Welcome message' },
  'welcome-message-v2': { core: true, category: 'General', description: 'Welcome message V2' },
  'notifications-v2': { core: true, category: 'General', description: 'Notifications V2' },
  'dev-plan-header': { core: true, category: 'Development', description: 'Development Plan Header' },
  'dev-plan-header-v2': { core: true, category: 'Development', description: 'Development Plan Header V2' },
  'dev-plan-stats': { core: true, category: 'Development', description: 'Development Plan Stats' },
  'dev-plan-actions': { core: true, category: 'Development', description: 'Development Plan Actions' },
  'dev-plan-actions-v2': { core: true, category: 'Development', description: 'Development Plan Actions V2' },
  'dev-plan-actions-v3': { core: true, category: 'Development', description: 'Development Plan Actions V3' },
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

