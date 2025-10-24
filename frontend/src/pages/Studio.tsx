/**
 * AI Processing Studio - Standardized Entry Point & Context Management
 *
 * This component manages the AI studio workflow with smart context detection and fallbacks.
 *
 * ### Entry Points (All Standardized):
 * 1. **Sidebar Link** (`/studio`) - Shows service selector, prompts for testimonial if needed
 * 2. **Dashboard Card** (`/studio?testimonialId=X`) - Pre-selected testimonial, shows services
 * 3. **Testimonial Details** (`/studio/optimize?testimonialId=X`) - Direct to service config
 * 4. **Clips Selection** (`/studio/optimize?testimonialId=X&clipId=Y`) - Process specific clip
 * 5. **Best Moments** (`/studio/story?context=best-moments`) - Auto-select best testimonials
 *
 * ### Context Types:
 * - `default` - No selection, requires testimonial picker
 * - `testimonial` - Single testimonial selected
 * - `clip` - Single clip selected
 * - `selected-clips` - Multiple clips selected
 * - `multi-testimonial` - Multiple testimonials selected
 * - `best-moments` - Auto-select best testimonials
 *
 * ### Flow Logic:
 * 1. Parse URL for service route and context parameters
 * 2. If service requires context and none exists → Show TestimonialSelector
 * 3. If context exists → Show service configuration
 * 4. After configuration → Start processing with SessionStudio/StoryVideoStudio
 *
 * ### Context Requirements by Service:
 * - `platform_optimization` - Requires testimonial or clip
 * - `clipping` - Requires testimonial
 * - `custom_pipeline` - Requires testimonial or clip
 * - `story_video` - Optional (can work with no context for best moments)
 * - `content_generation` - Requires testimonials (at least one)
 */

import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import ServiceSelector from "@/components/studio/ServiceSelector";
import PlatformOptimizationConfig from "@/components/studio/PlatformOptimizationConfig";
import ClippingConfig from "@/components/studio/ClippingConfig";
import StoryVideoConfig from "@/components/studio/StoryVideoConfig";
import ContentGenerationConfig from "@/components/studio/ContentGenerationConfig";
import CustomPipelineConfig from "@/components/studio/CustomPipelineConfig";
import SessionStudio from "@/components/studio/SessionStudio";
import StoryVideoStudio from "@/components/studio/StoryVideoStudio";
import TestimonialSelector from "@/components/studio/TestimonialSelector";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { studioAPI } from "@/services/studioAPI";

export type ServiceType =
  | "platform_optimization"
  | "clipping"
  | "story_video"
  | "content_generation"
  | "custom_pipeline";

export type StudioContext =
  | { type: "testimonial"; testimonialId: string }
  | { type: "clip"; testimonialId: string; clipId: string }
  | { type: "selected-clips"; testimonialId: string; clipIds: string[] }
  | { type: "multi-testimonial"; testimonialIds: string[] }
  | { type: "best-moments"; testimonialIds?: string[] }
  | { type: "default" };

type StudioStep = "service-selection" | "testimonial-selection" | "service-configuration" | "processing";

