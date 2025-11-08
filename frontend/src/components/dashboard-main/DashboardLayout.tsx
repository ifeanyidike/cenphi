import { useEffect } from "react";
import { observer } from "mobx-react-lite";
import { Outlet } from "react-router-dom";
import { DashboardWrapper } from "./DashboardWrapper";
import { workspaceHub } from "@/repo/workspace_hub";

/**
 * DashboardLayout - Persistent layout for all dashboard pages
 *
 * This component:
 * - Wraps all dashboard routes with DashboardWrapper
 * - Pre-fetches common data (testimonials) once on mount
 * - Uses Outlet to render child routes without unmounting the layout
 * - Persists across navigation to prevent unnecessary re-renders and data fetching
 */
export const DashboardLayout = observer(() => {
  // Pre-fetch testimonials once when layout mounts
  // This data will be cached in workspaceHub.testimonialManager
  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        // Include artifacts to show processing status indicators on testimonial cards
        await workspaceHub.testimonialManager.getTestimonials(false);
      } catch (error) {
        console.error("[DashboardLayout] Failed to prefetch testimonials:", error);
      }
    };

    fetchTestimonials();
  }, []); // Only run once on mount

  return (
    <DashboardWrapper>
      {/* Outlet renders the current route's component */}
      <Outlet />
    </DashboardWrapper>
  );
});

export default DashboardLayout;
