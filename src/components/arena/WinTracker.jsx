import React from 'react';
import { Check, Trash2 } from 'lucide-react';

const WinTracker = ({ wins = [], onToggle, onDelete }) => {
  const mainWins = wins.filter(w => w.type === 'win');
  const priorities = wins.filter(w => w.type === 'priority');

  const WinItem = ({ item }) => (
    <div 
      className={`
        group flex items-center justify-between gap-3 p-3 rounded-xl transition-all duration-200 border mb-2
        ${item.completed 
          ? 'bg-gray-50 border-gray-100' 
          : 'bg-white border-gray-200 hover:border-corporate-teal/30 hover:shadow-sm'
        }
      `}
    >
      <div className="flex-1 min-w-0">
        <p className={`
          text-base leading-relaxed break-words transition-all text-left
          ${item.completed ? 'text-gray-400 line-through' : 'text-corporate-navy font-medium'}
        `}>
          {item.text}
        </p>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => onToggle(item.id)}
          className={`
            flex-shrink-0 w-6 h-6 rounded border-2 flex items-center justify-center transition-colors
            ${item.completed 
              ? 'bg-corporate-teal border-corporate-teal text-white' 
              : 'border-gray-300 text-transparent hover:border-corporate-teal'
            }
          `}
        >
          <Check className="w-4 h-4" strokeWidth={3} />
        </button>

        {onDelete && (
          <button 
            onClick={() => onDelete(item.id)}
            className="opacity-0 group-hover:opacity-100 p-2 text-gray-300 hover:text-corporate-orange transition-all"
            title="Delete item"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
  
  return (
    <div className="w-full">
      <div className="space-y-6">
        {/* Main WIN Section */}
        <div className="flex flex-col gap-2">
          <div className="flex-shrink-0">
            <h3 className="text-lg font-bold text-corporate-navy font-serif text-left">WIN:</h3>
          </div>
          <div className="flex-1">
            {mainWins.length > 0 ? (
              mainWins.map(win => <WinItem key={win.id} item={win} />)
            ) : (
              <div className="border-b border-gray-300 h-8 w-full max-w-md"></div>
            )}
          </div>
        </div>

        {/* Priorities Section */}
        <div className="flex flex-col gap-2">
          <div className="flex-shrink-0">
            <h3 className="text-lg font-bold text-corporate-navy font-serif text-left">
              {priorities.length === 1 ? 'Priority:' : 'Priorities:'}
            </h3>
          </div>
          <div className="flex-1">
            {priorities.length > 0 ? (
              priorities.map(priority => <WinItem key={priority.id} item={priority} />)
            ) : (
              <div className="space-y-4 max-w-md">
                 <div className="border-b border-gray-300 h-8 w-full"></div>
                 <div className="border-b border-gray-300 h-8 w-full"></div>
                 <div className="border-b border-gray-300 h-8 w-full"></div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WinTracker;
