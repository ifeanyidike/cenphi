import React, { useState } from "react";
import { motion } from "framer-motion";
import { Building2, Globe, ArrowRight, SkipForward, Check } from "lucide-react";

interface BusinessInfoProps {
  onNext: (info: { companyName: string; websiteUrl?: string }) => void;
  isLoading?: boolean;
  initialData?: {
    companyName?: string;
    websiteUrl?: string;
  };
}

interface FormData {
  companyName: string;
  websiteUrl: string;
}

interface FormErrors {
  companyName?: string;
  websiteUrl?: string;
}

export const BusinessInfoCollection: React.FC<BusinessInfoProps> = ({
  onNext,
  isLoading = false,
  initialData,
}) => {
  const [formData, setFormData] = useState<FormData>({
    companyName: initialData?.companyName || "",
    websiteUrl: initialData?.websiteUrl || "",
  });

  const [errors, setErrors] = useState<FormErrors>({});

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.companyName.trim()) {
      newErrors.companyName = "Company name is required";
    }

    if (formData.websiteUrl && formData.websiteUrl.trim()) {
      const urlPattern =
        /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
      if (!urlPattern.test(formData.websiteUrl.trim())) {
        newErrors.websiteUrl = "Please enter a valid website URL";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm() || isLoading) return;

    const websiteUrl = formData.websiteUrl.trim();
    const finalUrl =
      websiteUrl && !websiteUrl.startsWith("http")
        ? `https://${websiteUrl}`
        : websiteUrl;

    onNext({
      companyName: formData.companyName.trim(),
      websiteUrl: finalUrl || undefined,
    });
  };

  const handleSkip = () => {
    if (formData.companyName.trim()) {
      onNext({
        companyName: formData.companyName.trim(),
      });
    }
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const canProceed = formData.companyName.trim().length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 overflow-hidden"
        >
          {/* Header */}
          <div className="px-12 pt-12 pb-10 text-center border-b border-gray-100/50">
            <div className="mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-gray-900 to-gray-700 rounded-2xl mx-auto flex items-center justify-center mb-4">
                <Building2 className="h-7 w-7 text-white" />
              </div>
            </div>
            <h1 className="text-2xl font-semibold text-gray-900 tracking-tight mb-3">
              Tell us about your business
            </h1>
            <p className="text-sm text-gray-600 font-light max-w-md mx-auto leading-relaxed">
              This helps us personalize your testimonial experience and analyze
              your brand context
            </p>
          </div>

          {/* Form */}
          <div className="px-12 py-10">
            <div className="space-y-6">
              {/* Company Name Field */}
              <div className="space-y-2">
                <label
                  htmlFor="companyName"
                  className="block text-xs font-semibold text-gray-700 tracking-wide uppercase"
                >
                  Company Name *
                </label>
                <div className="relative">
                  <input
                    id="companyName"
                    type="text"
                    value={formData.companyName}
                    onChange={(e) =>
                      handleInputChange("companyName", e.target.value)
                    }
                    className={`
                      block w-full px-4 py-4 text-sm border rounded-2xl
                      focus:outline-none focus:ring-2 focus:ring-offset-1 transition-all duration-200
                      ${
                        errors.companyName
                          ? "border-red-300 focus:border-red-400 focus:ring-red-400/20 bg-red-50/30"
                          : "border-gray-200 focus:border-gray-400 focus:ring-gray-400/20 bg-white"
                      }
                      placeholder-gray-400 font-light
                    `}
                    placeholder="Enter your company name"
                    disabled={isLoading}
                  />
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                    <Building2 className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
                {errors.companyName && (
                  <p className="text-xs text-red-600 font-medium">
                    {errors.companyName}
                  </p>
                )}
              </div>

              {/* Website URL Field */}
              <div className="space-y-2">
                <label
                  htmlFor="websiteUrl"
                  className="block text-xs font-semibold text-gray-700 tracking-wide uppercase"
                >
                  Website URL{" "}
                  <span className="text-gray-400 font-normal">(Optional)</span>
                </label>
                <div className="relative">
                  <input
                    id="websiteUrl"
                    type="url"
                    value={formData.websiteUrl}
                    onChange={(e) =>
                      handleInputChange("websiteUrl", e.target.value)
                    }
                    className={`
                      block w-full px-4 py-4 text-sm border rounded-2xl
                      focus:outline-none focus:ring-2 focus:ring-offset-1 transition-all duration-200
                      ${
                        errors.websiteUrl
                          ? "border-red-300 focus:border-red-400 focus:ring-red-400/20 bg-red-50/30"
                          : "border-gray-200 focus:border-gray-400 focus:ring-gray-400/20 bg-white"
                      }
                      placeholder-gray-400 font-light
                    `}
                    placeholder="https://yourcompany.com"
                    disabled={isLoading}
                  />
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                    <Globe className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
                {errors.websiteUrl && (
                  <p className="text-xs text-red-600 font-medium">
                    {errors.websiteUrl}
                  </p>
                )}
                {formData.websiteUrl && !errors.websiteUrl && (
                  <div className="flex items-center text-xs text-green-600">
                    <Check className="h-3 w-3 mr-1" />
                    We'll analyze your website to personalize your experience
                  </div>
                )}
              </div>

              {/* Info Box */}
              <div className="bg-blue-50/80 rounded-2xl p-6 border border-blue-100">
                <h3 className="text-sm font-semibold text-blue-900 mb-2">
                  Why do we need this?
                </h3>
                <ul className="space-y-2 text-xs text-blue-800">
                  <li className="flex items-start">
                    <div className="w-1 h-1 bg-blue-500 rounded-full mt-1.5 mr-2 flex-shrink-0"></div>
                    <span>
                      Personalize your testimonial collection templates
                    </span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-1 h-1 bg-blue-500 rounded-full mt-1.5 mr-2 flex-shrink-0"></div>
                    <span>
                      Extract your brand colors and styling preferences
                    </span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-1 h-1 bg-blue-500 rounded-full mt-1.5 mr-2 flex-shrink-0"></div>
                    <span>
                      Provide industry-specific testimonial suggestions
                    </span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between mt-10">
              {formData.websiteUrl ? (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSkip}
                  disabled={isLoading || !canProceed}
                  className="
                    px-6 py-3 text-sm font-medium text-gray-600 hover:text-gray-800
                    transition-colors duration-200 flex items-center
                    disabled:opacity-50 disabled:cursor-not-allowed
                  "
                >
                  <SkipForward className="h-4 w-4 mr-2" />
                  Continue without website
                </motion.button>
              ) : (
                <div></div>
              )}

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSubmit}
                disabled={isLoading || !canProceed}
                className="
                  bg-gray-900 hover:bg-black text-white font-semibold py-4 px-8
                  rounded-2xl transition-all duration-300 flex items-center
                  disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl
                  text-sm tracking-wide
                "
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Continue
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </motion.button>
            </div>
          </div>

          {/* Footer */}
          <div className="px-12 py-6 bg-gray-50/50 border-t border-gray-100/50">
            <div className="flex items-center justify-center">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-gray-900 rounded-full"></div>
                <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Progress Indicator */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500 font-medium">
            Step 1 of 4 • Business information
          </p>
        </div>
      </div>
    </div>
  );
};
