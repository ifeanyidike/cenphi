// import React, { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import {
//   ChevronRight,
//   Globe,
//   Building,
//   Star,
//   MessageSquare,
//   Award,
//   Check,
//   ArrowRight,
// } from "lucide-react";

// // Form state type
// interface OnboardingFormData {
//   businessName: string;
//   websiteUrl: string;
// }

// // Form validation type
// interface FormErrors {
//   businessName?: string;
//   websiteUrl?: string;
// }

// const OnboardingPage: React.FC = () => {
//   const navigate = useNavigate();
//   const [formData, setFormData] = useState<OnboardingFormData>({
//     businessName: "",
//     websiteUrl: "",
//   });
//   const [errors, setErrors] = useState<FormErrors>({});
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [currentStep, setCurrentStep] = useState(1);

//   const validateForm = (): boolean => {
//     const newErrors: FormErrors = {};

//     if (!formData.businessName.trim()) {
//       newErrors.businessName = "Business name is required";
//     }

//     if (!formData.websiteUrl.trim()) {
//       newErrors.websiteUrl = "Website URL is required";
//     } else if (
//       !/^(https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)$/.test(
//         formData.websiteUrl
//       )
//     ) {
//       newErrors.websiteUrl = "Please enter a valid website URL";
//     }

//     setErrors(newErrors);
//     return Object.keys(newErrors).length === 0;
//   };

//   const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const { name, value } = e.target;
//     setFormData((prev) => ({
//       ...prev,
//       [name]: value,
//     }));

//     // Clear error when user types
//     if (errors[name as keyof FormErrors]) {
//       setErrors((prev) => ({
//         ...prev,
//         [name]: undefined,
//       }));
//     }
//   };

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();

//     if (!validateForm()) return;

//     setIsSubmitting(true);

//     try {
//       // Simulate API call
//       await new Promise((resolve) => setTimeout(resolve, 1500));

