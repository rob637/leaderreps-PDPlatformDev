import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(p) { 
    super(p); 
    this.state = { hasError: false, error: null, errorInfo: null }; 
  }
  
  static getDerivedStateFromError(error) { 
    console.error('🔴 [ErrorBoundary] Error caught:', error);
    console.error('🔴 [ErrorBoundary] Error type:', error?.constructor?.name);
    console.error('🔴 [ErrorBoundary] Error message:', error?.message);
    console.error('🔴 [ErrorBoundary] Error stack:', error?.stack);
    return { hasError: true, error }; 
  }
  
  componentDidCatch(err, info) { 
    console.error('🔴 [ErrorBoundary] componentDidCatch - Error:', err);
    console.error('🔴 [ErrorBoundary] componentDidCatch - Info:', info);
    console.error('🔴 [ErrorBoundary] Component Stack:', info?.componentStack);
    
    // Store detailed error info
    this.setState({ errorInfo: info });
  }
  
  render() {
    if (this.state.hasError) {
      const errorString = String(this.state.error);
      
      // Handle Chunk Load Errors (Version Mismatch)
      const isChunkError = errorString.includes('Failed to fetch dynamically imported module') || 
                          errorString.includes('Importing a module script failed');

      if (isChunkError) {
        return (
          <div style={{ 
            padding: 40, 
            maxWidth: 600, 
            margin: '100px auto', 
            fontFamily: 'system-ui', 
            textAlign: 'center',
            backgroundColor: 'white',
            borderRadius: 16,
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🚀</div>
            <h2 style={{ color: '#111827', fontSize: '2rem', marginBottom: '1rem', fontWeight: 800 }}>New Update Available</h2>
            <p style={{ fontSize: '1.1rem', color: '#4B5563', marginBottom: '2rem', lineHeight: 1.5 }}>
              We've just deployed a new version of the platform with improvements and fixes. Please reload to get the latest experience.
            </p>
            <button 
              onClick={() => window.location.reload()}
              style={{
                padding: '16px 32px',
                backgroundColor: '#47A88D',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: 18,
                boxShadow: '0 4px 6px rgba(71, 168, 141, 0.3)',
                transition: 'transform 0.1s'
              }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              🔄 Update Now
            </button>
          </div>
        );
      }

      const isReactError130 = errorString.includes('error #130') || errorString.includes('Minified React error');
      
      return (
        <div className="min-h-screen bg-slate-900 dark:bg-slate-900 p-6">
          <div style={{ maxWidth: 900, margin: '48px auto', fontFamily: 'system-ui' }}>
            <h2 className="text-2xl font-bold text-red-500 mb-4">❌ Something went wrong</h2>
            
            {isReactError130 && (
              <div className="bg-amber-100 dark:bg-amber-900/30 border-2 border-amber-500 p-4 rounded-lg mb-4">
                <strong className="text-amber-800 dark:text-amber-200">🔍 React Error #130 Detected</strong>
                <p className="text-amber-700 dark:text-amber-300 mt-2">
                  This error means a component is trying to render <code className="bg-amber-200 dark:bg-amber-800 px-1 rounded">undefined</code>. 
                  Check the component stack below to identify which component is undefined.
                </p>
              </div>
            )}
            
            <details className="mb-4">
              <summary className="cursor-pointer p-3 bg-slate-800 dark:bg-slate-800 rounded-lg text-slate-200 font-semibold">
              📋 Error Details (Click to expand)
            </summary>
            <div className="p-3 bg-slate-700 dark:bg-slate-800 border border-slate-600 mt-2 rounded-lg">
              <h3 className="text-slate-200 font-semibold mb-2">Error Message:</h3>
              <pre className="whitespace-pre-wrap bg-slate-800 dark:bg-slate-900 p-3 rounded-lg text-sm overflow-auto text-red-400">
                {errorString}
              </pre>
              
              {this.state.errorInfo?.componentStack && (
                <>
                  <h3 className="text-slate-200 font-semibold mt-4 mb-2">Component Stack:</h3>
                  <pre className="whitespace-pre-wrap bg-red-900/30 dark:bg-red-900/40 p-3 rounded-lg text-xs overflow-auto text-red-300">
                    {this.state.errorInfo.componentStack}
                  </pre>
                </>
              )}
            </div>
          </details>
          
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-corporate-teal text-white rounded-lg font-semibold hover:bg-corporate-teal/90 transition-colors"
          >
            🔄 Reload Page
          </button>
        </div>
        </div>
      );
    }
    return this.props.children;
  }
}
