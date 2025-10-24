// components/ai-generated-content/LinkedInShareModal.tsx
import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Linkedin,
  Calendar,
  Clock,
  Sparkles,
  Send,
  CheckCircle,
  AlertCircle,
  Loader2,
  TrendingUp,
  Eye,
  Heart,
  MessageCircle,
  Video,
  FileText,
  Image as ImageIcon,
  ChevronDown,
  ChevronUp,
  Target,
  BarChart3,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { EnhancedArtifact } from "./ContentCategorization";
import { workspaceHub } from "@/repo/workspace_hub";
import { authStore } from "@/stores/authStore";

interface LinkedInAccount {
  id: string;
  platform_user_id: string;
  platform_username: string;
  platform_email: string;
  account_name: string;
  status: "connected" | "expired" | "error";
  profile_image_url?: string;
}

interface LinkedInShareModalProps {
  artifact: EnhancedArtifact;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

interface AITimeSuggestion {
  suggested_time: string;
  confidence_score: number;
  reasoning: string;
  alternative_times: Array<{
    time: string;
    score: number;
    reason: string;
  }>;
}

const LinkedInShareModal: React.FC<LinkedInShareModalProps> = ({
  artifact,
  isOpen,
  onOpenChange,
}) => {
  const [linkedInAccounts, setLinkedInAccounts] = useState<LinkedInAccount[]>(
    []
  );
  const [selectedAccount, setSelectedAccount] = useState<string>("");
  const [shareMode, setShareMode] = useState<"now" | "schedule" | "ai-best">(
    "now"
  );
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [customMessage, setCustomMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(false);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<AITimeSuggestion | null>(
    null
  );
  const [showPreview, setShowPreview] = useState(false);
  const [shareStatus, setShareStatus] = useState<
    "idle" | "sharing" | "scheduled" | "success" | "error"
  >("idle");
  const [error, setError] = useState<string | null>(null);

  const currentWorkspace = workspaceHub.workspace;
  const serverAddr = import.meta.env.VITE_API_URL;

  // Generate default content based on artifact type
  const generateDefaultContent = useCallback(() => {
    const hasVideo = !!artifact.asset_url;
    const platformText = artifact.platformTarget
      ? ` optimized for ${artifact.platformTarget.name}`
      : "";

    if (hasVideo && artifact.text_content) {
      return `🎥 Check out this AI-generated video content${platformText}!\n\n${artifact.text_content}\n\n#AI #ContentCreation #VideoMarketing`;
    } else if (artifact.text_content) {
      return `💡 Here's some AI-generated content${platformText} I wanted to share:\n\n${artifact.text_content}\n\n#AI #ContentCreation #Marketing`;
    } else {
      return `🚀 Just created some amazing AI-generated content${platformText}! Check it out.\n\n#AI #ContentCreation #Innovation`;
    }
  }, [artifact]);

  // Handle LinkedIn connection
  const handleConnectLinkedIn = useCallback(async () => {
    if (!currentWorkspace?.id) {
      setError("Workspace required to connect LinkedIn");
      return;
    }

    setIsLoadingAccounts(true);
    try {
      const response = await fetch(
        `${serverAddr}/social/workspaces/${currentWorkspace.id}/social/auth/linkedin`,
        {
          headers: {
            Authorization: `Bearer ${await authStore.getToken().then((r: any) => r.token)}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        const authUrl = data.data.auth_url;

        if (authUrl) {
          // Redirect to LinkedIn OAuth - this will come back to the app
          window.location.href = authUrl;
        } else {
          throw new Error("No auth URL received");
        }
      } else {
        throw new Error("Failed to get LinkedIn auth URL");
      }
    } catch (error) {
      console.error("Failed to connect to LinkedIn:", error);
      setError("Failed to connect to LinkedIn. Please try again.");
    } finally {
      setIsLoadingAccounts(false);
    }
  }, [currentWorkspace?.id, serverAddr]);

  // Load LinkedIn accounts
  const loadLinkedInAccounts = useCallback(async () => {
    if (!currentWorkspace?.id) return;

    setIsLoadingAccounts(true);
    try {
      const response = await fetch(
        `${serverAddr}/social/workspaces/${currentWorkspace.id}/social/accounts`,
        {
          headers: {
            Authorization: `Bearer ${await authStore.getToken().then((r: any) => r.token)}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        const linkedinAccounts = data.filter(
          (acc: any) => acc.platform === "linkedin"
        );
        setLinkedInAccounts(linkedinAccounts);

        if (linkedinAccounts.length > 0) {
          setSelectedAccount(linkedinAccounts[0].id);
        }
      }
    } catch (error) {
      console.error("Failed to load LinkedIn accounts:", error);
      setError("Failed to load LinkedIn accounts");
    } finally {
      setIsLoadingAccounts(false);
    }
  }, [currentWorkspace?.id, serverAddr]);

  // Get AI best time suggestion
  const getAITimeSuggestion = useCallback(async () => {
    if (!currentWorkspace?.id || !selectedAccount) return;

    setIsLoadingAI(true);
    try {
      const response = await fetch(
        `${serverAddr}/social/workspaces/${currentWorkspace.id}/ai/best-time`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${await authStore.getToken().then((r: any) => r.token)}`,
          },
          body: JSON.stringify({
            platform: "linkedin",
            post_type: artifact.asset_url ? "video" : "text",
            content_category: artifact.category.id,
          }),
        }
      );

      if (response.ok) {
        const suggestion = await response.json();
        setAiSuggestion(suggestion);

        // Set the suggested time
        const suggestedDate = new Date(suggestion.suggested_time);
        setScheduledDate(suggestedDate.toISOString().split("T")[0]);
        setScheduledTime(suggestedDate.toTimeString().slice(0, 5));
      }
    } catch (error) {
      console.error("Failed to get AI suggestion:", error);
    } finally {
      setIsLoadingAI(false);
    }
  }, [currentWorkspace?.id, selectedAccount, artifact, serverAddr]);

  // Create and share post
  const handleShare = useCallback(async () => {
    if (!currentWorkspace?.id || !selectedAccount) return;

    setIsLoading(true);
    setError(null);

    try {
      // First create the post
      const createResponse = await fetch(
        `${serverAddr}/social/workspaces/${currentWorkspace.id}/social/linkedin/posts`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${await authStore.getToken().then((r: any) => r.token)}`,
          },
          body: JSON.stringify({
            content: customMessage || generateDefaultContent(),
            social_account_id: selectedAccount,
            testimonial_id: artifact.testimonial_id,
            testimonial_ids: artifact.sourceTestimonials.map((t) => t.id),
            post_type: artifact.asset_url ? "video" : "text",
            media_urls: artifact.asset_url ? [artifact.asset_url] : [],
            hashtags: [],
            ...(shareMode === "schedule" && {
              scheduled_at: new Date(
                `${scheduledDate}T${scheduledTime}`
              ).toISOString(),
            }),
            ...(shareMode === "ai-best" &&
              aiSuggestion && {
                scheduled_at: aiSuggestion.suggested_time,
                ai_pick_best_time: true,
              }),
          }),
        }
      );

      if (!createResponse.ok) {
        throw new Error("Failed to create post");
      }

      const post = await createResponse.json();

      if (shareMode === "now") {
        // Immediately publish
        const publishResponse = await fetch(
          `${serverAddr}/social/posts/${post.id}/publish`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${await authStore.getToken().then((r: any) => r.token)}`,
            },
          }
        );

        if (publishResponse.ok) {
          setShareStatus("success");
        } else {
          throw new Error("Failed to publish post");
        }
      } else {
        // Schedule the post
        const scheduleResponse = await fetch(
          `${serverAddr}/social/posts/${post.id}/schedule`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${await authStore.getToken().then((r: any) => r.token)}`,
            },
            body: JSON.stringify({
              scheduled_at:
                shareMode === "ai-best" && aiSuggestion
                  ? aiSuggestion.suggested_time
                  : new Date(`${scheduledDate}T${scheduledTime}`).toISOString(),
              ai_pick_best_time: shareMode === "ai-best",
            }),
          }
        );

        if (scheduleResponse.ok) {
          setShareStatus("scheduled");
        } else {
          throw new Error("Failed to schedule post");
        }
      }

      // Close modal after success
      setTimeout(() => {
        onOpenChange(false);
        setShareStatus("idle");
      }, 2000);
    } catch (error) {
      console.error("Share failed:", error);
      setError(
        error instanceof Error ? error.message : "Failed to share content"
      );
      setShareStatus("error");
    } finally {
      setIsLoading(false);
    }
  }, [
    currentWorkspace?.id,
    selectedAccount,
    shareMode,
    scheduledDate,
    scheduledTime,
    customMessage,
    artifact,
    aiSuggestion,
    serverAddr,
    generateDefaultContent,
    onOpenChange,
  ]);

