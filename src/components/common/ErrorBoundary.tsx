import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Compass } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  public handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex-1 flex items-center justify-center p-6 bg-[#F7F8FA] min-h-[300px]">
          <div className="max-w-md w-full bg-white rounded-2xl border border-[#E4E7EC] p-6 shadow-sm text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-[#FEF3F2] border border-[#FECDCA] text-[#D92D20] flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-[#172033]">
                {this.props.fallbackTitle || 'Display Module Recovered'}
              </h3>
              <p className="text-xs text-[#667085] leading-relaxed">
                Your architectural project data is completely safe. This screen encountered a temporary rendering or device resource issue.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3 rounded-lg bg-[#F9FAFB] border border-[#E4E7EC] text-left">
                <span className="text-[10px] font-mono text-[#667085] uppercase tracking-wider block mb-1">
                  Diagnostics:
                </span>
                <p className="text-xs font-mono text-[#D92D20] truncate">
                  {this.state.error.message || 'Unknown device exception'}
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
              <button
                onClick={this.handleReset}
                className="w-full sm:flex-1 min-h-[44px] px-4 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-xs"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reload Screen</span>
              </button>

              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.hash = '#dashboard';
                  window.location.reload();
                }}
                className="w-full sm:flex-1 min-h-[44px] px-4 py-2.5 rounded-xl border border-[#E4E7EC] hover:bg-[#F9FAFB] text-[#344054] text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Dashboard</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
