// components/ai-generated-content/AIGeneratedContent.tsx
import React, { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { observer } from "mobx-react-lite";
import Masonry from "react-masonry-css";
import {
  Download,
  Copy,
  Check,
  Play,
  Edit,
  Share2,
  Search,
  X,
  Filter,
  Sparkles,
  ChevronDown,
  MoreVertical,
  Eye,
  RefreshCw,
  Clock,
  TrendingUp,
  Zap,
  Palette,
  Layers,
  ArrowUpRight,
  LayoutGrid,
  LayoutList,
  CheckSquare,
  Square,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

import { workspaceHub } from "@/repo/workspace_hub";
import { aiArtifactsManager } from "@/repo/managers/ai_artifacts_manager";
import { TestimonialArtifact } from "@/types/testimonial";
import { formatDistanceToNow } from "date-fns";
import VideoPreviewModal from "@/components/TestimonialDetail/VideoPreviewModal";
import ContentEditModal from "./ContentEditModal";
import ShareDrawer from "./share-drawer/ShareDrawer";
import {
  enhanceArtifacts,
  getContentStats,
  EnhancedArtifact,
  CONTENT_CATEGORIES,
  PLATFORM_TARGETS,
} from "./ContentCategorization";
import ModalPortal from "@/utils/ModalPortal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AIGeneratedContentProps {
  className?: string;
}

const AIGeneratedContent: React.FC<AIGeneratedContentProps> = observer(
  ({ className }) => {
    const navigate = useNavigate();
    const [copiedItems, setCopiedItems] = useState<Set<string>>(new Set());
    const [viewMode, setViewMode] = useState<"grid" | "masonry">("masonry");
    // Start with loading false if we already have cached data
    const [loading, setLoading] = useState(
      aiArtifactsManager.artifacts.length === 0
    );
    const [showLoading, setShowLoading] = useState(false); // Delayed loading indicator
    const [artifacts, setArtifacts] = useState<TestimonialArtifact[]>([]);
    const [selectedVideo, setSelectedVideo] = useState<any>(null);
    const [editingArtifact, setEditingArtifact] =
      useState<EnhancedArtifact | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [sharingArtifact, setSharingArtifact] =
      useState<EnhancedArtifact | null>(null);
    const [filterOpen, setFilterOpen] = useState(false);
    const [hoveredVideo, setHoveredVideo] = useState<string | null>(null);
    const [playingPreview, setPlayingPreview] = useState<string | null>(null);

    // Multi-select state
    const [selectionMode, setSelectionMode] = useState(false);
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

    // Filters
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
    const [sortBy, setSortBy] = useState<"newest" | "oldest" | "popular">(
      "newest"
    );

    useEffect(() => {
      const fetchData = async () => {
        const currentWorkspace = workspaceHub.workspace;
        if (!currentWorkspace?.id) return;

        // Only show loading indicator if fetch takes longer than 300ms
        const loadingTimeout = setTimeout(() => {
          if (loading) {
            setShowLoading(true);
          }
        }, 300);

        try {
          // Use cached artifacts - aiArtifactsManager now has caching
          const allArtifacts = await aiArtifactsManager.getArtifactsByWorkspace(
            currentWorkspace.id
          );
          const requiredArtifacts = allArtifacts.filter(
            (a) =>
              a.processing_type !== "sentiment_analysis" &&
              a.processing_type !== "clipping" &&
              a.processing_type !== "highlight_extraction" &&
              a.processing_type !== "enhancement" &&
              a.processing_type !== "viral_analysis" &&
              a.processing_type !== "translation" &&
              a.processing_type !== "narration" &&
              a.processing_type !== "text_polishing"
            // custom_pipeline is INCLUDED (not excluded) - it's a finished product
          );
          setArtifacts(requiredArtifacts);
        } catch (error) {
          console.error("Failed to fetch AI content artifacts:", error);
        } finally {
          clearTimeout(loadingTimeout);
          setLoading(false);
          setShowLoading(false);
        }
      };
      fetchData();
    }, []);

    const testimonials = workspaceHub.testimonialManager.testimonials || [];

    const enhancedArtifacts = useMemo(() => {
      return enhanceArtifacts(artifacts, testimonials);
    }, [artifacts, testimonials]);

    const contentStats = useMemo(() => {
      return getContentStats(enhancedArtifacts);
    }, [enhancedArtifacts]);

    const filteredArtifacts = useMemo(() => {
      let filtered = enhancedArtifacts.filter((artifact) => {
        if (searchQuery) {
          const searchLower = searchQuery.toLowerCase();
          const content = artifact.text_content || "";
          const categoryMatch = artifact.category.label
            .toLowerCase()
            .includes(searchLower);
          const contentMatch = content.toLowerCase().includes(searchLower);
          const platformMatch = artifact.platformTarget?.name
            .toLowerCase()
            .includes(searchLower);
          const sourceMatch = artifact.sourceTestimonials.some((t) =>
            (t.author_name || "").toLowerCase().includes(searchLower)
          );

          if (
            !(categoryMatch || contentMatch || platformMatch || sourceMatch)
          ) {
            return false;
          }
        }

        if (
          selectedCategories.length > 0 &&
          !selectedCategories.includes(artifact.category.id)
        ) {
          return false;
        }

        if (selectedPlatforms.length > 0) {
          if (
            !artifact.platformTarget ||
            !selectedPlatforms.includes(artifact.platformTarget.id)
          ) {
            return false;
          }
        }

        return true;
      });

      filtered.sort((a, b) => {
        switch (sortBy) {
          case "newest":
            return (
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime()
            );
          case "oldest":
            return (
              new Date(a.created_at).getTime() -
              new Date(b.created_at).getTime()
            );
          case "popular":
            return b.derivativeCount - a.derivativeCount;
          default:
            return 0;
        }
      });

      return filtered;
    }, [
      enhancedArtifacts,
      searchQuery,
      selectedCategories,
      selectedPlatforms,
      sortBy,
    ]);

    const handleVideoPlay = (artifact: TestimonialArtifact) => {
      if (artifact.asset_url) {
        setSelectedVideo({
          url: artifact.asset_url,
          title: artifact.data?.title || "Story Video",
          metadata: artifact.data,
        });
      }
    };

    const handleEditContent = (artifact: EnhancedArtifact) => {
      setEditingArtifact(artifact);
      setIsEditModalOpen(true);
    };

    const handleSaveContent = async (
      artifactId: string,
      newContent: string
    ) => {
      try {
        setArtifacts((prev) =>
          prev.map((artifact) =>
            artifact.id === artifactId
              ? { ...artifact, text_content: newContent }
              : artifact
          )
        );
        setIsEditModalOpen(false);
        setEditingArtifact(null);
      } catch (error) {
        console.error("Failed to save content:", error);
      }
    };

    const handleCopyToClipboard = async (
      content: string,
      artifactId: string
    ) => {
      try {
        await navigator.clipboard.writeText(content);
        setCopiedItems((prev) => new Set([...prev, artifactId]));
        setTimeout(() => {
          setCopiedItems((prev) => {
            const next = new Set(prev);
            next.delete(artifactId);
            return next;
          });
        }, 2000);
      } catch (err) {
        console.error("Failed to copy content:", err);
      }
    };

    const handleDownload = (content: string, filename: string) => {
      const blob = new Blob([content], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    };

    const toggleCategory = (categoryId: string) => {
      setSelectedCategories((prev) =>
        prev.includes(categoryId)
          ? prev.filter((id) => id !== categoryId)
          : [...prev, categoryId]
      );
    };

    const togglePlatform = (platformId: string) => {
      setSelectedPlatforms((prev) =>
        prev.includes(platformId)
          ? prev.filter((id) => id !== platformId)
          : [...prev, platformId]
      );
    };

    const clearFilters = () => {
      setSearchQuery("");
      setSelectedCategories([]);
      setSelectedPlatforms([]);
    };

    const activeFiltersCount =
      selectedCategories.length + selectedPlatforms.length;

    // Multi-select handlers
    const toggleSelectionMode = () => {
      setSelectionMode(!selectionMode);
      if (selectionMode) {
        // Exit selection mode - clear selections
        setSelectedItems(new Set());
      }
    };

    const toggleItemSelection = (artifactId: string) => {
      setSelectedItems((prev) => {
        const next = new Set(prev);
        if (next.has(artifactId)) {
          next.delete(artifactId);
        } else {
          next.add(artifactId);
        }
        return next;
      });
    };

    const handleSelectAll = () => {
      if (selectedItems.size === filteredArtifacts.length) {
        setSelectedItems(new Set());
      } else {
        setSelectedItems(new Set(filteredArtifacts.map((a) => a.id)));
      }
    };

    const handleShareSelected = () => {
      if (selectedItems.size > 0) {
        // Get all selected artifacts
        const artifacts = filteredArtifacts.filter((a) =>
          selectedItems.has(a.id)
        );

        if (artifacts.length > 0) {
          // Use the first artifact as the main artifact, pass all as artifacts prop
          setSharingArtifact(artifacts[0]);
          // ShareDrawer will receive artifacts prop via the component below
        }
      }
    };

    const selectedArtifacts = useMemo(() => {
      return filteredArtifacts.filter((a) => selectedItems.has(a.id));
    }, [filteredArtifacts, selectedItems]);

    // Premium Video Card
    const renderVideoCard = (artifact: EnhancedArtifact, index: number) => {
      const TypeIcon = artifact.category.icon;
      const isHovered = hoveredVideo === artifact.id;
      const isSelected = selectedItems.has(artifact.id);

      // Extract aspect ratio from artifact metadata
      const aspectRatio =
        artifact.data?.aspect_ratio ||
        artifact.processing_metadata?.aspect_ratio ||
        artifact.platformTarget?.aspectRatio ||
        "16:9";

      // Determine if vertical video (9:16 or similar)
      const isVertical =
        aspectRatio.includes("9:16") ||
        aspectRatio.includes("9/16") ||
        artifact.platformTarget?.id.includes("reels") ||
        artifact.platformTarget?.id.includes("stories") ||
        artifact.platformTarget?.id.includes("shorts") ||
        artifact.platformTarget?.id.includes("tiktok");

      // Map aspect ratio to CSS aspect ratio class
      const getAspectRatioClass = () => {
        if (isVertical) return "aspect-[9/16]";
        if (aspectRatio.includes("1:1") || aspectRatio.includes("1/1"))
          return "aspect-square";
        if (aspectRatio.includes("4:5") || aspectRatio.includes("4/5"))
          return "aspect-[4/5]";
        return "aspect-video"; // Default 16:9
      };

      return (
        <motion.div
          key={artifact.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ delay: index * 0.03, duration: 0.4 }}
          className="group relative"
          onMouseEnter={() => setHoveredVideo(artifact.id)}
          onMouseLeave={() => {
            setHoveredVideo(null);
            setPlayingPreview(null);
          }}
        >
          <Card
            className={`relative overflow-hidden border-0 bg-white shadow-sm hover:shadow-2xl transition-all duration-500 group/card ${isSelected ? "ring-4 ring-blue-500" : ""}`}
          >
            {/* Selection Checkbox */}
            {selectionMode && (
              <div
                className="absolute top-3 left-3 z-20 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleItemSelection(artifact.id);
                }}
              >
                <div className="w-6 h-6 rounded-md bg-white/95 backdrop-blur-sm border-2 border-slate-300 flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
                  {isSelected ? (
                    <CheckSquare className="h-5 w-5 text-blue-600" />
                  ) : (
                    <Square className="h-5 w-5 text-slate-400" />
                  )}
                </div>
              </div>
            )}

            {/* Video Container */}
            <div
              className={`relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden ${viewMode === "grid" ? "aspect-video" : getAspectRatioClass()}`}
            >
              <video
                src={artifact.asset_url}
                className="w-full h-full object-contain bg-slate-900"
                muted
                loop
                playsInline
                poster={artifact.data?.thumbnail_url}
                ref={(el) => {
                  if (el && isHovered && playingPreview !== artifact.id) {
                    el.play().catch(() => {});
                    setPlayingPreview(artifact.id);
                  } else if (el && !isHovered) {
                    el.pause();
                    el.currentTime = 0;
                  }
                }}
              />

              {/* Gradient Overlays */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover/card:opacity-40 transition-opacity duration-500" />
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-purple-500/10 opacity-0 group-hover/card:opacity-100 transition-opacity duration-500" />

              {/* Play Button - Premium Design */}
              <motion.div
                className="absolute inset-0 flex items-center justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: isHovered ? 1 : 0 }}
                transition={{ duration: 0.3 }}
              >
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleVideoPlay(artifact)}
                  className="relative group/play"
                >
                  <div className="absolute inset-0 bg-white rounded-full blur-xl opacity-50 group-hover/play:opacity-75 transition-opacity" />
                  <div className="relative w-16 h-16 rounded-full bg-white/95 backdrop-blur-xl flex items-center justify-center shadow-2xl border border-white/20">
                    <Play
                      className="h-6 w-6 text-slate-900 ml-1"
                      fill="currentColor"
                    />
                  </div>
                </motion.button>
              </motion.div>

              {/* Top Badges - Premium Glass Effect */}
              <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2">
                <motion.div
                  initial={{ x: -10, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  <Badge className="backdrop-blur-xl bg-white/10 border border-white/20 text-white text-[9px] px-2 py-0.5 font-medium shadow-lg">
                    <TypeIcon className="h-2.5 w-2.5 mr-1" />
                    {artifact.category.label}
                  </Badge>
                </motion.div>
                {artifact.platformTarget && (
                  <motion.div
                    initial={{ x: 10, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.15 }}
                  >
                    <Badge className="backdrop-blur-xl bg-gradient-to-r from-blue-500/90 to-purple-500/90 border-0 text-white text-[9px] px-2 py-0.5 font-medium shadow-lg">
                      {artifact.platformTarget.name}
                    </Badge>
                  </motion.div>
                )}
              </div>

              {/* Duration Badge - Bottom Right */}
              {artifact.data?.duration && (
                <div className="absolute bottom-3 right-3">
                  <Badge className="backdrop-blur-xl bg-black/60 border border-white/10 text-white text-[9px] px-2 py-0.5 font-medium">
                    {Math.floor(artifact.data.duration / 60)}:
                    {String(Math.floor(artifact.data.duration % 60)).padStart(
                      2,
                      "0"
                    )}
                  </Badge>
                </div>
              )}

              {/* Content Info Overlay - Bottom */}
              <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-2 opacity-0 group-hover/card:translate-y-0 group-hover/card:opacity-100 transition-all duration-300">
                <div className="backdrop-blur-2xl bg-white/10 rounded-xl border border-white/20 p-3 shadow-2xl">
                  {artifact.text_content && (
                    <p className="text-[10px] text-white/90 line-clamp-2 leading-relaxed mb-2">
                      {artifact.text_content}
                    </p>
                  )}
                  <div className="flex items-center gap-2 text-[9px] text-white/70">
                    <Clock className="h-2.5 w-2.5" />
                    <span>
                      {formatDistanceToNow(new Date(artifact.created_at), {
                        addSuffix: true,
                      })}
                    </span>
                    {artifact.sourceTestimonials.length > 0 && (
                      <>
                        <span>•</span>
                        <span>
                          {artifact.sourceTestimonials.length} source
                          {artifact.sourceTestimonials.length > 1 ? "s" : ""}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Bar - Shows on hover */}
            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: isHovered ? 0 : 10, opacity: isHovered ? 1 : 0 }}
              transition={{ duration: 0.2 }}
              className="absolute top-3 left-1/2 -translate-x-1/2 z-10"
            >
              <div className="backdrop-blur-2xl bg-white/95 rounded-full border border-slate-200/50 shadow-2xl px-2 py-1.5 flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    handleCopyToClipboard(
                      artifact.text_content || artifact.asset_url || "",
                      artifact.id
                    )
                  }
                  className="h-7 w-7 p-0 hover:bg-slate-100 rounded-full"
                  title="Copy"
                >
                  {copiedItems.has(artifact.id) ? (
                    <Check className="h-3 w-3 text-emerald-600" />
                  ) : (
                    <Copy className="h-3 w-3 text-slate-600" />
                  )}
                </Button>
                <div className="w-px h-4 bg-slate-200" />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSharingArtifact(artifact)}
                  className="h-7 w-7 p-0 hover:bg-slate-100 rounded-full"
                  title="Share"
                >
                  <Share2 className="h-3 w-3 text-slate-600" />
                </Button>
                <div className="w-px h-4 bg-slate-200" />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEditContent(artifact)}
                  className="h-7 w-7 p-0 hover:bg-slate-100 rounded-full"
                  title="Edit"
                >
                  <Edit className="h-3 w-3 text-slate-600" />
                </Button>
                <div className="w-px h-4 bg-slate-200" />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 hover:bg-slate-100 rounded-full"
                    >
                      <MoreVertical className="h-3 w-3 text-slate-600" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem
                      onClick={() =>
                        handleDownload(
                          artifact.text_content || "",
                          `${artifact.category.label}-${Date.now()}.txt`
                        )
                      }
                      className="text-[10px]"
                    >
                      <Download className="h-3 w-3 mr-2" />
                      Download
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleVideoPlay(artifact)}
                      className="text-[10px]"
                    >
                      <Eye className="h-3 w-3 mr-2" />
                      View Full
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </motion.div>
          </Card>
        </motion.div>
      );
    };

    // Premium Text Card
    const renderTextCard = (artifact: EnhancedArtifact, index: number) => {
      const TypeIcon = artifact.category.icon;
      const content = artifact.text_content || "";
      const wordCount = content.split(/\s+/).filter(Boolean).length;
      const isSelected = selectedItems.has(artifact.id);

      return (
        <motion.div
          key={artifact.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ delay: index * 0.03, duration: 0.4 }}
          className="group relative"
        >
          <Card
            className={`relative overflow-hidden border-0 bg-white shadow-sm hover:shadow-2xl transition-all duration-500 ${isSelected ? "ring-4 ring-blue-500" : ""}`}
          >
            {/* Selection Checkbox */}
            {selectionMode && (
              <div
                className="absolute top-3 left-3 z-20 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleItemSelection(artifact.id);
                }}
              >
                <div className="w-6 h-6 rounded-md bg-white/95 backdrop-blur-sm border-2 border-slate-300 flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
                  {isSelected ? (
                    <CheckSquare className="h-5 w-5 text-blue-600" />
                  ) : (
                    <Square className="h-5 w-5 text-slate-400" />
                  )}
                </div>
              </div>
            )}

            {/* Gradient Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-blue-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <div className="relative p-5">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-slate-100 to-slate-50 border border-slate-200/50 shadow-sm">
                    <TypeIcon className="h-3.5 w-3.5 text-slate-700" />
                  </div>
                  <div>
                    <h3 className="text-[11px] font-semibold text-slate-900">
                      {artifact.category.label}
                    </h3>
                    <p className="text-[9px] text-slate-500 mt-0.5">
                      {wordCount} words •{" "}
                      {formatDistanceToNow(new Date(artifact.created_at), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                </div>
                {artifact.platformTarget && (
                  <Badge className="bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 border-blue-200/50 text-[9px] px-2 py-0.5">
                    {artifact.platformTarget.name}
                  </Badge>
                )}
              </div>

              {/* Content Preview */}
              <div className="mb-4">
                <div className="relative group/content">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-xl opacity-0 group-hover/content:opacity-100 transition-opacity duration-300" />
                  <div className="relative p-4 rounded-xl bg-gradient-to-br from-slate-50/50 to-white border border-slate-200/50">
                    <p className="text-[10px] text-slate-700 leading-relaxed line-clamp-4">
                      {content}
                    </p>
                  </div>
                </div>
                {content.length > 300 && (
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => handleEditContent(artifact)}
                    className="h-auto px-0 text-[9px] text-blue-600 hover:text-blue-700 mt-2 font-medium group/link"
                  >
                    Read full content
                    <ArrowUpRight className="h-2.5 w-2.5 ml-1 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
                  </Button>
                )}
              </div>

              {/* Stats & Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <div className="flex items-center gap-1.5">
                  <Badge
                    variant="outline"
                    className="text-[8px] px-1.5 py-0 bg-white/50 border-slate-200/50"
                  >
                    {content.length} chars
                  </Badge>
                  {artifact.sourceTestimonials.length > 0 && (
                    <Badge
                      variant="outline"
                      className="text-[8px] px-1.5 py-0 bg-white/50 border-slate-200/50"
                    >
                      {artifact.sourceTestimonials.length} source
                      {artifact.sourceTestimonials.length > 1 ? "s" : ""}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopyToClipboard(content, artifact.id)}
                    className="h-7 w-7 p-0 hover:bg-slate-100 rounded-lg"
                  >
                    {copiedItems.has(artifact.id) ? (
                      <Check className="h-3 w-3 text-emerald-600" />
                    ) : (
                      <Copy className="h-3 w-3 text-slate-600" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditContent(artifact)}
                    className="h-7 w-7 p-0 hover:bg-slate-100 rounded-lg"
                  >
                    <Edit className="h-3 w-3 text-slate-600" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 hover:bg-slate-100 rounded-lg"
                      >
                        <MoreVertical className="h-3 w-3 text-slate-600" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      <DropdownMenuItem
                        onClick={() => setSharingArtifact(artifact)}
                        className="text-[10px]"
                      >
                        <Share2 className="h-3 w-3 mr-2" />
                        Share
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() =>
                          handleDownload(
                            content,
                            `${artifact.category.label}-${Date.now()}.txt`
                          )
                        }
                        className="text-[10px]"
                      >
                        <Download className="h-3 w-3 mr-2" />
                        Download
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-[10px]">
                        <RefreshCw className="h-3 w-3 mr-2" />
                        Regenerate with AI
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      );
    };

    const renderArtifactCard = (artifact: EnhancedArtifact, index: number) => {
      return artifact.asset_url
        ? renderVideoCard(artifact, index)
        : renderTextCard(artifact, index);
    };

    const renderEmptyState = () => (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="flex items-center justify-center min-h-[60vh]"
      >
        <div className="text-center max-w-lg">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.2 }}
            className="relative w-20 h-20 mx-auto mb-6"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full blur-2xl" />
            <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-slate-100 to-slate-50 border border-slate-200/50 shadow-xl flex items-center justify-center">
              <Sparkles className="h-9 w-9 text-slate-400" />
            </div>
          </motion.div>
          <h3 className="text-lg font-semibold text-slate-900 mb-3">
            No AI-Generated Content Yet
          </h3>
          <p className="text-[11px] text-slate-600 leading-relaxed mb-8 max-w-md mx-auto">
            Transform your testimonials into powerful marketing content using AI
            services for content generation, platform optimization, and story
            videos.
          </p>
          <Button
            onClick={() => navigate("/dashboard")}
            className="bg-gradient-to-r from-slate-900 to-slate-700 hover:from-slate-800 hover:to-slate-600 text-white h-10 px-6 text-[11px] shadow-lg"
          >
            <Sparkles className="h-3.5 w-3.5 mr-2" />
            Explore AI Studio
          </Button>
        </div>
      </motion.div>
    );

    const renderLoadingState = () => (
      <div
        className={
          viewMode === "masonry"
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            : "space-y-4"
        }
      >
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card
            key={i}
            className="animate-pulse border-0 shadow-sm overflow-hidden"
          >
            <div className="aspect-video bg-gradient-to-br from-slate-100 to-slate-50" />
            <div className="p-4 space-y-3">
              <div className="h-3 bg-slate-100 rounded w-2/3" />
              <div className="h-2 bg-slate-100 rounded w-1/2" />
              <div className="h-2 bg-slate-100 rounded w-full" />
            </div>
          </Card>
        ))}
      </div>
    );

    return (
      <div className={`min-h-screen ${className}`}>
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Premium Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-10"
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                      AI Content Hub
                    </h1>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="backdrop-blur-xl bg-white/80 border border-slate-200/50 rounded-full px-4 py-2 shadow-sm">
                  <span className="text-[10px] font-medium text-slate-700">
                    {filteredArtifacts.length} of {enhancedArtifacts.length}{" "}
                    items
                  </span>
                </div>
                <Button
                  variant={selectionMode ? "default" : "outline"}
                  size="sm"
                  onClick={toggleSelectionMode}
                  className={`h-10 px-4 text-[10px] ${selectionMode ? "bg-blue-600 hover:bg-blue-700" : "border-slate-200/50"}`}
                >
                  {selectionMode ? (
                    <>
                      <X className="h-3.5 w-3.5 mr-1.5" />
                      Exit Selection
                    </>
                  ) : (
                    <>
                      <CheckSquare className="h-3.5 w-3.5 mr-1.5" />
                      Select Multiple
                    </>
                  )}
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Stats Overview */}
          {!showLoading && enhancedArtifacts.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.6 }}
              className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-8"
            >
              {[
                {
                  label: "Total Content",
                  value: contentStats.total,
                  icon: Layers,
                },
                {
                  label: "Content Types",
                  value: Object.keys(contentStats.byCategory).length,
                  icon: Palette,
                },
                {
                  label: "Platforms",
                  value: Object.keys(contentStats.byPlatform).length,
                  icon: Zap,
                },
                {
                  label: "Sources",
                  value: contentStats.sourceTestimonials.size,
                  icon: TrendingUp,
                },
              ].map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.15 + index * 0.03, duration: 0.3 }}
                  >
                    <Card className="border border-slate-200 bg-white shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-200">
                      <div className="p-4 md:p-5">
                        <div className="flex items-center justify-between mb-3">
                          <div className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center">
                            <Icon className="h-4 w-4 text-slate-700" />
                          </div>
                        </div>
                        <p className="text-2xl md:text-3xl font-bold text-slate-900 mb-1">
                          {stat.value}
                        </p>
                        <p className="text-[10px] md:text-xs font-medium text-slate-600">
                          {stat.label}
                        </p>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </motion.div>
          )}

          {/* Premium Filter Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="sticky top-4 z-20 mb-8"
          >
            <Card className="border-0 shadow-lg backdrop-blur-xl bg-white/95">
              <div className="p-4">
                <div className="flex flex-col lg:flex-row gap-3">
                  {/* Search */}
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Search across all content..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 h-10 text-[11px] border-slate-200/50 bg-white/50 focus:bg-white transition-colors"
                    />
                    {searchQuery && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSearchQuery("")}
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0 rounded-full hover:bg-slate-100"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>

                  {/* Controls */}
                  <div className="flex items-center gap-2">
                    {/* View Mode */}
                    <div className="flex items-center bg-slate-100/80 rounded-lg p-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setViewMode("masonry")}
                        className={`h-8 px-3 text-[10px] rounded-md ${viewMode === "masonry" ? "bg-white shadow-sm" : ""}`}
                      >
                        <LayoutGrid className="h-3.5 w-3.5 mr-1.5" />
                        Masonry
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setViewMode("grid")}
                        className={`h-8 px-3 text-[10px] rounded-md ${viewMode === "grid" ? "bg-white shadow-sm" : ""}`}
                      >
                        <LayoutList className="h-3.5 w-3.5 mr-1.5" />
                        Grid
                      </Button>
                    </div>

                    {/* Sort */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-10 px-4 text-[10px] border-slate-200/50 bg-white/50 hover:bg-white"
                        >
                          Sort
                          <ChevronDown className="h-3 w-3 ml-1.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuItem
                          onClick={() => setSortBy("newest")}
                          className="text-[10px]"
                        >
                          {sortBy === "newest" && (
                            <Check className="h-3 w-3 mr-2" />
                          )}
                          <span className={sortBy !== "newest" ? "ml-5" : ""}>
                            Newest First
                          </span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setSortBy("oldest")}
                          className="text-[10px]"
                        >
                          {sortBy === "oldest" && (
                            <Check className="h-3 w-3 mr-2" />
                          )}
                          <span className={sortBy !== "oldest" ? "ml-5" : ""}>
                            Oldest First
                          </span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setSortBy("popular")}
                          className="text-[10px]"
                        >
                          {sortBy === "popular" && (
                            <Check className="h-3 w-3 mr-2" />
                          )}
                          <span className={sortBy !== "popular" ? "ml-5" : ""}>
                            Most Popular
                          </span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Filters */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setFilterOpen(!filterOpen)}
                      className={`h-10 px-4 text-[10px] border-slate-200/50 transition-all ${activeFiltersCount > 0 ? "bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200" : "bg-white/50 hover:bg-white"}`}
                    >
                      <Filter className="h-3.5 w-3.5 mr-1.5" />
                      Filters
                      {activeFiltersCount > 0 && (
                        <Badge className="ml-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white h-5 px-1.5 text-[8px] font-semibold">
                          {activeFiltersCount}
                        </Badge>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Expanded Filters */}
                <AnimatePresence>
                  {filterOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="pt-4 mt-4 border-t border-slate-100 space-y-4">
                        {/* Categories */}
                        <div>
                          <p className="text-[9px] font-bold text-slate-700 mb-3 uppercase tracking-wider">
                            Content Categories
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {CONTENT_CATEGORIES.map((category) => {
                              const count =
                                contentStats.byCategory[category.id] || 0;
                              const CategoryIcon = category.icon;
                              const isSelected = selectedCategories.includes(
                                category.id
                              );
                              return (
                                <Button
                                  key={category.id}
                                  variant="outline"
                                  size="sm"
                                  onClick={() => toggleCategory(category.id)}
                                  disabled={count === 0}
                                  className={`h-8 text-[10px] transition-all ${
                                    isSelected
                                      ? "bg-gradient-to-r from-slate-900 to-slate-700 text-white border-0 shadow-lg"
                                      : "border-slate-200/50 hover:border-slate-300 hover:shadow-sm"
                                  }`}
                                >
                                  <CategoryIcon className="h-3 w-3 mr-1.5" />
                                  {category.label}
                                  <Badge
                                    className={`ml-2 h-4 px-1.5 text-[8px] ${
                                      isSelected
                                        ? "bg-white/20 text-white"
                                        : "bg-slate-100 text-slate-600"
                                    }`}
                                  >
                                    {count}
                                  </Badge>
                                </Button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Platforms */}
                        <div>
                          <p className="text-[9px] font-bold text-slate-700 mb-3 uppercase tracking-wider">
                            Target Platforms
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {PLATFORM_TARGETS.map((platform) => {
                              const count =
                                contentStats.byPlatform[platform.id] || 0;
                              const PlatformIcon = platform.icon;
                              const isSelected = selectedPlatforms.includes(
                                platform.id
                              );
                              return (
                                <Button
                                  key={platform.id}
                                  variant="outline"
                                  size="sm"
                                  onClick={() => togglePlatform(platform.id)}
                                  disabled={count === 0}
                                  className={`h-8 text-[10px] transition-all ${
                                    isSelected
                                      ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0 shadow-lg"
                                      : "border-slate-200/50 hover:border-slate-300 hover:shadow-sm"
                                  }`}
                                >
                                  <PlatformIcon className="h-3 w-3 mr-1.5" />
                                  {platform.name}
                                  <Badge
                                    className={`ml-2 h-4 px-1.5 text-[8px] ${
                                      isSelected
                                        ? "bg-white/20 text-white"
                                        : "bg-slate-100 text-slate-600"
                                    }`}
                                  >
                                    {count}
                                  </Badge>
                                </Button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Clear Filters */}
                        {activeFiltersCount > 0 && (
                          <div className="flex justify-end pt-3 border-t border-slate-100">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={clearFilters}
                              className="h-8 text-[10px] hover:bg-slate-100"
                            >
                              <X className="h-3 w-3 mr-1.5" />
                              Clear all filters ({activeFiltersCount})
                            </Button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </Card>
          </motion.div>

          {/* Content Grid */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            {showLoading ? (
              renderLoadingState()
            ) : filteredArtifacts.length === 0 ? (
              renderEmptyState()
            ) : viewMode === "masonry" ? (
              <Masonry
                breakpointCols={{
                  default: 3,
                  1280: 3,
                  1024: 2,
                  640: 1,
                }}
                className="flex gap-3 w-auto"
                columnClassName="flex flex-col gap-3"
              >
                {filteredArtifacts.map((artifact, index) =>
                  renderArtifactCard(artifact, index)
                )}
              </Masonry>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <AnimatePresence mode="popLayout">
                  {filteredArtifacts.map((artifact, index) =>
                    renderArtifactCard(artifact, index)
                  )}
                </AnimatePresence>
              </div>
            )}
          </motion.div>

          {/* Floating Multi-Select Action Bar */}
          <AnimatePresence>
            {selectionMode && selectedItems.size > 0 && (
              <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50"
              >
                <Card className="border-0 shadow-2xl backdrop-blur-xl bg-white/95">
                  <div className="px-6 py-4 flex items-center gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <CheckSquare className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {selectedItems.size} item
                          {selectedItems.size > 1 ? "s" : ""} selected
                        </p>
                        <p className="text-xs text-slate-500">
                          {selectedItems.size > 1
                            ? "Create carousel or share individually"
                            : "Share or edit"}
                        </p>
                      </div>
                    </div>

                    <div className="w-px h-10 bg-slate-200" />

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSelectAll}
                        className="h-9 text-xs"
                      >
                        {selectedItems.size === filteredArtifacts.length ? (
                          <>
                            <X className="h-3.5 w-3.5 mr-1.5" />
                            Deselect All
                          </>
                        ) : (
                          <>
                            <CheckSquare className="h-3.5 w-3.5 mr-1.5" />
                            Select All
                          </>
                        )}
                      </Button>

                      <Button
                        variant="default"
                        size="sm"
                        onClick={handleShareSelected}
                        className="h-9 text-xs bg-blue-600 hover:bg-blue-700"
                      >
                        <Share2 className="h-3.5 w-3.5 mr-1.5" />
                        {selectedItems.size > 1 ? "Create Carousel" : "Share"}
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={toggleSelectionMode}
                        className="h-9 w-9 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Modals */}
        <ModalPortal isOpen={!!selectedVideo}>
          <VideoPreviewModal
            isOpen={!!selectedVideo}
            onClose={() => setSelectedVideo(null)}
            videoUrl={selectedVideo?.url || ""}
            title={selectedVideo?.title || ""}
            metadata={selectedVideo?.metadata}
          />
        </ModalPortal>

        <ModalPortal isOpen={isEditModalOpen}>
          <ContentEditModal
            isOpen={isEditModalOpen}
            onClose={() => {
              setIsEditModalOpen(false);
              setEditingArtifact(null);
            }}
            artifact={editingArtifact}
            onSave={handleSaveContent}
          />
        </ModalPortal>

        {sharingArtifact && (
          <ShareDrawer
            artifact={sharingArtifact}
            artifacts={
              selectedArtifacts.length > 1 ? selectedArtifacts : undefined
            }
            isOpen={!!sharingArtifact}
            onOpenChange={(open) => {
              if (!open) {
                setSharingArtifact(null);
                // Exit selection mode and clear selections when drawer closes
                setSelectionMode(false);
                setSelectedItems(new Set());
              }
            }}
          />
        )}
      </div>
    );
  }
);

export default AIGeneratedContent;
