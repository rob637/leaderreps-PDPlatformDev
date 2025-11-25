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
      const isReactError130 = errorString.includes('error #130') || errorString.includes('Minified React error');
      
      return (
        <div style={{ padding: 24, maxWidth: 900, margin: '48px auto', fontFamily: 'system-ui' }}>
          <h2 style={{ color: 'var(--corporate-orange)' }}>❌ Something went wrong</h2>
          
          {isReactError130 && (
            <div style={{ 
              background: '#FFF3CD', 
              border: '2px solid #FFC107', 
              padding: 16, 
              borderRadius: 8, 
              marginBottom: 16 
            }}>
              <strong>🔍 React Error #130 Detected</strong>
              <p style={{ margin: '8px 0' }}>
                This error means a component is trying to render <code>undefined</code>. 
                Check the component stack below to identify which component is undefined.
              </p>
            </div>
          )}
          
          <details style={{ marginBottom: 16 }}>
            <summary style={{ 
              cursor: 'pointer', 
              padding: 12, 
              background: '#f6f8fa', 
              borderRadius: 8,
              fontWeight: 'bold'
            }}>
              📋 Error Details (Click to expand)
            </summary>
            <div style={{ padding: 12, background: '#fff', border: '1px solid #ddd', marginTop: 8 }}>
              <h3>Error Message:</h3>
              <pre style={{ 
                whiteSpace: 'pre-wrap', 
                background: '#f6f8fa', 
                padding: 12, 
                borderRadius: 8,
                fontSize: 14,
                overflow: 'auto'
              }}>
                {errorString}
              </pre>
              
              {this.state.errorInfo?.componentStack && (
                <>
                  <h3 style={{ marginTop: 16 }}>Component Stack:</h3>
                  <pre style={{ 
                    whiteSpace: 'pre-wrap', 
                    background: '#fff3f3', 
                    padding: 12, 
                    borderRadius: 8,
                    fontSize: 12,
                    overflow: 'auto',
                    color: '#c00'
                  }}>
                    {this.state.errorInfo.componentStack}
                  </pre>
                </>
              )}
            </div>
          </details>
          
          <button 
            onClick={() => window.location.reload()}
            style={{
              padding: '12px 24px',
              backgroundColor: '#47A88D',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: 16
            }}
          >
            🔄 Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
