import React, { useState, useEffect, useRef } from 'react';
import { Target, CheckCircle, Save, Layout, ArrowRight, BrainCircuit, Send, Sparkles, RefreshCw, ChevronRight, MessageCircle, Lightbulb, AlertCircle, Copy, Check } from 'lucide-react';
import { collection, addDoc, getDocs, query, orderBy, where } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from '../../../firebase';

const FRAMEWORKS = [
  { id: 'smart', label: 'SMART Goals', color: 'blue', icon: Target },
  { id: 'woop', label: 'WOOP Method', color: 'purple', icon: Layout }
];

const GEMINI_ENDPOINT = 'https://us-central1-leaderreps-pdplatform.cloudfunctions.net/geminiProxy';

const GoalTemplates = () => {
  const auth = getAuth();
  const currentUser = auth.currentUser;
  
  const [activeTab, setActiveTab] = useState('smart');
  const [savedGoals, setSavedGoals] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // SMART Goal State
  const [smartGoal, setSmartGoal] = useState({
    specific: '',
    measurable: '',
    achievable: '',
    relevant: '',
    timeBound: '',
    summary: ''
  });
  
  // WOOP Goal State
  const [woopGoal, setWoopGoal] = useState({
    wish: '',
    outcome: '',
    obstacle: '',
    plan: ''
  });
  
  // AI Chat State
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [aiThinking, setAiThinking] = useState(false);
  const [showChat, setShowChat] = useState(true);
  const chatEndRef = useRef(null);
  
  // Copy feedback
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadSavedGoals();
    setChatMessages([{
      role: 'assistant',
      content: getWelcomeMessage(activeTab)
    }]);
  }, []);

  useEffect(() => {
    setChatMessages([{
      role: 'assistant', 
      content: getWelcomeMessage(activeTab)
    }]);
  }, [activeTab]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const getWelcomeMessage = (framework) => {
    if (framework === 'smart') {
      return `👋 Hi! I'm your Goal Coach. I'll help you create a powerful **SMART goal**.

Let's start simple: **What's something you want to achieve?** 

Don't worry about making it perfect yet - just tell me your goal in your own words, and I'll help you refine it step by step.`;
    } else {
      return `👋 Hi! I'm your Goal Coach. Let's use the **WOOP method** to make your wish a reality.

WOOP stands for Wish, Outcome, Obstacle, Plan - it's a science-backed technique that helps you achieve goals by mentally contrasting your desired future with present obstacles.

**What's a wish you'd like to fulfill?** Share something meaningful to you.`;
    }
  };

  const loadSavedGoals = async () => {
    if (!currentUser) return;
    try {
      const q = query(
        collection(db, 'corporate_goals'),
        where('userId', '==', currentUser.uid),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      setSavedGoals(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error('Error loading goals:', error);
    }
  };

  const callGemini = async (prompt, systemInstruction) => {
    try {
      const response = await fetch(GEMINI_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, systemInstruction })
      });
      const data = await response.json();
      if (data.success) {
        return data.text;
      }
      throw new Error(data.error || 'AI request failed');
    } catch (error) {
      console.error('Gemini error:', error);
      throw error;
    }
  };

  const getSystemInstruction = () => {
    if (activeTab === 'smart') {
      return `You are an expert goal-setting coach helping leaders create SMART goals. SMART stands for:
- Specific: Clear and well-defined
- Measurable: Quantifiable success criteria
- Achievable: Realistic with available resources
- Relevant: Aligned with broader objectives
- Time-bound: Has a clear deadline

Guide the user conversationally through creating a SMART goal. Ask clarifying questions, provide examples, and help them refine each component. Be encouraging but also challenge vague answers.

When the user has provided enough information for a component, acknowledge it and smoothly transition to the next one. Keep responses concise (2-3 paragraphs max).

If the user shares a complete goal, break it down into SMART components and suggest improvements.`;
    } else {
      return `You are an expert coach helping leaders use the WOOP method (Mental Contrasting with Implementation Intentions). WOOP stands for:
- Wish: A meaningful, challenging but feasible wish
- Outcome: The best result from fulfilling the wish (visualize it vividly)
- Obstacle: The main internal obstacle (thoughts, emotions, habits, beliefs)
- Plan: If-Then plan to overcome the obstacle

Guide the user conversationally through WOOP. For Wish, help them find something meaningful but achievable. For Outcome, help them imagine it vividly. For Obstacle, focus on INTERNAL obstacles (not external circumstances). For Plan, help create a specific If-Then statement.

Keep responses warm, encouraging, and concise. Use the science behind WOOP when relevant.`;
    }
  };

  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || aiThinking) return;

    const userMessage = chatInput.trim();
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setAiThinking(true);

    try {
      let context = '';
      if (activeTab === 'smart') {
        const filledParts = [];
        if (smartGoal.specific) filledParts.push(`Specific: ${smartGoal.specific}`);
        if (smartGoal.measurable) filledParts.push(`Measurable: ${smartGoal.measurable}`);
        if (smartGoal.achievable) filledParts.push(`Achievable: ${smartGoal.achievable}`);
        if (smartGoal.relevant) filledParts.push(`Relevant: ${smartGoal.relevant}`);
        if (smartGoal.timeBound) filledParts.push(`Time-bound: ${smartGoal.timeBound}`);
        if (filledParts.length > 0) {
          context = `\n\nCurrent SMART goal progress:\n${filledParts.join('\n')}`;
        }
      } else {
        const filledParts = [];
        if (woopGoal.wish) filledParts.push(`Wish: ${woopGoal.wish}`);
        if (woopGoal.outcome) filledParts.push(`Outcome: ${woopGoal.outcome}`);
        if (woopGoal.obstacle) filledParts.push(`Obstacle: ${woopGoal.obstacle}`);
        if (woopGoal.plan) filledParts.push(`Plan: ${woopGoal.plan}`);
        if (filledParts.length > 0) {
          context = `\n\nCurrent WOOP progress:\n${filledParts.join('\n')}`;
        }
      }

      const history = chatMessages.slice(-6).map(m => 
        `${m.role === 'user' ? 'User' : 'Coach'}: ${m.content}`
      ).join('\n\n');

      const prompt = `${history}\n\nUser: ${userMessage}${context}`;
      
      const response = await callGemini(prompt, getSystemInstruction());
      
      setChatMessages(prev => [...prev, { role: 'assistant', content: response }]);
      
    } catch (error) {
      setChatMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "I'm having trouble connecting right now. Please try again in a moment." 
      }]);
    } finally {
      setAiThinking(false);
    }
  };

  const handleSmartChange = (field, value) => {
    setSmartGoal(prev => ({ ...prev, [field]: value }));
  };

  const handleWoopChange = (field, value) => {
    setWoopGoal(prev => ({ ...prev, [field]: value }));
  };

  const generateSummary = async () => {
    if (activeTab === 'smart') {
      const { specific, measurable, achievable, relevant, timeBound } = smartGoal;
      if (!specific) {
        alert('Please fill in at least the Specific component.');
        return;
      }
      
      setLoading(true);
      try {
        const prompt = `Create a concise, one-sentence SMART goal summary from these components:
- Specific: ${specific || 'Not provided'}
- Measurable: ${measurable || 'Not provided'}
- Achievable: ${achievable || 'Not provided'}
- Relevant: ${relevant || 'Not provided'}
- Time-bound: ${timeBound || 'Not provided'}

Return ONLY the goal statement, no explanation.`;
        
        const summary = await callGemini(prompt, 'You are a goal-setting expert. Create clear, actionable goal statements.');
        setSmartGoal(prev => ({ ...prev, summary }));
      } catch (error) {
        console.error('Error generating summary:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const saveGoal = async () => {
    if (!currentUser) {
      alert('Please log in to save goals.');
      return;
    }

    const goalData = activeTab === 'smart' 
      ? { type: 'smart', ...smartGoal }
      : { type: 'woop', ...woopGoal };

    if (activeTab === 'smart' && !smartGoal.specific) {
      alert('Please fill in at least the Specific component.');
      return;
    }
    if (activeTab === 'woop' && !woopGoal.wish) {
      alert('Please fill in at least your Wish.');
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, 'corporate_goals'), {
        ...goalData,
        userId: currentUser.uid,
        userEmail: currentUser.email,
        createdAt: new Date().toISOString(),
        status: 'active'
      });
      
      if (activeTab === 'smart') {
        setSmartGoal({ specific: '', measurable: '', achievable: '', relevant: '', timeBound: '', summary: '' });
      } else {
        setWoopGoal({ wish: '', outcome: '', obstacle: '', plan: '' });
      }
      
      loadSavedGoals();
      alert('Goal saved successfully!');
    } catch (error) {
      console.error('Error saving goal:', error);
      alert('Failed to save goal.');
    } finally {
      setLoading(false);
    }
  };

  const copyGoalToClipboard = () => {
    let text = '';
    if (activeTab === 'smart') {
      text = `SMART Goal:
Specific: ${smartGoal.specific}
Measurable: ${smartGoal.measurable}
Achievable: ${smartGoal.achievable}
Relevant: ${smartGoal.relevant}
Time-bound: ${smartGoal.timeBound}
${smartGoal.summary ? `\nSummary: ${smartGoal.summary}` : ''}`;
    } else {
      text = `WOOP Goal:
Wish: ${woopGoal.wish}
Outcome: ${woopGoal.outcome}
Obstacle: ${woopGoal.obstacle}
Plan: ${woopGoal.plan}`;
    }
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const askAIForHelp = (field) => {
    const fieldDescriptions = {
      specific: 'making my goal more specific and clear',
      measurable: 'defining how to measure success',
      achievable: 'determining if my goal is achievable',
      relevant: 'connecting my goal to my broader objectives',
      timeBound: 'setting an appropriate deadline',
      wish: 'clarifying my wish',
      outcome: 'visualizing the best outcome',
      obstacle: 'identifying my main internal obstacle',
      plan: 'creating an If-Then plan'
    };

    const helpMessage = `Can you help me with ${fieldDescriptions[field]}?`;
    setChatInput(helpMessage);
  };

  const getSmartProgress = () => {
    const fields = ['specific', 'measurable', 'achievable', 'relevant', 'timeBound'];
    const filled = fields.filter(f => smartGoal[f]?.trim()).length;
    return (filled / fields.length) * 100;
  };

  const getWoopProgress = () => {
    const fields = ['wish', 'outcome', 'obstacle', 'plan'];
    const filled = fields.filter(f => woopGoal[f]?.trim()).length;
    return (filled / fields.length) * 100;
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-corporate-navy flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-corporate-teal" />
            Goal Coach
          </h1>
          <p className="text-slate-500 mt-2">AI-powered goal setting using proven frameworks</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={copyGoalToClipboard}
            className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 flex items-center gap-2"
          >
            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied!' : 'Copy Goal'}
          </button>
          <button 
            onClick={saveGoal}
            disabled={loading}
            className="px-4 py-2 bg-corporate-teal text-white font-bold rounded-lg shadow-sm hover:bg-teal-700 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" /> Save Goal
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Sidebar */}
        <div className="col-span-3">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-slate-700 uppercase text-xs tracking-wider">
              Choose Framework
            </div>
            <div className="p-2">
              {FRAMEWORKS.map(fw => (
                <button
                  key={fw.id}
                  onClick={() => setActiveTab(fw.id)}
                  className={`w-full text-left px-4 py-3 rounded-lg flex items-center justify-between mb-1 transition-colors ${
                    activeTab === fw.id 
                      ? 'bg-corporate-navy/5 text-corporate-navy font-bold' 
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <fw.icon className="w-4 h-4" />
                    {fw.label}
                  </span>
                  {activeTab === fw.id && <ArrowRight className="w-4 h-4" />}
                </button>
              ))}
            </div>
          </div>

          {/* Progress Indicator */}
          <div className="mt-6 bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="font-bold text-slate-700 mb-3">Your Progress</h3>
            <div className="w-full bg-slate-100 rounded-full h-3 mb-2">
              <div 
                className="h-3 rounded-full bg-gradient-to-r from-corporate-teal to-corporate-navy transition-all duration-500"
                style={{ width: `${activeTab === 'smart' ? getSmartProgress() : getWoopProgress()}%` }}
              />
            </div>
            <p className="text-sm text-slate-500">
              {activeTab === 'smart' 
                ? `${Math.round(getSmartProgress())}% complete`
                : `${Math.round(getWoopProgress())}% complete`
              }
            </p>
          </div>

          {/* AI Toggle */}
          <div className="mt-6 bg-indigo-50 rounded-xl p-5 border border-indigo-100">
            <h3 className="font-bold text-indigo-900 flex items-center gap-2 mb-2">
              <BrainCircuit className="w-5 h-5" /> AI Coach
            </h3>
            <p className="text-sm text-indigo-800 leading-relaxed mb-3">
              Get personalized guidance to craft the perfect goal.
            </p>
            <button
              onClick={() => setShowChat(!showChat)}
              className={`w-full py-2 rounded-lg text-sm font-medium transition ${
                showChat 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-white text-indigo-600 border border-indigo-200'
              }`}
            >
              {showChat ? '✓ Coach Active' : 'Enable Coach'}
            </button>
          </div>

          {/* Saved Goals */}
          {savedGoals.length > 0 && (
            <div className="mt-6 bg-white rounded-xl border border-slate-200 p-5">
              <h3 className="font-bold text-slate-700 mb-3">Recent Goals</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {savedGoals.slice(0, 5).map(goal => (
                  <div key={goal.id} className="p-2 bg-slate-50 rounded-lg text-sm">
                    <span className={`text-xs font-bold uppercase ${goal.type === 'smart' ? 'text-blue-600' : 'text-purple-600'}`}>
                      {goal.type}
                    </span>
                    <p className="text-slate-600 truncate mt-1">
                      {goal.type === 'smart' ? goal.specific : goal.wish}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="col-span-9">
          <div className="grid grid-cols-2 gap-6">
            {/* Goal Form */}
            <div className="space-y-4">
              {activeTab === 'smart' && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-4 bg-blue-50 border-b border-blue-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Target className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h2 className="font-bold text-blue-900">S.M.A.R.T. Goal Builder</h2>
                        <p className="text-sm text-blue-700">Fill in each component</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 space-y-4">
                    {[
                      { key: 'specific', label: 'Specific', letter: 'S', hint: 'What exactly do you want to accomplish?' },
                      { key: 'measurable', label: 'Measurable', letter: 'M', hint: 'How will you measure success?' },
                      { key: 'achievable', label: 'Achievable', letter: 'A', hint: 'Is this realistic with your resources?' },
                      { key: 'relevant', label: 'Relevant', letter: 'R', hint: 'Why does this matter to you/your team?' },
                      { key: 'timeBound', label: 'Time-bound', letter: 'T', hint: 'What is your deadline?' }
                    ].map(item => (
                      <div key={item.key} className="group">
                        <div className="flex items-center justify-between mb-1">
                          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                            <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                              {item.letter}
                            </span>
                            {item.label}
                          </label>
                          <button 
                            onClick={() => askAIForHelp(item.key)}
                            className="text-xs text-blue-600 hover:text-blue-700 opacity-0 group-hover:opacity-100 transition flex items-center gap-1"
                          >
                            <Lightbulb className="w-3 h-3" /> Get help
                          </button>
                        </div>
                        <textarea
                          value={smartGoal[item.key]}
                          onChange={(e) => handleSmartChange(item.key, e.target.value)}
                          placeholder={item.hint}
                          rows={2}
                          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none"
                        />
                      </div>
                    ))}

                    {/* Summary Section */}
                    <div className="pt-4 border-t border-slate-100">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-slate-700">Goal Summary</label>
                        <button
                          onClick={generateSummary}
                          disabled={loading || !smartGoal.specific}
                          className="text-xs text-corporate-teal hover:text-teal-700 flex items-center gap-1 disabled:opacity-50"
                        >
                          <Sparkles className="w-3 h-3" /> Generate with AI
                        </button>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-lg min-h-[60px]">
                        {smartGoal.summary ? (
                          <p className="text-sm text-slate-700">{smartGoal.summary}</p>
                        ) : (
                          <p className="text-sm text-slate-400 italic">Fill in the components above, then generate a summary...</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'woop' && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-4 bg-purple-50 border-b border-purple-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        <Layout className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <h2 className="font-bold text-purple-900">W.O.O.P. Method</h2>
                        <p className="text-sm text-purple-700">Mental contrasting + implementation intentions</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 space-y-4">
                    {[
                      { key: 'wish', label: 'Wish', color: 'purple', hint: 'What is your most important wish?', icon: '✨' },
                      { key: 'outcome', label: 'Outcome', color: 'indigo', hint: 'What would be the best result? Visualize it vividly.', icon: '🎯' },
                      { key: 'obstacle', label: 'Obstacle', color: 'orange', hint: 'What internal obstacle might hold you back?', icon: '🧱' },
                      { key: 'plan', label: 'Plan', color: 'teal', hint: 'If [obstacle occurs], then I will [action]...', icon: '📋' }
                    ].map(item => (
                      <div key={item.key} className="group">
                        <div className="flex items-center justify-between mb-1">
                          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                            <span className="text-lg">{item.icon}</span>
                            {item.label}
                          </label>
                          <button 
                            onClick={() => askAIForHelp(item.key)}
                            className="text-xs text-purple-600 hover:text-purple-700 opacity-0 group-hover:opacity-100 transition flex items-center gap-1"
                          >
                            <Lightbulb className="w-3 h-3" /> Get help
                          </button>
                        </div>
                        <textarea
                          value={woopGoal[item.key]}
                          onChange={(e) => handleWoopChange(item.key, e.target.value)}
                          placeholder={item.hint}
                          rows={item.key === 'plan' ? 3 : 2}
                          className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-1 outline-none resize-none ${
                            item.key === 'obstacle' 
                              ? 'border-orange-200 focus:border-orange-500 focus:ring-orange-500 bg-orange-50/30'
                              : item.key === 'plan'
                              ? 'border-teal-200 focus:border-teal-500 focus:ring-teal-500 bg-teal-50/30'
                              : 'border-slate-200 focus:border-purple-500 focus:ring-purple-500'
                          }`}
                        />
                        {item.key === 'obstacle' && (
                          <p className="text-xs text-orange-600 mt-1 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            Focus on internal obstacles (habits, fears, beliefs) not external circumstances
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* AI Chat Panel */}
            {showChat && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[600px]">
                <div className="p-4 bg-gradient-to-r from-corporate-navy to-corporate-navy/90 text-white flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                      <MessageCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold">AI Goal Coach</h3>
                      <p className="text-xs text-white/70">Here to help you succeed</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setChatMessages([{ role: 'assistant', content: getWelcomeMessage(activeTab) }])}
                    className="p-2 hover:bg-white/10 rounded-lg transition"
                    title="Start over"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>

                {/* Chat Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
                  {chatMessages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                        msg.role === 'user'
                          ? 'bg-corporate-teal text-white rounded-br-md'
                          : 'bg-white border border-slate-200 text-slate-700 rounded-bl-md shadow-sm'
                      }`}>
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    </div>
                  ))}
                  {aiThinking && (
                    <div className="flex justify-start">
                      <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                        <div className="flex items-center gap-2 text-slate-400">
                          <div className="w-2 h-2 bg-corporate-teal rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <div className="w-2 h-2 bg-corporate-teal rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <div className="w-2 h-2 bg-corporate-teal rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Chat Input */}
                <form onSubmit={handleChatSubmit} className="p-4 border-t border-slate-200 bg-white">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Ask the coach anything..."
                      className="flex-1 px-4 py-2 border border-slate-200 rounded-full focus:border-corporate-teal focus:ring-1 focus:ring-corporate-teal outline-none text-sm"
                      disabled={aiThinking}
                    />
                    <button
                      type="submit"
                      disabled={!chatInput.trim() || aiThinking}
                      className="px-4 py-2 bg-corporate-teal text-white rounded-full hover:bg-teal-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {activeTab === 'smart' ? (
                      <>
                        <button type="button" onClick={() => setChatInput("What makes a goal specific?")} className="text-xs px-3 py-1 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-600">What's "specific"?</button>
                        <button type="button" onClick={() => setChatInput("Help me make this measurable")} className="text-xs px-3 py-1 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-600">Make it measurable</button>
                        <button type="button" onClick={() => setChatInput("Is my goal realistic?")} className="text-xs px-3 py-1 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-600">Is it achievable?</button>
                      </>
                    ) : (
                      <>
                        <button type="button" onClick={() => setChatInput("Help me find my true wish")} className="text-xs px-3 py-1 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-600">Find my wish</button>
                        <button type="button" onClick={() => setChatInput("What's an internal obstacle?")} className="text-xs px-3 py-1 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-600">Internal obstacles?</button>
                        <button type="button" onClick={() => setChatInput("Help me write an If-Then plan")} className="text-xs px-3 py-1 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-600">If-Then plan</button>
                      </>
                    )}
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GoalTemplates;
