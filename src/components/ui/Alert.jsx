import React from 'react';
import { cn } from '../../lib/utils';
import { AlertCircle, CheckCircle, Info, AlertTriangle, X } from 'lucide-react';

const Alert = React.forwardRef(({ 
  className, 
  variant = 'info',
  title,
  children,
  onClose,
  ...props 
}, ref) => {
  
  const variants = {
    info: {
      container: 'bg-blue-50/80 dark:bg-blue-900/20/80 border-blue-100 dark:border-blue-800 text-blue-800',
      icon: Info,
      iconColor: 'text-blue-500',
    },
    success: {
      container: 'bg-emerald-50/80 dark:bg-emerald-900/20/80 border-emerald-100 text-emerald-800',
      icon: CheckCircle,
      iconColor: 'text-emerald-500',
    },
    warning: {
      container: 'bg-amber-50/80 dark:bg-amber-900/20/80 border-amber-100 text-amber-800',
      icon: AlertTriangle,
      iconColor: 'text-amber-500',
    },
    error: {
      container: 'bg-red-50/80 dark:bg-red-900/20/80 border-red-100 text-red-800',
      icon: AlertCircle,
      iconColor: 'text-red-500',
    },
  };

  const { container, icon: Icon, iconColor } = variants[variant];

  return (
    <div
      ref={ref}
      role="alert"
      className={cn(
        'relative flex gap-4 rounded-xl border p-4',
        container,
        className
      )}
      style={{ fontFamily: 'var(--font-body)' }}
      {...props}
    >
      <Icon className={cn('h-5 w-5 flex-shrink-0 mt-0.5', iconColor)} />
      <div className="flex-1">
        {title && (
          <h5 className="font-semibold mb-1" style={{ fontFamily: 'var(--font-heading)' }}>{title}</h5>
        )}
        <div className="text-sm leading-relaxed">{children}</div>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-black/5 transition-colors text-current opacity-60 hover:opacity-100"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Dismiss</span>
        </button>
      )}
    </div>
  );
});

Alert.displayName = 'Alert';

export { Alert };
