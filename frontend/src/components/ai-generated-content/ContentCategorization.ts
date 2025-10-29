// components/ai-generated-content/ContentCategorization.ts
import { TestimonialArtifact, ProcessingType } from "@/types/testimonial";
import {
  Video,
  FileText,
  Target,
  Sparkles,
  Instagram,
  Youtube,
  Linkedin,
  Twitter,
  Facebook
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

// Simplified Content Categories - Focus on actual services
export const CONTENT_CATEGORIES: ContentCategory[] = [
  {
    id: 'platform_optimized_video',
    label: 'Platform-Optimized Videos',
    description: 'Videos optimized for specific social media platforms',
    icon: Target,
    color: 'bg-gradient-to-br from-purple-50 to-purple-100 text-purple-700 border-purple-200',
    types: ['video_platform_optimization', 'custom_pipeline'],
    priority: 1
  },
  {
    id: 'story_videos',
    label: 'Story Videos',
    description: 'Curated story compilations from best moments',
    icon: Sparkles,
    color: 'bg-gradient-to-br from-blue-50 to-blue-100 text-blue-700 border-blue-200',
    types: ['story_mode_generation', 'best_story_moments'],
    priority: 2
  },
  {
    id: 'generated_content',
    label: 'Generated Content',
    description: 'AI-generated marketing copy and content variations',
    icon: FileText,
    color: 'bg-gradient-to-br from-emerald-50 to-emerald-100 text-emerald-700 border-emerald-200',
    types: ['content_generation'],
    priority: 3
  },
  {
    id: 'data_insights',
    label: 'Data Insights',
    description: 'AI-powered insights from Talk to Your Data',
    icon: Video,
    color: 'bg-gradient-to-br from-cyan-50 to-cyan-100 text-cyan-700 border-cyan-200',
    types: ['talk_to_data', 'data_analysis'],
    priority: 4
  }
];

// Platform Targets Definition - Focused on main platforms
export const PLATFORM_TARGETS: PlatformTarget[] = [
  {
    id: 'instagram_reels',
    name: 'Instagram Reels',
    icon: Instagram,
    aspectRatio: '9:16',
    maxDuration: '90s',
    features: ['Vertical', 'Captions', 'Trending audio']
  },
  {
    id: 'instagram_feed',
    name: 'Instagram Feed',
    icon: Instagram,
    aspectRatio: '1:1 / 4:5',
    maxDuration: '60s',
    features: ['Square/Portrait', 'Descriptive captions']
  },
  {
    id: 'instagram_stories',
    name: 'Instagram Stories',
    icon: Instagram,
    aspectRatio: '9:16',
    maxDuration: '15s',
    features: ['Vertical', 'Quick consumption']
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    icon: Video,
    aspectRatio: '9:16',
    maxDuration: '3min',
    features: ['Vertical', 'Algorithm optimized']
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    icon: Linkedin,
    aspectRatio: '16:9 / 1:1',
    maxDuration: '10min',
    features: ['Professional', 'Business focus']
  },
  {
    id: 'youtube_shorts',
    name: 'YouTube Shorts',
    icon: Youtube,
    aspectRatio: '9:16',
    maxDuration: '60s',
    features: ['Vertical', 'Mobile-first']
  },
  {
    id: 'youtube',
    name: 'YouTube',
    icon: Youtube,
    aspectRatio: '16:9',
    maxDuration: 'Unlimited',
    features: ['Horizontal', 'SEO optimized']
  },
  {
    id: 'twitter',
    name: 'Twitter/X',
    icon: Twitter,
    aspectRatio: '16:9 / 1:1',
    maxDuration: '2m20s',
    features: ['Quick engagement', 'Viral potential']
  },
  {
    id: 'facebook',
    name: 'Facebook',
    icon: Facebook,
    aspectRatio: '1:1 / 16:9',
    maxDuration: '240min',
    features: ['Emotional', 'Questions']
  }
];

// Content Processing Levels
export const PROCESSING_LEVELS = {
  ORIGINAL: 1,    // Direct processing from testimonial
  DERIVED: 2,     // Processing from other artifacts
  COMPOSED: 3     // Multi-testimonial compositions
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

    // Check for multi-testimonial content
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
