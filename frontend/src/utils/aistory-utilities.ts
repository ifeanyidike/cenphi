// utils/AIStoryUtilities.ts
import { TestimonialArtifact } from "@/types/testimonial";

interface ClipData {
  id: string;
  artifactId?: string;
  url: string;
  theme: string;
  title: string;
  end_time: number;
  start_time: number;
  duration: number;
  engagement_score: number;
  text?: string;
  metadata?: any;
}

interface ClippingData {
  generated_clips: {
    clips: ClipData[];
    detection_method: "automatic" | "manual";
  };
}

interface StoryClipSelection {
  clips: ClipData[];
  totalDuration: number;
  averageEngagement: number;
  storyQuality: "excellent" | "good" | "fair" | "insufficient";
  reasoning: string;
}

/**
 * AI-powered clip selection for story generation
 * This enhances the existing "Create AI Story" functionality in TabRenderers
 */
export class AIStoryUtilities {
  /**
   * Extract all clips from testimonial artifacts
   */
  static extractClipsFromArtifacts(
    artifacts: TestimonialArtifact[]
  ): ClipData[] {
    const clips: ClipData[] = [];

    artifacts.forEach((artifact) => {
      if (artifact.processing_type === "clipping") {
        const data = artifact.data as ClippingData;
        if (data?.generated_clips?.clips) {
          clips.push(
            ...data.generated_clips.clips.map((clip) => ({
              ...clip,
              artifactId: artifact.id,
            }))
          );
        }
      }
    });

    return clips;
  }

  /**
   * AI-powered clip selection for story generation
   * Uses advanced engagement analysis, narrative flow, and moment quality assessment
   */
  static selectBestClipsForStory(
    artifacts: TestimonialArtifact[]
  ): StoryClipSelection {
    const allClips = this.extractClipsFromArtifacts(artifacts);

    if (allClips.length === 0) {
      return {
        clips: [],
        totalDuration: 0,
        averageEngagement: 0,
        storyQuality: "insufficient",
        reasoning: "No clips available for story generation",
      };
    }

    // AI filtering with multiple quality factors
    const highQualityClips = allClips.filter((clip) => {
      const hasGoodEngagement = clip.engagement_score > 0.7;
      const hasOptimalDuration = clip.duration >= 2 && clip.duration <= 30;
      const hasSubstantialContent = (clip.text?.length || 0) > 20;

      return hasGoodEngagement && hasOptimalDuration && hasSubstantialContent;
    });

    if (highQualityClips.length < 2) {
      return {
        clips: [],
        totalDuration: 0,
        averageEngagement: 0,
        storyQuality: "insufficient",
        reasoning: `Only ${highQualityClips.length} clips meet AI quality standards (engagement > 70%, optimal duration, substantial content)`,
      };
    }

    // Advanced AI scoring system with narrative intelligence
    const scoredClips = highQualityClips.map((clip, index) => {
      const engagementWeight = 0.35;
      const durationWeight = 0.25;
      const narrativeWeight = 0.25;
      const contentWeight = 0.15;

      // Optimal duration scoring (AI prefers 8-15 seconds for story flow)
      const optimalDuration = 12;
      const durationScore = Math.max(
        0,
        1 - Math.abs(clip.duration - optimalDuration) / optimalDuration
      );

      // AI analyzes narrative position value
      const positionScore = 1 - index / allClips.length;

      // AI evaluates content richness
      const contentLength = clip.text?.length || 0;
      const contentScore = Math.min(contentLength / 100, 1);

      // AI detects narrative themes for story flow
      const theme = clip.theme?.toLowerCase() || "";
      const narrativeBonus = this.getNarrativeBonus(
        theme,
        index,
        allClips.length
      );

      const aiScore =
        clip.engagement_score * engagementWeight +
        durationScore * durationWeight +
        positionScore * narrativeWeight +
        contentScore * contentWeight +
        narrativeBonus;

      return {
        clip,
        score: aiScore,
        narrativeType: this.classifyNarrativeType(theme),
      };
    });

    // AI determines optimal story structure (intro, development, climax, resolution)
    const storyStructure = this.optimizeStoryStructure(scoredClips);

    // AI selects 3-5 clips for optimal story flow
    const optimalClipCount = Math.min(Math.max(3, storyStructure.length), 5);
    const selectedClips = storyStructure.slice(0, optimalClipCount);

    // AI arranges clips for maximum narrative impact
    const orderedClips = this.arrangeForNarrativeFlow(selectedClips);

    // Calculate AI-enhanced metrics
    const totalDuration = orderedClips.reduce(
      (sum, clip) => sum + clip.duration,
      0
    );
    const averageEngagement =
      orderedClips.reduce((sum, clip) => sum + clip.engagement_score, 0) /
      orderedClips.length;
    const narrativeCoherence = this.calculateNarrativeCoherence(orderedClips);

    // AI determines story quality with advanced assessment
    let storyQuality: "excellent" | "good" | "fair" | "insufficient";
    let reasoning: string;

    if (
      averageEngagement >= 0.85 &&
      narrativeCoherence >= 0.8 &&
      orderedClips.length >= 4
    ) {
      storyQuality = "excellent";
      reasoning = `Excellent: ${orderedClips.length} high-engagement clips with strong narrative flow`;
    } else if (
      averageEngagement >= 0.78 &&
      narrativeCoherence >= 0.6 &&
      orderedClips.length >= 3
    ) {
      storyQuality = "good";
      reasoning = `Good: ${orderedClips.length} quality clips with coherent narrative structure`;
    } else if (averageEngagement >= 0.7 && orderedClips.length >= 2) {
      storyQuality = "fair";
      reasoning = `Fair: ${orderedClips.length} clips meet minimum quality threshold`;
    } else {
      storyQuality = "insufficient";
      reasoning =
        "AI assessment: Clips do not meet optimal story generation standards";
    }

    return {
      clips: orderedClips,
      totalDuration,
      averageEngagement,
      storyQuality,
      reasoning,
    };
  }

