import { useState } from "react";
import { Sparkles } from "lucide-react";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ReviewsSection } from "./ReviewsSection";
import { AIActionsCard } from "./AIActionsCard";
import { PerformanceMetricsCard } from "./PerformanceMetricsCard";
import { observer } from "mobx-react-lite";

export const ContentView = observer(() => {
  const [currentTab, setCurrentTab] = useState("overview");
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4 },
    },
  };

  return (
    <Tabs
      defaultValue="overview"
      value={currentTab}
      onValueChange={setCurrentTab}
      className="mt-6"
    >
      <div className="flex justify-between items-center mb-6">
        <TabsList className="bg-white dark:bg-gray-800 p-1 shadow-sm">
          <TabsTrigger
            value="overview"
            className="data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700 dark:data-[state=active]:bg-gray-700"
          >
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="reviews"
            className="data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700 dark:data-[state=active]:bg-gray-700"
          >
            Reviews
          </TabsTrigger>
          <TabsTrigger
            value="analytics"
            className="data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700 dark:data-[state=active]:bg-gray-700"
          >
            Analytics
          </TabsTrigger>
        </TabsList>

        <div className="hidden sm:block">
          <Button
            variant="ghost"
            size="sm"
            className="text-purple-600 hover:text-purple-800 hover:bg-purple-50"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            AI Insights
          </Button>
        </div>
      </div>

      <TabsContent
        value="overview"
        className="mt-0 focus-visible:outline-none focus-visible:ring-0"
      >
        <motion.div
          key="overview"
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
          <div className="lg:col-span-2">
            <ReviewsSection />
          </div>

          <div className="space-y-6">
            <AIActionsCard />
            <PerformanceMetricsCard />
            {/* <RecentActivityFeed /> */}
          </div>
        </motion.div>
      </TabsContent>

      <TabsContent
        value="reviews"
        className="mt-0 focus-visible:outline-none focus-visible:ring-0"
      >
        <motion.div
          key="reviews"
          initial="hidden"
          animate="visible"
          variants={fadeIn}
        >
          <ReviewsSection fullWidth={true} />
        </motion.div>
      </TabsContent>

      <TabsContent
        value="analytics"
        className="mt-0 focus-visible:outline-none focus-visible:ring-0"
      >
        <motion.div
          key="analytics"
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6"
        >
          <h3 className="text-lg font-medium mb-4">Analytics Coming Soon</h3>
          <p className="text-gray-500">
            Advanced analytics features are currently in development.
          </p>
        </motion.div>
      </TabsContent>
    </Tabs>
  );
});
