// src/components/collection-setup/website/WebsiteSettings.tsx
import React from "react";
import { observer } from "mobx-react-lite";
import { motion } from "framer-motion";
import { ExternalLink, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CollectionSettings, TriggerType } from "@/types/setup";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import TestimonialWidgetSettings from "./TestimonialWebsiteSettings";

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      when: "beforeChildren",
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

interface WebsiteSettingsProps {
  settings: CollectionSettings["website"];
  onFormatToggle: (formatType: "video" | "audio" | "text" | "image") => void;
  onTriggerToggle: (triggerType: TriggerType) => void;
  onRemoveTrigger: (triggerType: TriggerType) => void;
  onSettingsChange: (
    field: keyof CollectionSettings["website"],
    value: any
  ) => void;
  onNestedSettingsChange: <
    U extends keyof CollectionSettings["website"],
    F extends keyof NonNullable<CollectionSettings["website"][U]>,
  >(
    parentField: U,
    field: F,
    value: NonNullable<CollectionSettings["website"][U]>[F]
  ) => void;
  copiedElement: string | null;
  onCopyElement: (element: string) => void;
  showToast: (toast: {
    title: string;
    description: string;
    variant?: "default" | "destructive";
  }) => void;
}

const WebsiteSettings: React.FC<WebsiteSettingsProps> = () => {
  return (
    <motion.div
      className="space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Info Bar */}
      <motion.div
        variants={itemVariants}
        className="px-5 py-4 bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100 rounded-xl flex items-start gap-3"
      >
        <Info className="w-5 h-5 text-indigo-600 mt-0.5 flex-shrink-0" />
        <div>
          <h3 className="font-medium text-indigo-900 text-sm">
            Boost conversion with website testimonials
          </h3>
          <p className="text-indigo-700/80 text-xs leading-relaxed mt-1">
            Add a testimonial collection widget directly to your website to
            capture feedback at key moments. Customize appearance, position, and
            triggers to maximize response rates.
          </p>
        </div>
        <div className="ml-auto">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 rounded-full text-indigo-700 hover:text-indigo-900 hover:bg-indigo-100"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">View best practices guide</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </motion.div>

      <TestimonialWidgetSettings />
    </motion.div>
  );
};

export default observer(WebsiteSettings);