  /**
   * AI determines narrative bonus based on clip theme and position
   */
  private static getNarrativeBonus(
    theme: string,
    position: number,
    totalClips: number
  ): number {
    const isIntro = position < totalClips * 0.3;
    const isConclusion = position > totalClips * 0.7;

    if (
      isIntro &&
      (theme.includes("problem") ||
        theme.includes("challenge") ||
        theme.includes("before"))
    ) {
      return 0.1; // Good opening
    }
    if (
      isConclusion &&
      (theme.includes("result") ||
        theme.includes("outcome") ||
        theme.includes("success"))
    ) {
      return 0.1; // Strong closing
    }
    if (
      theme.includes("transform") ||
      theme.includes("solution") ||
      theme.includes("improvement")
    ) {
      return 0.05; // Development content
    }
    return 0;
  }

  /**
   * AI classifies narrative type of clips
   */
  private static classifyNarrativeType(
    theme: string
  ): "intro" | "problem" | "solution" | "result" | "general" {
    if (
      theme.includes("problem") ||
      theme.includes("challenge") ||
      theme.includes("pain")
    )
      return "problem";
    if (
      theme.includes("solution") ||
      theme.includes("approach") ||
      theme.includes("method")
    )
      return "solution";
    if (
      theme.includes("result") ||
      theme.includes("outcome") ||
      theme.includes("success") ||
      theme.includes("achievement")
    )
      return "result";
    if (
      theme.includes("intro") ||
      theme.includes("background") ||
      theme.includes("context")
    )
      return "intro";
    return "general";
  }

  /**
   * AI optimizes story structure for maximum impact
   */
  private static optimizeStoryStructure(
    scoredClips: Array<{ clip: ClipData; score: number; narrativeType: string }>
  ): ClipData[] {
    // AI prioritizes narrative diversity and flow
    const byNarrativeType = scoredClips.reduce(
      (acc, item) => {
        if (!acc[item.narrativeType]) acc[item.narrativeType] = [];
        acc[item.narrativeType].push(item);
        return acc;
      },
      {} as Record<string, typeof scoredClips>
    );

    // AI ensures story has problem → solution → result flow when possible
    const structure: ClipData[] = [];

    // Add best intro/problem clip
    if (byNarrativeType.intro?.length || byNarrativeType.problem?.length) {
      const problemClips = [
        ...(byNarrativeType.intro || []),
        ...(byNarrativeType.problem || []),
      ];
      structure.push(problemClips.sort((a, b) => b.score - a.score)[0].clip);
    }

    // Add solution/development clips
    if (byNarrativeType.solution?.length) {
      structure.push(
        byNarrativeType.solution.sort((a, b) => b.score - a.score)[0].clip
      );
    }

    // Add result clips
    if (byNarrativeType.result?.length) {
      structure.push(
        byNarrativeType.result.sort((a, b) => b.score - a.score)[0].clip
      );
    }

    // Fill remaining slots with highest scoring clips
    const usedClipIds = new Set(structure.map((c) => c.id));
    const remainingClips = scoredClips
      .filter((item) => !usedClipIds.has(item.clip.id))
      .sort((a, b) => b.score - a.score);

    for (const item of remainingClips) {
      if (structure.length < 5) {
        structure.push(item.clip);
      }
    }

    return structure;
  }

