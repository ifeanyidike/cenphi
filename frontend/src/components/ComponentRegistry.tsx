import React from "react";
import { AlertTriangle, Loader2 } from "lucide-react";

// Component-specific error and loading components
// ===============================================

// Example error states for different components
export const OnboardingErrorComponent: React.FC<{
  error: Error;
  resetError?: () => void;
}> = ({ error, resetError }) => (
  <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl p-8 border border-gray-100 max-w-lg mx-auto my-12">
    <div className="mx-auto h-20 w-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
      <AlertTriangle className="h-10 w-10 text-red-600" />
    </div>
    <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">
      Onboarding Process Interrupted
    </h2>
    <p className="text-gray-600 mb-6 text-center">
      {error.message ||
        "An unexpected error occurred during the onboarding process."}
    </p>
    {resetError && (
      <button
        onClick={resetError}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-xl shadow-md transition-all"
      >
        Try Again
      </button>
    )}
  </div>
);

export const DashboardErrorComponent: React.FC<{
  error: Error;
  resetError?: () => void;
}> = ({ error, resetError }) => (
  <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-amber-500 max-w-lg mx-auto my-8">
    <h3 className="text-lg font-semibold text-gray-800 mb-2">
      Dashboard Error
    </h3>
    <p className="text-sm text-gray-600 mb-4">
      {error.message || "We couldn't load your dashboard at this time."}
    </p>
    {resetError && (
      <button
        onClick={resetError}
        className="px-4 py-2 bg-amber-500 text-white rounded hover:bg-amber-600 transition-colors"
      >
        Reload Dashboard
      </button>
    )}
  </div>
);

// Example loading states for different components
export const OnboardingLoadingComponent: React.FC = () => (
  <div className="max-w-lg mx-auto my-16 text-center">
    <div className="mx-auto h-16 w-16 rounded-full bg-blue-50 flex items-center justify-center mb-6">
      <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
    </div>
    <h2 className="text-2xl font-bold text-gray-800 mb-2">
      Loading Your Workspace
    </h2>
    <p className="text-gray-600">
      We're preparing your onboarding experience...
    </p>
  </div>
);

export const DashboardLoadingComponent: React.FC = () => (
  <div className="flex flex-col items-center justify-center min-h-[400px]">
    <Loader2 className="h-8 w-8 text-blue-600 animate-spin mb-4" />
    <p className="text-gray-600 font-medium">Loading dashboard data...</p>
  </div>
);

// Registry for component error and loading states
// ==============================================
type ComponentType =
  | "onboarding"
  | "dashboard"
  | "settings"
  | "profile"
  | "default";

interface ComponentStateMap {
  [key: string]: {
    ErrorComponent: React.ComponentType<{
      error: Error;
      resetError?: () => void;
    }>;
    LoadingComponent: React.ComponentType;
  };
}

// Map component types to their error and loading components
const componentRegistry: ComponentStateMap = {
  onboarding: {
    ErrorComponent: OnboardingErrorComponent,
    LoadingComponent: OnboardingLoadingComponent,
  },
  dashboard: {
    ErrorComponent: DashboardErrorComponent,
    LoadingComponent: DashboardLoadingComponent,
  },
  // Add more component types and their error/loading states as needed

  // Default fallback components
  default: {
    ErrorComponent: ({ error, resetError }) => (
      <div className="p-6 rounded-lg bg-gray-50 border border-gray-200 max-w-md mx-auto my-8">
        <h3 className="text-lg font-medium text-gray-800 mb-2">
          Something went wrong
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          {error.message || "An unexpected error occurred"}
        </p>
        {resetError && (
          <button
            onClick={resetError}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        )}
      </div>
    ),
    LoadingComponent: () => (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
      </div>
    ),
  },
};

// Helper function to get the appropriate error/loading components
export const getComponentStates = (componentType: ComponentType) => {
  return componentRegistry[componentType] || componentRegistry.default;
};

export default getComponentStates;
