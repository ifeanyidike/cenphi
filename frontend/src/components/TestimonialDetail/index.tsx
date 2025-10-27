// components/TestimonialDetail/index.tsx - Final Ultra-Premium Version
import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
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
  BarChart3,
  Lightbulb,
  Video,
} from "lucide-react";
import AIFeaturesDiscovery from "./AIFeaturesDiscovery";
import MainTabs from "./MainTabs";
import PlatformRecommendations from "./PlatformRecommendations";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { workspaceHub } from "@/repo/workspace_hub";
import HighlightsTab from "./HighlightsTab";
import AuthorStats from "./AuthorStats";
import { renderClippingArtifacts } from "./TabRenderers";
import { TestimonialNotFound } from "@/utils/ErrorState";
import { cn } from "@/lib/utils";
import EditableTextTestimonial from "./EditableTextTestimonial";
import FeatureHint from "./FeatureHint";
import VideoPreviewModal from "./VideoPreviewModal";
import ProcessingLineageModal from "./ServiceLineageModal";
import { ServiceType } from "@/types/ai-service";
import { HighlightType } from "@/utils/highlights";
import { shouldShowInContext } from "@/utils/ContentRouter";
import { authStore } from "@/stores/authStore";
import { studioAPI } from "@/services/studioAPI";
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
  const [searchParams] = useSearchParams();

  // Read tab parameters from URL
  const tabFromUrl = searchParams.get("tab");
  const artifactTabFromUrl = searchParams.get("artifactTab");

  const [activeTab, setActiveTab] = useState(tabFromUrl || "overview");
  const [activeArtifactTab, setActiveArtifactTab] = useState(
    artifactTabFromUrl || "sentiment"
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(100);
  const [copiedItems, setCopiedItems] = useState<Set<string>>(new Set());
  // const [selectedHighlight, setSelectedHighlight] = useState<any>(null);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showTranscript, setShowTranscript] = useState(false);
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
  const [generatingSentiment, setGeneratingSentiment] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const fullscreenRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!testimonialId) return;

    (async () => {
      await workspaceHub.testimonialManager.fetchTestimonial(testimonialId);
    })();
  }, [testimonialId]);

  // Update tabs when URL params change
  useEffect(() => {
    if (tabFromUrl) {
      setActiveTab(tabFromUrl);
    }
    if (artifactTabFromUrl) {
      setActiveArtifactTab(artifactTabFromUrl);
    }
  }, [tabFromUrl, artifactTabFromUrl]);

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

  const saveContent = async (contentId: string) => {
    // Update local state - artifact changes are persisted through artifact manager
    setEditingContent((prev) => {
      const newState = { ...prev };
      delete newState[contentId];
      return newState;
    });
  };

  const saveTestimonialContent = async (newContent: string) => {
    try {
      if (!testimonialId) return;

      const { token } = await authStore.getToken();

      // Make PUT request to update testimonial content
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/testimonials/${testimonialId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            content: newContent,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to update testimonial: ${response.status}`);
      }

      // Update local state optimistically
      if (testimonial) {
        testimonial.content = newContent;
      }

      // Refetch to get latest state from server
      await workspaceHub.testimonialManager.fetchTestimonial(testimonialId);
    } catch (error) {
      console.error("Failed to save testimonial content:", error);
      throw error;
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
      // Update local state optimistically
      if (testimonial) {
        Object.assign(testimonial, authorData);
      }
      if (!testimonialId) return;
      // Refetch to get latest state from server
      await workspaceHub.testimonialManager.fetchTestimonial(testimonialId);
    } catch (error) {
      console.error("Failed to save author data:", error);
      throw error;
    }
  };

  const cancelEditing = (contentId: string) => {
    setEditingContent((prev) => {
      const newState = { ...prev };
      delete newState[contentId];
      return newState;
    });
  };

  const openStudio = (
    pipeline:
      | "platform_optimization"
      | "clipping"
      | "story_video" = "platform_optimization"
  ) => {
    if (!testimonial?.id) return;

    // Map pipeline to specific service route
    const routeMap = {
      platform_optimization: "/studio/optimize",
      clipping: "/studio/clipping",
      story_video: "/studio/story",
    };

    // Navigate to specific service route with testimonial context
    navigate(`${routeMap[pipeline]}?testimonialId=${testimonial.id}`);
  };

  const openStoryStudio = () => {
    if (!testimonial?.id) return;

    // Navigate to story video studio with testimonial context
    navigate(`/studio/story?testimonialId=${testimonial.id}`);
  };

  // Handle generating highlights by type directly in the detail page
  const handleGenerateHighlightsByType = async (type: HighlightType) => {
    if (!testimonial?.id) return;

    try {
      // Use the testimonial's transcript data directly
      const text = testimonial.content || "";
      const segments = testimonial.transcript_segments || [];

      if (text) {
        await studioAPI.generateHighlightsByType(
          testimonial.id,
          text,
          segments,
          type
        );

        // Refresh testimonial data to get new highlights
        await workspaceHub.testimonialManager.fetchTestimonial(testimonial.id);
      }
    } catch (error) {
      console.error(`Failed to generate ${type} highlights:`, error);
    }
  };

  const handleRegenerateHighlightsByType = async (
    highlightType: HighlightType
  ) => {
    if (!testimonial?.id) return;
    const type = highlightType === "highlights" ? "general" : highlightType;

    const highlights = testimonial.artifacts.filter(
      (a) => a.processing_type === "highlight_extraction"
    );

    let artifact =
      highlights.find((h) => {
        const highlightType = h.data?.highlight_type;
        const subHighlights = h.data?.highlights;
        return (
          h.result_category === type ||
          highlightType === type ||
          (Array.isArray(subHighlights) &&
            subHighlights[0]?.highlight_type === type)
        );
      }) || highlights[0];

    try {
      // Use the testimonial's transcript data directly
      const text = testimonial.content || "";
      const segments = testimonial.transcript_segments || [];

      if (text) {
        await studioAPI.generateHighlightsByType(
          testimonial.id,
          text,
          segments,
          type,
          artifact.id
        );

        // Refresh testimonial data to get new highlights
        await workspaceHub.testimonialManager.fetchTestimonial(testimonial.id);
      }
    } catch (error) {
      console.error(`Failed to generate ${type} highlights:`, error);
    }
  };

  const handleProcessMultipleClips = async (
    clips: any[],
    serviceType: ServiceType
  ) => {
    // Navigate to Studio with appropriate context
    if (testimonial?.id) {
      const clipIds = clips.map((c) => c.id).join(",");

      // For story_mode, navigate to story studio
      if (serviceType === "story_mode") {
        navigate(
          `/studio/story?testimonialId=${testimonial.id}&clipIds=${clipIds}&context=selected-clips`
        );
        return;
      }

      // For platform_optimizer, navigate to optimization studio
      if (serviceType === "platform_optimizer") {
        // Single clip optimization
        if (clips.length === 1) {
          navigate(
            `/studio/optimize?testimonialId=${testimonial.id}&clipId=${clips[0].id}&sourceType=clip`
          );
        } else {
          // Multiple clips - batch optimization (future feature)
          navigate(
            `/studio/optimize?testimonialId=${testimonial.id}&clipIds=${clipIds}&sourceType=clips`
          );
        }
        return;
      }

      // For custom_pipeline, navigate to custom studio
      if (serviceType === "custom_pipeline") {
        navigate(
          `/studio/custom?testimonialId=${testimonial.id}&clipIds=${clipIds}&sourceType=${clips.length === 1 ? "clip" : "clips"}`
        );
        return;
      }

      // For any other unhandled service type, log warning
      console.warn(`Unhandled service type in clip processing: ${serviceType}`);
    }
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
    // Open studio for processing features or navigate to artifacts tab
    if (featureId === "clipping") {
      openStudio("clipping");
    } else if (featureId === "story_mode_generation") {
      openStoryStudio();
    } else if (featureId === "platform_optimizer") {
      openStudio("platform_optimization");
    } else if (featureId === "content_generation") {
      // Navigate to AI content hub or open content generation
      navigate("/content-hub");
    } else {
      // Fallback: navigate to artifacts tab
      setActiveTab("artifacts");
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

  // Filter artifacts to show primary ones in testimonial detail context
  const contextualArtifacts = artifacts.filter((artifact) => {
    const shouldShow = shouldShowInContext(artifact, "testimonial-detail");
    return shouldShow.show && shouldShow.isPrimary;
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

  // Handle sentiment analysis generation
  const handleGenerateSentiment = async () => {
    if (!testimonial?.id) return;

    try {
      setGeneratingSentiment(true);

      const { token } = await authStore.getToken();
      const workspace_id = workspaceHub.workspace;

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/ai/sentiment`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            workspace_id,
            testimonial_id: testimonial.id,
            text: testimonial.content || "",
            brand_context: null,
            prompt: "",
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Sentiment analysis failed: ${response.statusText}`);
      }

      // Refresh testimonial data to get the new sentiment artifact
      await workspaceHub.testimonialManager.fetchTestimonial(testimonial.id);
    } catch (error) {
      console.error("Failed to generate sentiment analysis:", error);
    } finally {
      setGeneratingSentiment(false);
    }
  };

  // Render sentiment analysis
  const renderSentimentAnalysis = () => {
    if (!sentiment) {
      return (
        <Card className="border border-slate-200 bg-white">
          <CardContent className="p-8 text-center">
            <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <Brain className="h-5 w-5 text-slate-400" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900 mb-2">
              No Sentiment Analysis
            </h3>
            <p className="text-xs text-slate-600 mb-5 max-w-sm mx-auto">
              Generate AI-powered sentiment analysis to understand emotional
              tone and business insights
            </p>
            <Button
              onClick={handleGenerateSentiment}
              size="sm"
              disabled={generatingSentiment}
              className="bg-slate-900 hover:bg-slate-800 text-white h-8 px-4 text-xs"
            >
              {generatingSentiment ? (
                <>
                  <Brain className="h-3 w-3 mr-1.5 animate-pulse" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-3 w-3 mr-1.5" />
                  Generate Analysis
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-4">
        {/* Overall Sentiment */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="border border-slate-200 bg-white">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-xs font-semibold">
                <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center">
                  <Brain className="h-3.5 w-3.5 text-slate-600" />
                </div>
                Overall Sentiment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div
                  className={`inline-flex items-center px-4 py-2 rounded-lg text-xs font-semibold border ${getSentimentColor(sentiment.label)}`}
                >
                  {sentiment.label?.replace("_", " ")?.toUpperCase()}
                </div>
                <p className="text-[10px] text-slate-600 mt-2 font-medium">
                  Confidence: {Math.round(sentiment.sentiment_score * 100)}%
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-slate-900">
                  Detected Emotions
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {sentiment.emotions.map((emotion, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-700 border-0 capitalize"
                    >
                      {emotion}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-slate-200 bg-white">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-xs font-semibold">
                <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center">
                  <BarChart3 className="h-3.5 w-3.5 text-slate-600" />
                </div>
                Sentiment Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700">
                    Sentiment Strength
                  </span>
                  <span className="text-xs text-slate-600 font-medium">
                    {Math.round(sentiment.sentiment_score * 100)}%
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div
                    className="bg-slate-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${sentiment.sentiment_score * 100}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-500 leading-relaxed">
                  Higher scores indicate stronger emotional sentiment
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Business Recommendations */}
        <Card className="border border-slate-200 bg-white">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-xs font-semibold">
              <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center">
                <Lightbulb className="h-3.5 w-3.5 text-slate-600" />
              </div>
              Business Recommendations (
              {sentiment.business_recommendations.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {sentiment.business_recommendations.map((rec, index) => (
                <Card
                  key={index}
                  className="border-l-2 border-l-slate-400 border border-slate-200 bg-white"
                >
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between mb-2">
                      <Badge
                        className={`text-[10px] border font-medium ${getPriorityColor(rec.priority)}`}
                        variant="outline"
                      >
                        {rec.priority?.toUpperCase()}
                      </Badge>
                      <Badge
                        variant="secondary"
                        className="text-[10px] bg-slate-100 text-slate-700 border-0"
                      >
                        {rec.category}
                      </Badge>
                    </div>

                    <h4 className="text-xs font-semibold text-slate-900 mb-2 leading-relaxed">
                      {rec.action}
                    </h4>

                    <p className="text-[10px] text-slate-600 leading-relaxed">
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
    // Navigate to appropriate Studio based on service type
    if (!testimonialId) return;

    if (serviceType === "platform_optimizer") {
      navigate(
        `/studio/optimize?testimonialId=${testimonialId}&clipId=${clip.artifactId}&sourceType=clip`
      );
    } else if (serviceType === "story_mode") {
      navigate(
        `/studio/story?testimonialId=${testimonialId}&clipIds=${clip.artifactId}&context=selected-clips`
      );
    } else {
      console.warn(
        `Unhandled service type for clip processing: ${serviceType}`
      );
    }
  };

  const handleProcessArtifact = async (
    artifact: any,
    serviceType: ServiceType,
    from?: string
  ) => {
    // Navigate to appropriate Studio based on service type and artifact
    if (!testimonialId) return;

    if (serviceType === "platform_optimizer") {
      navigate(
        `/studio/optimize?testimonialId=${testimonialId}&artifactId=${artifact.id}&sourceType=artifact&from=${from || "artifacts"}`
      );
    } else if (serviceType === "story_mode") {
      navigate(
        `/studio/story?testimonialId=${testimonialId}&artifactId=${artifact.id}&context=artifact`
      );
    } else {
      console.warn(
        `Unhandled service type for artifact processing: ${serviceType}`
      );
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Premium Header - Clean, centered design */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-[1600px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Back Navigation */}
            <Button
              variant="ghost"
              onClick={() => navigate("/dashboard")}
              className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 h-9 px-3"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              <span className="text-sm font-medium">Back to Testimonials</span>
            </Button>

            {/* Center - Author Info */}
            <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5">
              <h1 className="text-base font-semibold text-slate-900">
                {testimonial.author_name || "Anonymous"}
              </h1>
              <div className="flex items-center gap-3 text-xs text-slate-600">
                {testimonial.author_company && (
                  <span className="font-medium">
                    {testimonial.author_company}
                  </span>
                )}
                {testimonial.rating && (
                  <>
                    {testimonial.author_company && (
                      <span className="text-slate-300">•</span>
                    )}
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={cn(
                            "h-3.5 w-3.5 transition-colors",
                            i < testimonial.rating!
                              ? "text-amber-400 fill-amber-400"
                              : "text-slate-300 fill-slate-300"
                          )}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {sentiment && (
                <Badge
                  variant="outline"
                  className={cn(
                    "text-xs font-medium",
                    getSentimentColor(sentiment.label)
                  )}
                >
                  {sentiment.label.replace("_", " ")}
                </Badge>
              )}
              <Button
                onClick={() => openStudio("platform_optimization")}
                className="bg-blue-600 hover:bg-blue-700 h-9 px-4"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                <span className="text-sm font-medium">AI Studio</span>
              </Button>
              <Button variant="outline" className="h-9 px-4 border-slate-300">
                <Share2 className="h-4 w-4 mr-2" />
                <span className="text-sm">Share</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Exceptional professional layout */}
      <div className="max-w-[1600px] mx-auto px-6 py-6">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
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

          <TabsContent value="overview" className="space-y-5">
            {/* Clean two-column layout */}
            <div className="max-w-screen-xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">
              {/* Left Column - Main Content */}
              <div className="space-y-5">
                {/* Video/Content Card */}
                <Card className="border border-slate-200 bg-white overflow-hidden">
                  <CardContent className="p-0">
                    {isVideoTestimonial && testimonial.media_url ? (
                      <div className="space-y-0">
                        {/* Video Player - Clean, modern */}
                        <div
                          ref={fullscreenRef}
                          className="aspect-video bg-gradient-to-br from-slate-900 to-slate-800 relative group"
                        >
                          <video
                            ref={videoRef}
                            src={testimonial.media_url}
                            className="w-full h-full object-contain"
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

                        {/* Video Controls - Compact */}
                        <div className="px-4 py-3 bg-white border-t border-slate-100">
                          <div className="space-y-3">
                            {/* Progress Bar */}
                            <div className="space-y-2">
                              <input
                                type="range"
                                min={0}
                                max={duration}
                                step={1}
                                value={currentTime}
                                onChange={(e) =>
                                  handleSeek(Number(e.target.value))
                                }
                                className="w-full h-1 bg-slate-200 rounded-full appearance-none cursor-pointer hover:h-1.5 transition-all accent-blue-600"
                                style={{
                                  background: `linear-gradient(to right, rgb(37 99 235) 0%, rgb(37 99 235) ${(currentTime / duration) * 100}%, rgb(226 232 240) ${(currentTime / duration) * 100}%, rgb(226 232 240) 100%)`,
                                }}
                              />
                              <div className="flex justify-between text-[10px] text-slate-500 font-medium">
                                <span>{formatTime(currentTime)}</span>
                                <span>{formatTime(duration)}</span>
                              </div>
                            </div>

                            {/* Controls Row */}
                            <div className="flex items-center justify-between">
                              {/* Left - Playback controls */}
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={handlePlayPause}
                                  className="h-8 w-8 p-0 hover:bg-slate-100 rounded-full"
                                >
                                  {isPlaying ? (
                                    <Pause className="h-3.5 w-3.5 text-slate-700" />
                                  ) : (
                                    <Play className="h-3.5 w-3.5 text-slate-700 ml-0.5" />
                                  )}
                                </Button>

                                <div className="flex items-center gap-2 ml-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={toggleMute}
                                    className="h-8 w-8 p-0 hover:bg-slate-100 rounded-full"
                                  >
                                    {isMuted ? (
                                      <VolumeX className="h-3.5 w-3.5 text-slate-700" />
                                    ) : (
                                      <Volume2 className="h-3.5 w-3.5 text-slate-700" />
                                    )}
                                  </Button>
                                  <input
                                    type="range"
                                    min={0}
                                    max={100}
                                    step={1}
                                    value={volume}
                                    onChange={(e) =>
                                      handleVolumeChange([
                                        Number(e.target.value),
                                      ])
                                    }
                                    className="w-16 h-1 bg-slate-200 rounded-full appearance-none cursor-pointer accent-blue-600"
                                  />
                                </div>

                                <div className="h-4 w-px bg-slate-200 mx-1.5" />

                                <select
                                  value={playbackRate}
                                  onChange={(e) => {
                                    const rate = Number(e.target.value);
                                    setPlaybackRate(rate);
                                    if (videoRef.current) {
                                      videoRef.current.playbackRate = rate;
                                    }
                                  }}
                                  className="text-[10px] border border-slate-200 rounded px-2 py-1 bg-white hover:bg-slate-50 font-medium text-slate-700 cursor-pointer"
                                >
                                  <option value={0.5}>0.5×</option>
                                  <option value={1}>1×</option>
                                  <option value={1.25}>1.25×</option>
                                  <option value={1.5}>1.5×</option>
                                  <option value={2}>2×</option>
                                </select>
                              </div>

                              {/* Right - Action controls */}
                              <div className="flex items-center gap-1.5">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    downloadVideo(
                                      testimonial.media_url!,
                                      "testimonial.mp4"
                                    )
                                  }
                                  className="h-8 px-2.5 text-[10px] border-slate-200"
                                >
                                  <Download className="h-3 w-3 mr-1.5" />
                                  Download
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={toggleFullscreen}
                                  className="h-8 w-8 p-0 hover:bg-slate-100 rounded-full"
                                >
                                  <Maximize className="h-3.5 w-3.5 text-slate-700" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <EditableTextTestimonial
                        content={testimonial.content || ""}
                        authorName={testimonial.author_name}
                        onSave={saveTestimonialContent}
                        onCancel={() => {
                          /* Edit cancelled */
                        }}
                        lastModified={testimonial.created_at}
                        wordLimit={1000}
                        placeholder="Enter the testimonial content here. Share the customer's experience, outcomes, and value they received..."
                        showMetrics={true}
                      />
                    )}
                  </CardContent>
                </Card>

                {/* Transcript with Read More */}
                {isVideoTestimonial && testimonial.content && (
                  <Card className="border border-slate-200 bg-white overflow-hidden">
                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center">
                          <MessageSquare className="h-3 w-3 text-slate-600" />
                        </div>
                        <h3 className="text-xs font-semibold text-slate-900">
                          Transcript
                        </h3>
                      </div>
                      <div className="relative">
                        <p
                          className={`text-xs text-slate-700 leading-relaxed ${!showTranscript ? "line-clamp-3" : ""}`}
                        >
                          {testimonial.content}
                        </p>
                        {testimonial.content.length > 200 && (
                          <button
                            onClick={() => setShowTranscript(!showTranscript)}
                            className="text-xs text-blue-600 hover:text-blue-700 font-medium mt-2 inline-flex items-center gap-1"
                          >
                            {showTranscript ? "Read less" : "Read more"}
                            <svg
                              className={`h-3 w-3 transform transition-transform ${showTranscript ? "rotate-180" : ""}`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 9l-7 7-7-7"
                              />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  </Card>
                )}

                {/* AI Features */}
                <AIFeaturesDiscovery
                  testimonialType={testimonial.type as "video" | "text"}
                  artifacts={contextualArtifacts}
                  testimonial={testimonial}
                  onFeatureClick={handleFeatureClick}
                  onViewAllFeatures={handleViewAllFeatures}
                />
              </div>

              {/* Right Column - Author Stats & AI Insights */}
              <div className="space-y-5">
                <AuthorStats
                  testimonial={testimonial}
                  artifactCount={artifacts.length}
                  onSaveAuthorData={saveAuthorData}
                />

                {/* Platform Recommendations - Video testimonials only */}
                {isVideoTestimonial && testimonialId && (
                  <PlatformRecommendations
                    testimonialId={testimonialId}
                    onOptimize={(platform) => {
                      // Navigate to platform optimization studio with platform preset
                      navigate(
                        `/studio/optimize?testimonialId=${testimonialId}&platform=${platform}`
                      );
                    }}
                  />
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="artifacts" className="space-y-5">
            <div className="max-w-screen-xl mx-auto space-y-5">
              {/* Quick Actions */}
              {isVideo && (
                <Card className="border border-slate-200 bg-white overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center">
                        <Lightbulb className="h-3.5 w-3.5 text-slate-600" />
                      </div>
                      <h3 className="text-xs font-semibold text-slate-900">
                        Quick Actions
                      </h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <Button
                        onClick={() => openStudio("clipping")}
                        variant="outline"
                        size="sm"
                        className="justify-start h-9 px-3 text-xs border-slate-200 hover:border-blue-400 hover:bg-blue-50 transition-all"
                      >
                        <Sparkles className="h-3.5 w-3.5 mr-2 text-blue-600" />
                        Create Clips
                      </Button>
                      <Button
                        onClick={() => openStoryStudio()}
                        variant="outline"
                        size="sm"
                        className="justify-start h-9 px-3 text-xs border-slate-200 hover:border-purple-400 hover:bg-purple-50 transition-all"
                      >
                        <Video className="h-3.5 w-3.5 mr-2 text-purple-600" />
                        Story Video
                      </Button>
                      <Button
                        onClick={() => openStudio("platform_optimization")}
                        variant="outline"
                        size="sm"
                        className="justify-start h-9 px-3 text-xs border-slate-200 hover:border-emerald-400 hover:bg-emerald-50 transition-all"
                      >
                        <BarChart3 className="h-3.5 w-3.5 mr-2 text-emerald-600" />
                        Optimize
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Artifacts Tabs */}
              <Card className="border border-slate-200 bg-white overflow-hidden">
                <Tabs
                  value={activeArtifactTab}
                  onValueChange={setActiveArtifactTab}
                  className="w-full"
                >
                  <div className="border-b border-slate-200 px-5 pt-5">
                    <TabsList
                      className={cn(
                        "grid w-full bg-slate-50 rounded-lg p-0.5",
                        isVideo ? "grid-cols-3" : "grid-cols-1"
                      )}
                    >
                      <TabsTrigger
                        value="sentiment"
                        className="text-xs font-medium data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm rounded-md transition-all py-2"
                      >
                        Sentiment
                      </TabsTrigger>

                      {isVideo && (
                        <>
                          <TabsTrigger
                            value="highlights"
                            className="text-xs font-medium data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm rounded-md transition-all py-2"
                          >
                            Highlights
                          </TabsTrigger>
                          <TabsTrigger
                            value="clipping"
                            className="text-xs font-medium data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm rounded-md transition-all py-2"
                          >
                            Clips
                          </TabsTrigger>
                        </>
                      )}
                    </TabsList>
                  </div>

                  <div className="p-5">
                    <TabsContent value="sentiment" className="mt-0">
                      {renderSentimentAnalysis()}
                    </TabsContent>
                    {isVideo && (
                      <>
                        <TabsContent value="highlights" className="mt-0">
                          <HighlightsTab
                            testimonialId={testimonial.id}
                            artifacts={highlightArtifacts}
                            videoUrl={testimonial.media_url || ""}
                            onGenerateHighlights={
                              handleGenerateHighlightsByType
                            }
                            onRegenerateHighlights={
                              handleRegenerateHighlightsByType
                            }
                          />
                        </TabsContent>
                        <TabsContent value="clipping" className="mt-0">
                          {renderClippingArtifacts({
                            artifacts: clippingArtifacts,
                            onGenerateMore: () => openStudio("clipping"),
                            onDownload: downloadVideo,
                            onCopyToClipboard: copyToClipboard,
                            copiedItems,
                            editingContent,
                            onStartEditing: startEditing,
                            onSaveContent: (id) => saveContent(id),
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
                      </>
                    )}
                  </div>
                </Tabs>
              </Card>
            </div>
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
