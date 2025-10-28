import { useState, useEffect } from "react";
import { observer } from "mobx-react-lite";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  RefreshCw,
  Eye,
  TrendingUp,
  Users,
  Heart,
  MessageSquare,
  Share2,
  Calendar,
  Link2,
  BarChart3,
  Sparkles,
} from "lucide-react";
import {
  publicShareManager,
  PublicShare,
} from "@/repo/managers/public_share_manager";
import { socialManager, SocialPost } from "@/repo/managers/social_manager";
import { workspaceHub } from "@/repo/workspace_hub";
import { useToast } from "@/hooks/use-toast";
import { format, subDays, startOfDay, endOfDay } from "date-fns";

const COLORS = {
  primary: "#3b82f6",
  secondary: "#8b5cf6",
  success: "#10b981",
  warning: "#f59e0b",
  danger: "#ef4444",
  purple: "#a855f7",
  pink: "#ec4899",
};

const EnhancedAnalytics = observer(() => {
  const [activeTab, setActiveTab] = useState<"shares" | "social">("shares");
  const [shares, setShares] = useState<PublicShare[]>([]);
  const [socialPosts, setSocialPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dateRange, setDateRange] = useState<string>("30");
  const { toast } = useToast();

  useEffect(() => {
    if (workspaceHub.workspace?.id) {
      loadData();
    }
  }, [workspaceHub.workspace?.id]);

  const loadData = async () => {
    if (!workspaceHub.workspace?.id) return;

    try {
      const [sharesData, postsData] = await Promise.all([
        publicShareManager
          .getWorkspaceShares(workspaceHub.workspace.id)
          .catch(() => []),
        socialManager.getPosts(workspaceHub.workspace.id, 100).catch(() => []),
      ]);

      // Shares already include metrics from backend
      setShares(sharesData || []);
      setSocialPosts(postsData || []);
    } catch (error) {
      console.error("Failed to load analytics:", error);
      toast({
        title: "Error",
        description: "Failed to load analytics data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    try {
      await loadData();
      toast({
        title: "Success",
        description: "Analytics refreshed successfully",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to refresh analytics",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  };

  // Generate time series data for shares
  const generateSharesTrend = () => {
    const days = parseInt(dateRange);
    const data = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dateStr = format(date, "MMM dd");

      const dayStart = startOfDay(date);
      const dayEnd = endOfDay(date);

      const dayShares = shares.filter((share) => {
        const createdDate = new Date(share.created_at);
        return createdDate >= dayStart && createdDate <= dayEnd;
      });

      const views = dayShares.reduce(
        (sum, share) => sum + (share.metrics?.view_count || 0),
        0
      );
      const engagement = dayShares.reduce(
        (sum, share) =>
          sum +
          (share.metrics?.play_count || 0) +
          (share.metrics?.download_count || 0),
        0
      );

      data.push({
        date: dateStr,
        views,
        engagement,
        shares: dayShares.length,
      });
    }

    return data;
  };

  // Generate time series data for social posts
  const generateSocialTrend = () => {
    const days = parseInt(dateRange);
    const data = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dateStr = format(date, "MMM dd");

      const dayStart = startOfDay(date);
      const dayEnd = endOfDay(date);

      const dayPosts = socialPosts.filter((post) => {
        if (!post.published_at) return false;
        const publishedDate = new Date(post.published_at);
        return publishedDate >= dayStart && publishedDate <= dayEnd;
      });

      const views = dayPosts.reduce((sum, post) => sum + post.views_count, 0);
      const likes = dayPosts.reduce((sum, post) => sum + post.likes_count, 0);
      const comments = dayPosts.reduce(
        (sum, post) => sum + post.comments_count,
        0
      );
      const shares = dayPosts.reduce((sum, post) => sum + post.shares_count, 0);

      data.push({
        date: dateStr,
        views,
        likes,
        comments,
        shares,
        posts: dayPosts.length,
      });
    }

    return data;
  };

  // Platform distribution for social posts
  const getPlatformDistribution = () => {
    const distribution = socialPosts.reduce(
      (acc, post) => {
        acc[post.platform] = (acc[post.platform] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return Object.entries(distribution).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
    }));
  };

  // Status distribution for social posts
  const getStatusDistribution = () => {
    const distribution = socialPosts.reduce(
      (acc, post) => {
        acc[post.status] = (acc[post.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return Object.entries(distribution).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
      color:
        name === "published"
          ? COLORS.success
          : name === "scheduled"
            ? COLORS.primary
            : name === "failed"
              ? COLORS.danger
              : COLORS.warning,
    }));
  };

  // Calculate metrics
  const shareMetrics = {
    totalShares: shares.length,
    activeShares: shares.filter((s) => s.is_active).length,
    totalViews: shares.reduce(
      (sum, share) => sum + (share.metrics?.view_count || 0),
      0
    ),
    uniqueVisitors: shares.reduce(
      (sum, share) => sum + (share.metrics?.unique_visitor_count || 0),
      0
    ),
    totalEngagement: shares.reduce(
      (sum, share) =>
        sum +
        (share.metrics?.play_count || 0) +
        (share.metrics?.download_count || 0),
      0
    ),
    avgViewsPerShare:
      shares.length > 0
        ? Math.round(
            shares.reduce(
              (sum, share) => sum + (share.metrics?.view_count || 0),
              0
            ) / shares.length
          )
        : 0,
  };

  const socialMetrics = {
    totalPosts: socialPosts.length,
    publishedPosts: socialPosts.filter((p) => p.status === "published").length,
    totalViews: socialPosts.reduce((sum, p) => sum + p.views_count, 0),
    totalLikes: socialPosts.reduce((sum, p) => sum + p.likes_count, 0),
    totalComments: socialPosts.reduce((sum, p) => sum + p.comments_count, 0),
    totalShares: socialPosts.reduce((sum, p) => sum + p.shares_count, 0),
    avgEngagement:
      socialPosts.length > 0
        ? Math.round(
            socialPosts.reduce(
              (sum, p) =>
                sum + p.likes_count + p.comments_count + p.shares_count,
              0
            ) / socialPosts.length
          )
        : 0,
  };

  const sharesTrendData = generateSharesTrend();
  const socialTrendData = generateSocialTrend();
  const platformDistribution = getPlatformDistribution();
  const statusDistribution = getStatusDistribution();

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">
            Analytics Dashboard
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Track performance across all your content
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[140px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7" className="text-xs">
                Last 7 days
              </SelectItem>
              <SelectItem value="30" className="text-xs">
                Last 30 days
              </SelectItem>
              <SelectItem value="90" className="text-xs">
                Last 90 days
              </SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={refreshData}
            disabled={loading || refreshing}
            variant="outline"
            size="sm"
            className="h-8"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 mr-1.5 ${refreshing ? "animate-spin" : ""}`}
            />
            <span className="text-xs">
              {refreshing ? "Updating..." : "Refresh"}
            </span>
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as "shares" | "social")}
      >
        <TabsList className="grid w-full max-w-md grid-cols-2 h-9">
          <TabsTrigger value="shares" className="text-xs">
            <Link2 className="h-3.5 w-3.5 mr-1.5" />
            Public Shares
          </TabsTrigger>
          <TabsTrigger value="social" className="text-xs">
            <Share2 className="h-3.5 w-3.5 mr-1.5" />
            Social Posts
          </TabsTrigger>
        </TabsList>

        {/* Public Shares Tab */}
        <TabsContent value="shares" className="space-y-4 mt-5">
          {/* Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <MetricCard
              title="Total Views"
              value={shareMetrics.totalViews.toLocaleString()}
              icon={Eye}
              color="blue"
              subtitle="Across all shares"
            />
            <MetricCard
              title="Unique Visitors"
              value={shareMetrics.uniqueVisitors.toLocaleString()}
              icon={Users}
              color="purple"
              subtitle={`${shareMetrics.totalViews > 0 ? ((shareMetrics.uniqueVisitors / shareMetrics.totalViews) * 100).toFixed(0) : 0}% unique rate`}
            />
            <MetricCard
              title="Total Engagement"
              value={shareMetrics.totalEngagement.toLocaleString()}
              icon={TrendingUp}
              color="emerald"
              subtitle="Plays + Downloads"
            />
            <MetricCard
              title="Avg per Share"
              value={shareMetrics.avgViewsPerShare.toString()}
              icon={BarChart3}
              color="amber"
              subtitle="Average views"
            />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="border-gray-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                  Views & Engagement Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={sharesTrendData}>
                    <defs>
                      <linearGradient
                        id="colorViews"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor={COLORS.primary}
                          stopOpacity={0.8}
                        />
                        <stop
                          offset="95%"
                          stopColor={COLORS.primary}
                          stopOpacity={0}
                        />
                      </linearGradient>
                      <linearGradient
                        id="colorEngagement"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor={COLORS.success}
                          stopOpacity={0.8}
                        />
                        <stop
                          offset="95%"
                          stopColor={COLORS.success}
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11 }}
                      stroke="#9ca3af"
                    />
                    <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" />
                    <Tooltip
                      contentStyle={{
                        fontSize: "11px",
                        borderRadius: "8px",
                        border: "1px solid #e5e7eb",
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: "11px" }} />
                    <Area
                      type="monotone"
                      dataKey="views"
                      stroke={COLORS.primary}
                      fillOpacity={1}
                      fill="url(#colorViews)"
                      name="Views"
                    />
                    <Area
                      type="monotone"
                      dataKey="engagement"
                      stroke={COLORS.success}
                      fillOpacity={1}
                      fill="url(#colorEngagement)"
                      name="Engagement"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-gray-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-purple-600" />
                  Share Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={sharesTrendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11 }}
                      stroke="#9ca3af"
                    />
                    <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" />
                    <Tooltip
                      contentStyle={{
                        fontSize: "11px",
                        borderRadius: "8px",
                        border: "1px solid #e5e7eb",
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: "11px" }} />
                    <Bar
                      dataKey="shares"
                      fill={COLORS.purple}
                      name="New Shares"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Social Posts Tab */}
        <TabsContent value="social" className="space-y-4 mt-5">
          {/* Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <MetricCard
              title="Total Views"
              value={socialMetrics.totalViews.toLocaleString()}
              icon={Eye}
              color="blue"
              subtitle="All posts combined"
            />
            <MetricCard
              title="Total Likes"
              value={socialMetrics.totalLikes.toLocaleString()}
              icon={Heart}
              color="pink"
              subtitle="Engagement metric"
            />
            <MetricCard
              title="Comments"
              value={socialMetrics.totalComments.toLocaleString()}
              icon={MessageSquare}
              color="emerald"
              subtitle="User interactions"
            />
            <MetricCard
              title="Avg Engagement"
              value={socialMetrics.avgEngagement.toString()}
              icon={TrendingUp}
              color="purple"
              subtitle="Per post"
            />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="border-gray-200 lg:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                  Engagement Metrics Over Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={socialTrendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11 }}
                      stroke="#9ca3af"
                    />
                    <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" />
                    <Tooltip
                      contentStyle={{
                        fontSize: "11px",
                        borderRadius: "8px",
                        border: "1px solid #e5e7eb",
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: "11px" }} />
                    <Line
                      type="monotone"
                      dataKey="views"
                      stroke={COLORS.primary}
                      strokeWidth={2}
                      name="Views"
                    />
                    <Line
                      type="monotone"
                      dataKey="likes"
                      stroke={COLORS.pink}
                      strokeWidth={2}
                      name="Likes"
                    />
                    <Line
                      type="monotone"
                      dataKey="comments"
                      stroke={COLORS.success}
                      strokeWidth={2}
                      name="Comments"
                    />
                    <Line
                      type="monotone"
                      dataKey="shares"
                      stroke={COLORS.purple}
                      strokeWidth={2}
                      name="Shares"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-gray-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-purple-600" />
                  Post Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={statusDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      // @ts-expect-error type issue with recharts
                      label={({
                        name,
                        percent,
                      }: {
                        name: string;
                        percent: number;
                      }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {statusDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        fontSize: "11px",
                        borderRadius: "8px",
                        border: "1px solid #e5e7eb",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {platformDistribution.length > 0 && (
            <Card className="border-gray-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <Share2 className="h-4 w-4 text-blue-600" />
                  Platform Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={platformDistribution} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      type="number"
                      tick={{ fontSize: 11 }}
                      stroke="#9ca3af"
                    />
                    <YAxis
                      dataKey="name"
                      type="category"
                      tick={{ fontSize: 11 }}
                      stroke="#9ca3af"
                    />
                    <Tooltip
                      contentStyle={{
                        fontSize: "11px",
                        borderRadius: "8px",
                        border: "1px solid #e5e7eb",
                      }}
                    />
                    <Bar dataKey="value" fill={COLORS.primary} name="Posts" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
});

// Metric Card Component
const MetricCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: any;
  color: "blue" | "purple" | "emerald" | "amber" | "pink";
}) => {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-600",
    purple: "bg-purple-50 text-purple-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    pink: "bg-pink-50 text-pink-600",
  };

  return (
    <Card className="border-gray-200 hover:shadow-md transition-shadow">
      <CardContent className="p-3.5">
        <div className="flex items-center gap-2 mb-1.5">
          <div className={`p-1.5 rounded-lg ${colorClasses[color]}`}>
            <Icon className="h-3.5 w-3.5" />
          </div>
          <span className="text-[10px] font-medium text-gray-600 uppercase tracking-wide">
            {title}
          </span>
        </div>
        <div className="text-xl font-semibold text-gray-900">{value}</div>
        <div className="text-[10px] text-gray-500 mt-0.5">{subtitle}</div>
      </CardContent>
    </Card>
  );
};

export default EnhancedAnalytics;
