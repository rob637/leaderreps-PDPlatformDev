import React from 'react';
import { ChevronRight, ArrowLeft, Home } from 'lucide-react';

/**
 * BreadcrumbNav - Standardized navigation component
 * Replaces inconsistent back buttons with a clear hierarchical path.
 * 
 * @param {Array} items - Array of breadcrumb items: [{ label: 'Home', path: 'dashboard' }, { label: 'Current', path: null }]
 * @param {Function} navigate - Navigation function
 * @param {Function} onBack - Optional custom back handler (overrides default behavior)
 */
export const BreadcrumbNav = ({ items = [], navigate, onBack }) => {
  // If no items, don't render anything
  if (!items || items.length === 0) return null;

  // The last item is the current page
  const currentItem = items[items.length - 1];
  
  // The parent item is the one before the last
  const parentItem = items.length > 1 ? items[items.length - 2] : null;

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (parentItem && parentItem.path) {
      navigate(parentItem.path);
    } else {
      // Fallback if no parent defined
      navigate('dashboard');
    }
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
      {/* Primary Back Action */}
      <button 
        onClick={handleBack}
        className="flex items-center gap-2 text-slate-500 hover:text-corporate-navy transition-colors group self-start"
      >
        <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center group-hover:border-corporate-teal transition-colors shadow-sm">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        </div>
        <span className="text-sm font-bold hidden sm:inline">
          {parentItem ? `Back to ${parentItem.label}` : 'Back'}
        </span>
      </button>

      {/* Breadcrumb Trail */}
      <nav className="flex items-center flex-wrap gap-1 text-sm text-slate-500">
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;
          const isFirst = idx === 0;
          
          return (
            <React.Fragment key={idx}>
              {/* Separator (except for first item) */}
              {idx > 0 && (
                <ChevronRight className="w-4 h-4 text-slate-300 mx-1 flex-shrink-0" />
              )}

              {/* Item */}
              <button
                onClick={() => item.path && !isLast && navigate(item.path)}
                disabled={isLast || !item.path}
                className={`
                  flex items-center gap-1 transition-colors
                  ${isLast 
                    ? 'font-bold text-corporate-navy cursor-default' 
                    : 'hover:text-corporate-teal hover:underline cursor-pointer'}
                `}
              >
                {isFirst && item.path === 'dashboard' && (
                  <Home className="w-3 h-3 mb-0.5" />
                )}
                <span>{item.label}</span>
              </button>
            </React.Fragment>
          );
        })}
      </nav>
    </div>
  );
};
