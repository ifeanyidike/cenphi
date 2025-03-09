import React from "react";
import StepOne from "./StepOne";
import {
  CompanySizeOption,
  FormErrors,
  IndustryOption,
  OnboardingFormData,
} from "./types";
import StepTwo from "./StepTwo";
import StepThree from "./StepThree";
import StepFour from "./StepFour";
import { ArrowRightCircle, ChevronLeft, ChevronRight } from "lucide-react";

type Props = {
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  currentStep: number;
  handleInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => void;
  formData: OnboardingFormData;
  errors: FormErrors;
  handleIndustrySelect: (industry: string) => void;
  industries: IndustryOption[];
  handleCompanySizeSelect: (size: string) => void;
  companySizes: CompanySizeOption[];
  goToPreviousStep: () => void;
  isSubmitting: boolean;
  stepSize: number;
};

const Form = ({
  handleInputChange,
  formData,
  errors,
  currentStep,
  handleIndustrySelect,
  industries,
  companySizes,
  handleCompanySizeSelect,
  handleSubmit,
  goToPreviousStep,
  isSubmitting,
  stepSize,
}: Props) => {
  // Determine which form step to show
  const renderFormStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <StepOne
            errors={errors}
            formData={formData}
            handleInputChange={handleInputChange}
          />
        );
      case 2:
        return (
          <StepTwo
            errors={errors}
            formData={formData}
            handleInputChange={handleInputChange}
          />
        );
      case 3:
        return (
          <StepThree
            errors={errors}
            formData={formData}
            handleIndustrySelect={handleIndustrySelect}
            industries={industries}
          />
        );
      case 4:
        return (
          <StepFour
            errors={errors}
            formData={formData}
            handleCompanySizeSelect={handleCompanySizeSelect}
            companySizes={companySizes}
          />
        );
      default:
        return null;
    }
  };
  return (
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
              : currentStep < stepSize
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
  );
};

export default Form;
