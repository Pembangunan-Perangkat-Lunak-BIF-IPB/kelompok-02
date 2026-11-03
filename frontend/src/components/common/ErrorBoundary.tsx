import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
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

  public render() {
    if (this.state.hasError) {
      if (this.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="flex min-h-[300px] w-full flex-col items-center justify-center p-6 text-center">
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-800 max-w-lg">
            <h3 className="text-base font-bold mb-2">Terjadi Kesalahan pada Komponen Ini</h3>
            <p className="text-xs text-red-600 mb-4">
              {this.state.error?.message || 'Komponen grafis/WebGL gagal dimuat.'}
            </p>
            <button
              type="button"
              onClick={() => this.setState({ hasError: false, error: null })}
              className="rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 cursor-pointer"
            >
              Coba Muat Ulang Komponen
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

