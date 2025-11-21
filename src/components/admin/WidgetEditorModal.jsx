import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Save, Play, Code, MessageSquare, Send, 
  Maximize2, Minimize2, RefreshCw, CheckCircle, AlertTriangle,
  Loader, Cpu, CheckSquare, Github
} from 'lucide-react';
import { COLORS } from '../screens/dashboard/dashboardConstants';
import DynamicWidgetRenderer from './DynamicWidgetRenderer';
import OpenAI from 'openai';

// Initialize OpenAI Client safely
// Note: In production, this should be proxied through a backend to hide the key.
let openai;
try {
  if (import.meta.env.VITE_OPENAI_API_KEY) {
    openai = new OpenAI({
      apiKey: import.meta.env.VITE_OPENAI_API_KEY,
      dangerouslyAllowBrowser: true // Enabled for this internal admin tool prototype
    });
  }
} catch (e) {
  console.warn("OpenAI Client failed to initialize:", e);
}

// Mock Checkbox for preview scope
const Checkbox = ({ checked, onChange, label, subLabel, disabled }) => (
  <div 
    onClick={!disabled ? onChange : undefined}
    className={`flex items-start gap-3 p-3 rounded-xl border-2 transition-all cursor-pointer ${
      checked 
        ? 'bg-teal-50 border-teal-500' 
        : 'bg-white border-gray-200 hover:border-teal-300'
    } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
  >
    <div className={`mt-0.5 w-6 h-6 rounded-md flex items-center justify-center border-2 transition-colors ${
      checked ? 'bg-teal-500 border-teal-500' : 'bg-white border-gray-300'
    }`}>
      {checked && <CheckSquare className="w-4 h-4 text-white" />}
    </div>
    <div className="flex-1">
      <p className={`font-semibold ${checked ? 'text-teal-900' : 'text-gray-700'}`}>
        {label}
      </p>
      {subLabel && (
        <p className="text-xs text-gray-500 mt-0.5">{subLabel}</p>
      )}
    </div>
  </div>
);

const WidgetEditorModal = ({ isOpen, onClose, widgetId, widgetName, initialCode, onSave }) => {
  const [activeTab, setActiveTab] = useState('preview'); // preview | code
  const [code, setCode] = useState(initialCode || '<div className="p-4 text-center text-gray-500">Widget content will appear here...</div>');
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState([
    { role: 'system', content: `I am the Widget Architect. I can help you modify the "${widgetName}" widget. Describe what you want to change.` }
  ]);
  const [isDeploying, setIsDeploying] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [deploySuccess, setDeploySuccess] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Mock Scope Data
  const [mockState, setMockState] = useState({
    hasLIS: true,
    lisRead: false,
    dailyRepName: '',
    dailyRepCompleted: false,
    weeklyFocus: '',
    morningWIN: '',
    amWinCompleted: false,
    reflectionGood: '',
    reflectionBetter: '',
    newTaskText: '',
    otherTasks: [],
    additionalCommitments: []
  });

  const mockScope = {
    // State
    hasLIS: mockState.hasLIS,
    lisRead: mockState.lisRead,
    dailyRepName: mockState.dailyRepName,
    dailyRepCompleted: mockState.dailyRepCompleted,
    weeklyFocus: mockState.weeklyFocus,
    morningWIN: mockState.morningWIN,
    amWinCompleted: mockState.amWinCompleted,
    reflectionGood: mockState.reflectionGood,
    reflectionBetter: mockState.reflectionBetter,
    newTaskText: mockState.newTaskText,
    otherTasks: mockState.otherTasks,
    additionalCommitments: mockState.additionalCommitments,
    
    // Mock Data
    scorecard: {
      reps: { done: 0, total: 5, pct: 0 },
      win: { done: 0, total: 1, pct: 0 }
    },
    streakCount: 0,
    user: { displayName: 'User' },
    greeting: 'Hey, User.',
    dailyQuote: 'Your daily quote will appear here.',
    isSavingWIN: false,
    isWinSaved: false,
    isSavingBookend: false,

    // Functions
    handleHabitCheck: (key, val) => setMockState(prev => ({ ...prev, [key]: val })),
    setIsAnchorModalOpen: () => alert('Open Anchor Modal'),
    isFeatureEnabled: () => true,
    setIsCalendarModalOpen: () => alert('Open Calendar Modal'),
    navigate: (path) => alert(`Navigate to: ${path}`),
    handleToggleAdditionalRep: (id) => alert(`Toggle Rep: ${id}`),
    setMorningWIN: (val) => setMockState(prev => ({ ...prev, morningWIN: val })),
    handleSaveWINWrapper: () => {
      setMockState(prev => ({ ...prev, amWinCompleted: true }));
      alert('WIN Saved!');
    },
    handleToggleWIN: () => setMockState(prev => ({ ...prev, amWinCompleted: !prev.amWinCompleted })),
    handleToggleTask: (id) => {
      setMockState(prev => ({
        ...prev,
        otherTasks: prev.otherTasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t)
      }));
    },
    handleRemoveTask: (id) => {
      setMockState(prev => ({
        ...prev,
        otherTasks: prev.otherTasks.filter(t => t.id !== id)
      }));
    },
    setNewTaskText: (val) => setMockState(prev => ({ ...prev, newTaskText: val })),
    handleAddOtherTask: () => {
      if (!mockState.newTaskText) return;
      setMockState(prev => ({
        ...prev,
        otherTasks: [...prev.otherTasks, { id: Date.now(), text: prev.newTaskText, completed: false }],
        newTaskText: ''
      }));
    },
    setReflectionGood: (val) => setMockState(prev => ({ ...prev, reflectionGood: val })),
    setReflectionBetter: (val) => setMockState(prev => ({ ...prev, reflectionBetter: val })),
    handleSaveEveningBookend: () => alert('Evening Bookend Saved!'),

    // Components
    Checkbox
  };

  const chatEndRef = useRef(null);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory]);

  if (!isOpen) return null;

  const checkPassword = () => {
    const password = prompt("Enter password to authorize this action:");
    if (password === '7777') {
      return true;
    }
    alert("Incorrect password.");
    return false;
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;

    // Add user message
    const newHistory = [...chatHistory, { role: 'user', content: chatInput }];
    setChatHistory(newHistory);
    const userRequest = chatInput;
    setChatInput('');
    setIsGenerating(true);

    try {
      if (!openai) {
        throw new Error("OpenAI API Key is missing. Please check your environment configuration.");
      }

      const completion = await openai.chat.completions.create({
        messages: [
          { 
            role: "system", 
            content: `You are an expert React developer building widgets for a leadership development dashboard. 
            You are modifying an existing widget.
            
            CONTEXT:
            - You have access to 'lucide-react' icons (import as needed, but they are in scope).
            - You have access to 'COLORS' object.
            - You have access to a 'Checkbox' component.
            - The code must be a valid React component body (JSX) or a functional component definition.
            - If the current code is just JSX, keep it as JSX.
            
            CURRENT CODE:
            ${code}
            
            TASK:
            ${userRequest}
            
            OUTPUT FORMAT:
            Return ONLY the raw React code. Do not wrap in markdown code blocks. Do not include explanations.` 
          },
          { role: "user", content: userRequest }
        ],
        model: "gpt-4o",
      });

      const aiResponse = completion.choices[0].message.content;
      
      // Clean up response if it contains markdown
      const cleanCode = aiResponse.replace(/```jsx/g, '').replace(/```/g, '').trim();

      setChatHistory(prev => [...prev, { 
        role: 'system', 
        content: `I've updated the widget based on your request: "${userRequest}"` 
      }]);
      
      setCode(cleanCode);
      setActiveTab('preview'); // Switch to preview to see changes

    } catch (error) {
      console.error("AI Error:", error);
      setChatHistory(prev => [...prev, { 
        role: 'system', 
        content: `Error generating code: ${error.message}` 
      }]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!checkPassword()) return;
    setIsSavingDraft(true);
    setSaveSuccess(false);
    try {
      if (onSave) {
        await onSave(code);
      }
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error("Save Draft error:", error);
      alert("Failed to save draft.");
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handleDeploy = async () => {
    if (!checkPassword()) return;
    setIsDeploying(true);
    try {
      if (onSave) {
        await onSave(code);
      }
      setDeploySuccess(true);
      setTimeout(() => {
        onClose();
        setDeploySuccess(false);
      }, 1000);
    } catch (error) {
      console.error("Deploy error:", error);
      alert("Failed to save widget.");
    } finally {
      setIsDeploying(false);
    }
  };

  const handleSyncToGitHub = async () => {
    if (!checkPassword()) return;
    const token = localStorage.getItem('GITHUB_PAT') || prompt("Enter GitHub PAT (repo scope) to sync:");
    if (!token) return;
    localStorage.setItem('GITHUB_PAT', token);

    setIsSyncing(true);
    try {
      const owner = 'rob637';
      const repo = 'leaderreps-PDPlatformDev';
      const path = 'src/components/admin/FeatureManager.jsx';
      const branch = 'crazy-idea'; // Hardcoded for prototype

      // 1. Get current file SHA and content
      const getRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!getRes.ok) throw new Error('Failed to fetch file from GitHub');
      const getData = await getRes.json();
      const currentContent = atob(getData.content);

      // 2. Replace the specific widget template
      // Regex looks for: 'widget-id': `...`
      // We use a non-greedy match for the content inside backticks
      const regex = new RegExp(`('${widgetId}': \`)[\\s\\S]*?(\`,)`, 'g');
      
      // Check if widget exists in file
      if (!regex.test(currentContent)) {
        throw new Error(`Widget ID '${widgetId}' not found in FeatureManager.jsx templates.`);
      }

      const newContent = currentContent.replace(regex, `$1\n${code}\n$2`);

      // 3. Commit changes
      const putRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
        method: 'PUT',
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: `chore(widgets): update ${widgetName} template via Widget Lab`,
          content: btoa(newContent),
          sha: getData.sha,
          branch: branch
        })
      });

      if (!putRes.ok) throw new Error('Failed to commit to GitHub');

      alert(`Successfully synced ${widgetName} to GitHub branch: ${branch}`);

    } catch (error) {
      console.error("GitHub Sync Error:", error);
      alert(`Sync failed: ${error.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-7xl h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-700">
        
        {/* Header */}
        <div className="bg-[#002E47] text-white p-4 flex justify-between items-center border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-500/20 rounded-lg">
              <Cpu className="w-6 h-6 text-teal-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                Widget Lab: <span className="text-teal-400">{widgetName}</span>
              </h2>
              <p className="text-xs text-slate-400 font-mono">ID: {widgetId}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Left Column: Preview & Code */}
          <div className="flex-1 flex flex-col border-r border-slate-200 bg-slate-50">
            {/* Toolbar */}
            <div className="bg-white border-b border-slate-200 p-2 flex gap-2">
              <button 
                onClick={() => setActiveTab('preview')}
                className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors ${
                  activeTab === 'preview' 
                    ? 'bg-teal-50 text-teal-700 border border-teal-200' 
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Play className="w-4 h-4" /> Live Preview
              </button>
              <button 
                onClick={() => setActiveTab('code')}
                className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors ${
                  activeTab === 'code' 
                    ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Code className="w-4 h-4" /> Source Code
              </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-auto p-6 relative bg-slate-100">
              {activeTab === 'preview' ? (
                <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden min-h-[300px] relative p-4">
                  <DynamicWidgetRenderer code={code} scope={mockScope} />
                </div>
              ) : (
                <div className="h-full bg-[#1e1e1e] rounded-xl overflow-hidden shadow-inner border border-slate-800">
                  <textarea 
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full h-full bg-transparent text-green-400 font-mono text-sm p-4 resize-none focus:outline-none"
                    spellCheck="false"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Right Column: AI Architect */}
          <div className="w-[400px] flex flex-col bg-white">
            <div className="p-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-bold text-slate-700 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-purple-500" />
                AI Architect
              </h3>
              <p className="text-xs text-slate-500">Describe changes to inputs, logic, or UI.</p>
            </div>

            {/* Chat History */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
              {chatHistory.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                    msg.role === 'user' 
                      ? 'bg-[#002E47] text-white rounded-br-none' 
                      : 'bg-white border border-slate-200 text-slate-700 rounded-bl-none shadow-sm'
                  }`}>
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))}
              {isGenerating && (
                <div className="flex justify-start">
                  <div className="bg-white border border-slate-200 p-3 rounded-2xl rounded-bl-none shadow-sm flex items-center gap-2">
                    <Loader className="w-4 h-4 animate-spin text-purple-500" />
                    <span className="text-xs text-slate-500">Generating code...</span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-slate-200 bg-white">
              <div className="relative">
                <textarea
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
                  placeholder="Describe your changes..."
                  className="w-full p-3 pr-12 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-none text-sm"
                  rows={3}
                />
                <button 
                  onClick={handleSendMessage}
                  disabled={!chatInput.trim() || isGenerating}
                  className="absolute right-2 bottom-2 p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-white border-t border-slate-200 p-4 flex justify-between items-center">
          <div className="text-xs text-slate-400">
            Changes are staged locally until deployed.
          </div>
          <div className="flex gap-3">
            <button 
              onClick={handleSyncToGitHub}
              disabled={isSyncing}
              className="px-4 py-2 text-slate-500 font-bold hover:text-black hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-2"
              title="Push current code to GitHub repository"
            >
              {isSyncing ? <Loader className="w-4 h-4 animate-spin" /> : <Github className="w-4 h-4" />}
              Sync to Git
            </button>
            <button 
              onClick={onClose}
              className="px-4 py-2 text-slate-600 font-semibold hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleSaveDraft}
              disabled={isSavingDraft || isDeploying}
              className={`px-4 py-2 font-bold border rounded-lg transition-all flex items-center gap-2 ${
                saveSuccess 
                  ? 'bg-green-50 text-green-700 border-green-500' 
                  : 'text-[#002E47] border-[#002E47] hover:bg-slate-50'
              }`}
            >
              {isSavingDraft ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : saveSuccess ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {saveSuccess ? 'Draft Saved!' : 'Save Draft'}
            </button>
            <button 
              onClick={handleDeploy}
              disabled={isDeploying || isSavingDraft}
              className={`px-6 py-2 text-white font-bold rounded-lg hover:shadow-lg hover:scale-105 transition-all flex items-center gap-2 ${
                deploySuccess 
                  ? 'bg-green-600' 
                  : 'bg-gradient-to-r from-teal-600 to-teal-500'
              }`}
            >
              {isDeploying ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : deploySuccess ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              {deploySuccess ? 'Deployed!' : 'Save & Deploy to Dev'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default WidgetEditorModal;
