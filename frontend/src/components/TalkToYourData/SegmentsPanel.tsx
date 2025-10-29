import React, { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { Users, TrendingUp, TrendingDown, Minus, RefreshCw, GitCompare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { authStore } from '@/stores/authStore';
import { workspaceHub } from '@/repo/workspace_hub';

const API_BASE_URL = import.meta.env.VITE_API_URL;

interface SegmentDefinition {
  id: string;
  name: string;
  description?: string;
  color?: string;
  segment_type: string;
  cached_testimonial_count: number;
  cached_avg_sentiment?: number;
  cached_top_themes: string[];
  is_system_defined: boolean;
  is_active: boolean;
}

interface SegmentsPanelProps {
  onCompareSegments?: (segment1: string, segment2: string) => void;
}

const SegmentsPanel: React.FC<SegmentsPanelProps> = observer(({ onCompareSegments }) => {
  const [segments, setSegments] = useState<SegmentDefinition[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSegments, setSelectedSegments] = useState<string[]>([]);

  const workspace = workspaceHub.workspace;

  const fetchSegments = async () => {
    if (!workspace?.id) return;

    setLoading(true);
    try {
      const tokenInfo = await authStore.getToken();
      const response = await fetch(`${API_BASE_URL}/ai/analytics/segments/${workspace.id}`, {
        headers: {
          Authorization: `Bearer ${tokenInfo.token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSegments(data.segments || []);
      }
    } catch (error) {
      console.error('Failed to fetch segments:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (workspace?.id) {
      fetchSegments();
    }
  }, [workspace?.id]);

  const handleSegmentClick = (segmentId: string) => {
    if (selectedSegments.includes(segmentId)) {
      setSelectedSegments(selectedSegments.filter((id) => id !== segmentId));
    } else if (selectedSegments.length < 2) {
      setSelectedSegments([...selectedSegments, segmentId]);
    }
  };

  const handleCompare = () => {
    if (selectedSegments.length === 2 && onCompareSegments) {
      onCompareSegments(selectedSegments[0], selectedSegments[1]);
    }
  };

  const getSentimentIndicator = (sentiment?: number) => {
    if (!sentiment) return { icon: Minus, color: 'text-slate-400', label: 'N/A' };

    if (sentiment >= 60) {
      return { icon: TrendingUp, color: 'text-emerald-600', label: 'Positive' };
    } else if (sentiment >= 40) {
      return { icon: Minus, color: 'text-slate-600', label: 'Neutral' };
    }
    return { icon: TrendingDown, color: 'text-red-600', label: 'Negative' };
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Customer Segments</h3>
          <p className="text-xs text-slate-600 mt-0.5">Analyze different customer cohorts</p>
        </div>
        <div className="flex items-center gap-2">
          {selectedSegments.length === 2 && (
            <Button
              size="sm"
              onClick={handleCompare}
              className="bg-slate-900 text-white hover:bg-slate-800 h-8 px-3 text-xs"
            >
              <GitCompare className="h-3 w-3 mr-1.5" />
              Compare Selected
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={fetchSegments}
            disabled={loading}
            className="border-slate-300 text-slate-700 hover:bg-slate-50 h-8 px-3 text-xs"
          >
            <RefreshCw className={`h-3 w-3 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Selection hint */}
      {selectedSegments.length > 0 && (
        <div className="px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-900">
            {selectedSegments.length === 1
              ? 'Select one more segment to compare'
              : 'Click "Compare Selected" to see detailed comparison'}
          </p>
        </div>
      )}

      {/* Segments grid */}
      {loading ? (
        <div className="p-6 text-center">
          <div className="animate-pulse text-slate-500 text-xs">Loading segments...</div>
        </div>
      ) : segments.length === 0 ? (
        <Card className="p-6 text-center border-slate-200">
          <Users className="h-8 w-8 text-slate-300 mx-auto mb-2" />
          <p className="text-xs text-slate-500">No segments defined yet</p>
          <p className="text-[10px] text-slate-400 mt-1">
            Create custom segments to analyze different customer cohorts
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {segments.map((segment) => {
            const isSelected = selectedSegments.includes(segment.id);
            const sentimentIndicator = getSentimentIndicator(segment.cached_avg_sentiment);
            const SentimentIcon = sentimentIndicator.icon;

            return (
              <Card
                key={segment.id}
                className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                  isSelected
                    ? 'border-2 border-slate-900 bg-slate-50'
                    : 'border border-slate-200 hover:border-slate-300'
                }`}
                onClick={() => handleSegmentClick(segment.id)}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: segment.color || '#64748b' }}
                      />
                      <h4 className="text-xs font-semibold text-slate-900">{segment.name}</h4>
                    </div>
                    {segment.description && (
                      <p className="text-[10px] text-slate-500 line-clamp-2">{segment.description}</p>
                    )}
                  </div>
                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-slate-900 flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-[10px] font-bold">
                        {selectedSegments.indexOf(segment.id) + 1}
                      </span>
                    </div>
                  )}
                </div>

                {/* Metrics */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-600">Testimonials</span>
                    <span className="text-xs font-semibold text-slate-900">
                      {segment.cached_testimonial_count}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-600">Sentiment</span>
                    <div className="flex items-center gap-1">
                      <SentimentIcon className={`h-3 w-3 ${sentimentIndicator.color}`} />
                      <span className={`text-xs font-medium ${sentimentIndicator.color}`}>
                        {sentimentIndicator.label}
                      </span>
                    </div>
                  </div>

                  {segment.cached_top_themes && segment.cached_top_themes.length > 0 && (
                    <div className="pt-2 border-t border-slate-100">
                      <span className="text-[10px] text-slate-600 block mb-1">Top themes</span>
                      <div className="flex flex-wrap gap-1">
                        {segment.cached_top_themes.slice(0, 3).map((theme, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px]"
                          >
                            {theme}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* System segment badge */}
                {segment.is_system_defined && (
                  <div className="mt-3 pt-2 border-t border-slate-100">
                    <span className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                      System Segment
                    </span>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
});

export default SegmentsPanel;
