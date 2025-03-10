import { X } from "lucide-react";
import { CompanySizeOption, FormErrors, OnboardingFormData } from "./types";

type Props = {
  handleCompanySizeSelect: (size: string) => void;
  formData: OnboardingFormData;
  errors: FormErrors;
  companySizes: CompanySizeOption[];
};

const StepFour = ({
  companySizes,
  handleCompanySizeSelect,
  formData,
  errors,
}: Props) => {
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
};

export default StepFour;
