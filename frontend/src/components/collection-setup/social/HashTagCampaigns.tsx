// src/components/collection-setup/social/HashtagCampaigns.tsx
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
  Twitter,
  Instagram,
  Facebook,
  Linkedin,
  Command,
  Youtube,
  Gift,
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
} from "@/types/setup";

interface HashtagCampaignsProps {
  campaigns: SocialCampaign[];
  platforms: SocialPlatform[];
  onAddCampaign: (campaign: Omit<SocialCampaign, "id" | "collected">) => void;
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

// Icon options for campaigns
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
  identifier: "",
  type: "hashtag",
  status: "draft",
  startDate: new Date().toISOString().split("T")[0],
  endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
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
  reportFrequency: "weekly",
  reportRecipients: [],
  keywords: [],
  blacklist: [],
  sentimentAnalysis: true,
  aiCategorization: true,
};

const HashtagCampaigns: React.FC<HashtagCampaignsProps> = ({
  campaigns,
  platforms,
  onAddCampaign,
  showToast,
}) => {
  const [showAddCampaign, setShowAddCampaign] = useState(false);
  const [newCampaign, setNewCampaign] =
    useState<Omit<SocialCampaign, "id" | "collected">>(defaultNewCampaign);
  const [activeTab, setActiveTab] = useState<
    "all" | "active" | "scheduled" | "completed"
  >("all");
  const [editingCampaign, setEditingCampaign] = useState<SocialCampaign | null>(
    null
  );
  const [campaignView, setCampaignView] = useState<"grid" | "table">("grid");
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);

  const handleCreateCampaign = () => {
    // Basic validation
    if (!newCampaign.name) {
      showToast({
        title: "Missing information",
        description: "Please provide a campaign name.",
        variant: "destructive",
      });
      return;
    }

    if (!newCampaign.identifier) {
      showToast({
        title: "Missing information",
        description: "Please provide a identifier for the campaign.",
        variant: "destructive",
      });
      return;
    }

    onAddCampaign(newCampaign);
    setShowAddCampaign(false);
    setNewCampaign(defaultNewCampaign);

    showToast({
      title: "Campaign created",
      description: `Campaign "${newCampaign.name}" has been created successfully.`,
      variant: "default",
    });
  };

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

  const handleTemplateSelection = (template: string) => {
    // Set template values based on selection
    let templateData: Partial<SocialCampaign> = {};

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
          sentimentAnalysis: true,
        };
        break;

      case "customerAppreciation":
        templateData = {
          name: "Customer Appreciation",
          identifier: "ThankYouCustomers",
          type: "hashtag",
          description: "Annual campaign to celebrate our customers",
          icon: "heart",
          platforms: ["instagram", "twitter", "facebook", "linkedin"],
          status: "draft",
          keywords: ["thanks", "grateful", "appreciation", "love"],
          sentimentAnalysis: true,
        };
        break;

      case "contestGiveaway":
        templateData = {
          name: "Product Giveaway Contest",
          identifier: "WinOurProduct",
          type: "hashtag",
          description:
            "Contest to win free products in exchange for testimonials",
          icon: "trophy",
          platforms: ["instagram", "twitter"],
          status: "draft",
          incentive: "Chance to win our premium product",
          rules: "Share your experience with our product using the hashtag",
          sentimentAnalysis: true,
        };
        break;

      case "yearInReview":
        templateData = {
          name: "Year in Review",
          identifier: "YearWithBrand",
          type: "hashtag",
          description: "Annual campaign to collect year-end testimonials",
          icon: "star",
          platforms: ["instagram", "twitter", "linkedin"],
          status: "draft",
          keywords: ["year", "journey", "experience", "favorite"],
          sentimentAnalysis: true,
        };
        break;
    }

    setNewCampaign({
      ...newCampaign,
      ...templateData,
      startDate: new Date().toISOString().split("T")[0],
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
    });

    setShowTemplateDialog(false);
  };

  const activePlatforms = platforms.filter((p) => p.enabled && p.connected);

  // Filter campaigns based on active tab
  const filteredCampaigns = campaigns.filter((campaign) => {
    if (activeTab === "all") return true;
    return campaign.status === activeTab;
  });

  return (
    <div className="space-y-8">
      {/* Header with overview */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight mb-1">
            Hashtag Campaigns
          </h2>
          <p className="text-sm text-muted-foreground">
            Create and manage dedicated campaigns to collect testimonials via
            hashtags
          </p>
        </div>
        <div className="flex gap-3 flex-wrap justify-end">
          <div className="flex gap-1">
            <Button
              variant={campaignView === "grid" ? "default" : "outline"}
              size="sm"
              className="h-8 px-3"
              onClick={() => setCampaignView("grid")}
            >
              <div className="grid grid-cols-2 gap-0.5 h-3.5 w-3.5">
                <div className="bg-current rounded-sm"></div>
                <div className="bg-current rounded-sm"></div>
                <div className="bg-current rounded-sm"></div>
                <div className="bg-current rounded-sm"></div>
              </div>
              <span className="ml-2 text-xs">Grid</span>
            </Button>
            <Button
              variant={campaignView === "table" ? "default" : "outline"}
              size="sm"
              className="h-8 px-3"
              onClick={() => setCampaignView("table")}
            >
              <div className="flex flex-col gap-0.5 justify-center h-3.5 w-3.5">
                <div className="bg-current h-0.5 w-3.5 rounded-sm"></div>
                <div className="bg-current h-0.5 w-3.5 rounded-sm"></div>
                <div className="bg-current h-0.5 w-3.5 rounded-sm"></div>
              </div>
              <span className="ml-2 text-xs">Table</span>
            </Button>
          </div>

          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as any)}
            className="w-auto"
          >
            <TabsList className="h-8 p-0.5">
              <TabsTrigger value="all" className="text-xs h-7 px-3 rounded">
                All
              </TabsTrigger>
              <TabsTrigger value="active" className="text-xs h-7 px-3 rounded">
                Active
              </TabsTrigger>
              <TabsTrigger
                value="scheduled"
                className="text-xs h-7 px-3 rounded"
              >
                Scheduled
              </TabsTrigger>
              <TabsTrigger
                value="completed"
                className="text-xs h-7 px-3 rounded"
              >
                Completed
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8"
                  onClick={() => setShowTemplateDialog(true)}
                >
                  <ArrowUpRight className="h-3.5 w-3.5 mr-1.5" />
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
            className="h-8 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
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

        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-purple-800">
              Testimonials Collected
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="flex items-end justify-between">
              <div className="text-2xl font-bold text-purple-700">
                {campaigns.reduce((sum, c) => sum + (c.collected || 0), 0)}
              </div>
              <div className="text-xs text-purple-600">
                Via hashtag campaigns
              </div>
            </div>
            <div className="mt-2 flex items-center gap-1 text-xs text-purple-700">
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

        <Card className="bg-white border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Reach & Impressions
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="flex items-end justify-between">
              <div className="text-2xl font-bold">
                {campaigns.length > 0 ? "43.2K+" : "0"}
              </div>
              <div className="text-xs text-slate-500">Est. campaign reach</div>
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
      {campaigns.length === 0 ? (
        <Card className="border-dashed border-2 bg-slate-50/50 overflow-hidden">
          <CardContent className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="rounded-full bg-purple-100 p-3 mb-4">
              <Hash className="h-8 w-8 text-purple-600" />
            </div>
            <h3 className="text-xl font-medium text-slate-800 mb-2">
              No hashtag campaigns yet
            </h3>
            <p className="text-slate-500 max-w-md mb-6">
              Create your first campaign to start collecting testimonials via
              branded hashtags on social media
            </p>
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
                className="gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
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
            const startDate = new Date(campaign.startDate);
            const endDate = new Date(campaign.endDate);

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
                  "border overflow-hidden",
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
                        <Hash className="h-3 w-3" />
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
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Campaign Actions</DropdownMenuLabel>
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
                          onClick={() => {
                            // Delete confirmation would go here
                            showToast({
                              title: "Campaign deleted",
                              description: `"${campaign.name}" has been deleted.`,
                              variant: "default",
                            });
                          }}
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
                <thead className="border-b">
                  <tr className="border-b transition-colors hover:bg-muted/5">
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
                    const startDate = new Date(campaign.startDate);
                    const endDate = new Date(campaign.endDate);

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
                            <Hash className="h-3.5 w-3.5 text-slate-400" />
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
                          <div className="flex items-center">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>
                                  Campaign Actions
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => setEditingCampaign(campaign)}
                                  className="flex items-center gap-2"
                                >
                                  <Edit2 className="h-4 w-4" />
                                  <span>Edit Campaign</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleDuplicateCampaign(campaign)
                                  }
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
                                  onClick={() => {
                                    // Delete confirmation would go here
                                    showToast({
                                      title: "Campaign deleted",
                                      description: `"${campaign.name}" has been deleted.`,
                                      variant: "default",
                                    });
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                  <span>Delete Campaign</span>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
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

      {/* Add Campaign Dialog */}
      <Dialog open={showAddCampaign} onOpenChange={setShowAddCampaign}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Hashtag Campaign</DialogTitle>
            <DialogDescription>
              Set up a campaign to collect testimonials through branded hashtags
              on social media
            </DialogDescription>
          </DialogHeader>

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
                      value={newCampaign.name}
                      onChange={(e) =>
                        setNewCampaign({ ...newCampaign, name: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="campaign-hashtag">Campaign Hashtag</Label>
                    <div className="flex">
                      <div className="flex items-center bg-slate-100 px-3 border border-r-0 rounded-l-md">
                        <Hash className="h-4 w-4 text-slate-500" />
                      </div>
                      <Input
                        id="campaign-hashtag"
                        placeholder="LoveOurBrand"
                        className="rounded-l-none"
                        value={newCampaign.identifier}
                        onChange={(e) =>
                          setNewCampaign({
                            ...newCampaign,
                            identifier: e.target.value.replace(
                              /[^a-zA-Z0-9]/g,
                              ""
                            ),
                          })
                        }
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      No spaces or special characters. This is the hashtag users
                      will include in their posts.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="campaign-description">
                      Campaign Description
                    </Label>
                    <Textarea
                      id="campaign-description"
                      placeholder="Brief description of your campaign and its goals"
                      value={newCampaign.description}
                      onChange={(e) =>
                        setNewCampaign({
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
                              newCampaign.icon === iconOption.id &&
                                "border-purple-500 bg-purple-50"
                            )}
                            onClick={() =>
                              setNewCampaign({
                                ...newCampaign,
                                icon: iconOption.id as any,
                              })
                            }
                          >
                            <Icon
                              className={cn(
                                "h-6 w-6",
                                newCampaign.icon === iconOption.id
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
                      value={newCampaign.status}
                      onValueChange={(value) =>
                        setNewCampaign({ ...newCampaign, status: value as any })
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
                        value={newCampaign.startDate}
                        onChange={(e) =>
                          setNewCampaign({
                            ...newCampaign,
                            startDate: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="end-date">End Date</Label>
                      <Input
                        id="end-date"
                        type="date"
                        value={newCampaign.endDate}
                        onChange={(e) =>
                          setNewCampaign({
                            ...newCampaign,
                            endDate: e.target.value,
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
                      value={newCampaign.target}
                      onChange={(e) =>
                        setNewCampaign({
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
                              checked={newCampaign.platforms.includes(
                                platform.name
                              )}
                              onCheckedChange={(checked) => {
                                if (!platform.enabled || !platform.connected)
                                  return;

                                if (checked) {
                                  setNewCampaign({
                                    ...newCampaign,
                                    platforms: [
                                      ...newCampaign.platforms,
                                      platform.name,
                                    ],
                                  });
                                } else {
                                  setNewCampaign({
                                    ...newCampaign,
                                    platforms: newCampaign.platforms.filter(
                                      (p) => p !== platform.name
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

                      {newCampaign.platforms.length === 0 && (
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
                      placeholder="e.g. Chance to win a $100 gift card, 15% discount code, etc."
                      value={newCampaign.incentive}
                      onChange={(e) =>
                        setNewCampaign({
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
                      placeholder="Rules for participation, eligibility criteria, etc."
                      value={newCampaign.rules}
                      onChange={(e) =>
                        setNewCampaign({
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
                      value={newCampaign.budget || ""}
                      onChange={(e) =>
                        setNewCampaign({
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
                      value={newCampaign.keywords?.join(", ") || ""}
                      onChange={(e) =>
                        setNewCampaign({
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
                      value={newCampaign.blacklist?.join(", ") || ""}
                      onChange={(e) =>
                        setNewCampaign({
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
                          checked={newCampaign.sentimentAnalysis}
                          onCheckedChange={(checked) =>
                            setNewCampaign({
                              ...newCampaign,
                              sentimentAnalysis: checked as boolean,
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
                          checked={newCampaign.aiCategorization}
                          onCheckedChange={(checked) =>
                            setNewCampaign({
                              ...newCampaign,
                              aiCategorization: checked as boolean,
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
                      <div className="flex items-center space-x-2">
                        <Label
                          htmlFor="report-frequency"
                          className="text-xs text-blue-700"
                        >
                          Report Frequency
                        </Label>
                        <Select
                          value={newCampaign.reportFrequency}
                          onValueChange={(value) =>
                            setNewCampaign({
                              ...newCampaign,
                              reportFrequency: value as
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
                          value={newCampaign.reportRecipients?.join(", ") || ""}
                          onChange={(e) =>
                            setNewCampaign({
                              ...newCampaign,
                              reportRecipients: e.target.value
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
                      {newCampaign.icon && (
                        <div className="p-2 rounded-lg bg-purple-100">
                          {React.createElement(
                            campaignIcons.find((i) => i.id === newCampaign.icon)
                              ?.icon || Star,
                            { className: "h-5 w-5 text-purple-600" }
                          )}
                        </div>
                      )}
                      <div>
                        <h4 className="font-medium text-lg">
                          {newCampaign.name || "Campaign Name"}
                        </h4>
                        <div className="flex items-center gap-1.5 text-sm text-slate-500">
                          <Hash className="h-3.5 w-3.5" />
                          <span>{newCampaign.identifier || "YourHashtag"}</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4">
                      <div className="space-y-4">
                        {newCampaign.description && (
                          <p className="text-sm text-slate-600">
                            {newCampaign.description}
                          </p>
                        )}

                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-1.5">
                            <CalendarClock className="h-4 w-4 text-slate-400" />
                            <span>
                              {new Date(
                                newCampaign.startDate
                              ).toLocaleDateString()}{" "}
                              -{" "}
                              {new Date(
                                newCampaign.endDate
                              ).toLocaleDateString()}
                            </span>
                          </div>

                          <Badge
                            variant="outline"
                            className={cn(
                              "capitalize",
                              statusColors[newCampaign.status].bg,
                              statusColors[newCampaign.status].text,
                              statusColors[newCampaign.status].border
                            )}
                          >
                            {newCampaign.status}
                          </Badge>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {newCampaign.platforms.map((platform) => {
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

                        {newCampaign.incentive && (
                          <div className="bg-amber-50 border border-amber-100 rounded-md p-3">
                            <div className="flex items-start gap-2">
                              <Gift className="h-4 w-4 text-amber-500 mt-0.5" />
                              <div>
                                <h5 className="text-sm font-medium text-amber-800">
                                  Incentive
                                </h5>
                                <p className="text-xs text-amber-700 mt-0.5">
                                  {newCampaign.incentive}
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

              <div className="flex justify-between items-center p-4 bg-slate-50 rounded-lg border">
                <div className="flex items-center space-x-2">
                  <Checkbox id="confirm-ready" />
                  <Label
                    htmlFor="confirm-ready"
                    className="text-sm cursor-pointer"
                  >
                    I confirm this campaign is ready to be{" "}
                    {newCampaign.status === "active" ? "launched" : "saved"}
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
            <Button variant="outline" onClick={() => setShowAddCampaign(false)}>
              Cancel
            </Button>
            <Button
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              onClick={handleCreateCampaign}
            >
              Create Campaign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Campaign Dialog */}
      <Dialog
        open={!!editingCampaign}
        onOpenChange={(open) => !open && setEditingCampaign(null)}
      >
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {editingCampaign && (
            <>
              <DialogHeader>
                <DialogTitle>Edit Campaign: {editingCampaign.name}</DialogTitle>
                <DialogDescription>
                  Update your hashtag campaign settings
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-campaign-name">Campaign Name</Label>
                      <Input
                        id="edit-campaign-name"
                        placeholder="Campaign Name"
                        value={editingCampaign.name}
                        onChange={(e) =>
                          setEditingCampaign({
                            ...editingCampaign,
                            name: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit-campaign-hashtag">
                        Campaign Hashtag
                      </Label>
                      <div className="flex">
                        <div className="flex items-center bg-slate-100 px-3 border border-r-0 rounded-l-md">
                          <Hash className="h-4 w-4 text-slate-500" />
                        </div>
                        <Input
                          id="edit-campaign-hashtag"
                          placeholder="BrandHashtag"
                          className="rounded-l-none"
                          value={editingCampaign.identifier}
                          onChange={(e) =>
                            setEditingCampaign({
                              ...editingCampaign,
                              identifier: e.target.value.replace(
                                /[^a-zA-Z0-9]/g,
                                ""
                              ),
                            })
                          }
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit-campaign-description">
                        Description
                      </Label>
                      <Textarea
                        id="edit-campaign-description"
                        placeholder="Campaign description"
                        value={editingCampaign.description}
                        onChange={(e) =>
                          setEditingCampaign({
                            ...editingCampaign,
                            description: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit-campaign-icon">Campaign Icon</Label>
                      <div className="grid grid-cols-5 gap-2">
                        {campaignIcons.map((iconOption) => {
                          const Icon = iconOption.icon;
                          return (
                            <div
                              key={iconOption.id}
                              className={cn(
                                "border rounded-lg p-2 flex flex-col items-center gap-1 cursor-pointer transition-all hover:bg-slate-50",
                                editingCampaign.icon === iconOption.id &&
                                  "border-purple-500 bg-purple-50"
                              )}
                              onClick={() =>
                                setEditingCampaign({
                                  ...editingCampaign,
                                  icon: iconOption.id as any,
                                })
                              }
                            >
                              <Icon
                                className={cn(
                                  "h-6 w-6",
                                  editingCampaign.icon === iconOption.id
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
                      <Label htmlFor="edit-campaign-status">
                        Campaign Status
                      </Label>
                      <Select
                        value={editingCampaign.status}
                        onValueChange={(value) =>
                          setEditingCampaign({
                            ...editingCampaign,
                            status: value as any,
                          })
                        }
                      >
                        <SelectTrigger id="edit-campaign-status">
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
                        <Label htmlFor="edit-start-date">Start Date</Label>
                        <Input
                          id="edit-start-date"
                          type="date"
                          value={editingCampaign.startDate}
                          onChange={(e) =>
                            setEditingCampaign({
                              ...editingCampaign,
                              startDate: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-end-date">End Date</Label>
                        <Input
                          id="edit-end-date"
                          type="date"
                          value={editingCampaign.endDate}
                          onChange={(e) =>
                            setEditingCampaign({
                              ...editingCampaign,
                              endDate: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit-campaign-target">
                        Collection Target
                      </Label>
                      <Input
                        id="edit-campaign-target"
                        type="number"
                        min="1"
                        value={editingCampaign.target}
                        onChange={(e) =>
                          setEditingCampaign({
                            ...editingCampaign,
                            target: parseInt(e.target.value) || 0,
                          })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Target Platforms</Label>
                      <div className="border rounded-lg p-4 space-y-2">
                        {platforms.map((platform) => (
                          <div
                            key={platform.name}
                            className={cn(
                              "flex items-center gap-2",
                              !platform.enabled || !platform.connected
                                ? "opacity-50"
                                : ""
                            )}
                          >
                            <Checkbox
                              id={`edit-platform-${platform.name}`}
                              checked={editingCampaign.platforms.includes(
                                platform.name
                              )}
                              onCheckedChange={(checked) => {
                                if (!platform.enabled || !platform.connected)
                                  return;

                                if (checked) {
                                  setEditingCampaign({
                                    ...editingCampaign,
                                    platforms: [
                                      ...editingCampaign.platforms,
                                      platform.name,
                                    ],
                                  });
                                } else {
                                  setEditingCampaign({
                                    ...editingCampaign,
                                    platforms: editingCampaign.platforms.filter(
                                      (p) => p !== platform.name
                                    ),
                                  });
                                }
                              }}
                              disabled={
                                !platform.enabled || !platform.connected
                              }
                            />
                            <Label
                              htmlFor={`edit-platform-${platform.name}`}
                              className="text-sm cursor-pointer flex items-center gap-2"
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
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-6 mt-2">
                  <h4 className="text-sm font-medium mb-4">Campaign Details</h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-incentive">Incentive</Label>
                        <Textarea
                          id="edit-incentive"
                          placeholder="Incentive for participation"
                          value={editingCampaign.incentive}
                          onChange={(e) =>
                            setEditingCampaign({
                              ...editingCampaign,
                              incentive: e.target.value,
                            })
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="edit-rules">Rules</Label>
                        <Textarea
                          id="edit-rules"
                          placeholder="Campaign rules"
                          value={editingCampaign.rules}
                          onChange={(e) =>
                            setEditingCampaign({
                              ...editingCampaign,
                              rules: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-keywords">Positive Keywords</Label>
                        <Textarea
                          id="edit-keywords"
                          placeholder="Positive keywords (comma separated)"
                          value={editingCampaign.keywords?.join(", ") || ""}
                          onChange={(e) =>
                            setEditingCampaign({
                              ...editingCampaign,
                              keywords: e.target.value
                                .split(",")
                                .map((k) => k.trim())
                                .filter(Boolean),
                            })
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="edit-blacklist">Blocked Terms</Label>
                        <Textarea
                          id="edit-blacklist"
                          placeholder="Blocked terms (comma separated)"
                          value={editingCampaign.blacklist?.join(", ") || ""}
                          onChange={(e) =>
                            setEditingCampaign({
                              ...editingCampaign,
                              blacklist: e.target.value
                                .split(",")
                                .map((k) => k.trim())
                                .filter(Boolean),
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter className="flex items-center justify-between">
                <Button
                  variant="outline"
                  onClick={() => setEditingCampaign(null)}
                >
                  Cancel
                </Button>
                <Button
                  className="bg-gradient-to-r from-slate-700 to-slate-900 hover:from-slate-800 hover:to-slate-950"
                  onClick={() => {
                    // Save changes would go here in a real implementation
                    setEditingCampaign(null);
                    showToast({
                      title: "Campaign updated",
                      description: "Your changes have been saved successfully.",
                      variant: "default",
                    });
                  }}
                >
                  Save Changes
                </Button>
              </DialogFooter>
            </>
          )}
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
    </div>
  );
};

export default HashtagCampaigns;
