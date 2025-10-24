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
        <Card className="border border-slate-200 hover:border-slate-300 transition-colors bg-white">
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded bg-slate-100 flex items-center justify-center">
                  <Icon className="h-3.5 w-3.5 text-slate-600" />
                </div>
                <h3 className="text-xs font-medium text-slate-900">{title}</h3>
              </div>

              {trend && (
                <div
                  className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-medium ${
                    trend === "up"
                      ? "text-emerald-600 bg-emerald-50"
                      : trend === "down"
                        ? "text-rose-600 bg-rose-50"
                        : "text-slate-600 bg-slate-50"
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

            <div className="space-y-0.5">
              {value ? (
                <div className="text-base font-semibold text-slate-900">
                  {value}
                </div>
              ) : (
                <div className="text-xs text-slate-600">{message}</div>
              )}

              {value && (
                <div className="text-xs text-slate-500 font-medium">
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
