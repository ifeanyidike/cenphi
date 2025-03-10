import { CheckCircle, Globe, X } from "lucide-react";
import { FormErrors, OnboardingFormData } from "./types";

type Props = {
  handleInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => void;
  formData: OnboardingFormData;
  errors: FormErrors;
};

const StepTwo = ({ handleInputChange, formData, errors }: Props) => {
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
          We'll use this to customize your testimonial widgets and SEO settings
        </p>
      </div>
    </div>
  );
};

export default StepTwo;
