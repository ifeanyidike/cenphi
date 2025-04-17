import { Testimonial } from "@/types/testimonial";
import { useMemo } from "react"; // adjust the path according to your project structure

export interface FilterOptions {
  searchQuery?: string;
  activeTab?: string;
  platformFilter?: string;
  sourceFilter?: string;
  sentimentFilter?: string;
  minFollowersFilter?: number;
  minEngagementFilter?: number;
  keywordFilter?: string;
  dateRangeFilter?: "all" | "today" | "week" | "month" | "custom";
  customDateRange?: { start: string; end: string };
  sortOrder?: "date" | "score" | "engagement";
}

export const useFilteredTestimonials = (
  testimonials: Testimonial[],
  {
    searchQuery = "",
    activeTab = "all",
    platformFilter = "all",
    sourceFilter = "all",
    sentimentFilter = "all",
    minFollowersFilter = 0,
    minEngagementFilter = 0,
    keywordFilter = "",
    dateRangeFilter = "all",
    customDateRange,
    sortOrder = "date",
  }: FilterOptions
) => {
  return useMemo(() => {
    return testimonials
      .filter((testimonial) => {
        // Text search
        if (
          searchQuery &&
          !testimonial.content
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) &&
          !testimonial.customer_profile?.name
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) &&
          !testimonial.customer_profile?.social_profiles?.username
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase())
        ) {
          return false;
        }

        // Status filter
        if (activeTab !== "all" && testimonial.status !== activeTab) {
          return false;
        }

        // Platform filter
        if (
          platformFilter !== "all" &&
          testimonial.source_data?.platform !== platformFilter
        ) {
          return false;
        }

        // Source filter
        if (
          sourceFilter !== "all" &&
          testimonial.source_data?.source !== sourceFilter
        ) {
          return false;
        }

        // Sentiment filter
        if (
          sentimentFilter !== "all" &&
          testimonial.source_data?.sentiment !== sentimentFilter
        ) {
          return false;
        }

        // Min followers filter
        if (
          minFollowersFilter > 0 &&
          (!testimonial.customer_profile?.social_profiles?.followers ||
            testimonial.customer_profile.social_profiles.followers <
              minFollowersFilter)
        ) {
          return false;
        }

        // Min engagement filter
        if (minEngagementFilter > 0) {
          const engagement =
            (testimonial.engagement_metrics?.likes || 0) +
            (testimonial.engagement_metrics?.comments || 0) * 2 +
            (testimonial.engagement_metrics?.shares || 0) * 3;
          if (engagement < minEngagementFilter) {
            return false;
          }
        }

        // Keyword filter
        if (keywordFilter && testimonial.tags) {
          const keywords = keywordFilter
            .toLowerCase()
            .split(",")
            .map((k) => k.trim());
          if (
            !testimonial.tags.some((tag) =>
              keywords.some((keyword) => tag.toLowerCase().includes(keyword))
            )
          ) {
            return false;
          }
        }

        // Date range filter
        if (dateRangeFilter !== "all") {
          const testimonialDate = new Date(testimonial.created_at);
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          if (dateRangeFilter === "today") {
            const startOfDay = new Date(today);
            if (testimonialDate < startOfDay) {
              return false;
            }
          } else if (dateRangeFilter === "week") {
            const startOfWeek = new Date(today);
            startOfWeek.setDate(today.getDate() - today.getDay());
            if (testimonialDate < startOfWeek) {
              return false;
            }
          } else if (dateRangeFilter === "month") {
            const startOfMonth = new Date(
              today.getFullYear(),
              today.getMonth(),
              1
            );
            if (testimonialDate < startOfMonth) {
              return false;
            }
          } else if (dateRangeFilter === "custom" && customDateRange) {
            const startDate = new Date(customDateRange.start);
            const endDate = new Date(customDateRange.end);
            endDate.setHours(23, 59, 59, 999);
            if (testimonialDate < startDate || testimonialDate > endDate) {
              return false;
            }
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortOrder === "date") {
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
        } else if (sortOrder === "score") {
          return (b.source_data?.score || 0) - (a.source_data?.score || 0);
        } else {
          // Engagement sorting
          const engagementA =
            (a.engagement_metrics?.likes || 0) +
            (a.engagement_metrics?.comments || 0) * 2 +
            (a.engagement_metrics?.shares || 0) * 3;
          const engagementB =
            (b.engagement_metrics?.likes || 0) +
            (b.engagement_metrics?.comments || 0) * 2 +
            (b.engagement_metrics?.shares || 0) * 3;
          return engagementB - engagementA;
        }
      });
  }, [
    testimonials,
    searchQuery,
    activeTab,
    platformFilter,
    sourceFilter,
    sentimentFilter,
    minFollowersFilter,
    minEngagementFilter,
    keywordFilter,
    dateRangeFilter,
    customDateRange,
    sortOrder,
  ]);
};
