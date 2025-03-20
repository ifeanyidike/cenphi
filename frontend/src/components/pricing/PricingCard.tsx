import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { PricingCardProps } from "./types";
import PriceDisplay from "./PriceDisplay";
import { cardVariants } from "./data";
import CardHeader from "./CardHeader";
import CardFeatures from "./CardFeatures";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { appService } from "@/services/appService";
import { observer } from "mobx-react-lite";
import { authStore } from "@/stores/authStore";
import { notification } from "antd";

export type Feature = {
  name: string;
  included: boolean;
  highlight?: boolean;
};

const PricingCard = observer(
  ({
    plan,
    activePlan,
    setActivePlan,
    annual,
    currentPlan,
  }: PricingCardProps) => {
    const [isHovering, setIsHovering] = useState(false);
    const [searchParams] = useSearchParams();
    const user = authStore.currentUser;

    const navigate = useNavigate();
    const location = useLocation();
    const workflow = searchParams.get("workflow");

    const isActive = activePlan === plan.id;
    const isCurrentPlan =
      currentPlan?.toLowerCase() === plan.name.toLowerCase();

    async function handleStartPlan() {
      if (isCurrentPlan) return;
      if (!user?.uid) {
        return navigate(`/login`, { state: { from: location, plan: plan.id } });
      }
      let query = `plan=${plan.id}`;
      if (workflow) {
        query += `&workflow=${workflow}`;
      }

      if (plan.id === "essentials") {
        const resp = await appService.onboard_partial(user?.uid, plan.id);
        if (!resp) {
          notification.error({
            message: "Subscription error",
            description:
              "An error occurred during the subscription process. Please try again.",
          });

          return;
        }

        navigate(`/onboarding?${query}`);
      } else if (plan.id !== "enterprise") {
        navigate(`/checkout?${query}`);
      }
    }

    return (
      <motion.div
        className={cn(
          "group relative rounded-2xl overflow-hidden backdrop-blur-sm border transition-all duration-500",
          plan.borderColor,
          plan.backgroundColor,
          isActive
            ? "ring-3 ring-offset-2 ring-offset-slate-50 dark:ring-offset-slate-900 shadow-2xl z-10 scale-[1.02]"
            : "shadow-xl hover:shadow-2xl hover:scale-[1.01]",
          plan.featured ? "border-2" : "border"
        )}
        initial="initial"
        animate="animate"
        whileHover="hover"
        whileTap="tap"
        variants={cardVariants}
        onClick={() => setActivePlan(plan.id)}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        {/* Enhanced reflective surface */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

        {/* Subtle card grain texture for premium feel */}
        <div
          className="absolute inset-0 opacity-30 mix-blend-overlay pointer-events-none"
          style={{
            backgroundImage:
              "url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIHR5cGU9ImZyYWN0YWxOb2lzZSIgYmFzZUZyZXF1ZW5jeT0iLjc1IiBzdGl0Y2hUaWxlcz0ic3RpdGNoIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxwYXRoIGZpbHRlcj0idXJsKCNhKSIgb3BhY2l0eT0iLjA1IiBkPSJNMCAwaDMwMHYzMDBIMHoiLz48L3N2Zz4=')",
            backgroundSize: "200px",
          }}
        />

        {/* Popular tag with enhanced design  overflow-hidden */}
        {plan.popular && (
          <div className="absolute top-4 -right-0 pt-5 pr-5 z-10">
            <div className="absolute top-0 right-0 transform translate-x-[30%] -translate-y-[30%] rotate-45">
              <motion.div
                className="w-28 h-7 flex items-center justify-center bg-gradient-to-r from-violet-600 to-indigo-600 shadow-lg"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, type: "spring" }}
              >
                <motion.span
                  className="text-xs font-bold uppercase tracking-wide text-white"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  Popular
                </motion.span>
              </motion.div>
            </div>
          </div>
        )}

        {/* Enhanced glowing effect */}
        <motion.div
          className="absolute rounded-full opacity-30 blur-3xl pointer-events-none"
          style={{
            width: "80%",
            height: "70%",
            top: "15%",
            left: "10%",
            background: `radial-gradient(circle, ${plan.glowColor}, transparent 70%)`,
          }}
          initial={{ opacity: 0 }}
          animate={{
            opacity: isActive ? 0.5 : isHovering ? 0.3 : 0.1,
            scale: isActive ? 1.05 : 1,
          }}
          transition={{ duration: 0.8 }}
        />

        <div className="relative z-10 p-6">
          {/* Header Section */}
          <CardHeader isActive={isActive} plan={plan} />

          {/* Description with improved styling */}
          <p className="text-sm text-slate-600 dark:text-slate-300 mb-5 leading-snug min-h-[40px] font-medium">
            {plan.description}
          </p>

          {/* Enhanced Pricing Section */}
          <div className="mb-6 bg-gradient-to-br from-slate-50 to-transparent dark:from-slate-800/20 dark:to-transparent p-3 rounded-xl">
            <PriceDisplay annual={annual} plan={plan} />
          </div>

          {/* Enhanced CTA Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="relative w-full py-3 px-4 rounded-xl font-semibold shadow-lg overflow-hidden group/btn"
            onClick={handleStartPlan}
          >
            <div
              className={cn(
                "absolute inset-0 bg-gradient-to-r transition-all duration-300",
                plan.color,
                plan.hoverColor
              )}
            />
            {/* Interactive light reflection effect */}
            <motion.div
              className="absolute inset-0 opacity-0 group-hover/btn:opacity-20 bg-[radial-gradient(circle_at_center,_white_0%,_transparent_60%)]"
              initial={{ x: -100 }}
              whileHover={{ x: 100 }}
              transition={{ duration: 0.7 }}
            />
            <span className="relative flex items-center justify-center gap-2 text-white">
              {/* {plan.cta} */}

              {isCurrentPlan ? "Current Plan" : plan.cta}
              {!isCurrentPlan && (
                <ArrowRight className="w-4 h-4 transform group-hover/btn:translate-x-1 transition-transform" />
              )}
            </span>
          </motion.button>
        </div>

        {/* Features Section with enhanced UI to show hidden features */}
        <CardFeatures activePlan={activePlan} isActive={isActive} plan={plan} />

        {/* Active indicator with enhanced animation */}
        <motion.div
          className={cn(
            "absolute bottom-0 left-0 right-0 h-1.5 bg-gradient-to-r",
            plan.color
          )}
          initial={{ scaleX: 0, originX: 0 }}
          animate={{
            scaleX: isActive ? 1 : 0,
            boxShadow: isActive ? "0 0 10px rgba(79, 70, 229, 0.5)" : "none",
          }}
          transition={{ duration: 0.4 }}
        />
      </motion.div>
    );
  }
);

export default PricingCard;
