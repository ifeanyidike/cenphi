import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface SentimentTimelineChartProps {
  data: {
    dates: string[];
    sentiment: {
      positive: number[];
      neutral: number[];
      negative: number[];
    };
    nps_score?: number[];
    trend: string;
    trend_pct: number;
  } | null;
  loading?: boolean;
}

const SentimentTimelineChart: React.FC<SentimentTimelineChartProps> = ({ data, loading }) => {
  if (loading) {
    return (
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-slate-900">Sentiment Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center">
            <div className="animate-pulse text-slate-500 text-xs">Loading chart data...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || !data.dates || data.dates.length === 0) {
    return (
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-slate-900">Sentiment Timeline</CardTitle>
          <CardDescription className="text-xs text-slate-600 mt-1">
            Track sentiment trends over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center">
            <div className="text-slate-500 text-xs">No sentiment data available</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Transform data for recharts
  const chartData = data.dates.map((date, index) => ({
    date,
    positive: data.sentiment.positive[index] || 0,
    neutral: data.sentiment.neutral[index] || 0,
    negative: data.sentiment.negative[index] || 0,
    nps: data.nps_score ? data.nps_score[index] : undefined,
  }));

  // Trend icon
  const TrendIcon = data.trend === 'improving' ? TrendingUp : data.trend === 'declining' ? TrendingDown : Minus;
  const trendColor = data.trend === 'improving' ? 'text-emerald-600' : data.trend === 'declining' ? 'text-red-600' : 'text-slate-600';

  return (
    <Card className="border-slate-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm font-semibold text-slate-900">Sentiment Timeline</CardTitle>
            <CardDescription className="text-xs text-slate-600 mt-1">
              Track sentiment trends over time
            </CardDescription>
          </div>
          <div className={`flex items-center gap-1 px-2 py-1 rounded-md bg-slate-50 ${trendColor}`}>
            <TrendIcon className="h-3 w-3" />
            <span className="text-xs font-medium">
              {data.trend_pct !== 0 ? `${data.trend_pct > 0 ? '+' : ''}${data.trend_pct.toFixed(1)}%` : 'Stable'}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={320}>
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorPositive" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorNeutral" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#64748b" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#64748b" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorNegative" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: '#64748b' }}
              tickLine={{ stroke: '#e2e8f0' }}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#64748b' }}
              tickLine={{ stroke: '#e2e8f0' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '12px',
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: '11px' }}
              iconSize={10}
            />
            <Area
              type="monotone"
              dataKey="positive"
              stackId="1"
              stroke="#10b981"
              fill="url(#colorPositive)"
              strokeWidth={2}
              name="Positive"
            />
            <Area
              type="monotone"
              dataKey="neutral"
              stackId="1"
              stroke="#64748b"
              fill="url(#colorNeutral)"
              strokeWidth={2}
              name="Neutral"
            />
            <Area
              type="monotone"
              dataKey="negative"
              stackId="1"
              stroke="#ef4444"
              fill="url(#colorNegative)"
              strokeWidth={2}
              name="Negative"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default SentimentTimelineChart;
