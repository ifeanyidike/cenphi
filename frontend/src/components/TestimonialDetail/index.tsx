import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { observer } from "mobx-react-lite";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Star,
  Calendar,
  User,
  Building2,
  Mail,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Download,
  Share2,
  Heart,
  MessageSquare,
  Sparkles,
  Brain,
  Video,
  Scissors,
  Palette,
  FileText,
  Zap,
  Target,
  Globe,
  ChevronRight,
  ExternalLink,
  Copy,
  Check,
  MoreVertical,
  Clock,
  TrendingUp,
  Award,
  Mic,
  Plus,
  SkipForward,
  SkipBack,
  Maximize,
  Settings,
  ThumbsUp,
  Eye,
  EyeOff,
  Music,
  PenTool,
  Wand2,
  Languages,
  RefreshCw,
  BarChart3,
  Layers,
  ImageIcon,
  SpeakerIcon,
  Edit3,
  Save,
  X,
  AlertCircle,
  Lightbulb,
  ArrowUpRight,
  PlayCircle,
  Instagram,
  Youtube,
  Facebook,
  Twitter,
  Linkedin,
  Smartphone,
  Monitor,
  Square,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { workspaceHub } from "@/repo/workspace_hub";
import { Testimonial } from "@/types/testimonial";

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

interface HighlightData {
  highlights?: Array<{
    start_time: number;
    end_time: number;
    text: string;
    theme: string;
    importance_score: number;
    engagement_score: number;
    title: string;
    keywords: string[];
    emotional_intensity: number;
  }>;
  emotional?: Array<{
    start_time: number;
    end_time: number;
    text: string;
    emotion: string;
    intensity: number;
    title: string;
  }>;
  before_after?: Array<{
    start_time: number;
    end_time: number;
    text: string;
    transformation_type: string;
    impact_score: number;
    title: string;
  }>;
  detection_method: "automatic" | "manual";
}

interface ClippingData {
  generated_clips: {
    clips: Array<{
      url: string;
      theme: string;
      title: string;
      end_time: number;
      start_time: number;
      duration_seconds: number;
      engagement_score: number;
      transcript?: string;
      metadata?: any;
    }>;
    detection_method: "automatic" | "manual";
  };
}

interface PlatformOptimizationData {
  text: string;
  optimized_url: string;
  platform: string;
  aspect_ratio: string;
  hashtags?: string[];
  caption?: string;
  optimal_posting_time?: string;
  target_audience?: string;
  applied_optimizations?: string[];
}

interface StoryVideoData {
  story_video_url: string;
}

interface EnhancementData {
  enhanced_url: string;
  applied_enhancements: string[];
  quality_score: number;
  media_type: string;
}

interface NarrationData {
  audio_url: string;
  audio_duration_seconds: number;
  voice_provider: string;
  quality_score: number;
}

interface NoiseReductionData {
  denoised_url: string;
}

interface TextPolishingData {
  content: string;
  word_count: number;
  created_at: string;
  format: "markdown" | "text" | "html";
}

interface TextTranslationData {
  content: string;
  word_count: number;
  created_at: string;
  format: "markdown" | "text" | "html";
  source_language: string;
  target_language: string;
}

