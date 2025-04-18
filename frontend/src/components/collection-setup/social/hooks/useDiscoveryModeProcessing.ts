import { DiscoveryMode } from "@/types/setup";
import { ContentStatus, Testimonial } from "@/types/testimonial";
import React, { useCallback } from "react";

// Define the type for discovery activity actions
export interface DiscoveryActivityAction {
  action: string;
  testimonialId: string;
  reason: string;
  timestamp: Date;
}

// Define the hook options – including state setters and external functions that affect your component
export interface UseDiscoveryModeProcessingOptions {
  discoveryMode: DiscoveryMode;
  sentimentThreshold: number;
  keywordsList: string[];
  testimonials: Testimonial[];
  setTestimonials: (updatedTestimonials: Testimonial[]) => void;
  setDiscoveryActivity: React.Dispatch<
    React.SetStateAction<
      {
        action: string;
        testimonialId: string;
        reason: string;
        timestamp: Date;
      }[]
    >
  >;
  setDiscoveryStats: React.Dispatch<
    React.SetStateAction<{
      autoApproved: number;
      keywordMatched: number;
      sentimentApproved: number;
      aiRecommended: number;
    }>
  >;
  showToast: (toast: {
    title: string;
    description: string;
    variant?: "default" | "destructive";
  }) => void;
  setShowDiscoveryActivity: (show: boolean) => void;
}

export const useDiscoveryModeProcessing = (
  props: UseDiscoveryModeProcessingOptions
) => {
  const {
    discoveryMode,
    sentimentThreshold,
    keywordsList,
    testimonials,
    // setTestimonials,
    setDiscoveryActivity,
    setDiscoveryStats,
    showToast,
    setShowDiscoveryActivity,
  } = props;
  // Function to check if a testimonial matches the current discovery mode criteria
  console.log("props", props);
  const matchesDiscoveryMode = useCallback(
    (testimonial: Testimonial): { matches: boolean; reason: string } => {
      console.debug("discovery mode", discoveryMode, sentimentThreshold);
      if (discoveryMode === "auto") {
        // Auto mode – approve positive testimonials with high sentiment
        if (
          testimonial.source_data?.sentiment === "positive" &&
          ((testimonial.source_data?.score as number) || 0) * 100 >=
            sentimentThreshold
        ) {
          return {
            matches: true,
            reason: `Auto-approved with ${Math.round(
              ((testimonial.source_data?.score as number) || 0) * 100
            )}% positive sentiment`,
          };
        }
      } else if (discoveryMode === "keyword") {
        // Keyword mode – approve testimonials containing any specific keyword
        if (testimonial.content) {
          const content = testimonial.content.toLowerCase();
          for (const keyword of keywordsList) {
            if (content.includes(keyword.toLowerCase())) {
              return {
                matches: true,
                reason: `Matched keyword: "${keyword}"`,
              };
            }
          }
        }
      } else if (discoveryMode === "sentiment") {
        // Sentiment mode – approve based purely on sentiment score
        if (
          ((testimonial.source_data?.score as number) || 0) * 100 >=
          sentimentThreshold
        ) {
          return {
            matches: true,
            reason: `High sentiment score: ${Math.round(
              ((testimonial.source_data?.score as number) || 0) * 100
            )}%`,
          };
        }
      } else if (discoveryMode === "ai") {
        // AI mode – simulate analysis based on engagement and sentiment
        const engagementScore =
          ((testimonial.engagement_metrics?.likes as number) || 0) / 10 +
          ((testimonial.engagement_metrics?.comments as number) || 0) * 2 +
          ((testimonial.engagement_metrics?.shares as number) || 0) * 3;

        const sentimentScore =
          ((testimonial.source_data?.score as number) || 0) * 100;
        const aiScore = engagementScore * 0.4 + sentimentScore * 0.6;

        if (aiScore > 70) {
          return {
            matches: true,
            reason: `AI score: ${Math.round(aiScore)}% (based on engagement and sentiment)`,
          };
        }
      }
      return { matches: false, reason: "" };
    },
    [discoveryMode, sentimentThreshold, keywordsList]
  );

  // Function to process testimonials based on discovery mode criteria
  const processTestimonials = useCallback(() => {
    console.log("discovery mode", discoveryMode);
    if (discoveryMode === "manual") {
      // Manual mode doesn't auto-process testimonials
      return;
    }

    let autoCount = 0;
    let keywordCount = 0;
    let sentimentCount = 0;
    let aiCount = 0;
    const newActivity: DiscoveryActivityAction[] = [];

    const updatedTestimonials = testimonials.map((testimonial) => {
      // Only process pending testimonials
      if (testimonial.status !== "pending_review") {
        return testimonial;
      }

      const { matches, reason } = matchesDiscoveryMode(testimonial);

      if (matches) {
        const action: DiscoveryActivityAction = {
          action: "Auto-approved",
          testimonialId: testimonial.id,
          reason,
          timestamp: new Date(),
        };

        newActivity.push(action);

        if (discoveryMode === "auto") autoCount++;
        if (discoveryMode === "keyword") keywordCount++;
        if (discoveryMode === "sentiment") sentimentCount++;
        if (discoveryMode === "ai") aiCount++;

        return { ...testimonial, status: "approved" as ContentStatus };
      }

      return testimonial;
    });

    if (
      autoCount > 0 ||
      keywordCount > 0 ||
      sentimentCount > 0 ||
      aiCount > 0
    ) {
      console.log("updated testimonials", updatedTestimonials);
      //   setTestimonials(updatedTestimonials);
      setDiscoveryActivity((prev) => [...newActivity, ...prev]);

      const modeText =
        discoveryMode === "auto"
          ? "Auto"
          : discoveryMode === "keyword"
            ? "Keyword"
            : discoveryMode === "sentiment"
              ? "Sentiment"
              : "AI";

      const count =
        discoveryMode === "auto"
          ? autoCount
          : discoveryMode === "keyword"
            ? keywordCount
            : discoveryMode === "sentiment"
              ? sentimentCount
              : aiCount;

      showToast({
        title: `${modeText} discovery processed`,
        description: `${count} testimonials were automatically approved based on ${modeText.toLowerCase()} criteria`,
        variant: "default",
      });

      setDiscoveryStats((prev) => ({
        ...prev,
        autoApproved: prev.autoApproved + autoCount,
        keywordMatched: prev.keywordMatched + keywordCount,
        sentimentApproved: prev.sentimentApproved + sentimentCount,
        aiRecommended: prev.aiRecommended + aiCount,
      }));

      setShowDiscoveryActivity(true);
    }
  }, [testimonials, discoveryMode, sentimentThreshold, keywordsList]);

  return { matchesDiscoveryMode, processTestimonials };
};
