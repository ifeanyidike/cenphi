import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface FeatureHeatmapChartProps {
  data: {
    features: string[];
    mentions: number[];
    sentiment: string[];
  } | null;
  loading?: boolean;
}

const FeatureHeatmapChart: React.FC<FeatureHeatmapChartProps> = ({ data, loading }) => {
  if (loading) {
    return (
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-slate-900">Feature Mentions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center">
            <div className="animate-pulse text-slate-500 text-xs">Loading chart data...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || !data.features || data.features.length === 0) {
    return (
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-slate-900">Feature Mentions</CardTitle>
          <CardDescription className="text-xs text-slate-600 mt-1">
            Most talked about features and their sentiment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center">
            <div className="text-slate-500 text-xs">No feature data available</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Transform data for recharts
  const chartData = data.features.map((feature, index) => ({
    feature: feature.charAt(0).toUpperCase() + feature.slice(1),
    mentions: data.mentions[index],
    sentiment: data.sentiment[index],
  }));

  // Sort by mentions
  chartData.sort((a, b) => b.mentions - a.mentions);

  const getBarColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return '#10b981';
      case 'negative':
        return '#ef4444';
      default:
        return '#64748b';
    }
  };

  return (
    <Card className="border-slate-200">
      <CardHeader>
        <CardTitle className="text-sm font-semibold text-slate-900">Feature Mentions</CardTitle>
        <CardDescription className="text-xs text-slate-600 mt-1">
          Most talked about features and their sentiment
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} />
            <YAxis
              dataKey="feature"
              type="category"
              tick={{ fontSize: 11, fill: '#64748b' }}
              width={80}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '12px',
              }}
              formatter={(value: any, _name: string, props: any) => [
                `${value} mentions`,
                `Sentiment: ${props.payload.sentiment}`,
              ]}
            />
            <Bar dataKey="mentions" radius={[0, 4, 4, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(entry.sentiment)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 mt-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-emerald-500"></div>
            <span className="text-slate-600">Positive</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-slate-500"></div>
            <span className="text-slate-600">Neutral</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-red-500"></div>
            <span className="text-slate-600">Negative</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FeatureHeatmapChart;
