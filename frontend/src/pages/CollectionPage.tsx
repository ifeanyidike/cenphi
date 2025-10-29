import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import TypeSelection from "@/components/testimonial-collection/TypeSelection";
import VideoCapture from "@/components/testimonial-collection/VideoCapture";
import TextTestimonial from "@/components/testimonial-collection/TextTestimonial";
import VoiceTestimonial from "@/components/testimonial-collection/VoiceTestimonial";
import SuccessView from "@/components/testimonial-collection/SuccessView";
import WorkspaceRequired from "@/components/common/WorkspaceRequired";

interface TestimonialFormData {
  name: string;
  email: string;
  company: string;
  textContent: string;
  rating: number;
  workspaceId?: string;
  token?: string;
}

const CollectionPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState<
    "selection" | "video" | "text" | "voice" | "success"
  >("selection");
  const [formData, setFormData] = useState<TestimonialFormData>({
    name: "",
    email: "",
    company: "",
    textContent: "",
    rating: 5,
  });
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [isValidatingWorkspace, setIsValidatingWorkspace] = useState(true);

  // Extract URL parameters and prefill form data
  useEffect(() => {
    const workspaceIdParam = searchParams.get("workspace_id");
    const token = searchParams.get("token");
    const email = searchParams.get("email");
    const contactName = searchParams.get("contact_name");
    const company = searchParams.get("company");

    // Validate workspace ID
    if (!workspaceIdParam || workspaceIdParam.trim() === "") {
      setIsValidatingWorkspace(false);
      return;
    }

    setWorkspaceId(workspaceIdParam);
    setIsValidatingWorkspace(false);

    // Update form data with URL parameters
    setFormData((prev) => ({
      ...prev,
      workspaceId: workspaceIdParam,
      token: token || undefined,
      email: email || prev.email,
      name: contactName || prev.name,
      company: company || prev.company,
    }));
  }, [searchParams]);

  const handleSelectType = (type: "video" | "text" | "voice") => {
    setStep(type);
  };

  const handleSubmitSuccess = (testimonialId?: string) => {
    // Store testimonialId for success page if needed
    if (testimonialId) {
      console.log("Testimonial created with ID:", testimonialId);
    }
    setStep("success");
  };

  // Show loading while validating workspace
  if (isValidatingWorkspace) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Validating workspace...</p>
        </div>
      </div>
    );
  }

  // Show workspace required message if no valid workspace ID
  if (!workspaceId) {
    return (
      <WorkspaceRequired
        message="This testimonial collection page requires a valid workspace ID. Please use the correct link provided by the workspace owner."
        showBackButton={false}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {step === "selection" && (
              <TypeSelection onSelectType={handleSelectType} />
            )}
            {step === "video" && (
              <VideoCapture
                onSubmitSuccess={handleSubmitSuccess}
                formData={formData}
                setFormData={setFormData}
                workspaceId={workspaceId}
              />
            )}
            {step === "text" && (
              <TextTestimonial
                onSubmitSuccess={handleSubmitSuccess}
                formData={formData}
                setFormData={setFormData}
                workspaceId={workspaceId}
              />
            )}
            {step === "voice" && (
              <VoiceTestimonial
                onBack={() => setStep("selection")}
                onComplete={handleSubmitSuccess}
                formData={formData}
                workspaceId={workspaceId}
              />
            )}
            {step === "success" && <SuccessView />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default CollectionPage;
