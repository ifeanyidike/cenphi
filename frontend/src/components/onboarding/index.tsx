import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Check, CheckCircle } from "lucide-react";
import Navbar from "@/components/nav";
import Footer from "@/components/custom/footer";
import { FormErrors, OnboardingFormData } from "./types";
import { companySizes, industries, stepSetup } from "./data";
import FeaturesColumn from "./FeaturesColumn";
import Form from "./Form";
import { workspaceRepo } from "@/repositories/workspaceRepository";
import { observer } from "mobx-react-lite";

const Onboarding: React.FC = observer(() => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<OnboardingFormData>({
    businessName: "",
    websiteUrl: "",
    industry: "",
    companySize: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [progress, setProgress] = useState(25);
  const [formCompleted, setFormCompleted] = useState(false);
  // const [initialized, setInitialized] = useState(false);

  // useEffect(() => {
  //   if (initialized) return;
  // }, []);

  useEffect(() => {
    setProgress(currentStep * 25);
  }, [currentStep]);

  useEffect(() => {
    if (formCompleted) {
      const timer = setTimeout(() => {
        navigate("/dashboard");
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [formCompleted, navigate]);

  const validateForm = (step: number): boolean => {
    const newErrors: FormErrors = {};

    if (step === 1) {
      if (!formData.businessName.trim()) {
        newErrors.businessName = "Business name is required";
      }
    } else if (step === 2) {
      if (!formData.websiteUrl.trim()) {
        newErrors.websiteUrl = "Website URL is required";
      } else if (
        !/^(https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)$/.test(
          formData.websiteUrl
        )
      ) {
        newErrors.websiteUrl = "Please enter a valid website URL";
      }
    } else if (step === 3) {
      if (!formData.industry) {
        newErrors.industry = "Please select an industry";
      }
    } else if (step === 4) {
      if (!formData.companySize) {
        newErrors.companySize = "Please select your company size";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user types
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm(currentStep)) return;

    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate API call
      //   await new Promise((resolve) => setTimeout(resolve, 1500));
      const updates = {
        name: formData.businessName,
        website_url: formData.websiteUrl,
        industry: formData.industry,
      };
      await workspaceRepo.update(updates);
      setFormCompleted(true);
    } catch (error) {
      console.error("Onboarding error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  //   const goToNextStep = () => {
  //     if (validateForm(currentStep)) {
  //       setCurrentStep(currentStep + 1);
  //     }
  //   };

  const goToPreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleIndustrySelect = (industry: string) => {
    setFormData((prev) => ({
      ...prev,
      industry,
    }));

    // Clear error when selection is made
    if (errors.industry) {
      setErrors((prev) => ({
        ...prev,
        industry: undefined,
      }));
    }
  };

  const handleCompanySizeSelect = (size: string) => {
    setFormData((prev) => ({
      ...prev,
      companySize: size,
    }));

    // Clear error when selection is made
    if (errors.companySize) {
      setErrors((prev) => ({
        ...prev,
        companySize: undefined,
      }));
    }
  };

  const steps = stepSetup(currentStep);

  return (
    <div className="bg-gradient-to-br from-indigo-50 via-white to-blue-50 overflow-hidden">
      <Navbar alwaysDarkText />
      <div className=" pt-24 pb-0  relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full opacity-20 blur-3xl animate-pulse"></div>
          <div
            className="absolute top-1/2 -left-40 w-80 h-80 bg-purple-200 rounded-full opacity-20 blur-3xl animate-pulse"
            style={{ animationDelay: "1s" }}
          ></div>
          <div
            className="absolute -bottom-40 right-1/3 w-80 h-80 bg-amber-200 rounded-full opacity-20 blur-3xl animate-pulse"
            style={{ animationDelay: "2s" }}
          ></div>
        </div>

        <div className="container mx-auto px-4 pt-8 pb-16 relative z-10">
          {/* <header className="flex justify-center mb-8">
            <div className="relative text-3xl font-playball">
              Cenphi
              <img
                src="/api/placeholder/160/50"
                alt="Cenphi.io"
                className="h-12 w-auto"
              />
            </div>
          </header> */}

          {formCompleted ? (
            <div className="max-w-lg mx-auto text-center bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 p-8 animate-fadeIn">
              <div className="h-20 w-20 bg-green-100 rounded-full mx-auto flex items-center justify-center mb-6">
                <CheckCircle className="h-10 w-10 text-green-500" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Workspace Created Successfully!
              </h2>
              <p className="text-gray-600 mb-8">
                We're redirecting you to your new dashboard...
              </p>
              <div className="w-full bg-gray-200 h-1 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 animate-loadingBar"></div>
              </div>
            </div>
          ) : (
            <div className="max-w-screen-xl mx-auto grid md:grid-cols-6 gap-8">
              {/* Left column with form */}
              <div className="md:col-span-4">
                <div className="bg-white rounded-2xl md:rounded-3xl shadow-xl overflow-hidden border border-gray-100">
                  {/* Progress bar */}
                  <div className="px-8 py-8 border-b border-gray-100">
                    <div className="flex items-center space-x-2 mb-4">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white font-medium">
                        {currentStep}
                      </div>
                      <h1 className="text-2xl font-bold text-gray-800">
                        Set up your Cenphi workspace
                      </h1>
                    </div>
                    <div className="space-y-4">
                      <div className="flex justify-between text-xs text-gray-500 mb-4">
                        <span>Getting started</span>
                        <span>{progress}% complete</span>
                      </div>
                      <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-600 rounded-full transition-all duration-500 ease-out"
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                      {/* Progress steps */}
                      <div className="flex justify-between mt-2">
                        {steps.map((step, idx) => (
                          <div key={idx} className="flex flex-col items-center">
                            <div
                              className={`w-5 h-5 rounded-full flex items-center justify-center ${
                                step.status === "complete"
                                  ? "bg-blue-600"
                                  : step.status === "current"
                                  ? "border-2 border-blue-600"
                                  : "border-2 border-gray-300"
                              }`}
                            >
                              {step.status === "complete" && (
                                <Check className="h-3.5 w-3.5 text-white" />
                              )}
                            </div>
                            <span
                              className={`text-xs mt-1 ${
                                step.status === "complete" ||
                                step.status === "current"
                                  ? "text-blue-600 font-medium"
                                  : "text-gray-400"
                              }`}
                            >
                              {step.name}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <Form
                    companySizes={companySizes}
                    handleCompanySizeSelect={handleCompanySizeSelect}
                    errors={errors}
                    formData={formData}
                    handleIndustrySelect={handleIndustrySelect}
                    industries={industries}
                    currentStep={currentStep}
                    goToPreviousStep={goToPreviousStep}
                    handleInputChange={handleInputChange}
                    handleSubmit={handleSubmit}
                    isSubmitting={isSubmitting}
                    stepSize={steps.length}
                  />
                </div>
              </div>

              {/* Right column with benefits */}
              <FeaturesColumn />
            </div>
          )}
        </div>
      </div>
      <Footer />

      {/* Global CSS for animations */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes loadingBar {
          0% {
            width: 0%;
          }
          100% {
            width: 100%;
          }
        }

        @keyframes pulse {
          0%,
          100% {
            opacity: 0.2;
          }
          50% {
            opacity: 0.3;
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out forwards;
        }

        .animate-loadingBar {
          animation: loadingBar 2s ease-out forwards;
        }

        .animate-pulse {
          animation: pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        .perspective {
          perspective: 1000px;
        }

        .rotate-x-12 {
          transform: rotateX(12deg);
        }
      `}</style>
    </div>
  );
});

export default Onboarding;
