// components/ai-generated-content/ShareModal.tsx
import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Share2,
  Linkedin,
  Copy,
  Check,
  ExternalLink,
  Loader2,
  Sparkles,
  AlertCircle,
  Twitter,
  Facebook,
  Instagram,
  Send,
  Link2,
  Code2,
  Globe,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { EnhancedArtifact } from "./ContentCategorization";
import { workspaceHub } from "@/repo/workspace_hub";
import { authStore } from "@/stores/authStore";
import LinkedInShareModal from "./LinkedInShareModal";

interface ShareModalProps {
  artifact: EnhancedArtifact;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

interface PublicShare {
  id: string;
  share_type: string;
  is_public: boolean;
  is_active: boolean;
  created_at: string;
}

interface AIPostSuggestion {
  platform: string;
  content: string;
  hashtags: string[];
  tone: string;
  char_count: number;
  engagement_score: number;
}

const ShareModal: React.FC<ShareModalProps> = ({
  artifact,
  isOpen,
  onOpenChange,
}) => {
  const [activeTab, setActiveTab] = useState("link");
  const [publicShare, setPublicShare] = useState<PublicShare | null>(null);
  const [isCreatingShare, setIsCreatingShare] = useState(false);
  const [shareLink, setShareLink] = useState("");
  const [widgetCode, setWidgetCode] = useState("");
  const [copiedItem, setCopiedItem] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [aiPosts, setAiPosts] = useState<Record<string, AIPostSuggestion>>({});
  const [isGeneratingPosts, setIsGeneratingPosts] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<string>("linkedin");
  const [showLinkedInModal, setShowLinkedInModal] = useState(false);
  const [shareDescription, setShareDescription] = useState("");

  const currentWorkspace = workspaceHub.workspace;
  const serverAddr = import.meta.env.VITE_API_URL;

  const createPublicShare = useCallback(async (customDescription?: string) => {
    if (!currentWorkspace?.id || !artifact.id) return;

    setIsCreatingShare(true);
    setError(null);

    try {
      const token = await authStore.getToken().then((r: any) => r.token);
      const response = await fetch(`${serverAddr}/shares`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          workspace_id: currentWorkspace.id,
          share_type: "artifact",
          artifact_id: artifact.id,
          expires_at: null,
          description: customDescription || shareDescription || undefined,
          custom_branding: {
            primary_color: "#3b82f6",
            secondary_color: "#1e40af",
          },
        }),
      });

      if (!response.ok) throw new Error("Failed to create share");

      const data = await response.json();
      setPublicShare(data);

      const baseUrl = window.location.origin;
      const link = `${baseUrl}/share/${data.id}/view`;
      setShareLink(link);

      const embedResponse = await fetch(`${serverAddr}/widget/embed/${data.id}`);
      if (embedResponse.ok) {
        const embedCode = await embedResponse.text();
        setWidgetCode(embedCode);
      }
    } catch (err) {
      console.error("Failed to create share:", err);
      setError("Failed to create share. Please try again.");
    } finally {
      setIsCreatingShare(false);
    }
  }, [currentWorkspace?.id, artifact.id, serverAddr]);

  const generateAIPosts = useCallback(async () => {
    if (!artifact.testimonial_id) {
      setError("No testimonial associated with this artifact");
      return;
    }

    setIsGeneratingPosts(true);
    setError(null);

    try {
      const token = await authStore.getToken().then((r: any) => r.token);
      const response = await fetch(
        `${serverAddr}/testimonials/${artifact.testimonial_id}/ai/generate-posts`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error("Failed to generate posts");

      const data = await response.json();
      setAiPosts(data.suggestions || {});
    } catch (err) {
      console.error("Failed to generate AI posts:", err);
      setError("Failed to generate AI posts. Please try again.");
    } finally {
      setIsGeneratingPosts(false);
    }
  }, [artifact.testimonial_id, serverAddr]);

  const copyToClipboard = useCallback(async (text: string, item: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedItem(item);
      setTimeout(() => setCopiedItem(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  }, []);

  const shareToSocial = useCallback(
    (platform: string, post: AIPostSuggestion) => {
      const fullText = `${post.content}\n\n${post.hashtags.join(" ")}`;
      const encodedText = encodeURIComponent(fullText);
      const encodedUrl = shareLink
        ? encodeURIComponent(shareLink)
        : encodeURIComponent(window.location.href);

      const urls: Record<string, string> = {
        linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}&summary=${encodedText}`,
        twitter: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`,
      };

      if (platform === "instagram") {
        copyToClipboard(fullText, `${platform}-share`);
        return;
      }

      window.open(urls[platform], "_blank", "width=600,height=400");
    },
    [shareLink, copyToClipboard]
  );

  useEffect(() => {
    if (isOpen && artifact.id) {
      const checkExistingShare = async () => {
        try {
          const token = await authStore.getToken().then((r: any) => r.token);
          const response = await fetch(
            `${serverAddr}/artifacts/${artifact.id}/shares`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );

          if (response.ok) {
            const data = await response.json();
            const shares = data.shares || [];
            if (shares.length > 0) {
              const share = shares[0];
              setPublicShare(share);

              const baseUrl = window.location.origin;
              const link = `${baseUrl}/share/${share.id}/view`;
              setShareLink(link);

              const embedResponse = await fetch(
                `${serverAddr}/widget/embed/${share.id}`
              );
              if (embedResponse.ok) {
                const embedCode = await embedResponse.text();
                setWidgetCode(embedCode);
              }
            }
          }
        } catch (err) {
          console.error("Failed to check existing share:", err);
        }
      };

      checkExistingShare();
    }
  }, [isOpen, artifact.id, serverAddr]);

  useEffect(() => {
    if (!isOpen) {
      setError(null);
      setAiPosts({});
      setActiveTab("link");
    }
  }, [isOpen]);

  const hasShare = !!shareLink;
  const hasAIPosts = Object.keys(aiPosts).length > 0;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden">
          {/* Header */}
          <DialogHeader className="p-6 pb-4 border-b">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-slate-900 flex items-center justify-center">
                <Share2 className="h-5 w-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-base font-semibold text-slate-900">
                  Share Content
                </DialogTitle>
                <p className="text-xs text-slate-500 mt-0.5">
                  Distribute across platforms
                </p>
              </div>
            </div>
          </DialogHeader>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
            <div className="px-6 pt-4 border-b">
              <TabsList className="grid w-full grid-cols-3 h-9 bg-slate-100 p-0.5">
                <TabsTrigger
                  value="link"
                  className="text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                  <Link2 className="h-3.5 w-3.5 mr-1.5" />
                  Share Link
                </TabsTrigger>
                <TabsTrigger
                  value="social"
                  className="text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                  <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                  AI Posts
                </TabsTrigger>
                <TabsTrigger
                  value="linkedin"
                  className="text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                  <Linkedin className="h-3.5 w-3.5 mr-1.5" />
                  LinkedIn
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {/* Share Link Tab */}
              <TabsContent value="link" className="mt-0 space-y-4">
                {!hasShare ? (
                  <div className="space-y-4">
                    <div className="text-center py-6">
                      <div className="h-12 w-12 rounded-lg bg-slate-100 flex items-center justify-center mx-auto mb-3">
                        <Globe className="h-6 w-6 text-slate-600" />
                      </div>
                      <h4 className="text-sm font-medium text-slate-900 mb-1">
                        Create Public Share
                      </h4>
                      <p className="text-xs text-slate-500 mb-4 max-w-sm mx-auto">
                        Generate a shareable link and embed code for your content
                      </p>
                    </div>

                    {/* Optional Description */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs text-slate-700">
                          Description (Optional)
                        </Label>
                        {hasAIPosts && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const post = aiPosts[selectedPlatform];
                              if (post) {
                                setShareDescription(
                                  `${post.content}\n\n${post.hashtags.join(" ")}`
                                );
                              }
                            }}
                            className="h-6 px-2 text-xs"
                          >
                            <Sparkles className="h-3 w-3 mr-1" />
                            Use AI Post
                          </Button>
                        )}
                      </div>
                      <Textarea
                        value={shareDescription}
                        onChange={(e) => setShareDescription(e.target.value)}
                        placeholder="Add a description that will appear on the public page and embed..."
                        className="min-h-[80px] text-xs resize-none"
                        maxLength={500}
                      />
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] text-slate-500">
                          This text will be visible on the public share page
                        </p>
                        <span className="text-[10px] text-slate-500">
                          {shareDescription.length}/500
                        </span>
                      </div>
                    </div>

                    <Button
                      onClick={() => createPublicShare()}
                      disabled={isCreatingShare}
                      size="sm"
                      className="w-full bg-slate-900 hover:bg-slate-800"
                    >
                      {isCreatingShare ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <Share2 className="h-3.5 w-3.5 mr-2" />
                          Create Share Link
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Public Link */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Link2 className="h-3.5 w-3.5 text-slate-700" />
                          <span className="text-xs font-medium text-slate-700">
                            Public Link
                          </span>
                        </div>
                        <Badge className="bg-green-500 text-white text-[9px] h-4">
                          Active
                        </Badge>
                      </div>
                      <div className="flex gap-2">
                        <Input
                          value={shareLink}
                          readOnly
                          className="flex-1 font-mono text-xs bg-slate-50 h-9"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(shareLink, "link")}
                          className="h-9 px-3"
                        >
                          {copiedItem === "link" ? (
                            <Check className="h-3.5 w-3.5 text-green-600" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(shareLink, "_blank")}
                          className="h-9 px-3"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>

                    {/* Quick Share */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-700">
                          Quick Share
                        </span>
                        {hasAIPosts && (
                          <Badge variant="outline" className="text-[9px] h-4">
                            With AI Post
                          </Badge>
                        )}
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        {[
                          {
                            icon: Twitter,
                            name: "Twitter",
                            platform: "twitter",
                          },
                          {
                            icon: Linkedin,
                            name: "LinkedIn",
                            platform: "linkedin",
                          },
                          {
                            icon: Facebook,
                            name: "Facebook",
                            platform: "facebook",
                          },
                          {
                            icon: Instagram,
                            name: "Instagram",
                            platform: "instagram",
                          },
                        ].map(({ icon: Icon, name, platform }) => {
                          const aiPost = aiPosts[platform];
                          const postText = aiPost
                            ? `${aiPost.content}\n\n${aiPost.hashtags.join(" ")}`
                            : "";
                          const encodedText = encodeURIComponent(postText);
                          const encodedUrl = encodeURIComponent(shareLink);

                          const urls: Record<string, string> = {
                            twitter: postText
                              ? `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`
                              : `https://twitter.com/intent/tweet?url=${encodedUrl}`,
                            linkedin: postText
                              ? `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}&summary=${encodedText}`
                              : `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
                            facebook: postText
                              ? `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`
                              : `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
                          };

                          return (
                            <Button
                              key={name}
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                if (platform === "instagram") {
                                  copyToClipboard(
                                    postText || shareLink,
                                    "social"
                                  );
                                } else {
                                  window.open(
                                    urls[platform],
                                    "_blank",
                                    "width=600,height=400"
                                  );
                                }
                              }}
                              className="h-9 flex flex-col gap-0.5 py-1"
                              title={
                                aiPost
                                  ? `${name} (with AI post)`
                                  : name
                              }
                            >
                              <Icon className="h-3.5 w-3.5" />
                              {aiPost && (
                                <span className="text-[8px] text-green-600">•</span>
                              )}
                            </Button>
                          );
                        })}
                      </div>
                      {hasAIPosts && (
                        <p className="text-[10px] text-slate-500">
                          Green dot indicates AI post text will be included
                        </p>
                      )}
                    </div>

                    {/* Embed Code */}
                    {widgetCode && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Code2 className="h-3.5 w-3.5 text-slate-700" />
                          <span className="text-xs font-medium text-slate-700">
                            Embed Code
                          </span>
                        </div>
                        <div className="relative">
                          <Textarea
                            value={widgetCode}
                            readOnly
                            className="font-mono text-[10px] bg-slate-50 min-h-[120px] resize-none pr-10"
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyToClipboard(widgetCode, "widget")}
                            className="absolute top-2 right-2 h-7 w-7 p-0"
                          >
                            {copiedItem === "widget" ? (
                              <Check className="h-3.5 w-3.5 text-green-600" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        </div>
                        <p className="text-[10px] text-slate-500">
                          Copy and paste this code on your website to embed the widget
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>

              {/* AI Social Posts Tab */}
              <TabsContent value="social" className="mt-0 space-y-4">
                {!hasAIPosts ? (
                  <div className="text-center py-8">
                    <div className="h-12 w-12 rounded-lg bg-slate-100 flex items-center justify-center mx-auto mb-3">
                      <Sparkles className="h-6 w-6 text-slate-600" />
                    </div>
                    <h4 className="text-sm font-medium text-slate-900 mb-1">
                      Generate AI Posts
                    </h4>
                    <p className="text-xs text-slate-500 mb-4 max-w-sm mx-auto">
                      Create optimized posts for social media platforms with AI
                    </p>
                    <Button
                      onClick={generateAIPosts}
                      disabled={isGeneratingPosts}
                      size="sm"
                      className="bg-slate-900 hover:bg-slate-800"
                    >
                      {isGeneratingPosts ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-3.5 w-3.5 mr-2" />
                          Generate Posts
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Platform Selector */}
                    <div className="flex items-center justify-between">
                      <Select
                        value={selectedPlatform}
                        onValueChange={setSelectedPlatform}
                      >
                        <SelectTrigger className="h-8 text-xs w-36">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="linkedin">LinkedIn</SelectItem>
                          <SelectItem value="twitter">Twitter</SelectItem>
                          <SelectItem value="facebook">Facebook</SelectItem>
                          <SelectItem value="instagram">Instagram</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        onClick={generateAIPosts}
                        disabled={isGeneratingPosts}
                        variant="ghost"
                        size="sm"
                        className="h-8 text-xs"
                      >
                        <Sparkles className="h-3 w-3 mr-1.5" />
                        Regenerate
                      </Button>
                    </div>

                    {/* Post Card */}
                    {Object.entries(aiPosts)
                      .filter(([platform]) => platform === selectedPlatform)
                      .map(([platform, post]) => (
                        <div
                          key={platform}
                          className="p-4 rounded-lg border border-slate-200 space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="h-6 w-6 rounded bg-slate-100 flex items-center justify-center">
                                {platform === "linkedin" && (
                                  <Linkedin className="h-3.5 w-3.5 text-slate-700" />
                                )}
                                {platform === "twitter" && (
                                  <Twitter className="h-3.5 w-3.5 text-slate-700" />
                                )}
                                {platform === "facebook" && (
                                  <Facebook className="h-3.5 w-3.5 text-slate-700" />
                                )}
                                {platform === "instagram" && (
                                  <Instagram className="h-3.5 w-3.5 text-slate-700" />
                                )}
                              </div>
                              <span className="text-xs font-medium capitalize">
                                {platform}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <div className="h-1 w-16 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-green-500"
                                  style={{
                                    width: `${post.engagement_score * 100}%`,
                                  }}
                                />
                              </div>
                              <span className="text-[10px] text-slate-600 font-medium">
                                {Math.round(post.engagement_score * 100)}%
                              </span>
                            </div>
                          </div>

                          <div className="p-3 bg-slate-50 rounded-md border border-slate-100">
                            <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                              {post.content}
                            </p>
                            {post.hashtags.length > 0 && (
                              <p className="text-xs text-blue-600 mt-2">
                                {post.hashtags.join(" ")}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t">
                            <div className="text-[10px] text-slate-500">
                              {post.char_count} chars • {post.tone}
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  copyToClipboard(
                                    `${post.content}\n\n${post.hashtags.join(" ")}`,
                                    platform
                                  )
                                }
                                className="h-7 px-2 text-xs"
                              >
                                {copiedItem === platform ? (
                                  <Check className="h-3 w-3 text-green-600" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => shareToSocial(platform, post)}
                                className="h-7 px-3 text-xs bg-slate-900"
                              >
                                <Send className="h-3 w-3 mr-1" />
                                Share
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </TabsContent>

              {/* LinkedIn Tab */}
              <TabsContent value="linkedin" className="mt-0">
                <div className="text-center py-8">
                  <div className="h-12 w-12 rounded-lg bg-blue-500 flex items-center justify-center mx-auto mb-3">
                    <Linkedin className="h-6 w-6 text-white" />
                  </div>
                  <h4 className="text-sm font-medium text-slate-900 mb-1">
                    LinkedIn Direct Share
                  </h4>
                  <p className="text-xs text-slate-500 mb-4 max-w-sm mx-auto">
                    Share with scheduling, AI optimization, and analytics
                  </p>
                  <Button
                    onClick={() => setShowLinkedInModal(true)}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Linkedin className="h-3.5 w-3.5 mr-2" />
                    Open LinkedIn Share
                  </Button>
                </div>
              </TabsContent>

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 mt-4"
                  >
                    <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
                    <p className="text-xs text-red-700">{error}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </Tabs>

          {/* Footer */}
          <div className="p-4 border-t bg-slate-50 flex justify-end">
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              size="sm"
              className="h-8 text-xs"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <LinkedInShareModal
        artifact={artifact}
        isOpen={showLinkedInModal}
        onOpenChange={setShowLinkedInModal}
      />
    </>
  );
};

export default ShareModal;
