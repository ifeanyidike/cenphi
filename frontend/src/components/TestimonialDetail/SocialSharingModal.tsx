// components/TestimonialDetail/SocialSharingModal.tsx
import { useState, useEffect } from "react";
import { observer } from "mobx-react-lite";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Calendar,
  Clock,
  Bot,
  Share2,
  Plus,
  Loader2,
  Linkedin,
  Facebook,
  Twitter,
  Instagram,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import { socialManager, SocialAccount } from "@/repo/managers/social_manager";
import { workspaceHub } from "@/repo/workspace_hub";
import { useToast } from "@/hooks/use-toast";

interface SocialSharingModalProps {
  isOpen: boolean;
  onClose: () => void;
  testimonialId?: string;
  testimonialIds?: string[];
  artifactContent?: string;
  artifactType?: string;
  videoUrl?: string;
  imageUrls?: string[];
}

const PLATFORM_ICONS = {
  linkedin: Linkedin,
  facebook: Facebook,
  twitter: Twitter,
  instagram: Instagram,
};

const PLATFORM_COLORS = {
  linkedin: "bg-blue-600 hover:bg-blue-700",
  facebook: "bg-blue-500 hover:bg-blue-600",
  twitter: "bg-sky-500 hover:bg-sky-600",
  instagram: "bg-pink-500 hover:bg-pink-600",
};

