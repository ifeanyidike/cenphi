// components/ai-generated-content/NavigationEnhancement.tsx
import React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Brain, ArrowRight, Layers, Target, FileText } from "lucide-react";

interface NavigationEnhancementProps {
  testimonialId?: string;
  showAIContentLink?: boolean;
  derivativesCount?: number;
  className?: string;
}

const NavigationEnhancement: React.FC<NavigationEnhancementProps> = ({
  testimonialId,
  showAIContentLink = true,
  derivativesCount = 0,
  className = ""
}) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const handleViewAllAIContent = () => {
    navigate("/ai-content");
  };

  const handleViewTestimonialDerivatives = () => {
    if (testimonialId) {
      navigate(`/ai-content?source=${testimonialId}`);
    }
  };

  const handleViewProcessingLineage = () => {
    if (testimonialId) {
      navigate(`/ai-content?view=tree&source=${testimonialId}`);
    }
  };

  // Check if we're coming from AI content page
  const fromAIContent = searchParams.get('from') === 'ai-content';
  const jobId = searchParams.get('jobId');

  if (!showAIContentLink && derivativesCount === 0) {
    return null;
  }

  return (
    <Card className={`border border-blue-100 bg-blue-50/30 ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-100 border border-blue-200 flex items-center justify-center">
              <Brain className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-900">AI-Generated Content</h3>
              <p className="text-xs text-gray-600">
                {derivativesCount > 0
                  ? `${derivativesCount} AI-generated item${derivativesCount !== 1 ? 's' : ''} from this testimonial`
                  : "View all AI-generated content and processing lineage"
                }
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {fromAIContent && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(-1)}
                className="h-7 px-3 text-xs border-blue-200 text-blue-700 hover:bg-blue-100"
              >
                ← Back to AI Content
              </Button>
            )}

            {derivativesCount > 0 && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleViewTestimonialDerivatives}
                  className="h-7 px-3 text-xs border-blue-200 text-blue-700 hover:bg-blue-100"
                >
                  <FileText className="h-3 w-3 mr-1" />
                  View Derivatives
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleViewProcessingLineage}
                  className="h-7 px-3 text-xs border-blue-200 text-blue-700 hover:bg-blue-100"
                >
                  <Layers className="h-3 w-3 mr-1" />
                  Processing Tree
                </Button>
              </>
            )}

            <Button
              variant="default"
              size="sm"
              onClick={handleViewAllAIContent}
              className="h-7 px-3 text-xs bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Brain className="h-3 w-3 mr-1" />
              AI Content Hub
              <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
        </div>

        {jobId && (
          <div className="mt-3 pt-3 border-t border-blue-200">
            <Badge variant="outline" className="text-xs bg-blue-100 text-blue-700 border-blue-300">
              <Target className="h-2.5 w-2.5 mr-1" />
              Viewing job: {jobId}
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default NavigationEnhancement;