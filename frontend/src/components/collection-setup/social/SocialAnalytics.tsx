// src/components/collection-setup/social/SocialAnalytics.tsx
import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  BarChart2,
  TrendingUp,
  Award,
  BarChart3,
  Hash,
  AtSign,
  Calendar,
  Share2,
  Download,
  ArrowRight,
  ChevronDown,
  ExternalLink,
  Info,
  Sliders,
  LineChart,
  PieChart,
  Users,
  Activity,
  MessageSquare,
  Star,
  CheckSquare,
  CheckCircle,
  Heart,
  Twitter,
  Instagram,
  Facebook,
  Linkedin,
  Command,
  Youtube,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { SocialPlatformName } from "@/types/setup";

interface SocialAnalyticsProps {
  showToast: (toast: {
    title: string;
    description: string;
    variant?: "default" | "destructive";
  }) => void;
}

// Platform icons mapping
const platformIcons: Record<SocialPlatformName, React.ElementType> = {
  instagram: Instagram,
  twitter: Twitter,
  facebook: Facebook,
  linkedin: Linkedin,
  tiktok: Command,
  youtube: Youtube,
};

// Platform colors
const platformColors: Record<SocialPlatformName, { bg: string; text: string }> =
  {
    instagram: {
      bg: "bg-gradient-to-tr from-amber-500 via-pink-500 to-purple-600",
      text: "text-white",
    },
    twitter: { bg: "bg-sky-500", text: "text-white" },
    facebook: { bg: "bg-blue-600", text: "text-white" },
    linkedin: { bg: "bg-blue-700", text: "text-white" },
    tiktok: { bg: "bg-black", text: "text-white" },
    youtube: { bg: "bg-red-600", text: "text-white" },
  };

// Sample data for charts and analytics
const sampleAnalyticsData = {
  overview: {
    total: 384,
    approved: 287,
    pending: 78,
    rejected: 19,
    conversionRate: 32.5,
    growthRate: 18.7,
  },
  platforms: [
    { name: "instagram", count: 182, percentage: 47.4, growth: 22.3 },
    { name: "twitter", count: 124, percentage: 32.3, growth: 15.8 },
    { name: "facebook", count: 58, percentage: 15.1, growth: 8.5 },
    { name: "linkedin", count: 20, percentage: 5.2, growth: 25.0 },
  ],
  campaigns: [
    {
      id: "1",
      name: "Summer Launch",
      hashtag: "SummerLaunch",
      count: 156,
      conversionRate: 42.7,
      active: true,
    },
    {
      id: "2",
      name: "Customer Appreciation",
      hashtag: "LoveOurCustomers",
      count: 87,
      conversionRate: 35.2,
      active: true,
    },
    {
      id: "3",
      name: "Product Feedback",
      hashtag: "ProductFeedback",
      count: 64,
      conversionRate: 28.3,
      active: false,
    },
    {
      id: "4",
      name: "Winter Collection",
      hashtag: "WinterStyle",
      count: 52,
      conversionRate: 31.6,
      active: false,
    },
  ],
  sentiment: {
    positive: 68,
    neutral: 27,
    negative: 5,
  },
  trending: [
    { keyword: "amazing", count: 87, growth: 15.2 },
    { keyword: "helpful", count: 54, growth: 8.7 },
    { keyword: "recommend", count: 42, growth: 12.3 },
    { keyword: "quality", count: 37, growth: 6.5 },
    { keyword: "excellent", count: 29, growth: 9.1 },
  ],
  timeline: [
    { date: "2023-01", count: 18 },
    { date: "2023-02", count: 24 },
    { date: "2023-03", count: 32 },
    { date: "2023-04", count: 27 },
    { date: "2023-05", count: 35 },
    { date: "2023-06", count: 42 },
    { date: "2023-07", count: 39 },
    { date: "2023-08", count: 48 },
    { date: "2023-09", count: 53 },
    { date: "2023-10", count: 57 },
    { date: "2023-11", count: 61 },
    { date: "2023-12", count: 68 },
  ],
};

