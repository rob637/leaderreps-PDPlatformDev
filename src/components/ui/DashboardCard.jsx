import React from 'react';

export const DashboardCard = ({ title, description, onClick, color, bgColor, badge, count }) => {
  return (
    <button
      onClick={onClick}
      className="w-full text-left transition-all duration-150 rounded-2xl border p-5 sm:p-6 h-full flex flex-col group
        bg-white hover:shadow-xl cursor-pointer border-slate-200 hover:border-corporate-teal/50
        touch-manipulation active:scale-[0.98] active:bg-slate-50
        min-h-[120px] sm:min-h-[160px]"
    >
      {/* Mobile: Horizontal layout, Desktop: Vertical centered */}
      <div className="flex sm:flex-col items-center sm:text-center gap-4 sm:gap-0 w-full">
        {/* Icon */}
        <div
          className={`w-14 h-14 sm:w-20 sm:h-20 rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0 sm:mx-auto sm:mb-4 transition-colors
            ${bgColor || 'bg-corporate-teal/10'} ${color || 'text-corporate-teal'} group-hover:bg-opacity-80`}
        >
          <Icon className="w-7 h-7 sm:w-10 sm:h-10" />
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0 sm:w-full">
          <div className="flex items-center gap-2 sm:justify-center mb-1 sm:mb-3">
            <h3 className="text-lg sm:text-xl font-bold text-corporate-navy truncate">
              {title}
            </h3>
            {badge && (
              <span className="flex-shrink-0 px-2 py-0.5 text-xs font-medium rounded-full bg-corporate-orange/10 text-corporate-orange">
                {badge}
              </span>
            )}
            {count !== undefined && count > 0 && (
              <span className="flex-shrink-0 px-2 py-0.5 text-xs font-medium rounded-full bg-slate-100 text-slate-600">
                {count}
              </span>
            )}
          </div>
          <p className="text-sm sm:text-base text-slate-600 line-clamp-2 sm:line-clamp-none">
            {description}
          </p>
        </div>
        
        {/* Mobile chevron indicator */}
        <div className="sm:hidden flex-shrink-0 text-slate-400">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </button>
  );
};

export default DashboardCard;
