// components/smart-navigation/SmartNavigationBanner.tsx
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Info,
  X,
  Lightbulb,
  ArrowRight,
  Home,
  Layers,
  GitBranch
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface SmartNavigationBannerProps {
  currentContext: "testimonial-detail" | "ai-hub";
  onNavigate?: (target: "testimonial-detail" | "ai-hub") => void;
  className?: string;
}

const SmartNavigationBanner: React.FC<SmartNavigationBannerProps> = ({
  currentContext,
  onNavigate,
  className = ""
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [showDetails, setShowDetails] = useState(false);

  if (!isVisible) return null;

  const getContextInfo = () => {
    switch (currentContext) {
      case "ai-hub":
        return {
          title: "AI Content Hub",
          description: "Centralized view of AI-generated content from multiple testimonials",
          icon: <Layers className="h-4 w-4" />,
          primaryContent: "Multi-testimonial content, cross-references from individual testimonials",
          alternateContext: "testimonial-detail",
          alternateTitle: "Testimonial Details",
          alternateIcon: <Home className="h-4 w-4" />
        };
      case "testimonial-detail":
        return {
          title: "Testimonial Details",
          description: "Content and AI features specific to this individual testimonial",
          icon: <Home className="h-4 w-4" />,
          primaryContent: "Single-testimonial analysis and processing",
          alternateContext: "ai-hub",
          alternateTitle: "AI Content Hub",
          alternateIcon: <Layers className="h-4 w-4" />
        };
      default:
        return null;
    }
  };

  const contextInfo = getContextInfo();
  if (!contextInfo) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className={className}
      >
        <Card className="border border-blue-200 bg-blue-50/50">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Info className="h-4 w-4 text-blue-600" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    {contextInfo.icon}
                    <h3 className="text-sm font-medium text-blue-900">
                      Smart Content Organization: {contextInfo.title}
                    </h3>
                    <Badge variant="outline" className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 border-blue-300">
                      Intelligent
                    </Badge>
                  </div>

                  <p className="text-xs text-blue-700 mb-3 leading-relaxed">
                    {contextInfo.description}. Content is automatically organized based on its source and purpose to reduce confusion.
                  </p>

                  {showDetails && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-3"
                    >
                      <div className="bg-blue-100/50 rounded-md p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Lightbulb className="h-3 w-3 text-blue-600" />
                          <span className="text-xs font-medium text-blue-800">How it works:</span>
                        </div>
                        <div className="text-xs text-blue-700 space-y-1">
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-400"></div>
                            <span><strong>Primary content:</strong> {contextInfo.primaryContent}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <GitBranch className="h-3 w-3 text-blue-600" />
                            <span><strong>Cross-references:</strong> Related content from other contexts (toggle to show/hide)</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-gray-400"></div>
                            <span><strong>Hidden content:</strong> Belongs primarily in other contexts</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <span className="text-xs text-blue-600">Need content from {contextInfo.alternateTitle}?</span>
                        {onNavigate && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onNavigate(contextInfo.alternateContext as any)}
                            className="text-xs h-6 px-2 border-blue-300 hover:bg-blue-100"
                          >
                            {contextInfo.alternateIcon}
                            <span className="ml-1">{contextInfo.alternateTitle}</span>
                            <ArrowRight className="h-2.5 w-2.5 ml-1" />
                          </Button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDetails(!showDetails)}
                  className="text-xs h-6 px-2 hover:bg-blue-100"
                >
                  {showDetails ? "Less" : "Learn More"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsVisible(false)}
                  className="h-6 w-6 p-0 hover:bg-blue-100"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
};

export default SmartNavigationBanner;