import React, { useEffect, useState } from "react";
import {
  MessageSquare,
  Plus,
  Star,
  Settings,
  PlusCircle,
  ChevronDown,
  ChevronUp,
  BarChart3,
  Sparkles,
  Mail,
  Brain,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { observer } from "mobx-react-lite";
import { itemVariants } from "./constants";
import { StatCard } from "./components";
import { EmptyStateView } from "./EmptyView";

import { workspaceHub } from "@/repo/workspace_hub";
import TestimonialList from "./TestimonialList";
import AIFeaturesDashboard from "./AIFeaturesDashboard";
import TestimonialRequestModal from "./TestimonialRequestModal";
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
        <div className="bg-white border border-gray-200 rounded p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-gray-600" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-900">
                  AI-Generated Content
                </h3>
                <p className="text-xs text-gray-600">
                  {multiArtifacts.length} piece
                  {multiArtifacts.length !== 1 ? "s" : ""} ready to use
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between sm:justify-end gap-3">
              <div className="text-right">
                <div className="text-lg font-semibold text-gray-900">
                  {multiArtifacts.length}
                </div>
                <div className="text-xs text-gray-500">Items</div>
              </div>
              <Button onClick={onNavigate} size="sm" className="text-xs h-7 whitespace-nowrap">
                View All
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
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      await workspaceHub.testimonialManager.getTestimonials();
    })();
  }, []);

  const testimonials = workspaceHub.testimonialManager.testimonials;
  const isLoading = workspaceHub.testimonialManager.loading_testimonials;

  const hasTestimonials = testimonials?.length;
  // const totalRating = testimonials?.reduce(
  //   (acc: number, curr: Testimonial) => acc + (curr.rating || 0),
  //   0
  // );
  // const avgRating = testimonials?.length
  //   ? (totalRating! / testimonials.length).toFixed(1)
  //   : "";
  // const conversionRate = testimonials?.reduce(
  //   (acc: number, curr: Testimonial) => acc + (curr.conversion_count || 0),
  //   0
  // );

  const toggleStats = () => {
    setIsStatsOpen(!isStatsOpen);
  };

  return (
    <>
      <motion.div
        variants={itemVariants}
        className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-6 mb-10"
      >
        {hasTestimonials ? (
          <>
            <div className="flex-1">
              <p className="text-gray-500 dark:text-gray-400 mt-1">
                Manage, analyze and leverage your customer reviews
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                className="hidden md:flex"
                onClick={() => navigate("/settings")}
              >
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
              <Button
                onClick={() => setIsRequestModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all duration-300 text-sm"
              >
                <Mail className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Request Testimonials</span>
                <span className="sm:hidden">Request</span>
              </Button>
              <Button className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-md hover:shadow-lg transition-all duration-300 text-sm">
                <PlusCircle className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Add Testimonial</span>
                <span className="sm:hidden">Add</span>
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="flex-1">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
                Welcome to Your Testimonial Dashboard
              </h1>
              <p className="text-gray-500 max-w-2xl mt-2 text-sm sm:text-base">
                Your journey to collecting powerful social proof starts here.
                Request testimonials from your customers or add your first
                testimonial manually.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <Button
                onClick={() => setIsRequestModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 text-sm"
              >
                <Mail className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Request Testimonials</span>
                <span className="sm:hidden">Request</span>
              </Button>
              <Button
                variant="outline"
                className="border-purple-200 text-purple-700 hover:bg-purple-50 shadow-lg hover:shadow-xl transition-all duration-300 text-sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Add Manually</span>
                <span className="sm:hidden">Add</span>
              </Button>
            </div>
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
            title="Total Testimonials"
            icon={MessageSquare}
            message="Testimonials collected"
            color="bg-gray-600"
            accentColor="bg-gray-600"
            value={hasTestimonials ? `${testimonials.length}` : "0"}
            isLoading={isLoading}
          />
          <StatCard
            title="AI Processing Rate"
            icon={Brain}
            message="Enhanced with AI"
            color="bg-gray-600"
            accentColor="bg-gray-600"
            value={
              hasTestimonials
                ? `${Math.round((testimonials.filter((t) => t.processing_status === "completed").length / testimonials.length) * 100)}%`
                : "0%"
            }
            isLoading={isLoading}
          />
          <StatCard
            title="Quality Score"
            icon={Star}
            message="Average sentiment"
            color="bg-gray-600"
            accentColor="bg-gray-600"
            value={
              hasTestimonials && testimonials.length > 0
                ? `${Math.round((testimonials.reduce((sum, t) => sum + (t.sentiment_score || 0), 0) / testimonials.length) * 100)}%`
                : "0%"
            }
            isLoading={isLoading}
          />
          <StatCard
            title="Artifacts Created"
            icon={Sparkles}
            message="AI-generated content"
            color="bg-gray-600"
            accentColor="bg-gray-600"
            value={
              hasTestimonials
                ? `${testimonials.reduce((sum, t) => sum + (t.artifacts?.length || 0), 0)}`
                : "0"
            }
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

      {/* Testimonial Request Modal */}
      <TestimonialRequestModal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
      />
    </>
  );
});

export default DashboardView;
