import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  ArrowRight,
  AtSign,
  BarChart,
  Bot,
  Calendar,
  Check,
  CheckCircle,
  ChevronDown,
  Clock,
  ExternalLink,
  Eye,
  Filter,
  Heart,
  HelpCircle,
  Info,
  Layers,
  LayoutGrid,
  List,
  Loader2,
  Mail,
  MessageSquare,
  MoreHorizontal,
  Pencil,
  Pin,
  RefreshCw,
  Search,
  Settings,
  Share2,
  Star,
  ThumbsDown,
  ThumbsUp,
  UserPlus,
  X,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import {
  CollectionSettings,
  DiscoveryMode,
  SentimentType,
  SocialPlatformName,
  SocialSettings,
  TestimonialSource,
} from "@/types/setup";
import {
  discoveryModes,
  mockTestimonials,
  platformColors,
  platformIcons,
} from "./defaults";
import { observer } from "mobx-react-lite";
import { ContentStatus, Testimonial } from "@/types/testimonial";
import { useFilteredTestimonials } from "./hooks/useFilteredTestimonials";
import { useTestimonialStats } from "./hooks/useTestimonialStats";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDiscoveryModeProcessing } from "./hooks/useDiscoveryModeProcessing";
import { formatRelativeTime } from "@/utils/utils";

interface TestimonialDiscoveryProps {
  settings: CollectionSettings["social"];
  onSettingsChange: (
    field: keyof CollectionSettings["social"],
    value: any
  ) => void;
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

// Source icons
const sourceIcons: Record<TestimonialSource, React.ElementType> = {
  mentions: AtSign,
  comments: MessageSquare,
  posts: Layers,
  tags: Pin,
  dms: Mail,
};

const TestimonialDiscovery: React.FC<TestimonialDiscoveryProps> = ({
  settings,
  onSettingsChange,
  showToast,
}) => {
  // Component state
  const [testimonials, setTestimonials] =
    useState<Testimonial[]>(mockTestimonials);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTestimonial, setSelectedTestimonial] =
    useState<Testimonial | null>(null);
  const [activeTab, setActiveTab] = useState<ContentStatus>("all");
  const [platformFilter, setPlatformFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<TestimonialSource | "all">(
    "all"
  );
  const [sentimentFilter, setSentimentFilter] = useState<SentimentType>("all");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [isPermissionModalOpen, setIsPermissionModalOpen] = useState(false);
  const [customMessage, setCustomMessage] = useState(
    settings.permissionMessage || ""
  );
  const [isPermissionSending, setIsPermissionSending] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [highlightedTestimonials, setHighlightedTestimonials] = useState<
    string[]
  >([]);
  const [sortOrder, setSortOrder] = useState<"date" | "score" | "engagement">(
    "date"
  );
  const [isBatchActionsMode, setIsBatchActionsMode] = useState(false);
  const [selectedTestimonialIds, setSelectedTestimonialIds] = useState<
    string[]
  >([]);
  const [advancedFiltersOpen, setAdvancedFiltersOpen] = useState(false);
  const [dateRangeFilter, setDateRangeFilter] = useState<
    "all" | "today" | "week" | "month" | "custom"
  >("all");
  const [customDateRange, setCustomDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    end: new Date().toISOString().split("T")[0],
  });
  const [minFollowersFilter, setMinFollowersFilter] = useState(0);
  const [minEngagementFilter, setMinEngagementFilter] = useState(0);
  const [keywordFilter, setKeywordFilter] = useState("");
  const [discoveryMode, setDiscoveryMode] = useState<DiscoveryMode>(
    (settings.approvalWorkflow as DiscoveryMode) || "auto"
  );
  const [activeFilter, setActiveFilter] = useState<
    "status" | "platform" | "source" | "sentiment" | null
  >(null);
  const [modalTab, setModalTab] = useState<
    "overview" | "engagement" | "author"
  >("overview");
  const [showBatchSuccessMessage, setShowBatchSuccessMessage] = useState(false);
  const [sentimentThreshold, setSentimentThreshold] = useState(75);
  const [keywordsList, setKeywordsList] = useState<string[]>([
    "amazing",
    "recommend",
    "love",
    "excellent",
  ]);
  const [discoveryStats, setDiscoveryStats] = useState({
    autoApproved: 0,
    keywordMatched: 0,
    sentimentApproved: 0,
    aiRecommended: 0,
  });
  const [showDiscoveryActivity, setShowDiscoveryActivity] = useState(false);
  const [discoveryActivity, setDiscoveryActivity] = useState<
    Array<{
      action: string;
      testimonialId: string;
      reason: string;
      timestamp: Date;
    }>
  >([]);

  // Effect to update settings when discovery mode changes
  useEffect(() => {
    onSettingsChange("approvalWorkflow", discoveryMode);
  }, [discoveryMode]);

  const filters = {
    searchQuery,
    activeTab,
    platformFilter,
    sourceFilter,
    sentimentFilter,
    sortOrder,
    minFollowersFilter,
    minEngagementFilter,
    keywordFilter,
    dateRangeFilter,
    customDateRange,
  };

  const filteredTestimonials = useFilteredTestimonials(testimonials, filters);
  const { stats, filterStats } = useTestimonialStats(testimonials);

  const { processTestimonials, matchesDiscoveryMode } =
    useDiscoveryModeProcessing({
      discoveryMode,
      sentimentThreshold,
      keywordsList,
      testimonials,
      setTestimonials,
      setDiscoveryActivity,
      setDiscoveryStats,
      showToast,
      setShowDiscoveryActivity,
    });

  // Apply discovery mode processing on mode change
  useEffect(() => {
    processTestimonials();
  }, [discoveryMode, processTestimonials]);

  // Handle discovery mode change
  const handleDiscoveryModeChange = (mode: DiscoveryMode) => {
    setDiscoveryMode(mode);
    onSettingsChange("approvalWorkflow", mode);

    showToast({
      title: "Discovery mode updated",
      description: `Testimonial discovery mode has been set to ${mode}`,
      variant: "default",
    });
  };

  // Handle refresh - also triggers discovery mode processing
  const handleRefresh = () => {
    setIsRefreshing(true);

    // Simulate API call with a delay
    setTimeout(() => {
      processTestimonials();
      setIsRefreshing(false);
      showToast({
        title: "Refreshed",
        description:
          "Testimonials have been refreshed and processed based on current discovery mode",
        variant: "default",
      });
    }, 1500);
  };

