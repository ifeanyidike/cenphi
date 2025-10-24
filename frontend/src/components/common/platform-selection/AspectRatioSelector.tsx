/**
 * AspectRatioSelector Component
 *
 * Reusable aspect ratio selector for platform optimization.
 * Step 1 of the "Aspect Ratio Primary → Platform Secondary" flow.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { Card } from '@/components/ui/card';

export type AspectRatio = '9:16' | '16:9' | '1:1';

interface AspectRatioOption {
  ratio: AspectRatio;
  name: string;
  description: string;
  icon: string;
}

const ASPECT_RATIOS: AspectRatioOption[] = [
  {
    ratio: '9:16',
    name: 'Vertical',
    description: 'Stories, Reels, Shorts',
    icon: '📱',
  },
  {
    ratio: '16:9',
    name: 'Landscape',
    description: 'YouTube, LinkedIn',
    icon: '🖥️',
  },
  {
    ratio: '1:1',
    name: 'Square',
    description: 'Instagram Feed',
    icon: '⬜',
  },
];

interface AspectRatioSelectorProps {
  selected: AspectRatio | null;
  onChange: (ratio: AspectRatio) => void;
  className?: string;
}

export const AspectRatioSelector: React.FC<AspectRatioSelectorProps> = ({
  selected,
  onChange,
  className = '',
}) => {
  return (
    <div className={className}>
      <div className="grid grid-cols-3 gap-3">
        {ASPECT_RATIOS.map((option) => (
          <motion.div
            key={option.ratio}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Card
              onClick={() => onChange(option.ratio)}
              className={`
                relative cursor-pointer p-4 transition-all duration-200
                ${
                  selected === option.ratio
                    ? 'border-2 border-blue-500 bg-blue-50 shadow-sm'
                    : 'border-2 border-slate-200 bg-white hover:border-slate-300'
                }
              `}
            >
              {selected === option.ratio && (
                <div className="absolute top-2 right-2">
                  <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center">
                    <Check className="h-3 w-3 text-white" />
                  </div>
                </div>
              )}

              <div className="text-center">
                <div className="text-2xl mb-2">{option.icon}</div>
                <div className="text-sm font-semibold text-slate-900 mb-1">
                  {option.name}
                </div>
                <div className="text-xs text-slate-600 mb-2">{option.ratio}</div>
                <div className="text-xs text-slate-500">{option.description}</div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
