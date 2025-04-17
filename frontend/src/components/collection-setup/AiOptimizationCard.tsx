import React from "react";
import { observer } from "mobx-react-lite";
import { motion } from "framer-motion";
import { Sparkles, Star } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { itemVariants } from "@/utils/helpers";
import useLoadingState from "@/hooks/use-loading-state";

interface AiOptimizationCardProps {
  showToast: (toast: {
    title: string;
    description: string;
    variant?: "default" | "destructive";
  }) => void;
}

const AiOptimizationCard: React.FC<AiOptimizationCardProps> = ({
  showToast,
}) => {
  const { isLoading, simulateLoading } = useLoadingState();

  const handleOptimize = () => {
    showToast({
      title: "AI Optimization",
      description:
        "Analyzing your settings to provide optimization recommendations...",
      variant: "default",
    });

    simulateLoading(() => {
      showToast({
        title: "Recommendations Ready",
        description:
          "AI has analyzed your settings and provided recommendations.",
        variant: "default",
      });
    }, 2000);
  };

  return (
    <motion.div variants={itemVariants}>
      <Card className="shadow-sm">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-white text-blue-500 shadow-sm">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base">
                AI Optimization Available
              </CardTitle>
              <CardDescription>
                Let our AI help you optimize your testimonial collection
                strategy.
              </CardDescription>
            </div>
            <Button
              variant="secondary"
              size="sm"
              className="ml-auto"
              onClick={handleOptimize}
              disabled={isLoading}
            >
              <Star className="h-4 w-4 mr-2 text-amber-500" />
              <span>{isLoading ? "Analyzing..." : "Optimize"}</span>
            </Button>
          </div>
        </CardHeader>
      </Card>
    </motion.div>
  );
};

export default observer(AiOptimizationCard);