  // Handle approval
  const handleApprove = (id: string) => {
    setTestimonials((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: "approved" } : t))
    );

    showToast({
      title: "Testimonial approved",
      description:
        "The testimonial has been approved and will be displayed on your website",
      variant: "default",
    });

    if (selectedTestimonial?.id === id) {
      setSelectedTestimonial((prev) =>
        prev ? { ...prev, status: "approved" } : null
      );
    }

    // Add to activity log
    setDiscoveryActivity((prev) => [
      {
        action: "Manually approved",
        testimonialId: id,
        reason: "User action",
        timestamp: new Date(),
      },
      ...prev,
    ]);
  };

  // Handle rejection
  const handleReject = (id: string) => {
    setTestimonials((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: "rejected" } : t))
    );

    showToast({
      title: "Testimonial rejected",
      description: "The testimonial has been rejected and won't be used",
      variant: "default",
    });

    if (selectedTestimonial?.id === id) {
      setSelectedTestimonial((prev) =>
        prev ? { ...prev, status: "rejected" } : null
      );
    }

    // Add to activity log
    setDiscoveryActivity((prev) => [
      {
        action: "Rejected",
        testimonialId: id,
        reason: "User action",
        timestamp: new Date(),
      },
      ...prev,
    ]);
  };

  // Handle permission request
  const handleRequestPermission = (id: string) => {
    const testimonial = testimonials.find((t) => t.id === id);
    if (testimonial) {
      setSelectedTestimonial(testimonial);
      setCustomMessage(settings.permissionMessage);
      setIsPermissionModalOpen(true);
    }
  };

  // Send permission request
  const handleSendPermissionRequest = () => {
    if (!selectedTestimonial) return;

    setIsPermissionSending(true);

    // Simulate API call to send request
    setTimeout(() => {
      setTestimonials((prev) =>
        prev.map((t) =>
          t.id === selectedTestimonial.id
            ? { ...t, status: "requested", response: customMessage }
            : t
        )
      );

      setIsPermissionSending(false);
      setIsPermissionModalOpen(false);

      showToast({
        title: "Permission requested",
        description: "The permission request has been sent to the user",
        variant: "default",
      });

      // Update the selected testimonial if it's still selected
      setSelectedTestimonial((prev) =>
        prev?.id === selectedTestimonial.id
          ? { ...prev, status: "requested", response: customMessage }
          : prev
      );

      // Add to activity log
      setDiscoveryActivity((prev) => [
        {
          action: "Permission requested",
          testimonialId: selectedTestimonial.id,
          reason: "User action",
          timestamp: new Date(),
        },
        ...prev,
      ]);
    }, 1500);
  };

  // Handle batch actions
  const handleBatchAction = (action: "approve" | "reject" | "request") => {
    if (selectedTestimonialIds.length === 0) return;

    setTestimonials((prev) =>
      prev.map((t) => {
        if (selectedTestimonialIds.includes(t.id)) {
          if (action === "approve") {
            return { ...t, status: "approved" };
          } else if (action === "reject") {
            return { ...t, status: "rejected" };
          } else if (action === "request") {
            return {
              ...t,
              status: "requested",
              response: settings.permissionMessage,
            };
          }
        }
        return t;
      })
    );

    // Show success message
    setShowBatchSuccessMessage(true);
    setTimeout(() => setShowBatchSuccessMessage(false), 3000);

    // Clear selection
    setSelectedTestimonialIds([]);
    setIsBatchActionsMode(false);

    showToast({
      title: `Batch action complete`,
      description: `${selectedTestimonialIds.length} testimonials have been ${
        action === "approve"
          ? "approved"
          : action === "reject"
            ? "rejected"
            : "sent permission requests"
      }`,
      variant: "default",
    });

    // Add to activity log
    const actionText =
      action === "approve"
        ? "Batch approved"
        : action === "reject"
          ? "Batch rejected"
          : "Batch permission requested";

    setDiscoveryActivity((prev) => [
      {
        action: actionText,
        testimonialId: selectedTestimonialIds.join(", "),
        reason: `Batch action on ${selectedTestimonialIds.length} testimonials`,
        timestamp: new Date(),
      },
      ...prev,
    ]);
  };

  // Toggle highlight testimonial
  const handleToggleHighlight = (id: string) => {
    setHighlightedTestimonials((prev) => {
      if (prev.includes(id)) {
        return prev.filter((tId) => tId !== id);
      } else {
        return [...prev, id];
      }
    });

    setTestimonials((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, highlighted: !t.custom_fields?.highlighted } : t
      )
    );

    // Update the selected testimonial if it's still selected
    setSelectedTestimonial((prev) =>
      prev?.id === id
        ? { ...prev, highlighted: !prev.custom_fields?.highlighted }
        : prev
    );

    showToast({
      title: "Testimonial updated",
      description: highlightedTestimonials.includes(id)
        ? "Testimonial removed from highlights"
        : "Testimonial added to highlights",
      variant: "default",
    });
  };

  // Toggle checkbox for batch selection
  const handleToggleSelection = (id: string) => {
    setSelectedTestimonialIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((tId) => tId !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  // Toggle all checkboxes
  const handleToggleSelectAll = () => {
    if (selectedTestimonialIds.length === filteredTestimonials.length) {
      setSelectedTestimonialIds([]);
    } else {
      setSelectedTestimonialIds(filteredTestimonials.map((t) => t.id));
    }
  };

  // };

  // Render testimonial card for grid view
  const renderTestimonialCard = (testimonial: Testimonial) => {
    const Icon =
      platformIcons[testimonial.source_data?.platform as SocialPlatformName] ||
      MessageSquare;
    const platformColor =
      platformColors[testimonial.source_data?.platform as SocialPlatformName];
    const SourceIcon =
      sourceIcons[testimonial.source_data?.source as TestimonialSource];

    // Check if this testimonial matches discovery mode criteria
    const { matches, reason } = matchesDiscoveryMode(testimonial);
    const isHighlightedByDiscovery =
      testimonial.status === "pending_review" &&
      discoveryMode !== "manual" &&
      matches;

    return (
      <Card
        key={testimonial.id}
        className={cn(
          "h-full transition-all",
          testimonial.custom_fields?.highlighted
            ? "border-2 border-amber-300 shadow-amber-100 shadow-md"
            : "",
          isHighlightedByDiscovery
            ? "border-2 border-green-300 shadow-green-100 shadow-md"
            : "",
          selectedTestimonialIds.includes(testimonial.id)
            ? "bg-blue-50/50 border-blue-200"
            : ""
        )}
      >
        <CardHeader className="p-4 pb-0">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8 border">
                {testimonial.customer_profile?.avatar_url ? (
                  <AvatarImage
                    src={testimonial.customer_profile?.avatar_url}
                    alt={testimonial.customer_profile?.name}
                  />
                ) : (
                  <AvatarFallback className="bg-slate-100 text-slate-500">
                    {testimonial.customer_profile?.name?.charAt(0)}
                  </AvatarFallback>
                )}
              </Avatar>
              <div>
                <div className="flex items-center gap-1 text-sm font-medium">
                  {testimonial.customer_profile?.name}
                  {testimonial.customer_profile?.social_profiles?.verified && (
                    <Badge className="ml-1 h-4 px-1 bg-blue-100 text-blue-700 border-blue-200">
                      <Check className="h-2.5 w-2.5" />
                    </Badge>
                  )}
                </div>
                <div className="text-xs text-slate-500">
                  @{testimonial.customer_profile?.username}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {testimonial.custom_fields?.highlighted && (
                <Badge className="bg-amber-100 text-amber-700 border-amber-200">
                  <Star className="h-3 w-3 mr-1" />
                  <span>Highlighted</span>
                </Badge>
              )}

              {isHighlightedByDiscovery && (
                <Badge className="bg-green-100 text-green-700 border-green-200">
                  <Zap className="h-3 w-3 mr-1" />
                  <span>Recommended</span>
                </Badge>
              )}

              <div
                className={cn(
                  "p-1 rounded",
                  platformColor?.bg || "bg-slate-200"
                )}
                title={`Platform: ${testimonial.source_data?.platform}`}
              >
                <Icon
                  className={cn(
                    "h-3.5 w-3.5",
                    platformColor?.text || "text-slate-500"
                  )}
                />
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 pt-3 flex-grow">
          <div className="flex items-center gap-1 mb-2 text-xs text-slate-500">
            <SourceIcon className="h-3 w-3" />
            <span className="capitalize">
              {testimonial.source_data?.source}
            </span>
            <span className="text-slate-300 mx-1">•</span>
            <span>{formatRelativeTime(testimonial.created_at)}</span>
          </div>

          <p className="text-sm mb-3 line-clamp-3">{testimonial.content}</p>

          {testimonial.media_urls && testimonial.media_urls.length > 0 && (
            <div className="mb-3 grid grid-cols-2 gap-1">
              {testimonial.media_urls.slice(0, 2).map((src, i) => (
                <div
                  key={i}
                  className="relative aspect-video rounded-md overflow-hidden bg-slate-100"
                >
                  <img
                    src={src}
                    alt="Media content"
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
              {testimonial.media_urls.length > 2 && (
                <Badge className="absolute bottom-1 right-1 bg-black/70 text-white border-0">
                  +{testimonial.media_urls.length - 2} more
                </Badge>
              )}
            </div>
          )}

          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className={cn(
                  "capitalize",
                  testimonial.source_data?.sentiment === "positive"
                    ? "bg-green-100 text-green-700 border-green-200"
                    : testimonial.source_data?.sentiment === "negative"
                      ? "bg-red-100 text-red-700 border-red-200"
                      : "bg-blue-100 text-blue-700 border-blue-200"
                )}
              >
                {testimonial.source_data?.sentiment === "positive" ? (
                  <ThumbsUp className="h-3 w-3 mr-1" />
                ) : testimonial.source_data?.sentiment === "negative" ? (
                  <ThumbsDown className="h-3 w-3 mr-1" />
                ) : (
                  <Info className="h-3 w-3 mr-1" />
                )}
                {testimonial.source_data?.sentiment}
              </Badge>

              <Badge
                variant="outline"
                className={cn(
                  "capitalize",
                  testimonial.status === "approved"
                    ? "bg-green-100 text-green-700 border-green-200"
                    : testimonial.status === "rejected"
                      ? "bg-red-100 text-red-700 border-red-200"
                      : testimonial.status === "requested"
                        ? "bg-blue-100 text-blue-700 border-blue-200"
                        : "bg-amber-100 text-amber-700 border-amber-200"
                )}
              >
                {testimonial.status === "approved" ? (
                  <CheckCircle className="h-3 w-3 mr-1" />
                ) : testimonial.status === "rejected" ? (
                  <X className="h-3 w-3 mr-1" />
                ) : testimonial.status === "requested" ? (
                  <Mail className="h-3 w-3 mr-1" />
                ) : (
                  <Clock className="h-3 w-3 mr-1" />
                )}
                {testimonial.status}
              </Badge>
            </div>

            {testimonial.engagement_metrics && (
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <div className="flex items-center gap-1">
                  <Heart className="h-3 w-3" />
                  <span>{testimonial.engagement_metrics.likes}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MessageSquare className="h-3 w-3" />
                  <span>{testimonial.engagement_metrics.comments}</span>
                </div>
              </div>
            )}
          </div>

          {isHighlightedByDiscovery && (
            <div className="mt-2 text-xs text-green-600 italic">
              <Zap className="h-3 w-3 inline mr-1" />
              {reason}
            </div>
          )}
        </CardContent>

        <CardFooter className="p-3 pt-0 border-t mt-2 flex justify-between items-center">
          {isBatchActionsMode ? (
            <Checkbox
              checked={selectedTestimonialIds.includes(testimonial.id)}
              onCheckedChange={() => handleToggleSelection(testimonial.id)}
              className="ml-1"
            />
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setSelectedTestimonial(testimonial)}
            >
              <Eye className="h-4 w-4" />
            </Button>
          )}

          <div className="flex items-center gap-1">
            {testimonial.status === "pending_review" ? (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                  onClick={() => handleApprove(testimonial.id)}
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                  onClick={() => handleRequestPermission(testimonial.id)}
                >
                  <UserPlus className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => handleReject(testimonial.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
                {testimonial.status === "approved" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "h-8 w-8 p-0",
                      testimonial.custom_fields?.highlighted
                        ? "text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                        : "text-slate-600 hover:text-slate-700 hover:bg-slate-50"
                    )}
                    onClick={() => handleToggleHighlight(testimonial.id)}
                  >
                    <Star
                      className={cn(
                        "h-4 w-4",
                        testimonial.custom_fields?.highlighted
                          ? "fill-amber-500"
                          : ""
                      )}
                    />
                  </Button>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => setSelectedTestimonial(testimonial)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() =>
                        window.open(
                          `https://${testimonial.source_data?.platform}.com/example`,
                          "_blank"
                        )
                      }
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Original
                    </DropdownMenuItem>
                    {testimonial.status !== "approved" && (
                      <DropdownMenuItem
                        onClick={() => handleApprove(testimonial.id)}
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Approve
                      </DropdownMenuItem>
                    )}
                    {testimonial.status !== "rejected" && (
                      <DropdownMenuItem
                        onClick={() => handleReject(testimonial.id)}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Reject
                      </DropdownMenuItem>
                    )}
                    {testimonial.status !== "requested" && (
                      <DropdownMenuItem
                        onClick={() => handleRequestPermission(testimonial.id)}
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Request Permission
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </div>
        </CardFooter>
      </Card>
    );
  };

  // Render testimonial row for table view
  const renderTestimonialRow = (testimonial: Testimonial) => {
    const Icon =
      platformIcons[testimonial.source_data?.platform as SocialPlatformName] ||
      MessageSquare;
    const platformColor =
      platformColors[testimonial.source_data?.platform as SocialPlatformName];
    const SourceIcon =
      sourceIcons[testimonial.source_data?.source as TestimonialSource];

    // Check if this testimonial matches discovery mode criteria
    const { matches, reason } = matchesDiscoveryMode(testimonial);
    const isHighlightedByDiscovery =
      testimonial.status === "pending_review" &&
      discoveryMode !== "manual" &&
      matches;

    return (
      <tr
        key={testimonial.id}
        className={cn(
          "border-b transition-colors hover:bg-slate-50",
          testimonial.source_data?.highlighted ? "bg-amber-50/40" : "",
          isHighlightedByDiscovery ? "bg-green-50/60" : "",
          selectedTestimonialIds.includes(testimonial.id) ? "bg-blue-50/50" : ""
        )}
      >
        {isBatchActionsMode && (
          <td className="p-2 align-middle w-10">
            <Checkbox
              checked={selectedTestimonialIds.includes(testimonial.id)}
              onCheckedChange={() => handleToggleSelection(testimonial.id)}
            />
          </td>
        )}

        <td className="p-3 align-middle">
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8 border">
              {testimonial.customer_profile?.avatar_url ? (
                <AvatarImage
                  src={testimonial.customer_profile?.avatar_url}
                  alt={testimonial.customer_profile?.name}
                />
              ) : (
                <AvatarFallback>
                  {testimonial.customer_profile?.name?.charAt(0)}
                </AvatarFallback>
              )}
            </Avatar>
            <div>
              <div className="flex items-center gap-1">
                <span className="font-medium">
                  {testimonial.customer_profile?.name}
                </span>
                {testimonial.customer_profile?.social_profiles?.verified && (
                  <Badge className="ml-1 h-4 px-1 bg-blue-100 text-blue-700 border-blue-200">
                    <Check className="h-2.5 w-2.5" />
                  </Badge>
                )}
              </div>
              <div className="text-xs text-slate-500">
                @{testimonial.customer_profile?.username}
              </div>
            </div>
          </div>
        </td>

        <td className="p-3 align-middle">
          <div className="flex flex-col gap-1 max-w-md">
            <p className="text-sm line-clamp-2">{testimonial.content}</p>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>{formatRelativeTime(testimonial.created_at)}</span>
              </div>
              {testimonial.engagement_metrics && (
                <>
                  <div className="flex items-center gap-1">
                    <Heart className="h-3 w-3" />
                    <span>{testimonial.engagement_metrics.likes}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MessageSquare className="h-3 w-3" />
                    <span>{testimonial.engagement_metrics.comments}</span>
                  </div>
                </>
              )}
            </div>

            {isHighlightedByDiscovery && (
              <div className="text-xs text-green-600 italic mt-1">
                <Zap className="h-3 w-3 inline mr-1" />
                {reason}
              </div>
            )}
          </div>
        </td>

        <td className="p-3 align-middle">
          <div className="flex items-center gap-2">
            <div
              className={cn("p-1 rounded", platformColor?.bg || "bg-slate-200")}
            >
              <Icon
                className={cn(
                  "h-3.5 w-3.5",
                  platformColor?.text || "text-slate-500"
                )}
              />
            </div>
            <div className="flex items-center gap-1 text-xs">
              <SourceIcon className="h-3 w-3 text-slate-500" />
              <span className="capitalize">
                {testimonial.source_data?.source}
              </span>
            </div>
          </div>
        </td>

        <td className="p-3 align-middle">
          <Badge
            variant="outline"
            className={cn(
              "capitalize",
              testimonial.source_data?.sentiment === "positive"
                ? "bg-green-100 text-green-700 border-green-200"
                : testimonial.source_data?.sentiment === "negative"
                  ? "bg-red-100 text-red-700 border-red-200"
                  : "bg-blue-100 text-blue-700 border-blue-200"
            )}
          >
            {testimonial.source_data?.sentiment === "positive" ? (
              <ThumbsUp className="h-3 w-3 mr-1" />
            ) : testimonial.source_data?.sentiment === "negative" ? (
              <ThumbsDown className="h-3 w-3 mr-1" />
            ) : (
              <Info className="h-3 w-3 mr-1" />
            )}
            {testimonial.source_data?.sentiment}
          </Badge>

          <div className="flex items-center gap-1 mt-1">
            <Progress
              value={testimonial.source_data?.score * 100}
              className="h-1.5 w-20"
              style={
                {
                  "--progress-background": "rgb(241, 245, 249)",
                  "--progress-foreground":
                    testimonial.source_data?.sentiment === "positive"
                      ? "rgb(34, 197, 94)"
                      : testimonial.source_data?.sentiment === "negative"
                        ? "rgb(239, 68, 68)"
                        : "rgb(59, 130, 246)",
                } as React.CSSProperties
              }
            />
            <span className="text-xs text-slate-500">
              {Math.round((testimonial.source_data?.score || 0) * 100)}%
            </span>
          </div>
        </td>

        <td className="p-3 align-middle">
          <Badge
            variant="outline"
            className={cn(
              "capitalize",
              testimonial.status === "approved"
                ? "bg-green-100 text-green-700 border-green-200"
                : testimonial.status === "rejected"
                  ? "bg-red-100 text-red-700 border-red-200"
                  : testimonial.status === "requested"
                    ? "bg-blue-100 text-blue-700 border-blue-200"
                    : "bg-amber-100 text-amber-700 border-amber-200"
            )}
          >
            {testimonial.status === "approved" ? (
              <CheckCircle className="h-3 w-3 mr-1" />
            ) : testimonial.status === "rejected" ? (
              <X className="h-3 w-3 mr-1" />
            ) : testimonial.status === "requested" ? (
              <Mail className="h-3 w-3 mr-1" />
            ) : (
              <Clock className="h-3 w-3 mr-1" />
            )}
            {testimonial.status}
          </Badge>

          {testimonial.status === "approved" &&
            testimonial.custom_fields?.highlighted && (
              <Badge className="mt-1 bg-amber-100 text-amber-700 border-amber-200">
                <Star className="h-3 w-3 mr-1" />
                <span>Highlighted</span>
              </Badge>
            )}

          {isHighlightedByDiscovery && (
            <Badge className="mt-1 bg-green-100 text-green-700 border-green-200">
              <Zap className="h-3 w-3 mr-1" />
              <span>Recommended</span>
            </Badge>
          )}
        </td>

        <td className="p-3 align-middle">
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setSelectedTestimonial(testimonial)}
            >
              <Eye className="h-4 w-4" />
            </Button>

            {testimonial.status === "pending_review" ? (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                  onClick={() => handleApprove(testimonial.id)}
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                  onClick={() => handleRequestPermission(testimonial.id)}
                >
                  <UserPlus className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => handleReject(testimonial.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
                {testimonial.status === "approved" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "h-8 w-8 p-0",
                      testimonial.custom_fields?.highlighted
                        ? "text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                        : "text-slate-600 hover:text-slate-700 hover:bg-slate-50"
                    )}
                    onClick={() => handleToggleHighlight(testimonial.id)}
                  >
                    <Star
                      className={cn(
                        "h-4 w-4",
                        testimonial.custom_fields?.highlighted
                          ? "fill-amber-500"
                          : ""
                      )}
                    />
                  </Button>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() =>
                        window.open(
                          `https://${testimonial.source_data?.platform}.com/example`,
                          "_blank"
                        )
                      }
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Original
                    </DropdownMenuItem>
                    {testimonial.status !== "approved" && (
                      <DropdownMenuItem
                        onClick={() => handleApprove(testimonial.id)}
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Approve
                      </DropdownMenuItem>
                    )}
                    {testimonial.status !== "rejected" && (
                      <DropdownMenuItem
                        onClick={() => handleReject(testimonial.id)}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Reject
                      </DropdownMenuItem>
                    )}
                    {testimonial.status !== "requested" && (
                      <DropdownMenuItem
                        onClick={() => handleRequestPermission(testimonial.id)}
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Request Permission
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </div>
        </td>
      </tr>
    );
  };

  return (
    <motion.div
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header & Controls */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div>
          <h2 className="text-xl font-semibold tracking-tight mb-1">
            Testimonial Discovery
          </h2>
          <p className="text-sm text-muted-foreground">
            Discover, manage, and approve testimonials from your social media
            platforms
          </p>
        </div>

        <div className="flex gap-2 flex-wrap justify-end">
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "h-9 transition-colors",
              isBatchActionsMode
                ? "bg-blue-50 border-blue-200 text-blue-700"
                : ""
            )}
            onClick={() => setIsBatchActionsMode(!isBatchActionsMode)}
          >
            <CheckCircle className="h-4 w-4 mr-1.5" />
            <span>Batch Mode</span>
            {isBatchActionsMode && (
              <Badge className="ml-1.5 bg-blue-100 text-blue-700 border-0">
                {selectedTestimonialIds.length}
              </Badge>
            )}
          </Button>

          <Button
            variant="outline"
            size="sm"
            className={cn(
              "h-9 transition-colors",
              showDiscoveryActivity
                ? "bg-purple-50 border-purple-200 text-purple-700"
                : ""
            )}
            onClick={() => setShowDiscoveryActivity(!showDiscoveryActivity)}
          >
            <Activity className="h-4 w-4 mr-1.5" />
            <span>Activity</span>
            {discoveryActivity.length > 0 && (
              <Badge className="ml-1.5 bg-purple-100 text-purple-700 border-0">
                {discoveryActivity.length}
              </Badge>
            )}
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="h-9"
            onClick={() => setIsSettingsModalOpen(true)}
          >
            <Settings className="h-4 w-4 mr-1.5" />
            <span>Settings</span>
          </Button>

          <Button
            size="sm"
            className="h-9 gap-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            <span>{isRefreshing ? "Refreshing..." : "Refresh"}</span>
          </Button>
        </div>
      </motion.div>

      {/* Discovery Activity Log */}
      {showDiscoveryActivity && discoveryActivity.length > 0 && (
        <motion.div variants={itemVariants}>
          <Card className="overflow-hidden border-purple-200 bg-purple-50/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="h-4 w-4 text-purple-600" />
                <span>Discovery Activity</span>
              </CardTitle>
              <CardDescription>
                Recent testimonial discovery and processing activity
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-64 overflow-y-auto">
                <div className="p-4 space-y-3">
                  {discoveryActivity.slice(0, 10).map((activity, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 pb-2 border-b border-purple-100 last:border-0"
                    >
                      <div className="bg-white p-2 rounded-full border">
                        {activity.action.includes("approved") ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : activity.action.includes("Rejected") ? (
                          <X className="h-4 w-4 text-red-500" />
                        ) : activity.action.includes("Permission") ? (
                          <UserPlus className="h-4 w-4 text-blue-500" />
                        ) : (
                          <Zap className="h-4 w-4 text-purple-500" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <h4 className="text-sm font-medium">
                            {activity.action}
                          </h4>
                          <span className="text-xs text-slate-500">
                            {formatRelativeTime(activity.timestamp)}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1">
                          {activity.reason}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Activity summary */}
              <div className="bg-white border-t border-purple-100 p-3">
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div className="p-2 rounded-md bg-green-50 border border-green-100">
                    <h5 className="text-sm font-medium text-green-800">
                      Auto Approved
                    </h5>
                    <p className="text-lg font-semibold text-green-600">
                      {discoveryStats.autoApproved}
                    </p>
                  </div>
                  <div className="p-2 rounded-md bg-purple-50 border border-purple-100">
                    <h5 className="text-sm font-medium text-purple-800">
                      Keyword Matches
                    </h5>
                    <p className="text-lg font-semibold text-purple-600">
                      {discoveryStats.keywordMatched}
                    </p>
                  </div>
                  <div className="p-2 rounded-md bg-blue-50 border border-blue-100">
                    <h5 className="text-sm font-medium text-blue-800">
                      Sentiment Based
                    </h5>
                    <p className="text-lg font-semibold text-blue-600">
                      {discoveryStats.sentimentApproved}
                    </p>
                  </div>
                  <div className="p-2 rounded-md bg-indigo-50 border border-indigo-100">
                    <h5 className="text-sm font-medium text-indigo-800">
                      AI Recommended
                    </h5>
                    <p className="text-lg font-semibold text-indigo-600">
                      {discoveryStats.aiRecommended}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Discovery Mode Selection */}
      <motion.div variants={itemVariants}>
        <Card className="overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="h-4 w-4 text-purple-600" />
              <span>Discovery Mode</span>
            </CardTitle>
            <CardDescription>
              Choose how testimonials are discovered and processed from social
              media
            </CardDescription>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              {discoveryModes.map((mode) => (
                <Card
                  key={mode.id}
                  className={cn(
                    "cursor-pointer transition-all overflow-hidden border",
                    discoveryMode === mode.id
                      ? `border-2 border-${mode.color.split("-")[1]}-500 ring-1 ring-${mode.color.split("-")[1]}-500/20 bg-${mode.color.split("-")[1]}-50/50`
                      : "hover:bg-slate-50"
                  )}
                  onClick={() => handleDiscoveryModeChange(mode.id)}
                >
                  <CardHeader className="p-3 pb-0">
                    <div className="flex justify-between items-start">
                      <div className={cn("p-2 rounded-md", mode.bgColor)}>
                        <mode.icon className={cn("h-4 w-4", mode.color)} />
                      </div>
                      {discoveryMode === mode.id && (
                        <Badge
                          className={`bg-${mode.color.split("-")[1]}-100 ${mode.color} border-${mode.color.split("-")[1]}-200`}
                        >
                          Active
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="p-3 pt-2">
                    <h3 className="font-medium text-sm">{mode.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {mode.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="mt-4 flex flex-col sm:flex-row items-center justify-between p-4 rounded-lg border bg-slate-50">
              <div className="flex items-center gap-3 mb-3 sm:mb-0">
                <div
                  className={cn(
                    "p-2 rounded-md",
                    discoveryModes.find((m) => m.id === discoveryMode)
                      ?.bgColor || "bg-blue-100"
                  )}
                >
                  {React.createElement(
                    discoveryModes.find((m) => m.id === discoveryMode)?.icon ||
                      Zap,
                    {
                      className: cn(
                        "h-4 w-4",
                        discoveryModes.find((m) => m.id === discoveryMode)
                          ?.color || "text-blue-600"
                      ),
                    }
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-medium">
                    {discoveryModes.find((m) => m.id === discoveryMode)?.name ||
                      "Auto"}{" "}
                    Discovery Active
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {discoveryMode === "auto" &&
                      `Automatically discovers and approves testimonials with at least ${sentimentThreshold}% positive sentiment.`}
                    {discoveryMode === "manual" &&
                      "All testimonials require manual review and approval."}
                    {discoveryMode === "keyword" &&
                      `Prioritizes testimonials containing specific keywords like "${keywordsList.join('", "')}".`}
                    {discoveryMode === "sentiment" &&
                      `Approves testimonials with sentiment scores above ${sentimentThreshold}%.`}
                    {discoveryMode === "ai" &&
                      "AI analyzes engagement and sentiment to find the most valuable testimonials."}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {discoveryMode === "auto" || discoveryMode === "sentiment" ? (
                  <div className="space-y-1">
                    <Label htmlFor="sentiment-threshold" className="text-xs">
                      Sentiment Threshold: {sentimentThreshold}%
                    </Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="sentiment-threshold"
                        type="range"
                        min="50"
                        max="100"
                        value={sentimentThreshold}
                        onChange={(e) =>
                          setSentimentThreshold(parseInt(e.target.value))
                        }
                        className="w-32 h-8"
                      />
                    </div>
                  </div>
                ) : discoveryMode === "keyword" ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs bg-white"
                    onClick={() => setIsSettingsModalOpen(true)}
                  >
                    <Search className="h-3.5 w-3.5 mr-1.5" />
                    Configure Keywords
                  </Button>
                ) : null}

                <Button
                  variant="default"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={processTestimonials}
                  disabled={discoveryMode === "manual"}
                >
                  <Zap className="h-3.5 w-3.5 mr-1.5" />
                  Process Testimonials
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Filter Bar */}
      <motion.div variants={itemVariants} className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search for testimonials, keywords, or users..."
              className="pl-9 w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap gap-2 justify-between md:justify-end">
            <Popover
              open={activeFilter === "status"}
              onOpenChange={() =>
                setActiveFilter(activeFilter === "status" ? null : "status")
              }
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "h-9 gap-1.5",
                    activeTab !== "all" ? "bg-slate-100 border-slate-300" : ""
                  )}
                >
                  <Clock className="h-4 w-4" />
                  <span>
                    {activeTab === "all"
                      ? "Status"
                      : activeTab === "pending_review"
                        ? "Pending"
                        : activeTab === "approved"
                          ? "Approved"
                          : activeTab === "rejected"
                            ? "Rejected"
                            : "Requested"}
                  </span>
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-48 p-2">
                <div className="space-y-1">
                  <Button
                    variant={activeTab === "all" ? "outline" : "ghost"}
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => {
                      setActiveTab("all");
                      setActiveFilter(null);
                    }}
                  >
                    <Activity className="h-4 w-4 mr-2" />
                    All Statuses
                  </Button>
                  <Button
                    variant={
                      activeTab === "pending_review" ? "outline" : "ghost"
                    }
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => {
                      setActiveTab("pending_review");
                      setActiveFilter(null);
                    }}
                  >
                    <Clock className="h-4 w-4 mr-2 text-amber-500" />
                    Pending
                    <Badge className="ml-auto bg-amber-100 text-amber-700 border-amber-200">
                      {stats.pending}
                    </Badge>
                  </Button>
                  <Button
                    variant={activeTab === "approved" ? "outline" : "ghost"}
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => {
                      setActiveTab("approved");
                      setActiveFilter(null);
                    }}
                  >
                    <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                    Approved
                    <Badge className="ml-auto bg-green-100 text-green-700 border-green-200">
                      {stats.approved}
                    </Badge>
                  </Button>
                  <Button
                    variant={activeTab === "rejected" ? "outline" : "ghost"}
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => {
                      setActiveTab("rejected");
                      setActiveFilter(null);
                    }}
                  >
                    <X className="h-4 w-4 mr-2 text-red-500" />
                    Rejected
                    <Badge className="ml-auto bg-red-100 text-red-700 border-red-200">
                      {stats.rejected}
                    </Badge>
                  </Button>
                  <Button
                    variant={activeTab === "requested" ? "outline" : "ghost"}
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => {
                      setActiveTab("requested");
                      setActiveFilter(null);
                    }}
                  >
                    <Mail className="h-4 w-4 mr-2 text-blue-500" />
                    Requested
                    <Badge className="ml-auto bg-blue-100 text-blue-700 border-blue-200">
                      {stats.requested}
                    </Badge>
                  </Button>
                </div>
              </PopoverContent>
            </Popover>

            <Popover
              open={activeFilter === "platform"}
              onOpenChange={() =>
                setActiveFilter(activeFilter === "platform" ? null : "platform")
              }
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "h-9 gap-1.5",
                    platformFilter !== "all"
                      ? "bg-slate-100 border-slate-300"
                      : ""
                  )}
                >
                  {platformFilter !== "all" ? (
                    React.createElement(
                      platformIcons[platformFilter as SocialPlatformName] ||
                        MessageSquare,
                      { className: "h-4 w-4" }
                    )
                  ) : (
                    <MessageSquare className="h-4 w-4" />
                  )}
                  <span>
                    {platformFilter === "all" ? "Platform" : platformFilter}
                  </span>
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-48 p-2">
                <div className="space-y-1">
                  <Button
                    variant={platformFilter === "all" ? "outline" : "ghost"}
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => {
                      setPlatformFilter("all");
                      setActiveFilter(null);
                    }}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    All Platforms
                  </Button>

                  {Object.entries(filterStats.platformCounts).map(
                    ([platform, count]) => {
                      const Icon =
                        platformIcons[platform as SocialPlatformName] ||
                        MessageSquare;

                      return (
                        <Button
                          key={platform}
                          variant={
                            platformFilter === platform ? "outline" : "ghost"
                          }
                          size="sm"
                          className="w-full justify-start"
                          onClick={() => {
                            setPlatformFilter(platform);
                            setActiveFilter(null);
                          }}
                        >
                          <Icon className="h-4 w-4 mr-2" />
                          <span className="capitalize">{platform}</span>
                          <Badge className="ml-auto bg-slate-100 text-slate-700 border-slate-200">
                            {count}
                          </Badge>
                        </Button>
                      );
                    }
                  )}
                </div>
              </PopoverContent>
            </Popover>

            <Popover
              open={activeFilter === "source"}
              onOpenChange={() =>
                setActiveFilter(activeFilter === "source" ? null : "source")
              }
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "h-9 gap-1.5",
                    sourceFilter !== "all"
                      ? "bg-slate-100 border-slate-300"
                      : ""
                  )}
                >
                  {sourceFilter !== "all" ? (
                    React.createElement(sourceIcons[sourceFilter], {
                      className: "h-4 w-4",
                    })
                  ) : (
                    <Layers className="h-4 w-4" />
                  )}
                  <span>
                    {sourceFilter === "all" ? "Source" : sourceFilter}
                  </span>
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-48 p-2">
                <div className="space-y-1">
                  <Button
                    variant={sourceFilter === "all" ? "outline" : "ghost"}
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => {
                      setSourceFilter("all");
                      setActiveFilter(null);
                    }}
                  >
                    <Layers className="h-4 w-4 mr-2" />
                    All Sources
                  </Button>

                  {Object.entries(filterStats.sourceCounts).map(
                    ([source, count]) => {
                      const Icon = sourceIcons[source as TestimonialSource];

                      return (
                        <Button
                          key={source}
                          variant={
                            sourceFilter === source ? "outline" : "ghost"
                          }
                          size="sm"
                          className="w-full justify-start"
                          onClick={() => {
                            setSourceFilter(source as TestimonialSource);
                            setActiveFilter(null);
                          }}
                        >
                          <Icon className="h-4 w-4 mr-2" />
                          <span className="capitalize">{source}</span>
                          <Badge className="ml-auto bg-slate-100 text-slate-700 border-slate-200">
                            {count}
                          </Badge>
                        </Button>
                      );
                    }
                  )}
                </div>
              </PopoverContent>
            </Popover>

            <Popover
              open={activeFilter === "sentiment"}
              onOpenChange={() =>
                setActiveFilter(
                  activeFilter === "sentiment" ? null : "sentiment"
                )
              }
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "h-9 gap-1.5",
                    sentimentFilter !== "all"
                      ? "bg-slate-100 border-slate-300"
                      : ""
                  )}
                >
                  {sentimentFilter === "positive" ? (
                    <ThumbsUp className="h-4 w-4" />
                  ) : sentimentFilter === "negative" ? (
                    <ThumbsDown className="h-4 w-4" />
                  ) : sentimentFilter === "neutral" ? (
                    <Info className="h-4 w-4" />
                  ) : (
                    <Heart className="h-4 w-4" />
                  )}
                  <span>
                    {sentimentFilter === "all" ? "Sentiment" : sentimentFilter}
                  </span>
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-48 p-2">
                <div className="space-y-1">
                  <Button
                    variant={sentimentFilter === "all" ? "outline" : "ghost"}
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => {
                      setSentimentFilter("all");
                      setActiveFilter(null);
                    }}
                  >
                    <Heart className="h-4 w-4 mr-2" />
                    All Sentiment
                  </Button>

                  <Button
                    variant={
                      sentimentFilter === "positive" ? "outline" : "ghost"
                    }
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => {
                      setSentimentFilter("positive");
                      setActiveFilter(null);
                    }}
                  >
                    <ThumbsUp className="h-4 w-4 mr-2 text-green-500" />
                    Positive
                    <Badge className="ml-auto bg-green-100 text-green-700 border-green-200">
                      {filterStats.sentimentCounts.positive || 0}
                    </Badge>
                  </Button>

                  <Button
                    variant={
                      sentimentFilter === "neutral" ? "outline" : "ghost"
                    }
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => {
                      setSentimentFilter("neutral");
                      setActiveFilter(null);
                    }}
                  >
                    <Info className="h-4 w-4 mr-2 text-blue-500" />
                    Neutral
                    <Badge className="ml-auto bg-blue-100 text-blue-700 border-blue-200">
                      {filterStats.sentimentCounts.neutral || 0}
                    </Badge>
                  </Button>

                  <Button
                    variant={
                      sentimentFilter === "negative" ? "outline" : "ghost"
                    }
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => {
                      setSentimentFilter("negative");
                      setActiveFilter(null);
                    }}
                  >
                    <ThumbsDown className="h-4 w-4 mr-2 text-red-500" />
                    Negative
                    <Badge className="ml-auto bg-red-100 text-red-700 border-red-200">
                      {filterStats.sentimentCounts.negative || 0}
                    </Badge>
                  </Button>
                </div>
              </PopoverContent>
            </Popover>

            <Button
              variant="outline"
              size="sm"
              className={cn(
                "h-9 gap-1.5",
                advancedFiltersOpen ? "bg-slate-100 border-slate-300" : ""
              )}
              onClick={() => setAdvancedFiltersOpen(!advancedFiltersOpen)}
            >
              <Filter className="h-4 w-4" />
              <span>Filters</span>
              {(dateRangeFilter !== "all" ||
                minFollowersFilter > 0 ||
                minEngagementFilter > 0 ||
                keywordFilter) && (
                <Badge className="ml-1 bg-blue-100 text-blue-700 border-blue-200">
                  Active
                </Badge>
              )}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 gap-1.5">
                  <ArrowRight className="h-4 w-4" />
                  <span>
                    Sort:{" "}
                    {sortOrder === "date"
                      ? "Latest"
                      : sortOrder === "score"
                        ? "Score"
                        : "Engagement"}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Sort Order</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setSortOrder("date")}>
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>Latest First</span>
                  {sortOrder === "date" && <Check className="h-4 w-4 ml-2" />}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortOrder("score")}>
                  <Star className="h-4 w-4 mr-2" />
                  <span>Best Score</span>
                  {sortOrder === "score" && <Check className="h-4 w-4 ml-2" />}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortOrder("engagement")}>
                  <Activity className="h-4 w-4 mr-2" />
                  <span>Most Engagement</span>
                  {sortOrder === "engagement" && (
                    <Check className="h-4 w-4 ml-2" />
                  )}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="flex rounded-md overflow-hidden">
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="sm"
                className={cn(
                  "h-9 rounded-r-none gap-1.5",
                  viewMode === "list" ? "" : "border-r-0"
                )}
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
                <span>List</span>
              </Button>
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="sm"
                className={cn(
                  "h-9 rounded-l-none gap-1.5",
                  viewMode === "grid" ? "" : "border-l-0"
                )}
                onClick={() => setViewMode("grid")}
              >
                <LayoutGrid className="h-4 w-4" />
                <span>Grid</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Advanced filters */}
        {advancedFiltersOpen && (
          <Card className="p-4 border bg-slate-50">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date-range" className="text-sm">
                  Date Range
                </Label>
                <Select
                  value={dateRangeFilter}
                  onValueChange={(value: any) => setDateRangeFilter(value)}
                >
                  <SelectTrigger id="date-range">
                    <SelectValue placeholder="Select date range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">This week</SelectItem>
                    <SelectItem value="month">This month</SelectItem>
                    <SelectItem value="custom">Custom range</SelectItem>
                  </SelectContent>
                </Select>

                {dateRangeFilter === "custom" && (
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div className="space-y-1">
                      <Label htmlFor="date-start" className="text-xs">
                        Start
                      </Label>
                      <Input
                        id="date-start"
                        type="date"
                        value={customDateRange.start}
                        onChange={(e) =>
                          setCustomDateRange({
                            ...customDateRange,
                            start: e.target.value,
                          })
                        }
                        className="h-8"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="date-end" className="text-xs">
                        End
                      </Label>
                      <Input
                        id="date-end"
                        type="date"
                        value={customDateRange.end}
                        onChange={(e) =>
                          setCustomDateRange({
                            ...customDateRange,
                            end: e.target.value,
                          })
                        }
                        className="h-8"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="min-followers" className="text-sm">
                  Min. Followers
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="min-followers"
                    type="number"
                    min="0"
                    value={minFollowersFilter}
                    onChange={(e) =>
                      setMinFollowersFilter(parseInt(e.target.value) || 0)
                    }
                    className="h-8"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-2 flex-shrink-0"
                    onClick={() => setMinFollowersFilter(0)}
                    disabled={minFollowersFilter === 0}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="min-engagement" className="text-sm">
                  Min. Engagement
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="min-engagement"
                    type="number"
                    min="0"
                    value={minEngagementFilter}
                    onChange={(e) =>
                      setMinEngagementFilter(parseInt(e.target.value) || 0)
                    }
                    className="h-8"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-2 flex-shrink-0"
                    onClick={() => setMinEngagementFilter(0)}
                    disabled={minEngagementFilter === 0}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="keyword-filter" className="text-sm">
                  Tags/Keywords Filter
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="keyword-filter"
                    placeholder="quality, support, easy"
                    value={keywordFilter}
                    onChange={(e) => setKeywordFilter(e.target.value)}
                    className="h-8"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-2 flex-shrink-0"
                    onClick={() => setKeywordFilter("")}
                    disabled={!keywordFilter}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Comma separated, matches tags or content
                </p>
              </div>

              <div className="md:col-span-3 flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8"
                  onClick={() => {
                    setDateRangeFilter("all");
                    setCustomDateRange({
                      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                        .toISOString()
                        .split("T")[0],
                      end: new Date().toISOString().split("T")[0],
                    });
                    setMinFollowersFilter(0);
                    setMinEngagementFilter(0);
                    setKeywordFilter("");
                  }}
                >
                  <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                  Reset Filters
                </Button>

                <Button
                  size="sm"
                  className="h-8"
                  onClick={() => setAdvancedFiltersOpen(false)}
                >
                  <Check className="h-3.5 w-3.5 mr-1.5" />
                  Apply Filters
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Batch action bar */}
        {isBatchActionsMode && selectedTestimonialIds.length > 0 && (
          <div className="flex items-center justify-between p-3 rounded-md bg-blue-50 border border-blue-200 transition-all">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={
                  selectedTestimonialIds.length ===
                    filteredTestimonials.length &&
                  filteredTestimonials.length > 0
                }
                onCheckedChange={handleToggleSelectAll}
              />
              <span className="text-sm text-blue-700 font-medium">
                {selectedTestimonialIds.length} testimonials selected
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 border-blue-200 text-blue-700 hover:bg-blue-100"
                onClick={() => setSelectedTestimonialIds([])}
              >
                Clear
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="h-8 border-green-200 text-green-700 bg-green-50 hover:bg-green-100"
                onClick={() => handleBatchAction("approve")}
              >
                <Check className="h-3.5 w-3.5 mr-1.5" />
                Approve All
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="h-8 border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100"
                onClick={() => handleBatchAction("request")}
              >
                <UserPlus className="h-3.5 w-3.5 mr-1.5" />
                Request All
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="h-8 border-red-200 text-red-700 bg-red-50 hover:bg-red-100"
                onClick={() => handleBatchAction("reject")}
              >
                <X className="h-3.5 w-3.5 mr-1.5" />
                Reject All
              </Button>
            </div>
          </div>
        )}

        {/* Success message for batch actions */}
        {showBatchSuccessMessage && (
          <div className="flex items-center justify-between p-3 rounded-md bg-green-50 border border-green-200 animate-in fade-in slide-in-from-top">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-sm text-green-700">
                Batch action completed successfully
              </span>
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-green-700 hover:bg-green-100 hover:text-green-800"
              onClick={() => setShowBatchSuccessMessage(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
      </motion.div>

      {/* Testimonials List */}
      <motion.div variants={itemVariants}>
        {filteredTestimonials.length === 0 ? (
          <Card className="border-2 border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <div className="rounded-full bg-slate-100 p-3 mb-4">
                <Search className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="text-xl font-medium text-slate-800 mb-2">
                No testimonials found
              </h3>
              <p className="text-slate-500 max-w-md mb-6">
                {searchQuery ||
                activeTab !== "all" ||
                platformFilter !== "all" ||
                sourceFilter !== "all" ||
                sentimentFilter !== "all" ||
                dateRangeFilter !== "all" ||
                minFollowersFilter > 0 ||
                minEngagementFilter > 0 ||
                keywordFilter
                  ? "Try adjusting your filters or search query to find testimonials"
                  : "Connect your social platforms and refresh to start discovering testimonials"}
              </p>

              {(searchQuery ||
                activeTab !== "all" ||
                platformFilter !== "all" ||
                sourceFilter !== "all" ||
                sentimentFilter !== "all" ||
                dateRangeFilter !== "all" ||
                minFollowersFilter > 0 ||
                minEngagementFilter > 0 ||
                keywordFilter) && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery("");
                    setActiveTab("all");
                    setPlatformFilter("all");
                    setSourceFilter("all");
                    setSentimentFilter("all");
                    setDateRangeFilter("all");
                    setMinFollowersFilter(0);
                    setMinEngagementFilter(0);
                    setKeywordFilter("");
                  }}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Clear Filters
                </Button>
              )}
            </CardContent>
          </Card>
        ) : viewMode === "grid" ? (
          // Grid view
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTestimonials.map((testimonial) =>
              renderTestimonialCard(testimonial)
            )}
          </div>
        ) : (
          // Table view
          <Card>
            <CardContent className="p-0">
              <div className="relative w-full overflow-auto">
                <table className="w-full caption-bottom text-sm">
                  <thead className="border-b bg-slate-50">
                    <tr className="hover:bg-muted/5">
                      {isBatchActionsMode && (
                        <th className="p-2 align-middle w-10">
                          <Checkbox
                            checked={
                              selectedTestimonialIds.length ===
                                filteredTestimonials.length &&
                              filteredTestimonials.length > 0
                            }
                            onCheckedChange={handleToggleSelectAll}
                          />
                        </th>
                      )}
                      <th className="h-10 px-3 text-left align-middle font-medium text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <span>Author</span>
                        </div>
                      </th>
                      <th className="h-10 px-3 text-left align-middle font-medium text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <span>Content</span>
                        </div>
                      </th>
                      <th className="h-10 px-3 text-left align-middle font-medium text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <span>Source</span>
                        </div>
                      </th>
                      <th className="h-10 px-3 text-left align-middle font-medium text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <span>Sentiment</span>
                        </div>
                      </th>
                      <th className="h-10 px-3 text-left align-middle font-medium text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <span>Status</span>
                        </div>
                      </th>
                      <th className="h-10 px-3 text-left align-middle font-medium text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <span>Actions</span>
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTestimonials.map((testimonial) =>
                      renderTestimonialRow(testimonial)
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </motion.div>

      {/* Testimonial Detail Modal */}
      <Dialog
        open={!!selectedTestimonial}
        onOpenChange={(open) => !open && setSelectedTestimonial(null)}
      >
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-auto">
          {selectedTestimonial && (
            <>
              <DialogHeader>
                <DialogTitle>Testimonial Details</DialogTitle>
                <DialogDescription>
                  View and manage details for this testimonial
                </DialogDescription>
              </DialogHeader>

              <Tabs
                defaultValue="overview"
                value={modalTab}
                onValueChange={(value: any) => setModalTab(value)}
              >
                <TabsList className="grid grid-cols-3 w-full mb-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="engagement">Engagement</TabsTrigger>
                  <TabsTrigger value="author">Author</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                  {/* Testimonial header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 border">
                        {selectedTestimonial.customer_profile?.avatar_url ? (
                          <AvatarImage
                            src={
                              selectedTestimonial.customer_profile?.avatar_url
                            }
                            alt={selectedTestimonial.customer_profile?.name}
                          />
                        ) : (
                          <AvatarFallback>
                            {selectedTestimonial.customer_profile?.name?.charAt(
                              0
                            )}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div>
                        <div className="font-medium flex items-center gap-1.5">
                          {selectedTestimonial.customer_profile?.name}
                          {selectedTestimonial.customer_profile?.social_profiles
                            ?.verified && (
                            <Badge className="ml-1 h-4 px-1 bg-blue-100 text-blue-700 border-blue-200">
                              <Check className="h-2.5 w-2.5" />
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-slate-500">
                          @{selectedTestimonial.customer_profile?.username}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={cn(
                          "capitalize",
                          selectedTestimonial.status === "approved"
                            ? "bg-green-100 text-green-700 border-green-200"
                            : selectedTestimonial.status === "rejected"
                              ? "bg-red-100 text-red-700 border-red-200"
                              : selectedTestimonial.status === "requested"
                                ? "bg-blue-100 text-blue-700 border-blue-200"
                                : "bg-amber-100 text-amber-700 border-amber-200"
                        )}
                      >
                        {selectedTestimonial.status === "approved" ? (
                          <CheckCircle className="h-3 w-3 mr-1" />
                        ) : selectedTestimonial.status === "rejected" ? (
                          <X className="h-3 w-3 mr-1" />
                        ) : selectedTestimonial.status === "requested" ? (
                          <Mail className="h-3 w-3 mr-1" />
                        ) : (
                          <Clock className="h-3 w-3 mr-1" />
                        )}
                        {selectedTestimonial.status}
                      </Badge>

                      <div className="flex items-center gap-1">
                        {React.createElement(
                          platformIcons[
                            selectedTestimonial.source_data
                              ?.platform as SocialPlatformName
                          ] || MessageSquare,
                          {
                            className: cn(
                              "h-4 w-4",
                              platformColors[
                                selectedTestimonial.source_data
                                  ?.platform as SocialPlatformName
                              ]?.text || "text-slate-500"
                            ),
                          }
                        )}
                        <span className="text-sm capitalize">
                          {selectedTestimonial.source_data?.platform}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Check if testimonial matches discovery criteria */}
                  {selectedTestimonial.status === "pending_review" &&
                    discoveryMode !== "manual" &&
                    matchesDiscoveryMode(selectedTestimonial).matches && (
                      <div className="bg-green-50 border border-green-200 rounded-md p-3 mb-2">
                        <div className="flex items-start gap-2">
                          <Zap className="h-4 w-4 text-green-600 mt-0.5" />
                          <div>
                            <h4 className="text-sm font-medium text-green-800">
                              Discovery Recommendation
                            </h4>
                            <p className="text-sm text-green-700 mt-1">
                              {matchesDiscoveryMode(selectedTestimonial).reason}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                  {/* Testimonial content */}
                  <Card>
                    <CardContent className="p-4 space-y-4">
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        {React.createElement(
                          sourceIcons[
                            selectedTestimonial.source_data
                              ?.source as TestimonialSource
                          ],
                          { className: "h-4 w-4" }
                        )}
                        <span className="capitalize">
                          {selectedTestimonial.source_data?.source}
                        </span>
                        <span className="text-slate-300 mx-1">•</span>
                        <Calendar className="h-4 w-4" />
                        <span>
                          {new Date(
                            selectedTestimonial.created_at
                          ).toLocaleString()}
                        </span>
                      </div>

                      <div className="text-base whitespace-pre-wrap">
                        {selectedTestimonial.content}
                      </div>

                      {selectedTestimonial.media_urls &&
                        selectedTestimonial.media_urls.length > 0 && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                            {selectedTestimonial.media_urls.map((src, i) => (
                              <div
                                key={i}
                                className="border rounded-md overflow-hidden bg-slate-50"
                              >
                                <img
                                  src={src}
                                  alt="Media content"
                                  className="w-full h-auto max-h-64 object-cover"
                                />
                              </div>
                            ))}
                          </div>
                        )}

                      {selectedTestimonial.tags &&
                        selectedTestimonial.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-2">
                            {selectedTestimonial.tags.map((tag, i) => (
                              <Badge
                                key={i}
                                variant="outline"
                                className="bg-slate-50"
                              >
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}

                      {selectedTestimonial.engagement_metrics && (
                        <div className="flex items-center gap-4 pt-2 border-t">
                          <div className="flex items-center gap-1.5">
                            <Heart className="h-4 w-4 text-pink-500" />
                            <span>
                              {selectedTestimonial.engagement_metrics.likes}
                            </span>
                            <span className="text-sm text-slate-500">
                              likes
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <MessageSquare className="h-4 w-4 text-blue-500" />
                            <span>
                              {selectedTestimonial.engagement_metrics.comments}
                            </span>
                            <span className="text-sm text-slate-500">
                              comments
                            </span>
                          </div>

                          {selectedTestimonial.engagement_metrics.shares !==
                            undefined && (
                            <div className="flex items-center gap-1.5">
                              <Share2 className="h-4 w-4 text-green-500" />
                              <span>
                                {selectedTestimonial.engagement_metrics.shares}
                              </span>
                              <span className="text-sm text-slate-500">
                                shares
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Sentiment and AI analysis */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="py-3">
                        <CardTitle className="text-sm">
                          Sentiment Analysis
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="py-3 space-y-4">
                        <div className="flex items-center justify-between">
                          <Badge
                            variant="outline"
                            className={cn(
                              "capitalize",
                              selectedTestimonial.source_data?.sentiment ===
                                "positive"
                                ? "bg-green-100 text-green-700 border-green-200"
                                : selectedTestimonial.source_data?.sentiment ===
                                    "negative"
                                  ? "bg-red-100 text-red-700 border-red-200"
                                  : "bg-blue-100 text-blue-700 border-blue-200"
                            )}
                          >
                            {selectedTestimonial.source_data?.sentiment ===
                            "positive" ? (
                              <ThumbsUp className="h-3 w-3 mr-1" />
                            ) : selectedTestimonial.source_data?.sentiment ===
                              "negative" ? (
                              <ThumbsDown className="h-3 w-3 mr-1" />
                            ) : (
                              <Info className="h-3 w-3 mr-1" />
                            )}
                            {selectedTestimonial.source_data?.sentiment}
                          </Badge>

                          <div className="text-xl font-semibold">
                            {Math.round(
                              (selectedTestimonial.source_data?.score || 0) *
                                100
                            )}
                            %
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="text-xs text-slate-500 flex justify-between">
                            <span>Confidence Score</span>
                            <span>
                              {Math.round(
                                (selectedTestimonial.source_data?.score || 0) *
                                  100
                              )}
                              %
                            </span>
                          </div>
                          <Progress
                            value={
                              (selectedTestimonial.source_data?.score || 0) *
                              100
                            }
                            className="h-2"
                            style={
                              {
                                "--progress-background": "rgb(226, 232, 240)",
                                "--progress-foreground":
                                  selectedTestimonial.source_data?.sentiment ===
                                  "positive"
                                    ? "rgb(34, 197, 94)"
                                    : selectedTestimonial.source_data
                                          ?.sentiment === "negative"
                                      ? "rgb(239, 68, 68)"
                                      : "rgb(59, 130, 246)",
                              } as React.CSSProperties
                            }
                          />
                        </div>

                        <div className="bg-slate-50 rounded-md p-3 border">
                          <div className="flex items-start gap-2">
                            <Bot className="h-4 w-4 text-purple-500 mt-0.5" />
                            <div className="space-y-2">
                              <h4 className="text-xs font-medium">
                                AI Insight
                              </h4>
                              <p className="text-xs text-slate-600">
                                {selectedTestimonial.source_data?.sentiment ===
                                "positive"
                                  ? "This testimonial shows strong positive sentiment with high engagement. It would make a great feature on your website."
                                  : selectedTestimonial.source_data
                                        ?.sentiment === "negative"
                                    ? "This feedback contains criticism that may be valuable for product improvement, but is not suitable as a testimonial."
                                    : "This testimonial has a balanced tone. Consider requesting additional feedback to turn this into a more positive testimonial."}
                              </p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="py-3">
                        <CardTitle className="text-sm">
                          Suggested Actions
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="py-3 space-y-3">
                        {selectedTestimonial.status === "pending_review" ? (
                          <div className="space-y-3">
                            <Button
                              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                              onClick={() => {
                                handleApprove(selectedTestimonial.id);
                              }}
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Approve Testimonial
                            </Button>

                            <Button
                              variant="outline"
                              className="w-full"
                              onClick={() => {
                                setIsPermissionModalOpen(true);
                              }}
                            >
                              <UserPlus className="h-4 w-4 mr-2" />
                              Request Permission
                            </Button>

                            <Button
                              variant="outline"
                              className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                              onClick={() => {
                                handleReject(selectedTestimonial.id);
                              }}
                            >
                              <X className="h-4 w-4 mr-2" />
                              Reject Testimonial
                            </Button>
                          </div>
                        ) : selectedTestimonial.status === "approved" ? (
                          <div className="space-y-3">
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full gap-2",
                                selectedTestimonial.custom_fields?.highlighted
                                  ? "bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100"
                                  : ""
                              )}
                              onClick={() => {
                                handleToggleHighlight(selectedTestimonial.id);
                              }}
                            >
                              <Star
                                className={cn(
                                  "h-4 w-4",
                                  selectedTestimonial.custom_fields?.highlighted
                                    ? "fill-amber-500"
                                    : ""
                                )}
                              />
                              {selectedTestimonial.custom_fields?.highlighted
                                ? "Remove Highlight"
                                : "Highlight Testimonial"}
                            </Button>

                            <Button
                              variant="outline"
                              className="w-full"
                              onClick={() => {
                                window.open(
                                  `https://${selectedTestimonial.source_data?.platform}.com/example`,
                                  "_blank"
                                );
                              }}
                            >
                              <ExternalLink className="h-4 w-4 mr-2" />
                              View Original Post
                            </Button>

                            <Button
                              variant="outline"
                              className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                              onClick={() => {
                                handleReject(selectedTestimonial.id);
                              }}
                            >
                              <X className="h-4 w-4 mr-2" />
                              Unapprove Testimonial
                            </Button>
                          </div>
                        ) : selectedTestimonial.status === "rejected" ? (
                          <div className="space-y-3">
                            <Button
                              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                              onClick={() => {
                                handleApprove(selectedTestimonial.id);
                              }}
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Approve Testimonial
                            </Button>

                            <Button
                              variant="outline"
                              className="w-full"
                              onClick={() => {
                                window.open(
                                  `https://${selectedTestimonial.source_data?.platform}.com/example`,
                                  "_blank"
                                );
                              }}
                            >
                              <ExternalLink className="h-4 w-4 mr-2" />
                              View Original Post
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <div className="bg-blue-50 rounded-md p-3 border border-blue-100">
                              <div className="flex items-start gap-2">
                                <Mail className="h-4 w-4 text-blue-500 mt-0.5" />
                                <div className="space-y-1">
                                  <h4 className="text-xs font-medium text-blue-800">
                                    Permission Request Sent
                                  </h4>
                                  <p className="text-xs text-blue-700">
                                    A permission request has been sent to this
                                    user. Waiting for their response.
                                  </p>
                                </div>
                              </div>
                            </div>

                            <Button
                              variant="outline"
                              className="w-full"
                              onClick={() => {
                                setIsPermissionModalOpen(true);
                              }}
                            >
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit & Resend Request
                            </Button>

                            <Button
                              variant="outline"
                              className="w-full"
                              onClick={() => {
                                window.open(
                                  `https://${selectedTestimonial.source_data?.platform}.com/example`,
                                  "_blank"
                                );
                              }}
                            >
                              <ExternalLink className="h-4 w-4 mr-2" />
                              View Original Post
                            </Button>
                          </div>
                        )}

                        {/* Response details if available */}
                        {selectedTestimonial.custom_fields?.response && (
                          <div className="mt-4 p-3 bg-slate-50 rounded-md border">
                            <h4 className="text-xs font-medium mb-2">
                              Permission Request Message:
                            </h4>
                            <p className="text-xs text-slate-600 whitespace-pre-wrap">
                              {selectedTestimonial.custom_fields?.response}
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="engagement" className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Card>
                      <CardHeader className="py-3">
                        <CardTitle className="text-sm">
                          Engagement Overview
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="py-3">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-500">
                              Likes
                            </span>
                            <span className="font-medium">
                              {selectedTestimonial.engagement_metrics?.likes ||
                                0}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-500">
                              Comments
                            </span>
                            <span className="font-medium">
                              {selectedTestimonial.engagement_metrics
                                ?.comments || 0}
                            </span>
                          </div>
                          {selectedTestimonial.engagement_metrics?.shares !==
                            undefined && (
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-slate-500">
                                Shares
                              </span>
                              <span className="font-medium">
                                {selectedTestimonial.engagement_metrics?.shares}
                              </span>
                            </div>
                          )}
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-500">
                              Total Engagement
                            </span>
                            <span className="font-medium">
                              {(selectedTestimonial.engagement_metrics?.likes ||
                                0) +
                                (selectedTestimonial.engagement_metrics
                                  ?.comments || 0) *
                                  2 +
                                (selectedTestimonial.engagement_metrics
                                  ?.shares || 0) *
                                  3}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-500">
                              Engagement Rate
                            </span>
                            <span className="font-medium">
                              {selectedTestimonial.customer_profile
                                ?.social_profiles?.followers
                                ? `${(
                                    (((selectedTestimonial.engagement_metrics
                                      ?.likes || 0) +
                                      (selectedTestimonial.engagement_metrics
                                        ?.comments || 0) +
                                      (selectedTestimonial.engagement_metrics
                                        ?.shares || 0)) /
                                      selectedTestimonial.customer_profile
                                        ?.social_profiles?.followers) *
                                    100
                                  ).toFixed(2)}%`
                                : "N/A"}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="sm:col-span-2">
                      <CardHeader className="py-3">
                        <CardTitle className="text-sm">
                          Engagement Performance
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="py-3">
                        <div className="h-52 flex items-center justify-center border bg-slate-50 rounded-md">
                          <div className="text-center space-y-2">
                            <BarChart className="h-8 w-8 text-slate-300 mx-auto" />
                            <p className="text-sm text-slate-500">
                              Engagement data visualization
                            </p>
                            <p className="text-xs text-slate-400">
                              Shows how this testimonial performs compared to
                              others
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader className="py-3">
                      <CardTitle className="text-sm">
                        Top Keywords & Topics
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="py-3">
                      {selectedTestimonial.custom_fields?.keywords ? (
                        <div className="flex flex-wrap gap-2">
                          {selectedTestimonial.custom_fields?.keywords.map(
                            (keyword: any, i: number) => (
                              <Badge
                                key={i}
                                className="bg-purple-100 text-purple-700 border-purple-200"
                              >
                                {keyword}
                              </Badge>
                            )
                          )}
                        </div>
                      ) : selectedTestimonial.tags ? (
                        <div className="flex flex-wrap gap-2">
                          {selectedTestimonial.tags.map((tag, i) => (
                            <Badge
                              key={i}
                              className="bg-purple-100 text-purple-700 border-purple-200"
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-slate-500 text-center py-2">
                          No keywords or topics detected
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="author" className="space-y-4">
                  <Card>
                    <CardHeader className="py-3">
                      <CardTitle className="text-sm">Author Profile</CardTitle>
                    </CardHeader>
                    <CardContent className="py-3">
                      <div className="flex items-center gap-4 mb-4">
                        <Avatar className="h-16 w-16 border">
                          {selectedTestimonial.customer_profile?.avatar_url ? (
                            <AvatarImage
                              src={
                                selectedTestimonial.customer_profile?.avatar_url
                              }
                              alt={selectedTestimonial.customer_profile?.name}
                            />
                          ) : (
                            <AvatarFallback>
                              {selectedTestimonial.customer_profile?.name?.charAt(
                                0
                              )}
                            </AvatarFallback>
                          )}
                        </Avatar>

                        <div>
                          <div className="font-medium flex items-center gap-1.5 text-lg">
                            {selectedTestimonial.customer_profile?.name}
                            {selectedTestimonial.customer_profile
                              ?.social_profiles?.verified && (
                              <Badge className="ml-1 h-4 px-1 bg-blue-100 text-blue-700 border-blue-200">
                                <Check className="h-2.5 w-2.5" />
                              </Badge>
                            )}
                          </div>
                          <div className="text-slate-500">
                            @{selectedTestimonial.customer_profile?.username}
                          </div>
                          {selectedTestimonial.customer_profile?.social_profiles
                            ?.followers && (
                            <div className="text-sm text-slate-500 mt-1">
                              {selectedTestimonial.customer_profile?.social_profiles?.followers.toLocaleString()}{" "}
                              followers
                            </div>
                          )}
                        </div>

                        <div className="ml-auto">
                          <Button
                            variant="outline"
                            className="gap-2"
                            onClick={() =>
                              window.open(
                                `https://${selectedTestimonial.source_data?.platform}.com/${selectedTestimonial.customer_profile?.username}`,
                                "_blank"
                              )
                            }
                          >
                            <ExternalLink className="h-4 w-4" />
                            <span>View Profile</span>
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="p-3 bg-slate-50 rounded-md border">
                          <div className="text-xs text-slate-500 mb-1">
                            Platform
                          </div>
                          <div className="flex items-center gap-2">
                            {React.createElement(
                              platformIcons[
                                selectedTestimonial.source_data
                                  ?.platform as SocialPlatformName
                              ] || MessageSquare,
                              {
                                className: "h-4 w-4",
                              }
                            )}
                            <span className="font-medium capitalize">
                              {selectedTestimonial.source_data?.platform}
                            </span>
                          </div>
                        </div>

                        <div className="p-3 bg-slate-50 rounded-md border">
                          <div className="text-xs text-slate-500 mb-1">
                            Account Type
                          </div>
                          <div className="font-medium">
                            {selectedTestimonial.customer_profile
                              ?.social_profiles?.verified
                              ? "Verified Account"
                              : "Standard Account"}
                          </div>
                        </div>

                        <div className="p-3 bg-slate-50 rounded-md border">
                          <div className="text-xs text-slate-500 mb-1">
                            Engagement Rate
                          </div>
                          <div className="font-medium">
                            {selectedTestimonial.customer_profile
                              ?.social_profiles?.followers
                              ? `${(
                                  (((selectedTestimonial.engagement_metrics
                                    ?.likes || 0) +
                                    (selectedTestimonial.engagement_metrics
                                      ?.comments || 0) +
                                    (selectedTestimonial.engagement_metrics
                                      ?.shares || 0)) /
                                    selectedTestimonial.customer_profile
                                      ?.social_profiles?.followers) *
                                  100
                                ).toFixed(2)}%`
                              : "N/A"}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              <DialogFooter className="flex justify-between items-center gap-4">
                <Button
                  variant="outline"
                  onClick={() => setSelectedTestimonial(null)}
                >
                  Close
                </Button>

                {selectedTestimonial.status === "pending_review" ? (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                      onClick={() => {
                        handleReject(selectedTestimonial.id);
                        setSelectedTestimonial(null);
                      }}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Reject
                    </Button>

                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsPermissionModalOpen(true);
                      }}
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Request Permission
                    </Button>

                    <Button
                      className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                      onClick={() => {
                        handleApprove(selectedTestimonial.id);
                        setSelectedTestimonial(null);
                      }}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve
                    </Button>
                  </div>
                ) : (
                  <div>
                    <Button
                      variant="outline"
                      onClick={() =>
                        window.open(
                          `https://${selectedTestimonial.source_data?.platform}.com/example`,
                          "_blank"
                        )
                      }
                      className="gap-2"
                    >
                      <ExternalLink className="h-4 w-4" />
                      View Original
                    </Button>
                  </div>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Permission Request Dialog */}
      <Dialog
        open={isPermissionModalOpen}
        onOpenChange={setIsPermissionModalOpen}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Request Permission</DialogTitle>
            <DialogDescription>
              Send a message to request permission to use this testimonial
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            {selectedTestimonial && (
              <div className="flex items-center gap-3 mb-2">
                <Avatar className="h-8 w-8 border">
                  {selectedTestimonial.customer_profile?.avatar_url ? (
                    <AvatarImage
                      src={selectedTestimonial.customer_profile?.avatar_url}
                      alt={selectedTestimonial.customer_profile?.name}
                    />
                  ) : (
                    <AvatarFallback className="bg-slate-100 text-slate-500">
                      {selectedTestimonial.customer_profile?.name?.charAt(0)}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div>
                  <div className="font-medium">
                    {selectedTestimonial.customer_profile?.name}
                  </div>
                  <div className="text-xs text-slate-500">
                    @{selectedTestimonial.customer_profile?.username}
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="permission-message">
                Permission Request Message
              </Label>
              <Textarea
                id="permission-message"
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                rows={6}
                placeholder="Hi! We loved your comment about our product. Would you mind if we featured it as a testimonial on our website?"
              />
              <p className="text-xs text-slate-500">
                This message will be sent to request permission to use this
                content as a testimonial
              </p>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-100 rounded-md">
              <div className="flex items-start gap-2">
                <HelpCircle className="h-4 w-4 text-blue-500 mt-0.5" />
                <div className="text-sm text-blue-700">
                  <span className="font-medium">Tip:</span> Personalize your
                  message to increase the likelihood of getting permission.
                  Mention what you loved about their comment.
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => setIsPermissionModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendPermissionRequest}
              disabled={!customMessage || isPermissionSending}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              {isPermissionSending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Request
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Settings Modal */}
      <Dialog open={isSettingsModalOpen} onOpenChange={setIsSettingsModalOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Discovery Settings</DialogTitle>
            <DialogDescription>
              Configure how testimonials are discovered and processed
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-5">
            <div className="space-y-3">
              <h3 className="text-sm font-medium">Discovery Mode</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {discoveryModes.map((mode) => (
                  <Card
                    key={mode.id}
                    className={cn(
                      "cursor-pointer transition-all overflow-hidden border",
                      discoveryMode === mode.id
                        ? `border-2 border-${mode.color.split("-")[1]}-500 ring-1 ring-${mode.color.split("-")[1]}-500/20 bg-${mode.color.split("-")[1]}-50/50`
                        : "hover:bg-slate-50"
                    )}
                    onClick={() => handleDiscoveryModeChange(mode.id)}
                  >
                    <CardContent className="p-3 flex items-center gap-3">
                      <div className={cn("p-2 rounded-md", mode.bgColor)}>
                        <mode.icon className={cn("h-4 w-4", mode.color)} />
                      </div>

                      <div>
                        <h3 className="font-medium text-sm">{mode.name}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                          {mode.description}
                        </p>
                      </div>

                      {discoveryMode === mode.id && (
                        <CheckCircle className="h-4 w-4 text-green-600 ml-auto" />
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <Separator />

            {/* Mode-specific settings */}
            {discoveryMode === "auto" && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium">Auto-Approval Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="sentiment-threshold-setting"
                      className="text-sm"
                    >
                      Minimum Sentiment Score (%)
                    </Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="sentiment-threshold-setting"
                        type="number"
                        min="50"
                        max="100"
                        value={sentimentThreshold}
                        onChange={(e) =>
                          setSentimentThreshold(parseInt(e.target.value) || 75)
                        }
                        className="w-full"
                      />
                    </div>
                    <p className="text-xs text-slate-500">
                      Testimonials with sentiment scores above this threshold
                      will be automatically approved
                    </p>
                  </div>
                </div>
              </div>
            )}

            {discoveryMode === "keyword" && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium">Keyword Settings</h3>
                <div className="space-y-2">
                  <Label htmlFor="keywords-list" className="text-sm">
                    Priority Keywords (comma separated)
                  </Label>
                  <Textarea
                    id="keywords-list"
                    placeholder="amazing, recommend, love, excellent"
                    value={keywordsList.join(", ")}
                    onChange={(e) =>
                      setKeywordsList(
                        e.target.value.split(/,\s*/).filter(Boolean)
                      )
                    }
                    rows={3}
                  />
                  <p className="text-xs text-slate-500">
                    Testimonials containing these keywords will be prioritized
                    for approval
                  </p>
                </div>
              </div>
            )}

            {discoveryMode === "sentiment" && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium">
                  Sentiment Analysis Settings
                </h3>
                <div className="space-y-2">
                  <Label
                    htmlFor="sentiment-threshold-slider"
                    className="text-sm"
                  >
                    Approval Threshold: {sentimentThreshold}%
                  </Label>
                  <Input
                    id="sentiment-threshold-slider"
                    type="range"
                    min="50"
                    max="100"
                    value={sentimentThreshold}
                    onChange={(e) =>
                      setSentimentThreshold(parseInt(e.target.value))
                    }
                  />
                  <p className="text-xs text-slate-500">
                    Testimonials with sentiment scores above this threshold will
                    be automatically approved
                  </p>
                </div>
              </div>
            )}

            {discoveryMode === "ai" && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium">AI Discovery Settings</h3>
                <div className="space-y-4">
                  <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-md">
                    <div className="flex items-start gap-2">
                      <Bot className="h-4 w-4 text-indigo-600 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-medium text-indigo-800">
                          AI-Powered Discovery
                        </h4>
                        <p className="text-sm text-indigo-700 mt-1">
                          The AI analyzes engagement metrics, sentiment, content
                          quality, and account reputation to identify the best
                          testimonials.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="ai-threshold" className="text-sm">
                        AI Score Threshold (%)
                      </Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="ai-threshold"
                          type="number"
                          min="50"
                          max="100"
                          value="70"
                          className="w-full"
                        />
                      </div>
                      <p className="text-xs text-slate-500">
                        Testimonials with AI scores above this threshold will be
                        recommended
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              className="bg-gradient-to-r from-slate-700 to-slate-900 hover:from-slate-800 hover:to-slate-950"
              onClick={() => {
                setIsSettingsModalOpen(false);
                showToast({
                  title: "Settings saved",
                  description: "Your discovery settings have been updated",
                  variant: "default",
                });
              }}
            >
              <Check className="h-4 w-4 mr-2" />
              Save Settings
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

// Missing 'Send' icon component
const Send = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <line x1="22" y1="2" x2="11" y2="13"></line>
    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
  </svg>
);

export default observer(TestimonialDiscovery);
