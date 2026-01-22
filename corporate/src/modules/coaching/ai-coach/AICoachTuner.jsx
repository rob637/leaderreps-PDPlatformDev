import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, Sparkles, Save, RotateCcw, 
  Play, Settings, Terminal, Cpu, Target, AlertCircle,
  CheckCircle, HelpCircle, Zap, BookOpen
} from 'lucide-react';
import { doc, getDoc, setDoc, collection, query, getDocs, orderBy } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { useAuth } from '../../../contexts/AuthContext';
import { db } from '../../../firebase';

/**
 * AICoachTuner - Configure & Test AI Leadership Coach
 * 
 * HOW TO USE:
 * 1. Customize the system prompt to define coach personality
 * 2. Adjust temperature for creativity vs consistency
 * 3. Test conversations in the simulator
 * 4. Save your configuration to use across the platform
 * 
 * GOAL FRAMEWORK INTEGRATION:
 * - Load goals from corporate_goals collection
 * - Inject goal context into AI conversations
 * - Provides personalized coaching based on user's actual goals
 * 
 * AI CONNECTION:
 * - Uses Firebase Functions Gemini proxy
 * - Falls back to demo mode if API unavailable
 */

const AICoachTuner = () => {
  const { user } = useAuth();
  const [systemPrompt, setSystemPrompt] = useState(
    "You are an expert executive coach. Your tone is supportive but challenging. You follow the Socratic method, asking questions to guide the user to their own insights rather than giving advice directly."
  );
  const [userQuery, setUserQuery] = useState("I'm struggling with a team member who isn't pulling their weight.");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [temperature, setTemperature] = useState(0.7);
  const [modelVersion, setModelVersion] = useState('gemini-pro');
  const [saveStatus, setSaveStatus] = useState('');
  
  // Goal Framework integration
  const [goals, setGoals] = useState([]);
  const [includeGoalsContext, setIncludeGoalsContext] = useState(true);
  const [loadingGoals, setLoadingGoals] = useState(false);
  const [aiConnected, setAiConnected] = useState(true);

  // Load saved config and goals
  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      
      // Load AI config
      try {
        const configDoc = await getDoc(doc(db, 'users', user.uid, 'settings', 'ai_coach'));
        if (configDoc.exists()) {
          const data = configDoc.data();
          if (data.systemPrompt) setSystemPrompt(data.systemPrompt);
          if (data.temperature) setTemperature(data.temperature);
          if (data.modelVersion) setModelVersion(data.modelVersion);
          if (data.includeGoalsContext !== undefined) setIncludeGoalsContext(data.includeGoalsContext);
        }
      } catch (err) {
        console.error("Error loading AI config:", err);
      }

      // Load goals
      setLoadingGoals(true);
      try {
        const goalsQuery = query(collection(db, 'corporate_goals'), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(goalsQuery);
        const goalsData = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        setGoals(goalsData);
      } catch (err) {
        console.error("Error loading goals:", err);
      } finally {
        setLoadingGoals(false);
      }
    };

    loadData();
  }, [user]);

  // Save configuration
  const handleSave = async () => {
    if (!user) return;
    
    try {
      await setDoc(doc(db, 'users', user.uid, 'settings', 'ai_coach'), {
        systemPrompt,
        temperature,
        modelVersion,
        includeGoalsContext,
        updatedAt: new Date().toISOString()
      });
      setSaveStatus('success');
      setTimeout(() => setSaveStatus(''), 3000);
    } catch (err) {
      console.error("Error saving config:", err);
      setSaveStatus('error');
    }
  };

  // Build context with goals
  const buildGoalContext = () => {
    if (!includeGoalsContext || goals.length === 0) return '';
    
    const activeGoals = goals.filter(g => g.status === 'active' || !g.status).slice(0, 3);
    if (activeGoals.length === 0) return '';

    return `\n\nCONTEXT - The user has these active leadership goals:\n${activeGoals.map(g => 
      `- ${g.title}: ${g.description || 'No description'} (${g.framework || 'Custom'} framework)`
    ).join('\n')}\n\nUse this context to provide more personalized coaching when relevant.`;
  };

  const handleTest = async () => {
    if (!userQuery.trim()) return;
    
    // Add user message
    const newMessages = [...messages, { role: 'user', content: userQuery }];
    setMessages(newMessages);
    setLoading(true);
    setUserQuery('');

    try {
      // Build full prompt with goal context
      const fullSystemPrompt = systemPrompt + buildGoalContext();
      
      // Try calling the Gemini proxy
      const functions = getFunctions();
      const geminiProxy = httpsCallable(functions, 'geminiProxy');
      
      const result = await geminiProxy({
        prompt: userQuery,
        systemPrompt: fullSystemPrompt,
        temperature: temperature,
        conversationHistory: messages.slice(-6) // Last 6 messages for context
      });

      if (result.data && result.data.response) {
        setMessages([...newMessages, { 
          role: 'assistant', 
          content: result.data.response, 
          meta: { temp: temperature, model: modelVersion, goalsIncluded: includeGoalsContext }
        }]);
        setAiConnected(true);
      } else {
        throw new Error('Invalid response');
      }
    } catch (err) {
      console.warn("Gemini proxy not available, using demo mode:", err.message);
      setAiConnected(false);
      
      // Fallback demo responses
      const responses = [
        "That sounds frustrating. What have you tried so far to address this?",
        "I hear you. When you say they aren't pulling their weight, what specific behaviors are you observing?",
        "It's tough when expectations aren't met. How clear have you been with them about the standard?",
        "Let's explore that. What is the impact of their performance on the rest of the team?"
      ];
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      
      setTimeout(() => {
        setMessages([...newMessages, { 
          role: 'assistant', 
          content: randomResponse, 
          meta: { temp: temperature, model: 'demo', goalsIncluded: includeGoalsContext }
        }]);
        setLoading(false);
      }, 1000);
      return;
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setMessages([]);
  };

  const handleReset = () => {
    setSystemPrompt("You are an expert executive coach. Your tone is supportive but challenging. You follow the Socratic method, asking questions to guide the user to their own insights rather than giving advice directly.");
    setTemperature(0.7);
    setMessages([]);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto h-[calc(100vh-64px)] flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-corporate-navy">AI Coach Logic</h1>
          <p className="text-slate-500 mt-1">Configure and test the personality of the AI Leadership Coach.</p>
        </div>
        <div className="flex gap-2">
            <button 
              onClick={handleReset}
              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 flex items-center gap-2 text-sm font-medium"
            >
                <RotateCcw className="w-4 h-4" /> Reset
            </button>
            <button 
              onClick={handleSave}
              className="px-4 py-2 bg-corporate-navy text-white rounded-lg hover:bg-slate-800 flex items-center gap-2 text-sm font-bold shadow-sm"
            >
                <Save className="w-4 h-4" /> 
                {saveStatus === 'success' ? 'Saved!' : 'Save Config'}
                {saveStatus === 'success' && <CheckCircle className="w-4 h-4" />}
            </button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-12 gap-6 min-h-0">
        
        {/* Configuration Panel */}
        <div className="col-span-5 flex flex-col gap-6 overflow-y-auto pr-2">
            
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2 mb-4 text-corporate-navy font-bold">
                    <Terminal className="w-5 h-5" />
                    <h2>System Prompt</h2>
                </div>
                <textarea 
                    value={systemPrompt}
                    onChange={(e) => setSystemPrompt(e.target.value)}
                    className="w-full h-64 p-4 rounded-lg border border-slate-200 text-sm font-mono text-slate-700 focus:ring-2 focus:ring-corporate-teal focus:border-transparent outline-none resize-none bg-slate-50/50"
                    placeholder="Enter the system instructions..."
                />
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                 <div className="flex items-center gap-2 mb-4 text-corporate-navy font-bold">
                    <Settings className="w-5 h-5" />
                    <h2>Model Settings</h2>
                </div>
                
                <div className="space-y-4">
                    <div>
                        <div className="flex justify-between mb-1">
                            <label className="text-sm font-medium text-slate-600">Temperature</label>
                            <span className="text-sm font-bold text-slate-800">{temperature}</span>
                        </div>
                        <input 
                            type="range" 
                            min="0" 
                            max="1" 
                            step="0.1" 
                            value={temperature}
                            onChange={(e) => setTemperature(parseFloat(e.target.value))}
                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                        />
                         <p className="text-xs text-slate-400 mt-1">Higher values make output more random, lower values more deterministic.</p>
                    </div>

                    <div className="pt-4 border-t border-slate-100">
                         <label className="text-sm font-medium text-slate-600 block mb-2">Model Version</label>
                         <select 
                            value={modelVersion}
                            onChange={(e) => setModelVersion(e.target.value)}
                            className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white"
                         >
                            <option value="gemini-pro">Gemini Pro (Current)</option>
                            <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                            <option value="gpt-4o">GPT-4o</option>
                         </select>
                    </div>
                </div>
            </div>

            {/* Goal Framework Integration */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2 mb-4 text-corporate-navy font-bold">
                    <Target className="w-5 h-5" />
                    <h2>Goal Context</h2>
                </div>
                
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <label className="text-sm font-medium text-slate-600">Include user goals</label>
                            <p className="text-xs text-slate-400">Inject active goals into AI context</p>
                        </div>
                        <button 
                            onClick={() => setIncludeGoalsContext(!includeGoalsContext)}
                            className={`relative w-12 h-6 rounded-full transition-colors ${
                                includeGoalsContext ? 'bg-corporate-teal' : 'bg-slate-300'
                            }`}
                        >
                            <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                                includeGoalsContext ? 'translate-x-7' : 'translate-x-1'
                            }`} />
                        </button>
                    </div>

                    {includeGoalsContext && (
                        <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                            <p className="text-xs font-bold text-slate-500 uppercase mb-2">Active Goals ({goals.filter(g => g.status === 'active' || !g.status).length})</p>
                            {loadingGoals ? (
                                <p className="text-xs text-slate-400">Loading goals...</p>
                            ) : goals.filter(g => g.status === 'active' || !g.status).length === 0 ? (
                                <p className="text-xs text-slate-400">No active goals. Create goals in Goal Frameworks to personalize coaching.</p>
                            ) : (
                                <ul className="space-y-1">
                                    {goals.filter(g => g.status === 'active' || !g.status).slice(0, 3).map(goal => (
                                        <li key={goal.id} className="text-xs text-slate-600 flex items-center gap-2">
                                            <span className="w-2 h-2 bg-corporate-teal rounded-full shrink-0" />
                                            {goal.title}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}

                    <div className="text-xs text-slate-400 flex items-start gap-2">
                        <HelpCircle size={14} className="shrink-0 mt-0.5" />
                        <p>When enabled, the AI coach will reference the user's goals to provide more relevant coaching advice.</p>
                    </div>
                </div>
            </div>

            {/* Connection Status */}
            <div className={`p-3 rounded-lg border flex items-center gap-2 text-sm ${
                aiConnected ? 'bg-green-50 border-green-200 text-green-700' : 'bg-amber-50 border-amber-200 text-amber-700'
            }`}>
                {aiConnected ? (
                    <>
                        <Zap size={16} />
                        <span>Connected to Gemini AI</span>
                    </>
                ) : (
                    <>
                        <AlertCircle size={16} />
                        <span>Demo mode - Configure Firebase Functions for live AI</span>
                    </>
                )}
            </div>
        </div>

        {/* Chat / Test Panel */}
        <div className="col-span-7 flex flex-col bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
             <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                <span className="font-bold text-slate-600 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    Simulator
                </span>
                <span className="text-xs font-mono text-slate-400">Tokens: ~420</span>
             </div>

             <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/30">
                {messages.length === 0 && (
                    <div className="text-center text-slate-400 mt-12">
                        <Cpu className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p>Detailed log of interaction will appear here.</p>
                    </div>
                )}

                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] rounded-xl p-4 text-sm ${
                            msg.role === 'user' 
                                ? 'bg-corporate-navy text-white rounded-br-none' 
                                : 'bg-white border border-slate-200 text-slate-700 rounded-bl-none shadow-sm'
                        }`}>
                            {msg.content}
                            {msg.meta && (
                              <div className="mt-2 text-[10px] opacity-50 border-t border-slate-200 pt-1 flex items-center gap-2">
                                <span>Temp: {msg.meta.temp}</span>
                                {msg.meta.model && <span>• {msg.meta.model}</span>}
                                {msg.meta.goalsIncluded && <span className="text-green-600">• Goals ✓</span>}
                              </div>
                            )}
                        </div>
                    </div>
                ))}
                
                {loading && (
                     <div className="flex justify-start">
                        <div className="bg-white border border-slate-200 rounded-xl rounded-bl-none p-4 shadow-sm">
                            <div className="flex gap-1">
                                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
                                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-100"></span>
                                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-200"></span>
                            </div>
                        </div>
                    </div>
                )}
             </div>

             <div className="p-4 bg-white border-t border-slate-200 flex gap-2">
                <input 
                    type="text" 
                    value={userQuery}
                    onChange={(e) => setUserQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleTest()}
                    placeholder="Type a user message to test..."
                    className="flex-1 border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                    disabled={loading}
                />
                <button 
                    onClick={handleTest}
                    disabled={loading || !userQuery.trim()}
                    className="bg-purple-600 text-white p-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <Play className="w-5 h-5 fill-current" />
                </button>
             </div>
        </div>

      </div>
    </div>
  );
};

export default AICoachTuner;
