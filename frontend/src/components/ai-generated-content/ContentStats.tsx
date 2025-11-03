// components/ai-generated-content/ContentStats.tsx
import React from "react";
import { motion } from "framer-motion";
import { Layers, Palette, Zap, TrendingUp, LucideIcon } from "lucide-react";

interface StatItem {
  label: string;
  value: number;
  icon: LucideIcon;
}

interface ContentStatsProps {
  stats: {
    total: number;
    categoriesCount: number;
    platformsCount: number;
    sourcesCount: number;
  };
}

const ContentStats: React.FC<ContentStatsProps> = ({ stats }) => {
  const statItems: StatItem[] = [
    {
      label: "Total",
      value: stats.total,
      icon: Layers,
    },
    {
      label: "Types",
      value: stats.categoriesCount,
      icon: Palette,
    },
    {
      label: "Platforms",
      value: stats.platformsCount,
      icon: Zap,
    },
    {
      label: "Sources",
      value: stats.sourcesCount,
      icon: TrendingUp,
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-6">
      {statItems.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <div key={stat.label} className="text-center py-3 sm:py-4 px-2 sm:px-3 bg-slate-50/50 rounded-lg border border-slate-200/50">
            <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-400 mx-auto mb-1.5 sm:mb-2" />
            <p className="text-xl sm:text-2xl font-bold text-slate-900 mb-0.5">
              {stat.value}
            </p>
            <p className="text-[9px] sm:text-[10px] font-medium text-slate-500 uppercase tracking-wide">
              {stat.label}
            </p>
          </div>
        );
      })}
    </div>
  );
};

export default ContentStats;
