import React from 'react';
import { useLayout } from '../../providers/LayoutProvider';
import { LayoutGrid, Square } from 'lucide-react';

export const LayoutToggle = () => {
  const { layoutMode, toggleLayoutMode } = useLayout();

  return (
    <div className="flex items-center gap-2 bg-white rounded-full p-1 border border-slate-200 shadow-sm">
      <button
        onClick={() => layoutMode === '2-col' && toggleLayoutMode()}
        className={`p-1.5 rounded-full transition-all duration-200 ${
          layoutMode === '1-col' 
            ? 'bg-corporate-teal text-white shadow-sm' 
            : 'text-slate-400 hover:text-slate-600'
        }`}
        title="Single Column View"
      >
        <Square className="w-4 h-4" />
      </button>
      <button
        onClick={() => layoutMode === '1-col' && toggleLayoutMode()}
        className={`p-1.5 rounded-full transition-all duration-200 ${
          layoutMode === '2-col' 
            ? 'bg-corporate-teal text-white shadow-sm' 
            : 'text-slate-400 hover:text-slate-600'
        }`}
        title="Two Column View"
      >
        <LayoutGrid className="w-4 h-4" />
      </button>
    </div>
  );
};
