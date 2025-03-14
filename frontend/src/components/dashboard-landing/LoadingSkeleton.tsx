import { Skeleton } from "../ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { itemVariants } from "./constants";

// Loading skeleton component
const LoadingSkeleton = () => (
  <div className="space-y-4">
    {Array(3)
      .fill(null)
      .map((_, i) => (
        <div
          key={i}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm"
        >
          <div className="flex items-center space-x-4 mb-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
      ))}
  </div>
);

export default LoadingSkeleton;

export const StatCardSkeleton: React.FC = () => (
  <motion.div variants={itemVariants}>
    <Card className="overflow-hidden border-0 shadow-md animate-pulse">
      {/* Accent bar skeleton */}
      <div className="h-1 bg-gray-200 w-full" />
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          {/* Icon skeleton */}
          <div className="p-3 rounded-xl bg-gray-200 w-10 h-10" />
          {/* Sparkles icon skeleton */}
          <div className="h-4 w-4 bg-gray-200 rounded-full" />
        </div>
        <div className="space-y-2">
          {/* Title skeleton */}
          <div className="h-4 w-1/2 bg-gray-200 rounded" />
          {/* Value skeleton */}
          <div className="h-6 w-3/4 bg-gray-200 rounded" />
        </div>
      </CardContent>
    </Card>
  </motion.div>
);
