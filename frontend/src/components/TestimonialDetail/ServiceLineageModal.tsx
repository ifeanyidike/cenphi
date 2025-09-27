import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ChevronRight,
  ChevronDown,
  Play,
  Download,
  Clock,
  FileText,
  Film,
  Image,
  AlertCircle,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { workspaceHub } from "@/repo/workspace_hub";
import {
  LineageResult,
  ServiceNode,
} from "@/repo/managers/service_lineage_manager";
import { observer } from "mobx-react-lite";

interface ProcessingLineageModalProps {
  isOpen: boolean;
  onClose: () => void;
  sourceContent: {
    id: string;
    type: "testimonial" | "artifact" | "clip";
    title: string;
    url?: string;
    metadata?: any;
  };
  onVideoPreview?: (videoUrl: string, title: string) => void;
  onDownload?: (url: string, filename: string) => void;
}

// Video Preview Modal Component
const VideoPreviewModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  videoUrl: string;
  title: string;
}> = ({ isOpen, onClose, videoUrl, title }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-lg overflow-hidden shadow-2xl max-w-4xl w-full max-h-[90vh]">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Film className="h-4 w-4 text-gray-600" />
            <h3 className="text-sm font-medium text-gray-900">{title}</h3>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="p-4">
          <video
            src={videoUrl}
            controls
            autoPlay
            className="w-full h-auto max-h-[60vh] bg-black rounded"
          />
        </div>
      </div>
    </div>
  );
};

const SERVICE_TYPES = {
  clipping: { label: "Clipping", icon: Film },
  story_mode_generation: { label: "Story Generation", icon: Film },
  enhancement: { label: "Enhancement", icon: Image },
  platform_optimizer: { label: "Platform Optimization", icon: ExternalLink },
  text_polishing: { label: "Text Polishing", icon: FileText },
  narration: { label: "Narration", icon: Play },
  content_generation: { label: "Content Generation", icon: FileText },
  default: { label: "Processing", icon: FileText },
};

const getServiceInfo = (processingType: string) => {
  const baseType = processingType.toLowerCase().replace(/_/g, "_");
  return (
    SERVICE_TYPES[baseType as keyof typeof SERVICE_TYPES] ||
    SERVICE_TYPES.default
  );
};

