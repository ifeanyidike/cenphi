import { Testimonial } from "@/types/testimonial";
import { useMemo } from "react";

export interface TestimonialStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  requested: number;
  positiveRate: number;
  averageEngagement: number;
  topPlatform: string;
}

export interface FilterStats {
  platformCounts: Record<string, number>;
  sourceCounts: Record<string, number>;
  sentimentCounts: Record<string, number>;
}

/**
 * Custom hook to compute testimonial stats and filter stats.
 *
 * @param testimonials - Array of testimonials
 * @returns An object containing both stats and filterStats
 */
export const useTestimonialStats = (testimonials: Testimonial[]) => {
  const stats: TestimonialStats = useMemo(() => {
    if (testimonials.length === 0) {
      return {
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
        requested: 0,
        positiveRate: 0,
        averageEngagement: 0,
        topPlatform: "none",
      };
    }

    const total = testimonials.length;
    const pending = testimonials.filter(
      (t) => t.status === "pending"
    ).length;
    const approved = testimonials.filter((t) => t.status === "approved").length;
    const rejected = testimonials.filter((t) => t.status === "rejected").length;
    const requested = testimonials.filter(
      (t) => t.status === "requested"
    ).length;
    const positiveCount = testimonials.filter(
      (t) => t.source_data?.sentiment === "positive"
    ).length;
    const positiveRate = Math.round((positiveCount / total) * 100);
    const averageEngagement = Math.round(
      testimonials.reduce(
        (sum, t) =>
          sum +
          (((t.engagement_metrics?.likes as number) || 0) +
            ((t.engagement_metrics?.comments as number) || 0) * 2 +
            ((t.engagement_metrics?.shares as number) || 0) * 3),
        0
      ) / total
    );
    const topPlatform =
      Object.entries(
        testimonials.reduce(
          (acc, t) => {
            const platform = t.source_data?.platform || "unknown";
            acc[platform as string] = (acc[platform as string] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        )
      ).sort((a, b) => b[1] - a[1])[0]?.[0] || "none";

    return {
      total,
      pending,
      approved,
      rejected,
      requested,
      positiveRate,
      averageEngagement,
      topPlatform,
    };
  }, [testimonials]);

  const filterStats: FilterStats = useMemo(() => {
    const platformCounts: Record<string, number> = {};
    const sourceCounts: Record<string, number> = {};
    const sentimentCounts: Record<string, number> = {};

    testimonials.forEach((t) => {
      const platform = t.source_data?.platform || "unknown";
      const source = t.source_data?.source || "unknown";
      const sentiment = t.source_data?.sentiment || "unknown";
      platformCounts[platform as string] =
        (platformCounts[platform as string] || 0) + 1;
      sourceCounts[source as string] =
        (sourceCounts[source as string] || 0) + 1;
      sentimentCounts[sentiment as number] =
        (sentimentCounts[sentiment as number] || 0) + 1;
    });

    return { platformCounts, sourceCounts, sentimentCounts };
  }, [testimonials]);

  return { stats, filterStats };
};
