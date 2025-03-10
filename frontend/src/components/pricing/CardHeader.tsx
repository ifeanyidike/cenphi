import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Plan } from "./types";
import { Sparkles } from "lucide-react";
const CardHeader = ({ plan, isActive }: { plan: Plan; isActive: boolean }) => {
  return (
    <div className="flex items-center gap-3 mb-3">
      <motion.div
        className={cn(
          "p-2 rounded-full bg-opacity-20 backdrop-blur-md shadow-sm",
          plan.iconBg
        )}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, type: "spring" }}
      >
        {plan.icon}
      </motion.div>
      <motion.h3
        className={cn("text-xl font-bold", plan.textColor)}
        initial={{ x: -10, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {plan.name}
      </motion.h3>
      {isActive && (
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
          className="ml-auto flex items-center text-xs font-medium text-indigo-400 gap-1 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-1 rounded-full"
        >
          <Sparkles className="w-3 h-3" />
          <span>Selected</span>
        </motion.div>
      )}
    </div>
  );
};

export default CardHeader;
