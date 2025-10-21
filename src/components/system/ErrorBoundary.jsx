import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(p){ super(p); this.state = { hasError:false, error:null }; }
  static getDerivedStateFromError(error){ return { hasError:true, error }; }
  componentDidCatch(err, info){ console.error('App crash:', err, info); }
  render(){
    if (this.state.hasError) {
      return (
        <div style={{padding:24, maxWidth:700, margin:'48px auto'}}>
          <h2>Something went wrong</h2>
          <pre style={{whiteSpace:'pre-wrap', background:'#f6f8fa', padding:12, borderRadius:8}}>
            {String(this.state.error)}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}
