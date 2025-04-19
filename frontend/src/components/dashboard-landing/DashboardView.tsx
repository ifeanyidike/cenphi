import React, { useEffect } from "react";
import {
  MessageSquare,
  Plus,
  Star,
  TrendingUp,
  Activity,
  Settings,
  PlusCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { observer } from "mobx-react-lite";
import { itemVariants } from "./constants";
import { StatCard } from "./components";
import { ContentView } from "./ContentView";
import { EmptyStateView } from "./EmptyView";
import { Testimonial } from "@/types/testimonial";
import { workspaceHub } from "@/repo/workspace_hub";

const DashboardView: React.FC = observer(() => {
  useEffect(() => {
    (async () => {
      await workspaceHub.testimonialManager.getTestimonials();
    })();
  }, []);

  const testimonials = workspaceHub.testimonialManager.testimonials;
  const isLoading = workspaceHub.testimonialManager.loading_testimonials;

  const hasTestimonials = testimonials?.length;
  const totalRating = testimonials?.reduce(
    (acc: number, curr: Testimonial) => acc + (curr.rating || 0),
    0
  );
  const avgRating = testimonials?.length
    ? totalRating! / testimonials.length
    : "";
  const conversionRate = testimonials?.reduce(
    (acc: number, curr: Testimonial) => acc + (curr.conversion_count || 0),
    0
  );

  return (
    <>
      <motion.div
        variants={itemVariants}
        className="flex justify-between items-center mb-10"
      >
        {hasTestimonials ? (
          <>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                Testimonial Dashboard
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1">
                Manage, analyze and leverage your customer reviews
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <Button variant="outline" size="sm" className="hidden md:flex">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
              <Button className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-md hover:shadow-lg transition-all duration-300">
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Testimonial
              </Button>
            </div>
          </>
        ) : (
          <>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
                Welcome to Your Testimonial Dashboard
              </h1>
              <p className="text-gray-500 max-w-2xl mt-2">
                Your journey to collecting powerful social proof starts here.
                Add your first customer to unlock the full potential of your
                dashboard.
              </p>
            </div>
            <Button
              variant="default"
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Testimonial
            </Button>
          </>
        )}
      </motion.div>

      {/* Empty Stats Overview with Premium Design */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
        <StatCard
          title="Total Reviews"
          icon={MessageSquare}
          message="Start collecting reviews"
          color="bg-blue-500"
          accentColor="bg-blue-500"
          percentage={hasTestimonials ? "20" : undefined}
          trend={hasTestimonials ? "10" : ""}
          value={hasTestimonials ? `${testimonials.length}` : ""}
          isLoading={isLoading}
        />
        <StatCard
          title="Average Rating"
          icon={Star}
          message="Awaiting your first rating"
          color="bg-amber-500"
          accentColor="bg-amber-500"
          percentage={hasTestimonials ? "20" : undefined}
          trend={hasTestimonials ? "10" : ""}
          value={`${avgRating}`}
          isLoading={isLoading}
        />
        <StatCard
          title="Conversion Rate"
          icon={TrendingUp}
          message="Track visitor conversions"
          color="bg-green-500"
          accentColor="bg-green-500"
          percentage={hasTestimonials ? "20" : undefined}
          trend={hasTestimonials ? "10" : ""}
          value={hasTestimonials ? `${conversionRate}` : ""}
          isLoading={isLoading}
        />
        <StatCard
          title="Total Reach"
          icon={Activity}
          message="Measure your impact"
          color="bg-purple-500"
          accentColor="bg-purple-500"
          percentage={hasTestimonials ? "20" : undefined}
          trend={hasTestimonials ? "10" : ""}
          value={hasTestimonials ? `100` : ""} // Add total reach to db
          isLoading={isLoading}
        />
      </div>

      {/* Main Content Area */}
      {hasTestimonials ? <ContentView /> : <EmptyStateView />}
    </>
  );
});

export default DashboardView;
