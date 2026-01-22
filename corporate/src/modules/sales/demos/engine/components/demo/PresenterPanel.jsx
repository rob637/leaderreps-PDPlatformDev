import React from 'react';
import { MessageSquare, ChevronRight, ChevronDown, X } from 'lucide-react';

const PresenterPanel = ({ 
  isVisible, 
  isCollapsed, 
  notes, 
  onToggleCollapse, 
  onClose 
}) => {
  if (!isVisible || !notes) return null;

  return (
    <div className="fixed right-0 top-0 bottom-20 w-80 z-40">
      <div className="h-full bg-slate-900 text-white shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-amber-400" />
            <span className="font-semibold">Presenter Notes</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={onToggleCollapse}
              className="p-1.5 hover:bg-slate-700 rounded transition-colors"
            >
              {isCollapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-slate-700 rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        {!isCollapsed && (
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Key Message */}
            {notes.keyMessage && (
              <div className="bg-amber-500/20 border border-amber-500/30 rounded-lg p-3">
                <p className="text-xs text-amber-400 font-medium mb-1">KEY MESSAGE</p>
                <p className="text-sm text-amber-100">{notes.keyMessage}</p>
              </div>
            )}

            {/* Talking Points */}
            {notes.talkingPoints && (
              <div>
                <p className="text-xs text-slate-400 font-medium mb-2">TALKING POINTS</p>
                <ul className="space-y-2">
                  {notes.talkingPoints.map((point, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-slate-300">
                      <span className="text-primary-400 mt-0.5">•</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Timing */}
            {notes.timing && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-slate-400">⏱</span>
                <span className="text-slate-300">{notes.timing}</span>
              </div>
            )}

            {/* Demo Action */}
            {notes.demo && (
              <div className="bg-primary-500/20 border border-primary-500/30 rounded-lg p-3">
                <p className="text-xs text-primary-400 font-medium mb-1">DEMO ACTION</p>
                <p className="text-sm text-primary-100">{notes.demo.action}</p>
                {notes.demo.highlight && (
                  <p className="text-xs text-primary-300 mt-2">
                    💡 {notes.demo.highlight}
                  </p>
                )}
              </div>
            )}

            {/* Features to Highlight */}
            {notes.features && (
              <div>
                <p className="text-xs text-slate-400 font-medium mb-2">FEATURES TO HIGHLIGHT</p>
                <div className="space-y-2">
                  {notes.features.map((feature, idx) => (
                    <div key={idx} className="bg-slate-800 rounded-lg p-2">
                      <p className="text-sm font-medium text-white">{feature.name}</p>
                      <p className="text-xs text-slate-400">{feature.point}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Transition */}
            {notes.transition && (
              <div className="border-t border-slate-700 pt-4">
                <p className="text-xs text-slate-400 font-medium mb-1">TRANSITION</p>
                <p className="text-sm text-slate-300 italic">"{notes.transition}"</p>
              </div>
            )}

            {/* Objection Handlers */}
            {notes.objectionHandlers && (
              <div>
                <p className="text-xs text-slate-400 font-medium mb-2">OBJECTION HANDLERS</p>
                <div className="space-y-2">
                  {Object.entries(notes.objectionHandlers).map(([objection, response], idx) => (
                    <div key={idx} className="bg-slate-800 rounded-lg p-2">
                      <p className="text-xs text-red-400 mb-1">"{objection}"</p>
                      <p className="text-sm text-green-300">→ {response}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Call to Action (for conclusion) */}
            {notes.callToAction && (
              <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-3">
                <p className="text-xs text-green-400 font-medium mb-2">CALL TO ACTION</p>
                <ul className="space-y-1">
                  {notes.callToAction.map((cta, idx) => (
                    <li key={idx} className="text-sm text-green-100">→ {cta}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Closing Questions */}
            {notes.closingQuestions && (
              <div>
                <p className="text-xs text-slate-400 font-medium mb-2">CLOSING QUESTIONS</p>
                <ul className="space-y-2">
                  {notes.closingQuestions.map((q, idx) => (
                    <li key={idx} className="text-sm text-slate-300">• {q}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="p-3 border-t border-slate-700 bg-slate-800/50">
          <p className="text-xs text-slate-500 text-center">
            Press Ctrl+Shift+P to toggle
          </p>
        </div>
      </div>
    </div>
  );
};

export default PresenterPanel;
