import { StatsOverview } from "@/components/custom/dashboard/StatsOverview";
import { ReviewsSection2 } from "@/components/custom/dashboard/ReviewsSection2";
import { AIActionsCard } from "@/components/custom/dashboard/AIActionsCard";
import { PerformanceMetricsCard } from "@/components/custom/dashboard/PerformanceMetricsCard";

const SidebarContent = () => {
  const stats: Record<string, string | number> = {
    totalTestimonials: 154,
    averageRating: 4.8,
    pendingReviews: 3,
    recentActivity: 12,
    conversionRate: "24%",
    totalViews: "2.4K",
  };

  return (
    <div className="p-4 lg:p-8 overflow-hidden">
      {/* Stats Overview */}
      <StatsOverview stats={stats} />

      {/* Recent Reviews and Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ReviewsSection2 />
        </div>

        <div className="space-y-6">
          <AIActionsCard />
          <PerformanceMetricsCard />
        </div>
      </div>
    </div>
  );
};

export default SidebarContent;