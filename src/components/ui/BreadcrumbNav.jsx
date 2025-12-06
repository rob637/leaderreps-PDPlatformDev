import React from 'react';
import { ChevronRight, ArrowLeft, Home } from 'lucide-react';
import { useNavigation } from '../../providers/NavigationProvider';

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
  const { goBack } = useNavigation();

  // If no items, don't render anything
  if (!items || items.length === 0) return null;

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (goBack) {
      goBack();
    } else if (navigate) {
      // Fallback if no history context
      navigate('dashboard');
    }
  };

  return (
    <div className="flex items-center gap-4 mb-6">
      {/* Primary Back Action - Simple Arrow (History Back) */}
      <button 
        onClick={handleBack}
        className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center hover:border-corporate-teal hover:text-corporate-teal transition-colors shadow-sm group flex-shrink-0"
        title="Go Back"
      >
        <ArrowLeft className="w-4 h-4 text-slate-500 group-hover:text-corporate-teal transition-colors" />
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
                  onClick={() => item.path && navigate(item.path)}
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
  );
};

