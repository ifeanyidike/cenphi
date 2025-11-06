import React, { useState, useEffect } from "react";
import { observer } from "mobx-react-lite";
import { Calendar, Download, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SentimentTimelineChart from "./charts/SentimentTimelineChart";
import FeatureHeatmapChart from "./charts/FeatureHeatmapChart";
import WordCloudChart from "./charts/WordCloudChart";
import ComparativeAnalysisChart from "./charts/ComparativeAnalysisChart";
import SegmentsPanel from "./SegmentsPanel";
import SegmentComparison from "./SegmentComparison";
import AdvancedFilters, { AdvancedFiltersType } from "./AdvancedFilters";
import { workspaceHub } from "@/repo/workspace_hub";
import { authStore } from "@/stores/authStore";

const API_BASE_URL = import.meta.env.VITE_API_URL;

interface AnalyticsDashboardProps {
  dateRange: {
    from: Date | null;
    to: Date | null;
  };
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = observer(
  ({ dateRange }) => {
    const [activeTab, setActiveTab] = useState("overview");
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState<AdvancedFiltersType>({});

    // Analytics data states
    const [sentimentData, setSentimentData] = useState<any>(null);
    const [featureData, setFeatureData] = useState<any>(null);
    const [wordCloudData, setWordCloudData] = useState<any>(null);
    const [comparisonData, setComparisonData] = useState<any>(null);

    const [loadingSentiment, setLoadingSentiment] = useState(false);
    const [loadingFeatures, setLoadingFeatures] = useState(false);
    const [loadingWordCloud, setLoadingWordCloud] = useState(false);
    const [loadingComparison, setLoadingComparison] = useState(false);

    // Segment comparison state
    const [showSegmentComparison, setShowSegmentComparison] = useState(false);
    const [compareSegmentIds, setCompareSegmentIds] = useState<
      [string, string] | null
    >(null);

    const workspace = workspaceHub.workspace;

    // Fetch sentiment timeline
    const fetchSentimentTimeline = async () => {
      if (!workspace?.id) return;

      setLoadingSentiment(true);
      try {
        const tokenInfo = await authStore.getToken();
        const params = new URLSearchParams({
          workspace_id: workspace.id,
          granularity: "day",
        });

        if (dateRange.from) {
          params.append("from", dateRange.from.toISOString());
        }
        if (dateRange.to) {
          params.append("to", dateRange.to.toISOString());
        }

        // Add filters
        if (filters.rating) {
          params.append("min_rating", filters.rating.min.toString());
          params.append("max_rating", filters.rating.max.toString());
        }
        if (filters.testimonialType && filters.testimonialType.length > 0) {
          filters.testimonialType.forEach((type) =>
            params.append("type", type)
          );
        }
        if (filters.sentiment && filters.sentiment.length > 0) {
          filters.sentiment.forEach((s) => params.append("sentiment", s));
        }
        if (filters.collectionMethod && filters.collectionMethod.length > 0) {
          filters.collectionMethod.forEach((method) =>
            params.append("collection_method", method)
          );
        }
        if (filters.companies && filters.companies.length > 0) {
          filters.companies.forEach((company) =>
            params.append("company", company)
          );
        }
        if (filters.tags && filters.tags.length > 0) {
          filters.tags.forEach((tag) => params.append("tag", tag));
        }

        const response = await fetch(
          `${API_BASE_URL}/ai/analytics/sentiment-timeline?${params}`,
          {
            headers: {
              Authorization: `Bearer ${tokenInfo.token}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          console.log("sentiment timeline data", data);
          setSentimentData(data);
        }
      } catch (error) {
        console.error("Failed to fetch sentiment timeline:", error);
      } finally {
        setLoadingSentiment(false);
      }
    };

    // Fetch feature heatmap
    const fetchFeatureHeatmap = async () => {
      if (!workspace?.id) return;

      setLoadingFeatures(true);
      try {
        const tokenInfo = await authStore.getToken();
        const params = new URLSearchParams({
          workspace_id: workspace.id,
        });

        if (dateRange.from) {
          params.append("from", dateRange.from.toISOString());
        }
        if (dateRange.to) {
          params.append("to", dateRange.to.toISOString());
        }

        // Add filters
        if (filters.rating) {
          params.append("min_rating", filters.rating.min.toString());
          params.append("max_rating", filters.rating.max.toString());
        }
        if (filters.testimonialType && filters.testimonialType.length > 0) {
          filters.testimonialType.forEach((type) =>
            params.append("type", type)
          );
        }
        if (filters.sentiment && filters.sentiment.length > 0) {
          filters.sentiment.forEach((s) => params.append("sentiment", s));
        }
        if (filters.collectionMethod && filters.collectionMethod.length > 0) {
          filters.collectionMethod.forEach((method) =>
            params.append("collection_method", method)
          );
        }
        if (filters.companies && filters.companies.length > 0) {
          filters.companies.forEach((company) =>
            params.append("company", company)
          );
        }
        if (filters.tags && filters.tags.length > 0) {
          filters.tags.forEach((tag) => params.append("tag", tag));
        }

        const response = await fetch(
          `${API_BASE_URL}/ai/analytics/feature-heatmap?${params}`,
          {
            headers: {
              Authorization: `Bearer ${tokenInfo.token}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          setFeatureData(data);
        }
      } catch (error) {
        console.error("Failed to fetch feature heatmap:", error);
      } finally {
        setLoadingFeatures(false);
      }
    };

    // Fetch word cloud
    const fetchWordCloud = async () => {
      if (!workspace?.id) return;

      setLoadingWordCloud(true);
      try {
        const tokenInfo = await authStore.getToken();
        const params = new URLSearchParams({
          workspace_id: workspace.id,
        });

        if (dateRange.from) {
          params.append("from", dateRange.from.toISOString());
        }
        if (dateRange.to) {
          params.append("to", dateRange.to.toISOString());
        }

        // Add filters
        if (filters.rating) {
          params.append("min_rating", filters.rating.min.toString());
          params.append("max_rating", filters.rating.max.toString());
        }
        if (filters.testimonialType && filters.testimonialType.length > 0) {
          filters.testimonialType.forEach((type) =>
            params.append("type", type)
          );
        }
        if (filters.sentiment && filters.sentiment.length > 0) {
          filters.sentiment.forEach((s) => params.append("sentiment", s));
        }
        if (filters.collectionMethod && filters.collectionMethod.length > 0) {
          filters.collectionMethod.forEach((method) =>
            params.append("collection_method", method)
          );
        }
        if (filters.companies && filters.companies.length > 0) {
          filters.companies.forEach((company) =>
            params.append("company", company)
          );
        }
        if (filters.tags && filters.tags.length > 0) {
          filters.tags.forEach((tag) => params.append("tag", tag));
        }

        const response = await fetch(
          `${API_BASE_URL}/ai/analytics/word-cloud?${params}`,
          {
            headers: {
              Authorization: `Bearer ${tokenInfo.token}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          setWordCloudData(data);
        }
      } catch (error) {
        console.error("Failed to fetch word cloud:", error);
      } finally {
        setLoadingWordCloud(false);
      }
    };

    // Fetch comparative analysis
    const fetchComparison = async () => {
      if (!workspace?.id || !dateRange.from || !dateRange.to) return;

      setLoadingComparison(true);
      try {
        const tokenInfo = await authStore.getToken();

        // Calculate comparison period (same duration before the primary period)
        const primaryDuration =
          dateRange.to.getTime() - dateRange.from.getTime();
        const comparisonTo = new Date(dateRange.from.getTime());
        const comparisonFrom = new Date(
          comparisonTo.getTime() - primaryDuration
        );

        const requestBody: any = {
          workspace_id: workspace.id,
          primary_from: dateRange.from.toISOString(),
          primary_to: dateRange.to.toISOString(),
          comparison_from: comparisonFrom.toISOString(),
          comparison_to: comparisonTo.toISOString(),
        };

        // Add filters to request body
        if (filters.rating) {
          requestBody.min_rating = filters.rating.min;
          requestBody.max_rating = filters.rating.max;
        }
        if (filters.testimonialType && filters.testimonialType.length > 0) {
          requestBody.types = filters.testimonialType;
        }
        if (filters.sentiment && filters.sentiment.length > 0) {
          requestBody.sentiments = filters.sentiment;
        }
        if (filters.collectionMethod && filters.collectionMethod.length > 0) {
          requestBody.collection_methods = filters.collectionMethod;
        }
        if (filters.companies && filters.companies.length > 0) {
          requestBody.companies = filters.companies;
        }
        if (filters.tags && filters.tags.length > 0) {
          requestBody.tags = filters.tags;
        }

        const response = await fetch(
          `${API_BASE_URL}/ai/analytics/compare-periods`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${tokenInfo.token}`,
            },
            body: JSON.stringify(requestBody),
          }
        );

        if (response.ok) {
          const data = await response.json();
          setComparisonData(data);
        }
      } catch (error) {
        console.error("Failed to fetch comparison:", error);
      } finally {
        setLoadingComparison(false);
      }
    };

    // Fetch all analytics data
    const fetchAllAnalytics = async () => {
      setLoading(true);
      await Promise.all([
        fetchSentimentTimeline(),
        fetchFeatureHeatmap(),
        fetchWordCloud(),
        fetchComparison(),
      ]);
      setLoading(false);
    };

    // Initial fetch
    useEffect(() => {
      if (workspace?.id) {
        fetchAllAnalytics();
      }
    }, [workspace?.id, dateRange.from, dateRange.to]);

    // Refetch when filters change
    useEffect(() => {
      if (Object.keys(filters).length > 0) {
        fetchAllAnalytics();
      }
    }, [filters]);

    const handleExport = async () => {
      if (!workspace?.id) return;

      try {
        const tokenInfo = await authStore.getToken();
        const params = new URLSearchParams({
          workspace_id: workspace.id,
        });

        // Add date range filters if present
        if (dateRange.from) {
          params.append("from", dateRange.from.toISOString());
        }
        if (dateRange.to) {
          params.append("to", dateRange.to.toISOString());
        }

        // Add any active filters
        if (filters.testimonialType && filters.testimonialType.length > 0) {
          params.append("type", filters.testimonialType[0]);
        }

        const response = await fetch(
          `${API_BASE_URL}/ai/analytics/export?${params}`,
          {
            headers: {
              Authorization: `Bearer ${tokenInfo.token}`,
            },
          }
        );

        if (response.ok) {
          // Get filename from Content-Disposition header or use default
          const contentDisposition = response.headers.get(
            "Content-Disposition"
          );
          let filename = `analytics_export_${new Date().toISOString().split("T")[0]}.xlsx`;

          if (contentDisposition) {
            const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
            if (filenameMatch) {
              filename = filenameMatch[1];
            }
          }

          // Download the file
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        } else {
          console.error("Failed to export analytics");
        }
      } catch (error) {
        console.error("Error exporting analytics:", error);
      }
    };

    const handleCompareSegments = (segment1: string, segment2: string) => {
      setCompareSegmentIds([segment1, segment2]);
      setShowSegmentComparison(true);
    };

    const handleCloseComparison = () => {
      setShowSegmentComparison(false);
      setCompareSegmentIds(null);
    };

    return (
      <div className="space-y-4">
        {/* Header with filters */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Data Analytics
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Visual insights from your testimonial data
            </p>
          </div>
          <div className="flex items-center gap-2">
            <AdvancedFilters filters={filters} onFiltersChange={setFilters} />
            <Button
              variant="outline"
              size="sm"
              onClick={fetchAllAnalytics}
              disabled={loading}
              className="border-slate-300 text-slate-700 hover:bg-slate-50 h-8 px-3 text-xs"
            >
              <RefreshCw
                className={`h-3 w-3 mr-1.5 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              className="border-slate-300 text-slate-700 hover:bg-slate-50 h-8 px-3 text-xs"
            >
              <Download className="h-3 w-3 mr-1.5" />
              Export
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-slate-100 p-1">
            <TabsTrigger value="overview" className="text-xs">
              Overview
            </TabsTrigger>
            <TabsTrigger value="sentiment" className="text-xs">
              Sentiment
            </TabsTrigger>
            <TabsTrigger value="features" className="text-xs">
              Features
            </TabsTrigger>
            <TabsTrigger value="comparison" className="text-xs">
              Comparison
            </TabsTrigger>
            <TabsTrigger value="segments" className="text-xs">
              Segments
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-4 space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <SentimentTimelineChart
                data={sentimentData}
                loading={loadingSentiment}
              />
              <FeatureHeatmapChart
                data={featureData}
                loading={loadingFeatures}
              />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <WordCloudChart data={wordCloudData} loading={loadingWordCloud} />
              {comparisonData && (
                <ComparativeAnalysisChart
                  data={comparisonData}
                  loading={loadingComparison}
                />
              )}
            </div>
          </TabsContent>

          {/* Sentiment Tab */}
          <TabsContent value="sentiment" className="mt-4 space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <SentimentTimelineChart
                data={sentimentData}
                loading={loadingSentiment}
              />
              <WordCloudChart data={wordCloudData} loading={loadingWordCloud} />
            </div>
          </TabsContent>

          {/* Features Tab */}
          <TabsContent value="features" className="mt-4 space-y-4">
            <FeatureHeatmapChart data={featureData} loading={loadingFeatures} />
          </TabsContent>

          {/* Comparison Tab */}
          <TabsContent value="comparison" className="mt-4 space-y-4">
            {comparisonData ? (
              <ComparativeAnalysisChart
                data={comparisonData}
                loading={loadingComparison}
              />
            ) : (
              <div className="p-8 text-center bg-slate-50 rounded-lg border border-slate-200">
                <Calendar className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                <p className="text-sm text-slate-600">
                  Select a date range to see period comparison
                </p>
              </div>
            )}
          </TabsContent>

          {/* Segments Tab */}
          <TabsContent value="segments" className="mt-4 space-y-4">
            {showSegmentComparison && compareSegmentIds ? (
              <SegmentComparison
                segmentId1={compareSegmentIds[0]}
                segmentId2={compareSegmentIds[1]}
                onClose={handleCloseComparison}
              />
            ) : (
              <SegmentsPanel onCompareSegments={handleCompareSegments} />
            )}
          </TabsContent>
        </Tabs>
      </div>
    );
  }
);

export default AnalyticsDashboard;
