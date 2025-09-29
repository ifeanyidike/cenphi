import { useState, useEffect } from "react";
import { observer } from "mobx-react-lite";
import { DashboardWrapper } from "@/components/dashboard-main/DashboardWrapper";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { RefreshCw, ExternalLink, Search, Download } from "lucide-react";
import {
  socialManager,
  SocialPost,
  SocialAccount,
} from "@/repo/managers/social_manager";
import { workspaceHub } from "@/repo/workspace_hub";
import { useToast } from "@/hooks/use-toast";
import { useSocialMetricsUpdates } from "@/hooks/use-social-metrics-updates";

const SocialAnalytics = observer(() => {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [, setAccounts] = useState<SocialAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  const { toast } = useToast();

  // Set up real-time metrics updates
  const { forceUpdate, isUpdating } = useSocialMetricsUpdates({
    enabled: true,
    interval: 60000, // Update every minute
    onUpdate: () => {
      loadData();
    },
    onError: (error) => {
      console.warn("Metrics update error:", error);
    },
  });

  useEffect(() => {
    if (workspaceHub.workspace?.id) {
      loadData();
    }
  }, [workspaceHub.workspace?.id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [postsData, accountsData] = await Promise.all([
        socialManager.getPosts(workspaceHub.workspace!.id, 100),
        socialManager.getAccounts(workspaceHub.workspace!.id),
      ]);

      setPosts(postsData);
      setAccounts(accountsData);
    } catch {
      toast({
        title: "Error",
        description: "Failed to load social analytics data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshMetrics = async (postId: string) => {
    try {
      await forceUpdate(postId);
      toast({
        title: "Success",
        description: "Metrics updated successfully",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to update metrics",
        variant: "destructive",
      });
    }
  };

  // Filter posts based on selected criteria
  const filteredPosts = posts.filter((post) => {
    const matchesPlatform =
      selectedPlatform === "all" || post.platform === selectedPlatform;
    const matchesStatus =
      selectedStatus === "all" || post.status === selectedStatus;
    const matchesSearch =
      searchTerm === "" ||
      post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.hashtags.some((tag) =>
        tag.toLowerCase().includes(searchTerm.toLowerCase())
      );

    return matchesPlatform && matchesStatus && matchesSearch;
  });

  // Calculate analytics metrics
  const analyticsMetrics = {
    totalPosts: filteredPosts.length,
    totalViews: filteredPosts.reduce((sum, post) => sum + post.views_count, 0),
    totalLikes: filteredPosts.reduce((sum, post) => sum + post.likes_count, 0),
    totalComments: filteredPosts.reduce(
      (sum, post) => sum + post.comments_count,
      0
    ),
    totalShares: filteredPosts.reduce(
      (sum, post) => sum + post.shares_count,
      0
    ),
    publishedPosts: filteredPosts.filter((p) => p.status === "published")
      .length,
    averageEngagement:
      filteredPosts.length > 0
        ? filteredPosts.reduce(
            (sum, post) =>
              sum +
              (post.likes_count + post.comments_count + post.shares_count),
            0
          ) / filteredPosts.length
        : 0,
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "published":
        return "text-green-700 bg-green-50 border-green-200";
      case "scheduled":
        return "text-blue-700 bg-blue-50 border-blue-200";
      case "draft":
        return "text-gray-700 bg-gray-50 border-gray-200";
      case "failed":
        return "text-red-700 bg-red-50 border-red-200";
      default:
        return "text-gray-700 bg-gray-50 border-gray-200";
    }
  };

  const downloadAsCSV = () => {
    const csvData = filteredPosts.map((post) => ({
      platform: post.platform,
      content: post.content.replace(/"/g, '""'),
      status: post.status,
      type: post.post_type,
      views: post.views_count,
      likes: post.likes_count,
      comments: post.comments_count,
      shares: post.shares_count,
      created_at: post.created_at,
      published_at: post.published_at || "",
    }));

    const headers = [
      "Platform",
      "Content",
      "Status",
      "Type",
      "Views",
      "Likes",
      "Comments",
      "Shares",
      "Created At",
      "Published At",
    ];

    const csvContent = [
      headers.join(","),
      ...csvData.map((row) =>
        Object.values(row)
          .map((value) => `"${value}"`)
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `social_analytics_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <DashboardWrapper>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              Social Analytics
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Track performance of your shared testimonials
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={downloadAsCSV} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button
              onClick={() => forceUpdate()}
              disabled={loading || isUpdating}
              variant="outline"
              size="sm"
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${isUpdating ? "animate-spin" : ""}`}
              />
              {isUpdating ? "Updating..." : "Refresh"}
            </Button>
          </div>
        </div>

        {/* Overview Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-gray-600">Total Posts</div>
              <div className="text-2xl font-semibold text-gray-900">
                {analyticsMetrics.totalPosts}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-gray-600">Total Views</div>
              <div className="text-2xl font-semibold text-gray-900">
                {analyticsMetrics.totalViews.toLocaleString()}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-gray-600">Total Engagement</div>
              <div className="text-2xl font-semibold text-gray-900">
                {(
                  analyticsMetrics.totalLikes +
                  analyticsMetrics.totalComments +
                  analyticsMetrics.totalShares
                ).toLocaleString()}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-gray-600">Avg. Engagement</div>
              <div className="text-2xl font-semibold text-gray-900">
                {Math.round(analyticsMetrics.averageEngagement)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Select
                  value={selectedPlatform}
                  onValueChange={setSelectedPlatform}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="All Platforms" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Platforms</SelectItem>
                    <SelectItem value="linkedin">LinkedIn</SelectItem>
                    <SelectItem value="facebook">Facebook</SelectItem>
                    <SelectItem value="twitter">Twitter</SelectItem>
                    <SelectItem value="instagram">Instagram</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Select
                  value={selectedStatus}
                  onValueChange={setSelectedStatus}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search posts..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 h-9"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Posts Table */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex justify-between items-center">
              <CardTitle className="text-base">
                Posts ({filteredPosts.length})
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-200">
                  <TableHead className="text-gray-600 font-medium">
                    Content
                  </TableHead>
                  <TableHead className="text-gray-600 font-medium">
                    Platform
                  </TableHead>
                  <TableHead className="text-gray-600 font-medium">
                    Status
                  </TableHead>
                  <TableHead className="text-gray-600 font-medium">
                    Views
                  </TableHead>
                  <TableHead className="text-gray-600 font-medium">
                    Engagement
                  </TableHead>
                  <TableHead className="text-gray-600 font-medium">
                    Date
                  </TableHead>
                  <TableHead className="text-gray-600 font-medium w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPosts.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center py-8 text-gray-500"
                    >
                      No posts found matching your criteria
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPosts.map((post) => {
                    const totalEngagement =
                      post.likes_count +
                      post.comments_count +
                      post.shares_count;

                    return (
                      <TableRow key={post.id} className="border-gray-100">
                        <TableCell className="max-w-md">
                          <div className="space-y-1">
                            <p className="text-sm text-gray-900 line-clamp-2">
                              {post.content}
                            </p>
                            {post.hashtags.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {post.hashtags.slice(0, 2).map((tag, index) => (
                                  <span
                                    key={index}
                                    className="text-xs text-gray-500 bg-gray-50 px-1 py-0.5 rounded"
                                  >
                                    {tag}
                                  </span>
                                ))}
                                {post.hashtags.length > 2 && (
                                  <span className="text-xs text-gray-500">
                                    +{post.hashtags.length - 2}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-900 capitalize">
                            {post.platform}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`text-xs ${getStatusColor(post.status)}`}
                          >
                            {post.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-900">
                            {post.views_count.toLocaleString()}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <span className="text-sm font-medium text-gray-900">
                              {totalEngagement.toLocaleString()}
                            </span>
                            <div className="text-xs text-gray-500">
                              {post.likes_count}L · {post.comments_count}C ·{" "}
                              {post.shares_count}S
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-gray-900">
                            {post.published_at
                              ? formatDate(post.published_at)
                              : post.scheduled_at
                                ? `Scheduled ${formatDate(post.scheduled_at)}`
                                : formatDate(post.created_at)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => refreshMetrics(post.id)}
                              className="h-7 w-7 p-0"
                            >
                              <RefreshCw className="h-3 w-3" />
                            </Button>
                            {post.platform_url && (
                              <Button
                                size="sm"
                                variant="ghost"
                                asChild
                                className="h-7 w-7 p-0"
                              >
                                <a
                                  href={post.platform_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardWrapper>
  );
});

export default SocialAnalytics;
