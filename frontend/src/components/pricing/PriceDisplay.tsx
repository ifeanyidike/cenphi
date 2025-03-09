import { motion } from "framer-motion";
import { PriceDisplayProps } from "./types";

const PriceDisplay = ({ plan, annual }: PriceDisplayProps) => {
  if (plan.customPrice) {
    return (
      <div className="flex items-end">
        <span className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-300">
          Custom
        </span>
      </div>
    );
  }

  const price = annual ? plan.yearlyPrice : plan.monthlyPrice;
  return (
    <>
      <div className="flex items-baseline">
        {!price ? (
          <div className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-300">
            Free
          </div>
        ) : (
          <>
            <span className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-300">
              ${price}
            </span>
            <span className="text-slate-500 dark:text-slate-400 ml-2 text-lg font-medium">
              /mo
            </span>
          </>
        )}
      </div>
      {Boolean(annual && !plan.customPrice && (plan.yearlyPrice || 0) > 0) && (
        <motion.p
          className="text-sm text-emerald-500 font-medium mt-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          Billed annually (${(plan.yearlyPrice || 0) * 12}/year)
        </motion.p>
      )}
    </>
  );
};

export default PriceDisplay;
