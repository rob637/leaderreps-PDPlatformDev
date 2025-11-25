import React, { useState } from 'react';
import { cn } from '../../lib/utils';

const Tooltip = React.forwardRef(({ 
  content, 
  children, 
  className, 
  side = 'top',
  ...props 
}, ref) => {
  const [isVisible, setIsVisible] = useState(false);

  const positions = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  const arrows = {
    top: 'left-1/2 -translate-x-1/2 top-full border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-corporate-navy',
    bottom: 'left-1/2 -translate-x-1/2 bottom-full border-l-4 border-r-4 border-b-4 border-l-transparent border-r-transparent border-b-corporate-navy',
    left: 'top-1/2 -translate-y-1/2 left-full border-t-4 border-b-4 border-l-4 border-t-transparent border-b-transparent border-l-corporate-navy',
    right: 'top-1/2 -translate-y-1/2 right-full border-t-4 border-b-4 border-r-4 border-t-transparent border-b-transparent border-r-corporate-navy',
  };

  return (
    <div
      ref={ref}
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      {...props}
    >
      {children}
      {isVisible && content && (
        <div 
          className={cn(
            'absolute z-50 w-max max-w-xs px-3 py-2 text-xs text-white bg-corporate-navy rounded-lg shadow-lg',
            positions[side],
            className
          )}
        >
          {content}
          <div className={cn('absolute w-0 h-0', arrows[side])} />
        </div>
      )}
    </div>
  );
});

Tooltip.displayName = 'Tooltip';

export { Tooltip };
