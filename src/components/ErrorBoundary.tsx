import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

interface Props {
  children: ReactNode;
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

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    // Try to recover without reload - just reset the error state
  };

  private handleClearStorage = () => {
    try {
      localStorage.removeItem('task-store');
      // Only reload when explicitly clearing storage as a last resort
      window.location.reload();
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="max-w-md w-full glass rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-3 text-destructive">
              <AlertCircle className="h-6 w-6" />
              <h2 className="text-xl font-semibold">Something went wrong</h2>
            </div>

            <p className="text-muted-foreground">
              The application encountered an error. This might be due to corrupted data.
            </p>

            {this.state.error && (
              <details className="bg-muted/50 rounded-lg p-3 text-sm">
                <summary className="cursor-pointer font-medium mb-2">Error details</summary>
                <pre className="text-xs overflow-auto max-h-32">
                  {this.state.error.message}
                </pre>
              </details>
            )}

            <div className="flex gap-2">
              <Button onClick={this.handleReset} variant="outline">
                Try Again
              </Button>
              <Button onClick={this.handleClearStorage} variant="destructive">
                Clear Data & Reload
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

