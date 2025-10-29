/**
 * Global Processing Monitor
 *
 * Award-winning, world-class UI component for monitoring AI processing jobs.
 * Displays active jobs with real-time progress tracking across the entire dashboard.
 *
 * Design Philosophy:
 * - Minimalist collapsed state that doesn't obstruct workflow
 * - Rich expanded state with comprehensive job details
 * - Professional typography with smaller fonts
 * - Responsible use of colors and icons
 * - Smooth animations and transitions
 */

import React, { useState, useEffect, useRef } from "react";
import { AnimatePresence } from "framer-motion";
import { useProcessingMonitor } from "@/contexts/ProcessingMonitorContext";
import { CollapsedView } from "./CollapsedView";
import { ExpandedView } from "./ExpandedView";
import { useToast } from "@/hooks/use-toast";
import { useNavigate, useLocation } from "react-router-dom";

export const GlobalProcessingMonitor: React.FC = () => {
  const { activeJobs, removeJob } = useProcessingMonitor();
  const [isExpanded, setIsExpanded] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const notifiedJobs = useRef(new Set<string>());

  // Filter out cancelled sessions - they shouldn't be displayed
  const displayJobs = activeJobs.filter((job) => job.status !== "cancelled");

  // Don't show monitor in studio pages
  const isInStudio = location.pathname.startsWith("/studio");

  // Show completion notifications (only for non-cancelled jobs)
  useEffect(() => {
    displayJobs.forEach((job) => {
      // Check if job is complete and we haven't notified yet
      if (job.progress === 100 && !notifiedJobs.current.has(job.sessionId)) {
        notifiedJobs.current.add(job.sessionId);

        console.log(
          "[GlobalProcessingMonitor] Showing completion notification for:",
          job.serviceName
        );

        toast({
          title: `${job.serviceName} Complete!`,
          description: `Your ${job.serviceName.toLowerCase()} has finished processing. Click to view and save.`,
        });
      }
    });
  }, [displayJobs, toast, navigate]);

  // Auto-collapse when all display jobs complete
  useEffect(() => {
    if (displayJobs.length === 0) {
      setIsExpanded(false);
    }
  }, [displayJobs.length]);

  // Don't render if no display jobs OR if in studio
  if (displayJobs.length === 0 || isInStudio) {
    if (isInStudio) {
      console.log("[GlobalProcessingMonitor] In studio, hiding monitor");
    } else {
      console.log("[GlobalProcessingMonitor] No display jobs, not rendering");
    }
    return null;
  }

  const handleToggle = () => {
    setIsExpanded((prev) => !prev);
  };

  const handleRemoveJob = (sessionId: string) => {
    removeJob(sessionId);
    notifiedJobs.current.delete(sessionId); // Clean up notification tracking
  };

  const handleJobClick = (sessionId: string) => {
    const job = displayJobs.find((j) => j.sessionId === sessionId);
    if (job?.studioUrl) {
      // Always navigate to studio, even if completed
      navigate(job.studioUrl);
      // Optionally collapse after navigation
      setIsExpanded(false);
    }
  };

  return (
    <div
      className="fixed top-20 right-6 z-[9999]"
      style={{
        position: "fixed",
        top: "80px",
        right: "24px",
        zIndex: 9999,
      }}
    >
      <AnimatePresence mode="wait">
        {isExpanded ? (
          <ExpandedView
            key="expanded"
            jobs={displayJobs}
            onCollapse={handleToggle}
            onRemoveJob={handleRemoveJob}
            onJobClick={handleJobClick}
          />
        ) : (
          <CollapsedView
            key="collapsed"
            jobs={displayJobs}
            onClick={handleToggle}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
