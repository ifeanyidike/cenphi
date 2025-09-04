import { useState, useEffect } from "react";
import { Sparkles } from "lucide-react";
import { useSearchParams } from "react-router-dom";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ReviewsSection } from "./ReviewsSection";
import { AIActionsCard } from "./AIActionsCard";
import { PerformanceMetricsCard } from "./PerformanceMetricsCard";
// import { GoogleDriveCard } from "./GoogleDriveCard";
// import { LinkedInCard } from "./LinkedInCard";
import GoogleDriveTestimonialCollection from "./GoogleDriveTestimonialCollection";
import LinkedInTestimonialCollection from "./LinkedInTestimonialCollection";
import { observer } from "mobx-react-lite";

export const ContentView = observer(() => {
  const [searchParams] = useSearchParams();
  const [currentTab, setCurrentTab] = useState("overview");
  
  console.log('ContentView rendered, currentTab:', currentTab);
  
  // Handle URL parameters to set initial tab
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['overview', 'reviews', 'google-drive', 'linkedin', 'analytics'].includes(tabParam)) {
      console.log('Setting tab from URL parameter:', tabParam);
      setCurrentTab(tabParam);
    }
  }, [searchParams]);

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
          {/* <TabsTrigger
            value="google-drive"
            className="data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700 dark:data-[state=active]:bg-gray-700"
          >
            <Cloud className="w-4 h-4 mr-2" />
            Google Drive
          </TabsTrigger>
          <TabsTrigger
            value="linkedin"
            className="data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700 dark:data-[state=active]:bg-gray-700"
          >
            <Linkedin className="w-4 h-4 mr-2" />
            LinkedIn
          </TabsTrigger> */}
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
            {/* <GoogleDriveCard /> */}
            {/* <LinkedInCard /> */}
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
        value="google-drive"
        className="mt-0 focus-visible:outline-none focus-visible:ring-0"
      >
        <motion.div
          key="google-drive"
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm"
        >
          <GoogleDriveTestimonialCollection />
        </motion.div>
      </TabsContent>

      <TabsContent
        value="linkedin"
        className="mt-0 focus-visible:outline-none focus-visible:ring-0"
      >
        <motion.div
          key="linkedin"
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm"
        >
          <LinkedInTestimonialCollection />
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