const Studio: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const [context, setContext] = useState<StudioContext>({ type: "default" });
  const [currentStep, setCurrentStep] =
    useState<StudioStep>("service-selection");
  const [selectedService, setSelectedService] = useState<ServiceType | null>(
    null
  );
  const [jobId, setJobId] = useState<string | null>(null);
  const [isCheckingActiveSessions, setIsCheckingActiveSessions] =
    useState(false);

  // Track last checked to avoid duplicate session recovery checks
  const lastCheckedRef = useRef<string | null>(null);

  // Determine service and step from URL path
  useEffect(() => {
    const pathname = location.pathname;

    if (pathname === "/studio") {
      setCurrentStep("service-selection");
      setSelectedService(null);
      // Clear check ref when returning to service selector
      lastCheckedRef.current = null;
    } else if (pathname === "/studio/optimize") {
      setSelectedService("platform_optimization");
      // Check if we need testimonial selection
      if (context.type === 'default' && serviceRequiresContext('platform_optimization')) {
        setCurrentStep("testimonial-selection");
      } else {
        setCurrentStep("service-configuration");
      }
    } else if (pathname === "/studio/clipping") {
      setSelectedService("clipping");
      // Check if we need testimonial selection
      if (context.type === 'default' && serviceRequiresContext('clipping')) {
        setCurrentStep("testimonial-selection");
      } else {
        setCurrentStep("service-configuration");
      }
    } else if (pathname === "/studio/story") {
      setSelectedService("story_video");
      // Story video can work with no context (best moments), but if no context and no query params,
      // show testimonial selector to let user choose
      if (context.type === 'default' && !searchParams.get('context')) {
        setCurrentStep("testimonial-selection");
      } else {
        setCurrentStep("service-configuration");
      }
    } else if (pathname === "/studio/content") {
      setSelectedService("content_generation");
      // Content generation requires testimonials
      if (context.type === 'default') {
        setCurrentStep("testimonial-selection");
      } else {
        setCurrentStep("service-configuration");
      }
    } else if (pathname === "/studio/custom") {
      setSelectedService("custom_pipeline");
      // Check if we need testimonial selection
      if (context.type === 'default' && serviceRequiresContext('custom_pipeline')) {
        setCurrentStep("testimonial-selection");
      } else {
        setCurrentStep("service-configuration");
      }
    }
  }, [location.pathname, context.type, searchParams]);

  // Extract context from URL parameters whenever they change
  useEffect(() => {
    try {
      const testimonialId = searchParams.get("testimonialId");
      const testimonialIds = searchParams.get("testimonialIds");
      const clipIds = searchParams.get("clipIds");
      const contextType = searchParams.get("context");
      const legacyTestimonials = searchParams.get("testimonials");

      let newContext: StudioContext = { type: "default" };

      if (contextType === "best-moments") {
        // Best moments can optionally specify testimonials
        const multiIds = testimonialIds || legacyTestimonials;
        if (multiIds && multiIds.trim()) {
          const ids = multiIds
            .split(",")
            .map((id) => id.trim())
            .filter(Boolean);
          newContext = {
            type: "best-moments",
            testimonialIds: ids,
          };
        } else {
          newContext = { type: "best-moments" };
        }
      } else {
        // Handle multi-testimonial (either new param or legacy param)
        const multiIds = testimonialIds || legacyTestimonials;
        if (multiIds && multiIds.trim()) {
          const ids = multiIds
            .split(",")
            .map((id) => id.trim())
            .filter(Boolean);
          // If only one ID, treat as single testimonial
          if (ids.length === 1) {
            newContext = {
              type: "testimonial",
              testimonialId: ids[0],
            };
          } else if (ids.length > 1) {
            newContext = {
              type: "multi-testimonial",
              testimonialIds: ids,
            };
          }
        } else if (testimonialId && testimonialId.trim()) {
          const clipId = searchParams.get("clipId");

          if (clipId && clipId.trim()) {
            // Single clip context
            newContext = {
              type: "clip",
              testimonialId: testimonialId.trim(),
              clipId: clipId.trim(),
            };
          } else if (clipIds && clipIds.trim()) {
            // Multiple clips context
            newContext = {
              type: "selected-clips",
              testimonialId: testimonialId.trim(),
              clipIds: clipIds
                .split(",")
                .map((id) => id.trim())
                .filter(Boolean),
            };
          } else {
            // Testimonial context
            newContext = {
              type: "testimonial",
              testimonialId: testimonialId.trim(),
            };
          }
        }
      }

      setContext(newContext);
    } catch (error) {
      console.error("[Studio] Error parsing URL params:", error);
      setContext({ type: "default" });
    }
  }, [searchParams]);

  // Service-Specific Session Recovery: Only check for active sessions when on a service route
  useEffect(() => {
    const pathname = location.pathname;
    const testimonialId = searchParams.get("testimonialId");

    // Only check on service-specific routes (not on /studio)
    if (pathname === "/studio") {
      return;
    }

    // Must have a service selected and testimonialId
    if (!selectedService || !testimonialId) {
      return;
    }

    // Create unique check key combining testimonialId and service
    const checkKey = `${testimonialId}-${selectedService}`;

    // Avoid duplicate checks
    if (lastCheckedRef.current === checkKey) {
      return;
    }

    const checkForActiveSessions = async () => {
      lastCheckedRef.current = checkKey;
      setIsCheckingActiveSessions(true);

      try {
        const response = await studioAPI.getActiveSessions({
          testimonialId,
        });

        // Filter sessions by current service type AND exclude completed/cancelled sessions
        const serviceSpecificSessions = response.sessions?.filter(
          (session) =>
            session.session_type === selectedService &&
            session.status !== "completed" &&
            session.status !== "cancelled" &&
            session.status !== "partial_saved"
        );

        // If there's an active session for THIS service, recover it
        if (serviceSpecificSessions && serviceSpecificSessions.length > 0) {
          const activeSession = serviceSpecificSessions[0];
          setJobId(activeSession.session_id);
          setCurrentStep("processing");
        }
      } catch (error) {
        console.error("[Studio] Failed to check for active sessions:", error);
        // Continue with normal flow on error
      } finally {
        setIsCheckingActiveSessions(false);
      }
    };

    checkForActiveSessions();
  }, [location.pathname, selectedService, searchParams]); // Check when path, service, or params change

  // Check if service requires context (testimonial/clip selection)
  const serviceRequiresContext = (service: ServiceType): boolean => {
    // These services need at least a testimonial selected
    return ['platform_optimization', 'clipping', 'custom_pipeline'].includes(service);
  };

  const handleServiceSelect = (service: ServiceType) => {
    // Check if service requires context and we don't have it
    if (serviceRequiresContext(service) && context.type === 'default') {
      // Show testimonial selector instead of service config
      setSelectedService(service);
      setCurrentStep('testimonial-selection');
      return;
    }

    // Navigate to service-specific route with current URL params
    const serviceRoutes: Record<ServiceType, string> = {
      platform_optimization: "/studio/optimize",
      clipping: "/studio/clipping",
      story_video: "/studio/story",
      content_generation: "/studio/content",
      custom_pipeline: "/studio/custom",
    };

    const route = serviceRoutes[service];
    navigate(`${route}?${searchParams.toString()}`);
  };

  const handleTestimonialSelect = (testimonialId: string) => {
    // Update context with selected testimonial
    const newContext: StudioContext = {
      type: 'testimonial',
      testimonialId,
    };
    setContext(newContext);

    // Navigate to service config with testimonial ID
    const serviceRoutes: Record<ServiceType, string> = {
      platform_optimization: "/studio/optimize",
      clipping: "/studio/clipping",
      story_video: "/studio/story",
      content_generation: "/studio/content",
      custom_pipeline: "/studio/custom",
    };

    if (selectedService) {
      const route = serviceRoutes[selectedService];
      navigate(`${route}?testimonialId=${testimonialId}`);
    }
  };

  const handleMultiTestimonialSelect = (testimonialIds: string[]) => {
    // Update context with multiple testimonials
    const newContext: StudioContext = {
      type: 'multi-testimonial',
      testimonialIds,
    };
    setContext(newContext);

    // Navigate to service config with multiple testimonial IDs
    const serviceRoutes: Record<ServiceType, string> = {
      platform_optimization: "/studio/optimize",
      clipping: "/studio/clipping",
      story_video: "/studio/story",
      content_generation: "/studio/content",
      custom_pipeline: "/studio/custom",
    };

    if (selectedService) {
      const route = serviceRoutes[selectedService];
      const testimonialIdsParam = testimonialIds.join(',');
      navigate(`${route}?testimonialIds=${testimonialIdsParam}`);
    }
  };

  const handleBackToServiceSelection = () => {
    // Clear selected service and navigate back to main studio
    setSelectedService(null);
    setCurrentStep('service-selection');
    navigate(`/studio`);
  };

  const handleStartProcessing = (jobId: string, _autoProceed?: boolean) => {
    // Note: autoProceed is stored in the session on backend and read from session data by processing components
    // We keep the parameter for compatibility but don't use it here
    setJobId(jobId);
    setCurrentStep("processing");
  };

  const handleProcessingComplete = () => {
    setJobId(null);
    // Navigate back to service selector
    navigate(`/studio?${searchParams.toString()}`);
  };

  const handleCancel = () => {
    navigate("/dashboard"); // Go back to dashboard
  };

  return (
      <div className="min-h-screen bg-white">
        {/* Step 1: Service Selection */}
        {currentStep === "service-selection" && (
          <motion.div
            key="service-selection"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {isCheckingActiveSessions ? (
              <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                  <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-slate-600">
                    Checking for active sessions...
                  </p>
                </div>
              </div>
            ) : (
              <ServiceSelector
                context={context}
                onServiceSelect={handleServiceSelect}
                onCancel={handleCancel}
              />
            )}
          </motion.div>
        )}

        {/* Step 1.5: Testimonial Selection (when no context) */}
        {currentStep === "testimonial-selection" && (
          <motion.div
            key="testimonial-selection"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.3 }}
          >
            <TestimonialSelector
              selectedService={selectedService}
              onTestimonialSelect={handleTestimonialSelect}
              onMultiTestimonialSelect={handleMultiTestimonialSelect}
              onCancel={handleBackToServiceSelection}
            />
          </motion.div>
        )}

        {/* Step 2: Service Configuration */}
        {currentStep === "service-configuration" &&
          selectedService === "platform_optimization" && (
            <motion.div
              key="platform-config"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.3 }}
            >
              <PlatformOptimizationConfig
                context={context}
                onBack={handleBackToServiceSelection}
                onStartProcessing={handleStartProcessing}
              />
            </motion.div>
          )}

        {currentStep === "service-configuration" &&
          selectedService === "clipping" && (
            <motion.div
              key="clipping-config"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.3 }}
            >
              <ClippingConfig
                context={context}
                onBack={handleBackToServiceSelection}
                onStartProcessing={handleStartProcessing}
              />
            </motion.div>
          )}

        {currentStep === "service-configuration" &&
          selectedService === "story_video" && (
            <motion.div
              key="story-video-config"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.3 }}
            >
              <StoryVideoConfig
                context={context}
                onBack={handleBackToServiceSelection}
                onStartProcessing={handleStartProcessing}
              />
            </motion.div>
          )}

        {currentStep === "service-configuration" &&
          selectedService === "content_generation" && (
            <motion.div
              key="content-generation-config"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.3 }}
            >
              <ContentGenerationConfig
                context={context}
                onBack={handleBackToServiceSelection}
              />
            </motion.div>
          )}

        {currentStep === "service-configuration" &&
          selectedService === "custom_pipeline" && (
            <motion.div
              key="custom-pipeline-config"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.3 }}
            >
              <CustomPipelineConfig
                context={context}
                onBack={handleBackToServiceSelection}
                onStartProcessing={handleStartProcessing}
              />
            </motion.div>
          )}

        {/* Step 3: Processing */}
        {currentStep === "processing" &&
          jobId &&
          (selectedService === "platform_optimization" ||
            selectedService === "clipping" ||
            selectedService === "custom_pipeline") && (
            <SessionStudio
              sessionId={jobId}
              testimonialId={
                context.type === "testimonial" || context.type === "clip" || context.type === "selected-clips"
                  ? context.testimonialId
                  : undefined
              }
              onClose={handleProcessingComplete}
            />
          )}

        {currentStep === "processing" &&
          jobId &&
          selectedService === "story_video" && (
            <StoryVideoStudio
              sessionId={jobId}
              testimonialIds={
                context.type === "multi-testimonial"
                  ? context.testimonialIds
                  : context.type === "testimonial"
                    ? [context.testimonialId]
                    : context.type === "best-moments" && context.testimonialIds
                      ? context.testimonialIds
                      : []
              }
              autoSelectBest={
                context.type === "best-moments" && !context.testimonialIds
              }
              onClose={handleProcessingComplete}
            />
          )}
      </div>
  );
};

export default Studio;
