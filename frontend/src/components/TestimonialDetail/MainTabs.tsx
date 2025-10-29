// components/TestimonialDetail/MainTabs.tsx
import React from "react";
import { motion } from "framer-motion";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { FileText, Sparkles, Check, ArrowRight } from "lucide-react";

interface MainTabsProps {
  artifactsCount: number;
  completedFeaturesCount: number;
  totalFeaturesCount: number;
  hasNewFeatures?: boolean;
}

const MainTabs: React.FC<MainTabsProps> = ({
  artifactsCount,
  completedFeaturesCount,
  totalFeaturesCount,
  hasNewFeatures = true,
}) => {
  const completionPercentage =
    totalFeaturesCount > 0
      ? Math.round((completedFeaturesCount / totalFeaturesCount) * 100)
      : 0;

  return (
    <TabsList className="bg-white shadow-sm border border-gray-200 p-1 rounded-lg">
      <TabsTrigger
        value="overview"
        className="data-[state=active]:bg-gray-100 data-[state=active]:text-gray-900 relative px-4 py-2 rounded-md transition-all duration-200"
      >
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          <span className="font-medium text-sm">Overview</span>
        </div>
      </TabsTrigger>

      <TabsTrigger
        value="artifacts"
        className="data-[state=active]:bg-gray-100 data-[state=active]:text-gray-900 relative px-4 py-2 rounded-md transition-all duration-200 group"
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <Sparkles className="h-4 w-4 text-gray-600" />
            {hasNewFeatures && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-blue-500 rounded-full"
              />
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">Insights</span>
            {completedFeaturesCount > 0 && (
              <div className="flex items-center gap-1">
                <Check className="h-3 w-3 text-green-600" />
                <span className="text-xs text-green-600 font-medium">
                  {completedFeaturesCount}
                </span>
              </div>
            )}
          </div>

          {/* Progress indicator */}
          {totalFeaturesCount > 0 && completionPercentage < 100 && (
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <span>{completionPercentage}% done</span>
              <motion.div
                animate={{ x: [0, 2, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="text-blue-600"
              >
                <ArrowRight className="h-3 w-3" />
              </motion.div>
            </div>
          )}

          {/* Results Count */}
          {artifactsCount > 0 && (
            <Badge
              variant="secondary"
              className="bg-gray-100 text-gray-700 border-gray-300 text-xs px-1.5 py-0.5"
            >
              {artifactsCount}
            </Badge>
          )}

          {/* New Badge */}
          {hasNewFeatures && artifactsCount === 0 && (
            <Badge
              variant="secondary"
              className="bg-blue-100 text-blue-700 border-blue-200 text-xs px-1.5 py-0.5"
            >
              New
            </Badge>
          )}
        </div>

        {/* Subtle Progress Bar */}
        {totalFeaturesCount > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${completionPercentage}%` }}
              transition={{ duration: 1, delay: 0.5 }}
              className="h-full bg-blue-500"
            />
          </div>
        )}
      </TabsTrigger>
    </TabsList>
  );
};

export default MainTabs;
