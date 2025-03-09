import { useEffect, useState } from "react";
import { CardFeaturesProps } from "./types";
import { Check, ChevronDown, ChevronUp, Plus, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { featureVariants } from "./data";
import { cn } from "@/lib/utils";

const CardFeatures = ({ plan, activePlan, isActive }: CardFeaturesProps) => {
  const [expandFeatures, setExpandFeatures] = useState(false);
  const initialVisibleCount = 8;

  const hiddenFeaturesCount = plan.features.length - initialVisibleCount;
  const hasMoreFeatures = plan.features.length > initialVisibleCount;

  useEffect(() => {
    // Auto-expand features for the active plan
    if (activePlan === plan.id) {
      setExpandFeatures(true);
    }
  }, [activePlan, plan.id]);

  // Calculate visible features based on expand state
  const visibleFeatures = expandFeatures
    ? plan.features
    : plan.features.slice(0, initialVisibleCount);
  return (
    <div className="border-t border-slate-200/20 p-5 bg-white/5 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-300/80">
          Key Features
        </h4>
        {hasMoreFeatures && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setExpandFeatures(!expandFeatures);
            }}
            className="text-xs font-medium flex items-center gap-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500 dark:text-indigo-300 hover:text-indigo-400 px-2 py-1 rounded-full transition-colors"
          >
            {expandFeatures ? (
              <>
                Show less <ChevronUp className="w-3 h-3" />
              </>
            ) : (
              <>
                Show all <ChevronDown className="w-3 h-3" />
              </>
            )}
          </button>
        )}
      </div>

      <ul className="space-y-2.5">
        <AnimatePresence>
          {visibleFeatures.map((feature, index) => (
            <motion.li
              key={index}
              custom={index}
              variants={featureVariants}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, y: -10 }}
              className={cn(
                "flex items-start gap-2 text-sm",
                feature.highlight
                  ? "bg-indigo-50/20 dark:bg-indigo-900/10 -mx-2 px-2 py-1.5 rounded-md border-l-2 border-indigo-300 dark:border-indigo-500"
                  : ""
              )}
            >
              {feature.included ? (
                <div className="bg-emerald-50 dark:bg-emerald-900/20 p-0.5 rounded-full mt-0.5">
                  <Check
                    className={cn(
                      "h-3 w-3 text-emerald-500 flex-shrink-0",
                      isActive && feature.highlight ? "animate-pulse" : ""
                    )}
                  />
                </div>
              ) : (
                <div className="bg-slate-100 dark:bg-slate-800 p-0.5 rounded-full mt-0.5">
                  <X className="h-3 w-3 text-slate-400 flex-shrink-0" />
                </div>
              )}
              <span
                className={
                  feature.included
                    ? "text-slate-700 dark:text-slate-200"
                    : "text-slate-400 dark:text-slate-500"
                }
              >
                {feature.name}
              </span>
              {feature.highlight && (
                <span className="ml-auto text-xs font-medium px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300">
                  Recommended
                </span>
              )}
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>

      {/* Enhanced "Show more" indicator */}
      {!expandFeatures && hasMoreFeatures && (
        <motion.div
          className="mt-4 relative"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {/* Gradient fade effect */}
          <div className="absolute -top-16 left-0 right-0 h-16 bg-gradient-to-t from-white/90 dark:from-slate-900/90 to-transparent pointer-events-none" />

          {/* Hidden features count indicator */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setExpandFeatures(true);
            }}
            className="w-full flex items-center justify-center gap-2 py-2 text-sm font-medium text-indigo-500 dark:text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-lg border border-indigo-100 dark:border-indigo-800/30 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>
              {hiddenFeaturesCount} more feature
              {hiddenFeaturesCount !== 1 ? "s" : ""}
            </span>
          </button>
        </motion.div>
      )}
    </div>
  );
};

export default CardFeatures;
