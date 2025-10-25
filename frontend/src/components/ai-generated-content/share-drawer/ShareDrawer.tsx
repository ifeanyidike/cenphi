// components/ai-generated-content/ShareDrawer.tsx
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
  Link2,
  Code2,
  Globe,
  ChevronRight,
  Zap,
  Layout,
  Layers,
  Maximize2,
  Minimize2,
  Calendar,
  Clock,
  Send,
  TrendingUp,
  CheckCircle,
  Eye,
  Image,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { EnhancedArtifact } from "../ContentCategorization";
import { workspaceHub } from "@/repo/workspace_hub";
import { aiArtifactsManager } from "@/repo/managers/ai_artifacts_manager";
import { authStore } from "@/stores/authStore";
import { cn } from "@/lib/utils";
import ExportGif from "./ExportGif";

interface ShareDrawerProps {
  artifact: EnhancedArtifact;
  artifacts?: EnhancedArtifact[]; // Optional: for multi-select carousel mode
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

interface LinkedInAccount {
  id: string;
  platform_user_id: string;
  platform_username: string;
  platform_email: string;
  account_name: string;
  status: "connected" | "expired" | "error";
  profile_image_url?: string;
}

interface AITimeSuggestion {
  suggested_time: string;
  confidence_score: number;
  reasoning: string;
}

type TabType = "link" | "social" | "linkedin" | "gif";
type WidgetStyle = "cinematic" | "magazine" | "floating" | "minimal";
type CarouselStyle = "slide" | "stack" | "fade" | "multiItem";
type ShareMode = "now" | "schedule" | "ai-best";

const widgetStyles: Array<{
  id: WidgetStyle;
  name: string;
  description: string;
  icon: any;
}> = [
  {
    id: "cinematic",
    name: "Cinematic",
    description: "Full-screen immersive layout with overlay text",
    icon: Maximize2,
  },
  {
    id: "magazine",
    name: "Magazine",
    description: "Editorial style with side-by-side content",
    icon: Layout,
  },
  {
    id: "floating",
    name: "Floating",
    description: "Card-based floating design with shadows",
    icon: Layers,
  },
  {
    id: "minimal",
    name: "Minimal",
    description: "Clean, minimal layout focused on content",
    icon: Minimize2,
  },
];

const carouselStyles: Array<{
  id: CarouselStyle;
  name: string;
  description: string;
}> = [
  { id: "slide", name: "Slide", description: "Smooth horizontal sliding" },
  { id: "stack", name: "Stack", description: "Stacked cards effect" },
  { id: "fade", name: "Fade", description: "Crossfade transition" },
  {
    id: "multiItem",
    name: "Multi-Item",
    description: "Show multiple items at once",
  },
];

const ShareDrawer: React.FC<ShareDrawerProps> = ({
  artifact,
  artifacts,
  isOpen,
  onOpenChange,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>("link");
  const [, setPublicShare] = useState<PublicShare | null>(null);
  const [isCreatingShare, setIsCreatingShare] = useState(false);
  const [shareLink, setShareLink] = useState("");
  const [copiedItem, setCopiedItem] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [aiPosts, setAiPosts] = useState<Record<string, AIPostSuggestion>>({});
  const [isGeneratingPosts, setIsGeneratingPosts] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<string>("linkedin");
  const [shareDescription, setShareDescription] = useState("");

  // Widget customization
  const [selectedWidgetStyle, setSelectedWidgetStyle] =
    useState<WidgetStyle>("cinematic");
  const [compactMode, setCompactMode] = useState(false);
  const [widgetCode, setWidgetCode] = useState("");

  // Carousel mode
  const [isCarouselMode, setIsCarouselMode] = useState(false);
  const [selectedArtifacts, setSelectedArtifacts] = useState<string[]>([
    artifact.id,
  ]);
  const [carouselShareIds, setCarouselShareIds] = useState<string[]>([]);
  const [selectedCarouselStyle, setSelectedCarouselStyle] =
    useState<CarouselStyle>("slide");
  const [carouselEmbedCode, setCarouselEmbedCode] = useState("");

  // LinkedIn state
  const [linkedInAccounts, setLinkedInAccounts] = useState<LinkedInAccount[]>(
    []
  );
  const [selectedAccount, setSelectedAccount] = useState<string>("");
  const [shareMode, setShareMode] = useState<ShareMode>("now");
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [linkedInMessage, setLinkedInMessage] = useState("");
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(false);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<AITimeSuggestion | null>(
    null
  );
  const [isSharing, setIsSharing] = useState(false);
  const [shareStatus, setShareStatus] = useState<
    "idle" | "success" | "scheduled"
  >("idle");

  const currentWorkspace = workspaceHub.workspace;
  const serverAddr = import.meta.env.VITE_API_URL;

  const createPublicShare = useCallback(
    async (artifactId: string, customDescription?: string) => {
      if (!currentWorkspace?.id) return null;

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
            artifact_id: artifactId,
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
        return data.id;
      } catch (err) {
        console.error("Failed to create share:", err);
        return null;
      }
    },
    [currentWorkspace?.id, serverAddr, shareDescription]
  );

  const createSingleShare = useCallback(async () => {
    setIsCreatingShare(true);
    setError(null);

    try {
      const shareId = await createPublicShare(artifact.id);
      if (!shareId) {
        throw new Error("Failed to create share");
      }

      const baseUrl = window.location.origin;
      const link = `${baseUrl}/share/${shareId}/view`;
      setShareLink(link);
      setPublicShare({ id: shareId } as PublicShare);

      // Fetch widget embed code
      await fetchWidgetCode(shareId);
    } catch (err) {
      console.error("Failed to create share:", err);
      setError("Failed to create share. Please try again.");
    } finally {
      setIsCreatingShare(false);
    }
  }, [artifact.id, createPublicShare]);

  const fetchWidgetCode = useCallback(
    async (shareId: string) => {
      try {
        const baseUrl = serverAddr.replace(/\/api$/, ""); // Remove /api suffix since widget routes are at root
        const embedResponse = await fetch(
          `${baseUrl}/widget/embed/${shareId}?embedStyle=${selectedWidgetStyle}&compact=${compactMode}`
        );
        if (embedResponse.ok) {
          const code = await embedResponse.text();
          setWidgetCode(code);
        }
      } catch (err) {
        console.error("Failed to fetch widget code:", err);
      }
    },
    [serverAddr, selectedWidgetStyle, compactMode]
  );

  const createCarouselShares = useCallback(async () => {
    if (!currentWorkspace?.id || selectedArtifacts.length === 0) return;

    setIsCreatingShare(true);
    setError(null);

    try {
      const shareIds: string[] = [];

      for (const artifactId of selectedArtifacts) {
        const shareId = await createPublicShare(artifactId);
        if (shareId) {
          shareIds.push(shareId);
        }
      }

      if (shareIds.length === 0) {
        throw new Error("Failed to create shares");
      }

      setCarouselShareIds(shareIds);

      // Fetch carousel embed code
      const baseUrl = serverAddr.replace(/\/api$/, ""); // Remove /api suffix since widget routes are at root
      const embedResponse = await fetch(
        `${baseUrl}/widget/embed/carousel?shareIds=${shareIds.join(",")}&embedStyle=${selectedWidgetStyle}&carouselStyle=${selectedCarouselStyle}`
      );

      if (embedResponse.ok) {
        const code = await embedResponse.text();
        setCarouselEmbedCode(code);
      }
    } catch (err) {
      console.error("Failed to create carousel:", err);
      setError("Failed to create carousel. Please try again.");
    } finally {
      setIsCreatingShare(false);
    }
  }, [
    currentWorkspace?.id,
    selectedArtifacts,
    createPublicShare,
    serverAddr,
    selectedWidgetStyle,
    selectedCarouselStyle,
  ]);

  const generateAIPosts = useCallback(async () => {
    setIsGeneratingPosts(true);
    setError(null);

    try {
      const token = await authStore.getToken().then((r: any) => r.token);

      if (isCarouselMode && artifacts && artifacts.length > 1) {
        // Multi-artifact carousel mode
        const artifactsToUse = artifacts.filter((a) =>
          selectedArtifacts.includes(a.id)
        );
        const testimonialIds = Array.from(
          new Set(
            artifactsToUse
              .map((a) => a.testimonial_id)
              .filter((id): id is string => id !== undefined && id !== null)
          )
        );

        if (testimonialIds.length === 0) {
          setError("No testimonials associated with selected artifacts");
          setIsGeneratingPosts(false);
          return;
        }

        // Since backend doesn't support multi-testimonial generation yet,
        // use the first testimonial for now
        // TODO: Update backend to support multiple testimonials
        const response = await fetch(
          `${serverAddr}/testimonials/${testimonialIds[0]}/ai/generate-posts`,
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

        // Show info that we're using content from first testimonial
        if (testimonialIds.length > 1) {
          console.info(
            `Note: AI post generated from first testimonial. Multi-testimonial post generation coming soon.`
          );
        }
      } else {
        // Single artifact mode
        if (!artifact.testimonial_id) {
          setError("No testimonial associated with this artifact");
          setIsGeneratingPosts(false);
          return;
        }

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
      }
    } catch (err) {
      console.error("Failed to generate AI posts:", err);
      setError("Failed to generate AI posts. Please try again.");
    } finally {
      setIsGeneratingPosts(false);
    }
  }, [
    artifact.testimonial_id,
    serverAddr,
    isCarouselMode,
    artifacts,
    selectedArtifacts,
  ]);

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

  // LinkedIn functions
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
    } finally {
      setIsLoadingAccounts(false);
    }
  }, [currentWorkspace?.id, serverAddr]);

  const handleConnectLinkedIn = useCallback(async () => {
    if (!currentWorkspace?.id) return;

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
          window.location.href = authUrl;
        }
      }
    } catch (error) {
      console.error("Failed to connect to LinkedIn:", error);
      setError("Failed to connect to LinkedIn. Please try again.");
    } finally {
      setIsLoadingAccounts(false);
    }
  }, [currentWorkspace?.id, serverAddr]);

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

  const handleLinkedInShare = useCallback(async () => {
    if (!currentWorkspace?.id || !selectedAccount) return;

    setIsSharing(true);
    setError(null);

    try {
      // Determine post type and media URLs based on carousel mode
      let postType: string;
      let mediaUrls: string[];
      let testimonialIds: string[];

      if (isCarouselMode && artifacts && artifacts.length > 1) {
        // Carousel mode with multiple artifacts
        const artifactsToShare = artifacts.filter((a) =>
          selectedArtifacts.includes(a.id)
        );

        // Collect media URLs
        mediaUrls = artifactsToShare
          .filter((a) => a.asset_url)
          .map((a) => a.asset_url!);

        // Collect testimonial IDs
        testimonialIds = Array.from(
          new Set(
            artifactsToShare.flatMap((a) =>
              a.sourceTestimonials.map((t) => t.id)
            )
          )
        );

        // Determine post type based on media
        if (mediaUrls.length === 0) {
          postType = "text";
        } else {
          // Check if all media are images or videos
          const hasVideo = artifactsToShare.some((a) =>
            a.content_type?.startsWith("video/")
          );

          if (hasVideo && mediaUrls.length > 1) {
            // LinkedIn doesn't support video carousels
            setError(
              "LinkedIn only supports image carousels (2-9 images). Videos must be shared individually."
            );
            setIsSharing(false);
            return;
          } else if (hasVideo) {
            postType = "video";
          } else if (mediaUrls.length >= 2 && mediaUrls.length <= 9) {
            // Image carousel (2-9 images)
            postType = "carousel";
          } else if (mediaUrls.length > 9) {
            setError("LinkedIn supports maximum 9 images in carousel posts.");
            setIsSharing(false);
            return;
          } else {
            postType = "image";
          }
        }
      } else {
        // Single artifact mode
        postType = artifact.asset_url ? "video" : "text";
        mediaUrls = artifact.asset_url ? [artifact.asset_url] : [];
        testimonialIds = artifact.sourceTestimonials.map((t) => t.id);
      }

      const token = await authStore.getToken().then((r: any) => r.token);
      const createResponse = await fetch(
        `${serverAddr}/social/workspaces/${currentWorkspace.id}/social/linkedin/posts`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            content: linkedInMessage,
            social_account_id: selectedAccount,
            testimonial_id: artifact.testimonial_id,
            testimonial_ids: testimonialIds,
            post_type: postType,
            media_urls: mediaUrls,
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
        const publishResponse = await fetch(
          `${serverAddr}/social/posts/${post.id}/publish`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (publishResponse.ok) {
          setShareStatus("success");
        } else {
          throw new Error("Failed to publish post");
        }
      } else {
        const scheduleResponse = await fetch(
          `${serverAddr}/social/posts/${post.id}/schedule`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
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

      setTimeout(() => {
        setShareStatus("idle");
      }, 3000);
    } catch (error) {
      console.error("Share failed:", error);
      setError(
        error instanceof Error ? error.message : "Failed to share content"
      );
    } finally {
      setIsSharing(false);
    }
  }, [
    currentWorkspace?.id,
    selectedAccount,
    linkedInMessage,
    artifact,
    shareMode,
    scheduledDate,
    scheduledTime,
    aiSuggestion,
    serverAddr,
    isCarouselMode,
    artifacts,
    selectedArtifacts,
  ]);

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

              await fetchWidgetCode(share.id);
            }
          }
        } catch (err) {
          console.error("Failed to check existing share:", err);
        }
      };

      checkExistingShare();
    }
  }, [isOpen, artifact.id, serverAddr, fetchWidgetCode]);

  useEffect(() => {
    if (!isOpen) {
      setError(null);
      setAiPosts({});
      setActiveTab("link");
      setIsCarouselMode(false);
      setSelectedArtifacts([artifact.id]);
      setCarouselShareIds([]);
      setShareStatus("idle");
    } else {
      // Auto-enable carousel mode if multiple artifacts provided
      if (artifacts && artifacts.length > 1) {
        setIsCarouselMode(true);
        setSelectedArtifacts(artifacts.map((a) => a.id));
      } else {
        setIsCarouselMode(false);
        setSelectedArtifacts([artifact.id]);
      }
    }
  }, [isOpen, artifact.id, artifacts]);

  useEffect(() => {
    if (activeTab === "linkedin" && linkedInAccounts.length === 0) {
      loadLinkedInAccounts();
    }
  }, [activeTab, linkedInAccounts.length, loadLinkedInAccounts]);

  useEffect(() => {
    if (shareMode === "ai-best" && selectedAccount && !aiSuggestion) {
      getAITimeSuggestion();
    }
  }, [shareMode, selectedAccount, aiSuggestion, getAITimeSuggestion]);

  useEffect(() => {
    if (shareLink) {
      const shareId = shareLink.split("/share/")[1]?.split("/view")[0];
      if (shareId) {
        fetchWidgetCode(shareId);
      }
    }
  }, [selectedWidgetStyle, compactMode, shareLink, fetchWidgetCode]);

  useEffect(() => {
    if (carouselShareIds.length > 0) {
      const fetchCarouselCode = async () => {
        try {
          const baseUrl = serverAddr.replace(/\/api$/, ""); // Remove /api suffix since widget routes are at root
          const embedResponse = await fetch(
            `${baseUrl}/widget/embed/carousel?shareIds=${carouselShareIds.join(",")}&embedStyle=${selectedWidgetStyle}&carouselStyle=${selectedCarouselStyle}`
          );
          if (embedResponse.ok) {
            const code = await embedResponse.text();
            setCarouselEmbedCode(code);
          }
        } catch (err) {
          console.error("Failed to fetch carousel code:", err);
        }
      };
      fetchCarouselCode();
    }
  }, [
    carouselShareIds,
    selectedWidgetStyle,
    selectedCarouselStyle,
    serverAddr,
  ]);

  // Widget preview initialization
  useEffect(() => {
    if (!shareLink || !isOpen || isCarouselMode) return;

    const shareId = shareLink.split("/share/")[1]?.split("/view")[0];
    if (!shareId) return;

    const loadAndInitWidget = () => {
      const containerId = `cenphi-preview-${artifact.id}`;
      const container = document.getElementById(containerId);

      if (!container) {
        console.log("Preview container not found:", containerId);
        return;
      }

      // Clear previous widget
      container.innerHTML = "";

      console.log(
        "Initializing widget preview with shareId:",
        shareId,
        "apiUrl:",
        serverAddr
      );

      // @ts-ignore
      if (window.CenphiShareWidget) {
        console.log("CenphiShareWidget loaded, initializing...");
        // @ts-ignore
        window.CenphiShareWidget.init({
          container: `#${containerId}`,
          shareId: shareId,
          apiUrl: serverAddr.replace(/\/api$/, ""), // Remove /api suffix since widget routes are at root
          embedStyle: selectedWidgetStyle,
          theme: "light",
          compact: compactMode,
          showBranding: true,
          enableAnimations: true,
          showRating: true,
          showAvatar: true,
          disableTracking: true, // Disable analytics tracking for preview
        });
      } else {
        // Load script if not already loaded
        // Note: serverAddr already includes /api, so we need to go up one level
        const baseUrl = serverAddr.replace(/\/api$/, "");
        // Add cache-busting version parameter to ensure fresh script
        const scriptSrc = `${baseUrl}/share-widget.js?v=${Date.now()}`;
        const existingScript = document.querySelector(
          'script[src^="' + baseUrl + '/share-widget.js"]'
        );
        if (!existingScript) {
          console.log("Loading widget script from:", scriptSrc);
          const script = document.createElement("script");
          script.src = scriptSrc;
          script.onload = () => {
            console.log("Widget script loaded successfully");
            loadAndInitWidget();
          };
          script.onerror = (error) => {
            console.error("Failed to load widget script:", error);
            container.innerHTML =
              '<div style="padding: 20px; text-align: center; color: #dc2626;">Failed to load widget script. Check console for details.</div>';
          };
          document.head.appendChild(script);
        } else {
          // Script already exists, just init if CenphiShareWidget becomes available
          console.log(
            "Widget script already loaded, waiting for initialization..."
          );
          const checkWidget = setInterval(() => {
            // @ts-ignore
            if (window.CenphiShareWidget) {
              clearInterval(checkWidget);
              loadAndInitWidget();
            }
          }, 100);
          // Timeout after 5 seconds
          setTimeout(() => clearInterval(checkWidget), 5000);
        }
      }
    };

    // Small delay to ensure DOM is ready
    const timer = setTimeout(loadAndInitWidget, 100);
    return () => clearTimeout(timer);
  }, [
    shareLink,
    selectedWidgetStyle,
    compactMode,
    isOpen,
    artifact.id,
    serverAddr,
    isCarouselMode,
  ]);

  // Carousel preview initialization
  useEffect(() => {
    if (carouselShareIds.length === 0 || !isOpen || !isCarouselMode) return;

    const loadAndInitCarousel = () => {
      const containerId = `cenphi-carousel-preview-${artifact.id}`;
      const container = document.getElementById(containerId);

      if (!container) {
        console.log("Carousel preview container not found:", containerId);
        return;
      }

      // Clear previous widget
      container.innerHTML = "";

      console.log(
        "Initializing carousel preview with shareIds:",
        carouselShareIds,
        "apiUrl:",
        serverAddr
      );

      // @ts-ignore
      if (window.CenphiShareWidget) {
        console.log("CenphiShareWidget loaded, initializing carousel...");
        // @ts-ignore
        window.CenphiShareWidget.init({
          container: `#${containerId}`,
          mode: "carousel",
          shareIds: carouselShareIds,
          apiUrl: serverAddr.replace(/\/api$/, ""), // Remove /api suffix since widget routes are at root
          embedStyle: selectedWidgetStyle,
          carouselStyle: selectedCarouselStyle,
          theme: "light",
          showBranding: true,
          enableAnimations: true,
          carouselAutoplay: true,
          carouselInterval: 6000,
          showRating: true,
          showAvatar: true,
          disableTracking: true, // Disable analytics tracking for preview
        });
      } else {
        // Load script if not already loaded
        // Note: serverAddr already includes /api, so we need to go up one level
        const baseUrl = serverAddr.replace(/\/api$/, "");
        // Add cache-busting version parameter to ensure fresh script
        const scriptSrc = `${baseUrl}/share-widget.js?v=${Date.now()}`;
        const existingScript = document.querySelector(
          'script[src^="' + baseUrl + '/share-widget.js"]'
        );
        if (!existingScript) {
          console.log("Loading widget script from:", scriptSrc);
          const script = document.createElement("script");
          script.src = scriptSrc;
          script.onload = () => {
            console.log("Widget script loaded successfully");
            loadAndInitCarousel();
          };
          script.onerror = (error) => {
            console.error("Failed to load widget script:", error);
            container.innerHTML =
              '<div style="padding: 20px; text-align: center; color: #dc2626;">Failed to load widget script. Check console for details.</div>';
          };
          document.head.appendChild(script);
        } else {
          // Script already exists, just init if CenphiShareWidget becomes available
          console.log(
            "Widget script already loaded for carousel, waiting for initialization..."
          );
          const checkWidget = setInterval(() => {
            // @ts-ignore
            if (window.CenphiShareWidget) {
              clearInterval(checkWidget);
              loadAndInitCarousel();
            }
          }, 100);
          // Timeout after 5 seconds
          setTimeout(() => clearInterval(checkWidget), 5000);
        }
      }
    };

    // Small delay to ensure DOM is ready
    const timer = setTimeout(loadAndInitCarousel, 100);
    return () => clearTimeout(timer);
  }, [
    carouselShareIds,
    selectedWidgetStyle,
    selectedCarouselStyle,
    isOpen,
    artifact.id,
    serverAddr,
    isCarouselMode,
  ]);

  const hasShare = !!shareLink;
  const hasAIPosts = Object.keys(aiPosts).length > 0;
  const hasCarousel = carouselShareIds.length > 0;

  const availableArtifacts = aiArtifactsManager.artifacts.filter(
    (a) =>
      a.processing_type !== "sentiment_analysis" &&
      a.processing_type !== "highlight_extraction" &&
      a.processing_type !== "clipping" &&
      a.processing_type !== "enhancement" &&
      a.processing_type !== "viral_analysis" &&
      a.processing_type !== "translation" &&
      a.processing_type !== "narration" &&
      a.processing_type !== "text_polishing"
  );

  const tabs: Array<{ id: TabType; label: string; icon: any; badge?: string }> =
    [
      { id: "link", label: "Share Link", icon: Link2 },
      {
        id: "social",
        label: "AI Posts",
        icon: Sparkles,
        badge: hasAIPosts ? "Ready" : undefined,
      },
      { id: "linkedin", label: "LinkedIn", icon: Linkedin },
      ...(artifact.content_type?.startsWith("video/")
        ? [{ id: "gif" as TabType, label: "GIF Export", icon: Image }]
        : []),
    ];

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-[680px] p-0 overflow-hidden flex flex-col bg-gradient-to-br from-slate-50 via-white to-blue-50/30"
      >
        {/* Premium Header */}
        <div className="relative border-b border-slate-200/50 bg-white/80 backdrop-blur-xl">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5" />
          <SheetHeader className="relative p-6 pb-5">
            <div className="flex items-start gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl blur-xl" />
                <div className="relative h-11 w-11 rounded-xl bg-gradient-to-br from-slate-900 to-slate-700 flex items-center justify-center shadow-lg">
                  <Share2 className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <SheetTitle className="text-base font-semibold text-slate-900 mb-1">
                  Share Content
                </SheetTitle>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Distribute your AI-generated content across platforms
                </p>
              </div>
            </div>

            {/* Artifact Preview Badge */}
            <div className="mt-4 flex items-center gap-2">
              <Badge
                variant="outline"
                className="text-[10px] px-2 py-0.5 bg-white/50 border-slate-200/50"
              >
                {artifact.category.label}
              </Badge>
              {artifact.platformTarget && (
                <Badge className="text-[10px] px-2 py-0.5 bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 border-blue-200/50">
                  {artifact.platformTarget.name}
                </Badge>
              )}
            </div>
          </SheetHeader>

          {/* Tab Navigation */}
          <div className="px-6 pb-4">
            <div className="flex gap-2">
              {tabs.map((tab) => {
                const TabIcon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "flex-1 group relative px-3 py-2.5 rounded-lg transition-all duration-200",
                      isActive
                        ? "bg-slate-900 shadow-lg shadow-slate-900/20"
                        : "bg-white/50 hover:bg-white hover:shadow-sm border border-slate-200/50"
                    )}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <TabIcon
                        className={cn(
                          "h-3.5 w-3.5 transition-colors",
                          isActive
                            ? "text-white"
                            : "text-slate-600 group-hover:text-slate-900"
                        )}
                      />
                      <span
                        className={cn(
                          "text-[11px] font-medium transition-colors",
                          isActive
                            ? "text-white"
                            : "text-slate-700 group-hover:text-slate-900"
                        )}
                      >
                        {tab.label}
                      </span>
                      {tab.badge && (
                        <Badge className="ml-1 h-4 px-1.5 text-[8px] bg-emerald-500 text-white border-0">
                          {tab.badge}
                        </Badge>
                      )}
                    </div>
                    {isActive && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute inset-0 bg-slate-900 rounded-lg -z-10"
                        transition={{
                          type: "spring",
                          bounce: 0.2,
                          duration: 0.6,
                        }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <AnimatePresence mode="wait">
            {/* Share Link Tab */}
            {activeTab === "link" && (
              <motion.div
                key="link"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-5"
              >
                {/* Carousel Mode Toggle */}
                <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200/50 bg-white/50">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
                      <Layers className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold text-slate-900">
                        Carousel Mode
                      </p>
                      <p className="text-[9px] text-slate-500">
                        Share multiple items in a carousel
                      </p>
                    </div>
                  </div>
                  <Checkbox
                    checked={isCarouselMode}
                    onCheckedChange={(checked) =>
                      setIsCarouselMode(checked as boolean)
                    }
                    className="h-5 w-5"
                  />
                </div>

                {isCarouselMode ? (
                  // Carousel Mode UI
                  <div className="space-y-5">
                    {/* Item Selection */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-[11px] font-semibold text-slate-900">
                          Select Items ({selectedArtifacts.length} selected)
                        </Label>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedArtifacts([artifact.id])}
                          className="h-6 px-2 text-[9px]"
                        >
                          Clear All
                        </Button>
                      </div>

                      <div className="max-h-[200px] overflow-y-auto space-y-2 p-3 rounded-lg border border-slate-200/50 bg-white/30">
                        {availableArtifacts.slice(0, 10).map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/50 transition-colors"
                          >
                            <Checkbox
                              checked={selectedArtifacts.includes(item.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedArtifacts([
                                    ...selectedArtifacts,
                                    item.id,
                                  ]);
                                } else {
                                  setSelectedArtifacts(
                                    selectedArtifacts.filter(
                                      (id) => id !== item.id
                                    )
                                  );
                                }
                              }}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] font-medium text-slate-900 truncate">
                                {item.processing_type
                                  .replace(/_/g, " ")
                                  .replace(/\b\w/g, (l) => l.toUpperCase())}
                              </p>
                              <p className="text-[9px] text-slate-500 truncate">
                                {new Date(item.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Carousel Style Selector */}
                    <div className="space-y-3">
                      <Label className="text-[11px] font-semibold text-slate-900">
                        Carousel Style
                      </Label>
                      <div className="grid grid-cols-2 gap-2">
                        {carouselStyles.map((style) => (
                          <button
                            key={style.id}
                            onClick={() => setSelectedCarouselStyle(style.id)}
                            className={cn(
                              "p-3 rounded-lg border transition-all text-left",
                              selectedCarouselStyle === style.id
                                ? "border-blue-500 bg-blue-50 shadow-sm"
                                : "border-slate-200/50 bg-white/50 hover:bg-white hover:border-slate-300"
                            )}
                          >
                            <p className="text-[10px] font-semibold text-slate-900 mb-0.5">
                              {style.name}
                            </p>
                            <p className="text-[9px] text-slate-500">
                              {style.description}
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Widget Style */}
                    <div className="space-y-3">
                      <Label className="text-[11px] font-semibold text-slate-900">
                        Widget Style
                      </Label>
                      <div className="grid grid-cols-2 gap-2">
                        {widgetStyles.map((style) => {
                          const StyleIcon = style.icon;
                          return (
                            <button
                              key={style.id}
                              onClick={() => setSelectedWidgetStyle(style.id)}
                              className={cn(
                                "p-3 rounded-lg border transition-all text-left",
                                selectedWidgetStyle === style.id
                                  ? "border-blue-500 bg-blue-50 shadow-sm"
                                  : "border-slate-200/50 bg-white/50 hover:bg-white hover:border-slate-300"
                              )}
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <StyleIcon className="h-3 w-3 text-slate-600" />
                                <p className="text-[10px] font-semibold text-slate-900">
                                  {style.name}
                                </p>
                              </div>
                              <p className="text-[9px] text-slate-500">
                                {style.description}
                              </p>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {!hasCarousel ? (
                      <Button
                        onClick={createCarouselShares}
                        disabled={
                          isCreatingShare || selectedArtifacts.length < 2
                        }
                        className="w-full h-10 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg text-[11px] font-medium"
                      >
                        {isCreatingShare ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                            Creating Carousel...
                          </>
                        ) : (
                          <>
                            <Zap className="h-3.5 w-3.5 mr-2" />
                            Create Carousel Embed ({
                              selectedArtifacts.length
                            }{" "}
                            items)
                          </>
                        )}
                      </Button>
                    ) : (
                      <div className="space-y-3">
                        {/* Update Carousel Button */}
                        {selectedArtifacts.length !==
                          carouselShareIds.length && (
                          <div className="p-3 rounded-lg border border-orange-200/50 bg-orange-50/30">
                            <div className="flex items-start gap-3">
                              <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-[10px] font-semibold text-orange-900 mb-1">
                                  Selection Changed
                                </p>
                                <p className="text-[9px] text-orange-700 mb-2">
                                  You've changed your selection. Regenerate the
                                  carousel to see the updated preview.
                                </p>
                                <Button
                                  onClick={createCarouselShares}
                                  disabled={
                                    isCreatingShare ||
                                    selectedArtifacts.length < 2
                                  }
                                  size="sm"
                                  className="h-8 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white shadow-sm text-[10px] font-medium"
                                >
                                  {isCreatingShare ? (
                                    <>
                                      <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                                      Updating...
                                    </>
                                  ) : (
                                    <>
                                      <Zap className="h-3 w-3 mr-1.5" />
                                      Update Carousel (
                                      {selectedArtifacts.length} items)
                                    </>
                                  )}
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Carousel Preview */}
                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Eye className="h-3.5 w-3.5 text-slate-600" />
                              <span className="text-[11px] font-semibold text-slate-900">
                                Live Carousel Preview
                              </span>
                              <Badge className="bg-purple-100 text-purple-700 text-[8px] h-4 px-1.5 border-0">
                                No Tracking
                              </Badge>
                            </div>
                            <Badge className="bg-emerald-500 text-white text-[9px] h-4 px-2 border-0">
                              {carouselShareIds.length} Items
                            </Badge>
                          </div>
                          <div className="rounded-lg border border-slate-200/50 bg-gradient-to-br from-slate-50 to-white p-6">
                            <div
                              id={`cenphi-carousel-preview-${artifact.id}`}
                              className="mx-auto"
                            />
                          </div>
                          <p className="text-[9px] text-slate-500 text-center">
                            This is how your carousel will appear when embedded.
                            Analytics tracking is disabled for preview.
                          </p>
                        </div>

                        {/* Carousel Embed Code */}
                        <div className="space-y-2.5">
                          <div className="flex items-center gap-2">
                            <Code2 className="h-3.5 w-3.5 text-slate-600" />
                            <span className="text-[11px] font-semibold text-slate-900">
                              Carousel Embed Code
                            </span>
                          </div>
                          <div className="relative">
                            <Textarea
                              value={carouselEmbedCode}
                              readOnly
                              className="font-mono text-[9px] bg-slate-50 border-slate-200/50 min-h-[110px] resize-none pr-12"
                            />
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                copyToClipboard(carouselEmbedCode, "carousel")
                              }
                              className="absolute top-2 right-2 h-7 w-7 p-0 hover:bg-white"
                            >
                              {copiedItem === "carousel" ? (
                                <Check className="h-3 w-3 text-emerald-600" />
                              ) : (
                                <Copy className="h-3 w-3 text-slate-600" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  // Single Item Mode UI
                  <div className="space-y-5">
                    {!hasShare ? (
                      <div className="space-y-5">
                        <div className="relative overflow-hidden rounded-xl border border-slate-200/50 bg-gradient-to-br from-white via-slate-50 to-blue-50/30 p-6">
                          <div className="absolute top-0 right-0 -mt-10 -mr-10 h-40 w-40 rounded-full bg-gradient-to-br from-blue-500/10 to-purple-500/10 blur-3xl" />
                          <div className="relative text-center">
                            <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-slate-100 to-slate-50 border border-slate-200/50 shadow-sm mb-3">
                              <Globe className="h-5 w-5 text-slate-700" />
                            </div>
                            <h3 className="text-sm font-semibold text-slate-900 mb-1.5">
                              Create Public Share Link
                            </h3>
                            <p className="text-[11px] text-slate-600 leading-relaxed max-w-sm mx-auto">
                              Generate a shareable link and embed code to
                              distribute your content
                            </p>
                          </div>
                        </div>

                        <div className="space-y-2.5">
                          <Label className="text-[11px] font-medium text-slate-700">
                            Description (Optional)
                          </Label>
                          <Textarea
                            value={shareDescription}
                            onChange={(e) =>
                              setShareDescription(e.target.value)
                            }
                            placeholder="Add a description that will appear on the public page..."
                            className="min-h-[90px] text-[11px] resize-none border-slate-200/50"
                            maxLength={500}
                          />
                        </div>

                        <Button
                          onClick={createSingleShare}
                          disabled={isCreatingShare}
                          className="w-full h-10 bg-gradient-to-r from-slate-900 to-slate-700 hover:from-slate-800 hover:to-slate-600 text-white shadow-lg text-[11px] font-medium"
                        >
                          {isCreatingShare ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                              Creating...
                            </>
                          ) : (
                            <>
                              <Zap className="h-3.5 w-3.5 mr-2" />
                              Create Share Link
                            </>
                          )}
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-5">
                        {/* Public Link */}
                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Link2 className="h-3.5 w-3.5 text-slate-600" />
                              <span className="text-[11px] font-semibold text-slate-900">
                                Public Share Link
                              </span>
                            </div>
                            <Badge className="bg-emerald-500 text-white text-[9px] h-4 px-2 border-0">
                              Active
                            </Badge>
                          </div>
                          <div className="flex gap-2">
                            <Input
                              value={shareLink}
                              readOnly
                              className="flex-1 font-mono text-[10px] bg-white border-slate-200/50 h-9"
                            />
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => copyToClipboard(shareLink, "link")}
                              className="h-9 w-9 p-0"
                            >
                              {copiedItem === "link" ? (
                                <Check className="h-3.5 w-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="h-3.5 w-3.5" />
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(shareLink, "_blank")}
                              className="h-9 w-9 p-0"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>

                        {/* Quick Share */}
                        <div className="space-y-2.5">
                          <span className="text-[11px] font-semibold text-slate-900">
                            Quick Share to Social
                          </span>
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
                            ].map(({ icon: Icon, name, platform }) => (
                              <button
                                key={name}
                                onClick={() => {
                                  if (platform === "instagram") {
                                    copyToClipboard(shareLink, "social");
                                  } else {
                                    window.open(
                                      `https://${platform}.com`,
                                      "_blank"
                                    );
                                  }
                                }}
                                className="h-16 flex flex-col items-center justify-center gap-1.5 rounded-lg border border-slate-200/50 bg-white hover:bg-slate-50 transition-all"
                              >
                                <Icon className="h-4 w-4 text-slate-600" />
                                <span className="text-[9px] text-slate-600 font-medium">
                                  {name}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Widget Style Selector */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Label className="text-[11px] font-semibold text-slate-900">
                              Widget Style
                            </Label>
                            <div className="flex items-center gap-2">
                              <Label className="text-[9px] text-slate-600">
                                Compact
                              </Label>
                              <Checkbox
                                checked={compactMode}
                                onCheckedChange={(checked) =>
                                  setCompactMode(checked as boolean)
                                }
                                className="h-4 w-4"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            {widgetStyles.map((style) => {
                              const StyleIcon = style.icon;
                              return (
                                <button
                                  key={style.id}
                                  onClick={() =>
                                    setSelectedWidgetStyle(style.id)
                                  }
                                  className={cn(
                                    "p-3 rounded-lg border transition-all text-left",
                                    selectedWidgetStyle === style.id
                                      ? "border-blue-500 bg-blue-50 shadow-sm"
                                      : "border-slate-200/50 bg-white/50 hover:bg-white hover:border-slate-300"
                                  )}
                                >
                                  <div className="flex items-center gap-2 mb-1">
                                    <StyleIcon className="h-3 w-3 text-slate-600" />
                                    <p className="text-[10px] font-semibold text-slate-900">
                                      {style.name}
                                    </p>
                                  </div>
                                  <p className="text-[9px] text-slate-500 leading-relaxed">
                                    {style.description}
                                  </p>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Widget Preview */}
                        {shareLink && (
                          <div className="space-y-2.5">
                            <div className="flex items-center gap-2">
                              <Eye className="h-3.5 w-3.5 text-slate-600" />
                              <span className="text-[11px] font-semibold text-slate-900">
                                Live Preview
                              </span>
                            </div>
                            <div className="rounded-lg border border-slate-200/50 bg-gradient-to-br from-slate-50 to-white p-6">
                              <div
                                id={`cenphi-preview-${artifact.id}`}
                                className="mx-auto"
                              />
                            </div>
                            <p className="text-[9px] text-slate-500 text-center">
                              This is how your widget will appear when embedded.
                              Analytics tracking is disabled for preview.
                            </p>
                          </div>
                        )}

                        {/* Embed Code */}
                        {widgetCode && (
                          <div className="space-y-2.5">
                            <div className="flex items-center gap-2">
                              <Code2 className="h-3.5 w-3.5 text-slate-600" />
                              <span className="text-[11px] font-semibold text-slate-900">
                                Embed Widget Code
                              </span>
                            </div>
                            <div className="relative">
                              <Textarea
                                value={widgetCode}
                                readOnly
                                className="font-mono text-[9px] bg-slate-50 border-slate-200/50 min-h-[110px] resize-none pr-12"
                              />
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() =>
                                  copyToClipboard(widgetCode, "widget")
                                }
                                className="absolute top-2 right-2 h-7 w-7 p-0 hover:bg-white"
                              >
                                {copiedItem === "widget" ? (
                                  <Check className="h-3 w-3 text-emerald-600" />
                                ) : (
                                  <Copy className="h-3 w-3 text-slate-600" />
                                )}
                              </Button>
                            </div>
                            <p className="text-[9px] text-slate-500">
                              Paste this code on your website to embed the
                              widget
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}

            {/* AI Social Posts Tab */}
            {activeTab === "social" && (
              <motion.div
                key="social"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-5"
              >
                {!hasAIPosts ? (
                  <div className="relative overflow-hidden rounded-xl border border-slate-200/50 bg-gradient-to-br from-white via-purple-50/30 to-blue-50/30 p-8">
                    <div className="absolute top-0 right-0 -mt-10 -mr-10 h-40 w-40 rounded-full bg-gradient-to-br from-purple-500/10 to-blue-500/10 blur-3xl" />
                    <div className="relative text-center">
                      <div className="inline-flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-purple-100 to-blue-100 border border-purple-200/50 shadow-sm mb-4">
                        <Sparkles className="h-6 w-6 text-purple-600" />
                      </div>
                      <h3 className="text-sm font-semibold text-slate-900 mb-1.5">
                        AI-Optimized Social Posts
                      </h3>
                      <p className="text-[11px] text-slate-600 leading-relaxed max-w-sm mx-auto mb-5">
                        Generate platform-specific posts optimized for
                        engagement
                      </p>
                      <Button
                        onClick={generateAIPosts}
                        disabled={isGeneratingPosts}
                        className="h-10 px-5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg text-[11px] font-medium"
                      >
                        {isGeneratingPosts ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-3.5 w-3.5 mr-2" />
                            Generate AI Posts
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Select
                        value={selectedPlatform}
                        onValueChange={setSelectedPlatform}
                      >
                        <SelectTrigger className="h-8 text-[11px] w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="linkedin" className="text-[11px]">
                            LinkedIn
                          </SelectItem>
                          <SelectItem value="twitter" className="text-[11px]">
                            Twitter
                          </SelectItem>
                          <SelectItem value="facebook" className="text-[11px]">
                            Facebook
                          </SelectItem>
                          <SelectItem value="instagram" className="text-[11px]">
                            Instagram
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        onClick={generateAIPosts}
                        disabled={isGeneratingPosts}
                        variant="ghost"
                        size="sm"
                        className="h-8 text-[10px]"
                      >
                        <Sparkles className="h-3 w-3 mr-1.5" />
                        Regenerate
                      </Button>
                    </div>

                    {Object.entries(aiPosts)
                      .filter(([platform]) => platform === selectedPlatform)
                      .map(([platform, post]) => (
                        <div
                          key={platform}
                          className="rounded-xl border border-slate-200/50 bg-white shadow-sm"
                        >
                          <div className="p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2.5">
                                <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-slate-100 to-slate-50 border border-slate-200/50 flex items-center justify-center">
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
                                <span className="text-[11px] font-semibold capitalize text-slate-900">
                                  {platform}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="h-1 w-20 bg-slate-100 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-gradient-to-r from-emerald-500 to-green-500"
                                    style={{
                                      width: `${post.engagement_score * 100}%`,
                                    }}
                                  />
                                </div>
                                <span className="text-[9px] text-slate-600 font-semibold">
                                  {Math.round(post.engagement_score * 100)}%
                                </span>
                              </div>
                            </div>

                            <div className="p-3.5 bg-gradient-to-br from-slate-50 to-white rounded-lg border border-slate-100">
                              <p className="text-[11px] text-slate-700 leading-relaxed whitespace-pre-wrap">
                                {post.content}
                              </p>
                              {post.hashtags.length > 0 && (
                                <p className="text-[11px] text-blue-600 mt-2.5">
                                  {post.hashtags.join(" ")}
                                </p>
                              )}
                            </div>

                            <div className="flex items-center justify-between pt-2.5 border-t border-slate-100">
                              <div className="text-[9px] text-slate-500 font-medium">
                                {post.char_count} chars · {post.tone}
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    copyToClipboard(
                                      `${post.content}\n\n${post.hashtags.join(" ")}`,
                                      platform
                                    )
                                  }
                                  className="h-7 px-2.5 text-[10px]"
                                >
                                  {copiedItem === platform ? (
                                    <>
                                      <Check className="h-3 w-3 mr-1 text-emerald-600" />
                                      Copied
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="h-3 w-3 mr-1" />
                                      Copy
                                    </>
                                  )}
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => shareToSocial(platform, post)}
                                  className="h-7 px-3 text-[10px] bg-slate-900"
                                >
                                  Share
                                  <ChevronRight className="h-3 w-3 ml-1" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* LinkedIn Tab */}
            {activeTab === "linkedin" && (
              <motion.div
                key="linkedin"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-5"
              >
                {/* LinkedIn Account Section */}
                <div className="space-y-3">
                  <Label className="text-[11px] font-semibold text-slate-900">
                    LinkedIn Account
                  </Label>
                  {isLoadingAccounts ? (
                    <div className="flex items-center gap-2 p-3 border border-slate-200/50 rounded-lg bg-white/50">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-[11px] text-slate-600">
                        Loading accounts...
                      </span>
                    </div>
                  ) : linkedInAccounts.length === 0 ? (
                    <Card className="border border-blue-200/50 bg-gradient-to-br from-blue-50/30 to-white">
                      <CardContent className="p-5 text-center">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center mx-auto mb-3">
                          <Linkedin className="h-5 w-5 text-blue-600" />
                        </div>
                        <h4 className="text-[11px] font-semibold text-slate-900 mb-1">
                          Connect Your LinkedIn Account
                        </h4>
                        <p className="text-[10px] text-slate-600 mb-4">
                          Share directly to LinkedIn with scheduling & analytics
                        </p>
                        <Button
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700 text-white h-8 text-[10px]"
                          onClick={handleConnectLinkedIn}
                          disabled={isLoadingAccounts}
                        >
                          {isLoadingAccounts ? (
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          ) : (
                            <Linkedin className="h-3 w-3 mr-1" />
                          )}
                          Connect LinkedIn
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-2">
                      {linkedInAccounts.map((account) => (
                        <div
                          key={account.id}
                          className={cn(
                            "p-3 border rounded-lg cursor-pointer transition-all",
                            selectedAccount === account.id
                              ? "border-blue-500 bg-blue-50"
                              : "border-slate-200/50 bg-white/50 hover:bg-white"
                          )}
                          onClick={() => setSelectedAccount(account.id)}
                        >
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={account.profile_image_url} />
                              <AvatarFallback className="bg-blue-100 text-blue-700 text-[10px]">
                                {account.account_name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-[11px] font-semibold text-slate-900 truncate">
                                {account.account_name}
                              </p>
                              <p className="text-[9px] text-slate-500 truncate">
                                @{account.platform_username}
                              </p>
                            </div>
                            <Badge
                              className={cn(
                                "text-[8px] h-4 px-2",
                                account.status === "connected"
                                  ? "bg-emerald-500 text-white"
                                  : "bg-red-500 text-white"
                              )}
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
                    {artifact.asset_url && (
                      <div className="rounded-lg border border-slate-200/50 overflow-hidden bg-white/50">
                        <video
                          src={artifact.asset_url}
                          className="w-full h-32 object-cover bg-slate-900"
                          muted
                        />
                      </div>
                    )}

                    {/* Share Timing */}
                    <div className="space-y-3">
                      <Label className="text-[11px] font-semibold text-slate-900">
                        When to Share
                      </Label>
                      <div className="space-y-2">
                        {/* Share Now */}
                        <button
                          onClick={() => setShareMode("now")}
                          className={cn(
                            "w-full p-3 rounded-lg border transition-all text-left",
                            shareMode === "now"
                              ? "border-blue-500 bg-blue-50 shadow-sm"
                              : "border-slate-200/50 bg-white/50 hover:bg-white"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                              <Send className="h-4 w-4 text-green-600" />
                            </div>
                            <div>
                              <p className="text-[11px] font-semibold text-slate-900">
                                Share Now
                              </p>
                              <p className="text-[9px] text-slate-500">
                                Post immediately to LinkedIn
                              </p>
                            </div>
                          </div>
                        </button>

                        {/* Schedule */}
                        <button
                          onClick={() => setShareMode("schedule")}
                          className={cn(
                            "w-full p-3 rounded-lg border transition-all text-left",
                            shareMode === "schedule"
                              ? "border-blue-500 bg-blue-50 shadow-sm"
                              : "border-slate-200/50 bg-white/50 hover:bg-white"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                              <Calendar className="h-4 w-4 text-orange-600" />
                            </div>
                            <div className="flex-1">
                              <p className="text-[11px] font-semibold text-slate-900">
                                Schedule for Later
                              </p>
                              <p className="text-[9px] text-slate-500">
                                Choose specific date and time
                              </p>
                            </div>
                          </div>
                          {shareMode === "schedule" && (
                            <div className="mt-3 pt-3 border-t border-slate-200 grid grid-cols-2 gap-2">
                              <Input
                                type="date"
                                value={scheduledDate}
                                onChange={(e) =>
                                  setScheduledDate(e.target.value)
                                }
                                min={new Date().toISOString().split("T")[0]}
                                className="h-8 text-[10px]"
                              />
                              <Input
                                type="time"
                                value={scheduledTime}
                                onChange={(e) =>
                                  setScheduledTime(e.target.value)
                                }
                                className="h-8 text-[10px]"
                              />
                            </div>
                          )}
                        </button>

                        {/* AI Best Time */}
                        <button
                          onClick={() => setShareMode("ai-best")}
                          className={cn(
                            "w-full p-3 rounded-lg border transition-all text-left",
                            shareMode === "ai-best"
                              ? "border-blue-500 bg-blue-50 shadow-sm"
                              : "border-slate-200/50 bg-white/50 hover:bg-white"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                              <Sparkles className="h-4 w-4 text-purple-600" />
                            </div>
                            <div className="flex-1">
                              <p className="text-[11px] font-semibold text-slate-900">
                                AI Best Time
                              </p>
                              <p className="text-[9px] text-slate-500">
                                Let AI choose optimal posting time
                              </p>
                            </div>
                            {isLoadingAI && shareMode === "ai-best" && (
                              <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
                            )}
                          </div>
                          {shareMode === "ai-best" && aiSuggestion && (
                            <div className="mt-3 pt-3 border-t border-slate-200">
                              <div className="flex items-center gap-2 mb-1">
                                <TrendingUp className="h-3 w-3 text-purple-600" />
                                <span className="text-[10px] font-semibold text-purple-900">
                                  {new Date(
                                    aiSuggestion.suggested_time
                                  ).toLocaleString()}
                                </span>
                                <Badge className="text-[8px] bg-purple-100 text-purple-700">
                                  {Math.round(
                                    aiSuggestion.confidence_score * 100
                                  )}
                                  %
                                </Badge>
                              </div>
                              <p className="text-[9px] text-slate-600">
                                {aiSuggestion.reasoning}
                              </p>
                            </div>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Message */}
                    <div className="space-y-2">
                      <Label className="text-[11px] font-semibold text-slate-900">
                        Message
                      </Label>
                      <Textarea
                        value={linkedInMessage}
                        onChange={(e) => setLinkedInMessage(e.target.value)}
                        placeholder="Write your LinkedIn post..."
                        className="min-h-[100px] text-[11px]"
                        maxLength={3000}
                      />
                      <div className="flex justify-between text-[9px] text-slate-500">
                        <span>Add hashtags and mentions for better reach</span>
                        <span>{linkedInMessage.length}/3000</span>
                      </div>
                    </div>

                    {/* Success/Error Messages */}
                    <AnimatePresence>
                      {shareStatus === "success" && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2"
                        >
                          <CheckCircle className="h-4 w-4 text-emerald-600" />
                          <p className="text-[10px] text-emerald-700 font-medium">
                            Successfully shared to LinkedIn!
                          </p>
                        </motion.div>
                      )}
                      {shareStatus === "scheduled" && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2"
                        >
                          <Clock className="h-4 w-4 text-blue-600" />
                          <p className="text-[10px] text-blue-700 font-medium">
                            Post scheduled successfully!
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Share Button */}
                    <Button
                      onClick={handleLinkedInShare}
                      disabled={
                        isSharing ||
                        !selectedAccount ||
                        !linkedInMessage.trim() ||
                        (shareMode === "schedule" &&
                          (!scheduledDate || !scheduledTime))
                      }
                      className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white shadow-lg text-[11px] font-medium"
                    >
                      {isSharing ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                          Sharing...
                        </>
                      ) : shareMode === "now" ? (
                        <>
                          <Send className="h-3.5 w-3.5 mr-2" />
                          Share Now
                        </>
                      ) : (
                        <>
                          <Calendar className="h-3.5 w-3.5 mr-2" />
                          Schedule Post
                        </>
                      )}
                    </Button>
                  </>
                )}
              </motion.div>
            )}

            {/* GIF Export Tab */}
            {activeTab === "gif" && (
              <ExportGif setError={setError} artifact={artifact} />
            )}
          </AnimatePresence>

          {/* Error Display */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2.5"
              >
                <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
                <p className="text-[10px] text-red-700 leading-relaxed">
                  {error}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ShareDrawer;
