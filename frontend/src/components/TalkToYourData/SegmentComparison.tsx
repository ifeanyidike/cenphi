import React, { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { ArrowUp, ArrowDown, Minus, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { authStore } from '@/stores/authStore';

const API_BASE_URL = import.meta.env.VITE_API_URL;

interface SentimentStats {
  positive: number;
  neutral: number;
  negative: number;
}

interface SegmentAnalysis {
  segment_id: string;
  segment_name: string;
  testimonial_count: number;
  sentiment_stats: SentimentStats;
  nps_score: number;
  top_themes: string[];
}

interface ComparisonResult {
  segment1: SegmentAnalysis;
  segment2: SegmentAnalysis;
  insights: string[];
}

interface SegmentComparisonProps {
  segmentId1: string;
  segmentId2: string;
  onClose: () => void;
}

const SegmentComparison: React.FC<SegmentComparisonProps> = observer(
  ({ segmentId1, segmentId2, onClose }) => {
    const [comparison, setComparison] = useState<ComparisonResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchComparison = async () => {
      setLoading(true);
      setError(null);

      try {
        const tokenInfo = await authStore.getToken();
        const response = await fetch(`${API_BASE_URL}/ai/analytics/segments/compare`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${tokenInfo.token}`,
          },
          body: JSON.stringify({
            segment_id_1: segmentId1,
            segment_id_2: segmentId2,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setComparison(data);
        } else {
          setError('Failed to load comparison');
        }
      } catch (err) {
        console.error('Failed to compare segments:', err);
        setError('Failed to load comparison');
      } finally {
        setLoading(false);
      }
    };

    useEffect(() => {
      fetchComparison();
    }, [segmentId1, segmentId2]);

    const getChangeIndicator = (value: number) => {
      if (value > 0) return { icon: ArrowUp, color: 'text-emerald-600', sign: '+' };
      if (value < 0) return { icon: ArrowDown, color: 'text-red-600', sign: '' };
      return { icon: Minus, color: 'text-slate-500', sign: '' };
    };

    if (loading) {
      return (
        <Card className="p-6 border-slate-200">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 text-slate-400 animate-spin" />
            <span className="ml-2 text-sm text-slate-500">Comparing segments...</span>
          </div>
        </Card>
      );
    }

    if (error || !comparison) {
      return (
        <Card className="p-6 border-red-200 bg-red-50">
          <p className="text-sm text-red-600">{error || 'Failed to load comparison'}</p>
        </Card>
      );
    }

    const { segment1, segment2 } = comparison;
    const sentimentDiff = segment1.sentiment_stats.positive - segment2.sentiment_stats.positive;
    const npsDiff = segment1.nps_score - segment2.nps_score;
    const volumeDiff = segment1.testimonial_count - segment2.testimonial_count;

    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900">Segment Comparison</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-6 w-6 p-0 hover:bg-slate-100"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Segment names */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-3 border-slate-200 bg-slate-50">
            <h4 className="text-xs font-semibold text-slate-900">{segment1.segment_name}</h4>
            <p className="text-[10px] text-slate-600 mt-0.5">
              {segment1.testimonial_count} testimonials
            </p>
          </Card>
          <Card className="p-3 border-slate-200 bg-slate-50">
            <h4 className="text-xs font-semibold text-slate-900">{segment2.segment_name}</h4>
            <p className="text-[10px] text-slate-600 mt-0.5">
              {segment2.testimonial_count} testimonials
            </p>
          </Card>
        </div>

        {/* Metrics comparison */}
        <Card className="border-slate-200">
          <div className="p-4 space-y-4">
            {/* Sentiment */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h5 className="text-xs font-semibold text-slate-700">Sentiment</h5>
                {(() => {
                  const indicator = getChangeIndicator(sentimentDiff);
                  const Icon = indicator.icon;
                  return (
                    <div className={`flex items-center gap-1 ${indicator.color}`}>
                      <Icon className="h-3 w-3" />
                      <span className="text-xs font-medium">
                        {indicator.sign}
                        {Math.abs(sentimentDiff).toFixed(1)}%
                      </span>
                    </div>
                  );
                })()}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="text-[10px] text-slate-500 mb-1">Positive</div>
                  <div className="text-sm font-semibold text-emerald-600">
                    {segment1.sentiment_stats.positive.toFixed(1)}%
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="text-[10px] text-slate-500 mb-1">Positive</div>
                  <div className="text-sm font-semibold text-emerald-600">
                    {segment2.sentiment_stats.positive.toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>

            {/* NPS */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h5 className="text-xs font-semibold text-slate-700">NPS Score</h5>
                {(() => {
                  const indicator = getChangeIndicator(npsDiff);
                  const Icon = indicator.icon;
                  return (
                    <div className={`flex items-center gap-1 ${indicator.color}`}>
                      <Icon className="h-3 w-3" />
                      <span className="text-xs font-medium">
                        {indicator.sign}
                        {Math.abs(npsDiff).toFixed(1)}
                      </span>
                    </div>
                  );
                })()}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="text-sm font-semibold text-slate-900">
                    {segment1.nps_score.toFixed(1)}
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="text-sm font-semibold text-slate-900">
                    {segment2.nps_score.toFixed(1)}
                  </div>
                </div>
              </div>
            </div>

            {/* Volume */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h5 className="text-xs font-semibold text-slate-700">Volume</h5>
                {(() => {
                  const indicator = getChangeIndicator(volumeDiff);
                  const Icon = indicator.icon;
                  return (
                    <div className={`flex items-center gap-1 ${indicator.color}`}>
                      <Icon className="h-3 w-3" />
                      <span className="text-xs font-medium">
                        {indicator.sign}
                        {Math.abs(volumeDiff)}
                      </span>
                    </div>
                  );
                })()}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="text-sm font-semibold text-slate-900">
                    {segment1.testimonial_count}
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="text-sm font-semibold text-slate-900">
                    {segment2.testimonial_count}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Top themes */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-3 border-slate-200">
            <h5 className="text-xs font-semibold text-slate-700 mb-2">Top Themes</h5>
            <div className="flex flex-wrap gap-1">
              {segment1.top_themes.slice(0, 5).map((theme, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px]"
                >
                  {theme}
                </span>
              ))}
            </div>
          </Card>
          <Card className="p-3 border-slate-200">
            <h5 className="text-xs font-semibold text-slate-700 mb-2">Top Themes</h5>
            <div className="flex flex-wrap gap-1">
              {segment2.top_themes.slice(0, 5).map((theme, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px]"
                >
                  {theme}
                </span>
              ))}
            </div>
          </Card>
        </div>

        {/* Insights */}
        {comparison.insights.length > 0 && (
          <Card className="p-4 border-blue-200 bg-blue-50">
            <h5 className="text-xs font-semibold text-blue-900 mb-2">Key Insights</h5>
            <div className="space-y-2">
              {comparison.insights.map((insight, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <div className="w-1 h-1 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                  <p className="text-xs text-blue-900">{insight}</p>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    );
  }
);

export default SegmentComparison;
