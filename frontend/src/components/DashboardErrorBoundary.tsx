import React, { Component, ErrorInfo, ReactNode } from "react";

// Define interfaces for our props and state
interface DashboardErrorBoundaryProps {
  children: ReactNode;
  ErrorComponent?: React.ComponentType<{
    error: Error;
    resetError?: () => void;
  }>;
  componentName?: string;
}

interface DashboardErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

// Generic default error component
const DefaultErrorComponent: React.FC<{
  error: Error;
  resetError?: () => void;
}> = ({ error, resetError }) => (
  <div className="p-6 rounded-lg bg-red-50 border border-red-200 max-w-md mx-auto my-8">
    <h3 className="text-lg font-medium text-red-800 mb-2">
      Something went wrong
    </h3>
    <p className="text-sm text-red-700 mb-4">
      {error.message || "An unexpected error occurred"}
    </p>
    {resetError && (
      <button
        onClick={resetError}
        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
      >
        Try Again
      </button>
    )}
  </div>
);

/**
 * DashboardErrorBoundary - Error boundary without Suspense
 *
 * This version is optimized for dashboard routes that:
 * 1. Are inside a persistent layout (DashboardLayout)
 * 2. Don't use lazy loading
 * 3. Don't need Suspense boundaries
 *
 * By removing Suspense, we eliminate the brief loading flash during navigation.
 */
class DashboardErrorBoundary extends Component<
  DashboardErrorBoundaryProps,
  DashboardErrorBoundaryState
> {
  constructor(props: DashboardErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<DashboardErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error(
      `Error in component ${this.props.componentName || "unknown"}:`,
      error,
      errorInfo
    );
  }

  resetError = (): void => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render(): ReactNode {
    const { hasError, error } = this.state;
    const {
      children,
      ErrorComponent = DefaultErrorComponent,
    } = this.props;

    if (hasError && error) {
      return <ErrorComponent error={error} resetError={this.resetError} />;
    }

    // No Suspense wrapper - just render children directly
    return children;
  }
}

export default DashboardErrorBoundary;
