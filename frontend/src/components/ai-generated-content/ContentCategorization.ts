// components/ai-generated-content/ContentCategorization.ts
import { TestimonialArtifact, ProcessingType } from "@/types/testimonial";
import {
  Video,
  FileText,
  Languages,
  Mic,
  TrendingUp,
  Target,
  Instagram,
  Youtube
} from "lucide-react";

export interface ContentCategory {
  id: string;
  label: string;
  description: string;
  icon: any;
  color: string;
  types: ProcessingType[];
  priority: number;
}

export interface PlatformTarget {
  id: string;
  name: string;
  icon: any;
  aspectRatio: string;
  maxDuration: string;
  features: string[];
}

export interface ContentLineage {
  id: string;
  parentId?: string;
  children: string[];
  level: number;
  sourceType: 'testimonial' | 'artifact' | 'multi-testimonial';
  sourceId?: string;
}

export interface EnhancedArtifact extends TestimonialArtifact {
  category: ContentCategory;
  lineage: ContentLineage;
  platformTarget?: PlatformTarget;
  sourceTestimonials: any[];
  derivativeCount: number;
  parentArtifact?: TestimonialArtifact;
  childArtifacts: TestimonialArtifact[];
}

// Content Categories Definition
export const CONTENT_CATEGORIES: ContentCategory[] = [
  {
    id: 'video_content',
    label: 'Video Content',
    description: 'Enhanced videos, story compilations, and clips',
    icon: Video,
    color: 'bg-blue-50 text-blue-700 border-blue-200',
    types: ['enhancement', 'story_mode_generation', 'best_story_moments', 'clipping'],
    priority: 1
  },
  {
    id: 'platform_optimized_video',
    label: 'Platform Video',
    description: 'Video content optimized for specific platforms',
    icon: Target,
    color: 'bg-purple-50 text-purple-700 border-purple-200',
    types: ['video_platform_optimization'],
    priority: 2
  },
  {
    id: 'platform_optimized_text',
    label: 'Platform Text',
    description: 'Text content optimized for specific platforms',
    icon: Target,
    color: 'bg-amber-50 text-amber-700 border-amber-200',
    types: ['text_platform_optization'],
    priority: 3
  },
  {
    id: 'text_content',
    label: 'Text Content',
    description: 'Generated marketing copy and polished text',
    icon: FileText,
    color: 'bg-green-50 text-green-700 border-green-200',
    types: ['content_generation', 'text_polishing'],
    priority: 3
  },
  {
    id: 'translations',
    label: 'Translations',
    description: 'Multi-language versions of content',
    icon: Languages,
    color: 'bg-orange-50 text-orange-700 border-orange-200',
    types: ['translation'],
    priority: 4
  },
  {
    id: 'audio_content',
    label: 'Audio Content',
    description: 'Voice narrations and audio processing',
    icon: Mic,
    color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    types: ['narration'],
    priority: 5
  },
  {
    id: 'analysis',
    label: 'Analysis & Insights',
    description: 'Sentiment analysis, highlights, and viral insights',
    icon: TrendingUp,
    color: 'bg-rose-50 text-rose-700 border-rose-200',
    types: ['sentiment_analysis', 'viral_analysis', 'highlight_extraction'],
    priority: 6
  }
];

// Platform Targets Definition
export const PLATFORM_TARGETS: PlatformTarget[] = [
  {
    id: 'instagram_reels',
    name: 'Instagram Reels',
    icon: Instagram,
    aspectRatio: '9:16',
    maxDuration: '90s',
    features: ['Vertical format', 'Captions', 'Trending audio']
  },
  {
    id: 'instagram_stories',
    name: 'Instagram Stories',
    icon: Instagram,
    aspectRatio: '9:16',
    maxDuration: '15s',
    features: ['Vertical format', 'Quick consumption', 'Interactive elements']
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    icon: Video,
    aspectRatio: '9:16',
    maxDuration: '3min',
    features: ['Vertical format', 'Algorithm optimized', 'Trending sounds']
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    icon: Target,
    aspectRatio: '16:9',
    maxDuration: '10min',
    features: ['Professional tone', 'Business focus', 'Longer content']
  },
  {
    id: 'youtube',
    name: 'YouTube',
    icon: Youtube,
    aspectRatio: '16:9',
    maxDuration: 'Unlimited',
    features: ['Horizontal format', 'Detailed content', 'SEO optimized']
  },
  {
    id: 'youtube_shorts',
    name: 'YouTube Shorts',
    icon: Youtube,
    aspectRatio: '9:16',
    maxDuration: '60s',
    features: ['Vertical format', 'Quick engagement', 'Mobile-first']
  }
];

// Content Processing Levels - Based on actual processing relationships
export const PROCESSING_LEVELS = {
  ORIGINAL: 1,    // Direct processing from testimonial (enhancement, clipping, etc)
  DERIVED: 2,     // Processing from other artifacts (platform optimization of clips, etc)
  COMPOSED: 3     // Multi-testimonial compositions (story videos, content generation)
};

// Helper Functions
export function categorizeArtifact(artifact: TestimonialArtifact): ContentCategory {
  return CONTENT_CATEGORIES.find(cat =>
    cat.types.includes(artifact.processing_type)
  ) || CONTENT_CATEGORIES[0];
}

