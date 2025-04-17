// src/components/collection-setup/social/SocialContentModeration.tsx
import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle,
  XCircle,
  Filter,
  MessageSquare,
  Sliders,
  User,
  Calendar,
  Star,
  MoreHorizontal,
  Heart,
  ThumbsUp,
  Eye,
  PieChart,
  Trash2,
  Clock,
  AlertCircle,
  CheckCircle2,
  AlarmClock,
  Sparkles,
  Edit,
  Link,
  LayoutList,
  RefreshCw,
  SlidersHorizontal,
  Search,
  Instagram,
  Twitter,
  Facebook,
  Linkedin,
  Command,
  Youtube,
  Info,
  BarChart,
  ExternalLink,
  ArrowRight,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { cn } from "@/lib/utils";
import { SocialPlatformName } from "@/types/setup";

interface SocialContentModerationProps {
  showToast: (toast: {
    title: string;
    description: string;
    variant?: "default" | "destructive";
  }) => void;
}

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

// Severity levels
const severityLevels = [
  { value: "positive", label: "Positive", color: "green" },
  { value: "neutral", label: "Neutral", color: "blue" },
  { value: "needs-review", label: "Needs Review", color: "amber" },
  { value: "negative", label: "Negative", color: "red" },
  { value: "spam", label: "Spam", color: "slate" },
];