  // Initialize
  useEffect(() => {
    if (isOpen) {
      loadLinkedInAccounts();
      setCustomMessage(generateDefaultContent());
      setShareStatus("idle");
      setError(null);
    }
  }, [isOpen, loadLinkedInAccounts, generateDefaultContent]);

  // Load AI suggestion when switching to AI mode
  useEffect(() => {
    if (shareMode === "ai-best" && selectedAccount && !aiSuggestion) {
      getAITimeSuggestion();
    }
  }, [shareMode, selectedAccount, aiSuggestion, getAITimeSuggestion]);

  const getContentIcon = () => {
    if (artifact.asset_url) return Video;
    if (artifact.category.id.includes("text")) return FileText;
    return ImageIcon;
  };

  const ContentIcon = getContentIcon();

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
        <DialogHeader className="pb-6 border-b border-gray-100">
          <DialogTitle className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm">
              <Linkedin className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">
                Share to LinkedIn
              </h3>
              <p className="text-sm text-gray-500 font-normal mt-0.5">
                Share your AI-generated content with your professional network
              </p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 overflow-y-auto max-h-[70vh]">
          {/* Account Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">LinkedIn Account</Label>
            {isLoadingAccounts ? (
              <div className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-gray-600">
                  Loading accounts...
                </span>
              </div>
            ) : linkedInAccounts.length === 0 ? (
              <Card className="border-dashed border-blue-200 bg-blue-50/30">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-3">
                    <Linkedin className="h-6 w-6 text-blue-600" />
                  </div>
                  <h4 className="text-sm font-medium text-gray-900 mb-1">
                    Connect Your LinkedIn Account
                  </h4>
                  <p className="text-xs text-gray-600 mb-4">
                    Share your AI-generated content with your professional
                    network
                  </p>
                  <div className="flex gap-2 justify-center">
                    <Button
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                      onClick={handleConnectLinkedIn}
                      disabled={isLoadingAccounts}
                    >
                      {isLoadingAccounts ? (
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      ) : (
                        <Linkedin className="h-3 w-3 mr-1" />
                      )}
                      {isLoadingAccounts ? "Connecting..." : "Connect LinkedIn"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        window.open("/settings?tab=integrations", "_blank")
                      }
                      className="text-xs border-gray-300"
                    >
                      Settings
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {linkedInAccounts.map((account) => (
                  <div
                    key={account.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedAccount === account.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => setSelectedAccount(account.id)}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={account.profile_image_url} />
                        <AvatarFallback className="bg-blue-100 text-blue-700 text-xs">
                          {account.account_name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {account.account_name}
                        </p>
                        <p className="text-xs text-gray-500">
                          @{account.platform_username}
                        </p>
                      </div>
                      <Badge
                        variant={
                          account.status === "connected"
                            ? "default"
                            : "destructive"
                        }
                        className="text-xs"
                      >
                        {account.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {linkedInAccounts.length > 0 && (
            <>
              {/* Content Preview */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Content Preview</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPreview(!showPreview)}
                    className="h-7 px-2 text-xs"
                  >
                    {showPreview ? (
                      <ChevronUp className="h-3 w-3" />
                    ) : (
                      <ChevronDown className="h-3 w-3" />
                    )}
                    {showPreview ? "Hide" : "Show"} Preview
                  </Button>
                </div>