export function getPlatformTarget(artifact: TestimonialArtifact): PlatformTarget | undefined {
  // Check multiple possible locations for platform data
  const platformData = artifact.data?.platform ||
                      artifact.platform ||
                      artifact.data?.target_platform ||
                      artifact.processing_metadata?.platform ||
                      artifact.processing_metadata?.target_platform;

  if (!platformData) return undefined;

  // Normalize platform string for matching
  const normalizedPlatform = platformData.toLowerCase().trim();

  return PLATFORM_TARGETS.find(target => {
    const targetId = target.id.toLowerCase();
    const targetName = target.name.toLowerCase();

    return targetId === normalizedPlatform ||
           targetName === normalizedPlatform ||
           targetName.includes(normalizedPlatform) ||
           normalizedPlatform.includes(targetId);
  });
}

export function buildContentLineage(
  artifacts: TestimonialArtifact[]
): Map<string, ContentLineage> {
  const lineageMap = new Map<string, ContentLineage>();

  artifacts.forEach(artifact => {
    const lineage: ContentLineage = {
      id: artifact.id,
      children: [],
      level: PROCESSING_LEVELS.ORIGINAL,
      sourceType: 'testimonial',
      sourceId: artifact.testimonial_id
    };

    // Check for multi-testimonial content (compositions)
    const testimonialIds = artifact.data?.testimonial_ids;
    const isStoryVideo = artifact.processing_type === 'story_mode_generation' ||
                        artifact.processing_type === 'best_story_moments';

    if ((testimonialIds && testimonialIds.length > 1) || isStoryVideo) {
      lineage.sourceType = 'multi-testimonial';
      lineage.level = PROCESSING_LEVELS.COMPOSED;
    }

    // Determine if this is derived from another artifact
    const sourceArtifactId = artifact.data?.source_artifact_id ||
                           artifact.processing_metadata?.source_artifact_id ||
                           artifact.data?.parent_artifact_id;

    if (sourceArtifactId) {
      lineage.parentId = sourceArtifactId;
      lineage.level = PROCESSING_LEVELS.DERIVED;
      lineage.sourceType = 'artifact';
      lineage.sourceId = sourceArtifactId;
    }

    // Platform optimization is typically derived content
    if (artifact.processing_type === 'video_platform_optimization' ||
        artifact.processing_type === 'text_platform_optization') {
      lineage.level = PROCESSING_LEVELS.DERIVED;
    }

    lineageMap.set(artifact.id, lineage);
  });

  // Build parent-child relationships
  lineageMap.forEach(lineage => {
    if (lineage.parentId && lineageMap.has(lineage.parentId)) {
      const parentLineage = lineageMap.get(lineage.parentId)!;
      parentLineage.children.push(lineage.id);
    }
  });

  return lineageMap;
}

export function enhanceArtifacts(
  artifacts: TestimonialArtifact[],
  testimonials: any[]
): EnhancedArtifact[] {
  const lineageMap = buildContentLineage(artifacts);

  return artifacts.map(artifact => {
    const category = categorizeArtifact(artifact);
    const lineage = lineageMap.get(artifact.id)!;
    const platformTarget = getPlatformTarget(artifact);

    // Get source testimonials
    const testimonialIds = artifact.data?.testimonial_ids ||
                          (artifact.testimonial_id ? [artifact.testimonial_id] : []);
    const sourceTestimonials = testimonialIds
      .map((id: string) => testimonials.find(t => t.id === id))
      .filter(Boolean);

    // Get parent and child artifacts
    const parentArtifact = lineage.parentId ?
      artifacts.find(a => a.id === lineage.parentId) : undefined;
    const childArtifacts = lineage.children
      .map(id => artifacts.find(a => a.id === id))
      .filter(Boolean) as TestimonialArtifact[];

    return {
      ...artifact,
      category,
      lineage,
      platformTarget,
      sourceTestimonials,
      derivativeCount: childArtifacts.length,
      parentArtifact,
      childArtifacts
    } as EnhancedArtifact;
  });
}

export function getContentStats(enhancedArtifacts: EnhancedArtifact[]) {
  const stats = {
    total: enhancedArtifacts.length,
    byCategory: {} as Record<string, number>,
    byPlatform: {} as Record<string, number>,
    byLevel: {} as Record<number, number>,
    sourceTestimonials: new Set<string>()
  };

  enhancedArtifacts.forEach(artifact => {
    // Category stats
    const categoryId = artifact.category.id;
    stats.byCategory[categoryId] = (stats.byCategory[categoryId] || 0) + 1;

    // Platform stats
    if (artifact.platformTarget) {
      const platformId = artifact.platformTarget.id;
      stats.byPlatform[platformId] = (stats.byPlatform[platformId] || 0) + 1;
    }

    // Level stats
    const level = artifact.lineage.level;
    stats.byLevel[level] = (stats.byLevel[level] || 0) + 1;

    // Source testimonials
    artifact.sourceTestimonials.forEach(t => stats.sourceTestimonials.add(t.id));
  });

  return stats;
}