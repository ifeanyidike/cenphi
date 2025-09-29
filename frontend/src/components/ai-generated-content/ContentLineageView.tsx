// components/ai-generated-content/ContentLineageView.tsx
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight,
  ChevronDown,
  Users,
  Edit,
  Download,
  Copy,
  Check,
  Target,
  Clock,
  Video,
  Play,
  Calendar,
  Share2,
  GitBranch,
  ArrowRight,
  FileText
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

import { EnhancedArtifact } from "./ContentCategorization";
import { formatDistanceToNow } from "date-fns";

interface ContentLineageViewProps {
  artifacts: EnhancedArtifact[];
  onEdit: (artifact: EnhancedArtifact) => void;
  onPreview: (artifact: EnhancedArtifact) => void;
  onCopy: (content: string, artifactId: string) => void;
  onDownload: (content: string, filename: string) => void;
  onVideoPlay: (artifact: EnhancedArtifact) => void;
  onShare?: (artifact: EnhancedArtifact) => void;
  copiedItems: Set<string>;
  viewMode: 'tree' | 'timeline';
}

interface LineageNode {
  artifact: EnhancedArtifact;
  children: LineageNode[];
  level: number;
}

const ContentLineageView: React.FC<ContentLineageViewProps> = ({
  artifacts,
  onEdit,
  onCopy,
  onDownload,
  onVideoPlay,
  onShare,
  copiedItems,
  viewMode
}) => {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  // Build lineage tree structure for tree view
  const buildLineageTree = (): LineageNode[] => {
    const nodeMap = new Map<string, LineageNode>();
    const rootNodes: LineageNode[] = [];

    // Create nodes for all artifacts
    artifacts.forEach(artifact => {
      nodeMap.set(artifact.id, {
        artifact,
        children: [],
        level: artifact.lineage.level
      });
    });

    // Build parent-child relationships
    artifacts.forEach(artifact => {
      const node = nodeMap.get(artifact.id)!;

      if (artifact.lineage.parentId && nodeMap.has(artifact.lineage.parentId)) {
        const parentNode = nodeMap.get(artifact.lineage.parentId)!;
        parentNode.children.push(node);
      } else {
        rootNodes.push(node);
      }
    });

    // Sort by creation date
    const sortByDate = (a: LineageNode, b: LineageNode) =>
      new Date(b.artifact.created_at).getTime() - new Date(a.artifact.created_at).getTime();

    rootNodes.sort(sortByDate);
    nodeMap.forEach(node => node.children.sort(sortByDate));

    return rootNodes;
  };

  // Group artifacts by date for timeline view
  const groupArtifactsByDate = () => {
    const grouped = new Map<string, EnhancedArtifact[]>();

    artifacts
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .forEach(artifact => {
        const date = new Date(artifact.created_at).toDateString();
        if (!grouped.has(date)) {
          grouped.set(date, []);
        }
        grouped.get(date)!.push(artifact);
      });

    return Array.from(grouped.entries()).map(([date, artifacts]) => ({
      date,
      artifacts,
      dateObj: new Date(date)
    }));
  };

  const toggleNode = (nodeId: string) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  };

  const hasVideo = (artifact: EnhancedArtifact) => {
    return !!artifact.asset_url || artifact.category.id.includes('video');
  };

  const getArtifactIcon = (artifact: EnhancedArtifact) => {
    if (hasVideo(artifact)) return Video;
    if (artifact.category.id.includes('text')) return FileText;
    return artifact.category.icon;
  };

  // Render action buttons for artifacts
  const renderActionButtons = (artifact: EnhancedArtifact) => (
    <div className="flex items-center gap-1">
      {onShare && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onShare(artifact)}
              className="h-7 w-7 p-0 hover:bg-blue-100"
            >
              <Share2 className="h-3 w-3 text-blue-600" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Share content</TooltipContent>
        </Tooltip>
      )}

      {hasVideo(artifact) && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onVideoPlay(artifact)}
              className="h-7 w-7 p-0 hover:bg-green-100"
            >
              <Play className="h-3 w-3 text-green-600" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Play video</TooltipContent>
        </Tooltip>
      )}

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(artifact)}
            className="h-7 w-7 p-0 hover:bg-gray-100"
          >
            <Edit className="h-3 w-3" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Edit content</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onCopy(artifact.text_content || '', artifact.id)}
            className="h-7 w-7 p-0 hover:bg-gray-100"
          >
            {copiedItems.has(artifact.id) ? (
              <Check className="h-3 w-3 text-green-600" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>Copy to clipboard</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDownload(
              artifact.text_content || '',
              `${artifact.category.label}-${Date.now()}.txt`
            )}
            className="h-7 w-7 p-0 hover:bg-gray-100"
          >
            <Download className="h-3 w-3" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Download</TooltipContent>
      </Tooltip>
    </div>
  );

  // Tree view component
  const TreeNodeComponent: React.FC<{
    node: LineageNode;
    depth: number;
    isLast: boolean;
    parentConnections: boolean[];
  }> = ({ node, depth, isLast, parentConnections }) => {
    const { artifact } = node;
    const hasChildren = node.children.length > 0;
    const isExpanded = expandedNodes.has(artifact.id);
    const Icon = getArtifactIcon(artifact);

    return (
      <div className="relative">
        {/* Connection lines */}
        {depth > 0 && (
          <div className="absolute left-0 top-0 bottom-0 flex">
            {parentConnections.map((hasConnection, index) => (
              <div key={index} className="w-6 flex justify-center">
                {hasConnection && (
                  <div className="w-px bg-gray-300 h-full" />
                )}
              </div>
            ))}
            <div className="w-6 flex justify-center">
              <div className="w-px bg-gray-300 h-1/2" />
            </div>
          </div>
        )}

        {/* Horizontal connection */}
        {depth > 0 && (
          <div
            className="absolute top-1/2 bg-gray-300 h-px"
            style={{
              left: `${depth * 24 - 12}px`,
              width: '12px'
            }}
          />
        )}

        {/* Node content */}
        <motion.div
          className={`ml-${depth * 6} mb-3`}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="group hover:shadow-md transition-all duration-200 border border-gray-200 hover:border-gray-300 bg-white">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {/* Expand/collapse button */}
                  {hasChildren ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleNode(artifact.id)}
                      className="h-6 w-6 p-0 hover:bg-gray-200 flex-shrink-0"
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-3 w-3" />
                      ) : (
                        <ChevronRight className="h-3 w-3" />
                      )}
                    </Button>
                  ) : (
                    <div className="w-6 flex justify-center">
                      <GitBranch className="h-3 w-3 text-gray-400" />
                    </div>
                  )}

                  {/* Artifact icon */}
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${artifact.category.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>

                  {/* Artifact details */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        {artifact.processing_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </h4>
                      {artifact.platformTarget && (
                        <Badge variant="outline" className="text-xs">
                          <Target className="h-2.5 w-2.5 mr-1" />
                          {artifact.platformTarget.name}
                        </Badge>
                      )}
                      {hasVideo(artifact) && (
                        <Badge className="text-xs bg-red-100 text-red-700 border-red-200">
                          <Video className="h-2.5 w-2.5 mr-1" />
                          Video
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Clock className="h-2.5 w-2.5" />
                      {formatDistanceToNow(new Date(artifact.created_at), { addSuffix: true })}

                      {artifact.sourceTestimonials.length > 0 && (
                        <>
                          <span>•</span>
                          <Users className="h-2.5 w-2.5" />
                          {artifact.sourceTestimonials.length} source{artifact.sourceTestimonials.length !== 1 ? 's' : ''}
                        </>
                      )}

                      <span>•</span>
                      <Badge variant="secondary" className="text-xs">
                        Level {artifact.lineage.level}
                      </Badge>
                    </div>

                    {/* Content preview */}
                    {artifact.text_content && (
                      <p className="text-xs text-gray-600 mt-2 line-clamp-2">
                        {artifact.text_content.length > 100
                          ? `${artifact.text_content.substring(0, 100)}...`
                          : artifact.text_content}
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  {renderActionButtons(artifact)}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Children */}
        {hasChildren && isExpanded && (
          <AnimatePresence>
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="space-y-0">
                {node.children.map((childNode, index) => (
                  <TreeNodeComponent
                    key={childNode.artifact.id}
                    node={childNode}
                    depth={depth + 1}
                    isLast={index === node.children.length - 1}
                    parentConnections={[...parentConnections, !isLast]}
                  />
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    );
  };

  // Timeline view component
  const TimelineView = () => {
    const groupedArtifacts = groupArtifactsByDate();

    return (
      <div className="space-y-8">
        {groupedArtifacts.map(({ date, artifacts, dateObj }, groupIndex) => (
          <motion.div
            key={date}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: groupIndex * 0.1 }}
            className="relative"
          >
            {/* Timeline line */}
            {groupIndex > 0 && (
              <div className="absolute left-6 top-0 w-px h-8 bg-gradient-to-b from-gray-300 to-transparent -mt-8" />
            )}

            {/* Date header */}
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                <Calendar className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {dateObj.toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </h3>
                <p className="text-sm text-gray-600">
                  {artifacts.length} item{artifacts.length !== 1 ? 's' : ''} created
                </p>
              </div>
            </div>

            {/* Artifacts for this date */}
            <div className="ml-16 space-y-4">
              {artifacts.map((artifact, index) => {
                const Icon = getArtifactIcon(artifact);

                return (
                  <motion.div
                    key={artifact.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <Card className="group hover:shadow-lg transition-all duration-200 border border-gray-200 hover:border-blue-300 bg-white relative overflow-hidden">
                      {/* Video thumbnail overlay */}
                      {hasVideo(artifact) && artifact.asset_url && (
                        <div className="relative aspect-video bg-gray-900 overflow-hidden">
                          <video
                            src={artifact.asset_url}
                            className="w-full h-full object-cover"
                            muted
                            poster={artifact.data?.thumbnail_url}
                          />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              size="sm"
                              onClick={() => onVideoPlay(artifact)}
                              className="bg-white text-black hover:bg-gray-100 h-10 px-4 text-sm font-medium shadow-lg"
                            >
                              <Play className="h-4 w-4 mr-2" />
                              Play Video
                            </Button>
                          </div>
                          <div className="absolute top-3 left-3">
                            <Badge className="bg-black/60 text-white border-0 text-xs">
                              <Video className="h-3 w-3 mr-1" />
                              {artifact.category.label}
                            </Badge>
                          </div>
                          <div className="absolute top-3 right-3">
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                              {renderActionButtons(artifact)}
                            </div>
                          </div>
                        </div>
                      )}

                      <CardContent className={hasVideo(artifact) && artifact.asset_url ? "p-5" : "p-5"}>
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-4 min-w-0 flex-1">
                            {/* Timeline indicator */}
                            <div className="flex flex-col items-center">
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${artifact.category.color}`}>
                                <Icon className="h-4 w-4" />
                              </div>
                              {index < artifacts.length - 1 && (
                                <div className="w-px h-8 bg-gray-200 mt-2" />
                              )}
                            </div>

                            {/* Content */}
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="text-base font-medium text-gray-900">
                                  {artifact.processing_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                </h4>
                                {artifact.platformTarget && (
                                  <Badge variant="outline" className="text-xs">
                                    <Target className="h-2.5 w-2.5 mr-1" />
                                    {artifact.platformTarget.name}
                                  </Badge>
                                )}
                                <Badge variant="secondary" className="text-xs">
                                  Level {artifact.lineage.level}
                                </Badge>
                              </div>

                              <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                                <Clock className="h-3 w-3" />
                                {new Date(artifact.created_at).toLocaleTimeString('en-US', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}

                                {artifact.sourceTestimonials.length > 0 && (
                                  <>
                                    <ArrowRight className="h-3 w-3" />
                                    <Users className="h-3 w-3" />
                                    {artifact.sourceTestimonials.length} source{artifact.sourceTestimonials.length !== 1 ? 's' : ''}
                                  </>
                                )}
                              </div>

                              {/* Content preview */}
                              {artifact.text_content && (
                                <div className="bg-gray-50 rounded-lg p-3 border">
                                  <p className="text-sm text-gray-700 leading-relaxed line-clamp-3">
                                    {artifact.text_content.length > 200
                                      ? `${artifact.text_content.substring(0, 200)}...`
                                      : artifact.text_content}
                                  </p>
                                  {artifact.text_content.length > 200 && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => onEdit(artifact)}
                                      className="h-6 px-0 text-xs text-blue-600 hover:text-blue-700 mt-2 font-medium"
                                    >
                                      Read more →
                                    </Button>
                                  )}
                                </div>
                              )}

                              {/* Source testimonials */}
                              {artifact.sourceTestimonials.length > 0 && (
                                <div className="mt-3 pt-3 border-t border-gray-100">
                                  <p className="text-xs font-medium text-gray-600 mb-2">Source Testimonials</p>
                                  <div className="flex flex-wrap gap-1">
                                    {artifact.sourceTestimonials.slice(0, 3).map((testimonial) => (
                                      <Badge
                                        key={testimonial.id}
                                        variant="outline"
                                        className="text-xs bg-white border-gray-300 text-gray-600"
                                      >
                                        <Users className="h-2.5 w-2.5 mr-1" />
                                        {testimonial.author_name || "Unknown"}
                                      </Badge>
                                    ))}
                                    {artifact.sourceTestimonials.length > 3 && (
                                      <Badge variant="secondary" className="text-xs">
                                        +{artifact.sourceTestimonials.length - 3} more
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Actions - only show if no video overlay */}
                          {!(hasVideo(artifact) && artifact.asset_url) && (
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity ml-4">
                              {renderActionButtons(artifact)}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        ))}
      </div>
    );
  };

  if (artifacts.length === 0) {
    return (
      <Card className="border-dashed border-2 border-gray-300 bg-gray-50">
        <CardContent className="p-12 text-center">
          <GitBranch className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Content Found</h3>
          <p className="text-gray-600">
            No AI-generated content matches your current filters.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <TooltipProvider>
      {viewMode === 'timeline' ? (
        <TimelineView />
      ) : (
        <div className="space-y-4">
          {buildLineageTree().map((rootNode) => (
            <TreeNodeComponent
              key={rootNode.artifact.id}
              node={rootNode}
              depth={0}
              isLast={true}
              parentConnections={[]}
            />
          ))}
        </div>
      )}
    </TooltipProvider>
  );
};

export default ContentLineageView;