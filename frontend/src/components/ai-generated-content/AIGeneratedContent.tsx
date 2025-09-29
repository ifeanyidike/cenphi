// components/ai-generated-content/AIGeneratedContent.tsx
import React, { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { observer } from "mobx-react-lite";
import {
  FileText,
  Download,
  Copy,
  Check,
  Clock,
  Users,
  Brain,
  Grid3X3,
  Video,
  Play,
  Edit,
  Layers,
  Target,
  Share2,
  GitBranch,
  TrendingUp,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { workspaceHub } from "@/repo/workspace_hub";
import { aiArtifactsManager } from "@/repo/managers/ai_artifacts_manager";
import { TestimonialArtifact } from "@/types/testimonial";
import { formatDistanceToNow } from "date-fns";
import VideoPreviewModal from "@/components/TestimonialDetail/VideoPreviewModal";
import ContentEditModal from "./ContentEditModal";
import AdvancedFilters, { FilterState } from "./AdvancedFilters";
import ContentLineageView from "./ContentLineageView";
import ServiceLineageVisualization from "./ServiceLineageVisualization";
import LinkedInShareModal from "./LinkedInShareModal";
import {
  enhanceArtifacts,
  getContentStats,
  EnhancedArtifact,
} from "./ContentCategorization";
import ModalPortal from "@/utils/ModalPortal";
import ContextualContentFilter from "../smart-navigation/ContextualContentFilter";
import ContentLocationIndicator from "../smart-navigation/ContentLocationIndicator";
import SmartNavigationBanner from "../smart-navigation/SmartNavigationBanner";
import { shouldShowInContext } from "@/utils/ContentRouter";

interface AIGeneratedContentProps {
  className?: string;
}

const AIGeneratedContent: React.FC<AIGeneratedContentProps> = observer(
  ({ className }) => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [copiedItems, setCopiedItems] = useState<Set<string>>(new Set());
    const [viewMode, setViewMode] = useState<"tree" | "timeline" | "grid">(
      "tree"
    );
    const [activeTab, setActiveTab] = useState("content");
    const [loading, setLoading] = useState(true);
    const [artifacts, setArtifacts] = useState<TestimonialArtifact[]>([]);
    const [selectedVideo, setSelectedVideo] = useState<any>(null);
    const [editingArtifact, setEditingArtifact] =
      useState<EnhancedArtifact | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [sharingArtifact, setSharingArtifact] =
      useState<EnhancedArtifact | null>(null);
    const [selectedArtifactId, setSelectedArtifactId] = useState<
      string | undefined
    >();
    const [showCrossReferences, setShowCrossReferences] = useState(true);
    const [filters, setFilters] = useState<FilterState>({
      search: "",
      categories: [],
      platforms: [],
      levels: [],
      dateRange: "all",
      sourceType: "all",
    });

    // URL parameter handling
    useEffect(() => {
      const view = searchParams.get("view");
      const source = searchParams.get("source");

      if (view === "tree") {
        setActiveTab("lineage");
      }

      if (source) {
        setSelectedArtifactId(source);
      }
    }, [searchParams]);

    // Fetch ALL AI-generated content artifacts (all processing types)
    useEffect(() => {
      const fetchData = async () => {
        setLoading(true);
        try {
          const currentWorkspace = workspaceHub.workspace;
          if (currentWorkspace?.id) {
            // Get ALL artifact types - not just content generation
            const allArtifacts =
              await aiArtifactsManager.getArtifactsByWorkspace(
                currentWorkspace.id
                // No processingTypes filter - get everything
              );
            const requiredArtifacts = allArtifacts.filter(
              (a) =>
                a.processing_type !== "sentiment_analysis" &&
                a.processing_type !== "clipping" &&
                a.processing_type !== "highlight_extraction"
            );
            setArtifacts(requiredArtifacts);
          }
        } catch (error) {
          console.error("Failed to fetch AI content artifacts:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }, []);

    const testimonials = workspaceHub.testimonialManager.testimonials || [];

    // Enhanced artifacts with categorization and lineage
    const enhancedArtifacts = useMemo(() => {
      return enhanceArtifacts(artifacts, testimonials);
    }, [artifacts, testimonials]);

    // Content statistics
    const contentStats = useMemo(() => {
      return getContentStats(enhancedArtifacts);
    }, [enhancedArtifacts]);

    // Filtered artifacts
    // Apply contextual filtering first
    const contextualArtifacts = useMemo(() => {
      return enhancedArtifacts.filter((artifact) => {
        const shouldShow = shouldShowInContext(artifact, "ai-hub");
        if (!shouldShow.show) return false;
        if (shouldShow.isPrimary) return true;
        return showCrossReferences;
      });
    }, [enhancedArtifacts, showCrossReferences]);

    const filteredArtifacts = useMemo(() => {
      return contextualArtifacts.filter((artifact) => {
        // Search filter
        if (filters.search) {
          const searchLower = filters.search.toLowerCase();
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

        // Category filter
        if (
          filters.categories.length > 0 &&
          !filters.categories.includes(artifact.category.id)
        ) {
          return false;
        }

        // Platform filter
        if (filters.platforms.length > 0) {
          if (
            !artifact.platformTarget ||
            !filters.platforms.includes(artifact.platformTarget.id)
          ) {
            return false;
          }
        }

        // Processing level filter
        if (
          filters.levels.length > 0 &&
          !filters.levels.includes(artifact.lineage.level)
        ) {
          return false;
        }

        // Source type filter
        if (filters.sourceType !== "all") {
          switch (filters.sourceType) {
            case "single-testimonial":
              if (
                artifact.lineage.sourceType !== "testimonial" ||
                artifact.sourceTestimonials.length > 1
              ) {
                return false;
              }
              break;
            case "multi-testimonial":
              if (artifact.lineage.sourceType !== "multi-testimonial") {
                return false;
              }
              break;
            case "derived":
              if (artifact.lineage.sourceType !== "artifact") {
                return false;
              }
              break;
          }
        }

        // Date range filter
        if (filters.dateRange !== "all") {
          const artifactDate = new Date(artifact.created_at);
          const now = new Date();

          switch (filters.dateRange) {
            case "today": {
              const startOfDay = new Date(now);
              startOfDay.setHours(0, 0, 0, 0);
              if (artifactDate < startOfDay) return false;
              break;
            }
            case "week": {
              const weekAgo = new Date(now);
              weekAgo.setDate(now.getDate() - 7);
              if (artifactDate < weekAgo) return false;
              break;
            }
            case "month": {
              const monthAgo = new Date(now);
              monthAgo.setMonth(now.getMonth() - 1);
              if (artifactDate < monthAgo) return false;
              break;
            }
            case "quarter": {
              const quarterAgo = new Date(now);
              quarterAgo.setMonth(now.getMonth() - 3);
              if (artifactDate < quarterAgo) return false;
              break;
            }
          }
        }

        return true;
      });
    }, [contextualArtifacts, filters]);

    // Video playback functionality
    const handleVideoPlay = (artifact: TestimonialArtifact) => {
      if (artifact.asset_url) {
        setSelectedVideo({
          url: artifact.asset_url,
          title: artifact.data?.title || "Story Video",
          metadata: artifact.data,
        });
      }
    };

    // Content editing functionality
    const handleEditContent = (artifact: EnhancedArtifact) => {
      setEditingArtifact(artifact);
      setIsEditModalOpen(true);
    };

    const handlePreviewContent = (artifact: EnhancedArtifact) => {
      if (artifact.asset_url) {
        handleVideoPlay(artifact);
      } else {
        handleEditContent(artifact);
      }
    };

    const handleSaveContent = async (
      artifactId: string,
      newContent: string
    ) => {
      try {
        // TODO: Implement actual API call to save the edited content
        console.log(
          "Saving content for artifact:",
          artifactId,
          "Content:",
          newContent
        );

        // Update local state
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

    // Copy to clipboard functionality
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

    // Download functionality
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

    // Legacy artifact card render function for grid view
    const renderArtifactCard = (artifact: EnhancedArtifact) => {
      const content = artifact.text_content || "";
      const hasVideo = !!artifact.asset_url; // Any content with asset_url has video
      const TypeIcon = artifact.category.icon;

      return (
        <motion.div
          key={artifact.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          whileHover={{ y: -1 }}
        >
          <Card className="group hover:shadow-md transition-all duration-200 border border-gray-200 hover:border-gray-300 bg-white overflow-hidden">
            {/* Context Location Indicator */}
            <ContentLocationIndicator
              artifact={artifact}
              currentContext="ai-hub"
              testimonialId={artifact.sourceTestimonials[0]?.id}
              className="mx-4 mt-3"
              minimal={true}
            />
            {/* Video Thumbnail for ANY content with asset_url */}
            {hasVideo && (
              <div className="relative aspect-video bg-gray-900">
                <video
                  src={artifact.asset_url}
                  className="w-full h-full object-cover"
                  muted
                  poster={artifact.data?.thumbnail_url}
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    size="sm"
                    onClick={() => handleVideoPlay(artifact)}
                    className="bg-white text-black hover:bg-gray-100 h-8 px-3 text-xs font-medium"
                  >
                    <Play className="h-3 w-3 mr-1" />
                    Play
                  </Button>
                </div>
                <div className="absolute top-3 left-3">
                  <Badge className="bg-black/60 text-white border-0 text-xs">
                    <Video className="h-3 w-3 mr-1" />
                    {artifact.category.label}
                  </Badge>
                </div>
              </div>
            )}

            <CardContent className="p-5">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="p-1.5 rounded-lg bg-gray-100 flex-shrink-0">
                    <TypeIcon className="h-3 w-3 text-gray-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-medium text-gray-900 mb-0.5 truncate">
                      {artifact.category.label}
                    </h3>
                    <p className="text-xs text-gray-500 truncate">
                      {formatDistanceToNow(new Date(artifact.created_at), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSharingArtifact(artifact)}
                    className="h-7 w-7 p-0 hover:bg-gray-100"
                    title="Share content"
                  >
                    <Share2 className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditContent(artifact)}
                    className="h-7 w-7 p-0 hover:bg-gray-100"
                    title="Edit content"
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopyToClipboard(content, artifact.id)}
                    className="h-7 w-7 p-0 hover:bg-gray-100"
                    title="Copy to clipboard"
                  >
                    {copiedItems.has(artifact.id) ? (
                      <Check className="h-3 w-3 text-green-600" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      handleDownload(
                        content,
                        `${artifact.category.label}-${Date.now()}.txt`
                      )
                    }
                    className="h-7 w-7 p-0 hover:bg-gray-100"
                    title="Download"
                  >
                    <Download className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              {/* Source Testimonials */}
              {artifact.sourceTestimonials.length > 0 && (
                <div className="mb-4 pb-3 border-b border-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-medium text-gray-600">
                      Source Testimonials
                    </p>
                    <Badge
                      variant="secondary"
                      className="text-xs bg-gray-100 text-gray-600 border-0"
                    >
                      {artifact.sourceTestimonials.length}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {artifact.sourceTestimonials
                      .slice(0, 2)
                      .map((testimonial) => (
                        <Button
                          key={testimonial.id}
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/detail/${testimonial.id}`)}
                          className="h-6 px-2 text-xs border-gray-200 hover:border-gray-300 hover:bg-gray-50 bg-white"
                        >
                          <Users className="h-2.5 w-2.5 mr-1 text-gray-400" />
                          {testimonial.author_name || "Unknown"}
                        </Button>
                      ))}
                    {artifact.sourceTestimonials.length > 2 && (
                      <span className="text-xs text-gray-500 px-2 py-1 bg-gray-50 rounded border border-gray-200">
                        +{artifact.sourceTestimonials.length - 2} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Content Preview */}
              {content && (
                <div className="border border-gray-200 rounded-lg p-3 bg-gray-50/30">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-medium text-gray-700">
                      {hasVideo ? "Description" : "Content"}
                    </p>
                    <Badge
                      variant="outline"
                      className="text-xs bg-white border-gray-300 text-gray-500"
                    >
                      {content.length} chars
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed line-clamp-3">
                    {content.length > 150
                      ? `${content.substring(0, 150)}...`
                      : content}
                  </p>
                  {content.length > 150 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditContent(artifact)}
                      className="h-6 px-0 text-xs text-blue-600 hover:text-blue-700 mt-2 font-medium"
                    >
                      View full content →
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      );
    };

    const renderStatsOverview = () => (
      <Card className="border border-gray-200 bg-white">
        <CardContent className="p-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <motion.div
              className="flex items-center gap-3"
              whileHover={{ scale: 1.01 }}
              transition={{ duration: 0.2 }}
            >
              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                <FileText className="h-4 w-4 text-gray-600" />
              </div>
              <div>
                <p className="text-xl font-semibold text-gray-900 mb-0.5">
                  {contentStats.total}
                </p>
                <p className="text-sm text-gray-500">Total Content</p>
              </div>
            </motion.div>

            <motion.div
              className="flex items-center gap-3"
              whileHover={{ scale: 1.01 }}
              transition={{ duration: 0.2 }}
            >
              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                <Layers className="h-4 w-4 text-gray-600" />
              </div>
              <div>
                <p className="text-xl font-semibold text-gray-900 mb-0.5">
                  {Object.keys(contentStats.byCategory).length}
                </p>
                <p className="text-sm text-gray-500">Content Types</p>
              </div>
            </motion.div>

            <motion.div
              className="flex items-center gap-3"
              whileHover={{ scale: 1.01 }}
              transition={{ duration: 0.2 }}
            >
              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                <Target className="h-4 w-4 text-gray-600" />
              </div>
              <div>
                <p className="text-xl font-semibold text-gray-900 mb-0.5">
                  {Object.keys(contentStats.byPlatform).length}
                </p>
                <p className="text-sm text-gray-500">Platforms</p>
              </div>
            </motion.div>

            <motion.div
              className="flex items-center gap-3"
              whileHover={{ scale: 1.01 }}
              transition={{ duration: 0.2 }}
            >
              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                <Users className="h-4 w-4 text-gray-600" />
              </div>
              <div>
                <p className="text-xl font-semibold text-gray-900 mb-0.5">
                  {contentStats.sourceTestimonials.size}
                </p>
                <p className="text-sm text-gray-500">Source Testimonials</p>
              </div>
            </motion.div>
          </div>
        </CardContent>
      </Card>
    );

    const renderEmptyState = () => (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
      >
        <Card className="border-dashed border-2 border-gray-300 bg-gradient-to-br from-gray-50 to-gray-100">
          <CardContent className="p-16 text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center mx-auto mb-6">
              <Brain className="h-8 w-8 text-slate-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              No AI-Generated Content Yet
            </h3>
            <p className="text-gray-600 mb-8 max-w-lg text-sm mx-auto leading-relaxed">
              Transform your testimonials into powerful marketing content using
              AI services for content generation, enhancement, platform
              optimization, and more.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={() => navigate("/studio")}
                className="bg-slate-900 hover:bg-slate-800 text-white"
                size="sm"
              >
                <Brain className="h-4 w-4 mr-2" />
                Start Creating Content
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate("/dashboard")}
                className="border-gray-300 hover:bg-gray-50"
                size="sm"
              >
                Back to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );

    const renderContent = () => {
      if (loading) {
        return (
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse border border-gray-200">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gray-200 rounded-lg flex-shrink-0"></div>
                    <div className="flex-1 space-y-3">
                      <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      <div className="h-16 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        );
      }

      if (filteredArtifacts.length === 0) {
        return renderEmptyState();
      }

      return (
        <div className="space-y-6">
          {/* Statistics Overview */}
          {renderStatsOverview()}

          {/* Contextual Content Filter */}
          <ContextualContentFilter
            artifacts={enhancedArtifacts}
            currentContext="ai-hub"
            showCrossReferences={showCrossReferences}
            onToggleCrossReferences={setShowCrossReferences}
          />

          {/* Main Content Tabs */}
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="space-y-6"
          >
            <Card className="border border-gray-200 bg-white">
              <CardContent className="p-4">
                <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:grid-cols-3">
                  <TabsTrigger
                    value="content"
                    className="flex items-center gap-2"
                  >
                    <Grid3X3 className="h-4 w-4" />
                    Content Gallery
                  </TabsTrigger>
                  <TabsTrigger
                    value="lineage"
                    className="flex items-center gap-2"
                  >
                    <GitBranch className="h-4 w-4" />
                    Processing Lineage
                  </TabsTrigger>
                  <TabsTrigger
                    value="analytics"
                    className="flex items-center gap-2"
                  >
                    <TrendingUp className="h-4 w-4" />
                    Analytics
                  </TabsTrigger>
                </TabsList>
              </CardContent>
            </Card>

            <TabsContent value="content" className="space-y-6">
              {/* View Mode Controls */}
              <Card className="border border-gray-200 bg-white">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">
                        Content View
                      </span>
                    </div>
                    <div className="flex items-center bg-gray-50 rounded-lg p-1 border border-gray-200">
                      <Button
                        variant={viewMode === "tree" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setViewMode("tree")}
                        className="h-7 px-3 text-xs"
                      >
                        <Layers className="h-3 w-3 mr-1" />
                        Tree
                      </Button>
                      <Button
                        variant={viewMode === "timeline" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setViewMode("timeline")}
                        className="h-7 px-3 text-xs"
                      >
                        <Clock className="h-3 w-3 mr-1" />
                        Timeline
                      </Button>
                      <Button
                        variant={viewMode === "grid" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setViewMode("grid")}
                        className="h-7 px-3 text-xs"
                      >
                        <Grid3X3 className="h-3 w-3 mr-1" />
                        Grid
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Content Display */}
              {viewMode === "grid" ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredArtifacts.map(renderArtifactCard)}
                </div>
              ) : (
                <ContentLineageView
                  artifacts={filteredArtifacts}
                  onEdit={handleEditContent}
                  onPreview={handlePreviewContent}
                  onCopy={handleCopyToClipboard}
                  onDownload={handleDownload}
                  onVideoPlay={handleVideoPlay}
                  onShare={setSharingArtifact}
                  copiedItems={copiedItems}
                  viewMode={viewMode}
                />
              )}
            </TabsContent>

            <TabsContent value="lineage" className="space-y-6">
              <ServiceLineageVisualization
                artifacts={filteredArtifacts}
                selectedArtifactId={selectedArtifactId}
                onArtifactSelect={setSelectedArtifactId}
              />
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6">
              <Card className="border border-gray-200 bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                    Content Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-center py-12">
                    Advanced analytics and insights coming soon...
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      );
    };

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={`space-y-8 ${className}`}
      >
        {/* Smart Navigation Banner */}
        <SmartNavigationBanner
          currentContext="ai-hub"
          onNavigate={(target) => {
            if (target === "testimonial-detail") {
              navigate("/dashboard");
            }
          }}
        />

        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                AI Content Hub
              </h1>
              <p className="text-gray-500 max-w-2xl">
                Comprehensive view of all AI-generated content, processing
                lineage, and performance analytics
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <Badge
                variant="outline"
                className="text-sm px-3 py-1.5 bg-white border-gray-300"
              >
                <span className="text-gray-700">
                  {filteredArtifacts.length} of {enhancedArtifacts.length} items
                </span>
              </Badge>
              <Button
                onClick={() => navigate("/studio")}
                className="bg-gray-900 hover:bg-gray-800 text-white"
                size="sm"
              >
                <Brain className="h-4 w-4 mr-2" />
                Create Content
              </Button>
            </div>
          </div>
        </div>

        {/* Advanced Filters */}
        <AdvancedFilters
          filters={filters}
          onFiltersChange={setFilters}
          artifacts={enhancedArtifacts}
          stats={contentStats}
        />

        {/* Content */}
        {renderContent()}

        {/* Video Preview Modal */}
        <ModalPortal isOpen={!!selectedVideo}>
          <VideoPreviewModal
            isOpen={!!selectedVideo}
            onClose={() => setSelectedVideo(null)}
            videoUrl={selectedVideo?.url || ""}
            title={selectedVideo?.title || ""}
            metadata={selectedVideo?.metadata}
          />
        </ModalPortal>

        {/* Content Edit Modal */}
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

        {/* LinkedIn Share Modal */}
        {sharingArtifact && (
          <LinkedInShareModal
            artifact={sharingArtifact}
            isOpen={!!sharingArtifact}
            onOpenChange={(open) => !open && setSharingArtifact(null)}
          />
        )}
      </motion.div>
    );
  }
);

export default AIGeneratedContent;
