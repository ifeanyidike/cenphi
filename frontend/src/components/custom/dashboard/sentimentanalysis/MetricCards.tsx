// components/custom/dashboard/sentimentanalysis/MetricCards.tsx
import { ArrowUpIcon, ArrowDownIcon } from 'lucide-react';
import { ScrollText, StarIcon, HeartIcon, ChartBarIcon } from 'lucide-react';


// Individual Metric Card Component
function MetricCard({
  title,
  value,
  icon: Icon,
  trend,
  description,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend?: number;
  description?: string;
}) {
  return (
    <div className="bg-card rounded-lg p-4 shadow-sm border">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm text-muted-foreground mb-1">{title}</p>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-semibold">{value}</span>
            {trend && (
              <span className={`text-sm flex items-center ${
                trend > 0 ? 'text-green-500' : 'text-red-500'
              }`}>
                {trend > 0 ? (
                  <ArrowUpIcon className="w-4 h-4 mr-1" />
                ) : (
                  <ArrowDownIcon className="w-4 h-4 mr-1" />
                )}
                {Math.abs(trend)}%
              </span>
            )}
          </div>
          {description && (
            <p className="text-xs text-muted-foreground mt-2">{description}</p>
          )}
        </div>
        <div className="p-2 rounded-lg bg-primary/10">
          <Icon className="w-6 h-6 text-primary" />
        </div>
      </div>
    </div>
  );
}

// Main Metric Cards Container
export default function MetricCards({
  totalTestimonials,
  avgSentiment,
  avgRating,
  topEngagement,
}: {
  totalTestimonials: number;
  avgSentiment: number;
  avgRating: number;
  topEngagement: number;
}) {
  const formatSentiment = (score: number) => {
    const percentage = (score * 100).toFixed(1);
    return `${percentage}%`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard
        title="Total Testimonials"
        value={totalTestimonials}
        icon={ScrollText}
        description="Collected across all sources"
      />

      <MetricCard
        title="Avg. Sentiment"
        value={formatSentiment(avgSentiment)}
        icon={HeartIcon}
        trend={2.4} // Example dynamic value
        description="Positive sentiment ratio"
      />

      <MetricCard
        title="Avg. Rating"
        value={avgRating.toFixed(1)}
        icon={StarIcon}
        description="From starred testimonials"
      />

      <MetricCard
        title="Top Engagement"
        value={topEngagement.toLocaleString()}
        icon={ChartBarIcon}
        description="Highest view count"
      />
    </div>
  );
}