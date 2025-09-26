// components/ai-studio/JobMonitor.tsx
import React, { useState, useMemo } from "react";
import { ProcessingJob, StreamingResult } from "@/types/ai-service";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
  Download,
  FileText,
  Sparkles,
  Scissors,
  Target,
  Volume2,
  VolumeX,
  Eye,
  Activity,
  Calendar,
  Timer,
  Video,
  ArrowUpRight,
  Database,
  FileCheck,
  PlayCircle,
  Settings,
  Brain,
  MoreHorizontal,
  SortDesc,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import MarkdownRenderer from "./MarkdownRenderer";
import { format } from "date-fns";
import { observer } from "mobx-react-lite";
import { CONTENT_GENERATION_TYPES } from "./definitions";
import { aiStudioManager } from "@/repo/managers/ai_studio_manager";

interface JobMonitorProps {
  jobs: ProcessingJob[];
  streamingResults: Record<string, StreamingResult>;
  onViewTestimonial?: (testimonialId: string) => void;
  onViewArtifact?: (artifactId: string) => void;
  onDownloadResult?: (url: string, filename: string) => void;
  onRetryJob?: (jobId: string) => void;
  onCancelJob?: (jobId: string) => void;
}

const JobMonitor: React.FC<JobMonitorProps> = ({
  jobs,
  streamingResults,
  onViewTestimonial,
  onViewArtifact: _onViewArtifact,
  onDownloadResult,
  onRetryJob,
  onCancelJob: _onCancelJob,
}) => {
  const [selectedTab, setSelectedTab] = useState("all");
  const [expandedJobs, setExpandedJobs] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<"recent" | "status" | "service">(
    "recent"
  );

  // Enhanced service configuration
  const serviceConfig = {
    enhancement: {
      icon: Sparkles,
      name: "Media Enhancement",
      color: "from-purple-500 to-pink-500",
      description: "AI-powered video and audio enhancement",
      category: "media",
    },
    story_mode: {
      icon: Video,
      name: "Story Video",
      color: "from-blue-500 to-indigo-500",
      description: "Narrative video creation with transitions",
      category: "media",
    },
    clipping: {
      icon: Scissors,
      name: "Smart Clipping",
      color: "from-orange-500 to-red-500",
      description: "Extract impactful moments automatically",
      category: "media",
    },
    platform_optimizer: {
      icon: Target,
      name: "Platform Optimizer",
      color: "from-green-500 to-emerald-500",
      description: "Optimize for social media platforms",
      category: "optimization",
    },
    noise_removal: {
      icon: VolumeX,
      name: "Noise Removal",
      color: "from-indigo-500 to-purple-500",
      description: "Remove background noise intelligently",
      category: "media",
    },
    content_generation: {
      icon: Brain,
      name: "Content Generation",
      color: "from-pink-500 to-rose-500",
      description: "Generate marketing content from testimonials",
      category: "content",
    },
    text_polishing: {
      icon: FileText,
      name: "Text Enhancement",
      color: "from-violet-500 to-purple-500",
      description: "Polish and improve written content",
      category: "content",
    },
    translation: {
      icon: FileText,
      name: "Translation",
      color: "from-teal-500 to-cyan-500",
      description: "Translate to multiple languages",
      category: "content",
    },
    narration: {
      icon: Volume2,
      name: "AI Narration",
      color: "from-cyan-500 to-blue-500",
      description: "Convert text to natural speech",
      category: "content",
    },
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "completed":
        return {
          icon: CheckCircle2,
          color: "text-emerald-600",
          bg: "bg-emerald-50",
          border: "border-emerald-200",
          label: "Completed",
        };
      case "failed":
        return {
          icon: AlertCircle,
          color: "text-red-600",
          bg: "bg-red-50",
          border: "border-red-200",
          label: "Failed",
        };
      case "processing":
        return {
          icon: Loader2,
          color: "text-blue-600",
          bg: "bg-blue-50",
          border: "border-blue-200",
          label: "Processing",
        };
      case "streaming":
        return {
          icon: Activity,
          color: "text-indigo-600",
          bg: "bg-indigo-50",
          border: "border-indigo-200",
          label: "Streaming",
        };
      default:
        return {
          icon: Clock,
          color: "text-amber-600",
          bg: "bg-amber-50",
          border: "border-amber-200",
          label: "Queued",
        };
    }
  };

  const filteredJobs = useMemo(() => {
    let filtered = jobs;

    if (selectedTab !== "all") {
      filtered = jobs.filter((job) => {
        if (selectedTab === "active")
          return ["processing", "streaming", "queued"].includes(job.status);
        if (selectedTab === "completed") return job.status === "completed";
        if (selectedTab === "failed") return job.status === "failed";
        return true;
      });
    }

    // Fix: Create a copy before sorting to avoid MobX mutation error
    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "recent":
          return b.startTime.getTime() - a.startTime.getTime();
        case "status":
          const statusOrder = [
            "processing",
            "streaming",
            "queued",
            "completed",
            "failed",
          ];
          return statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status);
        case "service":
          return (
            serviceConfig[a.service as keyof typeof serviceConfig]?.name ||
            a.service
          ).localeCompare(
            serviceConfig[b.service as keyof typeof serviceConfig]?.name ||
              b.service
          );
        default:
          return 0;
      }
    });
  }, [jobs, selectedTab, sortBy]); // Add missing dependencies

  const toggleJobExpansion = (jobId: string) => {
    const newExpanded = new Set(expandedJobs);
    if (newExpanded.has(jobId)) {
      newExpanded.delete(jobId);
    } else {
      newExpanded.add(jobId);
    }
    setExpandedJobs(newExpanded);
  };

  const renderJobResult = (job: ProcessingJob) => {
    if (!job.result) return null;
    console.log("job", job);

    if (job.result.type === "video" || job.result.type === "audio") {
      return (
        <div className="space-y-4">
          <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg overflow-hidden relative group border-2 border-dashed border-gray-300">
            {/* Video Icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <Video className="w-8 h-8 text-blue-600" />
              </div>
            </div>

            {/* Metadata Overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
              <div className="flex justify-between items-end text-white text-sm">
                <div>
                  <div className="font-medium truncate">Processed Video</div>
                  <div className="text-xs opacity-90">
                    {job.result.format || "MP4"}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">
                    {job.result.duration || "Unknown"}
                  </div>
                  <div className="text-xs opacity-90">
                    {job.result.size || ""}
                  </div>
                </div>
              </div>
            </div>

            {/* Hover Preview Button */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
              <Button
                size="sm"
                variant="secondary"
                className="backdrop-blur-sm"
              >
                <PlayCircle className="w-4 h-4 mr-1" />
                Preview
              </Button>
            </div>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-1">
              <div className="text-gray-500">Format</div>
              <div className="font-medium">{job.result.format || "MP4"}</div>
            </div>
            <div className="space-y-1">
              <div className="text-gray-500">Duration</div>
              <div className="font-medium">
                {job.result.duration || "Unknown"}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-gray-500">Quality</div>
              <div className="font-medium">{job.result.quality || "HD"}</div>
            </div>
            <div className="space-y-1">
              <div className="text-gray-500">Size</div>
              <div className="font-medium">{job.result.size || "Unknown"}</div>
            </div>
          </div>
        </div>
      );
    }

    if (
      (job.result.type === "text" || job.result.type === "markdown") &&
      job.result.content
    ) {
      return (
        <MarkdownRenderer
          content={job.result.content}
          isComplete={true}
          jobId={job.id}
          // showActions={true}
        />
      );
    }

    return (
      <div className="text-center py-8 text-gray-500">
        <FileCheck className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p>Results available - click to view details</p>
      </div>
    );
  };

  const formatDuration = (startTime: Date, endTime?: Date) => {
    if (!endTime) return "Processing...";
    const duration = endTime.getTime() - startTime.getTime();
    const seconds = Math.floor(duration / 1000);
    const minutes = Math.floor(seconds / 60);
    return minutes > 0 ? `${minutes}m ${seconds % 60}s` : `${seconds}s`;
  };

  if (jobs.length === 0) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="p-12 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Activity className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No Processing Jobs
          </h3>
          <p className="text-gray-600 max-w-md mx-auto">
            Start processing your testimonials with AI services to see job
            progress and results here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Processing Monitor
          </h2>
          <p className="text-gray-600 text-sm mt-1">
            Track AI processing jobs and view results
          </p>
        </div>

        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9">
                <SortDesc className="w-4 h-4 mr-2" />
                Sort by {sortBy}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setSortBy("recent")}>
                <Clock className="w-4 h-4 mr-2" />
                Recent
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy("status")}>
                <Activity className="w-4 h-4 mr-2" />
                Status
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy("service")}>
                <Settings className="w-4 h-4 mr-2" />
                Service
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Filter Tabs */}
      <Tabs
        value={selectedTab}
        onValueChange={setSelectedTab}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-4 bg-gray-50">
          <TabsTrigger value="all" className="data-[state=active]:bg-white">
            All ({jobs.length})
          </TabsTrigger>
          <TabsTrigger value="active" className="data-[state=active]:bg-white">
            Active (
            {
              jobs.filter((j) =>
                ["processing", "streaming", "queued"].includes(j.status)
              ).length
            }
            )
          </TabsTrigger>
          <TabsTrigger
            value="completed"
            className="data-[state=active]:bg-white"
          >
            Completed ({jobs.filter((j) => j.status === "completed").length})
          </TabsTrigger>
          <TabsTrigger value="failed" className="data-[state=active]:bg-white">
            Failed ({jobs.filter((j) => j.status === "failed").length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={selectedTab} className="mt-6">
          <div className="space-y-4">
            <AnimatePresence>
              {filteredJobs.map((job, index) => {
                const service =
                  serviceConfig[job.service as keyof typeof serviceConfig];

                const statusConfig = getStatusConfig(job.status);
                const isExpanded = expandedJobs.has(job.id);

                const streamingResult = streamingResults[job.id];
                const hasStreamingContent =
                  streamingResult &&
                  (streamingResult.isStreaming || streamingResult.content);
                const hasCompletedStreamingContent =
                  job.status === "completed" && job.result?.content;
                const shouldShowStreamingSection =
                  hasStreamingContent || hasCompletedStreamingContent;

                const StatusIcon = statusConfig.icon;
                const ServiceIcon = service?.icon || FileText;

                console.log("job processed", job);

                return (
                  <motion.div
                    key={job.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="border border-gray-200 hover:border-gray-300 transition-all duration-200 overflow-hidden">
                      {/* Main Job Header */}
                      <CardHeader className="pb-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-4 flex-1">
                            {/* Service Icon */}
                            <div
                              className={`w-12 h-12 rounded-xl bg-gradient-to-br ${service?.color || "from-gray-400 to-gray-500"} flex items-center justify-center shadow-sm`}
                            >
                              <ServiceIcon className="w-6 h-6 text-white" />
                            </div>

                            {/* Job Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="font-semibold text-gray-900 truncate">
                                  {service?.name || job.service}{" "}
                                  {(job.metadata?.content_type &&
                                    "- " +
                                      CONTENT_GENERATION_TYPES.find(
                                        (c) =>
                                          c.id === job.metadata?.content_type
                                      )?.name) ||
                                    job.metadata?.content_type}
                                </h3>
                                <Badge
                                  variant="secondary"
                                  className={`${statusConfig.bg} ${statusConfig.color} ${statusConfig.border} border`}
                                >
                                  <StatusIcon
                                    className={`w-3 h-3 mr-1 ${job.status === "processing" ? "animate-spin" : ""}`}
                                  />
                                  {statusConfig.label}
                                </Badge>
                              </div>

                              <p className="text-sm text-gray-600 mb-3">
                                {service?.description ||
                                  "Processing testimonial content"}
                              </p>

                              {/* Job Details */}
                              <div className="flex items-center gap-6 text-xs text-gray-500">
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  <span>
                                    {format(job.startTime, "MMM d, h:mm a")}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Timer className="w-3 h-3" />
                                  <span>
                                    {formatDuration(job.startTime, job.endTime)}
                                  </span>
                                </div>
                                {job.testimonialIds && (
                                  <div className="flex items-center gap-1">
                                    <Database className="w-3 h-3" />
                                    <span>
                                      {job.testimonialIds.length} source
                                      {job.testimonialIds.length !== 1
                                        ? "s"
                                        : ""}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2">
                            {job.status === "completed" && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => toggleJobExpansion(job.id)}
                              >
                                {isExpanded ? "Less" : "Details"}
                              </Button>
                            )}

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => onViewTestimonial?.(job.id)}
                                >
                                  <Eye className="w-4 h-4 mr-2" />
                                  View Source
                                </DropdownMenuItem>

                                {job.status === "failed" && onRetryJob && (
                                  <DropdownMenuItem
                                    onClick={() => onRetryJob(job.id)}
                                  >
                                    <Loader2 className="w-4 h-4 mr-2" />
                                    Retry
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        {(job.status === "processing" ||
                          job.status === "streaming") && (
                          <div className="mt-4">
                            <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                              <span>Progress</span>
                              <span>{job.progress || 0}%</span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                              <motion.div
                                className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
                                initial={{ width: 0 }}
                                animate={{ width: `${job.progress || 0}%` }}
                                transition={{ duration: 0.5 }}
                              />
                            </div>
                          </div>
                        )}
                      </CardHeader>

                      {/* Streaming Content */}
                      {shouldShowStreamingSection && (
                        <CardContent className="pt-0">
                          <div className="border border-gray-200 rounded-lg overflow-hidden">
                            <div className="bg-gradient-to-r from-indigo-50 to-blue-50 px-4 py-3 border-b border-gray-200">
                              <div className="flex items-center justify-between">
                                <h4 className="text-sm font-medium text-gray-900">
                                  {streamingResult?.isStreaming
                                    ? "Live Results"
                                    : "Generated Content"}
                                </h4>
                                <div className="flex items-center gap-3">
                                  {streamingResult?.isStreaming && (
                                    <div className="flex items-center gap-2 text-xs text-indigo-600">
                                      <div className="flex gap-1">
                                        <div className="w-1 h-1 bg-indigo-500 rounded-full animate-pulse" />
                                        <div className="w-1 h-1 bg-indigo-500 rounded-full animate-pulse delay-100" />
                                        <div className="w-1 h-1 bg-indigo-500 rounded-full animate-pulse delay-200" />
                                      </div>
                                      <span>Streaming...</span>
                                    </div>
                                  )}
                                  {job.status === "completed" && (
                                    <div className="flex items-center gap-2 text-xs text-green-600">
                                      <CheckCircle2 className="w-3 h-3" />
                                      <span>Complete</span>
                                    </div>
                                  )}
                                  <div className="text-xs text-gray-500">
                                    {
                                      (
                                        streamingResult?.content ||
                                        job.result?.content ||
                                        ""
                                      ).length
                                    }{" "}
                                    chars
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* ADD THE PROGRESS INDICATOR HERE */}
                            {streamingResult?.isStreaming && (
                              <div className="px-4 py-2 bg-blue-50 border-b">
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-blue-700">
                                    Generating content...
                                  </span>
                                  <div className="flex items-center gap-2">
                                    <div className="w-32 h-1 bg-blue-200 rounded-full overflow-hidden">
                                      <motion.div
                                        className="h-full bg-blue-500 rounded-full"
                                        initial={{ width: 0 }}
                                        animate={{
                                          width: `${job.progress || 0}%`,
                                        }}
                                        transition={{ duration: 0.3 }}
                                      />
                                    </div>
                                    <span className="text-blue-600 text-xs">
                                      {job.progress || 0}%
                                    </span>
                                  </div>
                                </div>
                              </div>
                            )}

                            <div className="p-4 max-h-[700px] overflow-y-auto">
                              <MarkdownRenderer
                                content={
                                  streamingResult?.content ||
                                  job.result?.content ||
                                  "Waiting for content..."
                                }
                                isStreaming={
                                  streamingResult?.isStreaming || false
                                }
                                isComplete={job.status === "completed"}
                                jobId={job.id}
                                onSave={async (content) => {
                                  console.log("saving...");
                                  console.log("job", job);

                                  await aiStudioManager.saveArtifact(
                                    job,
                                    content, // Use the content parameter instead of streamingResult.content
                                    true
                                  );
                                }}
                                // context="jobMonitor"
                                // showActions={job.status === "completed"}
                              />
                              {streamingResult?.isStreaming && (
                                <div className="mt-2 flex items-center text-xs text-gray-500">
                                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2" />
                                  <span>Content is being generated...</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      )}

                      {/* Expanded Results */}
                      {isExpanded &&
                        job.status === "completed" &&
                        job.result && (
                          <CardContent className="pt-0">
                            <div className="border-t border-gray-100 pt-6">
                              <h4 className="text-sm font-medium text-gray-900 mb-4">
                                Processing Results
                              </h4>
                              {renderJobResult(job)}

                              {/* Action Buttons */}
                              <div className="flex items-center gap-3 mt-6 pt-4 border-t border-gray-100">
                                {job.result?.url && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      onDownloadResult?.(
                                        job.result!.url!,
                                        `${job.service}-result`
                                      )
                                    }
                                  >
                                    <Download className="w-4 h-4 mr-2" />
                                    Download
                                  </Button>
                                )}

                                {job.testimonialIds?.map((id) => (
                                  <Button
                                    key={id}
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => onViewTestimonial?.(id)}
                                  >
                                    <ArrowUpRight className="w-4 h-4 mr-2" />
                                    View Source
                                  </Button>
                                ))}
                              </div>
                            </div>
                          </CardContent>
                        )}
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default observer(JobMonitor);
