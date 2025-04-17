// src/components/collection-setup/social/SocialCampaigns.tsx
import React, { useState } from "react";
import {
  ArrowUp,
  Calendar,
  ChevronDown,
  Copy,
  Edit2,
  Hash,
  MoreHorizontal,
  Plus,
  Star,
  Sparkles,
  Trophy,
  Heart,
  Clock,
  Trash2,
  CalendarClock,
  BarChart3,
  CheckSquare,
  Mail,
  AlertCircle,
  ArrowUpRight,
  Check,
  Gift,
  MessageSquare,
  AtSign,
  Megaphone,
  Award,
  PlusCircle,
  Users,
  Search,
  LayoutGrid,
  List,
  Settings,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import {
  SocialCampaign,
  SocialPlatform,
  SocialPlatformName,
  CampaignType,
} from "@/types/setup";
import { platformColors, platformIcons } from "./defaults";
import { observer } from "mobx-react-lite";

// Extended type to include campaign type while maintaining compatibility

// Campaign type metadata for UI
const campaignTypeInfo: Record<
  CampaignType,
  {
    name: string;
    type: CampaignType;
    description: string;
    icon: React.ElementType;
    color: string;
    lightColor: string;
    setup: string[];
  }
> = {
  hashtag: {
    name: "Hashtag Campaign",
    type: "hashtag",
    description: "Collect testimonials from posts that include your hashtag",
    icon: Hash,
    color: "text-blue-600",
    lightColor: "bg-blue-50",
    setup: ["Select platforms", "Create your hashtag", "Set campaign duration"],
  },
  mention: {
    name: "Mention Campaign",
    type: "mention",
    description: "Collect testimonials when users mention your brand",
    icon: AtSign,
    color: "text-purple-600",
    lightColor: "bg-purple-50",
    setup: [
      "Select platforms",
      "Configure mention tracking",
      "Set campaign duration",
    ],
  },
  comment: {
    name: "Comment Campaign",
    type: "comment",
    description: "Collect testimonials from comments on your posts",
    icon: MessageSquare,
    color: "text-emerald-600",
    lightColor: "bg-emerald-50",
    setup: [
      "Select platforms",
      "Select target posts",
      "Configure sentiment filters",
    ],
  },
  ugc: {
    name: "User-Generated Content",
    type: "ugc",
    description: "Collect testimonials from content created about your brand",
    icon: Users,
    color: "text-amber-600",
    lightColor: "bg-amber-50",
    setup: [
      "Select platforms",
      "Set content guidelines",
      "Configure detection rules",
    ],
  },
  contest: {
    name: "Testimonial Contest",
    type: "contest",
    description: "Run a contest where users submit testimonials to win prizes",
    icon: Award,
    color: "text-pink-600",
    lightColor: "bg-pink-50",
    setup: ["Define prizes", "Set contest rules", "Configure entry mechanism"],
  },
};

// Icons for campaigns
const campaignIcons = [
  { id: "star", icon: Star, label: "Star" },
  { id: "sparkles", icon: Sparkles, label: "Sparkles" },
  { id: "trophy", icon: Trophy, label: "Trophy" },
  { id: "heart", icon: Heart, label: "Heart" },
  { id: "badge", icon: CheckSquare, label: "Badge" },
];

// Status colors
const statusColors: Record<
  SocialCampaign["status"],
  { bg: string; text: string; border: string }
> = {
  active: {
    bg: "bg-green-50",
    text: "text-green-700",
    border: "border-green-200",
  },
  scheduled: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
  },
  completed: {
    bg: "bg-slate-50",
    text: "text-slate-700",
    border: "border-slate-200",
  },
  draft: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
  },
  paused: {
    bg: "bg-purple-50",
    text: "text-purple-700",
    border: "border-purple-200",
  },
};

// Empty campaign state
const defaultNewCampaign: Omit<SocialCampaign, "id" | "collected"> = {
  name: "",
  workspace_id: "",
  identifier: "",
  type: "hashtag",
  status: "draft",
  start_date: new Date().toISOString().split("T")[0],
  end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0],
  platforms: ["instagram", "twitter"],
  target: 100,
  icon: "sparkles",
  description: "",
  incentive: "",
  rules: "",
  budget: 0,
  team: [],
  report_frequency: "weekly",
  report_recipients: [],
  keywords: [],
  blacklist: [],
  sentiment_analysis: true,
  ai_categorization: true,
};

interface SocialCampaignsProps {
  campaigns: SocialCampaign[];
  platforms: SocialPlatform[];
  onAddCampaign: (campaign: Omit<SocialCampaign, "id" | "collected">) => void;
  onUpdateCampaign: (campaign: SocialCampaign) => void;
  onDeleteCampaign: (id: string) => void;
  showToast: (toast: {
    title: string;
    description: string;
    variant?: "default" | "destructive";
  }) => void;
}

