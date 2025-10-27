import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';

interface ComparativeAnalysisChartProps {
  data: {
    comparison: {
      sentiment: {
        primary: { positive: number; neutral: number; negative: number };
        comparison: { positive: number; neutral: number; negative: number };
        change: string;
      };
      volume: {
        primary: number;
        comparison: number;
        change: string;
        change_pct: number;
      };
      top_themes?: {
        new_themes?: string[];
        declining_themes?: string[];
      };
      nps: {
        primary: number;
        comparison: number;
        change: string;
      };
    };
    insights?: string[];
  } | null;
  loading?: boolean;
}

const ComparativeAnalysisChart: React.FC<ComparativeAnalysisChartProps> = ({ data, loading }) => {
  if (loading) {
    return (
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-slate-900">Period Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center">
            <div className="animate-pulse text-slate-500 text-xs">Loading comparison...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || !data.comparison) {
    return (
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-slate-900">Period Comparison</CardTitle>
          <CardDescription className="text-xs text-slate-600 mt-1">
            Compare metrics across two time periods
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center">
            <div className="text-slate-500 text-xs">No comparison data available</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { sentiment, volume, top_themes, nps } = data.comparison;

  // Calculate change indicators
  const sentimentChange = sentiment.primary.positive - sentiment.comparison.positive;
  const volumeChange = volume.change_pct;
  const npsChange = nps.primary - nps.comparison;

  const getChangeIcon = (value: number) => {
    if (value > 0) return <ArrowUp className="h-3 w-3 text-emerald-600" />;
    if (value < 0) return <ArrowDown className="h-3 w-3 text-red-600" />;
    return <Minus className="h-3 w-3 text-slate-500" />;
  };

  const getChangeColor = (value: number) => {
    if (value > 0) return 'text-emerald-600';
    if (value < 0) return 'text-red-600';
    return 'text-slate-600';
  };

  return (
    <Card className="border-slate-200">
      <CardHeader>
        <CardTitle className="text-sm font-semibold text-slate-900">Period Comparison</CardTitle>
        <CardDescription className="text-xs text-slate-600 mt-1">
          Compare metrics across two time periods
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Sentiment Comparison */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-slate-700">Sentiment</h4>
            <div className={`flex items-center gap-1 ${getChangeColor(sentimentChange)}`}>
              {getChangeIcon(sentimentChange)}
              <span className="text-xs font-medium">{Math.abs(sentimentChange).toFixed(1)}%</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <div className="text-[10px] uppercase tracking-wide text-slate-500 mb-2">Primary Period</div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-600">Positive</span>
                  <span className="font-medium text-emerald-600">{sentiment.primary.positive.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-600">Neutral</span>
                  <span className="font-medium text-slate-600">{sentiment.primary.neutral.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-600">Negative</span>
                  <span className="font-medium text-red-600">{sentiment.primary.negative.toFixed(1)}%</span>
                </div>
              </div>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <div className="text-[10px] uppercase tracking-wide text-slate-500 mb-2">Comparison Period</div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-600">Positive</span>
                  <span className="font-medium text-emerald-600">{sentiment.comparison.positive.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-600">Neutral</span>
                  <span className="font-medium text-slate-600">{sentiment.comparison.neutral.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-600">Negative</span>
                  <span className="font-medium text-red-600">{sentiment.comparison.negative.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Volume and NPS */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-semibold text-slate-700">Volume</h4>
              <div className={`flex items-center gap-1 ${getChangeColor(volumeChange)}`}>
                {getChangeIcon(volumeChange)}
                <span className="text-xs font-medium">{Math.abs(volumeChange).toFixed(1)}%</span>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-600">Primary</span>
                <span className="font-semibold text-slate-900">{volume.primary}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-600">Comparison</span>
                <span className="font-medium text-slate-600">{volume.comparison}</span>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-semibold text-slate-700">NPS Score</h4>
              <div className={`flex items-center gap-1 ${getChangeColor(npsChange)}`}>
                {getChangeIcon(npsChange)}
                <span className="text-xs font-medium">{Math.abs(npsChange).toFixed(1)}</span>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-600">Primary</span>
                <span className="font-semibold text-slate-900">{nps.primary.toFixed(1)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-600">Comparison</span>
                <span className="font-medium text-slate-600">{nps.comparison.toFixed(1)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Themes */}
        {top_themes && (((top_themes.new_themes?.length ?? 0) > 0) || ((top_themes.declining_themes?.length ?? 0) > 0)) && (
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-slate-700">Theme Changes</h4>
            <div className="grid grid-cols-2 gap-3">
              {top_themes.new_themes && top_themes.new_themes.length > 0 && (
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                  <div className="text-[10px] uppercase tracking-wide text-emerald-700 mb-2">
                    New Themes
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {top_themes.new_themes.map((theme, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 rounded-md bg-emerald-100 text-emerald-700 text-[10px] font-medium"
                      >
                        {theme}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {top_themes.declining_themes && top_themes.declining_themes.length > 0 && (
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="text-[10px] uppercase tracking-wide text-slate-600 mb-2">
                    Declining Themes
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {top_themes.declining_themes.map((theme, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 rounded-md bg-slate-100 text-slate-600 text-[10px] font-medium"
                      >
                        {theme}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Insights */}
        {data.insights && data.insights.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-slate-700">Key Insights</h4>
            <div className="space-y-2">
              {data.insights.map((insight, idx) => (
                <div key={idx} className="flex items-start gap-2 p-2 rounded-md bg-blue-50 border border-blue-200">
                  <div className="w-1 h-1 rounded-full bg-blue-500 mt-1.5"></div>
                  <p className="text-xs text-blue-900 leading-relaxed">{insight}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ComparativeAnalysisChart;
