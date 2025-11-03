// pages/PublicShowcase.tsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Masonry from "react-masonry-css";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import {
  Globe,
  Building2,
  Loader2,
  Play,
  Quote,
  ExternalLink,
  Star,
  Calendar,
  MessageSquare,
  X,
  ChevronRight,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { showcaseService } from "@/services/showcaseService";
import { Workspace, TestimonialArtifact } from "@/types/testimonial";
import { formatDistanceToNow } from "date-fns";
import {
  categorizeArtifact,
  CONTENT_CATEGORIES,
} from "@/components/ai-generated-content/ContentCategorization";

const PublicShowcase: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [artifacts, setArtifacts] = useState<TestimonialArtifact[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [selectedTextContent, setSelectedTextContent] = useState<{
    text: string;
    title?: string;
  } | null>(null);

  useEffect(() => {
    const loadShowcase = async () => {
      if (!slug) {
        setError("Invalid showcase URL");
        setLoading(false);
        return;
      }

      try {
        const data = await showcaseService.getPublicShowcase(slug);
        setWorkspace(data.workspace as any);

        // Filter out intermediate processing artifacts - only show finished content
        const displayableArtifacts = (data.artifacts as any[]).filter(
          (artifact) =>
            artifact.processing_type !== "sentiment_analysis" &&
            artifact.processing_type !== "highlight_extraction" &&
            artifact.processing_type !== "clipping" &&
            artifact.processing_type !== "enhancement" &&
            artifact.processing_type !== "viral_analysis" &&
            artifact.processing_type !== "translation" &&
            artifact.processing_type !== "narration" &&
            artifact.processing_type !== "text_polishing"
        );

        setArtifacts(displayableArtifacts);

        // Set page title and meta
        document.title = `${(data.workspace as any).name} - Customer Testimonials`;
      } catch (err: any) {
        setError(err.message || "Showcase not found");
      } finally {
        setLoading(false);
      }
    };

    loadShowcase();
  }, [slug]);

  const openTextModal = (text: string, title?: string) => {
    setSelectedTextContent({ text, title });
  };

  // Helper function to detect if text contains markdown syntax
  const isMarkdown = (text: string): boolean => {
    const markdownPatterns = [
      /^#{1,6}\s/m, // Headers
      /\*\*.*\*\*/, // Bold
      /\*.*\*/, // Italic
      /^\s*[-*+]\s/m, // Unordered lists
      /^\s*\d+\.\s/m, // Ordered lists
      /\[.*\]\(.*\)/, // Links
      /`.*`/, // Inline code
      /^```/m, // Code blocks
      /^>/m, // Blockquotes
    ];
    return markdownPatterns.some((pattern) => pattern.test(text));
  };

  // Helper function to format plain text with proper paragraphs
  const formatPlainText = (text: string): string => {
    // Split on double line breaks to create paragraphs
    return text
      .split(/\n\n+/)
      .map((paragraph) => paragraph.trim())
      .filter((paragraph) => paragraph.length > 0)
      .join("\n\n");
  };

  // Group artifacts by category for better organization - MUST be before any returns
  const groupedArtifacts = React.useMemo(() => {
    const groups = new Map<string, TestimonialArtifact[]>();

    artifacts.forEach((artifact) => {
      const category = categorizeArtifact(artifact);
      const categoryId = category.id;

      if (!groups.has(categoryId)) {
        groups.set(categoryId, []);
      }
      groups.get(categoryId)!.push(artifact);
    });

    return groups;
  }, [artifacts]);

  const breakpointColumns = {
    default: 3,
    1280: 3,
    1024: 2,
    768: 1,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <Loader2 className="h-10 w-10 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-sm text-slate-600 font-medium">
            Loading showcase...
          </p>
        </motion.div>
      </div>
    );
  }

  if (error || !workspace) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Globe className="h-10 w-10 text-blue-500" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-3">
            Showcase Not Found
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            {error ||
              "The showcase you're looking for doesn't exist or has been disabled."}
          </p>
        </motion.div>
      </div>
    );
  }

  const videoCount = artifacts.filter((a) =>
    a.content_type?.includes("video")
  ).length;
  const textCount = artifacts.length - videoCount;

  // Extract logo and brand info from workspace
  const brandContext = workspace.brand_context || {};
  const logoUrl =
    brandContext.logo_url || workspace.settings?.logo?.main || null;
  const aboutInfo = brandContext.about_info || "";
  const tagline = brandContext.tagline || "";

  return (
    <>
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative w-full overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900"
      >
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.3),rgba(255,255,255,0))]" />
        </div>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="flex flex-col items-center text-center">
            {/* Logo/Avatar */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center shadow-lg mb-4 border border-white/20 overflow-hidden"
            >
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={`${workspace.name} logo`}
                  className="w-full h-full object-contain p-2"
                />
              ) : (
                <span className="text-xl sm:text-2xl font-semibold text-white">
                  {workspace.name.charAt(0).toUpperCase()}
                </span>
              )}
            </motion.div>

            {/* Company Name */}
            <motion.h1
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-3"
            >
              {workspace.name}
            </motion.h1>

            {/* Tagline / Industry */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="flex flex-wrap items-center justify-center gap-2 mb-4"
            >
              {workspace.industry && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20">
                  <Building2 className="h-3 w-3 text-blue-300" />
                  <span className="text-xs text-white/90 font-medium">
                    {workspace.industry}
                  </span>
                </div>
              )}
              {workspace.website_url && (
                <a
                  href={workspace.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 transition-all duration-300"
                >
                  <Globe className="h-3 w-3 text-blue-300" />
                  <span className="text-xs text-white/90 font-medium">
                    Visit Website
                  </span>
                  <ExternalLink className="h-2.5 w-2.5 text-blue-300" />
                </a>
              )}
            </motion.div>

            {/* Tagline */}
            {tagline && (
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.5 }}
                className="text-sm sm:text-base text-white/90 font-medium mb-3 italic"
              >
                "{tagline}"
              </motion.p>
            )}

            {/* About / Description */}
            {aboutInfo && (
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.5 }}
                className="max-w-2xl text-xs sm:text-sm text-white/80 leading-relaxed mb-6"
              >
                {aboutInfo}
              </motion.p>
            )}

            {/* Stats */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="flex flex-wrap items-center justify-center gap-4 sm:gap-8"
            >
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-white mb-0.5">
                  {artifacts.length}
                </div>
                <div className="text-[10px] sm:text-xs text-white/70 font-medium">
                  {artifacts.length === 1 ? "Testimonial" : "Testimonials"}
                </div>
              </div>
              {videoCount > 0 && (
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-white mb-0.5">
                    {videoCount}
                  </div>
                  <div className="text-[10px] sm:text-xs text-white/70 font-medium">
                    {videoCount === 1 ? "Video" : "Videos"}
                  </div>
                </div>
              )}
              {textCount > 0 && (
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-white mb-0.5">
                    {textCount}
                  </div>
                  <div className="text-[10px] sm:text-xs text-white/70 font-medium">
                    {textCount === 1 ? "Story" : "Stories"}
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>

        {/* Wave Divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg
            viewBox="0 0 1440 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-12 sm:h-20"
          >
            <path
              d="M0 0L60 10C120 20 240 40 360 46.7C480 53 600 47 720 43.3C840 40 960 40 1080 46.7C1200 53 1320 67 1380 73.3L1440 80V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0V0Z"
              fill="rgb(248 250 252)"
            />
          </svg>
        </div>
      </motion.div>

      {/* Main Content Wrapper */}
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
        {/* Content Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
        {artifacts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20"
          >
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center mx-auto mb-6 shadow-lg">
              <Quote className="h-10 w-10 text-blue-500" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">
              No Testimonials Yet
            </h3>
            <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
              This showcase doesn't have any published testimonials at the
              moment. Check back soon!
            </p>
          </motion.div>
        ) : (
          <>
            {/* Section Title */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-center mb-16"
            >
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3">
                What Our Customers Say
              </h2>
              <p className="text-xs text-slate-600 max-w-2xl mx-auto">
                Real stories from real people who love what we do.
              </p>
            </motion.div>

            {/* Grouped Content by Category */}
            <div className="space-y-16">
              {CONTENT_CATEGORIES.map((category, catIndex) => {
                const categoryArtifacts = groupedArtifacts.get(category.id);
                if (!categoryArtifacts || categoryArtifacts.length === 0)
                  return null;

                const CategoryIcon = category.icon;

                return (
                  <motion.div
                    key={category.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * catIndex, duration: 0.5 }}
                  >
                    {/* Category Header */}
                    <div className="flex items-center gap-3 mb-6">
                      <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-white shadow-sm border border-slate-100">
                        <div className={`p-2 rounded-lg ${category.color}`}>
                          <CategoryIcon className="h-4 w-4" />
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-slate-900">
                            {category.label}
                          </h3>
                          <p className="text-[10px] text-slate-500">
                            {categoryArtifacts.length}{" "}
                            {categoryArtifacts.length === 1 ? "item" : "items"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Category Content - Masonry Grid */}
                    <Masonry
                      breakpointCols={breakpointColumns}
                      className="flex -ml-6 w-auto"
                      columnClassName="pl-6 bg-clip-padding"
                    >
                      {categoryArtifacts.map((artifact, index) => {
                        const isVideo =
                          artifact.asset_url &&
                          artifact.content_type?.includes("video");
                        const textContent = artifact.text_content || "";
                        const isLongText = textContent.length > 300;

                        return (
                          <motion.div
                            key={artifact.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05, duration: 0.4 }}
                            className="mb-6"
                          >
                            <Card className="group hover:shadow-2xl transition-all duration-500 border-0 shadow-md overflow-hidden bg-white">
                              {/* Video Content */}
                              {isVideo && (
                                <div className="relative aspect-video bg-gradient-to-br from-slate-900 to-slate-800 overflow-hidden">
                                  <video
                                    src={artifact.asset_url}
                                    className="w-full h-full object-cover"
                                    muted
                                    playsInline
                                    poster={artifact.data?.thumbnail_url}
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                                  {/* Play Button */}
                                  <button
                                    onClick={() =>
                                      setSelectedVideo(artifact.asset_url!)
                                    }
                                    className="absolute inset-0 flex items-center justify-center group/play"
                                  >
                                    <div className="relative">
                                      <div className="absolute inset-0 bg-white rounded-full blur-xl opacity-50 group-hover/play:opacity-75 transition-opacity" />
                                      <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/95 backdrop-blur-sm flex items-center justify-center shadow-2xl group-hover/play:scale-110 transition-transform duration-300">
                                        <Play
                                          className="h-7 w-7 sm:h-9  text-slate-900 ml-1"
                                          fill="currentColor"
                                        />
                                      </div>
                                    </div>
                                  </button>

                                  {/* Duration Badge */}
                                  {artifact.data?.duration && (
                                    <div className="absolute bottom-3 right-3">
                                      <Badge className="bg-black/60 backdrop-blur-md border-0 text-white text-xs px-2 py-1">
                                        {Math.floor(
                                          artifact.data.duration / 60
                                        )}
                                        :
                                        {String(
                                          Math.floor(
                                            artifact.data.duration % 60
                                          )
                                        ).padStart(2, "0")}
                                      </Badge>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Text Content Section */}
                              {textContent && (
                                <div className="p-6">
                                  {/* Quote Icon */}
                                  {!isVideo && (
                                    <div className="mb-4">
                                      <Quote className="h-8 w-8 text-blue-500/20" />
                                    </div>
                                  )}

                                  {/* Content Text Preview */}
                                  <div className="mb-4">
                                    <p className="text-sm text-slate-700 leading-relaxed">
                                      {isLongText
                                        ? `${textContent.slice(0, 300)}...`
                                        : textContent}
                                    </p>
                                    {isLongText && (
                                      <button
                                        onClick={() =>
                                          openTextModal(
                                            textContent,
                                            artifact.platform ||
                                              artifact.processing_type
                                          )
                                        }
                                        className="mt-3 text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 group/read"
                                      >
                                        Read more
                                        <ChevronRight className="h-3 w-3 transition-transform group-hover/read:translate-x-0.5" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Metadata Footer - Always at bottom */}
                              {(isVideo || textContent) && (
                                <div className="p-6 pt-0">
                                  <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      {/* Platform Badge */}
                                      {artifact.platform && (
                                        <Badge
                                          variant="secondary"
                                          className="bg-slate-100 text-slate-700 border-0 text-xs px-2 py-0.5"
                                        >
                                          {artifact.platform}
                                        </Badge>
                                      )}

                                      {/* Processing Type Badge */}
                                      {artifact.processing_type && (
                                        <Badge
                                          variant="outline"
                                          className="border-slate-200 text-slate-600 text-xs px-2 py-0.5"
                                        >
                                          {artifact.processing_type.replace(
                                            /_/g,
                                            " "
                                          )}
                                        </Badge>
                                      )}
                                    </div>

                                    {/* Date - Only show if recent (within 90 days) */}
                                    {artifact.created_at &&
                                      new Date(artifact.created_at) >
                                        new Date(
                                          Date.now() - 90 * 24 * 60 * 60 * 1000
                                        ) && (
                                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                          <Calendar className="h-3 w-3" />
                                          <span>
                                            {formatDistanceToNow(
                                              new Date(artifact.created_at),
                                              {
                                                addSuffix: true,
                                              }
                                            )}
                                          </span>
                                        </div>
                                      )}
                                  </div>
                                </div>
                              )}
                            </Card>
                          </motion.div>
                        );
                      })}
                    </Masonry>
                  </motion.div>
                );
              })}
            </div>
          </>
        )}
        </div>

        {/* Footer */}
        <footer className="border-t border-slate-200 bg-white/80 backdrop-blur-sm mt-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-xs text-slate-600">
                © {new Date().getFullYear()} {workspace.name}. All rights
                reserved.
              </p>
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                <span className="text-xs text-slate-600 font-medium">
                  Trusted by our customers
                </span>
              </div>
            </div>
          </div>
        </footer>
      </div>

      {/* Video Modal */}
      <AnimatePresence>
        {selectedVideo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedVideo(null)}
            className="fixed inset-0 bg-black/95 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-5xl"
            >
              <button
                onClick={() => setSelectedVideo(null)}
                className="absolute -top-14 right-0 w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all duration-300"
              >
                <X className="h-5 w-5" />
              </button>
              <video
                src={selectedVideo}
                controls
                autoPlay
                className="w-full rounded-xl shadow-2xl"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Text Content Modal */}
      <AnimatePresence>
        {selectedTextContent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedTextContent(null)}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="sticky top-0 bg-gradient-to-r from-slate-900 via-blue-900 to-purple-900 px-6 sm:px-8 py-5 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-white/10 backdrop-blur-sm">
                      <MessageSquare className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-white">
                        {selectedTextContent.title
                          ? selectedTextContent.title
                              .replace(/_/g, " ")
                              .charAt(0)
                              .toUpperCase() +
                            selectedTextContent.title
                              .replace(/_/g, " ")
                              .slice(1)
                          : "Full Content"}
                      </h3>
                      <p className="text-xs text-white/70 mt-0.5">
                        Complete testimonial text
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedTextContent(null)}
                    className="w-9 h-9 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all duration-300"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="px-6 sm:px-8 py-8 max-h-[calc(80vh-120px)] overflow-y-auto">
                <div className="prose prose-slate prose-sm max-w-none">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm, remarkBreaks]}
                    components={{
                      // Custom styling for markdown elements
                      h1: ({ node, ...props }) => (
                        <h1
                          className="text-xl font-bold text-slate-900 mb-4 mt-6 first:mt-0"
                          {...props}
                        />
                      ),
                      h2: ({ node, ...props }) => (
                        <h2
                          className="text-lg font-bold text-slate-900 mb-3 mt-5 first:mt-0"
                          {...props}
                        />
                      ),
                      h3: ({ node, ...props }) => (
                        <h3
                          className="text-base font-semibold text-slate-900 mb-2 mt-4 first:mt-0"
                          {...props}
                        />
                      ),
                      p: ({ node, ...props }) => (
                        <p
                          className="mb-5 text-sm text-slate-700 leading-[1.8]"
                          {...props}
                        />
                      ),
                      ul: ({ node, ...props }) => (
                        <ul
                          className="list-disc list-inside mb-4 space-y-2 text-sm text-slate-700"
                          {...props}
                        />
                      ),
                      ol: ({ node, ...props }) => (
                        <ol
                          className="list-decimal list-inside mb-4 space-y-2 text-sm text-slate-700"
                          {...props}
                        />
                      ),
                      li: ({ node, ...props }) => (
                        <li
                          className="text-sm text-slate-700 leading-[1.8]"
                          {...props}
                        />
                      ),
                      blockquote: ({ node, ...props }) => (
                        <blockquote
                          className="border-l-4 border-blue-500 pl-4 py-2 mb-4 italic text-sm text-slate-600"
                          {...props}
                        />
                      ),
                      code: ({ node, inline, ...props }: any) =>
                        inline ? (
                          <code
                            className="bg-slate-100 px-1.5 py-0.5 rounded text-xs text-slate-900 font-mono"
                            {...props}
                          />
                        ) : (
                          <code
                            className="block bg-slate-100 p-3 rounded-lg text-xs text-slate-900 font-mono overflow-x-auto mb-4"
                            {...props}
                          />
                        ),
                      pre: ({ node, ...props }) => (
                        <pre
                          className="bg-slate-100 p-3 rounded-lg overflow-x-auto mb-4"
                          {...props}
                        />
                      ),
                      strong: ({ node, ...props }) => (
                        <strong
                          className="font-semibold text-slate-900"
                          {...props}
                        />
                      ),
                      em: ({ node, ...props }) => (
                        <em className="italic text-slate-700" {...props} />
                      ),
                      a: ({ node, ...props }) => (
                        <a
                          className="text-blue-600 hover:text-blue-700 underline"
                          target="_blank"
                          rel="noopener noreferrer"
                          {...props}
                        />
                      ),
                      hr: ({ node, ...props }) => (
                        <hr className="my-6 border-slate-200" {...props} />
                      ),
                      // Handle line breaks in plain text
                      br: ({ node, ...props }) => (
                        <br className="block mb-2" {...props} />
                      ),
                    }}
                  >
                    {isMarkdown(selectedTextContent.text)
                      ? selectedTextContent.text
                      : formatPlainText(selectedTextContent.text)}
                  </ReactMarkdown>
                </div>
              </div>

              {/* Footer */}
              <div className="sticky bottom-0 bg-gradient-to-t from-slate-50 to-white px-6 sm:px-8 py-4 border-t border-slate-100">
                <div className="flex items-center justify-end gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedTextContent(null)}
                    className="text-xs"
                  >
                    Close
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default PublicShowcase;
