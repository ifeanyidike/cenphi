import { MessageSquare, Star, ArrowUpRight, Users } from "lucide-react";
import { StatCard } from "./StatCard";
import { StatItem } from "@/types/types";

export const StatsOverview = ({ stats }: { stats: Record<string, string | number> }) => {
  
  const statItems: StatItem[] = [
    {
      title: "Total Reviews",
      value: stats.totalTestimonials,
      icon: MessageSquare,
      change: "+12.5%",
      trend: "up",
    },
    {
      title: "Average Rating",
      value: stats.averageRating,
      icon: Star,
      change: "+0.2",
      trend: "up",
    },
    {
      title: "Conversion Rate",
      value: stats.conversionRate,
      icon: ArrowUpRight,
      change: "+2.4%",
      trend: "up",
    },
    {
      title: "Total Views",
      value: stats.totalViews,
      icon: Users,
      change: "+18.2%",
      trend: "up",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
      {statItems.map((stat, i) => (
        <StatCard key={i} stat={stat} />
      ))}
    </div>
  );
};