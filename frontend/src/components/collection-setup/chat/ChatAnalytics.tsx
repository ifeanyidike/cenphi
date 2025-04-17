import React, { useState, useEffect } from "react";
import {
  Calendar,
  ChevronDown,
  Clock,
  Filter,
  MessageSquare,
  Star,
  TrendingUp,
  Users,
  ThumbsUp,
  ThumbsDown,
  Smile,
  Meh,
  BarChart3,
  ArrowUpRight,
  ChevronRight,
  HelpCircle,
  Sparkles,
  X,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";

// Custom Progress component to avoid TypeScript issues
interface ProgressProps {
  value?: number;
  max?: number;
  className?: string;
  children?: React.ReactNode;
}

const Progress: React.FC<ProgressProps> = ({
  value = 0,
  max = 100,
  className,
  children,
}) => {
  return (
    <div
      className={cn(
        "w-full bg-gray-200 rounded-full overflow-hidden",
        className
      )}
    >
      {children || (
        <div
          className="h-full bg-primary rounded-full"
          style={{ width: `${(value / max) * 100}%` }}
        />
      )}
    </div>
  );
};

// Define types for the analytics data
interface SentimentCount {
  positive: number;
  neutral: number;
  negative: number;
}

interface PlatformBreakdown {
  name: string;
  count: number;
  percentage: number;
  color: string;
}

interface TimelineData {
  date: string;
  count: number;
  timestamp: number; // Unix timestamp for easier filtering
}

interface RatingDistribution {
  rating: number;
  count: number;
}

interface ChatAnalyticsData {
  totalTestimonials: number;
  conversionRate: number;
  averageRating: number;
  sentiment: SentimentCount;
  platformBreakdown: PlatformBreakdown[];
  timeline: TimelineData[];
  ratingDistribution: RatingDistribution[];
  recentTestimonials: Array<{
    id: string;
    customerName: string;
    platform: string;
    sentiment: "positive" | "neutral" | "negative";
    content: string;
    date: string;
    timestamp: number; // Unix timestamp for filtering
    rating?: number;
  }>;
  topKeywords: Array<{
    keyword: string;
    count: number;
  }>;
}

interface ChatAnalyticsProps {
  data?: ChatAnalyticsData;
  isLoading?: boolean;
}

// Filters interface
interface Filters {
  platforms: string[];
  sentiments: string[];
  minRating: number;
}

// Color constants
const COLORS = {
  positive: "#10B981",
  neutral: "#6B7280",
  negative: "#EF4444",
  background: {
    positive: "#D1FAE5",
    neutral: "#F3F4F6",
    negative: "#FEE2E2",
  },
};

// Sample data (will be shown when real data is available)
const sampleData: ChatAnalyticsData = {
  totalTestimonials: 547,
  conversionRate: 12.8,
  averageRating: 4.3,
  sentiment: {
    positive: 382,
    neutral: 120,
    negative: 45,
  },
  platformBreakdown: [
    { name: "Intercom", count: 218, percentage: 40, color: "#286EFA" },
    { name: "Zendesk", count: 164, percentage: 30, color: "#03363D" },
    { name: "Drift", count: 109, percentage: 20, color: "#4363EE" },
    { name: "Others", count: 56, percentage: 10, color: "#64748B" },
  ],
  timeline: [
    { date: "Jan", count: 35, timestamp: new Date("2024-01-15").getTime() },
    { date: "Feb", count: 42, timestamp: new Date("2024-02-15").getTime() },
    { date: "Mar", count: 58, timestamp: new Date("2024-03-15").getTime() },
    { date: "Apr", count: 75, timestamp: new Date("2024-04-15").getTime() },
    { date: "May", count: 87, timestamp: new Date("2024-05-15").getTime() },
    { date: "Jun", count: 76, timestamp: new Date("2024-06-15").getTime() },
    { date: "Jul", count: 65, timestamp: new Date("2024-07-15").getTime() },
    { date: "Aug", count: 92, timestamp: new Date("2024-08-15").getTime() },
    { date: "Sep", count: 65, timestamp: new Date("2024-09-15").getTime() },
    { date: "Oct", count: 76, timestamp: new Date("2024-10-15").getTime() },
    { date: "Nov", count: 63, timestamp: new Date("2024-11-15").getTime() },
    { date: "Dec", count: 56, timestamp: new Date("2024-12-15").getTime() },
  ],
  ratingDistribution: [
    { rating: 1, count: 23 },
    { rating: 2, count: 31 },
    { rating: 3, count: 78 },
    { rating: 4, count: 162 },
    { rating: 5, count: 253 },
  ],
  recentTestimonials: [
    {
      id: "t1",
      customerName: "Alexandra Smith",
      platform: "Intercom",
      sentiment: "positive",
      content:
        "Your support team was incredibly helpful. They resolved my issue faster than I expected!",
      date: "2 hours ago",
      timestamp: Date.now() - 2 * 60 * 60 * 1000,
      rating: 5,
    },
    {
      id: "t2",
      customerName: "Michael Johnson",
      platform: "Zendesk",
      sentiment: "positive",
      content:
        "The product is fantastic and the customer service is top-notch. Will recommend to others.",
      date: "5 hours ago",
      timestamp: Date.now() - 5 * 60 * 60 * 1000,
      rating: 4,
    },
    {
      id: "t3",
      customerName: "David Williams",
      platform: "Drift",
      sentiment: "neutral",
      content:
        "It works as expected. Some features could be improved but overall does the job.",
      date: "Yesterday",
      timestamp: Date.now() - 24 * 60 * 60 * 1000,
      rating: 3,
    },
    {
      id: "t4",
      customerName: "Jessica Brown",
      platform: "Intercom",
      sentiment: "negative",
      content:
        "I found the interface confusing and had trouble finding the features I needed.",
      date: "2 days ago",
      timestamp: Date.now() - 2 * 24 * 60 * 60 * 1000,
      rating: 2,
    },
  ],
  topKeywords: [
    { keyword: "Support", count: 138 },
    { keyword: "Easy to use", count: 112 },
    { keyword: "Helpful", count: 89 },
    { keyword: "Intuitive", count: 76 },
    { keyword: "Fast", count: 73 },
  ],
};

const ChatAnalytics: React.FC<ChatAnalyticsProps> = ({
  data,
  isLoading = false,
}) => {
  const [timeframe, setTimeframe] = useState("30days");
  const [activeTab, setActiveTab] = useState("overview");
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Filter states
  const [filters, setFilters] = useState<Filters>({
    platforms: [],
    sentiments: [],
    minRating: 0,
  });

  // Original data
  const originalData = data || sampleData;

  // Filtered data state
  const [filteredData, setFilteredData] =
    useState<ChatAnalyticsData>(originalData);

  // Apply timeframe filter
  useEffect(() => {
    // Create deep copy of original data to modify
    const newData = JSON.parse(
      JSON.stringify(originalData)
    ) as ChatAnalyticsData;

    const now = Date.now();
    let timeframeMillis = 0;

    // Convert timeframe to milliseconds
    switch (timeframe) {
      case "7days":
        timeframeMillis = 7 * 24 * 60 * 60 * 1000;
        break;
      case "30days":
        timeframeMillis = 30 * 24 * 60 * 60 * 1000;
        break;
      case "90days":
        timeframeMillis = 90 * 24 * 60 * 60 * 1000;
        break;
      case "year":
        timeframeMillis = 365 * 24 * 60 * 60 * 1000;
        break;
      case "alltime":
      default:
        // No time filtering if "all time"
        timeframeMillis = Number.MAX_SAFE_INTEGER;
    }

    // Filter testimonials by time
    const filteredTestimonials = originalData.recentTestimonials.filter(
      (testimonial) => now - testimonial.timestamp <= timeframeMillis
    );

    // Filter timeline entries by time
    const cutoffTime = now - timeframeMillis;
    const filteredTimeline = originalData.timeline.filter(
      (entry) => entry.timestamp >= cutoffTime
    );

    // Apply platform and sentiment filters to testimonials
    const platformFiltered =
      filters.platforms.length > 0
        ? filteredTestimonials.filter((t) =>
            filters.platforms.includes(t.platform)
          )
        : filteredTestimonials;

    const sentimentFiltered =
      filters.sentiments.length > 0
        ? platformFiltered.filter((t) =>
            filters.sentiments.includes(t.sentiment)
          )
        : platformFiltered;

    const ratingFiltered =
      filters.minRating > 0
        ? sentimentFiltered.filter((t) => (t.rating || 0) >= filters.minRating)
        : sentimentFiltered;

    // Update testimonials in filtered data
    newData.recentTestimonials = ratingFiltered;

    // Update timeline in filtered data
    newData.timeline = filteredTimeline;

    // Recalculate total testimonials
    newData.totalTestimonials = ratingFiltered.length;

    // Recalculate sentiment counts
    const sentimentCounts = {
      positive: 0,
      neutral: 0,
      negative: 0,
    };

    ratingFiltered.forEach((testimonial) => {
      sentimentCounts[testimonial.sentiment]++;
    });

    newData.sentiment = sentimentCounts;

    // Recalculate platform breakdown
    const platformCounts: Record<string, number> = {};
    ratingFiltered.forEach((testimonial) => {
      platformCounts[testimonial.platform] =
        (platformCounts[testimonial.platform] || 0) + 1;
    });

    const platforms = Object.keys(platformCounts);
    const totalCount = ratingFiltered.length;

    newData.platformBreakdown = platforms.map((platform, index) => {
      const count = platformCounts[platform];
      const percentage =
        totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;
      // Preserve colors from original if available
      const originalPlatform = originalData.platformBreakdown.find(
        (p) => p.name === platform
      );
      const color =
        originalPlatform?.color ||
        ["#286EFA", "#03363D", "#4363EE", "#64748B"][index % 4];

      return {
        name: platform,
        count,
        percentage,
        color,
      };
    });

    // Recalculate rating distribution
    const ratingCounts: Record<number, number> = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    };
    ratingFiltered.forEach((testimonial) => {
      if (testimonial.rating) {
        ratingCounts[testimonial.rating] =
          (ratingCounts[testimonial.rating] || 0) + 1;
      }
    });

    newData.ratingDistribution = Object.entries(ratingCounts).map(
      ([rating, count]) => ({
        rating: Number(rating),
        count,
      })
    );

    // Calculate average rating
    if (ratingFiltered.length > 0) {
      const totalRating = ratingFiltered.reduce(
        (sum, testimonial) => sum + (testimonial.rating || 0),
        0
      );
      newData.averageRating =
        Math.round((totalRating / ratingFiltered.length) * 10) / 10;
    }

    setFilteredData(newData);
  }, [timeframe, filters, originalData]);

  // Helper function to check if data is empty
  const analyticsData = filteredData;

  // Reset filters function
  const resetFilters = () => {
    setFilters({
      platforms: [],
      sentiments: [],
      minRating: 0,
    });
  };

  // Toggle platform filter
  const togglePlatformFilter = (platform: string) => {
    setFilters((prev) => {
      if (prev.platforms.includes(platform)) {
        return {
          ...prev,
          platforms: prev.platforms.filter((p) => p !== platform),
        };
      } else {
        return {
          ...prev,
          platforms: [...prev.platforms, platform],
        };
      }
    });
  };

  // Toggle sentiment filter
  const toggleSentimentFilter = (sentiment: string) => {
    setFilters((prev) => {
      if (prev.sentiments.includes(sentiment)) {
        return {
          ...prev,
          sentiments: prev.sentiments.filter((s) => s !== sentiment),
        };
      } else {
        return {
          ...prev,
          sentiments: [...prev.sentiments, sentiment],
        };
      }
    });
  };

  // Set minimum rating
  const setMinRating = (rating: number) => {
    setFilters((prev) => ({
      ...prev,
      minRating: rating,
    }));
  };

  // Empty state (when no data is available)
  if (!analyticsData && !isLoading) {
    // Empty state component code remains the same
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">
              Chat Analytics
            </h2>
            <p className="text-muted-foreground">
              Insights from your customer testimonials collected via chat
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-9 gap-1.5">
              <HelpCircle className="h-4 w-4" />
              <span>Guide</span>
            </Button>
          </div>
        </div>

        <div className="border rounded-xl shadow-sm overflow-hidden bg-gradient-to-b from-slate-50 to-white">
          <div className="px-6 py-8 md:py-12 flex flex-col items-center justify-center text-center">
            <div className="relative mb-6">
              <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center">
                <MessageSquare className="h-10 w-10 text-blue-500 opacity-80" />
              </div>
              <div className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-slate-50 flex items-center justify-center">
                <BarChart3 className="h-4 w-4 text-slate-400" />
              </div>
            </div>

            <h3 className="text-xl font-semibold mb-2 text-slate-800">
              No analytics data yet
            </h3>
            <p className="text-slate-600 max-w-md mx-auto mb-6">
              Start collecting testimonials from your chat platforms to see
              valuable insights. Connect your platforms and engage with
              customers.
            </p>

            <div className="grid gap-5 grid-cols-1 md:grid-cols-3 w-full max-w-3xl mb-8">
              <div className="bg-white border rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500">
                    <MessageSquare className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">Connect Platforms</div>
                    <div className="text-xs text-slate-500">
                      Link your chat services
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white border rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-500">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">Engage Customers</div>
                    <div className="text-xs text-slate-500">
                      Request feedback via chat
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white border rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-500">
                    <BarChart3 className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">Track Results</div>
                    <div className="text-xs text-slate-500">
                      Analyze testimonial data
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <Button className="gap-2">
              <Sparkles className="h-4 w-4" />
              <span>Set Up Chat Collection</span>
            </Button>
          </div>

          <div className="px-6 py-4 bg-slate-50 border-t flex items-center justify-between text-sm text-slate-600">
            <div>
              Need help getting started?{" "}
              <a href="#" className="text-blue-600 hover:underline">
                View our guide
              </a>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>Data updates every 24 hours</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Calculate percentage for sentiment
  const totalSentiment =
    analyticsData.sentiment.positive +
      analyticsData.sentiment.neutral +
      analyticsData.sentiment.negative || 1; // Prevent division by zero
  const positivePercentage = Math.round(
    (analyticsData.sentiment.positive / totalSentiment) * 100
  );
  const neutralPercentage = Math.round(
    (analyticsData.sentiment.neutral / totalSentiment) * 100
  );
  const negativePercentage = Math.round(
    (analyticsData.sentiment.negative / totalSentiment) * 100
  );

  // Data section (when analytics data is available)
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
            Chat Analytics
          </h2>
          <p className="text-slate-500">
            Insights from testimonials collected through chat platforms
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="w-[180px] h-9">
              <SelectValue placeholder="Select timeframe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Last 7 days</SelectItem>
              <SelectItem value="30days">Last 30 days</SelectItem>
              <SelectItem value="90days">Last 90 days</SelectItem>
              <SelectItem value="year">Last 12 months</SelectItem>
              <SelectItem value="alltime">All time</SelectItem>
            </SelectContent>
          </Select>

          <Popover open={filtersOpen} onOpenChange={setFiltersOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 gap-1.5">
                <Filter className="h-4 w-4" />
                <span>Filters</span>
                <Badge
                  variant="secondary"
                  className={cn(
                    "ml-1 px-1 py-0",
                    filters.platforms.length === 0 &&
                      filters.sentiments.length === 0 &&
                      filters.minRating === 0 &&
                      "hidden"
                  )}
                >
                  {filters.platforms.length +
                    filters.sentiments.length +
                    (filters.minRating > 0 ? 1 : 0)}
                </Badge>
                <ChevronDown className="h-3 w-3 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
              <div className="flex items-center justify-between border-b p-3">
                <h3 className="font-medium">Filters</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetFilters}
                  className="h-8 text-xs"
                  disabled={
                    filters.platforms.length === 0 &&
                    filters.sentiments.length === 0 &&
                    filters.minRating === 0
                  }
                >
                  Reset
                </Button>
              </div>

              <div className="p-4 space-y-4">
                {/* Platform filters */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Platforms</h4>
                  <div className="space-y-2">
                    {originalData.platformBreakdown.map((platform) => (
                      <div
                        key={platform.name}
                        className="flex items-center gap-2"
                      >
                        <Checkbox
                          id={`platform-${platform.name}`}
                          checked={filters.platforms.includes(platform.name)}
                          onCheckedChange={() =>
                            togglePlatformFilter(platform.name)
                          }
                        />
                        <Label
                          htmlFor={`platform-${platform.name}`}
                          className="flex items-center gap-2"
                        >
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: platform.color }}
                          ></div>
                          {platform.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sentiment filters */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Sentiment</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="sentiment-positive"
                        checked={filters.sentiments.includes("positive")}
                        onCheckedChange={() =>
                          toggleSentimentFilter("positive")
                        }
                      />
                      <Label
                        htmlFor="sentiment-positive"
                        className="flex items-center gap-2"
                      >
                        <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                        Positive
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="sentiment-neutral"
                        checked={filters.sentiments.includes("neutral")}
                        onCheckedChange={() => toggleSentimentFilter("neutral")}
                      />
                      <Label
                        htmlFor="sentiment-neutral"
                        className="flex items-center gap-2"
                      >
                        <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                        Neutral
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="sentiment-negative"
                        checked={filters.sentiments.includes("negative")}
                        onCheckedChange={() =>
                          toggleSentimentFilter("negative")
                        }
                      />
                      <Label
                        htmlFor="sentiment-negative"
                        className="flex items-center gap-2"
                      >
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        Negative
                      </Label>
                    </div>
                  </div>
                </div>

                {/* Rating filter */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Minimum Rating</h4>
                  <div className="flex items-center justify-between">
                    {[0, 1, 2, 3, 4, 5].map((rating) => (
                      <Button
                        key={rating}
                        variant={
                          filters.minRating === rating ? "default" : "outline"
                        }
                        size="sm"
                        className={cn("h-8 w-8 p-0", rating === 0 && "text-xs")}
                        onClick={() => setMinRating(rating)}
                      >
                        {rating === 0 ? "All" : rating}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between border-t p-3">
                <div className="text-xs text-slate-500">
                  {filters.platforms.length === 0 &&
                  filters.sentiments.length === 0 &&
                  filters.minRating === 0
                    ? "No filters applied"
                    : `${filters.platforms.length + filters.sentiments.length + (filters.minRating > 0 ? 1 : 0)} filters applied`}
                </div>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => setFiltersOpen(false)}
                >
                  Apply
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Active filters display */}
      {(filters.platforms.length > 0 ||
        filters.sentiments.length > 0 ||
        filters.minRating > 0) && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm text-slate-500">Active filters:</span>

          {filters.platforms.map((platform) => (
            <Badge
              key={platform}
              variant="outline"
              className="flex items-center gap-1 px-2"
            >
              {platform}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => togglePlatformFilter(platform)}
              />
            </Badge>
          ))}

          {filters.sentiments.map((sentiment) => (
            <Badge
              key={sentiment}
              variant="outline"
              className="flex items-center gap-1 px-2"
            >
              {sentiment.charAt(0).toUpperCase() + sentiment.slice(1)}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => toggleSentimentFilter(sentiment)}
              />
            </Badge>
          ))}

          {filters.minRating > 0 && (
            <Badge variant="outline" className="flex items-center gap-1 px-2">
              Min rating: {filters.minRating}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => setMinRating(0)}
              />
            </Badge>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={resetFilters}
            className="h-7 px-2 text-xs"
          >
            Clear all
          </Button>
        </div>
      )}

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <div className="border-b">
          <TabsList className="bg-transparent h-12 p-0 w-full justify-start space-x-6">
            <TabsTrigger
              value="overview"
              className="h-12 px-1 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none bg-transparent"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="trends"
              className="h-12 px-1 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none bg-transparent"
            >
              Trends
            </TabsTrigger>
            <TabsTrigger
              value="sentiment"
              className="h-12 px-1 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none bg-transparent"
            >
              Sentiment
            </TabsTrigger>
            <TabsTrigger
              value="platforms"
              className="h-12 px-1 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none bg-transparent"
            >
              Platforms
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="m-0">
          {/* Key metrics */}
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-6">
            {/* Total testimonials */}
            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Testimonials
                </CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="text-2xl font-bold">
                  {analyticsData.totalTestimonials}
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  <span className="text-emerald-600 flex items-center gap-0.5">
                    <ArrowUpRight className="h-3 w-3" />
                    12%
                  </span>
                  <span>from previous period</span>
                </p>
              </CardContent>
            </Card>

            {/* Conversion rate */}
            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Conversion Rate
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="text-2xl font-bold">
                  {analyticsData.conversionRate}%
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  <span className="text-emerald-600 flex items-center gap-0.5">
                    <ArrowUpRight className="h-3 w-3" />
                    3.2%
                  </span>
                  <span>from previous period</span>
                </p>
              </CardContent>
            </Card>

            {/* Average rating */}
            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Average Rating
                </CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="text-2xl font-bold">
                  {analyticsData.averageRating}
                </div>
                <div className="flex items-center text-amber-400 mt-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="h-3 w-3 fill-current"
                      fillOpacity={
                        i < Math.floor(analyticsData.averageRating) ? 1 : 0.2
                      }
                    />
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Sentiment breakdown */}
            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Sentiment
                </CardTitle>
                <Smile className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                      <span className="text-xs">Positive</span>
                    </div>
                    <span className="text-xs font-medium">
                      {positivePercentage}%
                    </span>
                  </div>
                  <Progress className="h-1.5 bg-gray-100">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${positivePercentage}%` }}
                    />
                  </Progress>

                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                      <span className="text-xs">Neutral</span>
                    </div>
                    <span className="text-xs font-medium">
                      {neutralPercentage}%
                    </span>
                  </div>
                  <Progress className="h-1.5 bg-gray-100">
                    <div
                      className="h-full bg-gray-400 rounded-full"
                      style={{ width: `${neutralPercentage}%` }}
                    />
                  </Progress>

                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <span className="text-xs">Negative</span>
                    </div>
                    <span className="text-xs font-medium">
                      {negativePercentage}%
                    </span>
                  </div>
                  <Progress className="h-1.5 bg-gray-100">
                    <div
                      className="h-full bg-red-500 rounded-full"
                      style={{ width: `${negativePercentage}%` }}
                    />
                  </Progress>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
            {/* Monthly collection trend */}
            <Card className="shadow-sm">
              <CardHeader className="pb-0 pt-4">
                <CardTitle className="text-base">Collection Trend</CardTitle>
                <CardDescription>
                  Monthly testimonials collected
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0 pb-4">
                <div className="h-[220px] w-full px-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={analyticsData.timeline}
                      margin={{ top: 20, right: 0, left: 0, bottom: 5 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#f0f0f0"
                      />
                      <XAxis
                        dataKey="date"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12 }}
                      />
                      <RechartsTooltip
                        contentStyle={{
                          borderRadius: "8px",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                          border: "none",
                        }}
                        cursor={{ fill: "#f9fafb" }}
                        formatter={(value: number) => [
                          `${value} testimonials`,
                          "Count",
                        ]}
                      />
                      <Bar
                        dataKey="count"
                        fill="rgba(79, 70, 229, 0.8)"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Platform breakdown */}
            <Card className="shadow-sm">
              <CardHeader className="pb-0 pt-4">
                <CardTitle className="text-base">Platform Breakdown</CardTitle>
                <CardDescription>Source of testimonials</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[200px] -mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analyticsData.platformBreakdown}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={60}
                        paddingAngle={2}
                        dataKey="count"
                      >
                        {analyticsData.platformBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Legend
                        layout="vertical"
                        verticalAlign="middle"
                        align="right"
                        wrapperStyle={{ fontSize: "12px" }}
                      />
                      <RechartsTooltip
                        formatter={(value: number, name: string) => [
                          `${value} testimonials`,
                          name,
                        ]}
                        contentStyle={{
                          borderRadius: "8px",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                          border: "none",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 grid-cols-1 lg:grid-cols-3 mt-2">
            {/* Top keywords */}
            <Card className="shadow-sm">
              <CardHeader className="pb-2 pt-4">
                <CardTitle className="text-base">Top Keywords</CardTitle>
                <CardDescription>Common themes mentioned</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analyticsData.topKeywords.map((keyword, index) => (
                    <div key={index} className="flex items-center">
                      <div className="w-24 flex-shrink-0 text-sm font-medium truncate">
                        {keyword.keyword}
                      </div>
                      <div className="flex-1 ml-2">
                        <div className="flex items-center gap-2">
                          <Progress className="h-2 bg-slate-100">
                            <div
                              className="h-full bg-blue-500 rounded-full"
                              style={{
                                width: `${(keyword.count / analyticsData.topKeywords[0].count) * 100}%`,
                              }}
                            />
                          </Progress>
                          <span className="text-xs text-muted-foreground w-8">
                            {keyword.count}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent testimonials */}
            <Card className="shadow-sm lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4">
                <div>
                  <CardTitle className="text-base">
                    Recent Testimonials
                  </CardTitle>
                  <CardDescription>Latest feedback from chat</CardDescription>
                </div>
                <Button
                  variant="ghost"
                  className="h-8 flex items-center gap-1 text-xs text-primary"
                >
                  View all <ChevronRight className="h-3 w-3" />
                </Button>
              </CardHeader>
              <CardContent className="max-h-[280px] overflow-y-auto">
                {analyticsData.recentTestimonials.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    No testimonials match your current filters
                  </div>
                ) : (
                  <div className="space-y-3">
                    {analyticsData.recentTestimonials.map((testimonial) => (
                      <div
                        key={testimonial.id}
                        className="p-3 rounded-lg bg-slate-50"
                      >
                        <div className="flex justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-xs font-medium text-slate-600">
                              {testimonial.customerName.charAt(0)}
                              {testimonial.customerName
                                .split(" ")[1]
                                ?.charAt(0)}
                            </div>
                            <div>
                              <div className="text-sm font-medium">
                                {testimonial.customerName}
                              </div>
                              <div className="text-xs text-slate-500">
                                via {testimonial.platform}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {testimonial.rating && (
                              <div className="flex items-center gap-1">
                                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                                <span className="text-xs font-medium">
                                  {testimonial.rating}
                                </span>
                              </div>
                            )}
                            <Badge
                              className={cn(
                                "text-xs",
                                testimonial.sentiment === "positive" &&
                                  "bg-emerald-50 text-emerald-700 border-emerald-100",
                                testimonial.sentiment === "neutral" &&
                                  "bg-slate-100 text-slate-700 border-slate-200",
                                testimonial.sentiment === "negative" &&
                                  "bg-red-50 text-red-700 border-red-100"
                              )}
                            >
                              {testimonial.sentiment === "positive" && (
                                <ThumbsUp className="h-3 w-3 mr-1" />
                              )}
                              {testimonial.sentiment === "neutral" && (
                                <Meh className="h-3 w-3 mr-1" />
                              )}
                              {testimonial.sentiment === "negative" && (
                                <ThumbsDown className="h-3 w-3 mr-1" />
                              )}
                              {testimonial.sentiment.charAt(0).toUpperCase() +
                                testimonial.sentiment.slice(1)}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-sm text-slate-700 line-clamp-2">
                          {testimonial.content}
                        </p>
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-xs text-slate-500">
                            {testimonial.date}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 text-xs px-2"
                          >
                            View details
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="m-0 space-y-6">
          {/* Trends tab content */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Testimonial Collection Over Time</CardTitle>
              <CardDescription>Monthly collection rate</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px] pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={analyticsData.timeline}
                  margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#f0f0f0"
                  />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <RechartsTooltip />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#4F46E5"
                    strokeWidth={2}
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sentiment" className="m-0 space-y-6">
          {/* Sentiment tab content */}
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Sentiment Analysis</CardTitle>
                <CardDescription>
                  Distribution of testimonial sentiment
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          {
                            name: "Positive",
                            value: analyticsData.sentiment.positive,
                            color: COLORS.positive,
                          },
                          {
                            name: "Neutral",
                            value: analyticsData.sentiment.neutral,
                            color: COLORS.neutral,
                          },
                          {
                            name: "Negative",
                            value: analyticsData.sentiment.negative,
                            color: COLORS.negative,
                          },
                        ]}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        dataKey="value"
                        label={({ percent }) =>
                          `${(percent * 100).toFixed(0)}%`
                        }
                        labelLine={false}
                      >
                        {[
                          {
                            name: "Positive",
                            value: analyticsData.sentiment.positive,
                            color: COLORS.positive,
                          },
                          {
                            name: "Neutral",
                            value: analyticsData.sentiment.neutral,
                            color: COLORS.neutral,
                          },
                          {
                            name: "Negative",
                            value: analyticsData.sentiment.negative,
                            color: COLORS.negative,
                          },
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Legend />
                      <RechartsTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Rating Distribution</CardTitle>
                <CardDescription>Breakdown of customer ratings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={analyticsData.ratingDistribution}
                      margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#f0f0f0"
                      />
                      <XAxis
                        dataKey="rating"
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis axisLine={false} tickLine={false} />
                      <RechartsTooltip />
                      <Bar
                        dataKey="count"
                        fill="#F59E0B"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="platforms" className="m-0 space-y-6">
          {/* Platforms tab content */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Collection by Platform</CardTitle>
              <CardDescription>Testimonial sources breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              {analyticsData.platformBreakdown.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  No platform data matches your current filters
                </div>
              ) : (
                <div className="space-y-8">
                  {analyticsData.platformBreakdown.map((platform, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: platform.color }}
                          ></div>
                          <span className="font-medium">{platform.name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-slate-500">
                            {platform.count} testimonials
                          </span>
                          <Badge variant="outline" className="font-normal">
                            {platform.percentage}%
                          </Badge>
                        </div>
                      </div>
                      <Progress className="h-2 bg-slate-100">
                        <div
                          className="h-full rounded-full"
                          style={{
                            backgroundColor: platform.color,
                            width: `${platform.percentage}%`,
                          }}
                        />
                      </Progress>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="pt-2 text-sm text-slate-500 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Clock className="h-4 w-4" />
          <span>Last updated: Today at 9:32 AM</span>
        </div>

        <Button variant="outline" size="sm" className="h-8 gap-1.5">
          <Calendar className="h-3.5 w-3.5" />
          <span>Export data</span>
        </Button>
      </div>
    </div>
  );
};

export default ChatAnalytics;
