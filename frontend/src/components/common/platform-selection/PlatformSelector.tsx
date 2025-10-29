/**
 * PlatformSelector Component
 *
 * Reusable platform selector with aspect ratio filtering.
 * Step 2 of the "Aspect Ratio Primary → Platform Secondary" flow.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Instagram, Youtube, Linkedin, Facebook, Twitter, Music, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { AspectRatio } from './AspectRatioSelector';

export interface Platform {
  id: string;
  name: string;
  icon: React.ReactNode;
  aspectRatio: AspectRatio;
  description: string;
  gradient: string;
}

// Platform definitions matching backend ai-service/src/services/platform_optimizer/platform_specs.py
export const ALL_PLATFORMS: Platform[] = [
  // 9:16 Vertical
  {
    id: 'tiktok',
    name: 'TikTok',
    icon: <Music className="h-5 w-5" />,
    aspectRatio: '9:16',
    description: 'Vertical short videos, max 60s',
    gradient: 'from-slate-800 to-slate-900',
  },
  {
    id: 'instagram_reels',
    name: 'Instagram Reels',
    icon: <Instagram className="h-5 w-5" />,
    aspectRatio: '9:16',
    description: 'Vertical reels, max 90s',
    gradient: 'from-purple-600 to-pink-600',
  },
  {
    id: 'youtube_shorts',
    name: 'YouTube Shorts',
    icon: <Youtube className="h-5 w-5" />,
    aspectRatio: '9:16',
    description: 'Vertical shorts, max 60s',
    gradient: 'from-red-500 to-red-600',
  },
  {
    id: 'instagram_story',
    name: 'Instagram Story',
    icon: <Instagram className="h-5 w-5" />,
    aspectRatio: '9:16',
    description: 'Vertical stories, max 15s',
    gradient: 'from-purple-500 via-pink-500 to-orange-500',
  },
  // 16:9 Horizontal
  {
    id: 'youtube_standard',
    name: 'YouTube Video',
    icon: <Youtube className="h-5 w-5" />,
    aspectRatio: '16:9',
    description: 'Horizontal long-form, max 10 min',
    gradient: 'from-red-600 to-red-700',
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    icon: <Linkedin className="h-5 w-5" />,
    aspectRatio: '16:9',
    description: 'Professional platform, max 10 min',
    gradient: 'from-blue-600 to-blue-700',
  },
  {
    id: 'twitter',
    name: 'Twitter/X',
    icon: <Twitter className="h-5 w-5" />,
    aspectRatio: '16:9',
    description: 'Horizontal videos, max 140s',
    gradient: 'from-sky-500 to-blue-600',
  },
  {
    id: 'facebook',
    name: 'Facebook',
    icon: <Facebook className="h-5 w-5" />,
    aspectRatio: '16:9',
    description: 'Horizontal videos, max 4 min',
    gradient: 'from-blue-700 to-blue-800',
  },
  // 1:1 Square
  {
    id: 'instagram_feed',
    name: 'Instagram Feed',
    icon: <Instagram className="h-5 w-5" />,
    aspectRatio: '1:1',
    description: 'Square feed posts, max 60s',
    gradient: 'from-purple-400 to-pink-400',
  },
];

// Default platform for each aspect ratio (for smart defaults)
export const DEFAULT_PLATFORMS: Record<AspectRatio, string> = {
  '9:16': 'tiktok',           // Most popular vertical platform
  '16:9': 'youtube_standard',  // Most versatile horizontal
  '1:1': 'instagram_feed',     // Only square option
};

// Get platforms by aspect ratio
export const getPlatformsByAspectRatio = (aspectRatio: AspectRatio): Platform[] => {
  return ALL_PLATFORMS.filter(p => p.aspectRatio === aspectRatio);
};

interface PlatformSelectorProps {
  aspectRatio: AspectRatio;
  selected: string;
  onChange: (platformId: string) => void;
  className?: string;
}

export const PlatformSelector: React.FC<PlatformSelectorProps> = ({
  aspectRatio,
  selected,
  onChange,
  className = '',
}) => {
  const platforms = getPlatformsByAspectRatio(aspectRatio);

  return (
    <div className={className}>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-slate-700">
            Optimize for
          </label>
          <Badge variant="outline" className="text-xs">
            {platforms.length} {platforms.length === 1 ? 'platform' : 'platforms'}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {platforms.map((platform) => (
            <motion.div
              key={platform.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div
                onClick={() => onChange(platform.id)}
                className={`
                  relative cursor-pointer rounded-lg border-2 p-3 transition-all duration-200
                  ${
                    selected === platform.id
                      ? 'border-blue-500 bg-blue-50 shadow-sm'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }
                `}
              >
                {selected === platform.id && (
                  <div className="absolute top-1.5 right-1.5">
                    <div className="w-4 h-4 rounded-full bg-blue-600 flex items-center justify-center">
                      <Check className="h-2.5 w-2.5 text-white" />
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2.5 mb-2">
                  <div
                    className={`w-7 h-7 rounded-md bg-gradient-to-br ${platform.gradient} flex items-center justify-center text-white flex-shrink-0`}
                  >
                    {platform.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-slate-900 truncate">
                      {platform.name}
                    </div>
                  </div>
                </div>
                <div className="text-xs text-slate-500 line-clamp-1">
                  {platform.description}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {selected && (
          <div className="mt-2 text-xs text-slate-500">
            Selected: <strong className="text-slate-900">
              {platforms.find(p => p.id === selected)?.name}
            </strong>
          </div>
        )}
      </div>
    </div>
  );
};
