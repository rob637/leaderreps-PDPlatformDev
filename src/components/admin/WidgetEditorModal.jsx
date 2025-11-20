import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Save, Play, Code, MessageSquare, Send, 
  Maximize2, Minimize2, RefreshCw, CheckCircle, AlertTriangle,
  Loader, Cpu
} from 'lucide-react';
import { COLORS } from '../screens/dashboard/dashboardConstants';

const WidgetEditorModal = ({ isOpen, onClose, widgetId, widgetName, initialCode }) => {
  const [activeTab, setActiveTab] = useState('preview'); // preview | code
  const [code, setCode] = useState(initialCode || '// Widget code will appear here...');
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState([
    { role: 'system', content: `I am the Widget Architect. I can help you modify the "${widgetName}" widget. Describe what you want to change.` }
  ]);
  const [isDeploying, setIsDeploying] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const chatEndRef = useRef(null);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory]);

  if (!isOpen) return null;

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;

    // Add user message
    const newHistory = [...chatHistory, { role: 'user', content: chatInput }];
    setChatHistory(newHistory);
    setChatInput('');
    setIsGenerating(true);

    // Simulate AI response
    setTimeout(() => {
      setChatHistory(prev => [...prev, { 
        role: 'system', 
        content: `I understand you want to update the "${widgetName}" widget. \n\nBased on your request: "${chatInput}", I've updated the code structure to include those inputs and outputs.` 
      }]);
      setIsGenerating(false);
      // Simulate code update
      setCode(prev => prev + `\n// Updated based on: ${chatInput}\n// Added new input field...`);
    }, 1500);
  };

  const handleDeploy = () => {
    setIsDeploying(true);
    setTimeout(() => {
      setIsDeploying(false);
      alert('Widget deployed to DEV environment successfully!');
      onClose();
    }, 2000);
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
            <div className="flex-1 overflow-auto p-6 relative">
              {activeTab === 'preview' ? (
                <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden min-h-[300px] flex items-center justify-center relative">
                  {/* Mock Preview */}
                  <div className="text-center p-8">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Cpu className="w-8 h-8 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-700 mb-2">{widgetName}</h3>
                    <p className="text-slate-500 text-sm">Widget Preview Area</p>
                    <div className="mt-4 p-3 bg-yellow-50 text-yellow-800 text-xs rounded border border-yellow-200">
                      Interactive preview requires live component mounting.
                    </div>
                  </div>
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
              onClick={onClose}
              className="px-4 py-2 text-slate-600 font-semibold hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button 
              className="px-4 py-2 text-[#002E47] font-bold border border-[#002E47] rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2"
            >
              <Save className="w-4 h-4" /> Save Draft
            </button>
            <button 
              onClick={handleDeploy}
              disabled={isDeploying}
              className="px-6 py-2 bg-gradient-to-r from-teal-600 to-teal-500 text-white font-bold rounded-lg hover:shadow-lg hover:scale-105 transition-all flex items-center gap-2"
            >
              {isDeploying ? <Loader className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Save & Deploy to Dev
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default WidgetEditorModal;