  /**
   * AI arranges clips for optimal narrative flow
   */
  private static arrangeForNarrativeFlow(clips: ClipData[]): ClipData[] {
    // AI prefers chronological order but adjusts for narrative impact
    const clipsWithNarrative = clips.map((clip) => ({
      clip,
      narrativeType: this.classifyNarrativeType(
        clip.theme?.toLowerCase() || ""
      ),
      chronologicalOrder: clip.start_time,
    }));

    // AI narrative ordering: intro → problem → solution → result
    const narrativeOrder = [
      "intro",
      "problem",
      "solution",
      "result",
      "general",
    ];

    return clipsWithNarrative
      .sort((a, b) => {
        const aIndex = narrativeOrder.indexOf(a.narrativeType);
        const bIndex = narrativeOrder.indexOf(b.narrativeType);

        // If same narrative type, use chronological order
        if (aIndex === bIndex) {
          return a.chronologicalOrder - b.chronologicalOrder;
        }

        // Otherwise use narrative order
        return aIndex - bIndex;
      })
      .map((item) => item.clip);
  }

  /**
   * AI calculates narrative coherence score
   */
  private static calculateNarrativeCoherence(clips: ClipData[]): number {
    if (clips.length < 2) return 0;

    const narrativeTypes = clips.map((clip) =>
      this.classifyNarrativeType(clip.theme?.toLowerCase() || "")
    );

    // AI rewards logical narrative progression
    let coherenceScore = 0;
    const idealFlow = ["intro", "problem", "solution", "result"];

    for (let i = 0; i < narrativeTypes.length - 1; i++) {
      const currentIndex = idealFlow.indexOf(narrativeTypes[i]);
      const nextIndex = idealFlow.indexOf(narrativeTypes[i + 1]);

      if (currentIndex !== -1 && nextIndex !== -1 && nextIndex > currentIndex) {
        coherenceScore += 0.3; // Bonus for logical progression
      }
    }

    // AI rewards narrative diversity
    const uniqueTypes = new Set(narrativeTypes).size;
    const diversityBonus = Math.min(uniqueTypes / 4, 1) * 0.4;

    return Math.min(coherenceScore + diversityBonus, 1);
  }

  /**
   * Get story generation recommendation
   */
  static getStoryRecommendation(artifacts: TestimonialArtifact[]): {
    canGenerate: boolean;
    recommendation: string;
    clipCount: number;
    estimatedDuration: number;
  } {
    const selection = this.selectBestClipsForStory(artifacts);

    return {
      canGenerate: selection.storyQuality !== "insufficient",
      recommendation: selection.reasoning,
      clipCount: selection.clips.length,
      estimatedDuration: Math.round(selection.totalDuration),
    };
  }

  /**
   * Enhanced story generation preparation
   * Returns clips prepared for the story generation service
   */
  static prepareClipsForStoryGeneration(artifacts: TestimonialArtifact[]): {
    success: boolean;
    clips: ClipData[];
    metadata: {
      selectionMethod: "ai_optimized";
      totalDuration: number;
      averageEngagement: number;
      storyQuality: string;
      clipThemes: string[];
    };
    error?: string;
  } {
    const selection = this.selectBestClipsForStory(artifacts);

    if (selection.storyQuality === "insufficient") {
      return {
        success: false,
        clips: [],
        metadata: {
          selectionMethod: "ai_optimized",
          totalDuration: 0,
          averageEngagement: 0,
          storyQuality: selection.storyQuality,
          clipThemes: [],
        },
        error: selection.reasoning,
      };
    }

    const clipThemes = selection.clips.map((clip) => clip.theme);

    return {
      success: true,
      clips: selection.clips,
      metadata: {
        selectionMethod: "ai_optimized",
        totalDuration: selection.totalDuration,
        averageEngagement: selection.averageEngagement,
        storyQuality: selection.storyQuality,
        clipThemes,
      },
    };
  }

  /**
   * Format duration for display
   */
  static formatDuration(seconds: number): string {
    if (seconds < 60) {
      return `${Math.round(seconds)}s`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return `${minutes}m ${remainingSeconds}s`;
  }

  /**
   * Get engagement level description
   */
  static getEngagementDescription(score: number): string {
    if (score >= 0.9) return "Exceptional";
    if (score >= 0.8) return "Excellent";
    if (score >= 0.7) return "Good";
    if (score >= 0.6) return "Fair";
    return "Low";
  }
}

export default AIStoryUtilities;
