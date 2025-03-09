import { motion } from "framer-motion";
import { CheckIcon } from "lucide-react";
import { Plan } from "@/components/pricing/types";
// Component for card display in checkout flow
const PlanCard = ({
  plan,
  billingCycle,
}: {
  plan: Plan;
  billingCycle: "monthly" | "yearly";
}) => {
  const price =
    billingCycle === "monthly" ? plan.monthlyPrice : plan.yearlyPrice;

  return (
    <motion.div
      className="rounded-2xl p-6 overflow-hidden relative border"
      style={{
        backgroundColor: plan.backgroundColor,
        borderColor: plan.borderColor,
        color: plan.textColor,
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      {plan.popular && (
        <div className="absolute -right-10 top-5 rotate-45 bg-gradient-to-r from-amber-500 to-yellow-400 px-10 py-1 text-xs font-semibold text-white">
          POPULAR
        </div>
      )}

      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center">
          <div
            className="p-2 rounded-lg mr-3"
            style={{ backgroundColor: plan.iconBg }}
          >
            {plan.icon}
          </div>
          <div>
            <h3 className="text-lg font-bold">{plan.name}</h3>
            <p className="text-sm opacity-80">{plan.description}</p>
          </div>
        </div>
      </div>

      <div className="mt-4 mb-6">
        {price !== undefined && (
          <div className="flex items-baseline">
            <span className="text-3xl font-bold">${price}</span>
            <span className="ml-2 text-sm opacity-80">
              /{billingCycle === "monthly" ? "month" : "month, billed yearly"}
            </span>
          </div>
        )}
        {plan.customPrice && (
          <div className="text-lg font-semibold">Contact Sales</div>
        )}
      </div>

      <div className="space-y-2 mb-4">
        {plan.features.slice(0, 3).map((feature, index) => (
          <div key={index} className="flex items-center">
            <CheckIcon className="w-4 h-4 mr-2 flex-shrink-0" />
            <span className="text-sm">{feature.name}</span>
          </div>
        ))}
        {plan.features.length > 3 && (
          <div className="text-sm opacity-80 mt-1">
            +{plan.features.length - 3} more features
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default PlanCard;
