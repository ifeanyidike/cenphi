import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { itemVariants } from "./constants";
import { TrendingDown, TrendingUp } from "lucide-react";
import { StatCardSkeleton } from "./LoadingSkeleton";

interface StatCardProps {
  title: string;
  icon: React.ElementType;
  message: string;
  color: string;
  accentColor: string;
  value?: string;
  trend?: string;
  percentage?: string;
  isLoading: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  icon: Icon,
  message,
  color,
  accentColor,
  value,
  trend,
  percentage,
  isLoading,
}) => (
  <>
    {isLoading ? (
      <StatCardSkeleton />
    ) : (
      <motion.div variants={itemVariants}>
        <Card className="group border border-gray-200/60 shadow-sm hover:shadow-md hover:border-gray-300/80 transition-all duration-200 bg-white/80 backdrop-blur-sm">
          <div className={`h-0.5 ${accentColor} w-full opacity-60`} />
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-lg ${color} group-hover:shadow-sm transition-all duration-200`}
                >
                  <Icon className="h-4 w-4 text-white" />
                </div>
                <h3 className="text-sm font-medium text-gray-700 leading-tight">
                  {title}
                </h3>
              </div>

              {trend && (
                <div
                  className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                    trend === "up"
                      ? "text-emerald-600 bg-emerald-50"
                      : trend === "down"
                        ? "text-rose-600 bg-rose-50"
                        : "text-gray-600 bg-gray-50"
                  }`}
                >
                  {trend === "up" ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : trend === "down" ? (
                    <TrendingDown className="h-3 w-3" />
                  ) : null}
                  {percentage !== undefined && <span>{percentage}%</span>}
                </div>
              )}
            </div>

            <div className="space-y-1">
              {value ? (
                <div className="text-2xl font-semibold text-gray-900 tracking-tight">
                  {value}
                </div>
              ) : (
                <div className="text-sm text-gray-600 leading-relaxed">
                  {message}
                </div>
              )}

              {value && (
                <div className="text-xs text-gray-500 font-medium">
                  {message}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )}
  </>
);
