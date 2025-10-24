// pages/PublicShareView.tsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { observer } from "mobx-react-lite";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Download,
  Share2,
  ArrowRight,
  Star,
  Calendar,
  User,
  Building2,
  Heart,
  Loader2,
  AlertCircle,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { shareManager } from "@/repo/managers/share_manager";
import type { PublicShare } from "@/repo/managers/share_manager";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/custom/footer";
import { useToast } from "@/hooks/use-toast";

interface PublicShareContent {
  share: PublicShare & { description?: string };
  testimonial?: {
    id: string;
    author_name?: string;
    author_email?: string;
    author_company?: string;
    author_role?: string;
    rating?: number;
    video_url?: string;
    audio_url?: string;
    text_content?: string;
    created_at: string;
    transcript?: string;
  };
  artifact?: {
    id: string;
    artifact_type?: string;
    asset_url?: string;
    content?: string;
    content_type?: string;
    processing_type?: string;
    created_at: string;
  };
}

const PublicShareView = observer(() => {
  const { shareId } = useParams<{ shareId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [content, setContent] = useState<PublicShareContent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(
    null
  );

  useEffect(() => {
    if (!shareId) {
      setError("Share link is invalid");
      setIsLoading(false);
      return;
    }

    loadShareContent();
  }, [shareId]);

  const loadShareContent = async () => {
    if (!shareId) return;

    try {
      setIsLoading(true);
      setError(null);

      // Fetch share content from public endpoint
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/share/${shareId}/view`
      );

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Share link not found or has expired");
        }
        throw new Error("Failed to load shared content");
      }

      const data = await response.json();
      console.log("PublicShareView - API Response:", JSON.stringify(data, null, 2));
      setContent(data);

      // Track view event (with UUID visitor ID from localStorage or generate new one)
      let visitorId = localStorage.getItem("visitor_id");

      // Validate existing visitor ID - must be a proper UUID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!visitorId || !uuidRegex.test(visitorId)) {
        // Generate a proper UUID v4
        visitorId = crypto.randomUUID();
        localStorage.setItem("visitor_id", visitorId);
      }

      await shareManager.trackEvent(shareId, {
        event_type: "view",
        visitor_id: visitorId,
        referrer: document.referrer,
        user_agent: navigator.userAgent,
      });
    } catch (err: any) {
      console.error("Failed to load share content:", err);
      setError(err.message || "Failed to load content");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlayPause = async () => {
    if (!videoElement || !shareId) return;

    if (isPlaying) {
      videoElement.pause();
      setIsPlaying(false);
    } else {
      await videoElement.play();
      setIsPlaying(true);

      // Track play event
      const visitorId = localStorage.getItem("visitor_id");
      await shareManager.trackEvent(shareId, {
        event_type: "play",
        visitor_id: visitorId || undefined,
      });
    }
  };

  const handleMuteToggle = () => {
    if (!videoElement) return;
    videoElement.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleFullscreen = () => {
    if (!videoElement) return;
    if (videoElement.requestFullscreen) {
      videoElement.requestFullscreen();
    }
  };

  const handleDownload = async () => {
    const videoUrl = content?.testimonial?.video_url || content?.artifact?.asset_url;
    if (!videoUrl || !shareId) return;

    try {
      const link = document.createElement("a");
      link.href = videoUrl;
      link.download = `content_${shareId}.mp4`;
      link.click();

      // Track download event
      const visitorId = localStorage.getItem("visitor_id");
      await shareManager.trackEvent(shareId, {
        event_type: "download",
        visitor_id: visitorId || undefined,
      });

      toast({
        title: "Download Started",
        description: "Your video is downloading",
      });
    } catch (err) {
      console.error("Download failed:", err);
      toast({
        title: "Download Failed",
        description: "Failed to download video",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Generate Open Graph meta tags
  const getMetaTags = () => {
    if (!content) return null;

    const { testimonial, artifact } = content;
    const currentUrl = window.location.href;
    const appUrl = import.meta.env.VITE_APP_URL || window.location.origin;

    // Default meta tags
    let title = "Customer Testimonial | Cenphi";
    let description =
      "See what our customers are saying about their experience";
    let imageUrl = `${appUrl}/og-default.jpg`; // Default OG image
    let videoUrl = "";

    // Customize based on content type
    if (testimonial) {
      const authorName = testimonial.author_name || "A customer";
      const company = testimonial.author_company
        ? ` from ${testimonial.author_company}`
        : "";

      title = `Testimonial from ${authorName}${company} | Cenphi`;

      if (testimonial.text_content) {
        description = testimonial.text_content.substring(0, 160);
      } else if (testimonial.transcript) {
        description = testimonial.transcript.substring(0, 160);
      }

      if (testimonial.video_url) {
        videoUrl = testimonial.video_url;
        // For video testimonials, you might want to generate a thumbnail
        // imageUrl = `${appUrl}/api/thumbnails/${testimonial.id}`;
      }
    } else if (artifact) {
      title = `${artifact?.artifact_type?.replace("_", " ").toUpperCase()} | Cenphi`;
      if (artifact.content) {
        description = artifact.content.substring(0, 160);
      }
    }

    return {
      title,
      description,
      imageUrl,
      videoUrl,
      currentUrl,
    };
  };

  const metaTags = getMetaTags();

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading shared content...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Error state
  if (error || !content) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="max-w-md mx-4">
            <CardContent className="pt-6 text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Content Unavailable
              </h2>
              <p className="text-gray-600 mb-6">
                {error || "This share link is no longer available."}
              </p>
              <Button onClick={() => navigate("/")} className="bg-blue-600">
                Go to Homepage
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  // Check if share is expired or inactive
  if (
    !content.share.is_active ||
    (content.share.expires_at &&
      new Date(content.share.expires_at) < new Date())
  ) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="max-w-md mx-4">
            <CardContent className="pt-6 text-center">
              <Clock className="h-12 w-12 text-orange-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Link Expired
              </h2>
              <p className="text-gray-600 mb-6">
                This share link has expired or is no longer active.
              </p>
              <Button onClick={() => navigate("/")} className="bg-blue-600">
                Go to Homepage
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  const { testimonial, artifact } = content;

  return (
    <div className="min-h-screen bg-white">
      {/* SEO and Open Graph Meta Tags */}
      {metaTags && (
        <Helmet>
          {/* Basic Meta Tags */}
          <title>{metaTags.title}</title>
          <meta name="description" content={metaTags.description} />

          {/* Open Graph Meta Tags */}
          <meta property="og:type" content="website" />
          <meta property="og:url" content={metaTags.currentUrl} />
          <meta property="og:title" content={metaTags.title} />
          <meta property="og:description" content={metaTags.description} />
          <meta property="og:image" content={metaTags.imageUrl} />
          <meta property="og:site_name" content="Cenphi" />

          {/* Video OG tags if video testimonial */}
          {metaTags.videoUrl && (
            <>
              <meta property="og:video" content={metaTags.videoUrl} />
              <meta
                property="og:video:secure_url"
                content={metaTags.videoUrl}
              />
              <meta property="og:video:type" content="video/mp4" />
            </>
          )}

          {/* Twitter Card Meta Tags */}
          <meta
            name="twitter:card"
            content={metaTags.videoUrl ? "player" : "summary_large_image"}
          />
          <meta name="twitter:url" content={metaTags.currentUrl} />
          <meta name="twitter:title" content={metaTags.title} />
          <meta name="twitter:description" content={metaTags.description} />
          <meta name="twitter:image" content={metaTags.imageUrl} />

          {/* Twitter video player tags */}
          {metaTags.videoUrl && (
            <>
              <meta name="twitter:player" content={metaTags.currentUrl} />
              <meta name="twitter:player:width" content="1280" />
              <meta name="twitter:player:height" content="720" />
            </>
          )}

          {/* Additional Meta Tags */}
          <meta name="robots" content="index, follow" />
          <link rel="canonical" href={metaTags.currentUrl} />
        </Helmet>
      )}

      <Navbar />

      {/* Main Content */}
      <section className="pt-24 pb-16 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
              Customer Testimonial
            </h1>
            {content.share.description ? (
              <div className="max-w-2xl mx-auto">
                <p className="text-gray-700 text-base leading-relaxed whitespace-pre-line">
                  {content.share.description}
                </p>
              </div>
            ) : (
              <p className="text-gray-600 max-w-2xl mx-auto">
                See what our customers are saying about their experience
              </p>
            )}
          </motion.div>

          {/* Video Testimonial or Artifact */}
          {(testimonial?.video_url || (artifact?.asset_url && artifact?.content_type?.startsWith('video'))) && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-8"
            >
              <Card className="overflow-hidden border-gray-200 shadow-lg">
                <div className="relative bg-black aspect-video">
                  <video
                    ref={setVideoElement}
                    src={testimonial?.video_url || artifact?.asset_url}
                    className="w-full h-full"
                    onEnded={() => setIsPlaying(false)}
                    playsInline
                  />

                  {/* Video Controls Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                    <div className="flex items-center gap-3">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handlePlayPause}
                        className="text-white hover:bg-white/20"
                      >
                        {isPlaying ? (
                          <Pause className="h-5 w-5" />
                        ) : (
                          <Play className="h-5 w-5" />
                        )}
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleMuteToggle}
                        className="text-white hover:bg-white/20"
                      >
                        {isMuted ? (
                          <VolumeX className="h-5 w-5" />
                        ) : (
                          <Volume2 className="h-5 w-5" />
                        )}
                      </Button>

                      <div className="flex-1" />

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleDownload}
                        className="text-white hover:bg-white/20"
                      >
                        <Download className="h-5 w-5" />
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleFullscreen}
                        className="text-white hover:bg-white/20"
                      >
                        <Maximize className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}

          {/* Testimonial Details */}
          {testimonial && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="grid md:grid-cols-3 gap-6 mb-8"
            >
              {/* Author Info */}
              <Card className="md:col-span-2 border-gray-200">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="h-8 w-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900">
                        {testimonial.author_name || "Anonymous"}
                      </h3>
                      {testimonial.author_role && (
                        <p className="text-gray-600 text-sm">
                          {testimonial.author_role}
                        </p>
                      )}
                      {testimonial.author_company && (
                        <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                          <Building2 className="h-4 w-4" />
                          {testimonial.author_company}
                        </div>
                      )}
                    </div>
                    {testimonial.rating && (
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-5 w-5 ${
                              i < testimonial.rating!
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  {testimonial.text_content && (
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                      <p className="text-gray-700 leading-relaxed">
                        "{testimonial.text_content}"
                      </p>
                    </div>
                  )}

                  {testimonial.transcript && !testimonial.text_content && (
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                      <p className="text-sm text-gray-600 mb-2 font-medium">
                        Transcript:
                      </p>
                      <p className="text-gray-700 leading-relaxed text-sm">
                        {testimonial.transcript}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center gap-2 mt-4 text-sm text-gray-500">
                    <Calendar className="h-4 w-4" />
                    {formatDate(testimonial.created_at)}
                  </div>
                </CardContent>
              </Card>

              {/* Sidebar */}
              <div className="space-y-4">
                {/* Call to Action */}
                <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-white">
                  <CardContent className="pt-6 text-center">
                    <Heart className="h-10 w-10 text-blue-600 mx-auto mb-3" />
                    <h4 className="font-semibold text-gray-900 mb-2">
                      Love what you see?
                    </h4>
                    <p className="text-sm text-gray-600 mb-4">
                      Start collecting powerful testimonials like this for your
                      business
                    </p>
                    <Button
                      onClick={() => navigate("/signup")}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                      Get Started Free
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>

                {/* Share Options */}
                <Card className="border-gray-200">
                  <CardContent className="pt-6">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Share2 className="h-4 w-4" />
                      Share This
                    </h4>
                    <div className="space-y-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => {
                          navigator.clipboard.writeText(window.location.href);
                          toast({
                            title: "Link Copied!",
                            description: "Share link copied to clipboard",
                          });
                        }}
                      >
                        Copy Link
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => {
                          const text = `Check out this testimonial: ${window.location.href}`;
                          window.open(
                            `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`,
                            "_blank"
                          );
                        }}
                      >
                        Share on Twitter
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => {
                          window.open(
                            `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`,
                            "_blank"
                          );
                        }}
                      >
                        Share on LinkedIn
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          )}

          {/* Artifact Content (Non-video artifacts) */}
          {artifact && !testimonial && !(artifact.asset_url && artifact.content_type?.startsWith('video')) && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="border-gray-200">
                <CardContent className="pt-6">
                  <div className="mb-4">
                    <Badge className="mb-2">
                      {(artifact.processing_type || artifact.artifact_type || 'Content')
                        .replace("_", " ")
                        .toUpperCase()}
                    </Badge>
                    <p className="text-sm text-gray-500">
                      {formatDate(artifact.created_at)}
                    </p>
                  </div>

                  {artifact.content && (
                    <div className="bg-gray-50 rounded-lg p-6 border border-gray-100">
                      <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {artifact.content}
                      </p>
                    </div>
                  )}

                  {artifact.asset_url && (
                    <div className="mt-4">
                      <Button
                        onClick={() =>
                          window.open(artifact.asset_url, "_blank")
                        }
                        className="bg-blue-600"
                      >
                        View Artifact
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Trust Indicators */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex justify-center gap-6 text-sm text-gray-500 pt-8 border-t border-gray-200"
          >
            <span className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
              Authentic testimonial
            </span>
            <span className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
              Verified customer
            </span>
            <span className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
              Real results
            </span>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
});

export default PublicShareView;