//       // Redirect to dashboard
//       navigate("/dashboard");
//     } catch (error) {
//       console.error("Onboarding error:", error);
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   const goToNextStep = () => {
//     if (currentStep === 1) {
//       if (!formData.businessName.trim()) {
//         setErrors((prev) => ({
//           ...prev,
//           businessName: "Business name is required",
//         }));
//         return;
//       }
//       setCurrentStep(2);
//     }
//   };

//   const benefits = [
//     {
//       icon: <Star className="h-5 w-5 text-amber-500" />,
//       text: "Collect authentic testimonials",
//     },
//     {
//       icon: <MessageSquare className="h-5 w-5 text-blue-500" />,
//       text: "AI-powered content curation",
//     },
//     {
//       icon: <Award className="h-5 w-5 text-purple-500" />,
//       text: "Showcase across all channels",
//     },
//   ];

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50">
//       {/* Animated background elements */}
//       <div className="absolute inset-0 overflow-hidden pointer-events-none">
//         <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-100 rounded-full opacity-20 blur-3xl"></div>
//         <div className="absolute top-1/2 -left-40 w-80 h-80 bg-purple-100 rounded-full opacity-20 blur-3xl"></div>
//         <div className="absolute -bottom-40 right-1/3 w-80 h-80 bg-amber-100 rounded-full opacity-20 blur-3xl"></div>
//       </div>

//       <div className="container mx-auto px-4 pt-8 pb-16">
//         <header className="flex justify-center mb-8">
//           <div className="relative">
//             <img
//               src="/api/placeholder/160/50"
//               alt="Cenphi.io"
//               className="h-12 w-40"
//             />
//           </div>
//         </header>

//         <div className="max-w-4xl mx-auto grid md:grid-cols-5 gap-8">
//           {/* Left column with form */}
//           <div className="md:col-span-3">
//             <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
//               <div className="px-8 py-6 border-b border-gray-100">
//                 <div className="flex items-center space-x-2">
//                   <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white font-medium">
//                     {currentStep}
//                   </div>
//                   <h1 className="text-xl font-bold text-gray-800">
//                     Set up your Cenphi workspace
//                   </h1>
//                 </div>
//                 <p className="mt-2 text-gray-600">
//                   Let's get your testimonial management hub ready
//                 </p>
//               </div>

//               <form onSubmit={handleSubmit} className="p-8">
//                 {currentStep === 1 && (
//                   <div className="space-y-6">
//                     <div className="space-y-2">
//                       <label
//                         htmlFor="businessName"
//                         className="block text-sm font-medium text-gray-700"
//                       >
//                         Business or Company Name
//                       </label>
//                       <div className="relative">
//                         <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
//                           <Building className="h-5 w-5 text-gray-400" />
//                         </div>
//                         <input
//                           type="text"
//                           id="businessName"
//                           name="businessName"
//                           value={formData.businessName}
//                           onChange={handleInputChange}
//                           placeholder="Your business name"
//                           className={`w-full pl-10 pr-4 py-3 rounded-lg border ${
//                             errors.businessName
//                               ? "border-red-300 bg-red-50"
//                               : "border-gray-300"
//                           } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200`}
//                         />
//                       </div>
//                       {errors.businessName && (
//                         <p className="mt-1 text-sm text-red-600">
//                           {errors.businessName}
//                         </p>
//                       )}
//                       <p className="mt-1 text-sm text-gray-500">
//                         This will be displayed in your testimonial collection
//                         forms
//                       </p>
//                     </div>

//                     <div className="pt-4">
//                       <button
//                         type="button"
//                         onClick={goToNextStep}
//                         className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center space-x-2 transition duration-200 ease-in-out transform hover:translate-y-px focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
//                       >
//                         <span>Continue</span>
//                         <ChevronRight className="h-5 w-5" />
//                       </button>
//                     </div>
//                   </div>
//                 )}

//                 {currentStep === 2 && (
//                   <div className="space-y-6">
//                     <div className="space-y-2">
//                       <label
//                         htmlFor="websiteUrl"
//                         className="block text-sm font-medium text-gray-700"
//                       >
//                         Your Website URL
//                       </label>
//                       <div className="relative">
//                         <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
//                           <Globe className="h-5 w-5 text-gray-400" />
//                         </div>
//                         <input
//                           type="text"
//                           id="websiteUrl"
//                           name="websiteUrl"
//                           value={formData.websiteUrl}
//                           onChange={handleInputChange}
//                           placeholder="https://yourdomain.com"
//                           className={`w-full pl-10 pr-4 py-3 rounded-lg border ${
//                             errors.websiteUrl
//                               ? "border-red-300 bg-red-50"
//                               : "border-gray-300"
//                           } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200`}
//                         />
//                       </div>
//                       {errors.websiteUrl && (
//                         <p className="mt-1 text-sm text-red-600">
//                           {errors.websiteUrl}
//                         </p>
//                       )}
//                       <p className="mt-1 text-sm text-gray-500">
//                         We'll use this to customize your testimonial widgets
//                       </p>
//                     </div>

//                     <div className="pt-4 space-y-3">
//                       <button
//                         type="submit"
//                         disabled={isSubmitting}
//                         className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center space-x-2 transition duration-200 ease-in-out transform hover:translate-y-px focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
//                       >
//                         {isSubmitting ? (
//                           <>
//                             <svg
//                               className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
//                               xmlns="http://www.w3.org/2000/svg"
//                               fill="none"
//                               viewBox="0 0 24 24"
//                             >
//                               <circle
//                                 className="opacity-25"
//                                 cx="12"
//                                 cy="12"
//                                 r="10"
//                                 stroke="currentColor"
//                                 strokeWidth="4"
//                               ></circle>
//                               <path
//                                 className="opacity-75"
//                                 fill="currentColor"
//                                 d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
//                               ></path>
//                             </svg>
//                             <span>Setting up your workspace...</span>
//                           </>
//                         ) : (
//                           <>
//                             <span>Complete Setup & Go to Dashboard</span>
//                             <ArrowRight className="h-5 w-5" />
//                           </>
//                         )}
//                       </button>

//                       <button
//                         type="button"
//                         onClick={() => setCurrentStep(1)}
//                         className="w-full bg-white border border-gray-300 text-gray-700 font-medium py-2 px-4 rounded-lg transition duration-200 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50"
//                       >
//                         Back
//                       </button>
//                     </div>
//                   </div>
//                 )}
//               </form>
//             </div>
//           </div>

//           {/* Right column with benefits */}
//           <div className="md:col-span-2">
//             <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl shadow-xl overflow-hidden text-white">
//               <div className="px-6 py-6 border-b border-white/10">
//                 <h2 className="text-xl font-bold">
//                   Transform your testimonials
//                 </h2>
//                 <p className="mt-1 text-blue-100">
//                   Collect, manage and showcase customer stories
//                 </p>
//               </div>

//               <div className="p-6 space-y-6">
//                 <div className="space-y-4">
//                   {benefits.map((benefit, index) => (
//                     <div key={index} className="flex items-start space-x-3">
//                       <div className="flex-shrink-0 mt-1 bg-white/10 p-1.5 rounded-lg">
//                         {benefit.icon}
//                       </div>
//                       <span className="text-blue-50">{benefit.text}</span>
//                     </div>
//                   ))}
//                 </div>

//                 <div className="bg-white/10 rounded-xl p-4">
//                   <div className="flex items-center space-x-3 mb-2">
//                     <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center">
//                       <Star className="h-4 w-4 text-white" fill="white" />
//                     </div>
//                     <div className="text-sm font-medium">
//                       Premium experience awaits
//                     </div>
//                   </div>
//                   <p className="text-sm text-blue-100">
//                     Join thousands of businesses already leveraging Cenphi.io to
//                     build trust and drive conversions.
//                   </p>
//                 </div>

//                 <div className="pt-4">
//                   <div className="bg-white/5 rounded-lg p-4">
//                     <div className="flex items-center space-x-2 mb-2">
//                       <Check className="h-5 w-5 text-green-400" />
//                       <span className="font-medium">
//                         No credit card required
//                       </span>
//                     </div>
//                     <div className="flex items-center space-x-2">
//                       <Check className="h-5 w-5 text-green-400" />
//                       <span className="font-medium">
//                         Full featured 14-day trial
//                       </span>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default OnboardingPage;

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronRight,
  Globe,
  Building,
  Star,
  MessageSquare,
  Award,
  Check,
  CheckCircle,
  LucideIcon,
  ArrowRightCircle,
  X,
  Sparkles,
  TrendingUp,
  Users,
  ChevronLeft,
} from "lucide-react";
import Navbar from "@/components/custom/nav";
import Footer from "@/components/custom/footer";

