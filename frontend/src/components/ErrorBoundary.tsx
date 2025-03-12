import React, { Component, ErrorInfo, ReactNode, Suspense } from "react";

// Define interfaces for our props and state
interface ErrorBoundaryProps {
  children: ReactNode;
  ErrorComponent?: React.ComponentType<{
    error: Error;
    resetError?: () => void;
  }>;
  LoadingComponent?: React.ComponentType;
  componentName?: string; // For logging/analytics purposes
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  isLoading: boolean;
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

// Generic default loading component
const DefaultLoadingComponent: React.FC = () => (
  <div className="flex justify-center items-center p-8">
    <div className="animate-spin h-8 w-8 border-4 border-blue-600 rounded-full border-t-transparent"></div>
  </div>
);

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      isLoading: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error to your analytics or monitoring service
    console.error(
      `Error in component ${this.props.componentName || "unknown"}:`,
      error,
      errorInfo
    );

    // We could send this to a service like Sentry, LogRocket, etc.
    // if (typeof window.errorReportingService !== 'undefined') {
    //   window.errorReportingService.captureException(error, {
    //     componentName: this.props.componentName,
    //     extra: errorInfo
    //   });
    // }
  }

  resetError = (): void => {
    this.setState({
      hasError: false,
      error: null,
      isLoading: true,
    });

    // Simulate loading before retry
    setTimeout(() => {
      this.setState({ isLoading: false });
    }, 1000);
  };

  render(): ReactNode {
    const { hasError, error, isLoading } = this.state;
    const {
      children,
      ErrorComponent = DefaultErrorComponent,
      LoadingComponent = DefaultLoadingComponent,
    } = this.props;

    if (hasError && error) {
      return <ErrorComponent error={error} resetError={this.resetError} />;
    }

    if (isLoading) {
      return <LoadingComponent />;
    }

    // Wrap in Suspense to handle lazy loading
    return <Suspense fallback={<LoadingComponent />}>{children}</Suspense>;
  }
}

export default ErrorBoundary;
