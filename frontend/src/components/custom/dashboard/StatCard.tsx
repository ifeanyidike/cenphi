import { Card, CardContent } from "../../ui/card";
import { Badge } from "../../ui/badge";
import { StatItem } from "@/types/types";

export const StatCard = ({ stat }: { stat: StatItem }) => (
  <Card className="hover:shadow-md transition-shadow">
    <CardContent className="p-6 lg:p-8">
      <div className="flex justify-between items-start mb-4">
        <div className="p-3 bg-purple-50 rounded-xl">
          <stat.icon className="h-6 w-6 text-purple-600" />
        </div>
        <Badge
          variant="outline"
          className={`${
            stat.trend === "up"
              ? "text-green-600 bg-green-50"
              : "text-red-600 bg-red-50"
          }`}
        >
          {stat.change}
        </Badge>
      </div>
      <div className="space-y-1">
        <h3 className="text-sm font-medium text-gray-500">
          {stat.title}
        </h3>
        <div className="text-2xl font-bold text-gray-900">
          {stat.value}
        </div>
      </div>
    </CardContent>
  </Card>
);