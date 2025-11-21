import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  X, Save, Play, Code, MessageSquare, Send, 
  Maximize2, Minimize2, RefreshCw, CheckCircle, AlertTriangle,
  Loader, Cpu, CheckSquare, Github, Trophy, Calendar, BookOpen, Flame,
  Target, TrendingUp, Edit, ArrowLeft, Video, FileText, Users, UserPlus,
  Radio, History, BarChart2, Bot, Dumbbell, Search, Plus, Terminal, Database, Layout
} from 'lucide-react';
import DynamicWidgetRenderer from './DynamicWidgetRenderer';
import OpenAI from 'openai';
import Editor from '@monaco-editor/react';
import { useWidgetEditor } from '../../providers/WidgetEditorProvider';
import { useFeatures } from '../../providers/FeatureProvider';

// Initialize OpenAI Client safely
let openai;
try {
  if (import.meta.env.VITE_OPENAI_API_KEY) {
    openai = new OpenAI({
      apiKey: import.meta.env.VITE_OPENAI_API_KEY,
      dangerouslyAllowBrowser: true
    });
  }
} catch (e) {
  console.warn("OpenAI Client failed to initialize:", e);
}

const WidgetEditorModal = () => {
  const { isOpen, closeEditor, editorState } = useWidgetEditor();
  const { saveFeature, features } = useFeatures();
  const { widgetId, widgetName, scope, initialCode } = editorState;

  const [code, setCode] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [outputLogs, setOutputLogs] = useState([]);
  const [activeTab, setActiveTab] = useState('preview'); // preview | code

  // Reset state when opening a new widget
  useEffect(() => {
    if (isOpen) {
      setCode(initialCode || 'render(<div className="p-4 text-center text-gray-500">Widget content will appear here...</div>);');
      setChatHistory([{ role: 'system', content: `I am the Widget Architect. I can help you modify the "${widgetName}" widget. Describe what you want to change.` }]);
      setOutputLogs([]);
    }
  }, [isOpen, initialCode, widgetName]);

  // Create a proxied scope to intercept function calls for the Output Console
  const proxiedScope = useMemo(() => {
    const proxy = { ...scope };
    
    // Helper to log to our internal console
    const logToConsole = (type, message, data) => {
      setOutputLogs(prev => [...prev, { 
        id: Date.now(), 
        timestamp: new Date().toLocaleTimeString(), 
        type, 
        message, 
        data 
      }]);
    };

    // Wrap functions
    Object.keys(scope).forEach(key => {
      if (typeof scope[key] === 'function') {
        proxy[key] = (...args) => {
          logToConsole('function', `Called: ${key}`, args);
          try {
            const result = scope[key](...args);
            if (result instanceof Promise) {
              result.then(res => logToConsole('return', `${key} resolved`, res))
                    .catch(err => logToConsole('error', `${key} failed`, err));
            } else if (result !== undefined) {
              logToConsole('return', `${key} returned`, result);
            }
            return result;
          } catch (error) {
            logToConsole('error', `${key} threw error`, error);
            throw error;
          }
        };
      }
    });

    return proxy;
  }, [scope]);

  const chatEndRef = useRef(null);
  const logsEndRef = useRef(null);

  useEffect(() => {
    if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  useEffect(() => {
    if (logsEndRef.current) logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [outputLogs]);

  if (!isOpen) return null;

  console.log('WidgetEditorModal rendering. isOpen:', isOpen);

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;

    const newHistory = [...chatHistory, { role: 'user', content: chatInput }];
    setChatHistory(newHistory);
    const userRequest = chatInput;
    setChatInput('');
    setIsGenerating(true);

    try {
      if (!openai) throw new Error("OpenAI API Key is missing.");

      // Construct a context summary of the scope
      const scopeKeys = Object.keys(scope).join(', ');
      
      const completion = await openai.chat.completions.create({
        messages: [
          { 
            role: "system", 
            content: `You are an expert React developer building widgets.
            
            CONTEXT:
            - Available Scope Props: ${scopeKeys}
            - Icons: Lucide-React icons are available.
            - Components: Checkbox, Card, Button, ProgressBar, Badge, StatCard are available.
            
            CURRENT CODE:
            ${code}
            
            TASK:
            ${userRequest}
            
            OUTPUT:
            Return ONLY the raw React code. No markdown.
            IMPORTANT: You MUST call render(<YourComponent />) at the end to display the widget.
            Example:
            const Widget = () => { return <div>Hello</div> };
            render(<Widget />);` 
          },
          { role: "user", content: userRequest }
        ],
        model: "gpt-4o",
      });

      const aiResponse = completion.choices[0].message.content;
      const cleanCode = aiResponse.replace(/```jsx/g, '').replace(/```/g, '').trim();

      setChatHistory(prev => [...prev, { role: 'system', content: `Updated widget: "${userRequest}"` }]);
      setCode(cleanCode);
      setActiveTab('preview');

    } catch (error) {
      setChatHistory(prev => [...prev, { role: 'system', content: `Error: ${error.message}` }]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    try {
      // Merge with existing feature data to preserve other fields
      const currentFeature = features[widgetId] || {};
      await saveFeature(widgetId, {
        ...currentFeature,
        name: widgetName,
        code: code,
        // Ensure we don't lose group/order/enabled if they exist
        group: currentFeature.group || 'dashboard',
        order: currentFeature.order || 999,
        enabled: currentFeature.enabled !== undefined ? currentFeature.enabled : true
      });
      alert('Saved successfully!');
    } catch (error) {
      console.error('Failed to save:', error);
      alert('Failed to save widget.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[100] flex flex-col overflow-hidden">
      
      {/* Header */}
      <div className="bg-[#001E30] text-white p-3 flex justify-between items-center border-b border-slate-700 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-teal-500/20 rounded-lg">
            <Cpu className="w-5 h-5 text-teal-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2">
              Widget Architect <span className="text-slate-500">|</span> <span className="text-teal-400">{widgetName}</span>
            </h2>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleSave} className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 rounded text-sm font-bold flex items-center gap-2">
            <Save className="w-4 h-4" /> Save Changes
          </button>
          <button onClick={closeEditor} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Main Workspace (3 Columns) */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left: Input (Scope) */}
        <div className="w-1/4 bg-[#0f172a] border-r border-slate-700 flex flex-col">
          <div className="p-2 bg-[#1e293b] border-b border-slate-700 flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
            <Database className="w-4 h-4 text-blue-400" /> Input Context (Scope)
          </div>
          <div className="flex-1 overflow-auto p-4 font-mono text-xs text-blue-200">
            <ScopeViewer data={scope} />
          </div>
        </div>

        {/* Center: Widget Preview */}
        <div className="flex-1 bg-slate-100 flex flex-col relative">
          <div className="absolute top-2 right-2 z-10 flex gap-2">
             <button 
                onClick={() => setActiveTab('preview')}
                className={`px-3 py-1 rounded text-xs font-bold shadow-sm ${activeTab === 'preview' ? 'bg-white text-teal-700' : 'bg-slate-200 text-slate-500'}`}
              >
                Preview
              </button>
              <button 
                onClick={() => setActiveTab('code')}
                className={`px-3 py-1 rounded text-xs font-bold shadow-sm ${activeTab === 'code' ? 'bg-white text-blue-700' : 'bg-slate-200 text-slate-500'}`}
              >
                Code
              </button>
          </div>

          <div className="flex-1 overflow-auto p-8 flex items-center justify-center">
            {activeTab === 'preview' ? (
               <div className="w-full max-w-lg">
                  <DynamicWidgetRenderer code={code} scope={proxiedScope} />
               </div>
            ) : (
               <Editor
                 height="100%"
                 defaultLanguage="javascript"
                 theme="vs-dark"
                 value={code}
                 onChange={(value) => setCode(value || '')}
                 options={{
                   minimap: { enabled: false },
                   fontSize: 14,
                   wordWrap: 'on',
                   scrollBeyondLastLine: false,
                   automaticLayout: true
                 }}
               />
            )}
          </div>
        </div>

        {/* Right: Output (Console) */}
        <div className="w-1/4 bg-[#0f172a] border-l border-slate-700 flex flex-col">
          <div className="p-2 bg-[#1e293b] border-b border-slate-700 flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
            <Terminal className="w-4 h-4 text-green-400" /> Output Console
          </div>
          <div className="flex-1 overflow-auto p-2 space-y-2 font-mono text-xs">
            {outputLogs.length === 0 && (
              <div className="text-slate-600 italic p-2">Waiting for events...</div>
            )}
            {outputLogs.map((log) => (
              <div key={log.id} className="p-2 rounded bg-[#1e293b] border border-slate-700">
                <div className="flex justify-between text-slate-500 mb-1">
                  <span>{log.timestamp}</span>
                  <span className={`uppercase font-bold ${
                    log.type === 'error' ? 'text-red-400' : 
                    log.type === 'return' ? 'text-purple-400' : 'text-green-400'
                  }`}>{log.type}</span>
                </div>
                <div className="text-slate-300 font-bold">{log.message}</div>
                {log.data && log.data.length > 0 && (
                  <div className="mt-1 text-slate-400 overflow-x-auto whitespace-pre-wrap">
                    {JSON.stringify(log.data, null, 2)}
                  </div>
                )}
              </div>
            ))}
            <div ref={logsEndRef} />
          </div>
        </div>

      </div>

      {/* Bottom: AI Builder */}
      <div className="h-1/3 bg-white border-t border-slate-200 flex flex-col shrink-0">
        <div className="p-2 bg-slate-50 border-b border-slate-200 flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
          <Bot className="w-4 h-4 text-purple-500" /> AI Builder
        </div>
        <div className="flex-1 flex overflow-hidden">
           {/* Chat History */}
           <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
              {chatHistory.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
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
           
           {/* Input */}
           <div className="w-1/3 p-4 bg-white border-l border-slate-200 flex flex-col gap-2">
              <textarea
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
                placeholder="Describe changes (e.g., 'Make the background blue', 'Add a button that logs hello')..."
                className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none resize-none text-sm"
              />
              <button 
                onClick={handleSendMessage}
                disabled={!chatInput.trim() || isGenerating}
                className="w-full py-2 bg-purple-600 text-white rounded-lg font-bold hover:bg-purple-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" /> Generate
              </button>
           </div>
        </div>
      </div>

    </div>
  );
};

// Simple Recursive Scope Viewer with Depth Limit
const ScopeViewer = ({ data, level = 0 }) => {
  if (level === 0 && (!data || (typeof data === 'object' && Object.keys(data).length === 0))) {
      return <div className="text-slate-500 italic p-2">No inputs/scope available.</div>;
  }

  if (level > 3) return <span className="text-slate-600">...</span>;

  if (typeof data === 'function') {
    return <div className="text-purple-400">ƒ()</div>;
  }
  if (data === null) return <div className="text-slate-500">null</div>;
  if (data === undefined) return <div className="text-slate-600">undefined</div>;
  
  if (React.isValidElement(data)) return <div className="text-yellow-600">&lt;ReactElement /&gt;</div>;

  if (typeof data === 'object') {
    if (Array.isArray(data)) {
       return (
        <div className="pl-2 border-l border-slate-700/50">
          <div className="text-slate-500 text-[10px] mb-1">Array({data.length})</div>
          {data.slice(0, 10).map((item, idx) => (
            <div key={idx} className="my-1">
              <span className="text-slate-400">[{idx}]: </span>
              <ScopeViewer data={item} level={level + 1} />
            </div>
          ))}
          {data.length > 10 && <div className="text-slate-600">...more</div>}
        </div>
       );
    }

    return (
      <div className="pl-2 border-l border-slate-700/50">
        {Object.entries(data).slice(0, 20).map(([key, value]) => (
          <div key={key} className="my-1">
            <span className="text-blue-300">{key}: </span>
            <ScopeViewer data={value} level={level + 1} />
          </div>
        ))}
        {Object.keys(data).length > 20 && <div className="text-slate-600">...more keys</div>}
      </div>
    );
  }

  return <span className="text-green-300 break-all">{String(data)}</span>;
};

export default WidgetEditorModal;
