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
} from "lucide-react";

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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button className="flex items-center text-gray-600 hover:text-gray-900 transition-colors duration-200">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to pricing
              </button>
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <Lock className="w-4 h-4 mr-2" />
              Secure checkout
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Checkout Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="bg-white rounded-xl border border-gray-200 p-8">
              <h1 className="text-2xl font-semibold text-gray-900 mb-8">
                Complete your subscription
              </h1>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Account Information */}
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-4">
                    Account Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        First Name
                      </label>
                      <input
                        type="text"
                        value={formData.firstName}
                        onChange={(e) =>
                          handleInputChange("firstName", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Last Name
                      </label>
                      <input
                        type="text"
                        value={formData.lastName}
                        onChange={(e) =>
                          handleInputChange("lastName", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        handleInputChange("email", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Company (optional)
                    </label>
                    <input
                      type="text"
                      value={formData.company}
                      onChange={(e) =>
                        handleInputChange("company", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Payment Method */}
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-4">
                    Payment Method
                  </h3>
                  <div className="flex space-x-4 mb-4">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("card")}
                      className={`flex items-center px-4 py-2 border rounded-lg transition-colors duration-200 ${
                        paymentMethod === "card"
                          ? "border-blue-500 bg-blue-50 text-blue-700"
                          : "border-gray-300 text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <CreditCard className="w-4 h-4 mr-2" />
                      Credit Card
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("paypal")}
                      className={`flex items-center px-4 py-2 border rounded-lg transition-colors duration-200 ${
                        paymentMethod === "paypal"
                          ? "border-blue-500 bg-blue-50 text-blue-700"
                          : "border-gray-300 text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      PayPal
                    </button>
                  </div>

                  {paymentMethod === "card" && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Card Number
                        </label>
                        <input
                          type="text"
                          value={formData.cardNumber}
                          onChange={(e) =>
                            handleInputChange("cardNumber", e.target.value)
                          }
                          placeholder="1234 5678 9012 3456"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Expiry Date
                          </label>
                          <input
                            type="text"
                            value={formData.expiryDate}
                            onChange={(e) =>
                              handleInputChange("expiryDate", e.target.value)
                            }
                            placeholder="MM/YY"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            CVV
                          </label>
                          <input
                            type="text"
                            value={formData.cvv}
                            onChange={(e) =>
                              handleInputChange("cvv", e.target.value)
                            }
                            placeholder="123"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Billing Address */}
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-4">
                    Billing Address
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Address
                      </label>
                      <input
                        type="text"
                        value={formData.billingAddress}
                        onChange={(e) =>
                          handleInputChange("billingAddress", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          City
                        </label>
                        <input
                          type="text"
                          value={formData.city}
                          onChange={(e) =>
                            handleInputChange("city", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          ZIP Code
                        </label>
                        <input
                          type="text"
                          value={formData.zipCode}
                          onChange={(e) =>
                            handleInputChange("zipCode", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
                  >
                    <Lock className="w-4 h-4 mr-2" />
                    Start 14-day Free Trial
                  </button>
                  <p className="text-xs text-gray-500 text-center mt-2">
                    You won't be charged until your trial ends
                  </p>
                </div>
              </form>
            </div>
          </motion.div>

          {/* Order Summary */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="bg-white rounded-xl border border-gray-200 p-8 sticky top-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">
                Order Summary
              </h2>

              {/* Plan Details */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900">
                    {plan.name} Plan
                  </span>
                </div>

                {/* Billing Cycle Toggle */}
                <div className="flex items-center space-x-4 mb-4 p-3 bg-gray-50 rounded-lg">
                  <button
                    onClick={() => setBillingCycle("monthly")}
                    className={`text-sm ${billingCycle === "monthly" ? "font-medium text-gray-900" : "text-gray-600"}`}
                  >
                    Monthly
                  </button>
                  <div className="flex-1 relative">
                    <div className="h-px bg-gray-300"></div>
                  </div>
                  <button
                    onClick={() => setBillingCycle("yearly")}
                    className={`text-sm ${billingCycle === "yearly" ? "font-medium text-gray-900" : "text-gray-600"}`}
                  >
                    Yearly
                    {savings > 0 && (
                      <span className="ml-1 px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full">
                        Save ${savings}
                      </span>
                    )}
                  </button>
                </div>

                {/* Price Display */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">
                      {billingCycle === "yearly"
                        ? "Annual subscription"
                        : "Monthly subscription"}
                    </span>
                    <span className="font-medium">${price}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>Effective monthly cost</span>
                    <span>${monthlyPrice}/month</span>
                  </div>
                </div>
              </div>

              {/* Features */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-900 mb-3">
                  What's included:
                </h4>
                <div className="space-y-2">
                  {[
                    { icon: MessageSquare, text: "200 testimonials/month" },
                    { icon: Zap, text: "500 AI processing credits" },
                    { icon: Users, text: "Up to 10 team members" },
                    { icon: Shield, text: "Priority support" },
                  ].map((feature, index) => (
                    <div key={index} className="flex items-center text-sm">
                      <Check className="w-4 h-4 text-green-500 mr-3 flex-shrink-0" />
                      <feature.icon className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
                      <span className="text-gray-700">{feature.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Trial Info */}
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 mb-6">
                <div className="flex items-center mb-2">
                  <Calendar className="w-4 h-4 text-blue-600 mr-2" />
                  <span className="text-sm font-medium text-blue-900">
                    14-day free trial
                  </span>
                </div>
                <p className="text-xs text-blue-800">
                  Start using all features immediately. Cancel anytime during
                  your trial at no cost.
                </p>
              </div>

              {/* Security Notice */}
              <div className="flex items-center justify-center text-xs text-gray-500">
                <Shield className="w-3 h-3 mr-1" />
                <span>256-bit SSL encryption</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
