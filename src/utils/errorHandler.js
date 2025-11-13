// src/utils/errorHandler.js
// IMPROVEMENT: Centralized error handling and logging

import React from 'react';

export class AppError extends Error {
  constructor(message, code = 'GENERAL_ERROR', context = {}) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.context = context;
    this.timestamp = new Date().toISOString();
  }
}

export const ERROR_CODES = {
  AUTH_FAILED: 'AUTH_FAILED',
  NETWORK_ERROR: 'NETWORK_ERROR',
  FIRESTORE_ERROR: 'FIRESTORE_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  API_ERROR: 'API_ERROR',
  CONFIG_ERROR: 'CONFIG_ERROR'
};

export const handleError = (error, context = {}) => {
  const errorInfo = {
    message: error.message || 'Unknown error',
    code: error.code || ERROR_CODES.GENERAL_ERROR,
    context,
    timestamp: new Date().toISOString(),
    stack: error.stack
  };

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.error('[ERROR]', errorInfo);
  }

  // TODO: Send to error reporting service in production
  // if (process.env.NODE_ENV === 'production') {
  //   sendErrorReport(errorInfo);
  // }

  return errorInfo;
};

export const createErrorBoundary = (fallbackComponent) => {
  return class ErrorBoundary extends React.Component {
    constructor(props) {
      super(props);
      this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
      return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
      handleError(error, { componentStack: errorInfo.componentStack });
    }

    render() {
      if (this.state.hasError) {
        return fallbackComponent ? 
          fallbackComponent(this.state.error) : 
          React.createElement('div', {
            style: { padding: '2rem', textAlign: 'center', color: '#DC2626' }
          }, [
            React.createElement('h2', { key: 'title' }, 'Something went wrong'),
            React.createElement('p', { key: 'message' }, this.state.error?.message || 'An unexpected error occurred'),
            React.createElement('button', {
              key: 'retry',
              onClick: () => this.setState({ hasError: false, error: null }),
              style: { 
                marginTop: '1rem', 
                padding: '0.5rem 1rem', 
                backgroundColor: '#3B82F6',
                color: 'white',
                border: 'none',
                borderRadius: '0.375rem',
                cursor: 'pointer'
              }
            }, 'Try Again')
          ]);
      }

      return this.props.children;
    }
  };
};