const ProcessingLineageModal: React.FC<ProcessingLineageModalProps> = ({
  isOpen,
  onClose,
  sourceContent,
  onDownload,
}) => {
  const [lineageData, setLineageData] = useState<LineageResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [previewModal, setPreviewModal] = useState<{
    isOpen: boolean;
    videoUrl: string;
    title: string;
  }>({
    isOpen: false,
    videoUrl: "",
    title: "",
  });

  useEffect(() => {
    if (isOpen && sourceContent) {
      loadLineageData();
    }
  }, [isOpen, sourceContent]);

  const loadLineageData = async () => {
    if (!sourceContent) return;

    setLoading(true);
    setError(null);

    try {
      const data = await workspaceHub.serviceLineageManager.getLineage(
        sourceContent.type,
        sourceContent.id
      );
      setLineageData(data);

      // Auto-expand first level
      if (data.service_tree.length > 0) {
        const firstLevelIds = data.service_tree.map((node) => node.id);
        setExpandedNodes(new Set(firstLevelIds));
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load processing lineage"
      );
    } finally {
      setLoading(false);
    }
  };

  const toggleExpanded = (nodeId: string) => {
    setExpandedNodes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  };

  const handlePreview = (videoUrl: string, title: string) => {
    setPreviewModal({
      isOpen: true,
      videoUrl,
      title,
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderServiceNode = (
    node: ServiceNode,
    level: number = 0
  ): React.ReactNode => {
    const serviceInfo = getServiceInfo(node.processing_type);
    const Icon = serviceInfo.icon;
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodes.has(node.id);

    return (
      <div key={node.id} className={`${level > 0 ? "ml-6" : ""}`}>
        <div className="relative">
          {/* Connection Lines */}
          {level > 0 && (
            <>
              <div className="absolute -left-4 top-5 w-4 h-px bg-gray-300" />
              <div className="absolute -left-4 top-0 bottom-0 w-px bg-gray-300" />
            </>
          )}

          <Card className="mb-3 border border-gray-200 hover:border-gray-300 transition-colors bg-white">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                {/* Expand Button */}
                {hasChildren && (
                  <button
                    onClick={() => toggleExpanded(node.id)}
                    className="mt-0.5 p-1 hover:bg-gray-100 rounded transition-colors"
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-3 w-3 text-gray-600" />
                    ) : (
                      <ChevronRight className="h-3 w-3 text-gray-600" />
                    )}
                  </button>
                )}

                {/* Service Icon */}
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Icon className="h-4 w-4 text-gray-600" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">
                        {serviceInfo.label}
                      </h4>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDate(node.created_at)}
                        </span>
                        {node.asset_url && (
                          <Badge variant="outline" className="h-5 px-2 text-xs">
                            Media
                          </Badge>
                        )}
                        {node.text_content && (
                          <Badge variant="outline" className="h-5 px-2 text-xs">
                            Text
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      {node.asset_url && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0"
                          onClick={() =>
                            handlePreview(node.asset_url!, serviceInfo.label)
                          }
                        >
                          <Play className="h-3 w-3" />
                        </Button>
                      )}
                      {(node.asset_url || node.text_content) && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0"
                          onClick={() => {
                            if (onDownload && node.asset_url) {
                              const filename = `${serviceInfo.label.toLowerCase().replace(/\s+/g, "_")}.${
                                node.asset_url.split(".").pop() || "mp4"
                              }`;
                              onDownload(node.asset_url, filename);
                            }
                          }}
                        >
                          <Download className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Content Preview */}
                  {node.text_content && (
                    <div className="bg-gray-50 rounded p-3 mt-2">
                      <p className="text-xs text-gray-700 line-clamp-2">
                        {node.text_content.slice(0, 150)}
                        {node.text_content.length > 150 ? "..." : ""}
                      </p>
                    </div>
                  )}

                  {/* Children Count */}
                  {hasChildren && (
                    <div className="mt-2 text-xs text-gray-500">
                      {node.children.length} derivative
                      {node.children.length !== 1 ? "s" : ""}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Children */}
        <AnimatePresence>
          {hasChildren && isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              {node.children.map((child) =>
                renderServiceNode(child, level + 1)
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">
                  Processing Lineage
                </h3>
                <p className="text-xs text-gray-600 mt-1">
                  Content derivatives for: {sourceContent.title}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {lineageData && (
                  <div className="text-right text-xs text-gray-500">
                    <div>
                      {lineageData?.applied_services?.length} services applied
                    </div>
                    <div>
                      {lineageData?.service_tree.length} processing steps
                    </div>
                  </div>
                )}
                <Button variant="ghost" size="sm" onClick={onClose}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Loader2 className="w-6 h-6 text-gray-400 animate-spin mx-auto mb-3" />
                  <p className="text-sm text-gray-600">
                    Loading processing lineage...
                  </p>
                </div>
              </div>
            ) : error ? (
              <div className="py-4">
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="text-sm">{error}</div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-2"
                      onClick={loadLineageData}
                    >
                      Retry
                    </Button>
                  </AlertDescription>
                </Alert>
              </div>
            ) : !lineageData || lineageData.service_tree.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <FileText className="h-6 w-6 text-gray-400" />
                </div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">
                  No Processing History
                </h4>
                <p className="text-xs text-gray-600 max-w-sm mx-auto leading-relaxed">
                  This content hasn't been processed further yet. Apply services
                  to create derivatives.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-4"
                  onClick={onClose}
                >
                  Close
                </Button>
              </div>
            ) : (
              <div>
                {/* Summary */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {lineageData.service_tree.length} processing step
                        {lineageData.service_tree.length !== 1 ? "s" : ""}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        Services:{" "}
                        {lineageData.applied_services.join(", ") || "None"}
                      </div>
                    </div>
                    {lineageData.available_services.length > 0 && (
                      <Badge variant="outline" className="text-xs">
                        {lineageData.available_services.length} more available
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Service Tree */}
                <div className="space-y-0">
                  {lineageData.service_tree.map((node) =>
                    renderServiceNode(node, 0)
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-3 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between text-xs text-gray-600">
              <span>Use preview buttons to view processed content</span>
              <Button size="sm" variant="ghost" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Video Preview Modal */}
      <VideoPreviewModal
        isOpen={previewModal.isOpen}
        onClose={() =>
          setPreviewModal({ isOpen: false, videoUrl: "", title: "" })
        }
        videoUrl={previewModal.videoUrl}
        title={previewModal.title}
      />
    </>
  );
};

export default observer(ProcessingLineageModal);