// Mock data for social content queue
const mockContentQueue = [
  {
    id: "c1",
    platform: "instagram" as SocialPlatformName,
    type: "post",
    content:
      "Just got my new @brandname product and I'm absolutely in love with it! The quality is amazing and the customer service was top-notch. Highly recommend to anyone looking for this kind of solution!",
    user: {
      name: "Jessica Palmer",
      handle: "jesspalmer",
      avatar: "https://randomuser.me/api/portraits/women/32.jpg",
      followers: 2540,
      verified: false,
    },
    date: "2023-11-15T14:30:00Z",
    sentiment: "positive",
    engagementScore: 87,
    status: "pending",
    mediaUrl: "https://placehold.co/600x400/e0f2fe/0ea5e9?text=Product+Image",
    likes: 124,
    comments: 18,
    requestSent: false,
    permissionGranted: false,
    campaign: "summer_launch",
    hashtags: ["brandname", "productlaunch", "review"],
    aiAnalysis: {
      topics: ["quality", "customer service", "recommendation"],
      keywords: ["love", "amazing", "recommend", "top-notch"],
      score: 9.2,
    },
  },
  {
    id: "c2",
    platform: "twitter" as SocialPlatformName,
    type: "tweet",
    content:
      "Been using @brandname's software for 3 months now and it's completely transformed our workflow. Saved us hours every week! #ProductivityWin",
    user: {
      name: "Mark Richardson",
      handle: "markrich",
      avatar: "https://randomuser.me/api/portraits/men/45.jpg",
      followers: 1120,
      verified: true,
    },
    date: "2023-11-12T09:15:00Z",
    sentiment: "positive",
    engagementScore: 75,
    status: "approved",
    mediaUrl: null,
    likes: 87,
    comments: 7,
    requestSent: true,
    permissionGranted: true,
    campaign: null,
    hashtags: ["ProductivityWin"],
    aiAnalysis: {
      topics: ["productivity", "time-saving", "workflow"],
      keywords: ["transformed", "saved", "hours"],
      score: 8.5,
    },
  },
  {
    id: "c3",
    platform: "facebook" as SocialPlatformName,
    type: "post",
    content:
      "Not impressed with the new @brandname product. It's glitchy and customer support hasn't been helpful at all. Disappointed after all the hype.",
    user: {
      name: "Robert Johnson",
      handle: "robj",
      avatar: "https://randomuser.me/api/portraits/men/22.jpg",
      followers: 530,
      verified: false,
    },
    date: "2023-11-10T18:22:00Z",
    sentiment: "negative",
    engagementScore: 42,
    status: "rejected",
    mediaUrl: null,
    likes: 13,
    comments: 8,
    requestSent: false,
    permissionGranted: false,
    campaign: null,
    hashtags: [],
    aiAnalysis: {
      topics: ["bugs", "customer support", "disappointment"],
      keywords: ["glitchy", "disappointed", "not helpful"],
      score: 3.2,
    },
  },
  {
    id: "c4",
    platform: "linkedin" as SocialPlatformName,
    type: "post",
    content:
      "Our team has been using @brandname's platform for our project management needs. It's been solid and reliable, though there's room for improvement in the reporting features.",
    user: {
      name: "Sarah Williams",
      handle: "sarahw",
      avatar: "https://randomuser.me/api/portraits/women/67.jpg",
      followers: 3450,
      verified: true,
    },
    date: "2023-11-08T11:05:00Z",
    sentiment: "neutral",
    engagementScore: 61,
    status: "pending",
    mediaUrl: null,
    likes: 45,
    comments: 9,
    requestSent: true,
    permissionGranted: null,
    campaign: "b2b_growth",
    hashtags: ["projectmanagement", "teamwork"],
    aiAnalysis: {
      topics: ["project management", "reliability", "reporting features"],
      keywords: ["solid", "reliable", "improvement"],
      score: 6.8,
    },
  },
  {
    id: "c5",
    platform: "instagram" as SocialPlatformName,
    type: "post",
    content:
      "Check out my new @brandname shoes! So comfortable and stylish. I've been wearing them everywhere this week. #FashionFind #ComfortFirst",
    user: {
      name: "Amy Cooper",
      handle: "amycooperstyle",
      avatar: "https://randomuser.me/api/portraits/women/44.jpg",
      followers: 12400,
      verified: true,
    },
    date: "2023-11-05T16:40:00Z",
    sentiment: "positive",
    engagementScore: 93,
    status: "pending",
    mediaUrl: "https://placehold.co/600x400/fef2f2/ef4444?text=Product+Photo",
    likes: 876,
    comments: 52,
    requestSent: true,
    permissionGranted: true,
    campaign: "influencer_program",
    hashtags: ["FashionFind", "ComfortFirst"],
    aiAnalysis: {
      topics: ["comfort", "style", "daily use"],
      keywords: ["comfortable", "stylish", "everywhere"],
      score: 9.5,
    },
  },
  {
    id: "c6",
    platform: "youtube" as SocialPlatformName,
    type: "comment",
    content:
      "I've been using Brand Name's software for my business and it's just okay. Not bad, but not amazing either. There are better options out there for the price.",
    user: {
      name: "Tech Reviews",
      handle: "techreviews",
      avatar: "https://randomuser.me/api/portraits/men/29.jpg",
      followers: 45600,
      verified: true,
    },
    date: "2023-11-01T13:25:00Z",
    sentiment: "neutral",
    engagementScore: 48,
    status: "pending",
    mediaUrl: null,
    likes: 12,
    comments: 0,
    requestSent: false,
    permissionGranted: false,
    campaign: null,
    hashtags: [],
    aiAnalysis: {
      topics: ["value", "competition", "features"],
      keywords: ["okay", "not bad", "better options", "price"],
      score: 5.2,
    },
  },
];

