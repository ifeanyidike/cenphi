import React from "react";
import { motion } from "framer-motion";
import { AlertCircle, CheckCircle, AlertTriangle, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { observer } from "mobx-react-lite";
interface BrollDurationIndicatorProps {
  currentDuration: number; // Total B-roll duration in seconds
  videoDuration: number; // Estimated video duration in seconds
  maxPercentage?: number; // Maximum recommended percentage (default: 30%)
}

const BrollDurationIndicator: React.FC<BrollDurationIndicatorProps> = ({
  currentDuration,
  videoDuration,
  maxPercentage = 0.3,
}) => {
  const percentage =
    videoDuration > 0 ? (currentDuration / videoDuration) * 100 : 0;
  const recommendedMax = videoDuration * maxPercentage;

  // Determine status
  let status: "good" | "warning" | "caution" | "danger";
  let icon: React.ReactNode;
  let statusColor: string;
  let progressColor: string;
  let message: string;

  if (percentage < maxPercentage * 100) {
    status = "good";
    icon = <CheckCircle className="h-4 w-4" />;
    statusColor = "text-green-600 dark:text-green-400";
    progressColor = "bg-green-500";
    message = "Good balance";
  } else if (percentage < 40) {
    status = "warning";
    icon = <Info className="h-4 w-4" />;
    statusColor = "text-yellow-600 dark:text-yellow-400";
    progressColor = "bg-yellow-500";
    message = "Approaching limit";
  } else if (percentage < 50) {
    status = "caution";
    icon = <AlertTriangle className="h-4 w-4" />;
    statusColor = "text-orange-600 dark:text-orange-400";
    progressColor = "bg-orange-500";
    message = "May overwhelm content";
  } else {
    status = "danger";
    icon = <AlertCircle className="h-4 w-4" />;
    statusColor = "text-red-600 dark:text-red-400";
    progressColor = "bg-red-500";
    message = "Excessive B-roll";
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
            B-roll Duration
          </span>
          <Badge
            variant="outline"
            className={`text-xs flex items-center gap-1 ${statusColor}`}
          >
            {icon}
            {message}
          </Badge>
        </div>
        <div className="text-xs font-mono text-gray-600 dark:text-gray-400">
          {formatDuration(currentDuration)} / {formatDuration(videoDuration)}{" "}
          <span className={statusColor}>({percentage.toFixed(0)}%)</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative">
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(percentage, 100)}%` }}
            transition={{ duration: 0.5 }}
            className={`h-full ${progressColor}`}
          />
        </div>

        {/* Recommended limit marker */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-gray-400 dark:bg-gray-500"
          style={{ left: `${maxPercentage * 100}%` }}
        >
          <div className="absolute -top-1 left-1/2 -translate-x-1/2">
            <div className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500" />
          </div>
        </div>
      </div>

      {/* Recommendation */}
      <div className="text-xs text-gray-500 dark:text-gray-400 flex items-start gap-1.5">
        <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
        <span>
          Recommended: <strong>≤ {formatDuration(recommendedMax)}</strong> (
          {maxPercentage * 100}% of video) for optimal balance
        </span>
      </div>

      {/* Suggestions when over limit */}
      {status === "caution" || status === "danger" ? (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg"
        >
          <p className="text-xs text-orange-800 dark:text-orange-200 font-medium mb-1">
            💡 Suggestions:
          </p>
          <ul className="text-xs text-orange-700 dark:text-orange-300 space-y-1 list-disc list-inside">
            <li>Reduce individual clip durations</li>
            <li>Remove some B-roll clips</li>
            <li>Use B-roll sparingly for maximum impact</li>
          </ul>
        </motion.div>
      ) : null}
    </motion.div>
  );
};

export default observer(BrollDurationIndicator);
