import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { itemVariants } from "./constants";
import { Sparkles, TrendingDown, TrendingUp } from "lucide-react";
import { StatCardSkeleton } from "./LoadingSkeleton";

interface StepItemProps {
  label: string;
  description: string;
  icon: React.ElementType;
  status: "pending" | "completed";
  number: number;
}

export const StepItem: React.FC<StepItemProps> = ({
  label,
  description,
  icon: Icon,
  status,
  number,
}) => (
  <motion.div
    variants={itemVariants}
    className="flex items-start space-x-4 p-5 border border-gray-100 rounded-xl hover:border-gray-200 hover:shadow-sm transition-all duration-200"
  >
    <div className="relative">
      <div
        className={`flex items-center justify-center w-10 h-10 rounded-xl ${
          status === "pending" ? "bg-gray-100" : "bg-green-500"
        } transition-colors duration-300`}
      >
        <span className="text-sm font-semibold text-gray-500">{number}</span>
      </div>
      {number < 3 && (
        <div className="absolute left-1/2 top-full h-8 w-px bg-gray-200 -translate-x-1/2"></div>
      )}
    </div>
    <div className="flex-1">
      <p className="font-semibold text-gray-900 flex items-center gap-2">
        {label}
        <Icon className="h-4 w-4 text-gray-400" />
      </p>
      <p className="text-sm text-gray-500 mt-1">{description}</p>
    </div>
  </motion.div>
);

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
        <Card className="overflow-hidden group border-0 shadow-md hover:shadow-xl transition-all duration-300">
          <div className={`h-1 ${accentColor} w-full`} />
          <CardContent className="p-6 lg:p-6">
            <div className="flex justify-between items-start mb-4">
              <div
                className={`p-3 rounded-xl ${color} group-hover:scale-110 transition-transform duration-300`}
              >
                <Icon className="h-6 w-6 text-white" />
              </div>
              <Sparkles className="h-4 w-4 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-gray-700">{title}</h3>

              {value ? (
                <div className="flex items-end justify-between">
                  <div className="text-2xl font-bold">{value}</div>
                  {trend && (
                    <div
                      className={`flex items-center space-x-1 ${
                        trend === "up"
                          ? "text-emerald-500"
                          : trend === "down"
                          ? "text-rose-500"
                          : "text-gray-500"
                      }`}
                    >
                      {trend === "up" ? (
                        <TrendingUp className="h-4 w-4" />
                      ) : trend === "down" ? (
                        <TrendingDown className="h-4 w-4" />
                      ) : null}
                      {percentage !== undefined && (
                        <span className="text-sm font-medium">
                          {percentage}%
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-sm text-gray-500">{message}</div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )}
  </>
);