const SocialSharingModal = observer(
  ({
    isOpen,
    onClose,
    testimonialId,
    testimonialIds = [],
    artifactContent = "",
    artifactType = "text",
    videoUrl,
    imageUrls = [],
  }: SocialSharingModalProps) => {
    const [selectedAccount, setSelectedAccount] = useState<string>("");
    const [content, setContent] = useState(artifactContent);
    const [hashtags, setHashtags] = useState<string[]>([]);
    const [newHashtag, setNewHashtag] = useState("");
    const [scheduleOption, setScheduleOption] = useState<
      "now" | "schedule" | "ai"
    >("now");
    const [scheduledDate, setScheduledDate] = useState("");
    const [scheduledTime, setScheduledTime] = useState("");
    const [isCreating, setIsCreating] = useState(false);
    const [accounts, setAccounts] = useState<SocialAccount[]>([]);
    const [loadingAccounts, setLoadingAccounts] = useState(false);

    const { toast } = useToast();

    // Load accounts when modal opens
    useEffect(() => {
      if (isOpen && workspaceHub.workspace?.id) {
        loadAccounts();
      }
    }, [isOpen]);

    // Update content when artifact content changes
    useEffect(() => {
      setContent(artifactContent);
    }, [artifactContent]);

    const loadAccounts = async () => {
      setLoadingAccounts(true);
      try {
        const fetchedAccounts = await socialManager.getAccounts(
          workspaceHub.workspace!.id
        );
        setAccounts(fetchedAccounts);

        // Auto-select first account if available
        if (fetchedAccounts.length > 0 && !selectedAccount) {
          const firstConnectedAccount = fetchedAccounts.find(
            (acc) => acc.status === "connected"
          );
          if (firstConnectedAccount) {
            setSelectedAccount(firstConnectedAccount.id);
          }
        }
      } catch (error) {
        console.error("Failed to load accounts:", error);
        toast({
          title: "Error",
          description: "Failed to load social accounts",
          variant: "destructive",
        });
      } finally {
        setLoadingAccounts(false);
      }
    };

    const handleConnectAccount = async (platform: string) => {
      try {
        const authUrl = await socialManager.getAuthURL(
          workspaceHub.workspace!.id,
          platform
        );
        window.open(authUrl, "_blank", "width=600,height=700");

        toast({
          title: "Opening Authorization",
          description: `Redirecting to ${platform} for account connection`,
        });
      } catch {
        toast({
          title: "Connection Error",
          description: `Failed to connect ${platform} account`,
          variant: "destructive",
        });
      }
    };

    const addHashtag = () => {
      if (newHashtag.trim() && !hashtags.includes(newHashtag.trim())) {
        const tag = newHashtag.trim().startsWith("#")
          ? newHashtag.trim()
          : `#${newHashtag.trim()}`;
        setHashtags([...hashtags, tag]);
        setNewHashtag("");
      }
    };

    const removeHashtag = (tag: string) => {
      setHashtags(hashtags.filter((h) => h !== tag));
    };

    const handleShare = async () => {
      if (!selectedAccount || !content.trim()) {
        toast({
          title: "Missing Information",
          description: "Please select an account and enter content",
          variant: "destructive",
        });
        return;
      }

      setIsCreating(true);

      try {
        const account = accounts.find((acc) => acc.id === selectedAccount);
        if (!account) throw new Error("Account not found");

        // Prepare post data
        const postData: any = {
          content: content.trim(),
          post_type: artifactType,
          hashtags,
          social_account_id: selectedAccount,
        };

        // Add testimonial references
        if (testimonialId) {
          postData.testimonial_id = testimonialId;
        }
        if (testimonialIds.length > 0) {
          postData.testimonial_ids = testimonialIds;
        }

        // Add media URLs
        if (videoUrl) {
          postData.media_urls = [videoUrl];
        } else if (imageUrls.length > 0) {
          postData.media_urls = imageUrls;
        }

        // Handle scheduling
        if (scheduleOption === "schedule" && scheduledDate && scheduledTime) {
          const scheduledDateTime = new Date(
            `${scheduledDate}T${scheduledTime}`
          );
          postData.scheduled_at = scheduledDateTime.toISOString();
        } else if (scheduleOption === "ai") {
          postData.ai_pick_best_time = true;
        }

        // Create the post
        const post = await socialManager.createPost(
          workspaceHub.workspace!.id,
          account.platform,
          postData
        );

        if (scheduleOption === "now") {
          // Publish immediately
          await socialManager.publishPost(post.id);
          toast({
            title: "Posted Successfully!",
            description: `Your content has been shared on ${account.platform}`,
          });
        } else {
          toast({
            title: "Post Scheduled!",
            description: `Your content will be shared on ${account.platform} ${
              scheduleOption === "ai"
                ? "at the optimal time"
                : "at the scheduled time"
            }`,
          });
        }

        onClose();
      } catch (error: any) {
        console.error("Share failed:", error);
        toast({
          title: "Share Failed",
          description: error.message || "Failed to share content",
          variant: "destructive",
        });
      } finally {
        setIsCreating(false);
      }
    };

    const connectedAccounts = accounts.filter(
      (acc) => acc.status === "connected"
    );
    const availablePlatforms = ["linkedin", "facebook", "twitter", "instagram"];
    const connectedPlatforms = connectedAccounts.map((acc) => acc.platform);

    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5" />
              Share to Social Media
            </DialogTitle>
            <DialogDescription>
              Share your testimonial content across social platforms with
              optimal timing
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Account Selection */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Social Accounts
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {loadingAccounts ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : connectedAccounts.length > 0 ? (
                  <div className="space-y-3">
                    <Label>Select Account</Label>
                    <Select
                      value={selectedAccount}
                      onValueChange={setSelectedAccount}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose an account to post to" />
                      </SelectTrigger>
                      <SelectContent>
                        {connectedAccounts.map((account) => {
                          const IconComponent =
                            PLATFORM_ICONS[
                              account.platform as keyof typeof PLATFORM_ICONS
                            ];
                          return (
                            <SelectItem key={account.id} value={account.id}>
                              <div className="flex items-center gap-2">
                                {IconComponent && (
                                  <IconComponent className="h-4 w-4" />
                                )}
                                <span className="capitalize">
                                  {account.platform}
                                </span>
                                {account.account_name && (
                                  <span className="text-muted-foreground">
                                    - {account.account_name}
                                  </span>
                                )}
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-muted-foreground mb-4">
                      No connected accounts found
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {availablePlatforms.map((platform) => {
                        const IconComponent =
                          PLATFORM_ICONS[
                            platform as keyof typeof PLATFORM_ICONS
                          ];
                        const colorClass =
                          PLATFORM_COLORS[
                            platform as keyof typeof PLATFORM_COLORS
                          ];

                        return (
                          <Button
                            key={platform}
                            variant="outline"
                            size="sm"
                            onClick={() => handleConnectAccount(platform)}
                            className={`${colorClass} text-white border-0`}
                          >
                            {IconComponent && (
                              <IconComponent className="h-4 w-4 mr-2" />
                            )}
                            Connect {platform}
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Add more accounts */}
                {connectedAccounts.length > 0 && (
                  <div className="pt-2 border-t">
                    <p className="text-sm text-muted-foreground mb-2">
                      Connect more accounts:
                    </p>
                    <div className="flex gap-2 flex-wrap">
                      {availablePlatforms
                        .filter(
                          (platform) => !connectedPlatforms.includes(platform)
                        )
                        .map((platform) => {
                          const IconComponent =
                            PLATFORM_ICONS[
                              platform as keyof typeof PLATFORM_ICONS
                            ];

                          return (
                            <Button
                              key={platform}
                              variant="outline"
                              size="sm"
                              onClick={() => handleConnectAccount(platform)}
                            >
                              {IconComponent && (
                                <IconComponent className="h-3 w-3 mr-1" />
                              )}
                              {platform}
                            </Button>
                          );
                        })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Content Editor */}
            {selectedAccount && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Post Content</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Message</Label>
                    <Textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="What would you like to share?"
                      rows={4}
                      maxLength={3000}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {content.length}/3000 characters
                    </p>
                  </div>

                  {/* Hashtags */}
                  <div>
                    <Label>Hashtags</Label>
                    <div className="flex gap-2 mb-2">
                      <Input
                        value={newHashtag}
                        onChange={(e) => setNewHashtag(e.target.value)}
                        placeholder="Add hashtag..."
                        onKeyPress={(e) => e.key === "Enter" && addHashtag()}
                      />
                      <Button onClick={addHashtag} size="sm" variant="outline">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    {hashtags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {hashtags.map((tag, index) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="cursor-pointer"
                            onClick={() => removeHashtag(tag)}
                          >
                            {tag} ×
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Scheduling Options */}
            {selectedAccount && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Posting Schedule
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs
                    value={scheduleOption}
                    onValueChange={(value: any) => setScheduleOption(value)}
                  >
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="now" className="text-xs">
                        <Target className="h-3 w-3 mr-1" />
                        Now
                      </TabsTrigger>
                      <TabsTrigger value="schedule" className="text-xs">
                        <Calendar className="h-3 w-3 mr-1" />
                        Schedule
                      </TabsTrigger>
                      <TabsTrigger value="ai" className="text-xs">
                        <Bot className="h-3 w-3 mr-1" />
                        AI Optimal
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="now" className="mt-4">
                      <p className="text-sm text-muted-foreground">
                        Post will be published immediately
                      </p>
                    </TabsContent>

                    <TabsContent value="schedule" className="mt-4 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>Date</Label>
                          <Input
                            type="date"
                            value={scheduledDate}
                            onChange={(e) => setScheduledDate(e.target.value)}
                            min={new Date().toISOString().split("T")[0]}
                          />
                        </div>
                        <div>
                          <Label>Time</Label>
                          <Input
                            type="time"
                            value={scheduledTime}
                            onChange={(e) => setScheduledTime(e.target.value)}
                          />
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="ai" className="mt-4">
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <div className="flex items-start gap-2">
                          <TrendingUp className="h-4 w-4 text-blue-600 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-blue-900">
                              AI-Powered Optimal Timing
                            </p>
                            <p className="text-xs text-blue-700 mt-1">
                              Our AI will analyze your audience engagement
                              patterns and schedule this post for maximum reach
                              and interaction.
                            </p>
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleShare}
              disabled={!selectedAccount || !content.trim() || isCreating}
            >
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  {scheduleOption === "now" ? "Posting..." : "Scheduling..."}
                </>
              ) : (
                <>
                  <Share2 className="h-4 w-4 mr-2" />
                  {scheduleOption === "now" ? "Post Now" : "Schedule Post"}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }
);

export default SocialSharingModal;