const SocialCampaigns: React.FC<SocialCampaignsProps> = ({
  campaigns,
  platforms,
  onAddCampaign,
  onUpdateCampaign,
  onDeleteCampaign,
  showToast,
}) => {
  const [showAddCampaign, setShowAddCampaign] = useState(false);
  const [newCampaign, setNewCampaign] =
    useState<Omit<SocialCampaign, "id" | "collected">>(defaultNewCampaign);
  const [campaignType, setCampaignType] = useState<CampaignType>("hashtag");
  const [activeTab, setActiveTab] = useState<
    "all" | "active" | "scheduled" | "completed" | "draft" | "paused"
  >("all");
  const [editingCampaign, setEditingCampaign] = useState<SocialCampaign | null>(
    null
  );
  const [campaignView, setCampaignView] = useState<"grid" | "table">("grid");
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(
    null
  );
  const [isCreatingCampaign, setIsCreatingCampaign] = useState(false);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);

  // Active platforms for the campaign creation
  const activePlatforms = platforms.filter((p) => p.enabled && p.connected);

  // Handle create campaign
  const handleCreateCampaign = () => {
    // Field validation
    if (!newCampaign.name) {
      showToast({
        title: "Missing information",
        description: "Please provide a campaign name.",
        variant: "destructive",
      });
      return;
    }

    if (campaignType === "hashtag" && !newCampaign.identifier) {
      showToast({
        title: "Missing information",
        description: "Please provide a hashtag for the campaign.",
        variant: "destructive",
      });
      return;
    }

    setIsCreatingCampaign(true);

    // Allow briefly showing a loading state
    setTimeout(() => {
      onAddCampaign(newCampaign);
      setShowAddCampaign(false);
      setNewCampaign(defaultNewCampaign);
      setCampaignType("hashtag");
      setIsCreatingCampaign(false);

      showToast({
        title: "Campaign created",
        description: `Campaign "${newCampaign.name}" has been created successfully.`,
        variant: "default",
      });
    }, 600);
  };

  // Handle save edited campaign
  const handleSaveEditedCampaign = () => {
    if (!editingCampaign) return;

    if (onUpdateCampaign) {
      onUpdateCampaign(editingCampaign);
    } else {
      // Fallback if no update handler provided
      showToast({
        title: "Campaign updated",
        description: `Campaign "${editingCampaign.name}" has been updated.`,
        variant: "default",
      });
    }

    setEditingCampaign(null);
  };

  // Handle duplicate campaign
  const handleDuplicateCampaign = (campaign: SocialCampaign) => {
    const { id, collected, ...rest } = campaign;
    const duplicatedCampaign = {
      ...rest,
      name: `${rest.name} (Copy)`,
      status: "draft" as const,
      startDate: new Date().toISOString().split("T")[0],
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
    };

    onAddCampaign(duplicatedCampaign);

    showToast({
      title: "Campaign duplicated",
      description: `Campaign "${rest.name}" has been duplicated.`,
      variant: "default",
    });
  };

  // Handle delete campaign
  const handleDeleteCampaign = (id: string) => {
    if (onDeleteCampaign) {
      onDeleteCampaign(id);
      showToast({
        title: "Campaign deleted",
        description: "The campaign has been deleted successfully.",
        variant: "default",
      });
    } else {
      // Fallback if no delete handler provided
      showToast({
        title: "Campaign deleted",
        description:
          "The campaign would be deleted in a production environment.",
        variant: "default",
      });
    }
    setShowDeleteConfirm(null);
  };

  // Handle template selection
  const handleTemplateSelection = (template: string) => {
    // Set template values based on selection
    let templateData: Partial<SocialCampaign> = {};
    let templateType: CampaignType = "hashtag";

    switch (template) {
      case "productLaunch":
        templateData = {
          name: "Product Launch Campaign",
          identifier: "NewProductLaunch",
          type: "hashtag",
          description: "Collect testimonials during our new product launch",
          icon: "sparkles",
          platforms: ["instagram", "twitter", "facebook"],
          status: "draft",
          keywords: ["amazing", "love it", "awesome", "recommend"],
          sentiment_analysis: true,
        };
        templateType = "hashtag";
        break;

      case "customerAppreciation":
        templateData = {
          name: "Customer Appreciation",
          identifier: "ThankYouCustomers",
          type: "mention",
          description: "Annual campaign to celebrate our customers",
          icon: "heart",
          platforms: ["instagram", "twitter", "facebook", "linkedin"],
          status: "draft",
          keywords: ["thanks", "grateful", "appreciation", "love"],
          sentiment_analysis: true,
        };
        templateType = "mention";
        break;

      case "contestGiveaway":
        templateData = {
          name: "Product Giveaway Contest",
          identifier: "WinOurProduct",
          type: "contest",
          description:
            "Contest to win free products in exchange for testimonials",
          icon: "trophy",
          platforms: ["instagram", "twitter"],
          status: "draft",
          incentive: "Chance to win our premium product",
          rules: "Share your experience with our product using the hashtag",
          sentiment_analysis: true,
        };
        templateType = "contest";
        break;

      case "yearInReview":
        templateData = {
          name: "Year in Review",
          identifier: "YearWithBrand",
          type: "ugc",
          description: "Annual campaign to collect year-end testimonials",
          icon: "star",
          platforms: ["instagram", "twitter", "linkedin"],
          status: "draft",
          keywords: ["year", "journey", "experience", "favorite"],
          sentiment_analysis: true,
        };
        templateType = "ugc";
        break;

      case "commentCollection":
        templateData = {
          name: "Comment Collection Campaign",
          identifier: "BrandFeedback",
          type: "comment",
          description:
            "Collect valuable testimonials from comments on our posts",
          icon: "badge",
          platforms: ["facebook", "instagram", "linkedin"],
          status: "draft",
          keywords: ["love", "great", "recommend", "excellent"],
          sentiment_analysis: true,
        };
        templateType = "comment";
        break;
    }

    setCampaignType(templateType);
    setNewCampaign({
      ...newCampaign,
      ...templateData,
      start_date: new Date().toISOString().split("T")[0],
      end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
    });

    setShowTemplateDialog(false);
    setShowAddCampaign(true);
  };

  // Filter campaigns based on active tab and search query
  const filteredCampaigns = campaigns.filter((campaign) => {
    // Filter by status tab
    if (activeTab !== "all" && campaign.status !== activeTab) return false;

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        campaign.name.toLowerCase().includes(query) ||
        campaign.identifier.toLowerCase().includes(query) ||
        campaign.description?.toLowerCase().includes(query) ||
        false
      );
    }

    return true;
  });

  return (
    <div className="space-y-8">
      {/* Header with overview */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight mb-1">
            Social Campaigns
          </h2>
          <p className="text-sm text-muted-foreground">
            Create and manage campaigns to collect testimonials from social
            media
          </p>
        </div>
        <div className="flex gap-3 flex-wrap justify-end">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search campaigns..."
              className="w-[200px] pl-8 h-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex gap-1 items-center">
            <Button
              variant={campaignView === "grid" ? "default" : "outline"}
              size="sm"
              className="h-9 px-3"
              onClick={() => setCampaignView("grid")}
            >
              <LayoutGrid className="h-4 w-4 mr-1.5" />
              <span className="text-xs">Grid</span>
            </Button>
            <Button
              variant={campaignView === "table" ? "default" : "outline"}
              size="sm"
              className="h-9 px-3"
              onClick={() => setCampaignView("table")}
            >
              <List className="h-4 w-4 mr-1.5" />
              <span className="text-xs">List</span>
            </Button>
          </div>

          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as any)}
            className="w-auto"
          >
            <TabsList className="h-9 p-0.5">
              <TabsTrigger value="all" className="text-xs h-8 px-3 rounded">
                All
              </TabsTrigger>
              <TabsTrigger value="active" className="text-xs h-8 px-3 rounded">
                Active
              </TabsTrigger>
              <TabsTrigger
                value="scheduled"
                className="text-xs h-8 px-3 rounded"
              >
                Scheduled
              </TabsTrigger>
              <TabsTrigger value="draft" className="text-xs h-8 px-3 rounded">
                Draft
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9"
                  onClick={() => setShowTemplateDialog(true)}
                >
                  <ArrowUpRight className="h-4 w-4 mr-1.5" />
                  <span className="text-xs">Templates</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Use campaign templates</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Button
            size="sm"
            className="h-9 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
            onClick={() => {
              if (activePlatforms.length === 0) {
                showToast({
                  title: "No connected platforms",
                  description:
                    "Please connect at least one social media platform before creating a campaign.",
                  variant: "destructive",
                });
                return;
              }
              setShowAddCampaign(true);
            }}
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            <span className="text-xs">New Campaign</span>
          </Button>
        </div>
      </div>

      {/* Campaign Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-slate-50 to-slate-100 border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Total Campaigns
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{campaigns.length}</div>
              <div className="flex -space-x-2">
                {campaigns.slice(0, 3).map((campaign, index) => {
                  const Icon =
                    campaignIcons.find((i) => i.id === campaign.icon)?.icon ||
                    Star;
                  return (
                    <div
                      key={index}
                      className="h-8 w-8 rounded-full flex items-center justify-center bg-white border-2 border-white shadow-sm"
                      style={{ zIndex: 3 - index }}
                    >
                      <Icon className="h-4 w-4 text-purple-500" />
                    </div>
                  );
                })}
                {campaigns.length > 3 && (
                  <div
                    className="h-8 w-8 rounded-full flex items-center justify-center bg-slate-200 border-2 border-white shadow-sm text-xs font-medium text-slate-600"
                    style={{ zIndex: 0 }}
                  >
                    +{campaigns.length - 3}
                  </div>
                )}
              </div>
            </div>
            <div className="mt-2 flex gap-2">
              <Badge
                variant="outline"
                className="bg-green-50 text-green-700 border-green-200"
              >
                {campaigns.filter((c) => c.status === "active").length} Active
              </Badge>
              <Badge
                variant="outline"
                className="bg-blue-50 text-blue-700 border-blue-200"
              >
                {campaigns.filter((c) => c.status === "scheduled").length}{" "}
                Scheduled
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-indigo-800">
              Testimonials Collected
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="flex items-end justify-between">
              <div className="text-2xl font-bold text-indigo-700">
                {campaigns.reduce((sum, c) => sum + (c.collected || 0), 0)}
              </div>
              <div className="text-xs text-indigo-600">Via campaigns</div>
            </div>
            <div className="mt-2 flex items-center gap-1 text-xs text-indigo-700">
              <ArrowUp className="h-3.5 w-3.5" />
              <span>
                +
                {Math.round(
                  campaigns.reduce((sum, c) => sum + (c.collected || 0), 0) *
                    0.15
                )}{" "}
                this month
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-amber-800">
              Campaign Conversion
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="flex items-end justify-between">
              <div className="text-2xl font-bold text-amber-700">36.8%</div>
              <div className="text-xs text-amber-600">Avg. conversion rate</div>
            </div>
            <div className="mt-2 flex items-center gap-1">
              <Progress
                value={36.8}
                className="h-2 flex-1"
                style={
                  {
                    "--progress-background": "rgb(254, 240, 138, 0.5)",
                    "--progress-foreground": "rgb(234, 179, 8)",
                  } as React.CSSProperties
                }
              />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-emerald-800">
              Social Reach
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="flex items-end justify-between">
              <div className="text-2xl font-bold text-emerald-700">
                {campaigns.length > 0 ? "43.2K+" : "0"}
              </div>
              <div className="text-xs text-emerald-600">
                Est. campaign reach
              </div>
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {activePlatforms.slice(0, 3).map((platform) => {
                const Icon = platformIcons[platform.name];
                return (
                  <div
                    key={platform.name}
                    className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center",
                      platformColors[platform.name].bg
                    )}
                  >
                    <Icon className="h-3.5 w-3.5 text-white" />
                  </div>
                );
              })}
              {activePlatforms.length === 0 && (
                <div className="text-xs italic text-slate-500">
                  No active platforms
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Empty State */}
      {filteredCampaigns.length === 0 ? (
        <Card className="border-dashed border-2 bg-slate-50/50 overflow-hidden">
          <CardContent className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="rounded-full bg-indigo-100 p-3 mb-4">
              <Megaphone className="h-8 w-8 text-indigo-600" />
            </div>
            <h3 className="text-xl font-medium text-slate-800 mb-2">
              {searchQuery
                ? "No matching campaigns found"
                : "No social campaigns yet"}
            </h3>
            <p className="text-slate-500 max-w-md mb-6">
              {searchQuery
                ? "Try adjusting your search query or filters"
                : "Create your first campaign to start collecting testimonials from social media"}
            </p>
            {!searchQuery && (
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => setShowTemplateDialog(true)}
                >
                  <ArrowUpRight className="h-4 w-4" />
                  <span>Use Template</span>
                </Button>
                <Button
                  className="gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                  onClick={() => {
                    if (activePlatforms.length === 0) {
                      showToast({
                        title: "No connected platforms",
                        description:
                          "Please connect at least one social media platform before creating a campaign.",
                        variant: "destructive",
                      });
                      return;
                    }
                    setShowAddCampaign(true);
                  }}
                >
                  <Plus className="h-4 w-4" />
                  <span>Create Campaign</span>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ) : campaignView === "grid" ? (
        // Grid view
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCampaigns.map((campaign) => {
            const Icon =
              campaignIcons.find((i) => i.id === campaign.icon)?.icon || Star;
            const statusColor = statusColors[campaign.status];
            const progress =
              Math.round((campaign.collected / campaign.target) * 100) || 0;
            const startDate = new Date(campaign.start_date);
            const endDate = new Date(campaign.end_date);

            // Check if campaign is active
            const now = new Date();
            const isActive =
              campaign.status === "active" &&
              startDate <= now &&
              endDate >= now;

            // Calculate days remaining for active campaigns
            const daysRemaining = isActive
              ? Math.ceil(
                  (endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
                )
              : 0;

            return (
              <Card
                key={campaign.id}
                className={cn(
                  "border overflow-hidden transition-all duration-200 hover:shadow-md",
                  campaign.status === "active" &&
                    "border-l-4 border-l-green-500"
                )}
              >
                <CardHeader className="pb-3 flex flex-row items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "p-2 rounded-xl",
                        campaign.status === "active"
                          ? "bg-green-100"
                          : "bg-slate-100"
                      )}
                    >
                      <Icon
                        className={cn(
                          "h-5 w-5",
                          campaign.status === "active"
                            ? "text-green-600"
                            : "text-slate-600"
                        )}
                      />
                    </div>
                    <div>
                      <CardTitle className="text-base">
                        {campaign.name}
                      </CardTitle>
                      <CardDescription className="text-xs mt-0.5 flex items-center gap-1.5">
                        {getTypeIcon(campaign.type, "h-3 w-3")}
                        <span>{campaign.identifier}</span>
                      </CardDescription>
                    </div>
                  </div>

                  <Badge
                    variant="outline"
                    className={cn(
                      "capitalize",
                      statusColor.bg,
                      statusColor.text,
                      statusColor.border
                    )}
                  >
                    {campaign.status}
                  </Badge>
                </CardHeader>
                <CardContent className="pb-3 space-y-4">
                  {/* Campaign description */}
                  {campaign.description && (
                    <p className="text-sm text-slate-600 line-clamp-2">
                      {campaign.description}
                    </p>
                  )}

                  {/* Collection progress */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">Progress</span>
                      <span className="font-medium">
                        {campaign.collected} / {campaign.target}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full transition-all duration-500",
                          progress >= 100
                            ? "bg-green-500"
                            : progress >= 70
                              ? "bg-emerald-500"
                              : progress >= 40
                                ? "bg-amber-500"
                                : "bg-blue-500"
                        )}
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Campaign dates */}
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {startDate.toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })}{" "}
                        -{" "}
                        {endDate.toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>

                    {isActive && (
                      <Badge
                        variant="outline"
                        className={cn(
                          daysRemaining <= 3
                            ? "bg-red-50 text-red-700 border-red-200"
                            : "bg-blue-50 text-blue-700 border-blue-200"
                        )}
                      >
                        <Clock className="h-3 w-3 mr-1" />
                        <span>{daysRemaining} days left</span>
                      </Badge>
                    )}
                  </div>

                  {/* Platform icons */}
                  <div className="flex items-center justify-between">
                    <div className="flex -space-x-1">
                      {campaign.platforms.slice(0, 4).map((platformName) => {
                        const Icon = platformIcons[platformName];
                        const color = platformColors[platformName];

                        return (
                          <div
                            key={platformName}
                            className={cn(
                              "w-6 h-6 rounded-full flex items-center justify-center border-2 border-white",
                              color.bg
                            )}
                          >
                            <Icon className="h-3 w-3 text-white" />
                          </div>
                        );
                      })}

                      {campaign.platforms.length > 4 && (
                        <div className="w-6 h-6 rounded-full flex items-center justify-center bg-slate-200 border-2 border-white text-xs font-medium text-slate-600">
                          +{campaign.platforms.length - 4}
                        </div>
                      )}
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                        >
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => setEditingCampaign(campaign)}
                          className="flex items-center gap-2"
                        >
                          <Edit2 className="h-4 w-4" />
                          <span>Edit Campaign</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDuplicateCampaign(campaign)}
                          className="flex items-center gap-2"
                        >
                          <Copy className="h-4 w-4" />
                          <span>Duplicate</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            // View analytics would open analytics dashboard filtered to this campaign
                            showToast({
                              title: "Analytics",
                              description: `Viewing analytics for "${campaign.name}" campaign.`,
                              variant: "default",
                            });
                          }}
                          className="flex items-center gap-2"
                        >
                          <BarChart3 className="h-4 w-4" />
                          <span>View Analytics</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600 flex items-center gap-2"
                          onClick={() => setShowDeleteConfirm(campaign.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span>Delete Campaign</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        // Table view
        <Card>
          <CardContent className="p-0">
            <div className="relative w-full overflow-auto">
              <table className="w-full caption-bottom text-sm">
                <thead className="border-b bg-slate-50">
                  <tr className="transition-colors">
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <span>Campaign</span>
                        <ChevronDown className="h-3.5 w-3.5" />
                      </div>
                    </th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <span>Hashtag</span>
                      </div>
                    </th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                      Status
                    </th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                      Timeline
                    </th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                      Platforms
                    </th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                      Progress
                    </th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCampaigns.map((campaign) => {
                    const Icon =
                      campaignIcons.find((i) => i.id === campaign.icon)?.icon ||
                      Star;
                    const statusColor = statusColors[campaign.status];
                    const progress =
                      Math.round(
                        (campaign.collected / campaign.target) * 100
                      ) || 0;
                    const startDate = new Date(campaign.start_date);
                    const endDate = new Date(campaign.end_date);

                    return (
                      <tr
                        key={campaign.id}
                        className="border-b transition-colors hover:bg-muted/5"
                      >
                        <td className="p-4 align-middle">
                          <div className="flex items-center gap-3">
                            <div
                              className={cn("p-1.5 rounded-lg", statusColor.bg)}
                            >
                              <Icon
                                className={cn("h-4 w-4", statusColor.text)}
                              />
                            </div>
                            <span className="font-medium">{campaign.name}</span>
                          </div>
                        </td>
                        <td className="p-4 align-middle">
                          <div className="flex items-center gap-1">
                            {getTypeIcon(
                              campaign.type,
                              "h-3.5 w-3.5 text-slate-400"
                            )}
                            <span className="text-slate-600">
                              {campaign.identifier}
                            </span>
                          </div>
                        </td>
                        <td className="p-4 align-middle">
                          <Badge
                            variant="outline"
                            className={cn(
                              "capitalize",
                              statusColor.bg,
                              statusColor.text,
                              statusColor.border
                            )}
                          >
                            {campaign.status}
                          </Badge>
                        </td>
                        <td className="p-4 align-middle text-slate-600 text-xs">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-slate-400" />
                            <span>
                              {startDate.toLocaleDateString()} -{" "}
                              {endDate.toLocaleDateString()}
                            </span>
                          </div>
                        </td>
                        <td className="p-4 align-middle">
                          <div className="flex">
                            {campaign.platforms.map((platformName) => {
                              const Icon = platformIcons[platformName];
                              return (
                                <div key={platformName} className="mr-1">
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <div className="p-1 hover:bg-slate-100 rounded-md cursor-pointer transition-colors">
                                          <Icon className="h-4 w-4 text-slate-400" />
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p className="text-xs capitalize">
                                          {platformName}
                                        </p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </div>
                              );
                            })}
                          </div>
                        </td>
                        <td className="p-4 align-middle">
                          <div className="flex items-center gap-3">
                            <div className="w-20 h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className={cn(
                                  "h-full",
                                  progress >= 100
                                    ? "bg-green-500"
                                    : progress >= 70
                                      ? "bg-emerald-500"
                                      : progress >= 40
                                        ? "bg-amber-500"
                                        : "bg-blue-500"
                                )}
                                style={{ width: `${Math.min(progress, 100)}%` }}
                              />
                            </div>
                            <span className="text-xs text-slate-600">
                              {campaign.collected}/{campaign.target}
                            </span>
                          </div>
                        </td>
                        <td className="p-4 align-middle">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => setEditingCampaign(campaign)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => handleDuplicateCampaign(campaign)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => setShowDeleteConfirm(campaign.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Campaign Dialog */}
      <Dialog
        open={showAddCampaign || !!editingCampaign}
        onOpenChange={(open) => {
          if (!open) {
            setShowAddCampaign(false);
            setEditingCampaign(null);
            setShowAdvancedSettings(false);
            setNewCampaign(defaultNewCampaign);
            setCampaignType("hashtag");
          }
        }}
      >
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCampaign ? "Edit Campaign" : "Create New Campaign"}
            </DialogTitle>
            <DialogDescription>
              {editingCampaign
                ? "Update your campaign settings"
                : "Set up a campaign to collect testimonials from social media"}
            </DialogDescription>
          </DialogHeader>

          {!editingCampaign && (
            <div className="mb-6">
              <Label className="text-sm mb-2 block">Campaign Type</Label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(Object.keys(campaignTypeInfo) as CampaignType[]).map(
                  (type) => {
                    const info = campaignTypeInfo[type];
                    return (
                      <div
                        key={type}
                        className={cn(
                          "cursor-pointer border rounded-lg p-4 transition-all",
                          campaignType === type
                            ? `border-2 ${type === "hashtag" ? "border-blue-500 bg-blue-50/40" : type === "mention" ? "border-purple-500 bg-purple-50/40" : type === "comment" ? "border-emerald-500 bg-emerald-50/40" : type === "ugc" ? "border-amber-500 bg-amber-50/40" : "border-pink-500 bg-pink-50/40"}`
                            : "hover:bg-slate-50"
                        )}
                        onClick={() => setCampaignType(type)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div
                            className={cn("p-1.5 rounded-md", info.lightColor)}
                          >
                            <info.icon className={cn("h-4 w-4", info.color)} />
                          </div>
                          {campaignType === type && (
                            <Badge
                              className={cn(
                                type === "hashtag"
                                  ? "bg-blue-100 text-blue-700 border-blue-200"
                                  : type === "mention"
                                    ? "bg-purple-100 text-purple-700 border-purple-200"
                                    : type === "comment"
                                      ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                                      : type === "ugc"
                                        ? "bg-amber-100 text-amber-700 border-amber-200"
                                        : "bg-pink-100 text-pink-700 border-pink-200"
                              )}
                            >
                              <Check className="h-3 w-3 mr-1" />
                              Selected
                            </Badge>
                          )}
                        </div>
                        <h3 className="font-medium text-sm mb-1">
                          {info.name}
                        </h3>
                        <p className="text-xs text-slate-500 line-clamp-2">
                          {info.description}
                        </p>
                      </div>
                    );
                  }
                )}
              </div>
            </div>
          )}

          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger
                value="basic"
                className="data-[state=active]:bg-slate-100"
              >
                Basic Info
              </TabsTrigger>
              <TabsTrigger
                value="content"
                className="data-[state=active]:bg-slate-100"
              >
                Content
              </TabsTrigger>
              <TabsTrigger
                value="settings"
                className="data-[state=active]:bg-slate-100"
              >
                Settings
              </TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="campaign-name">Campaign Name</Label>
                    <Input
                      id="campaign-name"
                      placeholder="Summer Customer Appreciation Campaign"
                      value={editingCampaign?.name || newCampaign.name}
                      onChange={(e) =>
                        editingCampaign
                          ? setEditingCampaign({
                              ...editingCampaign,
                              name: e.target.value,
                            })
                          : setNewCampaign({
                              ...newCampaign,
                              name: e.target.value,
                            })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="campaign-hashtag">
                      {campaignType === "hashtag"
                        ? "Campaign Hashtag"
                        : campaignType === "mention"
                          ? "Brand Name to Track"
                          : campaignType === "comment"
                            ? "Target Posts Identifier"
                            : campaignType === "ugc"
                              ? "Content Identifier"
                              : "Contest Hashtag"}
                    </Label>
                    <div className="flex">
                      <div className="flex items-center bg-slate-100 px-3 border border-r-0 rounded-l-md">
                        {getTypeIcon(campaignType, "h-4 w-4 text-slate-500")}
                      </div>
                      <Input
                        id="campaign-hashtag"
                        placeholder={
                          campaignType === "hashtag"
                            ? "LoveOurBrand"
                            : campaignType === "mention"
                              ? "YourBrandName"
                              : campaignType === "comment"
                                ? "ProductLaunchPost"
                                : campaignType === "ugc"
                                  ? "BrandExperience"
                                  : "WinWithBrand"
                        }
                        className="rounded-l-none"
                        value={
                          editingCampaign?.identifier || newCampaign.identifier
                        }
                        onChange={(e) => {
                          const value =
                            campaignType === "hashtag" ||
                            campaignType === "contest"
                              ? e.target.value.replace(/[^a-zA-Z0-9]/g, "")
                              : e.target.value;

                          editingCampaign
                            ? setEditingCampaign({
                                ...editingCampaign,
                                identifier: value,
                                type: campaignType,
                              })
                            : setNewCampaign({
                                ...newCampaign,
                                identifier: value,
                                type: campaignType,
                              });
                        }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {campaignType === "hashtag"
                        ? "No spaces or special characters. This is the hashtag users will include in their posts."
                        : campaignType === "mention"
                          ? "The brand name or terms users will mention in their posts."
                          : campaignType === "comment"
                            ? "Identifier for the posts where you want to collect comments."
                            : campaignType === "ugc"
                              ? "Terms that will help identify user-generated content about your brand."
                              : "The hashtag that contest participants will use."}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="campaign-description">
                      Campaign Description
                    </Label>
                    <Textarea
                      id="campaign-description"
                      placeholder="Brief description of your campaign and its goals"
                      value={
                        editingCampaign?.description || newCampaign.description
                      }
                      onChange={(e) =>
                        editingCampaign
                          ? setEditingCampaign({
                              ...editingCampaign,
                              description: e.target.value,
                            })
                          : setNewCampaign({
                              ...newCampaign,
                              description: e.target.value,
                            })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="campaign-icon">Campaign Icon</Label>
                    <div className="grid grid-cols-5 gap-2">
                      {campaignIcons.map((iconOption) => {
                        const Icon = iconOption.icon;
                        return (
                          <div
                            key={iconOption.id}
                            className={cn(
                              "border rounded-lg p-2 flex flex-col items-center gap-1 cursor-pointer transition-all hover:bg-slate-50",
                              (editingCampaign?.icon || newCampaign.icon) ===
                                iconOption.id &&
                                "border-purple-500 bg-purple-50"
                            )}
                            onClick={() =>
                              editingCampaign
                                ? setEditingCampaign({
                                    ...editingCampaign,
                                    icon: iconOption.id as any,
                                  })
                                : setNewCampaign({
                                    ...newCampaign,
                                    icon: iconOption.id as any,
                                  })
                            }
                          >
                            <Icon
                              className={cn(
                                "h-6 w-6",
                                (editingCampaign?.icon || newCampaign.icon) ===
                                  iconOption.id
                                  ? "text-purple-500"
                                  : "text-slate-500"
                              )}
                            />
                            <span className="text-xs mt-1">
                              {iconOption.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="campaign-status">Campaign Status</Label>
                    <Select
                      value={editingCampaign?.status || newCampaign.status}
                      onValueChange={(value) =>
                        editingCampaign
                          ? setEditingCampaign({
                              ...editingCampaign,
                              status: value as any,
                            })
                          : setNewCampaign({
                              ...newCampaign,
                              status: value as any,
                            })
                      }
                    >
                      <SelectTrigger id="campaign-status">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="scheduled">Scheduled</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="paused">Paused</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="start-date">Start Date</Label>
                      <Input
                        id="start-date"
                        type="date"
                        value={
                          editingCampaign?.start_date || newCampaign.start_date
                        }
                        onChange={(e) =>
                          editingCampaign
                            ? setEditingCampaign({
                                ...editingCampaign,
                                start_date: e.target.value,
                              })
                            : setNewCampaign({
                                ...newCampaign,
                                start_date: e.target.value,
                              })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="end-date">End Date</Label>
                      <Input
                        id="end-date"
                        type="date"
                        value={
                          editingCampaign?.end_date || newCampaign.end_date
                        }
                        onChange={(e) =>
                          editingCampaign
                            ? setEditingCampaign({
                                ...editingCampaign,
                                end_date: e.target.value,
                              })
                            : setNewCampaign({
                                ...newCampaign,
                                end_date: e.target.value,
                              })
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="campaign-target">Collection Target</Label>
                    <Input
                      id="campaign-target"
                      type="number"
                      min="1"
                      placeholder="Number of testimonials to collect"
                      value={editingCampaign?.target || newCampaign.target}
                      onChange={(e) =>
                        editingCampaign
                          ? setEditingCampaign({
                              ...editingCampaign,
                              target: parseInt(e.target.value) || 0,
                            })
                          : setNewCampaign({
                              ...newCampaign,
                              target: parseInt(e.target.value) || 0,
                            })
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      Set a target for how many testimonials you aim to collect
                      with this campaign
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Target Platforms</Label>
                    <div className="border rounded-lg p-4 space-y-2">
                      {platforms.map((platform) => (
                        <div
                          key={platform.name}
                          className={cn(
                            "flex items-center justify-between py-1",
                            !platform.enabled || !platform.connected
                              ? "opacity-50"
                              : ""
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id={`platform-${platform.name}`}
                              checked={(
                                editingCampaign?.platforms ||
                                newCampaign.platforms
                              ).includes(platform.name)}
                              onCheckedChange={(checked) => {
                                if (!platform.enabled || !platform.connected)
                                  return;

                                const updatePlatforms = (
                                  currentPlatforms: SocialPlatformName[]
                                ) => {
                                  if (checked) {
                                    return [...currentPlatforms, platform.name];
                                  } else {
                                    return currentPlatforms.filter(
                                      (p) => p !== platform.name
                                    );
                                  }
                                };

                                if (editingCampaign) {
                                  setEditingCampaign({
                                    ...editingCampaign,
                                    platforms: updatePlatforms(
                                      editingCampaign.platforms
                                    ),
                                  });
                                } else {
                                  setNewCampaign({
                                    ...newCampaign,
                                    platforms: updatePlatforms(
                                      newCampaign.platforms
                                    ),
                                  });
                                }
                              }}
                              disabled={
                                !platform.enabled || !platform.connected
                              }
                            />
                            <Label
                              htmlFor={`platform-${platform.name}`}
                              className="flex items-center gap-2 text-sm cursor-pointer"
                            >
                              {React.createElement(
                                platformIcons[platform.name],
                                {
                                  className: "h-4 w-4 text-slate-600",
                                }
                              )}
                              <span>
                                {platform.name.charAt(0).toUpperCase() +
                                  platform.name.slice(1)}
                              </span>
                            </Label>
                          </div>

                          {!platform.enabled || !platform.connected ? (
                            <Badge
                              variant="outline"
                              className="text-xs bg-slate-100 text-slate-500"
                            >
                              {!platform.enabled ? "Disabled" : "Not Connected"}
                            </Badge>
                          ) : null}
                        </div>
                      ))}

                      {(editingCampaign?.platforms || newCampaign.platforms)
                        .length === 0 && (
                        <div className="text-center py-2 text-sm text-slate-500">
                          Please select at least one platform
                        </div>
                      )}

                      {activePlatforms.length === 0 && (
                        <div className="flex items-start gap-2 mt-2 p-2 bg-amber-50 border border-amber-200 rounded-md">
                          <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5" />
                          <div className="text-xs text-amber-700">
                            You need to connect platforms in the Platforms tab
                            before you can create a campaign.
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="content" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="campaign-incentive">
                      Campaign Incentive (Optional)
                    </Label>
                    <Textarea
                      id="campaign-incentive"
                      placeholder={
                        campaignType === "contest"
                          ? "e.g. Grand prize: $500 gift card, Runner-up: $100 gift card"
                          : "e.g. Chance to be featured on our homepage, 15% discount code, etc."
                      }
                      value={
                        editingCampaign?.incentive || newCampaign.incentive
                      }
                      onChange={(e) =>
                        editingCampaign
                          ? setEditingCampaign({
                              ...editingCampaign,
                              incentive: e.target.value,
                            })
                          : setNewCampaign({
                              ...newCampaign,
                              incentive: e.target.value,
                            })
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      Describe any incentives for users to participate in your
                      campaign
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="campaign-rules">
                      Campaign Rules (Optional)
                    </Label>
                    <Textarea
                      id="campaign-rules"
                      placeholder={
                        campaignType === "contest"
                          ? "Contest rules, eligibility criteria, winner selection process, etc."
                          : "Rules for participation, content guidelines, etc."
                      }
                      value={editingCampaign?.rules || newCampaign.rules}
                      onChange={(e) =>
                        editingCampaign
                          ? setEditingCampaign({
                              ...editingCampaign,
                              rules: e.target.value,
                            })
                          : setNewCampaign({
                              ...newCampaign,
                              rules: e.target.value,
                            })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="campaign-budget">
                      Campaign Budget (Optional)
                    </Label>
                    <Input
                      id="campaign-budget"
                      type="number"
                      min="0"
                      placeholder="Budget in USD"
                      value={
                        editingCampaign?.budget || newCampaign.budget || ""
                      }
                      onChange={(e) =>
                        editingCampaign
                          ? setEditingCampaign({
                              ...editingCampaign,
                              budget: parseFloat(e.target.value) || 0,
                            })
                          : setNewCampaign({
                              ...newCampaign,
                              budget: parseFloat(e.target.value) || 0,
                            })
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      Set a budget for incentives, promotions, or ads for this
                      campaign
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="keywords">
                      Positive Keywords (Optional)
                    </Label>
                    <Textarea
                      id="keywords"
                      placeholder="love, awesome, great, recommend, amazing"
                      className="min-h-[80px]"
                      value={(
                        editingCampaign?.keywords ||
                        newCampaign.keywords ||
                        []
                      ).join(", ")}
                      onChange={(e) =>
                        editingCampaign
                          ? setEditingCampaign({
                              ...editingCampaign,
                              keywords: e.target.value
                                .split(",")
                                .map((k) => k.trim())
                                .filter(Boolean),
                            })
                          : setNewCampaign({
                              ...newCampaign,
                              keywords: e.target.value
                                .split(",")
                                .map((k) => k.trim())
                                .filter(Boolean),
                            })
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      Words that indicate positive testimonials (comma
                      separated)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="blacklist">Blocked Terms (Optional)</Label>
                    <Textarea
                      id="blacklist"
                      placeholder="hate, bad, awful, terrible, spam"
                      className="min-h-[80px]"
                      value={(
                        editingCampaign?.blacklist ||
                        newCampaign.blacklist ||
                        []
                      ).join(", ")}
                      onChange={(e) =>
                        editingCampaign
                          ? setEditingCampaign({
                              ...editingCampaign,
                              blacklist: e.target.value
                                .split(",")
                                .map((k) => k.trim())
                                .filter(Boolean),
                            })
                          : setNewCampaign({
                              ...newCampaign,
                              blacklist: e.target.value
                                .split(",")
                                .map((k) => k.trim())
                                .filter(Boolean),
                            })
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      Words that should exclude posts from being collected
                      (comma separated)
                    </p>
                  </div>

                  <div className="space-y-2 pt-2">
                    <div className="flex flex-col space-y-2">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="sentiment-analysis"
                          checked={
                            editingCampaign?.sentiment_analysis ||
                            newCampaign.sentiment_analysis
                          }
                          onCheckedChange={(checked) =>
                            editingCampaign
                              ? setEditingCampaign({
                                  ...editingCampaign,
                                  sentiment_analysis: checked as boolean,
                                })
                              : setNewCampaign({
                                  ...newCampaign,
                                  sentiment_analysis: checked as boolean,
                                })
                          }
                        />
                        <Label
                          htmlFor="sentiment-analysis"
                          className="text-sm cursor-pointer flex items-center gap-1.5"
                        >
                          <Heart className="h-3.5 w-3.5 text-pink-500" />
                          <span>Sentiment Analysis</span>
                        </Label>
                      </div>

                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="ai-categorization"
                          checked={
                            editingCampaign?.ai_categorization ||
                            newCampaign.ai_categorization
                          }
                          onCheckedChange={(checked) =>
                            editingCampaign
                              ? setEditingCampaign({
                                  ...editingCampaign,
                                  ai_categorization: checked as boolean,
                                })
                              : setNewCampaign({
                                  ...newCampaign,
                                  ai_categorization: checked as boolean,
                                })
                          }
                        />
                        <Label
                          htmlFor="ai-categorization"
                          className="text-sm cursor-pointer flex items-center gap-1.5"
                        >
                          <Sparkles className="h-3.5 w-3.5 text-purple-500" />
                          <span>AI Categorization</span>
                        </Label>
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground">
                      Enable AI-powered tools to process and organize collected
                      testimonials
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-blue-800">
                      Notification Settings
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label
                          htmlFor="report-frequency"
                          className="text-xs text-blue-700"
                        >
                          Report Frequency
                        </Label>
                        <Select
                          value={
                            editingCampaign?.report_frequency ||
                            newCampaign.report_frequency
                          }
                          onValueChange={(value) =>
                            editingCampaign
                              ? setEditingCampaign({
                                  ...editingCampaign,
                                  report_frequency: value as
                                    | "daily"
                                    | "weekly"
                                    | "monthly",
                                })
                              : setNewCampaign({
                                  ...newCampaign,
                                  report_frequency: value as
                                    | "daily"
                                    | "weekly"
                                    | "monthly",
                                })
                          }
                        >
                          <SelectTrigger
                            id="report-frequency"
                            className="h-8 text-xs bg-white border-blue-200"
                          >
                            <SelectValue placeholder="Select frequency" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1">
                        <Label
                          htmlFor="report-emails"
                          className="text-xs text-blue-700"
                        >
                          Email Recipients
                        </Label>
                        <Input
                          id="report-emails"
                          placeholder="email@example.com, email2@example.com"
                          className="h-8 text-xs bg-white border-blue-200"
                          value={(
                            editingCampaign?.report_recipients ||
                            newCampaign.report_recipients ||
                            []
                          ).join(", ")}
                          onChange={(e) =>
                            editingCampaign
                              ? setEditingCampaign({
                                  ...editingCampaign,
                                  report_recipients: e.target.value
                                    .split(",")
                                    .map((e) => e.trim())
                                    .filter(Boolean),
                                })
                              : setNewCampaign({
                                  ...newCampaign,
                                  report_recipients: e.target.value
                                    .split(",")
                                    .map((e) => e.trim())
                                    .filter(Boolean),
                                })
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="settings" className="space-y-6">
              <div className="border rounded-lg overflow-hidden">
                <div className="p-4 bg-slate-50 border-b">
                  <h3 className="text-sm font-medium">Campaign Preview</h3>
                </div>

                <div className="p-6">
                  <div className="max-w-lg mx-auto bg-white border rounded-lg shadow-sm overflow-hidden">
                    <div className="p-4 border-b bg-slate-50 flex items-center gap-3">
                      {(editingCampaign?.icon || newCampaign.icon) && (
                        <div className="p-2 rounded-lg bg-purple-100">
                          {React.createElement(
                            campaignIcons.find(
                              (i) =>
                                i.id ===
                                (editingCampaign?.icon || newCampaign.icon)
                            )?.icon || Star,
                            { className: "h-5 w-5 text-purple-600" }
                          )}
                        </div>
                      )}
                      <div>
                        <h4 className="font-medium text-lg">
                          {editingCampaign?.name ||
                            newCampaign.name ||
                            "Campaign Name"}
                        </h4>
                        <div className="flex items-center gap-1.5 text-sm text-slate-500">
                          {getTypeIcon(campaignType, "h-3.5 w-3.5")}
                          <span>
                            {editingCampaign?.identifier ||
                              newCampaign.identifier ||
                              "YourHashtag"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4">
                      <div className="space-y-4">
                        {(editingCampaign?.description ||
                          newCampaign.description) && (
                          <p className="text-sm text-slate-600">
                            {editingCampaign?.description ||
                              newCampaign.description}
                          </p>
                        )}

                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-1.5">
                            <CalendarClock className="h-4 w-4 text-slate-400" />
                            <span>
                              {new Date(
                                editingCampaign?.start_date ||
                                  newCampaign.start_date
                              ).toLocaleDateString()}{" "}
                              -{" "}
                              {new Date(
                                editingCampaign?.end_date ||
                                  newCampaign.end_date
                              ).toLocaleDateString()}
                            </span>
                          </div>

                          <Badge
                            variant="outline"
                            className={cn(
                              "capitalize",
                              statusColors[
                                editingCampaign?.status || newCampaign.status
                              ].bg,
                              statusColors[
                                editingCampaign?.status || newCampaign.status
                              ].text,
                              statusColors[
                                editingCampaign?.status || newCampaign.status
                              ].border
                            )}
                          >
                            {editingCampaign?.status || newCampaign.status}
                          </Badge>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {(
                            editingCampaign?.platforms || newCampaign.platforms
                          ).map((platform) => {
                            const Icon = platformIcons[platform];
                            const color = platformColors[platform];

                            return (
                              <Badge
                                key={platform}
                                className={cn("gap-1", color.bg, color.text)}
                              >
                                <Icon className="h-3 w-3" />
                                <span className="capitalize">{platform}</span>
                              </Badge>
                            );
                          })}
                        </div>

                        {(editingCampaign?.incentive ||
                          newCampaign.incentive) && (
                          <div className="bg-amber-50 border border-amber-100 rounded-md p-3">
                            <div className="flex items-start gap-2">
                              <Gift className="h-4 w-4 text-amber-500 mt-0.5" />
                              <div>
                                <h5 className="text-sm font-medium text-amber-800">
                                  Incentive
                                </h5>
                                <p className="text-xs text-amber-700 mt-0.5">
                                  {editingCampaign?.incentive ||
                                    newCampaign.incentive}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex gap-2 items-center">
                    <Settings className="h-4 w-4 text-slate-500" />
                    <h4 className="text-sm font-medium">Advanced Settings</h4>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-8"
                    onClick={() =>
                      setShowAdvancedSettings(!showAdvancedSettings)
                    }
                  >
                    {showAdvancedSettings ? "Hide" : "Show"} Advanced Settings
                  </Button>
                </div>

                {showAdvancedSettings && (
                  <div className="space-y-4 border rounded-lg p-4 bg-slate-50/50">
                    <div className="space-y-2">
                      <Label htmlFor="team-members">Team Members</Label>
                      <Input
                        id="team-members"
                        placeholder="Enter team member email addresses"
                        value={(
                          editingCampaign?.team ||
                          newCampaign.team ||
                          []
                        ).join(", ")}
                        onChange={(e) =>
                          editingCampaign
                            ? setEditingCampaign({
                                ...editingCampaign,
                                team: e.target.value
                                  .split(",")
                                  .map((t) => t.trim())
                                  .filter(Boolean),
                              })
                            : setNewCampaign({
                                ...newCampaign,
                                team: e.target.value
                                  .split(",")
                                  .map((t) => t.trim())
                                  .filter(Boolean),
                              })
                        }
                      />
                      <p className="text-xs text-muted-foreground">
                        Team members who will have access to manage this
                        campaign (comma separated)
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Collection Hours</Label>
                        <Select defaultValue="all">
                          <SelectTrigger>
                            <SelectValue placeholder="Select hours" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All hours</SelectItem>
                            <SelectItem value="business">
                              Business hours (9-5)
                            </SelectItem>
                            <SelectItem value="evening">
                              Evening hours (5-10)
                            </SelectItem>
                            <SelectItem value="custom">
                              Custom schedule
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Collection Days</Label>
                        <Select defaultValue="all">
                          <SelectTrigger>
                            <SelectValue placeholder="Select days" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All days</SelectItem>
                            <SelectItem value="weekdays">
                              Weekdays only
                            </SelectItem>
                            <SelectItem value="weekends">
                              Weekends only
                            </SelectItem>
                            <SelectItem value="custom">Custom days</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="pt-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox id="auto-approve" defaultChecked />
                        <Label
                          htmlFor="auto-approve"
                          className="text-sm cursor-pointer"
                        >
                          Automatically approve testimonials that meet criteria
                        </Label>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center p-4 bg-slate-50 rounded-lg border">
                <div className="flex items-center space-x-2">
                  <Checkbox id="confirm-ready" />
                  <Label
                    htmlFor="confirm-ready"
                    className="text-sm cursor-pointer"
                  >
                    I confirm this campaign is ready to be{" "}
                    {(editingCampaign?.status || newCampaign.status) ===
                    "active"
                      ? "launched"
                      : "saved"}
                  </Label>
                </div>

                <div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            // Generate example posts for this campaign
                            showToast({
                              title: "Example Posts",
                              description:
                                "Generated example posts for this campaign to share with your team or clients.",
                              variant: "default",
                            });
                          }}
                        >
                          <ArrowUpRight className="h-3.5 w-3.5 mr-1.5" />
                          <span className="text-xs">
                            Generate Example Posts
                          </span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">
                          Generate example posts to share with your team
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => {
                setShowAddCampaign(false);
                setEditingCampaign(null);
                setNewCampaign(defaultNewCampaign);
                setCampaignType("hashtag");
                setShowAdvancedSettings(false);
              }}
            >
              Cancel
            </Button>
            <Button
              className={`gap-2 ${
                editingCampaign
                  ? "bg-gradient-to-r from-slate-700 to-slate-900 hover:from-slate-800 hover:to-slate-950"
                  : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
              }`}
              onClick={
                editingCampaign
                  ? handleSaveEditedCampaign
                  : handleCreateCampaign
              }
              disabled={isCreatingCampaign}
            >
              {isCreatingCampaign ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Creating...</span>
                </>
              ) : editingCampaign ? (
                <>
                  <Check className="h-4 w-4" />
                  <span>Save Changes</span>
                </>
              ) : (
                <>
                  <PlusCircle className="h-4 w-4" />
                  <span>Create Campaign</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Template Selection Dialog */}
      <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Campaign Templates</DialogTitle>
            <DialogDescription>
              Select a pre-built template to quickly start your campaign
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div
              className="flex flex-col gap-2 p-4 border rounded-lg cursor-pointer hover:bg-slate-50 transition-colors"
              onClick={() => handleTemplateSelection("productLaunch")}
            >
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-blue-100">
                  <Sparkles className="h-4 w-4 text-blue-600" />
                </div>
                <h3 className="font-medium">Product Launch Campaign</h3>
              </div>
              <p className="text-sm text-slate-500 mt-1">
                Collect testimonials during the launch of a new product or
                feature
              </p>
            </div>

            <div
              className="flex flex-col gap-2 p-4 border rounded-lg cursor-pointer hover:bg-slate-50 transition-colors"
              onClick={() => handleTemplateSelection("customerAppreciation")}
            >
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-pink-100">
                  <Heart className="h-4 w-4 text-pink-600" />
                </div>
                <h3 className="font-medium">Customer Appreciation</h3>
              </div>
              <p className="text-sm text-slate-500 mt-1">
                Thank your customers and collect testimonials about their
                experiences
              </p>
            </div>

            <div
              className="flex flex-col gap-2 p-4 border rounded-lg cursor-pointer hover:bg-slate-50 transition-colors"
              onClick={() => handleTemplateSelection("contestGiveaway")}
            >
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-amber-100">
                  <Trophy className="h-4 w-4 text-amber-600" />
                </div>
                <h3 className="font-medium">Product Giveaway Contest</h3>
              </div>
              <p className="text-sm text-slate-500 mt-1">
                Run a contest or giveaway that encourages testimonial sharing
              </p>
            </div>

            <div
              className="flex flex-col gap-2 p-4 border rounded-lg cursor-pointer hover:bg-slate-50 transition-colors"
              onClick={() => handleTemplateSelection("yearInReview")}
            >
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-purple-100">
                  <Star className="h-4 w-4 text-purple-600" />
                </div>
                <h3 className="font-medium">Year in Review Campaign</h3>
              </div>
              <p className="text-sm text-slate-500 mt-1">
                Annual campaign to collect year-end testimonials and experiences
              </p>
            </div>

            <div
              className="flex flex-col gap-2 p-4 border rounded-lg cursor-pointer hover:bg-slate-50 transition-colors"
              onClick={() => handleTemplateSelection("commentCollection")}
            >
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-emerald-100">
                  <MessageSquare className="h-4 w-4 text-emerald-600" />
                </div>
                <h3 className="font-medium">Comment Collection Campaign</h3>
              </div>
              <p className="text-sm text-slate-500 mt-1">
                Collect valuable testimonials from comments on your social posts
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowTemplateDialog(false)}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!showDeleteConfirm}
        onOpenChange={(open) => !open && setShowDeleteConfirm(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600">Delete Campaign</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this campaign? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-red-700">
                  <p className="font-medium mb-1">Warning</p>
                  <p>
                    Deleting this campaign will remove all associated data and
                    statistics. Any ongoing collection will be stopped
                    immediately.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(null)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                showDeleteConfirm && handleDeleteCampaign(showDeleteConfirm)
              }
              className="flex-1"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Campaign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default observer(SocialCampaigns);

function getTypeIcon(
  type: CampaignType,
  className: string = "h-4 w-4 text-slate-500"
) {
  switch (type) {
    case "hashtag":
      return <Hash className={cn(className)} />;
    case "mention":
      return <AtSign className={cn(className)} />;
    case "comment":
      return <MessageSquare className={cn(className)} />;
    case "contest":
      return <Award className={cn(className)} />;
    default:
      return <Users className={cn(className)} />;
  }
}