// Mock monthly insight summary
const insightSummary = `
Our social testimonial collection has shown strong performance this month with a 32.5% conversion rate across all platforms.

Key insights:
• Instagram continues to be our top-performing platform for testimonial collection
• The "Summer Launch" campaign had the highest engagement rate
• Positive sentiment has increased by 7% compared to last month
• Keywords like "amazing" and "helpful" are trending in user testimonials

Recommendation: Continue focusing on Instagram and consider expanding the "Summer Launch" campaign strategy to other product lines.
`;

const SocialAnalytics: React.FC<SocialAnalyticsProps> = ({ showToast }) => {
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [timeRange, setTimeRange] = useState<string>("30d");
  const [exportLoading, setExportLoading] = useState<boolean>(false);

  const handleExportData = () => {
    setExportLoading(true);

    // Simulate export process
    setTimeout(() => {
      setExportLoading(false);
      showToast({
        title: "Export successful",
        description: "Analytics data has been exported to CSV.",
        variant: "default",
      });
    }, 1500);
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        when: "beforeChildren",
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      {/* Header with controls */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight mb-1">
            Social Testimonial Analytics
          </h2>
          <p className="text-sm text-muted-foreground">
            Track performance and gain insights from your social testimonial
            collection
          </p>
        </div>

        <div className="flex gap-3 items-start">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-36 h-8">
              <SelectValue placeholder="Time Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="6m">Last 6 months</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-8 gap-1">
                <Download className="h-3.5 w-3.5" />
                <span>Export</span>
                <ChevronDown className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Export Options</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleExportData}>
                <span>Export as CSV</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportData}>
                <span>Export as Excel</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportData}>
                <span>Export PDF Report</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="outline" size="icon" className="h-8 w-8">
            <Sliders className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full space-y-8"
      >
        <div className="border-b">
          <TabsList className="bg-transparent h-auto p-0 w-full gap-4 justify-start">
            <TabsTrigger
              value="overview"
              className="data-[state=active]:bg-transparent border-b-2 border-transparent data-[state=active]:border-primary rounded-none py-2.5 px-1"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              <span>Overview</span>
            </TabsTrigger>
            <TabsTrigger
              value="platforms"
              className="data-[state=active]:bg-transparent border-b-2 border-transparent data-[state=active]:border-primary rounded-none py-2.5 px-1"
            >
              <AtSign className="h-4 w-4 mr-2" />
              <span>Platforms</span>
            </TabsTrigger>
            <TabsTrigger
              value="campaigns"
              className="data-[state=active]:bg-transparent border-b-2 border-transparent data-[state=active]:border-primary rounded-none py-2.5 px-1"
            >
              <Hash className="h-4 w-4 mr-2" />
              <span>Campaigns</span>
            </TabsTrigger>
            <TabsTrigger
              value="sentiment"
              className="data-[state=active]:bg-transparent border-b-2 border-transparent data-[state=active]:border-primary rounded-none py-2.5 px-1"
            >
              <Heart className="h-4 w-4 mr-2" />
              <span>Sentiment</span>
            </TabsTrigger>
            <TabsTrigger
              value="insights"
              className="data-[state=active]:bg-transparent border-b-2 border-transparent data-[state=active]:border-primary rounded-none py-2.5 px-1"
            >
              <Award className="h-4 w-4 mr-2" />
              <span>Insights</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-8 mt-0">
          <motion.div
            variants={itemVariants}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 font-medium text-slate-600">
                  <CheckCircle className="h-4 w-4 text-blue-500" />
                  <span>Total Testimonials</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {sampleAnalyticsData.overview.total}
                </div>
                <div className="flex items-center gap-1 mt-1 text-xs">
                  <TrendingUp className="h-3.5 w-3.5 text-green-500" />
                  <span className="text-green-600">
                    +{sampleAnalyticsData.overview.growthRate}%
                  </span>
                  <span className="text-slate-500">vs. previous period</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 font-medium text-slate-600">
                  <Award className="h-4 w-4 text-amber-500" />
                  <span>Conversion Rate</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {sampleAnalyticsData.overview.conversionRate}%
                </div>
                <div className="mt-1">
                  <Progress
                    value={sampleAnalyticsData.overview.conversionRate}
                    className="h-1.5"
                  />
                </div>
                <div className="flex justify-between mt-1 text-xs text-slate-500">
                  <span>0%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 font-medium text-slate-600">
                  <CheckSquare className="h-4 w-4 text-green-500" />
                  <span>Approved</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {sampleAnalyticsData.overview.approved}
                </div>
                <div className="flex items-center gap-1 mt-1 text-xs">
                  <span className="text-slate-500">
                    {Math.round(
                      (sampleAnalyticsData.overview.approved /
                        sampleAnalyticsData.overview.total) *
                        100
                    )}
                    % approval rate
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 font-medium text-slate-600">
                  <Star className="h-4 w-4 text-amber-500" />
                  <span>Avg. Rating</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">4.7</div>
                <div className="flex mt-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className="h-3.5 w-3.5 text-amber-400 fill-amber-400"
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="grid grid-cols-1 lg:grid-cols-3 gap-4"
          >
            <Card className="lg:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <LineChart className="h-4 w-4 text-blue-500" />
                    <span>Collection Trend</span>
                  </div>
                  <Select defaultValue="monthly">
                    <SelectTrigger className="h-7 text-xs w-28">
                      <SelectValue placeholder="View by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </CardTitle>
                <CardDescription>
                  Number of testimonials collected over time
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-4">
                <div className="h-[240px] w-full mt-4 pr-8">
                  {/* Chart would go here - using a placeholder */}
                  <div className="relative h-full w-full">
                    <div className="absolute inset-0 flex items-end justify-between px-1">
                      {sampleAnalyticsData.timeline.map((month, i) => (
                        <div
                          key={i}
                          className="relative h-full flex flex-col justify-end items-center"
                          style={{
                            width: `${100 / sampleAnalyticsData.timeline.length}%`,
                          }}
                        >
                          <div
                            className="w-6 bg-blue-500 rounded-t-md"
                            style={{
                              height: `${(month.count / Math.max(...sampleAnalyticsData.timeline.map((m) => m.count))) * 85}%`,
                              opacity:
                                0.7 +
                                i / (sampleAnalyticsData.timeline.length * 2),
                            }}
                          />
                          <div className="absolute -bottom-6 text-xs text-slate-500 rotate-45 origin-top-left whitespace-nowrap">
                            {new Date(month.date).toLocaleDateString(
                              undefined,
                              { month: "short" }
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Y-axis */}
                    <div className="absolute left-0 top-0 bottom-0 w-8 flex flex-col justify-between pb-6">
                      <div className="text-xs text-slate-400">70</div>
                      <div className="text-xs text-slate-400">35</div>
                      <div className="text-xs text-slate-400">0</div>
                    </div>

                    {/* Trend line */}
                    <svg
                      className="absolute inset-0 h-full w-full"
                      style={{ top: "10px" }}
                    >
                      <path
                        d={`M 30 ${240 - 240 * 0.85 * (sampleAnalyticsData.timeline[0].count / Math.max(...sampleAnalyticsData.timeline.map((m) => m.count)))} 
                            ${sampleAnalyticsData.timeline
                              .map((month, i) => {
                                const x =
                                  30 +
                                  i *
                                    ((100 - 40) /
                                      (sampleAnalyticsData.timeline.length -
                                        1)) *
                                    (window.innerWidth / 100);
                                const y =
                                  240 -
                                  240 *
                                    0.85 *
                                    (month.count /
                                      Math.max(
                                        ...sampleAnalyticsData.timeline.map(
                                          (m) => m.count
                                        )
                                      ));
                                return `L ${x} ${y}`;
                              })
                              .join(" ")}`}
                        stroke="rgba(37, 99, 235, 0.8)"
                        strokeWidth="2"
                        fill="none"
                      />
                    </svg>
                  </div>

                  <div className="flex justify-end mt-10 text-xs text-slate-500">
                    Data shown for the last 12 months
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <PieChart className="h-4 w-4 text-purple-500" />
                  <span>Platform Distribution</span>
                </CardTitle>
                <CardDescription>
                  Testimonials by social media platform
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[240px] relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-32 h-32 bg-slate-50 rounded-full"></div>
                    <div className="absolute w-32 h-32">
                      {sampleAnalyticsData.platforms.map((platform, index) => {
                        const startAngle =
                          index === 0
                            ? 0
                            : sampleAnalyticsData.platforms
                                .slice(0, index)
                                .reduce(
                                  (acc, curr) => acc + curr.percentage,
                                  0
                                ) * 3.6;

                        const endAngle = startAngle + platform.percentage * 3.6;

                        // Convert to radians for calculations
                        const startRad = ((startAngle - 90) * Math.PI) / 180;
                        const endRad = ((endAngle - 90) * Math.PI) / 180;

                        // Calculate coordinates
                        const x1 = 16 + 16 * Math.cos(startRad);
                        const y1 = 16 + 16 * Math.sin(startRad);
                        const x2 = 16 + 16 * Math.cos(endRad);
                        const y2 = 16 + 16 * Math.sin(endRad);

                        // Determine if the arc should be a large arc
                        const largeArcFlag = platform.percentage > 50 ? 1 : 0;

                        const pathData = `M 16 16 L ${x1} ${y1} A 16 16 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

                        return (
                          <svg
                            key={platform.name}
                            className="w-full h-full absolute top-0 left-0"
                            viewBox="0 0 32 32"
                          >
                            <path
                              d={pathData}
                              fill={
                                platform.name === "instagram"
                                  ? "#E1306C"
                                  : platform.name === "twitter"
                                    ? "#1DA1F2"
                                    : platform.name === "facebook"
                                      ? "#4267B2"
                                      : platform.name === "linkedin"
                                        ? "#0077B5"
                                        : "#888888"
                              }
                              opacity={0.85}
                              stroke="#fff"
                              strokeWidth="0.2"
                            />
                          </svg>
                        );
                      })}
                    </div>
                  </div>

                  <div className="absolute left-0 right-0 bottom-0">
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                      {sampleAnalyticsData.platforms.map((platform) => {
                        const Icon =
                          platformIcons[platform.name as SocialPlatformName];

                        return (
                          <div
                            key={platform.name}
                            className="flex items-center gap-2"
                          >
                            <div
                              className={cn(
                                "w-4 h-4 rounded-full flex items-center justify-center",
                                platformColors[
                                  platform.name as SocialPlatformName
                                ]?.bg || "bg-slate-500"
                              )}
                            >
                              <Icon className="h-2.5 w-2.5 text-white" />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-xs font-medium capitalize">
                                {platform.name}
                              </span>
                              <span className="text-xs text-slate-500">
                                {platform.percentage}%
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="grid grid-cols-1 lg:grid-cols-3 gap-4"
          >
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <span>Trending Keywords</span>
                </CardTitle>
                <CardDescription>
                  Most mentioned terms in testimonials
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 mt-2">
                  {sampleAnalyticsData.trending.map((keyword, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={cn(
                            "px-1.5 py-0 text-xs font-normal",
                            index < 3
                              ? "bg-green-50 text-green-700 border-green-200"
                              : "bg-slate-50"
                          )}
                        >
                          #{index + 1}
                        </Badge>
                        <span className="text-sm font-medium">
                          "{keyword.keyword}"
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500">
                          {keyword.count}
                        </span>
                        <Badge
                          variant="outline"
                          className="bg-green-50 text-green-700 border-green-200 flex items-center gap-1"
                        >
                          <TrendingUp className="h-3 w-3" />
                          <span>{keyword.growth}%</span>
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 text-center">
                  <Button variant="outline" size="sm" className="text-xs">
                    View All Keywords
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <Award className="h-4 w-4 text-amber-500" />
                  <span>Top Campaigns</span>
                </CardTitle>
                <CardDescription>
                  Best performing hashtag campaigns
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 mt-2">
                  {sampleAnalyticsData.campaigns
                    .slice(0, 3)
                    .map((campaign, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className={cn(
                              "px-1.5 py-0 text-xs font-normal",
                              index === 0
                                ? "bg-amber-50 text-amber-700 border-amber-200"
                                : "bg-slate-50"
                            )}
                          >
                            #{index + 1}
                          </Badge>
                          <div>
                            <div className="text-sm font-medium">
                              {campaign.name}
                            </div>
                            <div className="flex items-center gap-1 text-xs text-slate-500">
                              <Hash className="h-3 w-3" />
                              <span>{campaign.hashtag}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-500">
                            {campaign.count}
                          </span>
                          <Badge
                            variant={index === 0 ? "default" : "outline"}
                            className={
                              index === 0
                                ? "bg-amber-500"
                                : "bg-slate-100 text-slate-700"
                            }
                          >
                            {campaign.conversionRate}%
                          </Badge>
                        </div>
                      </div>
                    ))}
                </div>

                <div className="mt-4 text-center">
                  <Button variant="outline" size="sm" className="text-xs">
                    View All Campaigns
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <Heart className="h-4 w-4 text-pink-500" />
                  <span>Sentiment Analysis</span>
                </CardTitle>
                <CardDescription>
                  Emotional tone of collected testimonials
                </CardDescription>
              </CardHeader>
              <CardContent className="py-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1 text-green-600">
                        <CheckCircle className="h-3.5 w-3.5" />
                        <span>Positive</span>
                      </span>
                      <span className="font-medium">
                        {sampleAnalyticsData.sentiment.positive}%
                      </span>
                    </div>
                    <Progress
                      value={sampleAnalyticsData.sentiment.positive}
                      className="h-2"
                      style={
                        {
                          "--progress-background": "rgb(241, 245, 249)",
                          "--progress-foreground": "rgb(34, 197, 94)",
                        } as React.CSSProperties
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1 text-blue-600">
                        <Info className="h-3.5 w-3.5" />
                        <span>Neutral</span>
                      </span>
                      <span className="font-medium">
                        {sampleAnalyticsData.sentiment.neutral}%
                      </span>
                    </div>
                    <Progress
                      value={sampleAnalyticsData.sentiment.neutral}
                      className="h-2"
                      style={
                        {
                          "--progress-background": "rgb(241, 245, 249)",
                          "--progress-foreground": "rgb(59, 130, 246)",
                        } as React.CSSProperties
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1 text-red-600">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        <span>Negative</span>
                      </span>
                      <span className="font-medium">
                        {sampleAnalyticsData.sentiment.negative}%
                      </span>
                    </div>
                    <Progress
                      value={sampleAnalyticsData.sentiment.negative}
                      className="h-2"
                      style={
                        {
                          "--progress-background": "rgb(241, 245, 249)",
                          "--progress-foreground": "rgb(239, 68, 68)",
                        } as React.CSSProperties
                      }
                    />
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Sentiment Score</span>
                    <Badge className="bg-green-100 text-green-700 border-green-200">
                      Excellent
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-purple-500" />
                    <span>Monthly Insights</span>
                  </div>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>December 2023</span>
                  </Badge>
                </CardTitle>
                <CardDescription>
                  AI-generated summary of your social testimonial performance
                </CardDescription>
              </CardHeader>
              <CardContent className="py-4">
                <div className="p-4 bg-purple-50 border border-purple-100 rounded-lg">
                  <p className="text-sm text-purple-800 leading-relaxed whitespace-pre-line">
                    {insightSummary}
                  </p>
                </div>

                <div className="mt-4 flex justify-end gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-xs"
                  >
                    <Share2 className="h-3.5 w-3.5" />
                    <span>Share Report</span>
                  </Button>
                  <Button size="sm" className="gap-1.5 text-xs">
                    <ArrowRight className="h-3.5 w-3.5" />
                    <span>Full Insights Report</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Platform Tab */}
        <TabsContent value="platforms" className="space-y-6 mt-0">
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-medium">
                  Platform Performance
                </CardTitle>
                <CardDescription>
                  Compare testimonial collection across different social media
                  platforms
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative overflow-x-auto">
                  <table className="w-full text-sm text-left rtl:text-right">
                    <thead className="text-xs text-slate-700 bg-slate-50">
                      <tr>
                        <th scope="col" className="px-6 py-3">
                          Platform
                        </th>
                        <th scope="col" className="px-6 py-3">
                          Testimonials
                        </th>
                        <th scope="col" className="px-6 py-3">
                          Distribution
                        </th>
                        <th scope="col" className="px-6 py-3">
                          Conversion
                        </th>
                        <th scope="col" className="px-6 py-3">
                          Growth
                        </th>
                        <th scope="col" className="px-6 py-3">
                          Sentiment
                        </th>
                        <th scope="col" className="px-6 py-3 text-right">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {sampleAnalyticsData.platforms.map((platform) => {
                        const Icon =
                          platformIcons[platform.name as SocialPlatformName];
                        return (
                          <tr key={platform.name} className="bg-white border-b">
                            <td className="px-6 py-4 font-medium">
                              <div className="flex items-center gap-2">
                                <div
                                  className={cn(
                                    "w-8 h-8 rounded-full flex items-center justify-center",
                                    platformColors[
                                      platform.name as SocialPlatformName
                                    ]?.bg || "bg-slate-500"
                                  )}
                                >
                                  <Icon className="h-4 w-4 text-white" />
                                </div>
                                <span className="capitalize">
                                  {platform.name}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4">{platform.count}</td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <Progress
                                  value={platform.percentage}
                                  className="h-2 w-24"
                                />
                                <span>{platform.percentage}%</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              {platform.name === "instagram"
                                ? "42.3%"
                                : platform.name === "twitter"
                                  ? "38.7%"
                                  : platform.name === "facebook"
                                    ? "35.2%"
                                    : platform.name === "linkedin"
                                      ? "29.8%"
                                      : "N/A"}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-1 text-green-600">
                                <TrendingUp className="h-4 w-4" />
                                <span>{platform.growth}%</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <Badge
                                className={
                                  platform.name === "instagram"
                                    ? "bg-green-100 text-green-700"
                                    : platform.name === "twitter"
                                      ? "bg-green-100 text-green-700"
                                      : platform.name === "facebook"
                                        ? "bg-blue-100 text-blue-700"
                                        : platform.name === "linkedin"
                                          ? "bg-green-100 text-green-700"
                                          : "bg-slate-100"
                                }
                              >
                                {platform.name === "instagram"
                                  ? "Very positive"
                                  : platform.name === "twitter"
                                    ? "Positive"
                                    : platform.name === "facebook"
                                      ? "Neutral"
                                      : platform.name === "linkedin"
                                        ? "Positive"
                                        : "N/A"}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <Button variant="ghost" size="sm">
                                View Details
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            <div className="space-y-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-medium flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-500" />
                    <span>Audience Demographics</span>
                  </CardTitle>
                  <CardDescription>
                    User profile data from social testimonials
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 py-2">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600">Age Groups</span>
                      </div>
                      <div className="grid grid-cols-5 gap-1">
                        <div className="space-y-1">
                          <div
                            className="bg-blue-100 h-16 rounded-t-sm relative"
                            style={{ height: "30px" }}
                          ></div>
                          <div className="text-xs text-center text-slate-500">
                            18-24
                          </div>
                          <div className="text-xs text-center font-medium">
                            12%
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div
                            className="bg-blue-300 h-16 rounded-t-sm relative"
                            style={{ height: "76px" }}
                          ></div>
                          <div className="text-xs text-center text-slate-500">
                            25-34
                          </div>
                          <div className="text-xs text-center font-medium">
                            38%
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div
                            className="bg-blue-500 h-16 rounded-t-sm relative"
                            style={{ height: "60px" }}
                          ></div>
                          <div className="text-xs text-center text-slate-500">
                            35-44
                          </div>
                          <div className="text-xs text-center font-medium">
                            30%
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div
                            className="bg-blue-700 h-16 rounded-t-sm relative"
                            style={{ height: "34px" }}
                          ></div>
                          <div className="text-xs text-center text-slate-500">
                            45-54
                          </div>
                          <div className="text-xs text-center font-medium">
                            17%
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div
                            className="bg-blue-900 h-16 rounded-t-sm relative"
                            style={{ height: "14px" }}
                          ></div>
                          <div className="text-xs text-center text-slate-500">
                            55+
                          </div>
                          <div className="text-xs text-center font-medium">
                            7%
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between pt-2 border-t">
                      <div className="text-center">
                        <div className="text-xs text-slate-500">Gender</div>
                        <div className="text-sm font-medium mt-1">
                          54% Female, 44% Male, 2% Other
                        </div>
                      </div>

                      <div className="text-center">
                        <div className="text-xs text-slate-500">
                          Top Location
                        </div>
                        <div className="text-sm font-medium mt-1">
                          United States (42%)
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-medium flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-purple-500" />
                    <span>Content Analysis</span>
                  </CardTitle>
                  <CardDescription>
                    Insights from your testimonial content
                  </CardDescription>
                </CardHeader>
                <CardContent className="py-3">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="text-sm">Average Word Count</div>
                      <div className="font-medium">68 words</div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-sm">Most Common Topics</div>
                      <div className="flex gap-1">
                        <Badge className="bg-slate-100">Quality</Badge>
                        <Badge className="bg-slate-100">Support</Badge>
                        <Badge className="bg-slate-100">Features</Badge>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-sm">Media Engagement</div>
                      <div className="font-medium">32% with media</div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-sm">Response Rate</div>
                      <div className="font-medium">87% positive responses</div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t">
                    <Button variant="outline" size="sm" className="w-full">
                      <ArrowRight className="h-3.5 w-3.5 mr-1.5" />
                      <span>Advanced Content Analysis</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <BarChart2 className="h-4 w-4 text-indigo-500" />
                  <span>Platform Comparison</span>
                </CardTitle>
                <CardDescription>
                  Metrics comparison across social platforms
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6 py-2">
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Conversion Rate</h4>
                    <div className="space-y-3">
                      {[
                        { name: "instagram", value: 42.3 },
                        { name: "twitter", value: 38.7 },
                        { name: "facebook", value: 35.2 },
                        { name: "linkedin", value: 29.8 },
                      ].map((platform) => {
                        const Icon =
                          platformIcons[platform.name as SocialPlatformName];
                        return (
                          <div
                            key={platform.name}
                            className="flex items-center gap-2"
                          >
                            <div
                              className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center",
                                platformColors[
                                  platform.name as SocialPlatformName
                                ]?.bg || "bg-slate-500"
                              )}
                            >
                              <Icon className="h-4 w-4 text-white" />
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between mb-1 text-sm">
                                <span className="capitalize">
                                  {platform.name}
                                </span>
                                <span className="font-medium">
                                  {platform.value}%
                                </span>
                              </div>
                              <div className="w-full bg-slate-100 rounded-full h-2">
                                <div
                                  className={cn(
                                    "h-2 rounded-full",
                                    platform.name === "instagram"
                                      ? "bg-rose-500"
                                      : platform.name === "twitter"
                                        ? "bg-sky-500"
                                        : platform.name === "facebook"
                                          ? "bg-blue-500"
                                          : platform.name === "linkedin"
                                            ? "bg-blue-700"
                                            : "bg-slate-500"
                                  )}
                                  style={{ width: `${platform.value}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-2 pt-4 border-t">
                    <h4 className="text-sm font-medium">Engagement Metrics</h4>
                    <div className="relative overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead className="text-xs text-slate-700 bg-slate-50">
                          <tr>
                            <th scope="col" className="px-3 py-2">
                              Platform
                            </th>
                            <th scope="col" className="px-3 py-2">
                              Comments
                            </th>
                            <th scope="col" className="px-3 py-2">
                              Shares
                            </th>
                            <th scope="col" className="px-3 py-2">
                              Likes
                            </th>
                            <th scope="col" className="px-3 py-2">
                              Impressions
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {[
                            {
                              name: "instagram",
                              comments: 782,
                              shares: 325,
                              likes: 4382,
                              impressions: "12.5K",
                            },
                            {
                              name: "twitter",
                              comments: 541,
                              shares: 487,
                              likes: 2105,
                              impressions: "9.8K",
                            },
                            {
                              name: "facebook",
                              comments: 328,
                              shares: 156,
                              likes: 1872,
                              impressions: "7.2K",
                            },
                            {
                              name: "linkedin",
                              comments: 184,
                              shares: 92,
                              likes: 743,
                              impressions: "4.3K",
                            },
                          ].map((platform) => (
                            <tr
                              key={platform.name}
                              className="bg-white border-b"
                            >
                              <td className="px-3 py-2 font-medium capitalize">
                                {platform.name}
                              </td>
                              <td className="px-3 py-2">{platform.comments}</td>
                              <td className="px-3 py-2">{platform.shares}</td>
                              <td className="px-3 py-2">{platform.likes}</td>
                              <td className="px-3 py-2">
                                {platform.impressions}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="space-y-2 pt-4 border-t">
                    <h4 className="text-sm font-medium">
                      Platform-Specific Metrics
                    </h4>
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div className="p-3 bg-slate-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Instagram className="h-4 w-4 text-pink-500" />
                          <span className="text-sm font-medium">Instagram</span>
                        </div>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span className="text-slate-500">
                              Story Replies
                            </span>
                            <span>128</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">
                              Post Mentions
                            </span>
                            <span>243</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">
                              Direct Messages
                            </span>
                            <span>189</span>
                          </div>
                        </div>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Twitter className="h-4 w-4 text-sky-500" />
                          <span className="text-sm font-medium">Twitter</span>
                        </div>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span className="text-slate-500">Quote Tweets</span>
                            <span>87</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Mentions</span>
                            <span>156</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">
                              Thread Replies
                            </span>
                            <span>112</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants} className="flex justify-end">
            <Button className="gap-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700">
              <ExternalLink className="h-4 w-4" />
              <span>Complete Platform Analysis</span>
            </Button>
          </motion.div>
        </TabsContent>

        {/* Minimal implementation for other tabs */}
        <TabsContent value="campaigns" className="space-y-6 mt-0">
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader>
                <CardTitle>Campaign Analytics</CardTitle>
                <CardDescription>
                  Performance metrics for your hashtag campaigns
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-500">
                  Detailed campaign analytics would be displayed here, including
                  performance metrics, conversion rates, and audience engagement
                  for each of your hashtag campaigns.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="sentiment" className="space-y-6 mt-0">
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader>
                <CardTitle>Sentiment Analysis</CardTitle>
                <CardDescription>
                  Emotional tone analysis of your social testimonials
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-500">
                  Detailed sentiment analysis would be displayed here, including
                  sentiment trends over time, emotional analysis by platform,
                  and key positive/negative themes detected in testimonials.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6 mt-0">
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader>
                <CardTitle>AI-Powered Insights</CardTitle>
                <CardDescription>
                  Actionable intelligence from your social testimonial data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-500">
                  Comprehensive AI-generated insights would be displayed here,
                  including content recommendations, performance forecasts, and
                  platform-specific optimization suggestions.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
};

export default SocialAnalytics;
