// components/smart-navigation/ContentLocationIndicator.tsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Info,
  ExternalLink,
  MapPin,
  Layers,
  Home
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { TestimonialArtifact } from "@/types/testimonial";
import {
  getContentLocation,
  shouldShowInContext,
  getNavigationSuggestion
} from "@/utils/ContentRouter";

interface ContentLocationIndicatorProps {
  artifact: TestimonialArtifact;
  currentContext: "testimonial-detail" | "ai-hub";
  testimonialId?: string;
  className?: string;
  minimal?: boolean;
}

const ContentLocationIndicator: React.FC<ContentLocationIndicatorProps> = ({
  artifact,
  currentContext,
  testimonialId,
  className = "",
  minimal = false
}) => {
  const navigate = useNavigate();
  const location = getContentLocation(artifact);
  const shouldShow = shouldShowInContext(artifact, currentContext);
  const suggestion = getNavigationSuggestion(artifact, currentContext);

  // Don't show if content should not be displayed in current context
  if (!shouldShow.show) {
    return null;
  }

  const handleNavigateToAlternate = () => {
    if (currentContext === "testimonial-detail") {
      navigate("/ai-content");
    } else if (testimonialId) {
      navigate(`/detail/${testimonialId}`);
    } else {
      // If we don't have testimonialId, go to dashboard to find it
      navigate("/dashboard");
    }
  };

  const getContextIcon = (context: string) => {
    switch (context) {
      case "ai-hub":
        return <Layers className="h-3 w-3" />;
      case "testimonial-detail":
        return <Home className="h-3 w-3" />;
      default:
        return <MapPin className="h-3 w-3" />;
    }
  };

  const getContextName = (context: string) => {
    switch (context) {
      case "ai-hub":
        return "AI Content Hub";
      case "testimonial-detail":
        return "Testimonial Details";
      default:
        return "Unknown";
    }
  };

  if (minimal) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {!shouldShow.isPrimary && (
          <Badge variant="outline" className="text-xs px-1.5 py-0.5">
            <Info className="h-2.5 w-2.5 mr-1" />
            Cross-reference
          </Badge>
        )}
        {location.crossReferenceText && shouldShow.crossReference && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleNavigateToAlternate}
            className="text-xs h-6 px-2 hover:bg-gray-100"
          >
            {getContextIcon(location.primary === currentContext ? location.secondary! : location.primary)}
            <span className="ml-1">
              {getContextName(location.primary === currentContext ? location.secondary! : location.primary)}
            </span>
            <ExternalLink className="h-2.5 w-2.5 ml-1" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={className}
    >
      <Card className="border border-blue-100 bg-blue-50/30">
        <CardContent className="p-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-4 h-4 rounded-full bg-blue-100 flex items-center justify-center">
                  {getContextIcon(location.primary)}
                </div>
                <p className="text-xs font-medium text-blue-900">
                  {shouldShow.isPrimary ? "Primary Location" : "Cross-Reference"}
                </p>
                {shouldShow.isPrimary && (
                  <Badge variant="secondary" className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700">
                    Primary
                  </Badge>
                )}
              </div>

              <p className="text-xs text-blue-700 leading-relaxed mb-2">
                {location.reason}
              </p>

              {suggestion && (
                <div className="flex items-center gap-1 text-xs text-blue-600">
                  <Info className="h-3 w-3" />
                  <span>{suggestion}</span>
                </div>
              )}
            </div>

            {location.crossReferenceText && shouldShow.crossReference && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleNavigateToAlternate}
                className="text-xs h-7 px-2 border-blue-200 hover:bg-blue-100 hover:border-blue-300"
              >
                <span className="mr-1">
                  {getContextName(location.primary === currentContext ? location.secondary! : location.primary)}
                </span>
                <ArrowRight className="h-3 w-3" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ContentLocationIndicator;