import React, { useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { useNavigate } from "react-router-dom";
import { BusinessInfoCollection } from "./BusinessInfoCollection";
import { QuickIntent } from "./QuickIntent";
import { CaptureScreen } from "./CaptureScreen";
import { SSEProcessing } from "./SSEProcessing";
import { workspaceHub } from "@/repo/workspace_hub";
import LoadingIndicator from "../LoadingIndicator";

type OnboardingStep =
  | "business-info"
  | "intent"
  | "capture"
  | "processing"
  | "completed";

interface OnboardingProps {
  userId?: string;
  userName?: string;
}

interface BusinessInfo {
  companyName: string;
  websiteUrl?: string;
}

const Onboarding: React.FC<OnboardingProps> = observer(() => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] =
    useState<OnboardingStep>("business-info");
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo | null>(null);
  const [selectedIntent, setSelectedIntent] = useState<string | undefined>();
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [testimonialId, setTestimonialId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingOnboarding, setLoadingOnboarding] = useState(true);

  // Check if user already has workspace
  useEffect(() => {
    (async () => {
      setLoadingOnboarding(true);
      const hasWorkspace = await workspaceHub.getWorkspaceData();
      setLoadingOnboarding(false);
      if (hasWorkspace) navigate("/dashboard");
    })();
  }, []);

  const handleBusinessInfoNext = async (info: BusinessInfo) => {
    setIsLoading(true);
    setError(null);

    try {
      const workspaceId = await workspaceHub.setupOnboarding(
        info.companyName,
        info.websiteUrl || ""
      );
      if (workspaceId) setWorkspaceId(workspaceId.toString());
      window.history.replaceState(null, "", "/onboarding?flow=active");
      setBusinessInfo(info);
      setCurrentStep("intent");
    } catch (error: any) {
      console.error("Workspace creation failed:", error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleIntentNext = (intent?: string) => {
    setSelectedIntent(intent);
    setCurrentStep("capture");
  };

  const handleTestimonialCreated = (testimonialId: string) => {
    setTestimonialId(testimonialId);
    setCurrentStep("processing");
  };

  const handleProcessingComplete = () => {
    setCurrentStep("completed");
    // Navigate to dashboard to show the processed testimonial
    handleGoToDashboard();
  };

  const handleGoToDashboard = () => {
    navigate("/dashboard");
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
    console.error("Onboarding error:", errorMessage);
  };

  const handleRetry = () => {
    setError(null);
    // Reset to appropriate step based on current state
    if (!workspaceId) {
      setCurrentStep("business-info");
    } else if (!testimonialId) {
      setCurrentStep("capture");
    }
  };

  if (loadingOnboarding) return <LoadingIndicator />;

  // Error display
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-2xl mx-auto flex items-center justify-center mb-4">
              <span className="text-2xl">⚠️</span>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              Something went wrong
            </h2>
            <p className="text-sm text-gray-600 mb-6">{error}</p>
            <div className="flex space-x-3">
              <button
                onClick={() => navigate("/login")}
                className="flex-1 py-3 px-4 text-sm font-medium text-gray-600 hover:text-gray-800 border border-gray-200 rounded-2xl hover:bg-gray-50 transition-colors"
              >
                Back to Login
              </button>
              <button
                onClick={handleRetry}
                className="flex-1 py-3 px-4 bg-gray-900 hover:bg-black text-white font-semibold rounded-2xl transition-colors text-sm"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render current step
  const renderCurrentStep = () => {
    switch (currentStep) {
      case "business-info":
        return (
          <BusinessInfoCollection
            onNext={handleBusinessInfoNext}
            isLoading={isLoading}
            initialData={businessInfo || undefined}
          />
        );

      case "intent":
        return <QuickIntent onNext={handleIntentNext} isLoading={isLoading} />;

      case "capture":
        if (!workspaceId) {
          handleError("Workspace not created. Please try again.");
          return null;
        }
        return (
          <CaptureScreen
            onTestimonialCreated={handleTestimonialCreated}
            workspaceId={workspaceId || ""}
            intent={selectedIntent}
            onSkip={() => navigate("/dashboard")}
          />
        );

      case "processing":
        if (!testimonialId) {
          handleError("No testimonial to process. Please try again.");
          return null;
        }
        return (
          <SSEProcessing
            testimonialId={testimonialId}
            onComplete={handleProcessingComplete}
            onGoToDashboard={handleGoToDashboard}
            fileName="testimonial.mp4"
          />
        );

      default:
        return null;
    }
  };

  return <div className="onboarding-flow">{renderCurrentStep()}</div>;
});

export default Onboarding;
