// components/ui/IndustryAwarenessIndicator.tsx
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Target, Users, Building2 } from "lucide-react";
import { motion } from "framer-motion";

interface IndustryAwarenessIndicatorProps {
  businessModel?: string;
  targetAudience?: string;
  tone?: string;
  className?: string;
  showDetails?: boolean;
}

const IndustryAwarenessIndicator: React.FC<IndustryAwarenessIndicatorProps> = ({
  businessModel,
  targetAudience,
  tone,
  className = "",
  showDetails = true,
}) => {
  if (!businessModel && !targetAudience) return null;

  const getBusinessModelIcon = (model: string) => {
    const modelLower = model.toLowerCase();
    if (modelLower.includes("saas") || modelLower.includes("b2b"))
      return Building2;
    if (modelLower.includes("b2c") || modelLower.includes("consumer"))
      return Users;
    return Target;
  };

  const getBusinessModelColor = (model: string) => {
    const modelLower = model.toLowerCase();
    if (modelLower.includes("saas") || modelLower.includes("b2b")) {
      return "bg-blue-100 text-blue-700 border-blue-200";
    }
    if (modelLower.includes("b2c") || modelLower.includes("consumer")) {
      return "bg-green-100 text-green-700 border-green-200";
    }
    return "bg-purple-100 text-purple-700 border-purple-200";
  };

  const BusinessModelIcon = businessModel
    ? getBusinessModelIcon(businessModel)
    : Target;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`inline-flex items-center gap-2 ${className}`}
    >
      <div className="flex items-center gap-1.5">
        <div className="w-4 h-4 bg-gray-900 rounded-full flex items-center justify-center">
          <Sparkles className="w-2.5 h-2.5 text-white" />
        </div>
        <span className="text-xs font-medium text-gray-600">
          Industry-Optimized
        </span>
      </div>

      {showDetails && (
        <div className="flex items-center gap-1.5">
          {businessModel && (
            <Badge
              className={`text-xs px-2 py-0.5 font-medium ${getBusinessModelColor(businessModel)}`}
            >
              <BusinessModelIcon className="w-3 h-3 mr-1" />
              {businessModel}
            </Badge>
          )}

          {targetAudience && (
            <Badge
              variant="outline"
              className="text-xs px-2 py-0.5 font-medium bg-gray-50 text-gray-600 border-gray-200"
            >
              {targetAudience}
            </Badge>
          )}

          {tone && (
            <Badge
              variant="outline"
              className="text-xs px-2 py-0.5 font-medium bg-gray-50 text-gray-600 border-gray-200"
            >
              {tone} tone
            </Badge>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default IndustryAwarenessIndicator;
