import React from "react";
import { Bot, Brain, Sparkles, BarChart3, Zap, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

export const AIActionsCard = () => {
  return (
    <Card className="border-0 shadow-xl overflow-hidden bg-white">
      <CardHeader className="p-6 border-b bg-gray-50/60">
        <CardTitle className="text-lg font-semibold flex items-center">
          <Zap className="h-5 w-5 text-amber-500 mr-2" />
          AI Tools
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-3">
          <ActionButton
            label="AI Response Generator"
            description="Create perfect replies with AI"
            icon={Bot}
            color="bg-emerald-600"
            bgColor="bg-emerald-50"
          />
          <ActionButton
            label="Sentiment Analysis"
            description="Understand customer emotions"
            icon={Brain}
            color="bg-blue-600"
            bgColor="bg-blue-50"
          />
          <ActionButton
            label="Performance Reports"
            description="Track & visualize your growth"
            icon={BarChart3}
            color="bg-purple-600"
            bgColor="bg-purple-50"
          />
        </div>

        <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Sparkles className="h-4 w-4 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-indigo-700">
                Premium Features Await
              </p>
              <p className="text-xs text-indigo-600/70 mt-1">
                Add your first testimonial to unlock these powerful tools.
              </p>
            </div>
          </div>
        </div>
        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-5 text-center"
        >
          <Button
            variant="ghost"
            size="sm"
            className="w-full bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 hover:from-indigo-100 hover:to-purple-100 dark:hover:from-indigo-900/40 dark:hover:to-purple-900/40 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800"
          >
            <span>View all AI tools</span>
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </motion.div>
      </CardContent>
    </Card>
  );
};

interface ActionButtonProps {
  label: string;
  description: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}

const ActionButton: React.FC<ActionButtonProps> = ({
  label,
  description,
  icon: Icon,
  color,
  bgColor,
}) => (
  <motion.button
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    className={`w-full flex items-center space-x-3 p-4 rounded-xl ${bgColor} border border-transparent hover:border-gray-200 transition-all duration-200`}
  >
    <div className={`p-2 rounded-lg ${color}`}>
      <Icon className="h-5 w-5 text-white" />
    </div>
    <div className="text-left">
      <span className="font-medium text-gray-800 block">{label}</span>
      <span className="text-xs text-gray-500">{description}</span>
    </div>
  </motion.button>
);
