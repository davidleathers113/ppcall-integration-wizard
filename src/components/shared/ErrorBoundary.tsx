import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, RotateCcw } from 'lucide-react';
import Card from './Card';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  showResetButton?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    // Reset mock data
    if (confirm('Reset all data to default mock state? This cannot be undone.')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  toggleDetails = () => {
    this.setState((prev) => ({ showDetails: !prev.showDetails }));
  };

  render() {
    if (this.state.hasError) {
      const { fallbackTitle = 'Something went wrong', showResetButton = false } = this.props;
      const { error, errorInfo, showDetails } = this.state;

      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
          <Card className="max-w-2xl w-full">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <AlertTriangle className="text-red-500" size={48} />
              </div>

              <h2 className="text-2xl font-bold text-slate-900">{fallbackTitle}</h2>

              <p className="text-slate-600">
                An unexpected error occurred. You can try reloading the page or resetting the app data.
              </p>

              <div className="flex gap-3 justify-center">
                <button
                  onClick={this.handleReload}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
                >
                  <RefreshCw size={16} />
                  Reload Page
                </button>

                {showResetButton && (
                  <button
                    onClick={this.handleReset}
                    className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 flex items-center gap-2"
                  >
                    <RotateCcw size={16} />
                    Reset Mock Data
                  </button>
                )}
              </div>

              {error && (
                <div className="mt-6 text-left">
                  <button
                    onClick={this.toggleDetails}
                    className="text-sm text-slate-500 hover:text-slate-700 underline"
                  >
                    {showDetails ? 'Hide' : 'Show'} error details
                  </button>

                  {showDetails && (
                    <div className="mt-3 p-4 bg-slate-100 rounded-lg text-sm text-left space-y-2">
                      <div>
                        <strong className="text-slate-700">Error:</strong>
                        <pre className="mt-1 text-red-600 whitespace-pre-wrap break-words">
                          {error.toString()}
                        </pre>
                      </div>

                      {errorInfo && (
                        <div>
                          <strong className="text-slate-700">Stack Trace:</strong>
                          <pre className="mt-1 text-slate-600 text-xs whitespace-pre-wrap break-words overflow-x-auto max-h-64 overflow-y-auto">
                            {errorInfo.componentStack}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              <p className="text-xs text-slate-400 mt-4">
                This is a prototype application. If the error persists, please check the browser console for
                more details.
              </p>
            </div>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
