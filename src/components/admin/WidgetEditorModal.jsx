import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  X, Save, Play, Code, MessageSquare, Send, 
  Maximize2, Minimize2, RefreshCw, CheckCircle, AlertTriangle,
  Loader, Cpu, CheckSquare, Github, Trophy, Calendar, BookOpen, Flame,
  Target, TrendingUp, Edit, ArrowLeft, Video, FileText, Users, UserPlus,
  Radio, History, BarChart2, Bot, Dumbbell, Search, Plus, Terminal, Database, Layout,
  ChevronRight, ChevronDown
} from 'lucide-react';
import DynamicWidgetRenderer from './DynamicWidgetRenderer';
import { useWidgetEditor } from '../../providers/WidgetEditorProvider';
import { useFeatures } from '../../providers/FeatureProvider';
import { WIDGET_TEMPLATES } from '../../config/widgetTemplates';

const WidgetEditorModal = () => {
  const { isOpen, closeEditor, editorState } = useWidgetEditor();
  const { saveFeature, features } = useFeatures();
  const { widgetId, widgetName, scope, inputDescriptions, initialCode } = editorState;

  const [code, setCode] = useState('');
  const [outputLogs, setOutputLogs] = useState([]);

  // Reset state when opening a new widget
  useEffect(() => {
    if (isOpen) {
      setCode(initialCode || 'render(<div className="p-4 text-center text-gray-500">Widget content will appear here...</div>);');
      setOutputLogs([]);
    }
  }, [isOpen, initialCode, widgetName]);

  // Create a proxied scope to intercept function calls for the Output Console
  const proxiedScope = useMemo(() => {
    const proxy = { ...scope };
    
    // Helper to sanitize data for logging (remove circular refs and event objects)
    const sanitizeForLog = (data) => {
      if (!data) return data;
      if (Array.isArray(data)) {
        return data.map(item => {
          // Filter out React SyntheticEvents and DOM elements
          if (item && typeof item === 'object') {
            if (item.nativeEvent || item._reactName || item.target instanceof Element) {
              return '[Event Object]';
            }
            if (item instanceof Element) {
              return '[DOM Element]';
            }
          }
          return item;
        });
      }
      return data;
    };
    
    // Helper to log to our internal console
    const logToConsole = (type, message, data) => {
      setOutputLogs(prev => [...prev, { 
        id: Date.now(), 
        timestamp: new Date().toLocaleTimeString(), 
        type, 
        message, 
        data: sanitizeForLog(data)
      }]);
    };

    // Wrap functions
    Object.keys(scope).forEach(key => {
      if (typeof scope[key] === 'function') {
        // Skip React Components (convention: starts with uppercase)
        if (/^[A-Z]/.test(key)) return;

        // Skip noisy read-only functions to prevent render loops
        if (['isFeatureEnabled', 'getFeatureOrder'].includes(key)) return;

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

  const logsEndRef = useRef(null);

  useEffect(() => {
    if (logsEndRef.current) logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [outputLogs]);

  if (!isOpen) return null;

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

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset the code to the default template? Any unsaved changes will be lost.')) {
      const defaultCode = WIDGET_TEMPLATES[widgetId];
      if (defaultCode) {
        setCode(defaultCode);
      } else {
        setCode('render(<div className="p-4 text-center text-gray-500">No default template found for this widget.</div>);');
      }
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
              Widget Data Flow <span className="text-slate-500">|</span> <span className="text-teal-400">{widgetName}</span>
            </h2>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleReset} className="px-3 py-1.5 bg-red-600/20 text-red-400 hover:bg-red-600/40 rounded text-sm font-bold flex items-center gap-2 border border-red-900/50">
            <RefreshCw className="w-4 h-4" /> Reset
          </button>
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
        <div className="w-1/3 bg-[#0f172a] border-r border-slate-700 flex flex-col">
          <div className="p-2 bg-[#1e293b] border-b border-slate-700 flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
            <Database className="w-4 h-4 text-blue-400" /> Input Context (Scope)
          </div>
          <div className="flex-1 overflow-auto p-4 font-mono text-xs text-blue-200">
            {inputDescriptions && Object.keys(inputDescriptions).length > 0 ? (
              <div className="space-y-4">
                {Object.entries(inputDescriptions)
                  .filter(([category]) => category !== 'Output') // Filter out Output
                  .map(([category, items]) => (
                  <div key={category}>
                    <h3 className="text-teal-500 font-bold uppercase mb-2 border-b border-slate-700 pb-1">{category}</h3>
                    <div className="space-y-2">
                      {Object.entries(items).map(([key, desc]) => (
                        <div key={key} className="pl-2 border-l-2 border-slate-700 mb-4">
                          <div className="text-blue-300 font-bold text-sm mb-1">{key}</div>
                          <div className="text-slate-400 italic mb-2">{desc}</div>
                          {/* Show value - Start Collapsed (level 1) */}
                          <div className="bg-slate-800/50 p-2 rounded text-slate-300 overflow-hidden">
                             <ScopeViewer name={key} data={scope[key]} level={1} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <ScopeViewer data={scope} name="Scope" />
            )}
          </div>
        </div>

        {/* Center: Widget Preview */}
        <div className="flex-1 bg-slate-100 flex flex-col relative border-r border-slate-200">
          <div className="absolute top-0 left-0 right-0 p-2 bg-white border-b border-slate-200 flex items-center justify-center text-xs font-bold text-slate-400 uppercase tracking-wider z-10">
            Widget Preview
          </div>
          <div className="flex-1 overflow-auto p-8 flex items-center justify-center pt-12">
             <div className="w-full max-w-lg">
                <DynamicWidgetRenderer code={code} scope={proxiedScope} />
             </div>
          </div>
        </div>

        {/* Right: Output (Console) */}
        <div className="w-1/4 bg-[#0f172a] border-l border-slate-700 flex flex-col">
          <div className="p-2 bg-[#1e293b] border-b border-slate-700 flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
            <Terminal className="w-4 h-4 text-green-400" /> Output & Signals
          </div>
          <div className="flex-1 overflow-auto p-4 space-y-4 font-mono text-xs">
            
            {/* Static Output Descriptions */}
            {inputDescriptions && inputDescriptions['Output'] && (
              <div className="mb-6 border-b border-slate-700 pb-4">
                <h3 className="text-purple-400 font-bold uppercase mb-2">Expected Outputs</h3>
                <div className="space-y-3">
                  {Object.entries(inputDescriptions['Output']).map(([key, desc]) => (
                    <div key={key} className="pl-2 border-l-2 border-purple-900/50">
                      <div className="text-purple-300 font-bold text-sm">{key}</div>
                      <div className="text-slate-400 italic">{desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Dynamic Logs */}
            <div>
                <h3 className="text-green-500 font-bold uppercase mb-2">Live Signals</h3>
                {outputLogs.length === 0 && (
                <div className="text-slate-500 p-2 text-center border border-dashed border-slate-800 rounded">
                    <p className="text-slate-600">Interact with the widget to see function calls and events.</p>
                </div>
                )}
                <div className="space-y-2">
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
                            {(() => {
                              try {
                                return JSON.stringify(log.data, null, 2);
                              } catch (e) {
                                return `[Unable to serialize: ${e.message}]`;
                              }
                            })()}
                        </div>
                        )}
                    </div>
                    ))}
                    <div ref={logsEndRef} />
                </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

// Interactive Recursive Scope Viewer
const ScopeViewer = ({ data, name, level = 0 }) => {
  const [expanded, setExpanded] = useState(level < 1); // Default expand top level only

  if (data === null) return <div className="ml-4 text-slate-500">{name}: null</div>;
  if (data === undefined) return <div className="ml-4 text-slate-600">{name}: undefined</div>;
  
  if (typeof data === 'function') {
    return (
      <div className="ml-4 flex gap-2">
        <span className="text-blue-300 font-bold">{name}:</span>
        <span className="text-yellow-500 italic">ƒ()</span>
      </div>
    );
  }

  if (React.isValidElement(data)) {
    return (
      <div className="ml-4 flex gap-2">
        <span className="text-blue-300 font-bold">{name}:</span>
        <span className="text-yellow-600">&lt;ReactElement /&gt;</span>
      </div>
    );
  }

  if (typeof data === 'object') {
    const isArray = Array.isArray(data);
    const keys = Object.keys(data);
    const isEmpty = keys.length === 0;

    return (
      <div className="ml-2">
        <div 
          className="flex items-center gap-1 cursor-pointer hover:bg-slate-800/50 rounded px-1 select-none"
          onClick={() => setExpanded(!expanded)}
        >
          <span className="text-slate-500 w-4 text-center">{isEmpty ? '' : (expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />)}</span>
          <span className="text-blue-300 font-bold">{name}</span>
          <span className="text-slate-500 text-xs ml-1">
            {isArray ? `[${keys.length}]` : `{${keys.length}}`}
          </span>
        </div>
        
        {expanded && !isEmpty && (
          <div className="border-l border-slate-700/50 ml-3 pl-1">
            {keys.map(key => (
              <ScopeViewer key={key} name={key} data={data[key]} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    );
  }

  // Primitives
  let valueColor = 'text-green-300';
  if (typeof data === 'string') valueColor = 'text-orange-300';
  if (typeof data === 'number') valueColor = 'text-blue-300';
  if (typeof data === 'boolean') valueColor = 'text-purple-300';

  return (
    <div className="ml-4 flex gap-2 items-start">
      <span className="text-blue-300 font-bold shrink-0">{name}:</span>
      <span className={`${valueColor} break-all`}>
        {typeof data === 'string' ? `"${data}"` : String(data)}
      </span>
    </div>
  );
};

export default WidgetEditorModal;
