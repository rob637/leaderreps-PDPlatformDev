import React from 'react';
import { Check, Plus, Trash2 } from 'lucide-react';

const WinTracker = ({ wins = [], onToggle, onDelete }) => {
  // Filter for active items (completed or not)
  // In the future we might want to hide completed items or move them to bottom
  
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-300 p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-corporate-navy font-serif">What's Important Now (WIN)</h2>
        <span className="text-sm text-gray-400 font-medium">
          {wins.filter(w => w.completed).length}/{wins.length}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-2">
        {wins.length === 0 ? (
          <div className="text-center py-10 text-gray-400 italic">
            No priorities set for today yet.<br/>
            Add them from your AM Bookend.
          </div>
        ) : (
          wins.map((win) => (
            <div 
              key={win.id} 
              className={`
                group flex items-start gap-3 p-3 rounded-xl transition-all duration-200 border
                ${win.completed 
                  ? 'bg-gray-50 border-gray-100' 
                  : 'bg-white border-gray-200 hover:border-corporate-teal/30 hover:shadow-sm'
                }
              `}
            >
              <button
                onClick={() => onToggle(win.id)}
                className={`
                  mt-1 flex-shrink-0 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-colors
                  ${win.completed 
                    ? 'bg-corporate-teal border-corporate-teal text-white' 
                    : 'border-gray-300 text-transparent hover:border-corporate-teal'
                  }
                `}
              >
                <Check className="w-4 h-4" strokeWidth={3} />
              </button>
              
              <div className="flex-1 min-w-0">
                <p className={`
                  text-base leading-relaxed break-words transition-all
                  ${win.completed ? 'text-gray-400 line-through' : 'text-corporate-navy font-medium'}
                `}>
                  {win.text}
                </p>
                <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold">
                  {win.type === 'win' ? 'Main WIN' : 'Priority'}
                </span>
              </div>

              {onDelete && (
                <button 
                  onClick={() => onDelete(win.id)}
                  className="opacity-0 group-hover:opacity-100 p-2 text-gray-300 hover:text-red-500 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default WinTracker;
