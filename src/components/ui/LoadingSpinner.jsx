import React from 'react';
import { Loader } from 'lucide-react';
import { cn } from '../../lib/utils';

const LoadingSpinner = ({ 
  message = "Loading...", 
  size = 'md',
  className 
}) => {
  const sizes = {
    sm: 'h-6 w-6',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
  };

  return (
    <div className={cn("min-h-[200px] flex items-center justify-center bg-slate-50 dark:bg-slate-800", className)}>
      <div className="flex flex-col items-center">
        <Loader className={cn("animate-spin text-corporate-teal mb-3", sizes[size])} />
        {message && <p className="font-semibold text-corporate-navy">{message}</p>}
      </div>
    </div>
  );
};

export { LoadingSpinner };
