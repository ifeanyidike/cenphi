import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import {
  ChevronRightIcon,
  ShieldCheckIcon,
  ArrowUpRightIcon,
} from "lucide-react";
import { plans } from "@/components/pricing/data";
import StepIndicators from "@/components/checkout/StepIndicators";
import PlanCard from "@/components/checkout/PlanCard";
import OrderSummary from "@/components/checkout/OrderSummary";
import PaymentForm from "@/components/checkout/PaymentForm";
import SuccessPage from "@/components/checkout/SuccessPage";
import { useSearchParams } from "react-router-dom";
import { observer } from "mobx-react-lite";
import { authStore } from "@/stores/authStore";
import { appService } from "@/services/appService";
import { Plan } from "@/types/workspace";

// Stripe promise initialization
const stripePromise = loadStripe("your_publishable_key");

// Main checkout component
const Checkout = observer(() => {
  const [searchParams] = useSearchParams();

  const planId = searchParams.get("plan");
  const selectedPlan = plans.find((p) => p.id === planId);
  const [currentStep, setCurrentStep] = useState(0);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">(
    "yearly"
  );

  // Visual effect when changing billing cycle
  const cycleVariants = {
    monthly: { x: 0 },
    yearly: { x: "100%" },
  };

  async function onComplete() {
    const user = authStore.currentUser;
    await appService.onboard_partial(user?.uid || "", planId as Plan);
    setCurrentStep(2);
  }

  if (!selectedPlan) return;

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2">
            Complete Your Purchase
          </h1>
          <p className="text-gray-600">
            Unlock powerful testimonial management tools for your business
          </p>
        </div>

        <StepIndicators currentStep={currentStep} />

        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          <div className="p-8">
            <AnimatePresence mode="wait">
              {currentStep === 0 && (
                <motion.div
                  key="plan-selection"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <div className="flex justify-between items-center mb-8">
                    <h2 className="text-xl font-bold text-gray-800">
                      Review Your Plan
                    </h2>

                    <div className="relative inline-block">
                      <div className="w-56 h-10 bg-gray-100 rounded-xl p-1 relative">
                        <motion.div
                          className="absolute top-1 bottom-1 w-1/2 rounded-lg bg-white shadow-sm"
                          variants={cycleVariants}
                          animate={
                            billingCycle === "monthly" ? "monthly" : "yearly"
                          }
                          transition={{
                            type: "spring",
                            stiffness: 400,
                            damping: 25,
                          }}
                        />
                        <div className="relative flex h-full">
                          <button
                            className={`flex-1 flex items-center justify-center text-sm font-medium z-10 ${
                              billingCycle === "monthly"
                                ? "text-gray-900"
                                : "text-gray-500"
                            }`}
                            onClick={() => setBillingCycle("monthly")}
                          >
                            Monthly
                          </button>
                          <button
                            className={`flex-1 flex items-center justify-center text-sm font-medium z-10 ${
                              billingCycle === "yearly"
                                ? "text-gray-900"
                                : "text-gray-500"
                            }`}
                            onClick={() => setBillingCycle("yearly")}
                          >
                            Yearly
                            <span className="ml-1 text-xs font-bold text-green-600">
                              Save 20%
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2">
                      <PlanCard
                        plan={selectedPlan}
                        billingCycle={billingCycle}
                      />

                      <div className="mt-6 space-y-4">
                        <h3 className="font-semibold text-gray-800">
                          Key Benefits:
                        </h3>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="flex items-start p-4 bg-indigo-50 rounded-xl">
                            <div className="p-2 bg-indigo-100 rounded-lg mr-3">
                              <ShieldCheckIcon className="w-5 h-5 text-indigo-600" />
                            </div>
                            <div>
                              <h4 className="font-medium text-indigo-800 text-sm">
                                Advanced Security
                              </h4>
                              <p className="text-xs text-indigo-600 mt-1">
                                Enterprise-grade protection for your data
                              </p>
                            </div>
                          </div>

                          <div className="flex items-start p-4 bg-purple-50 rounded-xl">
                            <div className="p-2 bg-purple-100 rounded-lg mr-3">
                              <ArrowUpRightIcon className="w-5 h-5 text-purple-600" />
                            </div>
                            <div>
                              <h4 className="font-medium text-purple-800 text-sm">
                                Seamless Integration
                              </h4>
                              <p className="text-xs text-purple-600 mt-1">
                                Connect with your existing tools
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <OrderSummary
                        plan={selectedPlan}
                        billingCycle={billingCycle}
                      />
                    </div>
                  </div>

                  <div className="mt-8 flex justify-end">
                    <button
                      onClick={() => setCurrentStep(1)}
                      className="inline-flex items-center px-6 py-3 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
                    >
                      Continue to Payment
                      <ChevronRightIcon className="w-4 h-4 ml-2" />
                    </button>
                  </div>
                </motion.div>
              )}

              {currentStep === 1 && (
                <motion.div
                  key="payment-form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <Elements stripe={stripePromise}>
                    <PaymentForm
                      plan={selectedPlan}
                      billingCycle={billingCycle}
                      onBack={() => setCurrentStep(0)}
                      onComplete={onComplete}
                    />
                  </Elements>
                </motion.div>
              )}

              {currentStep === 2 && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <SuccessPage plan={selectedPlan} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
});

export default Checkout;
