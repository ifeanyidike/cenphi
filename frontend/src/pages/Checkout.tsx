import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Lock,
  Check,
  CreditCard,
  Calendar,
  ArrowLeft,
  Shield,
  Users,
  MessageSquare,
  Zap,
  Info,
  AlertCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface CheckoutProps {
  selectedPlan?: {
    id: string;
    name: string;
    monthlyPrice: number;
    yearlyPrice: number;
    features: string[];
  };
}

const CheckoutPage: React.FC<CheckoutProps> = ({ selectedPlan }) => {
  const navigate = useNavigate();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">(
    "yearly"
  );
  const [paymentMethod, setPaymentMethod] = useState<"card" | "paypal">("card");
  const [formData, setFormData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    company: "",
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    billingAddress: "",
    city: "",
    zipCode: "",
    country: "US",
  });

  // Default to Professional plan if none selected
  const plan = selectedPlan || {
    id: "professional",
    name: "Professional",
    monthlyPrice: 99,
    yearlyPrice: 990,
    features: [
      "200 testimonials/month",
      "500 AI processing credits",
      "Up to 10 team members",
      "Full AI suite access",
      "Priority support",
    ],
  };

  const price =
    billingCycle === "yearly" ? plan.yearlyPrice : plan.monthlyPrice * 12;
  const monthlyPrice =
    billingCycle === "yearly"
      ? Math.floor(plan.yearlyPrice / 12)
      : plan.monthlyPrice;
  const savings =
    billingCycle === "yearly" ? plan.monthlyPrice * 12 - plan.yearlyPrice : 0;

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle checkout logic
    console.log("Processing checkout...", { plan, billingCycle, formData });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate("/pricing")}
              className="flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors duration-200 group"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1.5 group-hover:-translate-x-0.5 transition-transform duration-200" />
              <span className="font-medium">Back to pricing</span>
            </button>
            <div className="flex items-center text-xs text-gray-600">
              <Lock className="w-3.5 h-3.5 mr-1.5 text-green-600" />
              <span className="font-medium">Secure checkout</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10">
          {/* Checkout Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-7"
          >
            <div className="bg-white rounded-2xl border border-gray-100 shadow-lg p-6 sm:p-8">
              <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-6">
                Complete your subscription
              </h1>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Account Information */}
                <div>
                  <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wide mb-4">
                    Account Information
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">
                        First Name
                      </label>
                      <input
                        type="text"
                        value={formData.firstName}
                        onChange={(e) =>
                          handleInputChange("firstName", e.target.value)
                        }
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">
                        Last Name
                      </label>
                      <input
                        type="text"
                        value={formData.lastName}
                        onChange={(e) =>
                          handleInputChange("lastName", e.target.value)
                        }
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        required
                      />
                    </div>
                  </div>
                  <div className="mt-3">
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        handleInputChange("email", e.target.value)
                      }
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      required
                    />
                  </div>
                  <div className="mt-3">
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                      Company <span className="text-gray-400">(optional)</span>
                    </label>
                    <input
                      type="text"
                      value={formData.company}
                      onChange={(e) =>
                        handleInputChange("company", e.target.value)
                      }
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    />
                  </div>
                </div>

                {/* Payment Method */}
                <div>
                  <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wide mb-4">
                    Payment Method
                  </h3>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("card")}
                      className={`flex items-center justify-center px-4 py-2.5 text-sm border rounded-lg transition-all duration-200 ${
                        paymentMethod === "card"
                          ? "border-blue-500 bg-blue-50 text-blue-700 shadow-sm"
                          : "border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300"
                      }`}
                    >
                      <CreditCard className="w-3.5 h-3.5 mr-2" />
                      Credit Card
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("paypal")}
                      className={`flex items-center justify-center px-4 py-2.5 text-sm border rounded-lg transition-all duration-200 ${
                        paymentMethod === "paypal"
                          ? "border-blue-500 bg-blue-50 text-blue-700 shadow-sm"
                          : "border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300"
                      }`}
                    >
                      PayPal
                    </button>
                  </div>

                  {paymentMethod === "card" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="space-y-3"
                    >
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1.5">
                          Card Number
                        </label>
                        <input
                          type="text"
                          value={formData.cardNumber}
                          onChange={(e) =>
                            handleInputChange("cardNumber", e.target.value)
                          }
                          placeholder="1234 5678 9012 3456"
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                          required
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1.5">
                            Expiry Date
                          </label>
                          <input
                            type="text"
                            value={formData.expiryDate}
                            onChange={(e) =>
                              handleInputChange("expiryDate", e.target.value)
                            }
                            placeholder="MM/YY"
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1.5">
                            CVV
                          </label>
                          <input
                            type="text"
                            value={formData.cvv}
                            onChange={(e) =>
                              handleInputChange("cvv", e.target.value)
                            }
                            placeholder="123"
                            maxLength={4}
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                            required
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {paymentMethod === "paypal" && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="p-4 bg-blue-50 border border-blue-100 rounded-lg"
                    >
                      <div className="flex items-start">
                        <Info className="w-4 h-4 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-blue-900">
                          You'll be redirected to PayPal to complete your
                          purchase after clicking continue.
                        </p>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Billing Address */}
                <div>
                  <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wide mb-4">
                    Billing Address
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">
                        Address
                      </label>
                      <input
                        type="text"
                        value={formData.billingAddress}
                        onChange={(e) =>
                          handleInputChange("billingAddress", e.target.value)
                        }
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1.5">
                          City
                        </label>
                        <input
                          type="text"
                          value={formData.city}
                          onChange={(e) =>
                            handleInputChange("city", e.target.value)
                          }
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1.5">
                          ZIP Code
                        </label>
                        <input
                          type="text"
                          value={formData.zipCode}
                          onChange={(e) =>
                            handleInputChange("zipCode", e.target.value)
                          }
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-4">
                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-xl group"
                  >
                    <Lock className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform duration-200" />
                    Start 14-day Free Trial
                  </button>
                  <p className="text-xs text-gray-500 text-center mt-2.5">
                    You won't be charged until your trial ends
                  </p>
                </div>
              </form>
            </div>

            {/* Trust Badges */}
            <div className="mt-6 grid grid-cols-3 gap-4 px-4">
              {[
                {
                  icon: Shield,
                  text: "256-bit SSL",
                  subtext: "Encryption",
                },
                {
                  icon: Lock,
                  text: "PCI DSS",
                  subtext: "Compliant",
                },
                {
                  icon: Check,
                  text: "Money-back",
                  subtext: "Guarantee",
                },
              ].map((badge, index) => (
                <div
                  key={index}
                  className="flex flex-col items-center text-center"
                >
                  <badge.icon className="w-5 h-5 text-gray-400 mb-1.5" />
                  <span className="text-xs font-medium text-gray-700">
                    {badge.text}
                  </span>
                  <span className="text-xs text-gray-500">{badge.subtext}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Order Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="lg:col-span-5"
          >
            <div className="bg-white rounded-2xl border border-gray-100 shadow-lg p-6 sticky top-6">
              <h2 className="text-base font-semibold text-gray-900 mb-5">
                Order Summary
              </h2>

              {/* Plan Details */}
              <div className="mb-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-gray-900">
                    {plan.name} Plan
                  </span>
                </div>

                {/* Billing Cycle Toggle */}
                <div className="flex items-center p-1 bg-gray-100 rounded-lg mb-4">
                  <button
                    type="button"
                    onClick={() => setBillingCycle("monthly")}
                    className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${
                      billingCycle === "monthly"
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    Monthly
                  </button>
                  <button
                    type="button"
                    onClick={() => setBillingCycle("yearly")}
                    className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${
                      billingCycle === "yearly"
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    <span>Yearly</span>
                    {savings > 0 && (
                      <span className="ml-1.5 px-1.5 py-0.5 text-xs bg-green-100 text-green-700 rounded-full">
                        Save ${savings}
                      </span>
                    )}
                  </button>
                </div>

                {/* Price Display */}
                <div className="space-y-2 pb-4 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">
                      {billingCycle === "yearly"
                        ? "Annual subscription"
                        : "Monthly subscription"}
                    </span>
                    <span className="text-sm font-semibold text-gray-900">
                      ${price}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      Effective monthly cost
                    </span>
                    <span className="text-xs font-medium text-gray-600">
                      ${monthlyPrice}/mo
                    </span>
                  </div>
                </div>
              </div>

              {/* Features */}
              <div className="mb-5">
                <h4 className="text-xs font-semibold text-gray-900 mb-3">
                  What's included:
                </h4>
                <div className="space-y-2">
                  {[
                    { icon: MessageSquare, text: "200 testimonials/month" },
                    { icon: Zap, text: "500 AI processing credits" },
                    { icon: Users, text: "Up to 10 team members" },
                    { icon: Shield, text: "Priority support" },
                  ].map((feature, index) => (
                    <div key={index} className="flex items-center">
                      <div className="flex items-center justify-center w-5 h-5 rounded-full bg-green-100 mr-2.5 flex-shrink-0">
                        <Check className="w-3 h-3 text-green-600" />
                      </div>
                      <span className="text-xs text-gray-700">
                        {feature.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Trial Info */}
              <div className="p-3 bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-lg border border-blue-200 mb-5">
                <div className="flex items-center mb-1.5">
                  <Calendar className="w-3.5 h-3.5 text-blue-600 mr-2" />
                  <span className="text-xs font-semibold text-blue-900">
                    14-day free trial
                  </span>
                </div>
                <p className="text-xs text-blue-800 leading-relaxed">
                  Start using all features immediately. Cancel anytime during
                  your trial at no cost.
                </p>
              </div>

              {/* Refund Policy */}
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                <div className="flex items-start">
                  <AlertCircle className="w-3.5 h-3.5 text-gray-500 mr-2 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-gray-700 mb-0.5">
                      30-day money-back guarantee
                    </p>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      Not satisfied? Get a full refund within 30 days.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
