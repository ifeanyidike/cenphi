import React, { useEffect, useState } from "react";
import {
  MessageSquare,
  Plus,
  Star,
  TrendingUp,
  Activity,
  Settings,
  PlusCircle,
  ChevronDown,
  ChevronUp,
  BarChart3,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { observer } from "mobx-react-lite";
import { itemVariants } from "./constants";
import { StatCard } from "./components";
import { EmptyStateView } from "./EmptyView";
import { Testimonial } from "@/types/testimonial";
import { workspaceHub } from "@/repo/workspace_hub";
import TestimonialList from "./TestimonialList";
import AIFeaturesDashboard from "./AIFeaturesDashboard";
import { useNavigate } from "react-router-dom";

// AI Generated Content Card Component
const AIGeneratedContentCard: React.FC<{ onNavigate: () => void }> = observer(
  ({ onNavigate }) => {
    const multiArtifacts =
      workspaceHub.testimonialManager.getMultiTestimonialArtifacts();

    if (multiArtifacts.length === 0) {
      return null; // Don't show the card if there are no multi-testimonial artifacts
    }

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-purple-600 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  AI-Generated Content
                </h3>
                <p className="text-sm text-gray-600">
                  You have {multiArtifacts.length} piece
                  {multiArtifacts.length !== 1 ? "s" : ""} of content created
                  from multiple testimonials
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-2xl font-bold text-purple-600">
                  {multiArtifacts.length}
                </div>
                <div className="text-xs text-gray-500">Ready to use</div>
              </div>
              <Button
                onClick={onNavigate}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                View All
                <ChevronUp className="h-4 w-4 ml-2 rotate-90" />
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }
);

const DashboardView: React.FC = observer(() => {
  const [isStatsOpen, setIsStatsOpen] = useState(true);
  const navigate = useNavigate();

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
    ? (totalRating! / testimonials.length).toFixed(1)
    : "";
  const conversionRate = testimonials?.reduce(
    (acc: number, curr: Testimonial) => acc + (curr.conversion_count || 0),
    0
  );

  const toggleStats = () => {
    setIsStatsOpen(!isStatsOpen);
  };

  return (
    <>
      <motion.div
        variants={itemVariants}
        className="flex justify-between items-center mb-10"
      >
        {hasTestimonials ? (
          <>
            <div>
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

      {/* Stats Section Header with Toggle */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <BarChart3 className="h-5 w-5 text-gray-600" />
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
            Analytics Overview
          </h2>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleStats}
          className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
        >
          {isStatsOpen ? (
            <>
              <ChevronUp className="h-4 w-4 mr-1" />
              Hide Stats
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4 mr-1" />
              Show Stats
            </>
          )}
        </Button>
      </div>

      {/* Collapsible Stats Overview */}
      <motion.div
        animate={{
          height: isStatsOpen ? "auto" : 0,
          opacity: isStatsOpen ? 1 : 0,
          marginBottom: isStatsOpen ? 40 : 0,
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="overflow-hidden"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
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
      </motion.div>

      {hasTestimonials && (
        <motion.div variants={itemVariants} className="mb-8">
          <AIFeaturesDashboard />
        </motion.div>
      )}

      {hasTestimonials && (
        <motion.div variants={itemVariants} className="mb-8">
          <AIGeneratedContentCard onNavigate={() => navigate(`/ai-content`)} />
        </motion.div>
      )}

      {/* Main Content Area */}
      {hasTestimonials ? <TestimonialList /> : <EmptyStateView />}
    </>
  );
});

export default DashboardView;
