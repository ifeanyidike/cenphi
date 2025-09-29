// components/smart-navigation/ContextualContentFilter.tsx
import React, { useMemo } from "react";
import { motion } from "framer-motion";
import {
  Filter,
  Layers,
  Home,
  GitBranch,
  Eye,
  EyeOff,
  Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { TestimonialArtifact } from "@/types/testimonial";
import {
  organizeArtifactsByContext,
  shouldShowInContext
} from "@/utils/ContentRouter";

interface ContextualContentFilterProps {
  artifacts: TestimonialArtifact[];
  currentContext: "testimonial-detail" | "ai-hub";
  showCrossReferences: boolean;
  onToggleCrossReferences: (show: boolean) => void;
  onFilterChange?: (filteredArtifacts: TestimonialArtifact[]) => void;
  className?: string;
}

interface ContentStats {
  primary: number;
  crossReference: number;
  hidden: number;
  total: number;
}

const ContextualContentFilter: React.FC<ContextualContentFilterProps> = ({
  artifacts,
  currentContext,
  showCrossReferences,
  onToggleCrossReferences,
  onFilterChange,
  className = ""
}) => {
  const contentStats = useMemo((): ContentStats => {
    let primary = 0;
    let crossReference = 0;
    let hidden = 0;

    artifacts.forEach(artifact => {
      const shouldShow = shouldShowInContext(artifact, currentContext);

      if (!shouldShow.show) {
        hidden++;
      } else if (shouldShow.isPrimary) {
        primary++;
      } else {
        crossReference++;
      }
    });

    return {
      primary,
      crossReference,
      hidden,
      total: artifacts.length
    };
  }, [artifacts, currentContext]);

  const organization = useMemo(() => {
    return organizeArtifactsByContext(artifacts);
  }, [artifacts]);

  const filteredArtifacts = useMemo(() => {
    const result = artifacts.filter(artifact => {
      const shouldShow = shouldShowInContext(artifact, currentContext);

      if (!shouldShow.show) return false;
      if (shouldShow.isPrimary) return true;
      if (!shouldShow.isPrimary && showCrossReferences) return true;

      return false;
    });

    if (onFilterChange) {
      onFilterChange(result);
    }

    return result;
  }, [artifacts, currentContext, showCrossReferences, onFilterChange]);

  const getContextTitle = () => {
    switch (currentContext) {
      case "ai-hub":
        return "AI Content Hub";
      case "testimonial-detail":
        return "Testimonial Details";
      default:
        return "Content View";
    }
  };

  const getContextIcon = () => {
    switch (currentContext) {
      case "ai-hub":
        return <Layers className="h-4 w-4" />;
      case "testimonial-detail":
        return <Home className="h-4 w-4" />;
      default:
        return <Filter className="h-4 w-4" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={className}
    >
      <Card className="border border-gray-200 bg-white">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-3 text-sm">
            {getContextIcon()}
            <span>Content Context: {getContextTitle()}</span>
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Content Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="text-center p-2 bg-green-50 rounded-md">
              <div className="text-lg font-semibold text-green-700">
                {contentStats.primary}
              </div>
              <div className="text-xs text-green-600">Primary Content</div>
            </div>

            <div className="text-center p-2 bg-blue-50 rounded-md">
              <div className="text-lg font-semibold text-blue-700">
                {contentStats.crossReference}
              </div>
              <div className="text-xs text-blue-600">Cross-References</div>
            </div>

            <div className="text-center p-2 bg-gray-50 rounded-md">
              <div className="text-lg font-semibold text-gray-700">
                {contentStats.hidden}
              </div>
              <div className="text-xs text-gray-600">Other Context</div>
            </div>

            <div className="text-center p-2 bg-slate-50 rounded-md">
              <div className="text-lg font-semibold text-slate-700">
                {contentStats.total}
              </div>
              <div className="text-xs text-slate-600">Total Content</div>
            </div>
          </div>

          <Separator />

          {/* Smart Filters */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GitBranch className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-900">
                  Cross-Reference Content
                </span>
              </div>
              <Button
                variant={showCrossReferences ? "default" : "outline"}
                size="sm"
                onClick={() => onToggleCrossReferences(!showCrossReferences)}
                className="text-xs h-7 px-3"
              >
                {showCrossReferences ? (
                  <>
                    <Eye className="h-3 w-3 mr-1" />
                    Showing
                  </>
                ) : (
                  <>
                    <EyeOff className="h-3 w-3 mr-1" />
                    Hidden
                  </>
                )}
              </Button>
            </div>

            {showCrossReferences && contentStats.crossReference > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-blue-700 leading-relaxed">
                    <strong>Cross-reference content</strong> originates from {currentContext === "ai-hub" ? "individual testimonials" : "multi-testimonial processing"} but is also relevant here.
                    These items may appear differently or have reduced functionality compared to their primary location.
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Content Organization Summary */}
          {currentContext === "ai-hub" && (
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-gray-900">Content Sources</h4>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="text-xs">
                  <Layers className="h-2.5 w-2.5 mr-1" />
                  Multi-testimonial: {organization.primaryAIHub.length}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  <GitBranch className="h-2.5 w-2.5 mr-1" />
                  Shared: {organization.sharedContent.length}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  <Home className="h-2.5 w-2.5 mr-1" />
                  From testimonials: {organization.primaryTestimonialDetail.length}
                </Badge>
              </div>
            </div>
          )}

          {/* Current View Summary */}
          <div className="bg-gray-50 rounded-md p-3">
            <p className="text-xs text-gray-700">
              <strong>Currently showing:</strong> {filteredArtifacts.length} of {contentStats.total} items
              {contentStats.hidden > 0 && (
                <span className="text-gray-500">
                  {" "}• {contentStats.hidden} items belong primarily in {currentContext === "ai-hub" ? "testimonial details" : "AI content hub"}
                </span>
              )}
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ContextualContentFilter;