import React, { useState } from "react";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { ChevronRightIcon, ArrowUpRightIcon } from "lucide-react";
import { Plan } from "@/components/pricing/types";
import FormInput from "./FormInput";
import CardInput from "./CardInput";
import OrderSummary from "./OrderSummary";
import TrustBadge from "./TrustBadge";
// Payment form with Stripe integration
const PaymentForm = ({
  plan,
  billingCycle,
  onBack,
  onComplete,
}: {
  plan: Plan;
  billingCycle: "monthly" | "yearly";
  onBack: () => void;
  onComplete: () => void;
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const stripe = useStripe();
  const elements = useElements();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setPaymentError(null);

    try {
      const cardElement = elements.getElement(CardElement);

      if (!cardElement) {
        throw new Error("Card element not found");
      }

      // In a real implementation, you would create a payment intent on your server
      // and then confirm the payment here

      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Simulate successful payment
      onComplete();
    } catch (error) {
      setPaymentError(
        error instanceof Error ? error.message : "An unknown error occurred"
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-bold text-gray-800 mb-6">
            Billing Information
          </h3>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormInput
                label="First Name"
                id="firstName"
                autoComplete="given-name"
              />
              <FormInput
                label="Last Name"
                id="lastName"
                autoComplete="family-name"
              />
            </div>

            <FormInput
              label="Email"
              id="email"
              type="email"
              autoComplete="email"
            />

            <FormInput
              label="Company"
              id="company"
              required={false}
              autoComplete="organization"
            />

            <FormInput
              label="Address"
              id="address"
              autoComplete="street-address"
            />

            <div className="grid grid-cols-2 gap-4">
              <FormInput label="City" id="city" autoComplete="address-level2" />
              <FormInput
                label="Postal Code"
                id="postalCode"
                autoComplete="postal-code"
              />
            </div>

            <FormInput label="Country" id="country" autoComplete="country" />
          </div>
        </div>

        <div>
          <h3 className="text-lg font-bold text-gray-800 mb-6">
            Payment Method
          </h3>

          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-medium text-sm text-gray-700">
                Accepted Cards
              </h4>
              <div className="flex space-x-2">
                <div className="w-10 h-6 bg-blue-600 rounded"></div>
                <div className="w-10 h-6 bg-red-500 rounded"></div>
                <div className="w-10 h-6 bg-gray-800 rounded"></div>
                <div className="w-10 h-6 bg-green-600 rounded"></div>
              </div>
            </div>
          </div>

          <CardInput />

          {paymentError && (
            <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
              {paymentError}
            </div>
          )}

          <div className="mt-8">
            <OrderSummary plan={plan} billingCycle={billingCycle} />
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-xl shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          Back
        </button>

        <button
          type="submit"
          disabled={isProcessing || !stripe}
          className="inline-flex items-center px-6 py-3 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-200"
        >
          {isProcessing ? (
            <>
              <ArrowUpRightIcon className="w-4 h-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              Complete Payment
              <ChevronRightIcon className="w-4 h-4 ml-2" />
            </>
          )}
        </button>
      </div>

      <TrustBadge />
    </form>
  );
};

export default PaymentForm;
