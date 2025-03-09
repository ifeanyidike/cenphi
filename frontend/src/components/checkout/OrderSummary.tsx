// Order summary component
import { motion } from "framer-motion";
import {
  ChevronRightIcon,
  CheckIcon,
  ShieldCheckIcon,
  CalendarIcon,
} from "lucide-react";
import { Feature, Plan } from "@/components/pricing/types";
import { useState } from "react";

const OrderSummary = ({
  plan,
  billingCycle,
}: {
  plan: Plan;
  billingCycle: "monthly" | "yearly";
}) => {
  const [features, setFeatures] = useState<Feature[]>(
    plan.features.slice(0, 5)
  );

  const price =
    billingCycle === "monthly" ? plan.monthlyPrice : plan.yearlyPrice;
  const discountAmount =
    billingCycle === "yearly" && plan.monthlyPrice && plan.yearlyPrice
      ? (plan.monthlyPrice * 12 - plan.yearlyPrice * 12).toFixed(2)
      : "0.00";

  const totalAmount = price || 0;
  const annualSavingPercentage =
    billingCycle === "yearly" && plan.monthlyPrice && plan.yearlyPrice
      ? Math.round((1 - plan.yearlyPrice / plan.monthlyPrice) * 100)
      : 0;

  return (
    <motion.div
      className="bg-gray-50 p-6 rounded-2xl border border-gray-200"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.2 }}
    >
      <h3 className="text-lg font-bold text-gray-800 mb-4">Order Summary</h3>

      <div className="space-y-3">
        <div className="flex justify-between items-center pb-3 border-b border-gray-200">
          <div>
            <p className="font-medium text-gray-800">{plan.name} Plan</p>
            <p className="text-sm text-gray-500">
              {billingCycle === "monthly"
                ? "Monthly Billing"
                : "Annual Billing"}
            </p>
          </div>
          <p className="font-medium">
            ${price?.toFixed(2)}
            {billingCycle === "yearly" ? "/mo" : ""}
          </p>
        </div>

        {billingCycle === "yearly" && (
          <div className="flex justify-between items-center pb-3 border-b border-gray-200">
            <div className="flex items-center">
              <p className="text-sm text-green-600 font-medium">
                Annual discount ({annualSavingPercentage}% off)
              </p>
            </div>
            <p className="font-medium text-green-600">-${discountAmount}</p>
          </div>
        )}

        <div className="flex justify-between items-center pt-2">
          <p className="font-bold text-gray-800">Total</p>
          <div className="text-right">
            <p className="font-bold text-gray-800">
              $
              {(billingCycle === "yearly"
                ? totalAmount * 12
                : totalAmount
              ).toFixed(2)}
            </p>
            <p className="text-xs text-gray-500">
              {billingCycle === "yearly" ? "Billed annually" : "Billed monthly"}
            </p>
          </div>
        </div>
      </div>

      {billingCycle === "yearly" && (
        <div className="mt-4 p-3 bg-green-50 rounded-xl border border-green-100">
          <div className="flex items-center">
            <div className="bg-green-100 p-1 rounded-full mr-2">
              <CheckIcon className="w-3 h-3 text-green-600" />
            </div>
            <p className="text-sm text-green-700">
              You save ${discountAmount} with annual billing
            </p>
          </div>
        </div>
      )}

      <div className="mt-6 space-y-3">
        <h4 className="font-medium text-sm text-gray-700">What's included:</h4>
        {features.map((feature, index) => (
          <div key={index} className="flex items-start">
            <CheckIcon className="w-4 h-4 text-indigo-600 mt-0.5 mr-2 flex-shrink-0" />
            <span className="text-sm text-gray-600">{feature.name}</span>
          </div>
        ))}
        {plan.features.length > features.length ? (
          <button
            type="button"
            onClick={() => {
              setFeatures(plan.features);
            }}
            className="text-sm text-indigo-600 font-medium hover:text-indigo-700 flex items-center"
          >
            View all features
            <ChevronRightIcon className="w-4 h-4 ml-1" />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              setFeatures(plan.features.slice(0, 5));
            }}
            className="text-sm text-indigo-600 font-medium hover:text-indigo-700 flex items-center"
          >
            View less
            <ChevronRightIcon className="w-4 h-4 ml-1" />
          </button>
        )}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center text-sm text-gray-600">
            <CalendarIcon className="w-4 h-4 mr-1 text-gray-500" />
            Cancel anytime
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <ShieldCheckIcon className="w-4 h-4 mr-1 text-gray-500" />
            Secure checkout
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default OrderSummary;
