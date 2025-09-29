// components/TestimonialDetail/index.tsx - Final Ultra-Premium Version
import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { observer } from "mobx-react-lite";
import {
  ArrowLeft,
  Star,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Download,
  Share2,
  MessageSquare,
  Sparkles,
  Brain,
  Maximize,
  EyeOff,
  BarChart3,
  Lightbulb,
} from "lucide-react";
import AIFeaturesDiscovery from "./AIFeaturesDiscovery";
import MainTabs from "./MainTabs";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { workspaceHub } from "@/repo/workspace_hub";

// Import enhanced components
import PlatformOptimization from "./PlatformOptimization";
import TranslationTab from "./TranslationTab";
import HighlightsTab from "./HighlightsTab";
import AuthorStats from "./AuthorStats";
import {
  renderClippingArtifacts,
  renderStoryVideoArtifacts,
  renderEnhancementArtifacts,
  renderNarrationArtifacts,
  renderTextPolishingArtifacts,
  renderContentGenerationArtifacts,
  renderViralAnalysisArtifacts,
} from "./TabRenderers";
import { TestimonialNotFound } from "@/utils/ErrorState";
import { cn } from "@/lib/utils";
import EditableTextTestimonial from "./EditableTextTestimonial";
import FeatureHint from "./FeatureHint";
import VideoPreviewModal from "./VideoPreviewModal";
import ProcessingLineageModal from "./ServiceLineageModal";
import { aiStudioManager } from "@/repo/managers/ai_studio_manager";
import { ServiceType, Segment } from "@/types/ai-service";
import { preset_manager } from "@/repo/managers/preset_manager";
import { AI_SERVICES } from "../ai-studio/definitions";
import ContextualContentFilter from "../smart-navigation/ContextualContentFilter";
import SmartNavigationBanner from "../smart-navigation/SmartNavigationBanner";
import { HighlightType } from "@/utils/highlights";
import { shouldShowInContext } from "@/utils/ContentRouter";
import { TestimonialArtifact } from "@/types/testimonial";

// Enhanced types for specific artifact data structures
interface SentimentData {
  label: string;
  emotions: string[];
  sentiment_score: number;
  business_recommendations: Array<{
    action: string;
    category: string;
    priority: "high" | "medium" | "low";
    reasoning: string;
  }>;
}

interface TranslationData {
  original_text: string;
  translated_text: string;
  source_language: string;
  target_language: string;
  confidence_score: number;
  word_count: number;
  created_at: string;
  translation_method: string;
}

const getCompletedFeaturesCount = (
  artifacts: any[],
  testimonialType: "video" | "text"
) => {
  const videoFeatures = [
    "clipping",
    "story_mode",
    "enhancement",
    "platform_optimizer",
  ];
  const textFeatures = ["text_polishing", "narration", "content_generation"];
  const relevantFeatures =
    testimonialType === "video" ? videoFeatures : textFeatures;

  return relevantFeatures.filter((feature) =>
    artifacts.some(
      (artifact) =>
        artifact.processing_type.includes(feature) ||
        feature.includes(artifact.processing_type.split("_")[0])
    )
  ).length;
};

const getTotalFeaturesCount = (testimonialType: "video" | "text") => {
  return testimonialType === "video" ? 4 : 3; // Number of available features
};

