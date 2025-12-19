import React from 'react';
import { ChevronRight, ArrowLeft, Home } from 'lucide-react';
import { useNavigation } from '../../providers/NavigationProvider';

// App version from build
const APP_VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0.0.0';

/**
 * BreadcrumbNav - Standardized navigation component
 * Replaces inconsistent back buttons with a clear hierarchical path.
 * Google Drive Style: Simple Back Arrow (History) + Breadcrumb Trail (Hierarchy)
 * 
 * @param {Array} items - Array of breadcrumb items: [{ label: 'Home', path: 'dashboard' }, { label: 'Current', path: null }]
 * @param {Function} navigate - Navigation function
 * @param {Function} onBack - Optional custom back handler (overrides default behavior)
 */
export const BreadcrumbNav = ({ items = [], navigate, onBack }) => {
  // If no items, don't render anything
  if (!items || items.length === 0) return null;

  const handleBack = () => {
    if (onBack) {
      // Custom back handler provided
      onBack();
    } else if (navigate && items.length >= 2) {
      // Navigate to parent breadcrumb (second-to-last item)
      const parentItem = items[items.length - 2];
      if (parentItem?.path) {
        navigate(parentItem.path, parentItem.params);
      } else {
        navigate('dashboard');
      }
    } else if (navigate) {
      // Ultimate fallback - go to dashboard
      navigate('dashboard');
    }
  };

  return (
    <div className="flex items-center justify-between gap-3 mb-6">
      <div className="flex items-center gap-3">
      {/* Primary Back Action - Teal Arrow */}
      <button 
        onClick={handleBack}
        className="p-1 hover:bg-teal-50 rounded-lg transition-colors flex-shrink-0"
        title="Go Back"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00A896" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="19" y1="12" x2="5" y2="12"></line>
          <polyline points="12 19 5 12 12 5"></polyline>
        </svg>
      </button>

      {/* Breadcrumb Trail - Hierarchy Navigation */}
      <nav className="flex items-center flex-wrap gap-1 text-sm text-slate-500">
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;
          
          return (
            <React.Fragment key={idx}>
              {/* Separator (except for first item) */}
              {idx > 0 && (
                <ChevronRight className="w-4 h-4 text-slate-300 mx-1 flex-shrink-0" />
              )}
              
              {isLast ? (
                <span className="font-bold text-corporate-navy truncate max-w-[200px] sm:max-w-none">
                  {item.label}
                </span>
              ) : (
                <button 
                  onClick={() => item.path && navigate(item.path, item.params)}
                  className={`hover:text-corporate-teal hover:underline transition-colors flex items-center gap-1 ${!item.path ? 'cursor-default hover:no-underline' : ''}`}
                  disabled={!item.path}
                >
                  {item.label === 'Home' ? <Home className="w-3.5 h-3.5" /> : item.label}
                </button>
              )}
            </React.Fragment>
          );
        })}
      </nav>
      </div>
      
      {/* Version Badge - Upper Right */}
      <span 
        className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded select-none flex-shrink-0"
        title={`App version ${APP_VERSION}`}
      >
        v{APP_VERSION}
      </span>
    </div>
  );
};

