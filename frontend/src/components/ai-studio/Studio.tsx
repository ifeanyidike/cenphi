// components/ai-studio/EnhancedAIStudio.tsx
import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from "react";
import { observer } from "mobx-react-lite";
import { AnimatePresence } from "framer-motion";
import { Cpu, Info, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DefaultSettings, ServiceType } from "@/types/ai-service";
import { AI_SERVICES } from "./definitions";
import ServiceConfigPage from "./service-config";
import Toast, { ToastType } from "./Toast";
import TestimonialSelector from "./TestimonialSelector";
import Services from "./Services";
import { workspaceHub } from "@/repo/workspace_hub";
import { aiStudioManager } from "@/repo/managers/ai_studio_manager";
import { Alert, AlertDescription } from "../ui/alert";
import IndustryAwarenessIndicator from "./IndustryAwareIndicator";
import { preset_manager } from "@/repo/managers/preset_manager";

const AIStudio: React.FC = observer(() => {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [toast, setToast] = useState<{
    message: ReactNode;
    type: string;
  } | null>(null);

  const testimonials = workspaceHub.testimonialManager.testimonials;
  const mountedRef = useRef(true);
  const { connectionStatus, jobs: _jobs, streamingResults: _streamingResults } = aiStudioManager;

  // Remove the deprecated monitor tab logic

  useEffect(() => {
    preset_manager.initialize();
  });

  useEffect(() => {
    mountedRef.current = true;
    aiStudioManager.initialize();

    return () => {
      mountedRef.current = false;
      // clean up is handled internally in ai studio manager
    };
  }, []);

  const showToast = useCallback((options: any) => {
    setToast(options);
    setTimeout(() => setToast(null), 8000);
  }, []);

  const handleTestimonialSelectionChange = useCallback(
    (testimonialIds: string[]) => {
      aiStudioManager.handleTestimonialsChanged(testimonialIds);
    },
    []
  );

  const processService = async (serviceId: string, config: DefaultSettings) => {
    if (aiStudioManager.selectedTestimonials.length === 0) {
      showToast({
        message: "Please select at least one testimonial to process",
        type: "error",
      });
      return;
    }

    const service = AI_SERVICES.find((s) => s.id === serviceId);
    if (!service) {
      showToast({ message: "Service not found", type: "error" });
      return;
    }

    // Enhanced user feedback for batch processing
    const batchSupportedServices = ["content_generation", "text_polishing", "translation"];
    const selectedCount = aiStudioManager.selectedTestimonials.length;
    const supportsBatch = batchSupportedServices.includes(serviceId);

    // Inform user about processing behavior
    if (selectedCount > 1) {
      if (supportsBatch) {
        showToast({
          message: (
            <div>
              <div className="font-medium">{service.title} - Batch Processing</div>
              <div className="text-sm opacity-90">Processing all {selectedCount} selected testimonials together</div>
            </div>
          ),
          type: "info",
        });
      } else {
        showToast({
          message: (
            <div>
              <div className="font-medium">{service.title} - Single Processing</div>
              <div className="text-sm opacity-90">Processing the first selected testimonial only</div>
            </div>
          ),
          type: "warning",
        });
      }
    }

    aiStudioManager.setActiveService(null);

    try {
      await aiStudioManager.startJob(
        serviceId as ServiceType,
        [],
        undefined,
        config,
        aiStudioManager.activeService || service
      );

      const processingText = supportsBatch && selectedCount > 1
        ? `Processing ${selectedCount} testimonials`
        : "Processing testimonial";

      showToast({
        message: (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span>{service?.title} {processingText.toLowerCase()} - you'll be notified when complete.</span>
          </div>
        ),
        type: "success",
      });
    } catch (error: any) {
      showToast({
        message: `Failed to start ${service.title}: ${error.message}`,
        type: "error",
      });
    }
  };

  // Handle processing
  const handleProcessImmediate = async (serviceId: ServiceType) => {
    const config = await preset_manager.getConfig(serviceId);
    processService(serviceId, config);
  };

  const handleStreamingProcess = (serviceId: string, config: any) => {
    processService(serviceId, config);
  };

  const handleCustomizeProcess = (serviceId: ServiceType) => {
    aiStudioManager.setActiveService(serviceId);
  };

  if (aiStudioManager.activeService) {
    return (
      <ServiceConfigPage
        service={aiStudioManager.activeService}
        selectedTestimonials={aiStudioManager.selectedTestimonials}
        onBack={() => aiStudioManager.setActiveService(null)}
        onProcess={processService}
      />
    );
  }

  const renderIndustryHeader = () => {
    // if (!brandContext?.business_model) return null;

    return (
      <Alert className="mb-6 border-blue-200 bg-blue-50">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-medium">
                Industry-Intelligent Processing Active
              </span>
              <p className="text-sm mt-1">
                All AI services are optimized for your business context and
                audience.
              </p>
            </div>
            <IndustryAwarenessIndicator
              businessModel={"b2c"}
              targetAudience={"entrepreneurs"}
              tone={"professional"}
            />
          </div>
        </AlertDescription>
      </Alert>
    );
  };

  return (
    <div className="min-h-screen">
      {/* Updated Top Bar - Simple and Professional */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-14">
            {/* Left Side - Simple Title */}
            <div className="flex items-center space-x-3">
              <h1 className="text-lg font-medium text-gray-900">AI Studio</h1>
            </div>

            {/* Right Side - Status */}
            <div className="flex items-center space-x-4">
              {connectionStatus === "error" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => aiStudioManager.reconnect()}
                  className="text-xs"
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Reconnect
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {renderIndustryHeader()}

        <div className="space-y-8">
          <TestimonialSelector
            selectedTestimonials={aiStudioManager.selectedTestimonials}
            onSelectionChange={handleTestimonialSelectionChange}
            isCompact={aiStudioManager.selectedTestimonials.length > 0}
          />

          {Boolean(
            aiStudioManager.selectedTestimonials.length > 0 &&
              testimonials?.length
          ) ? (
            <Services
              handleCustomizeProcess={handleCustomizeProcess}
              handleProcessImmediate={handleProcessImmediate}
              handleStreamingProcess={handleStreamingProcess}
              selectedCategory={selectedCategory}
              selectedTestimonials={aiStudioManager.selectedTestimonials}
              setSelectedCategory={setSelectedCategory}
            />
          ) : (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Cpu className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Select Testimonials to Begin
              </h3>
              <p className="text-gray-600 max-w-md mx-auto">
                Choose one or more testimonials above to unlock AI services
                and start processing your content.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Toast Notifications */}
      <AnimatePresence>
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type as ToastType}
            onClose={() => setToast(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
});

export default AIStudio;