const TestimonialDetail = observer(() => {
  const { testimonialId } = useParams<{ testimonialId: string }>();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("overview");
  const [activeArtifactTab, setActiveArtifactTab] = useState("sentiment");
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(100);
  const [copiedItems, setCopiedItems] = useState<Set<string>>(new Set());
  // const [selectedHighlight, setSelectedHighlight] = useState<any>(null);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showTranscript, setShowTranscript] = useState(true);
  const [editingContent, setEditingContent] = useState<{
    [key: string]: string;
  }>({});
  const [, setIsFullscreen] = useState(false);
  const [selectedClips, setSelectedClips] = useState<string[]>([]);
  const [clipSelectionMode, setClipSelectionMode] = useState(false);
  const [videoPreviewModal, setVideoPreviewModal] = useState<{
    open: boolean;
    videoUrl: string;
    title: string;
    metadata?: any;
  }>({ open: false, videoUrl: "", title: "" });
  const [lineageModal, setLineageModal] = useState<{
    open: boolean;
    sourceContent: any;
  }>({ open: false, sourceContent: null });
  const [showCrossReferences, setShowCrossReferences] = useState(false);
  const [, setFilteredArtifacts] = useState<TestimonialArtifact[]>([]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const fullscreenRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!testimonialId) return;

    (async () => {
      await workspaceHub.testimonialManager.fetchTestimonial(testimonialId);
    })();
  }, [testimonialId]);

  const testimonial = workspaceHub.testimonialManager.testimonial;
  const isLoading = workspaceHub.testimonialManager.isLoading;

  const isVideo = testimonial?.type === "video";

  const handleVideoPreview = (
    videoUrl: string,
    title: string,
    metadata?: any
  ) => {
    setVideoPreviewModal({ open: true, videoUrl, title, metadata });
  };

  const handleViewLineage = (content: any) => {
    setLineageModal({
      open: true,
      sourceContent: {
        id: content.id,
        type: "clip",
        title: content.theme || content.title,
        url: content.url,
        metadata: content.metadata,
      },
    });
  };

  // Video control handlers
  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleSeek = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleVolumeChange = (newVolume: number[]) => {
    const vol = newVolume[0];
    setVolume(vol);
    if (videoRef.current) {
      videoRef.current.volume = vol / 100;
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const toggleFullscreen = async () => {
    if (!fullscreenRef.current) return;

    try {
      if (!document.fullscreenElement) {
        await fullscreenRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (error) {
      console.error("Fullscreen error:", error);
    }
  };

  const downloadVideo = async (url: string, filename: string = "video.mp4") => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedItems((prev) => new Set([...prev, id]));
      setTimeout(() => {
        setCopiedItems((prev) => {
          const newSet = new Set(prev);
          newSet.delete(id);
          return newSet;
        });
      }, 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const startEditing = (contentId: string, currentContent: string) => {
    setEditingContent((prev) => ({ ...prev, [contentId]: currentContent }));
  };

  const saveContent = async (contentId: string, artifactId: string) => {
    // TODO: Implement save content API call
    console.log("artifactId", artifactId);
    console.log("Saving content:", contentId, editingContent[contentId]);
    setEditingContent((prev) => {
      const newState = { ...prev };
      delete newState[contentId];
      return newState;
    });
  };

  const saveTestimonialContent = async (newContent: string) => {
    try {
      // TODO: Implement API call to save testimonial content
      console.log("Saving testimonial content:", newContent);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Update local state (you might want to refetch from API instead)
      if (testimonial) {
        testimonial.content = newContent;
      }

      // You could also trigger a refetch here:
      // await workspaceHub.testimonialManager.fetchTestimonial(testimonialId);
    } catch (error) {
      console.error("Failed to save testimonial content:", error);
      throw error; // Re-throw to show error state in component
    }
  };

  const saveAuthorData = async (authorData: {
    author_name?: string;
    author_title?: string;
    author_company?: string;
    author_avatar_url?: string;
    author_email?: string;
  }) => {
    try {
      // TODO: Implement API call to save author data
      console.log("Saving author data:", authorData);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Update local state (you might want to refetch from API instead)
      if (testimonial) {
        Object.assign(testimonial, authorData);
      }

      // You could also trigger a refetch here:
      // await workspaceHub.testimonialManager.fetchTestimonial(testimonialId);
    } catch (error) {
      console.error("Failed to save author data:", error);
      throw error; // Re-throw to show error state in component
    }
  };

  const cancelEditing = (contentId: string) => {
    setEditingContent((prev) => {
      const newState = { ...prev };
      delete newState[contentId];
      return newState;
    });
  };

  const goToAIStudio = (artifactType: string) => {
    // Navigate to AI Studio with specific artifact type
    navigate(`/ai-studio?type=${artifactType}&testimonialId=${testimonialId}`);
  };

  // Handle generating highlights by type directly in the detail page
  const handleGenerateHighlightsByType = async (type: HighlightType) => {
    if (!testimonial?.id) return;

    try {
      // Use the testimonial's transcript data directly
      const text = testimonial.content || "";
      const segments = testimonial.transcript_segments || [];

      if (text) {
        await aiStudioManager.generateHighlightsByType(
          testimonial.id,
          text,
          segments,
          type
        );

        // Refresh testimonial data to get new highlights
        await workspaceHub.testimonialManager.getTestimonials();
      }
    } catch (error) {
      console.error(`Failed to generate ${type} highlights:`, error);
    }
  };

  // Handle saving highlight order
  const handleSaveHighlightOrder = async (
    type: HighlightType,
    segments: Segment[]
  ) => {
    if (!testimonial?.id) return;

    try {
      // Use real segment IDs for reordering
      console.log("type", type);
      const highlightIds = segments.map((segment) => segment.id);
      await aiStudioManager.saveHighlightOrder(testimonial.id, highlightIds);
    } catch (error) {
      console.error("Failed to save highlight order:", error);
      throw error;
    }
  };

  const handleProcessMultipleClips = async (
    clips: any[],
    serviceType: ServiceType
  ) => {
    // Navigate to AI Studio with multiple clips
    const artifactData = {
      type: "clips" as const,
      data: clips,
      serviceType,
      parentTestimonialId: testimonial?.id,
    };

    console.log("service type", serviceType);

    const config = await preset_manager.getConfig(serviceType);
    const service = AI_SERVICES.find((s) => s.id === serviceType);

    const jobId = await aiStudioManager.startJob(
      serviceType as ServiceType,
      [`clips-${Date.now()}`],
      artifactData,
      config,
      service
    );
    navigate(`/detail/${testimonialId}?jobId=${jobId}`);

    // try {
    //   localStorage.setItem("ai-studio-artifact", JSON.stringify(artifactData));
    //   const url = new URL("/studio", window.location.origin);
    //   url.searchParams.set("service", serviceType);
    //   url.searchParams.set("mode", "artifact");
    //   window.location.href = url.toString();
    // } catch (error) {
    //   console.error("Failed to navigate to AI Studio with clips:", error);
    // }
  };

  const handleClipSelectionChange = (selected: string[]) => {
    setSelectedClips(selected);
  };

  const handleSelectionModeChange = (mode: boolean) => {
    setClipSelectionMode(mode);
    if (!mode) {
      setSelectedClips([]); // Clear selection when exiting selection mode
    }
  };

  const handleFeatureClick = (featureId: string) => {
    // Navigate to specific feature in artifacts tab
    setActiveTab("artifacts");

    // Map feature IDs to artifact tabs
    const featureToTabMap: { [key: string]: string } = {
      clipping: "clipping",
      story_mode: "story",
      enhancement: "enhancement",
      platform_optimizer: "optimization",
      text_polishing: "polishing",
      narration: "narration",
      content_generation: "generation",
    };

    const targetTab = featureToTabMap[featureId];
    if (targetTab) {
      setTimeout(() => {
        setActiveArtifactTab(targetTab);
      }, 100);
    }
  };

  const handleViewAllFeatures = () => {
    setActiveTab("artifacts");
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-50 text-red-700 border-red-200";
      case "medium":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "low":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-slate-200 rounded w-1/4"></div>
            <div className="h-64 bg-slate-200 rounded"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 h-96 bg-slate-200 rounded"></div>
              <div className="h-96 bg-slate-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!testimonial) {
    return <TestimonialNotFound />;
  }

  const isVideoTestimonial = testimonial.type === "video";
  const artifacts = testimonial.artifacts || [];

  // Filter artifacts based on context and user preferences
  const contextualArtifacts = artifacts.filter((artifact) => {
    const shouldShow = shouldShowInContext(artifact, "testimonial-detail");
    if (!shouldShow.show) return false;
    if (shouldShow.isPrimary) return true;
    return showCrossReferences;
  });

  // Parse different artifact types from contextual artifacts
  const sentimentArtifact = contextualArtifacts.find(
    (a) => a.processing_type === "sentiment_analysis"
  );
  const highlightArtifacts = contextualArtifacts.filter(
    (a) => a.processing_type === "highlight_extraction"
  );
  const clippingArtifacts = contextualArtifacts.filter(
    (a) => a.processing_type === "clipping"
  );
  const storyArtifacts = contextualArtifacts.filter(
    (a) => a.processing_type === "story_mode_generation"
  );
  const enhancementArtifacts = contextualArtifacts.filter(
    (a) => a.processing_type === "enhancement"
  );
  const platformVideoArtifacts = contextualArtifacts.filter(
    (a) => a.processing_type === "video_platform_optimization"
  );
  const platformTextArtifacts = contextualArtifacts.filter(
    (a) => a.processing_type === "text_platform_optization"
  );
  const contentGenArtifacts = contextualArtifacts.filter(
    (a) => a.processing_type === "content_generation"
  );
  const polishingArtifacts = contextualArtifacts.filter(
    (a) => a.processing_type === "text_polishing"
  );
  const narrationArtifacts = contextualArtifacts.filter(
    (a) => a.processing_type === "narration"
  );
  const translationArtifacts = contextualArtifacts.filter(
    (a) => a.processing_type === "translation"
  );
  const viralAnalysisArtifacts = contextualArtifacts.filter(
    (a) => a.processing_type === "viral_analysis"
  );

  const sentiment = sentimentArtifact?.data as SentimentData | undefined;

  const getSentimentColor = (label: string) => {
    if (label.includes("positive"))
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (label.includes("negative"))
      return "bg-red-50 text-red-700 border-red-200";
    if (label.includes("neutral"))
      return "bg-slate-50 text-slate-700 border-slate-200";
    return "bg-gray-50 text-gray-700 border-gray-200";
  };

  // Render sentiment analysis
  const renderSentimentAnalysis = () => {
    if (!sentiment) {
      return (
        <Card className="border border-gray-200 bg-white">
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-6">
              <Brain className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-3">
              No Sentiment Analysis
            </h3>
            <p className="text-slate-600 mb-8 max-w-md mx-auto leading-relaxed">
              Generate AI-powered sentiment analysis to understand the emotional
              tone and business impact.
            </p>
            <Button
              onClick={() => goToAIStudio("sentiment_analysis")}
              className="bg-slate-900 hover:bg-slate-800 text-white shadow-lg px-8 py-3"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Generate Sentiment Analysis
            </Button>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-8">
        {/* Overall Sentiment */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="border border-gray-200 bg-white">
            <CardHeader className="pb-6">
              <CardTitle className="flex items-center gap-3 text-lg">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                  <Brain className="h-5 w-5 text-slate-600" />
                </div>
                Overall Sentiment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <div
                  className={`inline-flex items-center px-8 py-4 rounded-2xl text-lg font-semibold border shadow-sm ${getSentimentColor(sentiment.label)}`}
                >
                  {sentiment.label?.replace("_", " ")?.toUpperCase()}
                </div>
                <p className="text-sm text-slate-600 mt-4 font-medium">
                  Confidence: {Math.round(sentiment.sentiment_score * 100)}%
                </p>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold text-slate-900">
                  Detected Emotions
                </h4>
                <div className="flex flex-wrap gap-2">
                  {sentiment.emotions.map((emotion, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="text-sm px-3 py-1 bg-slate-100 text-slate-700 border-0 font-medium capitalize"
                    >
                      {emotion}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-gray-200 bg-white">
            <CardHeader className="pb-6">
              <CardTitle className="flex items-center gap-3 text-lg">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 text-slate-600" />
                </div>
                Sentiment Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-700">
                    Sentiment Strength
                  </span>
                  <span className="text-sm text-slate-600 font-medium">
                    {Math.round(sentiment.sentiment_score * 100)}%
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-4">
                  <div
                    className="bg-gray-600 h-4 rounded-full transition-all duration-500"
                    style={{ width: `${sentiment.sentiment_score * 100}%` }}
                  />
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Higher scores indicate stronger emotional sentiment and more
                  definitive customer opinion
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Business Recommendations */}
        <Card className="border border-gray-200 bg-white">
          <CardHeader className="pb-6">
            <CardTitle className="flex items-center gap-3 text-lg">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                <Lightbulb className="h-5 w-5 text-slate-600" />
              </div>
              Business Recommendations (
              {sentiment.business_recommendations.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {sentiment.business_recommendations.map((rec, index) => (
                <Card
                  key={index}
                  className="border-l-4 border-l-slate-400 shadow-sm bg-white/60"
                >
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <Badge
                        className={`text-xs border font-medium ${getPriorityColor(rec.priority)}`}
                        variant="outline"
                      >
                        {rec.priority?.toUpperCase()}
                      </Badge>
                      <Badge
                        variant="secondary"
                        className="text-xs bg-slate-100 text-slate-700 border-0"
                      >
                        {rec.category}
                      </Badge>
                    </div>

                    <h4 className="font-semibold text-slate-900 mb-3 text-sm leading-relaxed">
                      {rec.action}
                    </h4>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      {rec.reasoning}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // NEW HANDLERS FOR ARTIFACT PROCESSING
  const handleProcessClip = async (clip: any, serviceType: ServiceType) => {
    // Navigate to AI Studio with clip data
    console.log("clip data", clip);
    const artifactData = {
      type: "clip" as const,
      data: clip,

      serviceType,
      parentTestimonialId: testimonial.id,
    };
    console.log("artifactData data", artifactData);

    const config = await preset_manager.getConfig(serviceType);
    const service = AI_SERVICES.find((s) => s.id === serviceType);

    const jobId = await aiStudioManager.startJob(
      serviceType as ServiceType,
      [clip.artifactId],
      artifactData,
      config,
      service
    );
    navigate(`/detail/${testimonialId}?jobId=${jobId}`);

    // try {
    //   localStorage.setItem("ai-studio-artifact", JSON.stringify(artifactData));
    //   const url = new URL("/studio", window.location.origin);
    //   url.searchParams.set("service", serviceType);
    //   url.searchParams.set("mode", "artifact");
    //   window.location.href = url.toString();
    // } catch (error) {
    //   console.error("Failed to navigate to AI Studio with clip:", error);
    // }
  };

  const handleProcessArtifact = async (
    artifact: any,
    serviceType: ServiceType,
    from?: string
  ) => {
    // Navigate to AI Studio with artifact data
    const artifactData = {
      type: "artifact" as const,
      from,
      data: artifact,
      serviceType,
      parentTestimonialId: testimonial.id,
    };

    const config = await preset_manager.getConfig(serviceType);
    const service = AI_SERVICES.find((s) => s.id === serviceType);

    const jobId = await aiStudioManager.startJob(
      serviceType as ServiceType,
      [artifact.id],
      artifactData,
      config,
      service
    );
    navigate(`/detail/${testimonialId}?jobId=${jobId}`);
  };

  // Viral Clip Generation Handler
  const handleViralClipGeneration = async () => {
    if (!testimonial) return;

    try {
      const config = await preset_manager.getConfig("clipping");
      const service = AI_SERVICES.find((s) => s.id === "clipping");

      // Create special viral clipping configuration
      const viralConfig = {
        ...config,
        enable_viral_mode: true, // This will trigger viral analysis in the backend
        viral_optimization: true,
        target_platforms: ["tiktok", "instagram_reels", "youtube_shorts"],
      };

      const jobId = await aiStudioManager.startJob(
        "clipping" as ServiceType,
        [testimonial.id],
        { type: "testimonial" as const, data: testimonial },
        viralConfig as any,
        service
      );

      navigate(`/detail/${testimonialId}?jobId=${jobId}`);
    } catch (error) {
      console.error("Failed to start viral clip generation:", error);
    }
  };

  // Viral Platform Optimization Handler
  const handleViralPlatformOptimization = async (platform: string) => {
    if (!testimonial) return;

    try {
      const config = await preset_manager.getConfig("platform_optimizer");
      const service = AI_SERVICES.find((s) => s.id === "platform_optimizer");

      // Create special viral platform optimization configuration
      const viralConfig = {
        ...config,
        enable_viral_optimization: true, // This will trigger viral analysis in the backend
        target_platform: platform,
        optimization_priority: "viral_engagement",
      };

      const jobId = await aiStudioManager.startJob(
        "platform_optimizer" as ServiceType,
        [testimonial.id],
        { type: "testimonial" as const, data: testimonial },
        viralConfig as any,
        service
      );

      navigate(`/detail/${testimonialId}?jobId=${jobId}`);
    } catch (error) {
      console.error("Failed to start viral platform optimization:", error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/dashboard")}
                className="text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <div>
                <p className="text-sm text-slate-500 font-medium">
                  {testimonial.author_company && (
                    <>{testimonial.author_company} • </>
                  )}
                  {new Date(testimonial.created_at).toDateString()}
                  {testimonial.rating && (
                    <>
                      {" "}
                      • {testimonial.rating}/5{" "}
                      <Star className="h-3 w-3 text-amber-400 inline fill-current" />
                    </>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {sentiment && (
                <Badge
                  className={`border font-medium ${getSentimentColor(sentiment.label)}`}
                  variant="outline"
                >
                  {sentiment?.label?.replace("_", " ")}
                </Badge>
              )}
              <Button
                variant="outline"
                size="sm"
                className="border-slate-200 hover:bg-slate-50"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Smart Navigation Banner */}
        <SmartNavigationBanner
          currentContext="testimonial-detail"
          onNavigate={(target) => {
            if (target === "ai-hub") {
              navigate("/ai-content");
            }
          }}
        />

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-8"
        >
          <MainTabs
            artifactsCount={contextualArtifacts.length}
            completedFeaturesCount={getCompletedFeaturesCount(
              contextualArtifacts,
              testimonial.type as "video" | "text"
            )}
            totalFeaturesCount={getTotalFeaturesCount(
              testimonial.type as "video" | "text"
            )}
            hasNewFeatures={contextualArtifacts.length === 0} // Show "New" badge if no artifacts yet
          />

          <TabsContent value="overview" className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-3 space-y-8">
                {/* Video Player / Content Display */}
                <Card className="border border-gray-200 bg-white">
                  <CardContent className="p-0">
                    {isVideoTestimonial && testimonial.media_url ? (
                      <div className="space-y-6">
                        <div
                          ref={fullscreenRef}
                          className="aspect-video bg-black rounded-t-2xl overflow-hidden relative"
                        >
                          <video
                            ref={videoRef}
                            src={testimonial.media_url}
                            className="w-full h-full object-cover"
                            onTimeUpdate={(e) =>
                              setCurrentTime(e.currentTarget.currentTime)
                            }
                            onLoadedMetadata={(e) =>
                              setDuration(e.currentTarget.duration)
                            }
                            onPlay={() => setIsPlaying(true)}
                            onPause={() => setIsPlaying(false)}
                          />
                        </div>

                        {/* Custom Video Controls */}
                        <div className="p-8 space-y-6">
                          <div className="space-y-3">
                            <input
                              type="range"
                              min={0}
                              max={duration}
                              step={1}
                              value={currentTime}
                              onChange={(e) =>
                                handleSeek(Number(e.target.value))
                              }
                              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                            />
                            <div className="flex justify-between text-xs text-slate-500 font-medium">
                              <span>{formatTime(currentTime)}</span>
                              <span>{formatTime(duration)}</span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={handlePlayPause}
                                className="border-slate-200 hover:bg-slate-50"
                              >
                                {isPlaying ? (
                                  <Pause className="h-4 w-4" />
                                ) : (
                                  <Play className="h-4 w-4" />
                                )}
                              </Button>

                              <div className="flex items-center gap-3">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={toggleMute}
                                  className="hover:bg-slate-100"
                                >
                                  {isMuted ? (
                                    <VolumeX className="h-4 w-4" />
                                  ) : (
                                    <Volume2 className="h-4 w-4" />
                                  )}
                                </Button>
                                <input
                                  type="range"
                                  min={0}
                                  max={100}
                                  step={1}
                                  value={volume}
                                  onChange={(e) =>
                                    handleVolumeChange([Number(e.target.value)])
                                  }
                                  className="w-20 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                                />
                              </div>

                              <select
                                value={playbackRate}
                                onChange={(e) => {
                                  const rate = Number(e.target.value);
                                  setPlaybackRate(rate);
                                  if (videoRef.current) {
                                    videoRef.current.playbackRate = rate;
                                  }
                                }}
                                className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white hover:bg-slate-50"
                              >
                                <option value={0.5}>0.5x</option>
                                <option value={1}>1x</option>
                                <option value={1.25}>1.25x</option>
                                <option value={1.5}>1.5x</option>
                                <option value={2}>2x</option>
                              </select>
                            </div>

                            <div className="flex items-center gap-3">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  downloadVideo(
                                    testimonial.media_url!,
                                    "testimonial.mp4"
                                  )
                                }
                                className="border-slate-200 hover:bg-slate-50"
                              >
                                <Download className="h-4 w-4 mr-2" />
                                Download
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={toggleFullscreen}
                                className="border-slate-200 hover:bg-slate-50"
                              >
                                <Maximize className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <EditableTextTestimonial
                        content={testimonial.content || ""}
                        authorName={testimonial.author_name}
                        onSave={saveTestimonialContent}
                        onCancel={() => console.log("Edit cancelled")}
                        lastModified={testimonial.created_at}
                        wordLimit={1000}
                        placeholder="Enter the testimonial content here. Share the customer's experience, outcomes, and value they received..."
                        showMetrics={true}
                      />
                    )}
                  </CardContent>
                </Card>

                <AIFeaturesDiscovery
                  testimonialType={testimonial.type as "video" | "text"}
                  artifacts={contextualArtifacts}
                  onFeatureClick={handleFeatureClick}
                  onViewAllFeatures={handleViewAllFeatures}
                />

                {/* Transcript */}
                {isVideoTestimonial &&
                  testimonial.content &&
                  showTranscript && (
                    <Card className="border border-gray-200 bg-white">
                      <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                              <MessageSquare className="h-5 w-5 text-slate-600" />
                            </div>
                            Transcript
                          </CardTitle>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowTranscript(!showTranscript)}
                            className="hover:bg-slate-100"
                          >
                            <EyeOff className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="prose prose-slate max-w-none">
                          <p className="text-slate-700 leading-relaxed">
                            {testimonial.content}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                {/* Realistic CapCut Integration (Optional) */}
              </div>

              {/* Premium Sidebar */}
              <div>
                <AuthorStats
                  testimonial={testimonial}
                  artifactCount={artifacts.length}
                  onSaveAuthorData={saveAuthorData}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="artifacts" className="space-y-8">
            {/* Smart Content Context Filter */}
            <ContextualContentFilter
              artifacts={artifacts}
              currentContext="testimonial-detail"
              showCrossReferences={showCrossReferences}
              onToggleCrossReferences={setShowCrossReferences}
              onFilterChange={setFilteredArtifacts}
            />

            <Tabs
              value={activeArtifactTab}
              onValueChange={setActiveArtifactTab}
            >
              <TabsList
                className={cn(
                  "grid w-full grid-cols-4 bg-white border border-slate-200 shadow-sm",
                  isVideo ? "lg:grid-cols-11" : "lg:grid-cols-7"
                )}
              >
                <TabsTrigger
                  value="sentiment"
                  className="text-xs data-[state=active]:bg-slate-100"
                >
                  Sentiment
                </TabsTrigger>

                {isVideo && (
                  <>
                    <TabsTrigger
                      value="highlights"
                      className="text-xs data-[state=active]:bg-slate-100"
                    >
                      Highlights
                    </TabsTrigger>
                    <TabsTrigger
                      value="clipping"
                      className="text-xs data-[state=active]:bg-slate-100"
                    >
                      Clips
                    </TabsTrigger>
                    <TabsTrigger
                      value="story"
                      className="text-xs data-[state=active]:bg-slate-100"
                    >
                      Story
                    </TabsTrigger>
                    <TabsTrigger
                      value="enhancement"
                      className="text-xs data-[state=active]:bg-slate-100"
                    >
                      Enhancement
                    </TabsTrigger>
                  </>
                )}
                <TabsTrigger
                  value="platform"
                  className="text-xs data-[state=active]:bg-slate-100"
                >
                  Platform
                </TabsTrigger>

                <TabsTrigger
                  value="content"
                  className="text-xs data-[state=active]:bg-slate-100"
                >
                  Content
                </TabsTrigger>

                <TabsTrigger
                  value="translation"
                  className="text-xs data-[state=active]:bg-slate-100"
                >
                  Translation
                </TabsTrigger>
                <TabsTrigger
                  value="polishing"
                  className="text-xs data-[state=active]:bg-slate-100"
                >
                  Polishing
                </TabsTrigger>
                <TabsTrigger
                  value="narration"
                  className="text-xs data-[state=active]:bg-slate-100"
                >
                  Narration
                </TabsTrigger>

                <TabsTrigger
                  value="viral"
                  className="text-xs data-[state=active]:bg-slate-100"
                >
                  Viral
                </TabsTrigger>
              </TabsList>

              <TabsContent value="sentiment">
                {renderSentimentAnalysis()}
              </TabsContent>
              {isVideo && (
                <>
                  <TabsContent value="highlights">
                    <HighlightsTab
                      artifacts={highlightArtifacts}
                      videoUrl={testimonial.media_url || ""}
                      onGenerateHighlights={handleGenerateHighlightsByType}
                      onRegenerateHighlights={handleGenerateHighlightsByType}
                      onSaveHighlightOrder={handleSaveHighlightOrder}
                    />
                  </TabsContent>
                  <TabsContent value="clipping">
                    {renderClippingArtifacts({
                      artifacts: clippingArtifacts,
                      onGenerateMore: () => goToAIStudio("clipping"),
                      onDownload: downloadVideo,
                      onCopyToClipboard: copyToClipboard,
                      copiedItems,
                      editingContent,
                      onStartEditing: startEditing,
                      onSaveContent: (id) => saveContent(id, ""),
                      onCancelEditing: cancelEditing,
                      onUpdateEditingContent: (id, content) =>
                        setEditingContent((prev) => ({
                          ...prev,
                          [id]: content,
                        })),
                      // onProceedToAIStudio: () => {},
                      // testimonialId: testimonialId || "",
                      onProcessClip: handleProcessClip,
                      onProcessArtifact: handleProcessArtifact,
                      onProcessMultipleClips: handleProcessMultipleClips,
                      selectedClips: selectedClips,
                      onClipSelectionChange: handleClipSelectionChange,
                      selectionMode: clipSelectionMode,
                      onSelectionModeChange: handleSelectionModeChange,
                      onVideoPreview: handleVideoPreview,
                      onViewLineage: handleViewLineage,
                    })}
                  </TabsContent>
                  <TabsContent value="story">
                    {renderStoryVideoArtifacts({
                      artifacts: storyArtifacts,
                      onGenerateMore: () =>
                        goToAIStudio("story_mode_generation"),
                      onDownload: downloadVideo,
                      onCopyToClipboard: copyToClipboard,
                      copiedItems,
                      editingContent,
                      onStartEditing: startEditing,
                      onSaveContent: (id) => saveContent(id, ""),
                      onCancelEditing: cancelEditing,
                      onUpdateEditingContent: (id, content) =>
                        setEditingContent((prev) => ({
                          ...prev,
                          [id]: content,
                        })),
                      onProcessClip: handleProcessClip,
                      onProcessArtifact: handleProcessArtifact,
                      onVideoPreview: handleVideoPreview,
                    })}
                  </TabsContent>

                  <TabsContent value="enhancement">
                    {renderEnhancementArtifacts({
                      artifacts: enhancementArtifacts,
                      onGenerateMore: () => goToAIStudio("enhancement"),
                      onDownload: downloadVideo,
                      onCopyToClipboard: copyToClipboard,
                      copiedItems,
                      editingContent,
                      onStartEditing: startEditing,
                      onSaveContent: (id) => saveContent(id, ""),
                      onCancelEditing: cancelEditing,
                      onUpdateEditingContent: (id, content) =>
                        setEditingContent((prev) => ({
                          ...prev,
                          [id]: content,
                        })),
                      onProcessClip: handleProcessClip,
                      onProcessArtifact: handleProcessArtifact,
                    })}
                  </TabsContent>
                </>
              )}

              <TabsContent value="platform">
                <PlatformOptimization
                  artifacts={[
                    ...platformVideoArtifacts,
                    ...platformTextArtifacts,
                  ]}
                  onGenerateMore={() => goToAIStudio("platform_optimization")}
                  onDownload={downloadVideo}
                  onCopyToClipboard={copyToClipboard}
                  copiedItems={copiedItems}
                  onProcessArtifact={handleProcessArtifact}
                />
              </TabsContent>

              <TabsContent value="translation">
                <TranslationTab
                  artifacts={translationArtifacts.map((a) => ({
                    id: a.id,
                    data: a.data as TranslationData,
                    created_at: a.created_at,
                  }))}
                  onGenerateTranslation={() => goToAIStudio("translation")}
                  onCopyToClipboard={copyToClipboard}
                  onSaveTranslation={(id, content) => {
                    console.log("Saving translation:", id, content);
                  }}
                  copiedItems={copiedItems}
                />
              </TabsContent>

              <TabsContent value="content">
                {renderContentGenerationArtifacts({
                  artifacts: contentGenArtifacts,
                  onGenerateMore: () => goToAIStudio("content_generation"),
                  onDownload: downloadVideo,
                  onCopyToClipboard: copyToClipboard,
                  copiedItems,
                  editingContent,
                  onStartEditing: startEditing,
                  onSaveContent: (id) => saveContent(id, ""),
                  onCancelEditing: cancelEditing,
                  onUpdateEditingContent: (id, content) =>
                    setEditingContent((prev) => ({ ...prev, [id]: content })),
                })}
              </TabsContent>

              <TabsContent value="polishing">
                {renderTextPolishingArtifacts({
                  artifacts: polishingArtifacts,
                  onGenerateMore: () => goToAIStudio("text_polishing"),
                  onDownload: downloadVideo,
                  onCopyToClipboard: copyToClipboard,
                  copiedItems,
                  editingContent,
                  onStartEditing: startEditing,
                  onSaveContent: (id) => saveContent(id, ""),
                  onCancelEditing: cancelEditing,
                  onUpdateEditingContent: (id, content) =>
                    setEditingContent((prev) => ({ ...prev, [id]: content })),
                })}
              </TabsContent>

              <TabsContent value="narration">
                {renderNarrationArtifacts({
                  artifacts: narrationArtifacts,
                  onGenerateMore: () => goToAIStudio("narration"),
                  onDownload: downloadVideo,
                  onCopyToClipboard: copyToClipboard,
                  copiedItems,
                  editingContent,
                  onStartEditing: startEditing,
                  onSaveContent: (id) => saveContent(id, ""),
                  onCancelEditing: cancelEditing,
                  onUpdateEditingContent: (id, content) =>
                    setEditingContent((prev) => ({ ...prev, [id]: content })),
                })}
              </TabsContent>

              <TabsContent value="viral">
                {renderViralAnalysisArtifacts({
                  artifacts: viralAnalysisArtifacts,
                  onGenerateViralClips: handleViralClipGeneration,
                  onGenerateViralOptimization: handleViralPlatformOptimization,
                  onDownload: downloadVideo,
                  onCopyToClipboard: copyToClipboard,
                  copiedItems,
                  editingContent,
                  onStartEditing: startEditing,
                  onSaveContent: (id) => saveContent(id, ""),
                  onCancelEditing: cancelEditing,
                  onUpdateEditingContent: (id, content) =>
                    setEditingContent((prev) => ({ ...prev, [id]: content })),
                })}
              </TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>
      </div>

      <FeatureHint onExploreFeatures={handleViewAllFeatures} />

      <VideoPreviewModal
        isOpen={videoPreviewModal.open}
        onClose={() =>
          setVideoPreviewModal({ open: false, videoUrl: "", title: "" })
        }
        videoUrl={videoPreviewModal.videoUrl}
        title={videoPreviewModal.title}
        metadata={videoPreviewModal.metadata}
      />

      <ProcessingLineageModal
        isOpen={lineageModal.open}
        onClose={() => setLineageModal({ open: false, sourceContent: null })}
        sourceContent={lineageModal.sourceContent}
        onVideoPreview={handleVideoPreview}
        onDownload={downloadVideo}
      />
    </div>
  );
});

export default TestimonialDetail;
