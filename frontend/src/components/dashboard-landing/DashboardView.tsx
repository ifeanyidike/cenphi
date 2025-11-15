import React, { useState } from "react";
import {
  MessageSquare,
  Star,
  Sparkles,
  Mail,
  Brain,
  Share2,
  ChevronRight,
  TrendingUp,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { observer } from "mobx-react-lite";
import { itemVariants } from "./constants";
import { StatCard } from "./components";
import { EmptyStateView } from "./EmptyView";

import { workspaceHub } from "@/repo/workspace_hub";
import TestimonialList from "./TestimonialList";
import AIFeaturesDashboard from "./AIFeaturesDashboard";
import TestimonialRequestModal from "./TestimonialRequestModal";
import CollectLinkShareModal from "./CollectLinkShareModal";
import ConfirmDialog from "../common/ConfirmDialog";
import { useNavigate } from "react-router-dom";

// Professional AI Content Insights Card
const AIContentInsightsCard: React.FC<{ onNavigate: () => void }> = observer(
  ({ onNavigate }) => {
    const multiArtifacts =
      workspaceHub.testimonialManager.getMultiTestimonialArtifacts();

    if (multiArtifacts.length === 0) {
      return null;
    }

    return (
      <Card className="border border-slate-200 bg-gradient-to-br from-white to-slate-50 hover:shadow-md transition-all duration-300">
        <div className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 flex-1">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-sm">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-slate-900 mb-1">
                  AI-Generated Content Ready
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {multiArtifacts.length} marketing asset
                  {multiArtifacts.length !== 1 ? "s" : ""} created from your
                  testimonials
                </p>
              </div>
            </div>
            <Button
              onClick={onNavigate}
              variant="ghost"
              size="sm"
              className="text-slate-700 hover:text-slate-900 hover:bg-slate-100 h-8 px-3 text-xs font-medium"
            >
              View
              <ChevronRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
        </div>
      </Card>
    );
  }
);

const DashboardView: React.FC = observer(() => {
  const [isStatsOpen, setIsStatsOpen] = useState(true);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [selectedTestimonials, setSelectedTestimonials] = useState<string[]>(
    []
  );
  const [deletingTestimonials, setDeletingTestimonials] = useState<Set<string>>(
    new Set()
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const navigate = useNavigate();

  // No need to fetch - DashboardLayout already pre-fetched and cached testimonials
  const testimonials = workspaceHub.testimonialManager.testimonials;
  const isLoading = workspaceHub.testimonialManager.loading_testimonials;

  const length = testimonials?.length || 0;
  const hasTestimonials = Boolean(length);

  const handleToggleSelect = (id: string) => {
    setSelectedTestimonials((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  const confirmBulkDelete = async () => {
    setIsDeleting(true);
    try {
      for (const id of selectedTestimonials) {
        await handleDelete(id);
      }
      setSelectedTestimonials([]);
    } finally {
      setIsDeleting(false);
      setIsDeleteConfirmOpen(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingTestimonials((prev) => new Set(prev).add(id));
    try {
      await workspaceHub.testimonialManager.deleteTestimonial(id);
    } catch (error) {
      console.error("Delete failed:", error);
    } finally {
      setDeletingTestimonials((prev) => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  const toggleStats = () => {
    setIsStatsOpen(!isStatsOpen);
  };

  return (
    <>
      {/* Header Section */}
      <motion.div variants={itemVariants} className="mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          {/* Left: Title & Description */}
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-slate-900 mb-1">
              {hasTestimonials ? "Testimonials" : "Welcome to Cenphi"}
            </h1>
            <p className="text-sm text-slate-600">
              {hasTestimonials
                ? "Manage, analyze and leverage your customer testimonials"
                : "Your journey to collecting powerful social proof starts here"}
            </p>
          </div>

          {/* Right: Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={() => setIsShareModalOpen(true)}
              variant="outline"
              size="sm"
              className="border-slate-300 text-slate-700 hover:bg-slate-50 h-9 px-4 text-xs"
            >
              <Share2 className="h-3.5 w-3.5 mr-2" />
              Share Link
            </Button>
            <Button
              onClick={() => setIsRequestModalOpen(true)}
              size="sm"
              className="bg-slate-900 hover:bg-slate-800 text-white h-9 px-4 text-xs shadow-sm"
            >
              <Mail className="h-3.5 w-3.5 mr-2" />
              {hasTestimonials ? "Request" : "Request Testimonials"}
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Analytics Overview */}
      {hasTestimonials && (
        <motion.div variants={itemVariants} className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-slate-600" />
              </div>
              <h2 className="text-sm font-semibold text-slate-900">
                Analytics Overview
              </h2>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleStats}
              className="text-slate-600 hover:text-slate-900 h-8 px-3 text-xs"
            >
              {isStatsOpen ? "Hide" : "Show"}
            </Button>
          </div>

          <motion.div
            animate={{
              height: isStatsOpen ? "auto" : 0,
              opacity: isStatsOpen ? 1 : 0,
              marginBottom: isStatsOpen ? 24 : 0,
            }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Total Testimonials"
                icon={MessageSquare}
                message="Collected"
                color="bg-slate-700"
                accentColor="bg-slate-700"
                value={testimonials?.length.toString()}
                isLoading={isLoading}
              />
              <StatCard
                title="AI Processing"
                icon={Brain}
                message="Enhanced"
                color="bg-slate-700"
                accentColor="bg-slate-700"
                value={`${Math.round((testimonials!.filter((t) => t.processing_status === "completed").length / testimonials!.length) * 100)}%`}
                isLoading={isLoading}
              />
              <StatCard
                title="Quality Score"
                icon={Star}
                message="Average"
                color="bg-slate-700"
                accentColor="bg-slate-700"
                value={`${Math.round((testimonials!.reduce((sum, t) => sum + (t.sentiment_score || 0), 0) / testimonials!.length) * 100)}%`}
                isLoading={isLoading}
              />
              <StatCard
                title="AI Artifacts"
                icon={Sparkles}
                message="Generated"
                color="bg-slate-700"
                accentColor="bg-slate-700"
                value={testimonials!
                  .reduce((sum, t) => sum + (t.artifacts?.length || 0), 0)
                  .toString()}
                isLoading={isLoading}
              />
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* AI Features Dashboard */}
      {hasTestimonials && (
        <motion.div variants={itemVariants} className="mb-6">
          <AIFeaturesDashboard />
        </motion.div>
      )}

      {/* AI Generated Content Card */}
      {hasTestimonials && (
        <motion.div variants={itemVariants} className="mb-6">
          <AIContentInsightsCard onNavigate={() => navigate(`/content-hub`)} />
        </motion.div>
      )}

      {/* Main Content Area */}
      {hasTestimonials ? (
        <TestimonialList
          testimonials={testimonials || []}
          selectedTestimonials={selectedTestimonials}
          onToggleSelect={handleToggleSelect}
          onDelete={handleDelete}
          deletingTestimonials={deletingTestimonials}
        />
      ) : (
        <EmptyStateView />
      )}

      {/* Modals */}
      <TestimonialRequestModal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
      />

      <CollectLinkShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
      />

      <ConfirmDialog
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={confirmBulkDelete}
        title="Delete Testimonials"
        message={`Are you sure you want to delete ${selectedTestimonials.length} testimonial${selectedTestimonials.length > 1 ? "s" : ""}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={isDeleting}
      />
    </>
  );
});

export default DashboardView;