const SocialContentModeration: React.FC<SocialContentModerationProps> = ({
  showToast,
}) => {
  const [activeTab, setActiveTab] = useState<
    "pending" | "approved" | "rejected"
  >("pending");
  const [contentQueue, setContentQueue] = useState(mockContentQueue);
  const [filters, setFilters] = useState({
    platform: "",
    sentiment: "",
    campaign: "",
    dateRange: "all",
    withMedia: false,
    verified: false,
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedContent, setSelectedContent] = useState<any | null>(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [editorMode, setEditorMode] = useState(false);
  const [editedContent, setEditedContent] = useState("");

  // Get filtered content
  const getFilteredContent = () => {
    return contentQueue.filter((item) => {
      // Filter by status
      if (activeTab === "pending" && item.status !== "pending") return false;
      if (activeTab === "approved" && item.status !== "approved") return false;
      if (activeTab === "rejected" && item.status !== "rejected") return false;

      // Filter by platform
      if (filters.platform && item.platform !== filters.platform) return false;

      // Filter by sentiment
      if (filters.sentiment && item.sentiment !== filters.sentiment)
        return false;

      // Filter by campaign
      if (filters.campaign && item.campaign !== filters.campaign) return false;

      // Filter by media
      if (filters.withMedia && !item.mediaUrl) return false;

      // Filter by verified users
      if (filters.verified && !item.user.verified) return false;

      return true;
    });
  };

  const filteredContent = getFilteredContent();

  // Handle approving content
  const handleApprove = (id: string) => {
    setContentQueue(
      contentQueue.map((item) =>
        item.id === id ? { ...item, status: "approved" } : item
      )
    );

    showToast({
      title: "Content approved",
      description:
        "The content has been approved and will be used as a testimonial.",
      variant: "default",
    });
  };

  // Handle rejecting content
  const handleReject = (id: string) => {
    // Update the content status
    setContentQueue(
      contentQueue.map((item) =>
        item.id === id ? { ...item, status: "rejected" } : item
      )
    );

    setShowRejectDialog(false);
    setRejectReason("");

    showToast({
      title: "Content rejected",
      description:
        "The content has been rejected and won't be used as a testimonial.",
      variant: "default",
    });
  };

  // Handle sending permission request
  const handleSendRequest = (id: string) => {
    setContentQueue(
      contentQueue.map((item) =>
        item.id === id ? { ...item, requestSent: true } : item
      )
    );

    showToast({
      title: "Permission request sent",
      description: "A permission request has been sent to the user.",
      variant: "default",
    });
  };

  // Handle reset filters
  const handleResetFilters = () => {
    setFilters({
      platform: "",
      sentiment: "",
      campaign: "",
      dateRange: "all",
      withMedia: false,
      verified: false,
    });
  };

  // Handle content selection
  const handleContentSelect = (content: any) => {
    setSelectedContent(content);
    setEditedContent(content.content);
  };

  // Handle save edited content
  const handleSaveEdit = () => {
    if (!selectedContent) return;

    setContentQueue(
      contentQueue.map((item) =>
        item.id === selectedContent.id
          ? { ...item, content: editedContent }
          : item
      )
    );

    setEditorMode(false);

    showToast({
      title: "Content updated",
      description: "The content has been successfully updated.",
      variant: "default",
    });
  };

  return (
    <motion.div
      className="space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col md:flex-row md:items-end justify-between gap-4"
      >
        <div>
          <h2 className="text-xl font-semibold tracking-tight mb-1">
            Content Moderation
          </h2>
          <p className="text-sm text-muted-foreground">
            Review and approve social media content before using it as
            testimonials
          </p>
        </div>
        <div className="flex gap-3 flex-wrap justify-end">
          <Button
            variant="outline"
            size="sm"
            className="h-9"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            <span>Filters</span>
            {Object.values(filters).some(
              (v) => v !== "" && v !== false && v !== "all"
            ) && (
              <Badge className="ml-2 bg-blue-100 text-blue-700 border-blue-200">
                Active
              </Badge>
            )}
          </Button>

          <Select
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as any)}
          >
            <SelectTrigger className="w-[180px] h-9">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-amber-500" />
                  <span>Pending Review</span>
                </div>
              </SelectItem>
              <SelectItem value="approved">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>Approved</span>
                </div>
              </SelectItem>
              <SelectItem value="rejected">
                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-500" />
                  <span>Rejected</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>

          <Button
            className="h-9 gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
            onClick={() => {
              // In a real implementation this would refresh the content queue
              showToast({
                title: "Queue refreshed",
                description: "The content moderation queue has been refreshed.",
                variant: "default",
              });
            }}
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh Queue</span>
          </Button>
        </div>
      </motion.div>

      {/* Filter panel */}
      {showFilters && (
        <motion.div
          variants={itemVariants}
          className="p-4 border rounded-lg bg-slate-50"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-slate-500" />
              <span>Filter Options</span>
            </h3>

            <Button
              variant="outline"
              size="sm"
              onClick={handleResetFilters}
              className="h-8 text-xs"
            >
              Reset Filters
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="platform-filter" className="text-xs">
                Platform
              </Label>
              <Select
                value={filters.platform}
                onValueChange={(value) =>
                  setFilters({ ...filters, platform: value })
                }
              >
                <SelectTrigger id="platform-filter">
                  <SelectValue placeholder="All platforms" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All platforms</SelectItem>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="twitter">Twitter</SelectItem>
                  <SelectItem value="facebook">Facebook</SelectItem>
                  <SelectItem value="linkedin">LinkedIn</SelectItem>
                  <SelectItem value="youtube">YouTube</SelectItem>
                  <SelectItem value="tiktok">TikTok</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sentiment-filter" className="text-xs">
                Sentiment
              </Label>
              <Select
                value={filters.sentiment}
                onValueChange={(value) =>
                  setFilters({ ...filters, sentiment: value })
                }
              >
                <SelectTrigger id="sentiment-filter">
                  <SelectValue placeholder="All sentiments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All sentiments</SelectItem>
                  <SelectItem value="positive">Positive</SelectItem>
                  <SelectItem value="neutral">Neutral</SelectItem>
                  <SelectItem value="negative">Negative</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="campaign-filter" className="text-xs">
                Campaign
              </Label>
              <Select
                value={filters.campaign}
                onValueChange={(value) =>
                  setFilters({ ...filters, campaign: value })
                }
              >
                <SelectTrigger id="campaign-filter">
                  <SelectValue placeholder="All campaigns" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All campaigns</SelectItem>
                  <SelectItem value="summer_launch">Summer Launch</SelectItem>
                  <SelectItem value="b2b_growth">B2B Growth</SelectItem>
                  <SelectItem value="influencer_program">
                    Influencer Program
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date-filter" className="text-xs">
                Date Range
              </Label>
              <Select
                value={filters.dateRange}
                onValueChange={(value) =>
                  setFilters({ ...filters, dateRange: value })
                }
              >
                <SelectTrigger id="date-filter">
                  <SelectValue placeholder="All time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This week</SelectItem>
                  <SelectItem value="month">This month</SelectItem>
                  <SelectItem value="custom">Custom range</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4 flex flex-col justify-end">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="with-media"
                  checked={filters.withMedia}
                  onCheckedChange={(checked) =>
                    setFilters({ ...filters, withMedia: !!checked })
                  }
                />
                <Label
                  htmlFor="with-media"
                  className="text-sm cursor-pointer flex items-center gap-1.5"
                >
                  <Eye className="h-3.5 w-3.5 text-slate-500" />
                  <span>With media only</span>
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="verified-users"
                  checked={filters.verified}
                  onCheckedChange={(checked) =>
                    setFilters({ ...filters, verified: !!checked })
                  }
                />
                <Label
                  htmlFor="verified-users"
                  className="text-sm cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 text-blue-500" />
                  <span>Verified users only</span>
                </Label>
              </div>
            </div>

            <div className="md:col-span-2 relative">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                <Input
                  type="search"
                  placeholder="Search by keyword, hashtag, or user..."
                  className="pl-9"
                />
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Content grid and details */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        {/* Content list */}
        <div className="md:col-span-1 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">
              Queue ({filteredContent.length})
            </h3>
            <div className="text-xs text-slate-500">
              <LayoutList className="h-3.5 w-3.5 inline mr-1" />
              {activeTab === "pending"
                ? "Pending Review"
                : activeTab === "approved"
                  ? "Approved Content"
                  : "Rejected Content"}
            </div>
          </div>

          {filteredContent.length === 0 ? (
            <div className="border-2 border-dashed rounded-xl p-8 text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                <AlertCircle className="h-6 w-6 text-slate-400" />
              </div>
              <h4 className="text-sm font-medium text-slate-700 mb-1">
                No content found
              </h4>
              <p className="text-xs text-slate-500">
                {activeTab === "pending"
                  ? "There are no pending items to review"
                  : activeTab === "approved"
                    ? "No approved content yet"
                    : "No rejected content yet"}
              </p>
              {Object.values(filters).some(
                (v) => v !== "" && v !== false && v !== "all"
              ) && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4 text-xs h-8"
                  onClick={handleResetFilters}
                >
                  <Filter className="h-3.5 w-3.5 mr-1.5" />
                  Clear Filters
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-2 max-h-[calc(100vh-280px)] overflow-y-auto pr-2">
              {filteredContent.map((item) => {
                const Icon = platformIcons[item.platform];

                let statusBadge;
                if (item.status === "pending") {
                  statusBadge = (
                    <Badge className="bg-amber-100 text-amber-700 border-amber-200">
                      <Clock className="h-3 w-3 mr-1" />
                      Pending
                    </Badge>
                  );
                } else if (item.status === "approved") {
                  statusBadge = (
                    <Badge className="bg-green-100 text-green-700 border-green-200">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Approved
                    </Badge>
                  );
                } else {
                  statusBadge = (
                    <Badge className="bg-red-100 text-red-700 border-red-200">
                      <XCircle className="h-3 w-3 mr-1" />
                      Rejected
                    </Badge>
                  );
                }

                return (
                  <div
                    key={item.id}
                    className={cn(
                      "border rounded-lg p-3 cursor-pointer transition-colors",
                      selectedContent?.id === item.id
                        ? "border-blue-500 bg-blue-50/50"
                        : "hover:bg-slate-50"
                    )}
                    onClick={() => handleContentSelect(item)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div
                          className={cn(
                            "p-1 rounded",
                            platformColors[item.platform].bg
                          )}
                        >
                          <Icon className="h-3.5 w-3.5 text-white" />
                        </div>
                        <div className="text-xs font-medium">
                          {item.user.name}
                        </div>
                        {item.user.verified && (
                          <Badge className="h-5 w-5 p-0 flex items-center justify-center bg-blue-500">
                            <CheckCircle2 className="h-3 w-3 text-white" />
                          </Badge>
                        )}
                      </div>
                      {statusBadge}
                    </div>

                    <div className="text-xs text-slate-700 line-clamp-2 mb-2">
                      {item.content}
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <div>{new Date(item.date).toLocaleDateString()}</div>

                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-0.5">
                          <Heart className="h-3 w-3" />
                          <span>{item.likes}</span>
                        </div>
                        <div className="flex items-center gap-0.5">
                          <MessageSquare className="h-3 w-3" />
                          <span>{item.comments}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {filteredContent.length > 0 && (
            <Pagination className="pt-2">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious href="#" />
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink href="#" isActive>
                    1
                  </PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink href="#">2</PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink href="#">3</PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
                <PaginationItem>
                  <PaginationNext href="#" />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </div>

        {/* Content details */}
        <div className="md:col-span-2">
          {selectedContent ? (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex gap-3">
                    <img
                      src={selectedContent.user.avatar}
                      alt={selectedContent.user.name}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        {selectedContent.user.name}
                        {selectedContent.user.verified && (
                          <Badge className="h-5 w-5 p-0 flex items-center justify-center bg-blue-500">
                            <CheckCircle2 className="h-3 w-3 text-white" />
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-1.5">
                        <span>@{selectedContent.user.handle}</span>
                        <span className="text-slate-300">•</span>
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {selectedContent.user.followers.toLocaleString()}{" "}
                          followers
                        </span>
                      </CardDescription>
                    </div>
                  </div>

                  <div className="flex">
                    <div
                      className={cn(
                        "p-1 rounded flex items-center gap-1.5 text-xs font-medium",
                        platformColors[
                          selectedContent.platform as SocialPlatformName
                        ].bg,
                        platformColors[
                          selectedContent.platform as SocialPlatformName
                        ].text
                      )}
                    >
                      {React.createElement(
                        platformIcons[
                          selectedContent.platform as SocialPlatformName
                        ],
                        {
                          className: "h-3.5 w-3.5",
                        }
                      )}
                      <span className="capitalize">
                        {selectedContent.platform}
                      </span>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pb-3 space-y-4">
                {/* Content display */}
                <div className="space-y-3">
                  {editorMode ? (
                    <div className="space-y-2">
                      <Label
                        htmlFor="content-editor"
                        className="text-xs font-medium"
                      >
                        Edit Content
                      </Label>
                      <Textarea
                        id="content-editor"
                        value={editedContent}
                        onChange={(e) => setEditedContent(e.target.value)}
                        rows={4}
                        placeholder="Edit content here..."
                      />
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditorMode(false);
                            setEditedContent(selectedContent.content);
                          }}
                        >
                          Cancel
                        </Button>
                        <Button size="sm" onClick={handleSaveEdit}>
                          Save Changes
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="relative">
                      <div className="text-sm whitespace-pre-wrap pb-2">
                        {selectedContent.content}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute top-0 right-0 h-7 px-2.5 opacity-80"
                        onClick={() => setEditorMode(true)}
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}

                  {/* Media display */}
                  {selectedContent.mediaUrl && (
                    <div className="rounded-md overflow-hidden border">
                      <img
                        src={selectedContent.mediaUrl}
                        alt="Content media"
                        className="w-full h-auto max-h-64 object-cover"
                      />
                    </div>
                  )}

                  {/* Metadata and insights */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-500">Posted</span>
                        <span className="font-medium">
                          {new Date(selectedContent.date).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-500">Engagement</span>
                        <div className="flex items-center gap-2">
                          <Progress
                            value={selectedContent.engagementScore}
                            className="h-2 w-16"
                            style={
                              {
                                "--progress-background": "rgb(241, 245, 249)",
                                "--progress-foreground": getEngagementColor(
                                  selectedContent.engagementScore
                                ),
                              } as React.CSSProperties
                            }
                          />
                          <span className="font-medium">
                            {selectedContent.engagementScore}%
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-500">Sentiment</span>
                        <Badge
                          className={cn(
                            "capitalize",
                            selectedContent.sentiment === "positive"
                              ? "bg-green-100 text-green-700 border-green-200"
                              : selectedContent.sentiment === "neutral"
                                ? "bg-blue-100 text-blue-700 border-blue-200"
                                : "bg-red-100 text-red-700 border-red-200"
                          )}
                        >
                          {selectedContent.sentiment}
                        </Badge>
                      </div>

                      {selectedContent.campaign && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-500">Campaign</span>
                          <Badge variant="outline" className="capitalize">
                            {selectedContent.campaign.replace("_", " ")}
                          </Badge>
                        </div>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-500">Social Metrics</span>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            <Heart className="h-3.5 w-3.5 text-pink-500" />
                            <span>{selectedContent.likes}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MessageSquare className="h-3.5 w-3.5 text-blue-500" />
                            <span>{selectedContent.comments}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-500">Permission</span>
                        <Badge
                          variant="outline"
                          className={cn(
                            selectedContent.permissionGranted === true
                              ? "bg-green-100 text-green-700 border-green-200"
                              : selectedContent.permissionGranted === false
                                ? "bg-red-100 text-red-700 border-red-200"
                                : selectedContent.requestSent
                                  ? "bg-amber-100 text-amber-700 border-amber-200"
                                  : "bg-slate-100 text-slate-700 border-slate-200"
                          )}
                        >
                          {selectedContent.permissionGranted === true
                            ? "Granted"
                            : selectedContent.permissionGranted === false
                              ? "Denied"
                              : selectedContent.requestSent
                                ? "Requested"
                                : "Not Requested"}
                        </Badge>
                      </div>

                      {selectedContent.hashtags.length > 0 && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-500">Hashtags</span>
                          <div className="flex flex-wrap gap-1 justify-end">
                            {selectedContent.hashtags.map(
                              (tag: string, index: number) => (
                                <Badge
                                  key={index}
                                  variant="outline"
                                  className="text-xs"
                                >
                                  #{tag}
                                </Badge>
                              )
                            )}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-500">AI Score</span>
                        <div className="flex items-center gap-1">
                          <Sparkles className="h-3.5 w-3.5 text-purple-500" />
                          <span className="font-medium">
                            {selectedContent.aiAnalysis.score.toFixed(1)}/10
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* AI Analysis */}
                  <div className="bg-gradient-to-r from-violet-50 to-purple-50 rounded-lg p-3 border border-purple-100">
                    <div className="flex items-start gap-3">
                      <Sparkles className="h-5 w-5 text-purple-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-medium text-purple-900 mb-2">
                          AI Content Analysis
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <div className="text-xs font-medium text-purple-700 mb-1">
                              Topics Detected
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {selectedContent.aiAnalysis.topics.map(
                                (topic: string, i: number) => (
                                  <Badge
                                    key={i}
                                    className="bg-purple-100 text-purple-700 border-purple-200 capitalize"
                                  >
                                    {topic}
                                  </Badge>
                                )
                              )}
                            </div>
                          </div>

                          <div>
                            <div className="text-xs font-medium text-purple-700 mb-1">
                              Key Sentiment Words
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {selectedContent.aiAnalysis.keywords.map(
                                (keyword: string, i: number) => (
                                  <Badge
                                    key={i}
                                    variant="outline"
                                    className="bg-white text-purple-700 border-purple-200"
                                  >
                                    {keyword}
                                  </Badge>
                                )
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="flex justify-between pt-2 border-t">
                <div>
                  {!selectedContent.requestSent && (
                    <Button
                      variant="outline"
                      onClick={() => handleSendRequest(selectedContent.id)}
                    >
                      Request Permission
                    </Button>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                    onClick={() => {
                      setShowRejectDialog(true);
                    }}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </Button>

                  <Button
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                    onClick={() => handleApprove(selectedContent.id)}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ) : (
            <Card className="border-2 border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16 px-4 text-center">
                <div className="rounded-full bg-slate-100 p-3 mb-4">
                  <MessageSquare className="h-8 w-8 text-slate-400" />
                </div>
                <h3 className="text-xl font-medium text-slate-800 mb-2">
                  No content selected
                </h3>
                <p className="text-slate-500 max-w-md mb-6">
                  Select an item from the queue to review and moderate it
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </motion.div>

      {/* Moderation stats */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Queue Status
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500">Pending</span>
                <span className="text-xs font-medium">
                  {contentQueue.filter((c) => c.status === "pending").length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500">Approved</span>
                <span className="text-xs font-medium">
                  {contentQueue.filter((c) => c.status === "approved").length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500">Rejected</span>
                <span className="text-xs font-medium">
                  {contentQueue.filter((c) => c.status === "rejected").length}
                </span>
              </div>
              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden mt-3">
                <div className="flex h-full">
                  <div
                    className="bg-green-500 h-full"
                    style={{
                      width: `${(contentQueue.filter((c) => c.status === "approved").length / contentQueue.length) * 100}%`,
                    }}
                  />
                  <div
                    className="bg-amber-500 h-full"
                    style={{
                      width: `${(contentQueue.filter((c) => c.status === "pending").length / contentQueue.length) * 100}%`,
                    }}
                  />
                  <div
                    className="bg-red-500 h-full"
                    style={{
                      width: `${(contentQueue.filter((c) => c.status === "rejected").length / contentQueue.length) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Platform Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="flex flex-wrap gap-1">
              {Object.keys(platformIcons).map((platform) => {
                const count = contentQueue.filter(
                  (c) => c.platform === platform
                ).length;
                const percentage = Math.round(
                  (count / contentQueue.length) * 100
                );

                return (
                  <div
                    key={platform}
                    className="flex flex-col items-center"
                    style={{ width: "calc(33.33% - 4px)" }}
                  >
                    <div
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center mb-1",
                        platformColors[platform as SocialPlatformName].bg
                      )}
                    >
                      {React.createElement(
                        platformIcons[platform as SocialPlatformName],
                        {
                          className: "h-4 w-4 text-white",
                        }
                      )}
                    </div>
                    <div className="text-xs font-medium">{count}</div>
                    <div className="text-xs text-slate-500">{percentage}%</div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Sentiment Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-500">
                Content by sentiment
              </span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-green-500" />
                  <span className="text-xs">Positive</span>
                </div>
                <span className="text-xs font-medium">
                  {
                    contentQueue.filter((c) => c.sentiment === "positive")
                      .length
                  }
                  <span className="text-slate-400 ml-1">
                    (
                    {Math.round(
                      (contentQueue.filter((c) => c.sentiment === "positive")
                        .length /
                        contentQueue.length) *
                        100
                    )}
                    %)
                  </span>
                </span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-blue-500" />
                  <span className="text-xs">Neutral</span>
                </div>
                <span className="text-xs font-medium">
                  {contentQueue.filter((c) => c.sentiment === "neutral").length}
                  <span className="text-slate-400 ml-1">
                    (
                    {Math.round(
                      (contentQueue.filter((c) => c.sentiment === "neutral")
                        .length /
                        contentQueue.length) *
                        100
                    )}
                    %)
                  </span>
                </span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-red-500" />
                  <span className="text-xs">Negative</span>
                </div>
                <span className="text-xs font-medium">
                  {
                    contentQueue.filter((c) => c.sentiment === "negative")
                      .length
                  }
                  <span className="text-slate-400 ml-1">
                    (
                    {Math.round(
                      (contentQueue.filter((c) => c.sentiment === "negative")
                        .length /
                        contentQueue.length) *
                        100
                    )}
                    %)
                  </span>
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Approval Rate
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <div className="text-2xl font-bold">
                  {contentQueue.filter((c) => c.status !== "pending").length > 0
                    ? Math.round(
                        (contentQueue.filter((c) => c.status === "approved")
                          .length /
                          contentQueue.filter((c) => c.status !== "pending")
                            .length) *
                          100
                      )
                    : 0}
                  %
                </div>
                <div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8"
                    onClick={() => {
                      window.open("#", "_blank");
                    }}
                  >
                    <BarChart className="h-3.5 w-3.5 mr-1.5" />
                    <span className="text-xs">View Report</span>
                  </Button>
                </div>
              </div>
              <Progress
                value={
                  contentQueue.filter((c) => c.status !== "pending").length > 0
                    ? (contentQueue.filter((c) => c.status === "approved")
                        .length /
                        contentQueue.filter((c) => c.status !== "pending")
                          .length) *
                      100
                    : 0
                }
                className="h-2"
                style={
                  {
                    "--progress-background": "rgb(241, 245, 249)",
                    "--progress-foreground": "rgb(34, 197, 94)",
                  } as React.CSSProperties
                }
              />
              <div className="text-xs text-slate-500 pt-1">
                Approval rate:{" "}
                {contentQueue.filter((c) => c.status === "approved").length}{" "}
                approved /{" "}
                {contentQueue.filter((c) => c.status !== "pending").length}{" "}
                reviewed
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Reject Reason Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Content</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this content
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reject-reason">Rejection Reason</Label>
              <Textarea
                id="reject-reason"
                placeholder="Enter reason for rejection..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={4}
              />
              <p className="text-xs text-slate-500">
                This is for internal tracking purposes and won't be sent to the
                user
              </p>
            </div>

            <div className="space-y-2">
              <Label>Common Reasons</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setRejectReason("Negative sentiment or feedback")
                  }
                  className="justify-start text-xs h-8"
                >
                  <XCircle className="h-3.5 w-3.5 mr-1.5 text-red-500" />
                  Negative feedback
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setRejectReason("Contains competitors mentions")
                  }
                  className="justify-start text-xs h-8"
                >
                  <AlertCircle className="h-3.5 w-3.5 mr-1.5 text-amber-500" />
                  Competitor mentions
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setRejectReason("Inappropriate or offensive content")
                  }
                  className="justify-start text-xs h-8"
                >
                  <AlertCircle className="h-3.5 w-3.5 mr-1.5 text-red-500" />
                  Inappropriate
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setRejectReason("Low quality or spam content")}
                  className="justify-start text-xs h-8"
                >
                  <MessageSquare className="h-3.5 w-3.5 mr-1.5 text-slate-500" />
                  Low quality/spam
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRejectDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                selectedContent && handleReject(selectedContent.id)
              }
            >
              Reject Content
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

// Helper function to get color based on engagement score
function getEngagementColor(score: number): string {
  if (score >= 80) return "rgb(34, 197, 94)"; // green-500
  if (score >= 60) return "rgb(234, 179, 8)"; // yellow-500
  if (score >= 40) return "rgb(249, 115, 22)"; // orange-500
  return "rgb(239, 68, 68)"; // red-500
}

export default SocialContentModeration;
