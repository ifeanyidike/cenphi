// src/components/collection-setup/common/FormatsSection.tsx
import React from "react";
import { observer } from "mobx-react-lite";
import { motion } from "framer-motion";
import { CollectionMethod } from "@/types/setup";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import {
  PlusCircle,
  Video,
  AudioLines,
  FileText,
  Image,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Format option type definition
interface FormatOption {
  type: "video" | "audio" | "text" | "image";
  enabled: boolean;
}

interface FormatsSectionProps {
  method: CollectionMethod;
  formats: FormatOption[];
  onToggleFormat: (formatType: "video" | "audio" | "text" | "image") => void;
  onAddFormatClick: () => void;
}

// Format metadata
const formatDetails = {
  video: {
    icon: Video,
    title: "Video Testimonials",
    description: "Authentic visual stories from customers",
    color: "indigo",
    conversionRate: "87%",
    formatSize: "~50MB",
  },
  audio: {
    icon: AudioLines,
    title: "Audio Testimonials",
    description: "Voice feedback capturing genuine tone",
    color: "blue",
    conversionRate: "74%",
    formatSize: "~10MB",
  },
  text: {
    icon: FileText,
    title: "Text Testimonials",
    description: "Written reviews and testimonials",
    color: "emerald",
    conversionRate: "95%",
    formatSize: "< 1MB",
  },
  image: {
    icon: Image,
    title: "Image Testimonials",
    description: "Photo testimonials with text overlay",
    color: "amber",
    conversionRate: "68%",
    formatSize: "~5MB",
  },
};

// Background and border colors based on format type
const formatColors = {
  video: {
    bg: {
      active: "bg-indigo-50 group-hover:bg-indigo-100/80",
      inactive: "bg-white group-hover:bg-slate-50",
    },
    border: {
      active: "border-indigo-200",
      inactive: "border-slate-200 group-hover:border-slate-300",
    },
    icon: {
      active: "bg-indigo-100 text-indigo-600",
      inactive: "bg-slate-100 text-slate-500 group-hover:text-slate-600",
    },
    badge: {
      bg: "bg-indigo-100/50",
      text: "text-indigo-700",
    },
  },
  audio: {
    bg: {
      active: "bg-blue-50 group-hover:bg-blue-100/80",
      inactive: "bg-white group-hover:bg-slate-50",
    },
    border: {
      active: "border-blue-200",
      inactive: "border-slate-200 group-hover:border-slate-300",
    },
    icon: {
      active: "bg-blue-100 text-blue-600",
      inactive: "bg-slate-100 text-slate-500 group-hover:text-slate-600",
    },
    badge: {
      bg: "bg-blue-100/50",
      text: "text-blue-700",
    },
  },
  text: {
    bg: {
      active: "bg-emerald-50 group-hover:bg-emerald-100/80",
      inactive: "bg-white group-hover:bg-slate-50",
    },
    border: {
      active: "border-emerald-200",
      inactive: "border-slate-200 group-hover:border-slate-300",
    },
    icon: {
      active: "bg-emerald-100 text-emerald-600",
      inactive: "bg-slate-100 text-slate-500 group-hover:text-slate-600",
    },
    badge: {
      bg: "bg-emerald-100/50",
      text: "text-emerald-700",
    },
  },
  image: {
    bg: {
      active: "bg-amber-50 group-hover:bg-amber-100/80",
      inactive: "bg-white group-hover:bg-slate-50",
    },
    border: {
      active: "border-amber-200",
      inactive: "border-slate-200 group-hover:border-slate-300",
    },
    icon: {
      active: "bg-amber-100 text-amber-600",
      inactive: "bg-slate-100 text-slate-500 group-hover:text-slate-600",
    },
    badge: {
      bg: "bg-amber-100/50",
      text: "text-amber-700",
    },
  },
};

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.07 } },
};

const formatCardVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

const FormatCard: React.FC<{
  format: FormatOption;
  onToggle: () => void;
}> = ({ format, onToggle }) => {
  const { type, enabled } = format;
  const formatInfo = formatDetails[type];
  const colors = formatColors[type];

  const Icon = formatInfo.icon;

  return (
    <motion.div
      key={type}
      variants={formatCardVariants}
      className={cn(
        "group p-4 rounded-xl border shadow-sm transition-all duration-300 cursor-pointer",
        enabled
          ? `${colors.bg.active} ${colors.border.active}`
          : `${colors.bg.inactive} ${colors.border.inactive}`
      )}
      onClick={onToggle}
    >
      <div className="flex flex-col h-full">
        <div className="flex items-start justify-between mb-3">
          <div
            className={cn(
              "p-2.5 rounded-lg transition-colors duration-300",
              enabled ? colors.icon.active : colors.icon.inactive
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
          <Switch
            checked={enabled}
            className="data-[state=checked]:bg-indigo-600"
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
          />
        </div>

        <h3
          className={cn(
            "font-medium transition-colors duration-200",
            enabled ? "text-slate-900" : "text-slate-600"
          )}
        >
          {formatInfo.title}
        </h3>

        <p className="text-xs text-slate-500 mt-1 min-h-[2.5rem]">
          {formatInfo.description}
        </p>

        <div className="mt-3 pt-3 border-t border-slate-200/80 grid grid-cols-2 gap-1 text-xs">
          <div className="flex items-center gap-1">
            <Badge
              variant="outline"
              className={cn(
                "px-2 text-[10px] font-medium",
                colors.badge.bg,
                colors.badge.text
              )}
            >
              {formatInfo.conversionRate}
            </Badge>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger className="cursor-help">
                  <Info className="h-3 w-3 text-slate-400 hover:text-slate-600 transition-colors" />
                </TooltipTrigger>
                <TooltipContent className="text-xs">
                  Average conversion rate
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="text-right text-slate-500 text-[10px]">
            {formatInfo.formatSize}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const FormatsSection: React.FC<FormatsSectionProps> = ({
  formats,
  onToggleFormat,
  onAddFormatClick,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-base font-semibold text-slate-800">
            Accepted Formats
          </h3>
          <p className="text-sm text-slate-500 mt-0.5">
            Choose which types of testimonials you want to collect
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={onAddFormatClick}
          className="flex items-center gap-1 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50/50 border-indigo-200"
        >
          <PlusCircle className="h-4 w-4" />
          <span>Add Format</span>
        </Button>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {formats.map((format) => (
          <FormatCard
            key={format.type}
            format={format}
            onToggle={() => onToggleFormat(format.type)}
          />
        ))}
      </motion.div>
    </div>
  );
};

export default observer(FormatsSection);
