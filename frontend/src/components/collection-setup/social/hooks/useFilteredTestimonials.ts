import { useMemo } from "react";
import { Testimonial } from "@/types/testimonial";

interface FilterOptions {
  searchQuery: string;
  activeTab: string;
  platformFilter: string;
  sourceFilter: string;
  sentimentFilter: string;
  sortOrder: "date" | "score" | "engagement";
  minFollowersFilter: number;
  minEngagementFilter: number;
  keywordFilter: string;
  dateRangeFilter: string;
  customDateRange: {
    start: string;
    end: string;
  };
}

export const useFilteredTestimonials = (
  testimonials: Testimonial[],
  filters: FilterOptions
) => {
  return useMemo(() => {
    let filtered = [...testimonials];

    // Filter by search query
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          (t.content && typeof t.content === 'string' && t.content.toLowerCase().includes(query)) ||
          (t.customer_profile?.name && typeof t.customer_profile.name === 'string' && t.customer_profile.name.toLowerCase().includes(query)) ||
          (t.customer_profile?.social_profiles?.username && typeof t.customer_profile.social_profiles.username === 'string' && t.customer_profile.social_profiles.username.toLowerCase().includes(query)) ||
          (t.tags && Array.isArray(t.tags) && t.tags.some((tag) => typeof tag === 'string' && tag.toLowerCase().includes(query)))
      );
    }

    // Filter by active tab (status)
    if (filters.activeTab !== "all") {
      filtered = filtered.filter((t) => t.status === filters.activeTab);
    }

    // Filter by platform
    if (filters.platformFilter !== "all") {
      filtered = filtered.filter(
        (t) => t.source_data?.platform === filters.platformFilter
      );
    }

    // Filter by source
    if (filters.sourceFilter !== "all") {
      filtered = filtered.filter(
        (t) => t.source_data?.source === filters.sourceFilter
      );
    }

    // Filter by sentiment
    if (filters.sentimentFilter !== "all") {
      filtered = filtered.filter(
        (t) => t.source_data?.sentiment === filters.sentimentFilter
      );
    }

    // Advanced Filters
    if (filters.minFollowersFilter > 0) {
      filtered = filtered.filter(
        (t) =>
          (typeof t.customer_profile?.social_profiles?.followers === 'number' ? t.customer_profile.social_profiles.followers : 0) >=
          filters.minFollowersFilter
      );
    }

    if (filters.minEngagementFilter > 0) {
      filtered = filtered.filter(
        (t) =>
          ((typeof t.engagement_metrics?.likes === 'number' ? t.engagement_metrics.likes : 0) +
            (typeof t.engagement_metrics?.comments === 'number' ? t.engagement_metrics.comments : 0) +
            (typeof t.engagement_metrics?.shares === 'number' ? t.engagement_metrics.shares : 0)) >=
          filters.minEngagementFilter
      );
    }

    if (filters.keywordFilter) {
      const keywords = filters.keywordFilter
        .toLowerCase()
        .split(/,\s*/)
        .filter(Boolean);
      filtered = filtered.filter(
        (t) =>
          keywords.some((keyword) =>
            (t.content && typeof t.content === 'string' && t.content.toLowerCase().includes(keyword))
          ) ||
          (t.tags && Array.isArray(t.tags) && t.tags.some((tag) =>
            typeof tag === 'string' && keywords.some((keyword) => tag.toLowerCase().includes(keyword))
          ))
      );
    }

    // Date Range Filter
    if (filters.dateRangeFilter !== "all") {
      const now = new Date();
      let startDate: Date;
      let endDate: Date = now;

      switch (filters.dateRangeFilter) {
        case "today":
          startDate = new Date(now.setHours(0, 0, 0, 0));
          break;
        case "week":
          startDate = new Date(
            now.setDate(now.getDate() - now.getDay())
          ); // Start of current week
          startDate.setHours(0, 0, 0, 0);
          break;
        case "month":
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          startDate.setHours(0, 0, 0, 0);
          break;
        case "custom":
          startDate = new Date(filters.customDateRange.start);
          endDate = new Date(filters.customDateRange.end);
          endDate.setHours(23, 59, 59, 999); // End of the selected day
          break;
        default:
          startDate = new Date(0); // Epoch
      }

      filtered = filtered.filter((t) => {
        const testimonialDate = new Date(t.created_at);
        return testimonialDate >= startDate && testimonialDate <= endDate;
      });
    }

    // Sort order
    filtered.sort((a, b) => {
      if (filters.sortOrder === "date") {
        return (
          new Date(b.created_at).getTime() -
          new Date(a.created_at).getTime()
        );
      } else if (filters.sortOrder === "score") {
        const scoreA = typeof b.source_data?.score === 'number' ? b.source_data.score : 0;
        const scoreB = typeof a.source_data?.score === 'number' ? a.source_data.score : 0;
        return scoreA - scoreB;
      } else if (filters.sortOrder === "engagement") {
        const engagementA =
          (typeof a.engagement_metrics?.likes === 'number' ? a.engagement_metrics.likes : 0) +
          (typeof a.engagement_metrics?.comments === 'number' ? a.engagement_metrics.comments : 0) +
          (typeof a.engagement_metrics?.shares === 'number' ? a.engagement_metrics.shares : 0);
        const engagementB =
          (typeof b.engagement_metrics?.likes === 'number' ? b.engagement_metrics.likes : 0) +
          (typeof b.engagement_metrics?.comments === 'number' ? b.engagement_metrics.comments : 0) +
          (typeof b.engagement_metrics?.shares === 'number' ? b.engagement_metrics.shares : 0);
        return engagementB - engagementA;
      }
      return 0;
    });

    return filtered;
  }, [testimonials, filters]);
};
