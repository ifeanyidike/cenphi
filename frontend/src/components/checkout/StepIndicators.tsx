// Step indicators component
import { CheckIcon } from "lucide-react";
import { Fragment } from "react";
const StepIndicators = ({ currentStep }: { currentStep: number }) => {
  const steps = ["Plan", "Payment", "Confirmation"];

  return (
    <div className="flex justify-center mb-8">
      {steps.map((step, index) => (
        <Fragment key={step}>
          <div className="flex flex-col items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center 
                  ${
                    index < currentStep
                      ? "bg-indigo-600 text-white"
                      : index === currentStep
                      ? "bg-indigo-100 border-2 border-indigo-600 text-indigo-600"
                      : "bg-gray-100 text-gray-400"
                  }`}
            >
              {index < currentStep ? (
                <CheckIcon className="w-4 h-4" />
              ) : (
                <span className="text-sm font-medium">{index + 1}</span>
              )}
            </div>
            <span
              className={`text-xs mt-1 ${
                index === currentStep
                  ? "text-indigo-600 font-medium"
                  : "text-gray-500"
              }`}
            >
              {step}
            </span>
          </div>
          {index < steps.length - 1 && (
            <div className="w-20 h-px bg-gray-300 mt-4 mx-2" />
          )}
        </Fragment>
      ))}
    </div>
  );
};

export default StepIndicators;