                <AnimatePresence>
                  {showPreview && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <Card className="border border-gray-200">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div
                              className={`w-10 h-10 rounded-lg flex items-center justify-center ${artifact.category.color}`}
                            >
                              <ContentIcon className="h-4 w-4" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="text-sm font-medium">
                                  {artifact.processing_type
                                    .replace(/_/g, " ")
                                    .replace(/\b\w/g, (l) => l.toUpperCase())}
                                </h4>
                                {artifact.platformTarget && (
                                  <Badge variant="outline" className="text-xs">
                                    <Target className="h-2.5 w-2.5 mr-1" />
                                    {artifact.platformTarget.name}
                                  </Badge>
                                )}
                              </div>

                              {artifact.asset_url && (
                                <div className="mb-3 rounded-lg overflow-hidden bg-gray-100">
                                  <video
                                    src={artifact.asset_url}
                                    className="w-full h-32 object-cover"
                                    muted
                                    poster={artifact.data?.thumbnail_url}
                                  />
                                </div>
                              )}

                              {artifact.text_content && (
                                <p className="text-sm text-gray-700 line-clamp-3 mb-3">
                                  {artifact.text_content}
                                </p>
                              )}

                              <div className="flex items-center gap-4 text-xs text-gray-500">
                                <span className="flex items-center gap-1">
                                  <Eye className="h-3 w-3" />
                                  {Math.floor(Math.random() * 1000)} views
                                </span>
                                <span className="flex items-center gap-1">
                                  <Heart className="h-3 w-3" />
                                  {Math.floor(Math.random() * 50)} likes
                                </span>
                                <span className="flex items-center gap-1">
                                  <MessageCircle className="h-3 w-3" />
                                  {Math.floor(Math.random() * 10)} comments
                                </span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Share Options */}
              <div className="space-y-4">
                <Label className="text-sm font-medium text-gray-900">
                  When to Share
                </Label>
                <div className="grid grid-cols-1 gap-3">
                  {/* Share Now */}
                  <div
                    className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                      shareMode === "now"
                        ? "border-blue-500 bg-blue-50/50 shadow-sm"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50/50"
                    }`}
                    onClick={() => setShareMode("now")}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-green-100 flex items-center justify-center">
                        <Send className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">
                          Share Now
                        </h4>
                        <p className="text-xs text-gray-500">
                          Post immediately to LinkedIn
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Schedule for Later */}
                  <div
                    className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                      shareMode === "schedule"
                        ? "border-blue-500 bg-blue-50/50 shadow-sm"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50/50"
                    }`}
                    onClick={() => setShareMode("schedule")}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-orange-100 flex items-center justify-center">
                        <Calendar className="h-4 w-4 text-orange-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-gray-900">
                          Schedule for Later
                        </h4>
                        <p className="text-xs text-gray-500">
                          Choose a specific date and time
                        </p>
                      </div>
                    </div>

                    {shareMode === "schedule" && (
                      <div className="mt-3 pt-3 border-t border-gray-200 grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs">Date</Label>
                          <Input
                            type="date"
                            value={scheduledDate}
                            onChange={(e) => setScheduledDate(e.target.value)}
                            min={new Date().toISOString().split("T")[0]}
                            className="h-8 text-xs"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Time</Label>
                          <Input
                            type="time"
                            value={scheduledTime}
                            onChange={(e) => setScheduledTime(e.target.value)}
                            className="h-8 text-xs"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* AI Best Time */}
                  <div
                    className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                      shareMode === "ai-best"
                        ? "border-blue-500 bg-blue-50/50 shadow-sm"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50/50"
                    }`}
                    onClick={() => setShareMode("ai-best")}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-purple-100 flex items-center justify-center">
                        <Sparkles className="h-4 w-4 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-gray-900 flex items-center gap-2">
                          AI Best Time
                          <Badge
                            variant="secondary"
                            className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 border-purple-200"
                          >
                            Smart
                          </Badge>
                        </h4>
                        <p className="text-xs text-gray-500">
                          Let AI choose the optimal posting time
                        </p>
                      </div>
                      {isLoadingAI && shareMode === "ai-best" && (
                        <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
                      )}
                    </div>

                    {shareMode === "ai-best" && aiSuggestion && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingUp className="h-3 w-3 text-purple-600" />
                          <span className="text-xs font-medium text-purple-900">
                            Suggested:{" "}
                            {new Date(
                              aiSuggestion.suggested_time
                            ).toLocaleString()}
                          </span>
                          <Badge variant="secondary" className="text-xs">
                            {Math.round(aiSuggestion.confidence_score * 100)}%
                            confidence
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-600">
                          {aiSuggestion.reasoning}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Custom Message */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Message</Label>
                <Textarea
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder="Write your LinkedIn post..."
                  className="min-h-[120px] text-sm"
                  maxLength={3000}
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>
                    Tip: Add relevant hashtags and mentions for better reach
                  </span>
                  <span>{customMessage.length}/3000</span>
                </div>
              </div>

              {/* Error Display */}
              {error && (
                <Card className="border-red-200 bg-red-50">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Success Status */}
              {shareStatus === "success" && (
                <Card className="border-green-200 bg-green-50">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <p className="text-sm text-green-700">
                        Successfully shared to LinkedIn!
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {shareStatus === "scheduled" && (
                <Card className="border-blue-200 bg-blue-50">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-blue-600" />
                      <p className="text-sm text-blue-700">
                        Post scheduled for{" "}
                        {shareMode === "ai-best" && aiSuggestion
                          ? new Date(
                              aiSuggestion.suggested_time
                            ).toLocaleString()
                          : new Date(
                              `${scheduledDate}T${scheduledTime}`
                            ).toLocaleString()}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>

          <div className="flex items-center gap-2">
            {linkedInAccounts.length > 0 && (
              <Button
                onClick={() => window.open("/analytics", "_blank")}
                variant="outline"
                size="sm"
                className="h-8 px-3 text-xs"
              >
                <BarChart3 className="h-3 w-3 mr-1" />
                View Analytics
              </Button>
            )}

            <Button
              onClick={handleShare}
              disabled={
                isLoading ||
                linkedInAccounts.length === 0 ||
                !selectedAccount ||
                (shareMode === "schedule" &&
                  (!scheduledDate || !scheduledTime)) ||
                !customMessage.trim()
              }
              className="min-w-[120px]"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : shareMode === "now" ? (
                <Send className="h-4 w-4 mr-2" />
              ) : (
                <Calendar className="h-4 w-4 mr-2" />
              )}
              {isLoading
                ? "Sharing..."
                : shareMode === "now"
                  ? "Share Now"
                  : "Schedule Post"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LinkedInShareModal;