// Form state type
interface OnboardingFormData {
  businessName: string;
  websiteUrl: string;
  industry: string;
  companySize: string;
}

// Form validation type
interface FormErrors {
  businessName?: string;
  websiteUrl?: string;
  industry?: string;
  companySize?: string;
}

// Benefit item type
interface BenefitItem {
  icon: React.ReactNode;
  title: string;
  description: string;
  accentColor: string;
}

// Progress step type
interface ProgressStep {
  name: string;
  status: "complete" | "current" | "upcoming";
}

// Industry option type
interface IndustryOption {
  value: string;
  label: string;
  icon: LucideIcon;
}

// Company size option type
interface CompanySizeOption {
  value: string;
  label: string;
}

const OnboardingPage: React.FC = () => {
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

  // Update progress when step changes
  useEffect(() => {
    setProgress(currentStep * 25);
  }, [currentStep]);

  // Show success animation when form is completed
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

    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));
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

  // Progress steps data
  const steps: ProgressStep[] = [
    {
      name: "Company",
      status:
        currentStep === 1
          ? "current"
          : currentStep > 1
          ? "complete"
          : "upcoming",
    },
    {
      name: "Website",
      status:
        currentStep === 2
          ? "current"
          : currentStep > 2
          ? "complete"
          : "upcoming",
    },
    {
      name: "Industry",
      status:
        currentStep === 3
          ? "current"
          : currentStep > 3
          ? "complete"
          : "upcoming",
    },
    {
      name: "Team",
      status:
        currentStep === 4
          ? "current"
          : currentStep > 4
          ? "complete"
          : "upcoming",
    },
  ];

  // Industry options
  const industries: IndustryOption[] = [
    { value: "technology", label: "Technology & SaaS", icon: Sparkles },
    { value: "ecommerce", label: "E-Commerce & Retail", icon: Globe },
    { value: "services", label: "Professional Services", icon: TrendingUp },
    { value: "healthcare", label: "Healthcare & Wellness", icon: Users },
  ];

  // Company size options
  const companySizes: CompanySizeOption[] = [
    { value: "1-10", label: "1-10 employees" },
    { value: "11-50", label: "11-50 employees" },
    { value: "51-200", label: "51-200 employees" },
    { value: "201-500", label: "201-500 employees" },
    { value: "501+", label: "501+ employees" },
  ];

  // Benefits data
  const benefits: BenefitItem[] = [
    {
      icon: <Star className="h-5 w-5" />,
      title: "AI-Powered Analytics",
      description:
        "Leverage machine learning to identify your most impactful testimonials",
      accentColor: "text-amber-500 bg-amber-500/10",
    },
    {
      icon: <MessageSquare className="h-5 w-5" />,
      title: "Smart Content Curation",
      description:
        "Automatically format and optimize your testimonials for any channel",
      accentColor: "text-blue-500 bg-blue-500/10",
    },
    {
      icon: <Award className="h-5 w-5" />,
      title: "Conversion Boosting",
      description:
        "Place testimonials strategically to increase conversion rates by up to 34%",
      accentColor: "text-purple-500 bg-purple-500/10",
    },
  ];

  // Determine which form step to show
  const renderFormStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6 animate-fadeIn">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="businessName"
                  className="block text-sm font-medium text-gray-700"
                >
                  Business or Company Name
                </label>
                <span className="text-xs text-gray-500">Required</span>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-all">
                  <Building className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500" />
                </div>
                <input
                  type="text"
                  id="businessName"
                  name="businessName"
                  value={formData.businessName}
                  onChange={handleInputChange}
                  placeholder="Your business name"
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border ${
                    errors.businessName
                      ? "border-red-300 bg-red-50"
                      : "border-gray-300 focus:border-blue-500"
                  } focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200`}
                />
                <div
                  className={`absolute right-3 top-1/2 transform -translate-y-1/2 transition-opacity duration-300 ${
                    formData.businessName.trim() ? "opacity-100" : "opacity-0"
                  }`}
                >
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>
              </div>
              {errors.businessName && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <X className="h-4 w-4 mr-1" />
                  {errors.businessName}
                </p>
              )}
              <p className="mt-1 text-sm text-gray-500">
                This will be displayed in your testimonial collection forms and
                widgets
              </p>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-6 animate-fadeIn">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="websiteUrl"
                  className="block text-sm font-medium text-gray-700"
                >
                  Your Website URL
                </label>
                <span className="text-xs text-gray-500">Required</span>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Globe className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500" />
                </div>
                <input
                  type="text"
                  id="websiteUrl"
                  name="websiteUrl"
                  value={formData.websiteUrl}
                  onChange={handleInputChange}
                  placeholder="https://yourdomain.com"
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border ${
                    errors.websiteUrl
                      ? "border-red-300 bg-red-50"
                      : "border-gray-300 focus:border-blue-500"
                  } focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200`}
                />
                <div
                  className={`absolute right-3 top-1/2 transform -translate-y-1/2 transition-opacity duration-300 ${
                    formData.websiteUrl.trim() ? "opacity-100" : "opacity-0"
                  }`}
                >
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>
              </div>
              {errors.websiteUrl && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <X className="h-4 w-4 mr-1" />
                  {errors.websiteUrl}
                </p>
              )}
              <p className="mt-1 text-sm text-gray-500">
                We'll use this to customize your testimonial widgets and SEO
                settings
              </p>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-6 animate-fadeIn">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">
                  Select Your Industry
                </label>
                <span className="text-xs text-gray-500">Required</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {industries.map((industry) => {
                  const IconComponent = industry.icon;
                  return (
                    <div
                      key={industry.value}
                      onClick={() => handleIndustrySelect(industry.value)}
                      className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        formData.industry === industry.value
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div
                        className={`p-2 rounded-lg ${
                          formData.industry === industry.value
                            ? "bg-blue-500"
                            : "bg-gray-100"
                        }`}
                      >
                        <IconComponent
                          className={`h-5 w-5 ${
                            formData.industry === industry.value
                              ? "text-white"
                              : "text-gray-500"
                          }`}
                        />
                      </div>
                      <span className="ml-3 font-medium">{industry.label}</span>
                      {formData.industry === industry.value && (
                        <CheckCircle className="ml-auto h-5 w-5 text-blue-500" />
                      )}
                    </div>
                  );
                })}
              </div>
              {errors.industry && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <X className="h-4 w-4 mr-1" />
                  {errors.industry}
                </p>
              )}
              <p className="mt-1 text-sm text-gray-500">
                We'll optimize your testimonial templates based on your industry
              </p>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-6 animate-fadeIn">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">
                  Company Size
                </label>
                <span className="text-xs text-gray-500">Required</span>
              </div>
              <div className="space-y-2">
                {companySizes.map((size) => (
                  <div
                    key={size.value}
                    onClick={() => handleCompanySizeSelect(size.value)}
                    className={`flex items-center p-3 rounded-xl border cursor-pointer transition-all ${
                      formData.companySize === size.value
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div
                      className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${
                        formData.companySize === size.value
                          ? "border-blue-500"
                          : "border-gray-300"
                      }`}
                    >
                      {formData.companySize === size.value && (
                        <div className="h-3 w-3 rounded-full bg-blue-500"></div>
                      )}
                    </div>
                    <span className="ml-3">{size.label}</span>
                  </div>
                ))}
              </div>
              {errors.companySize && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <X className="h-4 w-4 mr-1" />
                  {errors.companySize}
                </p>
              )}
              <p className="mt-1 text-sm text-gray-500">
                We'll recommend the right plan based on your team size
              </p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-gradient-to-br from-indigo-50 via-white to-blue-50 overflow-hidden">
      <Navbar alwaysDarkText />
      <div className="min-h-screen pt-24 pb-0  relative overflow-hidden">
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

                  <form onSubmit={handleSubmit} className="p-8">
                    {renderFormStep()}

                    <div className="pt-8 flex items-center justify-between">
                      {currentStep > 1 ? (
                        <button
                          type="button"
                          onClick={goToPreviousStep}
                          className="flex items-center text-gray-600 hover:text-gray-800 font-medium"
                        >
                          <ChevronLeft className="h-5 w-5 mr-1" />
                          Back
                        </button>
                      ) : (
                        <div></div> // Empty div to maintain flex spacing
                      )}

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="relative bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-xl flex items-center justify-center space-x-2 transition-all duration-200 ease-in-out shadow-md hover:shadow-lg hover:translate-y-px focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:opacity-70 disabled:cursor-not-allowed group overflow-hidden"
                      >
                        <span className="relative z-10">
                          {isSubmitting
                            ? "Processing..."
                            : currentStep < 4
                            ? "Continue"
                            : "Complete Setup"}
                        </span>
                        {!isSubmitting && (
                          <span className="relative z-10">
                            {currentStep < 4 ? (
                              <ChevronRight className="h-5 w-5" />
                            ) : (
                              <ArrowRightCircle className="h-5 w-5" />
                            )}
                          </span>
                        )}
                        {isSubmitting && (
                          <svg
                            className="animate-spin h-5 w-5 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                        )}
                        <span className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              {/* Right column with benefits */}
              <div className="md:col-span-2">
                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl shadow-xl overflow-y-auto text-white h-full max-h-[860px]">
                  <div className="px-6 py-6 border-b border-white/10">
                    <h2 className="text-xl font-bold flex items-center">
                      <Sparkles className="h-5 w-5 mr-2" />
                      Transform your testimonials
                    </h2>
                    <p className="mt-1 text-blue-100">
                      Join industry leaders using Cenphi.io
                    </p>
                  </div>

                  <div className="p-6 space-y-6">
                    {/* 3D Card effect */}
                    <div className="relative group perspective">
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-500 to-purple-500 rounded-xl blur opacity-30 group-hover:opacity-70 transition duration-1000 group-hover:duration-200"></div>
                      <div className="relative transform transition-all duration-500 ease-out group-hover:rotate-x-12">
                        <div className="bg-white/10 backdrop-blur-md rounded-xl p-5 border border-white/20">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center mb-4">
                            <Star className="h-6 w-6 text-white" fill="white" />
                          </div>
                          <div className="text-lg font-semibold mb-1">
                            Enterprise-Grade Platform
                          </div>
                          <p className="text-blue-100 text-sm">
                            Used by Fortune 500 companies and growing startups
                            alike to build trust and drive conversions.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {benefits.map((benefit, index) => (
                        <div
                          key={index}
                          className="flex items-start space-x-4 p-3 rounded-xl hover:bg-white/5 transition-colors duration-200"
                        >
                          <div
                            className={`flex-shrink-0 p-2 rounded-xl ${benefit.accentColor}`}
                          >
                            {benefit.icon}
                          </div>
                          <div>
                            <span className="block font-medium text-white mb-0.5">
                              {benefit.title}
                            </span>
                            <span className="text-sm text-blue-100">
                              {benefit.description}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="relative group">
                      <div className="absolute -inset-1 bg-gradient-to-r from-blue-400 to-blue-300 rounded-xl blur-md opacity-30 group-hover:opacity-80 transition duration-300"></div>
                      <div className="relative bg-gradient-to-br from-white/10 to-white/5 rounded-xl p-5 border border-white/20">
                        <div className="flex flex-col space-y-3">
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white">
                              <Check className="h-5 w-5" />
                            </div>
                            <div className="font-medium">
                              No credit card required
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white">
                              <Check className="h-5 w-5" />
                            </div>
                            <div className="font-medium">
                              Full featured 14-day trial
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white">
                              <Check className="h-5 w-5" />
                            </div>
                            <div className="font-medium">
                              Premium support included
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Testimonial card */}
                    {/* <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 relative">
                      <div className="absolute -top-3 -right-3">
                        <div className="bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                          VERIFIED
                        </div>
                      </div>
                      <div className="flex items-center mb-3">
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-400">
                          <img
                            src="/api/placeholder/40/40"
                            alt="User"
                            className="rounded-full"
                          />
                        </div>
                        <div className="ml-3">
                          <div className="font-medium text-white">
                            Sarah Thompson
                          </div>
                          <div className="text-xs text-blue-100">
                            Marketing Director, TechSoft
                          </div>
                        </div>
                      </div>
                      <p className="text-sm italic text-blue-100 mb-3">
                        "Cenphi completely transformed how we showcase customer
                        success stories. Our conversion rates increased by 27%
                        within the first month of implementation. The AI-powered
                        insights helped us identify which testimonials resonated
                        most with specific audience segments."
                      </p>
                      <div className="flex items-center">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className="h-4 w-4 text-amber-400"
                            fill="#F59E0B"
                          />
                        ))}
                      </div>
                    </div> */}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          {/* <footer className="mt-16 text-center text-sm text-gray-500">
            <div className="flex justify-center space-x-6 mb-4">
              <a href="#" className="hover:text-gray-800 transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="hover:text-gray-800 transition-colors">
                Terms of Service
              </a>
              <a href="#" className="hover:text-gray-800 transition-colors">
                Help Center
              </a>
            </div>
            <p>© {new Date().getFullYear()} Cenphi.io. All rights reserved.</p>
          </footer> */}
        </div>

        {/* Floating help button */}
        {/* <div
          className="fixed bottom-6 right-6 z-50"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          <button className="bg-white text-blue-600 rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-200 hover:transform hover:scale-105 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50">
            <MessageSquare className="h-6 w-6" />
          </button>
          {showTooltip && (
            <div className="absolute right-full bottom-0 mr-4 mb-0 bg-gray-900 text-white text-sm rounded-lg px-3 py-2 w-48 shadow-xl">
              Need help with setup? Click to chat with our support team.
              <div className="absolute right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2 rotate-45 w-2 h-2 bg-gray-900"></div>
            </div>
          )}
        </div> */}
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
};

export default OnboardingPage;
