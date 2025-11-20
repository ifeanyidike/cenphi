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
  X,
  Sparkles,
  MoreVertical,
  Eye,
  RefreshCw,
  Clock,
  ArrowUpRight,
  CheckSquare,
  Square,
  ChevronLeft,
  ChevronRight,
  FolderMinus,
  ThumbsUp,
  ThumbsDown,
  Folder,
  Trash2,
  Loader2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

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
} from "./ContentCategorization";
import ModalPortal from "@/utils/ModalPortal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Modular Components
import FoldersSidebar from "./FoldersSidebar";
import FolderDialog from "./FolderDialog";
import ContentHubHeader from "./ContentHubHeader";
import ContentStats from "./ContentStats";
import ContentFilterBar from "./ContentFilterBar";

// Approval functionality
import ApprovalBadge from "./ApprovalBadge";
import { approvalService } from "@/services/approvalService";

// Artifact deletion
import { useArtifactService } from "@/services/artifactService";

// Folders functionality
import { useFolders } from "@/hooks/useFolders";
import { ContentFolder } from "@/services/folderService";

interface AIGeneratedContentProps {
  className?: string;
}

const AIGeneratedContent: React.FC<AIGeneratedContentProps> = observer(
  ({ className }) => {
    const navigate = useNavigate();
    const [copiedItems, setCopiedItems] = useState<Set<string>>(new Set());
    const [viewMode, setViewMode] = useState<"grid" | "masonry">("masonry");
    const [groupByCategory, setGroupByCategory] = useState(true); // Enable category grouping by default
    // Start with loading false if we already have cached data
    const [loading, setLoading] = useState(
      aiArtifactsManager.artifacts?.length === 0
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
    // Multi-select state
    const [selectionMode, setSelectionMode] = useState(false);
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

    // Approval state
    const [approvingArtifacts, setApprovingArtifacts] = useState(false);

    // Deletion state
    const [deletingArtifacts, setDeletingArtifacts] = useState<Set<string>>(
      new Set()
    );
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [artifactToDelete, setArtifactToDelete] =
      useState<EnhancedArtifact | null>(null);

    // Artifact service
    const { deleteArtifact } = useArtifactService();

    // Filters
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
    const [selectedApprovalStatus, setSelectedApprovalStatus] = useState<
      string[]
    >([]);
    const [sortBy, setSortBy] = useState<"newest" | "oldest" | "popular">(
      "newest"
    );

    // Folder state
    const [selectedFolderId, setSelectedFolderId] = useState<string | null>(
      null
    );
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [mobileFoldersOpen, setMobileFoldersOpen] = useState(false);
    const [folderDialogOpen, setFolderDialogOpen] = useState(false);
    const [folderDialogMode, setFolderDialogMode] = useState<"create" | "edit">(
      "create"
    );
    const [editingFolder, setEditingFolder] = useState<ContentFolder | null>(
      null
    );
    const [deletingFolder, setDeletingFolder] = useState<ContentFolder | null>(
      null
    );
    const [downloadingFolders, setDownloadingFolders] = useState<Set<string>>(
      new Set()
    );
    const [downloadingClips, setDownloadingClips] = useState<Set<string>>(
      new Set()
    );
    const [folderArtifactIds, setFolderArtifactIds] = useState<Set<string>>(
      new Set()
    );

    // Folders hook
    const {
      folders,
      isLoading: foldersLoading,
      createFolder,
      updateFolder,
      deleteFolder,
      addItemsToFolder,
      removeItemFromFolder,
      getFolderItems,
      downloadFolderAsZip,
      downloadClipCollectionAsZip,
    } = useFolders();

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
              a.processing_type !== "highlight_extraction" &&
              a.processing_type !== "enhancement" &&
              a.processing_type !== "viral_analysis" &&
              a.processing_type !== "translation" &&
              a.processing_type !== "narration" &&
              a.processing_type !== "text_polishing"
            // custom_pipeline and clipping are INCLUDED (not excluded) - they're finished products
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

    // Fetch folder items when a folder is selected
    useEffect(() => {
      const fetchFolderItems = async () => {
        if (!selectedFolderId) {
          setFolderArtifactIds(new Set());
          return;
        }

        try {
          const items = await getFolderItems(selectedFolderId);
          const artifactIds = items.map((item: any) => item.id);
          setFolderArtifactIds(new Set(artifactIds));
        } catch (error) {
          console.error("Failed to fetch folder items:", error);
          setFolderArtifactIds(new Set());
        }
      };

      fetchFolderItems();
    }, [selectedFolderId]); // eslint-disable-line react-hooks/exhaustive-deps

    const filteredArtifacts = useMemo(() => {
      const filtered = enhancedArtifacts.filter((artifact) => {
        // Folder filter
        if (selectedFolderId) {
          // Only show artifacts that are in this folder
          const isInFolder = folderArtifactIds.has(artifact.id);
          if (!isInFolder) {
            return false;
          }
        }

        // Search filter
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

        // Category filter
        if (
          selectedCategories?.length > 0 &&
          !selectedCategories.includes(artifact.category.id)
        ) {
          return false;
        }

        // Platform filter
        if (selectedPlatforms?.length > 0) {
          if (
            !artifact.platformTarget ||
            !selectedPlatforms.includes(artifact.platformTarget.id)
          ) {
            return false;
          }
        }

        // Approval status filter
        if (selectedApprovalStatus?.length > 0) {
          const status = artifact.approval_status || "draft";
          if (!selectedApprovalStatus.includes(status)) {
            return false;
          }
        }

        return true;
      });

      // Sort
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
      selectedApprovalStatus,
      selectedPlatforms,
      sortBy,
      selectedFolderId,
      folderArtifactIds,
      folders,
    ]);

    const handleVideoPlay = (artifact: TestimonialArtifact) => {
      if (artifact.asset_url) {
        setSelectedVideo({
          url: artifact.asset_url,
          title: artifact.data?.title || "Story Video",
          thumbnail_url:
            artifact?.thumbnail_url || artifact?.data?.thumbnail_url || "",
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

    const toggleApprovalStatus = (status: string) => {
      setSelectedApprovalStatus((prev) =>
        prev.includes(status)
          ? prev.filter((s) => s !== status)
          : [...prev, status]
      );
    };

    const clearFilters = () => {
      setSearchQuery("");
      setSelectedCategories([]);
      setSelectedPlatforms([]);
      setSelectedApprovalStatus([]);
    };

    // Folder management functions
    const handleCreateFolder = () => {
      setFolderDialogMode("create");
      setEditingFolder(null);
      setFolderDialogOpen(true);
    };

    const handleEditFolder = (folder: ContentFolder) => {
      setFolderDialogMode("edit");
      setEditingFolder(folder);
      setFolderDialogOpen(true);
    };

    const handleDeleteFolder = (folder: ContentFolder) => {
      setDeletingFolder(folder);
    };

    const handleDownloadFolder = async (folder: ContentFolder) => {
      setDownloadingFolders((prev) => new Set(prev).add(folder.id));
      try {
        await downloadFolderAsZip(folder.id);
      } catch (error) {
        console.error("Failed to download folder:", error);
      } finally {
        setDownloadingFolders((prev) => {
          const next = new Set(prev);
          next.delete(folder.id);
          return next;
        });
      }
    };

    const confirmDeleteFolder = async () => {
      if (!deletingFolder) return;
      try {
        await deleteFolder(deletingFolder.id);
        if (selectedFolderId === deletingFolder.id) {
          setSelectedFolderId(null);
        }
      } catch (error) {
        console.error("Failed to delete folder:", error);
      } finally {
        setDeletingFolder(null);
      }
    };

    const handleSaveFolder = async (data: {
      name: string;
      description?: string;
      color?: string;
      icon?: string;
    }) => {
      try {
        if (folderDialogMode === "create") {
          await createFolder(data);
        } else if (editingFolder) {
          await updateFolder(editingFolder.id, data);
        }
        setFolderDialogOpen(false);
      } catch (error) {
        console.error("Failed to save folder:", error);
        throw error;
      }
    };

    const handleAddToFolder = async (
      folderId: string,
      artifactIds: string[]
    ) => {
      try {
        await addItemsToFolder(folderId, artifactIds);

        // If we're currently viewing this folder, refresh its items from backend
        if (selectedFolderId === folderId) {
          const items = await getFolderItems(folderId);
          const itemIds = items.map((item: any) => item.id);
          setFolderArtifactIds(new Set(itemIds));
        }

        // Deselect items after adding
        setSelectedItems(new Set());
        setSelectionMode(false);
      } catch (error) {
        console.error("Failed to add items to folder:", error);
      }
    };

    const handleRemoveFromFolder = async (artifactId: string) => {
      if (!selectedFolderId) return;

      try {
        await removeItemFromFolder(selectedFolderId, artifactId);

        // Remove from local state
        setFolderArtifactIds((prev) => {
          const newSet = new Set(prev);
          newSet.delete(artifactId);
          return newSet;
        });
      } catch (error) {
        console.error("Failed to remove item from folder:", error);
      }
    };

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
      if (selectedItems.size === filteredArtifacts?.length) {
        setSelectedItems(new Set());
      } else {
        setSelectedItems(new Set(filteredArtifacts?.map((a) => a.id) || []));
      }
    };

    const handleShareSelected = () => {
      if (selectedItems.size > 0) {
        // Get all selected artifacts
        const artifacts = filteredArtifacts.filter((a) =>
          selectedItems.has(a.id)
        );

        if (artifacts?.length > 0) {
          // Use the first artifact as the main artifact, pass all as artifacts prop
          setSharingArtifact(artifacts[0]);
          // ShareDrawer will receive artifacts prop via the component below
        }
      }
    };

    // Approval handlers
    const handleBulkApprove = async () => {
      const currentWorkspace = workspaceHub.workspace;
      if (!currentWorkspace?.id || selectedItems.size === 0) return;

      setApprovingArtifacts(true);
      try {
        await approvalService.bulkUpdateApprovalStatus(
          currentWorkspace.id,
          Array.from(selectedItems),
          "approved"
        );

        // Refresh artifacts to show updated approval status
        const allArtifacts = await aiArtifactsManager.getArtifactsByWorkspace(
          currentWorkspace.id
        );
        const requiredArtifacts = allArtifacts.filter(
          (a) =>
            a.processing_type !== "sentiment_analysis" &&
            a.processing_type !== "highlight_extraction" &&
            a.processing_type !== "enhancement" &&
            a.processing_type !== "viral_analysis" &&
            a.processing_type !== "translation" &&
            a.processing_type !== "narration" &&
            a.processing_type !== "text_polishing"
        );
        setArtifacts(requiredArtifacts);

        // Clear selection
        setSelectedItems(new Set());
        setSelectionMode(false);
      } catch (error) {
        console.error("Failed to approve artifacts:", error);
      } finally {
        setApprovingArtifacts(false);
      }
    };

    const handleBulkReject = async () => {
      const currentWorkspace = workspaceHub.workspace;
      if (!currentWorkspace?.id || selectedItems.size === 0) return;

      setApprovingArtifacts(true);
      try {
        await approvalService.bulkUpdateApprovalStatus(
          currentWorkspace.id,
          Array.from(selectedItems),
          "rejected"
        );

        // Refresh artifacts to show updated approval status
        const allArtifacts = await aiArtifactsManager.getArtifactsByWorkspace(
          currentWorkspace.id
        );
        const requiredArtifacts = allArtifacts.filter(
          (a) =>
            a.processing_type !== "sentiment_analysis" &&
            a.processing_type !== "highlight_extraction" &&
            a.processing_type !== "enhancement" &&
            a.processing_type !== "viral_analysis" &&
            a.processing_type !== "translation" &&
            a.processing_type !== "narration" &&
            a.processing_type !== "text_polishing"
        );
        setArtifacts(requiredArtifacts);

        // Clear selection
        setSelectedItems(new Set());
        setSelectionMode(false);
      } catch (error) {
        console.error("Failed to reject artifacts:", error);
      } finally {
        setApprovingArtifacts(false);
      }
    };

    const handleDeleteArtifact = (artifact: EnhancedArtifact) => {
      setArtifactToDelete(artifact);
      setShowDeleteDialog(true);
    };

    const confirmDeleteArtifact = async () => {
      if (!artifactToDelete) return;

      const currentWorkspace = workspaceHub.workspace;
      if (!currentWorkspace?.id) return;

      setDeletingArtifacts((prev) => new Set(prev).add(artifactToDelete.id));
      setShowDeleteDialog(false);

      try {
        await deleteArtifact(artifactToDelete.id);

        // Refresh artifacts after deletion
        const allArtifacts = await aiArtifactsManager.getArtifactsByWorkspace(
          currentWorkspace.id
        );
        const requiredArtifacts = allArtifacts.filter(
          (a) =>
            a.processing_type !== "sentiment_analysis" &&
            a.processing_type !== "highlight_extraction" &&
            a.processing_type !== "enhancement" &&
            a.processing_type !== "viral_analysis" &&
            a.processing_type !== "translation" &&
            a.processing_type !== "narration" &&
            a.processing_type !== "text_polishing"
        );
        setArtifacts(requiredArtifacts);

        // Remove from selection if it was selected
        if (selectedItems.has(artifactToDelete.id)) {
          const newSelected = new Set(selectedItems);
          newSelected.delete(artifactToDelete.id);
          setSelectedItems(newSelected);
        }
      } catch (error) {
        console.error("Failed to delete artifact:", error);
      } finally {
        setDeletingArtifacts((prev) => {
          const next = new Set(prev);
          next.delete(artifactToDelete.id);
          return next;
        });
        setArtifactToDelete(null);
      }
    };

    const selectedArtifacts = useMemo(() => {
      return filteredArtifacts.filter((a) => selectedItems.has(a.id));
    }, [filteredArtifacts, selectedItems]);

    // Group artifacts by category
    const groupedArtifacts = useMemo(() => {
      if (!groupByCategory) return null;

      const groups = new Map<string, EnhancedArtifact[]>();

      filteredArtifacts.forEach((artifact) => {
        const categoryId = artifact.category.id;
        if (!groups.has(categoryId)) {
          groups.set(categoryId, []);
        }
        groups.get(categoryId)!.push(artifact);
      });

      return groups;
    }, [filteredArtifacts, groupByCategory]);

    // Premium Video Card
    const renderVideoCard = (artifact: EnhancedArtifact, index: number) => {
      const TypeIcon = artifact.category.icon;
      const isHovered = hoveredVideo === artifact.id;
      const isSelected = selectedItems.has(artifact.id);

      // Extract aspect ratio - prioritize actual video data over platform default
      // Only use platform aspect ratio if no actual video metadata is available
      const hasActualAspectRatio =
        artifact.data?.aspect_ratio ||
        artifact.processing_metadata?.aspect_ratio;
      const aspectRatio =
        hasActualAspectRatio || artifact.platformTarget?.aspectRatio || "16:9";

      // Determine if vertical video (9:16 or similar)
      // Only check aspect ratio string, NOT platform
      const isVertical =
        aspectRatio.includes("9:16") || aspectRatio.includes("9/16");

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
              className={`relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden ${getAspectRatioClass()}`}
            >
              <video
                src={artifact.asset_url}
                className="w-full h-full object-contain bg-slate-900"
                muted
                loop
                playsInline
                preload="metadata"
                poster={
                  artifact?.thumbnail_url || artifact?.data?.thumbnail_url
                }
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
              {(artifact.duration || artifact.data?.duration) && (
                <div className="absolute bottom-3 right-3">
                  <Badge className="backdrop-blur-xl bg-black/60 border border-white/10 text-white text-[9px] px-2 py-0.5 font-medium">
                    {Math.floor(
                      (artifact.duration || artifact.data.duration) / 60
                    )}
                    :
                    {String(
                      Math.floor(
                        (artifact.duration || artifact.data.duration) % 60
                      )
                    ).padStart(2, "0")}
                  </Badge>
                </div>
              )}

              {/* Approval Badge - Bottom Left */}
              {artifact.approval_status && (
                <div className="absolute bottom-3 left-3">
                  <ApprovalBadge status={artifact.approval_status} size="sm" />
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
                    {artifact.sourceTestimonials?.length > 0 && (
                      <>
                        <span>•</span>
                        <span>
                          {artifact.sourceTestimonials?.length} source
                          {artifact.sourceTestimonials?.length > 1 ? "s" : ""}
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
                    {selectedFolderId && (
                      <DropdownMenuItem
                        onClick={() => handleRemoveFromFolder(artifact.id)}
                        className="text-[10px] text-red-600 focus:text-red-600 cursor-pointer"
                      >
                        <FolderMinus className="h-3 w-3 mr-2" />
                        Remove from Collection
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      onClick={() => handleDeleteArtifact(artifact)}
                      className="text-[10px] text-red-600 focus:text-red-600 cursor-pointer"
                      disabled={deletingArtifacts.has(artifact.id)}
                    >
                      {deletingArtifacts.has(artifact.id) ? (
                        <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                      ) : (
                        <Trash2 className="h-3 w-3 mr-2" />
                      )}
                      {deletingArtifacts.has(artifact.id)
                        ? "Deleting..."
                        : "Delete"}
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
      const wordCount = content.split(/\s+/)?.filter(Boolean)?.length;
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
                <div className="flex items-center gap-2">
                  {artifact.approval_status && (
                    <ApprovalBadge
                      status={artifact.approval_status}
                      size="sm"
                    />
                  )}
                  {artifact.platformTarget && (
                    <Badge className="bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 border-blue-200/50 text-[9px] px-2 py-0.5">
                      {artifact.platformTarget.name}
                    </Badge>
                  )}
                </div>
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
                {content?.length > 300 && (
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
                    {content?.length} chars
                  </Badge>
                  {artifact.sourceTestimonials.length > 0 && (
                    <Badge
                      variant="outline"
                      className="text-[8px] px-1.5 py-0 bg-white/50 border-slate-200/50"
                    >
                      {artifact.sourceTestimonials?.length} source
                      {artifact.sourceTestimonials?.length > 1 ? "s" : ""}
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
                      {selectedFolderId && (
                        <DropdownMenuItem
                          onClick={() => handleRemoveFromFolder(artifact.id)}
                          className="text-[10px] text-red-600 focus:text-red-600 cursor-pointer"
                        >
                          <FolderMinus className="h-3 w-3 mr-2" />
                          Remove from Collection
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        onClick={() => handleDeleteArtifact(artifact)}
                        className="text-[10px] text-red-600 focus:text-red-600 cursor-pointer"
                        disabled={deletingArtifacts.has(artifact.id)}
                      >
                        {deletingArtifacts.has(artifact.id) ? (
                          <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                        ) : (
                          <Trash2 className="h-3 w-3 mr-2" />
                        )}
                        {deletingArtifacts.has(artifact.id)
                          ? "Deleting..."
                          : "Delete"}
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

    // Clips Artifact Card - Shows multiple clips from clipping artifact
    const renderClipsArtifactCard = (
      artifact: EnhancedArtifact,
      index: number
    ) => {
      const TypeIcon = artifact.category.icon;
      const isSelected = selectedItems.has(artifact.id);

      // Extract clips from the artifact data
      const clips = Array.isArray(artifact.data.generated_clips)
        ? artifact.data.generated_clips
        : [];

      // Show first 3 clips as preview
      const previewClips = clips.slice(0, 3);
      const totalClips = clips?.length;

      return (
        <motion.div
          key={artifact.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ delay: index * 0.03, duration: 0.4 }}
        >
          <Card
            className={`relative overflow-hidden border-0 bg-white shadow-sm hover:shadow-xl transition-all duration-300 ${isSelected ? "ring-4 ring-blue-500" : ""}`}
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
                <div
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${isSelected ? "bg-blue-500 border-blue-500" : "bg-white border-slate-300 hover:border-blue-400"}`}
                >
                  {isSelected && (
                    <Check className="w-3 h-3 text-white" strokeWidth={3} />
                  )}
                </div>
              </div>
            )}

            {/* Clips Preview Grid */}
            <div className="grid grid-cols-3 gap-0.5 bg-slate-100">
              {previewClips.map((clip: any, idx: number) => (
                <div
                  key={idx}
                  className="relative aspect-video bg-gradient-to-br from-slate-900 to-slate-800 overflow-hidden"
                >
                  {clip.thumbnail_url ? (
                    <img
                      src={clip.thumbnail_url}
                      alt={clip.title || `Clip ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <video
                      src={clip.url}
                      className="w-full h-full object-cover"
                      muted
                      preload="metadata"
                    />
                  )}
                  <div className="absolute inset-0 bg-black/20" />
                  {idx === 2 && totalClips > 3 && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <span className="text-white text-xs font-semibold">
                        +{totalClips - 3} more
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Artifact Info */}
            <div className="p-4">
              {/* Header */}
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <Badge
                    className={`${artifact.category.color} text-[9px] px-2 py-0.5 font-medium`}
                  >
                    <TypeIcon className="h-2.5 w-2.5 mr-1" />
                    {artifact.category.label}
                  </Badge>
                  <Badge variant="outline" className="text-[9px] px-2 py-0.5">
                    {totalClips} {totalClips === 1 ? "Clip" : "Clips"}
                  </Badge>
                </div>
              </div>

              {/* Source Info */}
              {artifact.sourceTestimonials?.length > 0 && (
                <p className="text-[10px] text-slate-600 mb-3">
                  From:{" "}
                  <span className="font-medium text-slate-900">
                    {artifact.sourceTestimonials[0].author_name || "Unknown"}
                  </span>
                </p>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    // Navigate to testimonial detail to see all clips
                    if (artifact.testimonial_id) {
                      navigate(
                        `/detail/${artifact.testimonial_id}?tab=artifacts&artifactTab=clipping`
                      );
                    }
                  }}
                  className="flex-1 h-8 text-[10px]"
                >
                  <Eye className="h-3 w-3 mr-1.5" />
                  View All Clips
                </Button>
                {!selectionMode && (
                  <>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setSharingArtifact(artifact)}
                      className="h-8 px-2"
                    >
                      <Share2 className="h-3 w-3" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="sm" variant="ghost" className="h-8 px-2">
                          <MoreVertical className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem
                          onClick={async () => {
                            setDownloadingClips((prev) =>
                              new Set(prev).add(artifact.id)
                            );
                            try {
                              await downloadClipCollectionAsZip(artifact.id);
                            } catch (error) {
                              console.error("Failed to download clips:", error);
                            } finally {
                              setDownloadingClips((prev) => {
                                const next = new Set(prev);
                                next.delete(artifact.id);
                                return next;
                              });
                            }
                          }}
                          disabled={downloadingClips.has(artifact.id)}
                          className="text-[10px] cursor-pointer"
                        >
                          {downloadingClips.has(artifact.id) ? (
                            <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                          ) : (
                            <Download className="h-3 w-3 mr-2" />
                          )}
                          {downloadingClips.has(artifact.id)
                            ? "Downloading..."
                            : "Download All Clips"}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteArtifact(artifact)}
                          className="text-[10px] text-red-600 focus:text-red-600 cursor-pointer"
                          disabled={deletingArtifacts.has(artifact.id)}
                        >
                          {deletingArtifacts.has(artifact.id) ? (
                            <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                          ) : (
                            <Trash2 className="h-3 w-3 mr-2" />
                          )}
                          {deletingArtifacts.has(artifact.id)
                            ? "Deleting..."
                            : "Delete All Clips"}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </>
                )}
              </div>

              {/* Approval Badge */}
              <ApprovalBadge
                status={artifact.approval_status || "draft"}
                className="mt-3"
              />
            </div>
          </Card>
        </motion.div>
      );
    };

    const renderArtifactCard = (artifact: EnhancedArtifact, index: number) => {
      // Special handling for clipping artifacts - they have clips in data.generated_clips
      if (
        artifact.processing_type === "clipping" &&
        artifact.data?.generated_clips
      ) {
        return renderClipsArtifactCard(artifact, index);
      }

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
            Explore Studio
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
        <div className="max-w-full mx-auto">
          <div className="flex max-w-full gap-4 lg:gap-6 px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
            {/* Folders Sidebar - Left */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{
                opacity: 1,
                x: 0,
                width: sidebarCollapsed ? "3rem" : "12rem",
              }}
              transition={{ duration: 0.3 }}
              className="hidden lg:block flex-shrink-0 relative"
            >
              <div className="sticky top-6">
                {/* Toggle Button */}
                <button
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                  className="absolute -right-3 top-12 z-10 w-6 h-6 bg-white border border-slate-200 rounded-full flex items-center justify-center hover:bg-slate-50 transition-colors shadow-sm"
                  title={
                    sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"
                  }
                >
                  {sidebarCollapsed ? (
                    <ChevronRight className="h-3 w-3 text-slate-600" />
                  ) : (
                    <ChevronLeft className="h-3 w-3 text-slate-600" />
                  )}
                </button>

                <div className="opacity-70 hover:opacity-100 transition-opacity">
                  {!sidebarCollapsed && (
                    <FoldersSidebar
                      folders={folders}
                      isLoading={foldersLoading}
                      selectedFolderId={selectedFolderId}
                      onSelectFolder={setSelectedFolderId}
                      onCreateFolder={handleCreateFolder}
                      onEditFolder={handleEditFolder}
                      onDeleteFolder={handleDeleteFolder}
                      onDownloadFolder={handleDownloadFolder}
                      downloadingFolders={downloadingFolders}
                      totalContentCount={enhancedArtifacts?.length}
                    />
                  )}
                </div>
              </div>
            </motion.div>

            {/* Main Content Area - Center */}
            <div className="flex-1 min-w-0">
              {/* Mobile Folders Button - Only visible on small screens */}
              <div className="lg:hidden mb-4">
                <Sheet
                  open={mobileFoldersOpen}
                  onOpenChange={setMobileFoldersOpen}
                >
                  <SheetTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start gap-2 h-10 text-xs border-slate-200/50 bg-white/50 hover:bg-white"
                    >
                      <Folder className="h-4 w-4" />
                      <span>Folders</span>
                      {selectedFolderId && folders && (
                        <Badge
                          variant="secondary"
                          className="ml-auto text-[10px]"
                        >
                          {folders.find((f) => f.id === selectedFolderId)
                            ?.name || "Selected"}
                        </Badge>
                      )}
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-80 p-0">
                    <SheetHeader className="px-6 py-4 border-b">
                      <SheetTitle className="text-base font-semibold">
                        Folders
                      </SheetTitle>
                    </SheetHeader>
                    <div className="px-4 py-4">
                      <FoldersSidebar
                        folders={folders}
                        isLoading={foldersLoading}
                        selectedFolderId={selectedFolderId}
                        onSelectFolder={(folderId) => {
                          setSelectedFolderId(folderId);
                          setMobileFoldersOpen(false);
                        }}
                        onCreateFolder={handleCreateFolder}
                        onEditFolder={handleEditFolder}
                        onDeleteFolder={handleDeleteFolder}
                        onDownloadFolder={handleDownloadFolder}
                        downloadingFolders={downloadingFolders}
                        totalContentCount={enhancedArtifacts?.length}
                      />
                    </div>
                  </SheetContent>
                </Sheet>
              </div>

              {/* Header */}
              <ContentHubHeader
                selectedFolderId={selectedFolderId}
                folders={folders}
                filteredCount={filteredArtifacts?.length}
                totalCount={enhancedArtifacts?.length}
                selectionMode={selectionMode}
                selectedItemsCount={selectedItems.size}
                onToggleSelectionMode={toggleSelectionMode}
                onCreateFolder={handleCreateFolder}
                onAddToFolder={handleAddToFolder}
                selectedItems={selectedItems}
              />

              {/* Stats */}
              {!showLoading && enhancedArtifacts?.length > 0 && (
                <ContentStats
                  stats={{
                    total: contentStats.total,
                    categoriesCount: Object.keys(contentStats.byCategory)
                      ?.length,
                    platformsCount: Object.keys(contentStats.byPlatform)
                      ?.length,
                    sourcesCount: contentStats.sourceTestimonials.size,
                  }}
                />
              )}

              {/* Filter Bar */}
              <ContentFilterBar
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                groupByCategory={groupByCategory}
                onToggleGrouping={setGroupByCategory}
                sortBy={sortBy}
                onSortChange={setSortBy}
                selectedCategories={selectedCategories}
                onToggleCategory={toggleCategory}
                selectedPlatforms={selectedPlatforms}
                onTogglePlatform={togglePlatform}
                selectedApprovalStatus={selectedApprovalStatus}
                onToggleApprovalStatus={toggleApprovalStatus}
                onClearFilters={clearFilters}
                contentStats={contentStats}
                filterOpen={filterOpen}
                onToggleFilter={() => setFilterOpen(!filterOpen)}
              />

              {/* Content Grid */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.6 }}
              >
                {showLoading ? (
                  renderLoadingState()
                ) : filteredArtifacts?.length === 0 ? (
                  renderEmptyState()
                ) : groupByCategory && groupedArtifacts ? (
                  // Grouped by category view
                  <div className="space-y-8">
                    {CONTENT_CATEGORIES.map((category) => {
                      const artifacts = groupedArtifacts.get(category.id);
                      if (!artifacts || artifacts?.length === 0) return null;

                      const CategoryIcon = category.icon;

                      return (
                        <motion.div
                          key={category.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.4 }}
                        >
                          {/* Category Header */}
                          <div className="flex items-center gap-3 mb-4">
                            <div className={`p-2 rounded-lg ${category.color}`}>
                              <CategoryIcon className="h-4 w-4" />
                            </div>
                            <div>
                              <h3 className="text-sm font-semibold text-slate-900">
                                {category.label}
                              </h3>
                              <p className="text-[10px] text-slate-500">
                                {artifacts?.length}{" "}
                                {artifacts?.length === 1 ? "item" : "items"}
                              </p>
                            </div>
                          </div>

                          {/* Category Content */}
                          {viewMode === "masonry" ? (
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
                              {artifacts.map((artifact, index) =>
                                renderArtifactCard(artifact, index)
                              )}
                            </Masonry>
                          ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                              {artifacts.map((artifact, index) =>
                                renderArtifactCard(artifact, index)
                              )}
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                ) : viewMode === "masonry" ? (
                  // Ungrouped masonry view
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
                  // Ungrouped grid view
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
                            {selectedItems.size ===
                            filteredArtifacts?.length ? (
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
                            variant="outline"
                            size="sm"
                            onClick={handleBulkApprove}
                            disabled={approvingArtifacts}
                            className="h-9 text-xs text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                          >
                            <ThumbsUp className="h-3.5 w-3.5 mr-1.5" />
                            {approvingArtifacts ? "Approving..." : "Approve"}
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleBulkReject}
                            disabled={approvingArtifacts}
                            className="h-9 text-xs text-rose-700 border-rose-200 hover:bg-rose-50"
                          >
                            <ThumbsDown className="h-3.5 w-3.5 mr-1.5" />
                            {approvingArtifacts ? "Rejecting..." : "Reject"}
                          </Button>

                          <Button
                            variant="default"
                            size="sm"
                            onClick={handleShareSelected}
                            className="h-9 text-xs bg-blue-600 hover:bg-blue-700"
                          >
                            <Share2 className="h-3.5 w-3.5 mr-1.5" />
                            {selectedItems.size > 1
                              ? "Create Carousel"
                              : "Share"}
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
          </div>
        </div>

        {/* Modals */}
        <ModalPortal isOpen={!!selectedVideo}>
          <VideoPreviewModal
            isOpen={!!selectedVideo}
            onClose={() => setSelectedVideo(null)}
            thumbnail_url={selectedVideo?.thumbnail_url || ""}
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
              selectedArtifacts?.length > 1 ? selectedArtifacts : undefined
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

        {/* Folder Management Dialogs */}
        <FolderDialog
          open={folderDialogOpen}
          onClose={() => setFolderDialogOpen(false)}
          onSave={handleSaveFolder}
          folder={editingFolder}
          mode={folderDialogMode}
        />

        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-slate-900">
                Delete Artifact?
              </DialogTitle>
              <DialogDescription className="text-[11px] text-slate-600 mt-2">
                Are you sure you want to delete this{" "}
                {artifactToDelete?.category.label}? This action cannot be
                undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-6">
              <Button
                variant="ghost"
                onClick={() => {
                  setShowDeleteDialog(false);
                  setArtifactToDelete(null);
                }}
                className="text-[11px]"
              >
                Cancel
              </Button>
              <Button
                onClick={confirmDeleteArtifact}
                className="text-[11px] bg-red-600 hover:bg-red-700 text-white"
              >
                <Trash2 className="h-3 w-3 mr-2" />
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog
          open={!!deletingFolder}
          onOpenChange={() => setDeletingFolder(null)}
        >
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-slate-900">
                Delete Folder?
              </DialogTitle>
              <DialogDescription className="text-[11px] text-slate-600 mt-2">
                Are you sure you want to delete "{deletingFolder?.name}"? This
                action cannot be undone. The content inside will not be deleted.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-6">
              <Button
                variant="ghost"
                onClick={() => setDeletingFolder(null)}
                className="text-[11px]"
              >
                Cancel
              </Button>
              <Button
                onClick={confirmDeleteFolder}
                className="text-[11px] bg-red-600 hover:bg-red-700 text-white"
              >
                Delete Folder
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }
);

export default AIGeneratedContent;
