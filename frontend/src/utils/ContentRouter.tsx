// utils/ContentRouter.tsx - Smart content routing and deduplication logic
import { TestimonialArtifact } from "@/types/testimonial";

export interface ContentLocation {
  primary: "testimonial-detail" | "ai-hub";
  secondary?: "testimonial-detail" | "ai-hub";
  reason: string;
  showInBoth?: boolean;
  crossReferenceText?: string;
}

export interface ContentRoutingRule {
  processingType: string;
  getLocation: (artifact: TestimonialArtifact) => ContentLocation;
}

// Smart routing rules for different content types
export const CONTENT_ROUTING_RULES: ContentRoutingRule[] = [
  {
    processingType: "sentiment_analysis",
    getLocation: () => ({
      primary: "testimonial-detail",
      reason: "Analysis is specific to individual testimonials",
      crossReferenceText: "View aggregated insights in AI Hub",
    }),
  },
  {
    processingType: "highlight_extraction",
    getLocation: () => ({
      primary: "testimonial-detail",
      reason: "Highlights are extracted from specific testimonials",
      crossReferenceText: "View collection highlights in AI Hub",
    }),
  },
  {
    processingType: "clipping",
    getLocation: () => ({
      primary: "testimonial-detail",
      secondary: "ai-hub",
      reason: "Clips belong to source testimonial but are useful content",
      showInBoth: true,
      crossReferenceText: "Also available in AI Content Hub",
    }),
  },
  {
    processingType: "enhancement",
    getLocation: () => ({
      primary: "testimonial-detail",
      secondary: "ai-hub",
      reason: "Enhanced versions belong to original testimonial",
      showInBoth: true,
      crossReferenceText: "Enhanced content available in AI Hub",
    }),
  },
  {
    processingType: "story_mode_generation",
    getLocation: (artifact) => {
      const isMultiTestimonial = artifact.data?.testimonial_ids?.length > 1;
      return {
        primary: isMultiTestimonial ? "ai-hub" : "testimonial-detail",
        secondary: isMultiTestimonial ? "testimonial-detail" : "ai-hub",
        reason: isMultiTestimonial
          ? "Story videos from multiple testimonials belong in AI Hub"
          : "Single-testimonial stories belong to source testimonial",
        showInBoth: true,
        crossReferenceText: isMultiTestimonial
          ? "Individual story moments available in source testimonials"
          : "Multi-testimonial stories available in AI Hub",
      };
    },
  },
  {
    processingType: "content_generation",
    getLocation: (artifact) => {
      const isMultiTestimonial = artifact.data?.testimonial_ids?.length > 1;
      return {
        primary: isMultiTestimonial ? "ai-hub" : "testimonial-detail",
        reason: isMultiTestimonial
          ? "Content from multiple testimonials belongs in AI Hub"
          : "Single-testimonial content belongs to source",
        crossReferenceText: isMultiTestimonial
          ? "Source testimonials available in individual details"
          : "Multi-testimonial content available in AI Hub",
      };
    },
  },
  {
    processingType: "video_platform_optimization",
    getLocation: (artifact) => {
      const hasParentArtifact = artifact.data?.source_artifact_id;
      return {
        primary: hasParentArtifact ? "ai-hub" : "testimonial-detail",
        secondary: hasParentArtifact ? "testimonial-detail" : "ai-hub",
        reason: hasParentArtifact
          ? "Platform optimizations of AI content belong in AI Hub"
          : "Direct testimonial optimizations belong to source",
        showInBoth: true,
        crossReferenceText: hasParentArtifact
          ? "Source content available in testimonial details"
          : "Optimized versions available in AI Hub",
      };
    },
  },
  {
    processingType: "text_platform_optization",
    getLocation: (artifact) => {
      const hasParentArtifact = artifact.data?.source_artifact_id;
      return {
        primary: hasParentArtifact ? "ai-hub" : "testimonial-detail",
        secondary: hasParentArtifact ? "testimonial-detail" : "ai-hub",
        reason: hasParentArtifact
          ? "Platform optimizations of AI content belong in AI Hub"
          : "Direct testimonial optimizations belong to source",
        showInBoth: true,
        crossReferenceText: hasParentArtifact
          ? "Source content available in testimonial details"
          : "Optimized versions available in AI Hub",
      };
    },
  },
  {
    processingType: "translation",
    getLocation: () => ({
      primary: "testimonial-detail",
      secondary: "ai-hub",
      reason: "Translations are extensions of source testimonials",
      showInBoth: true,
      crossReferenceText: "Multi-language content available in AI Hub",
    }),
  },
  {
    processingType: "text_polishing",
    getLocation: () => ({
      primary: "testimonial-detail",
      reason: "Polished text belongs to source testimonial",
      crossReferenceText: "Polished content collection in AI Hub",
    }),
  },
  {
    processingType: "narration",
    getLocation: () => ({
      primary: "testimonial-detail",
      secondary: "ai-hub",
      reason: "Narrations are audio versions of testimonials",
      showInBoth: true,
      crossReferenceText: "Audio content library in AI Hub",
    }),
  },
  {
    processingType: "viral_analysis",
    getLocation: () => ({
      primary: "ai-hub",
      reason: "Viral insights are strategic content for marketing",
      crossReferenceText: "Source analysis available in testimonial details",
    }),
  },
];

// Get routing information for an artifact
export function getContentLocation(
  artifact: TestimonialArtifact
): ContentLocation {
  const rule = CONTENT_ROUTING_RULES.find(
    (r) => r.processingType === artifact.processing_type
  );
  return rule
    ? rule.getLocation(artifact)
    : {
        primary: "testimonial-detail",
        reason: "Default location for testimonial-specific content",
      };
}

// Determine if content should be shown in current context
export function shouldShowInContext(
  artifact: TestimonialArtifact,
  currentContext: "testimonial-detail" | "ai-hub"
): {
  show: boolean;
  isPrimary: boolean;
  crossReference?: string;
} {
  const location = getContentLocation(artifact);

  if (location.primary === currentContext) {
    return {
      show: true,
      isPrimary: true,
      crossReference: location.crossReferenceText,
    };
  }

  if (location.secondary === currentContext && location.showInBoth) {
    return {
      show: true,
      isPrimary: false,
      crossReference: location.crossReferenceText,
    };
  }

  return { show: false, isPrimary: false };
}

// Generate navigation suggestions
export function getNavigationSuggestion(
  artifact: TestimonialArtifact,
  currentContext: "testimonial-detail" | "ai-hub"
): string | null {
  const location = getContentLocation(artifact);

  if (location.primary !== currentContext && !location.showInBoth) {
    const targetName =
      location.primary === "ai-hub" ? "AI Content Hub" : "Testimonial Details";
    return `This content is primarily managed in ${targetName}`;
  }

  return null;
}

// Content organization utilities
export function organizeArtifactsByContext(artifacts: TestimonialArtifact[]) {
  const primaryAIHub: TestimonialArtifact[] = [];
  const primaryTestimonialDetail: TestimonialArtifact[] = [];
  const sharedContent: TestimonialArtifact[] = [];

  artifacts.forEach((artifact) => {
    const location = getContentLocation(artifact);

    if (location.showInBoth) {
      sharedContent.push(artifact);
    } else if (location.primary === "ai-hub") {
      primaryAIHub.push(artifact);
    } else {
      primaryTestimonialDetail.push(artifact);
    }
  });

  return {
    primaryAIHub,
    primaryTestimonialDetail,
    sharedContent,
  };
}
