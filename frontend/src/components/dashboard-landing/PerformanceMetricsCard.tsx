// PerformanceMetricsCard.tsx
import { ArrowUpRight, Zap, Heart, CheckCircle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { MetricItem } from "@/types/types";

export const PerformanceMetricsCard = () => {
  const metrics: MetricItem[] = [
    {
      label: "AI Response Rate",
      value: "92%",
      icon: Zap,
      trend: "up",
    },
    {
      label: "Sentiment Score",
      value: "8.9",
      icon: Heart,
      trend: "up",
    },
    {
      label: "Translation Accuracy",
      value: "97%",
      icon: CheckCircle,
      trend: "up",
    },
  ];

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="p-6">
        <CardTitle className="text-lg font-semibold">
          Performance Metrics
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          {metrics.map((metric) => (
            <div
              key={metric.label}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-50 rounded-lg">
                  <metric.icon className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">{metric.label}</p>
                  <p className="font-semibold text-gray-900">{metric.value}</p>
                </div>
              </div>
              <ArrowUpRight
                className={`h-5 w-5 ${
                  metric.trend === "up"
                    ? "text-green-500"
                    : "text-red-500 transform rotate-180"
                }`}
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
