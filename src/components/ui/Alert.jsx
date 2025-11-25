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
      container: 'bg-blue-50 border-blue-200 text-blue-800',
      icon: Info,
      iconColor: 'text-blue-500',
    },
    success: {
      container: 'bg-green-50 border-green-200 text-green-800',
      icon: CheckCircle,
      iconColor: 'text-green-500',
    },
    warning: {
      container: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      icon: AlertTriangle,
      iconColor: 'text-yellow-500',
    },
    error: {
      container: 'bg-red-50 border-red-200 text-red-800',
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
        'relative flex gap-3 rounded-xl border p-4',
        container,
        className
      )}
      {...props}
    >
      <Icon className={cn('h-5 w-5 flex-shrink-0 mt-0.5', iconColor)} />
      <div className="flex-1">
        {title && (
          <h5 className="font-semibold mb-1">{title}</h5>
        )}
        <div className="text-sm">{children}</div>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1 rounded-full hover:bg-black/5 transition-colors"
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
