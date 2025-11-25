// src/components/ui/PageLayout.jsx
// Standardized page layout component for consistent look and feel across all screens
// Usage: <PageLayout title="Community" icon={Users} subtitle="Connect with fellow leaders">
//          {/* page content */}
//        </PageLayout>

import React from 'react';
import { ArrowLeft } from 'lucide-react';

/**
 * PageLayout - Standardized layout wrapper for all feature screens
 * 
 * @param {string} title - Page title (required)
 * @param {React.ComponentType} icon - Lucide icon component to display next to title
 * @param {string} subtitle - Subtitle/description text (also accepts 'description' for compatibility)
 * @param {string} backTo - Navigation target for back button (default: 'dashboard')
 * @param {string} backLabel - Label for back button (default: 'Back to Dashboard')
 * @param {function} navigate - Navigation function (also accepts 'onNavigate' for compatibility)
 * @param {boolean} showBack - Whether to show back button (default: true)
 * @param {string} accentColor - 'teal' | 'orange' | 'navy' for icon color
 * @param {React.ReactNode} headerActions - Optional actions to show in header (buttons, badges, etc.)
 * @param {React.ReactNode} badge - Optional badge text (e.g., "Requires Premium")
 * @param {React.ReactNode} children - Page content
 * @param {string} maxWidth - Max width class (default: 'max-w-7xl')
 * @param {boolean} centerHeader - Whether to center the header (default: true)
 * @param {React.ReactNode} sidebar - Optional sidebar content for two-column layout
 * @param {boolean} sidebarLeft - Put sidebar on left (default: false, sidebar on right)
 */
export const PageLayout = ({
  title,
  icon: Icon,
  subtitle,
  description, // Alias for subtitle (backward compatibility)
  backTo = 'dashboard',
  backLabel = 'Back to Dashboard',
  navigate,
  onNavigate, // Alias for navigate (backward compatibility)
  showBack = true,
  accentColor = 'teal',
  headerActions,
  badge,
  children,
  maxWidth = 'max-w-7xl',
  centerHeader = true,
  sidebar,
  sidebarLeft = false,
}) => {
  // Support both prop names for compatibility
  const nav = navigate || onNavigate;
  const sub = subtitle || description;
  const iconColorClass = {
    teal: 'text-corporate-teal',
    orange: 'text-corporate-orange',
    navy: 'text-corporate-navy',
  }[accentColor] || 'text-corporate-teal';

  // Determine layout based on sidebar presence
  const hasSidebar = !!sidebar;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className={`${maxWidth} mx-auto p-4 sm:p-6 lg:p-8`}>
        
        {/* Back Button - Consistent across all pages */}
        {showBack && nav && (
          <button
            onClick={() => nav(backTo)}
            className="flex items-center gap-2 mb-6 text-slate-500 hover:text-corporate-navy transition-colors group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-medium">{backLabel}</span>
          </button>
        )}

        {/* Header - Standardized layout */}
        <header className={`mb-8 ${centerHeader ? 'text-center' : ''}`}>
          <div className={`flex items-center gap-3 mb-2 ${centerHeader ? 'justify-center' : ''}`}>
            {Icon && <Icon className={`w-8 h-8 ${iconColorClass}`} />}
            <h1 className="text-2xl sm:text-3xl font-bold text-corporate-navy">
              {title}
            </h1>
            {Icon && <Icon className={`w-8 h-8 ${iconColorClass}`} />}
          </div>
          
          {sub && (
            <p className={`text-slate-600 text-base sm:text-lg mt-2 ${centerHeader ? 'max-w-2xl mx-auto' : ''}`}>
              {sub}
            </p>
          )}
          
          {badge && (
            <div className={`mt-3 ${centerHeader ? 'flex justify-center' : ''}`}>
              <span className="inline-block bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-semibold">
                {badge}
              </span>
            </div>
          )}
          
          {headerActions && (
            <div className={`mt-4 ${centerHeader ? 'flex justify-center' : ''}`}>
              {headerActions}
            </div>
          )}
        </header>

        {/* Page Content - Responsive: single column mobile, two column desktop if sidebar */}
        {hasSidebar ? (
          <div className={`grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8`}>
            {/* Sidebar - appears first on mobile, positioned based on sidebarLeft */}
            {sidebarLeft && (
              <aside className="lg:col-span-4 xl:col-span-3 order-2 lg:order-1">
                <div className="lg:sticky lg:top-6">
                  {sidebar}
                </div>
              </aside>
            )}
            
            {/* Main Content */}
            <main className={`${sidebarLeft ? 'lg:col-span-8 xl:col-span-9 order-1 lg:order-2' : 'lg:col-span-8 xl:col-span-9'}`}>
              {children}
            </main>
            
            {/* Sidebar on right (default) */}
            {!sidebarLeft && (
              <aside className="lg:col-span-4 xl:col-span-3">
                <div className="lg:sticky lg:top-6">
                  {sidebar}
                </div>
              </aside>
            )}
          </div>
        ) : (
          <main>
            {children}
          </main>
        )}
      </div>
    </div>
  );
};

/**
 * PageEmptyState - Displayed when a page has no widgets/content enabled
 * 
 * @param {React.ComponentType} icon - Lucide icon component
 * @param {string} title - Empty state title
 * @param {string} message - Empty state message
 */
export const PageEmptyState = ({ 
  icon: Icon, 
  title = 'Coming Soon',
  message = 'This feature is being configured. Check back soon!'
}) => (
  <div className="flex flex-col items-center justify-center py-16 px-4">
    {Icon && (
      <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-6">
        <Icon className="w-10 h-10 text-slate-400" />
      </div>
    )}
    <h2 className="text-xl font-bold text-corporate-navy mb-2">{title}</h2>
    <p className="text-slate-500 text-center max-w-md">{message}</p>
  </div>
);

/**
 * PageSection - Consistent section wrapper within a page
 * 
 * @param {string} title - Section title
 * @param {React.ComponentType} icon - Optional icon
 * @param {React.ReactNode} actions - Optional action buttons
 * @param {React.ReactNode} children - Section content
 */
export const PageSection = ({ title, icon: Icon, actions, children }) => (
  <section className="mb-8">
    {(title || actions) && (
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="w-5 h-5 text-corporate-teal" />}
          {title && <h2 className="text-lg sm:text-xl font-bold text-corporate-navy">{title}</h2>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    )}
    {children}
  </section>
);

/**
 * PageGrid - Responsive grid for cards/items
 * Single column on mobile, 2 columns on tablet, 3 on desktop
 * 
 * @param {number} cols - Max columns on desktop (2, 3, or 4)
 * @param {React.ReactNode} children - Grid items
 */
export const PageGrid = ({ cols = 3, children }) => {
  const gridClass = {
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  }[cols] || 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';

  return (
    <div className={`grid ${gridClass} gap-4 sm:gap-6`}>
      {children}
    </div>
  );
};

export default PageLayout;
