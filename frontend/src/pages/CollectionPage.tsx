import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import TypeSelection from "@/components/testimonial-collection/TypeSelection";
import VideoRecording from "@/components/testimonial-collection/VideoRecording";
import TextTestimonial from "@/components/testimonial-collection/TextTestimonial";
import SuccessView from "@/components/testimonial-collection/SuccessView";

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
  const [step, setStep] = useState<"selection" | "video" | "text" | "success">(
    "selection"
  );
  const [formData, setFormData] = useState<TestimonialFormData>({
    name: "",
    email: "",
    company: "",
    textContent: "",
    rating: 5,
  });

  // Extract URL parameters and prefill form data
  useEffect(() => {
    const workspaceId = searchParams.get("workspace_id");
    const token = searchParams.get("token");
    const email = searchParams.get("email");
    const contactName = searchParams.get("contact_name");
    const company = searchParams.get("company");

    // Update form data with URL parameters
    setFormData((prev) => ({
      ...prev,
      workspaceId: workspaceId || undefined,
      token: token || undefined,
      email: email || prev.email,
      name: contactName || prev.name,
      company: company || prev.company,
    }));
  }, [searchParams]);

  const handleSelectType = (type: "video" | "text") => {
    setStep(type);
  };

  const handleSubmitSuccess = () => {
    setStep("success");
  };

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
              <VideoRecording
                onSubmitSuccess={handleSubmitSuccess}
                formData={formData}
                setFormData={setFormData}
              />
            )}
            {step === "text" && (
              <TextTestimonial
                onSubmitSuccess={handleSubmitSuccess}
                formData={formData}
                setFormData={setFormData}
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
