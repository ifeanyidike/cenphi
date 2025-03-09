import { CheckCircle, X } from "lucide-react";
import { FormErrors, IndustryOption, OnboardingFormData } from "./types";

type Props = {
  handleIndustrySelect: (industry: string) => void;
  industries: IndustryOption[];
  formData: OnboardingFormData;
  errors: FormErrors;
};

const StepThree = ({
  industries,
  handleIndustrySelect,
  formData,
  errors,
}: Props) => {
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
};

export default StepThree;
