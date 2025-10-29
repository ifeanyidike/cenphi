import { useState, useEffect } from "react";
import { observer } from "mobx-react-lite";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import {
  RefreshCw,
  ExternalLink,
  Search,
  Download,
  Eye,
  Copy,
  Share2,
  TrendingUp,
  Users,
  Link2,
  BarChart3,
  Heart,
  Linkedin,
  Twitter,
  Facebook,
  Instagram,
} from "lucide-react";
import {
  publicShareManager,
  PublicShare,
} from "@/repo/managers/public_share_manager";
import { socialManager, SocialPost } from "@/repo/managers/social_manager";
import { workspaceHub } from "@/repo/workspace_hub";
import { useToast } from "@/hooks/use-toast";

const Analytics = observer(() => {
  const [activeTab, setActiveTab] = useState<"shares" | "social">("shares");
  const [shares, setShares] = useState<PublicShare[]>([]);
  const [socialPosts, setSocialPosts] = useState<SocialPost[]>([]);
  // Start with loading false since we typically have data or will load without blocking UI
  const [loading, setLoading] = useState(false);
  const [showLoading, setShowLoading] = useState(false); // Delayed loading indicator
  const [refreshing, setRefreshing] = useState(false);

  // Share filters
  const [shareType, setShareType] = useState<string>("all");
  const [shareStatus, setShareStatus] = useState<string>("all");
  const [shareDateRange, setShareDateRange] = useState<string>("all");
  const [shareSearch, setShareSearch] = useState("");

  // Social filters
  const [socialPlatform, setSocialPlatform] = useState<string>("all");
  const [socialStatus, setSocialStatus] = useState<string>("all");
  const [socialSearch, setSocialSearch] = useState("");

  const { toast } = useToast();

  useEffect(() => {
    if (workspaceHub.workspace?.id) {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceHub.workspace?.id]);

  const loadData = async () => {
    if (!workspaceHub.workspace?.id) {
      return;
    }

    // Only show loading indicator if fetch takes longer than 300ms
    const loadingTimeout = setTimeout(() => {
      if (loading) {
        setShowLoading(true);
      }
    }, 300);

    try {
      const [sharesData, postsData] = await Promise.all([
        publicShareManager
          .getWorkspaceShares(workspaceHub.workspace.id)
          .catch(() => []),
        socialManager.getPosts(workspaceHub.workspace.id, 100).catch(() => []),
      ]);

      // Fetch metrics for shares
      if (sharesData && sharesData.length > 0) {
        const sharesWithMetrics = await Promise.all(
          sharesData.map(async (share) => {
            try {
              const metrics = await publicShareManager.getMetrics(share.id);
              return { ...share, metrics };
            } catch {
              return { ...share, metrics: null };
            }
          })
        );
        setShares(sharesWithMetrics as any);
      } else {
        setShares([]);
      }

      setSocialPosts(postsData || []);
    } catch (error) {
      console.error("Failed to load analytics:", error);
      setShares([]);
      setSocialPosts([]);
    } finally {
      clearTimeout(loadingTimeout);
      setLoading(false);
      setShowLoading(false);
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
        title: "Refresh failed",
        description: "Could not refresh analytics. Please try again.",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  };

  // Filter shares
  const filteredShares = shares.filter((share) => {
    const matchesType = shareType === "all" || share.share_type === shareType;
    const matchesStatus =
      shareStatus === "all" ||
      (shareStatus === "active" && share.is_active) ||
      (shareStatus === "inactive" && !share.is_active) ||
      (shareStatus === "expired" &&
        share.expires_at &&
        new Date(share.expires_at) < new Date());
    const matchesSearch =
      shareSearch === "" ||
      share.id.toLowerCase().includes(shareSearch.toLowerCase());

    let matchesDate = true;
    if (shareDateRange !== "all" && share.created_at) {
      const createdDate = new Date(share.created_at);
      const now = new Date();
      const daysDiff = Math.floor(
        (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      switch (shareDateRange) {
        case "7days":
          matchesDate = daysDiff <= 7;
          break;
        case "30days":
          matchesDate = daysDiff <= 30;
          break;
        case "90days":
          matchesDate = daysDiff <= 90;
          break;
      }
    }

    return matchesType && matchesStatus && matchesSearch && matchesDate;
  });

  // Filter social posts
  const filteredPosts = socialPosts.filter((post) => {
    const matchesPlatform =
      socialPlatform === "all" || post.platform === socialPlatform;
    const matchesStatus =
      socialStatus === "all" || post.status === socialStatus;
    const matchesSearch =
      socialSearch === "" ||
      post.content.toLowerCase().includes(socialSearch.toLowerCase());

    return matchesPlatform && matchesStatus && matchesSearch;
  });

  // Share metrics
  const shareMetrics = {
    totalShares: filteredShares.length,
    activeShares: filteredShares.filter((s) => s.is_active).length,
    totalViews: filteredShares.reduce(
      (sum, share) => sum + (share.metrics?.view_count || 0),
      0
    ),
    uniqueVisitors: filteredShares.reduce(
      (sum, share) => sum + (share.metrics?.unique_visitor_count || 0),
      0
    ),
    totalEngagement: filteredShares.reduce(
      (sum, share) =>
        sum +
        (share.metrics?.play_count || 0) +
        (share.metrics?.download_count || 0) +
        (share.metrics?.linkedin_share_count || 0) +
        (share.metrics?.twitter_share_count || 0) +
        (share.metrics?.facebook_share_count || 0),
      0
    ),
  };

  // Social metrics
  const socialMetrics = {
    totalPosts: filteredPosts.length,
    publishedPosts: filteredPosts.filter((p) => p.status === "published")
      .length,
    totalViews: filteredPosts.reduce((sum, p) => sum + p.views_count, 0),
    totalEngagement: filteredPosts.reduce(
      (sum, p) => sum + p.likes_count + p.comments_count + p.shares_count,
      0
    ),
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case "linkedin":
        return <Linkedin className="h-3.5 w-3.5" />;
      case "twitter":
        return <Twitter className="h-3.5 w-3.5" />;
      case "facebook":
        return <Facebook className="h-3.5 w-3.5" />;
      case "instagram":
        return <Instagram className="h-3.5 w-3.5" />;
      default:
        return <Share2 className="h-3.5 w-3.5" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      published: "bg-emerald-50 text-emerald-700 border-emerald-200",
      scheduled: "bg-blue-50 text-blue-700 border-blue-200",
      draft: "bg-gray-50 text-gray-600 border-gray-200",
      failed: "bg-red-50 text-red-700 border-red-200",
      active: "bg-emerald-50 text-emerald-700 border-emerald-200",
      inactive: "bg-gray-50 text-gray-600 border-gray-200",
      expired: "bg-orange-50 text-orange-700 border-orange-200",
    };

    return (
      <Badge
        variant="outline"
        className={`text-[10px] px-1.5 py-0 ${styles[status as keyof typeof styles] || styles.draft}`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const copyShareLink = (shareId: string) => {
    const shareUrl = `${window.location.origin}/share/${shareId}/view`;
    navigator.clipboard.writeText(shareUrl);
    toast({
      title: "Link copied",
      description: "Share link copied to clipboard",
    });
  };

  const downloadCSV = () => {
    const data = activeTab === "shares" ? filteredShares : filteredPosts;
    const filename = `${activeTab}_analytics_${new Date().toISOString().split("T")[0]}.csv`;

    let csvContent: string;
    if (activeTab === "shares") {
      const headers = [
        "ID",
        "Type",
        "Status",
        "Views",
        "Visitors",
        "Engagement",
        "Created",
      ];
      const rows = (data as PublicShare[]).map((share) => [
        share.id,
        share.share_type,
        share.is_active ? "Active" : "Inactive",
        share.metrics?.view_count || 0,
        share.metrics?.unique_visitor_count || 0,
        (share.metrics?.play_count || 0) + (share.metrics?.download_count || 0),
        share.created_at,
      ]);
      csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join(
        "\n"
      );
    } else {
      const headers = [
        "Platform",
        "Content",
        "Status",
        "Views",
        "Likes",
        "Comments",
        "Shares",
        "Published",
      ];
      const rows = (data as SocialPost[]).map((post) => [
        post.platform,
        `"${post.content.replace(/"/g, '""')}"`,
        post.status,
        post.views_count,
        post.likes_count,
        post.comments_count,
        post.shares_count,
        post.published_at || post.created_at,
      ]);
      csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join(
        "\n"
      );
    }

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Analytics</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Track performance of your shared content and social media posts
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={downloadCSV} variant="outline" size="sm">
            <Download className="h-3.5 w-3.5 mr-1.5" />
            <span className="text-xs">Export</span>
          </Button>
          <Button
            onClick={refreshData}
            disabled={loading || refreshing}
            variant="outline"
            size="sm"
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
            Public Shares
          </TabsTrigger>
          <TabsTrigger value="social" className="text-xs">
            Social Posts
          </TabsTrigger>
        </TabsList>

        {/* Public Shares Tab */}
        <TabsContent value="shares" className="space-y-4 mt-5">
          {/* Share Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
            <Card className="border-gray-200">
              <CardContent className="p-3.5">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="p-1.5 bg-blue-50 rounded-lg">
                    <Link2 className="h-3.5 w-3.5 text-blue-600" />
                  </div>
                  <span className="text-[10px] font-medium text-gray-600 uppercase tracking-wide">
                    Total Shares
                  </span>
                </div>
                <div className="text-xl font-semibold text-gray-900">
                  {shareMetrics.totalShares}
                </div>
                <div className="text-[10px] text-gray-500 mt-0.5">
                  {shareMetrics.activeShares} active
                </div>
              </CardContent>
            </Card>

            <Card className="border-gray-200">
              <CardContent className="p-3.5">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="p-1.5 bg-emerald-50 rounded-lg">
                    <Eye className="h-3.5 w-3.5 text-emerald-600" />
                  </div>
                  <span className="text-[10px] font-medium text-gray-600 uppercase tracking-wide">
                    Total Views
                  </span>
                </div>
                <div className="text-xl font-semibold text-gray-900">
                  {shareMetrics.totalViews.toLocaleString()}
                </div>
                <div className="text-[10px] text-gray-500 mt-0.5">
                  Across all shares
                </div>
              </CardContent>
            </Card>

            <Card className="border-gray-200">
              <CardContent className="p-3.5">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="p-1.5 bg-purple-50 rounded-lg">
                    <Users className="h-3.5 w-3.5 text-purple-600" />
                  </div>
                  <span className="text-[10px] font-medium text-gray-600 uppercase tracking-wide">
                    Unique Visitors
                  </span>
                </div>
                <div className="text-xl font-semibold text-gray-900">
                  {shareMetrics.uniqueVisitors.toLocaleString()}
                </div>
                <div className="text-[10px] text-gray-500 mt-0.5">
                  {shareMetrics.totalViews > 0
                    ? (
                        (shareMetrics.uniqueVisitors /
                          shareMetrics.totalViews) *
                        100
                      ).toFixed(0)
                    : 0}
                  % unique rate
                </div>
              </CardContent>
            </Card>

            <Card className="border-gray-200">
              <CardContent className="p-3.5">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="p-1.5 bg-indigo-50 rounded-lg">
                    <TrendingUp className="h-3.5 w-3.5 text-indigo-600" />
                  </div>
                  <span className="text-[10px] font-medium text-gray-600 uppercase tracking-wide">
                    Engagement
                  </span>
                </div>
                <div className="text-xl font-semibold text-gray-900">
                  {shareMetrics.totalEngagement.toLocaleString()}
                </div>
                <div className="text-[10px] text-gray-500 mt-0.5">
                  Plays + Downloads
                </div>
              </CardContent>
            </Card>

            <Card className="border-gray-200">
              <CardContent className="p-3.5">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="p-1.5 bg-amber-50 rounded-lg">
                    <BarChart3 className="h-3.5 w-3.5 text-amber-600" />
                  </div>
                  <span className="text-[10px] font-medium text-gray-600 uppercase tracking-wide">
                    Avg per Share
                  </span>
                </div>
                <div className="text-xl font-semibold text-gray-900">
                  {shareMetrics.totalShares > 0
                    ? Math.round(
                        shareMetrics.totalViews / shareMetrics.totalShares
                      )
                    : 0}
                </div>
                <div className="text-[10px] text-gray-500 mt-0.5">
                  Average views
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Share Filters */}
          <Card className="border-gray-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-gray-900">
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                <Select value={shareType} onValueChange={setShareType}>
                  <SelectTrigger className="h-8 text-xs border-gray-200">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-xs">
                      All Types
                    </SelectItem>
                    <SelectItem value="testimonial" className="text-xs">
                      Testimonials
                    </SelectItem>
                    <SelectItem value="artifact" className="text-xs">
                      Artifacts
                    </SelectItem>
                  </SelectContent>
                </Select>

                <Select value={shareStatus} onValueChange={setShareStatus}>
                  <SelectTrigger className="h-8 text-xs border-gray-200">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-xs">
                      All Status
                    </SelectItem>
                    <SelectItem value="active" className="text-xs">
                      Active
                    </SelectItem>
                    <SelectItem value="inactive" className="text-xs">
                      Inactive
                    </SelectItem>
                    <SelectItem value="expired" className="text-xs">
                      Expired
                    </SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={shareDateRange}
                  onValueChange={setShareDateRange}
                >
                  <SelectTrigger className="h-8 text-xs border-gray-200">
                    <SelectValue placeholder="All Time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-xs">
                      All Time
                    </SelectItem>
                    <SelectItem value="7days" className="text-xs">
                      Last 7 days
                    </SelectItem>
                    <SelectItem value="30days" className="text-xs">
                      Last 30 days
                    </SelectItem>
                    <SelectItem value="90days" className="text-xs">
                      Last 90 days
                    </SelectItem>
                  </SelectContent>
                </Select>

                <div className="md:col-span-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-gray-400" />
                    <Input
                      placeholder="Search by ID..."
                      value={shareSearch}
                      onChange={(e) => setShareSearch(e.target.value)}
                      className="pl-7 h-8 text-xs border-gray-200"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Shares Table */}
          <Card className="border-gray-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-gray-900">
                Public Shares ({filteredShares.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-200">
                      <TableHead className="text-[11px] text-gray-600 font-semibold">
                        Share ID
                      </TableHead>
                      <TableHead className="text-[11px] text-gray-600 font-semibold">
                        Type
                      </TableHead>
                      <TableHead className="text-[11px] text-gray-600 font-semibold">
                        Status
                      </TableHead>
                      <TableHead className="text-[11px] text-gray-600 font-semibold text-right">
                        Views
                      </TableHead>
                      <TableHead className="text-[11px] text-gray-600 font-semibold text-right">
                        Visitors
                      </TableHead>
                      <TableHead className="text-[11px] text-gray-600 font-semibold text-right">
                        Engagement
                      </TableHead>
                      <TableHead className="text-[11px] text-gray-600 font-semibold">
                        Created
                      </TableHead>
                      <TableHead className="text-[11px] text-gray-600 font-semibold w-16"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {showLoading ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-12">
                          <div className="flex flex-col items-center gap-2">
                            <RefreshCw className="h-5 w-5 text-gray-400 animate-spin" />
                            <span className="text-xs text-gray-500">
                              Loading...
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : filteredShares.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-12">
                          <div className="flex flex-col items-center gap-3">
                            <div className="p-3 bg-gray-50 rounded-full">
                              <Link2 className="h-6 w-6 text-gray-400" />
                            </div>
                            <div className="space-y-1">
                              <p className="text-sm font-medium text-gray-900">
                                {shares.length === 0
                                  ? "No public shares yet"
                                  : "No shares match filters"}
                              </p>
                              <p className="text-xs text-gray-500 max-w-sm">
                                {shares.length === 0
                                  ? "Create public share links to track their performance"
                                  : "Try adjusting your filters"}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredShares.map((share) => {
                        const shareStatusText = !share.is_active
                          ? "inactive"
                          : share.expires_at &&
                              new Date(share.expires_at) < new Date()
                            ? "expired"
                            : "active";

                        return (
                          <TableRow key={share.id} className="border-gray-100">
                            <TableCell className="max-w-[150px]">
                              <p className="text-[11px] text-gray-900 font-mono truncate">
                                {share.id.split("-")[0]}...
                              </p>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={`text-[10px] px-1.5 py-0 ${
                                  share.share_type === "testimonial"
                                    ? "bg-blue-50 text-blue-700 border-blue-200"
                                    : "bg-purple-50 text-purple-700 border-purple-200"
                                }`}
                              >
                                {share.share_type === "testimonial"
                                  ? "Testimonial"
                                  : "Artifact"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {getStatusBadge(shareStatusText)}
                            </TableCell>
                            <TableCell className="text-right">
                              <span className="text-xs font-medium text-gray-900">
                                {(
                                  share.metrics?.view_count || 0
                                ).toLocaleString()}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <span className="text-xs font-medium text-gray-900">
                                {(
                                  share.metrics?.unique_visitor_count || 0
                                ).toLocaleString()}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <span className="text-xs font-medium text-gray-900">
                                {(
                                  (share.metrics?.play_count || 0) +
                                  (share.metrics?.download_count || 0)
                                ).toLocaleString()}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-0.5">
                                <div className="text-xs text-gray-900">
                                  {formatDate(share.created_at)}
                                </div>
                                <div className="text-[10px] text-gray-500">
                                  {formatTime(share.created_at)}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => copyShareLink(share.id)}
                                  className="h-6 w-6 p-0"
                                  title="Copy link"
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  asChild
                                  className="h-6 w-6 p-0"
                                  title="Open"
                                >
                                  <a
                                    href={`/share/${share.id}/view`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    <ExternalLink className="h-3 w-3" />
                                  </a>
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Social Posts Tab */}
        <TabsContent value="social" className="space-y-4 mt-5">
          {/* Social Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <Card className="border-gray-200">
              <CardContent className="p-3.5">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="p-1.5 bg-blue-50 rounded-lg">
                    <Share2 className="h-3.5 w-3.5 text-blue-600" />
                  </div>
                  <span className="text-[10px] font-medium text-gray-600 uppercase tracking-wide">
                    Total Posts
                  </span>
                </div>
                <div className="text-xl font-semibold text-gray-900">
                  {socialMetrics.totalPosts}
                </div>
                <div className="text-[10px] text-gray-500 mt-0.5">
                  {socialMetrics.publishedPosts} published
                </div>
              </CardContent>
            </Card>

            <Card className="border-gray-200">
              <CardContent className="p-3.5">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="p-1.5 bg-emerald-50 rounded-lg">
                    <Eye className="h-3.5 w-3.5 text-emerald-600" />
                  </div>
                  <span className="text-[10px] font-medium text-gray-600 uppercase tracking-wide">
                    Total Views
                  </span>
                </div>
                <div className="text-xl font-semibold text-gray-900">
                  {socialMetrics.totalViews.toLocaleString()}
                </div>
                <div className="text-[10px] text-gray-500 mt-0.5">
                  Across all posts
                </div>
              </CardContent>
            </Card>

            <Card className="border-gray-200">
              <CardContent className="p-3.5">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="p-1.5 bg-purple-50 rounded-lg">
                    <Heart className="h-3.5 w-3.5 text-purple-600" />
                  </div>
                  <span className="text-[10px] font-medium text-gray-600 uppercase tracking-wide">
                    Engagement
                  </span>
                </div>
                <div className="text-xl font-semibold text-gray-900">
                  {socialMetrics.totalEngagement.toLocaleString()}
                </div>
                <div className="text-[10px] text-gray-500 mt-0.5">
                  Likes + Comments
                </div>
              </CardContent>
            </Card>

            <Card className="border-gray-200">
              <CardContent className="p-3.5">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="p-1.5 bg-amber-50 rounded-lg">
                    <BarChart3 className="h-3.5 w-3.5 text-amber-600" />
                  </div>
                  <span className="text-[10px] font-medium text-gray-600 uppercase tracking-wide">
                    Avg per Post
                  </span>
                </div>
                <div className="text-xl font-semibold text-gray-900">
                  {socialMetrics.totalPosts > 0
                    ? Math.round(
                        socialMetrics.totalEngagement / socialMetrics.totalPosts
                      )
                    : 0}
                </div>
                <div className="text-[10px] text-gray-500 mt-0.5">
                  Average engagement
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Social Filters */}
          <Card className="border-gray-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-gray-900">
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <Select
                  value={socialPlatform}
                  onValueChange={setSocialPlatform}
                >
                  <SelectTrigger className="h-8 text-xs border-gray-200">
                    <SelectValue placeholder="All Platforms" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-xs">
                      All Platforms
                    </SelectItem>
                    <SelectItem value="linkedin" className="text-xs">
                      LinkedIn
                    </SelectItem>
                    <SelectItem value="twitter" className="text-xs">
                      Twitter
                    </SelectItem>
                    <SelectItem value="facebook" className="text-xs">
                      Facebook
                    </SelectItem>
                    <SelectItem value="instagram" className="text-xs">
                      Instagram
                    </SelectItem>
                  </SelectContent>
                </Select>

                <Select value={socialStatus} onValueChange={setSocialStatus}>
                  <SelectTrigger className="h-8 text-xs border-gray-200">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-xs">
                      All Status
                    </SelectItem>
                    <SelectItem value="published" className="text-xs">
                      Published
                    </SelectItem>
                    <SelectItem value="scheduled" className="text-xs">
                      Scheduled
                    </SelectItem>
                    <SelectItem value="draft" className="text-xs">
                      Draft
                    </SelectItem>
                    <SelectItem value="failed" className="text-xs">
                      Failed
                    </SelectItem>
                  </SelectContent>
                </Select>

                <div className="md:col-span-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-gray-400" />
                    <Input
                      placeholder="Search posts..."
                      value={socialSearch}
                      onChange={(e) => setSocialSearch(e.target.value)}
                      className="pl-7 h-8 text-xs border-gray-200"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Social Posts Table */}
          <Card className="border-gray-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-gray-900">
                Social Posts ({filteredPosts.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-200">
                      <TableHead className="text-[11px] text-gray-600 font-semibold">
                        Content
                      </TableHead>
                      <TableHead className="text-[11px] text-gray-600 font-semibold">
                        Platform
                      </TableHead>
                      <TableHead className="text-[11px] text-gray-600 font-semibold">
                        Status
                      </TableHead>
                      <TableHead className="text-[11px] text-gray-600 font-semibold text-right">
                        Views
                      </TableHead>
                      <TableHead className="text-[11px] text-gray-600 font-semibold text-right">
                        Likes
                      </TableHead>
                      <TableHead className="text-[11px] text-gray-600 font-semibold text-right">
                        Comments
                      </TableHead>
                      <TableHead className="text-[11px] text-gray-600 font-semibold">
                        Date
                      </TableHead>
                      <TableHead className="text-[11px] text-gray-600 font-semibold w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {showLoading ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-12">
                          <div className="flex flex-col items-center gap-2">
                            <RefreshCw className="h-5 w-5 text-gray-400 animate-spin" />
                            <span className="text-xs text-gray-500">
                              Loading...
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : filteredPosts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-12">
                          <div className="flex flex-col items-center gap-3">
                            <div className="p-3 bg-gray-50 rounded-full">
                              <Share2 className="h-6 w-6 text-gray-400" />
                            </div>
                            <div className="space-y-1">
                              <p className="text-sm font-medium text-gray-900">
                                {socialPosts.length === 0
                                  ? "No social posts yet"
                                  : "No posts match filters"}
                              </p>
                              <p className="text-xs text-gray-500 max-w-sm">
                                {socialPosts.length === 0
                                  ? "Publish content to social media to track performance"
                                  : "Try adjusting your filters"}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredPosts.map((post) => (
                        <TableRow key={post.id} className="border-gray-100">
                          <TableCell className="max-w-md">
                            <p className="text-xs text-gray-900 line-clamp-2">
                              {post.content}
                            </p>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              {getPlatformIcon(post.platform)}
                              <span className="text-xs text-gray-900 capitalize">
                                {post.platform}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(post.status)}</TableCell>
                          <TableCell className="text-right">
                            <span className="text-xs font-medium text-gray-900">
                              {post.views_count.toLocaleString()}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="text-xs font-medium text-gray-900">
                              {post.likes_count.toLocaleString()}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="text-xs font-medium text-gray-900">
                              {post.comments_count.toLocaleString()}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="text-xs text-gray-900">
                              {post.published_at
                                ? formatDate(post.published_at)
                                : post.scheduled_at
                                  ? `Scheduled ${formatDate(post.scheduled_at)}`
                                  : formatDate(post.created_at)}
                            </div>
                          </TableCell>
                          <TableCell>
                            {post.platform_url && (
                              <Button
                                size="sm"
                                variant="ghost"
                                asChild
                                className="h-6 w-6 p-0"
                                title="View post"
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
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
});

export default Analytics;
