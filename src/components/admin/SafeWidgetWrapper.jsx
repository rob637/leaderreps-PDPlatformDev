import React from 'react';
import { AlertTriangle } from 'lucide-react';

class SafeWidgetWrapper extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Widget Runtime Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 border border-red-200 bg-red-50 rounded-lg flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-bold text-red-800">Widget Error</h3>
            <p className="text-xs text-red-600 mt-1">
              This widget crashed. Please check the code.
            </p>
            {this.props.showDetails && (
               <pre className="mt-2 p-2 bg-red-100 rounded text-[10px] text-red-800 overflow-auto max-h-20">
                 {this.state.error?.toString()}
               </pre>
            )}
          </div>
          <button 
            onClick={() => this.setState({ hasError: false })}
            className="text-xs text-red-600 underline hover:text-red-800"
          >
            Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default SafeWidgetWrapper;
