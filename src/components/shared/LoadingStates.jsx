// src/components/shared/LoadingStates.jsx
// REFACTOR: Centralized loading and empty states

import React from 'react';
import { Loader, AlertCircle, FileX, Wifi, WifiOff } from 'lucide-react';
import { COLORS } from '../../utils/constants.js';

export const LoadingSpinner = ({ 
  message = "Loading...", 
  size = "md",
  color = COLORS.TEAL,
  className = "" 
}) => {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8", 
    lg: "h-12 w-12",
    xl: "h-16 w-16"
  };

  return (
    <div className={`flex flex-col items-center justify-center p-8 ${className}`}>
      <Loader 
        className={`animate-spin ${sizeClasses[size]} mb-3`} 
        style={{ color }} 
      />
      {message && (
        <p className="text-sm font-medium text-corporate-navy">
          {message}
        </p>
      )}
    </div>
  );
};

export const ErrorState = ({ 
  title = "Something went wrong",
  message = "An unexpected error occurred. Please try again.",
  onRetry,
  className = ""
}) => (
  <div className={`flex flex-col items-center justify-center p-8 text-center ${className}`}>
    <AlertCircle className="h-12 w-12 mb-4" style={{ color: COLORS.ERROR }} />
    <h3 className="text-lg font-semibold mb-2 text-corporate-navy">
      {title}
    </h3>
    <p className="text-sm text-gray-600 mb-6 max-w-md">
      {message}
    </p>
    {onRetry && (
      <button
        onClick={onRetry}
        className="px-4 py-2 rounded-lg font-medium text-white transition-colors bg-corporate-teal"
      >
        Try Again
      </button>
    )}
  </div>
);

export const EmptyState = ({ 
  title = "No data found",
  message = "There's nothing here yet.",
  actionLabel,
  onAction,
  className = ""
}) => (
  <div className={`flex flex-col items-center justify-center p-8 text-center ${className}`}>
    <FileX className="h-12 w-12 mb-4" style={{ color: COLORS.SUBTLE }} />
    <h3 className="text-lg font-semibold mb-2 text-corporate-navy">
      {title}
    </h3>
    <p className="text-sm text-gray-600 mb-6 max-w-md">
      {message}
    </p>
    {actionLabel && onAction && (
      <button
        onClick={onAction}
        className="px-4 py-2 rounded-lg font-medium text-white transition-colors bg-corporate-teal"
      >
        {actionLabel}
      </button>
    )}
  </div>
);

export const NetworkStatus = ({ isOnline = true }) => (
  <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${
    isOnline ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
  }`}>
    {isOnline ? (
      <Wifi className="h-3 w-3" />
    ) : (
      <WifiOff className="h-3 w-3" />
    )}
    {isOnline ? 'Online' : 'Offline'}
  </div>
);