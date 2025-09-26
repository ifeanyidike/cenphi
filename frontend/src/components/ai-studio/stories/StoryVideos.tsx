// components/studio/stories/StoryVideosPage.tsx
import React, { useState, useEffect } from "react";
import { observer } from "mobx-react-lite";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Video,
  Play,
  Calendar,
  Users,
  Clock,
  Download,
  Share2,
  MoreHorizontal,
  Search,
  Filter,
  Grid,
  List,
  Sparkles,
  Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { workspaceHub } from "@/repo/workspace_hub";
import { aiStudioManager } from "@/repo/managers/ai_studio_manager";
import VideoPreviewModal from "@/components/TestimonialDetail/VideoPreviewModal";

const StoryVideos: React.FC = observer(() => {
  const { jobId } = useParams<{ jobId?: string }>();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<"recent" | "oldest" | "sources">(
    "recent"
  );
  const [selectedVideo, setSelectedVideo] = useState<any>(null);

  // Get story video artifacts and jobs
  const storyJobs = aiStudioManager.jobs.filter(
    (job) =>
      job.service === "story_mode" &&
      (job.status === "completed" ||
        job.status === "processing" ||
        job.status === "streaming")
  );

  useEffect(() => {
    if (jobId) {
      // Check if it's an active job first
      const activeJob = storyJobs.find((job) => job.id === jobId);
      if (activeJob) {
        // If processing, scroll to it and maybe show status
        const jobElement = document.getElementById(`job-${jobId}`);
        if (jobElement) {
          jobElement.scrollIntoView({ behavior: "smooth" });
        }

        // If completed with video, show preview
        if (activeJob.status === "completed" && activeJob.result?.url) {
          setSelectedVideo({
            url: activeJob.result.url,
            title: `Story Video (${activeJob.testimonialIds?.length || 0} sources)`,
            metadata: activeJob.metadata,
          });
        }
      }
    }
  }, [jobId, storyJobs]);

  // Get completed story video artifacts from testimonials
  const allTestimonials = workspaceHub.testimonialManager.testimonials || [];
  const storyArtifacts = allTestimonials.flatMap((testimonial) =>
    (testimonial.artifacts || [])
      .filter(
        (artifact) =>
          artifact.processing_type === "story_mode_generation" &&
          artifact.asset_url
      )
      .map((artifact) => ({
        ...artifact,
        testimonial_id: testimonial.id,
        testimonial_name: testimonial.author_name || "Anonymous",
      }))
  );

  // Combine jobs and artifacts for display
  const allStoryItems = [
    ...storyJobs.map((job) => ({
      id: job.id,
      type: "job" as const,
      title: `Story Video ${job.testimonialIds?.length ? `(${job.testimonialIds.length} sources)` : ""}`,
      status: job.status,
      created_at: job.startTime,
      progress: job.progress,
      source_count: job.testimonialIds?.length || 0,
      video_url: job.result?.url,
      metadata: job.metadata,
      job: job,
    })),
    ...storyArtifacts.map((artifact) => ({
      id: artifact.id,
      type: "artifact" as const,
      title: artifact.data?.title || "Story Video",
      status: "completed" as const,
      created_at: new Date(artifact.created_at || Date.now()),
      progress: 100,
      source_count: artifact.data?.source_testimonials?.length || 1,
      video_url: artifact.asset_url,
      metadata: artifact.data,
      testimonial_id: artifact.testimonial_id,
      testimonial_name: artifact.testimonial_name,
    })),
  ];

  // Filter and sort
  const filteredItems = allStoryItems
    .filter(
      (item) =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.type === "artifact" &&
          item.testimonial_name
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()))
    )
    .sort((a, b) => {
      switch (sortBy) {
        case "recent":
          return b.created_at.getTime() - a.created_at.getTime();
        case "oldest":
          return a.created_at.getTime() - b.created_at.getTime();
        case "sources":
          return b.source_count - a.source_count;
        default:
          return 0;
      }
    });

  // Focus on specific job if jobId provided
  useEffect(() => {
    if (jobId) {
      const targetJob = storyJobs.find((job) => job.id === jobId);
      if (targetJob && targetJob.result?.url) {
        setSelectedVideo({
          url: targetJob.result.url,
          title: `Story Video (${targetJob.testimonialIds?.length || 0} sources)`,
          metadata: targetJob.metadata,
        });
      }
    }
  }, [jobId, storyJobs]);

  const handleVideoPlay = (item: any) => {
    if (item.video_url) {
      setSelectedVideo({
        url: item.video_url,
        title: item.title,
        metadata: item.metadata,
      });
    }
  };

  //   const formatDuration = (startTime: Date, endTime?: Date) => {
  //     if (!endTime) return "Processing...";
  //     const duration = endTime.getTime() - startTime.getTime();
  //     const minutes = Math.floor(duration / 60000);
  //     const seconds = Math.floor((duration % 60000) / 1000);
  //     return `${minutes}m ${seconds}s`;
  //   };

  return (
    <div className="min-h-screen ">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/studio")}
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Studio
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
                  <Video className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">
                    Story Videos
                  </h1>
                  <p className="text-sm text-gray-600">
                    AI-generated video stories from testimonials
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                {filteredItems.length} videos
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search story videos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-80"
              />
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="w-4 h-4 mr-2" />
                  Sort: {sortBy}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setSortBy("recent")}>
                  <Calendar className="w-4 h-4 mr-2" />
                  Most Recent
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("oldest")}>
                  <Calendar className="w-4 h-4 mr-2" />
                  Oldest First
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("sources")}>
                  <Users className="w-4 h-4 mr-2" />
                  Most Sources
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === "grid" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("grid")}
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("list")}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Empty State */}
        {filteredItems.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Video className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Story Videos
            </h3>
            <p className="text-gray-600 max-w-md mx-auto">
              Create story videos by selecting multiple testimonials and using
              the Story Mode service in AI Studio.
            </p>
            <Button onClick={() => navigate("/studio")} className="mt-4">
              <Sparkles className="w-4 h-4 mr-2" />
              Create Story Video
            </Button>
          </div>
        )}

        {/* Video Grid/List */}
        {filteredItems.length > 0 && (
          <div
            className={
              viewMode === "grid"
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                : "space-y-4"
            }
          >
            <AnimatePresence>
              {filteredItems.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                  className={viewMode === "list" ? "w-full" : ""}
                >
                  <Card
                    className={`group hover:shadow-lg transition-all duration-200 ${
                      item.id === jobId ? "ring-2 ring-blue-500" : ""
                    } ${viewMode === "list" ? "flex" : ""}`}
                  >
                    <div
                      className={`relative ${viewMode === "list" ? "w-64 flex-shrink-0" : "aspect-video"} bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg overflow-hidden`}
                    >
                      {/* Video Thumbnail */}
                      {item.video_url ? (
                        <div className="relative w-full h-full">
                          <video
                            src={item.video_url}
                            className="w-full h-full object-cover"
                            muted
                          />
                          <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => handleVideoPlay(item)}
                              className="backdrop-blur-sm"
                            >
                              <Play className="w-4 h-4 mr-1" />
                              Play
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-center">
                            {item.status === "processing" ? (
                              <Activity className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
                            ) : (
                              <Video className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                            )}
                            <p className="text-sm text-gray-600 capitalize">
                              {item.status}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Processing Overlay */}
                      {item.status !== "completed" && (
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                          <div className="flex items-center justify-between text-white text-sm">
                            <span className="capitalize">{item.status}</span>
                            <span>{item.progress}%</span>
                          </div>
                          <div className="w-full h-1 bg-white/30 rounded-full mt-1 overflow-hidden">
                            <motion.div
                              className="h-full bg-white rounded-full"
                              initial={{ width: 0 }}
                              animate={{ width: `${item.progress}%` }}
                              transition={{ duration: 0.5 }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Video Badge */}
                      <div className="absolute top-2 left-2">
                        <Badge
                          variant="secondary"
                          className="bg-black/50 text-white border-0"
                        >
                          <Video className="w-3 h-3 mr-1" />
                          Story
                        </Badge>
                      </div>
                    </div>

                    <CardContent
                      className={`${viewMode === "list" ? "flex-1" : ""} p-4`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-gray-900 truncate flex-1">
                          {item.title}
                        </h3>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {item.video_url && (
                              <>
                                <DropdownMenuItem
                                  onClick={() => handleVideoPlay(item)}
                                >
                                  <Play className="w-4 h-4 mr-2" />
                                  Play Video
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Download className="w-4 h-4 mr-2" />
                                  Download
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Share2 className="w-4 h-4 mr-2" />
                                  Share
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            <span>
                              {item.source_count} source
                              {item.source_count !== 1 ? "s" : ""}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>{item.created_at.toLocaleDateString()}</span>
                          </div>
                        </div>

                        {item.type === "artifact" && item.testimonial_name && (
                          <div className="flex items-center gap-1 text-xs">
                            <span>From: {item.testimonial_name}</span>
                          </div>
                        )}

                        {item.type === "job" && item.status !== "completed" && (
                          <div className="flex items-center gap-1 text-xs">
                            <Clock className="w-3 h-3" />
                            <span>
                              {item.status === "processing"
                                ? "Processing..."
                                : "In queue"}
                            </span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Video Preview Modal */}
      <VideoPreviewModal
        isOpen={!!selectedVideo}
        onClose={() => setSelectedVideo(null)}
        videoUrl={selectedVideo?.url || ""}
        title={selectedVideo?.title || ""}
        metadata={selectedVideo?.metadata}
      />
    </div>
  );
});

export default StoryVideos;
