import { useState, useEffect } from "react";
import { observer } from "mobx-react-lite";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Clock,
  Edit2,
  Trash2,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Linkedin,
  Eye,
  TrendingUp,
  Filter,
  Send,
} from "lucide-react";
import { socialManager, SocialPost } from "@/repo/managers/social_manager";
import { workspaceHub } from "@/repo/workspace_hub";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

const SchedulingPage = observer(() => {
  const [activeTab, setActiveTab] = useState<string>("all");
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPost, setSelectedPost] = useState<SocialPost | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [platformFilter, setPlatformFilter] = useState<string>("all");
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    postId: string | null;
  }>({
    isOpen: false,
    postId: null,
  });
  const { toast } = useToast();

  useEffect(() => {
    if (workspaceHub.workspace?.id) {
      loadPosts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceHub.workspace?.id]);

  const loadPosts = async () => {
    if (!workspaceHub.workspace?.id) return;

    try {
      const postsData = await socialManager.getPosts(
        workspaceHub.workspace.id,
        100
      );
      setPosts(postsData || []);
    } catch (error) {
      console.error("Failed to load posts:", error);
      toast({
        title: "Error",
        description: "Failed to load posts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshPosts = async () => {
    setRefreshing(true);
    try {
      await loadPosts();
      toast({
        title: "Success",
        description: "Posts refreshed successfully",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to refresh posts",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  };

  const handleDeleteClick = (postId: string) => {
    setDeleteConfirm({
      isOpen: true,
      postId,
    });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm.postId) return;

    try {
      await socialManager.deletePost(deleteConfirm.postId);
      toast({
        title: "Success",
        description: "Post deleted successfully",
      });
      loadPosts();
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete post",
        variant: "destructive",
      });
    }
  };

  const filterPosts = (posts: SocialPost[]) => {
    return posts.filter((post) => {
      const matchesStatus =
        statusFilter === "all" || post.status === statusFilter;
      const matchesPlatform =
        platformFilter === "all" || post.platform === platformFilter;

      const matchesTab =
        activeTab === "all" ||
        (activeTab === "scheduled" && post.status === "scheduled") ||
        (activeTab === "published" && post.status === "published") ||
        (activeTab === "draft" && post.status === "draft");

      return matchesStatus && matchesPlatform && matchesTab;
    });
  };

  const filteredPosts = filterPosts(posts);

  // Calculate metrics
  const metrics = {
    total: posts.length,
    scheduled: posts.filter((p) => p.status === "scheduled").length,
    published: posts.filter((p) => p.status === "published").length,
    draft: posts.filter((p) => p.status === "draft").length,
    failed: posts.filter((p) => p.status === "failed").length,
    totalViews: posts.reduce((sum, p) => sum + p.views_count, 0),
    totalEngagement: posts.reduce(
      (sum, p) => sum + p.likes_count + p.comments_count + p.shares_count,
      0
    ),
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "published":
        return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />;
      case "scheduled":
        return <Clock className="h-3.5 w-3.5 text-blue-600" />;
      case "draft":
        return <Edit2 className="h-3.5 w-3.5 text-gray-600" />;
      case "failed":
        return <XCircle className="h-3.5 w-3.5 text-red-600" />;
      default:
        return <AlertCircle className="h-3.5 w-3.5 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      published: "bg-emerald-50 text-emerald-700 border-emerald-200",
      scheduled: "bg-blue-50 text-blue-700 border-blue-200",
      draft: "bg-gray-50 text-gray-600 border-gray-200",
      failed: "bg-red-50 text-red-700 border-red-200",
    };

    return (
      <div className="flex items-center gap-1.5">
        {getStatusIcon(status)}
        <Badge
          variant="outline"
          className={`text-[10px] px-1.5 py-0 ${
            styles[status as keyof typeof styles] || styles.draft
          }`}
        >
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Badge>
      </div>
    );
  };

  const formatDateTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return {
        date: format(date, "MMM dd, yyyy"),
        time: format(date, "h:mm a"),
      };
    } catch {
      return { date: "N/A", time: "" };
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">
            Scheduling & Posting
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Manage and schedule your social media posts
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={refreshPosts}
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

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="border-gray-200">
          <CardContent className="p-3.5">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="p-1.5 bg-blue-50 rounded-lg">
                <Send className="h-3.5 w-3.5 text-blue-600" />
              </div>
              <span className="text-[10px] font-medium text-gray-600 uppercase tracking-wide">
                Total Posts
              </span>
            </div>
            <div className="text-xl font-semibold text-gray-900">
              {metrics.total}
            </div>
            <div className="text-[10px] text-gray-500 mt-0.5">
              {metrics.published} published
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardContent className="p-3.5">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="p-1.5 bg-amber-50 rounded-lg">
                <Clock className="h-3.5 w-3.5 text-amber-600" />
              </div>
              <span className="text-[10px] font-medium text-gray-600 uppercase tracking-wide">
                Scheduled
              </span>
            </div>
            <div className="text-xl font-semibold text-gray-900">
              {metrics.scheduled}
            </div>
            <div className="text-[10px] text-gray-500 mt-0.5">
              Waiting to publish
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
              {metrics.totalViews.toLocaleString()}
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
                <TrendingUp className="h-3.5 w-3.5 text-purple-600" />
              </div>
              <span className="text-[10px] font-medium text-gray-600 uppercase tracking-wide">
                Engagement
              </span>
            </div>
            <div className="text-xl font-semibold text-gray-900">
              {metrics.totalEngagement.toLocaleString()}
            </div>
            <div className="text-[10px] text-gray-500 mt-0.5">
              Likes + Comments
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-gray-200">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-600" />
            <CardTitle className="text-sm font-semibold text-gray-900">
              Filters
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <Label className="text-[11px] font-medium text-gray-700 mb-1.5 block">
                Status
              </Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-8 text-xs border-gray-200">
                  <SelectValue />
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
            </div>

            <div>
              <Label className="text-[11px] font-medium text-gray-700 mb-1.5 block">
                Platform
              </Label>
              <Select value={platformFilter} onValueChange={setPlatformFilter}>
                <SelectTrigger className="h-8 text-xs border-gray-200">
                  <SelectValue />
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
                </SelectContent>
              </Select>
            </div>

            {(statusFilter !== "all" || platformFilter !== "all") && (
              <div className="flex items-end">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => {
                    setStatusFilter("all");
                    setPlatformFilter("all");
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-md grid-cols-4 h-9">
          <TabsTrigger value="all" className="text-xs">
            All
          </TabsTrigger>
          <TabsTrigger value="scheduled" className="text-xs">
            Scheduled
          </TabsTrigger>
          <TabsTrigger value="published" className="text-xs">
            Published
          </TabsTrigger>
          <TabsTrigger value="draft" className="text-xs">
            Drafts
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-5">
          <Card className="border-gray-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-gray-900">
                Posts ({filteredPosts.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <PostsTable
                posts={filteredPosts}
                loading={loading}
                onEdit={(post) => {
                  setSelectedPost(post);
                  setIsEditDialogOpen(true);
                }}
                onDelete={handleDeleteClick}
                formatDateTime={formatDateTime}
                getStatusBadge={getStatusBadge}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      {selectedPost && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl">
            <EditPostDialog
              post={selectedPost}
              onClose={() => {
                setIsEditDialogOpen(false);
                setSelectedPost(null);
              }}
              onSuccess={loadPosts}
            />
          </DialogContent>
        </Dialog>
      )}

      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, postId: null })}
        onConfirm={handleDeleteConfirm}
        title="Delete Post"
        message="Are you sure you want to delete this post? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
});

// Posts Table Component
const PostsTable = observer(
  ({
    posts,
    loading,
    onEdit,
    onDelete,
    formatDateTime,
    getStatusBadge,
  }: {
    posts: SocialPost[];
    loading: boolean;
    onEdit: (post: SocialPost) => void;
    onDelete: (id: string) => void;
    formatDateTime: (date: string) => { date: string; time: string };
    getStatusBadge: (status: string) => JSX.Element;
  }) => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <RefreshCw className="h-6 w-6 text-gray-400 animate-spin mb-2" />
          <span className="text-xs text-gray-500">Loading posts...</span>
        </div>
      );
    }

    if (posts.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="p-3 bg-gray-50 rounded-full mb-3">
            <Send className="h-6 w-6 text-gray-400" />
          </div>
          <p className="text-sm font-medium text-gray-900 mb-1">
            No posts found
          </p>
          <p className="text-xs text-gray-500">
            Create your first post to get started
          </p>
        </div>
      );
    }

    return (
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
                Engagement
              </TableHead>
              <TableHead className="text-[11px] text-gray-600 font-semibold">
                Date
              </TableHead>
              <TableHead className="text-[11px] text-gray-600 font-semibold w-24">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {posts.map((post) => {
              const dateTime = post.scheduled_at
                ? formatDateTime(post.scheduled_at)
                : post.published_at
                  ? formatDateTime(post.published_at)
                  : formatDateTime(post.created_at);

              return (
                <TableRow key={post.id} className="border-gray-100">
                  <TableCell className="max-w-md">
                    <p className="text-xs text-gray-900 line-clamp-2">
                      {post.content}
                    </p>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <Linkedin className="h-3.5 w-3.5 text-blue-600" />
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
                      {(
                        post.likes_count +
                        post.comments_count +
                        post.shares_count
                      ).toLocaleString()}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-0.5">
                      <div className="text-xs text-gray-900">
                        {dateTime.date}
                      </div>
                      {dateTime.time && (
                        <div className="text-[10px] text-gray-500">
                          {dateTime.time}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {/* Only show edit/delete for draft, scheduled, and failed posts */}
                      {post.status !== "published" && (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onEdit(post)}
                            className="h-6 w-6 p-0"
                            title={post.status === "scheduled" ? "Edit scheduled post" : "Edit"}
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onDelete(post.id)}
                            className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                            title="Delete"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </>
                      )}
                      {post.status === "published" && (
                        <span className="text-[10px] text-gray-400 italic">
                          Published
                        </span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    );
  }
);

// Edit Post Dialog Component
const EditPostDialog = observer(
  ({
    post,
    onClose,
    onSuccess,
  }: {
    post: SocialPost;
    onClose: () => void;
    onSuccess: () => void;
  }) => {
    const [content, setContent] = useState(post.content);
    const [scheduledDate, setScheduledDate] = useState(
      post.scheduled_at ? format(new Date(post.scheduled_at), "yyyy-MM-dd") : ""
    );
    const [scheduledTime, setScheduledTime] = useState(
      post.scheduled_at ? format(new Date(post.scheduled_at), "HH:mm") : ""
    );
    const [saving, setSaving] = useState(false);
    const { toast } = useToast();

    const handleSubmit = async () => {
      if (!content.trim()) {
        toast({
          title: "Error",
          description: "Post content is required",
          variant: "destructive",
        });
        return;
      }

      setSaving(true);
      try {
        const updateData: any = {
          content: content.trim(),
        };

        // If post is scheduled, allow updating the scheduled time
        if (post.status === "scheduled" && scheduledDate && scheduledTime) {
          const scheduledAt = new Date(
            `${scheduledDate}T${scheduledTime}`
          ).toISOString();
          updateData.scheduled_at = scheduledAt;
        }

        await socialManager.updatePost(post.id, updateData);

        toast({
          title: "Success",
          description: "Post updated successfully",
        });
        onSuccess();
        onClose();
      } catch {
        toast({
          title: "Error",
          description: "Failed to update post",
          variant: "destructive",
        });
      } finally {
        setSaving(false);
      }
    };

    return (
      <>
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">
            Edit Post
          </DialogTitle>
          <DialogDescription className="text-xs">
            Update your scheduled post
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label className="text-[11px] font-medium text-gray-700 mb-1.5 block">
              Content
            </Label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your post content..."
              className="min-h-[120px] text-xs resize-none"
            />
            <div className="flex justify-between mt-1.5">
              <span className="text-[10px] text-gray-500">
                {content.length} / 3000 characters
              </span>
            </div>
          </div>

          {post.status === "scheduled" && (
            <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded-lg">
              <div>
                <Label className="text-[11px] font-medium text-gray-700 mb-1.5 block">
                  Scheduled Date
                </Label>
                <Input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
              <div>
                <Label className="text-[11px] font-medium text-gray-700 mb-1.5 block">
                  Scheduled Time
                </Label>
                <Input
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
            </div>
          )}

          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-[11px] font-medium text-blue-900">
                  Status: {post.status}
                </p>
                <p className="text-[10px] text-blue-700 mt-0.5">
                  {post.status === "published"
                    ? "This post has been published and cannot be rescheduled."
                    : post.status === "scheduled"
                      ? "You can reschedule this post before it publishes."
                      : "You can update this draft and schedule it."}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={saving}
            size="sm"
            className="h-8 text-xs"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={saving}
            size="sm"
            className="h-8 text-xs bg-blue-600 hover:bg-blue-700"
          >
            {saving ? (
              <>
                <RefreshCw className="h-3 w-3 mr-1.5 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </>
    );
  }
);

export default SchedulingPage;