interface ContentGenerationData {
  generated_content: Array<{
    content_type: string;
    title: string;
    content: string;
    word_count: number;
    created_at: string;
    format: "markdown" | "text" | "html";
  }>;
  source_testimonials: string[];
}

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
  const [selectedHighlight, setSelectedHighlight] = useState<any>(null);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showTranscript, setShowTranscript] = useState(true);
  const [editingContent, setEditingContent] = useState<{
    [key: string]: string;
  }>({});
  const [isFullscreen, setIsFullscreen] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const fullscreenRef = useRef<HTMLDivElement>(null);

  console.log("testimonialId", testimonialId);

  useEffect(() => {
    if (!testimonialId) return;

    (async () => {
      await workspaceHub.testimonialManager.fetchTestimonial(testimonialId);
    })();
  }, [testimonialId]);

  const testimonial = workspaceHub.testimonialManager.testimonial;
  const isLoading = workspaceHub.testimonialManager.isLoading;

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

  const jumpToHighlight = (startTime: number) => {
    handleSeek(startTime);
    setSelectedHighlight(startTime);
  };

  const startEditing = (contentId: string, currentContent: string) => {
    setEditingContent((prev) => ({ ...prev, [contentId]: currentContent }));
  };

  const saveContent = async (contentId: string, artifactId: string) => {
    // TODO: Implement save content API call
    console.log("Saving content:", contentId, editingContent[contentId]);
    setEditingContent((prev) => {
      const newState = { ...prev };
      delete newState[contentId];
      return newState;
    });
  };

  const cancelEditing = (contentId: string) => {
    setEditingContent((prev) => {
      const newState = { ...prev };
      delete newState[contentId];
      return newState;
    });
  };

  const openInCapCut = (videoUrl: string, artifactType: string = "video") => {
    // CapCut integration guide:
    // 1. CapCut Web API integration (if available)
    // 2. Deep linking with capcut:// protocol
    // 3. Fallback to manual import instructions

    const capCutDeepLink = `capcut://import?url=${encodeURIComponent(videoUrl)}`;

    // Try deep link first
    const linkElement = document.createElement("a");
    linkElement.href = capCutDeepLink;
    linkElement.click();

    // Fallback: Show instructions modal or redirect
    setTimeout(() => {
      const userWantsInstructions = confirm(
        "CapCut app not detected. Would you like to see manual import instructions?"
      );

      if (userWantsInstructions) {
        showCapCutInstructions(videoUrl, artifactType);
      }
    }, 1000);
  };

  const showCapCutInstructions = (videoUrl: string, artifactType: string) => {
    const instructions = `
CapCut Integration Guide:

1. **Download CapCut** (if not installed):
   - iOS: App Store → Search "CapCut"
   - Android: Google Play → Search "CapCut"
   - Desktop: capcut.com

2. **Import Video**:
   - Copy this URL: ${videoUrl}
   - Open CapCut
   - Tap "New Project"
   - Tap "Import" → "From URL" (if available)
   - Or download the video first, then import from gallery

3. **Recommended Edits for ${artifactType}**:
   ${artifactType === "clip" ? "- Add captions/subtitles\n- Apply trending transitions\n- Add background music" : ""}
   ${artifactType === "story" ? "- Add intro/outro animations\n- Apply brand colors\n- Include call-to-action text" : ""}
   ${artifactType === "platform" ? "- Optimize for platform requirements\n- Add platform-specific effects\n- Ensure proper aspect ratio" : ""}

4. **Export Settings**:
   - Resolution: 1080p or higher
   - Frame rate: 30fps or 60fps
   - Format: MP4
   - Quality: High

Need help? Contact our support team for detailed integration assistance.
    `;

    // In a real implementation, this would open a modal
    alert(instructions);
  };

  const goToAIStudio = (artifactType: string) => {
    // Navigate to AI Studio with specific artifact type
    navigate(`/ai-studio?type=${artifactType}&testimonialId=${testimonialId}`);
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case "instagram":
        return Instagram;
      case "youtube":
        return Youtube;
      case "facebook":
        return Facebook;
      case "twitter":
        return Twitter;
      case "linkedin":
        return Linkedin;
      case "tiktok":
        return Video; // Using Video as TikTok icon
      default:
        return Globe;
    }
  };

  const getAspectRatioIcon = (aspectRatio: string) => {
    switch (aspectRatio) {
      case "9:16":
        return Smartphone;
      case "16:9":
        return Monitor;
      case "1:1":
        return Square;
      default:
        return Monitor;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 border-red-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 h-96 bg-gray-200 rounded"></div>
              <div className="h-96 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!testimonial) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Testimonial Not Found
          </h2>
          <p className="text-gray-600 mb-4">
            The testimonial you're looking for doesn't exist or has been
            removed.
          </p>
          <Button onClick={() => navigate("/dashboard")} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  const isVideoTestimonial = testimonial.type === "video";
  const artifacts = testimonial.artifacts || [];

  // Parse different artifact types
  const sentimentArtifact = artifacts.find(
    (a) => a.processing_type === "sentiment_analysis"
  );
  const highlightArtifacts = artifacts.filter(
    (a) => a.processing_type === "highlight_extraction"
  );
  const clippingArtifacts = artifacts.filter(
    (a) => a.processing_type === "clipping"
  );
  const storyArtifacts = artifacts.filter(
    (a) => a.processing_type === "story_mode_generation"
  );
  const enhancementArtifacts = artifacts.filter(
    (a) => a.processing_type === "enhancement"
  );
  const platformVideoArtifacts = artifacts.filter(
    (a) => a.processing_type === "video_platform_optization"
  );
  const platformTextArtifacts = artifacts.filter(
    (a) => a.processing_type === "text_platform_optization"
  );
  const contentGenArtifacts = artifacts.filter(
    (a) => a.processing_type === "content_generation"
  );
  const polishingArtifacts = artifacts.filter(
    (a) => a.processing_type === "text_polishing"
  );
  const narrationArtifacts = artifacts.filter(
    (a) => a.processing_type === "narration"
  );

  const sentiment = sentimentArtifact?.data as SentimentData | undefined;

  const getSentimentColor = (label: string) => {
    if (label.includes("positive"))
      return "bg-green-100 text-green-800 border-green-200";
    if (label.includes("negative"))
      return "bg-red-100 text-red-800 border-red-200";
    if (label.includes("neutral"))
      return "bg-gray-100 text-gray-800 border-gray-200";
    return "bg-blue-100 text-blue-800 border-blue-200";
  };

  const renderSentimentAnalysis = () => {
    if (!sentiment) {
      return (
        <Card>
          <CardContent className="p-8 text-center">
            <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Sentiment Analysis
            </h3>
            <p className="text-gray-600 mb-4">
              Generate AI-powered sentiment analysis to understand the emotional
              tone and business impact.
            </p>
            <Button
              onClick={() => goToAIStudio("sentiment_analysis")}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Generate Sentiment Analysis
            </Button>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-6">
        {/* Overall Sentiment */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-purple-600" />
                Overall Sentiment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <div
                  className={`inline-flex items-center px-6 py-3 rounded-full text-lg font-semibold border ${getSentimentColor(sentiment.label)}`}
                >
                  {sentiment.label?.replace("_", " ")?.toUpperCase()}
                </div>
                <p className="text-sm text-gray-600 mt-3">
                  Confidence: {Math.round(sentiment.sentiment_score * 100)}%
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">Detected Emotions</h4>
                <div className="flex flex-wrap gap-2">
                  {sentiment.emotions.map((emotion, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="text-sm capitalize"
                    >
                      {emotion}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-purple-600" />
                Sentiment Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    Sentiment Strength
                  </span>
                  <span className="text-sm text-gray-600">
                    {Math.round(sentiment.sentiment_score * 100)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-purple-500 to-indigo-500 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${sentiment.sentiment_score * 100}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Higher scores indicate stronger emotional sentiment
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Business Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-purple-600" />
              Business Recommendations (
              {sentiment.business_recommendations.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sentiment.business_recommendations.map((rec, index) => (
                <Card key={index} className="border-l-4 border-l-purple-500">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <Badge
                        className={`text-xs border ${getPriorityColor(rec.priority)}`}
                        variant="outline"
                      >
                        {rec.priority?.toUpperCase()}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {rec.category}
                      </Badge>
                    </div>

                    <h4 className="font-medium text-gray-900 mb-2 text-sm">
                      {rec.action}
                    </h4>

                    <p className="text-xs text-gray-600 leading-relaxed">
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

  const renderClippingArtifacts = () => {
    if (clippingArtifacts.length === 0) {
      return (
        <Card>
          <CardContent className="p-8 text-center">
            <Scissors className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Clips Generated
            </h3>
            <p className="text-gray-600 mb-4">
              Create engaging video clips from key moments in this testimonial.
            </p>
            <Button
              onClick={() => goToAIStudio("clipping")}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
            >
              <Scissors className="h-4 w-4 mr-2" />
              Generate Clips
            </Button>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-6">
        {clippingArtifacts.map((artifact) => {
          const data = artifact.data as ClippingData;
          const clips = data?.generated_clips?.clips || [];

          return (
            <Card key={artifact.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Scissors className="h-5 w-5 text-purple-600" />
                  Generated Clips ({clips.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {clips.map((clip, index) => (
                    <Card
                      key={index}
                      className="hover:shadow-md transition-shadow"
                    >
                      <CardContent className="p-4 space-y-3">
                        <div className="aspect-video bg-black rounded-lg overflow-hidden relative">
                          <video
                            src={clip.url}
                            controls
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-2 right-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="bg-black/50 text-white hover:bg-black/70"
                              onClick={() => openInCapCut(clip.url, "clip")}
                            >
                              <Edit3 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>

                        <div>
                          <h4 className="font-medium text-gray-900 text-sm">
                            {clip.title}
                          </h4>
                          <div className="flex items-center gap-2 text-xs text-gray-600 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {clip.theme}
                            </Badge>
                            <span>{formatTime(clip.duration_seconds)}</span>
                            <span className="flex items-center gap-1">
                              <TrendingUp className="h-3 w-3" />
                              {Math.round(clip.engagement_score * 100)}%
                            </span>
                          </div>
                        </div>

                        {clip.transcript && (
                          <div className="p-2 bg-gray-50 rounded text-xs text-gray-700">
                            <p className="line-clamp-3">{clip.transcript}</p>
                          </div>
                        )}

                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              downloadVideo(clip.url, `${clip.title}.mp4`)
                            }
                            className="flex-1"
                          >
                            <Download className="h-3 w-3 mr-1" />
                            Download
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              copyToClipboard(clip.url, `clip-${index}`)
                            }
                          >
                            {copiedItems.has(`clip-${index}`) ? (
                              <Check className="h-3 w-3 text-green-600" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  const renderPlatformOptimizationArtifacts = () => {
    const allPlatformArtifacts = [
      ...platformVideoArtifacts,
      ...platformTextArtifacts,
    ];

    if (allPlatformArtifacts.length === 0) {
      return (
        <Card>
          <CardContent className="p-8 text-center">
            <Globe className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Platform Content
            </h3>
            <p className="text-gray-600 mb-4">
              Optimize this testimonial for different social media platforms.
            </p>
            <Button
              onClick={() => goToAIStudio("platform_optimization")}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
            >
              <Globe className="h-4 w-4 mr-2" />
              Optimize for Platforms
            </Button>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {allPlatformArtifacts.map((artifact) => {
            const data = artifact.data as PlatformOptimizationData;
            const AspectIcon = getAspectRatioIcon(data.aspect_ratio || "9:16");
            const PlatformIcon = getPlatformIcon(
              data.platform || "instagram_reel"
            );

            // Determine container class based on aspect ratio
            const getAspectContainerClass = (aspectRatio: string) => {
              switch (aspectRatio) {
                case "9:16":
                  return "aspect-[9/16] max-w-[200px] mx-auto"; // Vertical video, constrained width
                case "1:1":
                  return "aspect-square max-w-[300px] mx-auto"; // Square video
                case "16:9":
                default:
                  return "aspect-video w-full"; // Horizontal video
              }
            };

            return (
              <Card
                key={artifact.id}
                className="hover:shadow-lg transition-all duration-200"
              >
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-purple-100 to-indigo-100 flex items-center justify-center">
                        <PlatformIcon className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 capitalize">
                          {data?.platform?.replace("_", " ")}
                        </h4>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <AspectIcon className="h-3 w-3" />
                          <span>{data.aspect_ratio}</span>
                        </div>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        openInCapCut(data.optimized_url, "platform")
                      }
                      className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                    >
                      <Edit3 className="h-3 w-3 mr-1" />
                      CapCut
                    </Button>
                  </div>

                  {data.optimized_url && (
                    <div
                      className={`bg-black rounded-lg overflow-hidden relative ${getAspectContainerClass(data.aspect_ratio)}`}
                    >
                      <video
                        src={data.optimized_url}
                        controls
                        className="w-full h-full object-cover"
                        poster=""
                      />
                      <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm"
                          onClick={() =>
                            openInCapCut(data.optimized_url, "platform")
                          }
                        >
                          <Edit3 className="h-4 w-4 mr-1" />
                          Edit in CapCut
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {data.text}
                      </p>
                    </div>

                    {data.applied_optimizations &&
                      data.applied_optimizations.length > 0 && (
                        <div>
                          <span className="text-xs font-medium text-gray-600 block mb-2">
                            Applied Optimizations:
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {data.applied_optimizations.map(
                              (optimization, idx) => (
                                <Badge
                                  key={idx}
                                  variant="outline"
                                  className="text-xs"
                                >
                                  {optimization}
                                </Badge>
                              )
                            )}
                          </div>
                        </div>
                      )}

                    {data.hashtags && data.hashtags.length > 0 && (
                      <div>
                        <span className="text-xs font-medium text-gray-600 block mb-2">
                          Hashtags:
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {data.hashtags.slice(0, 4).map((tag, idx) => (
                            <Badge
                              key={idx}
                              variant="secondary"
                              className="text-xs"
                            >
                              #{tag}
                            </Badge>
                          ))}
                          {data.hashtags.length > 4 && (
                            <Badge variant="secondary" className="text-xs">
                              +{data.hashtags.length - 4}
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    {(data.optimal_posting_time || data.target_audience) && (
                      <div className="grid grid-cols-1 gap-2 text-xs">
                        {data.optimal_posting_time && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <Clock className="h-3 w-3" />
                            <span>Best time: {data.optimal_posting_time}</span>
                          </div>
                        )}
                        {data.target_audience && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <Target className="h-3 w-3" />
                            <span>Audience: {data.target_audience}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        downloadVideo(
                          data.optimized_url,
                          `${data.platform}-optimized.mp4`
                        )
                      }
                      className="flex-1"
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Download
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        copyToClipboard(
                          data.optimized_url,
                          `platform-${artifact.id}`
                        )
                      }
                    >
                      {copiedItems.has(`platform-${artifact.id}`) ? (
                        <Check className="h-3 w-3 text-green-600" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => window.open(data.optimized_url, "_blank")}
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  };

  const renderContentGenerationArtifacts = () => {
    if (contentGenArtifacts.length === 0) {
      return (
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Generated Content
            </h3>
            <p className="text-gray-600 mb-4">
              Generate marketing content like case studies, blog posts, and
              social media content.
            </p>
            <Button
              onClick={() => goToAIStudio("content_generation")}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
            >
              <FileText className="h-4 w-4 mr-2" />
              Generate Content
            </Button>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-6">
        {contentGenArtifacts.map((artifact) => {
          const data = artifact.data as ContentGenerationData;
          const content = data?.generated_content || [];

          return (
            <div key={artifact.id} className="space-y-4">
              {content.map((item, index) => {
                const contentId = `${artifact.id}-${index}`;
                const isEditing = editingContent.hasOwnProperty(contentId);

                return (
                  <Card key={index}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">
                            {item.title}
                          </CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-xs">
                              {item.content_type}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {item.word_count} words
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(item.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {isEditing ? (
                            <>
                              <Button
                                size="sm"
                                onClick={() =>
                                  saveContent(contentId, artifact.id)
                                }
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <Save className="h-4 w-4 mr-1" />
                                Save
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => cancelEditing(contentId)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                startEditing(contentId, item.content)
                              }
                            >
                              <Edit3 className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                          )}

                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              copyToClipboard(item.content, `content-${index}`)
                            }
                          >
                            {copiedItems.has(`content-${index}`) ? (
                              <Check className="h-3 w-3 text-green-600" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {isEditing ? (
                        <textarea
                          value={editingContent[contentId]}
                          onChange={(e) =>
                            setEditingContent((prev) => ({
                              ...prev,
                              [contentId]: e.target.value,
                            }))
                          }
                          className="w-full min-h-[300px] p-3 border border-gray-300 rounded-md font-mono text-sm resize-vertical focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="Edit your content here..."
                        />
                      ) : (
                        <div className="prose prose-gray max-w-none">
                          {item.format === "markdown" ? (
                            <div
                              className="whitespace-pre-wrap"
                              dangerouslySetInnerHTML={{
                                __html: item.content
                                  ?.replace(/\n/g, "<br>")
                                  ?.replace(
                                    /\*\*(.*?)\*\*/g,
                                    "<strong>$1</strong>"
                                  )
                                  ?.replace(/\*(.*?)\*/g, "<em>$1</em>"),
                              }}
                            />
                          ) : (
                            <div className="whitespace-pre-wrap">
                              {item.content}
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          );
        })}
      </div>
    );
  };

  const renderStoryVideoArtifacts = () => {
    if (storyArtifacts.length === 0) {
      return (
        <Card>
          <CardContent className="p-8 text-center">
            <Video className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Story Videos
            </h3>
            <p className="text-gray-600 mb-4">
              Create engaging story videos that highlight key moments and
              emotional impact.
            </p>
            <Button
              onClick={() => goToAIStudio("story_mode_generation")}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
            >
              <Video className="h-4 w-4 mr-2" />
              Generate Story Videos
            </Button>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {storyArtifacts.map((artifact) => {
          const data = artifact.data as StoryVideoData;

          return (
            <Card
              key={artifact.id}
              className="hover:shadow-lg transition-all duration-200"
            >
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Video className="h-5 w-5 text-purple-600" />
                    Story Video
                  </h4>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openInCapCut(data.story_video_url, "story")}
                    className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                  >
                    <Edit3 className="h-3 w-3 mr-1" />
                    CapCut
                  </Button>
                </div>

                <div className="aspect-video bg-black rounded-lg overflow-hidden relative">
                  <video
                    src={data.story_video_url}
                    controls
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm"
                      onClick={() =>
                        openInCapCut(data.story_video_url, "story")
                      }
                    >
                      <Edit3 className="h-4 w-4 mr-1" />
                      Edit in CapCut
                    </Button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      downloadVideo(data.story_video_url, "story-video.mp4")
                    }
                    className="flex-1"
                  >
                    <Download className="h-3 w-3 mr-1" />
                    Download
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      copyToClipboard(
                        data.story_video_url,
                        `story-${artifact.id}`
                      )
                    }
                  >
                    {copiedItems.has(`story-${artifact.id}`) ? (
                      <Check className="h-3 w-3 text-green-600" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => window.open(data.story_video_url, "_blank")}
                  >
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </div>

                <div className="text-xs text-gray-500">
                  Created: {new Date(artifact.created_at).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  const renderEnhancementArtifacts = () => {
    if (enhancementArtifacts.length === 0) {
      return (
        <Card>
          <CardContent className="p-8 text-center">
            <Palette className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Video Enhancements
            </h3>
            <p className="text-gray-600 mb-4">
              Enhance video quality with AI-powered improvements like noise
              reduction, color correction, and stabilization.
            </p>
            <Button
              onClick={() => goToAIStudio("enhancement")}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
            >
              <Palette className="h-4 w-4 mr-2" />
              Enhance Video
            </Button>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {enhancementArtifacts.map((artifact) => {
          const data = artifact.data as EnhancementData;

          return (
            <Card
              key={artifact.id}
              className="hover:shadow-lg transition-all duration-200"
            >
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                      <Palette className="h-5 w-5 text-purple-600" />
                      Enhanced {data.media_type}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex items-center gap-1">
                        <Award className="h-3 w-3 text-yellow-500" />
                        <span className="text-xs text-gray-600">
                          Quality: {Math.round(data.quality_score * 100)}%
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      openInCapCut(data.enhanced_url, "enhancement")
                    }
                    className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                  >
                    <Edit3 className="h-3 w-3 mr-1" />
                    CapCut
                  </Button>
                </div>

                <div className="aspect-video bg-black rounded-lg overflow-hidden relative">
                  <video
                    src={data.enhanced_url}
                    controls
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm"
                      onClick={() =>
                        openInCapCut(data.enhanced_url, "enhancement")
                      }
                    >
                      <Edit3 className="h-4 w-4 mr-1" />
                      Edit in CapCut
                    </Button>
                  </div>
                </div>

                {data.applied_enhancements &&
                  data.applied_enhancements.length > 0 && (
                    <div>
                      <span className="text-xs font-medium text-gray-600 block mb-2">
                        Applied Enhancements:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {data.applied_enhancements.map((enhancement, idx) => (
                          <Badge
                            key={idx}
                            variant="secondary"
                            className="text-xs"
                          >
                            {enhancement}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      downloadVideo(data.enhanced_url, "enhanced-video.mp4")
                    }
                    className="flex-1"
                  >
                    <Download className="h-3 w-3 mr-1" />
                    Download
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      copyToClipboard(
                        data.enhanced_url,
                        `enhancement-${artifact.id}`
                      )
                    }
                  >
                    {copiedItems.has(`enhancement-${artifact.id}`) ? (
                      <Check className="h-3 w-3 text-green-600" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => window.open(data.enhanced_url, "_blank")}
                  >
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  const renderNarrationArtifacts = () => {
    if (narrationArtifacts.length === 0) {
      return (
        <Card>
          <CardContent className="p-8 text-center">
            <Mic className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Narration Audio
            </h3>
            <p className="text-gray-600 mb-4">
              Generate professional narration audio from testimonial text using
              AI voice synthesis.
            </p>
            <Button
              onClick={() => goToAIStudio("narration")}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
            >
              <Mic className="h-4 w-4 mr-2" />
              Generate Narration
            </Button>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {narrationArtifacts.map((artifact) => {
          const data = artifact.data as NarrationData;

          return (
            <Card
              key={artifact.id}
              className="hover:shadow-lg transition-all duration-200"
            >
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Mic className="h-5 w-5 text-purple-600" />
                    Narration Audio
                  </h4>
                  <div className="flex items-center gap-1">
                    <Award className="h-3 w-3 text-yellow-500" />
                    <span className="text-xs text-gray-600">
                      {Math.round(data.quality_score * 100)}%
                    </span>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-4">
                  <audio src={data.audio_url} controls className="w-full" />
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Duration:</span>
                    <p className="font-medium">
                      {formatTime(data.audio_duration_seconds)}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">Voice Provider:</span>
                    <p className="font-medium capitalize">
                      {data.voice_provider}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      downloadVideo(data.audio_url, "narration-audio.mp3")
                    }
                    className="flex-1"
                  >
                    <Download className="h-3 w-3 mr-1" />
                    Download Audio
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      copyToClipboard(
                        data.audio_url,
                        `narration-${artifact.id}`
                      )
                    }
                  >
                    {copiedItems.has(`narration-${artifact.id}`) ? (
                      <Check className="h-3 w-3 text-green-600" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => window.open(data.audio_url, "_blank")}
                  >
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  const renderTextPolishingArtifacts = () => {
    if (polishingArtifacts.length === 0) {
      return (
        <Card>
          <CardContent className="p-8 text-center">
            <Zap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Text Polishing
            </h3>
            <p className="text-gray-600 mb-4">
              Polish and refine testimonial text for better impact, clarity, and
              professional presentation.
            </p>
            <Button
              onClick={() => goToAIStudio("text_polishing")}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
            >
              <Zap className="h-4 w-4 mr-2" />
              Polish Text
            </Button>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-6">
        {polishingArtifacts.map((artifact) => {
          const data = artifact.data as TextPolishingData;
          const contentId = `polishing-${artifact.id}`;
          const isEditing = editingContent.hasOwnProperty(contentId);

          return (
            <Card key={artifact.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Zap className="h-5 w-5 text-purple-600" />
                      Polished Text
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {data.format}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {data.word_count} words
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(data.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isEditing ? (
                      <>
                        <Button
                          size="sm"
                          onClick={() => saveContent(contentId, artifact.id)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Save className="h-4 w-4 mr-1" />
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => cancelEditing(contentId)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => startEditing(contentId, data.content)}
                      >
                        <Edit3 className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                    )}

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        copyToClipboard(
                          data.content,
                          `polishing-copy-${artifact.id}`
                        )
                      }
                    >
                      {copiedItems.has(`polishing-copy-${artifact.id}`) ? (
                        <Check className="h-3 w-3 text-green-600" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <textarea
                    value={editingContent[contentId]}
                    onChange={(e) =>
                      setEditingContent((prev) => ({
                        ...prev,
                        [contentId]: e.target.value,
                      }))
                    }
                    className="w-full min-h-[200px] p-3 border border-gray-300 rounded-md text-sm resize-vertical focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Edit your polished content here..."
                  />
                ) : (
                  <div className="prose prose-gray max-w-none">
                    {data.format === "markdown" ? (
                      <div
                        className="whitespace-pre-wrap"
                        dangerouslySetInnerHTML={{
                          __html: data.content
                            ?.replace(/\n/g, "<br>")
                            ?.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                            ?.replace(/\*(.*?)\*/g, "<em>$1</em>"),
                        }}
                      />
                    ) : (
                      <div className="whitespace-pre-wrap">{data.content}</div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen ">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/dashboard")}
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <div>
                <p className="text-sm text-gray-500">
                  {testimonial.author_company && (
                    <>{testimonial.author_company} • </>
                  )}
                  {new Date(testimonial.created_at).toDateString()}
                  {testimonial.rating && (
                    <>
                      {" "}
                      • {testimonial.rating}/5{" "}
                      <Star className="h-3 w-3 text-yellow-400 inline fill-current" />
                    </>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {sentiment && (
                <Badge className={getSentimentColor(sentiment.label)}>
                  {sentiment?.label?.replace("_", " ")}
                </Badge>
              )}
              <Button variant="outline" size="sm">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="bg-white p-1 shadow-sm">
            <TabsTrigger
              value="overview"
              className="data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="artifacts"
              className="data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700"
            >
              Artifacts ({artifacts.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Main Content */}
              <div className="lg:col-span-3 space-y-6">
                {/* Video Player / Content Display */}
                <Card>
                  <CardContent className="p-0">
                    {isVideoTestimonial && testimonial.media_url ? (
                      <div className="space-y-4">
                        <div
                          ref={fullscreenRef}
                          className="aspect-video bg-black rounded-t-lg overflow-hidden relative"
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
                        <div className="p-6 space-y-4">
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
                              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                            />
                            <div className="flex justify-between text-xs text-gray-500">
                              <span>{formatTime(currentTime)}</span>
                              <span>{formatTime(duration)}</span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={handlePlayPause}
                              >
                                {isPlaying ? (
                                  <Pause className="h-4 w-4" />
                                ) : (
                                  <Play className="h-4 w-4" />
                                )}
                              </Button>

                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={toggleMute}
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
                                  className="w-20 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
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
                                className="text-sm border rounded px-2 py-1"
                              >
                                <option value={0.5}>0.5x</option>
                                <option value={1}>1x</option>
                                <option value={1.25}>1.25x</option>
                                <option value={1.5}>1.5x</option>
                                <option value={2}>2x</option>
                              </select>
                            </div>

                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  downloadVideo(
                                    testimonial.media_url!,
                                    "testimonial.mp4"
                                  )
                                }
                              >
                                <Download className="h-4 w-4 mr-2" />
                                Download
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={toggleFullscreen}
                              >
                                <Maximize className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-8">
                        <div className="flex items-center gap-3 mb-4">
                          <FileText className="h-6 w-6 text-purple-600" />
                          <h3 className="text-lg font-semibold text-gray-900">
                            Text Testimonial
                          </h3>
                        </div>
                        <div className="prose prose-gray max-w-none">
                          <p className="text-gray-700 leading-relaxed text-lg">
                            {testimonial.content || "No content available"}
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Transcript */}
                {isVideoTestimonial &&
                  testimonial.content &&
                  showTranscript && (
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <MessageSquare className="h-5 w-5" />
                            Transcript
                          </CardTitle>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowTranscript(!showTranscript)}
                          >
                            <EyeOff className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="prose prose-gray max-w-none">
                          <p className="text-gray-700 leading-relaxed">
                            {testimonial.content}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  )}
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Author Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Author Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-3">
                      {testimonial.author_avatar_url ? (
                        <img
                          src={testimonial.author_avatar_url}
                          alt={testimonial.author_name || "Author"}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-100 to-indigo-100 flex items-center justify-center">
                          <User className="h-6 w-6 text-purple-600" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-gray-900">
                          {testimonial.author_name || "Anonymous"}
                        </p>
                        {testimonial.author_title && (
                          <p className="text-sm text-gray-600">
                            {testimonial.author_title}
                          </p>
                        )}
                      </div>
                    </div>

                    {testimonial.author_company && (
                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        <Building2 className="h-4 w-4" />
                        <span>{testimonial.author_company}</span>
                      </div>
                    )}

                    {testimonial.author_email && (
                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        <Mail className="h-4 w-4" />
                        <span>{testimonial.author_email}</span>
                      </div>
                    )}

                    {testimonial.rating && (
                      <div className="pt-3 border-t">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium">Rating:</span>
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i < testimonial.rating!
                                    ? "text-yellow-400 fill-current"
                                    : "text-gray-300"
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <span className="text-2xl font-bold text-gray-900">
                          {testimonial.rating}/5
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Quick Stats */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Quick Stats</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Type</span>
                      <Badge
                        variant={isVideoTestimonial ? "default" : "secondary"}
                      >
                        {testimonial?.type?.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Status</span>
                      <Badge variant="outline">{testimonial.status}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Collection</span>
                      <span className="text-sm font-medium">
                        {testimonial.collection_method}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Artifacts</span>
                      <span className="text-sm font-medium">
                        {artifacts.length}
                      </span>
                    </div>
                    {testimonial.tags && testimonial.tags.length > 0 && (
                      <div>
                        <span className="text-sm text-gray-600 block mb-2">
                          Tags
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {testimonial.tags.map((tag, index) => (
                            <Badge
                              key={index}
                              variant="outline"
                              className="text-xs"
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="artifacts" className="space-y-6">
            <Tabs
              value={activeArtifactTab}
              onValueChange={setActiveArtifactTab}
            >
              <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
                <TabsTrigger value="sentiment" className="text-xs">
                  Sentiment
                </TabsTrigger>
                <TabsTrigger value="clipping" className="text-xs">
                  Clips
                </TabsTrigger>
                <TabsTrigger value="platform" className="text-xs">
                  Platform
                </TabsTrigger>
                <TabsTrigger value="content" className="text-xs">
                  Content
                </TabsTrigger>
                <TabsTrigger value="story" className="text-xs">
                  Story
                </TabsTrigger>
                <TabsTrigger value="enhancement" className="text-xs">
                  Enhancement
                </TabsTrigger>
                <TabsTrigger value="polishing" className="text-xs">
                  Polishing
                </TabsTrigger>
                <TabsTrigger value="narration" className="text-xs">
                  Narration
                </TabsTrigger>
              </TabsList>

              <TabsContent value="sentiment">
                {renderSentimentAnalysis()}
              </TabsContent>
              <TabsContent value="clipping">
                {renderClippingArtifacts()}
              </TabsContent>
              <TabsContent value="platform">
                {renderPlatformOptimizationArtifacts()}
              </TabsContent>
              <TabsContent value="content">
                {renderContentGenerationArtifacts()}
              </TabsContent>
              <TabsContent value="story">
                {/* {renderGenericArtifactTab(
                  "Story Videos",
                  Video,
                  storyArtifacts,
                  "story_mode_generation",
                  "Create engaging story videos that highlight key moments and impact."
                )} */}
                {renderStoryVideoArtifacts()}
              </TabsContent>
              <TabsContent value="enhancement">
                {/* {renderGenericArtifactTab(
                  "Video Enhancement",
                  Palette,
                  enhancementArtifacts,
                  "enhancement",
                  "Enhance video quality with AI-powered improvements."
                )} */}
                {renderEnhancementArtifacts()}
              </TabsContent>
              <TabsContent value="polishing">
                {/* {renderGenericArtifactTab(
                  "Text Polishing",
                  Zap,
                  polishingArtifacts,
                  "text_polishing",
                  "Polish and refine testimonial text for better impact."
                )} */}
                {renderTextPolishingArtifacts()}
              </TabsContent>
              <TabsContent value="narration">
                {/* {renderGenericArtifactTab(
                  "Narration Audio",
                  Mic,
                  narrationArtifacts,
                  "narration",
                  "Generate professional narration audio from testimonial text."
                )} */}
                {renderNarrationArtifacts()}
              </TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
});

export default TestimonialDetail;
